import type { Currency, Market, WatchStock } from '../types';

// Stooq symbol conversion. Stooq CSV API supports CORS.
// US: AAPL -> aapl.us  | HK: 0700.HK -> 0700.hk  | JP: 7203.T -> 7203.jp
// CN: 600519.SS -> 600519.sh / 000858.SZ -> 000858.sz
export function toStooq(symbol: string, market: Market): string {
  const s = symbol.toLowerCase();
  if (market === 'US') return `${s.replace(/\..*$/, '')}.us`;
  if (market === 'HK') return `${s.replace('.hk', '')}.hk`;
  if (market === 'JP') return `${s.replace('.t', '')}.jp`;
  if (market === 'CN') {
    if (s.endsWith('.ss')) return `${s.replace('.ss', '')}.sh`;
    if (s.endsWith('.sz')) return `${s.replace('.sz', '')}.sz`;
    return s;
  }
  return s;
}

export interface Quote {
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  changePct: number;
}

// Stooq CSV — l1 format: Symbol,Date,Time,Open,High,Low,Close,Volume
export async function fetchQuote(symbol: string, market: Market, signal?: AbortSignal): Promise<Quote | null> {
  const stq = toStooq(symbol, market);
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stq)}&f=sd2t2ohlcv&h&e=csv`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) return null;
    const [, , , open, high, low, close, volume] = lines[1].split(',');
    const o = Number(open), c = Number(close), h = Number(high), l = Number(low), v = Number(volume);
    if (Number.isNaN(c) || c === 0) return null;
    return {
      price: c, open: o, high: h, low: l, volume: v,
      changePct: o > 0 ? ((c - o) / o) * 100 : 0,
    };
  } catch {
    return null;
  }
}

// Deterministic fallback used when network is unavailable so UI never empties.
function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function syntheticQuote(stock: WatchStock): Quote {
  const seed = hashSeed(stock.symbol + new Date().toDateString());
  const base = stock.closeOnAdd || 100;
  const drift = ((seed % 1000) / 1000 - 0.5) * 0.06; // ±3%
  const intraday = ((seed % 200) / 200 - 0.5) * 0.025; // ±1.25%
  const price = +(base * (1 + drift)).toFixed(2);
  const open = +(price * (1 - intraday)).toFixed(2);
  return {
    price,
    open,
    high: +(Math.max(open, price) * 1.005).toFixed(2),
    low: +(Math.min(open, price) * 0.995).toFixed(2),
    volume: Math.round(500_000 + (seed % 20_000_000)),
    changePct: ((price - open) / open) * 100,
  };
}

export const currencyFor = (m: Market): string =>
  m === 'US' ? '$' : m === 'HK' ? 'HK$' : m === 'JP' ? '¥' : '¥';

// The native trading/quote currency for a market.
export const currencyForMarket = (m: Market): Currency =>
  m === 'US' ? 'USD' : m === 'HK' ? 'HKD' : m === 'JP' ? 'JPY' : 'CNY';

// Display symbol for a currency code (distinct CN¥ vs JP¥ so mixed lists read clearly).
export const currencySymbol = (c: Currency): string =>
  c === 'USD' ? '$' : c === 'HKD' ? 'HK$' : c === 'JPY' ? 'JP¥' : 'CN¥';

// Approximate FX to USD. Static table — the app has no backend, so this mirrors
// the synthetic-quote philosophy: plausible, deterministic, good enough for a
// prototype. HKD is USD-pegged (~7.8); JPY/CNY are rough spot. Swap for a live
// rate provider before public launch.
const USD_PER: Record<Currency, number> = {
  USD: 1,
  HKD: 1 / 7.8,
  JPY: 1 / 157,
  CNY: 1 / 7.25,
};

// Convert an amount in `ccy` to USD.
export const toUsd = (amount: number, ccy: Currency): number => amount * USD_PER[ccy];

// Deterministic intraday sparkline series for a ticker. Walks from the prior
// close to the given price (so the shape agrees with the day's % change) with
// seeded jitter, ending exactly on `price`. Purely illustrative — used in the
// tap-to-peek popover on report tickers.
export function sparkSeries(symbol: string, price = 100, changePct = 0, n = 24): number[] {
  let seed = hashSeed(symbol + '|spark');
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const start = price / (1 + changePct / 100);
  const span = Math.abs(price - start) || price * 0.012;
  const pts: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const base = start + (price - start) * t;
    const jitter = (rnd() - 0.5) * span * 1.5 * (1 - Math.abs(t - 0.5) * 0.7);
    pts.push(base + jitter);
  }
  pts[n - 1] = price;
  return pts;
}
