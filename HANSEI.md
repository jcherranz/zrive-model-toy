# HANSEI

The failures this work has actually had, and the prevention now in place for each.

**The thesis, stated once so that no entry has to re-derive it: a name, a green tick, a file's
existence and a description of a thing are all evidence about the thing, and none of them is
the thing.** Every incident below is a version of that sentence. The table is what most readers
need; read an entry when you want the story.

A commit message says what changed. It does not say what the failure cost, how it was caught,
or what would have to be undone for it to happen again, which are the questions asked six months
later by the person deciding whether a defensive-looking check can be deleted.

Three conventions. Where a prevention does not exist the entry says so, because `none` is a
legal value and an honest one, and a claimed prevention that is not in the code is worse than an
admitted hole. Dates carry a day only where the day is established from a file or a commit.
Entries are appended and never reordered, and each carries a slug on the line under its title.
Everything that cites an entry, in prose or in a code comment, names that slug, so a citation
survives insertion, deletion and reordering; `scripts/check_repo.sh` fails the build on a cited
slug that resolves to no entry.

Maintained by hand. There is no generator, so this file and the code can drift, and the only
thing stopping them is somebody reading both.

## The incidents

| # | date | the trap | the rule or mechanism now in place |
|---|---|---|---|
| 1 | 2026-08-09 | Pages serves publicly even when the repository behind it is private | only invented values ship, plus `scripts/check_forbidden.sh` against the deployed bytes |
| 2 | 2026-08-09 | a screenshot captured before the page's JavaScript had drawn | `~/bin/shot` passes `--virtual-time-budget` and refuses to report success with no image |
| 3 | 2026-08 | a fallback turned a bad input into an empty one, and the empty run went green | `fetchIssues` and `scan_dir` assert their inputs and abort |
| 4 | 2026-08 | a checker's own parser invented the discrepancies it published | none. Operating rule only |
| 5 | 2026-08 | a rename scoped to a folder, when the thing renamed was a property of a schema | none. Operating rule only |
| 6 | 2026-08-09 | a real name where the deployed-bytes gate structurally could not see it | `scripts/check_repo.sh` scans every tracked file, on push and on pull request |
| 7 | 2026-08-09 | the gate read the disk and reported clean while the name sat in the index and in HEAD | `scan_snapshots` reads the index and HEAD too, with three probes in `--self-test` |
| 8 | 2026-08-09 | a file split agreed in prose, and a commit that carried another agent's work | discipline: stage explicit paths, never the working tree |
| 9 | 2026-08-10 | a form's default silently removed the permission the instructions asked for | the connect note names the field order, `site/feedback.js` |
| 10 | 2026-08-10 | a commit message citing an issue was read as a claim to be working on it | the commit-message path is deleted; assignment is the only signal, `.github/workflows/issue-status.yml` |
| 11 | 2026-08-10 | a commit message that quoted the CI skip marker was obeyed as one, and every gate stayed silent | none. Discipline: name the marker, never spell it, in a commit message |
| 12 | 2026-08-10 | invented names collided with the register, and the note explaining that collided with it again | `build/model.py` hashes every string the model ships and refuses the build on a hit |

---

## A private repository published a public site carrying real commercial data

`2026-08-09-private-repo-public-pages` &middot; 2026-08-09

**What happened.** GitHub Pages serves publicly even when the repository behind it is private. A
build agent was pointed at a private analysis repository, Pages was enabled, and the site went
live: 371KB holding roughly 1.538 items flagged `measured`, euro-formatted figures numbering
105 and including turnover over 1,1 million, and a counterparty's surname 22 times, on a live
transaction with a 30 August long-stop. Found by an adversarial review, not by the build. Deleting the Pages
configuration, stopping the agent and deleting the repository did not end it at once:
**the CDN kept serving for about five minutes after the origin was gone**, and no lever makes
that instant.

**Root cause.** The checks that ran were the checks that had been thought of. Licences and
trademarks were checked; **whether the site would be publicly readable was never asked**, because
the repository's privacy setting made the question feel answered while governing something else,
who can read the source rather than who can read what the source deploys. A false sense of an
answer is worse than an open question, because nobody goes looking.

**The prevention now in place.** Structurally first: this toy ships only invented values, every
property flagged `dummy` or `estimated`, nothing on the page that would matter if disclosed. Then
`scripts/check_forbidden.sh`, after every deploy, which fetches the deployed
files from the public origin rather than reading the working tree and fails the job on a real
name from the teaching register, a euro-formatted figure that is not one of the two invented
ones, a corpus link, a UUID, an email address, or a word that would name the vendor architecture.
The register is never committed: the gate holds salted hashes and folds the deployed bytes the
same way to compare.

*Prevention kind:* `structural` and `gate`
*Named by:* `scripts/check_forbidden.sh`, `scripts/forbidden_lib.sh`,
`scripts/forbidden_names.sha256`, `build/model.py`

**Note.** This repository was private and its site public when this entry was written, which is
the same pairing, on purpose, stated in TPS.md and README.md. It is public on both sides now, and
this note went on saying otherwise until issue 164 asked the API, by which time other decisions
had been taken on it. The failure this entry records was never the configuration; it was the
configuration being a surprise, and a sentence about the configuration that has stopped being
true is that same failure with a longer fuse.

---

## A screenshot reported a working page as broken

`2026-08-09-screenshot-before-javascript` &middot; 2026-08-09

**What happened.** Chrome's headless `--screenshot` captures when the document is ready, and a
page that draws itself in JavaScript is not finished being ready. A verification screenshot came
back blank and the working page was reported broken. The defect runs the other way too and did:
a genuinely blank page has been shipped on the strength of a screenshot taken at the same wrong
moment, because nothing in a screenshot separates an empty page from one that had not drawn yet.

**Root cause.** A tool's readiness condition was taken as the artefact's. The document being
parsed is a fact about the browser; the diagram being drawn is a fact about the page, and the
screenshot tool had no way to know which one anyone cared about.

**The prevention now in place.** `~/bin/shot` passes `--virtual-time-budget`, which advances the
page's own clock until its scheduled work has run before the frame is captured, and refuses to
report success when no image was written. KAIZEN.md's acceptance rule is built on it: a change
is not reported until a screenshot has been looked at, by a human or by an agent that can see.

*Prevention kind:* `tool`
*Named by:* `~/bin/shot`, KAIZEN.md acceptance rule

---

## A workflow ran on an empty input and reported success

`2026-08-empty-input-reported-success` &middot; 2026-08

**What happened.** A JSON-encoded string was passed where an array was expected. A defensive
fallback caught the type mismatch and substituted an empty list, the loop over that list ran
zero times, the run reported completion, and twenty agents that were supposed to run never ran.
Detected by noticing that nothing had been produced, not by the workflow, which had no opinion
about the difference between finishing a hundred items and finishing none.

**Root cause.** A defensive fallback in the wrong place. Coercing a bad input into a valid empty
one converts a loud type error into a silent no-op, and a no-op is indistinguishable from success
in every channel the run reports through.

**The prevention now in place.** The two places here that consume a list assert it and throw.
`scripts/sync_board.mjs` refuses a `gh issue list` result that is not an array rather than
defaulting to `[]`. `scripts/check_forbidden.sh` asserts a non-zero file count, a non-zero byte
count and a non-empty hash list before it scans anything and exits 2 if any of the three fails,
so the gate cannot report clean on nothing, and its self-test includes an empty directory as a
case that must abort.

*Prevention kind:* `assertion`
*Named by:* `scripts/sync_board.mjs fetchIssues`, `scripts/check_forbidden.sh scan_dir`

**Note.** A fallback is honest only where the empty case is a real answer to a real question.
"Zero issues" is; "zero files to scan" is not, because nobody ever wanted to scan nothing.

---

## A review published three counts as "did not reproduce" that its own parser had invented

`2026-08-verifier-artefact-counts` &middot; 2026-08

**What happened.** A review checked three counts claimed in a model document, could not
reproduce any of them, and published all three as discrepancies. The counts were correct: the
review's reader took a YAML field as a scalar, on eight notes that field is a list, and the three
totals came out short by exactly the amount that misreading accounts for. Found by re-reading the
notes after the discrepancy looked too tidy, since three independent counts do not usually
disagree in the same direction by a related amount. A false negative from a checker costs
attention; a false positive published as a finding costs trust in every true finding beside it.

**Root cause.** The verifier was exempted from the scrutiny it was applying. A schema was assumed
rather than read, and the assumption was invisible because the parser produced well-formed output
on every note, including the eight it was wrong about.

**The prevention now in place.** None in code. The operating rule is that a finding is not
published until the tool that produced it has been checked against a case whose answer is known
independently, and that a suspiciously consistent discrepancy pattern is first treated as
evidence about the parser. Written down here and nowhere else, which is weaker than a test and is
recorded as such.

*Prevention kind:* `none`
*Named by:* `nothing yet`

**Note.** This repository's own version of the exposure is the safety gate, which has a folding
rule, a token rule and a stop list, and would report clean on content it should have caught if
any of them were wrong. `--self-test` is the partial answer and is partial on purpose: it proves
the rules fire on payloads chosen by the same person who wrote them.

---

## A field rename reached 93 notes and not the 12 that shared the schema

`2026-08-rename-by-folder-not-by-schema` &middot; 2026-08

**What happened.** A field was renamed across a corpus by walking a folder, and 93 notes were
updated. Twelve notes carrying the same schema sat outside that folder and were not touched, so
one thing ended up with two names and every query written against either name returned an answer
that looked complete. Found later by a query that returned fewer rows than expected: nothing
reported a partial rename at the time, because 93 files changed is exactly what a successful run
looks like.

**Root cause.** The rename's scope was a location and the thing renamed is a property of a
schema. Those coincide until the day they do not, and a folder walk cannot notice files it was
never pointed at. Same shape as the empty-input entry one level out: there a wrong input produced
a result of the right shape, here a wrong scope did, and in both the reported number was
plausible.

**The prevention now in place.** None in code. The operating rule is to rename by schema: select
the set by the field's own presence across the whole corpus rather than by where the files live,
and report the count of notes carrying the field before and after, so a partial pass is visible
as a number rather than as a later surprise.

*Prevention kind:* `none`
*Named by:* `nothing yet`

---

## A real surname sat in the script written to keep real names out

`2026-08-09-gate-scoped-to-the-public-surface` &middot; 2026-08-09

**What happened.** `scripts/gen_forbidden_hashes.sh` reduces the faculty register to salted
hashes, so that this repository can look for real names without holding any. Its header
explained how a register filename is parsed into a person using a real surname in plaintext, the
seller's, the same name as in `2026-08-09-private-repo-public-pages`: on the day the safety
discipline was written, inside the one file whose sole purpose is keeping that class of string
out. Found by an independent scan of tracked files run by somebody who was not the author, and
not by `scripts/check_forbidden.sh`, which ran green throughout and was right to, since that gate
fetches deployed bytes, Pages publishes `site/` and nothing else, and `scripts/` returns 404 on
the live origin. Not an exposure: the file was never served, checked against the origin rather
than assumed. What is worth recording is the day in which the repository's own safety machinery
was the only tracked file carrying a real name, and nothing in the project could have said so.

**Root cause.** The gate's scope was the public surface; the rule it enforces is a property of
the repository, and `site/` is a fraction of what is tracked. Putting the gate on deployed bytes
was correct and still is, and it answered "is what the public reads clean" so convincingly that
nobody asked the other question. Same shape as `2026-08-09-private-repo-public-pages`, one level
in.

**The prevention now in place.** `scripts/check_repo.sh` scans every file `git ls-files` reports
against the same salted hash list and fails the build: on every push and every pull request
through `.github/workflows/repo-gate.yml`, and in `board.yml` before the board commit, which is
the one path that reaches `main` carrying `[skip ci]`. The five rules are one copy in
`scripts/forbidden_lib.sh`, shared by both gates, so neither can drift. Where the origin gate
prints a name it finds, because that name is already public, this one prints the file and the
line numbers and withholds the token: a CI log is not where a still-private name should first
appear.

*Prevention kind:* `gate`
*Named by:* `scripts/check_repo.sh`, `scripts/forbidden_lib.sh`,
`.github/workflows/repo-gate.yml`, `.github/workflows/board.yml`

**Note, and it is the uncomfortable part.** The author had, in that same session, removed a
different real surname from `build/safety_grep.py` and written it up in CHANGELOG.md, so the rule
was being applied in the same hour to a neighbouring file. Attention was on the file being edited
and not on the file being written, which is the ordinary way this goes wrong and exactly why the
answer has to be a gate rather than a resolution to be more careful.

**Second note.** A gate that scans its own source finds the rules it is made of. The answer is a
table of declared self-matches, each an exact triple of rule, path and matched string, rather
than a list of files the gate skips: skipping a file is how the next one of these hides, and the
file it would have hidden in this time is the gate itself. Two conditions keep the table from
becoming a blanket, an entry that stops matching fails the run, and the real-name rule cannot be
declared for any path at all.

---

## The gate reported the tree clean while the name was still in the repository

`2026-08-09-gate-read-the-disk-not-the-repository` &middot; 2026-08-09

**What happened.** Two things, and the second is the serious one. First, the fix recorded in
`2026-08-09-gate-scoped-to-the-public-surface` was reported complete and was not made: the
surname was removed from the working copy and never committed, so the repository, which is what
a clone gets, still carried the name.
Second, `scripts/check_repo.sh`, the gate written for exactly this defect, was run against that
repository and printed `VERDICT: clean` and exited 0. Not a gap but a false assurance, which is
worse, because a gap leaves the risk visible and an assurance closes the question. Found by an
independent watchdog scan run by somebody who was neither the author nor the gate, the second
time on this project that an adversarial check found what the author's own verification missed.
Two for two is the base rate rather than bad luck, and it is the argument for keeping an
adversarial pass in the loop.

**Root cause, and it is not the name rule.** `git ls-files` names paths, and everything the gate
then read, it read off the disk: one of three copies of a tracked file and the only one that is
not the repository, since the index is what the next commit will carry and HEAD is what the
repository already carries. They differ exactly when somebody edits without committing, which was
the state throughout, so the gate's answer was true and the question was wrong. Every other
candidate, the hash list, the shared salt and truncation, the treatment of `.sh` files and the
folding, was eliminated rather than argued away by restoring the original line to the disk and
watching the gate fire on the first run.

**The prevention now in place.** `scan_snapshots`: for every tracked path whose index copy
differs from the disk, the index copy is scanned too, and likewise HEAD's, and a finding says
which snapshot it came from. In CI the three copies are identical after a checkout, so it finds
nothing there; the false clean happened locally, which is where a gate is read most often and
trusted most casually. Three probes in `--self-test` are the real countermeasure: a real name in
the worked example in `gen_forbidden_hashes.sh`, scanned as that path with that file's
declarations active, so "it is one of the gate's own files" can never become the excuse it nearly
was; a real name in `check_repo.sh` itself; and a name staged for commit and absent from the
disk, in a throwaway repository built by the test, asserting both that the disk scan finds
nothing and that the snapshot scan finds it, so a half that starts passing on its own says so
rather than quietly testing nothing. All names in all three are invented.

**The rule this leaves behind.** *A gate is not accepted until it has been demonstrated failing
on the real defect it was written for.* Not on a synthetic payload resembling it: on the actual
bytes, restored into a scratch copy, exiting non-zero and naming what it found. Passing is what a
gate does when it is broken, when it is misaimed, and when the tree is clean, and those look
identical from outside.

*Prevention kind:* `gate`
*Named by:* `scripts/check_repo.sh`, `scripts/forbidden_lib.sh`

**Open, and stated rather than closed quietly.** The surname is still in nine ancestor commits of
`main`, in `scripts/gen_forbidden_hashes.sh`, and an earlier one is in the first commit in
`build/safety_grep.py`. `HEAD`, the index and the working tree are clean and the gate now covers
all three. History is not rewritten here, and two of the three reasons for that stand: several
agents were pushing to it while this was written, and a force push to clean history is a decision
with a blast radius that belongs to a person and not to a gate run. The third does not. This
paragraph said the repository is private, and issue 164 asked the API and got `public`, so the
decision to leave the history alone was taken partly on a premise that was false. It is the
owner's decision to revisit and it is not revisited here. The gate can honestly say that nothing
new can be committed carrying a name; it cannot say that nothing old does, and the audience for
what is old is now everybody.

---

## A file split agreed in prose did not hold, and a commit carried a third party's work

`2026-08-09-file-split-not-enforced` &middot; 2026-08-09

**What happened.** Two agents worked the repository at once under a split stated in prose: one
owned `site/`, the other owned `scripts/` and the root documents. The second edited `site/app.js`
and `site/index.html` anyway, so commit `2093f4e` carries in-flight ghost node work belonging to
the first agent, staged by an agent that did not write it and could not fully verify it. It is
inert against the committed `graph.js` and produces no console error, but the commit is not what
its message says it is. The committing agent noticed and said so in the open rather than letting
the commit stand as described, which is why the cost stayed at a mislabelled commit and is the
behaviour to repeat.

**Root cause.** A file split stated in prose is enforced by nothing. It is a shared intention
between two processes that cannot see each other, which is a race, and the mechanism that turned
the race into a mislabelled commit was `git add -A`, or any commit of the whole working tree: it
stages whatever happens to be dirty, and the message describes only what its author did.

**The prevention now in place.** *Stage the explicit paths you wrote. Never commit the working
tree.* `git add path/one path/two` and then `git commit`, not `git commit -a` and not
`git add -A`. It costs one extra thought per commit and makes a stray file impossible rather than
unlikely. Where the split matters and the cost is justified, the stronger form is a separate
worktree per agent, which makes the collision impossible instead of merely visible.

*Prevention kind:* `discipline`
*Named by:* none. This one is a habit, recorded here precisely because nothing enforces it.

---

## A token form's default silently removed the one permission the token needed

`2026-08-10-token-form-default-hid-the-permission` &middot; 2026-08-10

**What happened.** A fine-grained personal access token was made for the connect affordance in
the feedback popover, following the note under the field, which asks for a token scoped to
`Issues: Read and write` on this repository and nothing else. Filing failed with a 404. GitHub's
fine-grained token form preselects `Repository access: Public repositories (read-only)`, and
while that radio is selected the form does not offer the Issues permission at all, so a reader
who fills in the permissions section without changing the access section above it cannot produce
the token the note asks for, and the form does not say so. Detected by exercising the connected
path for real against the deployed site, which also closed a caveat this repository had been
carrying: until then the success path had only ever been driven against a stubbed `fetch`. A
headless driver stored a token under `zmt.gh.token`, turned capture mode on, clicked a node,
typed a note and filed it, and the issue was created on the real repository with the title, body,
context block and labels the code builds, then deleted.

**Root cause.** The note described the end state it wanted and not the order the form imposes to
reach it. Between the two sits a default that removes an option rather than presetting one, which
is the kind a reader cannot see: an unchosen radio at the top of a form does not look like the
reason a permission is missing from the middle of it. `explainStatus` already named the three
things to check on a 404, but that text arrives after the token has been made, and a correction
that arrives after the mistake is not mistake-proofing.

**The prevention now in place.** The connect note names the trap in the order it is met: set
`Repository access` to `Only select repositories` first, because GitHub preselects
`Public repositories (read-only)` and will not offer the Issues permission while it stands. Three
lines of text against a failure that costs an hour, and the cheap end of poka-yoke. The 404
explanation stays where it is, for the tokens made before anyone read the note.

*Prevention kind:* `poka-yoke`
*Named by:* `site/feedback.js ghSectionHtml`

**Note.** Where a procedure runs through somebody else's interface, the order that interface
imposes is part of the procedure, and leaving it out is leaving out the part that fails. A true
description of a destination says nothing about a road that is closed.

---

## A backstop read a citation as a claim of work and put four free cards in progress

`2026-08-10-citation-read-as-a-claim` &middot; 2026-08-10

**What happened.** `.github/workflows/issue-status.yml` carried a second job that scanned every
pushed commit message for `#<number>` and marked each open issue it found `status:in-progress`. It
was there as a backstop for work that starts without an assignment. A documentation push whose
commits cited issue numbers in prose put #4, #5 and #39 in progress with no assignee and nobody
working on them, and #4 and #5 are standing constraints that will never be in progress at all. A
fourth card, #48, had been moved the same way an hour earlier by a commit whose subject said
`Issue 49.` and whose body cited #48 twice in passing, so the card that moved was not the card
being worked. Repaired by hand, which is itself a small cost: each repair is two label events, and
every label event redraws and republishes the board.

**Root cause.** The job inferred an intention from prose. A `#N` in a commit message is
overwhelmingly a citation, and a commit message is mostly prose, so the signal it read is not the
signal it wanted. The record says so plainly and was read rather than assumed: over the thirteen
pushes the job ever saw it wrote four labels, all four wrong, and marked nothing that assignment
had not already marked. The tell was there before the incident. Authors had started writing
`Issue 45.` without a hash to keep out of its way, which is a workaround being carried by people
in place of a mechanism that works.

**The prevention now in place.** The job and the `push` trigger are deleted. Assignment is the
only signal that moves a card, and a bare `#N` is inert; GitHub still records the cross-reference
on the issue's timeline, which is the citation doing what a citation should. The narrowing that
was considered instead, an explicit `Starts #N` trailer, was rejected on what the backstop was
for: it existed for the day somebody starts work without thinking about the board, and a trailer
only fires for somebody who did think about the board, who can assign the issue in one click. That
would not be a backstop but a second way to say the same thing, and a second place for one fact to
be wrong.

*Prevention kind:* `structural`
*Named by:* `.github/workflows/issue-status.yml`

**Note, and it is the general form.** The two error directions are not worth the same. A missed
in-progress is visible to whoever tries to pick the card up and costs them a question. A false
in-progress makes a free card look claimed, and a board whose free cards look claimed has stopped
doing the one thing it is for. A guard is worth keeping only where the error it prevents is worse
than the error it makes, and this one had the comparison backwards.

---

## A commit message explaining the CI skip marker was obeyed as one

`2026-08-10-quoting-the-skip-marker-skipped-ci` &middot; 2026-08-10

**What happened.** The commit that moved the Pages deploy out of `board.yml` explains, in its
body, that the board bot's own commit still carries `[skip ci]` and that this is one of the two
loop guards. GitHub reads the whole of the head commit's message for that marker, not the subject
line, so the push was skipped entirely: no repository gate, no deploy, no run of any kind on a
commit that changed three workflow files. Found by looking for the runs the push should have
produced and finding zero, which is two minutes of thinking the change itself had broken
something. Not an exposure: both gates had been run against a clean worktree of exactly that
commit before it was pushed, and both were clean. What it cost was the verification, which had to
be driven by hand afterwards through a dispatch and through a real card closing.

**Root cause.** The same shape as `2026-08-10-citation-read-as-a-claim`, one layer out. A
mechanism read prose as an instruction: there `#48` in a sentence about issue 48 was read as a
claim to be working on it, here `[skip ci]` in a sentence about the marker was read as the
marker. Neither mechanism has any way to tell a use from a mention, and a commit message is the
place where a repository writes about its own machinery, so the two collide exactly where the
documentation is best.

**The prevention now in place.** None in code, and the hole is structural rather than an
oversight: a marker whose effect is that nothing runs cannot be caught by anything that runs. A
server-side check would have to be the thing the marker switched off. The operating rule is
therefore a discipline, and a narrow one: **in a commit message, name the marker and never spell
it.** Write "the CI skip marker" or "the marker on the board bot's commit". Spelling it out is
safe in a tracked file, which is where both workflows explain it at length and where nothing reads
it, and is safe on an issue; it is unsafe in exactly one place.

*Prevention kind:* `none`
*Named by:* `nothing yet`

**Note.** The tell was available and was not read. A push that produces no run at all looks
nothing like a push that produced a failing one, and the first guess was that the change had
broken the workflows, which is the more interesting explanation and was the wrong one. Where a
mechanism has an off switch, "it did not run" deserves to be checked before "it ran and went
wrong".

---

## Thirty four invented names, thirteen of them real, and the fix wrote a fourteenth

`2026-08-10-invented-names-are-not-thereby-safe-names` &middot; 2026-08-10

**What happened.** Issue 51 asked for a cohort of thirty four students on the page, every value
invented. Thirty four Spanish names were written by hand and `scripts/check_repo.sh` came back
with twenty nine findings across `build/model.py`, `site/graph.js` and `build/label_widths.json`:
thirteen of the invented given names hashed into the register of real names the gate holds. A
register of teachers is full of ordinary Spanish first names, and an invented one of those is
spelled exactly like a real one. A university did it as well, because a Spanish institution can
be named after a person and one of them was. Nothing had been committed, HEAD was clean and the
deployed bytes were clean; the whole of it was in the working tree.

**And then the repair repeated the original.** The comment written to explain the collision used
a real given name as its worked example, in the file the collision was being removed from. That
is `2026-08-09-gate-scoped-to-the-public-surface` exactly: a real name inside the work of keeping
real names out. The gate found it on the next run, in a comment, which is a place no rule about
data values would have looked.

**Root cause.** "It is invented" was treated as a property of the value when it is a property of
its provenance. An invented name and a real name are the same string, and the only thing that can
tell them apart is a list of the real ones, which is what the gate holds and what nobody had
consulted before writing thirty four of them. The second half has the same shape one level in:
prose about names is made of names.

**The prevention now in place.** `build/model.py` folds and salted-hashes every string this model
ships, the roster first and then labels, property keys and values, notes, marks, the tail and the
verbs, and refuses to build on a hit. The parameters are read out of `scripts/forbidden_lib.sh`
rather than copied, so there is still one salt and one stop list; the folding is a Python copy,
which `build/safety_grep.py` already records as a thing that can drift, and it was checked token
for token against the shell pipeline's own output rather than assumed. It reports the row and the
token length and withholds the token. It fires in one second, locally, where the two existing
gates fire on a push and after a deploy.

The first version of that check looked at the names only, and the university went straight
through it. That is why it now looks at everything: a check scoped to where the last defect was
found is scoped to the wrong thing.

*Prevention kind:* `gate`
*Named by:* `build/model.py _check_names`, `scripts/forbidden_lib.sh`

**Note.** The names that replaced them were not chosen more carefully. They were generated as
candidates and put through the gate's own folding and hashing before being used, which is the
only method that ends with a number rather than with a feeling.
