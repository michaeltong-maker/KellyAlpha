// Six decorative chart backgrounds for Editor's Choice cards. They are purely
// ornamental — never live market data — so no gain/loss (green/red) colour
// appears here. The brand accent (ink-violet) is woven in: a soft diagonal
// gradient wash tints the band, and the sharpest "hero" line/marker of each
// variant is drawn in the accent gradient so every card carries a hint of
// colour rather than reading as flat black-and-white.

const INK = 'oklch(var(--ink-900))';
const PAPER = 'oklch(var(--paper))';
const ACCENT = 'oklch(var(--accent))';
const ACCENT2 = 'oklch(var(--accent-2))';

type Variant = 'candles' | 'mountain' | 'sparkline' | 'bars' | 'grid' | 'wave';

const VARIANTS: Variant[] = ['candles', 'mountain', 'sparkline', 'bars', 'grid', 'wave'];

export function pickVariant(seed: string | number): Variant {
  const n = typeof seed === 'number' ? seed : seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return VARIANTS[n % VARIANTS.length];
}

export function ChartBackground({ variant, className = '' }: { variant: Variant; className?: string }) {
  switch (variant) {
    case 'candles':    return <Candles className={className} />;
    case 'mountain':   return <Mountain className={className} />;
    case 'sparkline':  return <Sparkline className={className} />;
    case 'bars':       return <Bars className={className} />;
    case 'grid':       return <Grid className={className} />;
    case 'wave':       return <Wave className={className} />;
  }
}

// Shared gradient defs. The ids are stable across instances; since every
// instance declares identical gradients, referencing by id is safe.
function Defs() {
  return (
    <defs>
      <linearGradient id="awStroke" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor={ACCENT} />
        <stop offset="100%" stopColor={ACCENT2} />
      </linearGradient>
      <linearGradient id="awWash" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={ACCENT} stopOpacity="0.14" />
        <stop offset="55%" stopColor={ACCENT2} stopOpacity="0.05" />
        <stop offset="100%" stopColor={ACCENT2} stopOpacity="0" />
      </linearGradient>
      <linearGradient id="awFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={ACCENT} stopOpacity="0.5" />
        <stop offset="100%" stopColor={ACCENT2} stopOpacity="0.12" />
      </linearGradient>
    </defs>
  );
}

function wrap(children: React.ReactNode, className: string) {
  return (
    <svg viewBox="0 0 400 140" preserveAspectRatio="none" className={`absolute inset-0 w-full h-full ${className}`} aria-hidden>
      <Defs />
      <rect width="400" height="140" fill={PAPER} />
      <rect width="400" height="140" fill="url(#awWash)" />
      {children}
    </svg>
  );
}

// 1) Candle column — ink candles; "up" candles carry the accent.
function Candles({ className = '' }) {
  const candles = [
    { x: 16,  o: 70, c: 100, h: 60,  l: 110, up: true },
    { x: 36,  o: 95, c: 80,  h: 72,  l: 102, up: false },
    { x: 56,  o: 75, c: 110, h: 65,  l: 118, up: true },
    { x: 76,  o: 102, c: 90, h: 78,  l: 110, up: false },
    { x: 96,  o: 88, c: 116, h: 76,  l: 122, up: true },
    { x: 116, o: 110, c: 95, h: 82,  l: 118, up: false },
    { x: 136, o: 90, c: 118, h: 78,  l: 124, up: true },
    { x: 156, o: 116, c: 102,h: 90,  l: 122, up: false },
    { x: 176, o: 100, c: 126,h: 84,  l: 130, up: true },
    { x: 196, o: 122, c: 110,h: 98,  l: 128, up: false },
    { x: 216, o: 108, c: 132,h: 92,  l: 136, up: true },
    { x: 236, o: 130, c: 118,h: 106, l: 134, up: false },
    { x: 256, o: 116, c: 138,h: 102, l: 142, up: true },
    { x: 276, o: 134, c: 124,h: 112, l: 138, up: false },
    { x: 296, o: 124, c: 144,h: 110, l: 148, up: true },
    { x: 316, o: 140, c: 126,h: 118, l: 144, up: false },
    { x: 336, o: 128, c: 148,h: 114, l: 152, up: true },
    { x: 356, o: 144, c: 130,h: 120, l: 148, up: false },
    { x: 376, o: 132, c: 152,h: 118, l: 156, up: true },
  ].map((c, i) => {
    const top = Math.min(c.o, c.c);
    const h = Math.abs(c.c - c.o);
    const col = c.up ? ACCENT : INK;
    const op = c.up ? 0.7 : 0.16;
    return (
      <g key={i} opacity={op}>
        <line x1={c.x} y1={c.h} x2={c.x} y2={c.l} stroke={col} strokeWidth="1.2" />
        <rect x={c.x - 4} y={top} width="8" height={Math.max(h, 2)} fill={col} rx="1" />
      </g>
    );
  });
  return wrap(
    <>
      <circle cx="320" cy="44" r="34" fill={ACCENT} opacity="0.08" />
      {candles}
    </>,
    className,
  );
}

// 2) Layered hills — ink ridges; the crest line + peak in accent.
function Mountain({ className = '' }) {
  return wrap(
    <>
      <path d="M0 110 L40 100 L80 105 L120 90 L160 95 L200 75 L240 85 L280 60 L320 70 L360 45 L400 55 L400 140 L0 140 Z" fill="url(#awFill)" opacity="0.5" />
      <path d="M0 120 L40 115 L80 112 L120 100 L160 105 L200 90 L240 98 L280 78 L320 88 L360 65 L400 78 L400 140 L0 140 Z" fill={INK} opacity="0.12" />
      <path d="M0 110 L40 100 L80 105 L120 90 L160 95 L200 75 L240 85 L280 60 L320 70 L360 45 L400 55" fill="none" stroke="url(#awStroke)" strokeWidth="2" opacity="0.9" />
      <circle cx="360" cy="45" r="4" fill={ACCENT2} />
    </>,
    className,
  );
}

// 3) Sparkline — stacked trend lines, faint ink to a sharp accent crest.
function Sparkline({ className = '' }) {
  const path = (offset: number, opacity: number, accent = false) =>
    <path
      d={`M0 ${100 - offset} L40 ${92 - offset} L80 ${98 - offset} L120 ${85 - offset} L160 ${90 - offset} L200 ${72 - offset} L240 ${80 - offset} L280 ${60 - offset} L320 ${68 - offset} L360 ${48 - offset} L400 ${55 - offset}`}
      fill="none" stroke={accent ? 'url(#awStroke)' : INK} strokeWidth={accent ? 2.2 : 1.6} opacity={opacity}
    />;
  return wrap(
    <>
      {path(-30, 0.08)}
      {path(-15, 0.16)}
      {path(0, 0.26)}
      {path(15, 1, true)}
      <circle cx="360" cy="33" r="3.5" fill={ACCENT2} />
    </>,
    className,
  );
}

// 4) Rising bars — graded ink with the leading bars in the accent gradient.
function Bars({ className = '' }) {
  const heights = [40, 56, 32, 70, 48, 60, 38, 72, 50, 84, 58, 90, 64, 96, 72, 104, 80, 112, 92, 118];
  return wrap(
    <>
      <line x1="0" y1="60" x2="400" y2="60" stroke={INK} strokeOpacity="0.1" strokeWidth="0.5" />
      {heights.map((h, i) => {
        const lead = i >= heights.length - 6; // last few bars pop in accent
        return (
          <rect
            key={i}
            x={10 + i * 20}
            y={130 - h}
            width="12"
            height={h}
            rx="2"
            fill={lead ? 'url(#awFill)' : INK}
            opacity={lead ? 0.95 : 0.08 + (i / heights.length) * 0.2}
          />
        );
      })}
    </>,
    className,
  );
}

// 5) Heatmap grid — ink cells, brighter cells warmed toward the accent.
function Grid({ className = '' }) {
  const cells: React.ReactNode[] = [];
  const cols = 20, rows = 7;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const intensity = (r * 5 + c * 11) % 5;
      const op = 0.05 + intensity * 0.07;
      const hot = intensity >= 4;
      cells.push(
        <rect key={`${r}-${c}`} x={c * 20} y={r * 20} width="18" height="18"
          fill={hot ? ACCENT : INK} opacity={hot ? 0.55 : op} rx="2" />
      );
    }
  }
  return wrap(<>{cells}</>, className);
}

// 6) Waves — faint ink swells topped by a sharp accent crest.
function Wave({ className = '' }) {
  return wrap(
    <>
      <path d="M0 70 Q50 30 100 70 T200 70 T300 70 T400 70" fill="none" stroke={INK} strokeWidth="1.8" opacity="0.12" />
      <path d="M0 80 Q50 50 100 80 T200 80 T300 80 T400 80" fill="none" stroke={INK} strokeWidth="1.8" opacity="0.2" />
      <path d="M0 90 Q50 70 100 90 T200 90 T300 90 T400 90" fill="none" stroke="url(#awStroke)" strokeWidth="2.2" opacity="0.9" />
      <circle cx="100" cy="90" r="3.5" fill={ACCENT} />
      <circle cx="200" cy="90" r="3.5" fill={ACCENT2} />
      <circle cx="300" cy="90" r="3.5" fill={ACCENT} />
    </>,
    className,
  );
}
