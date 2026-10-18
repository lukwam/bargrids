// Reading and writing the grid part of a hexword document (hexword SPEC §3).
//
// Reading goes through the hexword library's normalize(), so the grid and the format's checks always agree. Writing
// changes only the grid keys and keeps everything else in the document as it was.

import { loads, normalize, tokenize, type Cell } from "hexword";

import { contentToken } from "./tokens.js";
import type { Square, StyleProperties } from "./types.js";

type Dict = Record<string, unknown>;

export interface GridState {
  squares: Square[][];
  solution: Square[][] | null;
  styles: Record<string, StyleProperties>;
  /** The document the grid came from, written back with only its grid keys replaced. */
  document: Dict;
  /** Styles defined or removed since reading; the others are written back exactly as they were. */
  changedStyles: Set<string>;
}

const isDict = (value: unknown): value is Dict => typeof value === "object" && value !== null && !Array.isArray(value);

const toSquare = (cell: Cell): Square => ({
  kind: cell.kind,
  across: cell.across,
  down: cell.down,
  barRight: cell.bar_right,
  barBelow: cell.bar_below,
  hiddenBarRight: cell.hidden_bar_right,
  hiddenBarBelow: cell.hidden_bar_below,
  style: cell.style,
  label: cell.label,
});

export function readHexword(input: Dict | string): GridState {
  const document = typeof input === "string" ? loads(input) : structuredClone(input);
  const model = normalize(document);
  const squares = model.grid.cells.map((row) => row.map(toSquare));
  let solution: Square[][] | null = null;
  if (model.grid.solution) {
    // The format requires the same size; fit a solution that isn't, so the model stays rectangular.
    const cells = model.grid.solution;
    solution = squares.map((row, y) => row.map((square, x) => (cells[y]?.[x] ? toSquare(cells[y][x]) : { ...square })));
  }
  return { squares, solution, styles: model.grid.styles, document, changedStyles: new Set() };
}

const kindToken = (square: Square, text: string | null): string =>
  square.kind === "block" ? "#" : square.kind === "void" ? "_" : square.kind === "empty" ? "." : contentToken(text ?? square.across!);

function gridLines(squares: Square[][], direction: "across" | "down", hidden: boolean): string[] {
  const height = squares.length;
  const width = height ? squares[0].length : 0;
  const [outer, inner] = direction === "across" ? [height, width] : [width, height];
  return Array.from({ length: outer }, (_, o) => {
    let line = "";
    for (let i = 0; i < inner; i++) {
      const square = direction === "across" ? squares[o][i] : squares[i][o];
      line += kindToken(square, direction === "across" ? square.across : square.down);
      const bar = direction === "across" ? square.barRight || (hidden && square.hiddenBarRight) : square.barBelow || (hidden && square.hiddenBarBelow);
      if (bar && i < inner - 1) line += "|";
    }
    return line;
  });
}

const maskLines = (squares: Square[][], token: (square: Square) => string | null): string[] =>
  squares.map((row) => row.map((square) => token(square) ?? "_").join(""));

/** Keep an original line where it has the same tokens as the new one, so hand-written spacing survives. */
function keepSpacing(original: unknown, lines: string[]): string[] {
  const old = Array.isArray(original) ? original : typeof original === "string" ? [original] : [];
  return lines.map((line, i) => {
    const before = old[i];
    if (typeof before !== "string") return line;
    const [a, b] = [tokenize(before), tokenize(line)];
    return a.length === b.length && a.every((token, j) => token === b[j]) ? before : line;
  });
}

export function writeHexword(state: GridState, changed: boolean): Dict {
  const document = structuredClone(state.document);
  if (!changed) return document;
  const grid: Dict = isDict(document.grid) ? { ...document.grid } : {};
  const set = (key: string, lines: string[] | null): void => {
    if (lines === null) delete grid[key];
    else grid[key] = keepSpacing(grid[key], lines);
  };
  const squares = state.squares;
  const all = (test: (square: Square) => boolean, layer = squares): boolean => layer.some((row) => row.some(test));

  set("rows", gridLines(squares, "across", false));
  set("columns", gridLines(squares, "down", false));
  set("style", all((s) => s.style !== null) ? maskLines(squares, (s) => s.style) : null);
  set("labels", all((s) => s.label !== null) ? maskLines(squares, (s) => (s.label === null ? null : contentToken(s.label))) : null);
  const hidden = all((s) => s.hiddenBarRight || s.hiddenBarBelow);
  set("entry_rows", hidden ? gridLines(squares, "across", true) : null);
  set("entry_columns", hidden ? gridLines(squares, "down", true) : null);

  const solution = state.solution;
  set("solution_rows", solution && gridLines(solution, "across", false));
  set("solution_columns", solution && gridLines(solution, "down", false));
  // The solution grid uses the puzzle's style mask unless it has its own (hexword SPEC §3.6).
  const ownStyle = solution !== null && ("solution_style" in grid || solution.some((row, y) => row.some((s, x) => s.style !== squares[y][x].style)));
  set("solution_style", ownStyle ? maskLines(solution!, (s) => s.style) : null);

  const raw = isDict(grid.styles) ? grid.styles : {};
  const styles: Dict = {};
  for (const [key, properties] of Object.entries(state.styles))
    styles[key] = key in raw && !state.changedStyles.has(key) ? raw[key] : { ...properties };
  if (Object.keys(styles).length || "styles" in grid) grid.styles = styles;

  document.grid = grid;
  return document;
}
