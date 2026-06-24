// AlphaWalk monogram — a hairline square framing the rising stride. The brand
// crest, matching the favicon and the desktop sidebar mark. Used wherever the
// brand needs presence (mobile headers, onboarding). Optionally shows the
// tracked wordmark beside it.

interface Props {
  size?: number;
  wordmark?: boolean;
  className?: string;
}

export function BrandMark({ size = 24, wordmark = false, className = '' }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} aria-label="AlphaWalk">
      <svg viewBox="0 0 100 100" width={size} height={size} className="shrink-0 text-ink-900" aria-hidden>
        <rect x="6" y="6" width="88" height="88" rx="6" fill="none" stroke="currentColor" strokeWidth="6" />
        <line x1="28" y1="70" x2="28" y2="56" strokeWidth="6" strokeLinecap="round" style={{ stroke: 'oklch(var(--accent))' }} />
        <line x1="50" y1="70" x2="50" y2="44" strokeWidth="6" strokeLinecap="round" style={{ stroke: 'oklch(var(--accent-2))' }} />
        <line x1="72" y1="70" x2="72" y2="30" strokeWidth="6" strokeLinecap="round" style={{ stroke: 'oklch(var(--accent))' }} />
        <line x1="22" y1="78" x2="78" y2="78" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {wordmark && (
        <span className="text-[13px] font-semibold uppercase tracking-logo text-ink-900">Alphawalk</span>
      )}
    </span>
  );
}
