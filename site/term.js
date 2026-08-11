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
(function () {
  'use strict';

  var CAL_ROUTE = '#/calendar';
  var OUT_ROUTE = '#/outline';

  // Written out rather than taken from the browser's locale. The page is in English, the sheet has
  // to read the same on every machine, and a driver asserting date order should be reading the
  // same strings the reader is.
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

  var ZM = window.ZM = window.ZM || {};

  function prop(n, k) {
    var p = n.props || [], i;
    for (i = 0; i < p.length; i++) if (p[i].k === k) return p[i].v;
    return null;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  // opts.views    the seven joined views, in build order
  // opts.onRoute  called after the sheet opens or closes, because the heading changed and the
  //               header may have changed height with it
  ZM.term = function createTerm(opts) {
    var VIEWS = opts.views || [];
    var onRoute = opts.onRoute;

    var sheet = document.getElementById('term');
    var titleEl = document.getElementById('termtitle');
    var subEl = document.getElementById('termsub');
    var noticeEl = document.getElementById('termnotice');
    var rowsEl = document.getElementById('termrows');
    var calBtn = document.getElementById('termcal');
    var outBtn = document.getElementById('termout');

    var reading = null;         // 'calendar', 'outline', or null when the sheet is shut
    var built = null;           // which reading the rows on screen are
    var returnTo = null;        // what had focus when the sheet was opened

    // ---- the rows, read out of the seven views once ---------------------------
    // Read once and kept, because nothing on this page can change them: the drawings are generated
    // and the sheet has no control that filters or sorts. Built at construction rather than on
    // first open so that the counts the panel's link quotes are true before anybody has opened
    // anything.
    var sessions = [];
    var templates = [];
    var byProgramme = [];
    var totalSessions = 0;      // what the model says the term holds, not what is drawn
    var totalTemplates = 0;

    (function collect() {
      VIEWS.forEach(function (v) {
        var d = v.drawing, group = { view: v, templates: [] };
        var counts = v.counts || {};
        if (counts.CohortSession) totalSessions += counts.CohortSession.total;
        if (counts.SessionTemplate) totalTemplates += counts.SessionTemplate.total;

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
          var row = {
            code: v.code, label: v.label, route: v.route,
            id: n.id, title: n.label,
            tcode: prop(n, 'template_code'),
            mode: prop(n, 'delivery_mode'),
            place: prop(n, 'location_mode'),
            duration: prop(n, 'duration_min'),
            deliveries: ids.map(function (id) { return sessionById[id]; }).filter(Boolean)
          };
          group.templates.push(row);
          templates.push(row);
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

    // The gaps, counted off the rows rather than written down. A calendar is opened to find what
    // is missing, so these are the numbers the sheet leads with.
    var noInstructor = sessions.filter(function (s) { return s.teacher !== 'yes'; }).length;
    var noRecording = sessions.filter(function (s) {
      return !s.recording || s.recording === 'none';
    }).length;
    var stateCounts = (function () {
      var m = {}, order = [];
      sessions.forEach(function (s) {
        if (m[s.state] === undefined) { m[s.state] = 0; order.push(s.state); }
        m[s.state]++;
      });
      return order.map(function (k) { return m[k] + ' ' + k; }).join(', ');
    })();
    var maxDeliveries = templates.reduce(function (m, t) {
      return Math.max(m, t.deliveries.length);
    }, 0);
    var noDuration = templates.filter(function (t) {
      return !t.duration || t.duration === 'not recorded';
    }).length;
    var span = sessions.length
      ? { from: sessions[0].date, to: sessions[sessions.length - 1].date }
      : { from: '', to: '' };

    // ---- what the sheet says about itself -------------------------------------
    // Two paragraphs above the rows, and neither of them scrolls away. The first is the standing
    // requirement of this project, sharpened because a table of dates is the first view here that
    // could be mistaken for an operating document. The second is the finding, which is the most
    // interesting thing either card turned up and belongs where the thing it is about is.
    var NOTICE = {
      calendar: [
        'This is not a schedule. Every date, time, state, attendance figure and identifier ' +
        'below is invented. Only the session titles and the programme codes are real and ' +
        'published.',
        'No system in the business holds this view. Every session below records that its ' +
        'schedule lives in Notion, one calendar per programme per quarter, so one term sits in ' +
        'seven separate places and nothing assembles it. This page is the first place it is ' +
        'assembled.'
      ],
      outline: [
        'Every identifier, mode, duration, date and state below is invented. Only the session ' +
        'titles and the programme codes are real and published.',
        'No system holds a template either. Each row below records that there is no template ' +
        "object at all: the template is last quarter's calendar rows, copied by hand at setup."
      ]
    };

    // The limit on the second reading, computed from the rows so that it cannot go on claiming
    // one to one after a second cohort has arrived. It is stated as a fact about the drawing, not
    // about Zrive: this artefact draws one cohort, so a template can have at most one delivery in
    // it, and one to one is what the drawing was built to produce rather than something it found.
    function outlineLimit() {
      if (maxDeliveries > 1) {
        return 'Some templates below carry more than one delivery, so this reading can now show ' +
               'what a template buys.';
      }
      return 'Every template here has exactly one delivery, and that is a property of the ' +
             'drawing rather than a finding about the business: it draws one cohort, so a ' +
             'template can have at most one delivery in it. What a template is for, that it ' +
             'outlives its deliveries and is used again, cannot be seen at one to one, and this ' +
             'is the first view that could show it if a second cohort ever entered the model.';
    }

    function describe() {
      if (reading === 'calendar') {
        titleEl.textContent = 'The term, ' + sessions.length + ' sessions in date order';
        subEl.textContent = '';
        subEl.appendChild(document.createTextNode(
          sessions.length + ' sessions across ' + VIEWS.length + ' programmes, drawn from a term ' +
          'the model counts at ' + totalSessions + ' · ' + span.from + ' to ' + span.to +
          ' · ' + stateCounts + ' · ' + noInstructor + ' with no instructor named' +
          ' · ' + noRecording + ' with no recording'));
        subEl.appendChild(el('span', 'warn', 'every date here is invented'));
      } else {
        titleEl.textContent = 'The outline, ' + templates.length +
          ' session templates in curriculum order';
        subEl.textContent = '';
        subEl.appendChild(document.createTextNode(
          templates.length + ' templates across ' + VIEWS.length + ' programmes, drawn from a ' +
          'syllabus the model counts at ' + totalTemplates + ' · ' + templates.length +
          ' deliveries, at most ' + maxDeliveries + ' to a template · ' + noDuration +
          ' record no duration'));
        subEl.appendChild(el('span', 'warn', 'every value here is invented'));
      }

      noticeEl.textContent = '';
      NOTICE[reading].forEach(function (line, i) {
        noticeEl.appendChild(el('p', i === 0 ? 'term-invented' : 'term-finding', line));
      });
      if (reading === 'outline') {
        noticeEl.appendChild(el('p', 'term-finding', outlineLimit()));
      }

      if (calBtn) toggleCurrent(calBtn, reading === 'calendar');
      if (outBtn) toggleCurrent(outBtn, reading === 'outline');
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

    function groupRow(tb, cols, build) {
      var tr = document.createElement('tr');
      tr.className = 'term-group';
      var th = document.createElement('th');
      th.colSpan = cols;
      build(th);
      tr.appendChild(th);
      tb.appendChild(tr);
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
      sessions.forEach(function (s) {
        var m = s.date.slice(0, 7);
        if (m !== month) {
          month = m;
          var n = sessions.filter(function (x) { return x.date.slice(0, 7) === m; }).length;
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
      var cols = ['template', 'title', 'delivery', 'location', 'minutes', 'deliveries',
                  'delivered', 'drawn as'];
      var table = el('table', 'sheet-table term-table');
      head(table, cols);
      var tb = document.createElement('tbody');
      byProgramme.forEach(function (g) {
        var deliveries = g.templates.reduce(function (n, t) { return n + t.deliveries.length; }, 0);
        groupRow(tb, cols.length, function (th) {
          // The way back to the drawing the row came from, one per programme rather than one per
          // row: seven controls at the size this page requires, instead of 83 of them squeezed
          // into a table cell.
          var a = el('a', 'linkbtn', g.view.label || g.view.code);
          a.href = g.view.route;
          th.appendChild(a);
          th.appendChild(document.createTextNode(' · ' + g.templates.length +
            ' templates, ' + deliveries + (deliveries === 1 ? ' delivery' : ' deliveries')));
        });
        g.templates.forEach(function (t) {
          var tr = document.createElement('tr');
          if (!t.deliveries.length) tr.className = 'term-gap';
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
        });
      });
      table.appendChild(tb);
      return table;
    }

    function buildRows() {
      if (built === reading) return;
      built = reading;
      rowsEl.textContent = '';
      rowsEl.appendChild(reading === 'calendar' ? buildCalendar() : buildOutline());
      rowsEl.scrollTop = 0;
    }

    // ---- open, close, and the address ------------------------------------------
    function isOpen() { return !!sheet && !sheet.hidden; }

    function show(next) {
      var wasOpen = isOpen();
      if (!sheet) return;
      if (!next) {
        if (!wasOpen) return;
        reading = null;
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
      if (reading === next) return;
      reading = next;
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
      if (location.hash === CAL_ROUTE || location.hash === OUT_ROUTE) {
        try {
          history.replaceState(null, '', location.pathname + location.search + '#/');
        } catch (err) {
          location.hash = '#/';     // a file:// URL, where replaceState throws
        }
      }
      show(null);
    }

    function route() {
      var h = location.hash;
      show(h === CAL_ROUTE ? 'calendar' : (h === OUT_ROUTE ? 'outline' : null));
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
    function linkFor(n) {
      if (!n) return null;
      if (n.type === 'CohortSession') {
        return {
          href: CAL_ROUTE,
          text: 'see the term, all ' + sessions.length + ' sessions',
          hint: 'every session on the seven drawings, in date order, drawn from a term the ' +
                'model counts at ' + totalSessions + '. ' + noInstructor + ' have no instructor.'
        };
      }
      if (n.type === 'SessionTemplate') {
        return {
          href: OUT_ROUTE,
          text: 'see the outline, all ' + templates.length + ' session templates',
          hint: 'every template on the seven drawings, in curriculum order, drawn from a ' +
                'syllabus the model counts at ' + totalTemplates + '.'
        };
      }
      return null;
    }

    return {
      start: route,
      linkFor: linkFor,
      isOpen: isOpen,
      routes: [CAL_ROUTE, OUT_ROUTE],
      // What a driver is told, for the reason window.ZT publishes the view and the theme: whether
      // a table holds the rows it claims is a question that should be answered off the running
      // page rather than inferred from a screenshot of 83 rows.
      state: function () {
        return {
          open: isOpen(),
          reading: reading,
          sessions: sessions.length,
          sessionsTotal: totalSessions,
          templates: templates.length,
          templatesTotal: totalTemplates,
          programmes: VIEWS.length,
          noInstructor: noInstructor,
          noRecording: noRecording,
          maxDeliveries: maxDeliveries,
          from: span.from,
          to: span.to
        };
      }
    };
  };
})();
