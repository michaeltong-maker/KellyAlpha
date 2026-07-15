import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { useT, type MessageKey } from '../lib/i18n';
import { pct, dateOnly, fmtPrice } from '../lib/format';
import { currencyFor } from '../lib/stocks';
import { buildTrackRecord, groupStats, totalAvg, firstCallDate, benchmarkReturn, type GroupStat, type Signal } from '../lib/trackRecord';

const SIGNAL_LABEL: Record<Signal, MessageKey> = {
  strong_buy: 'track.signal.strong_buy',
  buy: 'track.signal.buy',
  sell: 'track.signal.sell',
  strong_sell: 'track.signal.strong_sell',
};

const SIGNAL_STYLE: Record<Signal, string> = {
  strong_buy: 'bg-success/15 text-success font-semibold',
  buy: 'bg-success/10 text-success',
  sell: 'bg-danger/10 text-danger',
  strong_sell: 'bg-danger/15 text-danger font-semibold',
};

const colorOf = (v: number) => (v >= 0 ? 'text-success' : 'text-danger');
const fmtWin = (v: number) => (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + '%';

export function TrackRecord({ agentId }: { agentId: string }) {
  const t = useT();
  const calls = useMemo(() => buildTrackRecord(agentId), [agentId]);
  const openGroups = useMemo(() => groupStats(calls.filter((c) => !c.closed)), [calls]);
  const closedGroups = useMemo(() => groupStats(calls.filter((c) => c.closed)), [calls]);
  const closedCount = useMemo(() => calls.filter((c) => c.closed).length, [calls]);
  const avg = totalAvg(calls);
  const first = firstCallDate(calls);
  const sp = benchmarkReturn(first, 'sp');
  const hk = benchmarkReturn(first, 'hk');
  const [showClosed, setShowClosed] = useState(false);

  return (
    <section className="px-4 py-3 border-b border-ink-200">
      <h3 className="text-[11px] uppercase tracking-label text-ink-500 mb-2">{t('track.title')}</h3>
      <div className="rounded-lg border border-ink-200 p-4">
        {/* Top stats — sample size, avg return, and benchmarks over the window */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label={t('track.sampleSize')} value={String(calls.length)} />
          <Stat label={t('track.avgReturn')} value={pct(avg)} tone={colorOf(avg)} />
          <Stat label={t('track.sp')} value={pct(sp)} tone={colorOf(sp)} />
          <Stat label={t('track.hk')} value={pct(hk)} tone={colorOf(hk)} />
        </div>

        {/* Open positions — marked at current prices */}
        <div className="mt-4">
          <CallTable groups={openGroups} mode="open" agentId={agentId} />
        </div>
        <p className="mt-3 text-[12px] text-ink-500">{t('track.unsettled')}</p>

        {/* Closed positions — collapsed until the user opens the details */}
        {closedCount > 0 && (
          <div className="mt-3 pt-3 border-t border-ink-200">
            <button
              onClick={() => setShowClosed((v) => !v)}
              className="w-full flex items-center gap-2 text-left"
              aria-expanded={showClosed}
            >
              <span className="text-[11px] uppercase tracking-label text-ink-500">{t('track.closed')}</span>
              <span className="text-[11px] font-mono text-ink-300">{closedCount}</span>
              <span className="ml-auto inline-flex items-center gap-1 text-[12px] text-accent font-medium">
                {showClosed ? t('track.hide') : t('track.details')}
                <ChevronDown size={14} className={`transition-transform ${showClosed ? 'rotate-180' : ''}`} />
              </span>
            </button>
            {showClosed && (
              <div className="mt-3">
                <CallTable groups={closedGroups} mode="closed" agentId={agentId} />
              </div>
            )}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-ink-200">
          <p className="text-[12px] font-mono text-ink-500">{t('track.since', { date: dateOnly(first) })}</p>
          <p className="mt-1.5 text-[11px] text-ink-400 leading-relaxed">{t('track.disclaimer')}</p>
        </div>
      </div>
    </section>
  );
}

// Grouped call table. Open positions show today's price; closed positions show
// the sell date and sell price instead.
function CallTable({ groups, mode, agentId }: { groups: GroupStat[]; mode: 'open' | 'closed'; agentId: string }) {
  const t = useT();
  const cols = mode === 'open' ? 6 : 7;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px] border-collapse">
        <thead>
          <tr className="text-ink-500 text-[10px] uppercase tracking-label">
            <th className="text-left font-medium py-1.5 pr-2">{t('track.col.stock')}</th>
            <th className="text-left font-medium py-1.5 px-2 whitespace-nowrap">{t('track.col.date')}</th>
            <th className="text-right font-medium py-1.5 px-2">{t('track.col.callPrice')}</th>
            {mode === 'open' ? (
              <th className="text-right font-medium py-1.5 px-2">{t('track.col.today')}</th>
            ) : (
              <>
                <th className="text-left font-medium py-1.5 px-2 whitespace-nowrap">{t('track.col.sellDate')}</th>
                <th className="text-right font-medium py-1.5 px-2">{t('track.col.sellPrice')}</th>
              </>
            )}
            <th className="text-right font-medium py-1.5 px-2">{t('track.col.return')}</th>
            <th className="text-right font-medium py-1.5 pl-2">{t('track.col.report')}</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <Fragment key={g.signal}>
              {/* Signal divider with win rate + avg */}
              <tr>
                <td colSpan={cols} className="pt-3 pb-2">
                  <div className="flex items-center gap-2 border-t border-ink-200 pt-2.5">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full ${SIGNAL_STYLE[g.signal]}`}>{t(SIGNAL_LABEL[g.signal])}</span>
                    <span className="ml-auto text-[11px] text-ink-500 whitespace-nowrap">
                      {t('track.winRate', { p: fmtWin(g.winRate) })} · {t('track.groupAvg', { v: pct(g.avg) })}
                    </span>
                  </div>
                </td>
              </tr>
              {g.calls.map((c) => (
                <tr key={c.id} className="border-b border-ink-100">
                  <td className="py-2 pr-2 font-mono text-ink-900 whitespace-nowrap">{c.symbol}</td>
                  <td className="py-2 px-2 text-ink-500 whitespace-nowrap">{dateOnly(c.at)}</td>
                  <td className="py-2 px-2 text-right font-mono text-ink-700 whitespace-nowrap">{fmtPrice(c.callPrice, currencyFor(c.market))}</td>
                  {mode === 'open' ? (
                    <td className="py-2 px-2 text-right font-mono text-ink-700 whitespace-nowrap">{fmtPrice(c.currentPrice, currencyFor(c.market))}</td>
                  ) : (
                    <>
                      <td className="py-2 px-2 text-ink-500 whitespace-nowrap">{c.sellAt ? dateOnly(c.sellAt) : '—'}</td>
                      <td className="py-2 px-2 text-right font-mono text-ink-700 whitespace-nowrap">{c.sellPrice !== undefined ? fmtPrice(c.sellPrice, currencyFor(c.market)) : '—'}</td>
                    </>
                  )}
                  <td className={`py-2 px-2 text-right font-mono whitespace-nowrap ${colorOf(c.returnPct)}`}>{pct(c.returnPct)}</td>
                  <td className="py-2 pl-2 text-right">
                    <Link to={`/chat/${agentId}/reports`} className="inline-flex text-ink-400 hover:text-accent transition-colors" aria-label={t('track.col.report')}>
                      <ArrowUpRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-label text-ink-400 leading-tight">{label}</p>
      <p className={`font-display text-[22px] font-medium leading-none mt-1 ${tone ?? 'text-ink-900'}`}>{value}</p>
    </div>
  );
}
