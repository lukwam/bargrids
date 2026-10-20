// Run the web app's parseEPS on a file and summarize what it imported.
// Usage: node web_parse_eps.js <script.js> <file.eps>
const fs = require("fs");
const source = fs.readFileSync(process.argv[2], "utf8");
const grab = (name) => {
  const start = source.indexOf(`function ${name}(`);
  let depth = 0;
  for (let i = source.indexOf("{", start); i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}" && --depth === 0) return source.slice(start, i + 1);
  }
};
globalThis.puzzle = { bar_join_caps: false };
globalThis.createArray = eval(`(${grab("createArray")})`);
globalThis.initPuzzle = () => {
  for (const k of ["answers", "numbers", "across_bars", "down_bars", "blanks", "blocks", "circles", "shade_circles", "shade_squares"])
    puzzle[k] = createArray(puzzle.rows, puzzle.cols);
};
globalThis.createGrid = () => {};
globalThis.hideGridSizeControls = () => {};
console.log = () => {};
const parseEPS = eval(`(${grab("parseEPS")})`);
try {
  parseEPS(fs.readFileSync(process.argv[3], "latin1"));
} catch (e) {
  process.stdout.write(`ERROR: ${e.message}\n`);
}
const count = (g) => (g || []).flat().filter(Boolean).length;
process.stdout.write(JSON.stringify({
  title: puzzle.title, rows: puzzle.rows, cols: puzzle.cols,
  answer_rows: (puzzle.answers || []).length, first_row: (puzzle.answers || [])[0]?.join(""),
  numbers: count(puzzle.numbers), across_bars: count(puzzle.across_bars), down_bars: count(puzzle.down_bars),
  caps: puzzle.bar_join_caps, shade_squares: count(puzzle.shade_squares), shade_circles: count(puzzle.shade_circles),
  circles: count(puzzle.circles),
}) + "\n");
