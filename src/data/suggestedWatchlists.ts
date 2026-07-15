import type { Market } from '../types';

// Curated stock pool + theme presets powering the "Suggested watchlist" flow.
// A static stand-in for a model that, given a theme, returns ~10 related tickers
// and a list name. Arbitrary themes are matched by keyword against the pool.

export interface SuggestedStock {
  symbol: string;
  name: string;
  market: Market;
  anchor: number;
  tags: string[];
}

const POOL: SuggestedStock[] = [
  // Mega-cap tech
  { symbol: 'AAPL',  name: 'Apple Inc',              market: 'US', anchor: 226.10, tags: ['mag7', 'mega', 'tech', 'consumer'] },
  { symbol: 'MSFT',  name: 'Microsoft Corp',         market: 'US', anchor: 423.85, tags: ['mag7', 'mega', 'tech', 'ai', 'cloud', 'software'] },
  { symbol: 'GOOGL', name: 'Alphabet Inc',           market: 'US', anchor: 172.40, tags: ['mag7', 'mega', 'tech', 'ai', 'search', 'cloud', 'quantum'] },
  { symbol: 'AMZN',  name: 'Amazon.com Inc',         market: 'US', anchor: 198.20, tags: ['mag7', 'mega', 'tech', 'cloud', 'ecommerce', 'ai'] },
  { symbol: 'META',  name: 'Meta Platforms',         market: 'US', anchor: 542.30, tags: ['mag7', 'mega', 'tech', 'ai', 'social', 'ads'] },
  { symbol: 'TSLA',  name: 'Tesla Inc',              market: 'US', anchor: 251.55, tags: ['mag7', 'mega', 'ev', 'energy', 'auto', 'ai', 'robotics'] },
  { symbol: 'NVDA',  name: 'NVIDIA Corp',            market: 'US', anchor: 132.40, tags: ['mag7', 'mega', 'ai', 'semiconductor', 'semi', 'chips', 'infra', 'gpu'] },
  { symbol: 'NFLX',  name: 'Netflix Inc',            market: 'US', anchor: 712.40, tags: ['mega', 'tech', 'streaming', 'media'] },
  // Semiconductors
  { symbol: 'AMD',   name: 'Advanced Micro Devices', market: 'US', anchor: 158.40, tags: ['ai', 'semiconductor', 'semi', 'chips', 'gpu', 'infra'] },
  { symbol: 'AVGO',  name: 'Broadcom Inc',           market: 'US', anchor: 175.40, tags: ['ai', 'semiconductor', 'semi', 'chips', 'infra', 'networking'] },
  { symbol: 'TSM',   name: 'Taiwan Semiconductor',   market: 'US', anchor: 188.20, tags: ['ai', 'semiconductor', 'semi', 'chips', 'foundry'] },
  { symbol: 'MU',    name: 'Micron Technology',      market: 'US', anchor: 105.00, tags: ['ai', 'semiconductor', 'semi', 'memory', 'chips', 'infra'] },
  { symbol: 'MRVL',  name: 'Marvell Technology',     market: 'US', anchor: 92.10,  tags: ['ai', 'semiconductor', 'semi', 'chips', 'networking', 'infra'] },
  { symbol: 'TXN',   name: 'Texas Instruments',      market: 'US', anchor: 198.20, tags: ['semiconductor', 'semi', 'chips', 'analog'] },
  { symbol: 'ARM',   name: 'Arm Holdings',           market: 'US', anchor: 142.60, tags: ['ai', 'semiconductor', 'semi', 'chips', 'ip'] },
  { symbol: 'INTC',  name: 'Intel Corp',             market: 'US', anchor: 24.30,  tags: ['semiconductor', 'semi', 'chips', 'foundry'] },
  { symbol: 'ASML',  name: 'ASML Holding',           market: 'US', anchor: 720.00, tags: ['semiconductor', 'semi', 'chips', 'equipment', 'lithography'] },
  { symbol: 'ALAB',  name: 'Astera Labs',            market: 'US', anchor: 88.20,  tags: ['ai', 'semiconductor', 'semi', 'infra', 'connectivity'] },
  // AI infrastructure
  { symbol: 'VRT',   name: 'Vertiv Holdings',        market: 'US', anchor: 118.50, tags: ['ai', 'infra', 'datacenter', 'power', 'cooling'] },
  { symbol: 'SMCI',  name: 'Super Micro Computer',   market: 'US', anchor: 45.00,  tags: ['ai', 'infra', 'datacenter', 'servers', 'hardware'] },
  { symbol: 'DELL',  name: 'Dell Technologies',      market: 'US', anchor: 130.00, tags: ['ai', 'infra', 'datacenter', 'servers', 'hardware'] },
  { symbol: 'ANET',  name: 'Arista Networks',        market: 'US', anchor: 380.00, tags: ['ai', 'infra', 'datacenter', 'networking'] },
  { symbol: 'ORCL',  name: 'Oracle Corp',            market: 'US', anchor: 175.00, tags: ['ai', 'infra', 'cloud', 'datacenter', 'software'] },
  // Energy
  { symbol: 'XOM',   name: 'Exxon Mobil',            market: 'US', anchor: 118.00, tags: ['energy', 'oil', 'gas', 'integrated'] },
  { symbol: 'CVX',   name: 'Chevron Corp',           market: 'US', anchor: 160.00, tags: ['energy', 'oil', 'gas', 'integrated'] },
  { symbol: 'COP',   name: 'ConocoPhillips',         market: 'US', anchor: 105.00, tags: ['energy', 'oil', 'gas'] },
  { symbol: 'SLB',   name: 'Schlumberger',           market: 'US', anchor: 45.00,  tags: ['energy', 'oil', 'services'] },
  { symbol: 'EOG',   name: 'EOG Resources',          market: 'US', anchor: 128.00, tags: ['energy', 'oil', 'gas'] },
  { symbol: 'MPC',   name: 'Marathon Petroleum',     market: 'US', anchor: 175.00, tags: ['energy', 'oil', 'refining'] },
  { symbol: 'PSX',   name: 'Phillips 66',            market: 'US', anchor: 135.00, tags: ['energy', 'oil', 'refining'] },
  { symbol: 'WMB',   name: 'Williams Companies',     market: 'US', anchor: 48.00,  tags: ['energy', 'gas', 'midstream', 'pipeline'] },
  { symbol: 'OKE',   name: 'ONEOK Inc',              market: 'US', anchor: 105.00, tags: ['energy', 'gas', 'midstream', 'pipeline'] },
  { symbol: 'KMI',   name: 'Kinder Morgan',          market: 'US', anchor: 28.00,  tags: ['energy', 'gas', 'midstream', 'pipeline'] },
  // Financials
  { symbol: 'JPM',   name: 'JPMorgan Chase',         market: 'US', anchor: 242.00, tags: ['financials', 'bank', 'finance'] },
  { symbol: 'BAC',   name: 'Bank of America',        market: 'US', anchor: 42.00,  tags: ['financials', 'bank', 'finance'] },
  { symbol: 'WFC',   name: 'Wells Fargo',            market: 'US', anchor: 62.00,  tags: ['financials', 'bank', 'finance'] },
  { symbol: 'GS',    name: 'Goldman Sachs',          market: 'US', anchor: 480.00, tags: ['financials', 'bank', 'investment', 'finance'] },
  { symbol: 'MS',    name: 'Morgan Stanley',         market: 'US', anchor: 105.00, tags: ['financials', 'bank', 'investment', 'finance'] },
  { symbol: 'C',     name: 'Citigroup',              market: 'US', anchor: 68.00,  tags: ['financials', 'bank', 'finance'] },
  { symbol: 'BLK',   name: 'BlackRock',              market: 'US', anchor: 880.00, tags: ['financials', 'asset', 'finance'] },
  { symbol: 'SCHW',  name: 'Charles Schwab',         market: 'US', anchor: 72.00,  tags: ['financials', 'broker', 'finance'] },
  { symbol: 'AXP',   name: 'American Express',        market: 'US', anchor: 265.00, tags: ['financials', 'payments', 'finance'] },
  { symbol: 'V',     name: 'Visa Inc',               market: 'US', anchor: 290.00, tags: ['financials', 'payments', 'finance'] },
  // Trending — Quantum
  { symbol: 'IONQ',  name: 'IonQ Inc',               market: 'US', anchor: 12.00,  tags: ['quantum', 'computing'] },
  { symbol: 'RGTI',  name: 'Rigetti Computing',      market: 'US', anchor: 8.00,   tags: ['quantum', 'computing'] },
  { symbol: 'QBTS',  name: 'D-Wave Quantum',         market: 'US', anchor: 6.00,   tags: ['quantum', 'computing'] },
  { symbol: 'IBM',   name: 'IBM Corp',               market: 'US', anchor: 195.00, tags: ['quantum', 'tech', 'ai', 'computing'] },
  // Trending — Nuclear & SMR
  { symbol: 'CEG',   name: 'Constellation Energy',   market: 'US', anchor: 245.00, tags: ['nuclear', 'energy', 'power'] },
  { symbol: 'VST',   name: 'Vistra Corp',            market: 'US', anchor: 130.00, tags: ['nuclear', 'energy', 'power'] },
  { symbol: 'SMR',   name: 'NuScale Power',          market: 'US', anchor: 25.00,  tags: ['nuclear', 'smr', 'energy'] },
  { symbol: 'OKLO',  name: 'Oklo Inc',               market: 'US', anchor: 12.00,  tags: ['nuclear', 'smr', 'energy'] },
  // Trending — GLP-1 / Obesity
  { symbol: 'LLY',   name: 'Eli Lilly',              market: 'US', anchor: 900.00, tags: ['glp1', 'obesity', 'pharma', 'healthcare'] },
  { symbol: 'NVO',   name: 'Novo Nordisk',           market: 'US', anchor: 130.00, tags: ['glp1', 'obesity', 'pharma', 'healthcare'] },
  { symbol: 'VKTX',  name: 'Viking Therapeutics',    market: 'US', anchor: 60.00,  tags: ['glp1', 'obesity', 'biotech', 'healthcare'] },
  { symbol: 'AMGN',  name: 'Amgen Inc',              market: 'US', anchor: 320.00, tags: ['glp1', 'obesity', 'pharma', 'healthcare'] },
  { symbol: 'HIMS',  name: 'Hims & Hers Health',     market: 'US', anchor: 22.00,  tags: ['glp1', 'obesity', 'telehealth', 'healthcare'] },
];

const bySym = (sym: string): SuggestedStock => POOL.find((p) => p.symbol === sym)!;

interface Preset {
  id: string;
  label: string;      // shown on the quick-pick chip
  name: string;       // suggested watchlist name
  symbols: string[];
  trending?: boolean; // gathered from recent users
}

const PRESETS: Preset[] = [
  { id: 'mag7',        label: 'Mag 7',            name: 'Magnificent 7',    symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA'] },
  { id: 'ai-semi',     label: 'AI Semiconductor', name: 'AI Semiconductors', symbols: ['NVDA', 'AMD', 'AVGO', 'TSM', 'MU', 'MRVL', 'TXN', 'ARM', 'ASML', 'INTC'] },
  { id: 'ai-infra',    label: 'AI Infra',         name: 'AI Infrastructure', symbols: ['NVDA', 'AVGO', 'VRT', 'SMCI', 'DELL', 'ANET', 'MU', 'MRVL', 'ALAB', 'ORCL'] },
  { id: 'energy',      label: 'Energy',           name: 'Energy',            symbols: ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'WMB', 'OKE', 'KMI'] },
  { id: 'financials',  label: 'Financials',       name: 'Financials',        symbols: ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'AXP', 'V'] },
  { id: 'quantum',     label: 'Quantum',          name: 'Quantum Computing', symbols: ['IONQ', 'RGTI', 'QBTS', 'IBM', 'GOOGL', 'MSFT', 'NVDA', 'AMZN'], trending: true },
  { id: 'nuclear',     label: 'Nuclear & SMR',    name: 'Nuclear & SMR',     symbols: ['CEG', 'VST', 'SMR', 'OKLO', 'NVDA', 'VRT'], trending: true },
  { id: 'glp1',        label: 'GLP-1 / Obesity',  name: 'GLP-1 / Obesity',   symbols: ['LLY', 'NVO', 'VKTX', 'AMGN', 'HIMS'], trending: true },
];

// Quick-pick chips shown in the suggest modal.
export const SUGGESTED_THEMES: { label: string; trending: boolean }[] =
  PRESETS.map((p) => ({ label: p.label, trending: !!p.trending }));

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// "AI" suggestion: map the query to a preset, else keyword-match the pool. Always
// returns a name and up to 10 stocks.
export function suggestWatchlist(query: string): { name: string; stocks: SuggestedStock[] } {
  const q = query.trim();
  if (!q) return { name: PRESETS[0].name, stocks: PRESETS[0].symbols.map(bySym) };

  const ql = q.toLowerCase();
  const preset = PRESETS.find((p) => p.label.toLowerCase() === ql || p.id === ql || ql.includes(p.label.toLowerCase()) || p.label.toLowerCase().includes(ql));
  if (preset) return { name: preset.name, stocks: preset.symbols.map(bySym) };

  const tokens = ql.split(/[^a-z0-9]+/).filter(Boolean);
  const scored = POOL
    .map((s) => {
      const hay = (s.name + ' ' + s.tags.join(' ')).toLowerCase();
      return { s, score: tokens.reduce((n, tok) => n + (hay.includes(tok) ? 1 : 0), 0) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  let stocks = scored.slice(0, 10).map((x) => x.s);
  if (stocks.length < 5) {
    const have = new Set(stocks.map((s) => s.symbol));
    const fillers = PRESETS[0].symbols.map(bySym).filter((s) => !have.has(s.symbol));
    stocks = stocks.concat(fillers).slice(0, 10);
  }
  return { name: titleCase(q), stocks };
}
