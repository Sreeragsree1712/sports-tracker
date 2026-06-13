/**
 * Time formatting helpers.
 *
 * All `iso` inputs are valid ISO 8601 strings (with offset). We rely on
 * `Intl.DateTimeFormat` with `timeZone` to render IST without depending on
 * the user's machine clock zone.
 */

const IST_TZ = 'Asia/Kolkata';

const istDate = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST_TZ,
  weekday: 'short',
  day: '2-digit',
  month: 'short',
});

const istTime = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

const istDateLong = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST_TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatISTDate(iso: string): string {
  return istDate.format(new Date(iso));
}

export function formatISTTime(iso: string): string {
  return istTime.format(new Date(iso));
}

export function formatISTDateLong(iso: string): string {
  return istDateLong.format(new Date(iso));
}

/** YYYY-MM-DD in IST — useful as a stable bucket key. */
export function istDateKey(iso: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return fmt.format(new Date(iso));
}

export function todayISTKey(): string {
  return istDateKey(new Date().toISOString());
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
 * Human relative string for a kickoff time.
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
