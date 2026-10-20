// Bar symmetry, as BarGrids' basebars XFCN does it (recovered by running it under emulation; tests/golden).
//
// A bar is an edge between two squares. Each mode is a set of transformations of the grid; a bar's partners are its
// images under them. Positions are doubled so every edge midpoint is an integer point: the bar to the right of
// (row, col) has its midpoint at (2*col + 2, 2*row + 1), the bar below it at (2*col + 1, 2*row + 2).

import type { BarPosition } from "./types.js";

/** The ten modes, in BarGrids' order: SYMMETRIES[n] is basebars' symmetry choice n. */
export const SYMMETRIES = [
  "none",
  "180",
  "90",
  "left-right",
  "top-bottom",
  "diagonal-slash",
  "diagonal-backslash",
  "plus",
  "x",
  "all",
] as const;

export type Symmetry = (typeof SYMMETRIES)[number];

type Point = [number, number];
type Transform = (x: number, y: number, w: number, h: number) => Point;

const identity: Transform = (x, y) => [x, y];
const rotate180: Transform = (x, y, w, h) => [w - x, h - y];
const rotate90: Transform = (x, y, w, h) => [h - y, x];
const rotate270: Transform = (x, y, w) => [y, w - x];
const leftRight: Transform = (x, y, w) => [w - x, y];
const topBottom: Transform = (x, y, w, h) => [x, h - y];
// Mirrors across a diagonal, named by the line's shape: "/" runs from bottom-left to top-right (and swaps the top-left
// and bottom-right corners), "\" runs from top-left to bottom-right.
const slash: Transform = (x, y, w, h) => [h - y, w - x];
const backslash: Transform = (x, y) => [y, x];

const TRANSFORMS: Record<Symmetry, Transform[]> = {
  none: [identity],
  "180": [identity, rotate180],
  "90": [identity, rotate90, rotate180, rotate270],
  "left-right": [identity, leftRight],
  "top-bottom": [identity, topBottom],
  "diagonal-slash": [identity, slash],
  "diagonal-backslash": [identity, backslash],
  plus: [identity, leftRight, topBottom, rotate180],
  x: [identity, slash, backslash, rotate180],
  all: [identity, rotate90, rotate180, rotate270, leftRight, topBottom, slash, backslash],
};

/** Modes that turn the grid on its side work only on square grids, as in BarGrids. */
const SQUARE_ONLY: ReadonlySet<Symmetry> = new Set(["90", "diagonal-slash", "diagonal-backslash", "x", "all"]);

/** Whether a mode can be used on a grid of this size. */
export function symmetryAllowed(mode: Symmetry, width: number, height: number): boolean {
  return width === height || !SQUARE_ONLY.has(mode);
}

/** Read a mode from its name or BarGrids number ("180", 1, "none"...); unknown values give null. */
export function toSymmetry(value: unknown): Symmetry | null {
  if (typeof value === "number") return SYMMETRIES[value] ?? null;
  if (typeof value !== "string") return null;
  const text = value.trim().toLowerCase();
  if (/^\d$/.test(text)) return SYMMETRIES[Number(text)] ?? null;
  return (SYMMETRIES as readonly string[]).includes(text) ? (text as Symmetry) : null;
}

/** Whether a bar can be placed there: not on the grid's outer edge, which the border already draws. */
export function barInside(bar: BarPosition, width: number, height: number): boolean {
  if (bar.row < 0 || bar.col < 0 || bar.row >= height || bar.col >= width) return false;
  return bar.side === "right" ? bar.col < width - 1 : bar.row < height - 1;
}

/**
 * The bar and its partners under a symmetry mode, the clicked bar first, each once. A bar lying on an axis is its own
 * partner. Throws if the mode isn't allowed on this grid size.
 */
export function symmetricBars(bar: BarPosition, mode: Symmetry, width: number, height: number): BarPosition[] {
  if (!symmetryAllowed(mode, width, height)) throw new Error(`symmetry '${mode}' needs a square grid`);
  const [x, y] = bar.side === "right" ? [2 * bar.col + 2, 2 * bar.row + 1] : [2 * bar.col + 1, 2 * bar.row + 2];
  const out: BarPosition[] = [];
  const seen = new Set<string>();
  for (const transform of TRANSFORMS[mode]) {
    const [tx, ty] = transform(x, y, 2 * width, 2 * height);
    const image: BarPosition =
      tx % 2 === 0 ? { side: "right", row: (ty - 1) / 2, col: tx / 2 - 1 } : { side: "below", row: ty / 2 - 1, col: (tx - 1) / 2 };
    const key = `${image.side}:${image.row}:${image.col}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(image);
    }
  }
  return out;
}
