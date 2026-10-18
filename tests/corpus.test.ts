// The corpus: real puzzles, kept outside the repo because they're their authors' copyright. Point BARGRIDS_CORPUS
// at a folder of hexword documents (.json, .yaml) to run it; otherwise it's skipped.
//
//   BARGRIDS_CORPUS=/path/to/corpus npx vitest run tests/corpus.test.ts

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { loads, normalize } from "hexword";
import { describe, expect, it } from "vitest";

import { Grid, renderSvg } from "../src/index.js";

const corpus = process.env.BARGRIDS_CORPUS;
const files = corpus ? readdirSync(corpus).filter((name) => /\.(json|ya?ml)$/.test(name)).sort() : [];
const REPAIRED = new Set(["grid.row_length", "grid.column_length", "grid.kind_mismatch"]);

function meaning(doc: Record<string, unknown>) {
  const model = normalize(doc);
  const issues = model.issues.filter((issue) => !REPAIRED.has(issue.code)).map(({ message, ...rest }) => rest);
  return { grid: model.grid, words: model.words, clues: model.clues, issues };
}

describe.skipIf(!corpus)("corpus", () => {
  it(`round-trips and draws the puzzles in ${files.length} documents`, () => {
    const failures: string[] = [];
    let checked = 0;
    for (const name of files) {
      const original = loads(readFileSync(join(corpus!, name), "utf8"));
      const grid = Grid.fromHexword(original);
      if (grid.width < 2) continue; // no grid entered yet
      checked += 1;
      // A change, then undo, makes the grid write its lines from the model.
      grid.apply({ type: "toggleBar", side: "right", row: 0, col: 0 });
      grid.undo();
      try {
        expect(meaning(grid.toHexword())).toEqual(meaning(original));
        for (const layer of ["puzzle", "solution"] as const) expect(renderSvg(grid, { layer })).toContain("</svg>");
      } catch {
        failures.push(name);
      }
    }
    expect(failures).toEqual([]);
    console.log(`corpus: ${checked} grids round-tripped and drawn`);
  }, 120_000);
});
