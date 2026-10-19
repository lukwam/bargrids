// @vitest-environment happy-dom
// The custom elements: where they find the document, attributes, events and the editor's form value.

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { defineElements, type BarGridsEditorElement, type BarGridsViewerElement } from "../src/index.js";

const YAML = 'title: T\ngrid:\n  rows: ["AB|C", "DEF", "GHI"]\n  columns: ["ADG", "BEH", "CFI"]\n';

beforeAll(() => defineElements());
afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
/** Put the HTML in the page and let the elements read their documents (inline ones may arrive after connecting). */
const mount = async <T extends HTMLElement>(html: string): Promise<T> => {
  document.body.innerHTML = html;
  await settle();
  return document.body.firstElementChild as T;
};

describe("<bargrids-viewer>", () => {
  it("defines the elements once", async () => {
    const first = defineElements();
    expect(defineElements().BarGridsViewer).toBe(first.BarGridsViewer);
    expect(customElements.get("bargrids-editor")).toBe(first.BarGridsEditor);
  });

  it("draws an inline YAML document", async () => {
    const viewer = await mount<BarGridsViewerElement>(`<bargrids-viewer layer="solution"><script type="application/yaml">${YAML}</script></bargrids-viewer>`);
    const svg = viewer.querySelector("svg")!;
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.querySelectorAll(".bargrids-answers text").length).toBe(9);
    expect(viewer.grid!.width).toBe(3);
  });

  it("loads src and reports the load", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(YAML)));
    const loaded = vi.fn();
    document.body.addEventListener("load", loaded, true);
    const viewer = await mount<BarGridsViewerElement>('<bargrids-viewer src="puzzle.yaml"></bargrids-viewer>');
    await settle();
    await settle();
    expect(fetch).toHaveBeenCalledWith("puzzle.yaml");
    expect(viewer.querySelector("svg")).not.toBeNull();
    expect(loaded).toHaveBeenCalled();
  });

  it("shows an error it can read when src fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 404, statusText: "Not Found" })));
    const failed = vi.fn();
    document.body.addEventListener("error", failed, true);
    const viewer = await mount<BarGridsViewerElement>('<bargrids-viewer src="missing.yaml"></bargrids-viewer>');
    await settle();
    await settle();
    expect(viewer.querySelector(".bargrids-error")!.textContent).toContain("404");
    expect(failed).toHaveBeenCalled();
  });

  it("takes a document property and follows attribute changes", async () => {
    const viewer = await mount<BarGridsViewerElement>("<bargrids-viewer></bargrids-viewer>");
    viewer.document = YAML;
    expect(viewer.querySelector(".bargrids-answers")).toBeNull();
    viewer.setAttribute("show", "answers -numbers");
    expect(viewer.querySelector(".bargrids-answers")).not.toBeNull();
    expect(viewer.querySelector(".bargrids-numbers")).toBeNull();
    viewer.setAttribute("size", "100");
    expect(viewer.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 316 316");
    viewer.document = null;
    expect(viewer.querySelector("svg")).toBeNull();
  });
});

describe("<bargrids-editor>", () => {
  it("numbers the grid from the clues when the document has them", async () => {
    const doc = {
      title: "Clued",
      grid: { rows: ["AB|C", "DEF", "GHI"], columns: ["ADG", "BEH", "CFI"] },
      clues: [
        { name: "Across", clues: [{ name: "4", answers: ["DEF"] }, { name: "9", label: "9a", answers: ["GHI"] }] },
        { name: "Down", clues: [{ name: "1", answers: ["ADG"] }] },
      ],
    };
    const element = await mount<BarGridsEditorElement>("<bargrids-editor></bargrids-editor>");
    element.document = doc;
    const numbers = Array.from(element.querySelectorAll(".bargrids-numbers text")).map((t) => [t.getAttribute("data-row"), t.getAttribute("data-col"), t.textContent]);
    expect(numbers).toEqual([["0", "0", "1"], ["1", "0", "4"], ["2", "0", "9a"]]);
  });

  it("edits the document with the tools and symmetry it's given", async () => {
    const element = await mount<BarGridsEditorElement>(`<bargrids-editor symmetry="180" tools="bars blocks"><script type="application/yaml">${YAML}</script></bargrids-editor>`);
    const editor = element.editor!;
    expect(editor.tools).toEqual(["bars", "blocks"]);
    expect(editor.symmetry).toBe("180");
    const changed = vi.fn();
    element.addEventListener("change", changed);
    editor.clickAt(54, 29);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(JSON.parse(element.value).grid.rows).toEqual(["A|B|C", "DEF", "GH|I"]);
  });

  it("changes tool, symmetry and shade from attributes without starting again", async () => {
    const element = await mount<BarGridsEditorElement>(`<bargrids-editor><script type="application/json">${JSON.stringify({ title: "J", grid: { rows: ["AB", "CD"], columns: ["AC", "BD"] } })}</script></bargrids-editor>`);
    const editor = element.editor!;
    element.setAttribute("tool", "blocks");
    element.setAttribute("symmetry", "1");
    element.setAttribute("shade", "60");
    expect(element.editor).toBe(editor);
    expect([editor.tool, editor.symmetry, editor.shade]).toEqual(["blocks", "180", 60]);
    element.setAttribute("tools", "voids");
    expect(element.editor).not.toBe(editor);
    expect(element.editor!.tools).toEqual(["voids"]);
  });

  it("lets go of the editor when removed", async () => {
    const element = await mount<BarGridsEditorElement>(`<bargrids-editor><script type="application/yaml">${YAML}</script></bargrids-editor>`);
    element.remove();
    expect(element.editor).toBeNull();
  });
});
