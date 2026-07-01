import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { AppHeader } from '../../components/AppHeader';
import { Avatar } from '../../components/Avatar';
import { Tag } from '../../components/Tag';
import { Star, Users, BookOpen, Lightbulb, CopyPlus, Check, Share, ChevronDown, PenLine, X } from 'lucide-react';
import { SampleOutput } from '../../components/SampleOutput';
import { ShareSheet } from '../../components/ShareSheet';
import { createRunResult } from '../../lib/result';
import { useT } from '../../lib/i18n';

function StarRow({ value, size = 12 }: { value: number; size?: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="inline-flex items-center gap-0.5 text-ink-900">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={size} fill={i < full || (i === full && half) ? 'currentColor' : 'none'} />
      ))}
    </div>
  );
}

export function MarketplaceAgent() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const t = useT();
  const { agents, setAgents, setChats, setResults, watchlists, persisted, updatePersisted } = useApp();
  const agent = useMemo(() => agents.find((a) => a.id === id), [agents, id]);

  // Hiring is one-time per analyst: the user either has it on their desk or
  // not. hiredCopyId is the id of their copy (used to open or remove it).
  const hiredCopyId = persisted.hiredCopies?.[id];
  const hired = !!hiredCopyId;

  const [shareOpen, setShareOpen] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [writeReviewOpen, setWriteReviewOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (!agent) return <div className="p-4 text-ink-500">{t('agent.notFound')}</div>;

  const REVIEW_LIMIT = 2;
  const visibleReviews = showAllReviews ? agent.reviews : agent.reviews.slice(0, REVIEW_LIMIT);
  const hasMore = agent.reviews.length > REVIEW_LIMIT;

  const submitReview = (stars: number, comment: string) => {
    const trimmed = comment.trim();
    if (!trimmed || stars < 1) return;
    const newReview = {
      user: 'you',
      stars,
      comment: trimmed,
      at: new Date().toISOString(),
    };
    setAgents((list) => list.map((a) => {
      if (a.id !== agent.id) return a;
      const reviews = [newReview, ...a.reviews];
      // Roll the agent's average rating to include the new score.
      const avg = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
      return { ...a, reviews, rating: +avg.toFixed(2) };
    }));
    setWriteReviewOpen(false);
    setShowAllReviews(true);
  };

  // Hire is one-time: add the analyst to the user's desk and take them straight
  // to its chat (the first report / aha), no confetti. Re-opening just navigates.
  const hire = () => {
    if (hired) { nav(`/chat/${hiredCopyId}`); return; }
    const newId = `user-${Date.now()}`;
    const copy = {
      ...agent,
      id: newId,
      name: agent.name,
      creator: 'You',
      isPublic: false,
      duplicates: 0,
      reviews: [],
      memory: [`Hired from the AlphaWalk marketplace — originally by ${agent.creator}.`],
      unread: 0,
      tokensTotal: 0,
      tokensPerTask: agent.tokensPerTask,
      editorsChoice: false,
    };
    setAgents((list) => [copy, ...list.map((a) => a.id === agent.id ? { ...a, duplicates: a.duplicates + 1 } : a)]);
    // File a first report straight away so the chat lands on a real dossier
    // (the aha) rather than an empty welcome.
    const firstReport = createRunResult(copy, watchlists.flatMap((l) => l.stocks));
    setResults((rs) => [firstReport, ...rs]);
    setChats((c) => [
      ...c,
      {
        id: `m-welcome-${newId}`,
        agentId: newId,
        role: 'agent',
        text: `Hi — I'm ${agent.name}${agent.title ? `, ${agent.title}` : ''}. I'll run on your schedule and deliver results in here. Tap my avatar above the messages to tune the task.`,
        at: new Date().toISOString(),
      },
    ]);
    updatePersisted({
      hasOnboarded: true,
      userCreatedAgentIds: [...persisted.userCreatedAgentIds, newId],
      duplicatedAgentIds: [...persisted.duplicatedAgentIds, agent.id],
      hiredCopies: { ...(persisted.hiredCopies ?? {}), [agent.id]: newId },
      hasNewHires: true,
    });
    nav(`/chat/${newId}`);
  };

  // Undo a hire: remove the copy, its chats and reports, and the mapping.
  const unhire = () => {
    if (!hiredCopyId) return;
    setAgents((list) => list.filter((a) => a.id !== hiredCopyId)
      .map((a) => a.id === agent.id ? { ...a, duplicates: Math.max(0, a.duplicates - 1) } : a));
    setChats((c) => c.filter((m) => m.agentId !== hiredCopyId));
    setResults((rs) => rs.filter((r) => r.agentId !== hiredCopyId));
    const nextCopies = { ...(persisted.hiredCopies ?? {}) };
    delete nextCopies[agent.id];
    const di = persisted.duplicatedAgentIds.indexOf(agent.id);
    const nextDup = di === -1 ? persisted.duplicatedAgentIds : [
      ...persisted.duplicatedAgentIds.slice(0, di), ...persisted.duplicatedAgentIds.slice(di + 1),
    ];
    updatePersisted({
      userCreatedAgentIds: persisted.userCreatedAgentIds.filter((x) => x !== hiredCopyId),
      duplicatedAgentIds: nextDup,
      hiredCopies: nextCopies,
    });
    setConfirmRemove(false);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-paper">
      <AppHeader
        back
        title="Agent"
        subtitle="Marketplace"
        right={
          <button
            onClick={() => setShareOpen(true)}
            aria-label={t('common.share')}
            className="shrink-0 p-1 text-ink-500 hover:text-ink-900 transition-colors"
          >
            <Share size={20} />
          </button>
        }
      />
      <div className="flex-1 min-h-0 overflow-y-auto pb-28 w-full max-w-3xl mx-auto">
        {/* Hero */}
        <section className="px-4 py-5 flex items-center gap-3 border-b border-ink-200">
          <Avatar seed={agent.avatarSeed} name={agent.name} size={72} ring ink />
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-[24px] font-medium text-ink-900 leading-tight">{agent.name}</h2>
            {agent.title && (
              <p className="text-[11px] uppercase tracking-label text-ink-500 leading-tight mt-1">{agent.title}</p>
            )}
            <p className="text-[15px] text-ink-500 mt-0.5 truncate">{t('agent.byCreator', { name: agent.creator })}</p>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5">
              <div className="flex items-center gap-1 shrink-0">
                <StarRow value={agent.rating}/>
                <span className="font-mono text-[13px] text-ink-500 whitespace-nowrap">{agent.rating.toFixed(1)} ({agent.reviews.length})</span>
              </div>
              <div className="flex items-center gap-1 text-ink-500 text-[13px] shrink-0 whitespace-nowrap">
                <Users size={11}/> <span className="font-mono">{t('agent.hired', { n: agent.duplicates.toLocaleString() })}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {agent.tags.map((t) => <Tag key={t}>{t}</Tag>)}
            </div>
          </div>
        </section>

        {/* What it does */}
        <section className="px-4 py-4 border-b border-ink-200">
          <div className="flex items-center gap-1.5 mb-2">
            <BookOpen size={13} className="text-ink-500"/>
            <h3 className="text-[11px] uppercase tracking-label text-ink-500">{t('agent.section.whatItDoes')}</h3>
          </div>
          <p className="text-[15px] text-ink-700 leading-relaxed">{agent.fullDescription}</p>
        </section>

        {/* How to use */}
        <section className="px-4 py-4 border-b border-ink-200">
          <h3 className="text-[11px] uppercase tracking-label text-ink-500 mb-2">{t('agent.section.howToUse')}</h3>
          <p className="text-[15px] text-ink-700 leading-relaxed">{agent.howToUse}</p>
        </section>

        {/* Tips */}
        <section className="px-4 py-4 border-b border-ink-200">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb size={13} className="text-ink-500"/>
            <h3 className="text-[11px] uppercase tracking-label text-ink-500">{t('agent.section.tips')}</h3>
          </div>
          <p className="text-[15px] text-ink-700 leading-relaxed">{agent.tips}</p>
        </section>

        {/* Sample output */}
        <SampleOutput agent={agent} />

        {/* Reviews */}
        <section className="px-4 py-4 border-b border-ink-200">
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-[11px] uppercase tracking-label text-ink-500">{t('agent.section.reviews')}</h3>
            <span className="font-mono text-[13px] text-ink-500">{t('agent.reviews.total', { n: agent.reviews.length })}</span>
          </div>
          {agent.reviews.length === 0 ? (
            <p className="text-[15px] text-ink-500">{t('agent.reviews.empty')}</p>
          ) : (
            <ul className="space-y-2">
              {visibleReviews.map((r, i) => (
                <li key={i} className="rounded-lg border border-ink-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-medium text-ink-900">@{r.user}</p>
                    <StarRow value={r.stars}/>
                  </div>
                  <p className="text-[15px] text-ink-700 mt-1">{r.comment}</p>
                </li>
              ))}
            </ul>
          )}

          {/* "More" button — visible only when there are more reviews to show */}
          {hasMore && !showAllReviews && (
            <button
              onClick={() => setShowAllReviews(true)}
              className="mt-2 w-full py-2.5 rounded-lg border border-ink-900 text-ink-900 text-[14px] font-medium inline-flex items-center justify-center gap-1 transition-colors duration-200 active:bg-ink-100"
            >
              {t('agent.reviews.showMore', { n: agent.reviews.length - REVIEW_LIMIT })} <ChevronDown size={14}/>
            </button>
          )}

          {/* Write a review CTA */}
          <button
            onClick={() => setWriteReviewOpen(true)}
            className="mt-2 w-full py-2.5 rounded-lg text-ink-500 text-[14px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors duration-200 hover:text-ink-900"
          >
            <PenLine size={14}/> {t('agent.reviews.write')}
          </button>
        </section>

      </div>

      {/* Sticky CTA — hire is one-time. Once hired, the analyst is on your desk:
          open its chat, or remove it. */}
      <div className="shrink-0 px-4 py-3 border-t border-ink-200 bg-paper">
        {confirmRemove ? (
          <div className="flex flex-col gap-2.5">
            <p className="text-[13px] text-ink-500 text-center leading-snug">{t('marketplace.removeConfirm')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmRemove(false)}
                className="flex-1 py-3 rounded-lg border border-ink-200 text-ink-700 text-[14px] font-medium hover:border-ink-300 transition-colors"
              >{t('common.cancel')}</button>
              <button
                onClick={unhire}
                className="flex-1 py-3 rounded-lg bg-ink-900 text-paper text-[14px] font-medium transition-colors active:bg-ink-700"
              >{t('marketplace.removeYes')}</button>
            </div>
          </div>
        ) : hired ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => nav(`/chat/${hiredCopyId}`)}
              className="btn-accent flex-1 py-3 text-[14px] flex items-center justify-center gap-2"
            >
              <Check size={16} /> {t('marketplace.hired')} · {t('marketplace.openChat')}
            </button>
            <button
              onClick={() => setConfirmRemove(true)}
              aria-label={t('marketplace.remove')}
              title={t('marketplace.remove')}
              className="shrink-0 px-3.5 py-3 rounded-lg border border-ink-200 text-ink-500 hover:text-ink-900 hover:border-ink-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={hire}
            className="btn-accent w-full py-3 text-[14px] flex items-center justify-center gap-2"
          >
            <CopyPlus size={16} /> {t('marketplace.hire')}
          </button>
        )}
      </div>

      {shareOpen && (
        <ShareSheet
          title={agent.name}
          subtitle={agent.title}
          url={`https://alphawalk.app/marketplace/${agent.id}`}
          onClose={() => setShareOpen(false)}
        />
      )}

      {writeReviewOpen && (
        <WriteReviewSheet
          agentName={agent.name}
          onClose={() => setWriteReviewOpen(false)}
          onSubmit={submitReview}
        />
      )}
    </div>
  );
}

function WriteReviewSheet({ agentName, onClose, onSubmit }: {
  agentName: string;
  onClose: () => void;
  onSubmit: (stars: number, comment: string) => void;
}) {
  const t = useT();
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const canSubmit = stars >= 1 && comment.trim().length > 0;
  const display = hover || stars;

  return (
    <div className="absolute inset-0 z-40 bg-ink-900/50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-card rounded-t-lg shadow-sheet pb-[max(env(safe-area-inset-bottom),16px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2 pb-1">
          <span className="w-10 h-1 rounded-pill bg-ink-200" />
        </div>
        <header className="px-4 pb-2 flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-[20px] font-medium text-ink-900">{t('agent.reviews.write')}</h3>
            <p className="text-[13px] text-ink-500">{t('agent.writeReview.for', { name: agentName })}</p>
          </div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900 transition-colors" aria-label="close"><X size={18}/></button>
        </header>

        {/* Star picker (1–5) */}
        <div className="px-4 pt-2 pb-3">
          <p className="text-[11px] uppercase tracking-label text-ink-500 mb-1.5">{t('agent.writeReview.yourRating')}</p>
          <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setStars(n)}
                onMouseEnter={() => setHover(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                className="p-1"
              >
                <Star
                  size={32}
                  className={n <= display ? 'text-ink-900' : 'text-ink-200'}
                  fill={n <= display ? 'currentColor' : 'none'}
                  strokeWidth={1.6}
                />
              </button>
            ))}
            {stars > 0 && (
              <span className="ml-2 font-mono text-[15px] text-ink-900">{stars}/5</span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div className="px-4 pb-3">
          <p className="text-[11px] uppercase tracking-label text-ink-500 mb-1.5">{t('agent.writeReview.yourReview')}</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder={t('agent.writeReview.placeholder')}
            className="w-full rounded-md border border-ink-200 bg-card px-3 py-2 text-[15px] outline-none transition-colors focus:border-ink-900 resize-none placeholder:text-ink-300"
          />
        </div>

        {/* Submit */}
        <div className="px-4">
          <button
            onClick={() => canSubmit && onSubmit(stars, comment)}
            disabled={!canSubmit}
            className="w-full py-3 rounded-lg bg-ink-900 text-paper font-medium text-[14px] transition-colors duration-200 ease-out-expo active:bg-ink-700 disabled:bg-ink-200 disabled:text-ink-500"
          >
            {t('agent.writeReview.post')}
          </button>
        </div>
      </div>
    </div>
  );
}
