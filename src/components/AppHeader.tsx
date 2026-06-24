import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { BrandMark } from './BrandMark';

interface Props {
  title: string;
  subtitle?: string;
  back?: boolean;
  left?: ReactNode;
  right?: ReactNode;
}

export function AppHeader({ title, subtitle, back, left, right }: Props) {
  const nav = useNavigate();
  return (
    <header className="shrink-0 px-5 pt-[max(env(safe-area-inset-top),14px)] pb-3 bg-paper border-b border-ink-200">
      <div className="w-full max-w-5xl mx-auto">
        {/* Brand eyebrow — persistent mark on mobile top-level screens. Desktop
            has the sidebar brand, so it's hidden there to avoid doubling. Sits
            above the page title as a quiet masthead rather than crammed beside it. */}
        {!back && !left && (
          <div className="lg:hidden mb-2 flex items-center gap-2">
            <BrandMark size={18} />
            <span className="text-[12px] font-semibold uppercase tracking-logo text-ink-700">Alphawalk</span>
          </div>
        )}
        <div className="flex items-center gap-2.5 min-h-10">
          {back ? (
            <button onClick={() => nav(-1)} className="-ml-1.5 p-1 text-ink-500 hover:text-ink-900 transition-colors">
              <ChevronLeft size={22} strokeWidth={1.6} />
            </button>
          ) : null}
          {left}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-[26px] font-medium leading-[1.1] text-ink-900 truncate">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-[11px] uppercase tracking-label text-ink-500 leading-snug line-clamp-2">{subtitle}</p>
            ) : null}
          </div>
          {right}
        </div>
      </div>
    </header>
  );
}
