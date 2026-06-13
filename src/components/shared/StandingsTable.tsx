import { Link } from 'react-router-dom';
import type { Standing } from '../../lib/types';
import TeamBadge from './TeamBadge';
import { teamSlug } from '../../data/fifa2026';

interface Props {
  standings: Standing[];
  basePath: string;
  /** How many top positions to highlight as "qualified" (2 for groups). */
  qualifySlots?: number;
  /** Mark 3rd place specially (FIFA 2026: best 8 of 12 advance). */
  highlightThird?: boolean;
}

export default function StandingsTable({
  standings,
  basePath,
  qualifySlots = 2,
  highlightThird = true,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-900/80 text-slate-400">
          <tr>
            <th className="px-2 py-2 text-left w-8">#</th>
            <th className="px-2 py-2 text-left">Team</th>
            <th className="px-2 py-2 text-center w-8" title="Played">P</th>
            <th className="px-2 py-2 text-center w-8 hidden sm:table-cell" title="Won">W</th>
            <th className="px-2 py-2 text-center w-8 hidden sm:table-cell" title="Drawn">D</th>
            <th className="px-2 py-2 text-center w-8 hidden sm:table-cell" title="Lost">L</th>
            <th className="px-2 py-2 text-center w-10" title="Goals For">GF</th>
            <th className="px-2 py-2 text-center w-10" title="Goals Against">GA</th>
            <th className="px-2 py-2 text-center w-10" title="Goal Difference">GD</th>
            <th className="px-2 py-2 text-center w-10 font-bold text-slate-200" title="Points">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s) => {
            const qualified = s.position <= qualifySlots;
            const third = highlightThird && s.position === 3;
            const rowCls = qualified
              ? 'bg-pitch-900/30'
              : third
                ? 'bg-amber-950/30'
                : '';
            const dotCls = qualified
              ? 'bg-pitch-500'
              : third
                ? 'bg-amber-400'
                : 'bg-slate-700';
            return (
              <tr key={s.team} className={`border-t border-slate-800 ${rowCls}`}>
                <td className="px-2 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`inline-block w-1.5 h-4 rounded-sm ${dotCls}`} />
                    <span className="tabular-nums">{s.position}</span>
                  </span>
                </td>
                <td className="px-2 py-2">
                  <Link
                    to={`${basePath}/team/${teamSlug(s.team)}`}
                    className="hover:text-pitch-500"
                  >
                    <TeamBadge team={s.team} size="sm" />
                  </Link>
                </td>
                <td className="px-2 py-2 text-center tabular-nums">{s.played}</td>
                <td className="px-2 py-2 text-center tabular-nums hidden sm:table-cell">{s.won}</td>
                <td className="px-2 py-2 text-center tabular-nums hidden sm:table-cell">{s.drawn}</td>
                <td className="px-2 py-2 text-center tabular-nums hidden sm:table-cell">{s.lost}</td>
                <td className="px-2 py-2 text-center tabular-nums">{s.gf}</td>
                <td className="px-2 py-2 text-center tabular-nums">{s.ga}</td>
                <td className="px-2 py-2 text-center tabular-nums">
                  {s.gd > 0 ? `+${s.gd}` : s.gd}
                </td>
                <td className="px-2 py-2 text-center tabular-nums font-bold text-slate-100">
                  {s.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
