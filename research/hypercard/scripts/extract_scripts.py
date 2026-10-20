"""Extract HyperTalk scripts and field text from HyperCard 2.x stacks."""
import struct
import sys
from pathlib import Path

PART_TYPES = {1: "button", 2: "field"}


def cstr(data, off, end):
    """Read a NUL-terminated Mac Roman string; return (text, offset after NUL)."""
    nul = data.find(b"\0", off, end)
    if nul < 0:
        nul = end
    return data[off:nul].decode("mac_roman").replace("\r", "\n"), nul + 1


def parse_parts(data, off, count):
    parts = []
    for _ in range(count):
        size, pid, ptype, _flags = struct.unpack(">HhBB", data[off:off + 6])
        top, left, bottom, right = struct.unpack(">hhhh", data[off + 6:off + 14])
        end = off + size
        name, p = cstr(data, off + 30, end)
        # HyperCard pads the name with an extra NUL before the script.
        if p < end and data[p] == 0:
            p += 1
        script, _ = cstr(data, p, end)
        parts.append({
            "id": pid, "type": PART_TYPES.get(ptype, f"type{ptype}"),
            "name": name, "rect": (left, top, right, bottom), "script": script,
        })
        off = end
    return parts, off


def parse_contents(data, off, count):
    contents = {}
    for _ in range(count):
        pid, length = struct.unpack(">hH", data[off:off + 4])
        body = data[off + 4:off + 4 + length]
        if body:
            (head,) = struct.unpack(">H", body[:2])
            text = body[head & 0x7FFF:] if head & 0x8000 else body[1:]
            contents[pid] = text.decode("mac_roman").replace("\r", "\n")
        off += 4 + length + (length & 1)
    return contents, off


def parse_layer(data, off, is_card):
    """Parse a CARD or BKGD block starting at its header."""
    btype = data[off + 4:off + 8].decode()
    (bid,) = struct.unpack(">i", data[off + 8:off + 12])
    (bsize,) = struct.unpack(">I", data[off:off + 4])
    end = off + bsize
    if is_card:
        bkgd_id, nparts = struct.unpack(">iH", data[off + 0x24:off + 0x2A])
        (ncontents,) = struct.unpack(">H", data[off + 0x30:off + 0x32])
        p = off + 0x36
    else:
        bkgd_id = None
        (nparts,) = struct.unpack(">H", data[off + 0x24:off + 0x26])
        (ncontents,) = struct.unpack(">H", data[off + 0x2C:off + 0x2E])
        p = off + 0x32
    parts, p = parse_parts(data, p, nparts)
    contents, p = parse_contents(data, p, ncontents)
    name, p = cstr(data, p, end)
    script, _ = cstr(data, p, end)
    return {"kind": btype, "id": bid, "bkgd": bkgd_id, "name": name,
            "script": script, "parts": parts, "contents": contents}


def parse_stack(data):
    stack_script, _ = cstr(data, 0x600, struct.unpack(">I", data[:4])[0])
    layers = []
    off = 0
    while off + 8 <= len(data):
        size, btype = struct.unpack(">I4s", data[off:off + 8])
        if btype in (b"CARD", b"BKGD"):
            layers.append(parse_layer(data, off, btype == b"CARD"))
        if btype == b"TAIL" or size < 8:
            break
        off += size
    return stack_script, layers


def render(stack_name, stack_script, layers):
    out = [f"######## STACK {stack_name}", "", "=== stack script", stack_script, ""]
    for layer in layers:
        label = f'{layer["kind"]} id {layer["id"]}'
        if layer["name"]:
            label += f' "{layer["name"]}"'
        if layer["bkgd"] is not None:
            label += f' (bkgd {layer["bkgd"]})'
        out.append(f"######## {label}")
        if layer["script"].strip():
            out += ["=== script", layer["script"], ""]
        for part in layer["parts"]:
            if part["script"].strip():
                out += [f'=== {part["type"]} {part["id"]} "{part["name"]}" rect={part["rect"]}',
                        part["script"], ""]
        for pid, text in layer["contents"].items():
            if text.strip():
                # Negative ids are the card's own fields; positive ids are background fields.
                owner = f"card field {-pid}" if pid < 0 else f"bkgd field {pid}"
                out += [f"--- text of {owner}", text, ""]
        out.append("")
    return "\n".join(out)


def main(src_dir, out_dir):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    for f in sorted(p for p in Path(src_dir).iterdir() if p.is_file()):
        stack_script, layers = parse_stack(f.read_bytes())
        (out_dir / f"{f.name}.txt").write_text(render(f.name, stack_script, layers))
        nscripts = sum(bool(l["script"].strip()) + sum(bool(p["script"].strip()) for p in l["parts"])
                       for l in layers) + bool(stack_script.strip())
        print(f"{f.name}: {len(layers)} cards/bkgds, {nscripts} scripts")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
