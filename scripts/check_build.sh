#!/usr/bin/env bash
# Rebuild the drawing and refuse any difference from the snapshot git holds.
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
#      builder is run, and each file it writes is compared byte for byte with the snapshot git
#      holds. Deleting first is the poka-yoke: a builder that silently wrote nothing would
#      otherwise be indistinguishable from one that wrote the same bytes, and the check would
#      report clean about a run that produced nothing. Both files are always put back, whatever
#      happens, because a check that dirties the tree it checks is a check nobody runs twice.
#
#      AND THE BASELINE IS READ OUT OF GIT, WHICH IT WAS NOT. Issue 103 row B10. This file said
#      the word "committed" seven times and never once consulted git. It copied the WORKING TREE
#      copy aside, deleted it, rebuilt, and compared against that copy, so the sentence it
#      actually established was "the file on disk is what the builder just produced" while the
#      sentence it printed was "the committed drawing is the build's own output". Those are two
#      different sentences and the audit proved it by returning a clean verdict, exit 0, over a
#      modified and uncommitted site/instance.js: the hand edit was saved aside, the rebuild
#      reproduced it because the check had made it the baseline, and the gate called the tree
#      clean about bytes no commit had ever seen. See BASELINES below for which snapshot is read
#      now and why, and note that the defect was a false LOCAL reassurance: in CI the workspace
#      is the commit, so all three snapshots agree there and the sentence was true where it did
#      not matter. As of issue 103 scripts/verify.sh runs this gate before a push, which is the
#      run the false sentence misled.
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
#   3. THE MODEL IS WELL FORMED, AND THE GATE THAT SAYS SO IS PROVED ARMED. Issue 102, and this
#      is the check whose absence made the whole of check 1 above worth less than it read. A
#      duplicate node id was injected into build/model.py, the real build was run, and this file
#      printed "VERDICT: clean. The committed drawing is the build's own output." That verdict
#      was TRUE. The drawing was the build's own output; the build had agreed to draw twenty
#      eight nodes carrying twenty seven ids, two tiles on one point, and ninety units of
#      reserved height for a tile nobody can see. Reproducibility says the drawing follows from
#      the model. It says nothing whatever about whether the model is one a drawing can be made
#      of, and until issue 102 nothing anywhere said that.
#
#      The rules live in build/model.py as check_structure(), which build/build_layout.py calls
#      on the document it lays out, so a private deployment coming in through --instance meets
#      them too. Two things are run from here. The live verdict, which restates on this check's
#      own face what the build asserted inside its log. And the self-test, which is the half that
#      makes the first half worth anything: one synthetic graph per rule, each one the passing
#      control with a single thing changed, and the refusal read for the id, the edge and the
#      counts it is supposed to name rather than only for its exit code.
#
#      WHERE THIS WOULD HAVE GONE IF THE FENCES WERE DIFFERENT: beside the provenance self-test
#      in scripts/verify.sh, which is where a reader would look for it. That was written when
#      verify.sh carried its own copy of the build comparison and ran neither this file nor its
#      self-test. It no longer holds and it is recorded rather than deleted, because it names the
#      reason the self-test lives here: verify.sh exercises the LIVE structure gate whenever it
#      runs the builder, and it did not prove the gate fires. Issue 103 closed that from the
#      other side. verify.sh now runs this file and then runs it again with --self-test, so both
#      halves are in the run a contributor makes before pushing. Deliberately not written here as
#      a step number: two of this repository's cross-references to verify.sh step numbers went
#      stale the first time a step was inserted in the middle (issue 106 E4).
#
# WHAT THE BUILDER TOUCHES, established by running it on a clean tree rather than assumed.
# It reads build/model.py, build/label_widths.json, site/app.css and the name gate's rules in
# scripts/, and it writes exactly two tracked files, site/instance.js and site/layout.js. It
# also leaves a
# build/__pycache__ directory, which .gitignore already covers. It neither reads nor writes
# site/board.json, which is what makes this safe to run on a board sync commit; see the header
# of .github/workflows/build.yml.
#
# BASELINES. WHICH SNAPSHOT OF A GENERATED DOCUMENT THIS CHECK COMPARES AGAINST, AND WHY.
#
# A tracked path exists in three places and they are three different questions. The working tree
# is what is on disk. The INDEX is what a commit will carry. HEAD is what the repository already
# carries. They diverge exactly when somebody edits without committing, which is the ordinary
# state of a working session, and it is the state this gate is read in.
#
#   THE INDEX IS THE BASELINE. "What I am about to commit is the build's own output" is the
#   question worth asking of a gate that runs before a push, and the index is the git side of
#   that question. HEAD answers a question about the past: it is a useful thing to know and it is
#   not what a contributor is deciding. Reading `git cat-file blob :site/instance.js` rather than
#   the disk is the whole of the repair.
#
#   AND THE DISK COPY IS CHECKED AGAINST THE INDEX AS WELL, because in this repository a commit
#   is made with an explicit path, `git commit -- site/instance.js`, which stages the copy on
#   disk at commit time. So a disk copy that differs from the index is also a commit candidate,
#   and it is precisely the audit's scenario. When they differ this check refuses and names the
#   working tree, rather than answering about one snapshot while the other is the one that ships.
#   The everyday fix is one `git add` and the refusal says so.
#
#   AND IT DEGRADES BY NAMING, NEVER BY GUESSING. Untracked path, no repository at all, or a blob
#   git will not hand over: the baseline falls back to the working tree, every finding and the
#   verdict say WORKING TREE, and the word "committed" is not printed about bytes that were not
#   read out of git. This is scripts/forbidden_lib.sh's FORBIDDEN_ORIGIN discipline, whose
#   comment is the argument: "the file is clean" and "what you are about to commit is clean" are
#   two different sentences and a finding has to say which one it is about. A gate that cannot
#   tell you which snapshot it read has told you less than it claims.
#
# Usage:
#   scripts/check_build.sh              rebuild and compare against the snapshot git holds
#   scripts/check_build.sh --self-test  prove the check refuses a bad input before believing it
#
# Exit: 0 clean, 1 a difference, a divergent working tree or a missing width, 2 the check could
# not establish a baseline at all and is not evidence of anything.

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
# Which snapshot the baseline came from. See BASELINES in the header for the argument.
# ---------------------------------------------------------------------------------------------
# Three tokens and nothing else is ever used as one: `index`, `head`, `worktree`. Every finding
# and the verdict are labelled with one of them, and `worktree` is the one that must never be
# dressed up, because a working-tree baseline is not a statement about anything committed.
baseline_source() {  # path -> index | head | worktree
  local g="$1"
  git rev-parse --git-dir >/dev/null 2>&1 || { printf 'worktree\n'; return 0; }
  if git rev-parse -q --verify ":$g" >/dev/null 2>&1; then printf 'index\n'; return 0; fi
  if git rev-parse -q --verify "HEAD:$g" >/dev/null 2>&1; then printf 'head\n'; return 0; fi
  printf 'worktree\n'
}

# The phrase a verdict is allowed to use about each of them.
#
# THE WORD "committed" IS RESERVED. It appears in no line this file prints while the baseline is
# the working tree, not even in a sentence disclaiming it, which is what makes the absence
# mechanically checkable: the self-test asserts the literal never occurs in a working-tree
# finding or verdict. A disclaimer a probe cannot distinguish from a claim is worth less than the
# rule it is trying to state.
baseline_phrase() {  # source -> prose
  case "$1" in
    index)    printf 'in the index (what a commit will carry)\n' ;;
    head)     printf 'at HEAD (what the repository holds; this path is in no index)\n' ;;
    worktree) printf 'in the WORKING TREE (git was not asked)\n' ;;
    *)        printf 'from an unnamed snapshot\n' ;;
  esac
}

# Put the baseline bytes in a file. Non-zero means the snapshot could not be read, which is an
# abort and not a clean verdict: a check that cannot obtain the bytes it compares against has
# nothing to say.
baseline_read() {  # path source dest
  case "$2" in
    index)    git cat-file blob ":$1" >"$3" 2>/dev/null ;;
    head)     git cat-file blob "HEAD:$1" >"$3" 2>/dev/null ;;
    worktree) [ -f "$1" ] && cp "$1" "$3" ;;
    *)        return 1 ;;
  esac
}

# ---------------------------------------------------------------------------------------------
# The report. One function, so the self-test exercises the same text CI prints.
# ---------------------------------------------------------------------------------------------
# It takes the two files as arguments rather than reading the tree itself, which is what lets
# the
# self-test hand it a tampered pair without going anywhere near the working tree.
#
# THE ORIGIN IS AN ARGUMENT AND IT HAS NO DEFAULT. Issue 103 row B10. A default here would be a
# word this function prints about bytes whose provenance it was never told, which is the defect
# rather than the repair, so a caller that forgets it gets an abort and not a plausible sentence.
report_difference() {
  local expected="$1" actual="$2" named="$3" origin="${4:-}"
  if [ -z "$origin" ]; then
    echo "ASSERTION FAILED: report_difference was given no snapshot name for ${named}." >&2
    echo "  This check reports which snapshot it read. It will not print a finding it cannot" >&2
    echo "  attribute; that is the defect issue 103 row B10 is about." >&2
    return 2
  fi
  if cmp -s "$expected" "$actual"; then
    return 0
  fi
  echo "::error::the ${origin} copy of ${named} is not what ${BUILDER} produces"
  echo
  echo "  ${named} is GENERATED and the copy in the ${origin} does not match the output of"
  echo "  ${BUILDER}. This finding is about the ${origin} copy and about no other."
  printf '    %-9s  %s bytes  sha256 %s\n' "$origin" \
    "$(wc -c <"$expected")" "$(sha256sum <"$expected" | cut -c1-16)"
  printf '    %-9s  %s bytes  sha256 %s\n' "rebuilt" \
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
    printf '      %-9s  ...%s...\n' "$origin" "$(tail -c "+${from}" "$expected" | head -c 90 | tr -d '\n')"
    printf '      %-9s  ...%s...\n' "rebuilt" "$(tail -c "+${from}" "$actual" | head -c 90 | tr -d '\n')"
  fi
  echo
  echo "  THE FIX: run  python3 ${BUILDER}  and \`git add\` the ${named} it writes, so that the"
  echo "  snapshot this check reads is the snapshot a commit will carry."
  echo
  echo "  DO NOT edit ${named} by hand. It is the build's output. Every gate in this repository"
  echo "  measures the source and not the drawing: the contrast gate reads the palette out of"
  echo "  build/model.py, and the name gate hashes every shipped string at build time. A colour,"
  echo "  a label or a name typed straight into ${named} is measured by nobody and ships."
  return 1
}

# ---------------------------------------------------------------------------------------------
# 1. The drawing reproduces, and the thing it reproduces is a snapshot git holds.
# ---------------------------------------------------------------------------------------------
# The disk copy is still saved and put back, because the rebuild deletes it. It is no longer the
# baseline. It is now a THIRD set of bytes that has to agree with the baseline, and the reason is
# in BASELINES in the header: `git commit -- <path>` stages the disk copy, so a divergent disk
# copy is a commit candidate that no rebuild produced.
SAVEDIR=""
BASEDIR=""
BASE_SRC=()          # parallel to GENERATED: index | head | worktree
BASELINE_ORIGIN=""   # the one word, or "mixed" if the documents did not agree
restore_graph() {
  if [ -n "$SAVEDIR" ] && [ -d "$SAVEDIR" ]; then
    local g
    for g in "${GENERATED[@]}"; do
      if [ -f "$SAVEDIR/$(basename "$g")" ]; then
        cp "$SAVEDIR/$(basename "$g")" "$g"
      elif [ -f "$SAVEDIR/absent-$(basename "$g")" ]; then
        # It was not on disk when this check started and it is not left behind by it.
        rm -f "$g"
      fi
    done
    rm -rf "$SAVEDIR"
    SAVEDIR=""
  fi
  [ -n "$BASEDIR" ] && rm -rf "$BASEDIR"
  BASEDIR=""
  return 0
}
trap restore_graph EXIT INT TERM

# Establish the baseline BEFORE anything is deleted, and abort rather than fall back silently.
# Exit 2, which scripts/verify.sh reads as an abort and not as a decline: a check that could not
# get the bytes it compares against is not evidence of anything.
resolve_baselines() {
  local g src
  BASE_SRC=()
  BASEDIR="$(mktemp -d)"
  for g in "${GENERATED[@]}"; do
    src="$(baseline_source "$g")"
    if ! baseline_read "$g" "$src" "$BASEDIR/$(basename "$g")"; then
      echo "ASSERTION FAILED: the ${src} copy of ${g} could not be read, so there is no baseline"
      echo "  to compare a rebuild against. This check reports which snapshot it read and it has"
      echo "  read none, so it is aborting rather than judging the disk and calling it something"
      echo "  else."
      return 2
    fi
    BASE_SRC+=("$src")
    printf '  baseline for %s: the %s copy\n' "$g" "$src"
  done

  BASELINE_ORIGIN="${BASE_SRC[0]}"
  for src in "${BASE_SRC[@]}"; do
    [ "$src" = "$BASELINE_ORIGIN" ] || BASELINE_ORIGIN="mixed"
  done
  if [ "$BASELINE_ORIGIN" = "worktree" ]; then
    echo "  NOTE: git was not consulted for these bytes. Nothing this run prints is a statement"
    echo "  about what is committed, and the verdict below says so."
  fi
  return 0
}

# The disk copy against the baseline. Its own function so the self-test can drive it with three
# files, and so the live path and the self-test print the same text.
report_worktree_divergence() {  # baseline worktree_copy named origin
  local base="$1" wt="$2" named="$3" origin="$4"
  [ "$origin" = "worktree" ] && return 0   # same bytes by construction; nothing to compare
  if [ ! -f "$wt" ]; then
    echo "::error::${named} is tracked in the ${origin} and is not on disk"
    echo "  A commit made with an explicit path would carry the ${origin} copy unchanged, and"
    echo "  nothing here has seen the bytes a reader of the working tree sees."
    return 1
  fi
  if cmp -s "$base" "$wt"; then
    return 0
  fi
  echo "::error::the working tree copy of ${named} is not the ${origin} copy this check judged"
  echo
  printf '    %-9s  %s bytes  sha256 %s\n' "$origin" \
    "$(wc -c <"$base")" "$(sha256sum <"$base" | cut -c1-16)"
  printf '    %-9s  %s bytes  sha256 %s\n' "worktree" \
    "$(wc -c <"$wt")" "$(sha256sum <"$wt" | cut -c1-16)"
  echo
  echo "  The rebuild above was compared against the ${origin} copy, and that comparison is the"
  echo "  only thing this check's verdict is about. The copy on disk is different bytes. In this"
  echo "  repository a commit is made with an explicit path (\`git commit -- ${named}\`), which"
  echo "  stages the copy on disk, so the bytes judged here and the bytes a commit would carry"
  echo "  are not the same bytes and no verdict can cover both."
  echo
  echo "  THIS IS THE DEFECT ISSUE 103 ROW B10 IS ABOUT, SEEN FROM THE OTHER SIDE. Until that"
  echo "  card, this check took the disk copy as its baseline and then called the result"
  echo "  committed, so a hand edit sitting in the working tree was reproduced by a rebuild that"
  echo "  had been handed it, and the gate returned clean, exit 0, over bytes no commit had seen."
  echo
  echo "  THE FIX: \`git add ${named}\` if the disk copy is the one you want, or \`git checkout --"
  echo "  ${named}\` if it is not. Do not edit ${named} by hand either way; it is the build's"
  echo "  output and every gate here measures the source rather than the drawing."
  return 1
}

check_reproducible() {
  local rc log g i bad=0

  resolve_baselines
  rc=$?
  if [ "$rc" -ne 0 ]; then
    restore_graph
    return "$rc"
  fi

  log="$(mktemp)"
  SAVEDIR="$(mktemp -d)"
  for g in "${GENERATED[@]}"; do
    if [ -f "$g" ]; then
      cp "$g" "$SAVEDIR/$(basename "$g")"
    else
      : >"$SAVEDIR/absent-$(basename "$g")"
    fi
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

  for i in "${!GENERATED[@]}"; do
    g="${GENERATED[$i]}"
    if [ ! -f "$g" ]; then
      restore_graph
      echo "::error::${BUILDER} exited 0 and wrote no ${g}"
      echo "  The check deletes what the build writes before building, so that a build which"
      echo "  writes nothing cannot be mistaken for a build which writes the same bytes."
      return 1
    fi
    if report_difference "$BASEDIR/$(basename "$g")" "$g" "$g" "${BASE_SRC[$i]}"; then
      echo "  the ${BASE_SRC[$i]} copy of ${g} is byte identical to what the builder just produced"
    else
      bad=1
    fi
    if report_worktree_divergence \
         "$BASEDIR/$(basename "$g")" "$SAVEDIR/$(basename "$g")" "$g" "${BASE_SRC[$i]}"; then
      [ "${BASE_SRC[$i]}" = "worktree" ] || \
        echo "  and the working tree copy of ${g} is that same ${BASE_SRC[$i]} copy"
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
# 3. The model is well formed.
# ---------------------------------------------------------------------------------------------
# stderr is KEPT and not discarded, which is the whole reason these are two lines rather than
# one. A refusal from check_structure() is a SystemExit and its message is on stderr, so a
# quieter form of this function would report an exit code and swallow the diagnosis the rules
# were written to produce. What is dropped is only build/model.py's own [model] chatter about
# the vault it read, which is a note about the machine and not about the model.
_model_says() {
  local out rc
  out="$(python3 "$ROOT/build/model.py" "$1" 2>&1)"
  rc=$?
  printf '%s\n' "$out" | grep -v '^\[model\] ' | sed 's/^/    /'
  return "$rc"
}

check_structure_live() { _model_says --structure; }
check_structure_armed() { _model_says --structure-self-test; }

# ---------------------------------------------------------------------------------------------
# The verdict, which names the snapshot it is about.
# ---------------------------------------------------------------------------------------------
# A function rather than two echoes at the foot of the file, so the self-test can read the text
# that ships and can assert what it must NOT say. The old verdict was two lines of prose ending
# in "The committed drawing is the build's own output", printed unconditionally, and it was that
# sentence and not the comparison that issue 103 row B10 filed.
verdict() {  # clean|bad ; reads BASELINE_ORIGIN
  local how="$1" origin="${BASELINE_ORIGIN:-}"
  if [ -z "$origin" ]; then
    echo "ASSERTION FAILED: no baseline snapshot was established, so there is no verdict to give."
    return 2
  fi
  if [ "$how" = "clean" ]; then
    echo "VERDICT: clean. The drawing $(baseline_phrase "$origin") is the build's own"
    echo "         output, the working tree agrees with it, and the model it came from carries no"
    echo "         repeated id, no dangling edge and no self-loop."
  else
    echo "VERDICT: the drawing $(baseline_phrase "$origin") is not the build's own"
    echo "         output, or the working tree does not agree with it, or the model it was built"
    echo "         from is not one a drawing can be made of."
  fi
  if [ "$origin" = "worktree" ]; then
    echo "         READ THAT SNAPSHOT NAME. These bytes were not read out of git, so nothing above"
    echo "         is a statement about what the repository holds or about what a commit"
    echo "         would carry."
  fi
  return 0
}

# ---------------------------------------------------------------------------------------------
# The self-test. Jidoka: prove the check refuses a bad input before believing it says clean.
# ---------------------------------------------------------------------------------------------
# It never touches the generated documents or build/label_widths.json. The byte-difference cases run
# against temporary copies, the coverage cases run against a temporary table, and the snapshot
# cases run inside throwaway repositories built under mktemp.
#
# THE INTENDED PROBE COUNT IS WRITTEN BY HAND. Issue 103 row B1, applied here because this suite
# had the same hole: TOTAL is incremented by each probe as it executes, so PASS -eq TOTAL is
# invariant under any probe deleted, commented out or never reached, and a suite emptied one
# probe at a time prints a clean ratio all the way down to 0/0. A count taken from the run cannot
# notice a probe that did not run. A short run exits 2, "the suite could not answer"; a run that
# also recorded a failure reports it and exits 1.
EXPECTED_PROBES=36
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

# The negative of the above, and it is the shape row B10 needs. "It printed the right word" and
# "it did not print the wrong word" are different assertions, and the defect was entirely in the
# second: the old text named a snapshot it had not read, which no positive probe can catch.
probe_says_not() {
  local needle="$1" name="$2"; shift 2
  local out
  out="$("$@" 2>&1)"
  TOTAL=$((TOTAL + 1))
  if printf '%s' "$out" | grep -qF -- "$needle"; then
    printf '  [FAIL] %s (the report said %s)\n' "$name" "$needle"
    printf '%s\n' "$out" | grep -F -- "$needle" | sed 's/^/         /'
  else
    PASS=$((PASS + 1))
    printf '  [OK]   %s\n' "$name"
  fi
}

# A throwaway repository, so the snapshot probes never go near the tree being checked. It carries
# one committed file whose name is the one this check reads, so `baseline_source` is answering the
# same question in the probe as it answers live.
scratch_repo() {  # dir
  local d="$1"
  mkdir -p "$d/site"
  git -c init.defaultBranch=main init -q "$d" >/dev/null 2>&1 || return 1
  printf 'window.GI={"a":1};\n' >"$d/site/instance.js"
  git -C "$d" add site/instance.js >/dev/null 2>&1 || return 1
  git -C "$d" -c user.email=probe@invalid -c user.name=probe \
      commit -q -m probe -- site/instance.js >/dev/null 2>&1 || return 1
  return 0
}

# baseline_source and baseline_read read git relative to the current directory, so a probe about
# another repository has to stand in it. Run in a subshell, so the cd cannot escape.
in_dir() {  # dir cmd...
  local d="$1"; shift
  ( cd "$d" && "$@" )
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
        report_difference "$a" "$b" "${GENERATED[0]}" index

  # One byte, which is the size of the edit this check exists to catch: a colour nudged, a
  # digit changed, a letter added to a label.
  printf 'window.GL={"a":2};\n' >"$b"
  probe 1 "a one byte difference was refused" \
        report_difference "$a" "$b" "${GENERATED[0]}" index
  probe_says "${GENERATED[0]}" "the refusal named the file" \
        report_difference "$a" "$b" "${GENERATED[0]}" index
  probe_says "python3 $BUILDER" "the refusal said to run the builder" \
        report_difference "$a" "$b" "${GENERATED[0]}" index
  probe_says "DO NOT edit ${GENERATED[0]} by hand" "the refusal said not to edit the drawing" \
        report_difference "$a" "$b" "${GENERATED[0]}" index

  : >"$b"
  probe 1 "an empty rebuild was refused rather than read as a small drawing" \
        report_difference "$a" "$b" "${GENERATED[0]}" index

  echo
  echo "self-test: the finding says which snapshot it read"
  # Issue 103 row B10. Every probe in this block fails against the body this check had before
  # that card: report_difference took three arguments, ignored a fourth, and printed the word
  # "committed" over bytes it had copied off the disk.
  printf 'window.GL={"a":2};\n' >"$b"
  probe_says "index" "a finding about the index said index" \
        report_difference "$a" "$b" "${GENERATED[0]}" index
  probe_says_not "committed" "a finding about the index did not call it committed" \
        report_difference "$a" "$b" "${GENERATED[0]}" index
  probe_says "worktree" "a finding about the disk said worktree" \
        report_difference "$a" "$b" "${GENERATED[0]}" worktree
  probe_says_not "committed" "a finding about the disk did not call it committed" \
        report_difference "$a" "$b" "${GENERATED[0]}" worktree
  # And a caller that names no snapshot gets an abort rather than a plausible sentence, which is
  # the only way a default can be kept out of a text whose whole subject is attribution.
  probe 2 "a finding with no snapshot named was refused rather than printed" \
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

  echo
  echo "self-test: the model is well formed"
  # The whole suite in build/model.py, one synthetic graph per rule, run from here because
  # nothing else in the repository runs it. Its own probe total is asserted against a written
  # constant inside it, so a rule deleted with its probe takes it red instead of shrinking it.
  probe 0 "the structure gate refused every graph it names and passed the shipped one" \
        check_structure_armed
  # AND THE TWO PROVED DEFECTS ARE NAMED HERE AS WELL, which is deliberate duplication and the
  # only duplication in this file. A suite can be emptied one probe at a time and still print a
  # clean ratio; asserting from outside that these two rules were exercised means removing either
  # of them takes two files rather than one, and both of these are mutations that were BUILT and
  # SHIPPED past every gate in this repository rather than imagined.
  probe_says "[OK]   node-id-unique" "the suite proved the duplicate id is refused" \
        check_structure_armed
  probe_says "[OK]   edge-endpoint-exists" "the suite proved a dangling edge is named" \
        check_structure_armed
  probe 0 "the model's own graph passed the live check" check_structure_live

  echo
  echo "self-test: the baseline is taken from git, and is named when it is not"
  # Issue 103 row B10, the half the finding text cannot cover: WHERE the bytes come from. These
  # run inside throwaway repositories under mktemp, so the tree being checked is never touched
  # and never has to be dirtied to prove the point.
  local repo bare
  repo="$dir/repo"
  bare="$dir/norepo"
  if scratch_repo "$repo"; then
    probe_says "index" "a tracked path takes its baseline from the index" \
          in_dir "$repo" baseline_source site/instance.js
    probe_says_not "worktree" "and does not fall back to the disk while an index entry exists" \
          in_dir "$repo" baseline_source site/instance.js

    # The audit's own scenario, in miniature: the disk copy edited and nothing committed. The
    # index still holds the original, so the baseline does not move with the edit, which is the
    # entire defect. Before this card the check copied the edited disk file aside and compared a
    # rebuild against THAT.
    printf 'window.GI={"a":999};\n' >"$repo/site/instance.js"
    probe_says "index" "an edited but unstaged path still takes its baseline from the index" \
          in_dir "$repo" baseline_source site/instance.js
    probe_says "999" "and the disk copy is the one that carries the edit" \
          cat "$repo/site/instance.js"
    in_dir "$repo" baseline_read site/instance.js index "$dir/frombaseline.js"
    probe_says_not "999" "the baseline read out of the index does not carry the working tree edit" \
          cat "$dir/frombaseline.js"
    probe 1 "and the divergence between them was refused, not reported clean" \
          report_worktree_divergence "$dir/frombaseline.js" "$repo/site/instance.js" \
          "${GENERATED[0]}" index
    probe_says "working tree" "the refusal named the working tree" \
          report_worktree_divergence "$dir/frombaseline.js" "$repo/site/instance.js" \
          "${GENERATED[0]}" index

    # A path git has never been told about. There is no snapshot to read and the check must say
    # so rather than quietly judging the disk under a git-sounding name.
    printf 'window.GI={};\n' >"$repo/site/untracked.js"
    probe_says "worktree" "an untracked path is named as the working tree" \
          in_dir "$repo" baseline_source site/untracked.js
  else
    printf '  [FAIL] the scratch repository could not be built, so the snapshot probes did not run\n'
    TOTAL=$((TOTAL + 8))
  fi

  # No repository at all. A tarball, an unpacked artefact, a directory somebody copied.
  mkdir -p "$bare/site"
  printf 'window.GI={};\n' >"$bare/site/instance.js"
  probe_says "worktree" "with no repository at all the baseline is named as the working tree" \
        in_dir "$bare" baseline_source site/instance.js

  echo
  echo "self-test: the verdict says which snapshot it is about"
  BASELINE_ORIGIN=index
  probe_says "in the index" "a clean verdict over the index said so" verdict clean
  probe_says_not "committed" "a clean verdict over the index did not say committed" verdict clean
  BASELINE_ORIGIN=worktree
  probe_says "WORKING TREE" "a clean verdict over the disk named the working tree" verdict clean
  probe_says_not "committed" "a clean verdict over the disk did not say committed" verdict clean
  probe_says_not "committed" "and neither did a refusal over the disk" verdict bad
  BASELINE_ORIGIN=""
  probe 2 "a verdict with no baseline established was refused rather than printed" verdict clean
  BASELINE_ORIGIN=""

  rm -rf "$dir"
  echo
  # The count is asserted against the constant at the top, not against itself. See the note there.
  echo "self-test: ${PASS}/${TOTAL}, of ${EXPECTED_PROBES} intended"
  if [ "$TOTAL" -ne "$EXPECTED_PROBES" ]; then
    echo "ASSERTION FAILED: this suite intends ${EXPECTED_PROBES} probes and ${TOTAL} ran."
    echo "  A suite that counts only what executed cannot notice a probe that did not. Fix the"
    echo "  suite, or change EXPECTED_PROBES in the same commit that changes the probes."
    return 2
  fi
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

# The banner does not name a snapshot, because which snapshot this is depends on what git says
# and git has not been asked yet. resolve_baselines prints one line per document naming it, and
# the verdict at the foot repeats it. A heading that named a snapshot before the lookup would be
# the same class of sentence as the one this card is about.
echo "== the drawing git holds is what the builder produces"
check_reproducible
rc=$?
if [ "$rc" -eq 2 ]; then
  echo
  echo "ABORTED: no baseline. Nothing below was run and nothing here is evidence."
  exit 2
fi
[ "$rc" -eq 0 ] || bad=1

echo
echo "== the width table covers every string the layout measures"
check_widths_cover || bad=1

echo
echo "== the model is a graph a drawing can be made of"
check_structure_live || bad=1

echo
echo "== and the gate that says so refuses the graphs it names"
check_structure_armed || bad=1

echo
if [ "$bad" -ne 0 ]; then
  verdict bad
  exit 1
fi
verdict clean
exit 0
