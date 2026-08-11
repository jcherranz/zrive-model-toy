#!/usr/bin/env bash
# Rebuild the drawing and refuse any difference from the committed file.
#
# WHY THIS EXISTS. Issue 61. Nothing in CI ran the build. The generated documents were
# committed and deployed exactly as they sat in the tree, and two guarantees this repository
# believes it has were held by nothing but habit:
#
#   Reproducibility. Every card asserted that `python3 build/build_layout.py` reproduces them
#   byte for byte, and every one of those assertions was somebody remembering to run it by
#   hand.
#
#   Measurement. The contrast gate reads the palette out of build/model.py and the page draws
#   what the build wrote. Those are the same colours only while the build is honest. A colour
#   typed straight into the generated file would be measured by nobody, would pass every gate,
#   and would ship. The same hole covers a label, a property value, a provenance flag, a
#   populate route, and the name gate itself: model.py hashes every shipped string against the
#   faculty register at build time, so a real name pasted into a generated file never meets it.
#
# WHAT IT CHECKS, and the argument for each.
#
#   1. BOTH DOCUMENTS REPRODUCE. site/instance.js and site/layout.js are deleted, the real
#      builder is run, and each file it writes is compared byte for byte with the bytes that
#      were there. Deleting first is the poka-yoke: a builder that silently wrote nothing would
#      otherwise be indistinguishable from one that wrote the same bytes, and the check would
#      report clean about a run that produced nothing. Both files are always put back, whatever
#      happens, because a check that dirties the tree it checks is a check nobody runs twice.
#
#   2. THE LABEL WIDTH TABLE COVERS EVERY STRING THE LAYOUT MEASURES, and this is deliberately
#      NOT a byte diff. build/label_widths.json is generated, but by build/measure_labels.py
#      and not by the builder, and it is not reproducible anywhere but the machine that wrote
#      it: it is measured in a real browser, its values are the widest each string takes across
#      every font family that machine can resolve, and the file itself records the engine and
#      the resolvable envelope. A runner holds a different font set, so a byte diff would go red
#      on a correct table and light the andon for a reason that is not a defect. What is
#      checkable everywhere, and what actually goes wrong, is coverage: a string the model asks
#      for that the table does not hold is laid out from the old hand written estimate instead,
#      which undershoots the widest label by about a fifth at the weight a selected label is
#      drawn, and the wrong width is then baked into the shipped coordinates. The set of strings
#      that must be covered is asked of measure_labels.py's own collect(), which is the tool
#      that writes the table, so the two cannot drift apart. collect() opens no browser.
#      A string in the table that no context asks for is reported and is not a failure: it is
#      dead weight rather than a wrong coordinate, and clearing it costs a browser run.
#
# WHAT THE BUILDER TOUCHES, established by running it on a clean tree rather than assumed.
# It reads build/model.py, build/label_widths.json, site/app.css and the name gate's rules in
# scripts/, and it writes exactly two tracked files, site/instance.js and site/layout.js. It
# also leaves a
# build/__pycache__ directory, which .gitignore already covers. It neither reads nor writes
# site/board.json, which is what makes this safe to run on a board sync commit; see the header
# of .github/workflows/build.yml.
#
# Usage:
#   scripts/check_build.sh              rebuild and compare
#   scripts/check_build.sh --self-test  prove the check refuses a bad input before believing it
#
# Exit: 0 clean, 1 a difference or a missing width.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Two generated documents since issue 60 seam 1, and both are checked the same way. site/
# instance.js is what the objects are and site/layout.js is where they go; a build that
# reproduced one and not the other would ship a page whose data and geometry came from different
# revisions, which is the failure mode a reader would never see.
GENERATED=(site/instance.js site/layout.js)
BUILDER="build/build_layout.py"
WIDTHS_DEFAULT="build/label_widths.json"

# ---------------------------------------------------------------------------------------------
# The report. One function, so the self-test exercises the same text CI prints.
# ---------------------------------------------------------------------------------------------
# It takes the two files as arguments rather than reading the tree itself, which is what lets
# the
# self-test hand it a tampered pair without going anywhere near the working tree.
report_difference() {
  local expected="$1" actual="$2" named="$3"
  if cmp -s "$expected" "$actual"; then
    return 0
  fi
  echo "::error::${named} is not what ${BUILDER} produces"
  echo
  echo "  ${named} is GENERATED and it does not match the output of ${BUILDER}."
  printf '    committed  %s bytes  sha256 %s\n' \
    "$(wc -c <"$expected")" "$(sha256sum <"$expected" | cut -c1-16)"
  printf '    rebuilt    %s bytes  sha256 %s\n' \
    "$(wc -c <"$actual")" "$(sha256sum <"$actual" | cut -c1-16)"
  # The offset, and the bytes around it. Each document is one very long line, so a diff says
  # nothing
  # and a line number says less; what a reader needs is the text either side of the divergence.
  # cmp names both files in its message and one of them is a temporary path, so only the
  # numbers are kept.
  local off from
  off="$(cmp "$expected" "$actual" 2>/dev/null | sed -n 's/.*differ: byte \([0-9]*\).*/\1/p')"
  if [ -n "$off" ]; then
    echo "    first difference at byte ${off}"
    from=$(( off > 40 ? off - 40 : 1 ))
    printf '      committed  ...%s...\n' "$(tail -c "+${from}" "$expected" | head -c 90 | tr -d '\n')"
    printf '      rebuilt    ...%s...\n' "$(tail -c "+${from}" "$actual" | head -c 90 | tr -d '\n')"
  fi
  echo
  echo "  THE FIX: run  python3 ${BUILDER}  and commit the ${named} it writes."
  echo
  echo "  DO NOT edit ${named} by hand. It is the build's output. Every gate in this repository"
  echo "  measures the source and not the drawing: the contrast gate reads the palette out of"
  echo "  build/model.py, and the name gate hashes every shipped string at build time. A colour,"
  echo "  a label or a name typed straight into ${named} is measured by nobody and ships."
  return 1
}

# ---------------------------------------------------------------------------------------------
# 1. The drawing reproduces.
# ---------------------------------------------------------------------------------------------
SAVEDIR=""
restore_graph() {
  if [ -n "$SAVEDIR" ] && [ -d "$SAVEDIR" ]; then
    local g
    for g in "${GENERATED[@]}"; do
      [ -f "$SAVEDIR/$(basename "$g")" ] && cp "$SAVEDIR/$(basename "$g")" "$g"
    done
    rm -rf "$SAVEDIR"
    SAVEDIR=""
  fi
  return 0
}
trap restore_graph EXIT INT TERM

check_reproducible() {
  local rc log g bad=0
  log="$(mktemp)"
  SAVEDIR="$(mktemp -d)"
  for g in "${GENERATED[@]}"; do
    cp "$g" "$SAVEDIR/$(basename "$g")"
    # Deleted on purpose. See the poka-yoke note in the header.
    rm -f "$g"
  done

  python3 "$BUILDER" >"$log" 2>&1
  rc=$?
  sed 's/^/    /' "$log"
  rm -f "$log"

  if [ "$rc" -ne 0 ]; then
    restore_graph
    echo "::error::${BUILDER} exited ${rc}; the drawing could not be rebuilt"
    return 1
  fi

  for g in "${GENERATED[@]}"; do
    if [ ! -f "$g" ]; then
      restore_graph
      echo "::error::${BUILDER} exited 0 and wrote no ${g}"
      echo "  The check deletes what the build writes before building, so that a build which"
      echo "  writes nothing cannot be mistaken for a build which writes the same bytes."
      return 1
    fi
    if report_difference "$SAVEDIR/$(basename "$g")" "$g" "$g"; then
      echo "  ${g} is byte identical after a rebuild"
    else
      bad=1
    fi
  done
  restore_graph
  if [ "$bad" -eq 0 ]; then
    echo "  both documents are a pure function of the model"
    return 0
  fi
  return 1
}

# ---------------------------------------------------------------------------------------------
# 2. The label width table covers every string the layout measures.
# ---------------------------------------------------------------------------------------------
# The table to read is an argument, defaulting to ZRIVE_LABEL_WIDTHS, the same variable
# build_layout.py honours. That is what lets the self-test point the check at a doctored table
# without going near the committed one.
check_widths_cover() {
  ZRIVE_LABEL_WIDTHS="${1:-${ZRIVE_LABEL_WIDTHS:-$WIDTHS_DEFAULT}}" python3 - <<'PY'
import json
import os
import pathlib
import sys

sys.path.insert(0, "build")
import measure_labels as ml  # noqa: E402

path = pathlib.Path(os.environ["ZRIVE_LABEL_WIDTHS"])
try:
    table = json.loads(path.read_text(encoding="utf-8"))["widths"]
except (OSError, ValueError, KeyError) as exc:
    print(f"::error::cannot read the width table at {path} ({type(exc).__name__})")
    sys.exit(1)

job = ml.collect()

# An empty input is the loudest lie a gate can tell. Both sides are asserted, because an empty
# job would report every table clean and an empty table would report every job covered only if
# the job were empty too.
if not job:
    print("::error::measure_labels.collect() returned no contexts; refusing to call the table "
          "covered rather than judging nothing")
    sys.exit(1)
if not table:
    print(f"::error::{path} holds no widths; every label on this build would be estimated")
    sys.exit(1)

asked = {(ctx, s) for ctx, v in job.items() for s in v["strings"]}
missing = sorted((c, s) for c, s in asked if s not in table.get(c, {}))
extra = sorted((c, s) for c, d in table.items() for s in d if (c, s) not in asked)

print(f"    {len(asked)} strings in {len(job)} contexts, {len(missing)} missing, "
      f"{len(extra)} in the table that no context asks for")

if extra:
    print(f"    {path.name} holds {len(extra)} string(s) the layout no longer measures. Dead "
          f"weight, not a wrong coordinate, and clearing it costs a browser run:")
    for c, s in extra[:10]:
        print(f"      {c:<12} {s!r}")
    if len(extra) > 10:
        print(f"      ... and {len(extra) - 10} more")

if missing:
    print(f"::error::{path} does not cover {len(missing)} string(s) the layout measures")
    print()
    for c, s in missing[:20]:
        print(f"    {c:<12} {s!r}")
    if len(missing) > 20:
        print(f"    ... and {len(missing) - 20} more")
    print()
    print(f"  Every one of those is laid out from the hand written per character estimate "
          f"instead of a measured width, and the estimate is wrong by up to a fifth. The wrong "
          f"width is then baked into the coordinates in site/layout.js.")
    print()
    print(f"  THE FIX: run  python3 build/measure_labels.py  on a machine with the browser it "
          f"names, then run  python3 build/build_layout.py  and commit {path.name} together "
          f"with site/instance.js and site/layout.js.")
    print()
    print(f"  DO NOT hand write a width into {path.name} and DO NOT edit site/layout.js. The "
          f"table is a measurement taken in a real browser; a typed number is a guess wearing "
          f"a measurement's clothes.")
    sys.exit(1)

print(f"    {path.name} covers every string the layout measures")
PY
}

# ---------------------------------------------------------------------------------------------
# The self-test. Jidoka: prove the check refuses a bad input before believing it says clean.
# ---------------------------------------------------------------------------------------------
# It never touches the generated documents or build/label_widths.json. The byte-difference cases run
# against temporary copies, and the coverage cases run against a temporary table.
PASS=0
TOTAL=0
probe() {
  local want="$1" name="$2"; shift 2
  local out rc
  out="$("$@" 2>&1)"
  rc=$?
  TOTAL=$((TOTAL + 1))
  if [ "$rc" -eq "$want" ]; then
    PASS=$((PASS + 1))
    printf '  [OK]   %s\n' "$name"
  else
    printf '  [FAIL] %s (wanted exit %s, got %s)\n' "$name" "$want" "$rc"
    printf '%s\n' "$out" | sed 's/^/         /'
  fi
}

probe_says() {
  local needle="$1" name="$2"; shift 2
  local out
  out="$("$@" 2>&1)"
  TOTAL=$((TOTAL + 1))
  if printf '%s' "$out" | grep -qF -- "$needle"; then
    PASS=$((PASS + 1))
    printf '  [OK]   %s\n' "$name"
  else
    printf '  [FAIL] %s (the report never said %s)\n' "$name" "$needle"
  fi
}

self_test() {
  local dir a b
  dir="$(mktemp -d)"
  a="$dir/expected.js"
  b="$dir/actual.js"

  printf 'window.GL={"a":1};\n' >"$a"
  cp "$a" "$b"

  echo "self-test: the drawing comparison"
  probe 0 "an identical pair was reported clean" \
        report_difference "$a" "$b" "${GENERATED[0]}"

  # One byte, which is the size of the edit this check exists to catch: a colour nudged, a
  # digit changed, a letter added to a label.
  printf 'window.GL={"a":2};\n' >"$b"
  probe 1 "a one byte difference was refused" \
        report_difference "$a" "$b" "${GENERATED[0]}"
  probe_says "${GENERATED[0]}" "the refusal named the file" \
        report_difference "$a" "$b" "${GENERATED[0]}"
  probe_says "python3 $BUILDER" "the refusal said to run the builder" \
        report_difference "$a" "$b" "${GENERATED[0]}"
  probe_says "DO NOT edit ${GENERATED[0]} by hand" "the refusal said not to edit the drawing" \
        report_difference "$a" "$b" "${GENERATED[0]}"

  : >"$b"
  probe 1 "an empty rebuild was refused rather than read as a small drawing" \
        report_difference "$a" "$b" "${GENERATED[0]}"

  echo
  echo "self-test: the width table"
  local good bad empty
  good="$dir/good.json"
  bad="$dir/bad.json"
  empty="$dir/empty.json"

  # The committed table itself is the positive control. A check that refuses everything is no
  # more use than one that refuses nothing, and if this case fails the tree is wrong rather
  # than the check.
  cp "$WIDTHS_DEFAULT" "$good"
  probe 0 "the committed table was reported as covering the layout" \
        check_widths_cover "$good"

  # Drop one string from one context. That is exactly what a new or renamed label looks like
  # to this check.
  python3 - "$good" "$bad" <<'PY'
import json
import sys
doc = json.loads(open(sys.argv[1], encoding="utf-8").read())
ctx = sorted(doc["widths"])[0]
victim = sorted(doc["widths"][ctx])[0]
del doc["widths"][ctx][victim]
open(sys.argv[2], "w", encoding="utf-8").write(json.dumps(doc, ensure_ascii=False))
print(f"  (self-test removed {victim!r} from context {ctx})")
PY
  probe 1 "a table missing one measured string was refused" \
        check_widths_cover "$bad"
  probe_says "measure_labels.py" "the refusal said which tool remeasures the table" \
        check_widths_cover "$bad"
  probe_says "DO NOT hand write a width" "the refusal said not to type a width in by hand" \
        check_widths_cover "$bad"

  printf '{"widths":{}}\n' >"$empty"
  probe 1 "an empty table aborted instead of reporting every string covered" \
        check_widths_cover "$empty"

  probe 1 "an unreadable table aborted instead of reporting clean" \
        check_widths_cover "$dir/not-a-file.json"

  rm -rf "$dir"
  echo
  echo "self-test: ${PASS}/${TOTAL}"
  [ "$PASS" -eq "$TOTAL" ]
}

# ---------------------------------------------------------------------------------------------
# The run
# ---------------------------------------------------------------------------------------------
if [ "${1:-}" = "--self-test" ]; then
  self_test
  exit $?
fi

bad=0

echo "== the committed drawing is what the builder produces"
check_reproducible || bad=1

echo
echo "== the width table covers every string the layout measures"
check_widths_cover || bad=1

echo
if [ "$bad" -ne 0 ]; then
  echo "VERDICT: the build does not reproduce what is committed."
  exit 1
fi
echo "VERDICT: clean. The committed drawing is the build's own output."
exit 0
