# The kaizen loop

*Written for somebody who does not read code.*

This repository draws one picture. The picture exists so that the operating model behind it can
be argued with, which means it has to be wrong in ways that are visible and fixable rather than
wrong in ways nobody can name. The loop below is how a complaint about it becomes a change to it.

## The loop

**A defect becomes an issue.** Anything a reader can point at counts: a node in the wrong column,
a verb on the wrong end of an arrow, a property that claims to be a fact. The issue says what is
wrong and how you would know it was fixed. It carries no real name, no real figure and no link
into the private corpus, because issue titles are rendered onto the public page through
`site/board.json`.

**An issue becomes a card.** A `status:` label puts it in a column: `status:raw`,
`status:backlog`, `status:in-progress`, `status:done`. An issue with no `status:` label sits in
Raw, which means nobody has looked at it yet. Nothing infers a column: `scripts/sync_board.mjs`
renders whatever labels are there, and the labels are written from events GitHub already raises.
There is no triage step and no model call anywhere in that path.

**A card becomes a commit.** One card at a time in In progress. One defect per commit, because a
commit that fixes three things cannot be reverted for the one of the three that turned out wrong.

**A commit closes the loop.** Closing the issue moves the card to Done on the next board sync.
Then the acceptance rule, which is the one that is easy to skip:

> **A change is not reported until a screenshot of the deployed page has been looked at by a
> human or an agent.** Not a green build, not a diff, not a passing check. The picture.

That rule is bought and paid for. This project once reported a page as broken on the strength of
a screenshot taken before the JavaScript ran, and on another day shipped a blank one for the same
reason. HANSEI.md has both.

## Taking an issue means assigning it

Nobody edits a `status:` label by hand any more, and nobody should. Taking an issue means
assigning it to yourself; that is the entire interface. GitHub already raises an assignment as an
event, so it is a signal that exists whether or not anybody remembers to use it, and
`.github/workflows/issue-status.yml` turns it into the label the board reads. Exactly one
`status:` label is on an issue at a time, or none:

| What a person does | What the label becomes |
|---|---|
| assigns the issue to somebody | `status:in-progress` |
| unassigns the last person on it | `status:backlog` |
| unassigns one of two people | nothing changes; it is still being worked |
| closes it as completed | `status:done` |
| closes it as not planned | no `status:` label at all |
| reopens it | `status:in-progress` if somebody is on it, `status:backlog` if nobody is |
| files it | nothing is written |

Three of those rows have a reason worth stating.

**Closing as not planned leaves no label.** A duplicate, a wontfix and an obsolete card are not
outstanding work and are not finished work, so `sync_board.mjs` draws them in no column at all. A
`status:` label on a card that nothing draws is a claim with nothing on the page to check it
against.

**Filing an issue writes nothing.** An unlabelled issue already sits in Raw, and writing the label
the default already means would buy no behaviour and add a second place for one fact to be wrong.

**A commit message writes nothing, and work that starts without an assignment has no backstop.**
There was one: a push whose commit messages named issues by number marked each open one
`status:in-progress`. In the thirteen pushes it ever saw it wrote four labels and all four were
citations rather than claims of work, which is what `#N` in prose usually is. It is deleted rather
than narrowed to a marker, because a marker only fires for somebody who was already thinking about
the board, and that person can assign the issue instead. Write `#12` in a commit message as freely
as anywhere else: it records a cross-reference on the issue and moves no card. HANSEI.md
`2026-08-10-citation-read-as-a-claim`.

## The standing work

The board owns which defects are open. This file does not list them, because a copy of that list
drifts the moment work lands, and it did: three layout defects sat here as current for a day after
they were closed. The query is
[the open issues](https://github.com/jcherranz/zrive-model-toy/issues), and the board view at
`#/board` renders the same thing.

Two things about that list are not in any issue and belong here.

**Layout defects are filed one per cause, not one per symptom.** The three that opened this
repository, the diagram not fitting one screen, the right half of the canvas being empty, and
instructors and session templates interleaving, looked like one layout problem and had three
different causes. Fixing them as one change would be the batching that Heijunka exists to refuse,
and a single commit touching all three cannot be reverted for the one that turned out wrong.

**A standing constraint is a card, not work.** Some issues are on the board so that changing them
is a decision somebody takes deliberately and against the record in HANSEI.md, rather than a
convenience somebody reaches for. They are not defects and they are not closed by doing the
obvious thing to them.

## The reflection step

After each change, before the card moves to Done, two questions in writing, in the commit message
or on the issue:

- **What did this teach that was not already written down?** If the answer is nothing, say
  nothing. Most changes teach nothing, and a reflection habit that manufactures a lesson every
  time is worth less than one that is usually silent.
- **Should the standard work change?** The standard work here is small and nameable: the build is
  deterministic and computes coordinates ahead of time; the gate runs against deployed bytes after
  every deploy; a change is not reported without a screenshot somebody looked at. If a change was
  only possible by stepping outside one of those, that is the finding, and it goes into HANSEI.md
  rather than into a commit message that scrolls away.

The rule that governs both: **when a check fires and the fix looks like weakening the check, read
the artefact it fired on and name the line that proves it wrong.** An alarm that is inconvenient
is not thereby a false alarm. The safety gate's whole value is that it is annoying at exactly the
moment it matters.

## What improvement means here, and what it does not

This toy is thirty eight nodes, four of which are classes that do not exist, and the four files
that draw it, `index.html`, `app.css`, `app.js` and the generated `graph.js`, are a hundred and
eleven kilobytes. They were fifty two when that sentence was written, a hundred and one on the
commit before the second cohort came out, seventy just after it, and ninety five before the
cohort was drawn as people. Improving it does not mean growing
it, and these two figures are maintained by hand, so read them as of the last time somebody
checked. The most valuable change available at any moment is almost always the one that removes
something: a type nobody can populate, a column with one node in it, a property that says
`estimated` and means `guessed`. The wider work
behind the diagram lives in `~/projects/pr-zrive-toy/analysis/ontology/` and holds far more than
this page shows. That the page shows less is the point of the page.

## The lessons, in the order they were bought

Each lesson carries a slug and is cited by it. This list is not append-only, so an ordinal into it
repoints the moment a lesson is added or removed: two changelog entries citing "KAIZEN.md, last
entry" already meant two different lessons, which is issue 54. `scripts/check_repo.sh` fails the
build on a cited slug that resolves to nothing.

- `kaizen-a-green-suite-over-a-large-diff-is-a-reading-and-not-a-reassurance` &middot; **A suite
  whose intended total is written by hand turns "this change asserted nothing" into something a
  reader can take off the diff, and the reading runs the opposite way to the one the constant was
  built for.** `EXPECTED_ASSERTIONS` exists so that a phase which stopped running cannot come out
  clean. Read the other way it says something sharper: an assertion cannot be added without moving
  that number, so **a branch that adds hundreds of lines of page behaviour and leaves the constant
  where it was is green BY CONSTRUCTION**, and its green is evidence that nothing in the suite
  touches the new behaviour rather than evidence about the behaviour. Issue 132's first push was
  exactly that shape, 475 lines across six site files with the suite at 364 of 364, and a reader of
  the diff named it before any of it was driven. **Two things follow.** The first is that the pair
  to look at is the diff's size against the constant's movement, and neither number alone says
  anything: a small change may honestly add no assertion, and a moved constant may have been moved
  for a phase somewhere else. The second is the reason a growth pin lands in the same change as the
  surface it guards rather than in the card after it: a pin added later pins whatever had already
  accumulated by then, and until it exists the same green means the same nothing.
- `kaizen-a-control-mutation-runs-in-a-copy` &middot; **A control that proves a check can fail must
  be applied to a copy of the tree and never to the working tree, because the revert is the step
  that does not run when the run is interrupted.** #228's controls mutated `site/render.js` in place
  and reverted with `git checkout` after each one. A run was killed between the mutation and the
  revert, the working tree kept `min` where `max` belongs in `compose()`'s reserve, and the next
  commit carried it to a pushed branch. Three things did not catch it: `node --check` passes on a
  valid mutation, `git diff --stat` counts lines rather than reading them, and the mutation is a
  plausible edit rather than a marker. What caught it was a reader of the diff, one round trip
  later, and by then it had produced a CI failure that read exactly like a discovery: the run-time
  reserve short of the bold on 560 of 709 tiles, with every other gate green. **A false finding is
  the expensive failure here, not a false pass.** The rule is that a control copies `site/`,
  `scripts/` and `build/` to a scratch directory, mutates the copy, drives the copy and deletes it,
  so nothing needs to be put back. The second rule is that after any interrupted run the whole
  working-tree diff is read line by line before it is committed, since the revert that did not run
  is invisible in a summary.
- `kaizen-record-the-condition-not-the-answer` &middot; **A measurement taken under ambient state
  cannot be held against a later one unless the state was recorded with it, and what gets recorded
  must be the condition rather than the number.** `getComputedTextLength()` answers in user units
  and moves with the screen CTM, so `widthOf()`'s cache in `site/render.js` carries the zoom the
  drawing that first wanted a string composed at, while the paint is read at whatever zoom the fit
  settled on. Issue 204 wrote the comparison, drove it, found the residual two-sided at 0.6919 under
  to 1.6129 over, and withdrew it rather than picking a band, which was right. Issue 228 made the
  same comparison exact by recording the `viewBox`, the box and the CTM each probe stood at, and
  reading the paint back there. The discipline that makes such a record admissible is that it
  carries no width: a condition tells a checker WHEN to look and hands it none of the answer, and a
  condition that lies makes the equality red on every string at once rather than green on any, so it
  can lose a pass and cannot manufacture one. The general shape is that a two-sided residual with no
  honest bound is usually a missing variable rather than a tolerance waiting to be chosen.
- `kaizen-a-control-that-leaves-a-group-leaves-the-groups-rules-behind` &middot; **A control that
  moves out of a group loses every rule that was written against the group, and the loss is
  invisible until somebody presses it.** Issue 139 deleted the readout plate and moved the altitude
  into the nav. Every state that control had was written as `.hstate .linkbtn:hover` and
  `.hstate .linkbtn[aria-expanded="true"]`, which are #131's three-paints repair, and the moment the
  plate went those selectors matched nothing: the control still worked, still opened its box, still
  said its own state, and had one paint for rest, hover and open, which is the exact defect #131 was
  filed about. Nothing failed to compile and nothing looked broken in a diff. The rule is that
  moving an element between containers is a rewrite of its stylesheet and not a change of address,
  and the way to find what has to move with it is to grep the container's own class rather than the
  element's id.
- `kaizen-a-new-control-inherits-the-old-ones-defects-not-its-repairs` &middot; **When one control
  replaces another, it starts with the base rules and none of the repairs, so every measured fix the
  old one carried has to be carried across by hand.** The absence switches replace the ghosts
  toggle, and the first version filled on hover with `--tint-hover` and filled when pressed with the
  same value, which is precisely what #131 measured off the ghost toggle and removed: a reader
  merely pointing at an OFF switch is shown exactly the paint that means ON, because the two tokens
  are declared to the same colour. The same version put its own focus rule before `.linkbtn`'s in
  the file, so at equal specificity the base rule won and the ring broke out of the group top and
  bottom, which is #131's other measurement. Both were found by the assertions #131 left behind
  rather than by looking, which is what those assertions are for; and the repair for both was to put
  the new block AFTER the base rules rather than to reach for a specificity hack, because a
  specificity hack is a third statement of an ordering the file already has.
- `kaizen-gate-shown-to-fire` &middot; **A gate that cannot be shown to fire is not a gate.**
  `scripts/check_forbidden.sh --self-test` runs in CI beside the live check, not to find bugs in the
  rules but so that a run reporting clean means the rules ran.
- `kaizen-verifier-not-exempt-from-verification` &middot; **A verifier is not exempt from
  verification.** A review of this work once published three counts as "did not reproduce" that were
  artefacts of its own parser. Before a finding is reported, the tool that produced it gets the same
  suspicion as the thing it reports on.
- `kaizen-a-diagram-of-presences-hides-absences` &middot; **A diagram of what exists cannot be read
  for what is missing.** Twenty six nodes drawn well say nothing about the classes that are not
  there, and a reader has no way to notice an absence from a picture of presences. An object with no
  class cannot be queried, and a leak that leaves no row cannot be found by looking harder at the
  rows. The corollary is the constraint and not an exception to it: four ghosts fitted because the
  band they belong to was the emptiest part of the drawing and cost no height, and the fifth
  candidate was dropped for the opposite reason. Where an absence goes is a layout question before
  it is an ontology question.
- `kaizen-a-guard-covers-only-the-state-it-names` &middot; **A setting that protects a running job
  says nothing about a pending one.** `cancel-in-progress: false` bought exactly one thing, that a
  job already executing is not killed, while a run still waiting to start was being thrown out by
  the next trigger into the same group. Three went that way in five minutes before anybody counted
  them, because an eviction raises no error. A guard is only evidence about the state it names; read
  it for what it excludes, not for the reassurance in its comment.
- `kaizen-an-object-exists-while-its-key-does-not` &middot; **An object can exist while its key does
  not, and the drawing has to be able to say so.** The cohort is a real thing that nothing
  identifies. Drawing it as a ghost would have been false and leaving it unmarked would have hidden
  the sharpest finding on the page, so it keeps its own outline and gains a second, dashed one. A
  vocabulary of "exists" and "does not exist" is too coarse for this model.
- `kaizen-penetration-depth-not-a-collision-count` &middot; **A collision counter drives a layout
  away; a penetration depth nudges it.** The verb chips scored a position by counting the boxes it
  hit, so clipping a padding margin by one pixel cost what printing a verb across a person's name
  cost, and the cheapest way out of either was to leave the line altogether: one chip ended 134px
  from the edge it named. Scoring by how far a box penetrates, and pricing the ways out separately,
  keeps the placement local, and the worst chip is now 6px from its line. Where a layout is allowed
  to escape, the escape has to cost more than the crowding it escapes.
- `kaizen-painting-order-is-not-occlusion` &middot; **Painting order is not occlusion, and a
  coordinate in the source is not a distance on screen.** Every tile is filled with a fourteen per
  cent tint, so a shape drawn behind one is layered and not hidden, and the cards standing for the
  count behind the students tile showed straight through it. The source says only which element is
  appended after which, which is a true statement about z-order and a false one about what a reader
  sees. The same change carried the other half: the two cards were written `+5, -5` and `+2.5, -2.5`
  and arrived on screen at `+2, -8` and `-0.5, -5.5`, because the shape those offsets moved was also
  six units smaller, so a step written from a corner became a different step from a centre. Where a
  defect is geometric, take the numbers off the running page.
- `kaizen-a-relationship-taken-on-trust-is-not-drawn` &middot; **A relationship the reader has to
  take on trust is not drawn yet.** With one cohort on the page, the split between a session
  template and a cohort session was two tile colours and a caption: the drawing asserted the split
  and showed nothing that required it. For each relationship the model says is load bearing, ask
  what on the canvas would look different if it were false; where the answer is nothing, the
  relationship is documentation with a colour, and the fix is usually one more instance rather than
  one more legend entry. The second cohort was the answer here and was later removed on the owner's
  reading, issue 42; the lesson that came out of that is
  `kaizen-a-demonstration-is-a-cost-to-the-reader`.
- `kaizen-an-opt-in-view-costs-the-default-nothing` &middot; **An opt-in view has to cost the
  default view nothing, and the only proof of that is a diff.** The cheap way to add a second cohort
  is to draw it always and hide it with CSS, and it would have been wrong: a hidden node still
  occupies the layout, so every coordinate in the default drawing would have moved while every
  screenshot still looked plausible. Laying the two views out separately made the claim checkable,
  and it was checked by diffing the generated bytes of the default view against the deployed ones.
- `kaizen-fewest-crossings-is-not-least-effort` &middot; **A minimum of crossings is not a minimum
  of effort for the reader.** The barycentre sweep put the two cohorts' sessions in the order that
  crosses fewest edges, which interleaved them and left neither in date order. A column of dated
  things carries an order the reader already knows, and breaking it to save crossings spends
  something the layout cannot see to buy something it can.
- `kaizen-a-computed-value-is-never-typed-twice` &middot; **A value the build computes must never be
  typed into a second file.** The narrow viewport rule carried `min-width: 1230px`, which is the
  width `build_layout.py` computes, and nothing tied them: the day a column changed width the
  stylesheet would have gone on scrolling to the old number, on phones only, with no error anywhere.
  The build now writes the value, the stylesheet reads it through a custom property, and the build
  refuses to run while a copy of it sits in the stylesheet. Third time in this repository, after the
  label widths and the header height.
- `kaizen-a-tool-that-refuses-the-size-you-asked-for` &middot; **A tool that quietly refuses the
  size you asked for will confirm any layout bug you suspect.** Headless Chrome runs pages in a
  window no narrower than 500px whatever `--window-size` says, but captures the screenshot at the
  width requested, so a page scrolled by its own JavaScript stops at the wide window's maximum and
  is then photographed narrow, which looks exactly like a clipped right edge. Two rounds of work
  went at a defect that was not there. Make the harness state the viewport it actually got, and
  prefer a container the harness controls over a window the tool negotiates.
- `kaizen-a-caption-must-match-what-the-lane-holds` &middot; **A caption that asserts a type must
  match what the lane holds, or the drawing lies about its own structure.** A lane captioned `cohort
  sessions` held six cohort sessions and one company, and the company was in the right place,
  because its edge attaches at session level. The tempting repair is to move the tile, which would
  have made the drawing tidier and less true. Where a placement is right and a label is wrong, fix
  the label: a drawing tidied into agreement with its own captions has lost the thing it was drawn
  to show.
- `kaizen-fixing-the-axis-is-not-fixing-the-defect` &middot; **Fixing the axis is not the same as
  fixing the defect.** The panel opened on top of the node it described because `reveal()` handled
  only the horizontal axis, so the obvious fix was to handle the vertical one too, and it changed
  nothing: at 390px the page is about 36px taller than the viewport, so there was nowhere to scroll
  to and the correct new code moved zero pixels. The fix needed the room as well as the code. When a
  fix is written against a diagnosis rather than against a measurement, drive it and read the
  number: a scroll that runs out looks exactly like a scroll that was never asked for.
- `kaizen-a-control-that-answers-with-nothing` &middot; **A control that responds and reports
  nothing is worse than one that is absent.** `copy all` answered a click with no clipboard write,
  no label change and no result line, in a row where every other button answers. Two honest repairs
  existed, doing the empty thing and saying so, or refusing the click; the second was right, because
  a clipboard write of nothing that reports success is a lie about what the reader now holds. Prefer
  disabling to inventing a success.
- `kaizen-a-widened-control-keeps-its-neighbours-reachable` &middot; **The mode that widens a
  control is the mode in which its neighbours have to stay reachable.** Capture mode's toggle grows
  when the mode is on, and twice in one pass that growth broke the header, once by placing the
  popover over it and once by pushing the board link off the screen. Both were invisible above 400px
  and neither is visible in a screenshot, because the link was still drawn, just outside the
  viewport. Assert reach rather than presence: `elementFromPoint` at the centre of every control, at
  every width the page claims to support.
- `kaizen-one-robot-cannot-see-what-another-writes` &middot; **What one robot writes, the robot
  beside it cannot see, and that failure looks like success.** GitHub raises no workflow run from an
  event caused by the default token, so a label written by `issue-status.yml` reaches `board.yml` as
  silence: every step goes green, the label moves, and the picture keeps showing the old column
  until some unrelated event rebuilds it. That is worse than the feature not working, because the
  label would be right and the board confidently wrong. A design has to state which of its own
  effects are visible to what, and where the answer is nothing the wake-up is sent deliberately,
  here a `workflow_dispatch`, which is the one trigger type the suppression exempts.
- `kaizen-an-override-covers-only-the-selector-it-names` &middot; **An override is only evidence
  about the selector it names, and a browser's default need not use the selector you assumed.**
  Every selected node wore a five pixel black box for as long as the page existed, while the
  stylesheet held a deliberate, correct focus rule the whole time: it was written against
  `:focus-visible`, which is what a browser uses on an HTML element, while Chrome's default for a
  focusable SVG element is keyed on `:focus`. A mouse click matches the second and not the first, so
  the override never ran for readers with a mouse and ran perfectly for anyone testing with the
  keyboard. Where a default is being replaced, get the answer from the running document, and where a
  state has two ways in, drive both.
- `kaizen-a-measured-mark-fits-the-cases-nobody-listed` &middot; **A mark whose size is read is
  right in the cases nobody enumerated.** The frame that replaced that box is padded around
  `getBBox()` at the moment it is shown, so it fits the count stack leaning out above one tile, the
  second dashed ring on another, the caption under that ring, and the same caption vanishing when
  the ghosts are switched off, none of which was reasoned about. The arithmetic version would have
  needed a branch per case and would have been wrong the first time a fifth appeared. Fourth time
  here that a measured value beat a computed copy of one, and the first where the win was cases
  rather than staleness.
- `kaizen-a-zero-delay-is-about-the-timer-queue` &middot; **A delay of zero is a statement about the
  timer queue, not about the document.** The board's first fetch has to happen after `feedback.js`
  has run, because that is where the reader's stored token is published from, and `index.html` loads
  the board first. Deferring to a zero delay timer is not enough: the parser yields between script
  tags, the timer fires in the gap, and the board draws the published snapshot for somebody who had
  connected a token. It fails only for readers who have a token, never on a reload from cache, and
  never in a screenshot. Where the requirement is "after the rest of the page", say so:
  `DOMContentLoaded` is that statement and a timer is a guess about scheduling.
- `kaizen-a-demonstration-is-a-cost-to-the-reader` &middot; **A demonstration is a cost to the
  reader even when the argument for it is right, and the reader is the one who prices it.** The
  second cohort was added because the template versus instance split was asserted and not shown, and
  that argument still reads as correct. It was removed anyway, on one sentence from the person the
  page is drawn for: every time he opens it, it must be one cohort. A switch is not free merely
  because it is off, since a reader who meets a control has to decide about it, and the thing being
  demonstrated was a property of the schema rather than a fact about the business the page exists to
  argue with. An addition justified by what it proves still has to be justified by what it costs to
  look at; those are different questions, and where they disagree the answer comes from the reader
  and not from the record. The cheap tell is that the argument for adding was made here, in the file
  where this project reasons with itself, and the argument against arrived from outside it in twenty
  words.
- `kaizen-a-hidden-node-in-this-view-and-in-another` &middot; **Hiding a node in the browser is
  wrong when the hidden thing is a second view and right when it is this one.** The second cohort
  could not be drawn and hidden, because a node nobody can see still occupies the layout, so every
  coordinate in the default drawing would have moved to pay for a view nobody had asked for. An
  employer hidden until its instructor is clicked is the same mechanism and the opposite case: it
  belongs to this drawing and is one click from the screen, so the space it occupies is the space it
  appears in, and laying the drawing out again without it would move every tile on the page on every
  click and make the coordinates a function of the selection. The question is not whether a hidden
  node costs the layout something. It is whether what it costs buys the reader the drawing in front
  of them.
- `kaizen-a-harness-and-a-page-must-agree-on-the-coordinate` &middot; **Where a harness and the
  thing it drives both need a number, exactly one of them owns it.** The first run of
  `scripts/smoke.mjs` reported the anchored zoom drifting 1.78px, which is a defect this
  repository would have taken seriously: the anchor is the whole of issue 46's canvas. It was the
  driver. The browser floors a dispatched pointer coordinate, so a suite that picks an anchor as a
  fraction of a rect, dispatches 322.9488 and then does arithmetic about 322.9488 is measuring its
  own rounding, and the residual it invents is the fraction times one minus the ratio of the two
  scales, which is 1.7789 on the vertical axis and 0.1500 on the horizontal against 1.7814 and 0.1486
  observed. Predicting both numbers from the floor alone is what settled it, and it settled it in
  a minute where re-reading the page's arithmetic would have taken an afternoon and found nothing.
  The repair is not a tolerance wide enough to swallow it, which would also swallow a real
  regression: the driver rounds the point once and then uses that integer for the dispatch and for
  every line of arithmetic, and `px()` throws on a non-integer rather than rounding, because
  rounding at the point of dispatch leaves the caller still holding the float. Second instance of
  `kaizen-verifier-not-exempt-from-verification`, and the first where the tell was quantitative:
  a discrepancy that is an exact function of a known rounding is evidence about the harness.
- `kaizen-a-scanner-cannot-tell-use-from-mention` &middot; **A mechanism that reads prose cannot
  tell a use of a token from a mention of it, and the documentation is where the two collide.**
  Twice in one day. `#48` in a sentence about issue 48 was read as a claim to be working on it and
  put a card nobody was on into In progress; and a commit message explaining that the board bot's
  own commit still carries the CI skip marker was obeyed as one, so a push changing three workflow
  files ran no gate, no deploy and nothing at all. Both mechanisms were right about the string and
  wrong about the sentence, and both were reading the place where this repository writes about its
  own machinery, which is the place it is most worth writing well. So the question to ask of a
  scanner is not how precise its pattern is. It is whether the text it reads is ever about that
  pattern, and where the answer is yes there are two honest moves and no third: delete the scanner,
  or stop the text from being able to spell the thing. Both were taken here, one each.
- `kaizen-a-checker-inside-the-set-it-counts` &middot; **A mechanism that enumerates a set it is
  itself in will match itself.** Three shapes here now: a wait loop grepped process output for the
  task id it was running under, so it always found a match and never ended; a count of running
  watchers read five because `ps -eo args` piped into a grep for the script name matched the grep
  asking the question, and there was one watcher; and the supersede job, issue 62, enumerated
  in-flight runs, found itself among those that had started work, and cancelled nothing. Before
  writing a check that counts a set, ask whether the checker is in the set, and where it is, exclude
  it by an identity it already holds, its own process id, run id or job id. Pattern-based exclusion,
  the `[w]atch.sh` bracket trick or filtering out the word `grep`, holds only while the pattern does
  and then fails silently; an identity does not rot. The durable form was already here and was not
  generalised: `2026-08-09-gate-scoped-to-the-public-surface` licenses the gate's matches on its own
  source as exact triples of rule, path and string.
- `kaizen-a-modal-has-to-say-what-it-may-not-cover` &middot; **A modal is a claim about what it
  covers, so it has to name what it does not, and outranking is not the same as not covering.**
  Every sheet on this page was `inset: 0` with a backdrop at z-index 20 over a header that set none,
  which made theme, ghosts, feedback, students and board unreachable on five addresses. Nothing was
  disabled, hidden or undersized: all five stayed present, enabled and 26 by 26, so every property a
  driver would have queried was intact and the only reading that saw it was `elementFromPoint`. The
  distinction the repair needed already existed in `index.html`, where issue 57 put the theme first
  as "the only item here that belongs to the page rather than to a view", and the modal had simply
  never been told: covering every view is what it is for, covering the artefact's own controls is
  the defect. The second half was found by trying to prove the first. With the header raised above
  the sheet and the sheet still at `inset: 0`, every hit test passed, because being painted on top
  is not the same as not being covered, and below the phone breakpoint that page would have put five
  live controls over the middle of an opaque full bleed box. So the two mechanisms are two claims
  and each is asserted alone: rank says what may cover what, geometry says the sheet starts where
  the header ends, and neither is evidence for the other. A further instance of
  `kaizen-a-widened-control-keeps-its-neighbours-reachable`, and the first here where nothing
  touched the control at all: something else arrived on top of it.
- `kaizen-a-wait-must-be-weaker-than-the-claim` &middot; **A wait that encodes the assertion can
  only ever time out.** A driver waits for the page to finish answering and then asserts that the
  answer is right, and those are two different sentences. Issue 137 wrote them as one: the wait was
  for the brush to land on the RIGHT week, so when the plant made it truncate instead of snapping,
  the wait was never satisfied, the group threw at twenty seconds, and the assertion whose own name
  describes that exact defect never ran at all. The report then said the harness had failed, which
  sends a reader somewhere else entirely, and the plant proved nothing about the assertion it was
  supposed to prove. A wait has to be satisfied by every answer the page could give, the wrong ones
  included: "the band moved at all" is a wait, "the band is on week fourteen" is the claim. Three
  waits were rewritten that way and the eight plants each then went red under their own name. This
  is `kaizen-gate-shown-to-fire` met inside the driver rather than inside a gate:
  an assertion that cannot be reached is an assertion that has never been tested, and a suite full
  of them reports on the ones that happen to be reachable.
- `kaizen-a-control-you-drag-sits-where-its-own-state-cannot-move-it` &middot; **A direct
  manipulation control has to sit in a slot its own state cannot move.** The term strip's first slot
  was between the heading and the readout, which reads better and is wrong: the readout is sized by
  its own readings, `tiles` goes from `80` to `76 of 80` the moment a window is on, and every item
  to its left shifts by the difference. Measured at 1536: the strip's own track jumped 31.4 CSS px
  the first time the reader narrowed the band and 6.8 more as the digits changed, which is two weeks
  of a 24 week track moving out from under the pointer that was dragging it. The row already had the
  answer in it, from issue 131: the nav is a fixed distance from the right edge and the readout a
  fixed distance from the nav, so the slot between them is the only one in the row whose left edge
  and width are both constant. The general form is that a control which reports a value AND is set
  by a gesture couples the layout to itself, and every other control on a row that resizes with its
  own text is a control whose geometry is a function of what it is saying. The second half of the
  repair is that the gesture takes its geometry once, at the press, so a row that did reflow could
  not corrupt a drag already begun; the two are separate, because being in a stable slot is not the
  same as surviving an unstable one.
- `kaizen-a-fallback-that-runs-once-is-not-an-address` &middot; **State that lives in the URL has to
  be resolved on every arrival, and a default applied at construction is not that.** Issue 136 put
  the programme scope in the address, which is the whole mechanism by which a cross-programme
  question is answerable and can be sent to somebody. The resolver answered `null` to every address
  that was not a `#/p/` one, and one line at construction turned that null into the union, so `#/`
  drew all seven to a reader who OPENED it and did nothing at all to a reader who ARRIVED at it. The
  page was consistent, the code read reasonably, and the same six characters meant two different
  things depending on how you got there. The tell is structural and cheap to look for: a resolver
  with a "no opinion" answer and a caller that supplies a default is a design where the default is
  reachable on exactly one code path. The address either names a state or it does not, and if it
  does, the resolver owes it an answer on the hashchange path too. Issue 137 hit this, worked around
  it by driving `#/p/ALL`, and reported it rather than patching it, which was right: a workaround in
  a driver is not a fix in a page.
- `kaizen-a-fragment-navigation-builds-no-document` &middot; **Two urls differing only in their
  fragment are the same document, so "navigating" between them is not a load and a driver that waits
  for one waits out its timeout.** The sixth dead instrument found in this run, after relative
  luminance ignoring alpha, a driver waiting for a drawing nobody has, a hit test answering the same
  either way, an `elementFromPoint` check blind to a chip under the plate, and a press whose y came
  from the header padding. The `the scope` phase reached three addresses with `Page.navigate` and its
  assertion said `each read cold`; none of the three built a document, and the first did not even
  change the hash, because the phase before it hands the page over at `#/`. So the union that
  assertion called cold was the scope the page had been CONSTRUCTED with, and it would have passed
  against a page with no hashchange handler at all. The cost was visible in the clock and nobody had
  looked: four such navigations at 20000 ms each, and replacing them with reloads took the suite from
  278.0 s to 209.0 s. Two countermeasures, and the second is the one that generalises: a cold claim
  is made with a reload of the address, never with a navigation to it; and **a driver step that
  regularly consumes its whole timeout is evidence, not a slow machine**. This is
  `kaizen-a-wait-must-be-weaker-than-the-claim` from the other end: that lesson is about a wait so
  strong it can never be satisfied, and this is about one so weak it is satisfied by a page that was
  never asked the question.
- `kaizen-a-deploy-landing-mid-run-reads-as-a-page-regression` &middot; **A run driving the public
  origin is driving bytes somebody else can replace under it, and when they do it reads as a
  regression in whatever phase happened to be loading.** `scripts/verify.sh` against the origin went
  red on one group of one phase, `window.ZT never appeared`, while every behavioural phase against
  the same origin passed and the same suite was green against a local server over the same `site/`.
  The cause was a board sync deploying two minutes into the run: `pages.yml` had replaced the
  origin's files while the browser was loading one of them. Re-run once the deploy had settled: 291
  of 291. This is `kaizen-a-generator-must-not-run-beside-a-server-of-its-output` at the other end of
  the wire, and the reading is the same. **A single group throwing `window.ZT never appeared` while
  the rest of the run is green is a question about the bytes before it is a question about the
  code**, and the cheap check is the deploy history for the minutes the run covered.
- `kaizen-a-generator-must-not-run-beside-a-server-of-its-output` &middot; **A gate that regenerates
  the bytes another process is serving will be blamed on the change under test.** `check_build.sh`
  rebuilds `site/instance.js` and `site/layout.js` in place; run while a smoke suite was serving that
  same directory, the grain browser fetched a truncated `instance.js`, `window.GI` was undefined and
  every one of the nine grain phases failed with the page throwing `no view`. It reads exactly like a
  page regression, in the phases furthest from the change, and the only reason it did not become a
  false defect is that the suite prints the page's own thrown error rather than only the assertion
  that fell over. Run the gates and the suite one after another, and read `no view`, `undefined` and
  a whole phase group failing at once as a question about the bytes before it is a question about the
  code.
- `kaizen-ask-the-subject-its-state-not-the-log-of-what-you-did-to-it` &middot; **A record written
  when you acted describes the act; only the subject can describe its state, so a check that needs
  to know what a system IS must ask the system rather than the log of what was last done to it.**
  Issue 6 offered a manifest committed by the deploy and compared by a later run, and the card
  supplied the objection that kills it: the thing being hunted is a file surviving from an EARLIER
  deploy, and a manifest is a record of the LATEST one, so the hunted case is exactly the case where
  the record is silent. The origin already answered the question itself, in a `version.js` the
  deploy fails without, and a file list derived from the commit the origin NAMES describes whatever
  is live however far behind it has fallen. The same reading settled which API to trust: the Pages
  builds endpoint reported a commit three days stale while the served bytes were current, so the
  side channel was wrong and the subject was right. **The corollary is where this bites elsewhere.**
  Anything of the form "we wrote down what we published" degrades into a claim about a past event
  the moment the event stops being the most recent one, and it degrades silently, because the
  record still parses and still looks like an inventory. Prefer a reading the subject has to make
  good on; where there is no such reading, say the inventory is a history and not a census, which is
  what the ghost sweep does when it calls its list "what this repository has ever published" rather
  than "what is out there".
- `kaizen-an-instrument-sized-by-free-space-is-sized-by-everything-else` &middot; **A control given
  `flex-grow` is a control whose width is whatever the row has left over, so every other item in
  that row becomes an input to it.** Issue 142 widened the term strip by letting it share the row's
  surplus with the heading, which works and quietly makes the strip's own scale a function of the
  nav's text: `work 5/22` against `work 12/22` is 6.76 CSS px, `sessions` against `modules` is 0.84,
  and both of them moved the track a reader was pointing at. That is the defect #137 chose this slot
  in the row to prevent, met one level down and not visible in any diff. Two countermeasures, and
  they are both cheap. **Size an instrument from the viewport rather than from the remainder**, with
  breakpoints, so its width is a function of one thing a reader can see; and **reserve the width of
  any value that states a count or a name beside it**, measured once against the real font from the
  widest string it can ever hold, so a number gaining a digit does not move its neighbours.
- `kaizen-the-later-rule-wins-so-a-breakpoint-belongs-after-what-it-raises` &middot; **A media query
  raising one longhand loses to a shorthand declared later in the file at the same specificity, and
  the page looks exactly as it did before.** The three `min-width` rungs that widen the strip were
  first written beside the other breakpoints, above `.brush`, where `flex-basis: 452px` lost to
  `flex: 0 1 356px` below it; the stylesheet said the strip grows, and the strip was 356 at 2560 and
  at 1366 alike. Found by driving the real page and reading the rendered week, not by reading the
  file. This is `kaizen-a-new-control-inherits-the-old-ones-defects-not-its-repairs` at the level of
  ordering rather than of inheritance, and the same repair applies: put the block after the base
  rules rather than reaching for a specificity hack.
- `kaizen-the-ux-defect-and-the-performance-defect-were-the-same-line` &middot; **When a control is
  both slow and awkward, measure before you split the work: the two complaints can have one cause.**
  #142 said the term strip's implementation was not the best and #145 said dragging it rendered the
  diagram very, very slowly, and they were dispatched as separate concerns. The single largest frame
  in a sampling profile of three drags was `placeLabel`, at 289ms of 1470, which is the function that
  decided whether the band's label sat on the band or beside it; it read four rendered widths on
  every repaint and was wired to a ResizeObserver as well. **Deleting the label from the track fixed
  the appearance defect and removed the largest cost of the gesture in the same edit.** The rule is
  not that this always happens; it is that a performance card and a craft card pointed at the same
  control should share one profile before they share a plan.
- `kaizen-a-backticked-date-is-read-as-a-citation` &middot; **A year-month-day inside backticks in
  any tracked file is read by `scripts/check_repo.sh` as a citation of a dated entry, and the gate
  goes red for a slug that does not exist and never could.** It cost a red run on a comment in
  `scripts/smoke.mjs` that used the window start off the owner's own card as a worked example of a
  date format. `CITATION_USE_RE` matches a backticked year-month with an optional day followed by
  lower-case words, so a bare date in prose is safe and a backticked one is not. This is the same
  family as the rule that reads a comma or dot grouped number as a money figure, and the repair is
  the same: **change the text, never the rule.** Describe the shape instead of quoting an instance,
  or build the value from parts.
- `kaizen-a-concession-outlives-the-premise-that-made-it-acceptable` &middot; **A limitation
  written down honestly stops being honest the moment the condition that made it tolerable
  changes, and nothing about the sentence changes to say so.**
  `scripts/gen_forbidden_hashes.sh` carried a paragraph conceding that hashing the name register
  bought obscurity and not secrecy, because the salt was committed and Spanish given names are a
  short dictionary. Every word of it was true when it was written and it was written about a
  PRIVATE repository, where an attacker had to be let in before any of it mattered. The
  repository became public. The paragraph did not move, three documents went on saying the
  repository was private, and the concession then read as a considered acceptance of a risk
  nobody had re-priced. Issue 164 found the salt printed in the header of the very file it
  protects, beside a count of the real people covered, at a hash rate that clears a hundred
  thousand candidates in a fraction of a second.
  **The rule is that a stated limitation carries its premise, and the premise is the thing to
  re-read, not the limitation.** A concession is a conditional: *given X, this is acceptable*.
  Filing it as a known gap files the conclusion and drops the condition, and a conclusion with no
  condition attached cannot go stale in any way a reader will notice. So write the premise into
  the concession, in the same sentence, and treat a change in project configuration as a sweep of
  every sentence that named the old one. The cheap version of that sweep is to grep the
  documentation for the configuration word itself; here, `private` returned five live claims and
  the API returned `public`.
- `kaizen-a-workflow-command-is-only-a-command-where-something-is-listening` &middot; **A line
  whose safety depends on being intercepted is a plain `echo` everywhere the interceptor is
  absent, and the place it is absent is usually a developer's terminal.**
  `scripts/ci_register.sh` emitted `::add-mask::` over the salt, which is exactly right inside
  Actions, where the runner consumes the line so it never reaches the log, and which is an
  ordinary print of the secret anywhere else. The first local run of the script disclosed the
  value and cost a rotation. The same shape covers `::error::`, `::group::`, `$GITHUB_ENV` and
  every other runner affordance: they are protocol, not behaviour, and protocol with no listener
  degrades to whatever the raw bytes do. **Guard on the environment that provides the listener,
  and pick the failure direction on purpose:** guard a masking line so it is silent off-runner,
  and let a diagnostic line print plainly. The test that catches this is running the script
  outside CI and reading its output, which is the same discipline as running a gate on a machine
  that does not have what CI has.
- `kaizen-a-comment-that-outlives-the-code-it-describes-is-worse-than-no-comment` &middot; **A
  safety argument written next to the mechanism becomes a lie the moment the mechanism is deleted,
  and it fails loud in the one direction nobody checks: it reassures.** `app.css` named four
  devices keeping invented session prose apart from the published titles beside it. Issue 108
  deleted two of them on instruction and left the paragraph naming four, so for the life of the
  file a reader auditing the honesty of that block would have read four devices and been able to
  find two. Nothing was red, because nothing asserted the devices; the assertion that existed had
  been turned around to demand their absence, which is a correct record of the instruction and a
  poor record of the argument. **Where a comment states that N things protect something, the
  number is a claim and belongs in an assertion, in the direction the argument runs.** The cheap
  version is to grep the file for each device the comment names; here `dummy` and `agenda-note`
  both returned zero in the file the comment sits beside.
- `kaizen-a-measurement-taken-on-one-machine-is-not-a-property-of-the-repository` &middot; **A
  number derived from rendered text is a property of the machine's fonts, not of the code, and
  fitting a constant to it ships a defect to every other machine.** Issue 149 measured the widest
  table this sheet can draw at 1145.98 CSS px and set a ceiling above it with what looked like
  ample room. It went red in CI on its own new assertion: the same table on the runner demands
  1160.69, because every column is sized by its content and the two font stacks resolve to
  different faces. **A constant fitted to a measured layout needs headroom sized by the spread
  between machines, and the assertion that holds it has to run on the machine the run is on.**
  The assertion is what makes the constant safe rather than lucky, and it did its job on its first
  CI run rather than in a year.
- `kaizen-a-sweep-needs-three-states-not-two` &middot; **A surface that failed to render holds no
  text, and no text is exactly what a clean surface looks like.** Every dead instrument this project has found is the same shape, a check
  that cannot tell *I looked and found nothing* from *I could not look*, and a sweep is the most
  exposed thing there is to it because finding nothing is its success condition. So a sweep ends
  each surface in one of **read, held no text, could not be read**, counts the three apart, refuses
  the run on either of the last two, and **prints how many surfaces it actually visited in the
  pass message** so a green line is a claim about a number rather than an absence of complaint.
  Proved by making one surface unreadable: the run reported 26 blind and 0 holding no text, which
  are the two answers that had to be distinguishable.
- `kaizen-a-deletion-card-has-two-halves-and-the-second-one-is-invisible` &middot; **Deleting a
  sentence that carries a fact deletes the fact, and the page gets shorter and less usable in one
  move that reads as progress.** Three of these six cards were deletions. In each, the sentence
  went and the fact it carried was relocated onto the thing it is about: the window's inertness
  onto the control, which greys and refuses and carries the count that refused it; the outline's
  ordering onto the numbering and the ascending ordinals that were already there; the two footer
  affordances onto the drawing and the zoom readout. **The assertion that protects a deletion has
  to assert the relocation, not the absence**, because an absence-only assertion is satisfied by a
  page that lost both. Issue 153's sweep is written in both directions for exactly this reason, and
  the plant that proves the second direction deletes a reading rather than adding one.
- `kaizen-a-refusal-in-a-shared-driver-helper-beats-a-timeout-in-the-caller` &middot; **When a
  page gains a state where a control refuses a gesture, every test helper that drives that control
  gains a way to hang.** Issue 151 made the term strip inert on one reading; two phases that set a
  window while that reading was up spent twenty seconds each in a wait that could never be
  satisfied and reported a harness failure in place of the assertion they were about to make. The
  helper now checks the refusal itself and **throws immediately, naming the reading and the card**,
  so the failure points at the caller's setup instead of at the runner. Silently accepting no
  change would have been worse than the timeout: a helper that says it set a window and did not is
  a phase's whole premise being false.
- `kaizen-a-tangent-is-not-a-direction-a-reader-can-see` &middot; **Three exact measurements can
  all say the picture is right while the reader is right that it is wrong, and when that happens
  the measurements are answering a question nobody asked.** The arrowhead on issue 156 sat on its
  line's end point to four decimals, on the target tile's edge to every decimal measured, and
  rotated to the curve's exact tangent there. All three true, and the head still read as detached,
  because a tangent is an instantaneous fact and a reader sees a stretch of line. **An ornament
  attached to a curve is aimed over its own length, not by the derivative at the point it is
  attached at.** Measured over the head's own six and a half units, the line had turned away by up
  to 27.5 degrees; over two of them, by 41.5. **The general form: when a shape terminates another
  shape, the direction that matters is the chord across the terminating shape's own extent.** It
  applies to any tick, cap, label or marker sitting on a curve, and the check that catches it is
  the one that measures over the ornament's extent rather than at its anchor.
- `kaizen-take-the-shape-off-the-thing-you-are-aiming` &middot; **A rotation cannot be written
  without knowing how long the thing being rotated is, so a size typed into a path string and known
  nowhere else is a change waiting to become a third copy.** `M0 0 L-6.5 2.6 L-6.5 -2.6 Z` carried
  the head's length twice and no name; the repair named it once and built the string from it, and
  the assertion reads the length back out of the `d` the page painted rather than knowing it, so a
  card that changes the triangle and forgets the rotation fails instead of quietly moving what the
  check is measured against.
- `kaizen-a-check-that-works-around-a-defect-is-the-defect-reported-in-the-wrong-place` &middot;
  **When an assertion has to compensate for the page instead of measuring it, the compensation is
  a defect report nobody read.** The month grid drew a day at a month boundary in two panels, and
  the assertion that a grid marks the window instead of filtering it counted DISTINCT lit days
  through a `Set`, with a comment explaining that two adjacent panels overlap by construction. That
  comment was the bug, written down, in the file whose job is to notice bugs, and it sat there
  until the owner filed the same thing from the screen. The repair deletes the workaround and
  asserts both readings, 21 lit cells over 21 distinct days, so the defect coming back now fails
  twice. **The general form: a `Set`, a tolerance, a sort or a filter added to make an assertion
  pass is a claim about the page, and it should be read as one.**
- `kaizen-drive-an-assertion-to-a-width-where-its-claim-is-not-vacuous` &middot; **A claim that is
  trivially true at the width the suite happens to run at is not a check, however carefully it is
  worded.** The week grid may be wider than the sheet while the page never scrolls sideways, and
  the first draft of that assertion read `docOverflow === 0` at 1536, where twenty four columns fit
  and nothing overflows anything: it would have passed on a grid that had silently dropped half its
  columns. It is driven to a narrow width now, where the grid genuinely overflows, and asserts the
  pair, that the scroller is scrolling and the document is not, with the cell count required to be
  the same as at the wide width. **The general form: before writing an assertion, ask at which
  width, scope or state its subject exists at all, and drive it there.**
- `kaizen-the-triage-guess-is-a-hypothesis-and-the-measurement-is-the-answer` &middot; **A card's
  triage can name the wrong family with complete confidence, and the only thing that settles it is
  measuring the thing he pointed at.** Issue 160 was triaged as the #142, #143 and #149 family,
  nothing in the layout measured above 980px sitting in a container two thirds wider at 2560. The
  measurement refused it: the sheet has a maximum width, so the rows box is 1238px at 2560 and
  1238px at 1536, and the space above the heading was 0 at both, and 0 at 390 as well. The defect
  was a gutter with three sides, which is issue 113 one side round. **Report the refusal rather
  than quietly fixing something else**, because the triage will otherwise be cited by the next card
  as though it had been confirmed.
- `kaizen-spacing-is-a-fact-about-the-painted-shape` &middot; **A stroke straddles the edge it is
  drawn on, so the shape a reader sees is wider than the shape the geometry specifies, and any
  spacing computed against the specification closes by the width of the stroke.** Issue 139 stepped
  its rings 5.4 apart against a radius of 2.1 and reasoned that 2.57 radii was the smallest spacing
  at which four of them read as four; the stylesheet then gave each ring a stroke of 1.1, which put
  the painted diameter at 5.3 and left **a tenth of a unit** of daylight, and the row painted as one
  smear at every scale the drawing is framed at. The number was never wrong for the shape it was
  computed for. **The general form: geometry and stylesheet each hold half of what a reader sees,
  and a distance that matters visually has to be computed over both halves.** The check that catches
  it measures the gap off the rendered elements and derives what it must be from the stroke the
  browser resolved, so the stylesheet and the layout cannot drift apart again in silence.
- `kaizen-the-answer-to-is-this-aligned-can-be-yes` &middot; **A card that asks a question is
  allowed to be answered, and the answer is worth shipping as an assertion even when nothing moves.**
  Issue 155 asked whether a ring was aligned; it was, to four decimals, at three widths, for every
  ring count. Three named candidates were all falsified and the tile the card was filed on was not
  touched. What made the card worth its width was that the same measurement, taken over every tile
  rather than the one that was pointed at, found a different defect on the same feature, and that
  the question itself became a standing claim rather than a measurement somebody took once. **A
  triage that turns out to be wrong is not a wasted card; measuring beyond the tile that was
  pointed at is what turns it into a good one.**
- `kaizen-a-watcher-that-loads-after-what-it-watches` &middot; **A watcher registered after the
  code it watches is not a watcher, and nothing about it looks wrong.** feedback.js was written to
  put an uncaught error on screen and says so in its own comment, that it reads the deploy stamp
  directly "because this block has to answer in a run where app.js has thrown". Its listener was
  registered from the last script tag in the document and every one of app.js's ten throws fires
  before that line is reached, so the file whose job was reporting a broken load was the one file
  guaranteed to be absent for it. Measured three ways at once: a throw inside a module left the
  drawing on screen and said nothing, a one node drift between the two generated documents drew a
  blank canvas and said nothing, and both looked in a diff exactly like a page with error handling.
  **The general form: for anything that watches, the position of its registration is part of its
  correctness, and the test is not whether the handler is right but whether it exists at the
  earliest moment the thing it watches can happen.** The corollary is that the watcher belongs in
  its own file, ahead of everything, and small enough to be obviously correct, rather than inside
  the large file that happens to own the reporting machinery.
- `kaizen-a-name-that-states-a-claim-is-a-copy-and-a-name-that-states-a-job-is-not` &middot; **When
  the same sentence turns up in two places, the question is not whether the strings match but
  whether one of them is stating a claim the other owns.** Issues 237, 240 and 241 are one family:
  a workflow step named after a line stated elsewhere, with only the `# verify-step:` marker
  joining the step to anything, and that marker joins two KEYS and has never read the `name:`
  beside it. The obvious repair is a guard refusing any step name that equals a line the
  repository already states. **Measured at `bac826e` before designing one: eight of the twenty
  nine workflow step names are such a copy**, over three populations, being the gates' `== ` run
  headings, `scripts/verify.sh`'s step labels, which that file also prints as `== ` headings, and
  `scripts/check_build.sh`'s `# N.` section banners. **Three of the eight state a CLAIM about an
  outcome and five state the JOB the step runs.** `Every step scripts/verify.sh runs is run by a
  workflow` was the first kind and had already gone false, because it drops the heading's closing
  clause and so claimed the check refuses what it in fact excuses. `Prove the repository gate
  fires` is the second kind: it equals a verify.sh label because verify.sh names the same job the
  same way, and rewording either side leaves both sentences true. **A guard keyed on string
  equality would fire on all eight and can never tell the two apart**, so it would buy the removal
  of three defects at the price of five names deliberately worded away from the obvious one.
  **The general form: a duplicate is a defect when one copy is a restatement of something another
  file owns and reworders, and it is a coincidence when both are independent descriptions of the
  same job. Only the first drifts, and the difference is grammatical rather than textual, which is
  why this one stays prose.** The corollary is the rule that was shipped instead: name a step
  after its job, never after a claim.
- `kaizen-a-rule-found-by-one-case-is-stated-about-the-case-and-not-the-rule` &middot; **A rule
  discovered by hitting one instance of it gets written in the vocabulary of that instance, and
  the wording then outlives the accuracy.** Issue 237 found a step name copied from a gate's
  printed heading and wrote `DO NOT NAME THIS STEP, OR ANY OTHER, AFTER A LINE A GATE PRINTS`.
  Issues 240 and 241 found two more of the same shape, and by the time the class was actually
  measured the real defect had a different name: **stating a CLAIM about an outcome the step's own
  `run:` block computes**. Both sentences then stood in `.github/workflows/build.yml`, two hundred
  lines apart, both unconditional, and nobody noticed they disagreed. **Measured at `b9b372f`, the
  first-approximation wording is wrong in both directions at once.** It over-reaches: `verify.sh`
  prints `== $name` for every step, so its 15 labels are all lines a gate prints, and 5 workflow
  step names equal one of them and were deliberately KEPT, because two files naming the same job
  the same way is a coincidence and not a copy. And it under-reaches: the rule's 3 real violations
  at that SHA copy nothing at all, so **its coverage of them is 0 of 3**, and the copy-keyed search
  built on it could not have found any of them however it was tuned.
  **The general form: when the second instance of a rule arrives, re-read the sentence the first
  one produced and ask whether it names the defect or the route by which the defect arrived. The
  route is usually what got written down, because it is what was visible.** Two corollaries. The
  first is that the repair is to qualify and subsume rather than delete: the old wording carries
  the reasoning of the case that produced it, which here is why a drifted copy must not be
  re-synced by hand, and deleting it takes that with it. The second is that two rules in one file
  must be read together before either is applied, so the widened one has to say so where the
  narrow one is written, not two hundred lines away.
- `kaizen-a-bound-names-a-quantity-and-the-quantity-can-move-out-from-under-it` &middot; **A number
  copied out of a measurement into a bound stops being about the thing it was measured off the
  moment either side moves, and the stale copy and the current figure then read as two opinions
  rather than as one quantity at two dates.** Issue 248 opened on exactly that pair, an enforced
  0.2370 in `scripts/smoke.mjs` and a stated 0.1730 cited in eight live sentences, both of them
  shares of the same phone viewport, and the card asked which of the two is the real ceiling. That
  is the wrong question and the shape invites it. Driven off `site/` at the commit each figure was
  written at, at 390 by 844: at `1b7bdc2` the header was 107 and the footer 93, total 200 of 844; at
  `4b67863` the header was 107 and the footer 39, total 146 of 844. Those are 0.2370 and 0.1730 to
  four decimals, and **the header is the same 107 in both**, so neither figure was ever a statement
  about the header, which is the only thing the probe holding one of them reads. The older total had
  been typed into a probe reading a PART of it, and the part it was not reading then shrank by 54
  px. **A bound that has dropped a term cannot go red on that term however far it moves**, and the
  newer figure being quoted in eight places kept the whole arrangement looking supervised. **The
  general form: before two constants are compared, establish what each one COUNTS by measuring it,
  and where a constant was fitted to a rendered artefact, drive the artefact at the commit the
  constant was written at rather than reading the commit message.** A message says what somebody
  meant to do and the bytes say what the number was taken off. Two readers of this card in a row
  reasoned from adjacency, that two shares quoted in one sentence must be the same measurement, and
  the cheap tell against that was available to both: the changelog records the same header height,
  107, beside two different phone chrome figures, 23.7 per cent and 17.3 per cent, and one quantity
  cannot take two values while its stated component does not move.
- `kaizen-a-justification-written-from-the-motivating-case-is-false-on-the-rest` &middot; **A reason
  written beside a thing at the moment it was built is a reason about the case that made somebody
  build it, and measured over the whole population it is usually true of a minority, which is how a
  well-argued feature comes to look unjustified.** Issue 89 built the `grain` control because two of
  the seven drawings are 2578 and 2470 units tall, and the sentence beside it says so. Measured over
  all seven at `2e7563a`, height is what it does on two of them: the fit moves 0.3088 to 1.1317 on
  Z-BL and 0.3223 to 1.1317 on Z-SC at 1440 by 900 and does not move at all on the other five, at 390
  by 844 it is bound by a width that is the same 1230 at both altitudes so it barely moves on any of
  them, and on one union it goes DOWN, 0.6774 to 0.6399. **So a reader meeting the control on five
  sevenths of the corpus meets something the written reason does not describe**, which is why it kept
  returning to the list of things to re-examine and why three redesigns passed over it without
  anybody being able to argue it either way: there was nothing to argue with. What it actually does
  on all seven is exchange a class of object for another, 166 tiles in the two syllabus lanes at one
  altitude against 76 at the other and not one Module tile anywhere at the first. **The general form:
  a justification is a claim about a population, so state the population it was measured over, and
  when a thing survives a review by not being questioned, the cheap first move is to re-measure the
  reason rather than to re-argue the thing.** The corollary is that the reason then carries counts,
  and a count in a comment cannot go red: it belongs in an assertion, which is
  `kaizen-a-comment-that-outlives-the-code-it-describes-is-worse-than-no-comment` met before the
  comment has had time to rot rather than after.
