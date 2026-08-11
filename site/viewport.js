// viewport: three numbers, and everything that is a rendering of them.
//
// Issue 71, seam 2 of issue 60. The drawing sits on a plane and the page is a window onto it.
// view.x and view.y are the point of the drawing under the top left corner of the window, in the
// drawing's own units, and view.k is how many screen pixels one of those units is worth.
// Everything else is derived from them and nothing else is stored, so the viewBox, the dot grid
// and the zoom readout cannot drift apart: they are three renderings of the same three numbers,
// written together in applyView().
//
// WHY THIS IS A BOUNDARY. Issue 46 built the whole of it, pan, zoom, fit, the anchored wheel, the
// pinch and the click-versus-drag threshold, and touched nothing else in the page. It is the
// cleanest instance of the owner's test in this repository: one card, one concern, one state of
// three numbers.
//
// WHAT IT KNOWS ABOUT THE REST OF THE PAGE, AND WHY EACH ITEM IS THERE.
//   extent()  the current drawing's w and h. The fit is a statement about that rectangle, and the
//             rectangle changes when the reader moves between the seven programmes.
//   header    the panel is a fixed overlay and the header runs the full width, so the band a node
//             has to be brought back into starts under the header.
//   panel     below the breakpoint the panel is a sheet across the bottom and the node it
//             describes is usually underneath it.
//   busy()    whether something else on the page owns the keyboard. The two answers that come
//             from outside are the student list and the programme list, both of which sit over
//             the canvas: a digit typed there is not an instruction to move a drawing the reader
//             cannot see. The guards that are about this page rather than about another module,
//             a modifier, a form field, the board and the capture popover, are kept here.
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
(function () {
  'use strict';

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
  // The wheel, at two rates, because one wheel event is two different devices. A mouse notch is a
  // whole 120 pixels at a time and 0.0022 turns exactly one notch into the 1.3 the + button steps
  // by, so the two controls agree; a trackpad pinch arrives as a stream of small deltas at a much
  // higher rate and needs 0.01 to travel at all. Issue 46 told the two apart by ctrlKey, which was
  // right for as long as ctrlKey over this box could only mean a pinch. Issue 76 gave ctrlKey its
  // other meaning, so they are told apart by the size of the delta instead, which is the property
  // that actually differs between a notched wheel and a trackpad.
  var WHEEL_FINE_PX = 40, ZOOM_FINE = 0.01, ZOOM_COARSE = 0.0022;

  function clampK(k) { return Math.max(K_MIN, Math.min(K_MAX, k)); }

  function dist(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function now() { return window.performance ? performance.now() : Date.now(); }

  var ZM = window.ZM = window.ZM || {};

  ZM.viewport = function createViewport(opts) {
    var svg = opts.svg, canvas = opts.canvas;
    var hdr = opts.header || null, panel = opts.panel || null;
    var extent = opts.extent;                 // function -> the drawing on screen
    var TILE = opts.tile;
    var busy = opts.busy || function () { return false; };

    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    var view = { x: 0, y: 0, k: 1 };
    var vw = 1, vh = 1;               // the window, in CSS pixels
    var fitted = false;               // has a real measurement been framed yet

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

    // The scale at which the whole drawing sits inside the window. The extent is the build's own
    // numbers for the drawing, which is the same pair the old fixed viewBox used, so a fitted
    // view frames exactly what this page framed before it could be moved at all.
    function fitScale() {
      var g = extent();
      var k = Math.min((vw - FIT_MARGIN * 2) / g.w, (vh - FIT_MARGIN * 2) / g.h);
      return (k > 0 && isFinite(k)) ? k : 1;
    }

    function fitView() {
      var g = extent();
      var k = clampK(fitScale());
      return { k: k, x: g.w / 2 - vw / (2 * k), y: g.h / 2 - vh / (2 * k) };
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

    function startPan(x, y, isDrag) {
      gest = { mode: 'pan', sx: x, sy: y, vx: view.x, vy: view.y, t0: now(),
               far: 0, drag: !!isDrag };
      if (isDrag) canvas.classList.add('panning');
    }

    function startPinch() {
      var ids = Object.keys(ptrs);
      var a = ptrs[ids[0]], b = ptrs[ids[1]];
      gest = { mode: 'pinch', d: dist(a, b), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2,
               drag: true };
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
    // THE WHEEL ZOOMS ONLY WITH A MODIFIER, AND A BARE WHEEL PANS. Issue 76, and it reverses a
    // decision issue 46 made rather than repairing a fault in it. #46's reasoning was that over
    // this box the wheel is always a zoom, so there is no case in which the event is looked at
    // and handed back; the owner read the page, scrolled, watched the drawing jump, and asked for
    // the modifier. What is kept from #46 is the shape of that argument: one of the two things
    // below always happens, so the event is still never handed back and preventDefault is still
    // unconditional.
    //
    // THE MODIFIER IS ctrlKey OR metaKey, and each is there for a different reader.
    //   ctrlKey   what the owner asked for, and the zoom modifier on Windows and on Linux.
    //   metaKey   Cmd, which is the same gesture on a Mac, where Ctrl is not the document
    //             modifier.
    //   ctrlKey   again, and this is the one that is easy to break: a macOS trackpad pinch is
    //             delivered as a wheel event with ctrlKey already set by the system, which is how
    //             every browser detects a pinch. So the pinch #46 built keeps its path here for
    //             free, and the delta size rather than the modifier now picks its rate.
    // Not altKey and not shiftKey. Shift plus wheel is horizontal scrolling on every platform,
    // and it therefore has to pan.
    //
    // WHY A BARE WHEEL PANS RATHER THAN BEING HANDED BACK TO THE BROWSER. Handing it back is the
    // other honest answer and it was measured before it was rejected: on this page the scrolling
    // element's scrollHeight equals its clientHeight at 1536x839, at 1440x900 and at 390x844, so
    // there is nothing for the browser to scroll and a bare wheel would do nothing whatsoever. A
    // reader who scrolls and sees no movement learns nothing and has no reason to try a modifier.
    // Panning is also what this drawing already is: #46 built it as an infinite canvas in the
    // sense of Figma, Miro and Obsidian Canvas, and in all three a bare wheel moves the plane and
    // a modifier scales it. deltaX is carried too, so a trackpad's sideways scroll pans sideways.
    //
    // AND WHY THE LISTENER IS STILL NOT PASSIVE. A passive listener may not call preventDefault
    // at all, and Ctrl plus wheel is the browser's own page zoom. Without the preventDefault the
    // browser would scale the whole document underneath the drawing while the drawing scaled
    // itself, which is two zooms for one gesture. Driven and read off visualViewport.scale rather
    // than reasoned about: it stays at 1 across the gesture.
    //
    // Off the box the wheel is untouched, which is what keeps the detail panel scrolling with the
    // wheel and the board view, a different route that does not draw this element at all,
    // scrolling exactly as it did.
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
    canvas.addEventListener('wheel', function (e) {
      var zooming = e.ctrlKey || e.metaKey;
      e.preventDefault();
      var dx = e.deltaX, dy = e.deltaY;
      if (e.deltaMode === 1) { dx *= 16; dy *= 16; }          // lines
      else if (e.deltaMode === 2) { dx *= vw; dy *= vh; }     // pages
      if (!zooming) {
        if (!dx && !dy) return;
        // The delta is screen pixels and the view is in the drawing's units, so it is divided by
        // the scale exactly as a drag is. A wheel therefore moves the drawing by the same amount
        // a drag of the same distance would, at every zoom.
        view.x += dx / view.k;
        view.y += dy / view.k;
        applyView();
        return;
      }
      var f = Math.exp(-dy * (Math.abs(dy) < WHEEL_FINE_PX ? ZOOM_FINE : ZOOM_COARSE));
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
    function init() {
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
        var b = document.getElementById(id);
        if (b) b.addEventListener('click', f);
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
        if (busy()) return;
        if (e.key === '0') { e.preventDefault(); fit(); }
        else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomStep(1.3); }
        else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomStep(1 / 1.3); }
      });
    }

    // A route change refits, but through the same door a first paint uses rather than by calling
    // fit() directly. On a route change arriving from #/board the canvas is still display:none at
    // this instant, since board.js answers the same hashchange and loads after app.js, so a fit()
    // taken now would frame a box of nothing. Dropping the flag makes the next real measurement
    // the fit, which is the path the page already has for a canvas that has just been given a
    // size.
    function refit() {
      fitted = false;
      measure();
      if (vw > 2 && vh > 2) { fitted = true; fit(); }
    }

    return {
      init: init,
      fit: fit,
      refit: refit,
      ensureVisible: ensureVisible,
      // The three numbers and the window they are measured against, for a driver to read and
      // assert against rather than for the page: an anchored zoom is a claim about arithmetic and
      // the only honest way to check it is to take the numbers off the running page.
      state: function () { return { x: view.x, y: view.y, k: view.k, w: vw, h: vh }; }
    };
  };
})();
