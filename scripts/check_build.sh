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
#   3. AND THE BUILDER ASKS THAT TABLE FOR THE FACES THE PAGE PAINTS IN. Issue 217. Check 2 holds
#      the table against the job that writes it and scripts/smoke.mjs holds the painted page
#      against the table. The arguments typed into build/build_layout.py's own text_w() calls
#      were on neither side of either comparison, and four one-line edits to them were traced
#      through the code and found green everywhere: every label box reserved at the regular
#      width while the stylesheet paints a selected label bold, 56 italic chips reserved from
#      the upright row, and two call sites composing a key for a context that does not exist, at
#      which point the width is estimated and the build says so on stderr and exits 0. So the
#      builder is run over the fourteen drawings, every (context, string) its text_w() was asked
#      for is recorded, and that set is held against measure_labels.collect() and against the
#      strings the two documents it just wrote actually paint. The section itself carries the
#      argument for each of the five things it asserts and for the one it does not.
#
#   4. AND THE WIDTH IT GOT BACK IS THE WIDTH IT RESERVED. Issue 220, and check 3 is what named
#      it: that check proves the right question was put to the table and stops there, because
#      between the lookup returning a number and the number becoming a coordinate there is
#      arithmetic and the arithmetic was unwatched. `max` to `min` inside reserve() returns the
#      regular width of a label the stylesheet paints bold on a click, which is #203's harm
#      arriving from the build side, and it shipped green through every gate this repository
#      ran: check 3's census is unchanged in shape, check 1 compares against the index and any
#      builder edit is rebuilt and staged, the digest census recomputes the fourteen from the
#      bytes in front of it, and the lane overflow gate goes QUIETER, because `lw` appears only
#      negatively in `lane_slack()` and a box that shrank leaves more slack, not less.
#
#      So layout() now records the reserve it settled on, one tuple per node, the way text_w()
#      already records what it was asked for, and this file holds every one of them against a
#      reserve built from build/label_widths.json, the faces site/app.css declares and the lines
#      the two documents carry. The table is an INPUT to the placement and the check never reads
#      the placement's output, which is the distinction #195 drew and the reason this is not the
#      placer oracle's flaw in a fourth place. Nothing painted moved to make it readable:
#      site/instance.js and site/layout.js are byte identical with the record and without it.
#
#   5. AND THE NUMBERS IN THAT TABLE ARE NUMBERS A BROWSER COULD HAVE PRODUCED. Issue 221, and
#      checks 2, 3 and 4 are what named it: they hold the table's membership, the arguments put to
#      it and the arithmetic done with the answers, and not one of them reads a number and asks
#      whether it is right. Neither does scripts/smoke.mjs, which says so in its own header. So a
#      value edited by hand passed everything: halve every entry under widths["9/400"] and every
#      gate stays green, because they all read the same doctored number the builder read.
#
#      The obvious repair was priced and refused. `build/measure_labels.py --check` existed,
#      nothing called it, and on the machine that wrote the table it reported 5118 entries, zero
#      value changes, zero missing and three surplus rows, and exited 1 on those three alone: it
#      was a byte comparison of the whole rendered document, and check 2 has already ruled those
#      three dead weight. A check that cannot tell a surplus row from a shaping difference cannot
#      be a gate. --check now separates the four states and carries its own argument; it stays an
#      OWNER'S instrument, because the envelope is the measuring machine's font set and a runner's
#      is not the author's. What is gateable everywhere is the table held against relations no font
#      can change, and that is this check. The section itself carries each relation, the count of
#      pairs it compares, and the three things it deliberately cannot say.
#
#   6. THE MODEL IS WELL FORMED, AND THE GATE THAT SAYS SO IS PROVED ARMED. Issue 102, and this
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
# AND THE GATES THAT COULD NOT LOOK ARE NAMED IN THE VERDICT. Issue 168 R4(a), and it is the
# audit's verdict finding applied to this file. build/model.py runs three gates at import time
# that re-read a corpus which is not on every machine, and each of them returns early with a
# note on stderr when its corpus is absent. `_model_says` below filters `[model] ` chatter out
# of the structure step, and the copy that survives lands two hundred lines into a log whose last
# line said `VERDICT: clean`. Measured: with the corpora out of reach this file printed
# `VERDICT: clean` and exited 0 while the sole check on SYLLABUS_SESSIONS had not run, and
# SYLLABUS_SESSIONS is the only source of every `counts[*].total`, which is the denominator of
# every fraction on every screen. A CEO reading that verdict cannot tell it from the run where
# the folders were counted again.
#
# So there are three verdicts and not two, and the third has its own exit code. THE WORD "clean"
# IS NOT PRINTED BY A RUN THAT COULD NOT LOOK. The census below asks build/model.py which gates
# reported themselves unverified, cross-checks that against whether the corpus is actually there,
# and refuses outright if those two disagree, because a census that can be wrong about what it
# censused is the defect one level up.
#
# WHAT IS NOT FIXED HERE, AND IT IS THE OTHER HALF. The early `return` is in build/model.py and
# that file is not this card's. Filed separately, with the measurement. This half is the
# reporting: the state existed and nothing said so.
#
# Usage:
#   scripts/check_build.sh              rebuild and compare against the snapshot git holds
#   scripts/check_build.sh --self-test  prove the check refuses a bad input before believing it
#
# Exit: 0 clean, 1 a difference, a divergent working tree or a missing width, 2 the check could
# not establish a baseline at all and is not evidence of anything, 3 everything it could check
# was checked and found nothing wrong AND at least one sub-check could not look at its corpus.
# 3 is a state and not a shade of 0: scripts/verify.sh renders it [SKIP] and never [OK], and
# .github/workflows/build.yml annotates the run with it rather than passing it in silence.

set -uo pipefail

# NO GIT CALL IN THIS FILE MAY SIT AT A CREDENTIAL PROMPT. Issue 211. baseline_read runs
# `git cat-file blob "HEAD:$1"`, and in a partial clone made with `--filter=blob:none` that blob
# is absent and the line fetches it from the promisor remote. A remote that wants credentials
# would then block this gate at a prompt nobody unattended is going to answer. No workflow here
# makes a partial clone, so it has never fired in CI. Exported once rather than written on the
# call, because a per-call guard is a guard on the calls somebody remembered; the reasoning and
# the limits of what these variables cover are in the same block in scripts/check_repo.sh, and
# scripts/check_forbidden.sh proves the mechanism against a real partial clone. The second line is
# not redundant: with GIT_ASKPASS or core.askpass set, git runs that program rather than prompting,
# and the first line has no opinion about it.
export GIT_TERMINAL_PROMPT=0
export GIT_ASKPASS=

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
# 3. The widths the builder ASKS FOR are the widths the job declares. Issue 217.
# ---------------------------------------------------------------------------------------------
# Check 2 above holds the table against the job. scripts/smoke.mjs holds the painted page against
# the table. Between them sat the arguments: `text_w()` composes its context key at
# build/build_layout.py:165 out of a size, a weight, an italic flag and a caps flag TYPED AT THE
# CALL SITE, and those arguments were on neither side of either comparison. Four one-line edits
# to them were traced through the code and every one was green, in the only workflow a builder
# edit has: change it, rebuild, commit the documents with the change:
#
#   drop the bold term from reserve() and every label box is reserved at the regular width while
#   the stylesheet paints a selected label bold, which is #203's harm reintroduced from the
#   build side; pass False for a ghost chip's italic flag and 56 painted italic chips are
#   reserved from the upright row; ask a mark at weight 600 and the key names a context that
#   does not exist, so all 207 marks fall back to the hand written estimate; drop the caps flag
#   from the caption check and the lane overflow gate measures captions without the uppercase
#   and the .07em the stylesheet adds. The last two are INVISIBLE rather than merely unchecked,
#   because the fallback at build/build_layout.py:1074-1085 is a print with no exit code.
#
# WHAT THIS RUNS. The real builder, over the real fourteen drawings, into a throwaway directory,
# with every `(context, string)` its text_w() was actually asked for read back off the two lists
# the function already keeps: `_errors` for a lookup that hit the table and `_fellback` for one
# that missed. Every call appends to exactly one of them before returning, so together they are
# the complete record of what was asked, and reading them costs the builder nothing. Nothing
# tracked is written: --out points at a temporary directory and the builder's own log is
# swallowed, because the subject here is the lookups and not the build.
#
# THE OTHER SIDE OF THE COMPARISON IS NOT build_layout.py, and that is the whole discipline of
# this check. #206 records why an oracle that reads the same table its subject reads agrees with
# the defect wherever the table is the wrong answer. So the expectation comes from two places
# that know nothing of the call sites. measure_labels.collect(), which reads the sizes, the
# weights and the letter-spacing out of site/app.css and the strings out of build/model.py. And
# ALL_VIEWS, which is the model itself, for the three kinds of string the builder neither chooses
# nor changes: a mark, a tail and an edge verb. Only where nothing else can answer, which is
# where a label breaks and which of a lane's alternate captions is painted, does the expectation
# come off the documents the builder has just written; that limit is written where it is used.
#
#   A. NOTHING FELL BACK. A lookup that missed the table is estimated and the build proceeds
#      green. Here it is a refusal.
#   B. EVERY CONTEXT ASKED FOR IS ONE THE JOB DECLARES, and every (context, string) with it. A
#      key the job never declares is a face nothing measured.
#   C. EVERY CONTEXT THE JOB DECLARES IS ASKED FOR, with a population, and this is the one that
#      catches a whole term going missing. A gate that only counted mismatches would report zero
#      of them over a call site that had stopped being made.
#   D. EVERY STRING THE FOURTEEN DRAWINGS CARRY WAS MEASURED, and the fourteen is
#      EXPECTED_DRAWINGS held against what the run actually laid out rather than a word in this
#      sentence. Counted by kind, which is the population and not a total: marks, tails and verbs
#      from the model, label lines and caption lines from the documents. This is the population
#      assertion and it is also what keeps the census honest: a text_w() that stopped recording
#      would take it red.
#      It is deliberately about the STRING and not the context it was asked in, because #215 is
#      open on exactly that question for marks and tails, which the stylesheet paints at 9px
#      italic (.node .lbl.lbl-missing) and the builder still measures upright. Making D
#      context-precise today would go red on a defect that is another card's to fix.
#   E. EVERY DRAWN LABEL LINE WAS MEASURED IN BOTH FACES THE PAGE PAINTS IT IN, the one at rest
#      and the one a click gives it. Here the stylesheet is unambiguous and says so in two
#      rules, `.node .lbl` and `.node.sel .lbl`, so the keys are composed from what those rules
#      declare and then checked against the job's own context list. This is the sharp form of
#      the reserve() case: dropping the bold term takes C red, and reserving the bold width of
#      only the first line takes E red.
#
# WHAT IT DOES NOT SAY, AND THE FIRST DRAFT OF THIS PARAGRAPH GOT THE REASON BACKWARDS. It is
# about the arguments and not the arithmetic: `reserve()` with its `max` changed to a `min`, or
# `caption_overflow()` comparing against the lane plus a gap, asks for every width this check
# wants asked, in every face, and passes. The draft said the reserved box is held anyway by the
# lane gate inside layout(). IT IS NOT, IN THE DIRECTION THAT MATTERS. `lane_slack()` is
# `min(x - lw/2 - x0, x1 - x - lw/2)`, so a SMALLER `lw` makes the slack LARGER and the gate
# quieter; it can only catch a box that grew. Under-reserving is the whole of #203 and the whole
# of this card, and against it the lane gate is structurally blind. Measured rather than argued:
# that `min` takes the tightest label from 0.0px of lane to 5.6px, stops the issue 43 re-break
# firing on two labels, and puts `pe_st4` and `sc_st14` 0.6 and 2.2 units outside their lane the
# moment a reader clicks them, with this gate and that one both green. What does catch it is
# check 1, because it moves `site/layout.js` and the rebuilt bytes stop matching git; what does
# not is a workflow that rebuilds and stages before running the gates, and the caption case moves
# no byte at all, because `caption_overflow()`'s answer only ever feeds a `sys.exit`. So: this
# check proves the question was put to the table. Nothing proves the answer was used. That is a
# card rather than a line, because the reserve is a local inside layout() and reaches neither
# document, and it is filed as issue 220.
#
# The builder to run is an argument, defaulting to the real one, which is what lets the
# self-test point it at a copy carrying one mutated line without going near build/. The number of
# drawings it must lay out is the second, defaulting to the same terminator the digest census
# reads, and it is an argument for the same reason: a pin nothing can be shown to fail on is a
# pin nobody has proved is armed.
check_widths_asked() {
  ZRIVE_ROOT="$ROOT" ZRIVE_LAYOUT_PY="${1:-$ROOT/build/build_layout.py}" \
  ZRIVE_DRAWINGS="${2:-$EXPECTED_DRAWINGS}" python3 - <<'PY'
import contextlib
import io
import json
import os
import pathlib
import runpy
import sys
import tempfile

root = pathlib.Path(os.environ["ZRIVE_ROOT"])
layout_py = pathlib.Path(os.environ["ZRIVE_LAYOUT_PY"])
sys.path.insert(0, str(root / "build"))
import measure_labels as ml  # noqa: E402
from model import ALL_VIEWS, doc_views, edge_parts  # noqa: E402

BAD = 0


def fail(msg):
    global BAD
    BAD = 1
    print(f"::error::{msg}")


def show(rows, head, n=12):
    for row in rows[:n]:
        print(f"      {row}")
    if len(rows) > n:
        print(f"      ... and {len(rows) - n} more {head}")


def unwrap(path, prefix):
    text = path.read_text(encoding="utf-8")
    return json.loads(text[len(prefix):-len(";\n")])


if not layout_py.is_file():
    print(f"::error::no builder at {layout_py}. Nothing was run, so nothing here is evidence")
    sys.exit(1)

# ---- run the builder and keep only what it looked up ------------------------
with tempfile.TemporaryDirectory() as td:
    saved_argv = sys.argv
    sys.argv = [str(layout_py), "--out", td]
    log = io.StringIO()
    # BaseException AND NOT SystemExit ALONE. A builder that refuses says so with sys.exit and
    # was the only case the first draft caught; one that raises anything else would have come out
    # of here as a bare traceback, which is fail-closed but says nothing about what was and was
    # not established. Both are the same sentence to a reader: the build did not finish, so
    # nothing below was looked at.
    try:
        with contextlib.redirect_stdout(log), contextlib.redirect_stderr(log):
            built = runpy.run_path(str(layout_py), run_name="__main__")
    except BaseException as exc:  # noqa: BLE001
        why = exc.code if isinstance(exc, SystemExit) else f"{type(exc).__name__}: {exc}"
        print(f"::error::{layout_py} did not finish ({why}). Nothing was measured, so nothing "
              f"here is evidence. Its last words:")
        show([ln for ln in log.getvalue().splitlines() if ln.strip()][-8:], "lines", 8)
        sys.exit(1)
    finally:
        sys.argv = saved_argv
    try:
        inst = unwrap(pathlib.Path(td) / "instance.js", "window.GI=")
        lay = unwrap(pathlib.Path(td) / "layout.js", "window.GL=")
    except (OSError, ValueError) as exc:
        print(f"::error::the builder wrote no readable documents ({type(exc).__name__}), so the "
              f"strings the drawings paint cannot be enumerated and nothing here is evidence")
        sys.exit(1)

try:
    errors, fellback = built["_errors"], built["_fellback"]
    census = {(row[1], row[2]) for row in errors} | {(c, s) for c, s in fellback}
except (KeyError, IndexError, TypeError, ValueError) as exc:
    print(f"::error::build/build_layout.py no longer keeps the record of what its text_w() was "
          f"asked for ({type(exc).__name__}). Without it this check cannot look, and a check "
          f"that cannot look must not report clean")
    sys.exit(1)

job = ml.collect()
declared = {(ctx, s) for ctx, v in job.items() for s in v["strings"]}
asked_ctx, declared_ctx = {c for c, _s in census}, set(job)
per_ctx = {}
for ctx, s in census:
    per_ctx.setdefault(ctx, set()).add(s)

# ---- the population, asserted before any verdict is read off it -------------
# An empty input is the loudest lie a gate can tell, and this one has four inputs. A census of
# nothing reports no mismatch in every direction; a job of nothing declares every key the
# builder asks for undeclared and then finds no key unasked; a document with no drawings paints
# no string that could go unmeasured.
views_i, views_l = doc_views(inst), doc_views(lay)
if not job:
    print("::error::measure_labels.collect() declared no contexts; refusing to judge the "
          "builder's arguments against nothing")
    sys.exit(1)
if not census:
    print("::error::the builder asked text_w() for nothing over the whole run. Either the "
          "record is not being kept or the build laid nothing out; either way this check "
          "looked at nothing and will not call it clean")
    sys.exit(1)
if not views_i or len(views_i) != len(views_l):
    print(f"::error::the builder wrote {len(views_i)} drawing(s) of data and {len(views_l)} of "
          f"geometry. The painted strings cannot be read off a pair that does not match")
    sys.exit(1)
# PINNED AND NOT COUNTED, the same terminator the digest census uses and for the same reason: a
# census over one drawing reports every containment below satisfied, and `> 0` cannot tell that
# from a census over fourteen. This is the run's own reading of reality held against a written
# number, so a real fifteenth drawing is loud here on its first run rather than absorbed.
want = int(os.environ["ZRIVE_DRAWINGS"])
if len(views_l) != want:
    print(f"::error::the builder laid out {len(views_l)} drawing(s) and this check intends "
          f"{want}. Either the run was short, in which case nothing below is a statement about "
          f"the drawings that did not happen, or there is genuinely a new one, in which case "
          f"EXPECTED_DRAWINGS in scripts/check_build.sh belongs in the same commit")
    sys.exit(1)

# ---- what the drawings paint, and WHERE EACH KIND OF IT COMES FROM -----------
# THE THREE KINDS THAT CAN COME FROM THE MODEL DO, and that is the point of splitting this in
# two. A mark, a tail and an edge verb are strings build/model.py declares; the builder neither
# chooses them nor changes them, so holding its lookups against ALL_VIEWS is a comparison with
# something that has never heard of build_layout.py, and it also catches a builder that dropped
# one from the document it wrote rather than only one that forgot to measure it.
painted = {"mark": {n["mark"] for v in ALL_VIEWS for n in v["nodes"] if n.get("mark")},
           "tail": {n["tail"] for v in ALL_VIEWS for n in v["nodes"] if n.get("tail")},
           "verb": {edge_parts(e)[2] for v in ALL_VIEWS for e in v["edges"]},
           "label line": set(), "caption line": set()}

# THE OTHER TWO CANNOT, AND THAT LIMIT IS REAL RATHER THAN AN OVERSIGHT. Where a label breaks is
# the builder's own decision and there is nowhere else to read it from; which of a lane's
# alternate captions is painted is the builder's own choice among the lines bands.py declares. So
# for these two the claim is narrower and is worth stating in the narrow form: WHATEVER LINES IT
# DECIDED TO DRAW, IT MEASURED THEM. A defect that changes the breaks moves this expectation with
# it, and the reserve arithmetic named under WHAT IT DOES NOT SAY above, issue 220, is exactly
# such a defect.
# The lines are rebuilt by the same arithmetic site/app.js does at unwrap(): the label's words,
# taken in the counts the geometry carries. A count that did not add up is a refusal here as it
# is there.
for data, geo in zip(views_i, views_l):
    if data["key"] != geo["key"] or data.get("grain") != geo.get("grain"):
        print(f"::error::the instance document's {data['key']}/{data.get('grain')} drawing is "
              f"paired with the layout's {geo['key']}/{geo.get('grain')}; the two documents are "
              f"not in the same order and nothing can be read across them")
        sys.exit(1)
    placed = {n["id"]: n for n in geo["drawing"]["nodes"]}
    for n in data["nodes"]:
        words = n["label"].split()
        for count in placed[n["id"]]["wrap"]:
            painted["label line"].add(" ".join(words[:count]))
            words = words[count:]
        if words:
            print(f"::error::{n['id']} on {data['key']} carries wrap counts that leave "
                  f"{words} over. The lines the page paints cannot be rebuilt")
            sys.exit(1)
    for band in geo["drawing"]["bands"]:
        painted["caption line"].update(band["lines"])

empty = sorted(k for k, v in painted.items() if not v)
if empty:
    print(f"::error::the model declares or the drawings paint no {', '.join(empty)} at all. That "
          f"is not a population this check can hold anything against")
    sys.exit(1)

flat = {s for v in painted.values() for s in v}
# The two counts are not meant to meet. collect() declares every contiguous run of words in every
# label, because greedy wrapping can ask for any of them and the table has to hold whichever the
# wrap width lands on; the builder asks for the runs it actually walked. Declared is an envelope
# over asked by construction, so the containment below is one-directional on purpose.
print(f"    {len(census)} (context, string) lookups over {len(views_l)} drawings in "
      f"{len(asked_ctx)} context(s), inside the {len(declared)} the job declares in "
      f"{len(declared_ctx)}")
print("    to measure: " + ", ".join(f"{len(v)} {k}{'' if len(v) == 1 else 's'}"
                                      for k, v in sorted(painted.items()))
      + f", {len(flat)} distinct strings")

# ---- A. nothing fell back ---------------------------------------------------
if fellback:
    uniq = sorted({(c, s) for c, s in fellback})
    fail(f"{len(fellback)} lookup(s) missed the width table, {len(uniq)} of them distinct. Every "
         f"one is laid out from the hand written per character estimate, which undershoots by up "
         f"to a fifth, and build/build_layout.py reports it on stderr without failing")
    show([f"{c:<12} {s!r}" for c, s in uniq], "strings")

# ---- B. every context asked for is one the job declares ---------------------
stray_ctx = sorted(asked_ctx - declared_ctx)
if stray_ctx:
    fail(f"the builder asked for {len(stray_ctx)} context(s) build/measure_labels.py declares "
         f"nothing for. A key no context declares is a face nothing measured, so every string "
         f"asked under it is estimated")
    for c in stray_ctx:
        fail_ex = sorted(per_ctx[c])[:3]
        print(f"      {c:<12} {len(per_ctx[c])} string(s), for instance {fail_ex}")
    print("      The declared contexts, read out of site/app.css by collect(): "
          + ", ".join(sorted(declared_ctx)))

stray = sorted(census - declared)
if stray and not stray_ctx:
    fail(f"the builder asked for {len(stray)} (context, string) pair(s) the job does not "
         f"declare, in contexts it does. collect() is what writes the table, so a pair it never "
         f"declares is one the table will never hold")
    show([f"{c:<12} {s!r}" for c, s in stray], "pairs")

# ---- C. every context the job declares is asked for, with a population ------
never = sorted(c for c in declared_ctx if not per_ctx.get(c))
if never:
    fail(f"{len(never)} context(s) are measured, committed and never asked for: "
         + ", ".join(never))
    print("      A context nothing asks for is a call site that has stopped composing that key. "
          "The reserve for a selected label, the italic face of a ghost chip and the uppercased "
          "band caption each live behind exactly one argument at exactly one call site in "
          "build/build_layout.py. Two of the three move no painted byte when they go: measured "
          "on this tree, dropping the ghost chip's italic flag and dropping the caption's caps "
          "flag each leave site/layout.js identical, so check 1 never sees them.")
    for c in never:
        print(f"      {c:<12} {len(job[c]['strings'])} string(s) measured for it: "
              f"{job[c]['note']}")

# ---- D. every string the drawings paint was measured ------------------------
seen = {s for _c, s in census}
for kind in sorted(painted):
    unmeasured = sorted(s for s in painted[kind] if s not in seen)
    if unmeasured:
        fail(f"{len(unmeasured)} of the {len(painted[kind])} {kind}s the drawings carry were "
             f"never measured at all. The box under them was reserved from the estimate, or from "
             f"nothing")
        show([repr(s) for s in unmeasured], f"{kind}s")

# ---- E. a drawn label line was measured in both faces the page paints it in --
# The two rules, and the italic the ghost class adds. Composed from what the stylesheet
# declares rather than from the literals at the call site, so #215 moving a call site to a
# different context moves this expectation with it instead of fighting it.
lbl = ml.css_rule(".node .lbl")
sel = ml.css_rule(".node.sel .lbl")
ghost_rule = ml.css_rule(".lbl-ghost")
if "font-weight" not in sel:
    print("::error::site/app.css's .node.sel .lbl no longer declares a font-weight, so what a "
          "click paints is not readable from the stylesheet and this check will not guess it")
    sys.exit(1)
slant = "i" if ghost_rule.get("font-style") == "italic" else ""
size = ml.px(lbl["font-size"])
rest_w = f"{float(lbl.get('font-weight', '400')):g}"
sel_w = f"{float(sel['font-weight']):g}"
faces = {False: (f"{size}/{rest_w}", f"{size}/{sel_w}"),
         True: (f"{size}/{rest_w}{slant}", f"{size}/{sel_w}{slant}")}
undeclared = sorted({c for pair in faces.values() for c in pair} - declared_ctx)
if undeclared:
    print(f"::error::site/app.css paints node labels in {undeclared}, which "
          f"build/measure_labels.py declares no context for. The stylesheet and the measuring "
          f"job disagree about the faces a label is drawn in, and until they agree neither can "
          f"be the expectation for the other")
    sys.exit(1)

wrong_face = []
for data, geo in zip(views_i, views_l):
    placed = {n["id"]: n for n in geo["drawing"]["nodes"]}
    for n in data["nodes"]:
        words = n["label"].split()
        for count in placed[n["id"]]["wrap"]:
            line = " ".join(words[:count])
            words = words[count:]
            for ctx in faces[bool(n.get("ghost"))]:
                if (ctx, line) not in census:
                    wrong_face.append((ctx, line))
if wrong_face:
    uniq = sorted(set(wrong_face))
    fail(f"{len(uniq)} drawn label line(s) were never measured in a face site/app.css paints "
         f"them in. A label is painted at {faces[False][0]} at rest and at {faces[False][1]} "
         f"while its card is selected, and a box reserved from only one of the two is about a "
         f"fifth short of the other")
    show([f"{c:<12} {s!r}" for c, s in uniq], "lines")

if BAD:
    print()
    print("  THE FIX STARTS AT THE CALL SITE. build/build_layout.py composes its context key "
          "from the arguments typed into each text_w() call, and the key it composes has to be "
          "the one site/app.css paints that string in. Where the repair MOVES a string to a face "
          "the job does not measure it in, which is #215's case for the marks, the rest of it is "
          "collect() in build/measure_labels.py and a table regenerated in a browser. This check "
          "stays red until all three agree, and that is the state it is for.")
    sys.exit(1)

print(f"    every context the job declares was asked for, every context asked for is declared, "
      f"and all {len(flat)} of those strings were measured")
PY
}

# ---------------------------------------------------------------------------------------------
# 4. And the width it got back is the width it reserved. Issue 220.
# ---------------------------------------------------------------------------------------------
# Check 3 above proves the right question was put to the width table. This one proves the answer
# was used. Between `text_w()` returning a number and that number becoming a coordinate sits
# `reserve()` at build/build_layout.py:427-432 and the two lines that widen its result for a mark
# and for a tail, and until this section existed nothing anywhere read what came out of them.
#
# ONE TOKEN, AND EVERY GATE ON THIS SIDE GREEN. `max` to `min` inside reserve() returns the
# regular width of a label the stylesheet paints bold the moment a reader clicks it, which is
# #203's harm arriving from the build side. Check 3 stays green because every line is still asked
# for in both faces, so its census is unchanged in shape. Check 1 stays green in the only workflow
# a builder edit has, because it compares the rebuild against the INDEX and any builder change is
# rebuilt and staged before the gates are read. The digest census stays green because it
# recomputes the fourteen from the bytes in front of it and asserts they are distinct, which a
# regenerated document satisfies by construction.
#
# AND ONE GATE OFF THIS SIDE DOES CATCH IT, WHICH THE FIRST DRAFT OF THIS HEADER CLAIMED
# OTHERWISE AND WAS WRONG ABOUT. scripts/smoke.mjs's placer oracle reimplements reserve() in the
# driver at smoke.mjs:13843-13866, max over the two label faces of every drawn line and then max
# with the mark and the tail at 9/400, and blocks the chip search with it. So an under reserved
# box moves which candidate is cheapest and the chips stand somewhere the oracle can beat.
# Measured, not argued: the mutation was applied to a copy of the tree, the site rebuilt from it
# and the real browser suite run against it, and `and no candidate its own line offers is cheaper
# than the one it stands on` fires with 93 of the 740 chips beaten, the four it names beaten by up
# to 168.10 against CHIP_COST_TOL of 1.0. 354 assertions, 353 passed, 1 failed, VERDICT: the page
# has regressed.
#
# THAT MAKES THIS CHECK'S CLAIM NARROWER AND MORE USEFUL THAN "NOTHING SEES IT". Nothing on the
# BUILD side sees it, and the build side is where a builder edit is read: check_build.sh is what
# .github/workflows/build.yml runs and what a contributor runs before pushing, and it would have
# said clean while the smoke workflow said the page had regressed, with no gate anywhere naming
# the reserve. It is also the narrower claim in the other direction: smoke catches this mutation
# through the chip placement and is blind to a reserve that is wrong on a node whose chips do not
# crowd it, which is measured below under WHAT IT DOES NOT SAY.
#
# AND THE LANE GATE INSIDE layout() CANNOT SEE IT, WHICH IS THE LOAD BEARING POINT AND IS
# ARITHMETIC RATHER THAN OPINION. `lane_slack()` is `min(x - lw/2 - x0, x1 - x - lw/2)`, so `lw`
# appears only negatively and a SMALLER reserve makes the slack LARGER. Driven with a lane of 250
# and a node centred at 125: a reserve of 240 gives +5.0, an under reserve of 200 gives +25.0,
# and an over reserve of 280 gives -15.0 and is refused. The lane gate can only ever catch a box
# that grew, and under reserving is the whole of #203 and the whole of this card. Measured on
# this tree, the `min` takes the tightest label from 0.0px of lane to spare to 5.6px and the gate
# says nothing.
#
# WHAT THIS RUNS. The real builder, over the real fourteen drawings, into a throwaway directory,
# with `_reserved` read back off the module the way check 3 reads `_errors` and `_fellback`. That
# list is one tuple per node laid out, `(tag, id, lw)`, appended by layout() at the point the
# reserve is final: after the issue 43 re-break and after the mark and the tail have widened it.
# It is appended to and never read inside the builder, and site/layout.js is byte identical with
# it and without it, which was checked by rebuilding rather than reasoned about. That is what
# makes the reserve readable at all: it is a local inside layout() and it reaches neither
# document, so emitting it into site/layout.js was the alternative and it would have moved the
# fourteen digests to carry a number only a gate reads.
#
# AND THE OTHER SIDE OF THE COMPARISON IS NOT build_layout.py, which is the whole discipline
# here and is the fourth place in this repository where the same trap has been walked around. A
# check that recomputed `max(text_w(400), text_w(600))` and held it against what the builder
# computed would be two copies of one opinion, and it would agree with the defect the moment the
# table was wrong. So the expectation is built from three places that have never heard of the
# builder's arithmetic:
#
#   the WIDTHS come out of build/label_widths.json, read as JSON from this file rather than
#   through build_layout.py's own lookup. #195 settled that this is admissible and why: the
#   width table is an INPUT to the placement, and an oracle that reads the input and never reads
#   the output is not circular. THIS CHECK IS THEREFORE HONEST ABOUT THE ARITHMETIC AND CIRCULAR
#   ABOUT THE WIDTHS, and the second half of that sentence is a limit rather than a defect but it
#   has to be said in the sharp form, because the first draft of this header said the table's
#   correctness was inherited from check 2 and from scripts/smoke.mjs and that claim does not
#   reach. Check 2 is a MEMBERSHIP test: it asks whether every declared (context, string) pair is
#   present, never whether the number under it is right. smoke.mjs's own phase holds the FACE a
#   string is measured in against the cascade and reads neither a width nor a coordinate on either
#   side, which it says in its own header, and the only place it holds a measured NUMBER against a
#   painted one is the two captions in the 9px row. So nothing anywhere holds a 10/400, a 10/600,
#   a 10/400i or a 10/600i number against a browser, and those bound 454 of the 570 nodes here. A
#   width in the table that is wrong by twenty units moves the builder and this check together and
#   both stay silent. That is the same limit smoke.mjs's placer oracle states about itself, in the
#   same words, and it is one card and not this one;
#
#   the FACES come out of site/app.css through measure_labels.css_rule(), composed from what
#   `.node .lbl`, `.node.sel .lbl` and `.lbl-ghost` declare, exactly as check 3's assertion E
#   composes them, so a stylesheet that stopped painting a selected label bold moves this
#   expectation with it instead of fighting it;
#
#   the LINES come out of the two documents the builder just wrote, rebuilt from the label and
#   the wrap counts by the same arithmetic site/app.js uses at unwrap(). That is the same narrow
#   claim check 3 states for its label lines and it is stated narrowly here too: WHATEVER LINES
#   IT DECIDED TO BREAK THE LABEL INTO, THE BOX IT RESERVED HOLDS THEM. Where a label breaks is
#   the builder's own decision and there is nowhere else to read it from, so a defect in the
#   WRAPPING moves this expectation with it and is not what this section is about.
#
# TWO DIRECTIONS, AND THEY ARE NOT WORTH THE SAME. The under direction is the card: a reserve
# short of the widest face is a label box the page paints outside, and nothing on this side of
# the build looks that way. The over direction is a reserve nothing can name a string for, and
# the lane gate does eventually catch it, but only once the box has left its lane; before that it
# is silent and it still moves geometry, because build/build_layout.py:611 blocks the chip placer
# with `n["lw"] + 6` and a box that grew pushes chips onto different candidates. Both are
# asserted and the headroom in both is printed on the PASS, so a corpus drifting towards the
# tolerance is visible before it crosses it rather than after.
#
# AND A THIRD ASSERTION, WHICH IS THE CARD'S OWN SENTENCE ONE LAYER IN AND WAS FOUND BY AN
# ADVERSARIAL READ OF THE FIRST DRAFT OF THIS CHECK. The two above hold the reserve the builder
# ARRIVED AT. `build/build_layout.py:611` is the only line where that number becomes a
# coordinate, and holding only the published one left it free: `n["lw"] + 6` changed to
# `n["lw"] - 24` was green here, every chip on the page blocked by a box thirty units narrower
# than the label in it, which is precisely "nothing proves a reserved width was used". So the
# builder records the box READ BACK OUT of the list it went into, the way text_w()'s two lists
# sit on its return path rather than beside it, and this check holds it against the reserve plus
# a restated pad.
#
# WHAT IT DOES NOT SAY. It is about the arithmetic and not about the face a mark is measured in.
# The mark and the tail are held against every context the committed table measures them in at
# the size site/app.css gives `.chip-tx`, which today is `9/400` and `9/400i` and which holds the
# mark strings under the upright one only. #215 is open on the stylesheet painting a mark italic
# at `.node .lbl.lbl-missing`, and when it lands and the table gains the italic entries this
# bound tightens on its own and goes red until build/build_layout.py:463 follows it. Composing
# that context from the stylesheet TODAY would go red on another card's defect.
#
# AND THREE MORE HOLES, EACH FOUND BY RUNNING THE MUTATION RATHER THAN BY READING FOR IT.
#
#   THE REGULAR TERM INSIDE reserve() IS INERT AND THIS CHECK CANNOT SEE IT GO. Both sides take
#   the maximum over the two label faces, and on this table the selected face is strictly wider on
#   all 667 drawn lines, so `text_w(ln, FONT, 400, it)` cannot decide any reserve. Changing that
#   400 to a 600 leaves site/layout.js byte identical and is green here. It is not invisible
#   everywhere: check 3 still catches it, because wrap() goes on asking for 10/400 and the census
#   would notice the context emptying only if it emptied, which is why the two checks are both
#   worth running. What this check does instead is PRINT which face actually bounds each node, so
#   a reader sees that three of the five faces in its own summary line bound nothing at all.
#
#   THE WRAPPING IS NOT A SUBJECT HERE. The lines come out of the wrap counts the builder just
#   wrote, so a mutation that changes where a label breaks moves this expectation with it. That is
#   check 3's stated limit as well and it is the same limit for the same reason: where a label
#   breaks is the builder's own decision and there is nowhere else to read it from.
#
#   THE TWO GATES THIS SECTION'S ARGUMENT LEANS ON ARE THEMSELVES UNTESTED. `lane_slack()`'s
#   refusal and `caption_overflow()`'s comparison both feed only a `sys.exit`, so their verdicts
#   leave no trace an outside reader can check, and a two token edit to either disarms it with
#   every byte identical. Named in #220's own body as the same class and deliberately left there:
#   the instrument for a disarmed guard is a self-test probe against a mutated builder, which is a
#   different shape from this check and belongs beside the caption machinery.
#
# The builder to run is the first argument, the number of drawings it must lay out the second,
# both for the reasons check 3 gives. The third is a nudge in units applied to ONE recorded
# reserve, which exists because neither direction of a comparison is armed until something has
# been shown to fail it and this corpus agrees exactly, at 0.0 in both directions: there is no
# mutation of the arithmetic that over reserves and still builds, because the tightest label
# already has 0.0px of lane to spare and the lane gate refuses anything wider. So the over
# direction is proved on a plant in the reading rather than on a plant in the builder, and the
# plant is one entry out of five hundred and seventy rather than all of them.
check_reserve_used() {  # [builder] [expected-drawings] [nudge]
  ZRIVE_ROOT="$ROOT" ZRIVE_LAYOUT_PY="${1:-$ROOT/build/build_layout.py}" \
  ZRIVE_DRAWINGS="${2:-$EXPECTED_DRAWINGS}" ZRIVE_NUDGE="${3:-0}" python3 - <<'PY'
import contextlib
import io
import json
import os
import pathlib
import runpy
import sys
import tempfile

root = pathlib.Path(os.environ["ZRIVE_ROOT"])
layout_py = pathlib.Path(os.environ["ZRIVE_LAYOUT_PY"])
nudge = float(os.environ["ZRIVE_NUDGE"])
sys.path.insert(0, str(root / "build"))
import measure_labels as ml  # noqa: E402
from model import doc_views  # noqa: E402

# Float, and the two sides are the same floats: the builder's reserve is the maximum of values
# read out of build/label_widths.json and this file reads the same values out of the same file,
# so exact equality is what a correct build produces and this is a guard against arithmetic and
# not a tolerance for disagreement. The clean corpus sits at 0.0 in both directions and the
# number is printed on the PASS so that is checkable rather than asserted here.
TOL = 1e-6
# THE PAD BETWEEN THE RESERVE AND THE BOX THE CHIP PLACER IS BLOCKED WITH, restated here and not
# imported, which is the same thing scripts/smoke.mjs does with the whole placer specification and
# for the same reason. It is a terminator like EXPECTED_DRAWINGS: a pad legitimately changed in
# build/build_layout.py has to be changed here in the same commit, and until it is this check goes
# red and names the number.
LABEL_BOX_PAD = 6.0
BAD = 0


def fail(msg):
    global BAD
    BAD = 1
    print(f"::error::{msg}")


def show(rows, head, n=12):
    for row in rows[:n]:
        print(f"      {row}")
    if len(rows) > n:
        print(f"      ... and {len(rows) - n} more {head}")


def unwrap(path, prefix):
    text = path.read_text(encoding="utf-8")
    return json.loads(text[len(prefix):-len(";\n")])


if not layout_py.is_file():
    print(f"::error::no builder at {layout_py}. Nothing was run, so nothing here is evidence")
    sys.exit(1)

# ---- run the builder and keep only what it reserved -------------------------
with tempfile.TemporaryDirectory() as td:
    saved_argv = sys.argv
    sys.argv = [str(layout_py), "--out", td]
    log = io.StringIO()
    try:
        with contextlib.redirect_stdout(log), contextlib.redirect_stderr(log):
            built = runpy.run_path(str(layout_py), run_name="__main__")
    except BaseException as exc:  # noqa: BLE001
        why = exc.code if isinstance(exc, SystemExit) else f"{type(exc).__name__}: {exc}"
        print(f"::error::{layout_py} did not finish ({why}). Nothing was reserved, so nothing "
              f"here is evidence. Its last words:")
        show([ln for ln in log.getvalue().splitlines() if ln.strip()][-8:], "lines", 8)
        sys.exit(1)
    finally:
        sys.argv = saved_argv
    try:
        inst = unwrap(pathlib.Path(td) / "instance.js", "window.GI=")
        lay = unwrap(pathlib.Path(td) / "layout.js", "window.GL=")
    except (OSError, ValueError) as exc:
        print(f"::error::the builder wrote no readable documents ({type(exc).__name__}), so the "
              f"nodes it reserved boxes for cannot be enumerated and nothing here is evidence")
        sys.exit(1)

try:
    record = [(str(tag), str(nid), float(lw)) for tag, nid, lw in built["_reserved"]]
    boxes = [(str(tag), str(nid), float(w)) for tag, nid, w in built["_blocked_lab"]]
except (KeyError, TypeError, ValueError) as exc:
    print(f"::error::build/build_layout.py no longer keeps the record of what it reserved or of "
          f"the box it blocked the chip placer with ({type(exc).__name__}). Both are locals "
          f"inside layout() and reach neither document, so without those lists this check cannot "
          f"look, and a check that cannot look must not report clean")
    sys.exit(1)

# THE TABLE THE BUILDER READ AND THE TABLE THIS CHECK READS ARE THE SAME FILE, asserted rather
# than assumed. build_layout.py resolves its table through ZRIVE_LABEL_WIDTHS, and a run against
# one table judged from another would disagree everywhere and name the arithmetic for it.
widths_path = root / "build" / "label_widths.json"
try:
    used = pathlib.Path(built["WIDTHS_PATH"]).resolve()
except (KeyError, TypeError) as exc:
    print(f"::error::the builder no longer says which width table it read "
          f"({type(exc).__name__}), so this check cannot tell whether it is judging that run "
          f"against the numbers that produced it")
    sys.exit(1)
if used != widths_path.resolve():
    print(f"::error::the builder laid out from {used} and this check reads {widths_path}. Two "
          f"different tables cannot be one expectation, and the disagreement would be reported "
          f"as an arithmetic defect")
    sys.exit(1)
try:
    doc = json.loads(widths_path.read_text(encoding="utf-8"))
    TBL, CTX = doc["widths"], doc["contexts"]
except (OSError, ValueError, KeyError) as exc:
    print(f"::error::no readable width table at {widths_path} ({type(exc).__name__}). Nothing "
          f"here is evidence: every reserve would be compared against nothing")
    sys.exit(1)

# ---- the faces, out of the stylesheet ---------------------------------------
lbl = ml.css_rule(".node .lbl")
sel = ml.css_rule(".node.sel .lbl")
ghost_rule = ml.css_rule(".lbl-ghost")
chip = ml.css_rule(".chip-tx")
if "font-weight" not in sel or "font-size" not in lbl or "font-size" not in chip:
    print("::error::site/app.css no longer declares the size a node label is painted at, the "
          "weight a click gives it, or the size of a chip. What the page paints is not readable "
          "from the stylesheet and this check will not guess it")
    sys.exit(1)
size = ml.px(lbl["font-size"])
slant = "i" if ghost_rule.get("font-style") == "italic" else ""
rest_w = f"{float(lbl.get('font-weight', '400')):g}"
sel_w = f"{float(sel['font-weight']):g}"
faces = {False: (f"{size}/{rest_w}", f"{size}/{sel_w}"),
         True: (f"{size}/{rest_w}{slant}", f"{size}/{sel_w}{slant}")}
# The mark and the tail are drawn at the chip size, and which FACE of it is #215's question and
# not this one's. So the bound is every context the committed table measures a string in at that
# size, excluding the uppercased caption face, which is a different rule of the stylesheet and
# would put a caption's letter spacing under a mark that happened to read the same.
chip_size = ml.px(chip["font-size"])
try:
    small = sorted(k for k, v in CTX.items()
                   if ml.px(v["css"]["font-size"]) == chip_size
                   and "text-transform" not in v["css"])
except (KeyError, TypeError, ValueError) as exc:
    print(f"::error::build/label_widths.json no longer says what CSS each of its contexts was "
          f"measured under ({type(exc).__name__}), so the faces a mark could have been measured "
          f"in cannot be enumerated")
    sys.exit(1)
missing_face = sorted({c for pair in faces.values() for c in pair} - set(TBL))
if missing_face or not small:
    lack = ("no entries for " + ", ".join(missing_face) if missing_face
            else f"no context at {chip_size}px that is not the uppercased caption face")
    print(f"::error::site/app.css paints node labels in "
          f"{', '.join(sorted({c for p in faces.values() for c in p}))} and paints marks at "
          f"{chip_size}px, and build/label_widths.json holds {lack}. The stylesheet and the "
          f"table disagree about the faces the page is painted in, and until they agree neither "
          f"can be the expectation for the other")
    sys.exit(1)

# ---- the population, asserted before any verdict is read off it -------------
# A gate that enumerated no reserve would report no disagreement and print clean, which is the
# state this repository has shipped seventeen instruments unable to tell from a real one. There
# are three ways to enumerate nothing here and all three are refusals: an empty record, a run
# that laid out a different number of drawings than this check intends, and a record whose nodes
# are not the nodes the documents carry.
views_i, views_l = doc_views(inst), doc_views(lay)
if not record or not boxes:
    print("::error::the builder reserved a box for nothing over the whole run, or blocked the "
          "chip placer with nothing. Either the record is not being kept or the build laid "
          "nothing out; either way this check looked at nothing and will not call it clean")
    sys.exit(1)
if not views_i or len(views_i) != len(views_l):
    print(f"::error::the builder wrote {len(views_i)} drawing(s) of data and {len(views_l)} of "
          f"geometry. The labels a reserve is for cannot be read off a pair that does not match")
    sys.exit(1)
want_drawings = int(os.environ["ZRIVE_DRAWINGS"])
if len(views_l) != want_drawings:
    print(f"::error::the builder laid out {len(views_l)} drawing(s) and this check intends "
          f"{want_drawings}. Either the run was short, in which case nothing below is a "
          f"statement about the drawings that did not happen, or there is genuinely a new one, "
          f"in which case EXPECTED_DRAWINGS in scripts/check_build.sh belongs in the same commit")
    sys.exit(1)

reserved, blocked_w = {}, {}
dupes = []
for target, rows in ((reserved, record), (blocked_w, boxes)):
    for tag, nid, v in rows:
        if (tag, nid) in target:
            dupes.append(f"{tag} {nid}")
        target[(tag, nid)] = v
if dupes:
    print(f"::error::{len(dupes)} node(s) were recorded twice, so a reserve read by id is not "
          f"the reserve a particular node got: " + ", ".join(sorted(set(dupes))[:8]))
    sys.exit(1)

# BOTH LISTS ARE HELD AGAINST THE DOCUMENTS AND NOT AGAINST EACH OTHER, which is one comparison
# rather than two and is the stronger of the two shapes. Two records that agree with the drawings
# agree with each other by construction; two records that agree with each other and not with the
# drawings would pass a comparison between themselves and say nothing.

# THE NUDGE, and it lands on one entry rather than on all of them. See the header: the over
# direction has no mutation of the builder that survives the lane gate, so it is proved on a
# plant in the reading, and a plant that moved every reserve would prove only that a gate can
# see five hundred and seventy disagreements at once.
if nudge:
    k = min(reserved)
    reserved[k] += nudge
    print(f"    (self-test nudged {k[0]} {k[1]} by {nudge:+g} units)")

# ---- what each node paints, out of the two documents ------------------------
expected, weighed = {}, set()
unmeasured = []
for data, geo in zip(views_i, views_l):
    grain = data.get("grain", "sessions")
    tag = data["key"] + ("" if grain == "sessions" else "/" + grain)
    if data["key"] != geo["key"] or grain != geo.get("grain", "sessions"):
        print(f"::error::the instance document's {data['key']}/{grain} drawing is paired with "
              f"the layout's {geo['key']}/{geo.get('grain')}; the two documents are not in the "
              f"same order and nothing can be read across them")
        sys.exit(1)
    placed = {n["id"]: n for n in geo["drawing"]["nodes"]}
    for n in data["nodes"]:
        if n["id"] not in placed:
            print(f"::error::{n['id']} on {tag} is in the instance document and not in the "
                  f"geometry, so the lines it paints cannot be rebuilt")
            sys.exit(1)
        words = n["label"].split()
        lines = []
        for count in placed[n["id"]]["wrap"]:
            lines.append(" ".join(words[:count]))
            words = words[count:]
        if words or not lines:
            print(f"::error::{n['id']} on {tag} carries wrap counts that leave {words} over or "
                  f"break its label into no lines at all. The lines the page paints cannot be "
                  f"rebuilt, so what the box under them has to hold is not known")
            sys.exit(1)
        need = []
        for line in lines:
            for ctx in faces[bool(n.get("ghost"))]:
                if line in TBL.get(ctx, {}):
                    need.append((ctx, line, TBL[ctx][line]))
                else:
                    unmeasured.append((ctx, line))
        for kind in ("mark", "tail"):
            s = n.get(kind)
            if not s:
                continue
            hit = [(c, s, TBL[c][s]) for c in small if s in TBL.get(c, {})]
            if not hit:
                unmeasured.append(("/".join(small), s))
            need += hit
        expected[(tag, n["id"])] = need

# EVERY STRING THIS CHECK NEEDS IS IN THE TABLE, or it did not look. A miss is a real defect as
# well, and check 3's assertion A is where it is reported as one; here it is the state in which
# a comparison cannot be made, because the builder would have laid the box out from the hand
# written per character estimate and there is no measured number to hold it against.
if unmeasured:
    uniq = sorted(set(unmeasured))
    print(f"::error::{len(uniq)} (face, string) pair(s) the drawings paint are not in "
          f"{widths_path.name}, so the box reserved for them cannot be weighed against anything "
          f"and nothing below is a statement about those nodes. Regenerate the table with "
          f"build/measure_labels.py, and see check 2 and check 3 for why it went missing")
    show([f"{c:<12} {s!r}" for c, s in uniq], "pairs")
    sys.exit(1)

for what, got in (("reserve", reserved), ("chip placer box", blocked_w)):
    only_recorded = sorted(set(got) - set(expected))
    only_painted = sorted(set(expected) - set(got))
    if only_recorded or only_painted:
        print(f"::error::the builder recorded the {what} for {len(got)} node(s) and the two "
              f"documents it wrote carry {len(expected)}. A {what} this check never sees is a "
              f"number nothing holds, and a node with no {what} recorded is a node this check "
              f"silently passed over")
        show([f"recorded, not painted: {t} {i}" for t, i in only_recorded]
             + [f"painted, not recorded: {t} {i}" for t, i in only_painted], "nodes")
        sys.exit(1)

for k, need in expected.items():
    weighed.update((c, s) for c, s, _w in need)

# WHICH FACE ACTUALLY DECIDES, WHICH IS THE POPULATION THE VERDICT IS READ OFF and not the one it
# is weighed against. Naming five faces in a summary line says nothing about whether five of them
# can move an outcome: measured on this tree, `10/600` bounds 398 nodes, `9/400` bounds 116 and
# `10/600i` bounds 56, while `10/400`, `10/400i` and `9/400i` bound NONE, because the selected face
# is strictly wider than the resting one on every drawn line. So the regular term inside reserve()
# is inert, a mutation that deletes it moves no reserve and no painted byte, and this check cannot
# see it. That is a limit of this instrument and it is printed rather than left to be discovered.
argmax = {}
for key, need in expected.items():
    best = max(w for _c, _s, w in need)
    for c in sorted({c for c, _s, w in need if w == best}):
        argmax[c] = argmax.get(c, 0) + 1
# AND THE PREMISE OF THE WHOLE COMPARISON, asserted rather than assumed. If the table ever said a
# selected label is no wider than a resting one, reserve()'s bold term would be reserving nothing,
# #203 would not be a defect and this check would be weighing every node against a number it would
# have got either way. A count of zero here is a vacuous gate, not a clean one.
widened = 0
for data, geo in zip(views_i, views_l):
    placed = {n["id"]: n for n in geo["drawing"]["nodes"]}
    for n in data["nodes"]:
        rest, sel_ctx = faces[bool(n.get("ghost"))]
        words = n["label"].split()
        for count in placed[n["id"]]["wrap"]:
            line = " ".join(words[:count])
            words = words[count:]
            widened += TBL[sel_ctx][line] > TBL[rest][line]
if not widened:
    print(f"::error::not one drawn label line is wider at {faces[False][1]} than at "
          f"{faces[False][0]} in {widths_path.name}. reserve() takes the wider of the two faces "
          f"and on this table the two are the same, so nothing it does can be wrong in the "
          f"direction this check looks and a pass here would mean nothing")
    sys.exit(1)

print(f"    {len(expected)} node(s) over {len(views_l)} drawings, weighed against "
      f"{len(weighed)} measured (face, string) pair(s) in "
      f"{', '.join(sorted({c for c, _s in weighed}))}")
print("    bounded by " + ", ".join(f"{n} at {c}" for c, n in sorted(argmax.items()))
      + f"; {widened} drawn line(s) are wider selected than at rest")

# ---- A. the reserve holds every line in the face a click paints it in -------
short, wide = [], []
worst_short = worst_wide = 0.0
for key in sorted(expected):
    need = expected[key]
    got = reserved[key]
    ctx, string, bound = max(need, key=lambda r: r[2])
    gap = got - bound
    if gap < -TOL:
        short.append((key, ctx, string, bound, got))
        worst_short = min(worst_short, gap)
    elif gap > TOL:
        wide.append((key, ctx, string, bound, got))
        worst_wide = max(worst_wide, gap)

if short:
    fail(f"{len(short)} of the {len(expected)} node(s) reserved a box narrower than the widest "
         f"face site/app.css paints their own lines in, by up to {-worst_short:.2f}px. A label "
         f"is painted at {faces[False][0]} at rest and at {faces[False][1]} while its card is "
         f"selected, and reserve() in build/build_layout.py exists to hold the second: the box "
         f"has to hold the state the page enters on a click as well as the one it starts in. The "
         f"lane overflow gate inside layout() cannot report this, because lw appears only "
         f"negatively in lane_slack() and a box that shrank makes the slack larger")
    show([f"{t} {i:<10} reserved {g:.2f} for {b:.2f} of {c} {s!r}"
          for (t, i), c, s, b, g in short], "nodes")
if wide:
    fail(f"{len(wide)} of the {len(expected)} node(s) reserved a box wider than any string they "
         f"paint, by up to {worst_wide:.2f}px, and nothing names what the extra is for. The lane "
         f"gate catches this direction only once the box has left its lane; before that it is "
         f"silent and the reserve still moves geometry, because the chip placer is blocked with "
         f"lw + 6 and a box that grew pushes chips onto different candidates")
    show([f"{t} {i:<10} reserved {g:.2f} for {b:.2f} of {c} {s!r}"
          for (t, i), c, s, b, g in wide], "nodes")

# ---- C. and the number that becomes a coordinate is that reserve --------------
# THE DIFFERENCE BETWEEN THE WIDTH A RESERVE ARRIVED AT AND THE WIDTH THAT WAS USED, which is this
# card's own sentence one layer in and was found by an adversarial read of the first draft of this
# check. build/build_layout.py:611 is the only line where `lw` becomes a coordinate: it blocks the
# chip placer with a box `LABEL_BOX_PAD` wider than the reserve, and a chip placed on a box that
# is not the label's is a chip on top of the label. Holding only the published number left that
# line free to change with every gate on this side green.
loose = []
worst_box = 0.0
for key in sorted(expected):
    want_box = reserved[key] + LABEL_BOX_PAD
    got_box = blocked_w[key]
    if abs(got_box - want_box) > TOL:
        loose.append((key, reserved[key], want_box, got_box))
        worst_box = max(worst_box, abs(got_box - want_box))
if loose:
    fail(f"{len(loose)} of the {len(expected)} node(s) blocked the chip placer with a box that is "
         f"not their own reserve plus the {LABEL_BOX_PAD:g} unit pad, by up to {worst_box:.2f}px. "
         f"A box narrower than the label inside it is a box the placer is entitled to put a verb "
         f"chip on top of, and a box wider than it pushes chips off positions they could have "
         f"had. If the pad itself changed on purpose, LABEL_BOX_PAD in scripts/check_build.sh "
         f"belongs in the same commit")
    show([f"{t} {i:<10} reserved {lw:.2f}, expected a {wb:.2f} box, blocked with {gb:.2f}"
          for (t, i), lw, wb, gb in loose], "nodes")

if BAD:
    print()
    print("  THE FIX IS IN THE ARITHMETIC AND NOT AT THE CALL SITE. Check 3 above says which "
          "widths were asked for and this one says what was done with them, so a run that is "
          "green there and red here has the right numbers and the wrong sum. reserve() at "
          "build/build_layout.py:427-432 takes the wider of the two faces, the issue 43 re-break "
          "below it re-reserves after re-wrapping, and the mark and the tail widen the result "
          "again. One of those four is not holding.")
    sys.exit(1)

print(f"    every reserve is the widest measured line the node paints and every chip placer box "
      f"is that reserve plus {LABEL_BOX_PAD:g}, headroom {abs(worst_short):.2f}px short and "
      f"{worst_wide:.2f}px wide against a tolerance of {TOL:g}")
PY
}

# ---------------------------------------------------------------------------------------------
# 5. And the numbers in that table are numbers a browser could have produced. Issue 221.
# ---------------------------------------------------------------------------------------------
# WHAT WAS OPEN. Checks 2, 3 and 4 above hold the table's MEMBERSHIP, the arguments put to it and
# the arithmetic done with the answers. Not one of them reads a number and asks whether it is
# right, and neither does scripts/smoke.mjs, whose own header says so. build/measure_labels.py
# has carried a --check since it was written and nothing has ever called it. So a value in
# build/label_widths.json edited by hand passed every gate in this repository: halve every entry
# under widths["9/400"], or exchange widths["10/400i"] with widths["10/600i"] wholesale, and the
# build reproduces, the coverage holds, the arguments are unchanged and the reserve agrees,
# because every one of those checks reads the same doctored number the builder read.
#
# WHY THE OBVIOUS REPAIR IS NOT THE ONE MADE HERE, MEASURED RATHER THAN ASSUMED. `python3
# build/measure_labels.py --check` on the machine that wrote the table: 5118 entries, ZERO value
# changes, ZERO missing, THREE surplus rows, and it exited 1 on those three alone, because it was
# a byte comparison of the whole rendered document. Check 2 above reports the same three and has
# already ruled on them in as many words, "dead weight, not a wrong coordinate". So wiring that
# --check into CI would have gone red for a state this repository has decided is not a defect, and
# red a second way on any runner whose resolvable font set differs from the author's, and red a
# third way on nothing but a browser upgrade, since the document it compared carries the engine's
# user-agent string. A gate that goes red for reasons that are not defects teaches its reader to
# skip it, which is worse than no gate.
#
# --check has been made to separate those states instead of adding them up, and its own header
# carries the argument: exit 0 agreement, 1 a defect, 2 it could not measure at all, 3 it measured
# on a different envelope and did not judge the values. IT IS STILL NOT WIRED INTO CI AND THAT IS
# THE FINDING RATHER THAN AN OMISSION. The envelope is the measuring machine's resolvable font set;
# a runner's is not the owner's, so a runner reaches exit 3 with a browser and exit 2 without one,
# and a gate that can only ever answer "I could not look" is a gate nobody reads. It is the owner's
# instrument, run on the machine that can regenerate the table, and this check is the part of the
# same question that holds everywhere.
#
# WHAT THIS CHECK IS. The table, held against relations that no font can change, so it reads the
# same committed bytes on every machine and needs no browser. Two halves.
#
#   THE TABLE SAYS WHAT IT WAS MEASURED UNDER, and that is still what the stylesheet asks for. The
#   file records font_stack, envelope, probes, distinct_faces and the CSS of each context; those
#   are held against site/app.css through measure_labels.py's own readers. A stylesheet whose font
#   stack moved and a table nobody re-measured is exactly the state this card is named after, and
#   it is catchable with no browser at all because both sides are committed.
#
#   THE NUMBERS ARE NUMBERS A BROWSER COULD HAVE PRODUCED. Four relations, each with the count of
#   pairs it actually compared printed beside it, and a relation that compared nothing is a
#   refusal and not a pass:
#
#     R1 every width is a finite number greater than zero. 5118 values, from 3.35 to 382.38.
#     R2 the heavier weight of a face is never narrower than the lighter one, for every string
#        both hold. 2495 pairs, of which one is equal ('+' at 10px) and the rest strictly wider.
#        This is the exchange of widths["10/400i"] with widths["10/600i"], which #206 records as
#        invisible to a containment test.
#     R3 a run of words is never narrower than a contiguous sub-run of itself in the same context,
#        which the table holds by construction because collect() measures every sub-run. 35460
#        pairs on this table, 0 violations.
#     R4 a measured width stands in a plausible band against estimate_w(), the per character model
#        build/build_layout.py used before the table existed. It is an independent hand written
#        opinion and not a second reading of the table, which is what makes it admissible; it is
#        also crude, which is why the band is wide. Measured on the committed table: every one of
#        the 5118 ratios lies in [0.5376, 1.6491], and the seven per-context medians lie in
#        [1.0863, 1.2349]. The bands below are those two ranges with headroom. The per-context
#        median is what catches a whole context halved: halving widths["9/400"] leaves every
#        per-string ratio inside [0.5050, 0.5752] and inside the per-string band, and takes that
#        context's median to 0.546.
#
# WHAT IT CANNOT SAY, AND THIS IS THE HALF THAT MATTERS MOST.
#
#   ONE PLAUSIBLE NUMBER. A single width nudged by a few per cent satisfies every relation here.
#   Only a re-measurement catches that, and a re-measurement cannot run on a runner.
#
#   THE 400 BLOCK COPIED OVER THE 600 BLOCK. R2 is `>=` and holds under equality, and estimate_w()
#   takes no weight argument, so the medians do not move either. It is NOT repaired by tightening
#   R2 into a ratio band: a machine holding no real bold face synthesises one, and this tree's own
#   table proves synthesis preserves advances here, because all four strings the ghost contexts
#   share with the upright ones are identical to the hundredth in italic and upright. A floor above
#   1.0 would refuse such a machine for being itself, which is the failing this card is about.
#
#   THE CROSS-SIZE RELATION #221 LISTS, widths["10/400"][s] > widths["9/400"][s], IS NOT DECLARED
#   HERE, and the reason is a population and not an opinion: on this table the 10px and 9px
#   contexts share ZERO strings, because the 9px row holds edge verbs, marks and tails and the
#   10px rows hold node labels and their wrap candidates. A relation that enumerates nothing
#   reports no violations, which is the shape this repository has found seventeen instruments in.
#   Measured, recorded, and left out rather than wired as a silent pass.
#
# The table to read is the first argument, defaulting to the same $ZRIVE_LABEL_WIDTHS the builder
# and check 2 honour, so the self-test points this at a doctored copy without going near the
# committed one. The builder is the second, for R4's estimate_w and for the same reason check 3
# takes one: a path that cannot be run has to be shown to refuse.
check_widths_sane() {  # [table] [builder]
  ZRIVE_ROOT="$ROOT" \
  ZRIVE_LABEL_WIDTHS="${1:-${ZRIVE_LABEL_WIDTHS:-$WIDTHS_DEFAULT}}" \
  ZRIVE_LAYOUT_PY="${2:-$ROOT/build/build_layout.py}" python3 - <<'PY'
import contextlib
import io
import json
import os
import pathlib
import re
import runpy
import statistics
import sys
import tempfile

root = pathlib.Path(os.environ["ZRIVE_ROOT"])
sys.path.insert(0, str(root / "build"))
import measure_labels as ml  # noqa: E402

# R4's bands. The measured ranges on the committed table are in the header above; these are those
# ranges with headroom, and they are written here as constants so a later re-measurement that
# genuinely moves them moves one line rather than the argument.
BAND_LO, BAND_HI = 0.35, 2.60
MEDIAN_LO, MEDIAN_HI = 0.80, 1.60

BAD = 0


def fail(msg):
    global BAD
    BAD = 1
    print(f"::error::{msg}")


def show(rows, n=10):
    for row in rows[:n]:
        print(f"      {row}")
    if len(rows) > n:
        print(f"      ... and {len(rows) - n} more")


path = pathlib.Path(os.environ["ZRIVE_LABEL_WIDTHS"])
try:
    doc = json.loads(path.read_text(encoding="utf-8"))
    table = doc["widths"]
    if not isinstance(table, dict):
        raise ValueError("widths is not an object")
except (OSError, ValueError, KeyError, TypeError) as exc:
    print(f"::error::cannot read the width table at {path} ({type(exc).__name__}), so nothing "
          f"here is evidence")
    sys.exit(1)

# ---- the population, asserted before any verdict is read off it -------------
values = [(c, s, w) for c, d in table.items() if isinstance(d, dict) for s, w in d.items()]
job = ml.collect()
if not table or not values:
    print(f"::error::{path} holds no widths at all, so every relation below would hold "
          f"vacuously and this check would report a table it never read as sane")
    sys.exit(1)
if not job:
    print("::error::measure_labels.collect() declared no contexts, so what the stylesheet asks "
          "for cannot be enumerated and the table cannot be held against it")
    sys.exit(1)

# ---- half one: the table says what it was measured under --------------------
stack = ml.css_var("font-ui")
families = ml.envelope(stack)
if doc.get("font_stack") != stack:
    fail(f"site/app.css declares the font stack {stack!r} and {path.name} was measured under "
         f"{doc.get('font_stack')!r}. Every width in it is a measurement of a face the page no "
         f"longer asks for, and no browser is needed to see that")
if doc.get("envelope") != families:
    fail(f"{path.name} records an envelope of {len(doc.get('envelope') or [])} families and the "
         f"stylesheet plus measure_labels.EXTRA_FAMILIES come to {len(families)}. The table was "
         f"measured over a different set of faces than the one this tree asks for")
probes = doc.get("probes")
if not isinstance(probes, dict) or set(probes) != set(families) | {"sans-serif"}:
    fail(f"{path.name}'s probe row does not cover its own envelope, so which families the "
         f"measuring machine could tell apart cannot be read off it")
elif doc.get("distinct_faces") != len(set(probes.values())):
    fail(f"{path.name} says {doc.get('distinct_faces')} distinct faces and its own probe row "
         f"holds {len(set(probes.values()))} distinct widths. The file disagrees with itself "
         f"about what the measuring machine could resolve")

# The CSS AND NOT the whole context entry: each also carries a `note`, and comparing prose would
# make a comment edit demand a browser run to clear.
recorded = {k: (v or {}).get("css") for k, v in (doc.get("contexts") or {}).items()}
declared = {k: v["css"] for k, v in job.items()}
if set(recorded) != set(table):
    fail(f"{path.name} measures {len(table)} context(s) and declares the CSS of "
         f"{len(recorded)}. A context whose CSS the file does not record cannot be held against "
         f"the stylesheet at all")
drift = sorted(k for k in set(recorded) | set(declared) if recorded.get(k) != declared.get(k))
if drift:
    fail(f"{len(drift)} context(s) were measured under CSS site/app.css no longer declares: "
         f"{', '.join(drift)}")
    show([f"{k:<12} table {recorded.get(k)}  stylesheet {declared.get(k)}" for k in drift])

# ---- half two: the numbers a browser could have produced --------------------
KEY = re.compile(r"^(?P<size>[0-9.]+)/(?P<weight>[0-9]+)(?P<slant>i?)(?P<caps>\+caps)?$")
parsed = {}
for c in table:
    m = KEY.match(c)
    if not m:
        fail(f"the context key {c!r} is not a size/weight key this check knows how to read, so "
             f"the relations below cannot be told which of them apply to it")
        continue
    parsed[c] = (m["size"], m["slant"], bool(m["caps"]), int(m["weight"]))

# R1
nan = [(c, s, w) for c, s, w in values
       if isinstance(w, bool) or not isinstance(w, (int, float))
       or w != w or w in (float("inf"), float("-inf")) or w <= 0]
if nan:
    fail(f"{len(nan)} width(s) are not a positive finite number, and a browser cannot produce "
         f"one of those")
    show([f"{c:<12} {s!r}  {w!r}" for c, s, w in nan])
print(f"    R1 every width positive and finite: {len(values)} value(s) read, {len(nan)} bad")

# R2, R3 and R4 read this and not `table`. A value R1 has already refused is not a number the
# relations below can be applied to at all, and comparing one to a float raises rather than
# reports: a check that crashes on the input it is meant to describe has told the reader nothing.
num = {}
for c, s, w in values:
    if isinstance(w, (int, float)) and not isinstance(w, bool) and w == w:
        num.setdefault(c, {})[s] = w

# R2, over every pair of contexts that differ only in weight
pairs = [(a, b) for a in parsed if a in num for b in parsed if b in num
         if parsed[a][:3] == parsed[b][:3] and parsed[a][3] < parsed[b][3]]
n2 = 0
viol2 = []
for a, b in pairs:
    for s in set(num[a]) & set(num[b]):
        n2 += 1
        if num[b][s] < num[a][s]:
            viol2.append(f"{s!r}  {a} {num[a][s]}  {b} {num[b][s]}")
if not pairs or not n2:
    fail("no two contexts in this table differ only in weight, or they share no string, so the "
         "relation that a heavier face is never narrower compared nothing. A relation that "
         "enumerated nothing is not a relation that held")
if viol2:
    fail(f"{len(viol2)} string(s) are measured NARROWER at the heavier weight than at the "
         f"lighter one, which is not something a font does")
    show(sorted(viol2))
print(f"    R2 heavier weight never narrower: {n2} pair(s) over "
      f"{', '.join(f'{a}->{b}' for a, b in sorted(pairs))}, {len(viol2)} violation(s)")

# R3, a run against its own contiguous sub-runs in the same context
n3 = 0
viol3 = []
for c, d in num.items():
    for s in d:
        words = s.split()
        if len(words) < 2:
            continue
        for i in range(len(words)):
            for j in range(i + 1, len(words) + 1):
                if j - i == len(words):
                    continue
                sub = " ".join(words[i:j])
                if sub in d:
                    n3 += 1
                    if d[sub] > d[s]:
                        viol3.append(f"{c:<12} {s!r} {d[s]} < its sub-run {sub!r} {d[sub]}")
if not n3:
    fail("no string in this table shares a context with a contiguous sub-run of itself, so the "
         "sub-run relation compared nothing. collect() measures every sub-run, so a table where "
         "that is true is not a table this job produced")
if viol3:
    fail(f"{len(viol3)} string(s) are measured narrower than a sub-run of themselves")
    show(sorted(viol3))
print(f"    R3 a run is never narrower than its own sub-run: {n3} pair(s), "
      f"{len(viol3)} violation(s)")

# R4 needs the hand written model, which lives in the builder. Running it is the only way to read
# it without keeping a second copy here, and a second copy of an oracle is not an oracle.
layout_py = pathlib.Path(os.environ["ZRIVE_LAYOUT_PY"])
if not layout_py.is_file():
    print(f"::error::no builder at {layout_py}, so estimate_w() cannot be read and R4 was not "
          f"run. Nothing here is evidence")
    sys.exit(1)
with tempfile.TemporaryDirectory() as td:
    saved_argv = sys.argv
    sys.argv = [str(layout_py), "--out", td]
    log = io.StringIO()
    try:
        with contextlib.redirect_stdout(log), contextlib.redirect_stderr(log):
            built = runpy.run_path(str(layout_py), run_name="__main__")
    except BaseException as exc:  # noqa: BLE001
        why = exc.code if isinstance(exc, SystemExit) else f"{type(exc).__name__}: {exc}"
        print(f"::error::{layout_py} did not finish ({why}), so estimate_w() could not be read "
              f"and R4 was not run. Nothing here is evidence")
        sys.exit(1)
    finally:
        sys.argv = saved_argv
estimate_w = built.get("estimate_w")
if not callable(estimate_w):
    print("::error::build/build_layout.py no longer holds estimate_w(), which is the only "
          "independent opinion about a width this repository has. R4 was not run")
    sys.exit(1)

out_of_band, medians, n4 = [], {}, 0
for c, d in sorted(num.items()):
    if c not in parsed:
        continue
    size, _slant, caps, _w = parsed[c]
    ratios = []
    for s, w in d.items():
        est = estimate_w(s, float(size), caps)
        if est <= 0:
            continue
        r = w / est
        ratios.append(r)
        n4 += 1
        if not (BAND_LO <= r <= BAND_HI):
            out_of_band.append(f"{c:<12} {s!r}  measured {w}  estimated {est:.2f}  ratio {r:.3f}")
    if ratios:
        medians[c] = statistics.median(ratios)
if not n4 or not medians:
    fail("no width could be held against estimate_w(), so R4 compared nothing")
if out_of_band:
    fail(f"{len(out_of_band)} width(s) are outside [{BAND_LO}, {BAND_HI}] times the hand written "
         f"estimate, which is not a width a browser shaped for that string")
    show(sorted(out_of_band))
off = sorted((c, m) for c, m in medians.items() if not (MEDIAN_LO <= m <= MEDIAN_HI))
if off:
    fail(f"{len(off)} context(s) sit outside [{MEDIAN_LO}, {MEDIAN_HI}] times the hand written "
         f"estimate on the MEDIAN of the whole context, which is what a context scaled wholesale "
         f"looks like")
    show([f"{c:<12} median ratio {m:.3f}" for c, m in off])
if medians:
    lo = min(medians.items(), key=lambda kv: kv[1])
    hi = max(medians.items(), key=lambda kv: kv[1])
    print(f"    R4 within a band of the hand written estimate: {n4} value(s), "
          f"{len(out_of_band)} out of band, per-context medians {lo[1]:.3f} ({lo[0]}) to "
          f"{hi[1]:.3f} ({hi[0]})")

if BAD:
    print()
    print("  THE FIX: run  python3 build/measure_labels.py  on a machine with the browser it "
          "names, then run  python3 build/build_layout.py  and commit the table together with "
          "site/instance.js and site/layout.js.")
    print("  DO NOT hand write a width. Every relation above is one a shaped string satisfies "
          "and a typed number need not, and none of them can tell you the RIGHT width: only "
          "build/measure_labels.py --check can, on a machine whose envelope matches the table's.")
    sys.exit(1)

print(f"    {path.name} was measured under the stylesheet this tree has, and its "
      f"{len(values)} numbers satisfy every relation a shaped string has to")
PY
}

# ---------------------------------------------------------------------------------------------
# 6. The model is well formed.
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
# 7. The digest census. Issue 116.
# ---------------------------------------------------------------------------------------------
# Before this card `drawingDigest` occurred zero times in every gate this repository runs. The
# value was correct, nothing read it, and the audit changed one glyph in build/model.py, rebuilt
# for real and repainted ninety one tiles across nine of the fourteen drawings with all fourteen
# digests unchanged and the whole verify run clean. Widening what the digest covers is
# build/model.py's half of the repair; reading it at all is this one.
#
# THE NUMBER OF DRAWINGS IS WRITTEN BY HAND, and that is the point of the constant rather than a
# shortcoming of it. Issue 116 row F7: the smoke suite asserts "each of the fourteen drawings
# carries its own digest" over a population it derives from the document, so a loop over
# thirteen passes as fourteen and only the assertion's NAME says otherwise. A count taken from
# the run cannot notice a drawing that is not there. This is the same terminator EXPECTED_PROBES
# below and STRUCTURE_PROBES in build/model.py are, and a grain or a programme added has to
# change it in the same commit.
EXPECTED_DRAWINGS=14

# The three documents are arguments and none has a default, so the self-test drives the same
# function CI runs against doctored copies without going near the tree. site/render.js is in the
# list because the glyph table is drawing geometry that lives in code: see build/model.py above
# drawing_digest() for why it is fingerprinted separately instead of being folded into the
# fourteen.
#
# The output is captured and filtered for the same reason _model_says above captures and filters
# it: importing build/model.py prints that file's own notes about the vault it read, to stderr,
# and a census of digests is not the place to read them.
check_digests() {  # instance.js layout.js render.js [expected-drawings]
  local out rc
  out="$(ZRIVE_INSTANCE="$1" ZRIVE_LAYOUT="$2" ZRIVE_RENDER="$3" \
         ZRIVE_DRAWINGS="${4:-$EXPECTED_DRAWINGS}" python3 - <<'PY' 2>&1
import json
import os
import pathlib
import sys

sys.path.insert(0, "build")
from model import (doc_views, document_digest, drawing_digest, glyph_binding,  # noqa: E402
                   glyph_table, short_digest)


def abort(msg):
    # Exit 2, never 1. "I could not read the documents" and "the documents are wrong" are two
    # different sentences and a gate that cannot tell them apart has told you less than it
    # claims. Same discipline as the baseline naming above.
    print(f"::error::{msg}")
    sys.exit(2)


def load(var, kind):
    path = pathlib.Path(os.environ[var])
    try:
        txt = path.read_text(encoding="utf-8")
    except OSError as exc:
        abort(f"cannot read {path} ({type(exc).__name__}); no census was taken")
    i, j = txt.find("{"), txt.rfind("}")
    if i < 0 or j < i:
        abort(f"{path} carries no {kind} object; no census was taken")
    try:
        return path, json.loads(txt[i:j + 1])
    except ValueError as exc:
        abort(f"{path} is not readable as {kind} ({exc}); no census was taken")


ipath, inst = load("ZRIVE_INSTANCE", "an instance document")
lpath, lay = load("ZRIVE_LAYOUT", "a layout document")
rpath = pathlib.Path(os.environ["ZRIVE_RENDER"])
want = int(os.environ["ZRIVE_DRAWINGS"])
BUILDER = "python3 build/build_layout.py"
bad = []

# ---- the symbol table, read before anything is recomputed from it ----------------------------
try:
    glyph_src, glyph_keys = glyph_table(rpath)
except (OSError, ValueError) as exc:
    abort(f"{exc}")

painted, unbound = glyph_binding(inst, glyph_keys)
for name, where in unbound:
    bad.append(f"a tile will be painted with {name!r}, which {rpath} cannot draw. "
               f"First at {', '.join(where[:3])}. The renderer looks the name up in its PATHS "
               f"table and a name with no entry throws on the first tile that reaches it.")

# ---- the two document-wide digests ----------------------------------------------------------
for key, got, expect, what in (
        ("documentDigest", lay.get("documentDigest"), document_digest(inst),
         f"the whole of {ipath}, every top-level block of it"),
        ("glyphDigest", lay.get("glyphDigest"), short_digest(glyph_src),
         f"the glyph table in {rpath}")):
    if got is None:
        bad.append(f"{lpath} carries no {key}. It is written by the builder and covers {what}.")
    elif not (isinstance(got, str) and len(got) == 7
              and all(c in "0123456789abcdef" for c in got)):
        bad.append(f"{lpath}'s {key} is {got!r} and not seven lowercase hex characters.")
    elif got != expect:
        bad.append(f"{lpath} says {key} is {got} and {what} digests to {expect}. Those bytes "
                   f"changed and the document that fingerprints them did not. Run {BUILDER} "
                   f"and commit what it writes.")

# ---- the fourteen -----------------------------------------------------------------------------
iv, lv = doc_views(inst), doc_views(lay)

# THE TERMINATOR, AND IT IS FIRST. Everything after it walks a population the documents
# themselves supply, so every one of those assertions is true of thirteen drawings, or of one.
# It is asserted before the two documents are compared with each other for the same reason: a
# pair that agrees on thirteen agrees about the wrong number.
if len(lv) != want:
    bad.append(f"{lpath} carries {len(lv)} drawing(s) and this check intends {want}. Either a "
               f"drawing was lost, in which case the page is short a picture, or the model grew "
               f"one, in which case EXPECTED_DRAWINGS in scripts/check_build.sh belongs in the "
               f"same commit.")
if len(iv) != len(lv):
    bad.append(f"{ipath} holds {len(iv)} view(s) and {lpath} {len(lv)}. They are joined by "
               f"position, so a pair that does not line up draws one view's tiles at another "
               f"view's coordinates.")

seen = {}
for i, (v, d) in enumerate(zip(iv, lv)):
    tag = f"{d.get('key')}/{d.get('grain')}"
    if v.get("key") != d.get("key") or v.get("grain") != d.get("grain"):
        bad.append(f"drawing {i} is {tag} in {lpath} and {v.get('key')}/{v.get('grain')} in "
                   f"{ipath}; they are joined by position and this pair does not line up.")
        continue
    geom = dict(d.get("drawing") or {})
    got = geom.pop("drawingDigest", None)
    if got is None:
        bad.append(f"the drawing {tag} carries no drawingDigest.")
        continue
    if not (isinstance(got, str) and len(got) == 7
            and all(c in "0123456789abcdef" for c in got)):
        bad.append(f"the drawing {tag} has a drawingDigest of {got!r} and not seven lowercase "
                   f"hex characters.")
        continue
    if got in seen:
        bad.append(f"the drawings {seen[got]} and {tag} carry the same digest {got}. Two "
                   f"pictures reported as one is the failure a digest exists to prevent.")
    seen[got] = tag
    expect = drawing_digest(inst["types"], v, geom)
    if got != expect:
        bad.append(f"the drawing {tag} says its digest is {got} and the type registry, its own "
                   f"view and its own geometry digest to {expect}. Something that paints this "
                   f"picture moved and the value that answers 'is this the drawing we built' "
                   f"did not. Run {BUILDER} and commit what it writes.")

if bad:
    print(f"::error::the digest census refused {len(bad)} thing(s)")
    print()
    for line in bad:
        print(f"    {line}")
    print()
    print("  DO NOT edit a digest by hand and DO NOT edit site/layout.js. Every value above is")
    print(f"  written by {BUILDER} and is meant to be a function of the bytes it covers.")
    sys.exit(1)

print(f"    {len(lv)} drawings, {len(lv)} distinct digests, each recomputed from the type "
      f"registry, its own view and its own geometry")
print(f"    documentDigest {lay['documentDigest']} over every top-level block of {ipath.name}")
print(f"    glyphDigest {lay['glyphDigest']} over the {len(glyph_keys)} symbols in "
      f"{rpath.name}, {len(painted)} of which this document paints with")
PY
)"
  rc=$?
  printf '%s\n' "$out" | grep -v '^\[model\] '
  return "$rc"
}

# ---------------------------------------------------------------------------------------------
# 8. The census of what could look. Issue 168 R4(a).
# ---------------------------------------------------------------------------------------------
# THE NOTICES ARE THE EVIDENCE AND THE CORPUS IS THE CROSS-CHECK, in that order and not the other
# way round. Each gate says on its own face whether it verified or declined, and one of them can
# decline PARTIALLY, so a census built only out of "is the directory there" would be a second
# implementation of a rule that already exists and would be the weaker copy. What the directory
# is for is proving the census is reading the gates and not reading nothing.
#
# THE GATES ARE NAMED AND NOT COUNTED, and the difference bought something the first draft of
# this census did not have. A count is satisfied by any five lines; a roster is satisfied only by
# these five, so a gate that stops printing its notice is caught by name rather than by a total
# that some other gate's new second line could make up. Same terminator discipline as
# EXPECTED_DRAWINGS and EXPECTED_PROBES: a gate added to or removed from build/model.py moves
# this list in the same commit, and there is nowhere to put a sixth gate quietly.
#
# A NAME THAT DOES NOT ANSWER IS AN ABORT AND NOT AN UNVERIFIED. Silence has two readings, "the
# gate went quiet" and "the gate was deleted", this file cannot tell them apart, and under either
# one it can no longer report on that gate. Reporting it as merely unverified would be this
# card's own defect committed by the instrument written to close it.
#
# MOVED ONCE ALREADY, AND THE MOVE IS THE ARGUMENT FOR THE SHAPE. Issue 157 landed a sixth gate,
# `reach`, on main while this card was in flight. The rebase brought it in, the census met a name
# it did not know, and CI ABORTED at exit 2 rather than reporting on five gates out of six and
# calling that a census. The sixth is added here deliberately, by hand, in the commit that met it:
# it reads the 192 addresses the drawings ship and needs no corpus, so it is always verified, and
# it is on the roster because a gate this file cannot read is a gate this file cannot report on
# whether or not it has a corpus to lose.
#
# AND A HAND-MAINTAINED LIST IS THE RIGHT ANSWER HERE AND WAS THE WRONG ONE FOR CI, which is worth
# writing down because the two look identical and are not. R4(e) of the same audit is about the
# workflows re-enumerating scripts/verify.sh's steps, and the defect there is not that a list was
# written by hand: it is that there were TWO lists of one thing with nothing joining them, so a
# divergence was silent, sat from issue 103 until the audit, and was found by a reader.
#
# This is ONE list, and the thing it must correspond to is asked of the source on every run. It is
# therefore a relation and it is checked in both directions: a name that answers nothing aborts,
# and a notice from a name not on the list aborts. A divergence is loud on the first run after it
# appears, and that is measured rather than argued: issue 157 added the sixth gate about half an
# hour before this roster's first CI run, and that run aborted at exit 2 naming `reach` instead of
# reporting on five gates out of six.
#
# So the rule, said once for the next reader: a hand-written constant is safe when it is a
# TERMINATOR, checked against the run's own reading of reality so that being wrong is loud. It is
# unsafe when it is a COPY, a second statement of something nobody compares. EXPECTED_DRAWINGS,
# EXPECTED_PROBES, the smoke suite's EXPECTED_ASSERTIONS and its address count are terminators.
# The workflows' command list was a copy.
EXPECTED_MODEL_GATES='ontology registry|syllabus totals|module structure|reach|session templates|session agendas'

# ---- the state a gate is in, which is a TOKEN now and was a substring. Issue 196 -------------
# THE READER USED TO DECIDE WHETHER A GATE WAS BLIND BY LOOKING FOR THE WORD "unverified" INSIDE
# ITS PROSE. That worked while there were two states and it cannot survive a third: issue 196
# gives the three corpus gates a middle state, in which the corpus is absent and the tables were
# checked against a reading recorded by a machine that had it, and any sentence describing that
# state honestly contains the word "unverified" somewhere in it. A sniff over prose would have
# filed the repair as the defect.
#
# So every gate prints a token as the first thing after its name, this file reads the token, and
# a notice carrying no token or a token this file does not know is an ABORT. Same terminator
# discipline as the roster itself, and for the same reason: the failure of a gate to say what
# state it is in must be loud on the first run after it appears, not absorbed into a default.
#
#   verified      the gate read its corpus, here, on this run.
#   recorded      the corpus is not on this machine and the tables are byte for byte the ones a
#                 machine holding it verified on a recorded date. Weaker than verified by exactly
#                 one thing: a corpus that moved since that date.
#   stale-record  the gate read its corpus AND the committed attestation is of other tables. The
#                 document is sound and a tracked file is wrong. A DEFECT, failed below, and it
#                 is failed HERE rather than raised in build/model.py because
#                 scripts/gen_corpus_reading.sh imports that module to repair the very file.
#   unverified    the gate could not look at anything. The state every run of this repository
#                 was in before issue 196, kept reachable because a machine can still be in it.
MODEL_GATE_TOKENS='verified|recorded|stale-record|unverified'

# Filled in by run_census below and read by verdict(). Zero is the state where every gate looked.
CENSUS_UNVERIFIED=0
CENSUS_NAMES=""
# And the middle state, reported separately because it is not the same claim. A run with these
# is not incomplete: every gate answered, and each of these answered about a recorded reading
# rather than about a corpus. The verdict says so in its own paragraph.
CENSUS_RECORDED=0
CENSUS_RECORDED_NAMES=""

# The model's own account of itself, in one import, machine readable. stderr is captured rather
# than let out, because these lines are the subject here and not chatter.
model_census_input() {
  python3 - <<'PY'
import contextlib
import io
import sys

sys.path.insert(0, "build")
buf = io.StringIO()
with contextlib.redirect_stderr(buf):
    import model  # noqa: F401  (imported for its import-time gates and its paths)

for line in buf.getvalue().split("\n"):
    if line.startswith("[model] "):
        print("NOTICE\t" + line[len("[model] "):])

# The one corpus whose absence has a single unambiguous consequence, asked of the module rather
# than typed here (KAIZEN.md `kaizen-a-computed-value-is-never-typed-twice`). Both count gates
# read it and neither can verify anything without it, so the census can predict exactly what
# those two must have said, and a disagreement means one of the two is lying.
print("CORPUS\tsyllabus\t" + ("present" if model.SYLLABUS_DIR.is_dir() else "absent"))
# And the second thing a gate's answer is a function of, issue 196. With the corpus absent the
# two count gates say `recorded` when this file is there and usable and `unverified` when it is
# not, so the census can predict those two answers off two facts instead of one and refuses a
# gate whose answer does not follow from them. The reading is reported as usable or not rather
# than merely present, because a file that is there and malformed produces the same `unverified`
# as no file at all on the corpus-present path and must not be read as evidence either way.
_rec = model.RECORDED_READING
print("CORPUS\treading\t" + ("absent" if _rec is None else
                             "unusable" if _rec["problem"] else "present"))
PY
}

# The reader, kept apart from the reading so the self-test can drive it with inputs this machine
# does not have. It takes the lines above on stdin and the intended notice count in the
# environment, and it answers in three states of its own: 0 every gate looked, 3 at least one
# did not, 2 the census cannot be trusted to say which.
#
# THE SCRIPT IS AN ARGUMENT AND NOT A HEREDOC, and that is not a style choice. `python3 - <<PY`
# takes the program on stdin, so a reader written that way reads the tail of its own source
# instead of the pipe, finds nothing, and reports that every gate has stopped speaking. It did
# exactly that once here, and it failed loudly because the notice count is a terminator; a
# census without one would have found no notices, seen no unverified gate among them, and said
# every gate looked.
census_report() {
  local script
  script="$(cat <<'PY'
import os
import re
import sys

roster = [g for g in os.environ["ZRIVE_GATES"].split("|") if g]
tokens_known = [t for t in os.environ["ZRIVE_TOKENS"].split("|") if t]
notices, corpus, state = {}, {}, {}
order = []
for raw in sys.stdin.read().split("\n"):
    parts = raw.split("\t")
    if parts[0] == "NOTICE" and len(parts) >= 2:
        text = parts[1]
        name = text.split(":", 1)[0].strip()
        if name in notices:
            continue
        notices[name] = text
        m = re.match(r"^\s*\[([a-z-]+)\]", text.split(":", 1)[1] if ":" in text else "")
        state[name] = m.group(1) if m else None
        order.append(name)
    elif parts[0] == "CORPUS" and len(parts) >= 3:
        corpus[parts[1]] = parts[2]


def abort(msg):
    print(f"::error::{msg}")
    sys.exit(2)


ROSTER_FIX = ("EXPECTED_MODEL_GATES in scripts/check_build.sh is the roster and it belongs in "
              "the same commit as the change to the gates.")

silent = [g for g in roster if g not in notices]
if silent:
    abort(f"these gate(s) printed no notice at all: {', '.join(silent)}. A gate that says "
          f"nothing has either gone quiet or been deleted, this file cannot tell those apart, "
          f"and under either reading it can no longer report on them. {ROSTER_FIX}")

strangers = [g for g in order if g not in roster]
if strangers:
    abort(f"build/model.py printed notice(s) from {', '.join(strangers)}, which this census does "
          f"not know how to read, so it cannot say whether they looked at anything. "
          f"{ROSTER_FIX}")

# Issue 196. A gate that does not say which state it is in is a gate this file cannot report on,
# and the answer is the same one silence gets: abort. The alternative is a default, and a default
# here would file every unlabelled gate as the state that costs nothing.
mute = [g for g in roster if state[g] is None]
if mute:
    abort(f"these gate(s) printed a notice with no state token: {', '.join(mute)}. Every gate "
          f"says [{']/['.join(tokens_known)}] as the first thing after its name, so that this "
          f"file reads a token rather than sniffing prose. MODEL_GATE_TOKENS in "
          f"scripts/check_build.sh is the vocabulary and it belongs in the same commit as the "
          f"change to the gates.")
unknown = sorted({state[g] for g in roster if state[g] not in tokens_known})
if unknown:
    abort(f"gate(s) reported the state(s) {', '.join(unknown)}, which this file does not know "
          f"how to read, so it cannot say what they establish. MODEL_GATE_TOKENS in "
          f"scripts/check_build.sh is the vocabulary and it belongs in the same commit as the "
          f"change to the gates.")

for name in ("syllabus", "reading"):
    if name not in corpus:
        abort(f"the census was handed no reading of the {name} corpus, so it cannot check its "
              f"own answer against anything; nothing here is evidence.")

# THE CROSS-CHECK, AND IT RUNS IN BOTH DIRECTIONS. A gate's state is a FUNCTION of two facts this
# census is handed independently: whether the syllabus corpus is on the machine, and whether a
# usable recorded reading is committed. So the census does not merely notice a contradiction, it
# computes what each of the two count gates MUST have said and refuses anything else. Those two
# are covered because their corpus has exactly one answer; the ontology gate is not, because it
# has a partial branch where half the corpus is present and a rule over one boolean cannot
# describe it.
present = corpus["syllabus"] == "present"
reading = corpus["reading"]
if present:
    # With the corpus here the gate read it either way. Which of the two it says depends on
    # whether the committed attestation is of these tables, which this census cannot know.
    allowed = ("verified", "stale-record") if reading == "present" else ("stale-record",)
elif reading == "present":
    allowed = ("recorded",)
else:
    # No corpus and no usable reading. build/model.py refuses outright when the reading is there
    # and unusable, so the only way this line is reached is with no reading at all.
    allowed = ("unverified",)
for name in ("syllabus totals", "module structure"):
    if name not in notices:
        continue
    if state[name] not in allowed:
        abort(f"the {name} gate reports [{state[name]}], and on a machine where the syllabus "
              f"corpus is {corpus['syllabus']} and the recorded reading is {reading} the only "
              f"state it could be in is [{'] or ['.join(allowed)}]. One of those readings is "
              f"wrong and the census will not pick.")

blind = [g for g in roster if state[g] == "unverified"]
stale = [g for g in roster if state[g] == "stale-record"]
recorded = [g for g in roster if state[g] == "recorded"]
MARK = {"verified": "looked", "recorded": "RECORDED", "stale-record": "STALE RECORD",
        "unverified": "UNVERIFIED"}
for name in roster:
    print(f"    [{MARK[state[name]]}] {notices[name]}")

# A DEFECT OUTRANKS AN INCOMPLETENESS, so this branch is first. The gate read its corpus and the
# committed attestation is of other tables, which means the next run on a machine WITHOUT the
# corpus will refuse the build outright. Catching it here, on the machine that can repair it, is
# the whole reason build/model.py does not raise on this state.
if stale:
    print()
    print(f"::error::{len(stale)} gate(s) read their corpus and the recorded reading in "
          f"build/corpus_reading.txt is of other tables")
    for name in stale:
        print(f"      ! {name}")
    print()
    print("    The tables in build/model.py are right: they were just held up against the corpus")
    print("    on this machine. The committed attestation is what is wrong, and a runner reading")
    print("    it will refuse the build rather than divide by numbers nothing checked. Run")
    print("    scripts/gen_corpus_reading.sh and commit the result in this same commit.")
    sys.exit(1)

if blind:
    print()
    print(f"::warning::{len(blind)} gate(s) could not look at the corpus they are about")
    for name in blind:
        print(f"      - {name}")
    print()
    print("    Nothing above is evidence about what those gates cover. Two of them are the only")
    print("    checks on the declared totals, and the totals are the denominator of every fraction")
    print("    the page draws.")
    sys.exit(3)

if recorded:
    print()
    print(f"    {len(recorded)} gate(s) had no corpus here and checked their tables against the")
    print("    reading recorded in build/corpus_reading.txt instead:")
    for name in recorded:
        print(f"      ~ {name}")
    print()
    print("    That is not the same claim as having read the corpus, and the difference is one")
    print("    thing: a corpus that moved after the recorded date. What it does establish is that")
    print("    these tables are the ones somebody held up against it, which is what no run on a")
    print("    machine without the corpus could say at all before issue 196.")
    sys.exit(0)

print(f"    all {len(roster)} gates named in the roster read their corpus, on this machine, "
      f"just now")
sys.exit(0)
PY
)"
  ZRIVE_GATES="${1:-$EXPECTED_MODEL_GATES}" ZRIVE_TOKENS="${2:-$MODEL_GATE_TOKENS}" \
    python3 -c "$script"
}

# THE TWO HALVES ARE ASKED SEPARATELY, and the first draft of this function did not do that. It
# ran `model_census_input | census_report` and read one `$?`. Under `pipefail` that is the
# pipeline's aggregate, so a producer that printed a full set of acceptable notices AND THEN
# exited non-zero gave a reader that answered 0 and a pipeline that answered 1, and the caller
# below, which branched only on 2, fell straight through to the clean verdict with no gate marked
# blind. That is this card's own defect committed by the instrument written to close it, and it
# was found by an outside reader and reproduced with a shim on PATH before it was believed.
#
# So the producer's status is captured on its own through a temporary file, the reader's status is
# captured on its own, and anything that is not one of the three states this function defines is
# an abort. There is no fall-through: 0, 3 and 2, and 2 covers everything else by construction.
run_census() {
  local raw out prc rrc
  CENSUS_UNVERIFIED=0
  CENSUS_NAMES=""
  CENSUS_RECORDED=0
  CENSUS_RECORDED_NAMES=""
  raw="$(mktemp)" || {
    echo "::error::no temporary file for the census, so it was not taken"
    return 2
  }
  model_census_input >"$raw" 2>/dev/null
  prc=$?
  if [ "$prc" -ne 0 ]; then
    rm -f "$raw"
    echo "::error::build/model.py could not be asked what its gates did (exit $prc). The census"
    echo "         was not taken, so this run cannot say which of its own gates were evidence."
    return 2
  fi
  out="$(census_report <"$raw")"
  rrc=$?
  rm -f "$raw"
  printf '%s\n' "$out"
  # Read off the same lines the reader printed, for both of the states that have names attached.
  # Issue 196: `~` is the recorded state and `-` is the blind one, and they are counted from the
  # output rather than passed some other way for the reason the blind list already was: the
  # verdict must quote what the reader printed, not a parallel account of it.
  CENSUS_RECORDED_NAMES="$(printf '%s\n' "$out" | sed -n 's/^      ~ //p')"
  CENSUS_RECORDED="$(printf '%s\n' "$CENSUS_RECORDED_NAMES" | grep -c . || true)"
  case "$rrc" in
    0) return 0 ;;
    1) return 1 ;;
    3)
      CENSUS_NAMES="$(printf '%s\n' "$out" | sed -n 's/^      - //p')"
      CENSUS_UNVERIFIED="$(printf '%s\n' "$CENSUS_NAMES" | grep -c .)"
      [ "$CENSUS_UNVERIFIED" -gt 0 ] && return 3
      echo "::error::the census answered 3 and named no gate, so the two halves of its own answer"
      echo "         disagree and neither is evidence."
      CENSUS_UNVERIFIED=0
      return 2
      ;;
    2) return 2 ;;
    *)
      echo "::error::the census reader exited $rrc, which is not one of the three states it"
      echo "         defines. Nothing here is evidence."
      return 2
      ;;
  esac
}

# ---------------------------------------------------------------------------------------------
# The verdict, which names the snapshot it is about.
# ---------------------------------------------------------------------------------------------
# A function rather than two echoes at the foot of the file, so the self-test can read the text
# that ships and can assert what it must NOT say. The old verdict was two lines of prose ending
# in "The committed drawing is the build's own output", printed unconditionally, and it was that
# sentence and not the comparison that issue 103 row B10 filed.
#
# AND A CALLER CANNOT ASK FOR "clean" AND GET IT WHILE SOMETHING DID NOT LOOK. Issue 168 R4(a).
# The upgrade from clean to incomplete happens HERE and not at the call site, so the way to print
# the word "clean" over a run with a blind gate is to delete this branch in front of a reader,
# rather than to forget a line at the foot of the file. Same shape as the baseline check above:
# the wrong sentence is unreachable, not merely undesired.
verdict() {  # clean|bad ; reads BASELINE_ORIGIN, CENSUS_UNVERIFIED and CENSUS_NAMES
  local how="$1" origin="${BASELINE_ORIGIN:-}"
  if [ -z "$origin" ]; then
    echo "ASSERTION FAILED: no baseline snapshot was established, so there is no verdict to give."
    return 2
  fi
  if [ "$how" = "clean" ] && [ "${CENSUS_UNVERIFIED:-0}" -ne 0 ]; then
    echo "VERDICT: INCOMPLETE. Everything this run could check was checked and nothing is wrong"
    echo "         with it. ${CENSUS_UNVERIFIED} gate(s) could not look at the corpus they are about:"
    printf '%s\n' "$CENSUS_NAMES" | sed 's/^/           /'
    echo "         The drawing $(baseline_phrase "$origin") is the build's own output"
    echo "         and the model it came from carries no repeated id, no dangling edge and no"
    echo "         self-loop. What was NOT established is anything those gates cover, and one of"
    echo "         them is the only check on the declared totals the whole page counts against."
    echo "         The one word this gate prints over a run where every gate looked is deliberately"
    echo "         nowhere in these lines, so a reader grepping the log for it finds nothing here."
    if [ "$origin" = "worktree" ]; then
      echo "         READ THAT SNAPSHOT NAME. These bytes were not read out of git, so nothing above"
      echo "         is a statement about what the repository holds or about what a commit"
      echo "         would carry."
    fi
    return 0
  fi
  if [ "$how" = "clean" ]; then
    echo "VERDICT: clean. The drawing $(baseline_phrase "$origin") is the build's own"
    echo "         output, the working tree agrees with it, and the model it came from carries no"
    echo "         repeated id, no dangling edge and no self-loop."
    # ISSUE 196, AND THE WORD `clean` IS EARNED HERE RATHER THAN ASSUMED. The doctrine this file
    # was rewritten around is that a check which could not run must never print that word. A gate
    # in the recorded state RAN: it held the tables against a reading a machine with the corpus
    # took, that comparison can fail, and there are plants in the self-test below proving it does.
    # What it did not do is open the corpus. So the word stands and the limit is printed under it,
    # in the same breath, every time.
    #
    # AND THE ALTERNATIVE WAS MEASURED RATHER THAN ARGUED. Folding this state into the INCOMPLETE
    # branch would make a CI run with a recorded reading indistinguishable from one where
    # build/corpus_reading.txt had been deleted: .github/workflows/build.yml treats 3 as an
    # expected outcome and does not fail the job on it, so a deletion would have been green and
    # silent, and the third state issue 168 built would have gone back to being the constant
    # background that made the original defect invisible. Two states that must be told apart are
    # not told apart by giving them one exit code.
    if [ "${CENSUS_RECORDED:-0}" -ne 0 ]; then
      echo
      echo "         AND READ THIS BEFORE QUOTING THE WORD ABOVE. ${CENSUS_RECORDED} gate(s) had no corpus"
      echo "         on this machine and checked their tables against the reading recorded in"
      echo "         build/corpus_reading.txt instead of against the corpus itself:"
      printf '%s\n' "$CENSUS_RECORDED_NAMES" | sed 's/^/           /'
      echo "         What that establishes is that these tables are the ones somebody held up"
      echo "         against the corpus on the recorded date. What it cannot establish is that the"
      echo "         corpus has not moved since. Every counts[*].total on the page comes out of"
      echo "         those tables, so the distinction is the denominator of every fraction drawn."
    fi
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
EXPECTED_PROBES=216
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

# Synthetic census input. Issue 168 R4(a): the census reads what build/model.py said about its
# own corpora, and the whole point of the finding is that the two interesting states are the ones
# a given machine cannot produce. A runner holds no vault and can never see the verified state; a
# development machine holds one and can never see the blind state. So the probes drive the reader
# rather than the reading, with lines it would have been handed, and both states are exercised
# everywhere. This is the same argument the ontology self-test makes for writing its own corpus.
#
# THE FIXTURE EMITS THE TOKEN AND NOT A DESCRIPTION OF IT, issue 196: a probe that hand-wrote the
# prose and let the fixture guess the token would be testing the fixture. A `-` for the token
# emits a notice with none at all, which is the state the reader must abort on.
census_fixture() {  # syllabus-state reading-state  gate-name:token ...
  local present="$1" reading="$2" spec name state; shift 2
  for spec in "$@"; do
    name="${spec%%:*}"; state="${spec#*:}"
    case "$state" in
      # No token at all, which is what a gate that stops saying what state it is in produces.
      -) printf 'NOTICE\t%s: a notice from a gate that never says which state it is in\n' \
                "$name" ;;
      # THE PROSE UNDER THE `recorded` TOKEN CARRIES THE WORD `unverified` ON PURPOSE. That is
      # what an honest sentence about this state says: the corpus was not read, so the tables are
      # unverified against it, and what was checked is the recording. The reader that this
      # repository shipped before issue 196 decided blindness by looking for exactly that word,
      # so this fixture is the regression: a reader that sniffs prose files the repair as the
      # defect, and the probe over this line answers 0 only if the token is what is read.
      recorded) printf 'NOTICE\t%s: [recorded] the corpus is not on this machine, so nothing was '\
're-read and these tables are unverified against the corpus itself; they are the recorded ones\n' \
                       "$name" ;;
      unverified) printf 'NOTICE\t%s: [unverified] the corpus is not on this machine, so it is '\
'unverified here.\n' "$name" ;;
      *) printf 'NOTICE\t%s: [%s] read again just now\n' "$name" "$state" ;;
    esac
  done
  printf 'CORPUS\tsyllabus\t%s\n' "$present"
  [ "$reading" = "none" ] || printf 'CORPUS\treading\t%s\n' "$reading"
}

census_case() {  # roster  syllabus-state reading-state  gate-name:token ...
  local roster="$1" present="$2" reading="$3"; shift 3
  census_fixture "$present" "$reading" "$@" | census_report "$roster"
  return "${PIPESTATUS[1]}"
}

# A copy of build/model.py that cannot find any corpus, so the two states a development machine
# can never reach are reachable in a probe. The three corpus paths are rewritten to a directory
# under the temporary tree rather than $HOME being moved, deliberately: moving $HOME also moves
# the name register's salt file, and the model would then abort for a reason that has nothing to
# do with this card while the probe recorded a refusal. scripts/ and site/ are symlinked because
# build/model.py reads the register and the stylesheet relative to its own parent's parent.
blind_model_copy() {  # dir  [sed-expression ...]
  local dir="$1"; shift
  mkdir -p "$dir/build" || return 1
  ln -sfn "$ROOT/scripts" "$dir/scripts" || return 1
  ln -sfn "$ROOT/site" "$dir/site" || return 1
  cp "$ROOT/build/corpus_reading.txt" "$dir/build/" 2>/dev/null || return 1
  sed -e "s#^SYLLABUS_DIR = pathlib.Path.home() / \".*\"#SYLLABUS_DIR = pathlib.Path(\"$dir/no-corpus\")#" \
      -e "s#^ONTOLOGY_DIR = pathlib.Path.home() / \".*\"#ONTOLOGY_DIR = pathlib.Path(\"$dir/no-corpus\")#" \
      -e "s#^ONTOLOGY_VAULT = pathlib.Path.home() / \".*\"#ONTOLOGY_VAULT = pathlib.Path(\"$dir/no-corpus\")#" \
      "$@" "$ROOT/build/model.py" > "$dir/build/model.py" || return 1
  grep -q '^SYLLABUS_DIR = pathlib.Path("' "$dir/build/model.py" || return 1
  grep -q '^ONTOLOGY_DIR = pathlib.Path("' "$dir/build/model.py" || return 1
  grep -q '^ONTOLOGY_VAULT = pathlib.Path("' "$dir/build/model.py" || return 1
  return 0
}

# Build that copy and say what it printed, or die the way it died. The stderr is what the probe
# reads, because the notice IS the gate's answer. Three entry points, because the three things a
# probe wants to doctor are the tables, the attestation, and whether there is an attestation.
blind_run() {  # dir
  ( cd "$1" && python3 -c 'import sys; sys.path.insert(0, "build"); import model' 2>&1 )
}

blind_build() {  # dir  [sed -e expr ...]   doctors the tables
  local d="$1"; shift
  rm -rf "$d"
  blind_model_copy "$d" "$@" || { echo "the blind copy could not be built"; return 9; }
  blind_run "$d"
}

blind_build_reading() {  # dir  sed-expr    doctors the attestation
  local d="$1" expr="$2"
  rm -rf "$d"
  blind_model_copy "$d" || { echo "the blind copy could not be built"; return 9; }
  sed -i "$expr" "$d/build/corpus_reading.txt" || return 9
  blind_run "$d"
}

blind_build_no_reading() {  # dir           takes the attestation away entirely
  local d="$1"
  rm -rf "$d"
  blind_model_copy "$d" || { echo "the blind copy could not be built"; return 9; }
  rm -f "$d/build/corpus_reading.txt" || return 9
  blind_run "$d"
}

# ---- and the other half of the plant: does the serialisation COVER the field? -----------------
# Codex, reviewing this card's design: "if the canonical serializer omits one denominator-bearing
# field, both generator and gate will agree while the page lies". A digest that ignores a column
# is a gate that cannot see that column, and it fails in the direction that costs nothing. So
# every field either attestation covers is mutated on its own and the digest must move, with a
# negative control mutating nothing that must report it did not.
#
# AND IT ANSWERS IN THREE STATES, WHICH THE FIRST DRAFT DID NOT AND WHICH COST IT ITS CONTROLS.
# Codex, reviewing this diff: the first version let an exception fall out, so an import that
# failed and a digest that did not move both exited 1, and the three negative controls, which are
# the probes that expect 1, went on printing OK over a model that would not load. That is a dead
# control inside the machinery written to prove nothing else is dead. 0 moved, 1 did not move,
# 3 the question could not be asked, and no probe expects 3.
# ---- the states only a machine holding the corpus can be in --------------------------------
# No runner is one and every doctored copy above is corpus-less, so these four cells of the state
# table have no end-to-end plant available anywhere the suite runs. They are driven through the
# two seams on recorded_verdict instead, over a reading this probe writes and a date it chooses,
# and the reading goes through the real loader on its way in so the parse is exercised too. The
# ageing hole Codex found lived in one of these cells and nothing could have reached it.
#
# It prints the token and exits 0, or prints the refusal and exits 1. Anything else is 3.
verdict_case() {  # dir  present|absent  sed-expr-over-the-reading  YYYY-MM-DD
  local d="$1" present="$2" expr="$3" today="$4"
  mkdir -p "$d" || return 3
  cp "$ROOT/build/corpus_reading.txt" "$d/reading.txt" || return 3
  [ -z "$expr" ] || sed -i "$expr" "$d/reading.txt" || return 3
  ZRIVE_READING="$d/reading.txt" ZRIVE_PRESENT="$present" ZRIVE_TODAY="$today" \
  python3 - <<'PY'
import contextlib
import datetime
import io
import os
import pathlib
import sys

sys.path.insert(0, "build")
# THE IMPORT'S OWN NOTICES ARE SWALLOWED AND THE PROBE'S ANSWER IS NOT. Every other gate in the
# module prints [verified] on its way past, and a probe asserting that this one did NOT print
# that token would otherwise read three other gates' notices and fail. It did exactly that once
# here, which is a probe failing for the wrong reason and is the same family as a probe passing
# for one.
buf = io.StringIO()
try:
    with contextlib.redirect_stderr(buf):
        import model  # noqa: E402
except BaseException as exc:  # noqa: BLE001
    print(f"the model would not import: {type(exc).__name__}: {exc}")
    sys.exit(3)
try:
    rec = model.load_recorded_reading(pathlib.Path(os.environ["ZRIVE_READING"]))
    token, why = model.recorded_verdict(
        "syllabus-totals", model.syllabus_totals_digest(),
        corpus_present=os.environ["ZRIVE_PRESENT"] == "present",
        reading=rec, today=datetime.date.fromisoformat(os.environ["ZRIVE_TODAY"]))
except SystemExit as exc:
    print(f"REFUSED {exc}")
    sys.exit(1)
except BaseException as exc:  # noqa: BLE001
    print(f"nothing was measured: {type(exc).__name__}: {exc}")
    sys.exit(3)
print(f"[{token}] {why}")
PY
}

digest_moves() {  # python-statement-over-`model`  digest-function-name
  ZRIVE_MUT="$1" ZRIVE_FN="$2" python3 - <<'PY'
import os
import sys

sys.path.insert(0, "build")
try:
    import model  # noqa: E402
except BaseException as exc:  # noqa: BLE001  (SystemExit is a BaseException and is the usual one)
    print(f"the model would not import, so nothing was measured: "
          f"{type(exc).__name__}: {exc}")
    sys.exit(3)
try:
    fn = getattr(model, os.environ["ZRIVE_FN"])
    before = fn()
    exec(os.environ["ZRIVE_MUT"])  # noqa: S102
    after = fn()
except BaseException as exc:  # noqa: BLE001
    print(f"the digest could not be taken on both sides of the change, so nothing was measured: "
          f"{type(exc).__name__}: {exc}")
    sys.exit(3)
sys.exit(0 if after != before else 1)
PY
}

# run_census with the producer replaced, which is the only way to drive the producer's own exit
# code: the real one imports build/model.py and cannot be made to fail on demand without lying to
# the rest of the run. The roster is one gate, so the substituted notices are a complete answer.
census_with_producer() {  # shell-fragment-that-prints-the-census-input
  local body="$1"
  model_census_input() { eval "$body"; }
  EXPECTED_MODEL_GATES='syllabus totals' run_census
  local rc=$?
  unset -f model_census_input
  return "$rc"
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

# A doctored copy of one of the generated documents, so the census probes never go near the tree.
# The mutation is one line of Python over `doc`, and the `window.GI=` / `;\n` wrapper is put back
# unchanged, because a probe that also changed the wrapper would be proving two things at once.
doctor_doc() {  # src dest python-statement-over-doc
  ZRIVE_SRC="$1" ZRIVE_DEST="$2" ZRIVE_MUT="$3" python3 - <<'PY'
import json
import os
import pathlib

src = pathlib.Path(os.environ["ZRIVE_SRC"]).read_text(encoding="utf-8")
i, j = src.find("{"), src.rfind("}")
doc = json.loads(src[i:j + 1])
exec(os.environ["ZRIVE_MUT"])  # noqa: S102
pathlib.Path(os.environ["ZRIVE_DEST"]).write_text(
    src[:i] + json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + src[j + 1:],
    encoding="utf-8")
PY
}

# The same, for the one hand written file the census reads. `old` must occur exactly once, so a
# probe cannot quietly edit nothing and then assert that nothing was refused.
doctor_text() {  # src dest old new
  ZRIVE_SRC="$1" ZRIVE_DEST="$2" ZRIVE_OLD="$3" ZRIVE_NEW="$4" python3 - <<'PY'
import os
import pathlib
import sys

src = pathlib.Path(os.environ["ZRIVE_SRC"]).read_text(encoding="utf-8")
old = os.environ["ZRIVE_OLD"]
if src.count(old) != 1:
    print(f"doctor_text: {old!r} occurs {src.count(old)} times, not once")
    sys.exit(1)
pathlib.Path(os.environ["ZRIVE_DEST"]).write_text(
    src.replace(old, os.environ["ZRIVE_NEW"]), encoding="utf-8")
PY
}

# A copy of the builder carrying one changed line, with the rest of the tree standing behind it.
# Issue 217. build/build_layout.py finds bands and model in its own directory and site/app.css in
# its parent's, and build/model.py resolves every path it holds through .resolve(), which follows
# a symlink back to the real file. So an overlay of symlinks with a single real file in it is the
# whole fixture: the mutated builder runs against the real bands, the real model, the real
# stylesheet and the real width table, and nothing under build/ is written to or moved.
#
# TWO THINGS ABOUT THE OVERLAY A LATER READER WILL WANT. `$ROOT/*` does not glob dotfiles, so
# `.git` and `.github` are not behind it; checked rather than assumed, neither build_layout.py nor
# model.py reads either. And `$d/site` is a symlink to the REAL site/, which is safe only while
# every caller passes `--out`: the builder's own default output directory is SITE, so a fixture
# run without it would write the mutated build straight into the tracked tree. check_widths_asked
# always passes `--out` at a temporary directory and is the only caller.
#
# AN EDIT THAT MATCHED NOTHING IS NOT A MUTATION, and that is why doctor_text's insistence on
# exactly one occurrence is load-bearing here rather than tidy. A probe whose search string had
# gone stale would copy the builder unchanged, the check would pass, and a probe asserting a
# refusal would read that pass as its own failure only by luck of the exit code. The fixture
# answers 9 for "I could not make the mutation", which no probe expects, so a stale probe goes
# red as a broken probe instead of silently testing nothing.
overlay_builder() {  # dir old new
  local d="$1" f base
  mkdir -p "$d/build" || return 1
  for f in "$ROOT"/*; do
    base="$(basename "$f")"
    [ "$base" = build ] || ln -sfn "$f" "$d/$base" || return 1
  done
  for f in "$ROOT"/build/*; do
    base="$(basename "$f")"
    [ "$base" = build_layout.py ] || ln -sfn "$f" "$d/build/$base" || return 1
  done
  if [ -z "$2" ]; then
    cp "$ROOT/build/build_layout.py" "$d/build/build_layout.py" || return 1
  else
    doctor_text "$ROOT/build/build_layout.py" "$d/build/build_layout.py" "$2" "$3" || return 1
  fi
}

asked_with_mutation() {  # old new
  local d rc
  d="$(mktemp -d)" || return 9
  if ! overlay_builder "$d" "$1" "$2"; then
    rm -rf "$d"
    return 9
  fi
  check_widths_asked "$d/build/build_layout.py"
  rc=$?
  rm -rf "$d"
  return "$rc"
}

# The same fixture, driving the reserve check instead. Issue 220. Two callers of one overlay
# rather than one caller of two overlays, because the two checks fail on different things and a
# probe that could not say which of them had spoken would be worth less than either.
reserved_with_mutation() {  # old new
  local d rc
  d="$(mktemp -d)" || return 9
  if ! overlay_builder "$d" "$1" "$2"; then
    rm -rf "$d"
    return 9
  fi
  check_reserve_used "$d/build/build_layout.py"
  rc=$?
  rm -rf "$d"
  return "$rc"
}

# The builder laying out from one width table while the check judges it from another. A function
# because `probe` runs its argument as a command and `env` cannot run a shell function, and the
# variable is the one build_layout.py itself honours.
reserved_against_table() {  # table
  ZRIVE_LABEL_WIDTHS="$1" check_reserve_used
}

# A doctored copy of the width table. Issue 221, and the same fixture discipline as
# overlay_builder above: the mutation is one statement of Python over `doc`, the committed table
# is only ever read, and a statement that RAISES or that changes NOTHING answers 9, which no probe
# expects. An edit that matched nothing is not a mutation, and a probe asserting a refusal over
# one would be testing the fixture rather than the check.
widths_doctored() {  # dest python-statement-over-doc
  ZRIVE_SRC="$WIDTHS_DEFAULT" ZRIVE_DEST="$1" ZRIVE_MUT="$2" python3 - <<'PY'
import json
import os
import pathlib
import sys

doc = json.loads(pathlib.Path(os.environ["ZRIVE_SRC"]).read_text(encoding="utf-8"))
before = json.dumps(doc, sort_keys=True)
mut = os.environ["ZRIVE_MUT"]
try:
    exec(mut)  # noqa: S102
except Exception as exc:  # noqa: BLE001
    print(f"widths_doctored: the mutation raised {type(exc).__name__}: {exc}")
    sys.exit(9)
if mut and json.dumps(doc, sort_keys=True) == before:
    print("widths_doctored: the mutation changed nothing, so it is a stale probe and not an edit")
    sys.exit(9)
pathlib.Path(os.environ["ZRIVE_DEST"]).write_text(json.dumps(doc, ensure_ascii=False),
                                                  encoding="utf-8")
PY
}

sane_with_mutation() {  # python-statement-over-doc
  local f rc
  f="$(mktemp)" || return 9
  if ! widths_doctored "$f" "$1"; then
    rm -f "$f"
    return 9
  fi
  check_widths_sane "$f"
  rc=$?
  rm -f "$f"
  return "$rc"
}

# build/measure_labels.py's --check driven WITHOUT A BROWSER, over two documents this fixture
# writes. Issue 221, and it is the only way the four states that check separates can be probed at
# all on a runner: three of the four need a measurement, a measurement needs Chrome, and no
# workflow here has one. check(new, old) takes both sides as plain dicts and opens nothing, so the
# committed table stands in for both, the mutation moves one side or the other, and the exit code
# under test is the real one. What this cannot exercise is the browser itself, and the two states
# that need no browser at all, no table and no Chrome, are probed separately below.
widths_check_state() {  # python-statement-over-`new`-and-`old`
  ZRIVE_ROOT="$ROOT" ZRIVE_TABLE="$WIDTHS_DEFAULT" ZRIVE_MUT="$1" python3 - <<'PY'
import copy
import json
import os
import pathlib
import sys

root = pathlib.Path(os.environ["ZRIVE_ROOT"])
sys.path.insert(0, str(root / "build"))
import measure_labels as ml  # noqa: E402

old = json.loads(pathlib.Path(os.environ["ZRIVE_TABLE"]).read_text(encoding="utf-8"))
new = copy.deepcopy(old)
before = json.dumps([new, old], sort_keys=True)
mut = os.environ["ZRIVE_MUT"]
try:
    exec(mut)  # noqa: S102
except Exception as exc:  # noqa: BLE001
    print(f"widths_check_state: the mutation raised {type(exc).__name__}: {exc}")
    sys.exit(9)
if mut and json.dumps([new, old], sort_keys=True) == before:
    print("widths_check_state: the mutation changed nothing, so it is a stale probe")
    sys.exit(9)
sys.exit(ml.check(new, old))
PY
}

# The two refusals that need no measurement, and they are the ones a caller reads as an exit code.
# Both were `sys.exit("...")` before this card, which is exit 1, which is what the old --check
# returned for "the table differs". A machine with no browser reported drift.
measure_check_without_table() {
  ZRIVE_LABEL_WIDTHS="$1" python3 "$ROOT/build/measure_labels.py" --check
}

# $PATH is emptied and the Playwright cache pointed at an empty directory, because on the author's
# machine both are populated and a probe that only unset $ZRIVE_CHROME would find a browser and
# measure for real. python3 is named by its absolute path for the same reason: with $PATH gone the
# shell could not find it either.
measure_check_without_browser() {
  local py
  py="$(command -v python3)" || return 9
  env -u ZRIVE_CHROME PATH=/nonexistent PLAYWRIGHT_BROWSERS_PATH="$1" \
      "$py" "$ROOT/build/measure_labels.py" --check
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
  echo "self-test: the faces the builder asks that table for"
  # Issue 217. Every case below is ONE TOKEN of one argument at one call site in
  # build/build_layout.py, run against the real bands, the real model, the real stylesheet and
  # the real table through an overlay of symlinks. All six were traced through the code, and the
  # first four were green under every gate this repository ran before this section existed.
  #
  # THE CONTROLS COME FIRST AND THERE ARE TWO OF THEM, because this suite is proving that a
  # refusal came from the mutation. The unchanged copy proves the fixture is not what makes the
  # mutants red; the edit that matches nothing proves the fixture cannot quietly test nothing.
  probe 0 "the builder as it stands asks for the faces the page paints in" \
        check_widths_asked
  probe 0 "control: the same builder copied through the fixture unchanged still passes" \
        asked_with_mutation '' ''
  probe 9 "control: an edit matching no line was a broken probe rather than a refusal" \
        asked_with_mutation 'text_w(what_nobody_wrote)' 'text_w(x)'

  # #203's harm from the build side. Both terms of the reserve become the regular width, the
  # stylesheet goes on painting a selected label bold, and no painted byte and no measured width
  # changes. What changes is that two committed contexts stop being asked for at all.
  probe 1 "reserving the regular width for a label the page paints bold was refused" \
        asked_with_mutation 'max(text_w(ln, FONT, 600, it) for ln in lines))' \
                            'max(text_w(ln, FONT, 400, it) for ln in lines))'
  probe_says "measured, committed and never asked for" \
        "and the refusal named the contexts that had stopped being asked for" \
        asked_with_mutation 'max(text_w(ln, FONT, 600, it) for ln in lines))' \
                            'max(text_w(ln, FONT, 400, it) for ln in lines))'
  # The same call site one step subtler, and the case the count of contexts cannot see: the bold
  # width is still asked for, so both contexts stay populated, but only for the first line of a
  # label that takes two.
  probe 1 "reserving the bold width of only the first line of a wrapped label was refused" \
        asked_with_mutation 'max(text_w(ln, FONT, 600, it) for ln in lines))' \
                            'text_w(lines[0], FONT, 600, it))'

  probe 1 "reserving a ghost's italic chip from the upright row was refused" \
        asked_with_mutation 'text_w(e["v"], 9.0, 400, e["ghost"])' \
                            'text_w(e["v"], 9.0, 400, False)'
  # A weight the stylesheet paints nowhere. The key names a context that does not exist, every
  # mark falls through to the hand written estimate, and build/build_layout.py says so on stderr
  # and exits 0.
  probe 1 "asking for a mark at a weight nothing declares was refused" \
        asked_with_mutation 'text_w(n["mark"], 9.0)' 'text_w(n["mark"], 9.0, 600)'
  probe_says "missed the width table" "and the refusal said the lookups had fallen back" \
        asked_with_mutation 'text_w(n["mark"], 9.0)' 'text_w(n["mark"], 9.0, 600)'
  probe 1 "measuring a band caption without the uppercase the stylesheet adds was refused" \
        asked_with_mutation 'text_w(line, 9.0, 600, False, True)' \
                            'text_w(line, 9.0, 600, False)'
  # The fifth, which the card does not list and which none of the four directions above would
  # catch on its own: the tail shares its context with the verbs and the marks, so dropping it
  # empties no context and strays into none. It is caught by the population, which is read off
  # the documents the builder just wrote rather than off its arguments.
  probe 1 "a tail the drawings paint and nothing measures was refused" \
        asked_with_mutation 'n["lw"] = max(n["lw"], text_w(n["tail"], 9.0))' 'pass'
  probe_says "never measured at all" "and the refusal said the painted string went unmeasured" \
        asked_with_mutation 'n["lw"] = max(n["lw"], text_w(n["tail"], 9.0))' 'pass'
  # And the population pin itself, proved armed rather than asserted. A census over one drawing
  # satisfies every containment above; the count is what separates that from a census over
  # fourteen, so it is shown to refuse a number the run does not produce.
  probe 1 "a run laying out other than the intended number of drawings was refused" \
        check_widths_asked "" 15
  probe_says "EXPECTED_DRAWINGS" "and the refusal named the constant a fifteenth would change" \
        check_widths_asked "" 15
  # AND THE PATHS THAT SAY "I COULD NOT LOOK", which were written and unproved. Each of them is
  # the state this repository has shipped seventeen instruments unable to tell from a clean one.
  probe 1 "a builder that is not there was refused rather than reported clean" \
        check_widths_asked "$dir/no-such-build_layout.py"
  probe_says "nothing here is evidence" "and said so in those words" \
        check_widths_asked "$dir/no-such-build_layout.py"
  probe 1 "a builder that refuses to build was refused rather than reported clean" \
        asked_with_mutation 'if _inst["views"][0]["key"] != "ZIB":' \
                            'if _inst["views"][0]["key"] != "NOT-A-VIEW-KEY":'
  # `_errors.append(...)` to `pass` and not a rename of the list, deliberately: a rename crashes
  # the builder and would prove the refusal above a second time instead of this one. This leaves
  # a builder that runs, lays out all fourteen drawings and writes both documents, and simply
  # stops saying what it asked the table for.
  probe 1 "a builder that stopped recording what it looked up was refused" \
        asked_with_mutation '_errors.append((tbl[s] - est, ctx, s, est, tbl[s]))' 'pass'
  probe_says "looked at nothing and will not call it clean" \
        "and refused to read a census of nothing as a census with no mismatches" \
        asked_with_mutation '_errors.append((tbl[s] - est, ctx, s, est, tbl[s]))' 'pass'

  echo
  echo "self-test: the answer that table gave back"
  # Issue 220, and the same fixture as the section above: the real bands, the real model, the
  # real stylesheet and the real table behind an overlay of symlinks, with one line of the
  # builder changed. Two controls first, for the same reason they come first there.
  probe 0 "the builder as it stands reserves the width its own table gives it" \
        check_reserve_used
  probe 0 "control: the same builder copied through the fixture unchanged still passes" \
        reserved_with_mutation '' ''
  probe 9 "control: an edit matching no line was a broken probe rather than a refusal" \
        reserved_with_mutation 'text_w(what_nobody_wrote)' 'text_w(x)'

  # THE CARD'S OWN MUTATION. One token, and before this section every other gate was green over
  # it: check 3's census is unchanged in shape because both faces are still asked for, check 1
  # passes in the only workflow a builder edit has, and the lane gate goes QUIETER rather than
  # louder because a smaller reserve makes lane_slack() larger. Measured here: 454 of the 570
  # nodes reserve a box narrower than the face a click paints them in, by up to 30.70px.
  probe 1 "the regular width reserved for a label the page paints bold was refused" \
        reserved_with_mutation \
          'return max(max(text_w(ln, FONT, 400, it) for ln in lines),' \
          'return min(max(text_w(ln, FONT, 400, it) for ln in lines),'
  probe_says "narrower than the widest face" \
        "and the refusal said the box was narrower than the face a click paints the label in" \
        reserved_with_mutation \
          'return max(max(text_w(ln, FONT, 400, it) for ln in lines),' \
          'return min(max(text_w(ln, FONT, 400, it) for ln in lines),'
  probe_says "lane_slack()" \
        "and named the gate that is structurally unable to report it" \
        reserved_with_mutation \
          'return max(max(text_w(ln, FONT, 400, it) for ln in lines),' \
          'return min(max(text_w(ln, FONT, 400, it) for ln in lines),'

  # The same call site one step subtler and the one check 3 also catches, kept because the two
  # catch it for different reasons: there it is a context that stopped being populated, here it
  # is 38 boxes that are up to 7.92px short of a line they paint.
  probe 1 "reserving the bold width of only the first line of a wrapped label was refused" \
        reserved_with_mutation 'max(text_w(ln, FONT, 600, it) for ln in lines))' \
                               'text_w(lines[0], FONT, 600, it))'
  # AND A SECOND MUTATION OF THE ARITHMETIC THAT CHECK 3 CANNOT SEE AT ALL. The mark is still
  # looked up, in the context the table declares for it, so every one of check 3's five
  # assertions is satisfied; what changes is that the widening becomes a narrowing and 201 nodes
  # collapse to the width of their mark, by up to 167.48px.
  probe 1 "the mark widening turned into a narrowing was refused" \
        reserved_with_mutation 'n["lw"] = max(n["lw"], text_w(n["mark"], 9.0))' \
                               'n["lw"] = min(n["lw"], text_w(n["mark"], 9.0))'

  # AND THE THIRD ASSERTION, WHICH IS THE ONE AN ADVERSARIAL READ OF THE FIRST DRAFT ASKED FOR.
  # build/build_layout.py:611 is the only line where the reserve becomes a coordinate. Both edits
  # below leave every reserve correct and every earlier assertion satisfied, and the first of them
  # was GREEN under this check until the builder started recording the box as well as the number
  # it was built from.
  probe 1 "a chip placer blocked with a box narrower than its own label was refused" \
        reserved_with_mutation 'n["lw"] + 6, lab_h + 2))' 'n["lw"] - 24, lab_h + 2))'
  probe_says "not their own reserve plus the 6 unit pad" \
        "and the refusal named the pad the box is supposed to carry" \
        reserved_with_mutation 'n["lw"] + 6, lab_h + 2))' 'n["lw"] - 24, lab_h + 2))'
  # And the floor of that assertion, which is the pad itself: dropping it entirely is six units on
  # every one of the 570 boxes and is refused, so the smallest thing it can see is one unit.
  probe 1 "a chip placer blocked with the label and no pad at all was refused" \
        reserved_with_mutation 'n["lw"] + 6, lab_h + 2))' 'n["lw"] + 0, lab_h + 2))'

  # BOTH DIRECTIONS OF THE COMPARISON, PROVED ON A PLANT IN THE READING. There is no mutation of
  # the builder that over reserves and still builds: the tightest label already has 0.0px of lane
  # to spare, so anything wider is refused by the lane gate before this check is reached. One
  # entry out of 570 is moved by a hundredth of a unit, which is also where the floor of this
  # instrument is: the clean corpus agrees exactly, at 0.00px in both directions.
  probe 1 "a reserve a hundredth of a unit short of what the table measured was refused" \
        check_reserve_used "" "" -0.01
  probe 1 "a reserve a hundredth of a unit wider than any string it paints was refused" \
        check_reserve_used "" "" 0.01
  probe_says "wider than any string they paint" \
        "and the refusal said the extra width was for nothing the node draws" \
        check_reserve_used "" "" 0.01

  # The population pin, and the three ways this check could enumerate nothing and print clean.
  probe 1 "a run laying out other than the intended number of drawings was refused" \
        check_reserve_used "" 15
  probe_says "EXPECTED_DRAWINGS" "and the refusal named the constant a fifteenth would change" \
        check_reserve_used "" 15
  probe 1 "a builder that is not there was refused rather than reported clean" \
        check_reserve_used "$dir/no-such-build_layout.py"
  probe_says "nothing here is evidence" "and said so in those words" \
        check_reserve_used "$dir/no-such-build_layout.py"
  # `_reserved.append(...)` to `pass`, which leaves a builder that runs, lays out all fourteen
  # drawings, writes both documents byte for byte as before and simply stops saying what it
  # reserved. That is the shape of the seventeen instruments this repository has found unable to
  # tell "I looked and found nothing" from "I could not look".
  probe 1 "a builder that stopped recording what it reserved was refused" \
        reserved_with_mutation '_reserved.append((tag, nid, n["lw"]))' 'pass'
  probe_says "looked at nothing and will not call it clean" \
        "and refused to read a record of nothing as a run with nothing to disagree about" \
        reserved_with_mutation '_reserved.append((tag, nid, n["lw"]))' 'pass'
  # And the harder half of the same thing, which a non-empty test cannot catch: a record that
  # covers some of the nodes. 363 of 570 recorded, and every one of the 363 agrees.
  probe 1 "a record covering only some of the nodes drawn was refused" \
        reserved_with_mutation '_reserved.append((tag, nid, n["lw"]))' \
                               'if not n.get("mark"): _reserved.append((tag, nid, n["lw"]))'
  probe_says "painted, not recorded" \
        "and the refusal named the nodes it would otherwise have passed over in silence" \
        reserved_with_mutation '_reserved.append((tag, nid, n["lw"]))' \
                               'if not n.get("mark"): _reserved.append((tag, nid, n["lw"]))'
  # THE SAME LOOP'S SECOND PASS, over the other list. The population is asserted for each record
  # against the documents rather than for the two records against each other, and this is the
  # probe that proves the second half of that loop runs at all.
  probe 1 "a chip placer box recorded for only some of the nodes drawn was refused" \
        reserved_with_mutation '_blocked_lab.append((tag, nid, blocked[-1][2]))' \
                               'if not n.get("mark"): _blocked_lab.append((tag, nid, blocked[-1][2]))'
  # And the state in which the two sides of the comparison are not about the same numbers at all.
  # `$bad` is the doctored table the width section above built, one string short; the builder
  # honours ZRIVE_LABEL_WIDTHS and this check does not, so the run would be judged against a table
  # that did not produce it and every disagreement would be reported as arithmetic.
  probe 1 "a builder laying out from a different width table than this check reads was refused" \
        reserved_against_table "$bad"
  probe_says "cannot be one expectation" \
        "and the refusal said the two tables cannot be one expectation" \
        reserved_against_table "$bad"

  echo
  echo "self-test: the numbers in that table"
  # Issue 221. Every mutation below is a hand edit somebody could make to build/label_widths.json,
  # and every one of them was green under every gate this repository ran before this section
  # existed: the build reproduces, the coverage holds, the arguments are unchanged and the reserve
  # agrees, because all four read the same doctored number the builder read.
  #
  # THE CONTROLS COME FIRST AND THERE ARE TWO, for the reason they come first in the two sections
  # above. The committed table proves the check does not refuse everything; the copy through the
  # fixture proves the fixture is not what makes the mutants red; and the third case proves the
  # fixture cannot quietly test nothing, because a mutation that raises or that changes not one
  # byte answers 9, which no probe below expects.
  probe 0 "the committed table satisfies every relation a shaped string has to" \
        check_widths_sane
  probe 0 "control: the same table copied through the fixture unchanged still passes" \
        sane_with_mutation ''
  probe 9 "control: a mutation that changed nothing was a broken probe rather than a refusal" \
        sane_with_mutation 'doc["widths"]["10/400"]["Beca"] = doc["widths"]["10/400"]["Beca"]'

  probe 1 "a width of zero, which no browser returns for a string with ink in it" \
        sane_with_mutation 'doc["widths"]["10/400"]["Beca"] = 0'
  probe_says "not a positive finite number" "and the refusal said what a width has to be" \
        sane_with_mutation 'doc["widths"]["10/400"]["Beca"] = 0'
  # #221's own second example, and #206 records why a containment test cannot see it: both
  # contexts stay fully populated and every string keeps a number, so coverage, arguments and
  # reserve are all unmoved. What moves is that the italic ghosts are now reserved at the selected
  # width when at rest and the regular width when clicked.
  probe 1 "the italic pair exchanged wholesale, so the heavier face is the narrower one" \
        sane_with_mutation 'doc["widths"]["10/400i"], doc["widths"]["10/600i"] = doc["widths"]["10/600i"], doc["widths"]["10/400i"]'
  probe_says "NARROWER at the heavier weight" "and the refusal said which way round it is" \
        sane_with_mutation 'doc["widths"]["10/400i"], doc["widths"]["10/600i"] = doc["widths"]["10/600i"], doc["widths"]["10/400i"]'
  probe 1 "a run measured narrower than a contiguous sub-run of itself" \
        sane_with_mutation 'd = doc["widths"]["10/400"]; s = sorted(x for x in d if len(x.split()) > 1 and x.split()[0] in d)[0]; d[s] = d[s.split()[0]] - 0.01'
  probe_says "narrower than a sub-run of themselves" "and the refusal named the relation" \
        sane_with_mutation 'd = doc["widths"]["10/400"]; s = sorted(x for x in d if len(x.split()) > 1 and x.split()[0] in d)[0]; d[s] = d[s.split()[0]] - 0.01'
  # #221's first example, and the one relation that catches it. A uniform halving preserves every
  # ordering R2 and R3 read, and leaves every per-string ratio inside [0.35, 2.60]: measured, the
  # halved context runs from 0.5050 to 0.5752. Only the median of the whole context moves, to 0.5462.
  probe 1 "every entry in one context halved, which every ordering above survives" \
        sane_with_mutation 'doc["widths"]["9/400"] = {k: round(v / 2, 2) for k, v in doc["widths"]["9/400"].items()}'
  probe_says "on the MEDIAN of the whole context" \
        "and the refusal said it was the context and not one string" \
        sane_with_mutation 'doc["widths"]["9/400"] = {k: round(v / 2, 2) for k, v in doc["widths"]["9/400"].items()}'
  # And the other half of R4, which the median cannot see: one number, grossly wrong, in a context
  # of five, where the median does not move at all.
  probe 1 "one width nowhere near what the hand written estimate says the string takes" \
        sane_with_mutation 'doc["widths"]["9/400i"]["reverses"] = 0.5'
  probe_says "times the hand written estimate" "and the refusal named the model it was held against" \
        sane_with_mutation 'doc["widths"]["9/400i"]["reverses"] = 0.5'

  # THE HALF THAT NEEDS NO NUMBER AT ALL: the table records what it was measured under, and the
  # stylesheet is committed too, so a table nobody re-measured after a styling change is catchable
  # on a runner with no browser and no font of the author's.
  probe 1 "a table measured under a font stack site/app.css no longer declares" \
        sane_with_mutation 'doc["font_stack"] = "Comic Sans MS, sans-serif"'
  probe_says "declares the font stack" "and the refusal quoted both stacks" \
        sane_with_mutation 'doc["font_stack"] = "Comic Sans MS, sans-serif"'
  probe 1 "a table whose face count disagrees with its own probe row" \
        sane_with_mutation 'doc["distinct_faces"] = 3'
  probe 1 "a table measured over fewer families than this tree asks for" \
        sane_with_mutation 'doc["envelope"] = doc["envelope"][:-1]'
  probe 1 "a context measured at a size the stylesheet does not paint it at" \
        sane_with_mutation 'doc["contexts"]["10/400"]["css"]["font-size"] = "11px"'
  probe 1 "a context whose CSS the file no longer records at all" \
        sane_with_mutation 'del doc["contexts"]["10/400"]'
  # AND THE OTHER DIRECTION, which is the whole subject of this card: a change that is NOT a
  # defect must not be refused. The note beside each context is prose written in collect(), and a
  # gate that demanded a browser run to clear a reworded comment is a gate a reader learns to
  # route around.
  probe 0 "a reworded note beside a context is not a defect and is not refused" \
        sane_with_mutation 'doc["contexts"]["10/400"]["note"] = "reworded by hand, measuring nothing"'

  # The ways this check could look at nothing and print clean.
  probe 1 "a table holding no widths aborted instead of finding every relation satisfied" \
        sane_with_mutation 'doc["widths"] = {}'
  probe 1 "an unreadable table aborted instead of reporting clean" \
        check_widths_sane "$dir/not-a-file.json"
  probe 1 "no builder to read estimate_w() out of was refused rather than skipped" \
        check_widths_sane "" "$dir/no-such-build_layout.py"
  probe_says "Nothing here is evidence" "and said so in those words" \
        check_widths_sane "" "$dir/no-such-build_layout.py"
  # A relation that enumerates nothing reports no violations. Both of the relations that compare
  # PAIRS can be emptied without emptying the table, and both refuse rather than pass.
  # Both heavier contexts, because renaming one leaves the other pair populated and the guard
  # would not fire: measured, the first draft of this probe emptied 10/600 alone, R2 went on
  # comparing the four strings the two italic contexts share, and the probe failed as a probe.
  # R4 also refuses this table, over the four short strings the rename lengthens; the assertion
  # under test is the sentence R2 prints, not the exit code, which both would produce.
  probe 1 "two weights of one face sharing no string, so R2 compared nothing" \
        sane_with_mutation 'doc["widths"]["10/600"] = {"zz" + k: v for k, v in doc["widths"]["10/600"].items()}; doc["widths"]["10/600i"] = {"zz" + k: v for k, v in doc["widths"]["10/600i"].items()}'
  probe_says "is never narrower compared nothing" "and the refusal said the relation held vacuously" \
        sane_with_mutation 'doc["widths"]["10/600"] = {"zz" + k: v for k, v in doc["widths"]["10/600"].items()}; doc["widths"]["10/600i"] = {"zz" + k: v for k, v in doc["widths"]["10/600i"].items()}'
  probe 1 "a table of single words only, so R3 compared nothing" \
        sane_with_mutation 'doc["widths"] = {c: {s: w for s, w in d.items() if len(s.split()) == 1} for c, d in doc["widths"].items()}'
  probe_says "sub-run relation compared nothing" "and the refusal said which relation went empty" \
        sane_with_mutation 'doc["widths"] = {c: {s: w for s, w in d.items() if len(s.split()) == 1} for c, d in doc["widths"].items()}'

  echo
  echo "self-test: and the re-measurement tells its four states apart"
  # Issue 221, over build/measure_labels.py's check(), driven with two documents and no browser.
  # The old --check was `old == text` over the whole rendered file and had ONE failing state for
  # all of these; measured on the author's machine it exited 1 over three surplus rows with zero
  # value changes and zero missing, which is a red for a state check 2 has already ruled is not a
  # defect. Every probe below fails against that body.
  probe 0 "control: two identical documents agree" \
        widths_check_state ''
  probe 9 "control: a mutation that changed nothing was a broken probe rather than a state" \
        widths_check_state 'new["engine"] = new["engine"]'
  # THE STATE NOTHING IN THIS REPOSITORY CATCHES, and the only reason the card exists.
  probe 1 "a value that differs on the same envelope is a defect" \
        widths_check_state 'new["widths"]["10/400"]["Beca"] = 99.0'
  probe_says "on an envelope this machine measured identically" \
        "and the finding said the envelope agreed, so it is not a machine difference" \
        widths_check_state 'new["widths"]["10/400"]["Beca"] = 99.0'
  probe 1 "a string the job asks for that the table lacks is a defect on any machine" \
        widths_check_state 'del old["widths"]["10/400"]["Beca"]'
  probe_says "does not hold 1 string" "and the finding counted them" \
        widths_check_state 'del old["widths"]["10/400"]["Beca"]'
  # THE ROW THE OLD --check DIED ON. Three of these exist in the committed table today.
  probe 0 "a row the table holds that no context asks for is reported and is not a failure" \
        widths_check_state 'del new["widths"]["10/400"]["Beca"]'
  probe_says "asked for by nothing" "and the report counted it under its own heading" \
        widths_check_state 'del new["widths"]["10/400"]["Beca"]'
  # THE STATE A RUNNER IS ALWAYS IN, and the reason this cannot be a CI gate.
  probe 3 "a different envelope is neither agreement nor a defect" \
        widths_check_state 'new["probes"]["DejaVu Sans"] = 131.4'
  probe_says "THE ENVELOPE DIFFERS" "and the report said so before any number" \
        widths_check_state 'new["probes"]["DejaVu Sans"] = 131.4'
  probe_says_not "reproduce exactly" "and did not report the values as reproducing" \
        widths_check_state 'new["probes"]["DejaVu Sans"] = 131.4'
  # AND THE TWO CROSS CASES, which are the whole point of separating the states rather than
  # adding them up: membership is judged on any machine, values only on a matching envelope.
  probe 1 "a missing string is still a defect on a machine with a different envelope" \
        widths_check_state 'new["probes"]["DejaVu Sans"] = 131.4; del old["widths"]["10/400"]["Beca"]'
  probe 3 "a value that differs on a DIFFERENT envelope is not reported as a defect" \
        widths_check_state 'new["probes"]["DejaVu Sans"] = 131.4; new["widths"]["10/400"]["Beca"] = 99.0'
  probe_says_not "written by hand" \
        "and the report did not accuse a machine of hand editing for holding other fonts" \
        widths_check_state 'new["probes"]["DejaVu Sans"] = 131.4; new["widths"]["10/400"]["Beca"] = 99.0'
  probe 1 "a table measured under CSS the stylesheet no longer declares is a defect" \
        widths_check_state 'new["contexts"]["10/400"]["css"]["font-size"] = "11px"'
  # Two more things that must NOT be defects, and the second is the third way the old byte diff
  # went red: the document it compared carries the engine's user-agent string.
  probe 0 "a reworded note beside a context is not a defect" \
        widths_check_state 'new["contexts"]["10/400"]["note"] = "reworded by hand"'
  probe 0 "a browser upgrade on its own, with every value unmoved, is not a defect" \
        widths_check_state 'new["engine"] = "HeadlessChrome/999.0.0.0"'
  # And a comparison that enumerated nothing, from either side.
  probe 2 "a measurement of nothing established nothing rather than agreeing with everything" \
        widths_check_state 'new["widths"] = {}'
  probe 2 "a table holding nothing established nothing rather than lacking nothing" \
        widths_check_state 'old["widths"] = {}'
  # THE TWO REFUSALS A CALLER READS AS AN EXIT CODE, and both were exit 1 before this card, which
  # is the code --check used for "the table differs". They are run through the real program rather
  # than through check() because the code they return is the program's.
  probe 2 "no table to compare against established nothing, in either direction" \
        measure_check_without_table "$dir/no-such-table.json"
  probe_says "established nothing" "and said so rather than naming a difference" \
        measure_check_without_table "$dir/no-such-table.json"
  probe_says_not "DIFFER" "and did not report drift over a file it never read" \
        measure_check_without_table "$dir/no-such-table.json"
  mkdir -p "$dir/no-browsers"
  probe 2 "no browser at all established nothing rather than reporting drift" \
        measure_check_without_browser "$dir/no-browsers"
  probe_says "no Chrome found" "and the refusal named what it could not find" \
        measure_check_without_browser "$dir/no-browsers"
  probe_says_not "reproduce exactly" "and did not report agreement over a measurement it never took" \
        measure_check_without_browser "$dir/no-browsers"

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
  echo "self-test: the digest census"
  # Issue 116. EVERY PROBE IN THIS BLOCK MISSES AGAINST THE BODY THIS FILE HAD BEFORE THE CARD,
  # and two of them miss against the BUILDER this repository had before it as well: the census
  # did not exist, and the type registry was not in the preimage, so "a glyph changed and no
  # digest moved" was the shipped behaviour rather than a refusal.
  local gi gl gr dgi dgl dgr
  gi="$dir/instance.js"; gl="$dir/layout.js"; gr="$dir/render.js"
  dgi="$dir/doctored-instance.js"; dgl="$dir/doctored-layout.js"; dgr="$dir/doctored-render.js"
  cp site/instance.js "$gi"; cp site/layout.js "$gl"; cp site/render.js "$gr"

  probe 0 "the shipped documents were reported clean" \
        check_digests "$gi" "$gl" "$gr"

  # The terminator, row F7. The population every other assertion walks comes out of the document,
  # so all of them are true of thirteen drawings.
  doctor_doc "$gl" "$dgl" 'doc["collapsed"].pop()'
  probe 1 "a document one drawing short was refused rather than counted clean" \
        check_digests "$gi" "$dgl" "$gr"
  probe_says "intends 14" "the refusal said how many drawings it intends to check" \
        check_digests "$gi" "$dgl" "$gr"
  probe_says "EXPECTED_DRAWINGS" "and named the constant a real fifteenth drawing would change" \
        check_digests "$gi" "$dgl" "$gr"

  doctor_doc "$gl" "$dgl" \
    'doc["views"][1]["drawing"]["drawingDigest"] = doc["views"][0]["drawing"]["drawingDigest"]'
  probe 1 "two drawings carrying one digest were refused" \
        check_digests "$gi" "$dgl" "$gr"

  doctor_doc "$gl" "$dgl" 'del doc["views"][0]["drawing"]["drawingDigest"]'
  probe 1 "a drawing with no digest at all was refused" \
        check_digests "$gi" "$dgl" "$gr"

  doctor_doc "$gl" "$dgl" 'doc["views"][0]["drawing"]["drawingDigest"] = "0000000"'
  probe 1 "a digest that is not the one those bytes produce was refused" \
        check_digests "$gi" "$dgl" "$gr"
  probe_says "$BUILDER" "the refusal said to run the builder" \
        check_digests "$gi" "$dgl" "$gr"

  doctor_doc "$gl" "$dgl" 'doc["views"][0]["drawing"]["drawingDigest"] = "not hex"'
  probe 1 "a malformed digest was refused rather than compared" \
        check_digests "$gi" "$dgl" "$gr"

  doctor_doc "$gl" "$dgl" 'doc["documentDigest"] = "0000000"'
  probe 1 "a documentDigest that is not the one the instance document produces was refused" \
        check_digests "$gi" "$dgl" "$gr"

  doctor_doc "$gl" "$dgl" 'del doc["glyphDigest"]'
  probe 1 "a layout carrying no glyphDigest was refused" \
        check_digests "$gi" "$dgl" "$gr"

  # Row F4, and the proof is the audit's own: one stroke moved in the glyph table, both generated
  # documents untouched. Before this card that repainted ninety one tiles and every gate in the
  # repository said clean.
  doctor_text "$gr" "$dgr" "'M3 8h10'" "'M3 9h10'"
  probe 1 "a stroke edited in the glyph table with the fingerprint left alone was refused" \
        check_digests "$gi" "$gl" "$dgr"
  probe_says "glyph table" "the refusal named the symbol table and not just a file" \
        check_digests "$gi" "$gl" "$dgr"

  # Row F3, the card's headline, at the seam it actually came through: the type registry changed
  # and no drawing digest moved. This probe passes clean against the pre-card builder.
  doctor_doc "$gi" "$dgi" \
    'doc["types"] = [dict(t, glyph="coin") if t["k"] == "SessionTemplate" else t
                     for t in doc["types"]]'
  probe 1 "a type registry repainted with every drawing digest left alone was refused" \
        check_digests "$dgi" "$gl" "$gr"

  # A glyph name the renderer has no strokes for. It is refused before any digest is recomputed,
  # because the page would throw on the first tile that reached it and a digest mismatch is the
  # less useful of the two things to be told.
  doctor_doc "$gi" "$dgi" \
    'doc["types"] = [dict(t, glyph="nosuchsymbol") if t["k"] == "SessionTemplate" else t
                     for t in doc["types"]]'
  probe_says "cannot draw" "a tile bound to a symbol the renderer lacks was named" \
        check_digests "$dgi" "$gl" "$gr"

  # And the two aborts. A census that cannot read its inputs has nothing to say, and saying it
  # with exit 2 is what keeps "I could not look" out of the same bucket as "I looked and it is
  # wrong".
  printf 'nothing here\n' >"$dgr"
  probe 2 "a renderer with no glyph table aborted instead of reporting every digest clean" \
        check_digests "$gi" "$gl" "$dgr"
  probe 2 "a missing document aborted instead of reporting clean" \
        check_digests "$dir/not-a-file.js" "$gl" "$gr"

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

  echo
  echo "self-test: the census separates a gate that looked from one that could not"
  local BOTH='syllabus totals|module structure'
  local ONE='syllabus totals'
  probe 0 "every gate on the roster having looked answers 0" \
        census_case "$BOTH" present present \
        'syllabus totals:verified' 'module structure:verified'
  probe 3 "both count gates declining answers 3, which is neither clean nor a defect" \
        census_case "$BOTH" absent absent \
        'syllabus totals:unverified' 'module structure:unverified'
  probe_says "UNVERIFIED" "and the declining gates are marked, not listed alongside the rest" \
        census_case "$BOTH" absent absent \
        'syllabus totals:unverified' 'module structure:unverified'
  probe 2 "a gate on the roster that printed no notice at all aborted the census" \
        census_case "$BOTH" present present 'syllabus totals:verified'
  probe 2 "a gate the roster does not name aborted the census" \
        census_case "$ONE" present present 'syllabus totals:verified' 'a new gate:verified'
  probe 2 "a gate declining beside a corpus that IS on the machine aborted the census" \
        census_case "$ONE" present present 'syllabus totals:unverified'
  probe 2 "a gate reporting verified beside a corpus that is NOT aborted the census" \
        census_case "$ONE" absent absent 'syllabus totals:verified'

  echo
  echo "self-test: the census reads a state token and refuses to guess one"
  # Issue 196. The reader used to decide whether a gate was blind by looking for the word
  # `unverified` inside its prose, which was sound while there were two states and cannot survive
  # a third: every honest sentence about the recorded state contains that word.
  probe 2 "a gate whose notice carries no state token at all aborted the census" \
        census_case "$ONE" present present 'syllabus totals:-'
  probe 2 "a gate reporting a state this file does not know aborted the census" \
        census_case "$ONE" present present 'syllabus totals:half-looked'
  probe 2 "a census handed no reading of whether a recorded reading exists aborted" \
        census_case "$ONE" present none 'syllabus totals:verified'
  probe 0 "a recorded gate whose own prose carries the word unverified is not filed as blind" \
        census_case "$ONE" absent present 'syllabus totals:recorded'
  probe_says_not "UNVERIFIED" "and it is not marked as one either" \
        census_case "$ONE" absent present 'syllabus totals:recorded'

  echo
  echo "self-test: the census computes what each count gate MUST have said, off two facts"
  # Both directions and every cell. A gate's state is a function of whether the corpus is on the
  # machine and whether a usable recorded reading is committed, so the census does not merely
  # notice a contradiction: it works out the only answer that follows and refuses anything else.
  probe 0 "no corpus and a usable reading: the gate says recorded, and that is not a defect" \
        census_case "$ONE" absent present 'syllabus totals:recorded'
  probe 2 "no corpus, a usable reading, and a gate that says it could not look at all" \
        census_case "$ONE" absent present 'syllabus totals:unverified'
  probe 2 "no corpus, NO reading, and a gate claiming it checked a recorded one" \
        census_case "$ONE" absent absent 'syllabus totals:recorded'
  probe 2 "the corpus here, no reading committed, and a gate not saying the record is missing" \
        census_case "$ONE" present absent 'syllabus totals:verified'
  probe 1 "control: the corpus here and no reading committed is the stale-record state, and \
that state is a defect rather than an abort" \
        census_case "$ONE" present absent 'syllabus totals:stale-record'
  probe 2 "a reading that is there and unusable is not a reading a gate may report against" \
        census_case "$ONE" absent unusable 'syllabus totals:recorded'

  echo
  echo "self-test: a stale attestation is a defect and not an incompleteness"
  # It has its own exit code because it is its own thing: the tables were read against the corpus
  # on this machine and the tracked file records other tables, so the next run on a machine
  # WITHOUT the corpus refuses the build outright. This one fails on the machine that can fix it.
  probe 1 "a gate that read its corpus beside a record of other tables answers 1" \
        census_case "$ONE" present present 'syllabus totals:stale-record'
  probe_says "STALE RECORD" "and it is marked as that and not as a gate that merely looked" \
        census_case "$ONE" present present 'syllabus totals:stale-record'
  probe_says_not "could not look" "a stale record is not reported as a gate that could not look" \
        census_case "$ONE" present present 'syllabus totals:stale-record'
  probe 1 "and a stale record outranks a blind gate, so a run with both is the defect" \
        census_case 'syllabus totals|ontology registry' absent absent \
        'syllabus totals:unverified' 'ontology registry:stale-record'

  echo
  echo "self-test: a run with a gate that could not look does not print the word clean"
  # Row R4(a) of the audit in one probe, and the negative control under it. The measured defect
  # was a verdict reading "VERDICT: clean" over a run in which the sole check on the declared
  # totals had returned without counting anything.
  BASELINE_ORIGIN=index
  CENSUS_UNVERIFIED=2
  CENSUS_NAMES="$(printf 'syllabus totals\nmodule structure\n')"
  probe_says_not "clean" "a verdict over a run with two blind gates does not print the word at all" \
        verdict clean
  probe_says "INCOMPLETE" "it says INCOMPLETE in that word" verdict clean
  probe_says "syllabus totals" "and it names the gate that could not look" verdict clean
  CENSUS_UNVERIFIED=0
  CENSUS_NAMES=""
  probe_says "VERDICT: clean" "and with every gate having looked the clean verdict is back" \
        verdict clean
  # The census's own three states, driven through run_census with a producer that prints a full
  # set of good notices and then fails. Issue 168, found by an outside reader: the first draft
  # read one exit code off a pipeline under `pipefail`, so this exact case answered 1, fell past a
  # branch that tested only 2, and reached the clean verdict with no gate marked blind.
  probe 2 "a census producer that printed good notices and then failed is an abort, not a pass" \
        census_with_producer 'printf "NOTICE\tsyllabus totals: [verified] read again just now\n"; \
                              printf "CORPUS\tsyllabus\tpresent\n"; \
                              printf "CORPUS\treading\tpresent\n"; return 1'
  probe 0 "control: the same notices from a producer that succeeded are a clean census" \
        census_with_producer 'printf "NOTICE\tsyllabus totals: [verified] read again just now\n"; \
                              printf "CORPUS\tsyllabus\tpresent\n"; \
                              printf "CORPUS\treading\tpresent\n"'
  BASELINE_ORIGIN=""

  echo
  echo "self-test: the recorded state is clean AND the verdict says what it did not establish"
  # Issue 196, and this is the pair the whole verdict decision rests on. The word `clean` is
  # earned, because the gate ran a check that can fail and did not fail; and it can never be read
  # on its own, because the paragraph naming the limit is printed by the same branch.
  BASELINE_ORIGIN=index
  CENSUS_UNVERIFIED=0
  CENSUS_NAMES=""
  CENSUS_RECORDED=2
  CENSUS_RECORDED_NAMES="$(printf 'syllabus totals\nmodule structure\n')"
  probe_says "VERDICT: clean" "a run whose gates checked a recorded reading is clean" verdict clean
  probe_says "build/corpus_reading.txt" "and it names the file they checked against" verdict clean
  probe_says "syllabus totals" "and it names each gate that did not open its corpus" verdict clean
  probe_says "corpus has not moved" "and it names the one thing it did not establish" verdict clean
  CENSUS_RECORDED=0
  CENSUS_RECORDED_NAMES=""
  probe_says_not "corpus_reading" "and with every gate having read its corpus that paragraph is gone" \
        verdict clean
  BASELINE_ORIGIN=""

  echo
  echo "self-test: the attestation covers every field it is supposed to, one field at a time"
  # Against a copy that can find no corpus, and built once. The tables are the repository's own
  # either way; what the copy saves is a walk of the vault per probe on the one machine that has
  # one, which is twenty five seconds of a suite that has to be cheap enough to be run.
  local tb="$dir/tables"
  blind_model_copy "$tb" || echo "  [FAIL] the copy the coverage probes run against"
  probe 0 "a session total moved moves the syllabus-totals digest" \
        in_dir "$tb" digest_moves 'model.SYLLABUS_SESSIONS["ZIB"] += 1' syllabus_totals_digest
  probe 1 "negative control: nothing moved leaves it exactly where it was" \
        in_dir "$tb" digest_moves 'pass' syllabus_totals_digest
  probe 0 "a module's session count moved moves the module-structure digest" \
        in_dir "$tb" digest_moves \
        'k = sorted(model.SYLLABUS_MODULES)[0]
t = list(model.SYLLABUS_MODULES[k]); c, n, s = t[0]; t[0] = (c, n, s + 1)
model.SYLLABUS_MODULES[k] = tuple(t)' module_structure_digest
  probe 0 "a module renamed moves it too" \
        in_dir "$tb" digest_moves \
        'k = sorted(model.SYLLABUS_MODULES)[0]
t = list(model.SYLLABUS_MODULES[k]); c, n, s = t[0]; t[0] = (c, n + " (renamed)", s)
model.SYLLABUS_MODULES[k] = tuple(t)' module_structure_digest
  probe 0 "a drawn row claiming another sequence in the syllabus moves it" \
        in_dir "$tb" digest_moves \
        'k = sorted(model.SYLLABUS_ROWS)[0]; sid = sorted(model.SYLLABUS_ROWS[k])[0]
c, q = model.SYLLABUS_ROWS[k][sid]; model.SYLLABUS_ROWS[k][sid] = (c, q + 1)' \
        module_structure_digest
  probe 0 "a drawn row claiming another module moves it" \
        in_dir "$tb" digest_moves \
        'k = sorted(model.SYLLABUS_ROWS)[0]; sid = sorted(model.SYLLABUS_ROWS[k])[0]
c, q = model.SYLLABUS_ROWS[k][sid]
model.SYLLABUS_ROWS[k][sid] = (None if c else "M99", q)' module_structure_digest
  probe 1 "negative control: the module tables untouched leave that digest where it was" \
        in_dir "$tb" digest_moves 'pass' module_structure_digest
  probe 0 "a route's citation edited moves the ontology-citations digest" \
        in_dir "$tb" digest_moves \
        'cid = sorted(model.ROUTES)[0]
model.ROUTES[cid]["source"] = model.ROUTES[cid]["source"] + ", one more locator"' \
        ontology_citation_digest
  probe 0 "the declared size of the ontology moves it" \
        in_dir "$tb" digest_moves 'model.ONTOLOGY_ENTITIES += 1' ontology_citation_digest
  probe 1 "negative control: the citations untouched leave that digest where it was" \
        in_dir "$tb" digest_moves 'pass' ontology_citation_digest
  # AND THE CONTROL OVER THE CONTROLS. Three probes above expect exit 1, and a harness that
  # answered 1 when it could not run at all would let all three pass over a model that does not
  # load. This one asks for a digest function that is not there and requires the answer to be
  # "could not measure" rather than "did not move".
  probe 3 "a coverage probe that could not take a digest says so instead of saying unmoved" \
        in_dir "$tb" digest_moves 'pass' no_such_digest_function

  echo
  echo "self-test: a build with no corpus, which is every CI run, over a doctored table"
  # THE PLANT THIS CARD IS FOR, end to end and not in parts. A copy of build/model.py whose three
  # corpus paths point at nothing is the machine every runner is; the probes below are what it
  # does with a table somebody edited without holding it up against the corpus. Before this card
  # every one of them printed one line to stderr and built the document.
  local bd="$dir/blind"
  probe 0 "control: with the corpus gone and the attestation current, the build stands" \
        blind_build "$bd"
  probe_says "[recorded]" "and it says so in that word rather than reporting a verified read" \
        blind_build "$bd"
  probe 1 "a session total edited with no corpus to check it against refuses the build" \
        blind_build "$bd" -e 's/"ZIB": 79/"ZIB": 80/'
  probe_says "denominator" "and it says what the number it refused is used for" \
        blind_build "$bd" -e 's/"ZIB": 79/"ZIB": 80/'
  probe 1 "a module's session count edited the same way refuses it" \
        blind_build "$bd" -e 's/("M01", "External Courses", 2)/("M01", "External Courses", 3)/'
  probe 1 "a route citation edited the same way refuses it" \
        blind_build "$bd" -e 's/^ONTOLOGY_ENTITIES = 55$/ONTOLOGY_ENTITIES = 56/'
  probe 1 "an attestation that has aged out is refused rather than gone on being quoted" \
        blind_build "$bd" -e 's/^AGING_DAYS = 240$/AGING_DAYS = -1/'
  probe 0 "with the attestation deleted the build stands and the gate says it looked at nothing" \
        blind_build_no_reading "$bd"
  probe_says "[unverified]" "in that word, which is the state this repository was in before" \
        blind_build_no_reading "$bd"

  echo
  echo "self-test: the four cells only a machine holding the corpus reaches"
  # Codex, reviewing this diff, found the second of these: the ageing refusal was written into
  # the no-corpus path alone, so a machine holding the corpus reported [verified] over an
  # attestation every runner would refuse, and the one machine that could regenerate the file was
  # the one machine never told. A committed artefact no runner will accept is a defect wherever
  # it is noticed.
  local vc="$dir/verdict"
  probe_says "[verified]" "corpus here, attestation current: the gate is simply verified" \
        in_dir "$tb" verdict_case "$vc" present '' 2026-08-16
  probe_says "[stale-record]" "corpus here, attestation past the ageing window: stale, not verified" \
        in_dir "$tb" verdict_case "$vc" present '' 2030-01-01
  probe_says "[stale-record]" "corpus here, attestation of other tables: stale" \
        in_dir "$tb" verdict_case "$vc" present 's/^\(reading syllabus-totals *\)./\1a/' 2026-08-16
  probe_says_not "[verified]" "and none of those three stale states can print the good token" \
        in_dir "$tb" verdict_case "$vc" present '' 2030-01-01
  probe 1 "no corpus and an attestation past the window: refused outright" \
        in_dir "$tb" verdict_case "$vc" absent '' 2030-01-01
  probe 0 "control: no corpus and a current attestation is not refused" \
        in_dir "$tb" verdict_case "$vc" absent '' 2026-08-16
  probe_says "[recorded]" "and it is the recorded state, naming the date it is quoting" \
        in_dir "$tb" verdict_case "$vc" absent '' 2026-08-16

  echo
  echo "self-test: and the attestation itself is refused when it cannot be evidence"
  # From the other side. Above, the tables move under a fixed attestation; here the attestation
  # moves under fixed tables, and every one of these is a hand-edit somebody could make to
  # build/corpus_reading.txt to buy a green run.
  probe 1 "a digest edited by hand no longer answers for the tables it is filed under" \
        blind_build_reading "$bd" 's/^\(reading syllabus-totals *\)./\1a/'
  probe 1 "a reading dated in the future, which would buy itself immunity from the ageing rule" \
        blind_build_reading "$bd" 's/^read_on .*/read_on 2099-01-01/'
  probe 1 "a reading dated before the day the sources say their corpora were read" \
        blind_build_reading "$bd" 's/^read_on .*/read_on 2020-01-01/'
  probe 1 "a reading in a schema this build does not know how to read" \
        blind_build_reading "$bd" 's/^schema 1$/schema 7/'
  probe 1 "a reading with one of the three digests taken out of it" \
        blind_build_reading "$bd" '/^reading module-structure/d'
  probe 1 "a reading carrying a line in none of the three forms it has" \
        blind_build_reading "$bd" 's/^schema 1$/schema 1\nwhatever i felt like typing/'

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
echo "== and the builder asks it for the faces the page paints in"
check_widths_asked || bad=1

echo
echo "== and the width it got back is the width it reserved"
check_reserve_used || bad=1

echo
echo "== and the numbers in it are numbers a browser could have produced"
check_widths_sane || bad=1

echo
echo "== the model is a graph a drawing can be made of"
check_structure_live || bad=1

echo
echo "== and the gate that says so refuses the graphs it names"
check_structure_armed || bad=1

echo
echo "== the fourteen drawings each carry the digest these bytes produce"
# The working tree copies, which check_reproducible above has already proved are the index
# copies and are what the builder writes. Reading them here rather than the rebuild's own output
# is deliberate: this is the census of the documents that ship.
check_digests site/instance.js site/layout.js site/render.js
rc=$?
if [ "$rc" -eq 2 ]; then
  echo
  echo "ABORTED: the digest census could not read the documents it is about."
  exit 2
fi
[ "$rc" -eq 0 ] || bad=1

echo
echo "== and the gates that re-read a corpus say whether they read one"
# LAST, AND NOT FIRST. Everything above it is a statement this file makes about bytes it read;
# this is the statement it makes about what it did not read, and it is put where the reader's eye
# already is, one line above the verdict that quotes it. The three notices exist either way and
# used to land two hundred lines earlier, under a heading about something else.
run_census
census_rc=$?
if [ "$census_rc" -eq 2 ]; then
  echo
  echo "ABORTED: the census of what could look could not be taken, so this run cannot say which"
  echo "         of its own gates were evidence. Nothing here is."
  exit 2
fi
# Issue 196. The census now has a defect of its own to report, and it is not an incompleteness: a
# gate read its corpus and the tracked attestation is of other tables, so the next run on a
# machine without the corpus refuses the build. It fails this one, on the machine that can fix it.
[ "$census_rc" -ne 1 ] || bad=1

echo
if [ "$bad" -ne 0 ]; then
  verdict bad
  exit 1
fi
verdict clean
[ "$CENSUS_UNVERIFIED" -eq 0 ] || exit 3
exit 0
