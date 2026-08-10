// Visual feedback capture, ported from monetary-lab's web/src/feedback.js, whose interaction
// the principal already uses. The header toggle puts the page into a mode where a click on any
// element is intercepted and described, and the note written about it is filed as a GitHub
// issue: straight to the Issues API when a credential has been connected in this browser, and
// through a prefilled issue form when it has not. The two paths build the same body, so
// nothing reading the issue afterwards can tell which one produced it.
//
// Fully isolated from the page's own click handling: while capture mode is on, the listener
// below runs in the capture phase and preventDefault/stopPropagates, so selecting a node, the
// clear-on-background click and the panel all stand still and the note is written about the
// screen as it was.
//
// SAFETY. This site is publicly readable and these bytes carry no credential. A fine-grained
// personal access token, if the reader chooses to connect one, is held in this browser's
// localStorage under zmt.gh.token, is never written into a file, and is sent to api.github.com
// and nowhere else. That POST is the only request this file can make, it happens only when a
// token is connected and the reader deliberately files, and there is no analytics, font or CDN
// request anywhere in it.
(function () {
  'use strict';

  var REPO = 'jcherranz/zrive-model-toy';
  var TOKEN_KEY = 'zmt.gh.token';   // browser-local only, see the connect UI below
  var BOARD_HREF = '#/board';       // this project's board view, not a separate page
  var CATEGORIES = ['bug', 'data model', 'layout', 'idea'];
  var TOGGLE_ID = 'fbtoggle';

  var fbMode = false;
  var popoverEl = null;
  var items = [];                   // accumulated FEEDBACK blocks this session, for "copy all"
  // Typed but unfiled notes, keyed by the descriptor of the element they are about. A note
  // survives every way of closing the popover, so the Escape that leaves capture mode and the
  // 3 that closes the box are no longer ways of losing a sentence somebody wrote.
  var drafts = {};

  // ---- context ---------------------------------------------------------------------------
  // monetary-lab pins a note to a permalink encoding the whole model state. The equivalent here
  // is the state of the drawing: which node was selected, which view was on screen, the viewport
  // it was drawn into, and, above all, the commit the page was deployed from, because the whole
  // point of the context block is that a reader of the report can go and look at the code the
  // reporter saw.
  //
  // ISSUE 47. That last line used to read `build: 469ad3c`, a seven character digest of the
  // drawing's geometry. It looks exactly like an abbreviated commit, so it invited one action,
  // and that action failed: `git cat-file -t 469ad3c` answers "not a valid object name". Worse,
  // it moved only when the layout was regenerated, so four cards filed across two deploys of
  // real code all carried the same value, and on #41 a stamp that looked stale was briefly taken
  // as evidence that the reporter was on a cached page, which they were not.
  //
  // The commit is now written at deploy time into site/version.js and read from window.ZV here,
  // directly rather than through window.ZT, because the runtime-error notice below files reports
  // in exactly the runs where app.js has thrown and window.ZT may never have been published.
  //
  // The full forty characters, not an abbreviation. It is the value a reader will paste into
  // `git show`, and at full length nothing else in this block can be mistaken for it: the
  // drawing digest stays, under a name that says what it is and with its algorithm in front of
  // it, because it still answers the one question the commit cannot, whether two pages are
  // drawing the same geometry.
  // Honest rather than blank, and honest rather than plausible, in three states rather than two.
  // A stamp that loaded and names no commit is an unpublished copy of the site, which is an
  // ordinary thing to be. No stamp at all is a different report: site/version.js did not load,
  // so the page is either older than this mechanism or served incompletely, and a reader chasing
  // it needs to know that the file is missing rather than that it said nothing.
  function commitLine() {
    var zv = window.ZV;
    if (!zv) {
      return 'none, and this page carries no deploy stamp at all: version.js did not load, so ' +
             'the page is either older than the stamp or was served without it';
    }
    if (!zv.commit) {
      return 'none. This page was not published by the deploy workflow, so there is no commit ' +
             'it can name: it is a local or unstamped copy of the site' +
             (zv.source ? ' (' + zv.source + ')' : '');
    }
    return zv.commit + (zv.deployedAt ? ', deployed ' + zv.deployedAt : '');
  }

  function drawingLine() {
    var zt = window.ZT || {};
    var d = zt.drawingDigest;
    if (!d) return 'unknown, the drawing did not report one';
    return 'sha256:' + d + ', a digest of the drawing and not a commit';
  }

  function contextPairs() {
    var zt = window.ZT || {};
    var sel = typeof zt.selected === 'function' ? zt.selected() : null;
    return [
      ['selected node', sel ? sel.label + ' (' + sel.type + ', id ' + sel.id + ')' : 'none'],
      ['view', document.body.classList.contains('board') ? 'board' : 'diagram'],
      ['viewport', window.innerWidth + ' by ' + window.innerHeight],
      ['commit', commitLine()],
      ['drawing', drawingLine()],
      ['page', location.href]
    ];
  }

  function contextText() {
    return contextPairs().map(function (p) { return p[0] + ': ' + p[1]; }).join('\n');
  }

  function safeContext() {
    try { return contextText(); } catch (e) { return 'page: ' + location.href; }
  }

  // ---- issue shaping ---------------------------------------------------------------------
  // A card's title is the only thing a board column shows. board.js paints it as the .btitle
  // line and lets it wrap inside a column whose minimum is 200px, so about thirty characters of
  // that 12px type fit on a line and seventy characters are two and a half lines: seventy is
  // kept as the limit, because the length was never what was wrong. Where the cut fell was.
  //
  // Issue 44: card #42 arrived titled "Remove the second cohort. Every time I see something, it
  // must be one c", cut in the middle of a word at exactly seventy characters, because the title
  // was the note's first line sliced to a fixed length with nothing looked at but the count. A
  // title that stops mid-word reads as damage; one that stops on a boundary reads as a headline.
  // So the boundaries the writer already put there are used first, in the order they carry
  // meaning: a line break, then a sentence end. Only when the note offers neither inside the
  // limit is it cut on a word boundary, and then it is marked with an ellipsis so it is visibly
  // a fragment rather than a complete but strange title.
  var TITLE_MAX = 70;
  var ELLIPSIS = '…';

  // Dots that do not end a sentence. These are the ones a note actually contains; a decimal
  // needs no entry, because a sentence end here must be followed by whitespace or by the end of
  // the note and the dot in "3.5" is followed by a digit.
  var NOT_SENTENCE_END = {
    'e.g': 1, 'i.e': 1, 'etc': 1, 'vs': 1, 'cf': 1, 'al': 1, 'fig': 1, 'approx': 1,
    'mr': 1, 'mrs': 1, 'ms': 1, 'dr': 1, 'prof': 1, 'st': 1, 'jr': 1, 'sr': 1,
    'inc': 1, 'ltd': 1, 'co': 1
  };

  // Words a truncated title must not end on. Left dangling in front of an ellipsis they read as
  // a sentence that lost its object, which is the same defect as a mid-word cut wearing a space.
  var DANGLING = {
    'a': 1, 'an': 1, 'the': 1, 'and': 1, 'or': 1, 'but': 1, 'of': 1, 'to': 1, 'in': 1, 'on': 1,
    'at': 1, 'by': 1, 'for': 1, 'from': 1, 'with': 1, 'as': 1, 'into': 1, 'onto': 1, 'over': 1,
    'under': 1, 'than': 1, 'that': 1, 'which': 1, 'while': 1, 'when': 1, 'if': 1, 'is': 1,
    'are': 1, 'was': 1, 'were': 1, 'be': 1, 'been': 1, 'it': 1, 'its': 1, 'this': 1, 'these': 1,
    'those': 1, 'their': 1, 'my': 1, 'our': 1, 'your': 1, 'not': 1, 'so': 1, 'then': 1,
    'per': 1, 'via': 1
  };

  // Trailing punctuation and trailing whitespace, stripped before an ellipsis is added.
  var TAIL_JUNK = /[\s,;:.!?\/&|\-–—…(\[{"'‘“]+$/;

  // The first line, with runs of whitespace flattened. Somebody who pressed Enter has already
  // said where the headline ends, so a line break outranks every rule below it.
  function titleSource(s) {
    return String(s == null ? '' : s).trim().split(/[\r\n]/)[0].replace(/\s+/g, ' ').trim();
  }

  // Where each sentence ends, one past its closing punctuation. A candidate is rejected when the
  // token in front of it is a known abbreviation, a bare initial or list marker, or is dotted by
  // hand like "e.g" and "U.S": that rejection is the whole difference from splitting naively on
  // the full stop, which cuts inside the abbreviation instead of after the sentence.
  function sentenceEnds(text) {
    var re = /[.!?]+["'’”)\]]*(?=\s|$)/g;
    var ends = [];
    var m;
    while ((m = re.exec(text))) {
      var token = (text.slice(0, m.index).match(/\S+$/) || [''])[0];
      if (!token) continue;
      if (NOT_SENTENCE_END[token.toLowerCase()]) continue;
      if (token.length === 1) continue;
      if (/[A-Za-z]\.[A-Za-z]$/.test(token)) continue;
      ends.push(m.index + m[0].length);
    }
    return ends;
  }

  function wordTruncate(text, max) {
    var room = max - ELLIPSIS.length;
    var hard = text.slice(0, room);
    var head = hard;
    // Back off to the last space only when the limit landed inside a word. Landing exactly on a
    // space is already a word boundary and giving back another word would be a second cut.
    if (!/\s/.test(text.charAt(room))) {
      var sp = head.lastIndexOf(' ');
      if (sp > 0) head = head.slice(0, sp);
    }
    var cut = head.replace(TAIL_JUNK, '');
    var guard = 0;
    while (guard++ < 4) {
      var last = cut.match(/(^|\s)(\S+)$/);
      if (!last || !DANGLING[last[2].toLowerCase()]) break;
      cut = cut.slice(0, cut.length - last[2].length).replace(TAIL_JUNK, '');
    }
    // The word-boundary cut is right until the word that overflowed is longer than the whole
    // line, a pasted URL being the case that produced this: then no boundary can show it, and
    // backing off to the previous space throws the line away to protect a word nobody will ever
    // read whole. "Bug: https://…" as an eight character card is worse than a URL cut short. So
    // when the boundary keeps less than a third of the room, or erases the line completely, as a
    // run of punctuation does, the hard cut is used instead. That is the only place a word is
    // ever broken, and the ellipsis says so.
    if (cut && cut.length >= room / 3) return cut + ELLIPSIS;
    return (hard.replace(TAIL_JUNK, '') || hard) + ELLIPSIS;
  }

  function cardTitle(descriptor, note) {
    // The note titles the card; the descriptor is the fallback for a card filed without one,
    // which is how the runtime-error notice files. Unchanged, and it is truncated by the same
    // rules, since a descriptor carrying a text snippet and a DOM path also runs past the limit.
    var text = titleSource(note) || titleSource(descriptor);
    // Neither, which the Issues API answers with a 422 and the prefilled form with an unusable
    // card, so the control names itself rather than filing an empty title.
    if (!text) return 'feedback note';
    if (text.length <= TITLE_MAX) return text;
    // The last sentence ending inside the limit. When only one fits that is the first sentence,
    // which is the case #42 needed; when two short ones fit, both are more useful than one.
    var ends = sentenceEnds(text);
    var end = 0;
    for (var i = 0; i < ends.length; i++) { if (ends[i] <= TITLE_MAX) end = ends[i]; }
    if (end) return text.slice(0, end).trim();
    return wordTruncate(text, TITLE_MAX);
  }

  // The same field shape on both paths ("### Label\n\nvalue"), so a direct API POST and a
  // form-prefilled issue read identically to anything parsing the body later.
  function formField(label, value) {
    return '### ' + label + '\n\n' + ((value && String(value).trim()) || '_No response_') + '\n';
  }

  function issueBody(descriptor, context, note, priority, category) {
    return [
      formField('Type', category || 'idea'),
      formField('Priority', priority || 'P2'),
      formField('Status', 'raw'),
      formField('Note', note),
      formField('Element', descriptor),
      formField('Context', context)
    ].join('\n');
  }

  function issueLabels(category) {
    return ['feedback', category || 'idea'];
  }

  function issueUrl(descriptor, context, note, priority, category) {
    var params = new URLSearchParams({
      title: cardTitle(descriptor, note),
      body: issueBody(descriptor, context, note, priority, category),
      labels: issueLabels(category).join(',')
    });
    return 'https://github.com/' + REPO + '/issues/new?' + params.toString();
  }

  // GitHub returns 401 when the token itself is rejected (invalid, expired, malformed), and
  // deliberately returns 404 rather than 403 when the token is well formed but cannot reach
  // the resource (a private repository it was not granted, or a missing permission): a 404
  // avoids confirming a private repository's existence to a caller without access to it. This
  // repository is private, so that is the failure a reader will actually meet. Both cases are
  // token configuration and not a request bug, so the hint says what to check rather than
  // repeating the status.
  function explainStatus(status, ghMessage) {
    var detail = ghMessage ? ': ' + ghMessage : '';
    if (status === 401) {
      return 'GitHub API 401' + detail + '. The token itself is invalid or expired; ' +
             'disconnect and reconnect with a fresh fine-grained PAT.';
    }
    if (status === 404) {
      return 'GitHub API 404' + detail + '. The token is not reaching this repo. On the ' +
             'token’s settings, check: 1) Repository access explicitly includes ' +
             'zrive-model-toy; 2) it has the "Issues: Read and write" permission; 3) it is ' +
             'not expired or created under a different GitHub account.';
    }
    return 'GitHub API ' + status + detail;
  }

  // ---- the credential --------------------------------------------------------------------
  // Held in localStorage only, namespaced, sent nowhere but api.github.com. Trimmed on every
  // read: a pasted token with a trailing newline is otherwise sent verbatim in the header and
  // fails as a stray 401, and after trimming a whitespace-only stored value reads back as ""
  // so callers correctly treat it as no token rather than sending a blank credential.
  function getToken() {
    try { return (localStorage.getItem(TOKEN_KEY) || '').trim(); } catch (e) { return ''; }
  }

  function setToken(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) { /* localStorage unavailable: the connect UI just will not persist */ }
  }

  // Shared filing core. With a token, POST straight to the Issues API; without one, or on any
  // failure (bad or expired token, rate limit, network error, validation error), fall back to
  // the prefilled issue form, so filing never becomes impossible. Used by the capture popover
  // and by the runtime-error notice, so every path files an identically shaped issue.
  function fileIssue(descriptor, context, note, priority, category) {
    var token = getToken();
    var fallback = function (result) {
      window.open(issueUrl(descriptor, context, note, priority, category), '_blank', 'noopener');
      return result;
    };
    if (!token) return Promise.resolve(fallback({ ok: false, noToken: true }));

    return fetch('https://api.github.com/repos/' + REPO + '/issues', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: cardTitle(descriptor, note),
        body: issueBody(descriptor, context, note, priority, category),
        labels: issueLabels(category)
      })
    }).then(function (res) {
      if (res.ok) {
        return res.json().then(function (data) {
          return { ok: true, number: data.number, url: data.html_url };
        });
      }
      return res.json().catch(function () { return null; }).then(function (j) {
        throw new Error(explainStatus(res.status, j && j.message ? j.message : ''));
      });
    }).catch(function (err) {
      return fallback({ ok: false, error: (err && err.message) || 'request failed' });
    });
  }

  // ---- describing what was clicked -------------------------------------------------------
  // Short "tag>tag>tag" ancestry so the click can be re-located even without an id.
  function domPath(el, depth) {
    var parts = [];
    var n = el;
    depth = depth || 5;
    while (n && n.tagName && parts.length < depth) {
      parts.unshift(String(n.tagName).toLowerCase());
      n = n.parentElement;
    }
    return parts.join('>');
  }

  // A concise descriptor: the element's own id, else the nearest ancestor id or diagram key
  // (data-node for an instance, data-edge for a relationship, both written by app.js), else a
  // short class hint; plus a text snippet and the DOM path, so the element can be found again
  // precisely. The walk stops at the nearest ancestor carrying either, so a click on a verb
  // chip names its relationship rather than #graph, the id of the whole drawing.
  function diagramKey(el, prefix) {
    if (!el.dataset) return '';
    if (el.dataset.node) return prefix + '[data-node="' + el.dataset.node + '"]';
    if (el.dataset.edge) return prefix + '[data-edge="' + el.dataset.edge + '"]';
    return '';
  }

  function describe(el) {
    if (!el || !el.tagName) return 'unknown';
    var idPart = el.id ? '#' + el.id : '';
    var nodePart = diagramKey(el, '');
    if (!idPart && !nodePart) {
      var a = el.parentElement;
      while (a && a !== document.body) {
        nodePart = diagramKey(a, 'ancestor ');
        if (nodePart) break;
        if (a.id) { idPart = 'ancestor #' + a.id; break; }
        a = a.parentElement;
      }
    }
    var classes = el.classList && el.classList.length
      ? '.' + Array.prototype.slice.call(el.classList, 0, 2).join('.')
      : '';
    var text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    var bits = [];
    if (idPart) bits.push(idPart);
    if (nodePart) bits.push(nodePart);
    if (!idPart && !nodePart && classes) bits.push(classes);
    if (text) bits.push('"' + text + (text.length >= 40 ? '…' : '') + '"');
    bits.push(domPath(el));
    return bits.join(' · ');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function buildBlock(descriptor, context, note) {
    return 'FEEDBACK\n- element: ' + descriptor +
           '\n- note: ' + (note || '').trim() +
           '\n- context:\n  ' + String(context).split('\n').join('\n  ');
  }

  function copyText(text, btn) {
    var orig = btn ? btn.textContent : '';
    var done = function (ok) {
      if (!btn) return;
      btn.textContent = ok ? 'copied ✓' : 'copy failed';
      setTimeout(function () { btn.textContent = orig; }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); },
                                              function () { done(false); });
    } else {
      done(false);
    }
  }

  // ---- mode and capture ------------------------------------------------------------------
  function setMode(on) {
    fbMode = on;
    document.body.classList.toggle('fb-mode', fbMode);
    var toggle = document.getElementById(TOGGLE_ID);
    if (toggle) {
      toggle.classList.toggle('on', fbMode);
      toggle.setAttribute('aria-pressed', String(fbMode));
      toggle.textContent = fbMode ? 'feedback: on (Esc to exit)' : 'feedback';
    }
    if (!fbMode) closePopover();
  }

  function onCapture(e) {
    if (!fbMode) return;
    // Normal clicks inside the popover itself (the note, the buttons, the board link) and on
    // the toggle (so a second click turns the mode back off) are left alone.
    if (popoverEl && popoverEl.contains(e.target)) return;
    if (e.target.closest && e.target.closest('#' + TOGGLE_ID)) return;
    e.preventDefault();
    e.stopPropagation();
    openPopover(e.target, e.clientX, e.clientY);
  }

  // Shortcuts while the popover is open: 1 copy, 2 copy all, 3 close, 4 file. They stand down
  // while the note or the token field has focus, so digits typed into a note are safe.
  // Shift+Enter is the one exception and fires filing from anywhere in the popover, so a note
  // can be written and filed without reaching for the mouse. Plain Enter is left untouched
  // everywhere, which is the point: a stray Enter in the note or the token field never files.
  //
  // Registered in the capture phase, unlike monetary-lab's, because app.js clears the diagram
  // selection on Escape and that selection is what the note is about.
  function onKey(e) {
    if (e.key === 'Escape' && fbMode) {
      e.stopPropagation();
      setMode(false);
      return;
    }
    if (!popoverEl || !popoverEl._actions) return;
    if (e.key === 'Enter' && e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      popoverEl._actions.file();
      return;
    }
    var active = document.activeElement;
    var inField = active && active.classList &&
      (active.classList.contains('fb-note') || active.classList.contains('fb-gh-input'));
    if (inField || e.metaKey || e.ctrlKey || e.altKey) return;
    var map = { '1': 'copy', '2': 'copyall', '3': 'close', '4': 'file' };
    var act = map[e.key];
    if (act && popoverEl._actions[act]) { e.preventDefault(); popoverEl._actions[act](); }
  }

  // ---- popover ---------------------------------------------------------------------------
  // Closing keeps the note. _saveDraft is written by openPopover and is the only thing that
  // knows which textarea belongs to this box, so every close goes through here: the button,
  // the 3 shortcut, the Escape that leaves capture mode, and the close that precedes opening
  // the next popover.
  function closePopover() {
    if (popoverEl) {
      if (popoverEl._saveDraft) { try { popoverEl._saveDraft(); } catch (e) { /* never block */ } }
      popoverEl.remove();
      popoverEl = null;
    }
  }

  // The box is placed in the band between the header and the footer, never over either.
  //
  // The header is not ordinary furniture here: its own toggle is the one element capture mode
  // exempts from capture, so that the mode can be turned off. A popover drawn across it takes
  // that exemption back, which is what issue 22 was. Both edges are read from live rects and
  // not from offsetHeight, because below the breakpoint the page scrolls and neither the
  // header nor the footer is pinned to the viewport: a header scrolled out of view reserves
  // nothing, and a footer below the fold reserves nothing either.
  function positionNear(box, x, y) {
    box.style.left = '0px';
    box.style.top = '0px';
    box.style.maxHeight = '';
    var w = box.offsetWidth || 300;
    var h = box.offsetHeight || 200;

    var hdrEl = document.querySelector('header');
    var hr = hdrEl ? hdrEl.getBoundingClientRect() : null;
    var floor = (hr && hr.bottom > 8) ? hr.bottom + 6 : 8;
    var ftrEl = document.querySelector('footer');
    var fr = ftrEl ? ftrEl.getBoundingClientRect() : null;
    var ceil = window.innerHeight - 8;
    if (fr && fr.top < window.innerHeight) ceil = Math.min(ceil, fr.top - 6);
    if (ceil - floor < 120) ceil = Math.min(window.innerHeight - 8, floor + 120);

    // Once the box is taller than the band it has to fit in, it scrolls inside itself rather
    // than growing past one of the two edges. A note half off the screen cannot be filed.
    if (h > ceil - floor) {
      box.style.maxHeight = (ceil - floor) + 'px';
      box.style.overflowY = 'auto';
      h = box.offsetHeight;
    }

    var left = x + 12;
    var top = y + 12;
    if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8;
    if (left < 8) left = 8;
    if (top + h > ceil) top = ceil - h;
    if (top < floor) top = floor;
    box.style.left = left + 'px';
    box.style.top = top + 'px';
  }

  // The connect affordance inside the popover: an inline field and a save button while nothing
  // is stored, a connected line with a disconnect once something is. Re-rendered from
  // localStorage after every save and disconnect rather than computed once.
  //
  // The note names the trap in the token form rather than only the end state it wants. GitHub
  // preselects "Repository access: Public repositories (read-only)", and while that radio is
  // selected the form does not offer the Issues permission at all, so a reader who fills in
  // only the permissions section produces a token that cannot reach this private repository
  // and meets a 404 here. Telling them the order of the two fields is cheaper than explaining
  // the failure afterwards, which is what `explainStatus` is left to do.
  function ghSectionHtml(connected) {
    if (connected) {
      return '<div class="fb-gh-status">connected · ' +
             '<button type="button" class="linkbtn fb-gh-disconnect">disconnect</button></div>';
    }
    return '<div class="fb-gh-connect">' +
           '<div class="fb-gh-row">' +
           '<input type="password" class="fb-gh-input" placeholder="GitHub fine-grained PAT" ' +
           'autocomplete="off" spellcheck="false">' +
           '<button type="button" class="linkbtn fb-gh-save">connect GitHub</button>' +
           '</div>' +
           '<div class="fb-gh-note">Connect to file straight to GitHub, with no form page in ' +
           'between. Use a fine-grained PAT scoped to only "Issues: Read and write" on only ' +
           'this repo. It is stored in this browser only, and sent only to api.github.com.' +
           '<br><b>Set "Repository access" to "Only select repositories" first.</b> GitHub ' +
           'preselects "Public repositories (read-only)", and while that is selected it will ' +
           'not offer you the Issues permission at all, so the token comes out unable to reach ' +
           'this repo and fails here with a 404.' +
           '</div></div>';
  }

  function wireGh(container, onChange) {
    var input = container.querySelector('.fb-gh-input');
    var save = container.querySelector('.fb-gh-save');
    if (input && save) {
      var doSave = function () {
        var v = input.value.trim();
        if (!v) { input.focus(); return; }
        setToken(v);
        onChange();
      };
      save.onclick = doSave;
      // Enter saves the credential and nothing else. Filing stays on Shift+Enter.
      input.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSave(); } };
    }
    var disconnect = container.querySelector('.fb-gh-disconnect');
    if (disconnect) disconnect.onclick = function () { setToken(''); onChange(); };
  }

  function showResultIn(el, className, text, kind, url) {
    if (!el) return;
    el.className = className + (kind ? ' ' + kind : '');
    el.style.display = 'block';
    el.textContent = '';
    el.appendChild(document.createTextNode(text));
    if (url) {
      el.appendChild(document.createTextNode(' '));
      var a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = 'view issue ↗';
      el.appendChild(a);
    }
  }

  function optionsHtml(values, selected) {
    return values.map(function (v) {
      return '<option value="' + escapeHtml(v) + '"' + (v === selected ? ' selected' : '') +
             '>' + escapeHtml(v) + '</option>';
    }).join('');
  }

  function openPopover(el, x, y) {
    closePopover();
    var descriptor = describe(el);
    var context = safeContext();

    var box = document.createElement('div');
    box.className = 'fb-popover';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'feedback on the clicked element');
    box.innerHTML =
      '<div class="fb-row fb-el" title="' + escapeHtml(descriptor) + '">' +
        escapeHtml(descriptor) + '</div>' +
      '<div class="fb-ctx" title="attached automatically">' + escapeHtml(context) + '</div>' +
      '<textarea class="fb-note" placeholder="what looks off here, what you see vs. what you ' +
        'expect"></textarea>' +
      '<div class="fb-gh"></div>' +
      '<div class="fb-priority-row">' +
        '<label for="fb-cat-select">type</label>' +
        '<select id="fb-cat-select" class="fb-cat" title="what kind of report this is">' +
          optionsHtml(CATEGORIES, 'bug') + '</select>' +
        '<label for="fb-priority-select">priority</label>' +
        '<select id="fb-priority-select" class="fb-priority" title="priority for this card">' +
          optionsHtml(['P0', 'P1', 'P2', 'P3'], 'P2') + '</select>' +
      '</div>' +
      '<div class="fb-actions">' +
        '<button type="button" class="linkbtn fb-file" title="file straight to GitHub if ' +
          'connected, else open a prefilled issue form">file to board</button>' +
        '<button type="button" class="linkbtn fb-copy">copy</button>' +
        // Disabled while nothing has been copied. An enabled control that writes an empty
        // clipboard and reports success is a lie about what the reader now holds, and one
        // that does nothing at all is worse than one that is not there.
        '<button type="button" class="linkbtn fb-copyall"' +
          (items.length ? '' : ' disabled title="nothing copied yet in this session"') +
          '>copy all (<span class="fb-count">' + items.length + '</span>)</button>' +
        '<button type="button" class="linkbtn fb-close">close</button>' +
      '</div>' +
      '<div class="fb-file-result" style="display:none"></div>' +
      '<div class="fb-hint"><span>4 / Shift+Enter file · 1 copy · 2 copy all · ' +
        '3 close</span>' +
      '<a class="fb-board" href="' + BOARD_HREF + '">board ↗</a></div>';

    document.body.appendChild(box);
    box._at = { x: x, y: y };
    positionNear(box, x, y);
    popoverEl = box;

    var ta = box.querySelector('.fb-note');
    // Focus the box itself rather than the note, so 1/2/3/4 work immediately. Clicking into
    // the note types a note normally, digits included, and the shortcuts stand down there.
    box.setAttribute('tabindex', '-1');
    box.focus();

    // Anything that changes the box's height has to re-clamp it, or the clamp is computed
    // against a height the box no longer has. The GitHub section below is the reason: it is
    // rendered after the first placement and is the tallest block in the box, so without this
    // the popover was placed as though it were a hundred pixels shorter than it is and could
    // then run off the bottom of the screen.
    var reclamp = function () {
      if (popoverEl === box) positionNear(box, box._at.x, box._at.y);
    };

    var refreshGh = function () {
      var ghEl = box.querySelector('.fb-gh');
      ghEl.innerHTML = ghSectionHtml(!!getToken());
      wireGh(ghEl, refreshGh);
      reclamp();
    };
    refreshGh();

    // A note typed about this element and not filed is put back when the element is clicked
    // again, however the box was closed the first time.
    if (drafts[descriptor]) ta.value = drafts[descriptor];
    box._saveDraft = function () {
      if (ta.value.trim()) drafts[descriptor] = ta.value;
      else delete drafts[descriptor];
    };

    var doCopy = function () {
      var block = buildBlock(descriptor, context, ta.value);
      items.push(block);
      var countEl = box.querySelector('.fb-count');
      if (countEl) countEl.textContent = String(items.length);
      var all = box.querySelector('.fb-copyall');
      if (all) { all.disabled = false; all.removeAttribute('title'); }
      copyText(block, box.querySelector('.fb-copy'));
    };
    var doCopyAll = function () {
      if (items.length) copyText(items.join('\n\n'), box.querySelector('.fb-copyall'));
    };

    // Read fresh on every file, so a change made just before filing is honoured.
    var getPriority = function () {
      var sel = box.querySelector('.fb-priority');
      return (sel && sel.value) || 'P2';
    };
    var getCategory = function () {
      var sel = box.querySelector('.fb-cat');
      return (sel && sel.value) || 'idea';
    };

    var result = function (text, kind, url) {
      showResultIn(box.querySelector('.fb-file-result'), 'fb-file-result', text, kind, url);
      reclamp();
    };

    var doFile = function () {
      var note = ta.value;
      var priority = getPriority();
      var category = getCategory();
      if (!getToken()) {
        return fileIssue(descriptor, context, note, priority, category).then(function () {
          result('opened the prefilled issue form.', '');
        });
      }
      result('filing…', '');
      return fileIssue(descriptor, context, note, priority, category).then(function (r) {
        if (r.ok) {
          // Filed, so the draft has become an issue and is no longer a draft. On every other
          // outcome it is kept: the note still exists only here.
          delete drafts[descriptor];
          result('filed #' + r.number + ' ✓', 'ok', r.url);
        } else {
          result('couldn’t file directly (' + r.error + '); opening the prefilled ' +
                 'form instead.', 'err');
        }
      });
    };

    box.querySelector('.fb-close').onclick = function () { closePopover(); };
    box.querySelector('.fb-copy').onclick = doCopy;
    box.querySelector('.fb-copyall').onclick = doCopyAll;
    box.querySelector('.fb-file').onclick = doFile;
    // Exposed so the keyboard shortcuts trigger exactly the same actions as the buttons.
    box._actions = { copy: doCopy, copyall: doCopyAll, close: closePopover, file: doFile };
  }

  // ---- uncaught runtime errors -----------------------------------------------------------
  // A runtime error in the deployed page is otherwise invisible unless someone has devtools
  // open. This reuses the filing machinery above rather than a captured element: the descriptor
  // is fixed to "runtime error" and the note is the message plus a trimmed stack. Consent is
  // required, nothing is ever filed automatically.
  var seenErrorKeys = {};      // de-dupe: one offer per distinct message and stack, per session
  var errorNoticeEl = null;    // cap: at most one notice on screen at a time
  var errorHandlersInstalled = false;

  function trimStack(stack, lines) {
    return String(stack || '').split('\n').slice(0, lines || 6).join('\n').slice(0, 2000);
  }

  // One line on screen, so the commit is abbreviated here where the report carries it whole. Seven
  // characters of a real sha resolve, which is the difference this issue was about; the full value
  // travels in the context block of anything filed from the notice.
  function breadcrumb() {
    var zv = window.ZV || {};
    var view = document.body.classList.contains('board') ? 'board' : 'diagram';
    return view + ' · ' + (zv.commit ? 'commit ' + String(zv.commit).slice(0, 7) : 'no deploy stamp');
  }

  function dismissErrorNotice() {
    if (errorNoticeEl) { errorNoticeEl.remove(); errorNoticeEl = null; }
  }

  function showErrorNotice(message, stack, context) {
    if (errorNoticeEl) return;
    var box = document.createElement('div');
    box.className = 'err-notice';
    box.setAttribute('role', 'alert');
    box.innerHTML =
      '<div class="err-notice-row">an error occurred (' + escapeHtml(breadcrumb()) +
        '): report it to the board?</div>' +
      '<div class="err-notice-actions">' +
        '<button type="button" class="linkbtn err-report">report</button>' +
        '<button type="button" class="linkbtn err-dismiss">dismiss</button>' +
      '</div>' +
      '<div class="err-notice-result" style="display:none"></div>';
    document.body.appendChild(box);
    errorNoticeEl = box;

    var result = function (text, kind, url) {
      showResultIn(box.querySelector('.err-notice-result'), 'err-notice-result', text, kind, url);
    };

    box.querySelector('.err-dismiss').onclick = dismissErrorNotice;
    box.querySelector('.err-report').onclick = function () {
      var reportBtn = box.querySelector('.err-report');
      try {
        if (reportBtn) reportBtn.disabled = true;
        result('filing…', '');
        var note = message + '\n\n' + trimStack(stack);
        fileIssue('runtime error', context, note, 'P1', 'bug').then(function (r) {
          if (r.ok) result('filed #' + r.number + ' ✓', 'ok', r.url);
          else if (r.noToken) result('opened the prefilled issue form.', '');
          else result('couldn’t file directly (' + r.error + '); opening the prefilled ' +
                      'form instead.', 'err');
          if (reportBtn) reportBtn.disabled = false;
        });
      } catch (e) {
        result('couldn’t file; try again, or use the feedback tool.', 'err');
      }
    };
  }

  // Never throws and never loops: every branch is wrapped, an identical error is offered once
  // per session, and a second error while a notice is showing is dropped rather than stacked.
  function handleRuntimeError(message, stack) {
    try {
      var msg = String(message == null ? 'error' : message).slice(0, 500);
      var stk = trimStack(stack);
      var key = msg + '\n' + trimStack(stk, 3);
      if (seenErrorKeys[key]) return;
      if (errorNoticeEl) return;
      seenErrorKeys[key] = true;
      showErrorNotice(msg, stk, safeContext());
    } catch (e) { /* the handler itself must never throw or re-trigger itself */ }
  }

  function installErrorReporter() {
    if (errorHandlersInstalled) return;
    errorHandlersInstalled = true;
    window.addEventListener('error', function (e) {
      try {
        var err = e && e.error;
        var message = (err && err.message) || (e && e.message) || 'unknown error';
        handleRuntimeError(message, (err && err.stack) || '');
      } catch (e2) { /* swallow; never rethrow from inside the handler */ }
    });
    window.addEventListener('unhandledrejection', function (e) {
      try {
        var reason = e && e.reason;
        var message = (reason && reason.message) ||
          (typeof reason === 'string' ? reason : 'unhandled promise rejection');
        handleRuntimeError(message, (reason && reason.stack) || '');
      } catch (e2) { /* swallow; never rethrow from inside the handler */ }
    });
  }

  // ---- shared with the board ---------------------------------------------------------------
  // board.js reaches the same API, to draw the board from Issues directly instead of from the
  // published snapshot, and it must not grow a second copy of what a refusal means. GitHub
  // answering 404 rather than 403 for a private repository a token cannot reach is the one
  // thing about this API a reader cannot guess, and two copies of that sentence is one copy
  // that goes stale. Published on window.ZMT the way app.js publishes window.ZT, and read by
  // board.js at call time rather than at load time, because index.html loads board.js first.
  //
  // The token is shared as a reader and not as a value. Anything running on this origin can
  // already read localStorage, so this adds no reach; nothing prints it, writes it to a file or
  // puts it in a URL, on either side.
  window.ZMT = window.ZMT || {};
  window.ZMT.repo = REPO;
  window.ZMT.token = getToken;
  window.ZMT.explainStatus = explainStatus;

  // ---- wiring ----------------------------------------------------------------------------
  var toggle = document.getElementById(TOGGLE_ID);
  if (toggle) toggle.onclick = function () { setMode(!fbMode); };
  document.addEventListener('click', onCapture, true);
  document.addEventListener('keydown', onKey, true);
  // Re-clamp rather than close: a resize (a rotation, a mobile address bar) must not throw
  // away a note that has been typed but not yet filed.
  window.addEventListener('resize', function () {
    if (popoverEl && popoverEl._at) positionNear(popoverEl, popoverEl._at.x, popoverEl._at.y);
  });
  installErrorReporter();
})();
