import { useEffect, useRef, useState } from 'react';
import { allMarketStatuses, leadMarket, fmtDuration, MARKET_ORDER } from '../lib/market';
import type { Market } from '../types';
import { useT, type MessageKey } from '../lib/i18n';

const MARKET_CODE: Record<Market, string> = { US: 'US', HK: 'HK', JP: 'JP', CN: 'CN' };
const MARKET_LONG_KEY: Record<Market, MessageKey> = {
  US: 'market.us.long',
  HK: 'market.hk.long',
  JP: 'market.jp.long',
  CN: 'market.cn.long',
};

/**
 * Compact, tappable market-session indicator. Leads with the most relevant
 * exchange (first open by priority, else the one opening soonest) and expands
 * into a popover listing every market with its open/closed state and the time
 * until the next session change. Re-evaluates once a minute.
 */
export function MarketStatusPill() {
  const t = useT();
  const [now, setNow] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Tick every 30s so the "opens/closes in" countdown and the live dot stay honest.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Dismiss the popover on outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const statuses = allMarketStatuses(now);
  const lead = leadMarket(statuses);
  const anyOpen = statuses.some((s) => s.open);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('market.status.title')}
        title={t('market.status.title')}
        className={`inline-flex items-center gap-1.5 h-8 pl-2 pr-2.5 rounded-pill border text-[12px] font-medium tabular-nums transition-colors duration-200 ${
          anyOpen
            ? 'border-accent/30 bg-accent-soft text-accent'
            : 'border-ink-200 bg-transparent text-ink-500 hover:border-ink-300'
        }`}
      >
        <span className="relative flex h-1.5 w-1.5">
          {anyOpen && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 animate-ping" />
          )}
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${anyOpen ? 'bg-accent' : 'bg-ink-300'}`} />
        </span>
        <span className="font-mono tracking-wide">{MARKET_CODE[lead.market]}</span>
        <span className="uppercase tracking-label text-[10px]">
          {anyOpen ? t('market.status.open') : t('market.status.closed')}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-60 rounded-lg border border-ink-200 bg-card shadow-overlay p-1 animate-fade-rise">
          <p className="px-2.5 pt-2 pb-1.5 text-[11px] uppercase tracking-label text-ink-500">
            {t('market.status.title')}
          </p>
          <ul>
            {MARKET_ORDER.map((m) => {
              const s = statuses.find((x) => x.market === m)!;
              return (
                <li
                  key={m}
                  className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-md hover:bg-ink-50 transition-colors"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.open ? 'bg-accent' : 'bg-ink-300'}`} />
                    <span className="text-[13px] text-ink-900 truncate">{t(MARKET_LONG_KEY[m])}</span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className={`block text-[11px] uppercase tracking-label ${s.open ? 'text-accent' : 'text-ink-500'}`}>
                      {s.open ? t('market.status.open') : t('market.status.closed')}
                    </span>
                    {s.minsToChange != null && (
                      <span className="block text-[11px] text-ink-500 tabular-nums">
                        {s.open
                          ? t('market.status.closesIn', { time: fmtDuration(s.minsToChange) })
                          : t('market.status.opensIn', { time: fmtDuration(s.minsToChange) })}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
