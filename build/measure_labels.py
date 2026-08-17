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
    python3 build/measure_labels.py --check    # measure and compare, write nothing

The font stack and the sizes are read out of `site/app.css` rather than repeated here, so the
measurement cannot quietly drift away from what the page draws.

WHAT --check SAYS, AND WHY IT IS NOT A BYTE DIFF ANY MORE. Issue 221. It was one, `old == text`
over the whole rendered document, and measured on the machine that wrote the table it exited 1
over three surplus rows, zero value changes and zero missing entries. Those three rows are the
state scripts/check_build.sh has already ruled on in as many words, "dead weight, not a wrong
coordinate", so the old --check went red for a state this repository has decided is not a defect,
and it would go red a second way on any machine whose resolvable font set differs from the one
that measured the table, and a third way on nothing but a browser upgrade, because the rendered
document carries the engine's user-agent string. A check that cannot tell those apart from a
number edited by hand is too coarse to gate on, and wiring it as it stood would have trained a
reader to ignore it.

So it separates the states it used to add up, and its exit code says which one it is in:

    0  the table agrees with this machine, on an envelope this machine measured the same way
    1  a defect: a value differs on the SAME envelope, or the job asks for a string the table
       does not hold, or the table's declared per-context CSS is no longer what the stylesheet
       says. Every one of those is a table that must be regenerated before it is trusted
    2  THIS RUN ESTABLISHED NOTHING: no browser, a page that answered nothing, a job that
       enumerated nothing, or no committed table to compare against. It is neither agreement
       nor disagreement and it is never reported as either
    3  measured, and the ENVELOPE differs: this machine resolves a different set of faces than
       the one that wrote the table, so the values are not comparable and were not compared.
       Membership was, because it does not depend on a font

A row the table holds that no context asks for is REPORTED AND IS NOT A FAILURE, on its own, in
any of those states, which is the whole distinction the old --check could not draw.

WHAT THIS CANNOT BE. A CI gate. The envelope is the measuring machine's resolvable font set and
a runner's is not the owner's, so a runner reaches state 3 when it has a browser at all and state
2 when it does not, and a gate that can only ever say "I could not look" is a gate a reader learns
to skip. What IS gateable everywhere is browser-free and lives in scripts/check_build.sh check 5,
which reads this file's own committed output and holds it against relations no font can change.
"""
import argparse
import base64
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
from bands import every_line  # noqa: E402
# ALL_VIEWS and not VIEWS, issue 89: the table is the union over every drawing the
# build lays out, and there are two per programme since that card. A module label or
# a lane caption this file did not measure would be laid out from the hand written
# estimate, which undershoots by up to a fifth at the weight a selected label is drawn.
from model import ALL_VIEWS, edge_parts  # noqa: E402

# The model as the build lays it out, and there are seven drawings to lay out since issue 43,
# one per programme. The table is their UNION and nothing more: a string no view asks for is
# dead weight the coverage check reports, and a string one view asks for and this file misses is
# a coordinate laid out from the hand written estimate, which undershoots by up to a fifth.

CSS = ROOT / "site" / "app.css"
# $ZRIVE_LABEL_WIDTHS is the variable build/build_layout.py and scripts/check_build.sh already
# honour, and it is honoured here for the same reason check 2 honours it: it is what lets a probe
# point --check at a doctored table without going near the committed one. The write path prints
# the path it wrote, so a variable left set in a shell cannot quietly send a regeneration
# somewhere else in silence.
OUT = pathlib.Path(os.environ.get("ZRIVE_LABEL_WIDTHS") or (HERE / "label_widths.json"))

# The headless shell first. It is the same Blink text stack and the same fontconfig as the
# full browser, so it shapes text identically, and it answers --dump-dom in about a second
# where the full binary was seen to hang on it for minutes on this machine.
#
# NOTHING HERE NAMES A HOME DIRECTORY OR A BUILD NUMBER. Both were literals until now, four of
# them, so the script ran on exactly one account on exactly one machine and said "no Chrome
# found" everywhere else, including in CI. No gate can see that: a hardcoded absolute path is
# valid Python and the file it names exists on the machine the check runs on. The cache root is
# now taken from the environment or from the running user's own home, the build number is
# globbed rather than spelled, and $ZRIVE_CHROME overrides the lot for a browser installed
# somewhere else entirely.
#
# NEWEST BUILD FIRST, and that is a sort and not an accident: two Playwright builds sit in this
# cache at once during an upgrade, the widths are measured by whichever binary answers, and a
# table measured by the older one would differ from the page the newer one draws. Sorting the
# glob descending picks the same binary every run instead of whatever order the directory
# happens to hand back.
PLAYWRIGHT_CACHE = pathlib.Path(
    os.environ.get("PLAYWRIGHT_BROWSERS_PATH") or (pathlib.Path.home() / ".cache/ms-playwright"))


def chrome_candidates():
    override = os.environ.get("ZRIVE_CHROME")
    if override:
        yield override
    for pattern, leaf in (
        ("chromium_headless_shell-*", "chrome-headless-shell-linux64/chrome-headless-shell"),
        ("chromium-*", "chrome-linux64/chrome"),
    ):
        for d in sorted(PLAYWRIGHT_CACHE.glob(pattern), key=lambda p: p.name, reverse=True):
            yield str(d / leaf)
    # Last, whatever the machine calls a browser on PATH. A distribution Chrome or Chromium
    # shapes text with the same Blink stack, so it is a fair fallback rather than a guess.
    for name in ("chrome-headless-shell", "google-chrome", "chromium", "chromium-browser"):
        found = shutil.which(name)
        if found:
            yield found

# The band captions are laid out by build_layout.py from the column widths, not from their own
# text, so they are measured for the overflow check rather than for wrapping. A caption that
# runs to more than one line is measured line by line, because that is how the check reads it:
# a caption is only legal if every line of it fits the lane on its own.
#
# THIS USED TO BE A SECOND COPY of the caption lines in build_layout.py, with a note saying it
# had to be changed with the original. Issue 83 made two of the lines a sentence written from
# each view's counts, "6 of 22 session templates" against "all 28 session templates", and a
# computed caption cannot be copied by hand at all. So both files now read build/bands.py, which
# declares the lanes, the alternates and the two sentences, and every_line() produces exactly the
# lines the builder will produce for these seven views. Alternates included: three captions are
# claims that are false on a view holding no employer, no instructor or no visit host, and a line
# only reachable on one of the seven still has to be measured, because the overflow gate reads it
# there.
BAND_LINES = every_line(v["counts"] for v in ALL_VIEWS)

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

    nodes = [n for v in ALL_VIEWS for n in v["nodes"]]
    edges = [e for v in ALL_VIEWS for e in v["edges"]]

    node_strings = set()
    for n in nodes:
        node_strings |= runs(n["label"])
    # The 9px context holds the edge verbs, any mark a node carries under its label and any
    # tail it carries under that; all three are drawn at the chip size.
    small = ({edge_parts(e)[2] for e in edges}
             | {n["mark"] for n in nodes if n.get("mark")}
             | {n["tail"] for n in nodes if n.get("tail")})

    # A ghost is drawn in italic (.lbl-ghost, .ghost .chip-tx). Italic is a different face with
    # different advances, so it gets its own contexts rather than borrowing the upright ones.
    ghost_strings = set()
    for n in nodes:
        if n.get("ghost"):
            ghost_strings |= runs(n["label"])
    ghost_ids = {n["id"] for n in nodes if n.get("ghost")}
    # A ghost relationship is one with a ghost node at an end OR one declared a ghost, which is
    # issue 75's case: a real relation between two real classes that nothing records. The same
    # verb can be upright on one edge and italic on another, so both faces are measured and the
    # union here is deliberate rather than an either/or.
    ghost_verbs = set()
    for e in edges:
        s, t, verb, declared = edge_parts(e)
        if declared or s in ghost_ids or t in ghost_ids:
            ghost_verbs.add(verb)

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
            "strings": {n["label"] for n in nodes} | node_strings,
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
            "strings": set(BAND_LINES),
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
// base64 so that --dump-dom's HTML escaping cannot touch it.
//
// CHUNKED, AND THAT IS A REPAIR AND NOT A STYLE. This was one
// `String.fromCharCode.apply(null, bytes)` call, which spreads every byte of the payload into
// the argument list; the engine's argument limit is a few tens of thousands and issue 89 took
// the table past it. The page threw "Maximum call stack size exceeded" INSIDE the browser, the
// element stayed empty, and the only thing the caller saw was "the page produced no
// measurements", with no hint that the failure was a size. A chunk of 8192 cannot reach the
// limit whatever the table grows to.
var bytes = new TextEncoder().encode(payload), bin = '', CH = 8192;
for (var bi = 0; bi < bytes.length; bi += CH) {
  bin += String.fromCharCode.apply(null, bytes.subarray(bi, bi + CH));
}
document.getElementById('out').textContent = btoa(bin);
</script>
"""


class CannotMeasure(Exception):
    """No measurement was taken at all.

    ITS OWN EXCEPTION AND ITS OWN EXIT CODE, issue 221, and this is the state the card is most
    insistent about. Both of the paths that raise it used to be `sys.exit("...")`, which exits 1,
    which is the same code --check used for "the table differs". So a run with no browser on it
    reported drift, in the exit code a caller reads, and the only thing separating "I measured and
    disagree" from "I never measured" was prose on stderr. Nothing was wiring this file into
    anything yet, so no gate was misled; the shape is the one this repository has found seventeen
    times, and it is closed here before a caller exists rather than after.
    """


def chrome():
    tried = []
    for c in chrome_candidates():
        if pathlib.Path(c).is_file():
            return c
        tried.append(c)
    raise CannotMeasure(
        "no Chrome found. Set $ZRIVE_CHROME to a Chrome or chrome-headless-shell binary, or "
        "$PLAYWRIGHT_BROWSERS_PATH to the cache holding one. Looked at: "
        + (", ".join(tried) or "nothing, the cache is empty"))


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
        raise CannotMeasure("the page produced no measurements")
    return json.loads(base64.b64decode(m.group(1)).decode("utf-8"))


def envelope(stack):
    """The families to shape under, in the order the document records them.

    The stack as written, then each family in it on its own, then the generic. Whichever of
    them this machine holds gets shaped; the rest silently fall through to the generic and
    add nothing but a duplicate, which the max absorbs.

    A FUNCTION AND NOT FOUR LINES IN main(), issue 221: the envelope is one side of --check's
    comparison, so a second copy of this expression is a second opinion about what the envelope
    is, and the state --check exists to name is exactly a disagreement about that.
    """
    families = [stack] + [f.strip().strip('"') for f in stack.split(",")] + EXTRA_FAMILIES
    return list(dict.fromkeys(families))


def document(job, got, stack, families):
    """The file this script writes, as a dict. The write path and --check build the same one."""
    distinct = {}
    for fam, w in got["probes"].items():
        distinct.setdefault(w, []).append(fam)
    return {
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


def serialise(doc):
    return json.dumps(doc, ensure_ascii=False, indent=1, sort_keys=True) + "\n"


def show(rows, n=10, indent="      "):
    for row in rows[:n]:
        print(f"{indent}{row}")
    if len(rows) > n:
        print(f"{indent}... and {len(rows) - n} more")


def baseline():
    """The committed table, or None with the refusal already printed.

    READ BEFORE THE BROWSER RUNS, which is not a micro-optimisation. "There is no table here" is
    an answer this file can give on any machine, in the same words, with or without Chrome; read
    after the measurement it would be an answer only a machine holding a browser ever reaches,
    and every other machine would report the missing browser instead. Two states, one message.
    """
    try:
        old = json.loads(OUT.read_text(encoding="utf-8"))
        if not isinstance(old.get("widths"), dict):
            raise ValueError("widths is not an object")
        return old
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as exc:
        print(f"::error::measure_labels --check: there is no table to compare against at {OUT} "
              f"({type(exc).__name__}). This run established nothing, in either direction",
              file=sys.stderr)
        return None


def check(new, old):
    """Hold a fresh measurement against the committed table, one state at a time.

    Returns the exit code. The four states are separated here rather than added up, and the
    reason each is where it is:

      A VALUE THAT DIFFERS ON THE SAME ENVELOPE is the dangerous one and the one nothing in this
      repository catches. It is judged only when the fingerprint below agrees, because on a
      different font set a different number is the correct number and refusing it would be
      refusing a machine for being itself.

      A STRING THE JOB ASKS FOR AND THE TABLE LACKS is a defect on any machine: the builder falls
      through to the hand written estimate, which undershoots by up to a fifth. It does not
      depend on a font, so it is judged in every state. scripts/check_build.sh check 2 catches it
      too, browser-free, and this is deliberately a second reading rather than the only one.

      A STRING THE TABLE HOLDS THAT NO CONTEXT ASKS FOR is dead weight, ruled on in those words by
      check 2, and it is reported and never fails. This is the whole of what the old byte diff
      could not say: it exited 1 over three of these and nothing else.

      A RUN THAT COULD NOT MEASURE never reaches this function. measure() raises CannotMeasure and
      main() turns that into exit 2, which is neither agreement nor disagreement.

    THE FINGERPRINT IS THE PROBES, THE STACK AND THE ENVELOPE, and not the engine string. The
    probe row is one string shaped under every family, so two machines whose probes agree resolve
    the same faces to the same advances, which is the property the widths depend on; the engine
    string moves on a browser upgrade that may not move a single width. A value difference under a
    matching fingerprint but a moved engine is still reported as a defect, because a table that no
    longer describes what the current browser shapes has to be regenerated whichever of the two
    caused it, and the finding says so rather than guessing which.
    """
    old_w = old["widths"]
    new_w = new["widths"]
    asked = {(c, s) for c, d in new_w.items() for s in d}
    held = {(c, s) for c, d in old_w.items() for s in d}
    # The population, asserted before any verdict is read off it. A comparison that enumerated no
    # entries reports no differences, and would print the same clean line as a perfect match.
    if not asked or not held:
        print(f"::error::measure_labels --check: the job asks for {len(asked)} (context, string) "
              f"pair(s) and the table holds {len(held)}. One of them is empty, so this comparison "
              f"looked at nothing and will not call it agreement")
        return 2

    missing = sorted(asked - held)
    surplus = sorted(held - asked)
    shared = sorted(asked & held)
    changed = sorted((c, s, old_w[c][s], new_w[c][s]) for c, s in shared
                     if old_w[c][s] != new_w[c][s])

    same_stack = old.get("font_stack") == new["font_stack"]
    same_env = old.get("envelope") == new["envelope"]
    same_probes = old.get("probes") == new["probes"]
    same_fingerprint = same_stack and same_env and same_probes
    same_engine = old.get("engine") == new["engine"]
    # THE CSS AND NOT THE WHOLE CONTEXT ENTRY. Each one also carries a `note`, which is prose
    # written in collect() above; comparing it would mean an edit to a comment demanding a browser
    # run to clear, which is a red for something that is not a defect and is the failing this
    # whole card is about.
    old_ctx, new_ctx = old.get("contexts") or {}, new["contexts"]
    css_drift = sorted(k for k in set(old_ctx) | set(new_ctx)
                       if (old_ctx.get(k) or {}).get("css") != (new_ctx.get(k) or {}).get("css"))

    print(f"  {len(asked)} (context, string) pair(s) asked by the job, {len(held)} held by "
          f"{OUT}, {len(shared)} compared")
    print(f"    values that differ on the same envelope : "
          f"{len(changed) if same_fingerprint else 'not judged, the envelope differs'}")
    print(f"    asked for and not in the table          : {len(missing)}")
    print(f"    in the table and asked for by nothing   : {len(surplus)}")
    print(f"    envelope fingerprint                    : "
          f"{'the same machine set of faces' if same_fingerprint else 'DIFFERENT'}"
          f"{'' if same_engine else '; and the engine string has moved'}")

    if surplus:
        print(f"    {len(surplus)} row(s) no context asks for. Dead weight, not a wrong "
              f"coordinate, and not a failure here or in check 2:")
        show([f"{c:<12} {s!r}" for c, s in surplus])

    bad = 0
    if css_drift:
        print(f"::error::{OUT} records the CSS each context was measured under and "
              f"{len(css_drift)} of them is no longer what site/app.css declares: "
              f"{', '.join(css_drift)}")
        print("  The table was measured under a stylesheet this tree no longer has, so every "
              "width in those contexts is a measurement of something the page does not paint.")
        bad = 1

    if missing:
        print(f"::error::{OUT} does not hold {len(missing)} string(s) the job measures")
        show([f"{c:<12} {s!r}" for c, s in missing], n=20)
        print("  Every one of those is laid out from the hand written per character estimate "
              "instead of a measured width. This does not depend on the font set: it is a defect "
              "on every machine.")
        bad = 1

    if not same_fingerprint:
        print("  THE ENVELOPE DIFFERS, so no value was compared and none of the numbers below is "
              "evidence of drift:")
        if not same_stack:
            print(f"      site/app.css names   {new['font_stack']}")
            print(f"      the table was measured under {old.get('font_stack')!r}")
        if not same_env:
            print(f"      the table lists {len(old.get('envelope') or [])} families and this "
                  f"machine shapes under {len(new['envelope'])}")
        if not same_probes:
            moved = sorted(f for f in set(old.get("probes") or {}) | set(new["probes"])
                           if (old.get("probes") or {}).get(f) != new["probes"].get(f))
            print(f"      {len(moved)} family(s) shape the probe string to a different width "
                  f"here than on the machine that wrote the table:")
            show([f"{f}: table {(old.get('probes') or {}).get(f)}, here {new['probes'].get(f)}"
                  for f in moved], indent="        ")
        print("  A width measured on a face this machine does not hold cannot be reproduced here, "
              "and a width measured on a face the table's machine did not hold is not in it. This "
              "is the reason check 2 is a coverage test and not a byte diff, and the reason this "
              "check cannot be a CI gate.")
        if bad:
            return 1
        print("VERDICT: membership agrees. The values were NOT judged and this run is not "
              "evidence that they are right.")
        return 3

    if changed:
        print(f"::error::{len(changed)} value(s) differ from the committed table on an envelope "
              f"this machine measured identically")
        show([f"{c:<12} {s!r}  table {a}  here {b}  ({b - a:+.2f})" for c, s, a, b in changed],
             n=20)
        print("  The fingerprint agrees, so this is not a machine difference. Either a number in "
              "the table was written by hand, or the browser now shapes these strings "
              "differently" + ("" if same_engine else
                               f" (and the engine has moved: the table was measured by "
                               f"{old.get('engine')!r} and this run by {new['engine']!r})") + ".")
        print("  THE FIX: run  python3 build/measure_labels.py  on this machine, then run "
              "python3 build/build_layout.py  and commit the table together with "
              "site/instance.js and site/layout.js. DO NOT hand write a width: the table is a "
              "measurement taken in a real browser and a typed number is a guess wearing a "
              "measurement's clothes.")
        bad = 1

    if bad:
        return 1
    print(f"VERDICT: {len(shared)} value(s) reproduce exactly on this machine's envelope, "
          f"{len(missing)} missing, {len(surplus)} surplus and not a failure.")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="measure and compare against the committed file, write nothing")
    args = ap.parse_args()

    old = None
    if args.check:
        old = baseline()
        if old is None:
            return 2

    stack = css_var("font-ui")
    families = envelope(stack)
    job = collect()
    # Both sides of every comparison below come off this job, and an empty one would report every
    # table covered, every value unchanged and nothing missing.
    if not job or not any(v["strings"] for v in job.values()):
        print("::error::measure_labels: collect() enumerated no strings, so there is nothing to "
              "measure and nothing this run could establish", file=sys.stderr)
        return 2
    try:
        got = measure(job, families)
    except CannotMeasure as exc:
        print(f"::error::measure_labels: {exc}", file=sys.stderr)
        print("  Nothing was measured, so this run is neither agreement nor disagreement with "
              "the committed table.", file=sys.stderr)
        return 2

    doc = document(job, got, stack, families)

    if args.check:
        return check(doc, old)

    OUT.write_text(serialise(doc), encoding="utf-8")
    n = sum(len(v) for v in got["widths"].values())
    try:
        where = OUT.relative_to(ROOT)
    except ValueError:  # $ZRIVE_LABEL_WIDTHS pointing outside the tree, which a probe does
        where = OUT
    print(f"{where}  {n} strings in {len(got['widths'])} contexts  "
          f"{OUT.stat().st_size / 1024:.1f} KB")
    for k, v in sorted(got["widths"].items()):
        print(f"  {k:<12} {len(v):>4} strings")
    print(f"  {doc['distinct_faces']} distinct faces reachable on this machine:")
    distinct = {}
    for fam, w in got["probes"].items():
        distinct.setdefault(w, []).append(fam)
    for w, fams in sorted(distinct.items()):
        print(f"    probe {w:7.2f}  {', '.join(fams)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
