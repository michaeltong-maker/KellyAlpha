import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Download, ExternalLink, Share } from 'lucide-react';
import type { Agent, Result } from '../types';
import { MarkdownView } from './MarkdownView';
import { generateMarkdownBlob } from '../lib/result';
import { StockChip } from './StockChip';
import { InlineStocks } from './InlineStocks';
import { ShareSheet } from './ShareSheet';
import { StrideRule } from './StrideRule';
import { ConvictionGauge } from './ConvictionGauge';
import { useT } from '../lib/i18n';

const SENTINEL = 'alphawalk-result';

export function ResultViewerModal({ result, agent, onClose }: {
  result: Result;
  agent: Agent;
  onClose: () => void;
}) {
  const t = useT();
  const nav = useNavigate();
  const askAbout = (s: { symbol: string }) => {
    onClose();
    nav(`/chat/${agent.id}/report-chat?ask=${encodeURIComponent(t('ticker.askQuestion', { symbol: s.symbol }))}`);
  };
  const askLabel = t('ticker.ask', { name: agent.name });
  // Generate the downloadable .md artifact once per open.
  const artifact = useMemo(() => generateMarkdownBlob(result, agent), [result.id]);
  const artifactRef = useRef(artifact.blobUrl);
  const [shareOpen, setShareOpen] = useState(false);

  // Wire back gesture to close modal.
  useEffect(() => {
    const already = (window.history.state as { alphawalkModal?: string } | null)?.alphawalkModal === SENTINEL;
    if (!already) window.history.pushState({ alphawalkModal: SENTINEL }, '');

    let backed = false;
    const onPop = () => {
      backed = true;
      onClose();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!backed) {
        const state = window.history.state as { alphawalkModal?: string } | null;
        if (state?.alphawalkModal === SENTINEL) window.history.back();
      }
      URL.revokeObjectURL(artifactRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 z-30 bg-ink-900/70 flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col bg-paper shadow-overlay">
        {/* Header */}
        <header className="shrink-0 px-4 py-3 border-b border-ink-200 flex items-center gap-2">
          <button onClick={onClose} className="p-1 text-ink-700 hover:text-ink-900 transition-colors" aria-label="close">
            <X size={20} strokeWidth={1.6}/>
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[13px] text-ink-700 truncate">{artifact.filename}</p>
            <p className="text-[11px] uppercase tracking-label text-ink-500 mt-0.5">{t("result.markdown")}</p>
          </div>
          <a href={artifact.blobUrl} download={artifact.filename}
             className="p-1.5 rounded-sm text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors" aria-label="download">
            <Download size={16} strokeWidth={1.6}/>
          </a>
          <a href={artifact.blobUrl} target="_blank" rel="noreferrer"
             className="p-1.5 rounded-sm text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors" aria-label="open raw">
            <ExternalLink size={16} strokeWidth={1.6}/>
          </a>
          <button onClick={() => setShareOpen(true)}
             className="p-1.5 rounded-sm text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors" aria-label="share">
            <Share size={16} strokeWidth={1.6}/>
          </button>
        </header>

        {/* Body — the dossier */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-paper px-5 sm:px-8 py-8">
          <article className="mx-auto dossier-rise" style={{ maxWidth: 644 }}>
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
            <h2 className="font-display text-[30px] sm:text-[38px] font-medium text-ink-900 mt-3 leading-[1.08] text-center text-balance">
              {result.title}
            </h2>

            <ConvictionGauge body={result.body} />

            {/* Drop-capped lede */}
            <p className="lede-dropcap text-[17px] sm:text-[18px] text-ink-700 leading-relaxed mt-6">
              <InlineStocks text={result.summary} stocks={result.stocks} onAsk={askAbout} askLabel={askLabel} />
            </p>

            {/* Stocks referenced — inline, like a wire's tickers line */}
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

            {/* Body */}
            <MarkdownView body={result.body} stocks={result.stocks} onAsk={askAbout} askLabel={askLabel} />

            {/* Keywords */}
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

        {/* Footer CTAs */}
        <footer className="shrink-0 px-4 py-3 border-t border-ink-200 bg-paper">
          <a href={artifact.blobUrl} download={artifact.filename}
             className="flex rounded-sm bg-ink-900 text-paper px-5 py-3 text-[14px] font-medium items-center justify-center gap-1.5 transition-colors duration-200 ease-out-expo">
            <Download size={14} strokeWidth={1.8}/> {t("result.export")}
          </a>
        </footer>
      </div>

      {shareOpen && (
        <ShareSheet
          title={result.title}
          subtitle={`by ${agent.name}${agent.title ? ` · ${agent.title}` : ''}`}
          url={`https://alphawalk.app/desk/${result.id}`}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
