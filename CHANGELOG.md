# Changelog

All notable changes to this repository. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Dates are ISO. Newest first.

An entry says what changed and points at where the reasoning lives: HANSEI.md for an incident,
KAIZEN.md for a general lesson, the commit message for the measurements. This file is the record
of what changed and when, and it is meant to be scannable.

## [Unreleased]

### Changed

- The contrast gate reads the palette by resolving a token, not by where in `site/app.css` it is
  written, #64. `surface_values()` used to split the file on `@media (prefers-color-scheme: dark)`
  and require exactly one `#rrggbb` on each side. #57 made `color-scheme` the switch and put both
  values in one `light-dark()`, which is zero on each side, and the gate refused to emit the
  palette at all: main went red and `check_repo.sh --self-test` fell from 50 to 49.
- **It was never a `light-dark()` problem.** Any dark rule spelling a plate hex breaks a
  positional count the same way, and a `[data-theme="dark"]` block naming it makes two after the
  split line. The question was wrong: the gate needs a token's value under each colour scheme,
  which is not a question about the file's layout.
- **The reader is scheme-aware and selector-blind.** It collects every declaration of the token,
  tags each with the schemes its enclosing block can apply under, expands `light-dark()` and
  `var()`, lets a scheme-scoped rule beat a scheme-neutral one, and requires the winners to agree.
  A browser was rejected as the answer: `measure_labels.py` drives Chrome by hand and commits its
  output precisely so the build never opens one, and this runs inside `check_repo.sh` on every
  pass. No new dependency.
- **The refusals are the point.** No declaration reaching a scheme, winners that disagree, a value
  that is not a hex or a pair or a `var()`, a `var()` chain closing on itself, a `not
  (prefers-color-scheme: dark)` query, a selector claiming both attributes, an unclosed block:
  each names the token and the scheme and stops the gate at exit 2. The failure it replaced was
  honest and was not traded for a quiet one.
- `python3 build/model.py --palette-self-test`, 22 probes against synthetic stylesheets, folded
  into `check_repo.sh --self-test`, which goes 50 to 73. Ten prove a value is a fact about the
  token and not about where it sits, twelve prove a refusal.
- **The two workaround tokens are gone.** `--bg-app-dark` and `--bg-panel-dark` existed only to be
  counted by a regex; `--bg-app` and `--bg-panel` are `light-dark()` pairs like their fifteen
  neighbours, and the two theme rules carry `--elev-1` alone. The same two tokens written five
  ways, including all three the stylesheet could honestly use, produce the identical 26
  measurements, 1 declared and 0 undeclared. Four screenshots, two routes by two themes, are byte
  identical before and after, and the reader's own choice still wins over the operating system in
  both directions.
- The panel's type caption is text and no longer takes the stroke's token, #69. It was
  `#ptype.style.color = typeColor(n.type)`, so one hex answered both the 3:1 SC 1.4.11 asks of a
  drawn boundary and the 4.5:1 SC 1.4.3 asks of 11px bold text, and the stricter bar decided the
  palette: #56 and #65 both aimed at 4,5 rather than at the gate's own 3,0 for this reason, and
  #65 recorded afterwards that decoupling here would have made two of its darkenings unnecessary.
- **The caption takes `--fg-muted`, which every other caption in the panel already takes.**
  5,4113 on the panel in light and 6,8297 in dark, so all thirteen clear 4.5 in both themes by
  construction rather than by thirteen figures that have to be rechecked whenever one moves.
  Before: three under 4.5 in light, the ghost grey at 2,8807, Session template at 3,1440 and
  Cohort at 3,1826, of which the last two passed the gate and so were invisible to every check.
- **The colour is not discarded, it is moved onto a shape.** A nine pixel swatch beside the
  caption, drawn from the tile's own two values at the same strengths, so it is the tile made
  small. It is a graphical object and answers 3:1, which is the bar the palette was chosen
  against. Selecting a node repaints its tile `--i-primary`, so the one tile the panel is about is
  the one tile not showing its type colour: the swatch is what carries the identity at that moment.
- **The ghost's quiet is in the drawing and stays there.** No hex moved, so `--c-gray-3` still
  paints every edge and arrowhead at the value nine `app.css` rules read. Its swatch is its tile,
  a seven per cent wash inside a dashed hairline where every other swatch is at fourteen inside a
  solid one, the quietest of the thirteen. Its caption, which was the least legible text in the
  panel, is now the same grey as every other caption.
- **`render.js` no longer exports `typeColor` at all**, which is the repair rather than a note
  asking the caller to be careful: the panel is handed a fill and a stroke for a box and no
  expression it could paint a word with. Re-introducing the defect would take an export and an
  argument for it, which is the argument that never happened the first time.
- Stroke measurements did not move: the gate's 26-measurement table is byte identical before and
  after, 1 declared and 0 undeclared, and the declared ghost exception still reads 2,8807.
  Whether the palette can now be relaxed back toward 3,0 is #74 and not this card. `app.css` and
  `build/model.py` were not touched, and **`scripts/smoke.mjs` was not touched**, 70 assertions,
  70 passed, none edited. Fifth structural change it has survived untouched.
- Every value says where it came from and when it was read, #60 seam 5, #73. The scheme is the
  Z-Map's, not one invented here: a rank per value, a read date per value, and `status` and `apto`
  computed by every reader and written down nowhere. `build/model.py` ranks each row, the
  vocabularies and the clock ship in `site/instance.js` beside #72's registry, and `selection.js`
  puts one muted line at the foot of the panel.
- **The document was not uniform, which is the finding.** 2157 values, and 992 of them, the four
  registry rows on each of 248 nodes, were read off the ontology analysis they each cite. The
  other 1165 were made up. Those two populations had rendered identically since day one. The four
  are `3_observed` and undated, because #72's registry says on all seventeen classes that no
  system here has ever been reached and this repository does not record when the analysis was
  read; a plausible date would compute to `fresh` and make an undated finding read as current.
  Undated computes to `unread`, and **0 of 2157 values are fit to act on**, which is the honest
  answer rather than a failure.
- **Being invented is a provenance state**, `0_invented`, a rank below the Z-Map's three because
  no Z-Map row is invented and it never needed one. An invented value carries no read date and
  the build refuses one written onto it.
- **The gate refuses a document that mixes states, in both directions.** A document declares one
  stance: an `invented` one may carry no value computing to apto, a `live` one may carry no
  invented value. Copied at the Z-Map's own level, which is the document and not the row: its map
  keeps every stale row and refuses the export. Eleven rules in `check_provenance()`, run from
  `build/build_layout.py` on whatever document is being laid out, so a private deployment's own
  document meets the same gate. The sharpest asks #72's registry, in the same document, whether
  anything has ever reached the system a value claims to have been read from.
- `python3 build/model.py --provenance-self-test`, 20 probes, wired into `verify.sh` and
  `build.yml`. Two controls first, since a probe proves nothing unless its control is known to
  clear the same gate. Seven more refusals were demonstrated against the real build.
- **One departure from the Z-Map, argued.** Its windows are multiplied by seniority because
  juniors churn fastest, which is a measurement. Nothing here has measured how fast anything goes
  out of date, so one window is declared for every class rather than seven invented multipliers.
  120 and 240 days are the Z-Map's own.
- Nothing else moved: 85 `no system holds it` marks across seven views before and after, node
  counts unchanged on all seven, the seven layout digests are the only geometry bytes that
  differ, and **`scripts/smoke.mjs` was not touched**, 70 assertions, 70 passed, none edited.
  Third structural change it has survived untouched.
- `site/app.js` is five files, #60 seam 2, #71. 1673 lines and four concerns became `render.js`,
  the drawing painted from geometry; `viewport.js`, pan, zoom and fit, which is three numbers;
  `selection.js`, what is picked, what that dims and what it reveals; `router.js`, the addresses
  and the two views an address switches between; and `app.js`, which joins the two generated
  documents, builds the other four, wires them, owns the theme and the ghosts toggle, and
  publishes `window.ZT`. Each boundary is one the record already shows being edited alone: #46
  built the whole viewport and touched nothing else, #45, #48 and #51 each changed only the
  selection, #32, #41, #56 and #57 each changed only the drawing, and #51 and #66 each added a
  route with the view it opens.
- **Load order is handled by making it not matter.** No bundler, no build step and the page has to
  work from a `file://` URL, so the four are ordinary `<script>` tags. Each DEFINES one factory on
  `window.ZM` and EXECUTES NOTHING, so their order among themselves is irrelevant; `app.js` is the
  only one that runs anything, must come last, and throws by name if a factory is missing rather
  than half drawing the page. Verified from disk as well as from a server.
- **No boundary was drawn between the student list and the addresses.** The list is a view reached
  by an address, exactly as the drawing is, and #51 filed and built both halves as one thing, so
  splitting them would put one card's work in two files and buy nothing. It is in `router.js`. The
  theme is the other boundary declined: it has been edited alone twice, #55 and #57, but it is
  sixty lines that belong to the page rather than to any view, so it stays in the wiring file with
  the reason written there.
- `window.ZT` and `window.ZMT` did not change shape, `index.html` gained four script tags and no
  markup, `app.css` was not touched, and **`scripts/smoke.mjs` was not touched either**: 70
  assertions, 70 passed, locally and against the origin, with none edited. Second time that
  instruction has been paid for, after seam 1. Nine states were screenshotted from the tree before
  and the tree after at 1536x839, and eight are pixel for pixel identical; the ninth is the board,
  differing only in its own live "updated Ns ago" counter.
- The data and the geometry are two documents, #60 seam 1. `site/graph.js` is gone and the page
  loads `site/instance.js`, what the objects are, and `site/layout.js`, where they go. The reason
  is on the card and it is not tidiness: the published page is public, so real data can never go
  on it, and one codebase serves the public toy and a private management tool only if the data
  document loads separately from the page. `build/build_layout.py` writes the instance document,
  **reads it back off disk** and lays out what came back, so the geometry never sees the model and
  the purity of that function is a fact about the pipeline rather than a claim about it. A
  `--instance` flag lays out any other document with the same shape.
  **Demonstrated rather than asserted:** a 16 node document about a made up widget inspection
  course was laid out and served to `index.html`, `app.css` and `app.js` byte for byte as
  committed, and the page drew it, header, lane captions, reveals, counts and all.
  The split is gated in both directions: a geometry key in the instance document stops the build,
  and a value in the laid out nodes or edges that is not a number, a boolean, a list of numbers,
  an id or a cubic path stops it too. A label appears in the layout only as the word counts its
  lines were broken at, and the build proves those counts rebuild its own lines before writing
  them, so no name on the page exists in two files. Measured on the emitted bytes: 505 distinct
  strings in `layout.js`, 238 of them node ids and the rest paths, digests and the layout's own
  lane captions, and not one value of any object.
- Geometry left `build/model.py` entirely, #60 seam 1. The column a type is drawn in, the visit
  host's column and the four ghosts' columns were all written beside the data; they are now
  derived in the layout, the host from its own `hosts visit` verb and each ghost from the lane of
  the class it would attach to, which is the pattern the students reveal already used. All seven
  views build at exactly the extents they had before, which is what makes the derivation checkable
  rather than plausible.
- `scripts/check_build.sh` and `scripts/verify.sh` check both documents, and `scripts/smoke.mjs`
  did not change at all. #58 was told to assert what the page presents and never the shape of the
  blob; the split landed and all 70 assertions passed without one being edited, which is the
  first time that instruction has been paid for.

### Added

- The populate routes are a machine-readable adapter registry, #60 seam 3, #72. #4 recorded, for
  every object type, which system holds the record, who enters it and on what event, as four
  strings a person reads. Every one of those sentences is still here, verbatim, and still the
  first four rows of every panel: the props, marks, identity, edges and roster of all 248 objects
  are byte identical to the previous document, compared node by node. What is new is that each
  sentence is now the display side of a declaration carrying machine fields beside it, in
  `site/instance.js` under `routes`, keyed by class: which `system`, what one row is (`unit`), how
  the rows are split (`partition`), what identifies one (`key`), who enters it and on what
  `event`, whether the system can be `read` at all today, and whether an `adapter` exists. Every
  node carries `class`, which is the join back. The seven vocabularies ship with it, 34 tokens
  each with its meaning, so a reader of the bytes needs no Python and a token in no vocabulary
  stops the build. 11810 bytes of registry on a document that grew from 276899 to 294455, written
  without a thousands separator because the safety gates read a dot grouped figure as money.
- **`read` is the question #4 never asked and it is the one that decides whether the rest is
  actionable.** Its honest answer on all seventeen classes is that nothing here has ever read
  anything: `no-source` on the nine, `not-attempted` on the eight, where `not-attempted` says a
  system holds the rows and there is no adapter, no credential held and no record of whether it
  could be read. `readable` and `refused` are declared so the field can move and the build refuses
  an entry that claims either, because nothing in this repository could have demonstrated it. No
  adapter was written and nothing was connected to anything; every value on the page stays
  invented.
- **"No adapter is possible here" is a state and not an empty field**, which is the whole of what
  #4 bought and the thing a management tool built on this must not lose. The nine unhoused classes
  carry `adapter.status` `impossible` with `blocked_by` naming one of nine absence tokens, so the
  reason is machine readable and different per class rather than a shared blank:
  `contested-enumerations` for Programme, `value-not-a-row` for Company as employer,
  `copy-not-a-template` for Session template, `intersection-only` for Cohort, `file-not-a-row` for
  Agreement, and one each for the four ghosts, which stop sharing anything but the type at exactly
  that field. Six of the eight real routes carry caveats an adapter cannot write its way out of,
  four of them #4's own partials. Not one of the eight names a key: `key.status` is
  `not-recorded` on all of them and seam 4's minted `source_key` is what stands in, said in the
  registry rather than left to be noticed.
- **The route is per class**, established rather than assumed: seventeen classes drawn as thirteen
  types, Company being one type doing two jobs and Ghost one type standing for four. Per type is
  too coarse and per object too fine, and the old shape proved the second by having to copy four
  strings and a system name across seven route prefixes; that loop now copies one word, a binding
  and not a route. Per view never applied. Where it disagrees with seam 4 both are right: identity
  is per object, because a route names a class of rows and a key names a row in it.
  `SOURCE_SYSTEM` is gone, folded into the registry, and with it the two refusals that used to
  hold it level with the route: there is nowhere left to write the disagreement down.
- The mark is unmoved and now one step further from anything typed: 85 marked tiles across the
  seven views before and after, on the same tiles, derived from `attachable` rather than from the
  flag on a row that is itself derived from the same field. Seam 1's two-way gate was extended to
  the new block, so geometry in a registry entry stops the build like geometry anywhere else in
  the instance document.
- `scripts/routes.py` is the proof that the registry is machine readable, and it is deliberately
  not an adapter: it reads `site/instance.js`, the bytes the page loads, imports nothing from
  `build/`, opens no socket and knows the name of no system it does not read out of the file. It
  prints every class, which are attachable and which are not and why, how many objects each
  governs, and refuses if any class is declared and drawn nowhere or any object names a class the
  document does not declare. **8 attachable, 9 not, 17 in all, 248 objects all bound, 0 adapters
  implemented and 0 systems read.** Nine negative controls were run against the new refusals, each
  producing its own message, with the unmodified build as the positive control.
- Every object carries a source system and a source key, both nullable, #60 seam 4. A drawing id
  joins a tile to an edge and means nothing outside this repository; a management tool joins on
  the key the holding system uses, so the two are now different columns and the second exists
  while the data is still invented, because retrofitting identity after the adapters exist means
  touching every adapter. 248 objects on the seven routes, 135 keyed and **113 null**: every
  Programme, every Company that only employs, every SessionTemplate, every Agreement, all 28
  ghosts and **every Cohort**, which is the finding the drawing already marks, since a cohort
  exists as a thing and no identifier for it is held anywhere. No key is invented to fill that
  column. Which objects are null is derived from `route_system` exactly as the mark is, and the
  build refuses both ways round: a type whose route names a system and has no entry in
  `SOURCE_SYSTEM` stops it, and an entry for a type whose route says nothing holds it stops it
  too. The visit host is the case that pays for the per id override, one Company type with a
  Notion page where the five employers have no record anywhere. Keys are invented and deliberately
  do not imitate the vendors' formats, since a string shaped like a real Stripe charge id on a
  public page invites being read as one. The drawn Student tile and its roster row are seeded on
  the person, so `s1` and `STU-0001` carry one key under two drawing ids and the build refuses if
  they ever diverge; a key naming two objects is refused as well, because a join on it would
  merge them silently. The name gate hashes both new fields on every node and every roster row.
- A route per programme, `#/p/<CODE>`, so the seven drawings are reachable, #66. #43 built them
  and `site/app.js` named `window.GV` zero times, so six of the seven had been rendered by nothing
  but a verification harness. The address is resolved before the first `draw()`, which is what
  makes a followed link draw its own programme once instead of drawing Investment Banking and
  replacing it; the code is matched with case and punctuation removed, so `ZCFA`, `Z-CFA` and
  `z-cfa` are one view; `#/` is unchanged and still Investment Banking; and an address that begins
  `#/p/` and names nothing falls back to the default rather than drawing nothing. `#/students` and
  `#/board` say nothing about the programme and therefore leave it alone, so the student list over
  Z-CFA is the Z-CFA cohort and coming back from the board returns to the drawing the reader left.
- The control is the programme's own name in the subtitle, and it costs the header no row, #66.
  That sentence was already the statement of what is on screen, which seven near identical
  drawings need more and not less, so the words became the button: one `.linkbtn` whose text is
  its state, exactly the idiom of `theme: system` and `feedback: on`, opening the other six as
  ordinary links to their own addresses. No item was added to the nav, which is the row #32
  reclaimed and #57 protected and the thing that wraps at 390px; measured, the header is the same
  height with the list open as closed. The cohort in the subtitle, the two counts in the footer,
  the student list's heading, the tab title and the svg's accessible name all follow the view,
  because a number typed into `index.html` is a number that is right on one of the seven.
- Six more programmes, so there are seven, #43. Z-SC Strategy Consulting, Z-BL Big Law, Z-PE
  Private Equity, Z-HR Human Resources, Z-DS Applied Data Science and Z-CFA CFA preparation, each
  laid out as its own drawing from the real syllabi in the vault. All seven are built by the same
  three functions out of the same fields, which is the test rather than the decoration: if
  Programme were an assumption baked into the drawing, the second instance would have needed a
  second code path and none of the six does. Programme names, codes, session titles and firm names
  are real and verbatim, including a leading space on one Z-SC title and a double space in one
  Z-HR title; every person, identifier, date, duration, count, state and amount is invented and the
  name gate hashes every string all seven ship. The routing is deliberately not here: `window.G` is
  the Investment Banking view exactly as before and the other six sit beside it in the same file,
  laid out, measured and gated, so wiring `#/p/<CODE>` is mechanical when `site/app.js` is free.
- Five shapes the model always allowed and one instance could never show, #43. An Instructor is now
  shared across routes, three of the twenty seven, one of them across three programmes, which
  mirrors the real corpus one for one, three of sixty four teachers. A Company employs more than
  one Instructor, so `instructors_supplied` finally reads something other than 1 and two
  `employed by` edges converge on one tile. An Instructor has no employer at all, four of them,
  matching the 17 of 64 real teachers whose session link carries no firm. A CohortSession has no
  teacher, ten of the forty two drawn, flagged `absent` with the `teaches` edge simply missing,
  against 100 of 260 in the corpus. And a whole lane is empty: Z-CFA has no instructor property
  anywhere in its source, no employer and no visit host, and none of the three is invented to fill
  a lane.
- The lane captions are a per view argument to `layout()`, #43. Three of the six are claims that
  are false on a view holding no employer, no instructor or no visit host, and a false caption is
  worse than a missing one because a reader has no way to catch it. The alternates are chosen from
  what a view actually holds and never from its code, so the next programme with no visit host
  inherits the right caption by existing rather than by being added to a list. The column grouping
  stays a module constant and `layout()` refuses a caption set that regroups it, because `COLX`,
  `W` and `BAND_X` are computed from the grouping at import and baked into every coordinate. The
  first draft of the empty-instructor caption read "none recorded for this programme"; the lane
  overflow gate refused the build by 51,5px, the gate was right, and it reads "none recorded".

### Changed

- A route change refits the view, #66. The seven drawings are 576 to 610 units tall with
  different node sets and one of them missing a whole lane, so a reader zoomed into the agreement
  lane of Z-IB and moved to Z-CFA would have landed on a rectangle chosen by arithmetic rather
  than by meaning. Two further reasons: the zoom readout is a percentage of the fit, so carrying
  the scale across a change of extent silently changes what the number means, and a refit makes a
  followed link and a clicked control produce the same screen, which is what lets an address be
  pasted and mean something. It refits through the flag a first paint uses rather than by calling
  `fit()` on the spot, because a change arriving from `#/board` reaches this file while the canvas
  is still `display: none` and a fit taken then would frame a box of nothing.
- The browser pin stays the runner image, decided rather than left inherited, #67. The runner drove
  Chrome 151 on the dispatch that failed to start one and Chrome 150 on the rerun of the identical
  commit, which is #58's own caveat coming true: `runs-on: ubuntu-24.04` pins the image and not the
  build, and the build moved underneath the suite inside a day. Kept, for three reasons. The
  version is not what failed, since neither build failed an assertion and each gave 70 of 70 on the
  runs where it started; what failed was the launch, which the retry and the count assertion now
  cover. A pinned Chrome for Testing download is a third-party binary fetched on every run and
  needs a pinned URL and a recorded checksum to be worth anything, which is a supply-chain surface
  this repository does not have and a pin that rots into a browser nobody uses. And the suite is a
  regression net for the page rather than a conformance test against one browser: a behaviour that
  breaks on the Chrome the runner ships is a behaviour that breaks for readers, and a frozen build
  would report clean on exactly that. What is added is the diagnosis cost the caveat actually
  carried, the version written into the job summary as well as the log, so a failed run can be
  correlated with a browser change from the run list. Reversing it is one step and the workflow
  names it.
- A label is re-broken at the selected weight when the regular break leaves the lane, #43. Lines
  were broken to fit the column in the weight they are drawn in and then reserved at the BOLD width
  of the same line, which is up to a fifth wider, and the two rules disagree by more than the 13
  units of pad a lane has either side of its column. The shipped Z-IB title was inside it by 4,7
  units, which is luck and not a margin, and `The investment process in corporate private equity
  (I)` on Z-PE was outside it by 0,6 and stopped the build. Wrapping everything at the bold weight
  fixes it and costs every long label on every route a line it does not need: measured, the seven
  views go to 588, 634, 610, 634, 610, 599 and 576. So the bold weight is used only where the
  regular one actually produced a box the lane cannot hold, which leaves every label that fits
  exactly as it was and re-breaks the one that does not. Exactly one label on the seven routes
  takes that path and the build names it.
- The seven views do not all land at 1230x586, and the research card's prediction that they would
  was wrong in a way worth writing down. Measured: Z-IB 586, Z-SC 610, Z-BL 588, Z-PE 610, Z-HR
  610, Z-DS 586, Z-CFA 576. The card assumed the cohort sessions lane binds on six of the seven,
  which held while every session template label fitted one line. Z-IB's six real titles do; the
  other programmes' do not, because a real syllabus title runs to seventy characters and wraps to
  two, and a template tile carries a mark under its label as well, so the templates lane overtakes
  the sessions lane on four routes. Every view is still inside the 650 the layout's own docstring
  targets and inside one 1440x900 viewport, and Z-CFA lands at exactly the 576 the card predicted,
  for exactly the reason it gave. Nothing was tuned to make the numbers agree.
- `build/label_widths.json` is 2733 strings across seven contexts, up from 466, and the build
  reports 1500 measured widths and 0 estimated, #43. Measured in the same browser and the same
  envelope as before. Without it every new title would be laid out from the hand written per
  character estimate, which on this model undershoots by up to 21,8 per cent at the weight a
  selected label is drawn.
- The six new cohorts are recombined rather than invented again, #43. Six rosters is a hundred and
  thirty more chances to write down somebody real, and the first draft of the original thirty four
  did exactly that thirteen times over. So the given names and the surnames of the existing roster
  are split apart and recombined at a per cohort offset that is never zero, which makes people who
  are new, whose every token has already been through the name gate, and no one of whom can be an
  original pairing. The university, the year and the charge state travel with the given name, so
  each cohort's distribution is the original's rather than a second thing to invent.

### Fixed

- The freshness watchdog asked the run whether the deploy had finished, and a frozen run record
  would have made it pass on a stale origin, #68. Twice on 2026-08-11 a run's record sat
  `in_progress` while its job read `completed/success`: `smoke` on ff37e65 for nine minutes against
  a 45 second baseline, and run 31508159376 for 25 minutes with `updated_at` frozen at creation
  plus three seconds. Neither held its concurrency group, so neither is #62's starved deployment;
  this is the opposite shape, the work finished and the record did not. `origin-freshness.yml`
  selected in-flight Pages runs on the run's own status, so a record like that is a deploy in
  flight for as long as it stays frozen, which sends the check down its `inflight` branch and makes
  it PASS while the origin is behind, and past the grace fails it with the wrong diagnosis, naming
  a finished run as holding the queue. It reads the jobs now. No jobs at all is still in flight,
  because that is #62's starved run exactly; a job not completed is in flight; a run whose every
  job has completed keeps the benefit of the grace for two minutes, since a record catching up a
  second later is ordinary and the seconds after a deploy job goes green are also the seconds a CDN
  may still be serving the previous bytes, and is only then dropped, with a warning naming it and
  the stale verdict listing it separately from anything in flight. Both observed records were
  frozen an order of magnitude past that threshold. A jobs read that fails counts the run as in
  flight, which can delay a red and cannot invent one. Proved against the real step text driven
  over fixtures: a record frozen three minutes with both jobs completed and a stale origin passes
  on the old code and fails on the new, while the in-flight, no-jobs, still-catching-up,
  jobs-read-failed and fresh cases all decide as before.
- `pages.yml`'s jam guard reported a frozen record as a deploy that had begun, #68. Its decision
  was already made from the jobs and does not move, so nothing is cancelled that was not cancelled
  before. A run whose every job is completed while its record still reads unfinished is now counted
  and named apart from the ones that are genuinely under way, because it is left alone for having
  nothing left to cancel rather than for running. The audit behind this card found no other
  run-level reading: nothing under `scripts/` asks whether a workflow finished, and `board.yml` and
  `issue-status.yml` dispatch without waiting on what they woke.
- A browser that never started was reported as the page having regressed, on a fifth of the suite,
  #67. One CI dispatch of `smoke` failed with `no DevToolsActivePort in 20000ms` and dbus errors,
  printed `VERDICT: the page has regressed` for a browser that never opened, and reported 14 of 14
  passing while the 1536x839 group that carries every behavioural assertion had not run at all. A
  rerun on the identical commit gave 70 of 70. Three repairs, in the order a run meets them. The
  launch gets one retry, and the failed process and its profile directory are killed and removed
  before it, so a retry cannot inherit the attempt that failed; the budget is one because the rerun
  started its browser first time, and a larger one turns a genuinely broken image into a slow
  failure rather than a fast one. The verdict has three values instead of two: exit 1 `the page has
  regressed` for a failed assertion, exit 0 clean, and exit 2 `the suite could not answer` for a
  browser that never started or a run short of its own intended count, which is the code
  `check_repo.sh` already uses for a gate saying it does not know and which `verify.sh` already
  prints as [SKIP] rather than [OK]. A failed assertion outranks a harness finding, so a run that
  loses a viewport and also finds a real regression reports the regression. And the suite writes
  down what it intends to assert, eight phases over three viewports, fourteen viewport-phase pairs
  summing to 70, checked against a headline figure before anything runs so that neither can be
  edited alone: this is `build/model.py`'s `#rows|N` terminator in another language, for the same
  reason, that everything a truncated run does hold looks exactly like a clean one. Proved in three
  directions with a launcher that refuses on demand: refusing once, the retry recovers and the run
  gives 70 of 70; refusing twice, the incident is reproduced exactly, 14 of 14 passing, exit 2,
  named as a harness failure; and skipping one phase fails on the count with 59 of 59 passing.
- Two type colours that had been under 3:1 on the white band plate since the palette was chosen,
  #65. Cohort session `#d1980b` measured 2.5587 and Students `#8eb125` 2.4805, both worse than
  anything the dark theme ever had, and #56 left them by construction: it added a dark sibling per
  type and moved no light colour at all. Repaired by that card's own arithmetic run the other way,
  hold the hue and the saturation and lower the lightness to the first value clearing 4.6. Cohort
  session goes to `#976e08` at 4.6156 and Students to `#657e1a` at 4.6127. The target is 4.5 and
  not the gate's 3.0 because the detail panel writes the same hex as an 11px bold type label,
  which is text, so one number fixes the drawn boundary and the label together. The old hexes are
  pinned as the dark siblings, so the dark page does not move and was measured rather than
  asserted: 0 differing pixels of 1288704 at 1536x839, against 12612 on the light page, all of
  them inside the cohort sessions column and the students card. The gate removed the two
  declarations itself. On the first run after the colours moved and before the table was touched
  it exited 1 with `[STALE] declared contrast exception is now unnecessary` against exactly those
  two and nothing else, and it now reads 26 measurements, 1 under the threshold, 1 declared, 0
  not.
- Student moved as well, which nothing asked for and one thing required, #65. It was at 4.7299 and
  passing. Student is by design Students one shade down in the same hue, and the shade a
  yellow-green has to reach to clear 4.5 against white is the shade Student was already on, so the
  repaired Students landed 3.25 from it as a CIE76 colour difference, which is the same colour, in
  a palette whose tightest other pair is 18.18. A gate satisfied by two type colours a reader
  cannot tell apart has been satisfied against its own stated reason for measuring a stroke, that
  an outline is what one type is told from another by. The family moved down together instead:
  Student `#5f7d1f` to `#526b1b`, 4.7299 to 6.0385, family gap back to 10.94, which is not a taste
  but the gap #56 already shipped between the same two on the dark plate. Its dark sibling
  `#789e27` is untouched, so this costs the dark page nothing either. Reversal is one hex, and the
  only thing that comes back is the collision.
- The ghost grey that was NOT repaired, and why, #65. It is the third light failure, at 2.8807,
  and it stays a declared exception, with the reason rewritten from a placeholder that said only
  that #56 had not touched it. Four findings decide it. `#8f99a8` is the light value of
  `--c-gray-3`, which `site/app.css` itself calls "the grey of a line" and which nine rules read
  directly, so every edge and every arrowhead on the page is already this hex at this ratio, none
  of those uses is a type colour and so none is measured here; moving the model's copy alone would
  outline a ghost darker than the dashed edge running into it. The value that would pass,
  `#6a7688`, sits 4.46 from Company `#5f6b7c`, so repairing the contrast would make a ghost read
  as a Company. The stroke carries no type-discrimination load, which is what this rule gates:
  there is one ghost type, and a dashed outline, a stroke-width of 1.1 against every other tile's
  1.25, an empty tile with no glyph and an italic `--fg-muted` label at 5.4113 all say so before
  colour does. And the quiet is the statement, since a ghost marks a class no system holds and its
  wash is 7 per cent where every real tile is at 14. The residual is stated rather than hidden:
  the panel's 11px label for this type stays at 2.8807 against a text threshold of 4.5, and it is
  one of three light labels under it, Session template at 3.1440 and Cohort at 3.1826 being the
  other two, which pass this gate because it asks 3:1 of a boundary. Filed as #69. The honest
  repair of the drawn grey, if it is ever wanted, is a `--line` token across those nine rules,
  which moves every edge on the page and is its own card with its own look.
- `hosts visit` ends on the Programme and no longer on the Cohort, #63. Counted across the 156
  company notes in the vault: 13 carry a visit and every one of them points at a Programme note, no
  note anywhere contains the string `cohort`, and the 30 key company schema has no cohort field, so
  the relation the drawing asserted cannot be expressed in the source at all. An edge terminating
  on the wrong object type is the one error this artefact cannot afford, because a reader has no
  way to catch it: it looks exactly as authoritative as the edges that are right. It cost 14 units
  of height on its own, 586 to 600, because `co_col` sits in column 3 and `prog` in column 0 and a
  span of 3 is the threshold at which an edge becomes an arc slung under the row it connects; the
  research card had priced that at up to 90 and recommended moving the host into column 0 instead,
  which is not an option at all, since both ends would then sit in the SAME column and this layout
  has no shape for that, falling through to the neighbour branch and drawing a loop between two
  tiles. Probed rather than reasoned. The 14 units come back in the next entry.
- The ghost that was NOT added, and why, #63. The card left one judgement open: whether to draw the
  cohort-to-visit relation nobody records as a fifth ghost. It is not drawn. Every ghost on this
  page is a CLASS the model needs and no system holds, and what is missing here is a RELATION
  between two classes that both exist and are both already on the page, so a fifth ghost would be
  the first that is not a class and would blur the vocabulary the other four rely on; it is also
  the same shape as the Attendance class the ghost block already declined, for the same reason. The
  finding is not lost. `co_col` carries it as a node note and as an `absent` property row,
  `cohort_that_attended: no system relates a cohort to a visit`, which is where a reader meets it.
  Reversal is one entry in `GHOST_SPEC` and one edge if it is ever wanted.

### Added

- A theme control in the header, system, light and dark, with system as the default, #57. One more
  `.linkbtn` at the head of `.hnav`, whose text is the state, which is the idiom `feedback: on (Esc
  to exit)` already uses; it cycles, because three states is the only honest set and a two-state
  switch has nowhere to put "whatever the machine says". Stored under `zmt.theme`, namespaced as
  `zmt.gh.token` is, and applied before the first paint by four inline lines in `index.html`,
  measured at 18,7ms against a first contentful paint at 52,0ms with `document.body` not yet in
  existence, so the reader who chose dark on a light machine never watches a white page turn over.
- The cascade, which is the whole of the card, #57. `color-scheme` is the switch and `light-dark()`
  reads it, so the palette is ONE `:root` block with both values on each line instead of a second
  copy of itself inside a media query, and there is no theme media query left in `app.css` at all.
  `color-scheme: light dark` when the reader has said nothing, pinned to `light` or `dark` by
  `:root[data-theme=...]` when they have. It answers in both directions for the same reason and
  with no third copy of anything, and it fixes what no rule in this repository can reach: the four
  scrollbars and the two native select menus follow the CHOICE now and not only the machine,
  because the property the choice sets is the property they read. The thirteen type colours moved
  to the same mechanism, `--type-<k>: light-dark(c, cDark)` in the generated stylesheet, so the
  tiles turn with the chrome rather than a frame later, and still with no JavaScript listening for
  anything. Checked on a real engine as #56 checked `color-mix`: `light-dark()` resolves in an SVG
  presentation attribute, through `var()`, and nested inside `color-mix()`, and the thirteen fills
  it produces are pixel for pixel the fills the media query produced in both schemes. Baseline
  2024.
- `window.ZT.theme()`, #57, reporting the choice, the attribute, what the machine says and what the
  page resolved to, for the same reason `view()` is there: an override is a claim a driver should
  read off the running page rather than infer from a screenshot.
- `--elev-1-dark`, and the one exception it records, #57. A shadow list is not a colour, so
  `light-dark()` cannot carry a dark form that moves the geometry as well as the colours, and this
  token keeps a media query and an attribute rule of its own, both pointing at a value that lives
  on `:root` where an attribute can reach it. The clever version was tried first and rejected on a
  measurement, not a preference: four stops with each scheme painting the other's soft shadow in
  `transparent` moved eight pixels by one 255th on the antialiased corners of the panel's
  `estimated` badges, at 1536x839 and again at 1440x900, because a stop painted in `transparent` is
  still a paint layer. Bisected one token at a time against the tree it replaced, after the same
  harness had been run twice over one tree to prove it repeatable.
- A stale origin announces itself, #62, which is the half of that card that mattered. On
  2026-08-11 `origin/main` carried a new palette and the deployed site did not, for 24 minutes, and
  nothing in the pipeline said so: `repo gate`, `smoke` and `build` were all green on that commit,
  and a green board over a stale origin reads exactly like a shipped change, so an agent verifying
  against the origin measured the previous build and looked stalled while behaving correctly.
  `.github/workflows/origin-freshness.yml` fetches `version.js` from the published site, the deploy
  stamp #47 built for this class of question, and compares it with main's head. Every path names
  both shas, including the passing ones. A different pair is not automatically a failure, because a
  deploy legitimately in flight makes them differ for a minute or two: the verdict is fresh when
  they agree, in flight while an unfinished Pages run is younger than the grace, and stale
  otherwise, where stale with nothing in flight says so separately because nothing is coming to fix
  it. The grace is 10 minutes, `actions/deploy-pages`' own default timeout, so the check loses
  patience no sooner than the deploy loses its; against the incident it would have fired at minute
  10 of 24. It runs on a 15 minute schedule and on dispatch, and an unreadable API exits 2 with a
  message saying the check did not run, which is not the same finding as a stale origin and must
  not read as one.
- Its own workflow rather than an extension of `scripts/check_forbidden.sh`, #62, on a structural
  argument and not a stylistic one. That gate runs inside `pages.yml` after the deploy, and the
  failure here is a deploy that never ran: a check that only runs when a deploy runs cannot report
  a deploy that did not, and in the incident it did not run once in 24 minutes. It also asks a
  fourth question, in the sense the repository already uses to keep workflows apart, so repo-gate
  red means a name or a figure is committed, smoke red means the page has regressed, build red
  means the drawing is not what its own builder produces, and freshness red means the origin is
  behind main. And it stays out of the deploy path, which `pages.yml`, `smoke.yml` and `build.yml`
  have each already decided for themselves.
- Superseded Pages runs are cancelled before they can jam the queue, #62, the residual #39 named
  and declined to fix until it recurred. A `supersede` job in `pages.yml`, in no concurrency group,
  cancels older runs of the same workflow that have not begun publishing. It cancels almost
  nothing: the rule is the strictest the evidence supports, that a run is cancellable only if no
  job of it has started a single step, read twice over from the same payload because a run held at
  the run level has no jobs at all while a job admitted and starved of a runner has a job and zero
  steps. A run that has started is left alone, which costs at most one redundant publish and can
  never publish the wrong thing, because the deploy job checks out `ref: main` rather than its
  triggering sha and so publishes whatever main holds when it runs. It carries a byte-identical
  copy of the deploy job's loop guard, without which a board-bot push whose skip marker had been
  dropped would cancel a legitimate deploy and then skip its own, publishing nothing.
- The first version of that rule cancelled nothing at all, and only a real run said so, #62. It
  counted every job in the candidate run, and the supersede job is a job in that run and is always
  running, so every candidate read as started: `superseded 0 older run(s); left 4 alone` against
  four runs whose deploy jobs had zero steps between them. The reasoning had not found it and the
  local dry run could not, because the dry run was reading historical payloads from before this job
  existed. The repair excludes the supersede job by name rather than selecting the deploy job by
  name, which is not the same choice: excluding fails safe in both directions, since renaming the
  deploy job still counts it and renaming or removing the supersede job makes every run read as
  started and be left alone, while selecting `deploy` by name would, if that job were ever renamed,
  match nothing and declare every run cancellable.
- And the repair to that was wrong too, in the same direction, and again only a real run said so,
  #62. It listed `queued` and `waiting` as the statuses that mean a job has not started, and a job
  held by a job-level concurrency group reports neither: it reports `pending`. So a run whose
  deploy job had run zero steps still read as started. A list of the ways a job can be waiting is a
  list the next status GitHub adds makes wrong, so the check now names the two that mean work
  happened, `in_progress` and `completed`, and leans on the zero-steps reading beside it to cover
  any status nobody here has seen, because a job that has begun has steps whatever it is called.
  Both readings have to say not started. Two defects in one guard, neither found by reading it and
  both found by watching it run, is the card's own instruction working: an argument is not evidence
  about this queue.
- What makes a cancellation safe, established from the deployment record rather than argued, #62.
  The deploy job targets the `github-pages` environment, so GitHub opens a deployment the moment
  the job is admitted and before any step runs. In both jams the starved head-of-queue job sat with
  zero steps while its deployment carried an empty status history, where the deployment that
  actually published went `waiting`, `queued`, `in_progress`, `success`. A deployment with no
  status has never been handed to the Pages build and publish pipeline; cancelling it writes one
  `error` status, releases the environment and changes nothing the origin serves. Observed twice,
  each time followed by the head publishing within a minute and the smoke suite green against the
  freshly deployed origin. Recorded against a hope that turned out to be false: `actions/deploy-pages`
  v5.0.0 declares no `post` step, so it does not cancel its own deployment when a job is cancelled,
  and nothing may be assumed about cancelling a run that is mid-publish. Hence the strict rule.
- CI runs the build, #61. Nothing in this repository ever did. `site/graph.js` was committed and
  deployed exactly as it sat in the tree, so two guarantees the repository believed it had were
  held by habit alone: reproducibility, asserted on every card for two days and checked only by
  whoever remembered to run the builder, and measurement, since the contrast gate reads the palette
  out of `build/model.py` while the page draws from `site/graph.js`, so a colour typed into the
  drawing would be measured by nobody and would ship. The same hole covered the name gate, which
  hashes every shipped string at build time and therefore never meets a name pasted straight into
  the drawing. `scripts/verify.sh` had carried the local half of this since #58; no workflow had.
  `scripts/check_build.sh` deletes `site/graph.js`, runs the real builder, compares byte for byte
  and puts the file back whatever happens. Deleting first is the poka-yoke: a build that writes
  nothing is otherwise indistinguishable from a build that writes the same bytes, and the check
  would report clean about a run that produced nothing. The refusal names the file, prints both
  digests, the offset of the first differing byte and the text either side of it, and says the fix
  is to run the builder and commit its output rather than to edit the drawing.
- `build/label_widths.json` is covered by coverage and deliberately not by a byte diff, #61. It is
  generated, but by `build/measure_labels.py` and not by the builder, and it is not reproducible
  off the machine that wrote it: measured in a real browser, each value the widest that string
  takes across every font family that machine can resolve, with the engine and the resolvable
  envelope recorded in the file itself. A runner holds a different font set, so a byte diff would
  go red on a correct table and light the andon for something that is not a defect. What is
  checkable everywhere, and what actually goes wrong, is coverage: a string the layout measures
  that the table does not hold is laid out from the old hand written estimate, wrong by up to a
  fifth at the weight a selected label is drawn, and the wrong width is then baked into the shipped
  coordinates. The set that must be covered is asked of `measure_labels.py`'s own `collect()`, the
  function the measuring tool uses, so the two cannot drift; it opens no browser. A string in the
  table that no context asks for is reported and is not a failure, being dead weight rather than a
  wrong coordinate.
- Proved failing before it was believed, #61. `scripts/check_build.sh --self-test`, 12 cases, run
  in CI ahead of the check itself: identical bytes reported clean, a one byte difference refused,
  an empty rebuild refused rather than read as a small drawing, and the refusal shown to name the
  file and to carry both halves of the remedy; then the committed table reported as covering the
  layout, a table with one measured string removed refused, and an empty and an unreadable table
  aborting instead of reporting clean. Separately, one hex digit of a type colour was hand edited
  into `site/graph.js` in a scratch worktree, and the check named the byte and printed the
  committed and the rebuilt text either side of it.
- `.github/workflows/build.yml`, its own workflow and not a step in `repo-gate.yml`, #61, which is
  the argument #58 already made for the smoke suite: the repository gate answers a git and bash
  question in seconds and this one runs Python, and the three questions stay separable so that
  repo-gate red means a name or a figure is committed, smoke red means the page has regressed and
  build red means the drawing is not what its own builder produces. Not a step in `board.yml`
  either, which is the one place a check can genuinely be needed twice, because the builder neither
  reads nor writes `site/board.json`: established by running it on a clean tree and reading what
  moved, its inputs are `build/model.py`, `build/label_widths.json`, `site/app.css` and the name
  gate's rules under `scripts/`, and its only tracked output is `site/graph.js`. A board sync
  therefore cannot change what this check reads, cannot turn it red, and cannot loop with it: the
  board commit carries the skip marker so it raises no run at all, and this job takes
  `contents: read`, writes nothing back and pushes nothing. No paths filter, for the reason the
  skip marker is already enough and a filter is a second and quieter reason for a check not to run.
  Its own concurrency group with `queue: max`, outside the deploy path, no third-party action
  beyond the checkout and that pinned to a full commit sha, and no `setup-python`, since every
  module the build imports is in the standard library.
- The tree the check was added to passes it, #61. `origin/main` rebuilds `site/graph.js` byte for
  byte, twice, and the width table covers all 466 strings across seven contexts with none spare.
  The finding this card was filed for is the missing workflow and not a stale drawing.
- A regression net, #58. `scripts/smoke.mjs`, 70 assertions over three viewports, driving Chrome
  through the DevTools Protocol on Node 22's own WebSocket: no framework, no dependency, no build
  step, nothing added to `site/`. Ten substantive changes landed on 2026-08-10 and 11, each
  verified by hand in a headless browser, and every one of those verifications was thrown away
  with the session; the invariants survived only as prose on closed cards, which is not a place a
  regression can be caught. Covered: six Company nodes of which five are hidden employers and the
  sixth, which employs nobody, stays painted, #48 and #49; each instructor revealing its own
  employer and nothing else, and a clear hiding all five, by Escape and by a click on the canvas,
  which are two different listeners; the students card, its marker and the `#/students` roster
  agreeing on the cohort size and on how many of it the drawing left out, #51; the anchored zoom
  holding the point under the cursor to 0.0014px across a four step wheel gesture where the
  tolerance is 0.5px, and a click at 0px and at 2px selecting where a 40px drag pans and selects
  nothing, #46; capture mode filing nothing on a pan and producing the element descriptor issue 45
  was filed with, byte for byte; the board's four columns, the Done cap and the closed arithmetic;
  and at 1536x839, 1440x900 and 390x844, no sideways scroll on any of the three routes and no
  console error beyond the favicon 404. It reports every failure rather than the first, and each
  one names what was expected, what was found and at which viewport.
- The suite is robust to the harness rather than to the page, and each measure is bought, #58.
  A profile directory created per run with the debug port at 0 and read back out of that
  directory, so a stale browser cannot answer; a readiness condition the page itself answers,
  `window.ZT` published plus a painted node plus a measured canvas box, rather than a screenshot
  or a sleep, which is HANSEI.md `2026-08-09-screenshot-before-javascript`; and
  `document.elementFromPoint` in front of every synthetic click, which is
  KAIZEN.md `kaizen-a-widened-control-keeps-its-neighbours-reachable`, since a dispatched click
  that lands on nothing is indistinguishable from a control that does nothing. Every viewport
  prints requested beside actual and by which mechanism: 390x844 is emulated because the window
  floor is 500px, and the two wide ones are real windows corrected by measurement, since
  `--window-size` is the outer window and headless Chrome keeps 143px of it.
- Proved failing before it was believed, #58. Seven invariants were broken one at a time in a
  scratch copy and the suite caught each: the reveal rule rekeyed on the type Company, which is
  the regression app.js's own comment warns of, 3 failures; the wheel zooming about the centre,
  which moved the anchored point 633.7px; the drag threshold cut from 5px to 1px; the Done cap
  moved to 9, 3 failures; the descriptor path shortened by one level; a 760px canvas minimum,
  caught only at 390x844; and the drag no longer swallowing its own click, which selected a node
  and opened a capture popover on a pan.
- The anchored zoom was reported broken by the driver and was not, #58. The first run measured
  1.78px of drift, and the browser floors a dispatched pointer coordinate: measuring at 322.9488
  while dispatching at 322 invents exactly the fraction times one minus the ratio of the scales,
  1.7789px vertically and 0.1500px horizontally against 1.7814 and 0.1486 observed. Predicting both
  from the floor settled it in a minute. The repair is not a wider tolerance, which would swallow
  a real regression too: the point is rounded once and used for both, and `px()` throws on a
  non-integer rather than rounding, because rounding at the dispatch leaves the caller holding the
  float. New lesson, KAIZEN.md `kaizen-a-harness-and-a-page-must-agree-on-the-coordinate`.
- Two harness races were found by running the suite somewhere other than where it was written,
  #58, and both are recorded because the shape repeats. `select()` schedules a pan 30ms out through
  `reveal()` and clearing the selection does not cancel it, so a rect measured just after a clear
  can be panned out from under the click; the runner hit it where three local runs had not, and the
  log said only that a selection never arrived. And board.js keeps one request in the air at a
  time, so switching a token on under a board already on screen can leave the next poll a whole
  30 seconds away; the local server answers the snapshot in a millisecond and never showed it, the
  deployed origin did. Neither is a page defect and neither is repaired by a longer wait: rects are
  now read until two consecutive readings match, and the board fixture is planted in localStorage
  and the page reloaded so the first poll is the live one.
- `scripts/verify.sh`, one entrypoint for everything a contributor previously had to reconstruct
  from prose, #58: `node --check` on every shipped script, the layout rebuild byte compared against
  the committed `site/graph.js`, both gates with their self-tests, the local token grep, and the
  smoke suite, with the deployed-bytes gate and a second smoke run added when an origin is passed.
  Every step runs whatever the ones before it did. A step that cannot run reports `[SKIP]` with its
  reason and is counted separately in the summary, because a clean run that skipped two checks must
  not read as a clean run that did nine.
- `.github/workflows/smoke.yml`, its own workflow and not a step in `repo-gate.yml`, #58. The two
  ask different questions, one whether anything forbidden is committed and one whether the page
  works, and a browser that fails to start would otherwise turn the safety gate red for a reason
  that has nothing to do with safety; TPS.md's Andon section is that a red run is the whole signal
  here. It is deliberately outside the deploy path: a check between the upload and the publish is a
  check that can leave the site half published. `permissions: contents: read`, no token, its own
  concurrency group with `queue: max` for the reason in
  KAIZEN.md `kaizen-a-guard-covers-only-the-state-it-names`. The browser is the one the runner
  image already ships, so the pin is `ubuntu-24.04` rather than `ubuntu-latest`, and the run prints
  the exact version it drove; stated plainly, that pins the image and not the build, and the
  alternative buys a 150MB third party download on every run.
- The suite cannot file an issue, and that is asserted rather than intended, #58. `window.fetch`,
  `XMLHttpRequest`, `navigator.sendBeacon` and `window.open` are replaced before any page script
  runs and every call recorded; `Network.setBlockedURLs` refuses github.com below the page; and
  `Network.requestWillBeSent` is watched, so a request that got past the stub is a failure rather
  than a silence. The board's live path is driven against a synthetic fixture numbered in the 900s,
  so no assertion depends on an issue number, on the clock, or on any network state beyond the page
  itself. The repository held 47 issues before this work and 47 after.

### Changed

- `pages.yml`'s concurrency group moved from the workflow to the deploy job, #62. Nothing about the
  group changed: same name, same `cancel-in-progress: false`, same `queue: max`, same argument
  reproduced verbatim beside it. Only its scope moved, and only because a workflow-level group
  holds the whole run including the job whose purpose is to clear the queue that group is stuck in.
  Measured rather than assumed: in the jam the newest run sat at status `pending` with zero jobs for
  24 minutes, so no step anywhere in that file could have run and a supersede step inside a queued
  run is unreachable by construction. The move was proved before it was made, because board.yml's
  own comment records what a concurrency key that does something other than what it says has
  already cost here. A throwaway probe workflow was pushed, dispatched three times in thirteen
  seconds and read back: its ungated job started immediately on all three while its gated job was
  held, and its gated jobs ran strictly first in, first out with none evicted, where the default
  `queue: single` would have evicted the middle one. `queue: max` is honoured on a job-level block.
  The probe was deleted in the commit that used its answer. Permissions moved with it: the workflow
  floor is now `contents: read`, `pages: write` and `id-token: write` sit on the job that deploys,
  and the job that cancels runs holds `actions: write` and nothing else, so neither can do the
  other's work by accident.

- `build/safety_grep.py` aborts instead of reporting clean when the faculty register yields no
  name terms, #58. It reads the register straight out of the vault, so on any machine without one
  the real-name comparison ran zero times and the gate printed `VERDICT: clean`, which is the
  empty-input lie `scripts/check_forbidden.sh` already asserts against in `scan_dir`
  (HANSEI.md `2026-08-empty-input-reported-success`). Exit 2, which `scripts/verify.sh` reads as
  "did not run" rather than as "passed". Found by chaining it into `verify.sh` and asking what the
  step would report on a machine that is not this one.

- Contrast is a gate and no longer a measurement somebody once took, #59. `build/model.py`
  computes WCAG 2.x contrast for all thirteen type colours against both band plates and emits one
  row per colour per ground; `scripts/check_repo.sh` holds the threshold, the declared exceptions
  and the verdict, and prints the whole table on every run. The split is not taste: no workflow
  runs the build, `site/graph.js` is committed and deployed as it stands, so a check living in the
  build runs only for whoever remembered to rebuild, while the repository gate runs on every push
  and every pull request and already carries a declared-exception mechanism, a staleness rule and
  a self-test. The surface is the band plate, established by reading the drawing rather than
  chosen: `app.js` fills one opaque `rect.band` per lane before it draws a tile and every tile is
  laid out inside a lane, so a stroke never touches the page ground. The plate is read out of
  `app.css` through the token `.band` actually paints with, never typed into the model, and a
  token that stops resolving to two values stops the build. The choice earns its argument:
  measured against the page ground instead, three of the twenty-six verdicts move, and in both
  directions. The threshold is 3:1, WCAG 2.2 SC 1.4.11, which is the figure for the boundary of a
  control and for a graphical object a reader needs; not 4.5:1, which is text, is what the panel's
  type label needs and is #56's card; and not lower, which is the one repair this card refused.
  Six of the twenty-six fail today and all six are declared, each naming the colour, the hex, the
  ratio it achieves and why it is tolerated: Students 2.48, Cohort session 2.56 and the ghost grey
  2.88 on the white plate, Programme 2.50, Company 2.67 and Agreement 2.90 on the dark one. A
  declaration licenses exactly itself, so a hex nudged by a shade, a ground confused or a ratio
  that has drifted still fails, and one that stops being needed fails the run as loudly as a stale
  self-match. The palette is asked for a colour per ground rather than for a colour, so #56's dark
  siblings plug in with no change to the check: proved by handing Agreement #56's `#bd8750` for
  dark only, which measures 4.64 and makes the gate say the declaration is now unnecessary. The
  three light failures survive #56, which moves no light colour, and need a card of their own.
  Ratios are floored to four decimals, so a printed figure is never better than the truth and,
  with the threshold written to four decimals too, the printed figure decides exactly what full
  precision would have decided; rounding to nearest does not, and `#00a3c0` on white, which
  measures 2.99998, is the colour that proves it. Self-test 50 probes, up from 32;
  `site/graph.js` byte identical.
- The palette table is validated before it is judged, #59, and this is the guard that matters
  most. The rule shipped with one completeness check, that the row count was over zero, in the
  belief that it was the poka-yoke the name rule and the citation rule carry. It was weaker than
  both. Fed only the six failing rows, twenty measurements missing, every declaration was still
  hit, nothing was stale, no colour was under the threshold undeclared, and the run printed a
  clean verdict on less than a quarter of the palette, with the missing types reading
  `not measured` in the table and costing nothing. A clean verdict now means twenty-six
  measurements were taken or it means nothing: every row is checked field by field, both grounds
  must be present for every type, no pair may appear twice, a ratio must be a four decimal figure
  because `awk` reads `3foo` as over the threshold, and the model writes a terminator carrying
  the count it intended, which a truncated stream cannot forge. Each fails at exit 2, an
  assertion and not a finding, because the answer is not that a colour is wrong but that the run
  does not know. Eight probes, one of which runs the real emitter and asserts the shape of what
  it writes, since the field order is a contract between two files in two languages and nothing
  else would notice it breaking. Found by an independent review of the first commit, which is
  the second time on this card that reading the code beat reading the argument about it.
- Three smaller repairs from the same review, all of them prose that was more confident than the
  code, #59. The transfer function's breakpoint is the 2.1 and 2.2 value where the check cites a
  2.2 criterion, and no measurement moves, since no channel of an 8 bit colour falls between the
  two. `app.css` is read with its comments stripped, because a commented-out `.band` rule or the
  theme block's own name inside a comment would have pointed the whole measurement at a surface
  nothing is drawn on. And the comment now says what the check does not cover: the stroke has two
  neighbours, the plate outside and the tile's own tint inside, the inner one is always the
  harder comparison and seven colours that clear 3:1 on the plate are under it against their own
  fill. The plate stays the gated surface, because 1.4.11 asks whether an object can be told from
  its surroundings and a tile is a stroke and a wash together, and because it is the comparison
  #56 designed against; moving the line inward is a card with a price, seven more declarations or
  a change to the tint's alpha.
- The thirteen type colours have dark siblings and the drawing is legible in both themes, #56.
  Eight got a second hex chosen against the dark band plate, five needed none, and every one of
  the thirteen now measures at or over 4.5 there, worst Cohort at 4.5374 against the 2.4972 that
  Programme reached the day the dark theme shipped. The target is 4.5 and not the gate's 3:1
  because the same colours are written as 11px bold text at the head of the detail panel, which
  is SC 1.4.3 and not 1.4.11, so one number fixes the stroke and the label together. Each dark
  hex holds the light one's hue and its saturation and raises only its lightness, so a type is
  the same colour in both themes rather than a different one. The light column did not move, and
  that is proved and not asserted: eighteen screenshots, three viewports by six surfaces, pixel
  identical before and after. One source, and it is the model. `build/model.py` carries
  `TYPE_COLOUR_DARK` beside the palette, `build_layout.py` ships it as `cDark` beside `c` through
  the same accessor the contrast check reads, so the drawing and the measurement cannot come to
  hold different palettes; `app.js` generates one stylesheet from `G.types` declaring
  `--type-<key>` on `:root` and again under `prefers-color-scheme: dark`, and paints every
  stroke, glyph, count and panel label with `var(--type-<key>)`. `app.css` holds no type colour.
  Not `matchMedia`: that puts a second theming mechanism on a page whose stylesheet already
  answers that query for every other colour, and two mechanisms for one question is how they come
  to disagree about what dark means. This way the theme changes with no JavaScript running.
  `tint()` keeps its semantics and returns a `color-mix` at the same strength, so a wash still
  composites over the plate rather than mixing toward white. The alpha was measured rather than
  assumed and needed nothing: at 14 per cent the twelve non-ghost fills sit 1.2007 to 1.2753 off
  the dark plate where the light hexes sat 1.0983 to 1.2753, so every one steps further from its
  plate than it did. The ghost's fill was `rgba(143,153,168,0.07)` written into `app.js`, which
  was the palette's own grey typed into a second file, and it is the type's own colour now at the
  same 7 per cent, KAIZEN.md `kaizen-a-computed-value-is-never-typed-twice`. `color-mix` was
  checked on a real engine rather than looked up in a table, because the site ships no build step
  and no polyfill: in Chrome 149 it resolves in an SVG presentation attribute, so does `var()`,
  and `color-mix(in srgb, C 14%, transparent)` paints exactly the pixel `rgba(C, 0.14)` paints,
  all thirteen colours, zero pixels different, which is what makes the light page identical
  rather than nearly identical. It is Baseline since 2023. The inner comparison improved as a side
  effect: seven colours cleared 3:1 on the plate and were under it against their own fill, and
  five of those seven were dark; two are left, both light.
- Three declared contrast exceptions are gone because the gate said they were spent, #56. The
  dark siblings landed, `scripts/check_repo.sh` went red on the next run with
  `[STALE] declared contrast exception is now unnecessary` against Programme, Company and
  Agreement, and the entries came out for that reason and not from memory,
  KAIZEN.md `kaizen-gate-shown-to-fire`. Three remain, Students 2.4805, Cohort session 2.5587 and
  the ghost grey 2.8807, all on the white plate, all untouched by this card, which moved no light
  colour, and all still needing a card of their own. Twenty-six measurements, three under the
  threshold, three declared, none undeclared. Two figures on the card did not reproduce and are
  corrected here rather than left: the fill step column read 1.26 for Cohort session where it
  measures 1.2516 and 1.21 for Claim where it measures 1.2007, and it gave the ghost a figure at
  14 per cent when the ghost is drawn at 7. Its stated recipe, the first lightness that clears
  4.6, does not produce Instructor's `#199adb` at 4.5980 or Claim's `#e56697` at 4.5929 either;
  both clear the 4.5 the card is actually about, so both hexes are kept as published.
- Every type says how it gets filled, Issue 4. Four rows in front of each node's own properties,
  `route_system`, `route_entered_by` and `route_event`, plus `route_source` naming the file the
  answer was read in, grounded in the 55 entity ontology, five adversarial reviews and the read of
  the company's workspace, none of which is in this repository. The card was reframed by the
  owner's destination, a management tool showing every element of the funnel, which turns a
  populate route from tidiness into the line between a type that can appear in the tool and one
  that can only appear in a drawing of it. Of 17 classes, 8 have a route and 9 have none; nothing
  is removed, because a management tool needs every one. `absent` covers two different absences
  and the row text tells them apart: "none" and "no row is created" are findings, "not recorded"
  is the analysis being silent, and nothing here is guessed to fill a gap. No person is named in a
  role, so a route that ends when somebody leaves cannot be written down. The tile of a type no
  system holds carries `no system holds it` under its label, derived from `route_system` and never
  typed, so the drawing and the panel cannot disagree; 14 tiles carry it. The four ghosts get the
  four rows and no mark, since an unfilled dashed tile whose type reads "does not exist in any
  system" already says it twice. It costs the drawing nothing: 1230x586 before and after, because
  the marks land in the programme, template, cohort and agreement lanes and the height is set by
  the cohort sessions lane, which Notion holds a calendar for. The full table is on the issue.
- The cohort's mark reads `no system holds it` and not `no cohort_id`, Issue 4. With a mark under
  every unhoused tile, the cohort would have been the one marked tile not carrying that sentence,
  and a reader comparing marks would have read that as the cohort having a system, which is the
  worst single thing this page could say. The missing key is still a property row, still the first
  line of the note, and now also the `route_system` row.
- The barycentre tie-break fires on near ties, Issue 4, where it fired only on exact ones. Putting
  a mark under six employer-lane tiles moved that lane by a few pixels, `t2` and `t3` came out
  5.75px apart instead of equal, and the two `teaches` chips issue 49 separated landed back on top
  of each other, 7.0px deep. The tolerance is `MIN_GAP`, argued rather than tuned: two tiles can
  never sit closer than that, so a smaller difference is not a preference about rows. One adjacent
  pass and not a re-sort, because near-tie is not transitive and a comparator built on it is not
  an ordering. No two chips overlap again.
- A dark theme, #55: one `@media (prefers-color-scheme: dark)` block redefining the palette on
  `:root` and nothing else, so every surface follows from one place and none of them can be
  forgotten. It answers the operating system rather than a switch in the header, because a switch
  is markup and script and neither was this card's to write; an explicit override is a card of its
  own. The values are not the light ones inverted: each was measured on the surface it lands on,
  body text at 13.5:1 on the panel and 15.1:1 on the canvas ground, muted text at 6.8:1 on the
  panel and 5.9:1 on the elevated fill under the captured context, which is exactly where the
  mirrored muted grey fails at 4.4:1 and is why the dark one is a step further up the ramp. The
  translucent tokens carry the lightness step they take in the light theme rather than their
  alpha, so the rules, the hover wash and the grid keep their weights against a ground at the
  other end of the scale. `color-scheme: dark` is in the block because the scrollbars of the
  panel, the board and the student list, and the menu the browser draws for the two selects in the
  capture popover, are reachable from nothing else in a stylesheet. The scrim behind the student
  list was the one colour literal outside `:root` and is `--scrim` now, the same value in light.
  Light mode is unchanged and proved so: eighteen screenshots, three widths by eight surfaces, are
  pixel identical before and after. Measurements in the commit message.
- The drawing does not glow on a dark page, and the measurement says why, #55. `tint()` returns an
  `rgba`, so a tile fill composites over the band plate it sits on rather than mixing toward
  white: sampled from real pixels, light fills are 1.06 to 1.23 darker than their plate and dark
  fills are 1.10 to 1.27 lighter than the same plate, the same step in the other direction. What
  the type colours do not survive is being a stroke at full opacity. Against the plate, Programme
  `#9d3f9d` falls from 5.78 to 2.50, Company `#5f6b7c` from 5.41 to 2.67 and Agreement `#946638`
  from 4.98 to 2.90, all three under the 3:1 a drawn outline needs, and the panel's type label,
  which is the same colour as 11px text, is under 4.5:1 for eight of the thirteen. Those colours
  are written by the model into `site/graph.js`, so no stylesheet can reach them and the repair is
  a card of its own. `[OPEN]`
- `#/students` lists the whole cohort, Issue 51: a route of its own beside `#/board`, reached
  from the header and from the students card's panel, listing all 34 rows with the four the
  canvas draws marked. The rows come from the build, so the list and the drawing cannot disagree
  about who they are, and the counts in its heading are read off the rows. The diagram stays a
  diagram and this is where completeness lives.
- Student is an object type, and clicking the students card draws four of them, Issue 51. They
  fade into space the build already keeps for them, with `and 30 more, not drawn` under the card
  and the number computed from the roster, so four tiles cannot quietly stand in for thirty four
  people. The rule that hides them is issue 48's, generalised to a table of verbs rather than
  copied: one mechanism, `member of` and `employed by`, and the two reveals cannot interfere.
  `individual_records` on the students card no longer says "not in this repo", because that
  stopped being true. HANSEI.md `2026-08-10-invented-names-are-not-thereby-safe-names`, for the
  thirteen invented names that turned out to be real ones.

- The diagram is an infinite canvas, #46: a dot grid ground, pan by dragging, zoom by wheel and
  by pinch anchored on the pointer, and a visible way home. The card's note contradicted itself,
  so the code was read rather than guessed at: there was no grid, no pan and no zoom, which
  settles which half of the sentence was the ask. Three numbers are the whole of the state, the
  drawing point under the top left corner and the pixels per drawing unit, and the `viewBox`, the
  grid and the zoom readout are three renderings of them written together, so they cannot drift.
  The view moves through the `viewBox` rather than a wrapper group, because `feedback.js`
  describes a clicked element partly by a five deep `tag>tag>tag` path and a wrapper would have
  silently changed every descriptor this page can produce; seven were captured through real
  capture mode before and after and are identical. The grid is a background on the canvas box
  rather than a pattern in the drawing, so the dot stays a fixed size in screen pixels while the
  spacing, a power of two multiple of 32 drawing units held between 22 and 44 pixels, carries the
  zoom and the pan. Fit frames the build's own `G.w` by `G.h`, which is what the old fixed
  `viewBox` framed, so the page still opens on the screen it always had; `fit`, the `0` key and a
  readout in which 100% is the whole drawing say where home is, and all three go bold and blue
  the moment the view is not there. Measurements in the commit message.
- HANSEI.md gains `2026-08-10-quoting-the-skip-marker-skipped-ci`. A commit message that quoted the
  CI skip marker while explaining what the marker is for was obeyed as one, so a push changing three
  workflow files ran no gate, no deploy and no workflow at all. No prevention in code, and the hole
  is structural: a marker whose effect is that nothing runs cannot be caught by anything that runs.
  The discipline is to name the marker in a commit message and never spell it.
- A drag is separated from a click by 5px of movement, or 3px once held for 250ms, and the click
  a drag leaves behind is stopped on `window` in the capture phase, which runs before
  `feedback.js`'s document listener whatever order the scripts load in. **A pan therefore cannot
  file a card**, driven with capture mode on at two widths, from the background and from a node,
  with the repository's issue count unchanged either side.

### Changed

- Entries are cited by slug and no longer by position, #54. KAIZEN.md's lessons gain slugs in
  HANSEI.md's form, in a `kaizen-` namespace and undated because no date for them is established,
  and every positional citation in the tree is repointed at the entry it named: 30 of them, not
  the 12 the card counted, across CHANGELOG.md, TPS.md, KAIZEN.md, HANSEI.md, both gate scripts,
  two workflows and `build/model.py`. Two had already rotted, both into KAIZEN, whose list is not
  append-only, so "last entry" moves every time it grows; a third was right only by being the
  most recent. Nothing was reordered and nothing renumbered. `scripts/check_repo.sh` now fails
  the build on a citation naming a slug no entry carries, self-test 32 probes up from 27, with
  the two ways that check could be hollow proved shut: a definition written outside HANSEI.md and
  KAIZEN.md defines nothing, and an empty list of defined slugs aborts rather than judging every
  citation against it. Driven failing on a real dangling citation before it was trusted. Lesson
  in KAIZEN.md `kaizen-a-scanner-cannot-tell-use-from-mention`, which is the one an agent
  withheld rather than break two citations by appending it.
- An instructor's employer is painted only while that instructor is selected, #48. The hidden set
  is the target of an `employed by` edge and never the `Company` type, so Aretxa Capital, the
  colaboradora that hosts a visit and employs nobody, keeps behaving as it did, and a sixth
  instructor's employer would join the rule by existing. The tile, its line and its verb chip
  fade over 120ms into the space the build already gave them: nothing reflows, the view does not
  move, and a hidden employer is out of the tab order and out of the hit test, so capture mode
  cannot file a card about one. The lane caption gains a second line, `employers appear on click`,
  at no cost in height. Lesson in KAIZEN.md `kaizen-a-hidden-node-in-this-view-and-in-another`;
  measurements in the commit message.
- Below 760px the diagram no longer scrolls, #46: the body rule that scrolled the page at narrow
  widths is scoped to the board, which is untouched, and the diagram is one screen at every width
  with the drawing moving inside it. `#graph { min-width: var(--drawing-w) }` goes, since pan and
  zoom is that sideways scroll on both axes and at any scale, and so does the reserve of the
  sheet's height under the drawing that #21 needed, since `ensureVisible()` pans and a canvas
  cannot run out. `app.js` still writes `--drawing-w` and `build_layout.py` still refuses to build
  while a copy of the number sits in the stylesheet; nothing reads the property today, and
  removing that machinery belongs in its own commit.
- `board.yml` commits `site/board.json` and no longer deploys, #39: it wakes `pages.yml` when and
  only when it committed, so one workflow creates Pages deployments instead of two and an
  unchanged board publishes nothing. The two loop guards, `[skip ci]` on the board commit and the
  committer check in `pages.yml`, are untouched and are what keeps the dispatch from becoming a
  second deploy. Deployment counts and the alternatives that lost are in `board.yml`'s header.
- The canvas window is measured off `getBoundingClientRect` rather than `clientWidth` and
  `clientHeight`, which round to whole pixels: at 1536x839 the box is 735.58px tall while
  `clientHeight` says 736, so the browser was asked to fit 736 pixels of drawing into 735.58 and
  scaled everything by 0.94 of a per mille to oblige. `getScreenCTM` read back 1.1734 where the
  view said 1.1741, and the anchored zoom drifted a fifth of a pixel a step. Fifth time here that
  a measured value has beaten a rounded copy of one; KAIZEN.md carries the general form.

### Removed

- The second cohort, #42, and with it every route into a two-cohort view: the `#c2toggle` switch
  and its title swap, `body.two-cohorts`, the `COHORT2*` tables, `with_second_cohort()`, the
  second `layout()` call with the `spread_share` argument and the pinned-column branch it was the
  only caller of, and `window.G2`. Nothing dangles and no stored state survives, both driven
  rather than reasoned. `graph.js` 51.1KB to 20.8KB, `label_widths.json` 500 strings to 418. The
  default drawing neither paid for the other view nor gains from its removal: `window.G` is
  byte-identical either side and every measurement at three viewports is unchanged, because the
  two views were always laid out separately. Lesson in KAIZEN.md
  `kaizen-a-demonstration-is-a-cost-to-the-reader`.
- The frame drawn around a selected node, #45, filed from the live site. A click already inverts
  the tile, bolds the label, dims everything unrelated and opens the panel; the frame was a fifth
  statement of the same fact and the only one that added a shape. **`.node:focus { outline: none }`
  stays and must stay**: reverting `b4e65d0` would bring back the near-black five pixel ring of
  #34, because Chrome keys its own ring on `:focus` for a focusable SVG element. Proved from the
  running document with `CSS.getMatchedStylesForNode`, since a screenshot cannot separate "our
  frame is gone" from "the browser's ring is back". The rect survives as `.focus-frame` on
  `:focus-visible` only, so keyboard focus keeps a mark.
- `--tint-select`, which `b4e65d0` added for the selection frame's fill and nothing else read.
- The commit-message backstop in `issue-status.yml`, and with it that workflow's `push` trigger,
  #50. In the thirteen pushes it ever saw it wrote four labels and all four read a citation as a
  claim of work; assignment is now the only signal and a bare `#N` moves nothing. Incident in
  HANSEI.md `2026-08-10-citation-read-as-a-claim`; the narrowing that was rejected is argued in
  the workflow's header.

### Fixed

- A feedback report now names the commit the reporter was looking at, #47. It used to carry a
  seven character digest of the drawing, written into `site/graph.js` by `build/build_layout.py`
  under the name `build`: a string that reads as an abbreviated sha to everyone who meets one and
  is not one, so `git cat-file -t 469ad3c` answers `not a valid object name`, and one that moved
  only when the layout was regenerated, so four cards filed across two deploys of real code all
  carried the same value and #41 was nearly diagnosed as a cached page. The commit is stamped at
  deploy time into `site/version.js`, the one file in `site/` whose deployed bytes are
  deliberately not the bytes in the tree, from `git rev-parse HEAD` rather than `github.sha`
  because this job checks out `main` at the moment it runs. It is not in `graph.js` for the
  reason it cannot be: that file has to stay byte for byte what the builder reproduces, which it
  does. The report prints the full forty characters, so nothing beside it can be mistaken for a
  revision; the digest stays as `drawingDigest`, printed `sha256:…` and labelled as not a commit,
  because it still answers whether two pages are drawing the same geometry. The tree copy names
  no commit and the report says so in a sentence rather than showing a blank, since a working
  tree is not a deployment. `pages.yml` reads the stamp back off the origin after deploying and
  fails the job unless the served page names the sha it published.
- The count stack on the students tile, #41, two defects at once in `site/app.js`, both dating
  from the first commit. The cards were `TILE - 6` across and positioned from the tile's corner,
  so they were not a stack; they are now tile-sized on a constant 2.5 unit step. And they showed
  through the tile's fourteen per cent tint as an outline across it, which no coordinate change
  would have fixed; there is now a `--bg-panel` backdrop rect between the cards and the tile. The
  layout was not the cause and `graph.js` reproduces byte for byte. Lesson in KAIZEN.md. That the
  reporter was on the current bytes had to be established by fetching the deployed `app.js`,
  because the build stamp cannot say so, which is #47.
- The black box around a selected node, #34. This repository did not draw it: Chrome answers
  `:focus` on a focusable SVG element with `outline: auto 5px`, `app.css` had overridden only
  `:focus-visible`, and a mouse click matches the first and not the second. Read off the running
  page rather than inferred. Repaired with `outline: none` on `.node:focus` plus a `.sel-frame`
  rect this stylesheet owns, padded around `getBBox()` rather than computed, with the browser's
  ring deliberately restored under forced colours. Lesson in KAIZEN.md. Two apparent zero-sized
  frames during the drive were the harness clicking outside the viewport; the probe now scrolls
  the tile in and asserts it is there first.
- Card titles cut mid-word, #44: #42 arrived titled "…it must be one c". A title now ends on a
  boundary the writer put there, the first line or the last sentence ending inside seventy
  characters, else on a word boundary with an ellipsis and no dangling connector; only a word
  longer than the whole line is still cut hard. Both filing paths were driven to the same title.

### Removed

- The header legend, #32, twelve swatches naming the twelve tile colours, filed twice by the
  owner as redundant. **What is no longer explained anywhere is the key as a key**, the whole
  colour-to-type mapping readable at a glance, and with it the line naming the dashed empty tile
  as `does not exist in any system`; per node both are still recoverable from the panel and the
  tooltip. Nothing was invented to replace it and the space goes back to the drawing: the header
  falls from 79px to 58px at 1440x900 and from 177px to 119px at 390x844. `G.types` is still
  read and the model is untouched.

### Added

- The board refreshes itself while it is on screen, and draws from the GitHub API directly when a
  reader has connected their own token. Without a token it re-fetches `board.json` every thirty
  seconds, which is as often as that file can change; with one it polls `api.github.com` every ten
  seconds and builds the columns itself, removing the workflow and the CDN from the path. Measured
  against the real repository with no reload: an issue appeared 3.1 seconds after `gh` returned
  and disappeared 6.7 seconds after deletion, and the live board matched the published one card
  for card.
  - **The column rule now exists in two places, and each file names the other in a comment.**
    `site/board.js` reproduces `scripts/sync_board.mjs`, and they cannot be made one without a
    build step, because the generator is not deployed and the page loads classic scripts. The
    failure this invites is quiet: two boards disagreeing about the same issues with nobody seeing
    both at once.
  - A poll that finds nothing new writes nothing, proved with a MutationObserver over three live
    polls; an unchanged board costs a 304 through `If-None-Match` and no rate limit; polling stops
    on `visibilitychange` and on leaving the board, and resumes with an immediate fetch; a 401,
    403 or 404 falls back to the snapshot and says so through `explainStatus`, shared through
    `window.ZMT` rather than copied; a failed refresh keeps the drawn board and prints the
    failure; a low rate limit slows to one check every two minutes and says that too. One new
    status line under the header, hidden until it has something true to say.
  - The first fetch moved to `DOMContentLoaded`, because a zero delay timer fired in the gap
    between two script tags and drew the snapshot for a reader who had connected a token. Lesson
    in KAIZEN.md.
- The `status:` labels are written from events rather than typed by a person, and taking an issue
  means assigning it. `.github/workflows/issue-status.yml` keeps exactly one `status:` label on an
  issue at a time, or none, and `scripts/set_status.sh` owns every write and calls the API only on
  a difference, which is what keeps a workflow that hears issue events and writes labels from
  feeding itself. A second job is the backstop for work that starts without an assignment: a push
  whose commit messages name issues marks each open one in progress, subtracting the references a
  closing keyword owns and ignoring the board bot's own commits. The commit payload is read out of
  the environment and never out of an interpolated expression. The full rule table is in KAIZEN.md.
  - **The part that would have made this useless.** GitHub raises no workflow run from an event
    caused by the default `GITHUB_TOKEN`, so these labels would never have reached `board.yml` and
    the board would have gone on drawing the old column with every run green. The workflow
    therefore dispatches `board.yml` itself through `workflow_dispatch`, the one trigger type the
    suppression exempts, and only when a label actually changed. Driven against the real
    repository on a throwaway issue, where each of the three label writes was followed by a board
    run on `workflow_dispatch` and by none on `issues`. Lesson in KAIZEN.md.
  - One thing this bought that was not intended: a Pages deploy failed with `Deployment request
    failed ... due to in progress deployment`, because the `pages` concurrency group serialises
    Actions runs while the Pages deployment lifecycle continues past the end of the run that
    started it. The mechanism predates this change; what this change contributes is traffic, since
    every label move now dispatches a board run and every board run deploys. Cleared by re-running
    the job and left as a known edge, now #39.

### Fixed

- An issue closed as not planned no longer lands in Done, #33 having become the top card of the
  column as a duplicate asserted to be complete. `sync_board.mjs` now reads `stateReason` and
  gives a `NOT_PLANNED` closure no column at all, since it is neither outstanding nor finished
  work. It is not dropped: `hidden` is the whole closed set minus the eight cards drawn, the
  generator asserts that arithmetic and fails the run rather than publishing a count that does not
  add up, and the page says `and 16 more closed` rather than `more done`.
- The Done column is bounded at eight cards and says how many it is not showing. Every closed
  issue lands there and nothing takes one out, so at twenty four closed issues the board read as
  ninety percent finished work. It keeps the eight highest-numbered cards, newest first, while the
  other three columns stay ascending by number; the remainder is linked as `and 16 more done`,
  because a cap that reads as the whole list would be worse than the long column it replaced. An
  older `board.json` carrying neither field still draws.
- The GitHub connect note names the order the token form imposes, not only the token it wants.
  HANSEI.md `2026-08-10-token-form-default-hid-the-permission`. The 404 explanation in
  `explainStatus` is unchanged, because it serves the tokens made before the note was read.
- The connected filing path has been exercised end to end against the deployed site, closing the
  caveat that its success half had only ever been driven against a stubbed `fetch`. No token value
  is recorded anywhere in this repository.
- `copy all` no longer looks alive while it is not, #23. It is disabled while the count is zero
  rather than made to work on an empty list, because a clipboard write of nothing that reports
  `copied` is a lie about what the reader now holds. Lesson in KAIZEN.md.
- The capture popover is placed in the band between the header and the footer, #22. It used to
  reserve the footer only, so a click in the header opened the box over the feedback toggle that
  capture mode deliberately exempts. Both edges are read from live rects rather than
  `offsetHeight`, because below the breakpoint neither header nor footer is pinned, and a box
  taller than the band scrolls inside itself.
- The same fix corrects a second defect found while measuring it: the popover was positioned
  before its connect section was rendered into it, so the clamp used a height about a hundred
  pixels short and the box could run off the bottom. Anything that changes the box's height now
  re-clamps it.
- Below the 760px breakpoint the detail panel no longer opens on top of the node it describes,
  #21. `reveal()` handles both axes; the sheet is recognised by its own geometry rather than by a
  copy of the breakpoint in JavaScript, its height is read from `offsetHeight` because a transform
  moves the rect while the transition plays, and whichever element can scroll is the one scrolled.
- Handling the axis was necessary and not sufficient. At 390px the page is about 36px taller than
  the viewport, so there was nowhere to scroll to and the correct new code moved zero pixels. The
  canvas now reserves the sheet's own height under the drawing while the panel is open, sized by
  one `--sheet-h`. Driven over all 30 nodes: 28 of 30 covered before, 0 of 30 after. Lesson in
  KAIZEN.md.
- A typed but unfiled note survives every way of closing the popover, #25. Escape and the `3`
  shortcut both destroyed it silently; notes are now held per element and put back when that
  element is clicked again, and a filed note stops being a draft.
- Capture mode no longer pushes the `board` link off the right edge below 400px, #26. Turning the
  mode on widens its own toggle and `.hnav` kept `flex: none`, so its children never met an edge
  to wrap at; the nav is given the row below the breakpoint. At 320px the link had sat 71px
  outside the viewport. Lesson in KAIZEN.md.

### Changed

- The lane captioned `cohort sessions` now reads `cohort sessions and the visit host`, #24. A
  Company sits in that lane and the placement is right, because its `hosts visit` edge attaches at
  session level, so the caption was the thing that had to change. Widening the caption was chosen
  over a sub-caption and over marking the one tile, and the wording names the visit rather than
  the sessions because the company hosts one visit and not the six sessions. Lesson in KAIZEN.md.
- Band captions may run to more than one line, which is what let that caption widen at all, since
  a lane is only as wide as the columns under it. Lines stack upwards from the top of the band, so
  the last line sits the same distance above every lane, and the lane-overflow gate now checks
  every line rather than the caption as a whole. The one cohort viewBox goes from 1230x574 to
  1230x586: every x is identical and every y moves by exactly 11.

### Added

- A second cohort behind a header switch, #19. `Z-IB 2Q26` is instanced from the same six session
  templates as 1Q26, on later dates, with two sessions moved to different instructors, and brings
  its own aggregate students card, 27 against 34. The point is the template versus instance split,
  which one cohort cannot show. Removed later, #42, at the top of this file.
- The switch is off by default and the default drawing is unchanged byte for byte. The two views
  are laid out independently and shipped side by side as `window.G` and `window.G2`, and the
  switch redraws rather than hiding nodes with CSS, because a hidden node still takes up room in a
  layout. Verified by diffing the generated `window.G` against the deployed bytes. Lesson in
  KAIZEN.md.
- Two layout facilities used only by the second view: a column may be pinned, which states its
  order and takes it out of the barycentre sweep, and a column may be opened to a share of the
  drawing's height. The session column is pinned because the sweep's answer there is a real
  minimum of crossings and still unreadable. Lesson in KAIZEN.md.
- `build/measure_labels.py` measures the union of both views, so the opt-in drawing is laid out
  from measured widths rather than the fallback estimate. 82 strings added to
  `build/label_widths.json`; no existing entry changed.

### Not added, and why

- A second enrolment to claim chain. It hangs off every cohort in the same shape, so a second copy
  would have added nine nodes and no relationship the first already carries.
- A new instructor for the second cohort. Reassigning two sessions among the five already on the
  page shows substitution across cohorts and adds no node.

### Added

- Ghost classes on the diagram, #8. Four classes the operating model needs and no system holds are
  drawn beside the objects that do exist: `Instalment` expected by `Agreement`, `Placement`
  matures `Claim`, `Beca` discounts `Agreement`, `Refund` reverses `Charge`. A ghost is a dashed,
  unfilled, empty tile with an italic label and a dashed edge carrying the verb it would carry.
  Lesson in KAIZEN.md.
- A legend entry, `does not exist in any system`, drawn as the same empty dashed box.
- A marking on the `Cohort` node rather than a ghost of its own, because that object exists and
  only its key does not: a second dashed outline, the words `no cohort_id` under the label, and a
  `cohort_id` property whose value says no identifier is held anywhere. Lesson in KAIZEN.md.
- A third property flag, `absent`, beside `dummy` and `estimated`. A dummy value stands in for
  something a system holds; an absent one says no system holds it.
- Clicking a ghost opens the properties panel like any other node. The panel leads with what the
  absence costs in two sentences and carries no figure of any kind.
- A `ghosts` toggle in the header, shown by default, that hides the ghosts, their edges, the
  legend entry and the cohort marking. Default shown because the absences are the finding.

### Not added, and why

- An `Attendance` ghost. It would have to attach to the cohort sessions, which are the tallest
  column, and the drawing is sized to one screen, so it would have made every node smaller for
  every reader in exchange for a fifth absence. The other four sit in the emptiest band and cost
  no height: the viewBox is 1230x574 before and after.

### Changed

- Label widths are measured in a browser instead of guessed in Python, #7. The layout used a
  hand-written per character table, and because the browser only draws what the build decided,
  that guess was baked into the shipped coordinates: out by up to 8.3 per cent as drawn and 19.3
  per cent selected, always in the direction where the true width was larger. Widest miss, `All
  about recruiting in Investment Banking`, guessed 194.10px against a measured 240.66px.
- `build/measure_labels.py` renders every string as an SVG `text` in the exact stack, size, weight
  and style the stylesheet gives it, reads `getComputedTextLength` and writes
  `build/label_widths.json`. 417 strings, seven contexts. Every contiguous run of words in a label
  is measured, not only the finished lines, because which lines a label wraps to is what the
  widths decide.
- A width is the widest the string takes across every family in the site's font stack the
  measuring machine can resolve, four distinct faces here, not the width on that machine. Faces
  the machine does not hold cannot be measured and are not covered; the file records which were.
- `build/label_widths.json` is committed, so the build reads a file and never opens a browser.
  `python3 build/measure_labels.py` regenerates it; `--check` re-measures and reports drift.
- The per character estimate stays as the fallback for any string not in the table, so a new label
  cannot crash a build, and every fall back is named on stderr with the command that would measure
  it.
- Two labels now wrap where they did not: `Agreement 0001` at 84.17px against the 84px its column
  allows, and `Alumnos Z-IB 1Q26` at 96.78px against 94px. The column widths are unchanged; the
  labels genuinely do not fit them.

### Added

- A build gate that refuses to write a drawing in which a label or a band caption crosses a lane
  boundary, checked against measured widths at both weights before a coordinate is written. The
  build prints how much lane the tightest label has to spare, currently 4.7px of 250.
- A loud warning when wrapping would drop words past the three line cap. It used to truncate
  silently, which produces a page that looks correct and says less than it should.

### Fixed

- The detail panel stayed open on top of the board, #20. The route already hid the legend, the
  subtitle and the two diagram toggles; the panel describes the drawing too and was the one thing
  left behind, covering eight of nineteen cards at 1440 and the lower 62 per cent of the board at
  390. It is now hidden rather than closed, so the selection survives the round trip. Found by
  driving the controls: no screenshot of either view on its own shows it.
- Ghost labels and ghost verb chips are drawn in italic, which is a different face with different
  advances, and were being sized as upright. They now have their own measured contexts.
- Runs in the `pages` concurrency group were being evicted before they started, #12: three of the
  last six board runs cancelled without running a step. `cancel-in-progress: false` protects a
  running job, while the group is capped at one pending run and a new same-group trigger evicts
  the one waiting. All three workflows now carry `queue: max`, first in first out. No board update
  was lost, which is the sync being idempotent covering for the eviction rather than the eviction
  not happening. `pages.yml` also checks out `main` rather than its triggering sha, because a run
  that can wait in the queue can start after `board.yml` has committed. Lesson in KAIZEN.md.
- The repository gate spent its whole runtime spawning processes, #13. The real-name rule hashed
  one token at a time, which over this repository is 8415 token occurrences and some 34 thousand
  processes. A file's tokens are now hashed in one call and looked up in an in-memory set built
  once. Same salt, same sha256, same 16 characters, same tokens, same comparison: no rule changed,
  no file skipped, no exemption widened. 70.5 seconds before and 2.9 after on the same warm
  machine, self-test still 27 of 27, and a planted register surname still trips the gate.
- The batch hasher is checked against the single-token one at run time, on a known token, and the
  gate stops with an assertion if they disagree, because two implementations of one hash are two
  hashes unless something checks. Where perl is missing the old per-token loop is still there and
  still correct, verified by running the whole gate with perl absent.

### Fixed, verb chips

- Verb chips are placed on their own edges again, #14. The old search offered nine fixed points
  along the curve, took whichever collided least, and stepped vertically when none was clean, so
  `claims against` finished 133.8px below its own edge naming nothing. Measured from the shipped
  `graph.js`: worst distance from a chip's centre to its own edge was 133.8px before and 6.0px
  after, against a half chip height of 6.5px.
- Each chip starts at the midpoint of its edge by arc length, and 19 of 36 sit exactly there.
  Where a chip would land on a tile, a label or another chip it slides along its own path first,
  because a chip that has moved along its line is still unambiguously on that line, and steps off
  the line only when sliding cannot clear the obstruction.
- The choice is a cost, not a rule: 20 per px of overlap, 1 per px slid along the path, 3 per px
  stepped off it, with overlap counted as depth of penetration rather than as a count of boxes
  hit. Lesson in KAIZEN.md.
- A build gate refuses to write a drawing in which any chip centre is further from its own edge
  than half a chip height, and the build prints the two worst chips by name. Same class as a label
  leaving its lane: the page renders either way, so only a measurement can catch it.

### Changed, header and board

- The header subtitle is per view, #15. It sat above both views and only ever described the
  drawing. The dummy-values badge, the type legend and the `ghosts` toggle are dropped on the
  board rather than reworded, since all three qualify the drawing and nothing on the board.
- Board cards are ordered by issue number ascending, #16, which is the order they were filed in
  and the only order `board.json` supports: it carries no dates, and a number never changes.
- Label chips use the page's own neutral token instead of a hue hashed from the label text. A
  colour that means nothing is a colour a reader has to learn and then discard.
- A card no longer reprints its `status:` label. That label is what put the card in its column, so
  printing it again offers a second place to check one fact. The column heading owns it.
- An empty column keeps its heading and its zero and says `no issues`, on a dashed outline with no
  panel fill, so that a column holding nothing does not read as a card that failed to load.
- The meta line links back to the issue list, taken from a card's own URL and only if it is a
  `github.com` issue address, so the link cannot be redirected by editing `board.json`. It also
  states plainly that nothing here is editable and there is no drag and drop.

### Added, keyboard

- The diagram is walked from the keyboard in reading order, #17. Nodes are drawn in rows and left
  to right inside a row, which is also the tab order, since tab order is document order and no two
  nodes overlap. Enter or Space selects, Escape clears.
- Escape is untouched in the capture phase. `feedback.js` takes Escape there while capture mode is
  on and stops it, so the Escape that leaves capture mode never also throws away the selection the
  note is about.

### Considered and not done

- The `cohort and students` lane is visibly emptier than its neighbours, two nodes against five to
  seven. It stays, #18, closed as not planned. Merging it into `enrolment to claim` would close
  the gap and change what the drawing asserts, because a lane is the claim that everything inside
  it is one kind of thing, and a cohort and a student group are not part of the money chain. The
  emptiness is honest: that stage of the model really is thin.

### Fixed, narrow viewport

- `site/app.css` no longer holds a copy of the drawing's width, #10. `app.js` writes `--drawing-w`
  on `#canvas` from `G.w` on every draw and the narrow viewport rule reads it, with `100%` as the
  fallback. Proved against a copy of `graph.js` with the widths changed. Lesson in KAIZEN.md.
- `build/build_layout.py` refuses to write `site/graph.js` while `site/app.css` contains the
  literal width of either drawing, proved in both directions. The check does not use `\b`, because
  in `1230px` there is no word boundary between the `0` and the `p` and the first version of it
  passed the very form the number takes in a stylesheet.
- The scroll that keeps a selected node in view took both its offset and its limit from the svg
  box instead of the canvas, #9. The drawing does not start at the canvas's scroll origin and the
  extent is the canvas's own `scrollWidth`; at 390px the computed maximum was 855 against a real
  875, so the last 20px could not be reached through that path.

### Measured, not changed

- Issue #9, the drawing cut off at the right edge on a narrow viewport, does not reproduce. The
  canvas has scrolled sideways below the 760px breakpoint since 38a53fb, the tree the issue was
  verified against, and scrolled fully right the rightmost drawn element sits at 352px inside a
  375px canvas at 390x844, and at every width from 320px to 1440px.
- The screenshots that appeared to confirm it are a headless Chrome artefact, not a layout fault.
  Measuring inside an iframe fixed at 390px puts the scroll and the capture in one layout, and the
  right edge is whole. Lesson in KAIZEN.md.

## [0.2.2] - 2026-08-09

The gate is shown failing on the defect it was written for, and stops reading the wrong bytes.

### Fixed

- **`scripts/check_repo.sh` reported `VERDICT: clean` on a repository that still carried a real
  surname.** The name rule was never at fault; the gate was reading the disk, which is the one
  copy of a tracked file that is not the repository. A false assurance, not a gap, and worse than
  a gap. HANSEI.md `2026-08-09-gate-read-the-disk-not-the-repository`.
- `scan_snapshots` closes it: for every tracked path whose index copy differs from the disk, the
  index copy is scanned too, and likewise HEAD's, and a finding names which snapshot it came from.
- A tracked path deleted from the disk took the whole gate down with exit 123, because
  `git ls-files -z | xargs -0 stat` fails and `set -e` does the rest. The byte total is now summed
  file by file, and the deleted path is caught through its index copy, which is the copy that
  matters.

### Added

- Three permanent probes in `scripts/check_repo.sh --self-test`, one per way this defect could come
  back, listed in HANSEI.md `2026-08-09-gate-read-the-disk-not-the-repository`. Every name in every
  probe is invented. The self-test is 27 cases, up from 24.
- `probe_at`, which runs a probe as though its payload sat at a named path, so a probe can prove
  that being one of the gate's own files licenses nothing. That was the excuse this defect nearly
  got away with.
- `FORBIDDEN_ORIGIN` in `scripts/forbidden_lib.sh`, the prefix that makes a finding say whether it
  came off the disk, out of the index, or out of HEAD.

### Changed

- `README.md` and `TPS.md` described a page that makes no outbound request, which the feedback
  port in `2093f4e` made false. Corrected precisely rather than hedged: one same origin fetch of
  `board.json` on load and no third party request; exactly one `POST` to `api.github.com` when a
  visitor who has stored their own token deliberately files; a prefilled `github.com` issue URL
  otherwise. A doctrine file that overstates its own safety is the same class of defect as a gate
  that reports clean while a name is in the tree.

### Security

- The rule this leaves behind, and the one worth carrying to the next repository: **a gate is not
  accepted until it has been demonstrated failing on the real defect it was written for.**
  HANSEI.md `2026-08-09-gate-read-the-disk-not-the-repository`.
- **Still open.** The surname remains in nine ancestor commits of `main`, and an earlier one in the
  first commit. `HEAD`, the index and the working tree are clean and the gate covers all three, so
  nothing new can be committed carrying a name. Rewriting history is a decision with a blast radius
  that belongs to a person; it is recorded rather than done quietly.

## [0.2.1] - 2026-08-09

The gate learns about the half of the repository it was never able to see.

### Removed

- A real surname from a comment in `scripts/gen_forbidden_hashes.sh`, where it stood as the worked
  example of how a register filename is split. The example is now an invented name and the
  explanation is unchanged. Not an exposure: Pages publishes `site/` and nothing else, and that
  was verified against the origin rather than assumed.
  HANSEI.md `2026-08-09-gate-scoped-to-the-public-surface`.

### Added

- `scripts/check_repo.sh`, the repository-side gate and the reason this release exists. It scans
  every file `git ls-files` reports, not just `site/`, against the same salted hash list, and
  fails the build. It reports a matched name by file and line number with the token withheld, the
  opposite of the origin gate and for the opposite reason: there the name is already public, here
  it is not, and a CI log must not be the place it becomes public.
- `.github/workflows/repo-gate.yml`, which runs it on every push and every pull request, in its
  own concurrency group and not `pages`, because it deploys nothing and must never queue behind a
  deploy.
- `scripts/check_repo.sh --self-test`, which the workflow runs first: one synthetic payload per
  rule that must trip, including a real name against a synthetic hash list; payloads that must
  not, including the two declared invented figures, a firm name containing the token `Company`, a
  fractional-second timestamp reading as a Spanish grouped figure, and an ordinary CSS decimal;
  and probes that the declared self-matches are exact, that a stale declaration fails the run,
  that a declaration naming the real-name rule is rejected, and that an empty file list aborts.
- A table of declared self-matches in `check_repo.sh`, which is how the gate scans its own source
  without a blanket exclusion. Each is one exact triple of rule, path and matched string, and a
  triple licenses only itself. Skipping the files was rejected, because a skipped file is where
  the next one of these hides and this one hid in the gate.
  HANSEI.md `2026-08-09-gate-scoped-to-the-public-surface`.

### Changed

- The rules themselves, the banned words, the money pattern and its allowed figures, the timestamp
  mask and the identifier patterns, plus the per-file scan that applies them, moved into
  `scripts/forbidden_lib.sh`. Both gates share one copy, so a rule proved by either self-test is
  the rule that runs in both, and neither can drift. `check_forbidden.sh` carries no rule literal
  of its own any more and its behaviour is unchanged.
- `.github/workflows/board.yml` runs the repository gate on the rendered tree **before** it commits
  `site/board.json`. That commit carries `[skip ci]`, so it is the one path that reaches `main`
  without a push-triggered check.
- `README.md` and `TPS.md` describe three gates rather than two, and TPS.md states the scope limit
  that caused this: a gate on the public surface answers a different question from a gate on the
  repository, and the first does not imply the second.

### Fixed

- Both gates' `cleanup` trap ended on a failed test when there was no temporary directory to
  remove, and a bash EXIT trap hands its own status to the shell, so `check_repo.sh` printed
  `VERDICT: clean` and exited 1 on a clean tree. The same latent defect sat in
  `check_forbidden.sh`, unreached. Both traps now `return 0`. A gate that fails on clean gets
  switched off by the third person it blocks.

### Security

- The safety gate was scoped to the public surface and not to the repository. `site/` is a
  fraction of what is tracked, and everything outside it had been in front of no gate at all.
  Closed by the above.

## [0.2.0] - 2026-08-09

The discipline arrives: the production system this artefact is built under is written down, the
board is real, and the safety gate reads what the public reads.

### Added

- `TPS.md`, `KAIZEN.md`, `HANSEI.md` and this file. TPS.md states which Toyota principles changed
  a decision here and which one was rejected and why. KAIZEN.md is the improvement loop and the
  reflection step. HANSEI.md is five incidents written up honestly, the first of which is why any
  of this exists.
- `scripts/check_forbidden.sh`, the andon cord. It runs after every deploy, takes its file list
  from `site/`, fetches each of those paths from the public origin over HTTP, and fails the job on
  a real name from the teaching register, a euro-formatted figure other than the two invented
  ones, `collection://`, a UUID, an email address, or any of the words that would name a vendor
  architecture. It asserts a non-zero file count, a non-zero byte count and a non-empty hash list
  before it scans, so it cannot report clean on nothing.
- `scripts/check_forbidden.sh --self-test`, one synthetic payload per rule, each of which must
  trip the gate, plus a payload that must not and an empty directory that must abort. Both
  workflows run it beside the live check, so a run reporting clean also means the rules ran.
- `scripts/forbidden_lib.sh` and `scripts/gen_forbidden_hashes.sh`. The names of people who have
  taught for the company are never committed here: the generator reads the vault register locally
  and writes `scripts/forbidden_names.sha256`, one salted truncated hash per name token, and the
  checker folds the deployed bytes the same way. 87 people, 137 tokens. What that buys is
  obscurity rather than secrecy, and the generator says so in its own header.
- `scripts/sync_board.mjs`, which renders GitHub Issues into `site/board.json` as four columns:
  Raw, Backlog, In progress, Done. A `status:` label decides the column and nothing infers one. No
  triage step, no model call, no external dependency.
- `.github/workflows/board.yml`. Fires on issue events and manual dispatch, syncs, commits
  `site/board.json` with `[skip ci]` if it changed, deploys Pages, then runs the gate. Actions
  pinned by SHA. Concurrency group `pages` shared with the deploy workflow, with
  `cancel-in-progress: false`, because a true value there silently cancels deploys with zero steps
  run and the run still reads as finished.
- Five issues for the five defects and constraints known at the time, labelled and on the board:
  the diagram does not fit one screen, the right half of the canvas is empty, instructors and
  session templates are interleaved, eight object types have no populate route, and the toy
  carries no measured values by design. The last is a constraint rather than work.
- Labels `status:raw`, `status:backlog`, `status:in-progress`, `status:done`, plus `layout`,
  `model` and `limitation`.

### Changed

- `.github/workflows/pages.yml` runs the gate after the deploy, states its concurrency behaviour
  explicitly instead of inheriting it, and refuses to run on the board bot's own commit.
  `[skip ci]` on that commit is the primary guard; the committer check is the second line, for the
  day the marker is dropped by a squash or a policy.

### Fixed

- The gate fired on the first `site/board.json` ever written, and was right to: a full ISO
  timestamp ends `...46.932Z`, whose fractional second reads as a grouped figure in Spanish money
  notation, so the money rule read the board's own `generated` field as an undeclared amount. Two changes, in this order:
  `sync_board.mjs` emits second precision, dropping a field nobody needs rather than loosening a
  safety rule for a cosmetic one; and both gates blank timestamps out of the copy the money
  pattern sees, anchored on digits and separators so no figure can hide inside one.
- The board workflow's rebase-retry path re-runs `sync_board.mjs`, which calls `gh`, and the token
  was scoped to the render step only, so two runs fired by one relabel raced and the loser's
  re-sync died for want of the token. It failed loudly rather than committing an empty board,
  which is the assertion in `fetchIssues` doing its job. The token is now on both steps.

### Removed

- One real surname from `BANNED_WORDS` in `build/safety_grep.py`. It was already produced by the
  faculty register that the same function reads, so the literal added no coverage and did add a
  real name to a tracked file.

### Security

- The gate now reads deployed bytes rather than local files. A gate reading the working tree
  answers whether the source is clean, and between the source and the reader sit a build, an
  artifact upload, a cache and a CDN. HANSEI.md `2026-08-09-private-repo-public-pages` is what
  that gap costs.

## [0.1.0] - 2026-08-09

Initial commit. A toy instance diagram of the Zrive operating data model: 11 object types, 26
objects, 32 edges, one screen, invented values only. Coordinates computed at build time by a
degenerate Sugiyama layout in `build/build_layout.py` and shipped as data, so the browser only
draws and every reader sees the same picture. No framework, no build step for the site itself, no
CDN, no web font, no runtime request of any kind. `build/safety_grep.py` is the local gate that
runs against `site/` before a push.
