import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { useT, type MessageKey } from '../lib/i18n';
import { BrandMark } from './BrandMark';
import { StrideRule } from './StrideRule';

/**
 * First-run flow. Two editorial steps:
 *  1. Brand + the promise, framed as commissioning an analyst.
 *  2. A one-tap "what do you follow?" so the marketplace arrives already
 *     tailored to the user, instead of a generic wall of analysts.
 * Dismissal is remembered so it never nags.
 */
const STEPS: MessageKey[] = ['onboard.step.commission', 'onboard.step.receive', 'onboard.step.discuss'];

// Beats to choose from — these are real agent tags, so a pick maps straight to
// the roster. Shown as-is (product taxonomy reads in English app-wide).
const BEATS = ['US Stocks', 'HK Stocks', 'A-Shares', 'Japan', 'Macro', 'AI', 'Semiconductor', 'Crypto', 'Earnings', 'Value Investor'];

export function Onboarding() {
  const nav = useNavigate();
  const { updatePersisted } = useApp();
  const t = useT();
  const [step, setStep] = useState<'welcome' | 'interests'>('welcome');
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (b: string) =>
    setPicked((cur) => (cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b]));

  const finish = () => {
    updatePersisted({ hasSeenWelcome: true, interests: picked });
    nav('/marketplace');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-paper flex flex-col items-center justify-center px-7 text-center">
      {step === 'welcome' ? (
        <div className="w-full max-w-sm dossier-rise flex flex-col items-center">
          <BrandMark size={22} wordmark />
          <StrideRule width={56} animate className="mt-9" />
          <p className="kicker mt-7">{t('onboard.kicker')}</p>
          <h1 className="font-display text-[34px] font-medium text-ink-900 leading-[1.08] mt-3 text-balance">
            {t('onboard.title')}
          </h1>
          <p className="text-[16px] text-ink-500 leading-relaxed mt-4 max-w-[34ch]">{t('onboard.body')}</p>

          <div className="flex items-center justify-center gap-3 mt-8">
            {STEPS.map((key, i) => (
              <div key={key} className="flex items-center gap-3">
                <span className="kicker text-ink-700">{t(key)}</span>
                {i < STEPS.length - 1 && <span className="h-1 w-1 rounded-full bg-accent" />}
              </div>
            ))}
          </div>

          <button onClick={() => setStep('interests')} className="btn-accent w-full mt-10 py-3.5 text-[15px]">
            {t('onboard.cta')}
          </button>
          <button
            onClick={() => updatePersisted({ hasSeenWelcome: true })}
            className="mt-3 text-[13px] text-ink-500 hover:text-ink-900 transition-colors"
          >
            {t('onboard.skip')}
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md dossier-rise flex flex-col items-center">
          <StrideRule width={44} animate />
          <h1 className="font-display text-[30px] font-medium text-ink-900 leading-[1.1] mt-6 text-balance">
            {t('onboard.interests.title')}
          </h1>
          <p className="text-[15px] text-ink-500 leading-relaxed mt-3 max-w-[36ch]">{t('onboard.interests.body')}</p>

          <div className="flex flex-wrap justify-center gap-2 mt-7">
            {BEATS.map((b) => {
              const on = picked.includes(b);
              return (
                <button
                  key={b}
                  onClick={() => toggle(b)}
                  aria-pressed={on}
                  className={`text-[14px] px-3.5 py-2 rounded-pill border transition-colors duration-200 ${
                    on ? 'chip-active font-medium' : 'bg-transparent text-ink-700 border-ink-200 hover:border-ink-300'
                  }`}
                >
                  {b}
                </button>
              );
            })}
          </div>

          <button onClick={finish} className="btn-accent w-full max-w-sm mt-9 py-3.5 text-[15px]">
            {t('onboard.continue')}
          </button>
          <button onClick={finish} className="mt-3 text-[13px] text-ink-500 hover:text-ink-900 transition-colors">
            {t('onboard.skip')}
          </button>
        </div>
      )}
    </div>
  );
}
