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

Two gates enforce that, one local and one in CI.

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
neighbours dims, and a side panel lists its properties with a flag on each.

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
  model.py       the 26 objects, their properties and the 32 edges
  build_layout.py    computes coordinates, writes site/graph.js
  safety_grep.py     the local forbidden content gate
scripts/
  check_forbidden.sh      the CI gate, against deployed bytes
  forbidden_lib.sh        the folding and hashing rules, shared
  gen_forbidden_hashes.sh regenerates the hashed name list from the vault
  sync_board.mjs          GitHub Issues -> site/board.json
```

## How this repository is worked

| file | what it holds |
|---|---|
| `TPS.md` | the Toyota principles as they apply to this artefact, including the one rejected |
| `KAIZEN.md` | the improvement loop, the five standing defects, the reflection step |
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

No framework, no build step for the site itself, no CDN, no web font. The only request the
page makes at runtime is the same origin fetch of `board.json`.

## Feedback

The `feedback` button in the header opens a small popover: a note and a category. Submitting
opens a prefilled GitHub issue URL in a new tab. There is no POST, no token and no API call
from the page. The repository is private, so only someone already signed in with access can
file, and a prefilled URL needs no credential.

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
