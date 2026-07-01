import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { fetchQuote, syntheticQuote, currencyFor } from '../../lib/stocks';
import { fmtPrice, pct } from '../../lib/format';
import { Image as ImageIcon, Plus, X, ArrowUpDown, ChevronDown, Check, ChevronsUpDown, FolderInput, Star } from 'lucide-react';
import type { Market, WatchStock } from '../../types';
import { useT, type MessageKey } from '../../lib/i18n';
import { Sparkline } from '../../components/Sparkline';

function marketLabel(m: Market) {
  return m === 'US' ? 'US' : m === 'HK' ? 'HK' : m === 'JP' ? 'JP' : 'A-Share';
}

// Short, uniform 2-letter code for the round market badge. A-shares surface the
// exchange from the ticker suffix: .SS → SH (Shanghai), .SZ → SZ (Shenzhen).
function marketBadge(s: WatchStock) {
  if (s.market !== 'CN') return s.market;
  const sym = s.symbol.toUpperCase();
  if (sym.endsWith('.SS')) return 'SH';
  if (sym.endsWith('.SZ')) return 'SZ';
  return 'CN';
}

const MARKETS: Market[] = ['US', 'HK', 'JP', 'CN'];
const MARKET_ORDER: Record<Market, number> = { US: 0, HK: 1, JP: 2, CN: 3 };

type SortKey = 'added' | 'gainers' | 'losers' | 'marketCap' | 'name' | 'market';
const SORT_OPTIONS: { key: SortKey; labelKey: MessageKey }[] = [
  { key: 'added',     labelKey: 'watchlist.sort.added' },
  { key: 'gainers',   labelKey: 'watchlist.sort.gainers' },
  { key: 'losers',    labelKey: 'watchlist.sort.losers' },
  { key: 'marketCap', labelKey: 'watchlist.sort.marketCap' },
  { key: 'name',      labelKey: 'watchlist.sort.name' },
  { key: 'market',    labelKey: 'watchlist.sort.market' },
];

export function WatchlistView() {
  const { watchlists, setWatchlists, addToWatchlist } = useApp();
  const t = useT();

  const defaultId = useMemo(() => watchlists.find((l) => l.isDefault)?.id ?? watchlists[0]?.id, [watchlists]);
  const [activeListId, setActiveListId] = useState<string>(() => defaultId);
  // Keep the selection valid if the active list ever disappears.
  useEffect(() => {
    if (!watchlists.some((l) => l.id === activeListId)) setActiveListId(defaultId);
  }, [watchlists, activeListId, defaultId]);
  const activeList = watchlists.find((l) => l.id === activeListId) ?? watchlists[0];

  const [sortBy, setSortBy] = useState<SortKey>('added');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newListOpen, setNewListOpen] = useState(false);

  // Move mode: rows become selectable, then get relocated to another list.
  const [moveMode, setMoveMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [moveTargetOpen, setMoveTargetOpen] = useState(false);

  // Latest watchlists for the interval closure (avoids a stale snapshot).
  const listsRef = useRef(watchlists);
  listsRef.current = watchlists;

  // Dismiss the sort / picker menus on outside click.
  useEffect(() => {
    if (!sortOpen && !pickerOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [sortOpen, pickerOpen]);

  // Live price refresh for the active list, on switch + every 60s.
  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const run = async () => {
      const list = listsRef.current.find((l) => l.id === activeListId);
      const stocks = list?.stocks ?? [];
      const quotes = await Promise.all(
        stocks.map(async (s) => {
          const q = await fetchQuote(s.symbol, s.market, ctrl.signal);
          return { symbol: s.symbol, quote: q ?? syntheticQuote(s), fromNet: !!q };
        }),
      );
      if (cancelled) return;
      const bySymbol = new Map(quotes.map((q) => [q.symbol, q.quote]));
      setWatchlists((prev) =>
        prev.map((l) =>
          l.id === activeListId
            ? { ...l, stocks: l.stocks.map((s) => { const q = bySymbol.get(s.symbol); return q ? { ...s, ...q } : s; }) }
            : l,
        ),
      );
    };
    run();
    const timer = setInterval(run, 60_000);
    return () => { cancelled = true; ctrl.abort(); clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeListId]);

  // Reset transient view state when switching lists.
  useEffect(() => { exitMove(); }, [activeListId]);

  const sorted = useMemo(() => {
    const arr = [...activeList.stocks];
    switch (sortBy) {
      case 'gainers':   arr.sort((a, b) => (b.changePct ?? -Infinity) - (a.changePct ?? -Infinity)); break;
      case 'losers':    arr.sort((a, b) => (a.changePct ??  Infinity) - (b.changePct ??  Infinity)); break;
      case 'marketCap': arr.sort((a, b) => (b.mktCapUsd ?? -1) - (a.mktCapUsd ?? -1)); break;
      case 'name':      arr.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'market':    arr.sort((a, b) => MARKET_ORDER[a.market] - MARKET_ORDER[b.market] || a.name.localeCompare(b.name)); break;
      case 'added':     default: break;
    }
    return arr;
  }, [activeList, sortBy]);

  const listCount = (n: number) => t(n === 1 ? 'watchlist.count.one' : 'watchlist.count.many', { n });

  // ---- List management ----
  const createList = (name: string, moveSelected = false) => {
    const id = 'wl-' + Date.now().toString(36);
    const moving = moveSelected ? activeList.stocks.filter((s) => selected.has(s.symbol)) : [];
    setWatchlists((prev) => {
      const next = prev.map((l) =>
        moveSelected && l.id === activeListId
          ? { ...l, stocks: l.stocks.filter((s) => !selected.has(s.symbol)) }
          : l,
      );
      return [...next, { id, name, stocks: moving }];
    });
    if (moveSelected) { exitMove(); setMoveTargetOpen(false); }
    else setActiveListId(id);
    setNewListOpen(false);
  };

  // ---- Move mode ----
  function exitMove() { setMoveMode(false); setSelected(new Set()); setMoveTargetOpen(false); }
  const toggleSelect = (symbol: string) =>
    setSelected((cur) => {
      const n = new Set(cur);
      if (n.has(symbol)) n.delete(symbol); else n.add(symbol);
      return n;
    });

  const doMove = (targetId: string) => {
    const moving = activeList.stocks.filter((s) => selected.has(s.symbol));
    setWatchlists((prev) =>
      prev.map((l) => {
        if (l.id === activeListId) return { ...l, stocks: l.stocks.filter((s) => !selected.has(s.symbol)) };
        if (l.id === targetId) {
          const have = new Set(l.stocks.map((s) => s.symbol.toLowerCase()));
          const add = moving.filter((s) => !have.has(s.symbol.toLowerCase()));
          return { ...l, stocks: [...add, ...l.stocks] };
        }
        return l;
      }),
    );
    exitMove();
  };

  const otherLists = watchlists.filter((l) => l.id !== activeListId);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-paper relative">
      {/* Toolbar: watchlist picker + add + move */}
      <div className="px-4 pt-3 pb-2 w-full max-w-3xl mx-auto flex items-center gap-2">
        {/* Watchlist picker */}
        <div className="relative min-w-0" ref={pickerRef}>
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 max-w-full h-8 pl-3 pr-2 rounded-pill border border-ink-200 bg-card text-ink-900 hover:border-ink-300 transition-colors"
          >
            <span className="font-medium text-[14px] truncate">{activeList.name}</span>
            <span className="text-[11px] text-ink-400 font-mono shrink-0">{activeList.stocks.length}</span>
            <ChevronsUpDown size={14} className="text-ink-400 shrink-0" />
          </button>
          {pickerOpen && (
            <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-64 rounded-lg border border-ink-200 bg-card shadow-overlay p-1 animate-fade-rise">
              <p className="px-2.5 pt-1.5 pb-1 text-[11px] uppercase tracking-label text-ink-500">{t('watchlist.picker.label')}</p>
              {watchlists.map((l) => (
                <button
                  key={l.id}
                  onClick={() => { setActiveListId(l.id); setPickerOpen(false); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[14px] transition-colors ${l.id === activeListId ? 'bg-ink-50' : 'hover:bg-ink-50'}`}
                >
                  {l.isDefault
                    ? <Star size={13} className="text-accent shrink-0" fill="currentColor" />
                    : <span className="w-[13px] shrink-0" />}
                  <span className="truncate flex-1 text-left text-ink-900">{l.name}</span>
                  <span className="text-[11px] text-ink-400 font-mono">{listCount(l.stocks.length)}</span>
                  {l.id === activeListId && <Check size={14} className="text-accent shrink-0" />}
                </button>
              ))}
              <div className="my-1 border-t border-ink-200" />
              <button
                onClick={() => { setPickerOpen(false); setNewListOpen(true); }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[14px] text-accent hover:bg-ink-50 transition-colors"
              >
                <Plus size={14} /> {t('watchlist.picker.new')}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Sort — same size as Move, sits to its left */}
        <div className="relative shrink-0" ref={sortRef}>
          <button
            onClick={() => setSortOpen((v) => !v)}
            aria-label={t('watchlist.sort.label')}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-pill border text-[13px] transition-colors duration-200 ${
              sortBy === 'added' ? 'border-ink-200 text-ink-700 hover:border-ink-300' : 'border-accent/40 bg-accent-soft text-accent font-medium'
            }`}
          >
            <ArrowUpDown size={14} className={sortBy === 'added' ? 'text-ink-500' : 'text-accent'} />
            {/* Label hides on narrow screens so the watchlist name keeps its room. */}
            <span className="hidden min-[480px]:inline whitespace-nowrap">{t(SORT_OPTIONS.find((o) => o.key === sortBy)!.labelKey)}</span>
            <ChevronDown size={14} className="opacity-60" />
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

        {/* Move toggle */}
        <button
          onClick={() => (moveMode ? exitMove() : setMoveMode(true))}
          disabled={!moveMode && activeList.stocks.length === 0}
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-pill border text-[13px] transition-colors disabled:opacity-40 ${
            moveMode ? 'border-accent/40 bg-accent-soft text-accent font-medium' : 'border-ink-200 text-ink-700 hover:border-ink-300'
          }`}
        >
          {moveMode ? t('watchlist.move.done') : <><FolderInput size={14} /> {t('watchlist.move')}</>}
        </button>

        {/* Add symbol */}
        <button
          onClick={() => setShowAdd(true)}
          aria-label={t('watchlist.add')}
          title={t('watchlist.add')}
          className="btn-accent w-8 h-8 flex items-center justify-center shrink-0"
        >
          <Plus size={18} />
        </button>
      </div>

      {moveMode && (
        <p className="px-4 pb-1 w-full max-w-3xl mx-auto text-[12px] text-ink-500">{t('watchlist.move.hint')}</p>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto" style={{ paddingBottom: moveMode ? 72 : undefined }}>
        <ul className="px-2 w-full max-w-3xl mx-auto">
          {sorted.map((s) => {
            const isSel = selected.has(s.symbol);
            const rowInner = (
              <>
                {moveMode && (
                  <span className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center ${isSel ? 'bg-accent border-accent text-paper' : 'border-ink-300'}`}>
                    {isSel && <Check size={13} strokeWidth={3} />}
                  </span>
                )}
                <div className="shrink-0 w-10 h-10 rounded-lg bg-ink-100 flex items-center justify-center text-ink-500 font-mono text-[12px] leading-none whitespace-nowrap tracking-tight">
                  {marketBadge(s)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-mono text-[15px] text-ink-500 truncate leading-tight">{s.symbol}</h3>
                  <p className="text-[15px] font-medium text-ink-900 truncate leading-tight mt-0.5">{s.name}</p>
                </div>
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
              </>
            );
            const rowClass = 'flex items-center gap-3 px-3 py-3.5 border-b border-ink-200 transition-colors duration-200';
            return (
              <li key={s.symbol}>
                {moveMode ? (
                  <button onClick={() => toggleSelect(s.symbol)} className={`${rowClass} w-full text-left ${isSel ? 'bg-accent-soft/40' : 'active:bg-ink-50'}`}>
                    {rowInner}
                  </button>
                ) : (
                  <Link to={`/watchlist/${encodeURIComponent(s.symbol)}`} className={`${rowClass} active:bg-ink-50`}>
                    {rowInner}
                  </Link>
                )}
              </li>
            );
          })}
          {sorted.length === 0 && (
            <li className="text-center text-ink-500 text-[15px] py-10">
              {t('watchlist.empty.market', { markets: activeList.name })}
            </li>
          )}
        </ul>
      </div>

      {/* Move action bar */}
      {moveMode && (
        <div className="absolute inset-x-0 bottom-0 z-20 border-t border-ink-200 bg-card/95 backdrop-blur px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)] flex items-center gap-3">
          <span className="text-[14px] text-ink-700">
            {t(selected.size === 1 ? 'watchlist.move.selected.one' : 'watchlist.move.selected.many', { n: selected.size })}
          </span>
          <div className="flex-1" />
          <button onClick={exitMove} className="text-[14px] text-ink-500 px-2 py-2">{t('watchlist.move.cancel')}</button>
          <button
            onClick={() => setMoveTargetOpen(true)}
            disabled={selected.size === 0}
            className="btn-accent px-4 py-2 text-[14px] font-medium disabled:opacity-40"
          >{t('watchlist.move.cta')}</button>
        </div>
      )}

      {showAdd && (
        <AddSymbolModal
          onClose={() => setShowAdd(false)}
          onAdd={(s) => { addToWatchlist(s, activeListId); setShowAdd(false); }}
          onScreenshot={(detected) => { detected.forEach((d) => addToWatchlist(d, activeListId)); setShowAdd(false); }}
          existing={activeList.stocks}
        />
      )}

      {newListOpen && (
        <NameListModal onClose={() => setNewListOpen(false)} onCreate={(name) => createList(name)} />
      )}

      {/* Move-target chooser */}
      {moveTargetOpen && (
        <div className="absolute inset-0 bg-ink-900/40 z-30 flex items-end" onClick={() => setMoveTargetOpen(false)}>
          <div className="w-full bg-card rounded-t-lg shadow-sheet p-4 pb-[max(env(safe-area-inset-bottom),16px)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-[20px] font-medium text-ink-900">{t('watchlist.move.to.title')}</h3>
              <button onClick={() => setMoveTargetOpen(false)} className="text-ink-500 hover:text-ink-900 transition-colors"><X size={18} /></button>
            </div>
            <div className="space-y-1">
              {otherLists.map((l) => (
                <button
                  key={l.id}
                  onClick={() => doMove(l.id)}
                  className="w-full flex items-center gap-2 px-3 py-3 rounded-md text-[15px] text-ink-900 hover:bg-ink-50 transition-colors text-left"
                >
                  {l.isDefault && <Star size={13} className="text-accent shrink-0" fill="currentColor" />}
                  <span className="flex-1 truncate">{l.name}</span>
                  <span className="text-[11px] text-ink-400 font-mono">{listCount(l.stocks.length)}</span>
                </button>
              ))}
              {otherLists.length === 0 && (
                <p className="text-[13px] text-ink-500 px-1 py-2">{t('watchlist.move.to.empty')}</p>
              )}
              <div className="my-1 border-t border-ink-200" />
              <NameListInline onCreate={(name) => createList(name, true)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Prompt for a new list name and move the current selection into it.
function NameListInline({ onCreate }: { onCreate: (name: string) => void }) {
  const t = useT();
  const [name, setName] = useState('');
  return (
    <div className="flex items-center gap-2 pt-1">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('watchlist.newList.placeholder')}
        className="flex-1 rounded-md border border-ink-200 bg-card px-3 py-2 text-[15px] outline-none focus:border-ink-900 placeholder:text-ink-300"
      />
      <button
        onClick={() => name.trim() && onCreate(name.trim())}
        disabled={!name.trim()}
        className="btn-accent px-3 py-2 text-[14px] font-medium disabled:opacity-40 inline-flex items-center gap-1.5"
      >
        <Plus size={14} /> {t('watchlist.newList.create')}
      </button>
    </div>
  );
}

// Standalone "name your watchlist" bottom sheet.
function NameListModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const t = useT();
  const [name, setName] = useState('');
  const submit = () => { if (name.trim()) onCreate(name.trim()); };
  return (
    <div className="absolute inset-0 bg-ink-900/40 z-30 flex items-end" onClick={onClose}>
      <div className="w-full bg-card rounded-t-lg shadow-sheet p-4 pb-[max(env(safe-area-inset-bottom),16px)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-[20px] font-medium text-ink-900">{t('watchlist.newList.title')}</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900 transition-colors"><X size={18} /></button>
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={t('watchlist.newList.placeholder')}
          className="w-full rounded-md border border-ink-200 bg-card px-3 py-2.5 text-[16px] outline-none focus:border-ink-900 placeholder:text-ink-300"
        />
        <div className="flex gap-2 mt-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-sm border border-ink-200 text-ink-700 text-[14px] font-medium">{t('watchlist.newList.cancel')}</button>
          <button onClick={submit} disabled={!name.trim()} className="flex-1 btn-accent py-2.5 text-[14px] font-medium disabled:opacity-40">{t('watchlist.newList.create')}</button>
        </div>
      </div>
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
    if (existing.some((e) => e.symbol.toLowerCase() === symbol.trim().toLowerCase())) { onClose(); return; }
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
    const detected: WatchStock[] = ([
      { symbol: 'AMZN',  market: 'US' as Market, name: 'Amazon.com Inc', addedAt: new Date().toISOString(), closeOnAdd: 198.20 },
      { symbol: 'GOOGL', market: 'US' as Market, name: 'Alphabet Inc',   addedAt: new Date().toISOString(), closeOnAdd: 172.40 },
    ]).filter((d) => !existing.some((w) => w.symbol === d.symbol));
    onScreenshot(detected);
  };

  return (
    <div className="absolute inset-0 bg-ink-900/40 z-30 flex items-end" onClick={onClose}>
      <div className="w-full bg-card rounded-t-lg shadow-sheet p-4 pb-[max(env(safe-area-inset-bottom),16px)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-[20px] font-medium text-ink-900">{t('watchlist.add')}</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900 transition-colors"><X size={18} /></button>
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-3 rounded-sm border border-ink-900 bg-transparent text-ink-900 text-[14px] font-medium inline-flex items-center justify-center gap-1.5 mb-3 transition-colors duration-200 ease-out-expo active:bg-ink-100"
        >
          <ImageIcon size={14} /> {t('watchlist.scanDemo')}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleScreenshot} />

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
