// The grid's data types. They follow the hexword normalized model (hexword SPEC §7), in camelCase.

/** A letter square, a block (filled-in black square), a void (no square at all) or an empty letter square. */
export type SquareKind = "cell" | "block" | "void" | "empty";

/** Which grid a change applies to: the puzzle grid, or the separate solution grid (hexword SPEC §3.6). */
export type Layer = "puzzle" | "solution";

export interface Square {
  kind: SquareKind;
  /** The square's content read across, e.g. "A" or a rebus "ING"; "." for an empty square, null for a block or void. */
  across: string | null;
  /** The content read down; usually the same as across, but misprint puzzles hold different letters. */
  down: string | null;
  /** A printed bar on the right-hand side of the square. */
  barRight: boolean;
  /** A printed bar below the square. */
  barBelow: boolean;
  /** An answer boundary that isn't printed (hexword SPEC §3.7). Kept on the puzzle grid; the solution shares it. */
  hiddenBarRight: boolean;
  hiddenBarBelow: boolean;
  /** A key into the grid's styles: circles, shading (hexword SPEC §3.4). */
  style: string | null;
  /** Text printed in the square that isn't a clue number (hexword SPEC §3.5). Kept on the puzzle grid. */
  label: string | null;
}

/** Style properties (hexword SPEC §3.4), all as text: background-color, fill, stroke, shape, opacity. */
export type StyleProperties = Record<string, string>;

/** A bar position, 0-based: the bar to the right of or below the square at (row, col). */
export interface BarPosition {
  side: "right" | "below";
  row: number;
  col: number;
}

export const blankSquare = (kind: SquareKind = "empty"): Square => ({
  kind,
  across: kind === "empty" ? "." : null,
  down: kind === "empty" ? "." : null,
  barRight: false,
  barBelow: false,
  hiddenBarRight: false,
  hiddenBarBelow: false,
  style: null,
  label: null,
});

export const copySquare = (square: Square): Square => ({ ...square });

export const isLetterSquare = (square: Square): boolean => square.kind === "cell" || square.kind === "empty";
