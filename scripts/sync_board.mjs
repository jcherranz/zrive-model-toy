#!/usr/bin/env node
// sync_board.mjs : render the repository's GitHub Issues into site/board.json.
//
// The site is static and cannot write to the repository, so the board's state lives where a
// person already puts it: in Issues. This script turns them into the four columns the page
// draws. There is no triage step and no model call. A label decides a column; nothing infers
// one. An issue nobody has labelled lands in Raw, which is the honest answer to "we have not
// looked at this yet" and is a place a human, not a script, moves it out of.
//
// OWNERSHIP: this script owns site/board.json entirely and rewrites it every run. It touches
// no other file under site/.
//
// Usage:  node scripts/sync_board.mjs
//   env:  GH_TOKEN (the Action's GITHUB_TOKEN is enough), REPO (default below)

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const REPO = process.env.REPO || "jcherranz/zrive-model-toy";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// Both overridable so the repository gate's self-test can drive this script against a throwaway
// board and a synthetic register. A probe that had to write the real site/board.json, or had to
// consult the real register, is a probe nobody would dare run.
const BOARD_PATH = process.env.BOARD_PATH || join(ROOT, "site", "board.json");
const FORBIDDEN_LIB = join(ROOT, "scripts", "forbidden_lib.sh");
const FORBIDDEN_HASHES =
  process.env.FORBIDDEN_HASHES || join(ROOT, "scripts", "forbidden_names.sha256");

// MIRRORED IN site/board.js, WHICH MUST CHANGE WITH THIS FILE. When a reader has connected
// their own token in the browser, the page builds the board straight from the GitHub API rather
// than from this script's output, and it reproduces every rule below: these four columns and
// their labels, the default column, a closed issue going to Done, a NOT_PLANNED closure
// appearing in no column at all, DONE_VISIBLE, Done drawn newest first, and the arithmetic that
// closed equals drawn plus hidden. The two copies cannot be made one: this script is not
// deployed, only site/ is, and the page loads classic scripts, so neither side can import the
// other without a build step this repository does not have. Change a rule here without changing
// it there and the published board and the live board will say different things about the same
// issues, which is worse than either being wrong on its own.
//
// The columns, in the order the page draws them, and the label that puts a card in each.
const COLUMNS = [
  { key: "raw", title: "Raw", label: "status:raw" },
  { key: "backlog", title: "Backlog", label: "status:backlog" },
  { key: "in_progress", title: "In progress", label: "status:in-progress" },
  { key: "done", title: "Done", label: "status:done" },
];
const DEFAULT_COLUMN = "raw";

// The Done column is bounded, and the other three are not. Every closed issue lands in Done and
// nothing ever takes one out again, so on a project that is being worked on it grows without
// limit and ends up being most of the board: at twenty seven issues, twenty four of them closed,
// Done held twenty four cards in twenty seven and the three that wanted attention were lost
// inside a wall of finished work. A board is a picture of the work in hand. Eight is about a
// screen of finished cards, which is enough to see what has just landed and not enough to bury
// the rest.
const DONE_VISIBLE = 8;

// Where the cards the cap does not draw can be read in full. Built from REPO rather than typed,
// so a run against another repository links to that repository's closed issues and not to this
// one's.
const CLOSED_ISSUES_URL = `https://github.com/${REPO}/issues?q=is%3Aissue+is%3Aclosed`;

function fetchIssues() {
  const out = execFileSync(
    "gh",
    ["issue", "list", "--repo", REPO, "--state", "all", "--limit", "200",
      "--json", "number,title,state,labels,url,stateReason"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  const parsed = JSON.parse(out || "[]");
  // Assert the shape rather than coercing it. A JSON-encoded string where an array was
  // expected once turned into an empty list through a defensive fallback and a whole run
  // reported success having done nothing (HANSEI.md). An unexpected shape is a fault.
  if (!Array.isArray(parsed)) {
    throw new Error(`gh issue list returned ${typeof parsed}, expected an array`);
  }
  return parsed;
}

// GitHub closes an issue for one of two reasons, and until now the board read only the state
// and sent both to Done. `gh issue list --json stateReason` returns COMPLETED, NOT_PLANNED or
// an empty string on an open issue, in that casing; the values here were read off the real
// repository rather than assumed, and the comparison uppercases anyway.
//
// A NOT_PLANNED closure is a duplicate, a wontfix or an obsolete card. It is not outstanding
// work and it is not finished work, so no column on this board is true of it and it is given
// none: columnFor returns null and nothing draws it. Done reads newest first, so #33, closed
// as a duplicate, had become the loudest card on the column and the board was asserting that
// a duplicate had been completed. The count it leaves behind is not dropped; see build().
const NOT_PLANNED = "NOT_PLANNED";

function columnFor(labels, state, stateReason) {
  if (String(state || "").toLowerCase() === "closed") {
    if (String(stateReason || "").toUpperCase() === NOT_PLANNED) return null;
    return "done";
  }
  for (const col of COLUMNS) {
    if (labels.includes(col.label)) return col.key;
  }
  return DEFAULT_COLUMN;
}

// ---------------------------------------------------------------------------------------------
// THE NAME RULE, APPLIED BEFORE A TITLE IS WRITTEN. Issue 105.
//
// Every other public byte in this repository is authored inside it and passes a gate on the way
// in. A title does not: it is typed into the issue tracker, by a person, and until now it reached
// site/board.json verbatim with no length cap, no character filter and no vocabulary, on the
// argument that a later gate would read the bytes. That argument was measured and it does not
// hold: board.yml's own commit carries the marker that stops the push-triggered workflows, and
// the deployed-bytes gate in pages.yml fires after publication, which is an andon and not a
// guarantee.
//
// So the rule is applied here, to the title, before it is written, and it is applied by the
// library that owns it. There is no copy of the folding in this file and there must never be
// one: scripts/forbidden_lib.sh already carries the only implementation the two shell gates use,
// its header warns about the copies that exist, and a third one in JavaScript would drift from
// the register the moment either side moved. The subprocess answers with positions and never
// with the token, so no name reaches this process, this log, or the page.
//
// REDACT RATHER THAN REFUSE, and it is a close call stated rather than hidden. Refusing would
// turn one bad title into a red board workflow and a board that stops tracking the work until a
// person edits the tracker. Redacting keeps the board honest about everything else and leaves a
// visible hole where the title was, which is the same argument the hidden count below is made
// on: a board that drops something silently reads as "this is everything". The run says so on
// stdout and raises a CI annotation, naming the issue number and never the string.
const REDACTED_TITLE = "[title withheld by the content gate]";

// stdin one candidate per line, stdout the one-based line number of each candidate carrying a
// token the register holds. Any failure of the subprocess is a failure of the run: a gate that
// could not be asked has not answered clean.
function nameGateHits(titles) {
  if (titles.length === 0) return new Set();
  const out = execFileSync(
    "bash",
    [FORBIDDEN_LIB, "--name-lines", FORBIDDEN_HASHES],
    { encoding: "utf8", input: titles.join("\n") + "\n", stdio: ["pipe", "pipe", "inherit"] }
  );
  const hits = new Set();
  for (const line of out.split("\n")) {
    if (!line.trim()) continue;
    const n = Number(line.trim());
    if (!Number.isInteger(n) || n < 1 || n > titles.length) {
      throw new Error(`the name rule answered with ${JSON.stringify(line)}, which is not a position`);
    }
    hits.add(n - 1);
  }
  return hits;
}

// Applied to the whole set in one call rather than one call per card, and asserted afterwards
// rather than trusted: the second pass is over what will actually be written, so a redaction
// that did not take, or a placeholder that itself carried something, fails the run here instead
// of reaching the origin.
function gateTitles(cards) {
  const hits = nameGateHits(cards.map((c) => c.title));
  for (const i of hits) {
    const card = cards[i];
    console.log(`board sync: the title of issue ${card.id} carries a name the register holds; withheld.`);
    console.log(`::warning::board: the title of issue ${card.id} was withheld by the content gate.`);
    card.title = REDACTED_TITLE;
  }
  const left = nameGateHits(cards.map((c) => c.title));
  if (left.size > 0) {
    throw new Error(`${left.size} title(s) still carry a name after redaction; refusing to write the board`);
  }
  return cards;
}

function toCard(iss) {
  const labels = (iss.labels || [])
    .map((l) => (typeof l === "string" ? l : l.name))
    .filter(Boolean)
    .sort();
  return {
    id: iss.number,
    // Flattened before it is trimmed. A title is a single-line field in the tracker, so this
    // changes no title that exists; it is here because the rule above is asked one candidate per
    // line, and a candidate carrying a newline would shift every position after it.
    title: String(iss.title || "").replace(/[\r\n\t\f\v]+/g, " ").trim(),
    labels,
    url: iss.url || "",
    // Carried for the arithmetic in build() and stripped before anything is written, because a
    // card in no column still has to be counted somewhere.
    closed: String(iss.state || "").toLowerCase() === "closed",
    column: columnFor(labels, iss.state, iss.stateReason),
  };
}

function build(issues) {
  // Gated before the columns are formed, so a card the cap would have dropped is gated too:
  // Done rotates, and a title that is not drawn today is drawn tomorrow.
  const cards = gateTitles(issues.map(toCard).sort((a, b) => a.id - b.id));
  // The whole closed set, and the part of it that is in no column at all. The arithmetic the
  // Done column has to satisfy is closed = drawn + hidden, where drawn is the eight newest
  // completed issues and hidden is everything else that is closed, whichever way it closed.
  // Written this way rather than as ordered.length - drawn.length, which counted the completed
  // remainder only and would have lost the not-planned ones off the board without saying so.
  const closedTotal = cards.filter((c) => c.closed).length;
  const notPlannedTotal = cards.filter((c) => c.closed && c.column === null).length;
  return COLUMNS.map((col) => {
    const own = cards.filter((c) => c.column === col.key);
    // Done is read newest first: on a column of finished work the useful end is what has just
    // been done, and the oldest closed issue is the least interesting card on the board. The
    // other three columns keep the filing order, ascending by number, which is the only order
    // board.json carries that means anything.
    const ordered = col.key === "done" ? own.slice().reverse() : own;
    const drawn = col.key === "done" ? ordered.slice(0, DONE_VISIBLE) : ordered;
    const out = {
      key: col.key,
      title: col.title,
      cards: drawn.map(({ id, title, labels, url }) => ({ id, title, labels, url })),
    };
    if (col.key === "done") {
      // What the cap drops, and what the not-planned rule excludes, is counted and carried,
      // never swallowed. A board that hides a card without saying so reads as "this is
      // everything", which is a worse defect than the long column it replaced, because the
      // long column was at least true. One count covers both kinds and the page says "closed"
      // rather than "done", because a duplicate is in it and a duplicate was never done. The
      // count and the address of the full list travel with the column and the page prints them.
      out.hidden = closedTotal - drawn.length;
      out.hiddenUrl = CLOSED_ISSUES_URL;
      // Assert the two halves of the arithmetic rather than trusting them. The first says the
      // column accounts for every closed issue exactly once; the second says the closed set is
      // the completed ones plus the not-planned ones and nothing else has crept in.
      if (drawn.length + out.hidden !== closedTotal ||
          ordered.length + notPlannedTotal !== closedTotal) {
        throw new Error(
          `done column does not account for every closed issue: drawn ${drawn.length} + ` +
          `hidden ${out.hidden} vs closed ${closedTotal}, completed ${ordered.length} + ` +
          `not planned ${notPlannedTotal}`
        );
      }
    }
    return out;
  });
}

function main() {
  const issues = fetchIssues();
  const columns = build(issues);

  // Keep `generated` from the previous run when nothing else moved, so an issue event that
  // changes no card produces no diff and therefore no commit. Levelling the work: a board
  // commit means the board changed.
  // Second precision, not millisecond. A full ISO timestamp ends `...46.932Z`, and `46.932`
  // is a grouped figure in Spanish money notation, so the forbidden-content gate reads it as
  // an undeclared euro amount and fails the deploy. Caught by the gate on the first board.json
  // ever written. The fix drops a field nobody needs rather than loosening a safety rule to
  // let a cosmetic one through.
  let generated = new Date().toISOString();
  if (existsSync(BOARD_PATH)) {
    try {
      const prev = JSON.parse(readFileSync(BOARD_PATH, "utf8"));
      if (JSON.stringify(prev.columns) === JSON.stringify(columns) && prev.generated) {
        generated = prev.generated;
      }
    } catch { /* an unreadable previous board is replaced, not repaired */ }
  }
  // Applied last, so a value carried over from an older board is normalised too rather than
  // being preserved in the shape that caused the problem.
  generated = generated.replace(/\.\d{3}Z$/, "Z");

  mkdirSync(dirname(BOARD_PATH), { recursive: true });
  writeFileSync(BOARD_PATH, JSON.stringify({ generated, columns }, null, 2) + "\n", "utf8");

  console.log(`board sync: ${issues.length} issues -> ${BOARD_PATH}`);
  for (const c of columns) {
    // The run says what it is not drawing, for the same reason the page does.
    const rest = typeof c.hidden === "number" && c.hidden > 0 ? ` (+${c.hidden} closed, hidden)` : "";
    console.log(`  ${c.title.padEnd(12)} ${c.cards.length}${rest}`);
  }
}

main();
