# HANDOFF — Read this first when resuming in a new Cursor window

> **For the AI assistant in the new window:** Read this entire file before doing anything. It is the complete project plan, decisions, current state, and the exact next steps. Do not re-ask questions that are already answered here.

> **For the human:** Open this folder (`~/Desktop/sports-tracker`) in a new Cursor window, open this file, and tell the AI: *"Read HANDOFF.md and continue from where the previous session left off."*

---

## 1. Project goal (one paragraph)

Build a **multi-sport scores & schedules website** ("sports-tracker"), launching with **FIFA World Cup 2026** as the first sport. The site shows fixtures in **Indian Standard Time (IST)**, group standings (computed from results), and a **knockout bracket** that fills in automatically as group stages complete. Hosted free on **GitHub Pages**. A **GitHub Actions cron** scrapes Wikipedia every ~30 minutes during the tournament to update results. Future sports (cricket, basketball, hockey, Olympics) plug in via per-sport adapters reusing generic UI primitives.

---

## 2. Decisions already made (do NOT re-ask)

| Decision | Choice |
|---|---|
| Scope | Full build: static site + auto-update workflow |
| Tech stack | **React + Vite + TypeScript + Tailwind CSS** |
| Routing | React Router (multi-sport, multi-tournament URLs) |
| Hosting | **GitHub Pages**, free public repo |
| Repo name | `sports-tracker` |
| Architecture | **Multi-sport from day 1**, FIFA 2026 as launch content |
| Data source | **Wikipedia scrape** for FIFA results (no API key, no rate limits, stable structure for major tournaments) |
| Future sports | Add a new `src/adapters/<sport>.ts` file per sport — no rewrites |
| Time zone | All times shown in **IST** (UTC+5:30); local kickoff time also displayed |
| Auto-update cadence | GitHub Action cron, every 30 min during tournament window |
| Cost | $0 (Pages free, Actions free for public repos, no paid APIs) |

We explicitly chose **NOT** to use football-data.org because the user wants multi-sport later, and Wikipedia gives us a single uniform scraping approach that works for World Cup, Olympics, IPL, etc.

---

## 3. Current state of the folder

The Vite + React + TypeScript scaffold is **already created** and `npm install` has **already run** (node_modules exists). FIFA 2026 source data and JSON files are generated.

```
~/Desktop/sports-tracker/
├── HANDOFF.md                  ← THIS FILE
├── package.json                ← Vite scaffold (React + TS)
├── package-lock.json
├── node_modules/               ← already installed
├── index.html
├── vite.config.ts
├── tsconfig.json, tsconfig.app.json, tsconfig.node.json
├── eslint.config.js
├── public/
├── src/                        ← stock Vite template, needs to be replaced
│   ├── App.tsx
│   ├── main.tsx
│   ├── App.css, index.css
│   └── assets/
└── data/
    └── sports/
        └── football/
            └── fifa-2026/
                ├── _source_fixtures.py        ← Python source (104 matches with venues + tz)
                ├── _source_fixtures_IST.csv   ← human-readable CSV reference
                ├── generate_json.py           ← regenerates the 3 JSON files below
                ├── fixtures.json              ← 104 fixtures (READY)
                ├── groups.json                ← 12 groups × 4 teams (READY)
                └── results.json               ← empty {} for now (Action will populate)
```

### What `fixtures.json` contains (per match)

```json
{
  "match": 1,
  "stage": "group",                 // group | round-of-32 | round-of-16 | quarter-final | semi-final | third-place | final
  "group": "A",                     // null for knockout matches
  "home": "Mexico",
  "away": "South Africa",
  "venue": "Estadio Azteca",
  "city": "Mexico City",
  "kickoff_local": "2026-06-11T15:00:00-06:00",
  "kickoff_utc":   "2026-06-11T21:00:00Z",
  "kickoff_ist":   "2026-06-12T02:30:00+05:30",
  "tz_offset_hours": -6,
  "status": "scheduled",            // scheduled | live | finished
  "score": null                     // { home: 2, away: 1, ht: { home: 1, away: 0 } } when finished
}
```

Knockout matches use placeholder strings like `"Group A Runner-Up"` or `"Match 74 Winner"` for `home`/`away` until results resolve them.

---

## 4. Architecture target (what to build)

```
src/
├── main.tsx
├── App.tsx                       ← Router shell + nav
├── index.css                     ← Tailwind directives
├── routes/
│   ├── Landing.tsx               ← Sport tiles: FIFA 2026 active, others "coming soon"
│   ├── football/
│   │   └── fifa2026/
│   │       ├── Layout.tsx        ← tabs: Fixtures | Groups | Bracket | Teams
│   │       ├── Fixtures.tsx
│   │       ├── Groups.tsx
│   │       ├── Bracket.tsx
│   │       └── Team.tsx          ← /football/fifa-2026/team/:slug
├── components/
│   └── shared/
│       ├── ScheduleTable.tsx     ← generic fixtures list
│       ├── StandingsTable.tsx    ← generic group standings
│       ├── Bracket.tsx           ← generic knockout bracket
│       ├── MatchCard.tsx
│       ├── TeamBadge.tsx
│       └── DateChip.tsx
├── lib/
│   ├── standings.ts              ← FIFA tiebreak rules (points, GD, GF, H2H, fair play)
│   ├── bracket.ts                ← resolves "Match 74 Winner" → actual team once known
│   ├── time.ts                   ← IST helpers, "starts in 2h 14m"
│   └── types.ts                  ← Fixture, GroupKey, Result, Standing
├── data/
│   └── fifa2026.ts               ← imports JSON from /data/sports/... and exports typed
└── adapters/                     ← future: per-sport data fetchers (cricket.ts, etc.)

scripts/
└── update-results.mjs            ← Node script run by GitHub Action; scrapes Wikipedia, writes results.json

.github/
└── workflows/
    ├── deploy.yml                ← on push to main: build + deploy to gh-pages
    └── update-results.yml        ← cron */30 * * * * during tournament window
```

---

## 5. Step-by-step plan (the new AI should execute this in order)

### Phase 1 — Foundation
1. **Replace stock Vite template** in `src/` with the structure above.
2. **Add Tailwind**: `npm install -D tailwindcss@latest postcss autoprefixer`, run `npx tailwindcss init -p`, configure `tailwind.config.js` with `content: ['./index.html', './src/**/*.{ts,tsx}']`, replace `src/index.css` with `@tailwind base; @tailwind components; @tailwind utilities;`.
3. **Add React Router**: `npm install react-router-dom`.
4. **Configure Vite** for GitHub Pages base path: in `vite.config.ts` set `base: '/sports-tracker/'`.
5. **Wire JSON imports**: enable `resolveJsonModule` in `tsconfig.json` (already true by default with Vite). Create `src/data/fifa2026.ts` that imports the three JSON files from `../../data/sports/football/fifa-2026/` and exports typed objects. Use Vite's `?raw` or just direct JSON imports (Vite supports them).

### Phase 2 — Generic primitives (`src/components/shared/`)
6. `ScheduleTable.tsx` — props: `{ fixtures, groupBy?: 'date'|'group'|'team', filter? }`. Renders rows with: match #, stage badge, home vs away, IST date+time chip, local time secondary, venue/city. Mobile-first.
7. `StandingsTable.tsx` — props: `{ standings: Standing[] }` where `Standing = { team, played, won, drawn, lost, gf, ga, gd, points, position }`. Highlight top 2 (qualified) and 3rd (best-3rd contender).
8. `Bracket.tsx` — props: `{ rounds: Round[] }`. Renders the tree from the Appendix A image: R32 → R16 → QF → SF → F, with the Bronze final off to the side. Use CSS grid + connecting lines via SVG or `::before` borders. Show placeholders ("1A", "W74") until resolved.

### Phase 3 — Logic (`src/lib/`)
9. `time.ts` — helpers: `formatIST(iso)`, `formatLocalWithTZ(iso, tzOffset)`, `relative(iso)` ("in 3h 12m" / "FT" / "LIVE 67'").
10. `standings.ts` — function `computeStandings(groupKey, fixtures, results) -> Standing[]`. Apply FIFA tiebreak order: points → GD → GF → H2H points → H2H GD → H2H GF → fair play → drawing of lots (we'll just leave deterministic at fair-play for the UI).
11. `bracket.ts` — function `resolveBracket(fixtures, results, standings) -> ResolvedFixture[]`. Replaces placeholders ("1A", "2B", "Best 3rd from A/B/C/D/F", "W74") with actual team names once those are determinable. Includes the FIFA "best 3rd-place ranking" matrix (Appendix A image shows which 3rd-place groups feed each R32 slot).

### Phase 4 — FIFA pages (`src/routes/football/fifa2026/`)
12. `Layout.tsx` — tabbed sub-nav: Fixtures, Groups, Bracket, Teams. Header with FIFA 2026 branding, "Times shown in IST" chip.
13. `Fixtures.tsx` — uses `ScheduleTable` with filters: by date, by group, by team, by stage. Default view = today's matches. "Next match" hero card at top.
14. `Groups.tsx` — 12 `StandingsTable` components in a 3-col grid (1 col mobile). Each group shows its 6 fixtures below the table.
15. `Bracket.tsx` — uses generic `Bracket` component, fed by `resolveBracket()`.
16. `Team.tsx` — per-team page: flag, group, all fixtures, current standing.

### Phase 5 — Landing
17. `routes/Landing.tsx` — hero, sport tiles: **FIFA 2026** (active link), Cricket / Basketball / Hockey / Olympics (greyed "Coming soon"). About section explaining IST-first approach.

### Phase 6 — Auto-update
18. `scripts/update-results.mjs` — Node script (no deps beyond `node-fetch` or built-in `fetch`):
    - Fetch `https://en.wikipedia.org/api/rest_v1/page/html/2026_FIFA_World_Cup` (or the group-stage subpage).
    - Parse with `cheerio` (`npm install cheerio`).
    - Extract scores from match boxes — Wikipedia uses consistent `.fscore`, `.fhgoal`, `.fagoal` classes in football match templates.
    - Update `data/sports/football/fifa-2026/results.json` with `{ "<match_no>": { home: 2, away: 1, status: "finished", ht: {...} } }`.
    - Commit & push only if file changed.
19. `.github/workflows/update-results.yml`:
    ```yaml
    name: Update results
    on:
      schedule: [{ cron: '*/30 * * * *' }]   # every 30 min
      workflow_dispatch:
    permissions:
      contents: write
    jobs:
      update:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-node@v4
            with: { node-version: '20' }
          - run: npm ci
          - run: node scripts/update-results.mjs
          - name: Commit
            run: |
              git config user.name "results-bot"
              git config user.email "actions@github.com"
              git add data/sports/football/fifa-2026/results.json
              git diff --staged --quiet || git commit -m "chore: update results"
              git push
    ```
20. `.github/workflows/deploy.yml`:
    ```yaml
    name: Deploy
    on:
      push: { branches: [main] }
      workflow_dispatch:
    permissions: { contents: read, pages: write, id-token: write }
    concurrency: { group: pages, cancel-in-progress: true }
    jobs:
      build:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-node@v4
            with: { node-version: '20', cache: 'npm' }
          - run: npm ci
          - run: npm run build
          - uses: actions/upload-pages-artifact@v3
            with: { path: ./dist }
      deploy:
        needs: build
        runs-on: ubuntu-latest
        environment: { name: github-pages, url: "${{ steps.deployment.outputs.page_url }}" }
        steps:
          - id: deployment
            uses: actions/deploy-pages@v4
    ```

### Phase 7 — Ship
21. Update root `README.md` with: project description, screenshots, how to run locally (`npm install && npm run dev`), how to deploy.
22. Final polish: favicon, OG share image, mobile testing.
23. Print push instructions for the user (see section 7 below).

---

## 6. Important reference data

### FIFA 2026 groups (final draw, 5 Dec 2025)

```
A: Mexico, South Africa, Korea Republic, Czechia
B: Canada, Switzerland, Qatar, Bosnia and Herzegovina
C: Brazil, Morocco, Haiti, Scotland
D: United States, Paraguay, Australia, Türkiye
E: Germany, Curaçao, Côte d'Ivoire, Ecuador
F: Netherlands, Japan, Tunisia, Sweden
G: Belgium, Egypt, Iran, New Zealand
H: Spain, Cabo Verde, Saudi Arabia, Uruguay
I: France, Senegal, Norway, Iraq
J: Argentina, Algeria, Austria, Jordan
K: Portugal, Uzbekistan, Colombia, Congo DR
L: England, Croatia, Ghana, Panama
```

### Bracket structure (from FIFA Appendix A image)

```
Pathway 1 (left side):
  R32: M74 (1E v 3ABCDF), M77 (1I v 3CDFGH), M73 (2A v 2B), M75 (1F v 2C),
       M83 (2K v 2L), M84 (1H v 2J), M81 (1D v 3BEFIJ), M82 (1G v 3AEHIJ)
  R16: M89 = W74 v W77, M90 = W73 v W75, M93 = W83 v W84, M94 = W81 v W82
  QF:  M97 = W89 v W90,  M98 = W93 v W94
  SF:  M101 = W97 v W98

Pathway 2 (right side):
  R32: M76 (1C v 2F), M78 (2E v 2I), M79 (1A v 3CEFHI), M80 (1L v 3EHIJK),
       M86 (1J v 2H), M88 (2D v 2G), M85 (1B v 3EFGIJ), M87 (1K v 3DEIJL)
  R16: M91 = W76 v W78, M92 = W79 v W80, M95 = W86 v W88, M96 = W85 v W87
  QF:  M99 = W91 v W92,  M100 = W95 v W96
  SF:  M102 = W99 v W100

Final:        M104 = W101 v W102
Bronze final: M103 = L101 v L102
```

The "best 3rd places" mapping (which 3rd-placed groups go into which R32 slot) is per the codes above — implement `resolveBestThirds(thirds)` in `lib/bracket.ts`.

### Time zone offsets used (June/July 2026, DST applied)

```
US Eastern (EDT)  -4 → NY/NJ, Boston, Philadelphia, Atlanta, Miami, Toronto
US Central (CDT)  -5 → Dallas, Houston, Kansas City
US Pacific (PDT)  -7 → Los Angeles, San Francisco Bay Area, Seattle, Vancouver
Mexico (no DST)   -6 → Mexico City, Guadalajara, Monterrey
IST              +5:30
```

These are encoded in `_source_fixtures.py` `TZ` dict and baked into `fixtures.json` `kickoff_*` fields, so the frontend doesn't need to do timezone math — just format the ISO strings.

---

## 7. How to push to GitHub (instructions for the human, run these AFTER the build is done)

```bash
cd ~/Desktop/sports-tracker

# Initialise git
git init -b main
git add .
git commit -m "Initial commit: FIFA 2026 multi-sport tracker MVP"

# Create the repo on GitHub (one of):
# Option A — using gh CLI (recommended):
gh repo create sports-tracker --public --source=. --remote=origin --push

# Option B — manually:
# 1. Go to https://github.com/new, name it "sports-tracker", make it Public, do NOT init with README.
# 2. Then:
#    git remote add origin https://github.com/<YOUR_USERNAME>/sports-tracker.git
#    git push -u origin main

# Enable GitHub Pages:
# Repo → Settings → Pages → Source: "GitHub Actions"
# The deploy workflow will run automatically and publish to:
#   https://<YOUR_USERNAME>.github.io/sports-tracker/
```

---

## 8. Open items / known unknowns

1. **Wikipedia HTML structure for 2026 World Cup pages.** The scraper script will need a one-time test run after the tournament starts. Build it with defensive parsing and a fallback that logs "structure changed" rather than crashing.
2. **Best 3rd-places algorithm.** Spelled out in the bracket image but the AI should re-verify the exact group-to-slot mapping when implementing `resolveBestThirds()`.
3. **Live (in-progress) scores.** Out of scope for MVP. The 30-min cron only updates finished matches. Mark as future enhancement.
4. **Per-team flags / crests.** Use Unicode flag emojis as v1; can swap to SVG flags later (e.g. `flag-icons` npm package) if desired.
5. **Mobile bracket UX.** Bracket on phones is hard. Plan: horizontal scroll wrapper on mobile, full grid on desktop ≥`md`.

---

## 9. Quick commands cheat-sheet

```bash
# Run dev server
cd ~/Desktop/sports-tracker && npm run dev

# Regenerate fixture JSON if _source_fixtures.py changes
python3 data/sports/football/fifa-2026/generate_json.py

# Build for production
npm run build

# Preview production build
npm run preview

# Run results scraper locally (after Phase 6)
node scripts/update-results.mjs
```

---

## 10. User preferences (carry forward)

From the user's rules:
- **Do not commit changes** — let the user handle the commit.
- After completing changes, provide: branch name, suggested PR title, short PR description.

For this project, since it's a fresh repo, the equivalent at the end is: print the push instructions in section 7 and a short summary of what was built.

---

**End of handoff. The new AI should now execute Phase 1 → Phase 7 in order, ticking off the todo list as it goes.**
