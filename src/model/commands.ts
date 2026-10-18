// Every change to a grid is one of these commands, applied through Grid.apply(), so undo/redo and change events
// (and, later, collaborative editing) all go through one path. Positions are 0-based; layer defaults to "puzzle".

import type { Layer, SquareKind, StyleProperties } from "./types.js";
import type { Symmetry } from "./symmetry.js";

interface At {
  row: number;
  col: number;
  layer?: Layer;
}

export type Command =
  /** Put content in a square, making it a letter square. "" or "." empties it. down defaults to across. */
  | ({ type: "setContent"; across: string; down?: string } & At)
  /** Make a square a block, void, empty letter square or letter square (content is cleared for block and void). */
  | ({ type: "setKind"; kind: SquareKind } & At)
  /** Set one bar, printed or (puzzle layer only) hidden. Bars on the grid's outer edge are ignored. */
  | ({ type: "setBar"; side: "right" | "below"; on: boolean; hidden?: boolean } & At)
  /** A click on a bar, as in BarGrids: toggle it and set its symmetry partners to its new state. */
  | ({ type: "toggleBar"; side: "right" | "below"; symmetry?: Symmetry } & At)
  /** Give a square a style key (or null to clear it). */
  | ({ type: "setStyle"; style: string | null } & At)
  /** Define or replace a style, or remove it with null. */
  | { type: "defineStyle"; key: string; properties: StyleProperties | null }
  /** Set a square's label (text that isn't a clue number), or clear it with null or "". */
  | { type: "setLabel"; row: number; col: number; label: string | null }
  /** Change the grid's size, keeping the top-left corner. New squares are empty letter squares. */
  | { type: "resize"; width: number; height: number }
  /** Start a separate solution grid as a copy of the puzzle grid, or remove it. */
  | { type: "addSolution" }
  | { type: "removeSolution" }
  /** Several commands as one step: one undo, one change event. */
  | { type: "batch"; commands: Command[] };
