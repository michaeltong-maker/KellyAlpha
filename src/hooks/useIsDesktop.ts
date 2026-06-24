import { useEffect, useState } from 'react';

const QUERY = '(min-width: 1024px)';

/**
 * Returns true when the viewport is wide enough for the desktop layout.
 * Updates live on window resize so the shell swaps in/out as the user
 * drags the window between sizes. Breakpoint matches Tailwind's `lg:`.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}
