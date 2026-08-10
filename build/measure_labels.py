#!/usr/bin/env python3
"""Measure every string the layout measures, in a real browser, once.

The layout used to guess text width from a per character table written by hand. The guess is
baked into the shipped coordinates, so a font stack that resolves to a wider face than the
guess assumed pushes a label out of its column and into the neighbouring lane. This script
removes the guess: it renders every string as an SVG <text> in the exact font stack, size and
weight that `site/app.css` gives that string on the page, reads `getComputedTextLength()` for
each, and writes the answers to `build/label_widths.json`.

That file is committed. The build reads it and never opens a browser, so the build stays
deterministic and works offline; this script is the only thing that needs Chrome, and it is
run by hand when the strings or the styling change.

    python3 build/measure_labels.py            # write build/label_widths.json
    python3 build/measure_labels.py --check     # measure and diff, write nothing, exit 1 on drift

The font stack and the sizes are read out of `site/app.css` rather than repeated here, so the
measurement cannot quietly drift away from what the page draws.
"""
import argparse
import base64
import json
import pathlib
import re
import subprocess
import sys
import tempfile

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
from model import NODES, EDGES  # noqa: E402

# The model as the build lays it out, and there is only one drawing to lay out. This used to be
# the union of two views, the shipped one and an opt-in second cohort; the second cohort is
# gone (issue 42) and its strings go with it, or the table would hold widths for text no build
# can reach and nothing would ever say so.

CSS = ROOT / "site" / "app.css"
OUT = HERE / "label_widths.json"

# The headless shell first. It is the same Blink text stack and the same fontconfig as the
# full browser, so it shapes text identically, and it answers --dump-dom in about a second
# where the full binary was seen to hang on it for minutes on this machine.
CHROME_CANDIDATES = [
    "/home/jcherranz/.cache/ms-playwright/chromium_headless_shell-1228/"
    "chrome-headless-shell-linux64/chrome-headless-shell",
    "/home/jcherranz/.cache/ms-playwright/chromium_headless_shell-1208/"
    "chrome-headless-shell-linux64/chrome-headless-shell",
    "/home/jcherranz/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome",
    "/home/jcherranz/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome",
]

# The band captions are laid out by build_layout.py from the column widths, not from their own
# text, so they are measured for the overflow check rather than for wrapping. A caption that
# runs to more than one line is measured line by line, because that is how the check reads it:
# a caption is only legal if every line of it fits the lane on its own.
#
# This list is a second copy of the caption lines in build_layout.py's BANDS and has to be
# changed with it. The drift is not silent: a line this file has not measured is a line
# build_layout.py falls back to estimating, and it prints the string and a count of estimated
# widths at the end of every run.
BANDS = ["programme", "employers appear on click", "session templates", "instructors",
         "cohort sessions", "and the visit host",
         "cohort and students", "enrolment to claim"]

# Not named by the stylesheet, but a plausible resolution of its final `sans-serif` on a
# machine that is not this one. Included so the envelope covers them where they are installed.
# A family this machine does not hold shapes as the generic and adds nothing.
EXTRA_FAMILIES = ["DejaVu Sans", "Liberation Sans", "Arial", "Helvetica", "Noto Sans",
                  "FreeSans", "Nimbus Sans"]


# ---- read the styling out of the stylesheet --------------------------------
def css_text():
    return CSS.read_text(encoding="utf-8")


def css_var(name):
    m = re.search(r"--" + re.escape(name) + r":\s*([^;]+);", css_text())
    if not m:
        sys.exit(f"measure_labels: {CSS} has no --{name}")
    return " ".join(m.group(1).split())


def css_rule(selector):
    """Return the declarations of one rule as a dict, so a size cannot drift unnoticed."""
    m = re.search(re.escape(selector) + r"\s*\{([^}]*)\}", css_text())
    if not m:
        sys.exit(f"measure_labels: {CSS} has no rule for {selector}")
    out = {}
    for decl in m.group(1).split(";"):
        if ":" in decl:
            k, v = decl.split(":", 1)
            out[k.strip()] = " ".join(v.split())
    return out


# ---- the strings that need measuring ---------------------------------------
def runs(label):
    """Every contiguous run of words in a label, joined by single spaces.

    Greedy wrapping only ever measures a run of consecutive words, so measuring all of them
    means the lookup hits whatever wrap width the layout ends up using. Measuring only the
    finished lines would be circular: the lines depend on the widths.
    """
    w = label.split()
    return {" ".join(w[i:j]) for i in range(len(w)) for j in range(i + 1, len(w) + 1)}


def collect():
    """context key -> {css spec, strings}. The key is what build_layout.py looks up."""
    lbl, chip, band = css_rule(".node .lbl"), css_rule(".chip-tx"), css_rule(".band-cap")

    node_strings = set()
    for n in NODES:
        node_strings |= runs(n["label"])
    # The 9px context holds the edge verbs and any mark a node carries under its label; both
    # are drawn at the chip size.
    small = {v for _s, _t, v in EDGES} | {n["mark"] for n in NODES if n.get("mark")}

    # A ghost is drawn in italic (.lbl-ghost, .ghost .chip-tx). Italic is a different face with
    # different advances, so it gets its own contexts rather than borrowing the upright ones.
    ghost_strings = set()
    for n in NODES:
        if n.get("ghost"):
            ghost_strings |= runs(n["label"])
    ghost_ids = {n["id"] for n in NODES if n.get("ghost")}
    ghost_verbs = {v for s, t, v in EDGES if s in ghost_ids or t in ghost_ids}

    ctx = {
        # node labels as drawn: regular weight, the weight the layout wraps at
        f"{px(lbl['font-size'])}/400": {
            "css": {"font-size": lbl["font-size"], "font-weight": "400"},
            "note": "node labels and their wrap candidates, .node .lbl",
            "strings": node_strings,
        },
        # node labels while selected: .node.sel .lbl turns them bold, which is wider than the
        # box the layout reserved. Measured so the reserve can cover the bold case.
        f"{px(lbl['font-size'])}/600": {
            "css": {"font-size": lbl["font-size"], "font-weight": "600"},
            "note": "node labels while selected, .node.sel .lbl",
            "strings": {n["label"] for n in NODES} | node_strings,
        },
        f"{px(chip['font-size'])}/400": {
            "css": {"font-size": chip["font-size"], "font-weight": "400"},
            "note": "edge verb chips and node marks, .chip-tx",
            "strings": small,
        },
        f"{px(band['font-size'])}/{band['font-weight']}+caps": {
            "css": {"font-size": band["font-size"], "font-weight": band["font-weight"],
                    "letter-spacing": band["letter-spacing"],
                    "text-transform": band["text-transform"]},
            "note": "band captions, .band-cap",
            "strings": set(BANDS),
        },
    }
    if ghost_strings:
        ctx[f"{px(lbl['font-size'])}/400i"] = {
            "css": {"font-size": lbl["font-size"], "font-weight": "400",
                    "font-style": "italic"},
            "note": "ghost node labels, .lbl-ghost",
            "strings": ghost_strings,
        }
        ctx[f"{px(lbl['font-size'])}/600i"] = {
            "css": {"font-size": lbl["font-size"], "font-weight": "600",
                    "font-style": "italic"},
            "note": "ghost node labels while selected",
            "strings": ghost_strings,
        }
    if ghost_verbs:
        ctx[f"{px(chip['font-size'])}/400i"] = {
            "css": {"font-size": chip["font-size"], "font-weight": "400",
                    "font-style": "italic"},
            "note": "ghost edge verb chips, .ghost .chip-tx",
            "strings": ghost_verbs,
        }
    return ctx


def px(v):
    return f"{float(v.rstrip('px')):g}"


# ---- measure ----------------------------------------------------------------
PAGE = """<!doctype html><meta charset="utf-8"><title>measure</title>
<style>html,body{margin:0}svg{position:absolute;visibility:hidden}</style>
<svg id="s" width="4000" height="4000"></svg><pre id="out"></pre>
<script>
var JOB = __JOB__;
var FAMILIES = __FAMILIES__;
var svg = document.getElementById('s');

function width(family, css, s) {
  var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  t.setAttribute('x', 0); t.setAttribute('y', 100);
  t.style.fontFamily = family;
  Object.keys(css).forEach(function (k) { t.style.setProperty(k, css[k]); });
  t.textContent = s;
  svg.appendChild(t);
  var w = t.getComputedTextLength();
  svg.removeChild(t);
  return w;
}

// The envelope. The site names ten families and falls through to whichever the machine has,
// so the width that matters is not the one this machine happens to shape but the widest any
// viewer's machine might. Every string is shaped under every family this machine can resolve
// distinctly and the largest is kept. A face this machine does not hold cannot be measured
// here and is not in the envelope; that limit is recorded, not papered over.
// Two decimals, rounded up. At three, a width prints as one to three digits, a dot and three
// more, which is exactly how a grouped money figure is written in Spanish, and the
// forbidden-content gate reads every tracked file and says so. The gate is right to read it
// that way; two decimals cannot be read that way, and the precision it costs is a twentieth
// of a pixel against margins measured in whole ones.
function px2(w) { return Math.ceil(w * 100) / 100; }

var res = {}, per = {};
Object.keys(JOB).forEach(function (key) {
  var ctx = JOB[key];
  res[key] = {};
  per[key] = {};
  FAMILIES.forEach(function (fam) {
    var worst = 0;
    ctx.strings.forEach(function (s) {
      var w = width(fam, ctx.css, s);
      if (res[key][s] === undefined || w > res[key][s]) res[key][s] = w;
      if (w > worst) worst = w;
    });
    per[key][fam] = px2(worst);
  });
  Object.keys(res[key]).forEach(function (s) {
    res[key][s] = px2(res[key][s]);
  });
});

// Which faces this machine can actually tell apart. getComputedStyle only echoes the list
// back, so identify by width: shape one probe string under each name and group the ones that
// shape it identically. A name that matches plain sans-serif is not installed.
var PROBE = 'Handgloves 0123 WMil, \\u00f1\\u00cd';
var probes = {};
FAMILIES.concat(['sans-serif']).forEach(function (f) {
  probes[f] = px2(width(f, {'font-size': '10px'}, PROBE));
});
var payload = JSON.stringify({
  widths: res, probes: probes, per_family_max: per, ua: navigator.userAgent
});
// base64 so that --dump-dom's HTML escaping cannot touch it
document.getElementById('out').textContent =
  btoa(String.fromCharCode.apply(null, new TextEncoder().encode(payload)));
</script>
"""


def chrome():
    for c in CHROME_CANDIDATES:
        if pathlib.Path(c).is_file():
            return c
    sys.exit("measure_labels: no Chrome found; see CHROME_CANDIDATES")


def measure(job, families):
    payload = {k: {"css": v["css"], "strings": sorted(v["strings"])} for k, v in job.items()}
    html = (PAGE.replace("__JOB__", json.dumps(payload, ensure_ascii=False))
                .replace("__FAMILIES__", json.dumps(families, ensure_ascii=False)))
    binary = chrome()
    argv = [binary, "--no-sandbox", "--disable-gpu", "--virtual-time-budget=5000"]
    if "headless-shell" not in binary:
        argv.insert(1, "--headless")
    # ignore_cleanup_errors: the browser leaves lock files behind under its profile and the
    # measurement is already out by then.
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as td:
        page = pathlib.Path(td) / "measure.html"
        page.write_text(html, encoding="utf-8")
        proc = subprocess.run(argv + [f"--user-data-dir={td}/profile", "--dump-dom",
                                      page.as_uri()],
                              capture_output=True, text=True, timeout=180)
    m = re.search(r'<pre id="out">([A-Za-z0-9+/=]*)</pre>', proc.stdout)
    if not m or not m.group(1):
        sys.stderr.write(proc.stderr[-2000:])
        sys.exit("measure_labels: the page produced no measurements")
    return json.loads(base64.b64decode(m.group(1)).decode("utf-8"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="measure and compare against the committed file, write nothing")
    args = ap.parse_args()

    stack = css_var("font-ui")
    # The stack as written, then each family in it on its own, then the generic. Whichever of
    # them this machine holds gets shaped; the rest silently fall through to the generic and
    # add nothing but a duplicate, which the max absorbs.
    families = [stack] + [f.strip().strip('"') for f in stack.split(",")] + EXTRA_FAMILIES
    families = list(dict.fromkeys(families))
    job = collect()
    got = measure(job, families)

    distinct = {}
    for fam, w in got["probes"].items():
        distinct.setdefault(w, []).append(fam)

    doc = {
        "_readme": ("Measured in a real browser by build/measure_labels.py. Keys under widths "
                    "are font-size/font-weight, with +caps where the stylesheet uppercases and "
                    "letter-spaces the text. A value is the WIDEST width the string takes "
                    "across every family in the site's font stack that this machine can "
                    "resolve, not the width on this machine's own resolution: the layout has "
                    "to hold on a viewer's machine too. Families the machine does not hold "
                    "cannot be measured and are not covered; see probes, where families "
                    "sharing a probe width are the same face. Committed so the build is "
                    "deterministic and needs no browser. Regenerate with "
                    "python3 build/measure_labels.py."),
        "font_stack": stack,
        "envelope": families,
        "probes": got["probes"],
        "distinct_faces": len(distinct),
        "engine": got["ua"],
        "contexts": {k: {"css": v["css"], "note": v["note"]} for k, v in job.items()},
        "widths": got["widths"],
    }
    text = json.dumps(doc, ensure_ascii=False, indent=1, sort_keys=True) + "\n"

    if args.check:
        old = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if old == text:
            print(f"label widths unchanged, {sum(len(v) for v in got['widths'].values())} strings")
            return 0
        print("label widths DIFFER from the committed file; run without --check to update")
        return 1

    OUT.write_text(text, encoding="utf-8")
    n = sum(len(v) for v in got["widths"].values())
    print(f"{OUT.relative_to(ROOT)}  {n} strings in {len(got['widths'])} contexts  "
          f"{OUT.stat().st_size / 1024:.1f} KB")
    for k, v in sorted(got["widths"].items()):
        print(f"  {k:<12} {len(v):>4} strings")
    print(f"  {len(distinct)} distinct faces reachable on this machine:")
    for w, fams in sorted(distinct.items()):
        print(f"    probe {w:7.2f}  {', '.join(fams)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
