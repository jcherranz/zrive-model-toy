#!/usr/bin/env bash
# Shared folding and hashing rules for the forbidden-content gate.
#
# The generator (scripts/gen_forbidden_hashes.sh) and the checker (scripts/check_forbidden.sh)
# must fold text identically or the gate silently stops matching. One copy, sourced by both.

FORBIDDEN_SALT="zrive-model-toy/forbidden/v1"

# Tokens shorter than this are too common to be a name signal.
FORBIDDEN_MIN_TOKEN=4

# Tokens that are real name fragments AND ordinary words. Hashing them would fire the gate on
# every build for no gain. Each one is a deliberate hole in the net, so the list is short and
# stays visible rather than growing quietly.
FORBIDDEN_STOP="jose juan maria capital partners company group real para"

# stdin -> one folded token per line, deduplicated, stop-words removed.
# Folding: transliterate to ASCII (Muñoz -> Munoz), lowercase, split on anything not a letter.
fold_tokens() {
  iconv -c -f UTF-8 -t ASCII//TRANSLIT \
    | tr 'A-Z' 'a-z' \
    | tr -cs 'a-z' '\n' \
    | awk -v min="$FORBIDDEN_MIN_TOKEN" -v stop="$FORBIDDEN_STOP" '
        BEGIN { n = split(stop, s, " "); for (i = 1; i <= n; i++) drop[s[i]] = 1 }
        length($0) >= min && !($0 in drop) { print }
      ' \
    | sort -u
}

# token -> salted, truncated hash
hash_token() {
  printf '%s%s' "$FORBIDDEN_SALT" "$1" | sha256sum | cut -c1-16
}
