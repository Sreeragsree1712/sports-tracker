import type { GoalEvent, ResultsMap } from './types';

export interface ScorerRow {
  player: string;
  team: string;
  goals: number;
  /** Goals from open play (not penalties or own goals). */
  fromPlay: number;
  penalties: number;
  matches: number;
}

interface ScorerAccum {
  player: string;
  team: string;
  goals: number;
  fromPlay: number;
  penalties: number;
  matches: Set<string>;
}

/**
 * Aggregate goal events across all results into a Golden Boot–style ranking.
 *
 * Counting rules (matches FIFA's tiebreak philosophy where possible):
 *   - Penalties count toward the player's total goals.
 *   - Own goals are NOT credited to any player on the leaderboard.
 *   - Tiebreakers (in order): goals → fewer matches → fewer penalties → name.
 *
 * `assists` would be the next obvious axis but Wikipedia rarely lists assists
 * for international tournaments; we leave that field for a future enhancement
 * via a paid API.
 */
export function computeTopScorers(results: ResultsMap): ScorerRow[] {
  const accum = new Map<string, ScorerAccum>();

  for (const [matchKey, r] of Object.entries(results)) {
    if (!r.scorers) continue;
    for (const ev of r.scorers) {
      if (!ev.player || !ev.team) continue;
      // Own goals don't get credited to any player's tally.
      if (ev.type === 'og') continue;
      const key = `${ev.team}|${ev.player}`;
      const cur =
        accum.get(key) ?? {
          player: ev.player,
          team: ev.team,
          goals: 0,
          fromPlay: 0,
          penalties: 0,
          matches: new Set<string>(),
        };
      cur.goals += 1;
      if (ev.type === 'pen') cur.penalties += 1;
      else cur.fromPlay += 1;
      cur.matches.add(matchKey);
      accum.set(key, cur);
    }
  }

  return Array.from(accum.values())
    .map<ScorerRow>((a) => ({
      player: a.player,
      team: a.team,
      goals: a.goals,
      fromPlay: a.fromPlay,
      penalties: a.penalties,
      matches: a.matches.size,
    }))
    .sort((a, b) => {
      if (a.goals !== b.goals) return b.goals - a.goals;
      if (a.matches !== b.matches) return a.matches - b.matches;
      if (a.penalties !== b.penalties) return a.penalties - b.penalties;
      return a.player.localeCompare(b.player);
    });
}

/** Goals scored across the tournament, regardless of player attribution. */
export function totalGoals(results: ResultsMap): number {
  let n = 0;
  for (const r of Object.values(results)) {
    n += (r.home ?? 0) + (r.away ?? 0);
  }
  return n;
}

export type { GoalEvent };
