import { Link } from 'react-router-dom';
import { useTimezone } from '../lib/TimezoneContext';

interface SportTile {
  id: string;
  name: string;
  blurb: string;
  emoji: string;
  href?: string;
  status: 'live' | 'soon';
  color: string;
}

const SPORTS: SportTile[] = [
  {
    id: 'fifa-2026',
    name: 'FIFA World Cup 2026',
    blurb: 'United 2026 — USA, Canada & Mexico. 48 teams, 104 matches.',
    emoji: '\u26BD\uFE0F',
    href: '/football/fifa-2026',
    status: 'live',
    color: 'from-pitch-700 to-pitch-900',
  },
  { id: 'cricket', name: 'Cricket', blurb: 'IPL, ICC tournaments, internationals.', emoji: '\uD83C\uDFCF', status: 'soon', color: 'from-blue-700 to-blue-900' },
  { id: 'basketball', name: 'Basketball', blurb: 'NBA & FIBA tournaments.', emoji: '\uD83C\uDFC0', status: 'soon', color: 'from-orange-700 to-orange-900' },
  { id: 'hockey', name: 'Hockey', blurb: 'Field hockey & ice hockey.', emoji: '\uD83C\uDFD2', status: 'soon', color: 'from-cyan-700 to-cyan-900' },
  { id: 'olympics', name: 'Olympics', blurb: 'Summer & Winter games.', emoji: '\uD83C\uDFC5', status: 'soon', color: 'from-yellow-700 to-amber-900' },
];

export default function Landing() {
  const { abbr, label } = useTimezone();
  return (
    <div>
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-pitch-900/60 border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-pitch-400 font-semibold">
            Sports Tracker
          </p>
          <h1 className="mt-3 text-4xl sm:text-6xl font-bold leading-tight">
            Multi-sport scores
            <br />
            <span className="bg-gradient-to-r from-pitch-400 to-pitch-600 bg-clip-text text-transparent">
              in your timezone
            </span>
          </h1>
          <p className="mt-5 text-slate-400 max-w-xl mx-auto">
            Fixtures, live standings, and brackets — automatically converted to{' '}
            <strong className="text-slate-200" title={label}>{abbr}</strong>{' '}
            so you never have to do timezone math again. Launching with the{' '}
            <strong className="text-slate-200">FIFA World Cup 2026</strong>.
          </p>
          <div className="mt-7 flex justify-center gap-3 flex-wrap">
            <Link
              to="/football/fifa-2026"
              className="inline-flex items-center gap-2 rounded-full bg-pitch-600 hover:bg-pitch-500 transition px-5 py-2.5 text-sm font-semibold text-white"
            >
              <span aria-hidden>{'\u26BD\uFE0F'}</span>&nbsp;Open World Cup 2026
              <span aria-hidden>→</span>
            </Link>
            <a
              href="#sports"
              className="inline-flex items-center gap-2 rounded-full ring-1 ring-slate-700 hover:ring-slate-500 transition px-5 py-2.5 text-sm text-slate-200"
            >
              Browse all sports
            </a>
          </div>
        </div>
      </section>

      <section id="sports" className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-xl sm:text-2xl font-bold mb-6">Sports</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SPORTS.map((s) => {
            const inner = (
              <div
                className={`relative h-full rounded-2xl bg-gradient-to-br ${s.color} ring-1 ring-slate-800 p-6 overflow-hidden ${
                  s.status === 'soon' ? 'opacity-60' : 'hover:ring-pitch-500 transition'
                }`}
              >
                <div className="text-5xl mb-3" aria-hidden>{s.emoji}</div>
                <h3 className="text-lg font-semibold">{s.name}</h3>
                <p className="text-sm text-slate-300 mt-1">{s.blurb}</p>
                <div className="mt-4">
                  {s.status === 'live' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-pitch-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-pitch-300 animate-pulse" />
                      Available now
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Coming soon</span>
                  )}
                </div>
              </div>
            );
            return s.href && s.status === 'live' ? (
              <Link key={s.id} to={s.href} className="block h-full">{inner}</Link>
            ) : (
              <div key={s.id} className="h-full" aria-disabled="true">{inner}</div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20">
        <h2 className="text-lg font-semibold mb-3">Pick your timezone</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Most international scoreboards default to UTC or local stadium time, leaving
          fans abroad to do mental arithmetic. Sports Tracker auto-detects your
          timezone (currently <strong className="text-slate-200" title={label}>{abbr}</strong>)
          and bakes the conversion into every fixture, standing, and bracket. Use the
          globe button in the top bar to switch — your choice is remembered on this
          device. The host city's local kickoff is shown as secondary info, never as
          the headline time.
        </p>
        <h2 className="text-lg font-semibold mt-6 mb-3">How it stays up to date</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          A scheduled GitHub Action scrapes Wikipedia every 30 minutes during the tournament window
          and commits new results back into the repo. The site is fully static — hosted free on
          GitHub Pages — so it stays fast and there's nothing to maintain.
        </p>
      </section>
    </div>
  );
}
