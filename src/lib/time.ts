/**
 * Time formatting helpers.
 *
 * All `iso` inputs are valid ISO 8601 strings (with offset). All formatters
 * take an IANA `tz` string (e.g. "Asia/Kolkata", "America/New_York") so the
 * caller chooses what to render.
 */

function makeFmt(tz: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-IN', { timeZone: tz, ...opts });
}

export function formatDate(iso: string, tz: string): string {
  return makeFmt(tz, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(new Date(iso));
}

export function formatTime(iso: string, tz: string): string {
  return makeFmt(tz, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

export function formatDateLong(iso: string, tz: string): string {
  return makeFmt(tz, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

/** YYYY-MM-DD in `tz` — useful as a stable bucket key. */
export function dateKey(iso: string, tz: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return fmt.format(new Date(iso));
}

export function todayKey(tz: string): string {
  return dateKey(new Date().toISOString(), tz);
}

/**
 * Format the kickoff in the host city's local time, with a short TZ tag.
 * We cannot reliably render the city's actual zone abbreviation across all
 * environments, so we tag using the offset from `tz_offset_hours`.
 */
export function formatLocalWithOffset(iso: string, offsetHours: number): string {
  const d = new Date(iso);
  const sign = offsetHours >= 0 ? '+' : '-';
  const abs = Math.abs(offsetHours);
  const hh = String(Math.floor(abs)).padStart(2, '0');
  const mm = String(Math.round((abs - Math.floor(abs)) * 60)).padStart(2, '0');
  // Render in the same offset by manually shifting; safer than Intl with raw offsets.
  const utcMs = d.getTime();
  const shifted = new Date(utcMs + offsetHours * 3600_000);
  const hours = shifted.getUTCHours();
  const mins = shifted.getUTCMinutes();
  const h12 = ((hours + 11) % 12) + 1;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const minStr = String(mins).padStart(2, '0');
  return `${h12}:${minStr} ${ampm} (UTC${sign}${hh}:${mm})`;
}

/**
 * Human relative string for a kickoff time. Timezone-agnostic.
 */
export function relative(iso: string, now: Date = new Date()): string {
  const target = new Date(iso).getTime();
  const diffMs = target - now.getTime();
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60_000);

  if (diffMs > 0) {
    if (mins < 1) return 'starting now';
    if (mins < 60) return `in ${mins}m`;
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    if (hours < 24) return rem === 0 ? `in ${hours}h` : `in ${hours}h ${rem}m`;
    const days = Math.floor(hours / 24);
    const remH = hours % 24;
    return remH === 0 ? `in ${days}d` : `in ${days}d ${remH}h`;
  }

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
