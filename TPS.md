# TPS: the Toyota Production System, applied to this artefact

This repository builds one page: a toy instance diagram of the Zrive operating data model,
carrying invented values only. Thirty four objects of twelve types and forty edges exist; four
classes the model needs and no system holds are drawn as absences, with the four edges they would
carry, so the page draws thirty eight nodes and forty four edges. Everything below is about that
page.
Where a Toyota principle changed a real decision here it gets a section; where it did not, it
gets a row and no more.

Status markers: `[OK]` implemented and traceable to a file, `[OPEN]` unvalidated or not built,
`[FLAG]` a deliberate rejection, recorded so it reads as a choice rather than an omission.

The repository and the site are both public. This line said the repository was private until
issue 164 asked the API; the arrangement it described was real once and is not the arrangement
now, and most of what follows was designed under the old one. Only `site/` is deployed, which is
why the repository gate exists at all: the documentation, `build/` and `scripts/` reach no
deployment and are readable by anyone regardless.

| Pillar | Status | Where |
|---|---|---|
| Jidoka, stop the line | `[OK]` best developed | `scripts/check_forbidden.sh`, `scripts/check_repo.sh`, `scripts/smoke.mjs`, and the four workflows that deploy or gate. `issue-status.yml` runs no check and is the one workflow that writes no file and publishes nothing |
| Poka-Yoke, mistake-proofing | `[OK]` | `scripts/check_forbidden.sh`, `scripts/check_repo.sh`, `scripts/forbidden_lib.sh`, `scripts/ci_register.sh`, `scripts/sync_board.mjs`, `scripts/verify.sh` |
| Genchi Genbutsu, go and see | `[OK]` learned the hard way | `~/bin/shot`, `scripts/smoke.mjs`, KAIZEN.md acceptance rule |
| Standard work | `[OK]` | `build/build_layout.py`, `build/model.py` |
| Heijunka, level the work | `[OK]` | GitHub Issues, `scripts/sync_board.mjs` |
| Kanban | `[OK]` | `scripts/sync_board.mjs`, `scripts/set_status.sh`, `.github/workflows/board.yml`, `.github/workflows/issue-status.yml`, `site/board.json` |
| Hansei | `[OK]` | `HANSEI.md` |
| Kaizen | `[OK]` | `KAIZEN.md` |
| Andon | `[OK]` partial | a red workflow run; no second channel |
| Muda, Muri, Mura | `[OK]` | one build step, no framework, no CDN, no web font; the diagram makes no request at all, and the board view fetches `board.json` on a timer while it is on screen and stops the moment it is not or the tab is hidden; a visitor who has stored their own token is served from `api.github.com` instead, conditionally, so an unchanged board costs a 304 and no rate limit; one `POST` there is possible, only when they deliberately file |
| Just-In-Time | `[OPEN]` nothing pulls | the board is filled by hand |
| Nemawashi | `[FLAG]` rejected, see below | none |
| Konnyaku stone | `[OPEN]` no analogue here | none |

## Jidoka

The line stops on a defect rather than passing it on. Here the defect that matters is a real name
or a real figure reaching a public page, and the line is the deploy.

`scripts/check_forbidden.sh` runs after every deploy, in `pages.yml`, which since issue 39 is the
only workflow that deploys, and fails the job on any
of: one of the words that would name the vendor architecture this model was deliberately not
written in; a real name from the teaching register; a euro-formatted figure that is not one of
the two invented ones; a corpus link; a UUID; an email address. A failure marks the run red and
the run is the andon.

**Publishing is a switch, and with it off the line runs anyway and the gate says so.** Issue 101
took the publication down and issue 107 gated `pages.yml` and `origin-freshness.yml` on the
`PUBLISH` repository variable rather than deleting them: with it off both are skipped, which is
neither green nor red, and `scripts/publish.sh on` restores every one of them at once with no
workflow edited. `scripts/verify.sh` looks for the origin rather than being told about it. If one
answers it reads that; if none does it serves `site/` on a local port and reads that, which proves
the bytes serve clean and not that anybody is serving them. The gate prints which of the two it
read and the verdict is a different sentence in each case, `The origin serves this.` against
`These bytes serve. No origin was checked, because there is none.`

**The gate does not unpublish.** It reports; a person takes the page down. An automated unpublish
on a rule that can false-fire would take the site down on a CSS decimal, and the fifteen minutes
a human takes to look is cheaper than the class of failure where a workflow deletes things on its
own. `[OPEN]` The cost of that choice is real: between the gate turning red and a person acting,
the content is public.

**And a third check, which is not a safety gate.** Both of the above ask whether anything
forbidden is here. Neither has ever asked whether the page works, and for the first two hundred
commits nothing did: roughly ten substantive changes landed on 2026-08-10 and 11, every one
verified by driving a headless browser by hand, and every one of those verifications was thrown
away with the session that made it. `scripts/smoke.mjs` is those verifications kept. It serves
`site/` locally, drives Chrome over the DevTools Protocol with no dependency of any kind, and
asserts the behaviours the closed cards established, at 1536x839, 1440x900 and 390x844.
`.github/workflows/smoke.yml` runs it on every push and every pull request, in a workflow of its
own and deliberately not in the deploy path: a check that can leave the site half published is a
worse thing than a check that runs a minute earlier, and a red safety gate and a red behaviour
suite have to stay distinguishable at a glance. Issue 58.

## Poka-Yoke

Six places where the mistake is made hard rather than remembered against.

- **The gate reads deployed bytes, not local files.** `check_forbidden.sh` takes its file list
  from `site/` and then fetches each of those paths from the public origin over HTTP. A gate
  reading the working tree answers "is the source clean", which is a different question from "is
  the thing the public can read clean", and between the two sit a build, an artifact upload, a
  cache and a CDN.
- **And a second gate reads the repository, because the first one structurally cannot.** Only
  `site/` is deployed, so `check_forbidden.sh` has never had an opinion about `build/`, `scripts/`
  or a line of the documentation. `scripts/check_repo.sh` scans every tracked file against the same
  hash list, on every push and every pull request. It exists because a real surname sat in
  `scripts/` for a day, in the script written to keep names out, where no reading of the public
  origin could have reached it (HANSEI.md `2026-08-09-gate-scoped-to-the-public-surface`). `[OPEN]`
  It scans its own source, so it carries a table of declared self-matches; each is an exact triple
  of rule, path and string, an entry that stops matching fails the run, and the real-name rule
  cannot be declared at all, but a table is still a place where something could be parked.
- **The gate holds no names, and no longer holds the key to them either.** `[OK]`
  `scripts/forbidden_names.sha256` holds one salted, truncated hash per name token; the checker
  folds the bytes the same way and compares. `scripts/gen_forbidden_hashes.sh` runs locally
  against the vault and is the only thing that ever sees the names. The row above this one said
  the rest bought obscurity rather than secrecy, because the salt was committed and Spanish given
  names and surnames are a short dictionary. It was right and it was not enough: the salt was
  committed **in the header of the file it protects**, next to a count of the real people covered,
  on a repository that had become public, and the whole construction runs at a rate that finishes
  a hundred thousand candidates in a fraction of a second. Issue 164. The register is untracked
  now, the salt is random and lives in a repository secret, the header names neither, and a
  register that cannot match aborts every gate rather than passing everything. README.md, "The
  name register", is the procedure.
- **A gate that cannot get its list stops.** `[OK]` Untracking the register created a state that
  did not exist before, a complete checkout that cannot run the gates, and the wrong answer to it
  is a skip. `scripts/forbidden_lib.sh` refuses to load with no salt, both gates refuse to scan
  with no register or a register built under another salt, and `scripts/verify.sh` refuses the
  whole run rather than reporting eleven of thirteen. Every one of those is proved by a probe in
  `scripts/check_repo.sh --self-test`, in both directions.
- **An empty input aborts instead of reporting clean.** `scan_dir` asserts a non-zero file count,
  a non-zero byte count and a non-empty hash list, and exits 2 if any of the three fails. A gate
  handed nothing to scan and reporting clean is the loudest lie it can tell, and this project has
  already had a workflow report success on an empty input
  (HANSEI.md `2026-08-empty-input-reported-success`).
- **A citation names a slug, not a position.** HANSEI.md and KAIZEN.md entries carry slugs and
  are cited by them, and `check_repo.sh` fails the build on a cited slug no entry carries. The
  form it replaced, "HANSEI.md, sixth entry", was safe only while a document was append-only, and
  KAIZEN is not: two changelog entries citing its last lesson already meant two different ones,
  and the cost was an agent withholding a lesson rather than repointing them by adding it, issue
  54.
- **One entrypoint, so the list is not reconstructed from prose.** `scripts/verify.sh` runs, in
  order, the syntax check on every shipped script, the layout reproducibility check, the
  provenance gate's self-test, both content gates with their self-tests, the local token grep and
  the smoke suite. Every one of those already
  existed and every one was findable only by reading a different paragraph of a different file,
  which makes the list a thing somebody rebuilds by hand and therefore a thing somebody rebuilds
  short. A step that cannot run says `[SKIP]` and why, because a clean run that skipped two checks
  must not read as a clean run that did nine.
- **Each gate is proved armed before it is trusted.** Every workflow runs the relevant
  `--self-test` alongside the live check. Each builds one synthetic payload per rule and asserts
  it trips, asserts the two declared invented figures do not, and asserts an empty input aborts;
  `check_repo.sh --self-test` adds probes that its declared self-matches are exact and that the
  real-name rule ignores every declaration. Both prove the name rule against a synthetic hash list
  holding one made-up token, so proving the matcher works never requires a real name to exist in
  this repository, in a temporary file or in a log.

## Genchi Genbutsu

**No change is reported here without a screenshot that a human or an agent has actually looked
at.** Not a build that exited zero, not a diff that reads correctly, not a test that passed: the
picture.

The rule was bought. This project once shipped a blank page and reported it working, because the
screenshot that vouched for it was taken before the JavaScript had run. `~/bin/shot` now passes
`--virtual-time-budget` and fails loudly rather than writing a zero-byte file. Full entry in
HANSEI.md, whose thesis is the generalisation: an artefact's name, a green tick, a file's
existence and a description of a thing are all evidence about the thing, and none of them is the
thing.

`scripts/smoke.mjs` does not replace that rule and is written so that it cannot pretend to. It
never takes a screenshot, because a screenshot it looked at itself would be the weakest form of
both practices at once. It reads values off the running document, and it waits on a condition the
page answers rather than on a tool's idea of ready, which is exactly what went wrong above. A
picture is still what a person looks at. What the suite adds is that the things a picture is bad
at, a count, an arithmetic identity, a hidden set and a coordinate under a cursor, now have
somewhere to fail.

## Standard work

The build is deterministic. `build/model.py` states the objects, their properties and the edges;
`build/build_layout.py` is a function from that document to geometry and writes the two files
the page loads, `site/instance.js` and `site/layout.js`. The browser draws and decides no
coordinate. Same input, same picture, every
load and every reader; a reader who pans or zooms moves the whole drawing and changes nothing
inside it.

This is why a layout defect is a defect and not a mood. "The right half is empty" is a statement
about a file that can be diffed, not about how the page happened to render today.

## Heijunka

Small commits, one defect at a time, and a board that shows the work in progress rather than the
work intended. At most one card is in the In progress column at a time. Defects are filed one per
cause rather than one per symptom: the three layout defects this repository opened with looked
like one problem and had three causes, and a single commit touching all three could not have been
reverted for the one that turned out wrong. KAIZEN.md carries that argument; the board carries
which cards are open.

## Kanban

The board is GitHub Issues, rendered. `scripts/sync_board.mjs` maps a `status:` label to one of
four columns and writes `site/board.json`; `.github/workflows/board.yml` runs it on every issue
event, commits the file when it changed, and wakes `pages.yml`, which is the only workflow that
deploys. **There is no triage step and no model call.** A label decides a column;
nothing infers one. An issue nobody has labelled lands in Raw, which is the honest answer to "we
have not looked at this yet".

**The label itself is no longer typed by a person.** `.github/workflows/issue-status.yml` writes
it from events GitHub already raises, and the signal for taking a card is assignment. That is
still not triage: each rule is a mapping from one event to one label, the mapping is written out
in the workflow, and nothing reads a title. `scripts/set_status.sh` owns the write and makes it
only when the set of labels an issue carries differs from the set it should carry, which is what
keeps a workflow that listens to issue events and writes labels from feeding itself. KAIZEN.md
carries the rule in full.

The board is deliberately thinner than the one it was copied from. monetary-lab's version carries
an LLM triage pass, a commit-trailer directive language and a queueing discipline for racing
deploys. The queueing discipline has since been earned here, twice over. The reading of commit messages was
tried in the narrowest form it has, a bare `#12` marking that issue in progress, and is now
removed: in thirteen pushes it wrote four labels and every one read a citation as a claim of work
(HANSEI.md `2026-08-10-citation-read-as-a-claim`). Nothing in this repository reads a commit
message. The LLM triage pass is still refused: a board this size does not need classifying.

## Andon

A failed workflow run, which is where a person already looks. `[OPEN]` There is no second channel:
no task raised, no message sent. On a project this size the gap between a red run and somebody
noticing is hours rather than days, and the honest statement is that nothing here shortens it.

## Nemawashi

**Rejected.** Nemawashi is laying the groundwork for a decision by consulting everybody it will
affect before it is proposed. This artefact has one author, one reviewer and no constituency, so
every consultation would be the author agreeing with himself, and the ceremony would produce
exactly the thing this project has already been burned by: the appearance of review.

Read HANSEI.md `2026-08-09-private-repo-public-pages` carefully and it is not a consultation
failure. Licences and trademarks were checked, and the question that mattered, whether the site
would be publicly readable, was simply never asked. More people in the room does not generate an
unasked question. What did generate it was an adversarial review, whose job is to disagree, and that
is the opposite of consensus-building rather than a cheap version of it. The substitute is named
because a rejected pillar with no substitute is a hole.

## Where to look

| Pillar | Primary file |
|---|---|
| Jidoka | `scripts/check_forbidden.sh`, `scripts/check_repo.sh`, `scripts/smoke.mjs`, `.github/workflows/pages.yml`, `.github/workflows/board.yml`, `.github/workflows/repo-gate.yml`, `.github/workflows/smoke.yml` |
| Poka-Yoke | `scripts/check_forbidden.sh`, `scripts/check_repo.sh`, `scripts/forbidden_lib.sh`, `scripts/gen_forbidden_hashes.sh`, `scripts/verify.sh` |
| Genchi Genbutsu | `HANSEI.md`, `KAIZEN.md` acceptance rule, `scripts/smoke.mjs` |
| Standard work | `build/model.py`, `build/build_layout.py` |
| Heijunka, Kanban | `scripts/sync_board.mjs`, `scripts/set_status.sh`, `.github/workflows/board.yml`, `.github/workflows/issue-status.yml` |
| Hansei | `HANSEI.md` |

Re-read and correct this document whenever a claim in it stops being true.
