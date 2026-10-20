// <bargrids-viewer> and <bargrids-editor>: the renderer and the editor as custom elements.
//
//   <bargrids-viewer src="puzzle.yaml" layer="solution"></bargrids-viewer>
//   <bargrids-editor src="puzzle.yaml" symmetry="180" tools="letters bars blocks" name="grid"></bargrids-editor>
//
// The document comes from `src`, from a <script type="application/yaml"> (or application/json) child, or from the
// `document` property. The classes are made by defineElements(), not at import, so servers can import the library
// without a DOM.

import { Editor, TOOLS, type EditorChangeDetail, type Tool } from "../editor/editor.js";
import { createClueList, type ClueList } from "../editor/clue-list.js";
import { hasClues } from "../editor/clues.js";
import { createToolbar, type Toolbar, type ToolbarOptions } from "../editor/toolbar.js";
import { Grid } from "../model/grid.js";
import { toSymmetry } from "../model/symmetry.js";
import type { Layer } from "../model/types.js";
import { LAYERS, renderSvgElement, type LayerName, type RenderOptions } from "../render/render.js";

type Source = Record<string, unknown> | string;

export interface BarGridsViewerElement extends HTMLElement {
  /** The hexword document shown: set it to show another. */
  document: Source | null;
  readonly grid: Grid | null;
}

export interface BarGridsEditorElement extends HTMLElement {
  document: Source | null;
  readonly grid: Grid | null;
  readonly editor: Editor | null;
  /** The edited document as JSON text, which is also the element's form value. */
  readonly value: string;
}

// The default look of the toolbar and clue lists, added to the page once. :where() keeps it easy to override.
const STYLES = `
:where(.bargrids-toolbar) { display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: center; margin-bottom: 8px; font: 14px/1.3 system-ui, sans-serif; }
:where(.bargrids-toolbar-tools) { display: flex; flex-wrap: wrap; gap: 4px; }
:where(.bargrids-toolbar button, .bargrids-toolbar select, .bargrids-toolbar input) { font: inherit; }
:where(.bargrids-toolbar button) { padding: 3px 8px; border: 1px solid #b8b8b8; border-radius: 4px; background: #fff; color: #222; cursor: pointer; }
:where(.bargrids-toolbar button[aria-pressed="true"]) { background: #222; border-color: #222; color: #fff; }
:where(.bargrids-toolbar button:disabled) { opacity: 0.45; cursor: default; }
:where(.bargrids-toolbar-shade) { vertical-align: middle; width: 90px; }
:where(.bargrids-layout) { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: flex-start; }
:where(.bargrids-layout > .bargrids-grid) { flex: 1 1 340px; min-width: 0; }
:where(.bargrids-layout > .bargrids-clues) { flex: 1 1 240px; min-width: 0; max-height: 80vh; overflow-y: auto; font: 14px/1.35 system-ui, sans-serif; }
:where(.bargrids-clue-group h3) { font-size: 14px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.04em; }
/* Layout the clue lists depend on, specific enough to hold against a host page's list and button styles. */
.bargrids-clues .bargrids-clue-list { list-style: none; margin: 0 0 12px; padding: 0; }
.bargrids-clues .bargrids-clue-list > .bargrids-clue { margin: 0; padding: 0; }
.bargrids-clues .bargrids-clue > button { all: unset; box-sizing: border-box; display: grid; grid-template-columns: 2.2em 1fr; column-gap: 6px; width: 100%; padding: 2px 4px; border-radius: 3px; cursor: pointer; text-align: left; }
:where(.bargrids-clue > button:focus-visible) { outline: 2px solid #4a7bd0; }
:where(.bargrids-clue[aria-current="true"] > button) { background: #fff3c4; }
:where(.bargrids-clue-number) { font-weight: 600; text-align: right; }
:where(.bargrids-clue-answer) { grid-column: 2; color: #777; font-size: 12px; letter-spacing: 0.03em; }
:where(.bargrids-clue-unlinked) { color: #888; }
:where(.bargrids-clue-problem .bargrids-clue-number)::after { content: " ⚠"; color: #c0392b; }
`;

function addStyles(document: Document): void {
  if (document.getElementById("bargrids-styles")) return;
  const style = document.createElement("style");
  style.id = "bargrids-styles";
  style.textContent = STYLES;
  document.head.appendChild(style);
}

/** Read toolbar="tools symmetry undo" (empty or "toolbar" means every control). */
function readToolbar(text: string): ToolbarOptions {
  const names = ["tools", "symmetry", "shade", "layer", "undo"] as const;
  const words = text.split(/[\s,]+/).filter((w): w is (typeof names)[number] => (names as readonly string[]).includes(w));
  return words.length ? { controls: words } : {};
}

/** Read show="answers -numbers" into layer switches: a name shows a layer, a leading minus hides it. */
function readShow(text: string | null): Partial<Record<LayerName, boolean>> {
  const out: Partial<Record<LayerName, boolean>> = {};
  for (const word of (text ?? "").split(/[\s,]+/).filter(Boolean)) {
    const name = word.replace(/^[-!]/, "");
    if ((LAYERS as readonly string[]).includes(name)) out[name as LayerName] = !/^[-!]/.test(word);
  }
  return out;
}

function inlineDocument(element: HTMLElement): string | null {
  const script = element.querySelector('script[type="application/yaml"], script[type="text/yaml"], script[type="application/json"]');
  return script?.textContent ?? null;
}

/** Define both elements (once); returns their classes. */
export function defineElements(registry: CustomElementRegistry = globalThis.customElements): {
  BarGridsViewer: CustomElementConstructor;
  BarGridsEditor: CustomElementConstructor;
} {
  const Base = globalThis.HTMLElement;
  if (!Base || !registry) throw new Error("custom elements need a browser (or a DOM such as happy-dom)");

  /** What both elements share: finding the document, loading src, reporting errors. */
  abstract class GridElement extends Base {
    protected source: Source | null = null;
    protected _grid: Grid | null = null;
    private loading = 0;
    private watcher: MutationObserver | null = null;

    static get observedAttributes(): string[] {
      return ["src", "layer", "size", "show"];
    }

    get document(): Source | null {
      return this._grid ? this._grid.toHexword() : this.source;
    }

    set document(value: Source | null) {
      this.source = value;
      this.loading += 1;
      this.load(value);
    }

    get grid(): Grid | null {
      return this._grid;
    }

    connectedCallback(): void {
      if (this.source !== null) return this.load(this.source);
      const src = this.getAttribute("src");
      if (src) return void this.fetchSource(src);
      const inline = inlineDocument(this);
      if (inline !== null) return this.load(inline);
      // While the page is still being parsed, the element is connected before its children arrive.
      const observer = new MutationObserver(() => {
        const text = inlineDocument(this);
        if (text === null || this.source !== null) return;
        observer.disconnect();
        this.load(text);
      });
      observer.observe(this, { childList: true, subtree: true, characterData: true });
      this.watcher = observer;
    }

    disconnectedCallback(): void {
      this.watcher?.disconnect();
      this.watcher = null;
    }

    attributeChangedCallback(name: string, before: string | null, after: string | null): void {
      if (before === after || !this.isConnected) return;
      if (name === "src" && after) void this.fetchSource(after);
      else this.update();
    }

    protected async fetchSource(src: string): Promise<void> {
      const ticket = ++this.loading;
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`${src}: ${response.status} ${response.statusText}`);
        const text = await response.text();
        if (ticket === this.loading) {
          this.source = text;
          this.load(text);
        }
      } catch (error) {
        if (ticket === this.loading) this.fail(error);
      }
    }

    protected load(source: Source | null): void {
      if (source === null) {
        this._grid = null;
        this.replaceChildren();
        return;
      }
      try {
        this._grid = Grid.fromHexword(source);
      } catch (error) {
        return this.fail(error);
      }
      this.update();
      this.dispatchEvent(new CustomEvent("load", { detail: { grid: this._grid } }));
    }

    protected fail(error: unknown): void {
      this._grid = null;
      this.dispatchEvent(new CustomEvent("error", { detail: { error } }));
      const message = this.ownerDocument.createElement("p");
      message.className = "bargrids-error";
      message.textContent = `BarGrids couldn't read the puzzle: ${error instanceof Error ? error.message : String(error)}`;
      this.replaceChildren(message);
    }

    protected renderOptions(): RenderOptions {
      const size = Number(this.getAttribute("size"));
      return {
        layer: (this.getAttribute("layer") === "solution" ? "solution" : "puzzle") as Layer,
        show: readShow(this.getAttribute("show")),
        ...(size > 0 ? { size } : {}),
      };
    }

    protected abstract update(): void;
  }

  class BarGridsViewer extends GridElement implements BarGridsViewerElement {
    protected update(): void {
      if (!this._grid) return;
      const svg = renderSvgElement(this._grid, this.renderOptions(), this.ownerDocument);
      svg.setAttribute("role", "img");
      svg.style.display = "block";
      svg.style.width = "100%";
      svg.style.height = "auto";
      this.replaceChildren(svg);
    }
  }

  class BarGridsEditor extends GridElement implements BarGridsEditorElement {
    static formAssociated = true;
    private _editor: Editor | null = null;
    private toolbar: Toolbar | null = null;
    private clueList: ClueList | null = null;
    private internals: ElementInternals | null = null;

    static get observedAttributes(): string[] {
      return [...GridElement.observedAttributes, "symmetry", "tool", "tools", "shade", "toolbar", "clues"];
    }

    constructor() {
      super();
      try {
        this.internals = this.attachInternals();
      } catch {
        this.internals = null;
      }
    }

    get editor(): Editor | null {
      return this._editor;
    }

    get value(): string {
      return this._grid ? JSON.stringify(this._grid.toHexword()) : "";
    }

    disconnectedCallback(): void {
      super.disconnectedCallback();
      this.stopEditor();
    }

    private stopEditor(): void {
      this.toolbar?.destroy();
      this.toolbar = null;
      this.clueList?.destroy();
      this.clueList = null;
      this._editor?.destroy();
      this._editor = null;
    }

    attributeChangedCallback(name: string, before: string | null, after: string | null): void {
      if (before === after || !this.isConnected) return;
      const editor = this._editor;
      if (editor && name === "symmetry") editor.symmetry = toSymmetry(after) ?? "none";
      else if (editor && name === "tool" && after && editor.tools.includes(after as Tool)) editor.tool = after as Tool;
      else if (editor && name === "shade") editor.shade = Number(after);
      else if (name !== "src") {
        // How the grid is drawn, which tools are offered, or the toolbar: start the editor again on the same grid.
        this.stopEditor();
        this.update();
      } else super.attributeChangedCallback(name, before, after);
    }

    protected update(): void {
      if (!this._grid) return;
      if (this._editor?.grid === this._grid) return;
      this.stopEditor();
      this.replaceChildren();
      const layout = this.ownerDocument.createElement("div");
      layout.className = "bargrids-layout";
      const holder = this.ownerDocument.createElement("div");
      holder.className = "bargrids-grid";
      layout.appendChild(holder);
      this.appendChild(layout);
      const tools = (this.getAttribute("tools") ?? "").split(/[\s,]+/).filter((t): t is Tool => (TOOLS as readonly string[]).includes(t));
      const options = this.renderOptions();
      const editor = new Editor(holder, {
        grid: this._grid,
        tools,
        tool: (this.getAttribute("tool") as Tool) ?? undefined,
        symmetry: toSymmetry(this.getAttribute("symmetry")) ?? "none",
        shade: this.hasAttribute("shade") ? Number(this.getAttribute("shade")) : undefined,
        layer: options.layer,
        render: { size: options.size, show: options.show },
      });
      editor.addEventListener("change", (event) => {
        this.internals?.setFormValue(this.value);
        const detail = (event as CustomEvent<EditorChangeDetail>).detail;
        this.dispatchEvent(new CustomEvent("change", { detail, bubbles: true }));
      });
      this._editor = editor;
      if (this.hasAttribute("toolbar")) {
        addStyles(this.ownerDocument);
        this.toolbar = createToolbar(editor, readToolbar(this.getAttribute("toolbar")!));
        this.insertBefore(this.toolbar.element, layout);
      }
      // Clue lists when the document has clues: clues="none" leaves them out, clues="text" leaves out the answers.
      const clues = this.getAttribute("clues");
      if (clues !== "none" && hasClues(this._grid.normalized())) {
        addStyles(this.ownerDocument);
        this.clueList = createClueList(editor, { answers: clues !== "text" });
        layout.appendChild(this.clueList.element);
      }
      this.internals?.setFormValue(this.value);
    }
  }

  if (!registry.get("bargrids-viewer")) registry.define("bargrids-viewer", BarGridsViewer);
  if (!registry.get("bargrids-editor")) registry.define("bargrids-editor", BarGridsEditor);
  return {
    BarGridsViewer: registry.get("bargrids-viewer")!,
    BarGridsEditor: registry.get("bargrids-editor")!,
  };
}
