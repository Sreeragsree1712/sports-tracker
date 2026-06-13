import { formatISTDate, formatISTTime } from '../../lib/time';

interface Props {
  iso: string;
  variant?: 'default' | 'compact';
  className?: string;
}

export default function DateChip({ iso, variant = 'default', className = '' }: Props) {
  if (variant === 'compact') {
    return (
      <span className={`inline-flex flex-col items-start ${className}`}>
        <span className="text-[10px] uppercase tracking-wide text-slate-400">
          {formatISTDate(iso)}
        </span>
        <span className="text-sm font-semibold tabular-nums">
          {formatISTTime(iso)}
        </span>
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-2.5 py-1 ring-1 ring-slate-700 ${className}`}>
      <span className="text-xs text-slate-400">{formatISTDate(iso)}</span>
      <span className="text-sm font-semibold tabular-nums">{formatISTTime(iso)}</span>
      <span className="text-[10px] text-pitch-500">IST</span>
    </span>
  );
}
