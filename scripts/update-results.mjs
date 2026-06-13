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
  'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_group_stage',
  'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage',
];

const TEAM_ALIASES = {
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
  'Côte d’Ivoire': "Cote d'Ivoire",
  "Côte d'Ivoire": "Cote d'Ivoire",
  'Ivory Coast': "Cote d'Ivoire",
  'Curaçao': 'Curacao',
  'DR Congo': 'Congo DR',
  'Democratic Republic of the Congo': 'Congo DR',
};

function canon(name) {
  if (!name) return name;
  const trimmed = name.trim().replace(/\s+/g, ' ');
  return TEAM_ALIASES[trimmed] ?? trimmed;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'sports-tracker-scraper/1.0 (https://github.com/) — friendly bot',
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

  // Date — used only for disambiguation when teams are repeated.
  // Wikipedia footballbox typically has class .fdate (date of the match).
  let dateIso = null;
  const dateText = $box.find('.fdate').first().text().trim();
  if (dateText) {
    const d = Date.parse(dateText);
    if (!Number.isNaN(d)) dateIso = new Date(d).toISOString().slice(0, 10);
  }

  return { home, away, homeGoals, awayGoals, ht, pens, dateIso };
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
        const next = {
          home: parsed.homeGoals,
          away: parsed.awayGoals,
          status: 'finished',
          ...(parsed.ht ? { ht: parsed.ht } : {}),
          ...(parsed.pens ? { pens: parsed.pens } : {}),
        };
        const prev = results[key];
        if (
          !prev ||
          prev.home !== next.home ||
          prev.away !== next.away ||
          prev.status !== next.status ||
          JSON.stringify(prev.ht) !== JSON.stringify(next.ht) ||
          JSON.stringify(prev.pens) !== JSON.stringify(next.pens)
        ) {
          results[key] = next;
          console.log(`[update] match ${key}: ${parsed.home} ${next.home}-${next.away} ${parsed.away}`);
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
  process.exit(0);
});
