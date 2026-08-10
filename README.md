# Zrive operating model, toy instance diagram

One screen. One programme, one cohort, twenty six named objects and the verbs that join them.
Live at https://jcherranz.github.io/zrive-model-toy/

## This is a toy and it carries invented values only

Nothing on this page is measured. Every property in the side panel is flagged `dummy` or
`estimated`, and the page says so above the diagram.

What is real: the company name Zrive, the programme name and code (Z-IB Investment Banking),
the six session titles, which are published on the company's own website, and the names of
firms, which are companies rather than individuals.

What is invented: every instructor name, the empresa colaboradora, every identifier, every
date, every count, and all three money figures. No real person is named. No figure comes from
the corpus.

Three gates enforce that: one local, and two in CI that ask different questions.

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
excused files, and an entry that stops matching fails the run rather than lingering.

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

Click a node to select it. The clicked node takes a solid fill, everything except its direct
neighbours dims, and a side panel lists its properties with a flag on each. Nothing is drawn
around it. A reader arriving by keyboard gets a frame on the node the tab is on, which a mouse
click does not raise, because where the keyboard is and what is selected are different
questions.

The drawing is one cohort and there is no route to any other view. A `2nd cohort` switch drew a
second one, 2Q26, off the same six session templates; it is removed. The page ships exactly one
coordinate set, `window.G`, and holds no state that could put it into another.

Object types shown, one instance at least of each: Programme, Company, Instructor, session
template, cohort session, Cohort, an aggregate students card, Enrolment, Agreement, Charge,
Claim.

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
  app.js         drawing, selection, the panel
  graph.js       generated coordinates and properties, do not edit by hand
  feedback.js    the feedback button
  board.js       the board view at #/board
  board.json     generated from GitHub Issues, read by board.js, do not edit by hand
build/
  model.py       the objects, their properties and the edges
  build_layout.py    computes every coordinate, writes site/graph.js
  measure_labels.py  measures every label in a real browser -> label_widths.json
  safety_grep.py     the local forbidden content gate
scripts/
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

## Regenerating

```bash
python3 build/build_layout.py     # rewrites site/graph.js
python3 build/safety_grep.py site # must print VERDICT: clean
python3 -m http.server -d site 8000
```

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
