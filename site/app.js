// app: the only file that knows the other four exist.
//
// Issue 71, seam 2 of issue 60. This file joins the two generated documents, builds the four
// modules, wires them to each other, owns the two page-wide controls that belong to no view, and
// publishes what a driver reads. It draws nothing, moves nothing and decides nothing about the
// model.
//
// WHY THE WIRING IS A FILE. render, viewport, selection and router each know their own concern and
// none of them knows another's, which is what makes each of them editable alone. Something still
// has to say what happens when the address changes: clear the selection while the drawing that
// owns it is still on screen, repaint, re-bind the reveal rules to the new elements, re-describe
// the chrome, throw away the student list built for the last cohort, and refit. That is five
// modules' work in one order, and the order is the wiring. Written once, here, rather than
// discovered again in each of them.
//
// HOW LOAD ORDER IS HANDLED WITH NO BUNDLER. The site has no build step and has to work opened
// from a file:// URL, so ES modules are out and the four files are ordinary <script> tags. Each of
// them DEFINES one factory on window.ZM and EXECUTES NOTHING, so the order among the four is
// irrelevant and the only rule is that all four come before this file. index.html says so, and the
// check below turns a missing or misordered tag into one named error rather than into a page that
// half draws.
(function () {
  'use strict';

  var ZM = window.ZM || {};
  ['render', 'viewport', 'selection', 'router', 'term'].forEach(function (k) {
    if (typeof ZM[k] !== 'function') {
      throw new Error('site/' + k + '.js did not define window.ZM.' + k +
                      ' before site/app.js ran: check the script tags in index.html');
    }
  });

  // ---- two documents, joined here ------------------------------------------
  // Issue 60 seam 1. The build no longer ships one blob. site/instance.js is window.GI, what the
  // objects ARE: types, nodes, properties, provenance flags, identity, the verbs on the
  // relationships and the roster, with no coordinate anywhere in it. site/layout.js is window.GL,
  // where they GO: extents, bands, positions, line breaks as word counts, edge paths and chip
  // boxes, with no value of any object in it. The page loads both and joins them below.
  //
  // WHY THE SPLIT IS WORTH A JOIN. The published page is public, so real data can never go on
  // it. One codebase serves the public toy and a private management tool only if the data
  // document loads separately from the page, invented data on the public origin and real data on
  // a private deployment. That is the whole of it, and it is why the join is here rather than
  // the split being undone in the build.
  //
  // AND WHY THE JOIN IS IN THE WIRING FILE. It is the one place on this page that knows there are
  // two documents at all. render, selection and router are each handed a joined view and cannot
  // tell how it was assembled, which is what lets the data document be replaced without any of
  // them changing.
  //
  // THE JOIN IS BY POSITION AND CHECKED BY ID. Both documents come out of one build, in one
  // order, so position is the cheap join; the id is compared on every node and both ends on
  // every relationship, and a mismatch throws rather than drawing a tile at another tile's
  // coordinates. A page drawn from a mismatched pair would look almost right, which is the worst
  // way for this to fail.
  //
  // A LABEL LIVES IN ONE PLACE. The layout carries the word counts its lines were broken at and
  // not the lines themselves, so the label text is in the instance document and nowhere else.
  // The lines are rebuilt here, which is four lines of code and one fewer copy of every name on
  // the page.
  //
  // AND SINCE ISSUE 89 EACH DOCUMENT SHIPS TWO LISTS. `views` is the seven programmes and
  // `collapsed` is the same seven one altitude up, with their session templates and cohort
  // sessions gathered into the modules the syllabus declares. They are separate lists rather than
  // one of fourteen because `views` means "the seven programmes" to every reader of these bytes,
  // and the same join runs over both: same order, same length, checked by id on every node.
  function joinList(gi, iviews, lviews, what) {
    if (iviews.length !== lviews.length) {
      throw new Error('instance.js has ' + iviews.length + ' ' + what +
                      ' and layout.js has ' + lviews.length);
    }
    return iviews.map(function (iv, vi) {
      var lv = lviews[vi], d = lv.drawing;
      if (iv.key !== lv.key) throw new Error('view ' + vi + ': ' + iv.key + ' against ' + lv.key);
      if (iv.nodes.length !== d.nodes.length || iv.edges.length !== d.edges.length) {
        throw new Error(iv.key + ': the two documents disagree about how much is in it');
      }
      var drawing = {
        w: d.w, h: d.h, bandTop: d.bandTop, capLineH: d.capLineH, capGap: d.capGap,
        bands: d.bands, tile: d.tile, lineH: d.lineH, gapLabel: d.gapLabel, font: d.font,
        drawingDigest: d.drawingDigest, types: gi.types, roster: iv.roster,
        nodes: iv.nodes.map(function (n, i) {
          var g = d.nodes[i], out = {}, k;
          if (g.id !== n.id) {
            throw new Error(iv.key + ' node ' + i + ': ' + n.id + ' has the coordinates of ' +
                            g.id);
          }
          for (k in n) if (Object.prototype.hasOwnProperty.call(n, k)) out[k] = n[k];
          out.x = g.x;
          out.y = g.y;
          out.lines = unwrap(n.label, g.wrap);
          return out;
        }),
        edges: iv.edges.map(function (e, i) {
          var g = d.edges[i], out = {}, k;
          if (g.s !== e.s || g.t !== e.t) {
            throw new Error(iv.key + ' edge ' + i + ': ' + e.s + '->' + e.t + ' has the path of ' +
                            g.s + '->' + g.t);
          }
          for (k in e) if (Object.prototype.hasOwnProperty.call(e, k)) out[k] = e[k];
          out.d = g.d; out.cx = g.cx; out.cy = g.cy; out.cw = g.cw;
          out.rev = g.rev; out.ax = g.ax; out.ay = g.ay; out.aa = g.aa;
          return out;
        })
      };
      // The counts block travels with the view, issue 83. It is what each band caption says about
      // its own sample, and #/calendar and #/outline read across all seven to say the same thing
      // about the whole term: 83 sessions drawn out of the 260 the model counts. A view that
      // carried its rows and not the total it is a sample of would let a sheet of 83 rows read as
      // a complete term. It is not geometry, so it comes off the instance document.
      return { key: iv.key, code: iv.code, name: iv.name, label: iv.label, route: iv.route,
               grain: iv.grain || 'sessions', counts: iv.counts, drawing: drawing };
    });
  }

  function joinDocs(gi, gl) {
    if (!gi || !gi.views || !gl || !gl.views) return null;
    var out = joinList(gi, gi.views, gl.views, 'views');
    // The collapsed half is optional in the document and is refused rather than ignored when it
    // is half there: a page that quietly drew one altitude because the other list went missing
    // would look exactly like a page whose control had stopped working.
    if (gi.collapsed || gl.collapsed) {
      if (!gi.collapsed || !gl.collapsed) {
        throw new Error('one document carries a collapsed grain and the other does not');
      }
      out = out.concat(joinList(gi, gi.collapsed, gl.collapsed, 'collapsed views'));
    }
    return out;
  }

  // ---- the two altitudes, issue 89 ------------------------------------------
  // THE BUILD SHIPS FOURTEEN DRAWINGS AND THE PAGE HAS SEVEN PROGRAMMES. Each programme is drawn
  // twice, once with its session templates and cohort sessions as themselves and once with them
  // gathered into the modules the syllabus declares, and each of the two carries its own
  // `drawingDigest` because each is an artefact check_build.sh reproduces byte for byte.
  //
  // THE PAIRING IS DONE HERE AND NOWHERE ELSE, in the one file that knows the documents were
  // joined at all. Everything downstream is handed the SESSIONS grain and cannot tell there is a
  // second: router.js picks a programme out of seven, term.js reads the term across seven, and
  // the gap denominator counts the model once. A module tile is the same objects re-expressed,
  // not more of them, so a reader of any of those three counting fourteen views would be double
  // counting the business.
  function pairGrains(all) {
    var byKey = {}, base = [];
    all.forEach(function (v) {
      if (v.grain !== 'sessions') return;
      byKey[v.key] = v;
      v.alt = null;
      base.push(v);
    });
    all.forEach(function (v) {
      if (v.grain === 'sessions') return;
      if (!byKey[v.key]) {
        throw new Error(v.key + ' is drawn at grain ' + v.grain + ' and at no other');
      }
      byKey[v.key].alt = v;
    });
    return base;
  }

  // The label, broken where the layout broke it. The build proved the counts rebuild its own
  // lines before writing them, so this cannot silently drop a word: a count that did not add up
  // would have stopped the build.
  function unwrap(label, counts) {
    var words = String(label).split(/\s+/), out = [], i;
    for (i = 0; i < counts.length; i++) out.push(words.splice(0, counts[i]).join(' '));
    return out;
  }

  var GI = window.GI || null;
  var ALL_VIEWS = joinDocs(GI, window.GL);
  if (!ALL_VIEWS || !ALL_VIEWS.length) {
    throw new Error('site/instance.js and site/layout.js: no view');
  }
  var VIEWS = pairGrains(ALL_VIEWS);
  if (!VIEWS.length) throw new Error('site/instance.js: no view at the sessions grain');

  // The drawing one view is at one altitude. A view with no second grain answers with its own,
  // which is not a case the build produces and is the honest answer if it ever does: the reader
  // asked for an altitude this programme is not drawn at and gets the one it is.
  function drawingAt(v, grain) {
    return (grain === 'modules' && v.alt) ? v.alt.drawing : v.drawing;
  }

  // ---- the drawing a SCOPE is, issue 136 -------------------------------------
  // ONE PROGRAMME IN SCOPE IS THE ARTEFACT THE BUILD WROTE, UNTOUCHED, and that is a decision this
  // card is held to rather than a shortcut it took. He likes the drawing the tool renders today,
  // so a scope of one hands back the very object `layout.js` shipped: no merge, no transform, no
  // second opinion about a coordinate, and therefore the same digest, the same extent and the same
  // pixels. scripts/smoke.mjs asserts it as an identity rather than as a resemblance.
  //
  // MORE THAN ONE IS ONE DRAWING AND NOT SEVEN NEXT TO EACH OTHER. render.union() merges the
  // documents, collapses the objects the documents share and lays the result out with the build's
  // own pack, and everything downstream meets a drawing of the shape it already knows.
  //
  // CACHED ON THE ADDRESS THE SCOPE HAS. The union costs a full layout, chips and all, and a
  // reader stepping the week control would otherwise pay it on every press. The key is the scope
  // and the altitude, which is exactly what the drawing is a function of.
  var UNION = {};

  // ---- the budget, issue 136, and it is one number set by measurement -------
  // WHAT WAS MEASURED, BEFORE ANY NUMBER WAS CHOSEN. The union is drawn in sectors down one set of
  // lanes, so its height is the sum of what the programmes in scope hold, and the page already has
  // a hard arithmetic limit on height: viewport.js clamps the scale at 0.1, so a drawing taller
  // than the canvas divided by that cannot be framed whole by `fit` at all. All 127 scopes were
  // driven at the whole term at the sessions grain, at 390 by 844, which is the stricter of the
  // two viewports because its canvas is 698 CSS px against 757. 121 of the 127 frame whole. Six do
  // not, and they are the six largest: the five scopes of six programmes, at 77 session tiles and
  // 7405 to 7439 units, and all seven, at 83 tiles and 8017 units. The largest scope that frames
  // whole is 71 tiles at 6852 units.
  //
  // SO THE BUDGET IS 72 AND THE BOUNDARY IS MEASURED RATHER THAN CHOSEN. 71 frames on every one of
  // the 127; 77 is the smallest count that does not. Nothing between them is reachable in this
  // document, so the number sits in the gap the measurement left.
  //
  // IT DOES NOT REFUSE THE QUESTION THIS CARD EXISTS FOR, and that was the committee's own
  // strongest objection against itself: a budget that starts refusing the flagship view as the
  // records fill in would read as the tool punishing him for improving his data. Measured: the
  // DENSEST three week window across all seven, 19 January to 8 February, draws 17 session tiles
  // and 146 tiles in all, 2880 units, and frames at 24.6 per cent at 1536 and 21.7 at 390, which
  // is within a hair of the Z-BL term drawing the tool already ships at 27.5 and 25.2.
  // 177 of the 260 sessions hold no detailed record today, so the whole corpus filled in is about
  // 3.1 times the drawn one and that same window would draw about 53. Still under 72. What the
  // budget refuses is the WHOLE TERM over six or seven programmes, which is exactly the state the
  // canvas provably cannot frame, and the two ways out of it are a window and the other altitude.
  //
  // THE REFUSAL IS PRINTED ON THE CONTROL THAT WAS REFUSED AND IS NEVER SILENT. `grain` greys its
  // own `sessions` row and carries the count that broke it, the drawing is rendered at modules,
  // and the control's own value says which altitude is on screen.
  var SESSION_BUDGET = 72;

  // What the scope, the window and the altitude would put in the two term lanes, counted off the
  // documents rather than off a drawing, so it can be asked before anything is laid out. It is the
  // same population the budget is stated in: one tile per cohort session at the sessions grain and
  // one per module delivery at the modules grain.
  var TERM_TYPES = { CohortSession: 1, ModuleDelivery: 1 };

  function sessionLoad(sc, grain) {
    var spec = term ? term.windowSpec() : null, n = 0;
    sc.forEach(function (v) {
      drawingAt(v, grain).nodes.forEach(function (x) {
        if (!TERM_TYPES[x.type]) return;
        if (spec && spec.governs(x) && spec.out(x)) return;
        n++;
      });
    });
    return n;
  }

  // The altitude the drawing is at, which is the one the address asks for unless the budget
  // refuses it. A scope of one is never refused: the seven built artefacts are what they are and
  // the largest of them is 28 tiles.
  function effectiveGrain() {
    var g = router.grain();
    if (g !== 'sessions') return g;
    return sessionLoad(router.scope(), 'sessions') > SESSION_BUDGET ? 'modules' : g;
  }

  function drawingFor(sc, grain) {
    if (sc.length === 1) return drawingAt(sc[0], grain);
    var key = sc.map(function (v) { return v.key; }).join('+') + '/' + grain;
    if (!UNION[key]) {
      UNION[key] = render.union(sc.map(function (v) {
        return { key: v.key, code: v.code, label: v.label, drawing: drawingAt(v, grain) };
      }));
    }
    return UNION[key];
  }

  // A `viewAt` twin of this stood here, returning the view rather than its drawing, and #89 added
  // it in the same commit as this one without ever calling it. Removed by issue 106. Two
  // near-identical selectors where one is dead is how a later edit fixes the wrong one.

  // ---- the elements the modules are handed ----------------------------------
  // Looked up once, here, and passed in. A module that reached for its own elements would be a
  // module this file could not put on a different page, and every one of these ids is written in
  // index.html beside the markup it names.
  var svg = document.getElementById('graph');
  var canvas = document.getElementById('canvas');
  var panel = document.getElementById('panel');
  // The panel is a fixed overlay and the header runs the full width, so the panel is told where
  // the header ends. Without it the open panel covers the header's own buttons.
  var hdr = document.querySelector('header');

  function measureHeader() {
    document.documentElement.style.setProperty('--hh', (hdr ? hdr.offsetHeight : 0) + 'px');
  }

  var router, render, selection, viewport, term;

  // ---- the wiring itself -----------------------------------------------------
  // What happens when the address starts naming a different programme. The order is the whole of
  // it and each step is here because of what the step before it leaves behind.
  function showView(sc) {
    // The selection belongs to the drawing that is leaving. Cleared before the repaint, because
    // clearing repaints the selected tile and after a repaint that tile is gone: on six of the
    // seven routes the id would not even exist.
    selection.clear();
    render.draw(drawingFor(sc, effectiveGrain()));
    // The elements the reveal rules act on were all replaced, so the rules are read off the new
    // drawing and applied to the new handles.
    selection.bind(render.gfx());
    stampDigest();
    router.describe();
    // Issue 98. A different programme is a different set of gaps, and no class on the body changed
    // to say so, which is why this is a call and not the observer's business.
    describeReadout();
    // Issue 111. And beside it for exactly the same reason: the window did not move and the
    // drawing under it did, so how many tiles the window is taking off has changed.
    term.restateWindow();
    // A different programme is a different cohort, so the list built for the last one goes.
    router.resetRoster();
    describeGrain();
    // Last, because describing the programme can change the height of the header and the fit is
    // measured against what is left.
    viewport.refit();
  }

  // ---- collapsing and expanding, issue 89 ----------------------------------
  // "SMOOTH NICE LOOKING" WAS THE ASK AND IT IS AN INSTRUCTION ABOUT WHERE THE READER ENDS UP.
  // Two of the seven drawings are 2578 and 2470 units tall; a collapse that framed the new
  // picture and said nothing else would leave somebody who had been reading one tile looking at
  // a different picture with no idea which part of it their tile went into.
  //
  // SO THE ANCHOR IS CARRIED ACROSS, AND IT IS DERIVED RATHER THAN REMEMBERED. What the reader
  // was looking at is the selected tile if there is one, and otherwise the tile nearest the
  // middle of the canvas, which is read off the viewport's own numbers. Its counterpart at the
  // other altitude is then selected, which opens the panel on it, dims everything unrelated and
  // brings it on screen through the same path a click takes. Collapsing the tile you were
  // reading opens the module that swallowed it; expanding the module opens the first session in
  // it.
  //
  // THE JOIN IS THE MODULE'S OWN NAME AND NOT A TABLE OF IDS. A session template carries
  // `module_name`, a Module tile is LABELLED with exactly that string and a Module delivery
  // carries it on its `module` row, so the correspondence is already in the document and a
  // second copy of it shipped as a map would be a second thing to keep true. A tile that is in
  // no module has itself at both altitudes and joins by id, which is why Z-CFA keeps its place
  // perfectly across a control that changes nothing else on it.
  function propOf(n, k) {
    var props = (n && n.props) || [], i;
    for (i = 0; i < props.length; i++) if (props[i].k === k) return props[i].v;
    return null;
  }

  function moduleNameOf(g, n) {
    if (!n) return null;
    if (n.type === 'SessionTemplate') return propOf(n, 'module_name');
    if (n.type === 'Module') return n.label;
    if (n.type === 'ModuleDelivery') return propOf(n, 'module');
    if (n.type === 'CohortSession') {
      // Through the `instance of` edge rather than through a date or a name: the session's own
      // rows say nothing about a module, and the template it runs is the thing that does.
      var tpl = null, i;
      for (i = 0; i < g.edges.length; i++) {
        if (g.edges[i].v === 'instance of' && g.edges[i].s === n.id) tpl = g.edges[i].t;
      }
      if (!tpl) return null;
      for (i = 0; i < g.nodes.length; i++) {
        if (g.nodes[i].id === tpl) return propOf(g.nodes[i], 'module_name');
      }
    }
    return null;
  }

  // Which lane a node is in, so that a session template lands on a Module and a cohort session
  // on a Module delivery rather than on whichever of the two the name matched first.
  var SYLLABUS_SIDE = { SessionTemplate: 'templates', Module: 'templates',
                        CohortSession: 'term', ModuleDelivery: 'term' };

  function twin(from, to, id) {
    var i, n = null;
    for (i = 0; i < from.nodes.length; i++) if (from.nodes[i].id === id) n = from.nodes[i];
    if (!n) return null;
    for (i = 0; i < to.nodes.length; i++) if (to.nodes[i].id === id) return to.nodes[i].id;
    var side = SYLLABUS_SIDE[n.type], name = moduleNameOf(from, n);
    if (!side || !name) return null;
    for (i = 0; i < to.nodes.length; i++) {
      var m = to.nodes[i];
      if (SYLLABUS_SIDE[m.type] !== side) continue;
      if (moduleNameOf(to, m) === name) return m.id;
    }
    return null;
  }

  // The tile the reader is looking at. The selection first, because a reader who has opened a
  // panel has said what they are reading; otherwise the tile nearest the middle of the canvas,
  // which is the honest guess and is read off the viewport rather than assumed.
  function anchorId() {
    var sel = selection.selected();
    if (sel) return sel.id;
    if (!viewport) return null;
    var s = viewport.state(), g = render.drawing();
    if (!s || !s.k || !g || !g.nodes.length) return null;
    var cx = s.x + s.w / (2 * s.k), cy = s.y + s.h / (2 * s.k);
    var best = null, bd = Infinity;
    g.nodes.forEach(function (n) {
      var d = (n.x - cx) * (n.x - cx) + (n.y - cy) * (n.y - cy);
      if (d < bd) { bd = d; best = n.id; }
    });
    return best;
  }

  function grainChanged() {
    if (!render || !selection || !viewport) return;
    var was = render.canonical() || render.drawing();
    var anchor = anchorId();
    selection.clear();
    render.draw(drawingFor(router.scope(), effectiveGrain()));
    selection.bind(render.gfx());
    stampDigest();
    router.describe();
    describeReadout();
    term.restateWindow();
    describeGrain();
    // The fit first and the anchor after it, which is the order #100 settled for the same
    // question: the extent has changed by up to a factor of four, so a view that was not refitted
    // would frame the old picture's size around the new one. Selecting the counterpart then
    // brings it on screen through selection's own reveal path.
    viewport.refit();
    // THE TWIN IS FOUND IN THE CANONICAL DRAWING AND CONFIRMED IN THE ONE ON SCREEN, which are
    // two different node sets whenever a window is on. The canonical is the right place to look,
    // because it is the whole programme and a module the window happened to filter should not
    // change which module the reader's session belongs to. It is the wrong place to select from:
    // selection.js binds its handles to what is painted, and selecting an id the window took off
    // the picture throws inside the panel rather than doing nothing.
    var land = anchor ? twin(was, render.canonical() || render.drawing(), anchor) : null;
    if (land && onScreen(land)) selection.select(land);
  }

  function onScreen(id) {
    var g = render.drawing(), i;
    if (!g) return false;
    for (i = 0; i < g.nodes.length; i++) if (g.nodes[i].id === id) return true;
    return false;
  }

  // Issue 100. WHAT A CAPTURE QUOTES WHEN THE DRAWING IS FILTERED. `drawingDigest` is a digest of
  // the drawing the BUILD wrote, and check_build.sh is what makes it worth quoting. A window is a
  // run-time transform of that artefact, so on a filtered page the digest is true of something the
  // reporter is not looking at, and a report that quoted it bare would send a reader to a picture
  // with seventy more tiles in it than the one the card is about. So the line says both: the
  // digest, and what the reader had done to it.
  function stampDigest() {
    if (!window.ZT) return;
    var g = render.canonical() || {};
    var w = term ? term.state().window : null;
    var base = g.drawingDigest || 'unknown';
    window.ZT.drawingDigest = (w && w.on)
      ? base + ' of the whole term, drawn filtered to ' + w.weeks +
        (w.weeks === 1 ? ' week' : ' weeks') + ' from ' + w.from
      : base;
    // Issue 89. NO GRAIN CLAUSE IS ADDED HERE AND THAT IS THE POINT. Each grain is its own
    // artefact with its own digest, written by the build and reproduced by check_build.sh, so
    // quoting the digest of the drawing on screen already says which altitude the reporter was
    // at. The window needs a clause because a filtered drawing is a run-time transform of an
    // artefact and no digest anywhere describes it.
  }

  // Everything a change of window costs, in one place. The drawing is rebuilt from the canonical
  // one, so every handle the selection was holding is gone, the ids it was holding may not exist
  // in the filtered drawing at all, and the extent the fit was framing has changed: on Z-BL a
  // three week window takes the drawing from 2578px tall to a few hundred, and a fit that did not
  // run would leave the reader looking at the same postage stamp for a picture eight times
  // larger. Issue 100.
  function windowChanged(spec) {
    if (!render || !selection || !viewport) return;   // a call before the wiring is finished
    selection.clear();
    // Issue 136. THE WINDOW IS PART OF WHAT THE BUDGET IS OVER, so a window that takes the load
    // under it gives the sessions grain back and one that pushes it over takes it away. That is
    // the release valve the budget's whole argument rests on, and it has to be answered here
    // because the altitude the drawing is at can change without the address changing at all.
    var want = drawingFor(router.scope(), effectiveGrain());
    if (want !== render.canonical()) {
      render.setWindow(spec);
      render.draw(want);
      selection.bind(render.gfx());
      stampDigest();
      router.describe();
      describeReadout();
      describeGrain();
      viewport.refit();
      return;
    }
    if (!render.setWindow(spec)) return;
    selection.bind(render.gfx());
    stampDigest();
    router.describe();
    // Issue 98, and it is the composition that card is for: the window moved, so what is on
    // screen moved, so the count of what is missing in it moved. Here rather than in the observer
    // because a window changes no class on the body.
    describeReadout();
    describeGrain();
    viewport.refit();
  }

  // The term, read twice. Built before the selection, because the panel asks it what a node is one
  // of, and before the router, because it needs nothing the router has: it reads across all seven
  // views and has no opinion about which of them is drawn, which is the whole reason it is a
  // module of its own and not another view inside router.js. Nothing in showView() touches it for
  // the same reason: a change of programme behind the sheet changes none of its rows. Issues 80
  // and 82.
  term = ZM.term({
    views: VIEWS,
    // Issue 85's invented session agenda, handed over rather than read off the global, for the
    // reason the provenance block is: a module that reached for window.GI would be a second
    // reader of the instance document. It is a top-level block and not a per view one, because
    // it is one object and the same four lines sit under every template on all seven.
    agenda: GI && GI.agenda,
    // Opening or closing the sheet swaps the heading, and below the breakpoint a heading of a
    // different length can change how many lines the header takes.
    //
    // ISSUE 121, AND IT IS THE OBSERVER'S OWN ARGUMENT REACHING THE ONE ROUTE IT COULD NOT SEE.
    // The note over the MutationObserver below says the window and the programme are told
    // directly, in windowChanged() and showView(), because those two change the count without
    // changing a class. Moving from one programme's calendar to another's is a third: term.js's
    // show() ends in `classList.toggle('calendar', true)` on a body that already carries the
    // class, which writes no attribute at all, so the observer stays silent and the readout kept
    // reporting the programme the reader had left. It read `11 of 95` on Z-CFA's calendar, which
    // is the whole term's figure, where that reading holds 6. The address had changed, the rows
    // had changed, the heading had changed, and the number over them had not.
    //
    // THE MEASUREMENT LAST, for the reason showView() refits last: the readings are IN the header
    // and a value that grows from one digit to five can change how many lines the row takes, so a
    // header measured before they are rewritten is a header measured against what it used to say.
    onRoute: function () { describeReadout(); measureHeader(); },
    // Issue 90. The time window is a page-level state and the drawing obeys it, so the wiring
    // file is what carries the answer from the module that knows what a date means to the module
    // that knows where a node is drawn. render is built after this, so the first call is guarded
    // and the initial state is applied below beside the first draw.
    onWindow: function (spec) { windowChanged(spec); },
    // Issue 111. The count that used to be a stub tile on every filtered lane is a sentence on
    // the window control now, and the numbers in it are render.js's. Handed over as a question
    // rather than as a value: `render` is built after this, so an eager read would be a read of
    // nothing, and the answer is per drawing while the window is per page.
    windowEffect: function () { return render ? render.windowState() : null; }
  });

  router = ZM.router({
    views: VIEWS,
    defaultKey: GI && GI.default,
    svg: svg,
    // Issue 100. THE CANONICAL DRAWING AND NOT THE ONE ON SCREEN. The two things the router reads
    // out of it are the cohort's name and the roster counts, and both are facts about the
    // programme rather than about the reader's window: an empty week filters the cohort's own tile
    // off the picture, and a header that emptied with it would say the programme has no cohort.
    // Issue 89. THE SESSIONS GRAIN, for the reason this is the canonical drawing and not the one
    // on screen: the cohort's name and the two roster counts are facts about the programme, and
    // the modules grain neither adds nor removes a student. Reading them off the collapsed
    // drawing would give the same answers today and would make the header depend on an altitude
    // it is not about.
    drawing: function () { return router.view().drawing || render.drawing(); },
    onView: showView,
    onGrain: grainChanged,
    onDescribed: measureHeader
  });

  render = ZM.render({
    svg: svg,
    canvas: canvas,
    // The FIRST of the scope, and this argument is read for the type palette and the tile size
    // alone: both are the build's and cannot differ between drawings. What goes on the canvas is
    // the draw() below, which is the whole scope. Issue 136.
    drawing: drawingAt(router.view(), router.grain()),
    // Issue 136. The seven, in the build's order, for the one hue apiece the union paints on a
    // session and on a cohort while more than one programme is drawn. It is a list and not a
    // palette: render.js spaces the hues over however many there are, so an eighth programme needs
    // no colour chosen for it here or anywhere else.
    programmes: VIEWS.map(function (v) { return { key: v.key, code: v.code, label: v.label }; }),
    // Issue 100. Every column x there is, across all seven drawings, because a column's INDEX is
    // what decides whether an edge is a hop to the next lane or a long arc slung under the row,
    // and the drawings do not all hold every column: Z-CFA has no instructor and no employer, so
    // an index taken from that drawing alone would number its sessions column 2 where the other
    // six number it 3, and the same relationship would be drawn two different ways depending on
    // which programme the reader was on. Collected here because this is the file that holds all
    // seven, and sorted by the file that uses it.
    // Issue 89. ALL FOURTEEN and not the seven, because a column's INDEX decides an edge's shape
    // and the collapsed drawings are laid out in the same eight columns. They introduce no new x,
    // so this is the same list either way today; taking it off both grains is what keeps that
    // true when it stops being.
    columns: (function () {
      var seen = {}, out = [];
      ALL_VIEWS.forEach(function (v) {
        v.drawing.nodes.forEach(function (n) {
          if (seen[n.x]) return;
          seen[n.x] = true;
          out.push(n.x);
        });
      });
      return out;
    })(),
    onSelect: function (id) { selection.select(id); },
    onFocus: function (n) { viewport.ensureVisible(n); },
    // Issue 84. What a lane heading opens. render.js knows where a lane is and term.js knows what
    // a lane means, and neither learns the other's half: the drawing asks by the lane's name and
    // the sheet answers with an address it built itself. The programme is the one on screen, so a
    // heading on the Z-SC drawing opens Z-SC, which is the whole of what the card asked for.
    capLink: function (bandKey) {
      return term.capLink(bandKey, router.view());
    }
  });

  selection = ZM.selection({
    svg: svg,
    panel: panel,
    rosterRoute: router.rosterRoute,
    typeLabel: render.typeLabel,
    // Issue 69. This was `typeColor`, and the panel painted its type caption with it. A swatch
    // is what crosses the boundary now: the caption is text and takes a text token, and the
    // type's colour is carried by a box beside it, which is the thing the palette was chosen for.
    typeSwatch: render.typeSwatch,
    // Issue 73 seam 5 handed the panel the document's own clock and vocabularies here, and the
    // panel summed every property list by them in one line under the list. Issue 110 took that
    // line off the page and the option went with it rather than being left handed to a module
    // that no longer reads it. The block itself still ships in the instance document and the
    // build gate still holds every row to it.
    // Issues 80 and 82. A cohort session is one of a term and a session template is one of a
    // syllabus, and the panel is where the reader is when they want the rest of it. The route and
    // the counts belong to the view that holds them, so term.js answers and selection.js only
    // asks: a panel that knew '#/calendar' would be a second place the address is written down.
    moreLink: term.linkFor,
    onReveal: function (n) { viewport.ensureVisible(n); }
  });

  // The address has already chosen which of the seven this is, so this draws the reader's
  // programme and not the default followed by the reader's.
  // Issues 90 and 100. Whatever the window is at load, read rather than assumed so that a stored
  // or deep-linked window would reach the FIRST paint rather than the second. It is set before
  // draw() and not after, because after this card a window rebuilds the drawing rather than adding
  // a class to it, and a reader would otherwise watch the whole term appear and then collapse.
  render.setWindow(term.windowSpec());
  render.draw(drawingFor(router.scope(), effectiveGrain()));
  selection.bind(render.gfx());

  viewport = ZM.viewport({
    svg: svg,
    canvas: canvas,
    header: hdr,
    panel: panel,
    tile: render.tile,
    extent: function () { return render.drawing(); },
    // The two answers about the keyboard that do not come from the canvas. Both of these views
    // sit over it, and a digit typed into either is not an instruction to move a drawing the
    // reader cannot see.
    busy: function () {
      return router.rosterOpen() || router.pgMenuOpen() || term.isOpen() ||
             term.windowMenuOpen() || gapsMenuOpen() || grainMenuOpen() ||
             // Issue 120. The theme grew a box of its own when it went behind a press, and a box
             // over the canvas is a box a digit typed into it must not reach past. It is in this
             // list for the reason the other four are and not because anything about the theme
             // changed.
             themeMenuOpen();
    },
    // Issue 84's counter-scale. The lane headings are controls and a control keeps its size on
    // screen, so the drawing is told the scale on every change of it.
    onScale: function (k) { render.setCapScale(k); }
  });
  viewport.init();

  // ---- the theme, and the reader's right to disagree with the machine --------
  // #55 made the page follow prefers-color-scheme, which is the correct default and stays the
  // default here. What it could not do is let a reader disagree with a laptop that turns over at
  // sunset, so this is the override, and the only honest set of states is three: system, light,
  // dark. A two-state switch has nowhere to put "whatever the machine says", and a reader who
  // has flipped it once can never get back to following the machine.
  //
  // ALL OF THE CASCADE IS IN app.css AND NONE OF IT IS HERE. This function sets one attribute on
  // the root element and reads one key out of localStorage. It picks no colour, reads no media
  // query and listens for no change: `color-scheme` is `light dark` when the attribute is
  // absent, so the operating system keeps answering by itself, and the attribute pins it when
  // the reader has said otherwise. The thirteen type colours in the stylesheet render.js
  // generates are on the same property, so the tiles and the chrome turn together.
  //
  // IT IS IN THE WIRING FILE BECAUSE IT BELONGS TO THE PAGE AND NOT TO A VIEW. The theme is the
  // one control here that is true of the board, the student list and all seven drawings at once,
  // so it has no other module to sit in. It has been edited alone twice, #55 and #57, and would
  // earn a file of its own the moment it grows a third state or a second mechanism.
  //
  // The attribute is set twice on a load, and that is on purpose rather than an oversight: the
  // four lines inline in index.html set it before the first paint, because this file is at the
  // foot of the body and a reader who chose dark on a light machine would otherwise watch a
  // white page turn over on every load. Those four lines know one thing, the two attribute
  // values; everything else about the choice is here, so there is one place to change and not
  // two. Issue 57.
  var THEME_KEY = 'zmt.theme';        // namespaced as feedback.js namespaces zmt.gh.token
  var THEMES = ['system', 'light', 'dark'];
  // What the control says about the state it is in, and what pressing it will do next. The
  // hint matters more here than on a two-state toggle: the reader cannot see the third state
  // from the second one.
  //
  // IT IS BEHIND A PRESS SINCE ISSUE 120, AND #57's FINDING IS WHY IT IS A MENU RATHER THAN A
  // HIDDEN CYCLE. That card put the choice on the face of the control because three states cannot
  // be read off a two state switch. The finding is right and the conclusion has moved: what a
  // reader could not tell was which of the three was on, and a list of three with the current one
  // marked answers that better than a label does, because it also says what the other two are
  // without anybody having to press twice to find out. What went with the label is a permanent
  // 97 CSS px of the row's anchor position, spent on a choice made about once and on a value the
  // page is already showing the reader: a light page is the theme saying light.
  var THEME_STATE = {
    system: 'the theme follows the operating system',
    light: 'the theme is light, whatever the operating system says',
    dark: 'the theme is dark, whatever the operating system says'
  };
  // What each choice does, said in the box rather than in a tooltip. `system` is the one a reader
  // cannot infer from the page in front of them, which is #57's whole finding, so it is the one
  // the sentence is about.
  // #128. Each of the three said its state and then said what the three buttons underneath it
  // do, which is what a button labelled `system` beside one labelled `light` says by existing.
  // The state is what is left.
  var THEME_WORDS = {
    system: 'This page is following the operating system.',
    light: 'This page is on light, whatever the operating system says.',
    dark: 'This page is on dark, whatever the operating system says.'
  };
  var thBtn = document.getElementById('thtoggle');
  var thMenu = document.getElementById('thmenu');
  var theme = 'system';

  function themeMenuOpen() { return !!thMenu && !thMenu.hidden; }

  function showThemeMenu(on) {
    if (!thMenu || themeMenuOpen() === on) return;
    if (on) buildThemeMenu();
    thMenu.hidden = !on;
    if (thBtn) thBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
  }

  function themeItem(choice) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'thitem';
    b.textContent = choice;
    // The mark is an attribute and not a weight alone, for the scope chip's reason: which one is on has
    // to survive a forced-colours mode and a reader who cannot see the difference.
    if (choice === theme) b.setAttribute('aria-current', 'true');
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      applyTheme(choice);
      // `system` is written out rather than removed, because "I chose to follow the machine" and
      // "I have never chosen" are different facts even though they draw the same page. An
      // unreadable or absent key still means system, so clearing storage falls back correctly.
      try { localStorage.setItem(THEME_KEY, theme); } catch (e2) { /* nothing persists, page turns */ }
      showThemeMenu(false);
      if (thBtn && thBtn.focus) thBtn.focus();
    });
    return b;
  }

  function buildThemeMenu() {
    if (!thMenu) return;
    thMenu.textContent = '';
    var head = document.createElement('p');
    head.className = 'th-scope';
    head.textContent = THEME_WORDS[theme];
    thMenu.appendChild(head);
    var row = document.createElement('p');
    row.className = 'th-row';
    THEMES.forEach(function (c) { row.appendChild(themeItem(c)); });
    thMenu.appendChild(row);
  }

  function applyTheme(choice) {
    theme = THEMES.indexOf(choice) === -1 ? 'system' : choice;
    // Absent for system, so the media half of app.css's switch is what answers, which is the
    // page exactly as it behaved before this control existed.
    if (theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
    // The state is in the title now instead of on the face, and the box under it is where a
    // reader is shown it. The text of the control is the word `theme` and never changes, so it
    // is in index.html with the other labels that do not.
    if (thBtn) thBtn.title = 'colour theme: ' + THEME_STATE[theme] + '. Press to choose';
    if (themeMenuOpen()) buildThemeMenu();
  }

  if (thBtn) {
    var stored = null;
    try { stored = localStorage.getItem(THEME_KEY); } catch (e) { stored = null; }
    applyTheme(stored);
  }

  // The same three listeners the altitude and the gap count have, in the same shapes and for the
  // same reasons. Issue 120.
  if (thBtn && thMenu) {
    thBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      showThemeMenu(!themeMenuOpen());
    });
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('#thpick')) return;
      showThemeMenu(false);
    });
    document.addEventListener('focusin', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('#thpick')) return;
      showThemeMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !themeMenuOpen()) return;
      if (document.body.classList.contains('fb-mode')) return;
      e.preventDefault();
      e.stopPropagation();
      showThemeMenu(false);
      if (thBtn.focus) thBtn.focus();
    }, true);
  }

  // ---- ghosts on or off ----------------------------------------------------
  // Shown by default. The absences are the finding, so the reader meets them first, and the
  // toggle is there for the times the question is only about what the systems do hold. Page-wide
  // like the theme, and one class on the body, so the stylesheet does the work; the one thing it
  // has to ask the selection is whether the node it is about to hide is the node the panel is
  // describing.
  var ghBtn = document.getElementById('ghtoggle');
  if (ghBtn) {
    ghBtn.addEventListener('click', function () {
      var next = ghBtn.getAttribute('aria-pressed') !== 'true';
      ghBtn.setAttribute('aria-pressed', next ? 'true' : 'false');
      document.body.classList.toggle('hide-ghosts', !next);
      var n = selection.node();
      if (!next && n && n.ghost) selection.clear();
      // Issue 120. The tile reading counts what is on the canvas and this control takes tiles off
      // it, so the reading moves with it. Told directly rather than left to the class observer,
      // for the reason the window and the programme are told directly: the observer is the answer
      // where there is one, and the fallback below it is a hashchange listener, which a toggle
      // that changes no address never reaches.
      describeTiles();
    });
  }

  // ---- what needs attention, issue 98 --------------------------------------
  // THE CARD IN ONE PARAGRAPH. A management tool answers three questions: where am I, what needs
  // attention, what can I do. The header answered the first in the heading and the third in the
  // nav, and answered the second nowhere, on a page whose model already knows the answer. Every
  // property carries a provenance flag and 482 of them read `absent`, which is not a weaker kind
  // of dummy: a dummy value stands in for something a system holds and an absent one says no
  // system holds it. Until this control the only way to meet one was to click a tile and read the
  // list, so the model knew eleven sessions have nobody assigned to teach them and no view said
  // it. That sentence is one count away and it is the most useful sentence this page can show.
  //
  // IT COMPOSES WITH THE WINDOW, WHICH IS WHY IT IS IN THIS ROW AND NOT IN A SHEET. #100 made the
  // time window filter the drawing rather than dim it, so the drawing on screen IS the answer to
  // "these three weeks". Counting what is missing in what is drawn therefore costs nothing and
  // answers the question a reader brings to a Monday meeting, which is not "what is missing" but
  // "what is missing in the next three weeks". Two controls side by side and one sentence between
  // them.
  //
  // 482 IS NOT THE NUMBER THIS SHOWS, AND THAT IS A DECISION RATHER THAN A ROUNDING. Every node's
  // property list opens with `n.route` rows answering how a class gets filled at all, and 303 of
  // the 482 are in there: `route_system` on the programme is "no registry, four lists disagree",
  // which is a fact about the business's systems and is the same fact on every tile of that class.
  // A fourth of what is left, 84 rows, is on ghost tiles, where the class itself does not exist in
  // any system and the whole tile is already the finding, drawn dashed and switchable. What is
  // left is 95 rows across the seven programmes, each one a value a real object should have and
  // does not, and those are the ones a person can do something about. The boundary is the model's
  // own `route` count and not a list of field names kept here, so a class that gains a property
  // lands on the right side of it without this file being edited.
  //
  // THE COUNT IS OVER WHAT THE VIEW IS SHOWING, one rule, and every route follows from it. On the
  // diagram it is the tiles on the canvas, which the window has already filtered and whose cascade
  // has already taken out the templates and instructors that were only there for a filtered
  // session. On #/calendar it is the sessions that reading lists and on #/outline the templates,
  // scoped to one programme when the address is, and the window applies to the calendar and not to
  // the outline because that is the split #90 shipped and #100 kept. On #/board and #/students it
  // is withdrawn, in app.css beside the window control's own rule and for the same reason: the
  // board is issues and not the model, the roster carries no flag on any row, and a count of the
  // drawing behind an opaque box is `ghosts`'s defect with a number on it.
  //
  // THE DENOMINATOR IS THE WHOLE MODEL AND IS CONSTANT. `weeks: 3 of 24` is the idiom and this is
  // the same one: the numerator moves with the view and the denominator is every such value in the
  // documents. It is counted here, once, off all seven, so a drawing that gains a programme moves
  // it without anybody editing a number.
  //
  // AND IT IS NOT HOW MUCH OF THE BUSINESS THE VIEW IS, WHICH IS WHAT THIS COMMENT USED TO CLAIM.
  // Issue 122. Five of the seven documents hold a sample of their programme, so 95 is the count
  // over eighty three of the two hundred and sixty sessions the model declares and is a property
  // of what was drawn. Nothing here can say otherwise, because an undrawn row carries no property
  // and therefore no flag: a denominator over the term is not a number this page holds. What the
  // page can say is how much of the term the rows under this count are, and it says it in the
  // heading immediately to the left of this control and in both of the sheet's own sentences,
  // which is where issue 122 put it rather than adding a fifth reading to a row #120 had just
  // finished cutting down.
  //
  // IN THE WIRING FILE FOR THE REASON `ghosts` IS. The count needs all seven views, which only
  // this file holds; the window, which term.js holds; the drawing on screen, which render.js
  // holds; and the address, which four modules write onto the body between them. Any other home
  // would have to be handed three of the four.
  var gapsBtn = document.getElementById('gapsbtn');
  var gapsMenu = document.getElementById('gapsmenu');
  // Issue 120. The control is a reading now, so it is a label the page never rewrites and a value
  // the page rewrites constantly, and only the second of the two is here. The label is in
  // index.html beside the other three, where a reader of the markup can see the four together and
  // see that they are one instrument.
  var gapsVal = document.getElementById('gapsval');

  // The type's own name, from the drawing's type table, pluralised. A noun typed here would be a
  // second name for a class that already has one, which is the mistake the footer's counts exist
  // to avoid.
  function plural(word, n) {
    if (n === 1 || /s$/.test(word)) return word;
    if (/[^aeiou]y$/.test(word)) return word.slice(0, -1) + 'ies';
    return word + 's';
  }

  function typeWords(type, n) {
    return plural(String(render.typeLabel(type) || type).toLowerCase(), n);
  }

  // One pass over a set of nodes. The two exclusions are argued above: the route rows, which are
  // about the class rather than about the object, and the ghosts, which are the absence rather
  // than a hole in something present. It used to exclude `n.outside` as well, #100's per lane
  // count tile, which was drawn by render.js and was in no model at all; #111 took those tiles off
  // the drawing, so nothing reaching this function is anything but a node of the model.
  // ---- the split, issue 125 -------------------------------------------------
  // TWO KINDS OF THING UNDER ONE NUMBER, AND THAT IS THE WHOLE OF THIS CARD. The registry the
  // model ships answers, per class, which system holds a row of it, and `system: null` means none
  // does. Joined against the 95 that answer decides whether the row is work:
  //
  //   22 have a system. A row exists in Notion or in the finance tool and one of its fields is
  //      empty, so somebody can open that row this week and fill it in.
  //   73 have none. No system anywhere records the fact, so no effort inside the tooling that
  //      exists closes them; they are process decisions and they will still be true in a year.
  //
  // A MENU THAT SHOWS THEM AS ONE LIST OF 95 IS A THERMOMETER. It says how bad things are and
  // gives a reader no way to tell the four rows they could act on from the ninety one they could
  // not. The split is read off `routes.classes[<class>].system` and off nothing kept here, so a
  // class that gains a system moves to the other side of it without this file being edited.
  var ROUTE_CLASSES = (GI && GI.routes && GI.routes.classes) || {};

  function heldBySystem(n) {
    var e = ROUTE_CLASSES[n && n['class']];
    return !!(e && e.system);
  }

  // Keyed on the CLASS and not on the type, which is a repair this card had to make before it
  // could group by anything: two classes share the type Company, the employer and the empresa
  // colaboradora, and one of them has a system and the other does not. Grouping by type would put
  // rows from both sides of the split under one heading the moment a field name collided.
  function gapsOf(nodes) {
    var by = {}, keys = [], total = 0;
    (nodes || []).forEach(function (n) {
      if (n.ghost) return;
      var props = n.props || [], first = n.route || 0, i, p, k;
      for (i = first; i < props.length; i++) {
        p = props[i];
        if (p.f !== 'absent') continue;
        k = n['class'] + ' ' + p.k;
        if (!by[k]) {
          by[k] = { type: n.type, cls: n['class'], field: p.k, n: 0,
                    system: heldBySystem(n), ids: [] };
          keys.push(k);
        }
        by[k].n++;
        // The objects themselves, because a row that can be pressed has to be able to say which
        // things it would take the reader to, and because a driver checking that the number and
        // the destination are the same set needs the set.
        by[k].ids.push(n.id);
        total++;
      }
    });
    return {
      total: total,
      rows: keys.map(function (k) { return by[k]; }).sort(function (a, b) {
        // The work first, which is the ordering the split exists to make. Inside each side it is
        // the ordering this menu has had since #98, biggest count first.
        if (a.system !== b.system) return a.system ? -1 : 1;
        if (b.n !== a.n) return b.n - a.n;
        if (a.type !== b.type) return a.type < b.type ? -1 : 1;
        return a.field < b.field ? -1 : 1;
      })
    };
  }

  var GAPS_ALL = (function () {
    var all = [];
    VIEWS.forEach(function (v) { all = all.concat(v.drawing.nodes); });
    return gapsOf(all).total;
  })();

  // The window in the words the window's own control uses, so the two cannot come to describe the
  // same weeks differently. term.js writes the sentence; nothing here composes one.
  function windowWords() {
    var spec = term.windowSpec();
    return spec ? spec.text : 'the whole term';
  }

  // Which nodes this view is showing, and how to say so. null means the control does not belong
  // on this route at all, which app.css has already acted on.
  function gapScope() {
    var cls = document.body.classList;
    if (cls.contains('board') || cls.contains('students')) return null;
    var rows = term.readingRows();
    if (rows) {
      var st = term.state();
      var spec = rows.window ? term.windowSpec() : null;
      var views = st.scope
        ? VIEWS.filter(function (v) { return v.key === st.scope; })
        : VIEWS;
      var nodes = [];
      views.forEach(function (v) {
        v.drawing.nodes.forEach(function (n) {
          if (n.type !== rows.type) return;
          if (spec && spec.out(n)) return;
          // Issue 125. A worklist is a third thing taking rows off the reading, so it takes them
          // off this count too. The rule this control has run on since #98 is that the count is
          // over what the view is SHOWING, and a reading filtered to eleven rows is showing
          // eleven: `95` over that screen would be the same wrongness #121 was filed about with
          // the numbers the other way round.
          if (rows.gap && !isAbsent(n, rows.gap)) return;
          nodes.push(n);
        });
      });
      return {
        nodes: nodes,
        view: views.length === 1 ? views[0] : null,
        subject: 'the ' + typeWords(rows.type, 2) + ' this reading lists',
        where: (views.length === 1 ? (views[0].label || views[0].code)
                                   : 'all ' + VIEWS.length + ' programmes') +
               ', ' + (rows.window ? windowWords() : 'the whole term')
      };
    }
    // Issue 136. THE SUBJECT OF THE COUNT IS THE SCOPE AND NOT THE FIRST OF IT. On a drawing of
    // several programmes a sentence reading `Z-IB, the whole term` over a count taken across all
    // seven names one seventh of its own population, which is the exact defect #121 was filed
    // about with the numbers the other way round. A scope of one reads as it always read.
    // `view` is what a row of work is taken to, and a row that spans programmes has no single
    // programme to be taken to, so it is null and destinationFor() falls back to the unscoped
    // review, which is the reading that holds all seven.
    var sc = router.scope();
    return {
      nodes: render.drawing().nodes,
      view: sc.length === 1 ? sc[0] : null,
      subject: 'the tiles on this drawing',
      where: scopeWords(sc) + ', ' + windowWords()
    };
  }

  // The scope in words, and it never sums anything: one programme is named, and more than one is
  // counted and listed by code. Issue 136.
  function scopeWords(sc) {
    if (sc.length === 1) return sc[0].label || sc[0].code;
    if (sc.length === VIEWS.length) return 'all ' + VIEWS.length + ' programmes';
    return sc.length + ' programmes, ' + sc.map(function (v) { return v.code || v.key; }).join(', ');
  }

  // Whether one node carries this field flagged absent, on the same boundary gapsOf() draws: the
  // route rows are about the class and everything after them is about the object.
  function isAbsent(n, field) {
    var props = n.props || [], i;
    for (i = (n.route || 0); i < props.length; i++) {
      if (props[i].k === field) return props[i].f === 'absent';
    }
    return false;
  }

  function gapsMenuOpen() { return !!gapsMenu && !gapsMenu.hidden; }

  function showGapsMenu(on) {
    if (!gapsMenu || gapsMenuOpen() === on) return;
    gapsMenu.hidden = !on;
    if (gapsBtn) gapsBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
  }

  // ---- the words, and after this card there is one set of them, issue 125 ----
  // THREE WORDS FOR TWO FINDINGS IS WHAT THE PAGE HAD. `gaps` counts values a real object should
  // carry and does not, `ghosts` switches the classes that exist in no system at all, and the
  // registry says of those same classes that nothing holds a row for them. The critic's reading
  // is that two of the three are one finding at two grains: a class no system holds, met either
  // as a dashed tile or as the reason a field on a solid tile can never be filled. So the second
  // heading below is not written here. It is READ, from the ghost type's own label and from the
  // registry's own vocabulary, and the page says one thing in one wording wherever it comes up.
  // The third word is a word for something else and stays: 22 of the 95 are a row that exists
  // with an empty field in it, which is neither a ghost nor a class with no system.
  function noSystemWords() {
    return String((render.typeLabel && render.typeLabel('Ghost')) || '');
  }

  function noSystemWhy() {
    var v = GI && GI.routes && GI.routes.vocab && GI.routes.vocab.read;
    return (v && v['no-source']) || '';
  }

  function sideTotal(rows, system) {
    var n = 0;
    rows.forEach(function (r) { if (r.system === system) n += r.n; });
    return n;
  }

  // The heading over one side of the split, and the sentence under the second one. A fragment
  // rather than an element because the no-system side is a heading AND the registry's own reason,
  // and a reader who is told these are not work is owed the reason in the same breath.
  function groupHead(system, rows) {
    var frag = document.createDocumentFragment();
    var p = document.createElement('p');
    p.className = 'gaps-head';
    p.textContent = (system ? 'A system holds the row and the field is empty'
                            : 'The class ' + noSystemWords()) +
                    ' · ' + sideTotal(rows, system);
    frag.appendChild(p);
    if (!system) {
      var why = document.createElement('p');
      why.className = 'gaps-why';
      why.textContent = noSystemWhy();
      frag.appendChild(why);
    }
    return frag;
  }

  // ---- and where a row of work goes, issue 125 -------------------------------
  // THE ANSWER IS WHEREVER THE PAGE ALREADY LISTS EXACTLY THOSE OBJECTS, which is why this card
  // adds no address and no view. There are two such places. The review that #124 built lists
  // cohort sessions, ranked and windowed, and takes a worklist on its own address; and the
  // drawing lists everything one programme holds, where the way to one object is to select it.
  // A row this page cannot answer for is left as text rather than given a control that would
  // guess: a button that lands somewhere approximate is worse than a number.
  function destinationFor(r, sc) {
    if (r.type === 'CohortSession') {
      var href = term.gapAddress(r.field, sc.view);
      if (href.indexOf('?gap=') === -1) return null;
      return {
        title: 'the ' + r.n + ' of them, in the review, at this same window',
        go: function () { location.hash = href; }
      };
    }
    // One object and one place to put it. The count is per drawing here, so this is the row on
    // the picture the reader is looking at; a row naming several is not offered, because there is
    // no address that is those several and inventing one is what this card was told not to do.
    if (r.ids.length !== 1 || term.isOpen()) return null;
    var id = r.ids[0], on = false;
    render.drawing().nodes.forEach(function (n) { if (n.id === id) on = true; });
    if (!on) return null;
    return {
      title: 'the one it is, on this drawing, with its properties open',
      go: function () {
        var cur = selection.selected();
        if (!cur || cur.id !== id) selection.select(id);
      }
    };
  }

  // One row of the menu. A control where the page can take the reader to the objects and a plain
  // row where it cannot, and the difference is visible before the press rather than after it.
  function gapRow(r, sc) {
    var dest = r.system ? destinationFor(r, sc) : null;
    var row = document.createElement(dest ? 'button' : 'div');
    row.className = 'gaps-row' + (dest ? ' gaps-go' : '');
    if (dest) {
      row.type = 'button';
      row.title = dest.title;
      row.addEventListener('click', function (e) {
        e.stopPropagation();
        showGapsMenu(false);
        dest.go();
      });
    }
    var n = document.createElement('span');
    n.className = 'gaps-n';
    n.textContent = r.n;
    var what = document.createElement('span');
    what.className = 'gaps-what';
    // The leading space is for the reader of the TEXT and not for the reader of the page. The
    // 8px between the two boxes is the flex gap, and leading whitespace inside a flex item is
    // collapsed away, so this changes no pixel; what it changes is what a capture quotes, which
    // read `28session templates` before it. Issue 99 established that a report quotes the text
    // a reader can see, and two boxes side by side are two words in that reading.
    what.appendChild(document.createTextNode(' ' + typeWords(r.type, r.n) + ' with no '));
    var code = document.createElement('code');
    code.textContent = r.field;
    what.appendChild(code);
    row.appendChild(n);
    row.appendChild(what);
    return row;
  }

  // Everything the control says, rewritten from the model on every change of view. The sentence
  // is built first and used three times: in the box, in the control's title, and nowhere else,
  // because a second copy of it is a second thing to keep true.
  var gapsNow = { total: 0, of: GAPS_ALL, rows: [], scope: null };

  function describeGaps() {
    if (!gapsBtn) return;
    var sc = gapScope();
    if (!sc) {
      showGapsMenu(false);
      gapsNow = { total: null, of: GAPS_ALL, rows: [], scope: null };
      return;
    }
    var g = gapsOf(sc.nodes);
    gapsNow = { total: g.total, of: GAPS_ALL, rows: g.rows, scope: sc.subject + ': ' + sc.where };
    if (gapsVal) gapsVal.textContent = g.total + ' of ' + GAPS_ALL;
    // #128 shortened it and kept both figures and the subject. `values the model records as
    // missing` is the definition of the word on the control this sentence is under, said again
    // one line below it.
    var sentence = (g.total
      ? g.total + ' of the ' + GAPS_ALL + ' missing values are in '
      : 'None of the ' + GAPS_ALL + ' missing values is in ') +
      sc.subject + ': ' + sc.where + '.';
    gapsBtn.title = sentence + ' Press for what they are';
    if (!gapsMenu) return;
    gapsMenu.textContent = '';
    var head = document.createElement('p');
    head.className = 'gaps-scope';
    head.textContent = sentence;
    gapsMenu.appendChild(head);
    // ISSUE 125. THE ROWS UNDER TWO HEADINGS, AND A HEADING IS PRINTED ONLY WHERE IT HAS ROWS.
    // Every route has both kinds on some drawings and one kind on others, and a heading over
    // nothing is a reader being told to look for something that is not there.
    var side = 0;
    g.rows.forEach(function (r) {
      var want = r.system ? 1 : 2;
      if (side !== want) {
        side = want;
        gapsMenu.appendChild(groupHead(r.system, g.rows));
      }
      gapsMenu.appendChild(gapRow(r, sc));
    });
    var foot = document.createElement('p');
    foot.className = 'gaps-foot';
    // WHAT THIS SENTENCE USED TO SAY AND WHY IT DOES NOT. It opened with the definition that
    // separates the two flags, because the count is over one of them and not the other. That half
    // is gone under the owner's instruction of 12 August, issue 110, and what is left is the
    // claim a reader can hold this control to: the number over the list is recomputed rather than
    // written down. #128 cut that claim to its own words and kept the paragraph, which the
    // menu's shape is asserted on.
    foot.textContent = 'Counted off the model, not written down.';
    gapsMenu.appendChild(foot);
  }

  // The three listeners the programme picker and the window control already have, in the same
  // shapes and for the same reasons: the press stops at the control so the document listener does
  // not close what it just opened, anything else closes it, and Escape closes it in the capture
  // phase ahead of the bubble listener in selection.js that clears the selection. Capture mode is
  // left alone, because while it is on Escape is how a reader gets out of it.
  if (gapsBtn && gapsMenu) {
    gapsBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      showGapsMenu(!gapsMenuOpen());
    });
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('#gapspick')) return;
      showGapsMenu(false);
    });
    document.addEventListener('focusin', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('#gapspick')) return;
      showGapsMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !gapsMenuOpen()) return;
      if (document.body.classList.contains('fb-mode')) return;
      e.preventDefault();
      e.stopPropagation();
      showGapsMenu(false);
      if (gapsBtn.focus) gapsBtn.focus();
    }, true);
  }

  // ---- the altitude, issue 89 ----------------------------------------------
  // WHERE THE CONTROL GOES AND WHY IT IS THIS SHAPE. Issue 98 settled the row before this card
  // was built: `weeks` says which part of the term is in focus, `gaps` says what is missing in
  // it, and both are view level. `grain` is the third question of the same kind, at what altitude
  // the drawing is drawn, and it belongs beside them in the same idiom, its own state as its own
  // text. Measured on that card: a control of this label leaves the header at 107px and two nav
  // lines at 390x844, and one line at 1536, with no sideways scroll either way.
  //
  // THE THREE COMPOSE, WHICH IS THE WHOLE ARGUMENT FOR THE ROW. "The next three weeks, by module,
  // and what is missing in that" is three controls the reader can see at once, and it is the
  // question somebody actually brings to a Monday meeting. Nothing here knows about the other
  // two; they compose because each acts on the drawing and the drawing is one picture.
  //
  // THE STATE IS THE ADDRESS AND NOT A VARIABLE HERE. router.js reads it out of the hash and
  // writes it back, this file only asks; a second copy would be the way a control and a link come
  // to disagree about what is on screen.
  var grBtn = document.getElementById('grbtn');
  var grMenu = document.getElementById('grmenu');
  // Issue 120, and the same split as the gap count's: the label is markup and the value is code.
  var grVal = document.getElementById('grval');

  function grainMenuOpen() { return !!grMenu && !grMenu.hidden; }

  function showGrainMenu(on) {
    if (!grMenu || grainMenuOpen() === on) return;
    grMenu.hidden = !on;
    if (grBtn) grBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
  }

  // How many tiles each altitude draws in the two syllabus lanes of the view on screen, counted
  // off the drawings themselves. It is the number that decides whether the control is worth
  // pressing, and it is the number that explains what it did on a view where the answer is
  // "nothing": Z-CFA names no module on any of its forty five syllabus rows, so both altitudes
  // draw the same six tiles and the sentence says so instead of the picture saying nothing.
  var LANE_TYPES = { SessionTemplate: 1, Module: 1, CohortSession: 1, ModuleDelivery: 1 };

  function laneCount(v) {
    var n = 0;
    ((v && v.drawing && v.drawing.nodes) || []).forEach(function (x) {
      if (LANE_TYPES[x.type]) n++;
    });
    return n;
  }

  // ISSUE 136 GAVE THIS A SECOND CASE AND THE TWO ARE DIFFERENT SENTENCES. With one programme in
  // scope it is what it has always been: how many modules that syllabus declares, how many
  // templates fall in none of them, and what each altitude costs the two syllabus lanes. With
  // several, none of those can be stated as one number without adding up seven syllabi, which is
  // precisely the total across programmes this design has no cell for. What survives a merge is
  // the tile count, which is arithmetic over the picture on screen and says nothing about the
  // business, so that is what the control reports and it names the scope it is over.
  function grainFacts() {
    var sc = router.scope(), v = sc[0];
    var mods = (v.alt && v.alt.counts && v.alt.counts.Module) || { drawn: 0, total: 0 };
    var loose = (v.alt && v.alt.counts && v.alt.counts.SessionTemplate) || { drawn: 0, total: 0 };
    var rel = (v.alt && v.alt.counts && v.alt.counts.Relationship) || { folded: 0, inside: 0 };
    var st = 0, mt = 0, folded = 0, inside = 0;
    sc.forEach(function (w) {
      st += laneCount(w);
      mt += laneCount(w.alt || w);
      var r = (w.alt && w.alt.counts && w.alt.counts.Relationship) || {};
      folded += r.folded || 0;
      inside += r.inside || 0;
    });
    var asked = router.grain(), on = effectiveGrain();
    return { view: v, scope: sc, grain: on, asked: asked,
             refused: on !== asked ? asked : null,
             load: sessionLoad(sc, 'sessions'), budget: SESSION_BUDGET,
             modules: mods.drawn, ofModules: mods.total,
             loose: loose.drawn, ofSessions: loose.total,
             sessionTiles: st, moduleTiles: mt,
             folded: sc.length === 1 ? (rel.folded || 0) : folded,
             inside: sc.length === 1 ? (rel.inside || 0) : inside };
  }

  // One sentence, written from the counts and used by the control, by its title and by the menu,
  // so the three cannot come to describe the same view differently.
  function grainWords(f) {
    if (f.scope.length > 1) {
      return f.moduleTiles + ' tiles in the two syllabus lanes at the modules grain against ' +
             f.sessionTiles + ' at sessions, over ' + scopeWords(f.scope);
    }
    if (!f.ofModules) {
      return 'the syllabus records no module on any of its ' + f.ofSessions +
             ' rows, so both altitudes draw the same ' + f.sessionTiles + ' tiles';
    }
    var s = f.modules + (f.modules === 1 ? ' module' : ' modules') + ' of the ' + f.ofModules +
            ' the syllabus declares';
    if (f.loose) {
      s += ', and ' + f.loose + (f.loose === 1 ? ' session template' : ' session templates') +
           ' in no module';
    }
    return s + '. ' + f.moduleTiles + ' tiles in the two syllabus lanes against ' +
           f.sessionTiles;
  }

  // ---- and where a refusal is printed, issue 136 -----------------------------
  // ON THE CONTROL THAT WAS REFUSED, WITH THE NUMBER THAT BROKE IT, AND NEVER SILENTLY. The row
  // for the altitude the budget will not draw is not a link: it is a plain box carrying the count
  // beside its own name, `sessions 83`, so a reader who presses the control meets the reason
  // rather than a link that does nothing. The drawing is at the other altitude and the value on
  // the face of the control says so, which is the difference between a refusal and a silence.
  function grainRow(f, g) {
    var refused = f.refused === g;
    var a = document.createElement(refused ? 'span' : 'a');
    a.className = 'gritem' + (refused ? ' gritem-off' : '');
    if (!refused) a.href = router.grainRoute(g);
    a.textContent = g === 'modules' ? 'modules' : 'sessions';
    if (refused) {
      var n = document.createElement('span');
      n.className = 'gritem-n';
      n.textContent = f.load;
      a.appendChild(n);
      a.title = f.load + ' session tiles is over the budget of ' + f.budget +
        ', which is the most this canvas can frame whole. Narrow the window or take a ' +
        'programme out of the scope';
    }
    if (g === f.grain) a.setAttribute('aria-current', 'true');
    a.addEventListener('click', function () { showGrainMenu(false); });
    return a;
  }

  function describeGrain() {
    if (!grBtn) return;
    var f = grainFacts();
    if (grVal) grVal.textContent = f.grain;
    grBtn.title = 'the altitude this drawing is drawn at: ' + grainWords(f) +
      (f.refused ? '. The ' + f.refused + ' grain is ' + f.load + ' tiles, over the budget of ' +
                   f.budget + ', so this drawing is at ' + f.grain
                 : '') +
      '. Press to change';
    if (!grMenu) return;
    grMenu.textContent = '';
    var head = document.createElement('p');
    head.className = 'gr-scope';
    head.textContent = (f.scope.length === 1 ? (f.view.label || f.view.code) + ': ' : '') +
                       grainWords(f) + '.';
    grMenu.appendChild(head);
    if (f.refused) {
      var why = document.createElement('p');
      why.className = 'gr-why';
      why.textContent = 'The ' + f.refused + ' grain would draw ' + f.load +
        ' tiles in the term lane, over the budget of ' + f.budget + ', which is the most this ' +
        'canvas frames whole. Narrow the window, or take a programme out of the scope.';
      grMenu.appendChild(why);
    }
    var row = document.createElement('p');
    row.className = 'gr-row';
    router.grains.forEach(function (g) { row.appendChild(grainRow(f, g)); });
    grMenu.appendChild(row);
    // What the fold cost, said out loud. An aggregate that loses a relationship is the same
    // failure as a lane hiding its own outside count, and this is the one place a reader can be
    // told the number without opening a tile.
    //
    // #128 TOOK THE OTHER BRANCH OFF ENTIRELY. It fired where nothing folded, and a paragraph
    // that reports a fold of zero by saying every line is its own line is a sentence printed to
    // say that this sentence has nothing to say. Where there is a number there is a paragraph.
    if (f.folded || f.inside) {
      var foot = document.createElement('p');
      foot.className = 'gr-foot';
      foot.textContent = 'At the modules grain ' + f.folded + ' further relationships are drawn ' +
        'as lines that already exist, and ' + f.inside + ' have both ends inside one module.';
      grMenu.appendChild(foot);
    }
  }

  // ---- how much is on the drawing, issue 120 -------------------------------
  // THE READING EVERY OTHER CONTROL IN THIS HEADER MOVES, and the only thing that card adds to
  // the page. It is not a control: it holds no state, opens nothing and answers no press. What
  // earns it a place in the row is that it is the number the three readings beside it compose
  // into. The window takes tiles off the drawing, the altitude folds tiles into one another, the
  // programme replaces the whole set and `ghosts` withdraws the tiles no system holds. Each of
  // those is a sentence somewhere in this file and not one of them was ever a number on the page.
  //
  // THE PAGE ALREADY HELD IT AND SAID IT IN A TOOLTIP. #111 took #100's stub tiles off the canvas
  // and moved their count into the window control's title, which is where a number goes when the
  // row it belongs in has no shape to hold it. This row has one now.
  //
  // THE DENOMINATOR APPEARS WHEN THERE IS A DIFFERENCE TO REPORT AND NOT BEFORE. `62` is the
  // drawing. `27 of 62` is the drawing with something taking tiles off it. A reading that wrote
  // `62 of 62` on arrival would spend its width saying nothing on the route a reader is on most
  // of the time, and would make the one state worth noticing look like the ordinary one.
  //
  // GHOSTS COUNT WHEN THEY ARE DRAWN AND NOT WHEN THEY ARE NOT, on both sides of the `of`. That
  // is the whole rule and it is the only rule: this counts what is painted. A tile count that
  // included tiles the reader has just switched off would be a dashboard reading about a picture
  // nobody is looking at.
  var tilesVal = document.getElementById('tilesval');
  var tilesRd = document.getElementById('tilesrd');

  function paintedTiles(g) {
    var hide = document.body.classList.contains('hide-ghosts'), n = 0;
    ((g && g.nodes) || []).forEach(function (x) { if (!(hide && x.ghost)) n++; });
    return n;
  }

  function describeTiles() {
    if (!tilesVal || !render) return;
    // render.drawing() is what is painted, which a window has already filtered; render.canonical()
    // is the artefact the build wrote for this programme at this altitude. The two are the same
    // object whenever no window is on, which is what makes the equality below the honest test of
    // "is anything taking tiles off this" rather than a second copy of the window's own state.
    var shown = paintedTiles(render.drawing());
    var of = paintedTiles(render.canonical() || render.drawing());
    tilesVal.textContent = shown === of ? String(of) : shown + ' of ' + of;
    if (tilesRd) {
      tilesRd.title = (shown === of
        ? of + ' tiles are drawn'
        : shown + ' of the ' + of + ' tiles of this drawing are on screen') +
        ', at the ' + router.grain() + ' grain';
    }
  }

  // Issue 120. The two readings that are arithmetic over what the view is showing, restated
  // together, because every reason to restate one is a reason to restate the other and a pair
  // that has to be remembered separately is a pair that comes apart.
  function describeReadout() {
    describeGaps();
    describeTiles();
  }

  // The same three listeners the gaps control has, in the same shapes and for the same reasons.
  if (grBtn && grMenu) {
    grBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      showGrainMenu(!grainMenuOpen());
    });
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('#grpick')) return;
      showGrainMenu(false);
    });
    document.addEventListener('focusin', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('#grpick')) return;
      showGrainMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !grainMenuOpen()) return;
      if (document.body.classList.contains('fb-mode')) return;
      e.preventDefault();
      e.stopPropagation();
      showGrainMenu(false);
      if (grBtn.focus) grBtn.focus();
    }, true);
  }

  // WHY AN OBSERVER AND NOT A HASHCHANGE LISTENER, which is the same answer #77 gave for --hh. The
  // route classes on the body are written by four different modules: router.js sets `students`
  // where the list opens, term.js sets `calendar` and `outline` where the sheet opens, board.js
  // sets `board`, and board.js loads after this file, so a hashchange listener registered here
  // would run before the class it needs to read had been written. One observer on the one element
  // all four write to answers every route, in either direction, and any reason a later card
  // invents. The window and the programme are told directly, in windowChanged() and showView(),
  // because those two change the count without changing a class.
  if (window.MutationObserver) {
    new MutationObserver(describeReadout)
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
  } else {
    window.addEventListener('hashchange', function () { setTimeout(describeReadout, 0); });
  }

  // ---- how to read this ----------------------------------------------------
  // Issue 79. The footer used to carry three instructions in running text: what clicking does,
  // what the mouse does, and that the programme name opens the other six. An instruction written
  // into a permanent strip is read once and then occupies the screen forever, and on a phone
  // those three cost a sixth of the viewport for as long as the page was open. They are here
  // instead, closed on arrival, one control wide.
  //
  // IT IS A DISCLOSURE AND NOT A DIALOG, which is why this is fifteen lines and not a focus trap.
  // Nothing behind it is inert, the content is four sentences of text with no control in it, and
  // the box is absolutely positioned so opening it moves neither the footer nor the canvas. The
  // three listeners are the three the programme menu already has, in the same shapes and for the
  // same reasons: the click on the control stops there so the document listener does not close
  // what it just opened, a click anywhere else closes it, and Escape closes it in the capture
  // phase, ahead of the bubble listener in selection.js that clears the selection, so a reader
  // who opens this and changes their mind does not also lose the node they had open behind it.
  // Capture mode is left alone for the reason the student list and the programme menu leave it
  // alone: while it is on, Escape is how a reader gets out of it.
  //
  // IN THE WIRING FILE FOR THE REASON THE THEME IS. It belongs to the page rather than to a view:
  // the same four sentences are true of all seven drawings, and there is no module whose subject
  // it is.
  var helpBtn = document.getElementById('helpbtn');
  var helpBox = document.getElementById('helpbox');

  function helpOpen() { return !!helpBox && !helpBox.hidden; }

  function showHelp(on) {
    if (!helpBtn || !helpBox || helpOpen() === on) return;
    helpBox.hidden = !on;
    helpBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
  }

  if (helpBtn && helpBox) {
    helpBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      showHelp(!helpOpen());
    });
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('.helppick')) return;
      showHelp(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !helpOpen()) return;
      if (document.body.classList.contains('fb-mode')) return;
      e.preventDefault();
      e.stopPropagation();
      showHelp(false);
      if (helpBtn.focus) helpBtn.focus();
    }, true);
  }

  // The student list and the programme description are both read off the drawing, so neither can
  // run before there is one on the canvas.
  router.start();
  // And the address may already be one of the term's two, which is what makes a link to
  // #/calendar or #/outline open on the reading it names rather than on the diagram.
  term.start();
  // Issue 98. After term.start(), because the address may already be a reading and the count is a
  // count of what the view on screen is showing. The observer takes it from here.
  describeReadout();
  // Issue 111. term.start() described the window before render had drawn anything, so the count
  // of what the window takes off the drawing was the one thing it could not state. Restated here,
  // once, for the same reason describeGaps is called here.
  term.restateWindow();
  // Issue 89. Beside it and for the same reason: the control's text is its state, and its state
  // may already have come out of the address a reader followed.
  describeGrain();
  measureHeader();
  window.addEventListener('resize', measureHeader);
  // The header changes height for more reasons than a resize: capture mode widens its own toggle
  // and wraps the nav, a route swaps the heading for a longer or shorter one, and a programme with
  // a longer name can take a second line on a phone. Every one of those was a way for --hh to
  // fall behind the header it is supposed to measure, and each was a hashchange or a click
  // somebody had to remember to hook. One observer on the element answers all of them and any
  // reason a later card invents. The resize listener stays as the answer where there is no
  // ResizeObserver. Issue 77.
  if (window.ResizeObserver && hdr) new ResizeObserver(measureHeader).observe(hdr);

  // What feedback.js needs in order to say what was on screen when a note was written, plus the
  // view, which is here for a driver to read and assert against rather than for the page: an
  // anchored zoom is a claim about arithmetic and the only honest way to check it is to take the
  // numbers off the running page before and after.
  //
  // IT IS PUBLISHED FROM THE WIRING FILE, AND LAST. Every value in it comes from a different
  // module, so this object is the shape of the whole page and belongs to the one file that can
  // see all of it. It is also the page's own readiness signal: scripts/smoke.mjs waits on
  // window.ZT existing, which means this statement ran, which means every module above was built
  // and wired without throwing. Nothing may be added after it.
  window.ZT = {
    // The digest of the drawing, under a name that cannot be read as a revision, and the commit
    // the page was deployed from, which is the value that answers "what code was this". The
    // commit is read from window.ZV, written by the deploy workflow into site/version.js, and is
    // null on anything that was not published by it. Issue 47. Both are here for a driver to read
    // off the running page; feedback.js reads window.ZV itself rather than through this object,
    // because it has to be able to name the commit in a run where this file threw.
    drawingDigest: render.drawing().drawingDigest || 'unknown',
    commit: (window.ZV && window.ZV.commit) || null,
    // When that commit was published, which is the other half of "is this reader on a stale
    // page": the commit says which code and this says how long the origin has been serving it.
    deployedAt: (window.ZV && window.ZV.deployedAt) || null,
    selected: function () { return selection.selected(); },
    view: function () { return viewport.state(); },
    fit: function () { viewport.fit(); },
    // Which of the seven is drawn, for the same reason view() and theme() are here: a driver
    // checking that an address reached the right drawing should read the page's own answer rather
    // than infer it from a screenshot of seven near identical pictures. The extent comes off the
    // drawing that is loaded, so it is the number the fit is framing and not a copy of it.
    programme: function () {
      var v = router.view(), g = render.drawing();
      return { key: v.key, code: v.code, label: v.label,
               digest: g.drawingDigest || 'unknown', w: g.w, h: g.h,
               menu: router.pgMenuOpen() };
    },
    // Issue 136. THE SCOPE, AND WHAT THE UNION DID TO IT, read off the page rather than inferred
    // from a screenshot of a very tall drawing. `keys` is the set in the build's order, which is
    // the order the sectors are in; `shared` is every object drawn once for more than one
    // programme, which is the whole mechanism that makes an inter-programme line exist; `sectors`
    // is how many slices the canvas is in, so a driver can check that a programme added below
    // moved nothing above it. `canon` is the digest of what is on the canvas, which for a scope of
    // one is the build's own and for a union names the artefacts it was built from.
    scope: function () {
      var sc = router.scope(), c = render.canonical() || {};
      var shared = (c.shared || []).slice();
      var secs = {};
      (c.nodes || []).forEach(function (n) { if (n.sec !== null && n.sec !== undefined) secs[n.sec] = 1; });
      return {
        keys: sc.map(function (v) { return v.key; }),
        codes: sc.map(function (v) { return v.code; }),
        route: router.scopeRoute(sc),
        all: router.allRoute(),
        n: sc.length, of: VIEWS.length,
        union: sc.length > 1,
        shared: shared,
        sectors: Object.keys(secs).length,
        programmes: (c.programmes || []).map(function (p) { return p.key; }),
        canon: c.drawingDigest || 'unknown',
        w: c.w, h: c.h,
        // The chips as the reader meets them: what each says, where each goes and which are on.
        // Read off the rendered rail, so an assertion about the fractions is an assertion about
        // what is painted rather than about the model this file could recompute.
        chips: Array.prototype.slice
          .call(document.querySelectorAll('#pgrail .chip'))
          .map(function (a) {
            var k = a.querySelector('.chip-k'), f = a.querySelector('.chip-n');
            return { code: k ? k.textContent : '', fraction: f ? f.textContent : null,
                     href: a.getAttribute('href'),
                     on: a.getAttribute('aria-current') === 'true' };
          })
      };
    },
    // The theme, for the same reason view() is here: which of the three the reader is on, what
    // the machine is saying underneath it, and what the page actually resolved to are three
    // different claims, and a driver checking an override should be able to read all three off
    // the running page rather than infer them from a screenshot. `resolved` is taken from the
    // used value of color-scheme, which is the one property the whole cascade turns on.
    theme: function () {
      var attr = document.documentElement.getAttribute('data-theme');
      var used = getComputedStyle(document.documentElement).colorScheme;
      return {
        choice: theme,
        attr: attr,
        system: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        resolved: used === 'light dark'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : used
      };
    },
    veiled: function () { return selection.veiledState(); },
    roster: function () { return router.rosterOpen(); },
    // The term sheet, for the reason the roster and the view are here: whether a table holds the
    // rows it says it holds, and whether the sample it declares is the sample it drew, are claims
    // that should be read off the running page rather than inferred from a screenshot of 83 rows.
    // Every number in it is counted off the rows term.js built, so it cannot report a total the
    // sheet is not showing. Issues 80 and 82.
    term: function () { return term.state(); },
    // Every address the sheet answers, built by the one function that builds them. Issue 84 took
    // it from two to sixteen and a driver enumerating them by hand would be enumerating its own
    // guess: that mistake, `#/p/Z-ZIB` against `#/p/ZIB`, produced a false alarm on this page
    // once already, and the rule it left behind is to construct nothing you can read.
    termRoutes: function () { return term.routes.slice(); },
    // Issue 100. What the window did to the drawing, read off the transform that built what is on
    // screen rather than recomputed here, so a driver asserting that a window filters the picture
    // is reading the picture. The window itself is in term() and is not copied here: one place
    // answers it. `reflow` is the claim the build gate cannot make, because the filtered drawing
    // is not an artefact any build wrote: that reflowing the FULL node set reproduces the
    // canonical coordinates, which is what makes the filtered drawing the build's own geometry
    // with tiles taken out rather than a second opinion about where things go.
    filtered: function () { return render.windowState(); },
    reflow: function () { return render.reflowCheck(); },
    // Issue 98. What the header says needs attention, read off the same object the control was
    // written from rather than recomputed here, so a driver asserting the count is asserting the
    // page's own arithmetic and not a second opinion about it. `total` is null on the two routes
    // where the control is withdrawn, which is a different answer from zero and is the one thing
    // a driver could not otherwise tell apart. `of` is the whole model and does not move.
    // Issue 89. Which altitude the drawing is at, what the other one would cost, and what the
    // collapse did to the relationships, read off the same counts the control was written from
    // rather than recomputed here. A driver asserting that the modules grain draws five tiles
    // where the sessions grain draws twenty eight is then asserting the page's own arithmetic.
    // `digest` is this altitude's own artefact digest, which is what makes the two grains two
    // things check_build.sh reproduces rather than one thing and a transform of it.
    grain: function () {
      var f = grainFacts();
      var g = render.canonical() || render.drawing();
      return { grain: f.grain, asked: f.asked, refused: f.refused,
               load: f.load, budget: f.budget,
               route: router.grainRoute(f.grain),
               digest: g.drawingDigest || 'unknown',
               modules: f.modules, ofModules: f.ofModules, loose: f.loose,
               tiles: f.grain === 'modules' ? f.moduleTiles : f.sessionTiles,
               sessionTiles: f.sessionTiles, moduleTiles: f.moduleTiles,
               folded: f.folded, inside: f.inside, menu: grainMenuOpen() };
    },
    gaps: function () {
      return { total: gapsNow.total, of: gapsNow.of, scope: gapsNow.scope,
               rows: gapsNow.rows.map(function (r) {
                 // Issue 125. The class, whether a system holds it and which objects the row is
                 // about, beside the count. A driver checking that the number the reader pressed
                 // and the rows they landed on are the same set needs the set, and a driver
                 // checking the split needs the side each row is on.
                 return { type: r.type, cls: r.cls, field: r.field, n: r.n,
                          system: r.system, ids: r.ids.slice() };
               }),
               // The two sides as totals, so an assertion about the split does not have to sum a
               // list the page also printed: 22 that are work and 73 that are not, over all seven.
               work: sideTotal(gapsNow.rows, true),
               settled: sideTotal(gapsNow.rows, false),
               menu: gapsMenuOpen() };
    }
  };
})();
