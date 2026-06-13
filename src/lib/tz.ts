/**
 * Timezone picker model.
 *
 * The user picks one IANA timezone and the entire site renders all kickoff
 * times in that zone. We default to the browser-detected zone, falling back
 * to IST so the brand promise still holds for visitors with mis-detected or
 * UTC-only environments.
 */

const STORAGE_KEY = 'sports-tracker:tz';
const DEFAULT_TZ = 'Asia/Kolkata';

export interface TimezoneOption {
  /** IANA zone, e.g. "Asia/Kolkata" */
  tz: string;
  /** Friendly label shown in the picker, e.g. "India (IST)" */
  label: string;
  /** Flag/emoji prefix */
  emoji: string;
  /** A short search key — substring matched in the picker. */
  searchKey: string;
}

/**
 * Curated short list. Order matters — most-likely-used first. We keep this to
 * ~25 entries so the popover stays scannable. The "More…" button below opens
 * the full IANA list.
 */
export const POPULAR_ZONES: TimezoneOption[] = [
  { tz: 'Asia/Kolkata',        label: 'India (IST)',          emoji: '\uD83C\uDDEE\uD83C\uDDF3', searchKey: 'india ist kolkata mumbai delhi' },
  { tz: 'UTC',                 label: 'UTC',                  emoji: '\uD83C\uDF10',             searchKey: 'utc gmt' },
  { tz: 'Europe/London',       label: 'London (GMT/BST)',     emoji: '\uD83C\uDDEC\uD83C\uDDE7', searchKey: 'london uk britain england gmt bst' },
  { tz: 'America/New_York',    label: 'New York (ET)',        emoji: '\uD83C\uDDFA\uD83C\uDDF8', searchKey: 'new york nyc eastern et edt est usa' },
  { tz: 'America/Los_Angeles', label: 'Los Angeles (PT)',     emoji: '\uD83C\uDDFA\uD83C\uDDF8', searchKey: 'los angeles la pacific pt pdt pst usa' },
  { tz: 'America/Chicago',     label: 'Chicago (CT)',         emoji: '\uD83C\uDDFA\uD83C\uDDF8', searchKey: 'chicago central ct cdt cst usa' },
  { tz: 'America/Toronto',     label: 'Toronto (ET)',         emoji: '\uD83C\uDDE8\uD83C\uDDE6', searchKey: 'toronto canada eastern et' },
  { tz: 'America/Vancouver',   label: 'Vancouver (PT)',       emoji: '\uD83C\uDDE8\uD83C\uDDE6', searchKey: 'vancouver canada pacific pt' },
  { tz: 'America/Mexico_City', label: 'Mexico City (CST)',    emoji: '\uD83C\uDDF2\uD83C\uDDFD', searchKey: 'mexico city cst' },
  { tz: 'America/Sao_Paulo',   label: 'S\u00e3o Paulo (BRT)', emoji: '\uD83C\uDDE7\uD83C\uDDF7', searchKey: 'sao paulo brazil brt brasilia' },
  { tz: 'America/Buenos_Aires',label: 'Buenos Aires (ART)',   emoji: '\uD83C\uDDE6\uD83C\uDDF7', searchKey: 'buenos aires argentina art' },
  { tz: 'Europe/Paris',        label: 'Paris (CET)',          emoji: '\uD83C\uDDEB\uD83C\uDDF7', searchKey: 'paris france cet cest europe' },
  { tz: 'Europe/Berlin',       label: 'Berlin (CET)',         emoji: '\uD83C\uDDE9\uD83C\uDDEA', searchKey: 'berlin germany cet cest europe' },
  { tz: 'Europe/Madrid',       label: 'Madrid (CET)',         emoji: '\uD83C\uDDEA\uD83C\uDDF8', searchKey: 'madrid spain cet cest europe' },
  { tz: 'Europe/Amsterdam',    label: 'Amsterdam (CET)',      emoji: '\uD83C\uDDF3\uD83C\uDDF1', searchKey: 'amsterdam netherlands holland cet europe' },
  { tz: 'Europe/Moscow',       label: 'Moscow (MSK)',         emoji: '\uD83C\uDDF7\uD83C\uDDFA', searchKey: 'moscow russia msk' },
  { tz: 'Africa/Cairo',        label: 'Cairo (EET)',          emoji: '\uD83C\uDDEA\uD83C\uDDEC', searchKey: 'cairo egypt eet' },
  { tz: 'Africa/Johannesburg', label: 'Johannesburg (SAST)',  emoji: '\uD83C\uDDFF\uD83C\uDDE6', searchKey: 'johannesburg south africa sast' },
  { tz: 'Asia/Dubai',          label: 'Dubai (GST)',          emoji: '\uD83C\uDDE6\uD83C\uDDEA', searchKey: 'dubai uae gst middle east' },
  { tz: 'Asia/Singapore',      label: 'Singapore (SGT)',      emoji: '\uD83C\uDDF8\uD83C\uDDEC', searchKey: 'singapore sgt' },
  { tz: 'Asia/Hong_Kong',      label: 'Hong Kong (HKT)',      emoji: '\uD83C\uDDED\uD83C\uDDF0', searchKey: 'hong kong hkt china' },
  { tz: 'Asia/Tokyo',          label: 'Tokyo (JST)',          emoji: '\uD83C\uDDEF\uD83C\uDDF5', searchKey: 'tokyo japan jst' },
  { tz: 'Asia/Seoul',          label: 'Seoul (KST)',          emoji: '\uD83C\uDDF0\uD83C\uDDF7', searchKey: 'seoul korea kst' },
  { tz: 'Australia/Sydney',    label: 'Sydney (AET)',         emoji: '\uD83C\uDDE6\uD83C\uDDFA', searchKey: 'sydney australia aet aedt aest' },
  { tz: 'Pacific/Auckland',    label: 'Auckland (NZST)',      emoji: '\uD83C\uDDF3\uD83C\uDDFF', searchKey: 'auckland new zealand nzst' },
];

/** All IANA zones supported by the runtime, used for the "More…" search. */
export function allZones(): string[] {
  type IntlWithSupported = typeof Intl & { supportedValuesOf?: (k: string) => string[] };
  const fn = (Intl as IntlWithSupported).supportedValuesOf;
  if (typeof fn === 'function') {
    try {
      return fn('timeZone');
    } catch {
      // fall through
    }
  }
  return POPULAR_ZONES.map((z) => z.tz);
}

export function isValidTz(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

/** Detect the browser's timezone, with IST fallback. */
export function detectDefault(): string {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected && isValidTz(detected)) return detected;
  } catch {
    // ignore
  }
  return DEFAULT_TZ;
}

export function loadStored(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isValidTz(raw)) return raw;
  } catch {
    // localStorage may be unavailable (SSR, privacy mode)
  }
  return null;
}

export function storeChoice(tz: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, tz);
  } catch {
    // ignore
  }
}

/** Resolved short label like "IST", "ET", "BST" for the given zone right now. */
export function shortAbbr(tz: string, refDate: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
    }).formatToParts(refDate);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    if (tzPart?.value) return tzPart.value;
  } catch {
    // ignore
  }
  return tz;
}

/** Human label like "India (IST)" or "Kolkata (IST)" for arbitrary zones. */
export function humanLabel(tz: string): string {
  const popular = POPULAR_ZONES.find((z) => z.tz === tz);
  if (popular) return popular.label;
  // Fall back: take the last "/" segment.
  const last = tz.split('/').pop() ?? tz;
  return last.replace(/_/g, ' ');
}
