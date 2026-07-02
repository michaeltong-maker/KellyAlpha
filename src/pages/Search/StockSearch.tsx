import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { useApp } from '../../hooks/useApp';
import { useT } from '../../lib/i18n';
import { Search, RefreshCw, FileText, X, ChevronRight, Plus, Check, Coins, Eye } from 'lucide-react';
import { StockSearchModal } from '../../components/StockSearchModal';
import { StockReportPane } from '../../components/StockReportPane';
import { MarketStatusPill } from '../../components/MarketStatusPill';
import { Sparkline } from '../../components/Sparkline';
import { fetchQuote, syntheticQuote, currencyFor, type Quote } from '../../lib/stocks';
import { fmtPrice, pct } from '../../lib/format';
import type { DirectoryStock } from '../../lib/stockDirectory';
import type { WatchStock } from '../../types';
import { createStockReport, type StockReport } from '../../lib/stockReport';
import { loadReports, addReport } from '../../lib/stockReportStore';
import { loadRecentSearches, addRecentSearch } from '../../lib/recentSearches';
import { TRENDING_SEARCHES } from '../../data/seedTrending';

function genDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function StockSearch() {
  const t = useT();
  const isDesktop = useIsDesktop();
  const { watchlists, addToWatchlist } = useApp();

  const [searchOpen, setSearchOpen] = useState(false);
  const [stock, setStock] = useState<DirectoryStock | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [reports, setReports] = useState<StockReport[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // mobile: report full-screen overlay
  const [recent, setRecent] = useState<DirectoryStock[]>(() => loadRecentSearches());

  // Pull a live quote for the selected stock (Stooq), falling back to the
  // deterministic synthetic model so the header never sits empty.
  useEffect(() => {
    if (!stock) { setQuote(null); return; }
    let cancelled = false;
    const ctrl = new AbortController();
    setQuote(null);
    (async () => {
      const q = await fetchQuote(stock.symbol, stock.market, ctrl.signal);
      if (cancelled) return;
      setQuote(q ?? syntheticQuote({ symbol: stock.symbol, market: stock.market, name: stock.name, addedAt: '', closeOnAdd: stock.anchor }));
    })();
    return () => { cancelled = true; ctrl.abort(); };
  }, [stock]);

  // On selecting a stock, load its report history and default-select the latest.
  const selectStock = (s: DirectoryStock) => {
    setSearchOpen(false);
    setStock(s);
    setRecent(addRecentSearch(s)); // record for "Previous search"
    const list = loadReports(s.symbol);
    setReports(list);
    setSelectedId(list[0]?.id ?? null); // summary box "clicked" by default → latest
  };

  const onRefresh = () => {
    if (!stock || generating) return;
    setGenerating(true);
    // Simulate the research run. In production this calls the agent task pipeline.
    setTimeout(() => {
      const report = createStockReport(stock, quote);
      const list = addReport(report);
      setReports(list);
      setSelectedId(report.id);
      setGenerating(false);
    }, 1200);
  };

  const selected = useMemo(() => reports.find((r) => r.id === selectedId) ?? null, [reports, selectedId]);
  const latest = reports[0] ?? null;
  const publicReports = useMemo(() => reports.filter((r) => r.isPublic), [reports]);
  // "Other reports" = the public archive minus the latest already shown as the summary.
  const otherReports = useMemo(() => publicReports.filter((r) => r.id !== latest?.id), [publicReports, latest]);

  // Membership across any list; the add bubble always files into the default list.
  const inWatchlist = !!stock && watchlists.some((l) => l.stocks.some((w) => w.symbol.toLowerCase() === stock.symbol.toLowerCase()));
  const handleAddToWatchlist = () => {
    if (!stock || inWatchlist) return;
    const w: WatchStock = {
      symbol: stock.symbol,
      market: stock.market,
      name: stock.name,
      addedAt: new Date().toISOString(),
      closeOnAdd: quote?.price ?? stock.anchor,
      price: quote?.price,
      changePct: quote?.changePct,
    };
    addToWatchlist(w);
  };

  const ccy = stock ? currencyFor(stock.market) : '';
  const price = quote?.price;
  const change = quote?.changePct;

  const openReport = (id: string) => {
    setSelectedId(id);
    if (!isDesktop) setMobileOpen(true);
  };

  // ---- Left/control pane (shared between layouts) ----
  const controlPane = (
    <div className="flex-1 min-h-0 flex flex-col bg-paper overflow-hidden">
      <AppHeader
        title={t('stocksearch.title')}
        subtitle={t('stocksearch.subtitle')}
        right={<MarketStatusPill />}
      />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-5 pt-4 w-full max-w-2xl mx-auto">
          {/* Search box — read-only trigger that opens the lookup sheet */}
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2.5 bg-card border border-ink-200 rounded-md px-3.5 py-3 text-left transition-colors hover:border-ink-300"
          >
            <Search size={16} className="text-ink-300" strokeWidth={1.8} />
            <span className={`flex-1 text-[15px] ${stock ? 'text-ink-900' : 'text-ink-300'}`}>
              {stock ? `${stock.symbol} · ${stock.name}` : t('stocksearch.placeholder')}
            </span>
          </button>

          {/* Selected stock header: name, code, live price + change */}
          {stock && (
            <div className="mt-4 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[24px] font-medium text-ink-900 leading-tight truncate">{stock.name}</h2>
                <p className="font-mono text-[13px] text-ink-500 mt-0.5">{stock.symbol}</p>
              </div>
              <div className="shrink-0 text-right">
                {price === undefined
                  ? <span className="inline-block h-6 w-24 rounded bg-ink-100 animate-pulse" aria-hidden />
                  : <span className="font-mono text-[22px] text-ink-900 leading-none">{fmtPrice(price, ccy)}</span>}
                <div className="mt-1 flex items-center justify-end gap-2">
                  {price !== undefined && (
                    <Sparkline symbol={stock.symbol} price={price} changePct={change ?? 0} width={56} height={24} dot={false} />
                  )}
                  {change === undefined
                    ? <span className="inline-block h-3.5 w-12 rounded bg-ink-100 animate-pulse" aria-hidden />
                    : <span className={`font-mono text-[14px] ${change >= 0 ? 'text-success' : 'text-danger'}`}>{pct(change)}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Refresh (generates a report) + Add to watchlist, with a credits note */}
          {stock && (
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={onRefresh}
                  disabled={generating}
                  className="flex-1 btn-accent py-3 font-medium text-[14px] inline-flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  <RefreshCw size={16} className={generating ? 'animate-spin' : ''} strokeWidth={2} />
                  {generating ? t('stocksearch.generating') : t('stocksearch.refresh')}
                </button>
                <button
                  onClick={handleAddToWatchlist}
                  disabled={inWatchlist}
                  className={`shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-sm text-[14px] font-medium border transition-colors duration-200 ease-out-expo ${
                    inWatchlist
                      ? 'border-ink-200 text-ink-500 bg-ink-50 cursor-default'
                      : 'border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-paper active:bg-ink-100'
                  }`}
                >
                  {inWatchlist
                    ? <><Check size={15} strokeWidth={2} /> {t('stocksearch.inWatchlist')}</>
                    : <><Plus size={15} strokeWidth={2} /> {t('stocksearch.addWatchlist')}</>}
                </button>
              </div>
              <p className="mt-2 text-[12px] text-ink-500 leading-snug flex items-start gap-1.5">
                <Coins size={13} className="mt-0.5 shrink-0 text-ink-300" strokeWidth={1.8} />
                <span>{t('stocksearch.creditsNote')}</span>
              </p>
            </div>
          )}

          {/* Latest-report summary box — selected by default */}
          {stock && latest && (
            <button
              onClick={() => openReport(latest.id)}
              className={`mt-5 w-full text-left rounded-lg border p-4 transition-colors ${
                selectedId === latest.id ? 'border-accent/50 bg-accent-soft' : 'border-ink-200 bg-card hover:border-ink-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="kicker text-accent">{t('stocksearch.latest')}</span>
                <span className="ml-auto text-[11px] font-mono text-ink-500">{t('stocksearch.generatedOn', { date: genDate(latest.at) })}</span>
              </div>
              <h3 className="font-display text-[17px] font-medium text-ink-900 leading-snug mt-1.5">{latest.title}</h3>
              <p className="text-[13px] text-ink-500 leading-snug mt-1 line-clamp-3">{latest.summary}</p>
              <div className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-500">
                <Eye size={13} className="text-ink-300" strokeWidth={1.8} />
                <span>{t('stocksearch.readers', { n: latest.reads.toLocaleString() })}</span>
              </div>
            </button>
          )}

          {/* Empty state — stock selected, no reports yet */}
          {stock && !latest && !generating && (
            <div className="mt-6 rounded-lg border border-dashed border-ink-200 p-6 text-center">
              <p className="text-[15px] font-medium text-ink-900">{t('stocksearch.noReports')}</p>
              <p className="text-[13px] text-ink-500 mt-1">{t('stocksearch.noReportsHint', { symbol: stock.symbol })}</p>
            </div>
          )}

          {/* No stock selected yet — CTA + trending / previous search bubbles */}
          {!stock && (
            <>
              <div className="mt-8 flex flex-col items-center text-center gap-2 text-ink-500">
                <Search size={28} strokeWidth={1.4} className="text-ink-300" />
                <p className="text-[16px] font-medium text-ink-900">{t('stocksearch.searchCta')}</p>
                <p className="text-[13px] max-w-xs">{t('stocksearch.searchHint')}</p>
              </div>

              <BubbleSection title={t('stocksearch.trending')} stocks={TRENDING_SEARCHES} onPick={selectStock} className="mt-8" />
              {recent.length > 0 && (
                <BubbleSection title={t('stocksearch.previous')} stocks={recent} onPick={selectStock} className="mt-6 pb-4" />
              )}
            </>
          )}
        </div>

        {/* Divider + "other reports" archive (excludes the latest summary above) */}
        {stock && otherReports.length > 0 && (
          <div className="px-5 mt-7 w-full max-w-2xl mx-auto pb-6">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-label text-ink-500 shrink-0">{t('stocksearch.allReports', { symbol: stock.symbol })}</span>
              <div className="flex-1 h-px bg-ink-200" />
              <span className="text-[11px] font-mono text-ink-300 shrink-0">{otherReports.length}</span>
            </div>
            <ul>
              {otherReports.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => openReport(r.id)}
                    className={`w-full text-left flex items-center gap-3 px-2 py-3 border-b border-ink-200 rounded-md transition-colors ${
                      selectedId === r.id ? 'bg-ink-100' : 'hover:bg-ink-50'
                    }`}
                  >
                    <FileText size={15} className="text-ink-300 shrink-0" strokeWidth={1.6} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-medium text-ink-900 truncate leading-tight">{r.title}</span>
                      <span className="block text-[11px] font-mono text-ink-500 mt-0.5">{genDate(r.at)}</span>
                    </span>
                    <ChevronRight size={15} className="text-ink-300 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  // ---- Desktop: control pane left, report right ----
  if (isDesktop) {
    return (
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <aside className="w-[440px] shrink-0 flex flex-col border-r border-ink-200 overflow-hidden">
          {controlPane}
        </aside>
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {selected
            ? <StockReportPane report={selected} />
            : (
              <div className="flex-1 flex items-center justify-center text-[15px] text-ink-500 bg-ink-50 px-8 text-center">
                {stock ? t('stocksearch.noReportsHint', { symbol: stock.symbol }) : t('stocksearch.searchHint')}
              </div>
            )}
        </div>
        {searchOpen && <StockSearchModal onClose={() => setSearchOpen(false)} onSelect={selectStock} />}
      </div>
    );
  }

  // ---- Mobile: control pane fills the screen; report opens as an overlay ----
  return (
    <>
      {controlPane}
      {searchOpen && <StockSearchModal onClose={() => setSearchOpen(false)} onSelect={selectStock} />}
      {mobileOpen && selected && (
        <div className="absolute inset-0 z-30 bg-paper flex flex-col">
          <header className="shrink-0 px-4 py-3 border-b border-ink-200 flex items-center gap-2">
            <button onClick={() => setMobileOpen(false)} className="p-1 text-ink-700 hover:text-ink-900 transition-colors" aria-label={t('common.close')}>
              <X size={20} />
            </button>
            <span className="font-mono text-[13px] text-ink-500 truncate">{selected.symbol}</span>
          </header>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <StockReportPane report={selected} />
          </div>
        </div>
      )}
    </>
  );
}

// A divider-headed section of stock-code bubbles (Trending / Previous search).
function BubbleSection({
  title, stocks, onPick, className = '',
}: {
  title: string;
  stocks: DirectoryStock[];
  onPick: (s: DirectoryStock) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-3 mb-2.5">
        <span className="text-[11px] font-medium uppercase tracking-label text-ink-500 shrink-0">{title}</span>
        <div className="flex-1 h-px bg-ink-200" />
      </div>
      <div className="flex flex-wrap gap-2">
        {stocks.map((s) => (
          <button
            key={s.symbol}
            onClick={() => onPick(s)}
            title={s.name}
            className="text-[12px] font-mono px-3 py-1.5 rounded-pill border border-ink-200 text-ink-700 hover:border-accent hover:text-accent transition-colors"
          >
            {s.symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
