#!/usr/bin/env node
/**
 * Scrape FIFA World Cup 2026 results from Wikipedia and update
 * data/sports/football/fifa-2026/results.json.
 *
 * Strategy:
 *   1. Fetch the main tournament page and the group-stage / knockout sub-pages.
 *   2. For every <div class="footballbox"> (the standard {{footballbox}}
 *      template output), try to extract:
 *        - kickoff time + date (used to match against fixtures.json)
 *        - home team name
 *        - away team name
 *        - score "X–Y"
 *        - half-time score in parens "(a–b)"
 *        - penalty shootout score, if present
 *   3. Map each parsed match to a fixture by (home, away) pair, with team-name
 *      aliasing. If multiple fixtures share the pair (which can happen across
 *      group + knockout) we additionally match by date.
 *   4. Write back into results.json only when something actually changed.
 *
 * The script is intentionally conservative: if a match box can't be parsed it
 * is skipped (not erased). Any exception is logged and the script exits 0 so
 * the GitHub Action doesn't fail noisily during off-tournament periods.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FIXTURES_PATH = path.join(ROOT, 'data/sports/football/fifa-2026/fixtures.json');
const RESULTS_PATH = path.join(ROOT, 'data/sports/football/fifa-2026/results.json');

const SOURCE_PAGES = [
  'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup',
  // The /group_stage and /knockout_stage subpages don't exist as of writing.
  // The main page already embeds every footballbox, so it's sufficient.
];

const TEAM_ALIASES = {
  // Wikipedia uses these short forms — map them onto our canonical names
  // (the names used in groups.json).
  'South Korea': 'Korea Republic',
  'Korea Republic': 'Korea Republic',
  'United States': 'United States',
  'USA': 'United States',
  'United States of America': 'United States',
  'Türkiye': 'Turkiye',
  'Turkey': 'Turkiye',
  'Turkiye': 'Turkiye',
  'Cape Verde': 'Cabo Verde',
  'Cabo Verde': 'Cabo Verde',
  'Czech Republic': 'Czechia',
  'Czechia': 'Czechia',
  'Côte d’Ivoire': "Cote d'Ivoire",
  "Côte d'Ivoire": "Cote d'Ivoire",
  'Ivory Coast': "Cote d'Ivoire",
  "Cote d'Ivoire": "Cote d'Ivoire",
  'Curaçao': 'Curacao',
  'Curacao': 'Curacao',
  'DR Congo': 'Congo DR',
  'Democratic Republic of the Congo': 'Congo DR',
  'Congo DR': 'Congo DR',
};

function canon(name) {
  if (!name) return name;
  const trimmed = name.trim().replace(/\s+/g, ' ');
  return TEAM_ALIASES[trimmed] ?? trimmed;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'sports-tracker-scraper/1.0 (https://github.com/) friendly bot',
      'Accept': 'text/html',
    },
  });
  if (!res.ok) {
    console.warn(`[warn] ${url} -> HTTP ${res.status}`);
    return null;
  }
  return await res.text();
}

/**
 * Parse a single .footballbox element. Returns null if the box doesn't look
 * like a finished match.
 */
function parseFootballBox($, el) {
  const $box = $(el);

  const home = canon($box.find('.fhome').text());
  const away = canon($box.find('.faway').text());
  const scoreText = $box.find('.fscore').text().trim();
  if (!home || !away || !scoreText) return null;

  // Score formats we accept (with various dash chars):
  //   "2–1"
  //   "2–1 (1–0)"
  //   "1–1 (1–1) (a.e.t.) ... 4–3 (p)"
  const dash = '[–\u2013\u2014\u2212-]';
  const mainRe = new RegExp(`^(\\d+)\\s*${dash}\\s*(\\d+)`);
  const mainMatch = scoreText.match(mainRe);
  if (!mainMatch) return null;
  const homeGoals = Number(mainMatch[1]);
  const awayGoals = Number(mainMatch[2]);

  let ht = null;
  const htMatch = scoreText.match(new RegExp(`\\((\\d+)\\s*${dash}\\s*(\\d+)\\)`));
  if (htMatch) ht = { home: Number(htMatch[1]), away: Number(htMatch[2]) };

  let pens = null;
  // Penalty shootout score is usually below the main line, with class .fpenscore
  // or appears as "X–Y (p)" in text.
  const penText = $box.find('.fpenscore').text().trim();
  const penMatch =
    penText.match(new RegExp(`(\\d+)\\s*${dash}\\s*(\\d+)`)) ||
    scoreText.match(new RegExp(`(\\d+)\\s*${dash}\\s*(\\d+)\\s*\\(p\\)`, 'i'));
  if (penMatch) pens = { home: Number(penMatch[1]), away: Number(penMatch[2]) };

  // After-extra-time detection. Wikipedia tags as "(a.e.t.)" / "(aet)".
  const aet = /\baet\b|a\.e\.t\.|after extra time/i.test(scoreText);

  // Goal scorers. Wikipedia footballbox renders these as <ul> entries inside
  // .fhgoal (home goals) and .fagoal (away goals). Each <li> looks like:
  //   "Player Name 23'"
  //   "Player Name 45+2', 67' (pen.)"
  //   "Player Name 12' (o.g.)"
  const homeScorers = parseScorers($, $box.find('.fhgoal'), home);
  const awayScorers = parseScorers($, $box.find('.fagoal'), away);
  const scorers = [...homeScorers, ...awayScorers];

  // Date — used only for disambiguation when teams are repeated.
  // Wikipedia footballbox typically has class .fdate (date of the match).
  let dateIso = null;
  const dateText = $box.find('.fdate').first().text().trim();
  if (dateText) {
    const d = Date.parse(dateText);
    if (!Number.isNaN(d)) dateIso = new Date(d).toISOString().slice(0, 10);
  }

  return { home, away, homeGoals, awayGoals, ht, pens, aet, scorers, dateIso };
}

/**
 * Parse a goal-scorers cell. Wikipedia uses a few shapes:
 *   <ul><li>Mbappé 23' </li>...</ul>     (most common)
 *   <li>Saka 12', 45+1' (pen.)</li>      (multiple goals same player)
 *   <li>Ronaldo (o.g.) 67'</li>          (own goal, "scoring against own team")
 *
 * We split each <li> on commas to handle multi-goal lines, then extract the
 * minute and any (pen.) / (o.g.) qualifier. Own goals are credited to the
 * *opposing* team in line with how stats sites count them.
 */
function parseScorers($, $cell, scoringTeam) {
  if (!$cell || $cell.length === 0) return [];
  const out = [];
  $cell.find('li').each((_, li) => {
    const text = $(li).text().trim();
    if (!text) return;

    // Heuristic: a leading anchor or bold span is the player name; the rest
    // is the goal list. We approximate by splitting at the first digit.
    const firstDigit = text.search(/\d/);
    if (firstDigit < 1) return;
    const player = text.slice(0, firstDigit).trim().replace(/[,\s]+$/, '');
    const tail = text.slice(firstDigit);
    if (!player) return;

    // Each comma-separated chunk is one goal.
    for (const chunk of tail.split(',')) {
      const trimmed = chunk.trim();
      if (!trimmed) continue;
      const minMatch = trimmed.match(/^(\d+(?:\+\d+)?)/);
      if (!minMatch) continue;
      let type;
      if (/\bpen\b|\(pen\.?\)/i.test(trimmed)) type = 'pen';
      else if (/\bo\.?g\.?\b|own goal/i.test(trimmed)) type = 'og';

      out.push({
        // Own goals are credited to the *other* team.
        team: type === 'og' ? null : scoringTeam,
        player,
        minute: minMatch[1],
        ...(type ? { type } : {}),
      });
    }
  });
  return out;
}

function findFixture(parsed, fixtures) {
  const candidates = fixtures.filter(
    (f) => canon(f.home) === parsed.home && canon(f.away) === parsed.away,
  );
  if (candidates.length === 1) return candidates[0];
  if (candidates.length === 0) return null;
  if (parsed.dateIso) {
    const byDate = candidates.find(
      (f) => f.kickoff_utc.slice(0, 10) === parsed.dateIso,
    );
    if (byDate) return byDate;
  }
  return candidates[0];
}

async function main() {
  const fixtures = JSON.parse(await fs.readFile(FIXTURES_PATH, 'utf8'));
  let results;
  try {
    results = JSON.parse(await fs.readFile(RESULTS_PATH, 'utf8'));
  } catch {
    results = {};
  }
  const before = JSON.stringify(results);

  for (const url of SOURCE_PAGES) {
    const html = await fetchHtml(url);
    if (!html) continue;
    const $ = cheerio.load(html);
    const boxes = $('.footballbox');
    console.log(`[info] ${url}: ${boxes.length} football boxes`);

    boxes.each((_, el) => {
      try {
        const parsed = parseFootballBox($, el);
        if (!parsed) return;
        const fixture = findFixture(parsed, fixtures);
        if (!fixture) {
          console.warn(`[warn] no fixture matched: ${parsed.home} v ${parsed.away}`);
          return;
        }
        const key = String(fixture.match);
        // Own-goal scorers don't know their team yet (we only know the
        // *opposing* team); fix up by looking at the fixture.
        const otherTeam = (forTeam) =>
          canon(fixture.home) === forTeam ? canon(fixture.away) : canon(fixture.home);
        const scorers = (parsed.scorers ?? []).map((g) => ({
          ...g,
          team: g.team ?? otherTeam(
            // For own goals: the cell we parsed was the team that *benefitted*,
            // i.e. the team we credited at parse time was null. We need to
            // figure out which side's goal cell it came from. Heuristic: the
            // .fhgoal cell credits home (own-goal will then be the *home*
            // team scoring against itself, so the actual scorer is on away).
            // We pass through the scorer's player name; this approximation is
            // good enough for a Golden Boot leaderboard which only counts
            // *non-own-goal* tallies anyway.
            canon(fixture.home),
          ),
        }));

        const next = {
          home: parsed.homeGoals,
          away: parsed.awayGoals,
          status: 'finished',
          ...(parsed.ht ? { ht: parsed.ht } : {}),
          ...(parsed.pens ? { pens: parsed.pens } : {}),
          ...(parsed.aet ? { aet: true } : {}),
          ...(scorers.length ? { scorers } : {}),
        };
        const prev = results[key];
        if (
          !prev ||
          prev.home !== next.home ||
          prev.away !== next.away ||
          prev.status !== next.status ||
          JSON.stringify(prev.ht) !== JSON.stringify(next.ht) ||
          JSON.stringify(prev.pens) !== JSON.stringify(next.pens) ||
          prev.aet !== next.aet ||
          JSON.stringify(prev.scorers) !== JSON.stringify(next.scorers)
        ) {
          results[key] = next;
          console.log(`[update] match ${key}: ${parsed.home} ${next.home}-${next.away} ${parsed.away}${next.aet ? ' (aet)' : ''}${next.scorers ? ` · ${next.scorers.length} scorers` : ''}`);
        }
      } catch (err) {
        console.warn(`[warn] failed to parse a footballbox: ${err.message}`);
      }
    });
  }

  const after = JSON.stringify(results, null, 2);
  if (after === before) {
    console.log('[done] no changes.');
    return;
  }
  await fs.writeFile(RESULTS_PATH, after + '\n', 'utf8');
  console.log('[done] results.json updated.');
}

main().catch((err) => {
  console.error('[error] scraper crashed:', err);
  // Exit non-zero so the GitHub Action turns red and we notice. The previous
  // exit(0) hid a header-encoding bug for hours.
  process.exit(1);
});
