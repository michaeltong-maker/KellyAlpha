import type { Market, StockMention } from '../types';
import type { DirectoryStock } from './stockDirectory';
import type { Quote } from './stocks';

// The analyst byline shown on Stock Search dossiers. Reports here aren't tied to
// a marketplace agent — they're filed by the in-house research desk — so we keep
// a lightweight byline rather than a full Agent object.
export const RESEARCH_BYLINE = 'AlphaWalk Equity Research';
export const RESEARCH_DESK = 'AlphaWalk Research Desk';

// A first-class stock dossier. Mirrors the shape of Result closely enough to reuse
// the dossier renderer (MarkdownView / ConvictionGauge / StockChip), plus a few
// fields specific to Stock Search: the symbol it belongs to, and whether it's
// listed publicly in the per-stock report history.
export interface StockReport {
  id: string;
  symbol: string;
  title: string;
  summary: string;
  body: string;          // full markdown
  at: string;            // ISO generation timestamp
  keywords: string[];
  stocks: StockMention[];
  isPublic: boolean;
  byline: string;
  artifactFilename: string;
  reads: number;          // number of other users who have read this report
}

function ccyFor(m: Market): string {
  return m === 'US' ? '$' : m === 'HK' ? 'HK$' : '¥';
}

function filename(symbol: string, when: Date): string {
  const slug = symbol.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  return `${slug}-equity-research-${when.toISOString().split('T')[0]}.md`;
}

// ---------------------------------------------------------------------------
// Micron (MU) — a real, web-search-grounded dossier following the equity-research
// prompt template. Framed PRE-EARNINGS: Micron reports fiscal Q3 2026 after the
// close on June 24, 2026. Figures labelled trailing/forward, GAAP/non-GAAP, with
// the fiscal period stated. Conviction line ("House conviction: 6/10") drives the
// dossier gauge. Data points sourced from company filings/IR and reporting around
// the June 24, 2026 print.
// ---------------------------------------------------------------------------
const MU_BODY = `> **Conflict-of-interest disclosure.** This dossier concerns a company with a direct commercial and investment relationship to the analyst's parent. On June 10, 2026, Micron and **Anthropic** — the maker of the model that drafts AlphaWalk research — announced a multi-year agreement under which Micron becomes a primary supplier of HBM, DRAM and SSDs for Claude training and inference, bundled with Micron participating in Anthropic's funding round. Treat any statement bearing on the Anthropic relationship as conflicted, and weight independent evidence accordingly.

> **Pre-earnings note.** Written ahead of Micron's fiscal **Q3 2026** report, due after the close on **June 24, 2026** (quarter ended ~May 31, 2026). An imminent print of this magnitude can move several grades below — especially Valuation, Financial Health and Sentiment. Offer stands to re-grade against the actual numbers and the FQ4 guide once reported.

## 1. Investment thesis

Micron is the cleanest public-market expression of the AI memory shortage: high-bandwidth memory (HBM) and high-end DRAM are sold out, pricing is rising, and a three-supplier oligopoly is capturing the scarcity rent. The variant-perception question is not *whether* this is a great business today — the trailing numbers settle that — but *how the market should capitalize peak-cycle earnings*. Bulls argue AI demand has structurally lengthened the cycle, so a high-teens forward multiple on rising estimates is cheap; bears argue memory is still cyclical and an ~81% guided gross margin is, almost by definition, a peak. Horizon: 12–24 months, with a binary catalyst in hours.

- **Overall conviction:** \`3. Hold\` — a high-quality compounder priced for a cycle that has not yet rolled, into an after-close print today. Constructive on the franchise, cautious on entry and timing.
- **House conviction: 6/10.**

### Six-angle scorecard

- **Angle 1 — Competitive position & industry:** **B+**
- **Angle 2 — Valuation:** **B−**
- **Angle 3 — Financial health:** **A**
- **Angle 4 — Stock momentum:** **B**
- **Angle 5 — Management & governance:** **A−**
- **Angle 6 — Sentiment:** **B+**

*The grades are deliberately unbalanced: trailing strength (Financial Health, Management) sits a full tier above the forward-looking risk angle (Valuation). That gap **is** the thesis — see the conventions note at the foot.*

## 2. The business

Micron designs and manufactures memory and storage — principally **DRAM** (the majority of revenue and nearly all of the profit) and **NAND** flash, sold as components, modules, HBM stacks, and SSDs. It is one of three scaled DRAM makers worldwide alongside SK Hynix and Samsung. Revenue is reported across four units: **Cloud Memory**, **Core Data Center**, **Mobile & Client**, and **Automotive & Embedded**.

In the last reported quarter (fiscal **Q2 2026**, GAAP/non-GAAP both records), the segment split was roughly: Cloud Memory ~$7.7B, Mobile & Client ~$7.7B, Core Data Center ~$5.7B, and Auto & Embedded ~$2.7B. **DRAM** revenue was a record ~$18.8B (≈79% of total). The economic engine is data-center memory: combined Cloud + Core Data Center carried gross margins well above the corporate average. Geographically, Micron sells into the US, Taiwan, Japan, mainland China, and Europe; manufacturing spans Taiwan, Idaho, New York, Japan, Singapore, and India.

## 3. Angle 1 — Competitive position & industry  *(Grade: B+)*

The **moat** is a blend of *scale/cost advantage* and *process/IP leadership* operating inside a *consolidated oligopoly* — the most durable structure memory has ever had. Three suppliers now behave with capacity discipline rather than share-grab, which is what allows DRAM gross margins to print in the 70s–80s rather than collapsing on the first sign of slack.

- **Durability — stable-to-widening near term, contested medium term.** The swing factor is the **HBM3E → HBM4** transition. SK Hynix holds first-mover advantage in HBM3E; Micron management has guided to a *faster yield ramp* on HBM4 than it achieved on HBM3E, and reports high-volume HBM4 production aligned to NVIDIA's next-generation (Vera Rubin) platform. If Micron closes the gap, the moat widens; if it stumbles on HBM4 yields, share and mix both leak.
- **Industry structure & cycle:** the HBM market alone is a $60B+ category in 2026 and 2026 HBM capacity is reported **fully sold out**. The honest read is that the sector sits *late-early to mid* in an unusually demand-led upcycle — supply is the binding constraint, not demand. The risk is that the same capex curing the shortage (industry-wide) eventually overshoots.
- **Customer concentration:** AI accelerator demand is concentrated in a handful of hyperscalers and one dominant GPU vendor; the new Anthropic supply arrangement adds another large, named counterparty (and the disclosed conflict).

## 4. Angle 2 — Valuation  *(Grade: B−)*

This is the crux, and the lowest grade for a reason. At a June 23, 2026 close of **$1,051.77** (market cap ≈ **$1.19T**), Micron trades around the **mid-teens on forward FY2026 (ending Aug 2026) EPS** and, on widely-cited sell-side math, **single digits (~9×) on forward FY2027 estimates**. Optically that is cheap for a company growing revenue triple digits year-over-year.

The cyclical caveat dominates: those forward multiples sit on **peak-cycle margins** (FQ3 guided **non-GAAP gross margin ~81%**). Memory has never sustained software-like margins through a full cycle. The disciplined test is the forward multiple against **normalized / mid-cycle** earnings, not the next-twelve-months peak — and on a mid-cycle gross margin (historically 30s–40s), the same share price implies a far richer multiple. The grade is **B−**: genuinely inexpensive *if* the AI cycle is structural and long; expensive *if* it mean-reverts on schedule. The market is paying for the former; prudence underwrites somewhere in between.

## 5. Angle 3 — Financial health  *(Grade: A)*

The trailing balance sheet and cash generation are, simply, excellent — the easiest grade in the dossier.

- **Growth (fiscal Q2 2026, reported Mar 18, 2026):** revenue **$23.86B**, +196% YoY / +75% QoQ; **non-GAAP EPS $12.20** (+682% YoY), beating consensus (~$8.50–$9.00) by ~38%.
- **Profitability:** **non-GAAP gross margin ~74.9–75%**, **non-GAAP operating margin ~69%**, non-GAAP net income ~$14.0B. At these margins ROIC sits far above any reasonable WACC — the cleanest moat confirmation available, with the caveat that it is cycle-peak ROIC.
- **Balance sheet (as of Feb 26, 2026):** cash & investments **$16.7B** vs total debt **$9.56B** — a **net cash position of ~$6.5B**. Operating cash flow **$11.9B**; capex **$5B**; **record adjusted free cash flow ~$6.9B**. The board raised the quarterly dividend **30%** to **$0.15/share** — a confidence signal.
- **Earnings quality / flags:** inventory ended at **$8.3B (~123 days)** — elevated, the classic late-cycle tell to watch, though management frames it as pre-positioning for sold-out HBM. The larger flag is *reflexive*: margins this far above mid-cycle should be treated as transient in any normalization model. FY2026 capex is guided **above $25B**, which both funds the moat and seeds future industry supply.

## 6. Angle 4 — Stock momentum  *(Grade: B)*

Relative strength has been extraordinary: roughly **+750–860% over twelve months** and **~+300% YTD**, among the top performers in the S&P 500 this year. The stock set an all-time closing high (**~$1,211** on June 22, 2026) days before this report. It is, on any measure, **extended**.

The near-term tape just cracked: MU fell ~**12%** on June 23, 2026, in a global, **South-Korea-led semiconductor sell-off** (foreign profit-taking and leveraged-ETF concerns) — macro, not company-specific. Short-term technicals flipped to a sell signal with support cited around **$980–$1,020**. Grade **B**: a powerful primary uptrend, but overbought and freshly wounded going into a binary event.

## 7. Angle 5 — Management & governance  *(Grade: A−)*

CEO/Chairman **Sanjay Mehrotra** and CFO **Mark Murphy** have delivered a credible, disciplined ramp — six consecutive quarters of estimate beats, capacity discipline maintained through the up-cycle, and a dividend raise alongside the investment surge. Capital allocation reads shareholder-aware (dividend + buybacks) while funding a >$25B capex year. The minor mark-down to **A−** reflects governance items to monitor rather than flaws: the scale of the capex commitment, supply-allocation choices across end-markets, and the optics of the equity-linked Anthropic arrangement (see disclosure).

## 8. Angle 6 — Sentiment  *(Grade: B+)*

**Estimate revisions are sharply upward** — the direction that matters more than the level — and price targets have been reset aggressively (multiple desks moving into the **$1,250–$1,550** range, e.g., BofA ~$1,500, Needham ~$1,550, Wolfe ~$1,250). Sell-side framing is broadly *"ignore the sell-off."* Retail voice is loud and bullish. Grade **B+**, not **A**, precisely *because* sentiment is this hot: the revisions tailwind is real, but unanimous bullishness into a peak-margin print is itself a contrarian caution, and at least one technical service has trimmed to *Hold*.

## 9. Recent financials  *(data block — interpretation lives in Angle 3)*

- **Last reported:** fiscal **Q2 2026** (ended Feb 26, 2026; reported Mar 18, 2026). Revenue **$23.86B**; **GAAP** and **non-GAAP** both records; **non-GAAP EPS $12.20**; non-GAAP gross margin **~75%**.
- **Beat/miss:** revenue and EPS beat consensus (~+22% revenue, ~+38% EPS).
- **Forward guidance (fiscal Q3 2026):** revenue **$33.5B ± $750M** (≈+40% QoQ); **non-GAAP gross margin ~81%**; **non-GAAP EPS $19.15 ± $0.40**; opex ~$1.40B on ~1.15B shares.
- **Street vs. company:** consensus for FQ3 sits *above* guidance — roughly **~$35B revenue** and **~$19.7–$20.8 EPS** — so a guidance-level print would technically miss the Street even while setting records. *The beat is largely priced; the FQ4 guide is the real variable.*

## 10. Recent positives

- HBM 2026 capacity **sold out**; HBM4 in high-volume production for next-gen accelerators, with management confident on yield ramp.
- Margins and FCF at records; **net cash** balance sheet; dividend +30%.
- Demand visibility extended by long-term supply agreements (including the disclosed Anthropic deal); management expects tight supply/demand to persist beyond calendar 2026.

## 11. Recent concerns *(counter-thesis: what's already priced in)*

The bear case is not that the quarter will be bad — it will be a record. It is that **a record is the consensus**, and the stock has already advanced ~300% YTD discounting it. The counter-thesis: (1) **peak-margin risk** — an ~81% gross margin guide marks the top of what's plausible, so the next surprise is more likely down than up; (2) **the capex that cures the shortage creates the next glut** — Micron's own >$25B, plus Hynix and Samsung, is building the supply that historically ends memory upcycles; (3) **HBM4 execution** — any yield wobble cedes mix to Hynix; (4) **positioning** — universal bullishness and a fresh all-time high are poor risk/reward into an after-close print. Much of the good news is in the tape; the asymmetry near term skews to disappointment.

## 12. Recent MD&A — tone watch

Management's narrative remains confident and, notably, *less hedged* than in prior memory cycles: the CEO frames memory as "a strategic asset" and explicitly guides to *records again* in FQ3, while the CFO ties the 81% margin to a multi-year AI investment cycle and declines to guide FQ4 gross margin specifically. On a cyclical, **the tone shift usually leads the numbers** — and here the tone is unusually unguarded. That cuts both ways: it is either well-founded confidence in a structural change, or the kind of late-cycle assurance that precedes a roll. The single most informative line on the June 24 call will be any qualitative read on **calendar-2027 HBM pricing and supply** — that, more than the FQ3 beat, sets the next leg.

## Methodology

Framework: AlphaWalk equity-research template (12 sections, six A–F angle grades, 1–5 conviction). Sources favored company filings and IR materials (fiscal Q2 2026 release and earnings call, FQ3 guidance) over aggregators; market data as of the June 23–24, 2026 window. Tools: \`price_quote\`, \`news_fetcher\`, \`sec_filings\`, \`fundamentals\`. Estimates and consensus figures are labelled as such; this is **descriptive analysis, not investment advice**, and not a substitute for a licensed adviser.`;

const MU_REPORT = (when: Date, price: number, changePct?: number, reads = 0): StockReport => ({
  id: `stock-MU-${when.getTime()}`,
  symbol: 'MU',
  title: 'Micron (MU): the cleanest read on the AI memory shortage — into earnings',
  summary:
    'MU is the purest public proxy for the AI memory squeeze: HBM sold out, records on revenue/margin/FCF, a net-cash balance sheet. The debate is capitalizing peak-cycle earnings — cheap on forward EPS, expensive on mid-cycle. Pre-earnings (FQ3 reports after the close June 24); conviction 3/Hold, house 6/10.',
  body: MU_BODY,
  at: when.toISOString(),
  keywords: ['Semiconductor', 'AI', 'HBM', 'DRAM', 'Memory', 'Earnings', 'MU'],
  stocks: [{ symbol: 'MU', name: 'Micron Technology', market: 'US', price, changePct }],
  isPublic: true,
  byline: RESEARCH_BYLINE,
  artifactFilename: filename('MU', when),
  reads,
});

// --- Three shorter, focused Micron notes, to populate "Other reports mentioning
// MU". Each is a real desk note grounded in the same research, filed on an earlier
// date than the flagship dossier so the flagship stays the "Latest summary". ---
const MU_HBM4_BODY = `> Focused competitive note. Companion to the flagship MU dossier.

## The setup

HBM is the prize inside the AI memory cycle, and the **HBM3E → HBM4** transition is where 2027 share gets decided. SK Hynix carried first-mover advantage through HBM3E; the open question is whether **MU** can convert process and packaging execution into HBM4 share.

## What's new

- Micron reports **HBM4 in high-volume production**, aligned to NVIDIA's next-generation (Vera Rubin) platform.
- Management has guided to a **faster yield ramp on HBM4** than it achieved on HBM3E — the single most important operational claim to track.
- 2026 HBM capacity is described as **fully sold out** across the industry; the constraint is supply, not demand.

## Read

If the HBM4 yield ramp lands as guided, MU's mix and margin both improve and the moat widens against a three-player oligopoly. The bear counter is execution risk: any yield wobble cedes share back to Hynix at the worst possible time. House conviction: **7/10** on the franchise, contingent on yield evidence at the next print.

## Risks

Yield disappointment; customer concentration in a handful of accelerator buyers; the capex (industry-wide) that cures today's shortage seeding tomorrow's supply.`;

const MU_PRINT_BODY = `> Pre-earnings positioning note. Companion to the flagship MU dossier.

## The setup

Micron reports fiscal **Q3 2026** after the close on **June 24, 2026** (quarter ended ~May 31). The stock fell ~12% on June 23 in a **South-Korea-led** global chip sell-off — macro, not company-specific — into the print.

## What the tape is pricing

- Street consensus (~$35B revenue, ~$19.7–$20.8 EPS) sits **above** company guidance ($33.5B; non-GAAP EPS $19.15) — so a guide-level print technically misses the Street even while setting records.
- The beat is largely **priced**; the variable that matters is the **FQ4 guide** and any qualitative read on calendar-2027 HBM pricing.
- Sentiment is hot: targets reset to the $1,250–$1,550 range; positioning is crowded long into an all-time high.

## Read

Risk/reward into the event skews to disappointment on positioning, even on a strong quarter. House conviction: **5/10** near-term — constructive franchise, poor entry timing. Re-grade against the actual numbers post-print.

## Risks

A blow-out FQ4 guide invalidates the cautious near-term stance; a soft HBM pricing comment makes the June 23 drop look small.`;

const MU_CYCLE_BODY = `> Cycle / valuation note. Companion to the flagship MU dossier.

## The setup

The whole MU debate reduces to one question: **is an ~81% guided gross margin the top?** Memory has never sustained software-like margins through a full cycle — but the AI build-out may have genuinely lengthened this one.

## The math

- FQ3 guided **non-GAAP gross margin ~81%** is, almost by definition, near a peak.
- At ~$1,050, MU trades mid-teens on **forward FY2026 EPS** and single digits (~9×) on **forward FY2027 EPS** — optically cheap *if* estimates hold.
- On **normalized / mid-cycle** margins (historically 30s–40s), the same price implies a far richer multiple. That gap is the entire bull/bear divide.

## Read

Inexpensive if the cycle is structural and long; expensive if it mean-reverts on schedule. The market is paying for the former. House conviction: **6/10**, with valuation the binding risk rather than the franchise.

## Risks

Capex overshoot (MU >$25B FY26, plus Hynix and Samsung) ending the upcycle; demand air-pocket if hyperscaler capex pauses.`;

interface MuNote {
  slug: string;
  title: string;
  summary: string;
  body: string;
  keywords: string[];
  daysAgo: number;
  reads: number;
}

const MU_NOTES: MuNote[] = [
  {
    slug: 'hbm4',
    title: 'Micron HBM4: closing the gap on SK Hynix',
    summary: 'A focused read on the HBM3E→HBM4 transition — Micron in high-volume HBM4 production for next-gen accelerators, guiding a faster yield ramp than HBM3E. If it lands, the moat widens; if yields wobble, share leaks. House 7/10.',
    body: MU_HBM4_BODY,
    keywords: ['Semiconductor', 'HBM', 'AI', 'MU'],
    daysAgo: 5,
    reads: 876,
  },
  {
    slug: 'into-the-print',
    title: 'Micron into the print: what’s already priced in',
    summary: 'Pre-earnings positioning: consensus sits above guidance, the beat is largely priced, and the stock fell ~12% on a macro sell-off into an all-time high. The FQ4 guide is the real variable. Near-term house 5/10.',
    body: MU_PRINT_BODY,
    keywords: ['Earnings', 'Sentiment', 'Memory', 'MU'],
    daysAgo: 2,
    reads: 1597,
  },
  {
    slug: 'cycle-check',
    title: 'Memory cycle check: is 81% gross margin the top?',
    summary: 'The valuation crux: an ~81% guided gross margin is near a structural peak. Cheap on forward EPS, expensive on mid-cycle earnings — the entire bull/bear divide. House 6/10, valuation the binding risk.',
    body: MU_CYCLE_BODY,
    keywords: ['Valuation', 'Memory', 'Semiconductor', 'MU'],
    daysAgo: 10,
    reads: 342,
  },
];

// Full MU seed set: the flagship dossier (newest → the "Latest summary") plus
// three earlier notes that populate "Other reports mentioning MU".
export function seedMicronReports(): StockReport[] {
  const mu = { symbol: 'MU', name: 'Micron Technology', market: 'US' as Market, anchor: 1051.77 };
  const now = new Date();
  const flagship = MU_REPORT(now, mu.anchor, undefined, 1284);

  const notes = MU_NOTES.map((n): StockReport => {
    const when = new Date(now.getTime() - n.daysAgo * 86_400_000);
    return {
      id: `stock-MU-note-${n.slug}`,
      symbol: 'MU',
      title: n.title,
      summary: n.summary,
      body: n.body,
      at: when.toISOString(),
      keywords: n.keywords,
      stocks: [{ symbol: 'MU', name: 'Micron Technology', market: 'US', price: mu.anchor }],
      isPublic: true,
      byline: RESEARCH_BYLINE,
      artifactFilename: filename(`MU-${n.slug}`, when),
      reads: n.reads,
    };
  });

  return [flagship, ...notes];
}

// ---------------------------------------------------------------------------
// Generic dossier for any other ticker. The structure follows the same template;
// content is a scaffold filled with the stock's identity and live price. (In a
// production build this is where the agent task pipeline / model call would run.)
// ---------------------------------------------------------------------------
function genericBody(stock: DirectoryStock, ccy: string, price?: number): string {
  const px = price !== undefined ? `${ccy}${price.toFixed(2)}` : 'the current quote';
  return `> **Generated dossier.** This is a structural research scaffold for **${stock.name} (${stock.symbol})**, produced on demand from the AlphaWalk equity-research template. Unlike the desk's flagship coverage, it is not yet grounded in live filings — treat the sections below as the framework to fill, not finished analysis. Re-run once primary sources are attached.

## 1. Investment thesis

State in 2–3 sentences why one would own **${stock.symbol}** now — the suspected mispricing, the return drivers, and the horizon. Everything below should support or challenge it.

- **Overall conviction:** \`3. Hold\` *(placeholder pending grounded analysis)*
- **House conviction: 5/10.**

### Six-angle scorecard

- **Angle 1 — Competitive position & industry:** —
- **Angle 2 — Valuation:** —
- **Angle 3 — Financial health:** —
- **Angle 4 — Stock momentum:** —
- **Angle 5 — Management & governance:** —
- **Angle 6 — Sentiment:** —

## 2. The business

What ${stock.name} sells, how it makes money, and who pays — with revenue by segment and geography, and unit economics where relevant.

## 3. Angle 1 — Competitive position & industry

Competitors and the moat (type and durability), industry structure and cycle position, customer/supplier concentration.

## 4. Angle 2 — Valuation

Valuation vs. peers — specify **trailing vs. forward**, **GAAP vs. non-GAAP**, and the **fiscal year**. For cyclicals, test the forward multiple against normalized earnings.

## 5. Angle 3 — Financial health

Growth, profitability (margins, ROIC vs. WACC), balance sheet (net debt/EBITDA, liquidity, maturities), and earnings quality.

## 6. Angle 4 — Stock momentum

Price trend and relative strength; ${stock.symbol} last traded near ${px}. Note how extended or oversold it is.

## 7. Angle 5 — Management & governance

Recent management changes, track record, insider ownership and alignment, compensation, governance flags.

## 8. Angle 6 — Sentiment

Retail voice, sell-side coverage and estimate-revision direction, short interest, institutional ownership changes.

## 9. Recent financials

Latest reported revenue and profit (GAAP and non-GAAP), the period covered, beat/miss vs. consensus, and forward guidance.

## 10. Recent positives

The strengthening parts of the thesis from recent news and results.

## 11. Recent concerns

The bear case and what's already priced in, framed as a counter-thesis.

## 12. Recent MD&A — tone watch

Management's narrative on results, guidance and risk language, with attention to changes in tone versus prior filings.

## Methodology

AlphaWalk equity-research template. This scaffold was generated locally and is **descriptive, not investment advice**, and not a substitute for a licensed adviser.`;
}

// Build a fresh report for any directory stock. MU returns the grounded dossier;
// every other ticker returns the structured scaffold. `quote` (when available)
// stamps the report with the price at generation time.
export function createStockReport(stock: DirectoryStock, quote?: Quote | null): StockReport {
  const when = new Date();
  const price = quote?.price ?? stock.anchor;
  const changePct = quote?.changePct;
  if (stock.symbol === 'MU') return MU_REPORT(when, price, changePct);

  const ccy = ccyFor(stock.market);
  return {
    id: `stock-${stock.symbol}-${when.getTime()}-${Math.random().toString(36).slice(2, 6)}`,
    symbol: stock.symbol,
    title: `${stock.name} (${stock.symbol}) — equity research dossier`,
    summary: `A structured equity-research scaffold for ${stock.name}, generated from the AlphaWalk template. Attach primary sources and re-run for grounded analysis.`,
    body: genericBody(stock, ccy, price),
    at: when.toISOString(),
    keywords: [marketTag(stock.market), 'Earnings', stock.symbol],
    stocks: [{ symbol: stock.symbol, name: stock.name, market: stock.market, price, changePct }],
    isPublic: true,
    byline: RESEARCH_BYLINE,
    artifactFilename: filename(stock.symbol, when),
    reads: 0,
  };
}

function marketTag(m: Market): string {
  return m === 'US' ? 'US Stocks' : m === 'HK' ? 'HK Stocks' : m === 'JP' ? 'Japan' : 'A-Shares';
}

// Serialize a StockReport to standalone markdown for download.
export function stockReportToMarkdown(r: StockReport): string {
  const st = r.stocks[0];
  const ccy = st ? ccyFor(st.market) : '';
  const priceLine = st?.price !== undefined
    ? `${st.name} (${st.symbol}) · ${ccy}${st.price.toFixed(2)}${st.changePct !== undefined ? ` (${st.changePct >= 0 ? '+' : ''}${st.changePct.toFixed(2)}%)` : ''}`
    : `${st?.name ?? r.symbol} (${r.symbol})`;
  return `# ${r.title}

*${new Date(r.at).toLocaleString()} · ${r.byline} · ${RESEARCH_DESK}*

**${priceLine}**

> ${r.summary}

---

${r.body}

---

_Tags: ${r.keywords.map((k) => `#${k.replace(/\s+/g, '_')}`).join(' ')}_

_Confidential. Descriptive analysis, not investment advice. © AlphaWalk_
`;
}
