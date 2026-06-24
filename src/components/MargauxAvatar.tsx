// Margaux's profile icon — the AlphaWalk "rising stride" crest on the
// ink-violet accent gradient. Where every hired columnist wears a hand-drawn
// animal crest (see Avatar), Margaux wears the house mark itself: she is the
// front desk, the voice of AlphaWalk, not one of the analysts you hire. This
// single emblem is what visually separates her from the agent chats.

interface Props {
  size?: number;
  ring?: boolean;
  className?: string;
}

export function MargauxAvatar({ size = 40, ring = false, className = '' }: Props) {
  return (
    <span
      className={`relative shrink-0 inline-flex items-center justify-center rounded-pill accent-gradient text-onaccent ${ring ? 'ring-1 ring-accent/30' : ''} ${className}`}
      style={{ width: size, height: size }}
      aria-label="Margaux — AlphaWalk Front Desk"
    >
      <svg viewBox="0 0 100 100" width={size * 0.58} height={size * 0.58} aria-hidden>
        {/* three ascending strokes — pursuit, in motion, upward */}
        <line x1="30" y1="66" x2="30" y2="54" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        <line x1="50" y1="66" x2="50" y2="44" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        <line x1="70" y1="66" x2="70" y2="32" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        {/* the baseline they walk on */}
        <line x1="24" y1="74" x2="76" y2="74" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
      </svg>
    </span>
  );
}
