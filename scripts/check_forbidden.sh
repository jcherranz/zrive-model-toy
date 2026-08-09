#!/usr/bin/env bash
# The andon cord. Fetch every file this repository believes it deployed, from the public
# origin, and fail the job if any of it carries content that must never be published.
#
# WHY THE LIVE URL AND NOT THE WORKING TREE. A gate that reads local files answers "is the
# source clean", which is not the question. The question is "is the thing the public can read
# clean", and between the two sit a build step, an artifact upload, a cache and a CDN. This
# project's own record (HANSEI.md, first entry) is a site that was public when the repository
# was private, so the only reading that settles anything is a reading of the served bytes.
#
# WHAT IT CANNOT DO. GitHub Pages exposes no directory listing, so the file list comes from
# the local site/ directory: the gate checks the files the repository believes it published.
# A file served by the origin that the working tree does not know about is outside its reach.
# Stated here rather than left for a reader to discover.
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

# The only money strings this toy is allowed to carry. Both figures are invented; EUR is the
# currency label that sits beside them.
ALLOWED_MONEY=$'1.000,00\n4.000,00\nEUR'

BANNED_WORDS=(Palantir Foundry Gotham AIP Blueprint "digital twin")

MONEY_RE='(?<![\d.,])\d{1,3}(?:\.\d{3})+(?:,\d{2})?(?![\d.])|(?<![\d.,])\d{1,3}(?:,\d{3})+(?:\.\d{2})?(?![\d,])|\d[\d.,]*\s*(?:EUR|eur|€)|€|\bEUR\b|\beuros?\b'
ISO_TS_MASK='s/[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?(Z|[+-][0-9]{2}:?[0-9]{2})?/ /g'
UUID_RE='[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
EMAIL_RE='[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
COLLECTION_RE='collection://'

FAILURES=0
WORKDIR=""
cleanup() { [ -n "$WORKDIR" ] && rm -rf "$WORKDIR"; }
trap cleanup EXIT

fail() {
  FAILURES=$((FAILURES + 1))
  echo "  [FORBIDDEN] $*"
}

# All matches of a pattern in a file, deduplicated. Empty output when there are none, and no
# non-zero exit: a rule that finds nothing is a normal outcome, not an error.
collect() {
  grep -aoP "$1" "$2" | sort -u | head -20 || true
}

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

  local f w m hit rel tok h
  while IFS= read -r f; do
    rel="${f#"$dir"/}"

    # 1. words that name the vendor architecture this model was deliberately not written in
    for w in "${BANNED_WORDS[@]}"; do
      if grep -aqiP "(?<![A-Za-z])\Q${w}\E(?![A-Za-z])" "$f"; then
        fail "$rel: banned word: $w"
      fi
    done

    # 2. identifiers that would point back at the private corpus
    hit="$(collect "$COLLECTION_RE" "$f")"
    while IFS= read -r m; do [ -n "$m" ] && fail "$rel: corpus link: $m"; done <<< "$hit"

    hit="$(collect "$UUID_RE" "$f")"
    while IFS= read -r m; do [ -n "$m" ] && fail "$rel: uuid: $m"; done <<< "$hit"

    hit="$(collect "$EMAIL_RE" "$f")"
    while IFS= read -r m; do [ -n "$m" ] && fail "$rel: email address: $m"; done <<< "$hit"

    # 3. money. Anything money-shaped that is not one of the two declared invented figures.
    # An ISO 8601 instant with fractional seconds reads as a grouped figure to this pattern
    # (2026-08-09T16:42:46.932Z contains 46.932), and site/board.json carries a timestamp.
    # Timestamps are blanked out of the copy the money pattern sees, and only that copy: the
    # mask is fully anchored on digits and separators, so no euro figure can hide inside one.
    # build/safety_grep.py carries the same rule and the two must be changed together.
    hit="$(sed -E "$ISO_TS_MASK" "$f" | grep -aoP "$MONEY_RE" | sed 's/[[:space:]]*$//' | sort -u || true)"
    while IFS= read -r m; do
      [ -n "$m" ] || continue
      grep -Fxq "$m" <<< "$ALLOWED_MONEY" || fail "$rel: undeclared money figure: $m"
    done <<< "$hit"

    # 4. real names. The deployed bytes are folded into tokens and hashed the same way the
    # register was, so the gate can recognise a name it does not hold. A name that reaches
    # this branch is already public, so printing it costs nothing and naming it is the only
    # way the finding is actionable.
    while IFS= read -r tok; do
      [ -n "$tok" ] || continue
      h="$(hash_token "$tok")"
      if grep -Fxq "$h" "$hashfile"; then
        fail "$rel: real name from the faculty register: $tok"
      fi
    done < <(fold_tokens < "$f")

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
  local tmp fake_hashes rc pass=0 total=0
  WORKDIR="$(mktemp -d)"; tmp="$WORKDIR"
  fake_hashes="$tmp/hashes"
  { echo "# synthetic"; hash_token "kestrelvane"; } > "$fake_hashes"

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
