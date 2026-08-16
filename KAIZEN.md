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
