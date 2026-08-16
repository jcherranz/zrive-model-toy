# Toy instance graph for the Zrive operating model.
#
# Everything here is invented except: the company name Zrive, the programme name and code,
# the session titles (published on the company's own public website) and the names of firms
# that are companies rather than people. All teacher names are invented. All identifiers,
# dates, counts and money figures are invented. No value in this file is measured.
import collections
import copy
import datetime
import hashlib
import json
import math
import pathlib
import re
# Every line this file prints goes to stderr, and that is not a style choice. stdout is the
# palette table `--contrast` emits, scripts/check_repo.sh parses it field by field, and a
# diagnostic printed beside it aborts that gate with a complaint about the table.
import sys
# Only build/model.py --ontology-self-test uses it: that suite writes a whole synthetic corpus
# to a temporary directory so the gate can be proved to refuse on a machine that holds no real
# one, which is every CI runner this repository has.
import tempfile

TYPES = [
    # key,             label,               colour,    glyph
    #
    # NO COLUMN. A column is where a type is DRAWN, which is geometry, and geometry left this
    # file with issue 60 seam 1. The table lives in build/build_layout.py, which is the half of
    # the build that decides where things go, and it is checked against the type keys this file
    # emits so a new type without a column stops the build rather than landing in column zero.
    # The colour and the glyph stay, because a type's colour is a fact about the type and the
    # contrast gate reads it out of this file.
    ("Programme",      "Programme",         "#9d3f9d", "programme"),
    ("Company",        "Company",           "#5f6b7c", "company"),
    ("SessionTemplate","Session template",  "#00a396", "document"),
    # ---- the two aggregates, issue 89 -------------------------------------------------------
    # A Module is a set of session templates and a Module delivery is the set of cohort sessions
    # that run them, so each is drawn in the lane of the thing it aggregates and each is a near
    # NEIGHBOUR of that thing's colour rather than a new hue. That rule was in the palette before
    # this card and nobody had written it down: measured across all thirteen colours in both
    # themes, CIE76, the closest pair in light was Students / Student at 10.94 and every other
    # pair stood 18 or more apart. Students and Student are the one aggregate and its members the
    # drawing already had.
    #
    # THE NUMBERS, on the band plate (#fafbfc light, #20252c dark), which is the gated surface:
    #
    #   Module           #039076   3.8573 light   3.8569 dark   10.68 from Session template
    #   Module delivery  #b27f00   3.4185 light   4.3520 dark   11.54 / 11.98 from Cohort session
    #
    # Both clear the 3.0000 of WCAG 2.2 SC 1.4.11 in both themes with room, and both stand 25 or
    # more from every colour that is not their own member. ONE HEX EACH AND NO DARK OVERRIDE,
    # which is Session template's own arrangement rather than a new one.
    #
    # THE DIRECTION IS NOT PART OF THE RULE AND IS NOT CLAIMED. Students is lighter than Student
    # and Module is darker than Session template, because issue 81 left Session template binding
    # at 3.0346 on the light plate and a lighter neighbour of it has nowhere to go. What is
    # claimed is the distance.
    ("Module",         "Module",            "#039076", "modules"),
    ("Instructor",     "Instructor",        "#147eb3", "person"),
    ("CohortSession",  "Cohort session",    "#976e08", "calendar"),
    ("ModuleDelivery", "Module delivery",   "#b27f00", "moduleruns"),
    ("Cohort",         "Cohort",            "#29a634", "cohort"),
    ("StudentGroup",   "Students",          "#657e1a", "stack"),
    # A Student is a member of that group, so it is drawn in the group's own lane and in the
    # colour family the group already owns, one shade down. Which column of that lane it sits in
    # is a geometric question and its answer is in build/build_layout.py with the rest of them.
    #
    # "One shade down" is a claim the light half of this pair nearly stopped being able to make.
    # Issue 65 had to darken Students to clear the plate, and the shade it lands on is the shade
    # Student was already sitting on: Student IS the darkened Students, so there is no value for
    # the group that clears the threshold and stays a different colour from its own member. The
    # family moved down together rather than collapsing into one colour, and the numbers are in
    # the palette section at the foot of this file.
    ("Student",        "Student",           "#526b1b", "cap"),
    ("Enrolment",      "Enrolment",         "#7961db", "link"),
    ("Agreement",      "Agreement",         "#946638", "agreement"),
    ("Charge",         "Charge",            "#d33d17", "coin"),
    ("Claim",          "Claim",             "#db2c6f", "claim"),
]

D = "dummy"
E = "estimated"
# A third flag, for the rows that record an absence rather than a value. It is not a weaker
# kind of dummy: a dummy value stands in for something a system holds, and an absent one says
# no system holds it at all.
A = "absent"
# A FOURTH FLAG, AND IT IS THE FIRST ONE THAT IS NOT A KIND OF PLACEHOLDER. Issue 85.
#
# Until this card every property VALUE on this page was invented, and the session titles were
# real only because a title is the node's label rather than one of its rows. `module_name` and
# `sequence` are the first real published values to reach a property list: they are the vault's
# own frontmatter, the same corpus the titles come from, and rendering them as `dummy` beside a
# made up attendance figure would tell the reader the exact opposite of what is true of them.
#
# It is a flag and not a rank. The rank beside it says the same thing in the machine half of the
# document, and check_provenance() below refuses the pair coming apart.
R = "real"

# ---- and the flag vocabulary, issue 104 --------------------------------------
# THE SENTENCE ABOVE WAS FALSE WHEN IT WAS WRITTEN. check_provenance() read `f` at exactly one
# place, inside the four agenda rows, and never once in the node walk. There was no set of the
# four values anywhere in the tree to check a fifth against, so `f = "banana"` was accepted and
# went straight into a class name in the panel; `f` deleted outright from all 3109 node rows was
# accepted; and 121 invented values were shipped flagged `real`, past every gate, on a page whose
# footer says every number on it is made up.
#
# So the four values are a vocabulary now, and it ships with the document exactly as the rank,
# status and stance vocabularies do, for issue 72's reason: a token whose meaning is only in the
# program that wrote it is not machine readable, and a private document laid out through
# --instance declares its own flags rather than being judged against this toy's.
#
# The order is the order a reader meets them in: three kinds of placeholder, then the one that
# is not a placeholder at all.
VALUE_FLAG = {
    D: "a value stands here in place of one some system would hold. It was made up so that the "
       "panel has something to show, and the thing it stands in for is real",
    E: "a value nobody read, put at the size the thing is believed to be. It is a placeholder "
       "with an opinion about magnitude, and it is not a measurement",
    A: "no value, because no system holds one. It records an absence rather than standing in "
       "for a presence, which is why it is not a weaker kind of dummy",
    R: "the value was read off a source outside this repository and is reproduced here. It is "
       "not a placeholder, and it is the only flag on this page that is not",
}


# ---- provenance, issue 73, seam 5 --------------------------------------------
# A management tool needs three things about a value that this model has never carried: where it
# came from, when it was read, and whether that is still good enough to act on. The flag above
# answers none of them. `dummy` says what KIND of value it is; it says nothing about where the
# value came from, which is why an `estimated` route row citing a real analysis and an
# `estimated` tile value somebody made up have looked identical on this page since day one.
#
# NOTHING HERE IS INVENTED. The Z-Map solves this exact problem, it is house doctrine, and its
# schema note is the specification this block was written against:
# 02_areas/zrive/03_resources/professional_map/_doc/Z-Map, esquema.md, version 2.2. Four things
# are copied and one is deliberately not.
#
#   COPIED, the two rules it says hold the whole model up.
#   1. Every row carries its source and a `source_rank`. Authority is a property of the SOURCE
#      and never a feeling about the row. Here: every value carries `r`, a rank, and `at`, the
#      date the source was read.
#   2. A row nobody has verified is refused by a gate rather than quietly used. There, a blank
#      `last_verified_on` computes to `partial`, `partial` is not `apto`, and no student-facing
#      document may name a person from outside `apto`. Here, `at` null computes to `unread`,
#      `unread` is not apto, and check_provenance() below refuses.
#
#   COPIED, computed and never typed. The Z-Map says "`status` and `apto` are computed, never
#   typed". So neither is in this document. The panel computes them from `r`, `at` and the
#   clock, and the gate refuses a row that carries either as a field, because a typed status is
#   a status that can be typed wrong and nothing downstream would know.
#
#   COPIED, the windows. Fresh to 120 days, aging to 240, verbatim from the Z-Map's Tier A clock.
#
#   NOT COPIED, and this is the one departure worth arguing. The Z-Map multiplies its windows by
#   seniority, because juniors churn fastest, and that multiplier is a measurement of a real
#   population. Nothing in this repository has measured how fast anything here goes out of date,
#   so seven per-class multipliers would be seven invented numbers wearing a measurement's
#   clothes, which is the failure this whole seam exists to prevent. One window is declared for
#   every class instead. Where a per-class window would eventually go is already built: the
#   registry entry for the class, whose `event` field is what would set it.
#
# THE HARD PART, AND IT IS NOT DODGED: EVERY VALUE HERE IS INVENTED, SO WHAT DOES `at` MEAN?
# The honest answer is that being invented IS a provenance state, and it is the one the Z-Map
# never needed a rank for because no Z-Map row is invented. So the rank vocabulary is the
# Z-Map's three with a fourth BELOW them, and it is where all but four rows of every node sit.
# An invented value has no read date, because there was no read; `at` is null and the gate
# refuses a date written onto one, since a date on a read that never happened is the exact lie
# the scheme is built to make impossible.
#
# AND THE DOCUMENT TURNED OUT NOT TO BE UNIFORM, WHICH IS THE FINDING. The four route rows at
# the front of every node are NOT invented. They are read off the ontology analysis and each one
# already cites where: `route_source` reads "ontology.yaml, Programme, finding F25". So this
# document carries two populations that have been rendered identically, and the reader has had
# no way at all to tell a real finding about Zrive's systems from a number made up to fill a
# tile. Ranking them apart is the whole of what this seam adds to what a reader can see.
#
# WHY THE ROUTE ROWS ARE `3_observed` AND NOT `1_official`, checked against seam 3 rather than
# chosen. `1_official` is a read of the record the holding system keeps. Issue 72's registry
# says, for all seventeen classes, that the read state is `no-source` or `not-attempted`:
# nothing here has ever reached a system. A value claiming to be read from a system's own record
# would contradict the registry sitting beside it in the same document, and check_provenance()
# refuses exactly that pair. What was read is an analysis OF the systems, which is what
# `3_observed` means. Undated, because the analysis dates are not recorded in this repository and
# a plausible date is worse than none: it would compute to `fresh` and the value would read as
# current. Undated computes to `unread` and is refused, which is the correct answer.
INVENTED = "0_invented"
OFFICIAL = "1_official"
CONFIRMED = "2_confirmed"
OBSERVED = "3_observed"

# The Z-Map's `source_rank` vocabulary, its three definitions kept, plus the rank it never
# needed. Ships with the document like issue 72's vocabularies, so a reader of site/instance.js
# has the meaning of every token without reading Python.
VALUE_RANK = {
    INVENTED: "nothing was read. The value was made up so that the drawing has something to "
              "draw, and it stands in for a value some system would hold",
    OFFICIAL: "read from the record the holding system itself keeps, or from a signed document",
    CONFIRMED: "somebody who would know stated it",
    OBSERVED: "read off an analysis of the systems, or inferred from one",
}

# Computed from the rank, the read date and the clock. Never written into the document: a value
# carries the two facts and every reader derives the same answer from them.
VALUE_STATUS = {
    "invented": "nothing was read, so no clock applies and it is never fit to act on",
    "unread": "a source is named and no date says when it was read, so nothing can say whether "
              "the value is still true. The Z-Map's `partial`",
    "fresh": "read inside the fresh window",
    "aging": "read inside the aging window, and due",
    "stale": "read longer ago than the aging window",
}

# What kind of estate a whole document describes. One document, one stance: the point of the
# field is that mixing them is what the gate refuses.
STANCE = {
    "invented": "every value in this document stands in for one. Nothing in it may be acted on, "
                "and the public deployment is this one",
    "live": "the values in this document were read from the systems that hold them",
}

# The Z-Map's `apto`, and the name is kept because the rule is house doctrine and renaming a
# doctrine is how two copies of it drift.
APTO = ("fresh", "aging")

# ---- the third population, issue 85 ------------------------------------------
# THE DOCUMENT SAID THERE WERE TWO KINDS OF ROW AND THERE ARE NOW THREE. Issue 73 found the
# second: four registry rows at the front of every node that are read off the ontology analysis,
# rendered until then exactly like the invented ones. This card adds a third, and it is smaller
# and sharper. `module_name` and `sequence` are read off the programme syllabus in the vault,
# which is the same corpus every session title on this page comes from. They are not made up,
# so they may not be ranked `0_invented`, whose own definition in VALUE_RANK reads "nothing was
# read. The value was made up".
#
# THE GATE IS EXTENDED AND NOT RELAXED, and the difference is checkable. `toy-value-not-invented`
# used to say "every value in this model except the registry rows was made up", which this card
# makes false. It now excepts exactly the keys below, and a new rule refuses one of those keys
# ranked invented, so the population is closed in both directions: a syllabus row cannot pass as
# invented and an invented row cannot pass as a syllabus one by carrying a rank.
#
# `3_observed` AND NOT `1_official`, for the reason the route rows are. `1_official` is a read of
# the record the holding system keeps, and issue 72's registry says nothing here has reached a
# system; the vault is a private analysis of one, which is what `3_observed` means.
#
# AND NO READ DATE, WHICH IS THE PART THAT MATTERS ON A PUBLIC PAGE. A date would compute
# `fresh`, `fresh` is apto, and a value fit to act on inside a document whose stance is invented
# is refused by the rule above and should be. The syllabus is not on the machine that builds this
# in CI, so the honest state is `unread`: real, and not fit to act on.
SYLLABUS_RANK = OBSERVED

# ---- what a source PRODUCED, issue 123 ---------------------------------------
# TWO POPULATIONS ON THIS PAGE WERE READ OFF SOMETHING AND THEY ARE NOT THE SAME KIND OF THING.
# That difference is a declared token here rather than something a rule guesses from the shape
# of a declaration, because a rule that guesses is a rule that guesses wrong in silence.
#
# `values` is issue 118's population: a row whose VALUE was read off a corpus, wearing the
# `real` chip a reader can see. The whole of that card is about what may wear it.
#
# `registry` is issue 72's four rows at the front of every panel. They are not values of the
# object at all: they are facts about the CLASS it belongs to, read off an analysis OF the
# systems rather than off any system, and no reader should ever see `real` on one. `real` there
# would say the value was read off the thing the route describes, and nothing here has reached
# one of those systems. So the flag rule in check_provenance() runs the OTHER WAY for a registry
# source, and it is a refusal rather than a permission.
#
# THE ALTERNATIVE WAS A SECOND TABLE BESIDE VALUE_SOURCES, and two copies of a rule is the
# defect this repository has been bitten by five times, most recently in the token folding where
# the two copies were never the same rule. One table, one loop, one set of named rules, and one
# declared word that says which of the two a source is.
SOURCE_PRODUCES = {
    "values": "rows whose value was read off the corpus. These are the rows entitled to the "
              "`real` flag, and the only ones",
    "registry": "rows stating how a class of object is populated, read off an analysis OF the "
                "systems rather than off a system, and never `real`",
}

# ---- what "has a stated source" means, mechanically. Issue 118, audit round 6 F27 -----------
# THE RULE USED TO BE A LIST OF SIX WORDS AND THE AUDIT WALKED THROUGH IT. `real-flag-needs-a-
# source` tested one thing: whether the row's key was one of `module_name`, `sequence`,
# `modules`, `module_code`, `module`, `in_the_syllabus`. So issue 104's flagship mutation, a
# Programme row of invented prose forced to `real` at rank `3_observed`, shipped green the
# moment the row was RENAMED to `module`. The escape was to spell a key differently, which
# costs nothing, rather than to forge a source, which is the thing the rule is about. A six
# name allowlist is a weaker rule than the card claims, and it fails in the cheap direction.
#
# AND THE LIMIT IS STATED FIRST, because a check whose reach is oversold is what this repository
# is named for. NOTHING HERE CAN PROVE A VALUE IS REAL. The vault these rows are read from is
# not on the machine that builds this document in CI, so no gate here can open the corpus and
# compare a string against it. What follows makes the claim STRUCTURAL instead: a `real` value
# has to sit in a seat that a declared source says it produced, and every such seat is occupied
# and accounted for.
#
# So a source is declared, in the document, and it says four things:
#
#   `corpus`      what was read. A sentence, because the reader of these bytes is a person.
#   `read_on`     when it was read. Judged against the document's own as_of.
#   `rechecked_by`  the gate that re-reads the corpus wherever the corpus exists and refuses a
#                 drift. Named, so the claim joins to code rather than floating; and this build
#                 refuses a source naming one of ITS OWN gates that did not run, which is the
#                 seam a gate defined and never wired would otherwise hide.
#   `covers`      which (node type, property key) seats the source filled, and `rank` and
#                 `flags` are what it filled them with.
#
# THE THREE THINGS THAT MAKE THIS A RULE ABOUT THE SOURCE AND NOT ABOUT A SPELLING:
#
#   1. The pair is (TYPE, KEY) and not a bare key. A Programme row renamed `module` is not a
#      ModuleDelivery's `module` row, and the audit's A3 is refused for that reason.
#   2. A covered seat is a POPULATION and not a permission. Every node of a covered type carries
#      each covered key EXACTLY ONCE, checked. So a row cannot join the population by taking its
#      name: the seat is already occupied, two rows under one key is refused, and a covered seat
#      left empty is refused as well, which is a deletion the old rule could not see either.
#   3. The six names are now a CONSEQUENCE, and SYLLABUS_KEYS is gone rather than derived: a
#      tuple nobody reads is the next thing somebody edits instead of the table. They fall out
#      of `covers` and are printed from it when the gate refuses. Adding a value with a source
#      is declaring where it came from and which seats it fills, not typing a word into a list.
#
# WHAT IS STILL REACHABLE, said plainly. Delete the genuine `modules` row off a Programme and
# rename an invented row to `modules`, and the population is intact and the seat is forged. That
# is the residual, it is irreducible without the corpus, and it is a different act from the one
# this card closes: it forges the source's own row rather than renaming a row into a list. On
# the machine that holds the vault, check_module_structure() re-reads and refuses the drift.
#
# THE DECLARATION SHIPS WITH THE DOCUMENT, like the rank, status, stance and flag vocabularies,
# and for issue 72's reason: check_provenance() reads it off the document under judgement, so a
# private deployment laid out through --instance is judged against the sources IT declares and
# not against this toy's. A document declaring no source may carry no `real` value at all on an
# invented stance, which is stricter than the tuple was and is the honest default.
VALUE_SOURCES = {
    "programme-syllabus": {
        "corpus": "the programme syllabus notes in the owner's private vault, one note per "
                  "session, carrying `module`, `module_name` and `sequence` in their "
                  "frontmatter. The same corpus every session title on this page comes from",
        "read_on": "2026-08-11",
        "rechecked_by": "check_module_structure",
        # Issue 123. Spelled out rather than left to the default, because the reader of these
        # bytes now meets two sources that are not the same kind of thing and the difference is
        # what decides whether `real` is reachable through this one.
        "produces": "values",
        "rank": SYLLABUS_RANK,
        # Two flags and not one, because an absence read off a real source is a reading and not
        # a placeholder: eight session templates sit in no module and Z-CFA has no module
        # structure at all, and those rows say so as `absent`. A covered row wearing any other
        # flag is refused, which closes the downgrade direction on this population as well.
        "flags": [R, A],
        # The seats, and the whole of what may wear this source's flag. Issue 85 filled the
        # SessionTemplate pair, issue 89 the three module-altitude types.
        "covers": {
            "Programme": ["modules"],
            "SessionTemplate": ["module_name", "sequence"],
            "Module": ["module_code", "module_name", "in_the_syllabus", "sequence"],
            "ModuleDelivery": ["module"],
        },
    },
}

# The gates that re-read a corpus, filled in by the gates themselves when they run. A source
# naming a gate this program defines and did not run is refused: the claim is that the corpus is
# re-read wherever it exists, and a function nobody called re-reads nothing. A source naming a
# gate this program does not define at all is a foreign document's own gate, and this one says
# nothing about it rather than pretending to.
RECHECK_GATES_RUN = set()

FRESH_DAYS = 120
AGING_DAYS = 240

# ---- the recorded reading, issue 196 ---------------------------------------------------------
# THE MEASUREMENT THIS EXISTS FOR. Three of the gates below re-read a corpus, and all three of
# them used to `return` after one line to stderr when the corpus was not on the machine. No CI
# runner has any of the three. SYLLABUS_SESSIONS is the only source of every counts[*].total,
# which is the denominator of every fraction on every screen, and on every CI run the sole check
# on it counted nothing. Issue 168 made that state VISIBLE, in a verdict of its own and an exit
# code of its own. It could not make it stop being the state.
#
# WHAT IS ACTUALLY MISSING ON A RUNNER, AND IT IS NOT THE NUMBERS. Every value those gates
# compare against is already in this file in the clear: SYLLABUS_SESSIONS, SYLLABUS_MODULES,
# SYLLABUS_ROWS and the `source` citation on every populate route. A committed file restating
# them would be a SECOND COPY of a table that already exists, which is the defect this repository
# has been bitten by more often than any other, and comparing a copy with its original proves
# nothing at all. What is missing is the JOIN: nothing anywhere says that the numbers on a
# runner's disk are the numbers somebody once held up against the corpus.
#
# SO WHAT IS COMMITTED IS AN ATTESTATION AND NOT A CENSUS. build/corpus_reading.txt carries a
# date and one SHA-256 per gate over a canonical serialisation of that gate's declared tables.
# scripts/gen_corpus_reading.sh writes it, and it runs only on a machine holding the corpora; it
# imports this module, so the import-time gates have already re-read the corpus and refused any
# drift before a single digest is taken. A recorded reading can therefore only ever be written
# over tables that agreed with the corpus at the moment it was written.
#
# THERE IS ONE SERIALISER PER GATE AND BOTH SIDES CALL IT. The generator and the gate compute the
# digest with the same function over the same tables, so there is no second implementation to
# rot. The corpus comparison itself is not duplicated either: it stays exactly where it already
# was, inside the gates.
#
# WHAT A RUNNER NOW ESTABLISHES: the tables it is about to divide by are byte for byte the tables
# that were held up against the corpus on `read_on`. WHAT IT STILL CANNOT ESTABLISH: that the
# corpus has not moved since that date. That limit is not left to a reader's goodwill. It is
# printed in the gate's own notice, it is named again in the verdict, and it decays: past
# AGING_DAYS the recorded reading stops being accepted and the build refuses.
#
# AND THE LIMIT IS STATED BEFORE THE MECHANISM IS PRAISED, because a check whose reach is
# oversold is what this repository is named for. THIS IS A CONSISTENCY CHECK AND NOT AN
# AUTHENTICITY PROOF. The preimages are public and so is the algorithm, so anybody editing a
# table can recompute the digest and commit it beside the edit, and nothing here would know. What
# it catches is the realistic act, which is the one that has actually happened in this repository
# over and over: a table edited on a machine with no corpus, in good faith, by somebody who did
# not know a corpus was involved. Closing the forgery would need a signature nobody but the owner
# can make, which is a secret, and a secret buys that one thing at the price listed below. The
# cost of leaving it open is written here rather than left for a reader to discover.
#
# WHY NOT A REPOSITORY SECRET, WHICH IS THE ROUTE scripts/ci_register.sh ALREADY TAKES. Because
# a secret is for bytes that must not be public, and there are none here. This file is three
# hex digests over strings that are committed in the clear four hundred lines further down, plus
# one date. Paying a secret's costs, a value only the owner can rotate, a second thing that must
# be rotated in step, and a hard failure on every pull request from a fork, buys nothing that
# is not already had. The name register is a secret because it is a list of real people. This
# is not one and must not be dressed as one.
CORPUS_READING_PATH = pathlib.Path(__file__).resolve().parent / "corpus_reading.txt"
CORPUS_READING_SCHEMA = "1"
# The three readings the file must carry, and it is a TERMINATOR rather than a convenience: a
# gate added here without a reading is caught by the loader, and a reading with no gate is caught
# by it too. Same discipline as EXPECTED_MODEL_GATES in scripts/check_build.sh.
READING_KEYS = ("syllabus-totals", "module-structure", "ontology-citations")


def _reading_digest(lines):
    """The one hash used on both sides of the attestation.

    Tab-separated fields, newline-separated records, no trailing newline, UTF-8. Nothing here is
    negotiable at the call site: a digest whose serialisation is decided by its caller is a
    digest two callers can spell differently.
    """
    return hashlib.sha256("\n".join(lines).encode("utf-8")).hexdigest()


def load_recorded_reading(path=None):
    """Read build/corpus_reading.txt, or say in one sentence why it cannot be used.

    Returns None when there is no such file at all, which is a different answer from a file that
    is there and wrong: the first is the state every run of this repository was in before this
    card, and the second is an assertion somebody committed that is not true. Otherwise a dict
    with `read_on`, `readings` and `problem`, where `problem` is None or the sentence a gate
    prints. Nothing here raises: the caller decides what a problem costs, because that answer
    differs by whether the corpus is on the machine.
    """
    path = CORPUS_READING_PATH if path is None else path
    if not path.is_file():
        return None
    out = {"path": path, "schema": None, "read_on": None, "readings": {}, "problem": None}

    def bad(why):
        out["problem"] = why
        return out

    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        return bad(f"{path.name} could not be read ({type(exc).__name__}).")
    for n, raw in enumerate(text.split("\n"), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split()
        if parts[0] == "schema" and len(parts) == 2:
            out["schema"] = parts[1]
        elif parts[0] == "read_on" and len(parts) == 2:
            out["read_on"] = parts[1]
        elif parts[0] == "reading" and len(parts) == 3:
            if parts[1] in out["readings"]:
                return bad(f"{path.name} records the {parts[1]} reading twice, and two answers "
                           f"to one question are no answer.")
            out["readings"][parts[1]] = parts[2]
        else:
            return bad(f"line {n} of {path.name} is {line!r}, which is none of the three forms "
                       f"this file has: `schema <n>`, `read_on <YYYY-MM-DD>` and "
                       f"`reading <name> <64 hex>`.")
    if out["schema"] != CORPUS_READING_SCHEMA:
        return bad(f"{path.name} declares schema {out['schema']!r} and this build reads schema "
                   f"{CORPUS_READING_SCHEMA!r}. A file in a shape this code does not know is not "
                   f"evidence about anything.")
    try:
        recorded = datetime.date.fromisoformat(out["read_on"] or "")
    except ValueError:
        return bad(f"{path.name} says it was read on {out['read_on']!r}, which is not a date.")
    missing = [k for k in READING_KEYS if k not in out["readings"]]
    extra = [k for k in out["readings"] if k not in READING_KEYS]
    if missing or extra:
        return bad(f"{path.name} records {sorted(out['readings']) or 'nothing'} and this build "
                   f"reads {list(READING_KEYS)}. Missing: {missing or 'nothing'}. Not known "
                   f"here: {extra or 'nothing'}.")
    for k, v in sorted(out["readings"].items()):
        if not re.fullmatch(r"[0-9a-f]{64}", v):
            return bad(f"the {k} reading in {path.name} is {v!r}, which is not a sha256.")
    out["date"] = recorded
    return out


RECORDED_READING = load_recorded_reading()


def reading_lower_bracket(sources=None):
    """The earliest date an attestation of these tables could honestly carry.

    DERIVED OFF VALUE_SOURCES AND NOT TYPED, and it is derived off ALL of them rather than off
    the syllabus source alone: every source in that table states the day its corpus was read, an
    attestation is a claim that the tables covered by those sources were re-read, and one older
    than the latest of those dates is an attestation of some earlier version of them. Written as
    a loop rather than as two named lookups because a third source added to that table is then
    bracketed by this rule on the day it lands, and a named lookup would not have noticed it.

    It is computed on demand rather than at load time for a plain ordering reason: the
    operations-ontology source is registered a thousand lines below the loader, so nothing read
    at import time can see it and a bracket taken there would be quietly about one source.
    """
    sources = VALUE_SOURCES if sources is None else sources
    return max(s["read_on"] for s in sources.values())


_NO_ARG = object()


def recorded_verdict(key, declared, corpus_present, reading=_NO_ARG, today=None):
    """What a corpus-reading gate may say, given the corpus it found and the reading on disk.

    Four answers, and every one of them is a state some real machine is in:

      ("verified", "")        the corpus is here, it was read, and the recorded reading agrees
                              with the tables that were read.
      ("stale-record", why)   the corpus is here and was read, and the committed reading is of
                              other tables or is not usable. The document is sound and the
                              committed file is not.
      ("recorded", why)       no corpus here, and these tables are byte for byte the ones a
                              machine holding it verified on the recorded date.
      ("unverified", "")      no corpus here and no recorded reading either. This is the state
                              every CI run of this repository was in before issue 196, and it is
                              kept reachable rather than deleted because a machine really can be
                              in it and the honest answer then is that nothing was checked.

    and ONE REFUSAL: no corpus here, and a recorded reading that does not agree with these tables
    or that has aged out. That refusal is the whole card. It is the only thing standing between a
    runner and a denominator nobody ever counted.

    WHY `stale-record` DOES NOT RAISE, which is the one asymmetry here and it is deliberate. On a
    machine holding the corpus the tables were just compared against the corpus itself, which is
    strictly stronger evidence than any recording; what is wrong is a tracked file that has gone
    out of date. scripts/check_build.sh fails on the token, so it is not forgiven, it is caught
    one level up. And it must not raise HERE, because scripts/gen_corpus_reading.sh imports this
    module in order to rewrite that very file: a raise would lock the only thing that repairs it.
    """
    # THE TWO SEAMS EXIST BECAUSE TWO BRANCHES ARE OTHERWISE UNREACHABLE FROM A PROBE, and the
    # first version of this function had neither, on the argument that a parameter no probe
    # passes is an untested branch. The argument is right and it pointed the wrong way here: the
    # states where the corpus IS present and the recording is stale or aged out can only be
    # reached on a machine holding the corpus, no runner is one, and the doctored copies the
    # plants use are all corpus-less by construction. Codex found the ageing hole in exactly that
    # branch, which nothing could have driven. Both seams are passed by probes in
    # scripts/check_build.sh, and `today` is a date rather than a clock so no probe can be
    # written that only passes today.
    rec = RECORDED_READING if reading is _NO_ARG else reading
    today = datetime.date.today() if today is None else today
    # THE TWO BRACKETS ON THE DATE, both computed here rather than in the loader. The lower one
    # is clock-free and comes off VALUE_SOURCES; the upper one is the clock and refuses a reading
    # from the future, which is not a pedantry: a date typed a year ahead by hand would otherwise
    # buy an attestation a year of immunity from the ageing rule below, and typing a date is
    # exactly how somebody would reach for that.
    problem = None if rec is None else rec["problem"]
    if rec is not None and not problem:
        floor = reading_lower_bracket()
        if rec["read_on"] < floor:
            problem = (f"{CORPUS_READING_PATH.name} records a reading on {rec['read_on']} and the "
                       f"latest source in VALUE_SOURCES says its corpus was read on {floor}. An "
                       f"attestation from before the reading it is supposed to attest is about "
                       f"some earlier version of these tables.")
        elif rec["date"] > today:
            problem = (f"{CORPUS_READING_PATH.name} says it was read on {rec['read_on']}, which "
                       f"is in the future. Nothing has been read on a day that has not happened, "
                       f"and a date ahead of the clock is how an attestation would buy itself "
                       f"immunity from the ageing rule.")
    # THE AGE IS COMPUTED FOR BOTH PATHS AND NOT ONLY FOR THE ONE THAT REFUSES ON IT, which the
    # first draft got wrong and Codex found: the refusal sat in the no-corpus branch alone, so a
    # machine holding the corpus reported [verified] over an attestation every runner would
    # refuse, and the one machine that can regenerate the file was the one machine never told.
    # A committed artefact that no runner will accept is a defect wherever it is noticed.
    aged = None
    if rec is not None and not problem:
        days = (today - rec["date"]).days
        if days > AGING_DAYS:
            aged = days
    if corpus_present:
        if rec is None:
            return ("stale-record", f"and no recorded reading is committed at "
                                    f"{CORPUS_READING_PATH.name}, so a machine without the "
                                    f"corpus has nothing to check these tables against. Write "
                                    f"one with scripts/gen_corpus_reading.sh.")
        if problem:
            return ("stale-record", "and the recorded reading cannot be used: " + problem)
        if aged is not None:
            return ("stale-record",
                    f"and the recorded reading in {CORPUS_READING_PATH.name} was taken "
                    f"{aged} days ago, past the {AGING_DAYS} this build accepts. It agrees with "
                    f"these tables and a runner will refuse it anyway, so it is stale here even "
                    f"though nothing on this machine depended on it. Regenerate it with "
                    f"scripts/gen_corpus_reading.sh.")
        if rec["readings"][key] != declared:
            return ("stale-record",
                    f"and the recorded reading in {CORPUS_READING_PATH.name} is of different "
                    f"tables: it records {rec['readings'][key][:12]} and these tables digest to "
                    f"{declared[:12]}. The tables here are right, the committed attestation is "
                    f"stale, and a runner reading it would refuse this build. Regenerate it with "
                    f"scripts/gen_corpus_reading.sh in this same commit.")
        return ("verified", "")
    if rec is None:
        return ("unverified", "")
    if problem:
        raise SystemExit(
            f"[model] the corpus this gate is about is not on this machine, so the recorded "
            f"reading in {CORPUS_READING_PATH.name} is the only evidence there is about the "
            f"{key} tables, and it cannot be used: {problem}\n"
            f"  A build that carried on here would divide every fraction on every screen by a "
            f"number nothing has ever checked. Regenerate the file on a machine holding the "
            f"corpus with scripts/gen_corpus_reading.sh.")
    if rec["readings"][key] != declared:
        raise SystemExit(
            f"[model] the {key} tables in build/model.py are NOT the tables that were checked "
            f"against the corpus.\n"
            f"  {CORPUS_READING_PATH.name} records a reading taken on {rec['read_on']} over "
            f"tables digesting to {rec['readings'][key]}\n"
            f"  and the tables in this build digest to {declared}.\n"
            f"  The corpus itself is not on this machine, so nothing here can say which of the "
            f"two is right. What it can say is that somebody changed these tables without "
            f"holding them up against the thing they are about. Every counts[*].total on this "
            f"page comes out of them, which is the denominator of every fraction on every "
            f"screen.\n"
            f"  Either restore the tables, or re-read the corpus on a machine that has it and "
            f"regenerate the attestation with scripts/gen_corpus_reading.sh in the same commit.")
    if aged is not None:
        raise SystemExit(
            f"[model] the recorded reading in {CORPUS_READING_PATH.name} was taken on "
            f"{rec['read_on']}, which is {aged} days ago, and this build accepts one no older "
            f"than {AGING_DAYS} days.\n"
            f"  It still agrees with the {key} tables, and that is exactly the point: what it "
            f"cannot see is a corpus that moved after it was written, and the longer it stands "
            f"the more of that it cannot see. An attestation nobody refreshes becomes a sentence "
            f"about the past that reads like a check.\n"
            f"  Re-read the corpus on a machine that holds it and run "
            f"scripts/gen_corpus_reading.sh.")
    return ("recorded",
            f"the tables are byte for byte the ones a machine holding the corpus verified on "
            f"{rec['read_on']}, {(today - rec['date']).days} day(s) ago, recorded in "
            f"{CORPUS_READING_PATH.name}. What "
            f"that cannot see is a corpus that moved since")


# This document's own stance, and the date its provenance was last established.
#
# THE DATE IS DECLARED AND IS NOT READ OFF THE CLOCK, which is not a shortcut. site/instance.js
# is committed and the build gate deletes it, rebuilds and compares byte for byte; a document
# carrying today's date rebuilds to different bytes tomorrow and the gate would fail every day
# for the one reason that is not a defect. So the build stamp is typed, and it is a fact about
# the document rather than a claim about any read: what it is used for is refusing a value read
# after the document was written.
PROVENANCE_STANCE = "invented"
PROVENANCE_AS_OF = "2026-08-11"


def value_status(rank, at, as_of, fresh_days=FRESH_DAYS, aging_days=AGING_DAYS):
    """The Z-Map's `status`, computed and never typed. `at` null is its `partial`.

    The windows are arguments and not constants because a document declares its own clock: a
    private deployment laid out through --instance carries different systems and may have
    different windows, and reading this repository's numbers while laying out that document is
    the same class of mistake seam 1 and issue 72 each refused once already.
    """
    if rank == INVENTED:
        return "invented"
    if not at:
        return "unread"
    days = (datetime.date.fromisoformat(as_of) - datetime.date.fromisoformat(at)).days
    if days <= fresh_days:
        return "fresh"
    if days <= aging_days:
        return "aging"
    return "stale"


def p(name, value, flag, rank=INVENTED, at=None):
    """One property row: what it is called, what it says, what kind of value it is, and now
    where it came from and when that was read.

    The rank defaults to `0_invented` because every value written by hand in this file is
    invented, and a default that had to be remembered on two thousand rows is a default that
    would be forgotten on one of them. The four registry rows are the only ones that pass
    anything else, and they pass it in one place, route_props().
    """
    return {"k": name, "v": value, "f": flag, "r": rank, "at": at}


def edge_parts(e):
    """One relationship, unpacked: source, target, verb, and whether it is a ghost.

    Issue 75. A relationship is a 3-tuple everywhere in this file and a fourth element is
    allowed for the one thing about a relationship that cannot be read off its ends: that the
    relation is real and no system anywhere records it. Every reader of an edge tuple goes
    through here, so a fourth element cannot be silently dropped by one of them.
    """
    return e[0], e[1], e[2], bool(e[3]) if len(e) > 3 else False


# ---- the populate route, and it is a registry rather than a caption -----------
# Issue 4, reframed by the owner's stated destination: a management tool showing every item and
# every element of the funnel. Under that objective the question a drawing of object types has to
# answer first is not what an object's fields are. It is whether the object can be got hold of at
# all. So every class on this page carries a route, answered in the model rather than in prose
# beside it, because a fact kept beside the drawing drifts from it.
#
#   route_system      which system holds the row.
#   route_entered_by  who puts it there, BY ROLE and never by name.
#   route_event       what has to happen for the row to come into existence.
#
# Plus route_source, which is where the answer was read. That row is not decoration. Half of what
# is written below is an absence, an absence is the easiest thing in the world to assert and the
# hardest to check, and a reader who cannot see where a claim came from has to take all of it or
# none of it.
#
# ISSUE 72 IS WHAT CHANGED HERE, AND IT IS NOT THE ANSWERS. #4 wrote those four as strings a
# person reads. Every one of them is still here, verbatim, and still the first four rows of every
# panel. What is new is that each is now the DISPLAY side of a declaration carrying machine
# fields beside it, and the machine fields are the thing a source adapter would be written
# against. A route_system row reading "Notion. A collaborator directory row, and a select option
# on the calendar" is a sentence; system "notion" with unit "collaborator-directory-row" is a
# specification, and the two cannot drift because one declaration carries both.
#
# WHAT A ROUTE HAS TO SAY FOR SOMEBODY TO IMPLEMENT IT. Four questions, and the fourth was asked
# nowhere in this repository before this card:
#
#   which system holds the rows                    `system`, a machine name, or null
#   what one row is and what identifies it         `unit`, `partition`, `key`
#   what event creates one, and who causes it      `event`, `entered_by`
#   whether that system can be read at all today   `read`
#
# The fourth decides whether any of the other three is actionable, and its honest answer for all
# seventeen classes today is that nothing here has ever read anything: see READ_STATE below. A
# registry that could not say so would be a list of intentions wearing a specification's clothes.
#
# WHERE THE REGISTRY LIVES: in the instance document, site/instance.js, beside the objects it is
# about, and not in site/layout.js. Three reasons, in the order they bind. It is data about the
# model rather than geometry, which is the line seam 1 drew and the build gates in both
# directions. It has to travel with the data: build_layout.py already takes --instance and lays
# out a DIFFERENT document, and a private deployment reading a real estate has different systems
# and different keys, so a registry left in the layout would lay that document out against this
# toy's routes and nothing would say it had. And a reader of the published document can then ask
# what each class could be filled from without running anything, which is the use of it.
#
# THE ROUTE IS PER CLASS. Not per type, not per object, and not per view, and the disagreements
# are real rather than hypothetical:
#
#   per type is too coarse. Seventeen classes are drawn as thirteen types. Company is one type
#   doing two jobs, an employer of instructors that no system holds and an empresa colaboradora
#   that has a Notion page, and issue 49 deliberately gave them one type and one verb. Ghost is
#   one type standing for four classes that share nothing but a way of failing.
#
#   per object is too fine, and the shape this replaces proved it: the per-node table had to be
#   copied across seven route prefixes by a loop, because co_col and sc_co_col and hr_co_col are
#   three objects of ONE class and a route is a fact about the class. That loop is still here and
#   it now copies a class binding, which is one word, rather than four strings.
#
#   per view is wrong outright. Nothing about which system holds an enrolment changes because the
#   reader is looking at Z-HR.
#
#   WHERE IT DISAGREES WITH SEAM 4, AND BOTH ARE RIGHT. Identity is per OBJECT: source_key names
#   one row, and the four drawn students carry four keys under one class. A route names a class
#   of rows and a key names a row in it. The two sit at different grains on purpose, and the
#   registry is what says which grain each question belongs to.
#
# NO PERSON IS NAMED IN A ROLE. The sources name individuals on nearly every route. Every one is
# written here as the role, which is what a tool has to be built against anyway: a route that
# says a named person does it is a route that ends when they leave, and the analysis records
# people leaving these roles. The name gate at the foot of this file would refuse the build in
# any case, and it is right to.
#
# WHERE IT COMES FROM. An ontology of 55 entities, five adversarial reviews and a read of the
# company's own workspace, none of which lives in this repository: `analysis/ontology/` and
# `analysis/notion/` in the private analysis repo, plus the company notes in the vault. The
# `source` field names the file and the entity, so any one of them can be gone back to.
NO_SYSTEM = "no system holds it"

# ---- the vocabularies the registry is written in ------------------------------
# Every enumerated field below is checked against one of these tables and the build refuses a
# token that is in none of them. They ship with the document rather than staying in this file, so
# a reader of site/instance.js has the meaning of every value without reading Python: a registry
# whose values only mean something to the program that wrote them is not machine readable, it is
# machine writable.
#
# THREE OF THEM DECLARE STATES NOTHING IS IN TODAY, on purpose. `readable`, `implemented` and
# `named` are the states this registry exists to tell apart from the ones everything is in, and a
# field with one possible value is not a field. That nothing is in them is the finding: nothing
# here has been read and nothing here has been built.

# Whether the system holding a class can be read at all today. The question #4 never asked.
READ_STATE = {
    "no-source": "nothing holds a row for this class, so there is nothing to read",
    "not-attempted": "a system holds the rows and nothing here has ever read it: no adapter, no "
                     "credential held, and the analysis does not record whether it can be read",
    "readable": "a read has been demonstrated against the system itself",
    "refused": "a read was attempted and the system would not serve it",
}

# What has been built. `impossible` is the state this card exists to make first class: a class
# with no source is not a class whose adapter field is empty, it is a class where an adapter
# cannot exist, and those are two different claims.
ADAPTER_STATE = {
    "impossible": "no adapter can exist here, because nothing holds the rows it would read",
    "not-implemented": "an adapter could be written against this entry and none has been",
    "implemented": "a module named on this entry reads the system it names",
}

# What identifies one row in the holding system. Not one of the eight real routes names a key,
# which is why seam 4 had to mint one: source_key stands in, and stands in visibly.
KEY_STATE = {
    "none": "there is no row, so there is nothing to identify",
    "not-recorded": "a system holds the row and the analysis names no field to join it on",
    "named": "the analysis names the field a row is identified by",
}

# Used by the role and by the event. The first, third and fourth are #4's own distinction between
# two kinds of blank made into tokens: an absence that was established is a finding, an absence
# nobody looked into is a hole in the analysis, and writing a plausible answer into either would
# destroy the only thing this registry is for. `nominal` is the third shape #4 found and had no
# word for, on the Placement row: a who with no system, an answer that exists on paper and in no
# system, which is not the same as no answer.
FIELD_STATE = {
    "recorded": "the analysis records an answer",
    "nominal": "a role or a moment is named and no row comes of it, so the answer exists on "
               "paper and in no system",
    "not-recorded": "the analysis is silent, and a plausible answer would be worse than none",
    "none": "the analysis establishes there is no answer: nobody does it, or no moment creates "
            "a row",
}

# The flag each state maps onto in the four display rows, so the panel and the registry cannot
# come to disagree about which rows record an absence.
FIELD_FLAG = {"recorded": E, "nominal": A, "not-recorded": A, "none": A}

# A state that names something, as against one that records there is nothing to name.
FIELD_NAMES_SOMETHING = ("recorded", "nominal")

# Roles, never names.
ROLE = {
    "operations": "the operations team",
    "student": "the student themselves",
    "written-by-the-system": "no person types it; the holding system writes the row",
}

# WHY NOTHING HOLDS IT, for the nine that nothing holds. The rule #4 stated is that a populate
# route exists when some system holds a ROW for the object, and a value inside another object's
# field is not a row. That rule sorts the nine into different shapes of absence, and the shape is
# what an implementer needs: `value-not-a-row` is a class somebody could make real by adding a
# table, `intersection-only` is not.
ABSENCE = {
    "contested-enumerations": "several lists enumerate it and they disagree; no one of them is "
                              "the register",
    "value-not-a-row": "it appears as a value inside another object's field and never as a row "
                       "of its own",
    "copy-not-a-template": "the thing it would be a template of is last period's rows, copied by "
                           "hand; no template object comes out of it",
    "intersection-only": "it can only be picked out as the intersection of several other things, "
                         "each held somewhere else",
    "file-not-a-row": "what exists is a document attached to another object's row, which cannot "
                      "be queried as a row",
    "no-expectation-written": "nothing anywhere writes down what is expected, so nothing can be "
                              "compared against it and a failure leaves no row at all",
    "nothing-collects-it": "a role is nominally responsible for reporting it and no system "
                           "collects what they report",
    "action-not-a-register": "the system holds an action that fires and leaves nothing behind, "
                             "rather than a register of what it did",
    "outside-the-export": "the processor performs it and the export in hand cannot see that it "
                          "happened",
}

# QUALIFICATIONS ON A ROUTE THAT DOES EXIST. #4 recorded that four of the eight are partial and
# said which part is missing rather than rounding them up to a whole route; those four are the
# first four here. An implementer reads these as the work an adapter cannot do however well it
# is written.
CAVEAT = {
    "confirming-actor-not-recorded": "the role that confirms the row is not recorded anywhere",
    "owner-not-recorded": "no role is named as the owner of creating the row",
    "no-record-spans-the-systems": "the object is held in several systems and no record joins "
                                   "them, so the rows cannot be reconciled into one",
    "no-ageing-rule": "a row is created by somebody deciding to, and no rule says when one is "
                      "due, so the set cannot be predicted",
    "no-ledger": "the rows are hand built lists rather than a ledger, so the set is not complete "
                 "by construction",
    "incomplete-by-construction": "an event of this kind can happen and leave no row at all, so "
                                  "the rows are not the whole population",
    "not-a-database": "the rows are pages rather than database rows, so they cannot be listed or "
                      "filtered as a table",
    "outcome-not-recorded": "the thing the row is created for is not recorded on it, so the row "
                            "says the event was planned and never that it happened",
}

# id -> the entry that ships, and id -> the three sentences the panel prints. Two maps and not
# one: the sentences belong to the panel and the entry belongs to whatever reads the registry,
# and carrying the prose inside the shipped entry would put every one of those strings in the
# document twice.
# ---- THE SECOND QUESTION ABOUT AN OBJECT, AND THE WORD IT IS NOT SPELLED WITH. Issue 157 -----
# The owner: "contact details of institutions and professors so for example I could directly
# click on them and send an email or do a call, send a Zoom call, etc. for example if a need to
# reconfirm a session". A fact belongs on the thing it is about, so an instructor's address is on
# the instructor and there is no directory anywhere on this page.
#
# IT IS NOT SPELLED `route_`, AND THAT IS THE FIRST DECISION THIS BLOCK MADE. The four rows above
# are already called the route and they mean PROVENANCE: which system holds the row, who types
# it, on what event, and which analysis the answer was read from. On instructor `t1`,
# `route_system` reads "Notion. A collaborator directory row, and a select option on the
# calendar". A `route_email` beside it would put two unrelated questions under one prefix on one
# object, and a reader scanning a panel would have to know which of the two any `route_` row
# belonged to. `reach_` is the other question in the owner's own verb: `route_` is where the fact
# LIVES, `reach_` is how you get hold of the thing the fact is about. `contact_` was the other
# candidate and was refused for being a noun: these rows are acts, one URI each, and the panel
# hands each of them to the reader's own client rather than storing anything anywhere.
#
# NOTHING IS WRITTEN TO ANY SYSTEM. `mailto:`, `tel:` and an https meeting room are handed to the
# reader's own mail client, dialler and browser. The page stays read-only, which is the
# constraint every card on it has held to.
#
# ---- THE ADDRESSES ARE INVENTED AND ARE BUILT SO THAT THEY CANNOT BE ANYTHING ELSE -----------
# This is the sharper edge of issue 148's hazard. Invented PROSE that reads as real is bad; an
# invented ADDRESS that reads as real is worse, because a reader acts on it, and sixteen of the
# twenty two Company tiles on this page carry the name of a firm that exists. So the addresses
# are not merely flagged, they are unable to be real:
#
#   the domain   `invalid`, the top level domain RFC 2606 section 2 reserves precisely so that a
#                name under it can never be delegated and can never resolve. Used BARE, with no
#                second label, which is also what keeps it out of the shape of a real address:
#                every deliverable address has a dotted domain.
#   the number   all zeros. No E.164 country code begins with 0, so the number cannot exist in
#                any country. ONE placeholder number on every object and not twenty nine
#                invented ones, for the reason cohort_roster() gives about names further down
#                this file: each invented one is another chance to write down a real one, and a
#                telephone number has no safe generator the way a drawing id does.
#   the room     `meet.invalid`, under the same reserved top level domain.
#
# The email and the meeting room carry the object's DRAWING ID, which is already in this document
# and has already been through the name gate, so a per-object address costs no new invention.
#
# AND THE BUILD REFUSES ANYTHING ELSE. check_reach_addresses() below walks every address this
# model ships and stops the build on one that is not of these three forms. A plausible address
# typed into this file by a later card does not reach the page.
REACH_CALL = "+00000000000"

# The three acts the owner named, and what each one hands to the reader. It is a vocabulary and
# it ships with the document for the reason every other vocabulary here ships: a row whose key
# only means something to the program that wrote it is not machine readable.
REACH_ACT = {
    "reach_email":   "an address the reader's own mail client is handed. Nothing is sent from "
                     "this page and nothing is written anywhere",
    "reach_call":    "a number the reader's own dialler is handed. The digits are all zeros "
                     "because no country code begins with one, so it can never connect",
    "reach_meeting": "a room the reader's own browser is handed, under a reserved name that "
                     "cannot resolve",
}

# key -> the URI, built from the object's own drawing id. In the order a reader meets them.
REACH_ACTS = (
    ("reach_email",   lambda nid: f"mailto:{nid}@invalid"),
    ("reach_call",    lambda _nid: f"tel:{REACH_CALL}"),
    ("reach_meeting", lambda nid: f"https://meet.invalid/{nid}"),
)

# The one row an object gets when there is no way to reach it, and it is ONE row and not three.
# Three addresses is three different things a reader can do; NO address is one claim, and writing
# it three times on one tile is the over-marking the ghost exemption further down this file
# already refuses in the same words. It is flagged `absent` like any other absence, so the empty
# socket on the tile, the number on the header control and this row are one answer read three
# times rather than three opinions.
REACH_NONE = "reach"

# Every address form the model is allowed to ship, anchored end to end and keyed by the act it
# belongs to. A form is here or the build stops; there is no list of exceptions and no way to add
# one from a call site.
#
# THE PATTERNS ARE WRITTEN OUT AGAIN HERE RATHER THAN DERIVED FROM REACH_ACTS ABOVE, and that is
# the whole value of them. The first draft of check_reach_addresses() rebuilt the expected string
# by CALLING the table that writes them, which is a checker agreeing with itself: a plant that
# changed the generator to `mailto:hr@invalid` passed the gate, because the gate asked the
# generator what to expect and the generator said `mailto:hr@invalid`. A reserved domain stops
# the message being delivered and does nothing at all about a local part that names a department
# or a firm, so the rule has to be stated independently of the thing it judges.
#
# `who` IS THE OBJECT'S OWN DRAWING ID and it is compared against the node, not against the
# table. That is what makes an address a fact about the object it sits on rather than a string
# somebody typed: an id is already in this document and has already been through the name gate,
# and nothing else is allowed at either end of the @.
_REACH_FORMS = {
    "reach_email":   re.compile(r"^mailto:(?P<who>[a-z0-9_]+)@invalid$"),
    "reach_call":    re.compile(r"^tel:\+0+$"),
    "reach_meeting": re.compile(r"^https://meet\.invalid/(?P<who>[a-z0-9_]+)$"),
}

# Three tables now say what the acts are: the vocabulary that ships, the generator, and the rule
# that judges the generator. Writing the rule out twice is the point of it and a fourth act
# reaching two of the three is not, so they are held to the same key set here. A missing form
# would otherwise surface as a KeyError inside a gate, which is a gate that crashed rather than a
# gate that refused, and the two read differently in a log.
if not (set(REACH_ACT) == {_k for _k, _u in REACH_ACTS} == set(_REACH_FORMS)):
    raise SystemExit(f"model: the acts a reader can be handed are declared three times and the "
                     f"three do not agree: vocabulary {sorted(REACH_ACT)}, generator "
                     f"{sorted(_k for _k, _u in REACH_ACTS)}, rule {sorted(_REACH_FORMS)}.")

ROUTES = {}
ROUTE_SAYS = {}


def route_class(cid, *, cls, drawn_as, system, unit=None, partition=None, entered_by, event,
                source, says, absence=None, caveats=(), key=None, read=None, module=None,
                reach=False, reach_with=None):
    """One class's route: the machine declaration and the four rows a reader sees, together.

    Everything derivable is derived and nothing is declared twice. `attachable` is whether a
    system holds the rows; the adapter state follows from that and from whether a module exists;
    the flag on each display row is the state of the field it displays. There is no way to
    satisfy one of those by editing another.

    `reach` and `reach_with` are issue 157's and are the SECOND question about an object. See the
    block under route_props() for what they mean and why they are not spelled `route_`.
    """
    attachable = system is not None
    if reach_with is not None and not reach:
        raise SystemExit(f"model: route {cid}: a companion field {reach_with!r} is declared and "
                         f"the class carries no way to reach it, so nothing would ever read the "
                         f"companion. A rule that cannot fire reads as a rule that passed.")
    ROUTE_SAYS[cid] = says
    ROUTES[cid] = {
        # Issue 157. Whether the class is one you can get hold of, and the field on its own row
        # that says whether anybody has filled that row in. Null on the fifteen classes that are
        # not somebody or something you write to.
        "reach": {"acts": [_k for _k, _u in REACH_ACTS], "with": reach_with} if reach else None,
        "id": cid,
        "class": cls,
        "type": drawn_as,
        "attachable": attachable,
        "system": system,
        "unit": unit,
        "partition": partition,
        "key": {"status": key or ("not-recorded" if attachable else "none"),
                # What a join runs on until a real key is established. Seam 4's invented key is
                # not standing in for a key the source has and nobody here has read; it stands in
                # for a key nothing names, which is a different and worse hole.
                "stands_in": "source_key" if attachable else None},
        "entered_by": {"role": entered_by[0], "status": entered_by[1]},
        "event": {"token": event[0], "status": event[1]},
        "read": read or ("not-attempted" if attachable else "no-source"),
        "adapter": {"status": ("implemented" if module else
                               "not-implemented" if attachable else "impossible"),
                    "module": module,
                    "blocked_by": None if attachable else absence},
        "absence": absence,
        "caveats": list(caveats),
        "source": source,
    }
    return ROUTES[cid]


def route_props(entry):
    """The four rows, in the order the questions get asked, ready to sit in front of a node's own.

    The strings are #4's, unchanged. The flags are read off the machine fields, so a row that
    records an absence and a field saying nothing holds it cannot come apart.

    ISSUE 73 IS THE RANK. These four are the only rows in this model that were read off
    anything: an ontology of 55 entities and a read of the company's own workspace, cited on the
    fourth row of every panel. `3_observed`, because what was read is an analysis OF the systems
    and issue 72's registry says on every one of the seventeen classes that no system here has
    ever been reached. Undated, because this repository does not record when the analysis was
    read and a plausible date would compute to `fresh` and make an undated finding read as a
    current one. Passed here rather than at each of the seventeen call sites: a rank written
    seventeen times is a rank sixteen of them can drift from.
    """
    says = ROUTE_SAYS[entry["id"]]
    return [p("route_system", says[0], E if entry["attachable"] else A, OBSERVED),
            p("route_entered_by", says[1], FIELD_FLAG[entry["entered_by"]["status"]], OBSERVED),
            p("route_event", says[2], FIELD_FLAG[entry["event"]["status"]], OBSERVED),
            p("route_source", entry["source"], E, OBSERVED)]


def reach_props(entry, nid, own):
    """How you get hold of this object, or one row saying why you cannot. Issue 157.

    THE ANSWER IS DERIVED IN ONE PLACE AND IS NEVER TYPED, exactly as the tile's `mark` is. Two
    facts decide it and both are already in the registry or on the node:

      the class holds no row anywhere   there is nowhere an address could sit, so there is none.
                                        This is the sixteen employer Companies: "no company
                                        record. A firm is a free text name in a Notion select".
                                        A free text name in a select has no fields.
      the row exists and is blank       the class names a companion field on the same row, and
                                        that field records that nothing was filled in. On an
                                        Instructor the companion is `employer`, which is a field
                                        of the same Notion collaborator directory row an address
                                        would be a field of. Four of the twenty seven carry it
                                        as an absence, and this model will not write an address
                                        onto a row it has just finished saying is empty.

    THE SECOND CLAUSE IS A REFUSAL BY THIS MODEL AND NOT A FINDING ABOUT THE BUSINESS, and the
    sentence it ships says so in those words. What is established is that the row records no
    employer. That it therefore records no address does NOT follow, and a row reading "not
    recorded" would be this page asserting something nobody has looked at, which is the one thing
    the whole registry above exists to refuse. So what the row says is what is true: this model
    declines to invent an address for a directory row it has just called empty. The honest
    alternative was to give all twenty seven an address, and it was refused because that makes
    the same unlooked-at claim in the direction a reader acts on.

    WHICH SIDE OF THE ABSENCE CONTROL EACH ONE LANDS ON IS NOT DECIDED HERE EITHER. site/app.js
    reads the class's `system` at the join: no system holds it, ghost grey; a system holds the
    row and has left it empty, the warning hue. Those are exactly the two cases above and they
    come out with the right colour without this function knowing there is a colour.
    """
    r = entry.get("reach")
    if not r:
        return []
    if not entry["attachable"]:
        return [p(REACH_NONE, "no row holds one. " + ABSENCE[entry["absence"]], A)]
    field = r["with"]
    if field:
        rows = [row for row in own if row["k"] == field]
        if len(rows) != 1:
            raise SystemExit(f"model: class {entry['id']} says a way to reach an object is a "
                             f"field of the same row as {field!r}, and {nid} carries "
                             f"{len(rows)} such row. The companion cannot be read, so the "
                             f"absence cannot be derived and would have to be guessed.")
        if rows[0]["f"] == A:
            return [p(REACH_NONE, f"none offered. The row that would carry one records no "
                                  f"{field} either, and this model will not invent an address "
                                  f"for a row it has just called empty", A)]
    return [p(_k, _uri(nid), D) for _k, _uri in REACH_ACTS]


route_class(
    "programme", cls="Programme", drawn_as="Programme",
    system=None, absence="contested-enumerations",
    entered_by=(None, "not-recorded"),
    event=("quarter-setup", "nominal"),
    source="ontology.yaml, Programme, finding F25",
    says=("no registry. Four lists of programmes disagree with each other",
          "not recorded",
          "no row is created. A programme appears when last quarter's folder is copied"))

route_class(
    "company-employer", cls="Company, employer of an instructor", drawn_as="Company",
    system=None, absence="value-not-a-row",
    reach=True,
    entered_by=(None, "not-recorded"),
    event=(None, "none"),
    source="ontology.yaml, Company, identity key",
    says=("no company record. A firm is a free text name in a Notion select",
          "not recorded",
          "not recorded. No moment creates a company row"))

route_class(
    "company-colaboradora", cls="Company, empresa colaboradora", drawn_as="Company",
    system="notion", unit="invitation-page", partition="invitation",
    reach=True,
    entered_by=("operations", "recorded"),
    event=("invitation-sent", "recorded"),
    caveats=("not-a-database", "outcome-not-recorded"),
    source="notion 07_universities, Visitas a empresas",
    says=("Notion, one page per invitation. Not a database, and the visit is not recorded",
          "operations",
          "when operations invites firms for the in person weekend"))

route_class(
    "session-template", cls="Session template", drawn_as="SessionTemplate",
    system=None, absence="copy-not-a-template",
    entered_by=("operations", "recorded"),
    event=("quarter-setup", "recorded"),
    source="notion 01_runbooks, Duplicar la anterior",
    says=("no template object. The template is last quarter's calendar rows, copied",
          "operations",
          "when the quarter's folder is duplicated at promotion setup"))

route_class(
    "instructor", cls="Instructor", drawn_as="Instructor",
    system="notion", unit="collaborator-directory-row", partition="single",
    # Issue 157. The companion is `employer`, which is a field of the same directory row an
    # address would be a field of, and it is the only field on this node whose absence is
    # recorded rather than assumed. Four of the twenty seven instructors carry it as an absence.
    reach=True, reach_with="employer",
    entered_by=("operations", "recorded"),
    event=("session-scheduled", "recorded"),
    caveats=("confirming-actor-not-recorded",),
    source="ontology.yaml, Instructor, finding F7",
    says=("Notion. A collaborator directory row, and a select option on the calendar",
          "operations keeps the calendar. Who confirms an instructor is not recorded",
          "when a session is scheduled. The directory row has no recorded event"))

route_class(
    "cohort-session", cls="Cohort session", drawn_as="CohortSession",
    system="notion", unit="session-calendar-row", partition="programme-quarter",
    entered_by=("operations", "recorded"),
    event=("quarter-setup", "recorded"),
    source="ontology.yaml, Session; notion 01_runbooks",
    says=("Notion, one session calendar per programme per quarter",
          "operations",
          "on duplicating last quarter's calendar at setup, then edited by hand"))

route_class(
    "cohort", cls="Cohort", drawn_as="Cohort",
    system=None, absence="intersection-only",
    entered_by=(None, "not-recorded"),
    event=(None, "none"),
    source="ontology.yaml, Cohort, finding F26",
    says=("none. A cohort is the intersection of a roster, a calendar, a campus "
          "group and a website record",
          "not recorded. Nobody is named as the owner of setting a cohort up",
          "no row is created"))

route_class(
    "student-group", cls="Students", drawn_as="StudentGroup",
    system="campus", unit="campus-group", partition="intake",
    entered_by=(None, "not-recorded"),
    event=("intake-created", "recorded"),
    caveats=("owner-not-recorded",),
    source="notion 01_runbooks, campus creation",
    says=("the learning platform. A private campus group per intake, with its course",
          "not recorded. The campus manual names no owner and says we throughout",
          "created by hand, once per intake. There is no duplicate button"))

route_class(
    "student", cls="Student", drawn_as="Student",
    system="applicant-tracker", unit="application", partition="single",
    entered_by=("student", "recorded"),
    event=("application-submitted", "recorded"),
    caveats=("no-record-spans-the-systems",),
    source="vault Data model, six identity spaces",
    says=("the applicant tracker holds an application. No person record spans the systems",
          "the student",
          "on submitting the application form"))

route_class(
    "enrolment", cls="Enrolment", drawn_as="Enrolment",
    system="notion", unit="roster-row", partition="quarter",
    entered_by=("operations", "recorded"),
    event=("roster-row-typed", "recorded"),
    source="ontology.yaml, Enrolment, finding F3",
    says=("Notion, one roster database per quarter",
          "operations, by hand",
          "when the candidate is marked hired and the roster row is typed"))

route_class(
    "agreement", cls="Agreement", drawn_as="Agreement",
    system=None, absence="file-not-a-row",
    entered_by=(None, "not-recorded"),
    event=(None, "none"),
    source="ontology.yaml, PaymentPlan, finding F16",
    says=("none for a standard enrolment. An income share contract is a file on a Notion row",
          "not recorded for a standard enrolment",
          "no row is created. Nothing anywhere stores what a student owes"))

route_class(
    "charge", cls="Charge", drawn_as="Charge",
    system="stripe", unit="payment", partition="single",
    entered_by=("written-by-the-system", "recorded"),
    event=("payment-made", "recorded"),
    caveats=("incomplete-by-construction",),
    source="ontology.yaml, Charge, finding F4",
    says=("Stripe. A payment made by bank transfer leaves no row there",
          "nobody types it. Stripe writes the row when the student pays",
          "on payment through the link the acceptance email carries"))

route_class(
    "claim", cls="Claim", drawn_as="Claim",
    system="notion", unit="exception-list-row", partition="hand-built-list",
    entered_by=("operations", "recorded"),
    event=("chase-decided", "recorded"),
    caveats=("no-ledger", "no-ageing-rule"),
    source="ontology.yaml, Listado de impagados",
    says=("Notion. Hand built exception lists, one of them for two intakes. No ledger",
          "operations, row by row",
          "when operations decides to chase. There is no ageing rule"))

# The four ghosts are four classes and not one. They share the Ghost type because they share a
# way of failing, and the absence token is where they stop sharing: an expectation nobody writes
# down, a report nobody collects, an action that leaves nothing behind and a movement of money
# the export cannot see are four different things to build and four different things to be
# unable to build. Three of the four also carry a role that acts, which is `nominal` and not
# `none`: somebody presses the action, somebody elects the refund, and no row comes of it.
route_class(
    "ghost-instalment", cls="Instalment", drawn_as="Ghost",
    system=None, absence="no-expectation-written",
    entered_by=(None, "none"),
    event=(None, "none"),
    source="ontology.yaml, Instalment",
    says=("none. A paid instalment is an ordinary charge; the expected schedule is nowhere",
          "nobody. Nothing writes down an expectation",
          "no row is created. A failed card leaves no row at all"))

route_class(
    "ghost-placement", cls="Placement", drawn_as="Ghost",
    system=None, absence="nothing-collects-it",
    entered_by=("student", "nominal"),
    event=(None, "none"),
    source="ontology.yaml, Placement, finding F38",
    says=("none, and the analysis attests it from both directions",
          "the student, under the income share contract. Nothing collects it",
          "no row is created"))

route_class(
    "ghost-beca", cls="Beca", drawn_as="Ghost",
    system=None, absence="action-not-a-register",
    entered_by=("operations", "nominal"),
    event=("acceptance-action", "nominal"),
    source="ontology.yaml, Scholarship, finding F17",
    says=("none. The learning platform holds an action that sends an email, not a register",
          "operations presses the action. Who presses it is not recorded",
          "on the action at acceptance. No award row is created"))

route_class(
    "ghost-refund", cls="Refund", drawn_as="Ghost",
    system=None, absence="outside-the-export",
    entered_by=("student", "nominal"),
    event=("student-asks", "nominal"),
    source="ontology.yaml, Refund, finding F18",
    says=("none. The processor executes them and the payment export cannot see them",
          "the student elects; operations executes and types a free text row",
          "on the student asking. It ran once as a campaign, not as a standing process"))


# ---- the registry has to be well formed before anything is built against it ---
# Jidoka, and every rule below is a way one of these entries could be wrong while still looking
# right in a panel. The expensive pair is the last: a class claiming to have been read, or an
# adapter claiming to exist, when this repository ships neither. That claim would be believed by
# the next person to read the document, and nothing else in the build could catch it.
def _check_registry():
    for cid, e in ROUTES.items():
        def bad(why, _cid=cid):
            raise SystemExit(f"model: route {_cid}: {why}")

        if e["read"] not in READ_STATE:
            bad(f"read state {e['read']!r} is not one of {sorted(READ_STATE)}")
        if e["adapter"]["status"] not in ADAPTER_STATE:
            bad(f"adapter state {e['adapter']['status']!r} is not one of {sorted(ADAPTER_STATE)}")
        if e["key"]["status"] not in KEY_STATE:
            bad(f"key state {e['key']['status']!r} is not one of {sorted(KEY_STATE)}")
        if len(ROUTE_SAYS[cid]) != 3:
            bad("a route displays exactly three sentences and its source")

        # A named role or a named moment, and a state that says whether there is one to name.
        # Declaring a token under a state that says there is nothing to name is a contradiction
        # a reader would never see, because the panel prints the sentence and not the token.
        for field, named in (("entered_by", "role"), ("event", "token")):
            st = e[field]["status"]
            if st not in FIELD_STATE:
                bad(f"{field} state {st!r} is not one of {sorted(FIELD_STATE)}")
            if (e[field][named] is not None) != (st in FIELD_NAMES_SOMETHING):
                bad(f"{field} names {e[field][named]!r} under the state {st!r}. A state that "
                    f"records nothing to name cannot carry a name, and one that does must.")
        if e["entered_by"]["role"] is not None and e["entered_by"]["role"] not in ROLE:
            bad(f"role {e['entered_by']['role']!r} is not one of {sorted(ROLE)}")
        for c in e["caveats"]:
            if c not in CAVEAT:
                bad(f"caveat {c!r} is not one of {sorted(CAVEAT)}")

        # A route exists precisely when a system holds the rows, and every field depending on
        # that has to move with it. Refusals in both directions on purpose: the failure this card
        # is against is a class quietly acquiring an empty table.
        if e["attachable"]:
            if e["absence"] is not None:
                bad("a system holds the rows and an absence is recorded as well")
            if not e["unit"] or not e["partition"]:
                bad("a system holds the rows and nothing says what one row is or how the rows "
                    "are split. An adapter cannot be written against that.")
            if e["read"] == "no-source":
                bad("a system holds the rows and the read state says there is nothing to read")
            if e["key"]["status"] == "none":
                bad("a system holds the rows and the key state says there is nothing to identify")
        else:
            if e["absence"] not in ABSENCE:
                bad(f"nothing holds the rows and the absence {e['absence']!r} is not one of "
                    f"{sorted(ABSENCE)}. Why nothing holds it is the finding.")
            if e["unit"] or e["partition"]:
                bad("nothing holds the rows and a unit or a partition is declared anyway")
            if e["read"] != "no-source":
                bad("nothing holds the rows and the read state claims otherwise")
            if e["key"]["status"] != "none" or e["key"]["stands_in"]:
                bad("nothing holds the rows and a key is claimed for them")
            if e["caveats"]:
                bad("a caveat qualifies a route that exists, and this class has none")
            if e["adapter"]["status"] != "impossible":
                bad("nothing holds the rows and the adapter state is not impossible. That state "
                    "is the point of this registry: no adapter POSSIBLE is not an empty field.")

        # Nothing in this repository reads any system and nothing in it is an adapter, so an
        # entry claiming either is wrong however it got there. The card that built this registry
        # put that in its own scope, and a scope nothing enforces is a hope.
        if e["adapter"]["module"] is not None:
            bad("an adapter module is named and this repository ships none")
        if e["read"] in ("readable", "refused"):
            bad(f"read state {e['read']!r} claims a system was reached, and nothing here has "
                f"ever reached one. That state is declared so the field can move, not so it "
                f"can be asserted.")

        # ---- the way to reach the object, issue 157 ------------------------------------
        # A companion field is what makes the absence DERIVED rather than guessed, so it may
        # only be declared where there is a row for it to be a field of. Declared on a class
        # nothing holds a row for, it would be a rule reading a field of a row that does not
        # exist, and reach_props() would never consult it: a rule that cannot fire reads as a
        # rule that passed.
        rch = e["reach"]
        if rch is not None:
            if rch["acts"] != [_k for _k, _u in REACH_ACTS]:
                bad(f"the acts {rch['acts']!r} are not the ones this model can hand to a "
                    f"client. Those are declared once, in REACH_ACTS.")
            if rch["with"] is not None and not e["attachable"]:
                bad(f"a way to reach it is said to be a field of the same row as "
                    f"{rch['with']!r}, and nothing holds a row for this class at all. The "
                    f"companion could never be read and the absence would be a guess.")


_check_registry()


# ---- which class an object belongs to -----------------------------------------
# The binding, and it is the whole of what used to be two tables of prose. A type binds to one
# class by default; an id overrides it where one type carries two. Both are checked at the foot
# of this file: an object bound to nothing stops the build, and so does a class nothing binds to.
CLASS_OF_TYPE = {
    "Programme": "programme",
    "Company": "company-employer",
    "SessionTemplate": "session-template",
    "Instructor": "instructor",
    "CohortSession": "cohort-session",
    # ---- the two aggregates take their members' route, issue 89 -----------------------------
    # AND THAT IS A DECISION AGAINST THE OBVIOUS ONE, which was two entries of their own. The
    # registry answers ONE question: how does a row of this class get into a system and out of it
    # again. A module has no row anywhere. It is a field repeated on the syllabus rows it groups,
    # so the only way to get hold of one is to read those rows and group them by that field, and
    # the route to a Module is therefore exactly the route to a Session template. A module
    # delivery is the same sentence over the calendar: read the session calendar rows, group by
    # the module their template names. An entry of its own would have restated its member's route
    # in different words and given the registry two more places to drift.
    #
    # WHAT AN ENTRY OF ITS OWN WOULD HAVE CARRIED IS ON THE TILE INSTEAD, in its `note`, which is
    # where a statement about one object belongs: that a module is a value and not a row, and
    # that nothing anywhere groups a term's calendar rows into modules. That is a fact about the
    # aggregate rather than about how its rows are populated, and the two were being conflated.
    #
    # IT ALSO KEEPS scripts/routes.py HONEST, which is the practical half. That reader walks
    # `views`, counts the objects bound to each class, and refuses a class drawn nowhere. Its
    # walk does not reach `collapsed`, so two entries drawn only at the modules grain would have
    # read to it as two classes that had rotted. That reader is not this card's file to change
    # and the finding is reported rather than worked around: a class drawn ONLY at the modules
    # grain would be invisible to it today.
    "Module": "session-template",
    "ModuleDelivery": "cohort-session",
    "Cohort": "cohort",
    "StudentGroup": "student-group",
    "Student": "student",
    "Enrolment": "enrolment",
    "Agreement": "agreement",
    "Charge": "charge",
    "Claim": "claim",
}

# Per node, where one type carries more than one class. The visit host is one of the five and the
# four ghosts are the rest: Ghost is deliberately absent from the table above, so a ghost with no
# entry here stops the build rather than inheriting a sibling's route.
CLASS_OF_ID = {
    "co_col": "company-colaboradora",
    "g_inst": "ghost-instalment",
    "g_place": "ghost-placement",
    "g_beca": "ghost-beca",
    "g_ref": "ghost-refund",
}

# ---- the ontology becomes a declared source, and a gate re-reads it. Issue 123 --------------
# THE DEFECT THIS CLOSES, AS IT WAS MEASURED. This document carries four route rows on every
# drawn object, every one of them ranked `3_observed`; at the SHA this card was cut against that
# was one thousand three hundred and twenty rows over three hundred and thirty objects, against
# one thousand seven hundred and eighty nine rows of the objects' own of which one hundred and
# sixty four were real. The observed half is the half the whole control-centre direction rests
# on. And `provenance.sources` declared exactly ONE corpus, the programme syllabus, while
# RECHECK_GATES_RUN had two members and neither was about routes. So the strongest claim this
# artefact made about itself was the one claim nothing checked, and the register was promoted on
# precisely the standard it alone failed.
#
# ONE MECHANISM, NOT A SECOND ONE BESIDE IT. What follows is issue 118's shape unchanged: a
# source states the corpus it was read from, when it was read, the gate that re-reads it
# wherever the corpus exists, and the (type, key) seats it filled. The single thing this card
# adds to that shape is `produces` above, and it adds it precisely so that a second table was
# not needed: the four route rows are facts about a class rather than values of an object, and a
# declaration that could not say which of the two it was would have had to become one.
#
# IT IS DECLARED HERE AND NOT UP BESIDE THE SYLLABUS SOURCE for one reason: its seats are
# DERIVED from the registry and from the type bindings, both of which are declared above this
# line. A literal list of sixty seats would be a second copy of a table that already exists, and
# the fourth thing this repository has learned the hard way is that the copy is the one that
# rots.

# WHERE THE CORPUS IS. None of it lives in this repository and none of it may: the analysis
# names individuals on nearly every route and reads a private workspace. What is here is the
# citation, which is an address, and this gate is the thing that follows the address.
ONTOLOGY_DIR = pathlib.Path.home() / "projects/pr-zrive-toy/analysis"
ONTOLOGY_VAULT = pathlib.Path.home() / "Obsidian/02_areas/zrive"
# Relative to ONTOLOGY_DIR. The three shapes a citation on a route can take, and there is no
# fourth: a citation naming anything else is refused by `citation-corpus` below rather than
# quietly skipped, which is how a route acquires a source nothing can follow.
ONTOLOGY_YAML = "ontology/ontology.yaml"
ONTOLOGY_FINDINGS = "ontology/00_ontology.md"
ONTOLOGY_NOTION = "notion"
# The size of the corpus this file has claimed since issue 72, in prose, three times over
# ("an ontology of 55 entities"). It was a sentence nothing checked. It is a number now, and the
# gate reads the corpus's own list and the corpus's own declared count and refuses either
# disagreeing with it.
ONTOLOGY_ENTITIES = 55

# ---- THE READ DATE, WHICH THIS FILE ARGUED SHOULD NOT EXIST ------------------
# route_props() says the route rows are "undated, because this repository does not record when
# the analysis was read and a plausible date would compute to `fresh` and make an undated
# finding read as a current one". THAT ARGUMENT IS RIGHT AND IT IS ABOUT THE ROW'S DATE. Every
# one of those rows still carries no `at`, this card changes not one of them, and
# `syllabus-row-carries-no-read-date` is the rule that holds it there.
#
# A SOURCE'S `read_on` IS A DIFFERENT FIELD AND IT COMPUTES NOTHING. value_status() is a
# function of the ROW's rank and the ROW's `at`. Nothing anywhere ages a value against the read
# date of the source that produced it, and the programme-syllabus source has carried one since
# issue 118 while every row it covers has stayed undated. So a date here fabricates no freshness
# and reverses no argument.
#
# AND IT IS NOT A PLAUSIBLE DATE, WHICH IS THE HALF THAT WOULD HAVE BEEN WRONG. It is recorded,
# and it is bracketed at both ends:
#
#   BELOW, by the corpus itself. `meta.written` in ontology.yaml says when the analysis was
#   written, and check_ontology_registry() refuses a read date earlier than it. Nobody read a
#   document before it was written, and that is a refusal off the corpus rather than a promise.
#
#   ABOVE, by this repository's own history. `git log -S"ontology.yaml, Programme" --
#   build/model.py` names the commit that wrote these citations into this file, and its date is
#   the one below. The reading happened on or before the day it was written down here, so this
#   is the date the reading was RECORDED and the sentence above says so.
#
# THE ALTERNATIVE WAS A SOURCE WITH NO DATE AND A SENTENCE EXPLAINING THE HOLE, and it would
# have had to be bought by relaxing the rule that a source states when it was read. That rule is
# right, an honest date was available, and a gate is not weakened to let a change through.
ONTOLOGY_READ_ON = "2026-08-10"

# The four seats this source says it filled. WRITTEN, AND THEN CHECKED AGAINST THE FUNCTION
# THAT EMITS THEM, which is the difference between a declaration and a derivation and it was
# measured rather than reasoned about. Derived off route_props() this tuple was CIRCULAR: a row
# deleted from the emitter vanished from the declaration in the same edit, so the population
# rule had nothing left to compare it with, and a build emitting three rows on every panel went
# green. Both directions are closed instead. The tuple is what the source declares it produced,
# route_props() is what produces it, and a build where the two differ stops on the next line.
ROUTE_ROWS = ("route_system", "route_entered_by", "route_event", "route_source")

for _cid, _entry in sorted(ROUTES.items()):
    _emitted = tuple(row["k"] for row in route_props(_entry))
    if _emitted != ROUTE_ROWS:
        raise SystemExit(
            f"model: route_props() emits {_emitted} on route {_cid} and the operations-ontology "
            f"source declares it filled {ROUTE_ROWS}. The seats a source says it produced and "
            f"the rows a panel prints are the same four, in the same order, or the declaration "
            f"is about a panel that no longer exists and the population rule is comparing "
            f"nothing.")
del _cid, _entry, _emitted

VALUE_SOURCES["operations-ontology"] = {
    "corpus": "the operations analysis in the owner's private analysis repository, none of "
              "which lives here: an ontology of 55 entities in `analysis/ontology/"
              "ontology.yaml`, the findings register in `analysis/ontology/00_ontology.md`, "
              "the workspace reads in `analysis/notion/`, and one data-model note in the "
              "private vault. The fourth row of every populate panel is this document's "
              "citation into it",
    "read_on": ONTOLOGY_READ_ON,
    "rechecked_by": "check_ontology_registry",
    "produces": "registry",
    "rank": OBSERVED,
    # NO `real` HERE, and check_provenance() refuses a registry source that declares one. What
    # was read is an analysis OF the systems and not a system, so a route row wearing the chip
    # that means "read off the business" would be the same lie issue 104 is about, pointing at a
    # different population. `estimated` where the analysis records an answer and `absent` where
    # it records that there is none, which is what FIELD_FLAG already maps every route field to.
    "flags": [E, A],
    # THE SEATS, DERIVED. Every type an object is drawn as carries each of the four exactly
    # once, and check_provenance()'s population rule is what turns that sentence into a refusal:
    # a route row deleted off one node type, or a second row taking one of these names, stops
    # the build. The union is over both tables because Ghost binds per id and the two aggregates
    # bind per type, and a type in neither is already refused at the foot of this file.
    "covers": {t: list(ROUTE_ROWS)
               for t in sorted(set(CLASS_OF_TYPE) | {e["type"] for e in ROUTES.values()})},
}


# ---- WHAT THE GATE BELOW ESTABLISHES, AND WHAT IT DOES NOT -------------------
# In that order, and the second half is the longer one, because a check whose reach is oversold
# is what this repository is named for. Issue 118 said exactly this about `real` flags and it is
# the reason that card is worth anything.
#
# WHAT IT ESTABLISHES, on a machine that holds the corpus:
#
#   EVERY CITATION RESOLVES. For each of the seventeen routes, the file its `source` names is in
#   the corpus; an entity it names is one the ontology declares in its own `entities:` list; a
#   finding it names is a row of the findings register; and a phrase it quotes is in the file it
#   cites. A citation that no longer lands anywhere is a route whose provenance has rotted while
#   the sentence beside it went on being printed, and that is the drift this gate is for.
#
#   THE CORPUS IS STILL THE ONE THAT WAS READ. Its own `meta.entity_count`, its own list of
#   entities and the count this file has asserted in prose since issue 72 all have to agree. A
#   corpus rewritten under the citations is refused rather than cited.
#
#   THE READ DATE IS NOT BEFORE THE CORPUS EXISTED, read off the corpus's own `meta.written`.
#
#   AND THE GRAMMAR, ON EVERY MACHINE INCLUDING THIS ONE'S CI. A `source` string that does not
#   parse into a corpus and its locators names nothing anywhere, and saying so needs no corpus.
#
# WHAT IT DOES NOT ESTABLISH, and this is the half that decides whether the card is worth
# anything:
#
#   NOT THAT ANY SENTENCE ON A ROUTE IS WHAT THE CORPUS SAYS. The three sentences a panel prints
#   are prose a reader wrote from the analysis. This gate checks the ADDRESS and never the claim
#   at the address. A route asserting "no registry" about an entity the ontology records as
#   having one resolves green here, and so does a route whose three sentences were rewritten
#   yesterday by somebody who never opened the corpus. Comparing a sentence against a corpus is
#   a reading, not a check, and no build can do it.
#
#   NOT THAT THE ROUTES ARE CURRENT. Nothing here reads a SYSTEM. The corpus is an analysis of
#   the systems, which is why every route row is `3_observed` and not `1_official`, why all
#   seventeen entries carry a read state of `no-source` or `not-attempted`, and why the rows
#   carry no date. A system reorganised the day after the analysis was written leaves this gate
#   green and every sentence on the page wrong.
#
#   NOT ANYTHING AT ALL ON A MACHINE WITHOUT THE CORPUS, which is every CI run this repository
#   has. There it says on stderr which half it could not reach and returns, exactly as
#   check_module_structure() does, and the build goes on. A SILENT skip would read exactly like
#   a pass; HANSEI.md `2026-08-empty-input-reported-success` is that failure in another gate.
#
# AND THE SEATS ARE THE OTHER HALF OF THE CLAIM, checked by check_provenance() on every machine
# with no corpus at all: the source declares that each of the four rows sits on every drawn type
# exactly once, so a route row deleted, duplicated or renamed is refused in CI even where the
# citation cannot be followed.
_ONTOLOGY_ENTITY = re.compile(r"^[A-Z][A-Za-z]*$")
_ONTOLOGY_FINDING = re.compile(r"^finding (F\d+)$")


def _ontology_norm(s):
    """Case folded and whitespace collapsed, which is what a phrase locator is matched under."""
    return " ".join(s.split()).casefold()


def _ontology_read(path):
    """The declared entity names, the count the corpus declares for itself, and its write date.

    A LINE GRAMMAR AND NOT A YAML PARSER, deliberately. PyYAML is not a dependency of this build
    and a gate that cannot run for want of a package is a gate that does not run, which is the
    state this card is about. The three things read are each on one line of their own: an entity
    is a top level `- name:` item under `entities:`, and the other two are `meta` fields.
    """
    lines = path.read_text(encoding="utf-8").split("\n")
    head = "\n".join(lines)
    try:
        start = lines.index("entities:")
    except ValueError:
        start = len(lines)
    names = re.findall(r"^- name:\s*(\S+)\s*$", "\n".join(lines[start:]), re.M)
    declared = re.findall(r"^  entity_count:\s*(\d+)\s*$", head, re.M)
    written = re.findall(r"^  written:\s*['\"]?(\d{4}-\d{2}-\d{2})", head, re.M)
    return (names,
            int(declared[0]) if declared else None,
            written[0] if written else None)


def ontology_citation_digest(routes=None, read_on=None, entities=None):
    """The serialisation of everything check_ontology_registry holds against the corpus.

    Issue 196. Every string in it is already committed in the clear a few hundred lines above:
    the citations are the fourth row of every populate panel, the entity count has been in this
    file's prose since issue 72, and the date is ONTOLOGY_READ_ON. Nothing from inside the
    private analysis is here, and nothing from inside it may ever be: what this attests to is
    the ADDRESSES, which is exactly what the gate follows.
    """
    routes = ROUTES if routes is None else routes
    read_on = ONTOLOGY_READ_ON if read_on is None else read_on
    entities = ONTOLOGY_ENTITIES if entities is None else entities
    lines = [f"entities\t{entities}", f"read_on\t{read_on}"]
    lines += [f"cite\t{cid}\t{routes[cid]['source']}" for cid in sorted(routes)]
    return _reading_digest(lines)


def check_ontology_registry(routes=None, root=None, vault=None, read_on=None, entities=None,
                            attest=True):
    """Re-read the analysis the populate registry was written from, and refuse a drift.

    The arguments exist so that ontology_self_test() can point this at a synthetic corpus it
    built itself and prove each refusal fires. Defaulted, so the live call below takes the real
    ones and there is one place each of them is written.

    `attest` is off for those probes and on for the live call. The attestation in
    build/corpus_reading.txt is about THESE routes, and a probe driving the gate over a synthetic
    corpus with three invented routes would be held against a digest of the real seventeen and
    would report a stale record on every run. Issue 196.
    """
    # Issue 118's line, and the same one check_module_structure and check_syllabus_counts carry.
    # VALUE_SOURCES names this function as the gate that re-reads its corpus and check_provenance
    # refuses that claim if this line was never reached. Recorded on ENTRY and not on the clean
    # path, because the claim is that the corpus is re-read wherever it exists and the branch
    # below that says it does not exist here has honoured it.
    RECHECK_GATES_RUN.add("check_ontology_registry")
    routes = ROUTES if routes is None else routes
    root = ONTOLOGY_DIR if root is None else root
    vault = ONTOLOGY_VAULT if vault is None else vault
    read_on = ONTOLOGY_READ_ON if read_on is None else read_on
    entities = ONTOLOGY_ENTITIES if entities is None else entities

    def bad(rule, why):
        raise SystemExit(f"[ontology] {rule}: {why}")

    # ---- the grammar, which needs no corpus ------------------------------------------------
    cited = []
    for cid in sorted(routes):
        text = routes[cid]["source"]
        for seg in text.split(";"):
            parts = [x.strip() for x in seg.split(",")]
            if not parts or not all(parts):
                bad("citation-grammar",
                    f"route {cid} cites {text!r}, and one of its parts is empty. A citation is "
                    f"a corpus and the locators inside it, separated by commas, and several of "
                    f"them separated by semicolons. A part with nothing in it is an address "
                    f"with a blank line in the middle of it.")
            ref, locators = parts[0], parts[1:]
            if ref == "ontology.yaml":
                kind = "ontology"
            elif ref.startswith("notion "):
                kind = "notion"
            elif ref.startswith("vault "):
                kind = "vault"
            else:
                bad("citation-corpus",
                    f"route {cid} cites {ref!r}, which is not one of the three corpora this "
                    f"gate can follow: `ontology.yaml`, `notion <file>` or `vault <note>`. A "
                    f"route may not acquire a source nobody can go back to, which is the whole "
                    f"of what the fourth row of a panel is for.")
            cited.append((cid, kind, ref, locators))

    have_root, have_vault = root.is_dir(), vault.is_dir()
    if not have_root and not have_vault:
        # Issue 196. This used to be the whole of it: one line to stderr and a `return`, on every
        # CI run this repository has ever had. The gate now asks what the committed attestation
        # says about these citations before it declines, and declines only where there is nothing
        # to ask.
        token, why = (("unverified", "") if not attest else
                      recorded_verdict("ontology-citations",
                                       ontology_citation_digest(routes, read_on, entities),
                                       corpus_present=False))
        if token == "recorded":
            print(f"[model] ontology registry: [recorded] neither the analysis repository nor "
                  f"the vault is on this machine, so not one of the {len(cited)} citations on "
                  f"the {len(routes)} populate routes was followed here. {why}. The citations "
                  f"themselves were recorded on {read_on}.", file=sys.stderr)
            return
        print(f"[model] ontology registry: [unverified] neither the analysis repository nor the "
              f"vault is on this machine, and no recorded reading is committed either, so all "
              f"{len(cited)} citations on the {len(routes)} populate routes are unverified "
              f"here. They were recorded on {read_on}.", file=sys.stderr)
        return

    # ---- the corpus's own account of itself -------------------------------------------------
    names, declared, written = [], None, None
    if have_root:
        yml = root / ONTOLOGY_YAML
        if not yml.is_file():
            bad("citation-file",
                f"the analysis repository is on this machine at {root} and {ONTOLOGY_YAML} is "
                f"not in it. Every route but three cites that file by name.")
        names, declared, written = _ontology_read(yml)
        if declared != len(names) or len(names) != entities:
            bad("entity-count",
                f"{ONTOLOGY_YAML} lists {len(names)} entities and declares {declared!r} of "
                f"them, and this file has said {entities} since issue 72. A corpus rewritten "
                f"under the citations is a corpus these routes were not read from.")
        if written is None:
            bad("corpus-undated",
                f"{ONTOLOGY_YAML} carries no `meta.written` date, so nothing can establish "
                f"that it existed before the day this source says it was read. The lower "
                f"bracket on that date is the corpus's own, and without it the date is a claim "
                f"again rather than a reading.")
        if written > read_on:
            bad("read-before-written",
                f"this source says the analysis was read on {read_on} and the analysis says it "
                f"was written on {written}. Nobody read it before it was written, so one of "
                f"the two dates is wrong and the citations rest on whichever it is.")

    # ---- and every citation followed ---------------------------------------------------------
    findings = set()
    if have_root and (root / ONTOLOGY_FINDINGS).is_file():
        findings = set(re.findall(r"^\|\s*\*\*(F\d+)\*\*\s*\|",
                                  (root / ONTOLOGY_FINDINGS).read_text(encoding="utf-8"), re.M))
    entity_set, resolved, unchecked = set(names), 0, 0
    for cid, kind, ref, locators in cited:
        if kind == "vault" and not have_vault:
            unchecked += 1
            continue
        if kind in ("ontology", "notion") and not have_root:
            unchecked += 1
            continue
        if kind == "ontology":
            path = root / ONTOLOGY_YAML
        elif kind == "notion":
            stem = ref.split(" ", 1)[1]
            found = sorted((root / ONTOLOGY_NOTION).glob(stem + "*.md"))
            if len(found) != 1:
                bad("citation-file",
                    f"route {cid} cites {ref!r} and {len(found)} files in "
                    f"{ONTOLOGY_NOTION}/ answer to that name. A citation naming none of them "
                    f"points nowhere and one naming two says nothing about which.")
            path = found[0]
        else:
            note = ref.split(" ", 1)[1]
            found = sorted(vault.rglob(note + ".md"))
            if len(found) != 1:
                bad("citation-file",
                    f"route {cid} cites {ref!r} and {len(found)} notes in the vault answer to "
                    f"that name. A citation naming none of them points nowhere and one naming "
                    f"two says nothing about which.")
            path = found[0]
        body = _ontology_norm(path.read_text(encoding="utf-8"))
        for loc in locators:
            finding = _ONTOLOGY_FINDING.match(loc)
            if kind == "ontology" and finding:
                if finding.group(1) not in findings:
                    bad("citation-finding",
                        f"route {cid} cites {loc!r} and the findings register in "
                        f"{ONTOLOGY_FINDINGS} holds no row keyed that way. The finding it was "
                        f"read from has been renumbered or removed.")
            elif kind == "ontology" and _ONTOLOGY_ENTITY.match(loc):
                if loc not in entity_set:
                    bad("citation-entity",
                        f"route {cid} cites the entity {loc!r} and {ONTOLOGY_YAML} declares no "
                        f"entity of that name. The class this route describes has been renamed "
                        f"or dropped in the analysis, and the panel is still printing three "
                        f"sentences about it.")
            elif _ontology_norm(loc) not in body:
                bad("citation-phrase",
                    f"route {cid} quotes {loc!r} and {path.name} does not carry that phrase. "
                    f"The passage this route was read from is not there any more.")
            resolved += 1
    # HALF A CORPUS IS NOT A CORPUS, and this branch keeps the token it carried before issue 196
    # rather than claiming the better one. The attestation is a single digest over ALL the
    # citations and cannot be split into the ones this machine followed and the ones it did not,
    # so a machine holding one half reports what it has always reported: it did not look at
    # everything. Under-claiming is the direction this repository takes when it cannot tell.
    #
    # AND THE CONDITION IS THE TWO CORPORA AND NOT THE UNFOLLOWED COUNT, which Codex found: with
    # both roots missing this function has already returned, and `unchecked` is zero whenever
    # every citation happens to point at the half that IS present. The citation grammar allows a
    # route to cite the vault alone, so a set of routes citing nothing in the analysis repository
    # would have reached the verified notice on a machine holding no analysis repository at all,
    # with the entity count unchecked and inside the digest. The rule is that the gate read
    # everything it is about, and reading everything means both.
    if unchecked or not have_root or not have_vault:
        gone = ", ".join(n for n, ok in (("the analysis repository", have_root),
                                         ("the vault", have_vault)) if not ok)
        print(f"[model] ontology registry: [unverified] {resolved} citation locators re-read "
              f"against the corpus on this machine and {unchecked} of them not, because {gone} "
              f"is not on it. Half a corpus cannot attest the whole of what this gate covers, so "
              f"nothing here is checked against {CORPUS_READING_PATH.name} either. Every one of "
              f"them was recorded on {read_on}.", file=sys.stderr)
        return
    token, why = (("verified", "") if not attest else
                  recorded_verdict("ontology-citations",
                                   ontology_citation_digest(routes, read_on, entities),
                                   corpus_present=True))
    print(f"[model] ontology registry: [{token}] all {resolved} citation locators on the "
          f"{len(routes)} populate routes resolve against the corpus on this machine, and its "
          f"{len(names)} entities are the ones these routes were read from. What resolves is the "
          f"address and never the sentence beside it{(' ' + why) if why else ''}",
          file=sys.stderr)


check_ontology_registry()



# ---- identity, and it is not the drawing id ---------------------------------
# Issue 60, seam 4. Every object here carries a drawing id, `t1`, `co_emp2`, `s1`, and that id
# exists so that a tile can be joined to an edge. It is not the object's identity: a management
# tool joins a row to the system that holds it, on that system's own key, and a drawing id means
# nothing outside this file. So every object also carries two fields, both nullable:
#
#   source_system   the machine name of the system holding the record, or null
#   source_key      that system's own key for this object, or null
#
# NOW, WHILE THE DATA IS INVENTED. Retrofitting identity after adapters exist means touching
# every adapter, and the adapters are the next cards rather than distant ones.
#
# NULL IS A FINDING AND NOT AN OMISSION. Where the ontology establishes that no system holds the
# type, there is no key to carry and both fields are null. The Cohort is the plainest of them: a
# cohort exists as a thing, no identifier for it is held anywhere, and its tile already carries a
# mark saying so. Inventing a key to fill that column would delete the one thing this drawing has
# to say about it.
#
# WHERE THE SYSTEM NAME COMES FROM, AND IT IS NO LONGER A LIST OF ITS OWN. Seam 4 kept a
# SOURCE_SYSTEM map beside the routes: a second place saying which system holds a class, and so a
# second place for it to disagree with the sentence the panel prints. It was held together by two
# refusals in the loop at the foot of this file. Issue 72 folded it into the registry, so
# source_system is now the `system` field of the very entry whose route_system row the panel is
# showing. One declaration, no second list, and no way at all to key an object in Stripe while
# its route says nothing holds it: there is nowhere left to write the disagreement down.
#
# THE KEYS ARE INVENTED AND THEY DELIBERATELY DO NOT IMITATE THE VENDORS' OWN FORMATS. A string
# shaped exactly like a Stripe charge id or a Notion page id, on a page anyone with the URL can
# read, invites being read as a real one. Each key is the system's own name, a hyphen and ten
# digits derived from the object's seed: stable across builds, one per object, and unmistakably
# a toy. What a management tool needs from this column is that it joins, not that it looks
# plausible. The registry says the same thing in machine form: every attachable class carries
# key.status "not-recorded" and key.stands_in "source_key", because not one of the eight routes
# names a field a real adapter could join on.


def source_key(system, seed):
    """The invented key an object would be found by in the system that holds it.

    Deterministic in the seed, so a rebuild writes the same document and the reproducibility
    gate stays a gate. The seed is the object's drawing id for everything except a student,
    where the drawn tile and the roster row are two renderings of one person and are seeded on
    the person instead, so they carry one key while their drawing ids differ. That is the whole
    argument for the column: `s1` and `STU-0001` are the same student and nothing but this says
    so.
    """
    if system is None:
        return None
    n = int(hashlib.sha256(f"zrive-toy:{system}:{seed}".encode("utf-8")).hexdigest()[:16], 16)
    return f"{system}-{n % 10 ** 10:010d}"


# ---- the cohort, one row per student ----------------------------------------
# INVENTED, ALL OF IT, AND IT HAS TO STAY THAT WAY. This page is served publicly by GitHub
# Pages even though the repository behind it is private, and a roster is the one table on it
# that would matter if it were real: a named person, where they studied, roughly how old they
# are and whether they owe money. Every one of the thirty four people below is made up, every
# row is flagged `dummy` on the page, and nothing is imported from any Zrive system, ever.
# HANSEI.md `2026-08-09-private-repo-public-pages` is this project publishing real commercial
# data on a public page; do not be the second. If a real cohort ever has to be looked at, that
# is a different deployment and not this one.
#
# The universities are real institutions, which is a different kind of statement: naming a
# university names nobody, and this model already names McKinsey and Bain. What must never
# happen is an invented person paired with anything that could be read as a real record.
#
# A year of birth and not a date of birth, deliberately, and the decision is issue 51's own: a
# public page showing a named person with a birth date models a practice worth not modelling,
# and the year says everything the data model needs to say about the field existing.
COHORT_HEADCOUNT = 34
DRAWN_STUDENTS = 4      # how many of them get a tile on the canvas; the rest are in the sheet

# name, university, year of birth, charge state
ROSTER = [
    ("Olalla Verdiales",    "ICADE",      "2003", "unpaid"),
    ("Leandro Melguizo",    "UAM",        "2002", "paid"),
    ("Naiara Berruezo",     "CUNEF",      "2003", "paid"),
    ("Unai Olabarri",       "Deusto",     "2001", "unpaid"),
    ("Casilda Quintanar",   "ICADE",      "2003", "paid"),
    ("Eneko Zarauz",        "ESADE",      "2002", "unpaid"),
    ("Itziar Malumbres",    "UAM",        "2004", "paid"),
    ("Brais Cerecedo",      "CUNEF",      "2002", "paid"),
    ("Amaranta Ibaseta",    "Deusto",     "2003", "unpaid"),
    ("Julen Peñalba",       "ICADE",      "2001", "paid"),
    ("Ariadna Elizalde",    "ESADE",      "2003", "paid"),
    ("Iago Villaécija",     "UAM",        "2002", "unpaid"),
    ("Leire Redondela",     "CUNEF",      "2003", "paid"),
    ("Asier Baigorri",      "Deusto",     "2002", "paid"),
    ("Uxue Larrea",         "ICADE",      "2004", "unpaid"),
    ("Mikel Trujillano",    "ESADE",      "2001", "paid"),
    ("Ximena Membrado",     "UAM",        "2003", "paid"),
    ("Gorka Zubiaurre",     "CUNEF",      "2002", "unpaid"),
    ("Idoia Sotomonte",     "ICADE",      "2003", "paid"),
    ("Breogán Escorihuela", "Deusto",     "2002", "paid"),
    ("Nekane Zabaleta",     "UAM",        "2004", "paid"),
    ("Cosme Ferrandis",     "ESADE",      "2001", "unpaid"),
    ("Maialen Barandica",   "CUNEF",      "2003", "paid"),
    ("Oier Alberdi",        "Deusto",     "2002", "paid"),
    ("Berenice Cascante",   "ICADE",      "2003", "unpaid"),
    ("Anxo Berciano",       "UAM",        "2002", "paid"),
    ("Ainara Otaduy",       "ESADE",      "2004", "paid"),
    ("Damián Codolar",      "CUNEF",      "2001", "paid"),
    ("Leocadia Manterola",  "Deusto",     "2003", "unpaid"),
    ("Koldo Ozaeta",        "ICADE",      "2002", "paid"),
    ("Amaia Cendoya",       "UAM",        "2003", "paid"),
    ("Beñat Iraizoz",       "ESADE",      "2002", "paid"),
    ("Eulalia Villalpando", "CUNEF",      "2004", "unpaid"),
    ("Xabier Aristimuño",   "Deusto",     "2001", "paid"),
]

# The count is not typed anywhere twice. The headcount on the students card, the number in its
# tile, the cohort's students_enrolled, the marker under the card saying how many are not drawn
# and the sheet's own heading are all this list's length, or this list's length less the four
# that are drawn. A roster and a headcount that disagree is the defect the marker exists to make
# impossible, so neither is allowed to be a literal.
if len(ROSTER) != COHORT_HEADCOUNT:
    raise SystemExit(f"model: ROSTER holds {len(ROSTER)} rows, COHORT_HEADCOUNT says "
                     f"{COHORT_HEADCOUNT}")
NOT_DRAWN = COHORT_HEADCOUNT - DRAWN_STUDENTS


# ---- the model has to pass the name gate before it is a model ---------------
# Thirty four invented Spanish names is thirty four chances to write down somebody real, and the
# first draft of this list did it thirteen times over: a register of teachers is full of ordinary
# Spanish given names, and an invented one of those is spelled exactly like a real one. A
# university did it too, because a Spanish institution can be named after a person. The gate
# caught all of it in the working tree, before anything was committed or deployed, and the fix
# was to change the invented values and not the rule.
#
# What is written here is the other half of that fix, so the next person to add a student cannot
# repeat it: the same folding and the same salted hash the gate uses, run at import over every
# string this model ships, refusing the build on a hit. It fires here, in one second, instead of
# in a CI log after a push. Over every string and not only over the names, because the thing that
# got through the first version of this check was the column beside them.
#
# The parameters are read out of scripts/forbidden_lib.sh and never copied into this file. The
# salt, the minimum token length and the stop list live there, one copy, shared by both gates,
# and a copy of them here would be a fourth. What this does duplicate is the folding, in Python,
# which build/safety_grep.py already does and which is recorded there as a thing that can drift;
# it is checked against the shell pipeline's own output rather than assumed. A hit prints the row
# and the length and withholds the token: this file is not where a name that is not public
# becomes public.
def _forbidden_salt():
    """The salt, resolved the same two ways scripts/forbidden_lib.sh resolves it.

    THIS IS A SECOND COPY OF A RESOLUTION RULE AND IT IS TREATED AS ONE. Issue 164 took the salt
    out of scripts/forbidden_lib.sh, where it was a literal this file used to read out with a
    regex. A literal in a public repository is what the card is about, so the regex had to go;
    what replaced it cannot be a regex over a value that is no longer written down. This file is
    Python and cannot source the library, so it resolves the salt itself, which makes two copies
    of one rule, and this repository has been bitten five times by exactly that.

    So the copies are compared instead of trusted. Both sides can compute a salt-check, which is
    one way over the salt under its own prefix and safe to print anywhere, and
    scripts/check_repo.sh --self-test runs both and refuses a disagreement. A drift between the
    two resolutions stops the build instead of producing a gate that hashes with the wrong salt
    and finds nothing.
    """
    import os
    import re as _re

    salt = os.environ.get("FORBIDDEN_SALT", "")
    if not salt:
        path = pathlib.Path(os.environ.get(
            "FORBIDDEN_SALT_FILE", pathlib.Path.home() / ".config/zrive-model-toy/forbidden.env"))
        try:
            m = _re.search(r"^\s*FORBIDDEN_SALT\s*=\s*[\"']?([^\"'\s]+)",
                           path.read_text(encoding="utf-8"), _re.M)
        except OSError:
            m = None
        salt = m.group(1) if m else ""
    if not salt:
        raise SystemExit(
            "model: no FORBIDDEN_SALT, so every string this model ships would hash to something\n"
            "  the name register cannot hold, nothing would match, and the roster would be called\n"
            "  clean without having been checked. Refusing to build.\n"
            "  Export FORBIDDEN_SALT, or put one line FORBIDDEN_SALT=<value> in\n"
            "  ~/.config/zrive-model-toy/forbidden.env. In CI, scripts/ci_register.sh sets it.")
    return salt


def _salt_check(salt):
    """The value scripts/forbidden_lib.sh calls salt_check. One way, and safe to print."""
    import hashlib
    return hashlib.sha256(
        ("zrive-model-toy salt-check\n" + salt).encode("utf-8")).hexdigest()[:16]


def _forbidden_hits(labelled):    # [(where, string)] -> [(where, token length)]
    import hashlib
    import os
    import re as _re
    import unicodedata

    root = pathlib.Path(__file__).resolve().parent.parent
    lib = root / "scripts" / "forbidden_lib.sh"
    # The register is untracked since issue 164 and its path is a variable, because CI writes it
    # outside the working tree, out of a repository secret, and points here with this env var.
    hashes = pathlib.Path(os.environ.get(
        "FORBIDDEN_HASHES", root / "scripts" / "forbidden_names.sha256"))
    try:
        rules = lib.read_text(encoding="utf-8")
        register = hashes.read_text(encoding="utf-8")
    except OSError as exc:
        raise SystemExit(f"model: cannot read the name gate's rules ({exc}). The roster is not "
                         f"checkable without them, and an unchecked roster is not shippable. "
                         f"The register is generated by scripts/gen_forbidden_hashes.sh on a "
                         f"machine holding the vault, and by scripts/ci_register.sh on CI.")
    known = {ln.strip() for ln in register.splitlines()
             if ln.strip() and not ln.startswith("#")}
    # An empty list would pass everything, which is the loudest lie a gate can tell.
    if not known:
        raise SystemExit("model: the name hash list is empty; refusing to call the roster clean")

    def rule(name, pattern):
        m = _re.search(pattern, rules)
        if not m:
            raise SystemExit(f"model: scripts/forbidden_lib.sh no longer defines {name}")
        return m.group(1)

    salt = _forbidden_salt()

    # A full register built under some other salt matches nothing, exactly like an empty one, and
    # unlike an empty one it looks healthy. The register says which salt built it and this refuses
    # a register that does not say, or says the wrong thing.
    stamped = _re.search(r"^# salt-check:\s*([0-9a-f]{16})\s*$", register, _re.M)
    if not stamped:
        raise SystemExit(
            "model: the name register names no salt, so it cannot be checked against the one in\n"
            "  force and nothing in it would necessarily match. Regenerate it with\n"
            "  scripts/gen_forbidden_hashes.sh.")
    if stamped.group(1) != _salt_check(salt):
        raise SystemExit(
            "model: the name register was built under a different salt from the one in force.\n"
            "  Nothing in it can match, so the roster would be called clean without being\n"
            "  checked. Regenerate the register, and update both repository secrets together.")

    minlen = int(rule("FORBIDDEN_MIN_TOKEN", r"FORBIDDEN_MIN_TOKEN=(\d+)"))
    stop = set(rule("FORBIDDEN_STOP", r'FORBIDDEN_STOP="([^"]*)"').split())

    hits = []
    for where, s in labelled:
        flat = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
        for tok in _re.split(r"[^a-z]+", flat):
            if len(tok) < minlen or tok in stop:
                continue
            if hashlib.sha256((salt + tok).encode("utf-8")).hexdigest()[:16] in known:
                hits.append((where, len(tok)))
    return hits


def _check_names(labelled):
    hits = _forbidden_hits(labelled)
    if not hits:
        return
    for where, n in hits:
        print(f"[model] {where} carries a {n} character token that is a real name in the "
              f"register the safety gate holds (token withheld). Change the invented value.")
    raise SystemExit("[model] refusing to build a model that collides with the name register")


_check_names([(f"ROSTER row {i + 1}", v)
              for i, row in enumerate(ROSTER) for v in row])


# ============================================================================
# ONE PROGRAMME TYPE, SEVEN INSTANCES
# ============================================================================
# Issue 43. The toy carried one Programme, Investment Banking, and one instance cannot show
# whether Programme is an object type or a shape baked into the drawing. Six more are declared
# below, from the real syllabi in the vault, and all seven are built by the same three functions
# out of the same fields. That is the test rather than the decoration: if Programme were an
# assumption, the second instance would have needed a second code path, and none of the six does.
#
# WHAT IS REAL AND WHAT IS INVENTED. Programme names, programme codes, session titles and firm
# names are real and are reproduced verbatim, including Spanish spelling, the leading space on
# one Z-SC title and the double space in one Z-HR title. Every PERSON is invented. Every
# identifier, date, duration, count, state and amount is invented. The name gate at the foot of
# this file hashes every string any of the seven ships and refuses the build on a collision.
#
# WHAT THE SIXTH AND SEVENTH INSTANCES FORCED, none of which one programme could have suggested:
#
#   1. Instructor to Programme is many to many. Three teachers of the real sixty four hold
#      sessions on more than one programme, one of them on three. t4 spans three routes here,
#      t6 and t7 span two, which reproduces that distribution exactly. Node ids are therefore
#      GLOBAL and not per route, so a later sheet can key on the id.
#   2. A Company can employ more than one Instructor. McKinsey supplies two on Z-SC, Uría two on
#      Z-BL, Meta two on Z-DS, and instructors_supplied finally reads something other than 1.
#   3. An Instructor can have no employer at all, 17 of the real 64. Four here carry
#      p("employer", "not recorded", A) and draw no 'employed by' edge.
#   4. A CohortSession can have no teacher. 100 of the real 260 have none; ten of the forty two
#      drawn here carry teacher_assigned "no", flagged absent, with the 'teaches' edge missing.
#   5. Z-CFA has no instructor anywhere in its source, so the whole lane is empty. That is the
#      finding and not a fault, and it is why the lane captions are a per view argument to
#      layout() rather than a module constant.
#
# THE SHARED CAST IS DELIBERATE AND MUST NOT BE UNDONE. Giving each route a private set of
# instructors would produce a faculty sheet showing zero sharing across the catalogue, which is
# the one answer the real data says is wrong.
#
# A NOTE ON EMPLOYERS AND RE-IDENTIFICATION, which the name gate cannot see. The gate hashes
# person tokens; it has no opinion about a firm. But a firm that supplies exactly one teacher in
# the real register re-identifies that teacher the moment an invented instructor is paired with
# it on a public page. Two employers were therefore substituted for real ones that would have
# been conspicuous, and both substitutions are recorded at the point of use. Apply the same
# reasoning to anything added later: prefer an employer that supplies two or more.

# Every firm named on any of the seven routes as an employer. Real firm names, which name
# nobody; the pairing of a firm with a person is invented and every instructor's employer row is
# flagged dummy for exactly that reason.
COMPANIES = {
    "co_emp": "McKinsey",
    "co_emp2": "Houlihan Lokey",
    "co_emp3": "Bain & Company",
    "co_emp4": "Zrive",
    "co_emp5": "Uría",
    "co_fide": "Fide Partners",
    "co_latham": "Latham & Watkins",
    "co_baker": "Baker McKenzie",
    "co_cinven": "Cinven",
    "co_nazca": "Nazca Capital",
    "co_seedtag": "Seedtag",
    "co_cabify": "Cabify",
    "co_stemdo": "Stemdo",
    "co_kaleidos": "Kaleidos",
    "co_openbank": "openbank",
    "co_meta": "Meta",
}
# The operator of every one of the seven programmes, and an employer of instructors on three of
# them. It is drawn as a Company like the other fifteen and carries the difference in the data.
ZRIVE = "co_emp4"

# A property whose value is an absence rather than a value. Written once so that "not recorded"
# cannot drift into "unknown" on one route and "none" on another: the difference between those
# two words is the whole use of the third flag.
NOT_RECORDED = "not recorded"


# ---- the other six cohorts, recombined rather than invented again -----------
# Six more cohorts need six more rosters. Inventing a hundred and thirty more Spanish names
# would be a hundred and thirty more chances to write down somebody real, and the first draft of
# the thirty four above did exactly that thirteen times over. So not one of them is invented.
# The given names and the surnames of the roster above are split apart and recombined at an
# offset: the people are new, every token in them has already been through the name gate, and
# the offset is never zero, so no recombined row can put a given name back with the surname it
# arrived with. The university, the year and the charge state travel with the given name, so
# each cohort's distribution is the one above rather than a second thing to invent.
if any(len(row[0].split()) != 2 for row in ROSTER):
    raise SystemExit("model: the roster recombination assumes two tokens per name and one row "
                     "no longer has two. Fix the split rather than the roster.")
_GIVEN = [row[0].split()[0] for row in ROSTER]
_SURNAME = [row[0].split()[1] for row in ROSTER]


def cohort_roster(headcount, offset):
    """`headcount` invented people, made of tokens the gate has already cleared."""
    if not 0 < headcount <= len(ROSTER):
        raise SystemExit(f"model: a cohort of {headcount} cannot be recombined out of a pool of "
                         f"{len(ROSTER)} without repeating a person")
    step = 1 + offset % 7          # never 0, so a row never keeps its own surname
    rows = []
    for i in range(headcount):
        gi = (i + offset) % len(ROSTER)
        si = (gi + step) % len(ROSTER)
        _name, uni, yob, state = ROSTER[gi]
        rows.append((f"{_GIVEN[gi]} {_SURNAME[si]}", uni, yob, state))
    return rows


# ---- the seven declarations -------------------------------------------------
# A template is (id, title, code, delivery_mode, location_mode, duration_min). Any of the last
# three may be None, which is written as an absence and not as a guess.
#
# An instructor is (id, label, employer node id or None, sessions taught on THIS route,
# the routes it appears on or None). A Zrive-employed instructor's fee reads "in scope of
# salary"; everybody else's reads "not modelled".
#
# A cohort session is (id, label, template id, (teacher ids), scheduled_at, state, attendance).
# An empty teacher tuple is a session with nobody assigned, which is a real and common shape.
SYLLABUS = ("real, from the programme syllabus", E)
WEBSITE = ("real, published on the company website", E)
# One template on Z-BL carries this instead of its route's own title provenance, because its
# label is not the syllabus string: the firm the row names is withheld. A per template override
# and not a per route one, so the tile that is not verbatim is the only tile that says so.
#
# THE NOTE SAYS THAT THE NAME IS WITHHELD AND NOTHING ABOUT WHY, AND THAT IS THE WHOLE POINT OF
# ITS CURRENT WORDING. It used to publish the reason: that the withheld string collides with an
# entry in the register the name gate holds, and which neighbouring template was unaffected.
# Read against the short public list of Spanish law firms named after a person, those two
# sentences narrow the candidates to very few, so the note was an oracle for the thing the
# withholding exists to protect. A redaction that explains itself is not a redaction. The brief
# that produced the first wording asked for the reasoning to be shown on the tile, and that was
# the error; it is recorded here so the next edit does not helpfully restore it.
#
# What the note may still say is that the name is withheld and that it was not swapped for
# another firm's, because that is a statement about this tile's own truthfulness and it points
# at nothing outside the tile.
WITHHELD_FIRM = {
    "title_provenance": ("real, with the firm name withheld", D),
    # #128 cut the two middle sentences, which argued for the withholding rather than stating
    # anything about the session. The provenance row above already says the firm is withheld.
    "note": ("The syllabus row for this session names the law firm being visited. What the tile "
             "states is what is known, that the session is a visit to a law firm."),
}

# ---- how many sessions each programme actually has ---------------------------
# Issue 83. The drawing shows a sample of the syllabus on five of the seven routes and used to
# say nothing about it, so a reader comparing a six tile column with a twenty eight tile column
# would have read a difference in programme size that the data does not carry. The band caption
# now states the sample, and it is written from these numbers rather than typed into the
# caption.
#
# WHY THE NUMBER IS DECLARED HERE AND NOT COUNTED AT BUILD TIME. The syllabi live in a private
# vault on one machine. The build runs in CI, where that vault does not exist, and a build that
# reads it would either fail there or silently produce a different drawing, which is the one
# thing site/instance.js and site/layout.js may never do. So the count is read once, by hand,
# and written once, here: one place, feeding the Programme tile, the Cohort tile and the two
# band captions, none of which can now disagree with each other.
#
# AND IT IS NOT LEFT ON TRUST. check_syllabus_counts() below re-counts the folders on any
# machine that has the vault and refuses the build if a number here has drifted, and says out
# loud when it could not check rather than passing in silence.
SYLLABUS_DIR = pathlib.Path.home() / "Obsidian/02_areas/zrive/02_areas/20_academic/syllabi"
SYLLABUS_SESSIONS = {"ZIB": 79, "ZCFA": 45, "ZPE": 36, "ZBL": 28, "ZSC": 25, "ZHR": 25, "ZDS": 22}
# One owner for one fact, issue 118: the date this corpus was read is declared once, in the
# source block above, and shipped in the document. A second copy here is how two dates drift.
SYLLABUS_COUNTED_ON = VALUE_SOURCES["programme-syllabus"]["read_on"]

# ---- and the module structure inside them, issue 85 --------------------------
# THE SYLLABUS NOTES HAVE CARRIED THIS SINCE BEFORE THIS REPOSITORY EXISTED AND THE DRAWING HAS
# NEVER SAID IT. Every note under the vault's syllabi folder holds `module`, `module_name` and
# `sequence` beside the title the tiles are already labelled with, and a session template shipped
# five properties, none of which said where in a programme the session sits.
#
# WRITTEN HERE FOR THE REASON SYLLABUS_SESSIONS IS: the vault is private and on one machine, the
# build runs in CI, and a build that reads it would produce a different document there. So the
# structure is read once, by hand, and written once, here, and check_module_structure() below
# re-reads the vault on any machine that has it and refuses a drift.
#
# EACH ENTRY IS (module code, module name, sessions in the WHOLE syllabus). The count is the
# whole syllabus and not the sample the drawing carries, which is the distinction issue 83 made
# and the one a reader of a six tile column needs kept.
#
# AND THE TABLE IS THE FINDING AS MUCH AS IT IS THE DATA. Three of the seven do not have a module
# for every session and one has none at all:
#
#   Z-IB    79 sessions   9 modules    every session in one
#   Z-CFA   45 sessions   0 modules    NOT ONE, and the count is the whole point of the row
#   Z-PE    36 sessions   3 modules    9 sessions in no module
#   Z-BL    28 sessions   5 modules    every session in one
#   Z-SC    25 sessions   6 modules    every session in one
#   Z-HR    25 sessions   4 modules    21 sessions in no module, and each module holds one
#   Z-DS    22 sessions  12 modules    every session in one
#
# Z-HR IS THE ROW THAT SAYS WHAT THE OTHERS MEAN. Four modules over twenty five sessions, one
# session each, twenty one outside: this is a module structure somebody began and did not finish,
# not a programme organised into four parts. Z-DS's twelve over twenty two are a different object
# again, seven of them named `Modulo 1` to `Modulo 7`, which is a slot and not a subject, and the
# other five named for a ROLE or an activity, `Code reviewers`, `Mock interviews`, `Project
# coordinators*`, `PROYECTO A`, `PROYECTO B`. Z-IB's nine and Z-SC's six are subjects. So the word
# module does not name one kind of thing across the seven, and the drawing says the counts rather
# than implying a structure they do not share.

SYLLABUS_MODULES = {
    "ZIB": (
        ("M01", "External Courses", 2),
        ("M02", "Getting Started", 5),
        ("M03", "Intro to Investment Banking", 10),
        ("M04", "Financial Statement Analysis", 13),
        ("M05", "Company & Security Valuation", 17),
        ("M06", "Advanced Topics", 17),
        ("M07", "Financial Modelling", 3),
        ("M08", "In Person Weekend 1", 7),
        ("M09", "In Person Weekend 2", 5),
    ),
    "ZSC": (
        ("M01", "Intro to Strategy Consulting", 3),
        ("M02", "Recruiting in Strategy Consulting", 3),
        ("M03", "Business Case Practice", 8),
        ("M04", "Inside consulting", 7),
        ("M05", "In Person Weekend 1", 2),
        ("M06", "In Person Weekend 2", 2),
    ),
    "ZBL": (
        ("M01", "Big Law & procesos de selección", 3),
        ("M02", "Áreas de práctica en despacho", 15),
        ("M03", "Habilidades clave para abogados", 4),
        ("M04", "Finde Presencial 1", 3),
        ("M05", "Finde Presencial 2", 3),
    ),
    "ZPE": (
        ("M01", "Intro to Private Equity", 6),
        ("M02", "Investment Process in Corporate PE", 11),
        ("M03", "Investment Strategies & Asset Classes", 10),
    ),
    "ZHR": (
        ("M01", "Intro to Recursos Humanos & People", 1),
        ("M02", "Employee Journey: Atracción & Selección", 1),
        ("M03", "Employee Journey: Retención & Satisfacción", 1),
        ("M04", "Data & Analytics en Recursos Humanos", 1),
    ),
    "ZDS": (
        ("M01", "Modulo 1", 2),
        ("M02", "Modulo 2", 2),
        ("M03", "Modulo 3", 3),
        ("M04", "Modulo 4", 2),
        ("M05", "Modulo 5", 2),
        ("M06", "Modulo 6", 2),
        ("M07", "Modulo 7", 2),
        ("M08", "PROYECTO A", 2),
        ("M09", "PROYECTO B", 2),
        ("M10", "Code reviewers", 1),
        ("M11", "Mock interviews", 1),
        ("M12", "Project coordinators*", 1),
    ),
    "ZCFA": (),
}

SYLLABUS_ROWS = {
    "ZIB": {
        "st1": ("M01", 1),
        "st2": ("M02", 3),
        "st3": ("M03", 8),
        "st4": ("M04", 18),
        "st5": ("M05", 31),
        "st6": ("M08", 72),
    },
    "ZSC": {
        "sc_st1": ("M01", 1),
        "sc_st2": ("M01", 2),
        "sc_st3": ("M01", 3),
        "sc_st4": ("M02", 4),
        "sc_st5": ("M02", 5),
        "sc_st6": ("M02", 6),
        "sc_st7": ("M03", 7),
        "sc_st8": ("M03", 8),
        "sc_st9": ("M03", 9),
        "sc_st10": ("M03", 10),
        "sc_st11": ("M03", 11),
        "sc_st12": ("M03", 12),
        "sc_st13": ("M03", 13),
        "sc_st14": ("M03", 14),
        "sc_st15": ("M04", 15),
        "sc_st16": ("M04", 16),
        "sc_st17": ("M04", 17),
        "sc_st18": ("M04", 18),
        "sc_st19": ("M04", 19),
        "sc_st20": ("M04", 20),
        "sc_st21": ("M04", 21),
        "sc_st22": ("M05", 22),
        "sc_st23": ("M05", 23),
        "sc_st24": ("M06", 24),
        "sc_st25": ("M06", 25),
    },
    "ZBL": {
        "bl_st1": ("M01", 1),
        "bl_st2": ("M01", 2),
        "bl_st3": ("M01", 3),
        "bl_st4": ("M02", 4),
        "bl_st5": ("M02", 5),
        "bl_st6": ("M02", 6),
        "bl_st7": ("M02", 7),
        "bl_st8": ("M02", 8),
        "bl_st9": ("M02", 9),
        "bl_st10": ("M02", 10),
        "bl_st11": ("M02", 11),
        "bl_st12": ("M02", 12),
        "bl_st13": ("M02", 13),
        "bl_st14": ("M02", 14),
        "bl_st15": ("M02", 15),
        "bl_st16": ("M02", 16),
        "bl_st17": ("M02", 17),
        "bl_st18": ("M02", 18),
        "bl_st19": ("M03", 19),
        "bl_st20": ("M03", 20),
        "bl_st21": ("M03", 21),
        "bl_st22": ("M03", 22),
        # The one row whose label is not the syllabus string, because the name gate
        # withholds the firm. Its place in the syllabus is not withheld.
        "bl_st23": ("M04", 23),
        "bl_st24": ("M04", 24),
        "bl_st25": ("M04", 25),
        "bl_st26": ("M05", 26),
        "bl_st27": ("M05", 27),
        "bl_st28": ("M05", 28),
    },
    "ZPE": {
        "pe_st1": ("M01", 1),
        "pe_st2": ("M01", 2),
        "pe_st3": ("M01", 3),
        "pe_st4": ("M01", 4),
        "pe_st5": ("M02", 7),
        "pe_st6": ("M03", 18),
    },
    "ZHR": {
        "hr_st1": ("M01", 1),
        "hr_st2": (None, 2),
        "hr_st3": ("M02", 4),
        "hr_st4": ("M03", 10),
        "hr_st5": ("M04", 18),
        "hr_st6": (None, 16),
    },
    "ZDS": {
        "ds_st1": ("M01", 1),
        "ds_st2": ("M02", 3),
        "ds_st3": ("M03", 5),
        "ds_st4": ("M04", 8),
        "ds_st5": ("M05", 10),
        "ds_st6": ("M06", 12),
    },
    "ZCFA": {
        "cfa_st1": (None, 1),
        "cfa_st2": (None, 3),
        "cfa_st3": (None, 4),
        "cfa_st4": (None, 6),
        "cfa_st5": (None, 7),
        "cfa_st6": (None, 9),
    },
}

# The selection rule that picked the six templates on each route is written out in the research
# spec and is not re-derived here; what matters to the model is that it is the same rule on all
# seven and that it reproduces the six Z-IB templates this toy already shipped.
PROGRAMMES = [
    {
        "key": "ZIB", "pfx": "", "code": "Z-IB", "name": "Investment Banking",
        "delivery": ("online, with two in person weekends", E),
        "title_provenance": WEBSITE,
        "templates": [
            ("st1", "Advanced Excel Course", "ZIB-T1", "async", "online", "300"),
            ("st2", "Cómo hacer un buen CV para IB", "ZIB-T2", "async", "online", "60"),
            ("st3", "Intro to economics & financial markets", "ZIB-T3", "async", "online", "60"),
            ("st4", "How to read financial statements", "ZIB-T4", "async", "online", "60"),
            ("st5", "Why we value companies?", "ZIB-T5", "async", "online", "60"),
            ("st6", "All about recruiting in Investment Banking", "ZIB-T6", "sync",
             "presencial", "120"),
        ],
        "instructors": [
            ("t1", "Nerea Iribarren", "co_emp", "1", None),
            ("t2", "Bruno Belaunde", "co_emp2", "1", None),
            ("t3", "Nuria Ondarreta", "co_emp3", "1", None),
            ("t4", "Rubén Arizmendi", ZRIVE, "2", "Z-IB, Z-PE, Z-SC"),
            ("t5", "Celia Vandellós", "co_emp5", "1", None),
            # Issue 43. The real ZIB-T0072 carries two teachers and the second of them is the one
            # external teacher in the whole corpus who also holds sessions on another programme.
            # Without this tile the shared external instructor is invisible on the route where
            # most of his sessions are, and the sharing the faculty sheet reports would be an
            # in-house story only.
            ("t7", "Iker Bidaurreta", None, "1", "Z-IB, Z-PE"),
        ],
        "sessions": [
            ("cs1", "Sesión 1, 12 ene", "st1", ("t4",), "2026-01-12 18:30", "delivered", "31"),
            ("cs2", "Sesión 2, 19 ene", "st2", ("t4",), "2026-01-19 18:30", "delivered", "29"),
            ("cs3", "Sesión 3, 26 ene", "st3", ("t1",), "2026-01-26 18:30", "delivered", "28"),
            ("cs4", "Sesión 4, 2 feb", "st4", ("t3",), "2026-02-02 18:30", "confirmed", "0"),
            ("cs5", "Sesión 5, 9 feb", "st5", ("t2",), "2026-02-09 18:30", "confirmed", "0"),
            ("cs6", "Sesión 6, 14 mar", "st6", ("t5", "t7"), "2026-03-14 10:00", "planned", "0"),
        ],
        "host": ("co_col", "Aretxa Capital"),
        "intake": "1Q26", "starts_on": "2026-01-12",
        "headcount": COHORT_HEADCOUNT, "roster": ROSTER,
        "enrolled_on": "2026-01-05", "due_on": "2026-02-01", "raised_on": "2026-03-01",
    },
    {
        "key": "ZSC", "pfx": "sc_", "code": "Z-SC", "name": "Strategy Consulting",
        "delivery": ("online, with two in person weekends", E),
        "title_provenance": SYLLABUS,
        # ISSUE 83. Twenty five rows and not six, which is the whole syllabus. Every label is
        # `name_norm` where the vault's two title fields diverge and `title_raw` where they do
        # not, which is issue 78's finding applied to the whole route rather than to the one row
        # that made it visible: `title_raw` is the published calendar string and carries a venue,
        # a clock, a leading space, a doubled space or an editorial "(NEW)" on six of these
        # twenty five, and every one of those is a property of a DELIVERY or of the spreadsheet.
        # sc_st23 is the row issue 78 found, and it is now one of six rather than a special case.
        #
        # DURATION IS READ OFF THE SOURCE AND ITS ABSENCE IS WRITTEN AS ONE. Twenty one of these
        # rows record ninety minutes and one records a hundred and twenty; the other three record
        # nothing, and they now say so. The six-row version invented a duration for sc_st1 and
        # for the presencial row, which at six rows was filler and at twenty five would have been
        # a column of made up numbers on a route where the source is explicit.
        "templates": [
            ("sc_st1", "Welcome to Zrive Strategy Consulting + Q&A SC", "ZSC-T1", "sync",
             "online", None),
            ("sc_st2", "Overview of the consulting industry", "ZSC-T2", "sync", "online", "90"),
            ("sc_st3", "Day-to-day of a junior consultant", "ZSC-T3", "sync", "online", "90"),
            ("sc_st4", "How to prepare for FIT interview questions", "ZSC-T4", "sync", "online",
             "90"),
            ("sc_st5", "How to prepare for the Interview Business Case (I)", "ZSC-T5", "sync",
             "online", "90"),
            ("sc_st6", "How to prepare for the Interview Business Case (II)", "ZSC-T6", "sync",
             "online", "90"),
            ("sc_st7", "Business Case - Group Practice (I) - Profitability", "ZSC-T7", "sync",
             "online", "90"),
            ("sc_st8", "Business Case - Group Practice (II) - Market Sizing", "ZSC-T8", "sync",
             "online", "90"),
            ("sc_st9", "Business Case (III) - Finance/ Comercial Due Diligence", "ZSC-T9", "sync",
             "online", "90"),
            ("sc_st10", "Business Case - Group Practice (III) - Comercial Due Diligence",
             "ZSC-T10", "sync", "online", "90"),
            ("sc_st11", "Business Case - Group Practice (IV) - Business Transformations",
             "ZSC-T11", "sync", "online", "90"),
            ("sc_st12", "Business Case - Group Practice (V) - M&A", "ZSC-T12", "sync", "online",
             "90"),
            ("sc_st13", "Business Case - Group Practice (VI) - New market entry", "ZSC-T13",
             "sync", "online", "90"),
            ("sc_st14", "Business Case - Group Practice (VII) - Private Equity / Due Diligence",
             "ZSC-T14", "sync", "online", "90"),
            ("sc_st15", "Real Projects: TMT", "ZSC-T15", "sync", "online", "90"),
            ("sc_st16", "Storylining - What it is and why it matters & Case Studies", "ZSC-T16",
             "sync", "online", "90"),
            ("sc_st17", "Real projects: Consumo. Implementar Plan Estratégico", "ZSC-T17", "sync",
             "online", "90"),
            ("sc_st18", "Storylining II - What it is and why it matters & Case Studies",
             "ZSC-T18", "sync", "online", "90"),
            ("sc_st19", "Real projects: Retail", "ZSC-T19", "sync", "online", "90"),
            ("sc_st20", "Real Projects: pricing", "ZSC-T20", "sync", "online", "90"),
            ("sc_st21", "Career path & exit opportunities in strategy consulting", "ZSC-T21",
             "sync", "online", "90"),
            ("sc_st22", "Visita BCG", "ZSC-T22", "sync", "presencial", None),
            # ISSUE 78, and the finding is about the source and not only about this row. This
            # template used to be labelled with the syllabus string verbatim, leading space and
            # all: a venue, ATTICO, then a start time, then the subject. A venue and a start time
            # are properties of a DELIVERY. A template has neither. So the node sat on the
            # template side of the split carrying the evidence that it is an instance, and that
            # split is the sharpest claim this drawing makes: issue 19 exists because it was
            # asserted rather than shown, and the answer was to draw both sides and join them
            # with `instance of`. A template that is really an instance breaks the one
            # distinction the artefact exists to demonstrate, in the place a reader checks it.
            #
            # THE SOURCE CONFLATES THE TWO, and the vault says so in its own frontmatter rather
            # than by inference. The syllabus note ZSC-T0023 carries two title fields: `title_raw`,
            # which is the published row with the venue and the clock on it, and `name_norm`,
            # which is the subject on its own. On nineteen of the twenty five ZSC rows the two
            # fields hold the same string; on six of them they diverge, and this is the one where
            # the divergence is a venue and a clock. So the normalisation the source itself
            # performs is the fix, and the label below is `name_norm` verbatim.
            #
            # WHERE THE VENUE AND THE TIME WENT. The time is on the delivery already: sc_cs23 is
            # `instance of` this template and carries scheduled_at. It reads 10:00 and not 10.15,
            # because every date and clock on a cohort session in this toy is invented and lining
            # one of them up with a real syllabus row would make a half real datum out of an
            # invented delivery. The venue has nowhere to go: no CohortSession on any of the
            # seven routes has a venue field, so the only trace of ATTICO that survives is
            # location_mode `presencial` on this template, which is the template-level truth the
            # venue implied. Adding a venue to one invented delivery would be a fact made up to
            # tidy the picture.
            ("sc_st23", "All you need to know about recruiting in Strategy Consulting", "ZSC-T23",
             "sync", "presencial", None),
            ("sc_st24", "Visita Consultora (TBC)", "ZSC-T24", "sync", "presencial", None),
            ("sc_st25", "Mock interviews", "ZSC-T25", "sync", "presencial", "120"),
        ],
        "instructors": [
            ("t4", "Rubén Arizmendi", ZRIVE, "3", "Z-IB, Z-PE, Z-SC"),
            ("t6", "Ainhoa Muruzabal", ZRIVE, "4", "Z-SC, Z-HR"),
            ("t8", "Nagore Elordieta", "co_emp3", "3", None),
            ("t9", "Telmo Garaikoetxea", None, "3", None),
            ("t10", "Saioa Erkoreka", "co_emp", "3", None),
            ("t11", "Ander Legarralde", "co_fide", "4", None),
            ("t12", "Miren Aitzgorri", "co_emp", "5", None),
        ],
        # One delivery per template, weekly on a Tuesday for the twenty one online rows and then
        # two presencial weekends, which is the shape the six-row version already drew. Every
        # date, clock, state and attendance figure here is invented. Each instructor holds a
        # CONTIGUOUS run of sessions rather than a scattered set: the layout orders a column by
        # the barycentre of its neighbours, so a contiguous run puts the instructor beside the
        # middle of its own block and its edges fan out short, where a scattered set would drag
        # one tile up and down a column that is now twenty five tiles tall.
        "sessions": [
            ("sc_cs1", "Sesión 1, 13 ene", "sc_st1", ("t4", "t6"), "2026-01-13 18:30",
             "delivered", "22"),
            ("sc_cs2", "Sesión 2, 20 ene", "sc_st2", ("t4",), "2026-01-20 18:30", "delivered",
             "21"),
            ("sc_cs3", "Sesión 3, 27 ene", "sc_st3", ("t4",), "2026-01-27 18:30", "delivered",
             "20"),
            ("sc_cs4", "Sesión 4, 3 feb", "sc_st4", ("t6",), "2026-02-03 18:30", "confirmed", "0"),
            ("sc_cs5", "Sesión 5, 10 feb", "sc_st5", ("t6",), "2026-02-10 18:30", "confirmed",
             "0"),
            ("sc_cs6", "Sesión 6, 17 feb", "sc_st6", ("t6",), "2026-02-17 18:30", "planned", "0"),
            ("sc_cs7", "Sesión 7, 24 feb", "sc_st7", ("t8",), "2026-02-24 18:30", "planned", "0"),
            ("sc_cs8", "Sesión 8, 3 mar", "sc_st8", ("t8",), "2026-03-03 18:30", "planned", "0"),
            ("sc_cs9", "Sesión 9, 10 mar", "sc_st9", ("t8",), "2026-03-10 18:30", "planned", "0"),
            ("sc_cs10", "Sesión 10, 17 mar", "sc_st10", ("t9",), "2026-03-17 18:30", "planned",
             "0"),
            ("sc_cs11", "Sesión 11, 24 mar", "sc_st11", ("t9",), "2026-03-24 18:30", "planned",
             "0"),
            ("sc_cs12", "Sesión 12, 31 mar", "sc_st12", ("t9",), "2026-03-31 18:30", "planned",
             "0"),
            ("sc_cs13", "Sesión 13, 7 abr", "sc_st13", ("t10",), "2026-04-07 18:30", "planned",
             "0"),
            ("sc_cs14", "Sesión 14, 14 abr", "sc_st14", ("t10",), "2026-04-14 18:30", "planned",
             "0"),
            ("sc_cs15", "Sesión 15, 21 abr", "sc_st15", ("t10",), "2026-04-21 18:30", "planned",
             "0"),
            ("sc_cs16", "Sesión 16, 28 abr", "sc_st16", ("t11",), "2026-04-28 18:30", "planned",
             "0"),
            ("sc_cs17", "Sesión 17, 5 may", "sc_st17", ("t11",), "2026-05-05 18:30", "planned",
             "0"),
            ("sc_cs18", "Sesión 18, 12 may", "sc_st18", ("t11",), "2026-05-12 18:30", "planned",
             "0"),
            ("sc_cs19", "Sesión 19, 19 may", "sc_st19", ("t11",), "2026-05-19 18:30", "planned",
             "0"),
            ("sc_cs20", "Sesión 20, 26 may", "sc_st20", ("t12",), "2026-05-26 18:30", "planned",
             "0"),
            ("sc_cs21", "Sesión 21, 2 jun", "sc_st21", ("t12",), "2026-06-02 18:30", "planned",
             "0"),
            ("sc_cs22", "Sesión 22, 13 jun", "sc_st22", ("t12",), "2026-06-13 10:00", "planned",
             "0"),
            ("sc_cs23", "Sesión 23, 14 jun", "sc_st23", ("t12",), "2026-06-14 10:00", "planned",
             "0"),
            # Nobody assigned, and it is the one on the route whose template is `Visita
            # Consultora (TBC)`. A session with no teacher is a real and common shape and the
            # toy has carried it only on Z-CFA, where no instructor exists at all; here it sits
            # beside twenty four sessions that do have one, which is where the shape reads.
            ("sc_cs24", "Sesión 24, 20 jun", "sc_st24", (), "2026-06-20 10:00", "planned", "0"),
            ("sc_cs25", "Sesión 25, 21 jun", "sc_st25", ("t12",), "2026-06-21 10:00", "planned",
             "0"),
        ],
        "host": ("sc_co_col", "Belagua Advisory"),
        "intake": "1Q26", "starts_on": "2026-01-13",
        "headcount": 27, "roster_offset": 5,
        "enrolled_on": "2026-01-06", "due_on": "2026-02-02", "raised_on": "2026-03-02",
    },
    {
        "key": "ZBL", "pfx": "bl_", "code": "Z-BL", "name": "Big Law",
        "delivery": ("online, with two in person weekends", E),
        "title_provenance": SYLLABUS,
        # ISSUE 83. Twenty eight rows and not six, which is the whole syllabus.
        #
        # NOT ONE OF THE TWENTY EIGHT REAL ROWS CARRIES A DURATION, so not one of these does
        # either. The six-row version invented four different ones. At six rows that was filler
        # in a column nobody would total; at twenty eight it would be twenty eight made up
        # numbers standing where the source is uniformly silent, which is the value made up to
        # fill a tile that the provenance seam exists to prevent. The absence is now written as
        # an absence, once per row.
        #
        # THE LABELS ARE `name_norm` WHERE THE VAULT'S TWO TITLE FIELDS DIVERGE, which is issue
        # 78's finding applied to a whole route. Seventeen of these rows carry a `title_raw`
        # that is a calendar string rather than a subject: sixteen of them are prefixed "Áreas
        # de Práctica →", which is the module heading and not the session, and one carries a
        # "Presentación //" that belongs to the first delivery and not to the template.
        "templates": [
            ("bl_st1", "¿Qué salidas profesionales existen en el mundo del Derecho?", "ZBL-T1",
             "sync", "online", None),
            ("bl_st2", "¿Como preparar procesos de selección?", "ZBL-T2", "sync", "online", None),
            ("bl_st3", "Másteres & becas", "ZBL-T3", "sync", "online", None),
            ("bl_st4", "Corporate and M&A I", "ZBL-T4", "sync", "online", None),
            ("bl_st5", "Corporate and M&A II", "ZBL-T5", "sync", "online", None),
            ("bl_st6", "Restructuring I", "ZBL-T6", "sync", "online", None),
            ("bl_st7", "Restructuring II", "ZBL-T7", "sync", "online", None),
            ("bl_st8", "Litigation I", "ZBL-T8", "sync", "online", None),
            ("bl_st9", "Litigation II", "ZBL-T9", "sync", "online", None),
            ("bl_st10", "Capital Markets, Banking & Finance I", "ZBL-T10", "sync", "online", None),
            ("bl_st11", "Capital Markets, Banking & Finance II", "ZBL-T11", "sync", "online",
             None),
            ("bl_st12", "Tax I", "ZBL-T12", "sync", "online", None),
            ("bl_st13", "Tax II", "ZBL-T13", "sync", "online", None),
            ("bl_st14", "Público", "ZBL-T14", "sync", "online", None),
            ("bl_st15", "Startups", "ZBL-T15", "sync", "online", None),
            ("bl_st16", "IP & Nuevas tecnologías", "ZBL-T16", "sync", "online", None),
            ("bl_st17", "Derecho Laboral", "ZBL-T17", "sync", "online", None),
            ("bl_st18", "Real Estate", "ZBL-T18", "sync", "online", None),
            ("bl_st19", "Oratoria I", "ZBL-T19", "sync", "online", None),
            ("bl_st20", "Oratoria II", "ZBL-T20", "sync", "online", None),
            ("bl_st21", "Deep Dive: Contratos", "ZBL-T21", "sync", "online", None),
            ("bl_st22", "Deep Dive: Due Diligence", "ZBL-T22", "sync", "online", None),
            # THE FIRM IS WITHHELD AND IT IS NOT SWAPPED. The name gate refuses the real row's
            # string and is right to. Two fixes were available and only one of them invents
            # nothing. Substituting another real firm, which is what t17's employer row below
            # does, would have put a visit this programme did not make on a named third party;
            # withholding says exactly what is known, that the visit is to a law firm.
            #
            # The tile no longer says why the name is withheld, and must not be made to again.
            # The reason is a description of the withheld string, so publishing it narrows the
            # candidates for that string; see WITHHELD_FIRM above.
            ("bl_st23", "Visita a despacho", "ZBL-T23", "sync", "presencial", None, WITHHELD_FIRM),
            ("bl_st24", "Visita a Uría", "ZBL-T24", "sync", "presencial", None),
            ("bl_st25", "Recruiting Superday", "ZBL-T25", "sync", "presencial", None),
            ("bl_st26", "Despacho 1", "ZBL-T26", "sync", "presencial", None),
            ("bl_st27", "Despacho 2", "ZBL-T27", "sync", "presencial", None),
            ("bl_st28", "Oratoria III", "ZBL-T28", "sync", "presencial", None),
        ],
        # SUBSTITUTION, RECORDED. The real employer behind the two sessions t17 holds is a firm
        # whose first token is also a real teacher's surname, so the name gate refuses it and is
        # right to. t17 is given another real Z-BL employer from the same register instead.
        # Changing the name is the fix; weakening the gate is not.
        "instructors": [
            ("t13", "Endika Zumeltzu", None, "5", None),
            ("t14", "Oihana Belastegui", "co_emp5", "6", None),
            ("t15", "Lide Arriotua", "co_emp5", "6", None),
            ("t16", "Peru Zubizarreta", "co_latham", "6", None),
            ("t17", "Estibaliz Onaindia", "co_baker", "6", None),
        ],
        # One delivery per template, weekly on a Wednesday for the twenty two online rows and
        # then three presencial weekends for the six that are not. Every date, clock, state and
        # attendance figure is invented, and each instructor holds a contiguous run of sessions
        # for the barycentre reason written on the Z-SC list above.
        "sessions": [
            ("bl_cs1", "Sesión 1, 14 ene", "bl_st1", ("t13",), "2026-01-14 18:30", "delivered",
             "19"),
            ("bl_cs2", "Sesión 2, 21 ene", "bl_st2", ("t13",), "2026-01-21 18:30", "delivered",
             "18"),
            ("bl_cs3", "Sesión 3, 28 ene", "bl_st3", ("t13",), "2026-01-28 18:30", "delivered",
             "18"),
            ("bl_cs4", "Sesión 4, 4 feb", "bl_st4", ("t13",), "2026-02-04 18:30", "confirmed",
             "0"),
            ("bl_cs5", "Sesión 5, 11 feb", "bl_st5", ("t13",), "2026-02-11 18:30", "confirmed",
             "0"),
            ("bl_cs6", "Sesión 6, 18 feb", "bl_st6", ("t14",), "2026-02-18 18:30", "planned",
             "0"),
            ("bl_cs7", "Sesión 7, 25 feb", "bl_st7", ("t14",), "2026-02-25 18:30", "planned",
             "0"),
            ("bl_cs8", "Sesión 8, 4 mar", "bl_st8", ("t14",), "2026-03-04 18:30", "planned", "0"),
            ("bl_cs9", "Sesión 9, 11 mar", "bl_st9", ("t14",), "2026-03-11 18:30", "planned",
             "0"),
            ("bl_cs10", "Sesión 10, 18 mar", "bl_st10", ("t14",), "2026-03-18 18:30", "planned",
             "0"),
            ("bl_cs11", "Sesión 11, 25 mar", "bl_st11", ("t14",), "2026-03-25 18:30", "planned",
             "0"),
            ("bl_cs12", "Sesión 12, 1 abr", "bl_st12", ("t15",), "2026-04-01 18:30", "planned",
             "0"),
            ("bl_cs13", "Sesión 13, 8 abr", "bl_st13", ("t15",), "2026-04-08 18:30", "planned",
             "0"),
            ("bl_cs14", "Sesión 14, 15 abr", "bl_st14", ("t15",), "2026-04-15 18:30", "planned",
             "0"),
            ("bl_cs15", "Sesión 15, 22 abr", "bl_st15", ("t15",), "2026-04-22 18:30", "planned",
             "0"),
            ("bl_cs16", "Sesión 16, 29 abr", "bl_st16", ("t15",), "2026-04-29 18:30", "planned",
             "0"),
            ("bl_cs17", "Sesión 17, 6 may", "bl_st17", ("t15",), "2026-05-06 18:30", "planned",
             "0"),
            ("bl_cs18", "Sesión 18, 13 may", "bl_st18", ("t16",), "2026-05-13 18:30", "planned",
             "0"),
            ("bl_cs19", "Sesión 19, 20 may", "bl_st19", ("t16",), "2026-05-20 18:30", "planned",
             "0"),
            ("bl_cs20", "Sesión 20, 27 may", "bl_st20", ("t16",), "2026-05-27 18:30", "planned",
             "0"),
            ("bl_cs21", "Sesión 21, 3 jun", "bl_st21", ("t16",), "2026-06-03 18:30", "planned",
             "0"),
            ("bl_cs22", "Sesión 22, 10 jun", "bl_st22", ("t16",), "2026-06-10 18:30", "planned",
             "0"),
            ("bl_cs23", "Sesión 23, 13 jun", "bl_st23", ("t17",), "2026-06-13 10:00", "planned",
             "0"),
            ("bl_cs24", "Sesión 24, 14 jun", "bl_st24", ("t17",), "2026-06-14 10:00", "planned",
             "0"),
            # Two teachers on one delivery, which the six-row version carried and which is a
            # shape the model has to keep: `teaches` is many to many and a route on which every
            # session has exactly one teacher would not show it.
            ("bl_cs25", "Sesión 25, 20 jun", "bl_st25", ("t17", "t16"), "2026-06-20 10:00",
             "planned", "0"),
            ("bl_cs26", "Sesión 26, 21 jun", "bl_st26", ("t17",), "2026-06-21 10:00", "planned",
             "0"),
            ("bl_cs27", "Sesión 27, 27 jun", "bl_st27", ("t17",), "2026-06-27 10:00", "planned",
             "0"),
            ("bl_cs28", "Sesión 28, 28 jun", "bl_st28", ("t17",), "2026-06-28 10:00", "planned",
             "0"),
        ],
        "host": ("bl_co_col", "Ordunte Abogados"),
        "intake": "1Q26", "starts_on": "2026-01-14",
        "headcount": 21, "roster_offset": 11,
        "enrolled_on": "2026-01-07", "due_on": "2026-02-03", "raised_on": "2026-03-03",
    },
    {
        "key": "ZPE", "pfx": "pe_", "code": "Z-PE", "name": "Private Equity",
        "delivery": ("online, with two in person weekends", E),
        "title_provenance": SYLLABUS,
        # pe_st6's location is an absence and not an invention: twenty five of Z-PE's thirty six
        # real rows record no location mode at all, and this is the toy's one instance of it.
        "templates": [
            ("pe_st1", "Welcome to Z-PE & Intro to Corporate Private Equity", "ZPE-T1", "sync",
             "online", "90"),
            ("pe_st2", "LBOs - value levers & returns calculation", "ZPE-T2", "sync",
             "online", "90"),
            ("pe_st3", "Intro to Alternative Investments", "ZPE-T3", "sync", "presencial", "90"),
            ("pe_st4", "The investment process in corporate private equity (I)", "ZPE-T4",
             "sync", "presencial", "90"),
            ("pe_st5", "The IC Memo & Take Home Case Study Presentation", "ZPE-T5", "sync",
             "online", "90"),
            ("pe_st6", "Infrastructure Private Equity Fundamentals", "ZPE-T6", "sync",
             None, "90"),
        ],
        # SUBSTITUTION, RECORDED, and for the reason the name gate cannot see. The real employer
        # behind t19 clears the gate and supplies exactly one teacher in the register, so pairing
        # an invented instructor with it would let a reader resolve the pair by uniqueness. t19
        # is given a real Z-PE employer with four sessions in the register instead. t7's real
        # employer is a second one-to-one pairing and is dropped entirely: t7 carries no employer
        # node, which is also the toy's instance of the seventeen real teachers who carry none.
        "instructors": [
            ("t4", "Rubén Arizmendi", ZRIVE, "3", "Z-IB, Z-PE, Z-SC"),
            ("t7", "Iker Bidaurreta", None, "1", "Z-IB, Z-PE"),
            ("t18", "Xanti Urkullu", "co_cinven", "1", None),
            ("t19", "Garazi Etxeberri", "co_nazca", "1", None),
        ],
        "sessions": [
            ("pe_cs1", "Sesión 1, 15 ene", "pe_st1", ("t4",), "2026-01-15 18:30",
             "delivered", "17"),
            ("pe_cs2", "Sesión 2, 22 ene", "pe_st2", ("t18",), "2026-01-22 18:30",
             "delivered", "16"),
            ("pe_cs3", "Sesión 3, 29 ene", "pe_st3", ("t4",), "2026-01-29 18:30",
             "delivered", "16"),
            ("pe_cs4", "Sesión 4, 5 feb", "pe_st4", ("t7",), "2026-02-05 18:30",
             "confirmed", "0"),
            ("pe_cs5", "Sesión 5, 12 feb", "pe_st5", ("t4",), "2026-02-12 18:30",
             "confirmed", "0"),
            ("pe_cs6", "Sesión 6, 19 feb", "pe_st6", ("t19",), "2026-02-19 18:30",
             "planned", "0"),
        ],
        "host": ("pe_co_col", "Larragoiti Partners"),
        "intake": "1Q26", "starts_on": "2026-01-15",
        "headcount": 18, "roster_offset": 17,
        "enrolled_on": "2026-01-08", "due_on": "2026-02-04", "raised_on": "2026-03-04",
    },
    {
        "key": "ZHR", "pfx": "hr_", "code": "Z-HR", "name": "Human Resources",
        "delivery": ("online, with one in person weekend", E),
        "title_provenance": SYLLABUS,
        # EVERY Z-HR TEMPLATE CARRIES AN ABSENT DELIVERY MODE, and it is the true answer rather
        # than a gap. All twenty five real rows read `delivery_mode: unknown` and the vault
        # records that the Z-HR schema offers no other option, so writing "sync" here would be
        # the toy asserting something its source cannot support.
        "templates": [
            ("hr_st1", "Sesión inaugural & presentaciones", "ZHR-T1", None, "online", "90"),
            ("hr_st2", "De RRHH a People: un nuevo departamento estratégico", "ZHR-T2", None,
             "online", "90"),
            ("hr_st3", "Estrategias de atracción de talento: Employer Branding y PVE", "ZHR-T3",
             None, "online", "90"),
            ("hr_st4", "Potenciando el talento: formación y desarrollo profesional", "ZHR-T4",
             None, "online", "90"),
            # The double space is verbatim and deliberate in the syllabus, like the leading space
            # on the Z-SC title above.
            ("hr_st5", "People Analytics  I", "ZHR-T5", None, "online", "90"),
            ("hr_st6", "Human Resources Agile", "ZHR-T6", None, "presencial", "120"),
        ],
        "instructors": [
            ("t6", "Ainhoa Muruzabal", ZRIVE, "1", "Z-SC, Z-HR"),
            ("t20", "Unax Sarralde", "co_seedtag", "1", None),
            ("t21", "Maddi Larrabeiti", "co_cabify", "1", None),
            ("t22", "Irati Zeberio", "co_stemdo", "1", None),
            ("t23", "Aratz Mendiluze", "co_kaleidos", "1", None),
            ("t24", "Nahia Goikoetxea", None, "1", None),
        ],
        # hr_cs5 has no teacher, which is the first unfilled teacher slot the toy has ever drawn.
        # Five of Z-HR's twenty five real rows are like it, and a hundred of the corpus's two
        # hundred and sixty.
        "sessions": [
            ("hr_cs1", "Sesión 1, 16 ene", "hr_st1", ("t6", "t24"), "2026-01-16 18:30",
             "delivered", "20"),
            ("hr_cs2", "Sesión 2, 23 ene", "hr_st2", ("t22",), "2026-01-23 18:30",
             "delivered", "19"),
            ("hr_cs3", "Sesión 3, 30 ene", "hr_st3", ("t20",), "2026-01-30 18:30",
             "delivered", "19"),
            ("hr_cs4", "Sesión 4, 6 feb", "hr_st4", ("t21",), "2026-02-06 18:30",
             "confirmed", "0"),
            ("hr_cs5", "Sesión 5, 13 feb", "hr_st5", (), "2026-02-13 18:30", "confirmed", "0"),
            ("hr_cs6", "Sesión 6, 28 mar", "hr_st6", ("t23",), "2026-03-28 10:00",
             "planned", "0"),
        ],
        "host": ("hr_co_col", "Zelaieta People"),
        "intake": "1Q26", "starts_on": "2026-01-16",
        "headcount": 24, "roster_offset": 23,
        "enrolled_on": "2026-01-09", "due_on": "2026-02-05", "raised_on": "2026-03-05",
    },
    {
        "key": "ZDS", "pfx": "ds_", "code": "Z-DS", "name": "Applied Data Science",
        "delivery": ("online, no in person weekend", E),
        "title_provenance": SYLLABUS,
        # location_mode is an absence on all six: `unknown` on all twenty two real rows.
        # delivery_mode is carried as `sync`, flagged dummy, and the dispute is in the note
        # rather than in the flag, because the vault records the contradiction as unresolved and
        # writing an absence here would be the toy taking a side in it.
        "templates": [
            ("ds_st1", "1. Introducción al programa", "ZDS-T1", "sync", None, "90"),
            ("ds_st2", "2. Exploratory Data Analysis", "ZDS-T2", "sync", None, "90"),
            ("ds_st3", "3. Fundamentals of Statistical Learning (1)", "ZDS-T3", "sync",
             None, "90"),
            ("ds_st4", "4. Model fitting", "ZDS-T4", "sync", None, "90"),
            ("ds_st5", "5. Analyse, diagnose and improve a model", "ZDS-T5", "sync", None, "90"),
            ("ds_st6", "6. Business translation", "ZDS-T6", "sync", None, "90"),
        ],
        # #128 kept the contradiction and its status and cut the sentence defending the choice
        # made about it.
        "template_note": (
            "The source for this programme records no format field, yet every one of its session "
            "notes carries a delivery mode of sync. The vault flags that contradiction as "
            "unresolved."),
        "instructors": [
            ("t25", "Amets Landaburu", "co_openbank", "1", None),
            ("t26", "Ekhi Zabalondo", "co_meta", "1", None),
            ("t27", "Haizea Olabeaga", "co_meta", "1", None),
        ],
        # Three of six with nobody assigned. Sixteen of Z-DS's twenty two real rows have none, so
        # three of six understates it and is still the strongest teacher-absence signal drawn.
        "sessions": [
            ("ds_cs1", "Sesión 1, 11 feb", "ds_st1", ("t25",), "2026-02-11 18:30",
             "delivered", "15"),
            ("ds_cs2", "Sesión 2, 18 feb", "ds_st2", (), "2026-02-18 18:30", "delivered", "14"),
            ("ds_cs3", "Sesión 3, 25 feb", "ds_st3", (), "2026-02-25 18:30", "delivered", "14"),
            ("ds_cs4", "Sesión 4, 4 mar", "ds_st4", (), "2026-03-04 18:30", "confirmed", "0"),
            ("ds_cs5", "Sesión 5, 11 mar", "ds_st5", ("t26",), "2026-03-11 18:30",
             "confirmed", "0"),
            ("ds_cs6", "Sesión 6, 18 mar", "ds_st6", ("t27",), "2026-03-18 18:30",
             "planned", "0"),
        ],
        "host": ("ds_co_col", "Aixerrota Data"),
        "intake": "1Q26", "starts_on": "2026-02-11",
        "headcount": 16, "roster_offset": 29,
        "enrolled_on": "2026-02-04", "due_on": "2026-03-04", "raised_on": "2026-04-01",
    },
    {
        "key": "ZCFA", "pfx": "cfa_", "code": "Z-CFA", "name": "CFA preparation",
        "delivery": ("asynchronous, with a fortnightly live catch up", E),
        # The titles are verbatim and they are not session titles. Saying so in the provenance
        # row is the whole reason this route is worth drawing.
        "title_provenance": ("real, verbatim from the reading plan. The row names curriculum "
                             "readings and not a session", E),
        # #128 cut the last sentence, which told the reader how to take the empty lane in front
        # of them. The three absent fields before it are the finding.
        "prog_note": (
            "The source for this programme is a reading plan and not a session calendar. It has "
            "no instructor field, no module field and no format field, so three of the lanes on "
            "this page cannot be filled from it."),
        "templates": [
            ("cfa_st1", "19, 20 & 21", "ZCFA-T1", "async", None, None),
            ("cfa_st2", "22, 23 & 24", "ZCFA-T2", "async", None, None),
            ("cfa_st3", "25, 26 & 27", "ZCFA-T3", "async", None, None),
            ("cfa_st4", "28, 29 & 30", "ZCFA-T4", "async", None, None),
            ("cfa_st5", "31 & 32", "ZCFA-T5", "async", None, None),
            ("cfa_st6", "33, 34 & 35", "ZCFA-T6", "async", None, None),
        ],
        # NO INSTRUCTORS, NO EMPLOYERS AND NO VISIT HOST, and none of the three may be invented
        # to fill a lane. Z-CFA has no instructor property anywhere in its source, zero presencial
        # sessions and no collaborating firm, so a tile in any of those lanes would be the toy
        # asserting a relationship the corpus positively denies.
        "instructors": [],
        "sessions": [
            ("cfa_cs1", "Sesión 1, 19 ene", "cfa_st1", (), "2026-01-19 18:30", "delivered", "24"),
            ("cfa_cs2", "Sesión 2, 2 feb", "cfa_st2", (), "2026-02-02 18:30", "delivered", "23"),
            ("cfa_cs3", "Sesión 3, 16 feb", "cfa_st3", (), "2026-02-16 18:30", "delivered", "22"),
            ("cfa_cs4", "Sesión 4, 2 mar", "cfa_st4", (), "2026-03-02 18:30", "confirmed", "0"),
            ("cfa_cs5", "Sesión 5, 16 mar", "cfa_st5", (), "2026-03-16 18:30", "confirmed", "0"),
            ("cfa_cs6", "Sesión 6, 30 mar", "cfa_st6", (), "2026-03-30 18:30", "planned", "0"),
        ],
        "host": None,
        "intake": "1Q26", "starts_on": "2026-01-19",
        "headcount": 30, "roster_offset": 3,
        "enrolled_on": "2026-01-12", "due_on": "2026-02-09", "raised_on": "2026-03-09",
    },
]


# ---- ghosts: classes the model needs and no system holds --------------------
# Everything a programme block draws is an object that exists. Everything below is one that does
# not, drawn on the same page because the absences are the part of the shape that a reader cannot
# infer from what is present. A ghost is a class, not an instance: it has no identifier, no date
# and no amount, and its note says what the absence costs structurally and nothing more.
#
# The ghosts are all in the enrolment to claim band, and that is not a coincidence. It is the
# band where money is promised, collected and chased, and it is the band with the fewest
# classes. Two candidates were left out rather than drawn: an Attendance class, which would
# have to hang off the cohort sessions, the tallest column, and would make the drawing taller
# for every reader; and a Placement date or an income share schedule, which is detail below
# the level of this page.
#
# A THIRD CANDIDATE WAS CONSIDERED AND LEFT OUT UNDER ISSUE 63, and the reason is recorded here
# because the card asked for a judgement rather than for an implementation. Repointing 'hosts
# visit' at the Programme leaves a real absence behind it: no system anywhere relates a COHORT to
# a visit, and the people who attend one are a cohort. It is not drawn as a fifth ghost, on two
# grounds. Every ghost here is a CLASS the model needs and nothing holds; what is missing in the
# visit case is a RELATION between two classes that both exist and are both already on the page,
# so a fifth ghost would be the first one that is not a class and would blur the vocabulary the
# other four rely on. And it is the same shape as the Attendance class the paragraph above
# already declined, for the same reason.
#
# ISSUE 75 OVERTURNED THE FIRST HALF OF THAT AND KEPT THE SECOND. Repointing 'hosts visit' at the
# Programme was the error, and the error was one of method: the evidence was about WHERE the
# relation is recorded, thirteen company notes filing a visit under a programme note, and it was
# used to decide WHAT the relation IS. A firm hosting a visit hosts it for the people who turn up,
# and the people who turn up are a cohort. So the solid edge terminates on the Cohort.
#
# AND THE OWNER THEN SETTLED THE REST OF #75 THE OTHER WAY: THE COHORT EDGE ONLY. #75 had also
# given the Programme the same verb as a declared GHOST edge, on the argument that the visit is
# FOR a programme, that this is a real relation, and that no system writes it down. Every word of
# that argument still holds. What the owner rejected is the drawing, not the claim: two lines
# under one verb from one tile is a reader's question before it is an insight, and the absence it
# marked is already stated in prose on the host's own note and in its `cohort_that_attended` row.
# So there is one line from the firm, and this file no longer draws a fifth ghost of any kind.
#
# WHAT THAT LEAVES BEHIND IS A MECHANISM WITH NOTHING USING IT, said plainly here rather than
# quietly removed. #75 made a ghost DECLARABLE as a fourth element on an edge tuple, unpacked in
# edge_parts() alone so that no reader of an edge can drop it in silence. Derivation from a ghost
# node at an end still runs and still covers the four ghost nodes; declaration now covers nothing,
# because the one edge that declared it is gone. It is a real capability and distinct from
# derivation, so whether the model keeps a mechanism no edge exercises is the owner's call and not
# a tidy-up. See the edges block in instance_document(), which still reads both.
GHOST_TYPE = ("Ghost", "does not exist in any system", "#8f99a8", "ghost")


def g(gid, label, verb, target, note):
    return {
        "id": gid, "type": "Ghost", "label": label, "ghost": True, "note": note,
        "props": [
            p("class_exists", "no", A),
            p("would_attach_to", target, A),
            p("verb_it_would_carry", verb, A),
        ],
    }


# (id suffix, label, verb, the class it would attach to, the id it attaches to, what the
# absence costs). No column: a ghost is drawn beside the class it would attach to, which
# build/build_layout.py derives from that attachment rather than being told.
# #128 shortened the first two. Each stated its absence and then argued from it to the same
# absence again; the four now read at one length and every absence they carry is still named.
GHOST_SPEC = [
    ("g_inst", "Instalment", "expected by", "Agreement", "agree",
     "The schedule of payments an agreement expects is not written down as rows. A payment "
     "that fails leaves no row at all, so nothing can be queried for what did not arrive."),
    ("g_place", "Placement", "matures", "Claim", "claim",
     "A graduate taking a job offer is not recorded anywhere, so nothing can make a claim on "
     "future income mature and which claims are collectible today has no answer."),
    ("g_beca", "Beca", "discounts", "Agreement", "agree",
     "A scholarship has no class of its own. A student who owes nothing and a student who "
     "owes and has not paid are the same row."),
    ("g_ref", "Refund", "reverses", "Charge", "charge",
     "Money returned to a payer has nowhere to be recorded. A charge that was reversed reads "
     "exactly as it did before."),
]

TYPES = TYPES + [GHOST_TYPE]

# The per-node class bindings are written once, for the unprefixed ids, and then repeated for
# every route's own copy. A generated id that bound to nothing would stop the build at the loop
# at the foot of this file, which is the behaviour that is wanted; repeating them here is what
# keeps a visit host on Z-HR the same CLASS as the one on Z-IB.
#
# THIS LOOP IS THE ARGUMENT FOR PER CLASS, MADE MECHANICALLY. Before issue 72 it copied four
# strings and a system name to thirty five ids; a route is a fact about the class and the seven
# copies of a visit host are seven objects of one class, so the copying was the model saying so
# in the only way the old shape allowed. It now copies one word, which is a binding and not a
# route, and there is nothing left in it that could come out different on one prefix.
for _spec in PROGRAMMES:
    _pfx = _spec["pfx"]
    if not _pfx:
        continue
    for _base in ("co_col",) + tuple(gs[0] for gs in GHOST_SPEC):
        CLASS_OF_ID[_pfx + _base] = CLASS_OF_ID[_base]


# ---- the three builders -----------------------------------------------------
def company_node(cid, supplied):
    """An employer of instructors, drawn in column 0 with one 'employed by' edge per instructor.

    The operator of the programme is one of them and is drawn exactly like the other fifteen:
    same type, same verb, and the difference carried in the data rather than in the geometry.
    Keying the reveal rule on the verb instead of on the type is what lets a Company that hosts
    a visit and employs nobody stay on the page while these are hidden.
    """
    if cid == ZRIVE:
        return {
            "id": cid, "type": "Company", "label": COMPANIES[cid],
            # #128 cut the clause defending the drawing choice. What is left is the fact about
            # the company and the fact about the field it changes.
            "note": ("Zrive is the operator of the programme, not a third party like the other "
                     "employers. An instructor it employs is in house, which is why "
                     "fee_per_session on that instructor reads in scope of salary where the "
                     "others read not modelled."),
            "props": [
                p("role", "employer of an instructor, and the operator of the programme", E),
                p("relationship", "runs the programme, so this instructor is in house", E),
                p("instructors_supplied", str(supplied), D),
            ],
        }
    return {
        "id": cid, "type": "Company", "label": COMPANIES[cid],
        "props": [
            p("role", "employer of an instructor", E),
            p("relationship", "none commercial in this toy", D),
            p("instructors_supplied", str(supplied), D),
        ],
    }


def sample_phrase(drawn, total, noun, one=None):
    """"6 of 22 <noun>" while a drawing shows a sample, "all 28 <noun>" once it shows the lot.

    ONE FORMATTER, and that is the point of it. The Programme tile, the Cohort tile and the two
    band captions all say how much of the syllabus is on screen, and three of those four are on
    the drawing at the same time; three copies of the sentence is three chances for a view to
    claim "all" in a caption and "6 of 22" in a panel.

    It refuses a sample larger than its population rather than writing "28 of 25". That string
    would read as a typo in the drawing and would in fact be a wrong number in the model.

    ISSUE 167 GAVE IT `one`, AND THE NOUN AGREES WITH THE TOTAL. Z-HR groups four of its twenty
    five sessions into four modules of one session each, so four module tiles read "all 1 session
    templates" and four delivery tiles read "all 1 sessions", eight strings on two altitudes of
    one programme. site/term.js has carried this guard in three places since it started counting
    rows and the Python formatter never got one, so the generated document was the half of the
    page that could not write a singular.

    THE SINGULAR IS THE CALLER'S AND NOT A RULE APPLIED HERE, because there is no rule that
    survives this callers list: "sessions" drops an s, "session templates" drops it off the
    second word, and "in the syllabus", "in this module" and "drawn" are not count nouns at all
    and would be mangled by anything mechanical. A caller that passes none is a caller whose
    phrase does not inflect, which is three of the five.

    IT AGREES WITH `total` AND NOT WITH `drawn`, which is the number the noun stands next to in
    both forms: "all 1 session" and "0 of 1 session" are both about a population of one, and
    "1 of 2 sessions" is correct with a drawn of one because the population is two.
    """
    if drawn > total:
        raise SystemExit(f"model: {drawn} {noun} are drawn out of a declared {total}. Either the "
                         f"declared total is wrong or the route carries a row the syllabus does "
                         f"not.")
    word = (one or noun) if total == 1 else noun
    return f"all {total} {word}" if drawn == total else f"{drawn} of {total} {word}"


def syllabus_totals_digest(sessions=None):
    """The serialisation of the one table check_syllabus_counts holds against the vault.

    Issue 196. Seven programme keys and seven integers, all of them written in the clear in
    SYLLABUS_SESSIONS above and all of them printed on the page as the denominator of a fraction.
    The digest carries nothing the repository does not already carry; what it carries is a way
    for a machine with no vault to tell these seven numbers from seven other numbers.
    """
    sessions = SYLLABUS_SESSIONS if sessions is None else sessions
    return _reading_digest([f"total\t{k}\t{sessions[k]}" for k in sorted(sessions)])


def module_structure_digest(modules=None, rows=None):
    """The serialisation of the two tables check_module_structure holds against the vault.

    Both halves, because the gate checks both: the per programme module list with its session
    counts, and every drawn template's claim to a (module, sequence) seat in the syllabus. A
    digest over only the first would leave the second able to drift on a machine with no vault,
    and the second is the half that catches a template coming to claim somebody else's place.
    """
    modules = SYLLABUS_MODULES if modules is None else modules
    rows = SYLLABUS_ROWS if rows is None else rows
    lines = []
    for key in sorted(modules):
        for code, name, n in modules[key]:
            lines.append(f"module\t{key}\t{code}\t{name}\t{n}")
    for key in sorted(rows):
        for sid in sorted(rows[key]):
            code, seq = rows[key][sid]
            lines.append(f"row\t{key}\t{sid}\t{code}\t{seq}")
    return _reading_digest(lines)


def check_syllabus_counts():
    """Re-count the syllabus folders wherever they exist, and say which of the two happened.

    A gate that cannot run on a machine has to say so out loud. This one runs on the machine
    that holds the vault and cannot run in CI, and a silent skip there would read exactly like a
    pass; HANSEI.md `2026-08-empty-input-reported-success` is the same failure in another gate.
    """
    # Issue 118, and the same line check_module_structure carries: this is a gate that re-reads a
    # corpus, and a source citing it by name is refused if this line was never reached.
    RECHECK_GATES_RUN.add("check_syllabus_counts")
    keys = {s["key"] for s in PROGRAMMES}
    if keys != set(SYLLABUS_SESSIONS):
        raise SystemExit(f"model: SYLLABUS_SESSIONS declares "
                         f"{', '.join(sorted(set(SYLLABUS_SESSIONS) - keys)) or 'nothing extra'} "
                         f"that no programme uses, and misses "
                         f"{', '.join(sorted(keys - set(SYLLABUS_SESSIONS))) or 'nothing'}.")
    if not SYLLABUS_DIR.is_dir():
        # Issue 196, and this is the branch the whole card is about. It used to be one line and a
        # `return`, on every CI run, over the only check on the denominator of every fraction on
        # every screen. It now asks the committed attestation whether these are the seven numbers
        # somebody held up against the vault, and refuses if they are not.
        token, why = recorded_verdict("syllabus-totals", syllabus_totals_digest(),
                                      corpus_present=False)
        if token == "recorded":
            print(f"[model] syllabus totals: [recorded] the vault is not on this machine, so "
                  f"nothing was counted here. {why}. They were counted on "
                  f"{SYLLABUS_COUNTED_ON}.", file=sys.stderr)
            return
        print(f"[model] syllabus totals: [unverified] the vault is not on this machine and no "
              f"recorded reading is committed either, so the seven totals in SYLLABUS_SESSIONS "
              f"are unverified here. They were counted on {SYLLABUS_COUNTED_ON}.",
              file=sys.stderr)
        return
    bad = []
    for key in sorted(SYLLABUS_SESSIONS):
        folder = SYLLABUS_DIR / key
        if not folder.is_dir():
            bad.append(f"{key}: no syllabus folder")
            continue
        real = len(list(folder.glob("*.md")))
        if real != SYLLABUS_SESSIONS[key]:
            bad.append(f"{key}: declared {SYLLABUS_SESSIONS[key]}, the folder holds {real}")
    if bad:
        raise SystemExit("[model] the declared syllabus totals no longer match the vault, and "
                         "the band captions are written from them:\n  " + "\n  ".join(bad))
    token, why = recorded_verdict("syllabus-totals", syllabus_totals_digest(),
                                  corpus_present=True)
    print(f"[model] syllabus totals: [{token}] all {len(SYLLABUS_SESSIONS)} agree with the "
          f"syllabus folders on this machine, counted again just now"
          f"{(' ' + why) if why else ''}", file=sys.stderr)


def module_stats(key):
    """(modules declared, sessions the modules account for, sessions in no module)."""
    mods = SYLLABUS_MODULES[key]
    covered = sum(n for _c, _n, n in mods)
    return len(mods), covered, SYLLABUS_SESSIONS[key] - covered


def check_module_structure():
    """The same shape as check_syllabus_counts, on the module table, and for the same reason.

    Two things are checked and they fail differently. The per programme module list is compared
    against the vault's own distinct modules, in order, with their session counts; and every
    drawn template's declared (module, sequence) pair is compared against the vault row that
    carries that sequence. The second is what catches a template silently coming to claim
    somebody else's place in the syllabus, which is the failure a table typed by hand has.
    """
    # Issue 118. VALUE_SOURCES names this function as the gate that re-reads its corpus, and
    # check_provenance refuses that claim if this line was never reached. Recorded on entry
    # rather than on the clean path, because the claim is that the corpus is re-read wherever it
    # exists, and the branch below saying the vault is absent has honoured it.
    RECHECK_GATES_RUN.add("check_module_structure")
    keys = {s["key"] for s in PROGRAMMES}
    for name, table in (("SYLLABUS_MODULES", SYLLABUS_MODULES), ("SYLLABUS_ROWS", SYLLABUS_ROWS)):
        if keys != set(table):
            raise SystemExit(f"model: {name} does not cover the same seven programmes as "
                             f"PROGRAMMES.")
    for spec in PROGRAMMES:
        declared = set(SYLLABUS_ROWS[spec["key"]])
        drawn = {t[0] for t in spec["templates"]}
        if declared != drawn:
            raise SystemExit(f"model: SYLLABUS_ROWS[{spec['key']}] and the templates drawn on "
                             f"that route are not the same set: "
                             f"{sorted(declared ^ drawn)} is in one and not the other.")
        codes = {c for c, _n, _k in SYLLABUS_MODULES[spec["key"]]}
        for sid, (code, _seq) in SYLLABUS_ROWS[spec["key"]].items():
            if code is not None and code not in codes:
                raise SystemExit(f"model: {sid} sits in module {code!r} and "
                                 f"SYLLABUS_MODULES[{spec['key']}] does not declare it.")
        _n, covered, orphan = module_stats(spec["key"])
        if orphan < 0:
            raise SystemExit(f"model: {spec['key']} declares modules covering {covered} sessions "
                             f"and the syllabus holds {SYLLABUS_SESSIONS[spec['key']]}.")
    if not SYLLABUS_DIR.is_dir():
        # Issue 196, the same repair as check_syllabus_counts above and for the same reason.
        token, why = recorded_verdict("module-structure", module_structure_digest(),
                                      corpus_present=False)
        if token == "recorded":
            print(f"[model] module structure: [recorded] the vault is not on this machine, so "
                  f"nothing was read here. {why}. It was read on {SYLLABUS_COUNTED_ON}.",
                  file=sys.stderr)
            return
        print(f"[model] module structure: [unverified] the vault is not on this machine and no "
              f"recorded reading is committed either, so the module table is unverified here. It "
              f"was read on {SYLLABUS_COUNTED_ON}.", file=sys.stderr)
        return
    bad, rows_checked = [], 0
    for spec in PROGRAMMES:
        key = spec["key"]
        vault = {}
        seen = collections.OrderedDict()
        for f in sorted((SYLLABUS_DIR / key).glob("*.md")):
            fm = {}
            for line in f.read_text(encoding="utf-8").split("\n"):
                m = re.match(r"^([a-z_]+):\s*(.*)$", line)
                if m:
                    fm[m.group(1)] = m.group(2).strip().strip('"')
            seq = fm.get("sequence")
            if seq:
                vault[int(seq)] = (fm.get("module") or None, fm.get("module_name") or None)
        for seq in sorted(vault):
            code, name = vault[seq]
            if name:
                seen.setdefault((code, name), 0)
                seen[(code, name)] += 1
        real = tuple((c, n, k) for (c, n), k in seen.items())
        if real != tuple(SYLLABUS_MODULES[key]):
            bad.append(f"{key}: the module list has drifted from the vault.\n"
                       f"      declared {SYLLABUS_MODULES[key]}\n"
                       f"      the vault {real}")
        for sid, (code, seq) in sorted(SYLLABUS_ROWS[key].items()):
            rows_checked += 1
            if seq not in vault:
                bad.append(f"{key}: {sid} claims sequence {seq} and the syllabus has no such row")
            elif vault[seq][0] != code:
                bad.append(f"{key}: {sid} at sequence {seq} declares module {code!r} and the "
                           f"vault row says {vault[seq][0]!r}")
    if bad:
        raise SystemExit("[model] the declared module structure no longer matches the vault, and "
                         "the outline is grouped by it:\n  " + "\n  ".join(bad))
    token, why = recorded_verdict("module-structure", module_structure_digest(),
                                  corpus_present=True)
    print(f"[model] module structure: [{token}] all seven module lists and all {rows_checked} "
          f"drawn rows agree with the vault on this machine, read again just now"
          f"{(' ' + why) if why else ''}", file=sys.stderr)


# ---- the invented session agenda, issue 85 -----------------------------------
# THE OWNER ASKED FOR IT, THE VAULT HOLDS NOTHING OF THE KIND, AND WHAT SHIPPED IS NOT WHAT A
# LITERAL READING OF THE REQUEST WOULD HAVE PRODUCED. All of that is stated here because the
# difference is the decision.
#
# WHAT THE VAULT HAS. Nothing. Every syllabus note under the vault's syllabi folder is frontmatter
# and no body at all: no agenda, no contents, no learning objective, in any of the 260 notes. So a
# session level outline cannot be read; it can only be made up.
#
# THE CAUTION ON THE CARD, WHICH IS THE THING THAT SHAPED THIS. Everything invented on this page
# so far is an identifier, a date, a count or an amount, and every one of those is obviously a
# placeholder. An invented AGENDA is invented substantive content that looks exactly like
# curriculum design, and a reader landing on it has no way to tell it from a proposal. That is a
# different risk from a made up attendance figure and it needs a different answer.
#
# THE ANSWER: THE SAME FOUR LINES UNDER EVERY TEMPLATE, AND NOT ONE WORD OF THEM IS ABOUT ANY
# SESSION. A per session agenda inferred from a title would have produced eighty three different
# plausible plans, and plausible is precisely the property that makes it dangerous. Four constant
# lines cannot be mistaken for a plan for this session, because a reader who opens a second row
# sees the identical four. They demonstrate the SHAPE a session level outline would take, which is
# what the drawing was missing, and they assert nothing at all about the curriculum.
#
# It is not a smaller version of what was asked for; it is a different object, and the block says
# so on its own face. The reader is told, inside the block and in a sentence that survives a
# screenshot of the block alone, that these are the same four lines everywhere, that no system
# holds any of it, and that they came from this page rather than from Zrive.
#
# EVERY LINE CARRIES `dummy` AND `0_invented` LIKE EVERY OTHER INVENTED VALUE, and it is a block
# of the instance document rather than eighty three copies on eighty three nodes because it is
# one object and not eighty three. check_provenance() walks it, for the reason three separate
# comments in this file already give about the registry, the provenance block and the counts
# block: a block the node walk cannot see is where the next unranked value lands.
#
# ---- AND THE OWNER REVERSED IT. TEMPLATE_AGENDA BELOW IS WHAT HE ASKED FOR INSTEAD ----------
# HE ASKED FOR SOMETHING AD HOC, MINIMAL AND IMAGINED FROM THE SESSION TITLE, so the four
# constant lines are replaced by three or four short beats written for each of the 83 templates
# out of its own title and nothing else. The four constant lines are gone rather than kept
# beside these: two populations, one drawn and one not, is a second place for writing nobody
# reads and the first place a rule gets applied to one and forgotten on the other.
#
# ---- AND THEN HE READ THEM AND REJECTED THE REGISTER, WHICH IS THE STATE OF THIS TABLE --------
# "The per session outlines need to be more serious / academic and structured", verbatim. The
# first draft was evocative and deliberately un-curricular: "a company that cannot pay, and the
# order of the queue". Every beat below is rewritten against that instruction and two things
# changed, one structural and one editorial.
#
# THE STRUCTURE IS THE ROW KEY, AND IT COST NO NEW FIELD. A beat has always been the same five
# field property row every other value on this page is, `{k, v, f, r, at}`, and `k` was carrying
# an ordinal: "1", "2", "3". An ordinal is not information; it is the position the reader can
# already see. `k` now names WHICH RUNG of a session the beat is, out of a closed set of four:
#
#     scope       the subject matter the session delimits
#     method      the treatment: the named methods, instruments and standard terminology on it
#     practicum   the applied work carried out in the session
#     outcome     what the session leaves the student holding
#
# WHY FOUR AND WHY THESE FOUR. They are the four fields a syllabus entry actually has, so the
# block reads as a schema rather than as a list, which is what "structured" asked for. They are
# ORDERED, and the order is the arc of a taught hour, so a block reads down rather than as an
# unordered set. And they are CLOSED: a beat that fits none of the four is a beat that should
# not have been written, which is a stronger editorial rule than "keep it short" and it is
# enforced below rather than remembered.
#
# WHY THREE OR FOUR ROWS AND NOT ALWAYS FOUR. scope, method and outcome are compulsory: every
# taught session has a subject, a treatment and something a student leaves with. `practicum` is
# the one optional rung, and it is written where THE SESSION'S OWN TITLE NAMES THE APPLIED WORK,
# which is the only session level string the vault holds and therefore the only thing that can
# decide it without adding a fact from somewhere else. That is 23 of the 83: the group practice
# cases, the storylining case studies, the deep dives, the firm visits, the oratory sessions,
# the mock round, the assessment day, the Excel build, the model fit and the take home case
# presented to committee. The three against four split then carries information instead of being
# arbitrary, which is what it was before this card.
#
# THE REGISTER OF `v` IS THE VOCABULARY OF A SYLLABUS. Precise nouns, named methods, named
# instruments, the standard terminology of the discipline, and no rhetorical turn. The owner's
# own worked example is the test: "why a perfect fit is bad news" becomes "overfitting: in sample
# against held out error, and the bias variance decomposition", which is ds_st3's method row
# verbatim below. Terminology, not aphorism.
#
# ACADEMIC DOES NOT MEAN LONG. He has twice said the page is too verbose and one sheet went from
# 263 words to 45 on the day this was written. A beat is a line and not a paragraph: 272 beats,
# 4 to 13 words each, mean 8.9, against 4 to 14 and mean 8.6 for the register they replace.
#
# WHERE THE EPONYM RULE BITES. An academic register raises the odds of a real surname arriving
# inside a method name, and the name gate hashes every shipped string. WHERE A METHOD IS
# EPONYMOUS THE DESCRIPTIVE FORM IS WRITTEN INSTEAD, everywhere, without exception: "the internal
# rate of return" and not the person, "industry structure" and not the person, "the constant
# growth model" and not the person. That is a drafting rule and not a workaround for the gate;
# if the gate ever refuses a string here the string changes and the gate does not. The agenda
# strings now go THROUGH that gate at build time, which they did not before this card, and the
# reason is at _check_names below.
#
# THE SIX Z-CFA TITLES ARE THE EXCEPTION AND IT IS NAMED HERE RATHER THAN HIDDEN. Their titles
# are reading numbers and nothing else, '19, 20 & 21' and its five siblings, so there is no
# subject in them to be academic about. Their scope rows say which numbered readings, and their
# method and outcome rows are about working through numbered readings: self study against the
# reading list, the approved calculator, timed problem sets, definitions the examination takes
# literally. Writing CFA subject matter into them to make this table look uniform would be
# writing a curriculum with no title behind it, so the six read as a family and the model says
# why here rather than disguising it.
#
# FOUR THINGS ARE CHECKED BELOW RATHER THAN ASSERTED. That the table covers the drawn templates
# exactly, so a renamed template loses its agenda loudly. That no two templates carry the same
# beat, which is the mechanical half of not collapsing into a formula. That every label is in
# the closed set, unrepeated within a session and in reading order. And that the three
# compulsory rungs are all present. A STANDARDISED REGISTER MAKES COLLISION MORE LIKELY, NOT
# LESS, because academic vocabulary repeats where literary vocabulary does not, so the repeat
# check matters more after this card than before it. Measured over the whole table: all 272
# beats distinct, and the highest cross template word overlap over the 3403 pairs is 0.1579,
# down from 0.2083 for the register it replaces (Jaccard over the beat text, stop words removed,
# labels excluded because a closed set repeated by design would inflate every pair by the same
# constant).
TEMPLATE_AGENDA = {
    # ---- Z-IB ------------------------------------------------------------------------------
    "st1": (("scope", "spreadsheet modelling for valuation and transaction work"),
            ("method", "lookup and reference functions, pivot tables, array formulas, "
                       "keyboard navigation"),
            ("practicum", "an operating model built from a blank workbook and peer audited"),
            ("outcome", "a workbook a third party can trace and extend unaided")),
    "st2": (("scope", "the one page analyst CV as a screening document"),
            ("method", "reverse chronological structure, quantified bullets, keyword screening "
                       "by applicant tracking systems"),
            ("outcome", "a CV revised against a peer review and a screening rubric")),
    "st3": (("scope", "market structure and the macroeconomic aggregates that price it"),
            ("method", "policy rates, the yield curve, inflation measurement and the "
                       "transmission mechanism"),
            ("outcome", "the vocabulary to read price action against the announcements behind "
                        "it")),
    "st4": (("scope", "the three primary statements and the articulations between them"),
            ("method", "accrual against cash accounting, working capital movements, the "
                       "earnings to cash reconciliation"),
            ("outcome", "one filed report read for its disclosures and its omissions")),
    "st5": (("scope", "valuation as the answer to a stated decision question"),
            ("method", "discounted cash flow, trading and transaction comparables, the cost of "
                       "capital"),
            ("outcome", "two defensible values for one company and an account of the spread")),
    "st6": (("scope", "the analyst recruiting cycle and its selection stages"),
            ("method", "application timetables, numerical screens, competency and technical "
                       "interview formats"),
            ("outcome", "a personal recruiting calendar and a rehearsed technical answer bank")),

    # ---- Z-SC ------------------------------------------------------------------------------
    "sc_st1": (("scope", "the programme syllabus, its sequence and its assessment"),
               ("method", "programme structure by module, and the case method it is taught "
                          "through"),
               ("outcome", "each participant objective recorded against the syllabus")),
    "sc_st2": (("scope", "the professional services market for strategy advice"),
               ("method", "segmentation by firm tier, the leverage model, fee and billing "
                          "structures"),
               ("outcome", "an industry map with the competitive boundaries drawn on it")),
    "sc_st3": (("scope", "the analyst workday and the composition of junior workload"),
               ("method", "workstream allocation, utilisation, the review cycle, deliverable "
                          "production"),
               ("outcome", "an hour by hour account of the first year in role")),
    "sc_st4": (("scope", "the behavioural interview and the competencies it scores"),
               ("method", "structured response frameworks, evidence selection, the probing "
                          "follow up"),
               ("outcome", "three rehearsed narratives, each mapped to several competencies")),
    "sc_st5": (("scope", "the interviewer led case as an assessed dialogue"),
               ("method", "problem restatement, clarifying questions, hypothesis driven "
                          "structuring, issue trees"),
               ("outcome", "an opening ninety seconds that establishes a structure")),
    "sc_st6": (("scope", "case execution under time and quantitative pressure"),
               ("method", "mental arithmetic, estimation discipline, synthesis and "
                          "recommendation"),
               ("outcome", "one case taken end to end within the interview clock")),
    "sc_st7": (("scope", "the profitability diagnostic as a case archetype"),
               ("method", "revenue and cost decomposition, contribution margin, fixed against "
                          "variable cost"),
               ("practicum", "a group case worked down to a single diagnosed branch"),
               ("outcome", "a diagnosis defended against the alternative branch")),
    "sc_st8": (("scope", "market sizing under incomplete information"),
               ("method", "top down and bottom up estimation, segmentation, checks against "
                          "known aggregates"),
               ("practicum", "two teams size the same market independently"),
               ("outcome", "the load bearing assumption named and the divergence explained")),
    "sc_st9": (("scope", "commercial due diligence inside a transaction timetable"),
               ("method", "market and competitive assessment, customer research design, source "
                          "hierarchy"),
               ("outcome", "a question set with a source named against every line")),
    "sc_st10": (("scope", "a target's own projections tested against external evidence"),
                ("method", "triangulation of management data with customer and channel "
                           "evidence"),
                ("practicum", "a target pack worked through in teams to a verdict"),
                ("outcome", "a proceed or decline recommendation argued before the group")),
    "sc_st11": (("scope", "large scale organisational transformation programmes"),
                ("method", "the case for change, initiative sequencing, dependency mapping, "
                           "stakeholder analysis"),
                ("practicum", "a transformation sequenced in teams under a fixed budget"),
                ("outcome", "the first prerequisite identified and the resistance planned for")),
    "sc_st12": (("scope", "the strategic rationale for an acquisition"),
                ("method", "synergy quantification, revenue against cost synergies, accretion"),
                ("practicum", "one acquisition valued in teams with its synergies challenged"),
                ("outcome", "the price at which the recommendation reverses")),
    "sc_st13": (("scope", "market entry as a choice of mode and of sequence"),
                ("method", "attractiveness screening and comparison across build, buy and "
                           "partner"),
                ("practicum", "one market selected in teams from a screened shortlist"),
                ("outcome", "the rejected alternatives recorded with the reason for rejection")),
    "sc_st14": (("scope", "diligence conducted against a fund's holding period"),
                ("method", "investment thesis formulation, downside before upside, exit "
                           "assumptions"),
                ("practicum", "a thesis drafted in teams and then put under challenge"),
                ("outcome", "one sentence a committee would repeat, downside stated first")),
    "sc_st15": (("scope", "a technology, media and telecommunications engagement as delivered"),
                ("method", "the client question, the workplan against it, the deliverable that "
                           "answered it"),
                ("outcome", "the finding that did not survive the client meeting, and why")),
    "sc_st16": (("scope", "the governing message and the argument that supports it"),
                ("method", "pyramid structure, mutually exclusive groupings, inductive against "
                           "deductive order"),
                ("practicum", "an existing deck restructured from its governing message "
                              "downwards"),
                ("outcome", "a storyline legible from the action titles alone")),
    "sc_st17": (("scope", "implementation of an agreed strategic plan in consumer goods"),
                ("method", "initiative prioritisation by cost to start, milestone definition, "
                           "stall indicators"),
                ("outcome", "a first year implementation plan with its stall signals defined")),
    "sc_st18": (("scope", "one argument addressed to two different audiences"),
                ("method", "audience analysis, action titles, the horizontal and vertical logic "
                           "of a document"),
                ("practicum", "the same case study rewritten for a second reader"),
                ("outcome", "two documents from one message, each read from its titles")),
    "sc_st19": (("scope", "store estate performance across a retail network"),
                ("method", "footfall, basket and margin by location, and estate segmentation"),
                ("outcome", "an estate sorted, with the field evidence set beside the data")),
    "sc_st20": (("scope", "price as a lever on realised margin"),
                ("method", "value based against cost plus pricing, elasticity, discount "
                           "leakage"),
                ("outcome", "an increase modelled with the volume it is expected to cost")),
    "sc_st21": (("scope", "the consulting career ladder and its exit points"),
                ("method", "promotion timetables by grade, attrition rates, destination "
                           "categories on exit"),
                ("outcome", "the cost of each additional year stated rather than assumed")),
    "sc_st22": (("scope", "a strategy firm observed on an ordinary working day"),
                ("method", "a site visit with structured interviews at two grades of "
                           "seniority"),
                ("practicum", "an observation protocol applied on site"),
                ("outcome", "field notes written before the impression fades")),
    "sc_st23": (("scope", "recruiting into strategy consulting, from application to offer"),
                ("method", "intake calendars, screening tests, case and fit rounds, referral "
                           "routes"),
                ("outcome", "a dated plan running backwards from the earliest deadline")),
    "sc_st24": (("scope", "a second consulting firm under the identical protocol"),
                ("method", "the earlier interview schedule repeated without variation"),
                ("practicum", "the protocol run again by the same observers"),
                ("outcome", "a like for like comparison across both visits")),
    "sc_st25": (("scope", "a full simulated selection round"),
                ("method", "timed case and fit rounds scored against a published rubric"),
                ("practicum", "two interviews in succession with unfamiliar counterparts"),
                ("outcome", "one named weakness per participant, carried into the next round")),

    # ---- Z-BL ------------------------------------------------------------------------------
    "bl_st1": (("scope", "career routes in law: private practice, in house, public sector"),
               ("method", "comparison across entry requirements, early workload and "
                          "reversibility"),
               ("outcome", "the irreversible decisions identified before they are made")),
    "bl_st2": (("scope", "recruitment processes at law firms"),
               ("method", "intake calendars, application review criteria, the assessed stages "
                          "in order"),
               ("outcome", "an application prepared to the criteria a reviewer applies")),
    "bl_st3": (("scope", "postgraduate qualification in law and its funding"),
               ("method", "compulsory professional qualification against elective masters, "
                          "scholarship schemes"),
               ("outcome", "a calendar worked backwards from the intake date")),
    "bl_st4": (("scope", "the acquisition process from mandate through to completion"),
               ("method", "letter of intent, exclusivity, due diligence, and adviser roles"),
               ("outcome", "one clause read closely enough to be argued both ways")),
    "bl_st5": (("scope", "the sale and purchase agreement and its allocation of risk"),
               ("method", "conditions precedent, warranties and indemnities, signing against "
                          "closing"),
               ("outcome", "a completion timetable drafted backwards from the payment date")),
    "bl_st6": (("scope", "insolvency and the ranking of creditor claims"),
               ("method", "the order of priority, out of court workouts, directors' duties on "
                          "insolvency"),
               ("outcome", "the point at which duty runs to creditors and not shareholders")),
    "bl_st7": (("scope", "restructuring plans imposed over dissenting creditors"),
               ("method", "class formation, cross class cram down, valuation evidence"),
               ("outcome", "the entitlement of a dissenting class, computed and not asserted")),
    "bl_st8": (("scope", "the decision whether to bring a claim at all"),
               ("method", "merits assessment, limitation periods, pre action evidence, cost "
                          "exposure"),
               ("outcome", "a claim weighed on merits, timing and cost before filing")),
    "bl_st9": (("scope", "conduct of proceedings from hearing through to judgment"),
               ("method", "pleadings, examination of witnesses, settlement against expected "
                          "judgment"),
               ("outcome", "a hearing prepared, held, and reviewed against the transcript")),
    "bl_st10": (("scope", "the lending relationship and the documents that carry it"),
                ("method", "facility agreement structure, security packages, ranking, "
                           "enforcement"),
                ("outcome", "collateral valued for the date on which it would be enforced")),
    "bl_st11": (("scope", "raising capital in the public markets"),
                ("method", "the issuance process, prospectus liability, disclosure obligations, "
                           "covenant testing"),
                ("outcome", "a covenant package tested against a deteriorating quarter")),
    "bl_st12": (("scope", "the tax consequences that follow legal structure"),
                ("method", "residence and source, permanent establishment, withholding, "
                           "transfer pricing"),
                ("outcome", "one transaction priced before and after its tax treatment")),
    "bl_st13": (("scope", "the boundary between planning and abuse"),
                ("method", "general anti avoidance rules, substance requirements, disclosure "
                           "regimes, audit procedure"),
                ("outcome", "advice written to survive a later inspection of the file")),
    "bl_st14": (("scope", "the public administration as counterparty and as regulator"),
                ("method", "licensing, public procurement, administrative silence, appeal time "
                           "limits"),
                ("outcome", "a procurement timetable with the appeal window costed into it")),
    "bl_st15": (("scope", "company formation and early stage financing"),
                ("method", "founder agreements, vesting, term sheet economics, the "
                           "capitalisation table"),
                ("outcome", "a capitalisation table redrawn after a single financing round")),
    "bl_st16": (("scope", "intellectual property and personal data as regulated assets"),
                ("method", "ownership against licence, assignment, processing bases, data "
                           "protection duties"),
                ("outcome", "a product reviewed for ownership and processing before release")),
    "bl_st17": (("scope", "the employment relationship and its mandatory terms"),
                ("method", "contract types, non waivable rights, dismissal grounds and "
                           "procedure, collective bargaining"),
                ("outcome", "one dismissal run correctly, then the same one run defectively")),
    "bl_st18": (("scope", "title, tenure and the transfer of real property"),
                ("method", "registry search and its limits, lease structure, sale subject to "
                           "occupation"),
                ("outcome", "one lease read from both sides of the covenant")),
    "bl_st19": (("scope", "oral delivery before a hearing or a panel"),
                ("method", "breath, pace and posture, delivery without notes, recorded review"),
                ("practicum", "an opening delivered to camera and then played back"),
                ("outcome", "the first thirty seconds reviewed against the recording")),
    "bl_st20": (("scope", "argument constructed to be heard rather than read"),
                ("method", "oral argument structure, signposting, handling interruption"),
                ("practicum", "a submission delivered into scripted interruption"),
                ("outcome", "one line of argument sustained through an interruption")),
    "bl_st21": (("scope", "one commercial agreement read in full"),
                ("method", "clause taxonomy, boilerplate against operative terms"),
                ("practicum", "the same obligation drafted two ways and then compared"),
                ("outcome", "the three provisions that decide the outcome, identified")),
    "bl_st22": (("scope", "legal due diligence over a populated data room"),
                ("method", "scoping and materiality thresholds, request lists, issue "
                           "classification"),
                ("practicum", "a data room worked with no index and no starting point"),
                ("outcome", "a report a deal team can price the findings from")),
    "bl_st23": (("scope", "a law firm observed during a working day"),
                ("method", "practice area briefings and structured interviews with junior "
                           "lawyers"),
                ("practicum", "an interview schedule prepared in advance and kept to"),
                ("outcome", "an account of the work a first year is actually given")),
    "bl_st24": (("scope", "a further practice, taken for contrast with the earlier visit"),
                ("method", "one prepared question per lawyer met, recorded verbatim"),
                ("practicum", "the questions put in person rather than read off a page"),
                ("outcome", "the divergences between the two practices set out")),
    "bl_st25": (("scope", "the consolidated assessment day"),
                ("method", "consecutive interviews, cross interviewer comparison, stamina as an "
                           "assessed variable"),
                ("practicum", "one narrative held across four interviewers in sequence"),
                ("outcome", "a record of where the account varied between rounds")),
    "bl_st26": (("scope", "a firm's own presentation of its practice"),
                ("method", "the presentation heard, then two of its claims tested by "
                           "question"),
                ("outcome", "the terms of a trainee offer, as they are actually made")),
    "bl_st27": (("scope", "a comparable presentation from a second firm"),
                ("method", "the identical question set, put again for comparability"),
                ("outcome", "a shortlist recorded with the two points of divergence")),
    "bl_st28": (("scope", "delivery reviewed against the first recording"),
                ("method", "video comparison and the isolation of a single habit"),
                ("practicum", "a final piece delivered with nothing in hand"),
                ("outcome", "the habit removed, demonstrated on a second recording")),

    # ---- Z-PE ------------------------------------------------------------------------------
    "pe_st1": (("scope", "the private equity fund and the parties to it"),
               ("method", "fund structure, the general and limited partner relationship, fees "
                          "and carried interest"),
               ("outcome", "the route capital takes from commitment through to distribution")),
    "pe_st2": (("scope", "the leveraged buyout and the sources of its return"),
               ("method", "debt paydown, multiple expansion, operating improvement, the "
                          "internal rate of return"),
               ("outcome", "a return attributed across the three levers by hand")),
    "pe_st3": (("scope", "the alternative asset classes and what distinguishes them"),
               ("method", "buyout, private credit, real assets and hedge strategies, compared "
                          "on liquidity and horizon"),
               ("outcome", "the illiquidity premium stated as a price and not a benefit")),
    "pe_st4": (("scope", "deal origination through to signing"),
               ("method", "sourcing channels, screening criteria, the diligence workstreams and "
                          "their owners"),
               ("outcome", "a workstream plan with one owner named against each stream")),
    "pe_st5": (("scope", "the investment committee memorandum as a decision document"),
               ("method", "recommendation first, supporting analysis, key risks and mitigants"),
               ("practicum", "the case presented to committee and taken through questions"),
               ("outcome", "a memorandum revised after the questions it failed to answer")),
    "pe_st6": (("scope", "long lived regulated and contracted assets"),
               ("method", "concession and availability structures, contracted against merchant "
                          "revenue"),
               ("outcome", "a lower target return justified by the risk it excludes")),

    # ---- Z-HR ------------------------------------------------------------------------------
    "hr_st1": (("scope", "the term's coverage and the limits it declares for itself"),
               ("method", "session order, the topics deliberately held out, round table "
                          "introductions"),
               ("outcome", "a written statement of intent from each attendee")),
    "hr_st2": (("scope", "the shift from personnel administration to a strategic people "
                         "function"),
               ("method", "operating models, the business partner structure, the reporting "
                          "line"),
               ("outcome", "the strategic claim tested against what the function decides")),
    "hr_st3": (("scope", "employer brand and the employee value proposition"),
               ("method", "proposition design, candidate segmentation, channel mix, internal "
                          "verification"),
               ("outcome", "a value proposition drafted, then checked against staff testimony")),
    "hr_st4": (("scope", "training and development as investment rather than budget line"),
               ("method", "competency mapping, development pathways, evaluation of training "
                          "effect"),
               ("outcome", "a development path for one role, with its evaluation defined")),
    "hr_st5": (("scope", "workforce data and the questions it can actually answer"),
               ("method", "attrition, time to hire and engagement measures, with cohort "
                          "analysis"),
               ("outcome", "one question this data cannot answer, stated explicitly")),
    "hr_st6": (("scope", "iterative working methods applied to people processes"),
               ("method", "short cycles, backlog and prioritisation, retrospectives, cross "
                          "functional teams"),
               ("outcome", "a hiring process rebuilt on shorter cycles, with its failure "
                           "modes")),

    # ---- Z-DS ------------------------------------------------------------------------------
    "ds_st1": (("scope", "the programme arc and the environment it is worked in"),
               ("method", "toolchain installation, version control, notebook and script "
                          "discipline"),
               ("outcome", "a reproducible environment and a first dataset loaded")),
    "ds_st2": (("scope", "the dataset before any model is fitted to it"),
               ("method", "univariate and bivariate distributions, missingness patterns, "
                          "outliers, leakage detection"),
               ("outcome", "one visualisation that changes the question being asked")),
    "ds_st3": (("scope", "supervised learning and the generalisation problem"),
               ("method", "overfitting: in sample against held out error, and the bias variance "
                          "decomposition"),
               ("outcome", "model complexity chosen by cross validation, not by training fit")),
    "ds_st4": (("scope", "fitting a first model to a prepared dataset"),
               ("method", "a mandatory baseline, the train test split, hyperparameter search"),
               ("practicum", "a run logged with its seed, data version and parameters"),
               ("outcome", "a result another person can reproduce from the log alone")),
    "ds_st5": (("scope", "model diagnosis after the first fit"),
               ("method", "error analysis by segment, confusion matrix, residual inspection, "
                          "ablation"),
               ("outcome", "one change measured against the baseline it replaces")),
    "ds_st6": (("scope", "the model as an input to a business decision"),
               ("method", "the optimisation metric against the business objective, the cost of "
                          "error"),
               ("outcome", "a result explained to a reader who will not see the code")),

    # ---- Z-CFA. Titles are reading numbers, see the note above ------------------------------
    "cfa_st1": (("scope", "readings 19, 20 and 21 of the curriculum, in the order listed"),
                ("method", "self study against the reading list, with the formulas to be "
                           "recalled"),
                ("outcome", "end of reading questions attempted before the answers are "
                            "consulted")),
    "cfa_st2": (("scope", "readings 22, 23 and 24, with the previous three revisited"),
                ("method", "spaced review of the earlier set, then the new readings in "
                           "examination order"),
                ("outcome", "a timed problem set completed on the new material")),
    "cfa_st3": (("scope", "readings 25, 26 and 27, and their links to the readings already "
                          "done"),
                ("method", "definitions taken literally, worked solutions compared line by "
                           "line"),
                ("outcome", "a list of the definitions examined word for word")),
    "cfa_st4": (("scope", "readings 28, 29 and 30, with a running record of recurring errors"),
                ("method", "calculation on the approved examination calculator, in the required "
                           "format"),
                ("outcome", "errors classified as careless or as material not yet learned")),
    "cfa_st5": (("scope", "readings 31 and 32, two rather than three, which frees an hour"),
                ("method", "the freed hour spent on material not followed at first pass"),
                ("outcome", "questions written by the group for the group")),
    "cfa_st6": (("scope", "readings 33, 34 and 35, the last of the set"),
                ("method", "consolidated review across all six sessions, gap identification"),
                ("outcome", "a list of what remains to be covered independently")),
}
SESSION_AGENDA = {
    # THE BLOCK CARRIES NO NOTE, ON THE OWNER'S INSTRUCTION, AND THAT IS A PRESENTATION CHANGE
    # AND NOT A DATA ONE. A sentence used to stand at the head of this block and it is gone; the
    # sheet draws the rows and nothing else. What did NOT go is `f` and `r` on every row below,
    # because those are fields and not a sentence: check_provenance() reads them, the flag
    # vocabulary is closed, and issue 104's rules refuse a row wearing a flag it has not earned.
    # Dropping them would drop the architecture that decides which rows a future adapter is
    # allowed to overwrite, which is the opposite of what was asked for. The model keeps
    # knowing; the page stops saying.
    "applies_to": "SessionTemplate",
    # The label is the row's own key and is not an ordinal. `k` was "1", "2", "3" and the
    # structure of a beat was therefore implied and unreadable; it now names which of the four
    # rungs the beat is, which is the whole of issue 108's second request and cost no new field.
    "by_template": {_tid: [p(_label, _line, D) for _label, _line in _rows]
                    for _tid, _rows in TEMPLATE_AGENDA.items()},
}


def module_row(key):
    """The `modules` row on a Programme tile, written from the module table and never typed.

    Three shapes, and which one a route gets is decided by what its syllabus holds rather than by
    its code, for the reason build/bands.py gives about its three caption alternates: special
    casing Z-CFA would be a line of code and a lie about the mechanism, and the next programme
    with no module structure would inherit the wrong sentence in silence.
    """
    n, _covered, orphan = module_stats(key)
    total = SYLLABUS_SESSIONS[key]
    if not n:
        return p("modules", f"no module structure recorded: none of the {total} sessions in the "
                            f"syllabus names a module", A, SYLLABUS_RANK)
    noun = "module" if n == 1 else "modules"
    if orphan:
        return p("modules", f"{n} {noun} over {total - orphan} of the {total} sessions, and "
                            f"{orphan} in no module", R, SYLLABUS_RANK)
    return p("modules", f"{n} {noun} over all {total} sessions", R, SYLLABUS_RANK)


def programme_block(spec):
    """The part of a drawing that is about one programme: prog, employers, host, templates,
    instructors and cohort sessions. Seven calls, one function, no branch on which programme."""
    pfx, nodes, edges = spec["pfx"], [], []
    total = SYLLABUS_SESSIONS[spec["key"]]
    prog = pfx + "prog"
    prog_node = {
        "id": prog, "type": "Programme", "label": f"{spec['code']} {spec['name']}",
        "props": [
            p("programme_code", spec["code"], D),
            p("name", spec["name"], D),
            p("delivery", spec["delivery"][0], spec["delivery"][1]),
            # Issue 83. This row used to read "6 shown, of a longer syllabus" on all seven
            # routes, which was true and unfalsifiable: it named neither how long the syllabus
            # is nor, once two routes were expanded, whether this one is a sample at all.
            p("session_templates", sample_phrase(len(spec["templates"]), total, "in the syllabus"),
              E),
            # ISSUE 85, and it is a finding on three of the seven rather than a count on all of
            # them. The syllabus groups its sessions into named modules, which nothing on this
            # page has ever said; and on Z-CFA it groups none of them, on Z-HR it groups four of
            # twenty five and on Z-PE twenty seven of thirty six. A row reading "4 modules" and
            # stopping there would let a reader take Z-HR for a programme in four parts. So the
            # sentence carries what is outside the modules whenever anything is, and where there
            # is no structure at all the row is an absence and not a zero.
            module_row(spec["key"]),
            p("owner", "academic team", E),
        ],
    }
    if spec.get("prog_note"):
        prog_node["note"] = spec["prog_note"]
    nodes.append(prog_node)

    # Employers, in the order their first instructor is declared, so a route's column 0 reads in
    # the order its instructor lane does.
    employers = []
    for _tid, _lab, emp, _n, _pr in spec["instructors"]:
        if emp and emp not in employers:
            employers.append(emp)
    for emp in employers:
        supplied = sum(1 for _t, _l, e, _n, _pr in spec["instructors"] if e == emp)
        nodes.append(company_node(emp, supplied))

    if spec["host"]:
        host_id, host_label = spec["host"]
        nodes.append({
            # Where it is drawn is not written here any more. It sits beside the sessions it
            # hosts rather than beside the employers, and build/build_layout.py works that out
            # from the 'hosts visit' edge below, the same way the students reveal works out its
            # own set from 'member of'.
            "id": host_id, "type": "Company",
            "label": host_label,
            # #128 kept the finding and the count it rests on, thirteen across a hundred and
            # fifty six, and cut the two sentences of framing around them.
            "note": ("No system anywhere relates a cohort to a visit. What the company register "
                     "holds is a visit filed under a programme note, thirteen of them across a "
                     "hundred and fifty six, which records where somebody put the paperwork and "
                     "not who attended."),
            "props": [
                p("role", "empresa colaboradora", D),
                p("note", "invented company, not a real firm", D),
                p("visits_hosted", "1", D),
                p("vacancies_open", "2", D),
                p("cohort_that_attended", "no system relates a cohort to a visit", A),
            ],
        })

    # Issue 83. sessions_taught is a count of the `teaches` edges this route draws for this
    # instructor, and it was typed beside the instructor while the edges were declared under the
    # sessions. That held while a route had six sessions and one could read both lists at once;
    # at twenty eight it is a number nobody would recount, sitting on a tile a reader would
    # believe. It is still written by hand, because it reads better beside the person than
    # inferred from a scan, and it is now refused when it disagrees with the edges.
    _teaches = {}
    for _c in spec["sessions"]:
        for _t in _c[3]:
            _teaches[_t] = _teaches.get(_t, 0) + 1
    for tid, _lab, _emp, taught, _pr in spec["instructors"]:
        if str(_teaches.get(tid, 0)) != taught:
            raise SystemExit(f"model: {spec['key']} says {tid} teaches {taught} session(s) and "
                             f"the session list gives it {_teaches.get(tid, 0)}.")
    _unknown = sorted(set(_teaches) - {_t[0] for _t in spec["instructors"]})
    if _unknown:
        raise SystemExit(f"model: {spec['key']} assigns {', '.join(_unknown)} to a session and "
                         f"declares no such instructor.")

    for tid, label, emp, taught, progs in spec["instructors"]:
        props = [
            p("name", "invented", D),
            p("employer", COMPANIES[emp], D) if emp else p("employer", NOT_RECORDED, A),
            p("sessions_taught", taught, D),
            (p("fee_per_session", "in scope of salary", E) if emp == ZRIVE
             else p("fee_per_session", "not modelled", D)),
        ]
        if progs:
            # Only the three shared instructors carry this row. It is the whole of what a per
            # programme drawing cannot show on its own: that this tile is also on another route.
            props.append(p("programmes", progs, D))
        nodes.append({"id": tid, "type": "Instructor", "label": label, "props": props})
        if emp:
            edges.append((tid, emp, "employed by"))

    # A template row is six fields, and a seventh is allowed and is a dict of overrides. Only
    # one row in the model carries it: the Z-BL visit whose firm the name gate withholds, whose
    # label is therefore not the syllabus string and which has to say so on its own tile rather
    # than under its route's title provenance. A dict and not two more positional fields,
    # because the next override will not be the same one.
    modnames = dict((c, n) for c, n, _k in SYLLABUS_MODULES[spec["key"]])
    for tpl in spec["templates"]:
        sid, title, code, dmode, lmode, dur = tpl[:6]
        over = tpl[6] if len(tpl) > 6 else {}
        prov = over.get("title_provenance", spec["title_provenance"])
        mcode, mseq = SYLLABUS_ROWS[spec["key"]][sid]
        # ISSUE 85. The first two real published values ever to reach a property list, and they
        # are ranked as well as flagged: `real` is what the reader sees on the row and
        # `3_observed` with no read date is what a machine reading site/instance.js sees. A
        # template with no module says so as an absence, which is not a smaller kind of dummy: on
        # Z-CFA it is true of all forty five rows and it is the finding on that route.
        if mcode:
            mod_prop = p("module_name", f"{mcode} {modnames[mcode]}", R, SYLLABUS_RANK)
        else:
            mod_prop = p("module_name", "no module recorded in the syllabus", A, SYLLABUS_RANK)
        node = {
            "id": sid, "type": "SessionTemplate", "label": title,
            "props": [
                p("title", prov[0], prov[1]),
                p("template_code", code, D),
                mod_prop,
                p("sequence", f"{mseq} of {total}", R, SYLLABUS_RANK),
                p("delivery_mode", dmode, D) if dmode else p("delivery_mode", NOT_RECORDED, A),
                p("location_mode", lmode, D) if lmode else p("location_mode", NOT_RECORDED, A),
                p("duration_min", dur, D) if dur else p("duration_min", NOT_RECORDED, A),
            ],
        }
        if over.get("note") or spec.get("template_note"):
            node["note"] = over.get("note") or spec["template_note"]
        nodes.append(node)
        edges.append((prog, sid, "includes"))

    for cid, label, sid, teachers, when, state, att in spec["sessions"]:
        nodes.append({
            "id": cid, "type": "CohortSession", "label": label,
            "props": [
                p("cohort_session_id", cid.upper(), D),
                p("scheduled_at", when, D),
                (p("teacher_assigned", "yes", D) if teachers
                 else p("teacher_assigned", "no", A)),
                p("state", state, D),
                p("attendance", att, D),
                p("recording_ref", "none", D),
            ],
        })
        for tid in teachers:
            edges.append((tid, cid, "teaches"))
        edges.append((cid, sid, "instance of"))
        edges.append((cid, pfx + "cohort", "scheduled for"))

    if spec["host"]:
        # ISSUE 75, AS THE OWNER SETTLED IT: ONE EDGE. The firm hosts the visit for the cohort,
        # and that is the whole relationship this page draws.
        #
        # WHAT WAS HERE AND IS NOT, because the deletion is the decision. #75 shipped this edge
        # plus a second one under the same verb, from the host to the Programme, declared a ghost:
        # the visit is FOR a programme, that is equally true, and nothing records it. The owner
        # reversed that. It is not a correction of a fact; both readings of the visit were true.
        # It is a judgement about how much a single relationship should be made to say, and the
        # answer is the plainer drawing. A reader now meets one line from the firm and no question
        # about why there are two.
        #
        # THE ARC IS GONE WITH IT, and that is worth one line so nobody hunts for it. Issue 63's
        # span of 3 belonged to the edge that reached the Programme: it was the one edge on any of
        # the seven routes drawn as an arc slung under the row rather than as a neighbour bezier.
        # This edge spans 1 and is an ordinary bezier, so no route draws that shape any more.
        edges.append((spec["host"][0], pfx + "cohort", "hosts visit"))
    return nodes, edges


def tail_block(spec):
    """The part of a drawing that is not about a programme: the cohort, the students card, the
    four drawn Students, the enrolment to claim chain and the four ghosts. Fourteen nodes."""
    pfx = spec["pfx"]
    total = SYLLABUS_SESSIONS[spec["key"]]
    cohort, students = pfx + "cohort", pfx + "students"
    enrol, agree = pfx + "enrol", pfx + "agree"
    charge, claim = pfx + "charge", pfx + "claim"
    roster = spec["roster"]
    head, drawn = len(roster), DRAWN_STUDENTS
    not_drawn = head - drawn

    nodes = [
        {
            "id": cohort, "type": "Cohort", "label": f"{spec['code']} {spec['intake']}",
            # The cohort is a real thing and its key is not. It is marked rather than drawn as a
            # ghost for exactly that reason: the object exists, the identifier does not. The mark
            # itself is set by the route loop at the foot of this file and is never hand written,
            # so the drawing and the panel cannot come to disagree about which types have nowhere
            # to live.
            "note": ("The cohort exists as a thing and its key does not. No identifier is held "
                     "anywhere, so a cohort can only be picked out as the intersection of a "
                     "roster, a calendar, a campus group and a record on the website."),
            "props": [
                p("cohort_id", "no identifier in any system", A),
                p("intake", spec["intake"], D),
                p("starts_on", spec["starts_on"], D),
                # Issue 83. This used to be the number of session tiles the drawing carries,
                # which made it a statement about the picture wearing the clothes of a statement
                # about the cohort: a reader asking how many sessions this cohort holds got the
                # answer six on every one of the seven routes. A cohort holds one delivery per
                # syllabus row, so the total is the syllabus total, and it is `estimated` and
                # not `dummy` because that one-per-row correspondence is an inference from the
                # syllabus rather than a number read out of any system.
                p("sessions_scheduled",
                  sample_phrase(len(spec["sessions"]), total, "drawn"), E),
                p("students_enrolled", str(head), D),
            ],
        },
        {
            "id": students, "type": "StudentGroup",
            "label": f"Alumnos {spec['code']} {spec['intake']}",
            "count": str(head),
            # The line under the label, and it is not decoration. Four tiles are not a cohort, and
            # a drawing that reveals four individuals without saying how many it left out has
            # quietly replaced a cohort with four people. It appears and disappears with the four
            # tiles, and the number in it is computed and never typed.
            "tail": f"and {not_drawn} more, not drawn",
            # #128. The fraction stays, because it is the measured fact: how many of the
            # cohort the click draws. Everything else went. Z-IB carried an override of this
            # sentence that differed from the other six only in spelling its two numbers out,
            # so the override went with it and the seven now read one way.
            "note": (f"One card for the whole cohort. Clicking it draws {drawn} of the {head} "
                     f"as individual Student objects, with the count of the rest underneath."),
            "props": [
                p("headcount", str(head), D),
                p("representation", f"one card for {head}, {drawn} drawn on click", E),
                p("individual_records", f"{head} invented rows, no real roster", D),
                p("not_drawn", str(not_drawn), D),
                p("completion_rate", "not modelled", D),
            ],
        },
        {
            "id": enrol, "type": "Enrolment", "label": "Enrolment 0001",
            "props": [
                p("enrolment_id", "ENR-0001", D),
                p("stands_for", f"{head} enrolments, one drawn", E),
                p("enrolled_on", spec["enrolled_on"], D),
                p("status", "active", D),
            ],
        },
        {
            "id": agree, "type": "Agreement", "label": "Agreement 0001",
            "props": [
                p("agreement_id", "AGR-0001", D),
                p("total_price", "4.000,00 EUR", D),
                p("instalments", "4", D),
                p("signed_on", spec["enrolled_on"], D),
            ],
        },
        {
            "id": charge, "type": "Charge", "label": "Charge 0001",
            "props": [
                p("charge_id", "CHG-0001", D),
                p("amount", "1.000,00 EUR", D),
                p("due_on", spec["due_on"], D),
                # The drawn charge is the first student's charge, so its state is read off that
                # student's row rather than typed here. Two places saying "unpaid" is one place to
                # forget when the roster changes, and the disagreement would be invisible: the
                # tile and the card would each look right on their own.
                p("state", roster[0][3], D),
                p("payer_identity", "not resolved", E),
            ],
        },
        {
            "id": claim, "type": "Claim", "label": "Claim 0001",
            "props": [
                p("claim_id", "CLM-0001", D),
                p("amount_claimed", "1.000,00 EUR", D),
                p("raised_on", spec["raised_on"], D),
                p("stage", "first reminder", D),
            ],
        },
    ]
    edges = [
        (students, cohort, "enrolled in"),
        (students, enrol, "recorded as"),
        (enrol, agree, "governed by"),
        (agree, charge, "schedules"),
        (students, charge, "pays"),
        (claim, charge, "claims against"),
    ]

    # ---- the four students that are drawn -----------------------------------
    # Four and not the whole cohort. What a reader has to see here is the shape of a Student
    # record and the fact that it joins the rest of the model; the cohort as a population is a
    # different question and its answer is the full list carried beside the drawing.
    #
    # ONE VERB, AND THE REVEAL KEYS ON IT. 'member of' belongs to these four edges and to nothing
    # else on the page, which is what lets app.js derive the hidden set by walking the edges
    # rather than by holding a list of ids or by keying on the Student type. A fifth student
    # added here joins the rule by existing.
    for i, (name, uni, yob, state) in enumerate(roster[:drawn], start=1):
        # Enrolment 0001 and charge 0001 are the ones the drawing carries as nodes; the others
        # exist in the model and are not drawn, which the row says rather than leaving a reader
        # to assume that ENR-0002 is missing.
        tag = ", drawn" if i == 1 else ", not drawn"
        nodes.append({
            "id": f"{pfx}s{i}", "type": "Student", "label": name,
            # The tile and the roster row below are one person, so they are seeded on the person
            # and not on either drawing id. The identity loop at the foot of this file reads it
            # and takes it back off; nothing downstream ever sees the seed.
            "source_seed": f"{pfx}STU-{i:04d}",
            # NO NOTE, #128, AND IT IS THE LARGEST SINGLE CUT ON THE PAGE: fifty six tiles across
            # the seven drawings carried the same two hundred and eighty characters. Half of it
            # said why this card is drawn at all, which is a rationale and not a fact about the
            # object; the other half said the person is invented, which is the standing of the
            # page's own content and is the sentence #110 took off every other surface. The
            # properties under it are the object.
            "props": [
                p("name", "invented", D),
                p("university", uni, D),
                # year and not date, on purpose: see the note above ROSTER.
                p("year_of_birth", yob, D),
                p("recorded_as", f"ENR-{i:04d}{tag}", D),
                p("charge", f"CHG-{i:04d}{tag}", D),
                p("charge_state", state, D),
            ],
        })
        edges.append((f"{pfx}s{i}", students, "member of"))

    target_of = {"agree": agree, "claim": claim, "charge": charge}
    for gid, label, verb, attaches_to, target, note in GHOST_SPEC:
        nodes.append(g(pfx + gid, label, verb, attaches_to, note))
        edges.append((pfx + gid, target_of[target], verb))

    # A roster row is a Student, so it carries identity on the same terms a drawn Student tile
    # does, seeded on the person. Four of these rows are also tiles and the pair then holds one
    # source key under two drawing ids, which is checked at the foot of this file rather than
    # asserted here. The system it is keyed in is read off the Student class's own registry entry
    # and not out of a table beside it, which is issue 72's whole point: a roster row and a
    # Student tile cannot end up keyed in two different systems, because there is one place that
    # says which system holds a Student.
    _stu = ROUTES[CLASS_OF_TYPE["Student"]]["system"]
    rows = [
        {
            "id": f"STU-{i:04d}",
            "name": name,
            "uni": uni,
            "yob": yob,
            "enrol": f"ENR-{i:04d}",
            "state": state,
            "node": f"{pfx}s{i}" if i <= drawn else None,
            "source_system": _stu,
            "source_key": source_key(_stu, f"{pfx}STU-{i:04d}"),
        }
        for i, (name, uni, yob, state) in enumerate(roster, start=1)
    ]
    return nodes, edges, {"n": head, "drawn": drawn, "owner": students, "rows": rows}


# ---- assemble the seven -----------------------------------------------------
check_syllabus_counts()
check_module_structure()
# ---- the second grain, issue 89 ----------------------------------------------
# THE OWNER ASKED FOR A WAY TO WORK WITH THE DRAWING RATHER THAN TO READ IT: "aggregating /
# disaggregating sessions / instances into modules and back", with "this will be a management
# tool" named as the north star. So a view is drawn at two ALTITUDES and the reader picks one.
#
# BOTH ARE BUILT HERE AND LAID OUT AT BUILD TIME, which is the decision the card made and the one
# thing about it that is not open. The drawing is a pure function of the model behind a digest
# check_build.sh reproduces byte for byte; laying out a second node set in the browser would put
# the collapsed picture outside every guarantee the first one has. A grain is TWO states, so both
# can be precomputed; a time window is a continuous parameter over 24 weeks and cannot be, which
# is why issue 100's filter is a run-time transform and this is not.
#
# WHAT COLLAPSES AND WHAT DOES NOT. Both syllabus lanes collapse or neither is worth doing: Z-BL
# draws 28 session templates beside 28 cohort sessions, and folding one of the two leaves the
# drawing exactly as tall as it was. So a module becomes TWO tiles, one per lane, joined by the
# same `instance of` the templates and the sessions under them are joined by. That is the drawing
# one altitude up rather than a new picture.
#
# A TEMPLATE IN NO MODULE STAYS ITSELF, and that is the honest answer rather than a special case.
# Collapsing cannot put a session in a module the syllabus does not put it in. Z-CFA names no
# module on any of its 45 rows, so its modules grain draws the same six template tiles it always
# drew and says so in the lane caption; Z-HR names one on four rows of twenty five, so two of its
# six drawn templates stay loose beside four modules. The control is never dead and never lies.
MONTHS_ES = ("ene", "feb", "mar", "abr", "may", "jun",
             "jul", "ago", "sep", "oct", "nov", "dic")


def short_date(when):
    """`2026-01-14 18:30` -> `14 ene`, the form the cohort session labels are already written in.

    Derived and then CHECKED against those labels rather than trusted, in collapse_view below:
    the two would otherwise be two spellings of one date with nothing holding them together.
    """
    y, m, d = when.split(" ")[0].split("-")
    return f"{int(d)} {MONTHS_ES[int(m) - 1]}"


def edge_count(e):
    """How many relationships one drawn edge stands for. One, unless a collapse folded it.

    A FIFTH ELEMENT AND NOT A FOURTH, because the fourth is issue 75's declared ghost and every
    reader of an edge tuple already goes through edge_parts() for it. This is read through its own
    accessor for the same reason: a count that some readers see and others do not is a count that
    goes missing on the one page that needed it.
    """
    return e[4] if len(e) > 4 else 1


def collapse_view(spec, view):
    """One programme's view at module grain: the same objects, two lanes one altitude up.

    Every session template that names a module becomes part of a Module tile, every cohort
    session whose template names one becomes part of a Module delivery tile, and every
    relationship crossing either lane is retargeted onto the tile that swallowed its end and
    FOLDED, one line per surviving pair per verb, with the count it stands for travelling on the
    edge. The verb is unchanged, which is load bearing rather than tidy: selection.js's reveal
    table is keyed by verb, and site/render.js paints a folded line's count into its own <title>.
    """
    key, pfx = spec["key"], spec["pfx"]
    mods = {c: (n, k) for c, n, k in SYLLABUS_MODULES[key]}
    rows = SYLLABUS_ROWS[key]
    total = SYLLABUS_SESSIONS[key]
    nodes_by_id = {n["id"]: n for n in view["nodes"]}

    def prop(n, k):
        for r in n["props"]:
            if r["k"] == k:
                return r["v"]
        raise SystemExit(f"model: {key} node {n['id']} has no {k} row to collapse on.")

    # Which module each drawn template names, and which template each drawn session runs. The
    # second is read off the `instance of` edges rather than off a table, so a session whose
    # template changed cannot keep the module it used to be in.
    mod_of_tpl, tpl_of_cs = {}, {}
    for n in view["nodes"]:
        if n["type"] == "SessionTemplate":
            mod_of_tpl[n["id"]] = rows[n["id"]][0]
    for e in view["edges"]:
        s, t, verb, _g = edge_parts(e)
        if verb == "instance of":
            tpl_of_cs[s] = t

    tpl_in, cs_in = {}, {}
    for tid, code in mod_of_tpl.items():
        if code:
            tpl_in.setdefault(code, []).append(tid)
    for n in view["nodes"]:
        if n["type"] != "CohortSession":
            continue
        tid = tpl_of_cs.get(n["id"])
        if tid is None:
            raise SystemExit(f"model: {key} cohort session {n['id']} is an instance of nothing, "
                             f"so the module grain has no lane to put it in.")
        code = mod_of_tpl.get(tid)
        if code:
            cs_in.setdefault(code, []).append(n["id"])
        # The label and the timestamp are two spellings of one date and nothing held them
        # together until this grain needed the second one. Checked on all 83 rather than assumed.
        short = short_date(prop(n, "scheduled_at"))
        if not n["label"].endswith(short):
            raise SystemExit(f"model: {key} {n['id']} is labelled {n['label']!r} and is scheduled "
                             f"at {prop(n, 'scheduled_at')!r}, which reads {short!r}. The module "
                             f"grain labels a delivery from the timestamp and the two have to be "
                             f"the same date.")

    swallow, nodes, edges = {}, [], []
    order = [c for c, _n, _k in SYLLABUS_MODULES[key] if c in tpl_in or c in cs_in]

    for code in order:
        name, in_syllabus = mods[code]
        drawn = sorted(tpl_in.get(code, []), key=lambda i: rows[i][1])
        if drawn:
            mid = f"{pfx}mod_{code.lower()}"
            seqs = [rows[i][1] for i in drawn]
            span = (f"{seqs[0]} of {total}" if len(seqs) == 1
                    else f"{seqs[0]} to {seqs[-1]} of {total}")
            nodes.append({
                "id": mid, "type": "Module", "label": f"{code} {name}",
                # What a registry entry of its own would have said, on the tile, because it is a
                # statement about this object and not about how its rows are populated. The
                # module is real and published; the module OBJECT is not, anywhere.
                # #128 kept the finding and took the second sentence off: it read the count on
                # the tile's own face back to the reader looking at it.
                "note": ("A module is real and is published on every syllabus note, and no "
                         "system holds a module as a row: it is a value repeated on the rows it "
                         "groups."),
                # THE COUNT IS THE WHOLE POINT AND IT IS ON THE TILE'S FACE. #83 set the idiom
                # and #100 shipped a follow-up commit to stop a lane veiling its own outside
                # count; an aggregate that loses the number is how a management tool starts
                # lying. The numeral inside the tile and the card stack behind it are the
                # drawing's own aggregate idiom, the one the students card has carried since #41.
                "count": str(len(drawn)) if len(drawn) > 1 else None,
                "tail": sample_phrase(len(drawn), in_syllabus, "session templates",
                                      "session template"),
                "props": [
                    p("module_code", code, R, SYLLABUS_RANK),
                    p("module_name", name, R, SYLLABUS_RANK),
                    p("session_templates", sample_phrase(len(drawn), in_syllabus,
                                                         "in this module"), E),
                    p("in_the_syllabus", f"{in_syllabus} of the {total} sessions", R,
                      SYLLABUS_RANK),
                    p("sequence", span, R, SYLLABUS_RANK),
                ],
            })
            for tid in drawn:
                swallow[tid] = mid
        ran = sorted(cs_in.get(code, []), key=lambda i: prop(nodes_by_id[i], "scheduled_at"))
        if ran:
            did = f"{pfx}mdel_{code.lower()}"
            first = prop(nodes_by_id[ran[0]], "scheduled_at")
            last = prop(nodes_by_id[ran[-1]], "scheduled_at")
            when = (short_date(first) if len(ran) == 1
                    else f"{short_date(first)} a {short_date(last)}")
            taught = sum(1 for i in ran if prop(nodes_by_id[i], "teacher_assigned") == "yes")
            states = sorted({prop(nodes_by_id[i], "state") for i in ran})
            nodes.append({
                "id": did, "type": "ModuleDelivery", "label": f"{code}, {when}",
                # The weaker of the two findings, and the one this grain adds. A module in a term
                # is not a value on anything: it is the calendar rows whose template names that
                # module, and nothing groups them, names an owner for them or creates a row when
                # one begins or ends.
                # #128 dropped the opening sentence, which named the tile the reader has just
                # opened. All three absences are kept.
                "note": ("Nothing groups the sessions of one module in a term: they can only be "
                         "picked out as the calendar rows whose template names it, no row is "
                         "created when one begins or ends, and no role owns them."),
                "count": str(len(ran)) if len(ran) > 1 else None,
                "tail": sample_phrase(len(ran), in_syllabus, "sessions", "session"),
                "props": [
                    p("module", f"{code} {name}", R, SYLLABUS_RANK),
                    p("cohort_sessions", sample_phrase(len(ran), in_syllabus,
                                                       "in this module"), E),
                    p("first_session", first, D),
                    p("last_session", last, D),
                    (p("teacher_assigned", f"{taught} of {len(ran)}", D) if taught
                     else p("teacher_assigned", "no", A)),
                    p("state", ", ".join(states), D),
                    p("recording_ref", "none", D),
                ],
            })
            for cid in ran:
                swallow[cid] = did

    for n in view["nodes"]:
        if n["id"] in swallow:
            continue
        nodes.append(copy.deepcopy(n))

    # ---- the edges, and what a fold may not do -------------------------------------------
    # Retarget, then fold by the pair and the verb. A relationship whose two ends land on the
    # SAME tile is inside that module and cannot be drawn between two lanes at all; it is counted
    # and reported rather than dropped in silence, which is issue 100's rule for the same case.
    folded, out, inside = {}, [], 0
    for e in view["edges"]:
        s, t, verb, ghost = edge_parts(e)
        s, t = swallow.get(s, s), swallow.get(t, t)
        if s == t:
            inside += 1
            continue
        k = (s, t, verb, ghost)
        if k in folded:
            folded[k][4] += 1
            continue
        folded[k] = [s, t, verb, ghost, 1]
        out.append(folded[k])
    edges = [(r[0], r[1], r[2], r[3], r[4]) for r in out]
    return {
        "key": key, "code": spec["code"], "name": spec["name"],
        "label": f"{spec['code']} {spec['name']}",
        "grain": "modules", "nodes": nodes, "edges": edges, "roster": view["roster"],
        "counts": {
            # What the fold cost, in the counts block so that it is walked by the same gate every
            # other block here is walked by. `folded` is how many relationships the drawn lines
            # stand for beyond themselves and `inside` is how many have both ends in one module
            # and cannot be drawn between two lanes at all. Neither may be silent: a collapse
            # that quietly loses a relationship is the aggregate version of a lane hiding its own
            # outside count, which is the defect issue 100 shipped a second commit to remove.
            "Relationship": {"drawn": len(edges),
                             "folded": sum(r[4] - 1 for r in out),
                             "inside": inside},
            "SessionTemplate": {
                "drawn": sum(1 for n in nodes if n["type"] == "SessionTemplate"),
                "total": total},
            "CohortSession": {
                "drawn": sum(1 for n in nodes if n["type"] == "CohortSession"),
                "total": total},
            "Module": {
                "drawn": sum(1 for n in nodes if n["type"] == "Module"),
                "total": len(SYLLABUS_MODULES[key])},
            "ModuleDelivery": {
                "drawn": sum(1 for n in nodes if n["type"] == "ModuleDelivery"),
                "total": len(SYLLABUS_MODULES[key])},
        },
    }


VIEWS = []
for _spec in PROGRAMMES:
    if "roster" not in _spec:
        _spec["roster"] = cohort_roster(_spec["headcount"], _spec["roster_offset"])
    if len(_spec["roster"]) != _spec["headcount"]:
        raise SystemExit(f"model: {_spec['key']} says {_spec['headcount']} students and its "
                         f"roster holds {len(_spec['roster'])}")
    _pn, _pe = programme_block(_spec)
    _tn, _te, _roster = tail_block(_spec)
    VIEWS.append({
        "key": _spec["key"], "code": _spec["code"], "name": _spec["name"],
        "label": f"{_spec['code']} {_spec['name']}",
        # Issue 89. Which altitude this view is drawn at. Declared on both grains rather than
        # inferred from what a view holds, because "draws no Module tile" is true of Z-CFA's
        # modules grain as well as of every sessions grain, and the lane caption over the two has
        # to say different things.
        "grain": "sessions",
        "nodes": _pn + _tn, "edges": _pe + _te, "roster": _roster,
        # ---- how much of the syllabus this view draws, issue 83 -----------------------------
        # `drawn` is counted off the nodes that were just built and never declared, so a view
        # cannot state a sample it does not draw. `total` is the one declared number, and it is
        # the same one the Programme and Cohort tiles above are written from. It sits in the
        # instance document rather than in the layout because how much of a thing a document
        # holds is a fact about the document; what the band caption then says about it is the
        # layout's own sentence, in build/build_layout.py.
        "counts": {
            "SessionTemplate": {
                "drawn": sum(1 for _n in _pn if _n["type"] == "SessionTemplate"),
                "total": SYLLABUS_SESSIONS[_spec["key"]]},
            "CohortSession": {
                "drawn": sum(1 for _n in _pn if _n["type"] == "CohortSession"),
                "total": SYLLABUS_SESSIONS[_spec["key"]]},
            # Issue 89, and it is here on the sessions grain too, reading zero, because
            # build/bands.py measures every caption line any view could be given and a block that
            # existed on half the views would make that union unbuildable.
            "Module": {
                "drawn": sum(1 for _n in _pn if _n["type"] == "Module"),
                "total": len(SYLLABUS_MODULES[_spec["key"]])},
            "ModuleDelivery": {
                "drawn": sum(1 for _n in _pn if _n["type"] == "ModuleDelivery"),
                "total": len(SYLLABUS_MODULES[_spec["key"]])},
            "Relationship": {"drawn": len(_pe + _te), "folded": 0, "inside": 0},
        },
    })

# ---- and the second grain, in a list of its own -------------------------------
# NOT APPENDED TO VIEWS, AND THE REASON IS A MEASURED ONE RATHER THAN A PREFERENCE. `views` means
# "the seven programmes" to every reader of these bytes, and it is walked by readers this build
# does not own: scripts/smoke.mjs recomputes the gap total off window.GI as an INDEPENDENT check
# of the number the header prints, and it walks them by position against the seven drawings. A
# fourteen entry list made that driver count 146 where the page says 95 and compare Z-SC's
# drawing against Z-IB's document, which is a false regression report about a page that is right.
# A collapsed view is the same objects re-expressed, not more of them, so any reader summing over
# `views` should go on getting the business once.
#
# THE COST IS THAT A SECOND NODE LIST IS EXACTLY WHERE THIS REPOSITORY'S GATES HAVE GONE BLIND
# BEFORE, four times, each recorded in build/build_layout.py's own refuse_mixed(). So it is not
# left to habit: doc_views() below is the one function that answers "every view in this document",
# check_provenance(), check_structure() and refuse_mixed() all ask it, the loops in this file that
# derive a route, a mark, an identity and a name walk ALL_VIEWS, and the structure self-test has a
# probe that plants a defect in `collapsed` and nowhere else.
COLLAPSED = [collapse_view(_spec, _base) for _spec, _base in zip(PROGRAMMES, VIEWS)]

# Every view this model draws, at either altitude. What the loops below have to cover, and what
# build/measure_labels.py measures the strings of.
ALL_VIEWS = VIEWS + COLLAPSED

# One id may name a tile on more than one route, and it must be the same tile when it does: the
# three shared instructors and the four shared employers are the whole point of the exercise, and
# a typo that gave one of them a different label on one route would show up as two people on the
# faculty sheet. Only the values that are genuinely per route are allowed to differ, which is why
# this compares the label and the type and not the properties.
_seen = {}
for _v in ALL_VIEWS:
    for _n in _v["nodes"]:
        _was = _seen.setdefault(_n["id"], (_n["type"], _n["label"], _v["key"]))
        if (_n["type"], _n["label"]) != _was[:2]:
            raise SystemExit(f"model: id {_n['id']} is {_was[0]} {_was[1]!r} on {_was[2]} and "
                             f"{_n['type']} {_n['label']!r} on {_v['key']}. A global id has to "
                             f"name one object.")

# The shipped drawing, and the names the rest of the build already imports. window.G is this one.
NODES = VIEWS[0]["nodes"]
EDGES = VIEWS[0]["edges"]
ROSTER_ROWS = VIEWS[0]["roster"]["rows"]

ALL_NODES = [_n for _v in ALL_VIEWS for _n in _v["nodes"]]
ALL_EDGES = [_e for _v in ALL_VIEWS for _e in _v["edges"]]

# ---- the route goes on every node, and the tiles with none say so -------------
# In front of the object's own properties and not after them. Under the management tool objective
# the first question about any tile is whether it can be filled at all, and the second is what it
# would hold; a panel that answers them the other way round buries the one that decides whether
# the second question is worth asking.
#
# THE MARK IS DERIVED AND NEVER TYPED. A tile carries "no system holds it" exactly when the class
# it belongs to is not attachable, so the drawing, the panel and the registry cannot disagree
# about which classes have nowhere to live. Setting a system on the entry takes the mark off;
# there is no second place to forget. Before issue 72 it read the flag on the route_system row,
# which is now itself derived from the same field, so the mark is one step further from anything
# a person types and lands on exactly the same tiles.
#
# GHOSTS ARE EXEMPT, AND NOT FOR TIDINESS. A ghost tile is already the strongest statement this
# drawing makes: unfilled, dashed, italic, and its type reads "does not exist in any system" at
# the head of the panel, which is the same sentence the mark carries. Marking it as well would
# print the claim three times on one tile. It still gets all four route rows, because "nobody
# writes down an expectation" and "the student, under the income share contract" are answers, and
# a ghost with no answers recorded would be indistinguishable from a ghost nobody looked into.
#
# IT RUNS OVER EVERY VIEW'S OWN NODES AND NOT OVER A SET OF UNIQUE IDS. A shared instructor is a
# different dict on each route it appears on, because sessions_taught is a fact about the route
# and not about the person, and prepending the route rows twice to one shared dict would print
# them twice on one tile.
_BOUND = set()
for _n in ALL_NODES:
    _cid = CLASS_OF_ID.get(_n["id"]) or CLASS_OF_TYPE.get(_n["type"])
    if _cid is None:
        raise SystemExit(f"model: node {_n['id']} ({_n['type']}) belongs to no class in the "
                         f"populate registry. Bind its type in CLASS_OF_TYPE or its id in "
                         f"CLASS_OF_ID, and 'unknown' is written as a route and not omitted.")
    _r = ROUTES[_cid]
    _BOUND.add(_cid)
    if _n.get("mark"):
        raise SystemExit(f"model: node {_n['id']} carries a hand written mark. The mark says "
                         f"whether a system holds the class and is derived from the registry.")
    if "source_system" in _n or "source_key" in _n or "class" in _n:
        raise SystemExit(f"model: node {_n['id']} carries a hand written class or source id. "
                         f"Both are derived from the populate registry, in one place.")
    # ---- identity, seam 4, read off the registry entry the route above already names ---------
    # There is nothing left to reconcile here. Seam 4 had to refuse in both directions because
    # the system name lived in a second table beside the route; issue 72 put it on the entry, so
    # a class with no system HAS no system to carry and the two cannot be made to disagree.
    # _check_registry above is what now holds the pair together, one class at a time.
    _n["class"] = _cid
    _n["source_system"] = _r["system"]
    _n["source_key"] = source_key(_r["system"], _n.pop("source_seed", _n["id"]))
    _rows = route_props(_r)
    # ---- and the way to reach it, at the OTHER end of the list. Issue 157 -------------------
    # AFTER the object's own values and not among them, which is where the reader's questions
    # actually run out: what holds this, what does it say, and then what do I do about it. Read
    # off the same registry entry the route rows come from and built before they are prepended,
    # so `own` is the node's own list and the companion field cannot be confused with a route row
    # of the same name.
    #
    # AND THE SOCKET MACHINERY PICKS THEM UP WITH NO CODE AT ALL. site/app.js counts every row
    # after the route block that is flagged `absent`, so an object with no way to reach it gains
    # an empty ring on its tile and a unit on the header control, in the same device an
    # instructor with no recorded employer has carried since issue 139. That was the whole
    # argument for putting the answer in a flagged row rather than in a new mark.
    _reach = reach_props(_r, _n["id"], _n["props"])
    _n["props"] = _rows + _n["props"] + _reach
    # How many of the rows at the front of the list are the route, so the panel can rule a line
    # under them. A count and not a name: the browser never has to know that a key beginning
    # "route_" is special, and renaming a row here cannot silently move the line.
    _n["route"] = len(_rows)
    # And how many at the BACK of it are the way to reach the object, for the same reason and by
    # the same means. The panel rules a second line above them and turns each one into the act it
    # names; a node with none carries a zero and the panel draws no line.
    _n["reach"] = len(_reach)
    if not _r["attachable"] and not _n.get("ghost"):
        _n["mark"] = NO_SYSTEM

# A class nothing is drawn as is a route nobody can check against a tile, and it is exactly how a
# registry rots: an entry edited for a class that left the model months ago reads as current.
_UNBOUND = sorted(set(ROUTES) - _BOUND)
if _UNBOUND:
    raise SystemExit(f"model: the populate registry declares {', '.join(_UNBOUND)} and no object "
                     f"on any view belongs to that class. Remove the entry or draw the class.")


# ---- and no address this page ships may be capable of being real. Issue 157 ---
# THE HAZARD THIS REFUSES IS NOT A WRONG VALUE, IT IS A VALUE THAT GETS ACTED ON. Every other
# invented figure on this page is read; an address is clicked. Sixteen of the twenty two Company
# tiles carry the name of a firm that exists, so a plausible looking address on one of them is a
# message sent to somebody, and the flag beside it would not have stopped the click.
#
# So the addresses are not merely declared invented, they are built so that they cannot be
# anything else, and this refuses the build over one that is not: `invalid` is the top level
# domain RFC 2606 reserves so that it can never be delegated, and a telephone number of zeros
# cannot exist under E.164. It walks the rows that ship rather than the table they were built
# from, which is the difference between checking the generator and checking the document.
#
# IT REFUSES BOTH WAYS. An address of the wrong form stops the build, and so does a row inside
# the reach block whose value is not an address at all: a reach row silently downgraded to prose
# would leave the panel with nothing to hand a client, which passes every other gate in this file.
# 192 address rows over the fourteen drawings, 59 distinct strings on 29 of the 49 objects, and
# the count is printed so that a rule quietly matching nothing reads as the failure it is.
def check_reach_addresses():
    seen = 0
    for _v in ALL_VIEWS:
        for _n in _v["nodes"]:
            if not _n["reach"]:
                continue
            for _row in _n["props"][len(_n["props"]) - _n["reach"]:]:
                if _row["f"] == A:
                    if _row["k"] != REACH_NONE:
                        raise SystemExit(
                            f"model: {_n['id']} carries a reach row {_row['k']!r} flagged "
                            f"{A!r}. An absence is one row and it is named {REACH_NONE!r}; "
                            f"three of them is one claim printed three times on one tile.")
                    continue
                if _row["k"] not in REACH_ACT:
                    raise SystemExit(f"model: {_n['id']} carries a reach row {_row['k']!r}, "
                                     f"which is not one of {sorted(REACH_ACT)}. A key the "
                                     f"document does not define is an act nobody can read.")
                _hit = _REACH_FORMS[_row["k"]].match(_row["v"])
                if not _hit:
                    raise SystemExit(
                        f"model: {_n['id']} would hand a reader {_row['v']!r} for "
                        f"{_row['k']!r}. Every address this page ships is at a name RFC 2606 "
                        f"reserves so that it can never resolve, or is a number of zeros that "
                        f"can never connect. An address that could be real is the one invented "
                        f"value on this page a reader acts on before they read the flag beside "
                        f"it.")
                # AND THE SHAPE IS NOT ENOUGH, WHICH IS THE HALF A PATTERN CANNOT SEE ON ITS OWN.
                # An address at hr@invalid satisfies the form and names a department; one under
                # meet.invalid ending in a firm's name satisfies it and names that firm. The
                # reserved domain stops the message being delivered and does nothing whatever
                # about what is written in front of it. So whatever the pattern captured has to
                # be this object's own drawing id, compared against the NODE and never against
                # the table that wrote the value.
                _who = _hit.groupdict().get("who")
                if _who is not None and _who != _n["id"]:
                    raise SystemExit(
                        f"model: {_n['id']} ships {_row['v']!r}, which names {_who!r}. An "
                        f"address is built from the drawing id of the object it sits on and "
                        f"from nothing a person typed: a local part or a path naming anything "
                        f"else reads as somebody in particular however unreachable the domain "
                        f"is, and on this page it would be naming the wrong somebody.")
                seen += 1
    if not seen:
        raise SystemExit("model: no object on any view ships a way to reach it, so this rule "
                         "examined nothing and would pass on any document at all.")
    return seen


_REACH_SEEN = check_reach_addresses()
print(f"[model] reach: [verified] {_REACH_SEEN} addresses shipped over the fourteen drawings, every one at "
      f"a reserved name that cannot resolve or a number that cannot connect", file=sys.stderr)

# ---- and identity has to join, which is the only reason to carry it ----------
# A key that names two objects is worse than no key, because a join on it silently merges them.
# The shared instructors and the shared employers are the case that matters: one person appears
# on several routes as several dicts and must carry one key, and two different people must never
# collide onto one. Checked over every node on every view rather than over a set of unique ids.
_by_key = {}
for _n in ALL_NODES:
    if _n["source_key"] is None:
        continue
    _was = _by_key.setdefault(_n["source_key"], _n["id"])
    if _was != _n["id"]:
        raise SystemExit(f"model: source key {_n['source_key']} names {_was} and {_n['id']}. A "
                         f"key that names two objects merges them the first time anything joins.")

# The drawn student and the roster row are one person under two drawing ids, and the source key
# is the only thing in this model that says so. If that ever stops holding, the column has
# nothing to demonstrate and the failure would be invisible: both halves would look right alone.
for _v in ALL_VIEWS:
    _nodes_by_id = {_n["id"]: _n for _n in _v["nodes"]}
    for _row in _v["roster"]["rows"]:
        if not _row["node"]:
            continue
        _tile = _nodes_by_id[_row["node"]]
        if _tile["source_key"] != _row["source_key"]:
            raise SystemExit(
                f"model: {_v['key']} draws {_row['node']} for roster row {_row['id']} and the "
                f"two carry different source keys, {_tile['source_key']} and "
                f"{_row['source_key']}. They are one person.")

# ---- and the whole of it, once it is assembled ------------------------------
# Every string this model puts on any of the seven pages, through the same check the roster went
# through above: labels, property keys and values, notes, marks, the tail, the verbs, the type
# names. The roster is checked on its own first so that a bad name is reported as a row number
# rather than as a node id, and everything is checked here so that nothing gets through by not
# being a name. Comments are not in this set and do not need to be: the repository gate reads the
# file whole, which is how a real name in a comment in this very block was caught.
#
# THE REGISTRY IS IN THIS SET TOO, and it is not a formality. Every string it ships is on the
# public page: seventeen class names, the systems, the units, the partitions, the tokens, the
# citations and the whole of every vocabulary. A registry is exactly the sort of document a role
# quietly becomes a person's name in, and the folding treats "notion" and a surname alike.
_strings = [("TYPES", t[1]) for t in TYPES]
_strings += [(f"registry {_cid} {_k}", _s)
             for _cid, _e in ROUTES.items()
             for _k, _s in (("class", _e["class"]), ("system", _e["system"]),
                            ("unit", _e["unit"]), ("partition", _e["partition"]),
                            ("absence", _e["absence"]), ("read", _e["read"]),
                            ("key", _e["key"]["status"]), ("source", _e["source"]),
                            ("role", _e["entered_by"]["role"]),
                            ("event", _e["event"]["token"]),
                            ("adapter", _e["adapter"]["status"]))
             if _s]
_strings += [(f"registry {_cid} caveat", _c) for _cid, _e in ROUTES.items() for _c in _e["caveats"]]
_strings += [(f"registry vocabulary {_name}", _s)
             for _name, _tbl in (("read", READ_STATE), ("adapter", ADAPTER_STATE),
                                 ("key", KEY_STATE), ("field", FIELD_STATE), ("role", ROLE),
                                 ("absence", ABSENCE), ("caveat", CAVEAT), ("act", REACH_ACT))
             for _tok, _why in _tbl.items() for _s in (_tok, _why)]
# The provenance vocabularies ship on the public page for the same reason the registry's do, so
# they go through the same folding. Issue 73.
_strings += [(f"provenance vocabulary {_name}", _s)
             for _name, _tbl in (("rank", VALUE_RANK), ("status", VALUE_STATUS),
                                 ("stance", STANCE))
             for _tok, _why in _tbl.items() for _s in (_tok, _why)]
for _v in ALL_VIEWS:
    for _n in _v["nodes"]:
        _w = f"{_v['key']} node {_n['id']}"
        _strings.append((_w, _n["label"]))
        for _k in ("note", "mark", "tail", "source_system", "source_key"):
            if _n.get(_k):
                _strings.append((f"{_w} {_k}", _n[_k]))
        for _pr in _n["props"]:
            _strings += [(f"{_w} prop {_pr['k']}", _pr["k"]),
                         (f"{_w} prop {_pr['k']}", _pr["v"])]
    _strings += [(f"{_v['key']} edge {_e[0]}->{_e[1]}", edge_parts(_e)[2]) for _e in _v["edges"]]
    _strings += [(f"{_v['key']} roster {_r['id']}", _r[_f])
                 for _r in _v["roster"]["rows"]
                 for _f in ("name", "uni", "state", "source_system", "source_key")]
# THE AGENDA BLOCK GOES THROUGH THE NAME GATE TOO, AND IT DID NOT BEFORE ISSUE 108. It is a
# top-level block of the instance document, so the node walk above cannot reach it, and this is
# the fourth time this file has had to say out loud that a block no walk reads is where the next
# unchecked string lands: the registry, the provenance block, the counts block, and now this.
# scripts/check_repo.sh would still have caught a collision in the built bytes, so the hole was
# a late refusal rather than an open door, but it was a refusal after the drawing was written
# instead of before it. It matters more from this card on than it did before: the beats are now
# written in the vocabulary of a syllabus, and a method named after the person who published it
# is exactly how a real surname arrives in academic prose. The drafting rule is the descriptive
# form over the eponym; this is the check that the rule was kept.
_strings += [(f"session agenda {_tid} {_lab}", _s)
             for _tid, _rs in TEMPLATE_AGENDA.items() for _lab, _line in _rs
             for _s in (_lab, _line)]
_check_names(_strings)


# ---- a session template is not a session, and the source does not agree ------
# Issue 78 found one Z-SC template labelled with a venue and a start time, which are properties
# of a DELIVERY. Issue 83 then took the same two routes from six rows to twenty eight and twenty
# five, drawing fifty three rows of a source that carries at least six more of the same kind of
# string, and the reasoning that caught the first one was a reading somebody did once. So it is a
# gate.
#
# THREE MARKS, AND EACH IS A DELIVERY IN DISGUISE. A clock says when this one ran. An `@` says
# where. A date says which occurrence. A template has none of the three, and the tile carrying
# one would be sitting on the template side of the split that this whole drawing exists to
# demonstrate. The cohort session beside it is where all three belong, and `scheduled_at` on it
# already holds two of them.
#
# It reads the emitted labels rather than the declaration, so a string arriving through an
# override or through some later route into a label meets the same rule.
_TEMPLATE_INSTANCE_MARKS = (
    (re.compile(r"\d{1,2}[.:]\d{2}\s*h?\b"), "a clock time"),
    (re.compile(r"@"), "an @ venue"),
    (re.compile(r"\b\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?\b"), "a date"),
    (re.compile(r"\b\d{1,2}\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b", re.I),
     "a date"),
)
_instance_like = []
for _v in ALL_VIEWS:
    for _n in _v["nodes"]:
        if _n["type"] != "SessionTemplate":
            continue
        for _rx, _what in _TEMPLATE_INSTANCE_MARKS:
            if _rx.search(_n["label"]):
                _instance_like.append((f"{_v['key']} {_n['id']}", _what, _n["label"]))
if _instance_like:
    for _where, _what, _lab in _instance_like:
        print(f"[model] {_where} is a session template labelled with {_what}: {_lab!r}")
    raise SystemExit("[model] refusing to build a template that is really an instance. A clock, "
                     "a venue and a date are properties of a delivery; the vault separates "
                     "`title_raw` from `name_norm` for exactly this, and `name_norm` is the "
                     "label to take.")
_n_templates = sum(1 for _v in ALL_VIEWS for _n in _v["nodes"]
                   if _n["type"] == "SessionTemplate")
print(f"[model] session templates: [verified] {_n_templates} scanned, none carries a clock, an @ venue or "
      f"a date", file=sys.stderr)

# ---- the per session agendas cover the templates, carry the schema, and none is a copy -------
# TEMPLATE_AGENDA is written by hand against the titles, and three things about a hand written
# table of that size go wrong silently. A template renamed or renumbered leaves its entry
# stranded and the row it belongs to blank, which the page would draw as an absence nobody
# declared. Eighty three short pieces of writing under one brief drift towards one shape, which
# is the exact failure the owner's instruction named; two templates carrying the same beat is
# the mechanical half of that failure and it is checkable, so it is checked rather than promised.
# The other half, whether a beat is about its own session, is a judgement and is not claimed
# here.
#
# AND THE THIRD IS NEW WITH ISSUE 108'S SECOND HALF. The four labels are a schema and not a
# habit, so a beat labelled outside the closed set, a label used twice in one session, a label
# out of the reading order, or a session missing one of the three compulsory rungs is refused
# here rather than noticed later by a reader. Without this the labels are a convention, which is
# what the ordinals they replaced already were.
AGENDA_LABELS = ("scope", "method", "practicum", "outcome")
AGENDA_LABELS_REQUIRED = ("scope", "method", "outcome")
_drawn_templates = [_n["id"] for _v in VIEWS for _n in _v["nodes"]
                    if _n["type"] == "SessionTemplate"]
_agenda_missing = [_i for _i in _drawn_templates if _i not in TEMPLATE_AGENDA]
_agenda_stray = [_k for _k in TEMPLATE_AGENDA if _k not in set(_drawn_templates)]
_agenda_short = [_k for _k, _rs in TEMPLATE_AGENDA.items() if not 3 <= len(_rs) <= 4]
_agenda_labels_bad = []
for _k, _rs in TEMPLATE_AGENDA.items():
    _labs = [_lab for _lab, _t in _rs]
    if [_l for _l in _labs if _l not in AGENDA_LABELS]:
        _agenda_labels_bad.append((_k, _labs, "a label outside the closed set"))
    elif len(set(_labs)) != len(_labs):
        _agenda_labels_bad.append((_k, _labs, "the same label twice"))
    elif [AGENDA_LABELS.index(_l) for _l in _labs] \
            != sorted(AGENDA_LABELS.index(_l) for _l in _labs):
        _agenda_labels_bad.append((_k, _labs, "the labels out of their reading order"))
    elif [_r for _r in AGENDA_LABELS_REQUIRED if _r not in _labs]:
        _agenda_labels_bad.append((_k, _labs, "a compulsory rung missing"))
_agenda_seen = {}
_agenda_repeat = []
for _k, _rs in TEMPLATE_AGENDA.items():
    for _lab, _line in _rs:
        if _line in _agenda_seen:
            _agenda_repeat.append((_line, _agenda_seen[_line], _k))
        _agenda_seen[_line] = _k
if _agenda_missing or _agenda_stray or _agenda_short or _agenda_repeat or _agenda_labels_bad:
    for _i in _agenda_missing:
        print(f"[model] session template {_i} is drawn and has no agenda written for it")
    for _k in _agenda_stray:
        print(f"[model] an agenda is written for {_k}, which no view draws")
    for _k in _agenda_short:
        print(f"[model] the agenda for {_k} has {len(TEMPLATE_AGENDA[_k])} beats, and the brief "
              f"is three or four")
    for _k, _labs, _why in _agenda_labels_bad:
        print(f"[model] the agenda for {_k} is labelled {_labs}, which is {_why}. The schema is "
              f"{list(AGENDA_LABELS)}, in that order, with {list(AGENDA_LABELS_REQUIRED)} "
              f"compulsory")
    for _line, _a, _b in _agenda_repeat:
        print(f"[model] {_a} and {_b} carry the same beat: {_line!r}")
    raise SystemExit("[model] refusing to build the per session agendas. They cover the drawn "
                     "templates exactly, they are three or four beats each, every beat carries "
                     "a label from the closed schema in reading order, and no beat appears "
                     "twice, or the block is not the thing the card asked for.")
print(f"[model] session agendas: [verified] {len(TEMPLATE_AGENDA)} written, one per drawn template, "
      f"{sum(len(_rs) for _rs in TEMPLATE_AGENDA.values())} beats, none repeated, every one "
      f"labelled from {list(AGENDA_LABELS)}",
      file=sys.stderr)

# ---- the palette is a claim about a surface ---------------------------------
# Each of the thirteen colours above is painted as a tile's stroke, at full opacity, and again
# as a wash inside it: 14 per cent of the same colour for twelve of them, and 7 per cent for the
# ghost. The stroke is the one that has to be legible on its own, because it is the boundary of
# the tile and the tile is a control: it takes focus, it takes a click, and it is what a reader
# picks a type out by.
#
# WHICH SURFACE THE STROKE SITS ON. Established by reading the drawing rather than chosen.
# site/render.js draws one `rect.band` per lane before it draws anything else, `.band` is filled
# with an opaque `var(--bg-band)` in app.css, the bands span every column of the drawing and run
# from `bandTop` to four units off the bottom, and every tile is laid out inside a lane. So a
# tile's stroke sits on the band plate, in both themes, and never on the page ground. The two are
# different colours and the difference is not cosmetic: it moves the verdict for two of the
# twenty-six measurements, Session template and Cohort on the light side, both of which pass on
# the plate and would fail on the ground. It moved three before the dark siblings landed, the
# third being Agreement in dark, which failed on the plate and passed on the ground; that one
# now passes on both. The ground is measured as well and reported for exactly that reason, and
# it is not the surface anything is judged against.
#
# THE PLATE IS ITS OWN TOKEN SINCE ISSUE 81 AND IT IS NO LONGER THE PANEL COLOUR. `.band` was
# filled with `var(--bg-panel)` until that card softened the lanes onto `var(--bg-band)`, and
# nothing in this file had to be told: the surface is found by reading the var() out of the
# `.band` rule, so the measurement followed the paint. What the card actually moved is the
# denominator of all twenty-six rows, toward the page ground and by a little under half the step
# in each theme:
#
#   light   #ffffff -> #fafbfc   the ground it is stepping toward is #f6f7f9
#   dark    #252a31 -> #20252c   the ground it is stepping toward is #1c2127
#
# In LIGHT every ratio falls, because the plate is moving toward the type colours; the binding
# one is Session template at 3.1440 -> 3.0346, and the light plate goes exactly as far as that
# figure allows and stops. In DARK every ratio RISES, because the dark plate is lighter than the
# dark ground, so stepping back toward the ground is stepping away from the strokes; the lowest
# is Cohort at 4.5374 -> 4.8431. The card is therefore constrained entirely on the light side,
# and the dark plate takes the same fraction as light rather than the freedom it has, so that
# the two themes stay one drawing rather than two.
#
# AND A SURFACE THAT USED TO BE COVERED BY ACCIDENT NO LONGER IS. While the plate and the panel
# were one token, this check happened to measure both: the panel's nine pixel type swatch, which
# issue 69 left carrying the type colour as a graphical object, is painted on `--bg-panel`, and
# that was the same hex as the plate. It is not any more. The swatch is not gated here and never
# was named; on `--bg-panel` unchanged its worst case is Cohort at 4.5374 in dark and the ghost
# grey at 2.8807 in light, which is the ghost's own declared exception in another place. The
# hole is stated rather than closed because closing it means a third surface in every row and a
# parser change in scripts/check_repo.sh, which is a card and not a footnote.
#
# THE STROKE HAS TWO NEIGHBOURS AND ONLY ONE OF THEM IS GATED, which is a limit of this check and
# is written down here rather than left to be found. Outside the stroke is the plate. Inside it
# is the tile's own wash, a tint of the same hex composited over that plate, which is by
# construction nearer the stroke colour than the plate is, so the inner comparison is always the
# harder one. It used to be harder by enough to matter, seven colours clearing 3:1 on the plate
# and under it against their own fill. The dark siblings took five of those seven with them:
# what is left is Session template at 2.6156 and Cohort at 2.6517, both on the light side, and
# the dark side no longer has one. The limit is real and it is now much smaller than the card
# that named it found it. Those two figures were 2.6905 and 2.7477 before issue 81 softened the
# plate, and the re-measurement is the point rather than the drop: the wash is composited OVER
# the plate, so a plate that moves moves both sides of this comparison, and what had to be
# checked was whether a THIRD colour crossed under. None did, in either theme; in dark every one
# of the thirteen improved, from a 3.7354 floor to 4.0013. Issue 70 is the card that names this
# limit and its membership is unchanged.
#
# The plate is gated because SC 1.4.11 asks whether an object can be told from what surrounds it,
# and the fill is part of the object rather than its surroundings: a tile is a stroke and a wash
# together, and it is the pair that has to be found on the page. That is also the comparison
# issue 56 chose its dark siblings against, so gating the other one here would put two different
# answers to one question in the repository. It is a defensible line and it is not the only one,
# and moving it inward is a card with a consequence: two more colours under the threshold,
# wanting either two more declarations or a change to the alpha the tint is drawn at.
#
# ONE MORE THING NOT MEASURED. "At full opacity" is true of a tile at rest. `.dim` in app.css
# puts every node that is not adjacent to the selection at 16 per cent while something is
# selected, and nothing here measures that state.
#
# The plate is read out of site/app.css through the custom property `.band` actually paints
# with, not through a hex typed here. Painting the lanes from another token would then move this
# measurement with them instead of leaving it measuring a surface the page no longer has, and a
# token that stops resolving to two values stops the build rather than defaulting to one.
#
# WHERE THE VERDICT IS. Not here. This file computes ratios; scripts/check_repo.sh holds the
# threshold, the declared exceptions and the pass or fail, because it is the only one of the two
# that CI runs on every push and every pull request. No workflow in this repository runs the
# build at all: the generated documents are committed and deployed as they stand. A gate that
# only ever runs
# on the machine of whoever remembered to rebuild is not a gate.
#
# A TYPE CARRIES MORE THAN ONE COLOUR. Issue 56, and the map below is the whole of it on this
# side: the palette is asked for a colour PER GROUND and the check did not move.
#
# THE TARGET IS 4.5 AND NOT 3.0, WHICH IS THE ONE DECISION IN HERE. The gate's threshold is 3:1,
# SC 1.4.11, because a stroke is a boundary. The same thirteen colours were also written as 11px
# bold text at the head of the detail panel, which is SC 1.4.3 and 4.5:1, and app.js wrote that
# colour inline, so no stylesheet reached it. One number fixed both surfaces, and it was the
# higher one. Every sibling holds the other one's hue and its saturation and moves only its
# lightness, so a type is the same colour in both themes and not a different one.
#
# THAT REASON EXPIRED AND THE HEXES DID NOT FOLLOW IT OUT, which is issue 74 and is named here
# rather than acted on. Issue 69 repainted the panel's caption --fg-muted and left the type
# colour there as a nine pixel swatch, which is a graphical object at 3:1, so nothing on the page
# asks 4.5 of these thirteen any more. Ten of them are still carrying a lightness chosen for a
# label that no longer takes them. Issue 81 makes that visible without changing it: on the
# softened light plate five colours that cleared 4.5 no longer do, Instructor at 4.3449, Cohort
# session at 4.4550, Students at 4.4522, Enrolment at 4.4589 and Claim at 4.4046, and not one of
# them owes it. Whoever takes 74 decides what the target is; this file states what it was.
#
# THE LIGHT HALF MOVED TOO, UNDER ISSUE 65, AND THE MAP IS NOW READ IN BOTH DIRECTIONS. Issue 56
# raised lightness to clear the dark plate. Three light colours had been under 3:1 against the
# white plate since the palette was chosen, and two of them are repaired here by the same
# arithmetic run the other way: hold the hue and the saturation, lower the lightness to the first
# value that clears 4.6, and pin the old hex as the dark sibling so the dark page does not move
# by a pixel.
#
#   Cohort session  #d1980b -> #976e08   2.5587 -> 4.6156 on the white plate
#   Students        #8eb125 -> #657e1a   2.4805 -> 4.6127
#
# AND A THIRD COLOUR MOVED THAT NOTHING ASKED FOR, WHICH IS THE ONE JUDGEMENT IN THIS PARAGRAPH.
# Student was at 4.7299 and passing. Darkening Students lands it on top of Student, because
# Student IS the darkened Students: same hue, same family, one shade down, and the shade a
# yellow-green has to reach to clear 4.5 against white is that shade. Measured as CIE76 colour
# difference, the repaired Students sits 3.25 from Student, which is the same colour, against a
# palette whose tightest other pair is 18.18. A gate satisfied by two type colours a reader
# cannot tell apart has been satisfied against its own stated purpose, which is that an outline
# is what one type is told from another by. So the family moved down together:
#
#   Student         #5f7d1f -> #526b1b   4.7299 -> 6.0385, family gap back to 10.94
#
# 10.94 is not a taste: it is the gap issue 56 already shipped between these same two on the dark
# plate, where #8eb125 and #789e27 sit 10.56 apart. The light family is now no closer than the
# dark one has been since that card landed. Reversal, if it is unwanted, is one hex: put #5f7d1f
# back and the only thing that returns is the collision.
#
# THE GHOST GREY DID NOT MOVE AND THAT IS ALSO A DECISION. It is the third light failure, at
# 2.8807 when issue 65 declared it and at 2.7804 on the plate issue 81 softened it onto, and it
# stays the one declared exception at the new figure. The argument is in scripts/check_repo.sh
# beside the declaration, where a reader meets it, and the argument did not move with the
# number: it was never that 2.8807 was close enough, it was that the hex belongs to --c-gray-3
# and the value which would pass renders as a Company.
#
# The three that are absent from this map need nothing: on the dark plate they measure 4.8431
# (Cohort), 4.9025 (Session template) and 5.3506 (the ghost grey). Absent and not written
# out as themselves, so that a reader can see at a glance which colours these cards moved.
#
# THE WASH DID NOT NEED ANYTHING AND IT WAS MEASURED RATHER THAN ASSUMED. A tile is a stroke and
# a 14 per cent wash of the same hex over the band plate. At that alpha, with these hexes, the
# twelve non-ghost fills sit 1.2007 to 1.2753 off the dark plate, unchanged, and on the white
# plate the three that moved all step FURTHER from it than they did: Cohort session 1.1258 to
# 1.1917, Students 1.1238 to 1.1902, Student 1.1895 to 1.2186. The light band narrows from
# 1.1238 to 1.2328 down to 1.1582 to 1.2328, so the flattest fill on the page is less flat than
# it was and nothing was traded for the stroke. The alpha is unchanged and the ghost keeps its
# own 7 per cent. The ungated inner comparison, a stroke against its own wash, is untouched by
# this card: the same two colours are under 3:1 there and they are two this card did not move.
TYPE_COLOUR_DARK = {
    "Programme":     "#c773c7",   # 4.6110 on the plate, 5.1730 on the page ground
    "Company":       "#8793a3",   # 4.6297 / 5.1939
    "Instructor":    "#199adb",   # 4.5980 / 5.1584
    # The three below are not new colours. They are the light palette's own hexes, held here so
    # that repairing the light half leaves the dark half exactly where issue 56 measured it.
    "CohortSession": "#d1980b",   # 5.6437 / 6.3316
    "StudentGroup":  "#8eb125",   # 5.8215 / 6.5311
    "Student":       "#789e27",   # 4.6201 / 5.1832
    "Enrolment":     "#9784e3",   # 4.6249 / 5.1886
    "Agreement":     "#bd8750",   # 4.6384 / 5.2037
    "Charge":        "#eb6a49",   # 4.6006 / 5.1613
    "Claim":         "#e56697",   # 4.5929 / 5.1527
}

# The two constants of the sRGB transfer function, written with a trailing zero. They are the
# one shape scripts/check_repo.sh reads as a Spanish-grouped amount, a digit and a dot and
# exactly three digits, and the repair for that is the number and never the rule. The values are
# unchanged.
_SRGB_OFFSET = 0.0550
_SRGB_SCALE = 1.0550

_CSS_PATH = pathlib.Path(__file__).resolve().parent.parent / "site" / "app.css"
# The two colour schemes this file has to answer about, and the only two there are.
_SCHEMES = ("light", "dark")


# The breakpoint of the transfer function, and it is the 2.1 and 2.2 value rather than 2.0's
# 0.03928. This check cites SC 1.4.11, which is a 2.2 criterion, so it should be arithmetic from
# the same document. Nothing moves: no channel of an 8 bit colour lands between the two, 10/255
# being under both and 11/255 over both, so every ratio in the table is identical either way.
_SRGB_BREAK = 0.04045


def relative_luminance(colour):
    """WCAG 2.x relative luminance of an #rrggbb colour."""
    ch = []
    for i in (1, 3, 5):
        c = int(colour[i:i + 2], 16) / 255
        ch.append(c / 12.92 if c <= _SRGB_BREAK else ((c + _SRGB_OFFSET) / _SRGB_SCALE) ** 2.4)
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]


def contrast_ratio(a, b):
    """WCAG 2.x contrast ratio between two #rrggbb colours. Symmetric, 1 to 21."""
    la, lb = relative_luminance(a), relative_luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def _css_text(raw=None):
    """app.css with its comments removed, which is the only text that paints anything.

    Not fussiness. That file argues with itself at length in comments, several of them naming
    tokens and quoting rules, and a commented-out `.band` above the live one, or the theme
    block's own name written inside a comment, would be picked up by the two readers below and
    would point this whole measurement at a surface nothing is drawn on.

    `raw` defaults to the shipped file. It is a parameter only so that a synthetic stylesheet
    goes through this same stripping on its way into the same reader.
    """
    import re as _re
    if raw is None:
        try:
            raw = _CSS_PATH.read_text(encoding="utf-8")
        except OSError as exc:
            raise SystemExit(f"model: cannot read {_CSS_PATH.name} ({exc}). The surfaces the "
                             f"type colours are drawn on live there and cannot be guessed at.")
    return _re.sub(r"/\*.*?\*/", "", raw, flags=_re.S)


def surface_token(selector, prop, css=None):
    """The custom property a rule paints with, read from the stylesheet and never retyped.

    ONE ANSWER OR A REFUSAL, AND IT USED TO BE THE FIRST ANSWER IT TRIPPED OVER. Issue 103. This
    was a single `re.search` with no multiplicity check, so a stylesheet declaring `.band` twice
    handed back whichever rule stood higher in the file and said nothing about the other. Its
    sibling surface_values() has treated a second declaration as a refusal since issue 64, with
    a probe for it, and the asymmetry was written down nowhere: the reader that resolves a
    token's VALUE refuses to choose, and the reader that decides WHICH TOKEN is being resolved
    chose silently.

    It matters more than the sibling, not less, because it runs first. A theme-scoped `.band`
    override painting a different token sent the whole contrast measurement at the wrong
    surface, and nothing downstream could notice: surface_values() would then resolve that wrong
    token perfectly, under both schemes, with every multiplicity check passing. Proved by adding
    a scheme-scoped override to app.css, an ordinary edit in a file that already uses that
    idiom: every contrast row came back byte identical and check_repo.sh stayed clean, while two
    of the measured dark ratios, printed as 4.9025 and 4.8431, were really 5.8744 and 5.8033.
    The direction of the error is uncontrolled, and the header of the last colour card names one
    of these numbers as the value that bounded it.

    So: every block whose prelude is this selector is read, every declaration of this property
    inside those blocks is collected, and the reader answers only if they agree. Agreement is
    not the same as there being one of them, and disagreement is a stylesheet to look at rather
    than a coin to toss, which is the sibling's rule in the sibling's words.

    A DECLARATION THAT IS NOT A CUSTOM PROPERTY IS ALSO A REFUSAL, and the old regex could not
    even see one: it required `var(--token)` in the pattern itself, so `.band { fill: #123456 }`
    written below the live rule matched nothing, was skipped, and left the search to find the
    rule above it. A hex painted straight onto the plate is exactly what this whole check exists
    to make impossible.

    `css` is the stylesheet text and defaults to the shipped file. It is a parameter for the same
    reason surface_values() has one: the probes put a synthetic stylesheet through this reader
    rather than through a copy of it that could agree with a broken original.
    """
    import re as _re
    text = _css_text(css)
    # [^}] cannot cross a closing brace, so a body read here cannot run into the next rule.
    opens = _re.escape(selector) + r"\s*\{"
    blocks = list(_re.finditer(opens + r"([^}]*)\}", text))
    if len(blocks) != len(_re.findall(opens, text)):
        raise SystemExit(f"model: app.css opens a `{selector}` block this reader cannot find the "
                         f"end of, or nests another block inside one. It reads a rule body as "
                         f"the text up to the first closing brace and will not guess past that.")
    found = []
    for b in blocks:
        for d in _re.finditer(r"\b" + _re.escape(prop) + r"\s*:\s*([^;}]+)", b.group(1)):
            found.append(" ".join(d.group(1).split()))
    if not found:
        raise SystemExit(f"model: app.css no longer paints {selector} with anything at all for "
                         f"{prop}. The surface the type colours are measured against is read "
                         f"from there and this check is now measuring nothing.")
    distinct = sorted(set(found))
    if len(distinct) != 1:
        raise SystemExit(f"model: app.css paints {selector} with {len(distinct)} different "
                         f"values for {prop} ({', '.join(distinct)}) and this check will not "
                         f"choose between them. One of them is the surface the page draws and "
                         f"the other is the surface this measurement would be about.")
    m = _re.fullmatch(r"var\((--[a-z0-9-]+)\)", distinct[0])
    if not m:
        raise SystemExit(f"model: app.css paints {selector} with `{distinct[0]}` for {prop} "
                         f"rather than with a custom property. Every colour on this page is "
                         f"measured through the token that names it, and a value written "
                         f"straight into the rule is a colour nothing measures.")
    return m.group(1)


# ---- reading a token's two values out of the stylesheet ----------------------
# Issue 64. WHAT THIS ASKS THE STYLESHEET, said first, because the previous reader asked the
# wrong question and that is the whole defect. It needs the resolved value of two custom
# properties under two colour schemes. It used to ask instead "where in the file is the dark
# value", split app.css on the media block's text and require exactly one `#rrggbb` on each
# side. That is a question about the file's LAYOUT, and issue 57 rewrote the palette so that
# color-scheme is the switch and one light-dark() declaration carries both values, at which
# point there were zero definitions on each side and the gate refused to emit anything. Main
# went red. The patch was to hold --bg-app and --bg-panel in the old shape, which cost two
# tokens that existed only to be counted by a regex. This is the repair of the question.
#
# It was never a light-dark() problem. ANY dark rule that spells a plate colour breaks a
# positional count the same way: a `[data-theme="dark"]` block naming the hex is a second
# definition after the split line and the old reader refused at 2. A reader that assumes a
# stylesheet's structure keeps breaking as the stylesheet is written.
#
# THE THREE OTHER ANSWERS AND WHY THEY LOST.
#
#   Parse light-dark() and nothing else. It is a small grammar and it is what the file uses
#   today, and that is exactly the objection: it swaps one assumption about shape for another,
#   and the next honest override, a media block or an explicit-choice rule, breaks it again in
#   the same way. It would fix today and re-file this card.
#
#   Resolve the tokens the way a browser does. The faithful answer, and far more machinery than
#   two questions are worth: specificity, source order, inheritance, @supports, nesting, custom
#   property substitution. A second CSS engine in this repository, unverified against the first,
#   would be a larger thing to be wrong than the thing it replaces.
#
#   Ask a real browser. build/measure_labels.py already drives Chrome for text widths, so it
#   would be consistent, and it loses on where the answer is needed. measure_labels.py runs BY
#   HAND and writes build/label_widths.json, precisely so that the build reads a committed file
#   and never opens a browser: deterministic, offline, no dependency. This runs inside
#   check_repo.sh on every pass. Putting a browser on that path makes the contrast gate
#   unrunnable wherever there is no Chrome, and a gate that cannot run is not a gate.
#
# SO: a small scheme-aware reader over the declarations, which asks the question that was
# actually being asked. It collects every declaration of the token in the file, tags each with
# the colour schemes the block it sits in can apply under, expands light-dark() and one var()
# hop, and requires each scheme to come out at exactly one value. It knows nothing about where
# in the file anything sits.
#
# WHAT IT REFUSES, and it refuses out loud in every case, naming the token and the scheme,
# because the failure it replaces was at least honest: it stopped the gate rather than
# measuring against a guess, and that must not be traded for a quiet wrong answer.
#   no declaration reaches a scheme at all
#   the winning declarations for a scheme disagree about the value
#   a value is not a hex, a light-dark() pair or a var() this reader can follow
#   a var() chain that closes on itself
#   a media query about prefers-color-scheme this reader will not claim to understand
#   a selector claiming both data-theme values at once
#   a file that does not close every block it opens
#
# THE ONE THING IT DELIBERATELY DOES NOT DISTINGUISH: dark chosen by the reader and dark
# inherited from the operating system are one scheme here. After 57 they are one palette, since
# both rules set color-scheme and every pair follows from that. If a stylesheet ever gave them
# different values, the two would be competing declarations for the same scheme and this reader
# would refuse rather than pick. A page whose two routes to dark disagree is a stylesheet
# defect, and it is app.css's own comment that says to keep the two blocks agreeing.

_HEX3 = re.compile(r"#([0-9a-fA-F]{3})$")
_HEX6 = re.compile(r"#([0-9a-fA-F]{6})$")
_VAR_REF = re.compile(r"var\(\s*(--[A-Za-z0-9_-]+)\s*\)$")
_LIGHT_DARK = re.compile(r"light-dark\((.*)\)$", re.S)
_DECL = re.compile(r"(--[A-Za-z0-9_-]+)\s*:\s*([^;]*)")
# A media condition this reader will read, and the only one. Anything else mentioning
# prefers-color-scheme is refused rather than guessed at, `not` above all: it inverts the
# meaning while still carrying the word the naive match would key on.
_PREFERS = re.compile(r"\(\s*prefers-color-scheme\s*:\s*(dark|light)\s*\)")
_DATA_THEME = re.compile(r"\[\s*data-theme\s*=\s*[\"']?(dark|light)[\"']?\s*\]")
# `:root:not([data-theme="light"])` says nothing about the scheme of the block: it stands out of
# the way of a reader who chose light, and it still applies when nobody has chosen anything. So
# a :not() is removed before the selector is read, and what remains is what the block claims.
_NOT_ARG = re.compile(r":not\([^()]*\)")


def _css_abort(message):
    raise SystemExit(f"model: {message} The surfaces the type colours are measured against are "
                     f"read from site/app.css and this check will not guess one.")


def _match_brace(text, opened_at):
    """The index of the } closing the { at opened_at, or -1 if the file never closes it."""
    depth = 0
    for i in range(opened_at, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return i
    return -1


def _blank_nested(body):
    """A block's own declaration text, with every block nested inside it blanked out.

    Blanked and not deleted so that nothing on either side of a nested rule is joined to
    anything else: a declaration cannot be manufactured by removing the text between two.
    """
    out = []
    depth = 0
    for ch in body:
        if ch == "{":
            depth += 1
        out.append(" " if depth else ch)
        if ch == "}":
            depth -= 1
    return "".join(out)


def _narrow(scope, prelude):
    """The schemes a block can apply under, given its enclosing scope and its own prelude."""
    if prelude.startswith("@"):
        if "prefers-color-scheme" not in prelude:
            return scope
        found = _PREFERS.findall(prelude)
        if len(found) != 1 or re.search(r"\bnot\b|\bor\b", prelude):
            _css_abort(f"app.css carries a media query about prefers-color-scheme that this "
                       f"reader will not claim to understand: `{prelude}`.")
        return scope & {found[0]}
    selector = _NOT_ARG.sub(" ", prelude)
    found = set(_DATA_THEME.findall(selector))
    if len(found) > 1:
        _css_abort(f"app.css carries a selector claiming both theme attributes at once: "
                   f"`{prelude}`.")
    return (scope & found) if found else scope


def _walk(css, start, end, scope, out):
    """Every custom property declared between start and end, tagged with its scheme scope."""
    i = start
    while True:
        j = css.find("{", i)
        if j < 0 or j >= end:
            return
        # A block's prelude is what stands between the last thing that ended and its `{`. The
        # rsplit is what makes a block nested inside a rule readable: without it the prelude of
        # an at-rule written inside `:root` would carry the declarations before it and would
        # stop looking like an at-rule at all.
        prelude = " ".join(css[i:j].rsplit(";", 1)[-1].split())
        closes = _match_brace(css, j)
        if closes < 0 or closes > end:
            _css_abort("app.css does not close every block it opens, so no rule in it can be "
                       "read with any confidence about which block it sits in.")
        inner = _narrow(scope, prelude)
        for m in _DECL.finditer(_blank_nested(css[j + 1:closes])):
            out.append((inner, m.group(1), m.group(2).strip()))
        _walk(css, j + 1, closes, inner, out)
        i = closes + 1


def _declarations(css):
    """Every custom property declaration in a stylesheet, tagged with the schemes it applies
    under."""
    out = []
    _walk(css, 0, len(css), frozenset(_SCHEMES), out)
    return out


def _as_hex(value):
    """`#abc` or `#aabbcc` as a lowercase six digit hex, or None if it is neither."""
    m = _HEX6.match(value)
    if m:
        return "#" + m.group(1).lower()
    m = _HEX3.match(value)
    if m:
        return "#" + "".join(c + c for c in m.group(1).lower())
    return None


def _split_args(text):
    """A function's arguments, split on the commas that are not inside a nested function."""
    parts, depth, current = [], 0, []
    for ch in text:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append("".join(current).strip())
            current = []
        else:
            current.append(ch)
    parts.append("".join(current).strip())
    return parts


def _expand(decls, token, value, scheme, seen):
    """One declared value, reduced to the hex it paints under one colour scheme."""
    value = " ".join(value.split())
    hexc = _as_hex(value)
    if hexc:
        return hexc
    m = _LIGHT_DARK.match(value)
    if m:
        halves = _split_args(m.group(1))
        if len(halves) != 2:
            _css_abort(f"app.css writes {token} as a light-dark() of {len(halves)} arguments "
                       f"rather than two: `{value}`.")
        return _expand(decls, token, halves[_SCHEMES.index(scheme)], scheme, seen)
    m = _VAR_REF.match(value)
    if m:
        return _resolve(decls, m.group(1), scheme, seen)
    _css_abort(f"app.css gives {token} the value `{value}` under the {scheme} colour scheme, "
               f"which is not a hex, a light-dark() pair, or a var() naming one token.")


def _resolve(decls, token, scheme, seen=frozenset()):
    """A custom property's one value under one colour scheme, or a refusal saying why not."""
    if token in seen:
        _css_abort(f"app.css resolves {token} through a chain of var() that closes on itself.")
    reaching = [(0 if len(scope) == len(_SCHEMES) else 1, value)
                for scope, name, value in decls if name == token and scheme in scope]
    if not reaching:
        _css_abort(f"app.css declares no value for {token} that can apply under the {scheme} "
                   f"colour scheme.")
    # The cascade, at the only resolution this question needs: a rule scoped to one scheme beats
    # a rule that applies under both. Among the winners the reader requires agreement rather
    # than ranking them by specificity and source order, which is where a second CSS engine
    # would begin. Two dark rules that disagree are a stylesheet to look at, not a coin to toss.
    top = max(tier for tier, _ in reaching)
    values = sorted({_expand(decls, token, value, scheme, seen | {token})
                     for tier, value in reaching if tier == top})
    if len(values) != 1:
        _css_abort(f"app.css resolves {token} to {len(values)} different values under the "
                   f"{scheme} colour scheme ({', '.join(values)}) and this check will not "
                   f"choose between them.")
    return values[0]


def surface_values(token, css=None):
    """A custom property's two values, light and dark, from the one stylesheet that holds them.

    `css` is the stylesheet text, and it defaults to the one this repository ships. It is a
    parameter so that the probes below can put a synthetic palette through the same reader the
    gate runs, rather than through a copy of it that could agree with a broken original.
    """
    decls = _declarations(_css_text(css))
    return {scheme: _resolve(decls, token, scheme) for scheme in _SCHEMES}


# ---- proving the reader, against palettes nobody ships -----------------------
# Issue 64. Every probe below is a synthetic stylesheet, for the reason every other probe in
# this repository is synthetic: one that read site/app.css would start passing or failing
# because somebody changed a colour, which is the one thing a test must not do.
#
# The point of the first group is that a token's value is a fact about the token and not about
# where in the file it was written. The same token, the same two answers, expressed as a
# light-dark() pair, as a media block, as an explicit-choice rule, as all three at once, and as
# the workaround shape this card deleted. Any of the five would have broken the previous reader
# except the second, which is the only shape it could read.
#
# The second group is the refusals, and it is the half that matters more. A reader that answers
# wrongly and quietly is worse than the abort it replaced, so every way this one can fail to
# know an answer is a probe here, and each asserts that the message NAMES what could not be
# resolved rather than merely failing.
#
# scripts/check_repo.sh runs this and folds each line into its own self-test count, so these
# cases are counted where the contrast rule is judged and cannot quietly stop running.

_PALETTE_PROBE_TOKEN = "--probe-plate"
_PALETTE_PROBE_LIGHT = "#ffffff"
_PALETTE_PROBE_DARK = "#252a31"


def palette_self_test():
    """One line per probe, `ok|name` or `miss|name`, and a non-zero exit if any missed."""
    results = []

    def expect_pair(name, css, light=_PALETTE_PROBE_LIGHT, dark=_PALETTE_PROBE_DARK):
        try:
            got = surface_values(_PALETTE_PROBE_TOKEN, css)
        except SystemExit as exc:
            results.append((False, f"{name} (refused: {exc})"))
            return
        results.append((got == {"light": light, "dark": dark}, name))

    def expect_refusal(name, css, names_it):
        try:
            got = surface_values(_PALETTE_PROBE_TOKEN, css)
        except SystemExit as exc:
            results.append((names_it in str(exc), name))
            return
        results.append((False, f"{name} (answered {got} instead of refusing)"))

    t, lit, drk = _PALETTE_PROBE_TOKEN, _PALETTE_PROBE_LIGHT, _PALETTE_PROBE_DARK

    expect_pair("the pair written as one light-dark() declaration",
                f":root {{ {t}: light-dark({lit}, {drk}); }}")
    expect_pair("the pair written as a light value and a dark media block",
                f":root {{ {t}: {lit}; }}\n"
                f"@media (prefers-color-scheme: dark) {{\n"
                f"  :root:not([data-theme=\"light\"]) {{ {t}: {drk}; }}\n}}")
    expect_pair("the pair written as a light value and a [data-theme=\"dark\"] rule",
                f":root {{ {t}: {lit}; }}\n"
                f":root[data-theme=\"dark\"] {{ {t}: {drk}; }}")
    expect_pair("the pair written all three ways at once, agreeing",
                f":root {{ {t}: light-dark({lit}, {drk}); }}\n"
                f"@media (prefers-color-scheme: dark) {{\n"
                f"  :root:not([data-theme=\"light\"]) {{ {t}: {drk}; }}\n}}\n"
                f":root[data-theme=\"dark\"] {{ {t}: {drk}; }}")
    expect_pair("the pair written in the shape issue 64 deleted, a -dark sibling token",
                f":root {{ {t}: {lit}; {t}-dark: {drk}; }}\n"
                f"@media (prefers-color-scheme: dark) {{\n"
                f"  :root:not([data-theme=\"light\"]) {{ {t}: {drk}; }}\n}}\n"
                f":root[data-theme=\"dark\"] {{ {t}: var({t}-dark); }}")
    expect_pair("a dark value reached through two hops of var()",
                f":root {{ {t}: light-dark(var({t}-a), var({t}-b));\n"
                f"  {t}-a: {lit}; {t}-b: var({t}-c); {t}-c: {drk}; }}")
    expect_pair("three digit hexes, which are the same colours written shorter",
                f":root {{ {t}: light-dark(#fff, #ABC); }}", "#ffffff", "#aabbcc")
    expect_pair("a token with one value has that value under both schemes",
                f":root {{ {t}: {lit}; }}", lit, lit)
    expect_pair("a commented out rule declares nothing",
                f"/* :root {{ {t}: #000000; }} */\n"
                f":root {{ {t}: light-dark({lit}, {drk}); }}")
    expect_pair("a dark media block nested inside the rule it overrides",
                f":root {{ {t}: {lit};\n"
                f"  @media (prefers-color-scheme: dark) {{ {t}: {drk}; }}\n}}")

    expect_refusal("a token no rule declares", f":root {{ --something-else: {lit}; }}", t)
    # This reader does not read selectors, only the colour scheme a block can apply under, so it
    # cannot tell a second declaration of the same token on another element from a second
    # declaration on the same one. It says so and stops. That is the right way round: a
    # stylesheet that sets one of these two tokens in more than one place is a stylesheet to
    # look at, and the alternative is a reader that picks one and is quietly wrong.
    expect_refusal("a second declaration of the token, on another element",
                   f":root {{ {t}: light-dark({lit}, {drk}); }}\n"
                   f".somewhere-else {{ {t}: #000000; }}", "2 different values")
    expect_refusal("a token no rule declares under one of the two schemes",
                   f"@media (prefers-color-scheme: light) {{ :root {{ {t}: {lit}; }} }}", "dark")
    expect_refusal("two dark rules that disagree",
                   f":root {{ {t}: {lit}; }}\n"
                   f"@media (prefers-color-scheme: dark) {{ :root {{ {t}: {drk}; }} }}\n"
                   f":root[data-theme=\"dark\"] {{ {t}: #2f343c; }}",
                   "2 different values")
    expect_refusal("a value this reader cannot reduce to a colour",
                   f":root {{ {t}: color-mix(in srgb, {lit} 50%, {drk}); }}", "color-mix")
    expect_refusal("a var() naming a token that is declared nowhere",
                   f":root {{ {t}: var(--no-such-token); }}", "--no-such-token")
    expect_refusal("a var() chain that closes on itself",
                   f":root {{ {t}: var({t}-a); {t}-a: var({t}); }}", "closes on itself")
    expect_refusal("a light-dark() of three arguments",
                   f":root {{ {t}: light-dark({lit}, {drk}, #000000); }}", "3 arguments")
    expect_refusal("a light-dark() half that is not a colour, and is not mis-split on its commas",
                   f":root {{ {t}: light-dark(rgb(255, 255, 255), {drk}); }}",
                   "rgb(255, 255, 255)")
    expect_refusal("a media query about prefers-color-scheme that inverts its own condition",
                   f":root {{ {t}: {lit}; }}\n"
                   f"@media not all and (prefers-color-scheme: dark) {{ :root {{ {t}: {drk}; }} }}",
                   "will not claim to understand")
    expect_refusal("a selector claiming both theme attributes at once",
                   f":root {{ {t}: {lit}; }}\n"
                   f":root[data-theme=\"dark\"][data-theme=\"light\"] {{ {t}: {drk}; }}",
                   "both theme attributes")
    expect_refusal("a stylesheet that does not close every block it opens",
                   f":root {{ {t}: light-dark({lit}, {drk});", "does not close every block")

    # ---- and the reader that runs BEFORE that one, deciding which token is being resolved ----
    # Issue 103. surface_token() had no probe of any kind and no multiplicity check, and it is
    # the reader whose answer everything above is then applied to: get the token wrong and every
    # refusal above passes, perfectly, about the wrong surface. Same synthetic-stylesheet rule as
    # the rest of this suite, and `.probe-plate` is a selector nothing ships.
    def expect_token(name, css, token=_PALETTE_PROBE_TOKEN, sel=".probe-plate", prop="fill"):
        try:
            got = surface_token(sel, prop, css)
        except SystemExit as exc:
            results.append((False, f"{name} (refused: {exc})"))
            return
        results.append((got == token, name))

    def expect_token_refusal(name, css, names_it, sel=".probe-plate", prop="fill"):
        try:
            got = surface_token(sel, prop, css)
        except SystemExit as exc:
            results.append((names_it in str(exc), name))
            return
        results.append((False, f"{name} (answered {got} instead of refusing)"))

    expect_token("the one rule that paints the plate names the token it paints with",
                 f".probe-plate {{ fill: var({t}); }}")
    expect_token("a second rule painting the plate with the SAME token is agreement, not a clash",
                 f".probe-plate {{ fill: var({t}); }}\n"
                 f":root[data-theme=\"dark\"] .probe-plate {{ fill: var({t}); }}")
    # THE DEFECT ITSELF. The old reader returned the first token it found and the override below
    # changed nothing anywhere in the output.
    expect_token_refusal("a theme-scoped rule painting the plate with a DIFFERENT token",
                         f".probe-plate {{ fill: var({t}); }}\n"
                         f":root[data-theme=\"dark\"] .probe-plate {{ fill: var({t}-alt); }}",
                         "2 different values")
    # And the same defect written the other way up, which the old pattern could not see at all
    # because it required var() inside the match and skipped anything else.
    expect_token_refusal("a rule painting the plate with a hex instead of a custom property",
                         f".probe-plate {{ fill: {drk}; }}",
                         "rather than with a custom property")
    expect_token_refusal("a hex override under a rule that does name a token",
                         f".probe-plate {{ fill: var({t}); }}\n"
                         f":root[data-theme=\"dark\"] .probe-plate {{ fill: {drk}; }}",
                         "2 different values")
    expect_token_refusal("no rule paints the plate at all",
                         f".something-else {{ fill: var({t}); }}",
                         "no longer paints")
    expect_token("a commented out override paints nothing",
                 f".probe-plate {{ fill: var({t}); }}\n"
                 f"/* .probe-plate {{ fill: var({t}-alt); }} */")
    expect_token("a longer selector ending in this one is a different rule",
                 f".probe-plate {{ fill: var({t}); }}\n"
                 f".probe-plate-cap {{ fill: var({t}-alt); }}")
    expect_token_refusal("a second declaration of the property inside the same block",
                         f".probe-plate {{ fill: var({t}); fill: var({t}-alt); }}",
                         "2 different values")

    for ok, name in results:
        print(f"{'ok' if ok else 'miss'}|{name}")
    if not all(ok for ok, _ in results):
        raise SystemExit(1)


def type_colour(key, colour, ground):
    """The hex a type is painted in on one ground. One colour today, two the day 56 lands."""
    if ground == "dark":
        return TYPE_COLOUR_DARK.get(key, colour)
    return colour


def contrast_rows():
    """One row per type per ground: what is painted, what it is painted on, and the ratio.

    The plate is the gated surface. The ground is carried beside it because the two disagree,
    and a check that quietly measured the more flattering of them would be worth nothing.
    """
    plate = surface_values(surface_token(".band", "fill"))
    canvas = surface_values(surface_token("html, body", "background"))
    rows = []
    for key, label, colour, _glyph in TYPES:
        for ground in ("light", "dark"):
            hexc = type_colour(key, colour, ground)
            rows.append({"key": key, "label": label, "ground": ground, "hex": hexc,
                         "plate": plate[ground], "ratio": contrast_ratio(hexc, plate[ground]),
                         "canvas": canvas[ground],
                         "canvas_ratio": contrast_ratio(hexc, canvas[ground])})
    return rows


def floor4(x):
    """A ratio at four decimals, rounded DOWN, so a printed figure is never better than the truth.

    Four decimals and not two: two would be readable and would put every ratio in the shape the
    repository gate's money rule reads as a grouped amount.

    Down and not to nearest, which is the part that does real work. The gate compares the printed
    figure, so that a verdict can be reproduced from what is on the screen. Rounding to nearest
    makes that comparison lenient near the line: #00a3c0 on white measures 2.99998, which reads
    as 3.0000 and would clear a threshold it is under. Rounding down cannot do that. With the
    threshold itself written to four decimals, every true ratio at or over it floors to at or
    over it and every true ratio under it floors to under it, so the printed figure decides
    exactly what the full precision figure would have decided.
    """
    return math.floor(x * 10000) / 10000


def emit_contrast():
    """The rows, pipe separated, for scripts/check_repo.sh to judge.

    The last line is a terminator carrying the row count. A reader that does not find it is
    looking at a truncated table, and a truncated table is the one failure this check could not
    otherwise see: every row it does hold would be judged, every declaration still hit, and the
    verdict would come out clean on a fraction of the palette.
    """
    rows = contrast_rows()
    for r in rows:
        print(f"{r['key']}|{r['label']}|{r['ground']}|{r['hex']}|{r['plate']}|"
              f"{floor4(r['ratio']):.4f}|{r['canvas']}|{floor4(r['canvas_ratio']):.4f}")
    print(f"#rows|{len(rows)}")


# ---- the provenance gate, and the point of a gate is that it refuses ---------
# Issue 73. The Z-Map's second load-bearing rule is that freshness is only worth maintaining if
# something downstream refuses to act on a stale row, so this is the something. It runs on the
# EMITTED DOCUMENT and not on the code that writes it, for seam 1's reason: the code that writes
# it is the code that would be wrong. And it runs inside build/build_layout.py, on whatever
# document is being laid out, so a private deployment's own document is refused by the same
# named rules as this one rather than by nobody. Each rule is proved armed against a
# failing input by provenance_self_test(), whose probe total is asserted so that a rule
# quietly deleted takes the self-test red rather than shrinking it.
#
# WHAT IT REFUSES, AND THE FIRST QUESTION TO ANSWER IS WHY IT DOES NOT REFUSE EVERYTHING. Not one
# value in this document is apto. Every row is either invented or read and undated, and a gate
# reading "refuse to present a value that is not apto" would blank the page on the first run.
# That is not a reason to weaken it; it is a sign the rule was copied at the wrong level. The
# Z-Map's own gate is not on the row either. The map holds every row it has, including the stale
# ones and the unverified ones. What is refused is a DOWNSTREAM USE: "no placement claim, target
# list, introduction request or student-facing document may name a person or a team from outside
# `apto`". The row is kept and marked; the export is refused.
#
# So the level that copies across is the DOCUMENT. A document declares one stance, and the gate
# refuses a document that mixes states, in both directions:
#
#   an `invented` document may carry no value that computes apto. A number on the public page
#   that reads as current and fit to act on is exactly invariant 7, and it would be indetectable
#   among two thousand invented ones.
#
#   a `live` document may carry no invented value. An invented number in a management tool,
#   rendered identically to a read one, is the failure this entire seam exists to prevent and it
#   is worse than the tool showing nothing.
#
# The remaining rules are the ways one row could be wrong while still looking right in a panel.
# The sharpest is `official-needs-a-read`, which is not a provenance rule at all on its own: it
# asks issue 72's registry, in the same document, whether the system holding this class has ever
# been reached, and refuses a value claiming to be read from a record when the registry says
# nothing has read it. Two seams that could have disagreed silently now cannot.
#
# Every rule is named, and build/model.py --provenance-self-test builds one synthetic document
# per rule and asserts it trips, per TPS.md: a gate is proved armed before it is trusted, and a
# gate never seen to refuse is not a gate.
def check_provenance(doc):
    """Refuse an instance document whose values do not say honestly where they came from."""
    def bad(rule, why):
        raise SystemExit(f"[provenance] {rule}: {why}")

    pr = doc.get("provenance")
    if not isinstance(pr, dict):
        bad("document-block", "the document declares no provenance block. Every value in it "
                              "would then carry a rank nothing defines and a stance nothing "
                              "states.")
    stance, as_of, clock = pr.get("stance"), pr.get("as_of"), pr.get("clock")
    vocab = pr.get("vocab") if isinstance(pr.get("vocab"), dict) else {}
    ranks = vocab.get("rank") if isinstance(vocab.get("rank"), dict) else None
    # Issue 104. `flag` joins the three that were already required, and it is required on the
    # same terms: the flag is the half of the pair THE READER SEES, so a document that ships the
    # rank vocabulary and not the flag vocabulary is machine readable about the half nobody looks
    # at and mute about the half on the screen.
    flags = vocab.get("flag") if isinstance(vocab.get("flag"), dict) else None
    # Issue 123. `produces` joins them on the same terms again: a source now says which of two
    # populations it filled, that word decides whether `real` is reachable through it at all,
    # and a document shipping the word without its meaning is machine readable about everything
    # except the field that governs the chip on the screen.
    produces = vocab.get("produces") if isinstance(vocab.get("produces"), dict) else None
    if not ranks or not flags or not produces or not isinstance(vocab.get("status"), dict) \
            or not isinstance(vocab.get("stance"), dict):
        bad("document-block", "the provenance block ships no vocabulary for its ranks, its "
                              "flags, its statuses, its stances and what a source produced. A "
                              "token whose meaning is only in the program that wrote it is not "
                              "machine readable.")
    if stance not in vocab["stance"]:
        bad("document-block", f"stance {stance!r} is not one of {sorted(vocab['stance'])}")
    try:
        datetime.date.fromisoformat(as_of or "")
    except (TypeError, ValueError):
        bad("document-block", f"as_of {as_of!r} is not a date. It is what a read date is judged "
                              f"against, so a document without one cannot age anything.")
    if not isinstance(clock, dict) or set(clock) != {"fresh_days", "aging_days"} \
            or not all(isinstance(clock[k], int) and clock[k] > 0 for k in clock) \
            or clock["fresh_days"] > clock["aging_days"]:
        bad("document-block", f"the clock {clock!r} is not two positive day counts with the "
                              f"fresh window inside the aging one. Staleness has to be "
                              f"computable, which is the whole of what this block is for.")

    # ---- the sources, and what "has a stated source" is allowed to mean. Issue 118 -----------
    # Read off the DOCUMENT and not off this file, like the four vocabularies above, so an
    # --instance document is judged against the sources it declares. See VALUE_SOURCES in this
    # file for the argument; what follows is only the shape rule and the coverage map it builds.
    #
    # A document declaring nothing is legal and means what it says: nothing in it was read off
    # anything, so nothing in it may wear the `real` chip on an invented stance. That is the
    # honest default and it is stricter than the six name tuple this replaced.
    sources = pr.get("sources")
    if sources is None:
        sources = {}
    if not isinstance(sources, dict):
        bad("source-declaration",
            f"the provenance block's sources are {sources!r} and not a table of them, keyed by "
            f"the name of the source. `real` means a value was read off something, and the "
            f"something is what this block is for.")
    covered = {}
    for sname, spec in sorted(sources.items()):
        where = f"source {sname!r}"
        if not isinstance(spec, dict):
            bad("source-declaration", f"{where} is {spec!r} and not a declaration.")
        # The three things a source has to say about itself, and none of them is decoration.
        # A corpus nobody named, a read nobody dated and a recheck nobody wired are three
        # different ways of saying `real` and meaning nothing by it.
        for field in ("corpus", "read_on", "rechecked_by"):
            if not isinstance(spec.get(field), str) or not spec[field].strip():
                bad("source-declaration",
                    f"{where} states no {field!r}. A source is what was read, when it was read, "
                    f"and the gate that re-reads it wherever the corpus exists; a declaration "
                    f"missing any of the three is a word, and every value pointing at it would "
                    f"carry a claim nobody can follow.")
        try:
            read_on = datetime.date.fromisoformat(spec["read_on"])
        except ValueError:
            read_on = None
            bad("source-declaration",
                f"{where} was read on {spec['read_on']!r}, which is not a date.")
        if read_on > datetime.date.fromisoformat(as_of):
            bad("source-declaration",
                f"{where} was read on {spec['read_on']}, after this document was written on "
                f"{as_of}. One of the two dates is wrong.")
        # THE GATE IT NAMES HAS TO HAVE RUN, where this program is the one that owns it. A
        # source citing a re-read that never happens is the drift class this repository has been
        # bitten by five times: a rule declared in one place and not wired in the other. A name
        # this program does not define at all belongs to a foreign document's own builder, and
        # this gate says nothing about it rather than pretending to judge it.
        gate = spec["rechecked_by"]
        if gate in globals() and callable(globals()[gate]) and gate not in RECHECK_GATES_RUN:
            bad("source-recheck-did-not-run",
                f"{where} says {gate}() re-reads its corpus and refuses a drift, and this build "
                f"recorded no re-read under that name. A gate that does not run re-reads "
                f"nothing, and every value this source covers would be resting on it.")
        if spec.get("rank") not in ranks:
            bad("source-declaration",
                f"{where} produced values at rank {spec.get('rank')!r}, which is not one of "
                f"{sorted(ranks)}.")
        if spec.get("rank") == INVENTED:
            bad("source-declaration",
                f"{where} produced values at rank {INVENTED!r}, whose own definition is that "
                f"nothing was read. A source that read nothing is not a source.")
        # ---- which of the two populations this source filled, issue 123 --------------------
        # Defaulted rather than required, because a document that declares no `produces` is a
        # document from before this word existed and it meant `values`: that is the only kind
        # of source there was. A token in no vocabulary is refused rather than defaulted, which
        # is the difference between a field that is absent and a field that is wrong.
        kind = spec.get("produces", "values")
        if kind not in produces:
            bad("source-declaration",
                f"{where} produced {kind!r}, which is not one of {sorted(produces)}. What a "
                f"source filled decides whether {R!r} is reachable through it, so a word this "
                f"document does not define is a permission nobody can read.")
        sflags = spec.get("flags")
        if not isinstance(sflags, list) or not sflags \
                or any(f not in flags for f in sflags) \
                or (R in sflags) != (kind == "values"):
            bad("source-declaration",
                f"{where} produced {kind!r} and declares the flags {sflags!r}. A source's rows "
                f"are flagged from a closed list, every token of it in the document's own flag "
                f"vocabulary, and {R!r} is in that list on a source that produced values or "
                f"the source covers nothing this rule is about. On one that produced registry "
                f"rows {R!r} is REFUSED: what was read there is an analysis of the systems and "
                f"not a system, so the chip that says a value came off the business would be "
                f"the same lie pointing at another population.")
        covers = spec.get("covers")
        if not isinstance(covers, dict) or not covers \
                or not all(isinstance(t, str) and isinstance(ks, list) and ks
                           and len(set(ks)) == len(ks)
                           and all(isinstance(k, str) for k in ks)
                           for t, ks in covers.items()):
            bad("source-declaration",
                f"{where} covers {covers!r}, which is not a set of property keys per node type. "
                f"What a source produced is (type, key) seats and not a list of words: a bare "
                f"key is a spelling any row can adopt, which is exactly what this rule stopped "
                f"being in issue 118.")
        for ntype, keys in sorted(covers.items()):
            for k in keys:
                if (ntype, k) in covered:
                    bad("source-declaration",
                        f"{where} and source {covered[(ntype, k)][0]!r} both claim to have "
                        f"produced {k!r} on a {ntype}. Two sources for one seat means no row "
                        f"there can say which one it came from.")
                covered[(ntype, k)] = (sname, spec)

    classes = doc.get("routes", {}).get("classes", {})
    seen = 0
    # Issue 85's agenda. A top-level block, so the node walk below cannot see it, and this file
    # already carries the same reasoning three times over the registry, the provenance block and
    # the counts block: a block no gate reads is where the next unranked value lands. Every line
    # of it is made up and it renders as a block of prose, which is the one shape on this page a
    # reader could take for a document, so it answers the invented rules and nothing weaker.
    agenda = doc.get("agenda")
    if agenda is not None:
        # THE SHAPE RULE, AND IT NO LONGER ASKS FOR A NOTE. It asked for one until issue 108:
        # the block carried a sentence at its head and a block with rows and no sentence was
        # refused here. The owner removed the sentence, so the rule now covers what is left,
        # which is the table. This is a rule following its object rather than a rule relaxed to
        # let something through: nothing that was refused for its ROWS is accepted now, and the
        # per row rules below are untouched.
        if not isinstance(agenda, dict) \
                or not isinstance(agenda.get("by_template"), dict) \
                or not agenda["by_template"] \
                or not all(isinstance(r, list) and r for r in agenda["by_template"].values()):
            bad("agenda-block", "the agenda block is present and is not a set of lines per "
                                "template. A block declaring a template and holding nothing "
                                "under it draws an empty frame on the sheet and is refused "
                                "here rather than there.")
        # ONE WALK OVER EVERY TEMPLATE'S LINES, so a rule cannot be applied to one session
        # and forgotten on the next. The four constant lines this block shipped with are gone,
        # issue 108: there is one population now, eighty three sets of three or four written
        # from the session's own title, and the shape check above is the thing that refuses a
        # block with a table and no sentence saying what the table is.
        walk = []
        for tid, rows in sorted((agenda.get("by_template") or {}).items()):
            walk += [(f"agenda row {j} for {tid}", row) for j, row in enumerate(rows)]
        for what, row in walk:
            seen += 1
            if row.get("f") not in flags:
                bad("flag-vocabulary",
                    f"{what} is flagged {row.get('f')!r}, which is not one of "
                    f"{sorted(flags)}. The flag is what the panel prints and what it puts in "
                    f"the row's class name, so a token in no vocabulary reaches the screen.")
            if row.get("r") != INVENTED or row.get("at") is not None:
                bad("agenda-row-not-invented",
                    f"{what} is ranked {row.get('r')!r} with read date {row.get('at')!r}. Nothing "
                    f"in the vault records what happens inside a session, so every line of this "
                    f"block was made up and each one says so.")
            if row.get("f") != D:
                bad("agenda-row-not-dummy",
                    f"{what} is flagged {row.get('f')!r}. It stands in for something no system "
                    f"holds, which is what dummy means, and it is the flag the reader sees.")
    # doc_views() and not doc["views"], issue 89. There are two lists of nodes in this document
    # now and a gate that walked the first would clear a document whose second half was unranked.
    for v in doc_views(doc):
        grain = v.get("grain", "sessions")
        for n in v["nodes"]:
            where = (f"{v['key']} node {n['id']}" if grain == "sessions"
                     else f"{v['key']} ({grain}) node {n['id']}")
            registry_rows = n.get("route") or 0
            # ---- a covered seat is a population, issue 118 ----------------------------------
            # THE PART THAT STOPS A ROW JOINING THE POPULATION BY TAKING ITS NAME. A source says
            # it produced `modules` on every Programme, so every Programme has exactly one, and
            # the seat is full before any other row reaches for it. Both directions are the
            # rule: two rows under one covered key is the rename this card was filed about, and
            # a covered key missing altogether is a deletion the old membership test could not
            # see, since it only ever looked at the rows that were still there.
            ntype = n.get("type")
            if ntype is not None:
                seat_count = collections.Counter(r.get("k") for r in n["props"])
                for (ctype, ckey), (sname, _spec) in sorted(covered.items()):
                    if ctype != ntype:
                        continue
                    if seat_count[ckey] != 1:
                        bad("source-covers-a-population",
                            f"{where} is a {ntype} and carries {seat_count[ckey]} rows keyed "
                            f"{ckey!r}. Source {sname!r} declares it produced that value on "
                            f"every {ntype}, exactly once. Two rows under one key is a row "
                            f"taking a name that is already spoken for, and none at all is a "
                            f"reading that has gone missing.")
            for i, row in enumerate(n["props"]):
                seen += 1
                at, rank = row.get("at"), row.get("r")
                what = f"{where} row {row['k']!r}"
                # A status or an apto somebody could type is a status somebody could type
                # wrong, and every reader downstream would believe it. The Z-Map says both are
                # computed and never typed, so neither is a field here.
                for typed in ("status", "apto"):
                    if typed in row:
                        bad("computed-not-typed",
                            f"{what} carries a {typed!r} field. It is computed from the rank, "
                            f"the read date and the clock, by every reader, and a written one "
                            f"can disagree with the two facts it was supposed to follow from.")
                # Issue 104, and the first of the three things nothing here had an opinion
                # about. The flag is not decoration: the panel prints it and puts it straight
                # into the row's class name, so an unknown token is a token on the screen and a
                # missing one is the string "undefined" beside a value. A closed vocabulary, read
                # off the document rather than off this file, so an --instance document is judged
                # against the flags IT declares.
                flag = row.get("f")
                if flag not in flags:
                    bad("flag-vocabulary",
                        f"{what} is flagged {flag!r}, which is not one of {sorted(flags)}. The "
                        f"flag is what the panel prints and what it puts in the row's class "
                        f"name, so a token in no vocabulary reaches the screen.")
                if rank not in ranks:
                    bad("rank-vocabulary",
                        f"{what} is ranked {rank!r}, which is not one of {sorted(ranks)}")
                if rank == INVENTED and at is not None:
                    bad("invented-carries-no-read-date",
                        f"{what} was invented and carries the read date {at!r}. Nothing was "
                        f"read, so there is no date, and a date here would age in the clocks "
                        f"exactly as a real one does.")
                if at is not None:
                    try:
                        read = datetime.date.fromisoformat(at)
                    except (TypeError, ValueError):
                        read = None
                        bad("read-date-is-a-date",
                            f"{what} carries the read date {at!r}, which is not a date")
                    if read > datetime.date.fromisoformat(as_of):
                        bad("read-from-the-future",
                            f"{what} was read on {at}, after this document was written on "
                            f"{as_of}. One of the two dates is wrong and the value would "
                            f"compute fresh forever.")
                # Issue 85. The third population, and both directions of it. A row whose key is
                # one of the syllabus keys was read off the vault and may not claim to have been
                # made up; every other row of the node's own still must, which is the rule below.
                #
                # Scoped to the invented stance, like the rule it excepts. A live document laid
                # out through --instance may hold a module name read out of a real system, which
                # is a different rank with a real date on it, and this repository's answer for
                # its own public toy is not a claim about that one.
                #
                # ABOVE THE STANCE GATE AND NOT BELOW IT, so that a dated syllabus row is refused
                # for being dated rather than for the `fresh` that the date computes to. Both
                # refusals are correct and only one of them names the defect.
                #
                # ISSUE 118 CHANGED WHAT MAKES A ROW ONE OF THESE, and the two rules below are
                # otherwise untouched. It used to be the key alone, which meant any row of any
                # node could become a syllabus row by being renamed. It is now the SEAT: the
                # (node type, key) pair a declared source says it produced, read off the
                # document. `module` on a ModuleDelivery is a syllabus row and `module` on a
                # Programme is not, which is the whole of the audit's A3.
                src = covered.get((ntype, row["k"])) if ntype is not None else None
                # ---- the registry seats, issue 123 ---------------------------------------
                # A source that produced REGISTRY rows covers the four at the front of a panel,
                # and the three rules below are what join those 1320 rows to the declaration
                # rather than leaving them resting on a comment. They run on every machine,
                # corpus or no corpus, which is the half of this card that holds in CI.
                #
                # The first is the seam the other two would otherwise leave open. `syllabus_row`
                # is an EXEMPTION from `toy-value-not-invented`: a covered seat is allowed to be
                # ranked as read on a page where everything else was made up. Registry seats
                # already have their own exemption, by sitting inside the registry rows, and if
                # one could also be claimed OUTSIDE them then any of a node's own invented rows
                # could be renamed into a registry seat and stop having to say it was made up.
                # So a registry seat found outside the registry is refused, and `syllabus_row`
                # below is scoped to the sources that produced values, which is what it has
                # always meant.
                src_kind = src[1].get("produces", "values") if src else "values"
                if src is not None and src_kind == "registry" and i >= registry_rows:
                    bad("registry-source-outside-the-registry",
                        f"{what} is a seat source {src[0]!r} says it filled from an analysis of "
                        f"the systems, and it sits among this node's own values rather than "
                        f"inside its {registry_rows} registry rows. A row that can be one of "
                        f"those by being renamed is a row that stops having to say it was made "
                        f"up.")
                if src is not None and src_kind == "registry" and rank != src[1]["rank"]:
                    bad("registry-source-row-rank",
                        f"{what} is a registry row source {src[0]!r} read off {src[1]['corpus']}"
                        f", and it is ranked {rank!r}. That source produced its rows at "
                        f"{src[1]['rank']!r} and every one of them says so, or the rank on the "
                        f"screen is not the one the source declared.")
                if src is not None and src_kind == "registry" and row.get("f") not in \
                        src[1]["flags"]:
                    bad("registry-source-row-flag",
                        f"{what} is a registry row source {src[0]!r} produced and it is flagged "
                        f"{row.get('f')!r}. That source's rows wear "
                        f"{' or '.join(sorted(src[1]['flags']))}: what the analysis records, or "
                        f"that it records there is nothing to record.")
                if src_kind != "values":
                    src = None
                syllabus_row = (i >= registry_rows and stance == "invented" and src is not None)
                if syllabus_row and rank != src[1]["rank"]:
                    bad("syllabus-row-not-observed",
                        f"{what} is a value source {src[0]!r} says it read off {src[1]['corpus']}"
                        f", and it is ranked {rank!r}. It is not made up and it did not come out "
                        f"of a system's own record, so its rank is {src[1]['rank']!r}.")
                if syllabus_row and at is not None:
                    bad("syllabus-row-carries-no-read-date",
                        f"{what} is a value from source {src[0]!r} carrying the read date "
                        f"{at!r}. The corpus is not on the machine that builds this document, "
                        f"and a date here computes fresh, which would make a value on an "
                        f"invented page read as fit to act on.")
                # AND THE OTHER DIRECTION OF THE SAME SEAT, issue 118. A source declares which
                # flags its rows wear: `real` for what the corpus records, `absent` for what it
                # records as nothing, and no third thing. Without this a covered row could be
                # quietly downgraded to `dummy` and the reader would be told a value read off a
                # real corpus was made up, which is the same lie pointing the other way.
                if syllabus_row and row.get("f") not in src[1]["flags"]:
                    bad("source-row-flag",
                        f"{what} is a value source {src[0]!r} produced and it is flagged "
                        f"{row.get('f')!r}. That source's rows wear "
                        f"{' or '.join(sorted(src[1]['flags']))}: what the corpus records, or "
                        f"that the corpus records nothing there.")
                # ---- what `real` is allowed to mean, issue 104 ----------------------------
                # AND THE LIMIT IS STATED FIRST, because a check whose reach is oversold is the
                # failure this repository is named for. NOTHING HERE CAN PROVE A VALUE IS REAL.
                # The vault the syllabus rows are read from is not on the machine that builds
                # this, in CI or anywhere else, so no gate can open the source and compare. A
                # `real` row carrying a module name that is not that module's name still ships.
                #
                # What IS checkable is the pair, and the pair is where the lie has to live. The
                # flag is the half the reader sees and the rank is the half the machine sees, and
                # the two are supposed to say the same thing. So:
                #
                #   a value flagged `real` may not be ranked `0_invented`, in any document. The
                #   rank's own definition in VALUE_RANK reads "nothing was read. The value was
                #   made up", which is the exact contradiction of the chip beside it. This is the
                #   rule that refuses the audit's flagship mutation: `owner`, `attendance` and
                #   `fee_per_session` forced to `real` with their ranks left invented, which put
                #   121 made up numbers on the page wearing the real chip past seven green gates.
                #
                #   and on an invented document, `real` may appear only on the one population
                #   that has a source. Ranking alone does not close it: the four registry rows
                #   are ranked `3_observed` too, so a route row flagged `real` clears the rule
                #   above and would still be a made up chip, since what those rows cite is an
                #   analysis of the systems and not the value itself.
                #
                # AND ISSUE 118 REWROTE WHAT THAT POPULATION IS. It was six key names in a tuple
                # in this file, so the audit renamed a row of invented prose to `module` and the
                # flagship mutation shipped green: the escape was a spelling, not a forgery. The
                # population is now the seats a source declared in the document itself, (type,
                # key) pairs, each one filled exactly once on every node of that type by the
                # rule above. Adding a value with a source is declaring the source, the corpus,
                # the date it was read and the gate that re-reads it; it is no longer typing a
                # word into a tuple, and a row cannot be renamed into a seat that is occupied.
                #
                # SCOPED TO THE INVENTED STANCE, like `toy-value-not-invented`, and for the same
                # reason: a live document laid out through --instance is full of values read out
                # of real systems and every one of them is entitled to the flag. This repository's
                # answer for its own public toy is not a claim about that document.
                #
                # AND IT IS CLOSED IN ONE DIRECTION ONLY, which is worth writing down because the
                # symmetric rule is false. A syllabus row is not obliged to be `real`: eight
                # `module_name` rows are flagged `absent`, because the syllabus records that
                # those sessions sit in no module, and an absence read off a real source is an
                # absence rather than a real value.
                if flag == R and rank == INVENTED:
                    bad("real-flag-not-invented",
                        f"{what} is flagged {R!r} to the reader and ranked {INVENTED!r} to the "
                        f"machine. The rank's own definition is that nothing was read and the "
                        f"value was made up, so the two halves of this row contradict each "
                        f"other and the half on the screen is the one that is wrong.")
                if flag == R and stance == "invented" and not (
                        syllabus_row and rank == src[1]["rank"]):
                    seats = ", ".join(f"{t}.{k}" for t, k in sorted(covered)) or "no seat at all"
                    bad("real-flag-needs-a-source",
                        f"{what} is flagged {R!r} on a document whose stance is invented. The "
                        f"only values in such a document that were not made up are the ones a "
                        f"declared source says it produced, and this document's sources produced "
                        f"{seats}. A {row['k']!r} row on a {ntype} node is not one of them. A "
                        f"`real` chip on a row with no stated source is the one claim on this "
                        f"page a reader cannot check.")
                st = value_status(rank, at, as_of, clock["fresh_days"], clock["aging_days"])
                if st not in vocab["status"]:
                    bad("document-block", f"{what} computes to {st!r}, which the document's own "
                                          f"status vocabulary does not define")
                # The two halves of the stance gate.
                if stance == "invented" and st in APTO:
                    bad("stance-invented-refuses-apto",
                        f"{what} computes to {st!r}, which is fit to act on, in a document "
                        f"whose stance is invented. Every other value on this page stands in "
                        f"for one and renders identically, so a reader would have no way to "
                        f"tell this one apart. One document, one stance.")
                if stance == "live" and rank == INVENTED:
                    bad("stance-live-refuses-invented",
                        f"{what} was invented, in a document whose stance is live. A made up "
                        f"number beside read ones, rendered the same way, is worse than the "
                        f"tool showing nothing.")
                # Where the registry rows stop is where the invented ones start, and both
                # directions are the finding. It is written down here so that it stays true.
                if i < registry_rows and rank == INVENTED:
                    bad("registry-row-invented",
                        f"{what} is one of the {registry_rows} rows issue 72's registry "
                        f"produced, and it is ranked invented. Those rows are read off the "
                        f"analysis each of them cites.")
                if i >= registry_rows and not syllabus_row \
                        and stance == "invented" and rank != INVENTED:
                    bad("toy-value-not-invented",
                        f"{what} is one of this node's own values in a document whose stance is "
                        f"invented, and it is ranked {rank!r}. Every value in this model except "
                        f"the registry rows and the syllabus rows was made up.")
                # Seam 5 asking seam 3, in the one document that carries both.
                if rank == OFFICIAL:
                    entry = classes.get(n.get("class"))
                    read_state = entry.get("read") if entry else None
                    if read_state in ("no-source", "not-attempted"):
                        bad("official-needs-a-read",
                            f"{what} claims to be read from the record its holding system "
                            f"keeps, and the registry entry for class {n.get('class')!r} in "
                            f"this same document says the read state is {read_state!r}. "
                            f"Nothing has reached that system.")
    if not seen:
        bad("empty-input", "no value in this document carries a provenance, so this gate "
                           "examined nothing and would report clean on any document at all.")
    return seen


# ---- the structure gate, issue 102 ------------------------------------------
# NOTHING ANYWHERE ASSERTED THAT THE MODEL IS WELL FORMED. The audit proved it the hard way: a
# duplicate node id was injected into this file, immediately before the identity loop, the real
# build was run, and the whole static set said clean. The written drawing carried twenty eight
# node entries with twenty seven distinct ids, two tiles at identical coordinates, and ninety
# units of reserved height for a tile nobody can see. `check_build.sh` printed "VERDICT: clean.
# The committed drawing is the build's own output", and it was telling the truth: the drawing WAS
# the build's own output. The build had simply agreed to draw nonsense.
#
# So this is the gate that has an opinion about the graph, and it runs where check_provenance()
# runs, on the EMITTED DOCUMENT and inside build/build_layout.py, for the same two reasons: the
# code that writes the document is the code that would be wrong, and a private deployment laid
# out through --instance is refused by these rules rather than by nobody.
#
# IT RUNS BEFORE ONE COORDINATE IS COMPUTED, which is not tidiness. build_layout.py builds its
# adjacency with `adj[e["s"]].append(...)`, so an edge naming a node that does not exist dies
# there with a bare KeyError and no view, no edge and no id in the message, while every
# neighbouring refusal in that file names the rule, the view and the fix. Refusing here means the
# diagnosis arrives instead of the traceback.
#
# WHAT IT REFUSES, AND THE ONE THING IT DELIBERATELY DOES NOT.
#
#   node-id-unique. The proved one. Two nodes under one id in one view is not a drawing defect
#   with a visible symptom; the layout dict keyed by id keeps the last of them, the declaration
#   order list keeps both, the packer places both, and the page then has two DOM elements under
#   one `data-node` value, after which every querySelector in the smoke suite reads the first of
#   two and reports on both.
#
#   edge-endpoint-exists. Both ends of every edge, named with the edge and the missing id.
#
#   edge-is-not-a-loop. `s == t` was never tested and the emitted path for one runs backwards
#   through the tile it starts and ends on, with the arrowhead at angle zero pointing the wrong
#   way and the verb chip sitting on the tile. This is refused rather than drawn better, and the
#   reason is worth stating because a self relation is not absurd in general: a session template
#   that supersedes another template is a real shape. It is refused because this layout draws an
#   edge BETWEEN TWO COLUMNS and has no shape at all for an edge inside one, which is the same
#   reason Student sits in column 4 rather than under its own group. If a self relation is ever
#   wanted, the drawing gains a shape for it first and this rule is what makes that a decision
#   rather than an accident.
#
#   edge-declared-once. Two edges with the same ends and the same verb draw two identical paths
#   and stack two identical verb chips, and the chip separation gate cannot see it: two chips at
#   the same point are not two chips as far as it is concerned.
#
#   node-class-declared. Every node carries `class`, the join to issue 72's registry, and the
#   first rows of its panel are that registry entry rendered. A class naming no entry loses those
#   rows silently, and it also switches `official-needs-a-read` off for that node, since that
#   rule asks the registry a question and a missing entry answers nothing.
#
#   AN ORPHAN IS NOT REFUSED, and this is the judgement rather than an omission. A node with no
#   edge in a view is a legal modelling state: a view says which objects it is about, and an
#   object can belong in one without any relation of it being drawn there. Refusing it would
#   refuse a document this repository has no right to call wrong, and the destination is a
#   management tool over a whole funnel where a class with nothing attached yet is exactly the
#   state worth showing. What the check does instead is COUNT them and say the number, on every
#   build, so that an edge deleted and its node left behind stops being invisible. The shipped
#   document has none, in any of the seven views.
#
# THE COUNT GOES WHERE THE CHECK CAN SEE IT, which is the pattern that keeps working here:
# EXPECTED_ASSERTIONS in the smoke suite and the `#rows` terminator on the contrast table. A
# check that examined less than it meant to has to fail rather than report clean on the part it
# reached. Three ways, and they cover different failures. A document with no views, or a view
# with no nodes, is refused by name instead of walking nothing and returning clean. The counts
# this gate walked are returned and the build prints them, so a run that examined 300 nodes where
# yesterday's examined 330 is on the screen. And structure_self_test() asserts its own probe
# total against a written constant, so a rule deleted along with its probe takes the self-test
# red rather than quietly shrinking it to a smaller clean number.
def check_structure(doc):
    """Refuse an instance document whose graph is not one a drawing can be made of."""
    def bad(rule, why):
        raise SystemExit(f"[structure] {rule}: {why}")

    views = doc.get("views")
    if not isinstance(views, list) or not views:
        bad("empty-input", "the document declares no views, so this gate would walk nothing and "
                           "report clean on any document at all.")
    # Issue 89. `collapsed` is optional, because a document laid out through --instance may be
    # drawn at one altitude only, and it is NOT optional for it to be the wrong shape: a list of
    # views is walked, a missing one is counted as none, and anything else is refused rather than
    # ignored. The count is returned and printed by the build, so a document that quietly lost
    # its second half says so on the build's own face instead of clearing a gate that walked
    # half of it.
    alt = doc.get("collapsed")
    if alt is not None and (not isinstance(alt, list) or not alt):
        bad("empty-input", "the document carries a `collapsed` block that is not a non-empty "
                           "list of views. A document drawn at one altitude leaves it out "
                           "altogether; one that declares it and puts nothing in it would have "
                           "every rule below walk nothing and report clean about the half of "
                           "the document a reader is most likely to be looking at.")
    # Issue 117, F1. A top level list of view-shaped entries under any name but the declared ones
    # is refused here rather than walked past. doc_views() resolves by name and scripts/routes.py
    # resolves the same question by shape, and the difference is invisible on every document that
    # gets this far only because of this rule.
    stray = undeclared_view_lists(doc)
    if stray:
        bad("view-list-declared",
            f"the document carries {len(stray)} top level list(s) of view-shaped entries under "
            f"{', '.join(repr(s) for s in stray)}, and this gate walks "
            f"{', '.join(repr(s) for s in VIEW_LISTS)}. Every rule in this file, every rule in "
            f"check_provenance, and build_layout.py's geometry blacklist ask doc_views(), which "
            f"answers by name, so a view under any other name ships checked by nothing while the "
            f"build prints a view count and a node count that are both short of what it wrote to "
            f"disk. scripts/routes.py, reading the same bytes, finds it BY SHAPE and reports it, "
            f"so the two readers of one document would be answering differently about it. If the "
            f"list belongs here, add its name to VIEW_LISTS and the gates walk it; if it does "
            f"not, it is a block of the document nothing is judging.")

    views = doc_views(doc)
    classes = doc.get("routes", {}).get("classes", {})
    if not isinstance(classes, dict) or not classes:
        bad("empty-input", "the document ships no populate registry, so every node's class "
                           "would join to nothing and the join rule below would examine "
                           "nothing while reporting clean.")

    n_nodes = n_edges = n_orphans = 0
    per_view = []
    for v in views:
        key = v.get("key", "?")
        if v.get("grain", "sessions") != "sessions":
            key = key + " (" + str(v.get("grain")) + ")"
        nodes, edges = v.get("nodes"), v.get("edges")
        if not isinstance(nodes, list) or not nodes:
            bad("empty-input", f"view {key} holds no nodes. A view is a statement about a set of "
                               f"objects and an empty one is a page with nothing on it, which "
                               f"every rule below would call clean.")
        if not isinstance(edges, list):
            bad("empty-input", f"view {key} carries no edge list at all. An empty list is a "
                               f"legal view of unrelated objects; a missing one is a document "
                               f"this gate cannot judge.")

        ids = []
        for n in nodes:
            nid = n.get("id")
            ids.append(nid)
            if n.get("class") not in classes:
                bad("node-class-declared",
                    f"{key} node {nid} is class {n.get('class')!r}, which names no entry in this "
                    f"document's populate registry. The first {n.get('route')} rows of its panel "
                    f"are that entry rendered, and the rule that refuses a value claiming to come "
                    f"from a system's own record asks the registry a question a missing entry "
                    f"cannot answer.")
        dupes = sorted({i for i in ids if ids.count(i) > 1})
        if dupes:
            bad("node-id-unique",
                f"{key} declares {len(nodes)} nodes carrying {len(set(ids))} distinct ids. "
                f"Repeated: {', '.join(map(str, dupes))}. The layout keys its nodes by id and "
                f"keeps the last of a pair, the declaration order keeps both, and the packer "
                f"then reserves height for a tile drawn underneath another one at the same "
                f"coordinates.")
        idset = set(ids)

        seen_edges = set()
        for e in edges:
            s, t, verb = e.get("s"), e.get("t"), e.get("v")
            for end, who in ((s, "source"), (t, "target")):
                if end not in idset:
                    bad("edge-endpoint-exists",
                        f"{key} edge {s!r} -{verb!r}-> {t!r} names {end!r} as its {who} and no "
                        f"node in {key} carries that id. The layout builds its adjacency by "
                        f"indexing the node table with both ends, so this reaches the drawing "
                        f"as a bare KeyError naming nothing.")
            if s == t:
                bad("edge-is-not-a-loop",
                    f"{key} edge {s!r} -{verb!r}-> {t!r} starts and ends on the same node. This "
                    f"layout draws an edge between two columns and has no shape for one inside "
                    f"a column: the path runs backwards through the tile, the arrowhead comes "
                    f"out at angle zero pointing the wrong way, and the verb chip lands on top "
                    f"of the tile. If a self relation is wanted, the drawing gains a shape for "
                    f"it and this rule is what makes that a decision.")
            if (s, t, verb) in seen_edges:
                bad("edge-declared-once",
                    f"{key} declares {s!r} -{verb!r}-> {t!r} more than once. It draws two "
                    f"identical paths and stacks two identical verb chips, which the chip "
                    f"separation gate cannot see: two chips on the same point do not overlap "
                    f"each other by any measure it takes.")
            seen_edges.add((s, t, verb))

        touched = {e["s"] for e in edges} | {e["t"] for e in edges}
        orphans = sorted(idset - touched)
        n_nodes += len(nodes)
        n_edges += len(edges)
        n_orphans += len(orphans)
        per_view.append((key, len(nodes), len(edges), orphans))

    return {"views": len(views), "nodes": n_nodes, "edges": n_edges, "orphans": n_orphans,
            "grains": {"sessions": len(doc.get("views") or []),
                       "modules": len(doc.get("collapsed") or [])},
            "per_view": per_view}


# ---- the instance document --------------------------------------------------
# Issue 60, seam 1. What this file has to say about the world, and nothing about where any of it
# is drawn. Until this card the model and the geometry were one blob, site/graph.js, and changing
# one value meant re-running a Python build; the destination is a management tool reading data
# that changes without one, on a private deployment, while the public page keeps the invented
# document. That is only possible if the data document loads separately from the page, so this is
# the document, and build/build_layout.py is a function from it to geometry.
#
# WHAT IS IN IT: the object types with their labels, colours and glyphs; the seven views; each
# view's nodes with their type, label, properties, provenance flags, mark, note and identity; the
# relationships with their verbs; and the roster. WHAT IS NOT: any coordinate, extent, tile size,
# column, line break, path or band. The build refuses to write a geometry key into it, and refuses
# to write a property value into the layout, so the split is a gate rather than an intention.
#
# THE COLOURS ARE HERE AND THAT IS DELIBERATE. A type's colour is a fact about the type. It is
# read through type_colour(), the same accessor the contrast check reads, so the drawing and the
# measurement cannot come to hold different palettes.
def _ghost_ids(view):
    return {n["id"] for n in view["nodes"] if n.get("ghost")}


def emit_view(v):
    """One view as the document ships it, at whichever altitude it was built at.

    ONE FUNCTION FOR BOTH LISTS, which is the point of it. `views` and `collapsed` hold the same
    kind of object and a second copy of this shape would be the place the two came apart: a key
    added to one and not the other is a page that draws a tile at one altitude and not at the
    other, and nothing would say so.
    """
    return {
        "key": v["key"], "code": v["code"], "name": v["name"], "label": v["label"],
        # Issue 89. The altitude, and the address that reaches it. A grain is state in the
        # address exactly as the programme is, so a collapsed view can be linked and reloaded;
        # the suffix is written HERE, once, and read by the page, because a route constructed in
        # a second place is a route that can be constructed wrong.
        "grain": v["grain"],
        "route": "#/p/" + v["key"] + ("" if v["grain"] == "sessions" else "/modules"),
        # `class` is the join to the populate registry above and `route` is the number of rows at
        # the front of `props` that the registry produced. Two different questions under two
        # names that read alike, and the shorter one is the count because it is the one app.js
        # has always read.
        "nodes": [{"id": n["id"], "type": n["type"], "label": n["label"], "class": n["class"],
                   "count": n.get("count"), "props": n["props"], "route": n["route"],
                   # Issue 157, and the mirror of `route`: how many rows at the BACK of the list
                   # are ways to reach this object. Zero on every node that is not somebody or
                   # something you write to, and written on all of them rather than only where it
                   # is non-zero, because a key that is sometimes absent is a key a reader has to
                   # tell apart from a key that is zero.
                   "reach": n["reach"],
                   "source_system": n["source_system"], "source_key": n["source_key"],
                   "ghost": 1 if n.get("ghost") else None,
                   "mark": n.get("mark"), "tail": n.get("tail"), "note": n.get("note")}
                  for n in v["nodes"]],
        # `ghost` on a relationship is DERIVED from its ends and, since issue 75, may also be
        # DECLARED. It is here rather than in the layout because whether a relationship is one
        # the model cannot record is a fact about the model. The layout only reads it, to pick
        # the face its verb chip is measured in.
        #
        # WHY DECLARING IT HAD TO BE POSSIBLE. Derivation answers one question only, whether an
        # end of the relationship is a class nothing holds, and it answers it correctly for the
        # four ghost nodes. It cannot see the other case: two classes that both exist, a relation
        # between them that is real, and no system that writes the relation down. Inferring that
        # from the ends would be the same inversion issue 75 was filed about, reading a fact about
        # the recording off a fact about the objects.
        #
        # NO EDGE IN THIS MODEL DECLARES IT TODAY. The one that did, the host's edge to the
        # Programme, was deleted when the owner settled #75 as the cohort edge alone, so the
        # left-hand term below is false on every relationship and every ghost chip on the page
        # comes from the right-hand one. The term is kept rather than dropped for the reason the
        # ghosts block gives at length: the capability is distinct from derivation and removing it
        # is a decision about the model, not a consequence of one edge.
        #
        # `n` is issue 89's, and it is null on every unfolded line rather than 1: a count on a
        # line that stands for itself is noise, and a reader of these bytes should be able to find
        # every folded relationship by asking for the key rather than by comparing numbers. The
        # verb is NOT touched by the fold, for the reason issue 100 gives about its own:
        # selection.js's reveal table is keyed by verb.
        "edges": [{"s": _e[0], "t": _e[1], "v": edge_parts(_e)[2],
                   "ghost": 1 if (edge_parts(_e)[3]
                                  or _ghost_ids(v).intersection(_e[:2])) else None,
                   "n": edge_count(_e) if edge_count(_e) > 1 else None}
                  for _e in v["edges"]],
        "roster": v["roster"],
        "counts": v["counts"],
    }


# The declared top level lists of views, in the order a gate walks them. Written down here once
# and read by doc_views() and by the rule that refuses an undeclared one, so the walk and the
# rule cannot disagree about what the allow list is.
VIEW_LISTS = ("views", "collapsed")

# What makes a list a list of views, to a reader that does not know its name. The same three
# keys scripts/routes.py matches on, and that is not an accident: that file resolves the lists
# BY SHAPE and this one by name, and the rule below is what keeps a document from existing on
# which the two answers differ.
VIEW_SHAPE = ("key", "grain", "nodes")


def view_shaped(value):
    """True of a non-empty list every entry of which carries a key, a grain and a set of nodes."""
    return (isinstance(value, list) and bool(value)
            and all(isinstance(v, dict) and all(k in v for k in VIEW_SHAPE) for v in value))


def undeclared_view_lists(doc):
    """Every top level list of view-shaped entries filed under a name no gate walks."""
    return sorted(k for k, v in doc.items() if k not in VIEW_LISTS and view_shaped(v))


def doc_views(doc):
    """Every view in an instance document, at either altitude.

    THE ONE ANSWER TO "WHAT IS IN THIS DOCUMENT", and it exists because the answer stopped being
    one list. Four separate comments in build/build_layout.py record the same failure from four
    cards: a block a gate's walk cannot see is where the next unchecked thing lands. Issue 89
    added a second list of NODES, which is the largest such block this document has ever grown,
    so every gate asks this rather than reaching for `views` and being right about half of it.

    IT RESOLVES BY NAME AND IT IS NOW SAFE TO, which it was not. Issue 117. scripts/routes.py
    asks the same question of the shipped bytes and resolves BY SHAPE, and its own comment says
    so, and every reader of both took the two to be the same question answered twice. They are
    not: a third top level list of view-shaped entries is read by that file and walked by
    nothing here, so a view under any name but these two shipped un-provenance-checked,
    un-structure-checked and with no geometry blacklist over it, and the build printed a view
    count and a node count that were both short of what it had written to disk. Proved by
    construction on the card.

    The repair is not to make this one shape-based. It is the rule in check_structure that
    refuses an undeclared list outright, which fails on the day the list is added rather than
    silently widening the walk, and which is what makes the by-name and by-shape answers the
    same answer on every document that can be built.
    """
    return [v for name in VIEW_LISTS for v in (doc.get(name) or [])]


# ---- what a digest is FOR, and therefore what is inside one -------------------
# Issue 116. The fourteen drawing digests were correct and they covered less than the drawing.
# The card asked for a decided scope and not a bigger hash, so the decision is written here,
# beside the machinery, rather than left to be inferred from what the code happens to hash.
#
# THE DRAWING DIGEST ANSWERS ONE QUESTION: are two pages drawing the same picture from the same
# data. It is a fingerprint of everything the build hands the renderer for one drawing, and of
# nothing else. That makes its scope a fact rather than a judgement: it is exactly the object
# site/app.js assembles in joinList and site/render.js is called with. Today that object is the
# view's instance payload, the geometry laid out from it, and the type registry.
#
# THE TYPE REGISTRY IS IN IT BECAUSE IT PAINTS EVERY TILE. site/render.js reads each type's
# glyph name, its colour pair and its accessible label out of `drawing.types`, which app.js
# feeds from the top level `types` block. Before this card that block was outside all fourteen
# digests: one glyph changed in TYPES above repainted ninety one tiles across nine of the
# fourteen drawings, and every digest, both generated documents and the whole verify run said
# nothing had moved.
#
# THE WHOLE REGISTRY AND NOT THE TYPES ONE DRAWING USES. A page is handed one registry and
# paints all fourteen drawings from it, so a page whose registry differs is not painting the
# same way whatever tiles it happens to hold. Over-covering costs a digest that moves on a type
# no drawing shows; under-covering costs the failure this card is about.
#
# THE CODE THAT PAINTS IS OUTSIDE IT, DELIBERATELY, and this is the row the card said had to be
# argued rather than answered by reflex. site/render.js is not data. Folding it into the drawing
# digest would make every presentation edit invalidate all fourteen drawings at once, which
# destroys the only thing the value is good for: telling a data difference from a code
# difference. Which code a page is running is already answered, by the commit in
# site/version.js. What render.js held that belongs under a digest is the glyph GEOMETRY, and
# that is glyph_table() below: one value for the whole symbol table, carried by the geometry
# document, so that changing a drawn symbol moves something and changing a comment about the
# chrome moves nothing.
#
# THE PREIMAGE IS CANONICAL AND NOT THE SHIPPED BYTES, which is the card's row F6 and is a
# choice. A digest is worth having only if a second implementation can recompute it from the
# document, and the shipped bytes carry a separator and key-order convention that has nothing to
# do with the picture. The shipped bytes have a stronger gate of their own: scripts/
# check_build.sh byte-compares both generated documents against a rebuild of them.
#
# NOTHING RECOMPUTES ANY OF THESE WHILE THE PAGE IS OPEN, which is the card's row F5, and it is
# recorded here rather than repaired because the repair is not the one it looks like.
# scripts/check_build.sh recomputes all fourteen and both document-wide values on every push, so
# the values are load bearing in the tree; what is not covered is the PUBLISHED ORIGIN, where
# nothing byte-compares the served generated documents against the ones that were built.
#
# A browser-side recompute cannot answer that, and not for want of effort: JavaScript cannot
# rebuild this preimage from the parsed document AT ALL. Every coordinate in site/layout.js is a
# rounded float, `JSON.parse('{"x":105.0}')` and `JSON.parse('{"x":105}')` produce the same
# object, and `JSON.stringify` writes `105` for both where Python writes `105.0`. A page would
# have to hash the served TEXT instead, which is a different value answering a different
# question, and one no build could produce because the digest lives inside the text it would
# cover.
#
# The question the origin actually raises, "is the origin serving the drawing we built", is
# answered completely and without a digest by fetching site/instance.js and site/layout.js and
# comparing their bytes with the committed copies: one request and one sha256 each, in
# scripts/verify.sh's origin steps beside the two that already fetch from there. That is the
# instrument, it is cheap, and it is a change to a file this card does not own.
def canonical(obj):
    """The one serialization every digest in this repository is taken over.

    Sorted keys and no whitespace, so the value is a function of what the document SAYS and not
    of the order the builder happened to write it in.
    """
    return json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def short_digest(text):
    """Seven hex characters, the length every digest in this repository is quoted at."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:7]


def drawing_digest(types, view, geometry):
    """The digest of one drawing: the registry, the payload and the geometry together.

    ONE FUNCTION AND NOT TWO. build/build_layout.py computes it and scripts/check_build.sh
    recomputes it from the shipped documents to prove the shipped value is the one these bytes
    produce. A second copy of the preimage in the checker would be a checker that agrees with
    itself, which is the defect this repository has already filed once as two copies of one rule.

    `geometry` must not already carry its own digest. A value cannot cover itself, and a caller
    that handed one in would be hashing a previous run's answer into this one.
    """
    if "drawingDigest" in geometry:
        raise ValueError("drawing_digest was handed geometry that already carries a digest; the "
                         "value cannot be part of its own preimage")
    return short_digest(canonical({"types": types, "view": view, "geometry": geometry}))


def document_digest(inst):
    """The digest of a whole instance document, every top-level block of it.

    A SECOND QUESTION AND NOT A WIDER ANSWER TO THE FIRST. A drawing digest asks whether two
    pages draw one picture the same way; this asks whether they read the same data at all. The
    blocks that reach no drawing still reach the reader: `agenda` fills the session sheet,
    `routes` fills the populate panel, `provenance` decides what every value on the page is
    allowed to be acted on, and `default` decides which programme opens. None of them is in a
    drawing digest and it would be wrong to put them there, so they are covered here instead,
    and nothing in the data document is now outside every digest.
    """
    return short_digest(canonical(inst))


# ---- the glyph table, which is drawing geometry living in code ----------------
# Issue 116 row F4. Two facts about one tile are written in two files: build/model.py names the
# symbol a type is drawn with and site/render.js holds the strokes that symbol is made of.
# Nothing joined them, so a path edited under an unchanged name repainted ninety one tiles with
# every generated document byte-identical, and a name with no path would have thrown on the
# first tile that reached it.
#
# THE TABLE IS READ, NEVER PARSED INTO VALUES. What is wanted is a fingerprint of the strokes
# and the set of names, and a JavaScript object literal with comments in it is not JSON. The
# slice of source text is the honest preimage: it moves when a stroke moves, when a symbol is
# renamed and when a symbol is added, which is every change that can alter what a reader sees.
# It also moves when a comment inside the table is edited, which is the price and is small,
# because the comments inside this table are about the symbols.
GLYPH_TABLE_RE = re.compile(r"^  var PATHS = \{$.*?^  \};$", re.S | re.M)
GLYPH_KEY_RE = re.compile(r"^    (\w+):", re.M)


def glyph_table(path):
    """The stroke glyph table as site/render.js declares it: (source text, key list).

    Raises ValueError when the table cannot be found, which is an abort and not an empty
    answer: a reader that returned no keys would report every glyph unbound and every binding
    covered at the same time.
    """
    src = pathlib.Path(path).read_text(encoding="utf-8")
    m = GLYPH_TABLE_RE.search(src)
    if not m:
        raise ValueError(f"{path} holds no `var PATHS = {{ ... }};` block at the indentation "
                         f"this reader knows. The glyph table is what every tile is drawn from "
                         f"and a fingerprint of a table that was not found is worth nothing.")
    keys = GLYPH_KEY_RE.findall(m.group(0))
    if not keys:
        raise ValueError(f"the glyph table in {path} declares no symbols at all")
    return m.group(0), keys


def glyph_binding(inst, keys):
    """The glyph names this document will actually paint with, and the ones with no strokes.

    NOT EVERY NAME IN THE REGISTRY, and the difference is the whole precision of the rule. A
    tile draws its glyph only when it is neither a ghost nor a count: a ghost tile is
    deliberately empty and a tile standing for many draws the number instead. Two of the
    fourteen names declared today, `ghost` and `stack`, are therefore never reached, and a rule
    that refused over them would be refusing over a symbol nobody can see. What is refused is
    exactly the crash: a tile that will be painted with a name the renderer cannot draw.
    """
    glyph_of = {t["k"]: t.get("glyph") for t in inst["types"]}
    painted = {}
    for v in doc_views(inst):
        for n in v["nodes"]:
            if n.get("ghost") or n.get("count"):
                continue
            painted.setdefault(glyph_of.get(n["type"]), set()).add(f"{v['key']} {n['id']}")
    unbound = sorted((g, sorted(where)) for g, where in painted.items() if g not in set(keys))
    return sorted(k for k in painted if k), unbound


def instance_document():
    """The data, as the page and any other reader gets it. No geometry."""
    return {
        "default": VIEWS[0]["key"],
        "types": [{"k": k, "label": lab, "c": col,
                   "cDark": type_colour(k, col, "dark"), "glyph": glyph,
                   "ghost": 1 if k == "Ghost" else None}
                  for k, lab, col, glyph in TYPES],
        # ---- the populate registry, issue 72 -------------------------------------------------
        # Seventeen classes, keyed by class id, each one a declaration a source adapter could be
        # written against: which system holds the rows, what a row is, how the rows are split,
        # what identifies one, who enters it, on what event, whether the system can be read at
        # all today, and whether an adapter exists. Every node carries `class`, which is the join
        # back to this table, and nine of the entries say that no adapter can exist here at all,
        # with the reason as a token rather than as an empty field.
        #
        # The vocabularies travel with it. A reader of these bytes needs no Python to know what
        # `not-attempted` or `intersection-only` means, and a token that is in no vocabulary
        # stops the build.
        "routes": {"vocab": {"read": READ_STATE, "adapter": ADAPTER_STATE, "key": KEY_STATE,
                             "field": FIELD_STATE, "role": ROLE, "absence": ABSENCE,
                             "caveat": CAVEAT, "act": REACH_ACT},
                   "classes": ROUTES},
        # ---- provenance, issue 73 -------------------------------------------------------------
        # What kind of estate this document describes, the date its provenance was established,
        # the clock staleness is computed against, and the vocabularies for the three tokens a
        # value's provenance is written in. Beside the registry and not inside it: a route is a
        # fact about a class and a provenance is a fact about a value, and issue 72's own note
        # says which grain each question belongs to.
        #
        # `status` and `apto` are absent on purpose and their absence is the doctrine. Every
        # reader computes them from a value's `r` and `at` against this clock, so there is no
        # written answer for a written answer to be wrong about.
        "provenance": {
            "stance": PROVENANCE_STANCE,
            "as_of": PROVENANCE_AS_OF,
            "clock": {"fresh_days": FRESH_DAYS, "aging_days": AGING_DAYS},
            "apto": list(APTO),
            "vocab": {"rank": VALUE_RANK, "status": VALUE_STATUS, "stance": STANCE,
                      "flag": VALUE_FLAG, "produces": SOURCE_PRODUCES},
            # Issue 118. The one population on this page that was read off something says what
            # it was read off, when, which gate re-reads it, and which (type, key) seats it
            # filled. It ships with the document for the reason every vocabulary here does:
            # check_provenance() judges a document against the sources THAT DOCUMENT declares,
            # so an --instance deployment states its own and this toy's tuple is not the law.
            "sources": VALUE_SOURCES,
        },
        # ---- the invented session agenda, issue 85 --------------------------------------------
        "agenda": SESSION_AGENDA,
        # ---- the seven programmes, and the same seven one altitude up, issue 89 ---------------
        # TWO LISTS AND NOT ONE FOURTEEN LONG. `views` means "the seven programmes" to every
        # reader of these bytes, including readers this build does not own: scripts/smoke.mjs
        # recomputes the header's gap total off window.GI as an independent check of the number
        # the page prints, and walks the list by position against the seven drawings. Built as one
        # list of fourteen it counted 146 where the page says 95 and compared Z-SC's drawing with
        # Z-IB's document, which is a false regression report about a page that is right. A
        # collapsed view is the same objects re-expressed, not more of them, and anything summing
        # over `views` should go on getting the business exactly once.
        #
        # EVERY GATE ASKS doc_views() AND NONE OF THEM ASKS FOR `views`, which is the whole of
        # what keeps the second list from being the blind spot the first four such blocks were.
        "views": [emit_view(v) for v in VIEWS],
        "collapsed": [emit_view(v) for v in COLLAPSED],
    }


# ---- proving the provenance gate is armed ------------------------------------
# TPS.md: each gate is proved armed before it is trusted, and every workflow runs the relevant
# self-test alongside the live check. One synthetic document per rule, each one differing from a
# document that PASSES by exactly the mutation under test, which is the part that matters: a
# probe that trips a gate proves nothing unless its control is known to clear the same gate, and
# a control nobody checks is how a dead one survives. The control is asserted first and every
# probe is built from it.
# How many probes each suite intends to run. Written by hand and asserted at the end of the run,
# which is the whole point: a count taken from the run itself cannot notice a probe that is no
# longer there. Edited together with the probes or not at all.
PROVENANCE_PROBES = 61
STRUCTURE_PROBES = 22


def _probe_doc(stance="invented"):
    """The smallest document this gate accepts. Two rows, one registry and one of the node's
    own, which is the shape of every node in the real one."""
    return {
        "provenance": {
            "stance": stance,
            "as_of": PROVENANCE_AS_OF,
            "clock": {"fresh_days": FRESH_DAYS, "aging_days": AGING_DAYS},
            "apto": list(APTO),
            "vocab": {"rank": VALUE_RANK, "status": VALUE_STATUS, "stance": STANCE,
                      "flag": VALUE_FLAG, "produces": SOURCE_PRODUCES},
        },
        "routes": {"classes": {"probe": {"read": "not-attempted"}}},
        "views": [{"key": "PROBE", "nodes": [{
            "id": "n1", "class": "probe", "route": 1,
            "props": [p("route_system", "a system holds it", E, OBSERVED),
                      p("a_value", "12", D)],
        }]}],
    }


def _probe(doc, row=None, node=None, prov=None, drop_prov=False, agenda=None, row_drop=None):
    """The control with one thing changed, so a probe and its control differ by that alone."""
    d = _probe_doc(doc)
    if agenda is not None:
        d["agenda"] = agenda
    if drop_prov:
        del d["provenance"]
    if prov:
        d["provenance"].update(prov)
    if node:
        d["views"][0]["nodes"][0].update(node)
    if row is not None:
        d["views"][0]["nodes"][0]["props"][row[0]].update(row[1])
    # A field REMOVED rather than changed, which is its own mutation and the one the audit ran:
    # `f` deleted outright from every node row was accepted, and a probe that can only overwrite
    # a field can never build that document.
    if row_drop is not None:
        d["views"][0]["nodes"][0]["props"][row_drop[0]].pop(row_drop[1], None)
    return d


# ---- the second control document, issue 118 ---------------------------------
# `real` is now reachable only through a seat a declared source says it filled, so a probe about
# `real` needs a document that DECLARES ONE. This is that document: the control above with a
# source over the node's own row, and the row filled the way the source says it filled it. Every
# probe below is this document with one thing changed, which is the same discipline the first
# control is held to.
#
# ITS KEY IS ONE OF THE SIX THE OLD RULE ALLOWED, deliberately. The probes that matter are the
# ones the old body waved through, and the old body's whole test was the key name, so a probe
# using a name it never heard of would prove nothing about what changed.
PROBE_SOURCE_NAME = "probe-corpus"
PROBE_SOURCES = {
    PROBE_SOURCE_NAME: {
        "corpus": "a corpus that is not on the machine this probe runs on",
        "read_on": PROVENANCE_AS_OF,
        # A name this program does not define, which is a foreign document's own gate: the rule
        # about a recheck that did not run speaks only about gates THIS program owns, and the
        # control has to sit on the side of that line where nothing is claimed.
        "rechecked_by": "probe_recheck",
        "produces": "values",
        "rank": SYLLABUS_RANK,
        "flags": [R, A],
        "covers": {"Probe": ["module_name"]},
    },
}

# ---- and the third control document, issue 123 -------------------------------
# The registry population needs a document that DECLARES A SOURCE THAT PRODUCED IT, for exactly
# the reason the second control exists: the three rules about a registry seat cannot be shown to
# refuse anything from a document where no seat is covered. Its seat is the route row the first
# control has always carried, at index 0, inside the one registry row that control declares.
PROBE_REGISTRY_NAME = "probe-analysis"
PROBE_REGISTRY_SOURCES = {
    PROBE_REGISTRY_NAME: {
        "corpus": "an analysis of the systems, on no machine this probe runs on",
        "read_on": PROVENANCE_AS_OF,
        "rechecked_by": "probe_recheck",
        "produces": "registry",
        "rank": OBSERVED,
        "flags": [E, A],
        "covers": {"Probe": ["route_system"]},
    },
}


def _registry_sourced(row=None, source=None, node=None):
    """The registry-sourced control with one thing changed, same discipline as _sourced()."""
    src = copy.deepcopy(PROBE_REGISTRY_SOURCES)
    if source is not None:
        src[PROBE_REGISTRY_NAME].update(source)
    d = _probe("invented", node=dict(node or {}, type="Probe"), prov={"sources": src})
    if row is not None:
        d["views"][0]["nodes"][0]["props"][0].update(row)
    return d


def _sourced(row=None, source=None, sources=None, add=None, node=None, drop_seat=False):
    """The sourced control with one thing changed.

    `source` edits the declaration, `sources` replaces the whole table, `row` edits the covered
    seat, `add` appends a row to the node, and `drop_seat` renames the seat away so the seat the
    source declared is empty.
    """
    src = copy.deepcopy(PROBE_SOURCES)
    if source is not None:
        src[PROBE_SOURCE_NAME].update(source)
    if sources is not None:
        src = sources
    d = _probe("invented", node=dict(node or {}, type="Probe"), prov={"sources": src})
    seat = d["views"][0]["nodes"][0]["props"][1]
    seat.update({"k": "module_name", "v": "Inside consulting", "f": R, "r": SYLLABUS_RANK})
    if drop_seat:
        seat.update({"k": "not_the_seat", "v": "12", "f": D, "r": INVENTED})
    if row is not None:
        seat.update(row)
    if add is not None:
        d["views"][0]["nodes"][0]["props"].append(add)
    return d


def provenance_self_test():
    ok = 0
    total = 0

    def expect(rule, doc, what):
        nonlocal ok, total
        total += 1
        try:
            check_provenance(doc)
        except SystemExit as e:
            got = str(e).split(":", 1)[0].replace("[provenance] ", "")
            if got == rule:
                ok += 1
                print(f"  [OK]   {rule}: {what}")
            else:
                print(f"  [FAIL] {rule}: {what}. It refused, and for {got!r} instead.")
            return
        print(f"  [FAIL] {rule}: {what}. It did NOT refuse.")

    def expect_clean(doc, what):
        nonlocal ok, total
        total += 1
        try:
            n = check_provenance(doc)
        except SystemExit as e:
            print(f"  [FAIL] control: {what}. It refused: {e}")
            return
        ok += 1
        print(f"  [OK]   control: {what} ({n} value(s) examined)")

    # The controls first. A probe below is this document with one field changed, so if either of
    # these ever fails the probes stop meaning anything at all.
    expect_clean(_probe_doc(), "the synthetic document every probe is built from passes")
    expect_clean(_probe("live", row=(1, {"r": OBSERVED, "at": "2026-08-01"})),
                 "a live document whose values were read and dated passes")

    expect("document-block", _probe("invented", drop_prov=True),
           "a document with no provenance block at all")
    expect("document-block", _probe("invented", prov={"stance": "hopeful"}),
           "a stance the document's own vocabulary does not define")
    expect("document-block", _probe("invented", prov={"as_of": "soon"}),
           "an as_of that is not a date, so nothing can be aged against it")
    expect("document-block",
           _probe("invented", prov={"clock": {"fresh_days": 400, "aging_days": 10}}),
           "a clock whose fresh window is wider than its aging window")
    expect("document-block", _probe("invented", prov={"vocab": {"rank": VALUE_RANK}}),
           "a provenance block shipping no vocabulary for its statuses and stances")
    expect("document-block",
           _probe("invented", prov={"vocab": {"rank": VALUE_RANK, "status": VALUE_STATUS,
                                              "stance": STANCE}}),
           "a provenance block shipping no vocabulary for the flag the reader is shown")
    expect("rank-vocabulary", _probe("invented", row=(1, {"r": "9_hoped"})),
           "a rank in no vocabulary")
    # Issue 104. The flag was validated nowhere at all, so all four of these documents were
    # accepted before this card and the last two of them put a made up number on the page wearing
    # the chip that says it is not made up.
    expect("flag-vocabulary", _probe("invented", row=(1, {"f": "banana"})),
           "a flag in no vocabulary, which the panel puts straight into a class name")
    expect("flag-vocabulary", _probe("invented", row_drop=(1, "f")),
           "a row with no flag at all, which renders beside the value as nothing")
    expect("flag-vocabulary",
           _probe("invented", agenda={"by_template": {"t": [p("scope", "x", "banana")]}}),
           "a flag in no vocabulary on an agenda line")
    expect("real-flag-not-invented", _probe("invented", row=(1, {"f": R})),
           "a made up value wearing the real chip, which is the audit's own mutation")
    expect("real-flag-needs-a-source", _probe("invented", row=(0, {"f": R})),
           "a registry row flagged real on an invented document: ranked observed, so the rule "
           "above lets it through, and what it cites is an analysis and not the value")
    expect("computed-not-typed", _probe("invented", row=(1, {"status": "fresh"})),
           "a status typed onto a row instead of computed from it")
    expect("computed-not-typed", _probe("invented", row=(1, {"apto": True})),
           "an apto typed onto a row")
    expect("invented-carries-no-read-date", _probe("invented", row=(1, {"at": "2026-08-01"})),
           "a read date on a value nothing was read for")
    expect("read-date-is-a-date", _probe("invented", row=(0, {"at": "last tuesday"})),
           "a read date that is not a date")
    expect("read-from-the-future", _probe("invented", row=(0, {"at": "2026-09-01"})),
           "a value read after the document that carries it was written")
    expect("stance-invented-refuses-apto",
           _probe("invented", row=(0, {"r": CONFIRMED, "at": PROVENANCE_AS_OF})),
           "a value fit to act on, on a page where everything else is invented")
    expect("stance-live-refuses-invented", _probe("live"),
           "an invented value in a document that says its values were read")
    expect("registry-row-invented", _probe("invented", row=(0, {"r": INVENTED})),
           "a registry row ranked invented, when it cites the analysis it came from")
    # Issue 85's third population, proved in both directions and with its own control, because a
    # rule that only ever refuses is a rule nobody has shown lets the right thing through.
    # Issue 85's agenda block, the only invented prose on the page, proved armed in three
    # directions: absent is legal, present and honest passes, present and dishonest is refused.
    expect_clean(_probe("invented", agenda=SESSION_AGENDA),
                 "the shipped agenda block, every line dummy and invented, passes")
    expect("agenda-block", _probe("invented", agenda={"by_template": {"t": []}}),
           "an agenda block declaring a template and holding no lines under it")
    expect("agenda-row-not-invented",
           _probe("invented", agenda={"by_template": {"t": [p("scope", "x", D, OBSERVED)]}}),
           "an agenda line claiming it was read off something")
    expect("agenda-row-not-dummy",
           _probe("invented", agenda={"by_template": {"t": [p("scope", "x", E)]}}),
           "an agenda line flagged as an estimate rather than as a stand-in")
    expect_clean(_sourced(),
                 "a syllabus value ranked observed and undated passes on an invented document")
    # The other side of the two flag rules, and without it they are a ban rather than a rule.
    # `real` is scoped to the invented stance for a reason, so a live document carrying it on an
    # ordinary read value has to go through.
    expect_clean(_probe("live", row=(1, {"r": OBSERVED, "at": "2026-08-01", "f": R})),
                 "a live document's read value flagged real passes, which is what the scoping "
                 "of the rule above claims")
    expect("syllabus-row-not-observed", _sourced(row={"r": INVENTED}),
           "a syllabus value ranked invented, which says the vault string was made up")
    expect("syllabus-row-carries-no-read-date", _sourced(row={"at": "2026-08-08"}),
           "a syllabus value carrying a read date, which would compute fresh and read as apto")
    # ---- what a stated source is, issue 118 -------------------------------------------------
    # THE AUDIT'S A3 FIRST, because it is the reason this block exists. Every probe from here to
    # the end of the group was ACCEPTED by the body this replaced: the old rule tested whether
    # the row's key was one of six words, so a row of invented prose renamed `module` and ranked
    # observed went through it wearing the real chip. Under a seat the answer is no: `module` on
    # a node no source covers for `module` is a name, not a reading.
    expect("real-flag-needs-a-source",
           _sourced(add=p("module", "M04 a module nobody read", R, SYLLABUS_RANK)),
           "a made up row RENAMED into one of the six key names the old rule allowed, ranked "
           "observed on a node type no source covers for it. This is the audit's A3")
    expect_clean(_sourced(row={"f": A, "v": "no module recorded in the syllabus"}),
                 "a covered seat flagged absent passes, because an absence read off a real "
                 "corpus is a reading and the source declares that flag")
    expect("source-row-flag", _sourced(row={"f": D}),
           "a covered seat downgraded to dummy, which tells the reader a value read off a real "
           "corpus was made up")
    expect("source-covers-a-population",
           _sourced(add=p("module_name", "a second one", R, SYLLABUS_RANK)),
           "two rows under one covered key, which is how a row joins a population by taking a "
           "name that is already spoken for")
    expect("source-covers-a-population", _sourced(drop_seat=True),
           "a covered seat missing from a node of a covered type, which is a reading deleted "
           "and no rule in the old body could see it")
    expect("source-recheck-did-not-run",
           _sourced(source={"rechecked_by": "module_stats"}),
           "a source citing a gate this program defines and never recorded a re-read for")
    expect("source-declaration", _sourced(source={"corpus": "  "}),
           "a source that does not say what was read")
    expect("source-declaration", _sourced(source={"rechecked_by": ""}),
           "a source that names no gate to re-read it, so the drift it would catch is nobody's")
    expect("source-declaration", _sourced(source={"read_on": "recently"}),
           "a source read on something that is not a date")
    expect("source-declaration", _sourced(source={"read_on": "2026-09-01"}),
           "a source read after the document that cites it was written")
    expect("source-declaration", _sourced(source={"rank": INVENTED}),
           "a source producing values at the rank whose definition is that nothing was read")
    expect("source-declaration", _sourced(source={"flags": [D]}),
           "a source whose rows wear no flag this rule is about")
    expect("source-declaration", _sourced(source={"covers": ["module_name"]}),
           "a source covering a bare list of key names rather than a seat per node type, which "
           "is the shape the whole of issue 118 is about")
    expect("source-declaration",
           _sourced(sources=dict(copy.deepcopy(PROBE_SOURCES),
                                 **{"second-corpus": copy.deepcopy(
                                     PROBE_SOURCES[PROBE_SOURCE_NAME])})),
           "two sources claiming to have produced one seat, so no row in it can say which of "
           "them it came from")
    expect("source-declaration", _sourced(sources=["probe-corpus"]),
           "a sources block that is a list of names rather than a table of declarations")
    # ---- and the OTHER population a source can have filled, issue 123 -----------------------
    # Every probe from here to the end of the group was ACCEPTED by the body this replaces, and
    # most of them could not even be built against it: there was no such thing as a source that
    # produced registry rows, so the 1320 rows at the front of the panels rested on a comment.
    expect_clean(_registry_sourced(),
                 "a registry row sitting in the seat a source that produced registry rows says "
                 "it filled passes")
    expect("document-block",
           _probe("invented", prov={"vocab": {"rank": VALUE_RANK, "status": VALUE_STATUS,
                                              "stance": STANCE, "flag": VALUE_FLAG}}),
           "a provenance block shipping no vocabulary for what a source produced, which is the "
           "word deciding whether the real chip is reachable through it")
    expect("source-declaration", _registry_sourced(source={"produces": "guesswork"}),
           "a source claiming to have produced something the document's own vocabulary does "
           "not define")
    expect("source-declaration", _registry_sourced(source={"flags": [R, A]}),
           "a source that read an ANALYSIS of the systems and claims its rows may wear the chip "
           "that says a value came off the business")
    expect("source-declaration", _sourced(source={"produces": "registry"}),
           "a source that read a corpus of values and declares it produced registry rows, whose "
           "flags then carry the real chip it is not entitled to")
    expect("registry-source-outside-the-registry", _registry_sourced(node={"route": 0}),
           "a registry seat sitting among a node's own values, which is how one of them stops "
           "having to say it was made up")
    expect("registry-source-row-rank", _registry_sourced(row={"r": CONFIRMED}),
           "a registry row at a rank the source that produced it never declared")
    expect("registry-source-row-flag", _registry_sourced(row={"f": D}),
           "a registry row downgraded to a stand-in, which tells the reader a route read off a "
           "real analysis was made up")
    expect("source-covers-a-population", _registry_sourced(row={"k": "not_the_seat"}),
           "a registry seat renamed off the node, which is a route row deleted and the panel "
           "left with three")
    expect("toy-value-not-invented", _probe("invented", row=(1, {"r": OBSERVED})),
           "one of the model's own made up values ranked as read")
    expect("official-needs-a-read", _probe("invented", row=(0, {"r": OFFICIAL})),
           "a value read from a system's own record, on a class the registry says nobody has "
           "reached")
    expect("empty-input", _probe("invented", node={"props": []}),
           "a document with no values in it, which would otherwise report clean")

    # ---- and the second list of nodes, issue 89 ---------------------------------------------
    # The rules above are already proved armed. What these two prove is that the walk REACHES the
    # collapsed half of the document, which is a separate claim and is the one a walk of `views`
    # would fail silently: a hundred and forty nine values would go unexamined and the gate would
    # report clean about the drawing a reader gets by pressing the control.
    def _collapse(d, mutate=None):
        d["collapsed"] = [copy.deepcopy(d["views"][0])]
        d["collapsed"][0]["grain"] = "modules"
        if mutate:
            mutate(d["collapsed"][0]["nodes"][0]["props"][1])
        return d

    expect_clean(_collapse(_probe_doc()),
                 "a document carrying a second list of views at another grain passes, and its "
                 "values are examined too")
    expect("flag-vocabulary",
           _collapse(_probe_doc(), lambda row: row.update({"f": "banana"})),
           "a flag in no vocabulary in the COLLAPSED list, which a walk of `views` alone would "
           "never reach")
    expect("real-flag-not-invented",
           _collapse(_probe_doc(), lambda row: row.update({"f": R})),
           "a made up value flagged real in the collapsed list")

    # And the document this repository actually ships, which is the only one that matters.
    expect_clean(instance_document(), "the model's own instance document passes")

    print(f"\nprovenance self-test: {ok}/{total}")
    if ok != total:
        raise SystemExit(1)
    # THE TOTAL IS ASSERTED AGAINST A WRITTEN NUMBER, and until issue 104 it was not. `ok/total`
    # is a ratio, and a ratio cannot tell a suite that ran everything from a suite that ran half
    # of itself: delete a probe and its rule together and this printed "26/26" and exited 0. That
    # exact failure has happened twice in this repository, once when the smoke suite passed
    # 14 of 14 while silently running a fifth of itself, and once when the contrast gate reported
    # clean on a partial palette. Both were fixed the same way, with a count the check can see,
    # and this is the third copy of it.
    if total != PROVENANCE_PROBES:
        print(f"::error::the provenance self-test ran {total} probes and PROVENANCE_PROBES says "
              f"{PROVENANCE_PROBES}. A rule and its probe deleted together would otherwise have "
              f"left a smaller suite reporting clean.")
        raise SystemExit(1)


# ---- proving the structure gate is armed -------------------------------------
# Same shape as the provenance self-test above and for the same reason: a gate never seen to
# refuse is not a gate, and a probe that trips one proves nothing unless its control is known to
# clear the same gate. The control is asserted first and every probe is one mutation away from it.
def _structure_doc():
    """The smallest graph this gate accepts. Three nodes in a chain, which is enough shape for
    every rule below to have something to be wrong about."""
    return {
        "routes": {"classes": {"probe": {"read": "not-attempted"}}},
        "views": [{
            "key": "PROBE",
            "nodes": [{"id": "a", "class": "probe", "route": 1},
                      {"id": "b", "class": "probe", "route": 1},
                      {"id": "c", "class": "probe", "route": 1}],
            "edges": [{"s": "a", "t": "b", "v": "leads to"},
                      {"s": "b", "t": "c", "v": "leads to"}],
        }],
    }


def _structure_probe(mutate):
    """The control with one thing changed. The mutation is a function of the document rather
    than a table of keys, because these mutations are about a list's contents and not a field's
    value: an id repeated, an end repointed, an edge added twice."""
    d = _structure_doc()
    mutate(d)
    return d


def structure_self_test():
    ok = 0
    total = 0

    def expect(rule, doc, what, says=None):
        nonlocal ok, total
        total += 1
        try:
            check_structure(doc)
        except SystemExit as e:
            msg = str(e)
            got = msg.split(":", 1)[0].replace("[structure] ", "")
            if got != rule:
                print(f"  [FAIL] {rule}: {what}. It refused, and for {got!r} instead.")
            elif says is not None and says not in msg:
                # A refusal that fires and says nothing useful is the defect the audit filed as
                # A4: the build already refused an edge to a node that does not exist, with a
                # bare KeyError naming neither the edge nor the id. Naming it is the fix, so the
                # naming is what is asserted rather than the exit code.
                print(f"  [FAIL] {rule}: {what}. It refused and never said {says!r}.")
            else:
                ok += 1
                print(f"  [OK]   {rule}: {what}")
            return
        print(f"  [FAIL] {rule}: {what}. It did NOT refuse.")

    def expect_clean(doc, what, orphans=None):
        nonlocal ok, total
        total += 1
        try:
            got = check_structure(doc)
        except SystemExit as e:
            print(f"  [FAIL] control: {what}. It refused: {e}")
            return
        if orphans is not None and got["orphans"] != orphans:
            print(f"  [FAIL] control: {what}. It counted {got['orphans']} orphan(s), not "
                  f"{orphans}.")
            return
        ok += 1
        print(f"  [OK]   control: {what} ({got['views']} view(s), {got['nodes']} node(s), "
              f"{got['edges']} edge(s), {got['orphans']} orphan(s))")

    def drop_view(d):
        d["views"] = []

    def empty_nodes(d):
        d["views"][0]["nodes"] = []

    def drop_edges(d):
        del d["views"][0]["edges"]

    def drop_registry(d):
        d["routes"] = {"classes": {}}

    def duplicate_id(d):
        d["views"][0]["nodes"].append({"id": "b", "class": "probe", "route": 1})

    def edge_to_nowhere(d):
        d["views"][0]["edges"].append({"s": "c", "t": "zz", "v": "leads to"})

    def edge_from_nowhere(d):
        d["views"][0]["edges"].append({"s": "zz", "t": "a", "v": "leads to"})

    def self_loop(d):
        d["views"][0]["edges"].append({"s": "b", "t": "b", "v": "leads to"})

    def edge_twice(d):
        d["views"][0]["edges"].append({"s": "a", "t": "b", "v": "leads to"})

    def unknown_class(d):
        d["views"][0]["nodes"][1]["class"] = "not-in-the-registry"

    def orphan(d):
        d["views"][0]["nodes"].append({"id": "d", "class": "probe", "route": 1})

    # ---- and the same defects in the OTHER list, issue 89 -----------------------------------
    # THE POINT OF THESE FIVE IS THE LIST AND NOT THE RULE. Every rule above is already proved
    # armed; what these prove is that the walk REACHES the half of the document that card added.
    # A gate stopping at `views` would clear all five, and the drawing a reader is most likely to
    # be looking at, having pressed the control, is the one it never examined.
    def _second(d):
        d["collapsed"] = [copy.deepcopy(d["views"][0])]
        d["collapsed"][0]["grain"] = "modules"
        return d["collapsed"][0]

    def collapsed_clean(d):
        _second(d)

    def collapsed_duplicate_id(d):
        _second(d)["nodes"].append({"id": "b", "class": "probe", "route": 1})

    def collapsed_edge_to_nowhere(d):
        _second(d)["edges"].append({"s": "c", "t": "zz", "v": "leads to"})

    def collapsed_self_loop(d):
        _second(d)["edges"].append({"s": "b", "t": "b", "v": "leads to"})

    def collapsed_empty(d):
        d["collapsed"] = []

    # The controls first. Every probe below is this document with one thing changed, so if either
    # of these ever fails the probes stop meaning anything at all.
    expect_clean(_structure_doc(), "the synthetic graph every probe is built from passes",
                 orphans=0)
    expect_clean(_structure_probe(orphan),
                 "a node with no edge is legal and is COUNTED rather than refused", orphans=1)

    expect("empty-input", _structure_probe(drop_view),
           "a document with no views, which would walk nothing and report clean")
    expect("empty-input", _structure_probe(empty_nodes),
           "a view with no nodes in it, which every rule would call clean")
    expect("empty-input", _structure_probe(drop_edges),
           "a view carrying no edge list at all, as against an empty one")
    expect("empty-input", _structure_probe(drop_registry),
           "a document with an empty registry, against which every class would fail to join "
           "and the join rule would examine nothing")
    # THE PROVED ONE. This is the mutation the audit injected into this file, built for real,
    # and shipped past every static gate including check_build.sh saying VERDICT: clean.
    expect("node-id-unique", _structure_probe(duplicate_id),
           "two nodes under one id, drawn as two tiles at identical coordinates", says="b")
    expect("node-id-unique", _structure_probe(duplicate_id),
           "and the refusal says how many nodes carry how many distinct ids", says="4 nodes "
           "carrying 3 distinct ids")
    expect("edge-endpoint-exists", _structure_probe(edge_to_nowhere),
           "an edge whose target is a node the view does not declare", says="'zz'")
    expect("edge-endpoint-exists", _structure_probe(edge_from_nowhere),
           "an edge whose source is a node the view does not declare", says="'zz'")
    expect("edge-endpoint-exists", _structure_probe(edge_to_nowhere),
           "and the refusal names the edge, not only the id", says="'c' -'leads to'-> 'zz'")
    expect("edge-is-not-a-loop", _structure_probe(self_loop),
           "an edge from a node to itself, which emits a path running backwards through its own "
           "tile", says="'b' -'leads to'-> 'b'")
    expect("edge-declared-once", _structure_probe(edge_twice),
           "the same relationship declared twice, which stacks two verb chips on one point",
           says="'a' -'leads to'-> 'b'")
    expect("node-class-declared", _structure_probe(unknown_class),
           "a node whose class names no entry in the populate registry",
           says="'not-in-the-registry'")

    # The second list, issue 89. The control first, for the reason every control here exists: a
    # probe that trips a gate proves nothing unless the document it differs from is known to
    # clear the same gate.
    expect_clean(_structure_probe(collapsed_clean),
                 "a document carrying a second list of views at another grain passes, and both "
                 "lists are counted")
    expect("empty-input", _structure_probe(collapsed_empty),
           "a document declaring a collapsed grain and putting no view in it, which every rule "
           "would walk past in silence")
    expect("node-id-unique", _structure_probe(collapsed_duplicate_id),
           "two nodes under one id in the COLLAPSED list, which a walk of `views` alone would "
           "never see", says="b")
    expect("edge-endpoint-exists", _structure_probe(collapsed_edge_to_nowhere),
           "an edge to a node the collapsed view does not declare", says="'zz'")
    expect("edge-is-not-a-loop", _structure_probe(collapsed_self_loop),
           "a self-loop in the collapsed view", says="'b' -'leads to'-> 'b'")

    # A THIRD LIST, issue 117 F1, and the mutation is the audit's own. The list below is a legal
    # view in every respect: the rule fires on the NAME and not on the contents, which is the
    # whole point, because a list nothing walks is where the next unchecked thing lands whether
    # or not anything is wrong with it today. Proved by construction on the card: a `zoomed` list
    # carrying one violation of each of four separate rules was built, shipped, and reported on
    # by nothing, while the byte-identical node placed in `collapsed` was refused.
    def third_list(d):
        d["zoomed"] = [{"key": "PROBE", "grain": "zoomed",
                        "nodes": [{"id": "z", "class": "probe", "route": 1}],
                        "edges": []}]

    # And the control that keeps it from being a rule against top level lists in general. The
    # shipped document carries several, `types` and `apto` among them, and none of them names a
    # key, a grain and a set of nodes.
    def third_list_not_view_shaped(d):
        d["notes"] = [{"k": "a", "text": "not a view"}, {"k": "b", "text": "nor this"}]

    expect("view-list-declared", _structure_probe(third_list),
           "a third top level list of views under a name no gate walks, which routes.py reads "
           "by shape and every gate in this file misses by name", says="'zoomed'")
    expect_clean(_structure_probe(third_list_not_view_shaped),
                 "a top level list that is not view-shaped is left alone, so the rule is about "
                 "views under an undeclared name and not about lists")

    # And the document this repository actually ships, which is the only one that matters.
    expect_clean(instance_document(), "the model's own instance document passes")

    print(f"\nstructure self-test: {ok}/{total}")
    if ok != total:
        raise SystemExit(1)
    if total != STRUCTURE_PROBES:
        print(f"::error::the structure self-test ran {total} probes and STRUCTURE_PROBES says "
              f"{STRUCTURE_PROBES}. A rule and its probe deleted together would otherwise have "
              f"left a smaller suite reporting clean.")
        raise SystemExit(1)




# ---- proving the ontology gate is armed, issue 123 ---------------------------
# THE SAME SHAPE AS THE TWO SUITES ABOVE AND FOR THE SAME REASON: a gate never seen to refuse is
# not a gate, and this repository removed thirteen dead ones in one day. What is different here
# is that the corpus is on ONE machine, so a suite pointed at the real one would be a suite that
# runs nowhere else, and a check that only ever runs where the answer is already known is the
# defect this card is about. So each probe WRITES A WHOLE SYNTHETIC CORPUS to a temporary
# directory, points the gate at that, and mutates one thing. Every probe below therefore runs in
# CI, on a machine that holds none of the real analysis.
#
# AND THE REAL CORPUS IS NOT PROBED HERE, deliberately: the live call at import time already
# runs the gate against it on every build on the machine that has it, and it printed its count
# to stderr before this suite started.
ONTOLOGY_PROBES = 18

# The control's routes. Synthetic throughout, so that this suite says nothing about the real
# corpus and cannot be quietly repaired by it: the five between them exercise all three corpora,
# both locator kinds inside the ontology, and a citation of two segments.
_ONTOLOGY_PROBE_ROUTES = {
    "probe-entity": {"source": "ontology.yaml, Widget, finding F1"},
    "probe-phrase": {"source": "ontology.yaml, a line the ontology carries"},
    "probe-notion": {"source": "notion 01_probe, a line the workspace read carries"},
    "probe-vault": {"source": "vault Probe note, a line the note carries"},
    "probe-pair": {"source": "ontology.yaml, Widget; notion 01_probe"},
}
_ONTOLOGY_PROBE_ENTITIES = 2
_ONTOLOGY_PROBE_READ_ON = "2026-08-02"
_ONTOLOGY_PROBE_YAML = """meta:
  title: a synthetic corpus, written by this self-test and by nothing else
  written: 2026-08-01
  entity_count: 2
entities:
- name: Widget
  note: a line the ontology carries
- name: Gadget
  note: a second entity, so that the count is not one
"""
_ONTOLOGY_PROBE_FINDINGS = """| id | what it says |
|---|---|
| **F1** | a synthetic finding, in the shape the register writes them |
"""


def _ontology_probe_corpus(tmp, yaml=_ONTOLOGY_PROBE_YAML, findings=True,
                           notion=("01_probe",), note="Probe note"):
    """A whole corpus on disk, in the shape the gate reads, with one thing optionally missing."""
    root, vault = pathlib.Path(tmp) / "analysis", pathlib.Path(tmp) / "vault"
    (root / "ontology").mkdir(parents=True)
    (root / ONTOLOGY_NOTION).mkdir(parents=True)
    (vault / "company").mkdir(parents=True)
    if yaml is not None:
        (root / ONTOLOGY_YAML).write_text(yaml, encoding="utf-8")
    if findings:
        (root / ONTOLOGY_FINDINGS).write_text(_ONTOLOGY_PROBE_FINDINGS, encoding="utf-8")
    for stem in notion:
        (root / ONTOLOGY_NOTION / f"{stem}.md").write_text(
            "a line the workspace read carries\n", encoding="utf-8")
    if note:
        (vault / "company" / f"{note}.md").write_text(
            "A line the note carries, capitalised, because a locator is matched case folded\n",
            encoding="utf-8")
    return root, vault


def ontology_self_test():
    ok = 0
    total = 0

    def run(routes=None, entities=None, read_on=None, **corpus):
        with tempfile.TemporaryDirectory() as tmp:
            root, vault = _ontology_probe_corpus(tmp, **corpus)
            return check_ontology_registry(
                routes=routes or _ONTOLOGY_PROBE_ROUTES, root=root, vault=vault,
                read_on=read_on or _ONTOLOGY_PROBE_READ_ON,
                entities=_ONTOLOGY_PROBE_ENTITIES if entities is None else entities,
                # Issue 196: these are three invented routes over a synthetic corpus, and the
                # committed attestation is about the real seventeen. See check_ontology_registry.
                attest=False)

    def expect(rule, what, **kw):
        nonlocal ok, total
        total += 1
        try:
            run(**kw)
        except SystemExit as e:
            got = str(e).split(":", 1)[0].replace("[ontology] ", "")
            if got == rule:
                ok += 1
                print(f"  [OK]   {rule}: {what}")
            else:
                print(f"  [FAIL] {rule}: {what}. It refused, and for {got!r} instead.")
            return
        print(f"  [FAIL] {rule}: {what}. It did NOT refuse.")

    def expect_clean(what, **kw):
        nonlocal ok, total
        total += 1
        try:
            run(**kw)
        except SystemExit as e:
            print(f"  [FAIL] control: {what}. It refused: {e}")
            return
        ok += 1
        print(f"  [OK]   control: {what}")

    def one_route(source):
        """The control's routes with one citation replaced, so a probe differs by that alone."""
        return dict(_ONTOLOGY_PROBE_ROUTES, **{"probe-entity": {"source": source}})

    # The control first. Every probe below is this corpus and these citations with one thing
    # changed, and a probe whose control is not known to pass proves nothing at all.
    expect_clean("the synthetic corpus every probe is built from resolves")

    # ---- the grammar, which is checked with no corpus at all --------------------------------
    expect("citation-grammar", "a citation with an empty part, which addresses nothing",
           routes=one_route("ontology.yaml, "))
    expect("citation-corpus", "a citation naming a corpus this gate cannot follow, so the route "
                              "acquires a source nobody can go back to",
           routes=one_route("somewhere else, Widget"))

    # ---- the corpus's own account of itself -------------------------------------------------
    expect("citation-file", "the analysis repository on the machine and the ontology not in it",
           yaml=None)
    expect("entity-count", "an ontology holding fewer entities than this file says it read",
           entities=_ONTOLOGY_PROBE_ENTITIES + 1)
    expect("entity-count", "an ontology whose own declared count disagrees with its own list",
           yaml=_ONTOLOGY_PROBE_YAML.replace("entity_count: 2", "entity_count: 9"))
    expect("corpus-undated", "an ontology carrying no written date, so the read date has no "
                             "lower bracket and is a claim again",
           yaml=_ONTOLOGY_PROBE_YAML.replace("  written: 2026-08-01\n", ""))
    expect("read-before-written", "a source read before the corpus it cites was written",
           read_on="2026-07-01")

    # ---- and every citation followed --------------------------------------------------------
    expect("citation-entity", "a route citing an entity the ontology no longer declares, which "
                              "is a class renamed under a panel still printing about it",
           routes=one_route("ontology.yaml, Sprocket"))
    expect("citation-finding", "a route citing a finding the register no longer holds",
           routes=one_route("ontology.yaml, Widget, finding F99"))
    expect("citation-finding", "the findings register gone from the corpus altogether",
           findings=False)
    expect("citation-phrase", "a route quoting a passage the ontology does not carry",
           routes=one_route("ontology.yaml, a line the ontology does not carry"))
    expect("citation-phrase", "a route quoting a passage the workspace read does not carry",
           routes=one_route("notion 01_probe, a line the workspace read does not carry"))
    expect("citation-phrase", "a route quoting a passage the vault note does not carry",
           routes=one_route("vault Probe note, a line the note does not carry"))
    expect("citation-file", "a route citing a workspace read that is not in the corpus",
           routes=one_route("notion 99_absent, a line"))
    expect("citation-file", "a route citing a workspace read that two files answer to, so the "
                            "citation says nothing about which of them was read",
           notion=("01_probe", "01_probe_and_another"))
    expect("citation-file", "a route citing a vault note that is not in the vault", note=None)

    # ---- and the branch that is not a refusal, which is the one a silent skip would imitate --
    total += 1
    with tempfile.TemporaryDirectory() as tmp:
        gone = pathlib.Path(tmp) / "not-on-this-machine"
        try:
            check_ontology_registry(routes=_ONTOLOGY_PROBE_ROUTES, root=gone, vault=gone,
                                    read_on=_ONTOLOGY_PROBE_READ_ON,
                                    entities=_ONTOLOGY_PROBE_ENTITIES, attest=False)
            ok += 1
            print("  [OK]   control: a machine holding no corpus at all builds, and the gate "
                  "says on stderr that nothing was verified rather than reporting clean")
        except SystemExit as e:
            print(f"  [FAIL] control: a machine holding no corpus should build. It refused: {e}")

    print(f"\nontology self-test: {ok}/{total}")
    if ok != total:
        raise SystemExit(1)
    # The written total, for the third time in this file and for the reason given at
    # PROVENANCE_PROBES: a ratio cannot tell a suite that ran everything from a suite that ran
    # half of itself.
    if total != ONTOLOGY_PROBES:
        print(f"::error::the ontology self-test ran {total} probes and ONTOLOGY_PROBES says "
              f"{ONTOLOGY_PROBES}. A rule and its probe deleted together would otherwise have "
              f"left a smaller suite reporting clean.")
        raise SystemExit(1)


if __name__ == "__main__":
    import sys as _sys
    if _sys.argv[1:] == ["--contrast"]:
        emit_contrast()
    elif _sys.argv[1:] == ["--provenance-self-test"]:
        provenance_self_test()
    elif _sys.argv[1:] == ["--structure-self-test"]:
        structure_self_test()
    elif _sys.argv[1:] == ["--ontology-self-test"]:
        ontology_self_test()
    elif _sys.argv[1:] == ["--structure"]:
        # The live check on the model's own document, for a runner that wants the verdict
        # without a build. The build runs the same function on whatever document it lays out.
        _s = check_structure(instance_document())
        print("structure: {} views, {} nodes, {} edges, ids unique, no self-loop, every "
              "endpoint present, {} orphan(s)".format(_s["views"], _s["nodes"], _s["edges"],
                                                      _s["orphans"]))
        for _k, _n, _e, _orph in _s["per_view"]:
            print(f"  {_k:<5} {_n:>4} nodes  {_e:>4} edges  "
                  + (f"{len(_orph)} orphan(s): {', '.join(_orph)}" if _orph else "no orphan"))
    elif _sys.argv[1:] == ["--palette-self-test"]:
        palette_self_test()
    elif _sys.argv[1:] == ["--salt-check"]:
        # This file resolves the salt itself, because it is Python and cannot source the shell
        # library that owns the rule. Two copies of one resolution is the shape that has bitten
        # this repository five times, so the answer is exposed here and scripts/check_repo.sh
        # --self-test runs both and refuses a disagreement. It prints the salt-check and never
        # the salt: one is one way over a random value and the other is the secret itself.
        print(_salt_check(_forbidden_salt()))
    else:
        raise SystemExit("usage: model.py --contrast | --provenance-self-test "
                         "| --structure-self-test | --ontology-self-test | --structure "
                         "| --palette-self-test | --salt-check")
