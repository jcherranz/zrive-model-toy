(function () {
  'use strict';

  var G = window.G;
  var NS = 'http://www.w3.org/2000/svg';
  var TILE = G.tile, R = TILE / 2;
  var COLOR = {}, TLABEL = {}, GLYPH = {};
  G.types.forEach(function (t) { COLOR[t.k] = t.c; TLABEL[t.k] = t.label; GLYPH[t.k] = t.glyph; });

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
    claim:     ['M8 2.6 14 13.4H2z', 'M8 6.6v3.2', 'M8 11.4v.6']
  };

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function tint(hex, a) {
    var v = parseInt(hex.slice(1), 16);
    return 'rgba(' + (v >> 16 & 255) + ',' + (v >> 8 & 255) + ',' + (v & 255) + ',' + a + ')';
  }

  // There is no legend. It was twelve swatches restating what the panel says on a click and
  // what the band captions say standing, and it cost the drawing a header row at every width
  // and four of them at 390px. Issue 32. G.types is still read above, for the colour, the type
  // name and the glyph of each tile.

  // ---- svg scaffolding -----------------------------------------------------
  // One drawing, one cohort, and no way into any other view. The page used to carry a second
  // coordinate set for a two cohort drawing on a header switch; issue 42 took it out, and it
  // was taken out of the build rather than hidden in the browser, so there is nothing left here
  // to switch to. draw() still takes its drawing as an argument because everything below reads
  // G rather than reaching for a global, which is what kept the two views from moving each
  // other and is worth keeping now that only one of them is left.
  var svg = document.getElementById('graph');
  var canvas = document.getElementById('canvas');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  var nodeById, edgesOf, gfxNode, gfxEdge;

  // The verb that makes a company an employer. It is a relationship and not a type, and that
  // distinction is the whole of the rule below; see the block that builds empBy.
  var EMPLOY_VERB = 'employed by';
  var empBy, empEdges;

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
    if (window.ZT) window.ZT.build = G.build || 'unknown';

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
                     rx: 6, fill: tint(col, 0.10), stroke: tint(col, 0.45) }, g);
        el('rect', { x: n.x - R + 2.5, y: n.y - R - 2.5, width: TILE, height: TILE,
                     rx: 6, fill: tint(col, 0.12), stroke: tint(col, 0.6) }, g);
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
        fill: n.ghost ? 'rgba(143,153,168,0.07)' : tint(col, 0.14), stroke: col
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
                        ghost: !!n.ghost, rest: tile.getAttribute('fill') };
    });

    // ---- who is an employer ---------------------------------------------------
    // Derived from the links and never from the type, and that is the load bearing part of
    // issue 48. Six nodes in this drawing are of type Company and only five of them are
    // employers: the sixth, Aretxa Capital, is an empresa colaboradora that hosts a visit,
    // employs nobody and hangs off the cohort rather than off any instructor. A rule reading
    // `type === 'Company'` would take it off the page along with the five and would delete
    // exactly the distinction this toy exists to make visible, that one type is playing two
    // roles. Keying on the verb also means the next instructor somebody adds brings their
    // employer under the rule by existing: nothing here holds a list of ids to forget to extend.
    empBy = {}; empEdges = {};
    gfxEdge.forEach(function (x, i) {
      if (x.e.v !== EMPLOY_VERB) return;
      var emp = x.e.t;
      if (!empBy[emp]) { empBy[emp] = {}; empEdges[emp] = []; }
      empBy[emp][x.e.s] = true;
      empEdges[emp].push(i);
      x.g.classList.add('employer');
      x.c.classList.add('employer');
    });
    Object.keys(empBy).forEach(function (id) {
      if (gfxNode[id]) gfxNode[id].g.classList.add('employer');
    });
    veilEmployers();
  }

  // ---- employers, on the instructor they employ -------------------------------
  // Which employers are painted. One at a time, and only while the selection is one end of the
  // 'employed by' link that makes it an employer. Clicking a second instructor therefore takes
  // the first employer away again: a reveal that accumulated would end an ordinary reading
  // session with all five on the page, which is the state this card exists to remove, and the
  // reader would have no way back to the quiet drawing short of a reload. Selecting the revealed
  // employer itself keeps it on screen and opens its panel like any other node, because the
  // selection is then the other end of the same link.
  //
  // Nothing here moves the drawing. The layout is generated for the full node set, so a hidden
  // employer keeps the coordinates the build gave it and is simply not painted; revealing it
  // paints it into space it already owns, and the drawing's extent, which is what fit() frames,
  // is the same number before and after. Laying the drawing out again without the hidden nodes
  // was the alternative and is worse twice over: every tile on the page would move on every
  // click, and the coordinates would stop being a pure function of the model.
  function veilEmployers() {
    Object.keys(empBy).forEach(function (id) {
      var show = !!current && (current === id || empBy[id][current] === true);
      var f = gfxNode[id];
      if (f) {
        f.g.classList.toggle('employer-hidden', !show);
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
      // An edge to nothing must not be drawn, so the line, its arrowhead and its verb chip go
      // with the node they land on. Without this the drawing would carry an 'employed by' arrow
      // pointing into an empty lane, which is a stronger claim of absence than the drawing means.
      (empEdges[id] || []).forEach(function (i) {
        gfxEdge[i].g.classList.toggle('employer-hidden', !show);
        gfxEdge[i].c.classList.toggle('employer-hidden', !show);
      });
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
      if (e.key === '0') { e.preventDefault(); fit(); }
      else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomStep(1.3); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomStep(1 / 1.3); }
    });
  }

  draw(window.G);
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
    veilEmployers();
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
    veilEmployers();

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
    n.props.forEach(function (p) {
      var dt = document.createElement('dt');
      dt.textContent = p.k;
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
    build: G.build || 'unknown',
    selected: function () {
      if (!current) return null;
      var n = nodeById[current];
      return { id: n.id, label: n.label, type: TLABEL[n.type] };
    },
    view: function () { return { x: view.x, y: view.y, k: view.k, w: vw, h: vh }; },
    fit: fit
  };
})();
