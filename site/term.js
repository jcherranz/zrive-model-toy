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
  ZM.term = function createTerm(opts) {
    var VIEWS = opts.views || [];
    var AGENDA = opts.agenda || null;
    var onRoute = opts.onRoute;
    var windowEffect = opts.windowEffect;

    var sheet = document.getElementById('term');
    var titleEl = document.getElementById('termtitle');
    var subEl = document.getElementById('termsub');
    var noticeEl = document.getElementById('termnotice');
    var rowsEl = document.getElementById('termrows');
    var calBtn = document.getElementById('termcal');
    var outBtn = document.getElementById('termout');

    var reading = null;         // 'calendar', 'outline', or null when the sheet is shut
    var scope = null;           // one view, or null for all seven
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
    function groupsFor(sc) {
      if (!sc) return byProgramme;
      return byProgramme.filter(function (g) { return g.view === sc; });
    }

    function sessionsFor(sc) {
      if (!sc) return sessions;
      return sessions.filter(function (s) { return s.code === sc.code; });
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
    function windowEmptyText() {
      return 'No session in ' + windowText() + '.';
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
      return {
        from: r.from, to: r.to, weeks: win.weeks, text: windowText(),
        // Issue 119. What the drawing prints when this predicate leaves it with nothing, written
        // by the module that owns the window and identical to the sentence the list prints in the
        // same state. render.js decides WHERE it goes and never what it says.
        empty: windowEmptyText(),
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
    var brushTrack = null, brushBand = null, brushLabel = null, brushCols = [];
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
    function stripScope() {
      if (isOpen() && scope) return [scope];
      var sc = opts.drawnScope ? opts.drawnScope() : null;
      return (sc && sc.length) ? sc : VIEWS;
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
      brushCapL = el('span', 'brush-cap brush-cap-l', '‹');
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
      brushLabel = el('span', 'brush-label');
      brushTrack.appendChild(brushLabel);
      brushEl.appendChild(brushTrack);
      brushCapR = el('span', 'brush-cap brush-cap-r', '›');
      brushEl.appendChild(brushCapR);
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

    // WHERE THE LABEL GOES, AND IT IS ARITHMETIC RATHER THAN A PREFERENCE. The band is the
    // window's width as a fraction of the term, so three weeks of twenty four is an eighth of the
    // track: 42 CSS px at the strip's designed width against about 78 for `24 Feb to 16 Mar`. A
    // label forced inside would be clipped, and a label painted over the band regardless would
    // cover eight weeks of the density the strip exists to show. So it sits on the band while the
    // band can hold it and steps to whichever side has room while it cannot, which is what a
    // progress bar's own figure does and is one comparison of two measured widths.
    //
    // THIS IS THE ONE PLACE THE DESIGN'S SKETCH COULD NOT BE FOLLOWED AS DRAWN. That sketch gives
    // the strip a full width row of its own, where twenty four weeks are sixty pixels each and
    // three of them hold the label comfortably. This header is one row at every width from 1536
    // down to 981 and this card was told to keep it that way, so the strip is 380 and the label
    // goes where it fits.
    function placeLabel() {
      if (!brushLabel || !brushBand || !brushTrack) return;
      var tw = brushTrack.clientWidth;
      var bl = brushBand.offsetLeft, bw = brushBand.offsetWidth;
      var lw = brushLabel.offsetWidth;
      var inside = lw + 6 <= bw;
      var x;
      if (inside) x = bl + (bw - lw) / 2;
      else if (bl + bw + 2 + lw <= tw) x = bl + bw + 2;
      else if (bl - 2 - lw >= 0) x = bl - 2 - lw;
      else x = Math.max(0, Math.min(tw - lw, bl + (bw - lw) / 2));
      brushLabel.className = 'brush-label' + (inside ? '' : ' brush-label-out');
      brushLabel.style.left = Math.round(x) + 'px';
    }

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
      brushLabel.textContent = bandWords();
      placeLabel();
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
      brushEl.setAttribute('aria-valuetext',
        (span === 1 ? 'one week' : span + ' weeks') + ', ' + bandWords() + ', ' +
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
    function windowChanged() {
      built = null;
      if (reading) { buildRows(); describe(); }
      if (onWindow) onWindow(windowSpec());
      restateWindow();
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
    // A BAND TOO NARROW TO HOLD TWO HANDLES IS ALL MOVE. Below three handle widths the two resize
    // zones would meet in the middle and a reader aiming at the band would resize it instead. The
    // way to widen a narrow band is then the keyboard or an end of a wider one, and the caps and
    // the arrows are unaffected either way.
    var HANDLE = 8;
    var drag = null;

    function trackGeom() {
      var r = brushTrack.getBoundingClientRect();
      return { x: r.left, w: r.width, cw: r.width / TERM.weeks };
    }

    function weekAtX(x) {
      var g = trackGeom();
      if (!g.cw) return 0;
      return Math.max(0, Math.min(TERM.weeks - 1, Math.floor((x - g.x) / g.cw)));
    }

    function centreOn(week, span) {
      return week - Math.floor((span - 1) / 2);
    }

    function brushDown(e) {
      if (!TERM || !brushTrack || e.button > 0) return;
      var g = trackGeom(), x = e.clientX;
      var start = bandStart(), span = bandSpan();
      if (x < g.x) { stepAnchor(-1); return; }
      if (x > g.x + g.w) { stepAnchor(1); return; }
      var bx = g.x + start * g.cw, bw = span * g.cw;
      var mode;
      if (bw >= HANDLE * 3 && x >= bx - HANDLE / 2 && x <= bx + HANDLE) mode = 'left';
      else if (bw >= HANDLE * 3 && x >= bx + bw - HANDLE && x <= bx + bw + HANDLE / 2) mode = 'right';
      else if (x >= bx && x <= bx + bw) mode = 'move';
      else {
        setBand(centreOn(weekAtX(x), span), span);
        mode = 'move';
        start = bandStart();
      }
      drag = { mode: mode, x0: x, start: start, end: start + span - 1 };
      brushEl.classList.add('brush-drag');
      if (brushEl.setPointerCapture && e.pointerId !== undefined) {
        try { brushEl.setPointerCapture(e.pointerId); } catch (err) { /* no capture, still works */ }
      }
      e.preventDefault();
      if (brushEl.focus) brushEl.focus();
    }

    function brushMove(e) {
      if (!drag) return;
      var g = trackGeom();
      if (!g.cw) return;
      if (drag.mode === 'move') {
        var by = Math.round((e.clientX - drag.x0) / g.cw);
        setBand(drag.start + by, drag.end - drag.start + 1);
      } else if (drag.mode === 'left') {
        var l = Math.min(weekAtX(e.clientX), drag.end);
        setBand(l, drag.end - l + 1);
      } else {
        var r = Math.max(weekAtX(e.clientX), drag.start);
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
      // The label is the one thing on this strip that is placed rather than laid out, so it is the
      // one thing a change of width can leave wrong. Everything else is flex children and per cent
      // offsets and is right at any size without being told.
      if (window.ResizeObserver) {
        new window.ResizeObserver(function () { placeLabel(); }).observe(brushEl);
      }
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
    function addressFor(rd, sc) {
      var base = rd === 'calendar' ? CAL_ROUTE : OUT_ROUTE;
      return sc ? base + '/' + sc.key : base;
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
      return { reading: m[1], scope: viewByCode(m[2] || ''),
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
    function scopeName() { return scope ? (scope.label || scope.code) : ''; }

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
    // WHAT IS NO LONGER DRAWN, on the owner's instruction and stated so the next reader of this
    // function does not put it back as a repair. The block used to open with a sentence about
    // where the lines came from, and every line used to carry a badge printing its `f`. Neither
    // is rendered. The FIELDS are untouched in the model, which is where they do their work;
    // this function simply no longer prints them. A future change that wants a badge back here
    // is a product decision and not a bug fix.
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

    function agendaRow(cols, t) {
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
      var ol = el('ul', 'agenda-lines');
      rows.forEach(function (r) {
        var li = el('li', 'agenda-line');
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
      var over = scope ? scopeName()
                       : st.programmes + ' programmes';
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
        titleEl.textContent = (scope ? scopeName() : 'The term') + ', ' +
          counted + (gapField ? ', the ones with no ' + gapField : SHAPE_ORDER[shape]);
        // BUILT AS PARTS AND JOINED, because a window can leave the list with nothing in it and a
        // date span, a state tally and a separator printed over an empty set are three marks a
        // reader has to decide are not zeros. #119 put that state in the data's reach; this is the
        // sentence meeting it.
        var bits = [
          listed + many + ' across ' + (windowed && !scope ? spread : over)
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
        titleEl.textContent = (scope ? 'The ' + scopeName() + ' outline' : 'The outline') +
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
      // Issue 90. A reader who sets a window on the calendar and switches reading would otherwise
      // meet a full outline with a header control saying three weeks and no explanation.
      if (reading === 'outline' && windowOn()) {
        // #128 cut it to the finding. The window's own words are on the control in the header
        // that a reader arriving here with a window set has just come from, so repeating them
        // here was the sentence saying the same thing twice before it said its own thing once.
        noticeEl.appendChild(el('p', 'term-finding',
          'The window is off this reading: an outline is curriculum order and a syllabus has ' +
          'no date to filter on.'));
      }
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
                       week: 'as a week grid', list: 'as a list' };

    var SHAPE_TITLE = {
      review: 'the window across every programme, the sessions with nobody to teach them first ' +
              'and the programmes with nothing in it named underneath. What this address opens on',
      month: 'one panel per month, seven weekday columns',
      week: 'one panel per week that holds a session',
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

    function groupBy(sc, keyOf) {
      var out = [], byKey = {};
      sessionsFor(sc).forEach(function (s) {
        var k = keyOf(s);
        if (!byKey[k]) { byKey[k] = { key: k, rows: [] }; out.push(byKey[k]); }
        byKey[k].rows.push(s);
      });
      return out;
    }

    function monthsOf(sc) { return groupBy(sc, function (s) { return s.date.slice(0, 7); }); }
    function weeksOf(sc) { return groupBy(sc, function (s) { return mondayOf(s.date); }); }

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
    function chip(s) {
      var c = el('div', 'cal-chip' + (s.teacher !== 'yes' ? ' cal-gap' : ''));
      c.appendChild(el('span', 'cal-time', s.time));
      c.appendChild(el('span', 'cal-code', s.code));
      c.appendChild(el('span', 'cal-title', s.title));
      // A TITLE IS TEXT AND OFF SCREEN IS NOT ABSENT, which is why the last clause of this string
      // is gone rather than left where only a hover finds it. Issue 110.
      c.title = s.date + ' ' + s.time + ' · ' + s.code + ' · ' + s.title + ' · ' + s.state +
        ' · ' + (s.teacher === 'yes' ? 'instructor named' : 'no instructor named') +
        ' · attendance ' + s.attendance + ' · drawn as ' + s.id;
      return c;
    }

    // The days a month panel draws, which is the Monday on or before the first of the month to
    // the Sunday on or after the last of it, so every panel is whole weeks and the columns line
    // up down the sheet.
    function monthCells(ym) {
      var y = Number(ym.slice(0, 4)), m = Number(ym.slice(5, 7));
      var lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
      var end = addDays(mondayOf(ym + '-' + pad2(lastDay)), 6);
      var out = [], d = mondayOf(ym + '-01');
      while (d <= end) { out.push(d); d = addDays(d, 1); }
      return out;
    }

    // ONE PANEL. Issue 88 put a warning on the face of every one of them, on the argument that a
    // month grid is the one view here whose screenshot would be believed. Issues 91 and 93 took
    // it off: at seven panels that argument was producing seven identical copies of a sentence
    // the footer already carries once, and the reader who is looking at the page is the reader
    // the count was hurting. The chip's own title still carries the line, so the value a reader
    // hovers still says what it is.
    function calPanel(headText, rows, days, inMonth) {
      var sec = el('section', 'cal-panel');
      var h = el('h3', 'cal-head');
      h.appendChild(el('span', 'cal-headname', headText));
      h.appendChild(el('span', 'cal-headn', rows.length +
        (rows.length === 1 ? ' session' : ' sessions')));
      sec.appendChild(h);

      var grid = el('div', 'cal-grid');
      DAYS.forEach(function (d) { grid.appendChild(el('div', 'cal-dow', d)); });
      var byDate = {};
      rows.forEach(function (s) { (byDate[s.date] || (byDate[s.date] = [])).push(s); });
      days.forEach(function (d) {
        var cls = 'cal-day';
        if (inMonth && d.slice(0, 7) !== inMonth) cls += ' cal-offmonth';
        if (windowOn()) cls += inWindow(d) ? ' cal-inwin' : ' cal-outwin';
        var cell = el('div', cls);
        // The cell's own day, on the cell, because a grid is the one view here where WHICH day a
        // thing landed on is the claim being made and the only thing painted in the cell is the
        // number. A driver can check the column against the date without being handed the model,
        // and two panels that overlap at a month boundary can be told apart by a reader of the
        // markup rather than by arithmetic over positions.
        cell.setAttribute('data-date', d);
        cell.appendChild(el('span', 'cal-dnum', String(Number(d.slice(8, 10)))));
        (byDate[d] || []).forEach(function (s) { cell.appendChild(chip(s)); });
        grid.appendChild(cell);
      });
      sec.appendChild(grid);
      return sec;
    }

    // The grids had a sticky banner of their own over the panels, deleted by issues 91 and 93
    // along with the four other copies in this sheet.
    function buildGrid(kind) {
      var wrap = el('div', 'cal cal-' + kind);
      var groups = kind === 'month' ? monthsOf(scope) : weeksOf(scope);
      groups.forEach(function (g) {
        if (kind === 'month') {
          wrap.appendChild(calPanel(monthName(g.key), g.rows, monthCells(g.key), g.key));
        } else {
          var days = [], i;
          for (i = 0; i < 7; i++) days.push(addDays(g.key, i));
          wrap.appendChild(calPanel('Week of ' + longDate(g.key), g.rows, days, null));
        }
      });
      if (!groups.length) {
        wrap.appendChild(el('p', 'cal-empty', 'No session in this scope.'));
      }
      return wrap;
    }

    // ---- moving between the scopes ----------------------------------------------
    function scopeBar() {
      var bar = el('p', 'term-scope');
      bar.appendChild(el('span', 'term-scope-lead', scope
        ? 'One programme. '
        : 'All ' + VIEWS.length + ' programmes. '));
      if (scope) {
        var all = el('a', 'linkbtn', 'all ' + VIEWS.length + ' programmes');
        all.href = addressFor(reading, null);
        bar.appendChild(all);
      }
      VIEWS.forEach(function (v) {
        if (scope === v) return;
        var a = el('a', 'linkbtn', v.code);
        a.href = addressFor(reading, v);
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
    function reviewAbsent() {
      var r = winRange();
      var out = [];
      groupsFor(scope).forEach(function (g) {
        var rs = sessionsFor(g.view);
        var i, before = null, after = null, held = 0, hit = 0;
        for (i = 0; i < rs.length; i++) {
          if (inWindow(rs[i].date)) {
            held++;
            if (gapMatch(rs[i])) hit++;
            continue;
          }
          if (!r) continue;
          if (rs[i].date < r.from) before = rs[i].date;     // rs is in date order, so the last wins
          else if (rs[i].date > r.to && !after) after = rs[i].date;
        }
        if (hit) return;                                    // it is on the screen, so not absent
        out.push({ view: g.view, samp: sampleOf(g.view, 'CohortSession'),
                   before: before, after: after, drawn: rs.length, held: held });
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
      if (gapField && a.held) {
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
      if (!(gapField && a.held)) {
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
            ? gapEmptyText(bands.inWindow.length) : windowEmptyText();
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
        groupRow(tb, cols.length, function (th) {
          th.textContent = windowEmptyText();
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
      groupsFor(scope).forEach(function (g) {
        var deliveries = g.templates.reduce(function (n, t) { return n + t.deliveries.length; }, 0);
        groupRow(tb, cols.length, function (th) {
          // The way back to the drawing the row came from, one per programme rather than one per
          // row: seven controls at the size this page requires, instead of 83 of them squeezed
          // into a table cell.
          var a = el('a', 'linkbtn', g.view.label || g.view.code);
          a.href = g.view.route;
          th.appendChild(a);
          th.appendChild(document.createTextNode(' · ' + g.templates.length +
            ' templates, ' + deliveries + (deliveries === 1 ? ' delivery' : ' deliveries') +
            (g.modules ? ' · ' + g.modules : '')));
        });
        modulesOf(g).forEach(function (mod) {
          groupRow(tb, cols.length, function (th) {
            if (mod.absent) {
              th.appendChild(el('span', 'term-nomodule', mod.name));
              th.appendChild(document.createTextNode(' · ' + mod.rows.length +
                (mod.rows.length === 1 ? ' row' : ' rows')));
              return;
            }
            th.appendChild(el('span', 'term-modname', mod.name));
            th.appendChild(document.createTextNode(' · ' + mod.rows.length +
              (mod.rows.length === 1 ? ' row here' : ' rows here')));
          }, 'term-module');
          mod.rows.forEach(function (t) {
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
              var ag = agendaRow(cols.length, t);
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
      var key = reading + '/' + (scope ? scope.key : '') + '/' + (openParam() || '') + '/' +
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
        scope = null;
        // Issue 125. The sheet is shut, so no worklist is on. Left standing it would narrow the
        // hints the panel writes about the whole reading, which is the one place stats() is asked
        // its question without the filter.
        gapField = null;
        // Issue 112. The sheet is shut, so no row is open. Left standing, the set would reopen
        // rows on the next visit to an address that says nothing about any.
        openRows = {};
        sheet.hidden = true;
        document.body.classList.remove('calendar', 'outline');
        if (returnTo && returnTo.focus && document.contains(returnTo) &&
            returnTo.getAttribute && returnTo.getAttribute('tabindex') !== null) {
          returnTo.focus();
        }
        returnTo = null;
        if (onRoute) onRoute();
        return;
      }
      // Issue 112 added the third term and issue 125 the fourth, both for the same reason: the
      // state is on the address now, so an address that names the same reading and the same
      // programme and a different set of open rows, or a different worklist, is a different
      // address and the early return may not swallow it.
      if (reading === next && scope === (nextScope || null) &&
          openParam() === (openTo || null) && gapField === (gapTo || null)) return;
      reading = next;
      scope = nextScope || null;
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
      var armed = reading === 'calendar' && shape === 'review' && !gapField && armReview();
      buildRows();
      describe();
      document.body.classList.toggle('calendar', reading === 'calendar');
      document.body.classList.toggle('outline', reading === 'outline');
      if (!wasOpen) {
        returnTo = document.activeElement;
        sheet.hidden = false;
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
    function close() {
      if (readAddress(location.hash)) {
        try {
          history.replaceState(null, '', location.pathname + location.search + '#/');
        } catch (err) {
          location.hash = '#/';     // a file:// URL, where replaceState throws
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
          scope: scope ? scope.key : null,
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
          return { x: +r.x.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2),
                   r: +r.right.toFixed(2) };
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
          label: { text: brushLabel.textContent,
                   inside: !/brush-label-out/.test(brushLabel.className),
                   box: box(brushLabel) },
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
