# The kaizen loop

*Written for somebody who does not read code.*

This repository draws one picture. The picture exists so that the operating model behind it
can be argued with, which means the picture has to be wrong in ways that are visible and
fixable rather than wrong in ways nobody can name. The loop below is how a complaint about it
becomes a change to it.

## The loop

**A defect becomes an issue.** Anything a reader can point at counts: a node in the wrong
column, a verb on the wrong end of an arrow, a property that claims to be a fact. The issue
says what is wrong and how you would know it was fixed. It carries no real name, no real
figure and no link into the private corpus, because issue titles are rendered onto the public
page through `site/board.json`.

**An issue becomes a card.** A `status:` label puts it in a column: `status:raw`,
`status:backlog`, `status:in-progress`, `status:done`. An issue with no `status:` label sits in
Raw, which means nobody has looked at it yet. Nothing infers a column; a person applies the
label, and `scripts/sync_board.mjs` renders whatever labels are there. There is no triage step
and no model call anywhere in that path.

**A card becomes a commit.** One card at a time in In progress. One defect per commit, because
a commit that fixes three things cannot be reverted for the one of the three that turned out
wrong.

**A commit closes the loop.** Closing the issue moves the card to Done on the next board sync,
whatever labels it carries. Then the acceptance rule, which is the one that is easy to skip:

> **A change is not reported until a screenshot of the deployed page has been looked at by a
> human or an agent.** Not a green build, not a diff, not a passing check. The picture.

That rule is bought and paid for. This project once reported a page as broken on the strength
of a screenshot taken before the JavaScript ran, and on another day shipped a blank one for the
same reason. HANSEI.md has both.

## The standing backlog

Five things are known to be wrong or known to be constrained. They are issues, they are on the
board, and none of them is a surprise to anybody.

1. **The diagram does not fit one screen.** The page promises one screen and does not deliver
   one at an ordinary laptop viewport. The whole argument for an instance diagram is that the
   model can be taken in at once, so this is the defect that costs the most.
2. **The right half of the canvas is empty.** Density falls away to the right: the left columns
   carry the programme, the companies, the instructors and the session templates, while the
   chain from enrolment onward is one node per column. A type with one instance still gets a
   full column, which is the fixed column-per-type rule showing through.
3. **Instructors and session templates are interleaved.** Both types share a column index, so
   the barycentre sweep orders them together and they alternate. A reader cannot tell at a
   glance which vertical run is people and which is content.
4. **Eight object types have no populate route.** For eight of the types the model declares,
   nothing says where an instance would come from: which system holds the record, who enters
   it, on what event. A type with no populate route is a drawing rather than a model. Removing
   the type is a legitimate answer to this and should not be treated as a loss.
5. **The toy carries no measured values, by design.** Every property is flagged `dummy` or
   `estimated`. This is on the board as a standing constraint rather than as work, so that the
   day somebody proposes putting a real figure on the page, the decision is taken deliberately
   and against the record in HANSEI.md rather than as a small convenience. It is not a defect
   and it is not closed by adding data.

Defects 1, 2 and 3 are all layout and all have different causes, which is why they are three
cards. Fixing them as one change would be the batching that Heijunka exists to refuse.

## The reflection step

After each change, before the card moves to Done, two questions in writing, in the commit
message or on the issue:

- **What did this teach that was not already written down?** If the answer is nothing, say
  nothing. Most changes teach nothing and a reflection habit that manufactures a lesson every
  time is worth less than one that is usually silent.
- **Should the standard work change?** The standard work here is small and nameable: the build
  is deterministic and computes coordinates ahead of time; the gate runs against deployed bytes
  after every deploy; a change is not reported without a screenshot somebody looked at. If a
  change was only possible by stepping outside one of those, that is the finding, and it goes
  into HANSEI.md rather than into a commit message that scrolls away.

The rule that governs both: **when a check fires and the fix looks like weakening the check,
read the artefact it fired on and name the line that proves it wrong.** An alarm that is
inconvenient is not thereby a false alarm. The safety gate's whole value is that it is
annoying at exactly the moment it matters.

## What improvement means here, and what it does not

This toy is thirty nodes, four of which are classes that do not exist, and the four files that
draw it are fifty two kilobytes. Improving it does not mean growing it.
The most valuable change available at any moment is almost always the one that removes
something: a type nobody can populate, a column with one node in it, a property that says
`estimated` and means `guessed`. The wider work behind the diagram lives in
`~/projects/pr-zrive-toy/analysis/ontology/` and holds far more than this page shows. That the
page shows less is the point of the page.

Two things are worth stating because they are the ways this loop fails quietly:

- **A gate that cannot be shown to fire is not a gate.** `scripts/check_forbidden.sh
  --self-test` runs in CI beside the live check for this reason. It is not there to find bugs
  in the rules; it is there so that a run reporting clean means the rules ran.
- **A verifier is not exempt from verification.** A review of this work once published three
  counts as "did not reproduce" that were artefacts of its own parser. Before a finding is
  reported, the tool that produced it gets the same suspicion as the thing it is reporting on.
- **A diagram of what exists cannot be read for what is missing.** Twenty six nodes drawn well
  say nothing about the classes that are not there, and a reader has no way to notice an
  absence from a picture of presences. Drawing the missing classes was the first change to
  this page that added nodes rather than removing them, and it was worth it because the
  absences carry more than any object on the canvas: an object with no class cannot be
  queried, and a leak that leaves no row cannot be found by looking harder at the rows.
  The corollary is the constraint, not an exception to it. Four ghosts fitted because the band
  they belong to was the emptiest part of the drawing and they cost no height; the fifth
  candidate was dropped for the opposite reason. Where an absence goes is a layout question
  before it is an ontology question.
- **A setting that protects a running job says nothing about a pending one.** The workflows
  set `cancel-in-progress: false` and the comment beside it explained, correctly, what that
  bought. It bought exactly one thing: a job already executing is not killed. A run still
  waiting to start was being thrown out by the next trigger into the same group, and the
  difference never showed, because an eviction raises no error and leaves a run that looks
  like one that was superseded on purpose. Three went that way in five minutes before anybody
  counted them. The general form is worth more than the fix: a guard is only evidence about
  the state it names, and the states it does not name are where the quiet failures sit. Read
  the setting for what it excludes, not for the reassurance in its comment.

- **An object can exist while its key does not, and the drawing has to be able to say so.**
  The cohort is a real thing that nothing identifies. Drawing it as a ghost would have been
  false, and leaving it unmarked would have hidden the sharpest finding on the page, so it
  keeps its own outline and gains a second, dashed one. A vocabulary that only has "exists"
  and "does not exist" is too coarse for this model.

- **A collision counter drives a layout away; a penetration depth nudges it.** The verb chips
  scored a position by counting the boxes it hit, so clipping a padding margin by one pixel
  cost exactly what printing a verb across a person's name cost, and the cheapest way out of
  either was to leave the line altogether. One chip ended 134px from the edge it named. Scoring
  by how far a box penetrates, and pricing the ways out separately, keeps the placement local:
  the same drawing, the same obstacles, and the worst chip is now 6px from its line. Where a
  layout is allowed to escape, the escape has to cost more than the crowding it escapes.

- **A relationship the reader has to take on trust is not drawn yet.** The split between a
  session template and a cohort session is the backbone of this model, and with one cohort on
  the page it was two tile colours and a caption: the drawing asserted the split and showed
  nothing that required it. A second cohort off the same six template objects is the smallest
  thing that makes it a picture rather than a claim. The general form: for each relationship
  the model says is load bearing, ask what on the canvas would look different if it were false.
  Where the answer is nothing, the relationship is documentation with a colour, and the fix is
  usually one more instance rather than one more legend entry.

- **An opt-in view has to cost the default view nothing, and the only proof of that is a diff.**
  The cheap way to add a second cohort is to draw it always and hide it with CSS, and it would
  have been wrong: a hidden node still occupies the layout, so every coordinate in the default
  drawing would have moved while every screenshot still looked plausible. Laying the two views
  out separately and shipping both makes the claim checkable, and it was checked the only way
  it can be, by diffing the generated bytes of the default view against the deployed ones.

- **A minimum of crossings is not a minimum of effort for the reader.** The barycentre sweep
  put the two cohorts' sessions in the order that crosses fewest edges, which interleaved them
  and left neither in date order. It was the right answer to the question the sweep asks and
  the wrong drawing. A column of dated things carries an order the reader already knows, and
  breaking it to save crossings spends something the layout cannot see to buy something it can.
