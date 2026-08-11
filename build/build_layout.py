#!/usr/bin/env python3
"""Degenerate Sugiyama layout for the toy instance graph.

A FUNCTION FROM AN INSTANCE DOCUMENT TO GEOMETRY, which is issue 60 seam 1. build/model.py
emits site/instance.js, the data and only the data; this file reads that document back off
disk and writes site/layout.js, the geometry and only the geometry; the page loads both. The
point of the split is recorded on the card: the published page is public, so real data can
never go on it, and the only way the public toy and a private management tool are ever one
codebase is if the data document loads separately from the page. Everything below reads the
emitted document rather than importing the model, so a different instance document with the
same shape lays out without a line of this file changing:

    python3 build/build_layout.py --instance other.json --out /tmp/other

Columns are fixed by object type, with two derived exceptions. Order within a column comes
from barycentre sweeps. Y is relaxed towards the mean of each node's neighbours, then packed
to a minimum gap. Columns are gathered into named bands so that two adjacent columns of
different kinds of thing read as two different lanes rather than one striped list.

The whole drawing is sized to be readable inside one 1440x900 viewport with the header and
the footer taken out, so the target aspect is roughly two to one and the target height is
around 650 user units.

THAT TARGET IS NOW MET BY FIVE OF THE SEVEN AND MISSED BY TWO, on purpose. Issue 83 gave Z-BL
and Z-SC their whole syllabus, twenty eight and twenty five session templates where the other
five draw six, and a band is a vertical lane, so the two of them stand 2578 and 2470 units
tall at an aspect near one to two. The alternative, wrapping a tall lane into sub-columns, was
built and measured and rejected; the numbers and the reason are in the header of
build/bands.py. The plane from issue 46 is what makes the tall pair navigable, and it is the
only reason a drawing this shape is shippable at all.
"""
import argparse
import hashlib
import json
import math
import os
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from bands import BAND_KEYS, BANDS, CAP_NO_EMPLOYERS, CAP_NO_HOST, CAP_NO_INSTRUCTORS, MAX_CAP_LINES, fill  # noqa: E402,E501
from model import check_provenance, contrast_rows, floor4, instance_document, value_status  # noqa: E402,E501

COL_W = [166, 232, 122, 124, 80, 102, 92, 92]
GAP_X, MARGIN_X = 18, 22
BAND_PAD, BAND_GAP = 9, 10
TILE, GAP_LABEL, LINE_H, FONT = 34, 7, 11.5, 10.0
MIN_GAP = 26
# Two nodes in a column can never sit closer than this, so a barycentre difference smaller than
# it is not a preference about rows. The near-tie repair in layout() reads it as its tolerance.
NEAR = MIN_GAP
NCOL = len(COL_W)

# Column bands. Each is a run of columns holding one kind of thing, drawn as its own lane with
# its own caption. The lanes and their captions are declared in build/bands.py, one copy, read
# from here for the geometry and from build/measure_labels.py for the text; the header of that
# file carries the reasoning that used to sit here.

# The last caption line sits CAP_GAP above the top of the bands and any line before it stacks
# above that, so the drawing gains headroom only if some lane actually needs another line. It is
# measured over every caption a view could carry and not over the ones a particular view does:
# the seven routes are read one after another and a header that changed height between them would
# make the whole drawing jump.
CAP_LH, CAP_GAP = 11.0, 7
BAND_TOP = 21 + round(CAP_LH * (MAX_CAP_LINES - 1))
MARGIN_Y = BAND_TOP + 16
BAND_COLS = [cs for cs, _lines in BANDS]

COLX, _acc = [], MARGIN_X
_band_of = {c: i for i, (cs, _l) in enumerate(BANDS) for c in cs}
for c, w in enumerate(COL_W):
    if c and _band_of[c] != _band_of[c - 1]:
        _acc += BAND_PAD + BAND_GAP + BAND_PAD - GAP_X
    COLX.append(_acc + w / 2)
    _acc += w + GAP_X
W = round(_acc - GAP_X + MARGIN_X)

# ---- which column a type is drawn in ----------------------------------------
# Geometry, so it is here and not in build/model.py, which since issue 60 seam 1 says what the
# objects are and nothing about where they go. The key set is checked against the instance
# document's own types on every build, so a type added to the model without a column stops the
# build instead of landing silently in column zero.
#
# STUDENT SITS IN 4 AND NOT 5, WHICH IS THE ONE ENTRY THAT NEEDS ITS REASON. 5 is the column its
# own StudentGroup card sits in, and this layout draws an edge between two columns and has no
# shape for an edge inside one, so four members stacked under the card they belong to would each
# need a line from a tile to the tile above it. Column 4 is the other half of the same lane, it
# holds one node, and the 'member of' edges then run left to right into the group exactly like
# every other edge on the page. The lane caption, "cohort and students", is true of both columns.
#
# THE ENROLMENT TO CLAIM CHAIN FOLDS OVER TWO COLUMNS rather than running out over four. Every
# one of its edges still joins neighbouring columns, so the chain stays legible while the drawing
# keeps a two to one aspect instead of a long empty right half.
COL_BY_TYPE = {
    "Programme": 0, "Company": 0, "SessionTemplate": 1, "Instructor": 2, "CohortSession": 3,
    "Cohort": 4, "StudentGroup": 5, "Student": 4, "Enrolment": 6, "Agreement": 7,
    "Charge": 6, "Claim": 7,
}

# A Company that hosts a visit is drawn beside the sessions it hosts and not beside the
# employers, and it is picked out by the verb on its own edge. That is the house pattern rather
# than a new one: the students reveal in site/app.js derives its set by walking the edges for
# 'member of' rather than holding a list of ids, for the same reason. A second visit host added
# to the model joins the rule by existing.
HOST_VERB, HOST_COL = "hosts visit", 3

# A ghost has no column of its own because it has no place of its own: it is the class that
# would attach to something real, so it is drawn in the other column of the lane its target sits
# in, next to the thing whose absence it is about. Derived from the edge, which is why the four
# ghosts stopped carrying a hand written column when this file took the geometry over.
GHOST_TYPE_KEY = "Ghost"

# ---- text width ------------------------------------------------------------
# Widths come from build/label_widths.json, which build/measure_labels.py produced by shaping
# every one of these strings in a real browser, in the exact font stack, size and weight the
# stylesheet gives it, and keeping the widest across every family in the stack the measuring
# machine could resolve. The table is committed, so this build reads a file and never opens a
# browser.
#
# estimate_w below is what the layout used before, a per character table written by hand. It
# is kept as the fallback for any string the table does not hold, so a new label can never
# crash the build, and every fall back is reported at the end of the run. It is not accurate:
# on this model it undershoots the widest label by about eight per cent at the weight the
# labels are drawn, and by about nineteen per cent at the weight a selected label is drawn.
MAXLINES = 3
WIDTHS_PATH = pathlib.Path(
    os.environ.get("ZRIVE_LABEL_WIDTHS", pathlib.Path(__file__).parent / "label_widths.json"))
try:
    MEASURED = json.loads(WIDTHS_PATH.read_text(encoding="utf-8"))["widths"]
except (OSError, ValueError, KeyError) as exc:
    MEASURED = {}
    print(f"[layout] no measured widths at {WIDTHS_PATH} ({type(exc).__name__}); "
          f"every width on this build is estimated", file=sys.stderr)

NARROW, WIDE = set("ijlt.,;:!'|íÍ "), set("mwMW@")
_fellback = []   # (context, string) for every lookup that missed
_errors = []     # (measured - estimated, context, string) for every lookup that hit


def estimate_w(s, size, caps=False):
    if caps:  # .band-cap uppercases and letter-spaces in CSS, so the estimate must too
        s = s.upper()
    u = sum(0.30 if c in NARROW else 0.86 if c in WIDE else 0.62 if c.isupper() else 0.53
            for c in s)
    return u * size + (0.07 * size * len(s) if caps else 0.0)


def text_w(s, size=FONT, weight=400, italic=False, caps=False):
    # italic is its own face with its own advances, so it is its own context. Ghosts are drawn
    # italic (.lbl-ghost, .ghost .chip-tx) and would otherwise silently borrow upright widths.
    # caps is the band captions, which the stylesheet uppercases and letter-spaces.
    ctx = f"{size:g}/{weight:g}" + ("i" if italic else "") + ("+caps" if caps else "")
    tbl = MEASURED.get(ctx)
    if tbl is not None and s in tbl:
        est = estimate_w(s, size, caps)
        _errors.append((tbl[s] - est, ctx, s, est, tbl[s]))
        return tbl[s]
    _fellback.append((ctx, s))
    return estimate_w(s, size, caps)


def wrap(label, maxw, italic=False, weight=400):
    lines, cur = [], ""
    for word in label.split():
        trial = (cur + " " + word).strip()
        if cur and text_w(trial, FONT, weight, italic) > maxw:
            lines.append(cur)
            cur = word
        else:
            cur = trial
    if cur:
        lines.append(cur)
    if len(lines) > MAXLINES:
        # Dropping the tail silently would clip the label and the page would look fine.
        print(f"[layout] TRUNCATED after {MAXLINES} lines, words are lost: {label!r} "
              f"-> {lines[MAXLINES:]}", file=sys.stderr)
    return lines[:MAXLINES]


# ---- the gate the measurement exists for -----------------------------------
# A lane is a band of columns holding one kind of object, and the drawing's whole claim is
# that a reader can tell the kinds apart by lane. A label wider than its lane breaks that
# claim, and it breaks it silently: the page still renders. So it is checked here, before a
# single coordinate is written, against measured widths rather than guessed ones.
BAND_X = {}
for _cs in BAND_COLS:
    _x0 = COLX[_cs[0]] - COL_W[_cs[0]] / 2 - BAND_PAD
    _x1 = COLX[_cs[-1]] + COL_W[_cs[-1]] / 2 + BAND_PAD
    for _c in _cs:
        BAND_X[_c] = (_x0, _x1)


def columns_for(view, tag):
    """id -> column, for one view, from the instance document alone.

    Three rules and no table of ids: the type, the visit host picked out by its verb, and the
    ghost placed beside the class it would attach to. A node the rules cannot place stops the
    build, because the alternative is column zero and a drawing that looks merely odd.
    """
    nodes, edges = view["nodes"], view["edges"]
    type_of = {n["id"]: n["type"] for n in nodes}
    col = {}
    for n in nodes:
        if n["type"] in COL_BY_TYPE:
            col[n["id"]] = COL_BY_TYPE[n["type"]]
    for e in edges:
        if e["v"] == HOST_VERB and type_of.get(e["s"]) == "Company":
            col[e["s"]] = HOST_COL
    for e in edges:
        if type_of.get(e["s"]) != GHOST_TYPE_KEY:
            continue
        target = col.get(e["t"])
        if target is None:
            sys.exit(f"[layout:{tag}] ghost {e['s']} attaches to {e['t']}, which has no column")
        lane = [c for c in BAND_COLS if target in c][0]
        other = [c for c in lane if c != target]
        if not other:
            sys.exit(f"[layout:{tag}] ghost {e['s']} attaches to {e['t']} in column {target}, "
                     f"whose lane has no second column for the ghost to sit in")
        col[e["s"]] = other[0]
    missing = [n["id"] for n in nodes if n["id"] not in col]
    if missing:
        sys.exit(f"[layout:{tag}] no column rule places {', '.join(sorted(missing))}. Every node "
                 f"is placed by its type, by hosting a visit, or by the class it would attach "
                 f"to; a node placed by none of the three would be drawn in column 0 and look "
                 f"merely odd.")
    return col


def bands_for(view, col_of):
    """The lane captions for one view, read off what that view holds.

    Derived and not declared, for the same reason the "no system holds it" mark is derived from
    the populate route: a caption written by hand beside a model is a second place to forget.

    TWO KINDS OF DERIVATION MEET HERE and they answer different questions. Which alternate a
    lane takes is decided by what the view DRAWS, because a caption naming a tile that is not
    there is false. What the two sample lines say is decided by the view's `counts` block, which
    is the document's own statement of how much of the syllabus it carries; the drawing cannot
    work that out by looking at itself, and a number typed into the caption instead would be the
    thing this whole card exists to remove.
    """
    model_nodes = view["nodes"]
    counts = view["counts"]
    company_cols = {col_of[n["id"]] for n in model_nodes if n["type"] == "Company"}
    has_employer = 0 in company_cols
    has_host = 3 in company_cols
    has_instructor = any(n["type"] == "Instructor" for n in model_nodes)
    out = []
    for cs, lines in BANDS:
        if cs == [0] and not has_employer:
            lines = CAP_NO_EMPLOYERS
        elif cs == [2] and not has_instructor:
            lines = CAP_NO_INSTRUCTORS
        elif cs == [3] and not has_host:
            lines = CAP_NO_HOST
        out.append((cs, fill(lines, counts)))
    return out


def caption_overflow(bands):
    """The caption over a lane is sized by the columns under it, not by its own text, so it can
    outgrow the lane it names without anything noticing. Every line is checked, not the caption
    as a whole: a caption that is only legal because it was split has to be legal line by line.
    """
    over = []
    for cs, lines in bands:
        x0, x1 = BAND_X[cs[0]][0], BAND_X[cs[-1]][1]
        for line in lines:
            cap = text_w(line, 9.0, 600, False, True)
            if cap > x1 - x0:
                over.append((x1 - x0 - cap, "band", line, " ".join(lines)))
    return over


SPREAD, SPREAD_FROM = 0.42, 4

# ---- edge geometry ---------------------------------------------------------


def bez(pts, t):
    (ax, ay), (bx, by), (cx, cy), (dx_, dy) = pts
    u = 1 - t
    return (u ** 3 * ax + 3 * u * u * t * bx + 3 * u * t * t * cx + t ** 3 * dx_,
            u ** 3 * ay + 3 * u * u * t * by + 3 * u * t * t * cy + t ** 3 * dy)


# ---- verb chips ------------------------------------------------------------
# A chip carries the verb, so the drawing is a data model and not a picture, and a verb that
# floats free of its line does not say which edge it names. Each chip is therefore anchored to
# the midpoint of its own path by arc length, which is the one point on a curve that reads as
# the middle of that line whatever the curve does near its ends.
#
# Where a chip would land on a tile, on a label or on another chip it slides along its own
# path first: a chip that has moved along its line is still unambiguously on that line, while
# one that has moved off it is not. Stepping off the line is the last resort and is capped at
# CHIP_PERP, so no chip can end up adrift the way the old greedy search let 'claims against'
# end up 134px below its own edge.
CH, PADX = 13.0, 5.0
CHIP_SLIDE = 0.34    # a chip never slides past this share of the arc length from the midpoint
CHIP_STEP = 4.0      # granularity of the slide
# The cap on stepping off the line is under half a chip height, so the line still passes
# through the chip box whatever the placement does. That is the invariant the gate checks:
# not that the chip is near its line, but that its line runs through it.
CHIP_PERP = 6.0
# Cost per px of overlap, per px slid along the path (1, implicitly) and per px stepped off
# it. Overlap is dear because a verb printed over a name is unreadable, and sliding is cheap
# because it costs nothing but distance from the middle.
W_OVER, W_PERP = 20.0, 3.0

# A chip off its line is the defect this placement exists to remove, and like a label leaving
# its lane it is invisible in a diff: the page still renders. So it is measured, against the
# coordinates about to be written, and the build refuses rather than publishes.
CHIP_MAX_OFF = CHIP_PERP + 0.5   # half a chip height, so the line crosses the chip


def arc_table(pts, n=240):
    xs = [bez(pts, i / n) for i in range(n + 1)]
    cum = [0.0]
    for i in range(1, n + 1):
        cum.append(cum[-1] + math.hypot(xs[i][0] - xs[i - 1][0], xs[i][1] - xs[i - 1][1]))
    return xs, cum


def at_s(xs, cum, s):
    """Point and unit tangent at arc length s along the path, clamped to its ends."""
    s = min(max(s, 0.0), cum[-1])
    lo, hi = 1, len(cum) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if cum[mid] < s:
            lo = mid + 1
        else:
            hi = mid
    seg = cum[lo] - cum[lo - 1] or 1e-9
    f = (s - cum[lo - 1]) / seg
    (x0, y0), (x1, y1) = xs[lo - 1], xs[lo]
    tx, ty = x1 - x0, y1 - y0
    m = math.hypot(tx, ty) or 1e-9
    return (x0 + f * tx, y0 + f * ty), (tx / m, ty / m)


def overlap(x, y, w, boxes):
    """Total penetration depth in px of one chip box against a list of boxes.

    A depth rather than a count, so that clipping a padding margin by a pixel is cheap and
    sitting on top of a label is not. That is the difference between a chip that nudges and
    one that runs away.
    """
    tot = 0.0
    for bx, by, bw, bh in boxes:
        ox = (w + bw) / 2 - abs(x - bx)
        oy = (CH + bh) / 2 - abs(y - by)
        if ox > 0 and oy > 0:
            tot += min(ox, oy)
    return tot


def dist_to_path(pt, pts, n=400):
    return min(math.hypot(pt[0] - x, pt[1] - y)
               for x, y in (bez(pts, i / n) for i in range(n + 1)))


def layout(view, tag, bands, col_of):
    """Lay one view of the instance document out and return the geometry the browser draws.

    It is a function rather than module-level code because it once laid out two drawings, a
    one cohort view and an opt-in two cohort one, and the property that mattered was that
    neither could move the other: the columns and the measured widths are shared and nothing in
    here touches module state. Seven views go through it now, one per programme, and that
    isolation is what makes "the drawing is a pure function of the model" a statement that can
    be checked by running the build twice rather than a claim.

    The captions come in as an argument rather than off a module constant, because three of the
    six are claims that are false on a view that holds no employer, no instructor or no visit
    host. The COLUMN GROUPING does not come in with them: COLX, W and BAND_X are computed once
    from it at import and baked into every coordinate, so a caller handing over a different
    grouping would get a drawing whose lanes and whose geometry disagree. That is checked rather
    than trusted.
    """
    if [cs for cs, _lines in bands] != BAND_COLS:
        sys.exit(f"[layout:{tag}] the caption set groups the columns as "
                 f"{[cs for cs, _l in bands]} and the geometry was computed for {BAND_COLS}. "
                 f"Captions are a per view argument; the grouping is not.")
    model_nodes, model_edges = view["nodes"], view["edges"]
    nodes = {n["id"]: dict(n) for n in model_nodes}
    order = [n["id"] for n in model_nodes]
    rewrapped = []
    for nid, n in nodes.items():
        n["col"] = col_of[nid]
        it = bool(n.get("ghost"))

        def reserve(lines):
            # Reserve the bold width, not the regular one. Clicking a node turns its label bold
            # (.node.sel .lbl), which is about a fifth wider, and the reserved box has to hold
            # the state the page enters on a click as well as the one it starts in.
            return max(max(text_w(ln, FONT, 400, it) for ln in lines),
                       max(text_w(ln, FONT, 600, it) for ln in lines))

        n["lines"] = wrap(n["label"], COL_W[n["col"]] - 8, it)
        n["lw"] = reserve(n["lines"])
        # AND WRAPPING AT THE DRAWN WEIGHT IS NOT ENOUGH ON ITS OWN, which issue 43 found the
        # hard way. A line is broken so that it fits the column in the weight it is drawn in,
        # and then the box reserved for it is the BOLD width of that same line, which is up to a
        # fifth wider; the two rules disagree by more than the 13 units of pad a lane has either
        # side of its column, so a long enough title clears the wrap and leaves the lane. The
        # shipped Z-IB title was inside it by 4,7 units, which is luck and not a margin, and
        # 'The investment process in corporate private equity (I)' on Z-PE was outside it by 0,6.
        #
        # Wrapping everything at the bold weight would fix it and would cost every long label on
        # every route a line it does not need: measured, the seven views go to 588, 634, 610,
        # 634, 610, 599 and 576. So the bold weight is used only where the regular one has
        # actually produced a box the lane cannot hold, which leaves every label that fits
        # exactly as it was and re-breaks only the ones that do not.
        x = COLX[n["col"]]
        x0, x1 = BAND_X[n["col"]]
        if n["lw"] > 2 * min(x - x0, x1 - x):
            n["lines"] = wrap(n["label"], COL_W[n["col"]] - 8, it, 600)
            n["lw"] = reserve(n["lines"])
            rewrapped.append(nid)
        # A node carrying a mark spends one more line under its label saying what it is
        # missing, so it reserves the height for it here and the browser only draws. A tail is
        # the same arithmetic for a different sentence: a line about the drawing rather than
        # about the object, and the students card carries one saying how many members it did not
        # draw. The line is reserved whether or not anything is painted in it, which is the whole
        # point: the marker appears with the reveal and nothing moves to make room for it.
        n["nlines"] = len(n["lines"]) + (1 if n.get("mark") else 0) + (1 if n.get("tail") else 0)
        if n.get("mark"):
            n["lw"] = max(n["lw"], text_w(n["mark"], 9.0))
        if n.get("tail"):
            n["lw"] = max(n["lw"], text_w(n["tail"], 9.0))
        n["h"] = TILE + GAP_LABEL + LINE_H * n["nlines"]
        n["x"] = COLX[n["col"]]

    lane_label = {c: " ".join(lines) for cs, lines in bands for c in cs}

    def lane_slack(n):
        x0, x1 = BAND_X[n["col"]]
        return min(n["x"] - n["lw"] / 2 - x0, x1 - n["x"] - n["lw"] / 2)

    lane_tight = min(((lane_slack(n), nid) for nid, n in nodes.items()), default=(0.0, None))
    over = sorted((lane_slack(n), nid, n["label"], lane_label[n["col"]])
                  for nid, n in nodes.items() if lane_slack(n) < 0) + caption_overflow(bands)
    if over:
        for slack, nid, label, lab in over:
            print(f"[layout:{tag}] LANE OVERFLOW by {-slack:.1f}px: {label!r} ({nid}) leaves "
                  f"the {lab!r} lane", file=sys.stderr)
        sys.exit("[layout] refusing to write a drawing in which a label crosses a lane boundary")

    adj = {nid: [] for nid in nodes}
    for e in model_edges:
        adj[e["s"]].append(e["t"])
        adj[e["t"]].append(e["s"])

    cols = [[nid for nid in order if nodes[nid]["col"] == c] for c in range(NCOL)]
    H = max(sum(nodes[i]["h"] for i in c) + MIN_GAP * (len(c) - 1) for c in cols if c)

    def pack(ordering, c=0):
        """Place a column's nodes in sequence, vertically centred, honouring MIN_GAP.

        A short column on the right of the field opens its gaps until it spans a share of the
        height. Without that, the enrolment to claim chain reads as a small clump adrift in a
        tall empty lane, which is what made the right of the earlier drawing look abandoned.
        Columns on the left stay packed: they carry edges that run the width of the drawing,
        and spreading them drags those edges through other lanes' labels.
        """
        k = len(ordering)
        hs = sum(nodes[i]["h"] for i in ordering)
        gap = MIN_GAP
        if 1 < k < 4 and c >= SPREAD_FROM:
            gap = max(MIN_GAP, (SPREAD * H - hs) / (k - 1))
        total = hs + gap * (k - 1)
        y = (H - total) / 2
        for nid in ordering:
            nodes[nid]["y"] = y + nodes[nid]["h"] / 2
            y += nodes[nid]["h"] + gap

    for c in range(NCOL):
        pack(cols[c], c)

    for sweep in range(30):
        rng = range(NCOL) if sweep % 2 == 0 else range(NCOL - 1, -1, -1)
        for c in rng:
            if not cols[c]:
                continue
            # Two nodes can want the same row exactly, and the tie used to be broken by the
            # order they are declared in the model, which is arbitrary as far as the drawing is
            # concerned. Issue 49 made that bite: with an employer behind every instructor, t2
            # and t3 came out wanting exactly the same row, declaration order put t2 above t3,
            # and the two 'teaches' edges then crossed with their midpoints on the same point,
            # so their two verb chips were placed on top of each other.
            #
            # The tie is now broken by where the node's downstream neighbours sit. The drawing
            # reads left to right, so of two nodes that want the same row the one whose
            # right hand neighbours are higher belongs higher, and the pair of edges leaves
            # parallel instead of crossed.
            #
            # AND IT FIRES ON NEAR TIES TOO, WHICH IT DID NOT UNTIL ISSUE 4. Restricting it to
            # exact equality was the cautious reading and it was too narrow: putting a mark under
            # six tiles in the employers lane moved that lane's rows by a few pixels, t2 and t3
            # came out wanting rows 5.75px apart instead of the same row, the tie-break did not
            # fire, and the same two 'teaches' chips landed on top of each other that issue 49
            # had separated. A rule that only holds when two floats are bit for bit equal is a
            # rule that stops working the next time anything anywhere moves.
            #
            # NEAR is MIN_GAP, in the units want is measured in, and that is the whole argument
            # rather than a tuned constant: MIN_GAP is the closest two tiles in a column are ever
            # allowed to sit, so a difference smaller than it cannot be a preference about which
            # row a node belongs in. It is noise inside one row, and inside one row the downstream
            # neighbours are the only thing with an opinion worth acting on.
            #
            # One adjacent pass and not a re-sort, on purpose. Near-tie is not transitive, so a
            # comparator built on it is not an ordering and sorted() may do anything with it. A
            # single left to right pass over neighbouring pairs is well defined, only ever swaps
            # two nodes the barycentre had already placed side by side, and cannot move a node
            # past one the barycentre genuinely separated it from.
            want, downstream = {}, {}
            for nid in cols[c]:
                ys = [nodes[m]["y"] for m in adj[nid] if nodes[m]["col"] != c]
                want[nid] = sum(ys) / len(ys) if ys else nodes[nid]["y"]
                rs = [nodes[m]["y"] for m in adj[nid] if nodes[m]["col"] > c]
                downstream[nid] = sum(rs) / len(rs) if rs else want[nid]
            cols[c].sort(key=lambda n: (want[n], downstream[n], order.index(n)))
            for _i in range(len(cols[c]) - 1):
                _a, _b = cols[c][_i], cols[c][_i + 1]
                if want[_b] - want[_a] < NEAR and downstream[_b] < downstream[_a]:
                    cols[c][_i], cols[c][_i + 1] = _b, _a
            pack(cols[c], c)

    top = min(n["y"] - n["h"] / 2 for n in nodes.values())
    for n in nodes.values():
        n["y"] += MARGIN_Y - top
    height = max(n["y"] + n["h"] / 2 for n in nodes.values()) + 14

    def tile_y(n):
        return n["y"] - (n["h"] - TILE) / 2

    edges = []
    for me in model_edges:
        a, b, verb = me["s"], me["t"], me["v"]
        na, nb = nodes[a], nodes[b]
        left, right = (na, nb) if na["col"] <= nb["col"] else (nb, na)
        span = abs(nb["col"] - na["col"])
        if span >= 3:  # local arc slung under the row it connects, never across the field
            dip = 132
            p0 = (left["x"], tile_y(left) + TILE / 2)
            p3 = (right["x"], tile_y(right) + TILE / 2)
            p1, p2 = (p0[0], p0[1] + dip), (p3[0], p3[1] + dip)
        else:
            p0 = (left["x"] + TILE / 2, tile_y(left))
            p3 = (right["x"] - TILE / 2, tile_y(right))
            dx = max(28.0, (p3[0] - p0[0]) * 0.45)
            p1, p2 = (p0[0] + dx, p0[1]), (p3[0] - dx, p3[1])
        pts = (p0, p1, p2, p3)
        d = (f"M {p0[0]:.1f} {p0[1]:.1f} C {p1[0]:.1f} {p1[1]:.1f} "
             f"{p2[0]:.1f} {p2[1]:.1f} {p3[0]:.1f} {p3[1]:.1f}")
        edges.append({"s": a, "t": b, "v": verb, "d": d, "pts": pts,
                      "rev": nb["col"] < na["col"], "span": span,
                      "ghost": bool(me.get("ghost"))})

    blocked = []
    for n in nodes.values():
        blocked.append((n["x"], tile_y(n), TILE + 6, TILE + 6))
        lab_h = LINE_H * n["nlines"]
        blocked.append((n["x"], tile_y(n) + TILE / 2 + GAP_LABEL + lab_h / 2,
                        n["lw"] + 6, lab_h + 2))
    chips = []

    for e in sorted(edges, key=lambda e: (-e["span"], e["s"], e["t"])):
        e["cw"] = text_w(e["v"], 9.0, 400, e["ghost"]) + 2 * PADX
        xs, cum = arc_table(e["pts"])
        L = cum[-1]
        e["mid"], _ = at_s(xs, cum, L / 2)
        reach = CHIP_SLIDE * L
        slides = [0.0]
        k = 1
        while k * CHIP_STEP <= reach:
            slides += [k * CHIP_STEP, -k * CHIP_STEP]
            k += 1
        best, best_cost = None, None
        for ds in slides:
            (px, py), (tx, ty) = at_s(xs, cum, L / 2 + ds)
            for perp in (0.0, CHIP_PERP / 2, -CHIP_PERP / 2, CHIP_PERP, -CHIP_PERP):
                x, y = px - ty * perp, py + tx * perp
                cost = (W_OVER * overlap(x, y, e["cw"] + 4, blocked + chips)
                        + abs(ds) + W_PERP * abs(perp))
                if best_cost is None or cost < best_cost:
                    best, best_cost = (x, y), cost
            if best_cost == 0.0 and ds == 0.0:
                break
        e["cx"], e["cy"] = best
        chips.append((e["cx"], e["cy"], e["cw"] + 4, CH))

    for e in edges:
        p0, p1, p2, p3 = e["pts"]
        tip, ctl = (p0, p1) if e["rev"] else (p3, p2)
        e["ax"], e["ay"] = tip
        e["aa"] = math.degrees(math.atan2(tip[1] - ctl[1], tip[0] - ctl[0]))

    height = max(height, max(e["cy"] for e in edges) + 26,
                 *[bez(e["pts"], 0.5)[1] + 26 for e in edges if e["span"] >= 3])

    chip_off = [(dist_to_path((e["cx"], e["cy"]), e["pts"]), e) for e in edges]
    chip_mid = [(math.hypot(e["cx"] - e["mid"][0], e["cy"] - e["mid"][1]), e) for e in edges]
    adrift = [(d, e) for d, e in chip_off if d > CHIP_MAX_OFF]
    if adrift:
        for d, e in sorted(adrift, reverse=True, key=lambda r: r[0]):
            print(f"[layout:{tag}] CHIP ADRIFT by {d:.1f}px: {e['v']!r} on {e['s']}->{e['t']}",
                  file=sys.stderr)
        sys.exit("[layout] refusing to write a drawing in which a verb floats free of its line")

    drawn_bands = []
    for i, (cs, lines) in enumerate(bands):
        x0, x1 = BAND_X[cs[0]][0], BAND_X[cs[-1]][1]
        # `key` is issue 84's. The caption is computed and has alternates, so a lane is found by
        # its name and never by the words over it.
        drawn_bands.append({"key": BAND_KEYS[i], "x": round(x0, 1), "w": round(x1 - x0, 1),
                            "label": " ".join(lines), "lines": list(lines)})

    # ---- and what goes out is geometry, with no value of any object in it -------------------
    # Issue 60 seam 1. A label appears here only as the WORD COUNTS its lines were broken at, and
    # never as text: wrapping is what the layout did to the label, the label itself belongs to
    # the instance document, and a copy of it here would be a second place for it to live. The
    # browser rebuilds the lines by splitting the label it already has. The reconstruction is
    # checked below rather than assumed.
    #
    # The band captions ARE text and they are the layout's own: a lane exists because of how the
    # columns are grouped, and its caption is a claim about that lane. Nothing in the instance
    # document says it.
    def wrap_counts(n):
        counts = [len(ln.split()) for ln in n["lines"]]
        rebuilt, words = [], n["label"].split()
        for c in counts:
            rebuilt.append(" ".join(words[:c]))
            words = words[c:]
        if rebuilt != n["lines"]:
            sys.exit(f"[layout:{tag}] the line breaks on {n['id']} cannot be written as word "
                     f"counts: {n['lines']} does not rebuild from {n['label']!r} as {rebuilt}. "
                     f"A label the browser cannot rebuild would be drawn wrong and nothing "
                     f"downstream would know.")
        return counts

    out = {
        "w": W, "h": round(height), "bandTop": BAND_TOP,
        "capLineH": CAP_LH, "capGap": CAP_GAP,
        "bands": drawn_bands,
        "tile": TILE, "lineH": LINE_H, "gapLabel": GAP_LABEL, "font": FONT,
        "nodes": [{"id": n["id"], "wrap": wrap_counts(n),
                   "x": round(n["x"], 1), "y": round(tile_y(n), 1)}
                  for n in (nodes[i] for i in order)],
        "edges": [{"s": e["s"], "t": e["t"], "d": e["d"],
                   "cx": round(e["cx"], 1), "cy": round(e["cy"], 1),
                   "cw": round(e["cw"], 1), "rev": e["rev"],
                   "ax": round(e["ax"], 1), "ay": round(e["ay"], 1), "aa": round(e["aa"], 1)}
                  for e in edges],
    }
    # A short digest, and it is called drawingDigest because that is what it is. It was called
    # "build" and it went into every feedback report on its own, where seven lowercase hex
    # characters read as an abbreviated commit to every engineer alive: the one action the value
    # invited, looking the revision up, failed with "not a valid object name", and a report could
    # not say what code the reporter saw. Issue 47. The commit now comes from site/version.js,
    # written at deploy time, and this stays for the one question it can answer, whether two
    # pages are showing the same thing.
    #
    # IT COVERS THE DATA AS WELL AS THE GEOMETRY, which is not an oversight now that the two are
    # separate files. The question a reader of a feedback report asks is whether their page was
    # showing what mine is, and a page whose coordinates match and whose roster does not is not
    # showing the same thing. So the digest is taken over this view's instance payload and its
    # geometry together, and it answers exactly the question it answered when they were one blob.
    payload = (json.dumps(view, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
               + json.dumps(out, ensure_ascii=False, sort_keys=True, separators=(",", ":")))
    out["drawingDigest"] = hashlib.sha256(payload.encode("utf-8")).hexdigest()[:7]

    print(f"[{tag}] nodes {len(out['nodes'])}  edges {len(out['edges'])}  "
          f"viewBox {W}x{out['h']}  aspect {W / out['h']:.2f}  "
          f"drawing digest {out['drawingDigest']}")
    for c in range(NCOL):
        if cols[c]:
            span = (max(nodes[i]['y'] + nodes[i]['h'] / 2 for i in cols[c])
                    - min(nodes[i]['y'] - nodes[i]['h'] / 2 for i in cols[c]))
            print(f"  col {c}  w {COL_W[c]:>3}  n {len(cols[c]):>2}  span {span:6.1f}  "
                  f"maxlines {max(len(nodes[i]['lines']) for i in cols[c])}")
    print(f"  lanes: tightest label has {lane_tight[0]:.1f}px of lane to spare ({lane_tight[1]})")
    if rewrapped:
        print(f"  lanes: {len(rewrapped)} label(s) re-broken at the selected weight because the "
              f"regular break left the lane: {', '.join(sorted(rewrapped))}")
    _wo, _we = max(chip_off, key=lambda r: r[0])
    _wm, _wme = max(chip_mid, key=lambda r: r[0])
    _on_mid = sum(1 for d, _e in chip_mid if d < 0.5)
    print(f"  chips: {len(edges)} verbs, {_on_mid} sitting on the exact midpoint of their edge. "
          f"Worst offset from the midpoint {_wm:.1f}px ({_wme['v']!r} on "
          f"{_wme['s']}->{_wme['t']}); worst distance from the line itself {_wo:.1f}px "
          f"({_we['v']!r} on {_we['s']}->{_we['t']}), cap {CHIP_MAX_OFF:.1f}px")
    # Chips are placed one at a time against the ones already down, and the placement can still
    # be forced into a pile: if two edges cross at their own midpoints there may be nowhere for
    # the second chip to go inside the slide and step off caps, and it settles for the least bad
    # overlap. A verb printed over another verb is unreadable and the page still renders, so the
    # worst pair is measured here rather than left for a reader to find. Not a gate: the cure for
    # a pile is to stop the two lines crossing at that point, which is a layout question and not
    # something a build should refuse over.
    pile = []
    for _i, _a in enumerate(edges):
        for _b in edges[_i + 1:]:
            _ox = (_a["cw"] + _b["cw"]) / 2 + 4 - abs(_a["cx"] - _b["cx"])
            _oy = CH - abs(_a["cy"] - _b["cy"])
            if _ox > 0 and _oy > 0:
                pile.append((min(_ox, _oy), _a, _b))
    if pile:
        _d, _a, _b = max(pile, key=lambda r: r[0])
        print(f"[layout:{tag}] {len(pile)} chip pair(s) overlap. Worst {_d:.1f}px: "
              f"{_a['v']!r} on {_a['s']}->{_a['t']} against {_b['v']!r} on "
              f"{_b['s']}->{_b['t']}", file=sys.stderr)
    else:
        print("  chips: no two verb chips overlap")
    return out


# ---- the two documents, and the gate that keeps them apart ---------------------
# Issue 60 seam 1. site/instance.js is what the objects are; site/layout.js is where they go.
# The rule below is what makes that a fact about the emitted bytes rather than a habit: neither
# document may carry the other's kind of thing, and the build refuses instead of writing one
# that does. It is checked on the documents themselves and not on the code that writes them,
# because the code that writes them is the code that would be wrong.
#
# The instance side is a key blacklist, because geometry has a vocabulary and it is small. The
# layout side is stronger and does not need a list at all: every value in a laid out node or edge
# has to be a number, a boolean, a list of numbers, or an id the instance document declares. A
# label, a property value, a note or a verb cannot pass that test in any spelling.
GEOMETRY_KEYS = {"x", "y", "w", "h", "col", "lines", "wrap", "d", "cx", "cy", "cw", "rev",
                 "ax", "ay", "aa", "tile", "lineH", "gapLabel", "bandTop", "capLineH",
                 "capGap", "bands", "font"}
_N = r"-?\d+(?:\.\d+)?"
PATH_RE = re.compile(rf"M {_N} {_N} C {_N} {_N} {_N} {_N} {_N} {_N}")


def refuse_mixed(inst, lay):
    # The populate registry, issue 72. It is a top-level block of the instance document rather
    # than a per-node key, so the node walk below cannot see it, and a block no gate reads is
    # where the next geometry key lands. Its entries are flat, so the same blacklist does the
    # job; the vocabularies are not walked because they are prose about the tokens.
    for cid, entry in inst.get("routes", {}).get("classes", {}).items():
        bad = sorted(set(entry) & GEOMETRY_KEYS)
        if bad:
            sys.exit(f"[layout] the populate registry carries geometry: class {cid} has "
                     f"{', '.join(bad)}. Where a thing is drawn belongs in site/layout.js.")
    # The provenance block, issue 73. Same reasoning as the registry above, and it is the second
    # time the reasoning has been needed: a top-level block the node walk cannot see is where the
    # next geometry key lands. Its clock is walked as well, since two day counts are exactly the
    # sort of number that reads like a coordinate.
    prov = inst.get("provenance", {})
    for label, block in (("provenance", prov), ("provenance clock", prov.get("clock", {}))):
        bad = sorted(set(block) & GEOMETRY_KEYS)
        if bad:
            sys.exit(f"[layout] the {label} block carries geometry: {', '.join(bad)}. "
                     f"Where a thing is drawn belongs in site/layout.js.")
    # The agenda block, issue 85. Fourth time the same reasoning has been needed: a top-level
    # block the node walk cannot see is where the next geometry key lands. Its rows are property
    # rows of the shape every other one has, so they take the same blacklist.
    ag = inst.get("agenda") or {}
    for label, block in ([("agenda", ag)]
                         + [(f"agenda row {j}", r) for j, r in enumerate(ag.get("rows", []))]):
        bad = sorted(set(block) & GEOMETRY_KEYS)
        if bad:
            sys.exit(f"[layout] the {label} block carries geometry: {', '.join(bad)}. "
                     f"Where a thing is drawn belongs in site/layout.js.")
    for v in inst["views"]:
        # The counts block, issue 83. Third time the same reasoning has been needed, after the
        # registry and the provenance block: a block the node walk cannot see is where the next
        # geometry key lands, and this one holds nothing but integers, which is exactly what a
        # coordinate looks like.
        for key, block in v.get("counts", {}).items():
            bad = sorted(set(block) & GEOMETRY_KEYS)
            if bad:
                sys.exit(f"[layout] the counts block carries geometry: {v['key']} {key} has "
                         f"{', '.join(bad)}. Where a thing is drawn belongs in site/layout.js.")
        for kind in ("nodes", "edges"):
            for o in v[kind]:
                bad = sorted(set(o) & GEOMETRY_KEYS)
                if bad:
                    sys.exit(f"[layout] the instance document carries geometry: {v['key']} "
                             f"{kind[:-1]} {o.get('id', o.get('s'))} has {', '.join(bad)}. "
                             f"Where a thing is drawn belongs in site/layout.js.")
    for iv, lv in zip(inst["views"], lay["views"]):
        ids = {n["id"] for n in iv["nodes"]}
        for kind in ("nodes", "edges"):
            for o in lv["drawing"][kind]:
                for k, val in o.items():
                    if isinstance(val, bool) or isinstance(val, (int, float)):
                        continue
                    if isinstance(val, list) and all(isinstance(x, (int, float)) for x in val):
                        continue
                    if isinstance(val, str) and val in ids:
                        continue
                    # The one string that is geometry: a cubic path, allowed by its grammar
                    # rather than by its key, so nothing can ride into the layout under the
                    # name `d`.
                    if k == "d" and PATH_RE.fullmatch(val):
                        continue
                    sys.exit(f"[layout] the layout document carries a value that is not "
                             f"geometry and is not an id: {lv['key']} {kind[:-1]} {k}={val!r}. "
                             f"What an object IS belongs in site/instance.js.")


def build(inst, out_dir):
    """Write both documents for one instance document. Everything read is read from `inst`."""
    # Issue 73, seam 5. The provenance gate runs HERE, on the document being laid out, and not
    # inside model.py's own emit. A private deployment reading a real estate is laid out through
    # --instance and never calls instance_document() at all, so a gate on the model's emit would
    # be a gate on the one document nobody worries about. It is the first thing done, because a
    # document whose values do not say where they came from is not a document to lay out.
    values = check_provenance(inst)
    _pr = inst["provenance"]
    _st = {}
    for _v in inst["views"]:
        for _n in _v["nodes"]:
            for _row in _n["props"]:
                _k = value_status(_row["r"], _row["at"], _pr["as_of"],
                                  _pr["clock"]["fresh_days"], _pr["clock"]["aging_days"])
                _st[_k] = _st.get(_k, 0) + 1
    print(f"  provenance: stance {_pr['stance']}, {values} values, "
          + ", ".join(f"{_st[k]} {k}" for k in sorted(_st))
          + f", {sum(_st.get(k, 0) for k in _pr['apto'])} fit to act on")
    # THE COLUMN TABLE IS CHECKED AGAINST THE DOCUMENT'S OWN TYPES rather than trusted. A type
    # added to the model with no column here would otherwise be drawn in column 0, which looks
    # like a layout bug and is a missing table entry.
    keys = {t["k"] for t in inst["types"]}
    unplaced = keys - set(COL_BY_TYPE) - {GHOST_TYPE_KEY}
    stale = set(COL_BY_TYPE) - keys
    if unplaced or stale:
        sys.exit(f"[layout] COL_BY_TYPE and the instance document's types disagree. "
                 f"No column for: {', '.join(sorted(unplaced)) or 'none'}. "
                 f"A column for types the document does not have: "
                 f"{', '.join(sorted(stale)) or 'none'}.")

    views = []
    for view in inst["views"]:
        col_of = columns_for(view, view["key"])
        views.append({"key": view["key"],
                      "drawing": layout(view, view["key"], bands_for(view, col_of), col_of)})
    lay = {"views": views}
    refuse_mixed(inst, lay)

    # The width of the drawing is computed here and read by the stylesheet through the
    # --drawing-w custom property that app.js writes. If it is ever typed into app.css as well
    # the two will disagree the first time a column changes width, and the symptom is quiet: on
    # a narrow viewport the canvas would stop short of the drawing or scroll past it into blank
    # space. So refuse to build while a copy of the number is sitting in the stylesheet.
    base_w = views[0]["drawing"]["w"]
    _css = (SITE / "app.css").read_text(encoding="utf-8")
    # Not \b: in "1230px" there is no word boundary between the 0 and the p, so \b would let the
    # very form the number takes in a stylesheet through untouched.
    if re.search(r"(?<![\d.])" + str(base_w) + r"(?![\d.])", _css):
        sys.exit(f"[layout] app.css contains the literal {base_w}, the width of the drawing. "
                 f"The stylesheet must read var(--drawing-w) instead.")

    dest = out_dir / "layout.js"
    dest.write_text("window.GL=" + json.dumps(lay, ensure_ascii=False, separators=(",", ":"))
                    + ";\n", encoding="utf-8")
    print(f"wrote {dest.name}  {dest.stat().st_size / 1024:.1f} KB, {len(views)} views")
    print("  " + "  ".join(f"{v['key']} {v['drawing']['w']}x{v['drawing']['h']}"
                           for v in views))
    return lay


SITE = pathlib.Path(__file__).resolve().parent.parent / "site"

_ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
_ap.add_argument("--instance", type=pathlib.Path,
                 help="lay out this instance document instead of the model's own. The whole "
                      "point of seam 1: a different document with the same shape needs no "
                      "change to this file and none to the page.")
_ap.add_argument("--out", type=pathlib.Path, default=SITE,
                 help="where to write instance.js and layout.js (default site/)")
_args = _ap.parse_args()

# ---- the model's own document, written first and then READ BACK ---------------
# The layout is a function of the instance document, and the cheapest way to keep that true is
# to make it literally so: the document is written to disk, parsed back, and laid out from what
# came back. Nothing the model holds and the document does not can reach the geometry, because
# the geometry never sees the model. It also means the seven views are laid out from exactly the
# bytes the page will load.
if _args.instance:
    _inst = json.loads(_args.instance.read_text(encoding="utf-8"))
else:
    _inst = instance_document()
    # The first view is the one the page shows with no code in the address, so it is asserted
    # here rather than left to the order of a list somebody may reorder.
    if _inst["views"][0]["key"] != "ZIB":
        sys.exit(f"[layout] the default view is written as the first one and the first one is "
                 f"{_inst['views'][0]['key']}. The page shows Investment Banking.")

_args.out.mkdir(parents=True, exist_ok=True)
_dest = _args.out / "instance.js"
_dest.write_text("window.GI=" + json.dumps(_inst, ensure_ascii=False, separators=(",", ":"))
                 + ";\n", encoding="utf-8")
print(f"wrote {_dest.name}  {_dest.stat().st_size / 1024:.1f} KB, {len(_inst['views'])} views")
_txt = _dest.read_text(encoding="utf-8")
_inst = json.loads(_txt[len("window.GI="):-len(";\n")])

build(_inst, _args.out)

# ---- the palette, reported where it is edited -------------------------------
# The verdict is not here, and that is a choice rather than an omission. scripts/check_repo.sh
# holds the threshold and the declared exceptions, because that is what CI runs on every push
# and no workflow runs this file at all; two places holding the same tolerance is how they come
# to disagree about it. What is here is the measurement, printed beside the build that ships the
# colours, so that somebody nudging a hex reads the consequence in the same breath instead of on
# a pull request an hour later.
_worst = {}
for _r in contrast_rows():
    _g = _r["ground"]
    if _g not in _worst or _r["ratio"] < _worst[_g]["ratio"]:
        _worst[_g] = _r
print("contrast: {} type colours on the band plate, worst {} at {:.4f} light and {} at {:.4f} "
      "dark. The threshold and the declared exceptions are in scripts/check_repo.sh.".format(
          len(_inst["types"]), _worst["light"]["label"], floor4(_worst["light"]["ratio"]),
          _worst["dark"]["label"], floor4(_worst["dark"]["ratio"])))

# ---- what the measurement bought -------------------------------------------
# How far the old hand written estimate was from the truth, and where the widths came from.
# The gates that used to be reported here now live inside layout(), which runs them per view.
if _errors:
    d, ctx, s, est, meas = max(_errors, key=lambda r: r[0])
    print(f"widths: {len(_errors)} measured, {len(_fellback)} estimated. Worst estimation "
          f"error {d:+.2f}px ({d / meas * 100:+.1f}% of measured) at {ctx}: the old estimate "
          f"said {est:.2f}px, the browser says {meas:.2f}px, for {s!r}")
if _fellback:
    seen, uniq = set(), []
    for ctx, s in _fellback:
        if (ctx, s) not in seen:
            seen.add((ctx, s))
            uniq.append((ctx, s))
    print(f"[layout] {len(uniq)} string(s) not in {WIDTHS_PATH.name}, estimated instead. "
          f"Re-run build/measure_labels.py to measure them:", file=sys.stderr)
    for ctx, s in uniq[:20]:
        print(f"[layout]   {ctx:<10} {s!r}", file=sys.stderr)
    if len(uniq) > 20:
        print(f"[layout]   ... and {len(uniq) - 20} more", file=sys.stderr)
