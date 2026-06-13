import { formatDate, formatTime } from '../../lib/time';
import { useTimezone } from '../../lib/TimezoneContext';

interface Props {
  iso: string;
  variant?: 'default' | 'compact';
  className?: string;
}

export default function DateChip({ iso, variant = 'default', className = '' }: Props) {
  const { tz, abbr } = useTimezone();

  if (variant === 'compact') {
    return (
      <span className={`inline-flex flex-col items-start ${className}`}>
        <span className="text-[10px] uppercase tracking-wide text-slate-400">
          {formatDate(iso, tz)}
        </span>
        <span className="text-sm font-semibold tabular-nums">
          {formatTime(iso, tz)}
        </span>
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-2.5 py-1 ring-1 ring-slate-700 ${className}`}>
      <span className="text-xs text-slate-400">{formatDate(iso, tz)}</span>
      <span className="text-sm font-semibold tabular-nums">{formatTime(iso, tz)}</span>
      <span className="text-[10px] text-pitch-500">{abbr}</span>
    </span>
  );
}
