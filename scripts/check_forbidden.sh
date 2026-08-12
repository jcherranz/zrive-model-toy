#!/usr/bin/env bash
# The andon cord. Fetch every file this repository believes it deployed, from the public
# origin, and fail the job if any of it carries content that must never be published.
#
# WHY THE LIVE URL AND NOT THE WORKING TREE. A gate that reads local files answers "is the
# source clean", which is not the question. The question is "is the thing the public can read
# clean", and between the two sit a build step, an artifact upload, a cache and a CDN. This
# project's own record (HANSEI.md `2026-08-09-private-repo-public-pages`) is a site that was
# public when the repository was private, so the only reading that settles anything is a reading
# of the served bytes.
#
# WHAT IT CANNOT DO. GitHub Pages exposes no directory listing, so the file list comes from
# the local site/ directory: the gate checks the files the repository believes it published.
# A file served by the origin that the working tree does not know about is outside its reach.
# Stated here rather than left for a reader to discover.
#
# AND THE ONE IT COULD NOT SEE AT ALL. Only site/ is deployed, so this gate has never had an
# opinion about any other file in the repository. A real surname sat in scripts/ for a day and
# this gate was structurally incapable of noticing
# (HANSEI.md `2026-08-09-gate-scoped-to-the-public-surface`). The repository side is
# scripts/check_repo.sh; the two are complements and neither replaces the other.
#
# Usage:
#   scripts/check_forbidden.sh [base-url]      fetch and scan the deployed site
#   scripts/check_forbidden.sh --self-test     prove the gate fires, one synthetic case per rule
#
# Env: SITE_DIR (default "site"), FETCH_ATTEMPTS (default 3), FETCH_WAIT (default 10 seconds)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/forbidden_lib.sh
. "$ROOT/scripts/forbidden_lib.sh"

BASE_URL_DEFAULT="https://jcherranz.github.io/zrive-model-toy/"
SITE_DIR="${SITE_DIR:-site}"
FETCH_ATTEMPTS="${FETCH_ATTEMPTS:-3}"
FETCH_WAIT="${FETCH_WAIT:-10}"
HASHES="${FORBIDDEN_HASHES:-$ROOT/scripts/forbidden_names.sha256}"

# The rules themselves (banned words, the money pattern, the timestamp mask, the identifier
# patterns, the allowed money figures) live in scripts/forbidden_lib.sh, sourced above, and
# nowhere else, so this gate and scripts/check_repo.sh cannot drift apart. This file carries
# no rule literal of its own; the strings below the self-test banner are synthetic payloads.

WORKDIR=""
# `return 0` is load-bearing: an EXIT trap ending on a failed command hands its own status to
# the shell. Latent here, because every path through this script sets WORKDIR first, and fixed
# anyway rather than left resting on that.
cleanup() { [ -n "$WORKDIR" ] && rm -rf "$WORKDIR"; return 0; }
trap cleanup EXIT

# ---------------------------------------------------------------------------------------
# The scan. One code path, used by the live check and by the self-test, so the self-test
# exercises the rules that actually run rather than a second copy of them.
# ---------------------------------------------------------------------------------------
scan_dir() {
  local dir="$1"
  local hashfile="$2"

  local n_files n_hashes bytes
  n_files="$(find "$dir" -type f | wc -l)"
  n_hashes="$(grep -cv '^#' "$hashfile" || true)"
  bytes="$(find "$dir" -type f -printf '%s\n' | awk '{s+=$1} END {print s+0}')"

  # Poka-yoke. A gate handed nothing to scan reports clean, which is the loudest lie it can
  # tell. Assert the inputs and throw; never fall back to an empty list (HANSEI.md, "A
  # workflow ran on an empty input and reported success").
  [ "$n_files" -gt 0 ]  || { echo "ASSERTION FAILED: no files to scan in $dir" >&2; exit 2; }
  [ "$bytes"   -gt 0 ]  || { echo "ASSERTION FAILED: $n_files files, 0 bytes total" >&2; exit 2; }
  [ "$n_hashes" -gt 0 ] || { echo "ASSERTION FAILED: name hash list $hashfile is empty" >&2; exit 2; }

  echo "scanning $n_files files, $bytes bytes, against $n_hashes name hashes"
  echo

  # The five rules are scan_file in scripts/forbidden_lib.sh, shared with the repository gate.
  # A name that reaches this gate is already public, so FORBIDDEN_NAME_ECHO stays 1 and the
  # token is printed: naming it is the only way the finding is actionable.
  local f rel
  while IFS= read -r f; do
    rel="${f#"$dir"/}"
    scan_file "$f" "$rel" "$hashfile"
  done < <(find "$dir" -type f | sort)
}

# ---------------------------------------------------------------------------------------
# Live mode: fetch what was deployed.
# ---------------------------------------------------------------------------------------
fetch_deployed() {
  local base="$1" dest="$2"

  [ -d "$SITE_DIR" ] || { echo "ASSERTION FAILED: no $SITE_DIR directory to take the file list from" >&2; exit 2; }

  local paths
  paths="$(cd "$SITE_DIR" && find . -type f -printf '%P\n' | sort)"
  [ -n "$paths" ] || { echo "ASSERTION FAILED: $SITE_DIR holds no files" >&2; exit 2; }

  base="${base%/}/"
  local p attempt code ok
  while IFS= read -r p; do
    ok=0
    for attempt in $(seq 1 "$FETCH_ATTEMPTS"); do
      mkdir -p "$dest/$(dirname "$p")"
      code="$(curl -sS -L -o "$dest/$p" -w '%{http_code}' "$base$p" || echo 000)"
      if [ "$code" = "200" ] && [ -s "$dest/$p" ]; then ok=1; break; fi
      echo "  fetch $p -> HTTP $code (attempt $attempt/$FETCH_ATTEMPTS)" >&2
      [ "$attempt" -lt "$FETCH_ATTEMPTS" ] && sleep "$FETCH_WAIT"
    done
    [ "$ok" = 1 ] || { echo "ASSERTION FAILED: $base$p did not serve 200 with a body" >&2; exit 2; }
    printf '  fetched %-16s %8s bytes\n' "$p" "$(stat -c%s "$dest/$p")"
  done <<< "$paths"
}

# ---------------------------------------------------------------------------------------
# Self-test: one synthetic payload per rule, each of which MUST trip the gate.
#
# The name rule is proved against a synthetic hash list holding one made-up token, not
# against the real register: proving the matcher works must not require a real name to exist
# anywhere in this repository, in a temporary file or in a log.
# ---------------------------------------------------------------------------------------
self_test() {
  local tmp fake_hashes whole_hashes rc pass=0 total=0
  WORKDIR="$(mktemp -d)"; tmp="$WORKDIR"
  fake_hashes="$tmp/hashes"
  { echo "# synthetic"; hash_token "kestrelvane"; } > "$fake_hashes"
  # A second synthetic register holding ONLY a token that has an internal case boundary, so the
  # probe below can prove the decomposition is additive. Against this list a folding that
  # replaced a run of letters with its pieces would find nothing, and the probe would miss.
  whole_hashes="$tmp/hashes-whole"
  { echo "# synthetic"; hash_token "mcquillfarthing"; } > "$whole_hashes"

  probe() {
    local name="$1" payload="$2" hashes="$3"
    total=$((total + 1))
    local d="$tmp/case"; rm -rf "$d"; mkdir -p "$d"
    printf '%s\n' "$payload" > "$d/probe.txt"
    rc=0
    ( FAILURES=0; scan_dir "$d" "$hashes" >/dev/null 2>&1; [ "$FAILURES" -eq 0 ] ) || rc=$?
    if [ "$rc" -ne 0 ]; then
      echo "  [OK]   $name tripped the gate"
      pass=$((pass + 1))
    else
      echo "  [MISS] $name did NOT trip the gate"
    fi
  }

  echo "self-test: each probe below MUST trip the gate"
  probe "banned word (Palantir)"   'built on Palantir, allegedly'            "$fake_hashes"
  probe "banned word (digital twin)" 'a digital twin of the operation'       "$fake_hashes"
  probe "corpus link"              'see collection://a1b2c3 for the source'  "$fake_hashes"
  probe "uuid"                     'id 3f2504e0-4f89-11d3-9a0c-0305e82c3301' "$fake_hashes"
  probe "email address"            'contact alguien@example.com for detail'  "$fake_hashes"
  probe "undeclared money figure"  'turnover of 1.138.000,00 EUR last year'  "$fake_hashes"
  probe "real name (synthetic)"    'taught by Ada Kestrelvane in March'      "$fake_hashes"
  # The folding cuts a run of letters at its case boundaries, so a name concatenated with
  # another word or with an acronym is decomposed and each piece is checked. The first two
  # payloads passed this gate before the case boundaries were added; the third did not, because
  # a digit was already a separator, and it is here to keep that true rather than to report new
  # coverage.
  probe "camelCase concatenation"  'the handle quillfarthingKestrelvane in a log line' "$fake_hashes"
  probe "acronym glued to a name"  'the ZBLKestrelvane row of the export'    "$fake_hashes"
  probe "digit glued to a name"    'user Kestrelvane2026 signed the record'  "$fake_hashes"
  # Additive, proved rather than asserted: against a register that holds only the joined form,
  # the whole run must still be emitted and still match.
  probe "a name matchable only whole" 'Mcquillfarthing taught in March'      "$whole_hashes"

  echo
  echo "self-test: the probes below MUST NOT trip the gate"
  local d="$tmp/clean"; mkdir -p "$d"
  printf '%s\n' 'total_price 4.000,00 EUR and amount_claimed 1.000,00 EUR, --lh-ui: 1.28581' > "$d/probe.txt"
  total=$((total + 1))
  rc=0
  ( FAILURES=0; scan_dir "$d" "$fake_hashes" >/dev/null 2>&1; [ "$FAILURES" -eq 0 ] ) || rc=$?
  if [ "$rc" -eq 0 ]; then
    echo "  [OK]   the two declared invented figures passed"
    pass=$((pass + 1))
  else
    echo "  [MISS] the two declared invented figures were rejected"
  fi

  # The other direction of the case-boundary folding. A finer net is only worth having if it
  # still passes the code it has to read, and site/ is written in camelCase throughout, so the
  # decomposition runs on every identifier on the page.
  local c="$tmp/camel"; mkdir -p "$c"
  printf '%s\n' 'document.getElementById(id); ZT.termRoutes(); new XMLHttpRequest(); bandPlate' > "$c/probe.txt"
  total=$((total + 1))
  rc=0
  ( FAILURES=0; scan_dir "$c" "$fake_hashes" >/dev/null 2>&1; [ "$FAILURES" -eq 0 ] ) || rc=$?
  if [ "$rc" -eq 0 ]; then
    echo "  [OK]   ordinary camelCase identifiers passed"
    pass=$((pass + 1))
  else
    echo "  [MISS] ordinary camelCase identifiers were rejected"
  fi

  # The timestamp mask, in both directions: a fractional-second instant must not read as
  # money, and masking it must not hide a real figure sitting next to one.
  local t="$tmp/ts"; mkdir -p "$t"
  printf '%s\n' '{"generated":"2026-08-09T16:42:46.932Z"}' > "$t/probe.txt"
  total=$((total + 1))
  rc=0
  ( FAILURES=0; scan_dir "$t" "$fake_hashes" >/dev/null 2>&1; [ "$FAILURES" -eq 0 ] ) || rc=$?
  if [ "$rc" -eq 0 ]; then
    echo "  [OK]   a fractional-second timestamp did not read as money"
    pass=$((pass + 1))
  else
    echo "  [MISS] a fractional-second timestamp was read as money"
  fi

  rm -rf "$t"; mkdir -p "$t"
  printf '%s\n' '{"generated":"2026-08-09T16:42:46.932Z","fee":"2.750,00 EUR"}' > "$t/probe.txt"
  total=$((total + 1))
  rc=0
  ( FAILURES=0; scan_dir "$t" "$fake_hashes" >/dev/null 2>&1; [ "$FAILURES" -eq 0 ] ) || rc=$?
  if [ "$rc" -ne 0 ]; then
    echo "  [OK]   the mask did not hide a real figure beside a timestamp"
    pass=$((pass + 1))
  else
    echo "  [MISS] a real figure beside a timestamp went unseen"
  fi

  # The empty-input assertion: an empty directory must abort, not report clean.
  total=$((total + 1))
  local e="$tmp/empty"; mkdir -p "$e"
  rc=0
  ( scan_dir "$e" "$fake_hashes" >/dev/null 2>&1 ) || rc=$?
  if [ "$rc" -eq 2 ]; then
    echo "  [OK]   an empty payload aborted instead of reporting clean"
    pass=$((pass + 1))
  else
    echo "  [MISS] an empty payload did not abort (exit $rc)"
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

  local base="${1:-$BASE_URL_DEFAULT}"
  local tmp; WORKDIR="$(mktemp -d)"; tmp="$WORKDIR"

  echo "gate: forbidden content, against deployed bytes"
  echo "  origin: $base"
  echo "  file list from: $SITE_DIR"
  echo
  fetch_deployed "$base" "$tmp"
  echo
  scan_dir "$tmp" "$HASHES"

  echo
  if [ "$FAILURES" -eq 0 ]; then
    echo "VERDICT: clean"
    exit 0
  fi
  echo "VERDICT: FORBIDDEN CONTENT IS PUBLIC ($FAILURES findings)"
  echo "Pull the cord: unpublish first, diagnose second."
  exit 1
}

main "$@"
