#!/usr/bin/env python3
"""Forbidden-content gate. Run against a directory of files that are about to be, or
already have been, published. Exits non zero if anything forbidden is present.

Usage: safety_grep.py <dir-or-file> [<dir-or-file> ...]
"""
import pathlib
import re
import sys
import unicodedata

FACULTY = pathlib.Path("/home/jcherranz/Obsidian/02_areas/zrive/02_areas/20_academic/faculty")

BANNED_WORDS = ["Palantir", "Foundry", "Gotham", "AIP", "Blueprint", "digital twin", "Riera"]
STOP = {"jose", "juan", "maria", "capital", "partners", "company", "group", "real", "para"}

# The only money strings this toy is allowed to carry. All three are invented.
ALLOWED_MONEY = {"1.000,00", "4.000,00", "EUR"}

# money: a grouped figure, or any figure next to a currency mark
MONEY = re.compile(r"(?<![\d.,])\d{1,3}(?:\.\d{3})+(?:,\d{2})?(?![\d.])"    # 1.000,00
                   r"|(?<![\d.,])\d{1,3}(?:,\d{3})+(?:\.\d{2})?(?![\d,])"  # 1,000.00
                   r"|\d[\d.,]*\s*(?:EUR|eur|€)"               # any figure with a currency mark
                   r"|€|\bEUR\b|\beuros?\b")
UUID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", re.I)
NOTION = re.compile(r"\b[0-9a-f]{32}\b|notion\.so|collection://", re.I)


def fold(s):
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()


def teacher_terms():
    terms = set()
    for f in sorted(FACULTY.glob("*.md")):
        person = f.stem.split(" - ")[0].strip()
        if person:
            terms.add(person)
            for tok in re.split(r"[\s.]+", person):
                if len(tok) >= 4 and fold(tok) not in STOP:
                    terms.add(tok)
    return sorted(terms)


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
    terms = teacher_terms()
    print(f"scanning {len(targets)} files against {len(terms)} real teacher name terms")
    hits = {"banned word": [], "real teacher name": [], "money": [], "notion id": []}
    for f in targets:
        try:
            text = f.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        low = fold(text)
        for w in BANNED_WORDS:
            if re.search(r"\b" + re.escape(fold(w)) + r"\b", low):
                hits["banned word"].append(f"{f}: {w}")
        for t in terms:
            if re.search(r"\b" + re.escape(fold(t)) + r"\b", low):
                hits["real teacher name"].append(f"{f}: {t}")
        for m in MONEY.finditer(text):
            hits["money"].append(f"{f}: {m.group(0).strip()}")
        for rx in (UUID, NOTION):
            for m in rx.finditer(text):
                hits["notion id"].append(f"{f}: {m.group(0)[:40]}")

    bad = 0
    for k in ("banned word", "real teacher name", "notion id"):
        v = sorted(set(hits[k]))
        print(f"\n{k}: {len(v)}")
        for x in v:
            print("   ", x)
        bad += len(v)

    money = sorted(set(hits["money"]))
    print(f"\nmoney-shaped strings: {len(money)}")
    for x in money:
        val = x.split(": ", 1)[1]
        ok = val in ALLOWED_MONEY
        bad += 0 if ok else 1
        print("    " + ("[invented, declared] " if ok else "[UNDECLARED] ") + x)

    print("\nVERDICT:", "clean" if not bad else "FORBIDDEN CONTENT PRESENT")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
