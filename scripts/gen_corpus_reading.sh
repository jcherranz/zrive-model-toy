#!/usr/bin/env bash
# Record that the tables in build/model.py were held up against the private corpora, and when.
#
# WHY THIS FILE EXISTS. Issue 196. Three gates in build/model.py re-read a corpus, and all three
# used to `return` after one line to stderr when the corpus was not on the machine. No CI runner
# has any of the three, so on every CI run the sole check on SYLLABUS_SESSIONS counted nothing,
# and SYLLABUS_SESSIONS is the only source of every counts[*].total, which is the denominator of
# every fraction on every screen. Issue 168 made that state visible. This makes it stop.
#
# WHAT IT WRITES, AND WHAT IT DELIBERATELY DOES NOT. build/corpus_reading.txt: one date and one
# SHA-256 per gate over a canonical serialisation of that gate's DECLARED tables. Not the numbers
# again. The numbers are already in build/model.py in the clear, a second copy of them would
# compare a table with itself, and the copy is the one that rots. What is missing on a runner is
# not the numbers, it is any join between the numbers on its disk and an occasion on which
# somebody compared them with the corpus. That join is what this writes down.
#
# WHY IT IS SAFE TO COMMIT. Every preimage is a string already committed in the clear a few
# hundred lines from where the digest is read: SYLLABUS_SESSIONS, SYLLABUS_MODULES,
# SYLLABUS_ROWS, and the `source` citation of each populate route. No name, no figure, no count
# of anything private, nothing out of the analysis repository and nothing out of the vault ever
# reaches this file. That is why this is a tracked file and the name register is a repository
# secret: the register is a list of real people and this is three hashes of public strings.
#
# THE GUARANTEE IS NOT AN ASSUMPTION. This script imports build/model.py, and importing it runs
# the three gates, which re-read the corpus and refuse a drift. So the import either dies or has
# already proved the tables agree with the corpus, and only then is a digest taken. There is no
# path through this script that records a reading of tables nobody read.
#
# Run locally only, on a machine holding BOTH corpora. See README.md, "The recorded reading".
#
# Usage:
#   scripts/gen_corpus_reading.sh            rewrite build/corpus_reading.txt
#   scripts/gen_corpus_reading.sh --check    say whether the committed file is current, write
#                                            nothing, and exit 1 if it is not

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/build/corpus_reading.txt"

MODE="${1:-write}"
case "$MODE" in
  write|--check) ;;
  *) echo "usage: $0 [--check]" >&2; exit 1 ;;
esac

# THE CORPORA ARE LOOKED FOR BEFORE THE IMPORT AND NOT AFTER, because the gates decline politely
# when a corpus is missing and this script must not. A reading written on a machine holding half
# the corpus would attest a comparison that half happened, which is the exact confusion between
# "I looked and found nothing" and "I could not look" that this whole repository is about.
missing="$(ZRIVE_ROOT="$ROOT" python3 - <<'PY'
import os
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(os.environ["ZRIVE_ROOT"]) / "build"))
# Read the paths out of the module's source rather than by importing it: the import runs the
# gates, and this check exists to be made BEFORE they run.
src = (pathlib.Path(os.environ["ZRIVE_ROOT"]) / "build" / "model.py").read_text(encoding="utf-8")
import re
want = {}
for name in ("SYLLABUS_DIR", "ONTOLOGY_DIR", "ONTOLOGY_VAULT"):
    m = re.search(rf'^{name} = pathlib\.Path\.home\(\) / "([^"]+)"$', src, re.M)
    if not m:
        print(f"NOPATH:{name}")
        sys.exit(0)
    want[name] = pathlib.Path.home() / m.group(1)
for name, path in want.items():
    if not path.is_dir():
        print(f"{name}")
PY
)"

if [ -n "$missing" ]; then
  {
    echo "ASSERTION FAILED: this machine does not hold the corpora, so it cannot record a"
    echo "                  reading of them."
    echo
    echo "  Not on this machine:"
    printf '    %s\n' $missing
    echo
    echo "  A recorded reading says that somebody compared the tables in build/model.py with the"
    echo "  corpus they are about. A machine that cannot open the corpus cannot say that, and a"
    echo "  file written here would be an attestation of nothing wearing the shape of one."
  } >&2
  exit 2
fi

new="$(ZRIVE_ROOT="$ROOT" python3 - <<'PY'
import datetime
import os
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(os.environ["ZRIVE_ROOT"]) / "build"))
# The import is the proof. Every gate runs here, re-reads its corpus and raises on a drift, so
# nothing below this line can be reached over tables the corpus disagrees with.
import model  # noqa: E402

digests = {
    "syllabus-totals": model.syllabus_totals_digest(),
    "module-structure": model.module_structure_digest(),
    "ontology-citations": model.ontology_citation_digest(),
}
if sorted(digests) != sorted(model.READING_KEYS):
    print(f"::error::this generator writes {sorted(digests)} and build/model.py reads "
          f"{sorted(model.READING_KEYS)}. One of the two moved without the other.",
          file=sys.stderr)
    raise SystemExit(2)

out = [
    "# What a machine holding the private corpora read off them, recorded so that a machine",
    "# without them can check the tables in build/model.py against something rather than",
    "# nothing. Issue 196.",
    "#",
    "# Each line below is a SHA-256 over a canonical serialisation of the DECLARED tables one",
    "# gate holds against its corpus, taken on a machine where that gate had just re-read the",
    "# corpus and found no drift. Every preimage is a string already committed in the clear in",
    "# build/model.py. Nothing out of the vault or the analysis repository is here: no name, no",
    "# figure, no count of anything private.",
    "#",
    "# What a run without the corpus can conclude from this: the tables it is about to divide",
    "# by are byte for byte the tables somebody held up against the corpus on the date below.",
    "# What it cannot conclude: that the corpus has not moved since. That limit is printed in",
    "# the gate's own notice, and past the ageing window the build refuses this file rather",
    "# than going on quoting it.",
    "#",
    "# Generated by scripts/gen_corpus_reading.sh. Do not hand-edit: a hand-edited digest is a",
    "# signature on a reading that never happened.",
    f"schema {model.CORPUS_READING_SCHEMA}",
    f"read_on {datetime.date.today().isoformat()}",
]
width = max(len(k) for k in model.READING_KEYS)
out += [f"reading {k.ljust(width)} {digests[k]}" for k in model.READING_KEYS]
print("\n".join(out))
PY
)"

if [ "$MODE" = "--check" ]; then
  # The date moves every day and the digests do not, so a comparison of whole files would report
  # a difference on the second day for the one reason that is not a defect. What is compared is
  # the readings.
  a="$(printf '%s\n' "$new" | grep '^reading ' | tr -s ' ')"
  b="$(grep '^reading ' "$DEST" 2>/dev/null | tr -s ' ' || true)"
  if [ "$a" = "$b" ]; then
    echo "build/corpus_reading.txt records the tables this build carries."
    exit 0
  fi
  echo "ASSERTION FAILED: build/corpus_reading.txt does not record the tables this build carries." >&2
  echo "  Run scripts/gen_corpus_reading.sh on this machine and commit the result." >&2
  exit 1
fi

printf '%s\n' "$new" > "$DEST"
echo "wrote $DEST"
grep -v '^#' "$DEST" | sed 's/^/  /'
echo
echo "Commit it in the same commit as the change to the tables it is about. A runner reads it"
echo "instead of the corpus, and a runner reading a stale one refuses the build."
