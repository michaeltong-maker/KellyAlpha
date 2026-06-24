import { useEffect } from 'react';

/**
 * Syncs the `--app-vh` CSS variable with the VisualViewport API on every
 * keyboard show/hide, orientation change, and viewport resize.
 *
 * Why: iOS Safari does NOT shrink the layout viewport when the on-screen
 * keyboard opens. With our 100svh shell + overflow-hidden, that means any
 * UI pinned to the bottom (chat input, "Hire" button) slides under the
 * keyboard with no way to scroll it back. Binding the shell height to the
 * VisualViewport height fixes this — the shell shrinks to the visible area
 * and the input stays at the new bottom.
 *
 * Fallback: when VisualViewport is unavailable (older browsers, SSR) the CSS
 * default of 100svh remains in effect.
 */
export function useViewportHeight() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const sync = () => {
      document.documentElement.style.setProperty('--app-vh', `${vv.height}px`);
    };

    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);

    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
    };
  }, []);
}
