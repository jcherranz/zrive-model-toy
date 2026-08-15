#!/usr/bin/env bash
# The andon cord. Fetch every file this repository believes it deployed, over HTTP from whatever is
# serving them, and fail the job if any of it carries content that must never be published.
#
# WHY THE LIVE URL AND NOT THE WORKING TREE. A gate that reads local files answers "is the
# source clean", which is not the question. The question is "is the thing the public can read
# clean", and between the two sit a build step, an artifact upload, a cache and a CDN. This
# project's own record (HANSEI.md `2026-08-09-private-repo-public-pages`) is a site that was
# public when the repository was private, so the only reading that settles anything is a reading
# of the served bytes.
#
# WHAT IT COULD NOT DO, AND WHAT WAS DONE ABOUT IT. Issue 6. GitHub Pages exposes no directory
# listing, so this gate used to take its file list from the local site/ directory and could only
# ever check the files the working tree already knew about. A file served by the origin that the
# tree did not name was outside its reach: a stale artifact from an earlier deploy, or a path
# added by hand. The card named two candidates, a deployed manifest and accepting the gap in
# writing. Neither was taken as offered; the two blocks below are what replaced them.
#
# ONE: THE LIST COMES FROM THE COMMIT THE ORIGIN NAMES, NOT FROM THIS TREE. A manifest written at
# deploy time and read by a later run is a record of THAT DEPLOY, and a stale artifact from an
# EARLIER deploy is exactly the thing being hunted, so freshness is the whole problem and a
# committed manifest is where it bites. The origin already answers the question itself:
# site/version.js is written by .github/workflows/pages.yml at deploy time, names the commit whose
# tree went into the artifact, and that step fails the deploy unless the origin serves it back.
# So this gate reads version.js off the target, takes the sha, and lists that commit's site/ out
# of git. The list is then authoritative about the deploy that is LIVE, however many commits
# behind main it is, rather than about the last thing anybody pushed. origin_freshness reads the
# same file for the same reason.
#
# Not from the Pages API, and that was measured rather than assumed. On 2026-08-16 the origin
# served commit 48d1d17 and `GET /repos/{owner}/{repo}/pages/builds/latest` reported 3bb347a from
# three days earlier, which is the head of the gh-pages branch from a spell when the site was
# published by branch. The legacy builds endpoint does not track workflow deployments here. The
# bytes the origin hands back do.
#
# TWO: THE GHOST SWEEP, which is the half that answers the card. Enumerating the origin is still
# impossible. Enumerating what THIS REPOSITORY COULD EVER HAVE CAUSED THE ORIGIN TO SERVE is not:
# under build_type workflow the only bytes that reach the origin come from an artifact built from
# site/ at some commit, so every path any commit on any ref ever placed under site/ is a
# candidate, as is every path on a branch that has itself been a Pages source. Subtract the list
# above and probe what is left. A candidate the origin still serves is a ghost, and it is reported
# whether or not its content is forbidden, because a path the live deployment does not account for
# is a finding on its own.
#
# THE RESIDUE, because this is smaller than "the gate can now enumerate the origin". A path that
# no commit on any ref ever held cannot be a candidate and is still invisible. Reaching the origin
# at all means a deployment, and every deployment here is built by pages.yml from a checkout of
# main, so getting bytes into that class means creating a Pages deployment outside this workflow.
# That is the gap that remains, and it is narrower than the one the card described by exactly the
# stale-artifact case, which was the case the card was about.
#
# The sweep is not a claim resting on an argument. On 2026-08-13 this site was published from the
# gh-pages branch while Actions was billing-blocked, and that branch carries a .nojekyll the tree's
# site/ has never held; site/desk.js and site/graph.js were deployed earlier in main's history and
# deleted. All three are candidates the old list could not name, and all three are probed now.
#
# AND THE ONE IT COULD NOT SEE AT ALL. Only site/ is deployed, so this gate has never had an
# opinion about any other file in the repository. A real surname sat in scripts/ for a day and
# this gate was structurally incapable of noticing
# (HANSEI.md `2026-08-09-gate-scoped-to-the-public-surface`). The repository side is
# scripts/check_repo.sh; the two are complements and neither replaces the other.
#
# AND WHAT IT IS NOW ALLOWED TO SAY. Issue 107. The publication was taken down, so this gate can be
# pointed at a local server over site/ instead of at an origin, and scripts/verify.sh does exactly
# that when nothing is published. The rules and the file list are identical either way and the
# CLAIM is not: bytes fetched from somebody else's server are what the public reads, and bytes
# fetched from a server this machine started thirty seconds ago are what this tree would publish if
# anyone published it. This file prints which one it read, in the banner and in both verdicts, so
# nothing downstream has to infer it from the url. "FORBIDDEN CONTENT IS PUBLIC" is a sentence that
# has to be earned.
#
# Usage:
#   scripts/check_forbidden.sh <base-url>      fetch and scan what that url serves
#   scripts/check_forbidden.sh --self-test     prove the gate fires, one synthetic case per rule
#
# There is no default url. There used to be, and it was the published address, which stopped
# existing; a default that names a dead site turns "nothing is published" into a fetch failure
# three screens down. Run scripts/verify.sh, which finds the origin if there is one and serves
# site/ locally if there is not, or scripts/publish.sh status to see whether there is one.
#
# Env: SITE_DIR (default "site"), FETCH_ATTEMPTS (default 3), FETCH_WAIT (default 10 seconds)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/forbidden_lib.sh
. "$ROOT/scripts/forbidden_lib.sh"

SITE_DIR="${SITE_DIR:-site}"
FETCH_ATTEMPTS="${FETCH_ATTEMPTS:-3}"
FETCH_WAIT="${FETCH_WAIT:-10}"
HASHES="${FORBIDDEN_HASHES:-$ROOT/scripts/forbidden_names.sha256}"

# Branches that have been, or could be, a Pages publication source in their own right. Their
# paths sit at the root of the served site rather than under site/, so they are enumerated
# separately. gh-pages is here because it really did serve this site, not as a precaution.
PAGES_BRANCHES="${PAGES_BRANCHES:-gh-pages}"

# Paths the origin is allowed to serve without any commit having placed them there. GitHub Pages
# synthesises these; they are not artifacts of a deploy and finding one says nothing. Kept as a
# named list rather than a silent skip, because every entry is a hole in the sweep.
GHOST_ALLOW="${GHOST_ALLOW:-404.html}"

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
# Which commit the origin says it is serving.
#
# site/version.js is written by the deploy job and names the tree that went into the artifact.
# The deploy fails unless the origin serves that value back, so a version.js the origin returns
# is a claim the deploy already had to make good on. Empty output means the target did not answer
# with one, which is a fallback and not an error: the local server started by scripts/verify.sh
# serves the tree's own copy, and the tree's copy deliberately names no commit.
# ---------------------------------------------------------------------------------------
origin_commit() {
  local base="${1%/}" body
  body="$(curl -sS -L --max-time 20 "$base/version.js" 2>/dev/null || true)"
  # Two steps rather than one: the first anchors on the field name so a stray forty character
  # run elsewhere in the file cannot be read as the deploy stamp, the second lifts the value.
  printf '%s' "$body" \
    | grep -oE 'commit: "[0-9a-f]{40}"' \
    | head -1 \
    | grep -oE '[0-9a-f]{40}' || true
}

ORIGIN_SHA=""
LIST_SOURCE=""
LIST_FROM_COMMIT=0

# Decide where the list comes from, and say so. Separate from the function that emits it
# because that one is called in a command substitution, which is a subshell, and a decision
# recorded in a subshell is a decision the banner never sees.
resolve_list_source() {
  if [ -n "$ORIGIN_SHA" ] && git -C "$ROOT" cat-file -e "${ORIGIN_SHA}^{commit}" 2>/dev/null; then
    LIST_FROM_COMMIT=1
    LIST_SOURCE="the commit the origin names, ${ORIGIN_SHA:0:7}, read out of git. This is what is LIVE."
    return 0
  fi
  LIST_FROM_COMMIT=0
  if [ -n "$ORIGIN_SHA" ]; then
    LIST_SOURCE="$SITE_DIR in this tree. The origin names ${ORIGIN_SHA:0:7} and this clone does not hold that commit, so the list is this tree's and may not be the live one."
  else
    LIST_SOURCE="$SITE_DIR in this tree. The target served no deploy stamp naming a commit, so there is nothing to derive a live list from."
  fi
  [ -d "$SITE_DIR" ] || { echo "ASSERTION FAILED: no $SITE_DIR directory to take the file list from" >&2; exit 2; }
  return 0
}

# The file list, one path per line, relative to the root of the served site.
deployed_paths() {
  if [ "$LIST_FROM_COMMIT" = 1 ]; then
    git -C "$ROOT" ls-tree -r --name-only "$ORIGIN_SHA" -- "$SITE_DIR" \
      | while IFS= read -r p; do
          [ -n "$p" ] || continue
          printf '%s\n' "${p#"$SITE_DIR"/}"
        done
    return 0
  fi
  (cd "$SITE_DIR" && find . -type f -printf '%P\n')
}

# ---------------------------------------------------------------------------------------
# The ghost sweep. Every path this repository could ever have caused the origin to serve.
#
# Not an enumeration of the origin, which is impossible, and the difference is stated in the
# header. `git log --name-only` over a pathspec names a path in the commit that added it, in
# every commit that changed it and in the commit that deleted it, so a file that lived under
# site/ for one commit five hundred commits ago is in this list.
# ---------------------------------------------------------------------------------------
ghost_candidates() {
  git -C "$ROOT" log --all --pretty=format: --name-only -- "$SITE_DIR" \
    | while IFS= read -r p; do
        [ -n "$p" ] || continue
        printf '%s\n' "${p#"$SITE_DIR"/}"
      done

  # A Pages publication branch serves its own root, so its paths carry no site/ prefix and are
  # not reachable from the pathspec above. Resolved through several ref spellings because a
  # clone made by actions/checkout has the remote-tracking ref and not the local branch.
  local b r
  for b in $PAGES_BRANCHES; do
    for r in "$b" "origin/$b" "refs/remotes/origin/$b"; do
      if git -C "$ROOT" rev-parse --verify --quiet "$r" >/dev/null 2>&1; then
        git -C "$ROOT" log --pretty=format: --name-only "$r" | sed '/^$/d'
        break
      fi
    done
  done
}

GHOSTS=0

# Probe every candidate the live list does not account for. A 200 with a body is a ghost: it is
# reported as a finding of its own AND written into the scan directory, so its content goes
# through the same five rules as everything else.
ghost_sweep() {
  local base="${1%/}/" dest="$2" listfile="$3"
  local candfile="$dest.candidates" sweepfile="$dest.sweep"

  # Poka-yoke, and the one that matters most here. A shallow clone has no history to enumerate,
  # so the candidate set collapses to the files that are already being fetched and the sweep
  # probes nothing while reporting exactly as clean as a sweep that probed everything. That is
  # the dead-gate shape this repository has found six times, so it aborts instead.
  if [ "$(git -C "$ROOT" rev-parse --is-shallow-repository 2>/dev/null || echo unknown)" != "false" ]; then
    echo "ASSERTION FAILED: this clone is shallow (or is not a git repository), so the paths" >&2
    echo "  earlier deploys published cannot be enumerated and the sweep would probe nothing" >&2
    echo "  while reporting clean. Check out with fetch-depth: 0." >&2
    exit 2
  fi

  ghost_candidates | sed '/^$/d' | sort -u > "$candfile"
  local n_cand n_deployed
  n_cand="$(sort -u < "$candfile" | wc -l)"
  n_deployed="$(sort -u < "$listfile" | wc -l)"
  [ "$n_cand" -gt 0 ] || { echo "ASSERTION FAILED: no candidate paths could be enumerated from git history" >&2; exit 2; }

  # Every path in the live list is a path some commit placed under site/, so the enumeration
  # has to contain all of them. If it does not, it did not read the history it thinks it did.
  local missing
  missing="$(comm -23 <(sort -u < "$listfile") "$candfile" | head -5)"
  if [ -n "$missing" ]; then
    echo "ASSERTION FAILED: the candidate enumeration does not contain paths that are being" >&2
    echo "  served right now, so it is not reading this repository's history:" >&2
    printf '    %s\n' $missing >&2
    exit 2
  fi

  # The sweep set: candidates the live deployment does not account for, less the paths Pages
  # synthesises for itself.
  comm -23 "$candfile" <(sort -u < "$listfile") \
    | while IFS= read -r p; do
        case " $GHOST_ALLOW " in *" $p "*) continue ;; esac
        printf '%s\n' "$p"
      done > "$sweepfile"

  local n_sweep
  n_sweep="$(wc -l < "$sweepfile")"
  echo "ghost sweep: $n_cand path(s) this repository has ever published, $n_deployed accounted for"
  echo "             by the live deployment, $n_sweep probed for a body the deployment does not explain"

  if [ "$n_sweep" -eq 0 ]; then
    echo "  nothing to probe: every path any ref ever published is in the live deployment."
    return 0
  fi

  local p code size
  while IFS= read -r p; do
    [ -n "$p" ] || continue
    mkdir -p "$dest/$(dirname "$p")"
    code="$(curl -sS -L -o "$dest/$p.ghost" -w '%{http_code}' "$base$p" 2>/dev/null || echo 000)"
    size=0
    [ -f "$dest/$p.ghost" ] && size="$(stat -c%s "$dest/$p.ghost")"
    if [ "$code" = "200" ] && [ "$size" -gt 0 ]; then
      GHOSTS=$((GHOSTS + 1))
      echo "  [GHOST] $p: served HTTP 200, $size bytes, and the live deployment does not include it"
      # Left in place so scan_dir reads it. A ghost is a finding whatever it holds, and what it
      # holds is a second, worse finding.
    else
      rm -f "$dest/$p.ghost"
      printf '  gone    %-20s HTTP %s\n' "$p" "$code"
    fi
  done < "$sweepfile"
}

# ---------------------------------------------------------------------------------------
# Live mode: fetch what was deployed.
# ---------------------------------------------------------------------------------------
fetch_deployed() {
  local base="$1" dest="$2" listfile="$3"

  local paths
  paths="$(deployed_paths | sed '/^$/d' | sort)"
  [ -n "$paths" ] || { echo "ASSERTION FAILED: the file list is empty ($LIST_SOURCE)" >&2; exit 2; }
  printf '%s\n' "$paths" > "$listfile"
  echo "  file list from: $LIST_SOURCE"
  echo

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
#
# HOW MANY PROBES THIS SUITE INTENDS, WRITTEN DOWN BY HAND. Issue 103, and the same terminator
# scripts/check_repo.sh now carries and scripts/smoke.mjs has carried since issue 67. `total` is
# incremented by each probe as it executes, so `pass -eq total` holds however many probes were
# deleted, commented out or never reached, and a suite emptied one probe at a time keeps
# printing a clean ratio down to 0/0. A count taken from the run cannot notice a probe that did
# not run, so this one is not taken from the run. Moving a probe means moving this number.
#
# A short run exits 2, which is "the suite could not answer for itself" and not "the gate is
# broken"; a run that also recorded a MISS reports the MISS and exits 1.
EXPECTED_PROBES=24

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
  # The three rules issue 117 added to the library, each one a hole the local Python gate over
  # site/ already covered and these two gates did not. Every payload is BUILT rather than typed,
  # for the reason the uuid cap probe in scripts/check_repo.sh gives: a complete literal here is
  # a payload the repository gate then finds in this file and somebody has to declare.
  local hex16='0123456789abcdef' dot='.'
  probe "a bare page id, unhyphenated" "page ${hex16}${hex16} in the export" "$fake_hashes"
  probe "the corpus host"          "see notion${dot}so/a-page for the source" "$fake_hashes"
  # The money rule allows whitespace between a figure and its currency mark, and a line break is
  # whitespace, so this is one match to a reader of the whole file. grep reads a line at a time,
  # so it was two clean lines to these gates and one finding to the Python copy. The pattern is
  # not quoted here: this file carries no rule literal of its own, which is a property the
  # repository gate checks rather than a convention, and quoting it once already broke it.
  probe "a figure split across a line break" 'the amount 1200'$'\n''EUR was paid' "$fake_hashes"

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

  # -------------------------------------------------------------------------------------
  # The ghost sweep, issue 6. Everything above proves a RULE fires against bytes already in
  # hand. These prove the gate can be handed bytes it was never told to ask for, which is the
  # thing the card is about, and they do it by planting one and serving it.
  #
  # Every probe here runs against a real server on a loopback port rather than against a stub,
  # because the sweep's whole content is an HTTP question: does this path answer 200 with a
  # body. A stubbed curl would prove the bookkeeping and not the gate.
  # -------------------------------------------------------------------------------------
  echo
  echo "self-test: the ghost sweep (issue 6)"

  # A server over a directory, on a free port. Echoes the base url; empty on failure.
  local GHOST_SRV_PID=""
  serve_dir() {
    local dir="$1" port i code
    port="$(python3 -c 'import socket
s = socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()' 2>/dev/null)" || return 1
    [ -n "$port" ] || return 1
    python3 -m http.server "$port" --bind 127.0.0.1 --directory "$dir" >/dev/null 2>&1 &
    GHOST_SRV_PID=$!
    for i in $(seq 1 40); do
      code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 3 \
              "http://127.0.0.1:$port/index.html" 2>/dev/null || echo 000)"
      [ "$code" = "200" ] && { printf 'http://127.0.0.1:%s/\n' "$port"; return 0; }
      kill -0 "$GHOST_SRV_PID" 2>/dev/null || break
      sleep 0.25
    done
    return 1
  }
  stop_srv() {
    [ -n "$GHOST_SRV_PID" ] || return 0
    kill "$GHOST_SRV_PID" 2>/dev/null
    wait "$GHOST_SRV_PID" 2>/dev/null
    GHOST_SRV_PID=""
    return 0
  }

  # The served directory. index.html is the accounted-for file; the list names only it, so
  # anything else this directory holds is by construction a path the deployment does not
  # explain. `zz-leftover.js` stands in for a file an earlier deploy published and the live one
  # does not, which is the case the card names.
  local g="$tmp/ghostsite"; mkdir -p "$g"
  printf '%s\n' '<!doctype html><title>probe</title>' > "$g/index.html"
  local glist="$tmp/ghost.list"
  printf '%s\n' 'index.html' > "$glist"

  # The candidate enumeration is this repository's history in the live gate, and a probe that
  # used it would be testing whichever files happen to have been deleted from site/ this month.
  # Overriding it with a fixed pair keeps the probes about the SWEEP: one path that is served
  # and one that is not, so the trip and the negative control differ in the planted file alone.
  ghost_candidates() { printf '%s\n%s\n' 'index.html' 'zz-leftover.js'; }

  # 1. NO GHOST. The negative control, and it runs first on purpose: if this one tripped, the
  #    probe below would be passing for a reason that has nothing to do with the plant.
  total=$((total + 1))
  local gbase
  rc=0
  gbase="$(serve_dir "$g")" || rc=9
  if [ "$rc" -ne 0 ]; then
    echo "  [MISS] the ghost sweep control could not start a server, so it proved nothing"
  else
    local gdest="$tmp/gdest1"; mkdir -p "$gdest"
    rc=0
    ( GHOSTS=0; ghost_sweep "$gbase" "$gdest" "$glist" >/dev/null 2>&1; [ "$GHOSTS" -eq 0 ] ) || rc=$?
    stop_srv
    if [ "$rc" -eq 0 ]; then
      echo "  [OK]   a candidate the server does not serve was not reported as a ghost"
      pass=$((pass + 1))
    else
      echo "  [MISS] the sweep reported a ghost with nothing planted (exit $rc)"
    fi
  fi

  # 2. THE PLANT. The same directory, the same list, the same candidate pair, plus the file.
  printf '%s\n' 'window.ZZ = 1;' > "$g/zz-leftover.js"
  total=$((total + 1))
  rc=0
  gbase="$(serve_dir "$g")" || rc=9
  if [ "$rc" -ne 0 ]; then
    echo "  [MISS] the ghost sweep probe could not start a server, so it proved nothing"
  else
    local gdest2="$tmp/gdest2"; mkdir -p "$gdest2"
    rc=0
    ( GHOSTS=0; ghost_sweep "$gbase" "$gdest2" "$glist" >/dev/null 2>&1; [ "$GHOSTS" -eq 0 ] ) || rc=$?
    stop_srv
    if [ "$rc" -ne 0 ]; then
      echo "  [OK]   a path the file list does not name, served, was caught as a ghost"
      pass=$((pass + 1))
    else
      echo "  [MISS] a served path outside the file list was NOT caught"
    fi
  fi

  # 3. AND ITS BYTES GO THROUGH THE RULES. Catching the path is half of it. A ghost is pulled
  #    into the scan directory so the five rules read it like any other file, and a ghost
  #    carrying something forbidden has to produce a content finding as well as a [GHOST] line.
  printf '%s\n' 'window.ZZ = "turnover of 1.138.000,00 EUR";' > "$g/zz-leftover.js"
  total=$((total + 1))
  rc=0
  gbase="$(serve_dir "$g")" || rc=9
  if [ "$rc" -ne 0 ]; then
    echo "  [MISS] the ghost content probe could not start a server, so it proved nothing"
  else
    local gdest3="$tmp/gdest3"; mkdir -p "$gdest3"
    # COUNT THE FINDINGS, DO NOT JUST TAKE A NON-ZERO EXIT. A sweep that fetched nothing leaves
    # this directory empty, scan_dir's empty-input assertion then exits 2, and a probe reading
    # "did something fail" would call that a pass: the gate would be dead and this probe green.
    # Measured, not imagined. With ghost_sweep stubbed to return immediately, the first version
    # of this probe reported [OK]. So the subshell prints the finding count and the probe
    # requires at least one, which an aborted scan cannot produce because it never prints.
    local found
    found="$( ( GHOSTS=0; FAILURES=0
                ghost_sweep "$gbase" "$gdest3" "$glist" >/dev/null 2>&1
                scan_dir "$gdest3" "$fake_hashes" >/dev/null 2>&1
                printf '%s' "$FAILURES" ) 2>/dev/null || true )"
    stop_srv
    if [ -n "$found" ] && [ "$found" -ge 1 ] 2>/dev/null; then
      echo "  [OK]   the ghost's own bytes were scanned and the figure in them was found"
      pass=$((pass + 1))
    else
      echo "  [MISS] a ghost carrying an undeclared figure was fetched and never read (findings: ${found:-none, the scan never completed})"
    fi
  fi

  unset -f ghost_candidates

  # 4. THE DEAD-GATE GUARD. A shallow clone has no history, so the candidate set collapses to
  #    the files already being fetched and the sweep probes nothing while printing the same
  #    clean line as a sweep that probed everything. That is the shape of every dead instrument
  #    this repository has found, so it has to abort. Proved against a purpose-built two commit
  #    repository rather than against this one, so the probe costs no clone of 500 commits.
  total=$((total + 1))
  local deep="$tmp/deep" shal="$tmp/shal"
  rc=0
  (
    set -e
    mkdir -p "$deep/$SITE_DIR"
    git -C "$deep" init -q
    git -C "$deep" config user.email probe@example.invalid
    git -C "$deep" config user.name probe
    echo one > "$deep/$SITE_DIR/index.html"
    git -C "$deep" add -A && git -C "$deep" commit -qm one
    echo two > "$deep/$SITE_DIR/index.html"
    git -C "$deep" add -A && git -C "$deep" commit -qm two
    git clone -q --depth 1 "file://$deep" "$shal"
  ) >/dev/null 2>&1 || rc=9
  if [ "$rc" -ne 0 ]; then
    echo "  [MISS] the shallow-clone probe could not build its fixture, so it proved nothing"
  else
    # Confirm the fixture is actually shallow. A probe whose fixture silently came out full
    # would report the abort missing and blame the gate.
    if [ "$(git -C "$shal" rev-parse --is-shallow-repository)" != "true" ]; then
      echo "  [MISS] the shallow-clone probe built a fixture that is not shallow"
    else
      rc=0
      ( ROOT="$shal"; ghost_sweep "http://127.0.0.1:1/" "$tmp/gdest4" "$glist" >/dev/null 2>&1 ) || rc=$?
      if [ "$rc" -eq 2 ]; then
        echo "  [OK]   a shallow clone aborted instead of sweeping nothing and reporting clean"
        pass=$((pass + 1))
      else
        echo "  [MISS] a shallow clone did not abort (exit $rc); the sweep would be dead there"
      fi
    fi
  fi

  # 5. THE DEPLOY STAMP, which is what makes the file list a list of what is LIVE rather than of
  #    what this tree holds. Both directions: a body carrying a stamp yields the sha, and a body
  #    carrying none yields nothing, so the fallback is reachable and the banner can say so.
  total=$((total + 1))
  local stamped="$tmp/stamp"; mkdir -p "$stamped"
  local want="0123456789abcdef0123456789abcdef01234567"
  printf 'window.ZV = { commit: "%s", deployedAt: "2026-01-01T00:00:00Z" };\n' "$want" \
    > "$stamped/version.js"
  printf '%s\n' '<!doctype html><title>probe</title>' > "$stamped/index.html"
  rc=0
  gbase="$(serve_dir "$stamped")" || rc=9
  if [ "$rc" -ne 0 ]; then
    echo "  [MISS] the deploy stamp probe could not start a server, so it proved nothing"
  else
    local got_with got_without
    got_with="$(origin_commit "$gbase")"
    printf '%s\n' 'window.ZV = { commit: "no deploy stamp" };' > "$stamped/version.js"
    got_without="$(origin_commit "$gbase")"
    stop_srv
    if [ "$got_with" = "$want" ] && [ -z "$got_without" ]; then
      echo "  [OK]   the stamp was read off the server, and a body without one yielded nothing"
      pass=$((pass + 1))
    else
      echo "  [MISS] the stamp reader returned '$got_with' and '$got_without'"
    fi
  fi

  echo
  echo "self-test: $pass/$total, of $EXPECTED_PROBES intended"
  local short=0
  if [ "$total" -ne "$EXPECTED_PROBES" ]; then
    short=1
    echo
    echo "ASSERTION FAILED: this suite intends $EXPECTED_PROBES probes and $total ran."
    echo "A ratio is not a count. Either a probe stopped running and the rule it proved is now"
    echo "proved by nothing, or one was added and EXPECTED_PROBES was not moved with it."
  fi
  if [ "$pass" -ne "$total" ]; then
    return 1
  fi
  [ "$short" -eq 0 ] || return 2
  return 0
}

# ---------------------------------------------------------------------------------------
main() {
  if [ "${1:-}" = "--self-test" ]; then
    self_test
    exit $?
  fi

  local base="${1:-}"
  if [ -z "$base" ]; then
    echo "ASSERTION FAILED: no url given, and this gate has no default." >&2
    echo "  It reads bytes back over HTTP and there is nothing to read without a target." >&2
    echo "  scripts/verify.sh finds the origin if there is one and serves site/ locally if" >&2
    echo "  there is not; scripts/publish.sh status says which of those is the case." >&2
    exit 2
  fi
  local tmp; WORKDIR="$(mktemp -d)"; tmp="$WORKDIR"

  # Somebody else's server, or this machine's. Every sentence below turns on this and on nothing
  # else, and it is decided from the url rather than from how the caller described it.
  local kind
  case "$base" in
    http://127.0.0.1[:/]*|http://127.0.0.1|http://localhost[:/]*|http://localhost|http://\[::1\]*)
      kind=local ;;
    *) kind=remote ;;
  esac

  echo "gate: forbidden content, against served bytes"
  echo "  target: $base"
  if [ "$kind" = remote ]; then
    echo "  which is: a remote server. What it returns is what the public reads."
  else
    echo "  which is: a server on this machine. What it returns is what this tree WOULD publish."
    echo "            Nothing here is evidence about anything that is actually published."
  fi
  # Ask the target which commit it is serving before anything else, because the answer decides
  # what the file list is a list OF. A local server over site/ answers nothing, which is correct:
  # the tree's copy of version.js names no commit, and a list taken from the tree is the honest
  # list for a server that is serving the tree.
  ORIGIN_SHA="$(origin_commit "$base")"
  if [ -n "$ORIGIN_SHA" ]; then
    echo "  it says it is serving: ${ORIGIN_SHA:0:7}  (from its own version.js)"
  else
    echo "  it says it is serving: nothing. It served no version.js naming a commit."
  fi
  resolve_list_source
  echo
  fetch_deployed "$base" "$tmp" "$tmp.list"
  echo
  ghost_sweep "$base" "$tmp" "$tmp.list"
  echo
  scan_dir "$tmp" "$HASHES"

  echo
  # A ghost is reported apart from a content finding because the two are different sentences and
  # a reader has to be able to tell them apart. "Something forbidden is public" is about what the
  # bytes say. "The origin is serving a path the live deployment does not include" is about the
  # origin holding something nobody deployed, and it is a finding even when the bytes are clean.
  if [ "$GHOSTS" -gt 0 ]; then
    if [ "$kind" = remote ]; then
      echo "VERDICT: THE ORIGIN IS SERVING $GHOSTS PATH(S) THE LIVE DEPLOYMENT DOES NOT ACCOUNT FOR"
      echo "Every one is listed above as [GHOST]. Its content was scanned with the rest and any"
      echo "finding in it is in the list below; a clean ghost is still a ghost. Something has put"
      echo "bytes at this origin outside the deploy that is live, so treat the origin as unknown"
      echo "until it is redeployed and this comes back to zero."
    else
      echo "VERDICT: THIS SERVER IS SERVING $GHOSTS PATH(S) THE FILE LIST DOES NOT ACCOUNT FOR"
      echo "Against a server on this machine that means the directory holds a file the list does"
      echo "not, which is a finding about this tree and not about anything published."
    fi
    if [ "$FAILURES" -gt 0 ]; then
      echo
      echo "AND $FAILURES forbidden-content finding(s) as well."
    fi
    exit 1
  fi
  if [ "$FAILURES" -eq 0 ]; then
    if [ "$kind" = remote ]; then
      echo "VERDICT: clean. Nothing forbidden is being served by $base, and it serves nothing"
      echo "         outside the deployment it says is live, of the paths this repository has"
      echo "         ever published. It could still serve a path no commit here ever held."
    else
      echo "VERDICT: clean. Nothing forbidden is in the bytes $base served, which are this tree's."
      echo "         This says nothing about what is published, and nothing was published to ask."
    fi
    exit 0
  fi
  if [ "$kind" = remote ]; then
    echo "VERDICT: FORBIDDEN CONTENT IS PUBLIC ($FAILURES findings)"
    echo "Pull the cord: unpublish first, diagnose second."
  else
    echo "VERDICT: FORBIDDEN CONTENT IS IN THE BYTES THIS TREE WOULD PUBLISH ($FAILURES findings)"
    echo "Nothing is published, so nothing is exposed yet. Fix it before anything is."
  fi
  exit 1
}

main "$@"
