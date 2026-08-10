#!/usr/bin/env bash
# set_status.sh : make one issue carry exactly one `status:` label, or none, and write only when
# the set it already carries differs from the set it should carry.
#
# Usage:  scripts/set_status.sh <issue-number> <desired>
#   desired is one of status:raw, status:backlog, status:in-progress, status:done, or the word
#   `none`, which means "carry no status label at all".
#
# Env: GH_TOKEN (the Action's GITHUB_TOKEN is enough), GH_REPO or REPO (default below)
#
# WHY THE WRITE IS CONDITIONAL, and why that is a safety rule rather than a tidiness one. A label
# write raises `labeled` and `unlabeled`, which .github/workflows/board.yml listens for, and the
# only caller of this script is a workflow that issue events start. An unconditional write is
# therefore one trigger-list edit away from a workflow that feeds itself. Computing the desired
# set first and calling the API only on a difference makes every call idempotent: run it twice
# and the second call writes nothing, whatever the first one did, so even a path nobody has
# thought of terminates after one pass.
#
# The LAST LINE of stdout is the verdict, `changed` or `unchanged`, for a caller deciding whether
# anything downstream has to be woken. Everything else this script says goes to stderr, so that
# `tail -n1` on its stdout is always the verdict and never a URL `gh` decided to print.

set -euo pipefail

# The four labels this repository uses, and the same four that scripts/sync_board.mjs maps onto
# columns. Anything outside this list is not a status label and is never touched: an issue keeps
# its `layout`, `model`, `feedback` and the rest through every transition.
STATUS_LABELS=("status:raw" "status:backlog" "status:in-progress" "status:done")

num="${1:-}"
desired="${2:-}"
[ -n "$num" ] && [ -n "$desired" ] || {
  echo "usage: scripts/set_status.sh <issue-number> <status:label|none>" >&2
  exit 2
}

# Reject an unknown label rather than passing it to the API and finding out. `gh issue edit` would
# fail on a label that does not exist in the repository, but it would fail after having already
# removed the others, which leaves the issue in the one state this script exists to prevent.
case "$desired" in
  none|status:raw|status:backlog|status:in-progress|status:done) ;;
  *) echo "not a status label, and not the word none: $desired" >&2; exit 2 ;;
esac

REPO="${GH_REPO:-${REPO:-jcherranz/zrive-model-toy}}"

current="$(gh issue view "$num" --repo "$REPO" --json labels --jq '.labels[].name')"

have=()
for l in "${STATUS_LABELS[@]}"; do
  if printf '%s\n' "$current" | grep -qxF -- "$l"; then have+=("$l"); fi
done

add=""
remove=()
for l in ${have[@]+"${have[@]}"}; do
  [ "$l" = "$desired" ] || remove+=("$l")
done
if [ "$desired" != none ]; then
  printf '%s\n' ${have[@]+"${have[@]}"} | grep -qxF -- "$desired" || add="$desired"
fi

if [ -z "$add" ] && [ "${#remove[@]}" -eq 0 ]; then
  echo "#$num already carries exactly [${have[*]:-nothing}]; no write." >&2
  echo "unchanged"
  exit 0
fi

args=()
[ -n "$add" ] && args+=(--add-label "$add")
for l in ${remove[@]+"${remove[@]}"}; do args+=(--remove-label "$l"); done

echo "#$num: [${have[*]:-nothing}] -> [${desired}]" >&2
gh issue edit "$num" --repo "$REPO" "${args[@]}" >&2
echo "changed"
