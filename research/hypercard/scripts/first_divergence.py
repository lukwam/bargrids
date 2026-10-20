"""Find the first click where the web app and BarGrids disagree in mixed-mode sequences."""
import json
import random
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from compare_web import HARNESS, WEB_MODE, WEB_SCRIPT  # noqa: E402
from symmetry_probe import MODES, Grid  # noqa: E402


def web(n, clicks):
    out = subprocess.run(["node", str(HARNESS), str(WEB_SCRIPT)], capture_output=True, text=True, check=True,
                         input=json.dumps({"rows": n, "cols": n, "mode": "symmetry-none", "clicks": clicks}))
    res = json.loads(out.stdout)
    return {(r + 1, c) for r, c in res["across"]}, {(r, c + 1) for r, c in res["down"]}


rng = random.Random(11)
n = 9
shown = 0
for trial in range(20):
    g, clicks, log = Grid(n, n), [], []
    for k in range(25):
        sym = rng.randrange(10)
        before = g.bars()
        if rng.random() < .5:
            r, c = rng.randint(1, n), rng.randint(1, n - 1)
            g.click_vbar(r, c, sym); clicks.append(["across", r - 1, c, WEB_MODE[sym]]); what = f"V{(r, c)}"
        else:
            r, c = rng.randint(1, n - 1), rng.randint(1, n)
            g.click_hbar(r, c, sym); clicks.append(["down", r, c - 1, WEB_MODE[sym]]); what = f"H{(r, c)}"
        w = web(n, clicks)
        if w != g.bars():
            on = (what[0] == "V" and (r, c) in before[0]) or (what[0] == "H" and (r, c) in before[1])
            ov, oh = g.bars()
            print(f"trial {trial} click {k}: {what} mode {sym} {MODES[sym]}, clicked bar was {'on' if on else 'off'}")
            print("   original only:", sorted(("V", b) for b in ov - w[0]) + sorted(("H", b) for b in oh - w[1]))
            print("   web only:     ", sorted(("V", b) for b in w[0] - ov) + sorted(("H", b) for b in w[1] - oh))
            shown += 1
            break
    if shown >= 6:
        break
