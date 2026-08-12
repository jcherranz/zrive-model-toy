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
  // opts.capLink  called with a lane's NAME, returns {href, label} for a lane whose heading is a
  //               control and null for the rest. Issue 84. This file knows where a lane is and
  //               nothing about what a lane means, so what a heading opens is answered outside it.
  // opts.columns  the x of every column, across ALL seven drawings. Issue 100. A column's index
  //               is what decides whether an edge is a short hop or a long arc slung under the
  //               row, and a per-drawing index would shift on a view that holds no instructor.
  ZM.render = function createRender(opts) {
    var svg = opts.svg, canvas = opts.canvas;
    var onSelect = opts.onSelect, onFocus = opts.onFocus;
    var capLinkFor = opts.capLink;
    var COLUMNS = (opts.columns || []).slice().sort(function (a, b) { return a - b; });

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
    // Issue 100. CANON is the drawing the build wrote, which is the artefact check_build.sh
    // reproduces and drawingDigest is a digest of. WIN is the question the reader's time window
    // asks of a node, or null when there is no window. What is on screen is CANON when there is
    // no window and the transform of CANON below when there is one; either way it is G, so the
    // viewport frames what is painted and not what was generated.
    var CANON = null, WIN = null, WINFO = null;
    // Issue 84. The counter-scaled caption controls, and the last scale they were told about, so
    // that a repaint puts them back at the size the reader was already looking at rather than at
    // the size they were built with.
    var capBtns = [];
    var capK = 1;

    // ---- the lane heading as a control, issue 84 -------------------------------
    // HE CLICKED `all 25 session templates` AND EXPECTED THE OUTLINE, AND THE CAPTION AS DRAWN
    // COULD NOT BE THE TARGET. Measured on the deployed page at fit, that caption rendered
    // 39,4 by 3,0 CSS px: nine pixel type inside a drawing sitting at about a third, with the
    // canvas pan cursor over it and nothing listening. Issue 77 had just taken every interactive
    // control on this page to 26 by 26 from eleven of eleven failing WCAG 2.2 SC 2.5.8, so wiring
    // a click to that text would have put a three pixel target on a page that had finished
    // proving it had none.
    //
    // AND THE PART A REDESIGN HAS TO ANSWER IS NOT THE THREE PIXELS, IT IS THAT THEY MOVE. Every
    // other control here has a fixed screen size. A target that is 3px at fit and 30px zoomed in
    // is not a control, it is a coincidence. So the target is NOT the text. It is a rect inside a
    // group carrying `scale(1/k)`, where k is the view's own scale, which makes one unit inside
    // that group one CSS pixel at every zoom: the control is the same size on the reader's screen
    // fitted, at the far end of the zoom out and at eight times in.
    //
    // WIDTH IS `max(the lane on screen, CAP_MIN)` AND HEIGHT IS ALWAYS CAP_MIN. The lane is the
    // honest extent of the thing the caption is about, so at anything but the extreme zoom out
    // the target is exactly the lane. Below that the lane on screen is narrower than 24px and the
    // rect stops following it, which is the only way to hold the size the success criterion asks
    // for. The two lanes that carry a control are bands 1 and 3 with the instructors lane between
    // them, 356 units apart centre to centre, so at the smallest scale this canvas allows they
    // are 35,6px apart and two 26px targets still do not touch.
    //
    // IT DOES NOT FIGHT THE CANVAS. A press and drag over it is a pan exactly as it is over a
    // node, because viewport.js reads the gesture on the canvas and swallows the click a drag
    // leaves behind; this listens for the click, which a drag never produces. That is issue 46's
    // threshold doing its job for a second kind of target rather than a second mechanism.
    var CAP_MIN = 26;               // what issue 77 took every control on this page to
    var CAP_BELOW = 4;              // CSS px below the last baseline, so a descender is inside
    var CAP_ABOVE = 8;              // and enough over the top line to clear its ascender

    function addCapButton(parent, b) {
      var link = capLinkFor ? capLinkFor(b.key) : null;
      if (!link) return;
      var g = el('g', { class: 'capbtn', 'data-cap': b.key, tabindex: 0, role: 'link' }, parent);
      var title = el('title', {}, g);
      title.textContent = link.label;
      // Two rects. The hit area is transparent and is the target; the frame is what a hover or a
      // keyboard focus draws, on top of it, so the affordance is visible without a box being
      // painted over two of the six lane headings at rest.
      var hit = el('rect', { class: 'capbtn-hit' }, g);
      var frame = el('rect', { class: 'capbtn-frame', rx: 3 }, g);
      function go(ev) { ev.stopPropagation(); location.hash = link.href; }
      g.addEventListener('click', go);
      g.addEventListener('keydown', function (ev) {
        if (ev.key !== 'Enter' && ev.key !== ' ') return;
        ev.preventDefault();
        go(ev);
      });
      capBtns.push({ g: g, hit: hit, frame: frame, band: b });
      return g;
    }

    // Called by the viewport on every fit, zoom step, pinch and resize. At most two controls and
    // five attribute writes each, which is why it can be called on every frame of a pinch.
    //
    // THE TWO AXES ARE THE SAME RULE WITH A DIFFERENT NATURAL SIZE. Width follows the lane and
    // height follows the caption, because those are the honest extents of the thing the heading
    // is about; each is then held at CAP_MIN when the zoom takes it under, which is the only way
    // a target keeps a size the reader can hit. So at anything but the far end of the zoom out
    // the control is exactly the lane and exactly the caption block, and past that point it stops
    // shrinking. Zoomed in it grows with them, so the frame never sits inside its own text.
    function setCapScale(k) {
      capK = (k > 0 && isFinite(k)) ? k : 1;
      capBtns.forEach(function (c) {
        var lines = (c.band.lines || [c.band.label]).length;
        var capUnits = (lines - 1) * (G.capLineH || 11) + CAP_ABOVE + CAP_BELOW;
        var wpx = Math.max(CAP_MIN, c.band.w * capK);
        var hpx = Math.max(CAP_MIN, capUnits * capK);
        // Anchored on the LAST baseline, which is the line that sits the same distance above the
        // lane whatever the caption above it does, so a one line heading and a three line one are
        // the same control in the same place.
        c.g.setAttribute('transform',
          'translate(' + (c.band.x + c.band.w / 2) + ',' + (G.bandTop - (G.capGap || 7)) + ') ' +
          'scale(' + (1 / capK).toFixed(4) + ')');
        [c.hit, c.frame].forEach(function (r) {
          r.setAttribute('x', (-wpx / 2).toFixed(2));
          r.setAttribute('y', (CAP_BELOW - hpx).toFixed(2));
          r.setAttribute('width', wpx.toFixed(2));
          r.setAttribute('height', hpx.toFixed(2));
        });
      });
    }

    // ---- svg scaffolding -----------------------------------------------------
    // draw() takes its drawing as an argument and everything below reads it rather than reaching
    // for a global. That was written for the two cohort switch issue 42 removed, kept afterwards
    // when only one drawing was left, and is now what the seven programme routes run on: issue 66
    // added a caller and not a mechanism. The drawings are the same shape as each other and the
    // same shape as the one this function was written against, so nothing in here knows how many
    // there are, which one is on screen, or that the reader can change it.
    function paint(g) {
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
      capBtns = [];
      (G.bands || []).forEach(function (b) {
        // One group per lane, and issue 84 is why: the heading of two of them is a control, and
        // hovering the control has to light the words it is a target for. A group is what lets
        // the stylesheet say "the caption inside the lane whose control is hovered" without
        // JavaScript keeping a second copy of the hover state.
        var gLane = el('g', { class: 'lane' }, gBand);
        el('rect', { class: 'band', x: b.x, y: G.bandTop, width: b.w, height: G.h - G.bandTop - 4 },
           gLane);
        // A caption can run to more than one line, because a lane is only as wide as the columns
        // under it and a caption that has to say more has nowhere to go sideways. The lines are
        // stacked upwards from the top of the band, so the last one always sits the same
        // distance above the lane whatever the caption above it does. The build reserves the
        // headroom and refuses to write a drawing in which any one line is wider than its lane.
        var lines = b.lines || [b.label];
        lines.forEach(function (line, i) {
          var t = el('text', {
            // Issue 100. The last line of a filtered lane's caption is the count for the window
            // and not part of the lane's name, so it is marked and the stylesheet sets it apart
            // by case alone. Nothing about the first three lines changed.
            class: 'band-cap' + (b.winLine && i === lines.length - 1 ? ' cap-window' : ''),
            x: b.x + b.w / 2,
            y: G.bandTop - (G.capGap || 7) - (lines.length - 1 - i) * (G.capLineH || 11)
          }, gLane);
          t.textContent = line;
        });
        addCapButton(gLane, b);
      });
      setCapScale(capK);

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
        // Issue 100. `outside` is the third state a line can be in. A ghost is a relationship the
        // business does not record; an outside line is a relationship that IS recorded and whose
        // far end the reader's window took off the picture, and the two are painted alike on
        // purpose, quiet and dashed, because both mean "there is something here you are not
        // looking at". They are separate classes because they answer to different controls: the
        // ghosts toggle withdraws a ghost and must never withdraw the line that says how much of
        // the term is off screen.
        var eq = e.ghost ? 'ghost' : (e.outside ? 'outside' : null);
        var g2 = el('g', { 'data-edge': key, class: eq }, gEdge);
        if (e.note) el('title', {}, g2).textContent = e.note;
        el('path', { d: e.d,
                     class: e.ghost ? 'edge edge-ghost' : (e.outside ? 'edge edge-outside'
                                                                     : 'edge') }, g2);
        el('path', {
          d: 'M0 0 L-6.5 2.6 L-6.5 -2.6 Z',
          class: e.ghost ? 'arrow arrow-ghost' : (e.outside ? 'arrow arrow-outside' : 'arrow'),
          transform: 'translate(' + e.ax + ',' + e.ay + ') rotate(' + e.aa + ')'
        }, g2);

        var c = el('g', { 'data-edge': key, class: eq }, gChip);
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
        // Issue 100. An OUTSIDE tile is a sentence about this picture and not an object in the
        // model: it stands for the nodes the reader's window took out of this lane. So it is not
        // a target. It carries no `data-node`, takes no tab stop, opens no panel, and its own key
        // goes on `data-outside`, because a capture that named it as a node would be reporting an
        // id the instance document has never heard of. That is the same line `lbl-tail` is on:
        // drawn by this file, said about the drawing, absent from the model.
        var out = !!n.outside;
        // data-node is the instance key. It is what feedback.js reads to say which node a click
        // landed on, the way monetary-lab's capture reads its own linked-highlight key.
        var g2 = el('g', { class: n.ghost ? 'node ghost' : (out ? 'node outside' : 'node'),
                           'data-node': out ? null : n.id,
                           'data-outside': out ? n.id : null,
                           tabindex: out ? null : 0,
                           role: out ? null : 'button' }, gNode);
        var titleEl = el('title', {}, g2);
        titleEl.textContent = n.title || (n.label + ' (' + TLABEL[n.type] + ')');

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
        //
        // WHICH IS WHY IT IS --bg-band AND NOT --bg-panel. Those were one token until issue 81
        // softened the lanes, and the sentence above is the whole reason this one has to follow:
        // the backdrop is not "the page's plate colour", it is "whatever the lane under this
        // tile is painted with". Left on --bg-panel it would have drawn a brighter square behind
        // every stacked tile on a softened lane, which is a defect this comment already
        // describes the repair of.
        if (n.count) {
          el('rect', { x: n.x - R + 5, y: n.y - R - 5, width: TILE, height: TILE,
                       rx: 6, fill: tint(col, 10), stroke: tint(col, 45) }, g2);
          el('rect', { x: n.x - R + 2.5, y: n.y - R - 2.5, width: TILE, height: TILE,
                       rx: 6, fill: tint(col, 12), stroke: tint(col, 60) }, g2);
          el('rect', { x: n.x - R, y: n.y - R, width: TILE, height: TILE, rx: 6,
                       fill: 'var(--bg-band)', stroke: 'none' }, g2);
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
          fill: tint(col, (n.ghost || out) ? 7 : 14), stroke: col
        }, g2);

        var mark;
        if (n.ghost || out) {
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
          var t = el('text', { class: n.ghost ? 'lbl lbl-ghost'
                                              : (out ? 'lbl lbl-outside' : 'lbl'),
                               x: n.x, y: ty + i * G.lineH }, g2);
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

        if (!out) {
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
        }
        gfxNode[n.id] = { g: g2, tile: tile, mark: mark, col: col, count: !!n.count, frame: frame,
                          ghost: !!n.ghost, outside: out,
                          rest: tile.getAttribute('fill'), tail: tail };
      });
    }

    // =============================================================================================
    // THE FILTERED DRAWING, ISSUE 100
    // =============================================================================================
    // HE OVERRULED THE DESIGN AND HE WAS RIGHT. Issue 90 shipped the window as a DIM: every tile
    // stayed where the build put it and the ones outside the window went to 16 per cent. The
    // argument for it is three paragraphs up in the history of this file and it was an argument
    // about a gate, not about a drawing: the layout is generated at build time, layout.js carries
    // a drawingDigest, scripts/check_build.sh refuses anything a rebuild does not reproduce, and a
    // continuous window over twenty four weeks cannot be precomputed. So the window was answered
    // with a class, which cost the gate nothing and left a reader of Z-BL looking at three lit
    // tiles inside a 2578px column of quiet ones. He filed #100 from `#graph`: "The whole poitn of
    // this filter is to just render the diagram of those weeks". Protecting a gate is not a reason
    // to draw a worse picture.
    //
    // WHAT THE GATE PROTECTED IS UNTOUCHED, AND THAT IS THE WHOLE OF THE ARCHITECTURE HERE. The
    // canonical drawing is still generated by build/build_layout.py, still shipped in layout.js,
    // still digested, and check_build.sh still refuses a rebuild that does not reproduce it byte
    // for byte. Nothing below writes a file, and nothing below is in the digest's scope. The
    // filtered drawing is a RUN TIME TRANSFORM of that canonical artefact, computed from it in the
    // browser and thrown away when the window moves.
    //
    // WHICH MEANS THE FILTERED DRAWING HAS NO BUILD GATE AND MUST EARN ITS OWN. It does, in
    // scripts/smoke.mjs, and the load bearing assertion is `reflowCheck()` at the foot of this
    // file: reflowing the FULL node set with no filter reproduces the canonical coordinates, every
    // node and every edge, to within the tenth of a unit layout.js rounds to. If that holds then
    // the four constants below are the build's own and this transform is the build's own pack()
    // and the build's own arcs, so the filtered drawing differs from the canonical one only by
    // what the reader asked to take out of it. If somebody retunes pack() in the build and not
    // here, that assertion goes red and names the drift. It is the only thing standing where the
    // build gate does not reach, and the CHANGELOG says so in as many words.
    //
    // THE RESTACK IS ONE DIMENSIONAL AND DELIBERATELY NOT GRAPH LAYOUT. Bands are vertical columns
    // at a fixed x, tiles stacked down them. Filtering removes tiles from columns; the honest
    // repair is to close the gaps in each column and leave x alone. No barycentre sweep, no
    // reordering: the canonical drawing already decided which tile belongs above which, and a
    // second opinion about that at run time would make the picture jump for a reason the reader
    // did not ask for.
    //
    // TWO OF THE FOUR NUMBERS pack() NEEDS ARE READ OFF THE CANONICAL DRAWING RATHER THAN COPIED
    // FROM THE BUILD, because they are visible in it: the closest two tiles in any column ever sit
    // is MIN_GAP, and the top of the highest tile is the top margin. The two that cannot be read
    // off it are here, and the faithfulness check is what keeps them honest.
    var SPREAD = 0.42, SPREAD_FROM = 4;
    // The arcs, which are the build's, for the same reason and under the same check.
    var DIP = 132, CTRL_MIN = 28, CTRL_FRAC = 0.45;
    // The verb chips. A chip is anchored to the arc-length midpoint of its own line and slides
    // along the line before it ever steps off it, which is build_layout.py's rule and its reason:
    // a chip that has moved along its line still says which line it names.
    var CH = 13, PADX = 5, CHIP_SLIDE = 0.34, CHIP_STEP = 4, CHIP_PERP = 6;
    var W_OVER = 20, W_PERP = 3, ARC_N = 96;
    // What the drawing keeps under its lowest tile and under its lowest chip.
    var FOOT = 14, CHIP_FOOT = 26;

    function r1(v) { return Math.round(v * 10) / 10; }
    function f1(v) { return r1(v).toFixed(1); }

    // Which column an x is. Nearest rather than exact, because a drawing rounds its coordinates
    // and a strict lookup would fail on the tenth of a unit.
    function colOf(x) {
      var best = 0, bd = Infinity, i, d;
      for (i = 0; i < COLUMNS.length; i++) {
        d = Math.abs(COLUMNS[i] - x);
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    }

    // The height of a node's whole box, tile plus the label under it, which is what the build
    // packs with. A node's y is the centre of its TILE, so the box runs from y - tile/2 down.
    function boxH(g, n) {
      var nl = n.lines.length + (n.mark ? 1 : 0) + (n.tail ? 1 : 0);
      return g.tile + g.gapLabel + g.lineH * nl;
    }

    function byColumn(g, nodes) {
      var cols = [];
      nodes.forEach(function (n) {
        var c = colOf(n.x);
        (cols[c] || (cols[c] = [])).push(n);
      });
      return cols;
    }

    // MIN_GAP, read off the artefact: the closest two boxes in any column of this drawing sit.
    // Rounded, because layout.js rounds its coordinates to a tenth and the gap inherits it.
    function pitchOf(g) {
      var gap = Infinity;
      byColumn(g, g.nodes).forEach(function (list) {
        var s = list.slice().sort(function (a, b) { return a.y - b.y; }), i;
        for (i = 1; i < s.length; i++) gap = Math.min(gap, s[i].y - s[i - 1].y - boxH(g, s[i - 1]));
      });
      return isFinite(gap) ? Math.round(gap) : 26;
    }

    function topOf(g) {
      var t = Infinity;
      g.nodes.forEach(function (n) { t = Math.min(t, n.y - g.tile / 2); });
      return t;
    }

    // build_layout.py's pack(), one column at a time, vertically centred, honouring the gap. The
    // spread on the short right hand columns is here for the reason it is there: without it the
    // enrolment chain reads as a small clump adrift in a tall empty lane.
    function place(g, nodes, gap0, top) {
      var cols = byColumn(g, nodes), H = 0, at = {};
      // Down each column in the order the canonical drawing stacked them. That order is the whole
      // of what this transform inherits from the build's thirty barycentre sweeps, and re-deriving
      // it here would be the general graph layout this deliberately is not. An outside tile comes
      // in with no y and sorts to the foot of its own lane, which is where a count of what is not
      // shown belongs.
      cols.forEach(function (list) { list.sort(function (a, b) { return a.y - b.y; }); });
      cols.forEach(function (list) {
        var hs = 0;
        list.forEach(function (n) { hs += boxH(g, n); });
        H = Math.max(H, hs + gap0 * (list.length - 1));
      });
      cols.forEach(function (list, c) {
        var k = list.length, hs = 0, gap = gap0, y;
        list.forEach(function (n) { hs += boxH(g, n); });
        if (k > 1 && k < 4 && c >= SPREAD_FROM) gap = Math.max(gap0, (SPREAD * H - hs) / (k - 1));
        y = (H - (hs + gap * (k - 1))) / 2;
        list.forEach(function (n) {
          var h = boxH(g, n);
          at[n.id] = y + h / 2 - (h - g.tile) / 2;
          y += h + gap;
        });
      });
      var lift = Infinity;
      nodes.forEach(function (n) { lift = Math.min(lift, at[n.id] - g.tile / 2); });
      nodes.forEach(function (n) { at[n.id] = r1(at[n.id] + top - lift); });
      return at;
    }

    // build_layout.py's two edge shapes. Three columns or more apart is a local arc slung under
    // the row it connects; anything closer is a hop from one tile's edge to the next.
    function edgeGeom(g, a, b) {
      var span = Math.abs(b.col - a.col);
      var L = a.col <= b.col ? a : b, R = a.col <= b.col ? b : a;
      var p0, p1, p2, p3, dx;
      if (span >= 3) {
        p0 = [L.x, L.y + g.tile / 2]; p3 = [R.x, R.y + g.tile / 2];
        p1 = [p0[0], p0[1] + DIP]; p2 = [p3[0], p3[1] + DIP];
      } else {
        p0 = [L.x + g.tile / 2, L.y]; p3 = [R.x - g.tile / 2, R.y];
        dx = Math.max(CTRL_MIN, (p3[0] - p0[0]) * CTRL_FRAC);
        p1 = [p0[0] + dx, p0[1]]; p2 = [p3[0] - dx, p3[1]];
      }
      var rev = b.col < a.col;
      var tip = rev ? p0 : p3, ctl = rev ? p1 : p2;
      return {
        pts: [p0, p1, p2, p3], span: span, rev: rev,
        d: 'M ' + f1(p0[0]) + ' ' + f1(p0[1]) + ' C ' + f1(p1[0]) + ' ' + f1(p1[1]) + ' ' +
           f1(p2[0]) + ' ' + f1(p2[1]) + ' ' + f1(p3[0]) + ' ' + f1(p3[1]),
        ax: r1(tip[0]), ay: r1(tip[1]),
        aa: r1(Math.atan2(tip[1] - ctl[1], tip[0] - ctl[0]) * 180 / Math.PI)
      };
    }

    function bezAt(p, t) {
      var u = 1 - t;
      return [u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] +
              t * t * t * p[3][0],
              u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] +
              t * t * t * p[3][1]];
    }

    function arcTable(pts) {
      var xs = [], cum = [0], i;
      for (i = 0; i <= ARC_N; i++) xs.push(bezAt(pts, i / ARC_N));
      for (i = 1; i <= ARC_N; i++) {
        cum.push(cum[i - 1] + Math.hypot(xs[i][0] - xs[i - 1][0], xs[i][1] - xs[i - 1][1]));
      }
      return { xs: xs, cum: cum };
    }

    function atS(tab, s) {
      var cum = tab.cum, xs = tab.xs, lo = 1, hi = cum.length - 1, mid;
      s = Math.min(Math.max(s, 0), cum[cum.length - 1]);
      while (lo < hi) {
        mid = (lo + hi) >> 1;
        if (cum[mid] < s) lo = mid + 1; else hi = mid;
      }
      var seg = (cum[lo] - cum[lo - 1]) || 1e-9;
      var f = (s - cum[lo - 1]) / seg;
      var a = xs[lo - 1], b = xs[lo];
      var tx = b[0] - a[0], ty = b[1] - a[1], m = Math.hypot(tx, ty) || 1e-9;
      return { p: [a[0] + f * tx, a[1] + f * ty], t: [tx / m, ty / m] };
    }

    function overlapDepth(x, y, w, boxes) {
      var tot = 0, i, b, ox, oy;
      for (i = 0; i < boxes.length; i++) {
        b = boxes[i];
        ox = (w + b[2]) / 2 - Math.abs(x - b[0]);
        oy = (CH + b[3]) / 2 - Math.abs(y - b[1]);
        if (ox > 0 && oy > 0) tot += Math.min(ox, oy);
      }
      return tot;
    }

    // ---- measuring, because a width nobody measured is a width that leaves its lane -----------
    // The build measures its text against a table of glyph advances generated from the real font.
    // The browser has the real font, so this asks it. Cached by string, class and weight, so the
    // second window costs nothing, and batched inside one hidden group so a wrap costs one layout
    // rather than one per candidate line.
    var TW = {};

    function measure(items) {
      var want = items.filter(function (it) { return TW[it.k] === undefined; });
      if (!want.length) return;
      var host = el('g', { visibility: 'hidden', 'aria-hidden': 'true' }, svg);
      var made = want.map(function (it) {
        var t = el('text', { class: it.cls, 'font-weight': it.w || null,
                             'font-style': it.i ? 'italic' : null }, host);
        t.textContent = it.s;
        return t;
      });
      made.forEach(function (t, i) { TW[want[i].k] = t.getComputedTextLength(); });
      svg.removeChild(host);
    }

    function widthOf(s, cls, w, i) {
      var k = cls + '|' + (w || '') + '|' + (i ? 'i' : '') + '|' + s;
      if (TW[k] === undefined) measure([{ k: k, s: s, cls: cls, w: w, i: i }]);
      return TW[k];
    }

    // Greedy wrap to a width, which is the build's rule too. One word at a time so the candidate
    // lines are measured and not estimated.
    function wrapTo(s, maxw, cls) {
      var words = String(s).split(/\s+/), lines = [], cur = '';
      words.forEach(function (word) {
        var t = cur ? cur + ' ' + word : word;
        if (cur && widthOf(t, cls, null, false) > maxw) { lines.push(cur); cur = word; }
        else cur = t;
      });
      if (cur) lines.push(cur);
      return lines;
    }

    // How wide a label in this column may be before it crosses its lane, which is the build's own
    // lane_slack read backwards off the bands the drawing ships.
    function laneRoom(g, x) {
      var room = null;
      (g.bands || []).forEach(function (b) {
        if (x < b.x || x > b.x + b.w) return;
        room = 2 * Math.min(x - b.x, b.x + b.w - x) - 8;
      });
      return room === null ? 120 : room;
    }

    // ---- the transform itself -----------------------------------------------------------------
    // WHAT AN EDGE WITH A FILTERED ENDPOINT DOES, WHICH IS THE HARD PART OF THIS CARD. It does not
    // vanish. A drawing that quietly drops a line is a management tool that has started lying: the
    // reader cannot tell filtered from absent, and absent is the more interesting of the two on a
    // page whose whole subject is what the business does and does not record.
    //
    // So every lane that loses tiles gains ONE tile reading "N outside this window", and every
    // edge whose far end was taken out terminates on it. Edges that would then run in parallel are
    // folded into one line per surviving node per verb, because twenty four separate lines into
    // one tile is not a picture, and the fold carries the count it stands for in its own <title>.
    // An edge with BOTH ends outside the window is folded into a single line between the two
    // outside tiles, so no relationship in the model goes unrepresented; the only ones that cannot
    // be drawn are the ones whose two ends are in the same lane, and those are counted and
    // reported rather than dropped in silence.
    //
    // THE VERB ON A FOLDED EDGE IS THE ORIGINAL VERB, UNCHANGED, and that is load bearing rather
    // than tidy. selection.js's reveal table is keyed by verb: 'employed by' is what tells it to
    // keep an employer off the page until its instructor is clicked. A folded edge reading
    // 'employed by, 3' would match no rule, and the drawing would grow a line pointing into an
    // empty lane. The count lives in the tile, in the lane caption and in the line's own title.
    //
    // AND THE CASCADE IS WHAT MAKES IT A BETTER PICTURE RATHER THAN A HOLED ONE. A session template
    // whose only session the window took out has nothing left to be a template of, so it goes too,
    // and so does the instructor who teaches none of what is left, and the employer of that
    // instructor. It is what he meant by "just show the selected sessions, etc."
    //
    // THE RULE IS NOT "DROP WHAT IS LEFT WITH NO EDGES", WHICH WAS THE FIRST TRY AND WAS WRONG.
    // Every session template on Z-BL is also joined to the programme, and the programme stays, so
    // no template was ever left with nothing attached and twenty five of the twenty eight sat
    // there with their sessions gone. The rule that works names what the window has an OPINION
    // about and spreads outward from it: a node is dropped when every neighbour the window has an
    // opinion about is dropped, and it is joined to at least one such. A node with a live one is
    // kept AND becomes a node the window now has an opinion about, so being kept spreads exactly
    // as being dropped does. That last half is what saves the employer of an instructor who is
    // still teaching this week: without it the employer would see only its dropped instructors and
    // die of them.
    //
    // ON AN EMPTY WEEK IT DEGENERATES, AND THAT IS THE RIGHT ANSWER RATHER THAN A HOLE IN IT. The
    // term has gaps in April and May, so a one week window can cover no session at all; the
    // cascade then reaches everything and the drawing is six lanes each saying how much of itself
    // is outside the window, which is a true picture of that week. The programme's own name and
    // its cohort are chrome and are described from the canonical drawing, so the header does not
    // empty with the lanes.
    function filtered(g, spec) {
      var i, gone = {}, gov = {}, adj = {};
      g.nodes.forEach(function (n) { adj[n.id] = []; });
      g.edges.forEach(function (e) { adj[e.s].push(e.t); adj[e.t].push(e.s); });
      g.nodes.forEach(function (n) {
        if (!spec.governs(n)) return;
        gov[n.id] = true;
        if (spec.out(n)) gone[n.id] = true;
      });
      for (i = 0; i < g.nodes.length + 2; i++) {
        var again = false;
        g.nodes.forEach(function (n) {
          if (gov[n.id]) return;
          var seen = 0, live = 0;
          adj[n.id].forEach(function (m) {
            if (!gov[m]) return;
            seen++;
            if (!gone[m]) live++;
          });
          if (!seen) return;
          gov[n.id] = true;
          again = true;
          if (!live) gone[n.id] = true;
        });
        if (!again) break;
      }

      var keep = g.nodes.filter(function (n) { return !gone[n.id]; });
      var hidden = g.nodes.filter(function (n) { return gone[n.id]; });

      // One outside tile per column that lost something, in that column's own x.
      var lost = {}, tiles = {}, marks = [];
      hidden.forEach(function (n) {
        var c = colOf(n.x);
        lost[c] = (lost[c] || 0) + 1;
      });
      Object.keys(lost).forEach(function (c) {
        var x = COLUMNS[Number(c)];
        var n = lost[c];
        var label = n + (n === 1 ? ' tile outside' : ' tiles outside') + ' this window';
        var node = {
          id: '__outside_' + c, type: 'Ghost', outside: true, count: null, props: [],
          label: label, lines: wrapTo(label, laneRoom(g, x), 'lbl'), x: x, y: Infinity,
          title: label + '. Move or widen the window to bring them back',
          'class': 'outside-window'
        };
        tiles[c] = node;
        marks.push(node);
      });
      // The outside tiles sit at the foot of their own lane, after everything that stayed.
      var nodes = keep.concat(marks);

      var gap = pitchOf(g);
      // One more caption line on every lane, so the top margin and the plate both move down by
      // exactly one line. The build reserves headroom for three; this is the fourth.
      var extra = g.capLineH || 11;
      var bandTop = g.bandTop + extra;
      var at = place(g, nodes, gap, topOf(g) + extra);
      var pos = {};
      nodes.forEach(function (n) { pos[n.id] = { x: n.x, y: at[n.id], col: colOf(n.x) }; });

      // ---- the edges, three kinds ---------------------------------------------------
      var out = [], folds = {}, sameLane = 0;
      function fold(sId, tId, e) {
        var k = sId + ' ' + tId + ' ' + e.v + ' ' + (e.ghost ? 'g' : '');
        var f = folds[k];
        if (f) { f.n++; return; }
        folds[k] = { s: sId, t: tId, e: e, n: 1 };
        out.push(folds[k]);
      }
      g.edges.forEach(function (e) {
        var ds = !!gone[e.s], dt = !!gone[e.t];
        if (!ds && !dt) { out.push({ s: e.s, t: e.t, e: e, n: 1, keep: true }); return; }
        var sId = ds ? '__outside_' + colOf(nodeAt(g, e.s).x) : e.s;
        var tId = dt ? '__outside_' + colOf(nodeAt(g, e.t).x) : e.t;
        if (sId === tId) { sameLane++; return; }
        fold(sId, tId, e);
      });

      var edges = out.map(function (r) {
        var geo = edgeGeom(g, pos[r.s], pos[r.t]);
        var e = { s: r.s, t: r.t, v: r.e.v, ghost: r.e.ghost || null,
                  d: geo.d, rev: geo.rev, ax: geo.ax, ay: geo.ay, aa: geo.aa };
        if (!r.keep) {
          e.outside = true;
          e.ghost = null;
          e.note = r.e.v + ', ' + r.n +
                   (r.n === 1 ? ' relationship' : ' relationships') + ' outside this window';
        }
        e.pts = geo.pts;
        e.span = geo.span;
        return e;
      });

      // ---- the verb chips -----------------------------------------------------------
      var blocked = [];
      nodes.forEach(function (n) {
        var h = boxH(g, n), lw = 0, y = pos[n.id].y;
        n.lines.forEach(function (ln) {
          lw = Math.max(lw, widthOf(ln, 'lbl', 600, !!n.ghost));
        });
        if (n.mark) lw = Math.max(lw, widthOf(n.mark, 'lbl', null, false));
        if (n.tail) lw = Math.max(lw, widthOf(n.tail, 'lbl', null, false));
        blocked.push([n.x, y, g.tile + 6, g.tile + 6]);
        var labH = h - g.tile - g.gapLabel;
        blocked.push([n.x, y + g.tile / 2 + g.gapLabel + labH / 2, lw + 6, labH + 2]);
      });
      var chips = [];
      edges.slice().sort(function (a, b) {
        return (b.span - a.span) || (a.s < b.s ? -1 : a.s > b.s ? 1 : 0);
      }).forEach(function (e) {
        e.cw = r1(widthOf(e.v, 'chip-tx', null, !!e.ghost) + 2 * PADX);
        var tab = arcTable(e.pts), L = tab.cum[tab.cum.length - 1];
        var reach = CHIP_SLIDE * L, best = null, bestCost = null, k = 1;
        var slides = [0];
        while (k * CHIP_STEP <= reach) { slides.push(k * CHIP_STEP, -k * CHIP_STEP); k++; }
        slides.some(function (ds) {
          var s = atS(tab, L / 2 + ds);
          [0, CHIP_PERP / 2, -CHIP_PERP / 2, CHIP_PERP, -CHIP_PERP].forEach(function (perp) {
            var x = s.p[0] - s.t[1] * perp, y = s.p[1] + s.t[0] * perp;
            var cost = W_OVER * overlapDepth(x, y, e.cw + 4, blocked.concat(chips)) +
                       Math.abs(ds) + W_PERP * Math.abs(perp);
            if (bestCost === null || cost < bestCost) { best = [x, y]; bestCost = cost; }
          });
          return bestCost === 0 && ds === 0;
        });
        e.cx = r1(best[0]); e.cy = r1(best[1]);
        chips.push([e.cx, e.cy, e.cw + 4, CH]);
      });

      // ---- the extent, and the lane captions -----------------------------------------
      var h = 0;
      nodes.forEach(function (n) { h = Math.max(h, pos[n.id].y - g.tile / 2 + boxH(g, n) + FOOT); });
      edges.forEach(function (e) {
        h = Math.max(h, e.cy + CHIP_FOOT);
        if (e.span >= 3) h = Math.max(h, bezAt(e.pts, 0.5)[1] + CHIP_FOOT);
      });
      edges.forEach(function (e) { delete e.pts; delete e.span; });

      // KEEPING THE COUNT VISIBLE, which is the other half of what this card asked for. A filter
      // that loses the number is the same failure as an aggregate that loses it, so every lane
      // says what it is showing of what it had, in the idiom #83 set for the captions above it.
      // The line is added to EVERY lane and not only the ones that lost something, because "6 of 6
      // in this window" is a claim and a lane with no fourth line would read as a lane nobody
      // counted.
      var lanes = [], bands = (g.bands || []).map(function (b) {
        var was = 0, now = 0;
        g.nodes.forEach(function (n) { if (n.x >= b.x && n.x <= b.x + b.w) was++; });
        keep.forEach(function (n) { if (n.x >= b.x && n.x <= b.x + b.w) now++; });
        var line = now + ' of ' + was + ' in this window';
        if (widthOf(line, 'band-cap', null, false) > b.w - 4) line = now + ' of ' + was + ' shown';
        lanes.push({ key: b.key, shown: now, of: was });
        var copy = { key: b.key, x: b.x, w: b.w, winLine: true,
                     lines: (b.lines || [b.label]).concat([line]) };
        copy.label = copy.lines.join(' ');
        return copy;
      });

      WINFO = {
        on: true, hidden: hidden.map(function (n) { return n.id; }),
        shown: keep.map(function (n) { return n.id; }),
        outside: marks.map(function (n) { return { id: n.id, label: n.label }; }),
        lanes: lanes, foldedEdges: edges.filter(function (e) { return e.outside; }).length,
        sameLane: sameLane, canonNodes: g.nodes.length, canonEdges: g.edges.length,
        digest: g.drawingDigest || 'unknown'
      };

      var d = {};
      Object.keys(g).forEach(function (k) { d[k] = g[k]; });
      d.nodes = nodes.map(function (n) {
        var c = {}, k;
        for (k in n) if (Object.prototype.hasOwnProperty.call(n, k)) c[k] = n[k];
        c.y = pos[n.id].y;
        return c;
      });
      d.edges = edges;
      d.bands = bands;
      d.bandTop = bandTop;
      d.h = Math.round(h);
      d.filteredFrom = g;
      return d;
    }

    function nodeAt(g, id) {
      var found = null;
      g.nodes.forEach(function (n) { if (n.id === id) found = n; });
      return found;
    }

    function repaint() {
      if (!CANON) return;
      if (!WIN) {
        WINFO = { on: false, hidden: [], shown: CANON.nodes.map(function (n) { return n.id; }),
                  outside: [], foldedEdges: 0, sameLane: 0,
                  canonNodes: CANON.nodes.length, canonEdges: CANON.edges.length,
                  digest: CANON.drawingDigest || 'unknown',
                  lanes: (CANON.bands || []).map(function (b) {
                    var n = 0;
                    CANON.nodes.forEach(function (x) {
                      if (x.x >= b.x && x.x <= b.x + b.w) n++;
                    });
                    return { key: b.key, shown: n, of: n };
                  }) };
        paint(CANON);
        return;
      }
      paint(filtered(CANON, WIN));
    }

    // THE ONE THING THE BUILD GATE CANNOT SAY ABOUT THIS FEATURE, said here so a driver can read
    // it off the running page. Reflow the FULL node set with no filter and compare against the
    // canonical coordinates the build wrote: `dy` is the worst node, `dp` the worst control point
    // on any arc, `arrows` the worst arrowhead, `rev` a count of edges whose direction came out
    // the other way. All four are zero to within layout.js's own rounding, and staying zero is
    // what makes the filtered drawing above the build's own geometry with tiles taken out.
    function faithful(g) {
      if (!g) return null;
      var gap = pitchOf(g);
      var at = place(g, g.nodes, gap, topOf(g));
      var pos = {}, dy = 0, dp = 0, arrows = 0, rev = 0;
      g.nodes.forEach(function (n) {
        dy = Math.max(dy, Math.abs(at[n.id] - n.y));
        pos[n.id] = { x: n.x, y: at[n.id], col: colOf(n.x) };
      });
      g.edges.forEach(function (e) {
        var geo = edgeGeom(g, pos[e.s], pos[e.t]);
        var a = geo.d.match(/-?\d+(\.\d+)?/g).map(Number);
        var b = String(e.d).match(/-?\d+(\.\d+)?/g).map(Number);
        var i;
        if (a.length !== b.length) { dp = Infinity; return; }
        for (i = 0; i < a.length; i++) dp = Math.max(dp, Math.abs(a[i] - b[i]));
        arrows = Math.max(arrows, Math.abs(geo.ax - e.ax), Math.abs(geo.ay - e.ay),
                          Math.abs(geo.aa - e.aa));
        if (geo.rev !== !!e.rev) rev++;
      });
      return { nodes: g.nodes.length, edges: g.edges.length, gap: gap,
               dy: r1(dy * 1000) / 1000, dp: r1(dp * 1000) / 1000,
               arrows: r1(arrows * 1000) / 1000, rev: rev };
    }

    return {
      // The canonical drawing goes in and whatever the window leaves of it comes out on screen.
      draw: function (g) { CANON = g; repaint(); },
      // Issue 84. The one thing the viewport tells this file. Everything else about the view is
      // the viewport's and stays there; a control that has to be the same size on screen at every
      // zoom is the one thing painted here that cannot be painted without knowing the scale.
      setCapScale: setCapScale,
      // Issues 90 and 100. The other thing this file is told from outside, and it is a question
      // rather than a list of ids: ids are per drawing and the window is not, so a list would have
      // to be rebuilt on every route change by whoever holds it. `null` takes the window off.
      // Returns true when the drawing on screen was rebuilt, which is the wiring's cue to rebind
      // the selection to handles that no longer exist and to refit a drawing that changed height.
      setWindow: function (spec) {
        var was = WIN;
        WIN = (spec && typeof spec.out === 'function') ? spec : null;
        if (!was && !WIN) return false;
        repaint();
        return true;
      },
      // What the window did to the drawing, for a driver, because "the window filters the picture"
      // is a claim about the running page and not about a screenshot of 39 near identical tiles.
      // Read off the transform rather than off the painted classes, since after this card there is
      // nothing painted to read: what is not in the window is not in the document.
      windowState: function () { return WINFO; },
      reflowCheck: function () { return faithful(CANON); },
      // The canonical drawing, as the build wrote it, whatever the window is doing. The digest
      // belongs to THIS and not to what is on screen, which is why a capture filed off a filtered
      // drawing has to say so rather than quoting a digest of a picture nobody is looking at.
      canonical: function () { return CANON; },
      capButtons: function () { return capBtns.map(function (c) { return c.g; }); },
      // The drawing on screen, which is what the viewport frames and the router describes. Taken
      // through a call rather than handed out once, because draw() replaces it.
      drawing: function () { return G; },
      tile: TILE,
      typeLabel: function (k) { return TLABEL[k]; },
      // The two paints a swatch of a type is drawn with, and THERE IS DELIBERATELY NO
      // `typeColor` BESIDE IT ANY MORE. Issue 69.
      //
      // What was here handed `var(--type-<k>)` out to whoever asked, and the one caller wrote it
      // into `#ptype.style.color`, which is 11px bold uppercase text. A token chosen to clear the
      // 3:1 that SC 1.4.11 asks of a drawn boundary was therefore also answering the 4.5:1 that
      // SC 1.4.3 asks of text, and the higher of the two bars propagated back into the palette:
      // issues 56 and 65 both aimed at 4,5 rather than at 3,0 for exactly this reason, and #65
      // recorded that decoupling this label would have made two of its own darkenings
      // unnecessary. One token cannot serve two thresholds without the stricter one deciding the
      // colour of things it is not about.
      //
      // Withdrawing the export is the repair rather than a note asking the caller to be careful.
      // The panel is now handed no expression it could paint text with: what it gets is a fill
      // and a stroke for a nine pixel box, which is a graphical object under SC 1.4.11 and is the
      // bar the palette was actually chosen against. A future panel that wanted to colour a word
      // by type would have to add an export back and argue for it here, which is the argument
      // that never happened the first time.
      //
      // The two values are the tile's own and not a third opinion about them: the same `tint()`
      // at the same strengths the drawing paints with, seven per cent for a ghost against every
      // other tile's fourteen, so a swatch is the tile made small rather than a second rendering
      // of the same idea that can drift from it.
      typeSwatch: function (k, ghost) {
        return { fill: tint(COLOR[k], ghost ? 7 : 14), stroke: COLOR[k] };
      },
      // The four tables the drawing was built into, taken fresh after every draw().
      gfx: function () {
        return { drawing: G, nodeById: nodeById, edgesOf: edgesOf,
                 gfxNode: gfxNode, gfxEdge: gfxEdge };
      }
    };
  };
})();
