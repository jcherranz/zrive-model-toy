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
// sample of a term as well as an invented one. Both of those are said on the sheet, in three
// places each: the subtitle, a notice above the rows that never scrolls away, and a banner row
// inside the table that is sticky, so a screenshot of the rows carries the disclaimer with it.
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
(function () {
  'use strict';

  var CAL_ROUTE = '#/calendar';
  var OUT_ROUTE = '#/outline';
  // `#/outline/ZSC`, in the shape router.js already answers at `#/p/ZSC`. Parsed and never
  // matched against a list of built strings, so a code this page does not know falls through to
  // the unscoped reading rather than to nothing.
  var ADDRESS = /^#\/(calendar|outline)(?:\/([^/?#]*))?/;

  // Written out rather than taken from the browser's locale. The page is in English, the sheet has
  // to read the same on every machine, and a driver asserting date order should be reading the
  // same strings the reader is.
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

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
  ZM.term = function createTerm(opts) {
    var VIEWS = opts.views || [];
    var AGENDA = opts.agenda || null;
    var onRoute = opts.onRoute;

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
    var agendaOn = false;       // issue 85's invented block, off until it is asked for

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
          if (mr) { group.modules = mr.v; group.noModules = mr.f === 'absent'; }
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

    // ---- what the sheet says about itself -------------------------------------
    // Two paragraphs above the rows, and neither of them scrolls away. The first is the standing
    // requirement of this project, sharpened because a table of dates is the first view here that
    // could be mistaken for an operating document. The second is the finding, which is the most
    // interesting thing either card turned up and belongs where the thing it is about is.
    var NOTICE = {
      calendar: [
        'This is not a schedule. Every date, time, state, attendance figure and identifier ' +
        'below is invented. Only the session titles, the module names and the programme codes ' +
        'are real and published.',
        'No system in the business holds this view. Every session below records that its ' +
        'schedule lives in Notion, one calendar per programme per quarter, so one term sits in ' +
        'seven separate places and nothing assembles it. This page is the first place it is ' +
        'assembled.'
      ],
      outline: [
        'Every identifier, mode, duration, date and state below is invented. The session ' +
        'titles, the module headings and the position of each row in its syllabus are real and ' +
        'published, and they are the only things here that are.',
        'No system holds a template either. Each row below records that there is no template ' +
        "object at all: the template is last quarter's calendar rows, copied by hand at setup."
      ]
    };

    // Issue 85, and it is the finding rather than a caveat, so it is written from the rows and
    // not typed. Three of the seven syllabi do not name a module for every session and one names
    // none at all, and an outline grouped by module has to say which of those it is looking at
    // rather than leaving a reader to read a blank.
    function moduleNote(sc) {
      var gs = groupsFor(sc), said = [];
      gs.forEach(function (g) {
        if (g.noModules) said.push(g.view.code + ' names no module on any row of its syllabus');
        else if (g.modules && /in no module/.test(g.modules)) said.push(g.view.code + ': ' +
          g.modules);
      });
      if (!said.length) {
        return gs.length === 1
          ? gs[0].view.code + ' groups every session in its syllabus into a named module, and ' +
            'the headings below are those modules, in the order the syllabus itself gives.'
          : 'The headings below are the modules the syllabi themselves declare, in the order ' +
            'each syllabus itself gives.';
      }
      return 'The module structure is not the same object on every programme, and the headings ' +
             'below say so rather than smoothing it over. ' + said.join('. ') + '.';
    }

    // The limit on the second reading, computed from the rows so that it cannot go on claiming
    // one to one after a second cohort has arrived. It is stated as a fact about the drawing, not
    // about Zrive: this artefact draws one cohort, so a template can have at most one delivery in
    // it, and one to one is what the drawing was built to produce rather than something it found.
    function outlineLimit(st) {
      if (st.maxDeliveries > 1) {
        return 'Some templates below carry more than one delivery, so this reading can now show ' +
               'what a template buys.';
      }
      return 'Every template here has exactly one delivery, and that is a property of the ' +
             'drawing rather than a finding about the business: it draws one cohort, so a ' +
             'template can have at most one delivery in it. What a template is for, that it ' +
             'outlives its deliveries and is used again, cannot be seen at one to one, and this ' +
             'is the first view that could show it if a second cohort ever entered the model.';
    }

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
      return { reading: m[1], scope: viewByCode(m[2] || '') };
    }

    // The programme, in the words the drawing already uses for it, so a reader arriving from a
    // tile reads the same name here that was over the tile.
    function scopeName() { return scope ? (scope.label || scope.code) : ''; }

    // ---- the invented session agenda, issue 85 ----------------------------------
    // OFF UNTIL IT IS ASKED FOR, which is the first of the four things that mark it. Everything
    // else in this sheet is a value read off the drawing; this is prose that was made up, so it
    // is not on the page until a reader has read a control that says what it is and pressed it.
    //
    // THE OTHER THREE ARE ON THE BLOCK ITSELF. Every line carries the same `dummy` badge the
    // panel puts on an invented property, and the badge is on the LINE and not on the block, so
    // there is no line a reader can quote without it. The block is drawn in a register nothing
    // else here uses, indented behind a heavy rule with its own ground, so a real row and an
    // invented one never share one. And the first thing inside it is the sentence that says the
    // same four lines sit under all 83 templates and that they are not Zrive's, which is what
    // survives a screenshot of the block alone.
    //
    // THE LINES COME OUT OF THE INSTANCE DOCUMENT AND ARE NOT WRITTEN HERE. They are ranked and
    // flagged in the model beside every other invented value, and the build refuses a line that
    // is ranked as read or flagged as anything but dummy. A copy of them in this file would be a
    // second place for prose nobody has gated.
    function agendaAvailable() {
      return !!(AGENDA && AGENDA.rows && AGENDA.rows.length && AGENDA.note);
    }

    function agendaRow(cols, t) {
      var tr = document.createElement('tr');
      tr.className = 'term-agenda';
      var td = document.createElement('td');
      td.colSpan = cols;
      var box = el('div', 'agenda-box');
      var lead = el('p', 'agenda-note');
      lead.appendChild(el('span', 'flag dummy', 'invented'));
      lead.appendChild(document.createTextNode(' ' + AGENDA.note));
      box.appendChild(lead);
      var ol = el('ul', 'agenda-lines');
      AGENDA.rows.forEach(function (r) {
        var li = el('li', 'agenda-line');
        li.appendChild(el('span', 'flag ' + r.f, r.f));
        li.appendChild(document.createTextNode(' ' + r.v));
        ol.appendChild(li);
      });
      box.appendChild(ol);
      td.appendChild(box);
      tr.appendChild(td);
      return tr;
    }

    // The control. One of it and not one per row, at the size #77 took every control on this page
    // to, and its label states what pressing it puts on the screen rather than naming a feature.
    function agendaToggle() {
      var wrap = el('p', 'term-agendactl');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'zbtn agenda-toggle';
      b.setAttribute('aria-pressed', agendaOn ? 'true' : 'false');
      b.textContent = agendaOn
        ? 'hide the invented session agenda'
        : 'show an invented session agenda under every row';
      b.addEventListener('click', function () {
        agendaOn = !agendaOn;
        built = null;
        buildRows();
        describe();
      });
      wrap.appendChild(b);
      wrap.appendChild(el('span', 'term-agendahint',
        'No system holds one. The four lines it adds were made up on this page, they are the ' +
        'same four under every template, and each carries the same dummy badge an invented ' +
        'property carries in the panel.'));
      return wrap;
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
          ' · ' + st.noRecording + ' with no recording'));
        subEl.appendChild(el('span', 'warn', 'every date here is invented'));
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
        subEl.appendChild(el('span', 'warn', 'every value here is invented'));
      }

      noticeEl.textContent = '';
      NOTICE[reading].forEach(function (line, i) {
        noticeEl.appendChild(el('p', i === 0 ? 'term-invented' : 'term-finding', line));
      });
      if (reading === 'outline') {
        noticeEl.appendChild(el('p', 'term-finding', moduleNote(scope)));
        noticeEl.appendChild(el('p', 'term-finding', outlineLimit(st)));
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
    function head(table, cols) {
      var thead = document.createElement('thead');
      // The banner row, and it is inside the table on purpose. The notice above the rows is the
      // reader's answer; this is the answer that survives a screenshot of the rows alone, because
      // both header rows are sticky and this one is at the top of the scroll. A table of dates
      // that gets cropped and pasted somewhere else takes its disclaimer with it.
      var warnRow = document.createElement('tr');
      warnRow.className = 'term-banner';
      var warnTh = el('th', null, 'every value in this table is invented');
      warnTh.colSpan = cols.length;
      warnRow.appendChild(warnTh);
      thead.appendChild(warnRow);

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
      var rows = sessionsFor(scope);
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
            cell(tr, t.title, 'r-name');
            cell(tr, t.mode, 'r-state');
            cell(tr, t.place, 'r-state');
            cell(tr, t.duration, 'r-num');
            cell(tr, String(t.deliveries.length), 'r-num s-deliveries');
            cell(tr, t.deliveries.map(function (d) {
              return d.date + ', ' + d.state;
            }).join('; ') || 'none', 'r-state s-delivered');
            cell(tr, t.id, 'r-drawn');
            tb.appendChild(tr);
            if (agendaOn) tb.appendChild(agendaRow(cols.length, t));
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
      var key = reading + '/' + (scope ? scope.key : '') + '/' + (agendaOn ? 'a' : '');
      if (built === key) return;
      built = key;
      rowsEl.textContent = '';
      rowsEl.appendChild(reading === 'calendar' ? buildCalendar() : buildOutline());
      rowsEl.scrollTop = 0;
    }

    // ---- open, close, and the address ------------------------------------------
    function isOpen() { return !!sheet && !sheet.hidden; }

    function show(next, nextScope) {
      var wasOpen = isOpen();
      if (!sheet) return;
      if (!next) {
        if (!wasOpen) return;
        reading = null;
        scope = null;
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
      if (reading === next && scope === (nextScope || null)) return;
      reading = next;
      scope = nextScope || null;
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
      show(a ? a.reading : null, a ? a.scope : null);
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
      start: route,
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
          agenda: agendaOn,
          agendaLines: AGENDA && AGENDA.rows ? AGENDA.rows.length : 0,
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
          to: st.to
        };
      }
    };
  };
})();
