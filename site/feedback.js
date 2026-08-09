// Feedback button. It opens a small popover, takes a note and a category, and then opens a
// prefilled GitHub issue URL in a new tab. That is the whole mechanism.
//
// There is no POST, no token and no API call from this page. The repository is private, so
// only someone already signed in with access can file, and a prefilled URL needs no
// credential at all. A token shipped in a public page would be a second incident.
//
// What makes the button worth having is the context block: the note carries the node that was
// selected, the view, the viewport width and the build id of the drawing that was on screen,
// so a report can be tied to the exact bytes that produced it.
(function () {
  'use strict';

  var REPO = 'jcherranz/zrive-model-toy';
  var CATEGORIES = ['bug', 'data model', 'layout', 'idea'];

  var btn = document.getElementById('fbbtn');
  if (!btn) return;

  var pop = document.createElement('div');
  pop.id = 'fbpop';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', 'Send feedback');
  pop.hidden = true;
  pop.innerHTML =
    '<label for="fbnote">what is wrong, or what would be better</label>' +
    '<textarea id="fbnote" rows="3" placeholder="a sentence is enough"></textarea>' +
    '<label for="fbcat">category</label>' +
    '<select id="fbcat">' +
    CATEGORIES.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('') +
    '</select>' +
    '<label>attached automatically</label>' +
    '<p class="fbctx" id="fbctx"></p>' +
    '<div class="fbrow">' +
    '<button type="button" class="btn" id="fbcancel">cancel</button>' +
    '<button type="button" class="btn primary" id="fbsend">open GitHub issue</button>' +
    '</div>';
  document.body.appendChild(pop);

  var noteEl = pop.querySelector('#fbnote');
  var catEl = pop.querySelector('#fbcat');
  var ctxEl = pop.querySelector('#fbctx');

  function context() {
    var zt = window.ZT || {};
    var sel = typeof zt.selected === 'function' ? zt.selected() : null;
    return [
      ['selected node', sel ? sel.label + ' (' + sel.type + ', id ' + sel.id + ')' : 'none'],
      ['view', document.body.classList.contains('board') ? 'board' : 'diagram'],
      ['viewport', window.innerWidth + ' by ' + window.innerHeight],
      ['build', zt.build || 'unknown'],
      ['page', location.href]
    ];
  }

  function contextText() {
    return context().map(function (p) { return p[0] + ': ' + p[1]; }).join('\n');
  }

  function issueUrl() {
    var note = (noteEl.value || '').trim();
    var cat = catEl.value || 'idea';
    var first = note.split('\n')[0].trim();
    var title = first ? first.slice(0, 70) : 'feedback: ' + cat;
    var bodyText = (note || '(no note written)') + '\n\n' +
      'Context, filled in by the page\n\n' + contextText() + '\n';
    return 'https://github.com/' + REPO + '/issues/new' +
      '?title=' + encodeURIComponent(title) +
      '&body=' + encodeURIComponent(bodyText) +
      '&labels=' + encodeURIComponent('feedback,' + cat);
  }

  function place() {
    var r = btn.getBoundingClientRect();
    var w = Math.min(320, window.innerWidth - 24);
    var left = Math.max(12, Math.min(r.right - w, window.innerWidth - w - 12));
    pop.style.left = left + 'px';
    pop.style.top = (r.bottom + 8) + 'px';
  }

  function open() {
    ctxEl.textContent = contextText();
    pop.hidden = false;
    place();
    btn.setAttribute('aria-expanded', 'true');
    noteEl.focus();
  }

  function close() {
    pop.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', function (ev) {
    ev.stopPropagation();
    if (pop.hidden) open(); else close();
  });

  pop.addEventListener('click', function (ev) { ev.stopPropagation(); });
  pop.querySelector('#fbcancel').addEventListener('click', close);
  pop.querySelector('#fbsend').addEventListener('click', function () {
    window.open(issueUrl(), '_blank', 'noopener');
    noteEl.value = '';
    close();
  });

  document.addEventListener('click', function () { if (!pop.hidden) close(); });
  // Capture phase, so Escape closes the popover without also clearing the diagram selection
  // that the note is about.
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !pop.hidden) {
      ev.stopPropagation();
      close();
      btn.focus();
    }
  }, true);
  window.addEventListener('resize', function () { if (!pop.hidden) place(); });
})();
