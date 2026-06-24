import { useEffect, useMemo } from 'react';
import { Download } from 'lucide-react';
import type { StockReport } from '../lib/stockReport';
import { stockReportToMarkdown, RESEARCH_DESK } from '../lib/stockReport';
import { MarkdownView } from './MarkdownView';
import { StockChip } from './StockChip';
import { InlineStocks } from './InlineStocks';
import { StrideRule } from './StrideRule';
import { ConvictionGauge } from './ConvictionGauge';
import { useT } from '../lib/i18n';

/**
 * Renders a StockReport in AlphaWalk's dossier format — the same masthead /
 * dateline / drop-cap / stride-rule treatment as agent reports, minus the
 * agent-and-chat coupling. Used in the Stock Search right pane (desktop) and
 * full-screen on mobile.
 */
export function StockReportPane({ report }: { report: StockReport }) {
  const t = useT();
  const md = useMemo(() => stockReportToMarkdown(report), [report.id]);
  const blob = useMemo(() => {
    const b = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    return { url: URL.createObjectURL(b), filename: report.artifactFilename };
  }, [md, report.artifactFilename]);
  useEffect(() => () => URL.revokeObjectURL(blob.url), [blob.url]);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-paper">
      {/* Header band */}
      <header className="shrink-0 px-5 py-3 border-b border-ink-200 flex items-center gap-2 bg-paper">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[13px] text-ink-700 truncate">{blob.filename}</p>
          <p className="text-[11px] uppercase tracking-label text-ink-500 mt-0.5">{t('result.markdown')}</p>
        </div>
        <a
          href={blob.url}
          download={blob.filename}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm text-[13px] font-medium text-ink-900 border border-ink-900 hover:bg-ink-900 hover:text-paper transition-colors duration-200 ease-out-expo"
          aria-label="download"
        >
          <Download size={14} strokeWidth={1.8} /> .md
        </a>
      </header>

      {/* Body — the dossier */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-8">
        <article className="mx-auto dossier-rise" style={{ maxWidth: 660 }}>
          {/* Masthead */}
          <div className="flex flex-col items-center gap-2 pb-4 border-b-2 border-ink-900">
            <StrideRule width={42} animate />
            <p className="kicker">{RESEARCH_DESK}</p>
          </div>

          {/* Dateline — generation date is explicit, per the brief */}
          <p className="kicker text-center mt-5">
            {new Date(report.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            {'  ·  '}{report.byline}
          </p>

          {/* Headline */}
          <h2 className="font-display text-[32px] font-medium text-ink-900 mt-3 leading-[1.08] text-center text-balance">
            {report.title}
          </h2>

          <ConvictionGauge body={report.body} />

          {/* Drop-capped lede */}
          <p className="lede-dropcap text-[17px] text-ink-700 leading-relaxed mt-6">
            <InlineStocks text={report.summary} stocks={report.stocks} />
          </p>

          {report.stocks.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="kicker shrink-0">{t('chat.result.stocks')}</span>
              <div className="flex flex-wrap gap-1.5">
                {report.stocks.map((st) => (
                  <StockChip key={st.symbol} stock={st} size="md" />
                ))}
              </div>
            </div>
          )}

          <StrideRule divider width={30} className="my-7" />

          <MarkdownView body={report.body} stocks={report.stocks} />

          {report.keywords.length > 0 && (
            <div className="mt-7 flex flex-wrap gap-1.5">
              {report.keywords.map((k) => (
                <span key={k} className="text-[12px] px-2.5 py-0.5 rounded-pill border border-ink-200 text-ink-500">#{k}</span>
              ))}
            </div>
          )}

          {/* Colophon */}
          <div className="mt-10 pt-6 border-t border-ink-200 flex flex-col items-center gap-2 text-center">
            <StrideRule width={26} />
            <p className="text-[13px] text-ink-700">{report.byline}</p>
            <p className="kicker">{t('result.confidential')}</p>
          </div>
        </article>
      </div>
    </div>
  );
}
