import type { ActivityItem } from '../types';
import { SEED_AGENTS } from './seedAgents';

const TITLES = [
  'Morning brief: NVDA bid into open',
  'Earnings drift: MSFT day-2 read',
  'Hang Seng sentiment: property tape softens',
  'Nikkei quant: momentum cluster narrows to 7 names',
  'A-share liquor: northbound flow turns positive',
  'Dividend aristocrats: KO, JNJ unchanged, ADP added',
  'ETF flows: SOXX +$420M, XLE -$210M',
  'Options IV: META calls richening into print',
  'Healthcare catalysts: 3 PDUFA dates this week',
  'Energy: API surprise build, brent fades',
  'AI capex: hyperscaler Q3 commentary digest',
  'Crypto liquidations: ETH long unwind cleared',
  'Reddit sentiment: PLTR mention velocity +38%',
  '13F digest: Loeb, Burry, Greenblatt deltas',
  'SEC sentinel: 8-K flurry from regional banks',
];

const SUMMARIES = [
  'Pre-market bid driven by Asia tape; flagged one contrarian read on inventory commentary; conviction held at 7/10.',
  'Day-2 drift positive but volume light; sell-side desk notes lean dovish. No change to thesis.',
  'Property sub-index lagged 1.4σ; sentiment slipped from 58 → 42 on news flow about completions.',
  'Momentum cluster shrunk from 14 to 7; suggests crowding rather than broadening — reduce gross.',
  'Northbound flow $+1.1B; concentration in CR Beer and Wuliangye; aligns with prior memory.',
  'Two new entrants on the aristocrat screen; one removal; cash-flow coverage all > 2.1x.',
  'SOXX absorbed flows even as price chopped; XLE flows decoupled from spot — watch curve.',
  'Front-week IV +1.8 vols; skew flattening; calendar spread short-front-long-back screens cheap.',
  'Three PDUFA dates calendared; INCY most market-moving on prior reaction studies.',
  'API build of 4.3M bbl; product builds offset crude; brent rejected at 200dma.',
  'Hyperscaler capex guides cluster at +28% YoY; mix shifting toward custom silicon.',
  '$240M ETH longs cleared overnight; perp basis renormalizes; bias neutral.',
  'PLTR mention velocity +38% w/w; positive polarity 64%; no change to underlying thesis yet.',
  'Loeb added two semis names; Burry exited consumer staples; Greenblatt deltas immaterial.',
  '8-K flurry in regional banks; majority benign (auditor changes); flagged 2 for follow-up.',
];

const KEYWORDS = [
  ['nvda', 'semis', 'pre-market'],
  ['msft', 'earnings', 'drift'],
  ['hsi', 'property', 'sentiment'],
  ['nikkei', 'momentum', 'quant'],
  ['a-share', 'liquor', 'flows'],
  ['dividends', 'screen', 'income'],
  ['etf', 'flows', 'sectors'],
  ['options', 'iv', 'skew'],
  ['healthcare', 'pdufa', 'catalysts'],
  ['energy', 'inventory', 'brent'],
  ['ai', 'capex', 'hyperscaler'],
  ['crypto', 'liquidations', 'eth'],
  ['sentiment', 'reddit', 'pltr'],
  ['13f', 'whale', 'tracking'],
  ['sec', '8-k', 'banks'],
];

function isoAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export const SEED_ACTIVITY: ActivityItem[] = Array.from({ length: 24 }, (_, i) => {
  const agent = SEED_AGENTS[i % SEED_AGENTS.length];
  return {
    id: `act-${i + 1}`,
    agentId: agent.id,
    title: TITLES[i % TITLES.length],
    summary: SUMMARIES[i % SUMMARIES.length],
    at: isoAgo(i * 47 + 8),
    attachment: i % 3 === 0 ? { kind: 'pdf', name: 'brief.pdf' } : undefined,
    keywords: KEYWORDS[i % KEYWORDS.length],
  };
});
