# Zrive operating model, toy instance diagram

One screen. One programme, one cohort, twenty six named objects and the verbs that join them.

**Publishing is a switch, and this line does not say which way it is set.** `bash
scripts/publish.sh status` answers that, along with what the url actually serves; `on` and `off`
move it. This account is on GitHub Pro, private Pages needs Enterprise Cloud, so on means
world-readable with no authentication available, which is the whole of the decision.

## What may go on the page, and what the gates hold it to

The origin is world-readable, so the standing constraint is about what may be published rather
than about what the page says of itself. **The page itself says nothing about the standing of its
content**, on the owner's instruction of 12 August 2026, #110: no footer sentence, no flag badge in
the side panel, no note on the outline, no clause in a tooltip. The provenance fields are untouched
in the document and the gates below are untouched with them. Nothing was replaced by a shorter
version and nothing was moved somewhere quieter; a change that puts any of it back is a product
decision and not a repair.

What is published: the company name Zrive, the programme name and code (Z-IB Investment Banking),
the six session titles, which are published on the company's own website, and the names of
firms, which are companies rather than individuals.

What is not: every instructor name, the empresa colaboradora, every identifier, every
date, every count, and all three money figures. No real person is named. No figure comes from
the corpus.

Three gates enforce that: one local, and two in CI that ask different questions. A fourth check,
`scripts/smoke.mjs`, asks a different question again, whether the page still works; see Verifying
below.

`build/safety_grep.py` runs against the local `site/` before a push. It reads the vault faculty
register directly, so it needs the vault, and it scans for any real teacher name, for Notion
identifiers and for money-shaped strings, failing unless the only money present is the declared
invented set.

`scripts/check_forbidden.sh` runs in CI **after** every deploy and scans **deployed bytes**: it
takes its file list from `site/`, fetches each of those paths from the public origin over HTTP,
and fails the job on a real name, a euro-formatted figure other than the two invented ones,
`collection://`, a UUID, an email address, or any of the words that would name a vendor
architecture. It holds no names: `scripts/forbidden_names.sha256` carries salted hashes, and
`scripts/gen_forbidden_hashes.sh` regenerates them locally from the register. Run
`scripts/check_forbidden.sh --self-test` to see it fire on one synthetic case per rule.

`scripts/check_repo.sh` runs in CI on every push and every pull request and scans **every
tracked file**, which is the half the deployed-bytes gate cannot reach: Pages publishes `site/`
and nothing else, so nothing in `build/`, `scripts/` or the documentation was ever in front of
a gate until this one existed. Same rules, same hash list. Where the origin gate prints a name
it finds, because it is already public, this one prints the file and the line numbers and
withholds the token. It scans its own source too, so it carries an explicit table of declared
self-matches, each an exact triple of rule, path and string; the table is not a list of
excused files, and an entry that stops matching fails the run rather than lingering. It also
checks the documentation's citations: `HANSEI.md` and `KAIZEN.md` entries carry slugs, everything
that cites one names the slug, and a citation naming a slug no entry carries fails the build.

The repository is private and the site is public. That is deliberate. Read `HANSEI.md` first if
that combination looks like an accident.

## Reading the diagram

Flow is left to right, through six named bands: programme and employer, session templates,
instructors, cohort sessions, cohort and students, enrolment to claim. Each band is a lane of
its own, so two adjacent kinds of object are told apart by where they sit and not only by tile
colour. The enrolment to agreement to charge to claim chain folds over two columns instead of
running out over four, which is what kept the right of the drawing from emptying out. Aretxa
Capital sits inside the cohort session band on purpose: it hosts a visit at session level.

Every edge carries its relationship verb on the line, and the arrowhead points at the target
of that verb. Edges are uniform hairlines: the data is invented, so nothing is encoded in
their weight.

The whole drawing fits one 1440 by 900 viewport without scrolling. Below 760px it keeps its
designed size and the canvas scrolls sideways, rather than shrinking until the labels stop
being readable.

Five of the seven drawings are about 600 units tall and fit that viewport at roughly full size.
Two are not: Z-BL and Z-SC draw their whole syllabus, twenty eight and twenty five session
templates against six on the other five, and they stand 2578 and 2470 units tall. They still
fit without scrolling, because the canvas frames them, but they fit at about 23 per cent and a
reader who wants to read a tile zooms in and pans rather than taking the drawing in at once.
That is the trade issue 83 made deliberately, and the reasoning is on the card and in
build/bands.py.

Click a node to select it. The clicked node takes a solid fill, everything except its direct
neighbours dims, and a side panel lists its properties with a flag on each. Nothing is drawn
around it. A reader arriving by keyboard gets a frame on the node the tab is on, which a mouse
click does not raise, because where the keyboard is and what is selected are different
questions.

The drawing is one cohort and there is no route to any other view. A `2nd cohort` switch drew a
second one, 2Q26, off the same six session templates; it is removed. The page ships exactly one
coordinate set, `window.G`, and holds no state that could put it into another.

## Scope is a set

The programme is not the address any more. **The address carries a SET of programmes and it starts
at all seven**: `#/p/ZIB` is the same address it always was and resolves to the same drawing,
`#/p/ZIB+ZSC` is two, `#/p/ALL` is every programme the document holds, and an address with no
opinion draws all of them. The control is a rail of eight chips in the heading, All and the seven,
and **each chip carries its own programme's population at rest**, `IB 6/79` beside `BL 28/28`,
because five of the seven documents hold a sample of their programme's term and a merged drawing
read without those fractions invites being read as a fact about the business. The fractions travel
to the phone unchanged; the rail scrolls sideways rather than dropping them.

**More than one programme is ONE drawing.** Each programme owns a fixed sector down one shared set
of lanes, in the build's own order, so adding a programme fills an empty sector rather than
re-laying what was already on screen. Objects the documents share are drawn **once**, joined by the
id the build already writes for the same object across documents, and that collapse is the whole
reason a line between two programmes exists at all: a shared instructor drawn twice is two nodes
with nothing between them. A programme hue appears on session and cohort tiles, and only while more
than one programme is drawn. **A scope of one is the artefact the build wrote**, node for node and
path for path, which `scripts/smoke.mjs` asserts as an identity over all fourteen drawings.

**The budget is seventy two session tiles, and it is a measurement.** `viewport.js` clamps the
scale at a tenth, so a drawing taller than the canvas over that cannot be framed whole by `fit`.
All 127 scopes were driven at the whole term at 390 by 844: 121 frame, six do not, the largest
that frames is 71 tiles and the smallest that does not is 77. Where the scope, the window and the
altitude would exceed it the drawing renders at the modules grain, and the refusal is printed on
the control that was refused: the `sessions` row of `grain` greys and carries the count that broke
it. A scope of one is never refused. The densest three week window across all seven draws 17
session tiles and frames at about a quarter, which is the size the Z-BL term drawing already
renders at.

Object types shown, one instance at least of each: Programme, Company, Instructor, session
template, cohort session, Cohort, an aggregate students card, Student, Enrolment, Agreement,
Charge, Claim.

Two kinds of tile are laid out and not painted until they are asked for. Selecting an instructor
brings out the employer at the other end of its `employed by` edge; selecting the students card
brings out four Students, with a line under the card saying how many of the cohort it did not
draw. Both fade in where the build already put them, so nothing on the page moves.

## Layout

Coordinates are computed at build time in Python and shipped as data. The browser only draws.
The algorithm is a degenerate Sugiyama: columns fixed by object type, order within a column
from barycentre sweeps, Y relaxed towards the mean of each node's neighbours and then packed to
a minimum gap. Short columns on the right open their gaps until they span a share of the
height, so the money chain does not read as a clump adrift in a tall empty lane. Verb chips
slide along their own edge until they find a slot clear of tiles, labels and other chips.

`layout()` takes the model as arguments and touches no module state. It reads as a leftover
from the days when it laid out two drawings, and it is kept for the property that arrangement
bought: the drawing is a pure function of the model, checkable by running the build twice
rather than believed.

`build_layout.py` also stamps a build id, a short digest of the drawing itself. Every feedback
report carries it, so a note can be tied to the exact bytes that were on screen.

## Layout of the repo

```
site/            what is deployed
  index.html     the shell
  app.css        design tokens and components
  app.js         joins the two documents, builds the five modules and wires them
  render.js      paints the drawing from geometry
  viewport.js    pan, zoom and fit
  selection.js   what is picked, what it dims and what it reveals
  router.js      the scope in the address, the chip rail and #/students
  term.js        the term read twice, at #/calendar and #/outline
  instance.js    generated: the objects, their properties and identity, do not edit by hand
  layout.js      generated: every coordinate, do not edit by hand
  feedback.js    the feedback button
  board.js       the board view at #/board
  board.json     generated from GitHub Issues, read by board.js, do not edit by hand
build/
  model.py       the objects, their properties and the edges
  build_layout.py    a function from the instance document to geometry, writes both site files
  measure_labels.py  measures every label in a real browser -> label_widths.json
  safety_grep.py     the local forbidden content gate
scripts/
  verify.sh               run everything below, in order, before pushing
  smoke.mjs               the headless behaviour suite, at three viewports
  check_forbidden.sh      the CI gate, against deployed bytes
  check_repo.sh           the CI gate, against every tracked file
  forbidden_lib.sh        the rules, the folding and the scan, shared by both gates
  gen_forbidden_hashes.sh regenerates the hashed name list from the vault
  sync_board.mjs          GitHub Issues -> site/board.json
```

## How this repository is worked

| file | what it holds |
|---|---|
| `TPS.md` | the Toyota principles as they apply to this artefact, including the one rejected |
| `KAIZEN.md` | the improvement loop, the reflection step, and the lessons in the order they were bought |
| `HANSEI.md` | the failures this work has actually had, and what stops each recurring |
| `CHANGELOG.md` | what changed and when |

The board is GitHub Issues, rendered into `site/board.json` by `scripts/sync_board.mjs` and
kept current by `.github/workflows/board.yml`. Four columns: Raw, Backlog, In progress, Done.
A `status:` label decides the column; an issue nobody has labelled sits in Raw. There is no
triage step and no model call anywhere in that path.

**Issue titles are published.** They are rendered onto the page through `board.json`, so an
issue carries no real name, no real figure and no link into the private corpus.

## Verifying

**One command, and it is the whole list.**

```bash
bash scripts/verify.sh                   # everything
bash scripts/verify.sh <origin-url>      # read that url, without looking for one
bash scripts/verify.sh --local           # serve site/ locally, without looking for one
```

It runs, in order: `node --check` on every shipped script, the layout reproducibility check, both
safety gates with their self-tests, the populate registry reader, the local token grep, the smoke
suite and the grain suite. Every step reports
`[OK]`, `[FAIL]` or `[SKIP]`, every step runs whatever the ones before it did, and the exit code is
non-zero if anything failed. A step that cannot run here, the token grep without the vault and the
smoke run against the origin when there is no origin, says `[SKIP]` and why: a clean run that
skipped two things must not read as a clean run that did nine.

**Two of the steps read bytes back over HTTP, and it says which server answered.** With the site
on, it checks the origin and the verdict reads `The origin serves this.` With the site off, it
serves `site/` on a local port, checks that, and the verdict reads
`These bytes serve. No origin was checked, because there is none.` The second is the weaker claim
and is never printed as the first. Nothing needs editing when the site comes back: the origin is
looked for, not configured.

`scripts/smoke.mjs` is the behaviour half, and can be run on its own:

```bash
node scripts/smoke.mjs                   # serve site/ and test it
node scripts/smoke.mjs <origin-url>
```

It asserts across three viewports, 1536x839, 1440x900 and 390x844, and **how many is a number this
sentence no longer carries.** Issue 106. The line opened "Ninety seven assertions" from `81ccf0f`,
where 97 was right, until here: `EXPECTED_ASSERTIONS` in the suite read 139 at `02459ac` and 144 at
`5f32209`. The suite has held its own terminator all along, so the total was asserted
in one place and typed in another, and only the typed one could go stale. It went stale in the
direction that flatters, since a reader budgeting for 97 thinks the suite thinner than it is. This
paragraph named a third figure, `177 now`, until issue 125 found it reading 177 against a suite of
223: a sentence whose subject is a number going stale had gone stale itself, four cards after it
was written. What replaces it is nothing, which is what the sentence asked for in the first place;
the constant in the file is the only copy of that number and it is checked before anything runs. Run
it and it names every assertion and ends on its own total. What follows is what it covers, and it
is not exhaustive either: the six Company
nodes of which five are hidden employers, each instructor revealing its own employer and nothing
else, the students card and the roster agreeing on how many of the cohort the drawing left out, the
term's two readings holding one row per session and per template, in date order and in curriculum
order, with the sample they drew declared and the sessions with no instructor marked on the rows,
each reading taking a programme and the unscoped pair surviving it, the outline grouped by the
module its syllabus declares and saying so where a syllabus declares none, a lane heading that is a
target of at least 24 by 24 at the smallest scale the canvas allows, at fit and at the largest,
still a pan under a press and drag, the per session outline off until it is asked for and, when it
is on, every line of it carrying the provenance fields the model gates and none of them printed,
the pointer-anchored zoom holding the point under the cursor, a click and a 2px wobble selecting
where a 40px drag pans, capture mode filing nothing on a pan and producing an unchanged element
descriptor, the board's four columns and its arithmetic, no sideways scroll at any width, and no
console error beyond the favicon 404. Plain Node driving Chrome over the DevTools Protocol; no
framework, no dependency, and no GitHub token. It cannot file an issue: the page's own network
calls are stubbed, `github.com` is blocked below the page, and both are asserted.
`.github/workflows/smoke.yml` runs it on every push and every pull request. It is deliberately not
in the deploy path, so a behaviour regression can never leave the site half published.

## Regenerating

```bash
python3 build/build_layout.py     # rewrites site/instance.js and site/layout.js
python3 build/safety_grep.py site # must print VERDICT: clean
python3 -m http.server -d site 8000
```

`scripts/verify.sh` runs the first two of those and checks that the rebuild is byte identical.

No framework, no build step for the site itself, no CDN, no web font. On load the page makes
one request, the same origin fetch of `board.json`, and no third party request at all. The one
outbound request it can ever make is described under Feedback below.

## Feedback

The `feedback` button in the header opens a small popover: a note and a category. There are two
filing paths and which one runs depends on the visitor, not on the page.

**With no token stored, which is the state of every visitor by default,** submitting opens a
prefilled `github.com` issue URL in a new tab. No POST, no API call, no credential. The
repository is private, so only someone already signed in with access can file, and a prefilled
URL needs none.

**A visitor may connect their own fine grained personal access token** through the popover. It
is stored in that browser's `localStorage` under `zmt.gh.token` and nowhere else. When such a
visitor deliberately files, with Shift+Enter or the file button, the page makes exactly one
outbound request: a `POST` to `https://api.github.com/repos/<repo>/issues`, carrying that
visitor's own token in an `Authorization` header. It is sent to `api.github.com` and to no
other host. On any failure, including a rejected or expired token, the flow falls back to the
prefilled URL above.

**No credential is shipped in the source.** There is no token in this repository, none in the
deployed bytes, and none is fetched: the only token that can ever exist is one a reader pasted
into their own browser. `scripts/check_forbidden.sh` reads the deployed bytes on every deploy
and would fail the job on one.

The body carries a context block the page fills in: the selected node, the view, the viewport
size and the build id.

## The cohort in full

`#/students` lists all thirty four students as rows, over the drawing, from the roster the build
writes into `site/instance.js`. With more than one programme in scope it is the first of them, and
its heading says which. It is a list of one cohort, reached from the students card's own panel,
where the link names the cohort it is about; it is not one of the views the header offers, because
under a scope that is a set a header link to it named none of the seven. The drawing is not a way
to reach part of it: the diagram
answers what shape a student record is and this answers who is in the cohort. Escape, the close
button and a click outside all dismiss it, and it closes itself on the way to the board.

**Every person in it is invented, and the build refuses to publish a roster that is not.**
`build/model.py` puts every string this model ships through the same salted hash the safety gates
use and stops the build on a hit. The universities are real institutions, which names nobody.

## The term, read twice

`#/calendar` is every cohort session on the seven drawings in date order, and `#/outline` is every
session template in curriculum order, grouped by the module its syllabus puts it in. One sheet, two
readings, and the same 83 rows seen twice: once as when a thing happened and once as what is
taught. The way into either is the node, a cohort session for the calendar and a session template
for the outline, which is where both were asked for, and the lane heading over each of those two
columns, which is where the owner pressed. The header takes no new control.

**Each reading also takes a programme**, at `#/calendar/ZSC` and `#/outline/ZSC`, sixteen addresses
in all, and the panel's link and the lane heading both go to the scoped one. **The unscoped pair
stays**, and the reason is the difference between the two objects. Every cohort session records
that its schedule lives in Notion, one calendar per programme per quarter, so a calendar of one
programme is a copy of something the business already has and one term across the seven exists
nowhere. A syllabus is not like that: it belongs to a programme, and a reader arriving from a Z-SC
tile is asking about Z-SC.

It carried three marks saying it is not a schedule, in the subtitle, in a notice above the rows and
on a sticky banner row inside the table; issues 91 and 93 deleted all three and issue 110 settled
the question they were asking. The drawings hold 83 of the 260 sessions the model counts and the
sheet declares that sample, which is a statement about what was drawn rather than about the
standing of what is in it. `state` and `teacher_assigned`
are what make it more than a list: 11 sessions have no instructor named and each of those rows is
marked.

Every template has exactly one delivery, **and that is a property of this drawing rather than a
finding about the business**: it draws one cohort, so a template can have at most one delivery in
it. The outline said as much in a paragraph over the rows until issue 94, which replaced the
sentence with the measurement that a module heading is never painted right of the rows it heads.

## Board

`#/board` renders `site/board.json`, which is generated from GitHub Issues. The board reflects
GitHub; GitHub is the source of truth. There is no drag and drop and nothing is written back.
If `board.json` is absent or malformed the view says so in one plain paragraph and the rest of
the page keeps working.

## Design tokens

The values at the top of `site/app.css` were transcribed and adapted from an open source UI
toolkit licensed under the Apache License, Version 2.0, and were renamed and modified. See the
comment header on that file. No affiliation with or endorsement by any third party is claimed,
and no third party name, mark or asset appears on the page.
