import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import type { Agent, Result } from '../types';
import { MarkdownView } from './MarkdownView';
import { StockChip } from './StockChip';
import { InlineStocks } from './InlineStocks';
import { StrideRule } from './StrideRule';
import { ConvictionGauge } from './ConvictionGauge';
import { generateMarkdownBlob } from '../lib/result';
import { useT } from '../lib/i18n';

/**
 * Inline result detail panel — same content as ResultViewerModal but without
 * the modal chrome (no overlay, no close button). Designed to sit inside a
 * right pane on desktop master-detail layouts (Desk, Reports List, etc.).
 */
export function ResultDetailPane({ result, agent }: { result: Result; agent: Agent }) {
  const t = useT();
  const nav = useNavigate();
  const askAbout = (s: { symbol: string }) => {
    nav(`/chat/${agent.id}/report-chat?ask=${encodeURIComponent(t('ticker.askQuestion', { symbol: s.symbol }))}`);
  };
  const askLabel = t('ticker.ask', { name: agent.name });
  const artifact = useMemo(() => generateMarkdownBlob(result, agent), [result.id]);
  useEffect(() => () => URL.revokeObjectURL(artifact.blobUrl), [artifact.blobUrl]);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-paper">
      {/* Header band */}
      <header className="shrink-0 px-5 py-3 border-b border-ink-200 flex items-center gap-2 bg-paper">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[13px] text-ink-700 truncate">{artifact.filename}</p>
          <p className="text-[11px] uppercase tracking-label text-ink-500 mt-0.5">{t("result.markdown")}</p>
        </div>
        <a
          href={artifact.blobUrl}
          download={artifact.filename}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm text-[13px] font-medium text-ink-900 border border-ink-900 hover:bg-ink-900 hover:text-paper transition-colors duration-200 ease-out-expo"
          aria-label="download"
        >
          <Download size={14} strokeWidth={1.8}/> .md
        </a>
      </header>

      {/* Body — the dossier */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-8">
        <article className="mx-auto dossier-rise" style={{ maxWidth: 660 }}>
          {/* Masthead */}
          <div className="flex flex-col items-center gap-2 pb-4 border-b-2 border-ink-900">
            <StrideRule width={42} animate />
            <p className="kicker">{t('result.masthead')}</p>
          </div>

          {/* Dateline */}
          <p className="kicker text-center mt-5">
            {new Date(result.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            {'  ·  '}{t('result.filedBy', { name: agent.name })}
          </p>

          {/* Headline */}
          <h2 className="font-display text-[32px] font-medium text-ink-900 mt-3 leading-[1.08] text-center text-balance">
            {result.title}
          </h2>

          <ConvictionGauge body={result.body} />

          {/* Drop-capped lede */}
          <p className="lede-dropcap text-[17px] text-ink-700 leading-relaxed mt-6">
            <InlineStocks text={result.summary} stocks={result.stocks} onAsk={askAbout} askLabel={askLabel} />
          </p>

          {result.stocks.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="kicker shrink-0">{t('chat.result.stocks')}</span>
              <div className="flex flex-wrap gap-1.5">
                {result.stocks.map((st) => (
                  <StockChip key={st.symbol} stock={st} size="md" onAsk={askAbout} askLabel={askLabel} />
                ))}
              </div>
            </div>
          )}

          <StrideRule divider width={30} className="my-7" />

          <MarkdownView body={result.body} stocks={result.stocks} onAsk={askAbout} askLabel={askLabel} />

          {result.keywords.length > 0 && (
            <div className="mt-7 flex flex-wrap gap-1.5">
              {result.keywords.map((k) => (
                <span key={k} className="text-[12px] px-2.5 py-0.5 rounded-pill border border-ink-200 text-ink-500">#{k}</span>
              ))}
            </div>
          )}

          {/* Colophon */}
          <div className="mt-10 pt-6 border-t border-ink-200 flex flex-col items-center gap-2 text-center">
            <StrideRule width={26} />
            <p className="text-[13px] text-ink-700">
              {t('result.filedBy', { name: agent.name })}{agent.title ? ` · ${agent.title}` : ''}
            </p>
            <p className="kicker">{t('result.confidential')}</p>
          </div>
        </article>
      </div>
    </div>
  );
}
