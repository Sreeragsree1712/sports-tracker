import { Link, Route, Routes } from 'react-router-dom';
import Landing from './routes/Landing';
import FifaLayout from './routes/football/fifa2026/Layout';
import Fixtures from './routes/football/fifa2026/Fixtures';
import Groups from './routes/football/fifa2026/Groups';
import Bracket from './routes/football/fifa2026/Bracket';
import Teams from './routes/football/fifa2026/Teams';
import Team from './routes/football/fifa2026/Team';
import TimezonePicker from './components/shared/TimezonePicker';
import { useTimezone } from './lib/TimezoneContext';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/football/fifa-2026" element={<FifaLayout />}>
            <Route index element={<Fixtures />} />
            <Route path="groups" element={<Groups />} />
            <Route path="bracket" element={<Bracket />} />
            <Route path="teams" element={<Teams />} />
            <Route path="team/:slug" element={<Team />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

function NavBar() {
  return (
    <nav className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur border-b border-slate-800">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <span className="inline-block w-7 h-7 rounded-full bg-pitch-600 ring-2 ring-pitch-500/40 grid place-items-center text-base">
            <span aria-hidden>{'\u26BD'}</span>
          </span>
          <span>Sports Tracker</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link
            to="/football/fifa-2026"
            className="px-3 py-1.5 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            FIFA 2026
          </Link>
          <TimezonePicker variant="compact" />
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-md text-slate-400 hover:text-white transition hidden sm:inline"
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  const { abbr, label } = useTimezone();
  return (
    <footer className="border-t border-slate-800 mt-12">
      <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-500 flex items-center justify-between flex-wrap gap-2">
        <span>
          &copy; 2026 Sreerag T · MIT licensed ·{' '}
          <a
            href="https://github.com/sreeragsree1712/sports-tracker"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-300 underline-offset-2 hover:underline"
          >
            Source
          </a>
        </span>
        <span title={label}>Times in {abbr} · Data via Wikipedia</span>
      </div>
    </footer>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md text-center py-24 px-4">
      <p className="text-6xl">{'\uD83C\uDFC1'}</p>
      <h2 className="text-2xl font-bold mt-4">Page not found</h2>
      <p className="text-slate-400 mt-2">Try the home page or jump straight to the World Cup.</p>
      <div className="mt-5 flex justify-center gap-2">
        <Link to="/" className="rounded-full bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm">Home</Link>
        <Link to="/football/fifa-2026" className="rounded-full bg-pitch-600 hover:bg-pitch-500 px-4 py-2 text-sm font-semibold">
          FIFA 2026
        </Link>
      </div>
    </div>
  );
}
