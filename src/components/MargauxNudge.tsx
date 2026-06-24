import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { MargauxAvatar } from './MargauxAvatar';

// A single quiet line from the front desk, in Margaux's voice. Reused for every
// contextual nudge (first hire, return, report-chat coachmark, Create warning)
// so they all read as the same house concierge. Optionally tappable (Link or
// button) and optionally dismissible (renders an × when onDismiss is given).
export function MargauxNudge({ text, to, onClick, onDismiss, dismissLabel, className = '' }: {
  text: string;
  to?: string;
  onClick?: () => void;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
}) {
  const body = (
    <span className="flex items-start gap-2.5 flex-1 min-w-0">
      <span className="mt-0.5 shrink-0"><MargauxAvatar size={26} /></span>
      <span className="flex-1 min-w-0 text-[13px] text-ink-700 leading-snug">{text}</span>
    </span>
  );
  return (
    <div className={`flex items-start gap-2 rounded-lg border border-accent/25 bg-accent-soft/70 px-3 py-2.5 ${className}`}>
      {to ? (
        <Link to={to} onClick={onClick} className="flex-1 min-w-0">{body}</Link>
      ) : onClick ? (
        <button onClick={onClick} className="flex-1 min-w-0 text-left">{body}</button>
      ) : (
        body
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="shrink-0 p-1 -mr-0.5 text-ink-500 hover:text-ink-900 transition-colors"
        >
          <X size={15} strokeWidth={1.8} />
        </button>
      )}
    </div>
  );
}
