#!/usr/bin/env python3
"""The lanes of the drawing and the captions over them, in one file with no side effects.

WHY THIS IS ITS OWN MODULE. It used to be a constant in build/build_layout.py and a second copy
of the same strings in build/measure_labels.py, with a comment on the copy saying it had to be
changed with the original. That held while the captions were literals somebody edited. Issue 83
made two of them a sentence written from the model, "6 of 22 session templates" against "all 28
session templates", and a caption that is computed cannot be copied by hand at all: the measurer
has to be able to produce exactly the lines the builder will produce, for all seven views, or it
measures the wrong strings and the layout falls back to a per character estimate that is wrong by
up to a fifth.

build/build_layout.py imports the geometry side of it and build/measure_labels.py imports the
text side. Nothing here opens a file, parses an argument or holds any state, which is what lets
both import it.

A CAPTION IS A CLAIM ABOUT THE TYPE OF EVERYTHING UNDER ITS LANE, so it has to hold for every
tile in the lane and not merely for most of them, and a false one is worse than a missing one
because a reader has no way to catch it. That rule is why three of the captions have alternates
and why two of them now carry a count.

===============================================================================================
A TALL LANE STAYS ONE COLUMN. Issue 83, decided by building both and measuring them.
===============================================================================================
Z-BL draws twenty eight session templates and twenty eight cohort sessions, Z-SC twenty five of
each. A band is a vertical lane at a pitch of about ninety units, so the drawing grew downwards:
Z-BL 588 to 2578 and Z-SC 610 to 2470. The open question was whether such a lane should wrap
into two sub-columns instead. It was not argued, it was built: a second SessionTemplate column
and a second CohortSession column, each holding the back half of its list, laid out through the
same sweeps.

    Z-BL                       one column          two sub-columns
    drawing                    1230 x 2578         1622 x 1382
    scale the fit frames it at 0.2281              0.4256
    edges joining neighbours   99 of 132           56 of 132
    edges drawn as an arc      1 of 132            33 of 132
    verb chip pairs overlapping 1, worst 0.1px     4, worst 0.9px
    the same on Z-SC            0                  3, worst 1.8px

WHAT THE WRAP BUYS is the second row: at fit it is 1.87 times the scale, which is real, and it
is the one cost the plane already answers. Issue 46 gave the drawing pan, zoom to eight times
and a fit control, and issue 76 put the wheel zoom behind Ctrl so an ordinary wheel scrolls it.
A reader who cannot read a tile at fit has a control for that.

WHAT IT COSTS has no control at all, and there are four things.

1. THE WRAP IS GLOBAL AND THE NEED IS LOCAL. COL_W, COLX and the drawing width are computed
   once at import and baked into every coordinate, so the two extra columns two views need are
   paid for by all seven: every unexpanded drawing measured 1622 x 681 against 1230 x 596, a
   third wider and a seventh taller, for a wrap it does not want.

2. IT TURNS THE DRAWING'S MOST REPEATED RELATIONSHIP INTO ARCS. `instance of` runs from a
   cohort session to the template it is a delivery of, and layout() draws an edge as a bezier
   between neighbours and, at a span of three or more, as an arc slung under the row. Split the
   two lanes and a session in the right hand session column pointing at a template in the left
   hand template column spans four. One arc became thirty three. The single arc it had was
   issue 63's host visit, deliberate and argued for on that card.

3. THE VERB CHIPS START PILING UP, because a chip is placed against the ones already down and a
   field of arcs leaves it fewer places to go. Nothing gates that; a verb printed over another
   verb is unreadable and the page still renders.

4. THE SECOND COLUMN HAS NO MEANING TO GIVE. A lane is a kind of object and a caption is a claim
   about everything under it, and "the back half of the list" is a fact about how long the list
   is. The vault carries a module on most rows, which is a real grouping and is what issue 85
   groups the outline by, but the modules are one to seventeen rows long and would make
   sub-columns of wildly different heights, which buys none of the height back. And it is not
   every row: Z-CFA names no module on any of its forty five, Z-HR on four of twenty five and
   Z-PE on twenty seven of thirty six, so a wrap along module boundaries would have no boundary
   to follow on three of the seven. And the barycentre sweeps reorder each column against its
   neighbours, so even a split made in sequence does not stay in sequence.

So: one column, and the drawing is tall. It is the plane's job to make that navigable, which is
what issue 46 built it for and what issue 81 asked for again.
"""

# ---- the sentinels -----------------------------------------------------------
# A caption line the view fills in. It is a sentinel and not a format string because a format
# string is a thing somebody can pass the wrong argument to, and because the line for a view that
# draws its whole syllabus is not the same sentence with different numbers in it: it reads "all
# 28 session templates" and not "28 of 28".
SAMPLE_TEMPLATES = "\x00session-templates"
SAMPLE_SESSIONS = "\x00cohort-sessions"

# What each sentinel counts, and the words it ends in. The key into a view's `counts` block in
# the instance document is the node type, so the caption cannot come to be about a different set
# of tiles from the one it sits over.
SENTINEL = {
    SAMPLE_TEMPLATES: ("SessionTemplate", "session templates"),
    SAMPLE_SESSIONS: ("CohortSession", "scheduled"),
}

# ---- the lanes ---------------------------------------------------------------
# Each entry is a run of columns holding one kind of thing, drawn as its own lane with its own
# caption. The instructors and the session templates sit in bands of their own for exactly this
# reason: they are different kinds of object and the drawing should say so without relying on
# tile colour.
#
# The cohort sessions lane also holds the empresa colaboradora, whose visit attaches at session
# level, and that placement is right: the finde presencial is a session level event and the
# "hosts visit" edge leaves from beside the sessions it is about. The caption is what had to
# change for it. Captions are a tuple of lines rather than one string because a lane is only as
# wide as the columns under it and a longer caption has nowhere to go sideways.
BANDS = [
    # Plural since issue 49: the lane held one employer and now holds five, and a caption is a
    # claim about everything under it. Two lines since issue 48, which stopped painting those
    # five until the instructor each of them employs is clicked. A lane captioned only
    # "programme", holding one tile in a tall empty strip, would be true of what is on screen and
    # would hide that there is anything else in it; a lane still captioned "programme and
    # employers" with no employer under it reads as five tiles that failed to load. The second
    # line is the affordance, so the emptiness is legible as a state rather than as a fault.
    ([0], ("programme", "employers appear on click")),
    # Issue 83. This lane read "session templates" while it drew six tiles of a syllabus holding
    # up to seventy nine, and said nothing about the other seventy three. Two of the seven views
    # now draw their whole syllabus and five still draw six, so the lane has to say which it is:
    # two complete columns standing beside five sampled ones with nothing distinguishing them
    # invites the reader to conclude that Big Law is four times the programme Data Science is,
    # which the data does not say.
    ([1], (SAMPLE_TEMPLATES,)),
    ([2], ("instructors",)),
    # Three lines since issue 83, and this is where the drawing pays for the declaration: the
    # lane under it is 142 units wide, "6 of 22 cohort sessions" does not fit across it, and a
    # caption is sized by its columns and not by its own text. So the count is its own line. It
    # costs eleven units of headroom on all seven drawings, because BAND_TOP reserves for the
    # longest caption any view could carry rather than for the one this view does.
    ([3], ("cohort sessions", SAMPLE_SESSIONS, "and the visit host")),
    # Two lines since issue 51, for the same reason the programme lane grew one in issue 48: the
    # lane holds four Student tiles that nothing paints until the students card is clicked, and a
    # caption naming only what is on screen would hide that the lane holds anything else.
    ([4, 5], ("cohort and students", "individuals appear on click")),
    ([6, 7], ("enrolment to claim",)),
]

# A stable name per lane, in the order above, shipped on the geometry beside the caption.
#
# ISSUE 84 IS WHY IT EXISTS. A lane heading became a control, and the page has to be able to ask
# which lane it is looking at without matching the caption's text: the text is computed from a
# view's counts and has three alternates, so "the lane captioned session templates" is not a way
# to find a lane. This is, and it does not change when a caption does.
BAND_KEYS = ("programme", "templates", "instructors", "sessions", "cohort", "enrolment")


# ---- and three of them can be false, so they are a per view argument -----------
# Issue 43. BANDS above was a module constant shared by every call to layout(), which held while
# there was one drawing to lay out. There are seven now and they do not hold the same kinds of
# thing: Z-CFA has no instructor anywhere in its source, no employer and no visit host, so
# "employers appear on click" would promise tiles that do not exist, "instructors" would caption
# an empty lane as though its tiles had failed to load, and "and the visit host" would name a
# tile nothing draws.
#
# The three alternates are chosen by what a view ACTUALLY HOLDS and never by its code. Special
# casing Z-CFA would have been a line of code and a lie about the mechanism: the next programme
# with no visit host would have inherited the false caption in silence.
CAP_NO_EMPLOYERS = ("programme",)
# Two words and not a sentence, because the lane under it is 140 units wide and the caption is
# sized by the columns and not by its own text. The first draft read "none recorded for this
# programme", the lane overflow gate refused the build by 51.5px, and the gate was right.
CAP_NO_INSTRUCTORS = ("instructors", "none recorded")
CAP_NO_HOST = ("cohort sessions", SAMPLE_SESSIONS)

# Every caption tuple any view can be given. BAND_TOP is measured over this and not over the
# ones a particular view carries: the seven routes are read one after another and a header that
# changed height between them would make the whole drawing jump.
CAP_ALL = [lines for _cs, lines in BANDS] + [CAP_NO_EMPLOYERS, CAP_NO_INSTRUCTORS, CAP_NO_HOST]
MAX_CAP_LINES = max(len(lines) for lines in CAP_ALL)

if len(BAND_KEYS) != len(BANDS):
    raise SystemExit(f"bands: {len(BAND_KEYS)} lane names for {len(BANDS)} lanes. A lane added "
                     f"without a name would ship geometry the page cannot ask about, and a name "
                     f"left behind would point at the lane after it.")


def sample_line(counts, sentinel):
    """The one line a sentinel stands for, on a view with these counts.

    `counts` is the block the instance document carries per view: how many tiles of a type the
    view draws and how many the syllabus holds. Both numbers come from the document, so a
    caption cannot disagree with the panel of the tile it sits over.
    """
    key, noun = SENTINEL[sentinel]
    block = counts[key]
    drawn, total = block["drawn"], block["total"]
    if drawn > total:
        raise ValueError(f"the {key} lane draws {drawn} of a declared {total}")
    return f"all {total} {noun}" if drawn == total else f"{drawn} of {total} {noun}"


def fill(lines, counts):
    """One caption tuple with its sentinels resolved against one view's counts."""
    return tuple(sample_line(counts, ln) if ln in SENTINEL else ln for ln in lines)


def every_line(counts_by_view):
    """Every caption line any of the given views could be captioned with.

    What build/measure_labels.py has to measure. It is the union over the views and over all the
    alternates, not over the captions a view actually gets: a line that is only reachable on one
    of the seven still has to be measured, because the overflow gate reads it there.
    """
    out = set()
    for counts in counts_by_view:
        for lines in CAP_ALL:
            out.update(fill(lines, counts))
    return sorted(out)
