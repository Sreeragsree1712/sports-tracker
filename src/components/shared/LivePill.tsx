import type { Fixture } from '../../lib/types';
import { liveMinute, useNow } from '../../lib/live';

interface Props {
  fixture: Fixture;
  /** Compact pill for inline use, full pill for headline placement. */
  size?: 'sm' | 'md';
  className?: string;
}

export default function LivePill({ fixture, size = 'sm', className = '' }: Props) {
  const now = useNow();
  const minute = liveMinute(fixture, now);

  const padding = size === 'md' ? 'px-2.5 py-1' : 'px-2 py-0.5';
  const text = size === 'md' ? 'text-xs' : 'text-[10px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-red-600/90 ring-1 ring-red-400 text-white font-semibold uppercase tracking-wider ${padding} ${text} ${className}`}
      role="status"
      aria-label={`Live now, ${minute || 'in progress'}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-200" />
      </span>
      <span>Live</span>
      {minute && (
        <span className="font-normal tabular-nums opacity-90">{minute}</span>
      )}
    </span>
  );
}
