"""Probe the BarGrids basebars XFCN: click one bar under each symmetry mode and draw the result."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from xfcn_emu import HyperCardHost  # noqa: E402

DISASM = Path(__file__).parent.parent / "disasm"
MODES = ["none", "180 rotation", "90 rotation", "left-right mirror", "top-bottom mirror",
         "diagonal / (symdiag1)", "diagonal \\ (symdiag2)", "plus (LR+TB)", "X (both diagonals)", "all"]


class Grid:
    def __init__(self, w, d):
        self.w, self.d = w, d
        self.bb = HyperCardHost((DISASM / "XFCN_Basebars.bin").read_bytes())
        self.vb = HyperCardHost((DISASM / "XFCN_Vbars.bin").read_bytes())
        self.hb = HyperCardHost((DISASM / "XFCN_Hbars.bin").read_bytes())
        blank = "\r".join([" " * w] * d) + "\r"
        self.vbars, self.hbars = blank, blank

    def click_vbar(self, row, left_col, sym):
        """Click the bar between left_col and left_col+1 on row (as the 'bar' handler does)."""
        self._click(str(row), f"{left_col},{left_col + 1}", sym)

    def click_hbar(self, upper_row, col, sym):
        """Click the bar between upper_row and upper_row+1 in col."""
        self._click(f"{upper_row},{upper_row + 1}", str(col), sym)

    def _click(self, row, col, sym):
        w, d = str(self.w), str(self.d)
        digits = self.bb.call(row, col, w, d, str(sym), self.vbars, self.hbars)
        self.vbars = self.vb.call(digits, w, d)
        self.hbars = self.hb.call(digits, w, d)

    def bars(self):
        v = self.vbars.split("\r")
        h = self.hbars.split("\r")
        vset = {(r + 1, c) for r in range(self.d) for c in range(1, self.w) if v[r][c] == "|"}
        hset = {(r + 1, c + 1) for r in range(self.d - 1) for c in range(self.w) if h[r][c] == "_"}
        return vset, hset

    def draw(self):
        vset, hset = self.bars()
        lines = ["+" + "---+" * self.w]
        for r in range(1, self.d + 1):
            row = "|"
            for c in range(1, self.w + 1):
                row += "   " + ("#" if (r, c) in vset or c == self.w else ":")
            lines.append(row)
            sep = "+"
            for c in range(1, self.w + 1):
                sep += ("###" if (r, c) in hset or r == self.d else "...") + "+"
            lines.append(sep)
        return "\n".join(lines)


def main():
    for w, d, sym_range in ((7, 7, range(10)), (7, 5, range(10))):
        print(f"\n################ {w} wide x {d} deep")
        for sym in sym_range:
            g = Grid(w, d)
            g.click_vbar(1, 2, sym)       # bar right of square (row 1, col 2)
            g.click_hbar(2, 1, sym)       # bar below square (row 2, col 1)
            vset, hset = g.bars()
            print(f"\n== symchoice {sym}: {MODES[sym]}  ->  vbars {sorted(vset)}  hbars {sorted(hset)}")
            print(g.draw())


if __name__ == "__main__":
    main()
