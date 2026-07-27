import type { DirectoryStock } from './stockDirectory';

// The user's recent stock-search history — the last 10 lookups, most recent
// first. Persisted to localStorage so it survives reloads. Powers the
// "Previous search" bubbles on the Search page.
const KEY = 'alphawalk:recentSearches';
const MAX = 10;

export function loadRecentSearches(): DirectoryStock[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

// Record a search: move it to the front, drop any earlier duplicate, cap at 10.
export function addRecentSearch(stock: DirectoryStock): DirectoryStock[] {
  const prev = loadRecentSearches().filter((s) => s.symbol !== stock.symbol);
  const next = [stock, ...prev].slice(0, MAX);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage full / unavailable */ }
  return next;
}
