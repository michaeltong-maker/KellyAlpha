import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { Agent } from '../types';
import { Avatar } from './Avatar';
import { StrideRule } from './StrideRule';
import { useT, type MessageKey } from '../lib/i18n';

const STAGES: MessageKey[] = [
  'run.stage.walking',
  'run.stage.scanning',
  'run.stage.flows',
  'run.stage.drafting',
  'run.stage.filing',
];
const PER_STAGE = 700; // ms

/**
 * The "analyst at work" sequence shown while a run is in flight. Turns dead
 * wait time into the most characterful moment in the app: the analyst walks the
 * markets through staged status, the stride fills as a progress spine, then the
 * dossier is filed. onComplete fires once the sequence resolves.
 */
export function RunFiling({ agent, onComplete }: { agent: Agent; onComplete: () => void }) {
  const t = useT();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= STAGES.length - 1) {
          clearInterval(id);
          window.setTimeout(onComplete, 520);
          return s;
        }
        return s + 1;
      });
    }, PER_STAGE);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = (step + 1) / STAGES.length;

  return (
    <div className="absolute inset-0 z-50 bg-paper flex flex-col items-center justify-center px-8 text-center dossier-rise">
      <Avatar seed={agent.avatarSeed} name={agent.name} size={60} ring ink />
      <p className="kicker mt-5">{t('run.filing.eyebrow', { name: agent.name })}</p>

      <div className="w-full max-w-[260px] mt-7">
        <div className="flex justify-center">
          <StrideRule width={60} animate />
        </div>
        <div className="mt-5 h-1 bg-ink-200 rounded-full overflow-hidden">
          <div
            className="h-full accent-gradient origin-left transition-transform duration-500 ease-out-expo"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </div>

      <ul className="mt-7 space-y-2.5 text-left">
        {STAGES.map((k, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li
              key={k}
              className={`flex items-center gap-2.5 text-[15px] transition-colors duration-300 ${
                done ? 'text-ink-400' : active ? 'text-ink-900 font-medium' : 'text-ink-300'
              }`}
            >
              <span className="w-4 flex items-center justify-center shrink-0">
                {done ? (
                  <Check size={14} className="text-accent" strokeWidth={2} />
                ) : active ? (
                  <Loader2 size={14} className="text-accent animate-spin" strokeWidth={2} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-ink-200" />
                )}
              </span>
              {t(k)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
