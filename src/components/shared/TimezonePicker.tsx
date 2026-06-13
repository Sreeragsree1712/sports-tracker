import { useEffect, useMemo, useRef, useState } from 'react';
import { useTimezone } from '../../lib/TimezoneContext';
import {
  POPULAR_ZONES,
  allZones,
  humanLabel,
  shortAbbr,
} from '../../lib/tz';

interface Props {
  /** Render style — compact for navbar, full for settings pages. */
  variant?: 'compact' | 'full';
}

export default function TimezonePicker({ variant = 'compact' }: Props) {
  const { tz, abbr, setTz } = useTimezone();
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState('');
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        popoverRef.current?.contains(t) ||
        buttonRef.current?.contains(t)
      ) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const filteredAll = useMemo(() => {
    if (!showAll) return [];
    const q = query.trim().toLowerCase();
    const all = allZones();
    if (!q) return all.slice(0, 200);
    return all.filter((z) => z.toLowerCase().includes(q)).slice(0, 200);
  }, [showAll, query]);

  const filteredPopular = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return POPULAR_ZONES;
    return POPULAR_ZONES.filter(
      (z) =>
        z.label.toLowerCase().includes(q) ||
        z.searchKey.toLowerCase().includes(q) ||
        z.tz.toLowerCase().includes(q),
    );
  }, [query]);

  const choose = (next: string) => {
    setTz(next);
    setOpen(false);
    setShowAll(false);
    setQuery('');
  };

  const buttonClasses =
    variant === 'compact'
      ? 'px-2.5 py-1 text-xs'
      : 'px-3 py-1.5 text-sm';

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-full bg-slate-800/70 hover:bg-slate-800 ring-1 ring-slate-700 hover:ring-slate-500 transition ${buttonClasses}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={`Times shown in ${humanLabel(tz)}`}
      >
        <span aria-hidden>{'\uD83C\uDF0D'}</span>
        <span className="font-semibold tabular-nums">{abbr}</span>
        <span className="text-slate-400 hidden sm:inline">·</span>
        <span className="text-slate-300 hidden sm:inline truncate max-w-[140px]">
          {humanLabel(tz)}
        </span>
        <span aria-hidden className="text-slate-500 text-[10px]">▾</span>
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-950 ring-1 ring-slate-800 shadow-2xl z-50 max-h-[70vh] overflow-hidden flex flex-col"
          role="listbox"
        >
          <div className="p-3 border-b border-slate-800">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">
              Show all times in…
            </p>
            <input
              type="text"
              autoFocus
              placeholder="Search city or zone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-900 ring-1 ring-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pitch-600"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {!showAll && (
              <ul>
                {filteredPopular.map((z) => (
                  <li key={z.tz}>
                    <button
                      type="button"
                      onClick={() => choose(z.tz)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-slate-800 transition ${
                        z.tz === tz ? 'bg-pitch-900/40' : ''
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span aria-hidden>{z.emoji}</span>
                        <span className="truncate">{z.label}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                        {shortAbbr(z.tz)}
                      </span>
                    </button>
                  </li>
                ))}
                {filteredPopular.length === 0 && !showAll && (
                  <li className="px-3 py-3 text-sm text-slate-400">
                    No popular zones match. Try the full list below.
                  </li>
                )}
              </ul>
            )}

            {showAll && (
              <ul>
                {filteredAll.map((z) => (
                  <li key={z}>
                    <button
                      type="button"
                      onClick={() => choose(z)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-slate-800 transition ${
                        z === tz ? 'bg-pitch-900/40' : ''
                      }`}
                    >
                      <span className="truncate">{z}</span>
                      <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                        {shortAbbr(z)}
                      </span>
                    </button>
                  </li>
                ))}
                {filteredAll.length === 0 && (
                  <li className="px-3 py-3 text-sm text-slate-400">
                    No zones match.
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-800 p-2">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200 py-1"
            >
              {showAll ? '← Back to popular zones' : 'Show all timezones →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
