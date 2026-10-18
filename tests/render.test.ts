// The SVG renderer: BarGrids version 1's geometry, the format's styles and settings, and layers.

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";

import { Grid, answerFontSize, renderSvg, renderSvgElement, renderTree, shade, type SvgNode } from "../src/index.js";

const FIXTURES = join(import.meta.dirname, "../../hexword-format/fixtures");
const fixture = (name: string) => Grid.fromHexword(readFileSync(join(FIXTURES, name, "puzzle.yaml"), "utf8"));
const doc = (rows: string[], columns: string[], extra: Record<string, unknown> = {}, settings?: Record<string, unknown>) =>
  Grid.fromHexword({ title: "T", version: "0.1", grid: { rows, columns, ...extra }, ...(settings ? { settings } : {}) });

const layer = (tree: SvgNode, name: string): SvgNode | undefined => tree.children.find((c) => c.attrs.class === `bargrids-${name}`);
const children = (tree: SvgNode, name: string): SvgNode[] => layer(tree, name)?.children ?? [];

describe("geometry, as BarGrids version 1 draws it", () => {
  const grid = doc(["AB|C", "DEF", "GHI"], ["ADG", "B|EH", "CFI"]);
  const tree = renderTree(grid, { layer: "solution" });

  it("sizes the drawing to 50 units a square plus a 4-unit margin", () => {
    expect(tree.attrs).toMatchObject({ viewBox: "0 0 158 158", width: 158, height: 158, "data-rows": 3, "data-cols": 3 });
  });

  it("draws bars 4 wide along the square's edge", () => {
    expect(layer(tree, "bars")!.attrs["stroke-width"]).toBe(4);
    expect(children(tree, "bars").map((b) => b.attrs)).toEqual([
      { x1: 104, y1: 4, x2: 104, y2: 54, "data-side": "right", "data-row": 0, "data-col": 1 },
      { x1: 54, y1: 54, x2: 104, y2: 54, "data-side": "below", "data-row": 0, "data-col": 1 },
    ]);
  });

  it("caps the corner where a vertical and a horizontal bar meet", () => {
    expect(children(tree, "barJoinCaps").map((c) => c.attrs)).toEqual([{ x: 102, y: 52, width: 4, height: 4 }]);
  });

  it("puts numbers in the corner and letters in the middle", () => {
    expect(children(tree, "numbers")[0]).toMatchObject({ attrs: { x: 8, y: 19 }, text: "1" });
    expect(children(tree, "answers")[0]).toMatchObject({ attrs: { x: 29, y: 29, "dominant-baseline": "central" }, text: "A" });
  });

  it("shrinks rebus letters as BarGrids does", () => {
    expect(["A", "AB", "ABC", "ABCD", "ABCDE"].map((t) => answerFontSize(t))).toEqual([24, 20, 16, 12, 10]);
    expect(answerFontSize("A", 100)).toBe(48);
  });

  it("closes the border's corners", () => {
    const lines = children(tree, "border").map((l) => l.attrs);
    expect(lines).toContainEqual({ x1: 4, y1: 2, x2: 4, y2: 56 });
    expect(lines).toContainEqual({ x1: 2, y1: 4, x2: 56, y2: 4 });
    expect(lines).toHaveLength(12);
  });

  it("scales everything with the square size", () => {
    const big = renderTree(grid, { size: 100 });
    expect(big.attrs.viewBox).toBe("0 0 316 316");
    expect(layer(big, "bars")!.attrs["stroke-width"]).toBe(8);
  });

  it("matches BarGrids' grey levels", () => {
    expect([0, 25, 50, 100].map(shade)).toEqual(["#ffffff", "#bfbfbf", "#808080", "#000000"]);
  });
});

describe("shapes, voids and styles", () => {
  it("borders the squares next to voids, and draws nothing in a void", () => {
    const tree = renderTree(doc(["_AB", "CDE"], ["_C", "AD", "BE"]));
    const squares = children(tree, "squares");
    expect(squares).toHaveLength(5);
    expect(children(tree, "border").map((l) => l.attrs)).toContainEqual({ x1: 54, y1: 2, x2: 54, y2: 56 });
  });

  it("draws blocks black", () => {
    expect(children(renderTree(doc(["A#", "BC"], ["AB", "#C"])), "blocks")[0].attrs).toMatchObject({ x: 54, y: 4, fill: "black" });
  });

  it("draws circles, filled circles, shaded squares, crosses and background colours from styles", () => {
    const grid = doc(["ABC", "DEF"], ["AD", "BE", "CF"], {
      style: ["OF#", "X_b"],
      styles: {
        O: { shape: "circle", stroke: "grey" },
        F: { shape: "circle", fill: "#808080" },
        "#": { shape: "shadesquare", fill: "lightgrey" },
        X: { shape: "x" },
        b: { "background-color": "yellow" },
      },
    });
    const tree = renderTree(grid);
    const circles = children(tree, "circles");
    expect(circles.filter((c) => c.tag === "circle").map((c) => [c.attrs.fill, c.attrs.stroke ?? null])).toEqual([["none", "grey"], ["#808080", null]]);
    expect(circles.filter((c) => c.tag === "line")).toHaveLength(2);
    expect(children(tree, "shading")[0].attrs).toMatchObject({ x: 104, y: 4, fill: "lightgrey" });
    expect(children(tree, "squares").find((s) => s.attrs["data-row"] === 1 && s.attrs["data-col"] === 2)!.attrs.fill).toBe("yellow");
  });

  it("centres labels in voids and puts them after the number in letter squares", () => {
    const grid = doc(["_AB", "_CD"], ["__", "AC", "BD"], { labels: ["1x_", "___"] });
    const labels = children(renderTree(grid), "labels");
    expect(labels[0]).toMatchObject({ attrs: { x: 29, y: 29, "text-anchor": "middle" }, text: "1" });
    expect(labels[1]).toMatchObject({ attrs: { x: 68, y: 19 }, text: "x" });
  });
});

describe("layers and settings", () => {
  it("hides answers on the puzzle grid and shows them on the solution grid", () => {
    const grid = fixture("01-word-square");
    expect(layer(renderTree(grid), "answers")).toBeUndefined();
    expect(children(renderTree(grid, { layer: "solution" }), "answers")).toHaveLength(25);
  });

  it("draws the solution grid's own letters and bars", () => {
    const grid = doc(["AB", "CD"], ["AC", "BD"], { solution_rows: ["XB", "C|D"], solution_columns: ["XC", "BD"] });
    const tree = renderTree(grid, { layer: "solution" });
    expect(children(tree, "answers")[0].text).toBe("X");
    expect(children(tree, "bars")).toHaveLength(1);
    expect(children(renderTree(grid), "bars")).toHaveLength(0);
  });

  it("follows the document's settings for bars, grid lines, border and numbers", () => {
    const grid = doc(["A|B", "CD"], ["AC", "BD"], {}, {
      show_puzzle_bars: false, show_grid_lines: false, show_grid_border: false, show_grid_labels: false,
    });
    const tree = renderTree(grid);
    for (const name of ["bars", "gridLines", "border", "numbers"]) expect(layer(tree, name)).toBeUndefined();
    expect(children(renderTree(grid, { layer: "solution" }), "bars")).toHaveLength(1);
  });

  it("lets the caller show and hide any layer", () => {
    const grid = fixture("02-bars-and-answers");
    const tree = renderTree(grid, { show: { answers: true, numbers: false, barJoinCaps: false } });
    expect(layer(tree, "answers")).toBeDefined();
    expect(layer(tree, "numbers")).toBeUndefined();
    expect(layer(tree, "barJoinCaps")).toBeUndefined();
  });

  it("leaves out data-row and data-col when asked", () => {
    expect(renderSvg(fixture("01-word-square"), { positions: false })).not.toContain(" data-row=");
  });

  it("follows the grid as it's edited", () => {
    const grid = Grid.create(3, 3);
    grid.apply({ type: "toggleBar", side: "right", row: 0, col: 0, symmetry: "180" });
    expect(children(renderTree(grid), "bars")).toHaveLength(2);
  });
});

describe("output", () => {
  it("escapes text", () => {
    const grid = Grid.fromHexword({ title: "Fish & <Chips>", grid: { rows: ["[<>]B", "CD"], columns: ["[<>]C", "BD"] } });
    const svg = renderSvg(grid, { layer: "solution" });
    expect(svg).toContain("<title>Fish &amp; &lt;Chips&gt;</title>");
    expect(svg).toContain(">&lt;&gt;</text>");
  });

  it("builds the same drawing as DOM elements", () => {
    const window = new Window();
    const element = renderSvgElement(fixture("02-bars-and-answers"), { layer: "solution" }, window.document as unknown as Document);
    expect(element.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(element.querySelectorAll(".bargrids-bars line").length).toBe(children(renderTree(fixture("02-bars-and-answers")), "bars").length);
  });

  for (const name of ["02-bars-and-answers", "03-shapes-rebus-styles", "04-misprints-and-solution"])
    it(`draws ${name} as before`, async () => {
      await expect(renderSvg(fixture(name), { layer: "solution" })).toMatchFileSnapshot(`__snapshots__/${name}.svg`);
    });
});
