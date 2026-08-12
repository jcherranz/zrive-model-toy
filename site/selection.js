// selection: what the reader has picked, what that dims, what it reveals, and what the panel says.
//
// Issue 71, seam 2 of issue 60. Three cards in forty eight hours changed exactly this and nothing
// else, which is the owner's test passed three times over: issue 45 took the frame off the
// selected node and left the invert, the dim and the panel as the whole of the feedback; issue 48
// brought an employer onto the page while the instructor it employs is selected; issue 51
// generalised that one mechanism to the four students the cohort card stands for. All three would
// now land in this file.
//
// IT OWNS NO GRAPHICS AND CREATES NONE. render.js paints the drawing and hands over the tables it
// built it into; this file paints through those handles and puts classes on them. bind() is
// called with a fresh set after every draw, because a route change replaces every element on the
// page and a module still holding the old ones would be acting on a tree nobody can see.
(function () {
  'use strict';

  // ---- what the drawing paints only on demand ---------------------------------
  // Two kinds of node are laid out, kept out of the picture, and faded in when the reader asks
  // for them: an employer, while the instructor it employs is selected (issue 48), and the four
  // students the cohort card stands for, while that card or one of them is selected (issue 51).
  // One mechanism, one stylesheet rule and one table, because two copies of it would be two
  // things to keep in step, and the second was written by generalising the first rather than
  // beside it.
  //
  // EVERY RULE KEYS ON A VERB AND NEVER ON A TYPE. Six nodes here are of type Company and only
  // five are employers: one company hosts a visit, employs nobody, and a rule reading
  // `type === 'Company'` would take it off the page along with the five and delete exactly the
  // distinction this toy exists to show, that one type is playing two roles. The same discipline
  // is kept for the students even though Student plays one role today, because that is what
  // Company looked like before it played two. A sixth instructor, or a fifth student, joins the
  // rule by existing: nothing below holds a list of ids to forget to extend.
  //
  //   verb      the relationship that puts a node under the rule
  //   hide      which end of that edge is the node that is not painted
  //   by        which end is the node whose selection paints it
  //   together  members revealed by one node come and go as a set, so selecting one of the four
  //             students keeps its three siblings and the "and 30 more" marker on screen. An
  //             employer is alone at its end of the link and wants the opposite: moving to
  //             another instructor takes the first employer away again, so at most one is ever
  //             on the page.
  var VEIL_RULES = [
    { verb: 'employed by', hide: 't', by: 's', together: false },
    { verb: 'member of',   hide: 's', by: 't', together: true }
  ];

  // ---- where a value came from, and whether it is still good enough to act on ---------------
  // Issue 73, seam 5, and the scheme is the Z-Map's rather than one invented here: every value
  // carries the rank of its source and the date that source was read, `status` and `apto` are
  // computed and never written down, and a value nobody has verified is refused rather than
  // quietly used. The vocabulary and the clock ship in the instance document, so nothing below
  // holds a copy of a threshold or of a token's meaning.
  //
  // THE CLOCK IS READ AGAINST TODAY AND NOT AGAINST THE DOCUMENT'S OWN as_of, which is the one
  // place this file and the build deliberately disagree. The build has to be deterministic, so
  // it ages every value against the date stamped on the document; a reader wants to know how old
  // a value is now. The disagreement is safe in one direction only and that is the direction it
  // runs: today is never earlier than the stamp, so a value can only read staler here than the
  // build judged it, and the page can never show as current something the build let through as
  // stale.
  var STATUS_ORDER = ['fresh', 'aging', 'stale', 'unread', 'invented'];
  var DAY = 86400000;

  function statusOf(P, row) {
    if (row.r === '0_invented') return 'invented';
    if (!row.at) return 'unread';
    var days = Math.floor((Date.now() - Date.parse(row.at + 'T00:00:00Z')) / DAY);
    if (days <= P.clock.fresh_days) return 'fresh';
    if (days <= P.clock.aging_days) return 'aging';
    return 'stale';
  }

  // One sentence about the node's whole property list. A chip on every row was the alternative
  // and it is the wrong shape here: the rows already carry a flag each, saying what kind of
  // value it is, and a second chip beside every one of them would be twice the ink for an answer
  // that is the same on nine rows out of nine. What a reader needs to be told is that this list
  // is not something to act on, which is a fact about the set.
  function provenanceLine(P, props) {
    if (!P || !props.length) return '';
    var count = {}, apto = 0;
    props.forEach(function (row) {
      var st = statusOf(P, row);
      count[st] = (count[st] || 0) + 1;
      if (P.apto.indexOf(st) >= 0) apto++;
    });
    var parts = STATUS_ORDER.filter(function (st) { return count[st]; })
                            .map(function (st) { return count[st] + ' ' + st; });
    return 'provenance: ' + parts.join(', ') + '. '
           + (apto ? apto + ' of ' + props.length + ' fit to act on.'
                   : 'Nothing here is fit to act on.');
  }

  var ZM = window.ZM = window.ZM || {};

  // opts.svg          the drawing, whose background clears the selection when clicked
  // opts.panel        the detail panel
  // opts.rosterRoute  the address of the student list, for the one node that stands for a list
  // opts.typeLabel    a type key to the name the reader is told
  // opts.typeSwatch   a type key to the fill and the stroke a swatch of it is drawn with
  // opts.provenance   the document's stance, clock, apto rule and vocabularies
  // opts.moreLink     a node to a further view of what it is one of, or null. Issues 80 and 82.
  //                   This file asks and does not answer: a node that is one of a set is a fact
  //                   about the model, and which address holds that set is a fact about the page,
  //                   so the wiring supplies it and nothing here learns a route or a count.
  // opts.onReveal     called with a node once the panel has taken its bite of the screen
  ZM.selection = function createSelection(opts) {
    var svg = opts.svg, panel = opts.panel;
    var ROSTER_ROUTE = opts.rosterRoute;
    var typeLabel = opts.typeLabel, typeSwatch = opts.typeSwatch;
    var PROV = opts.provenance || null;
    var moreLink = opts.moreLink;
    var onReveal = opts.onReveal;

    var G = null, nodeById = {}, edgesOf = {}, gfxNode = {}, gfxEdge = [];
    // id -> { by: {id: true}, edges: [index], group: id or null }. Rebuilt by bind().
    var veiled = {};
    var current = null;

    // ---- who is painted on demand ---------------------------------------------
    // Read off the edges, once per drawing, against the table at the top of this file.
    function bind(gfx) {
      G = gfx.drawing;
      nodeById = gfx.nodeById; edgesOf = gfx.edgesOf;
      gfxNode = gfx.gfxNode; gfxEdge = gfx.gfxEdge;
      current = null;

      veiled = {};
      gfxEdge.forEach(function (x, i) {
        VEIL_RULES.forEach(function (r) {
          if (x.e.v !== r.verb) return;
          var hid = r.hide === 't' ? x.e.t : x.e.s;
          // ISSUE 100. NEVER AN OUTSIDE TILE. Under a time window render.js gives each lane that
          // lost tiles one standing for them, and folds the lines that used to reach those tiles
          // onto it, keeping the verb so that a folded line into a node this table hides is hidden
          // with it. That is the case this rule is for and it still works. What it must not do is
          // fire on the count tile itself: an 'employed by' fold between two outside tiles named
          // the employers' one as the thing to hide and the instructors' one as the thing that
          // reveals it, and the second is not a target, so the count sat in the lane taking its
          // space and could never be shown. A count of what is off the picture is a sentence about
          // the picture; nothing in this table is about that.
          if (gfxNode[hid] && gfxNode[hid].outside) return;
          var by = r.by === 't' ? x.e.t : x.e.s;
          var rec = veiled[hid] || (veiled[hid] = { by: {}, edges: [], group: null });
          rec.by[by] = true;
          if (r.together) rec.group = by;
          rec.edges.push(i);
          // An edge to nothing must not be drawn, so the line, its arrowhead and its verb chip
          // carry the same class as the tile they land on and come and go with it. Without this
          // the drawing would keep an arrow pointing into an empty lane, which is a stronger
          // claim than it means.
          x.g.classList.add('veil');
          x.c.classList.add('veil');
        });
      });
      // Members of one group are revealed together, so each of them counts as a revealer of the
      // others. Done once here rather than tested on every selection.
      Object.keys(veiled).forEach(function (id) {
        var grp = veiled[id].group;
        if (!grp) return;
        Object.keys(veiled).forEach(function (other) {
          if (veiled[other].group === grp) veiled[id].by[other] = true;
        });
      });
      Object.keys(veiled).forEach(function (id) {
        if (gfxNode[id]) gfxNode[id].g.classList.add('veil');
      });
      // The marker under a group's own card is part of the reveal and not part of the card.
      Object.keys(gfxNode).forEach(function (id) {
        if (gfxNode[id].tail) gfxNode[id].tail.classList.add('veil');
      });
      veil();
    }

    // ---- painting the on demand nodes -------------------------------------------
    // Which of them are on the page. Only while the selection is the node itself or one of the
    // nodes the table says reveals it, so a reveal never accumulates: an ordinary reading session
    // would otherwise end with all five employers and all four students on the page, which is the
    // state issues 48 and 51 exist to remove, and the reader would have no way back to the quiet
    // drawing short of a reload. Clearing the selection is the way back, and moving it from an
    // instructor to the students card and back behaves by construction, because the whole set is
    // recomputed from the current selection every time rather than toggled.
    //
    // Nothing here moves the drawing. The layout is generated for the full node set, so a hidden
    // node keeps the coordinates the build gave it and is simply not painted; revealing it paints
    // it into space it already owns, and the drawing's extent, which is what the fit frames, is
    // the same number before and after. Laying the drawing out again without the hidden nodes was
    // the alternative and is worse twice over: every tile on the page would move on every click,
    // and the coordinates would stop being a pure function of the model.
    function veil() {
      var shown = {};     // group id -> is any member of it on screen
      Object.keys(veiled).forEach(function (id) {
        var show = !!current && (current === id || veiled[id].by[current] === true);
        var grp = veiled[id].group;
        if (grp) shown[grp] = shown[grp] || show;
        var f = gfxNode[id];
        if (f) {
          f.g.classList.toggle('veil-hidden', !show);
          // Out of the tab order and out of the accessibility tree as well as out of the picture.
          // The stylesheet's `visibility: hidden` already does both, and doing it here as well is
          // the belt: what must never happen is a keyboard landing on a tile nobody can see, or a
          // capture-mode click filing a card about one.
          if (show) {
            f.g.setAttribute('tabindex', '0');
            f.g.removeAttribute('aria-hidden');
          } else {
            if (document.activeElement === f.g && f.g.blur) f.g.blur();
            f.g.removeAttribute('tabindex');
            f.g.setAttribute('aria-hidden', 'true');
          }
        }
        veiled[id].edges.forEach(function (i) {
          gfxEdge[i].g.classList.toggle('veil-hidden', !show);
          gfxEdge[i].c.classList.toggle('veil-hidden', !show);
        });
      });
      // The marker saying how many members were not drawn. It belongs to the group's own card, is
      // reserved a line by the build whether or not anything is painted in it, and is on screen
      // exactly while the members are: four tiles with no count beside them would quietly stand in
      // for thirty four people, which is the defect it exists to prevent.
      Object.keys(shown).forEach(function (grp) {
        var f = gfxNode[grp];
        if (f && f.tail) f.tail.classList.toggle('veil-hidden', !shown[grp]);
      });
    }

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
      veil();
      Object.keys(gfxNode).forEach(function (k) { gfxNode[k].g.classList.remove('dim'); });
      gfxEdge.forEach(function (x) { x.g.classList.remove('dim'); x.c.classList.remove('dim'); });
      panel.classList.remove('open');
      document.body.classList.remove('panel-open');
    }

    // ---- the panel's type caption ----------------------------------------------
    // Issue 69. THE CAPTION IS TEXT AND IS NO LONGER PAINTED IN THE TYPE COLOUR.
    //
    // It used to be `#ptype.style.color = typeColor(n.type)`, the same token the tile's stroke
    // carries. A stroke is the visual boundary of a component and WCAG 2.2 SC 1.4.11 asks 3:1 of
    // it; this is 11px bold uppercase, so it is text and SC 1.4.3 asks 4.5:1. One token cannot
    // answer both without the stricter bar deciding the palette, and it did: issues 56 and 65
    // both targeted 4,5 rather than the gate's own 3,0 to fix the stroke and this label with one
    // number, and #65 recorded afterwards that decoupling here would have made two of its
    // darkenings unnecessary. Three light labels were under 4.5 anyway when this was written, the
    // ghost grey at 2,8807, Session template at 3,1440 and Cohort at 3,1826, and two of those
    // three pass the 3:1 the gate asks, so no check had an opinion about them.
    //
    // WHAT IT TAKES INSTEAD is --fg-muted, which is what every other caption in this panel is
    // painted with: the note, the property keys and the provenance line. It measures 5,4113 on
    // the panel in light and 6,8297 in dark, so all thirteen clear 4.5 in both themes at once and
    // by construction rather than by thirteen numbers that have to be rechecked whenever one
    // moves. Not --fg-body, which at 16,2 would make an 11px caption the loudest thing in the
    // panel after the name it is a caption for.
    //
    // THE COLOUR IS NOT DISCARDED, IT IS MOVED ONTO A SHAPE. The obvious argument for dropping it
    // altogether is that the panel sits beside the tile the reader just clicked, so the tile
    // carries the identity. That argument is weaker here than it looks: selecting a node repaints
    // its tile in --i-primary, so the one tile the panel is about is the one tile not showing its
    // type colour. The swatch is a nine pixel copy of that tile drawn from the same two values,
    // and it is a graphical object rather than text, so it answers 3:1, which is the bar the
    // palette was chosen against in the first place.
    //
    // THE GHOST STAYS QUIET, WHICH IS THE ONE THING THIS COULD HAVE BROKEN. Its grey is the light
    // value of --c-gray-3, the stylesheet's "grey of a line", read by nine rules for every edge
    // and arrowhead, and #65 kept it declared because the drawing is saying "this does not exist"
    // and a louder grey contradicts the drawing. Nothing here touches that hex. The ghost's
    // swatch is its tile: the seven per cent wash every other tile carries at fourteen, bounded
    // by a dashed hairline rather than a solid one, which is the quietest of the thirteen exactly
    // as its tile is the quietest tile. What does change for the ghost is its caption, which was
    // the least legible text in the panel at 2,8807 and is now the same grey as every other
    // caption. Decoupling makes the words readable and leaves the drawing's statement alone,
    // which is the whole reason the two should never have shared a token.
    //
    // INLINE AND NOT A STYLESHEET RULE, for the reason already written beside the property list
    // below: site/app.css is not this card's to change, and a rule set from here is one fewer
    // file two people are editing at once. The class name is on the element so the declarations
    // can move into that file whole, and every value that is a colour is a custom property rather
    // than a hex, so the swatch follows the theme from the same place everything else does.
    function paintType(n) {
      var ptype = document.getElementById('ptype');
      ptype.textContent = '';
      ptype.style.color = 'var(--fg-muted)';
      // `box` and not `paint`, which is the name of the function above that inverts a selected
      // tile. Two paints in one file is one shadowed variable away from a confusing read.
      var box = typeSwatch(n.type, n.ghost);
      var sw = document.createElement('span');
      sw.className = 'ptype-swatch';
      sw.style.cssText = 'display:inline-block;width:9px;height:9px;border-radius:2px;'
        + 'margin-right:7px;vertical-align:baseline;'
        + 'background:' + box.fill + ';'
        + 'border:1px ' + (n.ghost ? 'dashed' : 'solid') + ' ' + box.stroke + ';';
      ptype.appendChild(sw);
      ptype.appendChild(document.createTextNode(typeLabel(n.type)));
    }

    // One link out of the panel and the sentence under it. Two callers, one shape, so a second
    // view reached from a node arrives without this markup being written a third time.
    function addMore(host, href, text, hint) {
      var a = document.createElement('a');
      a.className = 'linkbtn pmore-link';
      a.href = href;
      a.textContent = text;
      host.appendChild(a);
      var h = document.createElement('span');
      h.className = 'pmore-hint';
      h.textContent = hint;
      host.appendChild(h);
    }

    function select(id) {
      if (current === id) { clear(); return; }
      if (current) paint(current, false);
      current = id;
      paint(id, true);
      veil();

      var keep = {};
      keep[id] = true;
      var live = {};
      edgesOf[id].forEach(function (i) {
        var e = G.edges[i];
        keep[e.s] = true; keep[e.t] = true; live[i] = true;
      });
      Object.keys(gfxNode).forEach(function (k) {
        gfxNode[k].g.classList.toggle('dim', !keep[k]);
      });
      gfxEdge.forEach(function (x, i) {
        x.g.classList.toggle('dim', !live[i]);
        x.c.classList.toggle('dim', !live[i]);
      });

      var n = nodeById[id];
      paintType(n);
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
      n.props.forEach(function (p, i) {
        var dt = document.createElement('dt');
        dt.textContent = p.k;
        // The first n.route rows answer how this type gets filled at all; the rest are what it
        // would hold. Two different questions in one list, so a hairline separates them, and the
        // build says where it goes by counting rather than by the browser recognising a key.
        //
        // Inline rather than a class, and that is the only reason worth stating: the stylesheet is
        // not this card's to change, and a rule set from here is one fewer file two people are
        // editing at once. It reads the same custom property the stylesheet's own rules read, so
        // it follows the theme rather than pinning a colour.
        if (n.route && i === n.route) {
          dt.style.borderTop = '1px solid var(--rule-muted)';
          dt.style.paddingTop = '11px';
        }
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
      // Under the list and not beside any one row of it, because it is a fact about the set.
      // Issue 73.
      document.getElementById('pprov').textContent = provenanceLine(PROV, n.props);
      // A node that stands for a list says where the list is. Only one node does, and which one is
      // named by the build rather than by an id written here, so a second aggregate would arrive
      // with its own link and this code would not have to learn about it.
      //
      // ISSUES 80 AND 82 PUT A SECOND WAY OUT HERE, and this is where the owner asked for it: he
      // filed both cards from a node, one from a cohort session asking for the calendar and one
      // with a template selected asking for the outline. The panel is where a reader already is
      // when they want the rest of what a node is one of, and #77 has just rebuilt a header row
      // that is not taking a sixth control. Written the same way as the students link because it
      // is the same idea, and asked for rather than decided: the wiring answers for the types it
      // has a view of and returns nothing for the rest.
      var pmore = document.getElementById('pmore');
      pmore.textContent = '';
      if (G.roster && G.roster.owner === id) {
        addMore(pmore, ROSTER_ROUTE, 'see all ' + G.roster.n + ' students',
                G.roster.drawn + ' of them are drawn here; the list has every row.');
      }
      var more = moreLink ? moreLink(n) : null;
      if (more) addMore(pmore, more.href, more.text, more.hint);
      panel.classList.add('open');
      document.body.classList.add('panel-open');
      reveal(n);
    }

    // Keep the selected node visible once the panel has taken its bite of the screen. The panel
    // takes that bite on a different axis at each width: above the breakpoint it is a rail down
    // the right and the canvas is inset for it, below the breakpoint it is a sheet across the
    // bottom and the node it describes is usually underneath it, since at 390px 22 of the 30
    // tiles sit in the sheet's band.
    //
    // This used to be a scroll on whichever of the canvas and the page could take one, and it was
    // the awkward part of issue 21: below the breakpoint the page was barely taller than the
    // viewport, so the scroll ran out and the room had to be manufactured by reserving the sheet's
    // own height under the drawing. A canvas cannot run out. The viewport pans instead, which is
    // the same motion at both widths and needs no room reserved anywhere, and the reserve is
    // gone from the stylesheet with it. The delay is still there and is still about the sheet:
    // its height is only true once the class is on the panel.
    function reveal(n) {
      setTimeout(function () { if (onReveal) onReveal(n); }, 30);
    }

    document.getElementById('close').addEventListener('click', clear);
    svg.addEventListener('click', clear);
    // Escape clears the selection. It is registered in the bubble phase on purpose: feedback.js
    // takes Escape in the capture phase while its capture mode is on and stops it there, so the
    // one Escape that leaves capture mode never also throws away the selection the note is
    // about. This listener only ever sees the Escapes that capture mode did not want. The student
    // list and the programme list take their own Escape in the capture phase for the same reason,
    // one level up: closing either of them must not also lose the node open behind it.
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') clear(); });

    return {
      bind: bind,
      select: select,
      clear: clear,
      // The node record the reader has open, or null. The ghosts toggle reads it, because hiding
      // the ghosts while one is selected has to close the panel describing it.
      node: function () { return current ? nodeById[current] : null; },
      // What a driver is told about the selection: the key a feedback report would quote, the
      // label and the type as the reader is told them.
      selected: function () {
        if (!current) return null;
        var n = nodeById[current];
        return { id: n.id, label: n.label, type: typeLabel(n.type) };
      },
      // Which nodes the drawing is not painting, for the same reason the view is published:
      // whether a reveal put exactly the intended set on screen is a claim a driver should be able
      // to read off the running page rather than infer from a screenshot. Derived from the rule
      // table, so it cannot report a set the stylesheet is not acting on.
      veiledState: function () {
        var out = { hidden: [], shown: [] };
        Object.keys(veiled).forEach(function (id) {
          (gfxNode[id].g.classList.contains('veil-hidden') ? out.hidden : out.shown).push(id);
        });
        out.hidden.sort(); out.shown.sort();
        return out;
      }
    };
  };
})();
