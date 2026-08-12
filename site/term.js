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

    function totalFor(sc, key) {
      var n = 0;
      groupsFor(sc).forEach(function (g) {
        var b = (g.view.counts || {})[key];
        if (b) n += b.total;
      });
      return n;
    }

    // The gaps, counted off the rows rather than written down. A calendar is opened to find what
    // is missing, so these are the numbers the sheet leads with.
    function stats(sc) {
      var ss = sessionsFor(sc), ts = templatesFor(sc);
      var m = {}, order = [];
      ss.forEach(function (s) {
        if (m[s.state] === undefined) { m[s.state] = 0; order.push(s.state); }
        m[s.state]++;
      });
      return {
        sessions: ss,
        templates: ts,
        programmes: groupsFor(sc).length,
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
    var CAL_SHAPES = ['month', 'week', 'list'];
    var shape = 'month';        // the month grid is what #/calendar opens on

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
    function windowEmptyText() {
      return 'No session in ' + windowText() +
             '. Move the anchor or take the window off, in the header.';
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

    // ---- the window control, and where `now` comes from -------------------------
    // THE BLOCKER THIS CARD HAD TO ANSWER BEFORE IT COULD BUILD ANYTHING. "The next three weeks"
    // needs a now, and every date on this page is invented: the term ends 2026-06-28 and the real
    // clock is past it, so a window built against the system clock renders empty today and every
    // day after. Three ways out were on the table: an anchor declared inside the term, a range
    // the reader positions with no now at all, and the real clock with "the term is over" as the
    // answer. This is the first with the second as the override AND the third said out loud,
    // because the one thing that would be worse than an empty view is a page that quietly invents
    // a today.
    //
    // SO THE CONTROL LEADS WITH THE TRUTH. It states the reader's own date, states that no
    // session is on or after it, and only then offers an anchor, named as an anchor and not as
    // today. The anchor is derived from the term rather than made up, which is why nothing here
    // carries a `dummy` badge: a badge marks a value somebody invented, and the Monday of the
    // term's middle week is arithmetic over values that already carry theirs.
    //
    // IT IS IN THE HEADER AND NOT IN THE SHEET, because the sheet covers the drawing and the
    // window acts on both. #86 made every header control hit-testable over a sheet, so one
    // control now serves the diagram and the calendar without a second copy of it.
    var wnBtn = document.getElementById('wnbtn');
    var wnMenu = document.getElementById('wnmenu');
    var onWindow = opts.onWindow;

    function wnMenuOpen() { return !!wnMenu && !wnMenu.hidden; }

    function openWnMenu() {
      if (!wnMenu || wnMenuOpen()) return;
      buildWnMenu();
      wnMenu.hidden = false;
      if (wnBtn) wnBtn.setAttribute('aria-expanded', 'true');
    }

    function closeWnMenu(refocus) {
      if (!wnMenuOpen()) return;
      wnMenu.hidden = true;
      if (wnBtn) wnBtn.setAttribute('aria-expanded', 'false');
      if (refocus && wnBtn && wnBtn.focus) wnBtn.focus();
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
    // of programme or of altitude leaves the window exactly where it was and changes every number
    // the control quotes about it, so app.js calls this beside the other things it restates. Issue
    // 111.
    function restateWindow() {
      describeWindow();
      if (wnMenuOpen()) buildWnMenu();
    }

    function setWindowWeeks(n) {
      if (win.weeks === n) return;
      win.weeks = n;
      windowChanged();
    }

    function stepAnchor(delta) {
      if (!TERM) return;
      var next = addDays(win.anchor, delta * 7);
      if (next < TERM.firstMonday) next = TERM.firstMonday;
      if (next > TERM.lastMonday) next = TERM.lastMonday;
      if (next === win.anchor) return;
      win.anchor = next;
      windowChanged();
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
        menu: wnMenuOpen()
      };
    }

    // ---- what the window took off the drawing, issue 111 ------------------------
    // WHERE THE COUNT WENT WHEN IT LEFT THE PICTURE. #100 answered a filtered drawing with one
    // stub tile per lane reading "N tiles outside this window", folded the lines that lost an end
    // onto it, and gave every lane caption a fourth line reading "6 of 28 in this window". He
    // filed #111 on one of those stubs: "The whole point of week filter is to not see this (only
    // the week, clean)". Honest bookkeeping and a clean view were treated as one requirement and
    // they are two. render.js draws the window and counts what it dropped; this row is where the
    // number lives now, beside `weeks: 3 of 24` and `gaps: 11 of 95`, which is the established
    // home on this page for a number about what is not on screen.
    //
    // IT IS ASKED FOR AND NEVER CACHED. `windowEffect` reaches render.js's own report of the
    // drawing that is on screen at the moment this runs, so a change of programme or of altitude
    // moves it without anything here subscribing to either.
    function windowOff() {
      var f = windowEffect ? windowEffect() : null;
      if (!f || !f.on || !f.off || !f.off.tiles) return null;
      return f;
    }

    function offWords(f) {
      var o = f.off;
      return o.tiles + ' of ' + f.canonNodes + (o.tiles === 1 ? ' tile' : ' tiles') + ' and ' +
             o.relationships + (o.relationships === 1 ? ' relationship' : ' relationships') +
             ' are off the drawing';
    }

    function describeWindow() {
      if (!wnBtn || !TERM) return;
      // The state, in the row's own idiom, and short enough not to push the nav around: `theme`
      // says `theme: system` in the same place for the same reason.
      wnBtn.textContent = 'weeks: ' + (win.weeks ? win.weeks + ' of ' + TERM.weeks
                                                 : 'all ' + TERM.weeks);
      var f = windowOff();
      wnBtn.title = 'the part of the term in focus: ' + windowText() +
        '. ' + windowShown(null) + ' of ' + sessions.length + ' sessions' +
        (f ? '. ' + offWords(f) : '') + '. Press to move it';
    }

    function wnButton(cls, label, title, fn) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'zbtn ' + cls;
      b.textContent = label;
      if (title) b.title = title;
      b.addEventListener('click', function (e) { e.stopPropagation(); fn(); });
      return b;
    }

    function buildWnMenu() {
      if (!wnMenu || !TERM) return;
      wnMenu.textContent = '';

      // Layer one, and it is the reason the rest of this is allowed to exist.
      var lead = el('p', 'wn-now');
      lead.appendChild(el('span', 'warn', 'this page has no today'));
      lead.appendChild(document.createTextNode(
        ' Your clock says ' + TODAY + '. The term runs ' + TERM.first + ' to ' +
        TERM.last + ', so ' + AFTER_TODAY + ' of the ' + sessions.length +
        ' sessions are on or after today. The window below is positioned on an anchor inside ' +
        'the term, which is not today and is not pretending to be: it is the Monday of the week ' +
        'the term\'s middle session falls in, and you can move it.'));
      wnMenu.appendChild(lead);

      var anch = el('p', 'wn-row');
      anch.appendChild(el('span', 'wn-lab', 'anchor'));
      anch.appendChild(wnButton('wn-step', '‹', 'one week earlier',
        function () { stepAnchor(-1); }));
      anch.appendChild(el('span', 'wn-anchor', 'Monday ' + longDate(win.anchor)));
      anch.appendChild(wnButton('wn-step', '›', 'one week later',
        function () { stepAnchor(1); }));
      wnMenu.appendChild(anch);

      var wk = el('p', 'wn-row');
      wk.appendChild(el('span', 'wn-lab', 'window'));
      WIN_STEPS.forEach(function (n) {
        var b = wnButton('wn-weeks', n === 1 ? '1 week' : n + ' weeks',
          'the ' + (n === 1 ? 'week' : n + ' weeks') + ' from the anchor',
          function () { setWindowWeeks(n); });
        b.setAttribute('aria-pressed', win.weeks === n ? 'true' : 'false');
        wk.appendChild(b);
      });
      var all = wnButton('wn-weeks', 'whole term', 'no window: the whole term',
        function () { setWindowWeeks(0); });
      all.setAttribute('aria-pressed', win.weeks ? 'false' : 'true');
      wk.appendChild(all);
      wnMenu.appendChild(wk);

      // What the window does to each surface, said once and here, because the answer differs by
      // surface on purpose. The clause about the drawing said it DIMS what is outside the window,
      // which stopped being true at #100 and is corrected here under #111: it draws the window
      // and nothing else.
      var note = el('p', 'wn-note');
      note.textContent = 'Now: ' + windowText() + ' · ' + windowShown(null) + ' of ' +
        sessions.length + ' sessions. The list drops what is outside it, because a list is an ' +
        'agenda. The month and week grids keep it and mark the band, because the shape of the ' +
        'term is what a grid is for. The drawing shows the window and nothing else.';
      wnMenu.appendChild(note);

      // ---- and the count the drawing no longer carries, issue 111 --------------
      // THE NUMBER DID NOT GO ANYWHERE, IT MOVED HERE. One line for the whole drawing and one row
      // per lane, which is what the lane captions used to say and is the finer answer a reader
      // who wants it should still be able to get. The lanes are named as the DRAWING names them:
      // the label comes over on render.js's report, off the band the build wrote, so nothing here
      // invents a second vocabulary for the same six columns.
      var f = windowOff();
      if (!f) return;
      var off = el('p', 'wn-off');
      off.textContent = offWords(f) + '.' +
        (f.off.lines === f.off.relationships ? ''
          : ' They were ' + f.off.lines + (f.off.lines === 1 ? ' line' : ' lines') +
            ', because at this altitude one line can stand for several.');
      wnMenu.appendChild(off);
      (f.lanes || []).forEach(function (l) {
        if (l.shown === l.of) return;      // a lane that lost nothing has nothing to report
        var row = el('p', 'wn-lane');
        row.appendChild(el('span', 'wn-lane-n', l.shown + ' of ' + l.of));
        row.appendChild(el('span', 'wn-lane-k', l.label));
        wnMenu.appendChild(row);
      });
    }

    if (wnBtn && wnMenu) {
      // The same three listeners the programme menu has, in the same shapes and for the same
      // reasons. Escape is in the capture phase, ahead of the bubble listener in selection.js
      // that clears the selection, and it is left alone while capture mode is on because Escape
      // is how a reader gets out of that.
      wnBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (wnMenuOpen()) closeWnMenu(false);
        else openWnMenu();
      });
      document.addEventListener('click', function (e) {
        var t = e.target;
        if (t && t.closest && t.closest('#wnpick')) return;
        closeWnMenu(false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || !wnMenuOpen()) return;
        if (document.body.classList.contains('fb-mode')) return;
        e.preventDefault();
        e.stopPropagation();
        closeWnMenu(true);
      }, true);
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
      return { reading: m[1], scope: viewByCode(m[2] || ''),
               open: q ? decodeURIComponent(q[1]) : null };
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
      var url = location.pathname + location.search + addressFor(reading, scope) +
                (v ? '?open=' + encodeURIComponent(v) : '');
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

    function agendaRow(cols, t) {
      var rows = agendaFor(t);
      if (!rows) return null;
      var tr = document.createElement('tr');
      tr.className = 'term-agenda';
      tr.id = agendaBlockId(t);
      var td = document.createElement('td');
      td.colSpan = cols;
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

    function describe() {
      var st = stats(scope);
      var over = scope ? scopeName()
                       : st.programmes + ' programmes';
      if (reading === 'calendar') {
        titleEl.textContent = scope
          ? scopeName() + ', ' + st.sessions.length + ' sessions in date order'
          : 'The term, ' + st.sessions.length + ' sessions in date order';
        subEl.textContent = '';
        subEl.appendChild(document.createTextNode(
          st.sessions.length + ' sessions across ' + over + ', drawn from a term ' +
          'the model counts at ' + st.totalSessions + ' · ' + st.from + ' to ' + st.to +
          ' · ' + st.stateCounts + ' · ' + st.noInstructor + ' with no instructor named' +
          ' · ' + st.noRecording + ' with no recording' +
          ' · ' + SHAPE_NAME[shape] +
          (windowOn() ? ' · ' + windowShown(scope) + ' of them inside the window, ' +
                        windowText() : '')));
      } else {
        titleEl.textContent = scope
          ? 'The ' + scopeName() + ' outline, ' + st.templates.length +
            ' session templates in curriculum order'
          : 'The outline, ' + st.templates.length + ' session templates in curriculum order';
        subEl.textContent = '';
        subEl.appendChild(document.createTextNode(
          st.templates.length + ' templates across ' + over + ', drawn from a ' +
          'syllabus the model counts at ' + st.totalTemplates + ' · ' + st.templates.length +
          ' deliveries, at most ' + st.maxDeliveries + ' to a template · ' + st.noDuration +
          ' record no duration'));
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
        noticeEl.appendChild(el('p', 'term-finding',
          'The window is off this reading. It is ' + windowText() + ' and the drawing and the ' +
          'calendar are both obeying it, but an outline is curriculum order and a syllabus has ' +
          'no date to filter on.'));
      }
      // The way from one reading to the other keeps the scope, and the way back to all seven is
      // its own control, because a reader who arrived at Z-SC from a tile has no other way out
      // of it and an address they have to edit by hand is not a way out.
      noticeEl.appendChild(scopeBar());
      if (reading === 'outline' && agendaAvailable()) noticeEl.appendChild(agendaToggle());

      if (calBtn) toggleCurrent(calBtn, reading === 'calendar');
      if (outBtn) toggleCurrent(outBtn, reading === 'outline');
      if (calBtn) calBtn.href = addressFor('calendar', scope);
      if (outBtn) outBtn.href = addressFor('outline', scope);
    }

    // ---- the three shapes, issue 88 ---------------------------------------------
    var SHAPE_NAME = { month: 'as a month grid', week: 'as a week grid', list: 'as a list' };

    var SHAPE_TITLE = {
      month: 'one panel per month, seven weekday columns, the default',
      week: 'one panel per week that holds a session',
      list: 'one row per session, the reading this sheet opened with before issue 88'
    };

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
      buildRows();
      describe();
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
            cell(tr, t.deliveries.map(function (d) {
              return d.date + ', ' + d.state;
            }).join('; ') || 'none', 'r-state s-delivered');
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
                shape + '/' + (win.weeks ? win.weeks + '@' + win.anchor : '-');
      if (built === key) return;
      built = key;
      rowsEl.textContent = '';
      rowsEl.appendChild(reading !== 'calendar' ? buildOutline()
                         : shape === 'list' ? buildCalendar() : buildGrid(shape));
      rowsEl.scrollTop = 0;
    }

    // ---- open, close, and the address ------------------------------------------
    function isOpen() { return !!sheet && !sheet.hidden; }

    function show(next, nextScope, openTo) {
      var wasOpen = isOpen();
      if (!sheet) return;
      if (!next) {
        if (!wasOpen) return;
        reading = null;
        scope = null;
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
      // Issue 112 added the third term. The open set is on the address now, so an address that
      // names the same reading and the same programme and a different set of open rows is a
      // different address and the early return may not swallow it.
      if (reading === next && scope === (nextScope || null) &&
          openParam() === (openTo || null)) return;
      reading = next;
      scope = nextScope || null;
      applyOpenParam(openTo);
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
      show(a ? a.reading : null, a ? a.scope : null, a ? a.open : null);
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
      if (n.type === 'CohortSession') {
        return {
          href: addressFor('calendar', sc),
          text: 'see the term, all ' + st.sessions.length + ' sessions',
          hint: 'every session on ' + where + ', in date order, drawn from a term the ' +
                'model counts at ' + st.totalSessions + '. ' + st.noInstructor +
                ' have no instructor. All ' + VIEWS.length + ' programmes at once is one ' +
                'click away inside.'
        };
      }
      if (n.type === 'SessionTemplate') {
        return {
          href: addressFor('outline', sc),
          text: 'see the outline, all ' + st.templates.length + ' session templates',
          hint: 'every template on ' + where + ', grouped by the module its syllabus puts it ' +
                'in and in syllabus order, drawn from a syllabus the model counts at ' +
                st.totalTemplates + '.'
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
        // The header control says what the window is before anybody has pressed anything, which
        // is the whole of issue 90's rule that the anchor must be visible.
        describeWindow();
        route();
      },
      linkFor: linkFor,
      capLink: capLink,
      isOpen: isOpen,
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
        var st = stats(scope);
        return {
          open: isOpen(),
          reading: reading,
          scope: scope ? scope.key : null,
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
      readingRows: function () { return (reading && READING[reading]) || null; },
      // Read by app.js on the first paint, so a drawing is dimmed from the start if a window is
      // ever on before the sheet has been opened.
      windowSpec: windowSpec,
      windowState: windowState,
      // Issue 111. Called by app.js after anything that changes the drawing without changing the
      // window, because the control now quotes a number about the drawing.
      restateWindow: restateWindow,
      windowMenuOpen: wnMenuOpen
    };
  };
})();
