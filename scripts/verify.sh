#!/usr/bin/env bash
# Everything a contributor has to run before pushing, in one place and in order.
#
# WHY THIS FILE EXISTS. Every check below already existed and every one of them was findable only
# by reading prose: the build command is in README.md's Regenerating section, the two gates and
# their self-tests are spread across README.md, TPS.md and four workflow files, the reproducibility
# argument is a sentence in README.md's Layout section, and the smoke suite is new. Reconstructing
# that list by hand is a step somebody skips, and the one they skip is the one that would have
# fired. One entrypoint, run everything, report everything.
#
# IT RUNS EVERY STEP. `set -e` is deliberately not used: a run that stops at the first failure
# hides the rest, and the rest is what tells you whether you broke one thing or five. Each step
# reports [OK], [FAIL] or [SKIP] and the exit code is non-zero if anything failed.
#
# [SKIP] IS NOT [OK], AND IS PRINTED DIFFERENTLY FOR THAT REASON. Two of these steps cannot run
# everywhere: build/safety_grep.py reads the faculty register out of the vault, and the
# deployed-bytes gate needs an origin to fetch. A skipped step is named in the summary with its
# reason, so a clean run that skipped two things cannot be read as a clean run that did nine.
#
# AND A SKIP THAT CAN MEAN AN ABORT IS A GREEN THAT CAN MEAN RED. Issue 103, and it is this
# file's own headline doctrine turned on itself. Every step here used to map exit 2 to [SKIP],
# on the reading that 2 means "I could not answer". It does, but it is ALSO how every gate in
# this repository reports a hard poka-yoke defect: no tracked files to scan, a name hash list
# holding no hashes, a palette table that does not match its own terminator, a malformed
# exemption table, a self-test that ran fewer probes than it intends, a smoke run whose browser
# never started. Proved with an empty register held outside the tree: the gate printed
# `ASSERTION FAILED: name hash list is empty`, this file printed
# `VERDICT: clean, with 2 step(s) that did not run`, and exited 0. A gate shouting that it
# scanned nothing was filed as a step that politely declined.
#
# So exit 2 is now a FAILURE by default, named as an abort rather than as an ordinary failure so
# the reader knows the difference. A step may decline only where THIS file has established the
# precondition cannot be met, and there are exactly two such places: the untracked check below,
# whose 2 is this file's own convention and not a gate's, and the token grep, where the register
# is looked for before the gate is run rather than after. The second one closes the composition
# nobody had joined: a vault that disappears once retired two model gates AND took this file's
# verdict with it, because both of them answered 2 and both of them read as a skip.
#
# Usage:
#   scripts/verify.sh                 everything that can run against this working tree
#   scripts/verify.sh <origin-url>    and also the deployed-bytes gate and the smoke suite
#                                     against that origin
#
# Env: SMOKE_CHROME / CHROME_PATH / CHROME_BIN   which browser the smoke suite drives

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ORIGIN="${1:-}"

STEP_NAMES=()
STEP_STATE=()
STEP_NOTE=()

# THE STEP NUMBERS ARE CHECKED, NOT TRUSTED. Issue 106 E4. The number a step prints is part of a
# string written by hand, and twice now a step inserted in the middle has left the numbers behind
# it wrong: at one point a section header numbered 8 introduced the function invoked as step 9,
# and the untracked-files message told the contributor to `git add` before trusting "steps 4 and
# 5" when the repository gate had moved to 5 and 6. Both were repaired only when somebody read
# them. This file's whole value is being the authoritative ordered list, so the ordering is now
# an assertion: the nth step registered here must begin with "n. ", and a renumbering that misses
# one aborts the run instead of printing a list whose numbers do not count.
#
# EVERY OTHER CROSS-REFERENCE IN THIS FILE NAMES A STEP BY WHAT IT DOES, and none of them by
# number, for the same reason. A description survives an insertion; a number does not, and there
# is nothing that can check prose.
assert_step_number() {  # name
  local n=$(( ${#STEP_NAMES[@]} + 1 ))
  case "$1" in
    "$n. "*) return 0 ;;
  esac
  echo
  echo "ASSERTION FAILED: this is step $n and it is registered as \"$1\"."
  echo "  The printed list is numbered by hand and this file will not print a list whose numbers"
  echo "  do not count. Renumber the step names, and sweep the prose that refers to them."
  exit 2
}

# Run a step, print its output under a banner, record its verdict.
#
# Exit 2 is a FAILURE and is named as one. A gate answering 2 has told you it did not scan what
# it was asked to scan, and the only reading of that which is safe to push on is "this run
# proved nothing here". It is recorded with its own note rather than as a plain failure, because
# "the gate refused the tree" and "the gate never read the tree" send a reader to different
# places.
step() {
  local name="$1"; shift
  assert_step_number "$name"
  echo
  echo "=============================================================================="
  echo "== $name"
  echo "=============================================================================="
  "$@"
  local rc=$?
  STEP_NAMES+=("$name")
  if [ "$rc" -eq 0 ]; then
    STEP_STATE+=("OK"); STEP_NOTE+=("")
    echo "-- [OK] $name"
  elif [ "$rc" -eq 2 ]; then
    STEP_STATE+=("FAIL")
    STEP_NOTE+=("exit 2: it ABORTED. It did not scan what it was asked to, so nothing here is evidence")
    echo "-- [FAIL] $name (exit 2: the gate aborted rather than answering. It scanned nothing.)"
  else
    STEP_STATE+=("FAIL"); STEP_NOTE+=("exit $rc")
    echo "-- [FAIL] $name (exit $rc)"
  fi
  return 0
}

# The one shape of step whose exit 2 is not a gate abort: this file's own convention, used where
# 2 means "the answer is incomplete and here is what it excludes". It takes the reason as an
# argument, so a reader of the summary is never left to guess which of the two meanings applied.
# Nothing outside this file may be run through it.
step_may_decline() {
  local name="$1" reason="$2"; shift 2
  assert_step_number "$name"
  echo
  echo "=============================================================================="
  echo "== $name"
  echo "=============================================================================="
  "$@"
  local rc=$?
  STEP_NAMES+=("$name")
  if [ "$rc" -eq 0 ]; then
    STEP_STATE+=("OK"); STEP_NOTE+=("")
    echo "-- [OK] $name"
  elif [ "$rc" -eq 2 ]; then
    STEP_STATE+=("SKIP"); STEP_NOTE+=("$reason")
    echo "-- [SKIP] $name ($reason)"
  else
    STEP_STATE+=("FAIL"); STEP_NOTE+=("exit $rc")
    echo "-- [FAIL] $name (exit $rc)"
  fi
  return 0
}

skip() {
  assert_step_number "$1"
  STEP_NAMES+=("$1"); STEP_STATE+=("SKIP"); STEP_NOTE+=("$2")
  echo
  echo "=============================================================================="
  echo "== $1"
  echo "=============================================================================="
  echo "-- [SKIP] $2"
}

# ---------------------------------------------------------------------------------------------
# Syntax. Every shipped script parses.
# ---------------------------------------------------------------------------------------------
# The cheapest check there is, and the one that catches the class of defect that costs the most:
# site/ has no build step, so a syntax error in a shipped file is not caught by anything until the
# page is opened, where it shows up as a page that draws nothing. This repository has shipped a
# blank page once already, for a different reason
# (HANSEI.md `2026-08-09-screenshot-before-javascript`).
check_syntax() {
  local bad=0 f
  for f in site/*.js scripts/*.mjs; do
    if node --check "$f" 2>/tmp/zmt-syntax.$$; then
      printf '  [OK]   %s\n' "$f"
    else
      printf '  [FAIL] %s\n' "$f"; sed 's/^/         /' /tmp/zmt-syntax.$$; bad=1
    fi
  done
  rm -f /tmp/zmt-syntax.$$
  return $bad
}

# ---------------------------------------------------------------------------------------------
# What the repository gate cannot see.
# ---------------------------------------------------------------------------------------------
# scripts/check_repo.sh takes its file list from `git ls-files`, so a file that has never been
# added is not scanned, and the gate reports clean on a tree that contains it. That is correct and
# it is also the shape of a trap: a new file is exactly the file most likely to carry something,
# and the run a person makes just before committing it is the run that cannot see it.
#
# Bought here. This card's own scripts/smoke.mjs was written, verified against a clean gate run,
# committed and pushed, and the gate went red on the first run that could see it, on six decimal
# measurements in a comment that the money rule reads as grouped figures. Not an exposure, since
# scripts/ is not deployed and the figures were pixel counts, and entirely avoidable: the gate had
# said clean about a set of files that did not include the one being written.
#
# So this reports [SKIP] rather than [OK] when anything is untracked, and names the files. A
# skipped step is loud in the summary and an OK is not, which is the difference that matters:
# the gate's answer is incomplete and the reader has to know which files it excludes.
check_untracked() {
  local untracked
  untracked="$(git ls-files --others --exclude-standard)"
  if [ -z "$untracked" ]; then
    echo "  nothing untracked: the repository gate's file list is the whole working tree"
    return 0
  fi
  echo "  the repository gate reads \`git ls-files\`, so it will not scan these:"
  printf '%s\n' "$untracked" | sed 's/^/    /'
  echo
  echo "  \`git add\` them before trusting a clean verdict from the two repository gate steps"
  echo "  below, or accept that the verdict is about the rest of the tree."
  echo "  verdict is about the rest of the tree."
  return 2
}

# ---------------------------------------------------------------------------------------------
# The build gate, which is scripts/check_build.sh and is no longer a copy of it.
# ---------------------------------------------------------------------------------------------
# ONE RULE, ONE IMPLEMENTATION. Issue 103. This file used to carry its own copy-and-compare of
# the build, a `check_layout_reproducible` that saved both generated documents, ran the builder
# and diffed. It has been deleted, and the steps below run scripts/check_build.sh itself.
#
# The copy was not equivalent and the difference was in the direction that matters. It never
# deleted the generated files first, which is exactly the poka-yoke check_build.sh's header
# argues for: a builder that silently wrote nothing was indistinguishable from one that wrote
# the same bytes. Proved with the builder replaced by a script that printed one line and exited
# 0, on which this file printed "the drawing is a pure function of the model" and [OK] while
# check_build.sh on the same tree printed
# "::error::build/build_layout.py exited 0 and wrote no site/instance.js". It also ran neither
# the width table coverage check nor the structure gate, so nothing a contributor ran locally
# said the model was one a drawing can be made of.
#
# check_build.sh was called by .github/workflows/build.yml and by nothing else in the tree, which
# means the gate this file recommends running before pushing was the one gate this file did not
# run. Two copies of one rule is the drift class issue 106 is about, and the second copy here was
# the weaker one.
#
# The second of the two steps is the half check_build.sh's own header asks for by name. Running
# the gate exercises the LIVE structure gate, because running the gate runs the builder and the
# builder calls it; what this file did not do was prove the gate fires. One line, and it is
# below.

# ---------------------------------------------------------------------------------------------
# The local token grep.
# ---------------------------------------------------------------------------------------------
# build/safety_grep.py reads the faculty register straight out of the vault, which is what lets it
# look for real names in plaintext where the two CI gates hold salted hashes. The path is asked of
# the module rather than written here: a value that lives in one file must not be typed into a
# second (KAIZEN.md `kaizen-a-computed-value-is-never-typed-twice`).
#
# IT NEEDS THE VAULT, AND THAT IS ESTABLISHED BEFORE THE GATE IS RUN AND NOT AFTER. Issue 103.
# safety_grep.py answers 2 in two situations that are not the same situation: the register is not
# on this machine, which is a legitimate decline, and it was handed nothing to scan, which is the
# gate calling its own input a lie. One exit code cannot separate them, so this file separates
# them from outside: register_present() below asks whether the register exists at all, and only
# if it does is the gate run, under the strict step where an exit 2 is a failure. If it does not,
# the gate is not run and the step is recorded as skipped by THIS file, with the reason.
register_present() {
  python3 - <<'PY' 2>/dev/null
import pathlib, sys
sys.path.insert(0, "build")
import safety_grep
p = pathlib.Path(safety_grep.FACULTY)
sys.exit(0 if p.is_dir() and any(p.glob("*.md")) else 1)
PY
}

check_token_grep() {
  local faculty
  faculty="$(python3 -c 'import sys; sys.path.insert(0, "build"); import safety_grep; print(safety_grep.FACULTY)' 2>/dev/null)"
  echo "  register: ${faculty:-unknown}"
  python3 build/safety_grep.py site 2>&1 | tail -12 | sed 's/^/  /'
  return "${PIPESTATUS[0]}"
}

# ---------------------------------------------------------------------------------------------
# The run
# ---------------------------------------------------------------------------------------------
echo "verify: $ROOT"
echo "node:   $(node --version 2>/dev/null || echo 'not found')"
echo "python: $(python3 --version 2>/dev/null || echo 'not found')"
[ -n "$ORIGIN" ] && echo "origin: $ORIGIN"

step "1. every shipped script parses"                     check_syntax

step_may_decline "2. nothing is untracked, so the gates see everything" \
     "some files are untracked and the repository gate cannot see them; its two steps are about the rest of the tree" \
     check_untracked

step "3. the build gate: both documents rebuild, the widths cover, the model is well formed" \
     bash scripts/check_build.sh
step "4. prove the build gate fires"                      bash scripts/check_build.sh --self-test
# The provenance gate runs inside build/build_layout.py on every build, so the build gate step
# above already exercises it against the real document. This is the other half of the TPS rule: a gate that
# has never been seen to refuse is not a gate, so one synthetic document per rule, each one a
# document that PASSES with a single field changed. Issue 73.
step "5. prove the provenance gate fires"                 python3 build/model.py --provenance-self-test
step "6. prove the repository gate fires"                 bash scripts/check_repo.sh --self-test
step "7. repository gate, over every tracked file"        bash scripts/check_repo.sh
step "8. prove the deployed-bytes gate fires"             bash scripts/check_forbidden.sh --self-test

if [ -n "$ORIGIN" ]; then
  step "9. deployed-bytes gate, against $ORIGIN"          bash scripts/check_forbidden.sh "$ORIGIN"
else
  skip "9. deployed-bytes gate, against the origin" \
       "no origin given. It fetches the published files over HTTP and has nothing to read without one; pass a url to run it. It runs in CI after every deploy, in pages.yml."
fi

# The populate registry, read back out of the bytes the page loads. Issue 72 wrote the registry
# and scripts/routes.py to read it, and issue 103 found that nothing ran the reader: not this
# file, not any of seven workflows. Its three failure conditions are the generated-but-never-
# verified class and nothing else in the tree tests them. It is wired in here and in build.yml.
step "10. the populate registry is complete and every drawn object binds to it" \
     python3 scripts/routes.py

if register_present; then
  step "11. the local token grep, against site/"          check_token_grep
else
  skip "11. the local token grep, against site/" \
       "the faculty register build/safety_grep.py reads is not on this machine, so the gate was not run. It is the local half of the safety machinery; the two CI gates hold salted hashes instead and are the half that does not need it."
fi

step "12. the smoke suite, against this working tree"     node scripts/smoke.mjs

if [ -n "$ORIGIN" ]; then
  step "13. the smoke suite, against $ORIGIN"             node scripts/smoke.mjs "$ORIGIN"
fi

# ---------------------------------------------------------------------------------------------
echo
echo "=============================================================================="
echo "== summary"
echo "=============================================================================="
fails=0
skips=0
for i in "${!STEP_NAMES[@]}"; do
  case "${STEP_STATE[$i]}" in
    OK)   printf '  [OK]   %s\n' "${STEP_NAMES[$i]}" ;;
    SKIP) printf '  [SKIP] %s\n         %s\n' "${STEP_NAMES[$i]}" "${STEP_NOTE[$i]}"; skips=$((skips + 1)) ;;
    *)    printf '  [FAIL] %s  (%s)\n' "${STEP_NAMES[$i]}" "${STEP_NOTE[$i]}"; fails=$((fails + 1)) ;;
  esac
done
echo
printf '%d steps, %d failed, %d skipped\n' "${#STEP_NAMES[@]}" "$fails" "$skips"
if [ "$fails" -gt 0 ]; then
  echo "VERDICT: something is wrong. Nothing is ready to push."
  exit 1
fi
if [ "$skips" -gt 0 ]; then
  echo "VERDICT: clean, with $skips step(s) that did not run. Read the summary before trusting it."
else
  echo "VERDICT: clean"
fi
exit 0
