import { STOCK_DIRECTORY, type DirectoryStock } from '../lib/stockDirectory';

// Trending tickers over the last 3 days, with (simulated) search counts. A
// static stand-in for a real analytics feed — in production these counts would
// be aggregated search volume across users. Ordered by count, descending.
export interface TrendingItem { stock: DirectoryStock; count: number; }

const RAW: { symbol: string; count: number }[] = [
  { symbol: 'NVDA',      count: 1240 },
  { symbol: 'TSLA',      count: 1105 },
  { symbol: 'AAPL',      count: 980 },
  { symbol: '0700.HK',   count: 870 },
  { symbol: 'MU',        count: 760 },
  { symbol: 'AMD',       count: 640 },
  { symbol: '600519.SS', count: 520 },
  { symbol: 'META',      count: 430 },
  { symbol: 'MSFT',      count: 360 },
];

export const TRENDING_SEARCHES: TrendingItem[] = RAW
  .map((r) => {
    const stock = STOCK_DIRECTORY.find((s) => s.symbol === r.symbol);
    return stock ? { stock, count: r.count } : null;
  })
  .filter((x): x is TrendingItem => !!x);
