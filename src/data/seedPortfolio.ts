import type { Portfolio } from '../types';

function isoDaysAgo(days: number): string {
  // Date only (no time) so the calendar input round-trips cleanly.
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

// A small demo portfolio so the subsection isn't empty out of the box. Mixed
// currencies (USD + HKD) exercise the USD-equivalent display and the multi-lot
// cost basis. Purchase prices are plausible recent-ish entries.
export const SEED_PORTFOLIO: Portfolio = {
  id: 'pf-main',
  name: 'My Portfolio',
  holdings: [
    {
      symbol: 'AAPL', market: 'US', name: 'Apple Inc',
      lots: [
        { id: 'lot-aapl-1', date: isoDaysAgo(120), quantity: 40, price: 189.40, currency: 'USD' },
        { id: 'lot-aapl-2', date: isoDaysAgo(30),  quantity: 20, price: 221.10, currency: 'USD' },
      ],
    },
    {
      symbol: 'NVDA', market: 'US', name: 'NVIDIA Corp',
      lots: [
        { id: 'lot-nvda-1', date: isoDaysAgo(64), quantity: 30, price: 118.75, currency: 'USD' },
      ],
    },
    {
      symbol: '0700.HK', market: 'HK', name: 'Tencent Holdings',
      lots: [
        { id: 'lot-700-1', date: isoDaysAgo(90), quantity: 200, price: 360.00, currency: 'HKD' },
      ],
    },
  ],
};
