#!/usr/bin/env bash
# Everything a contributor has to run before pushing, in one place and in order.
#
# WHY THIS FILE EXISTS. Every check below already existed and every one of them was findable only
# by reading prose: the build command is in README.md's Regenerating section, the two gates and
# their self-tests are spread across README.md, TPS.md and four workflow files, the reproducibility
# argument is a sentence in README.md's Layout section, and the smoke suite is new. Reconstructing
# that list by hand is a step somebody skips, and the one they skip is the one that would have
# fired. One entrypoint, run everything, report everything.
#
# IT RUNS EVERY STEP. `set -e` is deliberately not used: a run that stops at the first failure
# hides the rest, and the rest is what tells you whether you broke one thing or five. Each step
# reports [OK], [FAIL] or [SKIP] and the exit code is non-zero if anything failed.
#
# [SKIP] IS NOT [OK], AND IS PRINTED DIFFERENTLY FOR THAT REASON. Three of these steps cannot run
# in full everywhere: build/safety_grep.py reads the faculty register out of the vault, the smoke
# suite against the origin has no second copy of the bytes to read when nothing is published, and
# the build gate runs sub-gates that re-read a corpus, three of which have none to read where the
# vault and the analysis repository are not on the machine. A skipped step is named in the summary
# with its reason, so a clean run that skipped two things cannot be read as a clean run that did
# nine.
#
# AND THE THIRD OF THOSE HAS STOPPED BEING A SKIP, which is issue 196 and is written here because
# this paragraph would otherwise describe a machine that no longer exists. Those three gates now
# check their declared tables against build/corpus_reading.txt, an attestation a machine holding
# the corpus wrote, and a table edited without the corpus refuses the build instead of passing.
# So the build gate exits 0 on a runner and this file renders it [OK]. What that [OK] does NOT
# say is that a corpus was read: check_build.sh prints, under its own verdict, which gates checked
# a recording rather than a corpus and the one thing a recording cannot see. Exit 3 stays wired
# below, because the state it names is still reachable: delete the attestation and the gates go
# back to looking at nothing, and that has to read differently from a run where they did not.
#
# AND THE DOCTRINE WAS NOT APPLIED TO THE GATES GUARDING THE ARITHMETIC, which is issue 168 R4(a)
# and the audit's verdict finding pointed at this file. The build gate is the one step whose
# incompleteness this file cannot see from outside, because the precondition belongs to a
# sub-check three layers in; it exited 0, printed VERDICT: clean, and rendered here as [OK] while
# the sole check on the totals every fraction on the page divides by had not been run. The repair
# is step_three_state below: the gate reports that state in a code of its own and this file
# renders it [SKIP]. The rule the whole file is written around, said once: A CHECK THAT COULD NOT
# RUN MUST NEVER PRINT THE WORD CLEAN.
#
# AND THAT RULE IS APPLIED TO THIS FILE'S OWN LAST LINE, which broke it. The verdict at the foot
# read "VERDICT: clean, with N step(s) that did not run" over a run in which a step declined. The
# summary prints [SKIP] in its own shape so it cannot be read as an OK, and then the one line
# anybody quotes glued them back together. It says INCOMPLETE now and the word is not in it.
#
# AND A SKIP THAT CAN MEAN AN ABORT IS A GREEN THAT CAN MEAN RED. Issue 103, and it is this
# file's own headline doctrine turned on itself. Every step here used to map exit 2 to [SKIP],
# on the reading that 2 means "I could not answer". It does, but it is ALSO how every gate in
# this repository reports a hard poka-yoke defect: no tracked files to scan, a name hash list
# holding no hashes, a palette table that does not match its own terminator, a malformed
# exemption table, a self-test that ran fewer probes than it intends, a smoke run whose browser
# never started. Proved with an empty register held outside the tree: the gate printed
# `ASSERTION FAILED: name hash list is empty`, this file printed
# `VERDICT: clean, with 2 step(s) that did not run`, and exited 0. A gate shouting that it
# scanned nothing was filed as a step that politely declined.
#
# So exit 2 is now a FAILURE by default, named as an abort rather than as an ordinary failure so
# the reader knows the difference. A step may decline only where THIS file has established the
# precondition cannot be met, and there are exactly two such places: the untracked check below,
# whose 2 is this file's own convention and not a gate's, and the token grep, where the register
# is looked for before the gate is run rather than after. The second one closes the composition
# nobody had joined: a vault that disappears once retired two model gates AND took this file's
# verdict with it, because both of them answered 2 and both of them read as a skip.
#
# "THE ORIGIN SERVES THIS" AND "THESE BYTES SERVE" ARE TWO DIFFERENT SENTENCES, AND THIS FILE SAYS
# WHICH ONE IT EARNED. Issue 107. The publication was taken down (issue 101: the account is on Pro,
# private Pages needs Enterprise Cloud, so there was no authentication to put in front of the URL
# and the site was deleted). Two steps here read bytes back over HTTP, and with nothing published
# they had nothing to read.
#
# The wrong repair, and it is the obvious one, is to point them at the working tree and let the
# summary keep printing what it printed before. That is the defect issue 103 spent a night
# removing: a gate that goes green when its subject is gone. So the target is not hidden, it is
# reported. This file looks for a public origin; if one answers it checks THAT and says so, and if
# none does it serves site/ on a local port, checks that, and says THAT instead. A run against a
# local server has established that these bytes serve and behave. It has not established that
# anybody else is serving them, or that anything is published at all, and the verdict says so in
# those words. Same discipline as check_build.sh naming the snapshot it read.
#
# The origin is looked for rather than configured, so putting the site back online (scripts/
# publish.sh on) needs no edit here: the next run finds it, checks it, and upgrades its own
# sentence.
#
# Usage:
#   scripts/verify.sh                 everything. Looks for a public origin: if one answers, the
#                                     two origin-shaped steps read it; if none does, site/ is
#                                     served locally and they read that. The verdict says which.
#   scripts/verify.sh <origin-url>    read that url, without looking for one
#   scripts/verify.sh --local         serve site/ locally, without looking for an origin
#
# Env: SMOKE_CHROME / CHROME_PATH / CHROME_BIN   which browser the smoke suite drives
#      ZMT_ORIGIN                                the url to look for, instead of the derived one
#      ZMT_PROBE_TIMEOUT                         seconds to wait for it, default 8

set -uo pipefail

# NO GIT CALL IN THIS FILE MAY SIT AT A CREDENTIAL PROMPT. Issue 211. The two git calls here,
# `git ls-files --others` and `git config --get`, read local state and reach no network today, so
# unlike the three gates this is a guard against what gets added rather than against anything
# measured. It is one line, it is the same line, and the alternative is the thing this card is
# about: the next git call written into a gate script inherits the guard instead of needing
# somebody to remember it. The reasoning and the limits of what these variables cover are in the
# same block in scripts/check_repo.sh; the second is there because GIT_TERMINAL_PROMPT does not
# reach an askpass program, which an editor's integrated terminal configures on its own.
export GIT_TERMINAL_PROMPT=0
export GIT_ASKPASS=

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ARG="${1:-}"
PROBE_TIMEOUT="${ZMT_PROBE_TIMEOUT:-8}"

# Filled in by choose_target below: the url the two origin-shaped steps read, and whether that url
# is somebody else's server or this machine's. Every sentence this file prints about what it
# proved is derived from TARGET_KIND and from nothing else.
TARGET_URL=""
TARGET_KIND=""      # remote | local
TARGET_HOW=""       # one line saying how the target was decided, printed in the header

STEP_NAMES=()
STEP_STATE=()
STEP_NOTE=()

# HOW MANY STEPS THIS FILE INTENDS TO RUN, AND WHY A CONSTANT RATHER THAN A COUNT. Issue 196,
# filed by the driver against this card and found independently by the #170 agent. Issue 168 took
# this file from thirteen steps to fifteen and the REFUSAL BANNER below went on saying thirteen,
# in six places. That is the R4(e) shape one level down: a number written in prose beside a number
# the code computes, joined by nothing, and it is in the worst possible text. The banner is what a
# reader meets at the moment a run has refused to start and they are deciding whether the tool or
# the tree is wrong, and a banner miscounting the script it belongs to says the run they are
# looking at is not the run the script expects.
#
# The summary at the foot prints ${#STEP_NAMES[@]} and cannot be wrong. The banner cannot use it:
# preflight_register runs before step one and the array is empty there, which is the whole reason
# the number was spelled out in the first place. So it is a TERMINATOR, in this repository's own
# sense and beside EXPECTED_DRAWINGS, EXPECTED_PROBES and EXPECTED_MODEL_GATES: written by hand,
# printed by the banner, and checked at the foot against what actually ran, so being wrong is loud
# on the first run after it happens rather than discovered by a reader two cards later.
EXPECTED_STEPS=15

# THE KEY, WHICH IS THE HALF THAT WAS NOT WRITTEN DOWN ANYWHERE. Issue 168 R4(e). This file and
# the seven workflow files were two hand-maintained lists of the same checks, joined by nothing.
# The workflows call this file nowhere; they re-enumerate the commands. The drift that structure
# produces has already happened once, was repaired by hand at issue 103, and had happened again
# by the time the audit read the tree: `check_syntax`, the only thing in the repository that runs
# `node --check` over site/*.js, was in no workflow at all.
#
# So every step now carries a stable key, a workflow step that covers it carries the same key in
# a `verify-step:` marker comment, and scripts/check_ci_drift.sh joins the two and refuses a step
# that no workflow claims and no exemption names. Two lists became one relation and the relation
# is checked. The key is FIRST in the argument list and not last, so a step registered without
# one is a syntax-level accident rather than a silently empty string.
STEP_KEYS=()

# THE STEP NUMBERS ARE CHECKED, NOT TRUSTED. Issue 106 E4. The number a step prints is part of a
# string written by hand, and twice now a step inserted in the middle has left the numbers behind
# it wrong: at one point a section header numbered 8 introduced the function invoked as step 9,
# and the untracked-files message told the contributor to `git add` before trusting "steps 4 and
# 5" when the repository gate had moved to 5 and 6. Both were repaired only when somebody read
# them. This file's whole value is being the authoritative ordered list, so the ordering is now
# an assertion: the nth step registered here must begin with "n. ", and a renumbering that misses
# one aborts the run instead of printing a list whose numbers do not count.
#
# EVERY OTHER CROSS-REFERENCE IN THIS FILE NAMES A STEP BY WHAT IT DOES, and none of them by
# number, for the same reason. A description survives an insertion; a number does not, and there
# is nothing that can check prose.
# THE LIST WITHOUT THE RUN. Issue 168 R4(e). scripts/check_ci_drift.sh needs the authoritative
# ordered list of steps and their keys, and the one place that list exists is the registrations
# below. Deriving it by parsing this file with a regular expression would be a third copy of it,
# so this file hands it over itself: with ZMT_LIST_ONLY set every registration prints its key and
# its name and runs nothing, the preflight and the origin probe are not reached, and the run ends
# with the list. It is a listing and never a verdict, so it prints no summary and no VERDICT line.
LIST_ONLY="${ZMT_LIST_ONLY:-}"

# A step registered under list-only still has to pass the numbering assertion, because the number
# is part of what is being listed and a list whose numbers do not count is the thing
# assert_step_number exists to prevent.
list_step() {  # key name
  STEP_NAMES+=("$2")
  printf 'STEP\t%s\t%s\n' "$1" "$2"
}

assert_step_number() {  # name
  local n=$(( ${#STEP_NAMES[@]} + 1 ))
  case "$1" in
    "$n. "*) return 0 ;;
  esac
  echo
  echo "ASSERTION FAILED: this is step $n and it is registered as \"$1\"."
  echo "  The printed list is numbered by hand and this file will not print a list whose numbers"
  echo "  do not count. Renumber the step names, and sweep the prose that refers to them."
  exit 2
}

# Run a step, print its output under a banner, record its verdict.
#
# Exit 2 is a FAILURE and is named as one. A gate answering 2 has told you it did not scan what
# it was asked to scan, and the only reading of that which is safe to push on is "this run
# proved nothing here". It is recorded with its own note rather than as a plain failure, because
# "the gate refused the tree" and "the gate never read the tree" send a reader to different
# places.
step() {
  local key="$1" name="$2"; shift 2
  assert_step_number "$name"
  if [ -n "$LIST_ONLY" ]; then list_step "$key" "$name"; return 0; fi
  STEP_KEYS+=("$key")
  echo
  echo "=============================================================================="
  echo "== $name"
  echo "=============================================================================="
  "$@"
  local rc=$?
  STEP_NAMES+=("$name")
  if [ "$rc" -eq 0 ]; then
    STEP_STATE+=("OK"); STEP_NOTE+=("")
    echo "-- [OK] $name"
  elif [ "$rc" -eq 2 ]; then
    STEP_STATE+=("FAIL")
    STEP_NOTE+=("exit 2: it ABORTED. It did not scan what it was asked to, so nothing here is evidence")
    echo "-- [FAIL] $name (exit 2: the gate aborted rather than answering. It scanned nothing.)"
  else
    STEP_STATE+=("FAIL"); STEP_NOTE+=("exit $rc")
    echo "-- [FAIL] $name (exit $rc)"
  fi
  return 0
}

# The one shape of step whose exit 2 is not a gate abort: this file's own convention, used where
# 2 means "the answer is incomplete and here is what it excludes". It takes the reason as an
# argument, so a reader of the summary is never left to guess which of the two meanings applied.
# Nothing outside this file may be run through it.
step_may_decline() {
  local key="$1" name="$2" reason="$3"; shift 3
  assert_step_number "$name"
  if [ -n "$LIST_ONLY" ]; then list_step "$key" "$name"; return 0; fi
  STEP_KEYS+=("$key")
  echo
  echo "=============================================================================="
  echo "== $name"
  echo "=============================================================================="
  "$@"
  local rc=$?
  STEP_NAMES+=("$name")
  if [ "$rc" -eq 0 ]; then
    STEP_STATE+=("OK"); STEP_NOTE+=("")
    echo "-- [OK] $name"
  elif [ "$rc" -eq 2 ]; then
    STEP_STATE+=("SKIP"); STEP_NOTE+=("$reason")
    echo "-- [SKIP] $name ($reason)"
  else
    STEP_STATE+=("FAIL"); STEP_NOTE+=("exit $rc")
    echo "-- [FAIL] $name (exit $rc)"
  fi
  return 0
}

# AND THE THIRD SHAPE, WHICH IS THE ONE THE DOCTRINE ABOVE WAS NOT APPLIED TO. Issue 168 R4(a).
# The two forms above are this file deciding, from outside, whether a gate could have answered.
# That works where the precondition is a file this file can look for, and it does not work where
# the gate is a sub-check buried inside a larger one: scripts/check_build.sh runs five gates that
# re-read a corpus, three of them go quiet on a runner that holds none, and from out here the
# gate exits 0 and the step reads [OK]. Measured before the repair: with the corpora out of
# reach the build gate exited 0 and printed VERDICT: clean while the sole check on the declared
# totals had counted nothing, and this file rendered it as an OK step among the thirteen it ran then.
#
# So a gate may now report the third state itself, in a code of its own, and this wrapper is the
# only thing that reads that code. Exit 3 means: it ran, everything it could check was checked,
# and it has NAMED the sub-checks that could not look. It is a [SKIP] here and never an [OK],
# which is this file's headline doctrine finally pointed at the gates guarding the arithmetic.
#
# ONLY A GATE TAUGHT TO SPEAK IT GETS IT. A step wired through the plain `step` above and
# answering 3 is still a failure, because 3 from a command that never agreed to the contract is
# an exit code nobody designed and reading it as a polite decline is how this class of defect
# gets made. Nothing is inferred; the wrapper is chosen per step, by hand, and there is exactly
# one step in the list below that uses it.
step_three_state() {
  local key="$1" name="$2"; shift 2
  assert_step_number "$name"
  if [ -n "$LIST_ONLY" ]; then list_step "$key" "$name"; return 0; fi
  STEP_KEYS+=("$key")
  echo
  echo "=============================================================================="
  echo "== $name"
  echo "=============================================================================="
  "$@"
  local rc=$?
  STEP_NAMES+=("$name")
  if [ "$rc" -eq 0 ]; then
    STEP_STATE+=("OK"); STEP_NOTE+=("")
    echo "-- [OK] $name"
  elif [ "$rc" -eq 3 ]; then
    STEP_STATE+=("SKIP")
    STEP_NOTE+=("exit 3: the gate ran and named sub-check(s) that could not look at their corpus. Read its INCOMPLETE verdict above; what those gates cover was not established by this run")
    echo "-- [SKIP] $name (exit 3: sub-check(s) could not look. It is not an OK and this line says so.)"
  elif [ "$rc" -eq 2 ]; then
    STEP_STATE+=("FAIL")
    STEP_NOTE+=("exit 2: it ABORTED. It did not scan what it was asked to, so nothing here is evidence")
    echo "-- [FAIL] $name (exit 2: the gate aborted rather than answering. It scanned nothing.)"
  else
    STEP_STATE+=("FAIL"); STEP_NOTE+=("exit $rc")
    echo "-- [FAIL] $name (exit $rc)"
  fi
  return 0
}

skip() {  # key name reason
  assert_step_number "$2"
  if [ -n "$LIST_ONLY" ]; then list_step "$1" "$2"; return 0; fi
  STEP_KEYS+=("$1")
  STEP_NAMES+=("$2"); STEP_STATE+=("SKIP"); STEP_NOTE+=("$3")
  echo
  echo "=============================================================================="
  echo "== $2"
  echo "=============================================================================="
  echo "-- [SKIP] $3"
}

# ---------------------------------------------------------------------------------------------
# Syntax. Every shipped script parses.
# ---------------------------------------------------------------------------------------------
# The cheapest check there is, and the one that catches the class of defect that costs the most:
# site/ has no build step, so a syntax error in a shipped file is not caught by anything until the
# page is opened, where it shows up as a page that draws nothing. This repository has shipped a
# blank page once already, for a different reason
# (HANSEI.md `2026-08-09-screenshot-before-javascript`).
check_syntax() {
  local bad=0 f
  for f in site/*.js scripts/*.mjs; do
    if node --check "$f" 2>/tmp/zmt-syntax.$$; then
      printf '  [OK]   %s\n' "$f"
    else
      printf '  [FAIL] %s\n' "$f"; sed 's/^/         /' /tmp/zmt-syntax.$$; bad=1
    fi
  done
  rm -f /tmp/zmt-syntax.$$
  return $bad
}

# ---------------------------------------------------------------------------------------------
# What the repository gate cannot see.
# ---------------------------------------------------------------------------------------------
# scripts/check_repo.sh takes its file list from `git ls-files`, so a file that has never been
# added is not scanned, and the gate reports clean on a tree that contains it. That is correct and
# it is also the shape of a trap: a new file is exactly the file most likely to carry something,
# and the run a person makes just before committing it is the run that cannot see it.
#
# Bought here. This card's own scripts/smoke.mjs was written, verified against a clean gate run,
# committed and pushed, and the gate went red on the first run that could see it, on six decimal
# measurements in a comment that the money rule reads as grouped figures. Not an exposure, since
# scripts/ is not deployed and the figures were pixel counts, and entirely avoidable: the gate had
# said clean about a set of files that did not include the one being written.
#
# So this reports [SKIP] rather than [OK] when anything is untracked, and names the files. A
# skipped step is loud in the summary and an OK is not, which is the difference that matters:
# the gate's answer is incomplete and the reader has to know which files it excludes.
check_untracked() {
  local untracked
  untracked="$(git ls-files --others --exclude-standard)"
  if [ -z "$untracked" ]; then
    echo "  nothing untracked: the repository gate's file list is the whole working tree"
    return 0
  fi
  echo "  the repository gate reads \`git ls-files\`, so it will not scan these:"
  printf '%s\n' "$untracked" | sed 's/^/    /'
  echo
  echo "  \`git add\` them before trusting a clean verdict from the two repository gate steps"
  echo "  below, or accept that the verdict is about the rest of the tree."
  echo "  verdict is about the rest of the tree."
  return 2
}

# ---------------------------------------------------------------------------------------------
# The build gate, which is scripts/check_build.sh and is no longer a copy of it.
# ---------------------------------------------------------------------------------------------
# ONE RULE, ONE IMPLEMENTATION. Issue 103. This file used to carry its own copy-and-compare of
# the build, a `check_layout_reproducible` that saved both generated documents, ran the builder
# and diffed. It has been deleted, and the steps below run scripts/check_build.sh itself.
#
# The copy was not equivalent and the difference was in the direction that matters. It never
# deleted the generated files first, which is exactly the poka-yoke check_build.sh's header
# argues for: a builder that silently wrote nothing was indistinguishable from one that wrote
# the same bytes. Proved with the builder replaced by a script that printed one line and exited
# 0, on which this file printed "the drawing is a pure function of the model" and [OK] while
# check_build.sh on the same tree printed
# "::error::build/build_layout.py exited 0 and wrote no site/instance.js". It also ran neither
# the width table coverage check nor the structure gate, so nothing a contributor ran locally
# said the model was one a drawing can be made of.
#
# check_build.sh was called by .github/workflows/build.yml and by nothing else in the tree, which
# means the gate this file recommends running before pushing was the one gate this file did not
# run. Two copies of one rule is the drift class issue 106 is about, and the second copy here was
# the weaker one.
#
# The second of the two steps is the half check_build.sh's own header asks for by name. Running
# the gate exercises the LIVE structure gate, because running the gate runs the builder and the
# builder calls it; what this file did not do was prove the gate fires. One line, and it is
# below.

# ---------------------------------------------------------------------------------------------
# The local token grep.
# ---------------------------------------------------------------------------------------------
# build/safety_grep.py reads the faculty register straight out of the vault, which is what lets it
# look for real names in plaintext where the two CI gates hold salted hashes. The path is asked of
# the module rather than written here: a value that lives in one file must not be typed into a
# second (KAIZEN.md `kaizen-a-computed-value-is-never-typed-twice`).
#
# IT NEEDS THE VAULT, AND THAT IS ESTABLISHED BEFORE THE GATE IS RUN AND NOT AFTER. Issue 103.
# safety_grep.py answers 2 in two situations that are not the same situation: the register is not
# on this machine, which is a legitimate decline, and it was handed nothing to scan, which is the
# gate calling its own input a lie. One exit code cannot separate them, so this file separates
# them from outside: register_present() below asks whether the register exists at all, and only
# if it does is the gate run, under the strict step where an exit 2 is a failure. If it does not,
# the gate is not run and the step is recorded as skipped by THIS file, with the reason.
register_present() {
  python3 - <<'PY' 2>/dev/null
import pathlib, sys
sys.path.insert(0, "build")
import safety_grep
p = pathlib.Path(safety_grep.FACULTY)
sys.exit(0 if p.is_dir() and any(p.glob("*.md")) else 1)
PY
}

check_token_grep() {
  local faculty
  faculty="$(python3 -c 'import sys; sys.path.insert(0, "build"); import safety_grep; print(safety_grep.FACULTY)' 2>/dev/null)"
  echo "  register: ${faculty:-unknown}"
  python3 build/safety_grep.py site 2>&1 | tail -12 | sed 's/^/  /'
  return "${PIPESTATUS[0]}"
}

# ---------------------------------------------------------------------------------------------
# What the two origin-shaped steps read.
# ---------------------------------------------------------------------------------------------
# A url whose host is this machine is not an origin however it was arrived at, and a target handed
# in by hand gets classified by the same rule as one that was found. Without this, `verify.sh
# http://127.0.0.1:8000/` would print "the origin serves this" about a server the reader started
# thirty seconds earlier, which is the exact false sentence this whole section exists to prevent.
classify_target() {  # url -> echoes remote|local
  case "$1" in
    http://127.0.0.1[:/]*|http://127.0.0.1|http://localhost[:/]*|http://localhost|http://\[::1\]*)
      echo local ;;
    *) echo remote ;;
  esac
}

# The url this repository would be published at, worked out from the git remote rather than
# written down, so a fork or a rename does not leave a hardcoded address behind
# (KAIZEN.md `kaizen-a-computed-value-is-never-typed-twice`). Nothing is asserted about whether it
# answers; that is the probe's job.
derive_origin_url() {
  local remote owner repo
  remote="$(git config --get remote.origin.url 2>/dev/null)" || return 1
  case "$remote" in *github.com[:/]*) ;; *) return 1 ;; esac
  remote="${remote%.git}"
  repo="${remote##*/}"
  owner="${remote%/*}"; owner="${owner##*[:/]}"
  [ -n "$owner" ] && [ -n "$repo" ] || return 1
  printf 'https://%s.github.io/%s/\n' "$owner" "$repo"
}

# Does anybody serve it. This asks the only question the verdict is allowed to turn on, which is
# whether a third party hands these files back over the public internet, and NOT whether the Pages
# API has a record: a site can be configured and not yet serving, or deleted and still draining out
# of the CDN, and in both cases what a reader can actually fetch is the fact. A non-200, a
# timeout, no network and no curl all mean the same thing here, which is that there is no origin to
# check right now.
probe_origin() {  # url -> echoes the http code, 000 for anything that did not answer
  command -v curl >/dev/null 2>&1 || { echo 000; return 0; }
  curl -sS -o /dev/null -w '%{http_code}' --max-time "$PROBE_TIMEOUT" "$1" 2>/dev/null || echo 000
}

# ---------------------------------------------------------------------------------------------
# The local server, for when there is no origin.
# ---------------------------------------------------------------------------------------------
# python3 -m http.server over site/, on a port nobody else holds, and no new dependency: python3 is
# already required by four of the steps above.
#
# THE PORT IS TAKEN FROM THE KERNEL AND NOT GUESSED, and readiness is a fetch and not a sleep. A
# hardcoded port collides with whatever the contributor already has running and a fixed sleep is a
# race that fails on a loaded machine, and both of those fail in the direction where the gate below
# reports on an empty fetch.
#
# AND IT IS PROVED TO BE SERVING THESE BYTES. The claim this whole path exists to support is "these
# bytes serve", so the one thing that must not be assumed is that the server is serving this tree.
# A server left over on a recycled port, or a --directory that silently resolved somewhere else,
# would let every step below report about the wrong files. index.html is fetched and its length
# compared with the file on disk before anything is scanned.
LOCAL_SERVER_PID=""
stop_local_server() {
  if [ -n "$LOCAL_SERVER_PID" ]; then
    kill "$LOCAL_SERVER_PID" 2>/dev/null
    wait "$LOCAL_SERVER_PID" 2>/dev/null
    LOCAL_SERVER_PID=""
  fi
  return 0
}
trap stop_local_server EXIT

start_local_server() {  # echoes the base url on stdout; diagnostics to stderr; non-zero on failure
  local port log i code want got
  [ -d site ] || { echo "  there is no site/ directory to serve" >&2; return 1; }
  port="$(python3 -c 'import socket
s = socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()' 2>/dev/null)"
  [ -n "$port" ] || { echo "  could not get a free port from python3" >&2; return 1; }

  log="$(mktemp)"
  python3 -m http.server "$port" --bind 127.0.0.1 --directory site >"$log" 2>&1 &
  LOCAL_SERVER_PID=$!

  code=000
  for i in $(seq 1 40); do
    code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 3 \
            "http://127.0.0.1:$port/index.html" 2>/dev/null || echo 000)"
    [ "$code" = "200" ] && break
    kill -0 "$LOCAL_SERVER_PID" 2>/dev/null || break
    sleep 0.25
  done
  if [ "$code" != "200" ]; then
    echo "  the local server never answered 200 on port $port (last code $code). It said:" >&2
    sed 's/^/    /' "$log" >&2
    rm -f "$log"
    return 1
  fi

  want="$(wc -c < site/index.html)"
  got="$(curl -sS --max-time 10 "http://127.0.0.1:$port/index.html" 2>/dev/null | wc -c)"
  rm -f "$log"
  if [ "$want" != "$got" ]; then
    echo "  the server on port $port returned $got bytes for index.html and site/index.html is" >&2
    echo "  $want bytes. It is not serving this tree, so nothing read from it is evidence." >&2
    return 1
  fi
  printf 'http://127.0.0.1:%s/\n' "$port"
}

# Decide the target once, before any step runs, so the header, the step names and the verdict are
# three readings of one decision rather than three decisions.
choose_target() {
  local wanted code
  if [ "$ARG" = "--local" ]; then
    TARGET_KIND=local
    TARGET_HOW="--local was given, so no origin was looked for"
    return 0
  fi
  if [ -n "$ARG" ]; then
    TARGET_URL="$ARG"
    TARGET_KIND="$(classify_target "$ARG")"
    if [ "$TARGET_KIND" = local ]; then
      TARGET_HOW="a url was given and its host is this machine, so it is not an origin"
      TARGET_URL=""   # start our own, rather than trust a server we did not check
      return 0
    fi
    TARGET_HOW="a url was given on the command line; it was not probed first"
    return 0
  fi
  wanted="${ZMT_ORIGIN:-$(derive_origin_url || true)}"
  if [ -z "$wanted" ]; then
    TARGET_KIND=local
    TARGET_HOW="no url given and none could be derived from the git remote"
    return 0
  fi
  code="$(probe_origin "$wanted")"
  if [ "$code" = "200" ]; then
    TARGET_URL="$wanted"
    TARGET_KIND="$(classify_target "$wanted")"
    TARGET_HOW="probed $wanted and it answered HTTP 200"
    return 0
  fi
  TARGET_KIND=local
  TARGET_HOW="probed $wanted and it answered HTTP $code, so there is no origin to read"
  return 0
}

# The two origin-shaped steps, wrapped so the local case starts its server inside the step. A
# server that will not start is a step that could not answer, which is exit 2, which this file
# treats as a failure. It is not a skip: the precondition it needs is python3 and a free port on
# the machine already running the script, and neither of those is a thing this file has
# established cannot be met.
served_bytes_gate() {
  local base
  if [ "$TARGET_KIND" = remote ]; then
    base="$TARGET_URL"
    echo "  reading a remote origin: $base"
  else
    base="$(start_local_server)" || return 2
    TARGET_URL="$base"
    echo "  reading a local server on this machine: $base  (python3 -m http.server over site/)"
    echo "  this proves the bytes serve clean. It says nothing about what anybody publishes."
  fi
  bash scripts/check_forbidden.sh "$base"
}

# ---------------------------------------------------------------------------------------------
# Preflight: the name register, before step 1 and outside the step machinery.
# ---------------------------------------------------------------------------------------------
# Issue 164 took the register out of the repository. It is generated by
# scripts/gen_forbidden_hashes.sh on a machine that holds the vault, delivered to CI by
# scripts/ci_register.sh out of a repository secret, and tracked nowhere. So a contributor can
# now have a complete checkout and be unable to run most of the steps below, which is a state
# this file did not previously have to describe.
#
# WHY THIS IS NOT A STEP, AND WHY IT IS NOT A [SKIP]. A step is a thing that ran and reached a
# verdict, and this file's own doctrine is that a skip is loud precisely because the run still
# happened around it. Neither fits. With no register there is no verdict to reach: the build
# gate, both provenance gates, both repository gate steps and the forbidden-content gate all
# read it, directly or by importing build/model.py, and a run that lost most of its steps and
# printed a summary would be inviting a reader to weigh a number that means nothing. The whole run
# is refused instead, before the banner, with the reason and the remedy. That keeps this file at
# EXPECTED_STEPS steps and keeps every one of them a step that ran.
#
# THE BANNERS BELOW SAY THE COUNT AND DO NOT SPELL IT. See EXPECTED_STEPS above: they said
# thirteen for as long as this file ran fifteen.
#
# LOUD, AND NOT SILENT, IS THE WHOLE POINT. The failure this repository fears is a gate that
# cannot match anything and says clean. A missing register produces exactly that, so nothing here
# degrades, falls back or defaults.
#
# The salt is not resolved by this file and is not exported by it. Each gate below sources
# scripts/forbidden_lib.sh and resolves it there, one copy of the rule; the call below asks that
# library the one question it can answer out loud, which doubles as "can you load at all".
preflight_register() {
  local out rc=0
  out="$(bash "$ROOT/scripts/forbidden_lib.sh" --salt-check 2>&1)" || rc=$?
  if [ "$rc" -ne 0 ]; then
    echo "=============================================================================="
    echo "== verify: REFUSING TO RUN. There is no salt on this machine."
    echo "=============================================================================="
    printf '%s\n' "$out"
    echo
    echo "Most of the ${EXPECTED_STEPS} steps below read the name register, directly or by importing"
    echo "build/model.py, and none of those can run without it. A run that skipped them would"
    echo "print a ratio that means nothing, so there is no run."
    exit 2
  fi

  local hashes="${FORBIDDEN_HASHES:-$ROOT/scripts/forbidden_names.sha256}"
  if [ ! -s "$hashes" ]; then
    echo "=============================================================================="
    echo "== verify: REFUSING TO RUN. There is no name register on this machine."
    echo "=============================================================================="
    echo
    echo "  looked for: $hashes"
    echo
    echo "  The register holds the salted hashes of the names that must never be committed"
    echo "  and must never be published. Most of the ${EXPECTED_STEPS} steps below read it: the build"
    echo "  gate and its self-test, the two provenance gates, the populate registry, both"
    echo "  repository gate steps, the forbidden-content gate and its self-test, and the local"
    echo "  token grep. Every one of them recognises a name by hashing it and"
    echo "  looking the hash up, so without the register they match nothing, and a gate that"
    echo "  matches nothing reports every file clean. That is the loudest lie this machinery"
    echo "  can tell, and it is why this is a refusal rather than a skipped step."
    echo
    echo "  It is untracked on purpose. Issue 164: it was a tracked file on a public"
    echo "  repository and its own header printed the salt that protects it."
    echo
    echo "  ON A MACHINE THAT HOLDS THE VAULT: scripts/gen_forbidden_hashes.sh"
    echo "  ON ANY OTHER MACHINE: you cannot generate it and you should not be handed the"
    echo "  names. Ask the owner for the register bytes, put them at the path above, and keep"
    echo "  the file mode 600. It is ignored by git and must stay that way."
    echo "  IN CI: scripts/ci_register.sh, from the two repository secrets."
    exit 2
  fi

  # Present is not the same as usable. A register built under some other salt is a full file of
  # hashes this run cannot produce, so it matches nothing and every gate goes green.
  if ! bash "$ROOT/scripts/forbidden_lib.sh" --assert-bound "$hashes"; then
    echo
    echo "verify: REFUSING TO RUN. The register on this machine was not built under the salt"
    echo "        in force, so it could not match anything and every gate below would be green"
    echo "        for the wrong reason."
    exit 2
  fi

  echo "register: $hashes, salt-check $out"
}

# ---------------------------------------------------------------------------------------------
# The run
# ---------------------------------------------------------------------------------------------
# UNDER LIST-ONLY NOTHING IS RUN AND NOTHING IS PROBED, which is why the preflight and the origin
# probe are here rather than at the top of the file. A listing that refused to be produced on a
# machine with no register would be a listing scripts/check_ci_drift.sh could not take in CI,
# which is the one place the drift it looks for actually costs something.
if [ -z "$LIST_ONLY" ]; then
  preflight_register
  choose_target
else
  # The maximal list: with a remote target both origin-shaped steps register under their own key
  # rather than one of them being replaced by a skip carrying the same key.
  TARGET_KIND=remote
  TARGET_URL="an origin"
fi
[ -n "$LIST_ONLY" ] || echo "verify: $ROOT"
if [ -z "$LIST_ONLY" ]; then
  echo "node:   $(node --version 2>/dev/null || echo 'not found')"
  echo "python: $(python3 --version 2>/dev/null || echo 'not found')"
  if [ "$TARGET_KIND" = remote ]; then
    echo "target: $TARGET_URL  (an origin, served by somebody else)"
  else
    echo "target: a local server over site/, started below  (there is no origin)"
  fi
  echo "        $TARGET_HOW"
fi

step syntax "1. every shipped script parses"              check_syntax

step_may_decline untracked "2. nothing is untracked, so the gates see everything" \
     "some files are untracked and the repository gate cannot see them; its two steps are about the rest of the tree" \
     check_untracked

step_three_state build-gate "3. the build gate: both documents rebuild, the widths cover, the model is well formed, the fourteen digests are the ones these bytes produce" \
     bash scripts/check_build.sh
step build-gate-armed "4. prove the build gate fires"     bash scripts/check_build.sh --self-test
# The provenance gate runs inside build/build_layout.py on every build, so the build gate step
# above already exercises it against the real document. This is the other half of the TPS rule: a gate that
# has never been seen to refuse is not a gate, so one synthetic document per rule, each one a
# document that PASSES with a single field changed. Issue 73.
#
# AND THE ONTOLOGY GATE IS THE SAME CLAIM ABOUT THE OTHER POPULATION, issue 123. It runs at
# import time on every build, so step 3 above has already run it against the real corpus on a
# machine that holds one; this proves it REFUSES, and it proves it on machines that hold none,
# because every probe writes its own synthetic corpus to a temporary directory. One step and
# not two: both are "prove the gate that says where a value came from fires", and this file's
# step numbers are read by other files, which is issue 106 E4.
provenance_gates() {
  python3 build/model.py --provenance-self-test || return 1
  python3 build/model.py --ontology-self-test  || return 1
}
step provenance-armed "5. prove the two provenance gates fire" provenance_gates
step repo-gate-armed "6. prove the repository gate fires" bash scripts/check_repo.sh --self-test
step repo-gate "7. repository gate, over every tracked file" bash scripts/check_repo.sh
# The gate is named by what it reads and not by where the bytes came from, because where they came
# from is now a variable and the next line says which. It was called the deployed-bytes gate while
# the only thing it could read was a deployment; "forbidden-content gate" is the name pages.yml has
# always used for it and it is true in both modes.
step forbidden-armed "8. prove the forbidden-content gate fires" bash scripts/check_forbidden.sh --self-test

# THIS STEP ALWAYS RUNS, and what changes is what it read. Against an origin it answers "is what
# the public is served clean". Against a local server it answers the weaker question "are the bytes
# this tree would publish clean when served over HTTP", and it is still worth running for a reason
# that is not sentiment: its file list is `find site/`, not `git ls-files`, so it is the only gate
# in this file that can see a file sitting in site/ that has never been added, and the repository
# gate two steps up is structurally blind to exactly that file.
if [ "$TARGET_KIND" = remote ]; then
  step forbidden-gate "9. the forbidden-content gate, against the origin at $TARGET_URL" served_bytes_gate
else
  step forbidden-gate "9. the forbidden-content gate, against a local server over site/" served_bytes_gate
fi

# The populate registry, read back out of the bytes the page loads. Issue 72 wrote the registry
# and scripts/routes.py to read it, and issue 103 found that nothing ran the reader: not this
# file, not any of seven workflows. Its three failure conditions are the generated-but-never-
# verified class and nothing else in the tree tests them. It is wired in here and in build.yml.
step routes "10. the populate registry is complete and every drawn object binds to it" \
     python3 scripts/routes.py

# Under list-only the register is not looked for either: the listing has to be takeable on a
# machine that holds nothing, which is the machine scripts/check_ci_drift.sh runs on. The step is
# registered under its key in both branches, so the relation is the same list either way.
if [ -n "$LIST_ONLY" ] || register_present; then
  step token-grep "11. the local token grep, against site/" check_token_grep
else
  skip token-grep "11. the local token grep, against site/" \
       "the faculty register build/safety_grep.py reads is not on this machine, so the gate was not run. It is the local half of the safety machinery; the two CI gates hold salted hashes instead and are the half that does not need it."
fi

# smoke.mjs serves site/ on a local port of its own and drives a browser at it, so this step is
# already "the suite against a local server over these bytes".
#
# IT IS ONE SUITE NOW AND IT WAS TWO. Issue 107 found that build/check_grain.mjs was tracked,
# executable, green and run by no step of this file and no workflow, which was scripts/routes.py's
# row in issue 103 in a new place, and it wired the file in here as a step of its own. Issue 109
# folded it into scripts/smoke.mjs instead, so the 33 assertions that were a fourteenth step are
# inside this one: 144 assertions before, 177 after, one phase table, one hand-written total. The
# step count went from 14 to 13 and no claim went with it.
#
# WHY THE STEP WENT RATHER THAN STAYING AS A SECOND INVOCATION. The reason the grain suite could
# go dark is that a suite in its own file has no terminator above it. Its own EXPECTED_ASSERTIONS
# said what it intended to run and nothing said it had to be run at all, so it was written, it was
# green, and for its whole life until issue 107 no gate would have noticed it being deleted. Under
# one total, deleting it means editing 177 in front of a reader, and a hand that deletes the code
# and forgets the number gets a red run. That is a stronger guarantee than a line in this file,
# which is itself a line somebody can delete.
step smoke-local "12. the smoke suite, against a local server over site/" node scripts/smoke.mjs

# WHICH IS WHY THIS ONE IS NOT RUN LOCALLY WHEN THERE IS NO ORIGIN, AND IS NOT QUIETLY DELETED
# EITHER. The step above and this one are two runs only while there are two copies of the bytes:
# the tree, and whatever a third party is serving. Pointed at a second local server over the same
# site/ directory, this step would say the same sentence twice and a reader counting green steps
# would count a second check that checked nothing new. So with no origin it is recorded as skipped,
# with the reason, which is loud in the summary and makes the verdict say a step did not run. That
# is the difference between a step whose subject is absent and a step that was removed for being
# red, and it has to be visible.
#
# AND IT NOW READS THE ORIGIN FOR THE GRAIN CONTROL TOO, which is not a step that was lost but a
# check that was gained: the grain suite only ever ran against the working tree, and the two
# altitudes of the drawing are now driven on the published bytes as well.
if [ "$TARGET_KIND" = remote ]; then
  step smoke-origin "13. the smoke suite, against the origin at $TARGET_URL" node scripts/smoke.mjs "$TARGET_URL"
else
  skip smoke-origin "13. the smoke suite, against the origin" \
       "there is no origin, so there is no second copy of these bytes to drive a browser at. The suite itself ran in full one step above, against a local server over site/; what did not happen is the run that would have proved a published copy behaves. scripts/publish.sh on brings it back."
fi

# AND THE LAST TWO STEPS ARE ABOUT THIS FILE. Issue 168 R4(e). Everything above answers "is the
# artefact sound"; these answer "is the list you just read the same list CI runs". The workflows
# call this file nowhere and re-enumerate its commands by hand, which is two lists of one thing
# joined by nothing, and it had already drifted twice: issue 103 found the first and repaired it
# by hand, leaving the structure, and by the time the audit read the tree `check_syntax` was in
# no workflow at all. scripts/check_ci_drift.sh joins the two lists and refuses the difference.
#
# LAST, because a contributor reading a red run wants the artefact's failures first and a note
# about the workflow files after them, and because this is the only step whose subject is the
# repository's process rather than its product.
step ci-drift-armed "14. prove the CI drift check fires"  bash scripts/check_ci_drift.sh --self-test
step ci-drift "15. every step this file runs is run by a workflow, or is named as one CI cannot" \
     bash scripts/check_ci_drift.sh

# ---------------------------------------------------------------------------------------------
# A listing is not a run and prints no verdict. Issue 168 R4(e).
if [ -n "$LIST_ONLY" ]; then exit 0; fi

echo
echo "=============================================================================="
echo "== summary"
echo "=============================================================================="
fails=0
skips=0
for i in "${!STEP_NAMES[@]}"; do
  case "${STEP_STATE[$i]}" in
    OK)   printf '  [OK]   %s\n' "${STEP_NAMES[$i]}" ;;
    SKIP) printf '  [SKIP] %s\n         %s\n' "${STEP_NAMES[$i]}" "${STEP_NOTE[$i]}"; skips=$((skips + 1)) ;;
    *)    printf '  [FAIL] %s  (%s)\n' "${STEP_NAMES[$i]}" "${STEP_NOTE[$i]}"; fails=$((fails + 1)) ;;
  esac
done
echo
printf '%d steps, %d failed, %d skipped\n' "${#STEP_NAMES[@]}" "$fails" "$skips"

# AND THE CONSTANT THE REFUSAL BANNERS QUOTE IS CHECKED AGAINST WHAT ACTUALLY RAN. Issue 196. The
# banner cannot count the steps, because it prints before step one; so it prints EXPECTED_STEPS,
# and this is the line that stops EXPECTED_STEPS becoming what `thirteen` became. Being wrong is
# loud here, on the first run after the step list moves, rather than found by a reader in the one
# text nobody should have to doubt.
if [ "${#STEP_NAMES[@]}" -ne "$EXPECTED_STEPS" ]; then
  echo
  echo "ASSERTION FAILED: this file intends ${EXPECTED_STEPS} steps and ${#STEP_NAMES[@]} ran."
  echo "  EXPECTED_STEPS is what the refusal banners above the run quote at a reader who is"
  echo "  deciding whether the tool or the tree is wrong, and it is now quoting a number this"
  echo "  file does not run. Move it in the same commit as the step."
  exit 2
fi

# WHAT THIS RUN READ, IN ONE SENTENCE, AND IT IS NOT THE SAME SENTENCE IN BOTH MODES. Issue 107.
# The steps are identical either way and the claim they support is not, so the claim is printed
# rather than left for the reader to reconstruct from the step names. A run that read a local
# server proves the bytes serve and behave; it does not prove that anybody is serving them.
echo
if [ "$TARGET_KIND" = remote ]; then
  echo "read: the origin at $TARGET_URL. A third party was asked for these files over the public"
  echo "      internet and what it returned is what was checked."
else
  where="${TARGET_URL:-it never started, and the step that needed it failed}"
  echo "read: a local server on this machine over site/ ($where). Nothing published was asked"
  echo "      for, because nothing is published. $TARGET_HOW."
fi

if [ "$fails" -gt 0 ]; then
  echo "VERDICT: something is wrong. Nothing is ready to push."
  exit 1
fi
if [ "$TARGET_KIND" = remote ]; then
  claim="The origin serves this."
else
  claim="These bytes serve. No origin was checked, because there is none."
fi
if [ "$skips" -gt 0 ]; then
  # AND THE WORD IS NOT PRINTED HERE EITHER. Issue 168 R4(a), the last layer of it, and it was
  # found by an outside reader after the two below it were repaired. This line used to read
  # "VERDICT: clean, with N step(s) that did not run", which is the whole finding said in one
  # sentence: the summary above prints [SKIP] in a different shape precisely so a skip cannot be
  # read as an OK, and then the one line a reader quotes put them back together under the word
  # this file exists to protect. A qualifier after a verdict is not a verdict; it is a verdict
  # somebody can stop reading.
  echo "VERDICT: INCOMPLETE. $skips step(s) did not run and nothing here is evidence about what"
  echo "         they cover. Everything that DID run passed. $claim"
  echo "         The summary above names each one and why. Read it before pushing on this."
else
  echo "VERDICT: clean. $claim"
fi
exit 0
