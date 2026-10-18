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

Status: milestone 1 (the model) built on the `v2` branch; the rest is design, for review. Version 1 stays live until
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

## 7. Using it

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/bargrids@2/dist/bargrids.js"></script>
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
