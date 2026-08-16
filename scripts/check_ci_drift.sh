#!/usr/bin/env bash
# Every step scripts/verify.sh runs is run by a workflow, or is named here as one CI cannot run.
#
# WHY THIS EXISTS. Issue 168 R4(e), and the structure it repairs has already produced the defect
# twice. scripts/verify.sh is the ordered list of everything a contributor runs before pushing.
# The workflow files call it nowhere: they re-enumerate the same commands by hand. Two lists of
# one thing, joined by nothing, maintained by two different hands at two different times.
#
# Issue 103 found the first drift and repaired it by hand, leaving the structure that produced
# it, and by the time the audit read the tree the drift was back: `check_syntax`, the only thing
# in this repository that runs `node --check` over site/*.js, was in no workflow at all. site/
# has no build step, so a syntax error there is caught by nothing until somebody opens the page,
# where it draws nothing. This repository has shipped a blank page once already.
#
# HOW IT WORKS, AND WHY IT IS A RELATION AND NOT A THIRD LIST. verify.sh hands over its own steps
# with ZMT_LIST_ONLY, so the list is the registrations themselves rather than a regular
# expression over them. A workflow step that covers one of those steps says so in a marker
# comment, `verify-step: <key>`, beside the step it belongs to. This file joins the two. There is
# no third place where the correspondence is written down, so there is nothing here to keep in
# sync with anything: adding a step to verify.sh and no marker anywhere goes red, and deleting a
# step while leaving a marker behind goes red too.
#
# THE EXEMPTIONS ARE A TABLE AND EACH ONE CARRIES ITS REASON. Some steps genuinely cannot run on
# a runner, and the honest form of that is a named row with the argument on it, not an absence.
# A row is reported as [SKIP] and never as [OK], which is scripts/verify.sh's own doctrine
# applied to this file. AND AN EXEMPTION THAT HAS GONE STALE IS A FAILURE: if a workflow does run
# an exempt step, the reason on the row is false and the row has to go, because a false reason in
# a table like this is the next reader's evidence.
#
# Exit: 0 every step is covered or exempt, 1 drift, 2 it could not take the list or found no
# workflows, in which case nothing here is evidence about anything.
#
# Usage:
#   scripts/check_ci_drift.sh              check the tree
#   scripts/check_ci_drift.sh --self-test  prove each of the four refusals fires

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WORKFLOWS=".github/workflows"

# ---------------------------------------------------------------------------------------------
# The exemptions.
# ---------------------------------------------------------------------------------------------
# One row per verify.sh step key that no workflow runs, and the reason it cannot. Read as
# `key<TAB>reason`. Adding a row is a deliberate act with an argument attached; there is no way
# to exempt a step by leaving it out.
EXEMPT="$(cat <<'ROWS'
untracked	a runner checks out a commit, so its working tree has nothing untracked in it by construction. This step is about the run a contributor makes with a new file on disk that `git ls-files` cannot see, and that state does not exist here.
token-grep	build/safety_grep.py reads the faculty register in plaintext out of the vault and no runner holds one. CI holds salted hashes instead and runs both hash gates, which is the half of the safety machinery that does not need the vault.
smoke-origin	the suite against a published origin needs a second copy of the bytes to drive a browser at. pages.yml reads the deployed bytes with the forbidden-content gate and origin-freshness.yml asks the origin which commit it serves; neither drives a browser, and while nothing is published there is nothing to drive one at.
ROWS
)"

# ---------------------------------------------------------------------------------------------
# The two sides of the join.
# ---------------------------------------------------------------------------------------------
# verify.sh's own list. It is asked for rather than parsed: see the header. An empty answer is an
# abort and never an empty relation, because "no steps" and "I could not ask" look identical from
# here and only one of them is safe to report clean about.
real_verify_keys() {
  ZMT_LIST_ONLY=1 bash "$ROOT/scripts/verify.sh" 2>/dev/null | sed -n 's/^STEP\t\([^\t]*\)\t.*$/\1/p'
}

# One level of indirection, and it is here so the self-test can hand `report` a list this machine
# would never produce and then put the real one back by name. Substituting the reading is the only
# way to drive a malformed key, and a probe that left the substitution in place would make every
# probe after it pass or fail for a reason nobody wrote down.
verify_keys() { real_verify_keys; }

# Every marker in every workflow, as `key<TAB>file`. The marker is a comment, so it survives YAML
# reformatting and belongs to the step a reader is looking at rather than to a list at the top.
workflow_markers() {  # dir
  local dir="$1" f key
  for f in "$dir"/*.yml "$dir"/*.yaml; do
    [ -f "$f" ] || continue
    while IFS= read -r key; do
      printf '%s\t%s\n' "$key" "$(basename "$f")"
    done < <(sed -n 's/^[[:space:]]*#[[:space:]]*verify-step:[[:space:]]*\([A-Za-z0-9_-]\{1,\}\).*$/\1/p' "$f")
  done
}

# The keys a workflow is expected to claim: every step, less the exempt rows. The self-test
# builds its fixtures from this rather than from the whole list, because a fixture claiming an
# exempt step is the stale-exemption case and would make the control fail for the reason one of
# the probes under it exists to prove.
nonexempt_keys() {
  local k
  while IFS= read -r k; do
    [ -n "$k" ] || continue
    [ -n "$(exempt_reason "$k")" ] || printf '%s\n' "$k"
  done < <(verify_keys)
}

exempt_reason() {  # key
  printf '%s\n' "$EXEMPT" | sed -n "s/^$1\t//p" | head -1
}

# ---------------------------------------------------------------------------------------------
# The report.
# ---------------------------------------------------------------------------------------------
report() {  # workflows-dir
  local dir="$1"
  local keys markers bad=0 skipped=0 key files reason

  keys="$(verify_keys)"
  if [ -z "$keys" ]; then
    echo "::error::scripts/verify.sh handed over no steps, so there is nothing to join the"
    echo "         workflows against and this run is not evidence that CI covers anything."
    return 2
  fi

  # THE KEYS ARE THE LEFT SIDE OF EVERY `sed` BELOW, so a key is checked before it is used as one.
  # Found by an outside reader: `.*` as a key would match several exemption rows at once and quietly
  # inherit somebody else's reason, and a key holding `/` or `[` makes sed error out and the row
  # read as uncovered. Neither is a live defect and both are one careless key away, and a joining
  # gate whose join can be steered by its own input is the class this whole card is about.
  local bad_key
  bad_key="$(printf '%s\n' "$keys" | grep -v '^[A-Za-z0-9_-]\{1,\}$' | head -3 | tr '\n' ' ')"
  if [ -n "$bad_key" ]; then
    echo "::error::scripts/verify.sh registered step key(s) that are not plain words: $bad_key"
    echo "         Keys are matched literally against the workflow markers, so a key carrying a"
    echo "         regular expression character joins by something other than equality. Nothing"
    echo "         below would be a reliable reading, so nothing below was read."
    return 2
  fi

  # AND NO TWO STEPS SHARE ONE. A duplicate key means one marker covers two steps, so a step that
  # no workflow runs is reported green because its twin is claimed. The relation has to be a
  # relation.
  local dupe
  dupe="$(printf '%s\n' "$keys" | sort | uniq -d | tr '\n' ' ')"
  if [ -n "$dupe" ]; then
    echo "::error::scripts/verify.sh registers more than one step under: $dupe"
    echo "         One marker would then cover both, and a step nothing runs would be reported as"
    echo "         covered because its twin is. Give each step its own key."
    return 2
  fi

  markers="$(workflow_markers "$dir")"
  if [ -z "$markers" ]; then
    echo "::error::no workflow in $dir carries a single \`verify-step:\` marker. Either the"
    echo "         markers were stripped or this is not the workflow directory, and in both"
    echo "         cases every step below would be reported as uncovered for the wrong reason."
    return 2
  fi

  while IFS= read -r key; do
    [ -n "$key" ] || continue
    files="$(printf '%s\n' "$markers" | sed -n "s/^$key\t//p" | sort -u | tr '\n' ' ')"
    files="${files% }"
    reason="$(exempt_reason "$key")"
    if [ -n "$files" ] && [ -n "$reason" ]; then
      printf '  [FAIL] %-18s the exemption says CI cannot run this and %s does\n' "$key" "$files"
      printf '         the reason on the row is false. Delete the row in scripts/check_ci_drift.sh.\n'
      bad=1
    elif [ -n "$files" ]; then
      printf '  [OK]   %-18s %s\n' "$key" "$files"
    elif [ -n "$reason" ]; then
      printf '  [SKIP] %-18s no workflow runs it, and here is why:\n' "$key"
      printf '%s\n' "$reason" | fold -s -w 88 | sed 's/^/           /'
      skipped=$((skipped + 1))
    else
      printf '  [FAIL] %-18s no workflow claims this step and no exemption names it\n' "$key"
      printf '         A contributor runs it before pushing and nothing runs it after. Either add\n'
      printf '         a step to a workflow with `# verify-step: %s` beside it, or add a row to\n' "$key"
      printf '         the exemption table in scripts/check_ci_drift.sh saying why it cannot run.\n'
      bad=1
    fi
  done <<EOF
$keys
EOF

  # The other direction. A marker naming a step verify.sh no longer has is a workflow claiming to
  # cover something that does not exist, which is the same drift read from the far end.
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    key="${line%%	*}"
    if ! printf '%s\n' "$keys" | grep -qx -- "$key"; then
      printf '  [FAIL] %-18s %s claims this step and scripts/verify.sh has no step by that key\n' \
             "$key" "${line#*	}"
      bad=1
    fi
  done <<EOF
$markers
EOF

  echo
  if [ "$bad" -ne 0 ]; then
    echo "VERDICT: CI and scripts/verify.sh have drifted. The list above names each one."
    return 1
  fi
  if [ "$skipped" -ne 0 ]; then
    echo "VERDICT: every step scripts/verify.sh runs is run by a workflow, except the $skipped"
    echo "         named above that cannot run on a runner, each with its reason."
    return 0
  fi
  echo "VERDICT: every step scripts/verify.sh runs is run by a workflow."
  return 0
}

# ---------------------------------------------------------------------------------------------
# The self-test. Jidoka: four refusals, each proved to fire, against synthetic workflow
# directories written under mktemp so the tree is never touched.
# ---------------------------------------------------------------------------------------------
EXPECTED_PROBES=12
PASS=0
TOTAL=0

probe() {  # want-exit name cmd...
  local want="$1" name="$2"; shift 2
  local out rc
  out="$("$@" 2>&1)"
  rc=$?
  TOTAL=$((TOTAL + 1))
  if [ "$rc" -eq "$want" ]; then
    PASS=$((PASS + 1)); printf '  [OK]   %s\n' "$name"
  else
    printf '  [FAIL] %s (wanted exit %s, got %s)\n' "$name" "$want" "$rc"
    printf '%s\n' "$out" | sed 's/^/         /'
  fi
}

probe_says() {  # needle name cmd...
  local needle="$1" name="$2"; shift 2
  local out
  out="$("$@" 2>&1)"
  TOTAL=$((TOTAL + 1))
  if printf '%s' "$out" | grep -qF -- "$needle"; then
    PASS=$((PASS + 1)); printf '  [OK]   %s\n' "$name"
  else
    printf '  [FAIL] %s (it never said %s)\n' "$name" "$needle"
    printf '%s\n' "$out" | sed 's/^/         /'
  fi
}

self_test() {
  local dir
  dir="$(mktemp -d)" || { echo "could not make a scratch directory"; return 2; }

  echo "self-test: the join refuses each way it can be wrong"

  # Every key a workflow is expected to claim. The control: this must pass, or every refusal
  # below proves nothing.
  mkdir -p "$dir/all"
  nonexempt_keys | sed 's/^/      # verify-step: /' > "$dir/all/everything.yml"
  probe 0 "control: a workflow directory claiming every non-exempt step passes" report "$dir/all"

  # One key dropped, and it is deliberately one with no exemption row.
  mkdir -p "$dir/short"
  nonexempt_keys | grep -vx syntax | sed 's/^/      # verify-step: /' > "$dir/short/most.yml"
  probe 1 "a step no workflow claims and no exemption names is refused" report "$dir/short"
  probe_says "syntax" "and the refusal names the step" report "$dir/short"

  # A marker for a step that does not exist.
  mkdir -p "$dir/stale"
  { nonexempt_keys; echo "a-step-that-was-deleted"; } | sed 's/^/      # verify-step: /' \
      > "$dir/stale/stale.yml"
  probe 1 "a marker naming a step verify.sh does not have is refused" report "$dir/stale"
  probe_says "a-step-that-was-deleted" "and the refusal names the stale marker" report "$dir/stale"

  # An exempt step that a workflow does run: the reason on the row is now false.
  mkdir -p "$dir/stalexempt"
  nonexempt_keys | sed 's/^/      # verify-step: /' > "$dir/stalexempt/w.yml"
  echo "      # verify-step: token-grep" >> "$dir/stalexempt/w.yml"
  probe 1 "an exemption a workflow has overtaken is refused, not quietly kept" \
        report "$dir/stalexempt"
  probe_says "token-grep" "and the refusal names the row whose reason has gone false" \
        report "$dir/stalexempt"

  # A key that is a regular expression, and a key registered twice. Both are driven by replacing
  # the list rather than the workflows, because the list is the side they come from.
  verify_keys() { printf 'syntax\n.*\n'; }
  probe 2 "a step key that is a regular expression aborts rather than joining by something else" \
        report "$dir/all"
  verify_keys() { printf 'syntax\nsyntax\n'; }
  probe 2 "one key on two steps aborts rather than letting one marker cover both" \
        report "$dir/all"
  verify_keys() { real_verify_keys; }
  # Re-read after restoring, so a probe that left the list broken cannot pass the rest silently.
  probe 0 "control: with the real list back, the tree still joins" report "$dir/all"

  # No markers at all, and no directory at all. Both are "I could not look" and neither is a
  # relation in which nothing is covered.
  mkdir -p "$dir/bare"
  printf 'name: nothing\n' > "$dir/bare/w.yml"
  probe 2 "a workflow directory with no marker in it aborts rather than failing every step" \
        report "$dir/bare"
  probe 2 "a workflow directory that does not exist aborts" report "$dir/missing"

  rm -rf "$dir"
  echo
  echo "self-test: ${PASS}/${TOTAL}, of ${EXPECTED_PROBES} intended"
  if [ "$TOTAL" -ne "$EXPECTED_PROBES" ]; then
    echo "ASSERTION FAILED: this suite intends ${EXPECTED_PROBES} probes and ${TOTAL} ran."
    return 2
  fi
  [ "$PASS" -eq "$TOTAL" ]
}

if [ "${1:-}" = "--self-test" ]; then
  self_test
  exit $?
fi

echo "== every step scripts/verify.sh runs is run by a workflow, or is named as one CI cannot"
report "$WORKFLOWS"
exit $?
