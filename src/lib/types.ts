export type Stage =
  | 'group'
  | 'round-of-32'
  | 'round-of-16'
  | 'quarter-final'
  | 'semi-final'
  | 'third-place'
  | 'final';

export type GroupKey =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export interface HalfTimeScore {
  home: number;
  away: number;
}

export interface MatchScore {
  home: number;
  away: number;
  ht?: HalfTimeScore;
  /** Penalty shootout score (knockout only) */
  pens?: { home: number; away: number };
  /** True when match went to extra time (game-ending score after 90 minutes was tied) */
  aet?: boolean;
}

export interface Fixture {
  match: number;
  stage: Stage;
  group: GroupKey | null;
  home: string;
  away: string;
  venue: string;
  city: string;
  /** ISO 8601 with local UTC offset of the host city */
  kickoff_local: string;
  /** ISO 8601 in UTC (Z) */
  kickoff_utc: string;
  /** ISO 8601 with +05:30 offset */
  kickoff_ist: string;
  /** Local UTC offset hours, e.g. -4, -5, -6, -7 */
  tz_offset_hours: number;
  status: MatchStatus;
  score: MatchScore | null;
}

export type ResultsMap = Record<string, {
  home: number;
  away: number;
  ht?: HalfTimeScore;
  pens?: { home: number; away: number };
  aet?: boolean;
  status: MatchStatus;
  /** Goal scorers, populated by the scraper when available. */
  scorers?: GoalEvent[];
}>;

export interface GoalEvent {
  /** Canonical team name (e.g. "Brazil", matches groups.json). */
  team: string;
  /** Player name as scraped. */
  player: string;
  /** Match minute (1-120). May include "+" for stoppage time, kept as string. */
  minute: string;
  /** "pen" | "og" (own goal) | undefined (regular). */
  type?: 'pen' | 'og';
}

export type GroupsMap = Record<GroupKey, string[]>;

export interface Standing {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  position: number;
  /** True when team has clinched / cannot be caught (purely informational) */
  qualified?: boolean;
  /** True when team is currently 3rd in their group (for best-3rd ranking) */
  isThird?: boolean;
}
