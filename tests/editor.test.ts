// The editor: tools, typing, the cursor, undo, and the change event, in a simulated DOM (happy-dom).

import { Window } from "happy-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Editor, Grid, hitTest, marksOf, propertiesOf, type EditorOptions } from "../src/index.js";

let window: Window;
let host: HTMLElement;

beforeEach(() => {
  window = new Window();
  host = window.document.createElement("div") as unknown as HTMLElement;
  window.document.body.appendChild(host as never);
});

const editor = (options: EditorOptions = {}) => new Editor(host, { grid: Grid.create(5, 5), ...options });
const key = (target: HTMLElement, key: string, init: Record<string, unknown> = {}) =>
  target.dispatchEvent(new window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }) as unknown as Event);
/** The middle of a square, in drawing units. */
const middle = (row: number, col: number): [number, number] => [col * 50 + 29, row * 50 + 29];
/** A point on the edge to the right of a square, or below it. */
const edge = (row: number, col: number, side: "right" | "below"): [number, number] =>
  side === "right" ? [col * 50 + 54, row * 50 + 29] : [col * 50 + 29, row * 50 + 54];
const rows = (e: Editor) => (e.toHexword().grid as Record<string, string[]>).rows;

describe("hitTest", () => {
  it("finds the square, and the bar near an edge", () => {
    expect(hitTest(...middle(1, 2), 5, 5)).toEqual({ row: 1, col: 2, bar: null });
    expect(hitTest(...edge(1, 2, "right"), 5, 5)!.bar).toEqual({ side: "right", row: 1, col: 2 });
    expect(hitTest(105, 79, 5, 5)!.bar).toEqual({ side: "right", row: 1, col: 1 });
    expect(hitTest(...edge(1, 2, "below"), 5, 5)!.bar).toEqual({ side: "below", row: 1, col: 2 });
  });

  it("ignores the outer edge and points off the grid", () => {
    expect(hitTest(6, 29, 5, 5)!.bar).toBeNull();
    expect(hitTest(2, 2, 5, 5)).toBeNull();
    expect(hitTest(300, 29, 5, 5)).toBeNull();
  });

  it("scales with the square size", () => {
    expect(hitTest(208, 58, 5, 5, 100)!.bar).toEqual({ side: "right", row: 0, col: 1 });
  });
});

describe("drawing", () => {
  it("draws the grid into the element, with answers and the cursor", () => {
    const e = editor();
    const svg = host.querySelector("svg")!;
    expect(svg.getAttribute("data-tool")).toBe("letters");
    expect(svg.querySelectorAll(".bargrids-cursor rect").length).toBe(5);
    expect(host.getAttribute("tabindex")).toBe("0");
    e.tool = "bars";
    expect(host.querySelectorAll("svg").length).toBe(1);
    expect(host.querySelector(".bargrids-cursor")).toBeNull();
  });

  it("stops listening when destroyed", () => {
    const e = editor();
    e.destroy();
    expect(host.querySelector("svg")).toBeNull();
    key(host, "A");
    expect(e.grid.canUndo).toBe(false);
  });
});

describe("the letters tool", () => {
  it("types letters, upper-cased, moving across", () => {
    const e = editor();
    for (const k of "cat") key(host, k);
    expect(rows(e)[0]).toBe("CAT..");
    expect(e.cursor).toEqual({ row: 0, col: 3, direction: "across" });
  });

  it("switches direction when the cursor's square is clicked again, or with Enter", () => {
    const e = editor();
    e.clickAt(...middle(0, 0));
    expect(e.cursor.direction).toBe("down");
    key(host, "Enter");
    expect(e.cursor.direction).toBe("across");
    e.clickAt(...middle(0, 0));
    for (const k of "dog") key(host, k);
    expect(rows(e).map((r) => r[0]).join("")).toBe("DOG..");
  });

  it("moves with the arrow keys, turning to their direction, and stops at the edge", () => {
    const e = editor();
    key(host, "ArrowDown");
    key(host, "ArrowDown");
    expect(e.cursor).toEqual({ row: 2, col: 0, direction: "down" });
    key(host, "ArrowLeft");
    expect(e.cursor).toEqual({ row: 2, col: 0, direction: "across" });
  });

  it("deletes with Backspace (going back when the square is empty) and Delete", () => {
    const e = editor();
    for (const k of "ab") key(host, k);
    key(host, "Backspace");
    expect(rows(e)[0]).toBe("A....");
    expect(e.cursor.col).toBe(1);
    key(host, "ArrowLeft");
    key(host, "Delete");
    expect(rows(e)[0]).toBe(".....");
  });

  it("types a rebus after Insert, until Enter", () => {
    const e = editor();
    key(host, "Insert");
    for (const k of "ing") key(host, k);
    expect(host.querySelector(".bargrids-rebus")!.textContent).toBe("ING▏");
    key(host, "Enter");
    expect(e.grid.square(0, 0).across).toBe("ING");
    expect(host.querySelector(".bargrids-rebus")).toBeNull();
  });

  it("drops a rebus on Escape", () => {
    const e = editor();
    key(host, "Insert");
    key(host, "x");
    key(host, "Escape");
    expect(e.grid.square(0, 0).across).toBe(".");
  });

  it("doesn't type into blocks or voids", () => {
    const e = editor();
    e.apply({ type: "setKind", row: 0, col: 0, kind: "block" });
    key(host, "Q");
    expect(e.grid.square(0, 0).kind).toBe("block");
    expect(e.cursor.col).toBe(1);
  });

  it("highlights the cursor's word up to the bars", () => {
    const e = editor();
    e.apply({ type: "setBar", side: "right", row: 0, col: 1, on: true });
    expect(host.querySelectorAll(".bargrids-cursor rect").length).toBe(2);
  });
});

describe("the other tools", () => {
  it("places bars with symmetry, and hidden bars with Alt", () => {
    const e = editor({ tool: "bars", symmetry: "180" });
    e.clickAt(...edge(0, 0, "right"));
    expect(rows(e)).toEqual([".|....", ".....", ".....", ".....", "....|."]);
    e.clickAt(...middle(2, 2));
    expect(e.grid.canUndo).toBe(true);
    e.clickAt(...edge(1, 1, "below"), { alt: true });
    expect(e.grid.square(1, 1).hiddenBarBelow).toBe(true);
    expect(e.grid.square(3, 3).barBelow).toBe(false);
  });

  it("refuses square-only symmetry on other grids", () => {
    expect(() => (editor({ grid: Grid.create(5, 4) }).symmetry = "90")).toThrow(/square/);
    expect(editor({ grid: Grid.create(5, 4), symmetry: "x" }).symmetry).toBe("none");
  });

  it("toggles blocks and voids", () => {
    const e = editor({ tool: "blocks" });
    e.clickAt(...middle(1, 1));
    expect(e.grid.square(1, 1).kind).toBe("block");
    e.clickAt(...middle(1, 1));
    expect(e.grid.square(1, 1).kind).toBe("empty");
    e.tool = "voids";
    e.clickAt(...middle(0, 0));
    expect(e.grid.square(0, 0).kind).toBe("void");
  });

  it("combines circles and shading into one style per square, reusing styles", () => {
    const e = editor({ tool: "circles" });
    e.clickAt(...middle(0, 0));
    e.clickAt(...middle(0, 1));
    e.tool = "shadedSquares";
    e.shade = 50;
    e.clickAt(...middle(0, 0));
    const styles = e.grid.styles;
    const key0 = e.grid.square(0, 0).style!;
    const key1 = e.grid.square(0, 1).style!;
    expect(styles[key1]).toEqual({ shape: "circle", stroke: "black" });
    expect(styles[key0]).toEqual({ shape: "circle", stroke: "black", "background-color": "#808080" });
    e.tool = "circles";
    e.clickAt(...middle(0, 0));
    expect(e.grid.styles[e.grid.square(0, 0).style!]).toEqual({ "background-color": "#808080" });
    e.tool = "shadedSquares";
    e.clickAt(...middle(0, 0));
    expect(e.grid.square(0, 0).style).toBeNull();
    e.tool = "shadedCircles";
    e.clickAt(...middle(2, 2));
    expect(e.grid.styles[e.grid.square(2, 2).style!]).toEqual({ shape: "circle", fill: "#808080" });
  });

  it("reads marks from styles written by others", () => {
    expect(marksOf({ shape: "shadesquare" })).toEqual({ shadedSquare: "lightgrey" });
    expect(marksOf({ shape: "circle" })).toEqual({ circle: "black" });
    expect(marksOf({ shape: "circle", fill: "grey", stroke: "red" })).toEqual({ circle: "red", shadedCircle: "grey" });
    expect(propertiesOf({})).toEqual({});
  });

  it("offers only the tools it's given", () => {
    const e = editor({ tools: ["bars", "blocks"] });
    expect(e.tool).toBe("bars");
    expect(() => (e.tool = "letters")).toThrow();
  });
});

describe("undo, events and the solution grid", () => {
  it("undoes and redoes with the keyboard", () => {
    const e = editor();
    key(host, "A");
    key(host, "z", { ctrlKey: true });
    expect(rows(e)[0]).toBe(".....");
    key(host, "z", { ctrlKey: true, shiftKey: true });
    expect(rows(e)[0]).toBe("A....");
    key(host, "z", { metaKey: true });
    key(host, "y", { ctrlKey: true });
    expect(rows(e)[0]).toBe("A....");
  });

  it("sends a change event for every change", () => {
    const e = editor();
    const listener = vi.fn();
    e.addEventListener("change", listener);
    key(host, "A");
    e.undo();
    expect(listener.mock.calls.map(([event]) => event.detail.reason)).toEqual(["apply", "undo"]);
    expect(listener.mock.calls[0][0].detail.command).toEqual({ type: "setContent", row: 0, col: 0, across: "A", layer: "puzzle" });
  });

  it("edits the solution grid when asked, adding one", () => {
    const e = editor();
    e.layer = "solution";
    key(host, "X");
    expect(e.grid.square(0, 0, "solution").across).toBe("X");
    expect(e.grid.square(0, 0).across).toBe(".");
  });

  it("turns pointer events into clicks at the right square", () => {
    const e = editor({ tool: "blocks" });
    const svg = host.querySelector("svg")!;
    // Drawn at half size on the page: 108 units across 54 pixels... here 258 units across 129 pixels.
    svg.getBoundingClientRect = () => ({ left: 10, top: 20, width: 129, height: 129, right: 139, bottom: 149, x: 10, y: 20, toJSON() {} }) as DOMRect;
    host.dispatchEvent(new window.PointerEvent("pointerdown", { clientX: 10 + 79 / 2, clientY: 20 + 129 / 2, bubbles: true, button: 0 }) as unknown as Event);
    expect(e.grid.square(2, 1).kind).toBe("block");
  });
});
