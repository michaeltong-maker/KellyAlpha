import { useT } from '../lib/i18n';

// Analysts grade their calls with a conviction score (e.g. "conviction 7/10").
// We surface that buried number as a visual gauge in the dossier masthead — a
// small, honest signal of how strongly the columnist stands behind the read.
function parseConviction(body: string): number | null {
  const m = body.match(/conviction[\s\S]{0,24}?(\d{1,2})\s*\/\s*10/i);
  if (!m) return null;
  const v = Number(m[1]);
  return v >= 1 && v <= 10 ? v : null;
}

export function ConvictionGauge({ body }: { body: string }) {
  const t = useT();
  const v = parseConviction(body);
  if (v == null) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-2.5">
      <span className="kicker">{t('result.conviction')}</span>
      <span className="flex items-end gap-[3px]" aria-hidden>
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={`w-[3px] rounded-full transition-colors ${i < v ? 'bg-accent' : 'bg-ink-200'}`}
            style={{ height: `${8 + i * 0.9}px` }}
          />
        ))}
      </span>
      <span className="font-mono text-[12px] text-ink-700 tabular-nums">{v}/10</span>
    </div>
  );
}
