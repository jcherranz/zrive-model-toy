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

  // The status label is what put the card in its column, so printing it on the card as well
  // says the same thing twice and gives the reader a second place to check it. The column
  // heading owns that fact; the chips carry only what the column does not already say.
  function shown(labels) {
    return labels.filter(function (l) { return String(l).indexOf('status:') !== 0; });
  }

  // Cards are ordered by issue number, ascending, which is the order they were filed in. It is
  // the only order the board holds that means anything: board.json carries no dates, and a
  // number never changes, so the same issues always land in the same places. Done is the one
  // exception and is drawn newest first, because a column of finished work is read at the end
  // that just moved.
  function byNumber(a, b) {
    var x = a && typeof a.id === 'number' ? a.id : Infinity;
    var y = b && typeof b.id === 'number' ? b.id : Infinity;
    return x - y;
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

    var labels = shown((c && Array.isArray(c.labels)) ? c.labels : []);
    if (labels.length) {
      var box = document.createElement('div');
      box.className = 'blabels';
      labels.forEach(function (l) {
        var s = document.createElement('span');
        s.className = 'chip';
        s.textContent = String(l);
        box.appendChild(s);
      });
      a.appendChild(box);
    }
    return a;
  }

  // An address out of board.json is only followed if it is an issues list on github.com, the
  // same rule the board link below obeys, so the page cannot be pointed somewhere else by an
  // edit to board.json. An address that fails the test costs the reader the link, not the line.
  function issuesHref(url) {
    return (typeof url === 'string' &&
      /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/issues(\?[\w%+=:.-]*)?$/.test(url)) ? url : null;
  }

  // The Done column is capped by the generator, and the generator also keeps issues closed as
  // not planned off the board altogether, so the cards the column holds are not all the closed
  // issues it stands for. The remainder is printed under them, as a line rather than a card,
  // because it names work that is off the board. It says "closed" and not "done": the count
  // covers duplicates and wontfixes as well as finished cards, and calling those done would be
  // the same false claim the column used to make by drawing them. An older board.json carries
  // neither field, and a board with nothing hidden carries a zero; both draw nothing.
  function more(col) {
    var n = col && typeof col.hidden === 'number' ? col.hidden : 0;
    if (!(n > 0)) return null;
    var href = issuesHref(col.hiddenUrl);
    var e = document.createElement(href ? 'a' : 'p');
    e.className = 'bmore';
    // The phrase carries no noun, so it is already right at one and needs no plural branch:
    // "and 1 more closed" and "and 16 more closed" both read.
    e.textContent = 'and ' + n + ' more closed';
    if (href) { e.href = href; e.target = '_blank'; e.rel = 'noopener noreferrer'; }
    return e;
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
      // An empty column is a fact about the work, not a failure to load, so it keeps its
      // heading and its count and says plainly that it holds nothing.
      d.classList.add('bcol-empty');
      var e = document.createElement('p');
      e.className = 'bempty';
      e.textContent = 'no issues';
      d.appendChild(e);
    } else {
      // Done arrives newest first from the generator and stays in the order it arrives in; the
      // other columns are sorted here so a hand-edited board.json still draws in filing order.
      var list = col && col.key === 'done' ? cards.slice() : cards.slice().sort(byNumber);
      list.forEach(function (c) { d.appendChild(card(c)); });
    }
    var rest = more(col);
    if (rest) d.appendChild(rest);
    return d;
  }

  // The one link out of the board, back to the list it is a picture of. The address is taken
  // from a card rather than written here, and only if it is an issue URL on github.com, so the
  // page cannot be made to link somewhere else by editing board.json.
  function issuesUrl(data) {
    var found = null;
    data.columns.forEach(function (col) {
      ((col && col.cards) || []).forEach(function (c) {
        var m = c && typeof c.url === 'string' &&
          c.url.match(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/issues\/\d+$/);
        if (m && !found) found = c.url.replace(/\/\d+$/, '');
      });
    });
    return found;
  }

  function render(data) {
    if (!data || !Array.isArray(data.columns)) {
      note('<b>board.json is present but not in the shape this view reads.</b><br>' + SHAPE);
      return;
    }
    var href = issuesUrl(data);
    meta.textContent = '';
    meta.appendChild(document.createTextNode(
      (data.generated ? 'Generated ' + data.generated + '. ' : '') + 'The board reflects '));
    if (href) {
      var a = document.createElement('a');
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'GitHub Issues';
      meta.appendChild(a);
    } else {
      meta.appendChild(document.createTextNode('GitHub Issues'));
    }
    meta.appendChild(document.createTextNode(
      '. GitHub is the source of truth: nothing here is editable and there is no drag and drop.'));
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
