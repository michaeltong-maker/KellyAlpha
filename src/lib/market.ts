import type { Market } from '../types';

// ============================================================
// Market session clock
// ------------------------------------------------------------
// Computes whether each exchange is currently open, using the
// exchange's *local* time (resolved via Intl time zones, so it
// follows DST automatically) and its regular trading hours,
// including the lunch recess that HK / JP / CN observe.
//
// This powers the market-status indicator in the Watchlist
// header (it replaced a meaningless wifi glyph). Holidays are
// not modelled — weekday + session hours only, which is plenty
// for an at-a-glance "is the market live right now" read.
// ============================================================

export interface MarketSession {
  market: Market;
  tz: string;
  // Trading windows expressed in local minutes-from-midnight.
  windows: [number, number][];
}

const HM = (h: number, m: number) => h * 60 + m;

export const SESSIONS: Record<Market, MarketSession> = {
  US: { market: 'US', tz: 'America/New_York', windows: [[HM(9, 30), HM(16, 0)]] },
  HK: { market: 'HK', tz: 'Asia/Hong_Kong', windows: [[HM(9, 30), HM(12, 0)], [HM(13, 0), HM(16, 0)]] },
  JP: { market: 'JP', tz: 'Asia/Tokyo', windows: [[HM(9, 0), HM(11, 30)], [HM(12, 30), HM(15, 30)]] },
  CN: { market: 'CN', tz: 'Asia/Shanghai', windows: [[HM(9, 30), HM(11, 30)], [HM(13, 0), HM(15, 0)]] },
};

// A stable priority used when several markets are open at once or all are
// shut — decides which one the compact pill leads with.
export const MARKET_ORDER: Market[] = ['US', 'HK', 'CN', 'JP'];

export interface MarketStatus {
  market: Market;
  open: boolean;
  // Minutes until the next state change (open->closed or closed->open).
  // Undefined when it can't be resolved within the look-ahead window.
  minsToChange?: number;
}

interface LocalNow {
  weekday: number; // 0 = Sun … 6 = Sat
  minutes: number; // minutes from local midnight
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

// Resolve the wall-clock weekday + minute-of-day in a given time zone.
function localNow(tz: string, at: Date): LocalNow {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const weekday = WEEKDAY_INDEX[get('weekday')] ?? 0;
  let hour = parseInt(get('hour'), 10);
  if (hour === 24) hour = 0; // some engines emit 24 at midnight
  const minute = parseInt(get('minute'), 10);
  return { weekday, minutes: hour * 60 + minute };
}

const isWeekday = (d: number) => d >= 1 && d <= 5;

export function marketStatus(market: Market, at: Date = new Date()): MarketStatus {
  const s = SESSIONS[market];
  const { weekday, minutes } = localNow(s.tz, at);

  const openNow =
    isWeekday(weekday) && s.windows.some(([a, b]) => minutes >= a && minutes < b);

  // Find minutes until the next transition by scanning forward up to ~4 days.
  let minsToChange: number | undefined;
  const DAY = 24 * 60;
  for (let ahead = 0; ahead <= DAY * 4; ahead += 1) {
    const probeDay = (weekday + Math.floor((minutes + ahead) / DAY)) % 7;
    const probeMin = (minutes + ahead) % DAY;
    const probeOpen =
      isWeekday(probeDay) && s.windows.some(([a, b]) => probeMin >= a && probeMin < b);
    if (probeOpen !== openNow) {
      minsToChange = ahead;
      break;
    }
  }

  return { market, open: openNow, minsToChange };
}

export function allMarketStatuses(at: Date = new Date()): MarketStatus[] {
  return MARKET_ORDER.map((m) => marketStatus(m, at));
}

// The market the compact indicator should lead with: the first open market by
// priority, else the one opening soonest.
export function leadMarket(statuses: MarketStatus[]): MarketStatus {
  const open = statuses.filter((s) => s.open);
  if (open.length) {
    return MARKET_ORDER.map((m) => open.find((s) => s.market === m)).find(Boolean) as MarketStatus;
  }
  return [...statuses].sort((a, b) => (a.minsToChange ?? 1e9) - (b.minsToChange ?? 1e9))[0];
}

// "2h 15m" / "45m" / "<1m" — compact relative duration for the pill + popover.
export function fmtDuration(mins?: number): string {
  if (mins == null) return '';
  if (mins < 1) return '<1m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
