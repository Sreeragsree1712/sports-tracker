import { useMemo } from 'react';
import type { Fixture, ResultsMap } from '../../lib/types';
import MatchCard from './MatchCard';
import { dateKey, formatDateLong } from '../../lib/time';
import { useTimezone } from '../../lib/TimezoneContext';

interface Props {
  fixtures: Fixture[];
  results: ResultsMap;
  basePath: string;
  groupBy?: 'date' | 'none';
  resolved?: Map<number, { homeTeam: string | null; awayTeam: string | null }>;
  emptyMessage?: string;
}

export default function ScheduleTable({
  fixtures,
  results,
  basePath,
  groupBy = 'date',
  resolved,
  emptyMessage = 'No matches.',
}: Props) {
  const { tz } = useTimezone();
  const grouped = useMemo(() => {
    if (groupBy !== 'date') return [{ key: 'all', label: '', items: fixtures }];
    const map = new Map<string, Fixture[]>();
    for (const f of fixtures) {
      const key = dateKey(f.kickoff_ist, tz);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    }
    const keys = Array.from(map.keys()).sort();
    return keys.map((k) => ({
      key: k,
      label: formatDateLong(map.get(k)![0].kickoff_ist, tz),
      items: map.get(k)!.sort((a, b) => a.kickoff_utc.localeCompare(b.kickoff_utc)),
    }));
  }, [fixtures, groupBy, tz]);

  if (fixtures.length === 0) {
    return (
      <div className="rounded-xl bg-slate-900/40 ring-1 ring-slate-800 p-8 text-center text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map((g) => (
        <section key={g.key}>
          {g.label && (
            <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2 sticky top-14 bg-slate-950/80 backdrop-blur py-1 z-10">
              {g.label}
            </h3>
          )}
          <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
            {g.items.map((f) => {
              const ov = resolved?.get(f.match);
              return (
                <MatchCard
                  key={f.match}
                  fixture={f}
                  results={results}
                  basePath={basePath}
                  homeTeamOverride={ov?.homeTeam}
                  awayTeamOverride={ov?.awayTeam}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
