// The model: commands, undo and redo, change events, and what each edit writes to the hexword document.

import { normalize } from "hexword";
import { describe, expect, it, vi } from "vitest";

import { Grid, contentToken, type Command } from "../src/index.js";

const doc = (rows: string[], columns: string[], extra: Record<string, unknown> = {}) => ({
  format: "hexword",
  version: "0.1",
  title: "Test",
  grid: { rows, columns, ...extra },
});

const gridOf = (grid: Grid) => grid.toHexword().grid as Record<string, unknown>;

describe("creating and reading", () => {
  it("creates a grid of empty letter squares", () => {
    const grid = Grid.create(3, 2, "New");
    expect([grid.width, grid.height]).toEqual([3, 2]);
    expect(grid.square(1, 2)).toMatchObject({ kind: "empty", across: ".", down: "." });
    expect(grid.toHexword()).toEqual({ format: "hexword", version: "0.1", title: "New", grid: {} });
  });

  it("refuses sizes outside 2 to 25", () => {
    expect(() => Grid.create(1, 5)).toThrow(RangeError);
    expect(() => Grid.create(26, 5)).toThrow(RangeError);
  });

  it("reads YAML text, rebus squares, blocks, voids and bars", () => {
    const grid = Grid.fromHexword('title: T\ngrid:\n  rows: ["A[ING]|#", "_.B"]\n  columns: ["A_", "[ING].", "#B"]\n');
    expect(grid.square(0, 1)).toMatchObject({ kind: "cell", across: "ING", down: "ING", barRight: true });
    expect(grid.square(0, 2).kind).toBe("block");
    expect(grid.square(1, 0).kind).toBe("void");
    expect(grid.square(1, 1).kind).toBe("empty");
  });

  it("keeps different letters across and down", () => {
    const grid = Grid.fromHexword(doc(["AB", "CD"], ["AC", "XD"]));
    expect(grid.square(0, 1)).toMatchObject({ across: "B", down: "X" });
  });

  it("returns copies, so the grid only changes through commands", () => {
    const grid = Grid.create(2, 2);
    grid.square(0, 0).across = "Q";
    grid.squares()[0][0].kind = "block";
    expect(grid.square(0, 0)).toMatchObject({ kind: "empty", across: "." });
  });

  it("checks positions", () => {
    const grid = Grid.create(3, 3);
    expect(() => grid.square(3, 0)).toThrow(RangeError);
    expect(() => grid.apply({ type: "setContent", row: 0, col: -1, across: "A" })).toThrow(RangeError);
  });
});

describe("commands", () => {
  it("sets content and writes it, bracketing rebus squares and reserved characters", () => {
    const grid = Grid.create(3, 2);
    grid.apply({ type: "batch", commands: [
      { type: "setContent", row: 0, col: 0, across: "A" },
      { type: "setContent", row: 0, col: 1, across: "ING" },
      { type: "setContent", row: 0, col: 2, across: "#" },
      { type: "setContent", row: 1, col: 0, across: "B", down: "C" },
    ] });
    expect(gridOf(grid)).toMatchObject({ rows: ["A[ING][#]", "B.."], columns: ["AC", "[ING].", "[#]."] });
  });

  it("empties a square with '' or '.'", () => {
    const grid = Grid.fromHexword(doc(["AB", "CD"], ["AC", "BD"]));
    grid.apply({ type: "setContent", row: 0, col: 0, across: "" });
    expect(grid.square(0, 0)).toMatchObject({ kind: "empty", across: "." });
  });

  it("refuses content that can't be written", () => {
    const grid = Grid.create(2, 2);
    for (const across of ["A B", "AB]C"]) expect(() => grid.apply({ type: "setContent", row: 0, col: 0, across })).toThrow();
    expect(grid.canUndo).toBe(false);
  });

  it("makes blocks and voids, clearing their content", () => {
    const grid = Grid.fromHexword(doc(["AB", "CD"], ["AC", "BD"]));
    grid.apply({ type: "setKind", row: 0, col: 0, kind: "block" });
    grid.apply({ type: "setKind", row: 1, col: 1, kind: "void" });
    expect(gridOf(grid)).toMatchObject({ rows: ["#B", "C_"], columns: ["#C", "B_"] });
    grid.apply({ type: "setKind", row: 0, col: 0, kind: "cell" });
    expect(grid.square(0, 0)).toMatchObject({ kind: "empty", across: "." });
  });

  it("writes bars after the square: right in rows, below in columns", () => {
    const grid = Grid.fromHexword(doc(["ABC", "DEF", "GHI"], ["ADG", "BEH", "CFI"]));
    grid.apply({ type: "toggleBar", side: "right", row: 0, col: 0, symmetry: "180" });
    grid.apply({ type: "setBar", side: "below", row: 0, col: 1, on: true });
    expect(gridOf(grid)).toMatchObject({ rows: ["A|BC", "DEF", "GH|I"], columns: ["ADG", "B|EH", "CFI"] });
  });

  it("ignores bars on the outer edge", () => {
    const grid = Grid.create(3, 3);
    expect(grid.apply({ type: "setBar", side: "right", row: 0, col: 2, on: true })).toBe(false);
  });

  it("keeps hidden bars on the puzzle grid and writes them as entry lines", () => {
    const grid = Grid.fromHexword(doc(["ABCD", "EFGH"], ["AE", "BF", "CG", "DH"]));
    grid.apply({ type: "setBar", side: "right", row: 0, col: 1, on: true, hidden: true });
    expect(gridOf(grid)).toMatchObject({ rows: ["ABCD", "EFGH"], entry_rows: ["AB|CD", "EFGH"], entry_columns: ["AE", "BF", "CG", "DH"] });
    expect(normalize(grid.toHexword()).words.map((w) => w.text)).toContain("AB");
    expect(() => grid.apply({ type: "setBar", side: "right", row: 0, col: 1, on: true, hidden: true, layer: "solution" })).toThrow();
    grid.apply({ type: "setBar", side: "right", row: 0, col: 1, on: false, hidden: true });
    expect(gridOf(grid)).not.toHaveProperty("entry_rows");
  });

  it("defines styles and writes the style mask", () => {
    const grid = Grid.create(2, 2);
    expect(() => grid.apply({ type: "setStyle", row: 0, col: 0, style: "@" })).toThrow(/defined/);
    grid.apply({ type: "defineStyle", key: "@", properties: { shape: "circle" } });
    grid.apply({ type: "setStyle", row: 0, col: 0, style: "@" });
    expect(gridOf(grid)).toMatchObject({ style: ["@_", "__"], styles: { "@": { shape: "circle" } } });
    grid.apply({ type: "defineStyle", key: "@", properties: null });
    expect(grid.square(0, 0).style).toBeNull();
    expect(gridOf(grid)).not.toHaveProperty("style");
    for (const key of ["", "_", "|", "ab", "a b"]) expect(() => grid.apply({ type: "defineStyle", key, properties: {} })).toThrow();
  });

  it("writes labels, bracketing the ones that are longer than a character", () => {
    const grid = Grid.create(2, 2);
    grid.apply({ type: "setLabel", row: 0, col: 0, label: "a" });
    grid.apply({ type: "setLabel", row: 1, col: 1, label: "12" });
    expect(gridOf(grid).labels).toEqual(["a_", "_[12]"]);
    grid.apply({ type: "batch", commands: [{ type: "setLabel", row: 0, col: 0, label: "" }, { type: "setLabel", row: 1, col: 1, label: null }] });
    expect(gridOf(grid)).not.toHaveProperty("labels");
  });

  it("resizes from the top-left corner, dropping bars that would sit on the new edge", () => {
    const grid = Grid.fromHexword(doc(["AB|C", "DEF", "GHI"], ["ADG", "BEH", "CFI"]));
    grid.apply({ type: "resize", width: 2, height: 4 });
    expect(gridOf(grid)).toMatchObject({ rows: ["AB", "DE", "GH", ".."], columns: ["ADG.", "BEH."] });
    expect(() => grid.apply({ type: "resize", width: 1, height: 4 })).toThrow(RangeError);
  });

  it("adds a solution grid that can differ from the puzzle grid", () => {
    const grid = Grid.fromHexword(doc(["AB", "CD"], ["AC", "BD"]));
    grid.apply({ type: "addSolution" });
    grid.apply({ type: "setContent", row: 0, col: 0, across: "X", layer: "solution" });
    grid.apply({ type: "toggleBar", side: "right", row: 1, col: 0, layer: "solution" });
    expect(gridOf(grid)).toMatchObject({ rows: ["AB", "CD"], solution_rows: ["XB", "C|D"], solution_columns: ["XC", "BD"] });
    expect(gridOf(grid)).not.toHaveProperty("solution_style");
    expect(grid.square(0, 0, "solution").across).toBe("X");
    grid.apply({ type: "removeSolution" });
    expect(gridOf(grid)).not.toHaveProperty("solution_rows");
    expect(() => grid.apply({ type: "setContent", row: 0, col: 0, across: "X", layer: "solution" })).toThrow(/solution/);
  });
});

describe("undo, redo and events", () => {
  const edits: Command[] = [
    { type: "setContent", row: 0, col: 0, across: "Q" },
    { type: "toggleBar", side: "right", row: 0, col: 0, symmetry: "180" },
    { type: "resize", width: 4, height: 4 },
    { type: "setKind", row: 3, col: 3, kind: "block" },
  ];

  it("undoes and redoes every step", () => {
    const grid = Grid.fromHexword(doc(["ABC", "DEF", "GHI"], ["ADG", "BEH", "CFI"]));
    const states = [JSON.stringify(grid.toHexword())];
    for (const edit of edits) {
      grid.apply(edit);
      states.push(JSON.stringify(grid.toHexword()));
    }
    for (let i = edits.length - 1; i >= 0; i--) {
      expect(grid.undo()).toBe(true);
      expect(JSON.stringify(grid.toHexword())).toBe(states[i]);
    }
    expect(grid.undo()).toBe(false);
    for (let i = 1; i <= edits.length; i++) {
      expect(grid.redo()).toBe(true);
      expect(JSON.stringify(grid.toHexword())).toBe(states[i]);
    }
    expect(grid.redo()).toBe(false);
  });

  it("forgets the redo steps after a new change", () => {
    const grid = Grid.create(3, 3);
    grid.apply(edits[0]);
    grid.undo();
    grid.apply(edits[1]);
    expect(grid.canRedo).toBe(false);
  });

  it("undoes a batch in one step", () => {
    const grid = Grid.create(3, 3);
    grid.apply({ type: "batch", commands: edits });
    grid.undo();
    expect(grid.canUndo).toBe(false);
    expect(grid.width).toBe(3);
  });

  it("leaves the grid as it was when a command fails partway", () => {
    const grid = Grid.create(3, 3);
    expect(() => grid.apply({ type: "batch", commands: [edits[0], { type: "setContent", row: 9, col: 9, across: "A" }] })).toThrow();
    expect(grid.square(0, 0).across).toBe(".");
    expect(grid.canUndo).toBe(false);
  });

  it("records nothing for a command that changes nothing", () => {
    const grid = Grid.create(3, 3);
    const listener = vi.fn();
    grid.subscribe(listener);
    expect(grid.apply({ type: "setKind", row: 0, col: 0, kind: "empty" })).toBe(false);
    expect(listener).not.toHaveBeenCalled();
    expect(grid.canUndo).toBe(false);
  });

  it("tells listeners what changed, until they stop listening", () => {
    const grid = Grid.create(3, 3);
    const listener = vi.fn();
    const stop = grid.subscribe(listener);
    grid.apply(edits[0]);
    grid.undo();
    grid.redo();
    expect(listener.mock.calls.map(([event]) => event.reason)).toEqual(["apply", "undo", "redo"]);
    expect(listener.mock.calls[0][0].command).toEqual(edits[0]);
    stop();
    grid.undo();
    expect(listener).toHaveBeenCalledTimes(3);
  });
});

describe("writing back", () => {
  it("keeps everything outside the grid, and the spacing of lines that didn't change", () => {
    const source = { ...doc(["A B C", "D E F", "G H I"], ["ADG", "BEH", "CFI"]), clues: [{ name: "Across", clues: [] }], "x-hex": { id: 7 } };
    const grid = Grid.fromHexword(source);
    grid.apply({ type: "setContent", row: 1, col: 1, across: "Z" });
    const out = grid.toHexword();
    expect(out.clues).toEqual(source.clues);
    expect(out["x-hex"]).toEqual({ id: 7 });
    expect((out.grid as Record<string, unknown>).rows).toEqual(["A B C", "DZF", "G H I"]);
  });

  it("writes styles it didn't change exactly as they were", () => {
    const styles = { "@": { shape: "circle", background_color: "grey", "x-note": "kept" } };
    const grid = Grid.fromHexword(doc(["AB", "CD"], ["AC", "BD"], { style: ["@_", "__"], styles }));
    grid.apply({ type: "setContent", row: 1, col: 1, across: "Z" });
    expect(gridOf(grid).styles).toEqual(styles);
  });

  it("makes version 0's default styles and style-mask labels explicit", () => {
    const grid = Grid.fromHexword({ title: "Old", grid: { rows: ["AB", "CD"], columns: ["AC", "BD"], style: ["@3", "__"] } });
    grid.apply({ type: "setContent", row: 1, col: 1, across: "Z" });
    const out = gridOf(grid);
    expect(out).toMatchObject({ style: ["@_", "__"], labels: ["_3", "__"] });
    expect(out.styles).toEqual({ "@": { "background-color": "lightgrey", fill: "lightgrey", shape: "circle" } });
  });

  it("writes tokens for content", () => {
    expect(["A", "ING", "#", "_", ".", "|", "[", "]", "★"].map(contentToken)).toEqual(["A", "[ING]", "[#]", "[_]", "[.]", "[|]", "[[]", "]", "★"]);
  });
});

describe("words and numbers", () => {
  it("numbers a grid without clues the usual way", () => {
    const grid = Grid.fromHexword(doc(["AB#", "CDE", "#FG"], ["AC#", "BDF", "#EG"]));
    expect(grid.numbers()).toEqual([["1", "2", null], ["3", null, "4"], [null, "5", null]]);
    expect(grid.words().map((w) => `${w.direction} ${w.text}`)).toEqual(["across AB", "across CDE", "across FG", "down AC", "down BDF", "down EG"]);
  });

  it("numbers a grid with clues by linking them (hexword SPEC §5.4)", () => {
    const grid = Grid.fromHexword({
      ...doc(["AB", "CD"], ["AC", "BD"]),
      clues: [{ name: "Across", clues: ["7. Clue ~ CD"] }],
    });
    expect(grid.numbers()).toEqual([[null, null], ["7", null]]);
  });

  it("updates numbers and issues after a change", () => {
    const grid = Grid.fromHexword(doc(["ABC", "DEF", "GHI"], ["ADG", "BEH", "CFI"]));
    expect(grid.numbers()[1][0]).toBe("4");
    grid.apply({ type: "setKind", row: 1, col: 0, kind: "block" });
    expect(grid.numbers()[1][0]).toBeNull();
    expect(grid.issues()).toEqual([]);
  });
});
