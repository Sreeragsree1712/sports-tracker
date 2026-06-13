import type { Fixture, GroupKey, GroupsMap, ResultsMap, Standing } from './types';
import { canonicalTeam } from '../data/fifa2026';

interface Acc {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
}

function emptyAcc(team: string): Acc {
  return { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
}

/** Return only fixtures relevant to a group. */
export function fixturesForGroup(groupKey: GroupKey, fixtures: Fixture[]): Fixture[] {
  return fixtures.filter((f) => f.stage === 'group' && f.group === groupKey);
}

interface GoalAggregate {
  gf: number;
  ga: number;
}

/**
 * Compute standings for a single group, with FIFA tiebreakers applied:
 *   1. Points
 *   2. Goal difference (overall)
 *   3. Goals for (overall)
 *   4. Head-to-head points (between tied teams only)
 *   5. Head-to-head GD
 *   6. Head-to-head GF
 *   (Fair play and drawing of lots are not implemented — left to FIFA.)
 */
export function computeStandings(
  groupKey: GroupKey,
  groups: GroupsMap,
  fixtures: Fixture[],
  results: ResultsMap,
): Standing[] {
  const teams = groups[groupKey];
  const accs = new Map<string, Acc>();
  for (const t of teams) accs.set(t, emptyAcc(t));

  const groupFixtures = fixturesForGroup(groupKey, fixtures);

  for (const f of groupFixtures) {
    const home = canonicalTeam(f.home);
    const away = canonicalTeam(f.away);
    const r = results[String(f.match)] ?? (f.score && f.status === 'finished' ? f.score : null);
    if (!r || (r as { status?: string }).status === 'live') continue;
    const finished =
      'status' in r ? (r as { status: string }).status === 'finished' : true;
    if (!finished) continue;

    const ha = accs.get(home);
    const aa = accs.get(away);
    if (!ha || !aa) continue;

    ha.played++; aa.played++;
    ha.gf += r.home; ha.ga += r.away;
    aa.gf += r.away; aa.ga += r.home;
    if (r.home > r.away) { ha.won++; aa.lost++; ha.points += 3; }
    else if (r.home < r.away) { aa.won++; ha.lost++; aa.points += 3; }
    else { ha.drawn++; aa.drawn++; ha.points++; aa.points++; }
  }

  // Build h2h sub-context for tiebreaks.
  const h2hPointsAmong = (subset: string[]): Map<string, number> => {
    const subPts = new Map<string, number>(subset.map((t) => [t, 0]));
    const goals = new Map<string, GoalAggregate>(
      subset.map((t) => [t, { gf: 0, ga: 0 }]),
    );
    for (const f of groupFixtures) {
      const home = canonicalTeam(f.home);
      const away = canonicalTeam(f.away);
      if (!subset.includes(home) || !subset.includes(away)) continue;
      const r = results[String(f.match)] ?? (f.score && f.status === 'finished' ? f.score : null);
      if (!r) continue;
      const finished =
        'status' in r ? (r as { status: string }).status === 'finished' : true;
      if (!finished) continue;
      const gh = goals.get(home)!;
      const ga = goals.get(away)!;
      gh.gf += r.home; gh.ga += r.away;
      ga.gf += r.away; ga.ga += r.home;
      if (r.home > r.away) subPts.set(home, subPts.get(home)! + 3);
      else if (r.home < r.away) subPts.set(away, subPts.get(away)! + 3);
      else {
        subPts.set(home, subPts.get(home)! + 1);
        subPts.set(away, subPts.get(away)! + 1);
      }
    }
    // Encode tiebreak by composing a sortable key into the points map.
    // We instead return points and expose goals via a sibling map below.
    (subPts as unknown as { _goals: Map<string, GoalAggregate> })._goals = goals;
    return subPts;
  };

  const teamsArr = Array.from(accs.values());

  teamsArr.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aGD = a.gf - a.ga;
    const bGD = b.gf - b.ga;
    if (bGD !== aGD) return bGD - aGD;
    if (b.gf !== a.gf) return b.gf - a.gf;

    // h2h tiebreak among teams currently tied with a (and b)
    const tied = teamsArr
      .filter((t) =>
        t.points === a.points &&
        (t.gf - t.ga) === aGD &&
        t.gf === a.gf,
      )
      .map((t) => t.team);
    if (tied.length >= 2 && tied.length < teamsArr.length) {
      const sub = h2hPointsAmong(tied);
      const goals = (sub as unknown as { _goals: Map<string, GoalAggregate> })._goals;
      const ap = sub.get(a.team) ?? 0;
      const bp = sub.get(b.team) ?? 0;
      if (bp !== ap) return bp - ap;
      const ag = goals.get(a.team)!;
      const bg = goals.get(b.team)!;
      const aGDH = ag.gf - ag.ga;
      const bGDH = bg.gf - bg.ga;
      if (bGDH !== aGDH) return bGDH - aGDH;
      if (bg.gf !== ag.gf) return bg.gf - ag.gf;
    }
    return a.team.localeCompare(b.team);
  });

  return teamsArr.map((t, i) => ({
    team: t.team,
    played: t.played,
    won: t.won,
    drawn: t.drawn,
    lost: t.lost,
    gf: t.gf,
    ga: t.ga,
    gd: t.gf - t.ga,
    points: t.points,
    position: i + 1,
    isThird: i === 2,
  }));
}

/** Convenience: compute standings for every group. */
export function computeAllStandings(
  groups: GroupsMap,
  fixtures: Fixture[],
  results: ResultsMap,
): Record<GroupKey, Standing[]> {
  const out = {} as Record<GroupKey, Standing[]>;
  (Object.keys(groups) as GroupKey[]).forEach((g) => {
    out[g] = computeStandings(g, groups, fixtures, results);
  });
  return out;
}
