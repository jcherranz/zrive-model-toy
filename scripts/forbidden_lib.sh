#!/usr/bin/env bash
# Shared rules for the forbidden-content gates.
#
# There are two gates and they ask different questions:
#   scripts/check_forbidden.sh  is the thing the public can read clean?   (deployed bytes)
#   scripts/check_repo.sh       is the repository clean?                  (every tracked file)
#
# They must fold, hash and match identically or one of them silently stops catching what the
# other catches. One copy of every rule, sourced by both. Nothing below is duplicated in either
# caller; a rule literal that appears in a caller is a bug in this file's ownership.
#
# build/safety_grep.py is a third, local, pre-push copy of the same rules in Python. It cannot
# source this file and it therefore can drift. STATING IT WAS NOT ENOUGH, and issue 117 measured
# how much: the two copies of the token rule had never been the same rule, because this file
# splits on anything that is not a letter and `_` is a word character to Python's \b. Both copies
# now answer the same question through the same interface,
#
#   bash scripts/forbidden_lib.sh --fold-tokens   |   python3 build/safety_grep.py --fold-tokens
#
# one folded token per line on stdout, and scripts/check_repo.sh --self-test puts one corpus
# through both and refuses a disagreement. The sentence above is now a claim something checks.

# ---------------------------------------------------------------------------------------
# THE SALT, WHICH IS NOT WRITTEN DOWN HERE ANY MORE. Issue 164.
# ---------------------------------------------------------------------------------------
# This line used to be an assignment. The value it assigned was also printed, in clear, in the
# header of the hash list it protects, and that list was a tracked file in a repository the world
# can read. The generator's own header conceded that hashing bought obscurity and not secrecy; it
# conceded it about a PRIVATE repository, and the repository is public. Measured with the exact
# construction below, in single-threaded pure Python on an ordinary laptop: a little over eight
# hundred thousand hashes a second, so a dictionary of a hundred thousand ordinary Spanish given
# names and surnames runs against the whole register in about a tenth of a second. A salt that is
# published is not a salt. A salt that is a readable slug is barely one either, so the value that
# replaced it is random and not memorable.
#
# WHERE IT LIVES NOW. In one place per machine, and never in this repository:
#
#   CI          the FORBIDDEN_SALT repository secret, exported by scripts/ci_register.sh
#               before any gate step runs
#   a developer the FORBIDDEN_SALT environment variable, or a line
#               FORBIDDEN_SALT=<value> in $HOME/.config/zrive-model-toy/forbidden.env
#
# WHAT HAPPENS WITH NEITHER. This file refuses to load. Not a warning, not a skip, not a default:
# every consumer of this library is a gate, a gate that cannot hash cannot recognise anything, and
# a matcher that recognises nothing reports every input clean. That is the loudest lie this
# machinery can tell and it is the one failure mode the whole file is written against, so the
# refusal is at the top, before a caller has printed a banner it would then have to retract.
#
# THE FILE IS PARSED AND NOT SOURCED. Sourcing hands a config file the ability to run commands
# inside every gate in this repository. One line of parsing costs nothing and takes that away.
FORBIDDEN_SALT_FILE="${FORBIDDEN_SALT_FILE:-$HOME/.config/zrive-model-toy/forbidden.env}"

if [ -z "${FORBIDDEN_SALT:-}" ] && [ -r "$FORBIDDEN_SALT_FILE" ]; then
  FORBIDDEN_SALT="$(sed -n 's/^[[:space:]]*FORBIDDEN_SALT[[:space:]]*=[[:space:]]*//p' \
                      "$FORBIDDEN_SALT_FILE" | tr -d '"'\''' | head -1)"
fi

if [ -z "${FORBIDDEN_SALT:-}" ]; then
  {
    echo "ASSERTION FAILED: no FORBIDDEN_SALT, so the name gate cannot hash anything."
    echo
    echo "  Every gate that sources scripts/forbidden_lib.sh recognises a real name by hashing"
    echo "  it and looking the hash up. With no salt there is no hash, nothing matches, and a"
    echo "  gate that matches nothing calls every file clean. It refuses to run instead."
    echo
    echo "  In CI: set the FORBIDDEN_SALT repository secret and put the scripts/ci_register.sh"
    echo "  step in front of the gate step."
    echo
    echo "  On a developer machine: export FORBIDDEN_SALT, or write one line"
    echo "  FORBIDDEN_SALT=<value> into $FORBIDDEN_SALT_FILE and chmod it 600."
    echo
    echo "  The value is not in this repository and must never be committed to it. Ask the"
    echo "  owner. Without it you can read this tree and you cannot run its content gates."
  } >&2
  exit 2
fi

# Binds a register to the salt it was generated with. WHY THIS EXISTS: the salt and the hash list
# are two secrets now, and two secrets rotate independently, which means one of them can be
# rotated alone. A register hashed under the previous salt, read by a gate holding the current
# one, matches nothing at all and every gate reports clean. That is the same lie as a missing
# salt wearing a clean-looking hat, and nothing about the run would look wrong.
#
# So the generator stamps this value into the register's header and the gates check it before
# they trust the register. It is the same one-way construction as a token hash, over the salt
# alone and under its own prefix so it can never collide with one, and it discloses nothing that
# the register does not already: against a random salt it is not invertible, and the register is
# not public any more in any case.
salt_check() {
  printf 'zrive-model-toy salt-check\n%s' "$FORBIDDEN_SALT" | sha256sum | cut -c1-16
}

SALT_CHECK_TAG='# salt-check: '

# A register the gates are about to trust must say which salt it was built under, and must be
# right about it. Called by the two gates on the register actually in use, and by nothing else:
# the synthetic registers a self-test writes are fixtures for the matcher and are built under
# the salt in force by construction.
assert_register_bound() {  # hashfile
  local f="$1" want got
  want="$(salt_check)"
  got="$(sed -n "s/^${SALT_CHECK_TAG}//p" "$f" | head -1)"
  if [ -z "$got" ]; then
    {
      echo "ASSERTION FAILED: the register at $f carries no salt-check line."
      echo "  It was written by a generator older than issue 164, which means it was hashed"
      echo "  under the published salt. Regenerate it with scripts/gen_forbidden_hashes.sh."
    } >&2
    exit 2
  fi
  if [ "$got" != "$want" ]; then
    {
      echo "ASSERTION FAILED: the register at $f was built under a different salt."
      echo "  Nothing in it can match, so this gate would report every file clean. Refusing."
      echo "  Either the FORBIDDEN_SALT in force is stale, or the register is. Regenerate the"
      echo "  register from the vault with scripts/gen_forbidden_hashes.sh under the salt you"
      echo "  intend, and update BOTH repository secrets together."
    } >&2
    exit 2
  fi
}

# Tokens shorter than this are too common to be a name signal.
FORBIDDEN_MIN_TOKEN=4

# Tokens that are real name fragments AND ordinary words. Hashing them would fire the gate on
# every build for no gain. Each one is a deliberate hole in the net, so the list is short and
# stays visible rather than growing quietly.
FORBIDDEN_STOP="jose juan maria capital partners company group real para"

# ---------------------------------------------------------------------------------------
# The rules
# ---------------------------------------------------------------------------------------

# Words that name the vendor architecture this model was deliberately not written in.
BANNED_WORDS=(Palantir Foundry Gotham AIP Blueprint "digital twin")

# The only money strings this toy is allowed to carry. Both figures are invented; EUR is the
# currency label that sits beside them.
ALLOWED_MONEY=$'1.000,00\n4.000,00\nEUR'

MONEY_RE='(?<![\d.,])\d{1,3}(?:\.\d{3})+(?:,\d{2})?(?![\d.])|(?<![\d.,])\d{1,3}(?:,\d{3})+(?:\.\d{2})?(?![\d,])|\d[\d.,]*\s*(?:EUR|eur|€)|€|\bEUR\b|\beuros?\b'
ISO_TS_MASK='s/[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?(Z|[+-][0-9]{2}:?[0-9]{2})?/ /g'
UUID_RE='[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
EMAIL_RE='[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
COLLECTION_RE='collection://'
# A page id in its unhyphenated form, and the host the private corpus is served from. Both point
# back at the corpus exactly as COLLECTION_RE does, and until issue 117 they were a rule
# build/safety_grep.py had and this file did not, so a page id in a tracked file was refused by
# the gate a person runs over site/ before pushing and invisible to the two gates that read
# every tracked file and the deployed bytes. That is F15's shape with the halves swapped, and
# it was found the same way: by running both implementations over one corpus and reading the
# disagreement. Measured at the SHA that added it: zero matches in any tracked file.
NOTION_RE='(?i)\b[0-9a-f]{32}\b|notion\.so'

# ---------------------------------------------------------------------------------------
# Folding and hashing
# ---------------------------------------------------------------------------------------

# stdin -> one folded token per line, deduplicated, stop-words removed.
# Folding: transliterate to ASCII (Muñoz -> Munoz), split on anything that is not a letter,
# lowercase. Digits are not letters, so they have always separated: "kestrelvane2026" was never
# one token.
#
# EVERY NAME IN THIS COMMENT IS INVENTED, and has to be. The worked example that makes the point
# is the exact position a real surname stood in once already
# (HANSEI.md `2026-08-09-gate-scoped-to-the-public-surface`), and the first draft of this comment
# put another one there: it was written with a real camelCase pair, the rule below caught it on
# the first run, and the example was replaced rather than the rule.
#
# AND EACH RUN OF LETTERS IS ALSO CUT AT ITS CASE BOUNDARIES. A name glued to another word
# survives the split on punctuation, and the old order lowercased first, which destroyed the one
# boundary left, so "quillfarthingKestrelvane" folded to a single token that matched nothing
# while both halves were sitting in the register. Every run is now emitted whole AND cut at
# every lower-to-upper and acronym-to-word boundary, and every piece is looked up.
#
# EMITTING THE WHOLE RUN AS WELL IS WHAT MAKES THIS ADDITIVE, and additive is the only safe
# direction for a change to the folding: no token the previous folding produced is lost, the
# register regenerates as a superset of itself, and the net can only get finer. A decomposition
# that replaced the run with its pieces would have dropped "mcquillfarthing" on the way to
# finding "quillfarthing", which is a hole opened while closing one.
#
# WHAT IT STILL DOES NOT SEE. A run with no case boundary at all is still one token, so a name
# concatenated in lower case ("xxkestrelvane") is not decomposed. Catching that needs substring
# matching, which is a different rule with a different false-positive profile, and it is not
# this one. Stated rather than implied.
fold_tokens() {
  iconv -c -f UTF-8 -t ASCII//TRANSLIT \
    | tr -cs 'A-Za-z' '\n' \
    | awk -v min="$FORBIDDEN_MIN_TOKEN" -v stop="$FORBIDDEN_STOP" '
        BEGIN { n = split(stop, s, " "); for (i = 1; i <= n; i++) drop[s[i]] = 1 }
        function emit(t,   l) {
          l = tolower(t)
          if (length(l) >= min && !(l in drop)) print l
        }
        {
          w = $0
          if (w == "") next
          emit(w)
          piece = substr(w, 1, 1)
          for (i = 2; i <= length(w); i++) {
            c = substr(w, i, 1)
            p = substr(w, i - 1, 1)
            q = substr(w, i + 1, 1)
            if (c ~ /[A-Z]/ && (p ~ /[a-z]/ || (p ~ /[A-Z]/ && q ~ /[a-z]/))) {
              emit(piece); piece = c
            } else {
              piece = piece c
            }
          }
          emit(piece)
        }
      ' \
    | sort -u
}

# Same transliteration and lowercasing as fold_tokens, but line structure preserved, so a
# folded token can be located by line number without the caller holding the original spelling.
fold_lines() {
  iconv -c -f UTF-8 -t ASCII//TRANSLIT | tr 'A-Z' 'a-z'
}

# token -> salted, truncated hash
hash_token() {
  printf '%s%s' "$FORBIDDEN_SALT" "$1" | sha256sum | cut -c1-16
}

# The same hash, for a whole list of tokens at once: stdin is one token per line, stdout is one
# hash per line, in the same order.
#
# WHY THIS EXISTS. hash_token costs a command substitution and two processes per call, and the
# name rule called it once per token per file, then grepped the hash list once more for the
# answer. Over this repository that was 8415 calls and some 34 thousand processes, and it was
# very nearly the whole runtime of the repository gate, which took over a minute on a warm
# machine and grew as files times tokens. The rule is unchanged; same salt, same sha256, same 16
# characters. What changed is the process count, from one hashing pipeline per token to one per
# file.
#
# Note for anyone adding to this comment: the money rule reads this file like any other, so a
# figure written with thousands separators here is a finding. Write it plainly.
#
# The shell fallback is the old loop, kept for a machine with no usable perl. It is slow and
# correct, and hash_tokens_select proves at run time that the fast path returns what hash_token
# returns rather than assuming it.
_hash_tokens_perl() {
  FORBIDDEN_SALT="$FORBIDDEN_SALT" perl -MDigest::SHA=sha256_hex -ne \
    'chomp; print substr(sha256_hex($ENV{FORBIDDEN_SALT} . $_), 0, 16), "\n"'
}

_hash_tokens_shell() {
  local t
  while IFS= read -r t; do hash_token "$t"; done
}

FORBIDDEN_HASHER=""

# Poka-yoke. Two implementations of one hash are two hashes unless something checks. The fast
# path is asked for a known token and has to answer exactly what hash_token answers, or the gate
# stops: a hasher that disagrees with the one that wrote scripts/forbidden_names.sha256 would
# match nothing and report clean, which is the loudest lie this gate can tell. A perl that
# cannot run at all (no Digest::SHA) prints nothing and is treated as absent, not as wrong.
hash_tokens_select() {
  [ -n "$FORBIDDEN_HASHER" ] && return 0
  local probe=parityprobe expect got
  expect="$(hash_token "$probe")"
  if command -v perl >/dev/null 2>&1; then
    got="$(printf '%s\n' "$probe" | _hash_tokens_perl 2>/dev/null || true)"
    if [ "$got" = "$expect" ]; then
      FORBIDDEN_HASHER=perl
      return 0
    fi
    if [ -n "$got" ]; then
      echo "ASSERTION FAILED: the batch hasher disagrees with hash_token" >&2
      exit 2
    fi
  fi
  FORBIDDEN_HASHER=shell
}

hash_tokens() {
  hash_tokens_select
  case "$FORBIDDEN_HASHER" in
    perl) _hash_tokens_perl ;;
    *)    _hash_tokens_shell ;;
  esac
}

# The name hash list, read into memory once rather than grepped once per token. Keyed on the
# path plus its size and full-precision mtime, so a run that scans against a different list, or
# against a list rewritten under it, reloads instead of answering from the previous one.
FORBIDDEN_HASHSET_SRC=""
declare -A FORBIDDEN_HASHSET=()

load_hashset() {  # hashfile
  local stamp line
  stamp="$1|$(stat -c '%s|%y' "$1" 2>/dev/null || echo '?')"
  [ "$FORBIDDEN_HASHSET_SRC" = "$stamp" ] && return 0
  FORBIDDEN_HASHSET=()
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in ''|'#'*) continue ;; esac
    FORBIDDEN_HASHSET["$line"]=1
  done < "$1"
  FORBIDDEN_HASHSET_SRC="$stamp"
}

# ---------------------------------------------------------------------------------------
# The scan, one file at a time. Both gates call this, so a rule proved by either self-test is
# the rule that runs in both.
# ---------------------------------------------------------------------------------------

FAILURES=0

# Prefix on every finding, naming which snapshot of a path the bytes came from. Empty for the
# working tree, which is the ordinary case and needs no label. The repository gate sets it to
# "staged " or "committed " while it scans the index and HEAD copies of a path whose disk copy
# differs, because "the file is clean" and "what you are about to commit is clean" are two
# different sentences and a finding has to say which one it is about.
FORBIDDEN_ORIGIN=""

fail() {
  FAILURES=$((FAILURES + 1))
  echo "  [FORBIDDEN] ${FORBIDDEN_ORIGIN}$*"
}

# All matches of a pattern in a file, deduplicated. Empty output when there are none, and no
# non-zero exit: a rule that finds nothing is a normal outcome, not an error.
#
# ALL MEANS ALL, AND IT DID NOT. Issue 103. This carried an undocumented `head -20`, and the
# value it truncated is the one scan_file's rule loops iterate, not a printed report: the
# twenty first distinct match in a file was never compared against the exemption table and never
# reached fail(), so a file holding twenty one corpus links, uuids or email addresses was judged
# on twenty of them and the gate said clean about the rest. The docstring above said "all
# matches" the whole time, which is the difference this card is about.
#
# The cap is gone rather than raised. A higher number is the same defect further away, and there
# is nothing to trade for it: `sort -u` has already collapsed the repeats, these three patterns
# match nothing at all in a healthy tree, and a file that really does hold hundreds of them is a
# file whose findings a reader needs in full. Truncating the DECIDING path to keep a log short
# is trading the answer for the report.
collect() {
  grep -aoP "$1" "$2" | sort -u || true
}

# Declared self-matches. The repository-side gate has to scan the gate's own source, which
# carries the rule literals by construction, so a match there is expected rather than a
# finding. Each entry is one exact triple "rule|path|literal" and licenses nothing else: a
# different email address in the same file, or the same word in a different file, still fails.
# Populated by the caller; empty here, so the deployed-bytes gate exempts nothing.
#
# The real-name rule is NOT exemptible. It has no branch through this table at any path, which
# is why an entry naming it is rejected rather than ignored (see check_repo.sh).
FORBIDDEN_EXEMPT=()
declare -A FORBIDDEN_EXEMPT_HITS=()

# When 1, a matched name token is printed. Correct for the deployed-bytes gate, where the name
# is already public and printing it is the only way the finding is actionable. Wrong for the
# repository gate, where the name is not public and a CI log is a place it must not become
# public, so that gate reports the file and the line numbers and redacts the token.
FORBIDDEN_NAME_ECHO="${FORBIDDEN_NAME_ECHO:-1}"

forbidden_exempt() {  # rule path literal -> 0 if declared
  local key="$1|$2|$3" e
  for e in ${FORBIDDEN_EXEMPT[@]+"${FORBIDDEN_EXEMPT[@]}"}; do
    if [ "$e" = "$key" ]; then
      FORBIDDEN_EXEMPT_HITS["$key"]=1
      return 0
    fi
  done
  return 1
}

scan_file() {  # file label hashfile
  local f="$1" rel="$2" hashfile="$3"
  local w m hit tok h lines

  # 1. words that name the vendor architecture this model was deliberately not written in
  for w in "${BANNED_WORDS[@]}"; do
    if grep -aqiP "(?<![A-Za-z])\Q${w}\E(?![A-Za-z])" "$f"; then
      forbidden_exempt banned-word "$rel" "$w" || fail "$rel: banned word: $w"
    fi
  done

  # 2. identifiers that would point back at the private corpus
  hit="$(collect "$COLLECTION_RE" "$f")"
  while IFS= read -r m; do
    [ -n "$m" ] || continue
    forbidden_exempt corpus-link "$rel" "$m" || fail "$rel: corpus link: $m"
  done <<< "$hit"

  hit="$(collect "$UUID_RE" "$f")"
  while IFS= read -r m; do
    [ -n "$m" ] || continue
    forbidden_exempt uuid "$rel" "$m" || fail "$rel: uuid: $m"
  done <<< "$hit"

  hit="$(collect "$EMAIL_RE" "$f")"
  while IFS= read -r m; do
    [ -n "$m" ] || continue
    forbidden_exempt email "$rel" "$m" || fail "$rel: email address: $m"
  done <<< "$hit"

  hit="$(collect "$NOTION_RE" "$f")"
  while IFS= read -r m; do
    [ -n "$m" ] || continue
    forbidden_exempt notion-id "$rel" "$m" || fail "$rel: notion id: $m"
  done <<< "$hit"

  # 3. money. Anything money-shaped that is not one of the two declared invented figures.
  # An ISO 8601 instant with fractional seconds reads as a grouped figure to this pattern
  # (2026-08-09T16:42:46.932Z contains 46.932), and site/board.json carries a timestamp.
  # Timestamps are blanked out of the copy the money pattern sees, and only that copy: the
  # mask is fully anchored on digits and separators, so no euro figure can hide inside one.
  # build/safety_grep.py carries the same rule and the two must be changed together, and issue
  # 117 wired a probe that reads both rather than a sentence asking a reader to.
  #
  # THE LINE STRUCTURE IS FLATTENED BEFORE THE PATTERN SEES IT, and only after the mask has run,
  # which is line anchored and has to stay that way. `\d[\d.,]*\s*(?:EUR|eur|€)` has a `\s*`
  # in it, so a figure at the end of one line and its currency mark at the start of the next is
  # one match to the Python copy, which reads the whole file, and was no match at all here,
  # where grep reads a line at a time. Prose wraps; that is not a hypothetical shape. Measured
  # over every tracked file at the SHA that changed it: the flattened and unflattened scans
  # return the identical match set on all of them, so this adds reach and moves no finding.
  hit="$(sed -E "$ISO_TS_MASK" "$f" | tr '\n' ' ' | grep -aoP "$MONEY_RE" | sed 's/[[:space:]]*$//' | sort -u || true)"
  while IFS= read -r m; do
    [ -n "$m" ] || continue
    grep -Fxq "$m" <<< "$ALLOWED_MONEY" && continue
    forbidden_exempt money "$rel" "$m" || fail "$rel: undeclared money figure: $m"
  done <<< "$hit"

  # 4. real names. The bytes are folded into tokens and hashed the same way the register was,
  # so the gate can recognise a name it does not hold. No exemption is consulted here.
  #
  # Every token in the file is hashed in one call and looked up in an in-memory set. The
  # previous shape was a hashing pipeline and a grep of the hash list per token; the tokens and
  # the comparison are the same, and the count assertion below refuses to let a short answer
  # from the batch hasher pass as "no names found".
  local -a toks=() hs=()
  local i
  # Both of these cache, and both are called here rather than inside the pipeline below: the
  # right-hand side of a pipe is a subshell, so a selection made there would be discarded and
  # re-probed for every file, and its assertion would abort only the subshell.
  hash_tokens_select
  load_hashset "$hashfile"
  mapfile -t toks < <(fold_tokens < "$f")
  [ "${#toks[@]}" -gt 0 ] || return 0
  mapfile -t hs < <(printf '%s\n' "${toks[@]}" | hash_tokens)
  if [ "${#hs[@]}" -ne "${#toks[@]}" ]; then
    echo "ASSERTION FAILED: hashed ${#hs[@]} of ${#toks[@]} tokens in $rel" >&2
    exit 2
  fi
  for i in "${!toks[@]}"; do
    tok="${toks[$i]}"
    [ -n "$tok" ] || continue
    h="${hs[$i]}"
    [ -n "${FORBIDDEN_HASHSET[$h]:-}" ] || continue
    if [ "$FORBIDDEN_NAME_ECHO" = 1 ]; then
      fail "$rel: real name from the faculty register: $tok"
    else
      lines="$(fold_lines < "$f" | grep -nF "$tok" | cut -d: -f1 | paste -sd, -)"
      fail "$rel: real name from the faculty register, ${#tok} characters, at line(s) ${lines:-?} (token withheld: it is not public and this log must not be where it becomes public)"
    fi
  done
}

# ---------------------------------------------------------------------------------------
# The name rule, for a caller that cannot source this file.
# ---------------------------------------------------------------------------------------
# scripts/sync_board.mjs writes the one public artefact in this repository whose content is
# authored outside it: a GitHub issue title, typed into a text box by a person. It has to apply
# the name rule to a title BEFORE the title is written, rather than passing it through and
# hoping a later gate reads the bytes. It is node, so it cannot source this file, and a second
# implementation of fold_tokens in JavaScript would be the third copy of a rule whose two
# existing copies this file's own header already warns about drifting.
#
# So the rule stays here and is exposed as a subprocess:
#
#   bash scripts/forbidden_lib.sh --name-lines <hashfile>
#
# stdin is one candidate string per line. stdout is the one based line number of every candidate
# that carries a token the register holds, one number per line, and nothing else.
#
# THE TOKEN IS NEVER PRINTED, AND NEITHER IS THE CANDIDATE. This runs inside CI, a CI log is a
# place a real name must not become public, and the caller needs only the position in order to
# redact it. Same reason check_repo.sh sets FORBIDDEN_NAME_ECHO to 0 for its own findings.
#
# A candidate spanning more than one line cannot be asked about: the position answer would be
# meaningless. The caller flattens whitespace before it asks, which is the only contract this
# interface has beyond one candidate per line.
name_lines() {  # hashfile
  local hashfile="$1" line n=0 h
  local -a toks=() hs=()
  hash_tokens_select
  load_hashset "$hashfile"
  # Poka-yoke, the same one both gates apply to their own inputs: a matcher holding no register
  # matches nothing and would answer "every candidate is clean", which is the loudest lie this
  # rule can tell. Refuse to answer instead.
  if [ "${#FORBIDDEN_HASHSET[@]}" -eq 0 ]; then
    echo "ASSERTION FAILED: name hash list $hashfile holds no hashes" >&2
    exit 2
  fi
  while IFS= read -r line || [ -n "$line" ]; do
    n=$((n + 1))
    toks=(); hs=()
    mapfile -t toks < <(printf '%s\n' "$line" | fold_tokens)
    [ "${#toks[@]}" -gt 0 ] || continue
    mapfile -t hs < <(printf '%s\n' "${toks[@]}" | hash_tokens)
    if [ "${#hs[@]}" -ne "${#toks[@]}" ]; then
      echo "ASSERTION FAILED: hashed ${#hs[@]} of ${#toks[@]} tokens on line $n" >&2
      exit 2
    fi
    for h in "${hs[@]}"; do
      if [ -n "${FORBIDDEN_HASHSET[$h]:-}" ]; then printf '%s\n' "$n"; break; fi
    done
  done
}

# ---------------------------------------------------------------------------------------
# The token rule, for a caller that cannot source this file either.
# ---------------------------------------------------------------------------------------
# --name-lines above answers about a register. This answers about the FOLDING ALONE, with no
# register in it, which is what makes it comparable: build/safety_grep.py exposes the identical
# interface, `python3 build/safety_grep.py --fold-tokens`, and scripts/check_repo.sh --self-test
# puts one corpus through both and diffs the two answers.
#
# It is exposed for the probe, and exposing it is the point. Issue 117: for five commits the
# claim that the two copies agreed was checked by three readers looking at two files, and the
# copies had never agreed. A rule that can be run twice over one input can be compared; a rule
# that can only be read cannot.
#
# NOTHING HERE IS SECRET AND NOTHING HERE IS A REGISTER. The output is the folding of whatever
# was on stdin, so a caller that pipes a real name in gets real name tokens back out. Every
# caller in this repository pipes it either a tracked file or a synthetic probe corpus.

# ---------------------------------------------------------------------------------------
# The salt-check, for a caller that has to agree with this file about the salt without either
# of them saying what it is.
# ---------------------------------------------------------------------------------------
# build/model.py hashes every string the model ships and refuses the build on a hit, so it needs
# the salt itself, and it is Python and cannot source this file. It resolves the salt the same
# two ways this file does, which is a second copy of a rule, and this repository has been bitten
# five times by a rule living in two places. The copies are compared rather than trusted: both
# sides compute the salt-check of whatever they resolved and the values have to be equal.
#
# Printing it is safe in a way that printing the salt is not. It is one way, it is over a random
# value, and it is already carried in the register's own header. So it can go in a CI log, in a
# probe's output and in a diagnostic, and the salt can go in none of those.

# Sourced, this file defines rules and runs nothing. Run directly, it exposes exactly four of
# them, and refuses anything else rather than doing nothing quietly. Note that reaching any of
# them at all means the salt resolved: the check at the top of this file has already run.
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  set -euo pipefail
  case "${1:-}" in
    --name-lines)
      [ -n "${2:-}" ] || { echo "usage: forbidden_lib.sh --name-lines <hashfile>" >&2; exit 2; }
      [ -s "${2}" ] || { echo "ASSERTION FAILED: no name hash list at ${2}" >&2; exit 2; }
      name_lines "$2"
      ;;
    --fold-tokens)
      fold_tokens
      ;;
    --salt-check)
      salt_check
      ;;
    --assert-bound)
      [ -n "${2:-}" ] || { echo "usage: forbidden_lib.sh --assert-bound <hashfile>" >&2; exit 2; }
      [ -s "${2}" ] || { echo "ASSERTION FAILED: no name hash list at ${2}" >&2; exit 2; }
      assert_register_bound "$2"
      ;;
    *)
      echo "scripts/forbidden_lib.sh is a library. Run directly it does four things:" >&2
      echo "  bash scripts/forbidden_lib.sh --name-lines <hashfile>" >&2
      echo "  bash scripts/forbidden_lib.sh --fold-tokens" >&2
      echo "  bash scripts/forbidden_lib.sh --salt-check" >&2
      echo "  bash scripts/forbidden_lib.sh --assert-bound <hashfile>" >&2
      exit 2
      ;;
  esac
fi
