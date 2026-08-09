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
NARROW, WIDE = set("ijlt.,;:!'|íÍ "), set("mwMW@")


def text_w(s, size=FONT):
    u = sum(0.30 if c in NARROW else 0.86 if c in WIDE else 0.62 if c.isupper() else 0.53
            for c in s)
    return u * size


def wrap(label, maxw):
    lines, cur = [], ""
    for word in label.split():
        trial = (cur + " " + word).strip()
        if cur and text_w(trial) > maxw:
            lines.append(cur)
            cur = word
        else:
            cur = trial
    if cur:
        lines.append(cur)
    return lines[:3]


nodes = {n["id"]: dict(n) for n in NODES}
order = [n["id"] for n in NODES]
for nid, n in nodes.items():
    n["col"] = n.get("col", TYPE_COL[n["type"]])
    n["lines"] = wrap(n["label"], COL_W[n["col"]] - 8)
    n["lw"] = max(text_w(ln) for ln in n["lines"])
    n["h"] = TILE + GAP_LABEL + LINE_H * len(n["lines"])
    n["x"] = COLX[n["col"]]

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
                  "rev": nb["col"] < na["col"], "span": span})

# ---- verb chips: slide along the line until a slot free of tiles, labels and
#      other chips is found -------------------------------------------------
CH, PADX = 12.0, 5.0
TS = [0.50, 0.42, 0.58, 0.35, 0.65, 0.28, 0.72, 0.21, 0.79]
blocked = []
for n in nodes.values():
    blocked.append((n["x"], tile_y(n), TILE + 4, TILE + 4))
    lab_h = LINE_H * len(n["lines"])
    blocked.append((n["x"], tile_y(n) + TILE / 2 + GAP_LABEL + lab_h / 2, n["lw"] + 6, lab_h + 3))
chips = []


def hits(x, y, w, boxes):
    return sum(1 for bx, by, bw, bh in boxes
               if abs(x - bx) < (w + bw) / 2 + 3 and abs(y - by) < (CH + bh) / 2 + 2)


for e in sorted(edges, key=lambda e: -e["span"]):
    e["cw"] = text_w(e["v"], 9.0) + 2 * PADX
    best, best_n = None, 1e9
    for t in TS:
        x, y = bez(e["pts"], t)
        n_hit = hits(x, y, e["cw"], blocked + chips)
        if n_hit == 0:
            best, best_n = (x, y), 0
            break
        if n_hit < best_n:
            best, best_n = (x, y), n_hit
    if best_n:  # no clean slot on the line: step off it, smallest offset that clears
        x, y = best
        for cand in [y + s * k * (CH + 3) for k in range(1, 12) for s in (-1, 1)]:
            if hits(x, cand, e["cw"], blocked + chips) == 0:
                y = cand
                break
        best = (x, y)
    e["cx"], e["cy"] = best
    chips.append((e["cx"], e["cy"], e["cw"] + 2, CH))

for e in edges:
    p0, p1, p2, p3 = e["pts"]
    tip, ctl = (p0, p1) if e["rev"] else (p3, p2)
    e["ax"], e["ay"] = tip
    e["aa"] = math.degrees(math.atan2(tip[1] - ctl[1], tip[0] - ctl[0]))

height = max(height, max(e["cy"] for e in edges) + 26,
             *[bez(e["pts"], 0.5)[1] + 26 for e in edges if e["span"] >= 3])

bands = []
for cs, label in BANDS:
    x0 = COLX[cs[0]] - COL_W[cs[0]] / 2 - BAND_PAD
    x1 = COLX[cs[-1]] + COL_W[cs[-1]] / 2 + BAND_PAD
    bands.append({"x": round(x0, 1), "w": round(x1 - x0, 1), "label": label})

out = {
    "w": W, "h": round(height), "bandTop": BAND_TOP,
    "bands": bands,
    "types": [{"k": k, "label": lab, "c": col, "glyph": g} for k, lab, col, g, _c in TYPES],
    "tile": TILE, "lineH": LINE_H, "gapLabel": GAP_LABEL, "font": FONT,
    "nodes": [{"id": n["id"], "type": n["type"], "label": n["label"], "lines": n["lines"],
               "x": round(n["x"], 1), "y": round(tile_y(n), 1),
               "count": n.get("count"), "props": n["props"]}
              for n in (nodes[i] for i in order)],
    "edges": [{"s": e["s"], "t": e["t"], "v": e["v"], "d": e["d"],
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
