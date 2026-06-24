import { Fragment, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { AppHeader } from '../../components/AppHeader';
import { ResultViewerModal } from '../../components/ResultViewerModal';
import { ResultDetailPane } from '../../components/ResultDetailPane';
import { InlineStocks } from '../../components/InlineStocks';
import { relTime } from '../../lib/format';
import { FileText, Search, Sparkles, Eye, ChevronDown, SlidersHorizontal, Check } from 'lucide-react';
import type { Result } from '../../types';
import { useT, type MessageKey } from '../../lib/i18n';
import { StrideRule } from '../../components/StrideRule';
import { PERSONAL_AGENT_IDS } from '../../data/seedDeskReports';

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

type DeskTab = 'public' | 'personal';
type SortMode = 'latest' | 'pop7d' | 'pop24h';
const SORT_MODES: SortMode[] = ['latest', 'pop7d', 'pop24h'];
const SORT_KEYS: Record<SortMode, MessageKey> = {
  latest: 'desk.sort.latest',
  pop7d: 'desk.sort.pop7d',
  pop24h: 'desk.sort.pop24h',
};

export function DeskPage() {
  const { agents, results, persisted, updatePersisted } = useApp();
  const t = useT();
  const isDesktop = useIsDesktop();
  const [tab, setTab] = useState<DeskTab>('public');
  const [q, setQ] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [open, setOpen] = useState<Result | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Ownership: the user's own reports are those filed by agents they created or
  // hired (plus the seeded personal analyst). Everything else is "other users".
  const ownedAgentIds = useMemo(
    () => new Set<string>([
      ...persisted.userCreatedAgentIds,
      ...Object.keys(persisted.hiredCopies ?? {}),
      ...PERSONAL_AGENT_IDS,
    ]),
    [persisted.userCreatedAgentIds, persisted.hiredCopies],
  );

  const publicResults = useMemo(() => results.filter((r) => !ownedAgentIds.has(r.agentId)), [results, ownedAgentIds]);
  const personalResults = useMemo(() => results.filter((r) => ownedAgentIds.has(r.agentId)), [results, ownedAgentIds]);
  const tabResults = tab === 'public' ? publicResults : personalResults;

  const popularTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of tabResults) {
      for (const k of r.keywords) counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, MAX_TAG_CHIPS)
      .map(([k]) => k);
  }, [tabResults]);

  const orderedChips = useMemo(() => {
    const rest = popularTags.filter((tag) => !selectedTags.includes(tag));
    return [...selectedTags.filter((tg) => popularTags.includes(tg)), ...rest];
  }, [popularTags, selectedTags]);

  const toggleTag = (tag: string) =>
    setSelectedTags((cur) => (cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag]));

  const switchTab = (next: DeskTab) => {
    setTab(next);
    setSelectedTags([]);
    setSelectedId(null);
  };

  // Search + tag filter, then sort. Latest → newest first (date dividers shown).
  // Popularity → filter to the time window, then rank by views (no dividers).
  const searched = useMemo(() => {
    return tabResults
      .filter((r) => selectedTags.length === 0 || selectedTags.some((tag) => r.keywords.includes(tag)))
      .filter((r) => {
        if (q.trim() === '') return true;
        const text = `${r.title} ${r.summary} ${r.keywords.join(' ')} ${r.stocks.map((s) => `${s.symbol} ${s.name}`).join(' ')}`.toLowerCase();
        return text.includes(q.toLowerCase());
      });
  }, [tabResults, q, selectedTags]);

  const listed = useMemo(() => {
    if (sortMode === 'latest') {
      return [...searched].sort((a, b) => +new Date(b.at) - +new Date(a.at));
    }
    const windowMs = sortMode === 'pop24h' ? 24 * 3600_000 : 7 * 24 * 3600_000;
    const cutoff = Date.now() - windowMs;
    return searched
      .filter((r) => +new Date(r.at) >= cutoff)
      .sort((a, b) => (b.views ?? 0) - (a.views ?? 0) || +new Date(b.at) - +new Date(a.at));
  }, [searched, sortMode]);

  const showDividers = sortMode === 'latest';
  const openAgent = (r: Result) => agents.find((a) => a.id === r.agentId);

  // Morning-briefing hook (scoped to the active tab), shown below the tabs.
  const hour = new Date().getHours();
  const greetKey: MessageKey = hour < 12 ? 'greet.morning' : hour < 18 ? 'greet.hi' : 'greet.evening';
  const filedToday = useMemo(() => {
    const todayKey = dayKey(new Date().toISOString());
    return tabResults.filter((r) => dayKey(r.at) === todayKey).length;
  }, [tabResults]);

  const [awaySince] = useState(
    () => persisted.lastVisitAt || new Date(Date.now() - 6 * 3600_000).toISOString(),
  );
  const awayResults = useMemo(
    () => tabResults.filter((r) => r.at > awaySince).sort((a, b) => +new Date(b.at) - +new Date(a.at)),
    [tabResults, awaySince],
  );
  const awayCount = awayResults.length;
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
  useEffect(() => {
    if (isDesktop) {
      if (!selectedId || !listed.some((r) => r.id === selectedId)) {
        setSelectedId(listed[0]?.id ?? null);
      }
    } else {
      setSelectedId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop, tab, sortMode, listed.length]);

  const onRowClick = (r: Result) => {
    if (isDesktop) setSelectedId(r.id);
    else setOpen(r);
  };

  const selectedResult = isDesktop ? listed.find((r) => r.id === selectedId) ?? null : null;
  const selectedAgent = selectedResult ? openAgent(selectedResult) : null;

  const TABS: { key: DeskTab; label: MessageKey }[] = [
    { key: 'public', label: 'desk.tab.public' },
    { key: 'personal', label: 'desk.tab.personal' },
  ];

  const emptyMessage = tab === 'personal'
    ? t('desk.personal.empty')
    : sortMode !== 'latest'
      ? t('desk.popular.empty')
      : t('empty.noResults');

  const listPane = (
    <div className="flex-1 min-h-0 flex flex-col bg-paper overflow-x-hidden">
      <AppHeader title={t('tab.desk')} subtitle={t(listed.length === 1 ? 'header.desk.results.one' : 'header.desk.results.many', { n: listed.length })} />

      {/* Public / Personal tabs (marketplace style) */}
      <div className="px-5 pt-4 w-full max-w-3xl mx-auto">
        <div className="flex border-b border-ink-200">
          {TABS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => switchTab(opt.key)}
              className={`flex-1 text-[13px] uppercase tracking-label py-2.5 -mb-px border-b transition-colors duration-200 ease-out-expo ${tab === opt.key ? 'border-accent text-accent font-medium' : 'border-transparent text-ink-500'}`}
            >
              {t(opt.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Briefing — scoped to the active tab (Personal vs Public new reports) */}
      <div className="px-5 pt-3 w-full max-w-3xl mx-auto">
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

      {/* Search + sort */}
      <div className="px-5 pt-3 pb-3 space-y-3 w-full max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2.5 bg-card border border-ink-200 rounded-md px-3.5 py-2.5">
            <Search size={16} className="text-ink-300" strokeWidth={1.8} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('search.desk')}
              className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-ink-300 min-w-0"
            />
          </div>
          <div className="relative shrink-0">
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-1.5 bg-card border border-ink-200 rounded-md px-3 py-2.5 text-[13px] text-ink-700 hover:border-ink-300 transition-colors"
              aria-label={t('desk.sort.label')}
            >
              <SlidersHorizontal size={14} strokeWidth={1.8} />
              <span className="hidden sm:inline">{t(SORT_KEYS[sortMode])}</span>
              <ChevronDown size={14} strokeWidth={1.8} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-card border border-ink-200 rounded-md shadow-sheet py-1">
                  {SORT_MODES.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSortMode(s); setSortOpen(false); }}
                      className="w-full text-left px-3 py-2 text-[13px] flex items-center justify-between hover:bg-ink-50 transition-colors"
                    >
                      <span className={sortMode === s ? 'text-accent font-medium' : 'text-ink-700'}>{t(SORT_KEYS[s])}</span>
                      {sortMode === s && <Check size={14} className="text-accent" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
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
                    active ? 'chip-active' : 'bg-transparent text-ink-500 border-ink-200 hover:border-ink-300'
                  }`}
                >{tag}</button>
              );
            })}
          </div>
        )}
      </div>

      <ul className="flex-1 min-h-0 overflow-y-auto pb-2 w-full max-w-3xl mx-auto">
        {listed.map((r, i) => {
          const agent = openAgent(r);
          if (!agent) return null;
          const prev = listed[i - 1];
          const showDivider = showDividers && (!prev || dayKey(prev.at) !== dayKey(r.at));
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
                    isDesktop && r.id === selectedId ? 'bg-ink-100' : 'bg-paper active:bg-ink-50'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3 w-full">
                    <h3 className="font-display text-[19px] font-medium leading-tight text-ink-900 truncate min-w-0 flex-1">{r.title}</h3>
                    <span className="font-mono text-[11px] text-ink-300 shrink-0">{relTime(r.at)}</span>
                  </div>

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
                    <p className="text-[12px] text-ink-500 inline-flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1.5">
                        {t('meta.by', { name: agent.name })}
                        {agent.isFavourite && (
                          <Sparkles size={11} className="text-accent animate-twinkle" fill="currentColor" aria-label="favourited" />
                        )}
                      </span>
                      <span className="inline-flex items-center gap-1 text-ink-300" title={t('stocksearch.readers', { n: (r.views ?? 0).toLocaleString() })}>
                        <Eye size={11} strokeWidth={1.7} />
                        {(r.views ?? 0).toLocaleString()}
                      </span>
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
        {listed.length === 0 && (
          <li className="text-center text-ink-500 text-[15px] py-10 px-6">{emptyMessage}</li>
        )}
      </ul>
    </div>
  );

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
            <div className="flex-1 flex items-center justify-center text-[15px] text-ink-500 bg-ink-50 px-8 text-center">
              {emptyMessage}
            </div>
          )}
        </div>
      </div>
    );
  }

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
