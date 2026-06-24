import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { ResultViewerModal } from '../../components/ResultViewerModal';
import { FileText, ChevronRight } from 'lucide-react';
import { useT } from '../../lib/i18n';
import type { Result } from '../../types';

/**
 * Lists every Result this agent has produced, newest first. Tapping a row
 * opens the same modal viewer used elsewhere in the app.
 */
export function ReportsList() {
  const { id = '' } = useParams();
  const { agents, results } = useApp();
  const t = useT();
  const [open, setOpen] = useState<Result | null>(null);

  const agent = useMemo(() => agents.find((a) => a.id === id), [agents, id]);

  const reports = useMemo(
    () => results
      .filter((r) => r.agentId === id)
      .sort((a, b) => +new Date(b.at) - +new Date(a.at)),
    [results, id]
  );

  if (!agent) return null;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-paper w-full max-w-3xl mx-auto">
      {reports.length === 0 ? (
        <p className="px-6 py-16 text-center text-[15px] text-ink-500">
          {t('reports.empty')}
        </p>
      ) : (
        <ul className="pb-3">
          {reports.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => setOpen(r)}
                className="w-full flex items-center gap-3 border-b border-ink-200 px-5 py-4 active:bg-ink-50 text-left overflow-hidden transition-colors"
              >
                <div className="w-10 h-10 rounded-md bg-ink-100 text-ink-900 flex items-center justify-center shrink-0">
                  <FileText size={18} strokeWidth={1.6} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[18px] font-medium text-ink-900 truncate leading-tight">{r.title}</p>
                  <p className="font-mono text-[11px] text-ink-300 mt-0.5">{new Date(r.at).toLocaleString()}</p>
                </div>
                <ChevronRight size={16} className="text-ink-300 shrink-0" strokeWidth={1.6} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <ResultViewerModal result={open} agent={agent} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}
