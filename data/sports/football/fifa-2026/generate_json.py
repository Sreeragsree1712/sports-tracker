"""Generate fixtures.json and groups.json from _source_fixtures.py.

Run: python3 generate_json.py
"""
from __future__ import annotations
import json
import os
import sys
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from _source_fixtures import FIXTURES, TZ  # noqa: E402

IST = timezone(timedelta(hours=5, minutes=30))

GROUPS = {
    "A": ["Mexico", "South Africa", "Korea Republic", "Czechia"],
    "B": ["Canada", "Switzerland", "Qatar", "Bosnia and Herzegovina"],
    "C": ["Brazil", "Morocco", "Haiti", "Scotland"],
    "D": ["United States", "Paraguay", "Australia", "Turkiye"],
    "E": ["Germany", "Curacao", "Cote d'Ivoire", "Ecuador"],
    "F": ["Netherlands", "Japan", "Tunisia", "Sweden"],
    "G": ["Belgium", "Egypt", "Iran", "New Zealand"],
    "H": ["Spain", "Cabo Verde", "Saudi Arabia", "Uruguay"],
    "I": ["France", "Senegal", "Norway", "Iraq"],
    "J": ["Argentina", "Algeria", "Austria", "Jordan"],
    "K": ["Portugal", "Uzbekistan", "Colombia", "Congo DR"],
    "L": ["England", "Croatia", "Ghana", "Panama"],
}


def stage_for(group: str) -> str:
    return {
        "R32": "round-of-32",
        "R16": "round-of-16",
        "QF": "quarter-final",
        "SF": "semi-final",
        "3rd": "third-place",
        "Final": "final",
    }.get(group, "group")


def main():
    fixtures = []
    for match_no, date_str, hhmm, matchup, group, venue, city in FIXTURES:
        offset_h = TZ[city]
        local_tz = timezone(timedelta(hours=offset_h))
        y, m, d = [int(x) for x in date_str.split("-")]
        hh, mm = [int(x) for x in hhmm.split(":")]
        local_dt = datetime(y, m, d, hh, mm, tzinfo=local_tz)
        utc_dt = local_dt.astimezone(timezone.utc)
        ist_dt = local_dt.astimezone(IST)

        if " vs " in matchup:
            home, away = [p.strip() for p in matchup.split(" vs ", 1)]
        else:
            home, away = matchup, ""

        fixtures.append({
            "match": match_no,
            "stage": stage_for(group),
            "group": group if stage_for(group) == "group" else None,
            "home": home,
            "away": away,
            "venue": venue,
            "city": city,
            "kickoff_local": local_dt.isoformat(),
            "kickoff_utc": utc_dt.isoformat().replace("+00:00", "Z"),
            "kickoff_ist": ist_dt.isoformat(),
            "tz_offset_hours": offset_h,
            "status": "scheduled",
            "score": None,
        })

    with open(os.path.join(HERE, "fixtures.json"), "w") as f:
        json.dump(fixtures, f, indent=2)
    with open(os.path.join(HERE, "groups.json"), "w") as f:
        json.dump(GROUPS, f, indent=2)
    with open(os.path.join(HERE, "results.json"), "w") as f:
        json.dump({}, f, indent=2)
    print(f"Wrote {len(fixtures)} fixtures, {len(GROUPS)} groups, empty results.")


if __name__ == "__main__":
    main()
