# TODO — sports-tracker

Living backlog. Everything below is **not yet done**. Items are grouped by priority and roughly sized (S / M / L). Cross items off as PRs land.

For context on what *is* done, see `README.md` and `HANDOFF.md`. Phases 1–7 of the original handoff plan are all merged.

---

## P0 — Verify before tournament starts (11 Jun 2026)

These can silently break the live site. Validate well before kickoff.

### P0.0 — Audit all 104 fixture dates against official sources  · M
**Why:** During QA we caught Match 6 (Australia v Turkiye) was data-entered as 12 Jun in `_source_fixtures.py` instead of the correct 13 Jun. The error was a clean off-by-one on the source date — the conversion logic itself is sound. Other matches in the schedule may have the same class of typo and we won't notice until users report them.

**Acceptance:**
- For every entry in `data/sports/football/fifa-2026/_source_fixtures.py`, cross-check `(date, local_HHMM, city)` against an authoritative source (FIFA.com or Wikipedia's tournament schedule table).
- Quickest method: scrape the FIFA.com schedule page once, diff against our source fixtures, fix any mismatches.
- After fixing, run `python3 data/sports/football/fifa-2026/generate_json.py` to regenerate JSON.
- Open one PR with all corrections.

**Files:** `data/sports/football/fifa-2026/_source_fixtures.py`.

### P0.1 — Test the Wikipedia scraper against a real article  · S
**Why:** `scripts/update-results.mjs` parses `.footballbox` elements with assumed class names (`.fhome`, `.faway`, `.fscore`, `.fdate`, `.fpenscore`). If the 2026 World Cup pages use a different template (e.g. `.football-box-foo`), the scraper will silently parse 0 boxes and the site will never update.

**Acceptance:**
- Pick one already-finished football match article on Wikipedia (e.g. `2022_FIFA_World_Cup_Final`).
- Run a one-off variant of the script against it locally and confirm it extracts the score.
- Add a fallback selector chain: try `.footballbox` → `.football-match` → any element matching `class*="football"` with the expected child fields.
- Log a single `[warn] structure-changed: parsed 0 boxes from <url>` line if a page returns nothing, so the GH Actions log makes failure obvious.

**Files:** `scripts/update-results.mjs`

### P0.2 — Verify GitHub Pages deep-link refresh works  · S
**Why:** The 404→`?p=` shim in `public/404.html` + `index.html` is untested on the live deployment. If something's off, hitting refresh on `/football/fifa-2026/bracket` will show a 404 page.

**Acceptance:**
- Visit `https://sreeragsree1712.github.io/sports-tracker/football/fifa-2026/groups` directly, hit Cmd-R.
- Should re-render the Groups page, not a GitHub 404.
- Same for `/team/brazil`, `/teams`, `/bracket`.

**Files:** none if it works; otherwise `public/404.html` + `index.html`.

### P0.3 — Confirm `Update results` workflow has push permission  · S
**Why:** New repos sometimes default to read-only `GITHUB_TOKEN`, in which case the bot commit fails.

**Acceptance:**
- Trigger `Update results` manually from the Actions tab.
- It must finish green (even with `no changes.`).
- If it errors with `Permission to ... denied to github-actions[bot]`, fix at: **Settings → Actions → General → Workflow permissions → Read and write**.

**Files:** none.

### P0.4 — Verify best-3rd-of-12 matrix against FIFA's published version  · M
**Why:** `BEST_THIRD_SLOTS` in `src/lib/bracket.ts` is encoded from the HANDOFF Appendix A image. If any candidate-set is wrong, the bracket will assign a third-placed team to the wrong R32 slot once group stage ends.

**Acceptance:**
- Cross-check each `{ match, groups: [...] }` entry against FIFA's official 16-row mapping table for 2026.
- Hand-walk a synthetic scenario (fill `results.json` so all 12 groups are 3-played) and confirm the bracket page assigns each best-3rd team to a sensible R32 slot.

**Files:** `src/lib/bracket.ts`

---

## P1 — High-value polish (do before tournament)

### P1.1 — Auto-ticking relative times  · S
**Why:** `relative(iso)` is computed at render time. The "in 2h 53m" label drifts the longer the tab stays open.

**Acceptance:**
- Add a `useNow(intervalMs = 60_000)` hook returning the current `Date`.
- Pass it (or just use it) inside `MatchCard` and the `Fixtures` "Next match" hero so the countdown re-renders every minute.
- Don't tick once a match is `finished` — only for `scheduled` / `live`.

**Files:** new `src/lib/useNow.ts`, edit `src/components/shared/MatchCard.tsx`, `src/routes/football/fifa2026/Fixtures.tsx`.

### P1.2 — OG / Twitter share image and meta tags  · S
**Why:** HANDOFF § 5 step 22. When the link is shared on WhatsApp/Slack/Twitter it currently has no preview image.

**Acceptance:**
- Add `public/og-image.png` (1200×630) — simple dark gradient, "Sports Tracker", soccer ball, "FIFA 2026 — your timezone".
- Add `<meta property="og:*">` and `<meta name="twitter:*">` tags to `index.html`.
- Test with https://www.opengraph.xyz/ after deploy.

**Files:** `public/og-image.png`, `index.html`.

### P1.3 — Live (in-progress) match indicator  · M
**Why:** Currently we only render `scheduled` and `finished`. During the tournament a 30-minute lag means visitors will see "in 2h" turn into "starting now" and then nothing until FT. A simple "LIVE" pill (without minute-by-minute scores) is high impact.

**Acceptance:**
- In `MatchCard`, if `kickoff_utc < now < kickoff_utc + 110 minutes` and no FT result yet, show a red pulsing "LIVE" pill instead of the relative countdown.
- Fixtures "Next match" hero falls through to the next un-finished one if the current "next" is now live.
- No score display — just the indicator.

**Files:** `src/components/shared/MatchCard.tsx`, `src/routes/football/fifa2026/Fixtures.tsx`.

### P1.4 — Per-team page: show next opponent + qualification status  · S
**Why:** `/team/:slug` lists fixtures but doesn't surface the most useful info ("who do they play next? are they through?").

**Acceptance:**
- Above the fixture list: a small card with the next un-played opponent, kickoff in the user's timezone + relative time.
- A status pill: *Qualified for R32* (top-2 with 3 played), *In contention* (3rd-placed, may advance), *Eliminated* (4th with 3 played, or maths-eliminated earlier), *Group leader / 2nd / 3rd / 4th* during play.
- Math-elimination check is optional — a simple `position + played` heuristic is fine for v1.

**Files:** `src/routes/football/fifa2026/Team.tsx`, possibly `src/lib/standings.ts` for a `qualificationStatus()` helper.

### P1.5 — Mobile bracket UX  · M
**Why:** HANDOFF § 8 item 5. The bracket already does horizontal scroll, but on mobile the cards are still pretty cramped. Worth a real device test.

**Acceptance:**
- Test on a real phone (or Chrome devtools iPhone 12) at 390×844.
- All four columns of each pathway must be reachable by horizontal swipe.
- Cards must be readable without pinching.
- Consider a vertical-stack layout for `<sm` breakpoint as an alternative.

**Files:** `src/components/shared/Bracket.tsx`.

---

## P2 — Nice-to-haves (do after tournament starts, if time)

### P2.1 — Replace flag emojis with SVG flags  · M
**Why:** Apple devices render emojis fine, but Windows + Linux + some Android skins render some country flags as letter pairs (e.g. "BR" instead of 🇧🇷). For England/Scotland the tag-sequence flags are even more inconsistent.

**Acceptance:**
- `npm install flag-icons` (or similar SVG flag set).
- Swap `flagEmoji()` in `src/lib/flags.ts` for an SVG component.
- Keep emoji as a fallback when no SVG is available (Curaçao etc.).

**Files:** `src/lib/flags.ts`, `src/components/shared/TeamBadge.tsx`.

### P2.2 — Result drill-down modal  · M
**Why:** Clicking a finished match should show more detail (HT score, scorers, venue map link). Currently a finished match in the schedule is just a static card.

**Acceptance:**
- New `<MatchDetailDialog>` that opens on click for finished matches.
- Show full-time score, half-time score, penalty shootout if any, venue with map link, kickoff in user's timezone + local stadium time + UTC.
- Scorers + lineups optional and out-of-scope unless the scraper is extended.

**Files:** new `src/components/shared/MatchDetailDialog.tsx`, edit `MatchCard.tsx`.

### P2.3 — "Today" prominent banner  · S
**Why:** The Fixtures page defaults to "Upcoming" — but during the tournament there are usually 3–4 matches per day and a dedicated "Today" mode would be the most-used view.

**Acceptance:**
- Add a sticky banner above the filter row: "Today (Sun 14 Jun): 3 matches" with a one-click filter toggle. Date is computed in the user's selected timezone.
- Promote `Today` from being one of four `When` options to a prominent default during tournament window.

**Files:** `src/routes/football/fifa2026/Fixtures.tsx`.

### P2.4 — Calendar export (.ics)  · M
**Why:** Power-users want to add their team's matches to Google Calendar / Apple Calendar.

**Acceptance:**
- On `/team/:slug` add a "Subscribe to calendar" button.
- Generates a static `.ics` file at build time per team (or one big `fifa-2026.ics`).
- Each event in the user's selected timezone with summary `team_name vs opponent — venue`.
- 2-hour duration.

**Files:** new `scripts/generate-ics.mjs`, build-step integration, link in `Team.tsx`.

### P2.5 — Search bar  · S
**Why:** With 48 teams + 104 matches, a quick "Cmd-K" search would be friendly. Not urgent.

**Acceptance:**
- Cmd-K opens a modal listing teams + matches.
- Fuzzy search on team / opponent / venue / city.
- Click → navigate.

**Files:** new `src/components/shared/CommandPalette.tsx`, hook into `App.tsx`.

---

## P3 — Future / multi-sport expansion

These are explicitly out of scope for the FIFA 2026 launch but the architecture is ready for them. HANDOFF § 2 describes the multi-sport plan.

### P3.1 — Cricket (IPL 2027 or T20 World Cup)  · L
- Reuse `ScheduleTable`, `StandingsTable`. No bracket — a points table + playoffs view instead.
- New `data/sports/cricket/<tournament>/fixtures.json` shape can keep the same `kickoff_utc` + `kickoff_local` + `tz_offset_hours` shape; rendering goes through the global timezone picker, no special-casing needed.
- New scraper at `scripts/update-cricket.mjs`.

### P3.2 — Basketball (NBA Finals or FIBA)  · L
### P3.3 — Hockey (Field World Cup or Olympic)  · L
### P3.4 — Olympics multi-event  · XL — separate design pass needed.

When you take one of these on, follow the "Adding a new sport" guide in `README.md`.

---

## P4 — Engineering / repo hygiene

### P4.1 — Tests for `lib/standings.ts`  · S
**Why:** The FIFA tiebreaker code is the single most likely place for a subtle bug. A handful of unit tests would catch any regression.

**Acceptance:**
- Add `vitest` as a dev dep.
- Tests covering: trivial 3-pts vs 1-pt, GD tiebreak, GF tiebreak, h2h pts tiebreak between two teams, h2h GD tiebreak, three-way tie (all three tied on h2h pts).
- Wire `npm test` script.

**Files:** new `src/lib/standings.test.ts`, `package.json`, `vite.config.ts` if needed.

### P4.2 — Tests for `lib/bracket.ts`  · S
**Why:** Same rationale — the resolver chains through a recursive winner/loser graph.

**Acceptance:**
- Tests for: pre-group resolution (everything is placeholders), group-only resolution (R32 winners-of-group filled, runners-of-group filled, best-thirds nullable until all groups done), full chain (synthetic results all the way to Final).

**Files:** new `src/lib/bracket.test.ts`.

### P4.3 — Tests for the Wikipedia scraper  · S
**Why:** Lock down parser behaviour against real saved HTML so structure changes are caught.

**Acceptance:**
- `tests/fixtures/wikipedia/*.html` — copies of a few real article HTML snapshots.
- Tests assert specific `(home, away, score, ht, pens)` extraction.
- Run in CI on every PR.

**Files:** new test fixtures, new `scripts/update-results.test.mjs`.

### P4.4 — Add ESLint config for the repo  · S
**Why:** A stock `eslint.config.js` came with the Vite scaffold but we never run it in CI.

**Acceptance:**
- Add `npm run lint` to `Deploy to GitHub Pages` workflow as a pre-build check.
- Fix any warnings.

**Files:** `.github/workflows/deploy.yml`, possibly `eslint.config.js`.

### P4.5 — Pin Node version  · S
**Why:** Workflows say `node-version: '20'` (latest 20.x). Use a `.nvmrc` for local dev parity.

**Acceptance:**
- `.nvmrc` with `20`.
- Optional: add an `engines` field to `package.json`.

**Files:** new `.nvmrc`, `package.json`.

### P4.6 — Improve `index.html` SEO + favicon  · S
**Why:** Good metadata for crawlers + a real PNG favicon for browsers that don't render SVG.

**Acceptance:**
- `<meta name="description">` already present — add `<meta name="keywords">`, `<link rel="canonical">`.
- Add `public/favicon.png` (32×32 raster export of the SVG) for older browsers.

**Files:** `index.html`, `public/favicon.png`.

### P4.7 — Stale Vite scaffold leftovers  · XS
**Why:** `public/icons.svg` is the unused stock Vite asset.

**Acceptance:** Delete it.

**Files:** `public/icons.svg`.

### P4.8 — Replace bare placeholder home/away in fixtures.json  · S
**Why:** The KO matches in `fixtures.json` carry placeholder strings like `"Group A Runner-Up"` in `home`/`away`. The frontend already supersedes these via `KO_LINKS`, but the JSON is still slightly redundant.

**Acceptance:**
- Either: keep `fixtures.json` as-is (cleanest if you want to regenerate from Python easily), **or**: change generator to set `home: null, away: null` for KO matches. Either way, document the chosen convention in `HANDOFF.md`.

**Files:** `data/sports/football/fifa-2026/_source_fixtures.py`, `data/sports/football/fifa-2026/generate_json.py`.

---

## P5 — Speculative / explore later

- Notification system: subscribe to "alert me 30 min before <team>'s next match" via the browser's Push API. Static-site limitation — would need Firebase or similar.
- Historical comparison: previous World Cup data overlay ("Argentina beat France 4-2 on pens last cycle").
- Internationalisation: Hindi / Malayalam / Tamil locale.
- Dark/light theme toggle (currently dark-only).
- Widget/embed: a 200×400 iframe that any blog can embed showing the "next match" card.

---

## Done (for reference)

- Phase 1 — Vite + React + Tailwind v4 + React Router foundation
- Phase 2 — Generic shared components (`ScheduleTable`, `StandingsTable`, `Bracket`, `MatchCard`, `TeamBadge`, `DateChip`)
- Phase 3 — `lib/time.ts`, `lib/standings.ts` (full FIFA tiebreaks), `lib/bracket.ts` (KO graph + best-3rds)
- Phase 4 — FIFA 2026 routes (Layout, Fixtures, Groups, Bracket, Teams, Team)
- Phase 5 — Landing page with sport tiles
- Phase 6 — `scripts/update-results.mjs` Wikipedia scraper + GitHub Actions cron + Pages deploy workflows
- Phase 7 — README rewrite, build verification, SPA fallback for Pages, favicon
- Initial git push + live deploy at https://sreeragsree1712.github.io/sports-tracker/

---

*Last updated: 14 Jun 2026 — bumped after first deploy.*
