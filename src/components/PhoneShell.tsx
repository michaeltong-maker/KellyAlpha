import type { ReactNode } from 'react';

export function PhoneShell({ children }: { children: ReactNode }) {
  // Mobile shell — used for every viewport below the desktop breakpoint (1024px).
  // Height comes from the --app-vh CSS variable (defaults to 100svh; rebound to
  // the VisualViewport height in App.tsx whenever the on-screen keyboard opens
  // on iOS).
  //
  // Fully fluid: the shell fills the available width at every size, so on a
  // phone it's edge-to-edge and on a tablet it expands to use the whole screen
  // instead of floating a fixed-width column in empty paper. Each screen keeps
  // its own readable max-width (headers, lists, the bottom tab bar) so content
  // never sprawls into unreadable line lengths even as the shell grows.
  return (
    <div className="w-full h-[var(--app-vh,100svh)] flex items-stretch justify-center bg-paper">
      <div className="relative bg-paper overflow-hidden flex flex-col w-full h-full">
        {children}
      </div>
    </div>
  );
}
