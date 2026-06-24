import { useEffect, useState } from 'react';
import { X, Copy, Mail, MessageCircle, Send, AtSign, Hash, Link as LinkIcon, Check } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  url?: string;          // optional canonical link to copy / share
  onClose: () => void;
}

/**
 * A simple iOS-style share sheet rendered as a bottom modal. Listed targets are
 * stubs for this build — copy actions write to the clipboard; others briefly flash
 * "Coming soon" so the affordance feels alive without committing to real
 * integrations yet.
 */
export function ShareSheet({ title, subtitle, url, onClose }: Props) {
  const fallbackUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');
  const [flash, setFlash] = useState<string | null>(null);

  // Push a sentinel history entry so the system back gesture closes the sheet first.
  useEffect(() => {
    const SENTINEL = 'alphawalk-share';
    const already = (window.history.state as { alphawalkModal?: string } | null)?.alphawalkModal === SENTINEL;
    if (!already) window.history.pushState({ alphawalkModal: SENTINEL }, '');
    let backed = false;
    const onPop = () => { backed = true; onClose(); };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!backed) {
        const state = window.history.state as { alphawalkModal?: string } | null;
        if (state?.alphawalkModal === SENTINEL) window.history.back();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flashFor = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 1400);
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(fallbackUrl); flashFor('Link copied'); }
    catch { flashFor('Copy unavailable'); }
  };
  const copyTitle = async () => {
    try { await navigator.clipboard.writeText(`${title}${subtitle ? ` — ${subtitle}` : ''}\n${fallbackUrl}`); flashFor('Copied to clipboard'); }
    catch { flashFor('Copy unavailable'); }
  };

  const targets = [
    { id: 'copy-link',  label: 'Copy link',      Icon: LinkIcon,       onClick: copyLink },
    { id: 'copy',       label: 'Copy summary',   Icon: Copy,           onClick: copyTitle },
    { id: 'messages',   label: 'Messages',       Icon: MessageCircle,  onClick: () => flashFor('Messages — coming soon') },
    { id: 'mail',       label: 'Mail',           Icon: Mail,           onClick: () => flashFor('Mail — coming soon') },
    { id: 'telegram',   label: 'Telegram',       Icon: Send,           onClick: () => flashFor('Telegram — coming soon') },
    { id: 'twitter',    label: 'X / Twitter',    Icon: AtSign,         onClick: () => flashFor('X — coming soon') },
    { id: 'slack',      label: 'Slack',          Icon: Hash,           onClick: () => flashFor('Slack — coming soon') },
  ];

  return (
    <div className="absolute inset-0 z-40 bg-ink-900/40 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-card rounded-t-lg shadow-sheet pb-[max(env(safe-area-inset-bottom),12px)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <span className="w-10 h-1 rounded-pill bg-ink-200" />
        </div>

        {/* Header */}
        <header className="px-5 pb-4 pt-1 flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-label text-ink-500">Share</p>
            <p className="font-display text-[20px] font-medium text-ink-900 leading-tight truncate mt-0.5">{title}</p>
            {subtitle && <p className="text-[13px] text-ink-500 truncate mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1 text-ink-500 hover:text-ink-900 transition-colors" aria-label="close">
            <X size={18} strokeWidth={1.6} />
          </button>
        </header>

        {/* Targets */}
        <div className="px-3 pb-3 grid grid-cols-4 gap-1">
          {targets.map(({ id, label, Icon, onClick }) => (
            <button
              key={id}
              onClick={onClick}
              className="flex flex-col items-center gap-1.5 py-2.5 rounded-md active:bg-ink-50 transition-colors duration-200"
            >
              <span className="w-12 h-12 rounded-pill border border-ink-200 bg-paper text-ink-900 flex items-center justify-center">
                <Icon size={20} strokeWidth={1.6} />
              </span>
              <span className="text-[12px] text-ink-500 leading-tight text-center">{label}</span>
            </button>
          ))}
        </div>

        {/* Flash toast */}
        {flash && (
          <div className="px-5 pb-3">
            <div className="rounded-md bg-ink-100 border border-ink-200 px-3 py-2 text-[14px] text-ink-700 font-medium inline-flex items-center gap-1.5">
              <Check size={14} strokeWidth={1.8}/> {flash}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
