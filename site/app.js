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
  // ---- which kind of absence each node carries, issue 139 -------------------
  // THE ONE READER OF THE `absent` FLAG AND OF THE REGISTRY, and it runs here so that the drawing
  // carries its own answer. Two things have to agree about the 22 and the 73: the numbers on the
  // absence control and the empty sockets on the tiles. Deciding it twice, once for a count and
  // once for a paint, is exactly the shape in which those two come to disagree, so it is decided
  // once, at the join, and both of them add up what the nodes already say.
  //
  // THE BOUNDARY IS THE MODEL'S OWN `route` COUNT and not a list of field names kept here, so a
  // class that gains a property lands on the right side of it without this file being edited.
  // Every node's property list opens with `n.route` rows answering how a class gets filled at all,
  // and those are facts about the class rather than about the object.
  //
  // AND THE SPLIT IS READ OFF `routes.classes[<class>].system`, so a class that gains a system
  // moves from one side to the other without this file being edited either. Keyed on the CLASS and
  // never on the type, which is #125's repair: two classes share the type Company, the employer
  // and the empresa colaboradora, and one of them has a system and the other does not.
  function absKind(gi, n) {
    var cls = (gi && gi.routes && gi.routes.classes) || {};
    var out = { w: 0, u: 0 };
    // A ghost is the absence rather than a hole in something present, and its whole tile is
    // already the finding. Its rows are counted on neither side.
    if (n.ghost) return out;
    var e = cls[n['class']], held = !!(e && e.system);
    var props = n.props || [], i;
    for (i = (n.route || 0); i < props.length; i++) {
      if (props[i].f !== 'absent') continue;
      if (held) out.w++; else out.u++;
    }
    return out;
  }

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
          // Issue 139. How many of the 22 and how many of the 73 this object carries, so that the
          // count in the header and the sockets on the tile are one answer read twice.
          var ab = absKind(gi, n);
          out.absW = ab.w;
          out.absU = ab.u;
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
    var g = router.grain(), sc = router.scope();
    // A SCOPE OF ONE IS NEVER REFUSED, AND THAT IS A RULE RATHER THAN AN ARITHMETIC THAT HAPPENS
    // TO HOLD. The seven artefacts the build ships are what they are, the largest of them draws 28
    // tiles in the term lane, and a page that declined to draw a programme's own drawing would be
    // refusing the thing it exists to show. The budget is about what the union stacks up, so it is
    // asked about the union and about nothing else.
    if (sc.length < 2 || g !== 'sessions') return g;
    return sessionLoad(sc, 'sessions') > SESSION_BUDGET ? 'modules' : g;
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

  // WRITTEN ONLY WHEN IT CHANGED, WHICH IS A COST AND NOT A TIDINESS. Issue 145. `--hh` is set on
  // the document element, so writing it invalidates style for everything that could inherit it,
  // which on this page is the whole document including a drawing of up to 2688 SVG elements. This
  // runs from a ResizeObserver on the header and from `onDescribed`, so a drag on the term strip
  // called it once per week crossed and paid a full style recalculation each time to write the
  // same string. Chrome's own sampling profiler put it at 276ms of the 1470ms of script three
  // drags at `#/p/ALL` on a 2560 viewport cost, second only to the label placement this card
  // deleted. The header's height genuinely does change, on the phone and when the heading wraps,
  // and the guard is a string comparison, so nothing that used to be answered is not answered.
  var lastHH = null, hdrObserved = false;
  function measureHeader() {
    var hh = (hdr ? hdr.offsetHeight : 0) + 'px';
    if (hh === lastHH) return;
    lastHH = hh;
    document.documentElement.style.setProperty('--hh', hh);
  }

  // AND THE CALLERS THAT RAN INSIDE A REDRAW DO NOT CALL IT WHILE THE OBSERVER IS WATCHING, which
  // is the rest of issue 145's answer and the larger half of it. The guard above stops the WRITE
  // and the write was not the expensive part: reading `offsetHeight` immediately after the drawing
  // has been replaced forces a synchronous layout of a document holding up to 2688 SVG elements,
  // and it forces it whether or not the number turns out to have changed. With the guard alone the
  // profiler still put this at 459ms of three drags, the largest frame in the run.
  //
  // A ResizeObserver ON THE HEADER IS ALREADY INSTALLED and it is the right instrument: it is
  // delivered after layout and before paint, so `--hh` is right before a reader can see anything,
  // and it fires exactly when the header's box changes, which is exactly when the value is stale.
  // The two eager calls are what a browser without one needs, so they are kept and made
  // conditional rather than deleted: the observer says it owns this, and where there is no
  // observer nothing has changed at all.
  function measureHeaderEagerly() { if (!hdrObserved) measureHeader(); }

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
    onRoute: function () { describeReadout(); measureHeaderEagerly(); },
    // Issue 90. The time window is a page-level state and the drawing obeys it, so the wiring
    // file is what carries the answer from the module that knows what a date means to the module
    // that knows where a node is drawn. render is built after this, so the first call is guarded
    // and the initial state is applied below beside the first draw.
    onWindow: function (spec) { windowChanged(spec); },
    // Issue 145. How many times render.js has rebuilt the drawing, handed over as a question for
    // the reason `onWindow` is a callback: render is built after this. The strip publishes it on
    // its own state so a driver can assert that a run of week crossings inside one animation frame
    // costs one rebuild rather than one each, which is the whole claim the coalescer makes.
    rebuilds: function () { return render ? render.paints() : null; },
    // Issue 137. WHICH PROGRAMMES THE STRIP IS THE DENSITY OF. The column over a week is how many
    // sessions the scope holds in it, and the scope is a set since #136, so the strip has to be
    // told the same set the drawing is. Handed over as a question for `windowEffect`'s reason:
    // `router` is built after this, so an eager read would be a read of nothing, and the answer
    // moves every time the reader presses a chip. showView() restates the control right after it
    // redraws, which is where the repaint comes from.
    drawnScope: function () { return router ? router.scope() : VIEWS; },
    // Issue 138. WHERE CLOSING THE SHEET PUTS THE READER. The sheet is drawn over a drawing and
    // the address of that drawing is the scope and the altitude, both of which are router.js's,
    // so this is the same handover `drawnScope` is and is guarded the same way: `router` is built
    // after this and answering null before it exists is what leaves the sheet its own fallback.
    backRoute: function () { return router ? router.scopeRoute(router.scope()) : null; },
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
    onDescribed: measureHeaderEagerly
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
      // Issue 139 took two boxes off this list with the controls that opened them: the gap menu
      // and the theme menu. What is left is every box this page can put over the canvas, which is
      // the whole of the rule: a digit typed into one of them is not an instruction to move a
      // drawing the reader cannot see.
      return router.rosterOpen() || router.pgMenuOpen() || term.isOpen() || grainMenuOpen();
    },
    // Issue 84's counter-scale. The lane headings are controls and a control keeps its size on
    // screen, so the drawing is told the scale on every change of it.
    onScale: function (k) { render.setCapScale(k); }
  });
  viewport.init();

  // ---- absence is one idea with two numbers that never add, issue 139 -------
  // THE CARD IN ONE PARAGRAPH. Every property in the model carries a provenance flag and 482 of
  // them read `absent`, which is not a weaker kind of dummy: a dummy value stands in for something
  // a system holds and an absent one says no system holds it. #98 put a count of them in the
  // header, #125 split that count in two behind a menu, and #139 deletes the menu, deletes the
  // ghosts toggle beside it, and puts the two numbers un-summed on the face of one control with a
  // switch under each.
  //
  // 482 IS NOT THE NUMBER, AND THAT IS A DECISION RATHER THAN A ROUNDING. Every node's property
  // list opens with `n.route` rows answering how a class gets filled at all, and 303 of the 482
  // are in there: `route_system` on the programme is "no registry, four lists disagree", which is
  // a fact about the business's systems and is the same fact on every tile of that class. A fourth
  // of what is left, 84 rows, is on ghost tiles, where the class itself does not exist in any
  // system and the whole tile is already the finding. What is left is 95 rows across the seven
  // programmes, each one a value a real object should have and does not.
  //
  // AND 95 IS THE NUMBER THIS CARD EXISTS TO STOP THE PAGE PRINTING. The registry the model ships
  // answers, per class, which system holds a row of it, and `system: null` means none does. Joined
  // against the 95 that answer splits them into two populations that are not the same kind of
  // thing and do not belong under one heading:
  //
  //   22 A SYSTEM HOLDS THE ROW AND THE FIELD IS EMPTY. Somebody can open that row this week and
  //      fill it in. Eleven cohort sessions with nobody assigned to teach them, six sponsor links
  //      absent, five instructors with no employer named. This is work.
  //   73 NO SYSTEM ANYWHERE RECORDS THE FACT. No effort inside the tooling that exists closes
  //      them; they are process decisions and they will still be true in a year. Duration 38,
  //      location 13, module 8, cohort identity 7, delivery 6, and the programme's own module
  //      list. This is not work, and calling it work is how a backlog comes to have ninety five
  //      items in it that nobody can ever burn down.
  //
  // THE TWO ARE NEVER ADJACENT TO A PLUS SIGN AND NEVER SHARE A COLOUR. They sit on one control
  // separated by a middle dot, each in its own hue, each carrying its own denominator in the same
  // fraction grammar the chips in the heading use: the left number is what falls inside what is
  // currently drawn and the right is the term total. There is no cell anywhere in this page where
  // 95 could be rendered, and this comment is the only place in the tree the two are added up.
  //
  // EACH SWITCH DRAWS ITS OWN KIND ON THE CANVAS WHERE IT IS MISSING. That is what makes this a
  // control rather than a second thermometer, and it is the whole of what the reader gets that
  // `gaps N of 95` could not give: `work` on puts an empty socket on every node carrying one of
  // the 22, so the eleven unstaffed sessions are on the picture rather than in a list beside it.
  // `unrecorded` is the control this page called `ghosts`, unchanged in what it does to the tiles
  // no system holds, and it now marks the 73 in that same ghost treatment, because a class no
  // system holds is one finding met at two grains: a dashed tile, or a socket on a solid one.
  //
  // THE COUNT IS OVER WHAT THE VIEW IS SHOWING, one rule, and every route follows from it. On the
  // diagram it is the tiles on the canvas, which the window has already filtered and whose cascade
  // has already taken out the templates and instructors that were only there for a filtered
  // session. On #/calendar it is the sessions that reading lists and on #/outline the templates,
  // scoped to one programme when the address is, and the window applies to the calendar and not to
  // the outline because that is the split #90 shipped and #100 kept. On #/board and #/students it
  // is withdrawn, in app.css beside the strip's own rule and for the same reason: the board is
  // issues and not the model, the roster carries no flag on any row, and a count of the drawing
  // behind an opaque box is `ghosts`'s old defect with a number on it.
  //
  // THE DENOMINATORS ARE THE WHOLE MODEL AND ARE CONSTANT. `weeks: 3 of 24` is the idiom and this
  // is the same one twice: each numerator moves with the view and each denominator is every such
  // value in the documents. They are counted here, once, off all seven, so a drawing that gains a
  // programme moves them without anybody editing a number.
  //
  // IN THE WIRING FILE FOR THE REASON `ghosts` WAS. The count needs all seven views, which only
  // this file holds; the window, which term.js holds; the drawing on screen, which render.js
  // holds; and the address, which four modules write onto the body between them.
  var absWorkBtn = document.getElementById('abswork');
  var absUnrecBtn = document.getElementById('absunrec');
  var absWorkVal = document.getElementById('absworkv');
  var absUnrecVal = document.getElementById('absunrecv');

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

  // One pass over a set of nodes, counting each side. absKind() is the single reader of the
  // registry and of the `absent` flag, and it runs at join time so that the drawing carries its
  // own answer: this function adds up what the nodes already say rather than deciding it a second
  // time, which is what keeps the number on the control and the sockets on the canvas from ever
  // being two opinions. Ghost tiles are excluded, here as in absKind(), because a class that does
  // not exist is the absence rather than a hole in something present.
  function absOf(nodes) {
    var w = 0, u = 0;
    (nodes || []).forEach(function (n) {
      if (n.ghost) return;
      w += n.absW || 0;
      u += n.absU || 0;
    });
    return { work: w, unrec: u };
  }

  var ABS_ALL = (function () {
    var all = [];
    VIEWS.forEach(function (v) { all = all.concat(v.drawing.nodes); });
    return absOf(all);
  })();

  // A NUMBER THAT CHANGES DIGITS MUST NOT MOVE THE INSTRUMENT BESIDE IT. Issue 142, and it is a
  // defect this card measured rather than one it built. #139 deleted the readout plate and put
  // these two fractions in the nav, and the nav is `flex: none`, so its width is its content and
  // the heading gives back the difference: everything between the heading and the nav shifts by
  // whatever these two strings gain or lose. The term strip is what sits there. Measured on
  // Z-BL, `unrecorded 5/73` for a five week window against `unrecorded 29/73` for fourteen weeks
  // is 6.76 CSS px, so the one control on this page whose whole premise is that you point at a
  // week and press it MOVED 6.76 px sideways when the reader widened the window, and every press
  // after that landed half a week off where the last one did.
  //
  // SO EACH VALUE RESERVES THE WIDEST STRING IT CAN EVER HOLD, measured once against the real font
  // in the element itself. The denominators are fixed and the numerators cannot exceed them, so
  // the widest is the total over the total. Nothing is typed: the totals come from the model, and
  // the width comes from the browser.
  //
  // THE RECT AND NOT `offsetWidth`, which is rounded to whole pixels: `22/22` renders at 30.48
  // here and offsetWidth answers 30, and the two tenths left over came back as 0.97 px of the nav
  // still moving. Measured that way and repaired that way.
  function reserveWidest(el, words, align) {
    if (!el || !words.length) return;
    var was = el.textContent, w = 0, i;
    for (i = 0; i < words.length; i++) {
      el.textContent = words[i];
      w = Math.max(w, el.getBoundingClientRect().width);
    }
    el.textContent = was;
    el.style.display = 'inline-block';
    el.style.minWidth = (Math.ceil(w * 100) / 100) + 'px';
    el.style.textAlign = align;
  }
  reserveWidest(absWorkVal, [ABS_ALL.work + '/' + ABS_ALL.work], 'right');
  reserveWidest(absUnrecVal, [ABS_ALL.unrec + '/' + ABS_ALL.unrec], 'right');

  // The window in the words the window's own control uses, so the two cannot come to describe the
  // same weeks differently. term.js writes the sentence; nothing here composes one.
  function windowWords() {
    var spec = term.windowSpec();
    return spec ? spec.text : 'the whole term';
  }

  // Whether one node carries this field flagged absent, on the same boundary absKind() draws: the
  // route rows are about the class and everything after them is about the object.
  function isAbsent(n, field) {
    var props = n.props || [], i;
    for (i = (n.route || 0); i < props.length; i++) {
      if (props[i].k === field) return props[i].f === 'absent';
    }
    return false;
  }

  // Which nodes this view is showing, and how to say so. null means the control does not belong
  // on this route at all, which app.css has already acted on.
  function absScope() {
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
          // eleven.
          if (rows.gap && !isAbsent(n, rows.gap)) return;
          nodes.push(n);
        });
      });
      return {
        nodes: nodes,
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
    var sc = router.scope();
    return {
      nodes: render.drawing().nodes,
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

  // What the two switches do to the canvas, and it is one class on the body each, so the
  // stylesheet does the work. The one thing either has to ask the selection is whether the node it
  // is about to hide is the node the panel is describing. `unrecorded` is `ghosts` under a better
  // name: shown by default, because the absences are the finding and the reader meets them first.
  function setWork(on) {
    absWorkBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    document.body.classList.toggle('hide-work', !on);
  }

  function setUnrec(on) {
    absUnrecBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    document.body.classList.toggle('hide-unrecorded', !on);
    var n = selection.node();
    if (!on && n && n.ghost) selection.clear();
  }

  if (absWorkBtn) {
    absWorkBtn.addEventListener('click', function () {
      setWork(absWorkBtn.getAttribute('aria-pressed') !== 'true');
    });
  }
  if (absUnrecBtn) {
    absUnrecBtn.addEventListener('click', function () {
      setUnrec(absUnrecBtn.getAttribute('aria-pressed') !== 'true');
    });
  }

  // Everything the control says, rewritten from the model on every change of view. The two
  // sentences are built here and used twice each, on the value and in the title of the switch that
  // governs that value, because a second copy of either is a second thing to keep true.
  var absNow = { work: null, unrec: null, ofWork: ABS_ALL.work, ofUnrec: ABS_ALL.unrec,
                 scope: null };

  // The rings on the canvas, counted twice: how many are drawn and how many of those are painted.
  // A ring a switch has taken off is `display: none`, so it has no box, which is the same test the
  // page's own `hide-ghosts` rule has always been checked by.
  function socketCount() {
    function count(sel) {
      var all = document.querySelectorAll('#graph ' + sel), on = 0, i;
      for (i = 0; i < all.length; i++) if (all[i].getBoundingClientRect().width > 0) on++;
      return { drawn: all.length, painted: on };
    }
    return { work: count('.sock-work'), unrecorded: count('.sock-unrec') };
  }

  function describeAbsence() {
    if (!absWorkBtn || !absUnrecBtn) return;
    var sc = absScope();
    if (!sc) {
      absNow = { work: null, unrec: null, ofWork: ABS_ALL.work, ofUnrec: ABS_ALL.unrec,
                 scope: null };
      return;
    }
    var a = absOf(sc.nodes);
    absNow = { work: a.work, unrec: a.unrec, ofWork: ABS_ALL.work, ofUnrec: ABS_ALL.unrec,
               scope: sc.subject + ': ' + sc.where };
    if (absWorkVal) absWorkVal.textContent = a.work + '/' + ABS_ALL.work;
    if (absUnrecVal) absUnrecVal.textContent = a.unrec + '/' + ABS_ALL.unrec;
    // Two sentences, and neither of them ever names the other's number. Each says what its own
    // population is, how much of it is in front of the reader, and what pressing does.
    absWorkBtn.title = a.work + ' of the ' + ABS_ALL.work + ' values a system holds a row for and ' +
      'has left empty are in ' + sc.subject + ': ' + sc.where +
      '. Press to draw them as empty sockets, or to take them off';
    absUnrecBtn.title = a.unrec + ' of the ' + ABS_ALL.unrec + ' facts no system records are in ' +
      sc.subject + ': ' + sc.where +
      '. Press to draw them, and the classes no system holds, or to take them off';
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
  // AND THE ALTITUDE'S OWN VALUE, for the reason the two fractions above reserve theirs. Issue 142.
  // The control states what it is set to, `sessions` or `modules`, and those are 48.0 and 47.16
  // CSS px, so widening a window far enough to trip the node budget swaps the word, shortens the
  // nav and carries the term strip 0.84 px to the right. Smaller than the 6.76 the fractions cost
  // and the same defect: the instrument moved because a word beside it changed. The two words come
  // from the same place the control's own text does, so a third altitude would be reserved for
  // without anybody editing this.
  reserveWidest(grVal, ['sessions', 'modules'], 'left');

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

  // Issue 139. The three readings this row carried are gone: `weeks` with #137's strip, and
  // `tiles` and `gaps` with this card. What is left of the readout is one function, restating the
  // one control whose numbers are arithmetic over what the view is showing.
  //
  // `tiles` WENT BECAUSE THE PICTURE IS THE READING. It said how many tiles are drawn and how many
  // the drawing holds, over a canvas the reader is looking at, in a row this redesign exists to
  // empty; the window's own strip says what the window took, the chips say what each programme's
  // fraction is, and the lane captions on the canvas say the rest. A detached total over a corpus
  // that is five-sampled and two-complete is precisely the aggregation the constraints forbid.
  function describeReadout() {
    describeAbsence();
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

  // ---- the build stamp, issue 154 ------------------------------------------
  // WHAT STOOD HERE WAS `how to read this` AND A BOX BEHIND IT, and issue 79's whole argument for
  // that disclosure was that an instruction written into a permanent strip is read once and then
  // occupies the screen forever. #128 cut its five items to two. #154 finishes the thought: by
  // this project's rule a sentence that explains how to read the page goes, and a footer whose
  // entire content is an explainer is that failure at the bottom of the screen. The control, the
  // box, the three listeners and the focus return are all deleted.
  //
  // THE TWO ITEMS THAT WERE LEFT ARE NOT DELETED, THEY MOVED, which is #79's own repair applied to
  // the last two things it had not applied it to. What a click on a node does is a title on the
  // drawing, and the drag modifier joined the wheel and the Ctrl on the zoom readout, which
  // already carried half of it. Both are in index.html, on the elements they are about, and
  // neither costs a visible character.
  //
  // WHAT REPLACES THEM IS THE ONE FACT ON THIS PAGE THAT IS ABOUT THE PAGE. Which build you are
  // looking at. It is a reading rather than an explainer, it belongs to the document rather than
  // to any view of it, so a page footer is its correct home by the same principle that puts a
  // programme's fraction on that programme's chip.
  //
  // AND THE UNSTAMPED CASE IS SAID IN ITS OWN WORDS RATHER THAN LEFT BLANK. site/version.js in the
  // repository names no commit on purpose: a working tree, a page opened from disk and a local
  // server are not deployments and there is no commit they can honestly claim. A blank strip there
  // would read as a stamp that failed to load, which is a different and worse thing to be, and it
  // is exactly the distinction feedback.js already draws one line further down. Three states, and
  // the third is version.js not loading at all.
  //
  // THE DATE IS SHORTENED AND THE COMMIT IS NOT. The commit is what identifies the build and it is
  // quoted into reports, so it is printed whole; the moment is what tells a reader whether they
  // are looking at a stale cache, and a day and a time is enough for that. Whatever
  // .github/workflows/pages.yml writes is what is read, and a value this file cannot parse is
  // printed as it stands rather than dropped.
  // Three letters per month, written here rather than taken from term.js: that module owns the
  // TERM and this is the deploy clock, and a page whose build stamp went through the term's date
  // vocabulary would be one edit away from a stamp that moved when the syllabus did.
  var MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var stampEl = document.getElementById('fstamp');

  // SEVEN CHARACTERS OF THE COMMIT AND NOT FORTY, AND THAT IS A MEASUREMENT RATHER THAN A TASTE.
  // .github/workflows/pages.yml writes the whole sha, which is what a feedback report has to quote
  // and what feedback.js therefore prints in full; on a strip under the drawing forty hexadecimal
  // characters is a line of noise, and seven is what every tool that shows a commit to a person
  // shows. The whole of it is on the title, one hover away, so nothing is lost and the strip is
  // the length of a reading rather than the length of a hash.
  //
  // AND THE UNSTAMPED FORM IS THE SHORT ONE FOR THE SAME REASON. `zv.source` reads "working tree,
  // not a deployment", which is the right sentence for a report and twice the length this strip
  // wants; the claim a reader needs here is the second half of it, and the first half is on the
  // title with everything else.
  function stampWords() {
    var zv = window.ZV;
    if (!zv) return 'no build stamp';
    if (!zv.commit) return 'not a deployment';
    var at = zv.deployedAt ? String(zv.deployedAt) : '';
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(at);
    var when = m ? Number(m[3]) + ' ' + MONTH_SHORT[Number(m[2]) - 1] + ' ' + m[4] + ':' + m[5]
                 : at;
    return String(zv.commit).slice(0, 7) + (when ? ', ' + when : '');
  }

  if (stampEl) {
    stampEl.textContent = stampWords();
    // The whole of it on the title, because the strip is one short line and the reader who wants
    // the full moment or the reason there is no commit should not have to open a report for it.
    stampEl.title = !window.ZV
      ? 'site/version.js did not load, so this page is either older than the build stamp or was ' +
        'served without it'
      : window.ZV.commit
        ? 'the commit this page was deployed from: ' + window.ZV.commit +
          (window.ZV.deployedAt ? ', published ' + window.ZV.deployedAt : '')
        : 'this copy of the site was not published by the deploy workflow, so there is no commit ' +
          'it can name' + (window.ZV.source ? ' (' + window.ZV.source + ')' : '');
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
  if (window.ResizeObserver && hdr) {
    // Issue 145. The flag says the observer owns this, so the two eager callers step aside and
    // nothing forces a layout in the middle of a redraw. Set before observe() rather than inside
    // the callback, because the first delivery is asynchronous and a route change in between
    // would take the expensive path once for nothing.
    hdrObserved = true;
    new ResizeObserver(measureHeader).observe(hdr);
  }

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
    // WHICH SCHEME THE PAGE RESOLVED TO, AND THERE IS NOTHING ELSE LEFT TO SAY ABOUT IT. Issue
    // 139 deleted the in-page override: the page follows the operating system, which is what #55
    // shipped and what #57 added a control to disagree with. The control did not show its own
    // state, was touched a handful of times a year, and governed nothing about the data, which is
    // inertia by the owner's own definition. What a driver still needs is the scheme it is looking
    // at, so this stays and reports it, taken from the used value of `color-scheme` and from the
    // media query under it rather than from any state this file keeps.
    theme: function () {
      var used = getComputedStyle(document.documentElement).colorScheme;
      var sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      return { system: sys, resolved: used === 'light dark' ? sys : used };
    },
    veiled: function () { return selection.veiledState(); },
    roster: function () { return router.rosterOpen(); },
    // The roster's address, published rather than typed by anybody who needs it. It came off the
    // header's `students` link until issue 139 deleted that link, and a driver enumerating the
    // addresses that open a sheet had to construct it instead: `#/p/Z-ZIB` against `#/p/ZIB` cost
    // this repository half an hour of false alarm once and the rule it left is to construct no
    // address you can ask for.
    rosterRoute: router.rosterRoute,
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
    // Issue 137. THE TERM STRIP AS PAINTED, so that an assertion about the brush is an assertion
    // about what is on the screen rather than about the state it was drawn from. term.js owns it
    // and answers; this file only publishes, which is the split every other seam here runs on.
    brush: function () { return term.brushState(); },
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
    // Issue 139. THE TWO NUMBERS, SEPARATELY, AND NOTHING THAT ADDS THEM. Each side carries what
    // falls inside what is currently drawn and the term total it is over; `work` and `unrecorded`
    // are the two switches' own states. Both numerators are null on the two routes where the
    // control is withdrawn, which is a different answer from zero and is the one thing a driver
    // could not otherwise tell apart. There is deliberately no `total` and no `of`: a driver that
    // could read one would be a driver the page had handed the sum to.
    absence: function () {
      return { work: absNow.work, ofWork: absNow.ofWork,
               unrecorded: absNow.unrec, ofUnrecorded: absNow.ofUnrec,
               scope: absNow.scope,
               workOn: absWorkBtn.getAttribute('aria-pressed') === 'true',
               unrecordedOn: absUnrecBtn.getAttribute('aria-pressed') === 'true',
               // What is ON THE CANVAS, counted off the canvas rather than off the model, so an
               // assertion that the sockets and the number are the same set is an assertion about
               // the picture. Issue 98's lesson with a second implementation on the other side.
               // `drawn` is how many rings the drawing holds and `painted` is how many of them the
               // two switches are showing, which are different questions: a switch that is off
               // takes the rings off the picture and does not change what is missing, exactly as
               // the number on its face does not change either.
               sockets: socketCount() };
    }
  };
})();
