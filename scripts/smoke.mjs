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
// viewport that can drive a pointer. Adding an assertion means editing the count beside it and
// the total below, and a change that forgets is a red run rather than a quiet one.
const PHASES = {
  'the viewport opened':  { count: 2, when: 'every' },
  'every width':          { count: 3, when: 'every' },
  'model and reveal':     { count: 14, when: 'behavioural' },
  'students':             { count: 11, when: 'behavioural' },
  'term':                 { count: 48, when: 'behavioural' },
  'canvas':               { count: 7, when: 'behavioural' },
  'capture':              { count: 14, when: 'behavioural' },
  'board':                { count: 13, when: 'behavioural' },
  'console and requests': { count: 2, when: 'every' }
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
const EXPECTED_ASSERTIONS = 128;

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
    page.mechanism = 'Emulation.setDeviceMetricsOverride (below the ' + WINDOW_FLOOR_PX +
                     'px window floor)';
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
async function stableRect(page, selector) {
  let last = null;
  const deadline = Date.now() + TIMEOUT;
  while (Date.now() < deadline) {
    const now = await page.evaluate(`(function () {
      var el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      var b = el.getBoundingClientRect();
      return JSON.stringify({ x: b.x, y: b.y, w: b.width, h: b.height });
    })()`);
    if (now === null) throw new Error(`no element matches ${selector}`);
    if (now === last) {
      const b = JSON.parse(now);
      return { ...b, cx: b.x + b.w / 2, cy: b.y + b.h / 2 };
    }
    last = now;
    await sleep(40);
  }
  throw new Error(`${selector} never stopped moving`);
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
    agendaUnflagged: Array.prototype.slice.call(
      document.querySelectorAll('#termrows .agenda-line')).filter(function (li) {
        var f = li.querySelector('.flag');
        return !f || f.textContent !== 'dummy';
      }).length,
    agendaNote: (function () {
      var p = document.querySelector('#termrows .agenda-note');
      return p ? p.textContent : null;
    })(),
    agendaToggle: (function () {
      var b = document.querySelector('.agenda-toggle');
      if (!b) return null;
      var r = b.getBoundingClientRect();
      return { pressed: b.getAttribute('aria-pressed'), w: r.width, h: r.height };
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

    // ---- issues 91 and 93, the subtraction ---------------------------------------
    // WHAT IS COUNTED IS COPIES AND NOT WORDING, which is the whole shape of those two cards. He
    // asked twice for the marks to go and the reason is arithmetic: six statements that the data
    // is invented stood on one screen and the sixth made the first weaker. So the driver counts
    // every element on the page whose own text claims invention, split into the sheet and the
    // footer, and asserts the sheet's count is zero and the page's is one. It does not read what
    // the surviving sentence says: issue 101 is open on whether the claim is even true, that is
    // his to settle, and a driver that pinned the wording would be this card taking his decision.
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
      return {
        text: m.textContent,
        btns: Array.prototype.slice.call(m.querySelectorAll('button')).map(function (b) {
          var r = b.getBoundingClientRect();
          return { label: b.textContent, pressed: b.getAttribute('aria-pressed'),
                   w: r.width, h: r.height };
        })
      };
    })()
  };
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

// The window menu is a disclosure and closes on a click anywhere else, exactly as the programme
// menu does, so a driver that pressed its control blind would toggle it the wrong way the moment
// something else on the page had been clicked in between. These two ask the page what state it is
// in first, which is the same discipline as reading the routes rather than constructing them.
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

  // ISSUE 85. The two real published values that had never reached a property list, and the flag
  // is the assertion: a module name rendered `dummy` beside an invented attendance figure would
  // tell the reader the exact opposite of what is true of it.
  const tprops = await page.evaluate(`(function () {
    var out = {}, dl = document.getElementById('pprops');
    var dts = dl.querySelectorAll('dt'), dds = dl.querySelectorAll('dd'), i;
    for (i = 0; i < dts.length; i++) {
      var f = dds[i].querySelector('.flag');
      out[dts[i].textContent] = { v: dds[i].querySelector('b').textContent,
                                  f: f ? f.textContent : null };
    }
    return out;
  })()`);
  assert('a session template carries the module and the place in its syllabus, flagged real',
    !!tprops.module_name && !!tprops.sequence &&
      tprops.module_name.f === 'real' && tprops.sequence.f === 'real' &&
      /^\d+ of \d+$/.test(tprops.sequence.v),
    'module_name and sequence on the panel, both flagged real and not dummy',
    JSON.stringify({ module_name: tprops.module_name, sequence: tprops.sequence }));
  await clearSelection(page);

  // ---- the calendar reading ---------------------------------------------------
  await page.evaluate(`location.hash = '#/calendar'`);
  await page.waitFor(`window.ZT.term().open === true &&
                      window.ZT.term().reading === 'calendar'`,
    'the calendar reading to open');
  // ---- the shape of it, issue 88 ------------------------------------------------
  // THE MONTH GRID IS WHAT #/calendar OPENS ON, and that is the card's decision rather than a
  // detail of the markup: measured over the 83 sessions the months hold 16, 20, 17, 9, 8 and 13,
  // so six panels of 8 to 20 fit and the April and May gaps are the reading. Everything below is
  // checked against the chips the reader can see and the dates written on their own faces, not
  // against the model behind them.
  const calMonth = await page.evaluate(TERM_READ);
  const monthState = await page.evaluate('window.ZT.term()');
  const chipDates = calMonth.cells.reduce((a, c) => a.concat(c.dates), []);
  const monthKeys = new Set(chipDates.map(d => d.slice(0, 7)));
  assert('#/calendar opens on a month grid, one panel per month the term touches',
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
    calWeek.shapeBtns.length === 3 &&
      calWeek.shapeBtns.every(b => b.title.length > 10) &&
      new Set(calWeek.shapeBtns.map(b => b.title)).size === 3 &&
      calWeek.noticeProse.length === 0,
    'three shape buttons carrying three different titles, over a strip with no prose in it',
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
  assert('the sheet declares the sample it drew rather than reading as the whole term',
    state.sessionsTotal > state.sessions &&
      cal.sub.indexOf(String(state.sessions)) === 0 &&
      cal.sub.indexOf('the model counts at ' + state.sessionsTotal) !== -1,
    `a subtitle saying ${state.sessions} drawn from ${state.sessionsTotal}`,
    JSON.stringify(cal.sub.slice(0, 160)));

  // The gaps, which are the only reason an operator opens a calendar. Counted twice on the page,
  // once in the subtitle and once as a mark on each row, and the two have to agree.
  const statedGaps = Number((/(\d+) with no instructor named/.exec(cal.sub) || [])[1]);
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

  // THE COUNT, WHICH IS THE WHOLE OF WHAT THOSE TWO CARDS DECIDED. Six statements that the data
  // is invented stood on this one screen and the sixth made the first weaker. One is left and it
  // is the page's, in the footer, where it was. Nothing here reads what it says: issue 101 is
  // open on whether that claim is true at all, since nearly half of the shipped values are
  // flagged as read off a real system while the stance says invented, and that is his call.
  assert('exactly one statement on the page that the data is invented, and it is the footer\'s',
    cal.inventedInSheet.length === 0 && cal.inventedInFooter === 1,
    'none in the sheet, one in the footer',
    `${cal.inventedInSheet.length} in the sheet ${JSON.stringify(cal.inventedInSheet)}, ` +
      `${cal.inventedInFooter} in the footer`);

  // ---- the time window, issue 90 -------------------------------------------------
  // THE CARD NAMED A MEETING: "checking the next 1-3 weeks to discuss with the team". Everything
  // here is about the one thing that had to be decided before any of it could be built, which is
  // where `now` comes from on a page whose every date is invented and whose term ended before the
  // real clock reached it.
  const w0 = await page.evaluate('window.ZT.term().window');
  const off0 = await page.evaluate('window.ZT.filtered()');
  assert('the window is off on arrival and the header says so in whole weeks',
    w0.on === false && w0.weeks === 0 && cal.wn &&
      cal.wn.text === 'weeks: all ' + w0.termWeeks && w0.termWeeks > 1 &&
      off0.on === false && off0.hidden.length === 0,
    `a control reading "weeks: all ${w0.termWeeks}" and nothing taken off the drawing`,
    `${JSON.stringify(cal.wn && cal.wn.text)}, window on ${w0.on}, ` +
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
      /which is not today and is not pretending to be/.test(menuText) &&
      menuText.indexOf('Monday') !== -1 &&
      w0.anchor >= w0.firstMonday && w0.anchor <= w0.lastMonday,
    `the reader's own date ${w0.today}, ${afterToday} sessions on or after it, and an anchor ` +
      `between ${w0.firstMonday} and ${w0.lastMonday}`,
    `anchor ${w0.anchor}, page says ${w0.afterToday} after today, text ` +
      JSON.stringify(menuText.slice(0, 150)));

  // #77's rule reaches the newest controls on the page or it has stopped being a rule.
  const wnBtns = (wnOpen.wnMenu || { btns: [] }).btns;
  const smallest = wnBtns.concat([wnOpen.wn]).concat(cal.shapeBtns)
    .reduce((m, b) => Math.min(m, b.w, b.h), Infinity);
  assert('every control the two cards added clears 24 by 24',
    wnBtns.length >= 6 && cal.shapeBtns.length === 3 && smallest >= 24,
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
  assert('a three week window cuts the list down to an agenda',
    listWin.rows === w3.shown && listWin.rows === inWindow && listWin.rows > 0 &&
      listWin.rows < state.sessions &&
      listWin.wn.text === 'weeks: 3 of ' + w3.termWeeks &&
      listWin.sub.indexOf(w3.shown + ' of them inside the window') !== -1,
    `${inWindow} rows for ${w3.from} to ${w3.to}, out of ${state.sessions}`,
    `${listWin.rows} rows, the page says ${w3.shown}, control ` +
      JSON.stringify(listWin.wn.text));

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

  // ---- the invented session agenda, issue 85 -----------------------------------
  // OFF UNTIL IT IS ASKED FOR is the first of the four things marking it, and it is the one a
  // later change could undo without anything looking wrong. The other three are on the block.
  await page.evaluate(`location.hash = '#/outline/' + ${JSON.stringify(other)}`);
  await page.waitFor(`window.ZT.term().reading === 'outline'`, 'the outline back');
  const agOff = await page.evaluate(TERM_READ);
  assert('the invented session agenda is off until a reader asks for it',
    agOff.agendaRows === 0 && !!agOff.agendaToggle &&
      agOff.agendaToggle.pressed === 'false' &&
      agOff.agendaToggle.w >= 24 && agOff.agendaToggle.h >= 24,
    'no agenda rows, and a control at least 24 by 24 offering them',
    `${agOff.agendaRows} agenda rows, control ` + JSON.stringify(agOff.agendaToggle));

  await page.evaluate(`document.querySelector('.agenda-toggle').click()`);
  await page.waitFor('window.ZT.term().agenda === true', 'the agenda to be switched on');
  const agOn = await page.evaluate(TERM_READ);
  assert('every line of it carries the dummy flag, and the block says what it is on its own face',
    agOn.agendaRows === agOn.rows &&
      agOn.agendaLines === agOn.rows * oneState.agendaLines &&
      agOn.agendaUnflagged === 0 &&
      /INVENTED/.test(agOn.agendaNote || '') &&
      /same four lines/i.test(agOn.agendaNote || '') &&
      /not a proposal/i.test(agOn.agendaNote || ''),
    `one block under each of the ${agOn.rows} rows, every line flagged dummy, and a note ` +
      'saying the lines are invented, the same everywhere, and not a proposal',
    `${agOn.agendaRows} blocks, ${agOn.agendaLines} lines, ${agOn.agendaUnflagged} unflagged, ` +
      `note ${JSON.stringify((agOn.agendaNote || '').slice(0, 90))}`);
  await page.evaluate(`document.querySelector('.agenda-toggle').click()`);
  await page.waitFor('window.ZT.term().agenda === false', 'the agenda to be switched off again');

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
  assert('the window renders the weeks in it and reflows what is left, which is what #100 asked for',
    drawn.on === true && drawn.hidden > 0 && drawn.wrong === 0 && drawn.stillDrawn === 0 &&
      drawn.nodes === drawn.shown && drawn.shown + drawn.hidden === drawn.canonNodes &&
      drawn.nodes < beforeWin.nodes && drawn.h < beforeWin.h && drawn.w === beforeWin.w &&
      drawn.digest === beforeWin.digest && drawn.outside > 0,
    `${drawn.inside} sessions drawn and ${drawn.hidden} tiles taken out, the drawing down from ` +
      `${beforeWin.h} to under it at the same ${beforeWin.w} wide, the canonical digest still ` +
      `${beforeWin.digest}`,
    `${drawn.nodes} of ${beforeWin.nodes} nodes drawn, ${drawn.wrong} against their own date, ` +
      `${drawn.stillDrawn} still painted after being filtered, ${drawn.w} by ${drawn.h}`);

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

  // FILTERED HAS TO BE TELLABLE FROM ABSENT. A drawing that silently drops a relationship is a
  // management tool that has started lying, so what the window took out is on the page as a count
  // and the lines that used to reach it now reach that count. Both halves are asserted: the tiles
  // add up to what was removed, and the folded lines say how many relationships each stands for.
  const kept = await page.evaluate(`(function () {
    var marks = Array.prototype.slice.call(document.querySelectorAll('#graph [data-outside]'))
      .map(function (g) {
        var t = g.querySelector('title');
        var n = /^(\\d+)/.exec(t ? t.textContent : '');
        return { id: g.getAttribute('data-outside'), n: n ? Number(n[1]) : 0,
                 text: t ? t.textContent : '' };
      });
    var folded = Array.prototype.slice.call(document.querySelectorAll('#graph g[data-edge].outside'))
      .filter(function (g) { return !!g.querySelector('path'); })
      .map(function (g) {
        var t = g.querySelector('title');
        return t ? t.textContent : '';
      });
    var sum = 0;
    marks.forEach(function (m) { sum += m.n; });
    return { marks: marks, sum: sum, folded: folded,
             hidden: window.ZT.filtered().hidden.length,
             sameLane: window.ZT.filtered().sameLane };
  })()`);
  assert('what the window took out is on the page as a count, and the lines to it say how many',
    kept.marks.length > 0 && kept.sum === kept.hidden && kept.sameLane === 0 &&
      kept.folded.length > 0 &&
      kept.marks.every(m => /outside this window/.test(m.text)) &&
      kept.folded.every(t => /^\S.*, \d+ relationships? outside this window$/.test(t)),
    `${kept.marks.length} lanes saying so, ${kept.sum} tiles accounted for against the ` +
      `${kept.hidden} the window removed, and ${kept.folded.length} folded lines naming their count`,
    `${kept.sum} counted of ${kept.hidden} removed, ${kept.sameLane} relationships nowhere, ` +
      `titles ${JSON.stringify(kept.folded.slice(0, 2))}`);

  // KEEPING THE NUMBER, which is the other half of what the card asked for and the same failure as
  // an aggregate that loses it. Every lane says what it is showing of what it had, in the idiom
  // #83 set for the captions above it, and the numbers are checked against the tiles rather than
  // against each other.
  const caps = await page.evaluate(`(function () {
    return Array.prototype.slice.call(document.querySelectorAll('#graph .lane')).map(function (l) {
      var lines = Array.prototype.slice.call(l.querySelectorAll('.band-cap'));
      var last = lines[lines.length - 1];
      var plate = l.querySelector('rect.band');
      var x0 = +plate.getAttribute('x'), x1 = x0 + +plate.getAttribute('width');
      var drawn = 0;
      Array.prototype.slice.call(document.querySelectorAll('#graph .node:not(.outside) .tile-bg'))
        .forEach(function (r) {
          var cx = +r.getAttribute('x') + +r.getAttribute('width') / 2;
          if (cx >= x0 && cx <= x1) drawn++;
        });
      return { text: last ? last.textContent : '', win: last ?
               last.classList.contains('cap-window') : false, drawn: drawn };
    });
  })()`);
  assert('and every lane says how much of itself is in the window, in the idiom #83 set',
    caps.length > 0 && caps.every(c => c.win) &&
      caps.every(c => {
        const m = /^(\d+) of (\d+) (in this window|shown)$/.exec(c.text);
        return !!m && Number(m[1]) === c.drawn && Number(m[2]) >= Number(m[1]);
      }),
    `${caps.length} lane captions each carrying "k of n in this window" with k the tiles in it`,
    JSON.stringify(caps.map(c => c.text + ' against ' + c.drawn + ' drawn')));

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
  // below it at the far zoom out. Three units of air and half a line of centring are well
  // inside what a reader would call either name, so the thresholds are loose on purpose: this
  // catches the defect coming back, not a repaint that lands a pixel elsewhere.
  const cramped = three.filter(([, b]) => ['templates', 'sessions'].some((key) => {
    const a = b[key] && b[key].air;
    return !a || a.top < 3 || a.bot < 3 || Math.abs(a.off) > 2;
  }));
  assert('the lane heading sits inside its frame, with air on both sides, at every zoom',
    cramped.length === 0,
    'at least 3px of air over and under both captions and neither more than 2px off centre',
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
async function checkCapture(page) {
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
  assert('nothing in the whole capture pass filed an issue',
    rec.calls.every(c => c.method === 'GET') && rec.opens.length === 0,
    'every recorded request a GET, and no issue form opened',
    `calls ${JSON.stringify(rec.calls)}, opens ${JSON.stringify(rec.opens)}`);
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
async function checkWidth(page, base) {
  const routes = [['#/', 'the diagram'], ['#/board', 'the board'], ['#/students', 'the student list']];
  for (const [hash, what] of routes) {
    await page.evaluate(`location.hash = ${JSON.stringify(hash)}`);
    if (hash === '#/board') {
      await page.waitFor(`document.querySelectorAll('#bbody .bcol').length === 4`, 'the board to draw');
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
// The run
// =================================================================================================
async function runViewport(chrome, viewport, base, full) {
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
      await group('students', () => checkStudents(page));
      await group('term', () => checkTerm(page));
      await group('canvas', () => checkCanvas(page));
      await group('capture', () => checkCapture(page));
      await group('board', () => checkBoard(page, base));
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

function plannedPhases(index) {
  return Object.entries(PHASES)
    .filter(([, p]) => p.when === 'every' || index === BEHAVIOURAL_VIEWPORT)
    .map(([name, p]) => ({ name, count: p.count, where: `${VIEWPORTS[index].w}x${VIEWPORTS[index].h}` }));
}

function planTotal() {
  let n = 0;
  for (let i = 0; i < VIEWPORTS.length; i++) for (const p of plannedPhases(i)) n += p.count;
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
    console.log(`target:  ${base}  (a deployed origin)`);
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
        await runViewport(chrome.path, v, base, i === BEHAVIOURAL_VIEWPORT);
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
