// Reading and writing hexword documents: every fixture of the format survives a round trip through the model.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { loads, normalize } from "hexword";
import { describe, expect, it } from "vitest";

import { Grid } from "../src/index.js";

const FIXTURES = join(import.meta.dirname, "../../hexword-format/fixtures");
const fixtures = readdirSync(FIXTURES).filter((name) => /^\d\d-/.test(name));

/** Force the grid to write its lines from the model: a change and its undo leave the content as it was. */
function rewritten(grid: Grid): Record<string, unknown> {
  grid.apply({ type: "setLabel", row: 0, col: 0, label: grid.square(0, 0).label === "Z" ? "Y" : "Z" });
  grid.undo();
  return grid.toHexword();
}

// Grid errors that writing repairs: the model keeps the row's reading, as readers must (hexword SPEC §3.2).
const REPAIRED = new Set(["grid.row_length", "grid.column_length", "grid.kind_mismatch"]);

/** What a renderer and the format's checks see; issue messages may be worded differently. */
function meaning(doc: Record<string, unknown>) {
  const model = normalize(doc);
  const issues = model.issues.filter((issue) => !REPAIRED.has(issue.code)).map(({ message, ...rest }) => rest);
  return { grid: model.grid, words: model.words, clues: model.clues, issues };
}

describe("hexword fixtures", () => {
  for (const name of fixtures) {
    const text = readFileSync(join(FIXTURES, name, "puzzle.yaml"), "utf8");

    it(`${name}: an unedited grid gives back its document`, () => {
      expect(Grid.fromHexword(text).toHexword()).toEqual(loads(text));
    });

    it(`${name}: written from the model, it means the same`, () => {
      const doc = rewritten(Grid.fromHexword(text));
      expect(meaning(doc)).toEqual(meaning(loads(text)));
      expect(normalize(doc).issues.filter((issue) => REPAIRED.has(issue.code))).toEqual([]);
    });
  }
});
