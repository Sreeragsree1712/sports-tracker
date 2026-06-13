import { flagEmoji } from '../../lib/flags';
import { canonicalTeam } from '../../data/fifa2026';

interface Props {
  team: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

const SIZE_FLAG: Record<NonNullable<Props['size']>, string> = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-3xl',
};

const SIZE_NAME: Record<NonNullable<Props['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
};

export default function TeamBadge({
  team,
  size = 'md',
  showName = true,
  className = '',
}: Props) {
  const t = canonicalTeam(team);
  const isPlaceholder = /winner|runner|group [A-L]|3rd|best|^[12][A-L]$|^W\d+|^L\d+/i.test(team);
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={SIZE_FLAG[size]} aria-hidden="true">
        {isPlaceholder ? '\uD83C\uDFC1' : flagEmoji(t)}
      </span>
      {showName && (
        <span className={`${SIZE_NAME[size]} ${isPlaceholder ? 'italic text-slate-400' : ''}`}>
          {team}
        </span>
      )}
    </span>
  );
}
