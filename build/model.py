# Toy instance graph for the Zrive operating model.
#
# Everything here is invented except: the company name Zrive, the programme name and code,
# the session titles (published on the company's own public website) and the names of firms
# that are companies rather than people. All teacher names are invented. All identifiers,
# dates, counts and money figures are invented. No value in this file is measured.
import pathlib

TYPES = [
    # key,             label,               colour,    glyph,       column
    ("Programme",      "Programme",         "#9d3f9d", "programme", 0),
    ("Company",        "Company",           "#5f6b7c", "company",   0),
    ("SessionTemplate","Session template",  "#00a396", "document",  1),
    ("Instructor",     "Instructor",        "#147eb3", "person",    2),
    ("CohortSession",  "Cohort session",    "#d1980b", "calendar",  3),
    ("Cohort",         "Cohort",            "#29a634", "cohort",    4),
    ("StudentGroup",   "Students",          "#8eb125", "stack",     5),
    # A Student is a member of that group, so it is drawn in the group's own lane and in the
    # colour family the group already owns, one shade down. The column is 4 and not 5, which is
    # the column the group itself sits in, for a reason that is geometric and not conceptual:
    # this layout draws an edge between two columns and has no shape for an edge inside one, so
    # four members stacked under the card they belong to would each need a line from a tile to
    # the tile above it. Column 4 is the other half of the same lane, it holds one node, and the
    # 'member of' edges then run left to right into the group exactly like every other edge on
    # the page. The lane caption, "cohort and students", is true of both columns either way.
    ("Student",        "Student",           "#5f7d1f", "cap",       4),
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
    # The five employers. Every instructor has one, and until issue 49 only t1's was drawn as a
    # node: the other four carried their employer as a property with no node and no edge, so
    # clicking t1 reached an object and clicking t2 to t5 reached a string. That asymmetry was
    # in the data and not in the reader's head, and it is removed here by giving all five the
    # same shape: a Company node in column 0 and one 'employed by' edge, same type, same three
    # property keys in the same order, same provenance flags.
    #
    # co_emp keeps its id rather than becoming co_emp1. An id is the handle a feedback note
    # writes into an issue, and issue 48 already points at [data-node="co_emp"]; renaming it
    # would break that reference and buy nothing. The four new ones are numbered for the
    # instructor they employ, so co_empN employs tN and co_emp employs t1.
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
        "id": "co_emp2",
        "type": "Company",
        "label": "Houlihan Lokey",
        "props": [
            p("role", "employer of an instructor", E),
            p("relationship", "none commercial in this toy", D),
            p("instructors_supplied", "1", D),
        ],
    },
    {
        "id": "co_emp3",
        "type": "Company",
        "label": "Bain & Company",
        "props": [
            p("role", "employer of an instructor", E),
            p("relationship", "none commercial in this toy", D),
            p("instructors_supplied", "1", D),
        ],
    },
    # The one that is not like the others. t4's employer is Zrive, the company that runs the
    # programme the whole drawing is about, so this node is both an employer of an instructor
    # and the operator of everything else on the page.
    #
    # The choice made here, deliberately: draw it as a Company exactly like the other four,
    # with the same type and the same 'employed by' verb, and carry the difference in the data
    # instead of in the geometry. Three reasons.
    #
    # First, uniformity is the point of this change and it is what the reveal rule in issue 48
    # keys on: that rule keys on the 'employed by' link rather than on the Company type,
    # precisely so that Aretxa Capital, a Company that hosts a visit and employs nobody, keeps
    # behaving as it does. A fifth employer wearing a different verb or a different type would
    # put t4 straight back into the special case this card exists to remove.
    #
    # Second, the difference is already recorded and stays recorded. fee_per_session on t4
    # reads 'in scope of salary' where the other four read 'not modelled', which is the whole
    # of what in house means here in money terms, and the role and relationship rows below say
    # it in words rather than leaving the fee row to imply it.
    #
    # Third, the mark mechanism was considered for a visual distinction and rejected. A mark
    # draws a dashed ring and a second label line, and in this model its vocabulary is
    # missingness: the cohort carries 'no cohort_id' because its key does not exist. Nothing
    # about Zrive is missing, so marking it would make the drawing say something false in
    # order to say something true. A distinction drawn in the tile itself would need a new
    # affordance in the renderer, which is app.js and not this card.
    {
        "id": "co_emp4",
        "type": "Company",
        "label": "Zrive",
        "note": ("Zrive is the operator of the programme, not a third party like the other four "
                 "employers. It is drawn as a Company and carries the same 'employed by' edge "
                 "so that all five instructors read the same way, and the difference is in the "
                 "data: this instructor is in house, which is also why fee_per_session on "
                 "Rubén Arizmendi reads in scope of salary where the other four read not "
                 "modelled."),
        "props": [
            p("role", "employer of an instructor, and the operator of the programme", E),
            p("relationship", "runs the programme, so this instructor is in house", E),
            p("instructors_supplied", "1", D),
        ],
    },
    {
        "id": "co_emp5",
        "type": "Company",
        "label": "Uría",
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
            p("students_enrolled", str(COHORT_HEADCOUNT), D),
        ],
    },
    {
        "id": "students", "type": "StudentGroup", "label": "Alumnos Z-IB 1Q26",
        "count": str(COHORT_HEADCOUNT),
        # The line under the label, and it is not decoration. Four tiles are not a cohort, and a
        # drawing that reveals four individuals without saying how many it left out has quietly
        # replaced thirty four people with four. Same discipline as the count of Done cards the
        # board draws under the ones it shows. It appears and disappears with the four tiles,
        # because a marker about a reveal has nothing to say while nothing is revealed, and the
        # number in it is computed and never typed.
        "tail": f"and {NOT_DRAWN} more, not drawn",
        "note": ("One card standing for the whole cohort. Clicking it draws four of the thirty "
                 "four as individual Student objects, in space the layout already keeps for "
                 "them, with the count of the ones it did not draw underneath. Every person in "
                 "this cohort is invented, here and in the full list: no roster of real "
                 "students is imported into this repository or published on this page."),
        "props": [
            p("headcount", str(COHORT_HEADCOUNT), D),
            p("representation", f"one card for {COHORT_HEADCOUNT}, {DRAWN_STUDENTS} drawn on "
                                f"click", E),
            # This row used to read "not shown, and not in this repo", which stopped being true
            # the moment the four tiles and the full list arrived. It is not softened: it says
            # what is now in the repository and what is still not, which is any real person.
            p("individual_records", f"{COHORT_HEADCOUNT} invented rows, no real roster", D),
            p("not_drawn", str(NOT_DRAWN), D),
            p("completion_rate", "not modelled", D),
        ],
    },
    {
        "id": "enrol", "type": "Enrolment", "label": "Enrolment 0001",
        "props": [
            p("enrolment_id", "ENR-0001", D),
            p("stands_for", f"{COHORT_HEADCOUNT} enrolments, one drawn", E),
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
            # The drawn charge is the first student's charge, so its state is read off that
            # student's row rather than typed here. Two places saying "unpaid" is one place to
            # forget when the roster changes, and the disagreement would be invisible: the tile
            # and the card would each look right on their own.
            p("state", ROSTER[0][3], D),
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
# One verb for all five, so a rule that hides an employer until its instructor is clicked can
# key on the link and reach every one of them.
for _t, _co in (("t1", "co_emp"), ("t2", "co_emp2"), ("t3", "co_emp3"),
                ("t4", "co_emp4"), ("t5", "co_emp5")):
    EDGES.append((_t, _co, "employed by"))
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

# ---- the four students that are drawn ---------------------------------------
# Issue 51. The students card carried two recorded decisions, "one card standing for 34
# individuals" and "individual records: not shown, and not in this repo", and this block retires
# the second of them: Student is a first class object type now, with its own colour, its own
# properties and its own link, and four instances of it exist on the page.
#
# Four and not thirty four. The whole drawing is thirty four nodes; exploding one lane into
# thirty four tiles would double it and teach nothing that four do not, because what a reader
# has to see here is the shape of a Student record and the fact that it joins the rest of the
# model. The cohort as a population is a different question with a different answer, and the
# answer is the full list, which is the sheet at #/students and holds all thirty four rows.
#
# ONE VERB, AND THE REVEAL KEYS ON IT. 'member of' belongs to these four edges and to nothing
# else on the page, which is what lets app.js derive the hidden set by walking the edges rather
# than by holding a list of ids or by keying on the Student type. A fifth student added here
# joins the rule by existing. Same reasoning as the 'employed by' rule in issue 48, and the
# reason it is worth repeating is that keying on the type worked there too, right up until a
# Company turned out to be playing two roles.
STUDENT_IDS = [f"s{i}" for i in range(1, DRAWN_STUDENTS + 1)]

for _i, (_name, _uni, _yob, _state) in enumerate(ROSTER[:DRAWN_STUDENTS], start=1):
    # Enrolment 0001 and charge 0001 are the ones the drawing carries as nodes; the other
    # thirty three of each exist in the model and are not drawn, which the row says rather than
    # leaving the reader to assume that ENR-0002 is missing.
    _drawn = ", drawn" if _i == 1 else ", not drawn"
    NODES.append({
        "id": f"s{_i}", "type": "Student", "label": _name,
        "note": ("An invented person. This card exists to show that a Student is an object with "
                 "properties and links and not a name inside a headcount, and every value on it "
                 "is made up: no real student, no real cohort, nothing imported from any Zrive "
                 "system, on a page anyone with the URL can read."),
        "props": [
            p("name", "invented", D),
            p("university", _uni, D),
            # year and not date, on purpose: see the note above ROSTER.
            p("year_of_birth", _yob, D),
            p("recorded_as", f"ENR-{_i:04d}{_drawn}", D),
            p("charge", f"CHG-{_i:04d}{_drawn}", D),
            p("charge_state", _state, D),
        ],
    })
    EDGES.append((f"s{_i}", "students", "member of"))

# The full cohort as rows, for the sheet at #/students. It is the same list the four tiles come
# off, so the sheet cannot disagree with the drawing about who the first four are, and the four
# carry the id of the node they are drawn as. Everything here is invented; see ROSTER.
ROSTER_ROWS = [
    {
        "id": f"STU-{_i:04d}",
        "name": _name,
        "uni": _uni,
        "yob": _yob,
        "enrol": f"ENR-{_i:04d}",
        "state": _state,
        "node": f"s{_i}" if _i <= DRAWN_STUDENTS else None,
    }
    for _i, (_name, _uni, _yob, _state) in enumerate(ROSTER, start=1)
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

# ---- and the whole of it, once it is assembled ------------------------------
# Every string this model puts on the page, through the same check the roster went through
# above: labels, property keys and values, notes, marks, the tail, the verbs, the type names.
# The roster is checked on its own first so that a bad name is reported as a row number rather
# than as a node id, and everything is checked here so that nothing gets through by not being a
# name. Comments are not in this set and do not need to be: the repository gate reads the file
# whole, which is how a real name in a comment in this very block was caught.
_strings = [("TYPES", t[1]) for t in TYPES]
for _n in NODES:
    _w = f"node {_n['id']}"
    _strings.append((_w, _n["label"]))
    for _k in ("note", "mark", "tail"):
        if _n.get(_k):
            _strings.append((f"{_w} {_k}", _n[_k]))
    for _pr in _n["props"]:
        _strings += [(f"{_w} prop {_pr['k']}", _pr["k"]), (f"{_w} prop {_pr['k']}", _pr["v"])]
_strings += [(f"edge {_s}->{_t}", _v) for _s, _t, _v in EDGES]
_strings += [(f"roster {_r['id']}", _r[_f])
             for _r in ROSTER_ROWS for _f in ("name", "uni", "state")]
_check_names(_strings)
