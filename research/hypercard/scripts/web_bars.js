// Replay bar clicks through the web app's own getSymmetricalBars and toggle logic.
// Usage: node web_bars.js <script.js>  < clicks.json  > result.json
// Input: {rows, cols, mode, clicks: [["across"|"down", row, col], ...]} (web app's 0-based indexing)
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

const input = JSON.parse(fs.readFileSync(0, "utf8"));
const puzzle = { rows: input.rows, cols: input.cols };
let mode = input.mode;
const getSymmetry = () => mode;
// eslint-disable-next-line no-eval
const createArray = eval(`(${grab("createArray")})`);
const getSymmetricalBars = eval(`(${grab("getSymmetricalBars")})`);

puzzle.across_bars = createArray(puzzle.rows, puzzle.cols);
puzzle.down_bars = createArray(puzzle.rows, puzzle.cols);

// Run the app's own setSymmetricalBars with the clicked bar's new state, as updateAcrossBars/updateDownBars do.
const createGrid = () => {};
const updateAcrossBar = eval(`(${grab("updateAcrossBar")})`);
const updateDownBar = eval(`(${grab("updateDownBar")})`);
const setSymmetricalBars = eval(`(${grab("setSymmetricalBars")})`);
console.log = () => {};
const errors = [];
for (const [dir, row, col, clickMode] of input.clicks) {
  if (clickMode) mode = clickMode;
  try {
    const grid = dir === "across" ? puzzle.across_bars : puzzle.down_bars;
    setSymmetricalBars(getSymmetricalBars(dir, row, col), !grid[row][col]);
  } catch (e) {
    errors.push(`${dir} ${row} ${col}: ${e.message}`);
  }
}

const on = (grid) => grid.flatMap((r, i) => r.map((v, j) => (v ? [i, j] : null))).filter(Boolean);
process.stdout.write(JSON.stringify({ across: on(puzzle.across_bars), down: on(puzzle.down_bars), errors }));
