import { useParams, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { AppHeader } from '../../components/AppHeader';
import { Sparkline } from '../../components/Sparkline';
import { ConfirmDeleteSheet } from '../../components/ConfirmDeleteSheet';
import { useT } from '../../lib/i18n';
import { fmtPrice, fmtVol, pct, dateOnly } from '../../lib/format';
import { currencyFor, syntheticQuote } from '../../lib/stocks';
import { Trash2 } from 'lucide-react';

function marketLabel(m: string) {
  return m === 'US' ? 'US' : m === 'HK' ? 'Hong Kong' : m === 'JP' ? 'Japan' : 'A-Share';
}

export function StockDetail() {
  const { symbol = '' } = useParams();
  const decoded = decodeURIComponent(symbol);
  const { watchlist, setWatchlist } = useApp();
  const t = useT();
  const [confirm, setConfirm] = useState(false);
  const s = useMemo(() => watchlist.find((x) => x.symbol === decoded), [watchlist, decoded]);

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

  const remove = () => {
    setWatchlist((cur) => cur.filter((x) => x.symbol !== s.symbol));
    history.back();
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

        {/* Session + fundamentals */}
        <section className="px-5 py-4">
          <h3 className="kicker mb-3">Session</h3>
          <dl className="divide-y divide-ink-200">
            <Row label="Open" value={fmtPrice(live.open, ccy)} />
            <Row label="Day range" value={`${fmtPrice(live.low, ccy)} – ${fmtPrice(live.high, ccy)}`} />
            <Row label="Volume" value={fmtVol(live.volume)} />
            <Row label="52-week range" value={`${fmtPrice(s.low52, ccy)} – ${fmtPrice(s.high52, ccy)}`} />
            <Row label="Market cap" value={s.mktCap ?? '—'} />
            <Row label="P/E" value={s.pe?.toFixed(1) ?? '—'} />
            <Row label="P/E (TTM)" value={s.peTTM?.toFixed(1) ?? '—'} />
          </dl>
        </section>
      </div>

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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <dt className="text-[14px] text-ink-500">{label}</dt>
      <dd className="font-mono text-[15px] text-ink-900">{value}</dd>
    </div>
  );
}
