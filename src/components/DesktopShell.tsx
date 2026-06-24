import type { ReactNode } from 'react';
import { DesktopSidebar } from './DesktopSidebar';

/**
 * Desktop layout chrome — sidebar nav on the left, content area on the right.
 * Routes that benefit from master-detail (Chat) compose a further two-pane
 * layout inside the content area; routes that don't (Desk, Create, Profile)
 * just fill it.
 */
export function DesktopShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-[100vh] flex bg-paper text-ink-900 overflow-hidden">
      <DesktopSidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
