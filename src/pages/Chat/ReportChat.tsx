import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { Avatar } from '../../components/Avatar';
import { ResultViewerModal } from '../../components/ResultViewerModal';
import { InlineStocks } from '../../components/InlineStocks';
import { StockChip } from '../../components/StockChip';
import { StrideRule } from '../../components/StrideRule';
import { MargauxNudge } from '../../components/MargauxNudge';
import { clockTime } from '../../lib/format';
import { FileText, Send, Plus, X, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { useT, type MessageKey } from '../../lib/i18n';
import type { Result } from '../../types';

type Scope = 'latest' | 'all' | 'selected';

const SCOPE_KEY: Record<Scope, MessageKey> = {
  latest: 'reportChat.scope.latest',
  all: 'reportChat.scope.all',
  selected: 'reportChat.scope.selected',
};

/**
 * Sub-page that lets the user pick the conversational scope (latest /
 * all / selected reports), see a compact summary of the latest report,
 * and chat about it. Shares the chats store with the Report Inquiry tab
 * so messages persist across both views for the same agent.
 */
export function ReportChat() {
  const { id = '' } = useParams();
  const { agents, results, chats, setChats, persisted, updatePersisted } = useApp();
  const t = useT();
  const [scope, setScope] = useState<Scope>('latest');
  const [text, setText] = useState('');
  const [openResult, setOpenResult] = useState<Result | null>(null);
  // IDs of reports picked when scope === 'selected'. Persists across scope
  // toggles so the user doesn't lose their picks if they bounce between modes.
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Collapsible report summary so mobile readers can reclaim the whole screen
  // for the conversation. Default open: a freshly-opened report is at the top
  // of the thread, where the reader wants the full summary for context.
  const [summaryOpen, setSummaryOpen] = useState(true);
  // Once the reader taps the chevron we stop steering the card automatically
  // and honour their explicit choice for the rest of the session.
  const summaryLocked = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Prefill the composer when arriving with an ?ask= query (from a ticker
  // popover's "Ask the analyst"). The user can edit before sending.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const ask = searchParams.get('ask');
    if (ask) {
      setText(ask);
      const next = new URLSearchParams(searchParams);
      next.delete('ask');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const agent = useMemo(() => agents.find((a) => a.id === id), [agents, id]);
  const agentReports = useMemo<Result[]>(() => {
    return results
      .filter((r) => r.agentId === id)
      .sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [results, id]);
  const latestReport = agentReports[0] ?? null;
  const selectedReports = useMemo(
    () => agentReports.filter((r) => selectedIds.includes(r.id)),
    [agentReports, selectedIds]
  );

  const messages = useMemo(
    () => chats.filter((m) => m.agentId === id).sort((a, b) => +new Date(a.at) - +new Date(b.at)),
    [chats, id]
  );

  // Split messages around the latest-report timestamp so the in-stream divider
  // sits ABOVE the welcome bubble. Same pattern as the Report Inquiry tab.
  const { messagesBefore, messagesAfter } = useMemo(() => {
    if (!latestReport) return { messagesBefore: [], messagesAfter: messages };
    const reportTime = +new Date(latestReport.at);
    return {
      messagesBefore: messages.filter((m) => +new Date(m.at) < reportTime),
      messagesAfter:  messages.filter((m) => +new Date(m.at) >= reportTime),
    };
  }, [messages, latestReport]);
  const messageCount = messages.length;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageCount]);

  // Smart expand/shrink: the summary tracks the reader's position in the
  // thread. At the top (just opened the report, or scrolled up for context)
  // it stays open; once they move down into the conversation — including the
  // auto-scroll that fires after they send a message — it shrinks to a slim
  // title bar so the chat owns the screen. A manual toggle disables this.
  //
  // HYSTERESIS: collapsing/expanding changes the card's height, which nudges
  // scrollTop. With a single threshold that nudge re-crosses the line and the
  // card flickers (the "shaking" while scrolling or after sending). Two
  // separated thresholds with a dead zone between them break that loop: we
  // only collapse once well past the top, and only re-open right at the top.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (summaryLocked.current) return;
      const y = el.scrollTop;
      setSummaryOpen((open) => {
        if (open && y > 72) return false;  // scrolled down into the thread
        if (!open && y < 8) return true;   // back at the very top
        return open;                        // dead zone — leave it alone
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  if (!agent) return null;

  const sendText = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    setChats((c) => [
      ...c,
      { id: `m-${Date.now()}`, agentId: agent.id, role: 'user' as const, text: trimmed, at: now },
    ]);
    setText('');
    setTimeout(() => {
      setChats((c) => [
        ...c,
        {
          id: `m-${Date.now() + 1}`,
          agentId: agent.id,
          role: 'agent',
          text: `Within ${t(SCOPE_KEY[scope]).toLowerCase()} — noted. I'll keep that scope in mind for follow-ups.`,
          at: new Date().toISOString(),
        },
      ]);
    }, 650);
  };

  const send = () => sendText(text);

  // Index (inside messagesAfter) of the most recent agent message. -1 means
  // the welcome bubble is itself the latest agent statement (so the preset
  // bubbles anchor under the welcome instead).
  const lastAgentIdx = useMemo(() => {
    for (let i = messagesAfter.length - 1; i >= 0; i--) {
      if (messagesAfter[i].role === 'agent') return i;
    }
    return -1;
  }, [messagesAfter]);
  // Hide presets while the user is mid-turn (last message in the thread is
  // from them — agent hasn't replied yet).
  const lastMsgIsUser = messagesAfter.length > 0
    && messagesAfter[messagesAfter.length - 1].role === 'user';
  const presetActive = !lastMsgIsUser;

  // Inline 3-pill "next conversation tip" strip. Rendered directly under the
  // most recent agent message (or the welcome bubble, when the thread is
  // otherwise empty) so the user has one-tap follow-ups in context.
  const presetBubbles = (
    <div className="flex flex-wrap gap-1.5 mb-2 pl-8">
      {(['chat.preset.1', 'chat.preset.2', 'chat.preset.3'] as const).map((key) => (
        <button
          key={key}
          onClick={() => sendText(t(key))}
          className="text-[12px] px-3 py-1 rounded-pill bg-transparent text-ink-500 border border-ink-200 hover:border-ink-300 hover:text-ink-700 transition-colors duration-200 ease-out-expo"
        >
          {t(key)}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-paper">
      {/* Latest report — compact variant for the Report Chat tab. No eyebrow
          label; the "View" pill sits in the top-right of the card; the inner
          summary box is clamped to two lines so the card stays slim. */}
      {latestReport ? (
        <div
          onClick={() => setOpenResult(latestReport)}
          className={`shrink-0 mx-3 mt-2 mb-2 bg-card border border-ink-200 rounded-lg px-4 active:bg-ink-50 cursor-pointer transition-colors ${summaryOpen ? 'py-4 max-h-[42vh] overflow-y-auto' : 'py-2.5'}`}
        >
          <div className={`flex justify-between gap-2 ${summaryOpen ? 'items-start' : 'items-center'}`}>
            <div className="min-w-0 flex-1">
              <h2
                className={`font-display font-medium text-ink-900 leading-tight ${
                  summaryOpen ? 'text-[20px]' : 'text-[15px] truncate'
                }`}
                title={summaryOpen ? undefined : latestReport.title}
              >
                {latestReport.title}
              </h2>
              {summaryOpen && (
                <p className="font-mono text-[11px] text-ink-300 mt-0.5">
                  {new Date(latestReport.at).toLocaleString()} · {t('meta.by', { name: agent.name })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setOpenResult(latestReport); }}
                aria-label={t('reportChat.summary.view')}
                title={t('reportChat.summary.view')}
                className="p-1.5 rounded-sm text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors"
              >
                <FileText size={18} strokeWidth={1.8}/>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); summaryLocked.current = true; setSummaryOpen((v) => !v); }}
                aria-label={summaryOpen ? t('reportChat.summary.hide') : t('reportChat.summary.show')}
                aria-expanded={summaryOpen}
                className="p-1.5 rounded-sm text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors"
              >
                {summaryOpen ? <ChevronUp size={18} strokeWidth={1.8} /> : <ChevronDown size={18} strokeWidth={1.8} />}
              </button>
            </div>
          </div>

          {summaryOpen && (
            <>
              <div className="mt-3">
                <p className="text-[13px] text-ink-700 leading-snug line-clamp-2">
                  <InlineStocks text={latestReport.summary} stocks={latestReport.stocks} />
                </p>
              </div>

              {latestReport.stocks.length > 0 && (
                <>
                  {/* Count micro-label only when the roster is long enough that
                      the strip is likely to overflow — it sets expectations and
                      signals the row is swipeable. */}
                  {latestReport.stocks.length > 5 && (
                    <p className="mt-3 mb-1 text-[10px] uppercase tracking-label text-ink-500">
                      {t('reportChat.summary.tickers', { n: latestReport.stocks.length })}
                    </p>
                  )}
                  {/* Single-row, horizontally-scrollable strip. Ticker count no
                      longer drives card height — a roster of 3 or 30 occupies the
                      same one line; you swipe to reach the rest. Tapping the card
                      opens the full dossier, where the complete list lives. */}
                  <div
                    className={`flex gap-1.5 overflow-x-auto no-scrollbar ${latestReport.stocks.length > 5 ? '' : 'mt-3'}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {latestReport.stocks.map((s) => (
                      <span key={s.symbol} className="shrink-0">
                        <StockChip stock={s} />
                      </span>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="shrink-0 mx-3 mt-2 mb-2 bg-card border border-ink-200 rounded-lg px-4 py-3 text-[13px] text-ink-500">
          {t('chat.result.empty')}
        </div>
      )}

      {/* First-ever report chat: a one-time coachmark from the front desk that
          hands authority to the columnist ("this is its beat, not mine"). */}
      {!persisted.margaux.hidden && !persisted.margaux.dismissedNudges.includes('reportChat') && (
        <MargauxNudge
          text={t('margaux.nudge.reportChat')}
          onDismiss={() => updatePersisted({ margaux: { ...persisted.margaux, dismissedNudges: [...persisted.margaux.dismissedNudges, 'reportChat'] } })}
          dismissLabel={t('margaux.nudge.dismiss')}
          className="shrink-0 mx-3 mb-2"
        />
      )}

      {/* Box 3 — chat thread, framed as correspondence with your columnist */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-3 bg-paper w-full max-w-3xl mx-auto">
        <div className="flex flex-col items-center gap-1.5 pt-1 pb-4">
          <StrideRule width={26} />
          <p className="kicker text-center">{t('chat.correspondence', { name: agent.name })}</p>
        </div>
        {/* Pre-report messages (carry-overs) live above the divider. */}
        {messagesBefore.map((m) => {
          const isUser = m.role === 'user';
          const align = isUser ? 'justify-end' : 'justify-start';
          return (
            <Fragment key={m.id}>
              {m.text && (
                <div className={`flex mb-1 ${align} items-end gap-2`}>
                  {!isUser && <Avatar seed={agent.avatarSeed} name={agent.name} size={24} ink />}
                  <div className={`max-w-[80%] px-3.5 py-2.5 ${isUser ? 'bg-ink-900 text-paper rounded-2xl rounded-br-md' : 'bg-card text-ink-900 border border-ink-200 rounded-2xl rounded-bl-md'}`}>
                    <p className={`whitespace-pre-wrap ${isUser ? 'text-[15px] leading-snug' : 'font-display text-[16px] leading-[1.45]'}`}>{m.text}</p>
                    <p className="font-mono text-[11px] mt-1 text-ink-300">{clockTime(m.at)}</p>
                  </div>
                </div>
              )}
            </Fragment>
          );
        })}
        {/* Thin divider marking the timestamp of the latest report — sits
            above the welcome so the welcome reads as the first agent note
            about that new report. */}
        {latestReport && (() => {
          const d = new Date(latestReport.at);
          const dateLabel = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
          return (
            <button
              onClick={() => setOpenResult(latestReport)}
              className="w-full flex items-center gap-2 my-3 px-1 group"
              aria-label={`${dateLabel} · ${latestReport.title}`}
            >
              <div className="flex-1 h-px bg-ink-200 group-active:bg-ink-300" />
              <span className="text-[11px] uppercase tracking-label text-ink-500 whitespace-nowrap max-w-[70%] truncate">
                {dateLabel} · {latestReport.title}
              </span>
              <div className="flex-1 h-px bg-ink-200 group-active:bg-ink-300" />
            </button>
          );
        })()}
        {/* Welcome bubble. */}
        <div className="flex mb-1.5 justify-start items-end gap-2">
          <Avatar seed={agent.avatarSeed} name={agent.name} size={24} ink />
          <div className="max-w-[80%] bg-card text-ink-900 border border-ink-200 rounded-2xl rounded-bl-md px-3.5 py-2.5">
            <p className="font-display text-[16px] whitespace-pre-wrap leading-[1.45]">
              {t('chat.welcome')}
            </p>
          </div>
        </div>
        {/* If the welcome is the latest agent statement (no agent message in
            messagesAfter), anchor the preset bubbles to it. */}
        {presetActive && lastAgentIdx === -1 && presetBubbles}
        {messagesAfter.map((m, idx) => {
          const isUser = m.role === 'user';
          const align = isUser ? 'justify-end' : 'justify-start';
          const showPresetsHere = presetActive && idx === lastAgentIdx;
          return (
            <Fragment key={m.id}>
              {m.text && (
                <div className={`flex mb-1 ${align} items-end gap-2`}>
                  {!isUser && <Avatar seed={agent.avatarSeed} name={agent.name} size={24} ink />}
                  <div className={`max-w-[80%] px-3.5 py-2.5 ${isUser ? 'bg-ink-900 text-paper rounded-2xl rounded-br-md' : 'bg-card text-ink-900 border border-ink-200 rounded-2xl rounded-bl-md'}`}>
                    <p className={`whitespace-pre-wrap ${isUser ? 'text-[15px] leading-snug' : 'font-display text-[16px] leading-[1.45]'}`}>{m.text}</p>
                    <p className="font-mono text-[11px] mt-1 text-ink-300">{clockTime(m.at)}</p>
                  </div>
                </div>
              )}
              {showPresetsHere && presetBubbles}
            </Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Scope hint pinned to the bottom of the chat content area */}
      <p className="shrink-0 bg-paper px-4 pb-2 text-[11px] text-ink-500 leading-snug text-center">
        {t('chat.scopeHint')}
      </p>

      {/* Input dock — scope picker sits right above the message input so the
          user sets the conversational scope at the same moment they're about
          to type. "Chat about" label + three pill buttons + (when Selected
          Reports is active) an inline chip strip listing the picks. */}
      <div className="shrink-0 px-3 py-2 border-t border-ink-200 bg-paper">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[11px] uppercase tracking-label text-ink-500 shrink-0">
            {t('reportChat.scope.label')}
          </span>
          {(['latest', 'all', 'selected'] as const).map((opt) => {
            const active = scope === opt;
            const labelKey: MessageKey =
              opt === 'latest' ? 'reportChat.scope.latest'
              : opt === 'all' ? 'reportChat.scope.all'
              : 'reportChat.scope.selected';
            return (
              <button
                key={opt}
                onClick={() => setScope(opt)}
                className={`shrink-0 text-[12px] px-3 py-1 rounded-pill border transition-colors duration-200 ease-out-expo ${
                  active
                    ? 'chip-active'
                    : 'bg-transparent text-ink-500 border-ink-200 hover:border-ink-300 hover:text-ink-700'
                }`}
              >
                {t(labelKey)}
              </button>
            );
          })}
        </div>

        {/* Inline strip of picked report chips. Only rendered when the user
            has chosen "Selected Reports" as the scope. Each chip removes
            itself on tap; the "+ Add reports" button opens the full picker. */}
        {scope === 'selected' && (
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setPickerOpen(true)}
              className="shrink-0 inline-flex items-center gap-1 text-[12px] text-ink-500 bg-transparent border border-dashed border-ink-300 px-2.5 py-1 rounded-pill hover:text-ink-700 hover:border-ink-300 active:bg-ink-50 transition-colors duration-200 ease-out-expo"
            >
              <Plus size={12} strokeWidth={1.6}/> {t('reportChat.select.addReports')}
              {selectedReports.length > 0 && (
                <span className="text-ink-300">
                  · {t(selectedReports.length === 1 ? 'reportChat.select.count.one' : 'reportChat.select.count.many', { n: selectedReports.length })}
                </span>
              )}
            </button>
            {selectedReports.map((r) => (
              <span
                key={r.id}
                className="shrink-0 inline-flex items-center gap-1 text-[12px] text-ink-900 bg-ink-100 border border-ink-200 pl-2.5 pr-1 py-1 rounded-pill max-w-[180px]"
              >
                <span className="truncate">{r.title}</span>
                <button
                  onClick={() => setSelectedIds((ids) => ids.filter((x) => x !== r.id))}
                  aria-label="remove"
                  className="p-0.5 text-ink-500 hover:text-ink-900 transition-colors"
                >
                  <X size={11}/>
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={t('chat.message.placeholder')}
            rows={1}
            className="flex-1 resize-none bg-card rounded-md px-3.5 py-2.5 text-[15px] outline-none border border-ink-200 focus:border-ink-900 max-h-28 transition-colors duration-200"
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            className="shrink-0 w-10 h-10 btn-accent disabled:bg-ink-200 disabled:text-ink-300 flex items-center justify-center duration-200 ease-out-expo"
            aria-label="Send"
          >
            <Send size={16} strokeWidth={1.6} />
          </button>
        </div>
      </div>

      {openResult && (
        <ResultViewerModal result={openResult} agent={agent} onClose={() => setOpenResult(null)} />
      )}

      {pickerOpen && (
        <PickReportsSheet
          reports={agentReports}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * Bottom-sheet checklist for picking reports. Mirrors the pattern used by
 * LanguageSheet / ThemeSheet / FeedbackSheet in the Profile page — slides
 * up from the bottom, dim backdrop dismisses, checkmark on the right shows
 * what's currently picked.
 */
function PickReportsSheet({ reports, selectedIds, onChange, onClose }: {
  reports: Result[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}) {
  const t = useT();
  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]
    );
  };
  return (
    <div className="absolute inset-0 z-30 bg-ink-900/40 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-card rounded-t-lg shadow-sheet pb-[max(env(safe-area-inset-bottom),12px)] max-h-[80%] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2 pb-1">
          <span className="w-10 h-1 rounded-pill bg-ink-200" />
        </div>
        <header className="px-4 pb-2 flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-[22px] font-medium text-ink-900">{t('reportChat.select.modalTitle')}</h3>
            <p className="text-[13px] text-ink-500">{t('reportChat.select.modalHint')}</p>
          </div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900 transition-colors" aria-label="close"><X size={18}/></button>
        </header>
        <ul className="px-2 pb-2 overflow-y-auto">
          {reports.length === 0 ? (
            <li className="px-3 py-6 text-center text-[14px] text-ink-500">
              {t('reportChat.select.empty')}
            </li>
          ) : (
            reports.map((r) => {
              const checked = selectedIds.includes(r.id);
              return (
                <li key={r.id}>
                  <button
                    onClick={() => toggle(r.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-md active:bg-ink-50 transition-colors ${checked ? 'bg-ink-100' : ''}`}
                  >
                    <span className={`shrink-0 w-5 h-5 rounded-sm border flex items-center justify-center transition-colors ${
                      checked ? 'chip-active' : 'border-ink-300 bg-card'
                    }`}>
                      {checked && <Check size={13} strokeWidth={3}/>}
                    </span>
                    <span className="flex-1 min-w-0 text-left">
                      <span className="block font-display text-[16px] font-medium text-ink-900 truncate leading-tight">{r.title}</span>
                      <span className="block font-mono text-[11px] text-ink-300 mt-0.5">{new Date(r.at).toLocaleString()}</span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <div className="px-4 pt-2">
          <button
            onClick={onClose}
            className="w-full px-5 py-3 rounded-sm bg-ink-900 text-paper font-medium text-[14px] transition-colors duration-200 ease-out-expo"
          >
            {t('reportChat.select.done')}
          </button>
        </div>
      </div>
    </div>
  );
}
