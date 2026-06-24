import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { useApp } from '../../hooks/useApp';
import { fetchQuote, syntheticQuote, currencyFor } from '../../lib/stocks';
import { fmtPrice, pct } from '../../lib/format';
import { Image as ImageIcon, Plus, X, ArrowUpDown, ChevronDown, Check } from 'lucide-react';
import type { Market, WatchStock } from '../../types';
import { useT, type MessageKey } from '../../lib/i18n';
import { MarketStatusPill } from '../../components/MarketStatusPill';
import { Sparkline } from '../../components/Sparkline';

function marketLabel(m: Market) {
  return m === 'US' ? 'US' : m === 'HK' ? 'HK' : m === 'JP' ? 'JP' : 'A-Share';
}

// Short, uniform 2-letter code for the round market badge — keeps every row's
// avatar tidy (the long "A-Share" used to wrap to two lines). For A-shares we
// surface the actual exchange from the ticker suffix: .SS → SH (Shanghai),
// .SZ → SZ (Shenzhen).
function marketBadge(s: WatchStock) {
  if (s.market !== 'CN') return s.market; // US / HK / JP
  const sym = s.symbol.toUpperCase();
  if (sym.endsWith('.SS')) return 'SH';
  if (sym.endsWith('.SZ')) return 'SZ';
  return 'CN';
}

const MARKET_LONG_KEY: Record<Market, MessageKey> = {
  US: 'market.us.long',
  HK: 'market.hk.long',
  JP: 'market.jp.long',
  CN: 'market.cn.long',
};

const MARKETS: Market[] = ['US', 'HK', 'JP', 'CN'];

type SortKey = 'added' | 'gainers' | 'losers' | 'marketCap' | 'name';
const SORT_OPTIONS: { key: SortKey; labelKey: MessageKey }[] = [
  { key: 'added',     labelKey: 'watchlist.sort.added' },
  { key: 'gainers',   labelKey: 'watchlist.sort.gainers' },
  { key: 'losers',    labelKey: 'watchlist.sort.losers' },
  { key: 'marketCap', labelKey: 'watchlist.sort.marketCap' },
  { key: 'name',      labelKey: 'watchlist.sort.name' },
];

export function Watchlist() {
  const { watchlist, setWatchlist } = useApp();
  const t = useT();
  const [showAdd, setShowAdd] = useState(false);
  const [live, setLive] = useState(true);
  const [selectedMarkets, setSelectedMarkets] = useState<Market[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>('added');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Dismiss the sort menu on outside click.
  useEffect(() => {
    if (!sortOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [sortOpen]);

  // Live price refresh on mount + every 60s
  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const run = async () => {
      const results = await Promise.all(
        watchlist.map(async (s) => {
          const q = await fetchQuote(s.symbol, s.market, ctrl.signal);
          if (q) return { ...s, ...q };
          const syn = syntheticQuote(s);
          return { ...s, ...syn };
        })
      );
      if (cancelled) return;
      const anyLive = results.some((_, i) => results[i].price !== undefined);
      setLive(anyLive);
      setWatchlist(results);
    };
    run();
    const timer = setInterval(run, 60_000);
    return () => { cancelled = true; ctrl.abort(); clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMarket = (m: Market) =>
    setSelectedMarkets((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));

  const sorted = useMemo(() => {
    const base = selectedMarkets.length === 0
      ? watchlist
      : watchlist.filter((s) => selectedMarkets.includes(s.market));
    const arr = [...base];
    switch (sortBy) {
      case 'gainers':   arr.sort((a, b) => (b.changePct ?? -Infinity) - (a.changePct ?? -Infinity)); break;
      case 'losers':    arr.sort((a, b) => (a.changePct ??  Infinity) - (b.changePct ??  Infinity)); break;
      case 'marketCap': arr.sort((a, b) => (b.mktCapUsd ?? -1) - (a.mktCapUsd ?? -1)); break;
      case 'name':      arr.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'added':     default: break; // preserve list order (most recently added first)
    }
    return arr;
  }, [watchlist, selectedMarkets, sortBy]);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-paper">
      <AppHeader
        title={t('tab.watchlist')}
        subtitle={live ? t('header.watchlist.live') : t('header.watchlist.offline')}
        right={
          <div className="flex items-center gap-2">
            <MarketStatusPill />
            <button
              onClick={() => setShowAdd(true)}
              aria-label={t('watchlist.add')}
              title={t('watchlist.add')}
              className="btn-accent w-8 h-8 flex items-center justify-center shrink-0"
            >
              <Plus size={18}/>
            </button>
          </div>
        }
      />

      {/* Market filter chips + sort */}
      <div className="px-4 pt-3 pb-2 w-full max-w-3xl mx-auto flex items-center gap-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar min-w-0 flex-1">
          {MARKETS.map((m) => {
            const active = selectedMarkets.includes(m);
            return (
              <button
                key={m}
                onClick={() => toggleMarket(m)}
                className={`shrink-0 text-[12px] px-3 py-1 rounded-pill border transition-colors duration-200 ease-out-expo ${
                  active
                    ? 'bg-accent-soft text-accent border-accent/40 font-medium'
                    : 'bg-transparent text-ink-500 border-ink-200 hover:border-ink-300 hover:text-ink-700'
                }`}
              >{t(MARKET_LONG_KEY[m])}</button>
            );
          })}
        </div>

        {/* Sort dropdown */}
        <div className="relative shrink-0" ref={sortRef}>
          <button
            onClick={() => setSortOpen((v) => !v)}
            aria-label={t('watchlist.sort.label')}
            className={`inline-flex items-center gap-1.5 h-7 pl-2.5 pr-2 rounded-pill border text-[12px] transition-colors duration-200 ${
              sortBy === 'added'
                ? 'border-ink-200 text-ink-700 hover:border-ink-300'
                : 'border-accent/40 bg-accent-soft text-accent font-medium'
            }`}
          >
            <ArrowUpDown size={12} className={sortBy === 'added' ? 'text-ink-500' : 'text-accent'} />
            <span className="whitespace-nowrap">{t(SORT_OPTIONS.find((o) => o.key === sortBy)!.labelKey)}</span>
            <ChevronDown size={12} className="opacity-60" />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-48 rounded-lg border border-ink-200 bg-card shadow-overlay p-1 animate-fade-rise">
              <p className="px-2.5 pt-1.5 pb-1 text-[11px] uppercase tracking-label text-ink-500">{t('watchlist.sort.label')}</p>
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  onClick={() => { setSortBy(o.key); setSortOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-[13px] transition-colors ${
                    o.key === sortBy ? 'text-accent font-medium' : 'text-ink-700 hover:bg-ink-50'
                  }`}
                >
                  <span>{t(o.labelKey)}</span>
                  {o.key === sortBy && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <ul className="px-2 w-full max-w-3xl mx-auto">
          {sorted.map((s) => (
            <li key={s.symbol}>
              <Link
                to={`/watchlist/${encodeURIComponent(s.symbol)}`}
                className="flex items-center gap-3 px-3 py-3.5 border-b border-ink-200 transition-colors duration-200 active:bg-ink-50"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-ink-100 flex items-center justify-center text-ink-500 font-mono text-[12px] leading-none whitespace-nowrap tracking-tight">
                  {marketBadge(s)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-mono text-[15px] text-ink-500 truncate leading-tight">{s.symbol}</h3>
                  <p className="text-[15px] font-medium text-ink-900 truncate leading-tight mt-0.5">{s.name}</p>
                </div>
                {/* Inline sparkline — the row breathes a little, terminal-style. */}
                {s.price !== undefined && (
                  <span className="shrink-0 opacity-90">
                    <Sparkline symbol={s.symbol} price={s.price} changePct={s.changePct ?? 0} width={56} height={30} dot={false} />
                  </span>
                )}
                <div className="shrink-0 text-right min-w-[76px]">
                  {s.price === undefined
                    ? <span className="inline-block h-4 w-16 rounded bg-ink-100 animate-pulse" aria-hidden />
                    : <span className="font-mono text-[17px] text-ink-900 leading-tight">{fmtPrice(s.price, currencyFor(s.market))}</span>}
                  <div className="leading-tight mt-0.5">
                    {s.changePct === undefined
                      ? <span className="inline-block h-3.5 w-12 rounded bg-ink-100 animate-pulse" aria-hidden />
                      : <span className={`font-mono text-[14px] ${(s.changePct >= 0) ? 'text-success' : 'text-danger'}`}>{pct(s.changePct)}</span>}
                  </div>
                </div>
              </Link>
            </li>
          ))}
          {sorted.length === 0 && (
            <li className="text-center text-ink-500 text-[15px] py-10">
              {t('watchlist.empty.market', { markets: selectedMarkets.map((m) => t(MARKET_LONG_KEY[m])).join(' / ') })}
            </li>
          )}
        </ul>
      </div>

      {showAdd && (
        <AddSymbolModal
          onClose={() => setShowAdd(false)}
          onAdd={(s) => { setWatchlist((cur) => [s, ...cur]); setShowAdd(false); }}
          onScreenshot={(detected) => {
            setWatchlist((cur) => [...detected, ...cur]);
            setShowAdd(false);
          }}
          existing={watchlist}
        />
      )}
    </div>
  );
}

interface AddProps {
  onClose: () => void;
  onAdd: (s: WatchStock) => void;
  onScreenshot: (detected: WatchStock[]) => void;
  existing: WatchStock[];
}

function AddSymbolModal({ onClose, onAdd, onScreenshot, existing }: AddProps) {
  const t = useT();
  const [symbol, setSymbol] = useState('');
  const [market, setMarket] = useState<Market>('US');
  const [name, setName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!symbol.trim()) return;
    if (existing.some(e => e.symbol.toLowerCase() === symbol.trim().toLowerCase())) { onClose(); return; }
    onAdd({
      symbol: symbol.trim().toUpperCase(),
      market, name: name.trim() || symbol.trim().toUpperCase(),
      addedAt: new Date().toISOString(),
      closeOnAdd: 0,
    });
  };

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // Simulated OCR extraction — pick a couple of common names that aren't already
    // in the watchlist. In a real build this would post the file to a vision model.
    const detected: WatchStock[] = ([
      { symbol: 'AMZN',  market: 'US' as Market, name: 'Amazon.com Inc', addedAt: new Date().toISOString(), closeOnAdd: 198.20 },
      { symbol: 'GOOGL', market: 'US' as Market, name: 'Alphabet Inc',   addedAt: new Date().toISOString(), closeOnAdd: 172.40 },
    ]).filter((d) => !existing.some((w) => w.symbol === d.symbol));
    onScreenshot(detected);
  };

  return (
    <div className="absolute inset-0 bg-ink-900/40 z-20 flex items-end" onClick={onClose}>
      <div className="w-full bg-card rounded-t-lg shadow-sheet p-4 pb-[max(env(safe-area-inset-bottom),16px)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-[20px] font-medium text-ink-900">{t('watchlist.add')}</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900 transition-colors"><X size={18}/></button>
        </div>

        {/* Screenshot upload — folded into the same modal so it stays one-tap away. */}
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-3 rounded-sm border border-ink-900 bg-transparent text-ink-900 text-[14px] font-medium inline-flex items-center justify-center gap-1.5 mb-3 transition-colors duration-200 ease-out-expo active:bg-ink-100"
        >
          <ImageIcon size={14}/> {t('watchlist.scanDemo')}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleScreenshot}/>

        <div className="relative my-2">
          <div className="border-t border-ink-200"></div>
          <span className="absolute inset-0 -top-2 text-center text-[11px] uppercase tracking-label text-ink-500"><span className="bg-card px-2">{t('watchlist.orManual')}</span></span>
        </div>

        <div className="space-y-2 mt-3">
          <div>
            <label className="text-[11px] uppercase tracking-label text-ink-500">{t('watchlist.field.market')}</label>
            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              {MARKETS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMarket(m)}
                  className={`py-2 rounded-md text-[14px] font-medium transition-colors duration-200 ${market === m ? 'bg-accent-soft text-accent ring-1 ring-accent/40' : 'bg-ink-100 text-ink-700 hover:bg-ink-200/60'}`}
                >{marketLabel(m)}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-label text-ink-500">{t('watchlist.field.symbol')}</label>
            <input
              value={symbol} onChange={(e) => setSymbol(e.target.value)}
              placeholder={market === 'US' ? 'AAPL' : market === 'HK' ? '0700.HK' : market === 'JP' ? '7203.T' : '600519.SS'}
              className="mt-1.5 w-full rounded-md border border-ink-200 bg-card px-3 py-2 text-[17px] font-mono outline-none transition-colors focus:border-ink-900 placeholder:text-ink-300"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-label text-ink-500">{t('watchlist.field.name')}</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-ink-200 bg-card px-3 py-2 text-[17px] outline-none transition-colors focus:border-ink-900"
            />
          </div>
          <button onClick={submit} className="btn-accent w-full py-3 font-medium text-[14px]">{t('watchlist.confirmAdd')}</button>
        </div>
      </div>
    </div>
  );
}
