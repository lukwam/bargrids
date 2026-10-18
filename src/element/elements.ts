// <bargrids-viewer> and <bargrids-editor>: the renderer and the editor as custom elements.
//
//   <bargrids-viewer src="puzzle.yaml" layer="solution"></bargrids-viewer>
//   <bargrids-editor src="puzzle.yaml" symmetry="180" tools="letters bars blocks" name="grid"></bargrids-editor>
//
// The document comes from `src`, from a <script type="application/yaml"> (or application/json) child, or from the
// `document` property. The classes are made by defineElements(), not at import, so servers can import the library
// without a DOM.

import { Editor, TOOLS, type EditorChangeDetail, type Tool } from "../editor/editor.js";
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
    private internals: ElementInternals | null = null;

    static get observedAttributes(): string[] {
      return [...GridElement.observedAttributes, "symmetry", "tool", "tools", "shade"];
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
        // How the grid is drawn or which tools are offered: start the editor again on the same grid.
        this._editor?.destroy();
        this._editor = null;
        this.update();
      } else super.attributeChangedCallback(name, before, after);
    }

    protected update(): void {
      if (!this._grid) return;
      if (this._editor?.grid === this._grid) return;
      this._editor?.destroy();
      this.replaceChildren();
      const holder = this.ownerDocument.createElement("div");
      this.appendChild(holder);
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
