import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { results, fixtures, awards, teamSlug, canonicalTeam } from '../../../data/fifa2026';
import { computeTopScorers, totalGoals } from '../../../lib/topScorers';
import { computeBoots } from '../../../lib/awards';
import TeamBadge from '../../../components/shared/TeamBadge';
import AwardCard from '../../../components/shared/AwardCard';
import type { ScorerRow } from '../../../lib/topScorers';

const BASE = '/football/fifa-2026';

export default function Awards() {
  const ranked = useMemo(() => computeTopScorers(results), []);
  const boots = useMemo(() => computeBoots(results), []);
  const total = useMemo(() => totalGoals(results), []);
  const playedMatches = useMemo(
    () => Object.values(results).filter((r) => r.status === 'finished').length,
    [],
  );
  const totalMatches = fixtures.length;

  const bootByTier = new Map(boots.map((b) => [b.tier, b.rows]));
  const tournamentOver = playedMatches === totalMatches;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <header>
        <h2 className="text-xl font-bold">Player awards</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Boot trio is computed live from match goal scorers. Other awards are
          announced by FIFA after the final and added by hand —
          {tournamentOver
            ? ' all winners shown.'
            : ' marked "to be announced" until then.'}
        </p>
      </header>

      {/* BALL TRIO */}
      <section>
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-semibold mb-3">
          Best player · Adidas Golden Ball
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <AwardCard
            variant="card"
            label="Golden Ball"
            description="Best player of the tournament"
            medal="gold"
            glyph="ball"
            player={awards.goldenBall?.player ?? null}
            team={awards.goldenBall?.team ?? null}
            note={awards.goldenBall?.note ?? null}
          />
          <AwardCard
            variant="card"
            label="Silver Ball"
            description="Second-best player"
            medal="silver"
            glyph="ball"
            player={awards.silverBall?.player ?? null}
            team={awards.silverBall?.team ?? null}
            note={awards.silverBall?.note ?? null}
          />
          <AwardCard
            variant="card"
            label="Bronze Ball"
            description="Third-best player"
            medal="bronze"
            glyph="ball"
            player={awards.bronzeBall?.player ?? null}
            team={awards.bronzeBall?.team ?? null}
            note={awards.bronzeBall?.note ?? null}
          />
        </div>
      </section>

      {/* BOOT TRIO */}
      <section>
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-semibold mb-3 flex items-center gap-2">
          Top scorer · Adidas Golden Boot
          <span className="text-slate-600 normal-case font-normal tracking-normal text-[10px]">
            · live · {playedMatches}/{totalMatches} matches played
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <BootCard tier="gold" label="Golden Boot" desc="Top goal scorer" rows={bootByTier.get('golden') ?? []} />
          <BootCard tier="silver" label="Silver Boot" desc="Second-most goals" rows={bootByTier.get('silver') ?? []} />
          <BootCard tier="bronze" label="Bronze Boot" desc="Third-most goals" rows={bootByTier.get('bronze') ?? []} />
        </div>
      </section>

      {/* OTHER AWARDS */}
      <section>
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-semibold mb-3">
          Specialist awards
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <AwardCard
            variant="card"
            label="Golden Glove"
            description="Best goalkeeper"
            medal="sky"
            glyph="glove"
            player={awards.goldenGlove?.player ?? null}
            team={awards.goldenGlove?.team ?? null}
            note={awards.goldenGlove?.note ?? null}
          />
          <AwardCard
            variant="card"
            label="Best Young Player"
            description="Outstanding U-21 player"
            medal="emerald"
            glyph="star"
            player={awards.bestYoungPlayer?.player ?? null}
            team={awards.bestYoungPlayer?.team ?? null}
            note={awards.bestYoungPlayer?.note ?? null}
          />
          <AwardCard
            variant="team"
            label="FIFA Fair Play Trophy"
            description="Best disciplinary record"
            medal="pitch"
            glyph="shield"
            team={awards.fairPlay?.team ?? null}
            note={awards.fairPlay?.note ?? null}
          />
        </div>
      </section>

      {/* FULL LEADERBOARD */}
      <Leaderboard ranked={ranked} total={total} playedMatches={playedMatches} totalMatches={totalMatches} />
    </div>
  );
}

interface BootCardProps {
  tier: 'gold' | 'silver' | 'bronze';
  label: string;
  desc: string;
  rows: ScorerRow[];
}

function BootCard({ tier, label, desc, rows }: BootCardProps) {
  const winner = rows[0];
  return (
    <AwardCard
      variant="card"
      label={label}
      description={desc}
      medal={tier}
      glyph="boot"
      player={winner?.player ?? null}
      team={winner?.team ?? null}
      tied={rows.length > 1 ? rows : rows.length === 0 ? [] : null}
      stat={winner ? `${winner.goals}` : null}
      note={
        winner && rows.length === 1
          ? `${winner.goals} goal${winner.goals === 1 ? '' : 's'} in ${winner.matches} match${winner.matches === 1 ? '' : 'es'}${winner.penalties ? ` · ${winner.penalties} pen.` : ''}`
          : null
      }
    />
  );
}

interface LeaderboardProps {
  ranked: ScorerRow[];
  total: number;
  playedMatches: number;
  totalMatches: number;
}

function Leaderboard({ ranked, total, playedMatches, totalMatches }: LeaderboardProps) {
  if (ranked.length === 0) {
    return (
      <div className="rounded-xl bg-slate-900/40 ring-1 ring-slate-800 p-6 text-center">
        <h3 className="text-sm font-semibold text-slate-200">Top scorer leaderboard</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
          The leaderboard will populate as goal scorers are scraped from match
          reports. {playedMatches}/{totalMatches} matches played so far.
        </p>
      </div>
    );
  }

  let lastGoals = -1;
  let displayRank = 0;
  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-200">Full leaderboard</h3>
        <p className="text-xs text-slate-400 tabular-nums">
          <span className="text-slate-200 font-semibold">{total}</span> goals across{' '}
          <span className="text-slate-200 font-semibold">{playedMatches}</span>/{totalMatches} matches
          {playedMatches > 0 && (
            <> · avg <span className="text-slate-200 font-semibold">{(total / playedMatches).toFixed(2)}</span>/match</>
          )}
        </p>
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
                    <Link to={`${BASE}/team/${slug}`} className="hover:text-pitch-500 inline-flex items-center">
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
    </section>
  );
}
