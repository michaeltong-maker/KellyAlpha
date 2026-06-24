import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { Avatar } from '../../components/Avatar';
import { MargauxAvatar } from '../../components/MargauxAvatar';
import { MargauxNudge } from '../../components/MargauxNudge';
import { countdown } from '../../lib/format';
import { Search, Users, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useT, type MessageKey } from '../../lib/i18n';

const FILTERS = ['All', 'Unread', 'Favourites', 'Groups'] as const;
type FilterKey = (typeof FILTERS)[number];
const FILTER_KEYS: Record<FilterKey, MessageKey> = {
  All: 'filter.all',
  Unread: 'filter.unread',
  Favourites: 'filter.favourites',
  Groups: 'filter.groups',
};

export function ChatList() {
  const { agents, chats, results, profile, persisted, updatePersisted } = useApp();
  const t = useT();
  const { pathname } = useLocation();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<FilterKey>('All');

  // Which chat is currently open — on desktop the list stays beside the
  // conversation, so the open row must be unmistakably marked. (On mobile the
  // list is replaced by the full-screen thread, so nothing is "active" here.)
  const margauxActive = pathname.startsWith('/chat/margaux');
  const activeAgentId = (() => {
    const m = pathname.match(/^\/chat\/([^/]+)/);
    return m && m[1] !== 'margaux' ? m[1] : null;
  })();

  // Clear the "new" dot on the Chat tab once the user actually opens the list.
  useEffect(() => {
    if (persisted.hasNewHires) updatePersisted({ hasNewHires: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Margaux contextual nudges -----------------------------------------
  // One quiet, dismissible line in her voice at the top of the list, surfaced
  // at the two moments a new desk owner is most likely to want a word from the
  // front desk: just after their first hire, and on returning to fresh filings.
  const m = persisted.margaux;
  const ownedIds = persisted.userCreatedAgentIds;

  // Return window: snapshot the gap since the last chat visit BEFORE stamping
  // this one (same shape as the Desk's "while you were away"). Empty on a
  // first-ever visit, so the return line only fires on genuine returns.
  const [awaySince] = useState(() => persisted.margaux.lastSeenAt);
  useEffect(() => {
    updatePersisted({ margaux: { ...persisted.margaux, lastSeenAt: new Date().toISOString() } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  const awayOwned = useMemo(
    () =>
      awaySince
        ? results
            .filter((r) => ownedIds.includes(r.agentId) && r.at > awaySince)
            .sort((a, b) => +new Date(b.at) - +new Date(a.at))
        : [],
    [awaySince, results, ownedIds],
  );

  const firstHireName = ownedIds.length
    ? agents.find((a) => a.id === ownedIds[ownedIds.length - 1])?.name
    : undefined;

  // Priority: the first-hire welcome wins over the return line.
  const nudge = (() => {
    if (m.hidden || nudgeDismissed) return null;
    if (ownedIds.length > 0 && firstHireName && !m.dismissedNudges.includes('firstHire')) {
      return {
        kind: 'firstHire' as const,
        text: t('margaux.nudge.firstHire', { name: firstHireName }),
        to: `/chat/${ownedIds[ownedIds.length - 1]}/report-chat`,
      };
    }
    if (awayOwned.length > 0) {
      const n = awayOwned.length;
      return {
        kind: 'return' as const,
        text: t(n === 1 ? 'margaux.nudge.return.one' : 'margaux.nudge.return.many', { n }),
        to: `/chat/${awayOwned[0].agentId}/report-chat`,
      };
    }
    return null;
  })();

  const dismissNudge = () => {
    if (nudge?.kind === 'firstHire') {
      updatePersisted({
        margaux: { ...persisted.margaux, dismissedNudges: [...persisted.margaux.dismissedNudges, 'firstHire'] },
      });
    }
    setNudgeDismissed(true);
  };

  const enriched = useMemo(() => {
    // Chat is "your desk": only the analysts the user has hired or created
    // (both land in userCreatedAgentIds). Marketplace/demo analysts never show
    // here — hiring brings one in, removing takes it out.
    const ownedSet = new Set(persisted.userCreatedAgentIds);
    return agents
      .filter((a) => ownedSet.has(a.id))
      .map((a) => {
        const lastMsg = [...chats].reverse().find((m) => m.agentId === a.id);
        return { agent: a, last: lastMsg };
      })
      .filter(({ agent }) => agent.name.toLowerCase().includes(q.toLowerCase()))
      .filter(({ agent }) => {
        if (filter === 'Unread') return agent.unread > 0;
        if (filter === 'Favourites') return !!agent.isFavourite;
        if (filter === 'Groups') return false;
        return true;
      })
      // Most recent conversation first.
      .sort((x, y) => {
        const ax = x.last ? new Date(x.last.at).getTime() : 0;
        const ay = y.last ? new Date(y.last.at).getTime() : 0;
        return ay - ax;
      });
  }, [agents, chats, q, filter, persisted.userCreatedAgentIds]);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-paper">
      <header className="shrink-0 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-2 bg-paper border-b border-ink-200">
        <div className="flex items-center gap-2.5">
          <Link to="/profile" className="flex items-center gap-2.5 min-w-0 -ml-0.5 py-0.5 rounded-md active:bg-ink-50 transition-colors">
            <Avatar seed={profile.avatarSeed} name={profile.name} size={36} ring />
            <div className="min-w-0">
              <h1 className="font-display text-[22px] font-medium leading-tight text-ink-900 truncate">{profile.name}</h1>
              <p className="text-[11px] uppercase tracking-label text-ink-500 leading-tight">
                {t(enriched.length === 1 ? 'meta.agentCount.one' : 'meta.agentCount.many', { n: enriched.length })}
              </p>
            </div>
          </Link>
        </div>
      </header>
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2.5 bg-card border border-ink-200 rounded-md px-3.5 py-2.5">
          <Search size={16} className="text-ink-300" strokeWidth={1.8} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search.agents')}
            className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-ink-300"
          />
        </div>
      </div>
      <div className="px-3 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 text-[12px] px-3 py-1 rounded-pill border transition-colors duration-200 ease-out-expo ${
              filter === f
                ? 'chip-active'
                : 'bg-transparent text-ink-500 border-ink-200 hover:border-ink-300 hover:text-ink-700'
            }`}
          >
            {t(FILTER_KEYS[f])}
          </button>
        ))}
      </div>
      <ul className="flex-1 min-h-0 overflow-y-auto pb-3 w-full max-w-3xl mx-auto">
        {/* Margaux contextual nudge — first-hire welcome or a return greeting,
            in her voice. Tapping opens the relevant report; the × dismisses. */}
        {nudge && filter !== 'Groups' && (
          <li className="px-3 pt-3">
            <MargauxNudge
              text={nudge.text}
              to={nudge.to}
              onClick={dismissNudge}
              onDismiss={dismissNudge}
              dismissLabel={t('margaux.nudge.dismiss')}
            />
          </li>
        )}
        {/* Margaux — the front-desk concierge. Pinned above the analysts and
            set apart by FORM, not fill: a rounded "pinned" card (agent rows are
            flat, hairline-separated) carrying the house stride crest and a
            "Front Desk" beat. At rest she sits on a neutral card surface with a
            faint accent hairline — the accent-soft fill + left bar are reserved
            for the open/selected state, so she never *looks* selected when an
            agent chat is the one actually open. */}
        {filter !== 'Groups' && !persisted.margaux.hidden && (
          <li className="px-3 pt-3 pb-2">
            <Link
              to="/chat/margaux"
              aria-current={margauxActive ? 'page' : undefined}
              className={`relative flex items-center gap-3 rounded-lg border px-3.5 py-3 transition-colors overflow-hidden ${
                margauxActive
                  ? 'border-accent/60 bg-accent-soft'
                  : 'border-accent/25 bg-card hover:border-accent/40'
              }`}
            >
              {margauxActive && <span className="absolute left-0 top-0 bottom-0 w-[3px] accent-gradient" />}
              <span className="relative shrink-0">
                <MargauxAvatar size={44} ring />
                {persisted.margaux.status === 'invited' && !margauxActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-pill accent-gradient ring-2 ring-paper" />
                )}
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={`font-display text-[18px] truncate ${margauxActive ? 'font-semibold text-ink-900' : 'font-medium text-ink-900'}`}>{t('margaux.name')}</span>
                  <span className="text-[10px] uppercase tracking-label text-accent shrink-0">{t('margaux.role')}</span>
                </span>
                <span className="block text-[13px] text-ink-500 truncate mt-0.5">
                  {t(`margaux.listPreview.${persisted.margaux.status}` as MessageKey)}
                </span>
              </span>
            </Link>
          </li>
        )}
        {enriched.map(({ agent, last }) => {
          const isActive = agent.id === activeAgentId;
          return (
          <li key={agent.id}>
            <Link
              to={`/chat/${agent.id}`}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex items-center gap-3 px-4 py-4 border-b border-ink-200 transition-colors ${
                isActive ? 'bg-accent-soft' : 'active:bg-ink-50'
              }`}
            >
              {isActive && <span className="absolute left-0 top-0 bottom-0 w-[3px] accent-gradient" />}
              <div className="relative">
                <Avatar seed={agent.avatarSeed} name={agent.name} size={48} ink />
                {agent.unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-pill accent-gradient text-onaccent font-mono text-[11px] font-medium flex items-center justify-center">
                    {agent.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-[18px] font-medium text-ink-900 truncate">{agent.name}</h3>
                  <span className="font-mono text-[11px] text-ink-300 shrink-0">{t('meta.nextIn', { time: countdown(agent.nextRunAt) })}</span>
                </div>
                {agent.title && (
                  <p className="text-[11px] uppercase tracking-label text-ink-500 truncate leading-tight mt-0.5">{agent.title}</p>
                )}
                <p className="text-[14px] text-ink-500 truncate mt-0.5">
                  {last ? last.text : agent.description}
                </p>
              </div>
            </Link>
          </li>
          );
        })}
        {enriched.length === 0 && (
          <li className="px-6 py-16 text-center">
            {filter === 'Groups' ? (
              <>
                <Users size={28} className="mx-auto text-ink-300 mb-2" strokeWidth={1.6} />
                <p className="font-display text-[18px] font-medium text-ink-900">{t('empty.groupsTitle')}</p>
                <p className="text-[15px] text-ink-500 mt-1">{t('empty.groupsBody')}</p>
              </>
            ) : !persisted.margaux.hidden ? (
              /* Empty desk, voiced by the front desk — a warm route back to the
                 floor rather than a dead-end. */
              <div className="flex flex-col items-center">
                <MargauxAvatar size={48} ring />
                <p className="font-display text-[18px] text-ink-900 leading-snug mt-3 max-w-[26ch]">{t('margaux.nudge.emptyDesk')}</p>
                <Link to="/marketplace" className="btn-accent px-5 py-2.5 text-[14px] mt-4 inline-block">
                  {t('margaux.nudge.emptyDesk.cta')} →
                </Link>
              </div>
            ) : (
              <p className="text-[15px] text-ink-500">{t('empty.noAgents')}</p>
            )}
          </li>
        )}
        {filter !== 'Groups' && (
          <li className="px-4 pt-3">
            <Link
              to="/marketplace"
              className="flex items-center gap-3 w-full rounded-lg border border-dashed border-ink-300 bg-ink-100 px-4 py-4 active:bg-ink-200 transition-colors"
            >
              <span className="w-11 h-11 rounded-pill bg-card border border-ink-200 flex items-center justify-center shrink-0">
                <Plus size={22} className="text-ink-900" strokeWidth={1.6} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-display text-[18px] font-medium text-ink-900">{t('cta.hireAgent.title')}</span>
                <span className="block text-[14px] text-ink-500">{t('cta.hireAgent.body')}</span>
              </span>
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
