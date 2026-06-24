import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { StrideRule } from '../../components/StrideRule';
import { MargauxAvatar } from '../../components/MargauxAvatar';
import { ChevronLeft, EyeOff } from 'lucide-react';
import { useT, type MessageKey } from '../../lib/i18n';

/**
 * Margaux — the front-desk concierge. A pinned, scripted conversation that
 * onboards a new desk owner one "stride" at a time, then stays as standing
 * help. She is NOT an agent: no reports, no hire, no Profile. The walk is a
 * fixed sequence; tapping a stride's CTA reveals the next (and, for the
 * surface-hops, navigates), so the thread reads like a host walking just
 * ahead of you and waiting when you wander off.
 */

type Stride = {
  step: number;
  title: MessageKey;
  body: MessageKey;
  cta: MessageKey;
  /** Where the CTA takes the user, if anywhere. Undefined = unfold in-thread. */
  to?: string;
};

const STRIDES: Stride[] = [
  { step: 1, title: 'margaux.s1.title', body: 'margaux.s1.body', cta: 'margaux.s1.cta' },
  { step: 2, title: 'margaux.s2.title', body: 'margaux.s2.body', cta: 'margaux.s2.cta', to: '/marketplace' },
  { step: 3, title: 'margaux.s3.title', body: 'margaux.s3.body', cta: 'margaux.s3.cta', to: '/chat' },
  { step: 4, title: 'margaux.s4.title', body: 'margaux.s4.body', cta: 'margaux.s4.cta', to: '/marketplace' },
];

export function MargauxThread() {
  const nav = useNavigate();
  const { persisted, updatePersisted } = useApp();
  const t = useT();
  const m = persisted.margaux;
  const bottomRef = useRef<HTMLDivElement>(null);

  const setMargaux = (patch: Partial<typeof m>) =>
    updatePersisted({ margaux: { ...m, ...patch } });

  // Keep the latest bubble in view as the conversation unfolds.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [m.walkStep, m.status]);

  const [confirmHide, setConfirmHide] = useState(false);
  const takeWalk = () => setMargaux({ status: 'walking', walkStep: 1 });
  const skip = () => setMargaux({ status: 'skipped' });
  const doHide = () => { setMargaux({ hidden: true }); nav('/chat'); };

  const advance = (stride: Stride) => {
    if (stride.step === 4) {
      setMargaux({ status: 'done', walkStep: 4 });
      nav('/marketplace');
      return;
    }
    // Reveal the next stride; for surface-hops, also navigate.
    setMargaux({ walkStep: Math.max(m.walkStep, stride.step + 1), status: 'walking' });
    if (stride.to) nav(stride.to);
  };

  const walkStarted = m.status === 'walking' || m.status === 'done';
  const finished = m.status === 'done';
  // The furthest stride to render. While walking, show up to walkStep; when
  // done, show all four.
  const shownUpTo = finished ? 4 : walkStarted ? m.walkStep : 0;
  // The stride whose CTA is currently live (the latest revealed, while walking).
  const activeStep = finished ? 0 : shownUpTo;

  return (
    <div className="relative flex-1 min-h-0 flex flex-col bg-paper">
      {/* Header — same rhythm as an agent header, but deliberately set apart:
          the house crest instead of an animal/ink monogram, a "Front Desk"
          beat instead of a market beat, an accent-soft wash, and an accent
          hairline underline (agents carry a plain ink-200 border). No
          favourite star and no Reports/Profile tab strip — she isn't an agent. */}
      <header className="shrink-0 flex items-center gap-3 px-3 pt-[max(env(safe-area-inset-top),12px)] pb-3 bg-accent-soft/50 border-b border-accent/30">
        <Link
          to="/chat"
          className="p-1.5 -ml-1 rounded-sm text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors"
          aria-label={t('common.close')}
        >
          <ChevronLeft size={22} strokeWidth={1.8} />
        </Link>
        <MargauxAvatar size={38} ring />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[22px] font-medium leading-none text-ink-900 truncate">
            {t('margaux.name')}
          </h1>
          <p className="text-[10px] uppercase tracking-label text-accent mt-1">{t('margaux.role')}</p>
        </div>
        {/* Hide the concierge from the chat list. Non-destructive — the walk
            state is kept, and it can be brought back from Profile → Front-desk
            guide. */}
        <button
          onClick={() => setConfirmHide(true)}
          aria-label={t('margaux.hide')}
          title={t('margaux.hide')}
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors"
        >
          <EyeOff size={16} strokeWidth={1.7} />
          <span className="text-[12px] hidden sm:inline">{t('margaux.hide')}</span>
        </button>
      </header>

      {/* Conversation */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4 bg-paper w-full max-w-3xl mx-auto">
        <div className="flex flex-col items-center gap-1.5 pt-1 pb-5">
          <StrideRule width={26} />
          <p className="kicker text-center">{t('margaux.role')}</p>
        </div>

        {/* Intro bubble — always present. */}
        <Bubble>{t('margaux.intro')}</Bubble>

        {/* Pre-walk: invite or resume. */}
        {m.status === 'invited' && (
          <div className="flex flex-wrap gap-2 mt-3 pl-10">
            <button onClick={takeWalk} className="btn-accent px-4 py-2 text-[13px]">
              {t('margaux.intro.cta')}
            </button>
            <button
              onClick={skip}
              className="px-4 py-2 text-[13px] text-ink-500 hover:text-ink-900 transition-colors"
            >
              {t('margaux.intro.skip')}
            </button>
          </div>
        )}

        {/* The strides, revealed in pace. */}
        {STRIDES.filter((s) => s.step <= shownUpTo).map((s) => (
          <Fragment key={s.step}>
            <ProgressRow label={t('margaux.progress', { n: s.step })} step={s.step} title={t(s.title)} />
            <Bubble>{t(s.body)}</Bubble>
            {!finished && s.step === activeStep && (
              <div className="flex mt-3 pl-10">
                <button onClick={() => advance(s)} className="btn-accent px-4 py-2 text-[13px]">
                  {t(s.cta)} {s.step < 4 ? '→' : ''}
                </button>
              </div>
            )}
          </Fragment>
        ))}

        {/* Standing help — once the walk is done, or offered as a gentle
            resume when the user skipped. */}
        {finished && <Bubble note>{t('margaux.standing')}</Bubble>}
        {m.status === 'skipped' && (
          <>
            <Bubble note>{t('margaux.standing')}</Bubble>
            <div className="flex mt-3 pl-10">
              <button onClick={takeWalk} className="btn-accent px-4 py-2 text-[13px]">
                {t('margaux.resume')} →
              </button>
            </div>
          </>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Double-confirm before hiding — and the body spells out exactly where
          to bring her back, so hiding never feels like a one-way door. */}
      {confirmHide && (
        <div className="absolute inset-0 z-30 bg-ink-900/40 flex items-end" onClick={() => setConfirmHide(false)}>
          <div
            className="w-full bg-card rounded-t-lg shadow-sheet pb-[max(env(safe-area-inset-bottom),12px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-2 pb-1">
              <span className="w-10 h-1 rounded-pill bg-ink-200" />
            </div>
            <div className="px-5 pt-2 pb-4">
              <h3 className="font-display text-[22px] font-medium text-ink-900">{t('margaux.hide.confirmTitle')}</h3>
              <p className="text-[14px] text-ink-500 leading-snug mt-1.5">{t('margaux.hide.confirmBody')}</p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setConfirmHide(false)}
                  className="flex-1 px-5 py-3 rounded-sm border border-ink-300 text-ink-900 text-[14px] font-medium hover:bg-ink-50 transition-colors duration-200 ease-out-expo"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={doHide}
                  className="flex-1 px-5 py-3 rounded-sm bg-ink-900 text-paper text-[14px] font-medium transition-colors duration-200 ease-out-expo"
                >
                  {t('margaux.hide.confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Margaux speech bubble — serif voice, left-aligned, with her accent mark.
 *  `note` renders the quieter standing-help variant on an accent-soft fill. */
function Bubble({ children, note = false }: { children: React.ReactNode; note?: boolean }) {
  return (
    <div className="flex mb-1 justify-start items-end gap-2 mt-3">
      <MargauxAvatar size={32} />
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-bl-md border ${
          note
            ? 'bg-accent-soft border-accent/30 text-ink-700 font-sans text-[14px] leading-snug'
            : 'bg-card border-ink-200 text-ink-900 font-display text-[16px] leading-[1.45]'
        }`}
      >
        <p className="whitespace-pre-wrap">{children}</p>
      </div>
    </div>
  );
}

/** Stride progress: the brand's three ascending marks fill as the walk
 *  advances, with a "Stride n of 4 · Title" caption. */
function ProgressRow({ label, step, title }: { label: string; step: number; title: string }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-6 mb-1">
      <span className="flex items-end gap-[3px] h-3" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`w-[3px] rounded-[1px] ${i <= step ? 'bg-accent' : 'bg-ink-200'}`}
            style={{ height: 5 + i * 2 }}
          />
        ))}
      </span>
      <span className="font-mono text-[10px] tracking-wide text-ink-300">
        {label} · {title}
      </span>
    </div>
  );
}
