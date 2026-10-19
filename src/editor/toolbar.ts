// A ready-made toolbar for an Editor: tool buttons, symmetry, the shade level, the grid (puzzle or solution) and
// undo/redo. Plain buttons and selects with class names to style; it follows the editor, so changes made elsewhere
// (attributes, code) show in it too.

import { SYMMETRIES, symmetryAllowed, type Symmetry } from "../model/symmetry.js";
import type { Editor, Tool } from "./editor.js";

export const TOOL_LABELS: Record<Tool, string> = {
  letters: "Letters",
  bars: "Bars",
  blocks: "Blocks",
  voids: "Voids",
  circles: "Circles",
  shadedSquares: "Shaded squares",
  shadedCircles: "Shaded circles",
};

export const SYMMETRY_LABELS: Record<Symmetry, string> = {
  none: "None",
  "180": "180° rotation",
  "90": "90° rotation",
  "left-right": "Left-right mirror",
  "top-bottom": "Top-bottom mirror",
  "diagonal-backslash": "Diagonal \\",
  "diagonal-slash": "Diagonal /",
  plus: "Both mirrors",
  x: "Both diagonals",
  all: "All",
};

export interface ToolbarOptions {
  /** Which controls to show (default: all that apply to the editor's tools). */
  controls?: readonly ("tools" | "symmetry" | "shade" | "layer" | "undo")[];
}

export interface Toolbar {
  readonly element: HTMLElement;
  /** Update the controls from the editor (done on every change; call it after changing the editor yourself). */
  refresh(): void;
  /** Stop following the editor and remove the toolbar. */
  destroy(): void;
}

const SHADING: readonly Tool[] = ["shadedSquares", "shadedCircles"];

/** Make a toolbar for an editor. Put `toolbar.element` wherever it should go. */
export function createToolbar(editor: Editor, options: ToolbarOptions = {}): Toolbar {
  const doc = editor.element.ownerDocument;
  const controls = new Set(options.controls ?? ["tools", "symmetry", "shade", "layer", "undo"]);
  const make = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] => {
    const element = doc.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  // Options are made through the document, not the global Option, which belongs to one window.
  const option = (text: string, value: string): HTMLOptionElement => {
    const element = doc.createElement("option");
    element.textContent = text;
    element.value = value;
    return element;
  };
  const labelled = (text: string, control: HTMLElement, className: string): HTMLLabelElement => {
    const label = make("label", className, `${text} `);
    label.appendChild(control);
    return label;
  };

  const bar = make("div", "bargrids-toolbar");
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", "Grid tools");

  const toolButtons = new Map<Tool, HTMLButtonElement>();
  if (controls.has("tools") && editor.tools.length > 1) {
    const group = make("div", "bargrids-toolbar-tools");
    group.setAttribute("role", "group");
    for (const tool of editor.tools) {
      const button = make("button", "bargrids-toolbar-tool", TOOL_LABELS[tool]);
      button.type = "button";
      button.dataset.tool = tool;
      button.addEventListener("click", () => {
        editor.tool = tool;
        editor.element.focus();
      });
      toolButtons.set(tool, button);
      group.appendChild(button);
    }
    bar.appendChild(group);
  }

  let symmetry: HTMLSelectElement | null = null;
  if (controls.has("symmetry") && editor.tools.includes("bars")) {
    symmetry = make("select", "bargrids-toolbar-symmetry");
    for (const mode of SYMMETRIES) symmetry.add(option(SYMMETRY_LABELS[mode], mode));
    symmetry.addEventListener("change", () => (editor.symmetry = symmetry!.value as Symmetry));
    bar.appendChild(labelled("Symmetry", symmetry, "bargrids-toolbar-field"));
  }

  let shadeLabel: HTMLLabelElement | null = null;
  let shade: HTMLInputElement | null = null;
  let shadeValue: HTMLOutputElement | null = null;
  if (controls.has("shade") && editor.tools.some((tool) => SHADING.includes(tool))) {
    shade = make("input", "bargrids-toolbar-shade");
    Object.assign(shade, { type: "range", min: "0", max: "100", step: "5" });
    shadeValue = make("output", "bargrids-toolbar-shade-value");
    shade.addEventListener("input", () => (editor.shade = Number(shade!.value)));
    shadeLabel = labelled("Shade", shade, "bargrids-toolbar-field");
    shadeLabel.appendChild(shadeValue);
    bar.appendChild(shadeLabel);
  }

  let layer: HTMLSelectElement | null = null;
  if (controls.has("layer")) {
    layer = make("select", "bargrids-toolbar-layer");
    layer.add(option("Puzzle", "puzzle"));
    layer.add(option("Solution", "solution"));
    layer.addEventListener("change", () => (editor.layer = layer!.value as "puzzle" | "solution"));
    bar.appendChild(labelled("Grid", layer, "bargrids-toolbar-field"));
  }

  let undo: HTMLButtonElement | null = null;
  let redo: HTMLButtonElement | null = null;
  if (controls.has("undo")) {
    undo = make("button", "bargrids-toolbar-undo", "Undo");
    redo = make("button", "bargrids-toolbar-redo", "Redo");
    for (const [button, action] of [[undo, () => editor.undo()], [redo, () => editor.redo()]] as const) {
      button.type = "button";
      button.addEventListener("click", action);
      bar.appendChild(button);
    }
  }

  const refresh = (): void => {
    for (const [tool, button] of toolButtons) button.setAttribute("aria-pressed", String(tool === editor.tool));
    if (symmetry) {
      for (const each of Array.from(symmetry.options))
        each.disabled = !symmetryAllowed(each.value as Symmetry, editor.grid.width, editor.grid.height);
      symmetry.value = editor.symmetry;
    }
    if (shade && shadeLabel && shadeValue) {
      shade.value = String(editor.shade);
      shadeValue.textContent = `${editor.shade}%`;
      shadeLabel.hidden = !SHADING.includes(editor.tool);
    }
    if (layer) layer.value = editor.layer;
    if (undo && redo) {
      undo.disabled = !editor.grid.canUndo;
      redo.disabled = !editor.grid.canRedo;
    }
  };
  editor.addEventListener("change", refresh);
  editor.addEventListener("settings", refresh);
  refresh();

  return {
    element: bar,
    refresh,
    destroy() {
      editor.removeEventListener("change", refresh);
      editor.removeEventListener("settings", refresh);
      bar.remove();
    },
  };
}
