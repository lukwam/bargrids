// The clue lists beside the grid, read-only: each group's clues, the active clue marked, and a click on a clue
// selecting its squares. It follows the editor, so it relinks as the grid changes.

import { clueAt, sameClue, type ClueRef } from "./clues.js";
import type { Editor } from "./editor.js";

export interface ClueListOptions {
  /** Show each clue's answers after its text, for checking a transcription (default true). */
  answers?: boolean;
}

export interface ClueList {
  readonly element: HTMLElement;
  refresh(): void;
  destroy(): void;
}

// The HTML the format allows in clue text (hexword SPEC §8); anything else is reduced to its text.
const ALLOWED = new Set(["b", "i", "em", "strong", "u", "sup", "sub", "br", "p", "span"]);
// Elements whose content isn't text to show.
const DROPPED = new Set(["script", "style", "template", "noscript", "iframe", "object", "svg", "math"]);

/** Copy text with the format's limited HTML into `into`, building new elements so nothing else can get through. */
export function appendClueText(into: HTMLElement, html: string): void {
  const doc = into.ownerDocument;
  const template = doc.createElement("template");
  template.innerHTML = html;
  const copy = (from: Node, to: Node): void => {
    for (const node of Array.from(from.childNodes)) {
      if (node.nodeType === 3) to.appendChild(doc.createTextNode(node.textContent ?? ""));
      else if (node.nodeType === 1) {
        const tag = (node as Element).tagName.toLowerCase();
        if (DROPPED.has(tag)) continue;
        if (!ALLOWED.has(tag)) {
          copy(node, to);
          continue;
        }
        const element = doc.createElement(tag);
        const className = tag === "span" ? (node as Element).getAttribute("class") : null;
        if (className) element.className = className;
        copy(node, element);
        to.appendChild(element);
      }
    }
  };
  copy(template.content, into);
}

/** Make the clue lists for an editor. Put `list.element` wherever it should go (beside the grid). */
export function createClueList(editor: Editor, options: ClueListOptions = {}): ClueList {
  const doc = editor.element.ownerDocument;
  const root = doc.createElement("div");
  root.className = "bargrids-clues";
  const items = new Map<string, HTMLElement>();
  const key = (ref: ClueRef) => `${ref.group}:${ref.clue}`;
  let active: ClueRef | null = null;

  const build = (): void => {
    items.clear();
    root.replaceChildren();
    const model = editor.grid.normalized();
    const PROBLEMS = ["clue.unlinked", "clue.cells_invalid", "clue.position_invalid"];
    const problems = model.issues.filter((i) => PROBLEMS.includes(i.code)).map((i) => i.path);
    model.clues.forEach((group, g) => {
      if (!group.clues.length) return;
      const section = doc.createElement("section");
      section.className = "bargrids-clue-group";
      const heading = doc.createElement("h3");
      heading.textContent = group.name;
      section.appendChild(heading);
      const list = doc.createElement("ol");
      const enumerate = group.settings.show_enumerations !== "none";
      group.clues.forEach((clue, c) => {
        const item = doc.createElement("li");
        item.className = "bargrids-clue";
        item.dataset.group = String(g);
        item.dataset.clue = String(c);
        const linked = clue.cells.length > 0;
        if (!linked) {
          item.classList.add("bargrids-clue-unlinked");
          // A clue the checks couldn't place, rather than one in a group that isn't linked on purpose.
          const at = `clues[${g}].clues[${c}]`;
          const problem = problems.some((path) => path === at || path.startsWith(`${at}.`));
          item.title = problem ? "No matching squares in the grid" : "Not linked to the grid";
          if (problem) item.classList.add("bargrids-clue-problem");
        }
        const button = doc.createElement("button");
        button.type = "button";
        const number = doc.createElement("span");
        number.className = "bargrids-clue-number";
        number.textContent = `${clue.starred ? "*" : ""}${clue.name}${clue.suffix ?? ""}`;
        const text = doc.createElement("span");
        text.className = "bargrids-clue-text";
        appendClueText(text, clue.clue_text);
        if (enumerate && clue.enumerations.length) text.appendChild(doc.createTextNode(` (${clue.enumerations.join("; ")})`));
        button.append(number, text);
        if (options.answers ?? true) {
          const answer = doc.createElement("span");
          answer.className = "bargrids-clue-answer";
          answer.textContent = clue.answers.join(" / ");
          button.appendChild(answer);
        }
        button.addEventListener("click", () => {
          editor.selectClue({ group: g, clue: c });
          editor.element.focus();
        });
        item.appendChild(button);
        list.appendChild(item);
        items.set(key({ group: g, clue: c }), item);
      });
      section.appendChild(list);
      root.appendChild(section);
    });
    active = null;
    mark();
  };

  const mark = (): void => {
    const ref = editor.activeClue;
    if (sameClue(ref, active) && (ref === null) === (active === null)) return;
    if (active) items.get(key(active))?.removeAttribute("aria-current");
    active = ref;
    const item = ref && clueAt(editor.grid.normalized(), ref) ? items.get(key(ref)) : undefined;
    if (!item) return;
    item.setAttribute("aria-current", "true");
    if (typeof item.scrollIntoView === "function") item.scrollIntoView({ block: "nearest" });
  };

  const onChange = (): void => build();
  const onCursor = (): void => mark();
  editor.addEventListener("change", onChange);
  editor.addEventListener("cursor", onCursor);
  editor.addEventListener("settings", onCursor);
  build();

  return {
    element: root,
    refresh: build,
    destroy() {
      editor.removeEventListener("change", onChange);
      editor.removeEventListener("cursor", onCursor);
      editor.removeEventListener("settings", onCursor);
      root.remove();
    },
  };
}
