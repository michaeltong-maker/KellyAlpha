import { useState } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { MarketStatusPill } from '../../components/MarketStatusPill';
import { useT, type MessageKey } from '../../lib/i18n';
import { WatchlistView } from './WatchlistView';
import { PortfolioView } from './PortfolioView';

type SubTab = 'watchlist' | 'portfolio';
const SUBTABS: { key: SubTab; label: MessageKey }[] = [
  { key: 'watchlist', label: 'watchlist.subtab.watchlist' },
  { key: 'portfolio', label: 'watchlist.subtab.portfolio' },
];

// The Watchlist section now hosts two subsections — the multi-list Watchlist and
// the holdings Portfolio — switched via segmented tabs under the header.
export function Watchlist() {
  const t = useT();
  const [sub, setSub] = useState<SubTab>('watchlist');

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-paper">
      <AppHeader title={t('tab.watchlist')} right={<MarketStatusPill />} />

      <div className="px-5 pt-3 w-full max-w-3xl mx-auto">
        <div className="flex border-b border-ink-200">
          {SUBTABS.map((o) => (
            <button
              key={o.key}
              onClick={() => setSub(o.key)}
              className={`flex-1 text-[13px] uppercase tracking-label py-2.5 -mb-px border-b transition-colors duration-200 ease-out-expo ${
                sub === o.key ? 'border-accent text-accent font-medium' : 'border-transparent text-ink-500'
              }`}
            >
              {t(o.label)}
            </button>
          ))}
        </div>
      </div>

      {sub === 'watchlist' ? <WatchlistView /> : <PortfolioView />}
    </div>
  );
}
