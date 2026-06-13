import type { Fixture, GroupKey, ResultsMap, Standing } from './types';
import { canonicalTeam } from '../data/fifa2026';

/**
 * The R32 placeholders that depend on best-3rd ranking.
 * Each match expects a 3rd-placed team coming from one of N candidate groups,
 * decided by the FIFA "best 8 of 12 third-placed teams" ranking.
 *
 * The candidate sets and target match numbers are taken directly from the
 * FIFA Appendix A bracket image (HANDOFF.md § 6).
 */
export const BEST_THIRD_SLOTS: Array<{ match: number; groups: GroupKey[] }> = [
  { match: 74, groups: ['A', 'B', 'C', 'D', 'F'] },
  { match: 77, groups: ['C', 'D', 'F', 'G', 'H'] },
  { match: 81, groups: ['B', 'E', 'F', 'I', 'J'] },
  { match: 82, groups: ['A', 'E', 'H', 'I', 'J'] },
  { match: 79, groups: ['C', 'E', 'F', 'H', 'I'] },
  { match: 80, groups: ['E', 'H', 'I', 'J', 'K'] },
  { match: 85, groups: ['E', 'F', 'G', 'I', 'J'] },
  { match: 87, groups: ['D', 'E', 'I', 'J', 'L'] },
];

/**
 * Knockout linkage: each KO match's home/away depends on either group standings
 * or winners/losers of earlier matches. We mirror the handoff description.
 */
interface KoLink {
  match: number;
  home: Source;
  away: Source;
}

type Source =
  | { kind: 'winner-of-group'; group: GroupKey }     // 1A, 1B, ...
  | { kind: 'runner-up-of-group'; group: GroupKey }  // 2A, 2B, ...
  | { kind: 'best-third-for'; match: number }        // resolved via BEST_THIRD_SLOTS
  | { kind: 'winner-of'; match: number }
  | { kind: 'loser-of'; match: number };

export const KO_LINKS: KoLink[] = [
  // R32 — Pathway 1
  { match: 74, home: { kind: 'winner-of-group', group: 'E' }, away: { kind: 'best-third-for', match: 74 } },
  { match: 77, home: { kind: 'winner-of-group', group: 'I' }, away: { kind: 'best-third-for', match: 77 } },
  { match: 73, home: { kind: 'runner-up-of-group', group: 'A' }, away: { kind: 'runner-up-of-group', group: 'B' } },
  { match: 75, home: { kind: 'winner-of-group', group: 'F' }, away: { kind: 'runner-up-of-group', group: 'C' } },
  { match: 83, home: { kind: 'runner-up-of-group', group: 'K' }, away: { kind: 'runner-up-of-group', group: 'L' } },
  { match: 84, home: { kind: 'winner-of-group', group: 'H' }, away: { kind: 'runner-up-of-group', group: 'J' } },
  { match: 81, home: { kind: 'winner-of-group', group: 'D' }, away: { kind: 'best-third-for', match: 81 } },
  { match: 82, home: { kind: 'winner-of-group', group: 'G' }, away: { kind: 'best-third-for', match: 82 } },

  // R32 — Pathway 2
  { match: 76, home: { kind: 'winner-of-group', group: 'C' }, away: { kind: 'runner-up-of-group', group: 'F' } },
  { match: 78, home: { kind: 'runner-up-of-group', group: 'E' }, away: { kind: 'runner-up-of-group', group: 'I' } },
  { match: 79, home: { kind: 'winner-of-group', group: 'A' }, away: { kind: 'best-third-for', match: 79 } },
  { match: 80, home: { kind: 'winner-of-group', group: 'L' }, away: { kind: 'best-third-for', match: 80 } },
  { match: 86, home: { kind: 'winner-of-group', group: 'J' }, away: { kind: 'runner-up-of-group', group: 'H' } },
  { match: 88, home: { kind: 'runner-up-of-group', group: 'D' }, away: { kind: 'runner-up-of-group', group: 'G' } },
  { match: 85, home: { kind: 'winner-of-group', group: 'B' }, away: { kind: 'best-third-for', match: 85 } },
  { match: 87, home: { kind: 'winner-of-group', group: 'K' }, away: { kind: 'best-third-for', match: 87 } },

  // R16
  { match: 89, home: { kind: 'winner-of', match: 74 }, away: { kind: 'winner-of', match: 77 } },
  { match: 90, home: { kind: 'winner-of', match: 73 }, away: { kind: 'winner-of', match: 75 } },
  { match: 93, home: { kind: 'winner-of', match: 83 }, away: { kind: 'winner-of', match: 84 } },
  { match: 94, home: { kind: 'winner-of', match: 81 }, away: { kind: 'winner-of', match: 82 } },
  { match: 91, home: { kind: 'winner-of', match: 76 }, away: { kind: 'winner-of', match: 78 } },
  { match: 92, home: { kind: 'winner-of', match: 79 }, away: { kind: 'winner-of', match: 80 } },
  { match: 95, home: { kind: 'winner-of', match: 86 }, away: { kind: 'winner-of', match: 88 } },
  { match: 96, home: { kind: 'winner-of', match: 85 }, away: { kind: 'winner-of', match: 87 } },

  // QF
  { match: 97, home: { kind: 'winner-of', match: 89 }, away: { kind: 'winner-of', match: 90 } },
  { match: 98, home: { kind: 'winner-of', match: 93 }, away: { kind: 'winner-of', match: 94 } },
  { match: 99, home: { kind: 'winner-of', match: 91 }, away: { kind: 'winner-of', match: 92 } },
  { match: 100, home: { kind: 'winner-of', match: 95 }, away: { kind: 'winner-of', match: 96 } },

  // SF
  { match: 101, home: { kind: 'winner-of', match: 97 }, away: { kind: 'winner-of', match: 98 } },
  { match: 102, home: { kind: 'winner-of', match: 99 }, away: { kind: 'winner-of', match: 100 } },

  // 3rd place
  { match: 103, home: { kind: 'loser-of', match: 101 }, away: { kind: 'loser-of', match: 102 } },

  // Final
  { match: 104, home: { kind: 'winner-of', match: 101 }, away: { kind: 'winner-of', match: 102 } },
];

/** Returns "1A", "2B", "3rd C/E/F/H/I" etc. for unresolved sources. */
export function placeholderLabel(s: Source): string {
  switch (s.kind) {
    case 'winner-of-group': return `1${s.group}`;
    case 'runner-up-of-group': return `2${s.group}`;
    case 'best-third-for': {
      const slot = BEST_THIRD_SLOTS.find((b) => b.match === s.match);
      return slot ? `3rd ${slot.groups.join('/')}` : '3rd ?';
    }
    case 'winner-of': return `W${s.match}`;
    case 'loser-of': return `L${s.match}`;
  }
}

interface FinishedResult {
  home: number;
  away: number;
  pens?: { home: number; away: number };
}

function getFinished(
  matchNo: number,
  fixtures: Fixture[],
  results: ResultsMap,
): FinishedResult | null {
  const r = results[String(matchNo)];
  if (r && r.status === 'finished') return { home: r.home, away: r.away, pens: r.pens };
  const f = fixtures.find((x) => x.match === matchNo);
  if (f && f.score && f.status === 'finished') {
    return { home: f.score.home, away: f.score.away, pens: f.score.pens };
  }
  return null;
}

export interface ResolvedKoMatch {
  match: number;
  homeLabel: string;
  awayLabel: string;
  homeTeam: string | null;
  awayTeam: string | null;
}

/**
 * Compute the best 3rd-placed teams ranking and assign each `best-third-for`
 * slot. Returns a map of slot match number -> team name (when assignable).
 *
 * Per FIFA: rank all 12 third-placed teams by overall points → GD → GF → fair
 * play. Take the top 8. Then assign them to the 8 slots according to a fixed
 * lookup (FIFA publishes a 16-row table). We instead use the per-slot
 * candidate set: for each slot, take the highest-ranked top-8 third-placed
 * team whose group is in that slot's candidate set, removing it from the pool
 * so a team is not assigned twice.
 */
export function assignBestThirds(
  thirdsRanked: Array<{ team: string; group: GroupKey }>,
): Map<number, string> {
  const out = new Map<number, string>();
  if (thirdsRanked.length < 8) return out;
  const top8 = thirdsRanked.slice(0, 8);
  const remaining = [...top8];
  for (const slot of BEST_THIRD_SLOTS) {
    const idx = remaining.findIndex((t) => slot.groups.includes(t.group));
    if (idx === -1) continue;
    const [picked] = remaining.splice(idx, 1);
    out.set(slot.match, picked.team);
  }
  return out;
}

/** Rank all third-placed teams across groups. */
export function rankThirds(
  standingsByGroup: Record<GroupKey, Standing[]>,
): Array<{ team: string; group: GroupKey }> {
  const thirds: Array<{ s: Standing; group: GroupKey }> = [];
  (Object.keys(standingsByGroup) as GroupKey[]).forEach((g) => {
    const s = standingsByGroup[g][2];
    if (s) thirds.push({ s, group: g });
  });
  thirds.sort((a, b) => {
    const sa = a.s; const sb = b.s;
    if (sb.points !== sa.points) return sb.points - sa.points;
    if (sb.gd !== sa.gd) return sb.gd - sa.gd;
    if (sb.gf !== sa.gf) return sb.gf - sa.gf;
    return a.s.team.localeCompare(b.s.team);
  });
  return thirds.map(({ s, group }) => ({ team: s.team, group }));
}

/**
 * Resolve KO match home/away labels (placeholders) to actual teams when known.
 */
export function resolveBracket(
  fixtures: Fixture[],
  results: ResultsMap,
  standingsByGroup: Record<GroupKey, Standing[]>,
): Map<number, ResolvedKoMatch> {
  const allFinished = (Object.values(standingsByGroup)).every(
    (arr) => arr.every((s) => s.played === 3),
  );

  const bestThirds = allFinished
    ? assignBestThirds(rankThirds(standingsByGroup))
    : new Map<number, string>();

  // Memoised participant cache so winner/loser lookups can chain through KO graph.
  const participantCache = new Map<number, { home: string | null; away: string | null }>();

  const resolveSrc = (s: Source): string | null => {
    switch (s.kind) {
      case 'winner-of-group': {
        const st = standingsByGroup[s.group];
        return st && st[0]?.played === 3 ? st[0].team : null;
      }
      case 'runner-up-of-group': {
        const st = standingsByGroup[s.group];
        return st && st[1]?.played === 3 ? st[1].team : null;
      }
      case 'best-third-for':
        return bestThirds.get(s.match) ?? null;
      case 'winner-of':
        return winnerOf(s.match);
      case 'loser-of':
        return loserOf(s.match);
    }
  };

  const participantsOf = (matchNo: number): { home: string | null; away: string | null } => {
    const cached = participantCache.get(matchNo);
    if (cached) return cached;
    const link = KO_LINKS.find((l) => l.match === matchNo);
    let res: { home: string | null; away: string | null };
    if (link) {
      res = { home: resolveSrc(link.home), away: resolveSrc(link.away) };
    } else {
      const f = fixtures.find((x) => x.match === matchNo);
      res = f
        ? { home: canonicalTeam(f.home), away: canonicalTeam(f.away) }
        : { home: null, away: null };
    }
    participantCache.set(matchNo, res);
    return res;
  };

  const winnerOf = (matchNo: number): string | null => {
    const r = getFinished(matchNo, fixtures, results);
    if (!r) return null;
    const p = participantsOf(matchNo);
    if (!p.home || !p.away) return null;
    if (r.home > r.away) return p.home;
    if (r.away > r.home) return p.away;
    if (r.pens) return r.pens.home > r.pens.away ? p.home : p.away;
    return null;
  };

  const loserOf = (matchNo: number): string | null => {
    const r = getFinished(matchNo, fixtures, results);
    if (!r) return null;
    const p = participantsOf(matchNo);
    if (!p.home || !p.away) return null;
    if (r.home < r.away) return p.home;
    if (r.away < r.home) return p.away;
    if (r.pens) return r.pens.home < r.pens.away ? p.home : p.away;
    return null;
  };

  const out = new Map<number, ResolvedKoMatch>();
  for (const link of KO_LINKS) {
    const homeTeam = resolveSrc(link.home);
    const awayTeam = resolveSrc(link.away);
    out.set(link.match, {
      match: link.match,
      homeLabel: placeholderLabel(link.home),
      awayLabel: placeholderLabel(link.away),
      homeTeam,
      awayTeam,
    });
  }
  return out;
}
