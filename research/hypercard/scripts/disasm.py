"""Dump named code resources from a stack's AppleDouble resource fork and disassemble them."""
import struct
import sys
from pathlib import Path

import capstone

sys.path.insert(0, str(Path(__file__).parent))
from stackinfo import apple_double  # noqa: E402


def resource_data(rf, want):
    """Return {(type, name): bytes} for resources whose name is in want."""
    data_off, map_off = struct.unpack(">II", rf[:8])
    m = rf[map_off:]
    type_list_off, name_list_off = struct.unpack(">HH", m[24:28])
    tl = m[type_list_off:]
    (ntypes,) = struct.unpack(">H", tl[:2])
    out = {}
    for t in range(ntypes + 1):
        rtype, n, ref_off = struct.unpack(">4sHH", tl[2 + t * 8:10 + t * 8])
        for r in range(n + 1):
            ref = tl[ref_off + r * 12:ref_off + r * 12 + 12]
            _rid, name_off = struct.unpack(">hH", ref[:4])
            if name_off == 0xFFFF:
                continue
            p = name_list_off + name_off
            name = m[p + 1:p + 1 + m[p]].decode("mac_roman")
            if name.lower() in want:
                doff = data_off + int.from_bytes(ref[5:8], "big")
                (size,) = struct.unpack(">I", rf[doff:doff + 4])
                out[(rtype.decode(), name)] = rf[doff + 4:doff + 4 + size]
    return out


def main(apple_double_path, out_dir, *names):
    _, rf = apple_double(Path(apple_double_path).read_bytes())
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    md = capstone.Cs(capstone.CS_ARCH_M68K, capstone.CS_MODE_BIG_ENDIAN | capstone.CS_MODE_M68K_000)
    for (rtype, name), code in resource_data(rf, {n.lower() for n in names}).items():
        (out_dir / f"{rtype}_{name}.bin").write_bytes(code)
        lines = []
        off = 0
        while off < len(code):
            insns = list(md.disasm(code[off:], off))
            for i in insns:
                lines.append(f"{i.address:05x}  {i.bytes.hex():<20} {i.mnemonic} {i.op_str}")
            off = insns[-1].address + insns[-1].size if insns else off
            if off < len(code):
                lines.append(f"{off:05x}  {code[off:off + 2].hex():<20} dc.w")
                off += 2
        (out_dir / f"{rtype}_{name}.s").write_text("\n".join(lines) + "\n")
        print(f"{rtype} {name}: {len(code)} bytes, {len(lines)} lines")


if __name__ == "__main__":
    main(*sys.argv[1:])
