import type { Agent, Result, StockMention, WatchStock } from '../types';

// Topic key derivation — match on the agent's title (expertise) first, then fall back
// to name + description so user-created agents without an explicit title still route.
function topicKey(a: Agent): string {
  const haystack = `${a.title ?? ''} ${a.name} ${a.description ?? ''}`.toLowerCase();
  if (haystack.includes('semiconductor') || haystack.includes('semis')) return 'semis';
  if (haystack.includes('macro morning') || haystack.includes('macro')) return 'macro';
  if (haystack.includes('earnings drift')) return 'earnings';
  if (haystack.includes('hang seng')) return 'hk';
  if (haystack.includes('nikkei')) return 'nikkei';
  if (haystack.includes('a-share') && haystack.includes('liquor')) return 'liquor';
  if (haystack.includes('dividend')) return 'dividends';
  if (haystack.includes('etf')) return 'etf';
  if (haystack.includes('options')) return 'options';
  if (haystack.includes('healthcare')) return 'healthcare';
  if (haystack.includes('energy')) return 'energy';
  if (haystack.includes('ai capex') || haystack.includes('capex')) return 'capex';
  if (haystack.includes('crypto')) return 'crypto';
  if (haystack.includes('reddit')) return 'reddit';
  if (haystack.includes('13f') || haystack.includes('smart money')) return '13f';
  if (haystack.includes('sec filing')) return 'sec';
  if (haystack.includes('youtube') || haystack.includes('transcript')) return 'transcript';
  if (haystack.includes('hong kong ipo') || haystack.includes('ipo')) return 'ipo';
  if (haystack.includes('yen')) return 'yen';
  if (haystack.includes('foreign flow')) return 'flow';
  return 'generic';
}

// Static stock fallback prices (kept in sync with seedWatchlist anchors).
const STOCKS: Record<string, Omit<StockMention, 'price' | 'changePct'> & { price: number }> = {
  NVDA:     { symbol: 'NVDA',     name: 'NVIDIA Corp',         market: 'US', price: 129.14 },
  AAPL:     { symbol: 'AAPL',     name: 'Apple Inc',           market: 'US', price: 223.16 },
  MSFT:     { symbol: 'MSFT',     name: 'Microsoft Corp',      market: 'US', price: 419.96 },
  TSLA:     { symbol: 'TSLA',     name: 'Tesla Inc',           market: 'US', price: 257.69 },
  AVGO:     { symbol: 'AVGO',     name: 'Broadcom Inc',        market: 'US', price: 175.40 },
  TXN:      { symbol: 'TXN',      name: 'Texas Instruments',   market: 'US', price: 198.20 },
  AMZN:     { symbol: 'AMZN',     name: 'Amazon.com Inc',      market: 'US', price: 198.20 },
  GOOGL:    { symbol: 'GOOGL',    name: 'Alphabet Inc',        market: 'US', price: 172.40 },
  META:     { symbol: 'META',     name: 'Meta Platforms',      market: 'US', price: 542.30 },
  AMD:      { symbol: 'AMD',      name: 'Advanced Micro Devices', market: 'US', price: 158.40 },
  KO:       { symbol: 'KO',       name: 'Coca-Cola Co',        market: 'US', price:  64.10 },
  JNJ:      { symbol: 'JNJ',      name: 'Johnson & Johnson',   market: 'US', price: 158.90 },
  INCY:     { symbol: 'INCY',     name: 'Incyte Corp',         market: 'US', price:  68.10 },
  NOW:      { symbol: 'NOW',      name: 'ServiceNow Inc',      market: 'US', price: 940.20 },
  MELI:     { symbol: 'MELI',     name: 'MercadoLibre',        market: 'US', price: 2014.5 },
  '0700.HK':{ symbol: '0700.HK',  name: 'Tencent Holdings',    market: 'HK', price: 402.53 },
  '9988.HK':{ symbol: '9988.HK',  name: 'Alibaba Group',       market: 'HK', price:  85.17 },
  '7203.T': { symbol: '7203.T',   name: 'Toyota Motor Corp',   market: 'JP', price: 2783.98 },
  '6758.T': { symbol: '6758.T',   name: 'Sony Group Corp',     market: 'JP', price: 2982.75 },
  '600519.SS': { symbol: '600519.SS', name: 'Kweichow Moutai', market: 'CN', price: 1488.36 },
};

function s(symbol: string): StockMention {
  return STOCKS[symbol] ?? { symbol, name: symbol, market: 'US', price: undefined as unknown as number };
}

interface Template {
  title: string;
  summary: string;
  keywords: string[];
  stockSymbols: string[];
  body: string;
}

// Topic templates. Bodies are real markdown; stock symbols are written as plain text
// (e.g. NVDA) so the in-app renderer can inject inline chips when the symbol is also
// listed in the result's `stocks` array.
const TEMPLATES: Record<string, Template> = {
  semis: {
    title: 'Daily semis brief: tape firm on AI capex',
    summary: 'Semis tape closed +1.6%. NVDA led on hyperscaler capex commentary; one contrarian inventory read flagged on the analog complex. Conviction held at 7/10.',
    keywords: ['semis', 'AI', 'capex', 'NVDA', 'NVIDIA'],
    stockSymbols: ['NVDA', 'AVGO', 'TXN', 'AMD'],
    body: `## Executive summary

The semiconductor complex traded firm into the close as buy-side desks added to AI-accelerator exposure. Three material news items landed during the session, with one contrarian read on analog inventory that we believe is being under-priced. Our composite signal remained constructive; conviction was unchanged at **7/10**.

## Key findings

1. **NVDA** bid through the morning on guided capex from a top-three hyperscaler — implied accelerator demand re-rated by ~8% versus the consensus path.
2. **AVGO** opened weak on a competitor channel-check leak, then closed +0.4% after the conference-call clarification.
3. Analog: **TXN** inventory days drifted to 165 from 158; this is the second consecutive print of slowing absorption — flagged as a contrarian read.
4. **AMD** held its 20-day on volume; ROCm narrative continues to compound modestly.

## Detailed analysis

The session balance leaned into accelerators and away from analog. Order-book imbalance on **NVDA** spiked to a 60-day high at the open and faded normally into the second hour, suggesting positioning rather than fundamental rotation. **AVGO** weakness was traceable to a single buy-side desk's liquidation flow; the leak narrative does not survive scrutiny once the call clarified ASIC roadmap timing.

The **TXN** read remains the most actionable item: while accelerator capex is now consensus, the slowdown in absorption among industrial and auto end-markets is being treated as a temporary destocking story rather than a demand event. We disagree.

## Risks & considerations

Primary risk to the constructive accelerator view is a hyperscaler capex air-pocket if any of the top-three issue softer Q4 guidance during the upcoming print. Secondary risk on the contrarian analog read is a reacceleration in auto-tier-one orders that would reset our inventory-days framework. Both monitored explicitly in next run.

## Methodology

Tools used: \`news_fetcher\`, \`tavily_search\`, \`fundamentals\`. Conviction expressed on a 0–10 institutional scale.
`,
  },
  macro: {
    title: 'Cross-asset morning read',
    summary: 'US 2s10s held inversion; DXY defended the 50-day; equities opened risk-on and faded by the European close. Bias unchanged.',
    keywords: ['macro', 'rates', 'FX', 'cross-asset'],
    stockSymbols: [],
    body: `## Executive summary

Cross-asset action was muted and consistent with a holding-pattern macro tape. The 2s10s remained inverted by 18bps with curve momentum flat. DXY held its 50-day moving average. Equities opened risk-on but faded into the European close. Our regime model did not shift; bias is **unchanged**.

## Key findings

- **Rates** — 2s10s -18bps, 5s30s +12bps. Curve carry trade unchanged.
- **FX** — DXY 104.6, held 50d at 104.2. JPY weakness slowed; offshore CNY stable.
- **Equities** — S&P opened risk-on (+0.6%), faded to +0.1%. Breadth narrowed in the afternoon.
- **Commodities** — Brent held \\$84; gold absorbed the yield move.

## Detailed analysis

The most informative signal of the session was the fade of the morning risk-on impulse. Without a catalyst, this typically reflects positioning rather than fundamentals — a useful confirmation that the buy-side is no longer carrying a meaningful directional book into the next FOMC. Curve action confirmed: the front-end repriced the December-cut probability higher, while the long-end was indifferent.

## Risks & considerations

A surprise pickup in services PCE later this week is the primary upside risk to yields. A meaningful upside surprise in the carry-trade unwind (JPY squeeze) would trigger a regime-shift alert; we are monitoring 1-month implied vol for early warning.

## Methodology

Cross-asset framework with 1-week, 1-month, and 3-month windows. Tools used: \`news_fetcher\`, \`price_quote\`.
`,
  },
  earnings: {
    title: 'Three post-earnings drift setups added',
    summary: 'MSFT day-2 drift positive on light volume. Three drift setups added to the watchlist; NOW and MELI flagged as cleanest entries.',
    keywords: ['earnings', 'drift', 'MSFT', 'NOW', 'MELI'],
    stockSymbols: ['MSFT', 'NOW', 'MELI'],
    body: `## Executive summary

The post-earnings drift composite added **three new setups** today. **MSFT** day-2 drift remained positive on light volume. We continue to see asymmetric pay-off on the long-drift side when the reaction-day move clears the implied-move band by less than 30%.

## Key findings

1. **MSFT** — day-2 drift +0.8%, ATR-normalised drift +0.4σ. Sell-side desk lean dovish on the buyback cadence; we read that as priced-in.
2. **NOW** — pre-announce timing tells; institutional accumulation pattern intact.
3. **MELI** — beat-and-raise drift entry triggered, R/R 3.2:1 to first profit target.

## Detailed analysis

The **MSFT** setup is canonical: reaction-day gap-and-go was contained to about 60% of the implied move; that pattern historically delivers a positive drift across the subsequent five sessions in 71% of cases (n=84, 4-year sample). We are positioned with a small drift overlay sized to 0.4× ATR.

**NOW**: institutional ownership has been net-buying since the last quarter's flush. Volume profile is constructive: each weakness has been absorbed inside the daily VWAP. We see the next material print as the catalyst, not the upcoming analyst day.

**MELI** ran the table on guide-raise plus margin beat. Drift entry triggered at the reaction-day close; first profit target is the 1.5× implied move level.

## Risks & considerations

Drift setups are sensitive to macro factor exposure. A sharp yield move that decouples growth from rates would degrade our R/R. Position-sizing constrained to 0.4× ATR per name; basket target gross 8% of book.
`,
  },
  hk: {
    title: 'Sentiment slips on property completion delays',
    summary: 'Hang Seng -0.4%; property sub-index -1.4σ; composite sentiment slipped 58 → 42 on completion-delay headlines. Northbound flow neutral.',
    keywords: ['hk', 'sentiment', 'property', '0700.HK', '9988.HK'],
    stockSymbols: ['0700.HK', '9988.HK'],
    body: `## Executive summary

The Hang Seng closed weaker on property-led pressure. The composite sentiment score slipped from 58 to 42 on a wave of property completion-related headlines. Northbound flow was flat. Our HK regime remains *risk-neutral with a downside tilt*.

## Key findings

- Property sub-index lagged the broad index by 1.4 standard deviations.
- Composite sentiment: 58 → 42 across 480 news items.
- Northbound flow: net HK\\$+0.3B, well below the 20-day average of HK\\$+2.1B.
- Volatility: HSI 1-month vol +1.2 points; skew steepened.

## Detailed analysis

The property weakness was concentrated in mid-cap developers with August completion exposure. Headline density on "completion delay" terms jumped 3.4× versus the 30-day baseline. Importantly, the share-price reaction was less severe than the headline density would imply on the same-day basis — this is consistent with the buy-side having de-risked in advance.

**0700.HK** and **9988.HK** diverged for the second consecutive session, with **0700.HK** outperforming on the gaming-revenue read-through. We continue to favour Tencent over Alibaba on a relative-value basis but our absolute view on the platform complex remains neutral.

## Risks & considerations

A material policy response on property — either via a state-buy programme or a developer-specific support package — would flip our regime. We are monitoring official-press headline patterns daily for early warning.
`,
  },
  liquor: {
    title: 'Northbound flow turns positive on liquor',
    summary: 'Northbound flow $+1.1B; concentration in Moutai and Wuliangye. Aligns with prior memory.',
    keywords: ['a-share', 'liquor', 'northbound', 'flow'],
    stockSymbols: ['600519.SS'],
    body: `## Executive summary

Northbound flow turned net positive on the A-share liquor complex for the first time in 11 sessions. **600519.SS** absorbed roughly 60% of the inflow on the day; secondary names also bid. This aligns with the prior cycle's read on completed destocking.

## Key findings

- Net northbound flow: **+¥1.1B** across the liquor sub-sector.
- **600519.SS** concentration: 60% of the day's flow.
- Distributor inventory check: down 1.2 weeks vs trailing 30d.

## Detailed analysis

The flow turn matches our calibrated destocking model. Distributor inventory readings have been declining for three consecutive weeks; we view this as a leading indicator of restocking demand. Risk: a sharp PBOC-driven CNY move could invert the carry component of the trade and reverse flow direction.
`,
  },
  dividends: {
    title: 'Two new aristocrat-screen entrants',
    summary: 'KO and JNJ unchanged. Two new aristocrat-screen entrants this cycle; cash-flow coverage above 2.1x across the basket.',
    keywords: ['dividends', 'income', 'screen', 'cash-flow'],
    stockSymbols: ['KO', 'JNJ'],
    body: `## Executive summary

The aristocrat screen added two new entrants this cycle. Existing names **KO** and **JNJ** held position. Free-cash-flow coverage across the basket is now above 2.1x — the highest reading in 4 years.

## Key findings

- Two new entrants screening clean.
- **KO** unchanged: yield 3.1%, FCF coverage 2.4x.
- **JNJ** unchanged: yield 3.0%, FCF coverage 2.6x.
- Basket-wide coverage: 2.13x (vs 1.85x prior cycle).

## Detailed analysis

The composition shift continues toward consumer staples and pharma. We remain neutral on rate sensitivity — duration-adjusted total returns are slightly behind the broad equity index over the trailing 12 months, in line with our risk model.
`,
  },
  etf: {
    title: 'SOXX absorbs flow; XLE decouples from spot',
    summary: 'SOXX absorbed +$420M; XLE flows decoupled from spot. Watch the curve, not the headline.',
    keywords: ['etf', 'flows', 'sectors', 'soxx', 'xle'],
    stockSymbols: [],
    body: `## Executive summary

Two narratives stood out in today's US ETF flows. **SOXX** absorbed $+420M even as the underlying chopped — bullish persistence signal. **XLE** flows decoupled from spot, suggesting positioning rather than fundamental rotation.

## Key findings

- SOXX: +$420M net inflow, 5-day average +$210M.
- XLE: -$210M net outflow against +0.4% spot.
- QQQ: balanced.
- IWM: -$80M, fifth consecutive day of outflow.

## Detailed analysis

The SOXX absorption is the cleaner signal: chop-and-bid against persistent inflow historically resolves higher. The XLE decoupling deserves more attention — we read it as macro funds repositioning around the curve rather than commodity demand softening.
`,
  },
  options: {
    title: 'Front-week IV richens into print',
    summary: 'META calls richening into print; skew flattens. Front-week IV +1.8 vols. Calendar spreads screen cheap.',
    keywords: ['options', 'iv', 'skew', 'calendars'],
    stockSymbols: ['META'],
    body: `## Executive summary

Front-week IV +1.8 vols across the screen. **META** calls richening into print; skew flattened. Calendar spreads — short front, long back — screen cheap relative to the trailing 60-day distribution.

## Key findings

- Front-week IV: +1.8 vols.
- META front-week skew: -2.4σ flatter.
- Calendar candidates: 7 names with positive carry.
- Realized vol vs implied: implied premium intact at 2.1 vols.

## Detailed analysis

The flattening skew on META suggests the call wing is being bid by event-positioning rather than tail-hedging. We prefer to express via calendars: front-week short, second-week long, with a delta-neutral overlay sized to 0.5% NAV.
`,
  },
  healthcare: {
    title: 'Three PDUFA dates this week',
    summary: 'Three PDUFA dates this week. INCY is the most market-moving on prior reaction studies.',
    keywords: ['healthcare', 'pdufa', 'biotech', 'catalysts'],
    stockSymbols: ['INCY'],
    body: `## Executive summary

Three PDUFA dates land this week. **INCY** is historically the most market-moving on prior reaction studies (~12% median absolute move). Two others are smaller-cap and binary.

## Key findings

- INCY: Wednesday PDUFA, prior median absolute move 12%.
- Two small-cap binary catalysts later in the week.
- Implied moves: 9-14% range; we read INCY's as slightly under-priced.

## Detailed analysis

We prefer asymmetric exposure via short-dated call spreads on INCY sized to 0.3% NAV. The small-cap names are intentionally avoided — implied moves there embed slippage risk that erodes expected value.
`,
  },
  energy: {
    title: 'API build offsets brent fade',
    summary: 'API surprise build of 4.3M bbl; product builds offset crude. Brent rejected at 200d. No change in regime.',
    keywords: ['energy', 'inventory', 'brent', 'oil'],
    stockSymbols: [],
    body: `## Executive summary

API surprise build of **4.3M bbl** against a -1.5M consensus. Product builds offset crude on a refining basis. Brent rejected the 200-day moving average; no change to our regime call.

## Key findings

- Crude API: +4.3M bbl (vs -1.5M consensus).
- Product builds: gasoline +1.2M, distillate +2.1M.
- Brent: rejected 200d at $86.20.
- Refinery utilization: 91.4%, in line.

## Detailed analysis

The product-build offset is the under-discussed item. Refining margins remain elevated on a 5-year basis; weakening crack spreads would change our integrated-major preference. For now, we maintain a neutral stance on E&Ps and a relative-value preference for integrated names.
`,
  },
  capex: {
    title: 'Hyperscaler capex guides cluster at +28% YoY',
    summary: 'Hyperscaler capex guides cluster at +28% YoY. Mix shifting toward custom silicon; NVDA accelerator share remains constructive.',
    keywords: ['ai', 'capex', 'hyperscaler', 'NVDA'],
    stockSymbols: ['NVDA', 'AMD', 'AVGO', 'GOOGL'],
    body: `## Executive summary

Top-three hyperscaler capex guides cluster at **+28% YoY** for the next four quarters. Mix is shifting toward custom silicon, but **NVDA** accelerator share commentary remained constructive on call language.

## Key findings

- Capex guides: +27%, +29%, +28% YoY across the three.
- Custom silicon mix: rising at 1.5pp/quarter.
- **NVDA** language: "demand exceeds supply" repeated, unchanged.
- **AMD** ramp on MI300 series: steeper than buyside consensus.

## Detailed analysis

The custom silicon mix shift is real but is a multi-year story rather than a near-term overhang on accelerator demand. **GOOGL** is the most explicit on TPU roadmap; even there, the absolute dollar growth for **NVDA** is positive.

## Risks & considerations

A single-quarter capex air-pocket would reset positioning materially. We monitor the next print explicitly.
`,
  },
  nikkei: {
    title: 'Momentum cluster narrows to seven names',
    summary: 'Momentum cluster shrunk from 14 to 7 names. Crowding indicator suggests reducing gross, not adding.',
    keywords: ['japan', 'nikkei', 'momentum', 'quant'],
    stockSymbols: ['7203.T', '6758.T'],
    body: `## Executive summary

The Nikkei momentum cluster narrowed from **14 names to 7** over the last five sessions. Our crowding indicator now reads 78% — a level historically followed by gross reduction, not addition.

## Key findings

- Cluster size: 14 → 7 over 5d.
- Crowding: 78% (75th percentile trigger at 72%).
- **7203.T** and **6758.T** continue to anchor the cluster.

## Detailed analysis

Narrowing-with-crowding is the canonical late-cycle pattern for cross-sectional momentum. We are reducing gross within the cluster by 20% and maintaining an offsetting low-vol overlay. Risk: a fresh broadening would invalidate our gross-down call; we reassess weekly.
`,
  },
  generic: {
    title: 'Three material items surfaced',
    summary: 'Three material items surfaced; one contrarian read flagged; conviction held vs prior cycle.',
    keywords: ['scheduled', 'run'],
    stockSymbols: [],
    body: `## Executive summary

The agent's scheduled run completed without exceptions. Three material items were surfaced across the watched universe. One contrarian read was flagged for the operator. Overall conviction relative to the prior cycle is unchanged.

## Key findings

1. Item #1: directional catalyst with above-average historical accuracy. Magnitude consistent with the prior cycle.
2. Item #2: cross-asset confirmation present. Action under review by the operator.
3. Item #3: contrarian read against current positioning. Flagged for follow-up.

## Detailed analysis

The agent processed inputs against its long-term memory and the prior cycle's findings. Where prior conviction errors are recorded, the agent biases against repeating the same mistake — this is encoded in the calibration layer rather than left to ad-hoc reasoning.

The most material item this cycle is the contrarian read; while individual contrarian reads have lower hit-rates than consensus reads, the asymmetry of pay-off when correct justifies the operator's explicit review.

## Risks & considerations

Primary risk: the dataset window may not capture a regime shift that occurs between runs. The agent therefore widens its confidence interval when the prior 24h saw above-average headline density.
`,
  },
};

function filenameFor(agent: Agent, when: Date): string {
  const dateSlug = when.toISOString().split('T')[0];
  // Prefer the expertise title (e.g. "semiconductor-pulse-sentinel") for portability;
  // fall back to the friendly first name only if no title is set (user-created agents).
  const slug = (agent.title ?? agent.name).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  return `${slug}-${dateSlug}.md`;
}

function buildResult(agent: Agent, template: Template, liveStocks?: WatchStock[]): Result {
  const now = new Date();
  // Enrich stock mentions with live prices if available.
  const stocks: StockMention[] = template.stockSymbols.map((sym) => {
    const base = s(sym);
    const live = liveStocks?.find((w) => w.symbol === sym);
    return {
      ...base,
      price: live?.price ?? base.price,
      changePct: live?.changePct,
    };
  });
  return {
    id: `result-${agent.id}-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    agentId: agent.id,
    title: template.title,
    summary: template.summary,
    body: template.body,
    at: now.toISOString(),
    keywords: template.keywords,
    stocks,
    artifactFilename: filenameFor(agent, now),
  };
}

// Sample (marketing) result shown on the Marketplace agent detail. Deterministic by topic.
export function createSampleResult(agent: Agent, liveStocks?: WatchStock[]): Result {
  const key = topicKey(agent);
  const template = TEMPLATES[key] ?? TEMPLATES.generic;
  return buildResult(agent, template, liveStocks);
}

// A fresh result produced by a manual run / scheduled run. Same topic template for now;
// in a real system this would call the agent's task pipeline.
export function createRunResult(agent: Agent, liveStocks?: WatchStock[]): Result {
  return createSampleResult(agent, liveStocks);
}

// Serialize a Result to plain markdown text for export (Obsidian-friendly).
export function resultToMarkdown(result: Result, agent: Agent): string {
  const stockTable = result.stocks.length === 0
    ? '_No specific tickers referenced._'
    : result.stocks.map((st) => {
        const ccy = st.market === 'US' ? '$' : st.market === 'HK' ? 'HK$' : '¥';
        const priceStr = st.price !== undefined ? `${ccy}${st.price.toFixed(2)}` : 'price unavailable';
        return `- **${st.name}** (${st.symbol}) — ${priceStr}`;
      }).join('\n');

  const byline = agent.title ? `${agent.name} (${agent.title})` : agent.name;
  return `# ${result.title}

*${new Date(result.at).toLocaleString()} · by ${byline} · ${agent.creator}*

> ${result.summary}

---

## Stocks referenced

${stockTable}

## Tags

${result.keywords.map((k) => `#${k.replace(/\s+/g, '_')}`).join(' ')}

---

${result.body}

---

_Confidential. For operator review only. © AlphaWalk_
`;
}

export function generateMarkdownBlob(result: Result, agent: Agent): { blobUrl: string; filename: string } {
  const md = resultToMarkdown(result, agent);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  return { blobUrl: URL.createObjectURL(blob), filename: result.artifactFilename };
}
