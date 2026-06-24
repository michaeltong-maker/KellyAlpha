import { MessageCircle } from 'lucide-react';
import { useT } from '../../lib/i18n';

/**
 * Desktop right-pane placeholder shown when no agent is selected (route is
 * exactly /chat). Once the user picks an agent the AgentLayout takes over.
 */
export function ChatEmptyState() {
  const t = useT();
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 bg-paper">
      <div className="w-16 h-16 rounded-pill bg-ink-100 flex items-center justify-center mb-4 border border-ink-200">
        <MessageCircle size={28} className="text-ink-900" strokeWidth={1.6} />
      </div>
      <h2 className="font-display text-[22px] font-medium text-ink-900">{t('chat.desktop.empty.title')}</h2>
      <p className="text-[15px] text-ink-500 mt-1 max-w-xs">
        {t('chat.desktop.empty.body')}
      </p>
    </div>
  );
}
