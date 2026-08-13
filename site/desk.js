// THE DESK, ISSUE 130, AND IT IS A SECOND SCREEN AT A SECOND ADDRESS ON PURPOSE.
//
// Issue 129 said the header carries design inertia and asked for a redesign from first principles
// by a committee told nothing about how this page is built. The committee reported; the owner
// chose to have its Card 1 built BESIDE the page rather than over it, so he can judge the two
// against each other. That decision is the one address this repository has spent all week
// refusing to spend: every card since #120 has held the count at 33 and taken its feature onto an
// address that already existed. This is 34, once, by his explicit choice, and the assertion that
// pinned 33 is re-cut to 34 in the open rather than deleted.
//
// WHAT IT IS. The twenty two fixable gaps as one screen, in session date order, each row naming
// the record that holds the empty field. One line of chrome carrying three readings and one
// control. Nothing else: no name field, no dossier, no search, no per-programme roster. Those are
// the committee's Cards 2 and 3.
//
// THE FIVE RULES IT IS BUILT ON, ALL OF THEM MEASURABLE, ALL OF THEM ASSERTED IN scripts/smoke.mjs.
//
//   1. NO NUMBER MIXES THE TWO KINDS OF MISSING. The page's own header has said `gaps 11 of 95`
//      since #98, and #125 split that 95 into 22 a person can close this week and 73 no effort
//      inside the tooling that exists can touch. This screen prints the 22 and never the 95. The
//      join is the model's own registry, `routes.classes[<class>].system`, exactly as #125 drew
//      it: a class with a system has rows somebody can open and edit; a class without one has
//      nowhere for the fact to be written at all.
//   2. THE DENOMINATOR IS WELDED TO THE NOUN, INSIDE THE ROW. `Investment Banking 6/79` is one
//      text node, not a name in one span and a fraction in another, so no reflow, crop or
//      screenshot can separate a count from the base it is a count over.
//   3. A BARE INTEGER COUNTS A POPULATION HELD WHOLE; A FRACTION COUNTS RECORDS. The 22, the 11,
//      the 6, the 5 and the six counts in the closing sentence are bare because the tool holds
//      every one of the things they count. Every programme is a fraction because the tool holds 6
//      of Investment Banking's 79 sessions and saying `Investment Banking` bare would invite a
//      reader to state a fact about the business that is a fact about the extract.
//   4. ABSENCE IS NEVER RENDERED. No `0`, no empty row, no "nothing scheduled", for any
//      programme, anywhere. The cost was accepted knowingly by the committee and is real: Big Law
//      and Strategy Consulting draw their whole syllabus and have no fixable gap at all, and the
//      legitimate zero that is a true fact about them is lost. That is the price of a rule with no
//      exceptions, which is the only kind a reader retains.
//   5. TIME POSITIONS A SESSION, TIME NEVER SIZES ONE. `duration_min` is absent on 38 of the 83
//      drawn session templates, so no time proportional drawing is licensed: there is no hour
//      grid, no bar and no row whose height owes anything to a duration. Date order is the whole
//      of what time does here.
//
// AND IT DOES NOT LOOK ACTIONABLE WHERE IT CANNOT WRITE. This page is a read only extract. So
// there is no button, no checkbox, no dismiss and no progress bar on this screen: a bar asserts
// that the 73 can be finished, which is false. The single control is the way back to the page,
// and it is the way back rather than anything else because it is also the way to every other
// control this product has, including the one that files a report about this screen.
//
// THE OBJECTION THE COMMITTEE RAISED AGAINST ITSELF, WHICH IS NOT PAPERED OVER HERE. The only
// defect this surface can recognise is an empty field, so its whole notion of needing him is
// clerical. The 53 sessions of the two complete programmes generate no rows at all, and they are
// exactly where a trustworthy management exception could live: an instructor booked twice in one
// day, a cohort with a five week hole, a module taught before its prerequisite. The answer is
// structural and partial, and it is the reason this shape was worth building rather than a defence
// of it: `render` below takes its blocks as data and knows nothing about which three it is given,
// so a fourth exception class is a fourth entry in `blocks` and costs no chrome, no new glyph and
// no new explanation. scripts/smoke.mjs proves that by handing this module a fourth block of a
// kind that is not an empty field at all and measuring that the chrome, the marks and the closing
// sentence do not move.
//
// AND THE DECAY THE COMMITTEE DESIGNED FOR CANNOT RUN ON THIS EXTRACT, WHICH IS SAID HERE RATHER
// THAN QUIETLY DROPPED. The design has the eleven dated rows leave the block as their dates pass,
// so the screen drains with the calendar even on a frozen snapshot. Every session in this model is
// before 2026-06-28 and the real clock is past it, so a filter on today empties the block, and
// #90 already settled that this page may not invent a today to avoid that. So the eleven are
// sorted by session date and none is withheld, and the third reading is the reader's own date,
// which is what `today` honestly means here.
(function () {
  'use strict';

  var ROUTE = '#/desk';

  // ---- the model -------------------------------------------------------------------------
  // Everything below is derived from window.GI. Nothing on this screen is a number typed into
  // this file, for the reason every other module in site/ gives: a number typed here is right on
  // the day it is typed.

  // What a gap of each kind is called, and what the record it lives in is called. A pair that is
  // not in these tables still renders, through the fallbacks under them, which is half of what
  // makes a fourth exception class free.
  var HEADING = {
    'cohort-session/teacher_assigned': 'NO INSTRUCTOR NAMED',
    'company-colaboradora/cohort_that_attended': 'NO COHORT NAMED',
    'instructor/employer': 'NO EMPLOYER RECORDED'
  };
  // THE SECOND BLOCK IS NOT CALLED WHAT THE COMMITTEE CALLED IT, and that is a correction rather
  // than a liberty. Its sketch reads `NO SPONSOR LINKED` over rows naming cohorts, and the field
  // is `cohort_that_attended` on the collaborating company: six sponsor companies host a visit and
  // none of them records which cohort came. Written the committee's way, the heading names one end
  // of the relation and every row under it names the other, and the record a reader would go and
  // edit is the one the heading does not mention. Six cohorts have a sponsor; one does not.
  var MARK = {
    'cohort-session/teacher_assigned': 'no instructor',
    'company-colaboradora/cohort_that_attended': 'no cohort',
    'instructor/employer': 'no employer'
  };
  var NOUN = {
    'cohort-session': 'session',
    'company-colaboradora': 'sponsor',
    'instructor': 'instructor'
  };
  // The six facts no system anywhere records, named as the fact and not as the column. This is the
  // closing sentence and it is the only place the grey mark is explained.
  var UNRECORDED = {
    'session-template/duration_min': 'how long a session runs',
    'session-template/location_mode': 'where it happens',
    'session-template/module_name': 'which module it covers',
    'cohort/cohort_id': 'which identifier a cohort has',
    'session-template/delivery_mode': 'how it is delivered',
    'programme/modules': 'which modules a programme contains'
  };
  var WORDS = ['no', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function spaced(s) { return String(s).replace(/[_-]+/g, ' '); }
  function heading(key, field) {
    return HEADING[key] || ('NO ' + spaced(field).toUpperCase() + ' RECORDED');
  }
  function mark(key, field) { return MARK[key] || ('no ' + spaced(field)); }
  function noun(cls) { return NOUN[cls] || spaced(cls); }
  function word(n) { return WORDS[n] || String(n); }

  function props(n) {
    var p = {};
    (n.props || []).forEach(function (r) { if (p[r.k] === undefined) p[r.k] = r.v; });
    return p;
  }
  // Whether a named field of a node is one the model records as absent. Read off the flag and not
  // off the value, because `not recorded` is a string somebody could also have typed into a field
  // that is present.
  function absent(n, k) {
    var rows = n && n.props ? n.props : [], i;
    for (i = (n.route || 0); i < rows.length; i++) {
      if (rows[i].k === k) return rows[i].f === 'absent';
    }
    return false;
  }
  function value(n, k) {
    var rows = n && n.props ? n.props : [], i;
    for (i = 0; i < rows.length; i++) if (rows[i].k === k) return rows[i].v;
    return null;
  }

  // A date the model carries, as the row prints it. The strings are `YYYY-MM-DD HH:MM`, so this
  // reads the three numbers rather than handing them to Date(), which would apply a timezone to a
  // date that has none.
  function dayOf(at) {
    var d = String(at || '').split(' ')[0].split('-');
    if (d.length !== 3) return '';
    var t = new Date(Date.UTC(+d[0], +d[1] - 1, +d[2]));
    return DAYS[t.getUTCDay()] + ' ' + (+d[2]) + ' ' + MONTHS[+d[1] - 1];
  }
  // The reader's own day, with its year, because a page that prints a bare day beside a term that
  // ended in another one is inviting the reader to read it as inside the term.
  function todayLine(now) {
    var t = now || new Date();
    return DAYS[t.getDay()] + ' ' + t.getDate() + ' ' + MONTHS[t.getMonth()] + ' ' +
           t.getFullYear();
  }

  // The programme noun with its own fraction welded on, which rule 2 is about. `counts` is the
  // view's own block and the two numbers in it are the sessions the drawing holds and the sessions
  // the syllabus has.
  function programme(v) {
    var b = (v.counts || {}).CohortSession || { drawn: 0, total: 0 };
    return v.name + ' ' + b.drawn + '/' + b.total;
  }

  // The whole split, in one walk of the document. The boundary rules are #125's and are repeated
  // here rather than imported because term.js's copy answers a different question in a different
  // place: the ghosts are the absence itself rather than a hole in something present, and the rows
  // before `n.route` say how a class gets filled at all and are the same fact on every tile of it.
  function split() {
    var GI = window.GI, reg = GI.routes.classes, by = {}, order = [], unrec = {}, unrecOrder = [];
    GI.views.forEach(function (v) {
      var byId = {}, tmpl = {}, coh = {};
      v.nodes.forEach(function (n) { byId[n.id] = n; });
      v.edges.forEach(function (e) {
        if (e.v === 'instance of') tmpl[e.s] = e.t;
        if (e.v === 'scheduled for') coh[e.s] = e.t;
      });
      v.nodes.forEach(function (n) {
        if (n.ghost) return;
        var rows = n.props || [], i, p, key;
        for (i = (n.route || 0); i < rows.length; i++) {
          p = rows[i];
          if (p.f !== 'absent') continue;
          key = n['class'] + '/' + p.k;
          if (reg[n['class']] && reg[n['class']].system) {
            if (!by[key]) {
              order.push(key);
              by[key] = { key: key, cls: n['class'], field: p.k, heading: heading(key, p.k),
                          mark: mark(key, p.k), noun: noun(n['class']), n: 0, rows: [] };
            }
            by[key].n++;
            by[key].rows.push(row(by[key], n, v, byId, tmpl, coh));
          } else {
            if (unrec[key] === undefined) { unrecOrder.push(key); unrec[key] = 0; }
            unrec[key]++;
          }
        }
      });
    });
    return { blocks: order.map(function (k) { return by[k]; }),
             unrecorded: unrecOrder.map(function (k) {
               return { key: k, what: UNRECORDED[k] || spaced(k), n: unrec[k] };
             }) };
  }

  // One row. The cells are a list, so the renderer holds no opinion about how many there are or
  // what any of them says, which is the other half of what makes a fourth exception class free.
  // Every row ends in the locator, because a tool that cannot write owes its reader the address of
  // the record they must go and open.
  function row(block, n, v, byId, tmpl, coh) {
    var cells = [], t, c, place;
    if (n.type === 'CohortSession') {
      t = byId[tmpl[n.id]];
      c = byId[coh[n.id]];
      place = t && absent(t, 'location_mode') ? null : (t ? value(t, 'location_mode') : null);
      cells.push({ text: dayOf(value(n, 'scheduled_at')), cls: 'desk-when' });
      cells.push({ text: programme(v) + (c ? ' · ' + c.label : '') });
      cells.push({ text: (t ? t.label : n.label), tail: place, cls: 'desk-what' });
    } else {
      cells.push({ text: n.label, cls: 'desk-who' });
      cells.push({ text: programme(v) });
    }
    return { id: n.id, at: String(value(n, 'scheduled_at') || ''), seq: block.rows.length,
             cells: cells, mark: block.mark, locator: block.noun + ' ' + n.id };
  }

  function model() {
    var s = split(), drawn = 0, total = 0;
    window.GI.views.forEach(function (v) {
      var b = (v.counts || {}).CohortSession || { drawn: 0, total: 0 };
      drawn += b.drawn;
      total += b.total;
    });
    // Date order inside a block, and the blocks themselves by weight. Both are arithmetic over the
    // rows rather than an order typed here, so a fourth block finds its own place. A block whose
    // records carry no date keeps the order the document gives it, which is time not positioning
    // anything rather than time positioning it badly: five sponsor visits sorted by their internal
    // identifier would be an ordering the reader would try to read a meaning into.
    s.blocks.forEach(function (b) {
      b.rows.sort(function (x, y) {
        if (x.at !== y.at) return x.at < y.at ? -1 : 1;
        return x.seq - y.seq;
      });
    });
    s.blocks.sort(function (x, y) { return y.n - x.n || (x.key < y.key ? -1 : 1); });
    s.unrecorded.sort(function (x, y) { return y.n - x.n || (x.key < y.key ? -1 : 1); });
    return {
      fix: s.blocks.reduce(function (a, b) { return a + b.n; }, 0),
      coverage: 'All programmes ' + drawn + '/' + total,
      today: todayLine(),
      blocks: s.blocks,
      unrecorded: s.unrecorded
    };
  }

  // ---- the screen ------------------------------------------------------------------------

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  // NOTHING IN HERE KNOWS WHICH BLOCKS IT HAS. It is handed a model and paints it, and that is the
  // property the strongest objection against this design is answered with. Adding an exception
  // class that is not an empty field at all, a double booking say, is one more entry in
  // `m.blocks`: it gets its heading, its count, its rows, its mark and its locators from the same
  // three loops, and the chrome, the two glyphs and the closing sentence are untouched.
  function render(m) {
    var body = document.getElementById('deskbody');
    var fix = document.getElementById('deskfix');
    var cov = document.getElementById('deskcov');
    var day = document.getElementById('deskday');
    if (!body || !fix || !cov || !day) return;
    fix.textContent = m.fix + ' to fix';
    cov.textContent = m.coverage;
    day.textContent = m.today;
    while (body.firstChild) body.removeChild(body.firstChild);

    var head = el('h2', 'desk-head');
    head.appendChild(el('span', 'desk-lab', 'NEEDS YOU'));
    head.appendChild(el('span', 'desk-n', String(m.fix)));
    body.appendChild(head);

    m.blocks.forEach(function (b) {
      // Rule 4. A block with nothing in it is not drawn empty, it is not drawn.
      if (!b.n || !b.rows.length) return;
      var sec = el('section', 'desk-block');
      var h = el('h3', 'desk-bhead');
      h.appendChild(el('span', 'desk-lab', b.heading));
      h.appendChild(el('span', 'desk-n', String(b.n)));
      sec.appendChild(h);
      var list = el('ul', 'desk-rows');
      b.rows.forEach(function (r) {
        var li = el('li', 'desk-row');
        r.cells.forEach(function (c) {
          var span = el('span', 'desk-c' + (c.cls ? ' ' + c.cls : ''), c.text);
          // The grey mark, in situ where the value would sit. It is never counted, never a row and
          // never coloured, and it may never stand for a fixable gap: `? no instructor` is the
          // correct drawing of one and a grey slot would be a bug, not a style choice.
          if (c.tail !== undefined) {
            span.appendChild(document.createTextNode(' · '));
            if (c.tail === null) span.appendChild(el('span', 'desk-dash', '-'));
            else span.appendChild(document.createTextNode(c.tail));
          }
          li.appendChild(span);
        });
        var mk = el('span', 'desk-c desk-mark');
        mk.appendChild(el('span', 'desk-q', '?'));
        mk.appendChild(document.createTextNode(' ' + r.mark));
        li.appendChild(mk);
        li.appendChild(el('span', 'desk-c desk-at', r.locator));
        list.appendChild(li);
      });
      sec.appendChild(list);
      body.appendChild(sec);
    });

    // The closing sentence, which is a fact about what the business writes down and says nothing
    // about the standing of anything on this page. It is inert: nothing in it is counted into the
    // 22, nothing in it is a row, and nothing in it is pressable.
    var foot = el('p', 'desk-foot');
    foot.appendChild(document.createTextNode(
      word(m.unrecorded.length) + ' kinds of fact are not written down by any system: ' +
      m.unrecorded.map(function (u) { return u.what + ' (' + u.n + ')'; }).join(', ') +
      '. Shown as '));
    foot.appendChild(el('span', 'desk-dash', '-'));
    foot.appendChild(document.createTextNode('.'));
    body.appendChild(foot);
  }

  // ---- the address -----------------------------------------------------------------------

  // Painted on arrival and repainted on every arrival, not once. Two of the three readings are
  // arithmetic over a document that does not change while the page is loaded, and the third is the
  // reader's own date, which does.
  function route() {
    var on = location.hash === ROUTE;
    document.body.classList.toggle('desk', on);
    if (on) render(model());
  }

  window.ZD = {
    route: function () { return ROUTE; },
    model: model,
    render: function (m) { render(m); },
    on: function () { return document.body.classList.contains('desk'); }
  };

  if (document.getElementById('view-desk')) {
    window.addEventListener('hashchange', route);
    route();
  }
})();
