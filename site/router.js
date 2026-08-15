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
  // ---- scope is a set, issue 136 ---------------------------------------------
  // THE PROGRAMME WAS THE ADDRESS AND IT IS NOW A SET IN THE ADDRESS. Until this card `#/p/ZSC`
  // named one drawing and there was no way to write down two, so "this week, across several
  // programmes" was unaskable by construction rather than by oversight. A set costs the parser one
  // separator and the reader nothing: `#/p/ZIB` is the same address it always was and resolves to
  // the same drawing, `#/p/ZIB+ZSC` is two, and `#/p/ALL` is every programme the document holds.
  //
  // `ALL` IS A WORD AND NOT A LIST, deliberately. A bookmark of all seven should still be all
  // eight the day an eighth programme is built, and a list of the seven keys frozen into somebody's
  // bookmark bar is a bookmark that silently stops being what it says. The word is the only token
  // in this file that is not a programme code, and `normCode` cannot produce it from any of them.
  var ALL = 'ALL';
  var JOIN = '+';

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

    // WHAT AN ADDRESS WITH NO OPINION DRAWS, AND ISSUE 136 TURNED IT OVER. It was the one
    // programme the document names as its default, and it is now every programme the document
    // holds. That is the inversion this card exists for: the cross-programme drawing is what the
    // tool is at rest, and one programme is a scope the reader narrows to, rather than the other
    // way round. `GI.default` is not deleted with it; it is what decides which of the seven is the
    // FIRST of the seven for everything that still has to name one, the cohort behind #/students
    // among them.
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

    // A scope is always in the build's own order and never in the order the address happened to
    // write it, which is what makes `#/p/ZSC+ZIB` and `#/p/ZIB+ZSC` the same picture rather than
    // two pictures of the same set. The sectors are laid out in that order too, so the order is
    // the one thing about the union a reader can rely on.
    function orderScope(list) {
      var seen = {}, out = [];
      VIEWS.forEach(function (v) {
        list.forEach(function (w) {
          if (w === v && !seen[v.key]) { seen[v.key] = true; out.push(v); }
        });
      });
      return out;
    }

    function scopeByCodes(seg) {
      if (normCode(seg) === ALL) return VIEWS.slice();
      var parts = String(seg).split(JOIN), got = [];
      parts.forEach(function (p) {
        var v = viewByCode(p);
        if (v) got.push(v);
      });
      return orderScope(got);
    }

    // null means "this address is not about a programme", which is not the same answer as the
    // scope and must not be collapsed into it.
    function scopeFromHash(h) {
      h = String(h || '');
      if (h.slice(0, PGPREFIX.length).toLowerCase() !== PGPREFIX) return null;
      var got = scopeByCodes(h.slice(PGPREFIX.length).split('/')[0].split('?')[0]);
      return got.length ? got : VIEWS.slice();
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
    // Issue 136. A scope of one is written the way it has always been written, off the view's own
    // `route`, so every address a reader has bookmarked, every link the panel writes and every one
    // of the fourteen the board and the sheet name resolve to the byte-identical drawing they
    // resolved to before this card. Only a set of more than one is spelled here.
    function addressFor(sc, g) {
      var tail = (g === 'modules' ? '/modules' : '');
      if (sc.length === 1) return (sc[0].route || (PGPREFIX + sc[0].key)) + tail;
      if (sc.length === VIEWS.length) return PGPREFIX + ALL + tail;
      return PGPREFIX + sc.map(function (v) { return v.key; }).join(JOIN) + tail;
    }

    // A VIEW IS CHOSEN BEFORE THE FIRST DRAW AND NEVER AFTER IT. Resolving the address here, at
    // construction, is what makes a deep link draw its own programme once rather than draw the
    // default and then replace it. A reader who follows a link to #/p/ZCFA and a reader who
    // clicks their way there see the same page produced by the same path.
    var pgScope = scopeFromHash(location.hash) || VIEWS.slice();
    // The one of the scope everything that still has to name a single programme names: the student
    // list's cohort, the tab title's code, and the drawing the panel's own links are built from.
    // It is the first in the build's order, which on the scope the page opens on is the document's
    // own default and on a scope of one is that one.
    var pgView = pgScope[0];
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
      // Issue 139 deleted the header's `students` link, so there is no nav item left to mark.
      // The roster is one cohort's list and the scope is a set: a header link to it opened the
      // roster of whichever programme happened to be first in scope and named none of them. The
      // address is unchanged and the way in is the cohort tile's own panel, where the link names
      // the cohort it is about. The body class below is what the heading and the stylesheet read.
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

    // ---- the scope rail, issue 136 ----------------------------------------------
    // WHAT WENT, AND WHY A MENU COULD NOT DO THIS. The control here was the programme's own name in
    // the heading, and pressing it opened the other six as links. It was the right control for the
    // question it answered, which is "which one of the seven", and that is the question this card
    // says was the wrong question: a control that CLOSES on a choice cannot express a set, and the
    // set is the whole capability the tool was missing. Eight chips, always visible, multi-select.
    //
    // EACH CHIP CARRIES ITS OWN POPULATION AT REST AND THAT IS NOT DECORATION. Five of the seven
    // documents hold a sample of their programme's term and two hold all of it, so a merged drawing
    // read without those fractions is a picture that invites being read as a fact about the
    // business. `IB 6/79` beside `BL 28/28` is the honesty constraint made ambient, and it travels
    // to the phone unchanged: hiding it behind a press on the small screen would delete the one
    // thing stopping the mixed drawing being misread, on the device where a reader is most likely
    // to glance rather than study. The numbers are the view's own `counts` block and are written
    // here from it, never typed, for the reason every other number in this file is read: a figure
    // typed into the page is right on one of seven.
    //
    // THEY ARE ANCHORS, WHICH IS THE ONE THING KEPT WHOLE FROM THE CONTROL THIS REPLACES. Each chip
    // is an ordinary link to the address the scope would become, so the keyboard, the middle mouse
    // button, the context menu and the back button all work without this file implementing any of
    // them, and there is one code path into a drawing rather than two: the hash changes and the one
    // listener below answers it. Nothing here decides what is drawn.
    //
    // A SCOPE CANNOT BE EMPTIED. The chip that is the only one selected links to its own address,
    // so pressing it changes nothing rather than leaving the reader looking at no programme at all,
    // and `All` is one press away from every state.
    //
    // A ROUTE CHANGE REFITS THE VIEW, and the alternative was to keep the reader's pan and zoom.
    // Keeping it is defensible while a switch is between two pictures of the same thing; these are
    // seven different drawings of seven different programmes and their unions, 587 to some
    // thousands of units tall, with different node counts and one of them missing a whole lane. A
    // reader zoomed into the agreement lane of one and moved to another would land on a rectangle
    // of another drawing chosen by arithmetic rather than by meaning. Two further reasons, both
    // about not lying to the reader: the zoom readout is a percentage OF THE FIT, so carrying k
    // across a change of extent silently changes what the number means, and a refit makes a
    // followed link and a clicked control produce the same screen, which is what lets somebody
    // paste an address and know what the other person saw.
    var pgRail = document.getElementById('pgrail');
    var pgChips = [];

    function inScope(v) {
      for (var i = 0; i < pgScope.length; i++) if (pgScope[i] === v) return true;
      return false;
    }

    // The scope this chip would leave behind: itself removed if it is in, itself added if it is
    // not, and itself alone if taking it out would leave nothing.
    function toggled(v) {
      if (!inScope(v)) return orderScope(pgScope.concat([v]));
      if (pgScope.length === 1) return pgScope.slice();
      return pgScope.filter(function (w) { return w !== v; });
    }

    // The short name on the chip. `Z-` is the company's own prefix on all seven codes and says
    // nothing that tells one from another, so it is dropped from the chip and kept everywhere the
    // code is the subject of a sentence. Read off the code rather than held as an eighth field.
    function shortCode(v) {
      return String(v.code || v.key).replace(/^Z-/, '');
    }

    // The fraction, in the same grammar the heading used to state for one programme: how many of
    // the programme's own sessions this document holds. A programme whose document holds all of
    // them reads `28/28`, which is a legitimate screen beside `6/79` and is the pair of numbers
    // this design refuses to reduce to one.
    function fractionOf(v) {
      var b = (v.counts || {}).CohortSession;
      if (!b || !b.total) return '';
      return b.drawn + '/' + b.total;
    }

    function chipTitle(v) {
      var b = (v.counts || {}).CohortSession, label = v.label || v.name || v.code;
      var pop = (!b || !b.total) ? label
        : label + ', ' + (b.drawn >= b.total
            ? 'all ' + b.total + ' of its sessions drawn'
            : b.drawn + ' of its ' + b.total + ' sessions drawn');
      if (!inScope(v)) return pop + '. Press to add it to the scope';
      if (pgScope.length === 1) return pop + '. It is the whole scope';
      return pop + '. Press to take it out of the scope';
    }

    function buildRail() {
      if (!pgRail) return;
      pgRail.textContent = '';
      pgChips = [];
      var all = document.createElement('a');
      all.className = 'chip chip-all';
      all.appendChild(el('span', 'chip-k', 'All'));
      pgRail.appendChild(all);
      pgChips.push({ v: null, a: all });
      VIEWS.forEach(function (v) {
        var a = document.createElement('a');
        a.className = 'chip';
        a.appendChild(el('span', 'chip-k', shortCode(v)));
        var f = fractionOf(v);
        if (f) a.appendChild(el('span', 'chip-n', f));
        pgRail.appendChild(a);
        pgChips.push({ v: v, a: a });
      });
    }

    function el(tag, cls, text) {
      var e = document.createElement(tag);
      e.className = cls;
      e.textContent = text;
      return e;
    }

    // Every chip's address and every chip's state, rewritten on every change of scope and of
    // grain, because both are in the address the chip links to.
    function describeRail() {
      pgChips.forEach(function (c) {
        var target = c.v ? toggled(c.v) : VIEWS.slice();
        c.a.href = addressFor(target, pgGrain);
        var on = c.v ? inScope(c.v) : pgScope.length === VIEWS.length;
        if (on) c.a.setAttribute('aria-current', 'true');
        else c.a.removeAttribute('aria-current');
        c.a.title = c.v ? chipTitle(c.v)
          : (pgScope.length === VIEWS.length
              ? 'all ' + VIEWS.length + ' programmes are drawn'
              : 'draw all ' + VIEWS.length + ' programmes');
      });
    }

    // ---- how much of the programme the drawing is, issue 122 --------------------
    // THE MODEL DECLARES IT AND THE PAGE HAD NEVER SAID IT WHERE A COUNT COULD BE READ. Every
    // view carries a `counts` block written by the build, and on five of the seven the cohort
    // sessions in it read `drawn` well under `total`. That card put the clause in the heading,
    // beside the programme name, because every other number in the header was otherwise a count
    // over a set the reader had no reason to think was partial.
    //
    // ISSUE 136 MOVED IT AND MULTIPLIED IT BY SEVEN. The heading named one programme and could
    // carry one clause; the rail names eight chips and every one of them carries its own, at rest,
    // at every width. `sampleClause` is gone rather than left standing with no caller, and
    // `fractionOf` above is what replaces it. The finding is the same finding and it is now stated
    // about every programme in scope instead of about the one on screen.

    // Every place on the page that names the programme, written from the scope rather than typed
    // into index.html, because a number or a name typed into that file is right on one of the
    // seven.
    //
    // AND WHAT IT SAYS WHEN THE SCOPE IS MORE THAN ONE, issue 136. Three things here name a single
    // programme: the cohort behind #/students, the tab title, and the accessible name of the whole
    // drawing. The first two go on naming the first of the scope, because they are about a list of
    // students and about telling two tabs apart and both of those need exactly one answer. The
    // third names the set, because the drawing IS the set and a screen reader told it is a diagram
    // of Z-IB would be told something false about six sevenths of it.
    function describeProgramme() {
      var v = pgView;
      var G = drawing();
      var label = v.label || v.name || v.code;
      describeRail();

      // The cohort, off its own node rather than out of a second list of names. The code is
      // dropped from the front of it because the sentence around it has just said the code.
      var coh = null;
      G.nodes.forEach(function (n) { if (n.type === 'Cohort' && !coh) coh = n; });
      var cohLabel = coh ? coh.label : '';
      if (v.code && cohLabel.indexOf(v.code + ' ') === 0) {
        cohLabel = cohLabel.slice(v.code.length + 1);
      }

      // THE HEADING'S SENTENCE WENT WITH THE PICKER, issue 136, and its two clauses are not lost.
      // It read `Z-IB Investment Banking, cohort 1Q26, 6 of its 79 sessions, as instances`, and of
      // that the sample clause is now on every chip in the rail, one per programme instead of one
      // for the one on screen, and the cohort is on the cohort's own tile where it always also
      // was. What a set cannot have is a single cohort, so the clause could not have survived a
      // scope of seven in any case: it would have named one of them over a drawing of all.

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
      svg.setAttribute('aria-label', pgScope.length === 1
        ? 'Instance diagram of programme ' + label + (cohLabel ? ', cohort ' + cohLabel : '')
        : 'Instance diagram of ' + pgScope.length + ' programmes, ' +
          pgScope.map(function (w) { return w.code || w.key; }).join(', '));
      document.title = (v.code ? v.code + ' \u00b7 ' : '') + PAGE_TITLE;

      // The sentence changed length, and below the breakpoint that can change how many lines the
      // header takes. The custom property that keeps the detail panel off the header's own buttons
      // is app.js's, so it is told rather than written here.
      if (onDescribed) onDescribed();
    }

    buildRail();

    // One listener, and it answers only the addresses that are about a programme. #/students and
    // #/board reach it too and it says nothing to them, which is what leaves the drawing where it
    // was while a reader looks at the list or the board.
    window.addEventListener('hashchange', function () {
      var sc = scopeFromHash(location.hash);
      if (!sc) return;
      // Issue 89. TWO THINGS THE ADDRESS CAN CHANGE AND THEY COST DIFFERENT WORK. A change of
      // scope replaces the drawing, the selection, the roster and the gaps; a change of grain
      // replaces the drawing and the selection and leaves the scope's own chrome exactly where it
      // is. Reported separately so that the wiring can do the smaller of the two when that is what
      // happened, and so that collapsing does not reset the reader's roster.
      var g = grainFromHash(location.hash) || 'sessions';
      var moved = !sameScope(sc, pgScope), altitude = g !== pgGrain;
      pgScope = sc;
      pgView = sc[0];
      pgGrain = g;
      if (moved && onView) onView(sc, g);
      else if (altitude && onGrain) onGrain(g, sc);
    });

    function sameScope(a, b) {
      if (a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
      return true;
    }

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
      // The one of the scope every caller that has to name a single programme names. Issue 136.
      view: function () { return pgView; },
      // And the whole of it, which is what the drawing is of. Handed out as a copy, because a
      // caller that could push onto it would be a second thing deciding what is drawn.
      scope: function () { return pgScope.slice(); },
      scopeRoute: function (sc, g) { return addressFor(sc, g === undefined ? pgGrain : g); },
      allRoute: function (g) { return addressFor(VIEWS.slice(), g === undefined ? pgGrain : g); },
      // Issue 89. The altitude, read and set through the address and never held anywhere else:
      // two copies of a state that is also in the URL is how a control and a link come to
      // disagree about what is on screen. `setGrain` navigates and answers nothing; the
      // hashchange listener above is what tells the page.
      grain: function () { return pgGrain; },
      grains: GRAINS.slice(),
      grainRoute: function (g) { return addressFor(pgScope, g); },
      setGrain: function (g) {
        if (GRAINS.indexOf(g) < 0 || g === pgGrain) return false;
        location.hash = addressFor(pgScope, g);
        return true;
      },
      rosterRoute: ROSTER_ROUTE,
      rosterOpen: rosterOpen,
      // Issue 136. There is no menu behind the scope any more: eight chips are on the row and
      // none of them opens a box, so the viewport's `busy` list and the capture suite ask this
      // and get the honest answer that nothing here is over the canvas.
      pgMenuOpen: function () { return false; }
    };
  };
})();
