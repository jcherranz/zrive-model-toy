// Board view. A second view at #/board that renders site/board.json, which is generated
// from GitHub Issues. This file only reads it. Nothing is written back, there is no drag and
// drop, and the board carries no state of its own: GitHub is the source of truth and the
// board is a picture of it taken at generation time.
//
// board.json is fetched same origin and nothing else on this page reaches the network.
(function () {
  'use strict';

  var SHAPE = 'expected {"generated": "...", "columns": [{"key": "...", "title": "...", ' +
              '"cards": [{"id": 1, "title": "...", "labels": [], "url": "..."}]}]}';

  var body = document.body;
  var nav = document.getElementById('navview');
  var meta = document.getElementById('bmeta');
  var host = document.getElementById('bbody');
  var loaded = false;

  function note(html) {
    var d = document.createElement('div');
    d.className = 'bnote';
    d.innerHTML = html;
    host.textContent = '';
    host.appendChild(d);
  }

  // Chips are the one place the board is allowed a colour of its own, so the hue comes from
  // the label text itself and the saturation and lightness are fixed. Any label set, however
  // it grows, lands inside the same tonal range.
  function chipStyle(text) {
    var h = 0, i;
    for (i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
    return 'background:hsl(' + h + ',42%,92%);color:hsl(' + h + ',34%,31%)';
  }

  function card(c) {
    var a = document.createElement(c && c.url ? 'a' : 'div');
    a.className = 'bcard';
    if (c && c.url) { a.href = c.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; }

    var num = document.createElement('div');
    num.className = 'bnum';
    num.textContent = c && (c.id || c.id === 0) ? '#' + c.id : 'no number';
    a.appendChild(num);

    var t = document.createElement('p');
    t.className = 'btitle';
    t.textContent = (c && c.title) || 'untitled';
    a.appendChild(t);

    var labels = (c && Array.isArray(c.labels)) ? c.labels : [];
    if (labels.length) {
      var box = document.createElement('div');
      box.className = 'blabels';
      labels.forEach(function (l) {
        var s = document.createElement('span');
        s.className = 'chip';
        s.textContent = String(l);
        s.setAttribute('style', chipStyle(String(l)));
        box.appendChild(s);
      });
      a.appendChild(box);
    }
    return a;
  }

  function column(col) {
    var d = document.createElement('div');
    d.className = 'bcol';
    var h = document.createElement('h2');
    h.textContent = (col && (col.title || col.key)) || 'untitled column';
    var n = document.createElement('span');
    var cards = (col && Array.isArray(col.cards)) ? col.cards : [];
    n.textContent = cards.length;
    h.appendChild(n);
    d.appendChild(h);
    if (!cards.length) {
      var e = document.createElement('p');
      e.className = 'bempty';
      e.textContent = 'nothing here';
      d.appendChild(e);
    } else {
      cards.forEach(function (c) { d.appendChild(card(c)); });
    }
    return d;
  }

  function render(data) {
    if (!data || !Array.isArray(data.columns)) {
      note('<b>board.json is present but not in the shape this view reads.</b><br>' + SHAPE);
      return;
    }
    if (data.generated) {
      meta.textContent = 'Generated ' + data.generated +
        '. The board reflects GitHub Issues. GitHub is the source of truth.';
    }
    var wrap = document.createElement('div');
    wrap.className = 'bcols';
    data.columns.forEach(function (c) { wrap.appendChild(column(c)); });
    host.textContent = '';
    host.appendChild(wrap);
  }

  function load() {
    if (loaded) return;
    loaded = true;
    note('Loading the board.');
    fetch('board.json', { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function (text) {
      var data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        note('<b>board.json could not be read as JSON.</b><br>' + SHAPE);
        return;
      }
      render(data);
    }).catch(function (err) {
      note('<b>No board yet.</b><br>This view reads <code>board.json</code>, which is ' +
           'generated from GitHub Issues and published beside this page. It is not there ' +
           'yet (' + String(err.message || err) + '). File an issue with the feedback ' +
           'button and it will appear here once the board has been generated.');
    });
  }

  function route() {
    var onBoard = location.hash === '#/board';
    body.classList.toggle('board', onBoard);
    if (nav) {
      nav.textContent = onBoard ? 'diagram' : 'board';
      nav.setAttribute('href', onBoard ? '#/' : '#/board');
    }
    if (onBoard) load();
  }

  window.addEventListener('hashchange', route);
  route();
})();
