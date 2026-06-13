import { NavLink, Outlet } from 'react-router-dom';
import { useTimezone } from '../../../lib/TimezoneContext';

const tabs = [
  { to: '', label: 'Fixtures', end: true },
  { to: 'groups', label: 'Groups' },
  { to: 'bracket', label: 'Bracket' },
  { to: 'top-scorers', label: 'Top scorers' },
  { to: 'teams', label: 'Teams' },
];

export default function FifaLayout() {
  const { abbr, label } = useTimezone();
  return (
    <div>
      <header className="bg-gradient-to-br from-pitch-900 via-slate-900 to-slate-950 border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-pitch-400 font-semibold">
                FIFA World Cup
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">
                United 2026 — USA · Canada · Mexico
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                104 matches · 48 teams · 12 groups · 16 host cities
              </p>
            </div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-pitch-900/60 ring-1 ring-pitch-700 px-3 py-1 text-xs"
              title={`Times shown in ${label}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-pitch-400" />
              All times in {abbr}
            </span>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-4">
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `px-4 py-2.5 text-sm border-b-2 whitespace-nowrap transition ${
                    isActive
                      ? 'border-pitch-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
