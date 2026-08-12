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

WHO RUNS IT, WHICH FOR TWO MONTHS WAS NOBODY. Issue 103. This file was tracked, executable, and
declared an exit contract with three [FAIL] branches, and nothing anywhere ran it: not
scripts/verify.sh, not any of the seven workflows. Its name occurred four times in the tree, three
of them inside this docstring. A gate nobody runs is worse than no gate, because the file's
presence implies a check that is not happening, and this one was green when it was found, which is
the worse of the two states to be dark in. It is now a step of scripts/verify.sh and a step of
.github/workflows/build.yml, which is the workflow that already rebuilds the document this reads.
Named by what it is and not by its number: two of this repository's references to a verify.sh
step number went stale the first time a step was inserted in the middle (issue 106 E4).

AND IT READS EVERY GRAIN, WHICH IT DID NOT. Issue 107, reported by the agent on issue 89 about its
own work. Issue 89 shipped a second altitude: `views` still means the seven programmes at the
sessions grain and `collapsed` carries the same seven at the modules grain, fourteen drawings in
all. This file walked `doc["views"]` and nothing else, so its per-class counts were of half the
document and a class drawn ONLY at the modules grain read to it as a class declared and drawn
nowhere, which is the [FAIL] two paragraphs down. Issue 89 worked around it by giving its two new
aggregates their members' populate route rather than registry entries of their own, which is sound
and leaves the blind spot exactly where it was.

Issue 89 closed the same blindness inside build/: one function answers "every view in this
document" and all three of its gates ask it. This file asks the same question, in doc_views()
below, and finds the lists BY SHAPE rather than by name, so a third altitude is read the day it
ships instead of the day somebody remembers this file exists. That is the correction the workaround
was standing in for: a gate blind to half the document is the state issue 103 is about, and it does
not stop being that because the thing it cannot see was arranged not to need it.

Usage:
  scripts/routes.py                     read site/instance.js
  scripts/routes.py path/to/instance.js read another document of the same shape
  scripts/routes.py --vocab             also print the vocabularies the document ships

Exit: 0 the registry is complete and every object binds to it, 1 it is not, 2 there was no
registry to read at all. Two is this repository's code for a gate that did not answer rather than
one that answered clean, and scripts/verify.sh records it as a failure for exactly that reason: a
document carrying no registry cannot be judged complete, and saying nothing about it is how the
whole class of defect this file was wired in for gets started.
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
        print(f"ASSERTION FAILED: {path} is not an instance document; it does not read "
              f"{PREFIX}...{SUFFIX!r}", file=sys.stderr)
        raise SystemExit(2)
    return json.loads(txt[len(PREFIX):-len(SUFFIX)])


VIEW_SHAPE = ("key", "grain", "nodes")


def doc_views(doc):
    """Every view in the document, at every grain, as (list-name, view) pairs.

    BY SHAPE AND NOT BY NAME. A list of `views` and a list of `collapsed` is what the document
    happens to carry today; what makes either of them a view is that its entries name a key, a
    grain and a set of nodes. Matching on that means a third altitude is walked the moment it is
    built, and it means this file cannot be left behind by a rename, which is the failure it is
    being repaired for. It also cannot import the answer from build/: this file works from the
    document alone, on purpose, because whether the DOCUMENT carries enough to work from is the
    only question it exists to settle.

    AND FOR TWO CARDS THIS WAS THE STRONGER OF TWO COPIES OF ONE QUESTION, WITH THE WEAKER ONE
    WIRED TO THE GATES. Issue 117, F1. build/model.py's doc_views() resolves by name, and it is
    the copy check_structure, check_provenance and build_layout.py's geometry blacklist all ask,
    while this copy only prints a table. A third top level list of view-shaped entries was
    therefore read here and walked by nothing there: proved by construction, a `zoomed` list
    carrying one violation of each of four separate rules built clean while the byte-identical
    node placed in `collapsed` was refused. The repair is in build/model.py, as a rule named
    `view-list-declared` that refuses any top level list of view-shaped entries under a name the
    gates do not walk. So the two resolvers can no longer disagree about a document that can be
    built, and this file's shape-based answer is now an independent recomputation of a rule
    rather than a second opinion nobody compares.

    WHAT WOULD BE STRONGER, AND WHY IT IS NOT DONE HERE. If the document itself declared which
    of its top level lists are view lists, this file could compare its by-shape answer against
    that declaration and refuse a difference, with the allow list written down exactly once and
    in the bytes both readers read. That means adding a key to the shipped document, which is a
    rebuild of site/, and site/ was another agent's file for the length of this card.
    """
    out = []
    for name, value in doc.items():
        if not isinstance(value, list) or not value:
            continue
        if not all(isinstance(v, dict) and all(k in v for k in VIEW_SHAPE) for v in value):
            continue
        out.extend((name, v) for v in value)
    return out


def main(argv):
    show_vocab = "--vocab" in argv
    rest = [a for a in argv if not a.startswith("--")]
    path = pathlib.Path(rest[0]) if rest else ROOT / "site" / "instance.js"

    doc = load(path)
    reg = doc.get("routes")
    if not reg or not reg.get("classes"):
        print(f"ASSERTION FAILED: {path} carries no populate registry. Nothing here can say "
              f"whether a class has a source, which is the state issue 72 exists to make "
              f"impossible, and a reader that shrugged at it would report clean about a "
              f"document it never read.", file=sys.stderr)
        raise SystemExit(2)
    classes = reg["classes"]
    vocab = reg.get("vocab", {})

    # How many drawn objects each class governs, which is the join the whole registry is for:
    # a tile names its class and the class names its route. Every grain, because a tile drawn at
    # one altitude and not the other is still a tile whose source somebody can be asked about.
    views = doc_views(doc)
    drawn = {}
    per_grain = {}
    unbound = []
    for listname, view in views:
        grain = view.get("grain") or listname
        per_grain[grain] = per_grain.get(grain, 0) + len(view["nodes"])
        for node in view["nodes"]:
            cid = node.get("class")
            if cid not in classes:
                unbound.append((grain, view["key"], node["id"], cid))
            drawn[cid] = drawn.get(cid, 0) + 1

    # A document with no views draws nothing, so every class below would be reported as an
    # orphan and the verdict would be about the file rather than about the registry. That is the
    # empty-input lie every gate here refuses: it did not scan what it was asked to. It reads the
    # same doc_views() the loop above does, so a shape that stopped matching cannot make the gate
    # walk nothing and still report on it.
    if not views or not sum(len(v.get("nodes", ())) for _, v in views):
        print(f"ASSERTION FAILED: {path} draws no object at all, so there is nothing to bind to "
              f"the registry and a verdict either way would be about the document and not about "
              f"the classes.", file=sys.stderr)
        raise SystemExit(2)

    grains = ", ".join(f"{g} {n}" for g, n in sorted(per_grain.items()))
    print(f"{path}, {len(classes)} classes, {len(views)} views at {len(per_grain)} grain(s), "
          f"objects by grain: {grains}\n")
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
    print(f"{sum(drawn.values())} drawn objects across every grain, every one bound to a class")
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
        for grain, key, nid, cid in unbound[:10]:
            print(f"  {grain} {key} {nid} -> {cid!r}")
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
