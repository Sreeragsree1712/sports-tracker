import { useMemo } from 'react';
import { fixtures, results, groups } from '../../../data/fifa2026';
import StandingsTable from '../../../components/shared/StandingsTable';
import MatchCard from '../../../components/shared/MatchCard';
import { computeAllStandings, fixturesForGroup } from '../../../lib/standings';
import { rankThirds } from '../../../lib/bracket';
import type { GroupKey } from '../../../lib/types';
import TeamBadge from '../../../components/shared/TeamBadge';

const BASE = '/football/fifa-2026';

export default function Groups() {
  const standingsByGroup = useMemo(
    () => computeAllStandings(groups, fixtures, results),
    [],
  );
  const thirds = useMemo(() => rankThirds(standingsByGroup), [standingsByGroup]);

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Group stage standings</h2>
          <p className="text-xs text-slate-400 mt-1">
            Top 2 from each group qualify automatically. The 8 best 3rd-placed teams (of 12)
            also advance to the Round of 32.
          </p>
        </div>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {(Object.keys(groups) as GroupKey[]).map((g) => (
            <GroupCard key={g} groupKey={g} standings={standingsByGroup[g]} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Best 3rd-placed teams</h2>
        <p className="text-xs text-slate-400 mb-3">
          Ranked across all 12 groups. Top 8 advance.
        </p>
        <div className="overflow-x-auto rounded-xl ring-1 ring-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-2 py-2 text-left w-8">#</th>
                <th className="px-2 py-2 text-left">Team</th>
                <th className="px-2 py-2 text-center w-10">Grp</th>
                <th className="px-2 py-2 text-center w-10">Pts</th>
                <th className="px-2 py-2 text-center w-10">GD</th>
                <th className="px-2 py-2 text-center w-10">GF</th>
              </tr>
            </thead>
            <tbody>
              {thirds.map((t, i) => {
                const s = standingsByGroup[t.group][2];
                const advances = i < 8;
                return (
                  <tr
                    key={t.team}
                    className={`border-t border-slate-800 ${advances ? 'bg-pitch-900/20' : 'opacity-60'}`}
                  >
                    <td className="px-2 py-2">{i + 1}</td>
                    <td className="px-2 py-2"><TeamBadge team={t.team} size="sm" /></td>
                    <td className="px-2 py-2 text-center">{t.group}</td>
                    <td className="px-2 py-2 text-center font-bold tabular-nums">{s.points}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{s.gd > 0 ? `+${s.gd}` : s.gd}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{s.gf}</td>
                  </tr>
                );
              })}
              {thirds.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-4 text-center text-slate-500">
                  Standings will appear once group matches start.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function GroupCard({
  groupKey,
  standings,
}: {
  groupKey: GroupKey;
  standings: import('../../../lib/types').Standing[];
}) {
  const groupFixtures = fixturesForGroup(groupKey, fixtures)
    .sort((a, b) => a.kickoff_utc.localeCompare(b.kickoff_utc));
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-200 mb-2">Group {groupKey}</h3>
      <StandingsTable standings={standings} basePath={BASE} qualifySlots={2} highlightThird />
      <div className="mt-3 grid gap-2">
        {groupFixtures.map((f) => (
          <MatchCard key={f.match} fixture={f} results={results} basePath={BASE} />
        ))}
      </div>
    </div>
  );
}
