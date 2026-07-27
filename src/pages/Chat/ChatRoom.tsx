import { useParams } from 'react-router-dom';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { Avatar } from '../../components/Avatar';
import { ResultViewerModal } from '../../components/ResultViewerModal';
import { InlineStocks } from '../../components/InlineStocks';
import { StockChip } from '../../components/StockChip';
import { clockTime } from '../../lib/format';
import { FileText, Send, ChevronRight } from 'lucide-react';
import { createRunResult } from '../../lib/result';
import type { Result } from '../../types';
import { useT } from '../../lib/i18n';
import { StrideRule } from '../../components/StrideRule';

const CANNED = (name: string, prompt: string) => {
  const stripped = prompt.trim();
  if (!stripped) return `${name} here. I'll run on schedule. Ask me about my current focus.`;
  if (/\?$/.test(stripped)) {
    return `Within my task scope: I can speak to the inputs I've been given, the tools I'm allowed to use, and what's in my long-term memory. On ${stripped.replace('?', '')} — my last brief stands; nothing in the last cycle changed that.`;
  }
  return `Acknowledged. I've logged "${stripped}" to long-term memory. It will inform my next run.`;
};

export function ChatRoom() {
  const { id = '' } = useParams();
  const { agents, chats, setChats, setAgents, results, setResults, watchlists } = useApp();
  const t = useT();
  const agent = useMemo(() => agents.find((a) => a.id === id), [agents, id]);
  const [text, setText] = useState('');
  const [openResult, setOpenResult] = useState<Result | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Most-recent result by this agent — surfaced as a summary card at the top
  // of the chat so the latest work is visible at a glance.
  const latestResult = useMemo<Result | null>(() => {
    return results
      .filter((r) => r.agentId === id)
      .sort((a, b) => +new Date(b.at) - +new Date(a.at))[0] ?? null;
  }, [results, id]);

  // Clear unread on enter
  useEffect(() => {
    if (!agent || agent.unread === 0) return;
    setAgents((list) => list.map((a) => (a.id === agent.id ? { ...a, unread: 0 } : a)));
  }, [agent?.id]);

  const messages = useMemo(
    () => chats.filter((m) => m.agentId === id).sort((a, b) => +new Date(a.at) - +new Date(b.at)),
    [chats, id]
  );

  // Split messages around the latest-report timestamp so the in-stream divider
  // can sit ABOVE the welcome bubble (which is itself the agent's first note
  // about the new report). Anything older than the report goes above the
  // divider; the welcome + anything newer go below.
  const { messagesBefore, messagesAfter } = useMemo(() => {
    if (!latestResult) return { messagesBefore: [], messagesAfter: messages };
    const reportTime = +new Date(latestResult.at);
    return {
      messagesBefore: messages.filter((m) => +new Date(m.at) < reportTime),
      messagesAfter:  messages.filter((m) => +new Date(m.at) >= reportTime),
    };
  }, [messages, latestResult]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // AgentLayout already shows a not-found view; ChatRoom just bails quietly.
  if (!agent) return null;

  const sendText = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    const userMsg = { id: `m-${Date.now()}`, agentId: agent.id, role: 'user' as const, text: trimmed, at: now };
    setChats((c) => [...c, userMsg]);
    setText('');
    setTimeout(() => {
      setChats((c) => [
        ...c,
        { id: `m-${Date.now() + 1}`, agentId: agent.id, role: 'agent', text: CANNED(agent.name, trimmed), at: new Date().toISOString() },
      ]);
    }, 650);
  };

  const send = () => sendText(text);

  // Resolve the Result referenced by an attachment. Falls back to the agent's most-
  // recent result, then to an on-the-fly sample if nothing exists yet.
  const resolveResult = (resultId?: string): Result => {
    if (resultId) {
      const r = results.find((x) => x.id === resultId);
      if (r) return r;
    }
    const recent = results
      .filter((r) => r.agentId === agent.id)
      .sort((a, b) => +new Date(b.at) - +new Date(a.at))[0];
    if (recent) return recent;
    // Generate one and persist so future taps reuse it.
    const fresh = createRunResult(agent, watchlists.flatMap((l) => l.stocks));
    setResults((rs) => [fresh, ...rs]);
    return fresh;
  };

  // Renders a single chat message (text bubble + optional attachment card).
  // Used twice — once for messages before the report timestamp and once for
  // messages after — so the divider can sit between them.
  const renderMessage = (m: typeof chats[number]) => {
    const isUser = m.role === 'user';
    const align = isUser ? 'justify-end' : 'justify-start';
    const linked = m.resultId ? results.find((r) => r.id === m.resultId) : undefined;
    return (
      <Fragment key={m.id}>
        {m.text && (
          <div className={`flex mb-1.5 ${align} items-end gap-2`}>
            {!isUser && <Avatar seed={agent.avatarSeed} name={agent.name} size={24} ink />}
            <div className={`max-w-[80%] px-3.5 py-2.5 ${isUser
              ? 'bg-ink-900 text-paper rounded-2xl rounded-br-md'
              : 'bg-card text-ink-900 border border-ink-200 rounded-2xl rounded-bl-md'}`}>
              {/* The columnist writes in the editorial serif (a note from a person);
                  the reader's own messages stay in the clean interface sans. */}
              <p className={`whitespace-pre-wrap ${isUser ? 'text-[15px] leading-snug' : 'font-display text-[16px] leading-[1.45]'}`}>
                {linked ? <InlineStocks text={m.text} stocks={linked.stocks} /> : m.text}
              </p>
              <p className="font-mono text-[11px] mt-1 text-ink-300">{clockTime(m.at)}</p>
            </div>
          </div>
        )}
        {m.attachment && (
          <div className={`flex mb-2 ${align} items-end gap-2`}>
            {!isUser && (m.text
              ? <div className="w-6 h-6 shrink-0" />
              : <Avatar seed={agent.avatarSeed} name={agent.name} size={24} ink />)}
            <button
              onClick={() => setOpenResult(resolveResult(m.attachment!.resultId))}
              className="max-w-[78%] flex items-center gap-2.5 bg-card border border-ink-200 rounded-lg px-3 py-2.5 active:bg-ink-50 text-left transition-colors"
            >
              <div className="w-9 h-9 rounded-md bg-ink-100 text-ink-900 flex items-center justify-center shrink-0">
                <FileText size={16} strokeWidth={1.6} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[16px] font-medium text-ink-900 truncate leading-tight">{m.attachment.name}</p>
                <p className="text-[12px] text-ink-500">{t("result.tapToOpen")}</p>
              </div>
              <ChevronRight size={14} className="text-ink-300 shrink-0" strokeWidth={1.6} />
            </button>
          </div>
        )}
      </Fragment>
    );
  };

  // Thin in-stream divider marking the timestamp of the latest report.
  // Renders just above the welcome bubble so the welcome reads as the first
  // thing the agent said about that new report.
  const renderDivider = (result: Result) => {
    const d = new Date(result.at);
    const dateLabel = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    return (
      <button
        onClick={() => setOpenResult(result)}
        className="w-full flex items-center gap-2 my-3 px-1 group"
        aria-label={`${dateLabel} · ${result.title}`}
      >
        <div className="flex-1 h-px bg-ink-200 group-active:bg-ink-300" />
        <span className="text-[11px] uppercase tracking-label text-ink-500 whitespace-nowrap max-w-[70%] truncate">
          {dateLabel} · {result.title}
        </span>
        <div className="flex-1 h-px bg-ink-200 group-active:bg-ink-300" />
      </button>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-paper">
      {/* Latest report summary — surfaces the most recent brief at the top so
          the chat below stays focused on follow-up Q&A. The card itself is
          tappable; the prominent button at the bottom is the obvious action. */}
      {latestResult ? (
        <div
          onClick={() => setOpenResult(latestResult)}
          className="shrink-0 mx-3 mt-2 mb-2 bg-card border border-ink-200 rounded-lg p-4 active:bg-ink-50 cursor-pointer transition-colors"
        >
          <p className="text-[11px] uppercase tracking-label text-ink-500">{t('chat.result.eyebrow')}</p>
          <h2 className="font-display text-[22px] font-medium text-ink-900 mt-1 leading-tight">{latestResult.title}</h2>
          <p className="font-mono text-[11px] text-ink-300 mt-1">
            {new Date(latestResult.at).toLocaleString()} · {t('meta.by', { name: agent.name })}
          </p>

          <div className="mt-3">
            <p className="text-[11px] uppercase tracking-label text-ink-500 mb-1">{t('chat.result.summary')}</p>
            <p className="text-[14px] text-ink-700 leading-snug">
              <InlineStocks text={latestResult.summary} stocks={latestResult.stocks} />
            </p>
          </div>

          {latestResult.stocks.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] uppercase tracking-label text-ink-500 mb-1">{t('chat.result.stocks')}</p>
              <div className="flex flex-wrap gap-1.5">
                {latestResult.stocks.map((s) => <StockChip key={s.symbol} stock={s} />)}
              </div>
            </div>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); setOpenResult(latestResult); }}
            className="mt-4 w-full px-5 py-3 rounded-sm bg-ink-900 text-paper text-[14px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors duration-200 ease-out-expo"
          >
            <FileText size={15} strokeWidth={1.6} /> {t('chat.result.viewReport')}
          </button>
        </div>
      ) : (
        <div className="shrink-0 mx-3 mt-2 mb-2 bg-card border border-ink-200 rounded-lg px-4 py-3 text-[13px] text-ink-500">
          {t('chat.result.empty')}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 bg-paper w-full max-w-3xl mx-auto">
        {/* Correspondence opener — frames the thread as letters from a columnist. */}
        <div className="flex flex-col items-center gap-1.5 pt-1 pb-4">
          <StrideRule width={26} />
          <p className="kicker text-center">{t('chat.correspondence', { name: agent.name })}</p>
        </div>
        {/* Pre-report messages (carry-overs from a previous run) live above
            the divider; the divider + welcome are the boundary marker. */}
        {messagesBefore.map((m) => renderMessage(m))}
        {latestResult && renderDivider(latestResult)}
        {/* Synthetic welcome — uses the live user name and respects the language
            toggle. The first agent statement about the new report. */}
        <div className="flex mb-1.5 justify-start items-end gap-2">
          <Avatar seed={agent.avatarSeed} name={agent.name} size={24} ink />
          <div className="max-w-[80%] bg-card text-ink-900 border border-ink-200 rounded-2xl rounded-bl-md px-3.5 py-2.5">
            <p className="font-display text-[16px] whitespace-pre-wrap leading-[1.45]">
              {t('chat.welcome')}
            </p>
          </div>
        </div>
        {messagesAfter.map((m) => renderMessage(m))}
        <div ref={bottomRef} />
      </div>
      {/* Scope hint — pinned to the bottom of the chat content area (above
          the input dock), so it stays visible no matter how far the user
          scrolls the messages above. Same bg-ink-50 as the scroll area so it
          visually belongs to the chat content. */}
      <p className="shrink-0 bg-paper px-4 pb-2 text-[11px] text-ink-500 leading-snug text-center">
        {t('chat.scopeHint')}
      </p>
      <div className="shrink-0 px-3 py-2 border-t border-ink-200 bg-paper">
        {/* Preset prompt bubbles above the input — always visible so the user
            has one-tap access to common follow-ups about the report. Tap sends
            the prompt straight through (no edit step) for fewer taps. */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {(['chat.preset.1', 'chat.preset.2', 'chat.preset.3'] as const).map((key) => (
            <button
              key={key}
              onClick={() => sendText(t(key))}
              className="shrink-0 text-[12px] px-3 py-1 rounded-pill bg-transparent text-ink-500 border border-ink-200 hover:border-ink-300 hover:text-ink-700 transition-colors duration-200 ease-out-expo"
            >
              {t(key)}
            </button>
          ))}
        </div>
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
        <ResultViewerModal
          result={openResult}
          agent={agent}
          onClose={() => setOpenResult(null)}
        />
      )}
    </div>
  );
}
