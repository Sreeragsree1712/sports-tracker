import { Link } from 'react-router-dom';
import { groups, teamSlug } from '../../../data/fifa2026';
import TeamBadge from '../../../components/shared/TeamBadge';
import type { GroupKey } from '../../../lib/types';

const BASE = '/football/fifa-2026';

export default function Teams() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">All 48 teams</h2>
        <p className="text-xs text-slate-400 mt-1">Click a team to see their full schedule and current group position.</p>
      </div>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(Object.keys(groups) as GroupKey[]).map((g) => (
          <div key={g}>
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Group {g}</h3>
            <ul className="rounded-xl bg-slate-900/40 ring-1 ring-slate-800 divide-y divide-slate-800">
              {groups[g].map((t) => (
                <li key={t}>
                  <Link
                    to={`${BASE}/team/${teamSlug(t)}`}
                    className="flex items-center justify-between px-3 py-2 hover:bg-slate-800/50 transition"
                  >
                    <TeamBadge team={t} size="sm" />
                    <span className="text-slate-500 text-xs">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
