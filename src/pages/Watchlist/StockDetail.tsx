import { useParams, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { AppHeader } from '../../components/AppHeader';
import { Sparkline } from '../../components/Sparkline';
import { ConfirmDeleteSheet } from '../../components/ConfirmDeleteSheet';
import { StockReportPane } from '../../components/StockReportPane';
import { ResultViewerModal } from '../../components/ResultViewerModal';
import { useT } from '../../lib/i18n';
import { fmtPrice, fmtVol, pct, dateOnly } from '../../lib/format';
import { currencyFor, syntheticQuote, type Quote } from '../../lib/stocks';
import { createStockReport, recommendationOf, type StockReport } from '../../lib/stockReport';
import { loadReports, addReport } from '../../lib/stockReportStore';
import type { Result } from '../../types';
import { Trash2, Eye, RefreshCw, FileText, ChevronRight, X } from 'lucide-react';

const EST_TOKENS = 10;

const REC_STYLE: Record<'buy' | 'hold' | 'sell', string> = {
  buy: 'bg-success/15 text-success',
  hold: 'bg-ink-100 text-ink-700',
  sell: 'bg-danger/15 text-danger',
};

function marketLabel(m: string) {
  return m === 'US' ? 'US' : m === 'HK' ? 'Hong Kong' : m === 'JP' ? 'Japan' : 'A-Share';
}

export function StockDetail() {
  const { symbol = '' } = useParams();
  const decoded = decodeURIComponent(symbol);
  const { watchlists, removeFromWatchlists, results, agents } = useApp();
  const t = useT();
  const [confirm, setConfirm] = useState(false);
  const [reports, setReports] = useState<StockReport[]>(() => loadReports(decoded));
  const [generating, setGenerating] = useState(false);
  const [reportOverlay, setReportOverlay] = useState<StockReport | null>(null);
  const [openResult, setOpenResult] = useState<Result | null>(null);

  // A stock may live in several lists; find its first occurrence across all of them.
  const s = useMemo(
    () => watchlists.flatMap((l) => l.stocks).find((x) => x.symbol === decoded),
    [watchlists, decoded],
  );

  // A display dossier for the "House read" when the stock has no report yet.
  const generatedReport = useMemo(() => {
    if (!s) return null;
    const q: Quote = s.price !== undefined
      ? { price: s.price, open: s.open ?? s.price, high: s.high ?? s.price, low: s.low ?? s.price, volume: s.volume ?? 0, changePct: s.changePct ?? 0 }
      : syntheticQuote(s);
    return createStockReport({ symbol: s.symbol, name: s.name, market: s.market, anchor: s.closeOnAdd }, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?.symbol]);

  // Desk/agent reports that mention this stock (by structured mention or keyword).
  const mentionResults = useMemo(() => {
    if (!s) return [];
    const sym = s.symbol.toUpperCase();
    return results
      .filter((r) => r.stocks.some((x) => x.symbol.toUpperCase() === sym) || r.keywords.some((k) => k.toUpperCase() === sym))
      .sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [results, s?.symbol]);

  if (!s) return (
    <div className="flex-1 min-h-0 flex flex-col bg-paper">
      <AppHeader back title={decoded} />
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-3">
        <p className="text-[15px] text-ink-500">Not in your watchlist.</p>
        <Link to="/watchlist" className="text-[14px] text-accent font-medium">Back to watchlist</Link>
      </div>
    </div>
  );

  const ccy = currencyFor(s.market);
  // Prices load on the Watchlist page; if the user deep-links straight here,
  // synthesize a plausible quote so the hero and chart always render.
  const live = s.price !== undefined ? s : { ...s, ...syntheticQuote(s) };
  const up = (live.changePct ?? 0) >= 0;
  const sinceAdd = live.price && live.closeOnAdd ? ((live.price - live.closeOnAdd) / live.closeOnAdd) * 100 : undefined;

  // Derived fundamentals for the stats grid.
  const eps = (live.price !== undefined && s.pe) ? live.price / s.pe : undefined;
  const forwardPe = s.pe ? s.pe / 1.15 : undefined; // illustrative (~15% forward earnings growth)

  // House read = the latest real report for this stock, else the display dossier.
  const latest = reports[0] ?? generatedReport;
  const rec = latest ? recommendationOf(latest.body) : null;
  const otherReports = reports.filter((r) => r.id !== latest?.id);
  const otherCount = otherReports.length + mentionResults.length;

  const remove = () => {
    removeFromWatchlists(s.symbol);
    history.back();
  };

  const onRefresh = () => {
    if (generating) return;
    setGenerating(true);
    setTimeout(() => {
      const q: Quote = live.price !== undefined
        ? { price: live.price, open: live.open ?? live.price, high: live.high ?? live.price, low: live.low ?? live.price, volume: live.volume ?? 0, changePct: live.changePct ?? 0 }
        : syntheticQuote(s);
      const report = createStockReport({ symbol: s.symbol, name: s.name, market: s.market, anchor: s.closeOnAdd }, q);
      setReports(addReport(report));
      setGenerating(false);
    }, 1000);
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col bg-paper">
      <AppHeader back title={s.symbol} subtitle={s.name}
        right={<button onClick={() => setConfirm(true)} className="text-ink-500 hover:text-ink-900 transition-colors p-1" aria-label={t('watchlist.remove.confirm')}><Trash2 size={16}/></button>}/>

      <div className="flex-1 min-h-0 overflow-y-auto w-full max-w-3xl mx-auto">
        {/* Price hero + chart */}
        <section className="px-5 pt-5 pb-2 border-b border-ink-200">
          <p className="kicker font-mono">{marketLabel(s.market)} · {s.symbol}</p>
          <div className="flex items-end justify-between gap-3 mt-1.5">
            <p className="font-display text-[38px] font-medium text-ink-900 leading-none">{fmtPrice(live.price, ccy)}</p>
            {live.changePct !== undefined && (
              <p className={`font-mono text-[16px] mb-1 ${up ? 'text-success' : 'text-danger'}`}>{pct(live.changePct)} today</p>
            )}
          </div>
          {live.price !== undefined && (
            <div className="mt-4 -mx-1">
              <Sparkline symbol={s.symbol} price={live.price} changePct={live.changePct ?? 0} width={640} height={150} fill className="w-full h-auto" />
            </div>
          )}
        </section>

        {/* Since you added — the personal hook */}
        {sinceAdd !== undefined && (
          <section className="px-5 py-3.5 border-b border-ink-200 flex items-center justify-between gap-3">
            <p className="text-[14px] text-ink-500">
              Since you added on <span className="text-ink-900">{dateOnly(s.addedAt)}</span> at {fmtPrice(s.closeOnAdd, ccy)}
            </p>
            <p className={`font-mono text-[16px] shrink-0 ${sinceAdd >= 0 ? 'text-success' : 'text-danger'}`}>{pct(sinceAdd)}</p>
          </section>
        )}

        {/* Key stats — two columns */}
        <section className="px-5 py-4 border-b border-ink-200">
          <h3 className="kicker mb-3">Key stats</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
            <Stat label="Open" value={fmtPrice(live.open, ccy)} />
            <Stat label="Volume" value={fmtVol(live.volume)} />
            <Stat label="Day range" value={`${fmtPrice(live.low, ccy)} – ${fmtPrice(live.high, ccy)}`} />
            <Stat label="52-week range" value={`${fmtPrice(s.low52, ccy)} – ${fmtPrice(s.high52, ccy)}`} />
            <Stat label="P/E" value={s.pe?.toFixed(1) ?? '—'} />
            <Stat label="P/E (Forward)" value={forwardPe?.toFixed(1) ?? '—'} />
            <Stat label="Market cap" value={s.mktCap ?? '—'} />
            <Stat label="EPS" value={eps !== undefined ? fmtPrice(eps, ccy) : '—'} />
          </dl>
        </section>

        {/* House read report — the latest dossier for this stock */}
        {latest && (
          <section className="px-5 py-4 border-b border-ink-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] font-medium uppercase tracking-label text-ink-500 shrink-0">House read</span>
              <div className="flex-1 h-px bg-ink-200" />
            </div>
            <button
              onClick={() => setReportOverlay(latest)}
              className="w-full text-left relative overflow-hidden rounded-xl border border-accent/20 bg-accent-soft p-4 pl-5 active:opacity-90 transition-opacity"
            >
              <span className="absolute left-0 inset-y-0 w-1 bg-accent" aria-hidden />
              <div className="flex items-center justify-between gap-2">
                <span className="kicker text-accent">{t('stocksearch.latest')}</span>
                {rec && <span className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0 ${REC_STYLE[rec.tone]}`}>{rec.label}</span>}
              </div>
              <h3 className="font-display text-[18px] font-medium text-ink-900 leading-snug mt-1.5">{latest.title}</h3>
              <p className="text-[13px] text-ink-700 leading-snug mt-1.5 line-clamp-3">{latest.summary}</p>
              <div className="mt-3 pt-3 border-t border-accent/20 flex items-center justify-between text-[12px]">
                <span className="font-mono text-ink-500">{dateOnly(latest.at)}</span>
                <span className="inline-flex items-center gap-1.5 text-ink-500">
                  <Eye size={13} className="text-ink-400" strokeWidth={1.8} />
                  {latest.reads.toLocaleString()}
                </span>
              </div>
            </button>
            <button
              onClick={onRefresh}
              disabled={generating}
              className="relative w-full mt-3 btn-accent py-3 font-medium text-[14px] inline-flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <RefreshCw size={16} className={generating ? 'animate-spin' : ''} strokeWidth={2} />
              {generating ? t('stocksearch.generating') : t('stocksearch.refresh')}
              {!generating && (
                <span className="absolute right-3 text-[11px] font-normal opacity-80">{t('stocksearch.estTokens', { n: EST_TOKENS })}</span>
              )}
            </button>
          </section>
        )}

        {/* Other reports mentioning this stock */}
        {otherCount > 0 && (
          <section className="px-5 py-4">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-label text-ink-500 shrink-0">{t('stocksearch.allReports', { symbol: s.symbol })}</span>
              <div className="flex-1 h-px bg-ink-200" />
              <span className="text-[11px] font-mono text-ink-300 shrink-0">{otherCount}</span>
            </div>
            <ul>
              {otherReports.map((r) => (
                <li key={r.id}>
                  <button onClick={() => setReportOverlay(r)} className="w-full text-left flex items-center gap-3 px-2 py-3 border-b border-ink-200 rounded-md transition-colors hover:bg-ink-50">
                    <FileText size={15} className="text-ink-300 shrink-0" strokeWidth={1.6} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-medium text-ink-900 truncate leading-tight">{r.title}</span>
                      <span className="block text-[11px] font-mono text-ink-500 mt-0.5">{dateOnly(r.at)}</span>
                    </span>
                    <ChevronRight size={15} className="text-ink-300 shrink-0" />
                  </button>
                </li>
              ))}
              {mentionResults.map((r) => {
                const agent = agents.find((a) => a.id === r.agentId);
                return (
                  <li key={r.id}>
                    <button onClick={() => setOpenResult(r)} className="w-full text-left flex items-center gap-3 px-2 py-3 border-b border-ink-200 rounded-md transition-colors hover:bg-ink-50">
                      <FileText size={15} className="text-ink-300 shrink-0" strokeWidth={1.6} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-medium text-ink-900 truncate leading-tight">{r.title}</span>
                        <span className="block text-[11px] font-mono text-ink-500 mt-0.5">{agent ? t('meta.by', { name: agent.name }) : ''} · {dateOnly(r.at)}</span>
                      </span>
                      <ChevronRight size={15} className="text-ink-300 shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      {/* Full report overlay */}
      {reportOverlay && (
        <div className="absolute inset-0 z-30 bg-paper flex flex-col">
          <header className="shrink-0 px-4 py-3 border-b border-ink-200 flex items-center gap-2">
            <button onClick={() => setReportOverlay(null)} className="p-1 text-ink-700 hover:text-ink-900 transition-colors" aria-label={t('common.close')}>
              <X size={20} />
            </button>
            <span className="font-mono text-[13px] text-ink-500 truncate">{reportOverlay.symbol}</span>
          </header>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <StockReportPane report={reportOverlay} />
          </div>
        </div>
      )}

      {openResult && (() => {
        const agent = agents.find((a) => a.id === openResult.agentId);
        if (!agent) return null;
        return <ResultViewerModal result={openResult} agent={agent} onClose={() => setOpenResult(null)} />;
      })()}

      {confirm && (
        <ConfirmDeleteSheet
          title={t('watchlist.remove.title', { symbol: s.symbol })}
          body={t('watchlist.remove.body')}
          sureTitle={t('watchlist.remove.sureTitle')}
          sureBody={t('watchlist.remove.sureBody', { symbol: s.symbol })}
          confirmLabel={t('watchlist.remove.confirm')}
          confirmFinalLabel={t('watchlist.remove.confirmFinal')}
          onCancel={() => setConfirm(false)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] text-ink-500">{label}</dt>
      <dd className="font-mono text-[16px] text-ink-900 mt-0.5 truncate">{value}</dd>
    </div>
  );
}
