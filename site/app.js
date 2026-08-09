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

  // ---- legend --------------------------------------------------------------
  var legend = document.getElementById('legend');
  G.types.forEach(function (t) {
    var s = document.createElement('span');
    if (t.ghost) s.className = 'ghost';
    var i = document.createElement('i');
    // The ghost swatch is an empty dashed box, the same shape the ghost tiles are drawn in,
    // so the legend entry and the thing it names are recognisably one mark.
    if (t.ghost) { i.style.borderColor = t.c; } else { i.style.background = t.c; }
    s.appendChild(i);
    s.appendChild(document.createTextNode(t.label));
    legend.appendChild(s);
  });

  // ---- svg scaffolding -----------------------------------------------------
  // The page holds two drawings, laid out independently by the build: G is one cohort and G2
  // is two. They are separate coordinate sets rather than one drawing with parts hidden,
  // because a hidden node still takes up room in a layout and would have moved the default
  // view. Switching between them therefore means redrawing, not toggling a class.
  var svg = document.getElementById('graph');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  var nodeById, edgesOf, gfxNode, gfxEdge;

  function draw(g) {
    G = g;
    svg.textContent = '';
    svg.setAttribute('viewBox', '0 0 ' + G.w + ' ' + G.h);
    if (window.ZT) window.ZT.build = G.build || 'unknown';

    // Column bands. One lane per kind of thing, captioned, so that instructors and session
    // templates are told apart by where they sit and not only by tile colour.
    var gBand = el('g', {}, svg);
    (G.bands || []).forEach(function (b) {
      el('rect', { class: 'band', x: b.x, y: G.bandTop, width: b.w, height: G.h - G.bandTop - 4 },
         gBand);
      var t = el('text', { class: 'band-cap', x: b.x + b.w / 2, y: G.bandTop - 7 }, gBand);
      t.textContent = b.label;
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

      if (n.count) {
        el('rect', { x: n.x - R + 5, y: n.y - R - 5, width: TILE - 6, height: TILE - 6,
                     rx: 5, fill: tint(col, 0.10), stroke: tint(col, 0.45) }, g);
        el('rect', { x: n.x - R + 2.5, y: n.y - R - 2.5, width: TILE - 6, height: TILE - 6,
                     rx: 5, fill: tint(col, 0.12), stroke: tint(col, 0.6) }, g);
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

      g.addEventListener('click', function (ev) { ev.stopPropagation(); select(n.id); });
      g.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(n.id); }
      });
      gfxNode[n.id] = { g: g, tile: tile, mark: mark, col: col, count: !!n.count,
                        ghost: !!n.ghost, rest: tile.getAttribute('fill') };
    });
  }

  draw(window.G);

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

  // Keep the selected node visible once the panel has taken its bite of the width.
  // Both the offset and the limit are read off the element that actually scrolls. The drawing
  // does not start at the canvas's scroll origin, because the canvas is padded, and the scroll
  // extent is the canvas's own scrollWidth and not the width of the drawing inside it: taking
  // either from the svg box left the last few pixels of the drawing out of reach.
  var canvas = document.getElementById('canvas');
  function reveal(n) {
    setTimeout(function () {
      var sr = svg.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
      var scale = sr.width / G.w;
      var at = (sr.left - cr.left) + canvas.scrollLeft + n.x * scale;
      var want = at - canvas.clientWidth / 2;
      var max = canvas.scrollWidth - canvas.clientWidth;
      canvas.scrollLeft = Math.max(0, Math.min(want, Math.max(0, max)));
    }, 30);
  }

  // ---- the second cohort on or off -----------------------------------------
  // Off by default. One cohort on one screen is the view that reads at a glance, and a second
  // cohort roughly doubles the column in the middle. It is worth having because the split
  // between a session template and a cohort session is the backbone of the model and one
  // cohort cannot show it: with two, the same six template objects carry two sets of dated
  // sessions taught by people who are not quite the same people, and the reason for the split
  // is on the page rather than in a document.
  //
  // Switching redraws from the other coordinate set and drops the selection with it, because
  // the two drawings do not hold all the same nodes and a selection cannot survive that.
  var TITLES = {
    off: ['Zrive operating model, one cohort as instances',
          'Programme Z-IB Investment Banking, cohort 1Q26, drawn as named instances joined by '
          + 'the verbs that relate them.'],
    on: ['Zrive operating model, two cohorts as instances',
         'Programme Z-IB Investment Banking, cohorts 1Q26 and 2Q26 off the same six session '
         + 'templates, drawn as named instances joined by the verbs that relate them.']
  };
  var c2Btn = document.getElementById('c2toggle');
  if (c2Btn && window.G2) {
    c2Btn.addEventListener('click', function () {
      var next = c2Btn.getAttribute('aria-pressed') !== 'true';
      c2Btn.setAttribute('aria-pressed', next ? 'true' : 'false');
      document.body.classList.toggle('two-cohorts', next);
      clear();
      draw(next ? window.G2 : window.G);
      var t = TITLES[next ? 'on' : 'off'];
      var h1 = document.getElementById('h1'), sub = document.getElementById('subtext');
      if (h1) h1.textContent = t[0];
      if (sub) sub.textContent = t[1];
      measureHeader();
    });
  } else if (c2Btn) {
    c2Btn.hidden = true;
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

  // What feedback.js needs in order to say what was on screen when a note was written.
  window.ZT = {
    build: G.build || 'unknown',
    selected: function () {
      if (!current) return null;
      var n = nodeById[current];
      return { id: n.id, label: n.label, type: TLABEL[n.type] };
    }
  };
})();
