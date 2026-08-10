#!/usr/bin/env python3
"""Degenerate Sugiyama layout for the toy instance graph.

Columns are fixed by object type, with a per-node override for the nodes whose instances
play different roles. Order within a column comes from barycentre sweeps. Y is relaxed
towards the mean of each node's neighbours, then packed to a minimum gap. Columns are
gathered into named bands so that two adjacent columns of different kinds of thing read as
two different lanes rather than one striped list. Coordinates are written to site/graph.js;
the browser only draws.

The whole drawing is sized to be readable inside one 1440x900 viewport with the header and
the footer taken out, so the target aspect is roughly two to one and the target height is
around 650 user units.
"""
import hashlib
import json
import math
import os
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from model import (TYPES, NODES, EDGES, ROSTER_ROWS, COHORT_HEADCOUNT,  # noqa: E402
                   DRAWN_STUDENTS)

COL_W = [166, 232, 122, 124, 80, 102, 92, 92]
GAP_X, MARGIN_X = 18, 22
BAND_PAD, BAND_GAP = 9, 10
TILE, GAP_LABEL, LINE_H, FONT = 34, 7, 11.5, 10.0
MIN_GAP = 26
# Two nodes in a column can never sit closer than this, so a barycentre difference smaller than
# it is not a preference about rows. The near-tie repair in layout() reads it as its tolerance.
NEAR = MIN_GAP
NCOL = len(COL_W)

# Column bands. Each is a run of columns holding one kind of thing, drawn as its own lane
# with its own caption. The instructors and the session templates sit in bands of their own
# for exactly this reason: they are different kinds of object and the drawing should say so
# without relying on tile colour.
#
# A caption is a claim about the type of everything under it, so it has to hold for every tile
# in the lane and not merely for most of them. The cohort sessions lane also holds the empresa
# colaboradora, whose visit attaches at session level, and that placement is right: the finde
# presencial is a session level event and the "hosts visit" edge leaves from beside the
# sessions it is about. The caption is therefore the thing that had to change. Captions are
# written as a tuple of lines rather than one string because a lane is only as wide as the
# columns under it and a longer caption has nowhere to go sideways.
BANDS = [
    # Plural since issue 49: the lane held one employer and now holds five, and a caption is a
    # claim about everything under it. Two lines since issue 48, which stopped painting those
    # five until the instructor each of them employs is clicked. A lane captioned only
    # "programme", holding one tile in a tall empty strip, would be true of what is on screen and
    # would hide that there is anything else in it; a lane still captioned "programme and
    # employers" with no employer under it reads as five tiles that failed to load. The second
    # line is the affordance, so the emptiness is legible as a state rather than as a fault. It
    # costs no height: the cohort sessions lane below already runs to two lines, and BAND_TOP
    # reserves headroom for the longest caption rather than for each one.
    ([0], ("programme", "employers appear on click")),
    ([1], ("session templates",)),
    ([2], ("instructors",)),
    ([3], ("cohort sessions", "and the visit host")),
    # Two lines since issue 51, for the same reason the programme lane grew one in issue 48: the
    # lane holds four Student tiles that nothing paints until the students card is clicked, and a
    # caption naming only what is on screen would hide that the lane holds anything else. It
    # costs no height, since BAND_TOP reserves for the longest caption and another lane already
    # runs to two lines.
    ([4, 5], ("cohort and students", "individuals appear on click")),
    ([6, 7], ("enrolment to claim",)),
]

# The last caption line sits CAP_GAP above the top of the bands and any line before it stacks
# above that, so the drawing gains headroom only if some lane actually needs a second line.
CAP_LH, CAP_GAP = 11.0, 7
BAND_TOP = 21 + round(CAP_LH * (max(len(lines) for _cs, lines in BANDS) - 1))
MARGIN_Y = BAND_TOP + 16

COLX, _acc = [], MARGIN_X
_band_of = {c: i for i, (cs, _l) in enumerate(BANDS) for c in cs}
for c, w in enumerate(COL_W):
    if c and _band_of[c] != _band_of[c - 1]:
        _acc += BAND_PAD + BAND_GAP + BAND_PAD - GAP_X
    COLX.append(_acc + w / 2)
    _acc += w + GAP_X
W = round(_acc - GAP_X + MARGIN_X)

TYPE_COL = {t[0]: t[4] for t in TYPES}

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


def wrap(label, maxw, italic=False):
    lines, cur = [], ""
    for word in label.split():
        trial = (cur + " " + word).strip()
        if cur and text_w(trial, FONT, 400, italic) > maxw:
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
for _cs, _lines in BANDS:
    _x0 = COLX[_cs[0]] - COL_W[_cs[0]] / 2 - BAND_PAD
    _x1 = COLX[_cs[-1]] + COL_W[_cs[-1]] / 2 + BAND_PAD
    for _c in _cs:
        BAND_X[_c] = (_x0, _x1, " ".join(_lines))

# The caption over a lane is sized by the columns under it, not by its own text, so it can
# outgrow the lane it names without anything noticing. Every line is checked, not the caption
# as a whole: a caption that is only legal because it was split has to be legal line by line.
# It depends on no node, so it is checked once rather than once per drawing.
CAP_OVER = []
for _cs, _lines in BANDS:
    _x0 = BAND_X[_cs[0]][0]
    _x1 = BAND_X[_cs[-1]][1]
    for _line in _lines:
        _cap = text_w(_line, 9.0, 600, False, True)
        if _cap > _x1 - _x0:
            CAP_OVER.append((_x1 - _x0 - _cap, "band", _line, " ".join(_lines)))


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


def layout(model_nodes, model_edges, tag):
    """Lay one model out and return the object the browser draws.

    It is a function rather than module-level code because it once laid out two drawings, a
    one cohort view and an opt-in two cohort one, and the property that mattered was that
    neither could move the other: the columns, the bands and the measured widths are shared
    and nothing in here touches module state. The second cohort is gone (issue 42) and the
    isolation is kept, because it is what makes "the drawing is a pure function of the model"
    a statement that can be checked by running the build twice rather than a claim.
    """
    nodes = {n["id"]: dict(n) for n in model_nodes}
    order = [n["id"] for n in model_nodes]
    for nid, n in nodes.items():
        n["col"] = n.get("col", TYPE_COL[n["type"]])
        it = bool(n.get("ghost"))
        n["lines"] = wrap(n["label"], COL_W[n["col"]] - 8, it)
        # Reserve the bold width, not the regular one. Clicking a node turns its label bold
        # (.node.sel .lbl), which is about a fifth wider, and the reserved box has to hold the
        # state the page enters on a click as well as the one it starts in.
        n["lw"] = max(max(text_w(ln, FONT, 400, it) for ln in n["lines"]),
                      max(text_w(ln, FONT, 600, it) for ln in n["lines"]))
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

    def lane_slack(n):
        x0, x1, _lab = BAND_X[n["col"]]
        return min(n["x"] - n["lw"] / 2 - x0, x1 - n["x"] - n["lw"] / 2)

    lane_tight = min(((lane_slack(n), nid) for nid, n in nodes.items()), default=(0.0, None))
    over = sorted((lane_slack(n), nid, n["label"], BAND_X[n["col"]][2])
                  for nid, n in nodes.items() if lane_slack(n) < 0) + CAP_OVER
    if over:
        for slack, nid, label, lab in over:
            print(f"[layout:{tag}] LANE OVERFLOW by {-slack:.1f}px: {label!r} ({nid}) leaves "
                  f"the {lab!r} lane", file=sys.stderr)
        sys.exit("[layout] refusing to write a drawing in which a label crosses a lane boundary")

    adj = {nid: [] for nid in nodes}
    for a, b, _v in model_edges:
        adj[a].append(b)
        adj[b].append(a)

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
    for a, b, verb in model_edges:
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
                      "ghost": bool(na.get("ghost") or nb.get("ghost"))})

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

    bands = []
    for cs, lines in BANDS:
        x0 = COLX[cs[0]] - COL_W[cs[0]] / 2 - BAND_PAD
        x1 = COLX[cs[-1]] + COL_W[cs[-1]] / 2 + BAND_PAD
        bands.append({"x": round(x0, 1), "w": round(x1 - x0, 1),
                      "label": " ".join(lines), "lines": list(lines)})

    out = {
        "w": W, "h": round(height), "bandTop": BAND_TOP,
        "capLineH": CAP_LH, "capGap": CAP_GAP,
        "bands": bands,
        "types": [{"k": k, "label": lab, "c": col, "glyph": g,
                   "ghost": 1 if k == "Ghost" else None}
                  for k, lab, col, g, _c in TYPES],
        "tile": TILE, "lineH": LINE_H, "gapLabel": GAP_LABEL, "font": FONT,
        "nodes": [{"id": n["id"], "type": n["type"], "label": n["label"], "lines": n["lines"],
                   "x": round(n["x"], 1), "y": round(tile_y(n), 1),
                   "count": n.get("count"), "props": n["props"], "route": n["route"],
                   "ghost": 1 if n.get("ghost") else None,
                   "mark": n.get("mark"), "tail": n.get("tail"), "note": n.get("note")}
                  for n in (nodes[i] for i in order)],
        "edges": [{"s": e["s"], "t": e["t"], "v": e["v"], "d": e["d"],
                   "ghost": 1 if e["ghost"] else None,
                   "cx": round(e["cx"], 1), "cy": round(e["cy"], 1),
                   "cw": round(e["cw"], 1), "rev": e["rev"],
                   "ax": round(e["ax"], 1), "ay": round(e["ay"], 1), "aa": round(e["aa"], 1)}
                  for e in edges],
        # The cohort as rows, for the sheet at #/students, which is the view that answers "who
        # is in it" where the drawing answers "what shape is a student". It is carried in the
        # drawing's own file and covered by the drawing digest for one reason: it is the model,
        # not page furniture, and a reader who files a note about a row is filing it against a
        # commit and a digest that pin the bytes the row came from. owner names the node the
        # sheet belongs to, so nothing in the browser holds the id 'students' as a literal.
        "roster": {"n": COHORT_HEADCOUNT, "drawn": DRAWN_STUDENTS, "owner": "students",
                   "rows": ROSTER_ROWS},
    }
    # A short digest of the drawing itself, and it is called drawingDigest because that is what
    # it is. It was called "build" and it went into every feedback report on its own, where seven
    # lowercase hex characters read as an abbreviated commit to every engineer alive: the one
    # action the value invited, looking the revision up, failed with "not a valid object name",
    # and a report could not say what code the reporter saw. Issue 47. The commit now comes from
    # site/version.js, written at deploy time, and this stays for the one question it can answer,
    # whether two pages are drawing the same geometry.
    payload = json.dumps(out, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
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


# ---- the one view -----------------------------------------------------------
# window.G is the drawing, and there is exactly one. There was a second, an opt-in two cohort
# view on a header switch, and it is gone: the toy shows one cohort, always, which is the whole
# of issue 42. Its removal cost this drawing nothing, and that is checkable rather than
# asserted, because the two were always laid out independently: the bytes of window.G are
# identical either side of the change.
base = layout(NODES, EDGES, "one cohort")

site = pathlib.Path(__file__).resolve().parent.parent / "site"

# The width of the drawing is computed here and read by the stylesheet through the --drawing-w
# custom property that app.js writes. If it is ever typed into app.css as well the two will
# disagree the first time a column changes width, and the symptom is quiet: on a narrow
# viewport the canvas would stop short of the drawing or scroll past it into blank space. So
# refuse to build while a copy of the number is sitting in the stylesheet.
_css = (site / "app.css").read_text(encoding="utf-8")
# Not \b: in "1230px" there is no word boundary between the 0 and the p, so \b would let the
# very form the number takes in a stylesheet through untouched.
if re.search(r"(?<![\d.])" + str(base["w"]) + r"(?![\d.])", _css):
    sys.exit(f"[layout] app.css contains the literal {base['w']}, the width of the drawing. "
             f"The stylesheet must read var(--drawing-w) instead.")

dest = site / "graph.js"
dest.write_text(
    "window.G=" + json.dumps(base, ensure_ascii=False, separators=(",", ":")) + ";\n",
    encoding="utf-8")
print(f"wrote {dest.name}  {dest.stat().st_size / 1024:.1f} KB")

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
