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
const BOARD_PATH = join(ROOT, "site", "board.json");

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
      "--json", "number,title,state,labels,url"],
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

function columnFor(labels, state) {
  if (String(state || "").toLowerCase() === "closed") return "done";
  for (const col of COLUMNS) {
    if (labels.includes(col.label)) return col.key;
  }
  return DEFAULT_COLUMN;
}

function toCard(iss) {
  const labels = (iss.labels || [])
    .map((l) => (typeof l === "string" ? l : l.name))
    .filter(Boolean)
    .sort();
  return {
    id: iss.number,
    title: String(iss.title || "").trim(),
    labels,
    url: iss.url || "",
    column: columnFor(labels, iss.state),
  };
}

function build(issues) {
  const cards = issues.map(toCard).sort((a, b) => a.id - b.id);
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
      // What the cap drops is counted and carried, never swallowed. A capped column that says
      // nothing about the cap reads as "this is everything", which is a worse defect than the
      // long column it replaced, because the long column was at least true. The count and the
      // address of the full list travel with the column and the page prints them.
      out.hidden = ordered.length - drawn.length;
      out.hiddenUrl = CLOSED_ISSUES_URL;
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
  for (const c of columns) console.log(`  ${c.title.padEnd(12)} ${c.cards.length}`);
}

main();
