// router: which of the addresses this page answers is on screen, and the two views an address
// switches between.
//
// Issue 71, seam 2 of issue 60. Two cards built this and touched nothing else: issue 51 added
// `#/students`, the student list and the panel link into it, and issue 66 added the seven
// `#/p/<CODE>` addresses and the control that navigates between them. Both were a route and the
// view that route brings up, filed and built as one thing, which is the owner's test answered
// twice.
//
// WHY THE STUDENT LIST IS IN HERE AND NOT IN A FILE OF ITS OWN. It is a view reached by an
// address, exactly as the drawing is. Splitting the address from the view it opens would put the
// two halves of issue 51 in two files and buy nothing: no card has ever changed one without the
// other. `#/board` is the third address and is answered by board.js, which listens for the same
// hashchange and owns the whole page while it is on; nothing here has an opinion about it.
//
// THIS FILE SWITCHES NO DRAWING. It resolves an address to a view, records which one that is,
// describes it in the chrome, and calls back. Redrawing, rebinding the selection and refitting the
// canvas are three modules' work in one order, so that order is written once, in app.js, which is
// the only file that knows all four exist.
//
// #/p/<CODE>, in the shape #/board and #/students already have. The code is matched with the
// punctuation and the case taken out, so the key the build writes (ZCFA), the code the drawing
// is captioned with (Z-CFA) and a hand-typed z-cfa all reach the same view; nothing is rewritten
// in the address bar, because both spellings are the programme's own and a page that silently
// edits the URL a reader typed is a page that is arguing with them.
//
// AN ADDRESS THAT IS NOT A PROGRAMME ADDRESS HAS NO OPINION, which is the difference between
// null and the default below and is the whole of the interaction with the other two routes.
// #/students and #/board say nothing about which programme is drawn, so they leave it alone: a
// reader on Z-CFA who opens the student list gets the Z-CFA cohort, and one who looks at the
// board and comes back to #/ finds Z-CFA still on the canvas. An address that IS a programme
// address and names nothing, #/p/ or #/p/NOPE, falls back to the default rather than drawing
// nothing, because the reader asked for a programme and the honest answer to an unknown one is
// the page they would have got with no code at all.
(function () {
  'use strict';

  var PGPREFIX = '#/p/';
  var ROSTER_ROUTE = '#/students';

  function normCode(s) {
    return String(s === null || s === undefined ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  var ZM = window.ZM = window.ZM || {};

  // opts.views        the seven joined views, in build order
  // opts.defaultKey   which of them an address with no opinion draws
  // opts.svg          the drawing, which is given its accessible name from the view
  // opts.drawing      function -> the CANONICAL drawing, for the cohort and the two counts. Not
  //                   the one on screen: issue 100 made the time window filter the picture, and
  //                   both of those are facts about the programme rather than about the window
  // opts.onView       called with a view when the address starts naming a different one
  // opts.onDescribed  called after the chrome has been rewritten, because the sentence changed
  //                   length and the header may have changed height with it
  ZM.router = function createRouter(opts) {
    var VIEWS = opts.views;
    var svg = opts.svg;
    var drawing = opts.drawing;
    var onView = opts.onView;
    var onGrain = opts.onGrain;
    var onDescribed = opts.onDescribed;

    var DEFAULT_VIEW = (function () {
      var want = normCode(opts.defaultKey);
      for (var i = 0; i < VIEWS.length; i++) if (normCode(VIEWS[i].key) === want) return VIEWS[i];
      return VIEWS[0];
    })();

    function viewByCode(code) {
      var c = normCode(code);
      if (!c) return null;
      for (var i = 0; i < VIEWS.length; i++) {
        if (normCode(VIEWS[i].key) === c || normCode(VIEWS[i].code) === c) return VIEWS[i];
      }
      return null;
    }

    // null means "this address is not about a programme", which is not the same answer as the
    // default and must not be collapsed into it.
    function viewFromHash(h) {
      h = String(h || '');
      if (h.slice(0, PGPREFIX.length).toLowerCase() !== PGPREFIX) return null;
      return viewByCode(h.slice(PGPREFIX.length).split('/')[0].split('?')[0]) || DEFAULT_VIEW;
    }

    // ---- the altitude, issue 89 ------------------------------------------------
    // WHY IT IS IN THE ADDRESS AT ALL. Every other state on this page that changes what is on the
    // canvas is: which programme, which sheet, which scope. A collapsed drawing that could not be
    // linked would be the one view somebody could not send to somebody else, on an artefact whose
    // whole point is that a reader can hand the picture over.
    //
    // A SECOND SEGMENT AND NOT A QUERY. `#/p/ZBL/modules` reads as the same programme seen
    // differently, which is what it is, and it costs the existing parser nothing: the code was
    // already taken as the FIRST segment, so every address that worked yesterday still resolves
    // to the same view today.
    //
    // AN UNKNOWN SEGMENT IS THE SESSIONS GRAIN, which is the same answer the code half gives an
    // unknown programme: the reader asked for a drawing and the honest response to a suffix
    // nobody recognises is the drawing they would have got without it.
    var GRAINS = ['sessions', 'modules'];

    function grainFromHash(h) {
      h = String(h || '');
      if (h.slice(0, PGPREFIX.length).toLowerCase() !== PGPREFIX) return null;
      var seg = (h.slice(PGPREFIX.length).split('?')[0].split('/')[1] || '').toLowerCase();
      return GRAINS.indexOf(seg) > 0 ? seg : 'sessions';
    }

    // The address for one view at one grain, built HERE and nowhere else, which is the rule
    // watchdog B's `#/p/Z-ZIB` false alarm left behind: a route constructed in a second place is
    // a route that can be constructed wrong. The instance document ships each view's own `route`
    // and this is the one function allowed to put a grain on the end of it.
    function addressFor(v, g) {
      return (v.route || (PGPREFIX + v.key)) + (g === 'modules' ? '/modules' : '');
    }

    // A VIEW IS CHOSEN BEFORE THE FIRST DRAW AND NEVER AFTER IT. Resolving the address here, at
    // construction, is what makes a deep link draw its own programme once rather than draw the
    // default and then replace it. A reader who follows a link to #/p/ZCFA and a reader who
    // clicks their way there see the same page produced by the same path.
    var pgView = viewFromHash(location.hash) || DEFAULT_VIEW;
    // Issue 89, and it is resolved here at construction for the reason the view above it is: a
    // reader following a link to a collapsed drawing should get the collapsed drawing on the
    // FIRST paint, not the expanded one replaced a frame later.
    var pgGrain = grainFromHash(location.hash) || 'sessions';

    var PAGE_TITLE = document.title;

    // ---- the whole cohort, as a list -------------------------------------------
    // The drawing answers "what shape is a student" and draws four of the thirty four, because a
    // model diagram that drew all of them would be a register with arrows. This view answers the
    // other question, "who is in the cohort", and answers it completely. It is a route of its own
    // beside the board's, not a way out of a limitation: the count under the students card and
    // this list are two halves of the same honesty, one saying how many the picture left out and
    // the other showing them.
    //
    // The rows come from the drawing's own generated file, so they are covered by both values a
    // feedback note carries: the commit, which pins every byte of the deployed site, and the
    // drawing digest, which pins the geometry and the rows inside it. Nothing in this file knows
    // a student's name.
    //
    // It is an overlay and not a third main. The board replaces the diagram, which takes the
    // canvas off the screen and hands its ResizeObserver a box of nothing; that is a path this
    // page already walks and survives, and there was no reason to walk it twice. Over the top, the
    // canvas keeps its size and its view, and the backdrop makes it inert while the list is up:
    // the wheel listener is on the canvas and never sees an event over the backdrop.
    var rosterEl = document.getElementById('roster');
    var rosterBuilt = false;
    var rosterReturn = null;        // what had focus when the list was opened

    function rosterOpen() { return !!rosterEl && !rosterEl.hidden; }

    function cell(row, text, cls) {
      var td = document.createElement('td');
      if (cls) td.className = cls;
      td.textContent = text;
      row.appendChild(td);
      return td;
    }

    function buildRoster() {
      var G = drawing();
      if (rosterBuilt || !rosterEl || !G || !G.roster) return;
      rosterBuilt = true;
      var r = G.roster, rows = r.rows || [];

      // Which cohort, by name. There are seven of them now and this view is whichever one the
      // canvas behind it is drawing, so a list headed "The cohort" would be the same heading over
      // seven different sets of rows.
      document.getElementById('rostertitle').textContent =
        'The ' + (pgView.code ? pgView.code + ' ' : '') + 'cohort, all ' + r.n + ' students';

      // Counted off the rows rather than written down, so the summary cannot disagree with the
      // table under it, and so it stays true if a row changes.
      var states = {}, order = [];
      rows.forEach(function (x) {
        if (states[x.state] === undefined) { states[x.state] = 0; order.push(x.state); }
        states[x.state]++;
      });
      var sub = document.getElementById('rostersub');
      // No chip after it, issues 91 and 93. This list carried the same subtitle chip the term
      // sheet carried, in the same idiom, and it is the same defect one route along: the footer
      // says it once for the page and a second copy over the rows makes the first weaker. He
      // asked for the marks to go and said "all of them", so the sheet next door does not get to
      // keep one because the cards were filed from the other.
      sub.textContent = rows.length + ' rows · ' + r.drawn + ' of them drawn on the canvas · ' +
        order.map(function (s) { return states[s] + ' ' + s; }).join(', ');

      var table = document.createElement('table');
      // .sheet-table, because the box this list sits in is the same box #/calendar and #/outline
      // sit in and there is one stylesheet block for all three. Issues 80 and 82.
      table.className = 'sheet-table';
      var thead = document.createElement('thead');
      var hr = document.createElement('tr');
      ['student', 'name', 'university', 'born', 'enrolment', 'charge', 'on the canvas']
        .forEach(function (h) {
          var th = document.createElement('th');
          th.textContent = h;
          hr.appendChild(th);
        });
      thead.appendChild(hr);
      table.appendChild(thead);

      var tb = document.createElement('tbody');
      rows.forEach(function (x) {
        var tr = document.createElement('tr');
        if (x.node) tr.className = 'roster-drawn';
        cell(tr, x.id, 'r-id');
        cell(tr, x.name, 'r-name');
        cell(tr, x.uni);
        cell(tr, x.yob, 'r-num');
        cell(tr, x.enrol, 'r-id');
        cell(tr, x.state, 'r-state');
        // The four the drawing carries say which tile they are, in the key a feedback note would
        // report, so the list and the canvas can be talked about in the same words.
        cell(tr, x.node ? 'drawn as ' + x.node : '', 'r-drawn');
        tb.appendChild(tr);
      });
      table.appendChild(tb);
      var host = document.getElementById('rosterrows');
      host.textContent = '';
      host.appendChild(table);
    }

    // A different programme is a different cohort, so the list built for the last one is thrown
    // away rather than reused. buildRoster() is a once-per-load function guarded by a flag, which
    // was true while there was one cohort; the flag is what is reset here, and the rows with it, so
    // that the next open builds from the drawing that is now on the canvas. Rebuilt at once if the
    // list happens to be open, which is reachable with the back button from #/students to a
    // programme address and back.
    function resetRoster() {
      rosterBuilt = false;
      var host = document.getElementById('rosterrows');
      if (host) host.textContent = '';
      if (rosterOpen()) buildRoster();
    }

    function showRoster(on) {
      if (!rosterEl || rosterOpen() === on) return;
      if (on) {
        buildRoster();
        rosterReturn = document.activeElement;
        rosterEl.hidden = false;
        var close = document.getElementById('rosterclose');
        if (close && close.focus) close.focus();
      } else {
        // Focus is put back where it came from, unless it has already moved on or the element it
        // came from is a node that is no longer painted.
        rosterEl.hidden = true;
        if (rosterReturn && rosterReturn.focus && document.contains(rosterReturn) &&
            rosterReturn.getAttribute && rosterReturn.getAttribute('tabindex') !== null) {
          rosterReturn.focus();
        }
        rosterReturn = null;
      }
      var nav = document.getElementById('navstudents');
      if (nav) {
        if (on) nav.setAttribute('aria-current', 'page');
        else nav.removeAttribute('aria-current');
      }
      // The heading says what is on screen, and what is on screen here is the list. One class on
      // the body and the stylesheet picks the variant, which is the mechanism board.js already
      // uses for #/board and the mechanism the subtitle used before the heading took its job. It
      // is set here rather than off the hash, beside the aria-current above, because this is the
      // one place that knows the list is open: the list can be closed by Escape or by the
      // backdrop, neither of which is a hashchange anything else would hear. Issue 77.
      document.body.classList.toggle('students', on);
    }

    // Closing is a navigation, because opening was one. replaceState rather than another hash
    // write: the entry that is being left is the list, so replacing it means the back button goes
    // to whatever the reader was on before they opened it rather than back into the list they just
    // closed. It fires no hashchange, so the close is done here rather than waiting for one.
    function closeRoster() {
      if (location.hash === ROSTER_ROUTE) {
        try {
          history.replaceState(null, '', location.pathname + location.search + '#/');
        } catch (err) {
          location.hash = '#/';   // a file:// URL, where replaceState throws
        }
      }
      showRoster(false);
    }

    function rosterRoute() { showRoster(location.hash === ROSTER_ROUTE); }

    if (rosterEl) {
      document.getElementById('rosterclose').addEventListener('click', closeRoster);
      document.getElementById('rosterback').addEventListener('click', closeRoster);
      // Escape, in the capture phase, so it beats the bubble listener in selection.js that clears
      // the selection: closing the list must not also throw away the node the reader had open
      // behind it. Capture mode is left alone deliberately. While it is on, Escape is how a reader
      // leaves it, feedback.js takes that Escape in its own capture listener, and a list that also
      // grabbed the key would make the way out of capture mode depend on what else is open.
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || !rosterOpen()) return;
        if (document.body.classList.contains('fb-mode')) return;
        e.preventDefault();
        e.stopPropagation();
        closeRoster();
      }, true);
      // The board is the other route and owns the whole page, so arriving there closes this.
      window.addEventListener('hashchange', rosterRoute);
    }

    // ---- moving between the seven ----------------------------------------------
    // The control is the programme's own name in the subtitle, which was already the sentence
    // saying what is on screen. It costs the header no row and the nav no item, which was the
    // constraint: issue 32 reclaimed a row by deleting the legend and issue 57 protected it, and a
    // sixth .linkbtn in the nav would have pushed `board` towards the edge at 390px, where the nav
    // already wraps when capture mode widens the feedback toggle.
    //
    // WHAT PRESSING IT OPENS IS SEVEN LINKS AND NOT A WIDGET. The theme toggle cycles because it
    // has three states and any of them is one press away; seven is not, and a reader looking for
    // one programme should not have to walk past four others to reach it. Ordinary anchors to the
    // seven addresses mean the keyboard, the middle mouse button, the context menu and the back
    // button all work without this file implementing any of them, and the navigation goes through
    // the hash exactly as it would if the reader had typed it, so there is one code path into a
    // view and not two.
    //
    // A ROUTE CHANGE REFITS THE VIEW, and the alternative was to keep the reader's pan and zoom.
    // Keeping it is defensible while a switch is between two pictures of the same thing; these are
    // seven different drawings of seven different programmes, 576 to 610 units tall, with different
    // node counts and one of them missing a whole lane. A reader zoomed into the agreement lane of
    // one and moved to another would land on a rectangle of another drawing chosen by arithmetic
    // rather than by meaning. Two further reasons, both about not lying to the reader: the zoom
    // readout is a percentage OF THE FIT, so carrying k across a change of extent silently changes
    // what the number means, and a refit makes a followed link and a clicked control produce the
    // same screen, which is what lets somebody paste an address and know what the other person saw.
    var pgBtn = document.getElementById('pgbtn');
    var pgMenu = document.getElementById('pgmenu');
    var pgItems = [];

    function pgMenuOpen() { return !!pgMenu && !pgMenu.hidden; }

    function openPgMenu() {
      if (!pgMenu || pgMenuOpen()) return;
      pgMenu.hidden = false;
      if (pgBtn) pgBtn.setAttribute('aria-expanded', 'true');
    }

    function closePgMenu(refocus) {
      if (!pgMenuOpen()) return;
      pgMenu.hidden = true;
      if (pgBtn) pgBtn.setAttribute('aria-expanded', 'false');
      if (refocus && pgBtn && pgBtn.focus) pgBtn.focus();
    }

    function buildPgMenu() {
      if (!pgMenu) return;
      pgMenu.textContent = '';
      pgItems = [];
      VIEWS.forEach(function (v) {
        var a = document.createElement('a');
        a.className = 'pgitem';
        // Issue 89. The href carries the grain the reader is on, so moving between programmes
        // keeps the altitude. It is rewritten in describeProgramme() on every change rather than
        // frozen here, because the menu is built once and the grain is not.
        a.href = addressFor(v, pgGrain);
        a.textContent = v.label || v.name || v.code;
        // The list closes on the way out. The navigation itself is the anchor's, so nothing here
        // decides which view is drawn: the hash changes, and the one listener below answers it.
        a.addEventListener('click', function () { closePgMenu(false); });
        pgMenu.appendChild(a);
        pgItems.push({ v: v, a: a });
      });
    }

    // ---- how much of the programme the drawing is, issue 122 --------------------
    // THE MODEL DECLARES IT AND THE PAGE HAD NEVER SAID IT WHERE A COUNT COULD BE READ. Every
    // view carries a `counts` block written by the build, and on five of the seven the cohort
    // sessions in it read `drawn` well under `total`. The band captions on the canvas say so and
    // nothing else did, so every number in the header was a count over a set the reader had no
    // reason to think was partial.
    //
    // THE SESSIONS GRAIN IS THE POPULATION AT BOTH ALTITUDES, which is why this reads the view
    // rather than the drawing on screen. `pgView` is always the sessions view, app.js's
    // pairGrains() sees to that, and which rows the DOCUMENT holds is a property of the document
    // and not of the altitude it is drawn at: collapsing Z-IB into modules re-expresses the same
    // six sessions and does not acquire the other seventy three.
    //
    // AND THE COMPLETE CASE SAYS SO IN WORDS RATHER THAN BY SAYING NOTHING. #120's idiom is that
    // a denominator appears only when something is taking rows off, and it works there because
    // the reading is always on screen and only its shape changes. A clause that vanished would
    // leave a reader unable to tell a complete programme from a card that forgot, which is the
    // state this one was filed about. So both cases are printed and the two read differently:
    // `all 25 of its sessions` against `6 of its 79 sessions`.
    function sampleClause(v) {
      var b = (v.counts || {}).CohortSession;
      if (!b || !b.total) return '';
      return b.drawn >= b.total
        ? ', all ' + b.total + ' of its sessions'
        : ', ' + b.drawn + ' of its ' + b.total + ' sessions';
    }

    // Every place on the page that names the programme, written from the view rather than typed
    // into index.html, because a number or a name typed into that file is right on one of the
    // seven.
    function describeProgramme() {
      var v = pgView;
      var G = drawing();
      var label = v.label || v.name || v.code;
      if (pgBtn) {
        pgBtn.textContent = label;
        pgBtn.title = 'programme drawn: ' + label + '. Press for the other ' + (VIEWS.length - 1);
      }
      pgItems.forEach(function (it) {
        it.a.href = addressFor(it.v, pgGrain);
        if (it.v === v) it.a.setAttribute('aria-current', 'true');
        else it.a.removeAttribute('aria-current');
      });

      // The cohort, off its own node rather than out of a second list of names. The code is
      // dropped from the front of it because the sentence has just said the code.
      var coh = null;
      G.nodes.forEach(function (n) { if (n.type === 'Cohort' && !coh) coh = n; });
      var cohLabel = coh ? coh.label : '';
      if (v.code && cohLabel.indexOf(v.code + ' ') === 0) {
        cohLabel = cohLabel.slice(v.code.length + 1);
      }
      var cohEl = document.getElementById('subcohort');
      if (cohEl) cohEl.textContent = cohLabel;

      // HOW MUCH OF THE PROGRAMME THIS DRAWING HOLDS, issue 122, and it is the same rule as the
      // cohort above it: read off the view rather than typed, because a number typed here is right
      // on one of seven. The argument for it being in the heading at all is in index.html beside
      // the markup.
      var sampEl = document.getElementById('subsample');
      if (sampEl) sampEl.textContent = sampleClause(v);

      // The heading's third variant, the one #/students brings up. It names the programme by its
      // code rather than by its label because the sentence around it is short and there are seven
      // cohorts, one per programme, so "the cohort" over a list of thirty four people would be the
      // same heading over seven different sets of rows. Issue 77.
      var hsp = document.getElementById('hstudprog');
      if (hsp) hsp.textContent = v.code || label;

      // THE FOOTER'S TWO COUNTS WERE WRITTEN HERE and they are gone with the sentence that held
      // them, issue 110. They were `#footn` and `#footdrawn`, the cohort's size and how many of it
      // the picture drew, written from the drawing because the cohorts are 34, 27, 21, 18, 24, 16
      // and 30 and a number typed into the footer would have been right on one of seven. Nothing
      // else read either element, so the writers went rather than being left addressing ids that
      // no longer exist. The same two numbers are still on the page where they answer a question a
      // reader asked: the students card carries the count it left out, and the panel's way into
      // #/students says how many of the list are drawn here.

      // The drawing has no text in it saying what it is of, so this is the only name a screen
      // reader gets for the whole svg, and the tab title is what a second window is told apart by.
      svg.setAttribute('aria-label',
        'Instance diagram of programme ' + label + (cohLabel ? ', cohort ' + cohLabel : ''));
      document.title = (v.code ? v.code + ' · ' : '') + PAGE_TITLE;

      // The sentence changed length, and below the breakpoint that can change how many lines the
      // header takes. The custom property that keeps the detail panel off the header's own buttons
      // is app.js's, so it is told rather than written here.
      if (onDescribed) onDescribed();
    }

    if (pgBtn && pgMenu) {
      buildPgMenu();

      pgBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (pgMenuOpen()) closePgMenu(false);
        else openPgMenu();
      });
      // Down into the list from the button, which is the disclosure keyboard and costs one line.
      pgBtn.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowDown' && e.key !== 'Down') return;
        e.preventDefault();
        openPgMenu();
        if (pgItems.length) pgItems[0].a.focus();
      });
      pgMenu.addEventListener('keydown', function (e) {
        var i = pgItems.map(function (it) { return it.a; }).indexOf(document.activeElement);
        if (e.key === 'ArrowDown' || e.key === 'Down') {
          e.preventDefault();
          if (pgItems.length) pgItems[Math.min(pgItems.length - 1, i + 1)].a.focus();
        } else if (e.key === 'ArrowUp' || e.key === 'Up') {
          e.preventDefault();
          if (i <= 0) { if (pgBtn.focus) pgBtn.focus(); }
          else pgItems[i - 1].a.focus();
        } else if (e.key === 'Home') {
          e.preventDefault();
          if (pgItems.length) pgItems[0].a.focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          if (pgItems.length) pgItems[pgItems.length - 1].a.focus();
        }
      });
      // Anywhere else on the page closes it, and so does tabbing out of it. Both are read off the
      // one container, so neither has to know what the list is made of.
      document.addEventListener('click', function (e) {
        var t = e.target;
        if (t && t.closest && t.closest('#pgpick')) return;
        closePgMenu(false);
      });
      document.addEventListener('focusin', function (e) {
        var t = e.target;
        if (t && t.closest && t.closest('#pgpick')) return;
        closePgMenu(false);
      });
      // Escape, in the capture phase, ahead of the bubble listener that clears the selection: a
      // reader who opens the list and changes their mind must not also lose the node they had open
      // behind it. Capture mode is left alone for the reason the student list leaves it alone,
      // that Escape is how a reader gets out of capture mode.
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || !pgMenuOpen()) return;
        if (document.body.classList.contains('fb-mode')) return;
        e.preventDefault();
        e.stopPropagation();
        closePgMenu(true);
      }, true);
    }

    // One listener, and it answers only the addresses that are about a programme. #/students and
    // #/board reach it too and it says nothing to them, which is what leaves the drawing where it
    // was while a reader looks at the list or the board.
    window.addEventListener('hashchange', function () {
      var v = viewFromHash(location.hash);
      if (!v) return;
      // Issue 89. TWO THINGS THE ADDRESS CAN CHANGE AND THEY COST DIFFERENT WORK. A change of
      // programme replaces the drawing, the selection, the roster and the gaps; a change of grain
      // replaces the drawing and the selection and leaves the programme's own chrome exactly
      // where it is. Reported separately so that the wiring can do the smaller of the two when
      // that is what happened, and so that collapsing does not reset the reader's roster.
      var g = grainFromHash(location.hash) || 'sessions';
      var moved = v !== pgView, altitude = g !== pgGrain;
      pgView = v;
      pgGrain = g;
      if (moved && onView) onView(v, g);
      else if (altitude && onGrain) onGrain(g, v);
    });

    return {
      // Called once, after the first drawing is on the canvas: the list is built from the drawing
      // and the description reads the drawing's own cohort and counts, so neither can run before
      // there is one.
      start: function () {
        rosterRoute();
        describeProgramme();
      },
      describe: describeProgramme,
      resetRoster: resetRoster,
      view: function () { return pgView; },
      // Issue 89. The altitude, read and set through the address and never held anywhere else:
      // two copies of a state that is also in the URL is how a control and a link come to
      // disagree about what is on screen. `setGrain` navigates and answers nothing; the
      // hashchange listener above is what tells the page.
      grain: function () { return pgGrain; },
      grains: GRAINS.slice(),
      grainRoute: function (g) { return addressFor(pgView, g); },
      setGrain: function (g) {
        if (GRAINS.indexOf(g) < 0 || g === pgGrain) return false;
        location.hash = addressFor(pgView, g);
        return true;
      },
      rosterRoute: ROSTER_ROUTE,
      rosterOpen: rosterOpen,
      pgMenuOpen: pgMenuOpen
    };
  };
})();
