// boot: the first script on the page, and the only one whose job is to notice that the others
// did not run.
//
// THE DEFECT THIS EXISTS FOR, issue 166. site/app.js turns a broken load into a named throw, and
// its own header says why: "one named error rather than a page that half draws". Ten of those
// throws stand in that file. feedback.js registers the window error listener that would report
// one, and index.html loaded feedback.js AFTER app.js, so every one of those ten fired before
// there was anything listening. Measured, all three rows on a working tree: a throw inside
// selection.js left thirty nine nodes on screen and said nothing; a ONE NODE drift between
// site/instance.js and site/layout.js drew a blank canvas and said nothing at all. feedback.js's
// own comment beside commitLine() says that block has to answer "in a run where app.js has
// thrown", which is the right intent defeated by the order of two script tags.
//
// AND THE SECOND ROW IS THE ONE THIS PROJECT IS HEADED FOR. app.js's join comment says the two
// documents are split so that invented data can sit on the public origin and real data on a
// private deployment. A drift between a private instance.js and the layout built for another one
// is therefore the most likely production failure this page has, and until this file it was also
// the quietest: a blank canvas, no notice, no console anybody was looking at.
//
// WHY A FILE AND NOT FOUR LINES IN THE HEAD. site/index.html carries a Content-Security-Policy
// whose load bearing directive is `script-src 'self'` with no 'unsafe-inline', so an inline
// bootstrap is refused by the browser. It has to be same origin bytes, and it has to be first.
//
// AND WHY NOT SIMPLY MOVE feedback.js TO THE FRONT INSTEAD, which was the other candidate and is
// the one the card proposed. Three reasons, in the order they decided it. Its listener is
// registered on the bubble phase, and a script or a stylesheet that fails to load fires an error
// event that does not bubble, so the file that reports a broken load would be deaf to a file that
// never arrived. It is nine hundred lines whose subject is filing a card, and putting all of it
// in front of the page it reports on widens exactly the surface that has to keep working when
// everything else has stopped. And its own tail says board.js reads window.ZMT at call time
// because index.html loads board.js first, which is a documented order this would invert for a
// reason that has nothing to do with either file.
//
// THREE STATES AND NOT TWO, WHICH IS THE WHOLE STANDARD HERE. A notice that appears only when a
// specific throw happens, and shows nothing when the page merely came up wrong, is the same
// defect one level up: it cannot tell "I looked and found nothing" from "I could not look". So
// the reading is three valued and window.ZB carries it whether or not anything is painted:
//
//   ok      the page finished. window.ZT is published, the drawing has painted a node, every
//           stylesheet applied, and nothing reached the error channel. Nothing is drawn. A
//           healthy page never shows a banner and that is asserted rather than assumed.
//   threw   the page did not finish, or something failed while it did, AND there is a reason to
//           give. The banner names it, with the deploy stamp, because the first question about a
//           broken page is which build it is.
//   blind   the page did not finish and nothing on it can say why, which includes the case where
//           this file cannot read the page at all. It is the state the page could not represent
//           before, and the state a reader is otherwise left to diagnose from a blank rectangle.
//
// window.ZB EXISTS FROM THE FIRST LINE OF THIS FILE, and that is deliberate. A driver that finds
// no window.ZB has learned that the instrument was never installed, which is not the same fact as
// a clean page and must never be read as one. Silence here means "asked and answered"; an absent
// window.ZB means nobody asked.
//
// WHAT IT DELIBERATELY DOES NOT DO. It does not catch the throw. app.js's error still reaches the
// console and the browser's own reporting, which is where scripts/smoke.mjs reads it from and
// where a developer with the tools open expects it; a try/catch around the wiring would paint
// this banner and silence every other instrument that watches that channel. It does not judge
// whether the drawing is RIGHT, only whether there is one: geometry that is wrong rather than
// missing is the build gate's fourteen digests, not this file's. And it does not file anything.
// feedback.js owns filing, it is still loaded, and its own notice takes over for anything that
// happens after the page has come up.
//
// WHAT IT IS STILL SILENT FOR, written down because a check whose blind spots are unwritten gets
// trusted past them, and this list is longer than the first draft of it because a review went
// looking. This file failing to load or to parse, which nothing on the page can report. A script
// that hangs the main thread in a synchronous loop, which starves the load event and the deadline
// alike: nothing that runs on this thread can report a thread that is not running. A stylesheet
// that loaded and is wrong rather than missing, and a drawing that is painted and wrong rather
// than absent, including the narrower case of a marker node that exists in the document while
// nothing is visible on screen, since the test below is that a node was drawn and not that a
// reader can see it. A promise that rejected with nothing else amiss, which is a deliberate
// omission argued where the listener is. A genuine ResizeObserver loop, exempted below with the
// measurement that made the exemption necessary. And anything that goes wrong after the reader
// starts using the page, which is feedback.js's half of this.
(function () {
  'use strict';

  // Long enough that a slow phone is not accused of being broken for no reason, short enough that
  // a reader looking at a blank rectangle is not left there without a word. Whatever it answers is
  // provisional and the load event can withdraw it, which is what makes the number safe to choose
  // rather than something a slow network could turn into a lie. See decide().
  var DEADLINE_MS = 8000;
  var MAX_REASONS = 4;

  var reasons = [];
  var decided = false;
  var bannerEl = null;
  var styleEl = null;

  // Published before anything can go wrong, so that "no banner" and "no instrument" are two
  // readable answers rather than one silence.
  var report = { state: 'waiting', reasons: reasons, missing: [], at: '', painted: false };
  window.ZB = report;

  // A url as the one word in it a reader can act on. The banner is one paragraph on a page that
  // may be blank, and an origin repeated on four lines is four lines of noise.
  function short(url) {
    var s = String(url || '');
    var cut = s.lastIndexOf('/');
    return cut === -1 ? s : s.slice(cut + 1) || s;
  }

  // THE ONE THING ON THIS CHANNEL THAT IS NOT A FAILURE, and it is exempted by measurement rather
  // than by taste. Chrome reports "ResizeObserver loop completed with undelivered notifications"
  // as an uncaught error, and app.js observes the header with a ResizeObserver, so a layout that
  // takes two passes to settle puts four of these on the error channel. Measured: a page served
  // without its stylesheet raised four of them and drew all two hundred and thirty of its nodes
  // correctly. It is the observer saying it skipped a delivery, not a script saying it stopped,
  // and admitting it here would put a banner on a page that works, which is the one outcome worse
  // than the silence this file was written to end. THE COST IS NAMED: a genuine ResizeObserver
  // loop is invisible to this file. scripts/smoke.mjs allows nothing on that channel but a
  // favicon 404, so a run that starts raising them goes red there instead.
  var BENIGN = /^ResizeObserver loop/;

  function note(text) {
    var t = String(text == null ? '' : text).replace(/\s+/g, ' ').slice(0, 300);
    if (!t) t = 'an error that carried no message';
    if (BENIGN.test(t)) return;
    if (reasons.length >= MAX_REASONS) return;
    for (var i = 0; i < reasons.length; i++) if (reasons[i] === t) return;
    reasons.push(t);
  }

  // CAPTURE PHASE, and that is the half of this the card did not have. A script or a stylesheet
  // that fails to load fires an error event AT THE ELEMENT which does not bubble, so a listener
  // registered the ordinary way never sees the one failure a reader cannot diagnose: a file that
  // is not there. Both kinds arrive here and are told apart by whether the event has a target
  // element under it.
  window.addEventListener('error', function (e) {
    try {
      var t = e && e.target;
      if (t && t !== window && t.nodeType === 1) {
        note(short(t.href || t.src || t.tagName) + ' did not load');
        return;
      }
      var m = (e && e.error && e.error.message) || (e && e.message) || '';
      note(m + (e && e.filename ? '  (' + short(e.filename) + ':' + (e.lineno || 0) + ')' : ''));
    } catch (err) { /* the watcher is the one thing on this page that may never throw */ }
  }, true);

  // NO unhandledrejection LISTENER, and that is a decision rather than an omission. board.js polls
  // an API that is blocked outright in the test harness and unreachable on a reader's offline
  // laptop, and a rejected fetch on a page that drew perfectly is not a load failure. Rejections
  // are feedback.js's, where they are reported with consent and after the page is up.

  // WHAT "FINISHED" MEANS, in facts each of which is decided by the time the load event fires.
  //
  // window.ZT is app.js's own readiness signal and its comment already says so: it is published
  // last, from the wiring file, and its existence means every module was built and wired without
  // throwing. Read here rather than duplicated as a second flag, because two statements of one
  // fact are how the two come to disagree.
  //
  // A PAINTED NODE, because window.ZT alone would pass a page that wired itself and drew nothing.
  // app.js draws before it publishes, so this cannot be a timing accident: measured on eight
  // addresses, `#/`, `#/board`, `#/students`, `#/calendar`, `#/outline`, a programme, a collapsed
  // scope and a scoped sheet, every one of them had painted nodes at the load event. The board
  // and the sheets are overlays over a drawing that is already there.
  //
  // AND EVERY STYLESHEET, because a link element that failed fires its error AT THE ELEMENT IN THE
  // HEAD, which the parser reaches before it reaches these bytes, so that one failure is the one
  // the listener above structurally cannot catch. A page with no stylesheet still draws every node
  // and still publishes window.ZT: measured, two hundred and thirty nodes and a transparent body
  // on a page whose only stylesheet never arrived. It is read as a state rather than as an event,
  // which needs no listener and is decided by the time the load event fires.
  //
  // AND IT IS READ THROUGH cssRules AND NOT THROUGH `sheet`, WHICH IS A MEASUREMENT AND NOT A
  // PREFERENCE. The obvious test is that a link that did not apply has a null sheet. It does not:
  // with the request refused outright, `link.sheet` was still an object and reading cssRules on it
  // threw, so the obvious test called a page with no style a page with style. A stylesheet that is
  // there answers with its rules, a stylesheet that is not answers with a throw or with none, and
  // the throw is caught rather than trusted. Every stylesheet on this page is same origin, which
  // the policy in index.html enforces, so a throw here cannot be the ordinary cross origin refusal.
  function styled(link) {
    try { return !!(link.sheet && link.sheet.cssRules && link.sheet.cssRules.length); }
    catch (err) { return false; }
  }

  // TWO KINDS OF ABSENCE AND THEY ARE NOT THE SAME REPORT, which is what the third state turns on.
  // `unfinished` is the page not coming up, and by itself it explains nothing: window.ZT is not
  // there and the sentence stops. A stylesheet that did not load is an absence that names its own
  // cause, so it belongs with the reasons and not with the mystery. Reading them into one list is
  // how a page that told you exactly what was wrong comes to say that nothing can say what.
  function readNow() {
    var unfinished = '', faults = [], links, i;
    if (!window.ZT) {
      unfinished = 'site/app.js did not finish: window.ZT, which is its statement that every ' +
                   'module was built and wired, was never published';
    } else if (!document.querySelector('#graph [data-node]')) {
      unfinished = 'the page wired itself and the drawing painted no node';
    }
    links = document.querySelectorAll('link[rel~="stylesheet"]');
    for (i = 0; i < links.length; i++) {
      if (!styled(links[i])) {
        faults.push(short(links[i].getAttribute('href')) +
                    ' did not load, so this page has no style');
      }
    }
    return { unfinished: unfinished, faults: faults };
  }

  // The build, in the three states feedback.js and the footer stamp already draw it in. A broken
  // page is reported to somebody, and the first thing they need is which bytes it was.
  function stamp() {
    var zv = window.ZV;
    if (!zv) return 'no deploy stamp: version.js did not load either';
    if (!zv.commit) return zv.source ? String(zv.source) : 'not a deployment';
    return 'commit ' + String(zv.commit).slice(0, 7);
  }

  var STYLE = [
    '.zb-notice {',
    '  position: fixed; top: 0; left: 0; right: 0; z-index: var(--z-error, 40);',
    '  box-sizing: border-box; max-height: 62vh; overflow: auto;',
    '  padding: 10px 14px 11px;',
    '  background: var(--bg-panel, light-dark(#ffffff, #1d1d1f));',
    '  color: var(--fg-body, light-dark(#16171a, #e8e8ea));',
    '  border-bottom: 2px solid var(--fg-warning, light-dark(#935610, #ec9a3c));',
    '  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;',
    '  font-size: 13px; line-height: 1.45;',
    '}',
    '.zb-notice p { margin: 0 0 3px; }',
    '.zb-notice .zb-head { font-weight: 600; }',
    '.zb-notice .zb-why { color: var(--fg-muted, light-dark(#5b5f66, #a2a6ad)); }',
    '.zb-notice .zb-dismiss {',
    '  margin-top: 6px; padding: 0; border: 0; background: none; cursor: pointer;',
    '  font: inherit; text-decoration: underline; color: inherit;',
    '}'
  ].join('\n');

  // BUILT AS ELEMENTS AND TEXT, with no innerHTML anywhere. The strings on this banner include a
  // message thrown by code and a url, which are the two things on a broken page most likely to
  // carry something that would be markup, and the policy this page ships is there because a
  // credential sits in localStorage on a public origin.
  //
  // ITS OWN STYLE ELEMENT AND NOT A CLASS IN app.css, because a stylesheet that did not load is
  // one of the failures it has to be able to report. Every colour reaches for the page's own
  // token first and falls back to a literal pair, so it themes with the page when there is one
  // and is still legible when there is not.
  function paint(state, read, provisional) {
    var style, box, i, p, btn;
    try {
      if (bannerEl && bannerEl.parentNode) bannerEl.parentNode.removeChild(bannerEl);
      bannerEl = null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.textContent = STYLE;
        document.head.appendChild(styleEl);
      }
      style = styleEl;

      box = document.createElement('div');
      box.className = 'zb-notice';
      box.setAttribute('role', 'alert');
      box.setAttribute('data-zb', state);

      p = document.createElement('p');
      p.className = 'zb-head';
      p.textContent = provisional
        ? 'This page has not finished loading. If it is only slow, this notice goes away by ' +
          'itself when it does.'
        : read.unfinished
          ? 'This page did not finish loading, so what is on screen is not what it is meant to ' +
            'show.'
          : 'This page loaded, and something on it failed while it did.';
      box.appendChild(p);

      if (read.unfinished) {
        p = document.createElement('p');
        p.textContent = read.unfinished + '.';
        box.appendChild(p);
      }
      for (i = 0; i < read.faults.length; i++) {
        p = document.createElement('p');
        p.textContent = read.faults[i] + '.';
        box.appendChild(p);
      }

      for (i = 0; i < reasons.length; i++) {
        p = document.createElement('p');
        p.textContent = 'what the browser said: ' + reasons[i];
        box.appendChild(p);
      }
      if (state === 'blind') {
        p = document.createElement('p');
        p.textContent = 'Nothing on this page can say why: no error reached it and nothing else ' +
                        'is missing, so this is a report that it did not finish and not a report ' +
                        'of what went wrong.';
        box.appendChild(p);
      }

      p = document.createElement('p');
      p.className = 'zb-why';
      p.textContent = stamp() + '. Reload, and if it comes back, this line is the one to quote.';
      box.appendChild(p);

      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'zb-dismiss';
      btn.textContent = 'dismiss';
      btn.onclick = function () { if (box.parentNode) box.parentNode.removeChild(box); };
      box.appendChild(btn);

      document.body.appendChild(box);
      bannerEl = box;
    } catch (err) {
      // A banner that could not be drawn must still leave the reading somewhere a driver and a
      // console can find it, which window.ZB already is.
      report.painted = false;
      return;
    }
    report.painted = true;
  }

  function clear() {
    if (bannerEl && bannerEl.parentNode) bannerEl.parentNode.removeChild(bannerEl);
    bannerEl = null;
    report.painted = false;
  }

  // TWO MOMENTS AND ONLY ONE OF THEM IS FINAL, which is a repair a review found before this
  // shipped and is worth writing out because the first version had the bug. The deadline exists
  // for a load event that never comes, and the first version treated its answer as the verdict.
  // A slow phone on a slow network reaches that deadline while it is still loading perfectly
  // normally, and it would have been told, permanently, that the page was broken. A false banner
  // on a page that works is worse than the silence this file exists to end.
  //
  // So the deadline's answer is PROVISIONAL: it says the page has not finished, which is true
  // when it is said, and it says in the same breath that it will withdraw itself. The load event
  // is the only moment that decides, and if it finds a page that came up it takes the notice
  // away. `at` records which moment answered, because "it had not finished after eight seconds"
  // and "it did not finish" are different findings about the same page.
  //
  // AND THE WHOLE OF IT IS GUARDED, because everything it reads belongs to a page that may be
  // broken in ways nothing here anticipates. A window.ZT defined as a throwing getter would
  // otherwise take this function down and leave the reading at `waiting` forever, which is the
  // dead instrument this file was written against, one level up.
  function decide(at, provisional) {
    if (decided) return;
    try {
      var read = readNow();
      report.at = at;
      report.missing = (read.unfinished ? [read.unfinished] : []).concat(read.faults);
      if (!read.unfinished && !read.faults.length && !reasons.length) {
        decided = true;
        report.state = 'ok';
        clear();
        return;
      }
      // blind is the page stopping with nothing to show for it. Anything that names a cause, a
      // thrown message or a file that did not arrive, is the second state and not the third.
      report.state =
        (read.unfinished && !reasons.length && !read.faults.length) ? 'blind' : 'threw';
      if (!provisional) decided = true;
      paint(report.state, read, provisional);
    } catch (err) {
      try {
        decided = true;
        report.state = 'blind';
        report.missing = ['this page could not be read for whether it finished: ' +
                          (err && err.message ? err.message : String(err))];
        paint('blind', { unfinished: report.missing[0], faults: [] }, false);
      } catch (e2) { /* nothing left to try, and window.ZB still carries the state */ }
    }
  }

  setTimeout(function () { decide('the deadline, with the load event still to come', true); },
             DEADLINE_MS);
  window.addEventListener('load', function () { decide('the load event', false); });
}());
