#!/usr/bin/env bash
# Regenerate scripts/forbidden_names.sha256 from the vault faculty register.
#
# The register holds the real names of people who have taught for the company. Those names
# must never be committed to this repository and must never appear on the deployed page, so
# the gate that looks for them cannot hold them either. It holds their hashes instead: this
# script folds each name into tokens, hashes each token with a fixed salt, and writes only
# the hashes. scripts/check_forbidden.sh folds the deployed bytes the same way and compares.
#
# WHAT THE HASHING BUYS, AND WHAT IT DOES NOT. Issue 164 rewrote this paragraph, because the
# version it replaced was true and had stopped being enough. It said, correctly, that hashing is
# not secrecy against a determined attacker: the token set is small and Spanish given names and
# surnames are a short dictionary. It said that about a PRIVATE repository, where a determined
# attacker first had to be let in. The repository is public. The concession stayed on the page
# and the premise under it left.
#
# What was shipped alongside that paragraph was worse than the paragraph admitted. The output
# file's own header printed the salt, in clear, in the file the salt protects, and printed how
# many real people the register covers. Measured on an ordinary laptop, in single-threaded pure
# Python, with the construction below: a little over eight hundred thousand hashes a second. A
# hundred thousand candidate tokens against the whole register is about a tenth of a second.
#
# So three things changed and none of them is the hashing:
#
#   the salt        is random now, not a readable slug, and lives in a secret. It is not in this
#                   repository, not in this file and not in the output.
#   the output      is not a tracked file. It is generated here, on a machine that holds the
#                   vault, and it is ignored by git. CI has no vault, so CI gets it from a
#                   repository secret and writes it outside the working tree.
#   the header      carries no headcount and no salt. A count of real people is a disclosure on
#                   its own. What it carries instead is a salt-check, which binds the file to
#                   the salt it was built under so that a gate can refuse a register that cannot
#                   match rather than reporting every file clean.
#
# NONE OF THAT UNDOES ANYTHING. The register as it stood, and the salt it was built under, are
# in this repository's git history and will stay there until somebody rewrites it. Rotating
# stops the file being a live oracle from today. It does not reach backwards.
#
# Run locally only, on a machine that holds the vault. See README.md, "The name register", for
# what to do with the output.
#
# Usage:
#   scripts/gen_forbidden_hashes.sh [faculty-dir]     regenerate the register
#   scripts/gen_forbidden_hashes.sh --salt-check      print the salt-check of the salt in force

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${FORBIDDEN_HASHES:-$ROOT/scripts/forbidden_names.sha256}"

# shellcheck source=scripts/forbidden_lib.sh
# Sourcing this aborts, loudly and with instructions, if no salt can be resolved. That is the
# right order: a generator that cannot hash must say so before it walks the vault, not after.
. "$ROOT/scripts/forbidden_lib.sh"

# The one mode that reads no vault and writes no file. It exists so the owner can answer "is the
# register on this machine the one my salt builds" without printing either of them, and so a
# machine can be checked before a rotation rather than after.
if [ "${1:-}" = "--salt-check" ]; then
  echo "salt-check of the salt in force: $(salt_check)"
  if [ -s "$OUT" ]; then
    echo "register at $OUT"
    assert_register_bound "$OUT"
    echo "  bound: this register was built under this salt"
  else
    echo "no register at $OUT, so there is nothing to bind it to"
  fi
  exit 0
fi

FACULTY="${1:-$HOME/Obsidian/02_areas/zrive/02_areas/20_academic/faculty}"

[ -d "$FACULTY" ] || { echo "no faculty register at $FACULTY" >&2; exit 1; }

people=0
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

while IFS= read -r -d '' f; do
  people=$((people + 1))
  # "Ada Kestrelvane - Kestrel Analytics.md" -> "Ada Kestrelvane". The example name is invented,
  # deliberately: the part after " - " is an employer, not part of the person's name, and that
  # is the whole point the example has to make. It does not need a real person to make it.
  base="$(basename "$f" .md)"
  person="${base%% - *}"
  printf '%s\n' "$person"
done < <(find "$FACULTY" -maxdepth 1 -name '*.md' -print0 | sort -z) > "$tmp"

[ "$people" -gt 0 ] || { echo "faculty register is empty; refusing to write an empty gate" >&2; exit 1; }

tokens="$(fold_tokens < "$tmp")"
count="$(printf '%s\n' "$tokens" | grep -c . || true)"
[ "$count" -gt 0 ] || { echo "no tokens survived folding; refusing to write an empty gate" >&2; exit 1; }

# WHAT THE HEADER IS ALLOWED TO SAY, which is less than it used to. It carried the salt, which
# is the whole of issue 164, and a count of the real people covered, which is a disclosure with
# no gate to hide behind: a headcount is a fact about a group of real people whether or not
# anybody can name them. Neither is here. The token count is gone too, for no stronger reason
# than that it was free to remove and the file is handled as a secret now.
#
# The salt-check stays, and it is the one thing in this header that does work. It binds these
# hashes to the salt they were built under, so a gate holding a different salt refuses instead
# of matching nothing and calling the tree clean.
umask 077
{
  echo "# Salted, truncated hashes of the name tokens the deployed page must not contain."
  echo "# Generated by scripts/gen_forbidden_hashes.sh. Do not hand-edit. Do not commit."
  echo "${SALT_CHECK_TAG}$(salt_check)"
  printf '%s\n' "$tokens" | while IFS= read -r t; do hash_token "$t"; done | sort -u
} > "$OUT"

# Proof rather than assumption, and it costs one call: the file just written must satisfy the
# same assertion the gates apply to it.
assert_register_bound "$OUT"

# The counts go to the terminal of the person who ran this, on the machine that holds the vault,
# and into the file not at all. That person is allowed to know how big their own register is.
echo "wrote $OUT"
echo "  $people people, $count tokens, $(grep -vc '^#' "$OUT") distinct hashes"
echo "  salt-check $(salt_check), and the file carries it"
echo
echo "This file is ignored by git and must stay that way. CI holds no vault and cannot run this,"
echo "so CI reads the same bytes out of a repository secret. After a regeneration or a rotation,"
echo "update BOTH secrets together, or the gates refuse to run:"
echo "  gh secret set FORBIDDEN_NAMES_SHA256 -R <owner>/<repo> < $OUT"
echo "  gh secret set FORBIDDEN_SALT -R <owner>/<repo>          # the value, from wherever you keep it"
