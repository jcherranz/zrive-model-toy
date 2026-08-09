# Toy instance graph for the Zrive operating model.
#
# Everything here is invented except: the company name Zrive, the programme name and code,
# the session titles (published on the company's own public website) and the names of firms
# that are companies rather than people. All teacher names are invented. All identifiers,
# dates, counts and money figures are invented. No value in this file is measured.

TYPES = [
    # key,             label,               colour,    glyph,       column
    ("Programme",      "Programme",         "#9d3f9d", "programme", 0),
    ("Company",        "Company",           "#5f6b7c", "company",   0),
    ("SessionTemplate","Session template",  "#00a396", "document",  1),
    ("Instructor",     "Instructor",        "#147eb3", "person",    2),
    ("CohortSession",  "Cohort session",    "#d1980b", "calendar",  3),
    ("Cohort",         "Cohort",            "#29a634", "cohort",    4),
    ("StudentGroup",   "Students",          "#8eb125", "stack",     5),
    # The enrolment to claim chain folds over two columns rather than running out over four.
    # Every one of its edges still joins neighbouring columns, so the chain stays legible
    # while the drawing keeps a two to one aspect instead of a long empty right half.
    ("Enrolment",      "Enrolment",         "#7961db", "link",      6),
    ("Agreement",      "Agreement",         "#946638", "agreement", 7),
    ("Charge",         "Charge",            "#d33d17", "coin",      6),
    ("Claim",          "Claim",             "#db2c6f", "claim",     7),
]

D = "dummy"
E = "estimated"
# A third flag, for the rows that record an absence rather than a value. It is not a weaker
# kind of dummy: a dummy value stands in for something a system holds, and an absent one says
# no system holds it at all.
A = "absent"


def p(name, value, flag):
    return {"k": name, "v": value, "f": flag}


NODES = [
    # ---- rank 0 ------------------------------------------------------------
    {
        "id": "prog",
        "type": "Programme",
        "label": "Z-IB Investment Banking",
        "props": [
            p("programme_code", "Z-IB", D),
            p("name", "Investment Banking", D),
            p("delivery", "online, with two in person weekends", E),
            p("session_templates", "6 shown, of a longer syllabus", E),
            p("owner", "academic team", E),
        ],
    },
    {
        "id": "co_emp",
        "type": "Company",
        "label": "McKinsey",
        "props": [
            p("role", "employer of an instructor", E),
            p("relationship", "none commercial in this toy", D),
            p("instructors_supplied", "1", D),
        ],
    },
    {
        "id": "co_col",
        "type": "Company",
        "col": 3,   # sits beside the sessions it hosts, not beside the employer
        "label": "Aretxa Capital",
        "props": [
            p("role", "empresa colaboradora", D),
            p("note", "invented company, not a real firm", D),
            p("visits_hosted", "1", D),
            p("vacancies_open", "2", D),
        ],
    },
    # ---- rank 1, instructors ----------------------------------------------
    {
        "id": "t1", "type": "Instructor", "label": "Nerea Iribarren",
        "props": [
            p("name", "invented", D),
            p("employer", "McKinsey", D),
            p("sessions_taught", "1", D),
            p("fee_per_session", "not modelled", D),
        ],
    },
    {
        "id": "t2", "type": "Instructor", "label": "Bruno Belaunde",
        "props": [
            p("name", "invented", D),
            p("employer", "Houlihan Lokey", D),
            p("sessions_taught", "1", D),
            p("fee_per_session", "not modelled", D),
        ],
    },
    {
        "id": "t3", "type": "Instructor", "label": "Nuria Ondarreta",
        "props": [
            p("name", "invented", D),
            p("employer", "Bain & Company", D),
            p("sessions_taught", "1", D),
            p("fee_per_session", "not modelled", D),
        ],
    },
    {
        "id": "t4", "type": "Instructor", "label": "Rubén Arizmendi",
        "props": [
            p("name", "invented", D),
            p("employer", "Zrive", D),
            p("sessions_taught", "2", D),
            p("fee_per_session", "in scope of salary", E),
        ],
    },
    {
        "id": "t5", "type": "Instructor", "label": "Celia Vandellós",
        "props": [
            p("name", "invented", D),
            p("employer", "Uría", D),
            p("sessions_taught", "1", D),
            p("fee_per_session", "not modelled", D),
        ],
    },
]

# ---- rank 1, session templates --------------------------------------------
# Titles are real and published. The codes beside them are invented.
TEMPLATES = [
    ("st1", "Advanced Excel Course", "ZIB-T1", "async", "online", "300"),
    ("st2", "Cómo hacer un buen CV para IB", "ZIB-T2", "async", "online", "60"),
    ("st3", "Intro to economics & financial markets", "ZIB-T3", "async", "online", "60"),
    ("st4", "How to read financial statements", "ZIB-T4", "async", "online", "60"),
    ("st5", "Why we value companies?", "ZIB-T5", "async", "online", "60"),
    ("st6", "All about recruiting in Investment Banking", "ZIB-T6", "sync", "presencial", "120"),
]
for tid, title, code, dmode, lmode, dur in TEMPLATES:
    NODES.append({
        "id": tid, "type": "SessionTemplate", "label": title,
        "props": [
            p("title", "real, published on the company website", E),
            p("template_code", code, D),
            p("delivery_mode", dmode, D),
            p("location_mode", lmode, D),
            p("duration_min", dur, D),
        ],
    })

# ---- rank 2, cohort sessions ----------------------------------------------
# The centre of the graph: template x cohort x teacher x datetime.
COHORT_SESSIONS = [
    ("cs1", "Sesión 1, 12 ene", "st1", "t4", "2026-01-12 18:30", "delivered", "31"),
    ("cs2", "Sesión 2, 19 ene", "st2", "t4", "2026-01-19 18:30", "delivered", "29"),
    ("cs3", "Sesión 3, 26 ene", "st3", "t1", "2026-01-26 18:30", "delivered", "28"),
    ("cs4", "Sesión 4, 2 feb",  "st4", "t3", "2026-02-02 18:30", "confirmed", "0"),
    ("cs5", "Sesión 5, 9 feb",  "st5", "t2", "2026-02-09 18:30", "confirmed", "0"),
    ("cs6", "Sesión 6, 14 mar", "st6", "t5", "2026-03-14 10:00", "planned",   "0"),
]
for cid, label, st, tt, when, state, att in COHORT_SESSIONS:
    NODES.append({
        "id": cid, "type": "CohortSession", "label": label,
        "props": [
            p("cohort_session_id", cid.upper(), D),
            p("scheduled_at", when, D),
            p("teacher_assigned", "yes", D),
            p("state", state, D),
            p("attendance", att, D),
            p("recording_ref", "none", D),
        ],
    })

NODES += [
    {
        "id": "cohort", "type": "Cohort", "label": "Z-IB 1Q26",
        # The cohort is a real thing and its key is not. It is marked rather than drawn as a
        # ghost for exactly that reason: the object exists, the identifier does not.
        "mark": "no cohort_id",
        "note": ("The cohort exists as a thing and its key does not. No identifier for it is "
                 "held anywhere, so a cohort can only be picked out as the intersection of a "
                 "roster, a calendar, a campus group and a record on the website."),
        "props": [
            p("cohort_id", "no identifier in any system", A),
            p("intake", "1Q26", D),
            p("starts_on", "2026-01-12", D),
            p("sessions_scheduled", "6", D),
            p("students_enrolled", "34", D),
        ],
    },
    {
        "id": "students", "type": "StudentGroup", "label": "Alumnos Z-IB 1Q26",
        "count": "34",
        "props": [
            p("headcount", "34", D),
            p("representation", "one card standing for 34 individuals", E),
            p("individual_records", "not shown, and not in this repo", E),
            p("completion_rate", "not modelled", D),
        ],
    },
    {
        "id": "enrol", "type": "Enrolment", "label": "Enrolment 0001",
        "props": [
            p("enrolment_id", "ENR-0001", D),
            p("stands_for", "34 enrolments, one drawn", E),
            p("enrolled_on", "2026-01-05", D),
            p("status", "active", D),
        ],
    },
    {
        "id": "agree", "type": "Agreement", "label": "Agreement 0001",
        "props": [
            p("agreement_id", "AGR-0001", D),
            p("total_price", "4.000,00 EUR", D),
            p("instalments", "4", D),
            p("signed_on", "2026-01-05", D),
        ],
    },
    {
        "id": "charge", "type": "Charge", "label": "Charge 0001",
        "props": [
            p("charge_id", "CHG-0001", D),
            p("amount", "1.000,00 EUR", D),
            p("due_on", "2026-02-01", D),
            p("state", "unpaid", D),
            p("payer_identity", "not resolved", E),
        ],
    },
    {
        "id": "claim", "type": "Claim", "label": "Claim 0001",
        "props": [
            p("claim_id", "CLM-0001", D),
            p("amount_claimed", "1.000,00 EUR", D),
            p("raised_on", "2026-03-01", D),
            p("stage", "first reminder", D),
        ],
    },
]

# ---- edges -----------------------------------------------------------------
# source, target, verb. The arrowhead sits at the target. Verbs read off the line.
EDGES = []
for tid, *_ in TEMPLATES:
    EDGES.append(("prog", tid, "includes"))
EDGES.append(("t1", "co_emp", "employed by"))
for cid, _l, st, tt, *_ in COHORT_SESSIONS:
    EDGES.append((tt, cid, "teaches"))
    EDGES.append((cid, st, "instance of"))
    EDGES.append((cid, "cohort", "scheduled for"))
EDGES += [
    ("co_col", "cohort", "hosts visit"),
    ("students", "cohort", "enrolled in"),
    ("students", "enrol", "recorded as"),
    ("enrol", "agree", "governed by"),
    ("agree", "charge", "schedules"),
    ("students", "charge", "pays"),
    ("claim", "charge", "claims against"),
]

# ---- ghosts: classes the model needs and no system holds --------------------
# Everything above is an object that exists. Everything below is one that does not, drawn on
# the same page because the absences are the part of the shape that a reader cannot infer from
# what is present. A ghost is a class, not an instance: it has no identifier, no date and no
# amount, and its note says what the absence costs structurally and nothing more.
#
# The ghosts are all in the enrolment to claim band, and that is not a coincidence. It is the
# band where money is promised, collected and chased, and it is the band with the fewest
# classes. Two candidates were left out rather than drawn: an Attendance class, which would
# have to hang off the cohort sessions, the tallest column, and would make the drawing taller
# for every reader; and a Placement date or an income share schedule, which is detail below
# the level of this page.
GHOST_TYPE = ("Ghost", "does not exist in any system", "#8f99a8", "ghost", 6)


def g(gid, label, col, verb, target, note):
    return {
        "id": gid, "type": "Ghost", "label": label, "col": col, "ghost": True, "note": note,
        "props": [
            p("class_exists", "no", A),
            p("would_attach_to", target, A),
            p("verb_it_would_carry", verb, A),
        ],
    }


GHOSTS = [
    g("g_inst", "Instalment", 6, "expected by", "Agreement",
      "The schedule of payments an agreement expects is not written down as rows. A payment "
      "that fails leaves no row at all, and a row that is missing cannot be found without an "
      "expectation to compare against, so nothing can be queried for what did not arrive."),
    g("g_place", "Placement", 6, "matures", "Claim",
      "A graduate taking a job offer is not recorded anywhere. A claim on future income can "
      "therefore expire, and nothing can make it mature, so the question of which claims are "
      "collectible today has no answer to read."),
    g("g_beca", "Beca", 6, "discounts", "Agreement",
      "A scholarship has no class of its own. A student who owes nothing and a student who "
      "owes and has not paid are the same row."),
    g("g_ref", "Refund", 7, "reverses", "Charge",
      "Money returned to a payer has nowhere to be recorded. A charge that was reversed still "
      "reads exactly as it did before, so a reversal can only be established off the system."),
]

GHOST_EDGES = [
    ("g_inst", "agree", "expected by"),
    ("g_place", "claim", "matures"),
    ("g_beca", "agree", "discounts"),
    ("g_ref", "charge", "reverses"),
]

TYPES = TYPES + [GHOST_TYPE]
NODES += GHOSTS
EDGES += GHOST_EDGES
