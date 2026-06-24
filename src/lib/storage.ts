import type { Agent, Result } from '../types';

const KEY = 'alphawalk:v1';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Lang = 'en' | 'zh' | 'zh-Hans';  // 'zh' = Traditional (zh-Hant), 'zh-Hans' = Simplified

// Front-desk concierge (Margaux) onboarding thread. Lives in Chat as a pinned
// pseudo-conversation that walks the user through the app one "stride" at a
// time, then stays as standing help. walkStep is the latest revealed stride
// (0 = intro only, 1–4 = that stride). Status drives the pinned row + unread.
export type MargauxStatus = 'invited' | 'walking' | 'done' | 'skipped';
export interface MargauxState {
  walkStep: number;             // 0 = intro, 1–4 = furthest stride revealed
  status: MargauxStatus;
  dismissedNudges: string[];    // contextual-nudge ids the user has seen/dismissed
  hidden: boolean;              // user removed the pinned row; restore from Profile
  lastSeenAt: string;           // ISO of the last Chat-list visit — powers the "while you were away" return nudge, independent of the Desk's lastVisitAt
}

export interface PersistedState {
  hasOnboarded: boolean;
  hasSeenWelcome: boolean;  // dismissed the first-run "commission an analyst" screen
  userCreatedAgentIds: string[];
  duplicatedAgentIds: string[];
  hiredCopies: Record<string, string>;  // marketplace agent id -> the user's hired copy id (hire is one-time)
  interests: string[];                  // beats the user follows (from onboarding) — curates the marketplace
  lastVisitAt: string;                  // ISO of the last Desk visit — powers the "filed while you were away" reward
  firstAgentCelebrated: boolean;
  firstDuplicateCelebrated: boolean;
  userAgents: Agent[];
  userResults: Result[];
  hasNewHires: boolean;     // shows a "new" dot on the Chat bottom tab; cleared on first visit
  theme: ThemeMode;         // 'system' follows OS prefers-color-scheme; 'light'/'dark' override
  language: Lang;           // UI language; chat messages also follow this
  margaux: MargauxState;    // front-desk concierge onboarding thread
}

const DEFAULT: PersistedState = {
  hasOnboarded: false,
  hasSeenWelcome: false,
  userCreatedAgentIds: [],
  duplicatedAgentIds: [],
  hiredCopies: {},
  interests: [],
  lastVisitAt: '',
  firstAgentCelebrated: false,
  firstDuplicateCelebrated: false,
  userAgents: [],
  userResults: [],
  hasNewHires: false,
  theme: 'system',
  language: 'en',
  margaux: { walkStep: 0, status: 'invited', dismissedNudges: [], hidden: false, lastSeenAt: '' },
};

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    const state: PersistedState = { ...DEFAULT, ...JSON.parse(raw) };
    // Normalise the nested concierge object so older saves (or partial writes)
    // always have every field.
    state.margaux = { ...DEFAULT.margaux, ...(state.margaux ?? {}) };
    // Migration: drop legacy manual-run reports that predate bilingual results
    // (a single-language base with no i18n override). They could otherwise show
    // Chinese content in the English UI (or vice-versa). New runs carry an
    // i18n.zh override and are kept.
    state.userResults = (state.userResults ?? []).filter(
      (r) => !(r.id?.startsWith('manual-') && !r.i18n?.zh),
    );
    return state;
  } catch {
    return { ...DEFAULT };
  }
}

export function saveState(state: PersistedState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}
