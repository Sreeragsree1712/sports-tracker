import { useEffect, useState } from 'react';
import type { Fixture, ResultsMap } from './types';

/**
 * Football matches are 90 minutes plus stoppage time and (in knockouts) up to
 * 30 minutes of extra time and a penalty shootout. We cap the "live window"
 * generously so a match doesn't drop off the live list while a shootout is
 * still in progress. 145 minutes covers 90 + 15 (HT) + 30 (ET) + 10 (penalty
 * buffer); the displayed clock minute is a separate concern (see liveMinute).
 */
const LIVE_WINDOW_MS = 145 * 60_000;

/**
 * A fixture is "live" if:
 *   - its kickoff has already happened, AND
 *   - it isn't yet at the LIVE_WINDOW_MS cap, AND
 *   - results.json has no `finished` entry for it.
 *
 * We deliberately avoid relying on `fixture.status` (which is hard-coded
 * "scheduled" in fixtures.json) and avoid relying on `results.status === 'live'`
 * (the current scraper doesn't populate it). Pure time-based detection works
 * today without any backend change.
 */
export function isLive(
  fixture: Fixture,
  results: ResultsMap,
  now: Date = new Date(),
): boolean {
  const result = results[String(fixture.match)];
  if (result?.status === 'finished') return false;

  const kickoffMs = new Date(fixture.kickoff_utc).getTime();
  const nowMs = now.getTime();
  if (nowMs < kickoffMs) return false;
  if (nowMs >= kickoffMs + LIVE_WINDOW_MS) return false;
  return true;
}

/**
 * Display minute for a live match. Approximate — we cannot know half-time or
 * stoppage from time alone.
 *  -  0..45  → "1'..45'"
 *  - 45..60  → "HT" (assume 15-minute half-time)
 *  - 60..105 → "46'..90'"
 *  - 105+    → "90+'"
 */
export function liveMinute(fixture: Fixture, now: Date = new Date()): string {
  const kickoffMs = new Date(fixture.kickoff_utc).getTime();
  const elapsedMin = Math.floor((now.getTime() - kickoffMs) / 60_000);
  if (elapsedMin < 0) return '';
  if (elapsedMin <= 45) return `${Math.max(1, elapsedMin)}'`;
  if (elapsedMin < 60) return 'HT';
  if (elapsedMin <= 105) return `${elapsedMin - 60 + 46}'`;
  return "90+'";
}

/**
 * Re-render every `intervalMs` so live state stays accurate without a page
 * reload. 30s is a good default — any tighter and we'd thrash without giving
 * the user new information (we can't fetch new scores client-side without
 * also re-fetching results.json, which is intentionally a separate concern).
 */
export function useNow(intervalMs: number = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
