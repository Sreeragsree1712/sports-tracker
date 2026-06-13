import { useMemo, useState } from 'react';
import { fixtures, results, groups, canonicalTeam } from '../../../data/fifa2026';
import ScheduleTable from '../../../components/shared/ScheduleTable';
import MatchCard from '../../../components/shared/MatchCard';
import LivePill from '../../../components/shared/LivePill';
import { computeAllStandings } from '../../../lib/standings';
import { resolveBracket } from '../../../lib/bracket';
import { todayKey, dateKey, relative } from '../../../lib/time';
import { isLive, useNow } from '../../../lib/live';
import { useTimezone } from '../../../lib/TimezoneContext';
import type { Fixture, GroupKey } from '../../../lib/types';

const BASE = '/football/fifa-2026';

type StageFilter = 'all' | 'group' | 'knockout';
type DateFilter = 'today' | 'upcoming' | 'past' | 'all';

export default function Fixtures() {
  const [stage, setStage] = useState<StageFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('upcoming');
  const [groupFilter, setGroupFilter] = useState<GroupKey | 'all'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const { tz, abbr } = useTimezone();
  const now = useNow();

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

  const liveMatches = useMemo(
    () =>
      fixtures
        .filter((f) => isLive(f, results, now))
        .sort((a, b) => a.kickoff_utc.localeCompare(b.kickoff_utc)),
    [now],
  );
  const liveMatchIds = useMemo(() => new Set(liveMatches.map((f) => f.match)), [liveMatches]);

  const filtered = useMemo(() => {
    const today = todayKey(tz);
    const nowIso = now.toISOString();
    const list = fixtures.filter((f) => {
      if (stage === 'group' && f.stage !== 'group') return false;
      if (stage === 'knockout' && f.stage === 'group') return false;

      const matchIsLive = liveMatchIds.has(f.match);

      if (dateFilter !== 'all') {
        const k = dateKey(f.kickoff_ist, tz);
        if (dateFilter === 'today' && k !== today) return false;
        // Live matches are always included in the "Upcoming" view so users
        // landing on the page during a kickoff window see what's on right now.
        if (dateFilter === 'upcoming' && f.kickoff_utc < nowIso && !matchIsLive) return false;
        if (dateFilter === 'past' && f.kickoff_utc >= nowIso) return false;
        if (dateFilter === 'past' && matchIsLive) return false;
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

    // Sort: live first (by kickoff asc), then everything else by kickoff asc.
    return list.sort((a, b) => {
      const aLive = liveMatchIds.has(a.match) ? 0 : 1;
      const bLive = liveMatchIds.has(b.match) ? 0 : 1;
      if (aLive !== bLive) return aLive - bLive;
      return a.kickoff_utc.localeCompare(b.kickoff_utc);
    });
  }, [stage, dateFilter, groupFilter, teamFilter, resolved, tz, now, liveMatchIds]);

  const nextMatch = useMemo<Fixture | null>(() => {
    const nowIso = now.toISOString();
    return (
      fixtures
        .filter((f) => f.kickoff_utc >= nowIso)
        .sort((a, b) => a.kickoff_utc.localeCompare(b.kickoff_utc))[0] ?? null
    );
  }, [now]);

  const hasLive = liveMatches.length > 0;

  return (
    <div className="space-y-6">
      {hasLive && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm uppercase tracking-wider text-red-300">
              {liveMatches.length === 1 ? 'Live now' : `Live now · ${liveMatches.length} matches`}
            </h2>
            <LivePill fixture={liveMatches[0]} size="sm" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {liveMatches.map((f) => (
              <MatchCard
                key={f.match}
                fixture={f}
                results={results}
                basePath={BASE}
                homeTeamOverride={resolved.get(f.match)?.homeTeam ?? null}
                awayTeamOverride={resolved.get(f.match)?.awayTeam ?? null}
              />
            ))}
          </div>
        </section>
      )}

      {!hasLive && nextMatch && (
        <section>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-sm uppercase tracking-wider text-slate-400">Next match</h2>
            <span className="text-xs text-pitch-400">{relative(nextMatch.kickoff_utc, now)}</span>
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
              { v: 'upcoming', l: hasLive ? `Upcoming + Live` : 'Upcoming' },
              { v: 'today', l: `Today (${abbr})` },
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
