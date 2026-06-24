import { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useT } from '../lib/i18n';

/**
 * Reusable two-step destructive confirmation. The first tap arms a final,
 * explicit confirm so nothing destructive happens on a single accidental tap.
 * Copy is passed in (already localized); on-brand monochrome (red is reserved
 * for market data). Renders as a bottom sheet over its positioned parent.
 */
export function ConfirmDeleteSheet({
  title, body, sureTitle, sureBody, confirmLabel, confirmFinalLabel, onCancel, onConfirm,
}: {
  title: string;
  body: string;
  sureTitle: string;
  sureBody: string;
  confirmLabel: string;
  confirmFinalLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useT();
  const [armed, setArmed] = useState(false);
  return (
    <div className="absolute inset-0 z-30 bg-ink-900/50 flex items-end" onClick={onCancel}>
      <div
        className="w-full bg-card rounded-t-lg shadow-sheet pb-[max(env(safe-area-inset-bottom),16px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2 pb-1">
          <span className="w-10 h-1 rounded-pill bg-ink-200" />
        </div>
        <div className="px-4 pt-1 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-pill flex items-center justify-center shrink-0 bg-ink-100 text-ink-900">
              <AlertTriangle size={20} strokeWidth={1.6} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-[22px] font-medium text-ink-900">{armed ? sureTitle : title}</h3>
              <p className="text-[15px] text-ink-500 mt-1 leading-snug">{armed ? sureBody : body}</p>
            </div>
            <button onClick={onCancel} className="text-ink-500 hover:text-ink-900 transition-colors" aria-label={t('common.close')}><X size={18} /></button>
          </div>

          <div className="flex items-center gap-1.5 mt-3 ml-[52px]">
            <span className={`h-1.5 w-1.5 rounded-full ${!armed ? 'bg-ink-900' : 'bg-ink-300'}`} />
            <span className={`h-1.5 w-1.5 rounded-full ${armed ? 'bg-ink-900' : 'bg-ink-200'}`} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={onCancel}
              className="px-5 py-3 rounded-lg bg-transparent border border-ink-200 text-ink-700 font-medium text-[14px] hover:border-ink-300 transition-colors duration-200 ease-out-expo"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={() => (armed ? onConfirm() : setArmed(true))}
              className="px-5 py-3 rounded-lg bg-ink-900 text-paper font-medium text-[14px] inline-flex items-center justify-center gap-1.5 transition-colors duration-200 ease-out-expo active:bg-ink-700"
            >
              <Trash2 size={14} strokeWidth={1.6} /> {armed ? confirmFinalLabel : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
