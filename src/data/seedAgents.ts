import type { Agent, Tag, ToolKey, Personality, Tone, Temperament, Frequency } from '../types';
import { seedSeeds } from '../lib/avatars';
import { PERSONAL_AGENT } from './seedDeskReports';

// Stylised suffix used in the title (expertise) line, paired with the topic title.
const TITLE_SUFFIXES = [
  'Sentinel', 'Watchtower', 'Vanguard', 'Compass', 'Pulse', 'Lookout', 'Beacon', 'Atlas', 'Helios', 'Orion',
  'Nimbus', 'Quanta', 'Vector', 'Apex', 'Lyra', 'Polaris', 'Mercator', 'Stellar', 'Cipher', 'Bedrock',
  'Marina', 'Veritas', 'Argus', 'Fathom', 'Ledger', 'Auric', 'Mosaic', 'Tempo', 'Cascade', 'Forge',
  'Echo', 'Onyx', 'Tessera', 'Indigo', 'Sage', 'Quill', 'Harbinger', 'Lattice', 'Aperture', 'Halcyon',
];

// Friendly first names assigned to seeded agents. Reflects a global team feel and
// includes a few notable investor-flavoured names (Warren, Cathie, Howard, Ray, Stanley…)
// without ever pairing those names with the actual person's surname.
const FIRST_NAMES = [
  'Jim', 'Warren', 'Cathie', 'Jason', 'Howard', 'Stanley', 'Bill', 'Ray', 'Charlie', 'Peter',
  'Mariana', 'Sarah', 'Karen', 'Anne', 'Lisa', 'Emily', 'Grace', 'Iris', 'Olivia', 'Lily',
  'Akiko', 'Ken', 'Wei', 'Kai', 'Yuki', 'Hiro', 'Jin', 'Mei', 'Min', 'Hana',
  'Sofia', 'Carlos', 'Maria', 'Diego', 'Elena', 'Lucas', 'Camila', 'Mateo', 'Valentina', 'Tomas',
  'Priya', 'Raj', 'Arjun', 'Anika', 'Vikram', 'Aisha', 'Kwame', 'Zainab', 'Femi', 'Imani',
];

const TOPICS: { title: string; tags: Tag[]; pitch: string }[] = [
  { title: 'Semiconductor Pulse', tags: ['US Stocks', 'Semiconductor', 'AI'], pitch: 'Catch every meaningful semis tape move within the first hour.' },
  { title: 'Macro Morning Brief', tags: ['Macro', 'News'], pitch: 'Five-minute macro read so you start the day informed.' },
  { title: 'Earnings Drift Hunter', tags: ['US Stocks', 'Earnings'], pitch: 'Find post-earnings drift setups before the crowd does.' },
  { title: 'Hang Seng Sentiment', tags: ['HK Stocks', 'Sentiment'], pitch: 'Track Hang Seng sentiment across news, headlines, and flows.' },
  { title: 'Nikkei Quant Edge', tags: ['Japan', 'Quant'], pitch: 'Quant signals that surface narrow Nikkei momentum clusters early.' },
  { title: 'A-Share Liquor Watch', tags: ['A-Shares', 'Value Investor'], pitch: 'Northbound flow alerts across the A-share liquor complex.' },
  { title: 'Dividend Aristocrat Scan', tags: ['US Stocks', 'Dividends', 'Value Investor'], pitch: 'Screen aristocrats with cash-flow coverage above two-times reliably.' },
  { title: 'ETF Flow Tracker', tags: ['ETFs', 'Macro'], pitch: 'See where US ETF dollars rotated overnight by velocity.' },
  { title: 'Options IV Crusher', tags: ['Options', 'US Stocks'], pitch: 'Surface rich front-week IV and clean calendar-spread candidates.' },
  { title: 'Healthcare Catalyst Radar', tags: ['Healthcare', 'US Stocks'], pitch: 'PDUFA dates and trial readouts that actually move stocks.' },
  { title: 'Energy Inventory Read', tags: ['Energy', 'Macro'], pitch: 'API and EIA inventory takeaways with brent positioning weekly.' },
  { title: 'AI Capex Monitor', tags: ['AI', 'Semiconductor', 'US Stocks'], pitch: 'Hyperscaler capex deltas and the silicon implications they imply.' },
  { title: 'Crypto Liquidations Brief', tags: ['Crypto', 'Sentiment'], pitch: 'Daily crypto liquidations digest with funding-rate signals included.' },
  { title: 'Reddit Sentiment Sweep', tags: ['Sentiment', 'US Stocks'], pitch: 'Reddit mention velocity and polarity for the names you watch.' },
  { title: '13F Smart Money Digest', tags: ['Value Investor', 'US Stocks'], pitch: 'Track Loeb, Burry, and Greenblatt deltas every filing cycle.' },
  { title: 'SEC Filing Sentinel', tags: ['US Stocks', 'News'], pitch: 'Flag the 8-K and S-1 filings that materially move tickers.' },
  { title: 'YouTube Earnings Transcript Hunter', tags: ['Earnings', 'US Stocks'], pitch: 'Earnings transcripts distilled to the three guidance changes that matter.' },
  { title: 'Hong Kong IPO Tracker', tags: ['HK Stocks', 'News'], pitch: 'Monitor Hong Kong IPO pipeline with subscription multiples and pricing.' },
  { title: 'Japan Yen Carry Watch', tags: ['Japan', 'Macro'], pitch: 'Carry-trade unwind risk read with yen positioning and BoJ calendar.' },
  { title: 'A-Share Foreign Flow Read', tags: ['A-Shares', 'Macro'], pitch: 'Daily foreign flow tally with thematic concentration calls included.' },
];

const PERSONALITY: Personality[] = ['Analytical', 'Cautious', 'Bold', 'Sardonic', 'Cheerful', 'Stoic', 'Curious', 'Skeptical'];
const TONE: Tone[] = ['Formal', 'Conversational', 'Concise', 'Detailed'];
const TEMPER: Temperament[] = ['Methodical', 'Spontaneous', 'Patient', 'Energetic'];
const FREQ: Frequency[] = ['Hourly', 'Every 4 hours', 'Daily', 'Weekdays 09:30', 'Weekly Monday', 'Monthly'];
const CREATORS = ['AlphaWalk Studio', 'M. Chen', 'R. Tanaka', 'J. Wong', 'A. Petrov', 'S. Okafor', 'L. Park', 'D. Hassan', 'V. Iyer', 'K. Lim'];

const TOOLS: ToolKey[][] = [
  ['news_fetcher', 'tavily_search'],
  ['sec_filings', 'fundamentals'],
  ['youtube_transcript', 'news_fetcher'],
  ['price_quote', 'fundamentals'],
  ['reddit_scan', 'twitter_scan', 'news_fetcher'],
  ['calendar_earnings', 'fundamentals', 'price_quote'],
];

const PROMPT_TEMPLATES = [
  'Given {{ticker}}, summarize the latest 24h of price action, the three most material news items, and one contrarian read.',
  'Scan SEC filings filed after the last run. Flag anything materially new for {{ticker}}.',
  'Pull the most recent earnings call transcript for {{ticker}} and extract the three guidance changes that matter most.',
  'Fetch headlines for {{ticker}} and rank by impact on the next 5 sessions. Cite each.',
  'Aggregate Reddit and X chatter for {{ticker}}. Score sentiment 0–100 and surface concrete catalysts.',
  'Build a one-pager: valuation snapshot, three bull arguments, three bear arguments, and the consensus next-quarter EPS path.',
];

const HOW_TO_USE = [
  'Add a ticker, set frequency to Weekdays 09:30, and review the morning brief in chat. Attached PDF mirrors the summary.',
  'Pin this agent and let it run weekly. Read the long-term memory tab before earnings season.',
  'Pair this with a watchlist of 3–5 names. The agent self-prunes its memory if a thesis breaks.',
];

const TIPS = [
  'Upload your own thesis as a PDF — the agent will reference it in every report.',
  'Use the Telegram channel for after-hours notifications; in-app for daytime.',
  'The agent improves after ~5 runs as long-term memory thickens.',
];

function rand<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function isoIn(minutes: number): string {
  return new Date(Date.now() + minutes * 60000).toISOString();
}

function isoAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

// Hand-crafted demo agents with a Traditional-Chinese (繁體) localization override.
// Base fields are English; the i18n.zh block is applied by the UI when the language
// is Chinese. Appended after the procedural ones so they always appear in Editor's
// Choice and surface a few showcase cards / detail pages alongside the English roster.
const CHINESE_DEMO_AGENTS: Agent[] = [
  {
    id: 'seed-zh-1',
    name: 'Li Ming',
    title: 'A-Share Pre-Open Watch',
    avatarSeed: 'cn-li-ming',
    description: 'Five minutes before the A-share open — northbound flows, sector rotation, and the top-trader board at a glance.',
    creator: 'Shanghai Creator Studio',
    isPublic: true,
    tags: ['A-Shares', 'Macro', 'Sentiment'],
    personality: 'Analytical',
    tone: 'Concise',
    temperament: 'Methodical',
    task: {
      nodes: [
        { kind: 'starting' as const, id: 's1', name: 'Inputs & schedule', description: 'Collects stock codes and the run frequency.', variables: [{ key: 'ticker', label: 'Stock code', type: 'stock' as const, example: '600519.SS' }], frequency: 'Weekdays 09:30' },
        { kind: 'working' as const, id: 'w1', name: 'Gather & synthesize', description: 'Writes the brief from news and market-tape data.', prompt: 'Summarize last night\'s overseas markets, net northbound inflows, and sector turnover concentration, then give the three most important pre-open observations.', tools: ['news_fetcher', 'price_quote', 'fundamentals'], expectedOutput: 'A structured pre-open brief.' },
        { kind: 'notifying' as const, id: 'n1', name: 'Notify', description: 'Delivers the brief via in-app push.', channels: ['in_app' as const], format: 'chat_summary_pdf' as const },
      ],
    },
    memory: ['User follows fund flows in the consumer and new-energy sectors.', 'The market traded with a firm, range-bound tone over the past week.', 'Northbound funds posted net inflows over the last five sessions.'],
    uploadedDocs: [],
    nextRunAt: isoIn(45),
    unread: 1,
    tokensTotal: 124_800,
    tokensPerTask: 1_650,
    duplicates: 312,
    rating: 4.7,
    reviews: [
      { user: 'Private Fund Analyst', stars: 5, comment: 'Read it in five minutes pre-open and you are ready for the session — very high signal density.', at: isoAgo(60 * 24 * 5) },
      { user: 'Quant Zhang', stars: 4, comment: 'Suggest adding a sector breakdown to the northbound-flow figures.', at: isoAgo(60 * 24 * 2) },
    ],
    editorsChoice: true,
    fullDescription: 'Li Ming is a concise, rigorous pre-open briefing agent. Every trading day at 09:15 it automatically scans the A-share pre-open headlines — northbound flows, sector turnover, the top-trader board, and theme rotation — and pushes a five-minute brief before the open.',
    howToUse: 'Add the stocks or sectors you follow and set it to run every trading day at 09:15. The brief is delivered automatically via in-app push.',
    tips: 'Upload your holdings list (PDF) and the brief will automatically highlight the fund flows relevant to your positions.',
    isFavourite: true,
    pitch: 'Five minutes pre-open — read where the big money is moving.',
    i18n: {
      zh: {
        name: '李明',
        title: 'A股早盤觀察哨',
        description: 'A股盤前 5 分鐘 — 北向資金、板塊輪動、龍虎榜一目了然。',
        creator: '上海創作者工作室',
        task: {
          nodes: [
            { kind: 'starting' as const, id: 's1', name: '輸入與時間表', description: '收集股票代碼與運行頻率。', variables: [{ key: 'ticker', label: '股票代碼', type: 'stock' as const, example: '600519.SS' }], frequency: 'Weekdays 09:30' },
            { kind: 'working' as const, id: 'w1', name: '匯總與分析', description: '通過新聞與盤口數據寫出簡報。', prompt: '總結昨夜外盤、北向資金淨流入、板塊成交集中度，給出三條最重要的開盤觀察。', tools: ['news_fetcher', 'price_quote', 'fundamentals'], expectedOutput: '一份結構化的開盤簡報。' },
            { kind: 'notifying' as const, id: 'n1', name: '通知', description: '通過應用內推送簡報。', channels: ['in_app' as const], format: 'chat_summary_pdf' as const },
          ],
        },
        memory: ['用戶關注消費與新能源板塊的資金動向。', '過去一週市場處於震盪偏強格局。', '北向資金近五日累計淨流入。'],
        reviews: [
          { user: '私募研究員', stars: 5, comment: '盤前 5 分鐘讀完就能上盤，信號密度很高。', at: isoAgo(60 * 24 * 5) },
          { user: '量化老張', stars: 4, comment: '北向資金口徑建議加一個板塊明細。', at: isoAgo(60 * 24 * 2) },
        ],
        fullDescription: '李明是一位簡潔、嚴謹的中文盤前簡報智能體，每個交易日 09:15 自動開始掃描 A 股盤前要聞 — 北向資金、板塊成交、龍虎榜以及題材輪動 — 並在開盤前推送一份 5 分鐘可讀的中文簡報。',
        howToUse: '添加你關注的股票或板塊，設置每個交易日 09:15 運行。簡報會自動通過應用內推送。',
        tips: '上傳你的持倉清單 (PDF)，簡報會自動重點標註與持倉相關的資金動向。',
        pitch: '盤前 5 分鐘 — 讀懂主力動向。',
      },
    },
  },
  {
    id: 'seed-zh-2',
    name: 'Wang Fang',
    title: 'HK Sector Compass',
    avatarSeed: 'cn-wang-fang',
    description: 'Southbound flows, Hang Seng and HS Tech sector sentiment — one refined read each day.',
    creator: 'Heung Kong Data Lab',
    isPublic: true,
    tags: ['HK Stocks', 'Sentiment', 'Macro'],
    personality: 'Cautious',
    tone: 'Detailed',
    temperament: 'Patient',
    task: {
      nodes: [
        { kind: 'starting' as const, id: 's1', name: 'Inputs & schedule', description: 'The HK sectors you follow and the run frequency.', variables: [{ key: 'sector', label: 'Sector', type: 'text' as const, example: 'Hang Seng Tech' }], frequency: 'Daily' },
        { kind: 'working' as const, id: 'w1', name: 'Gather & synthesize', description: 'Combines southbound flows, news, and broker ratings.', prompt: 'Summarize the day\'s southbound flows, Hang Seng and HS Tech sector sentiment, and major brokerage research changes, then output a brief of under 800 words.', tools: ['news_fetcher', 'fundamentals', 'price_quote'], expectedOutput: 'A daily HK sector brief.' },
        { kind: 'notifying' as const, id: 'n1', name: 'Notify', description: 'Delivers via in-app push.', channels: ['in_app' as const], format: 'chat_summary_pdf' as const },
      ],
    },
    memory: ['User prefers the Hang Seng Tech and new-economy sectors.', 'Southbound funds posted net inflows over the last five sessions.', 'Watching broker rating changes on Tencent and Meituan.'],
    uploadedDocs: [],
    nextRunAt: isoIn(180),
    unread: 0,
    tokensTotal: 96_300,
    tokensPerTask: 1_420,
    duplicates: 268,
    rating: 4.5,
    reviews: [
      { user: 'HK Market Veteran', stars: 5, comment: 'The southbound-flow framing is very clear — good to read once before every open.', at: isoAgo(60 * 24 * 3) },
    ],
    editorsChoice: true,
    fullDescription: 'Wang Fang is a patient, detail-oriented HK sector agent. Each day it tracks southbound fund flows and the sector sentiment of the Hang Seng Tech and Hang Seng China Enterprises indices, then combines broker ratings and Hong Kong media headlines into a daily brief of under 800 words.',
    howToUse: 'Set the sectors you follow (Hang Seng Tech, consumer, healthcare, etc.) and it generates a brief automatically at 4:30 pm each trading day.',
    tips: 'Link the brief to your HK watchlist and alerts will automatically flag the fund flows relevant to your positions.',
    isFavourite: false,
    pitch: 'Southbound flows + sector sentiment — one refined read.',
    i18n: {
      zh: {
        name: '王芳',
        title: '港股板塊動向羅盤',
        description: '南向資金、恒指與恒科板塊情緒 — 每日一份精煉讀本。',
        creator: '香江數據社',
        task: {
          nodes: [
            { kind: 'starting' as const, id: 's1', name: '輸入與時間表', description: '關注的港股板塊與頻率。', variables: [{ key: 'sector', label: '板塊', type: 'text' as const, example: '恒生科技' }], frequency: 'Daily' },
            { kind: 'working' as const, id: 'w1', name: '匯總與分析', description: '整合南向資金、新聞與大行評級。', prompt: '匯總當日南向資金、恒指與恒科板塊情緒，以及主要券商研報變化，輸出 800 字以內的中文簡報。', tools: ['news_fetcher', 'fundamentals', 'price_quote'], expectedOutput: '一份當日港股板塊簡報。' },
            { kind: 'notifying' as const, id: 'n1', name: '通知', description: '通過應用內推送。', channels: ['in_app' as const], format: 'chat_summary_pdf' as const },
          ],
        },
        memory: ['用戶偏好恒生科技與新經濟板塊。', '最近南向資金五日淨流入。', '關注大行對騰訊、美團評級調整。'],
        reviews: [
          { user: '港股老司機', stars: 5, comment: '南向資金口徑很清晰，適合每天開盤前讀一遍。', at: isoAgo(60 * 24 * 3) },
        ],
        fullDescription: '王芳是一位耐心、注重細節的港股板塊智能體，每日追蹤南向資金流向、恒生科技與恒生中國企業指數的板塊情緒，並結合大行評級與香港媒體頭條，輸出一份每日 800 字以內的中文簡報。',
        howToUse: '設置關注的板塊 (恒生科技、消費、醫藥等)，每個交易日下午 4:30 自動生成中文簡報。',
        tips: '把簡報與你的港股自選股關聯，提醒會自動標註與持倉相關的資金流向。',
        pitch: '南向資金 + 板塊情緒 — 一份精煉讀本。',
      },
    },
  },
  {
    id: 'seed-zh-3',
    name: 'Zhang Wei',
    title: 'Moutai-Index Sentiment Radar',
    avatarSeed: 'cn-zhang-wei',
    description: 'The "Moutai Index" — sentiment and institutional position shifts across liquor, healthcare, and new-energy core assets.',
    creator: 'Beijing Quant Group',
    isPublic: true,
    tags: ['A-Shares', 'Value Investor', 'Sentiment'],
    personality: 'Skeptical',
    tone: 'Conversational',
    temperament: 'Energetic',
    task: {
      nodes: [
        { kind: 'starting' as const, id: 's1', name: 'Inputs & schedule', description: 'The "Moutai Index" constituents you follow.', variables: [{ key: 'ticker', label: 'Stock code', type: 'stock' as const, example: '600519.SS' }], frequency: 'Daily' },
        { kind: 'working' as const, id: 'w1', name: 'Gather & synthesize', description: 'Aggregates news, research, and northbound adds and trims.', prompt: 'Track sentiment on the "Moutai Index" constituents, brokerage rating changes, and net northbound inflows, then generate a daily watch note.', tools: ['news_fetcher', 'reddit_scan', 'fundamentals'], expectedOutput: 'A daily "Moutai Index" watch note.' },
        { kind: 'notifying' as const, id: 'n1', name: 'Notify', description: 'Delivers via in-app push.', channels: ['in_app' as const], format: 'chat_summary_pdf' as const },
      ],
    },
    memory: ['User has a long-running focus on liquor leaders and healthcare CXOs.', 'Sentiment on the "Moutai Index" has been soft over the past three months.', 'Northbound flows into consumer blue chips have been volatile.'],
    uploadedDocs: [],
    nextRunAt: isoIn(420),
    unread: 2,
    tokensTotal: 88_100,
    tokensPerTask: 1_580,
    duplicates: 224,
    rating: 4.6,
    reviews: [
      { user: 'Value Investor', stars: 5, comment: 'Pairs sentiment with northbound data nicely — well suited to long-horizon tracking.', at: isoAgo(60 * 24 * 6) },
    ],
    editorsChoice: true,
    fullDescription: 'Zhang Wei is a slightly skeptical "Moutai Index" watcher. Each day it tracks sentiment, research changes, and northbound adds and trims across core assets in liquor, healthcare, and new energy, then writes a daily watch note in a lightly conversational style.',
    howToUse: 'Set the "Moutai Index" constituents you follow (e.g. Kweichow Moutai, CATL, Mindray) and it generates a watch note automatically after the close each day.',
    tips: 'Upload your research or field notes as a PDF and the agent will fold them into its long-term memory.',
    isFavourite: true,
    pitch: '"Moutai Index" sentiment + northbound flows — a daily watch.',
    i18n: {
      zh: {
        name: '張偉',
        title: '茅指數輿情雷達',
        description: '「茅指數」 — 白酒、醫藥、新能源核心資產輿情與機構調倉動向。',
        creator: '北京量化小組',
        task: {
          nodes: [
            { kind: 'starting' as const, id: 's1', name: '輸入與時間表', description: '關注的「茅指數」成分股。', variables: [{ key: 'ticker', label: '股票代碼', type: 'stock' as const, example: '600519.SS' }], frequency: 'Daily' },
            { kind: 'working' as const, id: 'w1', name: '匯總與分析', description: '匯總新聞、研報與北向加減倉。', prompt: '追蹤「茅指數」成分股的輿情、券商評級變化、北向資金淨流入，生成一份每日觀察筆記。', tools: ['news_fetcher', 'reddit_scan', 'fundamentals'], expectedOutput: '「茅指數」每日觀察筆記。' },
            { kind: 'notifying' as const, id: 'n1', name: '通知', description: '通過應用內推送。', channels: ['in_app' as const], format: 'chat_summary_pdf' as const },
          ],
        },
        memory: ['用戶長期關注白酒龍頭與醫藥 CXO。', '「茅指數」過去三個月情緒偏弱。', '北向資金對消費藍籌存在波動。'],
        reviews: [
          { user: '價值投資人', stars: 5, comment: '輿情與北向數據結合得不錯，適合長線觀察。', at: isoAgo(60 * 24 * 6) },
        ],
        fullDescription: '張偉是一位帶點懷疑視角的「茅指數」觀察者，每天追蹤白酒、醫藥、新能源等核心資產的輿情、研報變化與北向加減倉動向，並以略帶口語的中文寫出一份每日觀察筆記。',
        howToUse: '設置你關注的「茅指數」成分股(如貴州茅台、寧德時代、邁瑞醫療)，每日收市後自動生成觀察筆記。',
        tips: '把你的研報或調研筆記作為 PDF 上傳，智能體會把它納入長期記憶。',
        pitch: '「茅指數」輿情 + 北向資金 — 每日觀察。',
      },
    },
  },
];

export const SEED_AGENTS: Agent[] = [PERSONAL_AGENT, ...CHINESE_DEMO_AGENTS, ...seedSeeds.map((seed, i): Agent => {
  const topic = TOPICS[i % TOPICS.length];
  // The expertise line — formerly the agent's full name; preserved so existing
  // topic-key matching (sample reports, marketplace card variants, etc.) continues
  // to function.
  const titleSuffix = TITLE_SUFFIXES[i % TITLE_SUFFIXES.length];
  const title = `${topic.title} ${titleSuffix}`;
  const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
  const personality = rand(PERSONALITY, i);
  const tone = rand(TONE, i + 3);
  const temperament = rand(TEMPER, i + 5);
  const freq = rand(FREQ, i + 7);
  const tools = TOOLS[i % TOOLS.length];
  const prompt = PROMPT_TEMPLATES[i % PROMPT_TEMPLATES.length];
  const creator = rand(CREATORS, i + 2);
  const editor = i % 10 === 0; // ~10 editor's choice
  const duplicates = Math.round(((Math.sin(i * 1.7) + 1) / 2) * 480 + (editor ? 200 : 20));
  const rating = +(4 + ((i % 11) / 10) - 0.5).toFixed(1);
  const tokensTotal = 18_000 + (i * 1373) % 220_000;
  const tokensPerTask = 1_200 + (i * 137) % 2_800;
  const unread = i % 7 === 0 ? (1 + (i % 3)) : 0;

  return {
    id: `seed-${i + 1}`,
    name: firstName,
    title,
    avatarSeed: seed,
    description: `${topic.title} — runs ${freq.toLowerCase()}, focused on ${topic.tags.join(', ')}.`,
    creator,
    isPublic: true,
    tags: topic.tags,
    personality,
    tone,
    temperament,
    task: {
      nodes: [
        {
          kind: 'starting', id: 's1', name: 'Inputs & schedule', description: 'Collects user-defined inputs and triggers the run.',
          variables: [{ key: 'ticker', label: 'Stock code', type: 'stock', example: 'NVDA' }],
          frequency: freq,
        },
        {
          kind: 'working', id: 'w1', name: 'Gather & synthesize', description: 'Pulls data through assigned tools and writes the analysis.',
          prompt, tools, expectedOutput: 'A structured brief with citations and a single conviction statement.',
        },
        {
          kind: 'notifying', id: 'n1', name: 'Notify', description: 'Delivers the brief.',
          channels: ['in_app'], format: 'chat_summary_pdf',
        },
      ],
    },
    memory: [
      `Initial calibration completed on inputs (${freq.toLowerCase()}).`,
      `Observed regime: ${rand(['risk-on', 'risk-off', 'choppy', 'trend-up', 'mean-reverting'], i)}.`,
      `User cares about ${topic.tags[0]} signal quality over volume.`,
    ],
    uploadedDocs: i % 5 === 0 ? [{ name: 'Thesis_v3.pdf', size: '342 KB', addedAt: isoAgo(60 * 24 * 4) }] : [],
    nextRunAt: isoIn(20 + (i * 13) % 600),
    unread,
    tokensTotal,
    tokensPerTask,
    duplicates,
    rating: Math.min(5, Math.max(3.5, rating)),
    reviews: [
      { user: 'pmtrader', stars: 5, comment: 'Tight, signal-rich. Saves me 40 min every morning.', at: isoAgo(60 * 24 * 7) },
      { user: 'longshort', stars: 4, comment: 'Wish the bear-case section had more depth.', at: isoAgo(60 * 24 * 3) },
    ],
    editorsChoice: editor,
    fullDescription: `${topic.title} is a ${tone.toLowerCase()}, ${personality.toLowerCase()} agent that runs ${freq.toLowerCase()}. It assembles a single, structured brief using ${tools.join(', ')} and keeps a running long-term memory of regime shifts, your stated preferences, and prior conviction errors. Designed for one-shot, repeatable use — drop a ticker in and read the result.`,
    howToUse: rand(HOW_TO_USE, i),
    tips: rand(TIPS, i + 1),
    isFavourite: [0, 2, 5, 9, 14].includes(i), // a few starter favourites so the filter has content
    pitch: topic.pitch,
  };
})];
