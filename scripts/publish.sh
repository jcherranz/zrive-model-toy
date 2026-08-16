#!/usr/bin/env bash
# The switch. One command turns the public site on, one turns it off, one says which it is.
#
# WHY IT EXISTS. Issue 101 ended with the deployment taken down and the Pages site deleted. The
# account is on GitHub Pro; private Pages needs Enterprise Cloud, so there was no authentication
# that could be put in front of the URL and the only two states available are world-readable and
# gone. Issue 107 then had to decide what happens to the machinery that reached for an origin, and
# the answer the owner asked for is that none of it is deleted: it is switched off, and putting the
# site back is one command and touches no workflow and no gate.
#
# HOW THE SWITCH WORKS. A repository variable named PUBLISH, read by the workflows as
# `vars.PUBLISH == 'on'`. Absent counts as off, so the safe state is the one that needs no
# configuration, and a fork that copies this repository publishes nothing until somebody says so.
# The jobs it gates are SKIPPED rather than passing: a skipped job is neither green nor red, which
# is the honest report for a publisher that was told not to publish.
#
# THE SWITCH AND THE FACT ARE TWO DIFFERENT THINGS, and `status` prints both. The variable says
# what this repository intends. The Pages API says what GitHub has configured. An HTTP fetch says
# what a reader can actually get, which during a takedown keeps answering out of the CDN for a
# while after the site is gone, and after a deploy answers before the API has caught up. Only the
# third one settles the question scripts/verify.sh turns its verdict on.
#
# Usage:
#   scripts/publish.sh status            what the switch says, what GitHub says, what the url serves
#   scripts/publish.sh on  [--yes]       create the Pages site, set the switch, deploy
#   scripts/publish.sh off [--yes]       clear the switch, delete the Pages site
#
#   --dry-run    print every call that would be made and make none
#
# Needs the gh CLI, authenticated with rights over this repository: Pages is administration, and
# the variable is actions. It prints no token and reads none of its own.

set -uo pipefail

# NO GIT CALL IN THIS FILE MAY SIT AT A CREDENTIAL PROMPT. Issue 211. The one git call here,
# `git config --get`, reads local state and reaches no network, so this is a guard against what
# gets added rather than against anything measured. It is the same line every script in this
# directory that calls git now carries, and scripts/check_repo.sh --self-test checks that it is
# still there and still ahead of the first call. The reasoning, and why one line is not enough,
# are in the same block in that file.
export GIT_TERMINAL_PROMPT=0
export GIT_ASKPASS=

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VAR_NAME="PUBLISH"
DRY_RUN=0
ASSUME_YES=0
ACTION=""

for a in "$@"; do
  case "$a" in
    on|off|status) ACTION="$a" ;;
    --dry-run)     DRY_RUN=1 ;;
    --yes|-y)      ASSUME_YES=1 ;;
    -h|--help)     sed -n '2,32p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown argument: $a" >&2; exit 1 ;;
  esac
done
[ -n "$ACTION" ] || { sed -n '2,32p' "$0" | sed 's/^# \{0,1\}//'; exit 1; }

# The repository this is, worked out from the remote rather than written down, so a fork does not
# inherit an address that points at somebody else's account.
slug() {
  local remote
  remote="$(git config --get remote.origin.url 2>/dev/null)" || return 1
  case "$remote" in *github.com[:/]*) ;; *) return 1 ;; esac
  remote="${remote%.git}"
  printf '%s/%s\n' "$(x="${remote%/*}"; echo "${x##*[:/]}")" "${remote##*/}"
}

REPO="$(slug)" || { echo "this is not a github remote, so there is nothing to publish" >&2; exit 2; }
OWNER="${REPO%%/*}"
NAME="${REPO##*/}"
DERIVED_URL="https://${OWNER}.github.io/${NAME}/"

have_gh() { command -v gh >/dev/null 2>&1; }

# Every mutating call goes through here, so --dry-run cannot miss one and so the log of a real run
# and the output of a dry run are the same list of calls.
run() {
  if [ "$DRY_RUN" = 1 ]; then
    printf '  would run: %s\n' "$*"
    return 0
  fi
  "$@"
}

# `|| echo ""` is not enough and this was seen: gh writes the error body to STDOUT on a 404, so the
# fallback appends to it instead of replacing it and the caller gets a JSON blob where it expected
# a value. The output is discarded on a non-zero exit rather than added to.
gh_field() {  # path jq-expression -> the field, or empty if the call failed
  local out rc
  out="$(gh api "$1" --jq "$2" 2>/dev/null)"; rc=$?
  [ "$rc" -eq 0 ] || { echo ""; return 0; }
  case "$out" in null) echo "" ;; *) echo "$out" ;; esac
}

switch_value() { gh_field "repos/$REPO/actions/variables/$VAR_NAME" '.value'; }
pages_url()    { gh_field "repos/$REPO/pages" '.html_url'; }

serves() {  # url -> http code, 000 if nothing answered
  command -v curl >/dev/null 2>&1 || { echo 000; return 0; }
  curl -sS -o /dev/null -w '%{http_code}' --max-time 8 "$1" 2>/dev/null || echo 000
}

set_switch() {  # on|off
  local want="$1" have
  have="$(switch_value)"
  if [ -z "$have" ]; then
    run gh api --method POST "repos/$REPO/actions/variables" \
        -f "name=$VAR_NAME" -f "value=$want" --silent
  else
    run gh api --method PATCH "repos/$REPO/actions/variables/$VAR_NAME" \
        -f "name=$VAR_NAME" -f "value=$want" --silent
  fi
}

confirm() {  # prompt
  [ "$ASSUME_YES" = 1 ] && return 0
  [ "$DRY_RUN" = 1 ] && return 0
  local reply
  printf '%s [y/N] ' "$1"
  read -r reply || return 1
  case "$reply" in y|Y|yes|YES) return 0 ;; *) return 1 ;; esac
}

# The sentence whoever turns this on has to have read. It is the reason the site is off, and it is
# printed by `on` and by `status` rather than kept in a document, because the person about to
# publish is at a terminal and not in a document.
the_terms() {
  echo "  ON MEANS WORLD-READABLE. This account is on GitHub Pro. Private Pages needs Enterprise"
  echo "  Cloud, so there is no authentication that can be put in front of the url: everything in"
  echo "  site/ becomes readable by anyone with the link, including site/board.json. There is no"
  echo "  third state. That is why it is off."
}

have_gh || { echo "the gh CLI is not on PATH, and every call below is a github api call" >&2; exit 2; }

case "$ACTION" in

  status)
    sw="$(switch_value)"
    api="$(pages_url)"
    code="$(serves "${api:-$DERIVED_URL}")"
    echo "repository: $REPO"
    echo "switch:     ${sw:-<unset>}   (the repository variable $VAR_NAME; anything but \"on\" is off)"
    echo "github:     ${api:-<no pages site configured>}"
    echo "serves:     ${api:-$DERIVED_URL} -> HTTP $code"
    echo
    if [ "$code" = "200" ]; then
      echo "There is a public origin and it is answering. scripts/verify.sh will read it and say"
      echo "\"the origin serves this\"."
    else
      echo "There is no public origin. scripts/verify.sh serves site/ locally instead and says"
      echo "\"these bytes serve\", which is the weaker of the two claims and is marked as such."
      echo
      echo "To publish: bash scripts/publish.sh on"
      the_terms
    fi
    if [ -n "$sw" ] && [ "$sw" = "on" ] && [ "$code" != "200" ]; then
      echo
      echo "NOTE: the switch says on and nothing is being served. Either a deploy has not finished,"
      echo "or one failed. Check the pages workflow before assuming the site is up."
    fi
    if [ "$sw" != "on" ] && [ "$code" = "200" ]; then
      echo
      echo "NOTE: the switch says off and something is still being served. A deleted Pages site"
      echo "drains out of the CDN over some minutes; if this persists, the site was not deleted."
    fi
    ;;

  on)
    echo "Turning the public site ON for $REPO."
    the_terms
    echo
    confirm "Publish site/ to $DERIVED_URL, world-readable?" || { echo "nothing was changed."; exit 1; }

    # Order matters. The switch is set FIRST, because the deploy dispatched at the end is gated on
    # it and a dispatch that arrives before the variable exists is a run that skips every job and
    # looks like a deploy that happened.
    echo "1/3 setting the switch"
    set_switch on || { echo "could not set the switch; nothing else was done" >&2; exit 1; }

    # 409 means it already exists, which is the state this step wants. build_type: workflow, because
    # .github/workflows/pages.yml is what publishes; the branch source would publish the repository
    # root instead, which is every file in it.
    echo "2/3 creating the Pages site (build_type: workflow)"
    if [ "$DRY_RUN" = 1 ]; then
      echo "  would run: gh api --method POST repos/$REPO/pages -f build_type=workflow"
    else
      out="$(gh api --method POST "repos/$REPO/pages" -f build_type=workflow 2>&1)" || {
        case "$out" in
          *409*|*"already exists"*) echo "  a Pages site already exists, which is what was wanted" ;;
          *) echo "$out" >&2; echo "could not create the Pages site" >&2; exit 1 ;;
        esac
      }
    fi

    echo "3/3 deploying"
    run gh workflow run pages.yml --repo "$REPO" || {
      echo "the deploy could not be dispatched. The switch is on, so the next push to main" >&2
      echo "publishes; or dispatch the pages workflow by hand." >&2
      exit 1
    }
    echo
    echo "It is on. The deploy takes a couple of minutes."
    echo "  bash scripts/publish.sh status     to see when it is serving"
    echo "  bash scripts/verify.sh             then reads the origin, and says so"
    echo "The deploy stamps the commit it published into site/version.js, so the page reports what"
    echo "it is running with no hand editing. origin freshness resumes on the same switch."
    ;;

  off)
    echo "Turning the public site OFF for $REPO."
    confirm "Delete the Pages site and stop deploying?" || { echo "nothing was changed."; exit 1; }

    # Switch first again, for the mirror of the reason above: with the site deleted and the switch
    # still on, the next push starts a deploy that recreates it.
    echo "1/2 clearing the switch"
    set_switch off || { echo "could not clear the switch; the site was NOT deleted" >&2; exit 1; }

    echo "2/2 deleting the Pages site"
    if [ "$DRY_RUN" = 1 ]; then
      echo "  would run: gh api --method DELETE repos/$REPO/pages"
    else
      out="$(gh api --method DELETE "repos/$REPO/pages" 2>&1)" || {
        case "$out" in
          *404*|*"Not Found"*) echo "  there was no Pages site, which is the state that was wanted" ;;
          *) echo "$out" >&2; echo "could not delete the Pages site" >&2; exit 1 ;;
        esac
      }
    fi
    echo
    echo "It is off. The CDN keeps serving the old copy for some minutes; scripts/publish.sh status"
    echo "reports what a reader can actually fetch, which is the thing that matters."
    ;;
esac
