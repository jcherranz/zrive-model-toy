// term: the same term read twice, once as when it happened and once as what is taught.
//
// Issues 80 and 82, built as one thing because they are one thing. #80 asked for the cohort
// calendar from a session node; #82 asked for an outline of the session templates from a template
// node. The instances in date order and the templates in curriculum order are the two halves of
// the split the whole drawing exists to make, and a reader who sees the same term twice under two
// orderings has been shown that split rather than told it.
//
// WHY IT IS ONE SHEET AND TWO ADDRESSES. One sheet, because the two readings share a box, a close,
// a scroll and a provenance notice, and because switching between them is the point: the switch is
// the demonstration. Two addresses, `#/calendar` and `#/outline`, because #/board and #/students
// established that a view worth having is worth an address, and because a heading that says what
// is on screen needs a route to hang on. A single address with a tab that is not in the URL would
// make the two readings unlinkable and would give the h1 nothing to switch on.
//
// SCOPE: ALL SEVEN PROGRAMMES, ONE TERM, AND THAT IS THE DECISION THIS CARD MAKES. A per programme
// calendar already exists in the business. Every cohort session in the model records
// `route_system: Notion, one session calendar per programme per quarter`, so seven of them are
// exactly what Notion holds, and building an eighth copy of one of them would demonstrate nothing.
// What exists nowhere is the term: one cohort's sessions across all seven programmes, side by
// side, in date order. #80 asked for "the full cohort calendar" and that is the reading of it that
// is not already somebody's Notion page. The outline takes the same scope for the same reason and
// so that the two readings hold the same rows.
//
// WHAT THIS IS NOT. It is not a schedule. Every date, time, state, attendance figure and identifier
// in it is invented, and the drawings carry 83 of the 260 sessions the model counts, so it is a
// sample of a term as well as an invented one.
//
// ISSUES 91 AND 93 CUT HOW OFTEN THE SHEET SAYS SO, AND CHANGED NOTHING ABOUT WHAT IS SAID. Six
// copies of it stood on one screen: a chip in the subtitle, a paragraph above the rows, a sticky
// banner row inside the table, a banner over the grids, a warning on the face of every grid panel,
// and the page footer. He asked for the marks to go, twice, and the reason is that over-marking
// fails the way under-marking does: the sixth copy makes the first weaker. The five in the sheet
// are gone and the footer's is untouched, word for word, because whether the claim it makes is
// the right one is issue 101 and is his to settle, not this card's. The reasoning that used to be
// printed above the rows is in this repository, which is where it belongs.
//
// IT READS THE SEVEN VIEWS AND OWNS NO PROGRAMME. Every other route on this page has an opinion
// about which of the seven is drawn; this one has none, which is why it is not in router.js. It is
// handed all seven joined views and reads across them, so a change of programme behind the sheet
// changes nothing in it and there is no per route rebuild to forget.
//
// ===============================================================================================
// ISSUE 84 REVISED THE SCOPE, AND ONLY HALF OF IT. Both readings now take a programme as well.
// ===============================================================================================
// The paragraph above is right about the calendar and was wrong about the outline, and the
// distinction is what the address shape now carries. THE TERM ACROSS THE SEVEN EXISTS NOWHERE:
// every cohort session records that its schedule lives in Notion, one calendar per programme per
// quarter, so an unscoped calendar is the one reading of it that is not already somebody's page.
// A SYLLABUS BELONGS TO A PROGRAMME. Nothing anywhere holds one outline across seven syllabi, and
// nobody has asked a question it answers: a reader who arrives from a Z-SC tile wants Z-SC.
//
// So there are four addresses and not two. `#/outline/ZSC` and `#/calendar/ZSC` are one
// programme; `#/outline` and `#/calendar` stay, because the fragmentation finding lives in the
// unscoped calendar and because the unscoped outline is what shows that the seven syllabi are the
// same kind of document. The panel's link is the scoped one, since the panel is on a node and a
// node is on exactly one drawing.
//
// ISSUE 85 PUT THE MODULES IN. A flat list of seventy nine rows is unreadable and the grouping is
// what fixes it: every syllabus note carries `module`, `module_name` and `sequence`, the drawing
// has never said so, and the outline is now grouped by module and ordered by sequence inside it.
// The three programmes whose syllabus names no module for some or all of its rows say that rather
// than showing an unexplained blank.
//
// ===============================================================================================
// ISSUES 88 AND 90 ADDED THE TIME DIMENSION, AND THEY ARE ONE CARD BECAUSE THEY ARE ONE PROBLEM.
// ===============================================================================================
// #88 asked to see the calendar as a calendar, monthly and weekly. #90 asked for a filter down to
// a selected range or week, and named the use: "checking the next 1-3 weeks to discuss with the
// team". Both are the same question, which is how a reader works with a term too large to see at
// once, and answered one at a time they would have produced two unrelated controls over the same
// 166 days. They are answered here as two axes over one term.
//
// SHAPE is how the rows are laid out: a month grid, a week grid, or the list this sheet had
// before. It belongs to the calendar reading, because there are rows only here.
//
// WINDOW is how much of the term is in focus. It belongs to the PAGE and not to this sheet: the
// term is also on the drawing, one tile per session, and #90 was filed from `#graph`. So its
// control is in the header, where a reader looking at the drawing can reach it and where #86 has
// just made every control hit-testable over a sheet, and this module hands the drawing a
// predicate rather than owning any part of it.
//
// THE THIRD FACE OF THE SAME PROBLEM IS #89, collapse and expand into modules, and it is
// deliberately not here: it is a build-time layout change and this card is run-time only. It
// joins without a redesign, and the two places it joins are named in this file. Shape is a
// registry, `CAL_SHAPES` with a note and a builder each, so a fourth entry is an entry. And the
// drawing half composes because this card never touches geometry: dimming is a class over a
// layout that has not moved, so #89's two precomputed geometries can arrive under it and the
// window will dim whichever of them is on screen.
//
// WHERE `now` COMES FROM, WHICH IS THE THING THIS CARD HAD TO DECIDE FIRST. Every date here is
// invented and the term ended before the real clock reached it, so a window built against the
// system clock renders empty today and forever. The answer is an anchor derived from the term,
// shown on the control, with the reader's real date and the count of sessions on or after it
// stated beside it. The long note over the control has the argument.
(function () {
  'use strict';

  var CAL_ROUTE = '#/calendar';
  var OUT_ROUTE = '#/outline';
  // `#/outline/ZSC`, in the shape router.js already answers at `#/p/ZSC`. Parsed and never
  // matched against a list of built strings, so a code this page does not know falls through to
  // the unscoped reading rather than to nothing.
  var ADDRESS = /^#\/(calendar|outline)(?:\/([^/?#]*))?/;
  // ---- ISSUE 146. THE SCOPE IS A SET HERE TOO, IN THE SPELLING #136 ALREADY SETTLED ----------
  // The drawing has taken a set since #136: `#/p/ZIB+ZSC` is two programmes, `#/p/ALL` is every
  // one the document holds, and the chips in the header add and take away. This sheet went on
  // answering for one programme or for all seven and nothing in between, so "these three
  // programmes, this fortnight" could be asked of the picture and not of the calendar, which is
  // the one surface where the answer is a list a meeting can read.
  //
  // THE SEPARATOR AND THE WORD ARE ROUTER.JS'S AND NOT A SECOND VOCABULARY. `+` joins codes and
  // `ALL` means every programme the document holds, spelled the same way on both surfaces so a
  // reader who has learned one address has learned the other. `ALL` resolves to every view, which
  // IS the unscoped reading, so it is an input spelling of an address this page already answers
  // rather than a new one: the writer below never produces it, and the enumerated address count
  // does not move. A set of two or more is CONSTRUCTED from what the reader pressed, exactly as
  // `#/p/ZIB+ZSC` is, and for the same reason it is not enumerated anywhere: an address built out
  // of a set is not an address anybody maintains, and counting the 119 of them would make the
  // page's address count a fact about arithmetic.
  var JOIN = '+';
  var ALL_WORD = 'ALL';
  // Issue 112. WHICH ROWS ARE OPEN, ON THE ADDRESS, because every other view here puts its state
  // there and a row a reader has opened is a thing they should be able to send someone. A QUERY
  // and not a fourth path segment, deliberately: `routes` below is the list of addresses this
  // module answers and a driver enumerates it, so 83 open states must not multiply 16 routes into
  // thousands. `open=all` is its own value rather than a list of every id, so the page-level
  // control has an address too and it stays true of a scope with a different set of rows in it.
  var OPEN_Q = /[?&]open=([^&]*)/;
  // Issue 125. WHICH GAP THE REVIEW IS THE WORKLIST FOR, and it is a query for exactly the reason
  // `open` is one: the header's gaps menu names one row per field, a field is not a place, and a
  // path segment per field would multiply the sixteen routes this module answers by the number of
  // fields the model happens to flag. The page answers the 33 addresses it answered before #124
  // and the 33 it answers after this card. The value is the model's own field key, the same
  // string the panel prints beside the value and the same string the menu row carries.
  var GAP_Q = /[?&]gap=([^&]*)/;

  // Written out rather than taken from the browser's locale. The page is in English, the sheet has
  // to read the same on every machine, and a driver asserting date order should be reading the
  // same strings the reader is.
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
  // Monday first, because the window this file positions is a whole number of weeks and a week
  // that starts on Sunday would put the two weekend sessions of a week in two different rows.
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // ---- dates, in one place, and every one of them UTC ---------------------------------------
  // Issues 88 and 90. The dates in this model are `YYYY-MM-DD HH:MM` with no zone, so they are
  // read as UTC and never through the browser's local time: a session at 2026-03-01 00:00 read
  // locally lands in February for a reader west of Greenwich, which would put it in the wrong
  // panel of a month grid on their machine and in the right one on ours. The only local reading
  // on this page is the real clock below, which is deliberately local, because "today" is the
  // reader's day and not ours.
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function dnum(s) {
    var p = String(s).split('-');
    return Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function dstr(ms) {
    var d = new Date(ms);
    return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
  }

  function addDays(s, n) { return dstr(dnum(s) + n * 86400000); }

  // Monday is 0, which is the index into DAYS above and the offset back to the week's own Monday.
  function dowMon0(s) { return (new Date(dnum(s)).getUTCDay() + 6) % 7; }

  function mondayOf(s) { return addDays(s, -dowMon0(s)); }

  function daysBetween(a, b) { return Math.round((dnum(b) - dnum(a)) / 86400000); }

  // '2026-03-02' -> '2 March 2026'. Written out for the reason MONTHS is: the page is in English
  // and a driver reading the anchor off the control should read the same string the reader does,
  // on every machine and in every locale.
  //
  // AND IT IS THE ONLY ONE. Issue 106. A `shortDate` sat under this one, arrived with #90 in the
  // same commit, and was never called from anywhere; `git log -S` finds that one commit for the
  // name. It is gone rather than kept for a caller who might want '2 Mar': an uncalled formatter
  // beside a called one reads as a choice the page makes somewhere, and it makes no such choice.
  function longDate(s) {
    return String(Number(s.slice(8, 10))) + ' ' + MONTHS[Number(s.slice(5, 7)) - 1] + ' ' +
           s.slice(0, 4);
  }

  // The reader's day, from the reader's own clock, and the one thing on this page that is not
  // invented. It is here so the sheet can say what it is and how far it is from the term rather
  // than quietly pretending the term is current. Issue 90.
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  var ZM = window.ZM = window.ZM || {};

  function propRow(n, k) {
    var p = n.props || [], i;
    for (i = 0; i < p.length; i++) if (p[i].k === k) return p[i];
    return null;
  }

  function prop(n, k) {
    var r = propRow(n, k);
    return r ? r.v : null;
  }

  // Issue 125. WHICH OF A NODE'S OWN VALUES THE MODEL FLAGS ABSENT, and the boundary is the
  // node's own `route` index rather than a list of field names kept here. It is the same boundary
  // the header's count has drawn since #98 and for the same reason: the rows before it answer how
  // a class gets filled at all, which is a fact about the class and is identical on every tile of
  // it, and a worklist made of those would be a worklist of one item repeated eighty three times.
  function absentFields(n) {
    var p = n.props || [], out = {}, i;
    for (i = (n.route || 0); i < p.length; i++) if (p[i].f === 'absent') out[p[i].k] = true;
    return out;
  }

  // "23 of 25" -> 23. The row is a sentence rather than a number because a position without its
  // total is not a position, and the outline sorts on the number inside it.
  function seqOf(n) {
    var v = prop(n, 'sequence');
    var m = /^(\d+)/.exec(String(v || ''));
    return m ? Number(m[1]) : 0;
  }

  function normCode(s) {
    return String(s === null || s === undefined ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  // opts.views    the seven joined views, in build order
  // opts.agenda   the instance document's invented session agenda block, issue 85
  // opts.onRoute  called after the sheet opens or closes, because the heading changed and the
  //               header may have changed height with it
  // opts.windowEffect asks what the window has done to the drawing on screen and answers with
  //               render.js's own report, or null before the wiring is finished. Issue 111. It is
  //               a QUESTION asked at the moment the control restates itself and not a value
  //               pushed in, for the reason the window itself is a predicate and not a list of
  //               ids: the answer is per drawing and the window is not, so anything cached here
  //               would be stale on the next change of programme or of grain.
  // opts.onWindow called with a predicate over a node, or null, whenever the time window moves.
  //               Issue 90. This module knows what a date means and render.js knows where a node
  //               is drawn, and neither learns the other's half: it hands out a question and the
  //               drawing answers it with a class.
  // opts.backRoute asks for the address of the drawing this sheet is open over, which is where
  //               close() puts the reader back. Issue 138. Asked rather than held, and asked of
  //               router.js rather than built here, because the scope and the altitude are that
  //               file's and an address spelled in a second place is an address that can be spelled
  //               wrong; a copy taken when the sheet opened would be stale the moment a chip moved.
  ZM.term = function createTerm(opts) {
    var VIEWS = opts.views || [];
    var AGENDA = opts.agenda || null;
    var onRoute = opts.onRoute;
    var windowEffect = opts.windowEffect;
    var backRoute = opts.backRoute;

    var sheet = document.getElementById('term');
    var titleEl = document.getElementById('termtitle');
    var subEl = document.getElementById('termsub');
    var noticeEl = document.getElementById('termnotice');
    var rowsEl = document.getElementById('termrows');
    var calBtn = document.getElementById('termcal');
    var outBtn = document.getElementById('termout');

    var reading = null;         // 'calendar', 'outline', or null when the sheet is shut
    // Issue 146. THE SCOPE IS A LIST OF VIEWS AND IT IS NEVER EMPTY, which is the shape router.js
    // holds the drawing's scope in and is the reason nothing below has to ask "one or all". A list
    // as long as VIEWS is the unscoped reading, and that equality is the only place "all seven" is
    // spelled: an empty list would be a third state meaning the same thing as the full one, and
    // two spellings of one state is how the two readings of this sheet came apart before.
    var scope = [];
    var built = null;           // which reading AND which scope the rows on screen are
    var returnTo = null;        // what had focus when the sheet was opened
    // Issue 112. WHICH ROWS HAVE THEIR OUTLINE OPEN, by template id, and it replaces the single
    // boolean issue 85 shipped. `agendaOn` is derived from it and still means what it meant, that
    // every row in scope is open, so nothing that asked that question has to ask a new one.
    var openRows = {};          // template id -> true, issue 85's block, per row since issue 112
    // Issue 125. WHICH GAP THE ROWS ARE THE WORKLIST FOR, a model field key or null for every row.
    // Set from the address and from nothing else, which is the rule the open set already runs on:
    // the header's menu navigates and this reads what it navigated to, so the number the reader
    // pressed and the rows they land on come from one place and cannot drift apart.
    var gapField = null;

    // ---- the rows, read out of the seven views once ---------------------------
    // Read once and kept, because nothing on this page can change them: the drawings are generated
    // and the sheet has no control that filters or sorts. Built at construction rather than on
    // first open so that the counts the panel's link quotes are true before anybody has opened
    // anything.
    var sessions = [];
    var templates = [];
    var byProgramme = [];

    (function collect() {
      VIEWS.forEach(function (v) {
        var d = v.drawing, group = { view: v, templates: [] };

        // Which session delivers which template, off the model's own verb rather than off a
        // convention about ids. The edge runs from the session to the template, which is what
        // `instance of` means in that direction.
        var deliveredBy = {};
        d.edges.forEach(function (e) {
          if (e.v !== 'instance of') return;
          if (!deliveredBy[e.t]) deliveredBy[e.t] = [];
          deliveredBy[e.t].push(e.s);
        });

        var sessionById = {};
        d.nodes.forEach(function (n) {
          if (n.type !== 'CohortSession') return;
          var at = String(prop(n, 'scheduled_at') || '');
          var row = {
            code: v.code, label: v.label, route: v.route,
            id: n.id, title: n.label,
            at: at, date: at.split(' ')[0] || '', time: at.split(' ')[1] || '',
            state: prop(n, 'state'),
            // Issue 125. The FLAGS beside the values, because a worklist is made of flags: the
            // header counts `absent` and this sheet has to be able to show the same set. Read off
            // the node here, once, for the reason every other figure in this file is read once.
            absent: absentFields(n),
            teacher: prop(n, 'teacher_assigned'),
            attendance: prop(n, 'attendance'),
            recording: prop(n, 'recording_ref')
          };
          sessionById[n.id] = row;
          sessions.push(row);
        });

        d.nodes.forEach(function (n) {
          if (n.type !== 'SessionTemplate') return;
          var ids = deliveredBy[n.id] || [];
          // Issue 85. The module comes off the node's own row and its FLAG is carried with it,
          // because the two states are different claims: a name is the syllabus's grouping, and
          // `absent` is the syllabus recording no grouping for this row at all. Reading only the
          // value would render "no module recorded in the syllabus" as though it were the name
          // of a module.
          var mrow = propRow(n, 'module_name');
          var row = {
            code: v.code, label: v.label, route: v.route,
            id: n.id, title: n.label,
            tcode: prop(n, 'template_code'),
            mode: prop(n, 'delivery_mode'),
            place: prop(n, 'location_mode'),
            duration: prop(n, 'duration_min'),
            module: mrow ? mrow.v : null,
            noModule: !!(mrow && mrow.f === 'absent'),
            seq: seqOf(n),
            seqText: prop(n, 'sequence'),
            deliveries: ids.map(function (id) { return sessionById[id]; }).filter(Boolean)
          };
          group.templates.push(row);
          templates.push(row);
        });

        // What the programme tile says about its own module structure, quoted rather than
        // recomputed here: the sentence is written once, in the model, off the module table the
        // build checks against the vault, and a second copy of the arithmetic on this side is a
        // second place for it to be wrong.
        d.nodes.forEach(function (n) {
          if (n.type !== 'Programme') return;
          var mr = propRow(n, 'modules');
          if (mr) group.modules = mr.v;
        });

        // Curriculum order, which is what the second reading is for, and it is the syllabus's
        // own `sequence` and not the order the build happens to declare its templates in. On
        // Z-HR those two disagree.
        group.templates.sort(function (a, b) {
          return a.seq - b.seq || (a.id < b.id ? -1 : 1);
        });

        byProgramme.push(group);
      });

      // Date order across the seven, which is the ordering that exists nowhere else. The
      // timestamps are `YYYY-MM-DD HH:MM`, so they sort as strings; the programme and the key
      // break ties, so two sessions at the same hour on two programmes come out in the same order
      // on every machine.
      sessions.sort(function (a, b) {
        if (a.at !== b.at) return a.at < b.at ? -1 : 1;
        if (a.code !== b.code) return a.code < b.code ? -1 : 1;
        return a.id < b.id ? -1 : 1;
      });
    })();

    // WHAT EACH READING LISTS, AND WHETHER THE WINDOW HAS AN OPINION ABOUT IT. Issue 98, and it is
    // one table in the file that owns the readings rather than two facts app.js would have to
    // learn a second time. The header's gap count is a count of what the view is SHOWING, so it
    // has to know that the calendar lists cohort sessions and the outline lists session templates,
    // which is collect() above in one line; and it has to know that the calendar obeys the window
    // and the outline does not, which is neither new nor this card's call. That split is #90's,
    // kept by #100, and the outline already says it in words over its own rows: a syllabus is in
    // curriculum order and a window is a slice of dates, so a window over an outline would be a
    // filter over an ordering that has no dates in it.
    var READING = {
      calendar: { type: 'CohortSession', window: true },
      outline: { type: 'SessionTemplate', window: false }
    };

    // ---- which rows a reading is about ----------------------------------------
    // Issue 84. One function, called with a scope of null or with one view, so the unscoped and
    // the scoped readings cannot come to count differently: there is one arithmetic and the
    // scope is an argument to it, not a second copy of it under an if.
    //
    // ISSUE 146 WIDENED WHAT THAT ARGUMENT CAN BE AND CHANGED NEITHER SENTENCE. A scope is a set
    // now, so every one of these takes null, one view, or a list of them, and answers the same
    // arithmetic over whichever it was handed. Read through one converter rather than three
    // branches, because the callers are ten and half of them legitimately hold a single view: a
    // lane caption is about one programme, an absence row is about one programme, and neither
    // should have to learn a set to ask a question about it.
    function scopeList(sc) {
      if (!sc) return [];
      return Array.isArray(sc) ? sc : [sc];
    }

    // Whether a scope is the whole document, which is the one place "all seven" is a comparison
    // rather than a spelling.
    function isAll(sc) {
      var list = scopeList(sc);
      return !list.length || list.length >= VIEWS.length;
    }

    // The set as the address writes it, which is also the key `built` and `show` compare on: two
    // lists holding the same views in the build's order are the same scope, and a scope that has
    // not moved must not rebuild the rows.
    function scopeKey(sc) {
      if (isAll(sc)) return '';
      return scopeList(sc).map(function (v) { return v.key; }).join(JOIN);
    }

    function groupsFor(sc) {
      var list = scopeList(sc);
      if (!list.length) return byProgramme;
      return byProgramme.filter(function (g) { return list.indexOf(g.view) !== -1; });
    }

    function sessionsFor(sc) {
      var list = scopeList(sc), on = {};
      if (!list.length) return sessions;
      list.forEach(function (v) { on[v.code] = true; });
      return sessions.filter(function (s) { return !!on[s.code]; });
    }

    function templatesFor(sc) {
      var out = [];
      groupsFor(sc).forEach(function (g) { out = out.concat(g.templates); });
      return out;
    }

    // ---- the worklist filter, issue 125 -----------------------------------------
    // WHICH FIELDS THIS READING WILL ANSWER FOR, off the rows themselves rather than off a list
    // typed here. A `?gap=` naming a field no session carries is not a filter that leaves the
    // sheet empty; it is not a filter at all, and the reading falls back to every row, which is
    // the same answer readAddress already gives a programme code nobody has. A screen that
    // printed "0 sessions with no elephant" would be inventing a finding out of a typo.
    var GAP_FIELDS = (function () {
      var seen = {};
      sessions.forEach(function (s) {
        Object.keys(s.absent).forEach(function (k) { seen[k] = true; });
      });
      return seen;
    })();

    function gapMatch(s) { return !gapField || !!s.absent[gapField]; }

    function totalFor(sc, key) {
      var n = 0;
      groupsFor(sc).forEach(function (g) {
        var b = (g.view.counts || {})[key];
        if (b) n += b.total;
      });
      return n;
    }

    // ---- drawn against declared, issue 122 --------------------------------------
    // THE SHEET HAD ONE SHAPE FOR BOTH ANSWERS. It closed its first clause with "drawn from a term
    // the model counts at N", and on Z-SC that printed "25 sessions across Z-SC ... the model
    // counts at 25". Complete and sampled were the same sentence with different numbers in it, so
    // a reader who did not stop to compare them read a sample and a whole term identically. Every
    // figure after that clause is a property of the drawn rows and inherits the confusion: 38
    // templates recording no duration is 38 of the 83 the documents hold, not of the 260 the
    // model counts.
    //
    // ONE FUNCTION FOR THE SAME REASON stats() IS ONE FUNCTION. #84 settled that the scope is an
    // argument to one arithmetic rather than a second copy of it under an if, and drawn-against-
    // declared is asked by both readings, by both titles and by both sentences. Answered here and
    // read five times below.
    function sampleOf(sc, key) {
      var drawn = 0, total = 0;
      groupsFor(sc).forEach(function (g) {
        var b = (g.view.counts || {})[key];
        if (!b) return;
        drawn += b.drawn;
        total += b.total;
      });
      return { drawn: drawn, total: total, complete: total > 0 && drawn >= total };
    }

    // The clause both sentences carry, written once so the calendar and the outline cannot come to
    // describe the same fact in two ways. `all 25 of the sessions the model counts` against
    // `83 of the 260 sessions the model counts`: the two forms are told apart by the leading word
    // and by the presence of a second number, and neither of them is a statement about the rows.
    function sampleWords(s, noun) {
      if (!s.total) return null;
      return s.complete
        ? 'all ' + s.total + ' of the ' + noun + 's the model counts'
        : s.drawn + ' of the ' + s.total + ' ' + noun + 's the model counts';
    }

    // The gaps, counted off the rows rather than written down. A calendar is opened to find what
    // is missing, so these are the numbers the sheet leads with.
    //
    // ISSUE 121 GAVE IT A SECOND ARGUMENT, FOR THE REASON IT HAS A FIRST. #84's note above says
    // the scope is an argument to one arithmetic rather than a second copy of it under an if, and
    // the window was the case that had escaped that rule: the sentence under the calendar was
    // built from the unwindowed stats with the window bolted on as a trailing clause, so a reader
    // who pressed "3 weeks" was told the date span, the state counts, the instructor gaps and the
    // recording gaps OF THE WHOLE TERM over a list of eleven rows. Every one of those figures is
    // now over the same set the rows are, because the window is the same kind of narrowing the
    // scope is and there is no reason for it to be answered anywhere else.
    //
    // `windowed` IS THE CALLER'S QUESTION AND NOT THIS FUNCTION'S. Whether a reading obeys the
    // window is READING's business and whether a shape filters or marks is the shape's, and both
    // are decided at the call site in describe(). What this owes them is one arithmetic that
    // takes the answer.
    //
    // ISSUE 125 GAVE IT A THIRD ARGUMENT FOR THE REASON #121 GAVE IT A SECOND. A worklist is a
    // third narrowing of the same set, so every figure in the sentence over it has to be over the
    // narrowed set or the screen repeats #121's defect one card later: eleven rows under a
    // sentence counting eighty three. It is the CALLER'S question again and not this function's,
    // because the hints in the panel describe the whole reading and must not quote a filter the
    // reader set inside a sheet they are not looking at.
    function stats(sc, windowed, gapped) {
      var inScope = sessionsFor(sc);
      var inWin = windowed ? inScope.filter(function (s) { return inWindow(s.date); }) : inScope;
      var ss = gapped ? inWin.filter(gapMatch) : inWin;
      var ts = templatesFor(sc);
      var m = {}, order = [], codes = {}, spread = 0;
      ss.forEach(function (s) {
        if (m[s.state] === undefined) { m[s.state] = 0; order.push(s.state); }
        m[s.state]++;
        if (codes[s.code] === undefined) { codes[s.code] = 1; spread++; }
      });
      return {
        sessions: ss,
        // How many sessions the scope holds before the window narrowed it, so a reading that is
        // showing part of its scope can say so in the idiom #120 settled for the tile count: the
        // denominator appears only when something is taking rows off.
        sessionsInScope: inScope.length,
        // AND HOW MANY THE WINDOW LEFT BEFORE THE WORKLIST NARROWED IT AGAIN, issue 125, which is
        // the denominator the filtered heading needs: `1 of 16 sessions` says the window holds
        // sixteen and one of them is the row you pressed, where `1 of 83` would say the window
        // was not there.
        sessionsShown: inWin.length,
        templates: ts,
        programmes: groupsFor(sc).length,
        // AND THE PROGRAMMES THE ROWS IN HAND ACTUALLY CAME FROM, which is a different question
        // from how many the scope names the moment a window is on: three weeks of a term can hold
        // sessions from four of the seven, and "across 7 programmes" over those rows is false.
        // With no window the two agree, because every one of the seven holds sessions.
        programmesShown: spread,
        totalSessions: totalFor(sc, 'CohortSession'),
        totalTemplates: totalFor(sc, 'SessionTemplate'),
        noInstructor: ss.filter(function (s) { return s.teacher !== 'yes'; }).length,
        noRecording: ss.filter(function (s) {
          return !s.recording || s.recording === 'none';
        }).length,
        stateCounts: order.map(function (k) { return m[k] + ' ' + k; }).join(', '),
        maxDeliveries: ts.reduce(function (n, t) { return Math.max(n, t.deliveries.length); }, 0),
        noDuration: ts.filter(function (t) {
          return !t.duration || t.duration === 'not recorded';
        }).length,
        from: ss.length ? ss[0].date : '',
        to: ss.length ? ss[ss.length - 1].date : ''
      };
    }

    var ALL = stats(null);
    var totalSessions = ALL.totalSessions;
    var totalTemplates = ALL.totalTemplates;
    var noInstructor = ALL.noInstructor;
    var noRecording = ALL.noRecording;
    var maxDeliveries = ALL.maxDeliveries;

    // =========================================================================================
    // THE TIME DIMENSION. Issues 88 and 90, built as one thing because they are one thing.
    // =========================================================================================
    // #88 asked for the calendar as a calendar, monthly and weekly. #90 asked for a filter down
    // to a range or a week, naming the use: "checking the next 1-3 weeks to discuss with the
    // team". Answered apart they are two unrelated controls over the same 166 days. Answered
    // together they are two questions about one thing: SHAPE, which is how the term is laid out,
    // and WINDOW, which is how much of it is in focus.
    //
    // WHY SHAPE BELONGS TO THE SHEET AND WINDOW BELONGS TO THE PAGE. A shape is a way of drawing
    // rows and there are rows only here. A window is a slice of the term, and the term is also on
    // the drawing, one tile per session: #90 was filed from `#graph` on `#/p/ZSC`, so it is about
    // the picture as well as the list. That is why the window's control is in the header, where a
    // reader looking at the drawing can reach it, and why this module hands out a predicate for
    // the drawing to dim by rather than owning any part of the drawing itself.
    //
    // MEASURED BEFORE ANYTHING WAS BUILT, and the numbers decided both shapes. Across the 83
    // sessions the term spans 2026-01-12 to 2026-06-28, 166 days; the months hold 16, 20, 17, 9,
    // 8 and 13, so a month grid is six panels of 8 to 20 and the April and May gaps are a fact
    // about the term that no ordered list shows. There are 71 distinct days and only 12 of them
    // hold more than one session, and 71 of the 83 start at 18:30, so a week grid is honestly two
    // rows and is built as that rather than dressed up as a day planner.
    // ===========================================================================================
    // ISSUE 124. THE REVIEW IS A FOURTH SHAPE AND IT IS WHAT #/calendar OPENS ON.
    // ===========================================================================================
    // THE RITUAL HAS NO ADDRESS. "Reviewing the next one to three weeks before discussing with the
    // team" is a Monday, seven programmes and a meeting, and until this card it was rebuilt from
    // four controls every time: open the sheet, press the calendar, press list, press three weeks.
    // What a manager can do now that he could not is open one link and have the agenda on screen.
    //
    // AND IT TAKES THE CALENDAR'S ROUTE RATHER THAN ADDING ONE. The roadmap wrote the rule that a
    // new address must retire one and then broke it in the same document; its critic caught that.
    // This screen IS the calendar, ranked and windowed, so it is a shape of the calendar reading
    // and the page answers exactly the 33 addresses it answered before. The owner filed #120
    // because the header is a pile of controls, and a pile of routes is that complaint one level
    // up. #88's own note said a fourth entry in this registry is an entry; this is that entry.
    //
    // WHAT IT RANKS BY, AND WHY THAT AND NOT THE DATE. Unstaffed first, because a session with
    // nobody to teach it is the thing the meeting acts on, and date order inside each band because
    // that is the order the week happens in. The list shape keeps pure date order and is one press
    // away, so nothing is taken off the reader who wants it.
    //
    // AND THE ABSENCES ARE THE HALF THAT HAD TO BE BUILT CAREFULLY. Five of the seven drawings are
    // samples, which is #122's finding: Z-IB draws 6 of 79, Z-PE 6 of 36, Z-HR 6 of 25, Z-DS 6 of
    // 22, Z-CFA 6 of 45, and only Z-SC and Z-BL are complete. Rolled over real three week windows
    // this screen would otherwise announce that five of seven programmes have nothing scheduled
    // for the last third of the term, and every one of those sentences would be a property of what
    // these documents drew rather than a fact about the business. So a programme with nothing in
    // the window is NAMED, and the sentence it is named with is a different sentence on a complete
    // programme from the one on a sampled one: `no session in this window` where the drawn rows
    // are the term, and `no drawn session in this window` where they are a sample of it, with the
    // fraction beside it in the words #122 already settled. This file may never print an absence
    // that is an artefact of sampling as though it were an absence in the business.
    var CAL_SHAPES = ['review', 'month', 'week', 'list'];
    var shape = 'review';       // the review is what #/calendar opens on, issue 124

    // WHICH SHAPES ARE AN AGENDA. A shape either filters to the window, which is what a list of
    // rows a team reads in a meeting is for, or it keeps the term and marks the band, which is
    // what a grid is for. One table rather than a condition repeated at each of the three call
    // sites, and it is read by listsWindow() below, which is the one question the sentence turns
    // on. #90 made that split for the list; the review is the same kind of reading and takes it.
    var SHAPE_FILTERS = { review: true, list: true, month: false, week: false };

    // ===========================================================================================
    // ISSUES 146 AND 158. THE TWO GRIDS ARE HELD TO THE SAME RULE AS THE TWO LISTS.
    // ===========================================================================================
    // THIS FLAG IS ABOUT FILTERING AND IT WAS BEING READ AS IF IT WERE ABOUT HONESTY. The sentence
    // above says a shape either filters to the window or keeps the term and marks the band, and
    // that split is untouched: a grid still draws every session and marks. What had quietly
    // attached itself to the same flag is the sampling-honest absence sentence, which the review
    // and the list print and the two grids did not, so the two shapes that a screenshot is most
    // likely to be believed from were the two that said nothing about which kind of nothing an
    // empty cell is. The grids carry it now, under the grid, in gridNotes() below, and it is built
    // out of the review's own functions rather than written a second time.
    //
    // AND THE GRIDS DRAW THE TERM'S OWN MONTHS AND WEEKS, not the ones the drawn rows happen to
    // fall in, which is where the dishonest absence was actually coming from: a month with nothing
    // drawn in it had no panel at all, so a document holding six sessions of thirty six ended the
    // term in February with no sentence anywhere saying so.
    //
    // ISSUE 158 TURNED THE WEEK GRID OVER, days down and weeks across, which is the owner's own
    // instruction and is also what makes the grid and the header's strip one instrument: both are
    // one column per week of the term, so the interval a reader brushes is the interval the grid
    // lights, column for column.

    // How many weeks the review opens on. "The next one to three weeks" names the range and three
    // is the top of it, which is the reading a Monday meeting is over: a window a reader can then
    // narrow to one or two with the control that is already in the header.
    var REVIEW_WEEKS = 3;

    // The term's own extent and its middle, counted off the rows for the reason every other
    // number in this file is: a span typed here is a span that goes stale the first time a
    // session moves.
    var TERM = (function () {
      if (!sessions.length) return null;
      var first = sessions[0].date;
      var last = sessions[sessions.length - 1].date;
      var median = sessions[Math.floor(sessions.length / 2)].date;
      var fm = mondayOf(first), lm = mondayOf(last);
      return {
        first: first, last: last, firstMonday: fm, lastMonday: lm,
        weeks: Math.round(daysBetween(fm, lm) / 7) + 1,
        days: daysBetween(first, last) + 1,
        // THE ANCHOR, AND IT IS DERIVED RATHER THAN INVENTED. See the note on the control below
        // for why there is an anchor at all. It is the Monday of the week the term's middle
        // session falls in, which is one line to explain, is reproducible on every machine, and
        // adds no new made-up date to a page that already has to warn about every date on it.
        anchor: mondayOf(median),
        medianSession: median
      };
    })();

    var TODAY = todayStr();
    // How many of the sessions are on or after the reader's own day. It is 0 and has been 0 since
    // 2026-06-28, which is the whole reason the anchor exists, but it is counted rather than
    // asserted so the sentence stays true if the model's term ever moves forward.
    var AFTER_TODAY = sessions.filter(function (s) { return s.date >= TODAY; }).length;

    var WIN_STEPS = [1, 2, 3];      // "the next 1-3 weeks", which is what the card asked for
    var win = { weeks: 0, anchor: TERM ? TERM.anchor : null };   // 0 weeks is the whole term
    // WHETHER THE WINDOW QUESTION HAS BEEN ANSWERED, issue 124. The review opens on three weeks,
    // and the one thing it must never do is overrule an answer already given: a reader who pressed
    // "whole term" and then followed a link to the review would otherwise be given three weeks
    // back with no press of their own. Set by the two controls in the window menu and, since issue
    // 125, by a worklist address, which answers the same question a different way: it names a set
    // counted over the window in force, and a default arriving after it would replace the set.
    var winTouched = false;

    function winRange() {
      if (!win.weeks || !TERM) return null;
      return { from: win.anchor, to: addDays(win.anchor, win.weeks * 7 - 1) };
    }

    function windowOn() { return !!winRange(); }

    function inWindow(date) {
      var r = winRange();
      return !r || (date >= r.from && date <= r.to);
    }

    function windowShown(sc) {
      return sessionsFor(sc).filter(function (s) { return inWindow(s.date); }).length;
    }

    // What the window is, in one sentence, written from the range rather than typed. Used by the
    // control, by the subtitle and by the notice, so the three cannot come to say different
    // things about the same window.
    function windowText() {
      var r = winRange();
      if (!r) return 'the whole term, all ' + TERM.weeks + ' weeks of it';
      return (win.weeks === 1 ? 'one week' : win.weeks + ' weeks') + ', ' +
             longDate(r.from) + ' to ' + longDate(r.to);
    }

    // ---- and what a window that leaves nothing says, issue 119 ------------------
    // THE LIST HAS ANSWERED THIS SINCE #90 AND THE DRAWING NEVER HAD AN OPINION. A term with gaps
    // in April and May holds weeks with no session in them, so a one week window over a programme
    // can legitimately cover none of it. The list already says so where the rows would be, in a
    // sentence about the window and never about the data: what the window is, and the two ways
    // out of it. The drawing met the same state by drawing nothing at all, which is not an answer
    // and, until this card, was six band plates at a negative height and six rendering errors on
    // the console.
    //
    // SO THE SENTENCE MOVES HERE AND BOTH SURFACES READ IT, which is the rule the three callers of
    // windowText() above already run on: one place writes it, so the list and the canvas cannot
    // come to say different things about the same empty window. It travels to render.js on the
    // spec, beside `text`, because a sentence about the window belongs to the module that owns the
    // window and render.js has never held a date.
    //
    // IT IS TRUE OF WHAT THE READER IS LOOKING AT, which is the same reading the list has always
    // had: scoped to one programme the list says it of that programme, and the drawing is always
    // one programme. Nothing here says anything about the standing of the model, which is #110's
    // rule and is where a reassuring sentence would otherwise creep back in.
    // #128 took the second sentence off. It told the reader which two header controls to press,
    // which is what the header controls already say by being there; the fact is the first
    // sentence and the fact is all that is left.
    //
    // ISSUE 167. AND IT TOOK NO SCOPE, SO IT NAMED NONE, AND THE SCREEN CONTRADICTED ITSELF. On
    // Z-IB the review printed this sentence over its rows and, three lines below it,
    // `Z-IB · no drawn session in this window · 6 of the 79 sessions the model counts, so 73 are
    // not drawn here`. Two sentences about the same window, one of them a statement about the
    // business and the other a statement about what these documents drew, and the shorter one was
    // the one on the canvas and at the head of the list. On five of the seven programmes almost
    // every week is empty, so this was the common case rather than an edge, and it is the exact
    // thing this file's own rule at CAL_SHAPES forbids.
    //
    // SO IT TAKES THE SCOPE AND SPEAKS IN absentWords()'s OWN WORDS, which is what makes the two
    // agree rather than merely stop disagreeing: `drawn session` where the rows are a sample and
    // `session` where they are the term, the fraction in the form #122 settled, and the count of
    // what is not here spelled out rather than left for the reader to subtract. Both are built
    // from sampleOf() and sampleWords(), so a third wording cannot appear here.
    //
    // THE SCOPE IS AN ARGUMENT BECAUSE THE ANSWER IS DIFFERENT PER CALLER, and that is the whole
    // reason it is not read off `scope` inside. The sheet asks about the rows it is showing; the
    // drawing asks about the programmes it is drawing, and since #136 those are two different
    // sets that a reader can hold at once. A scope of more than one is answered over the UNION,
    // which sampleOf() already sums: on `#/calendar/ZIB+ZSC` the sentence is about the 31 of 104
    // the two hold together, and it says `drawn session` because one of the two is a sample. The
    // weaker claim is the true one about a set, and a set with one sampled programme in it is a
    // set the page may not describe as complete.
    function windowEmptyText(sc) {
      var samp = sampleOf(sc, 'CohortSession');
      // `null` on a complete scope and on one the model counts nothing in: there is no sample to
      // report and the short sentence is the honest one.
      var sw = samp.complete ? null : sampleWords(samp, 'session');
      var bits = ['No ' + (sw ? 'drawn session' : 'session') + ' in ' + windowText()];
      if (sw) bits.push(sw + ', so ' + (samp.total - samp.drawn) + ' are not drawn here');
      return bits.join(' · ') + '.';
    }

    // ---- what the drawing is told, issues 90 and 100 ----------------------------
    // A PREDICATE AND NOT A LIST OF IDS, and never any geometry. It answers about a NODE and
    // render.js does the rest, which is the same division the lane headings run on: that file
    // knows where a thing is drawn and this one knows what a date means. This module has never
    // held a coordinate and does not start now.
    //
    // #90 SHIPPED THIS AS A DIM AND #100 OVERRULED IT. The argument for dimming was that the
    // layout is generated at build time behind a digest a rebuild has to reproduce, so a
    // continuous window over 24 weeks could not be precomputed and a class was the only answer
    // that cost the build gate nothing. He filed #100 from `#graph` saying the point of the
    // filter is to draw those weeks. It is: the gate is a fact about the build and not a reason
    // to leave a reader of Z-BL looking at three lit tiles in a column of seventy seven quiet
    // ones. The canonical drawing and its gate are exactly as they were and render.js transforms
    // it at run time under a check of its own. Nothing on this side of the boundary changed
    // except the name: what leaves here is a window and not a dimmer.
    //
    // `from` and `to` travel with the predicate because the drawing says out loud what it is
    // showing, and a sentence about the window belongs to the module that owns the window.
    function windowSpec() {
      var r = winRange();
      if (!r) return null;
      var spec = {
        from: r.from, to: r.to, weeks: win.weeks, text: windowText(),
        // TWO QUESTIONS AND NOT ONE, because "outside the window" and "the window has an opinion
        // about this at all" are different claims and the drawing needs both. A cohort session
        // carries a date, so the window answers for it either way; a session template, an
        // instructor or an employer carries none, and what happens to those is decided by the
        // sessions they are attached to, which is render.js's cascade and not this module's
        // business. Answering only `out` would make every undated node read as inside the window,
        // and the drawing could never tell "in this window" from "not a thing with a date".
        // ISSUE 89 ADDED THE SECOND DATED CLASS AND IT CARRIES A SPAN RATHER THAN A DATE. At the
        // modules grain the term lane holds one tile per module, and a module runs from its first
        // session to its last: Z-BL's second module covers 14 ene to 25 mar. So the predicate
        // answers about a RANGE, and "outside the window" is the range and the window not meeting
        // at all rather than the range's start falling outside it. Reading only the first date
        // would have taken a module off the picture in every week of it but the first, which is
        // the arithmetic that reads right and is wrong.
        //
        // The two controls have to compose on BOTH altitudes or the collapse is a way of escaping
        // the window, and a management tool whose two filters do not agree about the same term is
        // worse than either of them alone.
        governs: function (n) {
          if (!n) return false;
          if (n.type === 'CohortSession') {
            return !!String(prop(n, 'scheduled_at') || '').split(' ')[0];
          }
          if (n.type !== 'ModuleDelivery') return false;
          return !!(String(prop(n, 'first_session') || '').split(' ')[0] &&
                    String(prop(n, 'last_session') || '').split(' ')[0]);
        },
        out: function (n) {
          if (!n) return false;
          if (n.type === 'CohortSession') {
            var d = String(prop(n, 'scheduled_at') || '').split(' ')[0];
            return !!d && (d < r.from || d > r.to);
          }
          if (n.type !== 'ModuleDelivery') return false;
          var a = String(prop(n, 'first_session') || '').split(' ')[0];
          var b = String(prop(n, 'last_session') || '').split(' ')[0];
          return !!(a && b) && (b < r.from || a > r.to);
        }
      };
      // Issue 119. What the drawing prints when this predicate leaves it with nothing, written by
      // the module that owns the window and identical to the sentence the list prints in the same
      // state. render.js decides WHERE it goes and never what it says.
      //
      // ISSUE 167 MADE IT A QUESTION RATHER THAN A VALUE, and the reason is the one `windowEffect`
      // and `drawnScope` are already questions: the sentence is now about a SCOPE, and render.js
      // holds the spec it was last handed while app.js's showView() redraws the canvas at a new
      // scope without setting a window it did not change. A string frozen here would then be read
      // out over a drawing of a different set of programmes, which is the sampling defect this
      // card is repairing arriving one frame later. Read at paint time it cannot be stale, and it
      // is asked of drawnViews(), because a sentence painted on the drawing is about the
      // programmes the drawing is of and never about the ones the sheet is over.
      Object.defineProperty(spec, 'empty', {
        enumerable: true,
        get: function () { return windowEmptyText(drawnViews()); }
      });
      return spec;
    }

    // ---- the term strip and its brush, issue 137 --------------------------------
    // WHAT WENT, AND WHY A MENU COULD NOT DO THIS. The control here was `weeks`, a reading whose
    // value opened a box holding four preset widths, a pair of anchor steppers and the sentence
    // about the anchor. It answered "which of these four", and this card's finding is that the
    // question was the wrong one. The term is a bounded ordered continuum of 24 weeks browsed in
    // about 22 overlapping windows, and a menu treats an ordered continuum as an unordered set of
    // names: it hides the neighbourhood, so stepping to the week next door costs two interactions
    // against one drag and there is no way to see that the week being entered is empty until after
    // entering it, and it can express membership in a list but not extent, so "just this week" and
    // "the whole of the spring" both fall outside it. The value has two degrees of freedom,
    // position and width, which is a brush by definition and not a scrubber.
    //
    // THE ANCHOR PROBLEM DID NOT GO AWAY, IT STOPPED BEING A PROBLEM. #90's blocker was that "the
    // next three weeks" needs a now, and every date on this page is invented: the term ends
    // 2026-06-28 and the real clock is past it, so a window built against the system clock renders
    // empty today and every day after. The menu answered it by declaring an anchor and leading
    // with the sentence saying the anchor is not today. A brush needs no now at all: the reader
    // positions the interval by looking at the term, and the strip shows the whole term at rest
    // with the band over all of it. The now marker is drawn only where the reader's own day falls
    // inside the term, so on this snapshot there is none, and the sentence about the clock is on
    // the control's title rather than deleted. Nothing here invents a today.
    //
    // IT IS IN THE HEADER AND NOT IN A SHEET, which is #90's decision kept whole: the window acts
    // on the drawing and on the calendar's rows at once, and #86 made every header control
    // hit-testable over a sheet, so one control serves both without a second copy of it.
    var brushEl = document.getElementById('brush');
    var brushTrack = null, brushBand = null, brushVal = null, brushCols = [];
    var brushValFrom = null, brushValTo = null;
    var brushCapL = null, brushCapR = null, brushNow = null;
    var onWindow = opts.onWindow;

    // ---- the band, said in week indices --------------------------------------
    // ONE STATE AND TWO SPELLINGS OF IT, AND THE MAPPING IS THE WHOLE OF WHAT THIS CARD ADDS TO
    // THE WINDOW ITSELF. `win.weeks === 0` has meant "no window, the whole term" since #90, and
    // every surface on this page reads it: windowSpec() returns null, the drawing is unfiltered,
    // the sheet lists every row, and `armReview` steps aside for a reader who has chosen it. The
    // brush cannot show "no window" as an absence, because a strip with no band on it would read
    // as a control nobody has set rather than as a term entirely in view. So the band over all 24
    // weeks IS `win.weeks === 0`, and the two spellings are converted here and nowhere else.
    //
    // THE ANCHOR IS LEFT ALONE WHILE THE BAND IS FULL, which is not tidiness. #124's review opens
    // on three weeks from the anchor the term derives, the Monday of its middle session's week,
    // and an anchor rewritten to the first Monday every time the band reached full width would
    // move the review to the start of the term without anybody asking it to.
    function bandSpan() { return win.weeks || (TERM ? TERM.weeks : 1); }

    function weekIndexOf(date) {
      if (!TERM || !date) return 0;
      return Math.round(daysBetween(TERM.firstMonday, mondayOf(date)) / 7);
    }

    function mondayAt(i) { return TERM ? addDays(TERM.firstMonday, i * 7) : null; }

    function bandStart() { return win.weeks ? weekIndexOf(win.anchor) : 0; }

    // The one writer. Clamps into the term, converts a full band back to "no window", and returns
    // whether anything moved, so a drag that has not crossed a week boundary and a press against
    // the end of the term both cost nothing.
    //
    // `winTouched` IS SET ONLY WHEN SOMETHING MOVES, which is the difference between this and the
    // menu it replaces: `setWindowWeeks` set the flag before its own early return, because
    // pressing `whole term` while already on the whole term was a reader answering the question
    // #124 is about. There is no such press here. The reader answers it by moving the band, and a
    // gesture that changed nothing has not answered anything.
    function setBand(start, span) {
      if (!TERM) return false;
      span = Math.max(1, Math.min(TERM.weeks, span));
      start = Math.max(0, Math.min(TERM.weeks - span, start));
      var weeks = span >= TERM.weeks ? 0 : span;
      var anchor = mondayAt(start);
      if (win.weeks === weeks && (!weeks || win.anchor === anchor)) return false;
      winTouched = true;
      win.weeks = weeks;
      if (weeks) win.anchor = anchor;
      windowChanged();
      return true;
    }

    // ---- what the columns are, and the population each of them is over --------
    // THE COLUMN IS WHAT THE SCOPE HOLDS THAT WEEK AND THE FILL IS WHAT THE MODEL HOLDS A COMPLETE
    // RECORD FOR. Those are two different claims and the strip draws both, in the filled-against-
    // hollow grammar the chips beside it already use as a fraction: the outline is every session
    // in the week, the fill is the ones carrying no field the model flags `absent`. Measured on
    // this snapshot: 83 sessions are drawn, 72 of them carry no absent field, and the 11 that do
    // are the 11 with no instructor named. So Z-BL's weeks are solid and Z-CFA's six are hollow to
    // the last one, which is exactly the reading the card asked the strip to give at rest.
    //
    // AND IT IS OVER THE DRAWN SESSIONS, WHICH IS SAID RATHER THAN GLOSSED. Five of the seven
    // documents hold a sample of their programme's term, and the 177 sessions they do not hold
    // carry no date anywhere in the model: there is no week to put them in. The strip therefore
    // cannot show them and does not pretend to, and the control's own title names the population.
    // The chips carry the drawn-against-declared fraction; this carries the shape of what is
    // drawn. Two honest readings rather than one dishonest one.
    // WHICH PROGRAMMES THE CANVAS IS DRAWING, which is not the same question as which the sheet is
    // over and is asked separately since issue 167. app.js answers it off router.js, so it is the
    // set the address behind the sheet names, and it is VIEWS before the router exists and on a
    // page that hands over no answer at all. Two callers: the strip below, which falls back to it,
    // and the window spec's empty sentence, which is painted on the drawing and is about nothing
    // else.
    function drawnViews() {
      var sc = opts.drawnScope ? opts.drawnScope() : null;
      return (sc && sc.length) ? sc : VIEWS;
    }

    function stripScope() {
      if (isOpen() && !isAll(scope)) return scope;
      return drawnViews();
    }

    function sessionsInScope(sc) {
      if (!sc || sc.length >= VIEWS.length) return sessions;
      var on = {};
      sc.forEach(function (v) { on[v.code] = 1; });
      return sessions.filter(function (s) { return on[s.code]; });
    }

    function stripWeeks() {
      var out = [], i;
      if (!TERM) return out;
      for (i = 0; i < TERM.weeks; i++) out.push({ monday: mondayAt(i), n: 0, rec: 0 });
      sessionsInScope(stripScope()).forEach(function (s) {
        if (!s.date) return;
        var i = weekIndexOf(s.date);
        if (i < 0 || i >= out.length) return;
        out[i].n++;
        // A complete record is one with nothing the model records as absent on it. `absent` is
        // built by absentFields() off the node's own route boundary, so this is the model's own
        // flag read once rather than a second opinion about which fields matter.
        if (!Object.keys(s.absent).length) out[i].rec++;
      });
      return out;
    }

    // ---- the strip as elements, built once ------------------------------------
    // TWENTY FOUR COLUMNS, A BAND AND A LABEL, laid out by the browser rather than by arithmetic
    // here. The columns are flex children of one row and the band is positioned in per cent of the
    // track, so the whole strip is right at 1536, at 981 and at 390 without anything measuring
    // anything: the only thing that needs a measurement is where the label goes, and that is one
    // comparison of two rendered widths.
    function buildBrush() {
      if (!brushEl || !TERM) return;
      brushEl.textContent = '';
      brushCols = [];
      brushCapL = el('span', 'brush-cap brush-cap-l');
      brushEl.appendChild(brushCapL);
      brushTrack = el('span', 'brush-track');
      var i;
      for (i = 0; i < TERM.weeks; i++) {
        var wk = el('span', 'brush-wk');
        wk.appendChild(el('span', 'brush-col brush-col-all'));
        wk.appendChild(el('span', 'brush-col brush-col-rec'));
        brushTrack.appendChild(wk);
        brushCols.push(wk);
      }
      brushNow = el('span', 'brush-now');
      brushNow.hidden = true;
      brushTrack.appendChild(brushNow);
      brushBand = el('span', 'brush-band');
      brushBand.appendChild(el('span', 'brush-grip brush-grip-l'));
      brushBand.appendChild(el('span', 'brush-grip brush-grip-r'));
      brushTrack.appendChild(brushBand);
      brushEl.appendChild(brushTrack);
      brushCapR = el('span', 'brush-cap brush-cap-r');
      brushEl.appendChild(brushCapR);
      brushVal = el('span', 'brush-val');
      brushValFrom = el('span', 'brush-val-d');
      brushValTo = el('span', 'brush-val-d');
      brushVal.appendChild(brushValFrom);
      brushVal.appendChild(brushValTo);
      brushEl.appendChild(brushVal);
      sizeValue();
    }

    // THE SLOT IS AS WIDE AS THE WIDEST INTERVAL THIS TERM CAN NAME, MEASURED ONCE. Issue 142.
    // The dates are what the value slot holds and they are not all the same width: `9 Mar` is
    // narrower than `28 Sept` even under `tabular-nums`, which equalises digits and not letters.
    // A slot sized by its own content would therefore change width as the reader dragged, and the
    // track is to its left, so the track's right edge and its pixels per week would move under the
    // pointer that was dragging it. That is the defect #137 chose this slot in the row to avoid,
    // met one level down. So the slot is pinned to the widest string the term can produce, which
    // is measured off the real font in this element rather than declared in the stylesheet: a
    // number typed there is right for one term and one type ramp.
    //
    // 48 STRINGS AND ONE STARTUP, which is every Monday of the term and every Sunday after it. It
    // is 24 weeks, so this is 48 reads of offsetWidth on one small element, once, before anything
    // is drawn, and never again: nothing in a drag measures anything now.
    function sizeValue() {
      if (!brushVal || !TERM) return;
      var was = brushValFrom.textContent, w = 0, i;
      for (i = 0; i < TERM.weeks; i++) {
        brushValFrom.textContent = shortDate(mondayAt(i));
        w = Math.max(w, brushValFrom.offsetWidth);
        brushValFrom.textContent = shortDate(addDays(mondayAt(i), 6));
        w = Math.max(w, brushValFrom.offsetWidth);
      }
      brushValFrom.textContent = was;
      brushVal.style.width = w + 'px';
    }

    // `24 Feb`, and it is back after #106 deleted its predecessor as uncalled. That deletion was
    // right at the time and the reason it was right is the reason this is here now: the band's
    // label is the one place on this page where a date has to be read inside 42 CSS px, and
    // `24 February 2026` is 96 of them.
    function shortDate(s) {
      return String(Number(s.slice(8, 10))) + ' ' + MONTHS[Number(s.slice(5, 7)) - 1].slice(0, 3);
    }

    function bandWords() {
      var r = winRange();
      if (!r) return shortDate(TERM.first) + ' to ' + shortDate(TERM.last);
      return shortDate(r.from) + ' to ' + shortDate(r.to);
    }

    // THE LABEL LEFT THE TRACK, AND THE TWO BEHAVIOURS WENT WITH IT. Issue 142, and it is the
    // owner's own question answered with a measurement: he asked whether the label belongs on the
    // band at all, given that it steps beside the band when the band cannot hold it.
    //
    // WHAT WENT. `placeLabel()`, thirteen lines and a class, which centred the label on the band
    // while it fitted and stepped it to whichever side had room while it did not. The rule was
    // sound and the case it was written for was the wrong way round: the label measures 75.61 CSS
    // px and the band is the window's share of the track, so at the strip's own 12.83 px week the
    // label fitted inside from SIX weeks up. Of the 24 window widths a reader can set, nineteen
    // put it outside, over about six columns of the density the strip is worth its width for. The
    // exception was the rule.
    //
    // AND IT WAS THE MOST EXPENSIVE THING IN A DRAG, which is issue 145 arriving at the same
    // place from the other side. It read `clientWidth`, two `offsetLeft`/`offsetWidth` pairs and
    // its own `offsetWidth` on every repaint, each of them a forced synchronous layout of a
    // document holding the drawing, and it was also wired to a ResizeObserver. Chrome's sampling
    // profiler put it at 289ms of the 1470ms of script that three drags at `#/p/ALL` on a 2560
    // viewport cost, the largest single frame in the profile. Deleting it takes the measuring out
    // of the gesture entirely: nothing on this strip measures anything during a drag now.
    //
    // WHERE IT WENT AND WHY THAT END. The value is a slot of its own after the right cap, pinned
    // to the widest interval the term can name by sizeValue() above. It never moves, it never
    // covers a column, it has one behaviour, and it is the strip saying what it is set to, which
    // is what the chips beside it and the altitude in the nav already do. It is at the TRAILING
    // end and not the leading one, and that is the same measurement twice: a slot whose width can
    // change sits between the reader and nothing at the right hand end, while at the left hand end
    // it would sit between the reader and the track, and the track's left edge moving is exactly
    // what #137 chose this slot in the row to prevent.

    // ---- when this control is not in effect, issue 151 -------------------------
    // THE PARAGRAPH IT REPLACES SAID IT IN WORDS: "The window is off this reading: an outline is
    // curriculum order and a syllabus has no date to filter on." By #128's rule that sentence goes,
    // because it explains the page rather than stating a measured fact about the data. But
    // deleting it and leaving a live-looking control in the header would trade a wordy truth for a
    // silent lie, so the fact moves onto the thing it is about, which is the seventh principle and
    // is what `grain` already does: the altitude the budget refuses is not a link, it greys, and
    // it carries the count that refused it.
    //
    // THE SAME THREE THINGS HERE AND IN THE SAME ORDER. It greys. It stops answering a pointer and
    // a keyboard, because a greyed control that still drags is the lie one step along. And it
    // carries the count that refused it, which on this reading is how many of the rows in front of
    // the reader the window can place in a week: none of them, because the outline's rows are
    // session templates and a template has no date. The dates in the `delivered` column belong to
    // its deliveries, which are the calendar's rows and are what the window is over.
    //
    // IT STAYS A FOCUS STOP AND KEEPS ITS ROLE. `aria-disabled` and not `tabindex="-1"`: a control
    // a keyboard reader cannot reach at all is a control they cannot be told about, and the
    // header's own count of what answers a press is what #139 built to notice a control going
    // missing. It is reachable, it says it is disabled, and it does nothing.
    function windowInert() { return reading === 'outline'; }

    // The population the refusal is counted over, which is the rows this reading is drawing and
    // not the term: on `#/outline/ZSC` it is that programme's 25 and not 83. Read through the same
    // function the sheet's own sentences are read through, so the number on the control and the
    // number in the heading cannot come apart.
    function inertCount() { return templatesInScope().length; }

    // ---- what the strip says, restated on every change ------------------------
    // ISSUE 111'S ORDER IS LOAD BEARING AND IS KEPT: the title quotes how many tiles the window
    // has taken off the drawing, which is an answer only render.js can give and only after it has
    // been told, so windowChanged() tells the drawing before it calls this.
    function paintBrush() {
      if (!brushEl || !TERM) return;
      if (!brushTrack) buildBrush();
      var wks = stripWeeks(), max = 0, i, shown = 0, held = 0;
      for (i = 0; i < wks.length; i++) if (wks[i].n > max) max = wks[i].n;
      for (i = 0; i < brushCols.length; i++) {
        var w = wks[i] || { n: 0, rec: 0 };
        var all = brushCols[i].firstChild, rec = all.nextSibling;
        all.style.height = (max ? (w.n / max) * 100 : 0) + '%';
        rec.style.height = (max ? (w.rec / max) * 100 : 0) + '%';
        brushCols[i].title = w.n
          ? longDate(w.monday) + ': ' + w.n + (w.n === 1 ? ' session' : ' sessions') + ', ' +
            w.rec + ' with a complete record'
          : longDate(w.monday) + ': no session in this week';
      }
      var start = bandStart(), span = bandSpan();
      brushBand.style.left = (start / TERM.weeks * 100) + '%';
      brushBand.style.width = (span / TERM.weeks * 100) + '%';
      var r = winRange();
      // ISSUE 151. The value slot is where a refusal is printed, because it is the one place on
      // this control that already holds words and it is what a reader looks at to learn what the
      // control is set to. On a reading the window is not in effect on, what it is set to is not
      // the interesting fact; what it is doing is, and it is doing nothing to any of the rows.
      var inert = windowInert();
      if (inert) {
        brushValFrom.textContent = '0 of ' + inertCount();
        brushValTo.textContent = '';
      } else {
        brushValFrom.textContent = shortDate(r ? r.from : TERM.first);
        brushValTo.textContent = shortDate(r ? r.to : TERM.last);
      }
      brushEl.classList.toggle('brush-off', inert);
      if (inert) brushEl.setAttribute('aria-disabled', 'true');
      else brushEl.removeAttribute('aria-disabled');
      // The now marker, drawn only where the reader's own day falls inside the term. It is 0 of 83
      // sessions on or after today on this snapshot, so there is nothing to mark and nothing is
      // marked; a page that drew a line at the edge would be marking a today the term does not
      // have.
      var inTerm = TODAY >= TERM.firstMonday && TODAY <= addDays(TERM.lastMonday, 6);
      brushNow.hidden = !inTerm;
      if (inTerm) {
        brushNow.style.left = ((weekIndexOf(TODAY) + 0.5) / TERM.weeks * 100) + '%';
        brushNow.title = 'your clock says ' + TODAY;
      }
      var atStart = start <= 0, atEnd = start + span >= TERM.weeks;
      brushCapL.className = 'brush-cap brush-cap-l' + (atStart ? ' brush-cap-off' : '');
      brushCapR.className = 'brush-cap brush-cap-r' + (atEnd ? ' brush-cap-off' : '');
      brushCapL.title = atStart ? 'the window is already at the start of the term'
                                : 'one week earlier';
      brushCapR.title = atEnd ? 'the window is already at the end of the term' : 'one week later';
      for (i = 0; i < wks.length; i++) {
        if (i < start || i >= start + span) continue;
        shown += wks[i].n;
        held += wks[i].rec;
      }
      brushEl.setAttribute('aria-valuemin', '1');
      brushEl.setAttribute('aria-valuemax', String(TERM.weeks));
      brushEl.setAttribute('aria-valuenow', String(start + 1));
      brushEl.setAttribute('aria-valuetext', inert
        ? 'not in effect on this reading: 0 of ' + inertCount() + ' session templates carry a ' +
          'date, so there is nothing here for a week to hold'
        : (span === 1 ? 'one week' : span + ' weeks') + ', ' + bandWords() + ', ' +
          shown + ' of ' + sessionsInScope(stripScope()).length + ' drawn sessions');
      // EVERYTHING THE DELETED BOX SAID THAT NOTHING ELSE ON THE PAGE SAYS, on the title of the
      // control it was about. Four claims and no more: what the window is, what it holds, what it
      // has taken off the drawing, and that the page has no today. The three sentences #128 cut
      // from that box stay cut.
      // AND THE PER LANE BREAKDOWN THE DELETED BOX CARRIED, which is #111's and is not this card's
      // to throw away. It was a column of rows in the window menu, and a menu is exactly what this
      // control does not have, so it is a clause on the title instead: the lanes named as the
      // DRAWING names them, off render.js's own report, so nothing here invents a second
      // vocabulary for the same six columns.
      var f = windowOff();
      // AND THE TITLE SAYS THE REFUSAL AND STOPS, rather than saying it and then reciting the four
      // claims the live control makes about a window that is not acting on anything.
      if (inert) {
        brushEl.title = 'not in effect on this reading: 0 of ' + inertCount() + ' rows here ' +
          'carry a date. An outline is curriculum order and its rows are session templates; the ' +
          'window is over the sessions the calendar draws';
        return;
      }
      brushEl.title = 'the part of the term in focus: ' + windowText() + '. ' +
        shown + ' of the ' + sessionsInScope(stripScope()).length +
        ' sessions these documents draw, ' + held + ' of them with a complete record' +
        (f ? '. ' + offWords(f) + laneWords(f) : '') +
        '. This page has no today: your clock says ' + TODAY + ', the term ran ' + TERM.first +
        ' to ' + TERM.last + ', and ' + AFTER_TODAY + ' of the ' + sessions.length +
        ' sessions are on or after it' +
        '. Drag the band to move it, drag an end to widen it, press an arrow to step a week';
    }

    // Everything that has to happen when the window moves, in one place, so a control added later
    // cannot forget half of it: the rows are rebuilt if the sheet is open, the sentences over them
    // are rewritten, the drawing is told, and the control restates itself.
    //
    // ISSUE 111 REORDERED THIS AND THE ORDER IS NOW LOAD BEARING. The control states how many
    // tiles the window has taken off the drawing, which is an answer only render.js can give and
    // only after it has been told. Restating before telling would print the effect of the window
    // the reader just left, one press behind, for ever.
    // AND IT IS COALESCED TO ONE ANIMATION FRAME, WHICH IS ISSUE 145. He said dragging this
    // control renders the diagram very, very slowly, and asked for the answer Monetary Lab already
    // uses. Measured first, on the page he filed it from: a 40 move drag of an eight week band at
    // `#/p/ALL` on a 2560 viewport crossed nine week boundaries and rebuilt the drawing nine times,
    // 51.4ms on average and 92.7ms at worst, which is eleven to nineteen frames a second under the
    // pointer. A one programme three week window costs 10.1ms a rebuild, so the cost scales with
    // the union rather than being a constant.
    //
    // THE SHAPE IS THE ONE THAT WAS PROVED THERE: keep one booked job, cancel nothing, let the
    // latest state win, guarantee the trailing call, and run synchronously where
    // requestAnimationFrame is not a function. Nothing is captured when the job is booked and the
    // job reads the state at the moment it runs, so a window that moved three times inside one
    // frame is drawn once, at where it ended, and never at where it passed through. A drag that
    // outruns the frame rate now costs one rebuild per frame instead of one per week crossed, and
    // the ones it skips are frames nobody could have seen.
    //
    // AND THE ORDER INSIDE THE JOB IS ISSUE 111's, UNCHANGED AND STILL LOAD BEARING. The whole of
    // windowChanged is inside the coalesced job rather than the render half of it, precisely so
    // that the drawing is told before the control restates what the drawing did: splitting them
    // across a frame boundary is how the strip's title would come to quote the window the reader
    // just left.
    //
    // WHAT A DRIVER READS. `pending` on brushState() is true between a change and the frame that
    // draws it, and false otherwise, so a wait on it is satisfied by both of the answers the page
    // can give. A wait that could only ever be satisfied by the right answer is a wait that times
    // out instead of failing, and that hid an assertion completely on issue 137.
    var winTicket = 0, winDrawn = 0, winBooked = false;

    function pendingWindow() { return winTicket !== winDrawn; }

    function drawWindow() {
      winBooked = false;
      var at = winTicket;
      built = null;
      if (reading) { buildRows(); describe(); }
      if (onWindow) onWindow(windowSpec());
      restateWindow();
      winDrawn = at;
    }

    function windowChanged() {
      winTicket++;
      if (typeof window.requestAnimationFrame !== 'function') { drawWindow(); return; }
      if (winBooked) return;
      winBooked = true;
      window.requestAnimationFrame(drawWindow);
    }

    // The same restatement, for a caller that changed the drawing rather than the window. A change
    // of scope or of altitude leaves the window exactly where it was and changes every number the
    // control quotes about it, and since issue 137 it changes the columns as well: the strip is the
    // density under the scope on screen, so adding a programme to the scope is a repaint of every
    // column. app.js calls this beside the other things it restates. Issues 111 and 137.
    function restateWindow() { paintBrush(); }

    // The review's own opening window, issue 124, and it is a DEFAULT rather than a setting: it
    // applies where the reader has said nothing and steps aside the moment they do. Returns
    // whether it moved anything, because the caller has to tell the drawing and restate the
    // control and there is no reason to do either when it did not.
    function armReview() {
      if (winTouched || win.weeks || !TERM) return false;
      win.weeks = REVIEW_WEEKS;
      return true;
    }

    function stepAnchor(delta) {
      setBand(bandStart() + delta, bandSpan());
    }

    function windowState() {
      var r = winRange();
      return {
        on: !!r,
        weeks: win.weeks,
        anchor: win.anchor,
        from: r ? r.from : (TERM ? TERM.first : null),
        to: r ? r.to : (TERM ? TERM.last : null),
        shown: windowShown(scope),
        shownAll: windowShown(null),
        sessions: sessions.length,
        today: TODAY,
        afterToday: AFTER_TODAY,
        termFrom: TERM ? TERM.first : null,
        termTo: TERM ? TERM.last : null,
        termWeeks: TERM ? TERM.weeks : 0,
        firstMonday: TERM ? TERM.firstMonday : null,
        lastMonday: TERM ? TERM.lastMonday : null,
        // Issue 137. The band as the reader sees it, in week indices, which is the one spelling of
        // this state a driver can check the painted strip against. `weeks: 0` and a band over all
        // 24 are the same fact and only one of them is on screen.
        start: bandStart(),
        span: bandSpan()
      };
    }

    // ---- what the window took off the drawing, issue 111 ------------------------
    // WHERE THE COUNT WENT WHEN IT LEFT THE PICTURE. #100 answered a filtered drawing with one
    // stub tile per lane reading "N tiles outside this window", folded the lines that lost an end
    // onto it, and gave every lane caption a fourth line reading "6 of 28 in this window". He
    // filed #111 on one of those stubs: "The whole point of week filter is to not see this (only
    // the week, clean)". Honest bookkeeping and a clean view were treated as one requirement and
    // they are two. render.js draws the window and counts what it dropped; the strip's own title
    // is where the number lives now, which is the same home it had on the window control's title
    // before #137 deleted the control and kept the sentence.
    //
    // IT IS ASKED FOR AND NEVER CACHED. `windowEffect` reaches render.js's own report of the
    // drawing that is on screen at the moment this runs, so a change of programme or of altitude
    // moves it without anything here subscribing to either.
    function windowOff() {
      var f = windowEffect ? windowEffect() : null;
      if (!f || !f.on || !f.off || !f.off.tiles) return null;
      return f;
    }

    // The lanes that lost something, in the drawing's own words. A lane that lost nothing has
    // nothing to report, which is the rule the menu's own rows ran on.
    function laneWords(f) {
      var rows = (f.lanes || []).filter(function (l) { return l.shown !== l.of; });
      if (!rows.length) return '';
      return ': ' + rows.map(function (l) {
        return l.label + ' ' + l.shown + ' of ' + l.of;
      }).join(' \u00b7 ');
    }

    function offWords(f) {
      var o = f.off;
      return o.tiles + ' of ' + f.canonNodes + (o.tiles === 1 ? ' tile' : ' tiles') + ' and ' +
             o.relationships + (o.relationships === 1 ? ' relationship' : ' relationships') +
             ' are off the drawing';
    }

    // ---- the gestures, and every one of them on every device ------------------
    // ONE ELEMENT, ONE FOCUS STOP, ONE KEYBOARD, and the parts of the strip are told apart by
    // where the pointer landed rather than by being separate controls. That is the difference
    // between this and the row it sits in: the eight chips beside it are eight tab stops because
    // eight programmes are eight things, and a brush is one thing whose ends mean something, the
    // way a scrollbar's thumb and its track are one control.
    //
    // WHAT EACH ZONE DOES. Outside the track on the left or the right is an end cap and steps the
    // window one week, which is the commonest thing this control is for and the one gesture a
    // thumb can be relied on to land: a two pixel handle is not a phone target and the caps are
    // 22 by 26. Within a handle's width of either end of the band is a resize. Inside the band is
    // a move. Anywhere else on the track centres the window on the week pressed and then moves
    // with the pointer, so a press and a press-and-drag are the same gesture at two lengths.
    //
    // A BAND TOO NARROW TO HOLD TWO HANDLES WAS ALL MOVE, AND THAT MADE THIS CONTROL A RATCHET ON
    // TOUCH. Issue 170. The paragraph that stood here read: "Below three handle widths the two
    // resize zones would meet in the middle and a reader aiming at the band would resize it
    // instead. The way to widen a narrow band is then the keyboard or an end of a wider one." The
    // first sentence is a real constraint. The second is circular on the device the second half of
    // this line matters on: a phone has no keyboard here, and "an end of a wider one" is an end of
    // the band the reader is trying to get back. Measured, the gate was never once open on a
    // narrow band: the strip's week is 11.5 CSS px at 390 and 12.83 at 1536, so a one week band is
    // 11.5 and 12.83 against a floor of 24, and no x anywhere on the track mapped to a resize.
    // Narrow to one week on a phone and the whole term view needed a page reload.
    //
    // THE HIT ZONE IS NOT THE PAINTED BAND, WHICH IS `.capbtn-hit`'s IDEA ON A SECOND CONTROL.
    // render.js draws a lane heading and gives it a transparent rect held at 26px however small
    // the caption is; the same split works here. The band stays exactly the width the window is,
    // because it is a reading of the window and a band drawn wider would be a lie about it. What
    // is held at a floor is where a press LANDS: the two resize zones are measured against a
    // virtual band of at least three handle widths, centred on the painted one.
    //
    // BYTE FOR BYTE THE SAME GESTURE AT 24px AND ABOVE, which is the property that makes this
    // safe: `hw` is `bw` and `hx` is `bx` for every band the old gate admitted, so nothing a
    // desktop reader does with a three week window has moved.
    //
    // WHAT IT COSTS, MEASURED RATHER THAN GLOSSED. At a one week band on a 11.5px week the virtual
    // half width puts each resize zone about 10.25px outside the painted band, against the 4px a
    // wide band's handle already bleeds. So a press on most of the week immediately beside a one
    // week band resizes it rather than re-centring the window there. That is the trade, and it is
    // taken because re-centring is reachable from the rest of a 276px track and from both caps,
    // and widening was reachable from nowhere at all. The move zone is still the painted band and
    // is still checked after the two resize zones, so the grips keep meaning what they draw.
    var HANDLE = 8;
    var drag = null;

    function trackGeom() {
      var r = brushTrack.getBoundingClientRect();
      return { x: r.left, w: r.width, cw: r.width / TERM.weeks };
    }

    function weekAtX(x) { return weekIn(trackGeom(), x); }

    function centreOn(week, span) {
      return week - Math.floor((span - 1) / 2);
    }

    // ISSUE 151. THE REFUSAL IS IN THE TWO ENTRY POINTS AND NOT IN EVERY GESTURE, because a drag
    // already in flight when the reading changes has to keep working to its own pointerup or the
    // capture is never released. `brushDown` is where a gesture can begin and `brushKey` is the
    // other one; `brushMove` and `brushUp` answer only to a `drag` that `brushDown` created, so a
    // refused press means there is nothing for them to do.
    function brushDown(e) {
      if (windowInert()) return;
      if (!TERM || !brushTrack || e.button > 0) return;
      var g = trackGeom(), x = e.clientX;
      var start = bandStart(), span = bandSpan();
      if (x < g.x) { stepAnchor(-1); return; }
      if (x > g.x + g.w) { stepAnchor(1); return; }
      var bx = g.x + start * g.cw, bw = span * g.cw;
      // The virtual band the two resize zones are measured against, which is the painted one at
      // every width the old gate admitted and a centred 24px stand-in below that. Issue 170.
      var hw = Math.max(bw, HANDLE * 3), hx = bx - (hw - bw) / 2;
      // AND A ZONE THAT COULD NOT CHANGE ANYTHING IS NOT A ZONE, which is the one case the virtual
      // band gets wrong on its own and it was found on the diff rather than by driving it. An edge
      // can move two ways: outward, which the term's own end refuses, and inward, which one week
      // refuses. Where both are refused the zone is dead, and on a one week band sitting on the
      // first or last week of the term it lands on the 1.75px of track the virtual half width
      // reaches inside the cap. Pressing there used to MOVE the band; without this it would select
      // a resize, clamp, and do nothing at all, which is a reachability card taking a gesture away.
      // A dead zone falls through to the move it displaced.
      var canL = start > 0 || span > 1;
      var canR = start + span < TERM.weeks || span > 1;
      var mode;
      if (canL && x >= hx - HANDLE / 2 && x <= hx + HANDLE) mode = 'left';
      else if (canR && x >= hx + hw - HANDLE && x <= hx + hw + HANDLE / 2) mode = 'right';
      else if (x >= bx && x <= bx + bw) mode = 'move';
      else {
        setBand(centreOn(weekAtX(x), span), span);
        mode = 'move';
        start = bandStart();
      }
      // THE GEOMETRY IS TAKEN ONCE, HERE, AND THE REST OF THE GESTURE USES IT. Every change of
      // window repaints the readout beside this strip, and `tiles` goes from `80` to `76 of 80`
      // the moment a window comes on, which is a reflow of the row the strip is in. Re-measuring
      // the track on each move would read the geometry of a row that has changed since the press,
      // so a drag would land on a week other than the one under the pointer. The slot this
      // control sits in is chosen so the row cannot move it at all, and this is the second half
      // of the same answer: even a row that did move could not corrupt a gesture already begun.
      drag = { mode: mode, x0: x, start: start, end: start + span - 1, g: g };
      brushEl.classList.add('brush-drag');
      if (brushEl.setPointerCapture && e.pointerId !== undefined) {
        try { brushEl.setPointerCapture(e.pointerId); } catch (err) { /* no capture, still works */ }
      }
      e.preventDefault();
      if (brushEl.focus) brushEl.focus();
    }

    function weekIn(g, x) {
      if (!g.cw) return 0;
      return Math.max(0, Math.min(TERM.weeks - 1, Math.floor((x - g.x) / g.cw)));
    }

    function brushMove(e) {
      if (!drag) return;
      var g = drag.g;
      if (!g.cw) return;
      if (drag.mode === 'move') {
        var by = Math.round((e.clientX - drag.x0) / g.cw);
        setBand(drag.start + by, drag.end - drag.start + 1);
      } else if (drag.mode === 'left') {
        var l = Math.min(weekIn(g, e.clientX), drag.end);
        setBand(l, drag.end - l + 1);
      } else {
        var r = Math.max(weekIn(g, e.clientX), drag.start);
        setBand(drag.start, r - drag.start + 1);
      }
      e.preventDefault();
    }

    function brushUp(e) {
      if (!drag) return;
      drag = null;
      brushEl.classList.remove('brush-drag');
      if (brushEl.releasePointerCapture && e.pointerId !== undefined) {
        try { brushEl.releasePointerCapture(e.pointerId); } catch (err) { /* already released */ }
      }
    }

    // THE KEYBOARD DOES EVERYTHING THE POINTER DOES, which is the rule the end caps exist to keep
    // from the other side: nothing this control can do is available to one input and not the
    // other. Arrows step the window, shift and an arrow change its width, Home and End take it to
    // the ends of the term, and shift with them is the whole term and one week, which are the two
    // extremes a reader would otherwise reach by dragging a handle the length of the strip.
    function brushKey(e) {
      if (windowInert()) return;
      if (!TERM || e.ctrlKey || e.metaKey || e.altKey) return;
      var start = bandStart(), span = bandSpan(), used = true;
      if (e.key === 'ArrowLeft') setBand(start + (e.shiftKey ? 0 : -1), span - (e.shiftKey ? 1 : 0));
      else if (e.key === 'ArrowRight') setBand(start + (e.shiftKey ? 0 : 1), span + (e.shiftKey ? 1 : 0));
      else if (e.key === 'Home') setBand(0, e.shiftKey ? TERM.weeks : span);
      else if (e.key === 'End') {
        if (e.shiftKey) setBand(start, 1);
        else setBand(TERM.weeks - span, span);
      } else used = false;
      if (!used) return;
      e.preventDefault();
      e.stopPropagation();
    }

    if (brushEl) {
      buildBrush();
      brushEl.addEventListener('pointerdown', brushDown);
      brushEl.addEventListener('pointermove', brushMove);
      brushEl.addEventListener('pointerup', brushUp);
      brushEl.addEventListener('pointercancel', brushUp);
      brushEl.addEventListener('keydown', brushKey);
      // AND NO ResizeObserver, WHICH IS ISSUE 142 TAKING THE LAST MEASUREMENT OFF THIS CONTROL.
      // One stood here calling placeLabel() on every change of the strip's width, because the
      // label was the one thing on the strip that was placed rather than laid out. Nothing is
      // placed now: the columns are flex children, the band is a pair of per cents, and the value
      // is a slot pinned once at startup. The strip is right at 2560, at 1536 and at 390 without
      // anything measuring anything, which is what it always claimed and is now true of all of it.
    }

    // ---- what the sheet no longer says about itself ---------------------------
    // ISSUES 91 AND 93 DELETED SIX PARAGRAPHS FROM HERE, AND THAT IS THE CARD. What stood above
    // the rows was 213 words over 34 of them: two on provenance and the model finding, two more
    // on the module structure and the one to one limit, and one per calendar shape. Each was
    // written by a different card and none of them was written by somebody reading the total.
    //
    // WHERE EACH WENT. The provenance is in the footer, unchanged, and it is now the only copy on
    // the page. The findings are in this file and in the CHANGELOG: the term across the seven
    // exists in no system, one calendar per programme per quarter in Notion; there is no template
    // object at all, only last quarter's calendar rows copied by hand; three of the seven syllabi
    // name no module on some or all of their rows, which the outline still SHOWS as a heading of
    // its own rather than a blank; and one to one between template and delivery is a property of
    // a drawing of one cohort rather than a finding about the business. A finding that has to be
    // read as a paragraph over a table is a finding the table failed to make.
    //
    // WHAT IS LEFT IN #termnotice IS CONTROLS: the shape buttons, the scope bar, and the agenda
    // toggle on the outline. The one paragraph that can still appear is the window's, because it
    // is state feedback for a control the reader can see set to three weeks over an unfiltered
    // outline, and it is absent unless the reader has set one.

    // ---- the four addresses -----------------------------------------------------
    // One place builds them and one place reads them, which is the rule watchdog B's false alarm
    // on `#/p/Z-ZIB` cost half an hour to learn: a route constructed in a second place is a route
    // that can be constructed wrong. `routes` below is produced by this same function, so a
    // driver enumerating the addresses is enumerating what the page will actually answer.
    // ISSUE 146. A SET IS WRITTEN THE WAY ROUTER.JS WRITES ONE AND A SCOPE OF ONE IS WRITTEN THE
    // WAY IT ALWAYS WAS, byte for byte: `#/calendar/ZSC` is the address it has been since #84, so
    // every bookmark, every panel link and every one of the sixteen routes this module answers
    // resolves to what it resolved to before this card. Only a set of two or more is new, and it
    // is spelled `#/calendar/ZIB+ZSC`, which is `#/p/ZIB+ZSC` with the sheet's own prefix.
    function addressFor(rd, sc) {
      var base = rd === 'calendar' ? CAL_ROUTE : OUT_ROUTE;
      var k = scopeKey(sc);
      return k ? base + '/' + k : base;
    }

    // Issue 125. The calendar's address with a worklist on it, built by the one function above
    // rather than beside it, so the header's menu navigates to a string this module produced and
    // there is still exactly one place a route to this sheet is spelled. A field this reading
    // cannot answer for returns the plain address instead of one that would filter to nothing.
    function gapAddress(field, sc) {
      var a = addressFor('calendar', sc || null);
      return (field && GAP_FIELDS[field]) ? a + '?gap=' + encodeURIComponent(field) : a;
    }

    function viewByCode(code) {
      var c = normCode(code);
      if (!c) return null;
      for (var i = 0; i < VIEWS.length; i++) {
        if (normCode(VIEWS[i].key) === c || normCode(VIEWS[i].code) === c) return VIEWS[i];
      }
      return null;
    }

    // ISSUE 146. THE SEGMENT READ AS A SET, in the build's own order and never in the order the
    // address happened to write it, which is router.js's rule word for word: `#/calendar/ZSC+ZIB`
    // and `#/calendar/ZIB+ZSC` are one reading of one set rather than two readings that agree.
    // A code this page does not know contributes nothing rather than emptying the sheet, which is
    // the answer the single-code parser has given since #84; a segment that names none of them
    // falls back to every programme, which is the same answer for the same reason.
    function scopeByCodes(seg) {
      var s = String(seg || '');
      if (!s) return VIEWS.slice();
      if (normCode(s) === ALL_WORD) return VIEWS.slice();
      var got = [], out = [];
      s.split(JOIN).forEach(function (p) {
        var v = viewByCode(p);
        if (v && got.indexOf(v) === -1) got.push(v);
      });
      VIEWS.forEach(function (v) { if (got.indexOf(v) !== -1) out.push(v); });
      return out.length ? out : VIEWS.slice();
    }

    // The scope a press on one programme leaves behind: add it if it is out, take it out if it is
    // in, and refuse to empty the set, because a calendar of no programmes is a screen with
    // nothing on it and no way back. That is router.js's `toggled` with the same three cases in
    // the same order.
    //
    // AND THE UNSCOPED READING IS THE ONE CASE WHERE THIS SHEET AND THAT RAIL DIFFER, WHICH IS A
    // DECISION AND NOT AN OVERSIGHT. On the rail, all seven is a set with seven members chosen and
    // a press takes one out. Here, `#/calendar` is not seven chips that happen to be on: it is THE
    // TERM, the one reading of these seven documents that exists in no system, which is the
    // argument this whole file opens with. A reader looking at the term and pressing a code is
    // choosing a subject, which is what that press has done since #84, so it narrows to that one
    // programme; from there the codes are a set and add and take away. Nothing is hidden by the
    // difference: each link's own title says which of the two it will do before it is pressed.
    function toggledScope(v) {
      if (isAll(scope)) return [v];
      if (scope.indexOf(v) === -1) {
        var next = [];
        VIEWS.forEach(function (w) { if (w === v || scope.indexOf(w) !== -1) next.push(w); });
        return next;
      }
      if (scope.length === 1) return scope.slice();
      return scope.filter(function (w) { return w !== v; });
    }

    // null means "not one of this module's addresses at all", which the sheet answers by shutting
    // and is not the same answer as an address naming a programme nobody has.
    //
    // AN UNKNOWN CODE FALLS BACK TO THE UNSCOPED READING, and that differs from router.js, which
    // falls back to the default programme. The difference is that this module HAS an unscoped
    // reading and the drawing does not: `#/p/NOPE` has to draw something, so it draws the
    // default; `#/outline/NOPE` can honestly say all seven, which invents no opinion about which
    // programme the reader meant.
    function readAddress(h) {
      var m = ADDRESS.exec(String(h || ''));
      if (!m) return null;
      var q = OPEN_Q.exec(String(h || ''));
      // Issue 125. The worklist is the calendar's and the outline's rows have no `absent` set to
      // filter on, so a `?gap=` on `#/outline` is read as nothing rather than carried and ignored:
      // a state the sheet holds and never acts on is a state that will one day be acted on by
      // accident. An unknown field falls back the same way, which GAP_FIELDS decides.
      var gq = m[1] === 'calendar' ? GAP_Q.exec(String(h || '')) : null;
      var gf = gq ? decodeURIComponent(gq[1]) : null;
      return { reading: m[1], scope: scopeByCodes(m[2] || ''),
               open: q ? decodeURIComponent(q[1]) : null,
               gap: (gf && GAP_FIELDS[gf]) ? gf : null };
    }

    // ---- the open rows, issue 112 -----------------------------------------------
    // ONE TOGGLE FOR 83 ROWS IS NOT A DISCLOSURE, it is a second sheet. On the unscoped outline
    // pressing it put 83 blocks and 272 lines on the screen at once, which is not a reading of
    // anything, and there was no way at all to ask about one row. So the row's own title is the
    // control and the page-level one survives as an explicit open-all, which is genuinely useful
    // on a scoped route of six rows and useless on 83.
    function templatesInScope() { return stats(scope).templates; }

    function isOpen_(t) { return !!openRows[t.id]; }

    function openCount() {
      return templatesInScope().filter(isOpen_).length;
    }

    // Every row in scope, which is what the page-level control offers and what `agenda` has always
    // reported. It is false on an empty scope, because "all of nothing is open" is a claim nobody
    // asked for and a control reading `close every session outline` over no rows is a control
    // that does nothing.
    function allOpen() {
      var ts = templatesInScope().filter(agendaFor);
      return ts.length > 0 && ts.every(isOpen_);
    }

    function setOpen(t, on) {
      if (on) openRows[t.id] = true;
      else delete openRows[t.id];
    }

    function setAllOpen(on) {
      templatesInScope().forEach(function (t) {
        if (agendaFor(t)) setOpen(t, on);
      });
    }

    // What goes on the address. `all` when every row in scope is open, the ids otherwise, and
    // nothing at all when none is: an address with an empty parameter on it would be a second
    // spelling of the address without one.
    function openParam() {
      if (allOpen()) return 'all';
      var ids = templatesInScope().filter(isOpen_).map(function (t) { return t.id; });
      return ids.length ? ids.join(',') : null;
    }

    function applyOpenParam(v) {
      openRows = {};
      if (!v) return;
      if (v === 'all') { setAllOpen(true); return; }
      var want = {};
      String(v).split(',').forEach(function (id) { if (id) want[id] = true; });
      // Read against the rows in scope rather than trusted, so an id from another programme or
      // from a document this page is not drawing opens nothing instead of sitting in the state.
      templatesInScope().forEach(function (t) { if (want[t.id]) setOpen(t, true); });
    }

    // REPLACE AND NOT PUSH, which is the reasoning `close()` already runs on. Opening rows is
    // reading rather than navigating, and a reader who opened six of them should get back to
    // where they came from in one press rather than in seven. The address stays linkable, which
    // is the whole of what the card asked for.
    function writeOpenAddress() {
      if (!reading) return;
      var v = openParam();
      // The worklist is the calendar's and the open set is the outline's, so the two queries can
      // never both be on. Written as a chain rather than as an if for that reason: whichever of
      // them the reading has, the address carries, and neither can overwrite the other.
      var url = location.pathname + location.search + addressFor(reading, scope) +
                (v ? '?open=' + encodeURIComponent(v)
                   : gapField ? '?gap=' + encodeURIComponent(gapField) : '');
      try {
        history.replaceState(null, '', url);
      } catch (err) {
        /* a file:// URL, where replaceState throws. The rows are open either way; only the
           address does not follow, which is the half of this that is a convenience. */
      }
    }

    function openChanged() {
      built = null;
      buildRows();
      describe();
      writeOpenAddress();
    }

    // The programme, in the words the drawing already uses for it, so a reader arriving from a
    // tile reads the same name here that was over the tile.
    //
    // ISSUE 146. AND A SET IN THE WORDS THE DRAWING ALREADY USES FOR ONE, which is `scopeWords` in
    // app.js: one programme is its own label, two or more are counted and then named, and the
    // codes are the ones on the chips. The two are the same three forms in the same order, so a
    // reader moving between the picture and the calendar meets one vocabulary; the sheet has its
    // own copy because a module that reads across all seven owns no other module's private
    // function, which is the split this file has kept since #80.
    function scopeName() {
      if (isAll(scope)) return 'all ' + VIEWS.length + ' programmes';
      if (scope.length === 1) return scope[0].label || scope[0].code;
      return scope.length + ' programmes, ' + scope.map(function (v) {
        return v.code || v.key;
      }).join(', ');
    }

    // ---- the per session outline, issues 85 and 108 -----------------------------
    // OFF UNTIL IT IS ASKED FOR. Everything else in this sheet is a value read off the drawing
    // and this is a block of prose under every row, so it is behind a control rather than on
    // the page by default: 83 rows each carrying three or four extra lines is a different sheet
    // from the one a reader opened, and which of the two they get is their choice.
    //
    // THE LINES COME OUT OF THE INSTANCE DOCUMENT AND ARE NOT WRITTEN HERE. They are property
    // rows in the model, ranked and flagged there beside every other value, and the build
    // refuses one whose rank or flag is not what the block declares. A copy of them in this file
    // would be a second place for content nobody has gated.
    //
    // ISSUE 108, AND IT IS TWO CHANGES IN ONE PLACE. The block used to draw ONE set of four
    // constant lines under all 83 rows; it now draws the set written for the row it hangs under,
    // read out of `by_template` keyed on the template's own id. And each line leads with the
    // rung it is, `scope`, `method`, `practicum` or `outcome`, which is the row's own `k` and
    // not a string invented here: the model refuses a label outside that closed set, so what
    // the reader sees as a schema is a schema and not a convention this file keeps.
    //
    // WHAT #108 STOPPED DRAWING AND WHAT ISSUE 148 PUTS BACK, and the second half is why this
    // paragraph is now the longest in the file. #108 removed the block's leading sentence and the
    // per line badge printing its `f`, on the owner's instruction, and left a note here saying a
    // badge back was a product decision rather than a bug fix. Two things happened after that.
    //
    // THE COMMENT IN app.css NEVER FOLLOWED. It names FOUR devices keeping invented prose apart
    // from the published titles beside it, and two of them stopped existing: measured on the
    // repository and on the served bytes, `dummy` occurred 0 times in this file and `agenda-note`
    // 0 times. So the stylesheet documented a safety argument the page had not made since #108,
    // which is worse than never having made it: a reader auditing the honesty of this block would
    // have read four devices and been able to find two.
    //
    // AND THE OWNER SAID THE OUTLINES ARE ABOUT TO MATTER: "this outlines are important and will
    // play a crucial role in the near future". That turns the gap from an untidiness into the
    // state to avoid, which is invented curriculum text visually indistinguishable from published
    // titles and able to survive a screenshot with nothing attached. #135 found the same gap and
    // correctly declined to repair it, because the constraint on that card forbade visible
    // characters from rising and both devices are text; issue 148 waives that constraint for
    // exactly these two and for nothing else.
    //
    // SO THE TWO THAT SURVIVE A CROP ARE BACK, and they are the two that survive a crop:
    //   the note   the first thing in the box, saying the block is not Zrive's curriculum. It is
    //              written HERE and not read off the model, which is the one place this function
    //              departs from the rule below, and the reason is that #108 deleted the model's
    //              `agenda.note` when it made every row's outline its own. The note is a
    //              statement the PAGE makes about the page, in the register index.html and the
    //              rest of this file already make such statements in; the LINES are content and
    //              stay in the document, gated, where they were.
    //   the badge  on every LINE and never on the block, which is the whole of what makes it the
    //              strongest of the four: there is no line a reader can crop, quote or screenshot
    //              without one. It prints the row's own `f`, so a document whose rows were
    //              flagged as anything else would say so rather than say `dummy`.
    //
    // WITH THE BADGE BACK THE BOX STOPS BEING LOAD BEARING, which is what pays for the styling
    // the owner asked for in the same card. app.css can give this block the table's typography,
    // its rhythm and its bracket rail without the block becoming indistinguishable from real
    // curriculum, because what tells a reader it is invented is now on the line rather than in
    // the ground behind it. The argument is written out over `.agenda-box` in that file.
    //
    // A ROW WITH NO OUTLINE WRITTEN FOR IT DRAWS NO BLOCK, rather than an empty box or a
    // fallback. The build already refuses a drawn template with no outline, so this branch is
    // unreachable from a document this repository produces and is here for the document it does
    // not: a private instance laid out through --instance carries its own templates.
    function agendaAvailable() {
      return !!(AGENDA && AGENDA.by_template);
    }

    function agendaFor(t) {
      var rows = AGENDA && AGENDA.by_template ? AGENDA.by_template[t.id] : null;
      return rows && rows.length ? rows : null;
    }

    // How many of the outline's columns sit before the title, which is the column an opened
    // agenda hangs under. Written once here rather than as a 2 in the row builder, because the
    // two are the same fact: `syllabus` and `template` are the columns buildOutline names before
    // `title`, and a column added before them has to move the block with it.
    var AGENDA_LEAD = 2;

    // THE SENTENCE THAT SURVIVES A CROP, ISSUE 148, and it says what the block is and stops.
    // It does NOT say how many templates carry one, which is what the deleted #85 sentence said
    // and what #108 made false when it gave every row its own outline; a crop-proof sentence that
    // is wrong about the page is worse than none. It does not name a control either, which is the
    // rule #128 left behind. What is left is the claim, in the fewest characters that carry it.
    var AGENDA_NOTE = 'Not Zrive\'s curriculum. Every line here was written for this toy.';

    function agendaRow(cols, t, secNo) {
      var rows = agendaFor(t);
      if (!rows) return null;
      var tr = document.createElement('tr');
      tr.className = 'term-agenda';
      tr.id = agendaBlockId(t);
      // TWO CELLS AND NOT ONE, ISSUE 135, AND THE SECOND ONE IS WHY. This row spanned the whole
      // table and app.css indented the box off the table's left edge, which is under the ordinal
      // column and belongs to nothing: the block sat 124px to the left of the title it was opened
      // from. An indent in pixels cannot fix that, because the first two columns are sized by
      // their own content and `1 of 6` on Z-IB is not the width of `28 of 28` on Z-BL, so one
      // number would be right on one outline of the eight.
      //
      // A cell spanning the two columns before the title puts the block on the title's own left
      // edge on every outline, at every width, with nothing to keep true: the table computes it.
      // The spacer is genuinely empty, so the phone layout's `td:empty` rule takes it out where
      // there are no columns to be aligned to anyway. The row still spans the same nine columns.
      var lead = document.createElement('td');
      lead.className = 'agenda-gap';
      lead.colSpan = AGENDA_LEAD;
      tr.appendChild(lead);
      var td = document.createElement('td');
      td.className = 'agenda-cell';
      td.colSpan = Math.max(1, cols - AGENDA_LEAD);
      var box = el('div', 'agenda-box');
      // ISSUE 148, DEVICE FOUR: the first thing in the box, so a crop that starts at the top of
      // the block carries it. Its section number leads, which is the only place the outline's
      // numbering reaches the third level, and the badge is between the number and the sentence
      // rather than after it, because a reader scanning left to right meets the standing of the
      // block before they meet a word of the block.
      var note = el('p', 'agenda-note');
      if (secNo) note.appendChild(el('span', 'agenda-no term-no', secNo));
      note.appendChild(el('span', 'flag dummy', 'invented'));
      note.appendChild(document.createTextNode(' ' + AGENDA_NOTE));
      box.appendChild(note);
      var ol = el('ul', 'agenda-lines');
      rows.forEach(function (r) {
        var li = el('li', 'agenda-line');
        // ISSUE 148, DEVICE THREE, AND IT PRINTS THE ROW'S OWN `f` RATHER THAN THE WORD `dummy`.
        // A document whose rows carried another flag would say that flag here; the build gate
        // already refuses a rank or a flag outside what this block declares, so the badge and the
        // gate are reading one field rather than agreeing by convention. It is on the LINE, which
        // is what makes it the device that survives a crop of a single line.
        li.appendChild(el('span', 'flag ' + r.f, r.f));
        li.appendChild(el('b', 'agenda-rung', r.k));
        li.appendChild(document.createTextNode(' ' + r.v));
        ol.appendChild(li);
      });
      box.appendChild(ol);
      td.appendChild(box);
      tr.appendChild(td);
      return tr;
    }

    // The page-level control, and issue 112 decided what it becomes rather than deleting it.
    // Expand-all is genuinely useful on a scoped route of six rows and useless on 83, so it
    // survives as an EXPLICIT open-all instead of being the only gesture there is: the label says
    // how many rows it is about, which is the number that makes the difference between the two
    // cases visible before the press rather than after it. Still one of it and not one per row,
    // still at the size #77 took every control on this page to.
    function agendaToggle() {
      var all = allOpen();
      var n = templatesInScope().filter(agendaFor).length;
      var opened = openCount();
      var wrap = el('p', 'term-agendactl');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'zbtn agenda-toggle';
      b.setAttribute('aria-pressed', all ? 'true' : 'false');
      b.textContent = all
        ? 'close all ' + n + ' session outlines'
        : (opened ? 'open the other ' + (n - opened) + ' session outlines'
                  : 'open all ' + n + ' session outlines');
      // The hint that used to stand beside this control is on the control instead, issues 91 and
      // 93: a sentence standing permanently on the screen was one of the six those cards counted.
      //
      // ISSUE 108 REWRITES IT, twice over. It said "the same four under every template", which
      // stopped being true the moment this file started drawing the per session table, and a
      // control that describes the wrong thing is worse than one that describes nothing. And it
      // now says what the block IS rather than where it came from, which is the owner's
      // instruction on this sheet: the schema, and the fact that a row's outline is its own.
      b.title = 'Three or four lines under each row, one per part of a session: scope, ' +
        'method, practicum where there is one, and outcome. Each row has its own.';
      b.addEventListener('click', function () {
        setAllOpen(!all);
        openChanged();
      });
      wrap.appendChild(b);
      return wrap;
    }

    // ---- the row's own control, issue 112 ---------------------------------------
    // "Session outlines must be shown when clicked in the title not just all at once or none at
    // all." So the title IS the control, and the hit area is stated rather than inherited from the
    // text box: #84 measured a text-shaped target at 39,4 by 3,0px at fit scale, which is what a
    // reader gets when text is allowed to be the control. The floor #77 set is 26 by 26 and
    // app.css holds this to it with a min-height and a padding, not with a size written here.
    //
    // A BUTTON AND NOT A CELL WITH A LISTENER, because the row has to answer to a keyboard and to
    // a screen reader as what it is: `aria-expanded` says whether the outline under it is open,
    // and `aria-controls` names the row that carries it, which is why the block below is given an
    // id built from the template's own.
    function agendaBlockId(t) { return 'ag-' + t.id; }

    function titleControl(t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'rowdisc';
      b.setAttribute('aria-expanded', isOpen_(t) ? 'true' : 'false');
      b.setAttribute('aria-controls', agendaBlockId(t));
      b.title = isOpen_(t) ? 'close this session outline' : 'open this session outline';
      b.appendChild(el('span', 'rowdisc-mark', isOpen_(t) ? '\u25be' : '\u25b8'));
      b.appendChild(el('span', 'rowdisc-tx', t.title));
      b.addEventListener('click', function () {
        setOpen(t, !isOpen_(t));
        openChanged();
      });
      return b;
    }

    // ---- what the sentence is about, issue 121 ---------------------------------
    // THE ONE QUESTION THE SENTENCE HAD NEVER ASKED. A reading obeys the window or it does not,
    // which is READING's answer and #90's split; and where it does, the LIST filters to the window
    // while the two grids keep every session and mark the band instead, which is #90's other
    // decision kept by #100. So "is the set on screen the window's set" is the conjunction of the
    // two, and it is the only thing that decides whether a figure in the sentence is about the
    // term or about the window. Written once here and read three times below, because a sentence
    // whose count came from one answer and whose date span came from another is exactly the state
    // this card was filed about.
    //
    // WHY THE SHAPE IS IN IT AND WHY LEAVING IT OUT WOULD HAVE BEEN A NEW WRONGNESS. A month grid
    // under a three week window draws all eighty three chips with twenty one days lit. A sentence
    // that said "eleven sessions" over it would be false about the rows in exactly the way the old
    // one was false about the window, in the other direction. The rule is that the sentence
    // describes what the sheet drew, and on a grid what the sheet drew is the term.
    function listsWindow() {
      var rd = reading && READING[reading];
      return !!(rd && rd.window && SHAPE_FILTERS[shape] && windowOn());
    }

    function describe() {
      var windowed = listsWindow();
      var st = stats(scope, windowed, !!gapField);
      var over = isAll(scope) ? st.programmes + ' programmes' : scopeName();
      if (reading === 'calendar') {
        // The programmes the rows came from rather than the programmes the scope names, for the
        // reason stats() carries both: unscoped and windowed, "across 7 programmes" is a claim
        // about the term made over a list that may hold four of them.
        var spread = st.programmesShown === 1 ? '1 programme'
                                              : st.programmesShown + ' programmes';
        var listed = st.sessions.length;
        // A window of one week over one programme can leave one row or none, which is a state the
        // unwindowed sentence could never reach and "1 sessions" is a wrongness of the same kind
        // as the ones above it, only smaller.
        var many = listed === 1 ? ' session' : ' sessions';
        // #120's idiom, and it is the same reading for the same reason: the denominator appears
        // only while something is taking rows off, so "83 sessions" and "11 of 83 sessions" are
        // the two states of one sentence rather than two sentences.
        // ISSUE 122 GAVE THE UNWINDOWED FORM A DENOMINATOR OF ITS OWN, AND THE TWO `of`s MEAN
        // DIFFERENT THINGS BY DESIGN. Under a window the denominator is the scope's own drawn
        // rows, which is #121's reading and is untouched. With no window taking rows off, the
        // next population up is the one the model declares, so the heading says how much of it
        // the documents hold. The two are told apart by a word: `11 of 83 sessions` is the
        // window's, `83 of the 260 sessions` is the model's. A form that read `83 of 260` would
        // be indistinguishable from a window at three weeks, which is this card's own defect
        // pointing the other way.
        var samp = sampleOf(scope, 'CohortSession');
        // ISSUE 125 ADDED THE THIRD FORM AND IT HAS A DENOMINATOR OF ITS OWN AGAIN. A worklist is
        // a count of rows out of the rows the reader can see, so the denominator is what the
        // window left and not what the model declares: `1 of 16 sessions` on three weeks and
        // `11 of 83 sessions` on the whole term. Reading `11 of the 260` here would say the eleven
        // were eleven of the term, which is the sample confusion #122 was filed about arriving by
        // a different door.
        var counted = gapField ? listed + ' of ' + st.sessionsShown +
                                 (st.sessionsShown === 1 ? ' session' : ' sessions')
                    : windowed ? listed + ' of ' + st.sessionsInScope + ' sessions'
                    : samp.complete ? 'all ' + listed + many
                    : samp.total ? listed + ' of the ' + samp.total + many
                    : listed + many;
        // AND WHAT ORDER THE ROWS ARE IN, which stopped being one answer at issue 124. The three
        // shapes that came before it are date order and say so; the review ranks the window by
        // what the meeting acts on and says that instead. A heading that still read "in date
        // order" over a screen whose first band is every session with nobody to teach it would be
        // the same kind of wrong as the sentence #121 was filed about, one line further up.
        titleEl.textContent = (isAll(scope) ? 'The term' : scopeName()) + ', ' +
          counted + (gapField ? ', the ones with no ' + gapField : SHAPE_ORDER[shape]);
        // BUILT AS PARTS AND JOINED, because a window can leave the list with nothing in it and a
        // date span, a state tally and a separator printed over an empty set are three marks a
        // reader has to decide are not zeros. #119 put that state in the data's reach; this is the
        // sentence meeting it.
        var bits = [
          listed + many + ' across ' + (windowed && isAll(scope) ? spread : over)
        ];
        // AND THE SAMPLE AS A CLAUSE OF ITS OWN, issue 122, where it used to be a tail on the
        // clause above. It is its own bit because it is its own fact: the first clause is how many
        // rows are on screen and out of which programmes, and this is how much of the term those
        // rows are. A window moves the first and cannot move the second, which is exactly why the
        // old sentence, which had them joined, printed a window's row count against the model's
        // total and let the two read as one fraction.
        var sampSaid = sampleWords(samp, 'session');
        if (sampSaid) bits.push(sampSaid);
        if (st.from) bits.push(st.from + ' to ' + st.to);
        if (st.stateCounts) bits.push(st.stateCounts);
        // THE GAP FIGURES CARRY THE POPULATION THEY WERE COUNTED OVER. Issue 122, and it is the
        // half of that card that is about the counts rather than about the scope: eleven sessions
        // with nobody to teach them is eleven of the rows this sheet drew, and over an unqualified
        // number a reader has no way to know whether the other seventy two exist or whether the
        // term holds two hundred and sixty. The denominator is `listed` and not the term's total
        // because that is the set the numerator was taken over, and the clause above says what
        // that set is a part of.
        bits.push(st.noInstructor + ' of ' + listed + ' with no instructor named');
        bits.push(st.noRecording + ' of ' + listed + ' with no recording');
        // Issue 125. What the rows are, and on a worklist that is the filter rather than the
        // ranking: "unstaffed first" over a list every row of which is unstaffed is a sentence
        // about an order that is not doing anything.
        bits.push(gapField ? 'as a worklist, every row with no ' + gapField : SHAPE_NAME[shape]);
        // AND THE WINDOW SAID TWO WAYS, which is the same split as everything above it. Where the
        // rows ARE the window, the clause says which window they are; where the shape marks
        // instead of filtering, the figures are the term's and the clause is the count inside the
        // band, which is what it has said since #90.
        if (windowOn()) {
          bits.push(windowed ? 'inside ' + windowText()
                             : windowShown(scope) + ' of them inside the window, ' + windowText());
        }
        subEl.textContent = '';
        subEl.appendChild(document.createTextNode(bits.join(' · ')));
      } else {
        // The same three moves as the calendar above, issue 122, and the outline is where the
        // card's own example lives: `38 record no duration` is 38 of the 83 templates these
        // documents hold and reads as 38 of a syllabus of 260.
        var sampT = sampleOf(scope, 'SessionTemplate');
        var nT = st.templates.length;
        var countedT = sampT.complete ? 'all ' + nT + ' session templates'
                     : sampT.total ? nT + ' of the ' + sampT.total + ' session templates'
                     : nT + ' session templates';
        titleEl.textContent = (isAll(scope) ? 'The outline'
                               : scope.length === 1 ? 'The ' + scopeName() + ' outline'
                               : 'The outline of ' + scopeName()) +
          ', ' + countedT + ' in curriculum order';
        var tbits = [nT + ' templates across ' + over];
        var sampTSaid = sampleWords(sampT, 'session template');
        if (sampTSaid) tbits.push(sampTSaid);
        tbits.push(nT + ' deliveries, at most ' + st.maxDeliveries + ' to a template');
        tbits.push(st.noDuration + ' of ' + nT + ' record no duration');
        subEl.textContent = '';
        subEl.appendChild(document.createTextNode(tbits.join(' · ')));
      }

      noticeEl.textContent = '';
      // Issue 88. The shape belongs to the calendar and only to it: an outline is curriculum
      // order and has no date to lay out.
      if (reading === 'calendar') {
        noticeEl.appendChild(shapeBar());
      }
      // ISSUE 151 DELETED THE PARAGRAPH THAT STOOD HERE and this comment is what is left of it,
      // because a deletion card is the one kind the next card silently undoes.
      //
      // WHAT IT SAID: "The window is off this reading: an outline is curriculum order and a
      // syllabus has no date to filter on." It was #90's, and it existed because a reader who
      // sets a window on the calendar and switches reading would otherwise meet a full outline
      // with a header control saying three weeks and no explanation. #128 cut it to its finding
      // and left it standing.
      //
      // WHY IT GOES: by #128's own rule it explains the page rather than stating a measured fact
      // about the data, and every sentence of that kind on this page has gone.
      //
      // AND WHY THIS IS NOT A DELETION ON ITS OWN. The fact it carried is true and a reader still
      // needs it, so it moved onto the thing it is about, which is the seventh principle: the
      // strip greys, stops answering a pointer and a keyboard, and carries the count that refused
      // it, in the same three moves `grain` makes when the node budget refuses an altitude. The
      // argument and the code are over windowInert() above. Nothing may put a sentence back here
      // without taking that treatment off the control, because the two together would be the page
      // saying it twice, which is what #128 was filed about.
      // The way from one reading to the other keeps the scope, and the way back to all seven is
      // its own control, because a reader who arrived at Z-SC from a tile has no other way out
      // of it and an address they have to edit by hand is not a way out.
      noticeEl.appendChild(scopeBar());
      // Issue 125. Under the scope bar because it is the narrower of the two: the scope says which
      // programmes the rows can come from and this says which of those rows are here.
      if (gapField) noticeEl.appendChild(gapBar(st.sessionsShown));
      if (reading === 'outline' && agendaAvailable()) noticeEl.appendChild(agendaToggle());

      if (calBtn) toggleCurrent(calBtn, reading === 'calendar');
      if (outBtn) toggleCurrent(outBtn, reading === 'outline');
      if (calBtn) calBtn.href = addressFor('calendar', scope);
      if (outBtn) outBtn.href = addressFor('outline', scope);
    }

    // ---- the three shapes, issue 88 ---------------------------------------------
    var SHAPE_NAME = { review: 'as a review, unstaffed first', month: 'as a month grid',
                       week: 'as a week grid, one column per week', list: 'as a list' };

    var SHAPE_TITLE = {
      review: 'the window across every programme, the sessions with nobody to teach them first ' +
              'and the programmes with nothing in it named underneath. What this address opens on',
      month: 'one panel per month of the term, seven weekday columns, every day drawn once',
      week: 'one grid: Monday to Sunday down the side, one column per week of the term, so the ' +
            'weeks can be compared and the window is the same interval the strip brushes',
      list: 'one row per session, the reading this sheet opened with before issue 88'
    };

    // The clause the heading closes with, per shape, for the reason SHAPE_NAME is a table: the
    // ordering is a property of the shape and a second copy of it under a condition is a second
    // place for it to disagree with the rows.
    // The separator is part of the value, because the two tails want different ones: `83 of the
    // 260 sessions in date order` is one phrase and `11 of 83 sessions, unstaffed first` is a
    // count and then what it is ranked by.
    var SHAPE_ORDER = { review: ', unstaffed first', month: ' in date order',
                        week: ' in date order', list: ' in date order' };

    function monthName(ym) {
      return MONTHS[Number(ym.slice(5, 7)) - 1] + ' ' + ym.slice(0, 4);
    }

    // `groupBy`, `monthsOf` and `weeksOf` stood here and are gone with issue 146. They grouped the
    // DRAWN rows into the panels the two grids were built out of, which is exactly the arithmetic
    // that made a grid's panels a property of what these documents happened to draw rather than of
    // the term. The grids read termMonths() and the term's own weeks now, and nothing else in this
    // file ever called these three.

    // Issue 88 wrote a paragraph per shape above the rows, saying what that shape was for and
    // what it made visible about this term. Issues 91 and 93 took the paragraphs off the screen
    // and the facts they carried are here: a month grid puts the seven months side by side and
    // its Saturday and Sunday columns are where the in-person weekends fall, which no ordered
    // list of the same rows shows; a week here is sparse, because 71 of the 83 sessions start at
    // the same hour, so a week is two rows rather than a day of stacked hours, and it is here
    // because one week is the unit the window is counted in; and the list is the shape a window
    // filters down to an agenda, while the two grids keep every session and mark the window
    // instead. The shape buttons keep their titles, so what each shape is for is still on the
    // control it is about, which is where issue 79 put the other three instructions.

    function setShape(k) {
      if (shape === k || CAL_SHAPES.indexOf(k) === -1) return;
      shape = k;
      built = null;
      // ISSUE 125. LEAVING THE REVIEW LEAVES THE WORKLIST, and the address says so at once. The
      // worklist is a ranking of the rows a meeting acts on, which is what the review is; the two
      // grids keep every session and mark the window instead, so a filter on top of one of them
      // would be a state the sheet held and did not draw. The alternative was to let the grids
      // carry it, and a `?gap=` sitting on an address whose picture ignores it is exactly the
      // kind of invisible state this page has spent four cards taking out of itself.
      if (gapField && k !== 'review') { gapField = null; writeOpenAddress(); }
      // The same default the address applies, applied to the press that asks for the same screen,
      // and it steps aside on the same condition: a reader who has answered the window question
      // keeps their answer. Issue 124.
      var armed = k === 'review' && armReview();
      buildRows();
      describe();
      if (armed) {
        if (onWindow) onWindow(windowSpec());
        restateWindow();
      }
    }

    function shapeBar() {
      var bar = el('p', 'term-shape');
      bar.appendChild(el('span', 'term-scope-lead', 'Shape. '));
      CAL_SHAPES.forEach(function (k) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'zbtn shape-btn';
        b.textContent = k;
        b.title = SHAPE_TITLE[k];
        b.setAttribute('aria-pressed', shape === k ? 'true' : 'false');
        b.addEventListener('click', function () { setShape(k); });
        bar.appendChild(b);
      });
      return bar;
    }

    // ---- the two grids ------------------------------------------------------------
    // NOTHING IN A GRID IS A CONTROL, and that is a decision rather than an omission. #77 took
    // every control on this page to 26 by 26 from eleven of eleven failing WCAG 2.2 SC 2.5.8, and
    // 83 chips in seven columns at 390px cannot be 26 wide. A chip is a rendering of a row, its
    // whole content is in its own title attribute, and the way to a session is the drawing and
    // the panel, which is where it already was.
    // AND A TITLE WAS THE ONLY COPY, WHICH IS TWO READERS SHORT. Issue 170. `title` is a hover, a
    // phone has no hover, and on a `div` carrying no role it is also not reliably announced, so
    // five facts about 83 sessions were reachable by a mouse and by nothing else. The stylesheet
    // makes it worse at 390 by taking `.cal-title` off, which leaves a chip reading `18:30 Z-IB`
    // in 45.1 by 24.5 px and no way at all to learn which session it is.
    //
    // THE STRING IS WRITTEN ONCE AND CARRIED TWICE, as the title for a mouse and as the chip's own
    // accessible name for everything else. What is announced no longer depends on which of the
    // three painted spans the stylesheet is showing at this width, which is the half of this a
    // wide screen hid: `display: none` takes an element out of the accessibility tree as well as
    // off the screen, so at 390 the session title was gone from both.
    //
    // WHY A ROLE HAS TO BE ON IT. `aria-label` on a bare `div` is ignored: the implicit role is
    // `generic` and naming a generic element is prohibited, so the name has to hang off a role
    // that takes one. `img` is the role for a cluster of marks that means one thing and is read as
    // one thing, which is what a chip is, and it makes the label REPLACE the three spans in the
    // reading rather than being read beside them.
    //
    // AND NOT A VISUALLY HIDDEN SPAN, WHICH IS WHAT THIS WAS FIRST. A 1x1 clipped span is real text
    // in the document, `clip-path` is invisible to `innerText`, and feedback.js's `renderedText`
    // IS `innerText`: a capture filed on a calendar chip would have quoted the whole sentence on
    // top of the words on the screen. An attribute is read by the accessibility tree and by nothing
    // else, which is exactly the reach this needs. Found on the diff by a second opinion, not by
    // this file.
    //
    // The sighted phone reader is the one this still does not serve, and the answer for them is
    // not a tooltip either: `list` and `review` are two of the four shapes of this same sheet, one
    // press away on the bar above the grid, and both draw every one of these fields as a cell.
    //
    // NOTHING HERE IS A CONTROL, AND THE PARAGRAPH ABOVE STANDS. No tabindex, no press, and `img`
    // is not an interactive role. 83 focus stops is what that paragraph refuses and this adds none.
    function chip(s) {
      var c = el('div', 'cal-chip' + (s.teacher !== 'yes' ? ' cal-gap' : ''));
      c.appendChild(el('span', 'cal-time', s.time));
      c.appendChild(el('span', 'cal-code', s.code));
      c.appendChild(el('span', 'cal-title', s.title));
      // A TITLE IS TEXT AND OFF SCREEN IS NOT ABSENT, which is why the last clause of this string
      // is gone rather than left where only a hover finds it. Issue 110.
      var words = s.date + ' ' + s.time + ' · ' + s.code + ' · ' + s.title + ' · ' +
        s.state + ' · ' +
        (s.teacher === 'yes' ? 'instructor named' : 'no instructor named') +
        ' · attendance ' + s.attendance + ' · drawn as ' + s.id;
      c.title = words;
      c.setAttribute('role', 'img');
      c.setAttribute('aria-label', words);
      return c;
    }

    // ---- WHAT A GRID IS OVER, ISSUE 146: THE TERM AND NOT THE ROWS IT HAPPENS TO HOLD --------
    // `monthsOf(scope)` and `weeksOf(scope)` group the DRAWN rows, so a panel existed only where a
    // session had been drawn. On Z-PE, whose document holds 6 of the 36 sessions the model counts
    // and whose last drawn one is 19 February, the month grid drew January and February and the
    // term ended there; four months of it were shown as no months at all. That is an absence
    // produced by which rows these documents drew, printed as though it were the shape of the
    // business, which is the one thing this file's own rule says it may never do. Both grids draw
    // the term now, every month of it and every week of it, so an empty month is on the screen as
    // an empty month and the note under the grid says which kind of nothing it is.
    //
    // The two groupers are still used by nothing else and are gone with the panels they built.
    function termMonths() {
      var out = [], ym, y, m;
      if (!TERM) return out;
      ym = TERM.first.slice(0, 7);
      while (ym <= TERM.last.slice(0, 7)) {
        out.push(ym);
        y = Number(ym.slice(0, 4));
        m = Number(ym.slice(5, 7));
        ym = m === 12 ? (y + 1) + '-01' : y + '-' + pad2(m + 1);
      }
      return out;
    }

    // ISSUE 158. THE DAYS OF ONE MONTH AND NOT A DAY MORE. This returned the Monday on or before
    // the first of the month to the Sunday on or after the last of it, so consecutive panels
    // overlapped: measured on this term, six panels of whole weeks are 217 cells over 189 days, so
    // 28 of them draw a day some other panel has already drawn. He asked for that to stop. The
    // alignment those whole weeks bought is kept by the pads below, which are blanks and not days:
    // a day is now drawn exactly once anywhere in the grid, and the columns still line up.
    function monthDays(ym) {
      var y = Number(ym.slice(0, 4)), m = Number(ym.slice(5, 7));
      var lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
      var out = [], i;
      for (i = 1; i <= lastDay; i++) out.push(ym + '-' + pad2(i));
      return out;
    }

    // A BLANK AND NOT A DAY, which is the whole of the repair: it holds the place of a weekday
    // before the first of the month or after the last of it, carries no date, no number and no
    // chip, and is out of the accessibility tree because there is nothing in it to read.
    function padCell() {
      var c = el('div', 'cal-cell cal-pad');
      c.setAttribute('aria-hidden', 'true');
      return c;
    }

    // One cell, one day, and both grids build theirs here so a day cannot come to mean two things
    // on the two shapes. The cell's own day is on the cell, because a grid is the one view here
    // where WHICH day a thing landed on is the claim being made: a driver can check the painted
    // position against the date without being handed the model.
    function dayCell(d, byDate) {
      var cls = 'cal-cell cal-day';
      if (windowOn()) cls += inWindow(d) ? ' cal-inwin' : ' cal-outwin';
      var cell = el('div', cls);
      cell.setAttribute('data-date', d);
      cell.appendChild(el('span', 'cal-dnum', String(Number(d.slice(8, 10)))));
      (byDate[d] || []).forEach(function (s) { cell.appendChild(chip(s)); });
      return cell;
    }

    // WHAT A PANEL'S COUNT SAYS WHEN IT IS ZERO, AND THAT IS THE ONLY PLACE THE NOUN MOVES.
    // `16 sessions` over sixteen chips needs no qualification; the reader is looking at them. Zero
    // is a different kind of sentence, because an empty April is either a month with no class in
    // it or a month these documents did not draw, and those are the two the review tells apart.
    // So the empty case takes the review's own noun and the note under the grid carries the
    // fraction. Nowhere else on a grid is a count of nothing printed.
    function countWords(n, samp) {
      if (n) return n + (n === 1 ? ' session' : ' sessions');
      return samp.complete ? 'no session' : 'no drawn session';
    }

    // ONE PANEL. Issue 88 put a warning on the face of every one of them, on the argument that a
    // month grid is the one view here whose screenshot would be believed. Issues 91 and 93 took
    // it off: at seven panels that argument was producing seven identical copies of a sentence
    // the footer already carries once, and the reader who is looking at the page is the reader
    // the count was hurting. The chip's own title still carries the line, so the value a reader
    // hovers still says what it is.
    function panelHead(sec, headText, n, samp) {
      var h = el('h3', 'cal-head');
      h.appendChild(el('span', 'cal-headname', headText));
      h.appendChild(el('span', 'cal-headn', countWords(n, samp)));
      sec.appendChild(h);
    }

    function monthPanel(ym, byDate, n, samp) {
      var sec = el('section', 'cal-panel');
      panelHead(sec, monthName(ym), n, samp);
      var grid = el('div', 'cal-grid cal-monthgrid');
      DAYS.forEach(function (d) { grid.appendChild(el('div', 'cal-dow', d)); });
      var days = monthDays(ym), i;
      for (i = 0; i < dowMon0(days[0]); i++) grid.appendChild(padCell());
      days.forEach(function (d) { grid.appendChild(dayCell(d, byDate)); });
      for (i = dowMon0(days[days.length - 1]) + 1; i < 7; i++) grid.appendChild(padCell());
      sec.appendChild(grid);
      return sec;
    }

    // ---- THE WEEK GRID, TURNED ON ITS SIDE, ISSUE 158 --------------------------------
    // "In calendar view 'week' please make monday to sunday vertical and weeks horizontal so it is
    // a grid that adds value." What stood here was one panel per week that held a session, each of
    // them seven columns, stacked down the sheet: twenty four pictures of one week each, which is
    // a list with lines drawn on it. A reader could see a week and could not compare two.
    //
    // ONE GRID, DAYS DOWN, WEEKS ACROSS. A week is a column now and the columns sit side by side,
    // so the question the shape answers is the one a manager asks: which week is busy, which is
    // empty, which day of the week the term actually runs on.
    //
    // AND THE COLUMNS ARE THE TERM'S WEEKS, ALL OF THEM, WHICH IS WHAT MAKES IT ONE INSTRUMENT
    // WITH THE STRIP. The brush in the header is one column per week of the term and it selects an
    // interval of them; this grid is one column per week of the term and it marks that interval.
    // The two are the same axis at two scales, so a window a reader brushed maps onto this grid one
    // to one and moving between the picture and the calendar preserves the window rather than
    // re-establishing it. Columns of only the weeks that hold a session would have broken that
    // correspondence and hidden the empty weeks, which are a reading in their own right: they are
    // where the term's April and May gaps are.
    function weekGrid(byDate, n, samp) {
      var sec = el('section', 'cal-panel cal-weekpanel');
      panelHead(sec, longDate(TERM.first) + ' to ' + longDate(TERM.last), n, samp);
      // The scroller is here and not on the sheet, because twenty four columns is wider than a
      // phone and the page itself may never scroll sideways: `.sheet-rows` is the scroll box the
      // outline's own table already uses at every width.
      var wrap = el('div', 'cal-weekwrap');
      var grid = el('div', 'cal-grid cal-weekgrid');
      grid.style.gridTemplateColumns = 'auto repeat(' + TERM.weeks + ', minmax(46px, 1fr))';
      grid.appendChild(el('div', 'cal-corner'));
      var i;
      for (i = 0; i < TERM.weeks; i++) {
        var monday = mondayAt(i);
        var head = el('div', 'cal-wk' + (windowOn()
          ? (inWindow(monday) ? ' cal-inwin' : ' cal-outwin') : ''), shortDate(monday));
        head.setAttribute('data-monday', monday);
        head.title = 'the week of ' + longDate(monday);
        grid.appendChild(head);
      }
      DAYS.forEach(function (name, di) {
        grid.appendChild(el('div', 'cal-dow', name));
        for (i = 0; i < TERM.weeks; i++) {
          grid.appendChild(dayCell(addDays(mondayAt(i), di), byDate));
        }
      });
      wrap.appendChild(grid);
      sec.appendChild(wrap);
      return sec;
    }

    // ---- WHAT A GRID CANNOT SHOW, AND IT SAYS SO, ISSUE 146 --------------------------
    // THE REVIEW AND THE LIST SAID WHICH KIND OF NOTHING THEY WERE SHOWING AND THE TWO GRIDS DID
    // NOT. An empty day cell cannot tell a reader whether that day held no session or whether the
    // session it held is one of the ones these documents did not draw, and this file's own rule is
    // that it may never print the second as though it were the first. The review answers it in
    // words under its rows; a grid has no rows to put a sentence under, so the sentence goes under
    // the grid and is built out of the review's own functions rather than written a second time.
    //
    // THREE CLAIMS AND NO MORE, in this order:
    //   the population   how many of the sessions the model counts carry no date at all, which is
    //                    the fact a day grid cannot show by construction: there is no cell for a
    //                    session with no day. Counted in SESSIONS and named as sessions the model
    //                    counts, so it is never the same number as the absences the header counts
    //                    over properties and can never be added to them.
    //   the window       which programmes have nothing in the window, in the review's own two
    //                    sentences, taken from reviewAbsent() and absentWords() unchanged.
    //   the sample       which programmes are drawn as a part of themselves, with the fraction and
    //                    the span these documents actually drew, so an empty cell on Z-IB after 14
    //                    March is read as a document that stops there rather than as a term that
    //                    does.
    // A programme takes at most one row: where it is absent from the window the review's sentence
    // already carries its fraction, and a second line repeating it is the failure issues 91 and 93
    // spent a card taking off this sheet. The sample line is left out on a scope of one, where the
    // population line above it is the same fraction over the same one programme.
    function gridUndatedWords(samp) {
      if (!samp.total) return 'The model counts no session in this scope.';
      var missing = samp.total - samp.drawn;
      if (missing <= 0) {
        return 'Every session in this scope has a day: ' + sampleWords(samp, 'session') + '.';
      }
      return missing + ' of the ' + samp.total + ' sessions the model counts carry no date, so ' +
        'no cell here can hold one: this grid draws the ' + samp.drawn + ' that do.';
    }

    function sampledWords(v, s) {
      var ds = sessionsFor(v);
      return sampleWords(s, 'session') + ', so ' + (s.total - s.drawn) + ' are not drawn here' +
        (ds.length ? ' · drawn from ' + longDate(ds[0].date) + ' to ' +
                     longDate(ds[ds.length - 1].date) : '');
    }

    function gridNotes() {
      var box = el('div', 'cal-notes');
      var samp = sampleOf(scope, 'CohortSession');
      var lead = el('p', 'cal-note cal-note-lead');
      lead.appendChild(el('span', 'term-scope-lead', 'Not on this grid. '));
      lead.appendChild(document.createTextNode(gridUndatedWords(samp)));
      box.appendChild(lead);
      var groups = groupsFor(scope), absentBy = {};
      if (windowOn()) {
        reviewAbsent(true).forEach(function (a) { absentBy[a.view.key] = a; });
      }
      groups.forEach(function (g) {
        var a = absentBy[g.view.key];
        var s = sampleOf(g.view, 'CohortSession');
        var said = a ? absentWords(a)
                 : (!s.complete && groups.length > 1) ? sampledWords(g.view, s)
                 : null;
        if (!said) return;
        var p = el('p', 'cal-note');
        p.appendChild(progLink(g.view.code, g.view.label, g.view.route));
        p.appendChild(document.createTextNode(' · ' + said));
        box.appendChild(p);
      });
      return box;
    }

    // The grids had a sticky banner of their own over the panels, deleted by issues 91 and 93
    // along with the four other copies in this sheet.
    //
    // AND THE ONE SENTENCE THEY HAD LEFT WAS THE ONE THIS CARD FORBIDS. A grid with no rows in it
    // printed "No session in this scope.", which is a statement about the business made out of
    // what these documents drew. It is gone rather than reworded: the grid draws the term's own
    // months and weeks whatever the scope holds, so the empty state is a term of empty cells, and
    // the note under it says how many sessions the model counts and how many of them have a day.
    function buildGrid(kind) {
      var wrap = el('div', 'cal cal-' + kind);
      var rows = sessionsFor(scope), byDate = {};
      var samp = sampleOf(scope, 'CohortSession');
      rows.forEach(function (s) { (byDate[s.date] || (byDate[s.date] = [])).push(s); });
      if (TERM && kind === 'month') {
        termMonths().forEach(function (ym) {
          var n = 0;
          rows.forEach(function (s) { if (s.date.slice(0, 7) === ym) n++; });
          wrap.appendChild(monthPanel(ym, byDate, n, samp));
        });
      } else if (TERM) {
        wrap.appendChild(weekGrid(byDate, rows.length, samp));
      }
      wrap.appendChild(gridNotes());
      return wrap;
    }

    // ---- moving between the scopes ----------------------------------------------
    // ISSUE 146 MADE THIS A MULTI-SELECT AND KEPT BOTH SENTENCES IT ALREADY PRINTED. It offered
    // six links to six other programmes and no way to hold two at once, so the reading that the
    // drawing has answered since #136, three programmes over one fortnight, stopped at the sheet's
    // edge. Every programme is a link now and its address is the scope this press would leave
    // behind: the ones in the scope are marked and take themselves out, the ones outside it put
    // themselves in, and the set is what the address carries.
    //
    // EVERY PART OF IT IS A READING OF THE STATE IT IS IN, which is the rule the header's controls
    // run on. The lead says how many of the seven are in; the mark on a code says whether that one
    // is; the title on it says what a press would do and refuses to promise the one thing it will
    // not do, which is empty the set. The way back to all seven stays a link of its own, because a
    // reader who arrived at one programme from a tile has no other way out of it.
    function scopeBar() {
      var bar = el('p', 'term-scope');
      var n = isAll(scope) ? VIEWS.length : scope.length;
      bar.appendChild(el('span', 'term-scope-lead',
        n >= VIEWS.length ? 'All ' + VIEWS.length + ' programmes. '
        : n === 1 ? 'One programme. '
        : n + ' of ' + VIEWS.length + ' programmes. '));
      if (n < VIEWS.length) {
        var all = el('a', 'linkbtn', 'all ' + VIEWS.length + ' programmes');
        all.href = addressFor(reading, null);
        all.title = 'every programme this document draws';
        bar.appendChild(all);
      }
      VIEWS.forEach(function (v) {
        // MARKED WHERE THE MARK MEANS SOMETHING, which is where the reader has narrowed. On the
        // unscoped reading every programme is in the rows and none is marked, because the mark
        // there would be seven of seven and would promise the gesture the note over toggledScope()
        // explains this sheet does not make.
        var narrowed = !isAll(scope);
        var inScope = narrowed && scope.indexOf(v) !== -1;
        var only = inScope && scope.length === 1;
        var a = el('a', 'linkbtn', v.code);
        a.href = addressFor(reading, toggledScope(v));
        if (inScope) a.setAttribute('aria-current', 'true');
        a.title = (v.label || v.code) + '. ' +
          (!narrowed ? 'Press to read this programme on its own'
           : !inScope ? 'Press to add it to the scope'
           : only ? 'It is the whole scope'
           : 'Press to take it out of the scope');
        bar.appendChild(a);
      });
      return bar;
    }

    // ---- the way off the worklist, issue 125 -------------------------------------
    // A FILTER WITH NO WAY OFF IT IS A DEAD END, and the scope bar above is the precedent word for
    // word: a reader who arrived at Z-SC from a tile has no other way out of it and an address
    // they have to edit by hand is not a way out. This is the same control for the same reason,
    // one row lower, and it is a link to an address rather than a toggle for the reason everything
    // else on this sheet is: the state is on the address and the back button undoes the press.
    //
    // AND IT IS NOT A TENTH CONTROL IN THE HEADER, which is what #120 was filed about and what
    // this card was told not to add. It appears only while a worklist is on, in the sheet the
    // worklist is in, and it names the number it would give back.
    function gapBar(all) {
      var bar = el('p', 'term-scope term-gapbar');
      bar.appendChild(el('span', 'term-scope-lead', 'A worklist. '));
      // `session` and not the type's label, because that is the word this sheet has used for these
      // rows since #80 and a second noun for them here would be a second vocabulary in the one
      // place this card exists to take one out of.
      bar.appendChild(document.createTextNode(
        'Every row here is a session the model records no ' + gapField + ' for. '));
      var a = el('a', 'linkbtn', 'all ' + all + (all === 1 ? ' session' : ' sessions'));
      a.href = addressFor('calendar', scope);
      a.title = 'the same window with nothing filtered out of it';
      bar.appendChild(a);
      return bar;
    }

    function toggleCurrent(a, on) {
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }

    // ---- the two tables --------------------------------------------------------
    // ONE HEADER ROW, AND IT IS THE COLUMNS. There were two: a sticky banner over the columns
    // saying every value in the table was invented, on the argument that a cropped screenshot
    // should carry the disclaimer with it. Issue 92 was filed because that banner is transparent
    // and the rows scrolled visibly through it, and issues 91 and 93 deleted the element, which
    // is why 92 has nothing left to repair. The column headers go back to the top of the scroll.
    function head(table, cols) {
      var thead = document.createElement('thead');
      var hr = document.createElement('tr');
      cols.forEach(function (c) { hr.appendChild(el('th', null, c)); });
      thead.appendChild(hr);
      table.appendChild(thead);
    }

    function groupRow(tb, cols, build, cls) {
      var tr = document.createElement('tr');
      tr.className = cls || 'term-group';
      var th = document.createElement('th');
      th.colSpan = cols;
      build(th);
      tr.appendChild(th);
      tb.appendChild(tr);
    }

    // ---- the modules of one programme, issue 85 ---------------------------------
    // Grouped off the rows and never off a second table: the module a row sits in is a property
    // of the row, it came off the node, and the node got it from the build, which refuses to
    // write a module the vault does not agree with. The rows are already in the syllabus's own
    // sequence, so the modules come out in the syllabus's own order without being ordered here.
    //
    // A row whose syllabus names no module is not dropped and not silently folded into the
    // module before it. It goes into a group of its own that says so, which is the whole of what
    // Z-CFA looks like: forty five rows, one group, and the group is the finding.
    function modulesOf(g) {
      var out = [], byKey = {};
      g.templates.forEach(function (t) {
        var key = t.noModule ? '\u0000none' : String(t.module);
        if (!byKey[key]) {
          byKey[key] = { name: t.module, absent: t.noModule, rows: [] };
          out.push(byKey[key]);
        }
        byKey[key].rows.push(t);
      });
      return out;
    }

    function cell(tr, text, cls) {
      tr.appendChild(el('td', cls, text));
      return tr;
    }

    // ---- the review, issue 124 ---------------------------------------------------
    // THE ROWS OF THE WINDOW, IN TWO BANDS. `sessions` is already in date order across the seven
    // and a filter keeps that order, so the two bands are one pass and nothing is sorted twice:
    // ranking here means choosing which band a row is in, and date order inside a band is the
    // order it was already in. The set is exactly the list shape's set, which is what makes this
    // the calendar ranked rather than a second reading of the term.
    //
    // ISSUE 125 PUT A THIRD NARROWING AFTER THE WINDOW AND BEFORE THE BANDS, in that order and not
    // in any other. The window is what the reader has set and the worklist is what they pressed,
    // so the worklist is a selection out of the window's rows: `1 of 16` on three weeks and
    // `11 of 83` on the whole term, and both denominators are on the screen.
    function reviewBands() {
      var inWin = sessionsFor(scope).filter(function (s) { return inWindow(s.date); });
      var rows = inWin.filter(gapMatch);
      return {
        all: rows,
        // What the window left before the worklist narrowed it, which is the denominator every
        // sentence on this screen quotes and the number the way off the worklist gives back.
        inWindow: inWin,
        unstaffed: rows.filter(function (s) { return s.teacher !== 'yes'; }),
        staffed: rows.filter(function (s) { return s.teacher === 'yes'; })
      };
    }

    // WHICH PROGRAMMES THE WINDOW HOLDS NOTHING OF, with what each of them is a drawing of. This
    // is the half of the card that had to be built against #122 rather than beside it: `samp` is
    // that card's own arithmetic, drawn against declared, and it decides which of two sentences
    // the row is written in rather than being printed as a badge next to one sentence.
    //
    // `before` AND `after` ARE THE DRAWN ROWS AND NOTHING ELSE. The date a programme last ran is
    // the last of its sessions these documents carry before the window, which on a sampled
    // programme is the last one DRAWN and is said in those words. A row that reported the model's
    // declared total as though the sheet had seen it would be inventing a date.
    //
    // ISSUE 125. WITH A WORKLIST ON, "ABSENT" MEANS ABSENT FROM THE WORKLIST, and that is the case
    // #122 has to be read against a second time. A programme can be missing from this screen for
    // two different reasons now: it has nothing in the window at all, or it has rows in the window
    // and none of them carries the gap. The second reads as good news and on five of the seven
    // drawings it is a property of a document that drew six sessions of seventy nine, so it is
    // counted over the DRAWN rows, says the word `drawn`, and carries the fraction beside it.
    //
    // ISSUE 146 GAVE IT AN ARGUMENT AND THE GRIDS ARE WHY. A grid draws every session in the scope
    // and marks the window; it never filters, and since #125 it cannot carry a worklist at all. So
    // when the note under a grid asks this function which programmes have nothing to show, the
    // question is about the window and about nothing else, and a row worded "all three of its
    // sessions in this window record a teacher" would be describing a filter those cells do not
    // obey. `plain` travels with the row rather than being read off `gapField` at the other end,
    // because the two callers are asking two different questions and the answer must say which.
    function reviewAbsent(ignoreGap) {
      var r = winRange();
      var out = [];
      groupsFor(scope).forEach(function (g) {
        var rs = sessionsFor(g.view);
        var i, before = null, after = null, held = 0, hit = 0;
        for (i = 0; i < rs.length; i++) {
          if (inWindow(rs[i].date)) {
            held++;
            if (ignoreGap || gapMatch(rs[i])) hit++;
            continue;
          }
          if (!r) continue;
          if (rs[i].date < r.from) before = rs[i].date;     // rs is in date order, so the last wins
          else if (rs[i].date > r.to && !after) after = rs[i].date;
        }
        if (hit) return;                                    // it is on the screen, so not absent
        out.push({ view: g.view, samp: sampleOf(g.view, 'CohortSession'),
                   before: before, after: after, drawn: rs.length, held: held,
                   plain: !!ignoreGap });
      });
      return out;
    }

    // THE SENTENCE, AND THE WHOLE CARD IS THAT THERE ARE TWO OF THEM. On Z-SC and Z-BL the drawn
    // rows are the term, so "no session in this window" is a fact about the business. On the other
    // five it is a fact about a document that holds 6 of 79, and it is written as one: the words
    // say `drawn`, the fraction #122 settled is beside it, and the count of what is not here is
    // spelled out rather than left for a reader to subtract. Neither sentence says anything about
    // the standing of the content, which is #110's rule and is why this reads as arithmetic.
    //
    // ISSUE 125 ADDED THE THIRD, and it is the same sentence with the same rule applied to a
    // different absence. A programme whose rows in the window all record the field says so over
    // the DRAWN rows, because "everything here is staffed" read off six sessions of seventy nine
    // is the sample confusion in its most flattering direction and is the one a manager would
    // most like to believe.
    function absentWords(a) {
      var noun = a.samp.complete ? 'session' : 'drawn session';
      var bits = [];
      // `a.plain` is issue 146's: a row built for a grid answers about the window and never about
      // a worklist, whether or not one is set anywhere else on the sheet.
      if (gapField && !a.plain && a.held) {
        bits.push(a.held === 1
          ? 'its one ' + noun + ' in this window records a ' + gapField
          : 'all ' + a.held + ' of its ' + noun + 's in this window record a ' + gapField);
      } else {
        bits.push(a.samp.complete ? 'no session in this window'
                                  : 'no drawn session in this window');
      }
      var sw = sampleWords(a.samp, 'session');
      if (sw) {
        bits.push(a.samp.complete ? sw
                : sw + ', so ' + (a.samp.total - a.samp.drawn) + ' are not drawn here');
      }
      if (!(gapField && !a.plain && a.held)) {
        bits.push(a.before ? 'last ' + noun + ' ' + longDate(a.before)
                : a.after ? 'next ' + noun + ' ' + longDate(a.after)
                : 'no ' + noun + ' anywhere in the term');
      }
      return bits.join(' · ');
    }

    // What the screen says when the worklist itself is empty: the window holds rows and not one of
    // them carries the gap. Written like absentWords() above and for its reason, over the drawn
    // rows and in the drawn rows' words, because a page that answered "nothing to do" off a sample
    // would be manufacturing the most welcome sentence it can print.
    function gapEmptyText(held) {
      var samp = sampleOf(scope, 'CohortSession');
      var noun = samp.complete ? 'session' : 'drawn session';
      var bits = [held === 1
        ? 'The one ' + noun + ' in this window records a ' + gapField
        : 'All ' + held + ' ' + noun + 's in this window record a ' + gapField];
      var sw = sampleWords(samp, 'session');
      if (sw) {
        bits.push(samp.complete ? sw
                : sw + ', so ' + (samp.total - samp.drawn) + ' are not drawn here');
      }
      return bits.join(' · ');
    }

    // The way from a row to the drawing it came from, WITH THE WINDOW STILL ON. The window belongs
    // to the page rather than to this sheet, which is #90's decision, so following one of these
    // leaves it exactly where it is and the reader arrives at that programme's picture showing the
    // same three weeks the row was in. Nothing here has to carry the window on the address for
    // that to be true, and a link that did would be a second place for the window to live.
    function progLink(code, label, route) {
      var a = el('a', 'linkbtn', code);
      a.href = route;
      a.title = 'the ' + (label || code) + ' drawing, at this same window';
      return a;
    }

    function buildReview() {
      var cols = ['date', 'time', 'programme', 'session', 'instructor', 'state', 'attendance',
                  'drawn as'];
      var table = el('table', 'sheet-table term-table');
      head(table, cols);
      var tb = document.createElement('tbody');
      var bands = reviewBands();
      var n = bands.all.length;

      // One row, drawn the same way whichever band it is under, because the bands are a ranking
      // and a ranking may not change what a row says.
      function reviewRow(s) {
        var tr = document.createElement('tr');
        if (s.teacher !== 'yes') tr.className = 'term-gap';
        cell(tr, s.date, 'r-id');
        cell(tr, s.time, 'r-id');
        var td = el('td', 'r-id s-prog');
        td.appendChild(progLink(s.code, s.label, s.route));
        tr.appendChild(td);
        cell(tr, s.title, 'r-name');
        cell(tr, s.teacher === 'yes' ? 'named' : 'none named',
             's-teacher' + (s.teacher === 'yes' ? ' r-state' : ' term-gap-cell'));
        cell(tr, s.state, 'r-state');
        cell(tr, s.attendance, 'r-num');
        cell(tr, s.id, 'r-drawn');
        tb.appendChild(tr);
      }

      if (!n) {
        // Issue 125. Two ways to be empty and they are different findings: the window holds no row
        // at all, which is #119's sentence and unchanged, or it holds rows and none of them is on
        // the worklist, which is this card's and is said over the drawn rows.
        groupRow(tb, cols.length, function (th) {
          th.textContent = (gapField && bands.inWindow.length)
            ? gapEmptyText(bands.inWindow.length) : windowEmptyText(scope);
        });
      } else if (gapField) {
        // ONE BAND AND NOT TWO WHILE A WORKLIST IS ON. The review ranks by what the meeting acts
        // on; a worklist IS that thing, so every row is in the first band and a second band
        // reading "none of the 11" is a heading over nothing. The count and its denominator stay,
        // because the denominator is what the way off this filter gives back.
        groupRow(tb, cols.length, function (th) {
          th.textContent = 'No ' + gapField + ' recorded · ' + n + ' of ' +
            bands.inWindow.length + ' in this window';
        }, 'term-group rev-band');
        bands.all.forEach(reviewRow);
      } else {
        [{ rows: bands.unstaffed, lead: 'Nobody named to teach these' },
         { rows: bands.staffed, lead: 'Instructor named' }].forEach(function (band) {
          groupRow(tb, cols.length, function (th) {
            th.textContent = band.lead + ' · ' +
              (band.rows.length ? band.rows.length + ' of ' + n : 'none of the ' + n) +
              ' in this window';
          }, 'term-group rev-band');
          band.rows.forEach(reviewRow);
        });
      }

      var absent = reviewAbsent();
      // Issue 125. AND NOT WHEN THE BAND WOULD BE THE SENTENCE ABOVE IT AGAIN. On a worklist over
      // one programme that holds nothing, the empty row already says how many of its drawn rows
      // record the field and out of how much of the term they were drawn; a band of one repeating
      // it word for word is the same finding printed twice, which is what issues 91 and 93 spent
      // a card taking off this sheet. The unfiltered case keeps its band, because there the row
      // carries what the empty sentence does not: when that programme last ran.
      if (absent.length && !(gapField && !n && groupsFor(scope).length === 1)) {
        groupRow(tb, cols.length, function (th) {
          th.textContent = (gapField ? 'Nothing on this worklist · ' : 'Nothing in this window · ') +
            absent.length + ' of the ' + groupsFor(scope).length +
            (groupsFor(scope).length === 1 ? ' programme' : ' programmes');
        }, 'term-group rev-head');
        absent.forEach(function (a) {
          groupRow(tb, cols.length, function (th) {
            th.appendChild(progLink(a.view.code, a.view.label, a.view.route));
            th.appendChild(document.createTextNode(' · ' + absentWords(a)));
          }, 'term-group rev-absent');
        });
      }

      table.appendChild(tb);
      return table;
    }

    function buildCalendar() {
      var cols = ['date', 'time', 'programme', 'session', 'instructor', 'state', 'attendance',
                  'drawn as'];
      var table = el('table', 'sheet-table term-table');
      head(table, cols);
      var tb = document.createElement('tbody');
      var month = null;
      // Issue 90. THE LIST IS THE SHAPE THAT FILTERS, and the reason is the use the card names:
      // "checking the next 1-3 weeks to discuss with the team". Ten rows is an agenda and 83 is a
      // document nobody reads in a meeting. The grids and the drawing do the opposite and keep
      // everything, because what they are for is the shape of the whole term.
      var rows = sessionsFor(scope).filter(function (s) { return inWindow(s.date); });
      if (!rows.length) {
        // Issue 119. The sentence is windowEmptyText()'s and not this line's any more, because the
        // canvas prints it too and two copies of it are two sentences waiting to disagree.
        // Issue 167. Over the rows THIS list is showing, which is the sheet's scope and not the
        // drawing's: the two are one set on every address that names a programme and can differ
        // on `#/calendar`, where the sheet holds all seven over a drawing of one.
        groupRow(tb, cols.length, function (th) {
          th.textContent = windowEmptyText(scope);
        });
      }
      rows.forEach(function (s) {
        var m = s.date.slice(0, 7);
        if (m !== month) {
          month = m;
          var n = rows.filter(function (x) { return x.date.slice(0, 7) === m; }).length;
          groupRow(tb, cols.length, function (th) {
            var mi = Number(m.slice(5, 7)) - 1;
            th.textContent = (MONTHS[mi] || m) + ' ' + m.slice(0, 4) + ' · ' + n +
              (n === 1 ? ' session' : ' sessions');
          });
        }
        var tr = document.createElement('tr');
        // The gap is the reason an operator opens a calendar, so it is marked on the row and not
        // only counted in the subtitle above.
        if (s.teacher !== 'yes') tr.className = 'term-gap';
        cell(tr, s.date, 'r-id');
        cell(tr, s.time, 'r-id');
        cell(tr, s.code, 'r-id');
        cell(tr, s.title, 'r-name');
        cell(tr, s.teacher === 'yes' ? 'named' : 'none named',
             's-teacher' + (s.teacher === 'yes' ? ' r-state' : ' term-gap-cell'));
        cell(tr, s.state, 'r-state');
        cell(tr, s.attendance, 'r-num');
        cell(tr, s.id, 'r-drawn');
        tb.appendChild(tr);
      });
      table.appendChild(tb);
      return table;
    }

    function buildOutline() {
      // `syllabus` and not `in the syllabus`, because a column is as wide as the widest thing in
      // it and the header was the widest thing in this one: the long form cost 1168px of table in
      // a 1098px box at 1536, which is the whole outline scrolling sideways for a heading.
      var cols = ['syllabus', 'template', 'title', 'delivery', 'location', 'minutes',
                  'deliveries', 'delivered', 'drawn as'];
      var table = el('table', 'sheet-table term-table');
      head(table, cols);
      var tb = document.createElement('tbody');
      // ---- the outline as a numbered document, issue 148 -------------------------
      // "Make the format of this outlines more in line with the style" and, in the card,
      // numbering, bullets and header levels. This is where the outline stops being a flat list.
      //
      // EVERY NUMBER HERE IS AN INDEX INTO THE MODEL AND NOT A STRING ANYWHERE. The three levels
      // are the three the model already has, in the order the model already puts them in: the
      // programme is its position in `groupsFor(scope)`, the module its position in
      // `modulesOf(g)`, and the block its position in `mod.rows`. Nothing is typed, nothing is
      // stored, and a programme added, a module renamed or a row moved renumbers the whole
      // document with no edit here, in exactly the way router.js derives the programme hue from
      // the programme list rather than choosing one per programme.
      //
      // AND IT IS SCOPE RELATIVE ON PURPOSE. `#/outline/ZSC` numbers Z-SC's own modules 1.1 to
      // 1.6 rather than 2.1 to 2.6, because the document a reader has open is the one they are
      // reading: a number that referred to a programme not on screen would be an address into a
      // document nobody opened. What the number IS, on both, is the position of the thing in the
      // outline in front of the reader.
      //
      // WHERE EACH IS PAINTED, and the first of the three is a measurement rather than a taste.
      // The programme number is inside the LINK and not before it. The suite asserts that the
      // sheet's four readings start their text on one x and measures the group heading on its
      // anchor, so a number standing before the link moves the link right of every other first
      // thing on this sheet and turns issue 113's alignment red. Inside it, the anchor's own left
      // edge is where it always was and the number is the first thing painted on the row, which
      // is where a heading number belongs anyway.
      // ---- ISSUE 153, AND WHAT CAME OFF THESE TWO HEADINGS -------------------------
      // "what value does `4 rows here` add?", and the instruction with it: hunt for this kind of
      // redundant text. The rule the sweep ran on, which is measurable rather than a taste:
      //
      //   A READING MUST TELL YOU SOMETHING THE PAGE IS NOT ALREADY SHOWING YOU. A count a reader
      //   could obtain by counting what is on screen goes; a count over a population the screen
      //   does not contain stays.
      //
      // TWO THINGS WENT FROM HERE AND ONE STAYED, and the line between them is where the eye
      // stops. `· 4 rows here` sat on a module heading directly over an uninterrupted run of four
      // rows, which the reader takes in without counting; the absent-module heading's `· 2 rows`
      // is the same failure with a shorter word. `, 6 deliveries` is the sum of a column that is
      // on the screen, one number per row, which is #128's own named failure of arithmetic over a
      // picture the reader is looking at.
      //
      // `· 25 templates` STAYS, and the reason is the same rule read carefully rather than an
      // exception to it. A programme heading spans module headings and, on five of the seven, a
      // scroll: counting the rows it holds is work rather than looking. The clause after it,
      // `6 modules over all 25 sessions` and its variants, is the reading this heading exists for
      // and could never be obtained from the screen at all: the outline draws 6 module headings of
      // a syllabus that declares more, over a term of 25 sessions of which these documents drew a
      // sample.
      groupsFor(scope).forEach(function (g, gi) {
        var gNo = String(gi + 1) + '.';
        groupRow(tb, cols.length, function (th) {
          // The way back to the drawing the row came from, one per programme rather than one per
          // row: seven controls at the size this page requires, instead of 83 of them squeezed
          // into a table cell.
          var a = el('a', 'linkbtn');
          a.appendChild(el('span', 'term-no', gNo));
          a.appendChild(document.createTextNode(g.view.label || g.view.code));
          a.href = g.view.route;
          th.appendChild(a);
          th.appendChild(document.createTextNode(' · ' + g.templates.length +
            (g.templates.length === 1 ? ' template' : ' templates') +
            (g.modules ? ' · ' + g.modules : '')));
        });
        modulesOf(g).forEach(function (mod, mi) {
          var mNo = gNo + (mi + 1) + '.';
          groupRow(tb, cols.length, function (th) {
            // The number is the first span in this cell and the suite measures the module
            // heading's indent on its first span, so it is painted exactly where the module name
            // used to start and issue 94's indent claim is unmoved. The name follows it.
            th.appendChild(el('span', 'term-no', mNo));
            // ISSUE 153. The row count that stood after each of these two names is gone: a module
            // heading sits directly on top of the rows it holds, with nothing between, so the
            // count restated what the reader was already looking at. The NAME is the whole of what
            // a heading at this level has to say, and on the absent branch the name is itself the
            // finding, that the syllabus records no module for these rows at all.
            th.appendChild(mod.absent ? el('span', 'term-nomodule', mod.name)
                                      : el('span', 'term-modname', mod.name));
          }, 'term-module');
          mod.rows.forEach(function (t, ri) {
            var tr = document.createElement('tr');
            if (!t.deliveries.length) tr.className = 'term-gap';
            cell(tr, t.seqText, 'r-num s-seq');
            cell(tr, t.tcode, 'r-id');
            if (agendaFor(t)) {
              var tdt = el('td', 'r-name r-title');
              tdt.appendChild(titleControl(t));
              tr.appendChild(tdt);
            } else {
              cell(tr, t.title, 'r-name');
            }
            cell(tr, t.mode, 'r-state');
            cell(tr, t.place, 'r-state');
            cell(tr, t.duration, 'r-num');
            cell(tr, String(t.deliveries.length), 'r-num s-deliveries');
            // THE STATE GETS A SPAN AND NOT A WORD, ISSUE 135. This cell read
            // `d.date + ', ' + d.state` as one text node, so `delivered`, `confirmed` and
            // `planned` were three states of a delivery painted in one colour at one weight: a
            // distinction the model carries that the table did not. The characters are exactly
            // the ones this line already wrote, in the same order, with the same separators;
            // what is new is that the state word can be reached by a rule. app.css sets the
            // three in one direction, most settled to least, so the column reads as a gradient
            // down the term rather than as a wall of dates.
            var tdd = el('td', 'r-state s-delivered');
            if (!t.deliveries.length) {
              tdd.appendChild(document.createTextNode('none'));
            } else {
              t.deliveries.forEach(function (d, i) {
                if (i) tdd.appendChild(document.createTextNode('; '));
                tdd.appendChild(document.createTextNode(d.date + ', '));
                tdd.appendChild(el('span', 'r-settled r-settled-' + d.state, d.state));
              });
            }
            tr.appendChild(tdd);
            cell(tr, t.id, 'r-drawn');
            tb.appendChild(tr);
            if (isOpen_(t)) {
              // The third level of the numbering, and it is on the BLOCK rather than on the row.
              // The row already carries its position in the syllabus in the leading column, so a
              // second ordinal beside it would be two numbers for one place; the block is the
              // thing the numbering exists to give an address to, and it is the only part of this
              // document a reader will want to quote.
              var ag = agendaRow(cols.length, t, mNo + (ri + 1));
              if (ag) tb.appendChild(ag);
            }
          });
        });
      });
      table.appendChild(tb);
      return table;
    }

    function buildRows() {
      // The key is the reading, the scope AND whether the invented block is on, because all
      // three change which rows are in the table and a key that named only the first would leave
      // Z-SC's rows on screen under Z-IB's heading.
      // Issues 88 and 90 added two more terms to it, for the same reason the agenda is in it: the
      // shape decides which markup the rows are, and the window decides which of them are there
      // at all on the list and which are marked on the grids.
      var key = reading + '/' + scopeKey(scope) + '/' + (openParam() || '') + '/' +
                shape + '/' + (win.weeks ? win.weeks + '@' + win.anchor : '-') + '/' +
                (gapField || '-');
      if (built === key) return;
      built = key;
      rowsEl.textContent = '';
      rowsEl.appendChild(reading !== 'calendar' ? buildOutline()
                         : shape === 'review' ? buildReview()
                         : shape === 'list' ? buildCalendar() : buildGrid(shape));
      rowsEl.scrollTop = 0;
    }

    // ---- open, close, and the address ------------------------------------------
    function isOpen() { return !!sheet && !sheet.hidden; }

    function show(next, nextScope, openTo, gapTo) {
      var wasOpen = isOpen();
      if (!sheet) return;
      if (!next) {
        if (!wasOpen) return;
        reading = null;
        scope = [];
        // Issue 125. The sheet is shut, so no worklist is on. Left standing it would narrow the
        // hints the panel writes about the whole reading, which is the one place stats() is asked
        // its question without the filter.
        gapField = null;
        // Issue 112. The sheet is shut, so no row is open. Left standing, the set would reopen
        // rows on the next visit to an address that says nothing about any.
        openRows = {};
        sheet.hidden = true;
        document.body.classList.remove('calendar', 'outline');
        // BEFORE the restore below. Issue 170, and the reason is written where the function is:
        // what focus goes back to is usually inside #view-diagram, and an inert element cannot
        // take it.
        if (window.ZM && window.ZM.contain) window.ZM.contain();
        // The same tabindex guess the student list carried, and the same repair: focus it and ask
        // where focus is. Issue 170.
        if (window.ZM && window.ZM.refocus) window.ZM.refocus(returnTo);
        returnTo = null;
        // And the strip comes back to life when the reading it was inert on is closed, issue 151.
        paintBrush();
        if (onRoute) onRoute();
        return;
      }
      // Issue 112 added the third term and issue 125 the fourth, both for the same reason: the
      // state is on the address now, so an address that names the same reading and the same
      // programme and a different set of open rows, or a different worklist, is a different
      // address and the early return may not swallow it.
      if (reading === next && scopeKey(scope) === scopeKey(nextScope) &&
          openParam() === (openTo || null) && gapField === (gapTo || null)) return;
      reading = next;
      // Issue 146. The set is compared on its key above and held as the list here, because two
      // lists holding the same views are the same scope and a scope that has not moved must not
      // rebuild the rows: `scope === nextScope` was an identity test on one object and a set
      // arrives as a new array on every hashchange.
      scope = scopeList(nextScope);
      gapField = gapTo || null;
      applyOpenParam(openTo);
      // ISSUE 124. THE REVIEW OPENS ON THREE WEEKS, and this is where "opens" is: an address the
      // reader followed, not a control they pressed. It runs before the rows are built so the
      // sheet is drawn once, and the drawing and the header control are told afterwards, in the
      // order #111 made load bearing: the control quotes what the window did to the picture, so it
      // may not restate before render.js has been told.
      //
      // AND A WORKLIST TAKES IT OFF, issue 125, which is the same rule and not an exception to it.
      // #124 wrote that the three weeks apply where the reader has said nothing and step aside the
      // moment they do. A `?gap=` address is the reader having said something: it names a set that
      // was counted over the window in force when they pressed it, so arming a default here would
      // hand them eleven on the control and one on the screen. The window they had is the window
      // they get.
      //
      // AND IT STAYS ANSWERED WHEN THEY LEAVE THE WORKLIST, which is the half of this that was
      // found by trying it: the way off the filter offers `all 83 sessions` and, without this
      // line, re-armed the default on the way and delivered eleven. A control may not name a
      // number and hand over a different one.
      //
      // THE TWO LINES BELOW ARE ONE RULE GUARDED TWICE, AND THAT IS SAID HERE RATHER THAN IMPLIED,
      // because issue 125's plant proofs measured it: `winTouched` is set before `armed` is worked
      // out and armReview() refuses on `winTouched`, so deleting the `!gapField` conjunct alone
      // changes nothing this suite or a reader can see. The pair is kept because they answer
      // different questions and each reads correctly on its own line, the first that a worklist
      // address is not a state to arm a default over and the second that leaving one does not
      // re-open the question; what may not stand is a comment claiming the conjunct is carrying the
      // arrival by itself. The defect this rule exists against needs both lines gone, and that is
      // the plant `the worklist` fires its window assertion with.
      if (gapField) winTouched = true;
      // ISSUE 146. AND A WORKLIST ADDRESS PUTS THE SHEET ON THE SHAPE THAT DRAWS A WORKLIST, which
      // is #125's own rule arriving by the door it left open. That card wrote that leaving the
      // review leaves the worklist, because the grids keep every session and mark the window and a
      // filter on top of one of them would be a state the sheet held and did not draw, and it took
      // the filter off at the press of a shape button. An ADDRESS could still put one on: a reader
      // sitting on the month grid who pressed a row of the header's gaps menu arrived at
      // `#/calendar?gap=` with the grid still up, so the sheet carried a filter that its own
      // picture ignored. Issue 146 met it from the other side, because the note under a grid is
      // built out of the review's absence sentences and those sentences would have described a
      // filter the cells do not obey. The reader asked for the worklist; the review is the
      // worklist, and it is one press back to any other shape.
      if (gapField && reading === 'calendar' && shape !== 'review') shape = 'review';
      var armed = reading === 'calendar' && shape === 'review' && !gapField && armReview();
      buildRows();
      describe();
      document.body.classList.toggle('calendar', reading === 'calendar');
      document.body.classList.toggle('outline', reading === 'outline');
      // ISSUE 151. The strip says whether it is in effect, and that answer changes with the
      // READING and not only with the window, so it is restated on every route through here:
      // opening the outline, switching to it from the calendar, and switching back. Restating it
      // only where a window moves would leave a live-looking control on the outline for any reader
      // who arrived without touching one, which is most of them.
      paintBrush();
      if (!wasOpen) {
        returnTo = document.activeElement;
        sheet.hidden = false;
        // Issue 170. Before the close button takes focus, so the two live regions while this
        // sheet is up are the header and this sheet.
        if (window.ZM && window.ZM.contain) window.ZM.contain();
        var close = document.getElementById('termclose');
        if (close && close.focus) close.focus();
      }
      if (armed) {
        if (onWindow) onWindow(windowSpec());
        restateWindow();
      }
      if (onRoute) onRoute();
    }

    // Closing replaces the entry rather than pushing another, for the reason the student list
    // does: the entry being left is the sheet, so the back button goes to whatever the reader was
    // on before they opened it rather than back into what they just closed.
    //
    // AND WHAT IT REPLACES IT WITH IS THE DRAWING UNDERNEATH, ISSUE 138. It wrote `#/`, which meant
    // nothing on a hashchange, so the drawing stayed where it was and the address stopped describing
    // it. Now that `#/` is the union, the sheet closing on a reader who had narrowed to Z-SC would
    // leave them holding an address that gives all seven the moment it is reloaded or sent to
    // somebody. router.js is asked for the address instead; the fallback is `#/`, which is what this
    // sheet can honestly say when nothing has told it what is behind it.
    function close() {
      if (readAddress(location.hash)) {
        var back = (backRoute && backRoute()) || '#/';
        try {
          history.replaceState(null, '', location.pathname + location.search + back);
        } catch (err) {
          location.hash = back;     // a file:// URL, where replaceState throws
        }
      }
      show(null);
    }

    function route() {
      var a = readAddress(location.hash);
      show(a ? a.reading : null, a ? a.scope : null, a ? a.open : null, a ? a.gap : null);
    }

    if (sheet) {
      document.getElementById('termclose').addEventListener('click', close);
      document.getElementById('termback').addEventListener('click', close);
      // Escape in the capture phase, ahead of the bubble listener in selection.js that clears the
      // selection: a reader who opens this from a node and changes their mind must not also lose
      // the node they had open behind it. Capture mode is left alone for the reason the student
      // list and the programme menu leave it alone, that Escape is how a reader gets out of it.
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || !isOpen()) return;
        if (document.body.classList.contains('fb-mode')) return;
        e.preventDefault();
        e.stopPropagation();
        close();
      }, true);
      window.addEventListener('hashchange', route);
    }

    // ---- the way in, which is the node --------------------------------------
    // Both cards were filed from a node: one from a cohort session, asking for the calendar, and
    // one with a template selected, asking for the outline. So the way through is in the panel
    // that describes the node, which is where the reader already is, and not a sixth item in a
    // header row that #77 has just measured and rebuilt. The panel asks; this answers for the two
    // types it knows and returns nothing for the rest.
    // ISSUE 84 SCOPED IT. The link used to go to all seven, which was the whole of what the card
    // objected to: a reader looking at a Z-SC template and asking for its outline was shown
    // eighty three rows across seven syllabi. The programme is found by looking the node up in
    // the rows already collected rather than by asking which drawing is on screen, because the
    // two can differ: the sheet does not close when the programme behind it changes.
    function viewOf(id) {
      for (var i = 0; i < byProgramme.length; i++) {
        var g = byProgramme[i], j;
        for (j = 0; j < g.templates.length; j++) if (g.templates[j].id === id) return g;
      }
      for (var k = 0; k < sessions.length; k++) {
        if (sessions[k].id === id) {
          for (var m = 0; m < byProgramme.length; m++) {
            if (byProgramme[m].view.code === sessions[k].code) return byProgramme[m];
          }
        }
      }
      return null;
    }

    function linkFor(n) {
      if (!n) return null;
      var g = viewOf(n.id);
      var sc = g ? g.view : null;
      var st = stats(sc);
      var where = sc ? (sc.label || sc.code) : 'the seven drawings';
      // Issue 122. THE SAME CLAUSE THE SHEET CARRIES AND NOT A SECOND WORDING OF IT. These two
      // hints closed with "drawn from a term the model counts at N", which is the shape the sheet
      // has just stopped using because it printed a complete scope and a sample identically. A
      // second copy of a fact in the wording the first copy was corrected out of is the state this
      // repository calls drift, so both read sampleWords().
      if (n.type === 'CohortSession') {
        return {
          href: addressFor('calendar', sc),
          text: 'see the term, all ' + st.sessions.length + ' sessions',
          hint: 'every session on ' + where + ', in date order, ' +
                (sampleWords(sampleOf(sc, 'CohortSession'), 'session') || '') + '. ' +
                st.noInstructor + ' have no instructor. All ' + VIEWS.length +
                ' programmes at once is one click away inside.'
        };
      }
      if (n.type === 'SessionTemplate') {
        return {
          href: addressFor('outline', sc),
          text: 'see the outline, all ' + st.templates.length + ' session templates',
          hint: 'every template on ' + where + ', grouped by the module its syllabus puts it ' +
                'in and in syllabus order, ' +
                (sampleWords(sampleOf(sc, 'SessionTemplate'), 'session template') || '') + '.'
        };
      }
      return null;
    }

    // Issue 84. What the lane caption over the session templates and the lane caption over the
    // cohort sessions open, and null for every other lane. It answers off the lane's NAME, which
    // the build ships on the geometry, and never off the caption's text: the caption is computed
    // from the view's counts and has three alternates, so matching its words would be matching a
    // string that changes.
    var CAP_LANE = { templates: 'outline', sessions: 'calendar' };

    function capLink(bandKey, view) {
      var rd = CAP_LANE[bandKey];
      if (!rd) return null;
      var st = stats(view || null);
      return {
        href: addressFor(rd, view || null),
        label: rd === 'outline'
          ? 'the outline of this lane: all ' + st.templates.length +
            ' session templates, grouped by module'
          : 'the calendar of this lane: all ' + st.sessions.length + ' sessions, in date order'
      };
    }

    return {
      start: function () {
        // The strip says what the window is before anybody has pressed anything, which is issue
        // 90's rule that the anchor must be visible, restated for a control whose whole face is
        // the answer.
        paintBrush();
        route();
      },
      linkFor: linkFor,
      // Issue 132. The panel shows a session template's own beats, and the beats are read HERE
      // rather than a second time out of the instance document: this file is already the one
      // reader of the agenda block, `agendaFor` is already the accessor the sheet uses, and it
      // keys off nothing but `t.id`, so the node the panel holds is a valid argument as it stands.
      // A second lookup in app.js would be a second place one dictionary is read from, which is
      // the shape this repository calls drift.
      agendaFor: agendaFor,
      capLink: capLink,
      isOpen: isOpen,
      // Issue 125. The address of one worklist, built by the same function that builds every other
      // address this module answers. app.js has the count and this has the route, which is the
      // split every other seam on this page already runs on.
      gapAddress: gapAddress,
      // Which fields this reading can be a worklist for, so the header's menu asks rather than
      // keeping a second list of them. A row the sheet cannot answer for is not offered as a
      // control, which is the difference between a menu that navigates and a menu that gambles.
      gapFields: function () { return GAP_FIELDS; },
      // Built by the one function that builds every address this module answers, so a driver
      // enumerating them is enumerating what the page will answer and not a second list.
      routes: (function () {
        var out = [];
        ['calendar', 'outline'].forEach(function (rd) {
          out.push(addressFor(rd, null));
          VIEWS.forEach(function (v) { out.push(addressFor(rd, v)); });
        });
        return out;
      })(),
      // What a driver is told, for the reason window.ZT publishes the view and the theme: whether
      // a table holds the rows it claims is a question that should be answered off the running
      // page rather than inferred from a screenshot of 83 rows.
      state: function () {
        var st = stats(scope, false, !!gapField);
        return {
          open: isOpen(),
          reading: reading,
          // Issue 146. The set as the address spells it, and null where the address names none:
          // `ZSC` on one programme, which is what this field has said since #84 and what every
          // assertion written against it reads, and `ZIB+ZSC` on a set of two.
          scope: scopeKey(scope) || null,
          // AND THE SAME ANSWER AS A LIST, because a driver that has to split a string on a
          // separator is a driver keeping a second copy of this module's spelling rules. Every
          // programme the reading is over, in the build's order, all seven of them included where
          // the address names none.
          scopeKeys: (isAll(scope) ? VIEWS : scope).map(function (v) { return v.key; }),
          // Issue 125. Which worklist the rows are, off the running page, so a driver can check
          // that the number the header's menu offered and the rows this sheet drew are the same
          // set instead of taking the sheet's word for both.
          gap: gapField,
          // Issue 112. Still the same question, that every row in scope has its outline open, and
          // now derived from the per row state instead of being a boolean somebody set. Beside it
          // the two the card adds: how many rows are open, and the address's own parameter, so a
          // driver can read the state and the address that carries it off the running page.
          agenda: allOpen(),
          agendaOpen: openCount(),
          agendaParam: openParam(),
          // Issue 108. This used to be the length of one constant list, because there was one
          // list and every row drew it. There are 83 lists now, of three or four, so the number
          // a driver needs is the total the MODEL holds for the templates in scope: a page that
          // drew the same block under every row would report a total the model does not hold,
          // which is the assertion the old equality can no longer make.
          agendaLines: st.templates.reduce(function (n, t) {
            var rows = agendaFor(t);
            return n + (rows ? rows.length : 0);
          }, 0),
          // And how many DIFFERENT blocks those templates carry, which is the claim the smoke
          // suite needs and cannot compute from a count of lines alone.
          agendaBlocks: (function () {
            var seen = {};
            st.templates.forEach(function (t) {
              var rows = agendaFor(t);
              if (rows) {
                seen[JSON.stringify(rows.map(function (r) {
                  return [r.k, r.v];
                }))] = 1;
              }
            });
            return Object.keys(seen).length;
          })(),
          // AND THE TWO PROVENANCE FIELDS OFF THOSE ROWS, AS THE SET OF TOKENS PRESENT rather
          // than as a count of what is wrong with them. They stopped being drawn under issue
          // 108 and a field a driver cannot see is a field that rots: the model still refuses a
          // rank or a flag these rows have not earned, and this is how a driver reads that off
          // the running page now that the badge is gone. The SET and not a count, so that the
          // vocabulary lives in the model and in the assertion and not a third time here: this
          // file reports which tokens are present and takes no view on which are allowed.
          agendaFlags: (function () {
            var seen = {};
            st.templates.forEach(function (t) {
              (agendaFor(t) || []).forEach(function (r) { seen[r.f] = 1; });
            });
            return Object.keys(seen).sort();
          })(),
          agendaRanks: (function () {
            var seen = {};
            st.templates.forEach(function (t) {
              (agendaFor(t) || []).forEach(function (r) { seen[r.r] = 1; });
            });
            return Object.keys(seen).sort();
          })(),
          // What is on screen right now, which is what a driver asserting the table is asking
          // about. The totals across all seven are beside them and keep their old names, so an
          // assertion written before this card still reads the number it was written against.
          sessions: st.sessions.length,
          sessionsTotal: st.totalSessions,
          templates: st.templates.length,
          templatesTotal: st.totalTemplates,
          allSessions: ALL.sessions.length,
          allTemplates: ALL.templates.length,
          programmes: st.programmes,
          noInstructor: st.noInstructor,
          noRecording: st.noRecording,
          maxDeliveries: st.maxDeliveries,
          modules: reading === 'outline'
            ? groupsFor(scope).reduce(function (n, g) { return n + modulesOf(g).length; }, 0)
            : 0,
          from: st.from,
          to: st.to,
          // Issue 88. Which of the three shapes the rows on screen are, and how many panels the
          // grid drew, so a driver asserting a month grid is reading the page's own answer rather
          // than counting sections and hoping they are the panels.
          shape: shape,
          panels: rowsEl ? rowsEl.querySelectorAll('.cal-panel').length : 0,
          // Issue 90. Everything about the window, including the two numbers that are the reason
          // the anchor exists at all: the reader's own day and how many sessions are on or after
          // it. A driver that could only read the window would not be able to tell an honest
          // anchor from a page quietly calling the anchor today.
          window: windowState()
        };
      },
      // Issue 98. What the reading on screen lists and whether the window applies to it, or null
      // when the sheet is shut and the diagram is the view. Asked for rather than decided
      // elsewhere, which is the shape linkFor and capLink already have: the header asks what this
      // reading is about and this file answers, so the two types and the window split stay written
      // down once.
      // ISSUE 125 ADDED THE THIRD FIELD, and it is here for the reason the other two are: the
      // header's count is a count of what the view is SHOWING, and while a worklist is on the
      // reading is showing eleven rows and not eighty three. Without it the control would say 83
      // over a screen of 11, which is #121's defect with the numbers the other way round.
      readingRows: function () {
        var rd = (reading && READING[reading]) || null;
        return rd ? { type: rd.type, window: rd.window, gap: gapField } : null;
      },
      // Read by app.js on the first paint, so a drawing is dimmed from the start if a window is
      // ever on before the sheet has been opened.
      windowSpec: windowSpec,
      windowState: windowState,
      // Issue 111. Called by app.js after anything that changes the drawing without changing the
      // window, because the control now quotes a number about the drawing.
      restateWindow: restateWindow,
      // ---- what a driver reads off the strip, issue 137 ------------------------
      // READ OFF THE PAINTED ELEMENTS AND NOT OFF THE STATE THEY WERE PAINTED FROM, which is the
      // whole reason it is worth publishing at all. `start` and `span` are the window and are
      // already in term().window; what is here is the strip as pixels: where the band actually is,
      // how tall each column actually is, where the label actually landed and whether it is on the
      // band or beside it. An assertion built on the state would pass on a strip that painted
      // nothing, which is the failure mode a control drawn out of numbers has.
      //
      // A COLUMN'S HEIGHT IS A PER CENT AND NOT A PIXEL. The strip is 26 CSS px tall at every
      // width and the columns are a fraction of the tallest week, so the per cent is the claim and
      // the pixel is a rounding of it. A driver recomputing the fractions out of window.GI is then
      // comparing two numbers of the same kind.
      brushState: function () {
        if (!brushEl || !TERM) return null;
        function box(e) {
          if (!e) return null;
          var r = e.getBoundingClientRect();
          return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2),
                   h: +r.height.toFixed(2), r: +r.right.toFixed(2), b: +r.bottom.toFixed(2) };
        }
        var wks = stripWeeks();
        return {
          on: !!brushEl.getBoundingClientRect().width,
          start: bandStart(), span: bandSpan(), weeks: win.weeks, termWeeks: TERM.weeks,
          scope: stripScope().map(function (v) { return v.code; }),
          // The population the strip is over, named beside the strip, because a column that cannot
          // hold the 177 sessions no document dates is a column whose denominator has to be said.
          drawn: sessionsInScope(stripScope()).length,
          box: box(brushEl), track: box(brushTrack), band: box(brushBand),
          caps: { left: box(brushCapL), right: box(brushCapR),
                  leftOff: /brush-cap-off/.test(brushCapL.className),
                  rightOff: /brush-cap-off/.test(brushCapR.className) },
          // The value slot, and the two things a driver has to be able to check about it after
          // issue 142: what it says, and that its box is outside the track rather than over it.
          // `inside` is gone with the branch it reported. What replaces it is the claim that the
          // old arrangement could not make at all, which is that no part of the value is ever
          // painted over a column.
          value: { text: brushValFrom.textContent + ' to ' + brushValTo.textContent,
                   from: brushValFrom.textContent, to: brushValTo.textContent,
                   box: box(brushVal), width: brushVal.style.width },
          // A week of the track in pixels, so a driver reads the sizing rule off the page rather
          // than dividing two numbers it also read off the page. Issues 142 and 143.
          week: +(brushTrack.getBoundingClientRect().width / TERM.weeks).toFixed(3),
          // Whether a change has been made that the page has not drawn yet. Issue 145: the rebuild
          // is coalesced to one animation frame, so a driver that read the strip the instant a
          // gesture landed would be reading the frame before it. Both answers are answers, which
          // is what makes this waitable without the wait encoding its own assertion.
          pending: pendingWindow(),
          // How many times the drawing has been rebuilt since the page loaded, which is what makes
          // "several week crossings in one frame cost one rebuild" a claim about the page rather
          // than about a stopwatch.
          rebuilds: opts.rebuilds ? opts.rebuilds() : null,
          now: !brushNow.hidden,
          focused: document.activeElement === brushEl,
          valuenow: Number(brushEl.getAttribute('aria-valuenow')),
          valuemax: Number(brushEl.getAttribute('aria-valuemax')),
          valuetext: brushEl.getAttribute('aria-valuetext'),
          columns: brushCols.map(function (c, i) {
            var all = c.firstChild, rec = all.nextSibling;
            return { monday: wks[i] ? wks[i].monday : null,
                     all: parseFloat(all.style.height) || 0,
                     rec: parseFloat(rec.style.height) || 0,
                     box: box(c) };
          })
        };
      },
    };
  };
})();
