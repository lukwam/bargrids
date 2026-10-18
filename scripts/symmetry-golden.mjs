// Turn the BarGrids symmetry probes (the original basebars XFCN run under emulation) into tests/golden/symmetry.json.
//
//   node scripts/symmetry-golden.mjs [results-dir]
//
// The probes live in temp-experiment/bargrids-re/results. Positions there are 1-based (row, col); the JSON keeps them
// as printed, and the tests convert. "V" is a bar to the right of a square, "H" a bar below it.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? join(process.env.HOME, "src/temp-experiment/bargrids-re/results");
const pairs = (text) => [...text.matchAll(/\((\d+), (\d+)\)/g)].map((m) => [Number(m[1]), Number(m[2])]);

// symmetry_probe2.txt: one click per case.
const singles = [];
let section = null;
for (const line of readFileSync(join(dir, "symmetry_probe2.txt"), "utf8").split("\n")) {
  const head = line.match(/^(\d+)x(\d+)[^,]*, (?:single click: )?bar (right of|below) (?:square )?\((\d+),(\d+)\)/);
  if (head) {
    section = { width: Number(head[1]), height: Number(head[2]), side: head[3] === "right of" ? "right" : "below",
      row: Number(head[4]), col: Number(head[5]) };
    continue;
  }
  if (!/^\S/.test(line) || !line.trim()) {
    const m = section && line.match(/^\s+(\d)\s+.*?V=(\[.*?\]) H=(\[.*?\])/);
    if (m) singles.push({ ...section, mode: Number(m[1]), right: pairs(m[2]), below: pairs(m[3]) });
    continue;
  }
  section = null;
}

// symmetry_probe.txt: two clicks per case, bar right of (1,2) then bar below (2,1), on 7x7 and 7x5.
const sequences = [];
let size = null;
for (const line of readFileSync(join(dir, "symmetry_probe.txt"), "utf8").split("\n")) {
  const head = line.match(/^#+ (\d+) wide x (\d+) deep/);
  if (head) size = { width: Number(head[1]), height: Number(head[2]) };
  const m = line.match(/^== symchoice (\d+): .*?->\s+vbars (\[.*?\])\s+hbars (\[.*?\])/);
  if (m && size)
    sequences.push({ ...size, mode: Number(m[1]),
      clicks: [{ side: "right", row: 1, col: 2 }, { side: "below", row: 2, col: 1 }],
      right: pairs(m[2]), below: pairs(m[3]) });
}

const out = {
  source: "temp-experiment/bargrids-re/results/symmetry_probe.txt and symmetry_probe2.txt: BarGrids' basebars XFCN under emulation",
  positions: "1-based [row, col]; right = bar to the right of the square, below = bar below it",
  singles,
  sequences,
};
const list = (cases) => "[\n" + cases.map((c) => "    " + JSON.stringify(c)).join(",\n") + "\n  ]";
const text = `{\n  "source": ${JSON.stringify(out.source)},\n  "positions": ${JSON.stringify(out.positions)},\n` +
  `  "singles": ${list(singles)},\n  "sequences": ${list(sequences)}\n}\n`;
writeFileSync(new URL("../tests/golden/symmetry.json", import.meta.url), text);
console.log(`${singles.length} single clicks, ${sequences.length} two-click sequences`);
