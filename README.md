# sports-tracker

Multi-sport scores & schedules website. Launching with **FIFA World Cup 2026** in **Indian Standard Time (IST)**.

> Static site (React + Vite + Tailwind), free-hosted on GitHub Pages. A scheduled GitHub Action scrapes Wikipedia every 30 minutes during the tournament window and commits results back into the repo.

## Features

- **All times in IST** — host-city local time shown as secondary info, never the headline.
- **104 fixtures** across 16 host cities, filterable by date / stage / group / team.
- **Auto-computed group standings** with full FIFA tiebreakers (points → GD → GF → head-to-head → H2H GD → H2H GF).
- **Live knockout bracket** that resolves placeholder slots (`1A`, `2B`, `3rd ABCDF`, `W74`, …) automatically as group results come in. Includes the FIFA 2026 best-3rd-of-12 ranking.
- **Per-team pages** with full schedule and current group position.
- **Multi-sport from day one** — adding cricket, basketball, hockey, or Olympics is a new file under `src/routes/<sport>/` plus an entry in the landing page tile list.

## Quick start

```bash
npm install
npm run dev
# open http://localhost:5173/sports-tracker/
```

```bash
npm run build       # type-check + production bundle into dist/
npm run preview     # serve the production build locally
```

## Project layout

```
src/
├── App.tsx                       Router shell + nav + footer
├── main.tsx                      BrowserRouter mount
├── index.css                     Tailwind v4 entry + theme tokens
├── lib/
│   ├── types.ts                  Fixture, Standing, ResultsMap, etc.
│   ├── time.ts                   IST formatters + `relative()`
│   ├── standings.ts              FIFA tiebreaker logic
│   ├── bracket.ts                KO graph + best-3rds + resolver
│   └── flags.ts                  ISO-2 → flag emoji
├── components/shared/
│   ├── ScheduleTable.tsx         Generic, groups by IST date
│   ├── StandingsTable.tsx        Generic, highlights qualified teams
│   ├── Bracket.tsx               R32 → R16 → QF → SF + Final + 3rd
│   ├── MatchCard.tsx             Single match (used everywhere)
│   ├── TeamBadge.tsx             Flag + name
│   └── DateChip.tsx              Date + IST time pill
├── routes/
│   ├── Landing.tsx               Hero + sport tiles
│   └── football/fifa2026/
│       ├── Layout.tsx            Tabs: Fixtures / Groups / Bracket / Teams
│       ├── Fixtures.tsx          Filters + "Next match" hero
│       ├── Groups.tsx            12 groups + best-3rd ranking
│       ├── Bracket.tsx           Knockout view
│       ├── Teams.tsx             All 48 teams
│       └── Team.tsx              /team/:slug
└── data/
    └── fifa2026.ts               Imports JSON + team-name aliasing

data/sports/football/fifa-2026/
├── _source_fixtures.py           Source-of-truth Python (104 matches)
├── generate_json.py              Regenerates the JSON below
├── fixtures.json                 104 fixtures (IST + UTC + local kickoff)
├── groups.json                   12 groups × 4 teams
└── results.json                  Populated by the scraper

scripts/update-results.mjs        Wikipedia scraper (cheerio)

.github/workflows/
├── deploy.yml                    Build + deploy to GitHub Pages on push
└── update-results.yml            Cron */30 → scrape → commit results.json
```

## Adding a new sport

1. Drop fixtures + groups + results JSON under `data/sports/<sport>/<tournament>/`.
2. Create a `src/routes/<sport>/<tournament>/` folder with a `Layout.tsx` and as many tab routes as you need. Reuse `ScheduleTable`, `StandingsTable`, and `Bracket` from `src/components/shared/`.
3. Wire the routes in `src/App.tsx` and add a tile to `src/routes/Landing.tsx`.
4. (Optional) Write a `scripts/update-<sport>.mjs` scraper and a corresponding workflow.

No core code changes are required — the `Standing`, `Fixture`, and `ResultsMap` types are sport-agnostic.

## Deploy to GitHub Pages

```bash
git init -b main
git add .
git commit -m "Initial commit"
gh repo create sports-tracker --public --source=. --remote=origin --push
```

In the new GitHub repo: **Settings → Pages → Source: GitHub Actions**. The `Deploy to GitHub Pages` workflow runs automatically on every push to `main` and publishes to:

```
https://<username>.github.io/sports-tracker/
```

The `Update results` workflow runs every 30 minutes on cron (and is also triggerable from the Actions tab via *Run workflow*). It commits to `main` only when results actually change.

## Time zone handling

The Python source (`_source_fixtures.py`) bakes a `TZ` map keyed on host city → UTC offset hours, applied during JSON generation. So `fixtures.json` carries pre-computed `kickoff_local`, `kickoff_utc`, and `kickoff_ist` ISO strings — the frontend never does timezone math at runtime. To regenerate after editing source fixtures:

```bash
python3 data/sports/football/fifa-2026/generate_json.py
```

## Status

Working MVP — Phase 1 → 7 of `HANDOFF.md` complete. See that file for design history and decisions.
