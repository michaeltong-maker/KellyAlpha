import type { StockReport } from './stockReport';
import { seedMicronReports } from './stockReport';

// Stock Search keeps its own report history, namespaced by symbol, separate from
// the agent-driven `results` store in useApp. Self-contained so the feature
// doesn't touch global persisted state. Falls back to in-memory if storage throws
// (the preview-build shim already guards this, but we double-wrap to be safe).
const KEY = 'alphawalk:stockReports:v1';
const SEEDED_KEY = 'alphawalk:stockReports:seeded:v2';

type Store = Record<string, StockReport[]>;

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable — history is session-only */
  }
}

// Seed MU with its flagship dossier once, so a first-time visitor lands on a
// populated example (matching the brief's "show the latest report on the right").
function ensureSeed(store: Store): Store {
  try {
    if (localStorage.getItem(SEEDED_KEY)) return store;
  } catch { /* ignore */ }
  // (Re)seed Micron's report set so a visitor lands on a populated example with
  // a flagship "Latest summary" plus three notes in "Other reports mentioning MU".
  store.MU = seedMicronReports();
  try { localStorage.setItem(SEEDED_KEY, '1'); } catch { /* ignore */ }
  write(store);
  return store;
}

export function loadReports(symbol: string): StockReport[] {
  const store = ensureSeed(read());
  return (store[symbol] ?? []).slice().sort((a, b) => +new Date(b.at) - +new Date(a.at));
}

// Prepend a new report for a symbol; returns the updated, newest-first list.
export function addReport(report: StockReport): StockReport[] {
  const store = read();
  const list = store[report.symbol] ?? [];
  store[report.symbol] = [report, ...list];
  write(store);
  return store[report.symbol].slice().sort((a, b) => +new Date(b.at) - +new Date(a.at));
}
