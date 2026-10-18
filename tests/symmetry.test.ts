// Golden tests: BarGrids' basebars XFCN, run under emulation (tests/golden/symmetry.json, made by
// scripts/symmetry-golden.mjs from temp-experiment/bargrids-re/results).

import { describe, expect, it } from "vitest";

import golden from "./golden/symmetry.json";
import { Grid, SYMMETRIES, symmetricBars, symmetryAllowed, toSymmetry, type BarPosition, type Symmetry } from "../src/index.js";

type Pair = [number, number];

/** The grid's bars as 1-based [row, col] pairs, sorted, as the probes print them. */
function bars(grid: Grid): { right: Pair[]; below: Pair[] } {
  const right: Pair[] = [];
  const below: Pair[] = [];
  grid.squares().forEach((row, y) =>
    row.forEach((square, x) => {
      if (square.barRight) right.push([y + 1, x + 1]);
      if (square.barBelow) below.push([y + 1, x + 1]);
    }),
  );
  const order = (a: Pair, b: Pair): number => a[0] - b[0] || a[1] - b[1];
  return { right: right.sort(order), below: below.sort(order) };
}

const sorted = (pairs: number[][]): Pair[] => (pairs as Pair[]).slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);

const click = (grid: Grid, side: "right" | "below", row: number, col: number, symmetry: Symmetry): boolean =>
  grid.apply({ type: "toggleBar", side, row: row - 1, col: col - 1, symmetry });

describe("one click (symmetry_probe2)", () => {
  for (const c of golden.singles) {
    const mode = SYMMETRIES[c.mode];
    it(`${c.width}x${c.height}, bar ${c.side} of (${c.row},${c.col}), ${mode}`, () => {
      const grid = Grid.create(c.width, c.height);
      click(grid, c.side as "right" | "below", c.row, c.col, mode);
      expect(bars(grid)).toEqual({ right: sorted(c.right), below: sorted(c.below) });
    });
  }
});

describe("two clicks (symmetry_probe)", () => {
  // The probe also ran modes BarGrids doesn't offer on non-square grids; those results aren't behaviour to keep.
  for (const c of golden.sequences.filter((s) => symmetryAllowed(SYMMETRIES[s.mode], s.width, s.height))) {
    const mode = SYMMETRIES[c.mode];
    it(`${c.width}x${c.height}, ${mode}`, () => {
      const grid = Grid.create(c.width, c.height);
      for (const k of c.clicks) click(grid, k.side as "right" | "below", k.row, k.col, mode);
      expect(bars(grid)).toEqual({ right: sorted(c.right), below: sorted(c.below) });
    });
  }
});

describe("the probes' special cases", () => {
  it("toggles: a second click removes the bar and its partner", () => {
    const grid = Grid.create(7, 7);
    click(grid, "right", 1, 2, "180");
    expect(bars(grid).right).toEqual([[1, 2], [7, 5]]);
    click(grid, "right", 1, 2, "180");
    expect(bars(grid)).toEqual({ right: [], below: [] });
  });

  it("sets partners to the clicked bar's new state rather than flipping them", () => {
    const grid = Grid.create(7, 7);
    click(grid, "right", 7, 5, "none");
    click(grid, "right", 1, 2, "180");
    expect(bars(grid).right).toEqual([[1, 2], [7, 5]]);
  });

  it("mirrors a bar beside the axis across it", () => {
    for (const mode of ["180", "left-right"] as const) {
      const grid = Grid.create(7, 7);
      click(grid, "right", 4, 3, mode);
      expect(bars(grid).right).toEqual([[4, 3], [4, 4]]);
    }
  });

  it("handles a bar whose partner is its neighbour under 180 rotation", () => {
    const grid = Grid.create(6, 6);
    click(grid, "right", 3, 3, "180");
    expect(bars(grid).right).toEqual([[3, 3], [4, 3]]);
  });

  it("ignores clicks on the outer edge", () => {
    const grid = Grid.create(7, 7);
    expect(click(grid, "right", 1, 7, "180")).toBe(false);
    expect(click(grid, "below", 7, 1, "180")).toBe(false);
    expect(grid.canUndo).toBe(false);
  });
});

describe("symmetricBars", () => {
  it("lists a bar on an axis once", () => {
    // In a 7x7 grid the bar below (3, 3) (0-based) lies on the vertical axis.
    expect(symmetricBars({ side: "below", row: 3, col: 3 }, "left-right", 7, 7)).toEqual([{ side: "below", row: 3, col: 3 }]);
  });

  it("keeps every mode's partners inside the grid and closed under the mode", () => {
    for (const [width, height] of [[7, 7], [8, 8], [9, 6], [2, 2], [15, 15], [13, 4]]) {
      for (const mode of SYMMETRIES.filter((m) => symmetryAllowed(m, width, height))) {
        for (let row = 0; row < height; row++)
          for (let col = 0; col < width; col++)
            for (const side of ["right", "below"] as const) {
              if (side === "right" ? col === width - 1 : row === height - 1) continue;
              const orbit = symmetricBars({ side, row, col }, mode, width, height);
              const key = (b: BarPosition): string => `${b.side}${b.row},${b.col}`;
              const keys = new Set(orbit.map(key));
              for (const bar of orbit) {
                expect(bar.row).toBeGreaterThanOrEqual(0);
                expect(bar.col).toBeGreaterThanOrEqual(0);
                expect(bar.side === "right" ? bar.col < width - 1 : bar.row < height - 1).toBe(true);
                expect(new Set(symmetricBars(bar, mode, width, height).map(key))).toEqual(keys);
              }
            }
      }
    }
  });

  it("refuses square-only modes on other grids", () => {
    expect(symmetryAllowed("90", 9, 6)).toBe(false);
    expect(symmetryAllowed("plus", 9, 6)).toBe(true);
    expect(() => symmetricBars({ side: "right", row: 0, col: 0 }, "x", 9, 6)).toThrow(/square/);
    expect(() => Grid.create(9, 6).apply({ type: "toggleBar", side: "right", row: 0, col: 0, symmetry: "all" })).toThrow(/square/);
  });

  it("reads modes by name or BarGrids number", () => {
    expect(toSymmetry(1)).toBe("180");
    expect(toSymmetry("9")).toBe("all");
    expect(toSymmetry(" Left-Right ")).toBe("left-right");
    expect(toSymmetry("sideways")).toBeNull();
  });
});
