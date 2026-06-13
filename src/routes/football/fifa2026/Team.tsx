import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  fixtures,
  results,
  groups,
  teamFromSlug,
  canonicalTeam,
  teamGroup,
} from '../../../data/fifa2026';
import { computeAllStandings } from '../../../lib/standings';
import { resolveBracket } from '../../../lib/bracket';
import TeamBadge from '../../../components/shared/TeamBadge';
import StandingsTable from '../../../components/shared/StandingsTable';
import ScheduleTable from '../../../components/shared/ScheduleTable';

const BASE = '/football/fifa-2026';

export default function Team() {
  const { slug = '' } = useParams();
  const team = teamFromSlug(slug);

  const standings = useMemo(
    () => computeAllStandings(groups, fixtures, results),
    [],
  );
  const resolved = useMemo(
    () => resolveBracket(fixtures, results, standings),
    [standings],
  );

  if (!team) {
    return (
      <div className="rounded-xl bg-slate-900/40 ring-1 ring-slate-800 p-8 text-center">
        <p className="text-slate-300 font-semibold">Team not found</p>
        <p className="text-slate-500 text-sm mt-1">The slug <code>{slug}</code> doesn't match any team.</p>
        <Link to={`${BASE}/teams`} className="text-pitch-400 hover:underline text-sm mt-3 inline-block">
          ← Back to all teams
        </Link>
      </div>
    );
  }

  const groupKey = teamGroup(team);
  const groupStandings = groupKey ? standings[groupKey] : [];

  const teamFixtures = fixtures.filter((f) => {
    if (canonicalTeam(f.home) === team || canonicalTeam(f.away) === team) return true;
    const r = resolved.get(f.match);
    return r?.homeTeam === team || r?.awayTeam === team;
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link to={`${BASE}/teams`} className="text-xs text-slate-400 hover:text-slate-200">
            ← All teams
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <TeamBadge team={team} size="lg" showName={false} />
            <h2 className="text-2xl font-bold">{team}</h2>
          </div>
          {groupKey && (
            <p className="text-sm text-slate-400 mt-1">
              Group {groupKey} ·{' '}
              {groupStandings.find((s) => s.team === team)?.played ?? 0} played
            </p>
          )}
        </div>
      </header>

      {groupKey && groupStandings.length > 0 && (
        <section>
          <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-2">Group {groupKey}</h3>
          <StandingsTable standings={groupStandings} basePath={BASE} qualifySlots={2} />
        </section>
      )}

      <section>
        <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-2">All matches</h3>
        <ScheduleTable
          fixtures={teamFixtures}
          results={results}
          basePath={BASE}
          resolved={resolved}
          groupBy="date"
          emptyMessage="No matches yet — knockout fixtures will appear once this team qualifies."
        />
      </section>
    </div>
  );
}
