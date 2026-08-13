#!/usr/bin/env node
// The regression net. Issue 58.
//
// site/ ships 2685 lines of JavaScript and this repository had no functional test of any kind.
// Written without a thousands separator on purpose: the safety gates read a dot-grouped figure as
// money, and this file is scanned by them.
// Both existing gates are SAFETY gates: check_repo.sh asserts nothing forbidden is committed,
// check_forbidden.sh asserts nothing forbidden is published. Neither has ever had an opinion
// about whether the page works. Roughly ten substantive changes landed on 2026-08-10 and 11,
// every one of them verified by driving a headless browser by hand, and every one of those
// verifications is gone. What is left is prose in closed issues, which is not a place a
// regression can be caught. This file is those verifications, kept.
//
// WHY PLAIN NODE AND NO FRAMEWORK. The site has no build step, no framework, no CDN and no
// dependency, and a test suite that arrived with a package.json, a lockfile and a browser
// automation library would be a larger thing than the artefact it tests. Node 22 ships a global
// WebSocket, so the Chrome DevTools Protocol is reachable with no dependency at all, which is
// how every driver written against this page during that work already reached it.
//
// ---------------------------------------------------------------------------------------------
// WHAT IT ASSERTS AND WHERE EACH INVARIANT CAME FROM
//
//   model/reveal      #48 hid the employers until their instructor is clicked; #49 gave the
//                     other four instructors real Company nodes and `employed by` edges. The
//                     rule keys on the verb and never on the type, because a sixth Company,
//                     `co_col`, employs nobody and must stay on the page: app.js's VEIL_RULES
//                     comment says a rule reading `type === 'Company'` would delete exactly the
//                     distinction the toy exists to show.
//   students          #51 asked for the alumnos card to disaggregate. The build draws four of
//                     thirty four and the card carries a line saying how many it did not draw;
//                     #/students is the whole roster as a route of its own.
//   canvas            #46 made the diagram an infinite canvas. The anchored zoom and the click
//                     versus drag thresholds are in app.js's canvas section, which records that
//                     view.k and the rendered scale disagreed at the fourth decimal until the
//                     box was measured off its rect rather than off clientWidth.
//   capture           #41 #42 #45 #46 #48 #51 were all filed through the capture popover and
//                     each carries the element descriptor the page produced. #45's is the
//                     baseline below. A pan must file nothing: app.js's window-level capture
//                     listener calls stopImmediatePropagation so a drag cannot reach
//                     feedback.js.
//   board             board.js's own header, which mirrors scripts/sync_board.mjs: four columns,
//                     a closed issue goes to Done, a NOT_PLANNED closure appears in no column,
//                     Done is drawn newest first and capped at 8, and drawn plus hidden equals
//                     every closed issue.
//   every width       1536x839 is the viewport every one of those six issues was filed at, and
//                     is on each of them in the context block. 1440x900 is the size README
//                     claims the whole drawing fits without scrolling. 390x844 is the narrow
//                     end the stylesheet's breakpoint is written for.
//
// ---------------------------------------------------------------------------------------------
// WHAT IT IS ROBUST AGAINST, AND IT IS THE HARNESS RATHER THAN THE PAGE
//
// Three times this repository has had a driver report a defect that was not there.
//
//   1. A screenshot taken before the page had drawn, twice, once reporting a working page broken
//      and once shipping a blank one (HANSEI.md `2026-08-09-screenshot-before-javascript`). So
//      nothing here waits on a tool's idea of ready. app.js publishes window.ZT as its last
//      statement, so ZT existing means app.js ran to completion, and DIAGRAM_READY below polls a
//      condition the page itself answers: ZT published, a node and a relationship painted, and the
//      canvas holding a measured box. Where no page-provided signal exists the wait is on a value
//      settling and the comment says so.
//   2. A click that landed outside the viewport, on a control that was drawn and unreachable
//      (KAIZEN.md `kaizen-a-widened-control-keeps-its-neighbours-reachable`). So every synthetic
//      click here goes through hitTest(), which asks the page what document.elementFromPoint
//      returns at that exact coordinate and fails naming what it found instead. A dispatched
//      click that lands on nothing is otherwise indistinguishable from a click on a control that
//      does nothing.
//   3. A stale browser answering on the debug port. So the profile directory is created fresh
//      per run, the port is 0 and is read back out of that profile's own DevToolsActivePort
//      file, and the file is required to be newer than the launch. A browser we did not start
//      cannot have written it, so there is no port to guess at and nothing to collide with.
//
// And the fourth, which is not a false defect but a false size: headless Chrome runs pages in a
// window no narrower than 500px whatever --window-size says
// (KAIZEN.md `kaizen-a-tool-that-refuses-the-size-you-asked-for`). Every viewport below prints
// what it asked for beside what it got, and by which mechanism.
//
// ---------------------------------------------------------------------------------------------
// IT MUST NEVER FILE A REAL ISSUE. Three layers, because one of them is a stub inside the page
// and a stub is a thing that can be bypassed. window.fetch, XMLHttpRequest, navigator.sendBeacon
// and window.open are replaced before any page script runs and every call is recorded;
// Network.setBlockedURLs refuses github.com and api.github.com at the network layer, below the
// page entirely; and Network.requestWillBeSent is watched, so a request that somehow reached the
// stack is a failure rather than a silence. Nothing here needs a GitHub token and nothing here
// reads one.
//
// DETERMINISTIC. No assertion depends on an issue number, on the clock, or on any network state
// beyond the page under test. The board's arithmetic is proved against a synthetic fixture with
// issue numbers in the 900s that cannot collide with anything real, and the served board.json is
// read from the same origin as the page rather than from the GitHub API.
//
// ---------------------------------------------------------------------------------------------
// A BROWSER THAT NEVER STARTED IS NOT EVIDENCE ABOUT THE PAGE. Issue 67.
//
// In CI one dispatch failed with `no DevToolsActivePort in 20000ms` and dbus errors. A rerun on
// the identical commit gave 70 of 70. Two faults came out of it, and the second was the worse.
//
//   1. The suite printed `VERDICT: the page has regressed` for a browser that never started.
//      smoke.yml's own comment says exactly this must not happen: the reason the suite lives in
//      its own workflow is that a browser failing to start must not turn a gate red for a reason
//      unrelated to what the gate is about. The argument was right and the code did not honour it.
//   2. It cut its own coverage by four fifths and called what was left a pass. The 1536x839 group
//      carries every behavioural assertion; when it fails to launch, the 14 that survive are the
//      narrow-viewport overflow checks. A green 14 of 14 is a pass on a fifth of the suite.
//
// Three answers, in the order a run meets them.
//
//   THE RETRY. LAUNCH_ATTEMPTS below, one retry, which is what the evidence supports and no more:
//   the rerun succeeded on its first attempt, so the flake is transient rather than a broken
//   image. Each attempt gets a fresh profile directory and the failed process is killed and its
//   directory removed before the next one, so a retry cannot inherit anything from the attempt
//   that failed. Every attempt prints why it failed, so a retry that keeps saving a run is
//   visible in the log rather than silent.
//
//   THE VERDICT, WHICH NOW HAS THREE VALUES AND NOT TWO. A failed assertion is evidence about the
//   page and exits 1 under `VERDICT: the page has regressed`. A browser that never started, or a
//   suite that ran fewer assertions than it intended, is not evidence about the page at all: it
//   exits 2 under `VERDICT: the suite could not answer`. Two is the code this repository already
//   uses for a gate saying "I do not know" rather than "the answer is clean", which is how
//   check_repo.sh's contrast schema aborts and what scripts/verify.sh prints as [SKIP] rather
//   than [OK]. Evidence beats silence: a run that both found a real failure and lost a viewport
//   reports the regression and exits 1, with the harness failure printed beside it.
//
//   THE COUNT, AND IT IS THE CONTRAST GATE'S TERMINATOR IN ANOTHER LANGUAGE. build/model.py emits
//   a `#rows|N` line carrying the count it meant to write and check_repo.sh refuses a table that
//   does not match it, because a truncated table judges every row it holds, hits every
//   declaration, and comes out clean on a fraction of the palette. A suite that loses a viewport
//   is that same shape. So PHASES below writes down how many assertions each phase intends and
//   EXPECTED_ASSERTIONS the total, both by hand: a count taken from the run cannot notice a group
//   that did not run. Running fewer is a failure however many passed.
//
// ---------------------------------------------------------------------------------------------
// ONE SUITE, ONE HARNESS, ONE TERMINATOR. Issue 109, and it folds issue 89's grain suite in here.
//
// build/check_grain.mjs held 33 assertions about the two altitudes of the drawing and a second
// copy of everything below: a static server, a Chrome resolver, a CDP client, a launcher, a phase
// table and a hand-written total. It was written there because this file was held by another agent
// for the length of that card, which its own header said. Issue 107 wired it into scripts/
// verify.sh and .github/workflows/smoke.yml and argued, correctly, that nothing was duplicated at
// the level of CLAIMS: not one of the 33 restated an assertion here, so it was not the
// two-copies-of-one-rule shape issue 106 is about. That argument is why the merge was not urgent.
// It is not an argument that two files was the right end state, and three things say it was not.
//
//   1. AN INTENDED-TOTAL TERMINATOR PROTECTS ONLY THE FILE IT TERMINATES. EXPECTED_ASSERTIONS
//      catches a phase of this suite that stopped running. Nothing catches a whole suite that
//      stopped being run, and that is not hypothetical: the 33 were tracked, executable and green
//      and no step of verify.sh and no workflow invoked them, for their entire life until issue
//      107 noticed. Inside this file they are under the same terminator as everything else, and a
//      hand that deletes them has to edit a number in front of a reader.
//   2. THE DUPLICATED HARNESS WAS NOT TWO EQUAL COPIES. The grain copy scraped the debug port out
//      of the browser's stderr instead of reading the profile's own DevToolsActivePort and
//      requiring it to be newer than the launch, so it had no answer to a stale browser on the
//      port; it had no launch retry, so the transient start flake issue 67 is about would fail it
//      where this file recovers; and it watched Runtime.exceptionThrown only, so it saw no console
//      error and no request. The second copy was the weaker one, which is the direction that
//      matters and is the same finding issue 103 made about verify.sh's private copy of the build
//      check. Deleting it gives the 33 all three protections at once.
//   3. TWO PROCESSES CANNOT SHARE A PLAN. The two phase tables could not be summed, so no single
//      number said how many claims about this page exist. There is one now, and it is 177.
//
// WHAT THE MERGE COST, STATED RATHER THAN GLOSSED. The grain phases get a browser of their own
// rather than sharing the behavioural viewport's: this page keeps its state across a hash change,
// which is a behaviour the grain phases already work around among themselves, and inheriting a
// page that capture mode, the theme toggle and the board poll had all been driven through would
// have made the 33 measure something the file they came from never measured. So the fold removes
// the duplicated harness and keeps the fresh browser, which was the only thing about a separate
// process worth keeping.
//
// Usage:
//   node scripts/smoke.mjs                 serve site/ locally and test the working tree
//   node scripts/smoke.mjs <url>           test a deployed origin instead
//   node scripts/smoke.mjs --help
//
// Exit: 0 clean, 1 the page has regressed, 2 the suite could not answer for itself
//
// Env: SMOKE_CHROME / CHROME_PATH / CHROME_BIN  the browser to drive
//      SMOKE_TIMEOUT_MS                          per-wait deadline, default 20000
//      SMOKE_SKIP_PHASE                          a test affordance, and the only way to prove the
//                                                count assertion fires: name a phase in PHASES and
//                                                it is not run. It can never produce a clean
//                                                verdict, because the assertions it skips are
//                                                still the assertions the suite says it intends.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'site');
const TIMEOUT = Number(process.env.SMOKE_TIMEOUT_MS || 20000);

// ---- the viewports ---------------------------------------------------------------------------
// Each is inner width by inner height, which is what the page reports and what every context
// block on the six issues this suite is built from carries. `emulate` is not a preference: it is
// the browser's 500px window floor, named here rather than discovered at run time. Below that
// floor a real window cannot be had, and a pointer gesture driven into an emulated viewport whose
// widget is a different size is measuring the harness, which app.js's wheel comment records at
// length: six wheels out of six were dropped that way. So the narrow viewport runs the
// assertions that are about layout and console output and does not drive a pointer.
const VIEWPORTS = [
  { w: 1536, h: 839, emulate: false, pointer: true },
  { w: 1440, h: 900, emulate: false, pointer: false },
  { w: 390, h: 844, emulate: true, pointer: false }
];
const WINDOW_FLOOR_PX = 500;

// The one console error this page is expected to produce. It ships no favicon, so every browser
// asks for one and every origin answers 404. Allowed by URL and not by message text, so a 404 on
// any other file is still a failure.
const KNOWN_404 = /\/favicon\.ico$/;

// ---- the element descriptor baseline -----------------------------------------------------------
// Recorded, not invented. This is the exact string feedback.js produced on the deployed page when
// the reader clicked the tile of t4 and filed issue 45, and it is quoted from that issue's Element
// field. It is a good baseline for one reason: it exercises the whole of describe(), the ancestor
// walk that stops at the nearest data-node rather than at #graph, the empty text snippet a <rect>
// gives, and the five deep tag path. If any of those changes, every report ever filed against this
// drawing stops being locatable, which is what app.js's viewBox-not-a-wrapper-group comment is
// about: a wrapper element between the node and the svg would silently change all of them.
const DESCRIPTOR_BASELINE = {
  node: 't4',
  text: 'ancestor [data-node="t4"] · div>svg>g>g>rect',
  from: 'issue 45, Element field, filed at 1536x839'
};

// ---- the anchored-zoom tolerance ---------------------------------------------------------------
// Stated and argued rather than tuned. applyView() writes the viewBox as a string with three
// decimal places, so the rendered origin is quantised to a thousandth of a drawing unit and the
// rendered scale to the ratio of two such strings; over the four step gesture below, ending near
// three times the fitted scale, the accumulated residual is bounded well under a twentieth of a
// CSS pixel. Half a pixel is an order of magnitude of headroom over that and two orders below
// both the 34 unit tile and the 5px drag threshold. The failure this is guarding against is not
// subtle: a zoom that anchors on the centre of the box instead of on the pointer moves the point
// under the cursor by hundreds of pixels. The measured error is printed beside the tolerance so
// the margin is visible rather than asserted.
const ZOOM_TOLERANCE_PX = 0.5;

// ---- what the suite intends to assert ----------------------------------------------------------
// Issue 67. Written down by hand, and that is the whole mechanism: a count computed from the run
// agrees with whatever the run happened to do, which is exactly the reading that let a suite
// missing four fifths of itself report a pass. This is build/model.py's `#rows|N` terminator in
// another language, and it fails the same way, at exit 2, saying the run does not know rather
// than saying the page is clean.
//
// `every` phases run at every viewport, because each is a claim about a width or about what the
// browser said while that width was on screen. `behavioural` phases are claims about the model,
// the gestures and the board, which are not claims about a width, so they run once, at the one
// viewport that can drive a pointer. `grain` phases are issue 89's, folded in by issue 109; they
// are claims about the two altitudes of the drawing and they run once, in a browser of their own,
// for the reason runGrain states. Adding an assertion means editing the count beside it and
// the total below, and a change that forgets is a red run rather than a quiet one.
const PHASES = {
  'the viewport opened':  { count: 2, when: 'every' },
  'every width':          { count: 6, when: 'every' },
  'model and reveal':     { count: 14, when: 'behavioural' },
  'cold load':            { count: 4, when: 'behavioural' },
  'students':             { count: 11, when: 'behavioural' },
  'term':                 { count: 56, when: 'behavioural' },
  'the sample':           { count: 6, when: 'behavioural' },
  'the empty window':     { count: 6, when: 'behavioural' },
  'the review':           { count: 7, when: 'behavioural' },
  'the worklist':         { count: 9, when: 'behavioural' },
  'the cut':              { count: 8, when: 'behavioural' },
  'header':               { count: 8, when: 'behavioural' },
  'the readout':          { count: 7, when: 'behavioural' },
  'canvas':               { count: 7, when: 'behavioural' },
  'capture':              { count: 15, when: 'behavioural' },
  'board':                { count: 13, when: 'behavioural' },
  'the gutter on a phone': { count: 2, when: 'narrow' },
  'console and requests': { count: 2, when: 'every' },
  'two artefacts':        { count: 4, when: 'grain' },
  'the count':            { count: 3, when: 'grain' },
  'well formed':          { count: 6, when: 'grain' },
  'the fold':             { count: 3, when: 'grain' },
  'reflow':               { count: 8, when: 'grain' },
  'the address':          { count: 3, when: 'grain' },
  'keeping place':        { count: 3, when: 'grain' },
  'composing':            { count: 4, when: 'grain' },
  'the header':           { count: 3, when: 'grain' }
};

// The headline figure, and it is not derived from PHASES on purpose. Summing the table would agree
// with a table that had lost a row, and a viewport deleted from VIEWPORTS would take its share of
// the expectation with it. This number is checked against the sum before anything runs, so the two
// have to be edited together or the run refuses to draw a verdict.
// 70 until issue 76. That card made the wheel need Ctrl or Cmd and gave the bare wheel a pan, and
// the assertion it added is the one that says a bare wheel no longer zooms, which is the whole of
// what the card decided and the only part of it a later change could silently undo.
// 71 until issues 80 and 82, which added two addresses, #/calendar and #/outline, and the `term`
// phase that drives them. Sixteen, and each one is a claim the two cards decided rather than a
// count of what the code happens to do: that the way in is the node and not the header, that the
// scope is all seven programmes, that the sheet declares the sample it drew instead of reading as
// a whole term, that the gaps are on the page, that the one to one is stated rather than implied,
// and that a table of invented dates says so where a reader cannot miss it.
// 87 until issues 84 and 85, which took the `term` phase from 16 to 26. The ten are the claims
// those two cards decided and not a count of what the code happens to do: that both readings now
// take a programme AND that the unscoped pair survives, because shipping the scope by replacing
// the unscoped reading would satisfy a driver that only looked at the new address; that the
// outline is grouped by the module its syllabus declares; that a syllabus naming no module says
// so where the heading goes rather than leaving a blank; that the two real published values reach
// the panel flagged real and not dummy; that the lane heading is a control at least 24 by 24 at
// the smallest scale, at fit and at the largest, which is the property the caption itself could
// never have had; that both of the two lane headings are controls and not one; that a press and
// drag over one is still a pan; and that the invented agenda is off until it is asked for and
// carries its flag on every line when it is on.
// 97 until issue 86, which took `capture` from 5 to 14. The nine are one claim each and every one
// of them is a hit test or a read of what a report would have said, because the defect that card
// fixed left every queryable property intact: the header's five controls were present, enabled,
// visible and 26 by 26 under a modal backdrop whose top edge was y=0, and a driver could have
// checked all of that and seen nothing wrong. So: that feedback answers elementFromPoint at its
// own centre on every one of the seventeen addresses that opens a sheet, read off the page rather
// than constructed; that no sheet starts above the line the header ends on, which is a separate
// claim from the one before it and was found by trying to prove it: with the header ranked above
// the sheet and the sheet still at `inset: 0`, every hit test here passes and the header simply
// paints over an opaque box; that theme, students and board are reachable too, which is the line issue 57 drew between
// a control about the artefact and a control about a view; that `ghosts` is withdrawn over a sheet
// AND is back on the diagram, asserted in both directions so that deleting it could not pass; that
// everything kept live still clears #77's 24 by 24; that a scoped outline address exists to file
// from; that a capture driven from inside that sheet names a row of it and no backdrop, which is
// the half of this card worth more than the reachable button; that the report names the reading it
// was filed from, which said `diagram` on all five sheet addresses until this card; and that one
// Escape leaves capture mode with the sheet still open and the next one closes it.
// 106 until issues 88 and 90, which took `term` from 26 to 41. The fifteen are the decisions those
// two cards took as one card, and the reason they are one card is that they are one problem: how a
// reader works with a term too large to see at once. Four are the month grid, which is what
// #/calendar now opens on: that it draws a panel per month, that every panel carries the invented
// warning ON ITS OWN FACE so a crop of one month still says so, that every session lands in the
// weekday column its date falls on with the weekend sessions visible there, and that the
// no-instructor gaps are marked in the grid as well as in the list. Two are the week grid, which
// is the weaker of the two shapes and is built to say so: one panel per week that holds anything,
// and a sentence naming the start-time concentration that makes a week here two rows rather than a
// day of stacked hours. Five are the window: that it is off on arrival, that the control says
// where `now` comes from and does not call its anchor today, which is the one thing that would
// have made this feature a lie on a page whose term ended before the real clock reached it, that
// every control both cards added clears 24 by 24, that the LIST filters down to an agenda, and
// that the GRID keeps every session and marks the band instead. One is the outline saying the
// window is off that reading rather than ignoring it. And three are the drawing: that a window
// DIMS it and moves no geometry, digest and extent identical, which is what lets this ship without
// touching the build gate; that the dimming is right in both directions rather than merely
// present; and that the window survives a change of programme, because it belongs to the page.
// 121 until issue 100, which took `term` from 41 to 47 and rewrote the first of those three. He
// overruled #90's design: the window filters the drawing now rather than dimming it, so the
// picture on screen is a run time transform of a generated artefact and check_build.sh cannot see
// it at all. The six are the cover the build gate does not give, and they are the terms of that
// trade rather than a count of what the code does. That the reflow of the FULL node set reproduces
// build_layout.py's own coordinates, every tile and every arc control point, which is what makes
// the filtered drawing the build's geometry with tiles taken out rather than a second opinion
// about where things go, and which goes red the day somebody retunes pack() in the build and not
// in render.js. That no two tiles overlap after the restack, measured on every pair. That no line
// dangles: both ends of every one of them are a tile on the page and every arrowhead lands on one,
// because an arc computed for the full stack and left pointing into the space a filtered tile used
// to occupy is the failure a reader would read as missing data. That what the window took out is
// on the page as a count and the lines to it say how many relationships each stands for, because
// removing a line in silence is how a management tool starts lying. That every lane says how much
// of itself is in the window in #83's idiom, since a filter that loses the number is the same
// failure as an aggregate that loses it. And that the fit frames the filtered drawing rather than
// the one it was cut from, which is the obvious regression of the whole card: Z-BL is 2578px
// unfiltered and a fit that never ran would leave the reader on the same postage stamp.
// 127 AND STILL 127 AFTER ISSUES 91, 92, 93 AND 94, which is worth writing down because it is the
// unusual case: cards that DELETE page elements this suite asserts. Six assertions changed and not
// one was dropped, because a subtraction is a decision and a decision is a thing to assert. Four
// are the old ones turned around: that the month panels and the banner over the grid carry no
// disclaimer, where they were required to carry one; that the list has no banner row, no notice
// and no subtitle chip; that each calendar shape says what it is on its own control rather than in
// a paragraph over the rows, asserted in both directions so that deleting the paragraph and
// putting nothing in its place fails; and the count, which is the whole of 91 and 93, that there
// is exactly ONE statement on the page that the data is invented and it is the footer's. That last
// one reads a COUNT and never the sentence, deliberately: issue 101 is open on whether the claim
// is even true, nearly half of the shipped values being flagged as read off a real system while
// the stance says invented, and a driver pinning the wording would be this card taking his call.
// One was narrowed: the module-heading assertion lost the conjunct requiring the deleted paragraph
// and keeps the finding where the page still makes it, in the headings themselves. And one slot
// was reused for issue 94, the paragraph about one to one giving way to the measurement that a
// module heading is never painted right of the rows it heads. Issue 92 added nothing: its banner
// was deleted by 91 before it could be repaired, and the assertion that it is gone is 91's.
// 128 with issues 96 and 97, and the one it adds is the one the existing lane-heading assertion
// could not make: that the caption is INSIDE the frame drawn around it and evenly placed in it.
// The old assertion measured the target and passed for as long as the defect shipped, which is
// the same shape as every other gate here that measured less than it claimed.
// 139 with issue 98, which opens a `header` phase of eight and takes `every width` from three to
// four. The card put a COUNT in the header, and a count is the easiest thing on this page to ship
// wrong in a way that looks right: a number taken over the wrong set still renders, still updates
// and still reads as an answer. So none of the eight reads the count and asserts the count. The
// denominator and every one of the seven per-drawing numerators are recomputed here, in this file,
// by a second implementation over window.GI, and the control is checked against them; the windowed
// number is recomputed a third way, over render.js's own record of which tiles the window left, so
// a count that agreed with the model but not with the picture fails. The rest are the decisions the
// card took rather than the code it happens to contain: that the list under the control adds up to
// the number on it, which is #83's and #100's failure mode both times; that each reading counts the
// rows IT lists and that the calendar's number is the one the term sheet has carried under another
// name since #80, so the header and the sheet cannot drift apart about the same eleven sessions;
// that the window reaches the calendar and not the outline, on one press, so a window that reached
// everything and one that reached nothing both fail; that the control is withdrawn on the board and
// the student list and says `null` there rather than zero, because "nothing is missing" and "this
// question is not about this view" are different answers; and that it is reachable at its own
// centre and 24 by 24 on every address that opens a sheet, which is #86 and #77 held against the
// newest control in the row. The fourth `every width` assertion is #77's own claim rather than this
// control's: every control in that nav on one height and none under 24 by 24, at all three widths
// including the one where the row wraps, which is where a size regression would hide.
// 139 AND STILL 139 AFTER ISSUES 108 AND 110, which is the second time this file has met a card
// that deletes what it asserts and the reason for writing it down is the same. The owner withdrew
// every reader-facing statement about the standing of the content, so the badge beside every
// property value, the line summing each property list, the note on the face of the outline block
// and the footer's sentence are all gone. Three assertions changed and none was dropped. The count
// of statements on the page is the same measurement with a different expected number, zero rather
// than one, and it stays because an instruction that says absolutely none is an instruction one
// surviving copy defeats. The panel's published-values assertion reads the flag off window.GI now
// instead of off a badge, and gained the demand that no badge is printed. The outline's was
// compound and was split: the clause about the note went with the note, the clause about the flags
// stayed and reads the tokens term.js publishes for the purpose, and a third clause was added
// requiring nothing on the page to print them. What went is three claims about copy. What stayed
// is every claim about the fields, which are the architecture and are untouched in the document.
// 177 with issue 109, and the 33 it adds are not new: they are issue 89's grain suite, which was a
// second file driving a second headless Chrome over a second copy of this file's plumbing. Nothing
// about the page changed and no claim was written or dropped. The arithmetic is the whole of the
// measurement the merge had to land on and it is stated here so a later reader can check it
// against the two suites that were: 144 assertions in this file, 33 in build/check_grain.mjs, 177
// after, and the phase table above carries the nine grain phases at the counts that file declared.
// A merge landing on anything else would have lost a probe.
// 180 with issue 114. One claim, at all three widths, and it is the cause of that card and not its
// symptom: the drawing keeps the frame it was fitted to while #/board has the canvas off screen.
// The symptom was a hit test six figures from the tile, which is a race and would have wanted a
// tolerance or a retry; the cause is a transform written from a box the element did not have, and
// that is either written or it is not.
// 184 with round 6's F19 and F8, and the four they add are coverage that was missing rather than
// behaviour that is new. F19: nothing here ever loaded a document cold at any address but the
// default, so `route()` deleted out of `term.start()` and the construction-time resolution deleted
// out of `router.js` both gave 177 of 177 with every deep link dead. The `cold load` phase is those
// four, and it constructs no address: it drives the page through its own controls, reads what the
// page wrote on location.hash, and reloads that. F8 added nothing to the total and changed two
// assertions in `keeping place`, which read `sel.type` alone and so could not tell the module the
// reader came from from any other module.
// 198 with issue 119, and the six are one state rather than six claims scattered about. Nothing
// here had ever driven a window that covers no session, which the term's April and May gaps make
// reachable on thirteen (programme, one week) pairs inside a programme's own term; the page met it
// by painting six lane plates at height -47 and putting six rendering errors on a console channel
// no assertion had ever aimed at this state. The phase drives it through the page's own controls
// and asserts the absence as set equality, the rects in both directions, the console as a delta
// over that one repaint, the sentence the drawing now prints against the one the list prints in
// the same state, that #111's arithmetic is still the header's, and #114's reading guard on a
// height the fit had never been given before.
// 207 with issue 120, and the nine are one card's decisions rather than nine claims about a
// layout. He asked for a header read as a control dashboard instead of as a web page, after three
// cards that had each answered by adding a control to one row; the answer was to split the row
// into the values the page is reporting and the verbs a reader performs, and to take one control
// off it. Six are the `the readout` phase. Two are the split itself, asserted as placement and as
// paint and kept apart on purpose, because the row already had the two kinds in two places before
// this card and had no way at all of telling them apart by looking: a plate drawn around readings
// still painted in the link colour is the defect the card was filed about with a box around it.
// Three are the one reading it adds, `tiles`, which is not a control and is the number every other
// control in the header moves: that it is the drawing's own count and names a denominator only
// while something is filtering the drawing, that it follows the ghost toggle by exactly the ghost
// tiles window.GI records, which is the half a reading taken off the built artefact would get
// wrong while looking perfectly correct, and that it follows the altitude. One is the theme, which
// left the row's first position for a menu behind a press: three states in the box, the one that
// is on marked, and the mark and the page moving together, which is #57's finding kept rather than
// dropped. The other three are the `every width` phase's, one per viewport: the static reading is
// a span, so the assertion that holds every control in this header on one line at 24 by 24 cannot
// see it at all, and it is asserted against that row's own measured height rather than against 26.
// That older assertion changed its scope in the same edit, from `.hnav` to the header, which is a
// strengthening and not a repair: after the split it was measuring five of the nine controls in
// this header, and it had never covered the programme picker in the heading, one of the eleven
// issue 77 measured.
// 210 with issue 121, and the three are two wrong numbers rather than three new claims. The
// header's readout kept reporting the programme the reader had left, because term.js's show()
// ends in a toggle to a class the body already carries, which writes no attribute and so wakes no
// observer, and its one callback was wired to the header measurement alone; and the sentence under
// the calendar was built from the unwindowed figures with the window bolted on as a trailing
// clause, so an agenda of eleven rows carried the date span, the state tally and the gap counts of
// a six month term. One is in `the readout` and drives the scope bar a reader presses, with both
// counts recomputed off window.GI and a check that they differ, because two equal numbers would
// pass on a control that never restated. Two are in `term` and they are the two directions of one
// rule, that the sentence describes what the sheet DREW: on the filtered list every figure is the
// window's, and on the grid, which keeps every session and marks the band instead, every figure is
// still the term's. A fix that made the sentence follow the window everywhere would put a count of
// eleven over eighty three drawn chips, so the second is not a restatement of the first. Both are
// against SENTENCE_MODEL, which walks window.GI and rebuilds every figure, and both carry the
// claim that the other reading of the same term gives different numbers.
// 232 with issue 125, and the nine are one card's claim rather than nine readings of a menu. A gap
// was a number a reader read and then went and found the things themselves, and the rows are a
// place to go now; more than that, the 95 stopped being one list. The registry the model already
// ships answers per class which system holds a row of it, and joined against the 95 that answer
// splits them into 22 somebody can close this week and 73 no effort inside the current tooling
// touches. So the first three are the split: that it is that join and not a partition typed into
// app.js, that the heading over the second side is READ from the ghost type's own label and the
// registry's own sentence rather than becoming a fourth word for a finding the page already had
// three words for, and that exactly the rows the page can answer for are controls and each meets
// #77's floor. Three are the destination: that the number on the row and the ids in the table are
// one set, recomputed here; that a worklist keeps the window that was in force rather than arming
// the review's default, which #124 put there and which would hand a reader one number on the
// control and another on the screen; and that the way off gives back the figure its own text names.
// One is the address, that a field the reading cannot answer for is not a filter at all and that
// the outline never carries a worklist it would not draw. Two are #122 inherited, and they are the
// rule met in its most flattering direction: "everything here is staffed" read off six sessions of
// seventy nine is a property of a document, so an empty worklist and an absent programme both count
// over the DRAWN rows and both say the word.
const EXPECTED_ASSERTIONS = 240;

// One retry on a failed browser start, which is what the evidence supports: the CI rerun that gave
// 70 of 70 started its browser on the first attempt. A larger budget would turn a genuinely broken
// image into a slow failure instead of a fast one, and the message at the end of the budget is the
// same message either way.
const LAUNCH_ATTEMPTS = 2;
const LAUNCH_RETRY_MS = 1500;

// =================================================================================================
// The report. Every assertion runs and every failure is printed: a suite that stops at the first
// one hides the other four, and a bare "assertion failed" costs the reader the debugging session
// the message was supposed to save them.
// =================================================================================================
const results = [];
let where = '-';
let phase = '-';

function setWhere(label) { where = label; }
function setPhase(label) { phase = label; }

function pass(name, detail) {
  results.push({ ok: true, name, where, phase });
  console.log(`[PASS] ${where}  ${name}${detail ? '  (' + detail + ')' : ''}`);
}

function fail(name, expected, found) {
  results.push({ ok: false, name, where, phase, expected, found });
  console.log(`[FAIL] ${where}  ${name}`);
  console.log(`         expected: ${expected}`);
  console.log(`         found:    ${found}`);
}

// =================================================================================================
// The harness, kept apart from the page. Issue 67.
//
// A finding recorded here is a statement about the runner and never about the artefact under test,
// and the two are held in separate lists so that no arithmetic anywhere can quietly add one to the
// other. A browser that did not start contributes no assertion, passing or failing; it contributes
// a reason the suite cannot answer.
// =================================================================================================
const harnessFindings = [];

class HarnessFailure extends Error {
  constructor(message, detail) {
    super(message);
    this.name = 'HarnessFailure';
    this.detail = detail || '';
  }
}

function harnessFail(what, detail) {
  harnessFindings.push({ what, detail: detail || '' });
  console.log(`[HARNESS] ${what}`);
  if (detail) console.log(String(detail).split('\n').map(l => '          ' + l).join('\n'));
}

function assert(name, ok, expected, found, detail) {
  if (ok) pass(name, detail); else fail(name, expected, found);
  return ok;
}

function assertEqual(name, actual, wanted, note) {
  const a = JSON.stringify(actual), w = JSON.stringify(wanted);
  return assert(name, a === w, w + (note ? ' (' + note + ')' : ''), a);
}

// The test affordance, and it exists because a count assertion nobody can fire is a count
// assertion nobody has checked. origin-freshness.yml carries the same idea in its `expected_sha`
// input. It is safe in the only sense that matters: the phase it skips stays in PHASES, so the
// intended count is unchanged and the run cannot come out clean.
const SKIP_PHASE = process.env.SMOKE_SKIP_PHASE || '';

function phaseIsSkipped(name) {
  if (!SKIP_PHASE || SKIP_PHASE !== name) return false;
  console.log(`[SKIPPED] ${where}  ${name}  (SMOKE_SKIP_PHASE; the count assertion will say so)`);
  return true;
}

// A group that throws must not take the groups after it down with it. The throw is reported as a
// failure of that group, named, with the message, and the suite carries on.
async function group(name, fn) {
  setPhase(name);
  try {
    if (!phaseIsSkipped(name)) await fn();
  } catch (err) {
    fail(name + ' (the group threw before it finished)',
         'the group to run to completion',
         (err && err.stack ? err.stack.split('\n').slice(0, 4).join(' | ') : String(err)));
  } finally {
    setPhase('-');
  }
}

// =================================================================================================
// The static server. site/ over HTTP on an ephemeral port, so the default run tests the working
// tree and a developer can run it before pushing. Missing files 404 rather than being invented,
// because the favicon 404 is one of the things asserted and a server that served something for it
// would hide the assertion rather than satisfy it.
// =================================================================================================
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function serveSite(dir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
      if (rel === '/' || rel === '') rel = '/index.html';
      const file = path.join(dir, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
      // Never serve outside the directory, however the path was spelled.
      if (!file.startsWith(dir + path.sep)) { res.writeHead(403).end('forbidden'); return; }
      fs.readFile(file, (err, body) => {
        if (err) { res.writeHead(404, { 'content-type': 'text/plain' }).end('not found'); return; }
        res.writeHead(200, {
          'content-type': MIME[path.extname(file)] || 'application/octet-stream',
          'cache-control': 'no-store'
        });
        res.end(body);
      });
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, base: `http://127.0.0.1:${server.address().port}/` });
    });
  });
}

// =================================================================================================
// The browser, and the CDP client.
// =================================================================================================
function resolveChrome() {
  const tried = [];
  const named = [process.env.SMOKE_CHROME, process.env.CHROME_PATH, process.env.CHROME_BIN]
    .filter(Boolean);
  const guesses = [
    // The local development machine. Named first among the guesses because it is the one this
    // suite was written against, and it is deliberately not the only one: in CI it does not
    // exist, which is exactly the case the message below has to be useful for.
    path.join(os.homedir(), '.cache/ms-playwright/chromium-1228/chrome-linux64/chrome'),
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ];
  for (const p of [...named, ...guesses]) {
    tried.push(p);
    try { fs.accessSync(p, fs.constants.X_OK); return { path: p, tried }; } catch { /* next */ }
  }
  const lines = [
    'No browser found. This suite drives Chrome over the DevTools Protocol and cannot run without one.',
    'Set SMOKE_CHROME (or CHROME_PATH, or CHROME_BIN) to an executable Chrome or Chromium.',
    'Paths tried, in order:'
  ].concat(tried.map(p => '  ' + p));
  throw new Error(lines.join('\n'));
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.handlers = new Map();
    ws.addEventListener('message', ev => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        if (m.error) reject(new Error(m.error.message || JSON.stringify(m.error)));
        else resolve(m.result);
        return;
      }
      const list = this.handlers.get(m.method);
      if (list) list.forEach(fn => fn(m.params, m.sessionId));
    });
    ws.addEventListener('close', () => {
      this.pending.forEach(({ reject }) => reject(new Error('the browser closed the connection')));
      this.pending.clear();
    });
  }

  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(fn);
  }

  send(method, params = {}, sessionId) {
    const msg = { id: ++this.id, method, params };
    if (sessionId) msg.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(msg.id, { resolve, reject });
      this.ws.send(JSON.stringify(msg));
    });
  }
}

async function launchBrowser(chrome, width, height) {
  // A fresh profile per run, and it is the whole of the answer to a stale browser answering on
  // the debug port: the port is 0, so the browser picks one and writes it into this directory,
  // and this directory did not exist a moment ago. There is nothing to guess and nothing that
  // could have been left behind by an earlier run.
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'zmt-smoke-'));
  const launchedAt = Date.now();
  const proc = spawn(chrome, [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    // Two flags that are about the container and not about the page. The profile is a throwaway
    // and the only document it ever loads is a static file from a local server, with every
    // external host blocked below at the network layer.
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    // A background tab that throttles its timers would make board.js's poll and app.js's
    // reveal() land at times nothing here can wait on.
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=Translate,MediaRouter,OptimizationHints',
    `--window-size=${width},${height}`,
    'about:blank'
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  const stderr = [];
  proc.stderr.on('data', d => stderr.push(String(d)));

  // Every throw below leaves a process and a profile directory behind, and a retry that inherits
  // either of those is a retry measuring the attempt that failed rather than a fresh one. Issue 67.
  const abandon = () => {
    try { proc.kill('SIGKILL'); } catch { /* already gone */ }
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* best effort */ }
  };
  try {
    return await connect();
  } catch (err) {
    abandon();
    throw err;
  }

  async function connect() {
  const portFile = path.join(profile, 'DevToolsActivePort');
  let port = null;
  const deadline = Date.now() + TIMEOUT;
  while (Date.now() < deadline) {
    if (fs.existsSync(portFile)) {
      const st = fs.statSync(portFile);
      const lines = fs.readFileSync(portFile, 'utf8').split('\n');
      // Newer than the launch, so a file from anything else is refused rather than trusted.
      if (st.mtimeMs >= launchedAt - 1000 && lines[0] && lines[1]) { port = Number(lines[0]); break; }
    }
    if (proc.exitCode !== null) {
      throw new Error(`the browser exited with ${proc.exitCode} before it opened a debug port\n` +
                      stderr.join(''));
    }
    await sleep(25, 'polling for the browser to write its own debug port');
  }
  if (!port) throw new Error(`the browser wrote no DevToolsActivePort in ${TIMEOUT}ms\n${stderr.join('')}`);

  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', () => reject(new Error('could not open the CDP socket')), { once: true });
  });

  return {
    cdp: new Cdp(ws),
    browser: version.Browser,
    close() {
      try { ws.close(); } catch { /* already gone */ }
      abandon();
    }
  };
  }
}

// One retry, and it is the whole of the answer to the flake in issue 67: `no DevToolsActivePort in
// 20000ms` with dbus errors on one dispatch, 70 of 70 on a rerun of the identical commit minutes
// later. Every attempt is named in the log with the reason it failed, so a retry that is quietly
// saving every run is visible rather than hidden, and the budget running out throws a
// HarnessFailure rather than a plain Error, which is what keeps a browser that never started out
// of the verdict about the page.
async function launchWithRetry(chrome, width, height, label) {
  const reasons = [];
  for (let attempt = 1; attempt <= LAUNCH_ATTEMPTS; attempt++) {
    try {
      const b = await launchBrowser(chrome, width, height);
      if (attempt > 1) {
        console.log(`  the browser started on attempt ${attempt} of ${LAUNCH_ATTEMPTS}, after ${attempt - 1} failed`);
      }
      return b;
    } catch (err) {
      const why = (err && err.message ? err.message : String(err)).split('\n')[0];
      reasons.push(`attempt ${attempt} of ${LAUNCH_ATTEMPTS}: ${why}`);
      console.log(`  the browser did not start at ${label} on attempt ${attempt} of ${LAUNCH_ATTEMPTS}: ${why}`);
      if (attempt < LAUNCH_ATTEMPTS) {
        console.log(`  retrying in ${LAUNCH_RETRY_MS}ms with a fresh profile`);
        await sleep(LAUNCH_RETRY_MS);
      }
    }
  }
  throw new HarnessFailure(
    `the browser never started at ${label}, in ${LAUNCH_ATTEMPTS} attempt(s)`,
    reasons.join('\n'));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// =================================================================================================
// One page, wired.
// =================================================================================================
async function openPage(cdp, viewport) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Log.enable', {}, sessionId);
  await cdp.send('Network.enable', {}, sessionId);

  // The network layer's own refusal, under the page and under any stub the page could undo.
  await cdp.send('Network.setBlockedURLs', {
    urls: ['*://github.com/*', '*://api.github.com/*', '*://*.githubusercontent.com/*']
  }, sessionId);

  const console_ = [];      // console errors and page exceptions
  const requests = [];      // every request the page attempted
  cdp.on('Runtime.consoleAPICalled', p => {
    if (p.type === 'error') {
      console_.push({ kind: 'console.error', text: (p.args || []).map(describeArg).join(' '), url: '' });
    }
  });
  cdp.on('Log.entryAdded', p => {
    if (p.entry && p.entry.level === 'error') {
      console_.push({ kind: 'log:' + p.entry.source, text: p.entry.text, url: p.entry.url || '' });
    }
  });
  cdp.on('Runtime.exceptionThrown', p => {
    const d = p.exceptionDetails || {};
    console_.push({
      kind: 'exception',
      text: (d.exception && (d.exception.description || d.exception.value)) || d.text || 'exception',
      url: d.url || ''
    });
  });
  cdp.on('Network.requestWillBeSent', p => {
    requests.push({ url: p.request.url, method: p.request.method });
  });

  const page = {
    sessionId,
    console: console_,
    requests,
    viewport,
    actual: null,
    mechanism: null,

    send: (method, params) => cdp.send(method, params, sessionId),

    async evaluate(expression) {
      const r = await cdp.send('Runtime.evaluate',
        { expression, returnByValue: true, awaitPromise: true }, sessionId);
      if (r.exceptionDetails) {
        const d = r.exceptionDetails;
        throw new Error('page threw: ' +
          ((d.exception && (d.exception.description || d.exception.value)) || d.text));
      }
      return r.result.value;
    },

    // A real reload, waited on properly. Setting location.hash is a same-document navigation and
    // raises no load event, so it must never be waited on as though it were one.
    async reload() {
      const loaded = new Promise(resolve => { cdp.on('Page.loadEventFired', () => resolve()); });
      await cdp.send('Page.reload', {}, sessionId);
      await Promise.race([loaded, sleep(TIMEOUT)]);
    },

    async navigate(url) {
      const loaded = new Promise(resolve => {
        const off = p => { if (p) resolve(); };
        cdp.on('Page.loadEventFired', off);
      });
      await cdp.send('Page.navigate', { url }, sessionId);
      await Promise.race([loaded, sleep(TIMEOUT)]);
    },

    // Wait on a condition the page answers. Returns nothing and throws with the last reason the
    // page gave, which is the difference between "the page never became ready" and a useful
    // message saying which half of ready was missing.
    async waitFor(expression, what) {
      const deadline = Date.now() + TIMEOUT;
      let last = 'no answer yet';
      while (Date.now() < deadline) {
        last = await this.evaluate(expression);
        if (last === '' || last === true) return;
        await sleep(20);
      }
      throw new Error(`waiting for ${what}: ${JSON.stringify(last)} after ${TIMEOUT}ms`);
    }
  };

  // The three stubs, installed before any page script runs, so nothing this suite drives can
  // reach a network the browser has not already been told to refuse. Recording rather than
  // silently swallowing: an assertion below reads the record.
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: STUB_SOURCE
  }, sessionId);

  // The size the harness actually got, stated rather than assumed. --window-size is the OUTER
  // window and headless Chrome reserves a constant band of height inside it, so asking for the
  // page's own innerHeight means measuring the difference and correcting for it rather than
  // hardcoding a number that would be wrong on the next Chrome. Below the 500px window floor
  // no real window exists and the emulation override is used instead, which is the case
  // KAIZEN.md `kaizen-a-tool-that-refuses-the-size-you-asked-for` is about.
  await page.navigate('about:blank');
  if (viewport.emulate || viewport.w < WINDOW_FLOOR_PX) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.w, height: viewport.h, deviceScaleFactor: 1, mobile: false
    }, sessionId);
    // Named by which of the two reasons applied, because they are different reasons and a run
    // that printed the floor at a width nowhere near it would be stating something untrue in the
    // one line whose whole job is saying what the harness actually got.
    page.mechanism = 'Emulation.setDeviceMetricsOverride ' +
      (viewport.w < WINDOW_FLOOR_PX
        ? '(below the ' + WINDOW_FLOOR_PX + 'px window floor)'
        : '(the viewport asked for it)');
  } else {
    const { windowId } = await cdp.send('Browser.getWindowForTarget', { targetId });
    for (let attempt = 0; attempt < 4; attempt++) {
      const [iw, ih] = await page.evaluate('[innerWidth, innerHeight]');
      if (iw === viewport.w && ih === viewport.h) break;
      const b = await cdp.send('Browser.getWindowForTarget', { targetId });
      await cdp.send('Browser.setWindowBounds', {
        windowId,
        bounds: {
          width: b.bounds.width + (viewport.w - iw),
          height: b.bounds.height + (viewport.h - ih)
        }
      });
    }
    page.mechanism = 'a real window (Browser.setWindowBounds), no emulation';
  }
  const [aw, ah] = await page.evaluate('[innerWidth, innerHeight]');
  page.actual = { w: aw, h: ah };

  return page;
}

function describeArg(a) {
  if (a.value !== undefined) return String(a.value);
  return a.description || a.type;
}

// The stub, as source, because it has to run before the page's own scripts and therefore cannot
// be a function in this file. window.__smoke is the record every network assertion reads.
const STUB_SOURCE = `(function () {
  var rec = { calls: [], opens: [] };
  Object.defineProperty(window, '__smoke', { value: rec, writable: false, configurable: false });
  var realFetch = window.fetch;
  function note(url, method) { rec.calls.push({ url: String(url), method: String(method).toUpperCase() }); }
  window.fetch = function (input, init) {
    var url = (typeof input === 'string') ? input : (input && input.url) || String(input);
    var method = (init && init.method) || (input && input.method) || 'GET';
    note(url, method);
    // The board's live path, answered from a fixture this suite plants, so that board.js's own
    // column rule and its arithmetic assertion are exercised against a known set of issues with
    // no network and no credential anywhere in it. The fixture is read out of localStorage rather
    // than off a page global so that it survives a reload, which is what lets the board be tested
    // on a page whose very first poll is the live one; see checkBoard for why that matters.
    var fixture = null;
    try {
      var raw = localStorage.getItem('__smoke.issues');
      fixture = raw ? JSON.parse(raw) : null;
    } catch (e) { fixture = null; }
    if (fixture && /^https:\\/\\/api\\.github\\.com\\/repos\\/[^/]+\\/[^/]+\\/issues/.test(url)) {
      return Promise.resolve(new Response(JSON.stringify(fixture), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'etag': 'W/"smoke-fixture"',
          'x-ratelimit-remaining': '4999'
        }
      }));
    }
    if (/^https?:\\/\\/(api\\.)?github\\.com/.test(url)) {
      return Promise.reject(new TypeError('refused by the smoke suite: this page must reach no host'));
    }
    return realFetch.apply(this, arguments);
  };
  var RealXhr = window.XMLHttpRequest;
  function StubXhr() {
    var x = new RealXhr();
    var open = x.open;
    x.open = function (method, url) { note(url, method); return open.apply(x, arguments); };
    return x;
  }
  window.XMLHttpRequest = StubXhr;
  if (navigator.sendBeacon) {
    navigator.sendBeacon = function (url) { note(url, 'POST'); return false; };
  }
  window.open = function (url) { rec.opens.push(String(url)); return null; };
})();`;

// =================================================================================================
// WHAT THIS SUITE IS ALLOWED TO READ, AND WHY IT IS NOT THE GENERATED DOCUMENTS
//
// When this was written the build shipped one blob, site/graph.js, holding two different things:
// the instance data, which is the objects, their types, their properties and the provenance flag
// on each, and the layout, which is every coordinate, tile size, edge path and band. #58 was told
// that the fusion was going to be split, so that the data document could be swapped without
// touching the presentation and one codebase could serve invented data on the public origin and
// real data on a private deployment, and that a suite reading `G.nodes[i].props[j].f` would break
// on the day the split landed, which would make it a tax on the refactor instead of the net under
// it.
//
// THE SPLIT LANDED WITH ISSUE 60 SEAM 1 AND THIS FILE DID NOT MOVE. site/graph.js became
// site/instance.js and site/layout.js, every node and edge in the page was rebuilt from a join of
// the two, and all 70 assertions passed without one of them being edited. That is what the
// discipline below bought, and it is the reason to keep it: the suite is a net under a refactor
// only for as long as it asserts what the page presents rather than how the page is fed.
//
// So nothing below reads either document. Every fact is taken from one of three places, all of
// which are what the page presents rather than how it is fed:
//
//   the rendered DOM      `[data-node]` and `[data-edge]`, which are the instance and relationship
//                         keys app.js writes and every feedback report already quotes; each node's
//                         <title>, which carries its label and its type as the reader is told them;
//                         the verb chip's own text; the detail panel; the student list.
//   window.ZT             published by app.js deliberately, and its comment says so: the view, the
//                         selection and the veiled set are there "for a driver to read and assert
//                         against rather than for the page".
//   window.ZMT            published by feedback.js on the same footing, and read by board.js.
//
// A count this suite needs and the DOM does not carry is a count it does not assert. Where the
// page presents a number as text, that text is the source: the marker under the students card, the
// panel's own "see all N students", and the student list's header are three renderings of one
// fact, and making them agree is a stronger check than reading the fact once out of the blob.
//
// The page's own readiness is on the same footing. app.js publishes window.ZT as its last
// statement, so ZT existing means app.js ran to completion; a node in the DOM means draw() painted;
// a measured view means the canvas has a box, which is the state the whole canvas section is
// written against.
// =================================================================================================
const DIAGRAM_READY = `(function () {
  if (!window.ZT || typeof window.ZT.veiled !== 'function') return 'window.ZT is not published';
  if (!document.querySelector('#graph [data-node]')) return 'the drawing has painted no node';
  if (!document.querySelector('#graph [data-edge]')) return 'the drawing has painted no relationship';
  var v = window.ZT.view();
  if (!(v.k > 0) || !(v.w > 2) || !(v.h > 2)) return 'the canvas has no measured box yet';
  return '';
})()`;

// The drawing, read off the document. A node's <title> is written by app.js as
// `label (Type label)`, which is the type as the reader is told it, and a relationship's verb is
// the text of its own chip. Both are the strings a reader sees and a feedback report quotes.
const READ_DRAWING = `(function () {
  function typeOf(g) {
    var t = g.querySelector('title');
    var m = t ? /\\(([^()]*)\\)\\s*$/.exec(t.textContent) : null;
    return m ? m[1] : '';
  }
  function labelOf(g) {
    var t = g.querySelector('title');
    return t ? t.textContent.replace(/\\s*\\([^()]*\\)\\s*$/, '') : '';
  }
  var nodes = Array.prototype.slice.call(document.querySelectorAll('#graph g[data-node]'))
    .map(function (g) {
      return { id: g.getAttribute('data-node'), type: typeOf(g), label: labelOf(g),
               veiled: g.classList.contains('veil-hidden') };
    });
  // One chip per relationship, and the chip carries the verb. The line and the arrowhead share the
  // same data-edge key and carry no text, so reading the chips is reading each relationship once.
  var edges = Array.prototype.slice.call(document.querySelectorAll('#graph g[data-edge] text.chip-tx'))
    .map(function (t) {
      var key = t.closest('[data-edge]').getAttribute('data-edge');
      var cut = key.indexOf('->');
      return { key: key, s: key.slice(0, cut), t: key.slice(cut + 2), verb: t.textContent };
    });
  return { nodes: nodes, edges: edges };
})()`;

// =================================================================================================
// Pointer helpers, every one of them hit tested first.
// =================================================================================================
// There is no plain rectOf() here, deliberately. Every measurement of a box this suite is about to
// click goes through stableRect() below, because a single reading of a rect is a reading taken at
// a moment, and the moments this page has are a panel sliding, a reveal timer that has not fired
// and a canvas being re-inset. One measured rect and one dispatched click at that rect is the
// whole of the failure it exists to prevent.

// What is actually at this coordinate. The reason this exists rather than a bare dispatch is
// KAIZEN.md `kaizen-a-widened-control-keeps-its-neighbours-reachable`: a control that is drawn and
// outside the viewport is invisible to a screenshot and to a click alike, and a dispatched click
// that lands on nothing looks exactly like a click on a control that does nothing.
async function hitTest(page, x, y) {
  return page.evaluate(`(function () {
    var el = document.elementFromPoint(${x}, ${y});
    if (!el) return { hit: false, why: 'nothing at that point (it is outside the viewport, or covered by nothing)' };
    var node = el.closest ? el.closest('[data-node]') : null;
    return {
      hit: true,
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      cls: el.getAttribute('class') || '',
      node: node ? node.getAttribute('data-node') : null,
      inViewport: ${x} >= 0 && ${y} >= 0 && ${x} < innerWidth && ${y} < innerHeight
    };
  })()`);
}

async function requireHit(page, x, y, want) {
  const h = await hitTest(page, x, y);
  const ok = h.hit && h.inViewport && (!want.node || h.node === want.node) &&
             (!want.id || h.id === want.id) && (!want.tag || h.tag === want.tag);
  if (!ok) {
    throw new Error(`the point (${x.toFixed(1)}, ${y.toFixed(1)}) does not reach ` +
      `${JSON.stringify(want)}: ${JSON.stringify(h)}`);
  }
  return h;
}

// EVERY COORDINATE THIS SUITE DISPATCHES IS AN INTEGER, and this refuses rather than rounds.
//
// Input.dispatchMouseEvent takes a float and the browser floors it. Give it 322.9488 and the page
// anchors its zoom on 322, while the driver goes on doing arithmetic about 322.9488, and the two
// differ by (1 - k1/k0) times that fraction: at the four step gesture below, 1.78px of apparent
// drift on the vertical axis and 0.15px on the horizontal, from an anchor chosen as a fraction of
// the canvas rect. That is what the first run of this suite reported as a page defect. It was
// checked before it was believed, by predicting both numbers from the floor alone, and they came
// out at 1.7789 and 0.1500 against 1.7814 and 0.1486 measured, so the page was right and the driver
// was wrong. KAIZEN.md `kaizen-verifier-not-exempt-from-verification` and
// `kaizen-a-harness-and-a-page-must-agree-on-the-coordinate`.
//
// It throws rather than rounding here because rounding here is exactly the bug: the caller would
// still hold the float it did its arithmetic with, and the mismatch would be silent again. The
// caller has to choose an integer, and then the point it dispatched and the point it reasons about
// are the same point. Same shape as HANSEI.md `2026-08-empty-input-reported-success`: coercing a
// bad input into a valid one turns a loud error into a quiet wrong answer.
function px(name, v) {
  if (!Number.isInteger(v)) {
    throw new Error(`${name}=${v} is not an integer. The browser floors a dispatched pointer ` +
      `coordinate, so a driver that measures at ${v} and dispatches at ${Math.floor(v)} is ` +
      `measuring its own rounding. Round the point once, then use it for both.`);
  }
  return v;
}

async function mouse(page, type, x, y, buttons) {
  await page.send('Input.dispatchMouseEvent', {
    type, x: px('x', x), y: px('y', y), button: 'left', buttons, clickCount: 1, pointerType: 'mouse'
  });
}

async function click(page, x, y) {
  await mouse(page, 'mousePressed', x, y, 1);
  await mouse(page, 'mouseReleased', x, y, 0);
}

async function dragBy(page, x, y, dx, dy, steps) {
  await mouse(page, 'mousePressed', x, y, 1);
  const n = steps || 8;
  for (let i = 1; i <= n; i++) {
    await mouse(page, 'mouseMoved', Math.round(x + (dx * i) / n), Math.round(y + (dy * i) / n), 1);
  }
  await mouse(page, 'mouseReleased', x + dx, y + dy, 0);
}

// The view stops moving. Used where the page offers no signal for "nothing further will happen":
// select() schedules ensureVisible() 30ms later through reveal(), so a reading taken the instant a
// gesture ends can be a reading taken mid-pan. This waits for two identical readings 40ms apart
// rather than sleeping a fixed amount and hoping, and it is the only wait in the suite that is
// about elapsed time at all.
async function viewSettled(page) {
  let last = null;
  const deadline = Date.now() + TIMEOUT;
  while (Date.now() < deadline) {
    const v = await page.evaluate('JSON.stringify(window.ZT.view())');
    if (v === last) return JSON.parse(v);
    last = v;
    await sleep(40);
  }
  throw new Error('the view never stopped moving');
}

async function clearSelection(page) {
  // Through the page's own way out rather than by calling into it: Escape is what a reader
  // presses and is registered in the bubble phase in app.js.
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await page.waitFor('window.ZT.selected() === null', 'the selection to clear');
  // And then wait for the plane to stop. select() schedules ensureVisible() 30ms later through
  // reveal(), and clearing the selection does not cancel that timer, so the drawing can still be
  // about to pan when the selection is already gone.
  await viewSettled(page);
}

// A rect that has stopped moving, and the reason it exists is a failure this suite had in CI and
// never had locally. The sequence is: click a node, the panel opens, reveal() schedules a pan for
// 30ms later, the selection is cleared, the next node's rect is measured, and only then does that
// pan fire and take the tile out from under the measured point. The click then lands on empty
// canvas, and what the log says is that the suite waited twenty seconds for a selection that never
// came, which is a true statement about the page and a useless one about the cause. Locally the
// timer had always fired before the measurement; on a runner it had not.
//
// Two identical readings, which is a condition about the document rather than an interval chosen
// to be long enough, and then the point is measured, hit tested and clicked with nothing in
// between that could move it again.
//
// AND TWO IDENTICAL READINGS ARE NOT ENOUGH, WHICH IS ISSUE 114 AND THE SECOND HALF OF THIS
// FUNCTION. A client rect of anything on the drawing is a statement about a pan and zoom surface,
// so it means what it says only while the transform the browser is rendering is the transform the
// page's own three numbers describe. A frame in which those two disagree is perfectly still: both
// readings agree, the rect is returned, and the point clicked is six figures from the tile it was
// measured on. That is not a hypothetical. The group failed in CI three times at (511294, 192646),
// the same pair twice, which is a deterministic state reached by a race and not a runner flake,
// and forcing the race locally reproduces 511294 to the pixel on the tile the drawing calls t4.
//
// SO THE SETTLED TEST IS THE PAGE'S OWN INVARIANT AND NOT AN INTERVAL. Two things are read beside
// the rect, in the same evaluate so they are the same instant:
//
//   the window   window.ZT.view() publishes the box viewport.js measured, and applyView() frames
//                exactly that box. It has to be the box the canvas actually has. Measured over
//                seven programmes, two grains and seven zoom steps, the difference is 0 and not
//                a small number, so this is asserted as equality and given no tolerance at all.
//   the scale    getScreenCTM().a is the scale the browser is rendering the drawing at and
//                view.k is the scale the page believes it is at. Same 98 samples: they agree to
//                3.6e-6 relative, which is the viewBox attribute's three decimal places and
//                nothing else. The tolerance below is 1e-3, three hundred times that residual and
//                six orders inside the failure it is here to catch, which was a factor of 756.
//
// THIS IS NOT A RETRY AND MUST NOT BECOME ONE. Nothing here clicks, nothing here loosens what
// requireHit demands, and no assertion is softened. The point is measured once, in a state the
// page agrees it is in, and then hit tested exactly as before. If that state never arrives inside
// the deadline the drawing is rendering at a scale the page does not hold, which is a finding
// about the page and is reported with both numbers rather than as a rect that would not sit still.
async function stableRect(page, selector) {
  let last = null, why = 'nothing has been read yet';
  const deadline = Date.now() + TIMEOUT;
  while (Date.now() < deadline) {
    const now = await page.evaluate(`(function () {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      var b = el.getBoundingClientRect();
      var svg = document.getElementById('graph');
      var canvas = document.getElementById('canvas');
      var v = (window.ZT && window.ZT.view) ? window.ZT.view() : null;
      var cr = canvas ? canvas.getBoundingClientRect() : null;
      var m = svg ? svg.getScreenCTM() : null;
      var why = '';
      // Only while the canvas has a box of its own. Where it has none the drawing is off screen,
      // there is no transform to be in the space of, and what is being measured is a control in
      // the chrome rather than a tile on the plane.
      if (v && cr && cr.width > 2 && cr.height > 2) {
        if (v.w !== cr.width || v.h !== cr.height) {
          why = 'the page has framed a window of ' + v.w + ' by ' + v.h +
                ' and the canvas measures ' + cr.width + ' by ' + cr.height;
        } else if (m && Math.abs(m.a - v.k) > v.k * 1e-3) {
          why = 'the page holds a scale of ' + v.k +
                ' and the browser is rendering the drawing at ' + m.a;
        }
      }
      return JSON.stringify({ x: b.x, y: b.y, w: b.width, h: b.height, why: why });
    })()`);
    if (now === null) throw new Error(`no element matches ${selector}`);
    const b = JSON.parse(now);
    if (now === last && !b.why) {
      return { x: b.x, y: b.y, w: b.w, h: b.h, cx: b.x + b.w / 2, cy: b.y + b.h / 2 };
    }
    why = b.why || `${selector} is still moving`;
    last = now;
    await sleep(40);
  }
  throw new Error(`${selector} never settled: ${why}`);
}

// Click a node by its data-node key, on a rect that has settled, hit tested first.
async function clickNode(page, id) {
  const r = await stableRect(page, `[data-node="${id}"] rect.tile-bg`);
  const p = { x: Math.round(r.cx), y: Math.round(r.cy) };
  await requireHit(page, p.x, p.y, { node: id });
  await click(page, p.x, p.y);
  return { ...r, ...p };
}

// A point on the canvas that no node occupies. Found by asking the page rather than by computing
// one from the layout, because what matters is where a click would land and that is a question
// about the rendered document.
async function backgroundPoint(page) {
  const p = await page.evaluate(`(function () {
    var c = document.getElementById('canvas').getBoundingClientRect();
    for (var fy = 0.12; fy < 0.95; fy += 0.06) {
      for (var fx = 0.06; fx < 0.95; fx += 0.05) {
        var x = c.left + c.width * fx, y = c.top + c.height * fy;
        var el = document.elementFromPoint(x, y);
        if (!el) continue;
        if (el.closest('[data-node]') || el.closest('[data-edge]')) continue;
        if (el.closest('#zoomctl') || el.closest('#panel') || el.closest('header')) continue;
        if (el.closest('svg') !== document.getElementById('graph')) continue;
        return { x: Math.round(x), y: Math.round(y) };
      }
    }
    return null;
  })()`);
  if (!p) throw new Error('found no point on the canvas that is not a node, an edge or a control');
  return p;
}

// =================================================================================================
// THE CHECKS
// =================================================================================================

// ---- model and reveal ---------------------------------------------------------------------------
async function checkModelAndReveal(page) {
  const drawing = await page.evaluate(READ_DRAWING);
  const veil = await page.evaluate('window.ZT.veiled()');

  const companies = drawing.nodes.filter(n => n.type === 'Company').map(n => n.id).sort();
  const employ = drawing.edges.filter(e => e.verb === 'employed by');
  const employers = employ.map(e => e.t).sort();
  const students = drawing.edges.filter(e => e.verb === 'member of').map(e => e.s).sort();

  // The keys have to name nodes that are on the page. This is the one structural claim about the
  // drawing that costs nothing and would catch a half-drawn graph: a relationship pointing at a
  // node nobody painted is an arrow into an empty lane, which is a stronger claim than it means.
  const ids = new Set(drawing.nodes.map(n => n.id));
  const dangling = drawing.edges.filter(e => !ids.has(e.s) || !ids.has(e.t)).map(e => e.key);
  assert('every relationship on the page joins two nodes that are on the page',
    dangling.length === 0, 'no data-edge key naming a node the drawing does not carry',
    dangling.join(', ') || 'none',
    `${drawing.nodes.length} nodes, ${drawing.edges.length} relationships`);

  assert('six Company nodes exist',
    companies.length === 6, '6 nodes whose type reads Company',
    companies.length + ': ' + companies.join(', '));

  assert('five of them are the target of an `employed by` edge',
    employers.length === 5 && new Set(employers).size === 5,
    '5 distinct employers', employers.join(', ') || 'none');

  // The sixth Company. Aretxa Capital hosts a visit and employs nobody, and it stays on the page:
  // app.js's VEIL_RULES comment is explicit that a rule keyed on `type === 'Company'` would take it
  // off along with the five and delete exactly the distinction this toy exists to show, that one
  // type is playing two roles. Which id that is comes out of the drawing rather than being typed
  // here: it is the Company that no `employed by` edge points at.
  const idle = companies.filter(id => !employers.includes(id));
  assert('the sixth Company is the one no `employed by` edge points at',
    idle.length === 1, 'exactly one Company employing nobody', idle.join(', ') || 'none');
  if (idle.length === 1) {
    const on = drawing.nodes.find(n => n.id === idle[0]);
    const vis = await page.evaluate(
      `getComputedStyle(document.querySelector('[data-node=${JSON.stringify(idle[0])}]')).visibility`);
    assert('and it is on the page before anything is clicked',
      on.veiled === false && vis !== 'hidden' && !veil.hidden.includes(idle[0]),
      `${idle[0]} painted and outside the veil`,
      `veil-hidden ${on.veiled}, computed visibility ${vis}, in the veiled set ` +
      `${veil.hidden.includes(idle[0])}`);
  }

  // The default state. Nine nodes are laid out and not painted: the five employers and the four
  // students. Read off ZT.veiled(), which app.js derives from the rule table itself, so it cannot
  // report a set the stylesheet is not acting on, and checked against the two sets the drawing's
  // own verbs name rather than against a list written here.
  const expectedHidden = employers.concat(students).sort();
  assertEqual('nothing is revealed before anything is clicked',
    veil.hidden.slice().sort(), expectedHidden,
    'the five employers and the four drawn students');
  assertEqual('and nothing at all is shown', veil.shown, []);

  // Clicking each instructor reveals exactly its own employer and nothing else.
  for (const e of employ.slice().sort((a, b) => a.key < b.key ? -1 : 1)) {
    await clickNode(page, e.s);
    await page.waitFor(`window.ZT.selected() && window.ZT.selected().id === ${JSON.stringify(e.s)}`,
      `${e.s} to be selected`);
    const shown = await page.evaluate('window.ZT.veiled().shown');
    assertEqual(`clicking ${e.s} reveals exactly ${e.t}`, shown, [e.t]);
    await clearSelection(page);
  }

  // The last one is cleared the other way a reader clears it, by clicking the canvas away from
  // everything, because that is a different listener from the Escape used above: app.js binds
  // clear() to the svg itself, and a node's own handler stops propagation so only a click that
  // reached no node ever gets there.
  const last = employ[employ.length - 1];
  await clickNode(page, last.s);
  await page.waitFor(`window.ZT.selected() !== null`, 'a node to be selected before clearing it');
  await viewSettled(page);
  const bg = await backgroundPoint(page);
  await click(page, bg.x, bg.y);
  await page.waitFor('window.ZT.selected() === null', 'a click on the canvas to clear the selection');

  const afterClear = await page.evaluate('window.ZT.veiled()');
  assertEqual('clearing the selection hides all five employers again',
    afterClear.hidden.slice().sort(), expectedHidden);
  assertEqual('and leaves nothing revealed', afterClear.shown, []);
}

// ---- a cold load of an address the page wrote ---------------------------------------------------
// THE SUITE NEVER LOADED A DOCUMENT AT ANY ADDRESS BUT THE DEFAULT, and that is the whole reason
// this phase exists. Every other route here is reached by setting location.hash, or by
// Page.navigate to a url differing only in the fragment, and both of those are SAME-DOCUMENT
// navigations: they fire hashchange and never once run the page's construction path. The only
// genuine cold loads were `#/`, three times, and `#/p/ZIB` in the grain browser, and GI.default is
// ZIB at the sessions grain, so even that one is indistinguishable from ignoring the address.
//
// WHAT THAT LEFT UNGATED, MEASURED BY DELETION RATHER THAN ARGUED:
//   `route()` out of `term.start()`         177 of 177, exit 0, and every deep link to the sheet
//                                           dead on a cold load and on F5. That is the state #112
//                                           put on the address so that it could be sent to
//                                           somebody.
//   the construction-time resolution in     177 of 177, exit 0, and a cold #/p/ZBL draws ZIB.
//   `router.js`                             That file's own comment says a reader who follows the
//                                           link and a reader who clicks their way there see the
//                                           same page. Nothing checked it.
// The assertion named "a collapsed view survives a reload of its own address" survives both,
// because it reaches that address by fragment navigation and not by a reload.
//
// NO ADDRESS HERE IS CONSTRUCTED. Each one is driven for through the page's own controls and then
// read back off location.hash, which is the page's own statement of where the reader is, and it is
// THAT string the reload is given. A reader who presses a control, copies the bar and opens it
// somewhere else is the case, and it is the case the page is for.
async function checkColdLoad(page, base) {
  // The reload is on the address the page wrote, so this is the reader's F5 and not a second
  // navigation invented by the driver.
  const coldReload = async what => {
    await page.reload();
    await page.waitFor(DIAGRAM_READY, `the diagram to draw cold at ${what}`);
  };

  // A programme that is not the default, reached the way a reader reaches it, through the picker.
  const moved = await page.evaluate(`(function () {
    var here = window.ZT.programme().key;
    var items = document.querySelectorAll('#pgmenu .pgitem');
    for (var i = 0; i < items.length; i++) {
      if (items[i].getAttribute('href') !== (window.GI.views.filter(function (v) {
            return v.key === here; })[0] || {}).route) { items[i].click(); return true; }
    }
    return false;
  })()`);
  await page.waitFor(`window.ZT.programme().key !== ${JSON.stringify(await page.evaluate('window.GI.default'))}`,
    'the picker to move off the default programme');
  const warm = await page.evaluate(
    `JSON.stringify({ hash: location.hash, key: window.ZT.programme().key })`).then(JSON.parse);
  await coldReload(warm.hash);
  const coldPg = await page.evaluate(
    `JSON.stringify({ hash: location.hash, key: window.ZT.programme().key,
                      dflt: window.GI.default })`).then(JSON.parse);
  assert('a programme address the page wrote draws its own programme on a cold load',
    moved === true && coldPg.key === warm.key && coldPg.key !== coldPg.dflt &&
      coldPg.hash === warm.hash,
    `${warm.key} at ${warm.hash} after a reload of that address, and not the default ` +
      `${coldPg.dflt}`,
    JSON.stringify(coldPg));

  // And the altitude, through its own control, which puts a second segment on the same address.
  await page.evaluate(`(function () {
    document.getElementById('grbtn').click();
    var items = document.querySelectorAll('#grmenu .gritem');
    for (var i = 0; i < items.length; i++) {
      if (items[i].textContent === 'modules') { items[i].click(); return true; }
    }
    return false;
  })()`);
  await page.waitFor(`window.ZT.grain().grain === 'modules'`, 'the drawing to collapse');
  const warmG = await page.evaluate(
    `JSON.stringify({ hash: location.hash, key: window.ZT.programme().key })`).then(JSON.parse);
  await coldReload(warmG.hash);
  const coldG = await page.evaluate(
    `JSON.stringify({ hash: location.hash, key: window.ZT.programme().key,
                      grain: window.ZT.grain().grain })`).then(JSON.parse);
  assert('and a collapsed address arrives collapsed, on the same programme, on a cold load',
    coldG.grain === 'modules' && coldG.key === warmG.key && coldG.hash === warmG.hash,
    `${warmG.key} at the modules grain after a reload of ${warmG.hash}`,
    JSON.stringify(coldG));

  // The sheet. Its addresses come off the page's own list, and the row is opened through the
  // control on its own title, which is what writes the open parameter.
  const sheet = JSON.parse(await page.evaluate('JSON.stringify(window.ZT.termRoutes())'))
    .filter(r => /^#\/outline\//.test(r))[0];
  await page.evaluate(`location.hash = ${JSON.stringify(sheet)}`);
  await page.waitFor(`window.ZT.term().reading === 'outline'`, 'the scoped outline to open');
  await page.evaluate(`document.querySelectorAll('#termrows .rowdisc')[0].click()`);
  await page.waitFor('window.ZT.term().agendaOpen === 1', 'one row to open on its own title');
  const warmT = await page.evaluate(
    `JSON.stringify({ hash: location.hash, t: window.ZT.term() })`).then(JSON.parse);
  await coldReload(warmT.hash);
  const coldT = await page.evaluate(
    `JSON.stringify({ hash: location.hash, t: window.ZT.term(),
                      rows: document.querySelectorAll('#termrows .agenda-line').length })`)
    .then(JSON.parse);
  assert('a sheet address the page wrote opens the sheet it names on a cold load',
    coldT.t.open === true && coldT.t.reading === warmT.t.reading &&
      coldT.t.scope === warmT.t.scope && coldT.hash === warmT.hash,
    `the ${warmT.t.reading} open and scoped to ${warmT.t.scope} after a reload of ${warmT.hash}`,
    JSON.stringify({ open: coldT.t.open, reading: coldT.t.reading, scope: coldT.t.scope,
                     hash: coldT.hash }));
  assert('and the row it named is the row that opens, off the address and not off a hashchange',
    coldT.t.agendaOpen === 1 && coldT.t.agendaParam === warmT.t.agendaParam &&
      warmT.t.agendaParam !== null && coldT.rows > 0,
    `one row open, named ${warmT.t.agendaParam} on the address, with its lines drawn`,
    `${coldT.t.agendaOpen} open, parameter ${JSON.stringify(coldT.t.agendaParam)}, ` +
      `${coldT.rows} line(s) drawn`);

  // Back to the address the rest of the run reasons about, and cold, so nothing after this
  // inherits a state that arrived through a fragment.
  await page.navigate(new URL('#/', base).toString());
  await page.waitFor(DIAGRAM_READY, 'the diagram back at the default address');
}

// ---- students -----------------------------------------------------------------------------------
async function checkStudents(page) {
  // Which card stands for the cohort is read off the drawing rather than typed here: it is the one
  // node the `member of` edges point at.
  const drawing = await page.evaluate(READ_DRAWING);
  const members = drawing.edges.filter(e => e.verb === 'member of');
  const owners = [...new Set(members.map(e => e.t))];
  if (!assert('the drawn students are members of exactly one card',
      owners.length === 1, 'one node at the far end of every `member of` edge',
      owners.join(', ') || 'none')) return;
  const card = owners[0];
  const drawnStudents = members.map(e => e.s).sort();

  await clickNode(page, card);
  await page.waitFor(`window.ZT.selected() && window.ZT.selected().id === ${JSON.stringify(card)}`,
    'the students card to be selected');

  // Three renderings of one fact, all of them text a reader can see: the marker under the card,
  // the panel's link out to the list, and the hint under it. Nothing here holds a copy of 34 or of
  // 30, so a cohort that grew by one and a marker that did not would fail rather than pass quietly.
  const s = await page.evaluate(`(function () {
    var tail = document.querySelector('[data-node=${JSON.stringify(card)}] text.lbl-tail');
    var link = document.querySelector('#pmore .pmore-link');
    var hint = document.querySelector('#pmore .pmore-hint');
    return {
      shown: window.ZT.veiled().shown,
      tailText: tail ? tail.textContent : null,
      tailPainted: tail ? !tail.classList.contains('veil-hidden') : false,
      linkText: link ? link.textContent : null,
      linkHref: link ? link.getAttribute('href') : null,
      hintText: hint ? hint.textContent : null
    };
  })()`);

  assertEqual('clicking the students card reveals the drawn subset and nothing else',
    s.shown, drawnStudents);

  const nInPanel = Number((/see all (\d+) students/.exec(s.linkText || '') || [])[1]);
  const drawnInPanel = Number((/^(\d+) of them are drawn here/.exec(s.hintText || '') || [])[1]);
  const stated = Number((/and (\d+) more/.exec(s.tailText || '') || [])[1]);

  assert('the panel says how big the cohort is and how much of it is drawn',
    Number.isInteger(nInPanel) && Number.isInteger(drawnInPanel),
    'a "see all N students" link and an "N of them are drawn here" hint',
    `link ${JSON.stringify(s.linkText)}, hint ${JSON.stringify(s.hintText)}`);
  assert('the number of tiles revealed is the number the panel claims is drawn',
    s.shown.length === drawnInPanel, `${drawnInPanel} tiles`, `${s.shown.length} tiles`);
  assert('the marker under the card says how many were not drawn',
    stated === nInPanel - drawnInPanel,
    `${nInPanel} in the cohort less ${drawnInPanel} drawn = ${nInPanel - drawnInPanel}`,
    `the card says ${JSON.stringify(s.tailText)}`);
  assert('and the marker is painted while the members are on screen',
    s.tailPainted === true, 'the tail line visible beside the four tiles', String(s.tailPainted));
  assert('the panel links to the route that holds the whole list',
    s.linkHref === '#/students', '#/students', JSON.stringify(s.linkHref));

  await clearSelection(page);

  // The whole cohort as its own route. The expected row count comes from the list's own header,
  // which is itself counted off the rows by app.js, so what is asserted is that the table, the
  // header and the panel all say the same number.
  await page.evaluate(`location.hash = '#/students'`);
  await page.waitFor('window.ZT.roster() === true', 'the student list to open');
  const roster = await page.evaluate(`(function () {
    return {
      rows: document.querySelectorAll('#rosterrows tbody tr').length,
      drawnMarked: document.querySelectorAll('#rosterrows tbody tr.roster-drawn').length,
      title: (document.getElementById('rostertitle') || {}).textContent || '',
      sub: (document.getElementById('rostersub') || {}).textContent || ''
    };
  })()`);
  const titleN = Number((/all (\d+) students/.exec(roster.title) || [])[1]);
  const subRows = Number((/^(\d+) rows/.exec(roster.sub) || [])[1]);
  const subDrawn = Number((/·\s*(\d+) of them drawn on the canvas/.exec(roster.sub) || [])[1]);

  assert('#/students renders a row for every student it says the cohort has',
    roster.rows === titleN && roster.rows === subRows,
    `${titleN} rows, the number the heading claims`,
    `${roster.rows} rows drawn, heading says ${titleN}, subheading says ${subRows}`);
  assert('and it is the same cohort the diagram card counts',
    titleN === nInPanel && subDrawn === drawnInPanel,
    `${nInPanel} students, ${drawnInPanel} of them drawn`,
    `${titleN} students, ${subDrawn} of them drawn`);
  assert('the cohort is still the thirty four the documentation claims',
    roster.rows === 34, '34 rows', `${roster.rows} rows`);
  assert('the rows the drawing carries are marked as such',
    roster.drawnMarked === subDrawn,
    `${subDrawn} rows marked drawn`, `${roster.drawnMarked} rows marked drawn`);

  await page.evaluate(`location.hash = '#/'`);
  await page.waitFor('window.ZT.roster() === false', 'the student list to close');
}

// ---- the term, read twice -------------------------------------------------------------------
// Issues 80 and 82. Thirteen assertions, and every one of them is about a decision those two cards
// made rather than about the shape of the markup that carries it.
//
// NOTHING HERE HOLDS A COPY OF 83 OR OF 260. Every count is taken from the page's own answer,
// window.ZT.term(), and checked against what the reader can see: the rows in the table, the
// sentence over them and the marks on them. A term that grew by a session and a subtitle that did
// not would fail rather than pass quietly, which is the same reasoning the students phase is
// built on.
const TERM_READ = `(function () {
  function txt(sel) { var e = document.querySelector(sel); return e ? e.textContent : null; }
  var rows = Array.prototype.slice.call(document.querySelectorAll(
    '#termrows tbody tr:not(.term-group):not(.term-module):not(.term-agenda)'));
  var groups = Array.prototype.slice.call(
    document.querySelectorAll('#termrows tbody tr.term-group'));
  var mods = Array.prototype.slice.call(
    document.querySelectorAll('#termrows tbody tr.term-module'));
  var ag = Array.prototype.slice.call(
    document.querySelectorAll('#termrows tbody tr.term-agenda'));
  return {
    rows: rows.length,
    // Issue 85. Three row kinds now, and they are counted apart because the whole point of the
    // grouping is that a module heading is not a template and the invented block is neither.
    groups: groups.length,
    modules: mods.length,
    moduleNames: mods.map(function (tr) {
      var n = tr.querySelector('.term-modname');
      return n ? n.textContent : null;
    }).filter(Boolean),
    noModuleGroups: mods.filter(function (tr) {
      return !!tr.querySelector('.term-nomodule');
    }).length,
    noModuleNames: mods.map(function (tr) {
      var n = tr.querySelector('.term-nomodule');
      return n ? n.textContent : null;
    }).filter(Boolean),
    agendaRows: ag.length,
    agendaLines: document.querySelectorAll('#termrows .agenda-line').length,
    // Badges PRINTED in the block, which is a different question from the flag each line carries
    // in the document and is counted here because issue 110 wants the answer to be none. It was
    // agendaUnflagged, a count of lines whose printed badge did not read dummy, and that field
    // could only ask its question while there was a badge to read. No backtick anywhere in this
    // comment: the driver around it is a template literal and one would end the string.
    agendaBadges: document.querySelectorAll('#termrows .agenda-line .flag').length,
    agendaNote: (function () {
      var p = document.querySelector('#termrows .agenda-note');
      return p ? p.textContent : null;
    })(),
    agendaToggle: (function () {
      var b = document.querySelector('.agenda-toggle');
      if (!b) return null;
      var r = b.getBoundingClientRect();
      return { pressed: b.getAttribute('aria-pressed'), w: r.width, h: r.height,
               text: b.textContent };
    })(),

    // Issue 112. THE ROW'S OWN CONTROL, and every field here is about the two things the card
    // asked to be decided rather than assumed: that there is one per row on the row's own title,
    // and that its target is a STATED size rather than the box the title's text happens to make.
    // The smallest of the 83 is what is reported, because a floor that holds for the longest
    // title and not the shortest is not a floor. The textH field is the line box of the title
    // inside the control, which is what the target would have been worth if the text had been
    // left to be the control. No backtick in this comment: the driver around it is a template
    // literal and one would end the string.
    rowdisc: (function () {
      var cs = Array.prototype.slice.call(document.querySelectorAll('#termrows .rowdisc'));
      if (!cs.length) return { n: 0 };
      var r1 = function (v) { return Math.round(v * 10) / 10; };
      var minW = Infinity, minH = Infinity, txH = 0;
      cs.forEach(function (c) {
        var r = c.getBoundingClientRect();
        if (r.width < minW) minW = r.width;
        if (r.height < minH) minH = r.height;
        var t = c.querySelector('.rowdisc-tx');
        if (t) txH = Math.max(txH, t.getBoundingClientRect().height);
      });
      return {
        n: cs.length, w: r1(minW), h: r1(minH), textH: r1(txH),
        buttons: cs.filter(function (c) { return c.tagName === 'BUTTON'; }).length,
        wired: cs.filter(function (c) {
          return !!c.getAttribute('aria-controls') && !!c.getAttribute('aria-expanded');
        }).length,
        expanded: cs.filter(function (c) {
          return c.getAttribute('aria-expanded') === 'true';
        }).length,
        // The title the control carries, against the title of the cell it replaced: a control
        // that opened the right row under the wrong words would satisfy everything above.
        titles: cs.slice(0, 3).map(function (c) {
          var t = c.querySelector('.rowdisc-tx');
          return t ? t.textContent : '';
        })
      };
    })(),
    scopeLinks: Array.prototype.slice.call(
      document.querySelectorAll('#termnotice .term-scope a')).map(function (a) {
        return a.getAttribute('href');
      }),
    firstCells: rows.map(function (tr) {
      var td = tr.querySelector('td');
      return td ? td.textContent : '';
    }),
    gapRows: rows.filter(function (tr) { return tr.classList.contains('term-gap'); }).length,
    gapCells: rows.filter(function (tr) {
      return !!tr.querySelector('td.term-gap-cell');
    }).length,
    deliveryCounts: rows.map(function (tr) {
      var td = tr.querySelector('td.s-deliveries');
      return td ? Number(td.textContent) : null;
    }),
    groupLinks: groups.map(function (tr) {
      var a = tr.querySelector('a.linkbtn');
      return a ? a.getAttribute('href') : null;
    }).filter(Boolean),
    title: txt('#termtitle') || '',
    sub: txt('#termsub') || '',
    notice: (document.getElementById('termnotice') || {}).textContent || '',
    banner: txt('#termrows .term-banner th'),
    bannerSticky: (function () {
      var th = document.querySelector('#termrows .term-banner th');
      return th ? getComputedStyle(th).position : null;
    })(),
    heading: (document.querySelector('h1') || {}).innerText || '',

    // ---- issues 91, 93 and 110, the subtraction ------------------------------------
    // WHAT IS COUNTED IS COPIES AND NOT WORDING, which is the shape of all three cards. 91 and 93
    // took the count from six to one on the arithmetic that six statements on one screen made the
    // first weaker. 110 is the owner's instruction and takes it to zero: he asked for no text on
    // the page about the standing of the content, so the two counts this driver already had are
    // both asserted at zero and the reading is unchanged. Wording is still never read, which is
    // what lets this measurement survive a card that rewrites the copy around it.
    inventedInSheet: Array.prototype.slice.call(
      document.querySelectorAll('#term *')).filter(function (e) {
        return e.children.length === 0 && /invent/i.test(e.textContent || '');
      }).map(function (e) { return e.className + ': ' + e.textContent.trim().slice(0, 60); }),
    inventedInFooter: Array.prototype.slice.call(
      document.querySelectorAll('footer')).filter(function (e) {
        return /invent/i.test(e.textContent || '');
      }).length,
    noticeProse: Array.prototype.slice.call(
      document.querySelectorAll('#termnotice > p')).filter(function (p) {
        return !p.querySelector('button') && !p.querySelector('a');
      }).map(function (p) { return p.textContent.trim().slice(0, 60); }),
    subWarn: document.querySelectorAll('#termsub .warn').length,
    // Issue 94. Read as the left edge of the painted TEXT and not as a padding declaration, so
    // that a later change moving the indent onto a margin, a border or the cell would be caught
    // by the same assertion. The heading and the first cell of the row under it.
    headingIndent: (function () {
      var th = document.querySelector('#termrows tr.term-module th');
      var td = document.querySelector('#termrows tbody tr:not(.term-group):not(.term-module) td');
      if (!th || !td) return null;
      var s = th.querySelector('span') || th;
      return { head: Math.round(s.getBoundingClientRect().left),
               row: Math.round(td.getBoundingClientRect().left) +
                    Math.round(parseFloat(getComputedStyle(td).paddingLeft)) };
    })(),

    // Issue 113. THE LEFT EDGE OF EVERY FIRST THING ON THE SHEET, on whichever reading is up, and
    // every one of them the left edge of PAINTED TEXT for the reason issue 94 reads it that way:
    // a gutter moved onto a margin, a border or a cell would be the same defect wearing another
    // declaration. The one field here that is not text is the container's own border box, which
    // is read because the claim the two assertions make is about the distance between the
    // container and what it holds. No backtick in this comment: the driver around it is a
    // template literal and one would end the string.
    gutter: (function () {
      var box = document.getElementById('termrows');
      if (!box) return null;
      var lf = function (e) { return e ? Math.round(e.getBoundingClientRect().left) : null; };
      var th = document.querySelector('#termrows tbody tr.term-group th');
      var mth = document.querySelector('#termrows tbody tr.term-module th');
      var td = document.querySelector(
        '#termrows tbody tr:not(.term-group):not(.term-module):not(.term-agenda) td');
      var mh = document.querySelector('#termrows .cal-panel .cal-head');
      return {
        box: lf(box),
        pad: Math.round(parseFloat(getComputedStyle(box).paddingLeft)),
        title: lf(document.getElementById('termtitle')),
        // THE PAINTED TEXT AND NOT THE BOX, which is the same reading the cell below takes and for
        // the same reason: a group row whose heading is a link is measured on the link, and one
        // whose heading is its own text is measured on the row's content edge. Issue 124 is where
        // the difference showed: the review's band headings carry no link, and reading the box
        // gave 4 against the 16 every other reading on the phone paints at, which is the
        // container's padding and not a misalignment.
        group: th ? (th.querySelector('a') ? lf(th.querySelector('a'))
                     : lf(th) + Math.round(parseFloat(getComputedStyle(th).paddingLeft))) : null,
        module: mth ? lf(mth.querySelector('span') || mth) : null,
        cell: td ? lf(td) + Math.round(parseFloat(getComputedStyle(td).paddingLeft)) : null,
        month: lf(mh)
      };
    })(),

    // ---- issue 88, the two grids ------------------------------------------------
    // A grid is not a table, so none of the row readings above see it. Everything here is read
    // off what the reader can see: the panels, the warning on the face of each one, the seven
    // column headings, and every chip with the column it landed in. The chip's date comes out of
    // its own title attribute, which is the whole of a session written out, so the driver can
    // check the column against the weekday without being handed the model.
    panels: document.querySelectorAll('#termrows .cal-panel').length,
    panelHeads: Array.prototype.slice.call(
      document.querySelectorAll('#termrows .cal-panel .cal-head')).map(function (h) {
        var w = h.querySelector('.warn');
        return { text: h.textContent, warn: w ? w.textContent : null };
      }),
    calBanner: (function () {
      var p = document.querySelector('#termrows .cal-banner');
      return p ? { text: p.textContent, position: getComputedStyle(p).position } : null;
    })(),
    dows: Array.prototype.slice.call(
      document.querySelectorAll('#termrows .cal-panel:first-of-type .cal-dow')).map(function (d) {
        return d.textContent;
      }),
    chips: document.querySelectorAll('#termrows .cal-chip').length,
    gapChips: document.querySelectorAll('#termrows .cal-chip.cal-gap').length,
    cells: (function () {
      var out = [];
      Array.prototype.slice.call(document.querySelectorAll('#termrows .cal-grid'))
        .forEach(function (grid) {
          Array.prototype.slice.call(grid.querySelectorAll('.cal-day')).forEach(function (c, j) {
            out.push({
              col: j % 7,
              date: c.getAttribute('data-date'),
              inwin: c.classList.contains('cal-inwin'),
              outwin: c.classList.contains('cal-outwin'),
              off: c.classList.contains('cal-offmonth'),
              dates: Array.prototype.slice.call(c.querySelectorAll('.cal-chip')).map(function (p) {
                return String(p.getAttribute('title') || '').split(' ')[0];
              })
            });
          });
        });
      return out;
    })(),
    shapeBtns: Array.prototype.slice.call(
      document.querySelectorAll('#termnotice .shape-btn')).map(function (b) {
        var r = b.getBoundingClientRect();
        return { label: b.textContent, pressed: b.getAttribute('aria-pressed'),
                 title: b.getAttribute('title') || '', w: r.width, h: r.height };
      }),

    // ---- issue 90, the window control -------------------------------------------
    // The control is in the HEADER and not in the sheet, because the window acts on the drawing
    // as well, so it is read from there on every one of these routes.
    wn: (function () {
      var b = document.getElementById('wnbtn');
      if (!b) return null;
      var r = b.getBoundingClientRect();
      return { text: b.textContent, expanded: b.getAttribute('aria-expanded'),
               w: r.width, h: r.height };
    })(),
    wnMenu: (function () {
      var m = document.getElementById('wnmenu');
      if (!m || m.hidden) return null;
      var a = m.querySelector('.wn-anchor');
      return {
        text: m.textContent,
        // The anchor's OWN element, #128. The claim below is that this page never calls the
        // anchor today, and the only way to hold it to that is to read the thing that names the
        // anchor rather than to look for a sentence somewhere in the menu saying it does not.
        anchor: a ? a.textContent : null,
        btns: Array.prototype.slice.call(m.querySelectorAll('button')).map(function (b) {
          var r = b.getBoundingClientRect();
          return { label: b.textContent, pressed: b.getAttribute('aria-pressed'),
                   w: r.width, h: r.height };
        })
      };
    })()
  };
})()`;

// ---- what the page says about the standing of its own content, issues 110 and 115 -------------
// ROUND 6 FOUND THIS GUARD NARROWER THAN ITS NAME AND PROVED IT TWICE. What stood here read leaf
// `textContent` under `#term *` and the `footer`'s text, matched against one word stem, on the
// calendar route alone. So the exact sentence #110 deleted, put straight back into the chip's
// `title` attribute, shipped green; and a synonym in the footer's visible text shipped green
// through verify.sh. A guard that can see one channel and one word is a guard against the last
// edit rather than against the next one.
//
// THREE THINGS WIDENED, AND EACH OF THEM IS ONE OF THE TWO PROOFS. The whole document rather than
// two containers, so a statement in the header, the menus, the panel or the help box is seen.
// ATTRIBUTES as well as text, because a tooltip is read by the reader and `textContent` cannot
// see one, and because that is exactly where construction A put it. And a VOCABULARY rather than
// a stem, because the instruction was about the claim and not about a word: a page that says the
// same thing in other words has said it.
//
// SCRIPT AND STYLE ARE SKIPPED AND #/board IS NOT SWEPT, both for the same reason and it is not
// convenience. This is a rule about what the page says about ITS OWN content; a card drawn on the
// board is a repository issue whose title was written by somebody else and is quoted, and this
// suite's own board fixture is written by this file. Sweeping either would make the guard fail on
// text that is not the page's statement about itself, and a guard that cries wolf is turned off.
const STANDING_WORDS =
  /invent|fictit|fictic|ficción|ficcion|fabricat|placeholder|made up|make believe|not real|no es real|dummy|fake|falso|synthetic|simulated|imaginar/i;

const STANDING_READ = `(function () {
  var HITS = ${STANDING_WORDS.toString()};
  var ATTRS = ['title', 'aria-label', 'aria-description', 'aria-roledescription', 'alt',
               'placeholder', 'aria-placeholder', 'aria-valuetext', 'content'];
  var SKIP = { SCRIPT: 1, STYLE: 1, TEMPLATE: 1, NOSCRIPT: 1 };
  var out = [];
  function name(e) {
    var c = e.className;
    if (c && typeof c === 'object') c = c.baseVal;
    return e.nodeName.toLowerCase() + (e.id ? '#' + e.id : '') +
           (c ? '.' + String(c).split(/\\s+/)[0] : '');
  }
  function look(where, text) {
    if (text && HITS.test(text)) out.push(where + ' :: ' + String(text).trim().slice(0, 90));
  }
  Array.prototype.forEach.call(document.querySelectorAll('*'), function (e) {
    if (SKIP[e.nodeName]) return;
    if (e.children.length === 0) look(name(e) + ' text', e.textContent);
    ATTRS.forEach(function (a) {
      if (e.hasAttribute && e.hasAttribute(a)) look(name(e) + ' @' + a, e.getAttribute(a));
    });
  });
  return out;
})()`;

// Monday is 0, which is the column a day lands in on both grids. Written here rather than taken
// off the page, because a driver that asked the page which column a date belongs in would be
// asserting the page against itself.
function dowMon0(d) { return (new Date(d + 'T00:00:00Z').getUTCDay() + 6) % 7; }

function mondayOf(d) {
  const t = new Date(d + 'T00:00:00Z');
  t.setUTCDate(t.getUTCDate() - dowMon0(d));
  return t.toISOString().slice(0, 10);
}

// Two more date functions of the driver's own, for issue 124's review: the end of a window that
// starts on a Monday and runs whole weeks, and the long form the sheet writes a date in. Written
// here for the reason mondayOf above is written here, that a driver which asked the page how to
// read a date would be asserting the page against itself.
function plusDays(d, n) {
  const t = new Date(d + 'T00:00:00Z');
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

const LONG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

function longDate(d) {
  return String(Number(d.slice(8, 10))) + ' ' + LONG_MONTHS[Number(d.slice(5, 7)) - 1] + ' ' +
         d.slice(0, 4);
}

// The window menu is a disclosure and closes on a click anywhere else, exactly as the programme
// menu does, so a driver that pressed its control blind would toggle it the wrong way the moment
// something else on the page had been clicked in between. These two ask the page what state it is
// in first, which is the same discipline as reading the routes rather than constructing them.
// ---- the calendar's own sentence, recomputed here, issue 121 ------------------------------------
// A SECOND IMPLEMENTATION AND NOT A SECOND READING, which is the pattern the gap count and #115's
// layout instrument already run on. The sheet's subtitle used to be built from the unwindowed
// figures with the window bolted on as a trailing clause, so a reader who pressed "3 weeks" was
// given the date span, the state tally, the instructor gaps and the recording gaps OF THE WHOLE
// TERM over a list of eleven rows. An assertion that read that sentence and checked it against
// window.ZT.term() would have been checking one of term.js's readings against another one of
// term.js's readings and would have passed on every day of the defect's life. So this walks
// window.GI, applies the window itself, sorts the rows by the same three keys term.js sorts them
// by, and rebuilds every figure the sentence quotes. What is on the page is then the input to the
// comparison and never its answer.
//
// `from` AND `to` NULL MEANS NO WINDOW, which is how the same function answers both halves of the
// claim: the list filters to the window and the two grids keep the term and mark the band, so the
// grid's sentence is this function with no window and the list's is the same function with one.
const SENTENCE_MODEL = `(function (scopeKey, from, to) {
  var rows = [], modelTotal = 0, modelDrawn = 0;
  window.GI.views.forEach(function (v) {
    if (scopeKey && v.key !== scopeKey) return;
    var b = (v.counts || {}).CohortSession;
    // Issue 122. Both halves of the model's own declaration, because the sentence now states the
    // fraction and not only the total, and a driver that read the total alone could not tell a
    // scope that draws all of its sessions from one that draws six of seventy nine.
    if (b) { modelTotal += b.total; modelDrawn += b.drawn; }
    v.nodes.forEach(function (n) {
      if (n.type !== 'CohortSession') return;
      var p = {};
      (n.props || []).forEach(function (r) { if (p[r.k] === undefined) p[r.k] = r.v; });
      var at = String(p.scheduled_at || ''), d = at.split(' ')[0] || '';
      if (from && (!d || d < from || d > to)) return;
      rows.push({ at: at, code: v.code, id: n.id, date: d, state: p.state,
                  teacher: p.teacher_assigned, rec: p.recording_ref });
    });
  });
  rows.sort(function (a, b) {
    if (a.at !== b.at) return a.at < b.at ? -1 : 1;
    if (a.code !== b.code) return a.code < b.code ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });
  var m = {}, order = [], seen = {}, spread = 0;
  rows.forEach(function (r) {
    if (m[r.state] === undefined) { m[r.state] = 0; order.push(r.state); }
    m[r.state]++;
    if (seen[r.code] === undefined) { seen[r.code] = 1; spread++; }
  });
  return { n: rows.length, programmes: spread, modelTotal: modelTotal, modelDrawn: modelDrawn,
           complete: modelTotal > 0 && modelDrawn >= modelTotal,
           from: rows.length ? rows[0].date : '',
           to: rows.length ? rows[rows.length - 1].date : '',
           states: order.map(function (k) { return m[k] + ' ' + k; }).join(', '),
           noInstructor: rows.filter(function (r) { return r.teacher !== 'yes'; }).length,
           noRecording: rows.filter(function (r) { return !r.rec || r.rec === 'none'; }).length };
})`;

// FIGURES PULLED OUT BY PATTERN AND NEVER BY POSITION, and no sentence is ever compared whole.
// TERM_READ's own note records the rule this keeps: what is counted is copies and not wording, so
// a card that rewrites the prose around these numbers must not turn this red. Each figure is
// found by the shape of the clause that carries it, and the state tally is the one clause that is
// only digits and words, which is what tells it apart from "11 with no instructor named".
//
// ISSUE 122 SPLIT THREE OF THESE IN TWO, AND EVERY SPLIT IS A SECOND FIGURE RATHER THAN A
// REWORDING. The sample used to be a tail on the first clause, `drawn from a term the model counts
// at 260`, printed in that one shape whether the scope was a sample of the term or all of it; it
// is a clause of its own now and the complete case says so in different words, so `sampleDrawn`
// and `sampleAll` are read apart and an assertion can require the right one. The two gap figures
// carry the population they were counted over, so each has a denominator. And the heading has two
// kinds of `of` that mean different things: `11 of 83` is the window taking rows off the scope and
// `83 of the 260` is the scope against the model's own declaration, which is why they are matched
// by two patterns into two fields and never into one.
function readSentence(title, sub) {
  const parts = sub.split(' · ');
  const head = /^(\d+) sessions? across (.+?)$/.exec(parts[0]) || [];
  // `83 of the 260 sessions the model counts` against `all 25 of the sessions the model counts`.
  const samp = /(\d+) of the (\d+) sessions? the model counts/.exec(sub) || [];
  const sampAll = /all (\d+) of the sessions? the model counts/.exec(sub) || [];
  const span = parts.find(p => /^\d{4}-\d\d-\d\d to \d{4}-\d\d-\d\d$/.test(p)) || '';
  const hAll = /all (\d+) sessions? in date order/.exec(title);
  // Tried before the window's pattern and mutually exclusive with it: `of the 260` carries a word
  // between the `of` and the digits and `of 83` does not, so neither expression can match the
  // other's heading.
  const hSample = /(\d+) of the (\d+) sessions? in date order/.exec(title);
  const hWin = /(\d+) of (\d+) sessions? in date order/.exec(title);
  const hBare = /(\d+) sessions? in date order/.exec(title);
  const noInst = /(\d+) of (\d+) with no instructor named/.exec(sub) || [];
  const noRec = /(\d+) of (\d+) with no recording/.exec(sub) || [];
  const heading = hAll || hSample || hWin || hBare || [];
  return {
    n: Number(head[1]),
    across: head[2] === undefined ? null : head[2],
    // How many of the model's declared total this scope holds, and null on a complete scope, where
    // the sentence says `all` instead and there is no fraction to read.
    sampleDrawn: samp[1] === undefined ? null : Number(samp[1]),
    modelTotal: samp[2] !== undefined ? Number(samp[2])
              : sampAll[1] !== undefined ? Number(sampAll[1]) : null,
    sampleAll: sampAll[1] !== undefined,
    from: span.slice(0, 10),
    to: span.slice(-10),
    states: parts.find(p => /^\d+ [a-z]+(?:, \d+ [a-z]+)*$/.test(p)) || '',
    noInstructor: Number(noInst[1]),
    noInstructorOf: noInst[2] === undefined ? null : Number(noInst[2]),
    noRecording: Number(noRec[1]),
    noRecordingOf: noRec[2] === undefined ? null : Number(noRec[2]),
    headingN: Number(heading[1]),
    headingAll: !!hAll,
    // The window's denominator, and null wherever no window is taking rows off the list.
    headingOf: hWin && !hSample ? Number(hWin[2]) : null,
    // The model's, and null wherever the heading is the window's or the scope is complete.
    headingSample: hSample ? Number(hSample[2]) : null
  };
}

async function wnMenu(page, want) {
  if ((await page.evaluate('window.ZT.term().window.menu')) === want) return;
  await page.evaluate(`document.getElementById('wnbtn').click()`);
  await page.waitFor(`window.ZT.term().window.menu === ${want}`,
    `the window menu to be ${want ? 'open' : 'closed'}`);
}

// Press one of the buttons in the window menu by the words on it, because the words are what a
// reader presses and an index would survive the button being renamed to something else.
async function pressByText(page, sel, label) {
  const ok = await page.evaluate(`(function () {
    var bs = Array.prototype.slice.call(document.querySelectorAll(${JSON.stringify(sel)}));
    for (var i = 0; i < bs.length; i++) {
      if (bs[i].textContent.trim() === ${JSON.stringify(label)}) { bs[i].click(); return true; }
    }
    return false;
  })()`);
  if (!ok) throw new Error(`no control reading ${JSON.stringify(label)} at ${sel}`);
}

async function checkTerm(page) {
  const drawing = await page.evaluate(READ_DRAWING);
  const headingDiagram = (await page.evaluate(TERM_READ)).heading.trim();
  const session = drawing.nodes.find(n => n.type === 'Cohort session');
  const template = drawing.nodes.find(n => n.type === 'Session template');
  if (!assert('the drawing carries a cohort session and a session template to start from',
      !!session && !!template, 'one node of each type on the default view',
      `session ${session ? session.id : 'none'}, template ${template ? template.id : 'none'}`)) {
    return;
  }

  const state = await page.evaluate('window.ZT.term()');

  // THE WAY IN IS THE NODE, which is the answer both cards were filed asking for: one from a
  // cohort session wanting the calendar, one with a template selected wanting the outline. The
  // header row is where it deliberately is not, and an assertion that only checked the route
  // would pass on a sixth control in that row.
  await clickNode(page, session.id);
  await page.waitFor(
    `window.ZT.selected() && window.ZT.selected().id === ${JSON.stringify(session.id)}`,
    'the cohort session to be selected');
  const fromSession = await page.evaluate(`(function () {
    var a = document.querySelectorAll('#pmore .pmore-link');
    var h = document.querySelectorAll('#pmore .pmore-hint');
    return { href: a.length ? a[a.length - 1].getAttribute('href') : null,
             text: a.length ? a[a.length - 1].textContent : null,
             hint: h.length ? h[h.length - 1].textContent : null };
  })()`);
  // ISSUE 84 SCOPED IT, AND THAT IS THE HALF OF THE CARD THAT WAS UNCONDITIONAL. The link used to
  // go to all seven, which is what the card objected to: a reader on a Z-IB tile was handed 83
  // rows across seven syllabi. The address is read off the page's own routes list rather than
  // built here, after `#/p/Z-ZIB` cost this repository half an hour of false alarm.
  const scoped = await page.evaluate('JSON.stringify(window.ZT.termRoutes())').then(JSON.parse);
  const here = await page.evaluate('window.ZT.programme().key');
  // The counts the scoped link quotes are this drawing's and not the term's, which is the whole
  // of what the scope changed. Counted off the drawing on screen rather than off the sheet, so
  // the two are independent readings of the same claim.
  const hereSessions = drawing.nodes.filter(n => n.type === 'Cohort session').length;
  const hereTemplates = drawing.nodes.filter(n => n.type === 'Session template').length;
  assert('the panel on a cohort session offers the term, scoped to the programme on screen',
    fromSession.href === '#/calendar/' + here &&
      scoped.indexOf(fromSession.href) !== -1 &&
      Number((/all (\d+) sessions/.exec(fromSession.text || '') || [])[1]) === hereSessions &&
      hereSessions < state.sessions,
    `a link to #/calendar/${here}, one of the ${scoped.length} addresses the sheet publishes, ` +
      `reading "all ${hereSessions} sessions" and not the term's ${state.sessions}`,
    `${JSON.stringify(fromSession.href)}, ${JSON.stringify(fromSession.text)}`);
  await clearSelection(page);

  await clickNode(page, template.id);
  await page.waitFor(
    `window.ZT.selected() && window.ZT.selected().id === ${JSON.stringify(template.id)}`,
    'the session template to be selected');
  const fromTemplate = await page.evaluate(`(function () {
    var a = document.querySelectorAll('#pmore .pmore-link');
    return { href: a.length ? a[a.length - 1].getAttribute('href') : null,
             text: a.length ? a[a.length - 1].textContent : null };
  })()`);
  assert('and the panel on a session template offers the outline, scoped the same way',
    fromTemplate.href === '#/outline/' + here &&
      scoped.indexOf(fromTemplate.href) !== -1 &&
      Number((/all (\d+) session templates/.exec(fromTemplate.text || '') || [])[1]) ===
        hereTemplates && hereTemplates < state.templates,
    `a link to #/outline/${here} reading "all ${hereTemplates} session templates" and not the ` +
      `syllabus-wide ${state.templates}`,
    `${JSON.stringify(fromTemplate.href)}, ${JSON.stringify(fromTemplate.text)}`);

  // ISSUE 85, READ THE WAY ISSUE 110 LEFT IT. The two published values that had never reached a
  // property list are still the subject; what changed is where the flag is read. The panel printed
  // a badge beside every value and the owner's instruction took every badge off the page, so the
  // badge is gone and the FIELD is not: `f` still ships on all 3113 rows, check_provenance still
  // holds each one to the closed vocabulary and to its rank, and #104's rule still refuses a value
  // whose flag and rank disagree. A field a driver cannot see is a field that rots, so this reads
  // the value off the panel, which is what a reader sees, and the flag off window.GI, which is the
  // document the panel was built from. It fails in the same two directions it always did: a
  // missing row, and a row whose flag is not the one the model was built to give it.
  const tprops = await page.evaluate(`(function () {
    var out = { shown: {}, flagged: {}, badges: 0 };
    var dl = document.getElementById('pprops');
    var dts = dl.querySelectorAll('dt'), dds = dl.querySelectorAll('dd'), i;
    for (i = 0; i < dts.length; i++) {
      out.shown[dts[i].textContent] = dds[i].querySelector('b').textContent;
    }
    out.badges = dl.querySelectorAll('.flag').length;
    var sel = window.ZT.selected();
    var n = null;
    window.GI.views.forEach(function (v) {
      (v.nodes || []).forEach(function (x) { if (sel && x.id === sel.id) n = x; });
    });
    (n && n.props ? n.props : []).forEach(function (p) { out.flagged[p.k] = p.f; });
    return out;
  })()`);
  assert('a session template carries the module and the place in its syllabus, flagged real',
    tprops.flagged.module_name === 'real' && tprops.flagged.sequence === 'real' &&
      !!tprops.shown.module_name && /^\d+ of \d+$/.test(tprops.shown.sequence || '') &&
      tprops.badges === 0,
    'module_name and sequence on the panel, both carrying the flag `real` in the document and ' +
      'neither printing it',
    JSON.stringify(tprops));

  // AND THE OTHER DIRECTION, OVER ALL SIX KEYS AND EVERY ROW THAT CARRIES ONE. Issue 115's F28.
  // The assertion above is the whole of the downgrade coverage there was, and it reads two keys
  // off ONE selected template: `module_code` and `module` downgraded to `dummy` in the model
  // shipped green through every gate, because check_provenance has no rule for a real value
  // flagged dummy and, after #110, nothing renders the flag either. A downgraded row was
  // invisible in the gate AND on the page.
  //
  // SO THIS ENUMERATES RATHER THAN LISTING, which is the shape the target-size row has and the
  // reason that row is the strongest thing in this file: the six keys are walked over both lists
  // and every node in them, so a seventh row carrying one of these keys is covered without
  // anybody remembering to cover it. `absent` is allowed and `real` is allowed, because
  // build/model.py argues the symmetric rule would be false: eight module_name rows are
  // legitimately absent. What is refused is any other token, which is what a downgrade is.
  // Each key is also required to appear at least once, so a rule that stopped emitting a key
  // cannot pass this by having nothing left to judge.
  const syllabus = await page.evaluate(`(function () {
    var KEYS = ['module_name', 'sequence', 'modules', 'module_code', 'module', 'in_the_syllabus'];
    var seen = {}, bad = [], n = 0;
    KEYS.forEach(function (k) { seen[k] = 0; });
    ['views', 'collapsed'].forEach(function (which) {
      (window.GI[which] || []).forEach(function (v) {
        (v.nodes || []).forEach(function (node) {
          (node.props || []).forEach(function (p) {
            if (KEYS.indexOf(p.k) < 0) return;
            n++;
            seen[p.k]++;
            if (p.f !== 'real' && p.f !== 'absent') {
              bad.push(v.key + ' ' + node.id + ' ' + p.k + ' flagged ' + p.f);
            }
          });
        });
      });
    });
    return { keys: KEYS, seen: seen, bad: bad, n: n };
  })()`);
  assert('no row carrying a syllabus key is downgraded, over all six keys and both grains',
    syllabus.bad.length === 0 && syllabus.keys.every(k => syllabus.seen[k] > 0),
    `every one of the ${syllabus.n} rows under ${syllabus.keys.join(', ')} flagged real or ` +
      'absent, and each of the six keys present somewhere',
    `${syllabus.bad.length} downgraded ${JSON.stringify(syllabus.bad.slice(0, 6))}, ` +
      `counts ${JSON.stringify(syllabus.seen)}`);
  await clearSelection(page);

  // ---- the calendar reading ---------------------------------------------------
  // WHAT THE WINDOW IS BEFORE ANYTHING HAS ASKED FOR ONE, read here, on the diagram, and asserted
  // two hundred lines below where the window section is. Issue 124 moved the place this has to be
  // read: #/calendar opens on the review now, which is three weeks from the anchor, so the sheet
  // IS something that asks and the claim that nothing has asked yet is a claim about the page the
  // reader is looking at before they follow that link. The review's own arrival is asserted in a
  // phase of its own, on a cold load, in both directions.
  const atDiagram = await page.evaluate(TERM_READ);
  const w0 = await page.evaluate('window.ZT.term().window');
  const off0 = await page.evaluate('window.ZT.filtered()');

  await page.evaluate(`location.hash = '#/calendar'`);
  await page.waitFor(`window.ZT.term().open === true &&
                      window.ZT.term().reading === 'calendar'`,
    'the calendar reading to open');
  // ISSUE 124, AND IT IS A NAVIGATION AND NOT A CONCESSION. The address arrives on the review at
  // three weeks; everything in this phase is about the three shapes of the whole term and the
  // sentence over them, which is a different reading of the same rows. So the window is put back
  // off through the control a reader would use and the month grid is pressed, and every assertion
  // below reads exactly what it read before. Nothing here is weaker: what the address opens on is
  // asserted, cold, in `the review`, and this is the same suite driving to the state it is about.
  await wnMenu(page, true);
  await pressByText(page, '#wnmenu .wn-weeks', 'whole term');
  await page.waitFor('window.ZT.term().window.on === false', 'the window off for the shapes');
  await wnMenu(page, false);
  await pressByText(page, '#termnotice .shape-btn', 'month');
  await page.waitFor(`window.ZT.term().shape === 'month'`, 'the month grid');

  // ---- the shape of it, issue 88 ------------------------------------------------
  // THE MONTH GRID, measured over the 83 sessions: the months hold 16, 20, 17, 9, 8 and 13, so
  // six panels of 8 to 20 fit and the April and May gaps are the reading. Everything below is
  // checked against the chips the reader can see and the dates written on their own faces, not
  // against the model behind them.
  const calMonth = await page.evaluate(TERM_READ);
  const monthState = await page.evaluate('window.ZT.term()');
  const chipDates = calMonth.cells.reduce((a, c) => a.concat(c.dates), []);
  const monthKeys = new Set(chipDates.map(d => d.slice(0, 7)));
  assert('the month grid draws one panel per month the term touches',
    monthState.shape === 'month' && monthState.panels === calMonth.panels &&
      calMonth.panels === monthKeys.size && calMonth.panels > 1 &&
      calMonth.chips === state.sessions &&
      calMonth.dows.join(' ') === 'Mon Tue Wed Thu Fri Sat Sun',
    `${monthKeys.size} month panels under Mon to Sun columns, holding all ${state.sessions} ` +
      'sessions as chips',
    `shape ${monthState.shape}, ${calMonth.panels} panels, ${calMonth.chips} chips, ` +
      `columns ${JSON.stringify(calMonth.dows)}`);

  // ISSUES 91 AND 93 REVERSED THIS ASSERTION AND IT IS THE SAME CLAIM READ THE OTHER WAY. It used
  // to say every month panel carried the invented warning on its own face, so that a crop of one
  // month took the disclaimer with it. Seven panels meant seven copies of a sentence the page
  // already made five other times, and he asked twice for the marks to go. What is asserted now
  // is what the subtraction decided: the grid carries none of its own, neither on the panels nor
  // on the banner that stood over them, and the panels are still all there.
  assert('the month grid carries no disclaimer of its own, on the panels or over them',
    calMonth.panelHeads.length === calMonth.panels && calMonth.panels > 1 &&
      calMonth.panelHeads.every(h => h.warn === null) &&
      calMonth.calBanner === null,
    `${calMonth.panels} panel headings, none of them warning, and no banner over the grid`,
    `${calMonth.panelHeads.filter(h => h.warn !== null).length} of ` +
      `${calMonth.panels} still warn, banner ${JSON.stringify(calMonth.calBanner)}`);

  // THE WEEKDAY SHAPE IS THE THING A GRID SHOWS AND A LIST CANNOT, weekend sessions included, so
  // the assertion is that every chip is in the column its own date falls in and that the two
  // weekend columns are not empty.
  const misplaced = calMonth.cells.filter(
    c => dowMon0(c.date) !== c.col || c.dates.some(d => d !== c.date)).length;
  const weekend = chipDates.filter(d => dowMon0(d) > 4).length;
  assert('every session sits in the weekday column its date falls on, weekends included',
    misplaced === 0 && weekend > 0 && chipDates.length === state.sessions,
    `all ${state.sessions} chips in the right column, ${weekend} of them at a weekend`,
    `${misplaced} cells in the wrong column or holding another day, ${weekend} at a weekend`);

  // The gaps are the reason an operator opens a calendar, and they are marked in every shape or
  // they are marked in none: a grid that dropped the mark would look complete and be quieter
  // about the same term.
  assert('a session with nobody to teach it is marked on the grid too',
    calMonth.gapChips === state.noInstructor && state.noInstructor > 0,
    `${state.noInstructor} chips marked`, `${calMonth.gapChips} chips marked`);

  // ---- the week grid, built because it was asked for and kept honest ------------
  await pressByText(page, '#termnotice .shape-btn', 'week');
  await page.waitFor(`window.ZT.term().shape === 'week'`, 'the week grid');
  const calWeek = await page.evaluate(TERM_READ);
  const weekChips = calWeek.cells.reduce((a, c) => a.concat(c.dates), []);
  const weekKeys = new Set(weekChips.map(mondayOf));
  assert('the week grid draws one panel per week that holds a session, and each is seven days',
    calWeek.panels === weekKeys.size && calWeek.panels > 1 &&
      calWeek.cells.length === calWeek.panels * 7 &&
      calWeek.chips === state.sessions &&
      calWeek.cells.filter(c => dowMon0(c.date) !== c.col ||
                                c.dates.some(d => d !== c.date)).length === 0,
    `${weekKeys.size} week panels of 7 days each, holding all ${state.sessions} sessions`,
    `${calWeek.panels} panels, ${calWeek.cells.length} day cells, ${calWeek.chips} chips`);

  // WHAT EACH SHAPE IS FOR IS ON THE CONTROL AND NO LONGER IN A PARAGRAPH OVER THE ROWS. Issue 88
  // wrote one per shape, saying what that shape made visible about this term; issue 93 called the
  // strip too verbose and it was, at 213 words over 34 rows. The paragraphs went and the buttons
  // kept the titles they already had, which is the pattern issue 79 used on the zoom readout and
  // the programme button. Asserted in both directions, because deleting a paragraph and leaving
  // nothing in its place is the failure mode of a subtraction pass: three distinct non-empty
  // titles, and no prose left in the strip.
  assert('each calendar shape says what it is on its own control and not over the rows',
    calWeek.shapeBtns.length === 4 &&
      calWeek.shapeBtns.every(b => b.title.length > 10) &&
      new Set(calWeek.shapeBtns.map(b => b.title)).size === 4 &&
      calWeek.noticeProse.length === 0,
    'four shape buttons carrying four different titles, over a strip with no prose in it',
    `titles ${JSON.stringify(calWeek.shapeBtns.map(b => b.title.slice(0, 24)))}, ` +
      `${calWeek.noticeProse.length} paragraphs left: ${JSON.stringify(calWeek.noticeProse)}`);

  // ---- the list, which is the shape every assertion below was written against ----
  await pressByText(page, '#termnotice .shape-btn', 'list');
  await page.waitFor(`window.ZT.term().shape === 'list'`, 'the list shape');
  const cal = await page.evaluate(TERM_READ);

  assert('#/calendar opens the term on its calendar reading',
    cal.rows > 0 && /in date order/.test(cal.title),
    'a sheet of rows headed "in date order"', `${cal.rows} rows, heading ${JSON.stringify(cal.title)}`);
  assert('it draws one row for every session it says it holds',
    cal.rows === state.sessions, `${state.sessions} rows`, `${cal.rows} rows`);

  // The ordering is the whole of #80's request, and it is the one property of this reading that a
  // later change could undo with nothing else going red. Read off the rendered date cells rather
  // than off the data behind them.
  const dates = cal.firstCells;
  const outOfOrder = dates.filter((d, i) => i > 0 && d < dates[i - 1]).length;
  assert('and they are in date order, across all seven programmes',
    outOfOrder === 0 && dates[0] === state.from && dates[dates.length - 1] === state.to,
    `no row earlier than the row above it, running ${state.from} to ${state.to}`,
    `${outOfOrder} out of order, running ${dates[0]} to ${dates[dates.length - 1]}`);

  // ISSUE 83'S RULE, APPLIED TO A ROUTE. A lane that draws a sample says so; a sheet of 83 rows
  // that did not would read as a term. The total is the model's own, so the sheet cannot claim to
  // be complete while it is not.
  //
  // ISSUE 122 PUT THE HEADING UNDER THE SAME CLAIM AND MADE THE CLAUSE ITS OWN. The subtitle used
  // to close its first clause with `drawn from a term the model counts at 260`; the sample is a
  // clause of its own now and the heading carries the fraction as well, so the reading a manager
  // takes off the sheet without scrolling has it. Both are required here, and the recomputation is
  // the driver's own: `state` is the page's bookkeeping and would agree with itself.
  const calSaid = readSentence(cal.title, cal.sub);
  const calModel = await page.evaluate(`${SENTENCE_MODEL}(null, null, null)`);
  assert('the sheet declares the sample it drew rather than reading as the whole term',
    calModel.modelTotal > calModel.n && calModel.complete === false &&
      cal.sub.indexOf(String(calModel.n)) === 0 &&
      calSaid.sampleDrawn === calModel.modelDrawn &&
      calSaid.modelTotal === calModel.modelTotal && calSaid.sampleAll === false &&
      calSaid.headingN === calModel.n && calSaid.headingSample === calModel.modelTotal,
    `a heading and a subtitle both saying ${calModel.modelDrawn} of the ${calModel.modelTotal}, ` +
      'recomputed off window.GI in this driver',
    `heading ${JSON.stringify(cal.title)}, subtitle ${JSON.stringify(cal.sub.slice(0, 160))}`);

  // The gaps, which are the only reason an operator opens a calendar. Counted twice on the page,
  // once in the subtitle and once as a mark on each row, and the two have to agree. Issue 122 gave
  // the figure the population it was counted over, so the pattern reads both numbers: an
  // expression matching one digit would have read the denominator here and passed.
  const statedGaps = Number((/(\d+) of \d+ with no instructor named/.exec(cal.sub) || [])[1]);
  assert('the sessions with nobody to teach them are marked on the rows, not only counted',
    state.noInstructor > 0 && cal.gapRows === state.noInstructor &&
      cal.gapCells === state.noInstructor && statedGaps === state.noInstructor,
    `${state.noInstructor} rows marked, and the subtitle saying so`,
    `${cal.gapRows} rows marked, ${cal.gapCells} cells marked, subtitle says ${statedGaps}`);

  // ISSUES 91 AND 93, AND BOTH OF THESE ARE THE OLD ASSERTION TURNED AROUND. The first used to
  // require a notice reading "not a schedule" above the rows and a sticky banner row inside the
  // table; the second required the fragmentation finding in the same strip. He asked twice for
  // the marks to go, so what the sheet must now NOT have is what is asserted, and the banner is
  // the same element issue 92 was filed against: it is transparent and rows scroll through it,
  // which is why deleting it closed that card instead of repairing it.
  assert('the calendar list carries no banner row, no notice and no chip of its own',
    cal.banner === null && cal.bannerSticky === null &&
      cal.noticeProse.length === 0 && cal.subWarn === 0,
    'no banner row in the table head, no prose in the strip and no chip in the subtitle',
    `banner ${JSON.stringify(cal.banner)} (${cal.bannerSticky}), ` +
      `${cal.noticeProse.length} paragraphs ${JSON.stringify(cal.noticeProse)}, ` +
      `${cal.subWarn} subtitle chips`);

  // THE COUNT, AND IT IS ZERO NOW. Issues 91 and 93 took six statements about the standing of the
  // content down to one, the footer's, and left this assertion reading the count rather than the
  // sentence. Issue 110 is the owner withdrawing the last one: "I don't want absolutely any text
  // or comment about the content not being real or truthful or whatever." So the same measurement
  // is made and the expected number moved by one, which is the only change a subtraction of a
  // sentence should make to a driver that never read it. The assertion is NOT dropped: the
  // instruction was absolute, one copy left anywhere is the failure it names, and an unasserted
  // absence is one card away from coming back as a repair. This also settles issue 101, which was
  // open on the footer claiming everything is invented while nearly half the shipped values are
  // flagged as read off a real system. A page that says nothing about its own truthfulness cannot
  // say something wrong about it.
  //
  // AND "ANYWHERE" NOW MEANS ANYWHERE, which is issue 115's F26. The reading is the sweep above,
  // over the whole document including its attributes, on every address the page publishes rather
  // than on the calendar alone. The two old counts are kept in the same assertion because they
  // are the same claim read in the place the last card made it, and losing them would be trading
  // one narrow reading for another.
  //
  // AND EVERY SHAPE OF EVERY ADDRESS, NOT EVERY ADDRESS. Found while proving this: the guard as
  // first widened still missed the attribute channel, because a calendar drawn as a LIST has no
  // chips in it and the chip's tooltip is where the deleted sentence lived. A reading has three
  // shapes and the sheet remembers which one the reader last chose, so a sweep that visits every
  // address in whichever shape it happens to be in has swept one third of the sheet. Each shape
  // control is pressed and the document is read again. The outline routes are also swept with
  // every row disclosed, since a block that is not open is not in the document at all.
  const standing = [];
  const standingRoutes = ['#/', '#/students'].concat(
    JSON.parse(await page.evaluate('JSON.stringify(window.ZT.termRoutes())')));
  for (const at of standingRoutes) {
    const stops = [at].concat(/^#\/outline/.test(at) ? [at + '?open=all'] : []);
    for (const stop of stops) {
      await page.evaluate(`location.hash = ${JSON.stringify(stop)}`);
      await sleep(90);
      // The control offers the shapes the sheet is NOT in, so the list changes under every
      // press. Read again after each one and stop when nothing unpressed is left.
      const offered = `(function () {
        return JSON.stringify(Array.prototype.map.call(
          document.querySelectorAll('#termnotice .shape-btn'),
          function (b) { return b.textContent; }));
      })()`;
      const pressed = new Set();
      // ONE TURN PER SHAPE PLUS THE READ THAT FINDS NOTHING LEFT, and it was exactly 5 while there
      // were three shapes, which is a budget that stops sweeping the moment a card adds one. Issue
      // 124 added the fourth and this is the same bound written so it cannot bind: the loop already
      // leaves as soon as every shape has been pressed.
      for (let turn = 0; turn < 12; turn++) {
        const hits = await page.evaluate(STANDING_READ);
        hits.forEach(h => standing.push(stop + '  ' + h));
        const next = JSON.parse(await page.evaluate(offered)).filter(s => !pressed.has(s));
        if (!next.length) break;
        pressed.add(next[0]);
        await pressByText(page, '#termnotice .shape-btn', next[0]);
        await sleep(80);
      }
    }
  }
  await page.evaluate(`location.hash = '#/calendar'`);
  await page.waitFor(`window.ZT.term().open === true &&
                      window.ZT.term().reading === 'calendar'`,
    'the calendar reading to come back after the sweep');

  assert('no statement anywhere on the page about the standing of the content',
    standing.length === 0 && cal.inventedInSheet.length === 0 && cal.inventedInFooter === 0,
    `nothing matching ${STANDING_WORDS} in the text or the attributes of any element, on any ` +
      `of the ${standingRoutes.length} addresses the page publishes, in every shape each of ` +
      'them offers',
    `${standing.length} on the sweep ${JSON.stringify(standing.slice(0, 6))}, ` +
      `${cal.inventedInSheet.length} in the sheet ${JSON.stringify(cal.inventedInSheet)}, ` +
      `${cal.inventedInFooter} in the footer`);

  // ---- the time window, issue 90 -------------------------------------------------
  // THE CARD NAMED A MEETING: "checking the next 1-3 weeks to discuss with the team". Everything
  // here is about the one thing that had to be decided before any of it could be built, which is
  // where `now` comes from on a page whose every date is invented and whose term ended before the
  // real clock reached it.
  // `atDiagram`, `w0` and `off0` were read at the top of this phase, on the diagram, before the
  // sheet was opened. Issue 124 is why: the review arms three weeks when it is what you opened, so
  // the state of a page nobody has asked anything of is read where nobody has asked anything of
  // it. The claim is #90's and is unchanged, that this page does not quietly invent a today and
  // does not window itself until something asks.
  assert('the window is off where nothing has asked for one, and the header says so in whole weeks',
    w0.on === false && w0.weeks === 0 && atDiagram.wn &&
      // `weeks all 24` and not `weeks: all 24` since issue 120. The colon went when the control
      // stopped being a nav item and became a reading in the header's readout: the label is
      // markup and the value is written by term.js, and the two are told apart by weight and
      // colour rather than by punctuation. The claim is the same claim, which is that the window
      // is off on arrival and that the control says so in whole weeks.
      atDiagram.wn.text === 'weeks all ' + w0.termWeeks && w0.termWeeks > 1 &&
      off0.on === false && off0.hidden.length === 0,
    `a control reading "weeks all ${w0.termWeeks}" and nothing taken off the drawing`,
    `${JSON.stringify(atDiagram.wn && atDiagram.wn.text)}, window on ${w0.on}, ` +
      `${off0.hidden.length} tiles filtered out`);

  await wnMenu(page, true);
  const wnOpen = await page.evaluate(TERM_READ);
  // THE ANCHOR MUST BE VISIBLE AND MUST NOT BE CALLED TODAY. A management tool that quietly
  // invents a today is worse than one that shows nothing, so the control leads with the reader's
  // real date, states how many sessions are on or after it, and only then offers the anchor. The
  // count is recomputed here off the dates the reader can read rather than taken from the page.
  const afterToday = chipDates.filter(d => d >= w0.today).length;
  const menuText = (wnOpen.wnMenu || { text: '' }).text.replace(/\s+/g, ' ');
  assert('the control says where now comes from, and does not call the anchor today',
    !!wnOpen.wnMenu && menuText.indexOf('this page has no today') !== -1 &&
      menuText.indexOf(w0.today) !== -1 && w0.afterToday === afterToday &&
      menuText.indexOf(afterToday + ' of the ' + w0.sessions + ' sessions are on or after ' +
        'today') !== -1 &&
      // RE-CUT AT #128, AND ONTO THE ELEMENT RATHER THAN ONTO A SENTENCE. What stood here
      // required the menu to contain the words "which is not today and is not pretending to
      // be", so the page said it did not call the anchor today and the driver checked that it
      // had said so. That sentence passes just as well on a page that says it AND labels the
      // anchor `today`. #128 deleted the sentence, and the claim is now read off the two
      // places the word can occur: the anchor row is a date and nothing else, and the word
      // `today` occurs in the menu exactly twice, in the warning chip and in the clause about
      // the reader's own clock. A third occurrence anywhere fails, which is the defect the old
      // conjunct could not see.
      (wnOpen.wnMenu.anchor || '') === 'Monday ' + longDate(w0.anchor) &&
      (menuText.match(/today/g) || []).length === 2 &&
      w0.anchor >= w0.firstMonday && w0.anchor <= w0.lastMonday,
    `the reader's own date ${w0.today}, ${afterToday} sessions on or after it, an anchor row ` +
      `reading "Monday ${longDate(w0.anchor)}" and the word today nowhere but in the clause ` +
      `about the clock, with the anchor between ${w0.firstMonday} and ${w0.lastMonday}`,
    `anchor ${w0.anchor} labelled ${JSON.stringify(wnOpen.wnMenu.anchor)}, page says ` +
      `${w0.afterToday} after today, "today" x${(menuText.match(/today/g) || []).length}, text ` +
      JSON.stringify(menuText.slice(0, 150)));

  // #77's rule reaches the newest controls on the page or it has stopped being a rule.
  const wnBtns = (wnOpen.wnMenu || { btns: [] }).btns;
  const smallest = wnBtns.concat([wnOpen.wn]).concat(cal.shapeBtns)
    .reduce((m, b) => Math.min(m, b.w, b.h), Infinity);
  assert('every control the two cards added clears 24 by 24',
    wnBtns.length >= 6 && cal.shapeBtns.length === 4 && smallest >= 24,
    `${wnBtns.length + 1 + cal.shapeBtns.length} controls, the smallest side at least 24`,
    `smallest side ${Number(smallest).toFixed(2)} over ${wnBtns.length} window controls, ` +
      `the header button and ${cal.shapeBtns.length} shape controls`);

  await pressByText(page, '#wnmenu .wn-weeks', '3 weeks');
  await page.waitFor('window.ZT.term().window.weeks === 3', 'a three week window');
  const w3 = await page.evaluate('window.ZT.term().window');
  const listWin = await page.evaluate(TERM_READ);
  const inWindow = chipDates.filter(d => d >= w3.from && d <= w3.to).length;
  // A LIST FILTERS, BECAUSE A LIST IS AN AGENDA. Ten rows is something a team reads in a meeting
  // and 83 is a document nobody opens, which is the whole of what the card asked for.
  //
  // ISSUE 121 MOVED ONE CONJUNCT AND IT IS A STRENGTHENING. This used to end by looking for
  // `11 of them inside the window` in the subtitle, which was the trailing clause that card
  // deleted: the eleven were true and every other figure in that sentence was the term's. What is
  // read here instead is the HEADING, which now names the same two numbers the rows are, and the
  // sentence itself is the subject of the two assertions below, against a recomputation rather
  // than against its own arithmetic.
  assert('a three week window cuts the list down to an agenda',
    listWin.rows === w3.shown && listWin.rows === inWindow && listWin.rows > 0 &&
      listWin.rows < state.sessions &&
      listWin.wn.text === 'weeks 3 of ' + w3.termWeeks &&
      listWin.title.indexOf(w3.shown + ' of ' + state.sessions + ' sessions in date order') !== -1,
    `${inWindow} rows for ${w3.from} to ${w3.to}, out of ${state.sessions}`,
    `${listWin.rows} rows, the page says ${w3.shown}, control ` +
      JSON.stringify(listWin.wn.text) + ', heading ' + JSON.stringify(listWin.title));

  // ---- THE SENTENCE, WHICH IS ISSUE 121 ------------------------------------------
  // THE DEFECT WAS NOT THAT A NUMBER WAS MISSING, IT WAS THAT SEVEN OF THEM WERE THE TERM'S. Over
  // an agenda of eleven rows the subtitle read "83 sessions across 7 programmes ... 2026-01-12 to
  // 2026-06-28 ... 11 with no instructor named ... 83 with no recording", every figure of it about
  // the whole term, and closed with the one true clause, "11 of them inside the window". A manager
  // who pressed "3 weeks" to find out who is missing an instructor in those three weeks was told a
  // number about six months. Nothing on the page contradicted it and no assertion could: the
  // window was on the sentence, so a driver reading the sentence saw a window in it.
  //
  // SO EVERY FIGURE IS CHECKED AGAINST SENTENCE_MODEL, which walks window.GI and applies the same
  // window, and the row carries a second claim beside the first: that the term's own answer to
  // each of these questions is a DIFFERENT answer. Without that second half this assertion would
  // still pass on the defect the moment a rebuild made the window's figures and the term's
  // coincide, which is the way a regression net rots quietly rather than loudly.
  const winModel = await page.evaluate(`${SENTENCE_MODEL}(null, ${JSON.stringify(w3.from)}, ` +
    `${JSON.stringify(w3.to)})`);
  const termModel = await page.evaluate(`${SENTENCE_MODEL}(null, null, null)`);
  const winSaid = readSentence(listWin.title, listWin.sub);
  const apart = ['n', 'from', 'to', 'states', 'noInstructor', 'noRecording', 'programmes']
    .filter(k => winModel[k] !== termModel[k]);
  assertEqual('and the sentence over it is arithmetic over the rows it filtered to, not over the term',
    { rows: listWin.rows, n: winSaid.n,
      programmes: Number((/^(\d+) programmes?$/.exec(winSaid.across) || [])[1]),
      modelTotal: winSaid.modelTotal, from: winSaid.from, to: winSaid.to, states: winSaid.states,
      noInstructor: winSaid.noInstructor, noRecording: winSaid.noRecording,
      // Issue 122. The two gap figures are over the rows the list filtered to and say so, and the
      // sample clause is over the scope and is the one figure in this sentence a window must NOT
      // move: eleven rows of a three week window are still eleven rows of a document that holds 83
      // of the term's 260.
      noInstructorOf: winSaid.noInstructorOf, noRecordingOf: winSaid.noRecordingOf,
      sampleDrawn: winSaid.sampleDrawn, sampleAll: winSaid.sampleAll,
      headingN: winSaid.headingN, headingOf: winSaid.headingOf,
      headingSample: winSaid.headingSample,
      andTheTermWouldSayOtherwiseAbout: apart.length },
    { rows: winModel.n, n: winModel.n, programmes: winModel.programmes,
      modelTotal: winModel.modelTotal, from: winModel.from, to: winModel.to,
      states: winModel.states, noInstructor: winModel.noInstructor,
      noRecording: winModel.noRecording,
      noInstructorOf: winModel.n, noRecordingOf: winModel.n,
      sampleDrawn: termModel.modelDrawn, sampleAll: false,
      headingN: winModel.n, headingOf: termModel.n, headingSample: null,
      andTheTermWouldSayOtherwiseAbout:
        apart.length || 'every figure matches the term, so this row proves nothing' },
    `recomputed off window.GI for ${w3.from} to ${w3.to}, where the term says ` +
      JSON.stringify({ n: termModel.n, from: termModel.from, to: termModel.to,
                       noInstructor: termModel.noInstructor }));

  await pressByText(page, '#termnotice .shape-btn', 'month');
  await page.waitFor(`window.ZT.term().shape === 'month'`, 'the month grid back');
  const gridWin = await page.evaluate(TERM_READ);
  // AND A GRID MARKS INSTEAD OF FILTERING, which is the other half of the same decision: a grid
  // exists to show the shape of the whole term and a grid with holes cut in it shows nothing.
  // Counted over DISTINCT days, because two adjacent month panels overlap at the boundary by
  // construction: a panel is whole weeks, so the same date can be drawn twice and a raw cell
  // count would report more than the twenty one days a three week window has.
  const litDays = new Set(gridWin.cells.filter(c => c.inwin).map(c => c.date));
  const wrongMark = gridWin.cells.filter(
    c => c.inwin !== (c.date >= w3.from && c.date <= w3.to) || c.inwin === c.outwin).length;
  assert('and the month grid keeps every session and marks the band instead',
    gridWin.chips === state.sessions && gridWin.panels === calMonth.panels &&
      litDays.size === 21 && wrongMark === 0,
    `all ${state.sessions} chips still drawn over ${calMonth.panels} panels, with the 21 days ` +
      `of ${w3.from} to ${w3.to} lit and every other day dimmed`,
    `${gridWin.chips} chips, ${gridWin.panels} panels, ${litDays.size} distinct days lit, ` +
      `${wrongMark} cells marked against their own date`);

  // ---- AND THE OTHER DIRECTION OF ISSUE 121, WHICH IS THE HALF A NAIVE FIX WOULD BREAK --------
  // THE RULE IS THAT THE SENTENCE DESCRIBES WHAT THE SHEET DREW, NOT THAT IT FOLLOWS THE WINDOW.
  // The window is still on and the shape is a grid, and a grid keeps every session and marks the
  // band, which the assertion above has just proved of the chips. So the figures here are the
  // TERM'S, recomputed with no window at all, and the window is the trailing clause it has been
  // since #90 because that is the only thing about it that is true of this picture. A change that
  // made the sentence follow the window everywhere would read correctly on the list and would put
  // "11 sessions across 6 programmes" over eighty three drawn chips, which is the same defect this
  // card removed, pointing the other way. Asserted with the same recomputation and the same
  // second claim: that the windowed answer differs, so a page ignoring the shape cannot pass.
  const gridSaid = readSentence(gridWin.title, gridWin.sub);
  const inClause = Number((/(\d+) of them inside the window/.exec(gridWin.sub) || [])[1]);
  assertEqual('and the sentence over the grid is the term\'s, because the grid still draws the term',
    { chips: gridWin.chips, n: gridSaid.n,
      programmes: Number((/^(\d+) programmes?$/.exec(gridSaid.across) || [])[1]),
      from: gridSaid.from, to: gridSaid.to, states: gridSaid.states,
      noInstructor: gridSaid.noInstructor, noRecording: gridSaid.noRecording,
      noInstructorOf: gridSaid.noInstructorOf, noRecordingOf: gridSaid.noRecordingOf,
      sampleDrawn: gridSaid.sampleDrawn, sampleAll: gridSaid.sampleAll,
      // Issue 122. No window is taking rows off this picture, so the heading's `of` is the
      // model's declaration and not the window's, and the two are read into two fields: a heading
      // that printed `83 of 83` under a three week window would satisfy neither.
      headingN: gridSaid.headingN, headingOf: gridSaid.headingOf,
      headingSample: gridSaid.headingSample, insideTheWindow: inClause,
      andTheWindowWouldSayOtherwiseAbout: apart.length },
    { chips: termModel.n, n: termModel.n, programmes: termModel.programmes,
      from: termModel.from, to: termModel.to, states: termModel.states,
      noInstructor: termModel.noInstructor, noRecording: termModel.noRecording,
      noInstructorOf: termModel.n, noRecordingOf: termModel.n,
      sampleDrawn: termModel.modelDrawn, sampleAll: false,
      headingN: termModel.n, headingOf: null, headingSample: termModel.modelTotal,
      insideTheWindow: winModel.n,
      andTheWindowWouldSayOtherwiseAbout:
        apart.length || 'every figure matches the window, so this row proves nothing' },
    `recomputed off window.GI with no window, against a grid that is drawing all of it under a ` +
      `${w3.weeks} week window`);

  // ---- the outline reading ----------------------------------------------------
  // The window is still on here on purpose: a reader who set one and switched reading would
  // otherwise meet a full outline under a header control saying three weeks, with nothing on the
  // page accounting for the difference.
  await page.evaluate(`location.hash = '#/outline'`);
  await page.waitFor(`window.ZT.term().reading === 'outline'`, 'the outline with a window set');
  const outWin = await page.evaluate(TERM_READ);
  assert('the outline says the window is off that reading rather than ignoring it',
    /The window is off this reading/.test(outWin.notice) &&
      /a syllabus has no date to filter on/.test(outWin.notice) &&
      outWin.rows === state.templates,
    'the notice saying the window does not apply, over the full outline',
    `${outWin.rows} rows, notice ${JSON.stringify(outWin.notice.slice(-200))}`);

  await wnMenu(page, true);
  await pressByText(page, '#wnmenu .wn-weeks', 'whole term');
  await page.waitFor('window.ZT.term().window.on === false', 'the window off again');
  await wnMenu(page, false);
  await page.evaluate(`location.hash = '#/calendar'`);
  await page.waitFor(`window.ZT.term().reading === 'calendar'`, 'the calendar back');
  await pressByText(page, '#termnotice .shape-btn', 'list');
  await page.waitFor(`window.ZT.term().shape === 'list'`, 'the list shape back');

  // ---- the outline reading ----------------------------------------------------
  await page.evaluate(`location.hash = '#/outline'`);
  await page.waitFor(`window.ZT.term().reading === 'outline'`, 'the outline reading to open');
  const out = await page.evaluate(TERM_READ);

  assert('#/outline is the same sheet read the other way, one row per template',
    out.rows === state.templates && /in curriculum order/.test(out.title),
    `${state.templates} rows headed "in curriculum order"`,
    `${out.rows} rows, heading ${JSON.stringify(out.title)}`);

  // ISSUE 85, AND IT IS THE THING THAT MAKES THE OUTLINE READABLE. A flat list of 79 rows is
  // unreadable and the module grouping is the fix. Asserted against the page's own count of the
  // module headings it drew, and against the rows being INSIDE them: a grouping that drew the
  // headings and left the rows flat would look right in a screenshot.
  const outState = await page.evaluate('window.ZT.term()');
  assert('the outline is grouped by the module each syllabus declares',
    out.modules === outState.modules && out.modules > 0 &&
      out.modules < out.rows && out.groups === state.programmes,
    `${outState.modules} module headings under ${state.programmes} programme headings`,
    `${out.modules} module headings, ${out.groups} programme headings, ${out.rows} rows`);

  // Z-CFA IS A FINDING AND NOT A BLANK. Its syllabus names no module on any of its 45 rows, and
  // the drawing says so where the modules would be rather than showing nothing. The same shape
  // covers Z-HR and Z-PE, whose syllabi name a module on some rows and not others.
  //
  // ISSUE 93 TOOK THE FOURTH CONJUNCT OFF THIS ONE AND CHANGED NOTHING ELSE. It also required a
  // paragraph above the rows saying the module structure is not the same object on every
  // programme, and that paragraph is the exact element he filed 93 against. The finding it stated
  // is still ON the page and is still asserted, in the headings themselves, which is where a
  // finding about the headings belongs; the sentence describing them was the copy of it a reader
  // had to get through first.
  assert('a syllabus that names no module says so where the module heading goes',
    out.noModuleGroups > 0 && out.modules > out.noModuleGroups &&
      out.noModuleNames.every(t => /no module recorded in the syllabus/.test(t)),
    'headings of both kinds, the absent ones saying no module is recorded',
    `${out.noModuleGroups} of ${out.modules} headings are the absence: ` +
      JSON.stringify(out.noModuleNames.slice(0, 2)));

  // ISSUE 82'S SECOND FINDING, AND THE LIMIT ON IT. One to one is what a drawing of one cohort can
  // produce and is not evidence about Zrive. What is asserted here is that the page states it as
  // a property of the drawing, and that the sheet's own arithmetic agrees with the rows.
  const delivered = out.deliveryCounts.filter(n => n === 1).length;
  assert('every template names exactly one delivery, and the page has counted them',
    state.maxDeliveries === 1 && delivered === state.templates,
    `${state.templates} rows each carrying 1 delivery`,
    `${delivered} rows carrying 1, the page reports a maximum of ${state.maxDeliveries}`);
  // ISSUE 94, AND IT TAKES THE SLOT THE ONE-TO-ONE PARAGRAPH HELD. That paragraph said the one to
  // one was a property of a drawing of one cohort rather than a finding about the business, and
  // issue 93 deleted it with the other five; the limit it stated is in this file and in the
  // CHANGELOG, and the arithmetic it described is still asserted, immediately above.
  //
  // WHAT REPLACES IT IS THE DEFECT HE FILED AGAINST THE SAME TABLE. A module heading sat at
  // `padding-left: 26px` over rows whose cells are at 10, so the heading was painted 16px to the
  // RIGHT of every row it heads and read as a stray gap. Measured as the left edge of the painted
  // text on both, not as a padding declaration, so moving the indent onto a margin or a border
  // would fail the same assertion. Equal, not merely closer: a heading is at or left of its own
  // children or the indent is saying the opposite of what an indent says.
  assert('a module heading is never painted right of the rows it heads',
    !!out.headingIndent && out.headingIndent.head === out.headingIndent.row,
    'the heading text and the row text starting at the same x',
    JSON.stringify(out.headingIndent));

  // ---- issue 113, the gutter --------------------------------------------------
  // MEASURED AT 1536x839 BEFORE THE CARD AND IT WAS NOT A MISALIGNMENT BETWEEN TWO THINGS. The
  // container, the outline's group heading, the outline's data cell and the calendar's month
  // heading all had a box at left 219 with `padding-left: 0px` on the container: the painted text
  // was at 229 on the three table readings and at 219 on the month heading, which has no padding
  // of its own. So the sheet had no gutter at all, and its two readings disagreed with each other
  // by the ten pixels of cell padding. He caught it on a month heading because a short bold word
  // against a hard edge is where the eye catches it.
  //
  // THE ASSERTION ABOVE DID NOT FAIL ON THE FIX AND THE CARD EXPECTED IT TO. Worth writing down,
  // because the reasoning on the card is right about the principle and wrong about this
  // assertion: it compares the heading's painted text with the ROW's painted text, which is
  // already a relationship and not a pixel, so a gutter declared once on the container moves both
  // of them equally and it passes on 229 and 229 as it passes on 235 and 235. What would have
  // failed it is a gutter smuggled in per heading, which is what the card was warning against and
  // is what these two assertions below are here to catch a later change doing.
  //
  // BOTH OF THESE ARE RELATIONSHIPS AND NEITHER NAMES A PIXEL. The first says the rows are inside
  // the box rather than on its edge, and says how far in by naming the thing they have to agree
  // with, the sheet's own title above them: 6 + 10 at these widths and 4 + 12 on a phone both sum
  // to the 16 the head is padded at, so the claim survives the breakpoint without a second
  // number. The second says the two readings of the term agree with each other, which is the
  // failure the card named ahead of time: the outline looking wrong beside a fixed calendar.
  assert('the sheet indents its rows from the box they scroll in, to where its own title starts',
    !!out.gutter && out.gutter.cell !== null && out.gutter.title !== null &&
      out.gutter.cell > out.gutter.box && out.gutter.pad > 0 &&
      out.gutter.cell === out.gutter.title,
    'the first text on a row starting inside the container and on the title\'s own left edge',
    JSON.stringify(out.gutter));

  assert('and both readings of the term start their text on the same left edge',
    !!out.gutter && !!calMonth.gutter && calMonth.gutter.month !== null &&
      calMonth.gutter.month === out.gutter.cell && out.gutter.group === out.gutter.cell,
    'the calendar month heading, the outline group heading and the outline rows on one x',
    `month ${calMonth.gutter && calMonth.gutter.month}, group ${out.gutter.group}, ` +
      `cell ${out.gutter.cell}`);

  assert('the outline names every programme and links each back to its own drawing',
    out.groupLinks.length === state.programmes &&
      new Set(out.groupLinks).size === state.programmes &&
      out.groupLinks.every(h => h.indexOf('#/p/') === 0),
    `${state.programmes} distinct links, each to a #/p/ address`,
    out.groupLinks.join(', ') || 'none');

  // ---- the scoped readings, issue 84 ------------------------------------------
  // THE CARD'S FIRST HALF, AND THE ONE THAT WAS UNCONDITIONAL. A syllabus belongs to a programme,
  // so both readings take one, and the unscoped pair stays because the fragmentation finding
  // lives in the unscoped calendar. Both claims are asserted, because shipping the scope by
  // replacing the unscoped reading would have satisfied a driver that only checked the new one.
  const other = await page.evaluate(`(function () {
    var vs = window.GI.views, i;
    for (i = 0; i < vs.length; i++) if (vs[i].key !== window.ZT.programme().key) return vs[i].key;
    return null;
  })()`);
  await page.evaluate(`location.hash = '#/outline/' + ${JSON.stringify(other)}`);
  await page.waitFor(`window.ZT.term().scope === ${JSON.stringify(other)}`,
    'the outline to scope to one programme');
  const one = await page.evaluate(TERM_READ);
  const oneState = await page.evaluate('window.ZT.term()');
  assert('#/outline/<CODE> is one programme, and the unscoped outline still holds all seven',
    oneState.scope === other && one.groups === 1 && one.rows === oneState.templates &&
      one.rows < state.templates && oneState.allTemplates === state.templates &&
      one.scopeLinks.indexOf('#/outline') !== -1,
    `one programme heading, fewer than ${state.templates} rows, and a link back to #/outline`,
    `scope ${oneState.scope}, ${one.groups} programme heading(s), ${one.rows} rows, ` +
      `scope links ${JSON.stringify(one.scopeLinks.slice(0, 3))}`);

  await page.evaluate(`location.hash = '#/calendar/' + ${JSON.stringify(other)}`);
  await page.waitFor(`window.ZT.term().reading === 'calendar' &&
                      window.ZT.term().scope === ${JSON.stringify(other)}`,
    'the calendar to scope to the same programme');
  const oneCal = await page.evaluate(TERM_READ);
  const oneCalState = await page.evaluate('window.ZT.term()');
  assert('and the calendar takes a programme the same way, keeping the unscoped one',
    oneCal.rows === oneCalState.sessions && oneCal.rows < state.sessions &&
      oneCalState.allSessions === state.sessions &&
      oneCal.title.indexOf(state.sessions + ' sessions') === -1,
    `fewer than ${state.sessions} rows under a heading that does not claim the whole term`,
    `${oneCal.rows} rows, heading ${JSON.stringify(oneCal.title)}`);

  // ---- the per session outline, issues 85 and 108 --------------------------------
  // OFF UNTIL IT IS ASKED FOR is the first of the things marking it, and it is the one a later
  // change could undo without anything looking wrong. The rest are on the block.
  await page.evaluate(`location.hash = '#/outline/' + ${JSON.stringify(other)}`);
  await page.waitFor(`window.ZT.term().reading === 'outline'`, 'the outline back');
  const agOff = await page.evaluate(TERM_READ);
  assert('the per session outline is off until a reader asks for it',
    agOff.agendaRows === 0 && !!agOff.agendaToggle &&
      agOff.agendaToggle.pressed === 'false' &&
      agOff.agendaToggle.w >= 24 && agOff.agendaToggle.h >= 24,
    'no agenda rows, and a control at least 24 by 24 offering them',
    `${agOff.agendaRows} agenda rows, control ` + JSON.stringify(agOff.agendaToggle));

  await page.evaluate(`document.querySelector('.agenda-toggle').click()`);
  await page.waitFor('window.ZT.term().agenda === true', 'the agenda to be switched on');
  const agOn = await page.evaluate(TERM_READ);
  const agState = await page.evaluate('window.ZT.term()');
  // A COMPOUND ASSERTION SPLIT, AND ONLY THE HALF WHOSE SUBJECT IS GONE WAS DROPPED. It read: one
  // block under each row, every line carrying the printed flag `dummy`, and a note on the face of
  // the block saying what the lines are. The note is deleted under the owner's instruction of
  // 12 August, issue 110, and so is the badge that printed the flag, so both of those clauses now
  // have nothing to read. The FLAG ITSELF is not gone and neither is this check on it: `f` and `r`
  // are still on every one of these rows, term.js publishes the set of tokens present for exactly
  // this reason, and the assertion holds them to the closed vocabulary the model gates. So the
  // clause about the data survives, the clause about the printing is turned around to demand the
  // absence, and the note's clause is the only thing removed. One assertion in, one assertion out,
  // and no drop in what is measured about the fields.
  //
  // THE LINE COUNT IS THE MODEL'S TOTAL AND NOT rows TIMES A CONSTANT, which is issue 108: there
  // are 83 lists of three or four now rather than one list drawn 83 times, so the old product
  // would be an assertion that the page draws the same block everywhere. `agendaBlocks` is the
  // claim that replaces it, being how many DIFFERENT blocks the templates in scope carry.
  assert('every line of the outline carries its provenance fields, and nothing on the page prints them',
    agOn.agendaRows === agOn.rows &&
      agOn.agendaLines === agState.agendaLines &&
      agState.agendaBlocks === agOn.rows &&
      agState.agendaFlags.length > 0 &&
      agState.agendaFlags.every(f => ['dummy', 'estimated', 'absent', 'real'].indexOf(f) !== -1) &&
      agState.agendaRanks.length > 0 &&
      agState.agendaRanks.every(r => /^\d_/.test(r)) &&
      agOn.agendaBadges === 0 &&
      !(agOn.agendaNote || '').trim(),
    `one block under each of the ${agOn.rows} rows, ${agState.agendaBlocks} of them different, ` +
      `every line carrying a flag from the closed vocabulary and a rank, no badge printed and ` +
      'no note',
    `${agOn.agendaRows} blocks, ${agOn.agendaLines} lines, flags ` +
      `${JSON.stringify(agState.agendaFlags)}, ranks ${JSON.stringify(agState.agendaRanks)}, ` +
      `${agOn.agendaBadges} badges, note ${JSON.stringify((agOn.agendaNote || '').slice(0, 90))}`);
  await page.evaluate(`document.querySelector('.agenda-toggle').click()`);
  await page.waitFor('window.ZT.term().agenda === false', 'the agenda to be switched off again');

  // ---- per row disclosure, issue 112 ---------------------------------------------
  // "Session outlines must be shown when clicked in the title not just all at once or none at
  // all." The agenda was ONE page-level toggle: every row opened or none did, and on the unscoped
  // outline that is 83 blocks and 272 lines at once, which is not a reading of anything. Three
  // assertions, one per thing the card said should be decided rather than assumed.
  const discOff = await page.evaluate(TERM_READ);
  const discState = await page.evaluate('window.ZT.term()');
  assert('every outline row carries a control of its own, on its own title',
    discOff.rowdisc.n === discOff.rows && discOff.rowdisc.buttons === discOff.rowdisc.n &&
      discOff.rowdisc.wired === discOff.rowdisc.n && discOff.rowdisc.expanded === 0 &&
      discOff.agendaRows === 0 && discState.agendaOpen === 0 &&
      discOff.rowdisc.titles.every(t => discOff.firstCells.length > 0 && t.length > 0),
    `${discOff.rows} rows, each with a button on its title carrying aria-expanded and ` +
      'aria-controls, and none of them open',
    JSON.stringify(discOff.rowdisc));

  // THE TARGET IS A STATED SIZE AND NOT THE BOX THE TITLE MAKES, which is the second thing the
  // card asked to be decided. #84 measured a text-shaped target at 39,4 by 3,0px on the lane
  // caption, and #77 put the floor at 26 by 26. The floor is asserted on the SMALLEST of the 83,
  // and beside it the claim that makes the floor mean something: the control is taller than the
  // line box of the title inside it, so the size is coming from the rule and not from the text.
  assert('the row control is a target of at least 26 by 26, and its size is not the title text',
    discOff.rowdisc.h >= 26 && discOff.rowdisc.w >= 26 &&
      discOff.rowdisc.textH > 0 && discOff.rowdisc.h > discOff.rowdisc.textH,
    'the smallest of them at least 26 by 26 and taller than the title line inside it',
    `smallest ${discOff.rowdisc.w} by ${discOff.rowdisc.h}, title line ` +
      `${discOff.rowdisc.textH} tall`);

  const pressed = await page.evaluate(`(function () {
    var cs = document.querySelectorAll('#termrows .rowdisc');
    var i = cs.length > 2 ? 2 : 0;
    cs[i].click();
    return i;
  })()`);
  await page.waitFor('window.ZT.term().agendaOpen === 1', 'one row to open on its own title');
  const disc1 = await page.evaluate(TERM_READ);
  const st1 = await page.evaluate('window.ZT.term()');
  const linked = await page.evaluate('location.hash');

  // AND WHICH ROWS ARE OPEN IS ON THE ADDRESS, which is the third. Every other view here puts its
  // state there, and a row a reader has opened is a thing they should be able to send somebody.
  // Asserted through the whole loop and not at one point of it: the press writes the parameter,
  // the address reopens the same one row after the sheet has been shut, the page-level control
  // writes `all` rather than 83 ids, and closing them all takes the parameter off rather than
  // leaving an empty one, which would be a second spelling of the same address.
  await page.evaluate(`location.hash = '#/'`);
  await page.waitFor('window.ZT.term().open === false', 'the sheet to shut');
  await page.evaluate(`location.hash = ${JSON.stringify(linked)}`);
  await page.waitFor(`window.ZT.term().reading === 'outline'`, 'the linked outline back');
  const relinked = await page.evaluate(TERM_READ);
  const stRelink = await page.evaluate('window.ZT.term()');
  await page.evaluate(`document.querySelector('.agenda-toggle').click()`);
  await page.waitFor('window.ZT.term().agenda === true', 'every row open from the one control');
  const hashAll = await page.evaluate('location.hash');
  await page.evaluate(`document.querySelector('.agenda-toggle').click()`);
  await page.waitFor('window.ZT.term().agendaOpen === 0', 'every row shut again');
  const hashNone = await page.evaluate('location.hash');
  assert('and which rows are open is on the address, so an opened row can be linked',
    disc1.agendaRows === 1 && disc1.rowdisc.expanded === 1 && st1.agenda === false &&
      st1.agendaOpen === 1 && disc1.agendaLines > 0 &&
      disc1.agendaLines < st1.agendaLines &&
      /\?open=/.test(linked) && st1.agendaParam === decodeURIComponent(linked.split('open=')[1]) &&
      stRelink.agendaOpen === 1 && relinked.agendaRows === 1 &&
      relinked.rowdisc.expanded === 1 &&
      /\?open=all$/.test(hashAll) && !/open=/.test(hashNone),
    `one press opening one row of ${discOff.rows} and naming it on the address, the address ` +
      'reopening exactly that row, open-all writing all and closing them writing nothing',
    `pressed ${pressed}: ${disc1.agendaRows} block(s), ${disc1.agendaLines} line(s), address ` +
      `${JSON.stringify(linked)}; relinked ${relinked.agendaRows} block(s); all ` +
      `${JSON.stringify(hashAll)}; none ${JSON.stringify(hashNone)}`);

  await page.evaluate(`location.hash = '#/outline'`);
  await page.waitFor('window.ZT.term().scope === null', 'the unscoped outline back');

  // ISSUE 77'S RULE. A route with no heading of its own inherits the one before it, which is the
  // defect that card was filed for. Three headings, three different sentences.
  const headings = [headingDiagram, cal.heading.trim(), out.heading.trim()];
  assert('each reading has a heading of its own rather than the diagram\'s',
    new Set(headings).size === 3 && headings.every(h => h.length > 0),
    'three different headings, one per route',
    headings.map(h => JSON.stringify(h)).join(' | '));

  await page.evaluate(`location.hash = '#/'`);
  await page.waitFor('window.ZT.term().open === false', 'the term sheet to close');
  const back = await page.evaluate(`(function () {
    return { heading: (document.querySelector('h1') || {}).innerText || '',
             diagram: getComputedStyle(document.getElementById('view-diagram')).display,
             cls: document.body.className };
  })()`);
  assert('leaving the route closes the sheet and gives the drawing its heading back',
    back.heading.trim() === headingDiagram && back.diagram !== 'none' &&
      !/\b(calendar|outline)\b/.test(back.cls),
    `the diagram on screen under ${JSON.stringify(headingDiagram)}`,
    `${JSON.stringify(back.heading.trim())}, display ${back.diagram}, body class ` +
    `${JSON.stringify(back.cls)}`);

  // ---- the window on the drawing, issues 90 and 100 -----------------------------
  // HE FILED #90 FROM `#graph` AND #100 AGAINST WHAT #90 DID THERE. The first shipped a DIM: the
  // geometry never moved, the digest never changed and the build gate never saw the feature. He
  // rejected it. "The whole poitn of this filter is to just render the diagram of those weeks."
  //
  // SO THE DRAWING ON SCREEN IS NOW A RUN TIME TRANSFORM OF A GENERATED ARTEFACT, AND THAT IS
  // EXACTLY WHAT scripts/check_build.sh CANNOT SEE. The canonical layout is still generated, still
  // digested and still reproduced byte for byte on a rebuild; the filtered drawing is computed in
  // the browser and no build ever wrote it. Everything below is the cover the build gate does not
  // give, and the load bearing one is the second: reflowing the FULL node set reproduces the
  // canonical coordinates, which is what makes the filtered drawing the build's own geometry with
  // tiles taken out rather than a second opinion about where things go.
  //
  // A TENTH OF A UNIT AND NOT A TWENTIETH, which is one rounding rule and not slack. layout.js
  // writes its coordinates to one decimal; Python rounds a half to even and JavaScript rounds it
  // away from zero, so a value landing exactly on x.x5 is written 876.2 by the build and computed
  // 876.3 here. Thirty five of the four hundred and fifty five edges across the seven drawings do
  // it on a control point and Z-CFA does it on a tile. Nothing else differs at all: measured on
  // all seven, the arrowheads and the directions are exact and the worst of everything else is
  // that one tenth.
  // ON THE DENSEST OF THE SEVEN, chosen by measurement and not by name. The card was filed from a
  // drawing 2578px tall with three lit tiles in it, and a filter asserted on the six-session view
  // the suite happens to start on would prove almost nothing: the reflow has to have work to do.
  // The address is the one the instance document carries for that view, read and not constructed,
  // after `#/p/Z-ZIB` cost this repository half an hour of false alarm once already.
  const dense = await page.evaluate(`(function () {
    var best = null, i;
    for (i = 0; i < window.GL.views.length; i++) {
      if (best && window.GL.views[i].drawing.h <= best.h) continue;
      best = { key: window.GL.views[i].key, h: window.GL.views[i].drawing.h,
               route: window.GI.views[i].route };
    }
    return best;
  })()`);
  await page.evaluate(`location.hash = ${JSON.stringify(dense.route)}`);
  await page.waitFor(`window.ZT.programme().key === ${JSON.stringify(dense.key)}`,
    'the tallest of the seven drawings');
  await viewSettled(page);
  const beforeWin = await page.evaluate(`(function () {
    var p = window.ZT.programme();
    return { digest: p.digest, w: p.w, h: p.h, k: window.ZT.view().k,
             nodes: document.querySelectorAll('#graph [data-node]').length };
  })()`);
  await wnMenu(page, true);
  await pressByText(page, '#wnmenu .wn-weeks', '3 weeks');
  await page.waitFor('window.ZT.filtered().on === true', 'the drawing to take the window');
  await viewSettled(page);
  const drawn = await page.evaluate(`(function () {
    var w = window.ZT.term().window, f = window.ZT.filtered(), bad = 0, lit = 0, ghosts = 0;
    // Every session the window covers is on the page and every session it does not is off it.
    // Both directions, because drawing nothing would satisfy the first and drawing everything the
    // second. Read against the instance document's own dates rather than against the page's.
    window.GI.views.forEach(function (v) {
      if (v.key !== window.ZT.programme().key) return;
      v.nodes.forEach(function (n) {
        if (n.type !== 'CohortSession') return;
        var at = '';
        (n.props || []).forEach(function (p) { if (p.k === 'scheduled_at') at = p.v; });
        var day = String(at).split(' ')[0];
        var inside = day >= w.from && day <= w.to;
        if (inside) lit++;
        if (inside !== !!document.querySelector('#graph [data-node="' + n.id + '"]')) bad++;
      });
    });
    f.hidden.forEach(function (id) {
      if (document.querySelector('#graph [data-node="' + id + '"]')) ghosts++;
    });
    return { on: f.on, hidden: f.hidden.length, shown: f.shown.length, wrong: bad, inside: lit,
             stillDrawn: ghosts, canonNodes: f.canonNodes,
             digest: window.ZT.programme().digest, w: window.ZT.programme().w,
             h: window.ZT.programme().h, k: window.ZT.view().k,
             nodes: document.querySelectorAll('#graph [data-node]').length,
             outside: document.querySelectorAll('#graph [data-outside]').length };
  })()`);
  // ISSUE 111 REVERSED THE LAST CONJUNCT AND CHANGED NOTHING ELSE HERE. It read `outside > 0`,
  // because #100 answered a filtered lane with one stub tile standing for what the lane had lost.
  // He filed #111 on one of those stubs: the point of the filter is to see the week and nothing
  // else. There is now nothing on a filtered drawing that is not a tile of the model, which is a
  // stronger claim than the one it replaces and is asserted as one.
  assert('the window renders the weeks in it and reflows what is left, which is what #100 asked for',
    drawn.on === true && drawn.hidden > 0 && drawn.wrong === 0 && drawn.stillDrawn === 0 &&
      drawn.nodes === drawn.shown && drawn.shown + drawn.hidden === drawn.canonNodes &&
      drawn.nodes < beforeWin.nodes && drawn.h < beforeWin.h && drawn.w === beforeWin.w &&
      drawn.digest === beforeWin.digest && drawn.outside === 0,
    `${drawn.inside} sessions drawn and ${drawn.hidden} tiles taken out, the drawing down from ` +
      `${beforeWin.h} to under it at the same ${beforeWin.w} wide, the canonical digest still ` +
      `${beforeWin.digest}, and nothing on the canvas that is not a tile of the model`,
    `${drawn.nodes} of ${beforeWin.nodes} nodes drawn, ${drawn.wrong} against their own date, ` +
      `${drawn.stillDrawn} still painted after being filtered, ${drawn.outside} stub tiles, ` +
      `${drawn.w} by ${drawn.h}`);

  // THE CLAIM THE BUILD GATE CANNOT MAKE, which is the trade this card accepted out loud. Reflow
  // the whole node set with no filter and it has to come out where build/build_layout.py put it:
  // every tile, every arc control point, every arrowhead, every direction. A tenth of a unit is
  // what site/layout.js rounds its coordinates to, so that is the tolerance and nothing looser.
  const reflow = await page.evaluate('window.ZT.reflow()');
  assert('and the reflow reproduces the generated layout, which is the cover check_build.sh cannot give',
    !!reflow && reflow.dy <= 0.1 && reflow.dp <= 0.1 && reflow.arrows <= 0.05 &&
      reflow.rev === 0 && reflow.nodes === beforeWin.nodes && reflow.edges > 0,
    `the full node set reflowing onto the build's own coordinates, worst node and worst control ` +
      `point inside the tenth of a unit layout.js rounds to`,
    JSON.stringify(reflow));

  // A REFLOW THAT OVERLAPPED WOULD LOOK LIKE A RENDERING FAULT AND READ LIKE A DATA ONE. Measured
  // on the tiles the browser drew, in the drawing's own units, every pair.
  const overlap = await page.evaluate(`(function () {
    var boxes = Array.prototype.slice.call(
      document.querySelectorAll('#graph .node .tile-bg')).map(function (r) {
      return { x: +r.getAttribute('x'), y: +r.getAttribute('y'),
               w: +r.getAttribute('width'), h: +r.getAttribute('height'),
               id: r.parentNode.getAttribute('data-node') ||
                   r.parentNode.getAttribute('data-outside') };
    });
    var worst = null, i, j, a, b, ox, oy;
    for (i = 0; i < boxes.length; i++) {
      for (j = i + 1; j < boxes.length; j++) {
        a = boxes[i]; b = boxes[j];
        ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ox > 0 && oy > 0 && (!worst || Math.min(ox, oy) > worst.by)) {
          worst = { a: a.id, b: b.id, by: Math.min(ox, oy) };
        }
      }
    }
    return { tiles: boxes.length, worst: worst };
  })()`);
  assert('no two tiles overlap after it, measured on every pair the browser drew',
    overlap.tiles > 1 && overlap.worst === null,
    `${overlap.tiles} tiles and no pair of them touching`,
    overlap.worst ? `${overlap.worst.a} and ${overlap.worst.b} overlap by ` +
      `${overlap.worst.by.toFixed(1)}px` : 'nothing measured');

  // AND NO LINE DANGLES, which is the half of this card that decides whether the picture can be
  // trusted. Every line's two ends have to be a tile that is on the page, and its arrowhead has to
  // land on one: an arc computed for the full stack and left pointing into the space a filtered
  // tile used to occupy is exactly the failure this checks for.
  const dangle = await page.evaluate(`(function () {
    var tiles = Array.prototype.slice.call(
      document.querySelectorAll('#graph .node .tile-bg')).map(function (r) {
      return { x: +r.getAttribute('x'), y: +r.getAttribute('y'),
               w: +r.getAttribute('width'), h: +r.getAttribute('height') };
    });
    function near(px, py) {
      for (var i = 0; i < tiles.length; i++) {
        var t = tiles[i];
        if (px >= t.x - 0.6 && px <= t.x + t.w + 0.6 && py >= t.y - 0.6 && py <= t.y + t.h + 0.6) {
          return true;
        }
      }
      return false;
    }
    var loose = [], adrift = [];
    Array.prototype.slice.call(document.querySelectorAll('#graph g[data-edge] path.edge, ' +
      '#graph g[data-edge] path.edge-ghost, #graph g[data-edge] path.edge-outside'))
      .forEach(function (p) {
        var key = p.parentNode.getAttribute('data-edge');
        var cut = key.indexOf('->');
        [key.slice(0, cut), key.slice(cut + 2)].forEach(function (id) {
          var sel = '[data-node="' + id + '"], [data-outside="' + id + '"]';
          if (!document.querySelector('#graph ' + sel)) loose.push(key);
        });
        var arrow = p.parentNode.querySelector('path.arrow, path.arrow-ghost, path.arrow-outside');
        var m = arrow && /translate\\(([-\\d.]+),([-\\d.]+)\\)/.exec(arrow.getAttribute('transform'));
        if (m && !near(+m[1], +m[2])) adrift.push(key);
      });
    return { edges: document.querySelectorAll('#graph g[data-edge] path.edge, ' +
             '#graph g[data-edge] path.edge-ghost, ' +
             '#graph g[data-edge] path.edge-outside').length,
             loose: loose, adrift: adrift };
  })()`);
  assert('and no line dangles: both ends of every one of them are a tile on the page',
    dangle.edges > 0 && dangle.loose.length === 0 && dangle.adrift.length === 0,
    `${dangle.edges} lines, every end on a drawn tile and every arrowhead on one`,
    `${dangle.loose.length} ends on nothing (${dangle.loose.slice(0, 3).join(', ')}), ` +
      `${dangle.adrift.length} arrowheads adrift (${dangle.adrift.slice(0, 3).join(', ')})`);

  // FILTERED HAS TO BE TELLABLE FROM ABSENT, AND ISSUE 111 MOVED WHERE IT IS TOLD. A drawing that
  // silently drops a relationship is a management tool that has started lying: the reader cannot
  // tell filtered from absent, and absent is the more interesting of the two on a page whose whole
  // subject is what the business does and does not record. #100 answered that ON the drawing, with
  // one stub tile per lane carrying the count, the lines that lost an end folded onto it, and a
  // fourth line on every lane caption. He filed #111 on one of those stubs: "The whole point of
  // week filter is to not see this (only the week, clean)". Honest bookkeeping and a clean view
  // were treated as one requirement and they are two.
  //
  // SO THIS PAIR IS THE SAME PAIR OF CLAIMS READ IN THE OTHER PLACE. The first says the count is
  // OFF the drawing and IN the header, and checks the header's own sentence against the page's own
  // report rather than against a number written here: the wording may change, the arithmetic may
  // not. The second says the per lane breakdown the captions used to carry survives in the window
  // menu, complete, and that the lane captions on the canvas are the lines the build wrote and no
  // more. Deleting either would leave a filter that loses the number, which is the failure #100
  // existed to prevent and which #111 did not license.
  const off = await page.evaluate(`(function () {
    var f = window.ZT.filtered();
    var b = document.getElementById('wnbtn');
    return { hidden: f.hidden.length, off: f.off, canonNodes: f.canonNodes,
             canonEdges: f.canonEdges, drawnEdges: f.drawnEdges,
             title: b ? b.title : '',
             marks: document.querySelectorAll('#graph [data-outside]').length,
             capWindow: document.querySelectorAll('#graph .cap-window').length,
             dashed: document.querySelectorAll('#graph .edge-outside, ' +
                     '#graph g[data-edge].outside').length,
             drawnPaths: document.querySelectorAll('#graph g[data-edge] path.edge, ' +
                         '#graph g[data-edge] path.edge-ghost').length };
  })()`);
  const said = /(\d+) of (\d+) tiles? and (\d+) relationships? are off the drawing/
    .exec(off.title);
  assert('what the window took off the drawing is counted in the header rather than on the canvas',
    off.marks === 0 && off.capWindow === 0 && off.dashed === 0 &&
      off.off.tiles === off.hidden && off.off.tiles > 0 && off.off.relationships > 0 &&
      off.drawnEdges === off.drawnPaths &&
      off.canonEdges - off.drawnEdges === off.off.lines &&
      !!said && Number(said[1]) === off.off.tiles && Number(said[2]) === off.canonNodes &&
      Number(said[3]) === off.off.relationships,
    `nothing on the canvas standing for what is off it, and the window control saying ` +
      `${off.off.tiles} of ${off.canonNodes} tiles and ${off.off.relationships} relationships`,
    `${off.marks} stub tiles, ${off.capWindow} window captions, ${off.dashed} folded lines, ` +
      `report ${JSON.stringify(off.off)} against title ${JSON.stringify(off.title)}`);

  await wnMenu(page, true);
  const menuOff = await page.evaluate(`(function () {
    var p = document.querySelector('#wnmenu .wn-off');
    var rows = Array.prototype.slice.call(document.querySelectorAll('#wnmenu .wn-lane'))
      .map(function (r) {
        var n = r.querySelector('.wn-lane-n'), k = r.querySelector('.wn-lane-k');
        return { n: n ? n.textContent : '', k: k ? k.textContent : '' };
      });
    var key = window.ZT.programme().key, bands = null;
    window.GL.views.forEach(function (v) { if (v.key === key) bands = v.drawing.bands; });
    var want = (bands || []).reduce(function (t, b) {
      return t + ((b.lines || [b.label]).length);
    }, 0);
    return { lead: p ? p.textContent : null, rows: rows, capWant: want,
             capGot: document.querySelectorAll('#graph .band-cap').length,
             lanes: window.ZT.filtered().lanes };
  })()`);
  const lost = menuOff.rows.map(r => /^(\d+) of (\d+)$/.exec(r.n))
    .map(m => (m ? Number(m[2]) - Number(m[1]) : NaN));
  assert('and the lane by lane breakdown the captions used to carry is in the window menu',
    menuOff.rows.length > 0 && lost.every(n => n > 0) &&
      lost.reduce((a, b) => a + b, 0) === off.off.tiles &&
      menuOff.rows.every(r => !!r.k && menuOff.lanes.some(l => l.label === r.k)) &&
      menuOff.capGot === menuOff.capWant,
    `${menuOff.rows.length} lanes named as the drawing names them, summing to the ` +
      `${off.off.tiles} tiles the window took off, and ${menuOff.capWant} caption lines on the ` +
      'canvas, which is what the build wrote',
    `rows ${JSON.stringify(menuOff.rows)}, captions ${menuOff.capGot} against ` +
      `${menuOff.capWant}, lead ${JSON.stringify(menuOff.lead)}`);
  await wnMenu(page, false);

  // AND THE FIT FRAMES WHAT IS ON SCREEN RATHER THAN WHAT IT CAME FROM. This is the obvious
  // regression of the whole card: the drawing is a fraction of its old height and a fit that never
  // ran would leave the reader looking at the same postage stamp. Z-BL is 2578px unfiltered.
  const fitted = await page.evaluate(`(function () {
    var v = window.ZT.view(), g = document.getElementById('graph').getBoundingClientRect();
    var p = window.ZT.programme();
    return { k: v.k, was: ${beforeWin.k}, h: p.h, box: g.height, wide: g.width };
  })()`);
  assert('and the fit frames the filtered drawing rather than the one it was cut from',
    fitted.k > fitted.was * 1.2 && fitted.h * fitted.k <= fitted.box + 2,
    `the scale up from ${beforeWin.k.toFixed(3)} because the drawing is ${fitted.h} tall and no ` +
      `longer ${beforeWin.h}, and the whole of it inside the canvas`,
    `scale ${fitted.k.toFixed(3)}, ${fitted.h} units at that scale is ` +
      `${(fitted.h * fitted.k).toFixed(0)}px in a ${fitted.box.toFixed(0)}px canvas`);

  // THE WINDOW BELONGS TO THE PAGE AND NOT TO A DRAWING, which is why its control is in the
  // header rather than in the sheet. A change of programme repaints from scratch, so a window
  // that was applied once and never re-applied would come back off on the next route.
  const away = await page.evaluate(`(function () {
    var vs = window.GI.views, i;
    for (i = 0; i < vs.length; i++) if (vs[i].key !== window.ZT.programme().key) return vs[i];
    return null;
  })()`);
  await page.evaluate(`location.hash = ${JSON.stringify(away.route)}`);
  await page.waitFor(`window.ZT.programme().key === ${JSON.stringify(away.key)}`,
    'the other programme to be drawn');
  const across = await page.evaluate(`(function () {
    var f = window.ZT.filtered();
    return { on: f.on, hidden: f.hidden.length, shown: f.shown.length,
             weeks: window.ZT.term().window.weeks,
             drawn: document.querySelectorAll('#graph [data-node]').length };
  })()`);
  assert('and it survives a change of programme, because it belongs to the page',
    across.on === true && across.weeks === 3 && across.hidden > 0 && across.shown > 0 &&
      across.drawn === across.shown,
    `the three week window still on, filtering ${away.key} down from its own full set`,
    `on ${across.on}, ${across.weeks} weeks, ${across.hidden} taken out of ${away.key}`);

  await wnMenu(page, true);
  await pressByText(page, '#wnmenu .wn-weeks', 'whole term');
  await page.waitFor('window.ZT.filtered().on === false', 'the window to come off');
  const litAgain = await page.evaluate(`(function () {
    var f = window.ZT.filtered();
    return { on: f.on, hidden: f.hidden.length, shown: f.shown.length,
             drawn: document.querySelectorAll('#graph [data-node]').length,
             marks: document.querySelectorAll('#graph [data-outside]').length,
             caps: document.querySelectorAll('#graph .cap-window').length };
  })()`);
  assert('taking it off draws the whole term again rather than leaving the drawing half cut',
    litAgain.on === false && litAgain.hidden === 0 && litAgain.shown > 0 && litAgain.drawn === litAgain.shown && litAgain.marks === 0 &&
      litAgain.caps === 0,
    'every node back on the page, no outside tile left and no window line on a caption',
    `${litAgain.drawn} drawn of ${litAgain.shown}, ${litAgain.marks} outside tiles, ` +
      `${litAgain.caps} window captions`);
  await wnMenu(page, false);
  await page.evaluate(`location.hash = '#/p/' + ${JSON.stringify(here)}`);
  await page.waitFor(`window.ZT.programme().key === ${JSON.stringify(here)}`,
    'the drawing this phase started on');
  await page.evaluate(`location.hash = '#/'`);

  // ---- the lane heading as a control, issue 84 ----------------------------------
  // HE CLICKED THE CAPTION AND EXPECTED THE OUTLINE. Measured on the deployed page at fit, the
  // caption itself was 39,4 by 3,0 CSS px with the pan cursor over it and nothing listening, and
  // issue 77 had just taken every control here to 26 by 26 from eleven of eleven failing SC
  // 2.5.8. So the target is a counter-scaled rect and not the text, and the assertion that
  // matters is the one the caption could never have passed: THAT ITS SIZE DOES NOT MOVE WITH THE
  // ZOOM. Three readings, at the far end of the zoom out, at fit, and at the far end in.
  await page.evaluate('window.ZT.fit()');
  await viewSettled(page);
  const capBox = () => page.evaluate(`(function () {
    var out = {}, k = window.ZT.view().k;
    ['templates', 'sessions'].forEach(function (key) {
      var e = document.querySelector('.capbtn[data-cap="' + key + '"] .capbtn-hit');
      if (!e) { out[key] = null; return; }
      var r = e.getBoundingClientRect();
      // Issues 96 and 97. The frame the reader sees is the sibling of the hit area, and the
      // caption it is drawn around is the text of the lane the pair sit in.
      var f = e.parentNode.querySelector('.capbtn-frame').getBoundingClientRect();
      var t = null;
      Array.prototype.forEach.call(e.parentNode.parentNode.querySelectorAll('text.band-cap'),
        function (n) {
          var q = n.getBoundingClientRect();
          if (!t) t = { top: q.top, bot: q.bottom };
          else { t.top = Math.min(t.top, q.top); t.bot = Math.max(t.bot, q.bottom); }
        });
      var r1 = function (v) { return Math.round(v * 10) / 10; };
      out[key] = { w: r1(r.width), h: r1(r.height),
                   cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2),
                   air: t ? { top: r1(t.top - f.top), bot: r1(f.bottom - t.bot),
                              off: r1((t.top + t.bot) / 2 - (f.top + f.bottom) / 2) } : null };
    });
    out.k = k;
    return out;
  })()`);
  const zoomTimes = (id, n) =>
    page.evaluate(`(function () { var b = document.getElementById(${JSON.stringify(id)});
      for (var i = 0; i < ${n}; i++) b.click(); return window.ZT.view().k; })()`);

  const atFit = await capBox();
  await zoomTimes('zoomout', 30);
  await viewSettled(page);
  const atMin = await capBox();
  await zoomTimes('zoomin', 60);
  await viewSettled(page);
  const atMax = await capBox();
  await page.evaluate('window.ZT.fit()');
  await viewSettled(page);

  const three = [['min', atMin], ['fit', atFit], ['max', atMax]];
  const tooSmall = three.filter(([, b]) =>
    !b.templates || !b.sessions ||
    Math.min(b.templates.w, b.templates.h, b.sessions.w, b.sessions.h) < 24);
  assert('the lane heading is a target of at least 24 by 24 at every zoom the canvas allows',
    tooSmall.length === 0 && atMin.k < atFit.k && atMax.k > atFit.k,
    'both controls at least 24 by 24 at the smallest scale, at fit and at the largest',
    three.map(([n, b]) => `${n} k=${b.k.toFixed(3)} templates ${b.templates.w}x` +
      `${b.templates.h} sessions ${b.sessions.w}x${b.sessions.h}`).join(' | '),
    three.map(([n, b]) => `${n} k=${b.k.toFixed(3)}: ${b.templates.w}x${b.templates.h} and ` +
      `${b.sessions.w}x${b.sessions.h}`).join(', '));

  // AND THE CAPTION HAS TO BE INSIDE IT, EVENLY. Issues 96 and 97, filed on this rect within
  // seconds of each other as "frame is too tight" and "not centered in the frame". Both were
  // true and the assertion above passed the whole time: a target can be 24 by 24 and still be
  // drawn through the words it is a target for, which is this repository's own failure shape,
  // a check that measures less than it claims. The frame's height mixed caption units scaled by
  // the zoom with raw CSS px, so the room above the caption came out as 3.6k - 4 and went
  // NEGATIVE below k = 1.11, which is fit and everything short of it; and the 26px clamp grew
  // the rect upward only, so a one line heading sat 5px below its own centre at fit and 8px
  // below it at the far zoom out.
  //
  // THE THRESHOLDS ARE LOOSE AND THE EVIDENCE FOR EACH IS A MEASUREMENT. The air is read off
  // getBoundingClientRect, which is the layout box and carries the line box's leading, while the
  // repair measures the font box; the two differ by up to about a pixel and the difference moves
  // with the scale, so the floor cannot sit where the tightest observed reading is. Driven over
  // eleven zoom levels on the unfiltered drawing and over the filtered one, the air came out
  // between 3.0 and 12.3px and the offset never past 1.2px. Two and three leave that room and
  // still fail every one of the old readings: the defect showed -2, -1.0 and +0.3px of air and
  // put the caption 5.4 to 8px off centre, and the negative control confirms this assertion
  // fails on the geometry it replaced while the 24 by 24 one above passes in both directions.
  const cramped = three.filter(([, b]) => ['templates', 'sessions'].some((key) => {
    const a = b[key] && b[key].air;
    return !a || a.top < 2 || a.bot < 2 || Math.abs(a.off) > 3;
  }));
  assert('the lane heading sits inside its frame, with air on both sides, at every zoom',
    cramped.length === 0,
    'at least 2px of air over and under both captions and neither more than 3px off centre',
    three.map(([n, b]) => `${n} k=${b.k.toFixed(3)} ` + ['templates', 'sessions'].map((key) =>
      `${key} ${b[key].air ? `${b[key].air.top}/${b[key].air.bot} off ${b[key].air.off}`
        : 'no caption'}`).join(' ')).join(' | '),
    cramped.map(([n, b]) => `${n} k=${b.k.toFixed(3)}: ` + ['templates', 'sessions'].map((key) =>
      `${key} ${JSON.stringify(b[key] && b[key].air)}`).join(', ')).join(' | '));

  // AND IT OPENS THE LANE'S OWN READING, SCOPED. One lane heading being a control while its
  // neighbour is decoration is worse than neither, which is why both are asserted here.
  const capPoints = await capBox();
  await requireHit(page, capPoints.templates.cx, capPoints.templates.cy, { tag: 'rect' });
  await click(page, capPoints.templates.cx, capPoints.templates.cy);
  await page.waitFor(`window.ZT.term().reading === 'outline'`, 'the caption to open the outline');
  const viaCapOut = await page.evaluate('location.hash');
  await page.evaluate(`location.hash = '#/'`);
  await page.waitFor('window.ZT.term().open === false', 'the sheet to close again');
  await page.evaluate('window.ZT.fit()');
  await viewSettled(page);
  const capPoints2 = await capBox();
  await click(page, capPoints2.sessions.cx, capPoints2.sessions.cy);
  await page.waitFor(`window.ZT.term().reading === 'calendar'`,
    'the neighbouring caption to open the calendar');
  const viaCapCal = await page.evaluate('location.hash');
  await page.evaluate(`location.hash = '#/'`);
  await page.waitFor('window.ZT.term().open === false', 'the sheet to close');
  assert('the templates heading opens the scoped outline and the sessions heading the calendar',
    viaCapOut === '#/outline/' + here && viaCapCal === '#/calendar/' + here,
    `#/outline/${here} from one and #/calendar/${here} from the other`,
    `${JSON.stringify(viaCapOut)} and ${JSON.stringify(viaCapCal)}`);

  // AND IT DOES NOT BREAK THE CANVAS. A press and drag is a pan and issue 46 spent real work on
  // the click versus drag threshold; a new click target on the drawing that swallowed a pan, or
  // that navigated at the end of one, would be a regression in the plane rather than a feature.
  await page.evaluate('window.ZT.fit()');
  const beforeDrag = await viewSettled(page);
  const dragFrom = await capBox();
  await dragBy(page, dragFrom.templates.cx, dragFrom.templates.cy, 90, 60);
  const afterDrag = await viewSettled(page);
  const hashAfter = await page.evaluate('location.hash');
  const moved = Math.abs(afterDrag.x - beforeDrag.x) * afterDrag.k;
  assert('a press and drag that starts on the lane heading pans and does not navigate',
    moved > 60 && !/outline|calendar/.test(hashAfter) &&
      (await page.evaluate('window.ZT.term().open')) === false,
    'the drawing moved and the sheet stayed shut',
    `moved ${moved.toFixed(1)}px, hash ${JSON.stringify(hashAfter)}`);
  await page.evaluate('window.ZT.fit()');
  await viewSettled(page);
}

// ---- sampled against complete, issue 122 --------------------------------------------------------
// THE FINDING IS THAT A COUNT ON THIS PAGE NEVER SAID WHICH POPULATION IT WAS OVER. Five of the
// seven documents hold a sample of their programme's term and two hold all of it, and until this
// card the only place that was written was a band caption on the canvas. Everything in the header
// is then a count over a set the reader has no reason to think is partial: `gaps 11 of 95` is 95
// values among eighty three of the two hundred and sixty sessions the model declares, and reads as
// a fact about the business.
//
// AND #121's OWN FINDING IS WHY THIS PHASE IS WRITTEN THE WAY IT IS: "all 207 read the page's own
// bookkeeping". An assertion that took the sheet's sample clause and checked it against
// window.ZT.term().sessionsTotal would be checking one of term.js's readings against another of
// term.js's readings, which is precisely how a page that counted the wrong population passes.
// SAMPLE_MODEL below walks window.GI's `counts` blocks itself, per view and summed, and every
// figure asserted here is that recomputation. The page's strings are the input to the comparison
// and never its answer.
//
// THE PARTITION IS RECOMPUTED TOO, AND THAT IS THE HALF A NAIVE FIX WOULD SHIP. A page that
// printed the sampled form everywhere would be right on five of seven and would read as a card
// that had been done; a page that printed the complete form everywhere would be right on two. So
// which programmes are complete is derived here from the model's own declaration and the two sets
// are required to be non-empty, so neither blanket answer can pass.
const SAMPLE_MODEL = `(function () {
  var out = { views: [], sessions: { drawn: 0, total: 0 }, templates: { drawn: 0, total: 0 } };
  window.GI.views.forEach(function (v) {
    var s = (v.counts || {}).CohortSession || { drawn: 0, total: 0 };
    var t = (v.counts || {}).SessionTemplate || { drawn: 0, total: 0 };
    out.views.push({ key: v.key, code: v.code, drawn: s.drawn, total: s.total,
                     complete: s.total > 0 && s.drawn >= s.total,
                     tDrawn: t.drawn, tTotal: t.total,
                     tComplete: t.total > 0 && t.drawn >= t.total });
    out.sessions.drawn += s.drawn;
    out.sessions.total += s.total;
    out.templates.drawn += t.drawn;
    out.templates.total += t.total;
  });
  out.sessions.complete = out.sessions.drawn >= out.sessions.total;
  out.templates.complete = out.templates.drawn >= out.templates.total;
  return JSON.stringify(out);
})()`;

// The clause on the drawing's own heading, with the boxes of the two things it has to sit beside.
// The geometry is here because "where the number is" is the whole of what the card asked for and
// is a measurable claim: a clause that ended up in the footer, in a tooltip or on a second line
// would satisfy every string assertion in this phase.
const HEADING_READ = `(function () {
  function box(e) {
    if (!e) return null;
    var r = e.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height, mid: r.top + r.height / 2 };
  }
  var s = document.getElementById('subsample');
  var h = document.querySelector('h1 .h-diagram');
  return JSON.stringify({
    text: s ? s.textContent : null,
    heading: h ? h.textContent : null,
    sample: box(s),
    gaps: box(document.getElementById('gapsval')),
    plate: box(document.getElementById('hstate'))
  });
})()`;

async function checkSample(page) {
  await page.evaluate(`location.hash = '#/'`);
  await page.waitFor('window.ZT.term().open === false', 'the diagram to be on screen');
  const startedOn = await page.evaluate('window.ZT.programme().key');
  const model = JSON.parse(await page.evaluate(SAMPLE_MODEL));
  const complete = model.views.filter(v => v.complete);
  const sampled = model.views.filter(v => !v.complete);

  // ONE. EVERY DRAWING SAYS ITS OWN, AND THE WORDS ARE THE MODEL'S ARITHMETIC. Walked over all
  // seven rather than read on one, for the reason the gap count is: a clause that printed the same
  // fraction whatever the address would pass on any single view, and the seven differ by an order
  // of magnitude.
  const said = [];
  for (const v of model.views) {
    await page.evaluate(`location.hash = '#/p/' + ${JSON.stringify(v.key)}`);
    await page.waitFor(`window.ZT.programme().key === ${JSON.stringify(v.key)}`,
      `the ${v.key} drawing`);
    said.push({ key: v.key, ...JSON.parse(await page.evaluate(HEADING_READ)) });
  }
  const want = v => (v.complete ? `, all ${v.total} of its sessions`
                                : `, ${v.drawn} of its ${v.total} sessions`);
  const wrongText = model.views.filter((v, i) => said[i].text !== want(v));
  assert('every drawing says in its heading how much of its programme it holds',
    wrongText.length === 0 && said.length === 7 &&
      new Set(said.map(s => s.text)).size > 1,
    'seven headings each carrying its own view\'s drawn and declared session counts, ' +
      'recomputed off window.GI in this driver',
    wrongText.length
      ? wrongText.map((v, i) => `${v.key} wanted ${JSON.stringify(want(v))}`).join(', ') +
        ` against ${JSON.stringify(said.map(s => s.text))}`
      : JSON.stringify(said.map(s => s.text)));

  // TWO. AND SAMPLED READS DIFFERENTLY FROM COMPLETE, WHICH IS THE WHOLE CARD. Both sets are
  // required to be non-empty and the membership is the model's, so a page that printed one form
  // everywhere fails whichever form it chose.
  const saysAll = said.filter(s => /^, all \d+ of its sessions$/.test(s.text)).map(s => s.key);
  const saysPart = said.filter(s => /^, \d+ of its \d+ sessions$/.test(s.text)).map(s => s.key);
  assert('and a complete drawing reads differently from a sampled one, by the model\'s own partition',
    complete.length > 0 && sampled.length > 0 &&
      saysAll.join() === complete.map(v => v.key).join() &&
      saysPart.join() === sampled.map(v => v.key).join() &&
      saysAll.length + saysPart.length === 7,
    `${complete.map(v => v.key).join(', ')} complete and ` +
      `${sampled.map(v => v.key).join(', ')} sampled, off window.GI`,
    `the page says all of ${JSON.stringify(saysAll)} and part of ${JSON.stringify(saysPart)}`);

  // THREE. AND IT IS WHERE THE NUMBERS ARE. The card's sentence is that the distinction must be at
  // the count and not two clicks away in a band caption, so the clause is required to be painted,
  // to have width, and to sit on the same line as the readout's own value with the plate to its
  // right. A clause moved into a tooltip, into the footer or onto a second row would pass every
  // string above and fail here.
  const last = said[said.length - 1];
  const onLine = last.sample && last.gaps && last.plate &&
    last.sample.w > 0 && last.sample.h > 0 &&
    Math.abs(last.sample.mid - last.gaps.mid) <= 2 &&
    last.sample.x < last.plate.x;
  assert('and it is on the header\'s own line, beside the counts it is the subject of',
    onLine === true,
    'the clause painted, on the readout value\'s own line, to the left of the plate',
    JSON.stringify({ sample: last.sample, gaps: last.gaps, plate: last.plate }));

  // FOUR. BOTH READINGS OF THE TERM SAY IT TOO, in the heading and in the sentence, because the
  // sheet is the one place on this page where the count of eighty three is printed as a number a
  // manager reads off the screen. Recomputed from the same model, summed across the seven, and
  // required in both readings: the calendar lists cohort sessions and the outline session
  // templates, and the two totals are declared separately in the document.
  await page.evaluate(`location.hash = '#/calendar'`);
  await page.waitFor(`window.ZT.term().reading === 'calendar'`, 'the calendar');
  const calAll = await page.evaluate(TERM_READ);
  await page.evaluate(`location.hash = '#/outline'`);
  await page.waitFor(`window.ZT.term().reading === 'outline'`, 'the outline');
  const outAll = await page.evaluate(TERM_READ);
  const calWanted = `${model.sessions.drawn} of the ${model.sessions.total} sessions the model counts`;
  const outWanted =
    `${model.templates.drawn} of the ${model.templates.total} session templates the model counts`;
  assert('both readings of the term say the sample of the rows they drew, in the heading and in the sentence',
    model.sessions.complete === false && model.templates.complete === false &&
      calAll.sub.indexOf(calWanted) !== -1 &&
      calAll.title.indexOf(`${model.sessions.drawn} of the ${model.sessions.total} sessions`) !== -1 &&
      outAll.sub.indexOf(outWanted) !== -1 &&
      outAll.title.indexOf(
        `${model.templates.drawn} of the ${model.templates.total} session templates`) !== -1,
    `the calendar saying "${calWanted}" and the outline "${outWanted}", both recomputed here`,
    `calendar ${JSON.stringify(calAll.title)} / ${JSON.stringify(calAll.sub.slice(0, 120))}, ` +
      `outline ${JSON.stringify(outAll.title)} / ${JSON.stringify(outAll.sub.slice(0, 120))}`);

  // FIVE. AND A COMPLETE SCOPE SAYS IT IS COMPLETE RATHER THAN WEARING A SAMPLE'S WORDS, which is
  // the state the old sentence could not express: it closed with "drawn from a term the model
  // counts at 25" over twenty five rows, the same shape it used over eighty three of two hundred
  // and sixty. Both scopes are driven, from the model's own partition rather than from a key typed
  // here, so a page that dropped the distinction fails on one of the two whichever way it dropped
  // it.
  const oneComplete = complete[0];
  const oneSampled = sampled[0];
  await page.evaluate(`location.hash = '#/calendar/' + ${JSON.stringify(oneComplete.key)}`);
  await page.waitFor(`window.ZT.term().scope === ${JSON.stringify(oneComplete.key)}`,
    `the ${oneComplete.key} calendar`);
  const calFull = await page.evaluate(TERM_READ);
  await page.evaluate(`location.hash = '#/calendar/' + ${JSON.stringify(oneSampled.key)}`);
  await page.waitFor(`window.ZT.term().scope === ${JSON.stringify(oneSampled.key)}`,
    `the ${oneSampled.key} calendar`);
  const calPart = await page.evaluate(TERM_READ);
  assert('a complete scope says so in words rather than in a sample\'s shape with equal numbers',
    calFull.title.indexOf(`all ${oneComplete.total} sessions in date order`) !== -1 &&
      calFull.sub.indexOf(`all ${oneComplete.total} of the sessions the model counts`) !== -1 &&
      calFull.sub.indexOf(` of the ${oneComplete.total} sessions the model counts`) === -1 &&
      calPart.title.indexOf(
        `${oneSampled.drawn} of the ${oneSampled.total} sessions in date order`) !== -1 &&
      calPart.sub.indexOf(
        `${oneSampled.drawn} of the ${oneSampled.total} sessions the model counts`) !== -1,
    `${oneComplete.key} saying all ${oneComplete.total} and ${oneSampled.key} saying ` +
      `${oneSampled.drawn} of the ${oneSampled.total}`,
    `${oneComplete.key} ${JSON.stringify(calFull.sub.slice(0, 110))}, ` +
      `${oneSampled.key} ${JSON.stringify(calPart.sub.slice(0, 110))}`);

  // SIX. AND EVERY GAP FIGURE CARRIES THE POPULATION IT WAS COUNTED OVER, which is the card's own
  // worked example: thirty eight templates recording no duration is thirty eight of the eighty
  // three these documents hold and not of the two hundred and sixty the model counts. The
  // denominators are checked against the rows the sheet actually drew, counted here off the table
  // rather than off the sentence that is under test.
  await page.evaluate(`location.hash = '#/outline'`);
  await page.waitFor(`window.ZT.term().reading === 'outline'`, 'the outline again');
  const outRows = await page.evaluate(TERM_READ);
  const dur = /(\d+) of (\d+) record no duration/.exec(outRows.sub) || [];
  await page.evaluate(`location.hash = '#/calendar'`);
  await page.waitFor(`window.ZT.term().reading === 'calendar'`, 'the calendar again');
  const calRows = await page.evaluate(TERM_READ);
  const calSaid = readSentence(calRows.title, calRows.sub);
  assert('every gap figure in the sentence names the population it was counted over',
    Number(dur[2]) === outRows.rows && outRows.rows > 0 && Number(dur[1]) > 0 &&
      Number(dur[1]) < Number(dur[2]) &&
      calSaid.noInstructorOf === calRows.rows && calSaid.noRecordingOf === calRows.rows &&
      calSaid.noInstructor > 0 && calSaid.noInstructor < calRows.rows,
    `denominators equal to the ${outRows.rows} rows the outline drew and the ${calRows.rows} the ` +
      'calendar drew, counted off the tables',
    `outline ${JSON.stringify(dur[0] || null)} over ${outRows.rows} rows, calendar ` +
      `${calSaid.noInstructor} of ${calSaid.noInstructorOf} and ${calSaid.noRecording} of ` +
      `${calSaid.noRecordingOf} over ${calRows.rows} rows`);

  await page.evaluate(`location.hash = '#/p/' + ${JSON.stringify(startedOn)}`);
  await page.waitFor(`window.ZT.programme().key === ${JSON.stringify(startedOn)}`,
    'the drawing this phase started on');
  await page.evaluate(`location.hash = '#/'`);
  await page.waitFor('window.ZT.term().open === false', 'the diagram to come back');
}

// ---- the review, issue 124 ----------------------------------------------------------------------
// THE RITUAL HAD NO ADDRESS. "Reviewing the next one to three weeks before discussing with the
// team" is a Monday, seven programmes and a meeting, and it was rebuilt from four controls every
// time. It is one link now, and this phase is seven claims about that link.
//
// NOTHING HERE READS THE PAGE'S OWN BOOKKEEPING FOR AN ANSWER IT IS ASSERTING. #121 established
// why: all 207 assertions at the time read what the page printed, which is exactly why none of
// them could catch a heading that named the wrong programme, and #122 hit the same wall when its
// closest assertion looked for a total and found it, because the page agreed with itself. So the
// window arithmetic is recomputed below by a second implementation, in the page but not shared
// with term.js: it walks window.GI, applies the window itself, ranks the rows by the two keys the
// card decided, and works out for every programme whether the window holds nothing of it and what
// the model declares against what these documents drew. What is on screen is the input to the
// comparison and never its answer.
const REVIEW_MODEL = `(function (from, to) {
  var progs = [], rows = [];
  window.GI.views.forEach(function (v) {
    var b = (v.counts || {}).CohortSession || { drawn: 0, total: 0 };
    var mine = [];
    v.nodes.forEach(function (n) {
      if (n.type !== 'CohortSession') return;
      var p = {};
      (n.props || []).forEach(function (r) { if (p[r.k] === undefined) p[r.k] = r.v; });
      var at = String(p.scheduled_at || ''), d = at.split(' ')[0] || '';
      var row = { at: at, date: d, code: v.code, key: v.key, route: v.route, id: n.id,
                  teacher: p.teacher_assigned };
      mine.push(row);
      if (d && d >= from && d <= to) rows.push(row);
    });
    mine.sort(function (a, b) { return a.at < b.at ? -1 : a.at > b.at ? 1 : 0; });
    var before = null, after = null, inWindow = 0;
    mine.forEach(function (r) {
      if (!r.date) return;
      if (r.date >= from && r.date <= to) { inWindow++; return; }
      if (r.date < from) before = r.date;              // in date order, so the last one wins
      else if (!after) after = r.date;
    });
    progs.push({ key: v.key, code: v.code, label: v.label, route: v.route,
                 drawn: b.drawn, total: b.total, complete: b.total > 0 && b.drawn >= b.total,
                 inWindow: inWindow, before: before, after: after, drawnRows: mine.length });
  });
  rows.sort(function (a, b) {
    if (a.at !== b.at) return a.at < b.at ? -1 : 1;
    if (a.code !== b.code) return a.code < b.code ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });
  var un = rows.filter(function (r) { return r.teacher !== 'yes'; });
  var st = rows.filter(function (r) { return r.teacher === 'yes'; });
  var route = {};
  rows.forEach(function (r) { route[r.id] = r.route; });
  return {
    n: rows.length, unstaffed: un.length, staffed: st.length,
    // The two orderings, because the claim is that the review is in the first and not the second
    // and an assertion that only knew the first could not tell them apart on a day they agree.
    ranked: un.concat(st).map(function (r) { return r.id; }),
    dated: rows.map(function (r) { return r.id; }),
    ids: rows.map(function (r) { return r.id; }).sort(),
    route: route,
    absent: progs.filter(function (p) { return p.inWindow === 0; }),
    programmes: progs.length,
    allDrawn: progs.reduce(function (n, p) { return n + p.drawnRows; }, 0)
  };
})`;

// What the review put on the screen, read as a reader sees it: the bands, the rows under each of
// them, the block of programmes the window holds nothing of, and the smallest control in the
// table. Nothing in here is a number the page computed about itself.
const REVIEW_READ = `(function () {
  function cells(tr) { return Array.prototype.slice.call(tr.querySelectorAll('td')); }
  var trs = Array.prototype.slice.call(document.querySelectorAll(
    '#termrows tbody tr:not(.term-group):not(.term-module):not(.term-agenda)'));
  return {
    bands: Array.prototype.map.call(document.querySelectorAll('#termrows tbody tr.rev-band th'),
      function (th) { return th.textContent; }),
    head: (document.querySelector('#termrows tbody tr.rev-head th') || {}).textContent || null,
    absent: Array.prototype.map.call(document.querySelectorAll('#termrows tbody tr.rev-absent th'),
      function (th) {
        var a = th.querySelector('a');
        return { code: a ? a.textContent : null, href: a ? a.getAttribute('href') : null,
                 text: th.textContent };
      }),
    rows: trs.map(function (tr) {
      var td = cells(tr), a = tr.querySelector('a.linkbtn');
      var p = tr.previousElementSibling;
      while (p && !p.classList.contains('rev-band')) p = p.previousElementSibling;
      return { date: td[0] ? td[0].textContent : null, code: a ? a.textContent : null,
               href: a ? a.getAttribute('href') : null,
               instructor: td[4] ? td[4].textContent : null,
               id: td[7] ? td[7].textContent : null,
               gap: tr.classList.contains('term-gap'),
               band: p ? p.textContent : null };
    }),
    title: (document.getElementById('termtitle') || {}).textContent || '',
    linkMin: (function () {
      var m = Infinity;
      Array.prototype.forEach.call(document.querySelectorAll('#termrows a.linkbtn'), function (a) {
        var r = a.getBoundingClientRect();
        if (r.width < m) m = r.width;
        if (r.height < m) m = r.height;
      });
      return m === Infinity ? null : Math.round(m * 10) / 10;
    })()
  };
})()`;

async function checkReview(page, base) {
  // ONE. THE LINK, COLD, WHICH IS THE WHOLE OF WHAT THE CARD ASKED FOR. A cold load and not a
  // hash change, because "open one link and the agenda is on the screen" is a claim about what a
  // reader who has pressed nothing gets, and every other state on this page survives a hash
  // change. The three weeks are recomputed from the anchor the control reports rather than read
  // off the window the page set.
  // A RELOAD OF THAT ADDRESS AND NOT A NAVIGATION TO IT, which is checkColdLoad's own idiom and
  // is here for a reason it records: two URLs that differ only in their fragment are the same
  // document, so navigating between them changes the hash and reloads nothing. This is the
  // reader's F5 on the link they were sent.
  await page.evaluate(`location.hash = '#/calendar'`);
  await page.reload();
  await page.waitFor(`window.ZT.term().open === true &&
                      window.ZT.term().reading === 'calendar'`,
    'the review to open cold at #/calendar');
  const t0 = await page.evaluate('window.ZT.term()');
  const head0 = await page.evaluate(TERM_READ);
  const r0 = await page.evaluate(REVIEW_READ);
  const w = t0.window;
  assert('one address opens the review, cold, on three weeks from the anchor',
    t0.shape === 'review' && w.on === true && w.weeks === 3 &&
      w.from === w.anchor && w.to === plusDays(w.anchor, 20) &&
      head0.wn && head0.wn.text === 'weeks 3 of ' + w.termWeeks &&
      r0.rows.length > 0 && / unstaffed first$/.test(r0.title),
    `the review on screen at ${w.anchor} to ${plusDays(w.anchor, 20)}, the header reading ` +
      `"weeks 3 of ${w.termWeeks}", and a heading that says what it is ranked by`,
    `shape ${t0.shape}, window ${w.weeks} weeks ${w.from} to ${w.to}, control ` +
      `${JSON.stringify(head0.wn && head0.wn.text)}, ${r0.rows.length} rows, heading ` +
      JSON.stringify(r0.title));

  // TWO. AND IT ADDED NO ADDRESS, which is the difference between this being holistic and being a
  // tenth feature. The committee wrote "a new address must retire one" and broke the rule in the
  // same document; the review takes the calendar's route instead. The list is rebuilt here from
  // window.GI rather than read, and the page's own list is checked against it: 16 the sheet
  // answers, plus the diagram, the board and the student list, plus a route and an altitude for
  // each of the seven programmes, which is 33 and is what it was before this card.
  const views = JSON.parse(await page.evaluate(
    `JSON.stringify(window.GI.views.map(function (v) {
       return { key: v.key, code: v.code, label: v.label, route: v.route }; }))`));
  const termRoutes = JSON.parse(await page.evaluate('JSON.stringify(window.ZT.termRoutes())'));
  const wantSheet = ['calendar', 'outline'].reduce(
    (a, rd) => a.concat(['#/' + rd], views.map(v => '#/' + rd + '/' + v.key)), []);
  const wantAll = ['#/', '#/board', '#/students']
    .concat(views.map(v => v.route), views.map(v => v.route + '/modules'), wantSheet);
  assert('and it added no address: the page answers the 33 it answered before, the review among them',
    termRoutes.slice().sort().join('|') === wantSheet.slice().sort().join('|') &&
      termRoutes.length === 16 && wantAll.length === 33 &&
      new Set(wantAll).size === 33 &&
      wantAll.filter(h => /review/i.test(h)).length === 0 &&
      wantAll.indexOf('#/calendar') !== -1,
    `33 addresses, ${wantSheet.length} of them the sheet's, none of them named after the review`,
    `${termRoutes.length} sheet routes ${JSON.stringify(termRoutes.slice(0, 3))}, ` +
      `${new Set(wantAll).size} addresses in all`);

  // THREE. THE ROWS ARE THE WINDOW AND NOTHING ELSE, recomputed here. The second claim is that the
  // window is taking rows off at all: without it this would pass on a review that ignored the
  // window on any day the two sets happened to coincide.
  const model = await page.evaluate(
    `${REVIEW_MODEL}(${JSON.stringify(w.from)}, ${JSON.stringify(w.to)})`);
  const shownIds = r0.rows.map(r => r.id);
  assert('the rows it shows are exactly the sessions inside that window, recomputed from window.GI',
    shownIds.slice().sort().join('|') === model.ids.join('|') &&
      shownIds.length === model.n && model.n > 0 && model.n < model.allDrawn,
    `${model.n} of the ${model.allDrawn} drawn sessions, for ${w.from} to ${w.to}`,
    `${shownIds.length} rows on screen, ${model.n} in the window by this driver's own arithmetic`);

  // FOUR. AND THEY ARE RANKED, unstaffed first, because that is the thing the meeting acts on.
  // Both bands are required to be non-empty and the ranked order is required to DIFFER from plain
  // date order, so a review that had simply kept the calendar's ordering cannot pass; and the mark
  // on each row is checked against the band it is under, so a heading that said one thing over
  // rows that were another fails too.
  const misbanded = r0.rows.filter((r, i) => r.gap !== (i < model.unstaffed) ||
    (i < model.unstaffed ? !/^Nobody named to teach these/.test(r.band || '')
                         : !/^Instructor named/.test(r.band || ''))).length;
  assert('and they are ranked unstaffed first, in date order inside each band',
    shownIds.join('|') === model.ranked.join('|') &&
      model.ranked.join('|') !== model.dated.join('|') &&
      model.unstaffed > 0 && model.staffed > 0 && misbanded === 0 &&
      r0.bands.length === 2 &&
      r0.bands[0] === `Nobody named to teach these · ${model.unstaffed} of ${model.n} in this window` &&
      r0.bands[1] === `Instructor named · ${model.staffed} of ${model.n} in this window`,
    `${model.unstaffed} unstaffed rows first and then ${model.staffed} staffed, an order the ` +
      'same rows in date order would not produce',
    `${misbanded} rows under the wrong band, bands ${JSON.stringify(r0.bands)}`);

  // FIVE. EVERY ROW IS A WAY INTO THAT PROGRAMME'S DRAWING, AT THE SAME WINDOW. The window belongs
  // to the page rather than to the sheet, which is #90's decision, so following a row leaves it
  // where it is: the assertion is the address the link carries, the programme that comes up when
  // it is followed, and the window still being the three weeks the row was in. #77's floor is on
  // it too, because this card put a control on every row of a screen a manager opens weekly.
  const wrongHref = r0.rows.filter(r => r.href !== model.route[r.id]);
  // THE LINK IS FOLLOWED ONLY IF IT NAMES A DRAWING, and the assertion carries that as a conjunct
  // rather than the driver walking into a wait it cannot satisfy. A row pointing at the page
  // instead of at its programme is exactly the defect this row is named after, and an assertion
  // that turns it into a timeout reports the group as thrown instead of reporting the claim as
  // false: a plant proves nothing about an instrument that never reached its own comparison.
  const firstRow = r0.rows[0] || null;
  const wantView = firstRow ? (views.find(v => v.route === firstRow.href) || null) : null;
  let afterFollow = null, filtered = null;
  if (wantView) {
    await page.evaluate(`location.hash = ${JSON.stringify(firstRow.href)}`);
    await page.waitFor(`window.ZT.programme().key === ${JSON.stringify(wantView.key)}`,
      `the ${wantView.key} drawing the first row links to`);
    afterFollow = await page.evaluate('window.ZT.term()');
    filtered = await page.evaluate('window.ZT.filtered()');
  }
  assert('every row links into its own programme\'s drawing, and following one keeps the window',
    wrongHref.length === 0 && r0.rows.length > 1 && !!wantView && !!afterFollow &&
      afterFollow.open === false && afterFollow.window.weeks === 3 &&
      afterFollow.window.anchor === w.anchor && afterFollow.window.from === w.from &&
      filtered && filtered.on === true && r0.linkMin >= 26,
    `${r0.rows.length} rows each carrying its own view's route, and its programme on the ` +
      `canvas at ${w.from} to ${w.to} after following the first of them`,
    `${wrongHref.length} wrong hrefs ${JSON.stringify(wrongHref.slice(0, 3))}, first row to ` +
      `${JSON.stringify(firstRow && firstRow.href)} which is ` +
      `${wantView ? wantView.key : 'no drawing this page has'}, after following: window ` +
      `${afterFollow ? afterFollow.window.weeks + ' weeks at ' + afterFollow.window.anchor : 'not followed'}` +
      `, drawing filtered ${filtered && filtered.on}, smallest link ${r0.linkMin}`);

  // ---- AND THE HALF THE FIRST DRAFT DIED ON, WHICH IS THE SAMPLE ------------------------------
  // FIVE OF THE SEVEN DRAWINGS ARE SAMPLES: Z-IB draws 6 of 79, Z-PE 6 of 36, Z-HR 6 of 25, Z-DS
  // 6 of 22, Z-CFA 6 of 45, and only Z-SC and Z-BL are whole. Rolled over real three week windows
  // this screen meets, from April, five of seven programmes with nothing in the window, and a
  // screen that reported those as absences in the business would be manufacturing five sentences a
  // week out of what these documents happen to draw. So the roll is the assertion: the anchor is
  // walked from the term's first Monday to its last through the control a reader uses, and at
  // every one of those positions the block is checked against this driver's own arithmetic.
  await page.evaluate(`location.hash = '#/calendar'`);
  await page.waitFor(`window.ZT.term().reading === 'calendar'`, 'the review again');
  await wnMenu(page, true);
  for (let i = 0; i < 40; i++) {
    const at = await page.evaluate('window.ZT.term().window.anchor');
    if (at === w.firstMonday) break;
    await pressByText(page, '#wnmenu .wn-step', '‹');
    await page.waitFor(`window.ZT.term().window.anchor !== ${JSON.stringify(at)}`,
      `the anchor to step back off ${at}`);
  }
  const rolled = [];
  for (let i = 0; i < 40; i++) {
    const at = await page.evaluate('window.ZT.term().window');
    const m = await page.evaluate(
      `${REVIEW_MODEL}(${JSON.stringify(at.from)}, ${JSON.stringify(at.to)})`);
    rolled.push({ at: at, model: m, read: await page.evaluate(REVIEW_READ) });
    if (at.anchor === at.lastMonday) break;
    await pressByText(page, '#wnmenu .wn-step', '›');
    await page.waitFor(`window.ZT.term().window.anchor !== ${JSON.stringify(at.anchor)}`,
      `the anchor to step forward off ${at.anchor}`);
  }
  await wnMenu(page, false);

  // SIX. THE PROGRAMME IS NAMED, AND WHAT IS SAID OF IT IS SAID IN THE WORDS ITS OWN STANDING
  // EARNS. Two sentences and not one with a badge: where the drawn rows ARE the term the absence
  // is the business's, and where they are 6 of 79 it is the document's and says `drawn`. The
  // partition is the model's, taken from the counts block #122 reads, so a page that printed one
  // form everywhere fails on whichever form it chose; and both halves are required to occur
  // somewhere in the roll, so a run in which no sampled programme was ever absent proves nothing
  // and says so.
  const wrongSet = [], wrongWords = [];
  let sawSampled = 0, sawComplete = 0;
  for (const x of rolled) {
    const want = x.model.absent.map(p => p.code).sort().join(',');
    const got = x.read.absent.map(a => a.code).sort().join(',');
    if (want !== got) wrongSet.push(`${x.at.from}: wanted ${want || '(none)'}, got ${got || '(none)'}`);
    for (const a of x.read.absent) {
      const p = x.model.absent.find(q => q.code === a.code);
      if (!p) continue;
      const frac = p.complete
        ? `all ${p.total} of the sessions the model counts`
        : `${p.drawn} of the ${p.total} sessions the model counts, so ${p.total - p.drawn} are ` +
          'not drawn here';
      const ok = p.complete
        ? / · no session in this window · /.test(a.text) && a.text.indexOf('drawn') === -1
        : / · no drawn session in this window · /.test(a.text);
      if (p.complete) sawComplete++; else sawSampled++;
      if (!ok || a.text.indexOf(frac) === -1) {
        wrongWords.push(`${x.at.from} ${a.code}: ${JSON.stringify(a.text.slice(0, 120))}`);
      }
    }
  }
  assert('a programme the window holds nothing of is named, and a sampled one is not reported as a term with nothing in it',
    rolled.length > 3 && wrongSet.length === 0 && wrongWords.length === 0 &&
      sawSampled > 0 && sawComplete > 0,
    `over ${rolled.length} three week windows rolled across the term, every absent programme ` +
      'named and every sentence in the form its own drawn-against-declared count earns',
    `${wrongSet.length} windows named the wrong set ${JSON.stringify(wrongSet.slice(0, 3))}, ` +
      `${wrongWords.length} sentences in the wrong form ${JSON.stringify(wrongWords.slice(0, 3))}, ` +
      `${sawSampled} sampled and ${sawComplete} complete absences seen`);

  // SEVEN. AND THE DATE IT LAST RAN, which is the other half of what the card asked the block to
  // carry and is the figure a reader would otherwise take on trust. It is the last session BEFORE
  // the window that these documents draw, and on a sampled programme it says so; where the window
  // is before everything the programme has, the next one is named instead. Both branches are
  // required to occur in the roll, because a clause that only ever prints one of them is a clause
  // with an untested half.
  const wrongDate = [];
  let sawBefore = 0, sawAfter = 0;
  for (const x of rolled) {
    for (const a of x.read.absent) {
      const p = x.model.absent.find(q => q.code === a.code);
      if (!p) continue;
      const noun = p.complete ? 'session' : 'drawn session';
      const clause = p.before ? `last ${noun} ${longDate(p.before)}`
                   : p.after ? `next ${noun} ${longDate(p.after)}`
                   : `no ${noun} anywhere in the term`;
      if (p.before) sawBefore++; else if (p.after) sawAfter++;
      if (a.text.slice(-clause.length) !== clause) {
        wrongDate.push(`${x.at.from} ${a.code}: wanted ${JSON.stringify(clause)} at the end of ` +
          JSON.stringify(a.text.slice(-60)));
      }
    }
  }
  assert('and it names the date it last ran, off the rows these documents draw and not off the model\'s total',
    wrongDate.length === 0 && sawBefore > 0 && sawAfter > 0,
    `every absent row closing on the last drawn session before its window, ${sawBefore} of them ` +
      `looking back and ${sawAfter} forward, recomputed here`,
    `${wrongDate.length} wrong ${JSON.stringify(wrongDate.slice(0, 3))}, ${sawBefore} looked ` +
      `back and ${sawAfter} forward`);

  // Left as it was found, and cold, because this phase moved the anchor and armed a window: a hash
  // change would carry both into the phases after it. The page that comes back is the one every
  // one of them was written against.
  await page.evaluate(`location.hash = '#/'`);
  await page.reload();
  await page.waitFor(DIAGRAM_READY, 'the diagram back at the default address, cold');
}

// ---- the worklist, issue 125 --------------------------------------------------------------------
// A GAP WAS A NUMBER YOU READ. The header said `gaps 8 of 95`, the menu under it listed one row per
// field, and a reader who wanted the eleven cohort sessions with nobody to teach them went and
// found them. #124 made the destination cheap, so this card made the rows a place to go, and split
// the list in two on the way.
//
// THE SPLIT IS THE CARD AND IT IS A JOIN RATHER THAN A PARTITION ANYBODY TYPED. The registry the
// model ships answers, per class, which system holds a row of it, and `system: null` means none
// does. Joined against the 95: 22 are a row that exists in a system with one field of it empty,
// which somebody can open this week, and 73 are a class no system holds at all, which no effort
// inside the tooling that exists closes. The menu showed them as one list.
//
// NOTHING HERE READS THE PAGE'S OWN BOOKKEEPING FOR AN ANSWER IT IS ASSERTING. #121 established
// why: all 207 assertions at the time read what the page printed, which is exactly why none of them
// could catch a wrong number, and #122 hit the same wall again. So GAP_SPLIT below walks window.GI,
// does the registry join itself by a second implementation not shared with app.js, and every count,
// every side and every id set asserted in this phase is compared against it. What is on screen is
// the input to the comparison and never its answer.
const GAP_SPLIT = `(function (viewKey, from, to) {
  var reg = window.GI.routes.classes, by = {}, keys = [];
  window.GI.views.forEach(function (v) {
    if (viewKey && v.key !== viewKey) return;
    v.nodes.forEach(function (n) {
      // The ghosts are the absence itself rather than a hole in something present, which is the
      // exclusion this count has carried since #98 and is not what the split is about.
      if (n.ghost) return;
      var props = n.props || [], i, p, k, at = '', d;
      // A window narrows the sessions and nothing else, because a window is a fact about dates and
      // only one class on this page carries one.
      if (from) {
        if (n.type !== 'CohortSession') return;
        props.forEach(function (r) { if (r.k === 'scheduled_at' && !at) at = String(r.v || ''); });
        d = at.split(' ')[0] || '';
        if (!(d && d >= from && d <= to)) return;
      }
      // The boundary is the node's own route index: the rows before it answer how a class gets
      // filled at all, which is a fact about the class and identical on every tile of it.
      for (i = (n.route || 0); i < props.length; i++) {
        p = props[i];
        if (p.f !== 'absent') continue;
        k = n['class'] + '/' + p.k;
        if (!by[k]) {
          keys.push(k);
          by[k] = { cls: n['class'], type: n.type, field: p.k, n: 0, ids: [],
                    system: !!(reg[n['class']] && reg[n['class']].system) };
        }
        by[k].n++;
        by[k].ids.push(n.id);
      }
    });
  });
  function side(s) {
    return keys.reduce(function (a, k) { return a + (by[k].system === s ? by[k].n : 0); }, 0);
  }
  var ghost = window.GI.types.filter(function (t) { return t.k === 'Ghost'; })[0] || {};
  return { rows: keys.map(function (k) { return by[k]; }),
           work: side(true), settled: side(false), total: side(true) + side(false),
           // The two strings the menu's second heading is required to be READ from rather than to
           // have typed into it, which is this card's other half: three words for two findings was
           // what the page had, and a noun written into app.js would have made it four.
           ghostLabel: ghost.label || '',
           why: (window.GI.routes.vocab.read || {})['no-source'] || '' };
})`;

// The menu as a reader meets it: the children in the order they are painted, what each one is, the
// field it names, the number beside it and the box it offers a finger. Nothing here is a figure the
// page computed about itself.
const GAP_MENU = `(function () {
  var m = document.getElementById('gapsmenu');
  return JSON.stringify({
    open: !m.hidden,
    val: (document.getElementById('gapsval') || {}).textContent || '',
    kids: Array.prototype.map.call(m.children, function (el) {
      var r = el.getBoundingClientRect();
      var code = el.querySelector ? el.querySelector('code') : null;
      var num = el.querySelector ? el.querySelector('.gaps-n') : null;
      return { tag: el.tagName, cls: el.className, text: el.textContent,
               field: code ? code.textContent : null,
               n: num ? Number(num.textContent) : null,
               w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 };
    }),
    // The third place the same finding is named, read here so an assertion can require the page to
    // have one wording for it and not two.
    ghostTitle: (document.getElementById('ghtoggle') || {}).title || ''
  });
})()`;

// The group rows the review prints that are not bands: the sentence a worklist with nothing on it
// leaves behind. REVIEW_READ reads the bands and the absent block; this reads what is left.
const TERM_GROUPS = `(function () {
  return JSON.stringify(Array.prototype.map.call(
    document.querySelectorAll('#termrows tbody tr.term-group th'),
    function (th) { return { cls: th.parentNode.className, text: th.textContent }; }));
})()`;

// How many sessions a scope holds and how many of them a window leaves, off window.GI, because
// every denominator this phase asserts is one of those two and neither may be read off the sheet.
function sessionCount(page, viewKey, from, to) {
  return page.evaluate(`(function () {
    var n = 0;
    window.GI.views.forEach(function (v) {
      if (${JSON.stringify(viewKey)} && v.key !== ${JSON.stringify(viewKey)}) return;
      v.nodes.forEach(function (node) {
        if (node.type !== 'CohortSession') return;
        var at = '';
        (node.props || []).forEach(function (p) {
          if (p.k === 'scheduled_at' && !at) at = String(p.v || '');
        });
        var d = at.split(' ')[0] || '';
        if (${from ? 'true' : 'false'} && !(d && d >= ${JSON.stringify(from || '')} &&
                                            d <= ${JSON.stringify(to || '')})) return;
        n++;
      });
    });
    return n;
  })()`);
}

// Press the row of the gaps menu that names one field, by the field it names and not by its
// position, so a reordering of the menu moves the press with it.
async function pressGapRow(page, field) {
  const ok = await page.evaluate(`(function () {
    var rows = Array.prototype.slice.call(document.querySelectorAll('#gapsmenu .gaps-go'));
    for (var i = 0; i < rows.length; i++) {
      var c = rows[i].querySelector('code');
      if (c && c.textContent === ${JSON.stringify(field)}) { rows[i].click(); return true; }
    }
    return false;
  })()`);
  if (!ok) throw new Error(`no pressable gap row naming ${field}`);
  await page.waitFor(`window.ZT.term().open === true &&
                      window.ZT.term().gap === ${JSON.stringify(field)}`,
    `the worklist the ${field} row named`);
}

async function checkWorklist(page, base) {
  // ONE. THE SPLIT, SUMMED OVER THE SEVEN DRAWINGS AND RECOMPUTED AGAINST THE REGISTRY. The
  // control counts what one view is showing, so the whole of the 95 is only visible as a walk, and
  // the walk is the assertion: each drawing's two sides, each row's own side, and each row's own
  // set of objects, against a join this driver does itself. Both sides are required to be
  // non-empty, because a page that had put every row on one side would otherwise pass on any
  // drawing that happened to hold only that kind.
  const all = JSON.parse(await page.evaluate(`JSON.stringify(${GAP_SPLIT}(null, null, null))`));
  const views = JSON.parse(await page.evaluate(
    `JSON.stringify(window.GI.views.map(function (v) { return { key: v.key, route: v.route }; }))`));
  let work = 0, settled = 0, ofAll = null;
  const wrongSide = [];
  for (const v of views) {
    await page.evaluate(`location.hash = ${JSON.stringify(v.route)}`);
    await page.waitFor(`window.ZT.programme().key === ${JSON.stringify(v.key)}`,
      `the ${v.key} drawing`);
    const g = await page.evaluate('window.ZT.gaps()');
    work += g.work;
    settled += g.settled;
    ofAll = g.of;
    const mine = JSON.parse(await page.evaluate(
      `JSON.stringify(${GAP_SPLIT}(${JSON.stringify(v.key)}, null, null))`));
    if (mine.rows.length !== g.rows.length) wrongSide.push(`${v.key} has ${g.rows.length} rows`);
    for (const r of g.rows) {
      const m = mine.rows.find(q => q.cls === r.cls && q.field === r.field);
      if (!m || m.system !== r.system || m.n !== r.n ||
          m.ids.slice().sort().join(',') !== r.ids.slice().sort().join(',')) {
        wrongSide.push(`${v.key} ${r.cls} ${r.field}`);
      }
    }
  }
  assert('the 95 are two kinds of thing, and which kind a row is comes off the registry rather than out of a list in the page',
    work === all.work && settled === all.settled && work + settled === ofAll &&
      work + settled === all.total && work > 0 && settled > 0 && wrongSide.length === 0,
    `${all.work} rows a system holds with a field empty and ${all.settled} whose class no system ` +
      `holds, ${all.total} in all, every one on the side routes.classes gives it`,
    `${work} and ${settled} summed over the seven drawings against ${all.work} and ${all.settled} ` +
      `recomputed here, the readout naming ${ofAll}, ${wrongSide.length} rows on the wrong side ` +
      `or over the wrong objects ${JSON.stringify(wrongSide.slice(0, 3))}`,
    `${all.work} work and ${all.settled} settled of ${all.total}, ${ofAll} on the readout`);

  // TWO. AND THE HEADINGS OVER THEM ARE THE MODEL'S OWN WORDS. Z-SC is the drawing that carries
  // both sides, so it is where the pair can be read at once. The second heading is the thing this
  // card was told to reduce: the page said `gaps`, said `ghosts`, and the registry said of the same
  // classes that nothing holds a row for them, which is one finding under three words. It is read
  // from the ghost type's own label and from the registry's own sentence, and the toggle in the
  // header that switches those tiles is required to be naming the same thing in the same words, so
  // a noun typed into app.js fails here rather than quietly becoming a fourth.
  await page.evaluate(`location.hash = '#/p/ZSC'`);
  await page.waitFor(`window.ZT.programme().key === 'ZSC'`, 'the Z-SC drawing');
  await gapsMenu(page, true);
  const menu = JSON.parse(await page.evaluate(GAP_MENU));
  const zsc = JSON.parse(await page.evaluate(`JSON.stringify(${GAP_SPLIT}('ZSC', null, null))`));
  const heads = menu.kids.filter(k => k.cls === 'gaps-head');
  const whys = menu.kids.filter(k => k.cls === 'gaps-why');
  const headAt = menu.kids.indexOf(heads[1]);
  assert('the two sides are under two headings, work first, and the second is read from the model rather than typed into the page',
    heads.length === 2 && whys.length === 1 &&
      heads[0].text === `A system holds the row and the field is empty · ${zsc.work}` &&
      heads[1].text === `The class ${zsc.ghostLabel} · ${zsc.settled}` &&
      whys[0].text === zsc.why && zsc.ghostLabel !== '' && zsc.why !== '' &&
      menu.kids[0].cls === 'gaps-scope' && menu.kids[1] === heads[0] &&
      menu.kids[headAt + 1] === whys[0] &&
      menu.kids[menu.kids.length - 1].cls === 'gaps-foot' &&
      menu.ghostTitle.indexOf('exist in any system') !== -1,
    `"A system holds the row and the field is empty · ${zsc.work}" first and then "The class ` +
      `${zsc.ghostLabel} · ${zsc.settled}" with the registry's own reason under it, the same ` +
      'words the toggle for those tiles uses',
    `${heads.length} headings ${JSON.stringify(heads.map(h => h.text))}, reason ` +
      `${JSON.stringify(whys.map(w => w.text))}, toggle ${JSON.stringify(menu.ghostTitle)}`,
    `${JSON.stringify(heads.map(h => h.text))}`);

  // THREE. ONLY THE ROWS THE PAGE CAN ANSWER FOR ARE CONTROLS. A row of work whose objects the page
  // lists somewhere is a button and everything else is text, and the difference is visible before
  // the press rather than after it. The expectation is computed from the registry join and from the
  // ids each row is over, not read off the markup, so a page that made every row pressable and one
  // that made none fail in opposite directions. #77's floor is on each of them, because an element
  // that is a button for the first time does not get it by construction.
  const rowKids = menu.kids.filter(k => /(^| )gaps-row( |$)/.test(k.cls));
  const wantGo = zsc.rows.filter(r => r.system && (r.type === 'CohortSession' || r.ids.length === 1))
    .map(r => r.field).sort();
  const gotGo = rowKids.filter(k => k.tag === 'BUTTON').map(k => k.field).sort();
  const undersized = rowKids.filter(k => k.tag === 'BUTTON' && Math.min(k.w, k.h) < 26);
  assert('only the rows the page can take a reader to are controls, and each of those is a target of at least 26 by 26',
    gotGo.length > 0 && rowKids.length > gotGo.length &&
      gotGo.join(',') === wantGo.join(',') && undersized.length === 0 &&
      rowKids.length === zsc.rows.length,
    `${wantGo.length} of the ${zsc.rows.length} rows pressable, ${wantGo.join(', ')}, none of ` +
      'them under 26 by 26',
    `${gotGo.length} pressable ${JSON.stringify(gotGo)}, ${rowKids.length} rows in all, ` +
      `${undersized.length} under the floor ${JSON.stringify(undersized.map(k => k.w + 'x' + k.h))}`,
    `${gotGo.length} of ${rowKids.length} pressable`);

  // FOUR. AND PRESSING ONE LANDS ON EXACTLY THE OBJECTS IT COUNTED. This is the claim the card is
  // about and the one an assertion reading the page's own bookkeeping could not make: the number on
  // the row and the ids in the table are compared against one set this driver built, and the set is
  // required to be smaller than the sessions the programme holds, so a filter that did nothing
  // cannot pass on a day the two happened to agree.
  const zscSessions = await sessionCount(page, 'ZSC', null, null);
  const zscWant = zsc.rows.find(r => r.field === 'teacher_assigned');
  await pressGapRow(page, 'teacher_assigned');
  const zscHash = await page.evaluate('location.hash');
  const zscRead = await page.evaluate(REVIEW_READ);
  const zscIds = zscRead.rows.map(r => r.id).slice().sort().join(',');
  assert('pressing a row lands on exactly the objects it counted, recomputed from window.GI',
    zscHash === '#/calendar/ZSC?gap=teacher_assigned' &&
      zscIds === zscWant.ids.slice().sort().join(',') &&
      zscRead.rows.length === zscWant.n && zscWant.n > 0 && zscWant.n < zscSessions &&
      zscRead.title.slice(-(` ${zscWant.n} of ${zscSessions} sessions, the ones with no ` +
        'teacher_assigned').length) ===
        ` ${zscWant.n} of ${zscSessions} sessions, the ones with no teacher_assigned`,
    `the ${zscWant.n} of Z-SC's ${zscSessions} sessions the row named, at ` +
      `#/calendar/ZSC?gap=teacher_assigned, under a heading that says which of the two figures ` +
      'is which',
    `${zscRead.rows.length} rows at ${zscHash}, ids ${JSON.stringify(zscRead.rows.map(r => r.id))} ` +
      `against ${JSON.stringify(zscWant.ids)}, heading ${JSON.stringify(zscRead.title)}`,
    `${zscWant.n} of ${zscSessions}`);

  // FIVE. A WORKLIST KEEPS THE WINDOW THAT WAS IN FORCE. #124 made the review open on three weeks
  //
  // AND THE PLANT THAT FIRES THIS ONE TAKES TWO LINES OUT OF term.js AND NOT ONE, which was
  // measured rather than assumed: `show()` sets `winTouched` before it works out whether to arm,
  // and armReview() refuses on `winTouched`, so the `!gapField` conjunct beside it and that
  // assignment are one rule guarded twice and either alone still holds the arrival. Deleting the
  // conjunct on its own leaves this suite clean at 232 of 232, which is worth writing down: it is
  // not that the assertion is weak, it is that the code is doubled. Both lines gone and this
  // fails, and so do the four assertions after it, which is the right shape for a defect that
  // moves the window under every worklist on the page.
  // where the reader has said nothing, and a worklist address is the reader having said something:
  // it names a set that was counted over the window they had, so a default arriving after it would
  // hand them one number on the control and another on the screen. Driven from a drawing, where the
  // sheet has never been opened and the window is the whole term, and from the review's own cold
  // address, where it is three weeks; the two counts differ, so neither half can pass on the other.
  // Z-DS AND NOT Z-CFA, WHICH THE FIRST DRAFT OF THIS PHASE USED AND WHICH MADE ONE CONJUNCT
  // UNFALSIFIABLE: every one of Z-CFA's six drawn sessions is unstaffed, so its worklist and its
  // whole term are the same six rows and "the way off gives back more than the filter left" could
  // not fail there. Z-DS draws six and three of them are unstaffed.
  await page.evaluate(`location.hash = '#/p/ZDS'`);
  await page.reload();
  await page.waitFor(DIAGRAM_READY, 'the Z-DS drawing, cold');
  const dsWant = JSON.parse(await page.evaluate(`JSON.stringify(${GAP_SPLIT}('ZDS', null, null))`))
    .rows.find(r => r.field === 'teacher_assigned');
  await gapsMenu(page, true);
  await pressGapRow(page, 'teacher_assigned');
  const dsTerm = await page.evaluate('window.ZT.term()');
  const dsRead = await page.evaluate(REVIEW_READ);

  // SIX, TAKEN HERE BECAUSE IT IS THIS STATE'S. THE WAY OFF GIVES BACK THE NUMBER IT NAMES. A
  // filter with no way off it is a dead end, and a way off that re-armed the review's default would
  // offer `all 6 sessions` and deliver whatever three weeks held. The link's own text is parsed for
  // the figure it promises and the rows that arrive are counted against it.
  const dsAll = await sessionCount(page, 'ZDS', null, null);
  const bar = await page.evaluate(`(function () {
    var a = document.querySelector('.term-gapbar a');
    return a ? JSON.stringify({ text: a.textContent, href: a.getAttribute('href') }) : 'null';
  })()`);
  const barLink = JSON.parse(bar);
  if (barLink) await page.evaluate(`document.querySelector('.term-gapbar a').click()`);
  await page.waitFor(`window.ZT.term().gap === null`, 'the way off the worklist');
  const offRead = await page.evaluate(REVIEW_READ);
  const offTerm = await page.evaluate('window.ZT.term()');
  assert('the way off the worklist gives back exactly the number it names',
    !!barLink && barLink.text === `all ${dsAll} sessions` && barLink.href === '#/calendar/ZDS' &&
      offRead.rows.length === dsAll && offTerm.window.on === false &&
      offTerm.window.weeks === 0 && dsAll > dsWant.n,
    `a link reading "all ${dsAll} sessions" and ${dsAll} rows after it, on the window that was ` +
      'in force and not on a default',
    `${JSON.stringify(barLink)}, ${offRead.rows.length} rows after following it, window ` +
      `${offTerm.window.weeks} weeks on ${offTerm.window.on}`,
    `link "all ${dsAll} sessions", ${offRead.rows.length} rows back`);

  await page.evaluate(`location.hash = '#/calendar'`);
  await page.reload();
  await page.waitFor(`window.ZT.term().open === true && window.ZT.term().reading === 'calendar'`,
    'the review cold, on its three weeks');
  const w = (await page.evaluate('window.ZT.term()')).window;
  const inWin = JSON.parse(await page.evaluate(
    `JSON.stringify(${GAP_SPLIT}(null, ${JSON.stringify(w.from)}, ${JSON.stringify(w.to)}))`));
  const winWant = inWin.rows.find(r => r.field === 'teacher_assigned');
  const winAll = await sessionCount(page, null, w.from, w.to);
  await gapsMenu(page, true);
  await pressGapRow(page, 'teacher_assigned');
  const winTerm = await page.evaluate('window.ZT.term()');
  const winRead = await page.evaluate(REVIEW_READ);
  assert('a worklist keeps the window that was in force rather than arming the review\'s own default',
    dsTerm.window.on === false && dsTerm.window.weeks === 0 &&
      dsRead.rows.length === dsWant.n && dsWant.n > 0 &&
      winTerm.window.weeks === 3 && winTerm.window.from === w.from &&
      winTerm.window.to === w.to && winRead.rows.length === winWant.n &&
      winRead.title.indexOf(`${winWant.n} of ${winAll} sessions`) !== -1 &&
      dsWant.n !== winWant.n,
    `${dsWant.n} rows off the whole term from the drawing and ${winWant.n} of ${winAll} off the ` +
      `three weeks the review opened on, ${w.from} to ${w.to}, neither replaced by the other`,
    `from the drawing ${dsRead.rows.length} rows at ${dsTerm.window.weeks} weeks, from the ` +
      `review ${winRead.rows.length} rows at ${winTerm.window.weeks} weeks ${winTerm.window.from}` +
      `, heading ${JSON.stringify(winRead.title)}`,
    `${dsWant.n} whole term, ${winWant.n} of ${winAll} in three weeks`);

  // SEVEN. A FIELD THE SHEET CANNOT ANSWER FOR IS NOT A FILTER AT ALL. A `?gap=` naming a field no
  // session carries would leave the screen empty, and "0 sessions with no elephant" is a finding
  // invented out of a typo; it falls back to every row, which is the answer a programme code nobody
  // has already gets. And the worklist is the calendar's, so a `?gap=` on the outline is read as
  // nothing rather than carried and never acted on: a state a sheet holds and does not draw is a
  // state that will one day be acted on by accident.
  await page.evaluate(`location.hash = '#/calendar?gap=elephant'`);
  await page.reload();
  await page.waitFor(`window.ZT.term().open === true && window.ZT.term().reading === 'calendar'`,
    'the review at an address naming a field nothing carries');
  const elTerm = await page.evaluate('window.ZT.term()');
  const elRead = await page.evaluate(REVIEW_READ);
  const elBar = await page.evaluate(`!!document.querySelector('.term-gapbar')`);
  const elAll = await sessionCount(page, null, elTerm.window.from, elTerm.window.to);
  await page.evaluate(`location.hash = '#/outline?gap=teacher_assigned'`);
  await page.waitFor(`window.ZT.term().reading === 'outline'`, 'the outline at a worklist address');
  const ouTerm = await page.evaluate('window.ZT.term()');
  const ouBar = await page.evaluate(`!!document.querySelector('.term-gapbar')`);
  assert('a field the reading cannot answer for is not a filter at all, and the outline is not a worklist',
    elTerm.gap === null && elRead.rows.length === elAll && elAll > 0 && elBar === false &&
      elRead.title.indexOf('the ones with no') === -1 &&
      ouTerm.gap === null && ouBar === false && ouTerm.templates > 0,
    `every one of the ${elAll} rows in the window still listed under an unfiltered heading, and ` +
      'the outline reading its own rows with no worklist on it',
    `gap ${JSON.stringify(elTerm.gap)} with ${elRead.rows.length} of ${elAll} rows, bar ${elBar}` +
      `, heading ${JSON.stringify(elRead.title)}; outline gap ${JSON.stringify(ouTerm.gap)}, ` +
      `bar ${ouBar}, ${ouTerm.templates} rows`,
    `${elRead.rows.length} of ${elAll} rows, no filter`);

  // EIGHT. AND WHERE THE WORKLIST COMES UP EMPTY, THE SENTENCE IS OVER THE ROWS THAT WERE DRAWN.
  // This is #122's rule met in its most flattering direction and it is the one a manager would most
  // like to believe: "everything here is staffed" read off six sessions of seventy nine is a
  // property of a document. Z-IB draws 6 of 79 and says `drawn` and carries the fraction; Z-BL
  // draws all 28 and says neither. Both forms are required, so a page that chose one and printed it
  // everywhere fails on whichever it did not choose.
  const emptyWords = {};
  for (const key of ['ZIB', 'ZBL']) {
    await page.evaluate(`location.hash = '#/calendar/${key}?gap=teacher_assigned'`);
    await page.reload();
    await page.waitFor(`window.ZT.term().open === true && window.ZT.term().scope === '${key}'`,
      `the ${key} worklist`);
    emptyWords[key] = {
      rows: (await page.evaluate(REVIEW_READ)).rows.length,
      groups: JSON.parse(await page.evaluate(TERM_GROUPS))
    };
  }
  const counts = JSON.parse(await page.evaluate(
    `JSON.stringify(window.GI.views.reduce(function (a, v) {
       a[v.key] = (v.counts || {}).CohortSession || {}; return a; }, {}))`));
  const ib = counts.ZIB, bl = counts.ZBL;
  const ibWant = `All ${ib.drawn} drawn sessions in this window record a teacher_assigned · ` +
    `${ib.drawn} of the ${ib.total} sessions the model counts, so ${ib.total - ib.drawn} are ` +
    'not drawn here';
  const blWant = `All ${bl.drawn} sessions in this window record a teacher_assigned · all ` +
    `${bl.total} of the sessions the model counts`;
  const ibGot = emptyWords.ZIB.groups.map(g => g.text).join(' // ');
  const blGot = emptyWords.ZBL.groups.map(g => g.text).join(' // ');
  assert('an empty worklist on a sampled programme says so over the rows that were drawn, and on a complete one does not',
    emptyWords.ZIB.rows === 0 && emptyWords.ZBL.rows === 0 &&
      ib.drawn < ib.total && bl.drawn === bl.total &&
      ibGot === ibWant && blGot === blWant && blGot.indexOf('drawn') === -1,
    `Z-IB reading ${JSON.stringify(ibWant)} and Z-BL ${JSON.stringify(blWant)}`,
    `Z-IB ${emptyWords.ZIB.rows} rows and ${JSON.stringify(ibGot)}, Z-BL ` +
      `${emptyWords.ZBL.rows} rows and ${JSON.stringify(blGot)}`,
    `Z-IB ${ib.drawn} of ${ib.total} drawn, Z-BL ${bl.drawn} of ${bl.total}`);

  // NINE. AND A PROGRAMME MISSING FROM A WORKLIST SAYS WHICH OF THE TWO REASONS IT IS. With a
  // worklist on there are two ways to be absent and they are different findings: the window holds
  // nothing of that programme at all, or it holds rows and not one of them carries the gap. The
  // second reads as good news, and on five of the seven drawings it is read off six sessions of
  // seventy nine. The set is recomputed here, per programme, and so is the form of each sentence.
  await page.evaluate(`location.hash = '#/calendar?gap=teacher_assigned'`);
  await page.reload();
  await page.waitFor(`window.ZT.term().open === true &&
                      window.ZT.term().gap === 'teacher_assigned'`, 'the worklist over the term');
  const termRead = await page.evaluate(REVIEW_READ);
  const termWant = JSON.parse(await page.evaluate(`JSON.stringify(${GAP_SPLIT}(null, null, null))`))
    .rows.find(r => r.field === 'teacher_assigned');
  const hit = {};
  termWant.ids.forEach(id => { hit[id] = true; });
  const perView = JSON.parse(await page.evaluate(
    `JSON.stringify(window.GI.views.map(function (v) {
       return { key: v.key, code: v.code, counts: (v.counts || {}).CohortSession || {},
                ids: v.nodes.filter(function (n) { return n.type === 'CohortSession'; })
                            .map(function (n) { return n.id; }) }; }))`));
  const wantAbsent = perView.filter(v => v.ids.every(id => !hit[id]));
  const wrongWords = [];
  for (const a of termRead.absent) {
    const v = perView.find(q => q.code === a.code);
    if (!v) { wrongWords.push(`${a.code} is no programme this page has`); continue; }
    const complete = v.counts.total > 0 && v.counts.drawn >= v.counts.total;
    const noun = complete ? 'session' : 'drawn session';
    const want = `${v.code} · all ${v.counts.drawn} of its ${noun}s in this window record a ` +
      'teacher_assigned · ' + (complete
        ? `all ${v.counts.total} of the sessions the model counts`
        : `${v.counts.drawn} of the ${v.counts.total} sessions the model counts, so ` +
          `${v.counts.total - v.counts.drawn} are not drawn here`);
    if (a.text !== want) wrongWords.push(`${a.code}: ${JSON.stringify(a.text.slice(0, 110))}`);
  }
  const sampled = termRead.absent.filter(a => a.text.indexOf('drawn') !== -1).length;
  assert('a programme with nothing on the worklist says which of the two absences it is, in the words its own drawn count earns',
    termRead.absent.map(a => a.code).sort().join(',') ===
      wantAbsent.map(v => v.code).sort().join(',') &&
      wantAbsent.length > 0 && wantAbsent.length < perView.length &&
      termRead.head === `Nothing on this worklist · ${wantAbsent.length} of the ` +
        `${perView.length} programmes` &&
      wrongWords.length === 0 && sampled > 0 && sampled < termRead.absent.length,
    `${wantAbsent.length} of the ${perView.length} programmes named, ` +
      `${wantAbsent.map(v => v.code).sort().join(', ')}, each sentence in the form its own ` +
      'drawn-against-declared count earns',
    `${termRead.absent.length} named ${JSON.stringify(termRead.absent.map(a => a.code))} against ` +
      `${JSON.stringify(wantAbsent.map(v => v.code))}, head ${JSON.stringify(termRead.head)}, ` +
      `${wrongWords.length} wrong sentences ${JSON.stringify(wrongWords.slice(0, 3))}`,
    `${wantAbsent.length} of ${perView.length} programmes, ${sampled} of them sampled`);

  // Left as it was found, and cold, for the reason `the review` gives: this phase armed no window
  // but it drove six addresses and opened the sheet, and the page every phase after it was written
  // against is the one that comes back.
  await page.evaluate(`location.hash = '#/'`);
  await page.reload();
  await page.waitFor(DIAGRAM_READY, 'the diagram back at the default address, cold');
}

// ---- what the header says needs attention, issue 98 ---------------------------------------------
// EIGHT ASSERTIONS AND EVERY ONE OF THEM IS A DECISION THAT CARD TOOK, not a reading of what the
// code happens to do. The card put a count in the header, and a count is the easiest thing on a
// page to ship wrong in a way that looks right: a number that is off by the wrong set is still a
// number, still updates, still renders, and nothing but arithmetic can tell it from the true one.
//
// SO NOTHING HERE READS THE COUNT AND THEN ASSERTS THE COUNT. Every figure below is recomputed in
// the page from window.GI, the instance document itself, by a second implementation written here
// and not shared with app.js, and the control's own answer is checked against it. A change that
// broke the boundary between a route row and a value row would move one of the two and not the
// other. This is the same shape as the term phase counting its rows rather than trusting the
// subtitle over them, and as the reflow check in the drawing.
const GAPS_FROM_MODEL = `(function () {
  var out = { value: 0, route: 0, ghost: 0, byView: {}, byType: {} };
  window.GI.views.forEach(function (v) {
    var n = 0;
    v.nodes.forEach(function (node) {
      var first = node.route || 0;
      (node.props || []).forEach(function (p, i) {
        if (p.f !== 'absent') return;
        if (i < first) { out.route++; return; }
        if (node.ghost) { out.ghost++; return; }
        n++; out.value++;
        var k = node.type + '.' + p.k;
        out.byType[k] = (out.byType[k] || 0) + 1;
      });
    });
    out.byView[v.key] = n;
  });
  return JSON.stringify(out);
})()`;

// The same arithmetic again, over the ids the drawing says are on screen. It reads
// window.ZT.filtered().shown, which is render.js's own record of what the window left, so a count
// that agreed with the model but not with the picture would fail here.
const GAPS_ON_SHOWN = `(function () {
  var shown = {}, n = 0, key = window.ZT.programme().key;
  window.ZT.filtered().shown.forEach(function (id) { shown[id] = true; });
  window.GI.views.forEach(function (v) {
    if (v.key !== key) return;
    v.nodes.forEach(function (node) {
      if (!shown[node.id] || node.ghost) return;
      var first = node.route || 0;
      (node.props || []).forEach(function (p, i) { if (p.f === 'absent' && i >= first) n++; });
    });
  });
  return n;
})()`;

const GAPS_MENU_READ = `(function () {
  var rows = Array.prototype.slice.call(document.querySelectorAll('#gapsmenu .gaps-row'));
  return JSON.stringify({
    open: !document.getElementById('gapsmenu').hidden,
    expanded: document.getElementById('gapsbtn').getAttribute('aria-expanded'),
    text: document.getElementById('gapsbtn').textContent,
    sum: rows.reduce(function (n, r) {
      return n + Number(r.querySelector('.gaps-n').textContent);
    }, 0),
    rows: rows.length,
    scope: (document.querySelector('#gapsmenu .gaps-scope') || {}).textContent || '',
    fields: rows.map(function (r) { return r.querySelector('code').textContent; })
  });
})()`;

async function gapsMenu(page, want) {
  const open = await page.evaluate(`!document.getElementById('gapsmenu').hidden`);
  if (open !== want) await page.evaluate(`document.getElementById('gapsbtn').click()`);
  await page.waitFor(`(!document.getElementById('gapsmenu').hidden) === ${want ? 'true' : 'false'}`,
    `the gap list to ${want ? 'open' : 'close'}`);
}

// ---- the cut, issue 128 -------------------------------------------------------------------------
// THE OWNER: "the page is still too verbose on the control center etc. remove a lot of text". A
// deletion card, and a deletion card is the one kind whose work the next card silently undoes: a
// sentence is one line to put back, nothing breaks when it comes back, and nobody notices until
// the page reads the way it read before. So the cut is held by assertions rather than by the
// diff, and each of them is a claim about what is NOT on the page any more together with the
// figure that had to survive in its place.
//
// EVERY ONE OF THE EIGHT IS RECOMPUTED. The lengths are measured on the elements, the fraction on
// the students card is rebuilt out of the view's own nodes, the empty window's sentence is built
// from the window state and the driver's own date formatter, and the captions are read off
// window.GL. Nothing here asks the page whether it thinks it is short.
const CUT_MENU_PARAS = `(function () {
  // Every paragraph in the four menus of the header's readout and its nav, and only the ones that
  // are prose: a row of buttons is a control and not a sentence.
  var out = [];
  ['#wnmenu', '#grmenu', '#gapsmenu', '#thmenu'].forEach(function (sel) {
    var m = document.querySelector(sel);
    if (!m || m.hidden) return;
    Array.prototype.forEach.call(m.querySelectorAll('p'), function (p) {
      if (p.querySelector('button')) return;
      var t = p.textContent.replace(/\\s+/g, ' ').trim();
      if (!t) return;
      out.push({ where: sel + ' .' + (String(p.className).split(/\\s+/)[0] || '(none)'),
                 n: t.length, text: t.slice(0, 120) });
    });
  });
  return JSON.stringify(out);
})()`;

// Every note the document carries, walked here rather than taken from any list the page keeps.
const CUT_NOTES = `(function () {
  var notes = [];
  (function walk(o) {
    if (!o || typeof o !== 'object') return;
    if (Object.prototype.toString.call(o) === '[object Array]') {
      for (var i = 0; i < o.length; i++) walk(o[i]);
      return;
    }
    if (typeof o.note === 'string' && o.note) notes.push(o.note);
    for (var k in o) {
      if (k !== 'note' && Object.prototype.hasOwnProperty.call(o, k)) walk(o[k]);
    }
  })(window.GI);
  return JSON.stringify(notes);
})()`;

// The students card and the individuals it draws, per view, off the instance document.
const CUT_STUDENT_CARDS = `(function () {
  return JSON.stringify(window.GI.views.map(function (v) {
    var card = null, drawn = 0;
    v.nodes.forEach(function (n) {
      if (n.type === 'StudentGroup') card = n;
      if (n.type === 'Student') drawn++;
    });
    var head = null;
    if (card) (card.props || []).forEach(function (p) { if (p.k === 'headcount') head = p.v; });
    return { key: v.key, drawn: drawn, head: head, note: card ? (card.note || '') : null };
  }));
})()`;

// Every caption line on every one of the fourteen drawings, off the geometry document, plus the
// lines actually painted on the one that is on screen.
const CUT_CAPTIONS = `(function () {
  var lines = [];
  window.GL.views.forEach(function (v) {
    (v.drawing.bands || []).forEach(function (b) {
      (b.lines || [b.label]).forEach(function (l) { lines.push(v.key + '/' + v.grain + ' ' + l); });
    });
  });
  var painted = [];
  Array.prototype.forEach.call(document.querySelectorAll('#graph text.band-cap'), function (t) {
    painted.push(t.textContent);
  });
  return JSON.stringify({ lines: lines, painted: painted });
})()`;

// A gesture named in words. `click` and the rest are what the two captions this card took off the
// canvas said, and what three of the five help items said; the help is where they live now, so
// the sweep is over the drawing and never over the help box.
const GESTURE_WORDS = /\bon click\b|\bclick\b|\bpress\b|\bdrag\b|\bscroll\b|\btap\b|\bhover\b/i;

async function checkCut(page, base) {
  // THE STATE THIS PHASE FOUND, RECORDED BEFORE IT MOVES ANYTHING. It opens the review, which
  // arms a three week window, and `header`, `canvas` and `capture` after it all read a drawing
  // with every tile on it. A phase that leaves a window on is a phase that makes three later
  // ones fail for a reason that is not theirs, which is what the first run of this one did.
  const winWas = JSON.parse(await page.evaluate('JSON.stringify(window.ZT.term().window)'));
  // AND THE DRAWING, for the same reason and it cost the same lesson twice. `#/` is the default
  // ADDRESS and not a reset: it keeps the programme and the altitude the reader was last on, so
  // a phase that visits Z-BL at the modules grain and then goes to `#/` has left Z-BL's modules
  // on screen. `capture` then looks for a Z-IB instructor and finds nothing.
  const hashWas = await page.evaluate('location.hash');
  const pgWas = await page.evaluate('window.ZT.programme().key');
  const routeWas = await page.evaluate(
    `(function () { var r = null; window.GI.views.forEach(function (v) {
       if (v.key === window.ZT.programme().key) r = v.route; }); return r; })()`);

  // ---- 1. the control centre holds figures, not paragraphs ------------------------
  // THE CARD'S OWN SUBJECT, AND A RATCHET RATHER THAN A DESCRIPTION. Two paragraphs in the window
  // menu ran to 328 and 282 characters, saying what the anchor is not and what each of the four
  // surfaces does with the window. Both are gone and what is left in each is its figures. 200 is
  // above every paragraph these menus now carry and below both of the two that went, so the
  // assertion refuses the state this card was filed about and passes the state it left.
  //
  // BOTH ALTITUDES, because the grain menu's paragraph only has anything to say where something
  // folded: at the sessions grain it printed a sentence to report a fold of zero, which is the
  // whole reason that branch is gone, and at the modules grain it carries two counts.
  const paras = [];
  for (const at of ['#/', '#/p/ZBL/modules']) {
    await page.evaluate(`location.hash = ${JSON.stringify(at)}`);
    await page.waitFor(`window.ZT.term().open === false`, `the drawing at ${at}`);
    await sleep(120);
    for (const id of ['wnbtn', 'grbtn', 'gapsbtn', 'thtoggle']) {
      await page.evaluate(`document.getElementById(${JSON.stringify(id)}).click()`);
      await sleep(90);
      const got = JSON.parse(await page.evaluate(CUT_MENU_PARAS));
      got.forEach(g => paras.push(Object.assign({ at }, g)));
      await page.evaluate(`document.getElementById(${JSON.stringify(id)}).click()`);
      await sleep(60);
    }
  }
  const overLong = paras.filter(p => p.n > 200);
  assert('every paragraph in the header\'s four menus is a figure and not an argument, at both altitudes',
    paras.length >= 8 && overLong.length === 0,
    `${paras.length} paragraphs across the four menus on two altitudes, the longest at most 200 ` +
      'characters',
    `${paras.length} paragraphs, ${overLong.length} over 200: ` +
      JSON.stringify(overLong.slice(0, 3).map(p => p.where + ' ' + p.n + ' ' + p.text)));

  // ---- 2. the empty window says the fact and stops ---------------------------------
  // It used to say the fact and then name the two controls that move it, which are the two
  // controls the reader is looking at. The expected sentence is BUILT HERE, out of the window
  // state and this file's own date formatter, so a page that changed the words rather than
  // shortening them fails, and so does one that put the instruction back.
  await page.evaluate(`location.hash = '#/calendar'`);
  await page.waitFor(`window.ZT.term().open === true && window.ZT.term().shape === 'review'`,
    'the review, with its own window armed');
  const cw = await page.evaluate('window.ZT.term().window');
  const perProg = JSON.parse(await page.evaluate(`(function () {
    return JSON.stringify(window.GI.views.map(function (v) {
      var n = 0;
      v.nodes.forEach(function (node) {
        if (node.type !== 'CohortSession') return;
        var at = '';
        (node.props || []).forEach(function (p) { if (p.k === 'scheduled_at') at = p.v; });
        var d = String(at).split(' ')[0];
        if (d && d >= ${JSON.stringify(cw.from)} && d <= ${JSON.stringify(cw.to)}) n++;
      });
      return { key: v.key, inWindow: n };
    }));
  })()`));
  const emptyProg = perProg.filter(p => p.inWindow === 0)[0];
  if (!emptyProg) {
    throw new Error(`no programme is empty over ${cw.from} to ${cw.to}, so this claim has no ` +
                    'state to be made in');
  }
  await page.evaluate(`location.hash = '#/calendar/' + ${JSON.stringify(emptyProg.key)}`);
  await page.waitFor(`window.ZT.term().scope === ${JSON.stringify(emptyProg.key)}`,
    `the calendar scoped to ${emptyProg.key}`);
  await pressByText(page, '#termnotice .shape-btn', 'list');
  await page.waitFor(`window.ZT.term().shape === 'list'`, 'the list shape');
  const emptySaid = await page.evaluate(`(function () {
    var ths = document.querySelectorAll('#termrows tbody tr th');
    return ths.length ? ths[ths.length - 1].textContent.replace(/\\s+/g, ' ').trim() : null;
  })()`);
  const wantEmpty = 'No session in ' +
    (cw.weeks === 1 ? 'one week' : cw.weeks + ' weeks') + ', ' +
    longDate(cw.from) + ' to ' + longDate(cw.to) + '.';
  assert('a window with nothing in it says which window, and does not go on to name the controls that move it',
    emptySaid === wantEmpty,
    `"${wantEmpty}" on ${emptyProg.key}, rebuilt here from the window state`,
    `the page says ${JSON.stringify(emptySaid)}`);

  // ---- 3. the typed heading claims no scope ----------------------------------------
  // The two headings for the sheet are typed into index.html, so they are the same string on all
  // sixteen sheet addresses; both of them said "all seven programmes", which was a false claim on
  // the fourteen scoped ones. A line that cannot vary cannot carry a fact that does. The scope
  // itself is stated where it is computed, one element below, and this reads BOTH: that the
  // heading names no scope and that the sheet does, in the words the address earns.
  const sheetRoutes = JSON.parse(await page.evaluate('JSON.stringify(window.ZT.termRoutes())'));
  const views = JSON.parse(await page.evaluate(
    `JSON.stringify(window.GI.views.map(function (v) { return v.key; }))`));
  const headBad = [], scopeBad = [];
  for (const at of sheetRoutes) {
    await page.evaluate(`location.hash = ${JSON.stringify(at)}`);
    await page.waitFor(`window.ZT.term().open === true`, `the sheet at ${at}`);
    await sleep(90);
    const seen = JSON.parse(await page.evaluate(`(function () {
      var h = null;
      Array.prototype.forEach.call(document.querySelectorAll('h1 > span'), function (s) {
        if (s.getClientRects().length) h = s.textContent.replace(/\\s+/g, ' ').trim();
      });
      // The LAST one in document order, and not the CSS :last-of-type, which is per parent: the
      // shape bar carries one of these too, reading "Shape.", and it is the first.
      var leads = document.querySelectorAll('#termnotice .term-scope-lead');
      var lead = leads.length ? leads[leads.length - 1] : null;
      return JSON.stringify({ head: h, lead: lead ? lead.textContent.trim() : null });
    })()`));
    const scoped = /^#\/(calendar|outline)\/(.+)$/.exec(at);
    if (!seen.head || /\d/.test(seen.head) || /\b(all|seven|every)\b/i.test(seen.head) ||
        views.some(k => seen.head.indexOf(k.replace(/^Z/, 'Z-')) !== -1)) {
      headBad.push(at + ' :: ' + seen.head);
    }
    const wantLead = scoped ? 'One programme.' : 'All ' + views.length + ' programmes.';
    if (seen.lead !== wantLead) scopeBad.push(at + ' :: ' + seen.lead + ' wanted ' + wantLead);
  }
  assert('the heading typed into the document names no scope, and the sheet under it names the one the address earns',
    sheetRoutes.length === 16 && headBad.length === 0 && scopeBad.length === 0,
    `over all ${sheetRoutes.length} sheet addresses: no count, no quantifier and no programme ` +
      'code in the heading, and the scope stated below it in the words each address earns',
    `${headBad.length} headings claiming a scope ${JSON.stringify(headBad.slice(0, 3))}, ` +
      `${scopeBad.length} sheets stating the wrong one ${JSON.stringify(scopeBad.slice(0, 3))}`);

  // ---- 4. and the fraction the cut had to keep -------------------------------------
  // The students card's note lost three of its four sentences and kept the one figure in it: how
  // many of the cohort a click draws. Rebuilt here by counting the view's own Student nodes and
  // reading the card's own headcount, so a note that kept the words and lost the arithmetic fails.
  const cards = JSON.parse(await page.evaluate(CUT_STUDENT_CARDS));
  const badCards = cards.filter(c =>
    !c.note || c.drawn < 1 || !c.head ||
    c.note.indexOf(c.drawn + ' of the ' + c.head) === -1);
  assert('the students card still says how many of the cohort a click draws, on all seven',
    cards.length === 7 && badCards.length === 0,
    'each of the seven cards naming its own fraction, recomputed here from the view\'s Student ' +
      'nodes and the card\'s own headcount',
    `${badCards.length} of ${cards.length} without it: ` +
      JSON.stringify(badCards.slice(0, 3).map(c => c.key + ' ' + c.drawn + '/' + c.head + ' ' +
        String(c.note).slice(0, 60))));

  // ---- 5. no note says what the content IS -----------------------------------------
  // #115's guard sweeps the whole document on every address, and it never saw one of these: a
  // node's note is only in the DOM while that node is selected, and nothing in this suite ever
  // opened a panel while the guard was running. So fifty six tiles carried "every value on it is
  // made up" past a guard whose whole subject is that sentence. The notes are read off the
  // document here instead, which needs no panel and covers all of them at once. The properties
  // are NOT swept: the provenance rows are the record of where a value came from, they are
  // untouched by #110 and by this card, and sweeping them would make this fire on the thing it
  // is supposed to protect.
  const notes = JSON.parse(await page.evaluate(CUT_NOTES));
  const standing = notes.filter(n => STANDING_WORDS.test(n));
  assert('no note on any object says anything about the standing of the page\'s own content',
    notes.length > 100 && standing.length === 0,
    `nothing matching ${STANDING_WORDS} in any of the ${notes.length} notes the document carries`,
    `${standing.length} of ${notes.length}: ` +
      JSON.stringify(standing.slice(0, 3).map(n => n.slice(0, 80))));

  // ---- 6. the help is what nothing else says ---------------------------------------
  // Five items to two. Three of them told the reader what a control says by being pressed, and
  // what is left is a click and a modifier, which no element on the page states. 280 is above the
  // two that are there and below the five that were.
  await page.evaluate(`location.hash = '#/'`);
  await page.waitFor(`window.ZT.term().open === false`, 'the drawing');
  await page.evaluate(`document.getElementById('helpbtn').click()`);
  await page.waitFor(`!document.getElementById('helpbox').hidden`, 'the help to open');
  const help = JSON.parse(await page.evaluate(`(function () {
    var box = document.getElementById('helpbox');
    var items = Array.prototype.slice.call(box.querySelectorAll('li'))
      .map(function (li) { return li.textContent.replace(/\\s+/g, ' ').trim(); });
    return JSON.stringify({ items: items,
      n: items.reduce(function (t, s) { return t + s.length; }, 0) });
  })()`));
  await page.evaluate(`document.getElementById('helpbtn').click()`);
  assert('the footer help is the two things nothing on the page states, and no longer the five',
    help.items.length === 2 && help.n <= 280 &&
      help.items.some(t => /Ctrl/.test(t) && /Cmd/.test(t)) &&
      help.items.some(t => /click/i.test(t)),
    `two items totalling at most 280 characters, one naming the click and one the modifier`,
    `${help.items.length} items, ${help.n} characters: ` +
      JSON.stringify(help.items.map(t => t.slice(0, 70))));

  // ---- 7. and the canvas names no gesture ------------------------------------------
  // "employers appear on click" and "individuals appear on click" were caption lines, so they
  // were painted on the drawing of thirty two of the thirty three addresses at all times. Read
  // off window.GL, which is every caption line on all fourteen drawings and not only the one on
  // screen, and checked against what is painted on the one that is, so a caption that came back
  // in the geometry and a caption that came back in the renderer both fail.
  const caps = JSON.parse(await page.evaluate(CUT_CAPTIONS));
  const gesture = caps.lines.filter(l => GESTURE_WORDS.test(l));
  const paintedGesture = caps.painted.filter(l => GESTURE_WORDS.test(l));
  assert('no caption on any of the fourteen drawings names a gesture, in the geometry or on the canvas',
    caps.lines.length > 40 && caps.painted.length > 0 &&
      gesture.length === 0 && paintedGesture.length === 0,
    `none of the ${caps.lines.length} caption lines the geometry carries, and none of the ` +
      `${caps.painted.length} painted on the drawing, matching ${GESTURE_WORDS}`,
    `${gesture.length} in the geometry ${JSON.stringify(gesture.slice(0, 3))}, ` +
      `${paintedGesture.length} painted ${JSON.stringify(paintedGesture.slice(0, 3))}`);

  // ---- 8. the board says where it comes from and stops ------------------------------
  // It said that too, and then said it is not editable and has no drag and drop, over a board
  // with no control on any card and nothing that responds to a drag. The expected line is built
  // from the snapshot fetched here, so it is the served bytes and not the page's own copy.
  const snap = await (await fetch(new URL('board.json', base))).json();
  await page.evaluate(`location.hash = '#/board'`);
  // WAIT FOR THE LINE board.js WROTE AND NOT FOR THE ONE index.html SHIPS. The markup carries a
  // fallback copy of this sentence, so a wait on the word GitHub is satisfied before the snapshot
  // has arrived and this assertion reads the fallback. It passed locally and failed against the
  // origin for exactly that reason, which is the whole argument for step 13 existing. The
  // timestamp is in the rendered line and never in the fallback, so waiting on it waits on the
  // fetch; where a snapshot carries none, the two lines are the same string anyway.
  await page.waitFor(snap.generated
    ? `(document.getElementById('bmeta').textContent || '').indexOf(${JSON.stringify(snap.generated)}) !== -1`
    : `(document.getElementById('bmeta').textContent || '').indexOf('GitHub') !== -1`,
    'the board provenance line board.js wrote from the snapshot');
  const bmeta = await page.evaluate(
    `document.getElementById('bmeta').textContent.replace(/\\s+/g, ' ').trim()`);
  const wantMeta = (snap.generated ? 'Generated ' + snap.generated + '. ' : '') +
    'The board reflects GitHub Issues.';
  assert('the board says where its cards come from and does not go on to say what it is not',
    bmeta === wantMeta,
    `"${wantMeta}", built here from the board.json this origin served`,
    `the page says ${JSON.stringify(bmeta)}`);

  // ---- and the page is handed back the way it was found ----------------------------
  // The programme's own route first, which restores the altitude with it, and then the address
  // this phase was handed.
  await page.evaluate(`location.hash = ${JSON.stringify(routeWas)}`);
  await page.waitFor(`window.ZT.programme().key === ${JSON.stringify(pgWas)}`,
    `the ${pgWas} drawing back at the altitude this phase found it`);
  await page.evaluate(`location.hash = ${JSON.stringify(hashWas || '#/')}`);
  await page.waitFor(`window.ZT.term().open === false &&
                      window.ZT.programme().key === ${JSON.stringify(pgWas)}`,
    'the drawing back');
  if (winWas.on === false) {
    await wnMenu(page, true);
    await pressByText(page, '#wnmenu .wn-weeks', 'whole term');
    await page.waitFor('window.ZT.term().window.on === false',
      'the window off again, the way this phase found it');
    await wnMenu(page, false);
  }
  await viewSettled(page);
}

// ---- the empty window, issue 119 --------------------------------------------------------------
// NOTHING IN THIS SUITE EVER DROVE ONE, AND THAT IS THE FINDING RATHER THAN THE RECTS. The term
// runs 2026-01-12 to 2026-06-28 with real gaps in April and May, so a one week window over one
// programme can legitimately cover no session at all. In that state site/render.js handed back a
// drawing 0 units tall and painted six lane plates at `height: -47`. A negative rect is not
// painted, so no reader ever saw a broken page: the ONLY witness was six `Log.entryAdded`
// rendering errors, and `checkConsole` would have been red the first time anything came here. The
// harness that watches the error channel had never been aimed at the state most likely to fill it,
// which is the shape of guard this repository has spent a day removing. This phase is the aim.
//
// IT NEEDS NO PLANTED DEFECT, WHICH IS WHAT SEPARATES IT FROM THE ELEVEN #115 PROVED BY PLANTING
// ONE. Counted off site/instance.js at 28a67cd, thirteen (programme, one week) pairs whose anchor
// falls inside that programme's own term hold no session, and ninety one over the whole anchor
// range the control offers. The state is in the data.
//
// AND IT IS CHOSEN BY MEASUREMENT, NOT BY NAME. The pair below is the first one the page's own
// documents yield, under the harder of the two readings: the anchor has to sit BETWEEN that
// programme's first and last session, so this drives a gap in a running term and not a window
// parked past the end of it. A programme named here would be a programme that stops being empty
// the first time the model moves, and the route is the one the instance document carries rather
// than one built out of a key, after `#/p/Z-ZIB` cost this repository half an hour once already.
const EMPTY_PAIR = `(function () {
  function addDays(d, n) {
    var t = new Date(d + 'T00:00:00Z');
    t.setUTCDate(t.getUTCDate() + n);
    return t.toISOString().slice(0, 10);
  }
  var w = window.ZT.term().window, best = null;
  window.GI.views.forEach(function (v, i) {
    if (best) return;
    var days = [];
    v.nodes.forEach(function (n) {
      if (n.type !== 'CohortSession') return;
      var at = '';
      (n.props || []).forEach(function (p) { if (p.k === 'scheduled_at') at = p.v; });
      var d = String(at).split(' ')[0];
      if (d) days.push(d);
    });
    if (!days.length) return;
    days.sort();
    var a = w.firstMonday;
    while (a <= w.lastMonday) {
      var to = addDays(a, 6);
      // Inside this programme's own term, so the window is a gap and not the far side of the end.
      if (a >= days[0] && a <= days[days.length - 1] &&
          !days.some(function (d) { return d >= a && d <= to; })) {
        best = { key: v.key, route: v.route, anchor: a, to: to, sessions: days.length,
                 ids: v.nodes.map(function (n) { return n.id; }).sort() };
        return;
      }
      a = addDays(a, 7);
    }
  });
  return best;
})()`;

async function checkEmptyWindow(page) {
  const pair = await page.evaluate(EMPTY_PAIR);
  if (!pair) {
    throw new Error('no (programme, one week) pair in site/instance.js has an anchor inside its ' +
                    'own term and no session in the week from it. The state this phase exists to ' +
                    'drive is not in the data any more, and a phase that silently drove something ' +
                    'else would be worse than one that says so.');
  }
  await page.evaluate(`location.hash = ${JSON.stringify(pair.route)}`);
  await page.waitFor(`window.ZT.programme().key === ${JSON.stringify(pair.key)}`,
    `the ${pair.key} drawing, which has a week with nothing in it`);
  await viewSettled(page);

  // THROUGH THE CONTROLS AND NOT THROUGH A SETTER, which is the rule the cold load phase runs on:
  // a driver that reached inside term.js would prove the transform and not the page. The anchor is
  // stepped with the same two buttons a reader presses, until it is the one measured above.
  await wnMenu(page, true);
  for (let turn = 0; turn < 64; turn++) {
    const at = await page.evaluate('window.ZT.term().window.anchor');
    if (at === pair.anchor) break;
    await pressByText(page, '#wnmenu .wn-step', at > pair.anchor ? '‹' : '›');
    await page.waitFor(`window.ZT.term().window.anchor !== ${JSON.stringify(at)}`,
      `the anchor to move off ${at}`);
  }
  const landed = await page.evaluate('window.ZT.term().window.anchor');
  if (landed !== pair.anchor) {
    throw new Error(`the anchor control never reached ${pair.anchor}; it stopped at ${landed}`);
  }
  // The console is read as a DELTA over the repaint that empties the drawing, so what this phase
  // reports is what THIS state produced rather than what the run has accumulated. checkConsole
  // still judges the total at the end of the viewport; this names the state.
  const before = page.console.length;
  await pressByText(page, '#wnmenu .wn-weeks', '1 week');
  await page.waitFor('window.ZT.filtered().shown.length === 0',
    'the window to leave the drawing with nothing on it');
  await wnMenu(page, false);
  await viewSettled(page);
  const afterConsole = page.console.slice(before);

  const empty = await page.evaluate(`(function () {
    var f = window.ZT.filtered(), w = window.ZT.term().window;
    var svg = document.getElementById('graph');
    var canvas = document.getElementById('canvas');
    var v = window.ZT.view();
    var box = canvas.getBoundingClientRect();
    var m = svg.getScreenCTM();
    var t = svg.querySelector('.win-empty');
    var bb = t ? t.getBBox() : null;
    var neg = [], plates = [];
    Array.prototype.forEach.call(document.querySelectorAll('rect'), function (r) {
      var rw = parseFloat(r.getAttribute('width')), rh = parseFloat(r.getAttribute('height'));
      if (rw < 0 || rh < 0) neg.push((r.getAttribute('class') || '(no class)') + ' ' + rw + 'x' + rh);
    });
    Array.prototype.forEach.call(svg.querySelectorAll('rect.band'), function (r) {
      plates.push(parseFloat(r.getAttribute('height')));
    });
    // What the model says about this window, computed off the instance document rather than off
    // the page, so the emptiness is the data's and not the page's opinion of it.
    var inWindow = 0;
    window.GI.views.forEach(function (view) {
      if (view.key !== window.ZT.programme().key) return;
      view.nodes.forEach(function (n) {
        if (n.type !== 'CohortSession') return;
        var at = '';
        (n.props || []).forEach(function (p) { if (p.k === 'scheduled_at') at = p.v; });
        var d = String(at).split(' ')[0];
        if (d && d >= w.from && d <= w.to) inWindow++;
      });
    });
    return JSON.stringify({
      weeks: w.weeks, from: w.from, to: w.to, inWindow: inWindow,
      shown: f.shown, hidden: f.hidden.slice().sort(), off: f.off,
      canonNodes: f.canonNodes, canonEdges: f.canonEdges, drawnEdges: f.drawnEdges,
      nodes: svg.querySelectorAll('[data-node]').length,
      edges: svg.querySelectorAll('[data-edge]').length,
      outside: svg.querySelectorAll('[data-outside]').length,
      capWindow: svg.querySelectorAll('.cap-window').length,
      neg: neg, plates: plates,
      text: t ? t.textContent : null,
      textBox: bb ? { x: bb.x, w: bb.width } : null,
      title: document.getElementById('wnbtn').title,
      wnText: document.getElementById('wnbtn').textContent,
      h: window.ZT.programme().h, w: window.ZT.programme().w,
      k: v.k, vw: v.w, vh: v.h, boxW: box.width, boxH: box.height, ctm: m ? m.a : null
    });
  })()`).then(JSON.parse);

  // ---- 1. the absence, as set equality both ways --------------------------------
  // #115 SET THIS STANDARD AND AN EMPTY WINDOW IS ITS PUREST CASE. What should be gone is proved
  // gone, as a set and not as a count: `shown` is exactly the empty list, `hidden` is exactly the
  // canonical node set of this drawing, and the canvas carries neither a node nor an edge. A
  // count alone would be satisfied by a page that dropped the right NUMBER of the wrong tiles.
  assertEqual('an empty window shows exactly nothing, and hides exactly the whole drawing',
    { shown: empty.shown, hidden: empty.hidden, nodes: empty.nodes, edges: empty.edges,
      drawnEdges: empty.drawnEdges, inWindow: empty.inWindow },
    { shown: [], hidden: pair.ids, nodes: 0, edges: 0, drawnEdges: 0, inWindow: 0 },
    `${pair.key}, the week from ${pair.anchor}, against the model's own dates`);

  // ---- 2. the defect itself ------------------------------------------------------
  // SIX RECTS AT height: -47, AND BOTH DIRECTIONS OF IT. That no rect on the page is negative
  // would be satisfied by a page that drew no rect at all, so the lane plates have to be there and
  // have to be positive. The lanes survive an empty window: the window empties the tiles, and a
  // drawing with no lanes would be a different claim than a drawing with nothing in them.
  assert('and no rect on the page is drawn at a negative size, with the six lanes still plated',
    empty.neg.length === 0 && empty.plates.length === 6 &&
      empty.plates.every(h => h > 0) && empty.h > 0,
    'six lane plates at a positive height and not one negative rect anywhere in the document',
    `${empty.neg.length} negative (${empty.neg.slice(0, 6).join(', ')}), plates ` +
      `${JSON.stringify(empty.plates)}, the drawing ${empty.h} units tall`);

  // ---- 3. the console, aimed at this state ---------------------------------------
  // THE HALF OF THE CARD THAT IS NOT ABOUT THE RECTS. The rendering errors went out on
  // Log.entryAdded, which is a channel with no exception and no stack, so nothing short of
  // watching it would have found them. Read as a delta over the repaint above, with the same one
  // allowance checkConsole makes, so this says what the empty window itself produced.
  const noise = afterConsole.filter(e => !(KNOWN_404.test(e.url) && /404/.test(e.text)));
  assert('and the repaint that emptied it puts nothing on the console',
    noise.length === 0,
    'nothing on the error channel from the repaint that left the drawing with nothing on it',
    `${noise.length} entries: ${JSON.stringify(noise.slice(0, 4))}`);

  // ---- 4. what it says, and that one place says it -------------------------------
  // NOT A NEW IDIOM. #/calendar's list has answered a window it filtered to nothing since #90, in
  // a sentence naming the window and the two controls that move it. term.js now owns that sentence
  // and both surfaces read it, so this asserts the CANVAS text against the LIST text in the same
  // state: two copies of it are two sentences waiting to disagree, and a driver comparing them to
  // a string written here would be comparing them to a third.
  // The scoped calendar for THIS programme, read off the page's own list of addresses rather than
  // built from a key. The list filters by scope, so the unscoped one would show the sessions the
  // other six programmes hold in this same week and would print no such sentence at all.
  const routes = JSON.parse(await page.evaluate('JSON.stringify(window.ZT.termRoutes())'));
  const cal = routes.filter(r => /^#\/calendar\//.test(r) &&
                                 r.slice(-(pair.key.length + 1)) === '/' + pair.key)[0];
  if (!cal) throw new Error(`the page publishes no calendar address scoped to ${pair.key}`);
  await page.evaluate(`location.hash = ${JSON.stringify(cal)}`);
  await page.waitFor(`window.ZT.term().reading === 'calendar'`, 'the calendar reading');
  await pressByText(page, '#termnotice .shape-btn', 'list');
  await page.waitFor(`window.ZT.term().shape === 'list'`, 'the list shape');
  const listSaid = await page.evaluate(`(function () {
    var ths = document.querySelectorAll('#termrows tbody tr th');
    return ths.length ? ths[ths.length - 1].textContent : null;
  })()`);
  assert('the drawing says what the window is, in the sentence the list prints in the same state',
    !!empty.text && empty.text === listSaid && !STANDING_WORDS.test(empty.text) &&
      !!empty.textBox && empty.textBox.x > 0 &&
      empty.textBox.x + empty.textBox.w < empty.w,
    'one line on the canvas, the same words the list uses for a window it filtered to nothing, ' +
      'inside the drawing\'s own width and saying nothing about the standing of the content',
    `canvas ${JSON.stringify(empty.text)}, list ${JSON.stringify(listSaid)}, box ` +
      `${JSON.stringify(empty.textBox)} in ${empty.w} units`);

  await page.evaluate(`location.hash = ${JSON.stringify(pair.route)}`);
  await page.waitFor(`window.ZT.term().open === false`, 'the drawing back');
  await viewSettled(page);
  const back = await page.evaluate(`(function () {
    var svg = document.getElementById('graph'), v = window.ZT.view();
    var canvas = document.getElementById('canvas').getBoundingClientRect();
    var m = svg.getScreenCTM();
    return JSON.stringify({
      outside: svg.querySelectorAll('[data-outside]').length,
      capWindow: svg.querySelectorAll('.cap-window').length,
      title: document.getElementById('wnbtn').title,
      off: window.ZT.filtered().off, canonNodes: window.ZT.filtered().canonNodes,
      h: window.ZT.programme().h,
      k: v.k, vw: v.w, vh: v.h, boxW: canvas.width, boxH: canvas.height, ctm: m ? m.a : null,
      // The drawing's own top and bottom edge in client pixels, through the transform the browser
      // is rendering it with. Nothing is measured off an element here: this is where the extent
      // itself has landed, which is the question the fit answers.
      top: m ? m.f : null, bot: m ? m.f + m.d * window.ZT.programme().h : null,
      boxTop: canvas.top, boxBot: canvas.bottom
    });
  })()`).then(JSON.parse);

  // ---- 5. and the count did not come back onto the canvas ------------------------
  // #111 MOVED IT INTO THE HEADER DELIBERATELY and an empty window is where a stub tile, a fourth
  // caption line or a reassuring paragraph would creep back in. The canvas carries the sentence
  // and no arithmetic; the header carries the arithmetic, at its limit, every tile off.
  const said = /(\d+) of (\d+) tiles? and (\d+) relationships? are off the drawing/.exec(back.title);
  assert('and the arithmetic is still the header\'s, at its limit of every tile off',
    back.outside === 0 && back.capWindow === 0 && !!said &&
      Number(said[1]) === back.canonNodes && Number(said[2]) === back.canonNodes &&
      back.off.tiles === back.canonNodes && Number(said[3]) === back.off.relationships,
    `nothing on the canvas standing for what is off it, and the control saying all ` +
      `${back.canonNodes} of ${back.canonNodes} tiles are off the drawing`,
    `${back.outside} stub tiles, ${back.capWindow} window captions, title ` +
      JSON.stringify(back.title));

  // ---- 6. and the fit framed it, at a transform the page holds --------------------
  // ISSUE 114'S READING GUARD, IN THE ONE STATE THAT COULD BREAK IT. A floored height is a new
  // number for the fit to frame, and the fit it replaces divided by a height of 0. The window is
  // the canvas box with NO tolerance at all, as #114 measured it, and the scale keeps that card's
  // own 1e-3 relative, which is three hundred times the residual it measured. Neither is loosened.
  //
  // AND THE FRAMING IS ASSERTED WHERE IT CAN FAIL, which the height alone could not: every fit
  // this page can compute leaves `h * k` inside the canvas, so that clause passes under any
  // arithmetic at all and proves nothing. What a refit that did not run would show is a drawing
  // 126 units tall still hanging in the frame of the 596 it was cut from, so the claim is where
  // the extent LANDED: both of its edges inside the canvas, and its centre on the canvas's, taken
  // off the transform the browser is rendering with rather than off any element.
  const centred = Math.abs((back.top + back.bot) / 2 - (back.boxTop + back.boxBot) / 2);
  assert('and the fit frames the empty drawing at a transform the page holds',
    back.vw === back.boxW && back.vh === back.boxH &&
      back.ctm !== null && Math.abs(back.ctm - back.k) <= back.k * 1e-3 &&
      back.top >= back.boxTop - 2 && back.bot <= back.boxBot + 2 && centred <= 2,
    `a window of exactly ${back.boxW} by ${back.boxH}, the browser's scale on the page's own ` +
      `${back.k.toFixed(6)}, and all ${back.h} units of the drawing inside the canvas and ` +
      'centred in it',
    `view ${back.vw} by ${back.vh} against ${back.boxW} by ${back.boxH}, ctm ${back.ctm}, ` +
      `drawing ${back.top.toFixed(1)} to ${back.bot.toFixed(1)} in a canvas ` +
      `${back.boxTop.toFixed(1)} to ${back.boxBot.toFixed(1)}, off centre by ${centred.toFixed(1)}px`);

  // Left as it was found: the window off, and the address back on the diagram. Every phase after
  // this one starts on a page nobody filtered.
  await wnMenu(page, true);
  await pressByText(page, '#wnmenu .wn-weeks', 'whole term');
  await page.waitFor('window.ZT.filtered().on === false', 'the window off again');
  await wnMenu(page, false);
  await page.evaluate(`location.hash = '#/'`);
  await page.waitFor('window.ZT.term().open === false', 'the diagram back');
  await viewSettled(page);
}

async function checkHeader(page) {
  await page.evaluate(`location.hash = '#/'`);
  await page.waitFor('window.ZT.term().open === false', 'the diagram to be on screen');
  // Which drawing this phase started on, because it walks all seven and `#/` is not a way back:
  // an address that is not a programme address has no opinion about which of the seven is drawn,
  // which is router.js's rule and the reason the term phase records the same value.
  const startedOn = await page.evaluate('window.ZT.programme().key');
  const model = JSON.parse(await page.evaluate(GAPS_FROM_MODEL));

  // ONE. The denominator is every value the model records as missing, anywhere in it, and it is
  // the model's own arithmetic rather than a number this file or that one holds. The two other
  // populations are printed beside it because they are the boundary this card drew: the route rows
  // that say how a class gets filled at all, which are the same fact on every tile of that class,
  // and the ghost rows, where the tile is already the finding.
  const all = await page.evaluate('window.ZT.gaps()');
  assert('the header counts against every value the model records as missing, recomputed from the document',
    all.of === model.value && model.value > 0 && model.route > 0 && model.ghost > 0,
    `${model.value}, counted off window.GI in this driver`,
    `the page says ${all.of}`,
    `${model.value} value rows, against ${model.route} route rows and ${model.ghost} on ghosts, ` +
      `${model.value + model.route + model.ghost} absent rows in all`);

  // TWO. Every one of the seven drawings answers with its own arithmetic. Asserted across all
  // seven rather than on one, because a scope bug that returned the same set whatever the address
  // would pass on any single view, and because the seven differ by an order of magnitude.
  const perView = [];
  for (const key of Object.keys(model.byView)) {
    await page.evaluate(`location.hash = '#/p/' + ${JSON.stringify(key)}`);
    await page.waitFor(`window.ZT.programme().key === ${JSON.stringify(key)}`, `the ${key} drawing`);
    const g = await page.evaluate('window.ZT.gaps()');
    const txt = await page.evaluate(`document.getElementById('gapsbtn').textContent`);
    perView.push({ key, said: g.total, wanted: model.byView[key], txt });
  }
  // `gaps 8 of 95` and not `gaps: 8 of 95` since issue 120, for the reason the window control's
  // text lost its colon: the control is a reading on the header's readout now and the label is
  // markup. The arithmetic this assertion is about is untouched.
  const wrong = perView.filter(v => v.said !== v.wanted ||
    v.txt !== `gaps ${v.wanted} of ${model.value}`);
  assert('and each of the seven drawings says its own number, in the control and in the object',
    wrong.length === 0 && perView.length === 7 &&
      new Set(perView.map(v => v.said)).size > 1,
    'every drawing counting the gaps on its own tiles',
    wrong.length ? wrong.map(v => `${v.key} said ${v.said} for ${v.wanted}, text ${JSON.stringify(v.txt)}`).join(', ')
                 : perView.map(v => `${v.key} ${v.said}`).join(', '));

  // THREE. THE COMPOSITION THIS CARD IS FOR. A window filters the drawing, so it moves the count,
  // and it has to move it to the gaps that are still on the page rather than to some other number
  // that also went down. Both halves are asserted: the count falls, and it equals the arithmetic
  // taken over render.js's own record of which tiles the window left.
  const heavy = perView.slice().sort((a, b) => b.wanted - a.wanted)[0];
  await page.evaluate(`location.hash = '#/p/' + ${JSON.stringify(heavy.key)}`);
  await page.waitFor(`window.ZT.programme().key === ${JSON.stringify(heavy.key)}`,
    `the ${heavy.key} drawing`);
  await wnMenu(page, true);
  await pressByText(page, '#wnmenu .wn-weeks', '3 weeks');
  await page.waitFor('window.ZT.term().window.weeks === 3', 'a three week window');
  await wnMenu(page, false);
  const windowed = await page.evaluate('window.ZT.gaps()');
  const onShown = await page.evaluate(GAPS_ON_SHOWN);
  assert('a window moves the count, and moves it to the gaps left on the drawing',
    windowed.total === onShown && windowed.total < heavy.wanted && windowed.total >= 0,
    `fewer than ${heavy.key}'s ${heavy.wanted}, and equal to the ${onShown} on the tiles the ` +
      'window left',
    `the page says ${windowed.total}, the tiles on screen carry ${onShown}`,
    `${heavy.key} ${heavy.wanted} over the whole term, ${windowed.total} over three weeks`);

  // FOUR. The list is the count. #83 and #100 both turned on an aggregate that lost its own
  // number, so the rows under the control are added up and checked against the headline rather
  // than merely counted.
  await gapsMenu(page, true);
  const menu = JSON.parse(await page.evaluate(GAPS_MENU_READ));
  assert('the list under the control adds up to the number on it',
    menu.open && menu.expanded === 'true' && menu.sum === windowed.total &&
      menu.rows === windowed.rows.length && menu.rows > 0 &&
      menu.scope.indexOf(String(windowed.total)) === 0,
    `${menu.rows} rows summing to ${windowed.total}, under a sentence that opens with it`,
    `${menu.rows} rows summing to ${menu.sum}, control ${JSON.stringify(menu.text)}, ` +
      `sentence ${JSON.stringify(menu.scope.slice(0, 80))}`);
  await gapsMenu(page, false);
  await wnMenu(page, true);
  await pressByText(page, '#wnmenu .wn-weeks', 'whole term');
  await page.waitFor('window.ZT.term().window.on === false', 'the window to come off');
  await wnMenu(page, false);

  // FIVE. Each reading answers about the rows it lists and not about the model behind it. The
  // calendar's one row is the number the sheet has carried since issues 80 and 82 under another
  // name, so the header and the sheet cannot come to say different things about the same eleven
  // sessions; the outline's rows are all templates. Both are asserted, because a scope that
  // returned every node on every route would satisfy neither and a scope that returned nothing
  // would satisfy the first half of each.
  await page.evaluate(`location.hash = '#/calendar'`);
  await page.waitFor(`window.ZT.term().reading === 'calendar'`, 'the calendar');
  const cal = await page.evaluate('window.ZT.gaps()');
  const term = await page.evaluate('window.ZT.term()');
  await page.evaluate(`location.hash = '#/outline'`);
  await page.waitFor(`window.ZT.term().reading === 'outline'`, 'the outline');
  const out = await page.evaluate('window.ZT.gaps()');
  const calRow = cal.rows.find(r => r.field === 'teacher_assigned');
  assert('each reading counts the rows it lists, and the calendar agrees with the sheet\'s own count',
    !!calRow && calRow.n === term.noInstructor &&
      cal.rows.every(r => r.type === 'CohortSession') &&
      out.rows.every(r => r.type === 'SessionTemplate') &&
      out.total !== cal.total && out.total > 0 && cal.total > 0,
    `the calendar on cohort sessions with ${term.noInstructor} of them lacking an instructor, ` +
      'the outline on session templates',
    `calendar ${cal.total} ${JSON.stringify(cal.rows.map(r => r.type + '.' + r.field))}, ` +
      `outline ${out.total} ${JSON.stringify(out.rows.map(r => r.type + '.' + r.field))}`);

  // SIX. The window applies to the calendar and not to the outline, and that split is #90's rather
  // than this card's: a window is a slice of dates and an outline is a syllabus in curriculum
  // order. Asserted in both directions on one press of one control, so a window that reached
  // everything and a window that reached nothing both fail.
  await wnMenu(page, true);
  await pressByText(page, '#wnmenu .wn-weeks', '3 weeks');
  await page.waitFor('window.ZT.term().window.weeks === 3', 'a three week window');
  await wnMenu(page, false);
  const outWin = await page.evaluate('window.ZT.gaps()');
  await page.evaluate(`location.hash = '#/calendar'`);
  await page.waitFor(`window.ZT.term().reading === 'calendar'`, 'the calendar again');
  const calWin = await page.evaluate('window.ZT.gaps()');
  assert('the window reaches the calendar\'s count and leaves the outline\'s alone',
    outWin.total === out.total && calWin.total < cal.total && calWin.total >= 0,
    `the outline still ${out.total} and the calendar under its ${cal.total}`,
    `outline ${outWin.total}, calendar ${calWin.total}`);
  await wnMenu(page, true);
  await pressByText(page, '#wnmenu .wn-weeks', 'whole term');
  await page.waitFor('window.ZT.term().window.on === false', 'the window to come off');
  await wnMenu(page, false);

  // SEVEN. Withdrawn where the window control is withdrawn, and the object says `null` rather than
  // zero, because "no gaps here" and "this question does not apply to this view" are different
  // answers and a control reading `gaps: 0 of 95` over the board would be giving the wrong one.
  // Both directions again: back on the diagram it is present, visible and answering.
  const off = [];
  for (const at of ['#/board', '#/students']) {
    await page.evaluate(`location.hash = ${JSON.stringify(at)}`);
    await page.waitFor(at === '#/board' ? `document.body.classList.contains('board')`
                                        : 'window.ZT.roster() === true', `the view at ${at}`);
    const m = JSON.parse(await page.evaluate(headerProbe(['gapsbtn'])));
    off.push({ at, visible: m.gapsbtn.visible, total: (await page.evaluate('window.ZT.gaps()')).total });
  }
  await page.evaluate(`location.hash = '#/'`);
  await page.waitFor('window.ZT.roster() === false', 'the diagram to come back');
  const back = JSON.parse(await page.evaluate(headerProbe(['gapsbtn'])));
  const backGaps = await page.evaluate('window.ZT.gaps()');
  assert('withdrawn on the board and the student list, and saying null there rather than zero',
    off.every(o => !o.visible && o.total === null) && back.gapsbtn.visible &&
      back.gapsbtn.reaches && typeof backGaps.total === 'number',
    'gone on both, null on both, and back on the diagram answering with a number',
    off.map(o => `${o.at} visible ${o.visible} total ${JSON.stringify(o.total)}`).join(', ') +
      `, diagram visible ${back.gapsbtn.visible} total ${JSON.stringify(backGaps.total)}`);

  // EIGHT. #86 and #77 together, on the newest control in the row. It is live over every address
  // that opens a sheet, it answers elementFromPoint at its own centre there, and it clears the
  // target size the whole row was taken to. A count a reader can see and cannot press over the
  // view it is counting would be this card shipping the defect #86 was filed for.
  const sheetAddresses = JSON.parse(await page.evaluate(`JSON.stringify(window.ZT.termRoutes())`));
  const bad = [];
  let smallest = Infinity;
  for (const at of sheetAddresses) {
    await page.evaluate(`location.hash = ${JSON.stringify(at)}`);
    await page.waitFor(`!!document.querySelector('.sheet:not([hidden])')`, `the sheet at ${at}`);
    const m = JSON.parse(await page.evaluate(headerProbe(['gapsbtn']))).gapsbtn;
    smallest = Math.min(smallest, m.w, m.h);
    if (!m.visible || !m.reaches || Math.min(m.w, m.h) < 24) {
      bad.push(`${at} ${m.w}x${m.h} found ${m.found}`);
    }
  }
  assert('the gap count is reachable and at least 24 by 24 on every address that opens a sheet',
    bad.length === 0 && sheetAddresses.length > 1,
    `all ${sheetAddresses.length} of them answering at their own centre, 24 by 24 or better`,
    bad.length ? bad.join(', ') : `all ${sheetAddresses.length} reached it, smallest side ${smallest}`);

  await page.evaluate(`location.hash = '#/p/' + ${JSON.stringify(startedOn)}`);
  await page.waitFor(`window.ZT.programme().key === ${JSON.stringify(startedOn)}`,
    'the drawing this phase started on');
  await page.evaluate(`location.hash = '#/'`);
  await page.waitFor('window.ZT.term().open === false', 'the diagram to come back');
}

// ---- the readout, issue 120 ---------------------------------------------------------------------
// SIX ASSERTIONS AND EVERY ONE OF THEM IS A DECISION THAT CARD TOOK, which is the standard the
// header phase above was written to and the reason it is worth writing twice. He asked for a
// header thought of as a control dashboard rather than as a web page, after three cards, #89, #90
// and #98, that had each answered a card like it by adding a control to one row. By the fourth the
// row held nine, four of them carrying a value and five carrying a verb, every one of them the
// same blue .linkbtn at the same size, and nothing anywhere saying which kind any of them was.
//
// SO THE THING TO ASSERT IS THE SPLIT AND NOT THE STYLING. A rearrangement that looked like a
// dashboard and left a reading in the nav, or drew the plate and painted the readings in the link
// colour, would satisfy a driver that measured boxes. The first two below are the split itself,
// read as placement and as paint; the middle three are the reading this card added, which is the
// number the rest of the header moves and is therefore the one thing here that can be shipped
// looking right and being wrong; the last is the control this card took OFF the row.
//
// NOTHING HERE READS THE TILE COUNT AND ASSERTS THE TILE COUNT. Every figure is recomputed, off
// window.GI in this file for the ghosts and off render.js's own record of the window for the rest,
// and the control's answer is checked against it.
// The three actions read here are the three that carry no state of their own. `ghosts` and
// `feedback` are deliberately left out and it is not a convenience: both were painting their own
// state before this card, the ghost toggle in the body colour with a weight while it is pressed
// and the capture toggle in the muted one, so a claim that every action shares one colour would be
// false about the page as it already was and would have to be made true by changing two controls
// this card has no business changing.
const PAINT_READ = `(function () {
  function col(sel) { var e = document.querySelector(sel); return e ? getComputedStyle(e).color : null; }
  var st = document.getElementById('hstate'), hd = document.querySelector('header');
  return JSON.stringify({
    readings: ['#wnval', '#grval', '#tilesval', '#gapsval'].map(col),
    labels: ['.wnpick .rd-k', '.grpick .rd-k', '#tilesrd .rd-k', '.gapspick .rd-k'].map(col),
    links: ['#navstudents', '#navview', '#thtoggle'].map(col),
    plate: st ? getComputedStyle(st).backgroundColor : null,
    header: hd ? getComputedStyle(hd).backgroundColor : null
  });
})()`;

const PLACE_READ = `(function () {
  var st = document.getElementById('hstate'), nav = document.querySelector('.hnav');
  function where(id) {
    var e = document.getElementById(id);
    return { there: !!e, plate: !!(e && st && st.contains(e)), nav: !!(e && nav && nav.contains(e)) };
  }
  var kids = st ? Array.prototype.slice.call(st.children) : [];
  var r = st ? st.getBoundingClientRect() : null;
  var tops = kids.map(function (k) { return +k.getBoundingClientRect().top.toFixed(2); });
  var hs = kids.map(function (k) { return +k.getBoundingClientRect().height.toFixed(2); });
  return JSON.stringify({
    readings: ['wnbtn', 'grbtn', 'tilesrd', 'gapsbtn'].map(where),
    actions: ['ghtoggle', 'fbtoggle', 'navstudents', 'navview', 'thtoggle'].map(where),
    plateH: r ? +r.height.toFixed(2) : null,
    tallest: hs.length ? Math.max.apply(null, hs) : null,
    oneLine: tops.length > 1 && tops.every(function (t) { return t === tops[0]; })
  });
})()`;

const TILES_STATE = `(function () {
  var f = window.ZT.filtered();
  return JSON.stringify({ text: document.getElementById('tilesval').textContent,
                          shown: f.shown.length, canon: f.canonNodes, on: f.on });
})()`;

const THEME_READ = `(function () {
  var menu = document.getElementById('thmenu');
  var items = Array.prototype.slice.call(document.querySelectorAll('#thmenu .thitem'));
  return JSON.stringify({
    face: document.getElementById('thtoggle').textContent.trim(),
    expanded: document.getElementById('thtoggle').getAttribute('aria-expanded'),
    open: !!menu && !menu.hidden,
    items: items.map(function (b) { return b.textContent.trim(); }),
    marked: items.filter(function (b) { return b.getAttribute('aria-current') === 'true'; })
                 .map(function (b) { return b.textContent.trim(); }),
    theme: window.ZT.theme()
  });
})()`;

async function thMenu(page, want) {
  const open = await page.evaluate(`!document.getElementById('thmenu').hidden`);
  if (open !== want) await page.evaluate(`document.getElementById('thtoggle').click()`);
  await page.waitFor(`(!document.getElementById('thmenu').hidden) === ${want ? 'true' : 'false'}`,
    `the theme box to ${want ? 'open' : 'close'}`);
}

async function checkReadout(page) {
  // Which drawing this phase started on, for the reason the header phase records it: this one
  // walks off the default drawing on purpose and `#/` is not a way back, so the address it leaves
  // behind would be the address every phase after it runs on.
  const startedOn = await page.evaluate('window.ZT.programme().key');
  // The drawing with the most tiles on it, chosen off the model rather than named here, for the
  // reason no route in this file is typed: a key written into a driver is a key that is right
  // until the build draws a different set.
  const big = JSON.parse(await page.evaluate(`(function () {
    var best = null;
    window.GI.views.forEach(function (v) {
      var g = 0;
      v.nodes.forEach(function (x) { if (x.ghost) g++; });
      if (!best || v.nodes.length > best.nodes) best = { key: v.key, nodes: v.nodes.length, ghosts: g };
    });
    return JSON.stringify(best);
  })()`));
  await page.evaluate(`location.hash = '#/p/' + ${JSON.stringify(big.key)}`);
  await page.waitFor(`window.ZT.programme().key === ${JSON.stringify(big.key)}`,
    `the ${big.key} drawing`);

  // ONE. THE SPLIT, AS PLACEMENT. Every reading is on the plate and no reading is in the nav;
  // every action is in the nav and no action is on the plate; and the plate is one line high with
  // its readings on one top edge, because a group whose whole argument is that the four readings
  // are one statement cannot be two lines of chips at the width this phase runs at. Asserted in
  // both directions on both sets, so a rearrangement that moved one reading back into the nav, or
  // one action onto the plate, fails rather than passing on a count.
  const place = JSON.parse(await page.evaluate(PLACE_READ));
  const strayReading = place.readings.filter(r => !r.there || !r.plate || r.nav);
  const strayAction = place.actions.filter(a => !a.there || !a.nav || a.plate);
  assert('every reading is on the plate and every action is in the nav',
    strayReading.length === 0 && strayAction.length === 0 &&
      place.plateH !== null && place.plateH === place.tallest && place.oneLine,
    'four readings inside the readout, five actions inside the nav, and the plate one line high',
    `${strayReading.length} readings out of place, ${strayAction.length} actions out of place, ` +
      `plate ${place.plateH} against its tallest reading ${place.tallest}, ` +
      `one line ${place.oneLine}`);

  // TWO. THE SPLIT, AS PAINT, AND IT IS A SEPARATE CLAIM FROM THE ONE ABOVE. The row already had
  // the two kinds in two places before this card, at #98 and at #89: what it did not have was any
  // way to tell them apart by looking, every one of the nine being a .linkbtn in the link colour
  // unless it had a state of its own. So the four values take the body colour, their four labels
  // the muted one, and the plate under them a ground the header does not paint, while the three
  // actions that carry no state of their own keep the link colour they always had. A readout
  // painted in the link colour is the defect this card was filed about with a box drawn around it,
  // and it is exactly what this would catch.
  const paint = JSON.parse(await page.evaluate(PAINT_READ));
  const one = xs => xs.length > 0 && xs.every(x => x && x === xs[0]);
  assert('a reading is painted as a reading and an action as an action',
    one(paint.readings) && one(paint.labels) && one(paint.links) &&
      paint.readings[0] !== paint.links[0] && paint.labels[0] !== paint.links[0] &&
      paint.labels[0] !== paint.readings[0] &&
      !!paint.plate && !!paint.header && paint.plate !== paint.header,
    'one colour for the values, another for their labels, neither of them the link colour the ' +
      'plain actions keep, and a plate the header does not paint',
    `values ${JSON.stringify(paint.readings)}, labels ${JSON.stringify(paint.labels)}, ` +
      `links ${JSON.stringify(paint.links)}, plate ${JSON.stringify(paint.plate)} on a ` +
      `header of ${JSON.stringify(paint.header)}`);

  // THREE. THE TILE READING IS THE DRAWING AND THE DENOMINATOR APPEARS ONLY WHEN SOMETHING IS
  // TAKING TILES OFF IT. Both directions on one control: with the whole term drawn it is the tile
  // count and nothing else, and with a window on it is the two numbers, the first of them equal to
  // render.js's own record of what the window left. A reading that always printed `N of N` would
  // pass half of this and a reading that never printed the denominator would pass the other half.
  const whole = JSON.parse(await page.evaluate(TILES_STATE));
  await wnMenu(page, true);
  await pressByText(page, '#wnmenu .wn-weeks', '3 weeks');
  await page.waitFor('window.ZT.term().window.weeks === 3', 'a three week window');
  await wnMenu(page, false);
  const windowed = JSON.parse(await page.evaluate(TILES_STATE));
  assert('the tile reading is the drawing, and names a denominator only when one is being filtered',
    whole.on === false && whole.text === String(whole.canon) && whole.shown === whole.canon &&
      windowed.on === true && windowed.shown < windowed.canon &&
      windowed.text === windowed.shown + ' of ' + windowed.canon &&
      windowed.canon === whole.canon,
    `"${whole.canon}" over the whole term and "${windowed.shown} of ${windowed.canon}" under a ` +
      'three week window',
    `whole term ${JSON.stringify(whole)}, windowed ${JSON.stringify(windowed)}`);
  await wnMenu(page, true);
  await pressByText(page, '#wnmenu .wn-weeks', 'whole term');
  await page.waitFor('window.ZT.term().window.on === false', 'the window to come off');
  await wnMenu(page, false);

  // FOUR. AND IT FOLLOWS THE GHOST TOGGLE, BY THE NUMBER OF GHOSTS THE MODEL RECORDS. This is the
  // claim that makes the reading a count of what is painted rather than a count of what was built:
  // `ghosts` takes tiles off the canvas with a class and no drawing is rebuilt, so a reading taken
  // off the artefact alone stays where it was and looks entirely correct. The delta is recomputed
  // from window.GI in this file. Driven back on afterwards and asserted there too, because a
  // reading that fell and never came back would pass the first half.
  const ghostsOn = JSON.parse(await page.evaluate(TILES_STATE));
  await page.evaluate(`document.getElementById('ghtoggle').click()`);
  await page.waitFor(`document.body.classList.contains('hide-ghosts')`, 'the ghosts to go');
  const ghostsOff = JSON.parse(await page.evaluate(TILES_STATE));
  await page.evaluate(`document.getElementById('ghtoggle').click()`);
  await page.waitFor(`!document.body.classList.contains('hide-ghosts')`, 'the ghosts to come back');
  const ghostsBack = JSON.parse(await page.evaluate(TILES_STATE));
  assert('the tile reading counts what is painted, so the ghost toggle moves it',
    big.ghosts > 0 && Number(ghostsOn.text) === ghostsOn.canon &&
      Number(ghostsOn.text) - Number(ghostsOff.text) === big.ghosts &&
      ghostsBack.text === ghostsOn.text,
    `a fall of exactly the ${big.ghosts} ghost tiles window.GI records on ${big.key}, and back`,
    `${ghostsOn.text} with them, ${ghostsOff.text} without, ${ghostsBack.text} back`);

  // FIVE. AND IT FOLLOWS THE ALTITUDE, driven through the page's own menu rather than through an
  // address, because the claim is that the reading is restated wherever the drawing changes and a
  // reload would restate it whatever the code did.
  await page.evaluate(`document.getElementById('grbtn').click()`);
  await page.waitFor(`!document.getElementById('grmenu').hidden`, 'the altitude box');
  await pressByText(page, '#grmenu .gritem', 'modules');
  await page.waitFor(`window.ZT.grain().grain === 'modules'`, 'the collapsed drawing');
  const collapsed = JSON.parse(await page.evaluate(TILES_STATE));
  assert('and the altitude moves it, to the tile count of the drawing the altitude names',
    collapsed.text === String(collapsed.canon) && collapsed.canon < whole.canon &&
      collapsed.canon > 0,
    `fewer than ${whole.canon} tiles at the modules grain, and the reading saying so`,
    `${JSON.stringify(collapsed)} against ${whole.canon} at the sessions grain`);
  await page.evaluate(`document.getElementById('grbtn').click()`);
  await page.waitFor(`!document.getElementById('grmenu').hidden`, 'the altitude box again');
  await pressByText(page, '#grmenu .gritem', 'sessions');
  await page.waitFor(`window.ZT.grain().grain === 'sessions'`, 'the expanded drawing');

  // SIX. THE CONTROL THIS CARD TOOK OFF THE ROW. `theme: system` spent the row's first position on
  // a value the page is already showing the reader, and it is behind a press now: nothing on its
  // face but the word, three choices in the box, exactly one of them marked, and the mark and the
  // page moving together when one is pressed. #57's finding is the reason the box has three items
  // and not two, and the reason this asserts the mark rather than the label: what a reader could
  // not tell was which of the three was on.
  await thMenu(page, true);
  const opened = JSON.parse(await page.evaluate(THEME_READ));
  await pressByText(page, '#thmenu .thitem', 'dark');
  await page.waitFor(`window.ZT.theme().attr === 'dark'`, 'the page to go dark');
  await thMenu(page, true);
  const dark = JSON.parse(await page.evaluate(THEME_READ));
  await pressByText(page, '#thmenu .thitem', 'system');
  await page.waitFor(`window.ZT.theme().attr === null`, 'the page to follow the machine again');
  const back = JSON.parse(await page.evaluate(THEME_READ));
  assert('the theme is behind a press, with its three states in the box and the one that is on marked',
    opened.face === 'theme' && opened.open && opened.expanded === 'true' &&
      opened.items.length === 3 && opened.marked.length === 1 &&
      opened.marked[0] === opened.theme.choice && opened.theme.choice === 'system' &&
      dark.marked.length === 1 && dark.marked[0] === 'dark' && dark.theme.attr === 'dark' &&
      back.theme.choice === 'system' && back.open === false && back.face === 'theme',
    'a control reading "theme", three choices, the current one marked, and the mark following ' +
      'the page',
    `opened ${JSON.stringify(opened.items)} marked ${JSON.stringify(opened.marked)}, ` +
      `after dark ${JSON.stringify(dark.marked)} attr ${JSON.stringify(dark.theme.attr)}, ` +
      `back ${JSON.stringify(back.theme.choice)}`);

  // SEVEN. AND IT FOLLOWS A CHANGE OF PROGRAMME MADE FROM INSIDE THE READING, which is issue 121
  // and is the one route into this control that nothing had ever driven. Every other caller
  // reaches the readout through a class on the body: the observer over `document.body` answers
  // students, board, and the sheet opening and closing, and app.js calls the readout directly
  // where the programme or the window moves the count without moving a class. Moving from one
  // programme's calendar to another's was neither. term.js's show() ends in
  // `classList.toggle('calendar', true)` on a body already carrying `calendar`, and a toggle to
  // the value a class already has writes no attribute, so the MutationObserver never fired; and
  // show()'s only callback, onRoute, was wired to measureHeader() alone. The address changed, the
  // rows changed, the heading changed, and the number over them did not: on this instance the
  // unscoped calendar reads 11 of 95 and every scoped calendar kept reading 11 of 95.
  //
  // DRIVEN THROUGH THE SCOPE BAR, which is the control a reader presses, and not through a hash
  // this file wrote: the address is the same code path either way, and a driver that typed one
  // would be proving the router rather than proving the page a reader uses.
  //
  // THE PROGRAMME IS CHOSEN BY MEASUREMENT AND BOTH FIGURES ARE RECOMPUTED HERE, off window.GI
  // and by a second implementation of what gapScope() does: the calendar lists cohort sessions,
  // so the count is the absent props of the cohort sessions in scope. A programme named in this
  // file would be a programme that stops being the interesting one the first time the build
  // moves, and reading the page's own answer twice would agree with a page that never restated.
  const gapsInScope = `(function (key, type) {
    var total = 0;
    window.GI.views.forEach(function (v) {
      if (key && v.key !== key) return;
      v.nodes.forEach(function (n) {
        if (n.ghost || (type && n.type !== type)) return;
        var props = n.props || [];
        for (var i = (n.route || 0); i < props.length; i++) if (props[i].f === 'absent') total++;
      });
    });
    return total;
  })`;
  const wantAll = await page.evaluate(`${gapsInScope}(null, 'CohortSession')`);
  // The denominator, which is every absent value in the model and belongs to no route. Recomputed
  // here too, because a control that moved its numerator and its denominator together would be a
  // control that had not moved at all.
  const wantOf = await page.evaluate(`${gapsInScope}(null, null)`);
  // The first programme whose own count differs from the unscoped one, so the two readings this
  // asserts cannot be equal by accident. A page that never restated would pass on one that matched.
  const moved = await page.evaluate(`(function () {
    var all = ${gapsInScope}(null, 'CohortSession');
    var hit = null;
    window.GI.views.forEach(function (v) {
      if (hit) return;
      var n = ${gapsInScope}(v.key, 'CohortSession');
      if (n !== all) hit = { key: v.key, code: v.code, gaps: n };
    });
    return hit;
  })()`);
  if (!moved) {
    throw new Error('every programme holds exactly as many absent cohort session values as all ' +
                    'seven together, so no move between two calendars could change this reading ' +
                    'and the assertion below would prove nothing.');
  }
  await page.evaluate(`location.hash = '#/calendar'`);
  await page.waitFor(`window.ZT.term().reading === 'calendar' && window.ZT.term().scope === null`,
    'the unscoped calendar');
  const readAll = JSON.parse(await page.evaluate(`JSON.stringify(window.ZT.gaps())`));
  await pressByText(page, '#termnotice .term-scope a', moved.code);
  await page.waitFor(`window.ZT.term().scope === ${JSON.stringify(moved.key)}`,
    `the ${moved.code} calendar, reached from inside the unscoped one`);
  const readOne = JSON.parse(await page.evaluate(`JSON.stringify(window.ZT.gaps())`));
  assertEqual('and it follows a change of programme made from inside the reading',
    { unscoped: readAll.total, scoped: readOne.total, of: readOne.of,
      andTheyDiffer: readAll.total !== readOne.total },
    { unscoped: wantAll, scoped: moved.gaps, of: wantOf, andTheyDiffer: true },
    `${moved.code} pressed on the scope bar of the unscoped calendar, both counts recomputed ` +
      'off window.GI');

  // The drawing this phase started on, and nothing selected on it. Collapsing and expanding leaves
  // the reader looking at the counterpart of what they were reading, which is issue 89's anchor
  // and is the right behaviour: it also means this phase can hand the next one a page with the
  // detail panel open over a third of the canvas, which is how the canvas phase came to report a
  // box of 1216 by 757 for a window of 1536.
  await page.evaluate(`location.hash = '#/p/' + ${JSON.stringify(startedOn)}`);
  await page.waitFor(`window.ZT.programme().key === ${JSON.stringify(startedOn)}`,
    'the drawing this phase started on');
  await clearSelectionIfAny(page);
  await page.evaluate(`location.hash = '#/'`);
  await page.waitFor('window.ZT.term().open === false', 'the diagram to come back');
}

// ---- the canvas ---------------------------------------------------------------------------------
async function checkCanvas(page) {
  await page.evaluate('window.ZT.fit()');
  const before = await viewSettled(page);

  // An off-centre point, deliberately: a zoom about the centre of the box and a zoom about the
  // pointer are the same gesture at the centre and differ everywhere else, so an anchor test taken
  // at the middle of the screen proves nothing at all.
  const canvas = await stableRect(page, '#canvas');
  // Rounded here, once, and then used for both the dispatch and every line of arithmetic below.
  // See px(): the browser floors what it is given, and measuring at the float while dispatching at
  // the floor is what made the first run of this suite report a defect the page did not have.
  const ax = Math.round(canvas.x + canvas.w * 0.28);
  const ay = Math.round(canvas.y + canvas.h * 0.36);

  const read = () => page.evaluate(`(function () {
    var svg = document.getElementById('graph');
    var r = svg.getBoundingClientRect();
    var m = svg.getScreenCTM();
    var v = window.ZT.view();
    return { left: r.left, top: r.top, k: v.k, x: v.x, y: v.y,
             ctm: { a: m.a, d: m.d, e: m.e, f: m.f } };
  })()`);

  // ISSUE 76. The wheel zooms only with Ctrl or Cmd, and a bare wheel pans instead. Driven first,
  // from the fitted view, so the anchored test below still starts exactly where it always did.
  // This is the assertion the card added: it is the whole of what #76 decided, and the only part
  // of it that a later change could undo without anything else going red.
  const bare0 = await read();
  for (let i = 0; i < 4; i++) {
    await page.send('Input.dispatchMouseEvent', {
      type: 'mouseWheel', x: ax, y: ay, deltaX: 0, deltaY: -120, pointerType: 'mouse'
    });
  }
  const bare1 = await viewSettled(page).then(read);
  const panned = Math.abs(bare1.y - bare0.y) * bare1.k;
  assert('a wheel with no modifier moves the drawing and does not zoom it',
    bare1.k === bare0.k && panned > 100,
    'the scale untouched and the drawing moved',
    `the scale went ${bare0.k.toFixed(4)} to ${bare1.k.toFixed(4)} and the drawing moved ` +
      `${panned.toFixed(1)}px`,
    `scale unmoved at ${bare1.k.toFixed(4)}, panned ${panned.toFixed(1)}px`);
  await page.evaluate('window.ZT.fit()');
  await viewSettled(page);

  const b = await read();
  // Two readings of the same point: one from the three numbers app.js holds, and one from the
  // matrix the browser is actually rendering with. app.js's own comment records the two
  // disagreeing at the fourth decimal until the box was measured off its rect, so the matrix is
  // the one that is asserted on and the other is printed beside it.
  const docBefore = { x: b.x + (ax - b.left) / b.k, y: b.y + (ay - b.top) / b.k };
  const renderBefore = { x: (ax - b.ctm.e) / b.ctm.a, y: (ay - b.ctm.f) / b.ctm.d };

  // `modifiers: 2` is Ctrl in the DevTools Protocol's bitmask (1 Alt, 2 Ctrl, 4 Meta, 8 Shift),
  // and it is the one edit issue 76 made to an existing assertion: without it this gesture is a
  // pan now and the anchored zoom it measures never happens. The claim being made is unchanged.
  for (let i = 0; i < 4; i++) {
    await page.send('Input.dispatchMouseEvent', {
      type: 'mouseWheel', x: ax, y: ay, deltaX: 0, deltaY: -120, pointerType: 'mouse',
      modifiers: 2
    });
  }
  const a = await viewSettled(page).then(read);
  const docAfter = { x: a.x + (ax - a.left) / a.k, y: a.y + (ay - a.top) / a.k };
  const renderAfter = { x: (ax - a.ctm.e) / a.ctm.a, y: (ay - a.ctm.f) / a.ctm.d };

  // The gesture must have done something. Without this the anchor assertion passes perfectly on a
  // wheel event the page never received, which is the exact shape of the harness failure app.js's
  // wheel comment records: six wheels out of six dropped, looking like a container listener being
  // deaf over its own children.
  const grew = a.k / b.k;
  if (!assert('the wheel gesture reached the page and changed the zoom',
      grew > 1.5, 'the scale to grow by more than half again over four wheel steps',
      `scale went ${b.k.toFixed(4)} to ${a.k.toFixed(4)}, a factor of ${grew.toFixed(3)}`)) {
    return;   // an anchor measured across a gesture that did not happen is not evidence
  }

  const errX = Math.abs(renderAfter.x - renderBefore.x) * a.ctm.a;
  const errY = Math.abs(renderAfter.y - renderBefore.y) * a.ctm.d;
  const modelErr = Math.max(Math.abs(docAfter.x - docBefore.x) * a.k,
                            Math.abs(docAfter.y - docBefore.y) * a.k);
  assert('the document point under the cursor does not move across the zoom',
    errX <= ZOOM_TOLERANCE_PX && errY <= ZOOM_TOLERANCE_PX,
    `the point under (${ax.toFixed(0)}, ${ay.toFixed(0)}) to move less than ` +
      `${ZOOM_TOLERANCE_PX}px, measured off the rendered matrix`,
    `it moved ${errX.toFixed(4)}px across and ${errY.toFixed(4)}px down ` +
      `(the same point off view(): ${modelErr.toFixed(4)}px)`,
    `${errX.toFixed(4)}px / ${errY.toFixed(4)}px, tolerance ${ZOOM_TOLERANCE_PX}px`);

  await page.evaluate('window.ZT.fit()');
  await viewSettled(page);
  await clearSelectionIfAny(page);

  // Click or drag. Three gestures on the same tile, because the thresholds are the whole of what
  // tells them apart and app.js carries two of them: 5px of travel, or 3px travelled slowly.
  const node = await someInstructor(page);
  const t = await stableRect(page, `[data-node="${node}"] rect.tile-bg`);
  const tx = Math.round(t.cx), ty = Math.round(t.cy);
  const isSel = `window.ZT.selected() && window.ZT.selected().id === ${JSON.stringify(node)}`;
  await requireHit(page, tx, ty, { node });

  await click(page, tx, ty);
  await page.waitFor(isSel, 'a 0px click to select');
  pass('a click with no movement at all selects the node under it');
  await clearSelection(page);

  // Two pixels of travel. Below DRAG_PX (5) and below SLOW_PX (3), so neither of app.js's two
  // thresholds fires however long the gesture takes, which is what makes this deterministic rather
  // than a race against SLOW_MS.
  const t2 = await stableRect(page, `[data-node="${node}"] rect.tile-bg`);
  const jx = Math.round(t2.cx), jy = Math.round(t2.cy);
  await requireHit(page, jx, jy, { node });
  await mouse(page, 'mousePressed', jx, jy, 1);
  await mouse(page, 'mouseMoved', jx + 2, jy + 1, 1);
  await mouse(page, 'mouseReleased', jx + 2, jy + 1, 0);
  let selected = null;
  try {
    await page.waitFor(isSel, 'a 2px click to select');
    selected = node;
  } catch { selected = await page.evaluate('JSON.stringify(window.ZT.selected())'); }
  assert('two pixels of hand shake is still a click, not a drag',
    selected === node, 'the node under the press to be selected', String(selected));
  await clearSelectionIfAny(page);

  const t3 = await stableRect(page, `[data-node="${node}"] rect.tile-bg`);
  const dx0 = Math.round(t3.cx), dy0 = Math.round(t3.cy);
  await requireHit(page, dx0, dy0, { node });
  const viewBeforeDrag = await viewSettled(page);
  await dragBy(page, dx0, dy0, 40, 0);
  const viewAfterDrag = await viewSettled(page);
  const movedPx = Math.abs(viewAfterDrag.x - viewBeforeDrag.x) * viewAfterDrag.k;
  const sel = await page.evaluate('JSON.stringify(window.ZT.selected())');
  assert('a forty pixel drag pans the canvas',
    Math.abs(movedPx - 40) < 2, 'the plane to move 40px under the pointer',
    `it moved ${movedPx.toFixed(2)}px`, `${movedPx.toFixed(2)}px`);
  assert('and a forty pixel drag beginning on a node selects nothing',
    sel === 'null', 'no selection', sel);
}

async function clearSelectionIfAny(page) {
  const sel = await page.evaluate('window.ZT.selected() === null');
  if (!sel) await clearSelection(page);
}

// A node that is on the page and stays there. Taken from the drawing rather than named here: it is
// the source of an `employed by` edge, which is what an instructor is in this model, and the first
// one in key order so the choice is the same on every run.
async function someInstructor(page) {
  const d = await page.evaluate(READ_DRAWING);
  const e = d.edges.filter(x => x.verb === 'employed by').sort((a, b) => a.key < b.key ? -1 : 1)[0];
  if (!e) throw new Error('the drawing carries no `employed by` edge to click on');
  return e.s;
}

// ---- capture mode -------------------------------------------------------------------------------
async function checkCapture(page, base) {
  await page.evaluate('window.ZT.fit()');
  await viewSettled(page);
  await clearSelectionIfAny(page);

  const toggle = await stableRect(page, '#fbtoggle');
  const gx = Math.round(toggle.cx), gy = Math.round(toggle.cy);
  await requireHit(page, gx, gy, { id: 'fbtoggle' });
  await click(page, gx, gy);
  await page.waitFor(`document.body.classList.contains('fb-mode')`, 'capture mode to turn on');

  // A pan while capture mode is on. app.js swallows the click a drag leaves behind on the window,
  // in the capture phase, with stopImmediatePropagation, precisely so that it never reaches
  // feedback.js's document-level listener. If that ever stops holding, every drag on the canvas
  // opens a popover and a reader who moves the drawing files a card about wherever they let go.
  const node = await someInstructor(page);
  const t = await stableRect(page, `[data-node="${node}"] rect.tile-bg`);
  const tx = Math.round(t.cx), ty = Math.round(t.cy);
  await requireHit(page, tx, ty, { node });
  const before = await viewSettled(page);
  await dragBy(page, tx, ty, 60, 20);
  const after = await viewSettled(page);

  const state = await page.evaluate(`(function () {
    return {
      popover: !!document.querySelector('.fb-popover'),
      calls: window.__smoke.calls,
      opens: window.__smoke.opens
    };
  })()`);
  assert('a pan in capture mode moves the canvas',
    Math.abs(after.x - before.x) * after.k > 30, 'the plane to move under the drag',
    `it moved ${(Math.abs(after.x - before.x) * after.k).toFixed(1)}px`);
  assert('a pan in capture mode opens no popover',
    state.popover === false, 'no .fb-popover in the document', `popover present: ${state.popover}`);
  const posts = state.calls.filter(c => c.method !== 'GET');
  assert('a pan in capture mode files nothing',
    posts.length === 0 && state.opens.length === 0,
    'no request other than a GET, and no issue form opened',
    `${posts.length} non-GET request(s) ${JSON.stringify(posts)}, ` +
    `${state.opens.length} window.open(s) ${JSON.stringify(state.opens)}`);

  // The element descriptor, against the string the deployed page produced when issue 45 was
  // filed. Clicked at 35% of the tile out from its centre, which is inside the 34 unit tile and
  // outside the 16 unit glyph box, so the click lands on the tile rect rather than on a glyph
  // stroke: the point is chosen from the measured rect rather than from an offset in pixels,
  // so it stays right at any zoom.
  const t4 = await stableRect(page, `[data-node="${DESCRIPTOR_BASELINE.node}"] rect.tile-bg`);
  const bx = Math.round(t4.cx + t4.w * 0.35), by = Math.round(t4.cy + t4.h * 0.35);
  await requireHit(page, bx, by, { node: DESCRIPTOR_BASELINE.node, tag: 'rect' });
  await click(page, bx, by);
  await page.waitFor(`!!document.querySelector('.fb-popover .fb-el')`, 'the capture popover to open');
  const descriptor = await page.evaluate(`document.querySelector('.fb-popover .fb-el').textContent`);
  assert('the element descriptor for a stable node is unchanged',
    descriptor === DESCRIPTOR_BASELINE.text,
    `${JSON.stringify(DESCRIPTOR_BASELINE.text)}, recorded from ${DESCRIPTOR_BASELINE.from}`,
    JSON.stringify(descriptor));

  // Out, the way a reader leaves: 3 closes the box, Escape leaves the mode.
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: '3', code: 'Digit3', windowsVirtualKeyCode: 51 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: '3', code: 'Digit3', windowsVirtualKeyCode: 51 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await page.waitFor(`!document.body.classList.contains('fb-mode')`, 'capture mode to turn off');

  await checkCaptureOverASheet(page);

  const net = await page.evaluate('JSON.stringify(window.__smoke)');
  const rec = JSON.parse(net);
  assert('nothing in the whole capture pass filed an issue until it was asked to',
    rec.calls.every(c => c.method === 'GET') && rec.opens.length === 0,
    'every recorded request a GET, and no issue form opened',
    `calls ${JSON.stringify(rec.calls)}, opens ${JSON.stringify(rec.opens)}`);

  await checkItCanFile(page, base);
}

// ---- and that it CAN file, which is the control this phase never had --------------------------
// ISSUE 118's F2, AND IT IS THE PUREST DEAD CONTROL IN THE SET. Every assertion this phase makes
// about the recorder is an ABSENCE: no popover, nothing filed, no non-GET request, no window
// opened. The suite never once pressed the file control, so `window.__smoke.opens` was never
// observed non-empty and the stub's own `window.open` override was never proved to be live.
// Two failure modes were therefore indistinguishable from a pass: the page's filing path broken,
// so nothing files, so nothing is recorded; and the override never taking, so nothing is
// recorded. `fileIssue()` in site/feedback.js made a no-op that returns without opening anything
// was 177 of 177 and verify.sh exit 0, with the one channel by which a reader reports a defect
// dead on the published origin.
//
// SO THE BUTTON IS PRESSED, WITH NO TOKEN STORED, WHICH IS THE ROUTE A READER MEETS. With no
// credential the page falls back to GitHub's prefilled issue form, which is a `window.open` and
// not a request, so this proves the fallback path AND the override in the same press, and it is
// the press that makes every "filed nothing" assertion above mean something.
//
// THE REPOSITORY IS NOT WRITTEN HERE. It is read off the published board snapshot, whose cards
// carry their own issue urls: the page has to file into the repository whose issues it draws, and
// a page rebuilt against another repository with a board still pointing at this one is a defect
// rather than a thing this driver should be taught to expect.
async function checkItCanFile(page, base) {
  const snapshot = await (await fetch(new URL('board.json', base))).json();
  const anIssue = [].concat(...(snapshot.columns || []).map(c => c.cards || []))
    .map(c => c.url).filter(Boolean)[0] || '';
  const repo = (/^https:\/\/github\.com\/([^/]+\/[^/]+)\/issues\//.exec(anIssue) || [])[1];

  const before = JSON.parse(await page.evaluate('JSON.stringify(window.__smoke.opens)'));
  const hasToken = await page.evaluate(
    `(function () { try { return !!localStorage.getItem('zmt.gh.token'); } ` +
    `catch (e) { return false; } })()`);

  const tog = await stableRect(page, '#fbtoggle');
  await click(page, Math.round(tog.cx), Math.round(tog.cy));
  await page.waitFor(`document.body.classList.contains('fb-mode')`,
    'capture mode to turn on for the filing control');
  // The same point the descriptor assertion above clicks, inside the tile and outside the glyph
  // box, so the body this control prefills can be held to the same recorded string.
  const tile = await stableRect(page, `[data-node="${DESCRIPTOR_BASELINE.node}"] rect.tile-bg`);
  await click(page, Math.round(tile.cx + tile.w * 0.35), Math.round(tile.cy + tile.h * 0.35));
  await page.waitFor(`!!document.querySelector('.fb-popover .fb-file')`,
    'the capture popover to open over the tile');
  await page.evaluate(`document.querySelector('.fb-popover .fb-file').click()`);
  await page.waitFor(`window.__smoke.opens.length > ${before.length} ||
                      /form|filed|could/.test((document.querySelector('.fb-file-result') || {})
                        .textContent || '')`,
    'the page to answer the filing control');

  const filed = JSON.parse(await page.evaluate(`(function () {
    var r = document.querySelector('.fb-file-result');
    return JSON.stringify({ opens: window.__smoke.opens,
                            calls: window.__smoke.calls.filter(function (c) {
                              return c.method !== 'GET';
                            }),
                            said: r ? r.textContent : null });
  })()`));
  const opened = filed.opens.slice(before.length);
  const url = opened.length === 1 ? new URL(opened[0]) : null;
  const q = url ? url.searchParams : new URLSearchParams();
  assert('and pressing the file control opens the prefilled form for this repository',
    hasToken === false && !!repo && opened.length === 1 && !!url &&
      url.origin === 'https://github.com' && url.pathname === `/${repo}/issues/new` &&
      !!q.get('title') && (q.get('labels') || '').split(',').indexOf('feedback') !== -1 &&
      (q.get('body') || '').indexOf(DESCRIPTOR_BASELINE.text) !== -1 &&
      filed.calls.length === 0,
    `exactly one window opened, at https://github.com/${repo}/issues/new, carrying a title, the ` +
      'feedback label and a body quoting the element the capture named, and no request made ' +
      'without a credential',
    `${opened.length} opened ${JSON.stringify(opened.slice(0, 2))}, ` +
      `${filed.calls.length} non-GET request(s), the popover said ${JSON.stringify(filed.said)}`);

  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await page.waitFor(`!document.body.classList.contains('fb-mode')`,
    'capture mode to turn off after the filing control');
  await clearSelectionIfAny(page);
}

// ---- issue 86: the header over an open sheet, and a capture taken from inside one ---------------
// WHAT THIS PHASE IS FOR. He filed "feedback must be available when I am in this subpage", and he
// filed it from outside the subpage, because he had to. The sheets are fixed at inset 0 with a
// backdrop whose top edge was y=0, so `elementFromPoint` at the centre of every control in the
// header returned #termback, #rosterback or the sheet's own head, on all five sheet addresses and
// at all three widths. Nothing was disabled and nothing was hidden: all five were present, enabled
// and 26 by 26 the whole time. The page had a header that could not be clicked.
//
// SO THE ASSERTION IS A HIT TEST AND NOT A QUERY. Every property this defect left intact is one a
// driver would have checked: present, visible, enabled, the right size, the right aria state. The
// only reading that saw it is the one a reader's pointer takes, which is what document
// .elementFromPoint answers, and it is asserted for each control at the centre of its own rect.
//
// AND THE SECOND HALF IS WORTH MORE THAN THE FIRST. A reachable button that files a card naming
// the backdrop over the thing the reader meant is worse than a button that cannot be pressed: the
// first wastes the report as well as the reader's time. So the capture is driven from inside a
// scoped sheet, through the header control, onto a row of the table, and what the popover says it
// captured is read back.
const OVER_A_SHEET = ['fbtoggle', 'thtoggle', 'navstudents', 'navview', 'ghtoggle'];

// The four the page keeps live over a sheet: the two page level controls and the two that are the
// way out of the place a sheet is. `ghosts` is the fifth and is deliberately not among them.
const KEPT_LIVE = ['fbtoggle', 'thtoggle', 'navstudents', 'navview'];

function headerProbe(ids) {
  return `(function () {
    var out = {}, ids = ${JSON.stringify(ids)}, i;
    for (i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (!el) { out[ids[i]] = { present: false }; continue; }
      var r = el.getBoundingClientRect();
      var visible = r.width > 0 && r.height > 0 &&
                    getComputedStyle(el).visibility !== 'hidden';
      var x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
      var hit = visible ? document.elementFromPoint(x, y) : null;
      out[ids[i]] = {
        present: true, visible: visible,
        w: Math.round(r.width), h: Math.round(r.height), x: x, y: y,
        reaches: !!(hit && (hit === el || el.contains(hit))),
        found: hit ? (hit.id ? '#' + hit.id
                             : hit.tagName.toLowerCase() + '.' +
                               String(hit.getAttribute('class') || '').split(' ')[0])
                   : 'nothing'
      };
    }
    return JSON.stringify(out);
  })()`;
}

async function checkCaptureOverASheet(page) {
  // EVERY ADDRESS THAT OPENS A SHEET, READ OFF THE PAGE. #/students comes from the nav link's own
  // href and the other sixteen from the function that publishes them, for the reason issue 84's
  // assertions do it: `#/p/Z-ZIB` against `#/p/ZIB` cost this repository half an hour of false
  // alarm, and the rule it left is to construct no address you can ask for.
  const addresses = JSON.parse(await page.evaluate(`(function () {
    var s = document.getElementById('navstudents');
    return JSON.stringify([s.getAttribute('href')].concat(window.ZT.termRoutes()));
  })()`));

  const seen = [];
  for (const at of addresses) {
    await page.evaluate(`location.hash = ${JSON.stringify(at)}`);
    await page.waitFor(`!!document.querySelector('.sheet:not([hidden])')`,
      `the sheet at ${at} to open`);
    const box = JSON.parse(await page.evaluate(`(function () {
      var h = document.querySelector('header').getBoundingClientRect();
      var s = document.querySelector('.sheet:not([hidden])').getBoundingClientRect();
      return JSON.stringify({ headerBottom: h.bottom, sheetTop: s.top });
    })()`));
    seen.push({ at, box, m: JSON.parse(await page.evaluate(headerProbe(OVER_A_SHEET))) });
  }

  // THE RANK AND THE GEOMETRY ARE TWO CLAIMS AND THIS IS THE SECOND ONE, which was found by
  // trying to prove the first. With the header raised to --z-chrome and the sheets left at
  // `inset: 0`, every hit test below still passes: the header simply paints over the sheet, and
  // below 760px it would paint five controls over the middle of an opaque, full bleed box. Being
  // reachable by being drawn on top of somebody else's title is not the fix this card asked for.
  // So the layout is asserted separately from the stacking: no sheet may start above the line the
  // header ends on, which is what `inset: var(--hh) 0 0 0` buys and what a raised z-index does not.
  const overlapping = seen.filter(s => s.box && s.box.sheetTop < s.box.headerBottom - 0.5);
  assert('no sheet starts above the line the header ends on',
    overlapping.length === 0 && seen.every(s => s.box && s.box.headerBottom > 0),
    'every sheet top at or below the header bottom, at the measured header height',
    overlapping.length
      ? overlapping.map(s => `${s.at} sheet top ${s.box.sheetTop.toFixed(1)} against header ` +
          `bottom ${s.box.headerBottom.toFixed(1)}`).join(', ')
      : `all ${seen.length} start at or below ${seen[0].box.headerBottom.toFixed(1)}`);

  const unreachable = seen.filter(s => !s.m.fbtoggle.reaches);
  assert('the feedback control is reachable on every address that opens a sheet',
    addresses.length > 1 && seen.length === addresses.length && unreachable.length === 0,
    `#fbtoggle answering elementFromPoint at its own centre on all ${addresses.length} of them`,
    unreachable.length
      ? unreachable.map(s => `${s.at} found ${s.m.fbtoggle.found}`).join(', ')
      : `all ${seen.length} reached it`);

  const others = seen.filter(s => KEPT_LIVE.some(id => id !== 'fbtoggle' && !s.m[id].reaches));
  assert('and so are theme, students and board, which is the rest of what a sheet may not swallow',
    others.length === 0,
    'the theme control and both navigation links reachable over every sheet',
    others.length
      ? others.map(s => `${s.at}: ` + KEPT_LIVE.filter(id => !s.m[id].reaches)
          .map(id => `${id} found ${s.m[id].found}`).join(' and ')).join(' | ')
      : `all ${seen.length} addresses left all four live`);

  // THE ONE THAT IS DELIBERATELY NOT REACHABLE, and it is asserted in both directions, because a
  // control that is missing everywhere would satisfy half of this. `ghosts` marks the drawing, and
  // over a sheet the drawing is behind an opaque box, so it goes the way it already goes on the
  // board rather than staying in the row doing nothing a reader can see.
  await page.evaluate(`location.hash = '#/'`);
  await page.waitFor(`window.ZT.term().open === false && window.ZT.roster() === false`,
    'the sheet to close again');
  const onDiagram = JSON.parse(await page.evaluate(headerProbe(['ghtoggle'])));
  const ghostLeftOver = seen.filter(s => s.m.ghtoggle.visible);
  assert('the ghost toggle is withdrawn over a sheet rather than left there acting on a hidden drawing',
    ghostLeftOver.length === 0 && onDiagram.ghtoggle.visible && onDiagram.ghtoggle.reaches,
    'no #ghtoggle on any sheet address, and a reachable one back on the diagram',
    ghostLeftOver.length
      ? `still shown on ${ghostLeftOver.map(s => s.at).join(', ')}`
      : `withdrawn on all ${seen.length}, and on the diagram it is ` +
        `${onDiagram.ghtoggle.w}x${onDiagram.ghtoggle.h} and ${onDiagram.ghtoggle.found}`);

  // #77 TOOK THIS ROW TO 26 BY 26 FROM ELEVEN OF ELEVEN FAILING SC 2.5.8, and a control that was
  // unreachable was never measured over a sheet. Anything this card makes reachable is held to
  // the same bar, at the width where the header is one row and again where it wraps to two.
  const undersized = [];
  for (const s of seen) {
    for (const id of KEPT_LIVE) {
      const c = s.m[id];
      if (c.visible && Math.min(c.w, c.h) < 24) undersized.push(`${s.at} ${id} ${c.w}x${c.h}`);
    }
  }
  assert('every control the page keeps live over a sheet is still at least 24 by 24',
    undersized.length === 0,
    `all ${KEPT_LIVE.length} of them at 24 by 24 or better on all ${seen.length} addresses`,
    undersized.length ? undersized.join(', ') : 'the smallest is 26 by 26');

  // ---- and now the report itself ---------------------------------------------------------------
  const scopedOutline = addresses.filter(a => /^#\/outline\/.+/.test(a));
  if (!assert('the sheet publishes a scoped outline address to file a report from',
      scopedOutline.length > 0, 'at least one #/outline/<code> among the published addresses',
      addresses.join(' '))) {
    return;
  }
  const at = scopedOutline[0];
  const reading = at.split('/')[1];
  await page.evaluate(`location.hash = ${JSON.stringify(at)}`);
  await page.waitFor(`window.ZT.term().open === true && window.ZT.term().scope !== null`,
    `the scoped sheet at ${at} to open`);

  // Capture mode is turned on the way he would turn it on, by pressing the control in the header
  // while the sheet he wants to report on is the thing he is reading.
  const tog = await stableRect(page, '#fbtoggle');
  const tx = Math.round(tog.cx), ty = Math.round(tog.cy);
  await requireHit(page, tx, ty, { id: 'fbtoggle' });
  await click(page, tx, ty);
  await page.waitFor(`document.body.classList.contains('fb-mode')`,
    'capture mode to turn on from inside the sheet');

  const row = await stableRect(page, '#termrows .sheet-table tbody tr td');
  const rx = Math.round(row.cx), ry = Math.round(row.cy);
  // What is under the point, read before the click, because the popover the click opens is
  // positioned at the click and would be the answer afterwards.
  const under = JSON.parse(await page.evaluate(`(function () {
    var el = document.elementFromPoint(${rx}, ${ry});
    return JSON.stringify({
      tag: el ? el.tagName.toLowerCase() : 'nothing',
      inRows: !!(el && el.closest('#termrows')),
      onBackdrop: !!(el && el.closest('.sheet-back'))
    });
  })()`));
  await click(page, rx, ry);
  await page.waitFor(`!!document.querySelector('.fb-popover .fb-el')`,
    'the capture popover to open over the sheet');
  const shot = JSON.parse(await page.evaluate(`(function () {
    return JSON.stringify({
      el: document.querySelector('.fb-popover .fb-el').textContent,
      ctx: document.querySelector('.fb-popover .fb-ctx').textContent
    });
  })()`));

  assert('a capture taken from inside a sheet names a row of that sheet and not the backdrop',
    under.inRows && !under.onBackdrop && shot.el.indexOf('#termrows') !== -1 &&
      !/sheet-back|termback|rosterback/.test(shot.el),
    'a descriptor carrying #termrows, with no backdrop anywhere in it',
    `under the point ${JSON.stringify(under)}, descriptor ${JSON.stringify(shot.el)}`);

  assert('and the report it would file names the reading it was filed from',
    new RegExp('view: ' + reading + '(\\n|$)').test(shot.ctx) && shot.ctx.indexOf(at) !== -1,
    `"view: ${reading}" in the attached context, and ${at} in the page address`,
    JSON.stringify(shot.ctx));

  // OUT, AND THE ORDER OF THE TWO ESCAPES IS THE CLAIM. term.js stands down while capture mode is
  // on, for the reason the student list and the programme menu do: Escape is how a reader leaves
  // the mode. So the first Escape leaves capture with the sheet still open behind it, and only the
  // second closes the sheet. A page that closed both on one press would take the reader out of the
  // subpage they were reporting on, which is this card's own complaint.
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: '3', code: 'Digit3', windowsVirtualKeyCode: 51 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: '3', code: 'Digit3', windowsVirtualKeyCode: 51 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await page.waitFor(`!document.body.classList.contains('fb-mode')`,
    'capture mode to turn off from inside the sheet');
  const between = JSON.parse(await page.evaluate('JSON.stringify(window.ZT.term())'));
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await page.waitFor('window.ZT.term().open === false', 'the second Escape to close the sheet');
  assert('one Escape leaves capture mode and the next closes the sheet, both from inside it',
    between.open === true && between.reading === reading,
    'the sheet still open on the same reading after capture mode is left',
    `open ${between.open}, reading ${JSON.stringify(between.reading)}`);

  await page.evaluate(`location.hash = '#/'`);
  await page.waitFor(DIAGRAM_READY, 'the diagram to come back');
  await page.evaluate('window.ZT.fit()');
  await viewSettled(page);
}

// ---- the board ----------------------------------------------------------------------------------
const DONE_VISIBLE = 8;                                     // board.js DONE_VISIBLE and sync_board.mjs
const COLUMN_KEYS = ['raw', 'backlog', 'in_progress', 'done'];
const COLUMN_TITLES = ['Raw', 'Backlog', 'In progress', 'Done'];

// A synthetic set of issues, in the shape the REST API answers with, planted into the page so that
// board.js's own columnFor() and buildColumns() run against a set whose right answer is known.
// Numbers in the 900s so that nothing here can be confused with a real card, and so that no
// assertion depends on an issue number that changes.
function boardFixture(repo) {
  const url = n => `https://github.com/${repo}/issues/${n}`;
  const iss = (n, state, labels, reason) => ({
    number: n, title: `fixture ${n}`, html_url: url(n), state,
    state_reason: reason || null, labels: labels.map(name => ({ name }))
  });
  const out = [
    iss(901, 'open', ['status:raw']),
    iss(902, 'open', ['status:raw', 'bug']),
    iss(903, 'open', []),                       // unlabelled: the default column is Raw
    iss(904, 'open', ['status:backlog']),
    iss(905, 'open', ['status:in-progress']),
    iss(906, 'open', ['status:in-progress'])
  ];
  for (let i = 0; i < 10; i++) out.push(iss(910 + i, 'closed', ['status:done'], 'completed'));
  // Two closed as not planned. They are closed, so they count towards the closed total that the
  // Done column's arithmetic has to account for, and they belong in no column at all.
  out.push(iss(930, 'closed', ['status:raw'], 'not_planned'));
  out.push(iss(931, 'closed', [], 'not_planned'));
  return out;
}

async function checkBoard(page, base) {
  // --- the snapshot the origin actually serves ---------------------------------------------------
  const snapshotText = await (await fetch(new URL('board.json', base))).text();
  const snapshot = JSON.parse(snapshotText);

  assertEqual('the published board has exactly four columns, in order',
    (snapshot.columns || []).map(c => c.key), COLUMN_KEYS);
  assertEqual('and they carry the four titles the board draws',
    (snapshot.columns || []).map(c => c.title), COLUMN_TITLES);

  const done = (snapshot.columns || []).find(c => c.key === 'done') || {};
  const drawn = (done.cards || []).length;
  assert('Done is capped at eight cards in the published snapshot',
    drawn <= DONE_VISIBLE, `at most ${DONE_VISIBLE} cards`, `${drawn} cards`);
  assert('and the remainder is carried as a number rather than dropped',
    typeof done.hidden === 'number' && done.hidden >= 0 && Number.isInteger(done.hidden),
    'a non-negative integer count of the closed issues not drawn', JSON.stringify(done.hidden));

  const ids = [].concat(...(snapshot.columns || []).map(c => (c.cards || []).map(x => x.id)));
  assert('no card is in two columns at once',
    new Set(ids).size === ids.length, `${ids.length} distinct card ids`,
    `${ids.length} cards, ${new Set(ids).size} distinct`);

  await page.evaluate(`location.hash = '#/board'`);
  await page.waitFor(`document.querySelectorAll('#bbody .bcol').length === 4`,
    'the board to draw four columns');
  const drawnBoard = await page.evaluate(`(function () {
    var cols = Array.prototype.slice.call(document.querySelectorAll('#bbody .bcol'));
    return cols.map(function (c) {
      var more = c.querySelector('.bmore');
      return {
        title: c.querySelector('h2').firstChild.textContent,
        heading: c.querySelector('h2 span').textContent,
        cards: c.querySelectorAll('.bcard').length,
        more: more ? more.textContent : null
      };
    });
  })()`);
  assertEqual('the drawn board carries the same four columns',
    drawnBoard.map(c => c.title), COLUMN_TITLES);
  assert('every column heading counts the cards under it',
    drawnBoard.every((c, i) => Number(c.heading) === c.cards &&
      c.cards === (snapshot.columns[i].cards || []).length),
    'each heading equal to the cards drawn and to the snapshot',
    JSON.stringify(drawnBoard.map(c => [c.heading, c.cards])));
  assert('the Done column says how many closed issues it is not drawing',
    (done.hidden > 0) === (drawnBoard[3].more !== null) &&
      (done.hidden === 0 || drawnBoard[3].more === `and ${done.hidden} more closed`),
    done.hidden > 0 ? `"and ${done.hidden} more closed"` : 'no remainder line',
    JSON.stringify(drawnBoard[3].more));

  // --- the shipped rule, against a fixture whose answer is known ---------------------------------
  // The snapshot cannot prove that drawn plus hidden is every closed issue, because the total is
  // exactly what the generator used to compute the hidden figure: reading it back is reading the
  // generator's own arithmetic. board.js carries a second copy of that rule for its live path, so
  // that copy is driven here against a set of issues this file wrote, which is a claim that can
  // fail. No network and no credential: the fetch stub answers the API from the fixture.
  // PLANTED, THEN RELOADED, AND THE RELOAD IS THE POINT. Switching a live token on under a board
  // that is already on screen looked simpler and is a race: board.js keeps one request in the air
  // at a time, so a tick that arrives while the snapshot fetch is still out returns without
  // rescheduling, and the next poll is a whole SNAPSHOT_MS away. Against a local server the
  // snapshot answers in a millisecond and the race never happens; against the deployed origin it
  // did, and the suite sat waiting for a board that was going to redraw thirty seconds later. That
  // is the page behaving exactly as documented, so the driver is what changes: the fixture and the
  // stand-in token go into localStorage, the page is reloaded, and the board's very first poll is
  // the live one, with nothing in flight to queue behind.
  const repo = await page.evaluate('window.ZMT && window.ZMT.repo');
  const fixture = boardFixture(repo || 'jcherranz/zrive-model-toy');
  await page.evaluate(`(function () {
    localStorage.setItem('__smoke.issues', ${JSON.stringify(JSON.stringify(fixture))});
    // A stand-in, not a credential: board.js only asks whether a token is stored before choosing
    // its live path, and the request it then makes is answered by the stub without ever leaving
    // the page. Nothing here reads or needs a real GitHub token.
    localStorage.setItem('zmt.gh.token', 'smoke-suite-placeholder-not-a-token');
    location.hash = '#/';
  })()`);
  await page.reload();
  await page.waitFor(DIAGRAM_READY, 'the diagram to draw again after the reload');
  await page.evaluate(`location.hash = '#/board'`);
  await page.waitFor(`(function () {
    var c = document.querySelectorAll('#bbody .bcol');
    if (c.length !== 4) return 'the board has ' + c.length + ' columns';
    var ids = Array.prototype.slice.call(document.querySelectorAll('#bbody .bnum'))
      .map(function (n) { return n.textContent; });
    return ids.indexOf('#901') === -1 ? 'the fixture is not drawn yet' : '';
  })()`, 'the board to draw from the planted fixture');

  const live = await page.evaluate(`(function () {
    var cols = Array.prototype.slice.call(document.querySelectorAll('#bbody .bcol'));
    var all = Array.prototype.slice.call(document.querySelectorAll('#bbody .bnum'))
      .map(function (n) { return n.textContent; });
    var doneCol = cols[3];
    var more = doneCol.querySelector('.bmore');
    return {
      titles: cols.map(function (c) { return c.querySelector('h2').firstChild.textContent; }),
      counts: cols.map(function (c) { return c.querySelectorAll('.bcard').length; }),
      more: more ? more.textContent : null,
      ids: all
    };
  })()`);

  assertEqual('the live path draws the same four columns', live.titles, COLUMN_TITLES);
  assertEqual('and puts each fixture issue in the column its label names',
    live.counts, [3, 1, 2, DONE_VISIBLE],
    'three raw including the unlabelled one, one backlog, two in progress, eight of twelve closed');
  assert('Done is capped at eight',
    live.counts[3] === DONE_VISIBLE, `${DONE_VISIBLE} cards drawn`, `${live.counts[3]} cards drawn`);
  // Twelve closed in the fixture, eight drawn, so four are hidden, and the two closed as not
  // planned are among them: the count is of closed issues and not of finished ones, which is why
  // the line says "closed" and not "done".
  assert('drawn plus hidden accounts for every closed issue',
    live.more === 'and 4 more closed',
    '"and 4 more closed": 12 closed in the fixture, 8 drawn, 4 not',
    JSON.stringify(live.more));
  assert('a not-planned closure appears in no column',
    !live.ids.includes('#930') && !live.ids.includes('#931'),
    'neither #930 nor #931 drawn anywhere on the board',
    JSON.stringify(live.ids.filter(i => i === '#930' || i === '#931')));

  await page.evaluate(`(function () {
    localStorage.removeItem('__smoke.issues');
    localStorage.removeItem('zmt.gh.token');
    location.hash = '#/';
  })()`);
  await page.waitFor(`!document.body.classList.contains('board')`, 'the diagram to come back');
}

// ---- every width --------------------------------------------------------------------------------
// The frame the drawing is fitted to, and the box it was fitted against. Issue 114.
const FRAME_READ = `(function () {
  var svg = document.getElementById('graph');
  var c = document.getElementById('canvas').getBoundingClientRect();
  var v = window.ZT.view();
  return JSON.stringify({ viewBox: svg.getAttribute('viewBox'), k: v.k, w: v.w, h: v.h,
                          canvas: [c.width, c.height] });
})()`;

// The static reading in the header's readout, issue 120. `visible` is read off the box rather
// than off a class, because app.css withdraws it with `display: none` and a rule that stopped
// matching would leave a class in place and a reading on the page.
const TILES_READ = `(function () {
  var el = document.getElementById('tilesrd');
  if (!el) return JSON.stringify({ there: false });
  var r = el.getBoundingClientRect();
  return JSON.stringify({ there: true, visible: !!(r.width || r.height),
                          h: +r.height.toFixed(2), w: +r.width.toFixed(2),
                          text: el.textContent.trim() });
})()`;

async function checkWidth(page, base) {
  // Read before the sweep below takes the canvas off screen, and again while it is off. Issue
  // 114: #/board is the one route that sets display:none on the drawing, viewport.js clamps a rect
  // of nothing up to one pixel, and applyView() framed that one pixel across the whole element.
  // The transform that came out was a scale of 900 where the page held 1.19, and it stayed on the
  // element until the ResizeObserver delivered, which is one rendering update after board.js gives
  // the canvas its box back. A reader never meets that frame because the observer runs before
  // paint. Anything measuring a rect in the gap does, and this suite did, three times in CI, and
  // reported the page broken for it.
  //
  // ASSERTED ON THE FRAME AND NOT ON THE CONSEQUENCE, because the consequence is a race and the
  // frame is not: whether the six figure rect is still there when a driver looks depends on the
  // runner, and whether the page wrote it at all does not. Here rather than in the reveal group
  // because this phase is the one that takes the canvas off screen, and at every width because
  // the box that is or is not framed is a different box at each of them.
  const framedAt = JSON.parse(await page.evaluate(FRAME_READ));
  let framedOff = null;
  // Issue 120, read where this phase already is rather than in a route walk of its own.
  let tilesOff = null;

  const routes = [['#/', 'the diagram'], ['#/board', 'the board'], ['#/students', 'the student list']];
  for (const [hash, what] of routes) {
    await page.evaluate(`location.hash = ${JSON.stringify(hash)}`);
    if (hash === '#/board') {
      await page.waitFor(`document.querySelectorAll('#bbody .bcol').length === 4`, 'the board to draw');
      framedOff = JSON.parse(await page.evaluate(FRAME_READ));
      tilesOff = JSON.parse(await page.evaluate(TILES_READ));
    } else if (hash === '#/students') {
      await page.waitFor('window.ZT.roster() === true', 'the student list to open');
    } else {
      await page.waitFor('window.ZT.roster() === false', 'the diagram to be on screen');
    }
    const m = await page.evaluate(`(function () {
      var d = document.documentElement;
      return { scrollWidth: d.scrollWidth, clientWidth: d.clientWidth, inner: innerWidth };
    })()`);
    assert(`${what} does not scroll sideways`,
      m.scrollWidth === m.clientWidth,
      `scrollWidth to equal clientWidth (${m.clientWidth})`,
      `scrollWidth ${m.scrollWidth}, clientWidth ${m.clientWidth}, innerWidth ${m.inner}`);
  }
  await page.evaluate(`location.hash = '#/'`);
  await page.waitFor('window.ZT.roster() === false', 'the diagram to come back');

  assert('the drawing keeps the frame it was fitted to while the canvas is off screen',
    framedOff !== null && framedOff.viewBox === framedAt.viewBox,
    `the viewBox ${framedAt.viewBox} still on the drawing while #/board is up`,
    framedOff === null ? 'the board route was never reached'
                       : `${framedOff.viewBox}, framed against a canvas of ` +
                         `${framedOff.canvas[0]} by ${framedOff.canvas[1]}`,
    `fitted against ${framedAt.canvas[0]} by ${framedAt.canvas[1]} at a scale of ` +
    `${framedAt.k.toFixed(6)}`);

  // ONE ROW, ONE BASELINE, AT EVERY WIDTH. Issue 77 found eleven of eleven controls in this header
  // failing WCAG 2.2 SC 2.5.8 and two baselines a pixel apart inside a line that reads as one line,
  // and fixed both in the stylesheet so that a control added later is right without anybody
  // remembering to make it right. Issue 98 added the sixth control to this row, which is the first
  // test of that claim, so the claim itself is asserted here rather than the new control alone:
  // every control in the header, whatever it is and however many there are, the same height and at
  // least 24 by 24. It is a width assertion and runs at all three, because the row wraps at the
  // narrow one and a wrapped row is where a size regression would hide.
  //
  // THE SCOPE IS THE HEADER AND NOT THE NAV, SINCE ISSUE 120, AND THAT IS A STRENGTHENING RATHER
  // THAN A REPAIR. That card split the row into a readout and an action bar, so a selector naming
  // `.hnav` measures five of the nine controls in this header and would have gone green with the
  // other four at any size at all. It also never covered the programme picker, which lives in the
  // heading, was one of the eleven #77 measured and has had nothing pointed at it since. The
  // claim was always "every control in this header", and it is written that way now.
  const row = await page.evaluate(`(function () {
    var out = [];
    document.querySelectorAll('header button, header a').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      out.push({ id: el.id || el.className, w: +r.width.toFixed(2), h: +r.height.toFixed(2) });
    });
    return out;
  })()`);
  const heights = Array.from(new Set(row.map(c => c.h)));
  const small = row.filter(c => Math.min(c.w, c.h) < 24);
  assert('every control in the header row is one height and at least 24 by 24',
    row.length >= 9 && heights.length === 1 && small.length === 0,
    `${row.length} controls on one height, none under 24 by 24`,
    small.length ? small.map(c => `${c.id} ${c.w}x${c.h}`).join(', ')
                 : `${row.length} controls, heights ${JSON.stringify(heights)}`,
    // The measurement on the pass as well as on the failure, since issue 124, and issue 125 needed
    // it: a card told not to put a control on this row has to be able to read how many are on it
    // without planting a failure to see the number.
    `${row.length} controls at ${heights.join('/')}px`);

  // AND THE ONE READING THAT IS NOT A CONTROL SITS ON THAT SAME LINE. Issue 120 put a static
  // reading inside the readout, and a span is exactly the thing the assertion above cannot see:
  // it is not a button and not a link, so it could render at any height it liked, inside a plate
  // whose whole argument is that the four readings on it are one statement. Asserted against the
  // controls' own height rather than against 26, so it stays true if the row is ever resized, and
  // in both directions: present and on the line on the diagram, and gone where app.css withdraws
  // it. The withdrawal is read on #/board, which this phase has already visited.
  const rd = JSON.parse(await page.evaluate(TILES_READ));
  assert('the reading that is not a control sits on the row\'s own line',
    rd.there && rd.visible && heights.length === 1 && rd.h === heights[0] && rd.w > 24 &&
      /^tiles \d+( of \d+)?$/.test(rd.text) &&
      tilesOff !== null && tilesOff.there && !tilesOff.visible,
    `a static reading of the form "tiles N" or "tiles N of M", ${heights[0]}px tall like the ` +
      'controls beside it, and withdrawn on the board',
    `on the diagram ${JSON.stringify(rd)}, on the board ${JSON.stringify(tilesOff)}`);
}

// ---- the gutter, at the width where it is declared a second time --------------------------------
// ISSUE 113 AT THE PHONE BREAKPOINT, WHICH IS ISSUE 115's F22. The two gutter assertions in the
// `term` phase are the same relationships as these and they run at 1536 only, because that is the
// viewport that can drive a pointer and `term` is a behavioural phase. app.css declares
// `--sheet-gutter` and `--row-inset` twice, and the card's whole argument is that 6 plus 10 and
// 4 plus 12 both sum to the head's 16, so the pair at 390 is a second declaration with nothing
// pointed at it: zeroing both shipped green while the outline group heading, the outline data
// cell and the calendar month heading all went from 16 to 0 on a phone.
//
// NEITHER OF THESE NAMES A PIXEL EITHER, for the reason the pair at 1536 does not: what is
// asserted is that the rows start where the sheet's own title starts and inside the box they
// scroll in, and that the two readings of the term agree with each other. That claim is the same
// at both widths and survives a breakpoint changing the two numbers, which is what makes it the
// claim rather than the declaration.
async function checkGutter(page) {
  await page.evaluate(`location.hash = '#/outline'`);
  await page.waitFor(`window.ZT.term().open === true &&
                      window.ZT.term().reading === 'outline'`,
    'the outline reading to open on the narrow viewport');
  const out = await page.evaluate(TERM_READ);
  await page.evaluate(`location.hash = '#/calendar'`);
  await page.waitFor(`window.ZT.term().open === true &&
                      window.ZT.term().reading === 'calendar'`,
    'the calendar reading to open on the narrow viewport');
  // The review, which is what this address opens on since issue 124 and therefore what a reader
  // on a phone meets first. Its band headings are the same group row the month heading and the
  // programme heading are, so the gutter claim below now covers three readings instead of two:
  // the card this assertion belongs to was filed on a short bold word against a hard edge, and
  // the review's first line is exactly that shape.
  const cal = await page.evaluate(TERM_READ);
  await pressByText(page, '#termnotice .shape-btn', 'month');
  await page.waitFor(`window.ZT.term().shape === 'month'`, 'the month grid on the narrow viewport');
  const calM = await page.evaluate(TERM_READ);

  assert('the sheet indents its rows from the box they scroll in, to where its own title starts',
    !!out.gutter && out.gutter.cell !== null && out.gutter.title !== null &&
      out.gutter.cell > out.gutter.box && out.gutter.pad > 0 &&
      out.gutter.cell === out.gutter.title,
    'the first text on a row starting inside the container and on the title\'s own left edge',
    JSON.stringify(out.gutter));

  assert('and both readings of the term start their text on the same left edge',
    !!out.gutter && !!calM.gutter && calM.gutter.month !== null && cal.gutter.group !== null &&
      calM.gutter.month === out.gutter.cell && out.gutter.group === out.gutter.cell &&
      cal.gutter.group === out.gutter.cell,
    'the review band heading, the calendar month heading, the outline group heading and the ' +
      'outline rows on one x',
    `review ${cal.gutter && cal.gutter.group}, month ${calM.gutter && calM.gutter.month}, ` +
      `group ${out.gutter.group}, cell ${out.gutter.cell}`);

  await page.evaluate(`location.hash = '#/'`);
  await page.waitFor('window.ZT.term().open === false', 'the sheet to close again');
}

function checkConsole(page) {
  const unexpected = page.console.filter(e => !(KNOWN_404.test(e.url) && /404/.test(e.text)));
  const known = page.console.length - unexpected.length;
  assert('no console error beyond the known favicon 404',
    unexpected.length === 0,
    'nothing on the error channel except the favicon 404 this page has no favicon for',
    unexpected.length === 0 ? 'none' :
      unexpected.map(e => `${e.kind}: ${e.text.slice(0, 160)}${e.url ? ' @ ' + e.url : ''}`).join(' | '),
    `${known} favicon 404(s) allowed`);
}

function checkRequests(page, base) {
  const host = new URL(base).host;
  const foreign = page.requests.filter(r => {
    if (r.url.startsWith('data:') || r.url.startsWith('blob:') || r.url === 'about:blank') return false;
    try { return new URL(r.url).host !== host; } catch { return true; }
  });
  assert('the page reached no host but its own origin',
    foreign.length === 0, `every request to ${host}`,
    foreign.length === 0 ? 'none' : foreign.map(r => `${r.method} ${r.url}`).join(' | '));
}

// =================================================================================================
// THE FILTERED DRAWING, RECOMPUTED HERE. Issue 115, findings F9, F11, F18 and F21.
// =================================================================================================
// WHAT WAS COVERED AND WHAT WAS NOT. `window.ZT.reflow()` is `faithful(CANON)`, and `CANON` is
// written by draw() while setWindow() never touches it, so its answer is filter-independent BY
// CONSTRUCTION: displacing the whole filtered drawing by 37px moved the picture on screen and left
// the printed reflow line byte-identical. `filtered()` has its own call to place() and to
// edgeGeom(), and that call site was covered by nothing at all. The edges were ungated in both
// directions: halving the drawn lines was 177 of 177, and re-pointing a vanished end at a
// surviving tile drew 82 lines where 28 are right, 54 of them terminating on the wrong tile, also
// 177 of 177. The three conjuncts that looked like a cross-check were tautologies of the page's
// own bookkeeping, and the two numbers the comment said were "asserted against each other" were
// one number routed through the window control's `title`.
//
// SO THIS IS A SECOND IMPLEMENTATION, IN THE DRIVER, OF WHAT THE FILTERED DRAWING SHOULD BE. It is
// the shape the gap count (#98) already has and the reason that row goes red on three assertions
// when the model rule is broken: a different source read by different code. It takes site/
// layout.js and site/instance.js as two documents and joins them here rather than through app.js's
// join; it re-derives the column list, the pitch and the top margin; it packs the columns with
// build_layout.py's own rule, transcribed from the pack() the build writes and the one render.js
// reflows with; it computes each arc from the two tiles it joins; and it reads the answer off the
// DOM. Nothing below asks the page what it did.
//
// AND WHAT IT TAKES FROM THE PAGE IS THE SET OF TILES ON SCREEN, WHICH IS THE INPUT AND NOT THE
// ANSWER. Given whatever the drawing chose to show, the placement of those tiles, the set of lines
// between them and the shape of every one of those lines are all decided, and all three are
// checked. What decided the set itself is checked separately and from the dates, below.
//
// THE FOUR CONSTANTS ARE TRANSCRIBED AND THAT IS DELIBERATE. SPREAD, SPREAD_FROM, DIP, CTRL_MIN
// and CTRL_FRAC are render.js's and build_layout.py's; a copy here is a third statement of them,
// so retuning one file and not the others turns this red. That is the property this file wants: a
// second opinion that has to be brought along on purpose.
const FILTERED_TRUTH = `(function () {
  var key = window.ZT.programme().key;
  var grain = window.ZT.grain().grain;
  var list = grain === 'modules' ? 'collapsed' : 'views';
  var iv = null, lv = null;
  (window.GI[list] || []).forEach(function (v) { if (v.key === key) iv = v; });
  (window.GL[list] || []).forEach(function (v) { if (v.key === key) lv = v; });
  if (!iv || !lv) return { error: 'no ' + grain + ' document for ' + key };
  var d = lv.drawing;
  if (iv.nodes.length !== d.nodes.length) return { error: key + ': the two documents disagree' };

  // ---- the columns, over all fourteen drawings, which is what an edge's shape is indexed on ----
  var seenX = {}, COLS = [];
  ['views', 'collapsed'].forEach(function (which) {
    (window.GL[which] || []).forEach(function (v) {
      v.drawing.nodes.forEach(function (n) {
        if (seenX[n.x]) return;
        seenX[n.x] = true;
        COLS.push(n.x);
      });
    });
  });
  COLS.sort(function (a, b) { return a - b; });
  function colOf(x) {
    var best = 0, bd = Infinity, i, gap;
    for (i = 0; i < COLS.length; i++) {
      gap = Math.abs(COLS[i] - x);
      if (gap < bd) { bd = gap; best = i; }
    }
    return best;
  }

  // ---- the node table: geometry from layout.js, dates and label shape from instance.js ----
  var N = {}, all = [], mismatched = [];
  iv.nodes.forEach(function (n, i) {
    var g = d.nodes[i];
    if (g.id !== n.id) { mismatched.push(n.id + ' has the coordinates of ' + g.id); return; }
    var lines = (g.wrap || []).length + (n.mark ? 1 : 0) + (n.tail ? 1 : 0);
    var by = {};
    (n.props || []).forEach(function (p) {
      by[p.k] = String(p.v == null ? '' : p.v).split(' ')[0];
    });
    N[n.id] = { id: n.id, type: n.type, x: g.x, y: g.y,
                box: d.tile + d.gapLabel + d.lineH * lines,
                at: by.scheduled_at || '', from: by.first_session || '', to: by.last_session || '' };
    all.push(n.id);
  });

  function byColumn(ids) {
    var cols = [];
    ids.forEach(function (id) {
      var c = colOf(N[id].x);
      (cols[c] || (cols[c] = [])).push(id);
    });
    return cols;
  }

  // MIN_GAP and the top margin, read off the canonical artefact exactly as the build's pack()
  // reads them: the closest two boxes in any column, and the highest tile edge in the drawing.
  var pitch = Infinity;
  byColumn(all).forEach(function (col) {
    var s = col.slice().sort(function (a, b) { return N[a].y - N[b].y; }), i;
    for (i = 1; i < s.length; i++) {
      pitch = Math.min(pitch, N[s[i]].y - N[s[i - 1]].y - N[s[i - 1]].box);
    }
  });
  pitch = isFinite(pitch) ? Math.round(pitch) : 26;
  var top = Infinity;
  all.forEach(function (id) { top = Math.min(top, N[id].y - d.tile / 2); });

  // build_layout.py's pack(), one column at a time, vertically centred, honouring the gap, with
  // the spread on the short right hand columns.
  var SPREAD = 0.42, SPREAD_FROM = 4;
  function place(ids) {
    var cols = byColumn(ids), H = 0, at = {};
    cols.forEach(function (col) { col.sort(function (a, b) { return N[a].y - N[b].y; }); });
    cols.forEach(function (col) {
      var hs = 0;
      col.forEach(function (id) { hs += N[id].box; });
      H = Math.max(H, hs + pitch * (col.length - 1));
    });
    cols.forEach(function (col, c) {
      var k = col.length, hs = 0, gap = pitch, y;
      col.forEach(function (id) { hs += N[id].box; });
      if (k > 1 && k < 4 && c >= SPREAD_FROM) gap = Math.max(pitch, (SPREAD * H - hs) / (k - 1));
      y = (H - (hs + gap * (k - 1))) / 2;
      col.forEach(function (id) {
        var h = N[id].box;
        at[id] = y + h / 2 - (h - d.tile) / 2;
        y += h + gap;
      });
    });
    var lift = Infinity;
    ids.forEach(function (id) { lift = Math.min(lift, at[id] - d.tile / 2); });
    ids.forEach(function (id) { at[id] = Math.round((at[id] + top - lift) * 10) / 10; });
    return at;
  }

  // build_layout.py's two edge shapes: three columns or more apart is an arc slung under the row,
  // anything closer is a hop from one tile's edge to the next.
  var DIP = 132, CTRL_MIN = 28, CTRL_FRAC = 0.45;
  function f1(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function arc(a, b) {
    var span = Math.abs(b.col - a.col);
    var L = a.col <= b.col ? a : b, R = a.col <= b.col ? b : a;
    var p0, p1, p2, p3, dx;
    if (span >= 3) {
      p0 = [L.x, L.y + d.tile / 2]; p3 = [R.x, R.y + d.tile / 2];
      p1 = [p0[0], p0[1] + DIP]; p2 = [p3[0], p3[1] + DIP];
    } else {
      p0 = [L.x + d.tile / 2, L.y]; p3 = [R.x - d.tile / 2, R.y];
      dx = Math.max(CTRL_MIN, (p3[0] - p0[0]) * CTRL_FRAC);
      p1 = [p0[0] + dx, p0[1]]; p2 = [p3[0] - dx, p3[1]];
    }
    return 'M ' + f1(p0[0]) + ' ' + f1(p0[1]) + ' C ' + f1(p1[0]) + ' ' + f1(p1[1]) + ' ' +
           f1(p2[0]) + ' ' + f1(p2[1]) + ' ' + f1(p3[0]) + ' ' + f1(p3[1]);
  }

  // ---- what is on screen ------------------------------------------------------------------
  var drawn = {}, shown = [], strangers = [];
  Array.prototype.forEach.call(document.querySelectorAll('#graph g[data-node]'), function (g) {
    var id = g.getAttribute('data-node');
    var r = g.querySelector('rect.tile-bg');
    if (!r) return;
    if (!N[id]) { strangers.push(id); return; }
    drawn[id] = { x: +r.getAttribute('x') + d.tile / 2, y: +r.getAttribute('y') + d.tile / 2 };
    shown.push(id);
  });

  // ---- the placement ----------------------------------------------------------------------
  var at = shown.length ? place(shown) : {};
  var worstY = 0, worstX = 0, offY = null, offX = null;
  shown.forEach(function (id) {
    var dy = Math.abs(drawn[id].y - at[id]);
    var dx = Math.abs(drawn[id].x - N[id].x);
    if (dy > worstY) { worstY = dy; offY = id + ' at ' + drawn[id].y + ' where ' + at[id]; }
    if (dx > worstX) { worstX = dx; offX = id + ' at ' + drawn[id].x + ' where ' + N[id].x; }
  });

  // ---- the edges, both directions ---------------------------------------------------------
  // A LINE IS DRAWN WHEN BOTH OF ITS ENDS ARE DRAWN, which is the whole of #111's rule. So the
  // expected set is computed from the canonical relationships and the tiles on screen, and the
  // two sets are required to be equal. Presence AND absence: the suite used to check what
  // survived and never that the rest had gone.
  var want = {}, wantN = 0;
  iv.edges.forEach(function (e) {
    if (!drawn[e.s] || !drawn[e.t]) return;
    want[e.s + '->' + e.t] = true;
    wantN++;
  });
  var got = {}, gotN = 0;
  Array.prototype.forEach.call(document.querySelectorAll('#graph g[data-edge]'), function (g) {
    var p = g.querySelector('path.edge, path.edge-ghost, path.edge-outside');
    if (!p) return;
    got[g.getAttribute('data-edge')] = p.getAttribute('d');
    gotN++;
  });
  var missing = Object.keys(want).filter(function (k) { return got[k] === undefined; });
  var extra = Object.keys(got).filter(function (k) { return !want[k]; });

  var worstArc = 0, offArc = null;
  Object.keys(want).forEach(function (k) {
    if (got[k] === undefined) return;
    var p = k.split('->');
    var mine = arc({ x: N[p[0]].x, y: at[p[0]], col: colOf(N[p[0]].x) },
                   { x: N[p[1]].x, y: at[p[1]], col: colOf(N[p[1]].x) });
    if (mine === got[k]) return;
    var a = mine.match(/-?\\d+(\\.\\d+)?/g) || [], b = (got[k].match(/-?\\d+(\\.\\d+)?/g) || []);
    var worst = a.length === b.length ? 0 : Infinity, i;
    for (i = 0; i < a.length && i < b.length; i++) worst = Math.max(worst, Math.abs(a[i] - b[i]));
    if (worst > worstArc) { worstArc = worst; offArc = k + ': ' + got[k] + ' where ' + mine; }
  });

  // ---- who the window should have taken off, from the dates and nothing else ---------------
  // A SESSION IS IN THE WINDOW WHEN ITS DAY IS IN IT, AND A MODULE WHEN ITS SPAN MEETS IT. The
  // second is written as the interval overlap it is, \`from <= to of the window and to >= from\`,
  // rather than as the negation term.js writes, so this is the arithmetic and not a copy of the
  // expression. Reading a module's START only would take it off the picture in every week of it
  // but the first, which is the reading its own comment calls right and wrong, and which was
  // ungated: at three weeks it took Z-BL from 24 tiles to 0 of 34 with every gate green.
  var w = window.ZT.term().window;
  var range = w && w.from && w.to ? { from: w.from, to: w.to } : null;
  var dated = { governed: 0, inside: 0, outside: 0, wrong: [] };
  if (range) {
    all.forEach(function (id) {
      var n = N[id], meets = null;
      if (n.type === 'CohortSession' && n.at) meets = n.at >= range.from && n.at <= range.to;
      else if (n.type === 'ModuleDelivery' && n.from && n.to) {
        meets = n.from <= range.to && n.to >= range.from;
      }
      if (meets === null) return;
      dated.governed++;
      if (meets) dated.inside++; else dated.outside++;
      if (meets !== !!drawn[id]) {
        dated.wrong.push(id + ' ' + (meets ? 'in the window and off the picture'
                                           : 'outside the window and on it'));
      }
    });
  }

  return { key: key, grain: grain, range: range, canonNodes: iv.nodes.length,
           canonEdges: iv.edges.length, tiles: shown.length, strangers: strangers,
           mismatched: mismatched, pitch: pitch, top: Math.round(top * 10) / 10,
           worstY: Math.round(worstY * 1000) / 1000, offY: offY,
           worstX: Math.round(worstX * 1000) / 1000, offX: offX,
           edgesWanted: wantN, edgesDrawn: gotN, missing: missing, extra: extra,
           worstArc: Math.round(worstArc * 1000) / 1000, offArc: offArc,
           dated: dated };
})()`;

// =================================================================================================
// THE GRAIN CONTROL, BOTH ALTITUDES. Issue 89, folded in by issue 109 out of build/check_grain.mjs.
//
// EVERY ONE OF THE 33 IS A CLAIM ISSUE 89 DECIDED and not a count of what the code happens to do,
// and this is that file's own list of them, kept:
//
//   both altitudes are artefacts     each of the fourteen drawings carries its own digest and the
//                                    page reports the digest of the one it is showing, which is
//                                    what makes the collapse a switch between two things
//                                    check_build.sh reproduces rather than a run-time layout
//   the count is never lost          a collapsed module says how many session templates it holds,
//                                    on its own face, in #83's idiom
//   the picture is well formed       no two tiles overlap, no line ends on a tile that is not
//                                    there, no two verb chips pile up, at BOTH altitudes
//   the fold is counted              a line standing for more than one relationship says so
//   #100 still holds on both grains  reflowing the full node set reproduces the build's own
//                                    coordinates to a tenth of a unit, filtered and unfiltered,
//                                    at both altitudes. This is the hardest claim on the card
//   the address carries it           a collapsed view can be linked and reloaded
//   the reader keeps their place     the tile they had open is the tile they land on
//   the two controls compose         a window over a term filters both altitudes
//   the header did not grow          #98's row is one baseline, every control 24 by 24, and 390
//                                    does not scroll sideways
// =================================================================================================
const GRAIN_WHERE = 'grain';
const GRAIN_KEYS = ['ZIB', 'ZSC', 'ZBL', 'ZPE', 'ZHR', 'ZDS', 'ZCFA'];

// The two windows the grain phases need, in the shape VIEWPORTS uses so that openPage can size
// them. They are deliberately NOT members of VIEWPORTS: nothing here is a claim about a width in
// the sense that list means, and adding them there would multiply every `every` phase by two.
// The wide one is emulated rather than fitted, which is what build/check_grain.mjs did, so the
// box these assertions were written against is the box they still get.
const GRAIN_VIEWPORT = { w: 1536, h: 839, emulate: true, pointer: false };
const GRAIN_PHONE = { w: 390, h: 844, emulate: true, pointer: false };

// Everything about one drawing that can be read off the painted page rather than off a claim
// about it. Boxes are in SVG user units, taken from the attributes the build wrote.
const GRAIN_READ = `
  function box(el, pad) {
    return { x: +el.getAttribute('x'), y: +el.getAttribute('y'),
             w: +el.getAttribute('width'), h: +el.getAttribute('height') };
  }
  function hits(a, b) {
    return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  }
  var svg = document.getElementById('graph');
  var tiles = [], chips = [], ids = {}, edges = [], folds = 0, foldSum = 0;
  svg.querySelectorAll('g[data-node], g[data-outside]').forEach(function (g) {
    ids[g.getAttribute('data-node') || g.getAttribute('data-outside')] = true;
    var r = g.querySelector('rect.tile-bg');
    if (r) tiles.push(box(r));
  });
  svg.querySelectorAll('rect.chip-bg').forEach(function (r) { chips.push(box(r)); });
  svg.querySelectorAll('g[data-edge]').forEach(function (g) {
    if (!g.querySelector('path.edge, path.edge-ghost, path.edge-outside')) return;
    var k = g.getAttribute('data-edge');
    var t = g.querySelector('title');
    var m = t && /, (\\d+) relationships drawn as one line/.exec(t.textContent);
    if (m) { folds++; foldSum += +m[1]; }
    edges.push(k);
  });
  var tileOverlap = 0, chipPile = 0, dangling = [];
  for (var i = 0; i < tiles.length; i++) {
    for (var j = i + 1; j < tiles.length; j++) if (hits(tiles[i], tiles[j])) tileOverlap++;
  }
  var chipWorst = 0;
  for (var i2 = 0; i2 < chips.length; i2++) {
    for (var j2 = i2 + 1; j2 < chips.length; j2++) {
      var a2 = chips[i2], b2 = chips[j2];
      var ox = Math.min(a2.x + a2.w, b2.x + b2.w) - Math.max(a2.x, b2.x);
      var oy = Math.min(a2.y + a2.h, b2.y + b2.h) - Math.max(a2.y, b2.y);
      if (ox > 0 && oy > 0) { chipPile++; chipWorst = Math.max(chipWorst, Math.min(ox, oy)); }
    }
  }
  edges.forEach(function (k) {
    var p = k.split('->');
    if (!ids[p[0]] || !ids[p[1]]) dangling.push(k);
  });
  var counted = [];
  svg.querySelectorAll('g[data-node] text.lbl-tail').forEach(function (t) {
    counted.push(t.textContent);
  });
  return { tiles: tiles.length, chips: chips.length, edges: edges.length,
           tileOverlap: tileOverlap, chipPile: chipPile, chipWorst: chipWorst,
           dangling: dangling,
           folds: folds, foldSum: foldSum, tails: counted,
           // The DRAWING's extent, off the page's own report, and NOT the viewBox: the canvas is
           // a viewport onto a plane, so the viewBox is where the reader is looking and moves
           // with every pan.
           h: window.ZT.programme().h, w: window.ZT.programme().w,
           grain: window.ZT.grain(), reflow: window.ZT.reflow(),
           filtered: window.ZT.filtered(), digest: window.ZT.programme().digest };
`;

// The nine phases, in one function so that the values one phase measures are the values the next
// one reasons about, which is how build/check_grain.mjs was written and is why the assertions
// below are that file's, unedited. What changed in the move is the spelling of the harness calls
// and nothing else: `evaluate(b, X)` is `ev(X)`, `read(b)` is `read()`, `goto(b, url)` is
// `goto(url)`, and the file's private assert() is this file's, which takes its four arguments in
// the same order and prints the same two lines on a failure.
//
// EACH PHASE IS A group(), WHICH THE ORIGINAL DID NOT HAVE. A phase that throws is recorded as a
// failure of that phase and the eight others still run, so the reflow phase falling over no longer
// costs the header its measurement. The count audit is what makes that safe rather than lenient: a
// thrown phase records one failure where it intended four, the run comes out short of 177, and the
// verdict says the suite did not run what it says it intends.
async function runGrain(chrome, base) {
  const KEYS = GRAIN_KEYS;
  const per = {}, digests = {}, heights = {}, filteredReflow = {}, truth = {};
  let bl = null;
  let page = null;

  const ev = expr => page.evaluate('(function(){' + expr + '})()');
  const read = () => ev(GRAIN_READ);
  const goto = async url => {
    await page.send('Page.navigate', { url });
    for (let i = 0; i < 200; i++) {
      const ready = await ev('return !!window.ZT;').catch(() => false);
      if (ready) { await sleep(120); return; }
      await sleep(50);
    }
    throw new Error('window.ZT never appeared at ' + url);
  };

  setWhere(GRAIN_WHERE);
  console.log('\n--- grain, both altitudes of the drawing ---');
  const b = await launchWithRetry(chrome, Math.max(GRAIN_VIEWPORT.w, WINDOW_FLOOR_PX),
                                  GRAIN_VIEWPORT.h, `grain ${GRAIN_VIEWPORT.w}x${GRAIN_VIEWPORT.h}`);
  try {
    page = await openPage(b.cdp, GRAIN_VIEWPORT);
    console.log(`  browser:   ${b.browser}`);
    console.log(`  requested: ${GRAIN_VIEWPORT.w} by ${GRAIN_VIEWPORT.h}`);
    console.log(`  actual:    ${page.actual.w} by ${page.actual.h}   via ${page.mechanism}`);

    // ---- two artefacts ----------------------------------------------------
    await group('two artefacts', async () => {
      for (const k of KEYS) {
        for (const g of ['sessions', 'modules']) {
          await goto(base + '#/p/' + k + (g === 'modules' ? '/modules' : ''));
          const r = await read();
          per[k + '/' + g] = r;
          digests[k + '/' + g] = r.digest;
          heights[k + '/' + g] = r.h;
        }
      }
      const all = Object.values(digests);
      assert('each of the fourteen drawings carries its own digest',
        new Set(all).size === all.length && all.every(d => /^[0-9a-f]{7}$/.test(d)),
        '14 distinct seven-character digests',
        JSON.stringify(digests));
      assert('the page reports the grain the address named, on all seven',
        KEYS.every(k => per[k + '/sessions'].grain.grain === 'sessions' &&
                        per[k + '/modules'].grain.grain === 'modules'),
        'sessions on the bare address and modules on the suffixed one',
        KEYS.map(k => k + ':' + per[k + '/modules'].grain.grain).join(' '));
      const shrank = ['ZSC', 'ZBL'].every(k => heights[k + '/modules'] < heights[k + '/sessions'] / 2);
      assert('the two tall drawings are less than half as tall collapsed',
        shrank, 'ZSC and ZBL under half their sessions-grain height',
        ['ZSC', 'ZBL'].map(k => `${k} ${heights[k + '/sessions']} to ${heights[k + '/modules']}`)
          .join(', '));
      assert('Z-CFA collapses to the same drawing and says why',
        per['ZCFA/modules'].grain.modules === 0 &&
        per['ZCFA/modules'].tiles === per['ZCFA/sessions'].tiles,
        'no module tile, and the same tile count at both altitudes',
        `${per['ZCFA/modules'].grain.modules} modules, ` +
        `${per['ZCFA/modules'].tiles} tiles against ${per['ZCFA/sessions'].tiles}`);
    });

    // ---- the count --------------------------------------------------------
    await group('the count', async () => {
      await goto(base + '#/p/ZBL/modules');
      bl = await read();
      const tails = bl.tails.filter(t => /session templates$/.test(t));
      assert('every module tile says how many session templates it holds',
        tails.length === bl.grain.modules && tails.length > 0,
        `${bl.grain.modules} tails ending in "session templates"`,
        `${tails.length}: ${tails.join(' | ')}`);
      // AND THE TOTAL IT NAMES IS RECOMPUTED HERE RATHER THAN PARSED AND BELIEVED. Issue 115's
      // F12. `tails.every(...)` over a list filtered by the same words it then matches is
      // vacuously true on an empty list, and the number inside the idiom was read by nothing at
      // all: a module tile could say "all 14 session templates" of a module holding fifteen and
      // every gate in this repository was green. So the driver joins the two altitudes itself.
      // Each module tile's own count comes from the OTHER grain, by counting the session
      // templates the sessions-grain document files under that module's name, which is the join
      // the collapse is made of, checked from outside rather than read back off the tile.
      const said = await ev(`
        function propOf(n, k) {
          var out = null;
          (n.props || []).forEach(function (p) { if (p.k === k) out = p.v; });
          return out;
        }
        var key = window.ZT.programme().key, want = {}, total = 0, mods = {};
        window.GI.views.forEach(function (v) {
          if (v.key !== key) return;
          v.nodes.forEach(function (n) {
            if (n.type !== 'SessionTemplate') return;
            var m = propOf(n, 'module_name') || '(none)';
            want[m] = (want[m] || 0) + 1;
            total++;
          });
        });
        window.GI.collapsed.forEach(function (v) {
          if (v.key !== key) return;
          v.nodes.forEach(function (n) {
            if (n.type !== 'Module') return;
            // The template's own module_name carries the code and the module tile keeps the two
            // apart, so the join is made here rather than assumed: this is the same pair of
            // fields the collapse itself joins on.
            var syl = /^(\\d+) of the/.exec(String(propOf(n, 'in_the_syllabus') || ''));
            mods[n.id] = { name: propOf(n, 'module_code') + ' ' + propOf(n, 'module_name'),
                           syllabus: syl ? Number(syl[1]) : null };
          });
        });
        var got = [];
        document.querySelectorAll('#graph g[data-node]').forEach(function (g) {
          var t = g.querySelector('text.lbl-tail');
          if (!t || !/session templates$/.test(t.textContent)) return;
          var id = g.getAttribute('data-node'), m = mods[id] || null;
          got.push({ id: id, module: m ? m.name : null, tail: t.textContent,
                     syllabus: m ? m.syllabus : null,
                     want: (m && want[m.name] !== undefined) ? want[m.name] : null });
        });
        return { got: got, total: total };`);
      // "all N" says the drawing holds the whole module and "N of M" says it holds a sample of
      // it, so the idiom is not free: which form is used is itself a claim and is checked.
      const IDIOM = /^(?:all (\d+)|(\d+) of (\d+)) session templates$/;
      const readTail = (t) => {
        const m = IDIOM.exec(t);
        if (!m) return null;
        return m[1] !== undefined
          ? { drawn: Number(m[1]), of: Number(m[1]), whole: true }
          : { drawn: Number(m[2]), of: Number(m[3]), whole: false };
      };
      const wrong = said.got.filter(r => {
        const t = readTail(r.tail);
        return !t || r.want === null || r.syllabus === null || t.drawn !== r.want ||
               t.of !== r.syllabus || t.whole !== (t.drawn === r.syllabus);
      });
      const namedDrawn = said.got.reduce((a, r) => {
        const t = readTail(r.tail);
        return a + (t ? t.drawn : 0);
      }, 0);
      assert('the count is in #83\'s idiom and names the syllabus total',
        said.got.length === bl.grain.modules && said.got.length > 0 && wrong.length === 0 &&
          namedDrawn === said.total,
        `one tail per module reading "N of M session templates" or "all M", each N the number ` +
          `of session templates that module holds at the sessions grain and each M its own ` +
          `syllabus, together accounting for all ${said.total} templates the drawing collapsed`,
        `${said.got.length} tails of ${bl.grain.modules} modules, ${wrong.length} disagreeing ` +
          `with the document ${JSON.stringify(wrong)}, naming ${namedDrawn} templates`);
      assert('the term lane says how many sessions each module ran',
        bl.tails.filter(t => /(^| )sessions$/.test(t)).length >= bl.grain.modules,
        'one tail per module delivery',
        bl.tails.filter(t => /(^| )sessions$/.test(t)).join(' | '));
    });

    // ---- well formed ------------------------------------------------------
    await group('well formed', async () => {
      for (const g of ['sessions', 'modules']) {
        const bad = KEYS.filter(k => per[k + '/' + g].tileOverlap > 0);
        assert(`no two tiles overlap, on any of the seven, at the ${g} grain`,
          bad.length === 0, 'no overlapping pair anywhere',
          bad.map(k => `${k} ${per[k + '/' + g].tileOverlap}`).join(', '));
        const dang = KEYS.filter(k => per[k + '/' + g].dangling.length > 0);
        assert(`no line ends on a tile that is not drawn, at the ${g} grain`,
          dang.length === 0, 'every edge endpoint painted',
          dang.map(k => `${k} ${per[k + '/' + g].dangling.join(' ')}`).join(', '));
        // NOT "NO PAIR TOUCHES", AND THE TOLERANCE IS STATED RATHER THAN TUNED. The build already
        // reports one overlapping pair on Z-BL at the sessions grain, worst 0.1 units, and has
        // since #83; it is a report and not a gate there for the reason recorded in
        // build/build_layout.py, that the cure for a pile is to stop two lines crossing at their
        // own midpoints. What would be a defect is a pile a reader can see, so what is asserted is
        // the DEPTH, at one unit, which is a fourteenth of a chip's height.
        const pile = KEYS.filter(k => per[k + '/' + g].chipWorst > 1);
        assert(`no verb chip is buried under another, at the ${g} grain`,
          pile.length === 0, 'no pair overlapping by more than one unit',
          KEYS.map(k => `${k} ${per[k + '/' + g].chipPile} pair(s), worst ` +
                        `${per[k + '/' + g].chipWorst.toFixed(2)}`).join('; '));
      }
    });

    // ---- the fold ---------------------------------------------------------
    await group('the fold', async () => {
      assert('a folded line says how many relationships it stands for',
        bl.folds > 0 && bl.foldSum > bl.folds,
        'at least one line carrying a count above one',
        `${bl.folds} folded line(s), standing for ${bl.foldSum}`);
      assert('the page reports what the fold cost, and it is not zero on Z-BL',
        bl.grain.folded > 0,
        'a positive folded count on a view that collapses 28 templates into 5',
        String(bl.grain.folded));
      // The sessions grain draws every relationship as its own line, and the number the control
      // reports is a fact about what the OTHER altitude would cost, which is what the reader is
      // deciding about when they press it. Both halves asserted, because reporting zero there
      // would leave a reader with no way to know whether collapsing loses anything.
      assert('nothing is folded at the sessions grain, and the control still says what a collapse would cost',
        per['ZBL/sessions'].folds === 0 &&
        per['ZBL/sessions'].grain.folded === per['ZBL/modules'].grain.folded &&
        per['ZBL/sessions'].grain.folded > 0,
        'no folded line on screen, and the same collapse cost reported at both altitudes',
        `${per['ZBL/sessions'].folds} line(s) on screen, cost reported ` +
        `${per['ZBL/sessions'].grain.folded} against ${per['ZBL/modules'].grain.folded}`);
    });

    // ---- reflow, the hardest claim on the card ------------------------------
    await group('reflow', async () => {
      const TOL = 0.1;
      for (const g of ['sessions', 'modules']) {
        const worst = KEYS.map(k => per[k + '/' + g].reflow);
        assert(`the unfiltered reflow lands on the build's own coordinates, at the ${g} grain`,
          worst.every(r => r && r.dy <= TOL && r.dp <= TOL && r.arrows <= TOL && r.rev === 0),
          'dy, dp and arrows within a tenth of a unit and no edge reversed',
          KEYS.map((k, i) => `${k} dy ${worst[i].dy} dp ${worst[i].dp} ` +
                             `arrows ${worst[i].arrows} rev ${worst[i].rev}`).join('; '));
      }
      // And with the window on, which is the composition #100 and this card have to keep together.
      for (const g of ['sessions', 'modules']) {
        for (const k of ['ZBL', 'ZSC']) {
          await goto(base + '#/p/' + k + (g === 'modules' ? '/modules' : ''));
          await ev(`
            document.getElementById('wnbtn').click();
            var b = Array.prototype.filter.call(
              document.querySelectorAll('#wnmenu .wn-weeks'),
              function (x) { return x.textContent === '3 weeks'; })[0];
            b.click();
            document.getElementById('wnbtn').click();
            return true;`);
          await sleep(150);
          const r = await read();
          filteredReflow[k + '/' + g] = { on: r.filtered.on, reflow: r.reflow,
                                          shown: r.filtered.shown.length };
          truth[k + '/' + g] = await page.evaluate(FILTERED_TRUTH);
        }
      }
      const T = Object.entries(truth);
      const errored = T.filter(([, t]) => t.error || t.mismatched.length || t.strangers.length);
      // TILES OFF THE PICTURE, COUNTED ON THE PICTURE. Issue 115's F11: this asserted `r.on` and
      // nothing else, and the suite computed `shown` and threw it away, so the second half of the
      // assertion's own name was never read. Disabling the line in render.js that marks a node
      // outside the window left the window switched on, taking nothing off, and this stayed
      // green. What is read now is the tiles the browser drew against the size of the canonical
      // node set, both recomputed from the two documents.
      const notCut = T.filter(([, t]) => !(t.tiles > 0 && t.tiles < t.canonNodes));
      assert('a window is on and has taken tiles off the picture, at both grains',
        Object.values(filteredReflow).every(r => r.on) && errored.length === 0 &&
          T.length === 4 && notCut.length === 0,
        'the window on at both altitudes, and each of the four drawings showing some of its ' +
          'tiles and not all of them',
        errored.length
          ? errored.map(([k, t]) => `${k}: ${t.error || t.mismatched.concat(t.strangers).join(' ')}`).join('; ')
          : T.map(([k, t]) => `${k} ${t.tiles} of ${t.canonNodes}`).join('; '));
      assert('the reflow still lands on canonical with a window on, at both grains',
        Object.values(filteredReflow).every(r => r.reflow.dy <= TOL && r.reflow.dp <= TOL &&
                                                 r.reflow.arrows <= TOL && r.reflow.rev === 0),
        'dy, dp and arrows within a tenth of a unit and no edge reversed',
        Object.entries(filteredReflow)
          .map(([k, r]) => `${k} dy ${r.reflow.dy} dp ${r.reflow.dp} arrows ${r.reflow.arrows}`)
          .join('; '));

      // AND THE FILTERED DRAWING ITSELF, WHICH THE THREE ASSERTIONS ABOVE CANNOT SEE. The one
      // above reads `faithful(CANON)`, and CANON is what the build wrote: setWindow() never
      // touches it, so that number is the same whatever the filtered drawing does with itself.
      // These three read the filtered drawing off the DOM against FILTERED_TRUTH's own packing.
      const misplaced = T.filter(([, t]) => !(t.worstY <= 0.05 && t.worstX <= 0.05 && t.tiles > 1));
      assert('and the tiles it left are packed where the build\'s own rule puts that set, recomputed here',
        errored.length === 0 && misplaced.length === 0,
        'every tile on every one of the four filtered drawings within a twentieth of a unit of ' +
          'the y a second implementation of pack() gives it, and on its canonical x',
        misplaced.length
          ? misplaced.map(([k, t]) => `${k} worst y ${t.worstY} (${t.offY}), worst x ` +
              `${t.worstX} (${t.offX})`).join('; ')
          : T.map(([k, t]) => `${k} ${t.tiles} tiles, worst ${t.worstY}`).join('; '));

      const wrongEdges = T.filter(([, t]) => t.missing.length || t.extra.length ||
                                             !(t.edgesWanted > 0));
      assert('exactly the relationships whose two ends survived are drawn, and no others',
        errored.length === 0 && wrongEdges.length === 0,
        'on each of the four, the set of lines on the canvas equal to the set of canonical ' +
          'relationships with both ends on the canvas, neither short nor over',
        wrongEdges.length
          ? wrongEdges.map(([k, t]) => `${k} wanted ${t.edgesWanted} drew ${t.edgesDrawn}, ` +
              `${t.missing.length} missing (${t.missing.slice(0, 3).join(' ')}), ` +
              `${t.extra.length} over (${t.extra.slice(0, 3).join(' ')})`).join('; ')
          : T.map(([k, t]) => `${k} ${t.edgesWanted} of ${t.canonEdges}`).join('; '));

      const bentArcs = T.filter(([, t]) => !(t.worstArc <= TOL));
      assert('and every line is the curve the two tiles it joins put it on, recomputed here',
        errored.length === 0 && bentArcs.length === 0,
        'every path on every one of the four within a tenth of a unit of the arc a second ' +
          'implementation of edgeGeom() draws between its own two ends',
        bentArcs.length
          ? bentArcs.map(([k, t]) => `${k} worst ${t.worstArc} on ${t.offArc}`).join('; ')
          : T.map(([k, t]) => `${k} worst ${t.worstArc}`).join('; '));

      // AND THE SET ITSELF, FROM THE DATES. Issue 115's F21. The modules-grain predicate was
      // ungated: term.js reads a module's span and its own comment names the wrong reading, and
      // swapping to it took Z-BL from 24 tiles to 0 of 34 at 177 of 177, because the only
      // modules-grain check was `hidden.length > 0`, which a filter that deletes everything
      // satisfies. There is now the same both-directions reading the sessions grain has had.
      const misdated = T.filter(([, t]) => !t.range || t.dated.wrong.length ||
                                           !(t.dated.inside > 0 && t.dated.outside > 0));
      assert('and every tile the window\'s weeks meet is on the picture and every one they miss is off it',
        errored.length === 0 && misdated.length === 0,
        'on each of the four, every dated tile judged from its own date or span against the ' +
          'window the control reports, with tiles on both sides of the line',
        misdated.map(([k, t]) => `${k} ${JSON.stringify(t.range)} ` +
          `${t.dated.inside} in ${t.dated.outside} out, wrong ` +
          `${JSON.stringify(t.dated.wrong.slice(0, 4))}`).join('; ') ||
          T.map(([k, t]) => `${k} ${t.dated.inside} in ${t.dated.outside} out`).join('; '));
    });

    // ---- the address ------------------------------------------------------
    await group('the address', async () => {
      await goto(base + '#/p/ZSC/modules');
      const reloaded = await ev('return { hash: location.hash, g: window.ZT.grain() };');
      assert('a collapsed view survives a reload of its own address',
        reloaded.g.grain === 'modules' && /\/modules$/.test(reloaded.hash),
        'the modules grain on #/p/ZSC/modules',
        JSON.stringify(reloaded));
      // EVERY ITEM AND NOT AN ITEM. Issue 115's F10. The probe here was
      // `#pgmenu .pgitem[href$="/modules"]`, a selector that can only ever return an item which
      // kept the altitude, beside `n === 7`, which is the picker's size and not a count of items
      // that kept it. Six of the seven losing the grain was 177 of 177. So the items are
      // enumerated, every href is required to carry the altitude, and the seven programmes they
      // address are required to be the seven the document declares rather than seven of anything.
      const moved = await ev(`
        var items = Array.prototype.slice.call(document.querySelectorAll('#pgmenu .pgitem'));
        return { hrefs: items.map(function (a) { return a.getAttribute('href'); }),
                 keys: window.GI.views.map(function (v) { return v.key; }) };`);
      const AT_MODULES = /^#\/p\/([A-Za-z0-9-]+)\/modules$/;
      const pickerKeys = moved.hrefs.map(h => (AT_MODULES.exec(h || '') || [])[1]).filter(Boolean);
      assert('the programme picker keeps the altitude when it moves programme',
        moved.hrefs.length === moved.keys.length && moved.keys.length > 1 &&
          pickerKeys.length === moved.hrefs.length &&
          moved.keys.every(k => pickerKeys.indexOf(k) !== -1) &&
          new Set(pickerKeys).size === pickerKeys.length,
        `${moved.keys.length} items, one per programme in the document, every one of them ` +
          'addressing the modules grain',
        JSON.stringify({ kept: pickerKeys.length, of: moved.hrefs.length, hrefs: moved.hrefs }));
      await goto(base + '#/p/ZSC/nonsense');
      assert('an altitude nobody recognises is the sessions grain and not an error',
        (await ev('return window.ZT.grain().grain;')) === 'sessions',
        'sessions', await ev('return window.ZT.grain().grain;'));
    });

    // ---- keeping the reader's place ---------------------------------------
    await group('keeping place', async () => {
      await goto(base + '#/p/ZBL');
      // The window from the reflow phase is still on: this page keeps its state across a hash
      // change, which is the behaviour, so the driver takes it off rather than measuring one
      // control through another.
      await ev(`
        document.getElementById('wnbtn').click();
        Array.prototype.filter.call(
          document.querySelectorAll('#wnmenu .wn-weeks'),
          function (x) { return x.textContent === 'whole term'; })[0].click();
        document.getElementById('wnbtn').click();
        return true;`);
      await sleep(200);
      // WHICH MODULE, AND NOT ONLY WHICH KIND OF TILE. Both assertions below used to read
      // `sel.type` and nothing else, so a page that landed the reader on a module they had never
      // opened, and returned them to a template of a different module again, still reported every
      // assertion passing. The identity both of them promise is the whole content of the feature:
      // "the module that swallowed it" is a claim about WHICH module.
      //
      // READ OFF THE PANEL, which is where the reader reads it. A session template's panel carries
      // `module_name` and a module tile is labelled with that same name, which is the join
      // app.js's twin() makes; taking one from each side and requiring them equal is that join
      // checked from outside rather than a second copy of it.
      const moduleOfPanel = `(function () {
        var dl = document.getElementById('pprops'), k = null, out = null;
        Array.prototype.forEach.call(dl.children, function (el) {
          if (el.tagName === 'DT') k = el.textContent;
          else if (k === 'module_name') out = el.textContent;
        });
        return out;
      })()`;
      const picked = await ev(`
        var g = null;
        document.querySelectorAll('#graph g[data-node]').forEach(function (x) {
          if (g) return;
          var t = x.querySelector('title');
          if (t && /Session template/.test(t.textContent)) g = x;
        });
        g.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return { sel: window.ZT.selected(), module: ${moduleOfPanel} };`);
      await ev(`location.hash = '#/p/ZBL/modules'; return true;`);
      await sleep(250);
      const landed = await ev('return { sel: window.ZT.selected(), g: window.ZT.grain() };');
      assert('collapsing carries the open tile onto the module that swallowed it',
        !!landed.sel && landed.sel.type === 'Module' && !!picked.module &&
          landed.sel.label === picked.module,
        `the Module labelled ${JSON.stringify(picked.module)}, which is the module the template ` +
          'the reader had open says it is in',
        JSON.stringify({ was: picked, now: landed.sel }));
      await ev(`location.hash = '#/p/ZBL'; return true;`);
      await sleep(250);
      const back = await ev(`return { sel: window.ZT.selected(), module: ${moduleOfPanel} };`);
      assert('expanding carries it back onto a session template of that module',
        !!back.sel && back.sel.type === 'Session template' && back.module === picked.module,
        `a Session template of ${JSON.stringify(picked.module)} selected after the expansion`,
        JSON.stringify(back));
      assert('the drawing on screen is refitted rather than left at the old extent',
        await ev(`
          var s = window.ZT.view(), g = window.ZT.programme();
          return s.k > 0 && g.h * s.k <= s.h + 2;`),
        'the whole drawing inside the viewport after the change of altitude',
        JSON.stringify(await ev('return { v: window.ZT.view(), p: window.ZT.programme() };')));
    });

    // ---- the two controls compose -----------------------------------------
    await group('composing', async () => {
      await goto(base + '#/p/ZBL/modules');
      const before = await ev('return window.ZT.gaps();');
      await ev(`
        document.getElementById('wnbtn').click();
        var b = Array.prototype.filter.call(
          document.querySelectorAll('#wnmenu .wn-weeks'),
          function (x) { return x.textContent === '1 week'; })[0];
        b.click();
        document.getElementById('wnbtn').click();
        return true;`);
      await sleep(200);
      const after = await ev(`
        return { gaps: window.ZT.gaps(), f: window.ZT.filtered(), g: window.ZT.grain() };`);
      assert('a window filters the collapsed drawing as well as the expanded one',
        after.f.on && after.f.hidden.length > 0,
        'tiles taken off the collapsed picture by the window',
        JSON.stringify({ hidden: after.f.hidden.length, shown: after.f.shown.length }));
      assert('a module whose sessions are all outside the window goes with them',
        after.f.hidden.some(id => /mdel_/.test(id)),
        'at least one module delivery outside a one week window',
        after.f.hidden.join(' '));
      assert('the gap count moves with the window at the modules grain',
        after.gaps.total !== null && after.gaps.total <= before.total,
        'no more gaps in one week than in the whole term',
        `${before.total} then ${after.gaps.total}`);
      assert('the altitude is unchanged by the window',
        after.g.grain === 'modules', 'modules', after.g.grain);
    });

    // ---- the header -------------------------------------------------------
    await group('the header', async () => {
      await goto(base + '#/p/ZBL/modules');
      // The header and not the nav, since issue 120 split the row into a readout and an action
      // bar: a selector naming `.hnav` would measure five of the nine and would not reach the
      // grain control this phase is about at all.
      const row = await ev(`
        var out = [];
        document.querySelectorAll('header button, header a').forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (!r.width && !r.height) return;
          out.push({ id: el.id || el.className, w: +r.width.toFixed(2), h: +r.height.toFixed(2) });
        });
        return { row: out, header: document.querySelector('header').offsetHeight };`);
      const hs = Array.from(new Set(row.row.map(c => c.h)));
      assert('every control in the header row is one height and at least 24 by 24',
        row.row.length >= 9 && hs.length === 1 && !row.row.some(c => Math.min(c.w, c.h) < 24),
        '9 or more controls on one height, none under 24 by 24',
        JSON.stringify({ n: row.row.length, heights: hs,
                         small: row.row.filter(c => Math.min(c.w, c.h) < 24) }));
      // `grain modules` and not `grain: modules` since issue 120. The claim is unchanged: the
      // control is in the header and its own text says which altitude is drawn.
      assert('the grain control is in the row and reads its own state',
        row.row.some(c => c.id === 'grbtn') &&
        (await ev(`return document.getElementById('grbtn').textContent;`)) ===
          'grain modules',
        'a control reading "grain modules"',
        await ev(`return document.getElementById('grbtn').textContent;`));
    });

    grainReport(KEYS, per, heights, filteredReflow);

    // A page exception is what build/check_grain.mjs answered 2 for, and the classification is
    // kept: it is a statement about the run rather than a failed assertion about the drawing, so
    // it goes in the harness list and the verdict says the suite could not answer.
    const threw = page.console.filter(c => c.kind === 'exception');
    if (threw.length) {
      harnessFail('the page threw while the grain phases drove it',
                  threw.map(t => t.text).join('\n'));
    }
  } finally {
    b.close();
    page = null;
  }

  // The narrow half of the header phase, in a window of its own, which is what the original did:
  // 390 is below the browser's window floor and a page emulated down to it inside a wide window
  // has a different scrollingElement to the one a reader gets.
  const phone = await launchWithRetry(chrome, WINDOW_FLOOR_PX, GRAIN_PHONE.h,
                                      `grain ${GRAIN_PHONE.w}x${GRAIN_PHONE.h}`);
  try {
    page = await openPage(phone.cdp, GRAIN_PHONE);
    console.log(`  actual:    ${page.actual.w} by ${page.actual.h}   via ${page.mechanism}`);
    await group('the header', async () => {
      await goto(base + '#/p/ZBL/modules');
      const w = await ev(`
        var m = document.scrollingElement;
        return { scrollWidth: m.scrollWidth, clientWidth: m.clientWidth,
                 header: document.querySelector('header').offsetHeight,
                 inner: window.innerHeight };`);
      // WRITTEN WITH A TRAILING ZERO, which build/model.py's two sRGB constants already are and
      // for the same reason: a digit, a dot and exactly three digits is how a grouped amount is
      // written in Spanish, the repository's safety gate reads every tracked file and says so,
      // and the repair for that is the number and never the rule. The value is unchanged.
      const CHROME_SHARE = 0.2370;
      assert('the collapsed page does not scroll sideways at 390, and the header is 23.7 per cent or less',
        w.scrollWidth === w.clientWidth && w.header / w.inner <= CHROME_SHARE + 0.0005,
        'no sideways scroll and header chrome at or under 23.7 per cent',
        JSON.stringify(Object.assign({}, w, { share: (w.header / w.inner).toFixed(4) })),
        // The measurement on the pass as well as on the failure, since issue 124. A card that is
        // told not to spend a gain somebody else made has to be able to read what the gain is
        // without planting a failure to see it, and the number a run prints is the number a
        // report can quote.
        `header ${w.header} of ${w.inner}, share ${(w.header / w.inner).toFixed(4)}`);
    });
  } finally {
    phone.close();
    page = null;
  }
}

// What the grain phases measured, printed whether or not anything failed, for the reason the count
// audit is printed on a clean run: a number nobody has seen agree is a number nobody has checked.
function grainReport(KEYS, per, heights, filteredReflow) {
  if (!Object.keys(per).length) return;
  console.log('\nheights, by view and grain:');
  for (const k of KEYS) {
    const s = per[k + '/sessions'], m = per[k + '/modules'];
    if (!s || !m) continue;
    console.log(`  ${k.padEnd(5)} sessions ${String(heights[k + '/sessions']).padStart(5)}   ` +
                `modules ${String(heights[k + '/modules']).padStart(5)}   ` +
                `tiles ${s.tiles} to ${m.tiles}   ` +
                `edges ${s.edges} to ${m.edges}   ` +
                `folded ${m.grain.folded} inside ${m.grain.inside}`);
  }
  console.log('\nreflow agreement, worst over the seven, dy / dp / arrows / reversed:');
  for (const g of ['sessions', 'modules']) {
    const rs = KEYS.map(k => per[k + '/' + g] && per[k + '/' + g].reflow).filter(Boolean);
    if (!rs.length) continue;
    console.log(`  ${g.padEnd(9)} ${Math.max(...rs.map(r => r.dy))} / ` +
                `${Math.max(...rs.map(r => r.dp))} / ${Math.max(...rs.map(r => r.arrows))} / ` +
                `${rs.reduce((a, r) => a + r.rev, 0)}`);
  }
  console.log('  filtered  ' + Object.entries(filteredReflow)
    .map(([k, r]) => `${k} ${r.reflow.dy}/${r.reflow.dp}/${r.reflow.arrows}/${r.reflow.rev}`)
    .join('  '));
}

// =================================================================================================
// The run
// =================================================================================================
async function runViewport(chrome, viewport, base, full, narrow) {
  const label = `${viewport.w}x${viewport.h}`;
  setWhere(label);
  console.log(`\n--- ${label} ---`);
  // A window big enough that the height correction below has somewhere to go, and the width
  // asked for where the browser will grant it. A launch that exhausts the retry budget throws a
  // HarnessFailure past every assertion in this function, which is the point: none of them ran,
  // so none of them has anything to say.
  const b = await launchWithRetry(chrome, Math.max(viewport.w, WINDOW_FLOOR_PX), viewport.h, label);
  try {
    const page = await openPage(b.cdp, viewport);
    console.log(`  browser:   ${b.browser}`);
    console.log(`  requested: ${viewport.w} by ${viewport.h}`);
    console.log(`  actual:    ${page.actual.w} by ${page.actual.h}   via ${page.mechanism}`);

    setPhase('the viewport opened');
    if (!phaseIsSkipped('the viewport opened')) {
      assert('the viewport the harness got is the viewport it asked for',
        page.actual.w === viewport.w && page.actual.h === viewport.h,
        `${viewport.w} by ${viewport.h}`, `${page.actual.w} by ${page.actual.h}`);

      await page.navigate(new URL('#/', base).toString());
      await page.waitFor(DIAGRAM_READY, 'the diagram to draw');
      pass('the page draws, and says so itself rather than being photographed');
    } else {
      // The page still has to be on screen for everything after this, whatever the affordance
      // says about counting the two assertions above.
      await page.navigate(new URL('#/', base).toString());
      await page.waitFor(DIAGRAM_READY, 'the diagram to draw');
    }
    setPhase('-');

    await group('every width', () => checkWidth(page, base));

    if (full) {
      await group('model and reveal', () => checkModelAndReveal(page));
      await group('cold load', () => checkColdLoad(page, base));
      await group('students', () => checkStudents(page));
      await group('term', () => checkTerm(page));
      // After `term`, which leaves the address on the diagram with no window on, and before the
      // phases that walk the seven programmes: this one walks them too and puts the drawing and
      // the address back the way it found them. Issue 122.
      await group('the sample', () => checkSample(page));
      // After `term`, which leaves the window off and the address on the diagram, and before
      // `header`, which walks all seven programmes: this one moves to a programme of its own
      // choosing and puts both back the way it found them. Issue 119.
      await group('the empty window', () => checkEmptyWindow(page));
      // After the two phases that leave the window off and the address on the diagram, and before
      // the phases that walk the seven programmes. It loads the review's address cold, which is
      // the only honest way to assert what a link opens on, and it leaves the page cold on the
      // diagram for the same reason `the empty window` puts the window back. Issue 124.
      await group('the review', () => checkReview(page, base));
      // After `the review`, which built the destination this one navigates to and leaves the page
      // cold on the diagram, and before the phases that walk the seven programmes: this one walks
      // them too and puts the address back where it found it. Issue 125.
      await group('the worklist', () => checkWorklist(page, base));
      // After the phases that arm and disarm the window, and before the phases that walk the
      // seven programmes: this one opens four menus, sixteen sheet addresses and the board and
      // puts the page back on the diagram with the sheet shut. Issue 128.
      await group('the cut', () => checkCut(page, base));
      await group('header', () => checkHeader(page));
      await group('the readout', () => checkReadout(page));
      await group('canvas', () => checkCanvas(page));
      await group('capture', () => checkCapture(page, base));
      await group('board', () => checkBoard(page, base));
    }

    if (narrow) {
      await group('the gutter on a phone', () => checkGutter(page));
    }

    setPhase('console and requests');
    if (!phaseIsSkipped('console and requests')) {
      checkConsole(page);
      checkRequests(page, base);
    }
    setPhase('-');
  } finally {
    b.close();
  }
}

// =================================================================================================
// The count. Issue 67, and it is build/model.py's terminator in another language: the emitter
// declares how many rows it meant to write and the reader refuses a stream that carries fewer,
// because everything a truncated stream does hold looks exactly like a clean run.
// =================================================================================================
const BEHAVIOURAL_VIEWPORT = VIEWPORTS.findIndex(v => v.pointer);

// AND A FOURTH KIND OF PHASE, WHICH IS ISSUE 115's F22. `behavioural` runs at the one viewport
// that can drive a pointer, and that viewport is the widest, so a claim about a declaration made
// only at the phone breakpoint had nowhere to run: app.css declares the sheet's gutter twice,
// once for the desk and once at 390, and zeroing the phone pair was 177 of 177 with the outline
// heading, the outline cell and the calendar month heading all back on the container's own edge,
// which is the exact defect #113 was filed on. `narrow` is the other end of the same rule as
// `behavioural`: a claim that is about the narrowest width and nothing else runs there and only
// there. Chosen by measurement rather than by position, the same way the pointer viewport is.
const NARROW_VIEWPORT = VIEWPORTS.reduce(
  (best, v, i) => (best < 0 || v.w < VIEWPORTS[best].w ? i : best), -1);

// The membership test is written out rather than left as "everything at the behavioural viewport",
// which is what it said until issue 109. That form was correct while there were two kinds of phase
// and would have silently swept the grain phases into the behavioural viewport's plan the moment a
// third kind existed, which is the class of defect this whole section is about.
function plannedPhases(index) {
  return Object.entries(PHASES)
    .filter(([, p]) => p.when === 'every' ||
                       (p.when === 'behavioural' && index === BEHAVIOURAL_VIEWPORT) ||
                       (p.when === 'narrow' && index === NARROW_VIEWPORT))
    .map(([name, p]) => ({ name, count: p.count, where: `${VIEWPORTS[index].w}x${VIEWPORTS[index].h}` }));
}

// The grain phases run once, outside the viewport loop, in a browser of their own. They are keyed
// under their own `where` so that a phase name shared with a viewport phase could never have its
// count read off the wrong run.
function plannedGrainPhases() {
  return Object.entries(PHASES)
    .filter(([, p]) => p.when === 'grain')
    .map(([name, p]) => ({ name, count: p.count, where: GRAIN_WHERE }));
}

function planTotal() {
  let n = 0;
  for (let i = 0; i < VIEWPORTS.length; i++) for (const p of plannedPhases(i)) n += p.count;
  for (const p of plannedGrainPhases()) n += p.count;
  return n;
}

// Every phase the run intended, against what it actually recorded. Reported as a table whether or
// not it agrees, because a count printed only when it disagrees is a count nobody has ever seen
// agree.
function auditCount() {
  const ran = new Map();
  for (const r of results) {
    const key = `${r.where}|${r.phase}`;
    ran.set(key, (ran.get(key) || 0) + 1);
  }
  const rows = [];
  let intended = 0, counted = 0;
  for (let i = 0; i < VIEWPORTS.length; i++) {
    for (const p of plannedPhases(i)) {
      const got = ran.get(`${p.where}|${p.name}`) || 0;
      rows.push({ ...p, got });
      intended += p.count;
      counted += got;
    }
  }
  for (const p of plannedGrainPhases()) {
    const got = ran.get(`${p.where}|${p.name}`) || 0;
    rows.push({ ...p, got });
    intended += p.count;
    counted += got;
  }
  // Anything recorded outside a planned phase, which is a new assertion nobody added to PHASES.
  const strays = [];
  for (const [key, n] of ran) {
    const [w, ph] = key.split('|');
    if (!rows.some(r => r.where === w && r.name === ph)) strays.push({ where: w, phase: ph, n });
  }
  return { rows, strays, intended, counted, total: results.length };
}

function reportCount(audit) {
  console.log('\nthe assertions this run intended, by phase:');
  console.log(`  ${'viewport'.padEnd(10)} ${'phase'.padEnd(24)} ${'intended'.padStart(8)} ${'ran'.padStart(5)}`);
  for (const r of audit.rows) {
    const mark = r.got === r.count ? ' ' : '<';
    console.log(`  ${r.where.padEnd(10)} ${r.name.padEnd(24)} ${String(r.count).padStart(8)} ${String(r.got).padStart(5)} ${mark}`);
  }
  for (const s of audit.strays) {
    console.log(`  ${s.where.padEnd(10)} ${(s.phase + ' (in no phase)').padEnd(24)} ${'-'.padStart(8)} ${String(s.n).padStart(5)} <`);
  }
  console.log(`  ${''.padEnd(10)} ${'total'.padEnd(24)} ${String(audit.intended).padStart(8)} ${String(audit.total).padStart(5)}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log([
      'node scripts/smoke.mjs [url]',
      '',
      '  With no argument, serves site/ from this working tree on a local port and tests that.',
      '  With a url, tests the origin at that url instead.',
      '',
      '  SMOKE_CHROME / CHROME_PATH / CHROME_BIN   which browser to drive',
      '  SMOKE_TIMEOUT_MS                          per-wait deadline, default 20000',
      '  SMOKE_SKIP_PHASE                          skip one phase, to prove the count assertion fires',
      '',
      '  Exit 0 clean, 1 the page has regressed, 2 the suite could not answer for itself.'
    ].join('\n'));
    return 0;
  }

  // The suite's own arithmetic, before it drives anything. A PHASES table that does not sum to the
  // headline figure is a suite that does not know what it intends to do, and a verdict from it
  // would mean nothing.
  const declared = planTotal();
  if (declared !== EXPECTED_ASSERTIONS) {
    throw new Error(
      `the phase table sums to ${declared} and EXPECTED_ASSERTIONS says ${EXPECTED_ASSERTIONS}.\n` +
      'Both are written by hand and they have to be edited together: the sum alone would agree\n' +
      'with a table that had lost a phase, and the total alone would not say which phase moved.');
  }
  if (BEHAVIOURAL_VIEWPORT < 0) {
    throw new Error('no viewport in VIEWPORTS is marked pointer: true, so the behavioural ' +
                    'assertions have nowhere to run and the suite would only check widths.');
  }
  // Issue 109. The grain phases are the one block here with no viewport of its own in VIEWPORTS,
  // so nothing else in this file would notice them going away: a hand that deleted them and the
  // call below would leave a suite that still summed, still ran and still said clean. The plan
  // has to refuse a PHASES table with no grain phase in it, which is the same terminator as the
  // total in a smaller place.
  if (!plannedGrainPhases().length) {
    throw new Error('no phase in PHASES is marked when: "grain". The grain phases came from ' +
                    'build/check_grain.mjs when issue 109 folded that file in, they are a third ' +
                    'of what this suite claims, and they run outside the viewport loop, so ' +
                    'nothing else here would report their absence.');
  }
  if (SKIP_PHASE && !Object.prototype.hasOwnProperty.call(PHASES, SKIP_PHASE)) {
    throw new Error(`SMOKE_SKIP_PHASE names "${SKIP_PHASE}", which is not a phase. A typo here ` +
                    'would skip nothing and read as a clean run. The phases are:\n  ' +
                    Object.keys(PHASES).join('\n  '));
  }

  const chrome = resolveChrome();
  let server = null;
  let base = args.find(a => !a.startsWith('-'));
  if (base) {
    if (!base.endsWith('/')) base += '/';
    // A url whose host is this machine is not a deployed origin, however it was arrived at. Issue
    // 107 made verify.sh able to serve site/ locally when nothing is published, and a suite that
    // printed "a deployed origin" over a loopback address would put a false sentence at the top of
    // a log somebody later quotes. Named by what it is, from the url and not from the caller.
    const localhost = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])([:/]|$)/.test(base);
    console.log(`target:  ${base}  (${localhost
      ? 'a server on this machine, so this tests bytes and not a publication'
      : 'a deployed origin, served by somebody else'})`);
  } else {
    const s = await serveSite(SITE);
    server = s.server;
    base = s.base;
    console.log(`target:  ${base}  (site/ from this working tree)`);
  }
  console.log(`browser: ${chrome.path}`);

  try {
    // The behavioural assertions are about the model, the reveal rule, the gestures and the board,
    // none of which is a claim about a width, so they run once. They run in the viewport that can
    // drive a pointer, which is the condition they need and not the position in the list: below the
    // window floor there is no real widget to dispatch into and the gesture would be measuring the
    // harness. Everything that IS a claim about a width runs at every width.
    // Which viewport carries the behavioural assertions is decided once, in BEHAVIOURAL_VIEWPORT,
    // and both the plan and the run read it from there. The earlier form set a flag as it went, so
    // the plan and the run were two statements of the same rule and could disagree.
    for (let i = 0; i < VIEWPORTS.length; i++) {
      const v = VIEWPORTS[i];
      try {
        await runViewport(chrome.path, v, base, i === BEHAVIOURAL_VIEWPORT,
                          i === NARROW_VIEWPORT);
      } catch (err) {
        if (err instanceof HarnessFailure) {
          // Not a finding about the page. Nothing in this viewport ran, so nothing in this
          // viewport is evidence, and the count audit below says how much was lost.
          harnessFail(err.message, err.detail);
        } else {
          setWhere(`${v.w}x${v.h}`);
          fail(`the ${v.w}x${v.h} run (it threw before it finished)`,
            'the viewport to run to completion',
            (err && err.stack ? err.stack.split('\n').slice(0, 4).join(' | ') : String(err)));
        }
      }
    }

    // The grain phases, in their own browsers, outside the loop. Their own try/catch and not the
    // loop's, so a browser that never starts for them is a harness finding about them and takes
    // no viewport down with it, and a viewport that lost its browser does not take them down
    // either. That independence is what the second CI step bought before issue 109 folded the two
    // suites together, and it is kept here rather than left behind.
    try {
      await runGrain(chrome.path, base);
    } catch (err) {
      if (err instanceof HarnessFailure) {
        harnessFail(err.message, err.detail);
      } else {
        setWhere(GRAIN_WHERE);
        fail('the grain run (it threw before it finished)',
          'the grain phases to run to completion',
          (err && err.stack ? err.stack.split('\n').slice(0, 4).join(' | ') : String(err)));
      }
    }
  } finally {
    if (server) server.close();
  }

  setWhere('-');
  setPhase('-');
  const failed = results.filter(r => !r.ok);
  const audit = auditCount();

  console.log(`\n${'='.repeat(80)}`);
  reportCount(audit);
  console.log(`\n${results.length} assertions, ${results.length - failed.length} passed, ${failed.length} failed`);
  if (failed.length) {
    console.log('\nfailures:');
    for (const f of failed) {
      console.log(`  [FAIL] ${f.where}  ${f.name}`);
      console.log(`           expected: ${f.expected}`);
      console.log(`           found:    ${f.found}`);
    }
  }

  // THE COUNT, judged. Short is a failure however many passed, and so is a stray assertion nobody
  // declared: both mean the run and the suite's own statement of intent disagree.
  const short = audit.rows.filter(r => r.got !== r.count);
  if (short.length || audit.strays.length || results.length !== EXPECTED_ASSERTIONS) {
    console.log('\nthe suite did not run the assertions it says it intends:');
    for (const r of short) {
      console.log(`  ${r.where} ${r.name}: intended ${r.count}, ran ${r.got}`);
    }
    for (const s of audit.strays) {
      console.log(`  ${s.where} ${s.phase}: ${s.n} assertion(s) in no declared phase`);
    }
    if (results.length !== EXPECTED_ASSERTIONS) {
      console.log(`  the total: EXPECTED_ASSERTIONS says ${EXPECTED_ASSERTIONS}, ${results.length} were recorded`);
    }
    harnessFail('the suite ran fewer assertions than it intends, or ran ones it never declared',
      'A verdict on a partial suite is the failure build/model.py\'s terminator exists to stop:\n' +
      'every assertion that did run can pass and the run still says nothing about the rest.');
  }

  if (harnessFindings.length) {
    console.log('\nharness findings, which are about the runner and not about the page:');
    for (const h of harnessFindings) {
      console.log(`  ${h.what}`);
      if (h.detail) console.log(String(h.detail).split('\n').map(l => '    ' + l).join('\n'));
    }
  }

  // Three verdicts, and the order between them is a claim about evidence. A failed assertion is
  // evidence about the page and outranks a harness finding, so a run that lost a viewport AND
  // found a real regression reports the regression. A run with no failed assertion and a harness
  // finding has no evidence about the page at all and must not be read as either verdict about it.
  console.log();
  if (failed.length) {
    console.log('VERDICT: the page has regressed');
    if (harnessFindings.length) {
      console.log('         and the harness failed as well, so this verdict is about the part that ran.');
    }
    return 1;
  }
  if (harnessFindings.length) {
    console.log('VERDICT: the suite could not answer. This is a harness failure, not a page regression:');
    console.log('         everything that ran passed, and what did not run is not evidence about the page.');
    return 2;
  }
  console.log(`VERDICT: clean, all ${EXPECTED_ASSERTIONS} of the assertions it intends`);
  return 0;
}

main().then(code => process.exit(code)).catch(err => {
  console.error('\nthe suite could not run:\n' + (err && err.message ? err.message : err));
  console.error('\nVERDICT: the suite could not answer. This is a harness failure, not a page regression.');
  process.exit(2);
});
