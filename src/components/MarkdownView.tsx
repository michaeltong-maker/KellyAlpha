import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { StockMention } from '../types';
import { splitTextWithStocks } from './InlineStocks';
import { StrideRule } from './StrideRule';

interface Props {
  body: string;
  stocks: StockMention[];
  className?: string;
  onAsk?: (stock: StockMention) => void;
  askLabel?: string;
}

// A stride-rule section divider that draws itself in the first time it scrolls
// into view — long dossiers feel typeset section by section as you read down.
function RevealStride() {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setSeen(true); io.disconnect(); } },
      { threshold: 0.7 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return (
    <div ref={ref} className="my-6 first:hidden">
      <StrideRule key={seen ? 'in' : 'out'} divider width={26} animate={seen} />
    </div>
  );
}

/**
 * Renders a Result's markdown body with inline stock chips. Whenever a known stock
 * symbol appears as a whole word in the text, it's replaced by a small chip showing
 * the company name, ticker, and current price.
 */
export function MarkdownView({ body, stocks, className = '', onAsk, askLabel }: Props) {
  const renderInline = (children: React.ReactNode): React.ReactNode => {
    if (stocks.length === 0) return children;
    return React.Children.map(children, (child) => {
      if (typeof child === 'string') {
        return splitTextWithStocks(child, stocks, 'sm', onAsk, askLabel);
      }
      return child;
    });
  };

  return (
    <div className={`prose-aw max-w-[70ch] ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="font-display text-[28px] font-medium text-ink-900 leading-tight mt-6 mb-3">{children}</h1>,
          h2: ({ children }) => <><RevealStride /><h2 className="font-display text-[22px] font-medium text-ink-900 leading-snug mt-5 mb-2">{children}</h2></>,
          h3: ({ children }) => <h3 className="text-[11px] uppercase tracking-label text-ink-500 mt-4 mb-1.5">{children}</h3>,
          p:  ({ children }) => <p className="text-[16px] text-ink-700 leading-[1.6] mb-3">{renderInline(children)}</p>,
          ul: ({ children }) => <ul className="list-disc ml-5 text-[16px] text-ink-700 leading-[1.6] space-y-1.5 mb-3">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal ml-5 text-[16px] text-ink-700 leading-[1.6] space-y-1.5 mb-3">{children}</ol>,
          li: ({ children }) => <li className="leading-[1.6]">{renderInline(children)}</li>,
          strong: ({ children }) => <strong className="font-medium text-ink-900">{renderInline(children)}</strong>,
          em: ({ children }) => <em className="not-italic text-ink-900">{renderInline(children)}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l border-ink-300 pl-4 text-[16px] text-ink-500 leading-[1.6] my-4">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-ink-100 px-1.5 py-0.5 rounded-sm text-[14px] font-mono text-ink-700">{children}</code>
          ),
          hr: () => <hr className="my-6 border-ink-200" />,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-accent underline-offset-2 hover:underline transition-colors">{children}</a>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
