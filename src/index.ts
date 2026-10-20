// BarGrids 2: draw and edit barred and blocked puzzle grids in the hexword format.

export { Grid, MAX_SIZE, MIN_SIZE } from "./model/grid.js";
export type { ChangeEvent, Word } from "./model/grid.js";
export type { Command } from "./model/commands.js";
export { SYMMETRIES, barInside, symmetricBars, symmetryAllowed, toSymmetry } from "./model/symmetry.js";
export type { Symmetry } from "./model/symmetry.js";
export { contentToken, validContent } from "./model/tokens.js";
export type { BarPosition, Layer, Square, SquareKind, StyleProperties } from "./model/types.js";
export { LAYERS, answerFontSize, renderSvg, renderSvgElement, renderTree, shade } from "./render/render.js";
export type { LayerName, RenderOptions } from "./render/render.js";
export { toSvgString, type SvgNode } from "./render/svg-tree.js";
export { Editor, TOOLS } from "./editor/editor.js";
export type { Cursor, Direction, EditorChangeDetail, EditorOptions, Tool } from "./editor/editor.js";
export { hitTest, type Hit } from "./editor/hit.js";
export { marksOf, propertiesOf, toggleMark, type Mark } from "./editor/styles.js";
export { defineElements } from "./element/elements.js";
export type { BarGridsEditorElement, BarGridsViewerElement } from "./element/elements.js";
export { SYMMETRY_LABELS, TOOL_LABELS, createToolbar } from "./editor/toolbar.js";
export type { Toolbar, ToolbarOptions } from "./editor/toolbar.js";
export { appendClueText, createClueList } from "./editor/clue-list.js";
export type { ClueList, ClueListOptions } from "./editor/clue-list.js";
export { clueFor, hasClues, pathDirection, type ClueRef } from "./editor/clues.js";
