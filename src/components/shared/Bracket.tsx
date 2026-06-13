import type { Fixture, ResultsMap } from '../../lib/types';
import type { ResolvedKoMatch } from '../../lib/bracket';
import TeamBadge from './TeamBadge';
import { formatDate, formatTime } from '../../lib/time';
import { useTimezone } from '../../lib/TimezoneContext';

interface Props {
  fixtures: Fixture[];
  results: ResultsMap;
  resolved: Map<number, ResolvedKoMatch>;
}

interface Cell {
  match: number;
  pathway?: 1 | 2;
}

const PATHWAY_1 = {
  r32: [74, 77, 73, 75, 83, 84, 81, 82],
  r16: [89, 90, 93, 94],
  qf: [97, 98],
  sf: [101],
};

const PATHWAY_2 = {
  r32: [76, 78, 79, 80, 86, 88, 85, 87],
  r16: [91, 92, 95, 96],
  qf: [99, 100],
  sf: [102],
};

export default function Bracket({ fixtures, results, resolved }: Props) {
  const { tz } = useTimezone();
  const fixtureByMatch = new Map(fixtures.map((f) => [f.match, f]));

  const renderCell = (m: number) => {
    const f = fixtureByMatch.get(m);
    const res = resolved.get(m);
    if (!f) return null;

    const r = results[String(m)];
    const finished = r?.status === 'finished' || (f.score && f.status === 'finished');
    const score = r?.status === 'finished' ? r : (f.score && f.status === 'finished' ? f.score : null);

    const homeName = res?.homeTeam ?? res?.homeLabel ?? f.home;
    const awayName = res?.awayTeam ?? res?.awayLabel ?? f.away;
    const homeIsReal = res?.homeTeam != null;
    const awayIsReal = res?.awayTeam != null;

    const winner = finished && score
      ? (score.home > score.away
          ? 'home'
          : score.away > score.home
            ? 'away'
            : (('pens' in score && score.pens) ? (score.pens.home > score.pens.away ? 'home' : 'away') : null))
      : null;

    return (
      <div
        key={m}
        className="rounded-lg bg-slate-900/70 ring-1 ring-slate-800 p-2 text-xs w-44 shrink-0"
      >
        <div className="flex items-center justify-end text-[9px] uppercase tracking-wider text-slate-500 mb-1.5">
          <span>{formatDate(f.kickoff_ist, tz)} · {formatTime(f.kickoff_ist, tz)}</span>
        </div>

        <div className={`flex items-center justify-between py-1 ${winner === 'home' ? 'text-pitch-400 font-semibold' : winner === 'away' ? 'text-slate-500' : ''}`}>
          <div className="truncate flex-1">
            {homeIsReal ? (
              <TeamBadge team={homeName} size="sm" />
            ) : (
              <span className="italic text-slate-400">{homeName}</span>
            )}
          </div>
          {finished && score && (
            <span className="tabular-nums font-bold ml-1">{score.home}</span>
          )}
        </div>

        <div className={`flex items-center justify-between py-1 border-t border-slate-800 ${winner === 'away' ? 'text-pitch-400 font-semibold' : winner === 'home' ? 'text-slate-500' : ''}`}>
          <div className="truncate flex-1">
            {awayIsReal ? (
              <TeamBadge team={awayName} size="sm" />
            ) : (
              <span className="italic text-slate-400">{awayName}</span>
            )}
          </div>
          {finished && score && (
            <span className="tabular-nums font-bold ml-1">{score.away}</span>
          )}
        </div>

        {finished && score?.pens ? (
          <div className="text-[9px] text-slate-500 mt-1 text-right">
            pens {score.pens.home}–{score.pens.away}
          </div>
        ) : finished && score && 'aet' in score && score.aet ? (
          <div className="text-[9px] text-amber-400/70 mt-1 text-right uppercase tracking-wider">
            after extra time
          </div>
        ) : null}
      </div>
    );
  };

  const renderColumn = (title: string, matches: number[]) => (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 sticky top-0 bg-slate-950/90 backdrop-blur py-1 z-10">
        {title}
      </div>
      <div className="flex flex-col justify-around gap-3 flex-1">
        {matches.map(renderCell)}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Pathway 1 */}
      <section>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Pathway 1</h3>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-max">
            {renderColumn('Round of 32', PATHWAY_1.r32)}
            {renderColumn('Round of 16', PATHWAY_1.r16)}
            {renderColumn('Quarter-final', PATHWAY_1.qf)}
            {renderColumn('Semi-final', PATHWAY_1.sf)}
          </div>
        </div>
      </section>

      {/* Pathway 2 */}
      <section>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Pathway 2</h3>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-max">
            {renderColumn('Round of 32', PATHWAY_2.r32)}
            {renderColumn('Round of 16', PATHWAY_2.r16)}
            {renderColumn('Quarter-final', PATHWAY_2.qf)}
            {renderColumn('Semi-final', PATHWAY_2.sf)}
          </div>
        </div>
      </section>

      {/* Final & 3rd-place */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-yellow-300 mb-3">Final</h3>
          {renderCell(104)}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-amber-300 mb-3">3rd-place play-off</h3>
          {renderCell(103)}
        </div>
      </section>
    </div>
  );
}

// Cell type kept to silence TS unused-warning if exported elsewhere later.
export type { Cell };
