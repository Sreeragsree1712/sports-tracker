import fixturesJson from '../../data/sports/football/fifa-2026/fixtures.json';
import groupsJson from '../../data/sports/football/fifa-2026/groups.json';
import resultsJson from '../../data/sports/football/fifa-2026/results.json';
import type { Fixture, GroupsMap, ResultsMap } from '../lib/types';

export const fixtures = fixturesJson as Fixture[];
export const groups = groupsJson as GroupsMap;
export const results = resultsJson as ResultsMap;

/**
 * The fixtures.json (auto-generated) sometimes uses common short names while
 * groups.json uses official FIFA names. We canonicalise to the groups.json
 * names so standings + bracket can be computed without surprises.
 */
const TEAM_ALIASES: Record<string, string> = {
  'South Korea': 'Korea Republic',
  'Turkey': 'Turkiye',
  'Türkiye': 'Turkiye',
  'USA': 'United States',
  'United States of America': 'United States',
  'Cape Verde': 'Cabo Verde',
  'Côte d\u2019Ivoire': "Cote d'Ivoire",
  'Ivory Coast': "Cote d'Ivoire",
  'Curaçao': 'Curacao',
  'DR Congo': 'Congo DR',
  'Democratic Republic of the Congo': 'Congo DR',
};

export function canonicalTeam(name: string): string {
  return TEAM_ALIASES[name] ?? name;
}

/** Returns the group key for a given team name, or null if not found. */
export function teamGroup(team: string): keyof GroupsMap | null {
  const t = canonicalTeam(team);
  for (const [g, members] of Object.entries(groups) as [keyof GroupsMap, string[]][]) {
    if (members.includes(t)) return g;
  }
  return null;
}

/** Slug helper for /team/:slug routes. */
export function teamSlug(team: string): string {
  return canonicalTeam(team)
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function teamFromSlug(slug: string): string | null {
  for (const members of Object.values(groups)) {
    for (const t of members) if (teamSlug(t) === slug) return t;
  }
  return null;
}
