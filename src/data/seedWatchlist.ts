import type { Watchlist, WatchStock } from '../types';

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

// Realistic recent-close anchors so the synthetic price model has plausible values.
export const SEED_WATCHLIST: WatchStock[] = [
  { symbol: 'NVDA',      market: 'US', name: 'NVIDIA Corp',                 addedAt: isoDaysAgo(18), closeOnAdd: 132.40, pe: 62.1, peTTM: 60.9, mktCap: '3.40T', mktCapUsd: 3400, high52: 153.13, low52:  86.62 },
  { symbol: 'AAPL',      market: 'US', name: 'Apple Inc',                   addedAt: isoDaysAgo(34), closeOnAdd: 226.10, pe: 33.9, peTTM: 32.8, mktCap: '3.45T', mktCapUsd: 3450, high52: 237.23, low52: 164.08 },
  { symbol: 'MSFT',      market: 'US', name: 'Microsoft Corp',              addedAt: isoDaysAgo(11), closeOnAdd: 423.85, pe: 36.4, peTTM: 35.2, mktCap: '3.15T', mktCapUsd: 3150, high52: 468.35, low52: 309.45 },
  { symbol: 'TSLA',      market: 'US', name: 'Tesla Inc',                   addedAt: isoDaysAgo(6),  closeOnAdd: 251.55, pe: 78.2, peTTM: 75.0, mktCap: '802B',  mktCapUsd:  802, high52: 299.29, low52: 138.80 },
  { symbol: '0700.HK',   market: 'HK', name: 'Tencent Holdings',            addedAt: isoDaysAgo(22), closeOnAdd: 394.00, pe: 22.3, peTTM: 21.9, mktCap: 'HK$3.7T', mktCapUsd: 470, high52: 425.40, low52: 260.20 },
  { symbol: '9988.HK',   market: 'HK', name: 'Alibaba Group',               addedAt: isoDaysAgo(15), closeOnAdd:  87.30, pe: 17.5, peTTM: 16.7, mktCap: 'HK$1.7T', mktCapUsd: 217, high52: 105.50, low52:  64.85 },
  { symbol: '7203.T',    market: 'JP', name: 'Toyota Motor Corp',           addedAt: isoDaysAgo(28), closeOnAdd: 2710.0, pe:  9.8, peTTM:  9.4, mktCap: '¥45T',   mktCapUsd: 290, high52: 3891.0, low52: 2415.0 },
  { symbol: '6758.T',    market: 'JP', name: 'Sony Group Corp',             addedAt: isoDaysAgo(40), closeOnAdd: 2950.0, pe: 17.4, peTTM: 17.0, mktCap: '¥17T',   mktCapUsd: 110, high52: 3201.0, low52: 1980.0 },
  { symbol: '600519.SS', market: 'CN', name: 'Kweichow Moutai',             addedAt: isoDaysAgo(50), closeOnAdd: 1488.0, pe: 22.6, peTTM: 22.0, mktCap: '¥1.87T', mktCapUsd: 258, high52: 1810.0, low52: 1245.0 },
  { symbol: '000858.SZ', market: 'CN', name: 'Wuliangye Yibin',             addedAt: isoDaysAgo(33), closeOnAdd:  144.6, pe: 18.1, peTTM: 17.8, mktCap: '¥558B',  mktCapUsd:  77, high52:  198.0, low52:  118.4 },
];

// Watchlists are multi-list now. The first one is the immutable default: the
// "add to watchlist" bubble everywhere files into it. A second seeded list shows
// off the picker + move flow out of the box.
export const SEED_WATCHLISTS: Watchlist[] = [
  { id: 'wl-default', name: 'My Watchlist', isDefault: true, stocks: SEED_WATCHLIST },
  {
    id: 'wl-semis',
    name: 'Semis & AI',
    stocks: SEED_WATCHLIST.filter((s) => ['NVDA', 'TSLA', '600519.SS'].includes(s.symbol)),
  },
];
