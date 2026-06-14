interface Props {
  /** 'gold' | 'silver' | 'bronze' picks the gradient. 'sky' / 'emerald' / 'pitch' are flat tints for specialist awards. */
  variant: 'gold' | 'silver' | 'bronze' | 'sky' | 'emerald' | 'pitch';
  /** The glyph drawn on the medal face. 'ball' = football, 'boot' = boot,
   *  'glove' = goalkeeper glove, 'star' = star (young player), 'shield' = fair play. */
  glyph: 'ball' | 'boot' | 'glove' | 'star' | 'shield';
  className?: string;
}

const GRADIENTS: Record<Props['variant'], { a: string; b: string; ring: string }> = {
  gold:    { a: '#fde68a', b: '#d97706', ring: '#facc15' },
  silver:  { a: '#e2e8f0', b: '#64748b', ring: '#cbd5e1' },
  bronze:  { a: '#fcd34d', b: '#92400e', ring: '#b45309' },
  sky:     { a: '#bae6fd', b: '#0369a1', ring: '#38bdf8' },
  emerald: { a: '#a7f3d0', b: '#047857', ring: '#10b981' },
  pitch:   { a: '#bbf7d0', b: '#15803d', ring: '#22c55e' },
};

export default function MedalIcon({ variant, glyph, className = '' }: Props) {
  const g = GRADIENTS[variant];
  const id = `med-${variant}-${glyph}`;
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <radialGradient id={id} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={g.a} />
          <stop offset="100%" stopColor={g.b} />
        </radialGradient>
      </defs>
      {/* Ribbon */}
      <path d="M16 4 L20 18 L24 22 L28 18 L32 4 Z" fill={g.b} opacity="0.7" />
      <path d="M16 4 L20 18 L24 16 L28 18 L32 4 Z" fill={g.a} opacity="0.85" />
      {/* Medal disk */}
      <circle cx="24" cy="30" r="13" fill={`url(#${id})`} stroke={g.ring} strokeWidth="1.2" />
      <circle cx="24" cy="30" r="9" fill="none" stroke={g.b} strokeWidth="0.6" opacity="0.5" />
      {/* Glyph */}
      <g transform="translate(24,30)" stroke={g.b} strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {glyph === 'ball' && (
          <>
            <circle r="5.5" fill={g.a} stroke={g.b} />
            <path d="M -5.5 0 L 5.5 0 M 0 -5.5 L 0 5.5" />
            <path d="M -3.8 -3.8 L 3.8 3.8 M -3.8 3.8 L 3.8 -3.8" />
          </>
        )}
        {glyph === 'boot' && (
          <>
            <path d="M -5 -1 L -5 3 Q -5 5 -3 5 L 4 5 Q 6 5 6 3 L 6 1 L 2 -1 L -1 -1 L -1 -4 L -3 -4 Z" fill={g.a} />
            <path d="M -3 5 L -3 6 M 0 5 L 0 6 M 3 5 L 3 6" />
          </>
        )}
        {glyph === 'glove' && (
          <>
            <path d="M -3.5 -5 Q -4.5 -5 -4.5 -3.5 L -4.5 1 L -5.5 2 L -5.5 4 Q -5.5 5.5 -4 5.5 L 3.5 5.5 Q 5 5.5 5 4 L 5 -1 Q 5 -2.5 3.5 -2.5 L 1.5 -2.5 L 1.5 -3.5 Q 1.5 -5 0 -5 Z" fill={g.a} />
            <path d="M -2 -5 L -2 -2.5 M 0 -5 L 0 -2.5" />
          </>
        )}
        {glyph === 'star' && (
          <path d="M 0 -5.5 L 1.6 -1.7 L 5.7 -1.4 L 2.6 1.3 L 3.5 5.4 L 0 3.2 L -3.5 5.4 L -2.6 1.3 L -5.7 -1.4 L -1.6 -1.7 Z" fill={g.a} />
        )}
        {glyph === 'shield' && (
          <>
            <path d="M -4.5 -5 L 4.5 -5 L 4.5 0 Q 4.5 4 0 6 Q -4.5 4 -4.5 0 Z" fill={g.a} />
            <path d="M -2 -1 L -0.5 1 L 2.5 -2" stroke={g.b} strokeWidth="1.3" />
          </>
        )}
      </g>
    </svg>
  );
}
