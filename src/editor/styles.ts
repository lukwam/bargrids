// Circles and shading as hexword styles. A square has one style key, so the editor's marks combine into one set of
// properties: shading the square is its background colour, a circle is `shape: circle` with a `stroke` (outline)
// and/or a `fill` (shaded circle). Keys are found by their properties, or made up when no style matches.

import type { Grid } from "../model/grid.js";
import type { Command } from "../model/commands.js";
import type { StyleProperties } from "../model/types.js";

export type Mark = "circle" | "shadedSquare" | "shadedCircle";

// Keys for new styles, in order of preference: one character each, none of them reserved in the mask.
const KEYS = Array.from("O@%&*+=~^!$?ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789");

const same = (a: StyleProperties, b: StyleProperties): boolean => {
  const ka = Object.keys(a).sort();
  const kb = Object.keys(b).sort();
  return ka.length === kb.length && ka.every((key, i) => key === kb[i] && a[key] === b[key]);
};

/** Which marks a style shows, and at what grey. */
export function marksOf(properties: StyleProperties | null | undefined): Partial<Record<Mark, string>> {
  const out: Partial<Record<Mark, string>> = {};
  if (!properties) return out;
  if (properties["background-color"]) out.shadedSquare = properties["background-color"];
  if (properties.shape === "shadesquare") out.shadedSquare = properties.fill ?? properties["background-color"] ?? "lightgrey";
  if (properties.shape === "circle") {
    if (properties.fill) out.shadedCircle = properties.fill;
    if (properties.stroke || !properties.fill) out.circle = properties.stroke ?? "black";
  }
  return out;
}

/** The properties for a set of marks. */
export function propertiesOf(marks: Partial<Record<Mark, string>>): StyleProperties {
  const out: StyleProperties = {};
  if (marks.shadedSquare) out["background-color"] = marks.shadedSquare;
  if (marks.circle || marks.shadedCircle) out.shape = "circle";
  if (marks.circle) out.stroke = marks.circle;
  if (marks.shadedCircle) out.fill = marks.shadedCircle;
  return out;
}

/**
 * The command that turns a mark on or off on a square (on when it's off; off when it's on). colour is the shade to
 * use when turning it on. Returns null for a square that can't be marked.
 */
export function toggleMark(grid: Grid, row: number, col: number, mark: Mark, colour: string, layer: "puzzle" | "solution" = "puzzle"): Command | null {
  const square = grid.square(row, col, layer);
  if (square.kind === "void") return null;
  const styles = grid.styles;
  const marks = marksOf(square.style ? styles[square.style] : null);
  if (marks[mark]) delete marks[mark];
  else marks[mark] = mark === "circle" ? "black" : colour;
  const properties = propertiesOf(marks);
  if (!Object.keys(properties).length) return { type: "setStyle", row, col, style: null, layer };
  const existing = Object.entries(styles).find(([, props]) => same(props, properties));
  if (existing) return { type: "setStyle", row, col, style: existing[0], layer };
  const key = KEYS.find((k) => !(k in styles));
  if (!key) throw new Error("no style keys left");
  return {
    type: "batch",
    commands: [{ type: "defineStyle", key, properties }, { type: "setStyle", row, col, style: key, layer }],
  };
}
