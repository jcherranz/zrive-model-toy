#!/usr/bin/env python3
"""Forbidden-content gate. Run against a directory of files that are about to be, or
already have been, published. Exits non zero if anything forbidden is present.

Usage: safety_grep.py <dir-or-file> [<dir-or-file> ...]
       safety_grep.py --fold-tokens        # stdin -> one folded token per line, sorted

THE SECOND FORM IS THE POINT OF THIS FILE'S SHAPE. Issue 117. This is the local, Python copy
of rules whose owner is scripts/forbidden_lib.sh, and for five commits running the file said so
and nothing checked it. The two copies of the token rule were never the same rule: the owner
splits on anything that is not a letter, this file searched for `\\b` boundaries, and in Python
`_` is a word character, so `data_TOKEN_row` was refused by CI and reported clean here. The
repair is not only the boundary. Both copies now answer the SAME QUESTION THROUGH THE SAME
INTERFACE, one folded token per line on stdout, so scripts/check_repo.sh --self-test can put a
corpus through both and refuse a disagreement instead of a reader comparing two files by eye.
Three readers checked by eye that a patch was present in both, which is not the same claim.
"""
import pathlib
import re
import sys
import unicodedata

# Resolved from the running user's home rather than spelled out, which is how model.py reaches
# the syllabi at line 1243. A literal path pins the safety machinery to one machine, and no gate
# rule can see a home directory, so nothing would have caught it.
FACULTY = pathlib.Path.home() / "Obsidian/02_areas/zrive/02_areas/20_academic/faculty"

# No real name belongs in this list. Every name the gate looks for comes from the faculty
# register read by register_tokens() below, so a literal here would add a tracked copy of a real
# name and no coverage. See scripts/check_forbidden.sh for the CI gate, which holds hashes.
BANNED_WORDS = ["Palantir", "Foundry", "Gotham", "AIP", "Blueprint", "digital twin"]

# The owner's two constants, and they are the reason this file can be compared with it at all.
# scripts/forbidden_lib.sh calls them FORBIDDEN_MIN_TOKEN and FORBIDDEN_STOP. A value that lives
# in two files is the shape this whole card is about, so the differential probe in
# scripts/check_repo.sh --self-test puts a corpus through both implementations rather than
# trusting that these two lines were kept in step by hand.
MIN_TOKEN = 4
STOP = {"jose", "juan", "maria", "capital", "partners", "company", "group", "real", "para"}

# The only money strings this toy is allowed to carry. All three are invented.
ALLOWED_MONEY = {"1.000,00", "4.000,00", "EUR"}

# money: a grouped figure, or any figure next to a currency mark
MONEY = re.compile(r"(?<![\d.,])\d{1,3}(?:\.\d{3})+(?:,\d{2})?(?![\d.])"    # 1.000,00
                   r"|(?<![\d.,])\d{1,3}(?:,\d{3})+(?:\.\d{2})?(?![\d,])"  # 1,000.00
                   r"|\d[\d.,]*\s*(?:EUR|eur|€)"               # any figure with a currency mark
                   r"|€|\bEUR\b|\beuros?\b")
# An ISO 8601 instant with fractional seconds reads as a grouped figure to the money pattern
# (2026-08-09T16:42:46.932Z contains 46.932). board.json carries one. Blank timestamps out of
# the copy the money pattern sees, and only that copy: no euro figure can hide inside one.
ISO_TS = re.compile(r"\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?"
                    r"(?:Z|[+-]\d{2}:?\d{2})?")
UUID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", re.I)
NOTION = re.compile(r"\b[0-9a-f]{32}\b|notion\.so|collection://", re.I)
# The owner's EMAIL_RE, and this file had no email rule at all until issue 117 measured the two
# gates against each other. An address in site/ was refused by CI and reported clean here, which
# is F15's shape in a second rule: the local half is the one a person runs before pushing.
EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")


# ---------------------------------------------------------------------------------------------
# The token rule. scripts/forbidden_lib.sh owns it; this is the local copy, and the two are now
# compared rather than asserted to agree.
# ---------------------------------------------------------------------------------------------
# WHAT THE OWNER DOES, in order: `iconv -c -f UTF-8 -t ASCII//TRANSLIT`, then `tr -cs 'A-Za-z'
# '\n'` so every character that is not an ASCII letter SEPARATES, then per run of letters emit
# the whole run and every piece cut at a case boundary, lowercase, drop anything shorter than
# MIN_TOKEN or in STOP, and `sort -u`. Every line below is one of those steps.
#
# WHY A TABLE. iconv's //TRANSLIT turns a letter with no canonical decomposition into ASCII
# letters; Python's NFKD plus "encode ascii, ignore" deletes it. The two therefore disagreed on
# every such letter, and the disagreement runs the dangerous way: the owner produced a token and
# this file produced none, so a register name spelled with one of them was refused by CI and
# reported clean here. The table below is every code point at or below U+017F on which the two
# differ AT TOKEN LEVEL, measured by putting each one through both implementations, and the
# differential probe re-measures the whole range on every self-test run rather than trusting
# this comment. Above U+017F they still differ and the residue is reported on issue 117: it is
# Latin Extended-B and beyond, which is phonetic and African orthography, not a range this
# register is written in, and closing it would mean carrying a generated copy of one libc's
# transliteration table whose output is not the same on another libc.
TRANSLIT = {
    # Latin-1 Supplement and Latin Extended-A letters with no canonical decomposition.
    "Æ": "AE", "Ð": "D", "Ø": "O", "Þ": "TH", "ß": "ss",
    "æ": "ae", "ð": "d", "ø": "o", "þ": "th",
    "Đ": "D", "đ": "d", "Ħ": "H", "ħ": "h", "ı": "i", "ĸ": "q",
    "Ł": "L", "ł": "l", "Ŀ": "L", "ŀ": "l", "ŉ": "'n",
    "Ŋ": "N", "ŋ": "n", "Œ": "OE", "œ": "oe", "Ŧ": "T", "ŧ": "t",
    # Non-letters the same iconv run turns into letters. None of them can be part of a name;
    # they are here because the differential probe sweeps the whole range and a difference the
    # probe cannot explain is a difference nobody would look at twice.
    "µ": "u", "¢": "c", "£": "GBP", "¥": "JPY", "×": "x",
}

# lower-to-upper, and acronym-to-word. The same two positions the owner's awk cuts at, and only
# those two: a digit is not a letter, so it has already separated by the time a run exists and a
# letter-to-digit boundary cannot occur inside one.
CASE_BOUNDARY = re.compile(r"(?<=[a-z])(?=[A-Z])"          # quillfarthingKestrelvane
                           r"|(?<=[A-Z])(?=[A-Z][a-z])")   # ZBLKestrelvane

LETTER_RUN = re.compile(r"[A-Za-z]+")


def ascii_fold(s):
    """The owner's `iconv -c -f UTF-8 -t ASCII//TRANSLIT`, character by character.

    A character that folds to nothing becomes a SPACE and not the empty string, because iconv
    writes a `?` there and `tr -cs 'A-Za-z'` reads that as a separator. Deleting it instead
    joined the letters on either side into one token the owner never produces, which is a
    disagreement in both directions at once.
    """
    out = []
    for ch in s:
        r = TRANSLIT.get(ch)
        if r is None:
            d = unicodedata.normalize("NFKD", ch)
            r = "".join(c for c in d if not unicodedata.combining(c))
            r = r.encode("ascii", "ignore").decode()
        out.append(r if r else " ")
    return "".join(out)


def fold_tokens(s):
    """The owner's fold_tokens: a set of lowercase tokens, whole runs and their case pieces.

    Additive by construction, for the reason the owner's comment gives: the whole run is emitted
    as well as its pieces, so a register whose only spelling is the joined one still matches and
    no token the previous folding produced is lost.
    """
    toks = set()
    for run in LETTER_RUN.findall(ascii_fold(s)):
        for piece in [run] + CASE_BOUNDARY.sub(" ", run).split():
            p = piece.lower()
            if len(p) >= MIN_TOKEN and p not in STOP:
                toks.add(p)
    return toks


def register_tokens():
    """The register, folded by the same rule scripts/gen_forbidden_hashes.sh folds it by.

    That file feeds the person names through the owner's fold_tokens and hashes the result, so
    this returns the plaintext of exactly the set whose hashes CI holds. The name rule is then
    a set intersection on both sides and not a regular expression on one of them.
    """
    people = []
    for f in sorted(FACULTY.glob("*.md")):
        person = f.stem.split(" - ")[0].strip()
        if person:
            people.append(person)
    return people, fold_tokens("\n".join(people))


def register_phrases(people):
    """The one rule this file has and the owner does not, stated rather than implied.

    A person every one of whose name words is shorter than MIN_TOKEN, or is a stop word, folds
    to no token at all and is invisible to the token rule on BOTH sides. This file also looks
    for the whole spelling, with any run of non-letters standing in for the spaces. It is
    additive, it is local only, and it is why the differential probe compares the token rule
    rather than the two gates' whole verdicts on a name.
    """
    out = []
    for person in people:
        words = [w for w in LETTER_RUN.findall(ascii_fold(person).lower()) if w]
        if len(words) >= 2:
            out.append((person, re.compile(r"(?<![a-z])" + r"[^a-z]+".join(words) + r"(?![a-z])")))
    return out


def files(args):
    out = []
    for a in args:
        p = pathlib.Path(a)
        out += [q for q in (p.rglob("*") if p.is_dir() else [p])
                if q.is_file() and ".git/" not in str(q)
                and q.name != "safety_grep.py"]
    return out


def main():
    targets = files(sys.argv[1:] or ["site"])
    people, terms = register_tokens()
    # Poka-yoke, and the same one scan_dir in scripts/check_forbidden.sh already carries. This
    # gate reads the register out of the vault, so on any machine without the vault
    # register_tokens() returns an empty set, every name comparison then runs zero times and the
    # gate prints VERDICT: clean. A gate handed nothing to scan and reporting clean is the
    # loudest lie it can tell (HANSEI.md `2026-08-empty-input-reported-success`). Exit 2, which
    # is the code scripts/verify.sh reads as "did not run" rather than as "passed".
    if not targets:
        print(f"ASSERTION FAILED: nothing to scan in {sys.argv[1:] or ['site']}", file=sys.stderr)
        return 2
    if not terms:
        print(f"ASSERTION FAILED: the faculty register at {FACULTY} yielded no name terms, so "
              f"the real-name rule would compare against nothing. This gate needs the vault; it "
              f"is the local half of the safety machinery and the two CI gates, which hold "
              f"salted hashes instead, are the half that does not.", file=sys.stderr)
        return 2
    phrases = register_phrases(people)
    print(f"scanning {len(targets)} files against {len(terms)} real teacher name terms")
    hits = {"banned word": [], "real teacher name": [], "email address": [],
            "money": [], "notion id": []}
    for f in targets:
        try:
            text = f.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        folded = ascii_fold(text).lower()
        # The banned-word rule takes the owner's boundary and not \b. The owner writes
        # (?<![A-Za-z]) ... (?![A-Za-z]), and `_` is a word character in Python and in PCRE, so
        # \b saw no boundary in `node_Palantir_row` and this rule missed three of three
        # underscore placements CI refuses. Applied to the folded copy, which is stricter than
        # the owner's raw-bytes grep and is left that way deliberately: a gate is not weakened
        # to make two copies agree.
        for w in BANNED_WORDS:
            pat = r"(?<![a-z])" + re.escape(ascii_fold(w).lower()) + r"(?![a-z])"
            if re.search(pat, folded):
                hits["banned word"].append(f"{f}: {w}")
        # The name rule, as a set intersection over the owner's tokens.
        for t in sorted(fold_tokens(text) & terms):
            hits["real teacher name"].append(f"{f}: {t}")
        for person, rx in phrases:
            if rx.search(folded):
                hits["real teacher name"].append(f"{f}: {person}")
        for m in MONEY.finditer(ISO_TS.sub(lambda t: " " * len(t.group(0)), text)):
            hits["money"].append(f"{f}: {m.group(0).strip()}")
        for m in EMAIL.finditer(text):
            hits["email address"].append(f"{f}: {m.group(0)}")
        for rx in (UUID, NOTION):
            for m in rx.finditer(text):
                hits["notion id"].append(f"{f}: {m.group(0)[:40]}")

    bad = 0
    for k in ("banned word", "real teacher name", "email address", "notion id"):
        v = sorted(set(hits[k]))
        print(f"{k}: {len(v)}")
        for x in v:
            print("   ", x)
        bad += len(v)

    money = sorted(set(hits["money"]))
    print(f"money-shaped strings: {len(money)}")
    for x in money:
        val = x.split(": ", 1)[1]
        ok = val in ALLOWED_MONEY
        bad += 0 if ok else 1
        print("    " + ("[invented, declared] " if ok else "[UNDECLARED] ") + x)

    print("\nVERDICT:", "clean" if not bad else "FORBIDDEN CONTENT PRESENT")
    return 1 if bad else 0


def fold_stdin():
    """The interface the differential probe reads. One token per line, sorted, nothing else.

    Deliberately the same answer, in the same order, that `bash scripts/forbidden_lib.sh
    --fold-tokens` gives: its last stage is `sort -u` and every token is lowercase ASCII
    letters, on which C and en_US collation agree.
    """
    for t in sorted(fold_tokens(sys.stdin.read())):
        print(t)
    return 0


if __name__ == "__main__":
    if sys.argv[1:2] == ["--fold-tokens"]:
        sys.exit(fold_stdin())
    sys.exit(main())
