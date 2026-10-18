// The grid model: squares, bars, styles and labels, changed only through commands, with undo and redo.
// Pure TypeScript with no DOM, so a server can use it too.

import { normalize, tokenize, type Issue, type Model } from "hexword";

import type { Command } from "./commands.js";
import { readHexword, writeHexword, type GridState } from "./hexword.js";
import { barInside, symmetricBars, symmetryAllowed } from "./symmetry.js";
import { validContent } from "./tokens.js";
import {
  blankSquare,
  copySquare,
  isLetterSquare,
  type BarPosition,
  type Layer,
  type Square,
  type StyleProperties,
} from "./types.js";

export const MIN_SIZE = 2;
export const MAX_SIZE = 25;

/** A word: a run of two or more letter squares across or down (hexword SPEC §3.3). */
export interface Word {
  direction: "across" | "down";
  row: number;
  col: number;
  length: number;
  text: string;
}

export interface ChangeEvent {
  /** What happened: a command was applied, or a step was undone or redone. */
  reason: "apply" | "undo" | "redo";
  command: Command | null;
}

type Listener = (event: ChangeEvent) => void;

/** One undoable step: the parts of the state it touched, before and after. */
interface Step {
  command: Command;
  before: Partial<GridState>;
  after: Partial<GridState>;
}

const cloneSquares = (squares: Square[][]): Square[][] => squares.map((row) => row.map(copySquare));
const cloneStyles = (styles: Record<string, StyleProperties>): Record<string, StyleProperties> =>
  Object.fromEntries(Object.entries(styles).map(([key, props]) => [key, { ...props }]));

export class Grid {
  private state: GridState;
  private undoStack: Step[] = [];
  private redoStack: Step[] = [];
  private listeners = new Set<Listener>();
  private cache: Model | null = null;
  private revision = 0;

  private constructor(state: GridState) {
    this.state = state;
  }

  /** A new grid of empty letter squares. */
  static create(width: number, height: number, title = ""): Grid {
    checkSize(width, height);
    const squares = Array.from({ length: height }, () => Array.from({ length: width }, () => blankSquare()));
    const document = { format: "hexword", version: "0.1", title, grid: {} };
    return new Grid({ squares, solution: null, styles: {}, document, changedStyles: new Set() });
  }

  /** Read a hexword document: a parsed object, or YAML or JSON text. */
  static fromHexword(document: Record<string, unknown> | string): Grid {
    return new Grid(readHexword(document));
  }

  /**
   * The grid as a hexword document. Everything the grid doesn't edit (clues, settings, unknown keys) is kept as it
   * was, and grid lines whose tokens haven't changed keep their original spacing.
   */
  toHexword(): Record<string, unknown> {
    return writeHexword(this.state, this.revision > 0);
  }

  get width(): number {
    return this.state.squares[0]?.length ?? 0;
  }

  get height(): number {
    return this.state.squares.length;
  }

  get hasSolution(): boolean {
    return this.state.solution !== null;
  }

  /** A copy of the square at (row, col). Solution squares share the puzzle's labels and hidden bars. */
  square(row: number, col: number, layer: Layer = "puzzle"): Square {
    this.checkPosition(row, col);
    const puzzle = this.state.squares[row][col];
    if (layer === "puzzle") return copySquare(puzzle);
    const solution = this.layer("solution")[row][col];
    return { ...solution, label: puzzle.label, hiddenBarRight: puzzle.hiddenBarRight, hiddenBarBelow: puzzle.hiddenBarBelow };
  }

  /** All squares, [row][col], as copies. */
  squares(layer: Layer = "puzzle"): Square[][] {
    return this.state.squares.map((row, y) => row.map((_, x) => this.square(y, x, layer)));
  }

  get styles(): Record<string, StyleProperties> {
    return cloneStyles(this.state.styles);
  }

  /** The hexword normalized model of the current document: words, clue numbers and validation issues. */
  normalized(): Model {
    this.cache ??= normalize(this.toHexword());
    return this.cache;
  }

  /** The words in the puzzle grid, across first, then down, in reading order. */
  words(): Word[] {
    return this.normalized().words.map(({ direction, row, col, length, text }) => ({ direction, row, col, length, text }));
  }

  /**
   * Clue numbers, [row][col]. With clues, they're placed by linking the clues to the grid (hexword SPEC §5.4); a grid
   * without clues is numbered the usual way, every square that starts a word getting the next number.
   */
  numbers(): (string | null)[][] {
    const model = this.normalized();
    if (model.clues.some((group) => group.clues.length > 0)) return model.grid.cells.map((row) => row.map((cell) => cell.number));
    const out: (string | null)[][] = model.grid.cells.map((row) => row.map(() => null));
    const starts = new Set(model.words.map((word) => `${word.row}:${word.col}`));
    let next = 1;
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++) if (starts.has(`${y}:${x}`)) out[y][x] = String(next++);
    return out;
  }

  /** What hexword validation reports about the document (hexword SPEC §10). */
  issues(): Issue[] {
    return this.normalized().issues;
  }

  /** Listen for changes; returns a function that stops listening. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** Apply a command. Returns false (and records nothing) when it changes nothing. */
  apply(command: Command): boolean {
    const before = this.snapshot();
    try {
      this.run(command);
    } catch (error) {
      this.restore(before);
      throw error;
    }
    const after = this.snapshot();
    if (sameState(before, after)) {
      this.restore(before);
      return false;
    }
    this.undoStack.push({ command, before, after });
    this.redoStack = [];
    this.changed({ reason: "apply", command });
    return true;
  }

  undo(): boolean {
    const step = this.undoStack.pop();
    if (!step) return false;
    this.restore(step.before);
    this.redoStack.push(step);
    this.changed({ reason: "undo", command: step.command });
    return true;
  }

  redo(): boolean {
    const step = this.redoStack.pop();
    if (!step) return false;
    this.restore(step.after);
    this.undoStack.push(step);
    this.changed({ reason: "redo", command: step.command });
    return true;
  }

  private changed(event: ChangeEvent): void {
    this.revision += 1;
    this.cache = null;
    for (const listener of this.listeners) listener(event);
  }

  // Steps keep whole copies of the squares. A 25x25 grid is small, and copies can't go wrong the way patches can.
  private snapshot(): Partial<GridState> {
    return {
      squares: cloneSquares(this.state.squares),
      solution: this.state.solution && cloneSquares(this.state.solution),
      styles: cloneStyles(this.state.styles),
      changedStyles: new Set(this.state.changedStyles),
    };
  }

  private restore(saved: Partial<GridState>): void {
    this.state = {
      ...this.state,
      squares: cloneSquares(saved.squares!),
      solution: saved.solution ? cloneSquares(saved.solution) : null,
      styles: cloneStyles(saved.styles!),
      changedStyles: new Set(saved.changedStyles),
    };
  }

  private layer(layer: Layer = "puzzle"): Square[][] {
    if (layer === "puzzle") return this.state.squares;
    if (!this.state.solution) throw new Error("the grid has no solution grid; add one with addSolution");
    return this.state.solution;
  }

  private checkPosition(row: number, col: number): void {
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= this.height || col >= this.width)
      throw new RangeError(`(${row}, ${col}) is outside the ${this.width}x${this.height} grid`);
  }

  private at(row: number, col: number, layer: Layer = "puzzle"): Square {
    this.checkPosition(row, col);
    return this.layer(layer)[row][col];
  }

  private setBar(bar: BarPosition, on: boolean, hidden: boolean, layer: Layer): void {
    if (!barInside(bar, this.width, this.height)) return;
    const square = this.at(bar.row, bar.col, hidden ? "puzzle" : layer);
    if (hidden) square[bar.side === "right" ? "hiddenBarRight" : "hiddenBarBelow"] = on;
    else square[bar.side === "right" ? "barRight" : "barBelow"] = on;
  }

  private run(command: Command): void {
    switch (command.type) {
      case "setContent": {
        const square = this.at(command.row, command.col, command.layer);
        const across = command.across;
        const down = command.down ?? across;
        if (across === "" || across === ".") {
          Object.assign(square, { kind: "empty", across: ".", down: "." });
          return;
        }
        for (const text of [across, down])
          if (!validContent(text) || text === ".") throw new Error(`'${text}' can't be a square's content`);
        Object.assign(square, { kind: "cell", across, down });
        return;
      }
      case "setKind": {
        const square = this.at(command.row, command.col, command.layer);
        if (command.kind === "block" || command.kind === "void") Object.assign(square, { kind: command.kind, across: null, down: null });
        else if (command.kind === "empty" || !isLetterSquare(square) || square.across === ".")
          Object.assign(square, { kind: "empty", across: ".", down: "." });
        return;
      }
      case "setBar":
        if (command.hidden && (command.layer ?? "puzzle") !== "puzzle") throw new Error("hidden bars belong to the puzzle grid");
        this.checkPosition(command.row, command.col);
        this.setBar(command, command.on, command.hidden ?? false, command.layer ?? "puzzle");
        return;
      case "toggleBar": {
        const layer = command.layer ?? "puzzle";
        const square = this.at(command.row, command.col, layer);
        if (!barInside(command, this.width, this.height)) return;
        const mode = command.symmetry ?? "none";
        if (!symmetryAllowed(mode, this.width, this.height)) throw new Error(`symmetry '${mode}' needs a square grid`);
        // As BarGrids does: the clicked bar flips, and every partner is set to its new state (not flipped).
        const on = !(command.side === "right" ? square.barRight : square.barBelow);
        for (const bar of symmetricBars(command, mode, this.width, this.height)) this.setBar(bar, on, false, layer);
        return;
      }
      case "setStyle": {
        const square = this.at(command.row, command.col, command.layer);
        const style = command.style === "" ? null : command.style;
        if (style !== null && !(style in this.state.styles)) throw new Error(`style '${style}' isn't defined`);
        square.style = style;
        return;
      }
      case "defineStyle": {
        // A key is one grid token ("@", "[ab]"); "_" means no style and "|" is a bar.
        const tokens = tokenize(command.key);
        if (tokens.length !== 1 || tokens[0] !== command.key || ["_", "|"].includes(command.key))
          throw new Error(`'${command.key}' can't be a style key`);
        if (command.properties === null) {
          for (const layer of [this.state.squares, this.state.solution ?? []])
            for (const row of layer) for (const square of row) if (square.style === command.key) square.style = null;
          delete this.state.styles[command.key];
        } else {
          this.state.styles[command.key] = { ...command.properties };
        }
        this.state.changedStyles.add(command.key);
        return;
      }
      case "setLabel": {
        const square = this.at(command.row, command.col);
        const label = command.label === "" ? null : command.label;
        if (label !== null && !validContent(label)) throw new Error(`'${label}' can't be a label`);
        square.label = label;
        return;
      }
      case "resize": {
        checkSize(command.width, command.height);
        const fit = (squares: Square[][]): Square[][] =>
          Array.from({ length: command.height }, (_, y) =>
            Array.from({ length: command.width }, (_, x) => {
              const square = squares[y]?.[x] ? copySquare(squares[y][x]) : blankSquare();
              if (x === command.width - 1) square.barRight = square.hiddenBarRight = false;
              if (y === command.height - 1) square.barBelow = square.hiddenBarBelow = false;
              return square;
            }),
          );
        this.state.squares = fit(this.state.squares);
        if (this.state.solution) this.state.solution = fit(this.state.solution);
        return;
      }
      case "addSolution":
        this.state.solution ??= cloneSquares(this.state.squares);
        return;
      case "removeSolution":
        this.state.solution = null;
        return;
      case "batch":
        for (const each of command.commands) this.run(each);
        return;
    }
  }
}

function checkSize(width: number, height: number): void {
  for (const n of [width, height])
    if (!Number.isInteger(n) || n < MIN_SIZE || n > MAX_SIZE) throw new RangeError(`grids are ${MIN_SIZE} to ${MAX_SIZE} squares on a side`);
}

function sameState(a: Partial<GridState>, b: Partial<GridState>): boolean {
  return JSON.stringify([a.squares, a.solution, a.styles]) === JSON.stringify([b.squares, b.solution, b.styles]);
}
