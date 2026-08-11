# Toy instance graph for the Zrive operating model.
#
# Everything here is invented except: the company name Zrive, the programme name and code,
# the session titles (published on the company's own public website) and the names of firms
# that are companies rather than people. All teacher names are invented. All identifiers,
# dates, counts and money figures are invented. No value in this file is measured.
import math
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


# ---- the populate route, one per type -----------------------------------------
# Issue 4, reframed by the owner's stated destination: a management tool showing every item and
# every element of the funnel. Under that objective the question a drawing of object types has to
# answer first is not what an object's fields are. It is whether the object can be got hold of at
# all. So every type on this page now carries three answers, and they are answered in the model
# rather than in prose beside it, because a fact kept beside the drawing drifts from it.
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
# THE THREE FLAGS DO REAL WORK HERE AND THE DIFFERENCE BETWEEN TWO OF THEM IS THE POINT OF THE
# CARD. `estimated` is a route that was found: a system, a role or a moment the analysis records.
# `absent` is a row that records an absence, and it covers two different absences which the text
# of the row has to tell apart:
#
#   "none", "no row is created", "nobody"   the analysis establishes that nothing holds it. This
#                                           is a finding and it is the useful half.
#   "not recorded"                          the analysis does not say. NOT the same claim, and
#                                           writing a plausible answer here instead would be
#                                           worse than leaving it blank, because the whole use of
#                                           this table is telling the two apart.
#
# Nothing below is guessed. Where the corpus is silent the row says so.
#
# WHERE IT COMES FROM. An ontology of 55 entities, five adversarial reviews and a read of the
# company's own workspace, none of which lives in this repository: `analysis/ontology/` and
# `analysis/notion/` in the private analysis repo, plus the company notes in the vault. The
# route_source rows name the file and the entity, so any one of them can be gone back to.
#
# NO PERSON IS NAMED IN A ROLE. The sources name individuals on nearly every route. Every one is
# written here as the role, which is what a tool has to be built against anyway: a route that
# says a named person does it is a route that ends when they leave, and the analysis records
# people leaving these roles. The name gate at the foot of this file would refuse the build in
# any case, and it is right to.
NO_SYSTEM = "no system holds it"


def route(system, entered_by, event, source):
    """Four rows, in the order the questions get asked, ready to sit in front of a node's own."""
    return [p("route_system", system[0], system[1]),
            p("route_entered_by", entered_by[0], entered_by[1]),
            p("route_event", event[0], event[1]),
            p("route_source", source, E)]


# Keyed by type. A node whose instances play more than one role overrides it by id, below: the
# five Company tiles that employ an instructor and the one that hosts a visit are the same type
# and are not the same object, and issue 49 deliberately gave them one type and one verb. The
# difference between them lives here, in the data, which is where that card said it would live.
ROUTES = {
    "Programme": route(
        ("no registry. Four lists of programmes disagree with each other", A),
        ("not recorded", A),
        ("no row is created. A programme appears when last quarter's folder is copied", A),
        "ontology.yaml, Programme, finding F25"),
    "Company": route(
        ("no company record. A firm is a free text name in a Notion select", A),
        ("not recorded", A),
        ("not recorded. No moment creates a company row", A),
        "ontology.yaml, Company, identity key"),
    "SessionTemplate": route(
        ("no template object. The template is last quarter's calendar rows, copied", A),
        ("operations", E),
        ("when the quarter's folder is duplicated at promotion setup", E),
        "notion 01_runbooks, Duplicar la anterior"),
    "Instructor": route(
        ("Notion. A collaborator directory row, and a select option on the calendar", E),
        ("operations keeps the calendar. Who confirms an instructor is not recorded", E),
        ("when a session is scheduled. The directory row has no recorded event", E),
        "ontology.yaml, Instructor, finding F7"),
    "CohortSession": route(
        ("Notion, one session calendar per programme per quarter", E),
        ("operations", E),
        ("on duplicating last quarter's calendar at setup, then edited by hand", E),
        "ontology.yaml, Session; notion 01_runbooks"),
    "Cohort": route(
        ("none. A cohort is the intersection of a roster, a calendar, a campus "
         "group and a website record", A),
        ("not recorded. Nobody is named as the owner of setting a cohort up", A),
        ("no row is created", A),
        "ontology.yaml, Cohort, finding F26"),
    "StudentGroup": route(
        ("the learning platform. A private campus group per intake, with its course", E),
        ("not recorded. The campus manual names no owner and says we throughout", A),
        ("created by hand, once per intake. There is no duplicate button", E),
        "notion 01_runbooks, campus creation"),
    "Student": route(
        ("the applicant tracker holds an application. No person record spans the systems", E),
        ("the student", E),
        ("on submitting the application form", E),
        "vault Data model, six identity spaces"),
    "Enrolment": route(
        ("Notion, one roster database per quarter", E),
        ("operations, by hand", E),
        ("when the candidate is marked hired and the roster row is typed", E),
        "ontology.yaml, Enrolment, finding F3"),
    "Agreement": route(
        ("none for a standard enrolment. An income share contract is a file on a Notion row", A),
        ("not recorded for a standard enrolment", A),
        ("no row is created. Nothing anywhere stores what a student owes", A),
        "ontology.yaml, PaymentPlan, finding F16"),
    "Charge": route(
        ("Stripe. A payment made by bank transfer leaves no row there", E),
        ("nobody types it. Stripe writes the row when the student pays", E),
        ("on payment through the link the acceptance email carries", E),
        "ontology.yaml, Charge, finding F4"),
    "Claim": route(
        ("Notion. Hand built exception lists, one of them for two intakes. No ledger", E),
        ("operations, row by row", E),
        ("when operations decides to chase. There is no ageing rule", E),
        "ontology.yaml, Listado de impagados"),
}

# Per node, where one type carries two different objects, and for every ghost, since a ghost is
# a class of its own and four of them share one type only because they share one way of failing.
ROUTE_BY_ID = {
    "co_col": route(
        ("Notion, one page per invitation. Not a database, and the visit is not recorded", E),
        ("operations", E),
        ("when operations invites firms for the in person weekend", E),
        "notion 07_universities, Visitas a empresas"),
    "g_inst": route(
        ("none. A paid instalment is an ordinary charge; the expected schedule is nowhere", A),
        ("nobody. Nothing writes down an expectation", A),
        ("no row is created. A failed card leaves no row at all", A),
        "ontology.yaml, Instalment"),
    "g_place": route(
        ("none, and the analysis attests it from both directions", A),
        ("the student, under the income share contract. Nothing collects it", A),
        ("no row is created", A),
        "ontology.yaml, Placement, finding F38"),
    "g_beca": route(
        ("none. The learning platform holds an action that sends an email, not a register", A),
        ("operations presses the action. Who presses it is not recorded", A),
        ("on the action at acceptance. No award row is created", A),
        "ontology.yaml, Scholarship, finding F17"),
    "g_ref": route(
        ("none. The processor executes them and the payment export cannot see them", A),
        ("the student elects; operations executes and types a free text row", A),
        ("on the student asking. It ran once as a campaign, not as a standing process", A),
        "ontology.yaml, Refund, finding F18"),
}


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
        "note": ("An invented firm. The visit it hosts attaches to the PROGRAMME and not to the "
                 "cohort, which is what the company register says: thirteen company notes point "
                 "a visit at a programme note and not one of the hundred and fifty six mentions "
                 "a cohort at all. What no system anywhere records is the other half of it, "
                 "which cohort attended. That absence has no tile on this page: it is a missing "
                 "relation between two classes that both exist, and every ghost here is a "
                 "missing class."),
        "props": [
            p("role", "empresa colaboradora", D),
            p("note", "invented company, not a real firm", D),
            p("visits_hosted", "1", D),
            p("vacancies_open", "2", D),
            p("cohort_that_attended", "no system relates a cohort to a visit", A),
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
        #
        # ITS MARK USED TO READ "no cohort_id" AND IT IS NOT HAND WRITTEN ANY MORE. Issue 4 put a
        # mark under every tile whose type no system holds, all of them saying the same sentence,
        # and this was the one tile already carrying a different one. Two marks in the same slot
        # saying different kinds of absence is bad enough. The version of it that was actually
        # dangerous is that the cohort would then have been the only marked tile NOT saying "no
        # system holds it", and a reader comparing the drawing's marks would have read that as the
        # cohort having a system, which is the single most wrong thing this page could say: the
        # cohort having no system of record is the central finding of the whole analysis.
        #
        # Nothing is lost by the change. The missing key is still a property row of its own two
        # lines below, still the first sentence of the note, and now also the route_system row,
        # which says what the cohort is instead of a record. The mark is set by the route loop at
        # the foot of this file, like every other one.
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
    # ISSUE 63, AND IT IS A DATA ERROR AND NOT A PREFERENCE. This edge used to end on the Cohort.
    # Counted across the 156 company notes in the vault: 13 carry a visit and every one of them
    # points at a PROGRAMME note; not one of the 156 contains the string cohort anywhere; and the
    # 30 key company schema has no cohort field, so the relation the drawing asserted cannot even
    # be expressed in the source. An edge pointing at the wrong object type is the one error this
    # artefact cannot afford, because it looks exactly as authoritative as the edges that are
    # right.
    #
    # WHAT IT COST, MEASURED RATHER THAN ESTIMATED. co_col sits in column 3 and prog in column 0,
    # a span of 3, which is the threshold at which an edge stops being a neighbour bezier and
    # becomes an arc slung under the row it connects. The research card priced that at up to 90
    # units of extra height and offered moving the host into column 0 as the cheaper option. It
    # is neither: the arc is FREE here, because its midpoint plus 26 lands well inside a drawing
    # already 586 tall, and moving the host into column 0 would have put both ends of this edge
    # in the SAME column, which this layout has no shape for at all. Probed rather than reasoned:
    # the same-column case falls through to the neighbour branch, which draws p0 to the right of
    # p3 and produces a loop between two tiles.
    ("co_col", "prog", "hosts visit"),
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

# ---- the route goes on every node, and the tiles with none say so -------------
# In front of the object's own properties and not after them. Under the management tool objective
# the first question about any tile is whether it can be filled at all, and the second is what it
# would hold; a panel that answers them the other way round buries the one that decides whether
# the second question is worth asking.
#
# THE MARK IS DERIVED AND NEVER TYPED. A tile carries "no system holds it" exactly when its own
# route_system row is flagged absent, so the drawing and the panel cannot disagree about which
# types have nowhere to live. Editing the row moves the mark; there is no second place to forget.
#
# GHOSTS ARE EXEMPT, AND NOT FOR TIDINESS. A ghost tile is already the strongest statement this
# drawing makes: unfilled, dashed, italic, and its type reads "does not exist in any system" at
# the head of the panel, which is the same sentence the mark carries. Marking it as well would
# print the claim three times on one tile. It still gets all four route rows, because "nobody
# writes down an expectation" and "the student, under the income share contract" are answers, and
# a ghost with no answers recorded would be indistinguishable from a ghost nobody looked into.
#
# What this costs the drawing: nothing measurable. The marks land in the programme, template,
# cohort and agreement lanes, and the drawing's height is set by the cohort sessions lane, which
# is the tallest and carries no mark because Notion holds a session calendar.
for _n in NODES:
    _r = ROUTE_BY_ID.get(_n["id"]) or ROUTES.get(_n["type"])
    if _r is None:
        raise SystemExit(f"model: node {_n['id']} ({_n['type']}) has no populate route. Every "
                         f"type needs one, and 'unknown' is written as a route and not omitted.")
    if _n.get("mark"):
        raise SystemExit(f"model: node {_n['id']} carries a hand written mark. The mark says "
                         f"whether a system holds the type and is derived from route_system.")
    _n["props"] = _r + _n["props"]
    # How many of the rows at the front of the list are the route, so the panel can rule a line
    # under them. A count and not a name: the browser never has to know that a key beginning
    # "route_" is special, and renaming a row here cannot silently move the line.
    _n["route"] = len(_r)
    if _r[0]["f"] == A and not _n.get("ghost"):
        _n["mark"] = NO_SYSTEM

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
# build at all: site/graph.js is committed and deployed as it stands. A gate that only ever runs
# on the machine of whoever remembered to rebuild is not a gate.
#
# A TYPE CARRIES MORE THAN ONE COLOUR. Issue 56, and the map below is the whole of it on this
# side: the palette is asked for a colour PER GROUND, the check did not move, and the light
# column above is untouched to the byte, so the light page is the page it was.
#
# THE TARGET IS 4.5 AND NOT 3.0, WHICH IS THE ONE DECISION IN HERE. The gate's threshold is 3:1,
# SC 1.4.11, because a stroke is a boundary. The same thirteen colours are also written as 11px
# bold text at the head of the detail panel, which is SC 1.4.3 and 4.5:1, and app.js writes that
# colour inline, so no stylesheet reaches it. One number fixes both surfaces, and it is the
# higher one. Every dark hex holds the light one's hue and its saturation and raises only its
# lightness, so a type is the same colour in both themes and not a different one.
#
# The five that are absent from this map need nothing: on the dark plate they already measure
# 4.5374 (Cohort), 4.5930 (Session template), 5.0129 (the ghost grey), 5.6437 (Cohort session)
# and 5.8215 (Students). Absent and not written out as themselves, so that a reader can see at a
# glance which colours this card moved.
#
# THE WASH DID NOT NEED ANYTHING AND IT WAS MEASURED RATHER THAN ASSUMED. A tile is a stroke and
# a 14 per cent wash of the same hex over the band plate. At that alpha, with these hexes, the
# twelve non-ghost fills sit 1.2007 to 1.2753 off the dark plate, against 1.0983 to 1.2753 for
# the light hexes on the same plate today: every one of them steps further from the plate than
# it did, none of them flattens, and the alpha is unchanged. The ghost keeps its own 7 per cent.
TYPE_COLOUR_DARK = {
    "Programme":   "#c773c7",   # 4.6110 on the plate, 5.1730 on the page ground
    "Company":     "#8793a3",   # 4.6297 / 5.1939
    "Instructor":  "#199adb",   # 4.5980 / 5.1584
    "Student":     "#789e27",   # 4.6201 / 5.1832
    "Enrolment":   "#9784e3",   # 4.6249 / 5.1886
    "Agreement":   "#bd8750",   # 4.6384 / 5.2037
    "Charge":      "#eb6a49",   # 4.6006 / 5.1613
    "Claim":       "#e56697",   # 4.5929 / 5.1527
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
    for key, label, colour, _glyph, _col in TYPES:
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


if __name__ == "__main__":
    import sys as _sys
    if _sys.argv[1:] == ["--contrast"]:
        emit_contrast()
    else:
        raise SystemExit("usage: model.py --contrast")
