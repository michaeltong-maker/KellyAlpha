import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { fetchQuote, syntheticQuote, currencyForMarket, currencySymbol, toUsd } from '../../lib/stocks';
import { fmtPrice, pct } from '../../lib/format';
import { ConfirmDeleteSheet } from '../../components/ConfirmDeleteSheet';
import { Plus, X, Trash2, ArrowUpDown, ChevronDown, Check } from 'lucide-react';
import type { Currency, Lot, Market, PortfolioHolding } from '../../types';
import { useT, type MessageKey } from '../../lib/i18n';

const MARKETS: Market[] = ['US', 'HK', 'JP', 'CN'];
const CURRENCIES: Currency[] = ['USD', 'HKD', 'JPY', 'CNY'];
const marketLabel = (m: Market) => (m === 'US' ? 'US' : m === 'HK' ? 'HK' : m === 'JP' ? 'JP' : 'A-Share');
const todayISO = () => new Date().toISOString().slice(0, 10);

type SortKey = 'alloc' | 'name' | 'date' | 'today';
const SORT_OPTIONS: { key: SortKey; labelKey: MessageKey }[] = [
  { key: 'alloc', labelKey: 'portfolio.sort.alloc' },
  { key: 'name',  labelKey: 'portfolio.sort.name' },
  { key: 'date',  labelKey: 'portfolio.sort.date' },
  { key: 'today', labelKey: 'portfolio.sort.today' },
];

// Earliest purchase date across a holding's lots (ISO strings compare lexically).
const earliestLotDate = (h: PortfolioHolding) =>
  h.lots.reduce((min, l) => (l.date < min ? l.date : min), h.lots[0]?.date ?? '9999');

// Derived per-holding figures, all reconciled to a single reporting currency (USD)
// for the total and allocation, with native values kept for display.
interface HoldingCalc {
  h: PortfolioHolding;
  qty: number;
  avgCost: number;        // weighted, in purchase currency
  purchaseCcy: Currency;
  nativeCcy: Currency;    // market trading currency (current price)
  price?: number;         // current price, native
  changePct?: number;
  mktValueNative?: number;
  mktValueUsd?: number;
}

function calcHolding(h: PortfolioHolding): HoldingCalc {
  const qty = h.lots.reduce((n, l) => n + l.quantity, 0);
  const cost = h.lots.reduce((n, l) => n + l.quantity * l.price, 0);
  const purchaseCcy = h.lots[0]?.currency ?? 'USD';
  const nativeCcy = currencyForMarket(h.market);
  const price = h.price;
  const mktValueNative = price !== undefined ? qty * price : undefined;
  const mktValueUsd = mktValueNative !== undefined ? toUsd(mktValueNative, nativeCcy) : undefined;
  return {
    h, qty,
    avgCost: qty > 0 ? cost / qty : 0,
    purchaseCcy, nativeCcy, price, changePct: h.changePct,
    mktValueNative, mktValueUsd,
  };
}

const fmtUsd = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export function PortfolioView() {
  const { portfolio, setPortfolio } = useApp();
  const t = useT();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<PortfolioHolding | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<PortfolioHolding | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('alloc');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const holdingsRef = useRef(portfolio.holdings);
  holdingsRef.current = portfolio.holdings;

  // Dismiss the sort menu on outside click.
  useEffect(() => {
    if (!sortOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [sortOpen]);

  // Live price refresh for every holding, on mount + every 60s.
  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const run = async () => {
      const holdings = holdingsRef.current;
      const quotes = await Promise.all(
        holdings.map(async (h) => {
          const q = await fetchQuote(h.symbol, h.market, ctrl.signal);
          const quote = q ?? syntheticQuote({ symbol: h.symbol, market: h.market, name: h.name, addedAt: '', closeOnAdd: h.lots[0]?.price ?? 100 });
          return { symbol: h.symbol, quote };
        }),
      );
      if (cancelled) return;
      const bySymbol = new Map(quotes.map((q) => [q.symbol, q.quote]));
      setPortfolio((p) => ({
        ...p,
        holdings: p.holdings.map((h) => {
          const q = bySymbol.get(h.symbol);
          return q ? { ...h, price: q.price, changePct: q.changePct } : h;
        }),
      }));
    };
    run();
    const timer = setInterval(run, 60_000);
    return () => { cancelled = true; ctrl.abort(); clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calcs = useMemo(() => portfolio.holdings.map(calcHolding), [portfolio.holdings]);

  // Portfolio-level totals in USD, plus today's change reconstructed from each
  // holding's intraday % (yesterday value = today / (1 + chg)).
  const totals = useMemo(() => {
    let totalUsd = 0, yesterdayUsd = 0, priced = 0;
    for (const c of calcs) {
      if (c.mktValueUsd === undefined) continue;
      priced++;
      totalUsd += c.mktValueUsd;
      const chg = c.changePct ?? 0;
      yesterdayUsd += c.mktValueUsd / (1 + chg / 100);
    }
    const changeUsd = totalUsd - yesterdayUsd;
    const changePct = yesterdayUsd > 0 ? (changeUsd / yesterdayUsd) * 100 : 0;
    return { totalUsd, changeUsd, changePct, ready: priced > 0 };
  }, [calcs]);

  const sortedCalcs = useMemo(() => {
    const arr = [...calcs];
    switch (sortBy) {
      case 'name':  arr.sort((a, b) => a.h.name.localeCompare(b.h.name)); break;
      case 'date':  arr.sort((a, b) => earliestLotDate(a.h).localeCompare(earliestLotDate(b.h))); break;
      case 'today': arr.sort((a, b) => (b.changePct ?? -Infinity) - (a.changePct ?? -Infinity)); break;
      case 'alloc': default: arr.sort((a, b) => (b.mktValueUsd ?? -1) - (a.mktValueUsd ?? -1)); break;
    }
    return arr;
  }, [calcs, sortBy]);

  const addHolding = (h: PortfolioHolding) => {
    setPortfolio((p) => {
      // Merge lots into an existing holding of the same symbol, else append.
      const existing = p.holdings.find((x) => x.symbol.toLowerCase() === h.symbol.toLowerCase());
      if (existing) {
        return { ...p, holdings: p.holdings.map((x) => x === existing ? { ...x, lots: [...x.lots, ...h.lots] } : x) };
      }
      return { ...p, holdings: [h, ...p.holdings] };
    });
    setShowAdd(false);
  };

  // Replace an existing holding's editable fields (name, currency, lots),
  // preserving its identity and any live price already fetched.
  const updateHolding = (symbol: string, patch: { name: string; lots: Lot[] }) => {
    setPortfolio((p) => ({
      ...p,
      holdings: p.holdings.map((h) => (h.symbol === symbol ? { ...h, name: patch.name, lots: patch.lots } : h)),
    }));
    setEditing(null);
  };

  const removeHolding = (symbol: string) => {
    setPortfolio((p) => ({ ...p, holdings: p.holdings.filter((h) => h.symbol !== symbol) }));
    setConfirmRemove(null);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-paper relative">
      {/* Portfolio summary header — today's % change is the headline, absolute below */}
      <div className="px-5 pt-3 pb-4 w-full max-w-3xl mx-auto border-b border-ink-200">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="kicker">{portfolio.name}</p>
            {totals.ready ? (
              <>
                <p className="font-mono text-[28px] text-ink-900 leading-none mt-1">{fmtUsd(totals.totalUsd)}</p>
                <p className="text-[12px] uppercase tracking-label text-ink-400 mt-1">{t('portfolio.total')} · USD</p>
              </>
            ) : (
              <span className="inline-block h-8 w-32 rounded bg-ink-100 animate-pulse align-middle mt-1" aria-hidden />
            )}
          </div>
          {totals.ready && (
            <div className="text-right shrink-0">
              <p className={`font-display text-[34px] font-medium leading-none ${totals.changeUsd >= 0 ? 'text-success' : 'text-danger'}`}>
                {pct(totals.changePct)}
              </p>
              <p className={`font-mono text-[15px] mt-1 ${totals.changeUsd >= 0 ? 'text-success' : 'text-danger'}`}>
                {totals.changeUsd >= 0 ? '+' : ''}{fmtUsd(Math.abs(totals.changeUsd))} <span className="text-ink-400">{t('portfolio.vsYesterday')}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sort toolbar */}
      <div className="px-4 py-2 w-full max-w-3xl mx-auto flex items-center justify-end">
        <div className="relative shrink-0" ref={sortRef}>
          <button
            onClick={() => setSortOpen((v) => !v)}
            aria-label={t('portfolio.sort.label')}
            className={`inline-flex items-center gap-1.5 h-7 pl-2.5 pr-2 rounded-pill border text-[12px] transition-colors duration-200 ${
              sortBy === 'alloc' ? 'border-ink-200 text-ink-700 hover:border-ink-300' : 'border-accent/40 bg-accent-soft text-accent font-medium'
            }`}
          >
            <ArrowUpDown size={12} className={sortBy === 'alloc' ? 'text-ink-500' : 'text-accent'} />
            <span className="whitespace-nowrap">{t(SORT_OPTIONS.find((o) => o.key === sortBy)!.labelKey)}</span>
            <ChevronDown size={12} className="opacity-60" />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-48 rounded-lg border border-ink-200 bg-card shadow-overlay p-1 animate-fade-rise">
              <p className="px-2.5 pt-1.5 pb-1 text-[11px] uppercase tracking-label text-ink-500">{t('portfolio.sort.label')}</p>
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

      {/* Holdings cards + Add button at the bottom of the list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ul className="px-3 pt-1 pb-2 w-full max-w-3xl mx-auto space-y-2.5">
          {sortedCalcs.map((c) => (
            <HoldingCard
              key={c.h.symbol}
              c={c}
              allocationPct={totals.totalUsd > 0 && c.mktValueUsd !== undefined ? (c.mktValueUsd / totals.totalUsd) * 100 : undefined}
              onEdit={() => setEditing(c.h)}
              onRemove={() => setConfirmRemove(c.h)}
            />
          ))}
          {sortedCalcs.length === 0 && (
            <li className="text-center text-ink-500 text-[15px] py-12">{t('portfolio.empty')}</li>
          )}
        </ul>
        <div className="px-3 pb-4 w-full max-w-3xl mx-auto">
          <button
            onClick={() => setShowAdd(true)}
            className="w-full py-3 rounded-md border border-dashed border-ink-300 text-ink-700 text-[14px] font-medium inline-flex items-center justify-center gap-1.5 hover:border-accent hover:text-accent transition-colors"
          >
            <Plus size={16} /> {t('portfolio.add')}
          </button>
        </div>
      </div>

      {showAdd && <HoldingModal mode="add" onClose={() => setShowAdd(false)} onSubmit={addHolding} />}

      {editing && (
        <HoldingModal
          key={editing.symbol}
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(h) => updateHolding(h.symbol, { name: h.name, lots: h.lots })}
        />
      )}

      {confirmRemove && (
        <ConfirmDeleteSheet
          title={t('portfolio.remove.title', { symbol: confirmRemove.symbol })}
          body={t('portfolio.remove.body')}
          sureTitle={t('portfolio.remove.sureTitle')}
          sureBody={t('portfolio.remove.sureBody', { symbol: confirmRemove.symbol })}
          confirmLabel={t('portfolio.remove.confirm')}
          confirmFinalLabel={t('portfolio.remove.confirmFinal')}
          onCancel={() => setConfirmRemove(null)}
          onConfirm={() => removeHolding(confirmRemove.symbol)}
        />
      )}
    </div>
  );
}

function HoldingCard({ c, allocationPct, onEdit, onRemove }: { c: HoldingCalc; allocationPct?: number; onEdit: () => void; onRemove: () => void }) {
  const t = useT();
  const nativeSym = currencySymbol(c.nativeCcy);
  const purchaseSym = currencySymbol(c.purchaseCcy);
  const showUsdEquiv = c.nativeCcy !== 'USD';
  const up = (c.changePct ?? 0) >= 0;

  return (
    <li className="rounded-lg border border-ink-200 bg-card overflow-hidden">
      {/* Tap the card body to edit the holding's lots. */}
      <button onClick={onEdit} className="w-full text-left p-3.5 pb-2.5 active:bg-ink-50 transition-colors">
        {/* Line 1 — identity + allocation */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[16px] font-medium text-ink-900 truncate leading-tight">{c.h.name}</h3>
            <p className="font-mono text-[12px] text-ink-500 mt-0.5">
              {c.h.symbol} · {c.qty.toLocaleString()} {t('portfolio.col.qty').toLowerCase()} · {t(c.h.lots.length === 1 ? 'portfolio.lots.one' : 'portfolio.lots.many', { n: c.h.lots.length })}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono text-[17px] text-ink-900 leading-none">{allocationPct !== undefined ? `${allocationPct.toFixed(1)}%` : '—'}</p>
            <p className="text-[10px] uppercase tracking-label text-ink-400 mt-1">{t('portfolio.col.alloc')}</p>
          </div>
        </div>

        {/* Line 2 — cost + market metrics grid */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <Metric label={t('portfolio.col.avgCost')} value={fmtPrice(c.avgCost, purchaseSym)} />
          <Metric label={t('portfolio.col.current')} value={c.price !== undefined ? fmtPrice(c.price, nativeSym) : '—'} />
          <Metric
            label={t('portfolio.col.mktValue')}
            value={c.mktValueNative !== undefined ? fmtPrice(c.mktValueNative, nativeSym) : '—'}
            sub={showUsdEquiv && c.mktValueUsd !== undefined ? `≈ ${fmtUsd(c.mktValueUsd)}` : undefined}
          />
          <Metric
            label={t('portfolio.col.today')}
            value={c.changePct !== undefined ? pct(c.changePct) : '—'}
            tone={c.changePct === undefined ? undefined : up ? 'up' : 'down'}
          />
        </div>
      </button>

      {/* Remove */}
      <div className="flex justify-end px-3.5 pb-2 -mt-0.5">
        <button onClick={onRemove} className="text-ink-400 hover:text-danger transition-colors p-1" aria-label={t('portfolio.remove.confirm')}>
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  );
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'up' | 'down' }) {
  const color = tone === 'up' ? 'text-success' : tone === 'down' ? 'text-danger' : 'text-ink-900';
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-label text-ink-400 truncate">{label}</p>
      <p className={`font-mono text-[13px] ${color} truncate mt-0.5`}>{value}</p>
      {sub && <p className="font-mono text-[11px] text-ink-400 truncate">{sub}</p>}
    </div>
  );
}

// ---- Add / Edit holding modal (multi-lot) ----
interface DraftLot { date: string; quantity: string; price: string }

interface HoldingModalProps {
  mode: 'add' | 'edit';
  initial?: PortfolioHolding;
  onClose: () => void;
  onSubmit: (h: PortfolioHolding) => void;
}

function HoldingModal({ mode, initial, onClose, onSubmit }: HoldingModalProps) {
  const t = useT();
  const isEdit = mode === 'edit';
  const [market, setMarket] = useState<Market>(initial?.market ?? 'US');
  const [symbol, setSymbol] = useState(initial?.symbol ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [currency, setCurrency] = useState<Currency>(initial?.lots[0]?.currency ?? 'USD');
  const [currencyTouched, setCurrencyTouched] = useState(false);
  const [lots, setLots] = useState<DraftLot[]>(
    initial
      ? initial.lots.map((l) => ({ date: l.date, quantity: String(l.quantity), price: String(l.price) }))
      : [{ date: todayISO(), quantity: '', price: '' }],
  );

  // Default the currency to the market's native currency until the user overrides.
  const setMarketAndCcy = (m: Market) => {
    setMarket(m);
    if (!currencyTouched) setCurrency(currencyForMarket(m));
  };

  // Prefill empty lot prices with the current quote when the symbol is entered.
  const prefillPrice = async () => {
    if (!symbol.trim()) return;
    const q = await fetchQuote(symbol.trim().toUpperCase(), market);
    const price = q?.price;
    if (price === undefined) return;
    setLots((ls) => ls.map((l) => (l.price.trim() === '' ? { ...l, price: String(price) } : l)));
  };

  const updateLot = (i: number, patch: Partial<DraftLot>) =>
    setLots((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLot = () => setLots((ls) => [...ls, { date: todayISO(), quantity: '', price: '' }]);
  const removeLot = (i: number) => setLots((ls) => ls.filter((_, idx) => idx !== i));

  const validLots = lots.filter((l) => Number(l.quantity) > 0 && Number(l.price) > 0);
  const canSubmit = symbol.trim() !== '' && validLots.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    const sym = (initial?.symbol ?? symbol.trim().toUpperCase());
    const holding: PortfolioHolding = {
      symbol: sym,
      market: initial?.market ?? market,
      name: name.trim() || sym,
      lots: validLots.map((l, i): Lot => ({
        id: `lot-${Date.now().toString(36)}-${i}`,
        date: l.date || todayISO(),
        quantity: Number(l.quantity),
        price: Number(l.price),
        currency,
      })),
    };
    onSubmit(holding);
  };

  return (
    <div className="absolute inset-0 bg-ink-900/40 z-30 flex items-end" onClick={onClose}>
      <div className="w-full bg-card rounded-t-lg shadow-sheet p-4 pb-[max(env(safe-area-inset-bottom),16px)] max-h-[88%] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-[20px] font-medium text-ink-900">{t(isEdit ? 'portfolio.edit' : 'portfolio.add')}</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900 transition-colors"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          {isEdit ? (
            /* Identity is fixed when editing — show it, don't let it drift. */
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[18px] text-ink-900">{initial?.symbol}</span>
              <span className="text-[13px] text-ink-500">{marketLabel(market)}</span>
            </div>
          ) : (
            <div>
              <label className="text-[11px] uppercase tracking-label text-ink-500">{t('portfolio.field.market')}</label>
              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                {MARKETS.map((m) => (
                  <button key={m} onClick={() => setMarketAndCcy(m)}
                    className={`py-2 rounded-md text-[14px] font-medium transition-colors ${market === m ? 'bg-accent-soft text-accent ring-1 ring-accent/40' : 'bg-ink-100 text-ink-700 hover:bg-ink-200/60'}`}>
                    {marketLabel(m)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Symbol (add only) + name */}
          <div className={isEdit ? '' : 'grid grid-cols-2 gap-2'}>
            {!isEdit && (
              <div>
                <label className="text-[11px] uppercase tracking-label text-ink-500">{t('portfolio.field.symbol')}</label>
                <input
                  value={symbol} onChange={(e) => setSymbol(e.target.value)} onBlur={prefillPrice}
                  placeholder={market === 'US' ? 'AAPL' : market === 'HK' ? '0700.HK' : market === 'JP' ? '7203.T' : '600519.SS'}
                  className="mt-1.5 w-full rounded-md border border-ink-200 bg-card px-3 py-2 text-[16px] font-mono outline-none focus:border-ink-900 placeholder:text-ink-300"
                />
              </div>
            )}
            <div>
              <label className="text-[11px] uppercase tracking-label text-ink-500">{t('portfolio.field.name')}</label>
              <input
                value={name} onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-ink-200 bg-card px-3 py-2 text-[16px] outline-none focus:border-ink-900"
              />
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="text-[11px] uppercase tracking-label text-ink-500">{t('portfolio.field.currency')}</label>
            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              {CURRENCIES.map((cc) => (
                <button key={cc} onClick={() => { setCurrency(cc); setCurrencyTouched(true); }}
                  className={`py-2 rounded-md text-[13px] font-medium transition-colors ${currency === cc ? 'bg-accent-soft text-accent ring-1 ring-accent/40' : 'bg-ink-100 text-ink-700 hover:bg-ink-200/60'}`}>
                  {cc}
                </button>
              ))}
            </div>
          </div>

          {/* Lots */}
          <div className="space-y-2">
            {lots.map((l, i) => (
              <div key={i} className="rounded-md border border-ink-200 p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] uppercase tracking-label text-ink-500">{t('portfolio.lot.title', { n: i + 1 })}</span>
                  {lots.length > 1 && (
                    <button onClick={() => removeLot(i)} className="text-ink-400 hover:text-danger transition-colors" aria-label={t('portfolio.lot.remove')}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-label text-ink-400">{t('portfolio.lot.date')}</span>
                    <input type="date" value={l.date} max={todayISO()} onChange={(e) => updateLot(i, { date: e.target.value })}
                      className="mt-1 w-full rounded-md border border-ink-200 bg-card px-2 py-1.5 text-[13px] outline-none focus:border-ink-900" />
                  </label>
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-label text-ink-400">{t('portfolio.lot.qty')}</span>
                    <input inputMode="decimal" value={l.quantity} onChange={(e) => updateLot(i, { quantity: e.target.value })} placeholder="100"
                      className="mt-1 w-full rounded-md border border-ink-200 bg-card px-2 py-1.5 text-[13px] font-mono outline-none focus:border-ink-900 placeholder:text-ink-300" />
                  </label>
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-label text-ink-400">{t('portfolio.lot.price')}</span>
                    <input inputMode="decimal" value={l.price} onChange={(e) => updateLot(i, { price: e.target.value })} placeholder="0.00"
                      className="mt-1 w-full rounded-md border border-ink-200 bg-card px-2 py-1.5 text-[13px] font-mono outline-none focus:border-ink-900 placeholder:text-ink-300" />
                  </label>
                </div>
              </div>
            ))}
            <button onClick={addLot} className="w-full py-2 rounded-md border border-dashed border-ink-300 text-ink-600 text-[13px] font-medium inline-flex items-center justify-center gap-1.5 hover:border-ink-400 transition-colors">
              <Plus size={14} /> {t('portfolio.lot.addAnother')}
            </button>
          </div>

          <button onClick={submit} disabled={!canSubmit} className="btn-accent w-full py-3 font-medium text-[14px] disabled:opacity-40">
            {t(isEdit ? 'portfolio.save' : 'portfolio.confirmAdd')}
          </button>
        </div>
      </div>
    </div>
  );
}
