// The stride — AlphaWalk's signature mark. Three ascending strokes on a
// baseline: footsteps on a walk, ticks on a price axis, marks on a tailor's
// measure. Used as the connective graphic across the app: section dividers,
// the dossier masthead, the spine of a card. Optionally draws itself in.

interface Props {
  /** Overall width in px; height scales with it. */
  width?: number;
  /** Draw the strides in on mount. */
  animate?: boolean;
  /** Center the mark and flank it with hairlines, like a printed section break. */
  divider?: boolean;
  className?: string;
}

function Mark({ width = 34, animate = false }: { width?: number; animate?: boolean }) {
  const h = width * 0.62;
  return (
    <svg
      width={width}
      height={h}
      viewBox="0 0 34 21"
      fill="none"
      aria-hidden
      className={animate ? 'stride-draw' : undefined}
      style={{ ['--stride-len' as string]: '24' }}
    >
      <g stroke="oklch(var(--accent))" strokeWidth="2.4" strokeLinecap="round">
        <line x1="6"  y1="17" x2="6"  y2="12" />
        <line x1="17" y1="17" x2="17" y2="7" />
        <line x1="28" y1="17" x2="28" y2="2" />
      </g>
      <line x1="3" y1="19.5" x2="31" y2="19.5" stroke="oklch(var(--ink-300))" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function StrideRule({ width = 34, animate = false, divider = false, className = '' }: Props) {
  if (!divider) {
    return (
      <span className={`inline-flex ${className}`}>
        <Mark width={width} animate={animate} />
      </span>
    );
  }
  return (
    <div className={`flex items-center gap-4 ${className}`} aria-hidden>
      <span className="h-px flex-1 bg-ink-200" />
      <Mark width={width} animate={animate} />
      <span className="h-px flex-1 bg-ink-200" />
    </div>
  );
}
