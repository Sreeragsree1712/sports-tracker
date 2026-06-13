import type { Fixture, ResultsMap } from '../../lib/types';
import { isLive, liveMinute, useNow } from '../../lib/live';

interface Props {
  fixture: Fixture;
  results: ResultsMap;
  /** When true, also render the result-source line (e.g. "After extra time"). */
  verbose?: boolean;
  className?: string;
}

/**
 * Derive a complete, human-readable status for a match.
 *
 * State machine (in order of precedence):
 *   1. results.json has status='finished'  → FT / AET / Pens
 *   2. results.json has status='live'      → LIVE (with current scoreline)
 *   3. now is within the kickoff live window → LIVE (time-based, no score)
 *   4. now is before kickoff               → "Scheduled"
 *
 * The verbose flag adds a one-line clarifier underneath ("After extra time",
 * "After penalties (4–3)") for use on per-match pages and the bracket.
 */
export default function MatchStatus({
  fixture: f,
  results,
  verbose = false,
  className = '',
}: Props) {
  const now = useNow();
  const r = results[String(f.match)];

  // 1. Finished
  if (r?.status === 'finished') {
    const aet = r.aet === true;
    const pens = r.pens != null;
    const label = pens ? 'Pens' : aet ? 'AET' : 'FT';
    const subLabel = pens
      ? `After penalties (${r.pens!.home}–${r.pens!.away})`
      : aet
        ? 'After extra time'
        : null;

    return (
      <span className={`inline-flex flex-col items-end ${className}`}>
        <span className="text-pitch-500 font-semibold tabular-nums">
          {label}
          <span className="text-slate-500 font-normal"> · </span>
          {r.home}–{r.away}
        </span>
        {verbose && subLabel && (
          <span className="text-[10px] text-slate-500 mt-0.5">{subLabel}</span>
        )}
      </span>
    );
  }

  // 2 & 3. Live (either explicit or time-based)
  const live = isLive(f, results, now);
  if (live) {
    const minute = liveMinute(f, now);
    return (
      <span className={`inline-flex items-center gap-1.5 text-red-300 font-semibold ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-200" />
        </span>
        <span>LIVE</span>
        {minute && <span className="font-normal tabular-nums opacity-80">· {minute}</span>}
      </span>
    );
  }

  // 4. Scheduled
  return (
    <span className={`text-slate-400 ${className}`}>Scheduled</span>
  );
}

/** Plain-string variant for places that need text only (e.g. share metadata). */
export function matchStatusText(
  f: Fixture,
  results: ResultsMap,
  now: Date = new Date(),
): string {
  const r = results[String(f.match)];
  if (r?.status === 'finished') {
    if (r.pens) return `Pens · ${r.home}–${r.away} (pens ${r.pens.home}–${r.pens.away})`;
    if (r.aet) return `AET · ${r.home}–${r.away}`;
    return `FT · ${r.home}–${r.away}`;
  }
  if (isLive(f, results, now)) {
    const m = liveMinute(f, now);
    return m ? `LIVE · ${m}` : 'LIVE';
  }
  return 'Scheduled';
}
