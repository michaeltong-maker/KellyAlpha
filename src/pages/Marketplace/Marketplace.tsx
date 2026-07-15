import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { AppHeader } from '../../components/AppHeader';
import { Avatar } from '../../components/Avatar';
import { Tag } from '../../components/Tag';
import { Sparkles, X, Check, Star, Users, Play, Coins, ArrowUpDown, ChevronDown, TrendingUp, Clock, Percent, SlidersHorizontal } from 'lucide-react';
import type { Agent, Tag as TagType } from '../../types';
import { useT, type MessageKey } from '../../lib/i18n';
import { pct } from '../../lib/format';
import { agentVersion, agentRuns, agentCreditsPerRun, agentRecency } from '../../lib/agentMeta';
import { agentPerformance } from '../../lib/trackRecord';

const POPULAR_TAGS: TagType[] = [
  'Value Investor', 'Quant', 'Macro', 'Semiconductor', 'AI', 'Sentiment', 'Earnings',
  'US Stocks', 'Options', 'Healthcare', 'Energy', 'ETFs', 'News', 'Dividends',
  'HK Stocks', 'Japan', 'A-Shares', 'Crypto',
];

type SortMode = 'recommended' | 'trending' | 'top' | 'new' | 'performance';
const SORT_OPTIONS: { key: SortMode; labelKey: MessageKey; Icon: typeof Sparkles }[] = [
  { key: 'recommended', labelKey: 'marketplace.sort.recommended', Icon: Sparkles },
  { key: 'trending',    labelKey: 'marketplace.sort.trending',    Icon: TrendingUp },
  { key: 'top',         labelKey: 'marketplace.sort.top',         Icon: Star },
  { key: 'new',         labelKey: 'marketplace.sort.new',         Icon: Clock },
  { key: 'performance', labelKey: 'marketplace.sort.performance', Icon: Percent },
];

export function Marketplace() {
  const { agents, persisted } = useApp();
  const t = useT();
  const hiredIds = new Set(Object.keys(persisted.hiredCopies ?? {}));
  const userIds = new Set(persisted.userCreatedAgentIds ?? []);
  const interests = persisted.interests ?? [];

  const [q, setQ] = useState('');
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('recommended');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortOpen) return;
    const onDoc = (e: MouseEvent) => { if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [sortOpen]);

  const hasActiveFilter = q.trim().length > 0 || selectedTags.length > 0;
  const toggleTag = (tag: TagType) => setSelectedTags((cur) => (cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag]));
  const clearFilters = () => { setQ(''); setSelectedTags([]); };

  // Performance is expensive to compute (builds a track record); memoize per agent.
  const perfMap = useMemo(() => {
    const m = new Map<string, number | null>();
    for (const a of agents) if (a.isPublic) m.set(a.id, agentPerformance(a.id));
    return m;
  }, [agents]);

  const listed = useMemo(() => {
    const matchScore = (a: Agent) => (interests.length === 0 ? 0 : a.tags.filter((tg) => interests.includes(tg)).length);
    const matches = (a: Agent) => {
      const qOk = q.trim().length === 0
        || a.name.toLowerCase().includes(q.toLowerCase())
        || (a.title ?? '').toLowerCase().includes(q.toLowerCase())
        || a.description.toLowerCase().includes(q.toLowerCase());
      const tagOk = selectedTags.length === 0 || selectedTags.some((tg) => a.tags.includes(tg));
      return qOk && tagOk;
    };
    const arr = agents.filter((a) => a.isPublic && matches(a));
    const perf = (a: Agent) => { const p = perfMap.get(a.id); return p === null || p === undefined ? -Infinity : p; };
    switch (sortMode) {
      case 'trending':    arr.sort((a, b) => agentRuns(b.id) - agentRuns(a.id)); break;
      case 'top':         arr.sort((a, b) => (b.rating - a.rating) || (b.reviews.length - a.reviews.length)); break;
      case 'new':         arr.sort((a, b) => ((userIds.has(b.id) ? 1 : 0) - (userIds.has(a.id) ? 1 : 0)) || (agentRecency(b.id) - agentRecency(a.id))); break;
      case 'performance': arr.sort((a, b) => perf(b) - perf(a)); break;
      case 'recommended':
      default:            arr.sort((a, b) => (matchScore(b) - matchScore(a)) || (b.duplicates - a.duplicates)); break;
    }
    return arr.slice(0, 40);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agents, q, selectedTags, interests, sortMode, perfMap]);

  const currentSort = SORT_OPTIONS.find((o) => o.key === sortMode)!;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-paper">
      <AppHeader title={t('tab.marketplace')} subtitle={t('header.marketplace.subtitle')} />

      <div className="px-4 pt-3 pb-2 w-full max-w-5xl mx-auto">
        {/* Search + sort */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 flex items-center gap-2.5 bg-card border border-ink-200 rounded-lg px-3.5 h-11 focus-within:border-ink-900 transition-colors">
            <Sparkles size={16} className="text-accent shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('marketplace.tryStrategy')}
              className="flex-1 min-w-0 bg-transparent outline-none text-[15px] placeholder:text-ink-300"
            />
            {hasActiveFilter && (
              <button onClick={clearFilters} aria-label="Clear filters" className="p-0.5 text-ink-500 hover:text-ink-900 transition-colors"><X size={14} /></button>
            )}
          </div>

          <div className="relative shrink-0" ref={sortRef}>
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="inline-flex items-center gap-2 h-11 px-3.5 rounded-lg border border-ink-200 bg-card hover:border-ink-300 transition-colors"
            >
              <ArrowUpDown size={16} className="text-ink-500" />
              <span className="hidden sm:inline text-[13px] text-ink-500">{t('marketplace.sort.label')}</span>
              <span className="text-[14px] font-medium text-ink-900 whitespace-nowrap">{t(currentSort.labelKey)}</span>
              <ChevronDown size={16} className={`text-ink-500 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-56 rounded-lg border border-ink-200 bg-card shadow-overlay p-1 animate-fade-rise">
                {SORT_OPTIONS.map(({ key, labelKey, Icon }) => (
                  <button
                    key={key}
                    onClick={() => { setSortMode(key); setSortOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[14px] hover:bg-ink-50 transition-colors"
                  >
                    <Icon size={16} className={sortMode === key ? 'text-accent' : 'text-ink-500'} />
                    <span className={sortMode === key ? 'text-accent font-medium' : 'text-ink-900'}>{t(labelKey)}</span>
                    {sortMode === key && <Check size={15} className="ml-auto text-accent" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filters + tag chips */}
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-pill border border-ink-200 text-ink-700 text-[13px] shrink-0 hover:border-ink-300 transition-colors"
          >
            <SlidersHorizontal size={14} /> {t('marketplace.filters')}
          </button>
          {filtersOpen && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mr-1 pr-1">
              {POPULAR_TAGS.map((tag) => (
                <Tag key={tag} active={selectedTags.includes(tag)} onClick={() => toggleTag(tag)}>{tag}</Tag>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
        <div className="w-full max-w-5xl mx-auto">
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start pb-2">
            {listed.map((a, i) => (
              <li key={a.id}>
                <AgentCard agent={a} rank={i + 1} hired={hiredIds.has(a.id)} perf={perfMap.get(a.id) ?? null} />
              </li>
            ))}
            {listed.length === 0 && (
              <li className="text-center text-ink-500 text-[15px] py-10 lg:col-span-2">{t('empty.noAgents')}</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function AgentCard({ agent, rank, hired, perf }: { agent: Agent; rank: number; hired: boolean; perf: number | null }) {
  const t = useT();
  const isTop3 = rank <= 3;
  const version = agentVersion(agent.id);
  const runs = agentRuns(agent.id);
  const credits = agentCreditsPerRun(agent.id);
  const extraTags = agent.tags.length - 3;

  return (
    <Link
      to={`/marketplace/${agent.id}`}
      className="relative block bg-card rounded-2xl border border-ink-200 p-4 hover:border-ink-300 transition-colors"
    >
      {/* Performance bubble — upper-right */}
      {perf !== null ? (
        <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-ink-50 border border-ink-200 text-right leading-none">
          <span className="block text-[8px] uppercase tracking-label text-ink-400">{t('marketplace.avgReturn')}</span>
          <span className={`block font-mono text-[14px] font-semibold mt-1 ${perf >= 0 ? 'text-success' : 'text-danger'}`}>{pct(perf)}</span>
        </span>
      ) : (
        <span className="absolute top-2.5 right-2.5 px-2.5 py-1.5 rounded-lg bg-ink-50 border border-ink-200 max-w-[82px] text-[9px] uppercase tracking-label text-ink-400 leading-tight text-center">
          {t('marketplace.noPerf')}
        </span>
      )}

      <div className="flex gap-3.5">
        <div className="relative shrink-0">
          <Avatar seed={agent.avatarSeed} name={agent.name} size={52} ink />
          <span
            className={`absolute -top-1.5 -left-1.5 min-w-6 h-6 px-1.5 rounded-pill font-mono text-[12px] inline-flex items-center justify-center border ${
              isTop3 ? 'bg-ink-900 text-paper border-ink-900' : 'bg-card text-ink-500 border-ink-200'
            }`}
          >
            #{rank}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="pr-[86px]">
            <div className="flex items-baseline gap-2">
              <h3 className="font-display text-[19px] font-medium text-ink-900 truncate">{agent.name}</h3>
              <span className="text-[12px] font-mono text-ink-400 shrink-0">v{version}</span>
            </div>
            {agent.title && <p className="text-[11px] uppercase tracking-label text-ink-500 truncate mt-0.5">{agent.title}</p>}
          </div>

          <p className="text-[13px] text-ink-500 mt-1">{t('meta.by', { name: agent.creator })}</p>
          <p className="text-[14px] text-ink-500 line-clamp-2 mt-2 leading-snug">{agent.description}</p>

          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {agent.tags.slice(0, 3).map((tag) => <Tag key={tag}>{tag}</Tag>)}
            {extraTags > 0 && <Tag>+{extraTags}</Tag>}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[12px] text-ink-500 font-mono">
            <span className="inline-flex items-center gap-1"><Users size={12} strokeWidth={1.7} /> {t('marketplace.stat.hires', { n: agent.duplicates.toLocaleString() })}</span>
            <span className="inline-flex items-center gap-1"><Play size={11} fill="currentColor" strokeWidth={0} /> {t('marketplace.stat.runs', { n: runs.toLocaleString() })}</span>
            <span className="inline-flex items-center gap-1"><Coins size={12} strokeWidth={1.7} /> {t('marketplace.stat.credits', { n: credits })}</span>
            {agent.reviews.length > 0 && (
              <span className="inline-flex items-center gap-1 text-ink-700"><Star size={11} fill="currentColor" strokeWidth={0} /> {agent.rating.toFixed(0)} ({agent.reviews.length})</span>
            )}
            {hired && (
              <span className="chip-active inline-flex items-center gap-1 px-2 py-0.5 rounded-pill border text-[11px] font-medium">
                <Check size={10} strokeWidth={2.4} /> {t('marketplace.hired')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
