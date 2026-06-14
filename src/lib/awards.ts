import type { ResultsMap } from './types';
import { computeTopScorers, type ScorerRow } from './topScorers';

/**
 * Manual award winner edited by hand into awards.json after the final.
 * `note` is optional flavour text shown beneath the name (e.g. "5 goals, 3 assists").
 */
export interface ManualAwardWinner {
  player: string;
  team: string;
  note?: string;
}

/**
 * The Fair Play award goes to a *team* rather than a player.
 */
export interface TeamAwardWinner {
  team: string;
  note?: string;
}

export interface AwardsData {
  goldenBall: ManualAwardWinner | null;
  silverBall: ManualAwardWinner | null;
  bronzeBall: ManualAwardWinner | null;
  goldenGlove: ManualAwardWinner | null;
  bestYoungPlayer: ManualAwardWinner | null;
  fairPlay: TeamAwardWinner | null;
}

/**
 * The Boot trio is auto-resolved from the live top-scorer ranking. We expose
 * one row per Boot tier so the UI can render ties (multiple Golden Boots) when
 * they exist. Returns empty arrays if no goals have been scored yet.
 *
 * Tier definition: tied players share a tier. Once a tier is "filled", the
 * next distinct goal-count is the next tier. So if the top of the table is
 *
 *   Mbappé 8, Messi 8, Kane 7, Saka 6
 *
 * we get:
 *   golden = [Mbappé, Messi]
 *   silver = [Kane]
 *   bronze = [Saka]
 *
 * FIFA's actual tiebreak (assists, fewer minutes) is not always reproducible
 * from public data, so we list ties rather than pick arbitrarily. A manual
 * override in awards.json could refine this once FIFA publishes the official
 * order — see `BootOverride` below.
 */
export interface BootTier {
  tier: 'golden' | 'silver' | 'bronze';
  rows: ScorerRow[];
}

export function computeBoots(results: ResultsMap): BootTier[] {
  const ranked = computeTopScorers(results);
  if (ranked.length === 0) return [];

  const tiers: BootTier[] = [];
  const labels: BootTier['tier'][] = ['golden', 'silver', 'bronze'];
  let cursor = 0;

  for (const tier of labels) {
    if (cursor >= ranked.length) break;
    const goals = ranked[cursor].goals;
    const rows: ScorerRow[] = [];
    while (cursor < ranked.length && ranked[cursor].goals === goals) {
      rows.push(ranked[cursor]);
      cursor++;
    }
    tiers.push({ tier, rows });
  }

  return tiers;
}

/**
 * Visual / UX metadata is co-located with the award card grid in
 * `src/routes/football/fifa2026/Awards.tsx` — no central registry needed.
 */
