import { useMemo, useState } from 'react';
import { FileText, BookOpen } from 'lucide-react';
import type { Agent } from '../types';
import { createSampleResult } from '../lib/result';
import { ResultViewerModal } from './ResultViewerModal';
import { StockChip } from './StockChip';
import { MarkdownView } from './MarkdownView';
import { InlineStocks } from './InlineStocks';
import { useApp } from '../hooks/useApp';
import { useT } from '../lib/i18n';

export function SampleOutput({ agent }: { agent: Agent }) {
  const { watchlist } = useApp();
  const t = useT();
  // Deterministic sample result for this agent (with live stock prices when available).
  const result = useMemo(() => createSampleResult(agent, watchlist), [agent.id, watchlist]);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="px-4 py-4 border-b border-ink-200">
      <div className="flex items-center gap-1.5 mb-2">
        <FileText size={13} className="text-ink-500" strokeWidth={1.6} />
        <h3 className="text-[11px] uppercase tracking-label text-ink-500">{t("sample.title")}</h3>
      </div>

      {/* Title */}
      <p className="font-display text-[19px] font-medium text-ink-900 leading-tight">{result.title}</p>

      {/* Summary block */}
      <div className="mt-3 rounded-lg bg-ink-100 px-3.5 py-3">
        <p className="text-[11px] uppercase tracking-label text-ink-500 mb-1">{t("chat.result.summary")}</p>
        <p className="text-[15px] text-ink-700 leading-snug">
          <InlineStocks text={result.summary} stocks={result.stocks} />
        </p>
      </div>

      {/* Stocks referenced */}
      {result.stocks.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] uppercase tracking-label text-ink-500 mb-1.5">{t("chat.result.stocks")}</p>
          <div className="flex flex-wrap gap-1.5">
            {result.stocks.map((s) => <StockChip key={s.symbol} stock={s} />)}
          </div>
        </div>
      )}

      {/* Detailed result */}
      <div className="mt-4 border-t border-ink-200 pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <BookOpen size={13} className="text-ink-500" strokeWidth={1.6} />
            <p className="text-[11px] uppercase tracking-label text-ink-500">{t("sample.detailed")}</p>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[13px] text-ink-500 hover:text-ink-900 transition-colors"
          >
            {expanded ? t('result.collapse') : t('result.expandAll')}
          </button>
        </div>

        <div className={`${expanded ? '' : 'max-h-44 overflow-hidden relative'}`}>
          <MarkdownView body={result.body} stocks={result.stocks} />
          {!expanded && (
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-paper to-transparent pointer-events-none" />
          )}
        </div>
      </div>

      {/* Open as markdown */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setOpen(true)}
          className="flex-1 btn-accent px-5 py-3 text-[14px] font-medium inline-flex items-center justify-center gap-1.5 duration-200 ease-out-expo"
        >
          <FileText size={14} strokeWidth={1.8}/> {t("result.readFull")}
        </button>
      </div>

      {open && (
        <ResultViewerModal
          result={result}
          agent={agent}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}
