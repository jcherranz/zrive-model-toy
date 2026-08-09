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
    var i = document.createElement('i');
    i.style.background = t.c;
    s.appendChild(i);
    s.appendChild(document.createTextNode(t.label));
    legend.appendChild(s);
  });

  // ---- svg scaffolding -----------------------------------------------------
  var svg = document.getElementById('graph');
  svg.setAttribute('viewBox', '0 0 ' + G.w + ' ' + G.h);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

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

  var nodeById = {}, edgesOf = {}, gfxNode = {}, gfxEdge = [];
  G.nodes.forEach(function (n) { nodeById[n.id] = n; edgesOf[n.id] = []; });

  // ---- edges ---------------------------------------------------------------
  G.edges.forEach(function (e, idx) {
    var g = el('g', {}, gEdge);
    el('path', { d: e.d, class: 'edge' }, g);
    el('path', {
      d: 'M0 0 L-6.5 2.6 L-6.5 -2.6 Z', class: 'arrow',
      transform: 'translate(' + e.ax + ',' + e.ay + ') rotate(' + e.aa + ')'
    }, g);

    var c = el('g', {}, gChip);
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
  G.nodes.forEach(function (n) {
    var col = COLOR[n.type];
    var g = el('g', { class: 'node', tabindex: 0, role: 'button' }, gNode);
    var titleEl = el('title', {}, g);
    titleEl.textContent = n.label + ' (' + TLABEL[n.type] + ')';

    if (n.count) {
      el('rect', { x: n.x - R + 5, y: n.y - R - 5, width: TILE - 6, height: TILE - 6,
                   rx: 5, fill: tint(col, 0.10), stroke: tint(col, 0.45) }, g);
      el('rect', { x: n.x - R + 2.5, y: n.y - R - 2.5, width: TILE - 6, height: TILE - 6,
                   rx: 5, fill: tint(col, 0.12), stroke: tint(col, 0.6) }, g);
    }
    var tile = el('rect', {
      class: 'tile-bg', x: n.x - R, y: n.y - R, width: TILE, height: TILE, rx: 6,
      fill: tint(col, 0.14), stroke: col
    }, g);

    var mark;
    if (n.count) {
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
      var t = el('text', { class: 'lbl', x: n.x, y: ty + i * G.lineH }, g);
      t.textContent = line;
    });

    g.addEventListener('click', function (ev) { ev.stopPropagation(); select(n.id); });
    g.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(n.id); }
    });
    gfxNode[n.id] = { g: g, tile: tile, mark: mark, col: col, count: !!n.count };
  });

  // ---- selection -----------------------------------------------------------
  var panel = document.getElementById('panel');
  var current = null;

  function paint(id, on) {
    var f = gfxNode[id];
    f.tile.setAttribute('fill', on ? 'var(--i-primary)' : tint(f.col, 0.14));
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
    document.getElementById('pnote').textContent =
      rel.length + (rel.length === 1 ? ' relationship: ' : ' relationships: ') + rel.join('; ');

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
  var canvas = document.getElementById('canvas');
  function reveal(n) {
    setTimeout(function () {
      var scale = svg.getBoundingClientRect().width / G.w;
      var want = n.x * scale - canvas.clientWidth / 2;
      var max = svg.getBoundingClientRect().width - canvas.clientWidth;
      canvas.scrollLeft = Math.max(0, Math.min(want, Math.max(0, max)));
    }, 30);
  }

  document.getElementById('close').addEventListener('click', clear);
  svg.addEventListener('click', clear);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') clear(); });

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
