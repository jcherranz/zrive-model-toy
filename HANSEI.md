# HANSEI

Reflection on the failures this work has actually had, and the prevention now in place for
each.

Maintained by hand. There is no generator, so this file and the code can drift, and the only
thing stopping them is somebody reading both. Say so rather than imply a machine is watching.

## Why this file exists

A commit message says what changed. It does not say what the failure cost, how it was caught,
or what would have to be undone for it to happen again. Those are the questions asked six
months later by the person deciding whether a defensive-looking check can be deleted, and a
repository that cannot answer them loses its defences one reasonable-looking cleanup at a
time.

Where a prevention does not exist, the entry says so. `none` is a legal value and an honest
one. A claimed prevention that is not in the code is worse than an admitted hole, because it
tells the next reader the hole is covered.

Dates carry a day only where the day is established from a file or a commit. The rest are
recorded to the month rather than guessed.

Entries are appended and never reordered, so the table is not sorted by date after the first
few. Code comments cite them by position, as "HANSEI.md, first entry", and a reorder would
quietly repoint every one of those.

## The incidents

| date | incident | prevention |
|---|---|---|
| 2026-08-09 | A private repository published a public site carrying real commercial data | structural: only invented values ship, plus `scripts/check_forbidden.sh` against deployed bytes |
| 2026-08-09 | A screenshot reported a working page as broken | tool: `~/bin/shot` sets `--virtual-time-budget` |
| 2026-08 | A workflow ran on an empty input and reported success | assertion: `scan_dir` and `fetchIssues` assert their inputs and throw |
| 2026-08 | A review published three counts as "did not reproduce" that its own parser had invented | none |
| 2026-08 | A field rename reached 93 notes and not the 12 that shared the schema | none |
| 2026-08-09 | A real surname sat in the script written to keep real names out | gate: `scripts/check_repo.sh` scans every tracked file, on push and on pull request |
| 2026-08-09 | The gate built to catch that surname reported the tree clean while it was still in the repository | gate: `scan_snapshots` reads the index and HEAD, not only the disk; probes in `--self-test` |
| 2026-08-09 | A file split agreed in prose did not hold, and a commit carried a third party's work | discipline: stage explicit paths, never the working tree |
| 2026-08-10 | A token form's default silently removed the one permission the token needed | poka-yoke: the connect note names the field order, `site/feedback.js` |

---

## A private repository published a public site carrying real commercial data

`2026-08-09-private-repo-public-pages` &middot; 2026-08-09

**What happened.** GitHub Pages serves publicly even when the repository behind it is private.
A build agent was pointed at a private analysis repository, Pages was enabled, and the site
went live. The deployed payload was 371KB holding roughly 1.538 items flagged `measured`, 105
euro-formatted figures including turnover over 1,1 million, and a counterparty's surname 22
times, on a live transaction with a 30 August long-stop.

**How it was detected.** By an adversarial review, not by the author, and not by anything in
the build. Every step of the publish had reported success, because every step had done exactly
what it was asked to do.

**What it cost.** Commercial and personal data readable by anyone with the URL, on a live
transaction, for as long as it stood. The remedy was to delete the Pages configuration, stop
the build agent, delete the repository and take a local backup. **The CDN kept serving for
about five minutes after the origin was gone**, which is the part worth carrying forward:
deleting the source is not the same as the content being unreachable, and there is no lever
that makes it instant.

**Root cause.** The checks that ran were the checks that had been thought of. Licences and
trademarks were checked before publishing. **Whether the site would be publicly readable was
never asked.** The repository's own privacy setting made the question feel answered, and it
answers a different question: it governs who can read the source, not who can read what the
source deploys. A false sense of an answer is worse than an open question, because nobody goes
looking.

**The prevention now in place.** Two things, in order of importance. First and structurally:
this toy ships only invented values. Every property on the page is flagged `dummy` or
`estimated`, and there is nothing on it whose disclosure would matter. Second:
`scripts/check_forbidden.sh` runs after every deploy, in both workflows, and fetches the
deployed files from the public origin rather than reading the working tree, then fails the job
on a real name from the teaching register, a euro-formatted figure that is not one of the two
invented ones, a corpus link, a UUID, an email address, or any of the words that would name
the vendor architecture. The register itself is never committed; the gate holds salted hashes
and folds the deployed bytes the same way to compare.

*Prevention kind:* `structural` and `gate`
*Named by:* `scripts/check_forbidden.sh`, `scripts/forbidden_lib.sh`,
`scripts/forbidden_names.sha256`, `build/model.py`

**Note.** This repository is also private, and its site is also public. That is now the
arrangement on purpose and it is stated in TPS.md and README.md, because the failure was never
the configuration; it was the configuration being a surprise.

---

## A screenshot reported a working page as broken

`2026-08-09-screenshot-before-javascript` &middot; 2026-08-09

**What happened.** Chrome's headless `--screenshot` captures when the document is ready, and a
page that draws itself in JavaScript is not finished being ready. A verification screenshot of
the diagram came back blank, the page was reported broken, and the page was working. The same
mechanism runs in the other direction and did: a genuinely blank page has also been shipped on
the strength of a screenshot taken at the same wrong moment.

**How it was detected.** By opening the page. Nothing in the screenshot itself distinguishes
"the page is empty" from "the page had not drawn yet", which is precisely why the tool was
believed.

**What it cost.** A diagnosis pointed at the wrong layer, and, on the other side of the same
defect, a broken page reported as shipped. Both cost the same thing: a decision taken on
evidence that had never been about the question.

**Root cause.** A tool's readiness condition was taken as the artefact's readiness condition.
The document being parsed is a fact about the browser; the diagram being drawn is a fact about
the page, and the screenshot tool had no way to know which one anyone cared about.

**The prevention now in place.** `~/bin/shot` passes `--virtual-time-budget`, which advances
the page's own clock until its scheduled work has run before the frame is captured, and it
refuses to report success when no image was written. The acceptance rule in KAIZEN.md is built
on it: a change is not reported until a screenshot has been looked at, by a human or by an
agent that can see.

*Prevention kind:* `tool`
*Named by:* `~/bin/shot`, KAIZEN.md acceptance rule

**Note.** The rule that generalises is not about screenshots. A name, a green tick, a file's
existence and a description of a thing are all evidence about the thing, and none of them is
the thing. Every other entry in this file is a version of the same sentence.

---

## A workflow ran on an empty input and reported success

`2026-08-empty-input-reported-success` &middot; 2026-08

**What happened.** A JSON-encoded string was passed where an array was expected. A defensive
fallback caught the type mismatch and substituted an empty list, the loop over that list ran
zero times, and the run reported completion. Twenty agents that were supposed to run never
ran.

**How it was detected.** By noticing that nothing had been produced. Not by the workflow, which
had no opinion about the difference between finishing a hundred items and finishing none.

**What it cost.** A whole run's worth of work not done, and, worse, a green result standing
where a red one belonged. Time spent afterwards on the assumption that the run had happened.

**Root cause.** A defensive fallback in the wrong place. Coercing a bad input into a valid
empty one converts a loud type error into a silent no-op, and a no-op is indistinguishable
from success in every channel the run reports through. The fallback was written to make the
code robust and it made the code unable to fail.

**The prevention now in place.** In this repository, the two places that consume a list assert
it and throw. `scripts/sync_board.mjs` refuses a `gh issue list` result that is not an array
rather than defaulting to `[]`. `scripts/check_forbidden.sh` asserts a non-zero file count, a
non-zero total byte count and a non-empty hash list before it scans anything, and exits 2 if
any of the three fails, so the gate cannot report clean on nothing. The self-test includes an
empty directory as a case that must abort.

*Prevention kind:* `assertion`
*Named by:* `scripts/sync_board.mjs fetchIssues`, `scripts/check_forbidden.sh scan_dir`

**Note.** The rule: assert the input and throw, never fall back silently. A fallback is only
honest where the empty case is a real answer to a real question. "Zero issues" is; "zero files
to scan" is not, because nobody ever wanted to scan nothing.

---

## A review published three counts as "did not reproduce" that its own parser had invented

`2026-08-verifier-artefact-counts` &middot; 2026-08

**What happened.** A review checked three counts claimed in a model document, could not
reproduce any of them, and published all three as discrepancies. The counts were correct. The
review's reader took a YAML field as a scalar; on eight notes that field is a list. Every note
where it was a list was read as one value or as none, and the three totals came out short by
exactly the amount that misreading accounts for.

**How it was detected.** By re-reading the notes, after the discrepancy looked too tidy: three
independent counts do not usually disagree in the same direction by a related amount.

**What it cost.** Three false findings published with the authority of a verification, and the
effort of chasing them. A false negative from a checker costs attention; a false positive
published as a finding costs trust in every true finding beside it.

**Root cause.** The verifier was exempted from the scrutiny it was applying. A schema was
assumed rather than read, and the assumption was invisible because the parser produced
well-formed output on every note, including the eight it was wrong about.

**The prevention now in place.** None in code. The operating rule is that a finding is not
published until the tool that produced it has been checked against a case where the answer is
known independently, and that a discrepancy pattern which is suspiciously consistent is first
treated as evidence about the parser. Written down here and nowhere else, which is a weaker
prevention than a test and is recorded as such.

*Prevention kind:* `none`
*Named by:* `nothing yet`

**Note.** The general form is that a check has a schema assumption in it too, and nothing
checks that one. This repository's own version of the exposure is the safety gate: it has a
folding rule, a token rule and a stop list, and if any of those were wrong it would report
clean on content it should have caught. `--self-test` is the partial answer and it is partial
on purpose. It proves the rules fire on payloads chosen by the same person who wrote them.

---

## A field rename reached 93 notes and not the 12 that shared the schema

`2026-08-rename-by-folder-not-by-schema` &middot; 2026-08

**What happened.** A field was renamed across a corpus of notes. The rename was applied by
walking a folder, and 93 notes were updated. Twelve notes carrying the same schema sat outside
that folder and were not touched, so one thing ended up with two names, and every query written
against either name returned an answer that looked complete.

**How it was detected.** By a query that returned fewer rows than expected, later. Nothing
reported a partial rename at the time: 93 files changed is exactly what a successful run looks
like.

**What it cost.** A corpus that disagreed with itself, and a period during which any count over
that field was silently short. The repair is cheap; finding out that a repair was needed is
not.

**Root cause.** The rename's scope was a location, and the thing being renamed is a property of
a schema. Those two coincide until the day they do not, and on the day they do not nothing
announces it, because a folder walk cannot notice files it was never pointed at.

**The prevention now in place.** None in code. The operating rule is to rename by schema:
select the set by the field's own presence across the whole corpus, not by where the files
live, and report the count of notes carrying the field before and after so a partial pass is
visible as a number rather than as a later surprise.

*Prevention kind:* `none`
*Named by:* `nothing yet`

**Note.** Same shape as the empty-input entry, one level out. There, a wrong input produced a
result of the right shape; here, a wrong scope did. In both, the number the run reported was
plausible, which is the property that made it undetectable.

---

## A real surname sat in the script written to keep real names out

`2026-08-09-gate-scoped-to-the-public-surface` &middot; 2026-08-09

**What happened.** `scripts/gen_forbidden_hashes.sh` is the script that reads the faculty
register and reduces it to salted hashes, so that this repository can look for real names
without holding any. Its header explains how a register filename is parsed into a person, and
it explained it with a real example: a real surname, in plaintext, in a comment. The surname is
the seller's, and it is the same name that appears in the first entry of this file. It went in
on the day the whole safety discipline was written, inside the one file whose sole purpose is
keeping that class of string out of this repository.

**How it was detected.** By an independent scan of tracked files, run by somebody who was not
the author. Not by `scripts/check_forbidden.sh`, which ran green throughout and was right to.
That gate fetches deployed bytes; Pages publishes `site/` and nothing else; `scripts/` returns
404 on the live origin. The gate was not asleep. It was pointed elsewhere, and no number of
runs would have moved it.

**What it cost.** Not an exposure, and it should not be written up as one. The repository is
private, the file was never served, and that was checked against the origin rather than
assumed. The cost is the thing worth recording: a day in which the repository's own safety
machinery was the only tracked file in it carrying a real name, and nothing in the project
could have said so. A near miss whose distance from a miss was a deployment boundary that
nobody had drawn for this purpose.

**Root cause.** The gate's scope was the public surface. The rule it enforces is a property of
the repository. Those are not the same set and never were: `site/` is a fraction of what is
tracked. The reasoning that put the gate on deployed bytes was correct and still is, and it
answered "is what the public reads clean" so convincingly that nobody asked the other question.
Same shape as this file's first entry, one level in. A question that feels answered is worse
than one that is open, because nobody goes looking.

**The prevention now in place.** `scripts/check_repo.sh` scans every file `git ls-files`
reports, against the same salted hash list, and fails the build. It runs on every push and
every pull request through `.github/workflows/repo-gate.yml`, and in `board.yml` before the
board commit, which is the one path that reaches `main` carrying `[skip ci]`. The five rules
are now one copy in `scripts/forbidden_lib.sh`, shared by both gates, so neither can drift out
of agreement with the other. Where the origin gate prints a name it finds, because that name is
already public, this one prints the file and the line numbers and withholds the token: a CI log
is not where a still-private name should first appear. Fed the defect above, it names the file
and the line and stays silent about the word.

*Prevention kind:* `gate`
*Named by:* `scripts/check_repo.sh`, `scripts/forbidden_lib.sh`,
`.github/workflows/repo-gate.yml`, `.github/workflows/board.yml`

**Note, and it is the uncomfortable part.** The author of `gen_forbidden_hashes.sh` had, in
that same session, found and removed a different real surname from `build/safety_grep.py`, and
wrote the removal up in CHANGELOG.md under Removed. The failure was therefore not ignorance of
the rule and not absence of attention to it. The rule was being actively applied, in the same
hour, to a neighbouring file. Attention was on the file being edited and not on the file being
written. That is the ordinary way this goes wrong, which is exactly why the answer has to be a
gate and not a resolution to be more careful.

**Second note.** A gate that scans its own source finds the rules it is made of: the banned
word table, the currency mark inside the money pattern, the synthetic address in a self-test.
The answer here is a table of declared self-matches, each an exact triple of rule, path and
matched string, rather than a list of files the gate skips. Skipping a file is how the next one
of these hides, and the file it would have hidden in this time is the gate itself. Two
conditions keep the table from becoming a blanket by other means: an entry that stops matching
fails the run, and the real-name rule cannot be declared for any path at all.

---

## The gate reported the tree clean while the name was still in the repository

`2026-08-09-gate-read-the-disk-not-the-repository` &middot; 2026-08-09

**What happened.** Two things, and the second is the serious one.

First, the fix recorded in the entry above was reported complete and was not made. The surname
was removed from the working copy of `scripts/gen_forbidden_hashes.sh` and never committed. The
report said the file was fixed; `git log` showed no commit touching it since the day it was
installed. For that period the repository, which is what a clone gets, still carried the name.

Second, and this is the part that matters: `scripts/check_repo.sh`, the gate written for
exactly this defect, was run against that repository and printed `VERDICT: clean` and exited 0.
Not a gap. A false assurance, which is worse, because a gap leaves the risk visible and an
assurance closes the question. The project spent that period believing something it had
checked.

**Root cause, and it is not the name rule.** `git ls-files` names paths. Everything the gate
then read, it read off the disk. That is one of three copies of a tracked file, and it is the
only one that is not the repository: the index is what the next commit will carry, HEAD is what
the repository already carries, and the working tree is neither. They differ exactly when
somebody edits without committing, which was the state the whole time.

So the gate's answer was true and the question was wrong. It said "the files on this disk are
clean" and was read as saying "this repository is clean", and on that day those had opposite
answers. Every other candidate was tested and cleared: the surname's token is in the hash list
and always was, the salt and truncation are one shared copy so the generator and the checker
cannot disagree, `.sh` files are scanned like any other, the token survives folding intact, and
the generator does not exclude the file it lives in. Restoring the original line to the disk
makes the gate fire on the first run, which is how each of those was eliminated rather than
argued away.

**How it was found.** By an independent watchdog scan, run by somebody who was not the author
and was not the gate. That is the second time on this project that an adversarial check found
what the author's own verification missed; the entry above is the first. Two for two is not a
run of bad luck, it is the base rate, and it is the argument for keeping an adversarial pass in
the loop rather than trusting a report that says a thing was done.

**The prevention now in place.** `scan_snapshots` in `scripts/check_repo.sh`. For every tracked
path whose index copy differs from the disk, the index copy is scanned too, and likewise HEAD's,
and a finding says which snapshot it came from. In CI the three copies are identical after a
checkout, so the loop finds nothing there; the false clean happened locally, which is where the
gate is read most often and trusted most casually.

Three probes hold it, and they are the countermeasure rather than this paragraph:

- a real name in the worked example in `gen_forbidden_hashes.sh`, scanned as that path with
  that file's declarations active, so "it is one of the gate's own files" can never become the
  excuse it nearly was;
- a real name in `check_repo.sh` itself, same reasoning;
- a name staged for commit and absent from the disk, in a throwaway repository built by the
  test, which asserts both halves: that the disk scan finds nothing, and that the snapshot scan
  finds it. If the first half ever starts passing on its own, the probe says so instead of
  quietly testing nothing.

All names in all three are invented and always will be.

**The rule this leaves behind.** *A gate is not accepted until it has been demonstrated failing
on the real defect it was written for.* Not on a synthetic payload resembling it. On the actual
bytes, restored into a scratch copy, exiting non-zero and naming what it found. A gate that has
only ever been observed passing has not been observed at all: passing is what a gate does when
it is broken, when it is misaimed, and when the tree is clean, and those look identical from
outside. This one now has that demonstration on the record, and the probes above are it,
repeated on every run.

*Prevention kind:* `gate`
*Named by:* `scripts/check_repo.sh`, `scripts/forbidden_lib.sh`

**Open, and stated rather than closed quietly.** The surname is still in nine ancestor commits
of `main`, in `scripts/gen_forbidden_hashes.sh`, and an earlier one is in the first commit in
`build/safety_grep.py`. `HEAD`, the index and the working tree are clean, and the gate now
covers all three. History is not rewritten here: the repository is private, several agents were
pushing to it while this was written, and a force push to clean history is a decision with a
blast radius that belongs to a person, not to a gate run. What the gate can honestly say today
is that nothing new can be committed carrying a name. What it cannot say is that nothing old
does.

---

## A file split agreed in prose did not hold, and a commit carried a third party's work

`2026-08-09-file-split-not-enforced` &middot; 2026-08-09

**What happened.** Two agents worked the repository at once under a split stated in prose: one
owned `site/`, the other owned `scripts/` and the root documents. The second edited
`site/app.js` and `site/index.html` anyway. Commit `2093f4e` therefore carries in-flight ghost
node work belonging to the first agent, staged by an agent that did not write it and could not
fully verify it. It is inert against the committed `graph.js` and produces no console error, and
`site/graph.js` was deliberately left uncommitted for its author, but the commit is not what its
message says it is.

**Root cause.** A file split stated in prose is enforced by nothing. It is a shared intention,
and a shared intention between two processes that cannot see each other is a race. The
mechanism that turned the race into a mislabelled commit was `git add -A`, or any commit of the
whole working tree: it stages whatever happens to be dirty, including another agent's
half-finished edit, and the commit message describes only what its author did.

**How it was found.** The committing agent noticed and said so, in the open, rather than
letting the commit stand as described. That is the good outcome and it is why the cost stayed
at a mislabelled commit. Worth recording as the behaviour to repeat: a report that says "this
commit contains something I did not write" is worth more than a clean-looking log.

**The countermeasure.** *Stage the explicit paths you wrote. Never commit the working tree.*
`git add path/one path/two` and then `git commit`, not `git commit -a` and not `git add -A`. It
costs one extra thought per commit and it makes a stray file impossible rather than unlikely.
Where the split matters and the cost is justified, the stronger form is a separate worktree per
agent, which makes the collision impossible instead of merely visible.

*Prevention kind:* `discipline`
*Named by:* none. This one is a habit, and it is recorded here precisely because nothing
enforces it.

---

## A token form's default silently removed the one permission the token needed

`2026-08-10-token-form-default-hid-the-permission` &middot; 2026-08-10

**What happened.** A fine-grained personal access token was created for the connect affordance
in the feedback popover, following the note under the field, which asks for a token scoped to
`Issues: Read and write` on this repository and nothing else. Filing failed with a 404. The
token had been made without the Issues permission, and not by oversight: GitHub's fine-grained
token form preselects `Repository access: Public repositories (read-only)`, and while that
radio is selected the form does not offer the Issues permission at all. A reader who fills in
the permissions section without changing the access section above it cannot produce the token
the note asks for, and the form does not say so.

**How it was detected.** By exercising the connected path for real, against the deployed site,
with a token a person had just made. That run also closes a caveat this repository had been
carrying: until it, the success path had only ever been driven against a stubbed `fetch`, so
the only end to end evidence for filing was the fallback that opens a prefilled issue form. A
headless CDP driver put a token into `localStorage` under `zmt.gh.token`, turned capture mode
on, clicked a node, typed a note and filed it. The issue was created on the real repository
with the title, body, context block and labels the code builds, and was deleted afterwards.
The connected path is now a thing that has been observed working rather than a thing that
type-checks.

**What it cost.** One person's afternoon spent on a token they had made correctly by the
note's description and incorrectly by the form's order, and a 404 that reads like a bug in the
site. Nothing shipped wrong; the failure was in what the reader was told, which is where this
class of defect usually is.

**Root cause.** The note described the end state it wanted and not the order the form imposes
to reach it. Between the two sits a default that removes an option rather than presetting one,
which is the kind a reader cannot see: an unchosen radio at the top of a form does not look
like the reason a permission is missing from the middle of it. `explainStatus` already named
the three things to check on a 404, but that text arrives after the token has been made, and a
correction that arrives after the mistake is not mistake-proofing.

**The prevention now in place.** The connect note names the trap in the order it is met: set
`Repository access` to `Only select repositories` first, because GitHub preselects
`Public repositories (read-only)` and will not offer the Issues permission while it stands. It
is three lines of text against a failure that costs an hour, and it is the cheap end of
poka-yoke: make the wrong path visible at the moment it is taken, rather than diagnosable
afterwards. The 404 explanation stays where it is, for the tokens made before anyone read the
note.

*Prevention kind:* `poka-yoke`
*Named by:* `site/feedback.js ghSectionHtml`

**Note.** The general form is the one this file keeps arriving at from a new direction. The
instruction was true and the reader still could not follow it, because a true description of a
destination says nothing about a road that is closed. Where a procedure runs through somebody
else's interface, the order that interface imposes is part of the procedure, and leaving it out
is leaving out the part that fails.
