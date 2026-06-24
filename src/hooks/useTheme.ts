import { useEffect } from 'react';
import { useApp } from './useApp';

const LIGHT_META = '#FBF8F0'; // matches --paper in light mode
const DARK_META  = '#0a0a0d'; // matches --paper in dark mode

/**
 * Resolves the user's theme preference (system / light / dark) into an actual
 * 'light' | 'dark' value, applies it to <html data-theme="...">, and keeps the
 * iOS Safari status-bar colour in sync. Listens for OS theme changes when in
 * 'system' mode so the app flips live.
 */
export function useTheme() {
  const { persisted } = useApp();
  const mode = persisted.theme;

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const resolved = mode === 'system' ? (mql.matches ? 'dark' : 'light') : mode;
      document.documentElement.setAttribute('data-theme', resolved);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', resolved === 'dark' ? DARK_META : LIGHT_META);
    };

    apply();
    if (mode === 'system') {
      mql.addEventListener('change', apply);
      return () => mql.removeEventListener('change', apply);
    }
  }, [mode]);
}
