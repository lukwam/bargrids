// The grid as SVG, looking like BarGrids version 1: 50-unit squares, 4-unit bars and border, bar join caps, letters
// of 24 shrinking for rebus squares, numbers of 14 in the corner. Styles (hexword SPEC §3.4) are drawn as the Hex
// renderer draws them. Each part of the drawing is a layer that can be shown or hidden on its own.

import type { Grid } from "../model/grid.js";
import { isLetterSquare, type Layer, type Square } from "../model/types.js";
import { el, toSvgElement, toSvgString, type SvgNode } from "./svg-tree.js";

export const LAYERS = [
  "squares",
  "shading",
  "blocks",
  "circles",
  "gridLines",
  "bars",
  "barJoinCaps",
  "border",
  "numbers",
  "labels",
  "answers",
] as const;

export type LayerName = (typeof LAYERS)[number];

export interface RenderOptions {
  /** Draw the puzzle grid or the solution grid (which falls back to the puzzle grid when there isn't one). */
  layer?: Layer;
  /** Show or hide layers. Defaults come from the document's settings; answers show on the solution grid only. */
  show?: Partial<Record<LayerName, boolean>>;
  /** Units per square (default 50). */
  size?: number;
  answerFont?: string;
  numberFont?: string;
  /** Put data-row and data-col on each square's elements, for editors (default true). */
  positions?: boolean;
}

const MARGIN = 4; // half the border, so the border fits inside the drawing
const BAR = 4;
const BORDER = 4;
const GRID_LINE = 1;
const DEFAULT_FONT = "Helvetica, Arial, sans-serif";

/** BarGrids' letter sizes: 24, then 20, 16, 12 and 10 as a rebus gets longer. */
export function answerFontSize(text: string, size = 50): number {
  const length = Array.from(text).length;
  const base = length > 4 ? 10 : length > 3 ? 12 : length > 2 ? 16 : length > 1 ? 20 : 24;
  return (base * size) / 50;
}

/** A shading percentage as BarGrids' grey: 0 is white, 100 black. */
export function shade(percent: number): string {
  const level = Math.round(((100 - Math.min(100, Math.max(0, percent))) / 100) * 255).toString(16).padStart(2, "0");
  return `#${level}${level}${level}`;
}

/** Draw the grid as an SVG node tree. */
export function renderTree(grid: Grid, options: RenderOptions = {}): SvgNode {
  const size = options.size ?? 50;
  const k = size / 50;
  const layer: Layer = options.layer === "solution" && grid.hasSolution ? "solution" : "puzzle";
  const model = grid.normalized();
  const settings = model.settings as Record<string, unknown>;
  const show: Record<LayerName, boolean> = {
    squares: true,
    shading: true,
    blocks: true,
    circles: true,
    gridLines: settings.show_grid_lines !== false,
    bars: (options.layer === "solution" ? settings.show_solution_bars : settings.show_puzzle_bars) !== false,
    barJoinCaps: true,
    border: settings.show_grid_border !== false,
    numbers: settings.show_grid_labels !== false,
    labels: true,
    answers: options.layer === "solution",
    ...options.show,
  };
  const squares = grid.squares(layer);
  const numbers = grid.numbers();
  const styles = grid.styles;
  const width = grid.width;
  const height = grid.height;
  const positions = options.positions ?? true;
  const at = (row: number, col: number) => (positions ? { "data-row": row, "data-col": col } : {});
  const x0 = (col: number): number => col * size + MARGIN * k;
  const y0 = (row: number): number => row * size + MARGIN * k;
  const inside = (row: number, col: number): boolean =>
    row >= 0 && col >= 0 && row < height && col < width && squares[row][col].kind !== "void";
  const each = (draw: (square: Square, row: number, col: number) => SvgNode | SvgNode[] | null): SvgNode[] =>
    squares.flatMap((cells, row) => cells.flatMap((square, col) => draw(square, row, col) ?? []));
  const group = (name: LayerName, attrs: Record<string, string | number>, children: SvgNode[]): SvgNode[] =>
    show[name] && children.length ? [el("g", { class: `bargrids-${name}`, ...attrs }, children)] : [];
  const styleOf = (square: Square): Record<string, string> | null => (square.style ? (styles[square.style] ?? null) : null);

  // Square backgrounds: white for letter squares, the style's background colour for any square that has one.
  const backgrounds = each((square, row, col) => {
    const background = styleOf(square)?.["background-color"];
    if (square.kind === "void" && !background) return null;
    if (square.kind === "block" && !background) return null;
    return el("rect", { x: x0(col), y: y0(row), width: size, height: size, fill: background ?? "white", ...at(row, col) });
  });

  const shading = each((square, row, col) => {
    const style = styleOf(square);
    if (!style || style.shape !== "shadesquare" || square.kind === "block") return null;
    const fill = style.fill ?? style["background-color"] ?? "lightgrey";
    return el("rect", { x: x0(col), y: y0(row), width: size, height: size, fill, opacity: style.opacity, ...at(row, col) });
  });

  const blocks = each((square, row, col) =>
    square.kind === "block" && !styleOf(square)?.["background-color"]
      ? el("rect", { x: x0(col), y: y0(row), width: size, height: size, fill: "black", ...at(row, col) })
      : null,
  );

  const circles = each((square, row, col) => {
    const style = styleOf(square);
    if (!style || square.kind === "void") return null;
    const cx = x0(col) + size / 2;
    const cy = y0(row) + size / 2;
    if (style.shape === "circle") {
      const out: SvgNode[] = [];
      const r = size / 2 - 3 * k;
      if (style.fill) out.push(el("circle", { cx, cy, r, fill: style.fill, opacity: style.opacity, ...at(row, col) }));
      if (style.stroke || !style.fill)
        out.push(el("circle", { cx, cy, r, fill: "none", stroke: style.stroke ?? "black", "stroke-width": GRID_LINE * k, opacity: style.opacity, ...at(row, col) }));
      return out;
    }
    if (style.shape === "x") {
      const [a, b] = [8 * k, size - 8 * k];
      const stroke = style.stroke ?? "grey";
      const line = (x1: number, y1: number, x2: number, y2: number) =>
        el("line", { x1: x0(col) + x1, y1: y0(row) + y1, x2: x0(col) + x2, y2: y0(row) + y2, stroke, "stroke-width": 4 * k, opacity: style.opacity, ...at(row, col) });
      return [line(a, a, b, b), line(b, a, a, b)];
    }
    return null;
  });

  // Grid lines: the edges of every square that isn't a void, each drawn once.
  const gridLines = each((square, row, col) => {
    if (square.kind === "void") return null;
    const out: SvgNode[] = [];
    const [x, y] = [x0(col), y0(row)];
    out.push(el("line", { x1: x, y1: y, x2: x + size, y2: y }), el("line", { x1: x, y1: y, x2: x, y2: y + size }));
    if (!inside(row, col + 1)) out.push(el("line", { x1: x + size, y1: y, x2: x + size, y2: y + size }));
    if (!inside(row + 1, col)) out.push(el("line", { x1: x, y1: y + size, x2: x + size, y2: y + size }));
    return out;
  });

  const bars = each((square, row, col) => {
    const out: SvgNode[] = [];
    const [x, y] = [x0(col), y0(row)];
    if (square.barRight && col < width - 1) out.push(el("line", { x1: x + size, y1: y, x2: x + size, y2: y + size, "data-side": "right", ...at(row, col) }));
    if (square.barBelow && row < height - 1) out.push(el("line", { x1: x, y1: y + size, x2: x + size, y2: y + size, "data-side": "below", ...at(row, col) }));
    return out;
  });

  // A cap fills the notch where a vertical and a horizontal bar meet at a grid point, as in BarGrids.
  const caps: SvgNode[] = [];
  for (let row = 1; row < height; row++)
    for (let col = 1; col < width; col++) {
      const vertical = squares[row - 1][col - 1].barRight || squares[row][col - 1].barRight;
      const horizontal = squares[row - 1][col - 1].barBelow || squares[row - 1][col].barBelow;
      if (vertical && horizontal)
        caps.push(el("rect", { x: x0(col) - (BAR * k) / 2, y: y0(row) - (BAR * k) / 2, width: BAR * k, height: BAR * k }));
    }

  // The border: edges between a square and a void or the outside, lengthened by half the border so corners close.
  const half = (BORDER * k) / 2;
  const border = each((square, row, col) => {
    if (square.kind === "void") return null;
    const [x, y] = [x0(col), y0(row)];
    const out: SvgNode[] = [];
    if (!inside(row, col - 1)) out.push(el("line", { x1: x, y1: y - half, x2: x, y2: y + size + half }));
    if (!inside(row, col + 1)) out.push(el("line", { x1: x + size, y1: y - half, x2: x + size, y2: y + size + half }));
    if (!inside(row - 1, col)) out.push(el("line", { x1: x - half, y1: y, x2: x + size + half, y2: y }));
    if (!inside(row + 1, col)) out.push(el("line", { x1: x - half, y1: y + size, x2: x + size + half, y2: y + size }));
    return out;
  });

  const numberNodes = each((square, row, col) =>
    numbers[row]?.[col] && isLetterSquare(square)
      ? el("text", { x: x0(col) + 4 * k, y: y0(row) + 15 * k, ...at(row, col) }, [], numbers[row][col]!)
      : null,
  );

  // Labels in letter squares sit in the corner like numbers (after the number, if there is one); labels in voids
  // and blocks (margins, row letters) are centred.
  const labels = each((square, row, col) => {
    if (square.label === null) return null;
    if (isLetterSquare(square)) {
      const after = numbers[row]?.[col] && show.numbers ? (Array.from(numbers[row][col]!).length * 8 + 2) * k : 0;
      return el("text", { x: x0(col) + 4 * k + after, y: y0(row) + 15 * k, ...at(row, col) }, [], square.label);
    }
    return el("text", {
      x: x0(col) + size / 2, y: y0(row) + size / 2, "text-anchor": "middle", "dominant-baseline": "central",
      "font-size": 20 * k, fill: square.kind === "block" ? "white" : "black", ...at(row, col),
    }, [], square.label);
  });

  const answers = each((square, row, col) => {
    if (square.kind !== "cell" || !square.across) return null;
    const fontSize = answerFontSize(square.across, size);
    return el("text", {
      x: x0(col) + size / 2, y: y0(row) + size / 2, "dominant-baseline": "central",
      "font-size": fontSize === 24 * k ? null : fontSize, ...at(row, col),
    }, [], square.across);
  });

  const title = model.title;
  return el("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: `0 0 ${width * size + 2 * MARGIN * k} ${height * size + 2 * MARGIN * k}`,
    width: width * size + 2 * MARGIN * k,
    height: height * size + 2 * MARGIN * k,
    class: "bargrids",
    "data-rows": height,
    "data-cols": width,
    "data-size": size,
    "data-layer": layer,
  }, [
    ...(title ? [el("title", {}, [], title)] : []),
    ...group("squares", {}, backgrounds),
    ...group("shading", {}, shading),
    ...group("blocks", {}, blocks),
    ...group("circles", {}, circles),
    ...group("gridLines", { stroke: "black", "stroke-width": GRID_LINE * k }, gridLines),
    ...group("bars", { stroke: "black", "stroke-width": BAR * k }, bars),
    ...(show.bars ? group("barJoinCaps", { fill: "black" }, caps) : []),
    ...group("border", { stroke: "black", "stroke-width": BORDER * k }, border),
    ...group("numbers", { fill: "black", "font-family": options.numberFont ?? DEFAULT_FONT, "font-size": 14 * k }, numberNodes),
    ...group("labels", { fill: "black", "font-family": options.numberFont ?? DEFAULT_FONT, "font-size": 14 * k }, labels),
    ...group("answers", {
      fill: "black", "font-family": options.answerFont ?? DEFAULT_FONT, "font-size": 24 * k, "text-anchor": "middle",
    }, answers),
  ]);
}

/** The grid as SVG text. */
export function renderSvg(grid: Grid, options: RenderOptions = {}): string {
  return toSvgString(renderTree(grid, options)) + "\n";
}

/** The grid as an SVG element, for pages and editors. */
export function renderSvgElement(grid: Grid, options: RenderOptions = {}, document: Document = globalThis.document): SVGSVGElement {
  return toSvgElement(renderTree(grid, options), document) as SVGSVGElement;
}
