# Toy instance graph for the Zrive operating model.
#
# Everything here is invented except: the company name Zrive, the programme name and code,
# the session titles (published on the company's own public website) and the names of firms
# that are companies rather than people. All teacher names are invented. All identifiers,
# dates, counts and money figures are invented. No value in this file is measured.
import datetime
import hashlib
import math
import pathlib

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
    ("Instructor",     "Instructor",        "#147eb3", "person"),
    ("CohortSession",  "Cohort session",    "#976e08", "calendar"),
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

FRESH_DAYS = 120
AGING_DAYS = 240

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
ROUTES = {}
ROUTE_SAYS = {}


def route_class(cid, *, cls, drawn_as, system, unit=None, partition=None, entered_by, event,
                source, says, absence=None, caveats=(), key=None, read=None, module=None):
    """One class's route: the machine declaration and the four rows a reader sees, together.

    Everything derivable is derived and nothing is declared twice. `attachable` is whether a
    system holds the rows; the adapter state follows from that and from whether a module exists;
    the flag on each display row is the state of the field it displays. There is no way to
    satisfy one of those by editing another.
    """
    attachable = system is not None
    ROUTE_SAYS[cid] = says
    ROUTES[cid] = {
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
    entered_by=(None, "not-recorded"),
    event=(None, "none"),
    source="ontology.yaml, Company, identity key",
    says=("no company record. A firm is a free text name in a Notion select",
          "not recorded",
          "not recorded. No moment creates a company row"))

route_class(
    "company-colaboradora", cls="Company, empresa colaboradora", drawn_as="Company",
    system="notion", unit="invitation-page", partition="invitation",
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
def _forbidden_hits(labelled):    # [(where, string)] -> [(where, token length)]
    import hashlib
    import re as _re
    import unicodedata

    lib = pathlib.Path(__file__).resolve().parent.parent / "scripts" / "forbidden_lib.sh"
    hashes = pathlib.Path(__file__).resolve().parent.parent / "scripts" / "forbidden_names.sha256"
    try:
        rules = lib.read_text(encoding="utf-8")
        known = {ln.strip() for ln in hashes.read_text(encoding="utf-8").splitlines()
                 if ln.strip() and not ln.startswith("#")}
    except OSError as exc:
        raise SystemExit(f"model: cannot read the name gate's rules ({exc}). The roster is not "
                         f"checkable without them, and an unchecked roster is not shippable.")
    # An empty list would pass everything, which is the loudest lie a gate can tell.
    if not known:
        raise SystemExit("model: the name hash list is empty; refusing to call the roster clean")

    def rule(name, pattern):
        m = _re.search(pattern, rules)
        if not m:
            raise SystemExit(f"model: scripts/forbidden_lib.sh no longer defines {name}")
        return m.group(1)

    salt = rule("FORBIDDEN_SALT", r'FORBIDDEN_SALT="([^"]*)"')
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
        "students_note": (
            "One card standing for the whole cohort. Clicking it draws four of the thirty "
            "four as individual Student objects, in space the layout already keeps for "
            "them, with the count of the ones it did not draw underneath. Every person in "
            "this cohort is invented, here and in the full list: no roster of real "
            "students is imported into this repository or published on this page."),
    },
    {
        "key": "ZSC", "pfx": "sc_", "code": "Z-SC", "name": "Strategy Consulting",
        "delivery": ("online, with two in person weekends", E),
        "title_provenance": SYLLABUS,
        "templates": [
            ("sc_st1", "Welcome to Zrive Strategy Consulting + Q&A SC", "ZSC-T1", "sync",
             "online", "90"),
            ("sc_st2", "Overview of the consulting industry", "ZSC-T2", "sync", "online", "90"),
            ("sc_st3", "How to prepare for FIT interview questions", "ZSC-T3", "sync",
             "online", "90"),
            ("sc_st4", "Business Case - Group Practice (I) - Profitability", "ZSC-T4", "sync",
             "online", "90"),
            ("sc_st5", "Real Projects: TMT", "ZSC-T5", "sync", "online", "90"),
            # The leading space is verbatim and deliberate in the syllabus. wrap() splits on
            # whitespace and discards it, so the tile draws identically either way; stripping it
            # here would make the model disagree with its source for no gain.
            ("sc_st6", " ATTICO @ 10.15h - All you need to know about recruiting in Strategy "
             "Consulting", "ZSC-T6", "sync", "presencial", "120"),
        ],
        "instructors": [
            ("t4", "Rubén Arizmendi", ZRIVE, "1", "Z-IB, Z-PE, Z-SC"),
            ("t6", "Ainhoa Muruzabal", ZRIVE, "1", "Z-SC, Z-HR"),
            ("t8", "Nagore Elordieta", "co_emp3", "1", None),
            ("t9", "Telmo Garaikoetxea", None, "1", None),
            ("t10", "Saioa Erkoreka", "co_emp", "1", None),
            ("t11", "Ander Legarralde", "co_fide", "1", None),
            ("t12", "Miren Aitzgorri", "co_emp", "1", None),
        ],
        "sessions": [
            ("sc_cs1", "Sesión 1, 13 ene", "sc_st1", ("t4", "t6"), "2026-01-13 18:30",
             "delivered", "22"),
            ("sc_cs2", "Sesión 2, 20 ene", "sc_st2", ("t8",), "2026-01-20 18:30",
             "delivered", "21"),
            ("sc_cs3", "Sesión 3, 27 ene", "sc_st3", ("t9",), "2026-01-27 18:30",
             "delivered", "20"),
            ("sc_cs4", "Sesión 4, 3 feb", "sc_st4", ("t10",), "2026-02-03 18:30",
             "confirmed", "0"),
            ("sc_cs5", "Sesión 5, 10 feb", "sc_st5", ("t11",), "2026-02-10 18:30",
             "confirmed", "0"),
            ("sc_cs6", "Sesión 6, 21 mar", "sc_st6", ("t12",), "2026-03-21 10:00",
             "planned", "0"),
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
        # Every duration on this route is invented: not one of Z-BL's twenty eight real rows
        # carries a duration at all.
        "templates": [
            ("bl_st1", "Presentación // ¿Qué salidas profesionales existen en el mundo del "
             "Derecho?", "ZBL-T1", "sync", "online", "90"),
            ("bl_st2", "¿Como preparar procesos de selección?", "ZBL-T2", "sync", "online", "90"),
            ("bl_st3", "Áreas de Práctica → Corporate and M&A I", "ZBL-T3", "sync",
             "online", "90"),
            ("bl_st4", "Oratoria I", "ZBL-T4", "sync", "online", "90"),
            ("bl_st5", "Recruiting Superday", "ZBL-T5", "sync", "presencial", "240"),
            ("bl_st6", "Oratoria III", "ZBL-T6", "sync", "presencial", "120"),
        ],
        # SUBSTITUTION, RECORDED. The real employer behind the two sessions t17 holds is a firm
        # whose first token is also a real teacher's surname, so the name gate refuses it and is
        # right to. t17 is given another real Z-BL employer from the same register instead.
        # Changing the name is the fix; weakening the gate is not.
        "instructors": [
            ("t13", "Endika Zumeltzu", None, "1", None),
            ("t14", "Oihana Belastegui", "co_emp5", "2", None),
            ("t15", "Lide Arriotua", "co_emp5", "2", None),
            ("t16", "Peru Zubizarreta", "co_latham", "1", None),
            ("t17", "Estibaliz Onaindia", "co_baker", "2", None),
        ],
        "sessions": [
            ("bl_cs1", "Sesión 1, 14 ene", "bl_st1", ("t13",), "2026-01-14 18:30",
             "delivered", "19"),
            ("bl_cs2", "Sesión 2, 21 ene", "bl_st2", ("t14", "t15"), "2026-01-21 18:30",
             "delivered", "18"),
            ("bl_cs3", "Sesión 3, 28 ene", "bl_st3", ("t16",), "2026-01-28 18:30",
             "delivered", "18"),
            ("bl_cs4", "Sesión 4, 4 feb", "bl_st4", ("t17",), "2026-02-04 18:30",
             "confirmed", "0"),
            ("bl_cs5", "Sesión 5, 14 mar", "bl_st5", ("t14", "t15"), "2026-03-14 10:00",
             "planned", "0"),
            ("bl_cs6", "Sesión 6, 15 mar", "bl_st6", ("t17",), "2026-03-15 10:00",
             "planned", "0"),
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
        "template_note": (
            "The source for this programme records no format field, yet every one of its session "
            "notes carries a delivery mode of sync. The vault flags that contradiction as "
            "unresolved. The value is carried here and flagged invented, which is honest either "
            "way; writing an absence instead would settle a question the source leaves open."),
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
        "prog_note": (
            "The source for this programme is a reading plan and not a session calendar. It has "
            "no instructor field, no module field and no format field, so three of the lanes on "
            "this page cannot be filled from it. The empty instructor lane is the finding, not a "
            "fault."),
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
# already declined, for the same reason. The finding is not lost: it is written on the visit
# host's own note and carried as an absent property row, where a reader meets it.
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
GHOST_SPEC = [
    ("g_inst", "Instalment", "expected by", "Agreement", "agree",
     "The schedule of payments an agreement expects is not written down as rows. A payment "
     "that fails leaves no row at all, and a row that is missing cannot be found without an "
     "expectation to compare against, so nothing can be queried for what did not arrive."),
    ("g_place", "Placement", "matures", "Claim", "claim",
     "A graduate taking a job offer is not recorded anywhere. A claim on future income can "
     "therefore expire, and nothing can make it mature, so the question of which claims are "
     "collectible today has no answer to read."),
    ("g_beca", "Beca", "discounts", "Agreement", "agree",
     "A scholarship has no class of its own. A student who owes nothing and a student who "
     "owes and has not paid are the same row."),
    ("g_ref", "Refund", "reverses", "Charge", "charge",
     "Money returned to a payer has nowhere to be recorded. A charge that was reversed still "
     "reads exactly as it did before, so a reversal can only be established off the system."),
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
            "note": ("Zrive is the operator of the programme, not a third party like the other "
                     "employers. It is drawn as a Company and carries the same 'employed by' "
                     "edge so that every instructor reads the same way, and the difference is "
                     "in the data: an instructor it employs is in house, which is also why "
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


def programme_block(spec):
    """The part of a drawing that is about one programme: prog, employers, host, templates,
    instructors and cohort sessions. Seven calls, one function, no branch on which programme."""
    pfx, nodes, edges = spec["pfx"], [], []
    prog = pfx + "prog"
    prog_node = {
        "id": prog, "type": "Programme", "label": f"{spec['code']} {spec['name']}",
        "props": [
            p("programme_code", spec["code"], D),
            p("name", spec["name"], D),
            p("delivery", spec["delivery"][0], spec["delivery"][1]),
            p("session_templates", "6 shown, of a longer syllabus", E),
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
            "note": ("An invented firm. The visit it hosts attaches to the PROGRAMME and not to "
                     "the cohort, which is what the company register says: thirteen company "
                     "notes point a visit at a programme note and not one of the hundred and "
                     "fifty six mentions a cohort at all. What no system anywhere records is the "
                     "other half of it, which cohort attended. That absence has no tile on this "
                     "page: it is a missing relation between two classes that both exist, and "
                     "every ghost here is a missing class."),
            "props": [
                p("role", "empresa colaboradora", D),
                p("note", "invented company, not a real firm", D),
                p("visits_hosted", "1", D),
                p("vacancies_open", "2", D),
                p("cohort_that_attended", "no system relates a cohort to a visit", A),
            ],
        })

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

    for sid, title, code, dmode, lmode, dur in spec["templates"]:
        node = {
            "id": sid, "type": "SessionTemplate", "label": title,
            "props": [
                p("title", spec["title_provenance"][0], spec["title_provenance"][1]),
                p("template_code", code, D),
                p("delivery_mode", dmode, D) if dmode else p("delivery_mode", NOT_RECORDED, A),
                p("location_mode", lmode, D) if lmode else p("location_mode", NOT_RECORDED, A),
                p("duration_min", dur, D) if dur else p("duration_min", NOT_RECORDED, A),
            ],
        }
        if spec.get("template_note"):
            node["note"] = spec["template_note"]
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
        # ISSUE 63, and the counted evidence is on the co_col note and in that commit. A span of
        # 3 makes this the one edge on any of the seven routes that is drawn as an arc slung under
        # the row it connects rather than as a neighbour bezier. It cost fourteen units of height
        # on the shipped drawing when it landed on its own, 586 to 600, and this card takes them
        # straight back: a sixth instructor moves where the barycentre puts the host, the arc's
        # midpoint drops back inside the drawing, and Z-IB is 586 again with the edge still
        # correct.
        edges.append((spec["host"][0], prog, "hosts visit"))
    return nodes, edges


def tail_block(spec):
    """The part of a drawing that is not about a programme: the cohort, the students card, the
    four drawn Students, the enrolment to claim chain and the four ghosts. Fourteen nodes."""
    pfx = spec["pfx"]
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
            "note": ("The cohort exists as a thing and its key does not. No identifier for it is "
                     "held anywhere, so a cohort can only be picked out as the intersection of a "
                     "roster, a calendar, a campus group and a record on the website."),
            "props": [
                p("cohort_id", "no identifier in any system", A),
                p("intake", spec["intake"], D),
                p("starts_on", spec["starts_on"], D),
                p("sessions_scheduled", str(len(spec["sessions"])), D),
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
            "note": spec.get("students_note") or (
                f"One card standing for the whole cohort. Clicking it draws {drawn} of the "
                f"{head} as individual Student objects, in space the layout already keeps for "
                f"them, with the count of the ones it did not draw underneath. Every person in "
                f"this cohort is invented, here and in the full list: no roster of real students "
                f"is imported into this repository or published on this page."),
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
            "note": ("An invented person. This card exists to show that a Student is an object "
                     "with properties and links and not a name inside a headcount, and every "
                     "value on it is made up: no real student, no real cohort, nothing imported "
                     "from any Zrive system, on a page anyone with the URL can read."),
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
        "nodes": _pn + _tn, "edges": _pe + _te, "roster": _roster,
    })

# One id may name a tile on more than one route, and it must be the same tile when it does: the
# three shared instructors and the four shared employers are the whole point of the exercise, and
# a typo that gave one of them a different label on one route would show up as two people on the
# faculty sheet. Only the values that are genuinely per route are allowed to differ, which is why
# this compares the label and the type and not the properties.
_seen = {}
for _v in VIEWS:
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

ALL_NODES = [_n for _v in VIEWS for _n in _v["nodes"]]
ALL_EDGES = [_e for _v in VIEWS for _e in _v["edges"]]

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
    _n["props"] = _rows + _n["props"]
    # How many of the rows at the front of the list are the route, so the panel can rule a line
    # under them. A count and not a name: the browser never has to know that a key beginning
    # "route_" is special, and renaming a row here cannot silently move the line.
    _n["route"] = len(_rows)
    if not _r["attachable"] and not _n.get("ghost"):
        _n["mark"] = NO_SYSTEM

# A class nothing is drawn as is a route nobody can check against a tile, and it is exactly how a
# registry rots: an entry edited for a class that left the model months ago reads as current.
_UNBOUND = sorted(set(ROUTES) - _BOUND)
if _UNBOUND:
    raise SystemExit(f"model: the populate registry declares {', '.join(_UNBOUND)} and no object "
                     f"on any view belongs to that class. Remove the entry or draw the class.")

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
for _v in VIEWS:
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
                                 ("absence", ABSENCE), ("caveat", CAVEAT))
             for _tok, _why in _tbl.items() for _s in (_tok, _why)]
# The provenance vocabularies ship on the public page for the same reason the registry's do, so
# they go through the same folding. Issue 73.
_strings += [(f"provenance vocabulary {_name}", _s)
             for _name, _tbl in (("rank", VALUE_RANK), ("status", VALUE_STATUS),
                                 ("stance", STANCE))
             for _tok, _why in _tbl.items() for _s in (_tok, _why)]
for _v in VIEWS:
    for _n in _v["nodes"]:
        _w = f"{_v['key']} node {_n['id']}"
        _strings.append((_w, _n["label"]))
        for _k in ("note", "mark", "tail", "source_system", "source_key"):
            if _n.get(_k):
                _strings.append((f"{_w} {_k}", _n[_k]))
        for _pr in _n["props"]:
            _strings += [(f"{_w} prop {_pr['k']}", _pr["k"]),
                         (f"{_w} prop {_pr['k']}", _pr["v"])]
    _strings += [(f"{_v['key']} edge {_s}->{_t}", _v2) for _s, _t, _v2 in _v["edges"]]
    _strings += [(f"{_v['key']} roster {_r['id']}", _r[_f])
                 for _r in _v["roster"]["rows"]
                 for _f in ("name", "uni", "state", "source_system", "source_key")]
_check_names(_strings)

# ---- the palette is a claim about a surface ---------------------------------
# Each of the thirteen colours above is painted as a tile's stroke, at full opacity, and again
# as a wash inside it: 14 per cent of the same colour for twelve of them, and 7 per cent for the
# ghost. The stroke is the one that has to be legible on its own, because it is the boundary of
# the tile and the tile is a control: it takes focus, it takes a click, and it is what a reader
# picks a type out by.
#
# WHICH SURFACE THE STROKE SITS ON. Established by reading the drawing rather than chosen.
# app.js draws one `rect.band` per lane before it draws anything else, `.band` is filled with an
# opaque `var(--bg-panel)` in app.css, the bands span every column of the drawing and run from
# `bandTop` to four units off the bottom, and every tile is laid out inside a lane. So a tile's
# stroke sits on the band plate, in both themes, and never on the page ground. The two are
# different colours and the difference is not cosmetic: it moves the verdict for two of the
# twenty-six measurements, Session template and Cohort on the light side, both of which pass on
# the plate and would fail on the ground. It moved three before the dark siblings landed, the
# third being Agreement in dark, which failed on the plate and passed on the ground; that one
# now passes on both. The ground is measured as well and reported for exactly that reason, and
# it is not the surface anything is judged against.
#
# THE STROKE HAS TWO NEIGHBOURS AND ONLY ONE OF THEM IS GATED, which is a limit of this check and
# is written down here rather than left to be found. Outside the stroke is the plate. Inside it
# is the tile's own wash, a tint of the same hex composited over that plate, which is by
# construction nearer the stroke colour than the plate is, so the inner comparison is always the
# harder one. It used to be harder by enough to matter, seven colours clearing 3:1 on the plate
# and under it against their own fill. The dark siblings took five of those seven with them:
# what is left is Session template at 2.6905 and Cohort at 2.7477, both on the light side, and
# the dark side no longer has one. The limit is real and it is now much smaller than the card
# that named it found it.
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
# SC 1.4.11, because a stroke is a boundary. The same thirteen colours are also written as 11px
# bold text at the head of the detail panel, which is SC 1.4.3 and 4.5:1, and app.js writes that
# colour inline, so no stylesheet reaches it. One number fixes both surfaces, and it is the
# higher one. Every sibling holds the other one's hue and its saturation and moves only its
# lightness, so a type is the same colour in both themes and not a different one.
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
# 2.8807, and it stays a declared exception. The argument is in scripts/check_repo.sh beside the
# declaration, where a reader meets it.
#
# The three that are absent from this map need nothing: on the dark plate they already measure
# 4.5374 (Cohort), 4.5930 (Session template) and 5.0129 (the ghost grey). Absent and not written
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
# The stylesheet's dark theme is one block and the whole theme, so a token's light value is its
# definition before this line and its dark value is the one after it. Split on the block rather
# than taking the first and second match in file order: the order is the thing that would be
# quietly wrong if the block ever moved.
_DARK_BLOCK = "@media (prefers-color-scheme: dark)"


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


def _css_text():
    """app.css with its comments removed, which is the only text that paints anything.

    Not fussiness. That file argues with itself at length in comments, several of them naming
    tokens and quoting rules, and a commented-out `.band` above the live one, or the theme
    block's own name written inside a comment, would be picked up by the two readers below and
    would point this whole measurement at a surface nothing is drawn on.
    """
    import re as _re
    try:
        css = _CSS_PATH.read_text(encoding="utf-8")
    except OSError as exc:
        raise SystemExit(f"model: cannot read {_CSS_PATH.name} ({exc}). The surfaces the type "
                         f"colours are drawn on live there and cannot be guessed at.")
    return _re.sub(r"/\*.*?\*/", "", css, flags=_re.S)


def surface_token(selector, prop):
    """The custom property a rule paints with, read from the stylesheet and never retyped."""
    import re as _re
    css = _css_text()
    # [^}] cannot cross a closing brace, so this cannot read a declaration out of the next rule.
    m = _re.search(_re.escape(selector) + r"\s*\{[^}]*?\b" + _re.escape(prop)
                   + r"\s*:\s*var\((--[a-z0-9-]+)\)", css)
    if not m:
        raise SystemExit(f"model: app.css no longer paints {selector} with a custom property "
                         f"for {prop}. The surface the type colours are measured against is "
                         f"read from there and this check is now measuring nothing.")
    return m.group(1)


def surface_values(token):
    """A custom property's two values, light and dark, from the one stylesheet that holds them."""
    import re as _re
    css = _css_text()
    if _DARK_BLOCK not in css:
        raise SystemExit("model: app.css no longer carries the dark theme block. The dark "
                         "surface cannot be read and this check will not guess one.")
    light_half, dark_half = css.split(_DARK_BLOCK, 1)
    out = {}
    for ground, half in (("light", light_half), ("dark", dark_half)):
        found = _re.findall(_re.escape(token) + r"\s*:\s*(#[0-9a-fA-F]{6})\b", half)
        if len(found) != 1:
            raise SystemExit(f"model: {token} is defined {len(found)} time(s) in the {ground} "
                             f"half of app.css and this check needs exactly one.")
        out[ground] = found[0].lower()
    return out


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
# eleven rules as this one rather than by nobody.
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
# The other nine rules are the ways one row could be wrong while still looking right in a panel.
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
    if not ranks or not isinstance(vocab.get("status"), dict) \
            or not isinstance(vocab.get("stance"), dict):
        bad("document-block", "the provenance block ships no vocabulary for its ranks, its "
                              "statuses and its stances. A token whose meaning is only in the "
                              "program that wrote it is not machine readable.")
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

    classes = doc.get("routes", {}).get("classes", {})
    seen = 0
    for v in doc["views"]:
        for n in v["nodes"]:
            where = f"{v['key']} node {n['id']}"
            registry_rows = n.get("route") or 0
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
                if i >= registry_rows and stance == "invented" and rank != INVENTED:
                    bad("toy-value-not-invented",
                        f"{what} is one of this node's own values in a document whose stance is "
                        f"invented, and it is ranked {rank!r}. Every value in this model except "
                        f"the registry rows was made up.")
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
                             "caveat": CAVEAT},
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
            "vocab": {"rank": VALUE_RANK, "status": VALUE_STATUS, "stance": STANCE},
        },
        "views": [{
            "key": v["key"], "code": v["code"], "name": v["name"], "label": v["label"],
            "route": "#/p/" + v["key"],
            # `class` is the join to the populate registry above and `route` is the number of
            # rows at the front of `props` that the registry produced. Two different questions
            # under two names that read alike, and the shorter one is the count because it is the
            # one app.js has always read.
            "nodes": [{"id": n["id"], "type": n["type"], "label": n["label"], "class": n["class"],
                       "count": n.get("count"), "props": n["props"], "route": n["route"],
                       "source_system": n["source_system"], "source_key": n["source_key"],
                       "ghost": 1 if n.get("ghost") else None,
                       "mark": n.get("mark"), "tail": n.get("tail"), "note": n.get("note")}
                      for n in v["nodes"]],
            # `ghost` on a relationship is derived from its ends rather than declared, and it is
            # here rather than in the layout because whether a relationship is one the model
            # cannot record is a fact about the model. The layout only reads it, to pick the
            # face its verb chip is measured in.
            "edges": [{"s": s, "t": t, "v": verb,
                       "ghost": 1 if (_ghost_ids(v).intersection((s, t))) else None}
                      for s, t, verb in v["edges"]],
            "roster": v["roster"],
        } for v in VIEWS],
    }


# ---- proving the provenance gate is armed ------------------------------------
# TPS.md: each gate is proved armed before it is trusted, and every workflow runs the relevant
# self-test alongside the live check. One synthetic document per rule, each one differing from a
# document that PASSES by exactly the mutation under test, which is the part that matters: a
# probe that trips a gate proves nothing unless its control is known to clear the same gate, and
# a control nobody checks is how a dead one survives. The control is asserted first and every
# probe is built from it.
def _probe_doc(stance="invented"):
    """The smallest document this gate accepts. Two rows, one registry and one of the node's
    own, which is the shape of every node in the real one."""
    return {
        "provenance": {
            "stance": stance,
            "as_of": PROVENANCE_AS_OF,
            "clock": {"fresh_days": FRESH_DAYS, "aging_days": AGING_DAYS},
            "apto": list(APTO),
            "vocab": {"rank": VALUE_RANK, "status": VALUE_STATUS, "stance": STANCE},
        },
        "routes": {"classes": {"probe": {"read": "not-attempted"}}},
        "views": [{"key": "PROBE", "nodes": [{
            "id": "n1", "class": "probe", "route": 1,
            "props": [p("route_system", "a system holds it", E, OBSERVED),
                      p("a_value", "12", D)],
        }]}],
    }


def _probe(doc, row=None, node=None, prov=None, drop_prov=False):
    """The control with one thing changed, so a probe and its control differ by that alone."""
    d = _probe_doc(doc)
    if drop_prov:
        del d["provenance"]
    if prov:
        d["provenance"].update(prov)
    if node:
        d["views"][0]["nodes"][0].update(node)
    if row is not None:
        d["views"][0]["nodes"][0]["props"][row[0]].update(row[1])
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
    expect("rank-vocabulary", _probe("invented", row=(1, {"r": "9_hoped"})),
           "a rank in no vocabulary")
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
    expect("toy-value-not-invented", _probe("invented", row=(1, {"r": OBSERVED})),
           "one of the model's own made up values ranked as read")
    expect("official-needs-a-read", _probe("invented", row=(0, {"r": OFFICIAL})),
           "a value read from a system's own record, on a class the registry says nobody has "
           "reached")
    expect("empty-input", _probe("invented", node={"props": []}),
           "a document with no values in it, which would otherwise report clean")

    # And the document this repository actually ships, which is the only one that matters.
    expect_clean(instance_document(), "the model's own instance document passes")

    print(f"\nprovenance self-test: {ok}/{total}")
    if ok != total:
        raise SystemExit(1)


if __name__ == "__main__":
    import sys as _sys
    if _sys.argv[1:] == ["--contrast"]:
        emit_contrast()
    elif _sys.argv[1:] == ["--provenance-self-test"]:
        provenance_self_test()
    else:
        raise SystemExit("usage: model.py --contrast | --provenance-self-test")
