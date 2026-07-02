import { STOCK_DIRECTORY, type DirectoryStock } from '../lib/stockDirectory';

// Trending tickers over the last 3 days, ordered by (simulated) search volume.
// A static stand-in for a real analytics feed — in production this would come
// from aggregated search counts across users.
const TRENDING_SYMBOLS = ['NVDA', 'TSLA', 'AAPL', '0700.HK', 'MU', 'AMD', '600519.SS', 'META', 'MSFT'];

export const TRENDING_SEARCHES: DirectoryStock[] = TRENDING_SYMBOLS
  .map((sym) => STOCK_DIRECTORY.find((s) => s.symbol === sym))
  .filter((s): s is DirectoryStock => !!s);
