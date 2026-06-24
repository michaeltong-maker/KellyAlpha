import { sparkSeries } from '../lib/stocks';

// Shared deterministic sparkline. Coloured by the day's direction (it is market
// data, so green/red is allowed). Used in the watchlist rows and the ticker
// peek popover.
export function Sparkline({
  symbol, price, changePct, width = 132, height = 40, dot = true, className = '', fill = false,
}: {
  symbol: string;
  price: number;
  changePct: number;
  width?: number;
  height?: number;
  dot?: boolean;
  className?: string;
  fill?: boolean;
}) {
  const series = sparkSeries(symbol, price, changePct);
  const pad = 3;
  const min = Math.min(...series), max = Math.max(...series);
  const range = max - min || 1;
  const pts = series.map((v, i) => {
    const x = pad + (i / (series.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const up = changePct >= 0;
  const stroke = up ? 'oklch(var(--success))' : 'oklch(var(--danger))';
  const last = pts[pts.length - 1].split(',');
  const gid = `spk-${symbol.replace(/[^a-z0-9]/gi, '')}`;
  const areaPath = `M ${pts.join(' L ')} L ${width - pad},${height} L ${pad},${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={`block ${className}`} aria-hidden>
      {fill && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gid})`} />
        </>
      )}
      <polyline points={pts.join(' ')} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {dot && <circle cx={last[0]} cy={last[1]} r="2.4" fill={stroke} />}
    </svg>
  );
}
