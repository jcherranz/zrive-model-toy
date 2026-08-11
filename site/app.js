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
  ['render', 'viewport', 'selection', 'router'].forEach(function (k) {
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
  function joinDocs(gi, gl) {
    if (!gi || !gi.views || !gl || !gl.views) return null;
    if (gi.views.length !== gl.views.length) {
      throw new Error('instance.js has ' + gi.views.length + ' views and layout.js has ' +
                      gl.views.length);
    }
    return gi.views.map(function (iv, vi) {
      var lv = gl.views[vi], d = lv.drawing;
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
      return { key: iv.key, code: iv.code, name: iv.name, label: iv.label, route: iv.route,
               drawing: drawing };
    });
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
  var VIEWS = joinDocs(GI, window.GL);
  if (!VIEWS || !VIEWS.length) throw new Error('site/instance.js and site/layout.js: no view');

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

  var router, render, selection, viewport;

  // ---- the wiring itself -----------------------------------------------------
  // What happens when the address starts naming a different programme. The order is the whole of
  // it and each step is here because of what the step before it leaves behind.
  function showView(v) {
    // The selection belongs to the drawing that is leaving. Cleared before the repaint, because
    // clearing repaints the selected tile and after a repaint that tile is gone: on six of the
    // seven routes the id would not even exist.
    selection.clear();
    render.draw(v.drawing);
    // The elements the reveal rules act on were all replaced, so the rules are read off the new
    // drawing and applied to the new handles.
    selection.bind(render.gfx());
    if (window.ZT) window.ZT.drawingDigest = v.drawing.drawingDigest || 'unknown';
    router.describe();
    // A different programme is a different cohort, so the list built for the last one goes.
    router.resetRoster();
    // Last, because describing the programme can change the height of the header and the fit is
    // measured against what is left.
    viewport.refit();
  }

  router = ZM.router({
    views: VIEWS,
    defaultKey: GI && GI.default,
    svg: svg,
    drawing: function () { return render.drawing(); },
    onView: showView,
    onDescribed: measureHeader
  });

  render = ZM.render({
    svg: svg,
    canvas: canvas,
    drawing: router.view().drawing,
    onSelect: function (id) { selection.select(id); },
    onFocus: function (n) { viewport.ensureVisible(n); }
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
    // Issue 73, seam 5. The document's own stance, clock and vocabularies, handed over rather
    // than read off the global: a panel that reached for window.GI would be a second reader of
    // the instance document and would keep working after this file stopped handing it one,
    // which is how a module stops being a module. It is a top-level block and not a per view
    // one, because a provenance is a fact about the document and not about the drawing.
    provenance: GI && GI.provenance,
    onReveal: function (n) { viewport.ensureVisible(n); }
  });

  // The address has already chosen which of the seven this is, so this draws the reader's
  // programme and not the default followed by the reader's.
  render.draw(router.view().drawing);
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
    busy: function () { return router.rosterOpen() || router.pgMenuOpen(); }
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
  var THEME_TITLE = {
    system: 'the theme follows the operating system. Press for light',
    light: 'the theme is light, whatever the operating system says. Press for dark',
    dark: 'the theme is dark, whatever the operating system says. Press to follow the ' +
          'operating system again'
  };
  var thBtn = document.getElementById('thtoggle');
  var theme = 'system';

  function applyTheme(choice) {
    theme = THEMES.indexOf(choice) === -1 ? 'system' : choice;
    // Absent for system, so the media half of app.css's switch is what answers, which is the
    // page exactly as it behaved before this control existed.
    if (theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
    if (thBtn) {
      // The state, in the row's own idiom: `feedback` says `feedback: on (Esc to exit)` in the
      // same place for the same reason. The button's text is its accessible name, so a screen
      // reader is told the state by the same string a reader sees, and the title is the hint.
      thBtn.textContent = 'theme: ' + theme;
      thBtn.title = THEME_TITLE[theme];
    }
  }

  if (thBtn) {
    var stored = null;
    try { stored = localStorage.getItem(THEME_KEY); } catch (e) { stored = null; }
    applyTheme(stored);
    thBtn.addEventListener('click', function () {
      applyTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]);
      // `system` is written out rather than removed, because "I chose to follow the machine" and
      // "I have never chosen" are different facts even though they draw the same page. An
      // unreadable or absent key still means system, so clearing storage falls back correctly.
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* nothing persists, page turns */ }
    });
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
    });
  }

  // The student list and the programme description are both read off the drawing, so neither can
  // run before there is one on the canvas.
  router.start();
  measureHeader();
  window.addEventListener('resize', measureHeader);

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
    roster: function () { return router.rosterOpen(); }
  };
})();
