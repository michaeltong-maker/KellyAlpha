import { syntheticQuote } from './stocks';
import { STOCK_DIRECTORY } from './stockDirectory';
import type { Market } from '../types';

// A simulated agent track record: a set of past calls (buy/sell recommendations)
// with the reference price captured at the call and the current (synthetic) price.
// Deterministic per agent id so the same agent always shows the same record.
// Illustrative only — in production this would come from the agent's real call log.

export type Signal = 'strong_buy' | 'buy' | 'sell' | 'strong_sell';

export interface Call {
  id: string;
  symbol: string;
  name: string;
  market: Market;
  signal: Signal;
  at: string;          // ISO call date
  callPrice: number;   // reference price when the call was made
  currentPrice: number;
  returnPct: number;   // signed return in the call's direction (short for sells)
}

export interface GroupStat {
  signal: Signal;
  count: number;
  winRate: number;     // %
  avg: number;         // %
  calls: Call[];
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// Weighted pool: mostly long calls, a few sells — mirrors a long-biased desk.
const SIGNAL_POOL: Signal[] = ['strong_buy', 'buy', 'buy', 'buy', 'buy', 'sell', 'strong_sell'];

export function buildTrackRecord(agentId: string): Call[] {
  const rand = rng(hash('track|' + agentId));
  const n = 10 + Math.floor(rand() * 6); // 10–15 calls
  const calls: Call[] = [];
  for (let i = 0; i < n; i++) {
    const stock = STOCK_DIRECTORY[Math.floor(rand() * STOCK_DIRECTORY.length)];
    const signal = SIGNAL_POOL[Math.floor(rand() * SIGNAL_POOL.length)];
    const daysAgo = 3 + Math.floor(rand() * 40); // 3–42 days ago
    const at = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
    const currentPrice = syntheticQuote({ symbol: stock.symbol, market: stock.market, name: stock.name, addedAt: '', closeOnAdd: stock.anchor }).price;
    const callPrice = +(stock.anchor * (1 + (rand() - 0.5) * 0.24)).toFixed(2); // ±12% vs anchor
    const raw = ((currentPrice - callPrice) / callPrice) * 100;
    const returnPct = (signal === 'sell' || signal === 'strong_sell') ? -raw : raw; // sells profit on drops
    calls.push({ id: `call-${agentId}-${i}`, symbol: stock.symbol, name: stock.name, market: stock.market, signal, at, callPrice, currentPrice, returnPct });
  }
  return calls;
}

const GROUP_ORDER: Signal[] = ['strong_buy', 'buy', 'sell', 'strong_sell'];

export function groupStats(calls: Call[]): GroupStat[] {
  return GROUP_ORDER.map((signal) => {
    const cs = calls.filter((c) => c.signal === signal).sort((a, b) => +new Date(b.at) - +new Date(a.at));
    const count = cs.length;
    const wins = cs.filter((c) => c.returnPct > 0).length;
    return {
      signal,
      count,
      winRate: count ? (wins / count) * 100 : 0,
      avg: count ? cs.reduce((s, c) => s + c.returnPct, 0) / count : 0,
      calls: cs,
    };
  }).filter((g) => g.count > 0);
}

export function totalAvg(calls: Call[]): number {
  return calls.length ? calls.reduce((s, c) => s + c.returnPct, 0) / calls.length : 0;
}

export function firstCallDate(calls: Call[]): string {
  return calls.reduce((min, c) => (c.at < min ? c.at : min), calls[0]?.at ?? new Date().toISOString());
}

// Deterministic benchmark return over [fromISO, today]. A static stand-in for a
// real index feed — S&P 500 and Hang Seng modelled as a drift plus seeded jitter.
export function benchmarkReturn(fromISO: string, kind: 'sp' | 'hk'): number {
  const days = Math.max(1, (Date.now() - new Date(fromISO).getTime()) / 86_400_000);
  const annual = kind === 'sp' ? 0.12 : 0.06;
  const base = annual * (days / 365);
  const jitter = ((hash(kind + fromISO.slice(0, 10)) % 1000) / 1000 - 0.5) * 0.05; // ±2.5%
  return (base + jitter) * 100;
}
