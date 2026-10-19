// The editor: version 1's tools on a Grid, drawn by the renderer. Pointer input picks squares and bars; keyboard
// input types letters, moves the cursor and undoes. Every change goes through grid.apply(), so undo, redo and the
// "change" event cover all of them.

import { Grid } from "../model/grid.js";
import type { Command } from "../model/commands.js";
import { symmetryAllowed, type Symmetry } from "../model/symmetry.js";
import { isLetterSquare, type Layer } from "../model/types.js";
import { renderTree, shade, type RenderOptions } from "../render/render.js";
import { el, toSvgElement, type SvgNode } from "../render/svg-tree.js";
import { hitTest } from "./hit.js";
import { toggleMark } from "./styles.js";

export const TOOLS = ["letters", "bars", "blocks", "voids", "circles", "shadedSquares", "shadedCircles"] as const;
export type Tool = (typeof TOOLS)[number];

export type Direction = "across" | "down";

export interface Cursor {
  row: number;
  col: number;
  direction: Direction;
}

export interface EditorOptions {
  /** The grid to edit, or a hexword document (object or YAML/JSON text) to read. Default: an empty 15x15 grid. */
  grid?: Grid;
  document?: Record<string, unknown> | string;
  /** Which tools are offered; the first is selected. Default: all of them. */
  tools?: readonly Tool[];
  tool?: Tool;
  symmetry?: Symmetry;
  /** Grey level for the shading tools, 0-100 (default 25). */
  shade?: number;
  /** Edit the puzzle grid or the solution grid. */
  layer?: Layer;
  /** Passed to the renderer; answers show by default, since the editor is where they're typed. */
  render?: RenderOptions;
}

export interface EditorChangeDetail {
  command: Command | null;
  reason: "apply" | "undo" | "redo";
}

const CURSOR_FILL = "#ffd54f";
const WORD_FILL = "#fff3c4";

export class Editor extends EventTarget {
  readonly grid: Grid;
  readonly element: HTMLElement;
  readonly tools: readonly Tool[];
  private _tool: Tool;
  private _symmetry: Symmetry;
  private _shade: number;
  private _layer: Layer;
  private _cursor: Cursor = { row: 0, col: 0, direction: "across" };
  /** Rebus typing: characters collect here until Enter, Escape or a move. */
  private rebus: string | null = null;
  private svg: SVGSVGElement | null = null;
  private renderOptions: RenderOptions;
  private stop: () => void;
  private document: Document;

  constructor(element: HTMLElement, options: EditorOptions = {}) {
    super();
    this.element = element;
    this.document = element.ownerDocument;
    this.grid = options.grid ?? (options.document !== undefined ? Grid.fromHexword(options.document) : Grid.create(15, 15));
    this.tools = options.tools?.length ? options.tools : TOOLS;
    this._tool = options.tool && this.tools.includes(options.tool) ? options.tool : this.tools[0];
    this._symmetry = options.symmetry ?? "none";
    this._shade = options.shade ?? 25;
    this._layer = options.layer === "solution" && this.grid.hasSolution ? "solution" : "puzzle";
    this.renderOptions = options.render ?? {};
    if (!symmetryAllowed(this._symmetry, this.grid.width, this.grid.height)) this._symmetry = "none";

    element.tabIndex = element.tabIndex >= 0 ? element.tabIndex : 0;
    element.setAttribute("role", "application");
    element.setAttribute("aria-label", "Puzzle grid editor");
    element.addEventListener("pointerdown", this.onPointerDown);
    element.addEventListener("keydown", this.onKeyDown);
    this.stop = this.grid.subscribe((event) => {
      // A resize can leave a square-only symmetry on a grid that isn't square.
      if (!symmetryAllowed(this._symmetry, this.grid.width, this.grid.height)) this.symmetry = "none";
      if (this._cursor.row >= this.grid.height || this._cursor.col >= this.grid.width) this._cursor = { ...this._cursor, row: 0, col: 0 };
      this.draw();
      this.dispatchEvent(new CustomEvent<EditorChangeDetail>("change", { detail: { command: event.command, reason: event.reason } }));
    });
    this.draw();
  }

  /** Stop listening to the element and the grid. */
  destroy(): void {
    this.element.removeEventListener("pointerdown", this.onPointerDown);
    this.element.removeEventListener("keydown", this.onKeyDown);
    this.stop();
    this.svg?.remove();
  }

  get tool(): Tool {
    return this._tool;
  }

  set tool(tool: Tool) {
    if (!this.tools.includes(tool)) throw new Error(`the '${tool}' tool isn't offered`);
    this.commitRebus();
    this._tool = tool;
    this.draw();
    this.settingsChanged();
  }

  get symmetry(): Symmetry {
    return this._symmetry;
  }

  set symmetry(mode: Symmetry) {
    if (!symmetryAllowed(mode, this.grid.width, this.grid.height)) throw new Error(`symmetry '${mode}' needs a square grid`);
    this._symmetry = mode;
    this.settingsChanged();
  }

  get shade(): number {
    return this._shade;
  }

  set shade(percent: number) {
    this._shade = Math.min(100, Math.max(0, percent));
    this.settingsChanged();
  }

  get layer(): Layer {
    return this._layer;
  }

  set layer(layer: Layer) {
    if (layer === "solution" && !this.grid.hasSolution) this.grid.apply({ type: "addSolution" });
    this._layer = layer;
    this.draw();
    this.settingsChanged();
  }

  /** Tell toolbars that the tool, symmetry, shade or layer changed. */
  private settingsChanged(): void {
    this.dispatchEvent(new CustomEvent("settings"));
  }

  get cursor(): Cursor {
    return { ...this._cursor };
  }

  /** Move the cursor (clamped to the grid). */
  setCursor(row: number, col: number, direction: Direction = this._cursor.direction): void {
    this.commitRebus();
    this._cursor = {
      row: Math.min(this.grid.height - 1, Math.max(0, row)),
      col: Math.min(this.grid.width - 1, Math.max(0, col)),
      direction,
    };
    this.draw();
  }

  /** The document as edited so far. */
  toHexword(): Record<string, unknown> {
    return this.grid.toHexword();
  }

  /** Apply a command to the grid (the change event follows). */
  apply(command: Command): boolean {
    return this.grid.apply(command);
  }

  undo(): boolean {
    this.rebus = null;
    return this.grid.undo();
  }

  redo(): boolean {
    this.rebus = null;
    return this.grid.redo();
  }

  /** What a click at (x, y), in drawing units, does with the current tool. Pointer events come here. */
  clickAt(x: number, y: number, options: { alt?: boolean } = {}): void {
    const size = this.renderOptions.size ?? 50;
    const hit = hitTest(x, y, this.grid.width, this.grid.height, size);
    if (!hit) return;
    const { row, col } = hit;
    const layer = this._layer;
    switch (this._tool) {
      case "letters": {
        const same = row === this._cursor.row && col === this._cursor.col;
        const direction = same ? (this._cursor.direction === "across" ? "down" : "across") : this._cursor.direction;
        this.setCursor(row, col, direction);
        return;
      }
      case "bars":
        if (!hit.bar) return;
        if (options.alt) {
          // Alt-click: a hidden bar, an answer boundary that isn't printed (hexword SPEC §3.7).
          const square = this.grid.square(hit.bar.row, hit.bar.col);
          const on = !(hit.bar.side === "right" ? square.hiddenBarRight : square.hiddenBarBelow);
          this.grid.apply({ type: "setBar", ...hit.bar, on, hidden: true });
        } else {
          this.grid.apply({ type: "toggleBar", ...hit.bar, symmetry: this._symmetry, layer });
        }
        return;
      case "blocks":
      case "voids": {
        const kind = this._tool === "blocks" ? "block" : "void";
        const now = this.grid.square(row, col, layer).kind;
        this.grid.apply({ type: "setKind", row, col, kind: now === kind ? "empty" : kind, layer });
        return;
      }
      case "circles":
      case "shadedSquares":
      case "shadedCircles": {
        const mark = this._tool === "circles" ? "circle" : this._tool === "shadedSquares" ? "shadedSquare" : "shadedCircle";
        const command = toggleMark(this.grid, row, col, mark, shade(this._shade), layer);
        if (command) this.grid.apply(command);
        return;
      }
    }
  }

  /** Type a character with the letters tool: fill the square and move on (or add to a rebus). */
  type(text: string): void {
    if (this.rebus !== null) {
      this.rebus += text.toUpperCase();
      this.draw();
      return;
    }
    const { row, col } = this._cursor;
    this.setContent(row, col, text.toUpperCase());
    this.advance(1);
  }

  /** Start typing several characters into the cursor's square; Enter finishes. */
  startRebus(): void {
    this.rebus = "";
    this.draw();
  }

  private commitRebus(): void {
    if (this.rebus === null) return;
    const text = this.rebus;
    this.rebus = null;
    if (text) this.setContent(this._cursor.row, this._cursor.col, text);
  }

  private setContent(row: number, col: number, text: string): void {
    const layer = this._layer;
    const square = this.grid.square(row, col, layer);
    if (!isLetterSquare(square)) return;
    this.grid.apply({ type: "setContent", row, col, across: text, layer });
  }

  /** Move along the cursor's direction, by steps (negative goes back), stopping at the edge. */
  private advance(steps: number): void {
    const { row, col, direction } = this._cursor;
    const [dr, dc] = direction === "across" ? [0, steps] : [steps, 0];
    this.setCursor(row + dr, col + dc, direction);
  }

  private backspace(): void {
    const { row, col } = this._cursor;
    const square = this.grid.square(row, col, this._layer);
    if (square.kind === "cell") {
      this.setContent(row, col, "");
      return;
    }
    this.advance(-1);
    const back = this._cursor;
    if (this.grid.square(back.row, back.col, this._layer).kind === "cell") this.setContent(back.row, back.col, "");
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (!this.svg || event.button > 0) return;
    const rect = this.svg.getBoundingClientRect();
    const [, , vw, vh] = (this.svg.getAttribute("viewBox") ?? "0 0 0 0").split(" ").map(Number);
    if (!rect.width || !rect.height) return;
    const x = ((event.clientX - rect.left) * vw) / rect.width;
    const y = ((event.clientY - rect.top) * vh) / rect.height;
    this.element.focus();
    this.clickAt(x, y, { alt: event.altKey });
    event.preventDefault();
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    const mod = event.ctrlKey || event.metaKey;
    if (mod && event.key.toLowerCase() === "z") {
      if (event.shiftKey) this.redo();
      else this.undo();
      event.preventDefault();
      return;
    }
    if (mod && event.key.toLowerCase() === "y") {
      this.redo();
      event.preventDefault();
      return;
    }
    if (mod || event.altKey) return;
    const moves: Record<string, [number, number, Direction]> = {
      ArrowLeft: [0, -1, "across"],
      ArrowRight: [0, 1, "across"],
      ArrowUp: [-1, 0, "down"],
      ArrowDown: [1, 0, "down"],
    };
    if (event.key in moves) {
      const [dr, dc, direction] = moves[event.key];
      const { row, col } = this._cursor;
      this.setCursor(row + dr, col + dc, this._tool === "letters" ? direction : this._cursor.direction);
      event.preventDefault();
      return;
    }
    if (this._tool !== "letters") return;
    if (event.key === "Enter") {
      if (this.rebus !== null) this.commitRebus();
      else this.setCursor(this._cursor.row, this._cursor.col, this._cursor.direction === "across" ? "down" : "across");
      this.draw();
    } else if (event.key === "Escape") {
      if (this.rebus === null) return;
      this.rebus = null;
      this.draw();
    } else if (event.key === "Insert") {
      this.startRebus();
    } else if (event.key === "Backspace") {
      if (this.rebus !== null) {
        this.rebus = Array.from(this.rebus).slice(0, -1).join("");
        this.draw();
      } else this.backspace();
    } else if (event.key === "Delete") {
      this.setContent(this._cursor.row, this._cursor.col, "");
    } else if (event.key === " ") {
      if (this.rebus === null) this.advance(1);
    } else if (Array.from(event.key).length === 1 && event.key.trim()) {
      this.type(event.key);
    } else return;
    event.preventDefault();
  };

  /** Redraw: the grid, then the cursor and its word underneath the letters. */
  private draw(): void {
    const tree = renderTree(this.grid, {
      ...this.renderOptions,
      layer: this._layer,
      show: { answers: true, hiddenBars: true, ...this.renderOptions.show },
    });
    if (this._tool === "letters") {
      const highlight = this.highlight();
      const at = tree.children.findIndex((child) => child.attrs.class === "bargrids-squares");
      tree.children.splice(at + 1, 0, highlight);
      if (this.rebus !== null) tree.children.push(this.rebusText());
    }
    tree.attrs["data-tool"] = this._tool;
    const svg = toSvgElement(tree, this.document) as SVGSVGElement;
    svg.style.display = "block";
    svg.style.width = "100%";
    svg.style.height = "auto";
    svg.style.touchAction = "none";
    if (this.svg && this.svg.parentNode === this.element) this.element.replaceChild(svg, this.svg);
    else this.element.appendChild(svg);
    this.svg = svg;
  }

  /** The cursor's square and the rest of its word. */
  private highlight(): SvgNode {
    const size = this.renderOptions.size ?? 50;
    const k = size / 50;
    const { row, col, direction } = this._cursor;
    const squares = this.grid.squares(this._layer);
    const rect = (r: number, c: number, fill: string) =>
      el("rect", { x: c * size + 4 * k, y: r * size + 4 * k, width: size, height: size, fill });
    const word: SvgNode[] = [];
    const barred = (r: number, c: number) =>
      direction === "across" ? squares[r][c].barRight || squares[r][c].hiddenBarRight : squares[r][c].barBelow || squares[r][c].hiddenBarBelow;
    if (isLetterSquare(squares[row][col])) {
      const [dr, dc] = direction === "across" ? [0, 1] : [1, 0];
      for (let r = row, c = col; ; r -= dr, c -= dc) {
        const pr = r - dr;
        const pc = c - dc;
        if (pr < 0 || pc < 0 || !isLetterSquare(squares[pr][pc]) || barred(pr, pc)) break;
        word.push(rect(pr, pc, WORD_FILL));
      }
      for (let r = row, c = col; !barred(r, c); ) {
        r += dr;
        c += dc;
        if (r >= this.grid.height || c >= this.grid.width || !isLetterSquare(squares[r][c])) break;
        word.push(rect(r, c, WORD_FILL));
      }
    }
    return el("g", { class: "bargrids-cursor", "data-direction": direction }, [...word, rect(row, col, CURSOR_FILL)]);
  }

  private rebusText(): SvgNode {
    const size = this.renderOptions.size ?? 50;
    const k = size / 50;
    const { row, col } = this._cursor;
    return el("text", {
      class: "bargrids-rebus", x: col * size + 4 * k + size / 2, y: (row + 1) * size + 4 * k - 4 * k,
      "text-anchor": "middle", "font-size": 10 * k, fill: "#b00020", "font-family": "Helvetica, Arial, sans-serif",
    }, [], `${this.rebus}▏`);
  }
}
