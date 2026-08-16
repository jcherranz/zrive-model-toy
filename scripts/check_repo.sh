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
# reach the page through site/instance.js, so the build is where they are known and would be the
# obvious home. It is the wrong one, for a reason that is about this repository and not about
# taste: no workflow runs the build. The generated documents are committed and pages.yml
# deploys them as they stand, so a check inside build/build_layout.py runs only when somebody rebuilds, which is
# exactly the person who already knows what they changed. This script runs on every push and
# every pull request, it already carries a declared-exception mechanism with a staleness rule,
# and it already has a self-test. All three are needed here on the first day.
#
# The split is therefore: build/model.py computes, because that is where the colours and the
# stylesheet are; this file decides, because this is what runs. `model.py --contrast` emits one
# row per type per ground and holds no threshold and no verdict.
#
# WHAT THIS DOES NOT CHECK, said here rather than left to be discovered. It measures the palette
# in the model. Nothing in CI rebuilds site/instance.js and compares it, so a colour hand edited
# into the drawing and not into the model would be measured by nobody. That hole is older than
# this rule and wider than it, and closing it is a build-reproducibility card rather than a
# contrast one.
#
# WHAT IS MEASURED, AND ON WHAT. A tile's stroke, at full opacity, against the band plate it
# sits on. Not against the page ground: site/render.js fills one opaque `rect.band` per lane
# before it draws a tile and every tile is laid out inside a lane, so the plate is the surface,
# and the two differ enough to move three of the twenty-six verdicts, in both directions. The
# rows carry the page ground as well and the run prints how far apart the two answers are, so the
# choice stays visible rather than becoming a thing somebody once decided.
#
# THE PLATE IS NOT WHITE ANY MORE, WHICH IS ISSUE 81 AND IS THE LAST THING TO MOVE UNDER THIS
# GATE. `.band` was filled with --bg-panel, the same token the header and the detail panel take,
# and it now takes --bg-band, which sits a little under half way from the page ground to where
# the old plate was: #ffffff to #fafbfc in light, #252a31 to #20252c in dark. Every light ratio
# below therefore fell and every dark ratio rose, and the light side is what bounded the card:
# the plate went as far toward the ground as the lowest of the thirteen allowed and stopped,
# with Session template at 3.0346 against this threshold. build/model.py needed no change, since
# it reads the token name off the `.band` rule rather than holding a copy of it.
#
# THE THRESHOLD is 3:1, WCAG 2.2 SC 1.4.11 Non-text Contrast, which is the figure for the visual
# boundary of a user interface component and for a graphical object needed to understand the
# content. A tile is both: it takes focus, it takes a click, it opens the panel, and its outline
# is what a reader tells one type from another by. It is not 4.5:1, which is SC 1.4.3 and about
# text. Issues 56 and 65 both aimed at 4.5 anyway, because the same colours were then written as
# 11px bold text at the head of the detail panel and one number would fix the stroke and that
# label together. Issue 69 repainted that label --fg-muted, so nothing takes these hexes as text
# now, and issue 74 is the open card on the ten lightnesses chosen for it. It is not lower than
# 3:1 either. One of the twenty-six measurements fails today and it is declared below rather than
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
# ONE, AND THERE WERE SIX. Twice now this table has been how a repair was found to be finished
# rather than believed to be. Issue 56 gave eight types a second hex chosen against the dark
# plate and the run went red with `[STALE] declared contrast exception is now unnecessary`
# against Programme, Company and Agreement. Issue 65 darkened Cohort session and Students against
# the white one and the run went red again, naming exactly those two and nothing else. Both times
# the entries came out because the gate said they were spent, and both times the gate said it
# before anybody claimed it. That is the whole design of a declaration with a staleness rule: a
# tolerance nobody has to tolerate is a tolerance nobody is reading.
CONTRAST_EXEMPT=(
  # THE ONE THAT IS LEFT, AND IT IS NOT A COLOUR NOBODY GOT TO. Issue 65 was asked to repair all
  # three light failures and repaired two. This one was measured, drawn and looked at, and the
  # answer came back that repairing it would cost more than it bought. Four findings, in the
  # order they decide it.
  #
  # 1. IT IS NOT ONLY A TYPE COLOUR. #8f99a8 is the light value of --c-gray-3 in site/app.css,
  #    which that file calls "the grey of a line" and which every rule that draws one reads
  #    directly: the edges, the arrowheads, the ghosts' dashed marks, the greyed controls, the
  #    absent flag, one separator and the term table's no-module row. So this exact hex is already
  #    painted over the whole page at this exact ratio, and none of those uses is a type colour,
  #    so none of them is measured here. Moving the model's copy alone would leave a ghost
  #    outlined darker than the dashed edge running into it, in a hex the stylesheet no longer
  #    agrees with.
  # 2. THE VALUE THAT WOULD PASS IS ANOTHER TYPE'S. Held to its own hue and saturation, the first
  #    lightness that clears 4.6 against the white plate is #6a7688. That sits 4.46 from Company
  #    #5f6b7c as a CIE76 colour difference, which is the same colour: the tightest pair the
  #    palette otherwise has is 18.18. Repairing the ghost's contrast would make a ghost read as
  #    a Company, and a Company is the thing on this page a ghost most has to not be.
  # 3. ITS STROKE CARRIES NO TYPE-DISCRIMINATION LOAD, WHICH IS WHAT THIS RULE GATES. The reason
  #    given above for measuring a stroke at all is that an outline is what one type is told from
  #    another by. There is one ghost type and four devices already say so before colour does:
  #    a dashed outline at 3 and 2.4, a stroke-width of 1.1 against every other tile's 1.25, an
  #    empty tile with no glyph in it, and an italic label painted --fg-muted, which measures
  #    5.2231 on the plate and is not this hex at all. A reader does not find a ghost by its grey.
  # 4. THE QUIET IS THE STATEMENT. A ghost marks a class no system holds. It is drawn faint on
  #    purpose, and its wash is 7 per cent where every real tile is at 14. Darkening it to pass
  #    would make the four things that do not exist the most emphatic outlines in their lane.
  #
  # THE RESIDUAL THIS ENTRY CARRIED IS GONE, AND SAYING SO IS PART OF KEEPING THE ENTRY HONEST.
  # It used to read that the detail panel wrote this same hex as an 11px bold type label, text
  # under SC 1.4.3, at 2.8807 against a threshold of 4.5. Issue 69 repainted that label
  # --fg-muted and left the type colour there as a nine pixel swatch, which is a graphical object
  # at 3:1, so no text on this page takes this hex any more. What remains of the residual is the
  # swatch's own outline on --bg-panel, which this gate does not measure and did measure by
  # accident until issue 81 moved the plate off that token; for the ghost it is this same 2.8807,
  # for the same reason, and the four findings above are the argument for it there too.
  #
  # THE FIGURE MOVED AND THE ARGUMENT DID NOT, WHICH IS ISSUE 81. The ratio in this entry is
  # 2.7804 rather than 2.8807 because the plate is #fafbfc rather than #ffffff. An entry licenses
  # exactly the measurement it names, so a plate that moves re-opens every declaration written
  # against the old one, which is the mechanism working: this one was re-read and re-argued
  # rather than carried across. Not one of the four findings depends on the figure. The honest
  # repair of the drawn grey, if it is ever wanted, is a --line token across the app.css rules
  # that read it, which moves every edge on the page and is its own card with its own look.
  #
  # AND THAT SENTENCE USED TO SIZE THE REPAIR AT NINE RULES, WHICH IS WHY IT NO LONGER SIZES IT AT
  # ALL. Issue 106. Nine was right at 0d23157, where it was written; counting `var(--c-gray-3)`
  # outside comments gives 10 at a39bf13, 12 at 3c7be9e and 10 at 5f32209, so the figure moved
  # three times and in both directions, and nothing in this repository asserts it. A --line token
  # sized from a stale count converts some of the rules and leaves the rest, in the one token
  # whose entire purpose is that every line on the page agrees. The grep answers it in a second
  # and is always current.
  "Ghost|light|#8f99a8|2.7804|the page's own line grey, --c-gray-3; the value that would pass is Company's"
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
# THE NUL RULE. No tracked file carries a NUL byte.  Issue 184.
#
# WHY A BYTE IS WORTH A RULE. site/render.js carried two of them, written as literal 0x00 rather
# than as the escape for the same character, inside `var k = e.s + ... + e.t + ... + e.v;`. The
# string value was correct and the page was correct. What was not correct was every tool that
# read the file afterwards, because a NUL is what the whole line-oriented toolchain uses to tell
# text from data:
#
#   GNU grep calls the file binary. `grep -o PATTERN site/render.js` prints nothing and exits 1
#   while `grep -c` on the same pattern answers 1. A match is found and not shown.
#
#   ugrep, which is what `grep` resolves to on at least one machine this repository is worked on,
#   SKIPS the file outright: `grep -c` prints nothing, exits 1, and says nothing about why. The
#   two implementations fail differently and both fail silently, which is worse than either.
#
#   `file` is not a witness either. It reported the pre-fix copy as "JavaScript source, ASCII
#   text", NUL bytes and all, so the ordinary structural probe would have cleared it.
#
# So a `grep -r` over site/ returned a confident empty answer for the largest file in it, and
# could not tell "no match" from "did not look". That is this repository's signature failure in
# somebody else's tool, and it has already cost a card: the agent that shipped the
# Content-Security-Policy scanned site/ for inline style and got a clean answer, while the one
# thing a strict `style-src` breaks, the palette that render.js builds as a `<style>` element
# from model data, sat in the file grep had declined to read. It was caught by redoing every scan
# in Python and not by the scan that was run.
#
# WHAT THE RULE IS NOT. It is not a rule against using NUL as a separator, which is a sound
# technique and is what `git ls-files -z` and the `while IFS= read -r` loops in this very file are
# built on. It is a rule against writing one as a raw byte into a source file, where every escape
# sequence in every language this repository holds says the same character in ASCII.
#
# THE WORKING TREE IS WHAT IS READ, and unlike the name rule there is no snapshot pass. The harm
# is done to whatever reads the bytes on a disk, and every clone and every CI checkout produces
# that disk from the commit, so in CI this loop IS reading what the repository carries. A NUL that
# exists only as an uncommitted edit harms only the person who made it, and meets this gate on the
# run after they commit it.
NUL_FAILURES=0

# Its own marker, for contrast_fail's reason: a reader skims the one word that says what to do
# about a finding, and a raw control byte is neither forbidden content nor a dangling citation.
nul_fail() {
  FAILURES=$((FAILURES + 1))
  NUL_FAILURES=$((NUL_FAILURES + 1))
  echo "  [NUL] $*"
}

# The number of NUL bytes in one file, on stdout. It is the file's length minus its length with
# every NUL deleted, which needs no interpreter and no regular expression and cannot itself be
# confounded by the byte it is counting.
#
# IT RETURNS NON-ZERO RATHER THAN PRINTING 0 WHEN IT COULD NOT READ THE FILE, and the caller is
# required to tell those two apart. A counter that answers "none" for a file it never opened is
# the dead instrument this gate is made of assertions against.
nul_bytes() {  # path
  local total stripped
  # The readability test is first so that a missing or unreadable path is answered by the return
  # value rather than by the shell writing a redirection error into a log that is otherwise a
  # list of verdicts. Both reads are still guarded: a file readable at this line and gone at the
  # next is the same refusal, reached the same way.
  [ -r "$1" ] || return 1
  total="$( { wc -c < "$1"; } 2>/dev/null )" || return 1
  stripped="$( { tr -d '\000' < "$1" | wc -c; } 2>/dev/null )" || return 1
  [ -n "$total" ] && [ -n "$stripped" ] || return 1
  echo $(( total - stripped ))
}

scan_nul() {
  local f n read=0
  while IFS= read -r f; do
    [ -f "$f" ] || continue
    if ! n="$(nul_bytes "$f")"; then
      echo "ASSERTION FAILED: $f is tracked and its bytes could not be read." >&2
      echo "  This rule reports on files it has read. It will not carry on and print a verdict" >&2
      echo "  that silently excludes one, because a file nobody read is exactly where the byte" >&2
      echo "  this rule is about would sit." >&2
      exit 2
    fi
    read=$(( read + 1 ))
    [ "$n" -eq 0 ] && continue
    nul_fail "$f: $n raw NUL byte(s). Write the escape for the character instead."
  done < <(git ls-files)
  # The third state. Two files, zero files and an unreadable file are three different answers and
  # only one of them is "clean". `assert_scan_inputs` makes the same refusal for the name rule and
  # for the same reason, and it is repeated here rather than borrowed because this loop skips
  # paths that are tracked and absent from the disk, so its own count is the only honest one.
  [ "$read" -gt 0 ] || {
    echo "ASSERTION FAILED: the NUL rule read no tracked file at all." >&2
    echo "  Either git named none or every one of them was skipped. A rule handed nothing to" >&2
    echo "  scan reports clean, which is the loudest lie it can tell." >&2
    exit 2
  }
  echo "NUL bytes: $read tracked files read as bytes"
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

  # THE REGISTER IS CHECKED BEFORE THE SCAN, NOT DURING IT. Issue 164. It is untracked now and
  # arrives either from scripts/gen_forbidden_hashes.sh on a machine holding the vault or from
  # scripts/ci_register.sh out of a repository secret, so it can be missing, and it can be
  # present and built under a salt this run does not hold. Either way every token hashes to
  # something the register does not carry, nothing matches, and this gate reports a clean
  # repository. assert_scan_inputs below already refuses an EMPTY register; it cannot see a full
  # one that was built under the wrong salt, which looks identical from inside the loop.
  [ -s "$HASHES" ] || {
    echo "ASSERTION FAILED: no name register at $HASHES" >&2
    echo "  This gate cannot recognise a name without one, and a gate that recognises nothing" >&2
    echo "  reports clean. In CI, run scripts/ci_register.sh first. Locally, generate it with" >&2
    echo "  scripts/gen_forbidden_hashes.sh on a machine that holds the vault." >&2
    exit 2
  }
  assert_register_bound "$HASHES"

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

  # The register's size is not printed, for the reason check_forbidden.sh gives at the same line:
  # it is a fact about a group of real people, this log is public, and the only thing the verdict
  # rests on is that the register was not empty, which assert_scan_inputs has just established.
  # The count is still computed and still has to be positive.
  echo "scanning $n_files tracked files, $bytes bytes, against a register assert_scan_inputs found non-empty"
  echo "declared self-matches: ${#FORBIDDEN_EXEMPT[@]}"
  echo "declared contrast exceptions: ${#CONTRAST_EXEMPT[@]}"
  echo

  scan_worktree "$HASHES"
  scan_snapshots "$HASHES"

  citation_defs > "$WORKDIR/citation_defs"
  scan_citations "$WORKDIR/citation_defs"
  scan_nul

  echo
  scan_contrast
}

# The title a rendered board carries for one card id. Used only by the self-test, and kept out
# of it so the probes read as assertions rather than as JSON handling.
board_title() {  # board.json id
  python3 -c 'import json,sys
board = json.load(open(sys.argv[1]))
want = int(sys.argv[2])
for column in board["columns"]:
    for card in column["cards"]:
        if card["id"] == want:
            print(card["title"])
            raise SystemExit(0)
raise SystemExit(1)' "$1" "$2" 2>/dev/null || true
}

# ---------------------------------------------------------------------------------------
# Self-test. Every probe runs the same scan_file, or the same scan_citations_file, that the
# real scan runs.
# ---------------------------------------------------------------------------------------
#
# HOW MANY PROBES THIS SUITE INTENDS, WRITTEN DOWN BY HAND. Issue 103. `total` below is
# incremented by each probe as it executes, so `pass -eq total` is invariant under any probe
# that is deleted, commented out, or never reached: a suite emptied one probe at a time keeps
# printing a clean ratio all the way down to 0/0. That is this repository's signature failure,
# a check reporting on less than it claims, and the two places it has already been fixed both
# fixed it the same way: build/model.py emits a `#rows|N` terminator carrying the count it meant
# to write and scan_contrast_rows refuses a table that does not match it, and scripts/smoke.mjs
# declares EXPECTED_ASSERTIONS and refuses a run that recorded a different number. This is that
# same terminator in this file.
#
# It is written by hand and it must stay written by hand. A count taken from the run cannot
# notice a probe that did not run, which is the whole of the defect. Editing a probe in or out
# without editing this number is meant to be a red run.
#
# A short run exits 2 and not 1: the suite could not answer for itself, which is the same
# distinction smoke.mjs draws between "the page has regressed" and "the suite could not answer".
# A run that ALSO recorded a real MISS reports the MISS and exits 1, because evidence about the
# gate beats a complaint about the harness.
# 126 until issue 184, whose NUL rule adds three: the byte is a finding, the same string written
# with the escape is clean, and a file the rule could not read is refused. The third is the probe
# that is worth having.
EXPECTED_PROBES=129

# How many cases build/model.py's stylesheet reader emits into the block below. Same argument,
# and it lives here rather than in the emitter because here is where the cases are judged and
# where a reader looking at the ratio would be misled by a short one. See that block for what
# the old floor of one could not see.
EXPECTED_PALETTE_CASES=31

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
  # The folding cuts a run of letters at its case boundaries, so a name concatenated with
  # another word or with an acronym is decomposed and every piece is looked up. The whole run
  # is still emitted as well, which is what keeps the change additive; scripts/check_forbidden.sh
  # proves that half against a register that holds only the joined form. The first two payloads
  # passed this gate before the case boundaries were added; the digit one did not, because a
  # digit was already a separator, and it is here to keep that true rather than to report new
  # coverage.
  probe "a camelCase concatenation"    'trip' 'the handle quillfarthingKestrelvane in a log line'
  probe "an acronym glued to a name"   'trip' 'the ZBLKestrelvane row of the export'
  probe "a digit glued to a name"      'trip' 'user Kestrelvane2026 signed the record'
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

  # THE MATCH THE CAP COULD NOT SEE. Issue 103. collect() in scripts/forbidden_lib.sh truncated
  # its output at twenty and the rule loops iterate that list, so the twenty first distinct match
  # in a file was never compared against the exemption table and never reached fail(). A file
  # holding twenty one was judged on twenty of them and the gate answered clean about the rest.
  #
  # This probe is that file: twenty one distinct uuids, the first twenty declared as self-matches
  # so they are known and tolerated, and the twenty first the only thing left to find. It trips
  # only if the rule was shown all twenty one. The payload is built in a loop rather than typed,
  # so no complete uuid is a literal in this file and the gate scanning its own source has no new
  # payload to declare.
  local cap_payload="" cap_i
  local -a cap_ex=()
  for cap_i in $(seq -w 1 21); do
    cap_payload+="row ${cap_i}, id 3f2504e0-4f89-11d3-9a0c-0305e82c33${cap_i}"$'\n'
    [ "$cap_i" = 21 ] || cap_ex+=("uuid|probe.txt|3f2504e0-4f89-11d3-9a0c-0305e82c33${cap_i}")
  done
  probe "the 21st distinct match in one file is still judged" 'trip' \
        "$cap_payload" "${cap_ex[@]}"

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
  # The other direction of the case-boundary folding: a finer net is only worth having if it
  # still passes the code it has to read, and site/ is camelCase throughout.
  probe "ordinary camelCase identifiers"    'pass' \
        'document.getElementById(id); ZT.termRoutes(); new XMLHttpRequest(); bandPlate'
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

  # ---- the NUL rule, issue 184 -------------------------------------------------------------
  # Three states and one probe each, because the sensor under scan_nul is the piece that can be
  # wrong while looking right. `nul_bytes` prints a count or refuses; what it must never do is
  # print 0 for a file it did not open, which is how the byte it is about got into this
  # repository under a clean gate in the first place. The payloads are written with printf and a
  # `\000` rather than being copied out of a source file, so no fixture in the tree has to carry
  # the byte for this suite to prove the rule sees one.
  nul_probe() {  # name expect path      expect: clean | finding | refused
    local name="$1" expect="$2" path="$3" got n
    total=$((total + 1))
    if n="$(nul_bytes "$path")"; then
      if [ "$n" -eq 0 ]; then got=clean; else got=finding; fi
    else
      got=refused
    fi
    if [ "$got" = "$expect" ]; then
      echo "  [OK]   $name"
      pass=$((pass + 1))
    else
      echo "  [MISS] $name: wanted $expect, got $got"
    fi
  }

  printf 'var k = a + \000 + b;\n' > "$tmp/withnul.js"
  printf 'var k = a + \\u0000 + b;\n' > "$tmp/withescape.js"

  echo
  echo "self-test: a raw NUL byte in a file is a finding, and an unreadable file is not a pass"
  nul_probe "a raw NUL byte in a source line"                  finding "$tmp/withnul.js"
  # The control, and it carries the whole point of the card: the SAME string, said with the
  # escape, is clean. Without it the rule could be wedged shut and every probe above would still
  # be green.
  nul_probe "the same string written with the escape instead"  clean   "$tmp/withescape.js"
  nul_probe "a file the rule could not read is refused, not reported clean" \
        refused "$tmp/there-is-no-such-file"

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

  # THE SURFACE THIS GATE MEASURES AGAINST, proved shape by shape. The two plates come out of
  # site/app.css, which is right: the check then measures what the page paints instead of a hex
  # retyped in Python. Until issue 64 the reader of that file assumed WHERE in it a dark value
  # sits, split it on the media block and required one literal on each side, and issue 57's
  # rewrite of the palette gave it zero and took the whole gate down. The reader now resolves a
  # token under each colour scheme wherever the declarations are written.
  #
  # Its probes live beside it in build/model.py, against synthetic stylesheets, for the reason
  # every probe here is synthetic. They are COUNTED HERE because this is where the contrast rule
  # is judged, and a probe suite counted nowhere is a probe suite that can quietly stop running.
  echo
  echo "self-test: the stylesheet reader the contrast gate measures its plates with"
  #
  # A FLOOR OF ONE IS NOT A COUNT. Issue 103, and this block carried the defect its own comment
  # above warns about. It asserted `palette_cases > 0` and ran the producer under `|| true`, so
  # a non-zero exit was swallowed and a stream truncated to a single case was indistinguishable
  # from a complete one. Measured: an edit in build/model.py that made the emitter yield 1 case
  # instead of 22 took this suite from 73/73 to 52/52 at exit 0, while the line meant to notice
  # printed `[OK] the stylesheet reader's own probes ran at all`. Twenty one assertions retired
  # by an edit in a file that is not gate code, and nothing said so.
  #
  # So the count is declared (EXPECTED_PALETTE_CASES) and the producer's exit status is read
  # instead of discarded. The stream goes through a file rather than a process substitution for
  # exactly that second reason: `< <(cmd || true)` has no exit status a caller can see.
  local palette_cases=0 palette_rc=0 verdict name
  python3 "$ROOT/build/model.py" --palette-self-test > "$tmp/palette" 2>/dev/null || palette_rc=$?
  while IFS='|' read -r verdict name; do
    [ -n "$name" ] || continue
    palette_cases=$((palette_cases + 1))
    total=$((total + 1))
    if [ "$verdict" = ok ]; then
      echo "  [OK]   $name"
      pass=$((pass + 1))
    else
      echo "  [MISS] $name"
    fi
  done < "$tmp/palette"

  total=$((total + 1))
  if [ "$palette_cases" -eq "$EXPECTED_PALETTE_CASES" ]; then
    echo "  [OK]   the stylesheet reader emitted all $EXPECTED_PALETTE_CASES cases it intends"
    pass=$((pass + 1))
  else
    echo "  [MISS] the stylesheet reader intends $EXPECTED_PALETTE_CASES cases and emitted $palette_cases"
  fi

  total=$((total + 1))
  if [ "$palette_rc" -eq 0 ]; then
    echo "  [OK]   the stylesheet reader's own suite exited clean"
    pass=$((pass + 1))
  else
    echo "  [MISS] the stylesheet reader's own suite exited $palette_rc and the cases above are what it managed to print"
  fi

  echo
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
  echo "self-test: the name rule, applied by a caller that cannot source the library"

  # scripts/sync_board.mjs is the one thing in this repository that writes a public byte
  # authored outside it: a GitHub issue title, typed into a text box. It is node, so it reaches
  # the name rule through scripts/forbidden_lib.sh --name-lines rather than through a second
  # implementation of the folding. Issue 105. The probes below are about that interface and
  # about the caller's use of it, and none of them prints a token: the interface answers with
  # positions for exactly that reason, and the probe that checks it says so.
  #
  # The register is the synthetic one throughout, except in the one probe that names the real
  # one, and that probe reads nothing out of it: it asks whether a string the caller wrote
  # carries anything the real register holds, and the answer it wants is silence.
  local nl_out
  total=$((total + 1))
  nl_out="$(printf '%s\n' 'a card nobody has to withhold' \
                          'the handle quillfarthingKestrelvane in a title' \
                          'another card nobody has to withhold' \
              | bash "$ROOT/scripts/forbidden_lib.sh" --name-lines "$fake_hashes" 2>/dev/null || true)"
  if [ "$nl_out" = "2" ]; then
    echo "  [OK]   the name rule answered with the position of the one candidate carrying a token"
    pass=$((pass + 1))
  else
    echo "  [MISS] the name rule did not answer with that one position"
  fi

  # And the answer is positions and nothing else. A CI log is a place a real name must not
  # become public, so an interface that echoed the token, or the candidate it came from, would
  # be a leak wearing the shape of a gate.
  total=$((total + 1))
  if [ -n "$nl_out" ] && [ -z "$(printf '%s' "$nl_out" | tr -d '0-9')" ]; then
    echo "  [OK]   the answer is positions only, so no token and no candidate text is in it"
    pass=$((pass + 1))
  else
    echo "  [MISS] the answer carried something other than a position"
  fi

  # The poka-yoke both gates apply to their own inputs. A matcher holding no register matches
  # nothing and would report every candidate clean, which is the loudest lie this rule can tell.
  total=$((total + 1))
  rc=0
  printf '# a register holding no hashes at all\n' > "$tmp/nohashes"
  ( printf 'anything at all\n' \
      | bash "$ROOT/scripts/forbidden_lib.sh" --name-lines "$tmp/nohashes" >/dev/null 2>&1 ) || rc=$?
  if [ "$rc" -eq 2 ]; then
    echo "  [OK]   a register holding no hashes aborted instead of calling every candidate clean"
    pass=$((pass + 1))
  else
    echo "  [MISS] a register holding no hashes answered clean (exit $rc)"
  fi

  # THE OTHER WAY A FULL REGISTER MATCHES NOTHING. Issue 164. The salt and the register are two
  # secrets now, so one of them can be rotated without the other, and a register hashed under
  # the previous salt is a file full of hashes none of which this run can produce. Every gate
  # then scans every file, matches nothing and reports a clean tree, which is indistinguishable
  # from a clean tree. The register carries a salt-check for this and the library refuses a
  # mismatch; the probes below are what make that a claim rather than a comment.
  #
  # Both registers are BUILT and neither is typed: one is a real register's shape with the
  # binding line removed, and the other carries a binding line that is well formed and belongs
  # to a different salt. A literal would be a payload this gate then finds in this file.
  total=$((total + 1))
  rc=0
  { echo "# a register from before the binding existed"; hash_token "kestrelvane"; } > "$tmp/unbound"
  ( bash "$ROOT/scripts/forbidden_lib.sh" --assert-bound "$tmp/unbound" >/dev/null 2>&1 ) || rc=$?
  if [ "$rc" -eq 2 ]; then
    echo "  [OK]   a register that names no salt aborted instead of being trusted"
    pass=$((pass + 1))
  else
    echo "  [MISS] a register that names no salt was accepted (exit $rc)"
  fi

  total=$((total + 1))
  rc=0
  {
    echo "# a register built under some other salt"
    printf '%s%s\n' "$SALT_CHECK_TAG" \
      "$(printf 'zrive-model-toy salt-check\n%s' "not the salt in force" | sha256sum | cut -c1-16)"
    hash_token "kestrelvane"
  } > "$tmp/othersalt"
  ( bash "$ROOT/scripts/forbidden_lib.sh" --assert-bound "$tmp/othersalt" >/dev/null 2>&1 ) || rc=$?
  if [ "$rc" -eq 2 ]; then
    echo "  [OK]   a register built under another salt aborted instead of matching nothing quietly"
    pass=$((pass + 1))
  else
    echo "  [MISS] a register built under another salt was accepted (exit $rc)"
  fi

  # And the control that keeps the two above from being a gate that refuses everything. A
  # register this machine's own salt built has to be accepted, or the assertion is not a binding
  # check, it is an off switch.
  total=$((total + 1))
  rc=0
  { echo "${SALT_CHECK_TAG}$(salt_check)"; hash_token "kestrelvane"; } > "$tmp/bound"
  ( bash "$ROOT/scripts/forbidden_lib.sh" --assert-bound "$tmp/bound" >/dev/null 2>&1 ) || rc=$?
  if [ "$rc" -eq 0 ]; then
    echo "  [OK]   a register built under the salt in force was accepted"
    pass=$((pass + 1))
  else
    echo "  [MISS] a register built under the salt in force was refused (exit $rc)"
  fi

  # And the salt itself, which is the input every one of those turns on. A gate with no salt
  # cannot hash, so it recognises nothing and calls everything clean; the library refuses to
  # load at all rather than reaching that state. Proved by running it with the salt cleared and
  # the config file pointed at a path that does not exist, so neither resolution path can answer.
  total=$((total + 1))
  rc=0
  ( FORBIDDEN_SALT="" FORBIDDEN_SALT_FILE="$tmp/no-salt-file-here" \
      bash "$ROOT/scripts/forbidden_lib.sh" --salt-check >/dev/null 2>&1 ) || rc=$?
  if [ "$rc" -eq 2 ]; then
    echo "  [OK]   no salt anywhere refused to load instead of hashing with nothing"
    pass=$((pass + 1))
  else
    echo "  [MISS] no salt anywhere still loaded (exit $rc)"
  fi

  # The other direction of the same switch: the file path is a real resolution route and not
  # decoration, so a salt reachable ONLY through it has to work.
  total=$((total + 1))
  rc=0
  printf 'FORBIDDEN_SALT=%s\n' "a salt only this file knows" > "$tmp/saltfile"
  ( FORBIDDEN_SALT="" FORBIDDEN_SALT_FILE="$tmp/saltfile" \
      bash "$ROOT/scripts/forbidden_lib.sh" --salt-check >/dev/null 2>&1 ) || rc=$?
  if [ "$rc" -eq 0 ]; then
    echo "  [OK]   a salt reachable only through the config file resolved"
    pass=$((pass + 1))
  else
    echo "  [MISS] a salt in the config file did not resolve (exit $rc)"
  fi

  # The caller, end to end. A fake `gh` stands in for the tracker, so no network and no real
  # issue is involved; BOARD_PATH sends the render to a throwaway file, so a probe can never
  # touch site/board.json; the register is synthetic.
  local ghdir="$tmp/ghbin" board="$tmp/probe-board.json" withheld="" kept="" expected=""
  mkdir -p "$ghdir"
  cat > "$tmp/issues.json" <<'JSON'
[{"number":1,"title":"a card nobody has to withhold","state":"OPEN","labels":[],"url":"https://example.invalid/1","stateReason":""},
 {"number":2,"title":"Ada Kestrelvane asks about the lane heading","state":"OPEN","labels":[],"url":"https://example.invalid/2","stateReason":""}]
JSON
  printf '#!/usr/bin/env bash\ncat %q\n' "$tmp/issues.json" > "$ghdir/gh"
  chmod +x "$ghdir/gh"
  rc=0
  ( cd "$ROOT" && PATH="$ghdir:$PATH" BOARD_PATH="$board" FORBIDDEN_HASHES="$fake_hashes" \
      node "$ROOT/scripts/sync_board.mjs" >/dev/null 2>&1 ) || rc=$?
  if [ "$rc" -eq 0 ] && [ -s "$board" ]; then
    withheld="$(board_title "$board" 2)"
    kept="$(board_title "$board" 1)"
  fi
  expected="$(python3 -c 'import json,sys
issues = json.load(open(sys.argv[1]))
print([i["title"] for i in issues if i["number"] == 1][0])' "$tmp/issues.json")"

  # What the board carries in the poisoned card's place must carry nothing the register holds.
  # Written this way rather than as a comparison against the placeholder, so the probe does not
  # hold a second copy of a string that lives in the caller
  # (KAIZEN.md `kaizen-a-computed-value-is-never-typed-twice`).
  total=$((total + 1))
  rc=0
  nl_out="$(printf '%s\n' "$withheld" \
              | bash "$ROOT/scripts/forbidden_lib.sh" --name-lines "$fake_hashes" 2>/dev/null || true)"
  if [ -n "$withheld" ] && [ -z "$nl_out" ]; then
    echo "  [OK]   the title the board carries in place of the poisoned one holds no token"
    pass=$((pass + 1))
  else
    echo "  [MISS] a title carrying a token from the register reached the board"
  fi

  # The other direction. A gate that withheld everything would pass the probe above and be
  # useless, so the clean card has to arrive exactly as it was typed.
  total=$((total + 1))
  if [ -n "$kept" ] && [ "$kept" = "$expected" ]; then
    echo "  [OK]   a title the register says nothing about reached the board unchanged"
    pass=$((pass + 1))
  else
    echo "  [MISS] a clean title did not reach the board unchanged"
  fi

  # And the string the caller writes instead must be clean against the register that is really
  # in use, not only against the synthetic one this self-test hands it.
  #
  # THE EXIT STATUS IS PART OF THE ANSWER, AND THIS PROBE USED TO THROW IT AWAY. Issue 164. The
  # command substitution ended `|| true` and the verdict was "no output". Those are two different
  # states wearing one face: the rule ran and found nothing, which is the pass this probe is
  # about, and the rule ABORTED, which prints nothing to stdout either. Abort became likelier
  # with this card, because the register is untracked now and a machine can legitimately not
  # have one, but the defect was there the whole time: on a machine with no register this probe
  # printed [OK] and had asked nothing. That is the eighth dead instrument found in this project
  # and it was found by a reviewer reading for exactly this shape.
  #
  # So the status is captured and demanded, and a probe that cannot be run is a MISS rather than
  # a pass. stderr is kept out of the value, not out of existence.
  total=$((total + 1))
  rc=0
  nl_out="$(printf '%s\n' "$withheld" \
              | bash "$ROOT/scripts/forbidden_lib.sh" --name-lines "$HASHES" 2>/dev/null)" || rc=$?
  if [ "$rc" -eq 0 ] && [ -n "$withheld" ] && [ -z "$nl_out" ]; then
    echo "  [OK]   what the caller writes instead is clean against the register in use"
    pass=$((pass + 1))
  elif [ "$rc" -ne 0 ]; then
    echo "  [MISS] the name rule could not be run against the register in use (exit $rc), so this"
    echo "         probe asked nothing. That is not a pass."
  else
    echo "  [MISS] what the caller writes instead is not clean against the register in use"
  fi

  # Fail closed. A rule that could not be asked has not answered clean, so the caller must
  # write no board at all rather than a board nothing gated.
  total=$((total + 1))
  rc=0
  rm -f "$tmp/board-norule.json"
  ( cd "$ROOT" && PATH="$ghdir:$PATH" BOARD_PATH="$tmp/board-norule.json" \
      FORBIDDEN_HASHES="$tmp/no-register-at-this-path" \
      node "$ROOT/scripts/sync_board.mjs" >/dev/null 2>&1 ) || rc=$?
  if [ "$rc" -ne 0 ] && [ ! -e "$tmp/board-norule.json" ]; then
    echo "  [OK]   a name rule that could not be run wrote no board at all"
    pass=$((pass + 1))
  else
    echo "  [MISS] a name rule that could not be run still let a board be written (exit $rc)"
  fi

  echo
  echo "self-test: the two implementations of one rule, put through the same input"

  # WHY THIS SECTION EXISTS. Issue 117, and it is the fifth time one rule in two places has bitten
  # this repository. build/safety_grep.py is the local, pre-push copy of the rules
  # scripts/forbidden_lib.sh owns. Its header said so and the library's header said so, and the
  # two copies of the token rule had NEVER been the same rule: the library folds with
  # `tr -cs 'A-Za-z' '\n'`, so an underscore separates, and the Python copy searched the folded
  # text for `\b` boundaries, where an underscore is a WORD character. A register name touching
  # an underscore was refused by CI and reported clean by the gate a person runs before pushing.
  # Measured at the SHA that filed it: 477 of 2607 distinct strings on the shipped page carry an
  # underscore, and one invented name in thirteen placements scored 13 of 13 in the library and
  # 6 of 13 in the Python copy, the seven misses being exactly the seven with an underscore in
  # them.
  #
  # WHY IT IS A COMPARISON AND NOT A PATCH. The defect survived three readers, twice, each of
  # whom confirmed the copies agreed by checking that a change was present in both files. That is
  # a different claim from "they answer the same", and only the second one is checkable. Every
  # probe below runs BOTH implementations, for real, through the interfaces they expose, and
  # fails on a disagreement. Two copies that agree today are two copies that can drift tomorrow.
  #
  # THE DECLARED DISAGREEMENTS ARE ASSERTED IN BOTH DIRECTIONS, which is what keeps this from
  # becoming a table of excuses: a probe that declares the Python copy stricter fails if the two
  # ever agree, so closing one of them means editing this file in front of a reader.

  local dtmp="$tmp/diff" dperson="Ada Kestrelvane" dhome="$tmp/reghome" dreg dhashes dtok
  mkdir -p "$dtmp"
  dhashes="$tmp/diff-hashes"
  # Two payloads below are BUILT rather than typed, for the reason the uuid cap probe gives: a
  # complete literal here is a payload this gate then finds in this file, and a declaration is a
  # hole. Neither half is a match on its own.
  local dhex='0123456789abcdef' ddot='.'

  # ONE REGISTER, READ TWO WAYS. The library matches salted hashes of the folded tokens and the
  # Python copy matches the plaintext it folds out of the register directory, so the two halves
  # are built here from ONE string: the .md filename the Python gate reads, and the hash list the
  # library reads, both derived from $dperson. A probe in which the two gates are looking for
  # different names would answer about the fixture rather than about the rule. The register path
  # is asked of the module rather than typed, the way scripts/verify.sh asks for it
  # (KAIZEN.md `kaizen-a-computed-value-is-never-typed-twice`).
  dreg="$(cd "$ROOT" && HOME="$dhome" python3 -c 'import sys; sys.path.insert(0, "build"); import safety_grep; print(safety_grep.FACULTY)')"
  mkdir -p "$dreg"
  : > "$dreg/$dperson - Kestrel Analytics.md"
  printf '%s\n' "$dperson" | fold_tokens | while IFS= read -r dtok; do hash_token "$dtok"; done > "$dhashes"

  # The corpus probes. `--fold-tokens` on either side answers with the folding ALONE, one token
  # per line, sorted, with no register in it, which is what makes the two answers comparable at
  # all. An empty answer from either side is a MISS and not a match: two implementations that
  # both found nothing have agreed about nothing.
  fold_diff() {  # name corpus-file
    local name="$1" f="$2" a b
    total=$((total + 1))
    a="$(bash "$ROOT/scripts/forbidden_lib.sh" --fold-tokens < "$f" 2>/dev/null || true)"
    b="$(cd "$ROOT" && python3 build/safety_grep.py --fold-tokens < "$f" 2>/dev/null || true)"
    if [ -z "$a" ] || [ -z "$b" ]; then
      echo "  [MISS] $name: one implementation answered nothing, so nothing was compared"
    elif [ "$a" = "$b" ]; then
      echo "  [OK]   $name: $(printf '%s\n' "$a" | wc -l) tokens, the two implementations identical"
      pass=$((pass + 1))
    else
      echo "  [MISS] $name: the two implementations disagree on $(diff <(printf '%s\n' "$a") <(printf '%s\n' "$b") | grep -c '^[<>]') token(s)"
    fi
  }

  # The bytes the public is served. The card's own instruction: the corpus is the real shipped
  # strings, because there is no need for a synthetic one to find a disagreement.
  ( cd "$ROOT" && find site -type f | sort | xargs cat ) > "$dtmp/site.txt" 2>/dev/null || true
  fold_diff "the bytes the page ships" "$dtmp/site.txt"

  # And every tracked file, which is the population the repository gate walks. site/ is written
  # in camelCase and the rest of the tree is written in snake_case, so this corpus is where the
  # underscore actually lives.
  ( cd "$ROOT" && git ls-files -z | xargs -0 cat ) > "$dtmp/tracked.txt" 2>/dev/null || true
  fold_diff "every tracked file" "$dtmp/tracked.txt"

  # An invented name in every placement the audit measured, and the seven with an underscore are
  # the seven the Python copy used to miss. Written here rather than derived, because a fixed
  # list is the thing a reader can check against the finding.
  printf '%s\n' 'Kestrelvane_2026' 'Kestrelvane_x' 'x_Kestrelvane' '_Kestrelvane' 'Kestrelvane_' \
                'data_Kestrelvane_row' 'Kestrelvane.md' 'Kestrelvane-2026' 'node_Kestrelvane' \
                'KestrelvaneX' 'Kestrelvane1' '1Kestrelvane' 'Kestrelvane' 'xxKestrelvane' \
                'ZBLKestrelvane' 'myKestrelvaneRow' '__Kestrelvane__' > "$dtmp/placements.txt"
  fold_diff "a name in seventeen placements, seven of them at an underscore" "$dtmp/placements.txt"

  # THE OTHER HALF OF THE FOLDING, and it is not the boundary. The library transliterates with
  # `iconv -c -t ASCII//TRANSLIT`, which turns a letter with no canonical decomposition into
  # ASCII letters; Python's NFKD plus "encode ascii, ignore" deleted it, which both lost the
  # token the library produces AND joined the letters on either side into one the library never
  # produces. Every code point below U+0180 is put through both, in the middle of a letter run
  # so a difference in either direction shows. Above U+0180 they still differ, on 66 code points
  # of Latin Extended-B measured at the SHA that wrote this: that range is phonetic and African
  # orthography, closing it means carrying a generated copy of one libc's transliteration table,
  # and that table is not the same table on another libc. Which is also why this probe is worth
  # running on every machine rather than once: it re-measures the local iconv.
  local dcp dch
  : > "$dtmp/codepoints.txt"
  for dcp in $(seq 1 383); do
    [ "$dcp" -eq 10 ] && continue
    printf -v dch '\\u%04x' "$dcp"
    printf "Aaaa%bbbbB\n" "$dch" >> "$dtmp/codepoints.txt"
  done
  fold_diff "every code point below U+0180, inside a letter run" "$dtmp/codepoints.txt"

  # The gate probes. Above compares the folding; these compare the two GATES, end to end, on one
  # payload, with one register. `trip` and `pass` are written per side, so a row where they
  # differ is a declared disagreement and says why.
  gate_diff() {  # name expect-shell expect-python payload
    local name="$1" es="$2" ep="$3" payload="$4" rs=pass rp=pass rc=0 dir
    total=$((total + 1))
    dir="$dtmp/gate$total"; mkdir -p "$dir/site"
    printf '%s\n' "$payload" > "$dir/site/probe.txt"
    (
      FORBIDDEN_EXEMPT=()
      FAILURES=0
      scan_file "$dir/site/probe.txt" probe.txt "$dhashes" >/dev/null 2>&1
      [ "$FAILURES" -eq 0 ]
    ) || rs=trip
    rc=0
    ( cd "$ROOT" && HOME="$dhome" python3 build/safety_grep.py "$dir/site" >/dev/null 2>&1 ) || rc=$?
    case "$rc" in
      0) rp=pass ;;
      1) rp=trip ;;
      *) rp="refused($rc)" ;;
    esac
    if [ "$rs" = "$es" ] && [ "$rp" = "$ep" ]; then
      echo "  [OK]   $name"
      pass=$((pass + 1))
    else
      echo "  [MISS] $name: wanted library=$es python=$ep, got library=$rs python=$rp"
    fi
  }

  gate_diff "both refuse a name written on its own"            trip trip 'taught by Ada Kestrelvane in March'
  gate_diff "both refuse a name inside an identifier"          trip trip 'the data_Kestrelvane_row column'
  gate_diff "both refuse a name with a trailing underscore"    trip trip 'the column Kestrelvane_2026 in the export'
  gate_diff "both refuse a name with a leading underscore"     trip trip 'the field _Kestrelvane holds it'
  gate_diff "both refuse a name glued in camelCase"            trip trip 'the handle quillfarthingKestrelvane in a log line'
  gate_diff "both refuse a name glued to an acronym"           trip trip 'the ZBLKestrelvane row of the export'
  gate_diff "both refuse a name glued to a digit"              trip trip 'user Kestrelvane2026 signed the record'
  gate_diff "both refuse a banned word inside an identifier"   trip trip 'built on the node_Palantir_row, allegedly'
  gate_diff "both refuse a banned phrase before an underscore" trip trip 'a digital twin_of the operation'
  gate_diff "both refuse an email address"                     trip trip 'contact alguien@example.com for detail'
  gate_diff "both refuse a uuid"                               trip trip 'id 3f2504e0-4f89-11d3-9a0c-0305e82c3301'
  gate_diff "both refuse a corpus link"                        trip trip 'see collection://a1b2c3 for the source'
  gate_diff "both refuse a grouped money figure"               trip trip 'turnover of 1.138.000,00 EUR last year'
  gate_diff "both refuse a bare page id"                       trip trip "page ${dhex}${dhex} in the export"
  gate_diff "both refuse the corpus host"                      trip trip "see notion${ddot}so/a-page for the source"
  gate_diff "both refuse a figure split across a line break"   trip trip 'the amount 1200'$'\n''EUR was paid'

  # The controls. Without these the whole section would pass with both gates wedged shut, which
  # is the dead-control shape this repository keeps finding in its own suites.
  gate_diff "both pass ordinary camelCase identifiers"         pass pass \
        'document.getElementById(id); ZT.termRoutes(); new XMLHttpRequest(); bandPlate'
  gate_diff "both pass the two declared invented figures"      pass pass \
        'total_price 4.000,00 EUR and amount_claimed 1.000,00 EUR, --lh-ui: 1.28581'
  gate_diff "both pass a fractional-second timestamp"          pass pass '{"generated":"2026-08-09T16:42:46.932Z"}'
  gate_diff "both pass a name the register does not hold"      pass pass 'taught by Bea Thistlewaite in March'

  # THE ONE DECLARED DISAGREEMENT, asserted rather than tolerated. Python's `\d` is Unicode
  # aware and PCRE's is not, so a figure written in Arabic-Indic or fullwidth digits beside a
  # currency mark is a finding to the local gate and nothing to the two CI gates. The stricter
  # answer is Python's and it is deliberately NOT copied into the library: matching it needs
  # PCRE's `(*UTF)` mode, under which a file holding one invalid UTF-8 byte stops being scanned
  # and returns no match at all, and a rule that goes quiet on a malformed file is a worse
  # failure than the one it closes. Recorded on issue 117 rather than repaired here.
  gate_diff "declared: only the local gate reads a figure whose digits are not ASCII" \
        pass trip 'a fee of ١٢٣ EUR per session'

  # A THIRD COPY OF A RULE, AND THE SAME TREATMENT. Issue 164 took the salt out of the library
  # and left build/model.py, which hashes every string the model ships, needing to find it
  # without a literal to read. It is Python, it cannot source the library, so it resolves the
  # salt itself: environment first, then the same config file, by the same precedence. That is
  # two implementations of one resolution, which is the shape this whole section exists for.
  #
  # They are compared through the one value both can say out loud. A salt-check is one way over
  # the salt under its own prefix, so neither side has to print the secret to prove it resolved
  # the same one, and a disagreement means the model would hash with a salt the register was not
  # built under, find nothing, and pass a roster it never checked.
  total=$((total + 1))
  local sc_sh sc_py
  sc_sh="$(bash "$ROOT/scripts/forbidden_lib.sh" --salt-check 2>/dev/null || true)"
  sc_py="$(cd "$ROOT" && python3 build/model.py --salt-check 2>/dev/null || true)"
  if [ -n "$sc_sh" ] && [ "$sc_sh" = "$sc_py" ]; then
    echo "  [OK]   the shell and Python resolutions of the salt agree, salt-check $sc_sh"
    pass=$((pass + 1))
  else
    echo "  [MISS] the shell and Python resolutions of the salt disagree or one did not answer"
    echo "         shell: ${sc_sh:-<no answer>}   python: ${sc_py:-<no answer>}"
  fi

  echo
  echo "self-test: $pass/$total, of $EXPECTED_PROBES intended"
  local short=0
  if [ "$total" -ne "$EXPECTED_PROBES" ]; then
    short=1
    echo
    echo "ASSERTION FAILED: this suite intends $EXPECTED_PROBES probes and $total ran."
    echo "A ratio is not a count. Either a probe stopped running, in which case the rule it"
    echo "proved is now proved by nothing, or one was added and EXPECTED_PROBES was not moved"
    echo "with it. Both are edits somebody has to make on purpose."
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

  local content=$((FAILURES - CITATION_FAILURES - CONTRAST_FAILURES - NUL_FAILURES))
  if [ "$content" -gt 0 ]; then
    echo "VERDICT: FORBIDDEN CONTENT IS COMMITTED ($content findings)"
    echo "Remove it from the working tree first; then decide what the history needs."
  fi
  if [ "$CITATION_FAILURES" -gt 0 ]; then
    echo "VERDICT: $CITATION_FAILURES citation(s) name an entry that does not exist"
    echo "Cite the slug the entry carries, or add the entry the citation was written about."
  fi
  if [ "$NUL_FAILURES" -gt 0 ]; then
    echo "VERDICT: $NUL_FAILURES tracked file(s) carry a raw NUL byte"
    echo "Write the escape sequence for the character instead. The string value is unchanged and"
    echo "the file goes back to being text, which is what decides whether grep reads it at all."
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
