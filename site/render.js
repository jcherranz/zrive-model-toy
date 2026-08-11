// render: the drawing, painted from geometry, holding no state a reader can change.
//
// Issue 71, seam 2 of issue 60. This file turns one view's joined document into SVG and returns
// the handles the rest of the page acts on. It knows nothing about which of the seven programmes
// is on screen, where the view is panned to, or what is selected; it is called again with a
// different drawing and repaints from scratch.
//
// WHY THIS IS A BOUNDARY AND NOT A TIDY-UP. The owner's test is that a boundary earns its place
// when it has already been edited independently. This one has, repeatedly and alone: issue 32
// deleted the legend, issue 41 rebuilt the count stack and its backdrop after the cards arrived
// on screen at the wrong offsets, issue 56 moved every tile colour onto a custom property, issue
// 57 turned that pair of hexes into `light-dark()`, and issue 34 and issue 45 between them
// replaced the browser's focus ring with a measured frame. Every one of those changed what is
// painted and nothing about the selection, the address or the view.
//
// WHAT IT PUBLISHES, AND WHY THAT IS THE WHOLE INTERFACE. `gfx()` returns the four tables the
// drawing was built into: the node record by id, the edge indices touching each node, the painted
// handles per node and per edge. Selection paints through those handles and never queries the
// document; the viewport moves the whole svg and never touches them. A drawing that repainted and
// forgot to hand its tables back would leave the other two acting on elements that are no longer
// in the tree, so `gfx()` is taken fresh after every `draw()` rather than held.
//
// NOTHING HERE ADDS A `veil` CLASS ANY MORE. It used to, because the rule table and the drawing
// were in one file. Which nodes are painted on demand is a rule about the reader's selection, so
// it belongs to selection.js, which marks them the moment it is bound to a fresh drawing. That
// move is the point of the split: issues 48 and 51 would now touch one file.
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

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

  // The rect a keyboard focus is drawn as, padded around the node's own measured extent.
  //
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

  var ZM = window.ZM = window.ZM || {};

  // opts.svg      the <svg> the drawing is painted into
  // opts.canvas   the box it sits in, which carries the drawing's width as a custom property
  // opts.drawing  the first drawing, read once for the type palette and the tile size
  // opts.onSelect called with a node id when a node is clicked or activated from the keyboard
  // opts.onFocus  called with a node record when the keyboard walk reaches one
  ZM.render = function createRender(opts) {
    var svg = opts.svg, canvas = opts.canvas;
    var onSelect = opts.onSelect, onFocus = opts.onFocus;

    var COLOR = {}, TLABEL = {}, GLYPH = {};
    opts.drawing.types.forEach(function (t) { TLABEL[t.k] = t.label; GLYPH[t.k] = t.glyph; });

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
      opts.drawing.types.forEach(function (t) {
        COLOR[t.k] = 'var(--type-' + t.k + ')';
        decls.push('--type-' + t.k + ':light-dark(' + t.c + ',' + (t.cDark || t.c) + ');');
      });
      var st = document.createElement('style');
      st.id = 'type-palette';
      st.textContent = ':root{' + decls.join('') + '}\n';
      (document.head || document.documentElement).appendChild(st);
    })();

    // There is no legend. It was twelve swatches restating what the panel says on a click and
    // what the band captions say standing, and it cost the drawing a header row at every width
    // and four of them at 390px. Issue 32. The types are still read above, for the colour, the
    // type name and the glyph of each tile.

    // The tile size is read once, from the first drawing, exactly as it was when this was one
    // file. The seven drawings are laid out by one build with one tile, so a second reading per
    // drawing would be a second copy of a number that cannot differ.
    var TILE = opts.drawing.tile, R = TILE / 2;

    var G = null;
    var nodeById = {}, edgesOf = {}, gfxNode = {}, gfxEdge = [];

    // ---- svg scaffolding -----------------------------------------------------
    // draw() takes its drawing as an argument and everything below reads it rather than reaching
    // for a global. That was written for the two cohort switch issue 42 removed, kept afterwards
    // when only one drawing was left, and is now what the seven programme routes run on: issue 66
    // added a caller and not a mechanism. The drawings are the same shape as each other and the
    // same shape as the one this function was written against, so nothing in here knows how many
    // there are, which one is on screen, or that the reader can change it.
    function draw(g) {
      G = g;
      svg.textContent = '';
      // The viewBox is not set here. It is the view, and the view moves: viewport.js owns it and
      // writes it on every pan, every zoom and every resize. Issue 46. What is still fixed is the
      // drawing's own extent, G.w by G.h, which is what the fit frames.
      //
      // The width of the drawing is a number the build computes, so the stylesheet reads it from
      // here rather than holding a copy of it. Nothing in app.css reads --drawing-w today: the
      // rule that did was the sideways scroll under the drawing on a narrow viewport, which pan
      // and zoom replaced. The property is still written and build_layout.py still refuses to
      // build while a copy of the number is sitting in the stylesheet, because that guard is
      // about the number and not about the rule that happened to need it.
      canvas.style.setProperty('--drawing-w', G.w + 'px');

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
        // data-edge is the relationship key, the counterpart of data-node below: it is what a
        // feedback capture on a line or on its verb chip reports back.
        var key = e.s + '->' + e.t;
        var g2 = el('g', { 'data-edge': key, class: e.ghost ? 'ghost' : null }, gEdge);
        el('path', { d: e.d, class: e.ghost ? 'edge edge-ghost' : 'edge' }, g2);
        el('path', {
          d: 'M0 0 L-6.5 2.6 L-6.5 -2.6 Z', class: e.ghost ? 'arrow arrow-ghost' : 'arrow',
          transform: 'translate(' + e.ax + ',' + e.ay + ') rotate(' + e.aa + ')'
        }, g2);

        var c = el('g', { 'data-edge': key, class: e.ghost ? 'ghost' : null }, gChip);
        el('rect', {
          class: 'chip-bg', x: (e.cx - e.cw / 2).toFixed(1), y: (e.cy - 6.5).toFixed(1),
          width: e.cw.toFixed(1), height: 13
        }, c);
        var tx = el('text', { class: 'chip-tx', x: e.cx, y: e.cy }, c);
        tx.textContent = e.v;

        gfxEdge.push({ e: e, g: g2, c: c });
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
        var g2 = el('g', { class: n.ghost ? 'node ghost' : 'node', 'data-node': n.id,
                           tabindex: 0, role: 'button' }, gNode);
        var titleEl = el('title', {}, g2);
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
                       rx: 6, fill: tint(col, 10), stroke: tint(col, 45) }, g2);
          el('rect', { x: n.x - R + 2.5, y: n.y - R - 2.5, width: TILE, height: TILE,
                       rx: 6, fill: tint(col, 12), stroke: tint(col, 60) }, g2);
          el('rect', { x: n.x - R, y: n.y - R, width: TILE, height: TILE, rx: 6,
                       fill: 'var(--bg-panel)', stroke: 'none' }, g2);
        }
        // A node whose key does not exist keeps its own outline and gains a second, dashed one.
        // The object is real; something about it is missing, and the label below says what.
        if (n.mark) {
          el('rect', { class: 'ring-missing ghost', x: n.x - R - 3.5, y: n.y - R - 3.5,
                       width: TILE + 7, height: TILE + 7, rx: 8 }, g2);
        }
        var tile = el('rect', {
          class: n.ghost ? 'tile-bg tile-ghost' : 'tile-bg',
          x: n.x - R, y: n.y - R, width: TILE, height: TILE, rx: 6,
          // A ghost's wash is 7 per cent where every other tile is at 14, and it is the same
          // grey the ghost type carries rather than a second copy of that grey written here:
          // this line held `rgba(143,153,168,0.07)` as a literal, which was the palette's own
          // hex typed into a second file. The strength is unchanged.
          fill: tint(col, n.ghost ? 7 : 14), stroke: col
        }, g2);

        var mark;
        if (n.ghost) {
          // Deliberately empty. A ghost tile holds no glyph because there is nothing in it.
          mark = el('g', {}, g2);
        } else if (n.count) {
          mark = el('text', {
            x: n.x, y: n.y + 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central',
            'font-size': 14, 'font-weight': 600, fill: col
          }, g2);
          mark.textContent = n.count;
        } else {
          mark = el('g', {
            transform: 'translate(' + (n.x - 8) + ',' + (n.y - 8) + ')',
            fill: 'none', stroke: col, 'stroke-width': 1.35,
            'stroke-linecap': 'round', 'stroke-linejoin': 'round'
          }, g2);
          PATHS[GLYPH[n.type]].forEach(function (d) { el('path', { d: d }, mark); });
        }

        var ty = n.y + R + G.gapLabel + 4;
        n.lines.forEach(function (line, i) {
          var t = el('text', { class: n.ghost ? 'lbl lbl-ghost' : 'lbl', x: n.x,
                               y: ty + i * G.lineH }, g2);
          t.textContent = line;
        });
        if (n.mark) {
          var mk = el('text', { class: 'lbl lbl-missing ghost', x: n.x,
                                y: ty + n.lines.length * G.lineH }, g2);
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
                              y: ty + (n.lines.length + (n.mark ? 1 : 0)) * G.lineH }, g2);
          tail.textContent = n.tail;
        }

        // The rect a keyboard focus is drawn as. It is inserted directly after the title, so it
        // sits behind the tile, the count stack and the label rather than over them, and it
        // carries no geometry until frameNode() measures one.
        var frame = el('rect', { class: 'focus-frame', rx: 7 });
        g2.insertBefore(frame, titleEl.nextSibling);

        g2.addEventListener('click', function (ev) { ev.stopPropagation(); onSelect(n.id); });
        g2.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onSelect(n.id); }
        });
        // Measured on focus, which is the only state that draws it. A tab arriving at a node this
        // has never measured would otherwise show an empty rect at the drawing's origin.
        //
        // A tab also brings the node onto the screen, and that is the viewport's job rather than
        // this file's, so it is handed out: on a canvas the reader can have left the node
        // anywhere, including off the plane's visible part, and a focus ring drawn where nobody
        // can see it is worse than none. Only for :focus-visible, which is the keyboard's own
        // state and is exactly the state that draws the ring; a mouse click does not match it and
        // is already handled by selection, which reveals the node it opens the panel for.
        g2.addEventListener('focus', function () {
          frameNode(gfxNode[n.id]);
          var vis = true;
          try { vis = g2.matches(':focus-visible'); } catch (err) { /* older engine: always */ }
          if (vis && onFocus) onFocus(n);
        });
        gfxNode[n.id] = { g: g2, tile: tile, mark: mark, col: col, count: !!n.count, frame: frame,
                          ghost: !!n.ghost, rest: tile.getAttribute('fill'), tail: tail };
      });
    }

    return {
      draw: draw,
      // The drawing on screen, which is what the viewport frames and the router describes. Taken
      // through a call rather than handed out once, because draw() replaces it.
      drawing: function () { return G; },
      tile: TILE,
      typeLabel: function (k) { return TLABEL[k]; },
      typeColor: function (k) { return COLOR[k]; },
      // The four tables the drawing was built into, taken fresh after every draw().
      gfx: function () {
        return { drawing: G, nodeById: nodeById, edgesOf: edgesOf,
                 gfxNode: gfxNode, gfxEdge: gfxEdge };
      }
    };
  };
})();
