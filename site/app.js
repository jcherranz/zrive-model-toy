(function () {
  'use strict';

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

  // ---- the seven programmes, and which of them this page is showing ----------
  // Seven views, one per programme, each with its own nodes, edges, band captions and extent.
  // Until issue 66 this file read one of them and nothing else, so six had never been on a
  // screen.
  //
  // A VIEW IS CHOSEN BEFORE THE FIRST draw() AND NEVER AFTER IT. Everything below reads G, and
  // draw() reassigns it, so resolving the address up here is what makes a deep link draw its own
  // programme once rather than draw Investment Banking and then replace it. A reader who follows
  // a link to #/p/ZCFA and a reader who clicks their way there see the same page produced by the
  // same path.
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
  var GI = window.GI || null;
  var VIEWS = joinDocs(GI, window.GL);
  if (!VIEWS || !VIEWS.length) throw new Error('site/instance.js and site/layout.js: no view');
  var PGPREFIX = '#/p/';

  function normCode(s) {
    return String(s === null || s === undefined ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  var DEFAULT_VIEW = (function () {
    var want = normCode(GI && GI.default);
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

  var pgView = viewFromHash(location.hash) || DEFAULT_VIEW;

  var G = pgView.drawing;
  var NS = 'http://www.w3.org/2000/svg';
  var TILE = G.tile, R = TILE / 2;
  var COLOR = {}, TLABEL = {}, GLYPH = {};
  G.types.forEach(function (t) { TLABEL[t.k] = t.label; GLYPH[t.k] = t.glyph; });

  // ---- the palette, as custom properties -------------------------------------
  // Every type carries two hexes now, one chosen against a white page and one against the dark
  // band plate, and nothing below paints with either of them. It paints with `var(--type-<key>)`
  // and the stylesheet decides which hex that is. Issue 56.
  //
  // WHY NOT matchMedia. The obvious version is for this file to read
  // `matchMedia('(prefers-color-scheme: dark)')`, pick one of the two hexes, and add a `change`
  // listener to repaint. It works and it is small, and it puts a SECOND theming mechanism on a
  // page that already has one: app.css answers that media query for every other colour on the
  // screen. Two mechanisms for one question is how they come to disagree about what dark means,
  // and the disagreement would be a repaint that half happened. This way the theme changes with
  // no JavaScript running at all.
  //
  // THE STYLESHEET IS GENERATED FROM THE DATA and never written by hand, so it cannot name a
  // type the model does not have and cannot miss one it does. The colours live in build/model.py
  // and reach the page once, through site/instance.js; app.css holds no type colour and must not
  // grow one.
  //
  // color-mix RATHER THAN A SECOND PRE-MIXED VALUE PER TYPE, and it was checked rather than
  // looked up. Driven in Chrome 149: var() resolves in an SVG presentation attribute, so does
  // color-mix(), and `color-mix(in srgb, C 14%, transparent)` paints the pixel
  // `rgba(C, 0.14)` paints, all thirteen colours, zero pixels different over the whole swatch
  // sheet. That last one is what makes the light page identical rather than nearly identical:
  // mixing with `transparent` is premultiplied, so the result is exactly C at alpha 0.14. It is
  // Baseline (Chrome 111, Safari 16.2, Firefox 113, all 2023) and the site ships no polyfill and
  // no build step, which is the whole reason it had to be checked on a real engine.
  //
  // ONE :root BLOCK AND NO MEDIA QUERY, which is the half of this that issue 57 changed. This
  // was `:root` plus `@media (prefers-color-scheme: dark)`, one pair of blocks, and it was
  // correct while the operating system was the only thing with an opinion. A reader can now
  // disagree with the machine, and a colour whose only definition is inside a media block is a
  // colour that disagreement cannot reach. app.css answers the choice through `color-scheme`,
  // and `light-dark()` reads the used value of that property, so writing the pair as one
  // function puts these thirteen on exactly the mechanism the rest of the palette is on. The
  // tiles turn with the chrome rather than a frame later, and still with no JavaScript running
  // at all: nothing here listens for a theme change, because there is nothing to listen for.
  // Checked on the same engine and in the same way as color-mix above: light-dark() resolves in
  // an SVG presentation attribute, resolves through var(), nests inside color-mix(), and the
  // thirteen fills it produces are pixel for pixel the fills the media query produced, in both
  // schemes. Baseline: Chrome 123, Safari 17.5, Firefox 120, all 2024.
  (function () {
    var decls = [];
    G.types.forEach(function (t) {
      COLOR[t.k] = 'var(--type-' + t.k + ')';
      decls.push('--type-' + t.k + ':light-dark(' + t.c + ',' + (t.cDark || t.c) + ');');
    });
    var st = document.createElement('style');
    st.id = 'type-palette';
    st.textContent = ':root{' + decls.join('') + '}\n';
    (document.head || document.documentElement).appendChild(st);
  })();

  // Stroke glyphs in a 16 by 16 box. Kept deliberately plain.
  var PATHS = {
    programme: ['M3 3.5h10', 'M3 8h10', 'M3 12.5h6'],
    company:   ['M3 14V3h6v11', 'M9 14V7h4v7'],
    person:    ['M8 2.6a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8',
                'M3.4 13.8c0-2.6 2.1-4.2 4.6-4.2s4.6 1.6 4.6 4.2'],
    document:  ['M4 2h5l3 3v9H4z', 'M9 2v3h3'],
    calendar:  ['M3 4.5h10v9.5H3z', 'M3 7.6h10', 'M5.8 2.4v3', 'M10.2 2.4v3'],
    cohort:    ['M5 5.4a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8',
                'M11 5.4a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8',
                'M8 10a1.9 1.9 0 1 1 0 3.8A1.9 1.9 0 0 1 8 10'],
    link:      ['M6.4 9.6 9.6 6.4', 'M5.2 7.8 3.7 9.3a2.1 2.1 0 0 0 3 3l1.5-1.5',
                'M10.8 8.2l1.5-1.5a2.1 2.1 0 0 0-3-3L7.8 5.2'],
    agreement: ['M4 2h8v12H4z', 'M6 5h4', 'M6 7.6h4',
                'M8 9.6a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2'],
    coin:      ['M8 3a5 5 0 1 1 0 10A5 5 0 0 1 8 3', 'M6.2 6.7h3.6', 'M6.2 9.3h3.6'],
    claim:     ['M8 2.6 14 13.4H2z', 'M8 6.6v3.2', 'M8 11.4v.6'],
    // A student, drawn as a cap over a head rather than as a second person: the person glyph
    // belongs to the instructors and the two types sit two lanes apart, so at 16 by 16 the only
    // thing telling them apart would be the tile colour.
    cap:       ['M1.9 6.5 8 3.9l6.1 2.6L8 9.1z',
                'M4.7 7.8v3c0 .9 1.5 1.6 3.3 1.6s3.3-.7 3.3-1.6v-3']
  };

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  // A wash of a colour over whatever is behind it, which in this drawing is always the band
  // plate. It used to take a hex and return an `rgba`; it takes a paint expression now and
  // returns a `color-mix` at the same strength, so the value follows the theme instead of
  // pinning the hex the page happened to load with. The semantics are unchanged and that is the
  // point: mixing with `transparent` is premultiplied, so this is the source colour at that
  // alpha, it composites over the plate rather than mixing toward white, and on a dark page a
  // tile is lighter than its plate by the same step it is darker by on a light one.
  //
  // A percentage and no longer a fraction, because CSS wants a percentage and JavaScript cannot
  // produce one from 0.14 without producing 14.000000000000002. The strengths are the ones the
  // drawing already used, renamed and not retuned.
  function tint(paint, pct) {
    return 'color-mix(in srgb, ' + paint + ' ' + pct + '%, transparent)';
  }

  // There is no legend. It was twelve swatches restating what the panel says on a click and
  // what the band captions say standing, and it cost the drawing a header row at every width
  // and four of them at 390px. Issue 32. G.types is still read above, for the colour, the type
  // name and the glyph of each tile.

  // ---- svg scaffolding -----------------------------------------------------
  // draw() takes its drawing as an argument and everything below reads G rather than reaching
  // for a global. That was written for the two cohort switch issue 42 removed, kept afterwards
  // when only one drawing was left, and is now what the seven programme routes run on: issue 66
  // added a caller and not a mechanism. The drawings are the same shape as each other and the
  // same shape as the one this function was written against, so nothing in here knows how many
  // there are, which one is on screen, or that the reader can change it.
  var svg = document.getElementById('graph');
  var canvas = document.getElementById('canvas');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  var nodeById, edgesOf, gfxNode, gfxEdge;

  // ---- what the drawing paints only on demand ---------------------------------
  // Two kinds of node are laid out, kept out of the picture, and faded in when the reader asks
  // for them: an employer, while the instructor it employs is selected (issue 48), and the four
  // students the cohort card stands for, while that card or one of them is selected (issue 51).
  // One mechanism, one stylesheet rule and one table, because two copies of it would be two
  // things to keep in step, and the second was written by generalising the first rather than
  // beside it.
  //
  // EVERY RULE KEYS ON A VERB AND NEVER ON A TYPE. Six nodes here are of type Company and only
  // five are employers: Aretxa Capital hosts a visit, employs nobody, and a rule reading
  // `type === 'Company'` would take it off the page along with the five and delete exactly the
  // distinction this toy exists to show, that one type is playing two roles. The same discipline
  // is kept for the students even though Student plays one role today, because that is what
  // Company looked like before it played two. A sixth instructor, or a fifth student, joins the
  // rule by existing: nothing below holds a list of ids to forget to extend.
  //
  //   verb      the relationship that puts a node under the rule
  //   hide      which end of that edge is the node that is not painted
  //   by        which end is the node whose selection paints it
  //   together  members revealed by one node come and go as a set, so selecting one of the four
  //             students keeps its three siblings and the "and 30 more" marker on screen. An
  //             employer is alone at its end of the link and wants the opposite: moving to
  //             another instructor takes the first employer away again, so at most one is ever
  //             on the page.
  var VEIL_RULES = [
    { verb: 'employed by', hide: 't', by: 's', together: false },
    { verb: 'member of',   hide: 's', by: 't', together: true }
  ];
  // id -> { by: {id: true}, edges: [index], group: id or null }. Rebuilt by draw().
  var veiled;

  function draw(g) {
    G = g;
    svg.textContent = '';
    // The viewBox is not set here any more. It is the view, and the view moves: the canvas
    // section below owns it and writes it on every pan, every zoom and every resize. Issue 46.
    // What is still fixed is the drawing's own extent, G.w by G.h, which is what fit() frames.
    //
    // The width of the drawing is a number the build computes, so the stylesheet reads it from
    // here rather than holding a copy of it. Nothing in app.css reads --drawing-w today: the
    // rule that did was the sideways scroll under the drawing on a narrow viewport, which pan
    // and zoom replaced. The property is still written and build_layout.py still refuses to
    // build while a copy of the number is sitting in the stylesheet, because that guard is
    // about the number and not about the rule that happened to need it.
    canvas.style.setProperty('--drawing-w', G.w + 'px');
    if (window.ZT) window.ZT.drawingDigest = G.drawingDigest || 'unknown';

    // Column bands. One lane per kind of thing, captioned, so that instructors and session
    // templates are told apart by where they sit and not only by tile colour.
    var gBand = el('g', {}, svg);
    (G.bands || []).forEach(function (b) {
      el('rect', { class: 'band', x: b.x, y: G.bandTop, width: b.w, height: G.h - G.bandTop - 4 },
         gBand);
      // A caption can run to more than one line, because a lane is only as wide as the columns
      // under it and a caption that has to say more has nowhere to go sideways. The lines are
      // stacked upwards from the top of the band, so the last one always sits the same
      // distance above the lane whatever the caption above it does. The build reserves the
      // headroom and refuses to write a drawing in which any one line is wider than its lane.
      var lines = b.lines || [b.label];
      lines.forEach(function (line, i) {
        var t = el('text', {
          class: 'band-cap', x: b.x + b.w / 2,
          y: G.bandTop - (G.capGap || 7) - (lines.length - 1 - i) * (G.capLineH || 11)
        }, gBand);
        t.textContent = line;
      });
    });

    var gEdge = el('g', {}, svg);
    var gChip = el('g', {}, svg);
    var gNode = el('g', {}, svg);

    nodeById = {}; edgesOf = {}; gfxNode = {}; gfxEdge = [];
    G.nodes.forEach(function (n) { nodeById[n.id] = n; edgesOf[n.id] = []; });

    // ---- edges ---------------------------------------------------------------
    G.edges.forEach(function (e, idx) {
      // data-edge is the relationship key, the counterpart of data-node above: it is what a
      // feedback capture on a line or on its verb chip reports back.
      var key = e.s + '->' + e.t;
      var g = el('g', { 'data-edge': key, class: e.ghost ? 'ghost' : null }, gEdge);
      el('path', { d: e.d, class: e.ghost ? 'edge edge-ghost' : 'edge' }, g);
      el('path', {
        d: 'M0 0 L-6.5 2.6 L-6.5 -2.6 Z', class: e.ghost ? 'arrow arrow-ghost' : 'arrow',
        transform: 'translate(' + e.ax + ',' + e.ay + ') rotate(' + e.aa + ')'
      }, g);

      var c = el('g', { 'data-edge': key, class: e.ghost ? 'ghost' : null }, gChip);
      el('rect', {
        class: 'chip-bg', x: (e.cx - e.cw / 2).toFixed(1), y: (e.cy - 6.5).toFixed(1),
        width: e.cw.toFixed(1), height: 13
      }, c);
      var tx = el('text', { class: 'chip-tx', x: e.cx, y: e.cy }, c);
      tx.textContent = e.v;

      gfxEdge.push({ e: e, g: g, c: c });
      edgesOf[e.s].push(idx);
      edgesOf[e.t].push(idx);
    });

    // ---- nodes ---------------------------------------------------------------
    // Drawn in reading order rather than in the order the model declares them: rows first, then
    // left to right inside a row. Nothing else depends on the order, since no two nodes overlap,
    // and the tab order is the document order, so ordering the drawing is the whole of the
    // keyboard navigation. A band of ROWH holds nodes at nearly the same height in one row,
    // which is what the eye does with a drawing whose rows are not ruled.
    var ROWH = 27;
    var byY = G.nodes.slice().sort(function (a, b) { return a.y - b.y || a.x - b.x; });
    var rowTop = null;
    var reading = byY.map(function (n) {
      if (rowTop === null || n.y - rowTop > ROWH) rowTop = n.y;
      return { n: n, row: rowTop };
    }).sort(function (a, b) { return a.row - b.row || a.n.x - b.n.x; })
      .map(function (r) { return r.n; });

    reading.forEach(function (n) {
      var col = COLOR[n.type];
      // data-node is the instance key. It is what feedback.js reads to say which node a click
      // landed on, the way monetary-lab's capture reads its own linked-highlight key.
      var g = el('g', { class: n.ghost ? 'node ghost' : 'node', 'data-node': n.id,
                        tabindex: 0, role: 'button' }, gNode);
      var titleEl = el('title', {}, g);
      titleEl.textContent = n.label + ' (' + TLABEL[n.type] + ')';

      // A count is drawn as a stack of cards behind the tile, one card standing for the many
      // individuals the tile represents. A stack reads as a stack only if every card is the
      // same card moved by the same step, and these were neither. They were TILE-6 across and
      // positioned from the tile's own corner, so the step a reader saw was measured from a
      // corner and not from a centre: +5 on x became +2 once the card was 6 units narrower,
      // -5 on y became -8, and the two cards came to rest at +2 and -0.5, on opposite sides of
      // the tile's centre line. Nothing peeked out on the right at all, because the far card's
      // right edge fell one unit inside the tile's own. What a reader saw was two lopsided
      // ledges above the tile and no stack. Issue 41. The cards are the size of the tile now
      // and each is one constant step up and to the right of the one in front of it.
      //
      // The backdrop is the other half of the repair, and it is why this is not simply a
      // coordinate change. A tile is filled with a 14 per cent tint, so it is translucent, and
      // the parts of the cards that a stack hides were showing straight through it as a
      // rounded outline crossing the inside of the tile. The backdrop is the band's own
      // colour, which is what every tile in this drawing is already composited over, so the
      // tile renders exactly as it did and the cards now stop at its edge.
      if (n.count) {
        el('rect', { x: n.x - R + 5, y: n.y - R - 5, width: TILE, height: TILE,
                     rx: 6, fill: tint(col, 10), stroke: tint(col, 45) }, g);
        el('rect', { x: n.x - R + 2.5, y: n.y - R - 2.5, width: TILE, height: TILE,
                     rx: 6, fill: tint(col, 12), stroke: tint(col, 60) }, g);
        el('rect', { x: n.x - R, y: n.y - R, width: TILE, height: TILE, rx: 6,
                     fill: 'var(--bg-panel)', stroke: 'none' }, g);
      }
      // A node whose key does not exist keeps its own outline and gains a second, dashed one.
      // The object is real; something about it is missing, and the label below says what.
      if (n.mark) {
        el('rect', { class: 'ring-missing ghost', x: n.x - R - 3.5, y: n.y - R - 3.5,
                     width: TILE + 7, height: TILE + 7, rx: 8 }, g);
      }
      var tile = el('rect', {
        class: n.ghost ? 'tile-bg tile-ghost' : 'tile-bg',
        x: n.x - R, y: n.y - R, width: TILE, height: TILE, rx: 6,
        // A ghost's wash is 7 per cent where every other tile is at 14, and it is the same
        // grey the ghost type carries rather than a second copy of that grey written here:
        // this line held `rgba(143,153,168,0.07)` as a literal, which was the palette's own
        // hex typed into a second file. The strength is unchanged.
        fill: tint(col, n.ghost ? 7 : 14), stroke: col
      }, g);

      var mark;
      if (n.ghost) {
        // Deliberately empty. A ghost tile holds no glyph because there is nothing in it.
        mark = el('g', {}, g);
      } else if (n.count) {
        mark = el('text', {
          x: n.x, y: n.y + 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central',
          'font-size': 14, 'font-weight': 600, fill: col
        }, g);
        mark.textContent = n.count;
      } else {
        mark = el('g', {
          transform: 'translate(' + (n.x - 8) + ',' + (n.y - 8) + ')',
          fill: 'none', stroke: col, 'stroke-width': 1.35,
          'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        }, g);
        PATHS[GLYPH[n.type]].forEach(function (d) { el('path', { d: d }, mark); });
      }

      var ty = n.y + R + G.gapLabel + 4;
      n.lines.forEach(function (line, i) {
        var t = el('text', { class: n.ghost ? 'lbl lbl-ghost' : 'lbl', x: n.x,
                             y: ty + i * G.lineH }, g);
        t.textContent = line;
      });
      if (n.mark) {
        var mk = el('text', { class: 'lbl lbl-missing ghost', x: n.x,
                              y: ty + n.lines.length * G.lineH }, g);
        mk.textContent = n.mark;
      }
      // The line under the label that says how many of a group's members the drawing did not
      // draw. It is written here and painted only while those members are on screen, and the
      // build reserved its line whether or not anything is in it, so nothing moves when it
      // arrives. Kept out of <title> and out of the panel: it is a statement about this picture,
      // not a property of the object.
      var tail = null;
      if (n.tail) {
        tail = el('text', { class: 'lbl lbl-tail', x: n.x,
                            y: ty + (n.lines.length + (n.mark ? 1 : 0)) * G.lineH }, g);
        tail.textContent = n.tail;
      }

      // The rect a keyboard focus is drawn as. It is inserted directly after the title, so it
      // sits behind the tile, the count stack and the label rather than over them, and it
      // carries no geometry until frameNode() measures one.
      var frame = el('rect', { class: 'focus-frame', rx: 7 });
      g.insertBefore(frame, titleEl.nextSibling);

      g.addEventListener('click', function (ev) { ev.stopPropagation(); select(n.id); });
      g.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(n.id); }
      });
      // Measured on focus, which is the only state that draws it. A tab arriving at a node this
      // has never measured would otherwise show an empty rect at the drawing's origin.
      //
      // A tab also brings the node onto the screen. On a canvas the reader can have left the
      // node anywhere, including off the plane's visible part, and a focus ring drawn where
      // nobody can see it is worse than none: the keyboard walk would silently stop being a
      // walk through the drawing. Only for :focus-visible, which is the keyboard's own state
      // and is exactly the state that draws the ring; a mouse click does not match it and is
      // already handled by select(), which reveals the node it opens the panel for.
      g.addEventListener('focus', function () {
        frameNode(gfxNode[n.id]);
        var vis = true;
        try { vis = g.matches(':focus-visible'); } catch (err) { /* older engine: always */ }
        if (vis) ensureVisible(n);
      });
      gfxNode[n.id] = { g: g, tile: tile, mark: mark, col: col, count: !!n.count, frame: frame,
                        ghost: !!n.ghost, rest: tile.getAttribute('fill'), tail: tail };
    });

    // ---- who is painted on demand ---------------------------------------------
    // Read off the edges, once, against the table at the top of this file.
    veiled = {};
    gfxEdge.forEach(function (x, i) {
      VEIL_RULES.forEach(function (r) {
        if (x.e.v !== r.verb) return;
        var hid = r.hide === 't' ? x.e.t : x.e.s;
        var by = r.by === 't' ? x.e.t : x.e.s;
        var rec = veiled[hid] || (veiled[hid] = { by: {}, edges: [], group: null });
        rec.by[by] = true;
        if (r.together) rec.group = by;
        rec.edges.push(i);
        // An edge to nothing must not be drawn, so the line, its arrowhead and its verb chip
        // carry the same class as the tile they land on and come and go with it. Without this
        // the drawing would keep an arrow pointing into an empty lane, which is a stronger
        // claim than it means.
        x.g.classList.add('veil');
        x.c.classList.add('veil');
      });
    });
    // Members of one group are revealed together, so each of them counts as a revealer of the
    // others. Done once here rather than tested on every selection.
    Object.keys(veiled).forEach(function (id) {
      var grp = veiled[id].group;
      if (!grp) return;
      Object.keys(veiled).forEach(function (other) {
        if (veiled[other].group === grp) veiled[id].by[other] = true;
      });
    });
    Object.keys(veiled).forEach(function (id) {
      if (gfxNode[id]) gfxNode[id].g.classList.add('veil');
    });
    // The marker under a group's own card is part of the reveal and not part of the card.
    Object.keys(gfxNode).forEach(function (id) {
      if (gfxNode[id].tail) gfxNode[id].tail.classList.add('veil');
    });
    veil();
  }

  // ---- painting the on demand nodes -------------------------------------------
  // Which of them are on the page. Only while the selection is the node itself or one of the
  // nodes the table says reveals it, so a reveal never accumulates: an ordinary reading session
  // would otherwise end with all five employers and all four students on the page, which is the
  // state issues 48 and 51 exist to remove, and the reader would have no way back to the quiet
  // drawing short of a reload. Clearing the selection is the way back, and moving it from an
  // instructor to the students card and back behaves by construction, because the whole set is
  // recomputed from the current selection every time rather than toggled.
  //
  // Nothing here moves the drawing. The layout is generated for the full node set, so a hidden
  // node keeps the coordinates the build gave it and is simply not painted; revealing it paints
  // it into space it already owns, and the drawing's extent, which is what fit() frames, is the
  // same number before and after. Laying the drawing out again without the hidden nodes was the
  // alternative and is worse twice over: every tile on the page would move on every click, and
  // the coordinates would stop being a pure function of the model.
  function veil() {
    var shown = {};     // group id -> is any member of it on screen
    Object.keys(veiled).forEach(function (id) {
      var show = !!current && (current === id || veiled[id].by[current] === true);
      var grp = veiled[id].group;
      if (grp) shown[grp] = shown[grp] || show;
      var f = gfxNode[id];
      if (f) {
        f.g.classList.toggle('veil-hidden', !show);
        // Out of the tab order and out of the accessibility tree as well as out of the picture.
        // The stylesheet's `visibility: hidden` already does both, and doing it here as well is
        // the belt: what must never happen is a keyboard landing on a tile nobody can see, or a
        // capture-mode click filing a card about one.
        if (show) {
          f.g.setAttribute('tabindex', '0');
          f.g.removeAttribute('aria-hidden');
        } else {
          if (document.activeElement === f.g && f.g.blur) f.g.blur();
          f.g.removeAttribute('tabindex');
          f.g.setAttribute('aria-hidden', 'true');
        }
      }
      veiled[id].edges.forEach(function (i) {
        gfxEdge[i].g.classList.toggle('veil-hidden', !show);
        gfxEdge[i].c.classList.toggle('veil-hidden', !show);
      });
    });
    // The marker saying how many members were not drawn. It belongs to the group's own card, is
    // reserved a line by the build whether or not anything is painted in it, and is on screen
    // exactly while the members are: four tiles with no count beside them would quietly stand in
    // for thirty four people, which is the defect it exists to prevent.
    Object.keys(shown).forEach(function (grp) {
      var f = gfxNode[grp];
      if (f && f.tail) f.tail.classList.toggle('veil-hidden', !shown[grp]);
    });
  }

  // ---- the keyboard focus frame ----------------------------------------------
  // Nothing is drawn around a selected node. A click selects, the tile inverts, the unrelated
  // parts of the drawing dim and the panel opens, and that is the whole of the feedback; a
  // frame on top of it said the same thing a fourth time. Issue 45. This rect is now only the
  // keyboard's "where am I", shown on :focus-visible, which a mouse click does not match.
  //
  // Removing the frame is not removing the rule that made it necessary. Chrome's user agent
  // stylesheet answers :focus on a focusable SVG element with
  // `outline: auto 5px -webkit-focus-ring-color`. On an SVG element that rule is :focus and
  // not :focus-visible, which is the HTML case, so a mouse click matches it and every selected
  // node wore the browser's own ring: a five pixel near-black box around the group's bounding
  // box, which is the tile and its label together, so it was 34 units wide on a short name and
  // 188 on the longest session template. That is issue 34, and `.node:focus { outline: none }`
  // in the stylesheet is what holds it off. Take that away with the frame and the black box is
  // back on the next click.
  //
  // The geometry is measured and never estimated. A node's extent on screen is the extent of
  // the text the browser drew, and a second opinion about that width is a mistake this
  // repository has already bought twice, in the layout and in the stylesheet. Measuring also
  // makes the frame right for free in the cases a formula would have to enumerate: the count
  // stack that leans out above the tile, the second dashed ring on the cohort, the extra
  // caption under it, and that same caption disappearing when the ghosts are switched off.
  //
  // The frame is taken out of the drawing while the reading is taken. A frame that lives
  // inside the group it measures is part of the next measurement, so leaving it in grows the
  // node by one padding every time it is framed.
  var FRAME_PAD = 5;

  function frameNode(f) {
    f.frame.setAttribute('display', 'none');
    var b = f.g.getBBox();
    f.frame.removeAttribute('display');
    f.frame.setAttribute('x', (b.x - FRAME_PAD).toFixed(1));
    f.frame.setAttribute('y', (b.y - FRAME_PAD).toFixed(1));
    f.frame.setAttribute('width', (b.width + FRAME_PAD * 2).toFixed(1));
    f.frame.setAttribute('height', (b.height + FRAME_PAD * 2).toFixed(1));
  }

  // ---- the canvas ------------------------------------------------------------
  // The drawing sits on a plane and the page is a window onto it. Three numbers are the whole
  // of the state: view.x and view.y are the point of the drawing under the top left corner of
  // the window, in the drawing's own units, and view.k is how many screen pixels one of those
  // units is worth. Everything else is derived from them and nothing else is stored, so the
  // viewBox, the dot grid and the zoom readout cannot drift apart: they are three renderings of
  // the same three numbers, written together in applyView().
  //
  // WHY THE VIEWBOX AND NOT A TRANSFORM ON A WRAPPER GROUP. Both are correct SVG. A wrapper
  // group would have put one more element between every node and the svg, and feedback.js
  // describes a clicked element by walking up to five ancestors into a `tag>tag>tag` path. Every
  // report ever filed against this drawing carries that path, and a wrapper would have silently
  // changed all of them. The viewBox moves the view without touching the tree, so a node's path,
  // its data-node key, its getBBox and its focus frame are the same bytes at every zoom.
  //
  // The viewBox is always the same shape as the box it is drawn into, width/k by height/k, so
  // preserveAspectRatio never has anything to letterbox and the mapping between the screen and
  // the drawing stays a straight multiply. That is what makes the anchored zoom below exact
  // rather than nearly right.
  var view = { x: 0, y: 0, k: 1 };
  var vw = 1, vh = 1;               // the window, in CSS pixels
  var fitted = false;               // has a real measurement been framed yet
  var K_MAX = 8;                    // one tile 34 units wide fills 272px: far past useful
  var K_MIN = 0.1;                  // the whole drawing at 123px: far past useful the other way
  // Breathing room around a fitted drawing, in screen pixels, and it is not only breathing
  // room. The drawing's lanes are filled with the panel colour and they are opaque, so at a
  // tight fit they tile the whole window and the ground is visible only in the ten pixel
  // gutters between them: the page would open looking exactly like the page it replaced, and a
  // reader would have to move something before anything told them they could. The margin is the
  // frame of canvas the drawing sits on when it is at home.
  var FIT_MARGIN = 24;
  var GRID_UNIT = 32;               // the grid's base spacing, in the drawing's units
  var GRID_MIN_PX = 22;             // and the range it is kept inside on screen, by doubling
  // Click or drag. Two thresholds, because one of them cannot tell the two apart on its own.
  // The distance threshold is the ordinary case: a hand shakes by a pixel or two while clicking,
  // and this drawing's tiles are 34 units wide, so a few pixels of slop costs a reader nothing.
  // The time threshold is for the other case, a small deliberate nudge of the canvas: 3px moved
  // slowly is somebody pushing the plane, 3px moved inside a quarter second is somebody clicking
  // a node and missing by 3px. Whichever fires first wins, and the gesture is a drag from that
  // moment on.
  var DRAG_PX = 5, SLOW_PX = 3, SLOW_MS = 250;

  function clampK(k) { return Math.max(K_MIN, Math.min(K_MAX, k)); }

  // The window, measured off the rect and not off clientWidth and clientHeight. Those two are
  // rounded to whole pixels, and the rounding is not cosmetic here: at 1536x839 the canvas is
  // 735.58px tall and clientHeight says 736, so a viewBox computed from it asks the browser to
  // fit 736 pixels' worth of drawing into 735.58, and the browser obliges by scaling everything
  // by 0.94 of a per mille. The scale on screen is then not the scale this file thinks it is,
  // and an anchored zoom drifts by a fifth of a pixel per step, growing with the zoom. Driven
  // and measured rather than reasoned: getScreenCTM read back 1.173395 where view.k said
  // 1.174061. Fifth time in this repository that a measured value beat a rounded copy of one.
  function measure() {
    var r = canvas.getBoundingClientRect();
    vw = Math.max(1, r.width);
    vh = Math.max(1, r.height);
  }

  // The scale at which the whole drawing sits inside the window. G.w and G.h are the build's
  // own numbers for the drawing's extent, which is the same pair the old fixed viewBox used, so
  // a fitted view frames exactly what this page framed before it could be moved at all.
  function fitScale() {
    var k = Math.min((vw - FIT_MARGIN * 2) / G.w, (vh - FIT_MARGIN * 2) / G.h);
    return (k > 0 && isFinite(k)) ? k : 1;
  }

  function fitView() {
    var k = clampK(fitScale());
    return { k: k, x: G.w / 2 - vw / (2 * k), y: G.h / 2 - vh / (2 * k) };
  }

  // Is the view anywhere other than home? Read off the difference between the view and the one
  // fit() would produce, in screen pixels, so it answers the reader's question ("have I moved?")
  // and not an arithmetic one about floating point.
  function away() {
    var f = fitView();
    return Math.abs(view.k - f.k) > f.k * 0.01 ||
           Math.abs(view.x - f.x) * view.k > 2 ||
           Math.abs(view.y - f.y) * view.k > 2;
  }

  var levelEl = document.getElementById('zoomlevel');
  var fitBtn = document.getElementById('zoomfit');

  function applyView() {
    if (!(view.k > 0) || !isFinite(view.k)) return;
    // Three decimals rather than two: the attribute is a string, so its precision is the
    // precision of the scale the browser actually renders at, and the anchored zoom is only as
    // exact as that. Three places puts the residual under a thousandth of a pixel.
    svg.setAttribute('viewBox', view.x.toFixed(3) + ' ' + view.y.toFixed(3) + ' ' +
                     (vw / view.k).toFixed(3) + ' ' + (vh / view.k).toFixed(3));

    // The grid's spacing is a power of two multiple of GRID_UNIT, picked so that what lands on
    // screen is between GRID_MIN_PX and twice that, whatever the zoom. The dots therefore never
    // crowd into a grey wash or thin out into nothing, and because the spacing is measured in
    // the drawing's units the ground moves with the drawing rather than sitting still behind it.
    // Bounded rather than a bare while: a scale this cannot reach in thirty steps is a bug
    // upstream, and a stylesheet is not the place to find out.
    var step = GRID_UNIT, px = step * view.k, guard = 0;
    while (px < GRID_MIN_PX && guard++ < 30) { step *= 2; px = step * view.k; }
    guard = 0;
    while (px >= GRID_MIN_PX * 2 && guard++ < 30) { step /= 2; px = step * view.k; }
    var ox = -view.x * view.k, oy = -view.y * view.k;
    canvas.style.setProperty('--grid-step', px.toFixed(3) + 'px');
    canvas.style.setProperty('--grid-x', (ox - Math.floor(ox / px) * px).toFixed(3) + 'px');
    canvas.style.setProperty('--grid-y', (oy - Math.floor(oy / px) * px).toFixed(3) + 'px');

    // 100% is the whole drawing on screen, not one drawing unit per pixel. The drawing has no
    // natural size in pixels, so an absolute percentage would be a number about the build's
    // coordinate system rather than about anything a reader can see; measured from the fit, the
    // readout answers the one question a canvas raises, which is how far in you are.
    if (levelEl) levelEl.textContent = Math.round(view.k / fitScale() * 100) + '%';
    if (fitBtn) fitBtn.classList.toggle('away', away());
  }

  function fit() {
    var f = fitView();
    view.x = f.x; view.y = f.y; view.k = f.k;
    applyView();
  }

  // Zoom about a point on the screen, so that whatever is under the cursor stays under it. The
  // drawing point under the cursor is read at the old scale and put back at the new one; the
  // subtraction is exact because the viewBox always matches the box's own shape.
  function zoomAt(cx, cy, factor) {
    if (!(factor > 0) || !isFinite(factor)) return;
    var k1 = clampK(view.k * factor);
    if (k1 === view.k) return;
    var r = svg.getBoundingClientRect();
    var px = cx - r.left, py = cy - r.top;
    var ux = view.x + px / view.k, uy = view.y + py / view.k;
    view.k = k1;
    view.x = ux - px / k1;
    view.y = uy - py / k1;
    applyView();
  }

  function zoomStep(factor) {
    var r = svg.getBoundingClientRect();
    zoomAt(r.left + vw / 2, r.top + vh / 2, factor);
  }

  // ---- one gesture at a time -------------------------------------------------
  // Pointer events rather than mouse plus touch, so a finger, a mouse and a pen are one code
  // path. Nothing is captured to an element: a captured pointer retargets the compatibility
  // mouse events too, and the click that selects a node is one of those. The moves and the
  // release are taken off the window instead, for the length of the gesture only.
  var ptrs = {};                    // live pointers, by pointerId
  var nptr = 0;
  var gest = null;
  var suppressUntil = 0;            // a click arriving before this is the end of a drag

  function dist(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function now() { return window.performance ? performance.now() : Date.now(); }

  function startPan(x, y, isDrag) {
    gest = { mode: 'pan', sx: x, sy: y, vx: view.x, vy: view.y, t0: now(),
             far: 0, drag: !!isDrag };
    if (isDrag) canvas.classList.add('panning');
  }

  function startPinch() {
    var ids = Object.keys(ptrs);
    var a = ptrs[ids[0]], b = ptrs[ids[1]];
    gest = { mode: 'pinch', d: dist(a, b), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, drag: true };
    canvas.classList.add('panning');
  }

  function onDown(e) {
    // Only the primary button. A right click is the browser's, and a middle click is not this
    // page's to interpret either.
    if (e.button) return;
    // The view control is a control, not a piece of canvas to drag.
    if (e.target && e.target.closest && e.target.closest('#zoomctl')) return;
    if (!ptrs[e.pointerId]) nptr++;
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    suppressUntil = 0;
    if (nptr === 1) {
      startPan(e.clientX, e.clientY, false);
      window.addEventListener('pointermove', onMove, true);
      window.addEventListener('pointerup', onUp, true);
      window.addEventListener('pointercancel', onUp, true);
    } else if (nptr === 2) {
      startPinch();
    }
  }

  function onMove(e) {
    var p = ptrs[e.pointerId];
    if (!p || !gest) return;
    p.x = e.clientX; p.y = e.clientY;

    if (gest.mode === 'pinch') {
      var ids = Object.keys(ptrs);
      if (ids.length < 2) return;
      var a = ptrs[ids[0]], b = ptrs[ids[1]];
      var d = dist(a, b), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      // Two fingers do both jobs at once: the distance between them is the zoom, anchored on
      // the point between them, and the movement of that point is the pan. Stepwise from the
      // last frame rather than from the start of the gesture, so a pinch that also travels
      // across the screen does not fight itself.
      if (gest.d > 0 && d > 0) zoomAt(mx, my, d / gest.d);
      if (mx !== gest.mx || my !== gest.my) {
        view.x -= (mx - gest.mx) / view.k;
        view.y -= (my - gest.my) / view.k;
        applyView();
      }
      gest.d = d; gest.mx = mx; gest.my = my;
      return;
    }

    var dx = e.clientX - gest.sx, dy = e.clientY - gest.sy;
    var far = Math.sqrt(dx * dx + dy * dy);
    if (far > gest.far) gest.far = far;
    if (!gest.drag &&
        (gest.far >= DRAG_PX || (gest.far >= SLOW_PX && now() - gest.t0 >= SLOW_MS))) {
      gest.drag = true;
      canvas.classList.add('panning');
    }
    if (!gest.drag) return;
    // Measured from where the gesture started rather than accumulated frame by frame, so the
    // drawing sits exactly under the finger however many events arrived on the way.
    view.x = gest.vx - dx / view.k;
    view.y = gest.vy - dy / view.k;
    applyView();
  }

  function onUp(e) {
    if (ptrs[e.pointerId]) { delete ptrs[e.pointerId]; nptr = Math.max(0, nptr - 1); }
    // A gesture that moved the canvas swallows the click it is about to produce. The window is
    // short so that a drag which never produces a click, which is the ordinary case on a touch
    // screen, cannot leave a trap for an unrelated click minutes later.
    if (gest && gest.drag) suppressUntil = now() + 500;
    if (nptr === 1) {
      // A pinch that lost a finger goes on as a pan under the finger that is left, and it is a
      // drag from the start: two fingers have already been on the glass and nothing about that
      // was a click.
      var p = ptrs[Object.keys(ptrs)[0]];
      startPan(p.x, p.y, true);
      return;
    }
    if (nptr === 0) endGesture();
  }

  function endGesture() {
    gest = null; ptrs = {}; nptr = 0;
    canvas.classList.remove('panning');
    window.removeEventListener('pointermove', onMove, true);
    window.removeEventListener('pointerup', onUp, true);
    window.removeEventListener('pointercancel', onUp, true);
  }

  // The click a drag leaves behind is stopped here, on the window, in the capture phase. That
  // is deliberately the earliest point there is: the capture phase runs window, then document,
  // then down the tree, so this listener runs before feedback.js's document level capture
  // whatever order the scripts happen to load in. stopImmediatePropagation, not
  // stopPropagation, because feedback.js listens on a different node and would otherwise still
  // be reached. A pan therefore cannot select a node, cannot clear a selection, and cannot file
  // a card while capture mode is on.
  window.addEventListener('click', function (e) {
    if (!suppressUntil || now() > suppressUntil) return;
    suppressUntil = 0;
    e.stopImmediatePropagation();
    e.preventDefault();
  }, true);

  // ---- the wheel -------------------------------------------------------------
  // Registered on the canvas and nowhere else, and not passive, because it always calls
  // preventDefault: over this box the wheel is always a zoom, so there is no case in which the
  // event is looked at and handed back. Off the box it is untouched, which is what keeps the
  // detail panel scrolling with the wheel and the board view, a different route that does not
  // draw this element at all, scrolling exactly as it did. The diagram view itself has nothing
  // to scroll: the page is one screen tall at every width and the canvas does not overflow.
  //
  // This listener was moved to the document and back during the work, and the round trip is
  // worth a sentence because the evidence for moving it looked overwhelming and was noise.
  // Driven over CDP at 1536x839, a wheel over a `rect.band` reached nothing, six times out of
  // six, while the same gesture over bare svg three hundred pixels away worked six times out of
  // six. That reads exactly like a container listener being deaf over its own children, and it
  // is not: the wheel is hit tested against the browser's real widget while the dispatched event
  // carries the emulated viewport's coordinates, and headless Chrome's widget is 800 by 600
  // whatever the emulation reports. Every drop was a point the widget did not contain, and
  // enlarging the widget past the viewport broke it again from the other side. Opening a real
  // window of exactly the viewport's size and emulating nothing lands 12 wheels out of 12, over
  // band rects and label text included. Same lesson as KAIZEN.md's entry on the 500px floor,
  // from a new direction: make the harness state the size it actually got, and where a
  // measurement depends on a coordinate, the size that matters is the widget's and not the
  // page's.
  //
  // ctrlKey is how a trackpad pinch arrives, at small deltas and a much higher rate than a
  // mouse wheel, so it gets its own multiplier. Both paths end in the same anchored zoom.
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    var dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16;            // lines
    else if (e.deltaMode === 2) dy *= vh;       // pages
    var f = Math.exp(-dy * ((e.ctrlKey || e.metaKey) ? 0.01 : 0.0022));
    zoomAt(e.clientX, e.clientY, Math.max(0.2, Math.min(5, f)));
  }, { passive: false });

  // ---- bringing a node back --------------------------------------------------
  // The band of screen the drawing actually has: the canvas, less the header where it overlaps
  // it, less the detail panel where the panel is a sheet across the bottom. Where the panel is
  // the right hand rail the canvas has already been inset for it in the stylesheet, so there is
  // nothing to subtract. Read from live rects, and from offsetHeight for the sheet, because the
  // sheet is still sliding when this runs and a transform moves its rect while it plays.
  function band() {
    var r = canvas.getBoundingClientRect();
    var b = { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    var hr = hdr ? hdr.getBoundingClientRect() : null;
    if (hr && hr.bottom > b.top) b.top = Math.min(hr.bottom, b.bottom);
    if (panel && panel.classList.contains('open') &&
        panel.offsetWidth >= window.innerWidth - 1) {
      b.bottom = Math.max(b.top, Math.min(b.bottom, window.innerHeight - panel.offsetHeight));
    }
    return b;
  }

  // Pan, if the node is not already inside that band, until it is in the middle of it. Each axis
  // is decided on its own: a node hidden behind the sheet should not also be moved sideways.
  function ensureVisible(n) {
    if (!n) return;
    var r = svg.getBoundingClientRect(), b = band();
    var pad = (TILE / 2) * view.k + 8;
    var sx = r.left + (n.x - view.x) * view.k, sy = r.top + (n.y - view.y) * view.k;
    var moved = false;
    if (b.right - b.left > pad * 2 && (sx - pad < b.left || sx + pad > b.right)) {
      view.x += (sx - (b.left + b.right) / 2) / view.k;
      moved = true;
    }
    if (b.bottom - b.top > pad * 2 && (sy - pad < b.top || sy + pad > b.bottom)) {
      view.y += (sy - (b.top + b.bottom) / 2) / view.k;
      moved = true;
    }
    if (moved) applyView();
  }

  // ---- wiring ----------------------------------------------------------------
  function initView() {
    measure();
    fit();
    fitted = vw > 2 && vh > 2;
    canvas.addEventListener('pointerdown', onDown);

    var onBox = function () {
      measure();
      // The first real measurement frames the drawing. Every later one keeps the view where the
      // reader put it and only changes how much of the plane is on screen, which is what makes
      // opening the detail panel take a bite out of the window rather than move the drawing.
      if (!fitted && vw > 2 && vh > 2) { fitted = true; fit(); return; }
      applyView();
    };
    if (window.ResizeObserver) new ResizeObserver(onBox).observe(canvas);
    else window.addEventListener('resize', onBox);

    var btn = function (id, f) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', f);
    };
    btn('zoomin', function () { zoomStep(1.3); });
    btn('zoomout', function () { zoomStep(1 / 1.3); });
    btn('zoomfit', fit);

    // 0 is home, + and - step the zoom about the middle of the screen. Bubble phase and heavily
    // guarded: the board is a different view, a modifier means the key belongs to the browser,
    // a field is somebody typing, and while the capture popover is open the digits are its own.
    document.addEventListener('keydown', function (e) {
      if (document.body.classList.contains('board')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' ||
                t.isContentEditable)) return;
      if (document.querySelector('.fb-popover')) return;
      // The student list is over the canvas and the canvas is behind it. A digit typed there is
      // not an instruction to move a drawing the reader cannot see. The programme list is the
      // same case for the same reason: while it is open the keys belong to it, and `0` there is
      // a reader walking a list of seven and not a reader asking to reframe the one behind it.
      if (rosterOpen() || pgMenuOpen()) return;
      if (e.key === '0') { e.preventDefault(); fit(); }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomStep(1.3); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomStep(1 / 1.3); }
    });
  }

  // The address has already chosen which of the seven this is, at the top of the file, so this
  // draws the reader's programme and not the default followed by the reader's.
  draw(G);
  initView();

  // ---- selection -----------------------------------------------------------
  var panel = document.getElementById('panel');
  var current = null;

  function paint(id, on) {
    var f = gfxNode[id];
    // A selected ghost keeps its dashed outline and stays unfilled. Filling it the way a real
    // node is filled would make selection the one moment it looks like an object that exists.
    f.tile.setAttribute('fill', on ? (f.ghost ? 'rgba(45,114,210,0.08)' : 'var(--i-primary)')
                                   : f.rest);
    f.tile.setAttribute('stroke', on ? 'var(--i-primary)' : f.col);
    f.mark.setAttribute(f.count ? 'fill' : 'stroke', on ? 'var(--i-primary-fg)' : f.col);
    f.g.classList.toggle('sel', on);
  }

  function clear() {
    if (current) paint(current, false);
    current = null;
    veil();
    Object.keys(gfxNode).forEach(function (k) { gfxNode[k].g.classList.remove('dim'); });
    gfxEdge.forEach(function (x) { x.g.classList.remove('dim'); x.c.classList.remove('dim'); });
    panel.classList.remove('open');
    document.body.classList.remove('panel-open');
  }

  function select(id) {
    if (current === id) { clear(); return; }
    if (current) paint(current, false);
    current = id;
    paint(id, true);
    veil();

    var keep = {};
    keep[id] = true;
    var live = {};
    edgesOf[id].forEach(function (i) {
      var e = G.edges[i];
      keep[e.s] = true; keep[e.t] = true; live[i] = true;
    });
    Object.keys(gfxNode).forEach(function (k) { gfxNode[k].g.classList.toggle('dim', !keep[k]); });
    gfxEdge.forEach(function (x, i) {
      x.g.classList.toggle('dim', !live[i]);
      x.c.classList.toggle('dim', !live[i]);
    });

    var n = nodeById[id];
    document.getElementById('ptype').textContent = TLABEL[n.type];
    document.getElementById('ptype').style.color = COLOR[n.type];
    document.getElementById('pname').textContent = n.label;
    var rel = edgesOf[id].map(function (i) {
      var e = G.edges[i];
      return e.s === id ? e.v + ' ' + nodeById[e.t].label
                        : nodeById[e.s].label + ' ' + e.v + ' this';
    });
    // A node that carries a note leads with it. On a ghost the note is the whole point of
    // opening the panel, and on the cohort it says which part of a real object is missing.
    var pnote = document.getElementById('pnote');
    pnote.textContent = '';
    if (n.note) {
      var sn = document.createElement('span');
      sn.className = 'pnote-note';
      sn.textContent = n.note;
      pnote.appendChild(sn);
    }
    // A ghost's one relationship is already a property row, so the list is left off there.
    if (!n.ghost) {
      var sr = document.createElement('span');
      sr.className = 'pnote-rel';
      sr.textContent = rel.length + (rel.length === 1 ? ' relationship: ' : ' relationships: ')
                       + rel.join('; ');
      pnote.appendChild(sr);
    }

    var dl = document.getElementById('pprops');
    dl.textContent = '';
    n.props.forEach(function (p, i) {
      var dt = document.createElement('dt');
      dt.textContent = p.k;
      // The first n.route rows answer how this type gets filled at all; the rest are what it
      // would hold. Two different questions in one list, so a hairline separates them, and the
      // build says where it goes by counting rather than by the browser recognising a key.
      //
      // Inline rather than a class, and that is the only reason worth stating: the stylesheet is
      // not this card's to change, and a rule set from here is one fewer file two people are
      // editing at once. It reads the same custom property the stylesheet's own rules read, so
      // it follows the theme rather than pinning a colour.
      if (n.route && i === n.route) {
        dt.style.borderTop = '1px solid var(--rule-muted)';
        dt.style.paddingTop = '11px';
      }
      var dd = document.createElement('dd');
      var b = document.createElement('b');
      b.textContent = p.v;
      var f = document.createElement('span');
      f.className = 'flag ' + p.f;
      f.textContent = p.f;
      dd.appendChild(b);
      dd.appendChild(f);
      dl.appendChild(dt);
      dl.appendChild(dd);
    });
    // A node that stands for a list says where the list is. Only one node does, and which one is
    // named by the build rather than by an id written here, so a second aggregate would arrive
    // with its own link and this code would not have to learn about it.
    var pmore = document.getElementById('pmore');
    pmore.textContent = '';
    if (G.roster && G.roster.owner === id) {
      var a = document.createElement('a');
      a.className = 'linkbtn pmore-link';
      a.href = ROSTER_ROUTE;
      a.textContent = 'see all ' + G.roster.n + ' students';
      pmore.appendChild(a);
      var hint = document.createElement('span');
      hint.className = 'pmore-hint';
      hint.textContent = G.roster.drawn + ' of them are drawn here; the list has every row.';
      pmore.appendChild(hint);
    }
    panel.classList.add('open');
    document.body.classList.add('panel-open');
    reveal(n);
  }

  // Keep the selected node visible once the panel has taken its bite of the screen. The panel
  // takes that bite on a different axis at each width: above the breakpoint it is a rail down
  // the right and the canvas is inset for it, below the breakpoint it is a sheet across the
  // bottom and the node it describes is usually underneath it, since at 390px 22 of the 30
  // tiles sit in the sheet's band.
  //
  // This used to be a scroll on whichever of the canvas and the page could take one, and it was
  // the awkward part of issue 21: below the breakpoint the page was barely taller than the
  // viewport, so the scroll ran out and the room had to be manufactured by reserving the sheet's
  // own height under the drawing. A canvas cannot run out. ensureVisible() pans the view, which
  // is the same motion at both widths and needs no room reserved anywhere, and the reserve is
  // gone from the stylesheet with it. The delay is still there and is still about the sheet:
  // its height is only true once the class is on the panel.
  function reveal(n) {
    setTimeout(function () { ensureVisible(n); }, 30);
  }

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
  // the reader has said otherwise. The thirteen type colours in the generated stylesheet at the
  // top of this file are on the same property, so the tiles and the chrome turn together.
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
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* nothing persists, page still turns */ }
    });
  }

  // ---- ghosts on or off ----------------------------------------------------
  // Shown by default. The absences are the finding, so the reader meets them first, and the
  // toggle is there for the times the question is only about what the systems do hold.
  var ghBtn = document.getElementById('ghtoggle');
  if (ghBtn) {
    ghBtn.addEventListener('click', function () {
      var next = ghBtn.getAttribute('aria-pressed') !== 'true';
      ghBtn.setAttribute('aria-pressed', next ? 'true' : 'false');
      document.body.classList.toggle('hide-ghosts', !next);
      if (!next && current && nodeById[current].ghost) clear();
    });
  }

  document.getElementById('close').addEventListener('click', clear);
  svg.addEventListener('click', clear);
  // Escape clears the selection. It is registered in the bubble phase on purpose: feedback.js
  // takes Escape in the capture phase while its capture mode is on and stops it there, so the
  // one Escape that leaves capture mode never also throws away the selection the note is
  // about. This listener only ever sees the Escapes that capture mode did not want.
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') clear(); });

  // ---- the whole cohort, as a list -------------------------------------------
  // The drawing answers "what shape is a student" and draws four of the thirty four, because a
  // model diagram that drew all of them would be a register with arrows. This view answers the
  // other question, "who is in the cohort", and answers it completely. It is a route of its own
  // beside the board's, not a way out of a limitation: the count under the students card and
  // this list are two halves of the same honesty, one saying how many the picture left out and
  // the other showing them.
  //
  // Every row is invented. The rows come from the drawing's own generated file, so they are
  // covered by both values a feedback note carries: the commit, which pins every byte of the
  // deployed site, and the drawing digest, which pins the geometry and the rows inside it.
  // Nothing in this file knows a student's name.
  //
  // It is an overlay and not a third main. The board replaces the diagram, which takes the
  // canvas off the screen and hands its ResizeObserver a box of nothing; that is a path this
  // page already walks and survives, and there was no reason to walk it twice. Over the top, the
  // canvas keeps its size and its view, and the backdrop makes it inert while the list is up:
  // the wheel listener is on the canvas and never sees an event over the backdrop.
  var ROSTER_ROUTE = '#/students';
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
    if (rosterBuilt || !rosterEl || !G.roster) return;
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
    sub.textContent = rows.length + ' rows · ' + r.drawn + ' of them drawn on the canvas · ' +
      order.map(function (s) { return states[s] + ' ' + s; }).join(', ');
    var warn = document.createElement('span');
    warn.className = 'warn';
    warn.textContent = 'every person here is invented';
    sub.appendChild(warn);

    var table = document.createElement('table');
    table.className = 'roster-table';
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
    // Escape, in the capture phase, so it beats the bubble listener below that clears the
    // selection: closing the list must not also throw away the node the reader had open behind
    // it. Capture mode is left alone deliberately. While it is on, Escape is how a reader leaves
    // it, feedback.js takes that Escape in its own capture listener, and a list that also
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
    rosterRoute();
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
  // Big Law should not have to walk past four other programmes to reach it. Ordinary anchors to
  // the seven addresses mean the keyboard, the middle mouse button, the context menu and the back
  // button all work without this file implementing any of them, and the navigation goes through
  // the hash exactly as it would if the reader had typed it, so there is one code path into a
  // view and not two.
  //
  // A ROUTE CHANGE REFITS THE VIEW, and the alternative was to keep the reader's pan and zoom.
  // Keeping it is defensible while a switch is between two pictures of the same thing; these are
  // seven different drawings of seven different programmes, 576 to 610 units tall, with different
  // node counts and one of them missing a whole lane. A reader zoomed into the agreement lane of
  // Z-IB and moved to Z-CFA would land on a rectangle of another drawing chosen by arithmetic
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
      a.href = v.route || (PGPREFIX + v.key);
      a.textContent = v.label || v.name || v.code;
      // The list closes on the way out. The navigation itself is the anchor's, so nothing here
      // decides which view is drawn: the hash changes, and the one listener below answers it.
      a.addEventListener('click', function () { closePgMenu(false); });
      pgMenu.appendChild(a);
      pgItems.push({ v: v, a: a });
    });
  }

  // Every place on the page that names the programme, written from the view rather than typed
  // into index.html, because a number or a name typed into that file is right on one of the seven.
  function describeProgramme() {
    var v = pgView;
    var label = v.label || v.name || v.code;
    if (pgBtn) {
      pgBtn.textContent = label;
      pgBtn.title = 'programme drawn: ' + label + '. Press for the other ' + (VIEWS.length - 1);
    }
    pgItems.forEach(function (it) {
      if (it.v === v) it.a.setAttribute('aria-current', 'true');
      else it.a.removeAttribute('aria-current');
    });

    // The cohort, off its own node rather than out of a second list of names. The code is
    // dropped from the front of it because the sentence has just said the code.
    var coh = null;
    G.nodes.forEach(function (n) { if (n.type === 'Cohort' && !coh) coh = n; });
    var cohLabel = coh ? coh.label : '';
    if (v.code && cohLabel.indexOf(v.code + ' ') === 0) cohLabel = cohLabel.slice(v.code.length + 1);
    var cohEl = document.getElementById('subcohort');
    if (cohEl) cohEl.textContent = cohLabel;

    // The footer's two counts. The cohorts are 34, 27, 21, 18, 24, 16 and 30, so a footer holding
    // one of them in words is a footer that is wrong six times out of seven.
    var r = G.roster || {};
    var fd = document.getElementById('footdrawn');
    var fn = document.getElementById('footn');
    if (fd && typeof r.drawn === 'number') fd.textContent = r.drawn;
    if (fn && typeof r.n === 'number') fn.textContent = r.n;

    // The drawing has no text in it saying what it is of, so this is the only name a screen
    // reader gets for the whole svg, and the tab title is what a second window is told apart by.
    svg.setAttribute('aria-label',
      'Instance diagram of programme ' + label + (cohLabel ? ', cohort ' + cohLabel : ''));
    document.title = (v.code ? v.code + ' · ' : '') + PAGE_TITLE;

    // The sentence changed length, and below the breakpoint that can change how many lines the
    // header takes. --hh is what keeps the detail panel off the header's own buttons. Skipped on
    // the first call, which runs before hdr is measured and is followed by the measurement.
    if (hdr) measureHeader();
  }

  function setProgramme(v) {
    if (!v || v === pgView) return;
    // The selection belongs to the drawing that is leaving. Cleared before the redraw, because
    // clear() repaints the selected tile and after draw() that tile is gone: on six of the seven
    // routes the id would not even exist.
    clear();
    pgView = v;
    draw(v.drawing);
    describeProgramme();
    resetRoster();
    // Refit, but through the same door a first paint uses rather than by calling fit() here. On a
    // route change arriving from #/board the canvas is still display:none at this instant, since
    // board.js answers the same hashchange and loads after this file, so a fit() taken now would
    // frame a box of nothing. Dropping the flag makes the next real measurement the fit, which is
    // the path the page already has for a canvas that has just been given a size.
    fitted = false;
    measure();
    if (vw > 2 && vh > 2) { fitted = true; fit(); }
  }

  var PAGE_TITLE = document.title;

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
    if (v) setProgramme(v);
  });
  describeProgramme();

  // The panel is a fixed overlay and the header runs the full width, so the panel is told
  // where the header ends. Without it the open panel covers the header's own buttons.
  var hdr = document.querySelector('header');
  function measureHeader() {
    document.documentElement.style.setProperty('--hh', (hdr ? hdr.offsetHeight : 0) + 'px');
  }
  measureHeader();
  window.addEventListener('resize', measureHeader);

  // What feedback.js needs in order to say what was on screen when a note was written, plus the
  // view, which is here for a driver to read and assert against rather than for the page: an
  // anchored zoom is a claim about arithmetic and the only honest way to check it is to take the
  // numbers off the running page before and after.
  window.ZT = {
    // The digest of the drawing, under a name that cannot be read as a revision, and the commit
    // the page was deployed from, which is the value that answers "what code was this". The
    // commit is read from window.ZV, written by the deploy workflow into site/version.js, and is
    // null on anything that was not published by it. Issue 47. Both are here for a driver to read
    // off the running page; feedback.js reads window.ZV itself rather than through this object,
    // because it has to be able to name the commit in a run where this file threw.
    drawingDigest: G.drawingDigest || 'unknown',
    commit: (window.ZV && window.ZV.commit) || null,
    // When that commit was published, which is the other half of "is this reader on a stale
    // page": the commit says which code and this says how long the origin has been serving it.
    deployedAt: (window.ZV && window.ZV.deployedAt) || null,
    selected: function () {
      if (!current) return null;
      var n = nodeById[current];
      return { id: n.id, label: n.label, type: TLABEL[n.type] };
    },
    view: function () { return { x: view.x, y: view.y, k: view.k, w: vw, h: vh }; },
    fit: fit,
    // Which of the seven is drawn, for the same reason view() and theme() are here: a driver
    // checking that an address reached the right drawing should read the page's own answer rather
    // than infer it from a screenshot of seven near identical pictures. The extent comes off the
    // drawing that is loaded, so it is the number fit() is framing and not a copy of it.
    programme: function () {
      return { key: pgView.key, code: pgView.code, label: pgView.label,
               digest: G.drawingDigest || 'unknown', w: G.w, h: G.h,
               menu: pgMenuOpen() };
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
    // Which nodes the drawing is not painting, for the same reason view() is here: whether a
    // reveal put exactly the intended set on screen is a claim a driver should be able to read
    // off the running page rather than infer from a screenshot. Derived from the rule table, so
    // it cannot report a set the stylesheet is not acting on.
    veiled: function () {
      var out = { hidden: [], shown: [] };
      Object.keys(veiled).forEach(function (id) {
        (gfxNode[id].g.classList.contains('veil-hidden') ? out.hidden : out.shown).push(id);
      });
      out.hidden.sort(); out.shown.sort();
      return out;
    },
    roster: function () { return rosterOpen(); }
  };
})();
