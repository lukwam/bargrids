"""Switch symmetry modes between clicks on one grid (where BarGrids' toggle rule matters)."""
import json
import random
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from compare_web import HARNESS, WEB_MODE, WEB_SCRIPT  # noqa: E402
from symmetry_probe import Grid  # noqa: E402


def main(script):
    rng = random.Random(11)
    bad = 0
    for _ in range(20):
        n = 9
        g, clicks = Grid(n, n), []
        for _ in range(25):
            sym = rng.randrange(10)
            if rng.random() < .5:
                r, c = rng.randint(1, n), rng.randint(1, n - 1)
                g.click_vbar(r, c, sym)
                clicks.append(["across", r - 1, c, WEB_MODE[sym]])
            else:
                r, c = rng.randint(1, n - 1), rng.randint(1, n)
                g.click_hbar(r, c, sym)
                clicks.append(["down", r, c - 1, WEB_MODE[sym]])
        out = subprocess.run(["node", str(HARNESS), script], capture_output=True, text=True, check=True,
                             input=json.dumps({"rows": n, "cols": n, "mode": "symmetry-none", "clicks": clicks}))
        res = json.loads(out.stdout)
        web = ({(r + 1, c) for r, c in res["across"]}, {(r, c + 1) for r, c in res["down"]})
        bad += web != g.bars()
    print(f"mixed-mode 9x9 grids, 25 clicks each: {bad}/20 differ from BarGrids")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else str(WEB_SCRIPT))
