# Changelog

All notable changes to this repository. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Dates are ISO. Newest first.

An entry says what changed and points at where the reasoning lives: HANSEI.md for an incident,
KAIZEN.md for a general lesson, the commit message for the measurements. This file is the record
of what changed and when, and it is meant to be scannable.

## [Unreleased]

### Added

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
- A drag is separated from a click by 5px of movement, or 3px once held for 250ms, and the click
  a drag leaves behind is stopped on `window` in the capture phase, which runs before
  `feedback.js`'s document listener whatever order the scripts load in. **A pan therefore cannot
  file a card**, driven with capture mode on at two widths, from the background and from a node,
  with the repository's issue count unchanged either side.

### Changed

- An instructor's employer is painted only while that instructor is selected, #48. The hidden set
  is the target of an `employed by` edge and never the `Company` type, so Aretxa Capital, the
  colaboradora that hosts a visit and employs nobody, keeps behaving as it did, and a sixth
  instructor's employer would join the rule by existing. The tile, its line and its verb chip
  fade over 120ms into the space the build already gave them: nothing reflows, the view does not
  move, and a hidden employer is out of the tab order and out of the hit test, so capture mode
  cannot file a card about one. The lane caption gains a second line, `employers appear on click`,
  at no cost in height. Lesson in KAIZEN.md, last entry; measurements in the commit message.
- Below 760px the diagram no longer scrolls, #46: the body rule that scrolled the page at narrow
  widths is scoped to the board, which is untouched, and the diagram is one screen at every width
  with the drawing moving inside it. `#graph { min-width: var(--drawing-w) }` goes, since pan and
  zoom is that sideways scroll on both axes and at any scale, and so does the reserve of the
  sheet's height under the drawing that #21 needed, since `ensureVisible()` pans and a canvas
  cannot run out. `app.js` still writes `--drawing-w` and `build_layout.py` still refuses to build
  while a copy of the number sits in the stylesheet; nothing reads the property today, and
  removing that machinery belongs in its own commit.
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
  two views were always laid out separately. Lesson in KAIZEN.md, last entry.
- The frame drawn around a selected node, #45, filed from the live site. A click already inverts
  the tile, bolds the label, dims everything unrelated and opens the panel; the frame was a fifth
  statement of the same fact and the only one that added a shape. **`.node:focus { outline: none }`
  stays and must stay**: reverting `b4e65d0` would bring back the near-black five pixel ring of
  #34, because Chrome keys its own ring on `:focus` for a focusable SVG element. Proved from the
  running document with `CSS.getMatchedStylesForNode`, since a screenshot cannot separate "our
  frame is gone" from "the browser's ring is back". The rect survives as `.focus-frame` on
  `:focus-visible` only, so keyboard focus keeps a mark.
- `--tint-select`, which `b4e65d0` added for the selection frame's fill and nothing else read.

### Fixed

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
  HANSEI.md, ninth entry. The 404 explanation in `explainStatus` is unchanged, because it serves
  the tokens made before the note was read.
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
  a gap. HANSEI.md, seventh entry.
- `scan_snapshots` closes it: for every tracked path whose index copy differs from the disk, the
  index copy is scanned too, and likewise HEAD's, and a finding names which snapshot it came from.
- A tracked path deleted from the disk took the whole gate down with exit 123, because
  `git ls-files -z | xargs -0 stat` fails and `set -e` does the rest. The byte total is now summed
  file by file, and the deleted path is caught through its index copy, which is the copy that
  matters.

### Added

- Three permanent probes in `scripts/check_repo.sh --self-test`, one per way this defect could
  come back, listed in HANSEI.md's seventh entry. Every name in every probe is invented. The
  self-test is 27 cases, up from 24.
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
  HANSEI.md, seventh entry.
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
  was verified against the origin rather than assumed. HANSEI.md, sixth entry.

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
  the next one of these hides and this one hid in the gate. HANSEI.md, sixth entry.

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
  artifact upload, a cache and a CDN. HANSEI.md's first entry is what that gap costs.

## [0.1.0] - 2026-08-09

Initial commit. A toy instance diagram of the Zrive operating data model: 11 object types, 26
objects, 32 edges, one screen, invented values only. Coordinates computed at build time by a
degenerate Sugiyama layout in `build/build_layout.py` and shipped as data, so the browser only
draws and every reader sees the same picture. No framework, no build step for the site itself, no
CDN, no web font, no runtime request of any kind. `build/safety_grep.py` is the local gate that
runs against `site/` before a push.
