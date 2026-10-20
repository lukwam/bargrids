// The demo: the editor beside its hexword document, both live. Edit the grid and watch the document change, or edit
// the document and watch the grid.

import { parse, stringify } from "yaml";

import { Editor, Grid, SYMMETRIES, TOOLS, createClueList, symmetryAllowed, type ClueList, type Tool } from "../src/index.js";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const SAMPLE = `format: hexword
version: "0.1"
title: Square Deal
grid:
  rows: [HEART, EMBER, ABUSE, RESIN, TREND]
  columns: [HEART, EMBER, ABUSE, RESIN, TREND]
settings:
  show_enumerations: answers
clues:
  - name: Across
    clues:
      - "1. Core of the earth, at heart ~ HEART"
      - "6. Glowing coal from the member ~ EMBER"
      - "7. Misuse ~ ABUSE"
      - "8. Sap ~ RESIN"
      - "9. Fashion ~ TREND"
  - name: Down
    clues:
      - "1. Centre of feeling ~ HEART"
      - "2. Ash ~ EMBER"
      - "3. Mistreat ~ ABUSE"
      - "4. Gum ~ RESIN"
      - "5. Direction ~ TREND"
`;

const TOOL_NAMES: Record<Tool, string> = {
  letters: "Letters", bars: "Bars", blocks: "Blocks", voids: "Voids", circles: "Circles",
  shadedSquares: "Shaded squares", shadedCircles: "Shaded circles",
};
const HINTS: Record<Tool, string> = {
  letters: "Click a square and type. Click it again or press Enter to turn. Insert starts a rebus; Enter ends it.",
  bars: "Click the line between two squares. Alt-click for a hidden bar (an answer boundary that isn't printed).",
  blocks: "Click a square to make it a block, or back.",
  voids: "Click a square to remove it from the grid, or put it back.",
  circles: "Click a square to circle it.",
  shadedSquares: "Click a square to shade it at the level of the Shade slider.",
  shadedCircles: "Click a square to put a shaded circle in it.",
};

let editor: Editor;
let clueList: ClueList | null = null;
let editingText = false;

function start(grid: Grid): void {
  const previous = editor;
  previous?.destroy();
  editor = new Editor($("editor"), {
    grid,
    tool: previous?.tool ?? "letters",
    symmetry: previous && symmetryAllowed(previous.symmetry, grid.width, grid.height) ? previous.symmetry : "180",
    shade: Number($<HTMLInputElement>("shade").value),
  });
  editor.addEventListener("change", showDocument);
  clueList?.destroy();
  clueList = createClueList(editor);
  $("clues").replaceChildren(clueList.element);
  $<HTMLInputElement>("width").value = String(grid.width);
  $<HTMLInputElement>("height").value = String(grid.height);
  updateControls();
  showDocument();
}

function showDocument(): void {
  if (!editingText) $<HTMLTextAreaElement>("document").value = stringify(editor.toHexword(), { lineWidth: 0 });
  const issues = editor.grid.issues();
  const status = $("status");
  status.textContent = issues.length ? issues.map((i) => `${i.level}: ${i.message}`).join(" · ") : "No issues.";
  status.classList.toggle("error", issues.some((i) => i.level === "error"));
  updateControls();
}

function updateControls(): void {
  for (const button of $("tools").querySelectorAll("button")) button.setAttribute("aria-pressed", String(button.dataset.tool === editor.tool));
  const symmetry = $<HTMLSelectElement>("symmetry");
  for (const option of symmetry.options) option.disabled = !symmetryAllowed(option.value as never, editor.grid.width, editor.grid.height);
  symmetry.value = editor.symmetry;
  $<HTMLSelectElement>("layer").value = editor.layer;
  $<HTMLButtonElement>("undo").disabled = !editor.grid.canUndo;
  $<HTMLButtonElement>("redo").disabled = !editor.grid.canRedo;
  $("hint").textContent = HINTS[editor.tool];
}

for (const tool of TOOLS) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.tool = tool;
  button.textContent = TOOL_NAMES[tool];
  button.addEventListener("click", () => {
    editor.tool = tool;
    updateControls();
    editor.element.focus();
  });
  $("tools").appendChild(button);
}
for (const mode of SYMMETRIES) $<HTMLSelectElement>("symmetry").add(new Option(mode, mode));
$("symmetry").addEventListener("change", (e) => (editor.symmetry = (e.target as HTMLSelectElement).value as never));
$("shade").addEventListener("input", (e) => {
  const value = Number((e.target as HTMLInputElement).value);
  editor.shade = value;
  $("shade-value").textContent = `${value}%`;
});
$("layer").addEventListener("change", (e) => {
  editor.layer = (e.target as HTMLSelectElement).value as never;
  showDocument();
});
for (const id of ["width", "height"])
  $(id).addEventListener("change", () => {
    try {
      editor.apply({ type: "resize", width: Number($<HTMLInputElement>("width").value), height: Number($<HTMLInputElement>("height").value) });
    } catch (error) {
      $("status").textContent = String(error);
    }
  });
$("undo").addEventListener("click", () => editor.undo());
$("redo").addEventListener("click", () => editor.redo());

const textarea = $<HTMLTextAreaElement>("document");
textarea.addEventListener("focus", () => (editingText = true));
textarea.addEventListener("blur", () => {
  editingText = false;
  showDocument();
});
textarea.addEventListener("input", () => {
  try {
    const doc = parse(textarea.value, { schema: "failsafe" });
    const grid = Grid.fromHexword(doc);
    if (grid.width < 2 || grid.height < 2) throw new Error("the grid needs at least 2 rows and 2 columns");
    start(grid);
  } catch (error) {
    $("status").textContent = `Can't read the document: ${(error as Error).message}`;
    $("status").classList.add("error");
  }
});

start(Grid.fromHexword(SAMPLE));
