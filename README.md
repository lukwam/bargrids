# BarGrids

Draw and edit barred and blocked puzzle grids: bars, blocks, voids, rebus squares, circles, shading and numbers.

Version 1, the editor at [lukwam.github.io/bargrids](https://lukwam.github.io/bargrids/), lives in [`docs/`](docs/).
Version 2 is being rewritten as a small TypeScript library that reads and writes the hexword puzzle format;
[DESIGN.md](DESIGN.md) describes it and what's built so far.

## Version 2 (in development)

```ts
import { Grid } from "bargrids";

const grid = Grid.fromHexword(yamlText);
grid.apply({ type: "toggleBar", side: "right", row: 0, col: 2, symmetry: "180" });
grid.apply({ type: "setContent", row: 1, col: 1, across: "ING" });
grid.undo();
const document = grid.toHexword();
```

Working on it needs the hexword format's JavaScript library built beside this repository
(`../hexword-format/js`, `npm run build` there), until the format is published.

```sh
npm install
npm test                 # unit and golden tests
npm run check            # type-check
npm run build            # dist/bargrids.js and type definitions
BARGRIDS_CORPUS=/path/to/puzzles npm test   # also round-trip a folder of real puzzles
npm run golden -- /path/to/bargrids-re/results   # rebuild tests/golden/symmetry.json from the symmetry probes
```
