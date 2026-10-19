// @vitest-environment happy-dom
// The ready-made toolbar, on its own and through <bargrids-editor toolbar>.

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { Editor, Grid, createToolbar, defineElements, type BarGridsEditorElement } from "../src/index.js";

beforeAll(() => defineElements());
afterEach(() => document.body.replaceChildren());

const setup = (tools?: Editor["tools"], grid = Grid.create(5, 5)) => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const editor = new Editor(host, { grid, tools });
  const toolbar = createToolbar(editor);
  document.body.prepend(toolbar.element);
  return { editor, toolbar, q: <T extends Element>(s: string) => toolbar.element.querySelector<T>(s)! };
};

describe("createToolbar", () => {
  it("has a button per tool and follows the selected tool", () => {
    const { editor, q, toolbar } = setup();
    expect(toolbar.element.querySelectorAll(".bargrids-toolbar-tool").length).toBe(7);
    q<HTMLButtonElement>('[data-tool="bars"]').click();
    expect(editor.tool).toBe("bars");
    expect(q('[data-tool="bars"]').getAttribute("aria-pressed")).toBe("true");
    editor.tool = "blocks";
    expect(q('[data-tool="blocks"]').getAttribute("aria-pressed")).toBe("true");
    expect(q('[data-tool="bars"]').getAttribute("aria-pressed")).toBe("false");
  });

  it("sets symmetry, disabling the modes the grid's shape doesn't allow", () => {
    const { editor, q } = setup(undefined, Grid.create(6, 4));
    const select = q<HTMLSelectElement>(".bargrids-toolbar-symmetry");
    const disabled = Array.from(select.options).filter((o) => o.disabled).map((o) => o.value);
    expect(disabled).toEqual(["90", "diagonal-backslash", "diagonal-slash", "x", "all"]);
    select.value = "plus";
    select.dispatchEvent(new Event("change"));
    expect(editor.symmetry).toBe("plus");
  });

  it("shows the shade slider only for the shading tools", () => {
    const { editor, q } = setup();
    const label = q<HTMLInputElement>(".bargrids-toolbar-shade").closest("label")!;
    expect(label.hidden).toBe(true);
    editor.tool = "shadedSquares";
    expect(label.hidden).toBe(false);
    const slider = q<HTMLInputElement>(".bargrids-toolbar-shade");
    slider.value = "60";
    slider.dispatchEvent(new Event("input"));
    expect(editor.shade).toBe(60);
    expect(q(".bargrids-toolbar-shade-value").textContent).toBe("60%");
  });

  it("undoes and redoes, enabling the buttons when there's something to do", () => {
    const { editor, q } = setup();
    const undo = q<HTMLButtonElement>(".bargrids-toolbar-undo");
    const redo = q<HTMLButtonElement>(".bargrids-toolbar-redo");
    expect([undo.disabled, redo.disabled]).toEqual([true, true]);
    editor.apply({ type: "setKind", row: 0, col: 0, kind: "block" });
    expect(undo.disabled).toBe(false);
    undo.click();
    expect(editor.grid.square(0, 0).kind).toBe("empty");
    expect(redo.disabled).toBe(false);
  });

  it("switches to the solution grid", () => {
    const { editor, q } = setup();
    const layer = q<HTMLSelectElement>(".bargrids-toolbar-layer");
    layer.value = "solution";
    layer.dispatchEvent(new Event("change"));
    expect(editor.layer).toBe("solution");
    expect(editor.grid.hasSolution).toBe(true);
  });

  it("leaves out controls that don't apply", () => {
    const { toolbar } = setup(["blocks"]);
    expect(toolbar.element.querySelector(".bargrids-toolbar-tools")).toBeNull();
    expect(toolbar.element.querySelector(".bargrids-toolbar-symmetry")).toBeNull();
    expect(toolbar.element.querySelector(".bargrids-toolbar-shade")).toBeNull();
  });

  it("stops following the editor when destroyed", () => {
    const { editor, toolbar } = setup();
    toolbar.destroy();
    expect(toolbar.element.isConnected).toBe(false);
    editor.tool = "bars";
  });

  it("drops a square-only symmetry when a resize makes the grid oblong", () => {
    const { editor, q } = setup();
    editor.symmetry = "90";
    editor.apply({ type: "resize", width: 5, height: 4 });
    expect(editor.symmetry).toBe("none");
    expect(q<HTMLSelectElement>(".bargrids-toolbar-symmetry").value).toBe("none");
  });
});

describe("<bargrids-editor toolbar>", () => {
  const YAML = 'title: T\ngrid:\n  rows: ["AB", "CD"]\n  columns: ["AC", "BD"]\n';
  const mount = async (attrs: string) => {
    document.body.innerHTML = `<bargrids-editor ${attrs}><script type="application/yaml">${YAML}</script></bargrids-editor>`;
    await new Promise((resolve) => setTimeout(resolve, 0));
    return document.body.firstElementChild as BarGridsEditorElement;
  };

  it("puts a toolbar above the grid, and its styles in the page once", async () => {
    const element = await mount('toolbar tools="letters bars blocks"');
    expect(element.firstElementChild!.className).toBe("bargrids-toolbar");
    expect(element.querySelectorAll(".bargrids-toolbar-tool").length).toBe(3);
    expect(document.querySelectorAll("#bargrids-toolbar-styles").length).toBe(1);
    element.querySelector<HTMLButtonElement>('[data-tool="blocks"]')!.click();
    expect(element.editor!.tool).toBe("blocks");
  });

  it("shows only the controls it names", async () => {
    const element = await mount('toolbar="tools undo"');
    expect(element.querySelector(".bargrids-toolbar-symmetry")).toBeNull();
    expect(element.querySelector(".bargrids-toolbar-undo")).not.toBeNull();
  });

  it("adds and removes the toolbar with the attribute", async () => {
    const element = await mount("");
    expect(element.querySelector(".bargrids-toolbar")).toBeNull();
    element.setAttribute("toolbar", "");
    expect(element.querySelectorAll(".bargrids-toolbar").length).toBe(1);
    element.removeAttribute("toolbar");
    expect(element.querySelector(".bargrids-toolbar")).toBeNull();
    expect(element.editor).not.toBeNull();
  });
});
