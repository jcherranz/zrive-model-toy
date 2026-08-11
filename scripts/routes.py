#!/usr/bin/env python3
"""Read the populate registry out of a shipped instance document and say what it declares.

Issue 72. The card asked for a machine-readable adapter registry, and the only proof that a
document is machine readable is a machine reading it. So this reads site/instance.js, the bytes
the page loads, and answers from those bytes alone: which classes a source adapter could be
attached to, which ones no adapter can exist for and why, and what has actually been built.

WHAT IT IS NOT. It is not an adapter and it must not become one. It opens no socket, holds no
credential and knows the name of no system it does not read out of the file. It imports nothing
from build/, on purpose: importing the model would prove that the model can read itself, which
was never in doubt. What is in doubt is whether the DOCUMENT carries enough to work from, and
the only way to test that is to work from the document.

Usage:
  scripts/routes.py                     read site/instance.js
  scripts/routes.py path/to/instance.js read another document of the same shape
  scripts/routes.py --vocab             also print the vocabularies the document ships

Exit: 0 the registry is complete and every object binds to it, 1 it is not.
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PREFIX, SUFFIX = "window.GI=", ";\n"


def load(path):
    """The instance document, out of the one-line assignment the page loads."""
    txt = path.read_text(encoding="utf-8")
    if not txt.startswith(PREFIX) or not txt.endswith(SUFFIX):
        sys.exit(f"{path}: not an instance document; it does not read {PREFIX}...{SUFFIX!r}")
    return json.loads(txt[len(PREFIX):-len(SUFFIX)])


def main(argv):
    show_vocab = "--vocab" in argv
    rest = [a for a in argv if not a.startswith("--")]
    path = pathlib.Path(rest[0]) if rest else ROOT / "site" / "instance.js"

    doc = load(path)
    reg = doc.get("routes")
    if not reg or not reg.get("classes"):
        sys.exit(f"{path}: carries no populate registry. Nothing here can say whether a class "
                 f"has a source, which is the state issue 72 exists to make impossible.")
    classes = reg["classes"]
    vocab = reg.get("vocab", {})

    # How many drawn objects each class governs, which is the join the whole registry is for:
    # a tile names its class and the class names its route.
    drawn = {}
    unbound = []
    for view in doc["views"]:
        for node in view["nodes"]:
            cid = node.get("class")
            if cid not in classes:
                unbound.append((view["key"], node["id"], cid))
            drawn[cid] = drawn.get(cid, 0) + 1

    print(f"{path}, {len(classes)} classes, {len(doc['views'])} views\n")
    head = f"{'class':<22} {'objects':>7}  {'system':<18} {'unit':<26} {'read':<14} adapter"
    print(head)
    print("-" * len(head))

    attachable, blocked = [], []
    for cid, e in classes.items():
        (attachable if e["attachable"] else blocked).append(cid)

    print("ATTACHABLE: a system holds rows and an adapter could be written")
    for cid in attachable:
        e = classes[cid]
        print(f"  {cid:<20} {drawn.get(cid, 0):>7}  {e['system']:<18} {e['unit']:<26} "
              f"{e['read']:<14} {e['adapter']['status']}")
    print()
    print("NOT ATTACHABLE: nothing holds a row, so no adapter can exist")
    for cid in blocked:
        e = classes[cid]
        print(f"  {cid:<20} {drawn.get(cid, 0):>7}  {'-':<18} {'-':<26} "
              f"{e['read']:<14} {e['adapter']['status']}: {e['adapter']['blocked_by']}")

    print()
    print(f"{len(attachable)} attachable, {len(blocked)} not, {len(classes)} classes in all")
    print(f"{sum(drawn.values())} drawn objects, every one of them bound to a class")
    built = [c for c in attachable if classes[c]["adapter"]["status"] == "implemented"]
    read = [c for c in attachable if classes[c]["read"] not in ("no-source", "not-attempted")]
    print(f"{len(built)} adapter(s) implemented, {len(read)} system(s) read: this repository "
          f"ships a specification and no code that acts on it")

    # What an implementer would hit first, and it is the same thing on all eight.
    keyless = [c for c in attachable if classes[c]["key"]["status"] == "not-recorded"]
    print(f"{len(keyless)} of the {len(attachable)} attachable classes name no key to join on; "
          f"each one stands in a minted source_key until one is established")
    caveated = [(c, classes[c]["caveats"]) for c in attachable if classes[c]["caveats"]]
    if caveated:
        print(f"{len(caveated)} carry a caveat an adapter cannot write its way out of:")
        for cid, cav in caveated:
            print(f"  {cid:<20} {', '.join(cav)}")

    if show_vocab:
        for name, table in vocab.items():
            print(f"\nvocabulary: {name}")
            for token, meaning in table.items():
                print(f"  {token:<28} {meaning}")

    # Two ways the registry could be incomplete, and neither shows up in a panel. A class the
    # document declares and no object belongs to is an entry that rots; an object belonging to a
    # class the document does not declare is a tile whose source nothing can be asked about.
    bad = 0
    if unbound:
        bad = 1
        print(f"\n[FAIL] {len(unbound)} object(s) name a class the registry does not declare:")
        for key, nid, cid in unbound[:10]:
            print(f"  {key} {nid} -> {cid!r}")
    orphan = sorted(set(classes) - set(drawn))
    if orphan:
        bad = 1
        print(f"\n[FAIL] {len(orphan)} class(es) declared and drawn nowhere: {', '.join(orphan)}")
    missing = [(c, f) for c, e in classes.items() for f in ("system", "unit", "partition")
               if e["attachable"] and not e[f]]
    if missing:
        bad = 1
        print(f"\n[FAIL] {len(missing)} attachable class(es) are missing a field an adapter "
              f"needs: {missing}")

    print("\nVERDICT: " + ("the registry is incomplete" if bad else
                           "every class is declared, every object is bound, and every "
                           "unattachable class says why"))
    return bad


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
