import type { Result } from '../types';
import { SEED_AGENTS } from './seedAgents';
import { createSampleResult } from '../lib/result';
import { PERSONAL_DESK_REPORTS } from './seedDeskReports';

function isoAgo(min: number): string {
  return new Date(Date.now() - min * 60_000).toISOString();
}

// Seed one result per top-12 agent, staggered across the last ~3 days so the Desk
// looks lived-in and the Today / Yesterday / older date dividers all show up.
// Buckets: 0-3 today (recent hours), 4-7 yesterday (≈ 26-44h ago), 8-11 the day
// before (≈ 50-72h ago).
const OFFSETS_MIN = [
  8, 55, 145, 320,             // today: ~8 min .. ~5h ago
  26 * 60 + 30, 30 * 60, 36 * 60, 42 * 60,       // yesterday
  50 * 60, 56 * 60 + 10, 64 * 60, 70 * 60 + 40,  // day before
];

// Shared demo body for the Li Ming reports — per the spec, every report opens
// with the same detail content; only the title + timestamp vary so the list
// looks populated without needing 9 unique mock briefs. Base text is English; the
// Traditional-Chinese (繁體) version is supplied via the result i18n.zh override.
const LI_MING_BODY = '## One-line read\nNorthbound funds kept buying; liquor and new energy were added to, with the focus on whether prices can hold the moving average after a higher open.\n\n## Three key observations\n1. **Northbound funds**: net inflows of roughly RMB 3.8bn yesterday, concentrated in liquor leaders and the battery supply chain.\n2. **Overseas markets**: the Nasdaq firmed in the overnight session and semiconductors broadly rose.\n3. **Sector rotation**: consumer sentiment is repairing while healthcare remains soft.\n\n## Risk note\n- A rebound in US Treasury yields could pressure growth-sector valuations.\n- Watch for an intraday open-high, close-low pattern.';
const LI_MING_BODY_ZH = '## 盤前一句話\n北向資金延續淨流入，白酒、新能源被加倉，關注高開後能否守住均線。\n\n## 三條最重要觀察\n1. **北向資金**：昨日淨流入約 38 億元，集中在白酒龍頭與電池產業鏈。\n2. **外盤**：納指夜盤走強，半導體板塊普遍上漲。\n3. **板塊輪動**：消費板塊情緒修復，醫藥板塊仍偏弱。\n\n## 風險提示\n- 美債收益率回升可能壓制成長板塊估值。\n- 關注盤中是否出現高開低走。';
const LI_MING_SUMMARY = 'Northbound funds posted net inflows of roughly RMB 3.8bn yesterday, concentrated in liquor and new-energy names. Overseas markets firmed this morning, so the A-share market may open modestly higher; watch whether liquor can hold its 5-day moving average.';
const LI_MING_SUMMARY_ZH = '北向資金昨日淨流入約 38 億元，集中加倉白酒與新能源板塊。今早外盤走強，A 股有望小幅高開；關注白酒板塊能否站穩 5 日均線。';
const LI_MING_KEYWORDS = ['Northbound funds', 'Liquor', 'New energy', 'A-Shares', 'Pre-open'];
const LI_MING_KEYWORDS_ZH = ['北向資金', '白酒', '新能源', 'A股', '盤前'];
const LI_MING_STOCKS = [
  { symbol: '600519.SS', name: 'Kweichow Moutai', market: 'CN' as const, price: 1454.25, changePct: 0.28 },
  { symbol: '300750.SZ', name: 'CATL', market: 'CN' as const, price: 215.80, changePct: 1.12 },
];
const LI_MING_STOCKS_ZH = [
  { symbol: '600519.SS', name: '貴州茅台', market: 'CN' as const, price: 1454.25, changePct: 0.28 },
  { symbol: '300750.SZ', name: '寧德時代', market: 'CN' as const, price: 215.80, changePct: 1.12 },
];
// Reusable i18n.zh override for every Li Ming report — shared like the body above.
const LI_MING_I18N = { zh: { summary: LI_MING_SUMMARY_ZH, body: LI_MING_BODY_ZH, keywords: LI_MING_KEYWORDS_ZH, stocks: LI_MING_STOCKS_ZH } };
// 8 follow-on titles, staggered across the last ~4 weeks. Each uses the same
// shared body above. Titles are realistic A-share morning-watch headlines; the
// Traditional-Chinese title is carried alongside for the i18n.zh override.
const LI_MING_HISTORY: { title: string; titleZh: string; minutesAgo: number; filename: string }[] = [
  { title: 'A-Share Open Watch: STAR Market sentiment heats up sharply', titleZh: 'A 股開盤觀察：科創板情緒顯著升溫',         minutesAgo: 60 * 24 * 3 + 90,  filename: 'a-share-morning-watch-2026-05-18.md' },
  { title: 'A-Share Pre-Open: growth sectors keep leading',               titleZh: 'A 股早盤：成長板塊繼續領跑',               minutesAgo: 60 * 24 * 5 + 30,  filename: 'a-share-morning-watch-2026-05-16.md' },
  { title: 'A-Share Pre-Open Brief: northbound funds turn to net outflow', titleZh: 'A 股盤前簡報：北向資金轉為淨流出',          minutesAgo: 60 * 24 * 7 + 45,  filename: 'a-share-morning-watch-2026-05-14.md' },
  { title: 'A-Share Open Watch: consumer-sector sentiment repairs',        titleZh: 'A 股開盤觀察：消費板塊情緒修復',           minutesAgo: 60 * 24 * 9 + 10,  filename: 'a-share-morning-watch-2026-05-12.md' },
  { title: 'A-Share Pre-Open: new-energy vehicle supply chain rises broadly', titleZh: 'A 股早盤：新能源車產業鏈普漲',             minutesAgo: 60 * 24 * 12 + 60, filename: 'a-share-morning-watch-2026-05-09.md' },
  { title: 'A-Share Pre-Open: Shanghai Composite nears its 60-day average', titleZh: 'A 股盤前：滬指接近 60 日均線',             minutesAgo: 60 * 24 * 16 + 15, filename: 'a-share-morning-watch-2026-05-05.md' },
  { title: 'A-Share Open Watch: turnover recovers moderately',            titleZh: 'A 股開盤觀察：量能溫和回升',               minutesAgo: 60 * 24 * 21 + 40, filename: 'a-share-morning-watch-2026-04-30.md' },
  { title: 'A-Share Pre-Open: weaker overseas markets pressure a lower open', titleZh: 'A 股盤前：外盤回落帶來低開壓力',            minutesAgo: 60 * 24 * 27 + 20, filename: 'a-share-morning-watch-2026-04-24.md' },
];

// Hand-crafted demo desk items for the 3 demo agents (Li Ming / Wang Fang / Zhang Wei).
// Base fields are English; the Traditional-Chinese (繁體) version is supplied via the
// result i18n.zh override and applied by the UI when the language is Chinese.
const CHINESE_DEMO_RESULTS: Result[] = [
  {
    id: 'seed-result-zh-1',
    agentId: 'seed-zh-1',
    title: 'A-Share Open Watch: northbound funds keep buying',
    summary: LI_MING_SUMMARY,
    body: LI_MING_BODY,
    at: isoAgo(15),
    keywords: LI_MING_KEYWORDS,
    stocks: LI_MING_STOCKS,
    artifactFilename: 'a-share-morning-watch-2026-05-21.md',
    i18n: { zh: { title: 'A 股開盤觀察：北向資金延續淨流入', summary: LI_MING_SUMMARY_ZH, body: LI_MING_BODY_ZH, keywords: LI_MING_KEYWORDS_ZH, stocks: LI_MING_STOCKS_ZH } },
  },
  // 8 prior Li Ming reports — same body content, different titles + timestamps so
  // the Reports List page looks lived-in.
  ...LI_MING_HISTORY.map((h, i) => ({
    id: `seed-result-zh-1-h${i + 1}`,
    agentId: 'seed-zh-1',
    title: h.title,
    summary: LI_MING_SUMMARY,
    body: LI_MING_BODY,
    at: isoAgo(h.minutesAgo),
    keywords: LI_MING_KEYWORDS,
    stocks: LI_MING_STOCKS,
    artifactFilename: h.filename,
    i18n: { zh: { title: h.titleZh, ...LI_MING_I18N.zh } },
  })),
  {
    id: 'seed-result-zh-2',
    agentId: 'seed-zh-2',
    title: 'Hang Seng Tech Index: a valuation review and outlook on the top three weights',
    summary: 'The Hang Seng Tech Index is up +12% year-to-date, with clear valuation divergence among its top three weights: Tencent at a 17.4x forward PE, near its three-year average; Alibaba at 1.6x EV/Sales, a historical low; and Meituan at 24.6x PE, awaiting delivery-order momentum. Near term we see Tencent and Alibaba as offering the better risk/reward, while Meituan needs the June data.',
    body: [
      '## One-line read',
      'The Hang Seng Tech Index is up +12% year-to-date, with valuation divergence among the top three weights: Tencent near its three-year average, Alibaba at a historical low, and Meituan awaiting its second growth curve.',
      '',
      '## Valuation snapshot (as of yesterday\'s close)',
      '| Company | Code | Forward PE | EV/Sales | 5-year range |',
      '| --- | --- | --- | --- | --- |',
      '| Tencent | 0700.HK | 17.4x | 5.2x | PE 12-22x |',
      '| Alibaba | 9988.HK | 11.8x | 1.6x | PE 9-18x |',
      '| Meituan | 3690.HK | 24.6x | 2.4x | PE 18-45x |',
      '',
      '## Tencent (0700.HK) — near its three-year average, driven by gaming and advertising',
      '- **Valuation**: forward PE 17.4x, near the 2022–2024 average (17.8x) and about 6% below the five-year midpoint.',
      '- **Catalysts**: DNF Mobile gross billings continue to beat expectations; Video Accounts ad load lifts from 1.8% to 2.4%; a moderate regulatory cadence.',
      '- **Risks**: slower-than-expected WeChat Pay internationalization; a slower overseas game-publishing cadence.',
      '- **View**: maintain Overweight, target price HK$420 (19x 2026E PE).',
      '',
      '## Alibaba (9988.HK) — a historical low valuation, with cloud the key variable',
      '- **Valuation**: EV/Sales of 1.6x, in the 5th percentile of its range since 2019; an SOTP breakdown implies a near-zero value for the domestic e-commerce business.',
      '- **Catalysts**: Alibaba Cloud quarterly revenue growth back to double digits (+12% this quarter); Taobao/Tmall GMV turning positive; accelerating buybacks (~5% of market cap for the year).',
      '- **Risks**: the pace of local-services integration; AIDC capex squeezing free cash flow.',
      '- **View**: maintain Overweight, SOTP target price HK$118.',
      '',
      '## Meituan (3690.HK) — valuation still in a pressure zone, awaiting its second growth curve',
      '- **Valuation**: forward PE 24.6x, in the upper-middle of its five-year range; the on-demand retail business has a clear long-term runway, but the near-term profit-release pace is unclear.',
      '- **Catalysts**: food-delivery AOV turning positive year-on-year; flash-purchase order growth holding 30%+; the hotel-and-travel business recovering to 2019 levels.',
      '- **Risks**: competition from Douyin local services; rising rider costs; widening losses in overseas businesses (KeeTa Hong Kong / Brazil).',
      '- **View**: maintain Neutral, awaiting the June food-delivery order data before any switch.',
      '',
      '## Risk note',
      '- A hawkish June Fed meeting would pressure HK liquidity.',
      '- An escalation in US-China tech friction would widen the scope of export controls.',
      '- Persistently weak mainland consumer data would weigh on the sector\'s overall valuation level.',
    ].join('\n'),
    at: isoAgo(60 * 26 + 10),
    keywords: ['Hang Seng Tech', 'HK Stocks', 'Valuation', 'Tencent', 'Alibaba', 'Meituan'],
    stocks: [
      { symbol: '0700.HK', name: 'Tencent', market: 'HK', price: 386.51, changePct: 1.05 },
      { symbol: '9988.HK', name: 'Alibaba', market: 'HK', price: 92.40, changePct: 0.78 },
      { symbol: '3690.HK', name: 'Meituan', market: 'HK', price: 117.20, changePct: 2.34 },
    ],
    artifactFilename: 'hk-tech-index-valuation-2026-05-22.md',
    i18n: {
      zh: {
        title: '恒生科技指數：三大權重股估值梳理與展望',
        summary: '恒生科技年初至今 +12%，前三大權重估值分化明顯：騰訊遠期 PE 17.4x 接近三年均值，阿里 EV/Sales 1.6x 處於歷史低位，美團 PE 24.6x 等待外賣單量兌現。短期我們認為騰訊與阿里風險收益較優，美團需觀察 6 月數據。',
        body: [
          '## 一句話',
          '恒生科技指數年初至今 +12%，前三大權重估值分化：騰訊接近三年均值，阿里處於歷史低位，美團等待第二曲線兌現。',
          '',
          '## 估值快照(截至昨日收盤)',
          '| 公司 | 代碼 | 遠期 PE | EV/Sales | 五年區間 |',
          '| --- | --- | --- | --- | --- |',
          '| 騰訊控股 | 0700.HK | 17.4x | 5.2x | PE 12-22x |',
          '| 阿里巴巴 | 9988.HK | 11.8x | 1.6x | PE 9-18x |',
          '| 美團 | 3690.HK | 24.6x | 2.4x | PE 18-45x |',
          '',
          '## 騰訊(0700.HK)— 接近三年均值，遊戲與廣告雙輪驅動',
          '- **估值**：遠期 PE 17.4x，接近 2022–2024 年均值(17.8x)，較五年中樞低約 6%。',
          '- **催化**：DNF Mobile 流水持續超預期、視頻號廣告變現率從 1.8% 提升至 2.4%、監管節奏溫和。',
          '- **風險**：WeChat Pay 國際化進展低於預期、海外遊戲發行節奏放緩。',
          '- **觀點**：維持「增持」，目標價 HK$420(對應 19x 2026E PE)。',
          '',
          '## 阿里巴巴(9988.HK)— 估值歷史低位，雲業務是關鍵變量',
          '- **估值**：EV/Sales 1.6x，處於 2019 年以來歷史低位 5% 分位；SOTP 拆分隱含國內電商業務估值近乎為零。',
          '- **催化**：阿里雲季度收入增速重回雙位數(本季 +12%)、淘寶/天貓 GMV 轉正、回購加速(全年回購 ~5% 市值)。',
          '- **風險**：本地生活整合節奏、AIDC 資本開支擠壓自由現金流。',
          '- **觀點**：維持「增持」，SOTP 目標價 HK$118。',
          '',
          '## 美團(3690.HK)— 估值仍處壓力區，等待第二曲線兌現',
          '- **估值**：遠期 PE 24.6x，處於五年區間中位偏上；即時零售業務長期空間清晰，但短期利潤釋放節奏不明朗。',
          '- **催化**：外賣 AOV 同比轉正、閃購單量增速維持 30%+、酒旅業務恢復至 2019 年水平。',
          '- **風險**：抖音本地生活競爭、騎手成本回升、出海業務(KeeTa 香港 / 巴西)虧損擴大。',
          '- **觀點**：維持「中性」，等待 6 月外賣單量數據再做切換。',
          '',
          '## 風險提示',
          '- 美聯儲 6 月會議偏鷹，港股流動性承壓。',
          '- 中美科技摩擦升級，出口管制範圍擴圍。',
          '- 內地消費數據持續偏弱，影響整體板塊估值水平。',
        ].join('\n'),
        keywords: ['恒生科技', '港股', '估值', '騰訊', '阿里', '美團'],
        stocks: [
          { symbol: '0700.HK', name: '騰訊控股', market: 'HK' as const, price: 386.51, changePct: 1.05 },
          { symbol: '9988.HK', name: '阿里巴巴', market: 'HK' as const, price: 92.40, changePct: 0.78 },
          { symbol: '3690.HK', name: '美團',       market: 'HK' as const, price: 117.20, changePct: 2.34 },
        ],
      },
    },
  },
  {
    id: 'seed-result-zh-3',
    agentId: 'seed-zh-3',
    title: '"Moutai Index" watch: consumer blue-chip sentiment is repairing',
    summary: 'The "Moutai Index" constituents have risen a cumulative 2.4% over the past three sessions, with Kweichow Moutai drawing roughly RMB 680m of net northbound buying. Channel checks show liquor sell-through improving sequentially, but inventory remains in the upper-middle of its historical range; near term, watch the pace of the valuation switch.',
    body: '## One-line read\nThe "Moutai Index" sentiment is repairing, liquor sell-through is improving sequentially, and there is a clear willingness for northbound funds to buy back.\n\n## Key data points\n- The "Moutai Index" is up a cumulative +2.4% over the past three sessions.\n- Kweichow Moutai drew roughly RMB 680m of net northbound buying.\n- Industry inventory: still in the upper-middle of its historical range; watch June sell-through.\n\n## Risks\n- Whether wholesale prices can stabilize after the holiday is the key variable.',
    at: isoAgo(60 * 50 + 30),
    keywords: ['Moutai Index', 'Liquor', 'Northbound funds', 'Valuation switch'],
    stocks: [
      { symbol: '600519.SS', name: 'Kweichow Moutai', market: 'CN', price: 1454.25, changePct: 0.28 },
      { symbol: '300760.SZ', name: 'Mindray', market: 'CN', price: 284.16, changePct: -0.42 },
    ],
    artifactFilename: 'maotai-index-sentiment-2026-05-19.md',
    i18n: {
      zh: {
        title: '「茅指數」觀察：消費藍籌情緒修復中',
        summary: '「茅指數」成分股近三日累計上漲 2.4%，貴州茅台獲北向資金淨加倉約 6.8 億元。機構調研顯示白酒動銷環比改善，但庫存仍處於歷史中位偏高水平，短期建議關注估值切換節奏。',
        body: '## 一句話\n「茅指數」情緒修復，白酒動銷環比改善，北向回補意願明顯。\n\n## 數據要點\n- 「茅指數」近三日累計 +2.4%。\n- 貴州茅台獲北向資金淨加倉約 6.8 億元。\n- 行業庫存：仍處歷史中位偏高，需關注 6 月動銷。\n\n## 風險\n- 節後批價能否企穩是關鍵變量。',
        keywords: ['茅指數', '白酒', '北向資金', '估值切換'],
        stocks: [
          { symbol: '600519.SS', name: '貴州茅台', market: 'CN' as const, price: 1454.25, changePct: 0.28 },
          { symbol: '300760.SZ', name: '邁瑞醫療', market: 'CN' as const, price: 284.16, changePct: -0.42 },
        ],
      },
    },
  },
];

const englishResults: Result[] = SEED_AGENTS
  .filter((a) => !a.id.startsWith('seed-zh-') && !a.id.startsWith('desk-'))
  .slice(0, 12)
  .map((agent, i) => {
    const base = createSampleResult(agent);
    return {
      ...base,
      id: `seed-result-${i + 1}`,
      at: isoAgo(OFFSETS_MIN[i] ?? 8 + i * 47),
    };
  });

// Give every seeded report a stable, plausible view count (the popularity signal
// the Desk sorts by). Personal reports carry their own explicit counts.
function deterministicViews(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 140 + (h % 3200); // ~140 .. ~3340
}

const publicSeed = [...CHINESE_DEMO_RESULTS, ...englishResults].map((r) => ({
  ...r,
  views: r.views ?? deterministicViews(r.id),
}));

export const SEED_RESULTS: Result[] = [...publicSeed, ...PERSONAL_DESK_REPORTS];
