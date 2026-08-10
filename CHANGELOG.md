# Changelog

All notable changes to this repository. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Dates are ISO. Newest first.

## [Unreleased]

### Fixed

- An issue closed as not planned no longer lands in Done. GitHub closes an issue for one of two
  reasons and the board read only the state, so a duplicate, a wontfix and a finished card were
  the same fact to it. #33 was closed as a duplicate, and because Done reads newest first it
  became the top card of the column: the loudest thing on the board was an assertion that a
  duplicate had been completed, and every future duplicate would have done the same. The
  generator now asks `gh issue list` for `stateReason`, whose values were read off the real
  repository rather than assumed (`COMPLETED`, `NOT_PLANNED`, and an empty string on an open
  issue), and gives a `NOT_PLANNED` closure no column at all. It is not outstanding work and it
  is not finished work, so no column on this board is true of it. It is not dropped either: the
  Done column's `hidden` is now the whole closed set minus the eight cards actually drawn, so
  visible plus hidden accounts for every closed issue with nothing lost and nothing counted
  twice, and the generator asserts both halves of that arithmetic and fails the run rather than
  publishing a count that does not add up. The page says `and 16 more closed` where it used to
  say `more done`, because the count now covers duplicates as well as finished cards and calling
  those done would be the same false claim in a quieter place. `hiddenUrl` still points at the
  repository's closed issues, which is where both kinds can be read. `DONE_VISIBLE` stays at
  eight and still selects the eight highest-numbered completed issues, newest first. board.js
  reads no new field, so an older `board.json` that carries neither `hidden` nor `hiddenUrl`
  still draws. Regenerated against the real repository: 28 issues, 24 closed, 22 completed and 2
  not planned (#33 and #18); Done draws #26 down to #19, all `COMPLETED`, #33 and #18 appear in
  no column, and 8 drawn plus 16 hidden equals the 24 closed. Driven at 1440x900 and 390x844:
  the line renders as `and 16 more closed`, its href is the closed-issues list, it is reachable
  by `elementFromPoint` at both widths once scrolled to, it sits inside its column, and neither
  the line nor the page overflows horizontally.

- The Done column is bounded at eight cards and says how many it is not showing. Every closed
  issue lands in Done and nothing takes one out again, so it grew without limit: at twenty eight
  issues, twenty four of them closed, Done held twenty four cards and the board read as ninety
  percent finished work while the four cards that wanted attention sat beside it. The column now
  keeps the eight highest-numbered cards and reads newest first, because the useful end of a
  column of finished work is what has just moved into it. The other three columns are untouched
  and stay ascending by number, which is the order they were filed in. The remainder is not
  swallowed: `sync_board.mjs` writes `hidden` and `hiddenUrl` on the done column, and the page
  prints a muted `and 16 more done` under the cards, linked to the repository's closed issues. A
  cap that reads as the whole list would be a worse defect than the long column it replaced,
  because the long column was at least true. The board still draws from an older `board.json`
  that carries neither field, and the link is only followed if it is an issues list on
  github.com, the same rule the existing board link obeys. Driven at 1440x900 and at 390x844
  against a real board: Raw 0, Backlog 4, In progress 0, Done 8 with `hidden` 16, the line
  reachable by `elementFromPoint` at both widths, nothing clipped and no horizontal overflow.

- The GitHub connect note names the order the token form imposes, not only the token it wants.
  GitHub preselects `Repository access: Public repositories (read-only)`, and while that radio
  is selected the form does not offer the Issues permission at all, so a reader who fills in
  only the permissions section produces a token that cannot reach this private repository and
  meets a 404 here. The note now says to set `Only select repositories` first and why. Found by
  filing from the deployed site with a token made from the old note; confirmed against the API.
  The 404 explanation in `explainStatus` is unchanged and still lists what to check, because it
  serves the tokens that were made before the note was read. HANSEI.md, ninth entry.

- The connected filing path has now been exercised end to end against the deployed site, which
  closes the caveat that its success half had only ever been driven against a stubbed `fetch`.
  A headless CDP driver put a token into `localStorage`, turned capture mode on, clicked a node
  and filed: the issue was created on the real repository with the title, body, context block
  and labels the code builds, and was then deleted. No token value is recorded anywhere in this
  repository, and none was needed to record the result.

- `copy all` no longer looks alive while it is not, for issue #23. It is disabled while the
  count is zero and comes back the moment a block is copied. Disabling was preferred to making
  it work on an empty list: a clipboard write of nothing that reports `copied` is a lie about
  what the reader now holds, and there is no honest thing for the control to do. The `2`
  shortcut already stood down on the empty case and still does. Driven at 1440x900: with the
  count at zero the button reports `disabled: true`; after one `copy` the count reads 1, the
  button reports `disabled: false`, and clicking it changes the label to `copied`.

- The capture popover is placed in the band between the header and the footer, for issue #22.
  It used to reserve the footer and nothing else, so a click in the header opened the box on
  top of the header, over the feedback toggle that capture mode deliberately exempts so the
  mode can be turned off. Escape still recovered, so it was never a trap, but the exemption
  was defeated by the geometry and the fix belongs in the placement. Both edges are read from
  live rects rather than from `offsetHeight`, because below the breakpoint the page scrolls and
  neither the header nor the footer is pinned to the viewport: a header scrolled out of view
  reserves nothing. Where the box is taller than the band, it scrolls inside itself rather than
  growing past either edge. Driven at 390x844, clicking `ghosts` with the mode on: the popover
  top is 182.8 against a header bottom of 176.8, and `elementFromPoint` at the centre of all
  four header controls reaches the control.

- The same fix corrects a second defect found while measuring it. The popover was positioned
  before its GitHub connect section was rendered into it, so the clamp was computed against a
  height about a hundred pixels short of the real one and the box could then run off the
  bottom of the screen. Anything that changes the box's height now re-clamps it: the connect
  section, connecting and disconnecting, and the result line after a file. Driven at 390x844
  with a click low on the page: the box bottom is 763.3 in an 844 viewport, where it was
  846.5 before.

- Below the 760px breakpoint the detail panel no longer opens on top of the node it describes,
  for issue #21. `reveal()` now handles both axes. The free band is the viewport minus the
  header and minus the sheet; the sheet is recognised by its own geometry rather than by a copy
  of the breakpoint in JavaScript, and its height is read from `offsetHeight` rather than from
  a rect, because the panel is still sliding when `reveal()` runs and a transform moves the
  rect while the transition plays. Whichever element can scroll vertically is the one scrolled:
  the canvas where it has its own overflow, otherwise the page.

- Handling the axis was necessary and not sufficient, which is the part worth recording. At
  390px the page is barely taller than the viewport, about 36px of scroll in total, so there
  was nowhere to scroll to and the vertical pass moved nothing. While the panel is open the
  canvas now reserves the sheet's own height underneath the drawing, which is the room
  `reveal()` uses; the reserve is behind the sheet, so nothing shows in it, and it goes with
  the selection. One number, `--sheet-h`, sizes the sheet and the reserve, because writing that
  measurement twice is how the two come to disagree. Driven at 390x844 over all 30 nodes in
  turn: 28 of 30 were covered by the panel before, 0 of 30 after, each one measured clear of
  both the sheet and the header.

- A typed but unfiled note survives every way of closing the popover, for issue #25. Escape,
  which is also how capture mode is left, and the `3` shortcut both destroyed it silently.
  Notes are held per element and put back when that element is clicked again; a note that has
  been filed stops being a draft. Driven at 1440x900: a note typed, Escape pressed, the mode
  re-entered and the same node clicked reads back the sentence that was typed, and the same
  for `3`, while a different element still opens empty.

- Capture mode no longer pushes the `board` link off the right edge below 400px, for issue #26.
  Turning the mode on widens its own toggle, and `.hnav` kept `flex: none`, so it was sized to
  its own max-content width and its children never met an edge to wrap at. The nav is given the
  row below the breakpoint and wraps inside it. Driven at 320, 360, 390, 414, 760, 1024 and
  1440 with the mode on: every header control is inside the viewport and reachable at every
  width, and the page no longer gains a horizontal scroll it does not otherwise have. Before,
  at 320px, the link sat 71px outside the viewport.

### Changed

- The lane captioned `cohort sessions` now reads `cohort sessions and the visit host`, for
  issue #24. A Company sat in that lane in both drawings and the placement is right: the
  company is the empresa colaboradora, its `hosts visit` edge attaches at session level, and
  the finde presencial is a session-level event. Moving the tile into the companies lane would
  have made the diagram tidier and less true, so the caption was the thing that had to change.

  Of the three ways to make the lane honest, widening the caption was chosen over a sub-caption
  and over marking the one tile. A caption is the drawing's own statement of what a lane holds,
  so a lane that holds one more kind of thing should say so in the same place a reader already
  looks; a sub-caption would have added a second kind of type assertion to learn, and marking
  the tile would have left the caption still asserting a type the lane does not hold. The
  wording names the visit rather than the sessions because the company hosts one visit and does
  not host the six sessions, and it echoes the `hosts visit` chip on the edge, which is what
  the reader sees next. The edge is untouched and still reads at a glance.

- Band captions may run to more than one line, which is what let the caption widen at all: a
  lane is only as wide as the columns under it, so a longer caption has nowhere to go sideways.
  Lines stack upwards from the top of the band, so the last line sits the same distance above
  every lane whatever the caption above it does, and the drawing only gains headroom if some
  lane actually needs a second line. The existing lane-overflow gate now checks every line
  rather than the caption as a whole: a caption that is only legal because it was split has to
  be legal line by line. `build/measure_labels.py` measures the lines, so the check still runs
  on measured widths and not on the fallback estimate. The one cohort viewBox goes from
  1230x574 to 1230x586. Diffed against the deployed drawing: every x coordinate is identical,
  every band x and width is identical, and every y moves by exactly 11, the one line of
  headroom the second caption line needs.

### Added

- A second cohort behind a header switch, for issue #19. `Z-IB 2Q26` is instanced from the
  same six session templates as 1Q26, on later dates, with two of the six taught by a
  different instructor: `Intro to economics & financial markets` moves from Nerea Iribarren to
  Rubén Arizmendi and `Why we value companies?` from Bruno Belaunde to Celia Vandellós. It
  brings its own aggregate students card, 27 against 34. The point is the template versus
  instance split, which is the backbone of the model and which one cohort cannot show: with
  two, the same template objects carry two sets of dated sessions and the reason they are
  different objects is on the page rather than in a document.
- The switch is off by default and the default drawing is unchanged, byte for byte. The two
  views are laid out independently by the build and shipped side by side as `window.G` and
  `window.G2`; the switch redraws rather than hiding nodes with CSS, because a hidden node
  still takes up room in a layout and would have moved the view the switch exists to protect.
  Verified by diffing the generated `window.G` against the deployed bytes: identical, build id
  `5703ece` before and after.
- Two layout facilities used only by the second view. A column may be pinned, which states its
  order and takes it out of the barycentre sweep, and a column may be opened to a share of the
  drawing's height. The session column is pinned because the sweep's answer there is a real
  minimum of crossings and still unreadable: it interleaves the two cohorts and breaks both out
  of date order. The template and instructor columns are opened so a template's two edges leave
  it as a flat fan instead of a near vertical one.
- `build/measure_labels.py` now measures the union of both views, so the opt-in drawing is
  laid out from measured widths rather than the fallback estimate. 82 strings added to
  `build/label_widths.json`; no existing entry changed.

### Not added, and why

- A second enrolment to claim chain. It hangs off every cohort in the same shape, so a second
  copy would have added nine nodes and no relationship the first copy does not already carry.
  The 2Q26 students card therefore has one edge, and its note says why.
- A new instructor for the second cohort. Reassigning two sessions among the five already on
  the page shows substitution across cohorts, which is the thing worth seeing, and adds no node.

- Ghost classes on the diagram, for issue #8. Four classes the operating model needs and no
  system holds are drawn beside the objects that do exist: `Instalment` expected by
  `Agreement`, `Placement` matures `Claim`, `Beca` discounts `Agreement`, `Refund` reverses
  `Charge`. A ghost is a dashed, unfilled, empty tile with an italic label and a dashed edge
  carrying the verb it would carry. The tile is empty because there is nothing in it.
- A legend entry, `does not exist in any system`, drawn as the same empty dashed box.
- A marking on the `Cohort` node rather than a ghost of its own, because that object exists
  and only its key does not: a second dashed outline, the words `no cohort_id` under the
  label, and a `cohort_id` property whose value says no identifier is held anywhere.
- A third property flag, `absent`, beside `dummy` and `estimated`. A dummy value stands in for
  something a system holds; an absent one says no system holds it.
- Clicking a ghost opens the properties panel like any other node. The panel leads with what
  the absence costs in two sentences and carries no figure of any kind.
- A `ghosts` toggle in the header, shown by default, that hides the ghosts, their edges, the
  legend entry and the cohort marking. Default shown because the absences are the finding;
  the toggle exists for the times the question is only about what the systems do hold.

### Not added, and why

- An `Attendance` ghost. It would have to attach to the cohort sessions, which are the tallest
  column in the drawing, and the drawing is sized to one screen. Adding it would have made
  every node smaller for every reader in exchange for a fifth absence. The other four sit in
  the enrolment to claim band, which was the emptiest part of the canvas, so they cost no
  height at all: the viewBox is 1230x574 before and after.

### Changed

- Label widths are measured in a browser instead of guessed in Python, for issue #7. The
  layout used a per character width table written by hand, and because the browser only draws
  what the build already decided, that guess was baked into the shipped coordinates. It was
  out by up to 8.3 per cent on a label as drawn and 19.3 per cent on a label while selected,
  in the direction that matters: the true width was the larger one. Widest miss, `All about
  recruiting in Investment Banking`, guessed 194.10px against a measured 240.66px at the
  selected weight.
- `build/measure_labels.py` renders every string the layout measures as an SVG `text` in the
  exact stack, size, weight and style the stylesheet gives it, reads `getComputedTextLength`
  for each, and writes `build/label_widths.json`. 417 strings, seven contexts: the label
  weight and the selected weight, the same two italic for ghosts, the verb chips, the ghost
  verb chips, and the uppercased letter-spaced band captions. Every contiguous run of words in
  a label is measured, not only the finished lines, because which lines a label wraps to is
  what the widths decide.
- A width is the widest the string takes across every family in the site's font stack that the
  measuring machine can resolve, four distinct faces here, not the width on the machine that
  ran the measurement. The stack resolves differently on different machines and the drawing
  has to hold on all of them. Faces the machine does not hold cannot be measured and are not
  covered; the file records which were.
- `build/label_widths.json` is committed, so the build reads a file and never opens a browser.
  `python3 build/measure_labels.py` regenerates it; `--check` re-measures and reports drift
  without writing.
- The per character estimate stays as the fallback for any string not in the table, so a new
  label cannot crash a build, and every fall back is named on stderr with the command that
  would measure it.
- Two labels now wrap where they did not. `Agreement 0001` measures 84.17px against the 84px
  its column allows, and `Alumnos Z-IB 1Q26` 96.78px against 94px. Both were drawn on one line
  because the estimate said they fitted. The column widths are unchanged: the labels genuinely
  do not fit them.

### Added

- A build gate that refuses to write a drawing in which a label, or a band caption, crosses a
  lane boundary, checked against measured widths at both the drawn and the selected weight
  before a coordinate is written. The build now also prints how much lane the tightest label
  has to spare, currently 4.7px of 250 for `All about recruiting in Investment Banking`.
- A loud warning when wrapping would drop words past the three line cap. It used to truncate
  silently, which produces a page that looks correct and says less than it should.

### Fixed

- The detail panel stayed open on top of the board, issue #20. The route already hides the
  legend, the subtitle and the two diagram toggles because they all describe the drawing; the
  panel describes it too and was the one thing left behind, so a panel about a node the reader
  could no longer see sat over eight of the nineteen cards at 1440 and over the lower 62 per
  cent of the board at 390. It is now hidden rather than closed, so the selection survives the
  round trip and the panel and its node come back together. Found by driving the controls, not
  by looking at them: no screenshot of either view on its own shows it.

- Ghost labels and ghost verb chips are drawn in italic, which is a different face with
  different advances, and were being sized as upright. They now have their own measured
  contexts.

- Runs in the `pages` concurrency group were being evicted before they started, issue #12.
  Three of the last six `board` runs are marked cancelled, at 17:38:47, 17:39:07 and 17:43:55,
  all on rapid issue events and none of them having run a step. `cancel-in-progress: false` was
  already set and is not what failed: it protects a running job, while the group is capped at
  one pending run by default and a new same-group trigger evicts the one already waiting. All
  three workflows now carry `queue: max`, which raises that limit to 100 and processes the
  queue first in, first out. No board update was lost; a later run rebuilt the same board from
  the same issues, which is the sync being idempotent covering for the eviction rather than the
  eviction not happening. `pages.yml` also checks out `main` instead of its triggering sha,
  because a run that can now wait in the queue can also start after `board.yml` has committed
  `site/board.json`, and the older checkout would publish a site without it.

- The repository gate spent its whole runtime spawning processes, issue #13. The real-name rule
  hashed one token at a time, each token costing a command substitution, a `sha256sum` pipeline
  and a `grep` of the hash file. Over this repository that is 8415 token occurrences and some
  34 thousand processes, and timing the loop on its own accounted for essentially the entire
  run. A file's tokens are now hashed in one call and looked up in an in-memory set built once
  from the hash list. Same salt, same sha256, same 16 characters, same tokens, same comparison:
  no rule changed, no file is skipped, no exemption widened, and the four-character minimum is
  untouched. Measured on the same warm machine, 70.5 seconds before and 2.9 after. The
  self-test still passes 27 of 27 and a planted register surname still trips the gate with the
  token withheld.

- The batch hasher is checked against the single-token one at run time, on a known token, and
  the gate stops with an assertion if they disagree. Two implementations of one hash are two
  hashes unless something checks, and a hasher that disagreed with the one that wrote
  `scripts/forbidden_names.sha256` would match nothing and report clean. Where perl is missing
  or cannot run, the old per-token loop is still there and still correct; verified by running
  the whole gate with perl absent, which is slower and reaches the same verdict.

### Fixed, verb chips

- Verb chips are placed on their own edges again, issue #14. The old search offered the chip
  nine fixed points along the curve, took whichever collided least, and if none was clean
  stepped it vertically until it cleared everything. `claims against` finished 133.8px below
  its own edge, alone in white space between the Charge tile and the bottom of the lane, where
  it named nothing; `pays` sat on its curve but the search had put it there by luck. Measured
  from the shipped `site/graph.js` and not from the builder's intentions: worst distance from a
  chip's centre to the nearest point on the edge it names was 133.8px before and 6.0px after,
  and 6.5px is half a chip's height, so every verb now has its own line running through it.
- Each chip starts at the midpoint of its edge by arc length, which is the point that reads as
  the middle of a curve whatever the curve does near its ends. 19 of 36 sit exactly there.
  Where a chip would land on a tile, on a label or on another chip it slides along its own path
  first, because a chip that has moved along its line is still unambiguously on that line, and
  steps off the line only when sliding cannot clear the obstruction. Worst slide along the
  path, 60px on `instance of` for `cs2->st2`, whose midpoint lands on an instructor's name;
  worst offset from the midpoint before, 134.4px, on the chip that had left its edge entirely.
- The choice is a cost, not a rule: 20 per px of overlap, 1 per px slid along the path, 3 per px
  stepped off it, and overlap counted as depth of penetration rather than as a count of boxes
  hit. Counting boxes is what made the old placement brittle, since clipping a padding margin
  by a pixel scored the same as printing a verb across a name, and the cheapest escape from
  either was to leave.
- A build gate refuses to write a drawing in which any chip centre is further from its own edge
  than half a chip height, and the build prints the two worst chips by name. This is the same
  class of defect as a label leaving its lane: the page renders either way, so a diff cannot
  catch it and only a measurement can.

### Changed, header and board

- The header subtitle is per view, issue #15. It sits above both views and only ever described
  the drawing. One sentence each now, and the dummy-values badge, the type legend and the
  `ghosts` toggle are dropped on the board rather than reworded, since all three qualify the
  drawing and nothing on the board.
- Board cards are ordered by issue number ascending, issue #16, which is the order they were
  filed in and the only order `board.json` supports: it carries no dates, and a number never
  changes, so the same issues land in the same places on every build.
- Label chips use the page's own neutral token instead of a hue hashed from the label text. The
  hash invented a colour per label from a palette nothing else on the page uses, and a colour
  that means nothing is a colour a reader has to learn and then discard.
- A card no longer reprints its `status:` label. That label is what put the card in its column,
  so printing it again says the same thing twice and offers a second place to check it. The
  column heading owns the fact.
- An empty column keeps its heading and its zero and says `no issues`, on a dashed outline with
  no panel fill, so that a column holding nothing does not read as a card that failed to load.
- The meta line links back to the issue list, taken from a card's own URL and only if it is a
  `github.com` issue address, so the link cannot be redirected by editing `board.json`. It also
  states plainly what the view is: nothing here is editable and there is no drag and drop.

### Added, keyboard

- The diagram is walked from the keyboard in reading order, issue #17. Nodes are drawn in rows
  and left to right inside a row, which is also the tab order, since tab order is document
  order and no two nodes overlap. Enter or Space selects, Escape clears, and the focus ring is
  the blue the header buttons already use.
- Escape is untouched in the capture phase. `feedback.js` takes Escape there while its capture
  mode is on and stops it, so the Escape that leaves capture mode never also throws away the
  selection the note is about; the diagram's own handler stays in the bubble phase and only
  ever sees the Escapes capture mode did not want.

### Considered and not done

- The `cohort and students` lane is visibly emptier than its neighbours: two nodes against five
  to seven. It stays, issue #18, closed as not planned. Merging it into `enrolment to claim`
  would close the gap and change what the drawing asserts, because a lane is the claim that
  everything inside it is one kind of thing, and a cohort and a student group are not part of
  the money chain. The emptiness is honest. That stage of the model really is thin, and a
  reader who notices the gap has read something true off the page. Recorded here so that it is
  not refiled as a defect the next time somebody looks at the drawing.

### Fixed, narrow viewport

- `site/app.css` no longer holds a copy of the drawing's width, issue #10. `app.js` writes
  `--drawing-w` on `#canvas` from `G.w` on every draw, and the narrow viewport rule reads
  `min-width: var(--drawing-w, 100%)`. Written per draw rather than once because the two
  cohort view is laid out separately and need not be the same width as the default one.
  Proved against a copy of `graph.js` with the two widths changed to 1500 and 1700: at 390px
  the canvas's scroll extent followed to 1520 and 1720, and the stylesheet was not touched.
  The fallback is `100%`, which is the right box for a canvas with no drawing laid into it.
- `build/build_layout.py` refuses to write `site/graph.js` while `site/app.css` contains the
  literal width of either drawing. Proved in both directions: with `min-width: 1230px` put
  back the build exits 1 and names the view, with the custom property it exits 0 and
  `graph.js` is byte identical. The check does not use `\b`, because in `1230px` there is no
  word boundary between the `0` and the `p` and the first version of it passed the very form
  the number takes in a stylesheet.
- The scroll that keeps a selected node in view took both its offset and its limit from the
  svg box instead of the canvas, issue #9. The drawing does not start at the canvas's scroll
  origin, since the canvas is padded, and the scroll extent is the canvas's own `scrollWidth`.
  At 390px the computed maximum was 855 against a real 875, so through that path the last 20px
  of the drawing could not be reached. Both numbers now come from the element that scrolls.

### Measured, not changed

- Issue #9, the drawing cut off at the right edge on a narrow viewport, does not reproduce.
  The canvas has scrolled sideways below the 760px breakpoint since 38a53fb, which is the tree
  the issue was verified against. Scrolled fully right, the rightmost drawn element sits at
  352px inside a 375px canvas, at 390x844, with the second cohort off and on; the same holds
  at every width from 320px to 1440px. The issue reports what a screenshot of a scrolling
  canvas looks like, since a screenshot cannot scroll.
- The screenshots that appeared to confirm it are a headless Chrome artefact and not a layout
  fault. `--dump-dom` and JavaScript run in a window no narrower than 500px whatever
  `--window-size` says, while `--screenshot` captures at the requested width. A scroll driven
  from the page therefore lands at the 500px maximum and the capture then relays out at 390px,
  leaving the drawing 100px short of its right edge. Measuring instead inside an iframe fixed
  at 390px puts the scroll and the capture in one layout, and the right edge is whole.

## [0.2.2] - 2026-08-09

The gate is shown failing on the defect it was written for, and stops reading the wrong bytes.

### Fixed

- **`scripts/check_repo.sh` reported `VERDICT: clean` on a repository that still carried a real
  surname.** The name rule was never at fault: the token was in the hash list, the salt and the
  truncation are one shared copy, `.sh` files are scanned like any other, and folding leaves the
  token intact. The gate was reading the wrong bytes. `git ls-files` names paths and everything
  after it read those paths off the **disk**, which is the one copy of a tracked file that is
  not the repository. The index is what the next commit carries and HEAD is what the repository
  already carries; a correction that lives only as an uncommitted edit makes all three disagree,
  and that was the state. The gate answered "these files are clean" and was read as answering
  "this repository is clean". A false assurance, not a gap, and worse than a gap. HANSEI.md,
  seventh entry.
- `scan_snapshots` closes it. For every tracked path whose index copy differs from the disk, the
  index copy is scanned too, and likewise HEAD's, and a finding names which snapshot it came
  from. In CI the three are identical after a checkout, so it finds nothing there; the false
  clean happened locally, which is where a gate is read most often and trusted most casually.
- A tracked path deleted from the disk took the whole gate down with exit 123, because
  `git ls-files -z | xargs -0 stat` fails and `set -e` does the rest. The byte total is now
  summed file by file, and the deleted path is caught through its index copy, which is the copy
  that matters.

### Added

- Three permanent probes in `scripts/check_repo.sh --self-test`, one per way this defect could
  come back. A real name in the worked example in `gen_forbidden_hashes.sh`, scanned as that
  path with that file's declarations active. A real name in `check_repo.sh` itself. And a name
  staged for commit while absent from the disk, in a throwaway repository the test builds,
  asserting both halves: that the disk scan finds nothing and that the snapshot scan finds it.
  Every name in every probe is invented. The self-test is 27 cases, up from 24.
- `probe_at`, which runs a probe as though its payload sat at a named path, so a probe can prove
  that being one of the gate's own files licenses nothing. That was the excuse this defect
  nearly got away with.
- `FORBIDDEN_ORIGIN` in `scripts/forbidden_lib.sh`, the prefix that makes a finding say whether
  it came off the disk, out of the index, or out of HEAD.

### Changed

- `README.md` and `TPS.md` described a page that makes no outbound request. Since the feedback
  port in `2093f4e` that is false. Corrected precisely rather than hedged: on load the page
  makes one same origin fetch of `board.json` and no third party request; a visitor who has
  stored **their own** fine grained token in **their own** browser and deliberately files causes
  exactly one `POST`, to `api.github.com` and no other host; with no token stored the flow
  degrades to a prefilled `github.com` issue URL in a new tab. No credential is shipped in the
  source, and `scripts/check_forbidden.sh` would fail the deploy on one. A doctrine file that
  overstates its own safety is the same class of defect as a gate that reports clean while a
  name is in the tree.

### Security

- The rule this leaves behind, and it is the one worth carrying to the next repository: **a gate
  is not accepted until it has been demonstrated failing on the real defect it was written for**.
  Not on a synthetic payload resembling it. On the actual bytes, restored into a scratch copy,
  exiting non-zero and naming what it found. A gate that has only ever been observed passing has
  not been observed at all.
- **Still open.** The surname remains in nine ancestor commits of `main`, and an earlier one in
  the first commit. `HEAD`, the index and the working tree are clean and the gate now covers all
  three, so nothing new can be committed carrying a name. Rewriting history is a decision with a
  blast radius that belongs to a person; it is recorded here and in HANSEI.md rather than done
  quietly.

## [0.2.1] - 2026-08-09

The gate learns about the half of the repository it was never able to see.

### Removed

- A real surname from a comment in `scripts/gen_forbidden_hashes.sh`, where it stood as the
  worked example of how a register filename is split into a person and an employer. The
  example is now an invented name, and the explanation, which is the useful part, is
  unchanged. The finding is the irony: the only tracked file in this repository carrying a
  real name was the script whose sole purpose is keeping them out of it. **Not an exposure.**
  Pages publishes `site/` and nothing else, `scripts/` returns 404 on the live origin, and that
  was verified rather than assumed. A near miss, written up as one in HANSEI.md.

### Added

- `scripts/check_repo.sh`, the repository-side gate, and the reason this release exists. It
  scans every file `git ls-files` reports, not just `site/`, against the same salted hash list
  in `scripts/forbidden_names.sha256`, and fails the build. It reports a matched name by file
  and line number with the token withheld, the opposite of the origin gate and for the opposite
  reason: there the name is already public, here it is not, and a CI log must not be the place
  it becomes public.
- `.github/workflows/repo-gate.yml`, which runs it on every push and every pull request. Its
  own concurrency group, not `pages`: it deploys nothing and must never queue behind a deploy.
- `scripts/check_repo.sh --self-test`, which the workflow runs first. One synthetic payload per
  rule that must trip, including a real name against a synthetic hash list; payloads that must
  not, including the two declared invented figures, a firm name containing the token `Company`,
  a fractional-second timestamp reading as a Spanish grouped figure, and an ordinary CSS
  decimal; and probes that the declared self-matches are exact, that a stale declaration fails
  the run, that a declaration naming the real-name rule is rejected, and that an empty file
  list aborts instead of reporting clean.
- A table of declared self-matches in `check_repo.sh`, which is how the gate scans its own
  source without a blanket exclusion. The gate's files carry the rule literals by construction:
  the banned-word table, the currency mark inside the money pattern, the self-test's synthetic
  address and UUID. Each is declared as one exact triple of rule, path and matched string, and
  a triple licenses only itself: the same word in another file, a second address in the same
  file, or the same string under another rule all still fail. Skipping the files was rejected,
  because a skipped file is where the next one of these hides and this one hid in the gate.

### Changed

- The rules themselves (the banned words, the money pattern and its allowed figures, the
  timestamp mask, the identifier patterns) and the per-file scan that applies them moved into
  `scripts/forbidden_lib.sh`. Both gates now share one copy, so a rule proved by either
  self-test is the rule that runs in both, and neither can drift. `check_forbidden.sh` carries
  no rule literal of its own any more; its behaviour is unchanged and its self-test still
  passes every case.
- `.github/workflows/board.yml` runs the repository gate on the rendered tree **before** it
  commits `site/board.json`. That commit carries `[skip ci]`, so it is the one path that
  reaches `main` without a push-triggered check, and a board rendered from an issue title had
  no repository-side gate in front of it until now.
- `README.md` and `TPS.md` describe three gates rather than two, and TPS.md states the scope
  limit that caused this: a gate on the public surface answers a different question from a gate
  on the repository, and the first does not imply the second.

### Fixed

- Both gates' `cleanup` trap ended on a failed test when there was no temporary directory to
  remove, and a bash EXIT trap hands its own status to the shell. `check_repo.sh` printed
  `VERDICT: clean` and exited 1 on a clean tree; the same latent defect sat in
  `check_forbidden.sh`, unreached because every path through it sets the directory first. Both
  traps now `return 0`. A gate that fails on clean gets switched off by the third person it
  blocks.

### Security

- The safety gate was scoped to the public surface and not to the repository. `site/` is a
  fraction of what is tracked, and everything outside it had been in front of no gate at all.
  Closed by the above.

## [0.2.0] - 2026-08-09

The discipline arrives: the production system this artefact is built under is written down,
the board is real, and the safety gate reads what the public reads.

### Added

- `TPS.md`, `KAIZEN.md`, `HANSEI.md` and this file. TPS.md states which Toyota principles
  changed a decision here and which one was rejected and why. KAIZEN.md is the improvement
  loop, the five standing defects and the reflection step. HANSEI.md is five incidents written
  up honestly, the first of which is why any of this exists.
- `scripts/check_forbidden.sh`, the andon cord. It runs after every deploy, takes its file list
  from `site/`, fetches each of those paths from the public origin over HTTP, and fails the job
  on a real name from the teaching register, a euro-formatted figure other than the two
  invented ones, `collection://`, a UUID, an email address, or any of the words that would name
  a vendor architecture. It asserts a non-zero file count, a non-zero byte count and a
  non-empty hash list before it scans, so it cannot report clean on nothing.
- `scripts/check_forbidden.sh --self-test`, one synthetic payload per rule, each of which must
  trip the gate, plus a payload that must not and an empty directory that must abort. Both
  workflows run it beside the live check, so a run reporting clean also means the rules ran.
- `scripts/forbidden_lib.sh` and `scripts/gen_forbidden_hashes.sh`. The names of people who
  have taught for the company are never committed here. The generator reads the vault register
  locally and writes `scripts/forbidden_names.sha256`, one salted truncated hash per name
  token; the checker folds the deployed bytes the same way and compares. 87 people, 137 tokens.
  What that buys is obscurity rather than secrecy, and the generator says so in its own header.
- `scripts/sync_board.mjs`, which renders GitHub Issues into `site/board.json` as four columns:
  Raw, Backlog, In progress, Done. A `status:` label decides the column and nothing infers one;
  an unlabelled issue lands in Raw. No triage step, no model call, no external dependency.
- `.github/workflows/board.yml`. Fires on issue events and manual dispatch, syncs, commits
  `site/board.json` with `[skip ci]` if it changed, deploys Pages, then runs the gate. Actions
  pinned by SHA. Concurrency group `pages` shared with the deploy workflow, with
  `cancel-in-progress: false`, because a true value there silently cancels deploys with zero
  steps run and the run still reads as finished.
- Five issues for the five standing defects, labelled and on the board: the diagram does not
  fit one screen, the right half of the canvas is empty, instructors and session templates are
  interleaved, eight object types have no populate route, and the toy carries no measured
  values by design. The last of those is a constraint on the board rather than work, so that
  changing it is a decision somebody takes rather than a convenience somebody reaches for.
- Labels `status:raw`, `status:backlog`, `status:in-progress`, `status:done`, plus `layout`,
  `model` and `limitation`.

### Changed

- `.github/workflows/pages.yml` runs the gate after the deploy, states its concurrency
  behaviour explicitly instead of inheriting it, and refuses to run on the board bot's own
  commit. `[skip ci]` on that commit is the primary guard; the committer check is the second
  line, for the day the marker is dropped by a squash or a policy.

### Fixed

- The gate fired on the first `site/board.json` ever written, and was right to. A full ISO
  timestamp ends `...46.932Z`, and `46.932` is a grouped figure in Spanish money notation, so
  the money rule read the board's own `generated` field as an undeclared euro amount. Two
  changes, in this order: `sync_board.mjs` emits second precision, dropping a field nobody
  needs rather than loosening a safety rule to let a cosmetic one through; and both gates now
  blank timestamps out of the copy the money pattern sees, so the rule cannot be tripped by a
  timestamp anywhere else either. The mask is anchored on digits and separators, so no euro
  figure can hide inside one, and the self-test proves that in both directions.

- The board workflow's rebase-retry path re-runs `sync_board.mjs`, which calls `gh`, and the
  token was scoped to the render step only. Two runs fired by one relabel raced on the first
  board edit ever made; the loser rebased and the re-sync died for want of the token. It failed
  loudly rather than committing an empty board, which is the assertion in `fetchIssues` doing
  its job, but the run was red for a reason unrelated to the board. The token is now on both
  steps.

### Removed

- One real surname from `BANNED_WORDS` in `build/safety_grep.py`. It was already produced by
  the faculty register that the same function reads, so the literal added no coverage and did
  add a real name to a tracked file.

### Security

- The gate now reads deployed bytes rather than local files. A gate reading the working tree
  answers whether the source is clean, and between the source and the reader sit a build, an
  artifact upload, a cache and a CDN. HANSEI.md's first entry is what that gap costs.

## [0.1.0] - 2026-08-09

Initial commit. A toy instance diagram of the Zrive operating data model: 11 object types, 26
objects, 32 edges, one screen, invented values only. Coordinates computed at build time by a
degenerate Sugiyama layout in `build/build_layout.py` and shipped as data, so the browser only
draws and every reader sees the same picture. No framework, no build step for the site itself,
no CDN, no web font, no runtime request of any kind. `build/safety_grep.py` is the local gate
that runs against `site/` before a push.
