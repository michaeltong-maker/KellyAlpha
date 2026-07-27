export type Tag =
  | 'US Stocks' | 'HK Stocks' | 'Japan' | 'A-Shares'
  | 'Value Investor' | 'Quant' | 'Macro' | 'Semiconductor'
  | 'AI' | 'Energy' | 'Healthcare' | 'Crypto' | 'Earnings'
  | 'Options' | 'Dividends' | 'ETFs' | 'News' | 'Sentiment';

export type Frequency = 'Hourly' | 'Every 4 hours' | 'Daily' | 'Weekdays 09:30' | 'Weekly Monday' | 'Monthly';

export type ToolKey =
  | 'youtube_transcript'
  | 'news_fetcher'
  | 'tavily_search'
  | 'sec_filings'
  | 'price_quote'
  | 'reddit_scan'
  | 'twitter_scan'
  | 'fundamentals'
  | 'pdf_reader'
  | 'calendar_earnings';

export interface StartingNode {
  kind: 'starting';
  id: string;
  name: string;
  description: string;
  variables: { key: string; label: string; type: 'stock' | 'url' | 'text' | 'number'; example?: string }[];
  frequency: Frequency;
}

export interface WorkingNode {
  kind: 'working';
  id: string;
  name: string;
  description: string;
  prompt: string;
  tools: ToolKey[];
  expectedOutput: string;
}

export interface NotifyingNode {
  kind: 'notifying';
  id: string;
  name: string;
  description: string;
  channels: ('in_app' | 'telegram')[];
  format: 'chat_summary_pdf' | 'chat_only' | 'pdf_only' | 'md_only';
}

export type TaskNode = StartingNode | WorkingNode | NotifyingNode;

export interface AgentTask {
  nodes: TaskNode[];
}

export type Personality = 'Analytical' | 'Cautious' | 'Bold' | 'Sardonic' | 'Cheerful' | 'Stoic' | 'Curious' | 'Skeptical';
export type Tone = 'Formal' | 'Conversational' | 'Concise' | 'Detailed';
export type Temperament = 'Methodical' | 'Spontaneous' | 'Patient' | 'Energetic';

export interface Agent {
  id: string;
  name: string;        // friendly first name shown prominently in lists, e.g. "Jim", "Mariana"
  title?: string;      // expertise / topic line shown below the name, e.g. "Semiconductor Pulse Sentinel"
  avatarSeed: string;
  description: string;
  creator: string;
  isPublic: boolean;
  tags: Tag[];
  personality: Personality;
  tone: Tone;
  temperament: Temperament;
  task: AgentTask;
  memory: string[];        // long-term memory entries
  uploadedDocs: { name: string; size: string; addedAt: string }[];
  nextRunAt: string;       // ISO
  unread: number;
  tokensTotal: number;
  tokensPerTask: number;
  duplicates: number;
  rating: number;          // 0..5
  reviews: { user: string; stars: number; comment: string; at: string }[];
  editorsChoice?: boolean;
  fullDescription?: string;
  howToUse?: string;
  tips?: string;
  isFavourite?: boolean;
  pitch?: string;  // ~10-word selling point shown on Editor's Choice cards
  // Optional language overrides. Base fields are English; `zh` supplies the
  // Traditional-Chinese version of any displayed field. Applied centrally in
  // useApp so screens never mix languages.
  i18n?: { zh?: Partial<Omit<Agent, 'i18n'>> };
}

export interface ChatMessage {
  id: string;
  agentId: string;
  role: 'user' | 'agent';
  text: string;
  at: string;
  resultId?: string;        // when present, the message text renders with the Result's stock chips inline
  attachment?: {
    kind: 'pdf' | 'md';
    name: string;
    resultId?: string;
  };
}

export interface ActivityItem {
  id: string;
  agentId: string;
  title: string;
  summary: string;
  at: string;
  attachment?: { kind: 'pdf' | 'md'; name: string };
  keywords: string[];
}

export interface StockMention {
  symbol: string;     // e.g. NVDA, 0700.HK
  name: string;       // e.g. NVIDIA Corp
  market: Market;
  price?: number;     // captured at result generation time
  changePct?: number; // optional intraday move
}

// A first-class output produced by an agent run. Replaces the old "activity item":
// every meaningful agent action emits a Result, which can be opened, exported, or
// referenced by chat messages.
export interface Result {
  id: string;
  agentId: string;
  title: string;          // 6–10 word headline
  summary: string;        // 1–3 sentence chat-style takeaway
  body: string;           // full markdown body (multiple sections)
  at: string;             // ISO timestamp
  keywords: string[];     // for search / filters
  stocks: StockMention[]; // structured references; chips render inline in the body
  artifactFilename: string; // e.g. "semis-pulse-2026-05-20.md"
  views?: number;           // number of users who have read this report (popularity signal)
  // Optional language overrides; base fields are English. See Agent.i18n.
  i18n?: { zh?: Partial<Omit<Result, 'i18n'>> };
}

export type Market = 'US' | 'HK' | 'JP' | 'CN';

export interface WatchStock {
  symbol: string;            // raw display symbol e.g. AAPL, 0700.HK, 7203.T, 600519.SS
  market: Market;
  name: string;
  addedAt: string;           // ISO
  closeOnAdd: number;
  // Live fields (filled at runtime)
  price?: number;
  changePct?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  pe?: number;
  peTTM?: number;
  mktCap?: string;     // display string, mixed currencies (e.g. "HK$3.7T")
  mktCapUsd?: number;  // approx market cap in USD billions — comparable for sorting
  high52?: number;
  low52?: number;
}

// A named watchlist. There is always exactly one default list: the "add to
// watchlist" bubble across the app files into it, and it cannot be deleted.
export interface Watchlist {
  id: string;
  name: string;
  isDefault?: boolean;
  stocks: WatchStock[];
}

// ISO 4217 codes we support for purchase entry. A holding's *current* price is
// always quoted in its market's native currency; a lot's `currency` is only the
// currency the user recorded the purchase price in (defaults to native).
export type Currency = 'USD' | 'HKD' | 'JPY' | 'CNY';

// A single purchase tranche of a holding. Buying more of the same stock adds
// another lot rather than mutating the first — so cost basis stays auditable.
export interface Lot {
  id: string;
  date: string;        // ISO date of purchase
  quantity: number;    // shares bought in this lot
  price: number;       // purchase price per share, in `currency`
  currency: Currency;
}

// One position in the portfolio: a symbol plus one or more purchase lots.
export interface PortfolioHolding {
  symbol: string;
  market: Market;
  name: string;
  lots: Lot[];
  // Live fields (filled at runtime from the quote feed)
  price?: number;      // current price, native market currency
  changePct?: number;  // today's move
}

export interface Portfolio {
  id: string;
  name: string;
  holdings: PortfolioHolding[];
}

export interface Profile {
  name: string;
  email: string;
  avatarSeed: string;
  telegramHandle?: string;
  paymentLast4?: string;
  paymentBrand?: string;
  language?: 'en' | 'zh';
}
