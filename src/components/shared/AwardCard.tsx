import { Link } from 'react-router-dom';
import TeamBadge from './TeamBadge';
import MedalIcon from './MedalIcon';
import { teamSlug, canonicalTeam, groups } from '../../data/fifa2026';
import type { ScorerRow } from '../../lib/topScorers';

const BASE = '/football/fifa-2026';

type Variant = 'gold' | 'silver' | 'bronze' | 'sky' | 'emerald' | 'pitch';
type Glyph = 'ball' | 'boot' | 'glove' | 'star' | 'shield';

interface PlayerCardProps {
  variant: 'card';
  label: string;
  description: string;
  medal: Variant;
  glyph: Glyph;
  player?: string | null;
  team?: string | null;
  note?: string | null;
  /** Optional list of tied winners (for Boots when multiple players share goals). */
  tied?: ScorerRow[] | null;
  /** Right-rail stat (e.g. "8 goals" for Boots). */
  stat?: string | null;
}

interface TeamCardProps {
  variant: 'team';
  label: string;
  description: string;
  medal: Variant;
  glyph: Glyph;
  team?: string | null;
  note?: string | null;
}

type Props = PlayerCardProps | TeamCardProps;

function isKnownTeam(name: string): boolean {
  const c = canonicalTeam(name);
  return Object.values(groups).some((members) => (members as string[]).includes(c));
}

export default function AwardCard(props: Props) {
  const accentRing =
    props.medal === 'gold'
      ? 'ring-yellow-400/30 hover:ring-yellow-400/60'
      : props.medal === 'silver'
        ? 'ring-slate-400/30 hover:ring-slate-300/60'
        : props.medal === 'bronze'
          ? 'ring-amber-700/40 hover:ring-amber-600/70'
          : props.medal === 'sky'
            ? 'ring-sky-500/30 hover:ring-sky-400/60'
            : props.medal === 'emerald'
              ? 'ring-emerald-500/30 hover:ring-emerald-400/60'
              : 'ring-pitch-600/30 hover:ring-pitch-500/60';

  const tint =
    props.medal === 'gold'
      ? 'from-yellow-500/[0.07]'
      : props.medal === 'silver'
        ? 'from-slate-300/[0.05]'
        : props.medal === 'bronze'
          ? 'from-amber-700/[0.06]'
          : props.medal === 'sky'
            ? 'from-sky-500/[0.06]'
            : props.medal === 'emerald'
              ? 'from-emerald-500/[0.06]'
              : 'from-pitch-600/[0.07]';

  return (
    <div
      className={`relative rounded-xl bg-gradient-to-b ${tint} to-slate-900/40 ring-1 ${accentRing} p-4 transition`}
    >
      <div className="flex items-start gap-3 mb-3">
        <MedalIcon variant={props.medal} glyph={props.glyph} className="w-12 h-12 shrink-0" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-100 leading-tight">{props.label}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">{props.description}</p>
        </div>
      </div>

      {props.variant === 'card' ? (
        <PlayerBody
          player={props.player}
          team={props.team}
          note={props.note}
          tied={props.tied}
          stat={props.stat}
        />
      ) : (
        <TeamBody team={props.team} note={props.note} />
      )}
    </div>
  );
}

function PlayerBody({
  player,
  team,
  note,
  tied,
  stat,
}: Pick<PlayerCardProps, 'player' | 'team' | 'note' | 'tied' | 'stat'>) {
  // Boot tier is empty (e.g. Bronze when only 2 distinct goal counts exist).
  // We use an empty-but-defined tied array (length 0) as the signal that this
  // is "no winner yet *because the data isn't there*", distinct from the
  // manual-award case ("To be announced") below.
  if (tied !== undefined && tied !== null && tied.length === 0) {
    return (
      <div className="text-sm text-slate-500 italic mt-1">
        Awaiting more goals
      </div>
    );
  }

  if (tied && tied.length > 1) {
    const MAX_INLINE = 3;
    const visible = tied.slice(0, MAX_INLINE);
    const overflow = tied.length - visible.length;
    const goals = tied[0].goals;
    return (
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-slate-500">
            {tied.length} tied on
          </span>
          <span className="text-lg font-bold text-pitch-400 tabular-nums">{goals}</span>
        </div>
        <div className="space-y-1">
          {visible.map((r) => {
            const c = canonicalTeam(r.team);
            return (
              <Link
                key={`${r.team}|${r.player}`}
                to={`${BASE}/team/${teamSlug(c)}`}
                className="flex items-center gap-1.5 text-sm hover:text-pitch-400 truncate"
              >
                <TeamBadge team={c} size="sm" />
                <span className="truncate font-medium">{r.player}</span>
                {r.penalties ? (
                  <span className="text-[10px] text-slate-500 shrink-0">{r.penalties}P</span>
                ) : null}
              </Link>
            );
          })}
          {overflow > 0 && (
            <p className="text-[11px] text-slate-500 italic mt-1">
              +{overflow} more (see leaderboard)
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!player || !team) {
    return (
      <div className="text-sm text-slate-500 italic mt-1">
        To be announced
      </div>
    );
  }

  const c = canonicalTeam(team);
  const known = isKnownTeam(c);
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-base font-bold text-slate-100 truncate">{player}</p>
        {known ? (
          <Link to={`${BASE}/team/${teamSlug(c)}`} className="hover:text-pitch-400 inline-flex items-center mt-0.5">
            <TeamBadge team={c} size="sm" />
          </Link>
        ) : (
          <span className="text-xs text-slate-400 mt-0.5">{team}</span>
        )}
        {note && <p className="text-[11px] text-slate-500 mt-1.5">{note}</p>}
      </div>
      {stat && (
        <div className="text-right shrink-0">
          <span className="text-lg font-bold text-pitch-400 tabular-nums">{stat}</span>
        </div>
      )}
    </div>
  );
}

function TeamBody({ team, note }: { team?: string | null; note?: string | null }) {
  if (!team) {
    return (
      <div className="text-sm text-slate-500 italic mt-1">
        To be announced
      </div>
    );
  }
  const c = canonicalTeam(team);
  const known = isKnownTeam(c);
  return (
    <div className="space-y-1">
      {known ? (
        <Link to={`${BASE}/team/${teamSlug(c)}`} className="hover:text-pitch-400 inline-flex items-center">
          <TeamBadge team={c} size="md" showName />
        </Link>
      ) : (
        <span className="text-base font-bold text-slate-100">{team}</span>
      )}
      {note && <p className="text-[11px] text-slate-500">{note}</p>}
    </div>
  );
}
