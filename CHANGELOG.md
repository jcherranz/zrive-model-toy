# Changelog

All notable changes to this repository. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Dates are ISO. Newest first.

## [Unreleased]

Nothing yet. The five standing defects are on the board, not in this file: see KAIZEN.md and
the Issues.

## [0.2.0] - 2026-08-09

The discipline arrives: the production system this artefact is built under is written down,
the board is real, and the safety gate reads what the public reads.

### Added

- `TPS.md`, `KAIZEN.md`, `HANSEI.md` and this file. TPS.md states which Toyota principles
  changed a decision here and which one was rejected and why. KAIZEN.md is the improvement
  loop, the five standing defects and the reflection step. HANSEI.md is five incidents written
  up honestly, the first of which is why any of this exists.
- `scripts/check_forbidden.sh`, the andon cord. It runs after every deploy, takes its file list
  from `site/`, fetches each of those paths from the public origin over HTTP, and fails the job
  on a real name from the teaching register, a euro-formatted figure other than the two
  invented ones, `collection://`, a UUID, an email address, or any of the words that would name
  a vendor architecture. It asserts a non-zero file count, a non-zero byte count and a
  non-empty hash list before it scans, so it cannot report clean on nothing.
- `scripts/check_forbidden.sh --self-test`, one synthetic payload per rule, each of which must
  trip the gate, plus a payload that must not and an empty directory that must abort. Both
  workflows run it beside the live check, so a run reporting clean also means the rules ran.
- `scripts/forbidden_lib.sh` and `scripts/gen_forbidden_hashes.sh`. The names of people who
  have taught for the company are never committed here. The generator reads the vault register
  locally and writes `scripts/forbidden_names.sha256`, one salted truncated hash per name
  token; the checker folds the deployed bytes the same way and compares. 87 people, 137 tokens.
  What that buys is obscurity rather than secrecy, and the generator says so in its own header.
- `scripts/sync_board.mjs`, which renders GitHub Issues into `site/board.json` as four columns:
  Raw, Backlog, In progress, Done. A `status:` label decides the column and nothing infers one;
  an unlabelled issue lands in Raw. No triage step, no model call, no external dependency.
- `.github/workflows/board.yml`. Fires on issue events and manual dispatch, syncs, commits
  `site/board.json` with `[skip ci]` if it changed, deploys Pages, then runs the gate. Actions
  pinned by SHA. Concurrency group `pages` shared with the deploy workflow, with
  `cancel-in-progress: false`, because a true value there silently cancels deploys with zero
  steps run and the run still reads as finished.
- Five issues for the five standing defects, labelled and on the board: the diagram does not
  fit one screen, the right half of the canvas is empty, instructors and session templates are
  interleaved, eight object types have no populate route, and the toy carries no measured
  values by design. The last of those is a constraint on the board rather than work, so that
  changing it is a decision somebody takes rather than a convenience somebody reaches for.
- Labels `status:raw`, `status:backlog`, `status:in-progress`, `status:done`, plus `layout`,
  `model` and `limitation`.

### Changed

- `.github/workflows/pages.yml` runs the gate after the deploy, states its concurrency
  behaviour explicitly instead of inheriting it, and refuses to run on the board bot's own
  commit. `[skip ci]` on that commit is the primary guard; the committer check is the second
  line, for the day the marker is dropped by a squash or a policy.

### Fixed

- The gate fired on the first `site/board.json` ever written, and was right to. A full ISO
  timestamp ends `...46.932Z`, and `46.932` is a grouped figure in Spanish money notation, so
  the money rule read the board's own `generated` field as an undeclared euro amount. Two
  changes, in this order: `sync_board.mjs` emits second precision, dropping a field nobody
  needs rather than loosening a safety rule to let a cosmetic one through; and both gates now
  blank timestamps out of the copy the money pattern sees, so the rule cannot be tripped by a
  timestamp anywhere else either. The mask is anchored on digits and separators, so no euro
  figure can hide inside one, and the self-test proves that in both directions.

### Removed

- One real surname from `BANNED_WORDS` in `build/safety_grep.py`. It was already produced by
  the faculty register that the same function reads, so the literal added no coverage and did
  add a real name to a tracked file.

### Security

- The gate now reads deployed bytes rather than local files. A gate reading the working tree
  answers whether the source is clean, and between the source and the reader sit a build, an
  artifact upload, a cache and a CDN. HANSEI.md's first entry is what that gap costs.

## [0.1.0] - 2026-08-09

Initial commit. A toy instance diagram of the Zrive operating data model: 11 object types, 26
objects, 32 edges, one screen, invented values only. Coordinates computed at build time by a
degenerate Sugiyama layout in `build/build_layout.py` and shipped as data, so the browser only
draws and every reader sees the same picture. No framework, no build step for the site itself,
no CDN, no web font, no runtime request of any kind. `build/safety_grep.py` is the local gate
that runs against `site/` before a push.
