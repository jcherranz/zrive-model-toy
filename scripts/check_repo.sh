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
# independent scan of tracked files. HANSEI.md `2026-08-09-gate-scoped-to-the-public-surface`.
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
# THE CITATION RULE, which is about documentation rather than about content. HANSEI.md and
# KAIZEN.md entries are cited from prose and from code, and until issue 54 they were cited by
# ordinal: "HANSEI.md, sixth entry". HANSEI is append-only, so an ordinal into it only rots
# slowly. KAIZEN is not, and two changelog entries citing "KAIZEN.md, last entry" already meant
# two different lessons, so appending one bullet repointed both, with nothing failing and no
# diff on either citing line. Entries carry slugs now and citations name the slug, and this
# gate checks that every slug cited anywhere in the repository resolves to an entry that
# exists. See scan_citations below for what counts as a definition and what counts as a
# citation.
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
# rule is one of: banned-word, corpus-link, uuid, email, money, citation.  There is
# deliberately no real-name rule here and an assertion below refuses one.
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
  # 1.538 is an item count from `2026-08-09-private-repo-public-pages`. Both are declared per
  # file, so the same string appearing anywhere else in the repository still fails.
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

  # The citation self-test needs slugs that resolve and slugs that do not, and it has to spell
  # them in this file for the probes to carry them. Each is declared at this path and nowhere
  # else, so the same invented slug cited from a document still fails, which is the case that
  # matters. Nothing here is a real entry in either document and nothing here ever should be.
  "citation|scripts/check_repo.sh|2026-08-10-a-real-entry"
  "citation|scripts/check_repo.sh|2026-08-10-no-such-entry"
  "citation|scripts/check_repo.sh|kaizen-no-such-lesson"
)

# ---------------------------------------------------------------------------------------
# THE CONTRAST RULE, which is about a drawing rather than about content.
#
# WHY IT IS HERE AND NOT IN THE BUILD. The thirteen type colours live in build/model.py and
# reach the page through site/graph.js, so the build is where they are known and would be the
# obvious home. It is the wrong one, for a reason that is about this repository and not about
# taste: no workflow runs the build. site/graph.js is committed and pages.yml deploys it as it
# stands, so a check inside build/build_layout.py runs only when somebody rebuilds, which is
# exactly the person who already knows what they changed. This script runs on every push and
# every pull request, it already carries a declared-exception mechanism with a staleness rule,
# and it already has a self-test. All three are needed here on the first day.
#
# The split is therefore: build/model.py computes, because that is where the colours and the
# stylesheet are; this file decides, because this is what runs. `model.py --contrast` emits one
# row per type per ground and holds no threshold and no verdict.
#
# WHAT THIS DOES NOT CHECK, said here rather than left to be discovered. It measures the palette
# in the model. Nothing in CI rebuilds site/graph.js and compares it, so a colour hand edited
# into the drawing and not into the model would be measured by nobody. That hole is older than
# this rule and wider than it, and closing it is a build-reproducibility card rather than a
# contrast one.
#
# WHAT IS MEASURED, AND ON WHAT. A tile's stroke, at full opacity, against the band plate it
# sits on. Not against the page ground: app.js fills one opaque `rect.band` per lane before it
# draws a tile and every tile is laid out inside a lane, so the plate is the surface, and the
# two differ enough to move three of the twenty-six verdicts, in both directions. The rows carry
# the page ground as well and the run prints how far apart the two answers are, so the choice
# stays visible rather than becoming a thing somebody once decided.
#
# THE THRESHOLD is 3:1, WCAG 2.2 SC 1.4.11 Non-text Contrast, which is the figure for the visual
# boundary of a user interface component and for a graphical object needed to understand the
# content. A tile is both: it takes focus, it takes a click, it opens the panel, and its outline
# is what a reader tells one type from another by. It is not 4.5:1, which is SC 1.4.3 and about
# text; the same colours are also written as 11px bold text in the panel and eight of the
# thirteen are under 4.5:1 there, which is real, is issue 56's card, and is not what a check on
# a stroke can honestly claim to have gated. It is not lower than 3:1 either. Six of the
# twenty-six measurements fail today and every one of them is declared below rather than
# legalised by moving the line.
#
# The comparison is on the figure the table prints, to four decimals, so a verdict can always be
# reproduced from what is on the screen and no rounding stands between the two.
CONTRAST_MIN="3.0000"

# ---------------------------------------------------------------------------------------
# DECLARED CONTRAST EXCEPTIONS.  type|ground|hex|ratio|why it is tolerated
#
# The same shape and the same discipline as the self-match table above. An entry licenses
# exactly itself: the same type on the other ground still fails, the same colour at another hex
# still fails, and the same colour at another ratio still fails, which means a hex nudged by a
# shade cannot hide behind a declaration written about the shade before it. Every entry must be
# used, so a colour that is repaired or removed makes the run say the declaration is now
# unnecessary instead of leaving it sitting there. An entry with no reason is rejected.
#
# These six are the palette as it stands and none of them is repaired here. Repairing them is a
# palette decision with a designed answer already written down, and writing a second answer
# inside a gate card is how a page ends up with two.
CONTRAST_EXEMPT=(
  # Under 3:1 on the white plate since the palette was chosen, and issue 56 does not repair
  # them: it adds a dark sibling per type and moves no light colour at all. So these three
  # survive that card and need one of their own. They are declared here so that the day
  # somebody writes it, the gate is what tells them it is done.
  "StudentGroup|light|#8eb125|2.4805|the light palette's own, unrepaired by 56, which moves no light colour"
  "CohortSession|light|#d1980b|2.5587|the light palette's own, unrepaired by 56, which moves no light colour"
  "Ghost|light|#8f99a8|2.8807|the light palette's own, unrepaired by 56, which moves no light colour"

  # The three the dark theme broke. Issue 56 proposes a second hex for each, measured against
  # this plate, and these declarations go stale the day it lands, which is the point of them.
  "Programme|dark|#9d3f9d|2.4972|issue 56 names this colour and gives it a dark sibling; that card is not this one"
  "Company|dark|#5f6b7c|2.6686|issue 56 names this colour and gives it a dark sibling; that card is not this one"
  "Agreement|dark|#946638|2.8997|issue 56 names this colour and gives it a dark sibling; that card is not this one"
)

WORKDIR=""
# `return 0` is load-bearing. An EXIT trap that ends on a failed command hands its own status
# to the shell, so a cleanup that finds nothing to delete turns a clean verdict into exit 1,
# and a gate that fails on clean gets switched off by the third person it blocks.
cleanup() { [ -n "$WORKDIR" ] && rm -rf "$WORKDIR"; return 0; }
trap cleanup EXIT

# ---------------------------------------------------------------------------------------
# Poka-yoke. A gate handed nothing to scan reports clean, which is the loudest lie it can
# tell (HANSEI.md `2026-08-empty-input-reported-success`).
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
      banned-word|corpus-link|uuid|email|money|citation) ;;
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
# the name rule; it was pointed at the wrong bytes.
# HANSEI.md `2026-08-09-gate-read-the-disk-not-the-repository`.
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

# ---------------------------------------------------------------------------------------
# Citations of HANSEI.md and KAIZEN.md entries.
#
# A DEFINITION is a slug in backticks immediately followed by " &middot;", and only in the two
# documents named below. That is exactly the form each entry already prints under its title, so
# nothing had to be invented for the checker to read; and because no other file can define one,
# a slug that appears only in citations resolves nowhere and fails. A citation cannot vouch for
# itself, which is the property that makes this check worth having rather than circular.
#
# A CITATION is a slug in backticks anywhere in any tracked file, and the shape is deliberately
# narrow: a date prefix, which is what HANSEI's entries carry, or the `kaizen-` namespace, which
# is what KAIZEN's lessons carry. So an ordinary hyphenated word in backticks is not read as a
# citation, and every real citation is, whatever prose surrounds it. A definition is also a
# citation of itself and resolves trivially, which costs nothing.
#
# This gate's own source cites entries in its header and spells invented slugs in its self-test
# payloads. The header's citations resolve like anybody else's; the invented ones are declared
# self-matches under the rule `citation`, so they are licensed at this path and nowhere else,
# and the staleness check applies to them like every other declaration.
CITATION_DOCS=(HANSEI.md KAIZEN.md)
CITATION_SLUG='(?:20[0-9]{2}-[0-9]{2}(?:-[0-9]{2})?|kaizen)-[a-z0-9][a-z0-9-]*'
CITATION_DEF_RE="\`${CITATION_SLUG}\` &middot;"
CITATION_USE_RE="\`${CITATION_SLUG}\`"

# The defined slugs, one per line, from the two documents and from nowhere else.
citation_defs() {
  local d
  for d in "${CITATION_DOCS[@]}"; do
    [ -f "$d" ] || continue
    grep -aoP "$CITATION_DEF_RE" "$d" | sed 's/^`//; s/` &middot;$//'
  done | sort -u
}

# Counted apart from the content findings, because the two want different sentences at the end
# of a run: a real name is removed from the tree and then reckoned with in the history, while a
# dangling citation is repointed at the slug the entry carries.
CITATION_FAILURES=0

scan_citations_file() {  # file label defsfile
  local f="$1" rel="$2" defs="$3" slug
  while IFS= read -r slug; do
    [ -n "$slug" ] || continue
    grep -Fxq "$slug" "$defs" && continue
    forbidden_exempt citation "$rel" "$slug" && continue
    fail "$rel: citation of an entry that does not exist: $slug"
    CITATION_FAILURES=$((CITATION_FAILURES + 1))
  done < <(grep -aoP "$CITATION_USE_RE" "$f" | tr -d '`' | sort -u)
}

# Working tree only, unlike the name rule, and the difference is deliberate: a name in the index
# is already an exposure, while a citation that dangles only in a staged copy costs nothing until
# it is committed, at which point the next run of this gate is looking straight at it.
scan_citations() {  # defsfile
  local defs="$1" f n
  n="$(grep -c . "$defs" || true)"
  # Same poka-yoke as the name rule: a checker handed an empty reference list would report every
  # citation clean, so an empty one aborts rather than passing everything.
  [ "$n" -gt 0 ] || {
    echo "ASSERTION FAILED: no entry slugs defined in ${CITATION_DOCS[*]}" >&2; exit 2; }
  echo "citations checked against $n entry slugs defined in ${CITATION_DOCS[*]}"
  while IFS= read -r f; do
    [ -f "$f" ] || continue
    scan_citations_file "$f" "$f" "$defs"
  done < <(git ls-files)
}

# ---------------------------------------------------------------------------------------
# The contrast rule's machinery. Counted apart from the content findings and from the citation
# findings for the same reason those two are counted apart from each other: the three want
# different sentences at the end of a run. A name is removed from the tree and then reckoned
# with in the history, a dangling citation is repointed, and a colour under the threshold is
# either repaired in the palette or declared here with a reason.
CONTRAST_FAILURES=0
declare -A CONTRAST_EXEMPT_HITS=()

# Its own marker rather than [FORBIDDEN]. A reader skims the one word that says what to do
# about a finding, and nothing about a stroke that is hard to see is forbidden content.
contrast_fail() {
  FAILURES=$((FAILURES + 1))
  CONTRAST_FAILURES=$((CONTRAST_FAILURES + 1))
  echo "  [CONTRAST] $*"
}

assert_contrast_table_well_formed() {
  local e key ground hex ratio why
  # The threshold has to be a four decimal figure, because the whole exactness argument rests on
  # it being one: the ratios are floored to four places, so a threshold written to three or five
  # would put the printed figure and the true figure on opposite sides of the line.
  case "$CONTRAST_MIN" in
    [0-9].[0-9][0-9][0-9][0-9]|[0-9][0-9].[0-9][0-9][0-9][0-9]) ;;
    *) echo "ASSERTION FAILED: the threshold must be written to four decimals: $CONTRAST_MIN" >&2
       exit 2 ;;
  esac
  for e in ${CONTRAST_EXEMPT[@]+"${CONTRAST_EXEMPT[@]}"}; do
    IFS='|' read -r key ground hex ratio why <<< "$e"
    case "$ground" in
      light|dark) ;;
      *) echo "ASSERTION FAILED: declared contrast exception names an unknown ground: $e" >&2
         exit 2 ;;
    esac
    # A reason is not paperwork. An exception with none is a colour somebody stopped looking at.
    if [ -z "$key" ] || [ -z "$hex" ] || [ -z "$ratio" ] || [ -z "$why" ]; then
      echo "ASSERTION FAILED: declared contrast exception must name a type, a ground, a hex, a" >&2
      echo "                  ratio and a reason: $e" >&2
      exit 2
    fi
  done
}

# The first four fields are the exact measurement; the fifth is the reason and is free text, so
# the lookup matches on the prefix and the reason cannot widen what an entry licenses.
contrast_exempt() {  # type ground hex ratio -> 0 if declared
  local prefix="$1|$2|$3|$4|" e
  for e in ${CONTRAST_EXEMPT[@]+"${CONTRAST_EXEMPT[@]}"}; do
    if [ "${e:0:${#prefix}}" = "$prefix" ]; then
      CONTRAST_EXEMPT_HITS["$e"]=1
      return 0
    fi
  done
  return 1
}

report_unused_contrast_exemptions() {
  local e unused=0
  for e in ${CONTRAST_EXEMPT[@]+"${CONTRAST_EXEMPT[@]}"}; do
    if [ -z "${CONTRAST_EXEMPT_HITS[$e]:-}" ]; then
      echo "  [STALE] declared contrast exception is now unnecessary: $e"
      unused=$((unused + 1))
    fi
  done
  [ "$unused" -eq 0 ]
}

# awk and not bash arithmetic, which is integer only and would read every ratio as its whole
# part: 2 and 3 and 5, with the threshold at 3, which passes exactly the colours it should fail.
above_threshold() {  # ratio -> 0 if at or over CONTRAST_MIN
  awk -v a="$1" -v b="$CONTRAST_MIN" 'BEGIN { exit !(a + 0 >= b + 0) }'
}

# One row per type per ground, from the file that holds the palette. A missing interpreter is an
# assertion and not a skip: a gate that shrugs when it cannot run reports clean, which is the
# loudest lie it can tell, and this one would do it silently on the day python3 moved.
contrast_rows() {  # -> stdout
  command -v python3 >/dev/null 2>&1 || {
    echo "ASSERTION FAILED: python3 is not on PATH; the type colours cannot be measured" >&2
    exit 2; }
  python3 build/model.py --contrast || {
    echo "ASSERTION FAILED: build/model.py refused to emit its palette" >&2
    exit 2; }
}

contrast_schema_abort() {
  echo "ASSERTION FAILED: the palette table is not readable: $*" >&2
  echo "                  A table this gate cannot fully parse is a verdict about a fraction of" >&2
  echo "                  the palette, printed as though it were about all of it." >&2
  exit 2
}

# THE TABLE IS VALIDATED BEFORE IT IS JUDGED, and this is the guard that matters most.
#
# The only check here at first was that the row count was over zero, in the belief that it was
# the same poka-yoke the name rule and the citation rule carry. It was weaker than both. Fed the
# six failing rows on their own, twenty measurements missing, every declaration was still hit,
# nothing was stale, no colour was under the threshold undeclared, and the run printed a clean
# verdict on less than a quarter of the palette. The missing types printed `not measured` in the
# table and cost nothing at all.
#
# A gate whose clean verdict does not mean "twenty-six measurements were taken" is not the gate
# this card asked for. So: every line is checked field by field, both grounds must be present
# for every type, no pair may appear twice, and the emitter writes a terminator carrying the
# count it intended, which a truncated stream cannot forge. Each of those fails the run at
# exit 2, which is an assertion and not a finding: the answer is not "this colour is wrong", it
# is "this run does not know".
scan_contrast_rows() {  # rowsfile
  local rows="$1" n key label ground hex plate ratio canvas cratio extra verdict
  local seen_terminator=0 claimed=-1 parsed=0

  local -A LBL=() CELL=() SEEN=() CANVAS=()
  local -a order=()
  local under=0 declared=0 disagree=0 ok_plate ok_canvas

  # `|| [ -n "$key" ]` is not decoration. A last line with no newline leaves `read` returning
  # non-zero with the fields already set, so a plain `while read` drops it, and `grep -c` counts
  # it: the two disagree by one and the loop is the one that decides.
  while IFS='|' read -r key label ground hex plate ratio canvas cratio extra || [ -n "$key" ]; do
    [ -n "$key" ] || continue

    # The terminator, and it must be last.
    if [ "$key" = "#rows" ]; then
      [ "$seen_terminator" -eq 0 ] || contrast_schema_abort "two terminators"
      case "$label" in
        ''|*[!0-9]*) contrast_schema_abort "terminator does not carry a count: $key|$label" ;;
      esac
      seen_terminator=1; claimed="$label"
      continue
    fi
    [ "$seen_terminator" -eq 0 ] || contrast_schema_abort "a row after the terminator: $key"

    [ -z "$extra" ] || contrast_schema_abort "too many fields on the $key row"
    [ -n "$label" ] && [ -n "$canvas" ] && [ -n "$cratio" ] \
      || contrast_schema_abort "too few fields on the $key row"
    case "$ground" in
      light|dark) ;;
      *) contrast_schema_abort "unknown ground on the $key row: ${ground:-empty}" ;;
    esac
    case "$hex$plate$canvas" in
      \#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]\#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]\#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]) ;;
      *) contrast_schema_abort "a colour on the $key $ground row is not an #rrggbb hex" ;;
    esac
    # A strict four decimal figure, so that awk cannot be handed a string it coerces to a number
    # that passes. `3foo`, `3,0000` and `+inf` all read as at or over the threshold to awk.
    case "$ratio$cratio" in
      [0-9].[0-9][0-9][0-9][0-9][0-9].[0-9][0-9][0-9][0-9]|\
      [0-9][0-9].[0-9][0-9][0-9][0-9][0-9].[0-9][0-9][0-9][0-9]|\
      [0-9].[0-9][0-9][0-9][0-9][0-9][0-9].[0-9][0-9][0-9][0-9]|\
      [0-9][0-9].[0-9][0-9][0-9][0-9][0-9][0-9].[0-9][0-9][0-9][0-9]) ;;
      *) contrast_schema_abort "a ratio on the $key $ground row is not a four decimal figure" ;;
    esac
    [ -z "${CELL["$key|$ground"]:-}" ] \
      || contrast_schema_abort "$key is measured twice on the $ground plate"

    parsed=$((parsed + 1))
    if [ -z "${SEEN[$key]:-}" ]; then SEEN[$key]=1; order+=("$key"); LBL[$key]="$label"; fi
    CANVAS[$ground]="$canvas"

    if above_threshold "$ratio"; then
      verdict="ok"
    elif contrast_exempt "$key" "$ground" "$hex" "$ratio"; then
      verdict="declared"
      under=$((under + 1)); declared=$((declared + 1))
    else
      verdict="UNDER"
      under=$((under + 1))
      contrast_fail "$label, $hex on the $ground band plate $plate: $ratio, under the" \
                    "$CONTRAST_MIN a drawn boundary needs, and not declared"
    fi
    CELL["$key|$ground"]="$hex $ratio $verdict"

    # How much the choice of surface is worth, computed rather than asserted. A tile is drawn on
    # the plate; this counts the colours whose verdict would move had the page ground been
    # measured instead.
    ok_plate=0; if above_threshold "$ratio"; then ok_plate=1; fi
    ok_canvas=0; if above_threshold "$cratio"; then ok_canvas=1; fi
    [ "$ok_plate" = "$ok_canvas" ] || disagree=$((disagree + 1))
  done < "$rows"

  # What the table has to be before a verdict on it means anything.
  [ "$seen_terminator" -eq 1 ] || contrast_schema_abort "no terminator; the table is truncated"
  [ "$claimed" -eq "$parsed" ] \
    || contrast_schema_abort "the terminator claims $claimed rows and $parsed were read"
  [ "$parsed" -gt 0 ] || contrast_schema_abort "no type colour to measure"
  for key in "${order[@]}"; do
    [ -n "${CELL["$key|light"]:-}" ] || contrast_schema_abort "$key was never measured on light"
    [ -n "${CELL["$key|dark"]:-}" ] || contrast_schema_abort "$key was never measured on dark"
  done

  echo "contrast: type colour strokes on the band plate, threshold $CONTRAST_MIN, WCAG 2.2 SC 1.4.11"
  printf '  %-30s %-25s %-25s\n' "type" "light plate" "dark plate"
  for key in "${order[@]}"; do
    printf '  %-30s %-25s %-25s\n' "${LBL[$key]}" \
           "${CELL["$key|light"]}" "${CELL["$key|dark"]}"
  done
  echo "  ${#order[@]} colours, $parsed measurements, $under under the threshold:" \
       "$declared declared, $((under - declared)) not"
  echo "  against the page ground instead (${CANVAS[light]:-?} light, ${CANVAS[dark]:-?} dark) the" \
       "verdict would move for $disagree of $parsed"
}

scan_contrast() {
  contrast_rows > "$WORKDIR/contrast_rows"
  scan_contrast_rows "$WORKDIR/contrast_rows"
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
  echo "declared contrast exceptions: ${#CONTRAST_EXEMPT[@]}"
  echo

  scan_worktree "$HASHES"
  scan_snapshots "$HASHES"

  citation_defs > "$WORKDIR/citation_defs"
  scan_citations "$WORKDIR/citation_defs"

  echo
  scan_contrast
}

# ---------------------------------------------------------------------------------------
# Self-test. Every probe runs the same scan_file, or the same scan_citations_file, that the
# real scan runs.
# ---------------------------------------------------------------------------------------
self_test() {
  local tmp fake_hashes fake_defs pass=0 total=0
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

  # The citation rule is proved against a synthetic set of defined slugs, for the same reason
  # the name rule is proved against a synthetic register: a probe must not depend on what the
  # real documents happen to hold today, or a lesson being renamed silently rewrites the test.
  fake_defs="$tmp/citedefs"
  printf '%s\n' "2026-08-10-a-real-entry" > "$fake_defs"

  cite_probe() {  # name expect payload [exempt-entry ...]
    local name="$1" expect="$2" payload="$3"; shift 3
    local table=("$@") rc=0 rel="${PROBE_REL:-probe.txt}"
    total=$((total + 1))
    printf '%s\n' "$payload" > "$tmp/probe.txt"
    (
      FORBIDDEN_EXEMPT=(${table[@]+"${table[@]}"})
      FAILURES=0
      scan_citations_file "$tmp/probe.txt" "$rel" "$fake_defs" >/dev/null 2>&1
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
  echo "self-test: citations must resolve to an entry that exists"
  cite_probe "a citation of an entry that exists"  'pass' \
        'the gate was written for this: HANSEI.md `2026-08-10-a-real-entry`, in full'
  cite_probe "a citation of an entry that does not exist" 'trip' \
        'the gate was written for this: HANSEI.md `2026-08-10-no-such-entry`, in full'
  cite_probe "a KAIZEN lesson slug that resolves to nothing" 'trip' \
        'Lesson in KAIZEN.md `kaizen-no-such-lesson`; measurements in the commit message.'
  # A slug is defined by the two documents and by nothing else, so a file that both writes a
  # definition line and cites it is still citing nothing. Without this, a dangling citation
  # could be legalised by writing the definition next to it.
  cite_probe "a definition written outside the two documents defines nothing" 'trip' \
        '`2026-08-10-no-such-entry` &middot; 2026-08-10 ... and see `2026-08-10-no-such-entry`'

  # The contrast rule is proved against synthetic rows for the same reason the other two rules
  # are proved against synthetic inputs: a probe that read the real palette would start passing
  # or failing because somebody changed a colour, which is the one thing a test must not do.
  contrast_probe() {  # name expect rows [exempt-entry ...]
    local name="$1" expect="$2" payload="$3"; shift 3
    local table=("$@") rc=0
    total=$((total + 1))
    printf '%s\n' "$payload" > "$tmp/rows"
    (
      CONTRAST_EXEMPT=(${table[@]+"${table[@]}"})
      unset CONTRAST_EXEMPT_HITS; declare -A CONTRAST_EXEMPT_HITS=()
      FAILURES=0
      CONTRAST_FAILURES=0
      scan_contrast_rows "$tmp/rows" >/dev/null 2>&1
      [ "$FAILURES" -eq 0 ]
    ) || rc=$?
    if { [ "$expect" = trip ] && [ "$rc" -ne 0 ]; } || { [ "$expect" = pass ] && [ "$rc" -eq 0 ]; }; then
      echo "  [OK]   $name"
      pass=$((pass + 1))
    else
      echo "  [MISS] $name"
    fi
  }

  # Every payload below is a whole two ground table with its terminator, because a partial one no
  # longer reaches a verdict at all: the schema probes further down are what prove that.
  PROBE_LIGHT='Probe|Probe|light|#9d3f9d|#ffffff|5.7827|#f6f7f9|5.3946'

  echo
  echo "self-test: a type colour under the threshold is a finding unless it is declared"
  contrast_probe "a colour under the threshold" 'trip' \
        "$PROBE_LIGHT
Probe|Probe|dark|#9d3f9d|#252a31|2.4972|#1c2127|2.8015
#rows|2"
  contrast_probe "a colour exactly on the threshold" 'pass' \
        "$PROBE_LIGHT
Probe|Probe|dark|#9d3f9d|#252a31|3.0000|#1c2127|3.4000
#rows|2"
  contrast_probe "a colour declared exactly" 'pass' \
        "$PROBE_LIGHT
Probe|Probe|dark|#9d3f9d|#252a31|2.4972|#1c2127|2.8015
#rows|2" \
        "Probe|dark|#9d3f9d|2.4972|declared for the probe"
  # The three ways a declaration could quietly widen, each shut. A shade nudged, a theme
  # confused, a measurement drifted: none of them is covered by yesterday's entry.
  contrast_probe "a declaration whose hex has moved still trips" 'trip' \
        "$PROBE_LIGHT
Probe|Probe|dark|#9d3f9e|#252a31|2.4972|#1c2127|2.8015
#rows|2" \
        "Probe|dark|#9d3f9d|2.4972|declared for the probe"
  contrast_probe "a declaration for the other ground still trips" 'trip' \
        "$PROBE_LIGHT
Probe|Probe|dark|#9d3f9d|#252a31|2.4972|#1c2127|2.8015
#rows|2" \
        "Probe|light|#9d3f9d|2.4972|declared for the probe"
  contrast_probe "a declaration whose ratio has moved still trips" 'trip' \
        "$PROBE_LIGHT
Probe|Probe|dark|#9d3f9d|#252a31|2.4900|#1c2127|2.8015
#rows|2" \
        "Probe|dark|#9d3f9d|2.4972|declared for the probe"

  # A table the gate cannot fully parse must abort at exit 2 rather than produce a verdict about
  # whatever part of it did parse. Every probe below is a way the palette could arrive
  # incomplete, and the first of them is the hole this rule shipped with: fed only the six
  # failing rows, it hit every declaration, found nothing stale, and reported clean on a quarter
  # of the palette.
  contrast_schema_probe() {  # name payload
    local name="$1" payload="$2" rc=0
    total=$((total + 1))
    printf '%s\n' "$payload" > "$tmp/rows"
    (
      CONTRAST_EXEMPT=()
      unset CONTRAST_EXEMPT_HITS; declare -A CONTRAST_EXEMPT_HITS=()
      FAILURES=0
      CONTRAST_FAILURES=0
      scan_contrast_rows "$tmp/rows" >/dev/null 2>&1
    ) || rc=$?
    if [ "$rc" -eq 2 ]; then
      echo "  [OK]   $name"
      pass=$((pass + 1))
    else
      echo "  [MISS] $name was judged instead of aborting (exit $rc)"
    fi
  }

  echo
  echo "self-test: a palette this gate cannot fully read must abort, not report on part of it"
  contrast_schema_probe "a table with no terminator" \
        'Probe|Probe|light|#9d3f9d|#ffffff|5.7827|#f6f7f9|5.3946
Probe|Probe|dark|#9d3f9d|#252a31|2.4972|#1c2127|2.8015'
  contrast_schema_probe "a terminator claiming more rows than arrived" \
        'Probe|Probe|light|#9d3f9d|#ffffff|5.7827|#f6f7f9|5.3946
Probe|Probe|dark|#9d3f9d|#252a31|2.4972|#1c2127|2.8015
#rows|26'
  contrast_schema_probe "a type measured on one ground only" \
        'Probe|Probe|light|#9d3f9d|#ffffff|5.7827|#f6f7f9|5.3946
#rows|1'
  contrast_schema_probe "a type measured twice on one ground" \
        'Probe|Probe|light|#9d3f9d|#ffffff|5.7827|#f6f7f9|5.3946
Probe|Probe|light|#9d3f9d|#ffffff|5.7827|#f6f7f9|5.3946
Probe|Probe|dark|#9d3f9d|#252a31|2.4972|#1c2127|2.8015
#rows|3'
  # awk coerces a string to the number in front of it, so `3foo` reads as at or over the
  # threshold and a malformed field would pass as a good colour rather than fail as a bad table.
  contrast_schema_probe "a ratio that is not a four decimal figure" \
        'Probe|Probe|light|#9d3f9d|#ffffff|3foo|#f6f7f9|5.3946
Probe|Probe|dark|#9d3f9d|#252a31|2.4972|#1c2127|2.8015
#rows|2'
  contrast_schema_probe "a colour that is not an #rrggbb hex" \
        'Probe|Probe|light|red|#ffffff|5.7827|#f6f7f9|5.3946
Probe|Probe|dark|#9d3f9d|#252a31|2.4972|#1c2127|2.8015
#rows|2'
  contrast_schema_probe "a row carrying a field too many" \
        'Probe|Probe|light|#9d3f9d|#ffffff|5.7827|#f6f7f9|5.3946|extra
Probe|Probe|dark|#9d3f9d|#252a31|2.4972|#1c2127|2.8015
#rows|2'

  # The one probe that runs the real emitter, and it asserts the SHAPE of what the model writes
  # and never a value: the field order, the field count and the terminator are a contract between
  # two files in two languages, and nothing else in this self-test would notice it being broken.
  # Values stay out of it for the reason every other probe here is synthetic.
  total=$((total + 1))
  rc=0
  (
    python3 "$ROOT/build/model.py" --contrast > "$tmp/realrows" 2>/dev/null || exit 9
    CONTRAST_EXEMPT=()
    unset CONTRAST_EXEMPT_HITS; declare -A CONTRAST_EXEMPT_HITS=()
    FAILURES=0
    CONTRAST_FAILURES=0
    scan_contrast_rows "$tmp/realrows" >/dev/null 2>&1
  ) || rc=$?
  if [ "$rc" -eq 9 ]; then
    echo "  [MISS] the model would not emit its palette at all"
  elif [ "$rc" -ne 2 ]; then
    echo "  [OK]   the palette the model emits satisfies the shape this gate reads"
    pass=$((pass + 1))
  else
    echo "  [MISS] the model and this gate disagree about the shape of a palette row"
  fi

  # And a declaration that is no longer needed must fail the run, exactly as a self-match that
  # matches nothing does. This is the half that keeps a tolerance from outliving the defect.
  total=$((total + 1))
  rc=0
  (
    CONTRAST_EXEMPT=("Probe|dark|#9d3f9d|2.4972|declared for the probe")
    unset CONTRAST_EXEMPT_HITS; declare -A CONTRAST_EXEMPT_HITS=()
    report_unused_contrast_exemptions >/dev/null 2>&1
  ) || rc=$?
  if [ "$rc" -ne 0 ]; then
    echo "  [OK]   a contrast exception that was not needed failed the run"
    pass=$((pass + 1))
  else
    echo "  [MISS] a contrast exception that was not needed was tolerated"
  fi

  total=$((total + 1))
  rc=0
  ( CONTRAST_EXEMPT=("Probe|midday|#9d3f9d|2.4972|there is no such ground")
    assert_contrast_table_well_formed >/dev/null 2>&1 ) || rc=$?
  if [ "$rc" -eq 2 ]; then
    echo "  [OK]   a contrast exception naming an unknown ground was rejected"
    pass=$((pass + 1))
  else
    echo "  [MISS] a contrast exception naming an unknown ground was accepted (exit $rc)"
  fi

  total=$((total + 1))
  rc=0
  ( CONTRAST_EXEMPT=("Probe|dark|#9d3f9d|2.4972|")
    assert_contrast_table_well_formed >/dev/null 2>&1 ) || rc=$?
  if [ "$rc" -eq 2 ]; then
    echo "  [OK]   a contrast exception carrying no reason was rejected"
    pass=$((pass + 1))
  else
    echo "  [MISS] a contrast exception carrying no reason was accepted (exit $rc)"
  fi

  # An empty palette must abort, not report every colour it does not have clean.
  total=$((total + 1))
  rc=0
  ( : > "$tmp/emptyrows"; scan_contrast_rows "$tmp/emptyrows" >/dev/null 2>&1 ) || rc=$?
  if [ "$rc" -eq 2 ]; then
    echo "  [OK]   an empty palette aborted instead of judging no colours"
    pass=$((pass + 1))
  else
    echo "  [MISS] an empty palette did not abort (exit $rc)"
  fi

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

  # And the same for the citation rule's reference list. A checker holding no slugs would find
  # every citation dangling, or, if it shrugged instead, would find none, and either way the
  # answer would be about the list rather than about the repository.
  total=$((total + 1))
  rc=0
  ( : > "$tmp/emptydefs"; scan_citations "$tmp/emptydefs" >/dev/null 2>&1 ) || rc=$?
  if [ "$rc" -eq 2 ]; then
    echo "  [OK]   an empty list of defined slugs aborted instead of judging citations"
    pass=$((pass + 1))
  else
    echo "  [MISS] an empty list of defined slugs did not abort (exit $rc)"
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
  assert_contrast_table_well_formed
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

  if ! report_unused_contrast_exemptions; then
    echo
    echo "VERDICT: a declared contrast exception is no longer needed."
    echo "The colour it was written about now clears the threshold, or it is gone. Delete the"
    echo "entry: a tolerance nobody has to tolerate is a tolerance nobody is reading."
    exit 1
  fi

  if [ "$FAILURES" -eq 0 ]; then
    echo "VERDICT: clean"
    exit 0
  fi

  local content=$((FAILURES - CITATION_FAILURES - CONTRAST_FAILURES))
  if [ "$content" -gt 0 ]; then
    echo "VERDICT: FORBIDDEN CONTENT IS COMMITTED ($content findings)"
    echo "Remove it from the working tree first; then decide what the history needs."
  fi
  if [ "$CITATION_FAILURES" -gt 0 ]; then
    echo "VERDICT: $CITATION_FAILURES citation(s) name an entry that does not exist"
    echo "Cite the slug the entry carries, or add the entry the citation was written about."
  fi
  if [ "$CONTRAST_FAILURES" -gt 0 ]; then
    echo "VERDICT: $CONTRAST_FAILURES type colour(s) are under $CONTRAST_MIN on the plate they"
    echo "are drawn on. Repair the hex in build/model.py, or declare it above with the ratio it"
    echo "achieves and the reason it is tolerated. Leaving it undeclared is the one option that"
    echo "is not open."
  fi
  exit 1
}

main "$@"
