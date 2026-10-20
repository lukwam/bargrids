"""Compare the web app's bar symmetry with the original BarGrids XFCNs on identical click sequences."""
import json
import random
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from symmetry_probe import MODES, Grid  # noqa: E402

WEB_SCRIPT = Path.home() / "src/bargrids/docs/script.js"
HARNESS = Path(__file__).parent / "web_bars.js"
# original symchoice -> web app radio id
WEB_MODE = ["symmetry-none", "symmetry-rotate-180", "symmetry-rotate-90", "symmetry-mirror-h",
            "symmetry-mirror-v", "symmetry-mirror-u", "symmetry-mirror-d", "symmetry-mirror-4h",
            "symmetry-mirror-4d", "symmetry-mirror-8"]


def web(rows, cols, mode, clicks):
    out = subprocess.run(["node", str(HARNESS), str(WEB_SCRIPT)], capture_output=True, text=True,
                         input=json.dumps({"rows": rows, "cols": cols, "mode": mode, "clicks": clicks}),
                         check=True)
    res = json.loads(out.stdout)
    # web across_bars[r][c] = bar left of 0-based square (r,c) = V(r+1, c); down_bars[r][c] = H(r, c+1)
    v = {(r + 1, c) for r, c in res["across"]}
    h = {(r, c + 1) for r, c in res["down"]}
    return v, h, res["errors"]


def run(w, d, sym, nclicks, rng):
    g = Grid(w, d)
    clicks = []
    for _ in range(nclicks):
        if rng.random() < .5:
            r, c = rng.randint(1, d), rng.randint(1, w - 1)
            g.click_vbar(r, c, sym)
            clicks.append(["across", r - 1, c])
        else:
            r, c = rng.randint(1, d - 1), rng.randint(1, w)
            g.click_hbar(r, c, sym)
            clicks.append(["down", r, c - 1])
    wv, wh, errors = web(d, w, WEB_MODE[sym], clicks)
    ov, oh = g.bars()
    return (ov, oh), (wv, wh), errors, clicks


def main():
    rng = random.Random(7)
    print("Single clicks (one click per run): does the web app pick the same partner bars?")
    for w, d in ((7, 7), (8, 8), (9, 6)):
        for sym in range(10):
            if w != d and sym not in (0, 1, 3, 4, 7, 2):
                continue
            bad = errs = 0
            for _ in range(40):
                orig, webres, errors, _ = run(w, d, sym, 1, rng)
                errs += bool(errors)
                bad += orig != webres
            print(f"  {w}x{d} mode {sym} {MODES[sym]:<22} mismatches {bad:>2}/40  errors {errs}")
    print("\nClick sequences (20 clicks per run): does the final grid match?")
    for w, d in ((7, 7), (11, 11), (9, 6)):
        for sym in (range(10) if w == d else (0, 1, 3, 4, 7)):
            bad = 0
            for _ in range(15):
                orig, webres, _, clicks = run(w, d, sym, 20, rng)
                if orig != webres:
                    bad += 1
            print(f"  {w}x{d} mode {sym} {MODES[sym]:<22} grids differ {bad:>2}/15")


if __name__ == "__main__":
    main()
