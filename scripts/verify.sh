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

# Run a step, print its output under a banner, record its verdict. A step that exits 2 is
# recorded as [SKIP] and not as a failure, which is how a gate says "I could not answer" rather
# than "the answer is clean"; every gate here uses 2 for exactly that.
step() {
  local name="$1"; shift
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
    STEP_STATE+=("SKIP"); STEP_NOTE+=("the step declined to run, see its output above")
    echo "-- [SKIP] $name (exit 2: it declined to answer rather than answering clean)"
  else
    STEP_STATE+=("FAIL"); STEP_NOTE+=("exit $rc")
    echo "-- [FAIL] $name (exit $rc)"
  fi
  return 0
}

skip() {
  STEP_NAMES+=("$1"); STEP_STATE+=("SKIP"); STEP_NOTE+=("$2")
  echo
  echo "=============================================================================="
  echo "== $1"
  echo "=============================================================================="
  echo "-- [SKIP] $2"
}

# ---------------------------------------------------------------------------------------------
# 1. Syntax. Every shipped script parses.
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
# 2. What the repository gate cannot see.
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
  echo "  \`git add\` them before trusting a clean verdict from steps 4 and 5, or accept that the"
  echo "  verdict is about the rest of the tree."
  return 2
}

# ---------------------------------------------------------------------------------------------
# 3. The layout is a pure function of the model.
# ---------------------------------------------------------------------------------------------
# README.md's Layout section claims the drawing is reproducible and says the claim is "checkable by
# running the build twice rather than believed". This is that check. site/graph.js is put back
# whatever happens, so a verify run never leaves the tree dirty: a check that edits the thing it
# checks is a check nobody runs twice.
check_layout_reproducible() {
  local before
  before="$(mktemp)"
  cp site/graph.js "$before"
  if ! python3 build/build_layout.py >/tmp/zmt-layout.$$ 2>&1; then
    sed 's/^/  /' /tmp/zmt-layout.$$
    cp "$before" site/graph.js; rm -f "$before" /tmp/zmt-layout.$$
    echo "  the build itself failed"
    return 1
  fi
  tail -3 /tmp/zmt-layout.$$ | sed 's/^/  /'
  if cmp -s site/graph.js "$before"; then
    echo "  site/graph.js is byte identical after a rebuild: the drawing is a pure function of the model"
    rm -f "$before" /tmp/zmt-layout.$$
    return 0
  fi
  echo "  site/graph.js CHANGED when the build was run again."
  echo "  Either the committed file is stale, or the build is not deterministic. The diff, by size:"
  printf '    committed %s bytes, rebuilt %s bytes\n' "$(wc -c <"$before")" "$(wc -c <site/graph.js)"
  echo "  The rebuilt file has been kept; the previous one is at $before"
  rm -f /tmp/zmt-layout.$$
  return 1
}

# ---------------------------------------------------------------------------------------------
# 8. The local token grep.
# ---------------------------------------------------------------------------------------------
# build/safety_grep.py reads the faculty register straight out of the vault, which is what lets it
# look for real names in plaintext where the two CI gates hold salted hashes. It needs the vault,
# so on a machine without one it exits 2 and this reports [SKIP]. The path is asked of the module
# rather than written here: a value that lives in one file must not be typed into a second
# (KAIZEN.md `kaizen-a-computed-value-is-never-typed-twice`).
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
step "2. nothing is untracked, so the gates see everything" check_untracked
step "3. the layout rebuilds byte for byte"               check_layout_reproducible
step "4. prove the repository gate fires"                 bash scripts/check_repo.sh --self-test
step "5. repository gate, over every tracked file"        bash scripts/check_repo.sh
step "6. prove the deployed-bytes gate fires"             bash scripts/check_forbidden.sh --self-test

if [ -n "$ORIGIN" ]; then
  step "7. deployed-bytes gate, against $ORIGIN"          bash scripts/check_forbidden.sh "$ORIGIN"
else
  skip "7. deployed-bytes gate, against the origin" \
       "no origin given. It fetches the published files over HTTP and has nothing to read without one; pass a url to run it. It runs in CI after every deploy, in pages.yml."
fi

step "8. the local token grep, against site/"             check_token_grep
step "9. the smoke suite, against this working tree"      node scripts/smoke.mjs

if [ -n "$ORIGIN" ]; then
  step "10. the smoke suite, against $ORIGIN"             node scripts/smoke.mjs "$ORIGIN"
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
