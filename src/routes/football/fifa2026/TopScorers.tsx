import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { results, fixtures, teamSlug, canonicalTeam } from '../../../data/fifa2026';
import { computeTopScorers, totalGoals } from '../../../lib/topScorers';
import TeamBadge from '../../../components/shared/TeamBadge';

const BASE = '/football/fifa-2026';

export default function TopScorers() {
  const ranked = useMemo(() => computeTopScorers(results), []);
  const total = useMemo(() => totalGoals(results), []);
  const playedMatches = useMemo(
    () => Object.values(results).filter((r) => r.status === 'finished').length,
    [],
  );
  const totalMatches = fixtures.length;

  if (ranked.length === 0) {
    return (
      <div className="rounded-xl bg-slate-900/40 ring-1 ring-slate-800 p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-200">Golden Boot · Top scorers</h2>
        <p className="text-sm text-slate-400 mt-3 max-w-md mx-auto">
          The leaderboard will populate as matches are played and the result
          scraper picks up goal scorers. Tournament hasn't started yet, or no
          goals have been recorded with named scorers.
        </p>
        <p className="text-xs text-slate-500 mt-3">
          {playedMatches}/{totalMatches} matches played
        </p>
      </div>
    );
  }

  // Bucket by goal count for "T-Nth" placement (shared rank for ties).
  let lastGoals = -1;
  let displayRank = 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Golden Boot race</h2>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated from match goal scorers · own goals excluded · live
            penalties included.
          </p>
        </div>
        <div className="text-xs text-slate-400 tabular-nums">
          <span className="text-slate-200 font-semibold">{total}</span> goals across{' '}
          <span className="text-slate-200 font-semibold">{playedMatches}</span>/{totalMatches} matches
          {playedMatches > 0 && (
            <> · avg <span className="text-slate-200 font-semibold">{(total / playedMatches).toFixed(2)}</span>/match</>
          )}
        </div>
      </header>

      <div className="overflow-x-auto rounded-xl ring-1 ring-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/80">
            <tr className="text-[10px] uppercase tracking-wider text-slate-400">
              <th className="text-left px-3 py-2">#</th>
              <th className="text-left px-3 py-2">Player</th>
              <th className="text-left px-3 py-2">Team</th>
              <th className="text-right px-3 py-2">Goals</th>
              <th className="text-right px-3 py-2 hidden sm:table-cell">Pen.</th>
              <th className="text-right px-3 py-2 hidden sm:table-cell">Apps</th>
              <th className="text-right px-3 py-2 hidden md:table-cell">Goals/match</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((row, idx) => {
              if (row.goals !== lastGoals) {
                displayRank = idx + 1;
                lastGoals = row.goals;
              }
              const tied = idx + 1 !== displayRank || ranked[idx + 1]?.goals === row.goals;
              const team = canonicalTeam(row.team);
              const slug = teamSlug(team);
              return (
                <tr
                  key={`${row.team}|${row.player}`}
                  className="odd:bg-slate-900/40 hover:bg-slate-800/60 transition border-t border-slate-800"
                >
                  <td className="px-3 py-2 text-slate-400 tabular-nums">
                    {tied ? `T-${displayRank}` : displayRank}
                  </td>
                  <td className="px-3 py-2 font-medium">{row.player}</td>
                  <td className="px-3 py-2">
                    <Link
                      to={`${BASE}/team/${slug}`}
                      className="hover:text-pitch-500 inline-flex items-center"
                    >
                      <TeamBadge team={team} size="sm" />
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold text-pitch-400">
                    {row.goals}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-400 hidden sm:table-cell">
                    {row.penalties || ''}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-400 hidden sm:table-cell">
                    {row.matches}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-400 hidden md:table-cell">
                    {(row.goals / row.matches).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
