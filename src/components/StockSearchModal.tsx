import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { searchDirectory, type DirectoryStock } from '../lib/stockDirectory';
import type { Market } from '../types';
import { useT } from '../lib/i18n';

function marketBadge(s: DirectoryStock): string {
  if (s.market !== 'CN') return s.market;
  const sym = s.symbol.toUpperCase();
  if (sym.endsWith('.SS')) return 'SH';
  if (sym.endsWith('.SZ')) return 'SZ';
  return 'CN';
}

const MARKET_LABEL: Record<Market, string> = { US: 'US', HK: 'Hong Kong', JP: 'Japan', CN: 'A-Shares' };

// Symbol-lookup sheet, echoing the Watchlist "Add" sheet: a bottom sheet with a
// search field and a tappable result list. Opens when the user focuses the Stock
// Search box; picking a row hands the chosen stock back to the page.
export function StockSearchModal({ onClose, onSelect }: {
  onClose: () => void;
  onSelect: (s: DirectoryStock) => void;
}) {
  const t = useT();
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(() => searchDirectory(q, 20), [q]);

  return (
    <div className="absolute inset-0 bg-ink-900/40 z-40 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-card rounded-t-lg shadow-sheet p-4 pb-[max(env(safe-area-inset-bottom),16px)] max-h-[80%] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-[20px] font-medium text-ink-900">{t('stocksearch.find')}</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900 transition-colors" aria-label={t('common.close')}><X size={18} /></button>
        </div>

        <div className="flex items-center gap-2.5 bg-paper border border-ink-200 rounded-md px-3.5 py-2.5 focus-within:border-ink-900 transition-colors">
          <Search size={16} className="text-ink-300" strokeWidth={1.8} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('stocksearch.placeholder')}
            className="flex-1 bg-transparent outline-none text-[16px] placeholder:text-ink-300"
          />
        </div>

        <ul className="mt-3 flex-1 min-h-0 overflow-y-auto -mx-1">
          {results.map((s) => (
            <li key={s.symbol}>
              <button
                onClick={() => onSelect(s)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-left transition-colors active:bg-ink-100 hover:bg-ink-50"
              >
                <span className="shrink-0 w-9 h-9 rounded-lg bg-ink-100 flex items-center justify-center text-ink-500 font-mono text-[11px] leading-none">
                  {marketBadge(s)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[14px] text-ink-500 leading-tight">{s.symbol}</span>
                  <span className="block text-[15px] font-medium text-ink-900 truncate leading-tight mt-0.5">{s.name}</span>
                </span>
                <span className="shrink-0 text-[11px] uppercase tracking-label text-ink-300">{MARKET_LABEL[s.market]}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="text-center text-ink-500 text-[14px] py-8">{t('stocksearch.noMatch', { q })}</li>
          )}
        </ul>
      </div>
    </div>
  );
}
