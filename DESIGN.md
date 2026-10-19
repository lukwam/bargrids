# BarGrids 2: design

BarGrids 2 is a rewrite of BarGrids as a small, dependency-free TypeScript library for drawing, editing and (later)
playing rectangular puzzle grids: bars, blocks, voids, rebus squares, circles, shading and numbers. It reads and
writes the open **hexword** puzzle format (the working name; see "Open questions"), so the same component serves:

1. **The Hex CMS**, where it is the visual grid editor beside the text editor;
2. **The free demo** on GitHub Pages (today's BarGrids site), rebuilt on the library;
3. **Any developer** who wants to show, edit or (later) play hexword grids in their own app.

The first BarGrids (docs/script.js) was written to learn JavaScript and SVG by rebuilding Mike Shenk's HyperCard
BarGrids (1991-95), which Emily Cox and Henry Rathvon used for decades. It is now the specification: version 2 keeps
every feature and look, with the original's behaviour recovered by reverse engineering (see "Symmetry").

Status: milestones 1 (the model), 2 (the renderer), 3 (the editor) and 4 (the elements) built on the `v2` branch; the rest is design, for review. Version 1 stays live until
version 2 matches it.

---

## 1. Principles

- **The format is the data.** The component edits a hexword document's grid; it holds nothing the format can't
  carry. Anything it needs that the format lacks becomes a format proposal, not private state.
- **Layers, each usable alone.** A pure model (no DOM), an SVG renderer, an editor, and a custom element on top.
  A server can use the model and renderer to make images; an app can use the editor without the element.
- **No runtime dependencies** besides the hexword format library (for reading, writing and validating documents),
  so the two implementations of the format never disagree.
- **Looks like BarGrids.** Same proportions, bar weights, join caps, fonts and shading as version 1 (and the
  HyperCard original's printed EPS), so a puzzle drawn in either looks the same.
- **What the solver can see.** When it plays puzzles (later), it highlights and moves only by what's visible
  (hexword SPEC §10c and the group `navigation` setting, OQ-11).
- **Written for strangers.** README, examples, CHANGELOG, CONTRIBUTING and tests to the standard of
  nytimes-games and atlantic-games; MIT licence.

## 2. Architecture

```
src/
  model/     the grid: squares, bars, blocks, voids, rebus, circles, shading, numbers; symmetry; numbering;
             undo/redo; conversion to and from a hexword document. Pure TypeScript, no DOM.
  render/    the grid as SVG (elements or a string): layers, bar join caps, fonts, shading; export SVG.
  editor/    tools, pointer and keyboard input, selection, symmetry when placing bars; emits changes.
  element/   <bargrids-editor> and <bargrids-viewer> custom elements wrapping the above.
  io/        importers and exporters: hexword (YAML/JSON), BarGrids 1 JSON, BarGrids EPS, SVG, Crossword
             Compiler XML.
demo/        the GitHub Pages site, built from the library.
tests/       unit tests per layer, golden tests (symmetry vectors, rendered SVG), the format's fixtures.
```

Builds (Vite, library mode): an ES module with type definitions (`dist/bargrids.js`, `dist/*.d.ts`) for bundlers
and the CMS, and a single file for a `<script>` tag (`dist/bargrids.min.js`, also served by jsDelivr from each
release tag). Small enough that a publisher's page can embed it without worrying about framework versions.

## 3. The model

A `Grid` is width x depth squares (2 to 25 each, as BarGrids Big; larger if nothing breaks). Each square has:

| Property | Values | hexword |
|---|---|---|
| kind | letter square, block, void (blank), empty | `#`, `_`, `.` tokens |
| content | one or more characters (rebus: `10`, `1000`, `NG`), separately across and down when they differ | `[NG]` tokens; rows vs columns |
| bar right / bar below | bool, separately for the puzzle grid and the solution grid; hidden bars | `\|` in rows / columns; `show_puzzle_bars`, `show_solution_bars`; entry rows |
| number | text or none (auto-numbered or set by hand) | labels |
| circle | bool | style mask |
| shaded square, shaded circle | 0-100 % | style mask + styles |

Operations are commands (set content, toggle bar, set kind, shade, number...) applied through one `apply()`, so
undo/redo, change events and collaborative editing later all have one path. Numbering follows the format (a square
starts a word across or down), with manual numbers kept.

**Conversion.** `Grid.fromHexword(doc)` and `grid.toHexword()` go through the hexword JS library's `normalize()`,
so the grid and the format's checks always agree; everything the model can't represent is kept and written back
untouched.

**As built (milestone 1).**
- `Grid` holds the puzzle squares, an optional solution grid, and the styles. Squares mirror the normalized model's
  cells in camelCase (`kind`, `across`, `down`, `barRight`, `barBelow`, `hiddenBarRight`, `hiddenBarBelow`, `style`,
  `label`). Labels and hidden bars live on the puzzle grid and the solution shares them, as in the format.
- Commands: `setContent`, `setKind`, `setBar` (printed or hidden), `toggleBar` (the BarGrids click, with symmetry),
  `setStyle`, `defineStyle`, `setLabel`, `resize`, `addSolution`, `removeSolution` and `batch`. A failed command
  leaves the grid as it was; one that changes nothing isn't recorded. Undo steps keep copies of the state.
- **Numbers aren't stored.** `grid.numbers()` places them as the format does, by linking clues (SPEC §5.4); a grid
  without clues is numbered the usual way. `grid.words()` and `grid.issues()` come from the same `normalize()`.
- Writing replaces only the grid keys. An unedited grid gives back its document unchanged; lines whose tokens didn't
  change keep their spacing; styles that weren't edited are written exactly as they were. Version 0's implicit
  styles and style-mask labels become explicit `styles` and `labels`, which read the same in both versions.
  Invalid grids are repaired on writing (rows decide a square's kind, as readers must).
- Sizes are 2 to 25 for `create` and `resize`; larger documents still read.
- Tests: the probes' 25 single clicks and 15 two-click sequences, the probes' special cases, closure of every mode
  on several sizes, the format's fixtures round-tripped, and a corpus test (`BARGRIDS_CORPUS=folder`) that passed
  on the 484 grids entered in the Hex CMS so far.

## 4. Symmetry

Mode names in the API: `none`, `180`, `90`, `left-right`, `top-bottom`, `diagonal-backslash`, `diagonal-slash`,
`plus`, `x`, `all` (`SYMMETRIES[n]` is basebars' choice n; `toSymmetry()` reads either). BarGrids' "diagonal \\"
swaps the top-left and bottom-right corners.

The ten modes of BarGrids' `basebars` XFCN, recovered by running it under emulation (temp-experiment
bargrids-re/results/symmetry_probe*.txt):

| # | Mode | Square grids | Non-square |
|---|---|---|---|
| 0 | none | yes | yes |
| 1 | 180° rotation | yes | yes |
| 2 | 90° rotation | yes | no |
| 3 | left-right mirror | yes | yes |
| 4 | top-bottom mirror | yes | yes |
| 5 | diagonal \ | yes | no |
| 6 | diagonal / | yes | no |
| 7 | plus (3 + 4) | yes | yes |
| 8 | X (5 + 6) | yes | no |
| 9 | all | yes | no |

Rules, all from the probes: a click toggles the clicked bar, and its partners are set to the clicked bar's **new**
state (not toggled), so a partner already present stays; a bar on an axis is its own partner; bars on the outer edge
can't be placed. The probe tables become the model's golden tests (each click, each mode, 7x7, 8x8, 9x6).
Version 1 matches the original on every probe except mode 2 on non-square grids, which the original doesn't offer.

## 5. Rendering

Proportions from version 1 (in units of a 50-unit square): grid lines 1, bars 8, border 1 (as drawn), bar join
caps filling the corners where bars meet, letters 24 (rebus shrinking 20, 16, 12, 10 by length), numbers 14 in the
corner, shading as grey levels from a percentage. Layers can be shown or hidden one by one (answers, bars, blocks,
grid lines, numbers, circles, shading), as in version 1. Output is clean SVG with named groups, scalable and
printable; the CMS and the PDF generator can use it in place of their own renderers once it matches them.

**As built (milestone 2).** `renderSvg(grid, options)` gives SVG text, `renderSvgElement()` DOM elements and
`renderTree()` the drawing as data, all from one tree. Geometry is version 1's, read from `docs/script.js`: a
4-unit margin, bars 4 wide on the square's edge, 4x4 join caps where a vertical and a horizontal bar meet, a 4-unit
border along the edges next to voids or the outside (lengthened so corners close), numbers of 14 at (4, 15) in the
square, letters of 24 centred and shrinking 20, 16, 12, 10. Grid lines are 1 wide. (The design's "bars 8" was the
bar-joins button; version 1 draws its grid with 4.) Styles are read as the Hex renderer reads them:
`background-color` fills the square, `shape: shadesquare` shades it (`fill`, else the background, else light grey),
`shape: circle` draws a filled circle for `fill` and an outline for `stroke` (or a plain black outline, as version
1's circles, when neither is given), `shape: x` a grey cross, `opacity` applies to the shape. Labels in letter
squares go in the corner after the number; labels in voids and blocks (margins, row letters) are centred. Layers:
squares, shading, blocks, circles, gridLines, bars, hiddenBars, barJoinCaps, border, numbers, labels, answers. Their defaults
follow the document's settings (`show_puzzle_bars` / `show_solution_bars`, `show_grid_lines`, `show_grid_border`,
`show_grid_labels`); answers show on the solution grid only; `show` overrides any of them. Elements carry
`data-row`/`data-col` (and bars `data-side`) for the editor; there are no ids, so several grids can share a page.
Hidden bars are drawn only when the `hiddenBars` layer is asked for (the editor does): faint, dashed and blue.

## 6. The editor

The clue lists sit beside the grid while editing, linked both ways: the cursor's square, its word and its clue are
highlighted together, and choosing a clue selects its squares (as PuzzleMe's editor does). Version 1's tools, each
a mode: **letters** (typing moves on; rebus squares hold several characters), **bars**
(click a square's edge; symmetry applies), **numbers** (by hand, or auto-number), **blocks**, **blanks** (voids),
**circles**, **shaded squares**, **shaded circles** (with a level). Plus: undo/redo, keyboard movement, grid size,
layer visibility, and the bar join caps toggle. Later tools: **link squares** into an answer's path (the format's
`cells`: Rectangular's rectangles, rings, scattered squares; PuzzleMe has a link/unlink tool for the same idea) and
**split squares** (the format's OQ-10, diagonal or straight, as in Mixed Doubles). Accessible: every tool reachable from the keyboard, the grid exposed
to screen readers as a table of squares.

**As built (milestone 3).** `new Editor(element, {document | grid, tools, tool, symmetry, shade, layer})` draws the
grid into the element with the renderer and redraws on every change; `editor.toHexword()` gives the document and a
`change` event follows every edit, undo and redo. Tools: **letters**, **bars**, **blocks**, **voids**, **circles**,
**shadedSquares** and **shadedCircles**.
- Letters: click a square (again, or Enter, to turn); typing fills and moves on; Backspace clears or goes back;
  Delete clears; arrows move and turn; Insert starts a rebus, Enter ends it, Escape drops it. The cursor's square
  and word are highlighted, the word ending at printed or hidden bars.
- Bars: click near the line between two squares (7 units either side); symmetry applies as in BarGrids; Alt-click
  sets a hidden bar.
- Circles and shading combine into one style per square, since a square has one style key: shading is the
  square's `background-color` (the shade slider's grey), a circle is `shape: circle` with `stroke: black`, a
  shaded circle adds `fill`. A style with the same properties is reused; otherwise a new one-character key is made.
- Ctrl/Cmd-Z undoes, Ctrl/Cmd-Shift-Z and Ctrl-Y redo. `layer: "solution"` edits the solution grid (adding one).
- Not yet: the **numbers** tool (see "Hand-set numbers" below; numbers follow the clues or are automatic), the
  clue lists beside the grid, and the screen-reader table.

A development demo (`npm run demo`, `demo/`) has the toolbar, the editor and the live hexword document; editing the
document redraws the grid. It was checked in headless Chromium (bars with symmetry, marks, typing, rebus, resize,
undo, document edits). Milestone 4 turns it into the public demo on the custom elements.

## 7. Using it

```html
<script src="https://cdn.jsdelivr.net/npm/bargrids@2/dist/bargrids.min.js"></script>
<bargrids-viewer src="puzzle.yaml"></bargrids-viewer>
<bargrids-editor src="puzzle.yaml" symmetry="180"></bargrids-editor>
```

```ts
import { Editor } from "bargrids";

const editor = new Editor(element, { document: hexwordDoc, symmetry: "180", tools: ["letters", "bars"] });
editor.addEventListener("change", () => save(editor.toHexword()));
```

**One schema.** The component reads and writes hexword documents and nothing else of its own. (A suggestion to give
it a separate cell matrix with bars on all four sides of each square was rejected: two sides per bar can contradict
each other, which is why the format stores bars only to the right of and below a square, and clue lists in the
format aren't limited to Across and Down.)

**As built (milestone 4).** `dist/bargrids.min.js` is one file (138 kB, 45 kB gzipped; most of it is the YAML
parser) that defines both elements and puts the library on `window.BarGrids`; `dist/bargrids.js` is the ES module
for bundlers, which defines nothing until `defineElements()` is called, so servers can import it without a DOM.
- Both elements read the document from `src`, from a `<script type="application/yaml">` (or JSON) child, or from
  the `document` property; they send `load`, and `error` with a readable message in place of the grid. Attributes:
  `layer` (`puzzle` or `solution`), `size`, and `show` (`"answers -numbers"`: names show layers, a minus hides).
- `<bargrids-editor>` adds `symmetry` (a name or BarGrids' number), `tools`, `tool` and `shade`; it sends `change`,
  exposes `.editor`, and is form-associated: inside a `<form>` with a `name`, it submits the edited document as JSON.
  That is the hook for the CMS widget.
- `toolbar` on `<bargrids-editor>` adds a ready-made toolbar above the grid: tool buttons, symmetry (square-only
  modes disabled on oblong grids), the shade slider (shown with the shading tools), puzzle or solution grid, and
  undo/redo. `toolbar="tools undo"` picks controls. Its default styles go in the page once, inside `:where()` so a
  page's own CSS wins. `createToolbar(editor)` gives the same toolbar for an `Editor` used without the element.
- Clue numbers come from the document's clues (their `name`, or `label`), linked to the grid as SPEC §5.4 says; a
  document with no clues is numbered automatically. A host that wants its own numbers sends its clue groups along.
- `examples/elements.html` shows a viewer pair and an editor in a form; it was checked in headless Chromium.
- The public demo on GitHub Pages still serves version 1 (`docs/`); replacing it is for when version 2 matches it.

**In the Hex CMS:** the Grid tab gets a Text / Visual switch; Visual mounts the editor on the stored grid and writes
back to the same fields, so either can be used and the other stays in step. The CMS pins a release.

## 8. Importing and exporting

hexword YAML and JSON (read and write); BarGrids 1 JSON saves (read, so old files open); BarGrids EPS (read, as
version 1 does); SVG (write; read version 1's SVGs); Crossword Compiler XML (write, as version 1).

**ipuz** (read and write), the existing open crossword interchange format, which carries bars as per-square styles.
It lets any app that already reads ipuz show Hex puzzles at once, and move to hexword for what ipuz can't say (rebus
squares with different letters across and down, paths, hidden bars, the solver-visibility rules). The conversion
lives in the hexword libraries (Python and JS, at parity), so the CMS can export ipuz too; BarGrids uses it.

## 9. Testing and releases

- Unit tests per layer (Vitest); golden tests: the symmetry vectors, rendered SVG snapshots, and every hexword
  fixture round-tripped through the model; the 198-puzzle corpus round-tripped where it can be (kept outside the
  repo, as the format does).
- CI: lint, type-check, test, build, and a check that the demo builds. Releases to npm from tags, with a CHANGELOG
  and semantic versioning (2.0.0 when it matches version 1).

## 10. Milestones

1. Model + golden symmetry tests + hexword conversion.
2. Renderer, matching version 1's SVG.
3. Editor with version 1's tools.
4. Custom elements; the demo site on the library (version 1 retired). The demo shows the grid beside its hexword
   document, both live: edit the grid and watch the document change, or edit the document and watch the grid, so a
   developer learns the format by using it.
5. The CMS widget (Text / Visual).
6. Later: the player (solving), with navigation by what the solver can see, keyboard and phone input.

## 11. Open questions

- **The format's name** (hexword or variety) and its published JS package: BarGrids depends on it, so the format
  library needs a public repository and npm release first.
- **Squares with different letters across and down** (Merger Mania): how to show and edit them (split squares, as
  the format's OQ-10 discusses for split-square puzzles?).
- **Paths** (Rectangular's rectangles, rings): view-only highlighting first; editing paths later.
- **Hand-set numbers.** Version 1's numbers tool sets a square's number by hand; in the format, numbers come only
  from clues (a clue's `name`, `label` and `position`). In the CMS the clues are there, so numbers follow them. For
  the standalone editor, either the numbers tool writes clue stubs (a name and a `position`, no text yet), or the
  format gains a place for printed numbers. The first needs no format change.
- **The hexword dependency** is `file:../hexword-format/js` until the format has a repository and an npm release.
- **The one-file `<script>` build** (`bargrids.min.js` with hexword and its YAML parser inside) comes with the
  custom elements (milestone 4); for now the build is an ES module that imports `hexword`.
