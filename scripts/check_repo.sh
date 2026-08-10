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
  #
  # CHANGELOG.md no longer needs the 46.932 declaration and no longer has it. The entry that
  # tells that story used to print the figure on its own as well as inside the timestamp it came
  # from; an editing pass left only the timestamp, `...46.932Z`, which the money rule does not
  # read as a figure because a digit preceded by a dot is not the start of a grouped amount. The
  # declaration then matched nothing, and this gate fails on that rather than shrugging: an entry
  # that matches nothing is a hole waiting for something to fall into it. If a bare 46.932 ever
  # comes back to that file the gate will say so, loudly, which is the right direction to fail in.
  "corpus-link|CHANGELOG.md|collection://"
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
  "email|scripts/check_repo.sh|probe@example.com"
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
# The bytes on the disk.
scan_worktree() {  # hashfile
  local f
  FORBIDDEN_ORIGIN=""
  while IFS= read -r f; do
    [ -f "$f" ] || continue
    scan_file "$f" "$f" "$1"
  done < <(git ls-files)
}

# The bytes that are not on the disk.
#
# WHY THIS EXISTS. `git ls-files` names paths; everything above then reads those paths off the
# working tree. That is one of three copies of a tracked file and it is the only one that is
# not the repository: the index is what the next commit will carry, and HEAD is what the
# repository already carries. They diverge exactly when somebody edits without committing,
# which is the ordinary state of a working session.
#
# On 2026-08-09 that divergence produced a false clean. A real surname was in this repository,
# in `scripts/gen_forbidden_hashes.sh` at HEAD, and a correction to it existed only as an
# uncommitted working-tree edit. The gate read the disk, found the corrected copy, and printed
# VERDICT: clean while the name sat in every commit anyone could clone. Nothing was wrong with
# the name rule; it was pointed at the wrong bytes. HANSEI.md, seventh entry.
#
# So: for every tracked path whose index copy differs from the disk, the index copy is scanned
# too, and likewise HEAD's, and a finding says which. The label passed to the scan is the plain
# path, so the declared self-matches apply to a snapshot exactly as they apply to the disk: a
# gate file's staged copy carries the same rule literals by construction, and nothing else is
# licensed. In CI the three copies are identical after a checkout and this loop finds nothing,
# which is correct and is not a reason to leave it out. The false clean happened locally, which
# is where the gate is read most often and trusted most casually.
scan_snapshots() {  # hashfile
  local hashfile="$1" f wt idx hd blobdir n=0
  git rev-parse --verify -q HEAD >/dev/null 2>&1 || return 0

  blobdir="$WORKDIR/snapshots"
  mkdir -p "$blobdir"

  while IFS= read -r f; do
    wt=""; [ -f "$f" ] && wt="$(git hash-object -- "$f" 2>/dev/null || true)"
    idx="$(git rev-parse -q --verify ":$f" 2>/dev/null || true)"
    hd="$(git rev-parse -q --verify "HEAD:$f" 2>/dev/null || true)"

    if [ -n "$idx" ] && [ "$idx" != "$wt" ]; then
      git cat-file -p "$idx" > "$blobdir/blob" 2>/dev/null || continue
      FORBIDDEN_ORIGIN="staged copy of "
      scan_file "$blobdir/blob" "$f" "$hashfile"
      n=$((n + 1))
    fi

    if [ -n "$hd" ] && [ "$hd" != "$wt" ] && [ "$hd" != "$idx" ]; then
      git cat-file -p "$hd" > "$blobdir/blob" 2>/dev/null || continue
      FORBIDDEN_ORIGIN="committed copy at HEAD of "
      scan_file "$blobdir/blob" "$f" "$hashfile"
      n=$((n + 1))
    fi
  done < <(git ls-files)

  FORBIDDEN_ORIGIN=""
  echo "snapshots scanned beyond the disk: $n"
}

scan_repo() {
  local n_files n_hashes bytes f

  n_files="$(git ls-files | wc -l)"
  n_hashes="$(grep -cv '^#' "$HASHES" || true)"
  # Summed file by file rather than through xargs. A tracked path deleted from the disk makes
  # `xargs stat` exit non-zero and, under `set -e`, took the whole gate down with exit 123
  # before it scanned anything. A gate that crashes is at least not a gate that lies, but it
  # still has to report; the deleted path is then caught by scan_snapshots through its index
  # copy, which is the copy that matters.
  bytes=0
  while IFS= read -r f; do
    [ -f "$f" ] || continue
    bytes=$((bytes + $(stat -c%s "$f")))
  done < <(git ls-files)
  assert_scan_inputs "$n_files" "$bytes" "$n_hashes"

  echo "scanning $n_files tracked files, $bytes bytes, against $n_hashes name hashes"
  echo "declared self-matches: ${#FORBIDDEN_EXEMPT[@]}"
  echo

  scan_worktree "$HASHES"
  scan_snapshots "$HASHES"
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
  { echo "# synthetic"; hash_token "kestrelvane"; hash_token "quillfarthing"; } > "$fake_hashes"

  # The path a probe's payload is scanned as. It is the key the declared self-matches are
  # looked up under, so a probe can be run as though its payload sat in a named gate file.
  PROBE_REL=""

  # expect: trip | pass
  probe() {  # name expect payload [exempt-entry ...]
    local name="$1" expect="$2" payload="$3"; shift 3
    local table=("$@") rc=0 rel="${PROBE_REL:-probe.txt}"
    total=$((total + 1))
    printf '%s\n' "$payload" > "$tmp/probe.txt"
    (
      FORBIDDEN_EXEMPT=(${table[@]+"${table[@]}"})
      FAILURES=0
      scan_file "$tmp/probe.txt" "$rel" "$fake_hashes" >/dev/null 2>&1
      [ "$FAILURES" -eq 0 ]
    ) || rc=$?
    if { [ "$expect" = trip ] && [ "$rc" -ne 0 ]; } || { [ "$expect" = pass ] && [ "$rc" -eq 0 ]; }; then
      echo "  [OK]   $name"
      pass=$((pass + 1))
    else
      echo "  [MISS] $name"
    fi
  }

  probe_at() {  # path name expect payload [exempt-entry ...]
    local rel="$1"; shift
    PROBE_REL="$rel"; probe "$@"; PROBE_REL=""
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

  # THE ORIGINAL DEFECT, kept as a probe rather than as a sentence in a document. On the day
  # this discipline was written, a real surname stood in exactly this position: the worked
  # example in the header of scripts/gen_forbidden_hashes.sh, showing how a register filename
  # is split into a person and an employer. The name below is invented and always will be. The
  # probe runs the payload as though it sat in that gate file, with that file's declarations
  # active, because "it is one of the gate's own files" is the excuse that would have let it
  # through and there must be no path by which it does.
  probe_at "scripts/gen_forbidden_hashes.sh" \
        "a real name in the hash generator's own worked example" 'trip' \
        '  # "Bea Quillfarthing - Kestrel Analytics.md" -> "Bea Quillfarthing". The part after " - " is an employer.' \
        "banned-word|scripts/gen_forbidden_hashes.sh|Palantir" \
        "corpus-link|scripts/gen_forbidden_hashes.sh|collection://" \
        "money|scripts/gen_forbidden_hashes.sh|€"

  probe_at "scripts/check_repo.sh" \
        "a real name in the repository gate's own source" 'trip' \
        'the register held Bea Quillfarthing, who taught in March' \
        "banned-word|scripts/check_repo.sh|Palantir" \
        "email|scripts/check_repo.sh|alguien@example.com"

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

  # THE FALSE CLEAN, kept as a probe. A name staged for commit, or already committed, while the
  # disk copy of the same path is clean. Reading the disk alone reports clean and is wrong: the
  # index is what the next commit carries and HEAD is what the repository already carries. This
  # builds a throwaway repository, puts an invented name in the index and not on the disk, and
  # requires that the disk scan finds nothing and the snapshot scan finds it. If the first half
  # of that ever starts passing on its own, this probe is the thing that will say so.
  total=$((total + 1))
  rc=0
  (
    set -e
    snap="$tmp/snaprepo"; mkdir -p "$snap"; cd "$snap"
    git init -q .
    git config user.email probe@example.com
    git config user.name probe
    printf 'nothing to see here\n' > f.txt
    git add f.txt
    git commit -qm probe
    printf 'taught by Bea Quillfarthing in March\n' > f.txt
    git add f.txt                        # the name is now in the index
    printf 'nothing to see here\n' > f.txt   # and gone from the disk again

    FORBIDDEN_EXEMPT=()
    FAILURES=0
    scan_worktree "$fake_hashes" >/dev/null 2>&1
    [ "$FAILURES" -eq 0 ] || exit 3      # the disk really is clean; that is the trap

    WORKDIR="$snap/.work"; mkdir -p "$WORKDIR"
    FAILURES=0
    scan_snapshots "$fake_hashes" >/dev/null 2>&1
    [ "$FAILURES" -gt 0 ]                # and the index is not
  ) || rc=$?
  if [ "$rc" -eq 0 ]; then
    echo "  [OK]   a name staged but not on disk was caught by the snapshot scan"
    pass=$((pass + 1))
  elif [ "$rc" -eq 3 ]; then
    echo "  [MISS] the disk scan saw a name that is not on the disk; this probe no longer tests anything"
  else
    echo "  [MISS] a name staged but absent from the disk was reported clean (exit $rc)"
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
  cd "$ROOT"
  WORKDIR="$(mktemp -d)"
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
