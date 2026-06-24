import { Fragment, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { AppHeader } from '../../components/AppHeader';
import { ResultViewerModal } from '../../components/ResultViewerModal';
import { ResultDetailPane } from '../../components/ResultDetailPane';
import { InlineStocks } from '../../components/InlineStocks';
import { relTime } from '../../lib/format';
import { FileText, Search, Sparkles } from 'lucide-react';
import type { Result } from '../../types';
import { useT, type MessageKey } from '../../lib/i18n';
import { StrideRule } from '../../components/StrideRule';

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  const niceDate = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  if (dayKey(iso) === dayKey(today.toISOString())) return `Today · ${niceDate}`;
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return `Yesterday · ${niceDate}`;
  return niceDate;
}

const MAX_TAG_CHIPS = 8;

export function DeskPage() {
  const { agents, results, persisted, updatePersisted } = useApp();
  const t = useT();
  const isDesktop = useIsDesktop();
  const [q, setQ] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [open, setOpen] = useState<Result | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const popularTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of results) {
      for (const k of r.keywords) counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, MAX_TAG_CHIPS)
      .map(([k]) => k);
  }, [results]);

  const orderedChips = useMemo(() => {
    const selected = selectedTags;
    const rest = popularTags.filter((tag) => !selected.includes(tag));
    return [...selected, ...rest];
  }, [popularTags, selectedTags]);

  const toggleTag = (tag: string) =>
    setSelectedTags((cur) => (cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag]));

  const filtered = useMemo(() => {
    return results
      .filter((r) => selectedTags.length === 0 || selectedTags.some((tag) => r.keywords.includes(tag)))
      .filter((r) => {
        if (q.trim() === '') return true;
        const text = `${r.title} ${r.summary} ${r.keywords.join(' ')} ${r.stocks.map((s) => `${s.symbol} ${s.name}`).join(' ')}`.toLowerCase();
        return text.includes(q.toLowerCase());
      })
      .sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [results, q, selectedTags]);

  const openAgent = (r: Result) => agents.find((a) => a.id === r.agentId);

  // Morning-briefing hook: a greeting + how many reports landed today, so the
  // Desk feels like something filed for you overnight, worth opening daily.
  const hour = new Date().getHours();
  const greetKey: MessageKey = hour < 12 ? 'greet.morning' : hour < 18 ? 'greet.hi' : 'greet.evening';
  const filedToday = useMemo(() => {
    const todayKey = dayKey(new Date().toISOString());
    return results.filter((r) => dayKey(r.at) === todayKey).length;
  }, [results]);

  // Return-visit reward: count reports filed since the user was last here. On
  // a first-ever visit we look back ~6h so there's a meaningful welcome.
  const [awaySince] = useState(
    () => persisted.lastVisitAt || new Date(Date.now() - 6 * 3600_000).toISOString(),
  );
  const awayResults = useMemo(
    () => results.filter((r) => r.at > awaySince).sort((a, b) => +new Date(b.at) - +new Date(a.at)),
    [results, awaySince],
  );
  const awayCount = awayResults.length;
  // Stamp this visit so the next return measures from now.
  useEffect(() => {
    updatePersisted({ lastVisitAt: new Date().toISOString() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const briefingKicker = awayCount > 0 ? t('desk.briefing.awayKicker') : t(greetKey);
  const briefingLine = awayCount > 0
    ? t(awayCount === 1 ? 'desk.briefing.away.one' : 'desk.briefing.away.many', { n: awayCount })
    : filedToday > 0
      ? t(filedToday === 1 ? 'desk.briefing.filed.one' : 'desk.briefing.filed.many', { n: filedToday })
      : t('desk.briefing.current');

  // On desktop, default the detail pane to the most recent visible result.
  // Reset when switching shells or when the filtered list changes drastically.
  useEffect(() => {
    if (isDesktop) {
      if (!selectedId || !filtered.some((r) => r.id === selectedId)) {
        setSelectedId(filtered[0]?.id ?? null);
      }
    } else {
      setSelectedId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop, filtered.length]);

  const onRowClick = (r: Result) => {
    if (isDesktop) setSelectedId(r.id);
    else setOpen(r);
  };

  const selectedResult = isDesktop ? filtered.find((r) => r.id === selectedId) ?? null : null;
  const selectedAgent = selectedResult ? openAgent(selectedResult) : null;

  // The list pane content (header + search + filters + scrolling list) is
  // identical on mobile and desktop. We just wrap it differently:
  //  - mobile: fills the screen, taps open the ResultViewerModal
  //  - desktop: lives in a fixed-width left aside; taps update the right pane
  const listPane = (
    <div className="flex-1 min-h-0 flex flex-col bg-paper overflow-x-hidden">
      <AppHeader title={t('tab.desk')} subtitle={t(filtered.length === 1 ? 'header.desk.results.one' : 'header.desk.results.many', { n: filtered.length })} />

      {/* Morning briefing — leads with the "while you were away" reward when
          reports landed since the last visit, and taps straight to the newest. */}
      <div className="px-5 pt-4 w-full max-w-3xl mx-auto">
        {awayCount > 0 ? (
          <button
            onClick={() => onRowClick(awayResults[0])}
            className="w-full flex items-center gap-3 text-left -mx-1 px-1 py-1 rounded-lg active:bg-ink-50 transition-colors"
          >
            <div className="min-w-0">
              <p className="kicker text-accent">{briefingKicker}</p>
              <p className="font-display text-[20px] text-ink-900 leading-snug mt-0.5">{briefingLine}</p>
            </div>
            <StrideRule width={36} animate className="ml-auto shrink-0" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="kicker">{briefingKicker}</p>
              <p className="font-display text-[20px] text-ink-900 leading-snug mt-0.5">{briefingLine}</p>
            </div>
            <StrideRule width={36} animate className="ml-auto shrink-0" />
          </div>
        )}
      </div>

      <div className="px-5 pt-3 pb-3 space-y-3">
        <div className="flex items-center gap-2.5 bg-card border border-ink-200 rounded-md px-3.5 py-2.5">
          <Search size={16} className="text-ink-300" strokeWidth={1.8} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search.desk')}
            className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-ink-300"
          />
        </div>
        {orderedChips.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {orderedChips.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`shrink-0 text-[12px] px-3 py-1 rounded-pill border transition-colors duration-200 ${
                    active
                      ? 'chip-active'
                      : 'bg-transparent text-ink-500 border-ink-200 hover:border-ink-300'
                  }`}
                >{tag}</button>
              );
            })}
          </div>
        )}
      </div>

      <ul className="flex-1 min-h-0 overflow-y-auto pb-2 w-full max-w-3xl mx-auto">
        {filtered.map((r, i) => {
          const agent = openAgent(r);
          if (!agent) return null;
          const prev = filtered[i - 1];
          const showDivider = !prev || dayKey(prev.at) !== dayKey(r.at);
          const label = dayLabel(r.at);

          return (
            <Fragment key={r.id}>
              {showDivider && (
                <li className="sticky top-0 z-10 px-0 py-0 bg-paper">
                  <div className="flex items-center gap-3 px-5 py-2.5">
                    <span className="text-[11px] font-medium uppercase tracking-label text-ink-500 shrink-0">
                      {label}
                    </span>
                    <div className="flex-1 h-px bg-ink-200" />
                  </div>
                </li>
              )}
              <li>
                <button
                  onClick={() => onRowClick(r)}
                  className={`w-full text-left flex flex-col gap-2 px-5 py-4 border-b border-ink-200 overflow-hidden transition-colors ${
                    isDesktop && r.id === selectedId
                      ? 'bg-ink-100'
                      : 'bg-paper active:bg-ink-50'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3 w-full">
                    <h3 className="font-display text-[19px] font-medium leading-tight text-ink-900 truncate min-w-0 flex-1">{r.title}</h3>
                    <span className="font-mono text-[11px] text-ink-300 shrink-0">{relTime(r.at)}</span>
                  </div>

                  {/* Summary — three lines */}
                  <p className="text-[14px] text-ink-500 leading-snug line-clamp-3 w-full">
                    <InlineStocks text={r.summary} stocks={r.stocks} />
                  </p>

                  {r.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.keywords.slice(0, 5).map((k) => (
                        <span key={k} className="text-[11px] px-2.5 py-0.5 rounded-pill border border-ink-200 text-ink-500">{k}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-0.5 w-full">
                    <p className="text-[12px] text-ink-500 inline-flex items-center gap-1.5 shrink-0">
                      {t('meta.by', { name: agent.name })}
                      {agent.isFavourite && (
                        <Sparkles
                          size={11}
                          className="text-accent animate-twinkle"
                          fill="currentColor"
                          aria-label="favourited"
                        />
                      )}
                    </p>
                    <div className="font-mono text-[11px] text-ink-300 flex items-center gap-1 min-w-0 flex-1 justify-end">
                      <FileText size={11} className="shrink-0" strokeWidth={1.6} />
                      <span className="truncate">{r.artifactFilename}</span>
                    </div>
                  </div>
                </button>
              </li>
            </Fragment>
          );
        })}
        {filtered.length === 0 && (
          <li className="text-center text-ink-500 text-[15px] py-10">{t('empty.noResults')}</li>
        )}
      </ul>
    </div>
  );

  // Desktop: list pane on the left, inline detail on the right.
  if (isDesktop) {
    return (
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <aside className="w-[460px] shrink-0 flex flex-col border-r border-ink-200 overflow-hidden">
          {listPane}
        </aside>
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {selectedResult && selectedAgent ? (
            <ResultDetailPane result={selectedResult} agent={selectedAgent} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-[15px] text-ink-500 bg-ink-50">
              {t('empty.noResults')}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile: list fills the screen, taps open the modal.
  return (
    <>
      {listPane}
      {open && (
        (() => {
          const agent = agents.find((a) => a.id === open.agentId);
          if (!agent) return null;
          return <ResultViewerModal result={open} agent={agent} onClose={() => setOpen(null)} />;
        })()
      )}
    </>
  );
}
