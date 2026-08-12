# Changelog

All notable changes to this repository. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Dates are ISO. Newest first.

An entry says what changed and points at where the reasoning lives: HANSEI.md for an incident,
KAIZEN.md for a general lesson, the commit message for the measurements. This file is the record
of what changed and when, and it is meant to be scannable.

## [Unreleased]

### Added

- **`scripts/publish.sh`, one command each way, #107.** `on` creates the Pages site with
  `build_type: workflow`, sets the switch and dispatches the deploy; `off` clears the switch and
  deletes the site; `status` prints three different questions and their three answers, the
  repository variable, what the Pages API has configured, and what the url actually returns, which
  during a takedown or a deploy disagree. `on` prints the terms before it asks: the account is on
  Pro, private Pages needs Enterprise Cloud, so there is no authentication available and on means
  world-readable. That sentence is the reason the site is off and it belongs at the terminal of
  whoever turns it on, not in a document. `--dry-run` prints every call and makes none.
- **The switch itself, a repository variable `PUBLISH`, set to `off`.** Absent counts as off, so
  the safe state needs no configuration and a fork publishes nothing until somebody says so.

- **Collapse sessions into modules and back, #89.** The first thing asked of this artefact that is
  about working with the model rather than reading it, and the north star named on the card was
  "this will be a management tool". `grain: sessions` / `grain: modules` in the view level group of
  the header, beside `weeks` and `gaps`, which is where #98 reserved and measured the space. The
  syllabus has carried `module`, `module_name` and `sequence` on every note since before this
  repository existed and #85 put them on all 83 templates; this draws by them.
- **Both altitudes are built at build time, one per grain per view, each with its own
  `drawingDigest`.** The card decided this and it is the whole architecture: the drawing stays a
  pure function of the model behind a digest `check_build.sh` reproduces byte for byte, and the
  control switches between two artefacts rather than laying anything out. That is what separates it
  from #100's window beside it, which has to be a run-time transform because a window over 24 weeks
  is a continuous parameter; a grain is two states. Heights, sessions then modules: Z-IB 596 to
  666, Z-SC 2470 to 666, Z-BL 2578 to 576, Z-PE 622 to 497, Z-HR 622 to 668, Z-DS 596 to 666,
  Z-CFA 587 to 587. Z-BL loses 78 per cent of its height and Z-SC 73; the four that draw a six
  session sample from a syllabus of six different modules gain up to 70 units, because a module
  tile spends a line saying how many rows it holds and the tile count does not fall.
- **Both syllabus lanes collapse or neither is worth doing.** Z-BL draws 28 session templates beside
  28 cohort sessions, so folding one lane leaves the drawing exactly as tall. A module is therefore
  two tiles, a `Module` in the templates lane and a `Module delivery` in the term lane, joined by
  the same `instance of` the rows under them are joined by. Each takes the column of the thing it
  aggregates, so the modules grain is the same six lanes one altitude up rather than a second
  picture with a layout of its own: the ghost placement, the visit host rule, the lane overflow
  refusal and the chip placement all apply to it unchanged.
- **The count is on the tile's face, in #83's idiom.** A module says "15 of 15 session templates",
  a delivery "15 of 15 sessions", against the module's own count in the syllabus and not against
  the drawing. A tile standing for more than one draws its count as a numeral over a stack of
  cards, which is the aggregate idiom the students card has carried since #41. Aggregation that
  loses the number is how a management tool starts lying.
- **A template in no module stays itself, which is what makes the control explain itself on all
  seven.** Collapsing cannot put a session in a module the syllabus does not. Z-CFA names no module
  on any of its 45 rows, so its modules grain draws the same six template tiles and the lane says
  "no module recorded"; Z-HR names one on four rows of 25, so four modules stand beside two loose
  templates and the caption carries both numbers; Z-DS has twelve modules over 22 sessions, seven of
  them `Modulo 1` to `Modulo 7`, and the drawing says the counts rather than implying a structure
  the seven do not share. The control's own menu states, per view, what each altitude costs in
  tiles, so a press that changes nothing says why before it is pressed.
- **The edges fold and say how many they stand for.** Every relationship crossing a collapsed lane
  is retargeted onto the tile that swallowed its end and folded, one line per pair per verb, with
  the count in the line's own `<title>`. The verb is untouched, which is load bearing and is #100's
  reason: `selection.js`'s reveal table is keyed by verb. Z-BL goes from 133 lines to 44 with 89
  further relationships drawn as lines that already exist, Z-SC 122 to 51 with 71, Z-PE 43 to 33
  with 10; nothing lands with both ends in one module on any of the seven, and that count is
  carried in the document and reported by the control either way.
- **An aggregate takes its members' populate route, which is a decision against the obvious one.**
  Two registry entries of their own were built first and withdrawn. The registry answers one
  question, how a row of a class gets into a system and out again, and a module has no row
  anywhere: it is a value repeated on the syllabus rows it groups, so the only way to get hold of
  one is to read those rows and group them by that field, which IS the session template's route. A
  module delivery is the same sentence over the calendar. What an entry of its own would have
  carried is on the tile now, in its `note`, which is where a statement about one object belongs.
  It also keeps `scripts/routes.py` honest: that reader walks `views`, counts the objects bound to
  each class and refuses a class drawn nowhere, and its walk does not reach `collapsed`, so two
  entries drawn only at the modules grain would have read to it as two rotted classes. Reported
  rather than worked around: a class drawn ONLY at the modules grain is invisible to that reader
  today, and its per class object counts are of the sessions grain alone.
- **A near neighbour and not a new hue, which was already the palette's rule and was not written
  down.** Measured over all 13 colours in both themes, CIE76: the closest pair in light was
  Students / Student at 10.94 and every other pair stood 18 or more apart, and those two are the
  one aggregate and its members the drawing already had. So `Module` is `#039076`, 10.68 from
  Session template, and `Module delivery` is `#b27f00`, 11.54 light and 11.98 dark from Cohort
  session. On the band plate they measure 3.8573 / 3.8569 and 3.4188 / 4.3516, against the 3.0000
  of WCAG 2.2 SC 1.4.11, and both stand 25 or more from every colour that is not their own member.
  One hex each and no dark override. The direction is not part of the rule and is not claimed:
  Students is lighter than Student and Module is darker than Session template, because #81 left
  Session template binding at 3.0346 and a lighter neighbour of it has nowhere to go.
- **State in the address.** `#/p/ZBL/modules`, a second segment and not a query, so every address
  that worked before resolves to the same view; an unknown suffix is the sessions grain, which is
  the answer the code half already gives an unknown programme. The programme picker rewrites its
  seven hrefs to keep the altitude, so moving between programmes keeps it.
- **The reader keeps their place, which is what "smooth nice looking" asked for.** The anchor is
  the selected tile, or the tile nearest the middle of the canvas read off the viewport's own
  numbers. Its counterpart at the other altitude is selected after the refit, so collapsing the
  session you were reading opens the module that swallowed it and expanding the module opens a
  session in it. The join is the module's own name, which the document already carries on both
  sides, rather than a shipped map of ids; a tile in no module joins by id and keeps its place
  exactly. The refit is #100's precedent, taken for its reason: the extent moves by up to a factor
  of four and a view that was not refitted would frame the old picture's size around the new one.

### Changed

- **One browser suite where there were two, #109 #107 #89.** `build/check_grain.mjs` held 33
  assertions about the two altitudes of the drawing and a second copy of the plumbing under them,
  a static server, a Chrome resolver, a CDP client, a launcher, a phase table and a hand-written
  total. It is deleted and the 33 are in `scripts/smoke.mjs`. **144 + 33 = 177**, and the merged
  run records the same 177 assertion names the two suites recorded between them, checked as a
  multiset rather than as a count. #107 declined the merge on the correct ground that no CLAIM was
  duplicated, only harness, and that argument is why it was not urgent; it is not an argument for
  two files. **An intended-total terminator protects only the file it terminates**, which is how
  the 33 could be tracked, green and run by nothing at all for their whole life until #107 looked,
  and **the duplicated harness was not two equal copies**: the grain one scraped the debug port out
  of the browser's stderr with no freshness check, had no launch retry, and watched no console
  error, so the three faults #67 hardened this suite against were live in it. The nine grain phases
  join `PHASES` at the counts that file declared, each now a `group()` so a phase that throws does
  not cost the eight after it, and they get a browser of their own because the page keeps state
  across a hash change. The plan refuses a table with no grain phase in it, since that block is the
  one thing here with no viewport of its own to miss it. `verify.sh` goes from 14 steps to 13 and
  `smoke.yml` from two suite steps to one; the origin-facing verify step now drives both altitudes
  against the published bytes, which the grain suite never did. **Proved by planting defects**: all
  33 conditions negated in one run gives exactly 33 failures, exactly those 33 names, 144 still
  passing and `VERDICT: the page has regressed`; a real defect in the page gives 176 of 177 and the
  same verdict, red in CI; skipping a grain phase gives 173 of 177 and `the suite could not
  answer`; a browser that never starts gives 0 assertions, every phase named short, and the same
  harness verdict rather than a claim about the page.
- **The per session outline is a four rung schema, and the sheet draws each row its own, #108.**
  The owner read the first draft and rejected the register: "The per session outlines need to be
  more serious / academic and structured". **The structure is the row key and it cost no new
  field.** A beat has always been the same `{k, v, f, r, at}` property row every other value on
  this page is, and `k` was carrying an ordinal, "1", "2", "3", which is the position the reader
  can already see. `k` now names which rung of a session the beat is, out of a closed ordered set
  of four: `scope`, the subject matter delimited; `method`, the treatment and its named
  instruments and terminology; `practicum`, the applied work; `outcome`, what the session leaves
  the student holding. They are the four fields a syllabus entry has, so the block reads as a
  schema rather than as a list. `scope`, `method` and `outcome` are compulsory; `practicum` is the
  one optional rung and is written where **the session's own title names the applied work**, which
  is the only session level string the vault holds and therefore the only thing that can decide it
  without adding a fact: 23 of the 83, the group practice cases, the storylining case studies, the
  deep dives, the firm visits, the oratory sessions, the mock round, the assessment day, the Excel
  build, the model fit and the take home case presented to committee. The three against four split
  now carries information instead of being arbitrary. **The register of `v` is the vocabulary of a
  syllabus**, precise nouns and named methods with no rhetorical turn: "why a perfect fit is bad
  news" became "overfitting: in sample against held out error, and the bias variance
  decomposition", which is ds_st3's method row verbatim. **Academic did not mean long**: 272 beats,
  4 to 13 words, mean 8.9, against 4 to 14 and mean 8.6 for the register they replace.
  **A standardised register makes collision more likely, not less**, because academic vocabulary
  repeats where literary vocabulary does not, so it was measured rather than assumed: all 272
  beats distinct, and the highest cross template word overlap over the 3403 pairs is **0.1579**,
  down from 0.2083, Jaccard over the beat text with stop words removed and the labels excluded
  because a closed set repeated by design would inflate every pair by the same constant. The one
  pair the new register did put over the old maximum, the two opening sessions at 0.2609, was
  rewritten rather than accepted. **The six Z-CFA titles stay the named exception**, their titles
  being reading numbers with no subject in them to be academic about: their scope rows say which
  numbered readings and the rest is about working through numbered readings. **The build gate is
  wider by four claims**, all proved armed by mutation: a label outside the closed set, a label
  repeated within a session, labels out of reading order, and a missing compulsory rung. The
  agenda strings also go through the name gate at build time now, which they did not before, the
  block being top-level and invisible to the node walk; the eponym rule is to write the
  descriptive form, and nothing was refused.
- **The block is drawn, and #85's staging is over, #108.** `site/term.js` reads
  `by_template[t.id]`, so the block under a row is that row's, and each line leads with its rung.
  Driven at all seven scopes against a local server: 272 lines over 83 blocks, one block per row,
  no two blocks alike, every line led by one of the four rungs. The four constant lines are gone
  rather than kept beside these, and `agenda.rows` and `agenda.per_session` are gone with them:
  one population, walked once.
- **No text on the page says the content is invented, on the owner's instruction, and the fields
  that say it stay, #108.** "I don't want absolutely any text or comment about the content not
  being real or truthful or whatever. We are focusing on building the architecture of this thing."
  So the block's opening sentence is deleted, no `dummy` badge prints on an outline line, and the
  toggle's own hint now says what the block is rather than where it came from. **`f: dummy` and
  `r: 0_invented` are untouched on all 272 rows**, because those are fields and not a sentence:
  `check_provenance()` reads them, the flag vocabulary is closed, #104's rules refuse a row wearing
  a flag it has not earned, and dropping them would drop the architecture that decides which rows
  a future adapter may overwrite. The provenance shape rule follows its object rather than being
  relaxed: it asked for a note and a table, it now asks for the table, and nothing refused for its
  rows is accepted. Because nothing renders them, `window.ZT.term()` publishes the SET of `f` and
  the SET of `r` over the templates in scope, so a driver can still hold the model to them. The
  model keeps knowing; the page stops saying.
- **An invented agenda written for each session out of its own title, #85 and #108, and the owner
  reversed the safety design to get it.** The block was the same four lines under all 83 templates,
  which was the point of it: an agenda inferred from a title reads exactly like curriculum design,
  and a reader who opened a second row and met the identical four could not take it for a plan. He
  asked for "something ad hoc minimal imagined with the session title", so there are now three or
  four short beats per template, 259 of them, 73 threes and 10 fours, written from the title and
  from nothing else. **What makes the reversal acceptable is conditional and is recorded for that
  reason.** The identical lines bought protection for a world-readable page and there is no longer
  one, the deployment having been taken down under #101 with no private Pages available on Pro. If
  the page is ever republished the trade changes back and this block is the first thing to
  re-examine. Every beat carries `dummy` and `0_invented`, the flag vocabulary is untouched, and
  `check_provenance()` walks the new rows through the same three rules in the same loop as the four
  constant ones, so a rule cannot be applied to one half and forgotten on the other. One statement
  that the block is invented, not the six #91 cut. Two properties are checked rather than promised,
  both in the build: the table covers the drawn templates exactly, so a renamed template loses its
  agenda loudly, and no two templates carry the same beat, which is the mechanical half of not
  collapsing into a formula. The six Z-CFA titles are the stated exception, their titles being
  reading numbers with no subject in them to be ad hoc about. **Staged and not yet drawn**:
  `site/term.js` renders the constant `rows` and `scripts/smoke.mjs` asserts their sameness, both
  held elsewhere, so the sheet is unchanged and smoke is untouched at 139.
- **`scripts/verify.sh` looks for an origin instead of being told about one, and says which server
  answered, #107.** #101 ended with the Pages site deleted, so the two steps that read bytes back
  over HTTP had nothing to read. They are not repaired by being pointed at the tree and left
  printing what they printed before, which is the green-when-the-subject-is-gone defect #103 spent
  a night removing. The run probes the derived url; if it answers 200 the steps read that, and if
  it does not, `python3 -m http.server` serves `site/` on a kernel-assigned port and they read
  that. The verdict is a different sentence in each case, `The origin serves this.` against
  `These bytes serve. No origin was checked, because there is none.`, and the header names how the
  target was chosen. Republishing needs no edit here: the next run finds it.
- **The forbidden-content gate names the server it read, in the banner and in both verdicts.** Its
  file list and its five rules are identical either way and its CLAIM is not, so
  `FORBIDDEN CONTENT IS PUBLIC` is now printed only when something public is serving it and
  `FORBIDDEN CONTENT IS IN THE BYTES THIS TREE WOULD PUBLISH` otherwise. A url whose host is
  loopback is classified from the url, not from how the caller described it, in the gate and in
  `smoke.mjs`, which used to label any argument "a deployed origin". The dead default url is gone
  and no argument is now an abort naming `verify.sh` and `publish.sh status`.
- **`pages.yml` and `origin-freshness.yml` are gated on `PUBLISH`, not deleted.** Deleting
  `pages.yml` would make the next publication a job of writing a deploy workflow again, and leaving
  it armed was the worse half in the other direction, because `actions/configure-pages` creates the
  Pages site and the next push would have republished what the owner had just removed.
  `origin-freshness.yml` has no subject at all without an origin and would go red every fifteen
  minutes about a state nobody intends to change, which is the permanent red its own Andon argument
  says not to build. A gated job is SKIPPED, which is neither green nor red; neither of them passes
  vacuously. `board.yml` carries the same condition on its dispatch so the run list does not fill
  with runs that never intended to do anything.
- **The smoke run against the origin is recorded as a `[SKIP]` with its reason, and is not pointed
  at a second local server.** The step above it already drives the suite at a local server over the
  same `site/`, so a second one would say the same sentence twice and a reader counting green steps
  would count a check that checked nothing new. A skip is loud in the summary and makes the verdict
  say a step did not run, which is the difference between a step whose subject is absent and a step
  deleted for being red.
- **`site/version.js` is unchanged, which is the answer and not an omission.** The tree copy names
  no commit and says `working tree, not a deployment`, which was already the truthful value; the
  stamp is written by `pages.yml` into the artifact at deploy time, so it stays absent while nothing
  deploys and comes back correct on the first deploy after `publish.sh on`, with nothing edited by
  hand. Nothing in the tree claims a deploy that did not happen.
- **`views` still means the seven programmes, and the second grain ships as `collapsed`.** Built as
  one list of fourteen it made `scripts/smoke.mjs` count 146 gaps where the page says 95 and compare
  Z-SC's drawing against Z-IB's document, which is a false regression report about a page that is
  right. A collapsed view is the same objects re-expressed, not more of them. A second list of nodes
  is exactly where this repository's gates have gone blind four times, so `doc_views()` is the one
  answer to "every view in this document", `check_provenance()`, `check_structure()` and
  `refuse_mixed()` all ask it, the loops that derive a route, a mark, an identity and a name walk
  both, and five structure probes and three provenance probes plant their defect in `collapsed` and
  nowhere else. Structure self-test 15 to 20, provenance 34 to 37.
- **The window governs a span as well as a date.** A module delivery runs from its first session to
  its last, so "outside the window" is the span and the window not meeting at all. Reading only the
  first date would have taken a module off the picture in every week of it but the first. The two
  controls have to compose on both altitudes or the collapse is a way of escaping the window.
- **`SYLLABUS_KEYS` gains `module_code`, `module` and `in_the_syllabus`.** The same vault
  frontmatter at module altitude, re-read and refused on drift by `check_module_structure()`. The
  rule is unchanged and still refuses a `real` chip on any key not in the tuple. **Superseded by
  #118: the tuple is gone, the rule reads the (node type, property key) seats a source declares in
  the document, and those three keys are seats on the three module-altitude types.**

### Changed

- **An outline row opens on its own title, #112.** "Session outlines must be shown when clicked in
  the title not just all at once or none at all." The agenda was one page-level toggle: every row
  opened or none did, and on the unscoped `#/outline` that is 83 blocks and 272 lines at once,
  which is not a reading of anything, with no way at all to ask about one row. The title of each
  row is now a button carrying `aria-expanded` and `aria-controls`, and the block it opens carries
  the id it names. Three things the card asked to be decided rather than assumed. **The page-level
  toggle survives as an explicit open-all**, which is useful on a scoped route of six rows and
  useless on 83, and its label says how many rows it is about before the press rather than after
  it: `open all 83 session outlines`, `open the other 82`, `close all 83`. **The target is stated
  and not inherited from the text box**: #84 measured a text-shaped target at 39,4 by 3,0px, so
  `min-height` holds this to #77's 26 and the padding keeps a one-line title off it. Measured, the
  smallest of the 83 is 49,9 by 26 at CSS widths 3072, 1536, 768 and 1440, which is browser zoom
  50, 100 and 200 per cent at a 1536 device viewport, and 343 by 26 at 390; the title's own line
  box inside it is 15,4, which is what the target would have been worth had the text been left to
  be the control. **Which rows are open is on the address**, as a query rather than a fourth path
  segment so that 83 open states do not multiply the 16 published routes: `#/outline?open=st4`,
  `#/outline/ZSC?open=all`, and no parameter at all when none is open. Written with
  `replaceState`, on the reasoning `close()` already runs on, so opening six rows costs one press
  to get back and not seven. `ZT.term()` gains `agendaOpen` and `agendaParam`; `agenda` still means
  what it meant, that every row in scope is open, and is derived from the per row set rather than
  being a boolean somebody set.
- **The week filter leaves the window and nothing else, #111.** Filed on a `rect` in `#graph`:
  "The whole point of week filter is to not see this (only the week, clean)". What he was looking
  at is #100's own answer to the half of the problem #100 was right about. A filtered drawing
  carried one stub tile per lane reading `N tiles outside this window`, every edge that lost an end
  terminated on one of those stubs as a dashed folded line, and every lane caption grew a fourth
  line reading `6 of 28 in this window`. On a three week window over Z-BL that is 56 tiles replaced
  by four stubs, 104 relationships replaced by dashed lines into them, and six extra caption lines:
  a picture of the filter rather than a picture of the three weeks. **Honest bookkeeping and a
  clean view were treated as one requirement and they are two.** The stubs, the folded lines and
  the fourth caption line are gone from `render.js`, and with them the classes that painted them,
  the unit-separator fold key, the `outside` branch in every node and edge path, and the guard
  `selection.js` needed against a veil rule firing on a stub. **An edge with an end outside the
  window is not drawn.** A filtered drawing is now the tiles of the model that are in the window,
  the lines between them, and the three caption lines the build wrote.
- **The count moved to the header, which is where a number about what is not on screen already
  lives, #111.** Beside `weeks: 3 of 24` and `gaps: 11 of 95`. The window control's own title
  states it, and its menu carries the sentence and the per lane breakdown the captions used to
  hold, each lane named with the label the build gave the band so nothing invents a second
  vocabulary for the same six columns. `render.js` counts what it drops and hands it out on
  `windowState()` as tiles, relationships and lines: the last two differ at the modules grain,
  where one line stands for many, so both are reported and neither is inferred from the other.
  `term.js` asks for it rather than caching it, at the moment the control restates itself, because
  the answer is per drawing and the window is per page; `windowChanged()` now tells the drawing
  before restating the control, or it would print the previous window's effect for ever, and
  `app.js` calls `term.restateWindow()` beside `describeGaps()` after a change of programme or of
  altitude. The menu's own note said the drawing DIMS what is outside the window, which stopped
  being true at #100; it now says the drawing shows the window and nothing else. Both grains
  reflow onto the build's canonical coordinates with the window on, unchanged: worst dy, dp and
  arrows 0,1 and no edge reversed on ZBL and ZSC at both altitudes.

### Fixed

- **A `real` chip needed a key with the right name and now needs a seat a declared source filled,
  #118 F27.** `real-flag-needs-a-source` tested one thing, whether the row's key was one of six
  words in a tuple in `build/model.py`, so the audit renamed a Programme row of invented prose to
  `module`, ranked it `3_observed`, and #104's own flagship mutation shipped green. Re-run at
  `24b45b5` to confirm rather than quoted: the builder exits 0, `check_build.sh` says clean, the
  provenance self-test still says 37 of 37, and `site/instance.js` carries
  `{"k": "module", "v": "academic team", "f": "real", "r": "3_observed"}` on the Z-IB Programme
  tile. The escape was a spelling and not a forgery, which is the direction that matters.
- **What "has a stated source" means is now written down, in the document, and it is three
  things.** `provenance.sources` declares each source: the `corpus` that was read, the date it was
  `read_on`, the `rechecked_by` gate that re-reads that corpus wherever it exists, the `rank` and
  `flags` its rows carry, and `covers`, the (node type, property key) seats it filled. A `real`
  value on an invented document has to sit in one of those seats. Read off the document and not off
  `build/model.py`, like the four vocabularies beside it, so an `--instance` deployment is judged
  against the sources it declares; a document declaring none may carry no `real` value at all,
  which is stricter than the tuple was.
- **A seat is a population and not a permission, which is the part that stops a rename.** Every node
  of a covered type carries each covered key exactly once, checked before the row walk. Two rows
  under one key is a row taking a name that is already spoken for, and a covered key missing
  altogether is a reading deleted, which the membership test could not see either because it only
  ever looked at the rows still there. `module` on a ModuleDelivery is a seat and `module` on a
  Programme is not, and that sentence is the whole of the audit's A3.
- **The six key names are a consequence now and `SYLLABUS_KEYS` is gone rather than derived.** A
  tuple nobody reads is the next thing somebody edits instead of the table. They fall out of
  `covers` and the gate prints them from it when it refuses. Adding a value with a source is
  declaring the source, the corpus, the date and the gate that re-reads it.
- **And the source's own claim about a recheck is joined to the code.** `check_module_structure()`
  and `check_syllabus_counts()` record themselves when they run, and a source naming a gate this
  program defines and did not record is refused. A gate that does not run re-reads nothing, and
  every value resting on it would be resting on nothing.
- **The limit is stated and is not closed by any of this.** The vault is not on the machine that
  builds this document, so nothing here can compare a string against the corpus. Delete the genuine
  `modules` row off a Programme and rename an invented row into the empty seat and the population
  is intact and the seat is forged. That is a different act from renaming a row into a list, it is
  irreducible without the corpus, and on a machine that holds the vault
  `check_module_structure()` re-reads and refuses the drift.
- **The downgrade direction of the same seat, which is F28's gate-side half and was an open gap.**
  `check_provenance` had no rule for a value from a real source flagged `dummy`, and the model's
  argument against the symmetric rule was correct as far as it went: eight `module_name` rows and
  two `modules` rows are legitimately `absent`, so "every syllabus row is `real`" is false. The
  rule that survives that objection is the narrower one: a covered row wears one of the flags ITS
  SOURCE declares, `real` or `absent`, and no third thing. Proved by construction at `24b45b5` on
  the audit's own B2, `module_code` and `module` downgraded to `dummy`: the pre-fix builder exits
  0 and ships them, this one refuses with `source-row-flag`.
- **Provenance self-test 37 to 52 probes**, fourteen new refusals and one new control, and all
  fifteen were run against the pre-fix body in a checkout at `24b45b5`: **15 MISS of 15**, so every
  one of them is a document that body accepted. The commit message that landed the change says
  thirteen refusals and is wrong; the count is fourteen. The 328 rows that carry `real` at
  `24b45b5`, 164 in `views` and 164 in `collapsed`, are byte identical row for row and in the same
  order after the change, and the only difference in the whole shipped document is the new
  `provenance.sources` block.
- **Nine assertions were narrower than their names and the behaviour each one is named for could be
  deleted at 184 of 184, #115.** Every row below was closed the way the card asked and not by
  reading: the defect its name describes was planted, the whole suite run, the named assertion
  shown red, then restored and shown green. Eleven plants, eleven reds.
- **The filtered drawing is recomputed in the driver now, which closes F9, F18, F11 and F21 with one
  instrument.** `window.ZT.reflow()` is `faithful(CANON)` and `CANON` is what the build wrote, so
  its answer is filter-independent by construction: displacing the filtered drawing by 37px moved
  the picture and left the printed line byte identical. `filtered()`'s own calls to `place()` and
  `edgeGeom()` were covered by nothing, and the edges were ungated in both directions, halving the
  drawn lines and re-pointing a vanished end at a surviving tile both shipping green. The new
  reading in `scripts/smoke.mjs` joins `site/layout.js` and `site/instance.js` itself, re-derives
  the column list, the pitch and the top margin, packs the surviving columns with the builder's
  own rule, and computes each arc from the two tiles it joins. Given the tiles on screen as its
  input it decides where every one belongs, which lines there should be and the shape of each.
  Under the 37px plant it names the tile and the offset on all four drawings; under draw-fewer it
  reports 14 lines missing of 28 wanted; under draw-more, 82 drawn where 28 are right.
- **Presence and absence, which is what F18 was about.** The suite checked the surviving edges and
  never that the rest had gone, and the two numbers its comment said were "asserted against each
  other" were one number routed through the window control's `title`. The expected edge set is now
  computed from the canonical relationships and the tiles on the canvas, and the two sets are
  required to be equal.
- **`a window is on and has taken tiles off the picture` reads the tiles, F11.** It asserted only
  that the window said it was on; the suite computed `shown` and discarded it. Disabling the line
  in `site/render.js` that marks a node outside the window left the window on, taking nothing off,
  and it stayed green; it now goes red naming 80 of 80 on Z-BL.
- **The modules-grain window predicate has a both-directions reading, F21.** `site/term.js` reads a
  module's span and its own comment names the wrong arithmetic; swapping to it took Z-BL from 24
  tiles to 0 of 34 with every gate green, because the only check was `hidden.length > 0`, which a
  filter that deletes everything satisfies. The driver judges every dated tile from its own date or
  span, written as the interval overlap rather than as a copy of the expression it checks.
- **The guard on the standing of the content sweeps the whole document, F26.** It read leaf text
  under two containers, one word stem, one route, in whatever shape the sheet happened to be in, so
  the exact sentence #110 deleted put back into a chip's `title` shipped green and a synonym in the
  footer shipped green through `verify.sh`. It now sweeps every element's text AND its attributes,
  over a vocabulary, on every address the page publishes, in every shape each offers, with the
  outline rows disclosed. The board is deliberately not swept: a card there quotes a repository
  issue written by somebody else, and a guard that cries wolf is a guard somebody turns off.
- **The downgrade direction is enumerated over all six syllabus keys and both grains, F28.** It was
  one assertion reading two keys off one selected template, so `module_code` and `module` flagged
  `dummy` shipped green through everything: `check_provenance` has no rule for a real value flagged
  dummy and, after #110, nothing renders the flag either. `absent` stays legitimate, for the reason
  `build/model.py` argues; any other token is refused, and each of the six keys must appear.
- **The module tile's count is recomputed from the other altitude, F12.** `tails.every(...)` over a
  list filtered by the words it then matches is vacuously true on an empty list, and the number
  inside the idiom was read by nothing: a tile could say "all 14 session templates" of a module
  holding fifteen and every gate was green. Each count is now joined against the session templates
  the sessions grain files under that module, and which form of the idiom is used is itself checked.
- **The programme picker is enumerated rather than sampled, F10.** The probe was
  `#pgmenu .pgitem[href$="/modules"]`, a selector that can only return an item which kept the
  altitude, beside a count that is the picker's size. Six of seven losing the grain was green.
- **The capture suite proves the page can file, #118 row F2.** Every assertion it made about the
  recorder was an absence, and the file control was never pressed, so `window.__smoke.opens` was
  never observed non-empty and the stub's own `window.open` override was never proved live. With
  `fileIssue()` made a no-op the whole phase was green while the one channel by which a reader
  reports a defect was dead. The control is now pressed with no token stored and exactly one window
  has to open, at the prefilled issue form of the repository the published board draws its cards
  from, carrying a title, the feedback label and a body quoting the element the capture named.
- **A fourth kind of phase, `narrow`, so the phone half of #113 has somewhere to run, F22.**
  `behavioural` runs at the viewport that can drive a pointer and that viewport is the widest, so
  the gutter pair `site/app.css` declares at 390 was a second declaration with nothing pointed at
  it: zeroing both was green while the outline group heading, the outline data cell and the calendar
  month heading all went from 16 to 0 on a phone. The two assertions are the relationships the pair
  at 1536 makes and not the pixels, so a breakpoint that changes the two numbers keeps them.
- **The fourteen drawing digests were correct and covered less than the drawing, #116.** Every one
  recomputed and matched; the finding was scope. The type registry paints every tile's glyph,
  colour pair and accessible label out of `drawing.types` and was outside all fourteen, so one
  glyph changed in `build/model.py`, rebuilt for real, repainted 91 tiles across nine of the
  fourteen drawings with `site/layout.js` byte identical, every digest unchanged and `verify.sh`
  clean. **What the digest is FOR is now written down**, in `build/model.py` above
  `drawing_digest()`: are two pages drawing the same picture from the same data. That decides the
  scope instead of a byte count, and the scope is exactly the object `site/app.js` hands
  `site/render.js`, which is the view payload, the geometry and the registry. The same glyph
  change now moves 14 of 14; a comment edited in `site/render.js` moves none.
- **The code that paints stays OUTSIDE the drawing digest, argued rather than widened by reflex,
  #116 row F4.** Folding `site/render.js` in would make every presentation edit invalidate all
  fourteen drawings at once, which destroys the one thing the value is good for, telling a data
  difference from a code difference; which code a page runs is already answered by the commit in
  `site/version.js`. What that file held that belongs under a digest is the glyph GEOMETRY, so the
  symbol table is fingerprinted on its own as `glyphDigest`, carried by the geometry document and
  therefore covered by the byte-identical rebuild gate that already existed. One stroke moved in
  `PATHS` with both generated documents untouched used to pass every gate in the repository; it is
  now refused by name, and it moves that one value and none of the fourteen.
- **`documentDigest`, over every top-level block of the instance document.** A second question and
  not a wider answer to the first: `agenda`, `routes`, `provenance` and `default` reach no drawing
  and do reach the reader, and putting them in a drawing digest would be wrong. Nothing in the
  data document is outside every digest now. A word of `routes.vocab` prose edited moves this and
  none of the fourteen.
- **`scripts/check_build.sh` reads the digests, which nothing did.** `drawingDigest` occurred zero
  times in every gate this repository runs. The census recomputes all fourteen from the shipped
  documents, recomputes both document-wide values, and refuses a tile bound to a symbol the
  renderer has no strokes for, which is a live latent case: `stack` and `ghost` are named in
  `TYPES` and are in no `PATHS` table, and today no tile reaches either because a group draws its
  count and a ghost is deliberately empty. **A terminator, #116 row F7**: `EXPECTED_DRAWINGS=14` is
  written by hand and asserted before any population the documents supply is walked, because every
  assertion downstream of it is equally true of thirteen drawings. Self-test 36 probes to 53; all
  seventeen new ones miss against the body this file had before the card and two of them miss
  against the builder as well.
- **The two copies of the token-folding rule were never the same rule, #117, and it is the fifth
  time one rule in two places has bitten this repository.** `build/safety_grep.py` said of its own
  folding "this is the same rule `scripts/forbidden_lib.sh` applies in `fold_tokens`". The library
  folds with `tr -cs 'A-Za-z'`, so an underscore separates; the Python copy searched the folded
  text with `\b`, where an underscore is a word character. One invented name in thirteen
  placements scored 13 of 13 in the library and 6 of 13 in the Python copy, the seven misses being
  exactly the seven with an underscore in them, over a page carrying 477 of 2607 distinct strings
  with one. **CI refused what the gate a person runs before pushing called clean**, which is
  precisely the gap the local gate exists to close. The same boundary defect was in the
  banned-word rule, three placements of three, and the local gate had no email rule at all. The
  folding was wrong in a second way that was not the boundary: iconv's TRANSLIT turns a letter
  with no canonical decomposition into ASCII letters and Python's NFKD deleted it, which both lost
  a token the library produces and joined the letters either side into one it never produces.
- **And the check that would have caught it is the one nobody ran: feed both implementations the
  same input and compare the answers.** The defect survived three readers who each confirmed the
  copies agreed by checking that a change was present in both files, which is a different claim.
  Both sides now expose `--fold-tokens`, one token per line, and `check_repo.sh --self-test` puts
  four corpora through both and refuses a disagreement: the bytes the page ships, every tracked
  file, a name in seventeen placements, and every code point below U+0180 inside a letter run.
  Twenty one further probes run both GATES end to end on one payload against one synthetic
  register, sixteen where both must refuse, four controls where both must pass, and **one declared
  disagreement asserted in both directions**, so closing it means editing the file in front of a
  reader. Repo self-test 95 to 120, forbidden 16 to 19; against the pre-fix body the new probes
  score 13 MISS of 25 and 3 of 3. Shape chosen and argued on the card: two implementations plus a
  differential test, not one implementation, because the Python copy also looks for the whole
  spelling of a person every one of whose name words is below the token minimum, which both CI
  gates are blind to, and folding the two into one would have dropped it.
- **Three rules the comparison found on the other side, added to the library.** The unhyphenated
  page id and the corpus host, which the local gate had and both CI gates did not, so a page id in
  a tracked file was refused over `site/` and invisible to the two gates that read everything.
  And the line structure is flattened before the money pattern reads it: the pattern allows
  whitespace between a figure and its currency mark, a line break is whitespace, and prose wraps,
  so that was one match to the file reader and two clean lines to grep. Measured over every tracked
  file: zero page id matches, and the flattened and unflattened money scans return the identical
  match set on all of them.
- **`doc_views()` existed twice with two different rules and the weaker copy was the one wired to
  the gates, #117 F1.** `build/model.py` resolves the views of a document by name and
  `scripts/routes.py` by shape, and both files assert in prose that this is one question asked
  twice. `check_structure`, `check_provenance` and `build_layout.py`'s geometry blacklist all ask
  the by-name copy, so a third top level list of view-shaped entries was read by `routes.py` and
  walked by nothing in `build/`: proved by construction, a `zoomed` list carrying one violation of
  each of four separate rules built clean, the build printed 14 views and 570 nodes while the
  document on disk held 15 and 572, and the byte-identical node placed in the named `collapsed`
  list was refused. A `view-list-declared` rule now refuses any top level list of view-shaped
  entries under a name the gates do not walk, reading the same `VIEW_LISTS` the walk reads. **Not
  by making the other copy shape-based**: this fails on the day the list is added rather than
  silently widening the walk, and it is what makes the two resolvers give the same answer on every
  document that can be built. Structure self-test 20 to 22, the probe being the audit's own
  mutation with a list that is legal in every respect, so the rule is proved to fire on the name,
  and the control beside it a top level list that is not view-shaped and must be left alone.

- **Two dead controls in the smoke suite, found by round 6 and closed beside #114.** A dead control
  is an assertion that would still pass if the behaviour it names were removed, and both of these
  were proved dead by deletion rather than argued. **The suite never loaded a document cold at any
  address but the default**: every route was reached by setting `location.hash` or by
  `Page.navigate` to a url differing only in the fragment, which is a same-document navigation, so
  `route()` deleted out of `term.start()` gave 177 of 177 with every deep link to the sheet dead on
  a cold load, and the construction-time resolution deleted out of `router.js` gave 177 of 177 with
  a cold `#/p/ZBL` drawing Z-IB. The assertion named "a collapsed view survives a reload of its own
  address" survived both, because it reaches that address by fragment. A `cold load` phase, four
  assertions, drives the page to a state through its own controls, reads the address the page wrote
  off `location.hash`, and **reloads that string**: the programme, the altitude, the sheet it names
  and the row it names all have to come back. No address in it is constructed. **And "keeping
  place" could not tell the right tile from the wrong one**: both assertions read `sel.type` and
  nothing else, so with `twin()`'s module-name join replaced by "last same-side tile wins" the
  reader goes from `bl_st1` in M01 to the M05 module and back to `bl_st28`, and the suite still
  reported 177 of 177. Both now read the module off the panel, which is where the reader reads it,
  and require the module the template says it is in and the module tile the collapse landed on to
  be the same module. Every one of the four defects above was planted and run whole; smoke 180 to
  184.
- **A transform framed against a box the canvas did not have, #114, and it is not a runner flake.**
  `model and reveal` failed in CI on three commits and went green on a re-run of each, twice logged
  as a flake; two of the three report the hit test at the same absurd pair, 511294 by 192646, which
  is 333 times the widest viewport it runs at. `#/board` is the one route that sets `display: none`
  on the drawing, `viewport.js` clamps a rect of nothing up to one pixel, and `applyView()` framed
  that one pixel across the whole element: a viewBox under a unit wide, a rendered scale of 900
  where `view.k` held 1.19, and every tile in it six figures wide. `board.js` loads after `app.js`,
  so the class comes off one hashchange listener later than `refit()` reads the box, and the
  `ResizeObserver` that repairs it delivers in the next rendering update. **No reader ever meets
  that frame**, because the observer runs before paint; anything reading `getBoundingClientRect()`
  in the gap does. Forced locally by delaying only the repairing delivery, the suite as it stood
  reproduces `the point (511294.0, 192646.0)` to the pixel, on `t1`, and loses 66 of its 177
  assertions to it. **Fixed at the write and not at the reading**: `applyView()` takes the same
  `vw > 2 && vh > 2` test `init()` and `refit()` already use, in the one place that writes the
  transform. `scripts/smoke.mjs` keeps its own guard beside it, because a rect on a pan and zoom
  surface means what it says only while the rendered transform is the one the page's three numbers
  describe: `stableRect()` now demands `ZT.view().w` and `.h` equal the canvas box, which over 98
  samples differ by 0 and are asserted as equality with no tolerance, and `getScreenCTM().a` agree
  with `view.k`, which over the same samples agree to 3.6e-6 and are given 1e-3. **Neither is a
  retry and neither widens what `requireHit()` demands**: the point is measured once, in a state the
  page agrees it is in, and a state that never arrives is reported with both numbers. One assertion
  at every width, on the cause rather than the symptom, since whether the six figure rect is still
  there when a driver looks depends on the runner and whether the page wrote it at all does not.
- **The chip queue sorted one tiebreak short of the build's, #106.** `build_layout.py` orders the
  verb chips `(-span, s, t)` and `render.js` ordered them `(-span, s)`, which differs only where
  two lines leave one node with one span. Counted at `5f32209`: 34 such groups over 175 of the 455
  edges on the seven sessions drawings, and 62 groups over 264 of 740 across both grains. Chip
  placement is greedy along the arc, so the first chip of a group takes the best slot and the rest
  take what is left; both sorts are stable, so the two copies agreed only for as long as the model
  happened to emit each group already in `t` order, which nothing promises. No gate could have
  seen it: `check_build.sh` reproduces the canonical drawing, and this code runs only under a
  window, where there is no second copy to compare against. The tiebreak is added rather than the
  divergence watched.
- **Five false or dead records in `site/`, #106, and the counts were recounted rather than
  carried.** The palette block said four of the six `--c-*` ramp entries are read by nothing and it
  is five, and was five at `0d23157` where the sentence entered; it said nine rules read
  `--c-gray-3`, which was 9 at `0d23157`, 10 at `a39bf13`, 12 at `3c7be9e` and 10 at `5f32209`.
  **The expensive half was the repair it named**, "a `--line` token for those nine rules", which
  converts nine and leaves the rest behind in the one token whose purpose is that every line
  agrees. No count is written back: nothing asserts either figure, so neither could go red when it
  moved, and it moved in both directions. Same removal at the plate argument lower in that file
  and at `selection.js`'s ghost paragraph. The reflow check's own comment claimed "every node and
  every edge" and leaned on "the four constants below": `faithful()` never compares `cx`, `cy` or
  `cw`, so no chip is checked, and of the fifteen constants below that line it exercises five. It
  now says which five and what a green run does not cover.
- **Five dead things went with them, #106**, each proved by `git log -S` finding one commit for the
  name, the one that added it. `shortDate` in `term.js` and `viewAt` in `app.js`, both twins of a
  called function beside them; `wrapTo`, `laneRoom` and `nodeAt` in `render.js`, which existed for
  the out-of-window stub tile #111 removed, leaving the helpers standing. Also `capButtons()`,
  exported and never called from `site/` or from `scripts/smoke.mjs`, which reaches those controls
  through DOM selectors; and the class `tile-ghost`, emitted on every
  ghost tile, occurring once in the whole tree at its own emission site, and never once carrying a
  rule, since ghosts are styled through `.node.ghost .tile-bg`. `measure(items)` took an array and
  batched it into one hidden group under a comment saying a wrap therefore cost one layout rather
  than one per candidate line; its only caller always passed one element, so the saving was never
  taken. Folded into `widthOf()`, because an unused generality reads as a used one.
- **The board's mirror banner named two of the four copies of the status vocabulary, #106.** It
  pointed at `scripts/sync_board.mjs`, the other side that READS the labels, and said nothing about
  `scripts/set_status.sh`, the only thing that writes them and rejects anything else, or about
  `KAIZEN.md`, which tells a contributor what the four are. All four are now written out in the
  banner. Nothing checks them against each other, which is why they are listed rather than
  described: a `status:` label `set_status.sh` will not set is a column no card can reach, and it
  fails silently, with the issue sitting in Raw.
- **Two more copies of the same rotting count, and the README's assertion total, #106.** The
  contrast exemption in `scripts/check_repo.sh` carried the `--c-gray-3` figure twice, once as an
  enumeration that had fallen two rules short and once, worse, as the size of the same `--line`
  repair. Both lose the number. And `README.md` opened the smoke suite's description with "Ninety
  seven assertions", right at `81ccf0f` where it was written and wrong at every commit since:
  `EXPECTED_ASSERTIONS` read 139 at `02459ac`, 144 at `5f32209` and 177 after #109 folded the grain
  probes in. The suite has carried a terminator asserting its own total all along, so the figure
  was asserted in one file and typed in another, and only the typed one could go stale. The
  sentence now says the suite prints it, and says the list under it is not exhaustive either, which
  was the second half of that defect and the reason the row was left for this card rather than
  fixed with a new numeral.
- **Two entries above went false and are corrected in place rather than rewritten, #106.** The Z-BL
  withheld-firm row says the tile's note "says why", which was true when written and stopped being
  true at `7d2d121`, where #101 took the reason out; and the #65 ghost-grey row states "nine rules"
  twice, right at `62d5384` and a count of nothing since. Neither entry is edited, because an entry
  rewritten to match today reports a state that never existed on the day it claims. Each carries a
  bracketed correction under it naming the commit that falsified it and pointing at the live copy,
  `build/model.py` beside `WITHHELD_FIRM` for the first and `site/app.css` for the second. **This
  is a record defect and was never an exposure one**: `CHANGELOG.md` is not served, and the public
  half of the withheld-firm finding closed at `7d2d121`. Adopting the bracket as the house shape
  for it: history stays, and the reader is told at the point of reading rather than three hundred
  lines later.
- **The sheet had no left gutter at all, #113.** Filed on a month heading as "a bit more space to
  the left". Measured at 1536x839 first, and it was not a misalignment between two things: the
  container `#termrows`, the outline's group heading, the outline's data cell and the calendar's
  month heading all had a box at left 219, the container's own `padding-left` was 0, and the
  painted text was at 229 on the three table readings and at 219 on the month heading, which has
  no padding of its own. Two things wrong, then: no gutter, and the two readings ten pixels apart
  from each other. One gutter, declared once on `.sheet-rows`, which is where the container is
  defined, plus one token `--row-inset` that every rule positioning painted text now reads: the
  cells, both kinds of group heading, the phone layout's row padding, and `.cal`, which had none
  and is why the month heading was the odd one. 6 + 10 at these widths and 4 + 12 on a phone, each
  pair summing to the 16 the head above is padded at, so the rows line up with the sheet's own
  title at both widths with no second number to keep true. A gutter of 16 in its own right would
  have cost 32px of a fixed-width table at 390. Painted left edges, before then after, at 1536x839:
  outline group heading 229 to 235, module heading 229 to 235, data cell 229 to 235, calendar month
  heading 219 to 235, container box 219 to 219 with its padding 0 to 6. At 390x844: 10, 12, 12 and
  0, all four to 16. No horizontal overflow at 390 before or after, `scrollWidth` 390 against a
  `clientWidth` of 390 on all three routes, and the phone chrome share is 17,3 per cent either way.
  **#94's assertion did not fail on this and the card expected it to**, which is worth the
  sentence: it compares the heading's painted text with the ROW's painted text, so it is already a
  relationship rather than a pixel and a gutter on the container moves both by the same 6. It would
  have failed a gutter smuggled in per heading, which is what the card was warning against. It is
  unchanged. Two assertions added beside it, both relationships: the rows start inside the
  container and on the same x as the title over them, and the two readings of the term start their
  text on one x. Proved in the failing direction by zeroing `--sheet-gutter`, which fails the
  first, and by taking the inset off `.cal`, which fails the second on month 225 against cell 235.
- **`build/check_grain.mjs` was run by nothing, #107 #89.** Tracked, executable, green, 33
  assertions on the largest thing built in a day, and no step of `scripts/verify.sh` and no
  workflow invoked it: `scripts/routes.py`'s own row in #103, in a new place, dark within an hour
  of that card closing. Step 13 of `verify.sh` and a step of `smoke.yml`, which is the pairing
  `routes.py` already has. Wired in rather than folded into `scripts/smoke.mjs`: none of the 33
  restates a smoke assertion, so no rule is duplicated and this is not #106's shape; what the two
  files share is harness, which is a maintenance cost and not a gate that can go dark. Both carry
  the same hand-written terminator, so neither can be emptied one probe at a time while the merge
  waits for a card that can measure it.
- **`scripts/routes.py` was blind to the modules grain, #107 #89.** It walked `doc["views"]` and
  nothing else, so its per-class counts were of the sessions grain alone and a class drawn only at
  the modules grain read to it as a class declared and drawn nowhere. #89 worked around it by
  giving its two aggregates their members' populate route. `doc_views()` now answers "every view in
  this document", matching **by shape** and not by name, so a third altitude is walked the day it
  ships rather than the day somebody remembers this file. Proved both ways on a document with one
  collapsed-grain node given an undeclared class: the version before the fix printed
  `VERDICT: every class is declared` and exited 0, this one named `modules ZIB mod_m01` and exited
  1. Clean it reads 14 views at 2 grains, 330 objects at sessions and 240 at modules.
- **Both of the above were found by the agent that built #89, on its own work, and not by the
  audit.** The audit's round 6 exists to test for exactly this class of structural weakness, and a
  builder reporting the two blind spots its own card left is the better of the two ways for them to
  surface.
- **`build/measure_labels.py` produced no measurements at all once the table passed the engine's
  argument limit.** It base64'd its payload through one `String.fromCharCode.apply(null, bytes)`,
  which spreads every byte into the argument list; the page threw "Maximum call stack size
  exceeded" inside the browser, the element stayed empty, and the caller saw only "the page
  produced no measurements" with no hint that the failure was a size. Chunked at 8192.

- **The build refuses a model that is not well formed, #102.** Nothing anywhere asserted it. The
  audit injected a duplicate node id into `build/model.py`, ran the real build, and the whole
  static set said clean: build exit 0, provenance self-test clean, `check_build.sh` printing
  "VERDICT: clean. The committed drawing is the build's own output", repo gate clean. That verdict
  was true. The drawing was the build's own output; the build had agreed to draw 28 nodes carrying
  27 ids, two tiles on one point, and 90 units of reserved height for a tile nobody can see.
  `check_structure()` now runs on the emitted document inside `build()`, before one coordinate is
  computed, with six named rules: `node-id-unique`, `edge-endpoint-exists`, `edge-is-not-a-loop`,
  `edge-declared-once`, `node-class-declared`, `empty-input`. The shipped document is 7 views, 330
  nodes, 461 edges, at `e437139`.
- **The edge rules run before the geometry, which is where the diagnosis comes from.** `layout()`
  builds its adjacency with `adj[e["s"]]`, so an edge naming a node that does not exist died there
  with a bare `KeyError` naming neither the edge nor the id, after the earlier views had already
  printed. It now reads `ZIB edge 'prog' -'leads to'-> 'no_such_node' names 'no_such_node' as its
  target and no node in ZIB carries that id`, and the self-test asserts the naming rather than the
  exit code.
- **An orphan node is legal and is counted, which is a judgement and not an omission.** A view
  says which objects it is about, and an object can belong in one with no relation of it drawn
  there; the destination is a management tool over a whole funnel, where a class with nothing
  attached yet is exactly the state worth showing. So the count is printed on every build, per
  view, rather than refused. The shipped document has none, in any of the seven.
- **A self-loop is refused rather than drawn better, and the reason is stated.** A self relation
  is not absurd in general. It is refused because this layout draws an edge BETWEEN TWO COLUMNS
  and has no shape for one inside a column, which is the same reason Student sits in column 4. The
  emitted path runs backwards through its own tile with the arrowhead at angle 0. If one is ever
  wanted, the drawing gains a shape for it first and the rule is what makes that a decision.
- **The flag vocabulary is closed, and it ships, #104.** `f` is the provenance flag the reader
  sees, and `check_provenance` read it at exactly one place, inside the four agenda rows, never in
  the node walk. There was no set of the four values anywhere in the tree. `f = "banana"` was
  accepted and went into a class name; `f` deleted outright from all 3109 node rows was accepted.
  `VALUE_FLAG` now ships in `provenance.vocab` beside the ranks, the statuses and the stances, and
  `flag-vocabulary` refuses a token in no vocabulary, on node rows and agenda rows alike.
- **`real` means something checkable, and the limit is stated first.** 121 invented values shipped
  flagged `real`, past seven green gates, on a page whose footer says every number on it is made
  up. Nothing here can prove a value IS real: the vault the syllabus rows come from is not on the
  machine that builds this, so a `real` row carrying the wrong module name still ships. What is
  checkable is the pair. `real-flag-not-invented` refuses a row flagged `real` and ranked
  `0_invented`, whose own definition is that nothing was read, in any document; that is the rule
  the audit's flagship mutation trips. `real-flag-needs-a-source` refuses, on an invented
  document, a `real` outside the one population with a stated source, the syllabus keys at
  `3_observed`, which is what catches a registry row flagged `real` on a rank that clears the
  first rule. Closed in one direction only: eight `module_name` rows are `absent` because the
  syllabus records those sessions in no module, so a syllabus row is not obliged to be `real`.
- **Both self-tests now assert their own probe total, which is the third copy of that pattern.**
  `ok/total` is a ratio and cannot tell a suite that ran everything from one that ran half of
  itself: delete a rule with its probe and it printed a smaller clean number and exited 0. That
  failure has happened twice here, in the smoke suite at 14 of 14 on a fifth of itself and in the
  contrast gate on a partial palette. `PROVENANCE_PROBES` 34, `STRUCTURE_PROBES` 15, both edited
  with the probes or not at all. `check_build.sh` names `node-id-unique` and
  `edge-endpoint-exists` again from the shell, so emptying the suite of either takes two files.
- **Every rule was proved in both directions on the real build path**, by injecting each mutation
  into `build/model.py` and running `build/build_layout.py`, which is the route the audit used
  rather than the private `--instance` seam. Nine mutations refused by name, the orphan accepted
  and counted at 1, the untouched model clean. `site/layout.js` is byte identical and the seven
  heights are unmoved at 596, 2470, 2578, 622, 622, 596, 587; `site/instance.js` differs by the
  flag vocabulary alone.
- **The header says what needs attention, #98.** A management tool answers three questions: where
  am I, what needs attention, what can I do. The heading answered the first and the nav the third;
  the second was answered nowhere, on a page whose model already knows it. `gaps: N of 95` is that
  answer, and it costs the header nothing: measured before and after on every route at three
  viewports and both themes, the header is 43px wide-screen and 107px at 390, byte for byte the
  same as without it, and phone chrome stays at 23.7 per cent.
- **95 and not 482, and the boundary is the model's own.** Of the 482 rows flagged `absent`, 303
  are the `n.route` rows saying how a class gets filled at all, which is the same fact on every
  tile of that class, and 84 are on ghost tiles, where the tile is already the finding. What is
  left is 95 values a real object should have and does not: 38 templates with no `duration_min`,
  13 with no `location_mode`, 11 sessions with no `teacher_assigned`, and six smaller sets. The
  split is read off `node.route`, so a class that gains a property lands on the right side of it
  with no list of field names anywhere in the page.
- **It counts what the view is SHOWING, one rule, and every route follows.** On the diagram, the
  tiles on the canvas, which #100's window has already filtered and whose cascade has already
  taken out the templates and instructors that were only there for a filtered session: Z-BL goes
  31 over the whole term to 5 over three weeks. On `#/calendar` the sessions that reading lists
  and on `#/outline` the templates, scoped to one programme when the address is, with the window
  applying to the calendar and not to the outline, which is #90's split kept by #100. On `#/board`
  and `#/students` it is withdrawn, where the window control already goes, and the published
  object says `null` there rather than zero, because "nothing is missing" and "this question is
  not about this view" are different answers.
- **The composition is the point.** "What is missing in the next three weeks" is the question a
  reader brings to a Monday meeting, and it is now two controls side by side rather than a report
  nobody can run. `#/calendar` at three weeks takes 11 sessions with no instructor down to 1.
- **The count agrees with the sheet by construction.** The calendar's one row is the same eleven
  the term sheet has carried as `noInstructor` since #80, asserted against it, so the header and
  the sheet cannot come to say different things about the same sessions.
- **Room for #89 is measured rather than assumed.** Its control belongs in this row, in the
  view-level group as `grain: sessions`, beside the two it composes with. A 91.33px control of
  that label inserted into the nav at 390 by 844 leaves the header at 107px and the nav at two
  lines, and at 1536 at 43px and one line, with no sideways scroll either way.
- **The time dimension, #88 and #90 as one card.** #88 asked for the calendar as a calendar,
  monthly and weekly; #90 asked for a filter down to a range or a week, naming the use, "checking
  the next 1-3 weeks to discuss with the team". They are one problem, which is how a reader works
  with a term too large to see at once, and answered apart they would have been two unrelated
  controls over the same 166 days. Two axes now: SHAPE, which belongs to the calendar reading, and
  WINDOW, which belongs to the page because the term is on the drawing too.
- **A month grid, and it is what `#/calendar` opens on.** Measured first: the months hold 16, 20,
  17, 9, 8 and 13, so six panels of 8 to 20 fit and the April and May gaps against February's 20
  are the reading. Seven weekday columns from a Monday, whole weeks per panel so the columns line
  up down the sheet, and the Saturday and Sunday columns put the in-person weekends on screen,
  which no ordered list of the same rows does. `minmax(0, 1fr)` on the tracks rather than `1fr`,
  which is what keeps a session title from setting a column's floor: `#termrows` measures 375 of
  375 at 390 by 844 in both themes, so the grid adds no sideways scroll to a sheet that has one
  elsewhere.
- **A week grid, built because it was asked for and kept honest.** 71 of the 83 sessions start at
  18:30 and the other 12 at 10:00, so a week here is two rows rather than a day of stacked hours,
  and the sheet says exactly that, counted off its own rows. 24 panels, one per week that holds
  anything, each seven days.
- **THE WARNING IS INSIDE EVERY PANEL.** A table of invented dates still reads as a table; a month
  grid is the first view here that looks like something a reader could plan against, so the
  disclaimer is on the face of each panel and a crop of one month carries it. Four layers on the
  calendar now: the subtitle, the notice above the rows, a sticky banner at the top of the scroll,
  and the panel head.
- **A time window over the term, #90, with the anchor visible.** One to three weeks from an
  anchor, or the whole term, from one control in the header. The list drops what is outside it,
  because a list is an agenda and ten rows is what a team reads in a meeting; the two grids and the
  drawing keep everything and mark the band, because the shape of the term is what a grid and a
  picture are for. Over the 83 sessions a rolling three-week window holds a median of 10.
- **The module structure the drawing has never had, #85.** Every syllabus note in the vault
  carries `module`, `module_name` and `sequence` beside the title the tiles are already labelled
  with, and a session template shipped five properties, none of which said where in a programme
  the session sits. All 83 templates now carry both, and the Programme tile carries the module
  count. `SYLLABUS_MODULES` and `SYLLABUS_ROWS` in `build/model.py` are read once by hand and
  written once, for the reason `SYLLABUS_SESSIONS` is: the vault is on one machine and the build
  runs in CI. `check_module_structure()` re-reads it on any machine that has it, compares all
  seven module lists and all 83 rows against the vault by sequence, and refuses the build on
  drift.
- **`real`, a fourth flag, and the first one that is not a kind of placeholder.** Until this card
  every property VALUE on the page was invented and the session titles were real only because a
  title is the node's label. `module_name` and `sequence` are the vault's own frontmatter, so
  rendering them `dummy` beside an invented attendance figure would say the opposite of what is
  true. It is a flag and a rank: `3_observed` with no read date, which computes `unread` and is
  never fit to act on, and `check_provenance()` refuses the two coming apart in either direction.
  The gate was extended and not relaxed: `toy-value-not-invented` used to say "every value except
  the registry rows was made up", which this card makes false, and the two new rules close the
  third population from both sides. Self-test 20 to 27.
- **Z-CFA is a finding and not a blank.** Its syllabus names no module on any of its 45 rows, and
  the outline says so where the module heading goes rather than showing nothing, the same answer
  its empty instructor lane already gets. Z-HR names four modules over 25 sessions with one
  session each and 21 outside, and Z-PE names three over 36 with 9 outside; the Programme tile
  carries the sentence and it is written from the table rather than typed. Z-DS's twelve over
  twenty two are a different object again: seven are `Modulo 1` to `Modulo 7`, which is a slot and
  not a subject, and the other five name a role or an activity. The word module does not name one
  kind of thing across the seven and the drawing says the counts rather than implying a structure
  they do not share.
- **The outline is grouped by module and both readings take a programme, #84.** `#/outline/ZSC`
  and `#/calendar/ZSC`, sixteen addresses in all, built by the one function that publishes them so
  a driver reads them rather than constructing them. The unscoped pair stays: the term across the
  seven exists nowhere, which is why the calendar was built unscoped, but a syllabus belongs to a
  programme and a reader arriving from a Z-SC tile is asking about Z-SC. At 79 rows the flat list
  was unreadable and the module grouping is what fixes it.
- **The lane heading is a control, and it is a measured one.** He pressed `all 25 session
  templates` expecting the outline; that caption renders 39,4 by 3,0 CSS px at fit with the pan
  cursor over it and nothing listening, and #77 had just taken every control here to 26 by 26 from
  eleven of eleven failing SC 2.5.8. Worse, its size moves with the zoom, which no other control's
  does. The target is now a rect inside a group carrying `scale(1/k)`: width follows the lane and
  height the caption, each held at 26 when the zoom takes it under. Measured on Z-SC and on Z-BL,
  the two tall drawings, at the three scales: **26x26 at k=0.10, 57,3x26 at fit, 2000x96 at k=8**
  for the templates lane and 26x26, 32,5x26, 1136x272 for its neighbour, with 9,6px still between
  the two targets at the smallest scale. Both lane headings are controls, because one being a
  control while its neighbour is decoration is worse than neither. A press and drag over one is
  still a pan, asserted.
- **An invented session agenda, #85, and it is not what a literal reading of the request would
  have produced.** The vault holds no session-level content at all: every syllabus note is
  frontmatter with no body. A per session agenda inferred from a title would have produced 83
  different plausible plans, and plausible is the property that makes invented curriculum
  dangerous. What ships is **the same four lines under every template**, so a reader who opens a
  second row sees the identical four and cannot take them for a plan for this session. Off until a
  control says what it turns on; every line carries the same `dummy` badge an invented property
  carries in the panel, on the line rather than on the block; the block sits behind a heavy rule
  on its own ground, indented off the row, in a register no published value uses; and the first
  thing inside it says the lines are the same everywhere and are not a proposal, which is what
  survives a screenshot of the block alone. It is a block of the instance document and
  `check_provenance()` walks it, for the reason the registry, the provenance block and the counts
  block each needed the same treatment.

- **The term, read twice, #80 and #82.** `#/calendar` is every cohort session on the seven
  drawings in date order and `#/outline` is every session template in curriculum order: one sheet,
  two readings, 83 rows seen once as when a thing happened and once as what is taught. Both cards
  said "I dont know where", and the answer is the node: a cohort session opens the calendar and a
  session template opens the outline, from the panel that describes it, which is where both were
  filed from. The header takes no sixth control.
- **The scope is all seven programmes, and that is the decision.** Every session records
  `route_system: Notion, one session calendar per programme per quarter`, so a calendar of one
  programme is a copy of a page the business already has. One term across the seven exists
  nowhere. The route is the first place it exists, and the sheet says so under the rows.
- **A date shaped view says it is invented three times over**: in the subtitle, in a notice above
  the rows that cannot be scrolled away, and on a sticky banner row inside the table, so a
  screenshot of the rows alone carries the disclaimer. It also declares its sample, #83's rule
  applied to a route: 83 of the 260 sessions the model counts, said in the sentence over the rows.
- **The gaps are the reading.** 11 sessions have no instructor named and every one of those rows
  is marked, not merely counted; 21 delivered, 14 confirmed and 48 planned; none of the 83 carries
  a recording reference; 38 templates record no duration. A calendar is opened to find what is
  missing.
- **The one to one is stated as a property of the drawing, not as a fact about Zrive.** All 83
  templates have exactly one delivery, and with one cohort drawn a template can have at most one,
  so it is what the drawing was built to produce. What a template is for, that it outlives its
  deliveries, cannot be seen at one to one. The outline says this in its own notice and the text
  is written from the measured maximum, so it stops claiming one to one the moment a second cohort
  arrives.
- **`site/term.js`**, the fifth module, and it arrived the way `site/index.html` said a fifth
  would: a script tag and a name in app.js's check. It is not in router.js because it is the one
  view here with no opinion about which of the seven programmes is drawn.

- **Every lane that draws a sample now says so, on all seven views**, #83. The session template
  lane read "session templates" while drawing six tiles of a syllabus holding up to seventy nine,
  and said nothing anywhere: no count on the tiles, none in the caption, none in the footer. The
  lane next door has declared its sample since #51, "4 of the 34". The two lanes now read
  "6 of 79 session templates" and, under "cohort sessions", "6 of 79 scheduled", or "all 28" where
  the view draws the lot.
- **The totals are declared once and the sentence is written from them.** `SYLLABUS_SESSIONS` in
  `build/model.py` holds one number per programme, counted from the vault's syllabus folders;
  the Programme tile, the Cohort tile and both band captions are written from it, so none of the
  four can disagree with the others. It is not counted at build time because the vault is on one
  machine and the build runs in CI, where a build that read it would either fail or quietly
  produce a different drawing. `check_syllabus_counts()` re-counts the folders on any machine that
  has them and refuses the build on drift, and says out loud when it could not check rather than
  passing in silence.
- **`build/bands.py`**, the lanes and their captions, one copy read by the builder for geometry
  and by the measurer for text. A caption computed per view cannot be hand copied into a second
  file, which is what `build/measure_labels.py` held before.
- **A gate for #78's finding.** A session template label carrying a clock, an `@` venue or a date
  is a delivery wearing a template's clothes, and #78 caught one by reading. The build now scans
  every shipped template label for all three and refuses. 83 templates scanned, none carries any
  of them.

### Removed

- **Every reader-facing statement about the standing of the content, #110, on the owner's
  instruction: "I don't want absolutely any text or comment about the content not being real or
  truthful or whatever. I don't care about that. We are focusing on building the architecture of
  this thing."** A rule enforced all night is withdrawn, so nothing shorter was kept and no copy
  was moved somewhere quieter. Out of the page: the footer's sentence and the two live counts
  inside it, `#footn` and `#footdrawn`, whose only writers went with them; the flag badge beside
  every property value in the detail panel; the line under each property list summing it by the age
  of the sources behind it; the definition of the `dummy` and `absent` flags in the gaps
  disclosure, leaving the half of that sentence that is about the machinery; the last clause of the
  calendar chip's `title`, which was off screen until hover and off screen is not absent; and the
  word before "term" in the window menu. Measured on the running page over 26 routes at three
  viewports in both themes, by a sweep proved live against the previous commit, where it returns
  the footer sentence on all seven drawings: **zero matches in visible text, in any `title` and in
  any `aria-label`.** The footer is 93 CSS px on a 390 phone before and 39 after, taking the header
  and footer together from 23,7 per cent of that viewport to 17,3.
- **The saying and not the knowing, which is the line the card draws.** `f` and `r` still ship on
  all 3113 values, the flag vocabulary is still closed, `check_provenance` is still 37 probes and
  #104's rule still refuses a value whose flag and rank disagree. The route rows still open every
  property list and still say which system records a class and where the answer is that no system
  does, because that names a system rather than judging a value. What stopped is the page turning
  any of it into a sentence. The one place this cost a rendering that was not itself a claim is the
  panel's summing line, whose buckets were the age of a source read: its remaining buckets could
  not be shown without either naming the rows that have no source or under-reporting the list they
  sit under, and a page that under-reports itself is worse than one that says nothing.
- **The two board titles that said it from the tracker, and two more with them.** `sync_board.mjs`
  publishes issue titles verbatim, so the public board is a second route onto the page that a sweep
  of `site/` does not reach. #5, #101, #104 and #108 were retitled to what each constrains or
  found. #5 keeps its body and its labels and is not closed: it is a standing constraint about the
  safety gate, and a card that survives a decision should say so, which a comment on it now does.
- **Three smoke assertions changed and none dropped, so `PHASES` and `EXPECTED_ASSERTIONS` are
  both unmoved at 139.** The count of statements on the page is the same measurement with zero as
  its expected number, and it stays because an instruction that says absolutely none is one that a
  single surviving copy defeats. The panel's published-values assertion reads the flag off
  `window.GI` instead of off a badge and gained a clause demanding that no badge is printed. The
  outline's was compound and was split: the clause about the deleted note went with the note, the
  clause about the flags stayed and reads the token sets `term.js` publishes for the purpose, and a
  clause was added for the absence of the badge. Both new clauses were proved in the failing
  direction against planted defects rather than assumed, as was the stronger claim that no two
  outline blocks are alike, which fails at 1 of 25 when every template is made to draw the same
  block.
- **This resolves #101 rather than repairing it.** That card was open because the page claimed
  everything was invented while 1493 of its 3109 values recorded that they had been read off real
  systems. Deleting the claim takes the false claim with it: a page that asserts nothing about its
  own truthfulness cannot assert something wrong about it. The contradiction it measured was real
  and the credit is the instruction's, not a fix's.

- **The visit's ghost edge to the Programme, #75 and #108, on the owner's reversal.** #75 had
  shipped two edges under one verb from the empresa colaboradora, a solid `hosts visit` to the
  Cohort and a declared ghost to the Programme; he wants the cohort edge alone. The solid edge is
  untouched. Both readings of the visit were true, so this is not a correction of a fact but a
  judgement about how much one relationship should be made to say, and the absence the ghost marked
  is already stated on the host's own note and in its `cohort_that_attended` row. 461 edges to 455,
  six of the seven routes each losing one; 330 nodes, 3113 values and all seven drawing heights
  unchanged. #63's arc goes with it: the span of 3 belonged to the line that reached the Programme,
  and no route now draws an edge as an arc slung under its row. **The declared-ghost mechanism is
  deliberately kept and is now exercised by nothing.** A ghost declared as a fourth element on an
  edge tuple, unpacked in `edge_parts()` alone, is a capability distinct from a ghost derived from
  a ghost node at an end, and whether the model keeps a mechanism no edge uses is the owner's call
  rather than a tidy-up. Derivation still runs and still covers the four ghost nodes; both the
  ghosts block and the edges block in `instance_document()` now say plainly that nothing declares.
- **Five of the six statements that the data is invented, #91 and #93, and he asked twice.**
  "Remove all this taggs, I know that. Remove all of them." and "Remove all this text. A good UI
  must be self explanatory. Too verbose". Measured on the deployed page before the cut: on
  `#/outline/ZBL`, 34 data rows under 255 words of explanatory chrome, 7.5 per row, of which
  `#termnotice` alone was 213 words and 225 CSS px; on `#/calendar`, six distinct statements of the
  same thing on one screen. Over-marking fails the way under-marking does, and the sixth copy makes
  the first weaker. Deleted: the subtitle chip on both readings, the invented-value paragraph, the
  fragmentation and no-template findings, the module-structure and one-to-one paragraphs, the
  per-shape paragraph, the sticky banner row inside the table, the sticky banner over the grids,
  the warning on the face of every grid panel, the hint beside the agenda toggle, and the same chip
  on the student list one route along. What is left in `#termnotice` is controls.
- **The wording of the survivor is untouched, and that is deliberate.** One page-level provenance
  statement remains, in the footer, character for character as it was. #101 is open on whether its
  claim is even true, since nearly half of the shipped values are flagged as read off a real system
  while `provenance.stance` says invented; whether the page stops claiming total invention or stops
  shipping the observed material is the owner's decision. These two cards are the COUNT and not the
  claim, and the smoke assertion that guards the count reads a count and never the sentence.
- **What was kept, and why it is not the same thing.** The per-node route provenance stays: "no
  system holds it" is the answer to which system records a value, it is the finding #80 was filed
  for, and it is modelling content rather than a disclaimer. So does the window's paragraph, which
  is state feedback for a control a reader can see set to three weeks over an unfiltered outline
  and is absent unless one is set. The reasoning the deleted paragraphs carried is in `site/term.js`
  and here, which is where reasoning belongs: a finding a reader has to meet as a paragraph over a
  table is a finding the table failed to make. What each calendar shape is for is on the shape
  button's own title, which is the move #79 made for the other three instructions.

### Changed

- **The time window filters the drawing now, #100, and #90's dim is gone.** He filed it from
  `#graph`: "The whole poitn of this filter is to just render the diagram of those weeks. Just show
  the selected sessions, etc. so that visualization is better". #90 had answered the window with a
  class, every tile left where the build put it and the ones outside the window at 16 per cent, and
  the argument for that was an argument about a gate rather than about a drawing. It produced a bad
  picture: a reader of Z-BL had three lit tiles inside a 2578px column of quiet ones. Under a three
  week window that drawing is now 24 nodes and 508px, and the fit stops framing it at rather more
  than a quarter of full size and frames it at full size.
- **The restack is one dimensional and is the build's own `pack()`.** Bands are vertical columns at
  a fixed x with tiles stacked down them, so filtering removes tiles from columns and the honest
  repair is to close the gaps and leave x alone. No reordering: the canonical drawing already
  decided which tile sits above which, and a second opinion about that at run time would make the
  picture jump for a reason nobody asked for. Two of the four numbers `pack()` needs are read off
  the canonical drawing rather than copied from the build, because they are visible in it.
- **The cascade, which is what "etc." meant.** A session template whose only session the window
  took out has nothing left to be a template of, so it goes, and so does the instructor teaching
  none of what is left and the employer of that instructor. The rule that works is not "drop what
  is left with no edges", which was tried and was wrong because every template is also joined to
  the programme: it is that a node is dropped when every neighbour the window has an opinion about
  is dropped, and being KEPT spreads the same way, which is what saves the employer of an
  instructor who is still teaching this week. On an empty week, and the term has gaps in April and
  May, it reaches everything and the drawing becomes six lanes each stating how much of itself is
  outside the window, which is a true picture of that week.
- **An edge whose far end the window removed does not vanish.** Removing a line in silence is how a
  management tool starts lying: the reader cannot tell filtered from absent, and absent is the more
  interesting of the two on a page whose subject is what the business does and does not record. So
  every lane that loses tiles gains one reading "N tiles outside this window", every such line
  lands on it, parallel lines fold into one per node per verb carrying their count in a title, and
  an edge with both ends outside is folded into a single line between the two count tiles. The verb
  on a folded line is the original verb unchanged, which is load bearing: `selection.js`'s reveal
  table is keyed by verb, and a line reading "employed by, 3" would match no rule and leave an
  arrow pointing into an empty lane.
- **Every lane caption gains a fourth line, "k of n in this window", in #83's idiom.** A filter
  that loses the number is the same failure as an aggregate that loses it. It is added to every
  lane and not only the ones that lost something, because "6 of 6 in this window" is a claim and a
  lane with no fourth line would read as a lane nobody counted. The drawing's `bandTop` moves down
  by exactly one caption line to hold it.
- **A capture filed off a filtered drawing says so.** `drawingDigest` is a digest of what the BUILD
  wrote and `check_build.sh` is what makes it worth quoting, so on a filtered page it is true of
  something the reporter is not looking at. The line now reads the digest "of the whole term, drawn
  filtered to 3 weeks from 2026-03-30".
- **THE BUILD GATE DOES NOT COVER THE FILTERED DRAWING, AND THAT IS THE TRADE THIS CARD ACCEPTED.**
  The canonical drawing is untouched: `build/build_layout.py` still generates it, `site/layout.js`
  still ships it, `drawingDigest` still means what it meant and `scripts/check_build.sh` still
  refuses a rebuild that does not reproduce it byte for byte, unchanged in scope. The filtered
  drawing is a RUN TIME TRANSFORM of that artefact, computed in the browser, and no build ever
  wrote it, so no digest covers it and no reader should assume one does. It earns its own cover in
  `scripts/smoke.mjs` instead, `term` 41 to 47 and the total 121 to 127, and the load bearing
  assertion is that reflowing the FULL node set reproduces the canonical coordinates to within the
  tenth of a unit `layout.js` rounds to. That is what makes the filtered drawing the build's
  geometry with tiles taken out rather than a second opinion about where things go, and it goes red
  the day somebody retunes `pack()` in the build and not in `render.js`. The other five are that no
  two tiles overlap after the restack, that no line dangles and no arrowhead lands off a tile, that
  what was removed is on the page as a count that adds up, that every lane states its number, and
  that the fit frames the filtered drawing rather than the one it was cut from. Driven besides the
  suite over 48 combinations, three viewports by two themes by the tallest and the shortest of the
  seven drawings by four window widths from one week to the whole term: no overlap, no loose end,
  no arrowhead adrift, no sideways scroll, and every count reconciling in all 48.

- **Where `now` comes from, which #90 had to decide before anything could be built.** The term ends
  2026-06-28 and the real clock is past it, so 0 of 83 sessions are on or after today and a window
  built against the system clock renders empty today and every day after. The control leads with
  the reader's own date, states the count on or after it, and only then offers an anchor, named as
  an anchor: the Monday of the week the term's middle session falls in. It is DERIVED and not
  invented, so it adds no new made-up date to a page that already warns about every date on it, and
  it cannot go stale. The reader moves it a week at a time. Nothing here carries a `dummy` badge,
  because a badge marks a value somebody made up and this is arithmetic over values that already
  carry theirs.
- **The drawing is filtered by dimming and never by geometry.** The layout is generated at build
  time, `site/layout.js` carries a `drawingDigest` and `scripts/check_build.sh` refuses anything a
  rebuild does not reproduce; a window is a continuous parameter over 24 weeks, so it cannot be
  precomputed and laying it out at run time would have cost that guarantee. `render.setDim()` takes
  a predicate over a node and paints a class, so the build gate never sees this feature at all.
  Measured on Z-BL at fit, the 2578px drawing: 25 tiles quiet at opacity 0.16 and 55 lit, 152 edge
  and chip groups quiet with them, `drawingDigest` `1d45387` and the extent 1230 by 2578 identical
  before and after. `.out-window` is declared above the veil block on purpose, so a node the reveal
  rules hide stays hidden whatever the window says.
- **The window control is in the header and not in the sheet.** A control a reader can only reach
  by opening a sheet cannot filter a drawing the sheet is covering, and #90 was filed from `#graph`
  on `#/p/ZSC`. It is withdrawn on the board and the student list, which have no term in them, and
  kept on the diagram and on both readings, where the outline says in words that the window is off
  that reading rather than ignoring it. Below the breakpoint the menu is anchored to the viewport
  and not to its own control: the nav wraps there, so a 350px box hanging off the control's right
  edge measured `left: -153.78` at 390, which is 154px outside the viewport with no scrollbar to
  reach it.
- **#89 can join without a redesign, and the two joints are named in `site/term.js`.** Shape is a
  registry with a note and a builder per entry, so collapse and expand is an entry rather than a
  rewrite; and the drawing half composes because this card never touches geometry, so #89's two
  precomputed geometries can arrive under a window that dims whichever of them is on screen.
- **Smoke 106 to 121**, `PHASES` and `EXPECTED_ASSERTIONS` edited together as #67 requires. The
  fifteen are decisions rather than a count of the code: four on the month grid, two on the week
  grid, five on the window including the one that matters most, that the control does not call its
  anchor today, one on the outline saying the window is off that reading, and three on the drawing,
  that it dims rather than redraws, that the dimming is right in both directions, and that the
  window survives a change of programme.
- **The smoke suite is 97 assertions, from 87**, #84 and #85. The `term` phase went 16 to 26;
  `PHASES` and `EXPECTED_ASSERTIONS` were edited together, per #67.
- **The footer no longer says only the session titles and the programme code are real.** The
  module names and the position of a session in its syllabus are now on the page and are real
  too, so the sentence names them.
- **The lane plates step back off the drawing, #81.** They were painted `--bg-panel`, the token
  the header and the detail panel take, and seven opaque panel-white slabs were doing separation
  work the dot grid took over at #46. `.band` now takes `--bg-band`, a token of its own that sits
  a little under half way from the page ground to where the old plate was: `#ffffff` to `#fafbfc`
  in light, `#252a31` to `#20252c` in dark. Same fraction in both themes, so the two pages stay
  one drawing. Verified by sampling the rendered pixels rather than the token: the flat plate
  comes back `#fafbfc` and `#20252c` off the screenshots of all six lanes.
- **The plate is the denominator of the contrast gate, so this was measured before it was
  written.** In light every ratio falls and the binding one is Session template, 3.1440 to 3.0346
  against a threshold of 3.0000; the plate goes exactly as far toward the ground as that figure
  allows and stops. In dark every ratio rises, because the dark plate is lighter than the dark
  ground: the lowest goes 4.5374 to 4.8431. Gate after: **26 measurements, 1 declared, 0
  undeclared**, unchanged in shape.
- **The other two routes were priced and refused.** An outlined lane with no fill puts every tile
  on `--bg-app`, where Session template at 2.9330, Cohort at 2.9690 and the ghost grey at 2.6874
  fall under 3:1, and #65 and #70 both settled that the ghost's `#8f99a8` is `--c-gray-3` and that
  the value which would pass renders as a Company. Softening in dark only was defensible on the
  numbers and would have made the two themes two drawings.
- **`build/model.py` was not edited to follow the plate, which is the point of how it reads it.**
  It finds the surface by reading the `var()` out of the `.band` rule, so moving the lanes onto a
  new token moved the measurement with them. What did move in that file is prose and one figure
  in `scripts/check_repo.sh`: the ghost's declared exception is re-declared at 2.7804, because an
  entry licenses exactly the measurement it names and a plate that moves re-opens it.
- **The captions did not move and that was checked rather than assumed.** `.band-cap` is 9px text
  and answers 4.5:1, not the 3:1 the gate asks of a stroke, and #83 gave every lane a second line.
  They are stacked upward from `bandTop`, so they sit on `--bg-app` and not on the plate, in
  every theme and at every zoom: 5.0482 light and 7.6622 dark, before and after, unchanged.
  Confirmed on the pixels, whose modal colour along a caption's own line is the page ground.
- **Two surfaces followed the plate because they are the plate.** `.chip-bg`, which knocks an edge
  out from behind its verb, and the backdrop under a stacked tile in `site/render.js`, whose own
  comment says it is the band's colour. Left behind, each would have become a panel-white box on
  a softened lane.
- **The heading has five variants, not three, #80 and #82.** A route with no heading of its own
  inherits the one before it, which is the defect #77 was filed for, so `#/calendar` and
  `#/outline` each own a line. The smoke suite asserts the three are different sentences.
- **`.roster-*` is `.sheet-*`.** There are three of these overlays now, so the backdrop, the box,
  the head, the scroll and the phone layout have one name that is true of all of them. Only class
  names moved; every id is where it was, and `.roster-drawn` stayed, because "this row is also on
  the canvas" is a fact about the cohort list rather than about a sheet.
- **The smoke suite is 87 assertions, up from 71**, sixteen of them the new `term` phase. `PHASES`
  and `EXPECTED_ASSERTIONS` were edited together, which #67 requires.
- **The page chrome, header and footer as one piece of work, #77 and #79.** Measured over CDP at
  390x844, 834x1112 and 1536x839 before and after, on the diagram, the board, the student list and
  with capture mode on. On a phone the chrome was 33,4 per cent of the viewport and is 18,0; the
  header 123,41px and 75,00; the footer 158,41px and 76,75. Tablet 15,0 to 7,9 and desktop 14,4 to
  9,8. On the board route, where there is no footer, the header alone goes 103,27 to 67,19 on a
  phone and 57,42 to 43,00 elsewhere.
- **Every control on the page now measures at least 24 by 24 CSS px, WCAG 2.2 SC 2.5.8.** Eleven
  were measured and eleven failed: the five in the nav at 19,42 or 21,42, the programme picker at
  19,42, the three zoom buttons at 21,59, the panel's close at 22,52 wide and the student list's
  close at 22,16 by 22. The smallest box now is 26 by 26. The repository has gated itself on
  WCAG 2.2 for contrast since #35 and had never once measured a target.
- **The cause was one declaration and the fix is one box.** `.linkbtn` carried `padding: 2px 2px`
  and no height. It now carries `min-height` and `min-width` of 26 and a 1px transparent border, so
  the two chips that want a visible edge recolour a border they already have instead of adding one.
  That is also the whole of the ragged row: `<button>` rendered 21,42 and `<a>` 19,42 with their
  tops a pixel apart, and the header's controls now report **one distinct top** at every width and
  on every route, two only where the nav genuinely wraps in capture mode on a phone.
- **The heading says what is on screen, on all nine routes.** Nothing had ever rewritten the `h1`,
  so `#/board` declared "Zrive operating model, one cohort as instances" over a kanban. The fixed
  heading and the swapping subtitle are one line now, with three variants picked by a body class,
  the mechanism the subtitle already used. `#/board` reads "The work on this drawing, one card per
  issue", `#/students` "The Z-CFA cohort, every student in it" with the code written from the view,
  and each of the seven programme routes its own label, cohort and count.
- **#66's idea survives and #32's row is given back rather than spent.** The programme name in the
  sentence is still the control; it moved up a line with the sentence it was part of and takes the
  heading's size and weight. The header is one row at every width the row fits on and two on a
  phone, which is the two a phone already had with the three lines of subtitle between them gone.
- **The footer's four jobs went four ways.** The provenance stayed, restructured and shorter, and
  is a standing requirement of the project rather than copy: this page is served world-readable
  from a private repository and every value on it is invented. The two counts stayed with it,
  still written from the drawing, because how many people a cohort has and how many the picture
  drew is what the drawing left out; the seven cohorts are 34, 27, 21, 18, 24, 16 and 30, verified
  as seven distinct pairs on the seven routes. The other three jobs, what clicking does, what the
  mouse does and that the programme name opens the other six, are behind one disclosure that is
  closed on arrival, floats at the right hand end of the first line so it costs the strip no height
  of its own, and opens upward and absolutely so the footer, the canvas and the fit do not move.
- **#76's gesture sentence is preserved verbatim in its new home**: hold Ctrl, or Cmd on a Mac, and
  scroll to zoom, a bare scroll moves the drawing, and `fit` brings it back. It is also still on
  the zoom readout's own tooltip, where it applies.
- `--hh`, the header height the detail panel is positioned against, is now read from a
  `ResizeObserver` on the header rather than from a list of the events that were known to change
  it. 71 smoke assertions green, unedited; verify.sh, the repository gate at 73/73, the provenance
  self-test at 20/20, the deployed-bytes gate and the contrast gate at 1 declared and 0 undeclared
  all clean.
- **Z-BL and Z-SC draw their whole syllabus**, #83: 6 session templates to 28 and to 25, with a
  cohort session for each, so 42 templates across the seven views become 83 and the sample is
  16 per cent no longer. Every one carries the same five properties the six did, `title`,
  `template_code`, `delivery_mode`, `location_mode` and `duration_min`, read off the syllabus
  notes. The other five views are unchanged except for the caption and the eleven units of
  headroom its third line costs.
- **The labels are `name_norm` where the vault's two title fields diverge**, which is #78's
  finding applied to two whole routes instead of the one row that made it visible. Seventeen Z-BL
  rows and six Z-SC rows carry a `title_raw` that is a calendar string rather than a subject: a
  module heading, a "Presentación //", a venue and a clock, a leading space, a doubled space, an
  editorial "(NEW)".
- **A Z-BL visit has its firm withheld and not swapped.** The syllabus row names a law firm whose
  first token is a real teacher's surname, so the name gate refuses it, correctly: the folding
  cannot tell a firm named after a person from the person. The tile reads "Visita a despacho",
  its `title` row says the firm is withheld by the gate, and its note says why. Substituting
  another real firm, which is what the t17 employer row does, would have put a visit this
  programme did not make on a named third party. The next row keeps its firm, because the gate
  does not refuse that one.
  <br>**[Correction, issue 106. The clause "and its note says why" was true when this entry was
  written and stopped being true at `7d2d121`, where #101 took the reason out of the note because
  it narrowed the candidates for the withheld string. The entry is left standing because this file
  is the record of what changed and when, and an entry edited to match today reports a state that
  never existed on the day it claims. What is true now: the `title` row reads "real, with the firm
  name withheld", and the note says the name is withheld and that it was not swapped for another
  firm's, and nothing else. The #101 entry below is the authority, and `build/model.py` beside
  `WITHHELD_FIRM` is the live copy.]**
- **Duration is read off the source and its absence is written as one.** Not one of Z-BL's twenty
  eight rows records a duration, and the six-row version invented four. Twenty eight invented
  numbers standing where the source is uniformly silent is the value made up to fill a tile that
  the provenance seam exists to prevent.
- **`sessions_scheduled` on a Cohort was a statement about the picture.** It was the number of
  session tiles drawn, so every one of the seven answered "six" to the question of how many
  sessions the cohort holds. It is now the syllabus total with the drawn count beside it, flagged
  `estimated` because one delivery per syllabus row is an inference and not a reading.
- **`sessions_taught` on an instructor is refused when it disagrees with the edges.** It is a
  count of that route's `teaches` edges, typed beside the person while the edges are declared
  under the sessions, which was readable at six sessions and is not at twenty eight.
- **A tall lane stays one column, and both designs were built and measured before that was
  decided.** Z-BL is 1230x2578 against 1622x1382 wrapped. The wrap frames 1.87 times the scale at
  fit, and costs: all seven views a third wider for a wrap two of them need, 99 of 132 edges
  joining neighbours down to 56, one arc up to 33, verb chip overlaps 1 at 0.1px up to 4 at 0.9px,
  and a second column with no meaning to give beyond the length of the list. The scale at fit is
  the one of those a reader has a control for, which is what #46 built the plane for. The table
  is in the header of `build/bands.py`.

### Fixed

- **The build gate said "committed" seven times and never consulted git, #103 row B10.** It copied
  the working-tree `site/instance.js` and `site/layout.js` aside, deleted them, rebuilt and
  compared against those copies, so what it established was "the file on disk is what the builder
  just produced" while what it printed was "VERDICT: clean. The committed drawing is the build's
  own output". Proved with a hand edit staged into the index and the builder's own output left on
  disk: the pre-fix gate printed `site/instance.js is byte identical after a rebuild`, `both
  documents are a pure function of the model` and the clean verdict, **exit 0**, over a staged blob
  no build had ever produced. The baseline is now read out of git with
  `git cat-file blob :site/instance.js`. The index and not HEAD, because "what I am about to commit
  is the build's own output" is the question a pre-push gate is asked and HEAD answers a question
  about the past. Post-fix on the same tree: `::error::the index copy of site/instance.js is not
  what build/build_layout.py produces`, exit 1.
- **And the disk copy is checked against that same snapshot, because a commit here stages it.**
  Commits in this repository are made with an explicit path, so a working-tree copy that differs
  from the index is also a commit candidate and no verdict can cover both sets of bytes at once.
  The other direction of the same failing input, the disk edited and the index canonical, now
  passes the index comparison and is refused on the divergence, naming the working tree, where the
  pre-fix body refused with a message calling the disk copy `committed`.
- **It degrades by naming rather than by guessing.** Untracked path, unreadable blob, or no
  repository at all: the baseline falls back to the working tree, every finding and the verdict
  say so, and the word `committed` appears in no line the file prints on that path. That absence is
  mechanically checked rather than asserted in prose, which is why the word is reserved even inside
  a sentence disclaiming it. Run in a directory with the `.git` removed the verdict reads
  `The drawing in the WORKING TREE (git was not asked) is the build's own output`, followed by
  `READ THAT SNAPSHOT NAME`. This is `forbidden_lib.sh`'s `FORBIDDEN_ORIGIN` discipline, whose own
  comment is the argument.
- **`check_build.sh --self-test` 16 probes to 36, with the intended count declared by hand.**
  `EXPECTED_PROBES` here as in the other two shell suites, #103 row B1, since this suite had the
  same hole. **18 of the 36 MISS against the pre-fix bodies**, measured by grafting the 1eb377a
  implementations under the new suite: 5 on findings that name no snapshot, 7 on where the baseline
  comes from, 6 on the verdict. The other 18 pass in both directions, two of them deliberately, so
  the 18 mean something. Counts at `1a2dde3`.
- **`verify.sh`'s step numbers are asserted rather than swept, #106 E4.** That row filed two stale
  numbers read at `3c7be9e`: a section header numbered 8 introducing the function invoked as step
  9, and the untracked-files message sending a contributor to "steps 4 and 5" for a repository gate
  that had moved. **Both were already correct at `1eb377a`** and neither was repaired deliberately;
  one was fixed by #103's renumbering from eleven steps to thirteen and one because its section
  header had lost its number. A record settled by accident twice is a record nothing is watching,
  so the nth step registered must now begin `n. ` and a renumbering that misses one aborts at exit
  2 before the step runs. Proved with a step inserted between the build gate and the provenance
  self-test: `ASSERTION FAILED: this is step 6 and it is registered as "5. prove the provenance
  gate fires"`. Every remaining cross-reference in `scripts/` names a step by what it does; the two
  numbers left describe the historic defect and point at nothing live.
- **Seven gates reported on less than they claimed, #103.** The repository's signature failure,
  swept. Each fix is proved against the input that should fail it and then against the real tree,
  at `0f41655`.
- **A self-test that counts what it intends, in both shell suites.** `pass -eq total` is invariant
  under a probe that never executes, because `total` is incremented by each probe as it runs, so a
  suite emptied one probe at a time prints a clean ratio all the way down to 0/0. `EXPECTED_PROBES`
  is now declared by hand in `check_repo.sh` and `check_forbidden.sh`, which is the contrast
  table's `#rows|N` terminator and `smoke.mjs`'s `EXPECTED_ASSERTIONS` in a third language. A short
  run exits 2, a run that also recorded a MISS reports the MISS and exits 1. Proved by deleting one
  probe from each: 85 of 86 and 15 of 16, both named, both red. Counts at `0f41655`: repository 95,
  deployed-bytes 16.
- **The stylesheet reader's cases were counted with a floor of one.** `check_repo.sh` asserted that
  the palette suite emitted more than nothing and ran its producer under `|| true`, so a truncated
  stream was indistinguishable from a complete one and a non-zero exit was swallowed. Measured
  before: an edit in `build/model.py` cutting the emitter to a single case took the suite from
  73/73 to 52/52 at exit 0 while the line meant to notice printed `[OK] the stylesheet reader's own
  probes ran at all`. Twenty one assertions retired by an edit in a file that is not gate code. The
  count is declared, the exit status is read, and the same edit now reads
  `[MISS] the stylesheet reader intends 31 cases and emitted 1`, 64 of 65 against 95 intended.
- **`collect()` capped the shared rules at 20 matches per file, on the deciding path.** Its
  docstring said "all matches of a pattern in a file" and it ended in an undocumented `head -20`,
  and the value it truncated is the list `scan_file`'s rule loops iterate, not a printed report. A
  file holding 21 distinct corpus links, uuids or email addresses was judged on 20 of them, the
  21st never reaching the exemption table or `fail()`. The cap is gone rather than raised: a higher
  number is the same defect further away. A probe builds that file, declares the first 20 and
  leaves the 21st as the only finding; it MISSes against the capped `collect()`.
- **`surface_token` took the first `.band` rule it found and never checked there was only one.**
  Its sibling `surface_values` has treated a second declaration as a refusal since #64 and carries
  a probe for it; the asymmetry was recorded nowhere and it is the worse way round, because
  `surface_token` runs first and everything downstream then resolves the wrong token perfectly,
  under both schemes, with every multiplicity check passing. A scheme-scoped `.band` override
  appended to `app.css`, in an idiom that file already uses, left every contrast row byte identical
  with the repository gate clean, while two measured dark ratios printed as 4.9025 and 4.8431 were
  really 5.8744 and 5.8033, and the header of the last colour card names one of those numbers as
  the bound it worked to. The old pattern also required `var()` inside the match, so a hex painted
  straight onto the plate matched nothing and left the search to find the rule above it. Now every
  block whose prelude is the selector is read, every declaration of the property inside them is
  collected, and the reader answers only if they agree. The same override now ends the build with
  `app.css paints .band with 2 different values for fill`. Nine probes where the reader had none;
  four MISS against the pre-fix body.
- **`verify.sh` mapped every gate's exit 2 to `[SKIP]`, and exit 2 is also how every gate here
  reports a poka-yoke abort.** Nothing to scan, an empty name hash list, a palette table that does
  not match its own terminator, a malformed exemption table, a self-test shorter than it intends, a
  browser that never started. A skip that can mean an abort is a green that can mean red, and it
  was proved: a self-test that aborted at exit 2 gave `10 steps, 0 failed, 3 skipped`,
  `VERDICT: clean, with 3 step(s) that did not run`, exit 0. Exit 2 is now a failure, named as an
  abort so a reader knows the difference between a gate that refused the tree and one that never
  read it. Two steps may still decline and both preconditions are established by `verify.sh` itself
  rather than read off an exit code: the untracked check, whose 2 is this file's own convention and
  fires on the everyday condition of writing a new file, and the token grep, where the register is
  looked for before the gate is run instead of after. That second one closes the composition nobody
  had joined, a vault disappearing once taking this file's whole verdict with it. Same tree, same
  aborting gate, now `12 steps, 1 failed, 1 skipped`, exit 1.
- **`verify.sh` did not run `check_build.sh`, and its own copy of that check omitted things.** The
  copy never deleted the generated files first, which is exactly the poka-yoke `check_build.sh`
  exists for, and it ran neither the width table coverage check nor the structure gate. With the
  builder replaced by a script printing one line and exiting 0, the copy printed
  `the drawing is a pure function of the model` and `[OK]`; the real gate on the same tree prints
  `::error::build/build_layout.py exited 0 and wrote no site/instance.js`. The copy is deleted.
  Steps 3 and 4 run the real gate and prove it fires, which `check_build.sh`'s own header asks for
  by name, and the gate that was called by `build.yml` and by nothing else is now the gate
  `verify.sh` recommends and runs. Two copies of one rule is the drift class #106 is about and the
  second copy here was the weaker one.
- **`scripts/routes.py` was a 135 line gate with three failure branches that nothing ran.** Not
  `verify.sh`, not any of seven workflows; its name occurred four times in the tree, three of them
  inside its own docstring. It was green when it was found, which is the worse of the two states to
  be dark in. Wired in rather than deleted: its two live conditions, a declared class no object is
  drawn from and an object naming a class the registry does not declare, are the
  generated-but-never-verified class and nothing else in the tree tests them. It is step 10 of
  `verify.sh` and a step of `build.yml`, placed after the rebuild so it reads the bytes the builder
  just produced. It grows an exit 2 for a document carrying no registry and one drawing no object
  at all. Five mutated documents, five refusals, green on the real tree.
- **`board.yml` gating the first rendering while the retry pushed the second was closed by #105 at
  `2643989` and is confirmed here.** One `render_and_gate` function, called at both renders, and
  both `git commit` calls in the file stand behind it.

- **A title typed into the tracker reached the public origin with no repository-side gate having
  seen it, #105.** `sync_board.mjs` emitted the title verbatim, with no length cap, no character
  filter and no vocabulary, and `board.yml` gated the FIRST rendering while the rebase-retry loop
  re-rendered from the tracker as it stood at that moment and pushed the SECOND. That commit
  carries the marker that keeps the push-triggered workflows off it, so nothing downstream ran on
  it either, and the deployed-bytes gate in `pages.yml` fires after publication, which is an andon
  and explicitly not the guarantee `board.yml` claims for itself.
- **Proved with a fixture in four arms rather than argued.** A bare repo as the origin, a racer
  clone that lands first so the push is rejected, and a fake tracker answering clean on the first
  call and poisoned on the second. On the tree at `8809631` the gate exits 0 on the first
  rendering, the retry pushes the second, and the same gate shown the bytes that are on the origin
  exits 1, for a name and for a banned word alike. On the fix the name never reaches the bytes,
  and the banned word ends the step at exit 1 with the origin still at the racer's commit.
- **The rule is applied to the title before it is written, by the library that already owns it.**
  `scripts/forbidden_lib.sh --name-lines <hashfile>` reads one candidate per line and answers with
  positions only, never with the token, for the same reason the repository gate withholds a token
  from its own log. There is no copy of the folding in JavaScript and there must never be one: two
  copies of that rule already exist and the library's header warns about them. A title carrying a
  token is withheld rather than refused, so one bad title cannot stop the board tracking the work;
  the run says so on stdout and raises an annotation naming the issue number and never the string.
  All 94 titles in the tracker today pass, so nothing currently published changes, and the columns
  the new renderer produces are identical to the old one's.
- **The gate now sees the bytes that are pushed.** Rendering and gating are one function called at
  both renders, so no path reaches `git commit` carrying bytes the gate has not read.
- **Repository gate self-test 77 to 84.** Three probes on the entry point (it answers with the one
  position, it answers with positions and nothing else, a register holding no hashes aborts rather
  than calling every candidate clean) and four on the caller (a poisoned title does not reach the
  board, a clean one arrives unchanged, what is written in the poisoned one's place is clean
  against the register in use, and a rule that could not be run writes no board at all). All seven
  MISS against `8809631`, so none of them is a dead control.
- **The lane heading's frame was drawn through its own caption and was not centred on it, #96 and
  #97.** "Frame is too tight, improve design" and "Not centered in the frame", filed seconds apart
  on the same rect. THE FIRST WORK WAS FINDING WHICH RECT. Both cards carry `ancestor #graph ·
  svg>g>g>g>rect`, and that descriptor rules the tiles out rather than merely failing to name one:
  `feedback.js` describes a rect inside a node group as `ancestor [data-node=...]`, never as
  `#graph`, and the caption button is the only rect on the drawing sitting three groups deep. So
  these are about `.capbtn-frame`, the box #84 drew around the two lane headings that are controls,
  and not about a tile. A first reading that took them for tiles measured node labels sitting 0.7
  to 1.5 units right of their tile centre; that was an artefact, see below.
- **One defect, and it was two coordinate spaces in one rect.** The height was caption units times
  the zoom and the vertical offset was raw CSS px, so the four px meant for the descender were
  counted a second time, scaled, at the top, and the room left above the caption came out as
  `3.6k - 4`. Negative below k = 1.11, which is the fit scale and everything short of it. Measured
  on the deployed page at 1536 by 839: the three line caption cleared its frame by 0.28px at fit
  and overflowed it by 1.02px one zoom step out, and the bottom edge crossed the text from k = 2.1
  upward. The 26px target minimum then grew the rect upward only, because the bottom edge was
  pinned to the baseline, so a one line heading sat 5px below the centre of its own frame at fit
  and 8px below it at the far zoom out. Too tight and not centred are the same arithmetic seen
  from two sides.
- **Measured, not estimated, which is the house rule this file already keeps for a node's frame.**
  The caption's box is read off the text the browser drew, once per lane when the lane is painted,
  so it costs nothing on a pinch and it follows a caption that gains a line, which #100's filtered
  lanes do. Both pads are CSS px, five, matching `FRAME_PAD` on the node frame so that two frames
  on one drawing hold their contents at the same distance. The clamp's surplus is split between
  the two sides. Over eleven zoom levels either side of fit the air is never under 3.9px where it
  used to reach -2, and the offset from centre is at most 1.2px where it used to reach 8. For the
  uppercase caption the air over the caps and under the baseline works out at `2k + 5` on both
  sides, equal at every zoom.
- **#97 IS NOT ABOUT THE NODE LABELS, and the numbers that said it was came from the measuring
  API.** Every label line on `#/p/ZSC`, 130 of them over 77 tiles, is centred on its tile to within
  a ten-thousandth of a unit when the text's own start and end pen positions are read. The same 130
  read through `getBBox()` come out 0.15 to 1.59 units right, mean 1.03, never left: Chrome's text
  bbox starts at the pen origin and is wider than the advance, and all of the difference lands on
  the right. The true ink, taken from `measureText`'s bounding box in the same font, is -0.82 to
  +0.25 and more often left than right. Nothing was changed for it. The one thing it does touch is
  the node's own focus frame, which is `g.getBBox()` plus a pad and therefore inherits up to 1.6
  units of that margin; left alone, because the alternative is this file holding a second opinion
  about text metrics, which is the mistake it says twice it will not make.
- **The suite gained the assertion the old one could not make, 127 to 128.** `PHASES` and
  `EXPECTED_ASSERTIONS` together. The lane heading was already asserted at 24 by 24 at three zooms
  and passed for as long as the defect shipped: a target can be the right size and still be drawn
  through the words it is a target for. The new one reads the air over and under the caption and
  its offset from the frame's centre, from `getBoundingClientRect` rather than from the box the
  repair measures, so it is an independent reading. Proved in both directions: it fails on the
  geometry it replaced, at all three scales, while the 24 by 24 assertion passes on both.
- **The width measurer named a home directory four times, so it ran on one account, #96's pass.**
  `build/measure_labels.py` held four absolute paths carrying an owner's home and two Playwright
  build numbers, and no gate can see that: a literal path is valid Python and the file it names
  exists on the machine the check runs on. The cache root now comes from
  `$PLAYWRIGHT_BROWSERS_PATH` or the running user's own home, the build number is globbed newest
  first so an upgrade cannot silently change which binary measured the table, `$ZRIVE_CHROME`
  overrides everything and `PATH` is the last resort. Same binary resolved here, same candidate
  order, and `--check` reports the 4086 strings unchanged.
- **Three raw NUL bytes made `site/render.js` binary to every text tool.** They were the separator
  in the edge fold key. Measured: `grep -c function site/render.js` prints nothing and exits 1
  where `grep -a` finds 121, so a sweep over `site/*.js` skipped the 1159 lines that paint the
  drawing, in silence. The gates were checked rather than assumed and none was blind: every file
  scan in `forbidden_lib.sh` and `check_repo.sh` passes `-a`, `safety_grep.py` reads the file in
  Python, and a banned word planted after the NULs was caught with the file and the word named.
  The cost was to readers and audits. A unit separator written as an escape keeps the property the
  NUL was chosen for and leaves the file plain text.
- **Nothing in the drawing moved.** The repair is screen geometry on a control and touches no
  coordinate the build writes. `check_build.sh` reproduces `site/instance.js` and `site/layout.js`
  byte for byte, the seven heights are the seven it shipped with, 596, 2470, 2578, 622, 622, 596
  and 587 at a common 1230 wide, and #100's reflow still lands on the build's own coordinates with
  the worst node at 0.0 and the worst control point at 0.1, filtered and unfiltered alike.

- **A module heading was painted to the right of the rows it heads, #94.** "Alignment is wrong, too
  much space to the left". The heading `th` carried `padding-left: 26px` and its data rows carry
  10, so at 1536 the heading text started at x=245 over row text at x=229: a group heading indented
  16px past its own children, which reads as a stray gap rather than as a level, since an indent
  says the things under it belong to it and the things under this one were not indented with it.
  Both are at 229 now, and 12px on the phone layout where the rows are at 12 and the heading was at
  14. The level is still carried by the three distinctions #85 gave it, no top rule, the muted
  colour and the lighter weight. Asserted as the left edge of the painted text and not as a padding
  declaration, so moving the indent onto a margin or a border fails the same assertion.
- **The transparent sticky banner, #92, needed no repair because #91 deleted it.** "The EVERY VALUE
  IN THIS TABLE IS INVENTED row is transparent and I can see the table moving behind it". It was a
  real defect and a one line fix, an opaque fill on a sticky `th`. #91 was worked first, on the
  reasoning that a repair to an element about to be deleted is work thrown away, and the element
  went. Recorded rather than closed silently: the next sticky `th` this page grows needs its own
  opaque background, and the fill has to be measured on the ground it actually sits on, which #81
  showed is `--bg-app` and not the plate the stylesheet implies.
- **The visit edge terminated on the wrong end, #75, and the method is the finding.** The firm
  hosted the visit for the PROGRAMME on evidence that was about where the relation is RECORDED and
  not about what the relation IS: thirteen company notes file a visit under a programme note and
  none of a hundred and fifty six mentions a cohort, so the edge was pointed at the programme. A
  firm hosting a visit hosts it for the people who turn up, and the people who turn up are a
  cohort. The solid edge now terminates on the Cohort, span 1 and an ordinary bezier. THE
  PROGRAMME KEEPS THE SAME VERB AS A GHOST, which is #63's arc unchanged: a ghost is already this
  drawing's idiom for a relation that is real and unrecorded, the cohort attends, the programme is
  what the visit is for, and nothing writes the second one down. Decided in the owner's absence,
  between the two options he was offered and did not answer, and one line reverses it. A ghost
  relationship could previously only be DERIVED from a ghost node at an end, which cannot see a
  relation between two classes that both exist; it can now also be DECLARED, and every reader of
  an edge tuple goes through one unpacker. Regenerated, not hand edited: `'hosts visit'` measured
  in a real browser at 9/400i, the only string added to the table, both documents byte identical
  on rebuild, six of the seven routes carrying a host and all six taking it. The ghosts toggle
  withdraws the programme edge and leaves the cohort edge, verified on the deployed page in both
  directions, and the ghost reads in dark: dashed line, dashed chip, italic verb, against solid
  neighbours a centimetre away.
- **The capture described elements with `textContent`, #99, so it quoted text nobody saw.** The
  header carries the closed programme menu, seven names in a zero-sized span, so a capture on it
  read "Z-IB Investment BankingZ-IB Investment B..." and looked like a duplication bug. There is
  none, and #98 was filed that way. The descriptor is now built from what is rendered, in three
  parts, because `innerText` alone is insufficient in both directions: the element itself is
  tested for being painted BEFORE its text is read, since `innerText` falls back to `textContent`
  on an element that is not rendered and both the closed menu and the closed disclosure hand back
  their whole contents through it; SVG has no `innerText` at all and paints its on-demand tiles
  with `visibility: hidden`, so the same question is asked of that tree by a walk; and zero size
  counts as not rendered, which catches an svg `<title>` and a subtree collapsed without a
  `display: none`. The walk stops at 240 characters because only 40 are ever quoted. Driven before
  and after on the deployed page: the header now reads "Z-IB Investment Banking, cohort 1Q26,
  as...", the footer holding the collapsed `how to read this` reads the provenance line instead of
  the hidden list, and with `visibility: hidden` put on the programme button the descriptor drops
  it where it used to quote it twice. `site/feedback.js` alone; #86's sheet capture re-verified.
- **The redaction explained itself, #101, first of the two safe pieces.** The withheld firm's tile
  published the reason for the withholding: which register the refused string collides with, and
  which neighbouring template was unaffected. Against the short public list of Spanish law firms
  named after a person, those two sentences narrow the candidates to very few, so the explanation
  was an oracle for the string the withholding exists to protect. The withholding is unchanged; the
  note now says the name is withheld and that it was not swapped for another firm's, and nothing
  about the reason, the register or any other template. The title row reads "real, with the firm
  name withheld". The first wording came from a brief that asked for the reasoning to be on the
  tile; that was the error and it is recorded beside the value so a later edit does not restore it.
  The same reasoning survives in two places that are not served, both left as findings: this
  changelog above, which is history, and `build/model.py`'s own comment, trimmed of the pointer and
  of its now false claim that the tile says why. `site/instance.js` 315 bytes shorter,
  `site/layout.js` differing only in `drawingDigest`, every coordinate identical, both regenerated.
- **The name gate was blind to a concatenated token, #101, second of the two.** `fold_tokens`
  lowercased before splitting, so a run of letters with no punctuation in it stayed one token
  however many names were glued together inside it. Each run is now emitted whole AND cut at every
  lower-to-upper and acronym-to-word boundary. Emitting the whole run as well is what makes it
  additive: no token the previous folding produced is lost, so the net can only get finer and the
  register regenerates as a superset of itself. `build/safety_grep.py`, the declared drift-prone
  third copy, gets the same boundary set as a second view of the bytes searched alongside the plain
  one, and picks up the digit boundary the shell folding already had. Measured over the whole
  tracked tree before committing: 5597 distinct tokens before, 5622 after, none of the 25 new ones
  in the register. The single false positive it produced was in the comment introducing it, which
  had used a real camelCase pair as its worked example; the example was replaced, not the rule.
  Self-tests extended and never relaxed, `check_forbidden.sh` 11 to 16 and `check_repo.sh` 73 to 77,
  with the two genuinely new trip probes checked to fail against the old folding and an additivity
  probe run against a register holding only a joined form.
- **The committed name hash list was one token behind the vault.** Found by regenerating it, not
  caused by the folding change: the previous generator run against today's register also yields 138
  where the committed file held 137. The real size is 138 hashes over 87 people, and the 224 quoted
  in earlier briefs is a different number, `build/safety_grep.py`'s term count, which is those 87
  full names plus the 137 tokens its own coarser splitting produces.
- **The header could not be clicked while a sheet was open, #86.** He filed "feedback must be
  available when I am in this subpage", and he filed it from outside the subpage, because he had
  to. The sheets were `inset: 0` with a backdrop at z-index 20 and the header set none, so
  `elementFromPoint` at the centre of every control in that row returned `#termback`, `#rosterback`
  or the sheet's own head, on all seventeen sheet addresses, in both themes, at three widths.
  Nothing was disabled and nothing was hidden: theme, ghosts, feedback, students and board were
  present, enabled and 26 by 26 the whole time, which is why no gate had anything to say.
- **The line is issue 57's and the repair enforces it rather than raising a number.** That card put
  the theme first in the row as "the only item here that belongs to the page rather than to a
  view", and feedback is the same kind of thing, more so, since it is how anything on this page
  gets reported at all. So the two page level controls stay reachable over a sheet; `students` and
  `board` stay with them, because a sheet is a place and those are the visible way out of one; and
  `ghosts` is withdrawn on the five sheet addresses the way it already goes on the board, since it
  marks a drawing that is behind an opaque box. The programme picker needed no rule: it lives in
  the heading, which those routes already swap.
- **Two mechanisms, two claims, and the second was found by trying to prove the first.** The sheets
  now begin at `top: var(--hh)`, the measured header height, which is where `#panel` has begun
  since a panel at y=0 ate the same feedback toggle. The header carries a rank of its own for the
  first time. Neither substitutes for the other: with the header raised and the sheet still at
  `inset: 0` every hit test passes, because painting over something is not the same as not covering
  it, and below 760px that page puts five live controls over the middle of a full bleed opaque box.
  Both are asserted separately. `KAIZEN.md kaizen-a-modal-has-to-say-what-it-may-not-cover`.
- **Seven z-index values in one documented scale, with the reason for each rung.** Canvas 5, panel
  10, popovers 15, sheet 20, header 25, capture 30, error notice 40, written as tokens at the top
  of `site/app.css` where the palette is, because the numbers were scattered across the rules that
  used them and nothing said what the ladder was. The order is the argument: a sheet covers every
  view of the artefact, the header is not a view, capture reaches over anything it can name, and
  the error notice is the last thing a page that has thrown can speak with.
- **`aria-modal` is gone from both sheets and `role="dialog"` stays.** It says content outside is
  inert, and a screen reader acts on that by refusing to leave; with the header deliberately
  outside and deliberately live it was a claim the page does not implement, and the one control it
  put out of reach was the one this card exists to make reachable. Measured after the change: the
  tab order out of an open sheet runs its own controls, then the header, `theme`, `feedback`,
  `students`, `board`, and nothing takes focus back off any of them.
- **A report filed from inside a sheet said `view: diagram`.** It named the view behind the sheet
  the reader was reading, on all five sheet addresses, and #86 is what makes that answer reachable
  at all. `feedback.js` reads the route off the body's own classes now, so a capture from
  `#/outline/ZSC` names the outline and the address it was filed from. Driven end to end: the
  element it captures reads `ancestor #termrows`, a row of the sheet, and not the backdrop.
- A Strategy Consulting session template was labelled with a venue and a start time, so the
  drawing put an instance on the template side of its own split, #78. `sc_st6` on `#/p/ZSC` read
  " ATTICO @ 10.15h - All you need to know about recruiting in Strategy Consulting", verbatim from
  the syllabus. A venue and a clock are properties of a delivery; a template has neither. #19
  exists because the template versus instance split was asserted rather than shown, and the answer
  was to draw both sides and join them with `instance of`, so a template that is really an instance
  breaks the one distinction the artefact demonstrates, in the place a reader checks it.
- **The conflation is the source's, and the vault records it.** The syllabus note ZSC-T0023 carries
  both `title_raw`, the published row with the venue and the clock on it, and `name_norm`, the
  subject on its own. On the other five ZSC rows drawn here the two fields hold the same string; on
  this one they diverge. The template takes `name_norm` verbatim, which is the normalisation the
  source performs on itself, so no name is invented and the title stays real and published.
- **The delivery already existed and already held the clock.** `sc_cs6` is `instance of` this
  template and carries `scheduled_at`, so the join now says something true rather than repeating
  one side of itself. It reads 10:00 and not 10.15 because every date and clock on a cohort session
  here is invented, and lining one up with a real syllabus row makes a half real datum. The venue
  has nowhere to go: no CohortSession on any of the seven routes has a venue field, and the only
  trace of ATTICO that survives is `location_mode presencial` on the template, which is the
  template-level truth the venue implied.
- **The old label did not even fit.** Rendered, it wrapped to the two line cap as "ATTICO @ 10.15h
  - All you need to" and "know about recruiting in Strategy", dropping "Consulting" from the
  drawing entirely. The new one reads whole in the same two lines.
- Scope was measured across all seven views rather than assumed: of 42 session templates, one
  carried a time, an `@` venue or a date before and none does after, and the scan was run against
  the previous document as its own positive control. Only ZSC moved, digest f447946 to dc73951;
  the other six views are byte identical. `build/label_widths.json` was remeasured, which took 99
  dead strings out of the table and changed no width, so the coverage check reports nothing
  missing and nothing spare.

### Changed

- The wheel zooms only with **Ctrl or Cmd**, and a bare wheel pans, #76. This reverses #46's
  decision rather than repairing a fault in it: #46 argued that over the canvas the wheel is
  always a zoom, so the event is never handed back, and the owner read the page, scrolled, watched
  the drawing jump and asked for the modifier. The shape of #46's argument survives: one of the
  two things always happens, so the event is still never handed back.
- **The modifier is `ctrlKey` or `metaKey`.** Ctrl is what was asked for and is the zoom modifier
  on Windows and Linux; Cmd is the same gesture on a Mac. `ctrlKey` is also how a macOS trackpad
  pinch is delivered, which is why #46's pinch keeps its path here unchanged. Not Alt and not
  Shift, since Shift plus wheel is horizontal scrolling everywhere.
- **A bare wheel pans rather than being handed back, and that was measured before it was chosen.**
  `scrollHeight === clientHeight` at 1536x839, 1440x900 and 390x844, so the browser has nothing to
  scroll and handing the wheel back would make a bare scroll do nothing at all. A reader who
  scrolls and sees no movement learns nothing. Panning is what the drawing already is: #46 built
  it as an infinite canvas in the sense of Figma, Miro and Obsidian Canvas, where a bare wheel
  moves the plane and a modifier scales it. `deltaX` is carried, so a trackpad pans sideways.
- **The listener stays non-passive and still always prevents.** Ctrl plus wheel is the browser's
  own page zoom, and a passive listener may not cancel it, so the page would scale under the
  drawing while the drawing scaled itself. Over the canvas all four events report
  `defaultPrevented`; over the footer, where nothing touches the wheel, none of them does.
- **The two zoom rates are now told apart by the delta and not by the modifier**, because the
  modifier just acquired its other meaning. A mouse notch is 120 pixels and `0.0022` turns exactly
  one notch into the 1,3021 the `+` button steps by; a trackpad arrives in small deltas at a much
  higher rate and keeps `0.01`. Measured: ctrl notch 1,3021 and cmd notch 1,3021, a mac pinch
  delta of 9 gives 1,0942, a touch pinch 3,5 over six frames, anchor drift 0,0008px across and
  0,0020px down.
- **The footer and the zoom readout's tooltip say so**, at no cost to the header row. Eight wheel
  shapes driven: bare notch, bare trackpad delta, bare sideways, Shift and Alt all pan; Ctrl, Cmd
  and a small ctrlKey delta all zoom.
- **`scripts/smoke.mjs` goes to 71 assertions**, the first edit to the suite in six structural
  changes and it is declared rather than quiet: the existing anchored-zoom gesture takes
  `modifiers: 2` because without it that gesture is a pan now, and one assertion is added saying a
  bare wheel moves the drawing and does not zoom it, which is the whole of what this card decided.
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
  <br>**[Correction, issue 106. Both "nine rules" above were right at `62d5384`, where this entry
  was written, and are not a count of anything today: 10 at `a39bf13`, 12 at `3c7be9e`, 10 at
  `1bf3ad2`. The entry stands, because it recorded what was true when it was written. The number
  is flagged here rather than updated because the second use of it sizes the `--line` repair, and
  a repair sized from any fixed count converts some of the rules and leaves the rest. Count them
  when the card is taken; the live copies in `site/app.css` and `scripts/check_repo.sh` no longer
  state a figure at all.]**
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
