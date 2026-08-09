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
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from model import TYPES, NODES, EDGES  # noqa: E402

COL_W = [166, 232, 122, 124, 80, 102, 92, 92]
GAP_X, MARGIN_X = 18, 22
BAND_TOP, BAND_PAD, BAND_GAP = 21, 9, 10
MARGIN_Y = BAND_TOP + 16
TILE, GAP_LABEL, LINE_H, FONT = 34, 7, 11.5, 10.0
MIN_GAP = 26
NCOL = len(COL_W)

# Column bands. Each is a run of columns holding one kind of thing, drawn as its own lane
# with its own caption. The instructors and the session templates sit in bands of their own
# for exactly this reason: they are different kinds of object and the drawing should say so
# without relying on tile colour.
BANDS = [
    ([0], "programme and employer"),
    ([1], "session templates"),
    ([2], "instructors"),
    ([3], "cohort sessions"),
    ([4, 5], "cohort and students"),
    ([6, 7], "enrolment to claim"),
]

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


nodes = {n["id"]: dict(n) for n in NODES}
order = [n["id"] for n in NODES]
for nid, n in nodes.items():
    n["col"] = n.get("col", TYPE_COL[n["type"]])
    it = bool(n.get("ghost"))
    n["lines"] = wrap(n["label"], COL_W[n["col"]] - 8, it)
    # Reserve the bold width, not the regular one. Clicking a node turns its label bold
    # (.node.sel .lbl), which is about a fifth wider, and the reserved box has to hold the
    # state the page enters on a click as well as the one it starts in.
    n["lw"] = max(max(text_w(ln, FONT, 400, it) for ln in n["lines"]),
                  max(text_w(ln, FONT, 600, it) for ln in n["lines"]))
    # A node carrying a mark spends one more line under its label saying what it is missing,
    # so it reserves the height for it here and the browser only draws.
    n["nlines"] = len(n["lines"]) + (1 if n.get("mark") else 0)
    if n.get("mark"):
        n["lw"] = max(n["lw"], text_w(n["mark"], 9.0))
    n["h"] = TILE + GAP_LABEL + LINE_H * n["nlines"]
    n["x"] = COLX[n["col"]]

# ---- the gate the measurement exists for -----------------------------------
# A lane is a band of columns holding one kind of object, and the drawing's whole claim is
# that a reader can tell the kinds apart by lane. A label wider than its lane breaks that
# claim, and it breaks it silently: the page still renders. So it is checked here, before a
# single coordinate is written, against measured widths rather than guessed ones.
BAND_X = {}
for _cs, _label in BANDS:
    _x0 = COLX[_cs[0]] - COL_W[_cs[0]] / 2 - BAND_PAD
    _x1 = COLX[_cs[-1]] + COL_W[_cs[-1]] / 2 + BAND_PAD
    for _c in _cs:
        BAND_X[_c] = (_x0, _x1, _label)


def lane_slack(n):
    x0, x1, _lab = BAND_X[n["col"]]
    return min(n["x"] - n["lw"] / 2 - x0, x1 - n["x"] - n["lw"] / 2)


LANE_TIGHT = min(((lane_slack(n), nid) for nid, n in nodes.items()), default=(0.0, None))
_over = sorted((lane_slack(n), nid, n["label"], BAND_X[n["col"]][2])
               for nid, n in nodes.items() if lane_slack(n) < 0)

# The caption over a lane is sized by the columns under it, not by its own text, so it can
# outgrow the lane it names without anything noticing.
for _cs, _label in BANDS:
    _x0, _x1, _ = BAND_X[_cs[0]]
    _x1 = BAND_X[_cs[-1]][1]
    _cap = text_w(_label, 9.0, 600, False, True)
    if _cap > _x1 - _x0:
        _over.append((_x1 - _x0 - _cap, "band", _label, _label))

if _over:
    for slack, nid, label, lab in _over:
        print(f"[layout] LANE OVERFLOW by {-slack:.1f}px: {label!r} ({nid}) leaves the "
              f"{lab!r} lane", file=sys.stderr)
    sys.exit("[layout] refusing to write a drawing in which a label crosses a lane boundary")

adj = {nid: [] for nid in nodes}
for a, b, _v in EDGES:
    adj[a].append(b)
    adj[b].append(a)

cols = [[nid for nid in order if nodes[nid]["col"] == c] for c in range(NCOL)]
H = max(sum(nodes[i]["h"] for i in c) + MIN_GAP * (len(c) - 1) for c in cols if c)


SPREAD, SPREAD_FROM = 0.42, 4


def pack(ordering, c=0):
    """Place a column's nodes in sequence, vertically centred, honouring MIN_GAP.

    A short column on the right of the field opens its gaps until it spans a share of the
    height. Without that, the enrolment to claim chain reads as a small clump adrift in a tall
    empty lane, which is what made the right of the earlier drawing look abandoned. Columns on
    the left stay packed: they carry edges that run the width of the drawing, and spreading
    them drags those edges through other lanes' labels.
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
        want = {}
        for nid in cols[c]:
            ys = [nodes[m]["y"] for m in adj[nid] if nodes[m]["col"] != c]
            want[nid] = sum(ys) / len(ys) if ys else nodes[nid]["y"]
        cols[c].sort(key=lambda n: (want[n], order.index(n)))
        pack(cols[c], c)

top = min(n["y"] - n["h"] / 2 for n in nodes.values())
for n in nodes.values():
    n["y"] += MARGIN_Y - top
height = max(n["y"] + n["h"] / 2 for n in nodes.values()) + 14


def tile_y(n):
    return n["y"] - (n["h"] - TILE) / 2


# ---- edge geometry ---------------------------------------------------------
def bez(pts, t):
    (ax, ay), (bx, by), (cx, cy), (dx_, dy) = pts
    u = 1 - t
    return (u ** 3 * ax + 3 * u * u * t * bx + 3 * u * t * t * cx + t ** 3 * dx_,
            u ** 3 * ay + 3 * u * u * t * by + 3 * u * t * t * cy + t ** 3 * dy)


edges = []
for a, b, verb in EDGES:
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

# ---- verb chips ------------------------------------------------------------
# A chip carries the verb, so the drawing is a data model and not a picture, and a verb that
# floats free of its line does not say which edge it names. Each chip is therefore anchored to
# the midpoint of its own path by arc length, which is the one point on a curve that reads as
# the middle of that line whatever the curve does near its ends.
#
# Where a chip would land on a tile, on a label or on another chip it slides along its own
# path first: a chip that has moved along its line is still unambiguously on that line, while
# one that has moved off it is not. Stepping off the line is the last resort and is capped at
# CHIP_PERP, which is under one chip height, so no chip can end up adrift the way the old
# greedy search let 'claims against' end up 134px below its own edge.
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

blocked = []
for n in nodes.values():
    blocked.append((n["x"], tile_y(n), TILE + 6, TILE + 6))
    lab_h = LINE_H * n["nlines"]
    blocked.append((n["x"], tile_y(n) + TILE / 2 + GAP_LABEL + lab_h / 2, n["lw"] + 6, lab_h + 2))
chips = []


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

# ---- the gate on the chips -------------------------------------------------
# A chip off its line is the defect this placement exists to remove, and like a label leaving
# its lane it is invisible in a diff: the page still renders. So it is measured here, against
# the coordinates about to be written, and the build refuses rather than publishes.
CHIP_MAX_OFF = CHIP_PERP + 0.5   # half a chip height, so the line crosses the chip


def dist_to_path(pt, pts, n=400):
    return min(math.hypot(pt[0] - x, pt[1] - y)
               for x, y in (bez(pts, i / n) for i in range(n + 1)))


chip_off = [(dist_to_path((e["cx"], e["cy"]), e["pts"]), e) for e in edges]
chip_mid = [(math.hypot(e["cx"] - e["mid"][0], e["cy"] - e["mid"][1]), e) for e in edges]
_adrift = [(d, e) for d, e in chip_off if d > CHIP_MAX_OFF]
if _adrift:
    for d, e in sorted(_adrift, reverse=True, key=lambda r: r[0]):
        print(f"[layout] CHIP ADRIFT by {d:.1f}px: {e['v']!r} on {e['s']}->{e['t']}",
              file=sys.stderr)
    sys.exit("[layout] refusing to write a drawing in which a verb floats free of its line")

bands = []
for cs, label in BANDS:
    x0 = COLX[cs[0]] - COL_W[cs[0]] / 2 - BAND_PAD
    x1 = COLX[cs[-1]] + COL_W[cs[-1]] / 2 + BAND_PAD
    bands.append({"x": round(x0, 1), "w": round(x1 - x0, 1), "label": label})

out = {
    "w": W, "h": round(height), "bandTop": BAND_TOP,
    "bands": bands,
    "types": [{"k": k, "label": lab, "c": col, "glyph": g,
               "ghost": 1 if k == "Ghost" else None}
              for k, lab, col, g, _c in TYPES],
    "tile": TILE, "lineH": LINE_H, "gapLabel": GAP_LABEL, "font": FONT,
    "nodes": [{"id": n["id"], "type": n["type"], "label": n["label"], "lines": n["lines"],
               "x": round(n["x"], 1), "y": round(tile_y(n), 1),
               "count": n.get("count"), "props": n["props"],
               "ghost": 1 if n.get("ghost") else None,
               "mark": n.get("mark"), "note": n.get("note")}
              for n in (nodes[i] for i in order)],
    "edges": [{"s": e["s"], "t": e["t"], "v": e["v"], "d": e["d"],
               "ghost": 1 if e["ghost"] else None,
               "cx": round(e["cx"], 1), "cy": round(e["cy"], 1),
               "cw": round(e["cw"], 1), "rev": e["rev"],
               "ax": round(e["ax"], 1), "ay": round(e["ay"], 1), "aa": round(e["aa"], 1)}
              for e in edges],
}
# Build id: a short digest of the drawing itself. It goes into every feedback report so a
# note can be tied to the exact bytes that were on screen when it was written.
payload = json.dumps(out, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
out["build"] = hashlib.sha256(payload.encode("utf-8")).hexdigest()[:7]

dest = pathlib.Path(__file__).resolve().parent.parent / "site" / "graph.js"
dest.write_text("window.G=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n",
                encoding="utf-8")
print(f"nodes {len(out['nodes'])}  edges {len(out['edges'])}  "
      f"viewBox {W}x{out['h']}  aspect {W / out['h']:.2f}  build {out['build']}  "
      f"{dest.stat().st_size / 1024:.1f} KB")
for c in range(NCOL):
    if cols[c]:
        span = (max(nodes[i]['y'] + nodes[i]['h'] / 2 for i in cols[c])
                - min(nodes[i]['y'] - nodes[i]['h'] / 2 for i in cols[c]))
        print(f"  col {c}  w {COL_W[c]:>3}  n {len(cols[c]):>2}  span {span:6.1f}  "
              f"maxlines {max(len(nodes[i]['lines']) for i in cols[c])}")

# ---- what the measurement bought, and whether the drawing holds -------------
# Two reports and one gate. The reports say how far the old estimate was from the truth and
# where the widths came from; the gate refuses a drawing in which a label leaves its lane,
# which is the defect the measurement exists to remove and is not visible in a diff.
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

print(f"lanes: tightest label has {LANE_TIGHT[0]:.1f}px of lane to spare ({LANE_TIGHT[1]})")

_wo, _we = max(chip_off, key=lambda r: r[0])
_wm, _wme = max(chip_mid, key=lambda r: r[0])
_on_mid = sum(1 for d, _e in chip_mid if d < 0.5)
print(f"chips: {len(edges)} verbs, {_on_mid} sitting on the exact midpoint of their edge. "
      f"Worst offset from the midpoint {_wm:.1f}px ({_wme['v']!r} on "
      f"{_wme['s']}->{_wme['t']}); worst distance from the line itself {_wo:.1f}px "
      f"({_we['v']!r} on {_we['s']}->{_we['t']}), cap {CHIP_MAX_OFF:.1f}px")
