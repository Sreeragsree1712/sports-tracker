/**
 * Country name -> regional indicator flag emoji.
 * Falls back to a generic globe when not found.
 */
const COUNTRY_TO_ISO2: Record<string, string> = {
  'Mexico': 'MX',
  'South Africa': 'ZA',
  'Korea Republic': 'KR',
  'South Korea': 'KR',
  'Czechia': 'CZ',
  'Canada': 'CA',
  'Switzerland': 'CH',
  'Qatar': 'QA',
  'Bosnia and Herzegovina': 'BA',
  'Brazil': 'BR',
  'Morocco': 'MA',
  'Haiti': 'HT',
  'Scotland': 'GB-SCT',
  'United States': 'US',
  'USA': 'US',
  'Paraguay': 'PY',
  'Australia': 'AU',
  'Turkiye': 'TR',
  'Türkiye': 'TR',
  'Turkey': 'TR',
  'Germany': 'DE',
  'Curacao': 'CW',
  'Curaçao': 'CW',
  "Cote d'Ivoire": 'CI',
  'Côte d’Ivoire': 'CI',
  'Ivory Coast': 'CI',
  'Ecuador': 'EC',
  'Netherlands': 'NL',
  'Japan': 'JP',
  'Tunisia': 'TN',
  'Sweden': 'SE',
  'Belgium': 'BE',
  'Egypt': 'EG',
  'Iran': 'IR',
  'New Zealand': 'NZ',
  'Spain': 'ES',
  'Cabo Verde': 'CV',
  'Cape Verde': 'CV',
  'Saudi Arabia': 'SA',
  'Uruguay': 'UY',
  'France': 'FR',
  'Senegal': 'SN',
  'Norway': 'NO',
  'Iraq': 'IQ',
  'Argentina': 'AR',
  'Algeria': 'DZ',
  'Austria': 'AT',
  'Jordan': 'JO',
  'Portugal': 'PT',
  'Uzbekistan': 'UZ',
  'Colombia': 'CO',
  'Congo DR': 'CD',
  'DR Congo': 'CD',
  'England': 'GB-ENG',
  'Croatia': 'HR',
  'Ghana': 'GH',
  'Panama': 'PA',
};

const SUBDIVISION_EMOJI: Record<string, string> = {
  // Tag-sequence flags for England and Scotland.
  'GB-ENG': '\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67\uDB40\uDC7F',
  'GB-SCT': '\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74\uDB40\uDC7F',
};

export function flagEmoji(team: string): string {
  const code = COUNTRY_TO_ISO2[team];
  if (!code) return '\uD83C\uDFC1'; // chequered flag fallback
  if (SUBDIVISION_EMOJI[code]) return SUBDIVISION_EMOJI[code];
  if (code.length !== 2) return '\uD83C\uDFC1';
  const A = 0x1f1e6; // regional indicator A
  const a = code.toUpperCase().charCodeAt(0) - 65;
  const b = code.toUpperCase().charCodeAt(1) - 65;
  return String.fromCodePoint(A + a) + String.fromCodePoint(A + b);
}
