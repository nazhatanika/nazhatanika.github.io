#!/usr/bin/env python3
"""Keep the recognition cards pointing at live pages while they exist.

Checks the two program pages. If a page is gone (non-200) or replaced (missing
content marker), swaps that card's link to its archive.org snapshot and pushes.
Run by cron; prints what it did and exits 0 either way.
"""
import subprocess, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = ROOT / "index.html"
PAIRS = [
    ("https://www.nitmb.org/summer-undergraduate-research-program/", "NITMB",
     "https://web.archive.org/web/20261005174226/https://www.nitmb.org/summer-undergraduate-research-program/"),
    ("https://www.albany.edu/rna/bioinformatics-research-program", "bioinformatics",
     "https://web.archive.org/web/20261005174758/https://www.albany.edu/rna/bioinformatics-research-program"),
]

def alive(url, marker):
    try:
        code = subprocess.run(["curl", "-s", "-L", "-m", "30", "-o", "/tmp/linkcheck.html",
                               "-w", "%{http_code}", url], capture_output=True, text=True).stdout.strip()
        if code != "200":
            return False, f"HTTP {code}"
        body = pathlib.Path("/tmp/linkcheck.html").read_text(errors="ignore")
        if marker.lower() not in body.lower():
            return False, "page replaced (marker missing)"
        return True, "ok"
    except Exception as e:
        return False, f"error: {e}"

html = HTML.read_text()
changed, notes = False, []
for live, marker, arch in PAIRS:
    ok, why = alive(live, marker)
    notes.append(f"{live} -> {why}")
    if not ok and live in html:
        html = html.replace(live, arch)
        changed = True
if changed:
    HTML.write_text(html)
    subprocess.run(["git", "-C", str(ROOT), "add", "-A"], check=True)
    subprocess.run(["git", "-C", str(ROOT), "commit", "-q", "-m",
                    "Recognition links: swap dead pages to archive.org snapshots"], check=True)
    env = dict(**__import__("os").environ)
    tok = ""
    for line in (pathlib.Path.home() / ".hermes/.env").read_text().splitlines():
        if line.startswith("GITHUB_TOKEN="):
            tok = line.split("=", 1)[1]
    env["GITHUB_TOKEN"] = tok
    subprocess.run(["git", "-C", str(ROOT), "push", "-q", "origin", "main"], check=True, env=env)
    print("SWAPPED to archive and pushed")
else:
    print("all live links still valid")
print("\n".join(notes))
