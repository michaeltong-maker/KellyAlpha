import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { StockMention } from '../types';
import { Sparkline } from './Sparkline';

const ccyFor = (m: StockMention['market']) =>
  m === 'US' ? '$' : m === 'HK' ? 'HK$' : '¥';

const POP_W = 208; // w-52

export function StockChip({ stock, size = 'sm', onAsk, askLabel }: {
  stock: StockMention;
  size?: 'sm' | 'md';
  onAsk?: (stock: StockMention) => void;
  askLabel?: string;
}) {
  const ccy = ccyFor(stock.market);
  const up = (stock.changePct ?? 0) >= 0;
  const padding = size === 'md' ? 'px-2 py-0.5' : 'px-1.5 py-px';
  const fontSize = size === 'md' ? 'text-[15px]' : 'text-[13px]';
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top?: number; bottom?: number }>({ left: 0 });
  const wrapRef = useRef<HTMLSpanElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const hasData = stock.price !== undefined;
  // The popover is worth opening if there's a quote to peek OR an ask action.
  const interactive = hasData || !!onAsk;

  const place = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.min(Math.max(8, r.left), window.innerWidth - POP_W - 8);
    // Open upward when the chip sits in the lower half of the viewport, else down.
    if (r.top > window.innerHeight * 0.5) {
      setCoords({ left, bottom: window.innerHeight - r.top + 8 });
    } else {
      setCoords({ left, top: r.bottom + 8 });
    }
  };

  const toggle = () => {
    if (open) { setOpen(false); return; }
    place();
    setOpen(true);
  };

  // Render the popover in a portal so it's never clipped by an ancestor's
  // overflow (Desk rows, scroll containers, etc.).
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!wrapRef.current?.contains(t) && !popRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className="inline-block align-baseline">
      {/* Not a <button> so it can nest inside list-row buttons without invalid markup. */}
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); if (interactive) toggle(); }}
        onKeyDown={(e) => { if (interactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); toggle(); } }}
        className={`inline-flex items-baseline gap-1 align-baseline rounded-md bg-ink-100 border ${open ? 'border-accent/50' : 'border-ink-200'} ${padding} ${fontSize} whitespace-nowrap ${interactive ? 'cursor-pointer hover:border-ink-300 transition-colors' : ''}`}
        title={`${stock.name} · ${stock.symbol}`}
      >
        <span className="font-mono text-ink-500">{stock.symbol}</span>
        <span className="text-ink-500">{stock.name.length > 18 ? stock.name.slice(0, 17) + '…' : stock.name}</span>
        {stock.price !== undefined && (
          <span className="font-mono text-ink-900">{ccy}{stock.price.toFixed(2)}</span>
        )}
        {stock.changePct !== undefined && (
          <span className={`font-mono ${up ? 'text-success' : 'text-danger'}`}>
            {up ? '+' : ''}{stock.changePct.toFixed(2)}%
          </span>
        )}
      </span>

      {open && createPortal(
        <div
          ref={popRef}
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'fixed', left: coords.left, top: coords.top, bottom: coords.bottom, width: POP_W }}
          className="z-[80] rounded-lg border border-ink-200 bg-card shadow-overlay p-3 animate-fade-rise"
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-[13px] text-ink-900">{stock.symbol}</span>
            {hasData && (
              <span className={`font-mono text-[13px] ${up ? 'text-success' : 'text-danger'}`}>
                {up ? '+' : ''}{(stock.changePct ?? 0).toFixed(2)}%
              </span>
            )}
          </div>
          <p className="text-[12px] text-ink-500 truncate mt-0.5">{stock.name}</p>
          {hasData && (
            <>
              <div className="mt-2">
                <Sparkline symbol={stock.symbol} price={stock.price!} changePct={stock.changePct ?? 0} />
              </div>
              <div className="flex items-baseline justify-between gap-2 mt-1.5">
                <span className="font-mono text-[17px] text-ink-900">{ccy}{stock.price!.toFixed(2)}</span>
                <span className="text-[10px] uppercase tracking-label text-ink-300">Intraday</span>
              </div>
            </>
          )}
          {onAsk && askLabel && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onAsk(stock); }}
              className="btn-accent w-full mt-2.5 py-2 text-[13px] font-medium"
            >
              {askLabel}
            </button>
          )}
        </div>,
        document.body,
      )}
    </span>
  );
}
