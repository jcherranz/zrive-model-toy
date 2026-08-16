#!/usr/bin/env bash
# Put the name register on a CI runner, out of a repository secret, and point the gates at it.
#
# WHY THIS FILE EXISTS. Issue 164. The register used to be a tracked file, so CI got it by
# checking the repository out, and anybody at all got it the same way. It is untracked now and
# generated only on a machine that holds the vault, which no runner does. The bytes therefore
# have to reach a runner some other way, and a repository secret is the way.
#
# Usage, from a workflow step, with both secrets in the step's env:
#
#   - name: Materialise the name register
#     env:
#       FORBIDDEN_SALT:         ${{ secrets.FORBIDDEN_SALT }}
#       FORBIDDEN_NAMES_SHA256: ${{ secrets.FORBIDDEN_NAMES_SHA256 }}
#     run: bash scripts/ci_register.sh
#
# It writes the file, then exports FORBIDDEN_SALT and FORBIDDEN_HASHES to the rest of the job
# through GITHUB_ENV, so every gate step after it is pointed at the register without any of them
# having to name a path or carry a secret of its own.
#
# ---------------------------------------------------------------------------------------------
# WHERE THE FILE GOES, AND WHY IT IS NOT THE WORKING TREE.
#
# RUNNER_TEMP, outside the checkout. The default path the gates fall back to is inside scripts/,
# and a secret sitting inside a git working tree is one `git add -A` away from being a tracked
# file again, which is the exact defect this card is repairing. Outside the tree it cannot be
# committed by accident, it cannot be swept into the Pages artifact, and `git ls-files` never
# names it, so the repository gate does not read it either. Nothing about that is a loss: the
# register is gate INPUT and was never repository content.
#
# ---------------------------------------------------------------------------------------------
# WHAT HAPPENS ON A PULL REQUEST FROM A FORK, stated here because it is a real behaviour change
# and not a footnote. GitHub gives a fork's pull request no secrets. Both values arrive empty,
# this script fails the job and says why. That is the intended direction and the alternative was
# rejected: pull_request_target would hand secrets to a workflow running against a stranger's
# code, which is the well-known way to lose them. A pull request from a branch in this repository
# is unaffected, because those runs do get secrets, and every pull request opened on this
# repository so far has been of that kind.
#
# A gate that cannot get its list must abort. It must never skip, and it must never pass.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

missing=""
[ -n "${FORBIDDEN_SALT:-}" ]         || missing="${missing} FORBIDDEN_SALT"
[ -n "${FORBIDDEN_NAMES_SHA256:-}" ] || missing="${missing} FORBIDDEN_NAMES_SHA256"

if [ -n "$missing" ]; then
  {
    echo "::error::the name register secret is not available to this job:${missing}"
    echo
    echo "ASSERTION FAILED: no name register, so the content gates cannot run."
    echo
    echo "  Missing:${missing}"
    echo
    echo "  The gates in this repository recognise a real name by hashing it and looking the"
    echo "  hash up. With no salt there is nothing to hash with; with no register there is"
    echo "  nothing to look up in. Either way the gate matches nothing, and a gate that matches"
    echo "  nothing calls every file clean. This job stops instead."
    echo
    echo "  If this is a pull request from a FORK, that is the explanation and it is expected:"
    echo "  GitHub gives a fork's pull request no secrets. The content gates cannot run on it"
    echo "  and a maintainer has to run them on a branch in this repository."
    echo
    echo "  Otherwise the two repository secrets are missing or renamed. Regenerate the register"
    echo "  on a machine holding the vault with scripts/gen_forbidden_hashes.sh, then set both"
    echo "  together. README.md, 'The name register', has the procedure."
  } >&2
  exit 2
fi

# Belt for the braces. Actions already masks a value it handed out as a secret; this covers a
# value that arrived some other way. The register's own lines are hashes and are not masked:
# masking a hundred and something short hex strings would redact ordinary output all over the log
# for no gain, and the file is written rather than printed.
#
# GUARDED, BECAUSE THE UNGUARDED VERSION IS A DISCLOSURE. `::add-mask::<value>` is a workflow
# command: inside Actions the runner consumes the line and it never reaches the log, which is the
# whole mechanism. Outside Actions nothing consumes it and it is an ordinary echo of the secret
# to a terminal. This script is runnable anywhere, and the first local run of it printed the salt
# in clear and cost a rotation. So the line is emitted only where something is listening for it.
if [ -n "${GITHUB_ACTIONS:-}" ]; then
  echo "::add-mask::${FORBIDDEN_SALT}"
fi

DEST_DIR="${RUNNER_TEMP:-$(mktemp -d)}"
DEST="${DEST_DIR}/forbidden_names.sha256"

# Written before it is readable by anyone else on the box, rather than chmod-ed afterwards.
( umask 077; printf '%s\n' "$FORBIDDEN_NAMES_SHA256" > "$DEST" )

# Poka-yoke, three claims, none of them assumed. A secret can be set to the wrong thing, and
# every one of these failures would otherwise show up as a gate that scans happily and finds
# nothing, which is indistinguishable from a clean tree.
n_hashes="$(grep -cv '^#' "$DEST" || true)"
if [ "$n_hashes" -eq 0 ]; then
  echo "::error::the FORBIDDEN_NAMES_SHA256 secret decoded to a register with no hashes in it" >&2
  echo "ASSERTION FAILED: a register holding no hashes matches nothing and would report clean." >&2
  exit 2
fi

if grep -qv '^\(#.*\|[0-9a-f]\{16\}\)$' "$DEST"; then
  echo "::error::the FORBIDDEN_NAMES_SHA256 secret holds a line that is neither a comment nor a hash" >&2
  echo "ASSERTION FAILED: the register is not in the form scripts/gen_forbidden_hashes.sh writes." >&2
  echo "  Nothing is printed here: whatever is in there is a secret and this log is public." >&2
  exit 2
fi

# And the one that catches the mistake this design actually makes possible. Two secrets rotate
# independently, so one of them can be rotated alone; a register built under the previous salt,
# read by a gate holding the current one, matches nothing and every gate reports clean. The
# register carries a salt-check for exactly this and the library refuses a mismatch.
bash "$ROOT/scripts/forbidden_lib.sh" --assert-bound "$DEST"

{
  echo "FORBIDDEN_HASHES=${DEST}"
  echo "FORBIDDEN_SALT=${FORBIDDEN_SALT}"
} >> "${GITHUB_ENV:-/dev/null}"

# What this says, and what it deliberately does not. The path and the salt-check are safe to
# print: one is a temporary directory and the other is one way over a random value. The number
# of hashes is not printed. It is a fact about how many name tokens a real register holds, this
# log is public on a public repository, and the count buys a reader nothing that the gate's
# verdict does not.
echo "name register materialised at ${DEST}"
echo "  salt-check $(bash "$ROOT/scripts/forbidden_lib.sh" --salt-check), and the register carries it"
echo "  FORBIDDEN_HASHES and FORBIDDEN_SALT are set for the remaining steps of this job"
