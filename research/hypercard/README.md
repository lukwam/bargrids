# BarGrids under HyperCard: reverse engineering

BarGrids began as a HyperCard stack by Mike Shenk (1991–95), which Emily Cox and Henry Rathvon used for decades
to make their barred grids. Version 1 of this repository rebuilt it for the web, and version 2 keeps its behaviour.
This folder is the record of how that behaviour was recovered: the scripts that read the stacks and ran their
compiled bar-symmetry code under emulation, and what they found.

**The originals aren't here.** The HyperCard stacks, the HyperTalk extracted from them, the compiled XFCNs and
their disassembly, and the sample EPS grids are archived privately; this repository is public and they aren't ours
to publish. The scripts below read them from paths beside the scripts (`../extracted`, `../disasm`, `../samples`),
so they run only where the archive has been restored.

| Path | What it is |
|---|---|
| `scripts/stackinfo.py`, `extract_scripts.py` | Parse the HyperCard stack format and AppleDouble resource forks, and extract the scripts. |
| `scripts/disasm.py` | Disassembles the XFCN code resources with Capstone. |
| `scripts/xfcn_emu.py` | Runs a classic Mac XFCN under Unicorn (a 68030 emulator) with a fake HyperCard host. |
| `scripts/symmetry_probe.py` | Clicks bars through the real Basebars code and draws the result for each of the 10 symmetry modes. |
| `scripts/compare_web.py`, `web_bars.js`, `mixed_modes.py`, `first_divergence.py` | Compare version 1's bar logic (`docs/script.js`) with the original on random clicks. |
| `scripts/web_parse_eps.js` | Runs version 1's `parseEPS` on an EPS file and summarizes what it imported. |
| `browser/check.js` | Playwright checks of version 1 in headless Chromium (it needs a sample EPS from the archive). |
| `results/symmetry_probe.txt`, `symmetry_probe2.txt` | The probes' output: every mode, single clicks and two-click sequences, the toggle rule, bars on an axis, edge clicks. `tests/golden/symmetry.json` is made from these by `scripts/symmetry-golden.mjs` at the repository root. |
| `results/compare_web.txt` | Version 1 against the original: identical in every mode except 90° rotation on non-square grids, which the original doesn't offer. |
| `BarGridsDoc.txt` | Lukas's own notes on BarGrids: what the original does, and version 1's components. |

## Running the scripts

```bash
uv venv venv && uv pip install --python venv/bin/python capstone==5.0.6 unicorn==2.1.1
venv/bin/python scripts/compare_web.py       # needs node, this repository, and the archived disasm/
```

- **unicorn:** use 2.1.1; 2.0.1 needs distutils.
- **The emulator** sets the CPU to a 68030, since Unicorn's default m68k CPU is a ColdFire and can't run this code.
- **check.js** needs `npm install playwright@1.64.1`.
- The scripts look for version 1 at `~/src/bargrids/docs/script.js`; change `WEB_SCRIPT` in `compare_web.py` if the
  repository is elsewhere.

## A labelling slip

`symmetry_probe.py` labels mode 5 "diagonal /" and mode 6 "diagonal \\", but its saved outputs
(`symmetry_probe.txt`, `symmetry_probe2.txt`) call mode 5 "diagonal \\". The "\\" there most likely came from a
side question being explored at the time (whether any puzzle splits a square's two entries with \\ rather than /;
split squares are the format's OQ-10), not from the stacks. The bar results are the same whichever name is used.
Geometrically, mode 5 mirrors across a "/" line (bottom-left to top-right), so version 2 calls it `diagonal-slash`
and mode 6 `diagonal-backslash`. The stacks' popup menu remains the authority for what BarGrids called them.
