# TPS: the Toyota Production System, applied to this artefact

This repository builds one page: a toy instance diagram of the Zrive operating data model,
twenty six objects and thirty two edges, carrying invented values only. Everything below is
about that page. Where a Toyota principle changed a real decision here it gets a section;
where it did not, it gets a row and no more.

Status markers: `[OK]` implemented and traceable to a file, `[OPEN]` unvalidated or not built,
`[FLAG]` a deliberate rejection, recorded so it reads as a choice rather than an omission.

The repository is private and the site is public. That is the arrangement, deliberately, and
it is the reason most of what follows exists. Only `site/` is deployed; `TPS.md`, `KAIZEN.md`,
`HANSEI.md`, `CHANGELOG.md`, `build/` and `scripts/` are not.

| Pillar | Status | Where |
|---|---|---|
| Jidoka, stop the line | `[OK]` best developed | `scripts/check_forbidden.sh`, `scripts/check_repo.sh`, and the three workflows that deploy or gate. `issue-status.yml` runs neither gate and is the one workflow that writes no file and publishes nothing |
| Poka-Yoke, mistake-proofing | `[OK]` | `scripts/check_forbidden.sh`, `scripts/check_repo.sh`, `scripts/forbidden_names.sha256`, `scripts/sync_board.mjs` |
| Genchi Genbutsu, go and see | `[OK]` learned the hard way | `~/bin/shot`, KAIZEN.md acceptance rule |
| Standard work | `[OK]` | `build/build_layout.py`, `build/model.py` |
| Heijunka, level the work | `[OK]` | GitHub Issues, `scripts/sync_board.mjs` |
| Kanban | `[OK]` | `scripts/sync_board.mjs`, `scripts/set_status.sh`, `.github/workflows/board.yml`, `.github/workflows/issue-status.yml`, `site/board.json` |
| Hansei | `[OK]` | `HANSEI.md` |
| Kaizen | `[OK]` | `KAIZEN.md` |
| Andon | `[OK]` partial | a red workflow run; no second channel |
| Muda, Muri, Mura | `[OK]` | one build step, no framework, no CDN, no web font; on load the page makes one same origin fetch of `board.json` and no third party request; one `POST` to `api.github.com` is possible, only when a visitor has stored their own token and deliberately files |
| Just-In-Time | `[OPEN]` nothing pulls | the board is filled by hand |
| Nemawashi | `[FLAG]` rejected, see below | none |
| Konnyaku stone | `[OPEN]` no analogue here | none |

## Jidoka

The line stops on a defect rather than passing it on. Here the defect that matters is a real
name or a real figure reaching a public page, and the line is the deploy.

`scripts/check_forbidden.sh` runs after every deploy, in both workflows, and fails the job on
any of: one of the words that would name the vendor architecture this model was deliberately
not written in; a real name from the teaching register; a euro-formatted figure that is not
one of the two invented ones; a corpus link; a UUID; an email address. A failure marks the run
red and the run is the andon.

**The gate does not unpublish.** It reports; a person takes the page down. That is a choice
and not an oversight: an automated unpublish on a rule that can false-fire would take the site
down on a CSS decimal, and the fifteen minutes a human takes to look is cheaper than the class
of failure where a workflow deletes things on its own. `[OPEN]` The cost of that choice is
real. Between the gate turning red and a person acting, the content is public.

## Poka-Yoke

Five places where the mistake is made hard rather than remembered against.

- **The gate reads deployed bytes, not local files.** `check_forbidden.sh` takes its file list
  from `site/` and then fetches each of those paths from the public origin over HTTP, scanning
  what comes back. A gate reading the working tree answers "is the source clean", which is a
  different question from "is the thing the public can read clean", and between the two sit a
  build, an artifact upload, a cache and a CDN.
- **And a second gate reads the repository, because the first one structurally cannot.** Only
  `site/` is deployed, so `check_forbidden.sh` has never had an opinion about `build/`,
  `scripts/` or a line of the documentation. `scripts/check_repo.sh` scans every tracked file
  against the same hash list, on every push and every pull request. It exists because a real
  surname sat in `scripts/` for a day, in the script written to keep names out, where no
  reading of the public origin could have reached it (HANSEI.md, sixth entry). The two answer
  different questions and neither answer implies the other. `[OPEN]` It scans its own source,
  so it carries a table of declared self-matches; each is an exact triple of rule, path and
  string, an entry that stops matching fails the run, and the real-name rule cannot be
  declared at all, but a table is still a place where something could be parked.
- **The gate holds no names.** The register of people who have taught for the company must not
  be committed here. `scripts/forbidden_names.sha256` holds one salted, truncated hash per
  name token; the checker folds the deployed bytes the same way and compares. The generator,
  `scripts/gen_forbidden_hashes.sh`, runs locally against the vault and is the only thing that
  ever sees the names. `[OPEN]` This buys obscurity, not secrecy: the salt is committed, and
  Spanish given names and surnames are a short dictionary. It stops a casual read and a search
  engine. It does not stop somebody who wants the list.
- **An empty input aborts instead of reporting clean.** `scan_dir` asserts a non-zero file
  count, a non-zero byte count and a non-empty hash list, and exits 2 if any of the three
  fails. A gate handed nothing to scan and reporting clean is the loudest lie it can tell, and
  this project has already had a workflow report success on an empty input (HANSEI.md).
- **Each gate is proved armed before it is trusted.** Every workflow runs the relevant
  `--self-test` alongside the live check. Each builds one synthetic payload per rule and
  asserts it trips, asserts the two declared invented figures do not, and asserts an empty
  input aborts; `check_repo.sh --self-test` adds probes that its declared self-matches are
  exact and that the real-name rule ignores every declaration. Both prove the name rule
  against a synthetic hash list holding one made-up token, so proving the matcher works never
  requires a real name to exist in this repository, in a temporary file or in a log.

## Genchi Genbutsu

**No change is reported here without a screenshot that a human or an agent has actually looked
at.** Not a build that exited zero, not a diff that reads correctly, not a test that passed:
the picture.

The rule was bought. This project once shipped a blank page and reported it working, because
the screenshot that vouched for it was taken before the JavaScript had run. Chrome's
`--screenshot` fires when the document is ready, and the document being ready says nothing
about a page that draws itself in script. `~/bin/shot` now passes
`--virtual-time-budget`, which advances the page's clock until its work is done before the
frame is captured, and it fails loudly rather than writing a zero-byte file. Full entry in
HANSEI.md.

The generalisation is the one that keeps costing money elsewhere: an artefact's name, a green
tick, a file's existence and a description of a thing are all evidence about the thing and
none of them is the thing.

## Standard work

The build is deterministic. `build/model.py` states the twenty six objects, their properties
and the thirty two edges; `build/build_layout.py` computes every coordinate at build time and
writes them into `site/graph.js`. The browser draws and decides nothing. Same input, same
picture, every load and every reader.

This is why a layout defect is a defect and not a mood. "The right half is empty" is a
statement about a file that can be diffed, not about how the page happened to render today.

## Heijunka

Small commits, one defect at a time, and a board that shows the work in progress rather than
the work intended. The five standing defects are five issues, and the discipline is that at
most one of them is in the In progress column at a time. There is no batching of "the layout
fixes" into one change: three of the five are layout defects with three different causes, and
a single commit touching all three cannot be reverted for the one that turned out wrong.

## Kanban

The board is GitHub Issues, rendered. `scripts/sync_board.mjs` maps a `status:` label to one
of four columns and writes `site/board.json`; `.github/workflows/board.yml` runs it on every
issue event and deploys. **There is no triage step and no model call.** A label decides a
column; nothing infers one. An issue nobody has labelled lands in Raw, which is the honest
answer to "we have not looked at this yet".

**The label itself is no longer typed by a person.** `.github/workflows/issue-status.yml` writes
it from events GitHub already raises, and the signal for taking a card is assignment:
assigned means `status:in-progress`, unassigning the last person means `status:backlog`, closing
means `status:done` or, on a not-planned closure, no label at all. That is still not triage. Each
rule is a mapping from one event to one label, the mapping is written out in the workflow, and
nothing reads a title. `scripts/set_status.sh` owns the write and makes it only when the set of
labels an issue carries differs from the set it should carry, which is what keeps a workflow that
listens to issue events and writes labels from feeding itself. KAIZEN.md carries the rule in full.

The board is deliberately thinner than the one it was copied from. monetary-lab's version
carries an LLM triage pass, a commit-trailer directive language and a queueing discipline for
racing deploys. The queueing discipline has since been earned here, twice over, and the reading
of commit messages is now taken in the narrowest form it has: a bare `#12` marks that issue in
progress and nothing else, which is a backstop for work that started without an assignment rather
than a language for instructing the board. The LLM triage pass is still refused: five cards do
not need classifying.

## Andon

A failed workflow run, which is where a person already looks. `[OPEN]` There is no second
channel: no task raised, no message sent. On a project this size the gap between a red run and
somebody noticing is hours rather than days, and the honest statement is that nothing here
shortens it.

## Nemawashi

**Rejected.** Nemawashi is laying the groundwork for a decision by consulting everybody it
will affect before it is proposed. This artefact has one author, one reviewer and no
constituency, so every consultation would be the author agreeing with himself, and the
ceremony would produce exactly the thing this project has already been burned by: the
appearance of review.

Read HANSEI.md's first entry carefully and it is not a consultation failure. Licences and
trademarks were checked, and the question that mattered, whether the site would be publicly
readable, was simply never asked. More people in the room does not generate an unasked
question. What did generate it was an adversarial review, whose job is to disagree, and that
is the opposite of consensus-building rather than a cheap version of it. The substitute is
named because a rejected pillar with no substitute is a hole.

## Where to look

| Pillar | Primary file |
|---|---|
| Jidoka | `scripts/check_forbidden.sh`, `scripts/check_repo.sh`, `.github/workflows/pages.yml`, `.github/workflows/board.yml`, `.github/workflows/repo-gate.yml` |
| Poka-Yoke | `scripts/check_forbidden.sh`, `scripts/check_repo.sh`, `scripts/forbidden_lib.sh`, `scripts/gen_forbidden_hashes.sh` |
| Genchi Genbutsu | `HANSEI.md`, `KAIZEN.md` acceptance rule |
| Standard work | `build/model.py`, `build/build_layout.py` |
| Heijunka, Kanban | `scripts/sync_board.mjs`, `scripts/set_status.sh`, `.github/workflows/board.yml`, `.github/workflows/issue-status.yml` |
| Hansei | `HANSEI.md` |

Re-read and correct this document whenever a claim in it stops being true.
