"""Inspect HyperCard stack data forks and their AppleDouble resource forks."""
import struct
import sys
from collections import Counter
from pathlib import Path


def stack_blocks(data):
    """Walk the top-level blocks of a HyperCard stack data fork."""
    blocks = Counter()
    off = 0
    while off + 8 <= len(data):
        size, btype = struct.unpack(">I4s", data[off:off + 8])
        if size < 8:
            break
        blocks[btype.decode("mac_roman")] += 1
        if btype == b"TAIL":
            break
        off += size
    return blocks


def apple_double(data):
    """Return (finder_info, resource_fork_bytes) from an AppleDouble file."""
    magic, _version = struct.unpack(">II", data[:8])
    if magic != 0x00051607:
        return None, None
    (count,) = struct.unpack(">H", data[24:26])
    finfo = rfork = None
    for i in range(count):
        eid, off, length = struct.unpack(">III", data[26 + i * 12:38 + i * 12])
        if eid == 9:
            finfo = data[off:off + length]
        elif eid == 2:
            rfork = data[off:off + length]
    return finfo, rfork


def resources(rf):
    """List (type, id, name, size) for every resource in a resource fork."""
    data_off, map_off = struct.unpack(">II", rf[:8])
    m = rf[map_off:]
    type_list_off, name_list_off = struct.unpack(">HH", m[24:28])
    tl = m[type_list_off:]
    (ntypes,) = struct.unpack(">H", tl[:2])
    out = []
    for t in range(ntypes + 1):
        rtype, n, ref_off = struct.unpack(">4sHH", tl[2 + t * 8:10 + t * 8])
        for r in range(n + 1):
            ref = tl[ref_off + r * 12:ref_off + r * 12 + 12]
            rid, name_off = struct.unpack(">hH", ref[:4])
            doff = int.from_bytes(ref[5:8], "big")
            (size,) = struct.unpack(">I", rf[data_off + doff:data_off + doff + 4])
            name = ""
            if name_off != 0xFFFF:
                p = name_list_off + name_off
                name = m[p + 1:p + 1 + m[p]].decode("mac_roman")
            out.append((rtype.decode("mac_roman"), rid, name, size))
    return out


def main(folder):
    folder = Path(folder)
    for f in sorted(p for p in folder.iterdir() if p.is_file()):
        data = f.read_bytes()
        print(f"== {f.name} ({len(data)} bytes)")
        print("   stack blocks:", dict(stack_blocks(data)))
        ad = folder / "__MACOSX" / f"._{f.name}"
        if not ad.exists():
            print("   no AppleDouble file")
            continue
        finfo, rfork = apple_double(ad.read_bytes())
        if finfo:
            print(f"   type/creator: {finfo[:4].decode('mac_roman')}/{finfo[4:8].decode('mac_roman')}")
        if rfork:
            res = resources(rfork)
            print(f"   resource fork: {len(rfork)} bytes, {len(res)} resources")
            for rtype, rid, name, size in res:
                print(f"     {rtype} {rid:>6} {size:>7}  {name}")


if __name__ == "__main__":
    main(sys.argv[1])
