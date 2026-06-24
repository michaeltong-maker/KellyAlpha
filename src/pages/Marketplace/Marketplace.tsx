import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { AppHeader } from '../../components/AppHeader';
import { Avatar } from '../../components/Avatar';
import { Tag } from '../../components/Tag';
import { EditorsChoiceCard } from '../../components/EditorsChoiceCard';
import { Search, Star, Users, Sparkles, X, Check } from 'lucide-react';
import type { Tag as TagType } from '../../types';
import { useT, type MessageKey } from '../../lib/i18n';

const TAB_OPTIONS = ['Editor’s Choice', 'Popular'] as const;
type TabKey = (typeof TAB_OPTIONS)[number];
const TAB_KEYS: Record<TabKey, MessageKey> = {
  'Editor’s Choice': 'marketplace.tab.editors',
  Popular: 'marketplace.tab.popular',
};

// Popular tags shown when the search input is focused.
const POPULAR_TAGS: TagType[] = [
  'US Stocks', 'AI', 'Semiconductor', 'Macro',
  'Earnings', 'Sentiment', 'ETFs', 'Options',
  'Healthcare', 'Energy', 'Value Investor', 'Quant',
  'HK Stocks', 'Japan', 'A-Shares', 'Crypto',
];

export function Marketplace() {
  const { agents, persisted } = useApp();
  const t = useT();
  const hiredIds = new Set(Object.keys(persisted.hiredCopies ?? {}));
  const interests = persisted.interests ?? [];
  const [tab, setTab] = useState<TabKey>('Editor’s Choice');
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);

  const showChips = focused || selectedTags.length > 0;
  const hasActiveFilter = q.trim().length > 0 || selectedTags.length > 0;

  const toggleTag = (t: TagType) =>
    setSelectedTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const clearFilters = () => {
    setQ('');
    setSelectedTags([]);
  };

  const filtered = useMemo(() => {
    const base = agents.filter((a) => a.isPublic);

    // When the user has an active query or tag filter, search across ALL public
    // agents (including freshly published ones with 0 duplicates). Without filters
    // we still cap each tab to keep the list readable.
    const hasActiveQuery = q.trim().length > 0 || selectedTags.length > 0;

    const matchesQuery = (a: typeof base[number]) => {
      const qOk = q.trim().length === 0
        || a.name.toLowerCase().includes(q.toLowerCase())
        || (a.title ?? '').toLowerCase().includes(q.toLowerCase())
        || a.description.toLowerCase().includes(q.toLowerCase());
      const tagOk = selectedTags.length === 0 || selectedTags.some((t) => a.tags.includes(t));
      return qOk && tagOk;
    };

    // How well an agent matches the user's followed beats — used to float
    // relevant analysts to the top when there's no explicit query.
    const matchScore = (a: typeof base[number]) =>
      interests.length === 0 ? 0 : a.tags.filter((tg) => interests.includes(tg)).length;

    if (tab === 'Editor’s Choice') {
      const editors = base.filter((a) => a.editorsChoice);
      if (hasActiveQuery) return editors.filter(matchesQuery);
      return [...editors].sort((a, b) => matchScore(b) - matchScore(a)).slice(0, 10);
    }

    // Popular tab: rank by interest match first (when set), then popularity.
    const sorted = [...base].sort((a, b) => (matchScore(b) - matchScore(a)) || (b.duplicates - a.duplicates));
    return hasActiveQuery
      ? sorted.filter(matchesQuery)
      : sorted.slice(0, 30);
  }, [agents, tab, q, selectedTags, interests]);

  // When tags are selected, show them first in the chip row so the user can see what's active.
  const orderedChips = useMemo(() => {
    const selected = selectedTags.filter((t) => POPULAR_TAGS.includes(t));
    const rest = POPULAR_TAGS.filter((t) => !selected.includes(t));
    return [...selected, ...rest];
  }, [selectedTags]);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-paper">
      <AppHeader title={t('tab.marketplace')} subtitle={t('header.marketplace.subtitle')} />

      {/* Tabs */}
      <div className="px-4 pt-3 pb-2 w-full max-w-5xl mx-auto">
        <div className="flex border-b border-ink-200">
          {TAB_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setTab(opt)}
              className={`flex-1 text-[13px] uppercase tracking-label py-2.5 -mb-px border-b transition-colors duration-200 ease-out-expo ${tab === opt ? 'border-accent text-accent font-medium' : 'border-transparent text-ink-500'}`}
            >
              {t(TAB_KEYS[opt])}
            </button>
          ))}
        </div>
      </div>

      {/* Search + popular tag chips */}
      <div className="px-4 pb-2 w-full max-w-5xl mx-auto">
        <div className={`flex items-center gap-2 bg-card border rounded-lg px-3.5 py-2.5 transition-colors duration-200 ${focused ? 'border-ink-900' : 'border-ink-200'}`}>
          <Search size={16} className="text-ink-300" strokeWidth={1.8} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={t('search.marketplace')}
            className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-ink-300"
          />
          {hasActiveFilter && (
            <button
              onMouseDown={(e) => e.preventDefault()} /* keep input focus state */
              onClick={clearFilters}
              aria-label="Clear filters"
              className="p-0.5 text-ink-500 hover:text-ink-900 transition-colors"
            >
              <X size={14}/>
            </button>
          )}
        </div>

        {showChips && (
          <div className="mt-2.5">
            <p className="text-[11px] uppercase tracking-label text-ink-500 mb-1.5">{t('search.popularTags')}</p>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-0.5">
              {orderedChips.map((tag) => (
                <Tag
                  key={tag}
                  active={selectedTags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
       <div className="w-full max-w-5xl mx-auto">
        {interests.length > 0 && !hasActiveFilter ? (
          <div className="px-1 pt-1 pb-3 flex items-center gap-1.5 text-accent">
            <Sparkles size={13} />
            <p className="text-[11px] uppercase tracking-label">{t('marketplace.curatedForYou')}</p>
          </div>
        ) : tab === 'Editor’s Choice' ? (
          <div className="px-1 pt-1 pb-3 flex items-center gap-1.5 text-ink-500">
            <Sparkles size={13} className="text-accent"/>
            <p className="text-[11px] uppercase tracking-label">{t('marketplace.editorsBanner')}</p>
          </div>
        ) : null}
        {tab === 'Editor’s Choice' ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pb-2 items-start">
            {filtered.map((a, i) => (
              <li key={a.id}>
                <EditorsChoiceCard agent={a} rank={i + 1} hired={hiredIds.has(a.id)} />
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="text-center text-ink-500 text-[15px] py-10 sm:col-span-2 xl:col-span-3">{t('empty.noAgents')}</li>
            )}
          </ul>
        ) : (
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-2 items-start">
            {filtered.map((a, i) => {
              const rank = i + 1;
              const isTop3 = rank <= 3;
              return (
                <li key={a.id}>
                  <Link
                    to={`/marketplace/${a.id}`}
                    className="block bg-card rounded-lg border border-ink-200 px-3.5 py-3.5 transition-colors duration-200 active:bg-ink-50"
                  >
                    <div className="flex gap-3">
                      <div className="relative shrink-0">
                        <Avatar seed={a.avatarSeed} name={a.name} size={48} ink />
                        <span
                          className={`absolute -top-1 -left-1 min-w-6 h-6 px-1.5 rounded-pill font-mono text-[12px] inline-flex items-center justify-center border ${
                            isTop3
                              ? 'bg-ink-900 text-paper border-ink-900'
                              : 'bg-card text-ink-500 border-ink-200'
                          }`}
                          aria-label={`Rank ${rank}`}
                        >
                          #{rank}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display text-[18px] font-medium text-ink-900 truncate">{a.name}</h3>
                          <div className="shrink-0 flex items-center gap-1 text-ink-900">
                            <Star size={12} fill="currentColor" />
                            <span className="font-mono text-[13px]">{a.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        {a.title && (
                          <p className="text-[11px] uppercase tracking-label text-ink-500 leading-tight truncate mt-0.5">{a.title}</p>
                        )}
                        <p className="text-[15px] text-ink-500 line-clamp-2 mt-1">{a.description}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center gap-1 text-ink-500 text-[13px]">
                            <Users size={11}/> <span className="font-mono">{t('meta.hired', { n: a.duplicates.toLocaleString() })}</span>
                          </div>
                          {hiredIds.has(a.id) && (
                            <span className="chip-active inline-flex items-center gap-1 px-2 py-0.5 rounded-pill border text-[11px] font-medium shrink-0">
                              <Check size={10} strokeWidth={2.4} /> {t('marketplace.hired')}
                            </span>
                          )}
                          <div className="flex flex-wrap gap-1">
                            {a.tags.slice(0, 2).map((tag) => <Tag key={tag}>{tag}</Tag>)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="text-center text-ink-500 text-[15px] py-10 lg:col-span-2">{t('empty.noAgents')}</li>
            )}
          </ul>
        )}
       </div>
      </div>
    </div>
  );
}
