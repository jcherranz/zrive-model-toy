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
                'M4.7 7.8v3c0 .9 1.5 1.6 3.3 1.6s3.3-.7 3.3-1.6v-3'],
    // Issue 89's two aggregates, each drawn as its member's glyph with one more of the same
    // behind it. A Module is session templates, so it is the document glyph over a second sheet;
    // a Module delivery is cohort sessions, so it is the calendar glyph over a second frame. The
    // relation is the drawing's own, said in line work: neither is a new symbol to learn.
    //
    // A TILE STANDING FOR MORE THAN ONE DRAWS ITS COUNT INSTEAD, which is the students card's
    // idiom since #41 and is what these tiles mostly show. The glyph is what a module holding
    // exactly one session template gets, and it is the case the five sampled routes are full of.
    modules:   ['M6 4h4.5l2.5 2.5V14H6z', 'M10.5 4v2.5H13', 'M3.2 11.8V2.2h4.6'],
    moduleruns: ['M5.4 5.6h8.6v8.4H5.4z', 'M5.4 8.4h8.6', 'M7.8 3.6v2.6', 'M11.6 3.6v2.6',
                 'M2.6 11.6V3.4h2']
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
    // ---- and the programme hue, issue 136 --------------------------------------
    // ONE HUE PER PROGRAMME, GENERATED FROM THE LIST AND NOT TYPED ANYWHERE. It is the only
    // visual addition the union makes, it is painted on nothing while one programme is drawn,
    // and it exists because a session tile in a merged drawing has to say which of the seven it
    // belongs to without a second label under it.
    //
    // WHY IT IS NOT A COLOUR PER PROGRAMME IN THE MODEL. The thirteen type colours above are the
    // model's, chosen against a contrast bar and shipped in build/model.py, and a programme is
    // not a type: adding an eighth programme would then mean choosing a colour for it by hand.
    // These are a rotation over the number of programmes the document holds, so the set is a
    // function of the list and an eighth programme re-spaces the seven rather than needing a
    // decision. The lightness is fixed per scheme, and it is the one number here that was
    // measured rather than picked: the bar is a graphical object drawn over the tile's own wash
    // over the lane plate, and scripts/smoke.mjs recomputes every one of them against that
    // composite and holds them to the same 3.0000 this repository holds a tile outline to.
    // Measured over all fifteen composites this document produces, in both schemes: at 33 per cent
    // the yellow the second programme takes bound at 2.8115 on the amber session wash, under the
    // bar; at 30 the worst of the thirty is 3.3321 in light and 3.4834 in dark, and the seven stay
    // far enough apart in hue to be told from one another. Darker clears by more and costs that
    // separation, which is the trade the number sits in.
    var PGHUE = {};

  // ---- the socket, issue 139, and the step is issue 155 --------------------------------------
  // A ring of 2.1 units on a 34 unit tile, set 5 in from the top edge, stepped 6.4 apart.
  //
  // HE ASKED `is alignment ok here?` ON A RING ON `bl_co_col`, WHICH CARRIES ONE. Measured before
  // any constant was touched, at 2560, 1536 and 390, over all seven drawings and over the union of
  // ZSC and ZBL under the eight week window his card was filed from: the row's centre is on the
  // tile's centre to 0.0000 units on every socketed node, at every width, for one ring, two and
  // three alike, and the tile's screen box and the ring's screen box share a centre to the same
  // figure. So the card's three candidates are all false. `span` cannot centre one differently from
  // three, because the row's centre is `n.x` whatever the count is. The label is drawn BELOW the
  // tile and the rings inside it, so a label wrapping to a second line has nothing to pull them
  // off. And a circle's centre and the tile's box centre are the same point here rather than a
  // radius apart, so there is no optics-against-arithmetic split to split.
  //
  // WHAT THE SAME MEASUREMENT DID FIND IS THE STEP, and it is the one thing on this feature a
  // reader can actually see go wrong. app.css gives a ring a stroke of 1.1, which straddles the
  // radius, so the ring a reader sees is 5.3 across and not 4.2. At the old step of 5.4 that left
  // ONE TENTH OF A UNIT of daylight between adjacent rings: at every scale this drawing is ever
  // framed at, from a touch over a quarter on the phone to 2.04 on Z-IB at 2560, a tenth of a
  // unit is between a fortieth and a fifth of a CSS pixel, so the three rings on a Z-CFA session
  // template painted as one smear. The count IS the feature, and a row that cannot be counted is
  // the feature failing quietly.
  //
  // SO THE STEP IS THE PAINTED RING PLUS ONE STROKE OF DAYLIGHT: 2 * 2.1 + 1.1 = 5.3 across, plus
  // 1.1 clear, is 6.4. Stated as arithmetic rather than trusted: scripts/smoke.mjs measures the gap
  // off the rendered circles, derives what it must be from the stroke the browser resolved, and
  // fails naming both. A stylesheet that changes the stroke turns that red instead of quietly
  // closing this gap again.
  //
  // THE MOST ANY OBJECT IN THIS DOCUMENT CARRIES IS THREE, not the four this comment claimed: six
  // Z-CFA session templates carry three, two Z-HR ones carry two, and the other 73 carry one. Three
  // at this step span 18.1 painted units of the tile's 34 and four would span 24.5, so the headroom
  // the claim was about is still there and is now stated against the ring that is painted rather
  // than against the one that is specified.
  var SOCK_R = 2.1, SOCK_STEP = 6.4, SOCK_INSET = 5;

  // ---- the arrowhead, issue 156 ------------------------------------------------------------
  // TWO NUMBERS AND ONE SHAPE BUILT FROM THEM. The head was a `d` string with 6.5 typed into it
  // twice and nothing else in the file knowing how long it is, which is why the rotation below
  // could not have been written without inventing a third copy of the number. It is a triangle
  // whose tip is at its own origin and whose base is HEAD_LEN behind it, HEAD_HALF either side.
  var HEAD_LEN = 6.5, HEAD_HALF = 2.6;
  var HEAD_D = 'M0 0 L' + (-HEAD_LEN) + ' ' + HEAD_HALF + ' L' + (-HEAD_LEN) + ' ' + (-HEAD_HALF) +
               ' Z';
    (function () {
      var decls = [];
      opts.drawing.types.forEach(function (t) {
        COLOR[t.k] = 'var(--type-' + t.k + ')';
        decls.push('--type-' + t.k + ':light-dark(' + t.c + ',' + (t.cDark || t.c) + ');');
      });
      var pgs = opts.programmes || [];
      pgs.forEach(function (p, i) {
        var h = Math.round(i * 360 / (pgs.length || 1)) + 12;
        PGHUE[p.key] = 'var(--pg-' + p.key + ')';
        decls.push('--pg-' + p.key + ':light-dark(hsl(' + h + ' 72% 30%),hsl(' + h + ' 78% 66%));');
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


    // The classes that belong to exactly one programme and therefore can carry its hue. Issue 136.
    var HUE_TYPES = { CohortSession: 1, ModuleDelivery: 1, Cohort: 1 };

    var G = null;
    var nodeById = {}, edgesOf = {}, gfxNode = {}, gfxEdge = [];
    // Issue 100. CANON is the drawing the build wrote, which is the artefact check_build.sh
    // reproduces and drawingDigest is a digest of. WIN is the question the reader's time window
    // asks of a node, or null when there is no window. What is on screen is CANON when there is
    // no window and the transform of CANON below when there is one; either way it is G, so the
    // viewport frames what is painted and not what was generated.
    var CANON = null, WIN = null, WINFO = null;
    // HOW MANY TIMES THE DRAWING HAS BEEN REBUILT, which is the one number that makes issue 145's
    // claim checkable rather than felt. paint() replaces the whole of the svg, so this counts the
    // expensive thing and not the cheap one, and a driver comparing it across a drag is reading
    // the page's own count rather than timing it with a stopwatch on the other side of a socket.
    var PAINTS = 0;
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
    // CSS px of air between the caption's own painted box and the frame, on all four sides. Five
    // because that is FRAME_PAD, the pad the node focus frame already uses: two frames on one
    // drawing that hold their contents at different distances read as two different controls.
    var CAP_PAD = 5;

    // ISSUES 96 AND 97, AND THEY ARE ONE DEFECT. He filed "frame is too tight" and "not centered
    // in the frame" on the same element, `svg>g>g>g>rect` under `#graph`, which is this rect: a
    // rect inside a node group is described as `ancestor [data-node=...]` and never as
    // `ancestor #graph`, and no other rect on the drawing sits three groups deep.
    //
    // The frame used to be positioned as `y = CAP_BELOW - hpx` with `hpx = (lines + 8 + 4) * k`,
    // which mixes two spaces in one rect: the height was in caption units multiplied by the zoom
    // and the offset was in raw CSS px. So the four units meant to sit under the last baseline
    // were also being counted, scaled, at the top, and the room actually left above the caption
    // came out as `3.6k - 4` CSS px. That is NEGATIVE below k = 1.11, which is the fit scale and
    // everything short of it: measured on the deployed page at 1536 by 839, the three line
    // caption cleared the frame by 0.28px at fit and overflowed it by 1.02px one zoom step out.
    // Too tight is the right word and it was not a matter of taste. The same mixing put a fixed
    // 4px under the baseline against a descender that grows with the zoom, so the bottom edge
    // crossed the text from k = 2.1 upward.
    //
    // AND THE CLAMP PUT ALL OF ITS SURPLUS ON ONE SIDE. Where the caption is smaller than the
    // 26px the target has to keep, the old rect grew upward only, because the bottom edge was
    // pinned at the baseline. A one line heading therefore sat 5px below the centre of its own
    // frame at fit and 8px below it at the far zoom out, which is issue 97 exactly.
    //
    // Both are gone by measuring instead of estimating. capExtent() reads the caption's painted
    // box off the text the browser drew, the way frameNode() below reads a node's, so the two
    // pads are the only numbers here and both are in CSS px; the clamp's surplus is then split
    // between the two sides. There is no second opinion about text metrics anywhere in it, which
    // is the mistake this repository has already bought twice.

    // How far the caption reaches above and below the last baseline, in USER units, measured
    // once when the lane is painted. It cannot change with the zoom, so it is not re-read on one.
    //
    // The fallback is the estimate this function exists to avoid and it is deliberately never
    // reached on a painted drawing: getBBox on a text element that is not in a rendered tree
    // answers zero, and a zero would put the frame through the middle of the words. The numbers
    // in it are the line stack plus one line of ascent and a fifth of one of descent.
    function capExtent(caps) {
      var base = G.bandTop - (G.capGap || 7);
      var up = 0, down = 0;
      caps.forEach(function (t) {
        var bb = t.getBBox();
        if (!bb || !bb.height) return;
        up = Math.max(up, base - bb.y);
        down = Math.max(down, (bb.y + bb.height) - base);
      });
      if (!(up > 0)) up = (caps.length - 1) * (G.capLineH || 11) + 9;
      if (!(down > 0)) down = 2;
      return { up: up, down: down };
    }

    function addCapButton(parent, b, caps) {
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
      capBtns.push({ g: g, hit: hit, frame: frame, band: b, box: capExtent(caps) });
      return g;
    }

    // Called by the viewport on every fit, zoom step, pinch and resize. At most two controls and
    // five attribute writes each, which is why it can be called on every frame of a pinch. The
    // caption is measured when the lane is painted and not here, so that stays true.
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
        // Everything from here down is CSS px: the caption's own box scaled to the screen, plus
        // one pad on each side. Nothing is left in user units to be scaled a second time.
        var up = c.box.up * capK + CAP_PAD;
        var down = c.box.down * capK + CAP_PAD;
        var hnat = up + down;
        var wpx = Math.max(CAP_MIN, c.band.w * capK);
        var hpx = Math.max(CAP_MIN, hnat);
        var grow = (hpx - hnat) / 2;   // what the clamp added, half of it to each side
        // Anchored on the LAST baseline, which is the line that sits the same distance above the
        // lane whatever the caption above it does, so a one line heading and a three line one are
        // the same control in the same place.
        c.g.setAttribute('transform',
          'translate(' + (c.band.x + c.band.w / 2) + ',' + (G.bandTop - (G.capGap || 7)) + ') ' +
          'scale(' + (1 / capK).toFixed(4) + ')');
        [c.hit, c.frame].forEach(function (r) {
          r.setAttribute('x', (-wpx / 2).toFixed(2));
          r.setAttribute('y', (-(up + grow)).toFixed(2));
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
    // ---- which way the arrowhead points, issue 156 ------------------------------------------
    // HE FILED `check arrow vs line alignment` ON `bl_students->bl_cohort` AND HE WAS RIGHT. What
    // was measured, before any constant was touched, at 2560, 1536 and 390 and on all seven
    // drawings plus the union of two under an eight week window:
    //
    //   the tip is exactly on the line's own end point, 0.0000 units out, everywhere;
    //   the tip is exactly on the target tile's box edge, to every decimal measured, everywhere;
    //   the rotation is exactly the curve's tangent at that end point, to 0.7 of a degree, which
    //     is the residual of the driver's own finite difference and not an error in the page;
    //   and the head is in the drawing's own units inside the scaled group, so its size against
    //     the drawing is the same at every viewport and the skew below does not move with scale.
    //
    // So the tip, the box and the tangent were all right, and the picture was still wrong. What is
    // wrong is that NOBODY CAN SEE A TANGENT. These lines are cubic curves whose control points sit
    // horizontally off each end, so a line that has to climb 174 units while it travels 75 leaves
    // its end horizontally and then swings hard. Over the arrowhead's OWN LENGTH, which is the only
    // stretch of line a reader compares the head against, the line had already turned away from the
    // head by 18.1 degrees on the edge he filed and by 27.5 on the worst of the ninety eight; over
    // two head lengths, by 31.0 and 41.5. A head aimed along the tangent of a curve that is turning
    // is aimed at where the line is going, not at where it came from.
    //
    // SO THE HEAD IS AIMED ALONG THE CHORD FROM ITS OWN BASE TO ITS OWN TIP, and the base is one
    // HEAD_LEN back along the line the browser actually drew. It is read off the path element
    // rather than recomputed from the coefficients on purpose: the head then cannot disagree with
    // the line for any shape this file or the build ever emits, including one neither of them has
    // written yet, and there is no second implementation of arc length to drift.
    //
    // NOTHING THE BUILD WROTE MOVES. `e.ax` and `e.ay` are still the tip and are still painted;
    // `e.aa` is still the tangent the build computed and is still what `faithful()` below holds
    // render.js's own edgeGeom to, which is a claim about the reflow agreeing with the build and
    // not a claim about what is painted. The fourteen drawing digests are digests of the build's
    // artefacts and this card touched none of them.
    //
    // WHICH END, READ OFF THE PATH. `e.rev` says which end the build put the head on and this does
    // not consult it: the tip is on one end or the other and the two are never closer than a tile
    // apart, so the path answers it exactly rather than by agreeing with a flag. A line shorter
    // than the head takes its whole length as the chord, which is the right answer for it and not
    // a fallback; scripts/smoke.mjs asserts that no line in any drawing is that short, so the
    // clamp is a statement about arithmetic rather than a branch nobody has seen run.
    function headAngle(line, e) {
      var L = line.getTotalLength();
      var a = line.getPointAtLength(0), b = line.getPointAtLength(L);
      var atEnd = Math.hypot(e.ax - b.x, e.ay - b.y) <= Math.hypot(e.ax - a.x, e.ay - a.y);
      var base = line.getPointAtLength(atEnd ? Math.max(0, L - HEAD_LEN)
                                             : Math.min(L, HEAD_LEN));
      return r1(Math.atan2(e.ay - base.y, e.ax - base.x) * 180 / Math.PI);
    }

    function paint(g) {
      G = g;
      PAINTS++;
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
        // Kept, because the control over this caption is sized from the box the browser draws
        // these into rather than from a second guess at how tall they are. Issues 96 and 97.
        var capTexts = lines.map(function (line, i) {
          var t = el('text', {
            // Issue 100. The last line of a filtered lane's caption is the count for the window
            // and not part of the lane's name, so it is marked and the stylesheet sets it apart
            // by case alone. Nothing about the first three lines changed.
              // Issue 111 took the fourth line off. A filtered lane's caption is the three lines
            // the build wrote and nothing else: the count for the window is in the header now,
            // and `cap-window` marked a line this file no longer makes.
            class: 'band-cap',
            x: b.x + b.w / 2,
            y: G.bandTop - (G.capGap || 7) - (lines.length - 1 - i) * (G.capLineH || 11)
          }, gLane);
          t.textContent = line;
          return t;
        });
        addCapButton(gLane, b, capTexts);
      });

      // ---- what an empty window says, issue 119 --------------------------------
      // ONE LINE, ON THE LANES, IN THE WORDS THE LIST ALREADY USES. term.js writes the sentence
      // and hands it over on the window spec; this file decides only where it goes. It is not a
      // new idiom: it is the answer #/calendar's list has given a window it filtered to nothing
      // since issue 90, printed on the other surface that the same window acts on.
      //
      // IT IS NOT THE COUNT COMING BACK. Issue 111 took the per lane counts off the canvas and put
      // them in the header, where they still are, and this says no number at all: it names the
      // window and the two controls that move it. A reader who wants the arithmetic of what was
      // taken off reads the header, exactly as they do on every other window.
      //
      // PLACED FROM THE PLATE'S OWN TWO NUMBERS, `bandTop` and the same `- 4` the plate is drawn
      // with, so it is centred in the lanes at every zoom and cannot drift away from them. It sits
      // in the band group and outside every `.lane`, because it belongs to the drawing and not to
      // one of six columns.
      if (G.emptyText) {
        var empty = el('text', { class: 'win-empty', x: G.w / 2,
                                 y: (G.bandTop + G.h - 4) / 2 }, gBand);
        empty.textContent = G.emptyText;
      }

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
        // Issue 100 gave a line a third state, `outside`, for a relationship whose far end the
        // reader's window had taken off the picture; it was painted quiet and dashed and ran to a
        // stub tile. Issue 111 took the stub off the drawing, so there is no such line: an edge
        // with an end outside the window is not drawn, and what it would have said is counted in
        // `filtered()` and printed by the header. A ghost is still a ghost.
        var eq = e.ghost ? 'ghost' : null;
        var g2 = el('g', { 'data-edge': key, class: eq }, gEdge);
        // Issue 89. A line that stands for more than one relationship says how many, in its own
        // <title>, which is why the verb on the chip is left exactly as the model wrote it.
        var etitle = e.n > 1 ? e.v + ', ' + e.n + ' relationships drawn as one line' : null;
        if (etitle) el('title', {}, g2).textContent = etitle;
        var line = el('path', { d: e.d, class: e.ghost ? 'edge edge-ghost' : 'edge' }, g2);
        el('path', {
          d: HEAD_D,
          class: e.ghost ? 'arrow arrow-ghost' : 'arrow',
          transform: 'translate(' + e.ax + ',' + e.ay + ') rotate(' + headAngle(line, e) + ')'
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
        // Issue 100 drew one OUTSIDE tile per lane, a sentence about the picture rather than an
        // object in the model, carrying `data-outside` instead of `data-node` so a capture could
        // never report an id the instance document has never heard of. Issue 111 took it off the
        // drawing: every tile painted here is a node of the model again, and the count it carried
        // is in the header. Nothing reaches this loop that is not in the instance document.
        // data-node is the instance key. It is what feedback.js reads to say which node a click
        // landed on, the way monetary-lab's capture reads its own linked-highlight key.
        var g2 = el('g', { class: n.ghost ? 'node ghost' : 'node',
                           'data-node': n.id,
                           tabindex: 0,
                           role: 'button' }, gNode);
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
          // `tile-bg` AND NOTHING ELSE, INCLUDING ON A GHOST. Issue 106. This emitted a second
          // class, `tile-ghost`, on every ghost tile; `git log -S` shows no rule for it was ever
          // written in site/app.css, and its only occurrence in the tree was this line. A ghost
          // tile is styled through `.node.ghost .tile-bg`, off the class the group already
          // carries, so the second name selected nothing and told a reader of the stylesheet to
          // look for a rule that does not exist.
          class: 'tile-bg',
          x: n.x - R, y: n.y - R, width: TILE, height: TILE, rx: 6,
          // A ghost's wash is 7 per cent where every other tile is at 14, and it is the same
          // grey the ghost type carries rather than a second copy of that grey written here:
          // this line held `rgba(143,153,168,0.07)` as a literal, which was the palette's own
          // hex typed into a second file. The strength is unchanged.
          fill: tint(col, n.ghost ? 7 : 14), stroke: col
        }, g2);

        // ---- which programme this tile belongs to, issue 136 ---------------------
        // A BAR ALONG THE FOOT OF THE TILE, AND ONLY WHILE MORE THAN ONE PROGRAMME IS DRAWN.
        // `G.programmes` is written by union() and by nothing else, so a drawing of one programme
        // cannot paint this: the canonical artefacts the build ships carry no such field, and a
        // single chip therefore renders the drawing this page has always rendered, byte for byte.
        //
        // ON THE SESSIONS AND THE COHORTS AND ON NOTHING ELSE, which is the design's own line and
        // is the honest one: those are the classes that belong to exactly one programme each. An
        // instructor, an employer or a sponsor may belong to several, is drawn once for exactly
        // that reason, and a hue on it would name one of the programmes it serves and hide the
        // rest. The module delivery is the sessions lane's tile at the other altitude and takes
        // the same bar for the same reason.
        if (HUE_TYPES[n.type] && n.pg && G.programmes && G.programmes.length > 1 && PGHUE[n.pg]) {
          el('rect', { class: 'pgbar', x: n.x - R + 4, y: n.y + R - 6, width: TILE - 8,
                       height: 3, rx: 1.5, fill: PGHUE[n.pg] }, g2);
        }

        // ---- the empty sockets, issue 139 --------------------------------------
        // ONE RING PER MISSING VALUE, DRAWN ON THE OBJECT THAT IS MISSING IT. Until this card the
        // page met an absence in two places and neither of them was the picture: a number in the
        // header and a list behind a press. So a reader looking at the three weeks in front of
        // them could be told that eleven sessions have nobody assigned to teach them and could not
        // see WHICH. A ring is empty because the value is; there are as many of them as there are
        // missing values, so the sockets on a tile count to the same number the tile's own
        // property list does, and the sockets on the canvas count to the number on the control.
        //
        // TWO KINDS, NEVER ONE MARK AND NEVER ONE COLOUR. `sock-work` is a value a system holds a
        // row for and has left empty, drawn solid in the warning hue, because somebody can fill it
        // in. `sock-unrec` is a fact no system records, drawn in the ghost grey with the ghosts'
        // own dashes, because it is the same finding as a ghost tile met one grain down. The two
        // are switched by their own switch and by nothing else, in app.css, off a class on the
        // body, which is the mechanism `ghosts` has used since it was written.
        //
        // WHICH SIDE EACH ROW IS ON IS NOT DECIDED HERE. app.js reads the registry once, at the
        // join, and every node arrives carrying `absW` and `absU`. This file paints what it is
        // told, which is the split that keeps the count and the picture from being two opinions.
        //
        // THE GEOMETRY IS THE TILE'S AND NOTHING THE BUILD WROTE MOVES. The rings sit inside the
        // top edge, clear of the glyph at the centre and of the programme bar at the foot, and no
        // coordinate of any tile, line or label changes: the fourteen drawing digests are digests
        // of the build's artefacts and this card touched none of them.
        if (n.absW || n.absU) {
          var socks = [];
          var si;
          for (si = 0; si < (n.absW || 0); si++) socks.push('sock sock-work');
          for (si = 0; si < (n.absU || 0); si++) socks.push('sock sock-unrec');
          var span = (socks.length - 1) * SOCK_STEP;
          socks.forEach(function (cls, k) {
            el('circle', { class: cls, cx: n.x - span / 2 + k * SOCK_STEP,
                           cy: n.y - R + SOCK_INSET, r: SOCK_R }, g2);
          });
        }

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
          var t = el('text', { class: n.ghost ? 'lbl lbl-ghost' : 'lbl',
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
                          ghost: !!n.ghost,
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
    // file: reflowing the FULL node set with no filter reproduces the canonical coordinates, to
    // within the tenth of a unit layout.js rounds to. If that holds then this transform is the
    // build's own pack() and the build's own arcs, so on everything it covers the filtered
    // drawing differs from the canonical one only by what the reader asked to take out of it. If
    // somebody retunes pack() in the build and not here, that assertion goes red and names the
    // drift. It is the only thing standing where the build gate does not reach, and the CHANGELOG
    // says so in as many words.
    //
    // WHAT IT COVERS, AND IT IS LESS THAN THE WHOLE DRAWING. Issue 106; this paragraph replaces a
    // sentence that read "every node and every edge" and then leaned on "the four constants
    // below". `faithful()` returns four numbers, `dy` over every node's y, and `dp`, `arrows` and
    // `rev` over every edge's path, arrowhead and direction. It never compares `cx`, `cy` or
    // `cw`, so no chip is checked, and the chip is where the two copies most recently disagreed:
    // see the tiebreak beside the chip sort. Counted at 5f32209, fifteen constants sit below this
    // line and the check exercises five of them, SPREAD and SPREAD_FROM through pack() and DIP,
    // CTRL_MIN and CTRL_FRAC through the arcs; the ten it does not reach are the chip geometry
    // and the two feet. A green reflowCheck says the tiles and the lines are the build's. It says
    // nothing about the verb chips, and a claim of full coverage would have retired the only
    // question this file still has open.
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
    function packOne(g, nodes, gap0) {
      var cols = byColumn(g, nodes), H = 0, at = {};
      // Down each column in the order the canonical drawing stacked them. That order is the whole
      // of what this transform inherits from the build's thirty barycentre sweeps, and re-deriving
      // it here would be the general graph layout this deliberately is not. Every node reaching
      // this function now carries the y the build gave it: issue 111 took off the one that did
      // not, the stub tile that sorted to the foot of its lane on a y of Infinity.
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
      return at;
    }

    // =============================================================================================
    // THE SECTORS, ISSUE 136
    // =============================================================================================
    // A PROGRAMME OWNS A SLICE OF THE CANVAS AND THE SIX LANES RUN THROUGH ALL OF THEM. That is the
    // whole of the union's geometry and it is the only arrangement that keeps two promises at once:
    // the lanes still mean what they meant, so a session is in the sessions lane on every
    // programme, and a shared instructor can sit BETWEEN the programmes it serves rather than being
    // drawn twice. Sectors side by side would have given each programme its own instructors lane,
    // which is the drawing that cannot show the thing this card exists to show.
    //
    // THE ORDER IS THE BUILD'S AND NEVER CHANGES, which is what makes adding a programme fill an
    // empty sector below rather than re-laying the ones already on screen. A programme added ABOVE
    // the ones already drawn does move them down, by exactly its own sector height, and that cost
    // is real and admitted rather than waved off: fixed ABSOLUTE offsets across all seven would
    // have avoided it and would have opened seven thousand units of blank canvas between Z-IB and
    // Z-CFA when only those two are in scope.
    //
    // A NODE CARRIES `sec` OR IT DOES NOT, AND THAT IS THE WHOLE OF THE SWITCH. The canonical
    // drawings the build ships carry none, so one programme takes the branch this file has always
    // taken, node for node, and `reflowCheck()` still reproduces build_layout.py's own coordinates.
    // `sec === null` is the third answer and means a node the union drew once for several sectors.
    var SECTOR_GAP = 64;

    // Where a shared node goes: the mean of the nodes it is joined to, which is the layout's own
    // rule ("Y relaxed towards the mean of each node's neighbours") and lands it between the
    // sectors it serves. Then pushed to the nearest position in its own column that clears
    // everything already placed there, which is the chip's rule one axis over: slide until clear
    // rather than overlap.
    function freeSlot(want, h, boxes, gap0) {
      var cand = [want], best = null, bd = Infinity;
      boxes.forEach(function (b) { cand.push(b[0] - gap0 - h); cand.push(b[1] + gap0); });
      cand.forEach(function (y) {
        var clash = false;
        boxes.forEach(function (b) { if (y < b[1] + gap0 && b[0] < y + h + gap0) clash = true; });
        if (clash) return;
        var d = Math.abs(y - want);
        if (d < bd) { bd = d; best = y; }
      });
      return best === null ? want : best;
    }

    function placeShared(g, shared, at, gap0, ix) {
      if (!shared.length) return;
      var mid = 0, k0 = 0;
      Object.keys(at).forEach(function (id) { mid += at[id]; k0++; });
      mid = k0 ? mid / k0 : 0;
      var want = shared.map(function (n) {
        var sum = 0, k = 0;
        (n.near || []).forEach(function (m) {
          if (at[m] === undefined) return;
          sum += at[m];
          k++;
        });
        return { n: n, col: colOf(n.x), want: k ? sum / k : mid };
      });
      // Lowest barycentre first, so the order a reader meets them down a lane is the order their
      // own sessions put them in, and the one that has to give way is the one arriving later.
      want.sort(function (a, b) { return a.want - b.want; });
      want.forEach(function (p) {
        var h = boxH(g, p.n), occupied = [];
        Object.keys(at).forEach(function (id) {
          var m = ix[id];
          if (!m || colOf(m.x) !== p.col) return;
          occupied.push([at[id] - g.tile / 2, at[id] - g.tile / 2 + boxH(g, m)]);
        });
        at[p.n.id] = freeSlot(p.want - g.tile / 2, h, occupied, gap0) + g.tile / 2;
      });
    }

    function place(g, nodes, gap0, top) {
      var groups = {}, order = [], shared = [], at = {}, i, ix = {};
      nodes.forEach(function (n) { ix[n.id] = n; });
      nodes.forEach(function (n) {
        if (n.sec === null) { shared.push(n); return; }
        var k = (n.sec === undefined) ? 0 : n.sec;
        if (!groups[k]) { groups[k] = []; order.push(k); }
        groups[k].push(n);
      });
      order.sort(function (a, b) { return a - b; });
      var y0 = top;
      for (i = 0; i < order.length; i++) {
        var list = groups[order[i]];
        var local = packOne(g, list, gap0);
        var lift = Infinity, bottom = -Infinity;
        list.forEach(function (n) { lift = Math.min(lift, local[n.id] - g.tile / 2); });
        list.forEach(function (n) {
          var v = local[n.id] + y0 - lift;
          at[n.id] = v;
          bottom = Math.max(bottom, v - g.tile / 2 + boxH(g, n));
        });
        y0 = bottom + SECTOR_GAP;
      }
      placeShared(g, shared, at, gap0, ix);
      nodes.forEach(function (n) { at[n.id] = r1(at[n.id]); });
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
    // The browser has the real font, so this asks it. THE CACHE IS THE WHOLE OF THE SAVING and it
    // is keyed on everything that changes a width: the string, the class, the weight and the
    // slant. A string measured once is never measured again, so the second window and every
    // repaint after it cost nothing.
    //
    // AND IT MEASURES ONE STRING AT A TIME, WHICH IS SAID HERE BECAUSE IT USED TO SAY OTHERWISE.
    // Issue 106. What stood here was a `measure(items)` taking an array and putting the whole
    // batch inside one hidden group, under a comment claiming that a wrap therefore cost one
    // layout rather than one per candidate line. It had exactly one caller and that caller always
    // handed it a one-element array, so the batch was never a batch and the saving the comment
    // described was never taken. The array went rather than the comment being corrected, because
    // an unused generality reads as a used one and the next reader would have budgeted for a
    // batching that is not there. It is one function away if a caller ever wants it.
    var TW = {};

    function widthOf(s, cls, w, i) {
      var k = cls + '|' + (w || '') + '|' + (i ? 'i' : '') + '|' + s;
      if (TW[k] === undefined) {
        var host = el('g', { visibility: 'hidden', 'aria-hidden': 'true' }, svg);
        var t = el('text', { class: cls, 'font-weight': w || null,
                             'font-style': i ? 'italic' : null }, host);
        t.textContent = s;
        TW[k] = t.getComputedTextLength();
        svg.removeChild(host);
      }
      return TW[k];
    }

    // ---- the transform itself -----------------------------------------------------------------
    // WHAT AN EDGE WITH A FILTERED ENDPOINT DOES, AND ISSUE 111 REVERSED THE ANSWER. It is not
    // drawn. Nothing stands in for it on the canvas and no line runs to a stub.
    //
    // WHAT IT WAS UNTIL #111, because the reasoning was not wrong and only half a requirement.
    // Every lane that lost tiles gained ONE tile reading "N tiles outside this window", every
    // edge whose far end had gone terminated on it, parallel edges were folded into one line per
    // surviving node per verb carrying their count in a title, and every lane caption grew a
    // fourth line reading "6 of 28 in this window". The argument was that a filter which silently
    // drops things is how a management tool starts lying: the reader cannot tell filtered from
    // absent, and absent is the more interesting of the two on a page whose whole subject is what
    // the business does and does not record.
    //
    // HE OVERRULED IT FROM THE PAGE AND HE IS RIGHT: "the whole point of week filter is to not
    // see this (only the week, clean)". Honest bookkeeping and a clean view were treated as one
    // requirement and they are two. On a three week window over Z-BL the drawing was six lanes of
    // stubs with more dashed lines than solid ones, which is a picture of the filter rather than
    // a picture of the three weeks.
    //
    // SO THE COUNT LEAVES THE DRAWING AND DOES NOT LEAVE THE PAGE. What this function drops it
    // COUNTS, and hands out on `windowState()`: the tiles, the relationships those tiles took
    // with them, and the per lane breakdown the captions used to carry. The header's own window
    // control is where a number about what is not on screen already lives, beside `weeks: 3 of 24`
    // and `gaps: 11 of 95`, and term.js prints it there. The drawing shows the window; the header
    // says what the window excludes. A change that stops printing it is a change that starts
    // lying, and the smoke suite asserts the two numbers against each other rather than trusting
    // either.
    //
    // AND THE THREE HELPERS THE STUB NEEDED WENT WITH IT, ONE CARD LATE. Issue 106. `wrapTo`,
    // `laneRoom` and `nodeAt` existed to label a stub tile, keep that label inside its lane, and
    // find the node an edge's vanished end pointed at. #111 removed every caller and left all
    // three standing, and a helper with no caller is read as machinery this file still needs.
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
    // cascade then reaches everything and the canvas is empty, which is a true picture of that
    // week and is the picture #111 asked for. The header does not empty with it: the programme's
    // own name and its cohort are chrome described from the canonical drawing, and the window
    // control states in that same row how many tiles the window has taken off.
    // ---- the filtered drawing, and the memo over it, issue 145 --------------------------------
    // A WINDOW THAT LEAVES THE SAME TILES ON SCREEN IS THE SAME DRAWING, so the second time it is
    // asked for it is not laid out again. Everything below the cascade is a pure function of the
    // canonical drawing and the set of nodes the window kept: the pack down each column, the two
    // edge shapes, the greedy chip slide along every arc, the extent, the lane counts and WINFO
    // itself. Nothing in this file writes to a composed drawing after it is made, which is what
    // makes handing the same object back safe rather than merely cheap.
    //
    // AND THE KEY IS THE VALUES AND NOT THE SHAPE, which is the trap Monetary Lab's own audit log
    // wrote down after a memo keyed on a link set returned the first drawing's geometry for a
    // later call with the same shape and different numbers. Two things are keyed on here. The
    // canonical drawing is keyed on by OBJECT IDENTITY, in a WeakMap, so a different scope or a
    // different altitude can never collide however similar its node set; and within one canonical
    // drawing the key is the exact ordered list of kept ids, which is what the composer's whole
    // output is a function of.
    //
    // EXCEPT WHEN NOTHING IS KEPT, which is the one case the id list does not determine: an empty
    // window draws the sentence the SPEC carries, and two empty windows are two different
    // sentences. That case is not memoised at all, and it is the cheap one.
    //
    // 32 PER DRAWING, which is a window's worth: the term is 24 weeks and a reader dragging a band
    // across it visits at most 24 positions, so a pass over the term and back is served from here
    // after the first. Measured at `#/p/ALL` on a 2560 viewport, a rebuild is about 44ms and a hit
    // is under one.
    var MEMO = typeof WeakMap === 'function' ? new WeakMap() : null;
    var MEMO_MAX = 32;

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

      // ---- the edges, and after issue 111 there is one kind -------------------------
      // A LINE IS DRAWN WHEN BOTH OF ITS ENDS ARE DRAWN. Anything else is counted here and said
      // in the header, which is the trade this card made: what used to be a dashed line into a
      // stub is a number in the row above the canvas. The fold that used to gather parallel lines
      // onto a stub went with the stub, and with it the whole of the unit-separator key it was
      // built on.
      //
      // IT COUNTS RELATIONSHIPS AND NOT LINES, which is issue 89's arithmetic and survives this
      // card unchanged. At the modules grain one `instance of` line can stand for fifteen, so a
      // window that takes that line off the picture has taken fifteen relationships off it and
      // not one. Counting one per line would be the arithmetic that reads right and is wrong,
      // which is exactly the undercount an aggregate invites. Both figures are reported, because
      // they answer different questions and neither is derivable from the other.
      var out = [], offRel = 0, offLines = 0;
      g.edges.forEach(function (e) {
        if (gone[e.s] || gone[e.t]) {
          offRel += (e.n || 1);
          offLines++;
          return;
        }
        out.push({ s: e.s, t: e.t, e: e, n: (e.n || 1) });
      });

      // Issue 111. WHAT IS DRAWN IS WHAT STAYED, and that is the whole of the node set now. No
      // stub tile per lane, so nothing is placed that the build did not lay out, and the lane
      // captions are the three lines the build wrote rather than four. The line of headroom the
      // fourth caption needed went with it, which is why `topOf(g)` and `g.bandTop` are taken
      // bare here where they used to be offset by one caption line.
      var key = keep.length ? keep.map(function (n) { return n.id; }).join(',') : null;
      var per = null;
      if (MEMO && key) {
        per = MEMO.get(g);
        if (!per) { per = { order: [], by: {} }; MEMO.set(g, per); }
        var hit = per.by[key];
        if (hit) { WINFO = hit.info; return hit.g; }
      }
      var made = compose(g, keep, out, {
        hidden: hidden,
        off: { tiles: hidden.length, relationships: offRel, lines: offLines },
        emptyOn: true, spec: spec
      });
      if (per) {
        per.by[key] = { g: made, info: WINFO };
        per.order.push(key);
        if (per.order.length > MEMO_MAX) delete per.by[per.order.shift()];
      }
      return made;
    }

    // ---- one composer, two callers, issue 136 ---------------------------------------------------
    // EVERYTHING BELOW WAS THE SECOND HALF OF filtered() AND IS NOW ITS OWN FUNCTION, because the
    // union needs exactly it: a set of nodes and a set of relationships, packed down their columns
    // by the build's own pack(), joined by the build's own two edge shapes, with the verb chips
    // slid along their own lines and the extent measured off what came out. A second copy of that
    // for the union would have been a second opinion about where the build puts things, which is
    // the mistake `reflowCheck()` exists to catch and the one this file spent issue 106 removing
    // elsewhere.
    //
    // `opt.pitch` AND `opt.top` ARE HANDED IN RATHER THAN READ WHEN THERE IS NO ONE ARTEFACT TO
    // READ THEM FROM. A window reads them off the drawing it is filtering, which is what it has
    // always done. The union has seven such drawings and their nodes carry seven overlapping sets
    // of y coordinates, so pitchOf() over the merged list would measure a gap between two tiles
    // that were never in the same picture. union() takes the strictest of the seven and says so.
    function compose(g, nodes, out, opt) {
      var gap = (opt && opt.pitch) || pitchOf(g);
      var at = place(g, nodes, gap, (opt && opt.top !== undefined) ? opt.top : topOf(g));
      var pos = {};
      nodes.forEach(function (n) { pos[n.id] = { x: n.x, y: at[n.id], col: colOf(n.x) }; });

      var edges = out.map(function (r) {
        var geo = edgeGeom(g, pos[r.s], pos[r.t]);
        var e = { s: r.s, t: r.t, v: r.e.v, ghost: r.e.ghost || null,
                  // Issue 89. A kept line keeps the fold it arrived with, so a collapsed drawing
                  // inside a window still says in its own <title> how many relationships each
                  // line stands for. Dropping it here would have made the count true of the
                  // whole term and false of every filtered reading of it.
                  n: r.n > 1 ? r.n : null,
                  d: geo.d, rev: geo.rev, ax: geo.ax, ay: geo.ay, aa: geo.aa };
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
      // ONE ARRAY THAT GROWS RATHER THAN TWO JOINED ON EVERY CANDIDATE. Issue 145, and it is a
      // repair to the cost and not to the picture: `blocked.concat(chips)` stood inside the
      // innermost loop below, which runs once per slide per perpendicular offset per edge, and
      // built a fresh array of every tile, every label and every chip placed so far each time.
      // Measured on a drag at `#/p/ALL` on a 2560 viewport, `overlapDepth` and the closure around
      // it were 372ms of the 1470ms of script three drags cost. The sum overlapDepth returns is
      // over every box and is order independent, and a chip is pushed only after its own placement
      // is decided, so appending to the same array is the same set at every candidate it was
      // before: the drawing is identical, which is what check_build.sh's fourteen digests say.
      var boxes = blocked;
      // THE ORDER IS THE BUILD'S, DOWN TO THE LAST TIEBREAK, AND THAT LAST ONE WAS MISSING.
      // Issue 106. build_layout.py sorts these `(-span, s, t)`; this sorted `(-span, s)` and
      // stopped, which is a difference only where two lines leave the same node with the same
      // span. That is not a corner: at 5f32209 the seven sessions drawings hold 34 such groups
      // over 175 of their 455 edges, and both grains together 62 groups over 264 of 740. Chip
      // placement is greedy along the arc, so the first chip in a group takes the best slot and
      // the rest take what is left; a different order inside the group is a different picture.
      // Python's sort and this one are both stable, so the two agreed only for as long as the
      // model happened to emit each group already in `t` order, which nothing promises and no
      // gate checks: check_build.sh reproduces the CANONICAL drawing, and this code runs only
      // when a window is on, where there is no second copy to compare against. The tiebreak
      // costs nothing and removes the divergence rather than watching it.
      edges.slice().sort(function (a, b) {
        return (b.span - a.span) ||
               (a.s < b.s ? -1 : a.s > b.s ? 1 : 0) ||
               (a.t < b.t ? -1 : a.t > b.t ? 1 : 0);
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
            var cost = W_OVER * overlapDepth(x, y, e.cw + 4, boxes) +
                       Math.abs(ds) + W_PERP * Math.abs(perp);
            if (bestCost === null || cost < bestCost) { best = [x, y]; bestCost = cost; }
          });
          return bestCost === 0 && ds === 0;
        });
        e.cx = r1(best[0]); e.cy = r1(best[1]);
        boxes.push([e.cx, e.cy, e.cw + 4, CH]);
      });

      // ---- the extent, and the lane captions -----------------------------------------
      var h = 0;
      nodes.forEach(function (n) { h = Math.max(h, pos[n.id].y - g.tile / 2 + boxH(g, n) + FOOT); });
      edges.forEach(function (e) {
        h = Math.max(h, e.cy + CHIP_FOOT);
        if (e.span >= 3) h = Math.max(h, bezAt(e.pts, 0.5)[1] + CHIP_FOOT);
      });
      edges.forEach(function (e) { delete e.pts; delete e.span; });

      // ---- and the extent of a window that left nothing, issue 119 --------------------
      // THIS LOOP STARTS AT ZERO AND MAXES OVER TWO EMPTY SETS, so an empty window handed back a
      // drawing 0 units tall. The lane plate is drawn at `G.h - G.bandTop - 4`, which is then 0
      // minus 43 minus 4, and six rects went out at `height: -47`. A negative rect is not painted,
      // so nothing a reader could see was ever wrong, which is exactly why it survived a hundred
      // and ninety two assertions: the ONLY witness was six rendering errors on a console channel
      // nothing had ever aimed at this state. It is reachable in the real data on thirteen
      // (programme, one week) pairs whose anchor falls inside that programme's own term, and on
      // ninety one over the whole anchor range the control offers.
      //
      // THE FLOOR IS THE DRAWING'S OWN ARITHMETIC AND NOT A NUMBER TYPED HERE. An empty drawing is
      // exactly as tall as the same drawing holding one single line tile in its top row: the top
      // margin the build left, one tile, the gap under it, one line of label, and the foot every
      // other drawing keeps under its lowest tile. Every term in that comes off the canonical
      // artefact, so a build that retunes any of them moves this with it.
      //
      // AND A CLAMP ALONE WOULD HAVE BEEN THE WRONG FIX. Six lanes correctly drawn over nothing is
      // still a drawing with no opinion about the question the reader asked. What it says is
      // below, and #111 decided the idiom: the window leaves only the window, and this is that
      // rule at its limit.
      var emptyText = null;
      if (!nodes.length) {
        h = Math.max(h, ((opt && opt.top !== undefined) ? opt.top : topOf(g)) +
                        g.tile + g.gapLabel + g.lineH + FOOT);
        emptyText = (opt && opt.spec && opt.spec.empty) || null;
      }

      // KEEPING THE COUNT, WHICH IS THE HALF OF #100 THAT #111 DID NOT OVERRULE. Every lane still
      // reports what it is showing of what it had; what changed is where it is reported. It used
      // to be a fourth line on the lane's own caption, in the idiom #83 set for the three above
      // it, and that line is the count on the drawing this card takes off. The numbers are
      // computed here all the same, because this is the only place that knows which tiles fell in
      // which lane, and go out on `windowState()` for the header to print. The lanes are handed
      // over with the NAME the build gave them, so whoever prints them names a lane as the drawing
      // does rather than inventing a second vocabulary for the same six columns.
      var lanes = [], bands = (g.bands || []).map(function (b) {
        var was = 0, now = 0;
        g.nodes.forEach(function (n) { if (n.x >= b.x && n.x <= b.x + b.w) was++; });
        nodes.forEach(function (n) { if (n.x >= b.x && n.x <= b.x + b.w) now++; });
        lanes.push({ key: b.key, label: (b.lines && b.lines[0]) || b.label || b.key,
                     shown: now, of: was });
        return b;
      });

      if (opt && opt.off) {
        WINFO = {
          on: true, hidden: opt.hidden.map(function (n) { return n.id; }),
          shown: nodes.map(function (n) { return n.id; }),
          // Issue 111. WHAT THE DRAWING NO LONGER SAYS ABOUT ITSELF, in the three numbers a reader
          // needs to be told it: the tiles the window took off, the relationships that went with
          // them, and the lines those relationships were drawn as. The last two differ at the
          // modules grain, where one line stands for many, so both are here and neither is
          // inferred from the other. `outside` was a list of the stub tiles and there are none.
          off: opt.off,
          lanes: lanes, canonNodes: g.nodes.length, canonEdges: g.edges.length,
          drawnEdges: edges.length,
          digest: g.drawingDigest || 'unknown'
        };
      }

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
      d.h = Math.round(h);
      // Issue 119. Set on an emptied drawing and on nothing else, which is what keeps paint()
      // from needing to know anything about windows: the canonical drawing never carries it, so
      // the sentence cannot appear on a page nobody filtered.
      d.emptyText = emptyText;
      d.filteredFrom = g;
      return d;
    }

    // =============================================================================================
    // THE UNION, ISSUE 136
    // =============================================================================================
    // SCOPE IS A SET AND THE SET IS ONE DRAWING. What comes in is the canonical drawings of the
    // programmes in scope, in the build's own order; what goes out is a drawing of exactly the
    // shape the build ships, so everything downstream, the painter, the window, the selection, the
    // viewport and the header, meets it as a drawing and learns nothing new.
    //
    // A NODE IN TWO PROGRAMMES IS ONE NODE, JOINED BY ITS ID AND BY NOTHING ELSE. The build already
    // writes the same id for the same object across documents: `t4` is one instructor on Z-IB, Z-SC
    // and Z-PE and `co_emp4` is one employer on four of the seven, while every enrolment, charge,
    // ghost and cohort carries a per-programme id because it IS per programme. So the collapse is
    // read out of the documents rather than decided here, and a class that starts sharing an object
    // tomorrow collapses without this file being edited. That collapse is the whole of why an
    // inter-programme line exists at all: a shared instructor drawn twice is two nodes with no line
    // between the programmes, and drawn once it is one node with edges reaching into both.
    //
    // WHERE THE VALUES DISAGREE, BOTH ARE PRINTED AND NEITHER IS SUMMED. Two properties on those
    // shared objects are counts over the drawing that carried them, `sessions_taught` and
    // `instructors_supplied`, so the same instructor reads 2 on Z-IB and 3 on Z-SC. A collapsed
    // node cannot print one of them as though it were the answer and must not add them, so a
    // property whose value differs across the documents it came from is printed as the values it
    // has, each named by the programme it is true of.
    //
    // AND THE LANE CAPTIONS LOSE EVERY NUMBER THAT WOULD BE A SUM. Four of the six say the same
    // words on all seven and are kept whole. The other two carry a sample clause, `6 of 79 session
    // templates` against `all 25 session templates`, and a merged drawing has no honest single
    // value for it: the fractions live on the chips, one per programme, and the caption keeps only
    // the words every document in scope writes. That is a rule over the strings the build wrote and
    // not a noun typed here.
    function commonTail(lines) {
      var words = lines.map(function (s) { return String(s).split(/\s+/); });
      var n = Math.min.apply(null, words.map(function (w) { return w.length; })), i, k = 0;
      for (i = 1; i <= n; i++) {
        var w = words[0][words[0].length - i];
        if (!words.every(function (x) { return x[x.length - i] === w; })) break;
        k = i;
      }
      return k ? words[0].slice(words[0].length - k).join(' ') : '';
    }

    function mergeBands(list) {
      var first = list[0].drawing.bands || [];
      return first.map(function (b, bi) {
        var mine = list.map(function (v) { return (v.drawing.bands || [])[bi] || {}; });
        var lines = [], i, j;
        var depth = Math.min.apply(null, mine.map(function (x) { return (x.lines || []).length; }));
        for (i = 0; i < depth; i++) {
          var same = true;
          for (j = 1; j < mine.length; j++) if (mine[j].lines[i] !== mine[0].lines[i]) same = false;
          if (same) lines.push(mine[0].lines[i]);
        }
        if (!lines.length) {
          var tail = commonTail(mine.map(function (x) { return (x.lines || [])[0] || ''; }));
          if (tail) lines.push(tail);
        }
        return { key: b.key, x: b.x, w: b.w, label: lines.join(' ') || b.key, lines: lines };
      });
    }

    function mergeProps(rows, codes) {
      var base = rows[0] || [];
      return base.map(function (p, i) {
        var vals = rows.map(function (r) { return (r[i] || {}).v; });
        var same = vals.every(function (v) { return v === vals[0]; });
        if (same) return p;
        var out = {}, k;
        for (k in p) if (Object.prototype.hasOwnProperty.call(p, k)) out[k] = p[k];
        out.v = vals.map(function (v, j) { return v + ' in ' + codes[j]; }).join(', ');
        return out;
      });
    }

    function union(list) {
      var g0 = list[0].drawing;
      var byId = {}, order = [];
      list.forEach(function (v, i) {
        v.drawing.nodes.forEach(function (n) {
          if (!byId[n.id]) { byId[n.id] = { rows: [], views: [], sec: i }; order.push(n.id); }
          byId[n.id].rows.push(n);
          byId[n.id].views.push(v);
        });
      });
      var edgeBy = {}, edgeOrder = [];
      list.forEach(function (v) {
        v.drawing.edges.forEach(function (e) {
          var k = e.s + ' ' + e.t + ' ' + e.v;
          if (edgeBy[k]) { edgeBy[k].n = Math.max(edgeBy[k].n, e.n || 1); return; }
          edgeBy[k] = { s: e.s, t: e.t, e: e, n: e.n || 1 };
          edgeOrder.push(k);
        });
      });
      var out = edgeOrder.map(function (k) { return edgeBy[k]; });

      var near = {};
      out.forEach(function (r) {
        (near[r.s] || (near[r.s] = [])).push(r.t);
        (near[r.t] || (near[r.t] = [])).push(r.s);
      });

      var shared = [];
      var nodes = order.map(function (id) {
        var rec = byId[id], n0 = rec.rows[0], c = {}, k;
        for (k in n0) if (Object.prototype.hasOwnProperty.call(n0, k)) c[k] = n0[k];
        c.pg = rec.views[0].key;
        if (rec.rows.length > 1) {
          c.sec = null;
          c.props = mergeProps(rec.rows.map(function (n) { return n.props || []; }),
                               rec.views.map(function (v) { return v.code || v.key; }));
          c.near = near[id] || [];
          c.pgs = rec.views.map(function (v) { return v.key; });
          shared.push(id);
        } else {
          c.sec = rec.sec;
        }
        return c;
      });

      var g = {};
      Object.keys(g0).forEach(function (k) { g[k] = g0[k]; });
      g.nodes = nodes;
      g.edges = out.map(function (r) { return r.e; });
      g.bands = mergeBands(list);
      g.programmes = list.map(function (v) {
        return { key: v.key, code: v.code, label: v.label };
      });
      g.shared = shared;
      // THE DIGEST NAMES THE ARTEFACTS IT WAS BUILT FROM AND CLAIMS NOTHING ELSE. There is no
      // built artefact for a union and check_build.sh reproduces none, so a bare digest here
      // would be a reader being sent to a picture no build ever wrote. What pins the geometry is
      // the seven digests that went in, so those are what it carries, and feedback.js quotes the
      // whole string.
      g.drawingDigest = 'union of ' + list.map(function (v) {
        return v.key + ' ' + (v.drawing.drawingDigest || 'unknown');
      }).join(', ');
      var d = compose(g, nodes, out, {
        pitch: Math.min.apply(null, list.map(function (v) { return pitchOf(v.drawing); })),
        top: Math.min.apply(null, list.map(function (v) { return topOf(v.drawing); }))
      });
      d.w = Math.max.apply(null, list.map(function (v) { return v.drawing.w; }));
      return d;
    }

    function repaint() {
      if (!CANON) return;
      if (!WIN) {
        WINFO = { on: false, hidden: [], shown: CANON.nodes.map(function (n) { return n.id; }),
                  off: { tiles: 0, relationships: 0, lines: 0 },
                  canonNodes: CANON.nodes.length, canonEdges: CANON.edges.length,
                  drawnEdges: CANON.edges.length,
                  digest: CANON.drawingDigest || 'unknown',
                  lanes: (CANON.bands || []).map(function (b) {
                    var n = 0;
                    CANON.nodes.forEach(function (x) {
                      if (x.x >= b.x && x.x <= b.x + b.w) n++;
                    });
                    return { key: b.key, label: (b.lines && b.lines[0]) || b.label || b.key,
                             shown: n, of: n };
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
      // Issue 136. The scope's drawings in, one drawing out, and the caller then hands it to
      // draw() exactly as it hands over a built artefact. It is here rather than in a module of
      // its own because it is the build's own pack(), the build's own two edge shapes and the
      // build's own chip slide over a different node set, and every one of those lives in this
      // file behind `reflowCheck()`.
      union: union,
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
      // Issue 145. See PAINTS above.
      paints: function () { return PAINTS; },
      reflowCheck: function () { return faithful(CANON); },
      // The canonical drawing, as the build wrote it, whatever the window is doing. The digest
      // belongs to THIS and not to what is on screen, which is why a capture filed off a filtered
      // drawing has to say so rather than quoting a digest of a picture nobody is looking at.
      canonical: function () { return CANON; },
      // AND NO `capButtons` BESIDE IT. Issue 106. One stood here handing the lane heading groups
      // out to whoever asked, and `git log -S` finds one commit for the name, the one that added
      // it. Nothing in site/ and nothing in scripts/smoke.mjs, which after issue 109 is the whole
      // of the driving, has ever called it. The suite reaches those controls through DOM
      // selectors, which is the right way round, since a driver taking them from here would be
      // testing the list this file keeps rather than the buttons the reader presses. An export
      // with no caller is a claim that something outside depends on it, and the next edit inside
      // pays that claim for nothing.
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
