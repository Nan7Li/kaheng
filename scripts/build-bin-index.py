#!/usr/bin/env python3
"""Compress Techbuddie-Solutions/binlist-data into public/bin-index.json.gz.

CC BY 4.0 — attribute Techbuddie-Solutions/binlist-data
(merged from iannuttall/binlist-data and venelinkochev/bin-list-data).

Record format v2: {bin6}{scheme}{alpha2}{type}{level}{bankIdx}
"""

from __future__ import annotations

import csv
import gzip
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "bin-index.json.gz"
SRC = "https://raw.githubusercontent.com/Techbuddie-Solutions/binlist-data/main/bins.csv"

SCHEME = {
    "VISA": "v",
    "VISA/DANKORT": "v",
    "MASTERCARD": "m",
    "MAESTRO": "m",
    "AMERICAN EXPRESS": "a",
    "AMEX": "a",
    "UNIONPAY": "u",
    "CHINA UNIONPAY": "u",
    "DISCOVER": "u",
}

LEVEL = {
    "CLASSIC": "c",
    "STANDARD": "s",
    "GOLD": "g",
    "PLATINUM": "p",
    "TITANIUM": "t",
    "BUSINESS": "b",
    "CORPORATE": "b",
    "WORLD": "w",
    "WORLD ELITE": "w",
    "BLACK": "k",
    "INFINITE": "i",
    "SIGNATURE": "i",
    "PREMIUM": "m",
    "ENHANCED": "e",
    "GIFT": "f",
}


def scheme_of(brand: str) -> str:
    b = brand.upper()
    if b in SCHEME:
        return SCHEME[b]
    if "VISA" in b:
        return "v"
    if "MASTER" in b or "MAESTRO" in b:
        return "m"
    if "AMEX" in b or "AMERICAN" in b:
        return "a"
    if "UNION" in b:
        return "u"
    return "o"


def type_of(raw: str) -> str:
    t = raw.lower()
    if "prepaid" in t:
        return "p"
    if "debit" in t:
        return "d"
    if "credit" in t:
        return "c"
    return "o"


def level_of(raw: str) -> str:
    t = raw.upper().strip()
    if not t:
        return "o"
    if t in LEVEL:
        return LEVEL[t]
    if "PLATINUM" in t or "白金" in t:
        return "p"
    if "GOLD" in t:
        return "g"
    if "TITANIUM" in t:
        return "t"
    if "INFINITE" in t or "SIGNATURE" in t:
        return "i"
    if "WORLD" in t:
        return "w"
    if "BLACK" in t:
        return "k"
    if "BUSINESS" in t or "CORPORATE" in t:
        return "b"
    if "CLASSIC" in t:
        return "c"
    if "STANDARD" in t:
        return "s"
    if "PREMIUM" in t:
        return "m"
    if "ENHANCED" in t:
        return "e"
    if "GIFT" in t:
        return "f"
    return "o"


def completeness(issuer: str, alpha2: str, typ: str, level: str) -> int:
    return (
        int(bool(issuer)) * 8
        + int(len(alpha2) == 2) * 4
        + int(typ != "o") * 2
        + int(level != "o")
    )


def main() -> int:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if src and src.exists():
        text = src.read_text(encoding="utf-8", errors="replace")
    else:
        print(f"downloading {SRC}", file=sys.stderr)
        with urllib.request.urlopen(SRC, timeout=120) as res:
            text = res.read().decode("utf-8", errors="replace")

    banks: dict[str, int] = {}
    bank_list: list[str] = []
    best: dict[str, tuple[int, str]] = {}

    reader = csv.DictReader(text.splitlines())
    for row in reader:
        bin6 = (row.get("bin") or "").strip()
        if not bin6.isdigit() or len(bin6) < 6:
            continue
        bin6 = bin6[:6]
        issuer = (row.get("issuer") or "").strip()
        alpha2 = (row.get("alpha_2") or "").strip().upper()[:2] or "??"
        if len(alpha2) != 2:
            alpha2 = "??"
        s = scheme_of(row.get("brand") or "")
        t = type_of(row.get("type") or "")
        lv = level_of(row.get("category") or "")
        if issuer not in banks:
            banks[issuer] = len(bank_list)
            bank_list.append(issuer)
        rec = f"{bin6}{s}{alpha2}{t}{lv}{banks[issuer]}"
        score = completeness(issuer, alpha2, t, lv)
        prev = best.get(bin6)
        if prev is None or score >= prev[0]:
            best[bin6] = (score, rec)

    lines = [best[k][1] for k in sorted(best)]
    payload = {
        "v": 2,
        "src": "techbuddie-solutions/binlist-data",
        "n": len(lines),
        "b": bank_list,
        "r": "\n".join(lines),
    }
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with gzip.open(OUT, "wb", compresslevel=9) as fh:
        fh.write(raw)
    print(f"wrote {OUT} bins={len(lines)} banks={len(bank_list)} bytes={OUT.stat().st_size}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
