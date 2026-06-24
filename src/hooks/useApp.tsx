import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Agent, ActivityItem, ChatMessage, Profile, Result, WatchStock } from '../types';
import { SEED_AGENTS } from '../data/seedAgents';
import { SEED_ACTIVITY } from '../data/seedActivity';
import { SEED_CHATS } from '../data/seedChats';
import { SEED_WATCHLIST } from '../data/seedWatchlist';
import { SEED_RESULTS } from '../data/seedResults';
import { loadState, saveState, type PersistedState } from '../lib/storage';
import { localizeAgent, localizeResult } from '../lib/localize';

interface AppCtx {
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  chats: ChatMessage[];
  setChats: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  activity: ActivityItem[];                                  // kept for compat; unused
  setActivity: React.Dispatch<React.SetStateAction<ActivityItem[]>>;
  results: Result[];
  setResults: React.Dispatch<React.SetStateAction<Result[]>>;
  watchlist: WatchStock[];
  setWatchlist: React.Dispatch<React.SetStateAction<WatchStock[]>>;
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  persisted: PersistedState;
  updatePersisted: (patch: Partial<PersistedState>) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [persisted, setPersisted] = useState<PersistedState>(() => loadState());
  const [agents, setAgents] = useState<Agent[]>(() => {
    const userAgents = persisted.userAgents ?? [];
    return [...userAgents, ...SEED_AGENTS];
  });
  const [chats, setChats] = useState<ChatMessage[]>(SEED_CHATS);
  const [activity, setActivity] = useState<ActivityItem[]>(SEED_ACTIVITY);
  const [results, setResults] = useState<Result[]>(() => {
    const userResults = persisted.userResults ?? [];
    return [...userResults, ...SEED_RESULTS];
  });
  const [watchlist, setWatchlist] = useState<WatchStock[]>(SEED_WATCHLIST);
  const [profile, setProfile] = useState<Profile>({ name: 'You', email: 'you@alphawalk.app', avatarSeed: 'me-default' });

  useEffect(() => { saveState(persisted); }, [persisted]);

  // Persist user-created agents whenever the agents list changes.
  useEffect(() => {
    const userIdSet = new Set(persisted.userCreatedAgentIds);
    const userAgents = agents.filter((a) => userIdSet.has(a.id));
    setPersisted((s) => {
      const sameLength = s.userAgents.length === userAgents.length;
      const same = sameLength && s.userAgents.every((a, i) => a.id === userAgents[i].id);
      return same ? s : { ...s, userAgents };
    });
  }, [agents, persisted.userCreatedAgentIds]);

  // Persist user-generated results (anything not in the seed set).
  useEffect(() => {
    const seedIds = new Set(SEED_RESULTS.map((r) => r.id));
    const userResults = results.filter((r) => !seedIds.has(r.id));
    setPersisted((s) => {
      const sameLength = s.userResults.length === userResults.length;
      const same = sameLength && s.userResults.every((r, i) => r.id === userResults[i].id);
      return same ? s : { ...s, userResults };
    });
  }, [results]);

  const updatePersisted = (patch: Partial<PersistedState>) =>
    setPersisted((s) => ({ ...s, ...patch }));

  // Localize demo content to the active language. Base fields are English;
  // an i18n.zh override supplies Traditional Chinese. This is a read-time
  // transform — the raw state (and its setters) stay English-based, so
  // mutations via the functional updater never corrupt the base content.
  const lang: 'en' | 'zh' | 'zh-Hans' =
    persisted.language === 'zh' || persisted.language === 'zh-Hans' ? persisted.language : 'en';
  const localizedAgents = useMemo(() => agents.map((a) => localizeAgent(a, lang)), [agents, lang]);
  const localizedResults = useMemo(() => results.map((r) => localizeResult(r, lang)), [results, lang]);

  const value = useMemo(
    () => ({ agents: localizedAgents, setAgents, chats, setChats, activity, setActivity, results: localizedResults, setResults, watchlist, setWatchlist, profile, setProfile, persisted, updatePersisted }),
    [localizedAgents, chats, activity, localizedResults, watchlist, profile, persisted]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be inside AppProvider');
  return v;
}
