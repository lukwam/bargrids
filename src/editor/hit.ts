// Which square, or which bar between squares, a point on the drawing is over. Pure geometry, in drawing units.

import type { BarPosition } from "../model/types.js";

export interface Hit {
  row: number;
  col: number;
  /** The interior edge the point is near, if any: within `tolerance` of a line between two squares. */
  bar: BarPosition | null;
}

const MARGIN = 4;

/**
 * The square under (x, y) and the bar it's near. Edges on the outside of the grid aren't bars. `size` is the square
 * size the grid was drawn at; `tolerance` how near an edge counts (version 1's bar targets were 10 wide, so 5).
 */
export function hitTest(x: number, y: number, width: number, height: number, size = 50, tolerance = 7): Hit | null {
  const k = size / 50;
  const gx = x - MARGIN * k;
  const gy = y - MARGIN * k;
  if (gx < 0 || gy < 0 || gx >= width * size || gy >= height * size) return null;
  const col = Math.floor(gx / size);
  const row = Math.floor(gy / size);
  const dx = gx - col * size;
  const dy = gy - row * size;
  const t = tolerance * k;
  const candidates: [number, BarPosition][] = [];
  if (dx < t && col > 0) candidates.push([dx, { side: "right", row, col: col - 1 }]);
  if (size - dx < t && col < width - 1) candidates.push([size - dx, { side: "right", row, col }]);
  if (dy < t && row > 0) candidates.push([dy, { side: "below", row: row - 1, col }]);
  if (size - dy < t && row < height - 1) candidates.push([size - dy, { side: "below", row, col }]);
  candidates.sort((a, b) => a[0] - b[0]);
  return { row, col, bar: candidates[0]?.[1] ?? null };
}
