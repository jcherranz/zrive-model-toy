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

`build/safety_grep.py` is the gate. It scans the shipped files for the seller's surname, for
any real teacher name taken from the vault faculty register, for Notion identifiers and for
money-shaped strings, and fails unless the only money present is the declared invented set. It
runs against the local `site/` before a push and against the deployed files after one.

## Reading the diagram

Flow is left to right. Programme and employer on the left, instructors and session templates
next, cohort sessions in the centre, then the cohort, the students, and the enrolment to
agreement to charge chain, ending in a claim. Every edge carries its relationship verb on the
line, and the arrowhead points at the target of that verb. Edges are uniform hairlines: the
data is invented, so nothing is encoded in their weight.

Click a node to select it. The clicked node takes a solid fill, everything except its direct
neighbours dims, and a side panel lists its properties with a flag on each.

Object types shown, one instance at least of each: Programme, Company, Instructor, session
template, cohort session, Cohort, an aggregate students card, Enrolment, Agreement, Charge,
Claim.

## Layout

Coordinates are computed at build time in Python and shipped as data. The browser only draws.
The algorithm is a degenerate Sugiyama: columns fixed by object type, order within a column
from barycentre sweeps, Y relaxed towards the mean of each node's neighbours and then packed to
a minimum gap. Verb chips slide along their own edge until they find a slot clear of tiles,
labels and other chips.

## Layout of the repo

```
site/            what is deployed
  index.html     the shell
  app.css        design tokens and components
  app.js         drawing, selection, the panel
  graph.js       generated coordinates and properties, do not edit by hand
build/
  model.py       the 26 objects, their properties and the 32 edges
  build_layout.py  computes coordinates, writes site/graph.js
  safety_grep.py   the forbidden content gate
```

## Regenerating

```bash
python3 build/build_layout.py     # rewrites site/graph.js
python3 build/safety_grep.py site # must print VERDICT: clean
python3 -m http.server -d site 8000
```

No framework, no build step for the site itself, no CDN, no web font, no external request of
any kind at runtime.

## Design tokens

The values at the top of `site/app.css` were transcribed and adapted from an open source UI
toolkit licensed under the Apache License, Version 2.0, and were renamed and modified. See the
comment header on that file. No affiliation with or endorsement by any third party is claimed,
and no third party name, mark or asset appears on the page.
