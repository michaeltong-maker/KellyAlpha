import type { Agent, Result } from '../types';

// The user's own analyst — populates the Personal Desk in the demo. Reports from
// agents the user actually creates or hires also flow into the Personal Desk (the
// Desk derives ownership from userCreatedAgentIds + hiredCopies); this seeded
// agent just guarantees there's something to look at out of the box.
export const PERSONAL_AGENT: Agent = {
  id: 'desk-me',
  name: 'Your Analyst',
  title: 'Personal Desk',
  avatarSeed: 'me-analyst',
  description: 'Your own analyst — files private notes to your Personal Desk.',
  creator: 'You',
  isPublic: false,
  tags: ['US Stocks', 'AI', 'Macro', 'Semiconductor'],
  personality: 'Analytical',
  tone: 'Concise',
  temperament: 'Methodical',
  task: {
    nodes: [
      { kind: 'starting', id: 's1', name: 'Inputs & schedule', description: 'Your watchlist and the run cadence.', variables: [{ key: 'ticker', label: 'Stock code', type: 'stock', example: 'MU' }], frequency: 'Daily' },
      { kind: 'working', id: 'w1', name: 'Gather & synthesize', description: 'Pulls data and writes the note.', prompt: 'Review the portfolio and watchlist, then file the most useful note for today.', tools: ['news_fetcher', 'price_quote', 'fundamentals'], expectedOutput: 'A personal desk note.' },
      { kind: 'notifying', id: 'n1', name: 'Notify', description: 'Files to your Personal Desk.', channels: ['in_app'], format: 'chat_summary_pdf' },
    ],
  },
  memory: [],
  uploadedDocs: [],
  nextRunAt: new Date(Date.now() + 86_400_000).toISOString(),
  unread: 0,
  tokensTotal: 0,
  tokensPerTask: 0,
  duplicates: 0,
  rating: 0,
  reviews: [],
};

// Agent ids the Desk treats as "the user's own" beyond their created/hired agents.
export const PERSONAL_AGENT_IDS: string[] = [PERSONAL_AGENT.id];

function isoAgo(min: number): string {
  return new Date(Date.now() - min * 60_000).toISOString();
}

interface Note {
  id: string;
  title: string;
  summary: string;
  body: string;
  keywords: string[];
  minutesAgo: number;
  views: number;
  file: string;
}

const NOTES: Note[] = [
  {
    id: 'desk-me-1',
    title: 'Portfolio risk check: AI concentration is creeping up',
    summary: 'Your top five holdings are now ~58% of equity, and four of them share the AI-infrastructure factor. A single memory/GPU drawdown would hit most of the book at once — worth a trim or a hedge before earnings season.',
    body: '## One-line read\nThe book has quietly become an AI-infrastructure bet. Diversification is thinner than it looks.\n\n## What changed\n- Top five = ~58% of equity (was ~46% a month ago).\n- Four of five load on the same AI-capex factor.\n- Beta to the SOX has risen with the concentration.\n\n## Suggested action\n- Trim the most-correlated name, or add an index hedge into earnings.\n- Revisit position sizing rules before adding more semis.',
    keywords: ['Portfolio', 'Risk', 'AI', 'Semiconductor'],
    minutesAgo: 3 * 60,
    views: 3,
    file: 'personal-risk-check-2026-06-25.md',
  },
  {
    id: 'desk-me-2',
    title: 'Weekly watchlist review: what moved and why',
    summary: 'Five names on your watchlist moved >5% this week. The common thread was rate sensitivity, not company news — a reminder that the macro tape is driving single-stock moves right now.',
    body: '## One-line read\nThis week was macro, not micro — rate moves explained most of your watchlist swings.\n\n## Movers\n- Three growth names fell with the yield back-up.\n- Two defensives held, as expected.\n\n## Takeaway\n- Keep position sizes modest while the macro tape dominates.\n- Stock-specific theses need a stock-specific catalyst to express.',
    keywords: ['Watchlist', 'Macro', 'Review'],
    minutesAgo: 2 * 24 * 60,
    views: 11,
    file: 'personal-watchlist-review-2026-06-23.md',
  },
  {
    id: 'desk-me-3',
    title: 'MU pre-earnings: my own checklist before the print',
    summary: 'A personal pre-earnings checklist for Micron — what I want to hear on HBM4 yields and FY27 pricing, and the position size I am comfortable carrying into a binary event.',
    body: '## One-line read\nMy MU notes ahead of the print — sizing and the two things that actually matter.\n\n## What I am watching\n- HBM4 yield-ramp commentary (the real swing factor).\n- Any qualitative read on calendar-2027 pricing.\n\n## My plan\n- Carry a half-size position into the print; add only after the FY27 guide.',
    keywords: ['MU', 'Earnings', 'HBM', 'Checklist'],
    minutesAgo: 4 * 24 * 60,
    views: 19,
    file: 'personal-mu-pre-earnings-2026-06-21.md',
  },
  {
    id: 'desk-me-4',
    title: 'Macro dashboard digest: the week ahead',
    summary: 'A condensed read of my macro dashboard: rates, the dollar, and credit spreads. The setup into next week leans risk-off, so I am keeping a little extra cash.',
    body: '## One-line read\nThe dashboard leans risk-off into next week; holding a little extra cash.\n\n## Signals\n- Rates: trending up, growth-negative.\n- Dollar: firm — a headwind for ex-US exposure.\n- Credit: spreads stable, no stress yet.\n\n## Stance\n- Slightly defensive; redeploy on a real pullback.',
    keywords: ['Macro', 'Rates', 'Dashboard'],
    minutesAgo: 9 * 24 * 60,
    views: 5,
    file: 'personal-macro-digest-2026-06-16.md',
  },
];

export const PERSONAL_DESK_REPORTS: Result[] = NOTES.map((n) => ({
  id: n.id,
  agentId: PERSONAL_AGENT.id,
  title: n.title,
  summary: n.summary,
  body: n.body,
  at: isoAgo(n.minutesAgo),
  keywords: n.keywords,
  stocks: [],
  artifactFilename: n.file,
  views: n.views,
}));
