import React from 'react';
import type { StockMention } from '../types';
import { StockChip } from './StockChip';

/**
 * Inline renderer that takes a plain string and a list of known stocks. Whenever a
 * stock symbol appears as a whole word in the text, it's replaced with an inline
 * StockChip showing the ticker, company name, and current price.
 *
 * Use this anywhere you display Result.summary or other short text that may mention
 * tickers, so the "code · name · price" formatting standard is consistent across
 * Desk rows, Result viewer summary blocks, chat bubbles, etc.
 */
export function InlineStocks({ text, stocks, size = 'sm', onAsk, askLabel }: {
  text: string;
  stocks: StockMention[];
  size?: 'sm' | 'md';
  onAsk?: (stock: StockMention) => void;
  askLabel?: string;
}) {
  return <>{splitTextWithStocks(text, stocks, size, onAsk, askLabel)}</>;
}

export function splitTextWithStocks(
  text: string,
  stocks: StockMention[],
  size: 'sm' | 'md' = 'sm',
  onAsk?: (stock: StockMention) => void,
  askLabel?: string,
): React.ReactNode[] {
  if (stocks.length === 0) return [text];
  const bySymbol = new Map<string, StockMention>();
  for (const st of stocks) bySymbol.set(st.symbol.toLowerCase(), st);
  const pattern = new RegExp(
    `(?<![A-Za-z0-9.])(${stocks.map((s) => escapeRegex(s.symbol)).join('|')})(?![A-Za-z0-9])`,
    'g',
  );

  const out: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  pattern.lastIndex = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIdx) out.push(text.slice(lastIdx, match.index));
    const stock = bySymbol.get(match[1].toLowerCase());
    if (stock) {
      out.push(<StockChip key={`${stock.symbol}-${match.index}`} stock={stock} size={size} onAsk={onAsk} askLabel={askLabel} />);
    } else {
      out.push(match[0]);
    }
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) out.push(text.slice(lastIdx));
  return out;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
