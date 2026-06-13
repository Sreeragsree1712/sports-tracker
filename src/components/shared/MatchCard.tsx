import { Link } from 'react-router-dom';
import type { Fixture, ResultsMap } from '../../lib/types';
import TeamBadge from './TeamBadge';
import DateChip from './DateChip';
import { formatLocalWithOffset, relative } from '../../lib/time';
import { teamSlug, canonicalTeam } from '../../data/fifa2026';

interface Props {
  fixture: Fixture;
  results: ResultsMap;
  /** Base path used to build team links, e.g. "/football/fifa-2026" */
  basePath: string;
  homeTeamOverride?: string | null;
  awayTeamOverride?: string | null;
}

const STAGE_LABEL: Record<Fixture['stage'], string> = {
  'group': 'Group',
  'round-of-32': 'Round of 32',
  'round-of-16': 'Round of 16',
  'quarter-final': 'Quarter-final',
  'semi-final': 'Semi-final',
  'third-place': '3rd-place play-off',
  'final': 'Final',
};

const STAGE_BADGE: Record<Fixture['stage'], string> = {
  'group': 'bg-slate-700 text-slate-200',
  'round-of-32': 'bg-blue-900/60 text-blue-200',
  'round-of-16': 'bg-indigo-900/60 text-indigo-200',
  'quarter-final': 'bg-purple-900/60 text-purple-200',
  'semi-final': 'bg-fuchsia-900/60 text-fuchsia-200',
  'third-place': 'bg-amber-900/60 text-amber-200',
  'final': 'bg-yellow-500/20 text-yellow-200 ring-1 ring-yellow-400/40',
};

export default function MatchCard({
  fixture: f,
  results,
  basePath,
  homeTeamOverride,
  awayTeamOverride,
}: Props) {
  const r = results[String(f.match)];
  const finished = r?.status === 'finished' || (f.score && f.status === 'finished');
  const score = r?.status === 'finished' ? r : (f.score && f.status === 'finished' ? f.score : null);

  const homeName = homeTeamOverride ?? f.home;
  const awayName = awayTeamOverride ?? f.away;
  const homeIsReal = homeTeamOverride != null || !/winner|runner|group [A-L]|3rd|best/i.test(f.home);
  const awayIsReal = awayTeamOverride != null || !/winner|runner|group [A-L]|3rd|best/i.test(f.away);

  const homeContent = (
    <TeamBadge team={homeName} size="md" />
  );
  const awayContent = (
    <TeamBadge team={awayName} size="md" />
  );

  const stageLabel =
    f.stage === 'group' && f.group
      ? `Group ${f.group}`
      : STAGE_LABEL[f.stage];

  return (
    <div className="rounded-xl bg-slate-900/60 ring-1 ring-slate-800 p-4 hover:ring-pitch-600/50 transition">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${STAGE_BADGE[f.stage]}`}>
            {stageLabel}
          </span>
          <span className="text-[10px] text-slate-500">#{f.match}</span>
        </div>
        <DateChip iso={f.kickoff_ist} />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-right">
          {homeIsReal ? (
            <Link
              to={`${basePath}/team/${teamSlug(canonicalTeam(homeName))}`}
              className="hover:text-pitch-500 inline-flex flex-row-reverse items-center gap-1.5"
            >
              <TeamBadge team={homeName} size="md" showName />
            </Link>
          ) : (
            <span className="inline-flex flex-row-reverse items-center gap-1.5">{homeContent}</span>
          )}
        </div>

        <div className="min-w-[64px] text-center">
          {finished && score ? (
            <div className="text-xl font-bold tabular-nums">
              {score.home} <span className="text-slate-500">–</span> {score.away}
              {('pens' in score) && score.pens && (
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                  pens {score.pens.home}–{score.pens.away}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-slate-400">vs</div>
          )}
        </div>

        <div className="text-left">
          {awayIsReal ? (
            <Link
              to={`${basePath}/team/${teamSlug(canonicalTeam(awayName))}`}
              className="hover:text-pitch-500 inline-flex items-center gap-1.5"
            >
              <TeamBadge team={awayName} size="md" showName />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5">{awayContent}</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span>{f.venue} · {f.city}</span>
        <span>
          {finished
            ? <span className="text-pitch-500 font-medium">FT</span>
            : <>local {formatLocalWithOffset(f.kickoff_local, f.tz_offset_hours)} · {relative(f.kickoff_utc)}</>}
        </span>
      </div>
    </div>
  );
}
