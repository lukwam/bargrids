// @vitest-environment happy-dom
// Clue lists: the active clue follows the cursor, a click selects a clue's squares, unlinked clues are marked,
// and clue text keeps only the format's HTML.

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { Editor, Grid, appendClueText, clueFor, createClueList, defineElements, pathDirection, type BarGridsEditorElement } from "../src/index.js";

beforeAll(() => defineElements());
afterEach(() => document.body.replaceChildren());

// A 3x3 grid with a bar after the first square of the top row.
const DOC = {
  title: "Clued",
  version: "0.1",
  grid: { rows: ["C|AT", "ARE", "BED"], columns: ["CAB", "ARE", "TED"] },
  settings: { show_enumerations: "answers" },
  clues: [
    { name: "Across", clues: [
      { name: "2", clue_text: "Feline, <i>briefly</i><script>alert(1)</script>", answers: ["AT"] },
      { name: "4", clue_text: "Exist", answers: ["ARE"] },
      { name: "5", clue_text: "Bunk", answers: ["BED"] },
      { name: "6", clue_text: "Not in the grid", answers: ["DOG"] },
    ] },
    { name: "Down", clues: [
      { name: "1", clue_text: "Taxi", answers: ["CAB"] },
      { name: "2", clue_text: "Region", answers: ["ARE"] },
      { name: "3", clue_text: "Talk", answers: ["TED"] },
    ] },
    { name: "Extras", settings: { show_grid_entries: false }, clues: [{ name: "a", clue_text: "Theme", answers: ["CAT"] }] },
  ],
};

const setup = () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const editor = new Editor(host, { grid: Grid.fromHexword(DOC) });
  const list = createClueList(editor);
  document.body.appendChild(list.element);
  const item = (g: number, c: number) => list.element.querySelector<HTMLElement>(`[data-group="${g}"][data-clue="${c}"]`)!;
  const current = () => list.element.querySelector<HTMLElement>('[aria-current="true"]');
  const highlighted = () => Array.from(host.querySelectorAll(".bargrids-cursor rect")).length;
  return { editor, list, item, current, highlighted, host };
};

describe("finding clues", () => {
  it("knows which way a path runs", () => {
    expect(pathDirection([[0, 1], [0, 2]])).toBe("across");
    expect(pathDirection([[0, 1], [1, 1]])).toBe("down");
    expect(pathDirection([[0, 1], [1, 1], [1, 2]])).toBeNull();
    expect(pathDirection([[0, 1]])).toBeNull();
  });

  it("picks the clue in the cursor's direction, else any clue covering the square", () => {
    const model = Grid.fromHexword(DOC).normalized();
    expect(clueFor(model, 1, 1, "across")).toEqual({ group: 0, clue: 1 });
    expect(clueFor(model, 1, 1, "down")).toEqual({ group: 1, clue: 1 });
    expect(clueFor(model, 0, 0, "across")).toEqual({ group: 1, clue: 0 });
  });
});

describe("the clue list", () => {
  it("lists every group with its clues, numbers, enumerations and answers", () => {
    const { list } = setup();
    expect(Array.from(list.element.querySelectorAll("h3")).map((h) => h.textContent)).toEqual(["Across", "Down", "Extras"]);
    const first = list.element.querySelector(".bargrids-clue")!;
    expect(first.querySelector(".bargrids-clue-number")!.textContent).toBe("2");
    expect(first.querySelector(".bargrids-clue-text")!.textContent).toBe("Feline, briefly (2)");
    expect(first.querySelector(".bargrids-clue-answer")!.textContent).toBe("AT");
  });

  it("keeps the format's HTML in clue text and drops the rest", () => {
    const { list } = setup();
    const text = list.element.querySelector(".bargrids-clue-text")!;
    expect(text.querySelector("i")!.textContent).toBe("briefly");
    expect(text.querySelector("script")).toBeNull();
    const out = document.createElement("span");
    appendClueText(out, '<b onclick="x()">bold</b> <a href="javascript:x()">link</a> <span class="caps">S</span>');
    expect(out.innerHTML).toBe('<b>bold</b> link <span class="caps">S</span>');
  });

  it("marks the clue the cursor is in, following it across and down", () => {
    const { editor, current, highlighted } = setup();
    editor.setCursor(1, 1, "across");
    expect(current()!.dataset).toMatchObject({ group: "0", clue: "1" });
    expect(highlighted()).toBe(3);
    editor.setCursor(1, 1, "down");
    expect(current()!.dataset).toMatchObject({ group: "1", clue: "1" });
  });

  it("selects a clue's squares when it's clicked, switching to the letters tool", () => {
    const { editor, item, current, host } = setup();
    editor.tool = "bars";
    item(1, 2).querySelector("button")!.click();
    expect(editor.tool).toBe("letters");
    expect(editor.cursor).toEqual({ row: 0, col: 2, direction: "down" });
    expect(current()!.dataset).toMatchObject({ group: "1", clue: "2" });
    expect(host.querySelector(".bargrids-cursor")!.getAttribute("data-clue")).toBe("1:2");
  });

  it("keeps a chosen clue active while typing through its squares", () => {
    const { editor, item, current } = setup();
    item(0, 2).querySelector("button")!.click();
    editor.type("b");
    expect(current()!.dataset).toMatchObject({ group: "0", clue: "2" });
  });

  it("marks clues that aren't in the grid, telling a problem from a group that isn't linked", () => {
    const { item } = setup();
    expect(item(0, 3).classList.contains("bargrids-clue-problem")).toBe(true);
    expect(item(2, 0).classList.contains("bargrids-clue-unlinked")).toBe(true);
    expect(item(2, 0).classList.contains("bargrids-clue-problem")).toBe(false);
    item(0, 3).querySelector("button")!.click();
  });

  it("relinks when the grid changes", () => {
    const { editor, item } = setup();
    expect(item(0, 1).classList.contains("bargrids-clue-problem")).toBe(false);
    editor.apply({ type: "setContent", row: 1, col: 0, across: "X" });
    expect(item(0, 1).classList.contains("bargrids-clue-problem")).toBe(true);
  });

  it("stops following the editor when destroyed", () => {
    const { editor, list } = setup();
    list.destroy();
    expect(list.element.isConnected).toBe(false);
    editor.setCursor(2, 2);
  });
});

describe("<bargrids-editor> with clues", () => {
  const mount = async (attrs: string, doc: object = DOC) => {
    document.body.innerHTML = `<bargrids-editor ${attrs}></bargrids-editor>`;
    const element = document.body.firstElementChild as BarGridsEditorElement;
    element.document = doc as Record<string, unknown>;
    await new Promise((resolve) => setTimeout(resolve, 0));
    return element;
  };

  it("puts the clues beside the grid when the document has them", async () => {
    const element = await mount("");
    const layout = element.querySelector(".bargrids-layout")!;
    expect(Array.from(layout.children).map((c) => c.className)).toEqual(["bargrids-grid", "bargrids-clues"]);
    expect(document.getElementById("bargrids-styles")).not.toBeNull();
  });

  it("leaves them out without clues, with clues=none, and the answers with clues=text", async () => {
    expect((await mount("", { title: "Bare", grid: DOC.grid })).querySelector(".bargrids-clues")).toBeNull();
    expect((await mount('clues="none"')).querySelector(".bargrids-clues")).toBeNull();
    const text = await mount('clues="text"');
    expect(text.querySelector(".bargrids-clues")).not.toBeNull();
    expect(text.querySelector(".bargrids-clue-answer")).toBeNull();
  });

  it("never changes the clues when the grid is edited", async () => {
    const element = await mount("");
    element.editor!.apply({ type: "setKind", row: 2, col: 2, kind: "block" });
    expect(JSON.parse(element.value).clues).toEqual(DOC.clues);
  });
});
