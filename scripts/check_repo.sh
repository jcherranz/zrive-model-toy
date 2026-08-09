#!/usr/bin/env bash
# The second andon cord. Read every file this repository tracks and fail the build if any of
# it carries content that must never be committed.
#
# WHY THIS EXISTS, AND WHY IT IS NOT THE OTHER GATE. scripts/check_forbidden.sh fetches the
# deployed bytes from the public origin, which is the right question to ask about the site and
# the only question it can answer. Pages publishes site/ and nothing else, so that gate has
# never been able to see build/, scripts/, or a single line of the documentation. On the day
# the discipline was installed, a real surname was sitting in scripts/gen_forbidden_hashes.sh,
# in the header of the script whose only purpose is keeping real names out of this repository,
# and the origin gate could not have found it however often it ran. It was found by an
# independent scan of tracked files. HANSEI.md, sixth entry.
#
# The two gates are complements. This one answers "is the repository clean", that one answers
# "is what the public reads clean", and neither answer implies the other.
#
# THE SELF-REFERENCE PROBLEM, AND HOW IT IS HANDLED. A gate that scans its own source finds
# the rules it is made of: the banned-word table, the money pattern's currency mark, the
# self-test's synthetic email address and UUID. Those matches are real matches and they are
# not findings. The wrong fix is to skip the gate's own files, because that is where a real
# name most recently was, and a file skipped is a file where anything can hide.
#
# What is done instead: an explicit table of DECLARED SELF-MATCHES below, each one an exact
# triple of rule, path and matched string. A triple licenses exactly itself. The same word in
# a different file still fails; a different email address in the same file still fails; a
# second UUID beside the declared one still fails. Two further conditions keep the table from
# rotting into a blanket exclusion:
#
#   - every entry must be used. A declared literal that no longer occurs where it is declared
#     fails the run, so the table cannot outlive the code it describes.
#   - the real-name rule has no entry and can have none. An entry naming it is rejected by an
#     assertion rather than ignored. That rule is the reason this gate was written and there is
#     no file in this repository where a name from the register is expected.
#
# Usage:
#   scripts/check_repo.sh            scan every tracked file
#   scripts/check_repo.sh --self-test  prove the gate fires, and prove the exemptions are exact
#
# Env: FORBIDDEN_HASHES (default scripts/forbidden_names.sha256)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/forbidden_lib.sh
. "$ROOT/scripts/forbidden_lib.sh"

HASHES="${FORBIDDEN_HASHES:-$ROOT/scripts/forbidden_names.sha256}"

# A matched name is not public and a CI log must not be where it becomes public. This gate
# reports the file, the token's length and the line numbers, and withholds the token itself.
# The deployed-bytes gate does the opposite, and is right to: there the name is already out.
FORBIDDEN_NAME_ECHO=0

# Repository-side addition to the allowed money strings. This repository's prose documents the
# money rule itself, so the English words "euro" and "euros" occur in it unattached to any
# figure. Only the bare words are allowed, and only in this gate. Every other alternative of
# MONEY_RE is untouched, so "500 EUR" and "1.000.000 euros" still fail here, which the
# self-test proves rather than asserts.
ALLOWED_MONEY="$ALLOWED_MONEY"$'\neuro\neuros'

# ---------------------------------------------------------------------------------------
# DECLARED SELF-MATCHES.  rule|path|exact matched string
#
# rule is one of: banned-word, corpus-link, uuid, email, money.  There is deliberately no
# real-name rule here and an assertion below refuses one.
# ---------------------------------------------------------------------------------------
FORBIDDEN_EXEMPT=(
  # scripts/forbidden_lib.sh declares the rules. Every literal below IS a rule.
  "banned-word|scripts/forbidden_lib.sh|Palantir"
  "banned-word|scripts/forbidden_lib.sh|Foundry"
  "banned-word|scripts/forbidden_lib.sh|Gotham"
  "banned-word|scripts/forbidden_lib.sh|AIP"
  "banned-word|scripts/forbidden_lib.sh|Blueprint"
  "banned-word|scripts/forbidden_lib.sh|digital twin"
  "corpus-link|scripts/forbidden_lib.sh|collection://"
  "money|scripts/forbidden_lib.sh|€"
  "money|scripts/forbidden_lib.sh|46.932"

  # scripts/check_forbidden.sh carries the synthetic payloads of its own self-test. Each one
  # was chosen to trip a rule, so each one trips this gate too.
  "banned-word|scripts/check_forbidden.sh|Palantir"
  "banned-word|scripts/check_forbidden.sh|digital twin"
  "corpus-link|scripts/check_forbidden.sh|collection://"
  "uuid|scripts/check_forbidden.sh|3f2504e0-4f89-11d3-9a0c-0305e82c3301"
  "email|scripts/check_forbidden.sh|alguien@example.com"
  "money|scripts/check_forbidden.sh|1.138.000,00"
  "money|scripts/check_forbidden.sh|2.750,00"

  # build/safety_grep.py is the local pre-push copy of the same rules, in Python.
  "banned-word|build/safety_grep.py|Palantir"
  "banned-word|build/safety_grep.py|Foundry"
  "banned-word|build/safety_grep.py|Gotham"
  "banned-word|build/safety_grep.py|AIP"
  "banned-word|build/safety_grep.py|Blueprint"
  "banned-word|build/safety_grep.py|digital twin"
  "corpus-link|build/safety_grep.py|collection://"
  "money|build/safety_grep.py|€"
  "money|build/safety_grep.py|1,000.00"
  "money|build/safety_grep.py|46.932"

  # Documentation of the rules and of the incidents. These are figures in English prose, not
  # money: 46.932 is the fractional-second timestamp that once tripped the money rule, and
  # 1.538 is an item count from the first incident. Both are declared per file, so the same
  # string appearing anywhere else in the repository still fails.
  "corpus-link|CHANGELOG.md|collection://"
  "money|CHANGELOG.md|46.932"
  "money|HANSEI.md|1.538"
  "corpus-link|README.md|collection://"
  "money|scripts/sync_board.mjs|46.932"

  # This file. The table above places every literal it names into this file as well, and the
  # self-test payloads below add the rest. Each is declared here explicitly, at this path, by
  # an entry that also declares its own occurrence: nothing is licensed by being written down.
  "banned-word|scripts/check_repo.sh|Palantir"
  "banned-word|scripts/check_repo.sh|Foundry"
  "banned-word|scripts/check_repo.sh|Gotham"
  "banned-word|scripts/check_repo.sh|AIP"
  "banned-word|scripts/check_repo.sh|Blueprint"
  "banned-word|scripts/check_repo.sh|digital twin"
  "corpus-link|scripts/check_repo.sh|collection://"
  "uuid|scripts/check_repo.sh|3f2504e0-4f89-11d3-9a0c-0305e82c3301"
  "email|scripts/check_repo.sh|alguien@example.com"
  "email|scripts/check_repo.sh|otro@example.org"
  "money|scripts/check_repo.sh|€"
  "money|scripts/check_repo.sh|1,000.00"
  "money|scripts/check_repo.sh|46.932"
  "money|scripts/check_repo.sh|1.538"
  "money|scripts/check_repo.sh|1.138.000,00"
  "money|scripts/check_repo.sh|2.750,00"
  "money|scripts/check_repo.sh|1.000.000"
  "money|scripts/check_repo.sh|500 EUR"
)

WORKDIR=""
# `return 0` is load-bearing. An EXIT trap that ends on a failed command hands its own status
# to the shell, so a cleanup that finds nothing to delete turns a clean verdict into exit 1,
# and a gate that fails on clean gets switched off by the third person it blocks.
cleanup() { [ -n "$WORKDIR" ] && rm -rf "$WORKDIR"; return 0; }
trap cleanup EXIT

# ---------------------------------------------------------------------------------------
# Poka-yoke. A gate handed nothing to scan reports clean, which is the loudest lie it can
# tell (HANSEI.md, "A workflow ran on an empty input and reported success").
# ---------------------------------------------------------------------------------------
assert_scan_inputs() {  # n_files bytes n_hashes
  [ "$1" -gt 0 ] || { echo "ASSERTION FAILED: no tracked files to scan" >&2; exit 2; }
  [ "$2" -gt 0 ] || { echo "ASSERTION FAILED: $1 files, 0 bytes total" >&2; exit 2; }
  [ "$3" -gt 0 ] || { echo "ASSERTION FAILED: name hash list is empty" >&2; exit 2; }
}

assert_table_well_formed() {
  local e rule
  for e in ${FORBIDDEN_EXEMPT[@]+"${FORBIDDEN_EXEMPT[@]}"}; do
    rule="${e%%|*}"
    case "$rule" in
      banned-word|corpus-link|uuid|email|money) ;;
      *) echo "ASSERTION FAILED: declared self-match names an unknown rule: $e" >&2; exit 2 ;;
    esac
    [ "$(grep -c '|' <<< "$e")" -ge 1 ] || { echo "ASSERTION FAILED: malformed entry: $e" >&2; exit 2; }
  done
}

report_unused_exemptions() {
  local e unused=0
  for e in ${FORBIDDEN_EXEMPT[@]+"${FORBIDDEN_EXEMPT[@]}"}; do
    if [ -z "${FORBIDDEN_EXEMPT_HITS[$e]:-}" ]; then
      echo "  [STALE] declared self-match never matched: $e"
      unused=$((unused + 1))
    fi
  done
  [ "$unused" -eq 0 ]
}

# ---------------------------------------------------------------------------------------
scan_repo() {
  local n_files n_hashes bytes f
  cd "$ROOT"

  n_files="$(git ls-files | wc -l)"
  n_hashes="$(grep -cv '^#' "$HASHES" || true)"
  bytes="$(git ls-files -z | xargs -0 -r stat -c%s | awk '{s+=$1} END {print s+0}')"
  assert_scan_inputs "$n_files" "$bytes" "$n_hashes"

  echo "scanning $n_files tracked files, $bytes bytes, against $n_hashes name hashes"
  echo "declared self-matches: ${#FORBIDDEN_EXEMPT[@]}"
  echo

  while IFS= read -r f; do
    [ -f "$f" ] || continue
    scan_file "$f" "$f" "$HASHES"
  done < <(git ls-files)
}

# ---------------------------------------------------------------------------------------
# Self-test. Every probe runs the same scan_file the real scan runs.
# ---------------------------------------------------------------------------------------
self_test() {
  local tmp fake_hashes pass=0 total=0
  WORKDIR="$(mktemp -d)"; tmp="$WORKDIR"
  fake_hashes="$tmp/hashes"
  # The name rule is proved against a synthetic register holding one invented token. Proving
  # the matcher works must not require a real name to exist anywhere, not even in a temp file.
  { echo "# synthetic"; hash_token "kestrelvane"; } > "$fake_hashes"

  # expect: trip | pass
  probe() {  # name expect payload [exempt-entry ...]
    local name="$1" expect="$2" payload="$3"; shift 3
    local table=("$@") rc=0
    total=$((total + 1))
    printf '%s\n' "$payload" > "$tmp/probe.txt"
    (
      FORBIDDEN_EXEMPT=(${table[@]+"${table[@]}"})
      FAILURES=0
      scan_file "$tmp/probe.txt" "probe.txt" "$fake_hashes" >/dev/null 2>&1
      [ "$FAILURES" -eq 0 ]
    ) || rc=$?
    if { [ "$expect" = trip ] && [ "$rc" -ne 0 ]; } || { [ "$expect" = pass ] && [ "$rc" -eq 0 ]; }; then
      echo "  [OK]   $name"
      pass=$((pass + 1))
    else
      echo "  [MISS] $name"
    fi
  }

  echo "self-test: the probes below MUST trip the gate"
  probe "a banned word"                'trip' 'built on Palantir, allegedly'
  probe "a banned phrase"              'trip' 'a digital twin of the operation'
  probe "a corpus link"                'trip' 'see collection://a1b2c3 for the source'
  probe "a uuid"                       'trip' 'id 3f2504e0-4f89-11d3-9a0c-0305e82c3301'
  probe "an email address"             'trip' 'contact alguien@example.com for detail'
  probe "a grouped money figure"       'trip' 'turnover of 1.138.000,00 EUR last year'
  probe "a figure beside a timestamp"  'trip' '{"generated":"2026-08-09T16:42:46.932Z","fee":"2.750,00 EUR"}'
  probe "a real name (synthetic)"      'trip' 'taught by Ada Kestrelvane in March'
  probe "a figure spelled with euros"  'trip' 'raised 1.000.000 euros in the round'
  probe "a figure with a currency tag" 'trip' 'a fee of 500 EUR per session'

  echo
  echo "self-test: the probes below prove the declared self-matches are EXACT"
  probe "a declared literal passes"    'pass' 'built on Palantir, allegedly' \
        "banned-word|probe.txt|Palantir"
  probe "a different literal, same file and rule, still trips" 'trip' \
        'built on Palantir and on Foundry' "banned-word|probe.txt|Palantir"
  probe "a different email in a file with a declared one still trips" 'trip' \
        'write to otro@example.org, not alguien@example.com' \
        "email|probe.txt|alguien@example.com"
  probe "a literal declared for another path still trips" 'trip' \
        'built on Palantir, allegedly' "banned-word|build/safety_grep.py|Palantir"
  probe "a literal declared under the wrong rule still trips" 'trip' \
        'built on Palantir, allegedly' "money|probe.txt|Palantir"
  probe "the real-name rule ignores every declaration" 'trip' \
        'Palantir, and taught by Ada Kestrelvane' \
        "banned-word|probe.txt|Palantir" "corpus-link|probe.txt|collection://"

  echo
  echo "self-test: the probes below MUST NOT trip the gate"
  probe "the two declared invented figures" 'pass' \
        'total_price 4.000,00 EUR and amount_claimed 1.000,00 EUR, --lh-ui: 1.28581'
  probe "a fractional-second timestamp"     'pass' '{"generated":"2026-08-09T16:42:46.932Z"}'
  probe "Company inside a firm name"        'pass' 'Kestrel Analytics Company Limited, a supplier'
  probe "the bare English words euro/euros" 'pass' 'the euro figures, priced in euros, in prose'
  probe "an ordinary decimal, not grouped"  'pass' 'stroke-width 1.28581 and ratio 0.75'

  echo
  echo "self-test: the structural guards"

  # A stale declaration must fail the run rather than sit there.
  total=$((total + 1))
  local rc=0
  (
    FORBIDDEN_EXEMPT=("banned-word|nowhere.txt|Gotham")
    unset FORBIDDEN_EXEMPT_HITS; declare -A FORBIDDEN_EXEMPT_HITS=()
    report_unused_exemptions >/dev/null 2>&1
  ) || rc=$?
  if [ "$rc" -ne 0 ]; then
    echo "  [OK]   a declaration that matched nothing failed the run"
    pass=$((pass + 1))
  else
    echo "  [MISS] a stale declaration was tolerated"
  fi

  # An entry naming the real-name rule must be rejected, not ignored.
  total=$((total + 1))
  rc=0
  ( FORBIDDEN_EXEMPT=("real-name|scripts/check_repo.sh|whatever"); assert_table_well_formed >/dev/null 2>&1 ) || rc=$?
  if [ "$rc" -eq 2 ]; then
    echo "  [OK]   a declaration naming the real-name rule was rejected"
    pass=$((pass + 1))
  else
    echo "  [MISS] a declaration naming the real-name rule was accepted (exit $rc)"
  fi

  # An empty input must abort, not report clean.
  total=$((total + 1))
  rc=0
  ( assert_scan_inputs 0 0 1 >/dev/null 2>&1 ) || rc=$?
  if [ "$rc" -eq 2 ]; then
    echo "  [OK]   an empty file list aborted instead of reporting clean"
    pass=$((pass + 1))
  else
    echo "  [MISS] an empty file list did not abort (exit $rc)"
  fi

  echo
  echo "self-test: $pass/$total"
  [ "$pass" -eq "$total" ]
}

# ---------------------------------------------------------------------------------------
main() {
  if [ "${1:-}" = "--self-test" ]; then
    self_test
    exit $?
  fi

  echo "gate: forbidden content, over every tracked file"
  echo "  repository: $ROOT"
  echo "  hash list:  ${HASHES#"$ROOT"/}"
  echo

  assert_table_well_formed
  scan_repo

  echo
  if ! report_unused_exemptions; then
    echo
    echo "VERDICT: the declared self-match table has rotted."
    echo "An entry that matches nothing is a hole waiting for something to fall into it."
    exit 1
  fi

  if [ "$FAILURES" -eq 0 ]; then
    echo "VERDICT: clean"
    exit 0
  fi
  echo "VERDICT: FORBIDDEN CONTENT IS COMMITTED ($FAILURES findings)"
  echo "Remove it from the working tree first; then decide what the history needs."
  exit 1
}

main "$@"
