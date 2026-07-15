import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { useApp } from '../../hooks/useApp';
import { useT } from '../../lib/i18n';
import { Search, RefreshCw, FileText, X, ChevronRight, Plus, Check, Coins, Eye } from 'lucide-react';
import { StockSearchModal } from '../../components/StockSearchModal';
import { StockReportPane } from '../../components/StockReportPane';
import { ResultViewerModal } from '../../components/ResultViewerModal';
import { MarketStatusPill } from '../../components/MarketStatusPill';
import { Sparkline } from '../../components/Sparkline';
import { fetchQuote, syntheticQuote, currencyFor, type Quote } from '../../lib/stocks';
import { fmtPrice, pct } from '../../lib/format';
import type { DirectoryStock } from '../../lib/stockDirectory';
import type { Result, WatchStock } from '../../types';

// Estimated token cost shown on the Refresh/Generate button.
const EST_TOKENS = 10;

const REC_STYLE: Record<'buy' | 'hold' | 'sell', string> = {
  buy: 'bg-success/15 text-success',
  hold: 'bg-ink-100 text-ink-700',
  sell: 'bg-danger/15 text-danger',
};
import { createStockReport, recommendationOf, type StockReport } from '../../lib/stockReport';
import { loadReports, addReport } from '../../lib/stockReportStore';
import { loadRecentSearches, addRecentSearch } from '../../lib/recentSearches';
import { TRENDING_SEARCHES, type TrendingItem } from '../../data/seedTrending';

function genDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Representative exchange label per market (illustrative — the directory doesn't
// store the exact listing venue).
function exchangeFor(s: DirectoryStock): string {
  switch (s.market) {
    case 'US': return 'NASDAQ';
    case 'HK': return 'HKEX';
    case 'JP': return 'TSE';
    case 'CN': return s.symbol.toUpperCase().endsWith('.SS') ? 'SSE' : 'SZSE';
  }
}

export function StockSearch() {
  const t = useT();
  const isDesktop = useIsDesktop();
  const { watchlists, addToWatchlist, results, agents } = useApp();

  const [searchOpen, setSearchOpen] = useState(false);
  const [stock, setStock] = useState<DirectoryStock | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [reports, setReports] = useState<StockReport[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // mobile: report full-screen overlay
  const [recent, setRecent] = useState<DirectoryStock[]>(() => loadRecentSearches());
  const [openResult, setOpenResult] = useState<Result | null>(null); // desk report mentioning this stock

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

  // Desk/agent reports that mention this stock (by structured mention or keyword),
  // newest first — pulled into the "Other reports mentioning {symbol}" section.
  const mentionResults = useMemo(() => {
    if (!stock) return [];
    const sym = stock.symbol.toUpperCase();
    return results
      .filter((r) => r.stocks.some((s) => s.symbol.toUpperCase() === sym) || r.keywords.some((k) => k.toUpperCase() === sym))
      .sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [results, stock]);

  const otherCount = otherReports.length + mentionResults.length;

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

          {/* Selected stock card — logo monogram, name, exchange · ticker, price, 30-day chart */}
          {stock && (
            <div className="mt-4 rounded-2xl border border-ink-200 bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-ink-900 text-paper flex items-center justify-center font-display text-[22px] leading-none shrink-0">
                  {stock.name.trim().charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-[22px] font-medium text-ink-900 leading-tight truncate">{stock.name}</h2>
                  <p className="font-mono text-[12px] text-ink-500 mt-0.5">{exchangeFor(stock)} · {stock.symbol}</p>
                </div>
                <div className="shrink-0 text-right">
                  {price === undefined
                    ? <span className="inline-block h-7 w-28 rounded bg-ink-100 animate-pulse" aria-hidden />
                    : <span className="font-display text-[26px] font-medium text-ink-900 leading-none">{fmtPrice(price, ccy)}</span>}
                  <div className="mt-1.5">
                    {change === undefined
                      ? <span className="inline-block h-4 w-14 rounded bg-ink-100 animate-pulse" aria-hidden />
                      : <span className={`font-mono text-[14px] inline-flex items-center gap-1 ${change >= 0 ? 'text-success' : 'text-danger'}`}>
                          <span aria-hidden>{change >= 0 ? '▲' : '▼'}</span>{Math.abs(change).toFixed(1)}%
                        </span>}
                  </div>
                </div>
              </div>
              {price !== undefined && (
                <div className="mt-3 relative">
                  <Sparkline symbol={stock.symbol} price={price} changePct={change ?? 0} width={600} height={88} fill dot={false} className="w-full h-auto" />
                  <span className="absolute bottom-1 right-1.5 text-[11px] font-medium uppercase tracking-label text-ink-400">30-Day</span>
                </div>
              )}
            </div>
          )}

          {/* House Prompt divider — between the price card and the summary */}
          {stock && (
            <div className="mt-6 flex items-center gap-3">
              <span className="text-[11px] font-medium uppercase tracking-label text-ink-500 shrink-0">{t('stocksearch.housePrompt')}</span>
              <div className="flex-1 h-px bg-ink-200" />
            </div>
          )}

          {/* Latest summary box — accent-tinted card enclosing the summary + actions */}
          {stock && (
            <div className="mt-3 relative overflow-hidden rounded-xl border border-accent/20 bg-accent-soft p-4 pl-5">
              <span className="absolute left-0 inset-y-0 w-1 bg-accent" aria-hidden />
              {latest ? (
                <button onClick={() => openReport(latest.id)} className="w-full text-left block active:opacity-80 transition-opacity">
                  <div className="flex items-center justify-between gap-2">
                    <span className="kicker text-accent">{t('stocksearch.latest')}</span>
                    {(() => {
                      const rec = recommendationOf(latest.body);
                      return <span className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0 ${REC_STYLE[rec.tone]}`}>{rec.label}</span>;
                    })()}
                  </div>
                  <h3 className="font-display text-[19px] font-medium text-ink-900 leading-snug mt-1.5">{latest.title}</h3>
                  <p className="text-[13px] text-ink-700 leading-snug mt-1.5 line-clamp-3">{latest.summary}</p>
                  {/* Generated time (left) · views (right) — moved below the summary */}
                  <div className="mt-3 pt-3 border-t border-accent/20 flex items-center justify-between text-[12px]">
                    <span className="font-mono text-ink-500">{genDate(latest.at)}</span>
                    <span className="inline-flex items-center gap-1.5 text-ink-500" title={t('stocksearch.readers', { n: latest.reads.toLocaleString() })}>
                      <Eye size={13} className="text-ink-400" strokeWidth={1.8} />
                      {latest.reads.toLocaleString()}
                    </span>
                  </div>
                </button>
              ) : (
                <div className="text-center py-3">
                  <p className="text-[15px] font-medium text-ink-900">{generating ? t('stocksearch.generating') : t('stocksearch.noReports')}</p>
                  {!generating && <p className="text-[13px] text-ink-700 mt-1">{t('stocksearch.noReportsHint', { symbol: stock.symbol })}</p>}
                </div>
              )}

              {/* Actions enclosed in the box */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={onRefresh}
                  disabled={generating}
                  className="relative flex-1 btn-accent py-3 font-medium text-[14px] inline-flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  <RefreshCw size={16} className={generating ? 'animate-spin' : ''} strokeWidth={2} />
                  {generating ? t('stocksearch.generating') : t('stocksearch.refresh')}
                  {!generating && (
                    <span className="absolute right-3 text-[11px] font-normal opacity-80">{t('stocksearch.estTokens', { n: EST_TOKENS })}</span>
                  )}
                </button>
                <button
                  onClick={handleAddToWatchlist}
                  disabled={inWatchlist}
                  className={`shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-sm text-[14px] font-medium border transition-colors duration-200 ease-out-expo ${
                    inWatchlist
                      ? 'border-ink-300 text-ink-500 bg-card/70 cursor-default'
                      : 'border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-paper active:bg-ink-100'
                  }`}
                >
                  {inWatchlist
                    ? <><Check size={15} strokeWidth={2} /> {t('stocksearch.inWatchlist')}</>
                    : <><Plus size={15} strokeWidth={2} /> {t('stocksearch.addWatchlist')}</>}
                </button>
              </div>
              <p className="mt-2 text-[12px] text-ink-500 leading-snug flex items-start gap-1.5">
                <Coins size={13} className="mt-0.5 shrink-0 text-ink-400" strokeWidth={1.8} />
                <span>{t('stocksearch.creditsNote')}</span>
              </p>
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

              {/* Trending — top 5 as vertical rows with counts, the rest as horizontal bubbles */}
              <div className="mt-8">
                <SectionDivider title={t('stocksearch.trending')} />
                <div className="mt-2.5 space-y-1.5">
                  {TRENDING_SEARCHES.slice(0, 5).map((it, i) => (
                    <TrendingRow key={it.stock.symbol} rank={i + 1} item={it} onPick={selectStock} />
                  ))}
                </div>
                {TRENDING_SEARCHES.length > 5 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {TRENDING_SEARCHES.slice(5).map((it) => (
                      <QuoteBubble key={it.stock.symbol} s={it.stock} onPick={selectStock} />
                    ))}
                  </div>
                )}
              </div>

              {/* Your recent searches — horizontal bubbles */}
              {recent.length > 0 && (
                <div className="mt-6 pb-4">
                  <SectionDivider title={t('stocksearch.previous')} />
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {recent.map((s) => (
                      <QuoteBubble key={s.symbol} s={s} onPick={selectStock} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Other reports mentioning this stock — the stock's own dossiers plus any
            desk/agent reports that reference it. */}
        {stock && otherCount > 0 && (
          <div className="px-5 mt-7 w-full max-w-2xl mx-auto pb-6">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-label text-ink-500 shrink-0">{t('stocksearch.allReports', { symbol: stock.symbol })}</span>
              <div className="flex-1 h-px bg-ink-200" />
              <span className="text-[11px] font-mono text-ink-300 shrink-0">{otherCount}</span>
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
              {mentionResults.map((r) => {
                const agent = agents.find((a) => a.id === r.agentId);
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => setOpenResult(r)}
                      className="w-full text-left flex items-center gap-3 px-2 py-3 border-b border-ink-200 rounded-md transition-colors hover:bg-ink-50"
                    >
                      <FileText size={15} className="text-ink-300 shrink-0" strokeWidth={1.6} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-medium text-ink-900 truncate leading-tight">{r.title}</span>
                        <span className="block text-[11px] font-mono text-ink-500 mt-0.5">
                          {agent ? t('meta.by', { name: agent.name }) : ''} · {genDate(r.at)}
                        </span>
                      </span>
                      <ChevronRight size={15} className="text-ink-300 shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  // Modal overlay for a desk report that mentions this stock (shared across layouts).
  const resultModal = openResult && (() => {
    const agent = agents.find((a) => a.id === openResult.agentId);
    if (!agent) return null;
    return <ResultViewerModal result={openResult} agent={agent} onClose={() => setOpenResult(null)} />;
  })();

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
        {resultModal}
      </div>
    );
  }

  // ---- Mobile: control pane fills the screen; report opens as an overlay ----
  return (
    <>
      {controlPane}
      {searchOpen && <StockSearchModal onClose={() => setSearchOpen(false)} onSelect={selectStock} />}
      {resultModal}
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

// Divider header for the trending / recent sections.
function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-medium uppercase tracking-label text-ink-500 shrink-0">{title}</span>
      <div className="flex-1 h-px bg-ink-200" />
    </div>
  );
}

// Illustrative quote for a bubble — deterministic synthetic model (no network),
// so every bubble always shows a plausible price + change.
function bubbleQuote(s: DirectoryStock): Quote {
  return syntheticQuote({ symbol: s.symbol, market: s.market, name: s.name, addedAt: '', closeOnAdd: s.anchor });
}

// A compact pill bubble: stock code · price · today's change. Used horizontally.
function QuoteBubble({ s, onPick }: { s: DirectoryStock; onPick: (s: DirectoryStock) => void }) {
  const q = bubbleQuote(s);
  const up = q.changePct >= 0;
  return (
    <button
      onClick={() => onPick(s)}
      title={s.name}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill border border-ink-200 hover:border-accent transition-colors"
    >
      <span className="font-mono text-[12px] text-ink-900">{s.symbol}</span>
      <span className="font-mono text-[12px] text-ink-500">{fmtPrice(q.price, currencyFor(s.market))}</span>
      <span className={`font-mono text-[11px] ${up ? 'text-success' : 'text-danger'}`}>{pct(q.changePct)}</span>
    </button>
  );
}

// A full-width trending row: rank · code · price · change · search count.
function TrendingRow({ rank, item, onPick }: { rank: number; item: TrendingItem; onPick: (s: DirectoryStock) => void }) {
  const t = useT();
  const s = item.stock;
  const q = bubbleQuote(s);
  const up = q.changePct >= 0;
  return (
    <button
      onClick={() => onPick(s)}
      title={s.name}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-md border border-ink-200 hover:border-accent transition-colors text-left"
    >
      <span className="text-[11px] font-mono text-ink-400 w-3 shrink-0">{rank}</span>
      <span className="font-mono text-[13px] text-ink-900 shrink-0 w-[72px]">{s.symbol}</span>
      <span className="font-mono text-[12px] text-ink-500">{fmtPrice(q.price, currencyFor(s.market))}</span>
      <span className={`font-mono text-[12px] ${up ? 'text-success' : 'text-danger'}`}>{pct(q.changePct)}</span>
      <span className="ml-auto text-[11px] text-ink-400 shrink-0">{t('stocksearch.searches', { n: item.count.toLocaleString() })}</span>
    </button>
  );
}
