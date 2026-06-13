import { useMemo, useState } from 'react';
import { fixtures, results, groups, canonicalTeam } from '../../../data/fifa2026';
import ScheduleTable from '../../../components/shared/ScheduleTable';
import MatchCard from '../../../components/shared/MatchCard';
import { computeAllStandings } from '../../../lib/standings';
import { resolveBracket } from '../../../lib/bracket';
import { todayISTKey, istDateKey, relative } from '../../../lib/time';
import type { Fixture, GroupKey } from '../../../lib/types';

const BASE = '/football/fifa-2026';

type StageFilter = 'all' | 'group' | 'knockout';
type DateFilter = 'today' | 'upcoming' | 'past' | 'all';

export default function Fixtures() {
  const [stage, setStage] = useState<StageFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('upcoming');
  const [groupFilter, setGroupFilter] = useState<GroupKey | 'all'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  const standings = useMemo(
    () => computeAllStandings(groups, fixtures, results),
    [],
  );
  const resolved = useMemo(
    () => resolveBracket(fixtures, results, standings),
    [standings],
  );

  const allTeams = useMemo(() => {
    const set = new Set<string>();
    Object.values(groups).forEach((arr) => arr.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    const today = todayISTKey();
    const nowIso = new Date().toISOString();
    return fixtures.filter((f) => {
      if (stage === 'group' && f.stage !== 'group') return false;
      if (stage === 'knockout' && f.stage === 'group') return false;

      if (dateFilter !== 'all') {
        const k = istDateKey(f.kickoff_ist);
        if (dateFilter === 'today' && k !== today) return false;
        if (dateFilter === 'upcoming' && f.kickoff_utc < nowIso && f.status !== 'live') return false;
        if (dateFilter === 'past' && f.kickoff_utc >= nowIso) return false;
      }

      if (groupFilter !== 'all' && f.group !== groupFilter) return false;

      if (teamFilter !== 'all') {
        const r = resolved.get(f.match);
        const home = r?.homeTeam ?? canonicalTeam(f.home);
        const away = r?.awayTeam ?? canonicalTeam(f.away);
        if (home !== teamFilter && away !== teamFilter) return false;
      }
      return true;
    });
  }, [stage, dateFilter, groupFilter, teamFilter, resolved]);

  const nextMatch = useMemo<Fixture | null>(() => {
    const nowIso = new Date().toISOString();
    return (
      fixtures
        .filter((f) => f.kickoff_utc >= nowIso)
        .sort((a, b) => a.kickoff_utc.localeCompare(b.kickoff_utc))[0] ?? null
    );
  }, []);

  return (
    <div className="space-y-6">
      {nextMatch && (
        <section>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-sm uppercase tracking-wider text-slate-400">Next match</h2>
            <span className="text-xs text-pitch-400">{relative(nextMatch.kickoff_utc)}</span>
          </div>
          <MatchCard
            fixture={nextMatch}
            results={results}
            basePath={BASE}
            homeTeamOverride={resolved.get(nextMatch.match)?.homeTeam ?? null}
            awayTeamOverride={resolved.get(nextMatch.match)?.awayTeam ?? null}
          />
        </section>
      )}

      <section className="rounded-xl bg-slate-900/40 ring-1 ring-slate-800 p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <Select
            label="When"
            value={dateFilter}
            onChange={(v) => setDateFilter(v as DateFilter)}
            options={[
              { v: 'upcoming', l: 'Upcoming' },
              { v: 'today', l: 'Today (IST)' },
              { v: 'past', l: 'Past' },
              { v: 'all', l: 'All' },
            ]}
          />
          <Select
            label="Stage"
            value={stage}
            onChange={(v) => setStage(v as StageFilter)}
            options={[
              { v: 'all', l: 'All stages' },
              { v: 'group', l: 'Group stage' },
              { v: 'knockout', l: 'Knockouts' },
            ]}
          />
          <Select
            label="Group"
            value={groupFilter}
            onChange={(v) => setGroupFilter(v as GroupKey | 'all')}
            options={[
              { v: 'all', l: 'All groups' },
              ...(Object.keys(groups) as GroupKey[]).map((g) => ({ v: g, l: `Group ${g}` })),
            ]}
          />
          <Select
            label="Team"
            value={teamFilter}
            onChange={setTeamFilter}
            options={[
              { v: 'all', l: 'All teams' },
              ...allTeams.map((t) => ({ v: t, l: t })),
            ]}
          />
        </div>
      </section>

      <ScheduleTable
        fixtures={filtered}
        results={results}
        basePath={BASE}
        resolved={resolved}
        emptyMessage="No matches match these filters."
      />
    </div>
  );
}

function Select<T extends string>({
  label, value, onChange, options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Array<{ v: T; l: string }>;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pitch-600"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </label>
  );
}
