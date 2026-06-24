import type { Market } from '../types';

// A small, searchable directory of well-known tickers across the four markets
// AlphaWalk covers. Powers the Stock Search lookup sheet: a user types a company
// name or a code and picks a match. `anchor` is a recent-close reference so the
// synthetic quote model has a plausible value when the live feed is unavailable
// (mirrors seedWatchlist's `closeOnAdd`).
export interface DirectoryStock {
  symbol: string;
  name: string;
  market: Market;
  anchor: number;
}

export const STOCK_DIRECTORY: DirectoryStock[] = [
  // --- US: semiconductors & AI infrastructure ---
  { symbol: 'MU',    name: 'Micron Technology',        market: 'US', anchor: 1051.77 },
  { symbol: 'NVDA',  name: 'NVIDIA Corp',              market: 'US', anchor: 132.40 },
  { symbol: 'AVGO',  name: 'Broadcom Inc',             market: 'US', anchor: 175.40 },
  { symbol: 'AMD',   name: 'Advanced Micro Devices',   market: 'US', anchor: 158.40 },
  { symbol: 'TSM',   name: 'Taiwan Semiconductor ADR', market: 'US', anchor: 188.20 },
  { symbol: 'MRVL',  name: 'Marvell Technology',       market: 'US', anchor: 92.10 },
  { symbol: 'TXN',   name: 'Texas Instruments',        market: 'US', anchor: 198.20 },
  { symbol: 'INTC',  name: 'Intel Corp',               market: 'US', anchor: 24.30 },
  { symbol: 'ARM',   name: 'Arm Holdings ADR',         market: 'US', anchor: 142.60 },
  { symbol: 'SNDK',  name: 'SanDisk Corp',             market: 'US', anchor: 210.40 },
  { symbol: 'WDC',   name: 'Western Digital',          market: 'US', anchor: 96.80 },
  { symbol: 'VRT',   name: 'Vertiv Holdings',          market: 'US', anchor: 118.50 },
  { symbol: 'ALAB',  name: 'Astera Labs',              market: 'US', anchor: 88.20 },
  // --- US: mega-cap / hyperscalers ---
  { symbol: 'AAPL',  name: 'Apple Inc',                market: 'US', anchor: 226.10 },
  { symbol: 'MSFT',  name: 'Microsoft Corp',           market: 'US', anchor: 423.85 },
  { symbol: 'GOOGL', name: 'Alphabet Inc',             market: 'US', anchor: 172.40 },
  { symbol: 'AMZN',  name: 'Amazon.com Inc',           market: 'US', anchor: 198.20 },
  { symbol: 'META',  name: 'Meta Platforms',           market: 'US', anchor: 542.30 },
  { symbol: 'TSLA',  name: 'Tesla Inc',                market: 'US', anchor: 251.55 },
  { symbol: 'NFLX',  name: 'Netflix Inc',              market: 'US', anchor: 712.40 },
  // --- US: other ---
  { symbol: 'KO',    name: 'Coca-Cola Co',             market: 'US', anchor: 64.10 },
  { symbol: 'JNJ',   name: 'Johnson & Johnson',        market: 'US', anchor: 158.90 },
  { symbol: 'JPM',   name: 'JPMorgan Chase',           market: 'US', anchor: 242.30 },
  { symbol: 'NOW',   name: 'ServiceNow Inc',           market: 'US', anchor: 940.20 },
  { symbol: 'MELI',  name: 'MercadoLibre',             market: 'US', anchor: 2014.5 },
  // --- Hong Kong ---
  { symbol: '0700.HK', name: 'Tencent Holdings',       market: 'HK', anchor: 394.00 },
  { symbol: '9988.HK', name: 'Alibaba Group',          market: 'HK', anchor: 87.30 },
  { symbol: '3690.HK', name: 'Meituan',                market: 'HK', anchor: 128.40 },
  { symbol: '0941.HK', name: 'China Mobile',           market: 'HK', anchor: 82.10 },
  { symbol: '1810.HK', name: 'Xiaomi Corp',            market: 'HK', anchor: 22.60 },
  // --- Japan ---
  { symbol: '7203.T', name: 'Toyota Motor Corp',       market: 'JP', anchor: 2710.0 },
  { symbol: '6758.T', name: 'Sony Group Corp',         market: 'JP', anchor: 2950.0 },
  { symbol: '8035.T', name: 'Tokyo Electron',          market: 'JP', anchor: 24500.0 },
  { symbol: '6861.T', name: 'Keyence Corp',            market: 'JP', anchor: 62500.0 },
  { symbol: '9984.T', name: 'SoftBank Group',          market: 'JP', anchor: 9800.0 },
  // --- China A-shares ---
  { symbol: '600519.SS', name: 'Kweichow Moutai',      market: 'CN', anchor: 1488.0 },
  { symbol: '000858.SZ', name: 'Wuliangye Yibin',      market: 'CN', anchor: 144.6 },
  { symbol: '300750.SZ', name: 'CATL',                 market: 'CN', anchor: 248.0 },
  { symbol: '601127.SS', name: 'Seres Group',          market: 'CN', anchor: 132.0 },
];

// Case-insensitive match on symbol or company name. Symbol-prefix matches rank
// first, then name matches; results cap at `limit`.
export function searchDirectory(query: string, limit = 12): DirectoryStock[] {
  const q = query.trim().toLowerCase();
  if (!q) return STOCK_DIRECTORY.slice(0, limit);
  const symbolHits: DirectoryStock[] = [];
  const nameHits: DirectoryStock[] = [];
  for (const s of STOCK_DIRECTORY) {
    const sym = s.symbol.toLowerCase();
    const name = s.name.toLowerCase();
    if (sym.startsWith(q) || sym.replace(/\..*$/, '').startsWith(q)) symbolHits.push(s);
    else if (sym.includes(q) || name.includes(q)) nameHits.push(s);
  }
  return [...symbolHits, ...nameHits].slice(0, limit);
}
