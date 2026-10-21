"""Write the puzzles in a Hex CMS `dumpdata` backup as hexword documents, for BarGrids' corpus test.

    python3 scripts/corpus-from-cms.py backup.json /path/to/corpus
    BARGRIDS_CORPUS=/path/to/corpus npx vitest run tests/corpus.test.ts

The corpus is real puzzles, so it stays outside the repository. Reads either the old puzzle pages or the newer
puzzle editions, whichever the backup holds.
"""
import json
import pathlib
import re
import sys
from collections import defaultdict

PUZZLES = {"puzzles.puzzlepage", "puzzles.puzzleedition"}
GROUP_SETTINGS = ["show_grid_labels", "show_grid_entries", "reverse_grid_entries", "show_enumerations"]


def lines(text):
    return [line for line in (text or "").split("\n") if line.strip()]


def parent(fields):
    return fields.get("edition", fields.get("page"))


def main(src, out):
    out = pathlib.Path(out)
    out.mkdir(parents=True, exist_ok=True)
    data = json.load(open(src))
    groups, clues = defaultdict(list), defaultdict(list)
    for record in data:
        if record["model"] == "puzzles.cluegroup":
            groups[parent(record["fields"])].append(record["fields"])
        elif record["model"] == "puzzles.clue":
            clues[parent(record["fields"])].append(record["fields"])
    count = 0
    for record in data:
        if record["model"] not in PUZZLES:
            continue
        f, pk = record["fields"], record["pk"]
        grid = {"rows": lines(f.get("grid_rows")), "columns": lines(f.get("grid_columns"))}
        if lines(f.get("grid_style")):
            grid["style"] = lines(f["grid_style"])
        if f.get("grid_styles"):
            grid["styles"] = f["grid_styles"]
        out_groups = []
        for g in groups[pk]:
            listed = []
            for c in clues[pk]:
                if c.get("group") != g["name"]:
                    continue
                raw = c.get("answers") or "[]"
                answers = [a["value"] for a in (json.loads(raw) if isinstance(raw, str) else raw)]
                clue = {"name": c["name"], "clue_text": re.sub(r"<[^>]+>", "", c.get("clue_text") or ""),
                        "answers": [a["answer"] for a in answers]}
                if any(a.get("entry") for a in answers):
                    clue["entries"] = [a.get("entry") or a["answer"] for a in answers]
                if c.get("label"):
                    clue["label"] = c["label"]
                if c.get("label_index"):
                    clue["label_index"] = c["label_index"]
                listed.append(clue)
            # Group settings belong under `settings` (hexword SPEC §5.3).
            settings = {key: g[key] for key in GROUP_SETTINGS if g.get(key) not in (None, "")}
            out_groups.append({"name": g["name"], "settings": settings, "clues": listed})
        doc = {"title": f.get("title") or str(pk), "grid": grid,
               "settings": {**(f.get("settings") or {}), "show_grid_bars": f.get("show_grid_bars", "all")}}
        if out_groups:
            doc["clues"] = out_groups
        if lines(f.get("unclued")):
            doc["unclued"] = lines(f["unclued"])
        (out / f"{pk}.json").write_text(json.dumps(doc, ensure_ascii=False))
        count += 1
    print(count, "documents")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
