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
# source this file and it therefore can drift. That is stated rather than implied.

FORBIDDEN_SALT="zrive-model-toy/forbidden/v1"

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
collect() {
  grep -aoP "$1" "$2" | sort -u | head -20 || true
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

  # 3. money. Anything money-shaped that is not one of the two declared invented figures.
  # An ISO 8601 instant with fractional seconds reads as a grouped figure to this pattern
  # (2026-08-09T16:42:46.932Z contains 46.932), and site/board.json carries a timestamp.
  # Timestamps are blanked out of the copy the money pattern sees, and only that copy: the
  # mask is fully anchored on digits and separators, so no euro figure can hide inside one.
  # build/safety_grep.py carries the same rule and the two must be changed together.
  hit="$(sed -E "$ISO_TS_MASK" "$f" | grep -aoP "$MONEY_RE" | sed 's/[[:space:]]*$//' | sort -u || true)"
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
