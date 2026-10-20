// Clues and the squares they cover, from the hexword normalized model. Every linked clue has `cells`: one list of
// [row, col] per answer, however it was linked (a word, a position, or an explicit path; hexword SPEC §5.4, §5.6).

import type { Model } from "hexword";

import type { Direction } from "./editor.js";

/** A clue by its place in the document: the group's index and the clue's index within it. */
export interface ClueRef {
  group: number;
  clue: number;
}

type NormalizedClue = Model["clues"][number]["clues"][number];

export const sameClue = (a: ClueRef | null, b: ClueRef | null): boolean =>
  a !== null && b !== null && a.group === b.group && a.clue === b.clue;

export function clueAt(model: Model, ref: ClueRef | null): NormalizedClue | null {
  if (!ref) return null;
  return model.clues[ref.group]?.clues[ref.clue] ?? null;
}

/** Whether a document has any clues to list. */
export const hasClues = (model: Model): boolean => model.clues.some((group) => group.clues.length > 0);

/** The direction a path runs in, if it's a straight run across or down; null for a single square or a bend. */
export function pathDirection(path: number[][]): Direction | null {
  if (path.length < 2) return null;
  if (path.every(([r]) => r === path[0][0])) return "across";
  if (path.every(([, c]) => c === path[0][1])) return "down";
  return null;
}

/** Whether a clue covers the square. */
export const covers = (clue: NormalizedClue, row: number, col: number): boolean =>
  clue.cells.some((path) => path.some(([r, c]) => r === row && c === col));

/**
 * The clue for a square and direction: one covering the square whose first answer runs in that direction, else any
 * clue covering it. Groups and clues are searched in document order.
 */
export function clueFor(model: Model, row: number, col: number, direction: Direction): ClueRef | null {
  let any: ClueRef | null = null;
  for (const [g, group] of model.clues.entries())
    for (const [c, clue] of group.clues.entries()) {
      if (!covers(clue, row, col)) continue;
      if (pathDirection(clue.cells[0]) === direction) return { group: g, clue: c };
      any ??= { group: g, clue: c };
    }
  return any;
}
