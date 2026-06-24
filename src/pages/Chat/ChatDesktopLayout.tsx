import { Outlet } from 'react-router-dom';
import { ChatList } from './ChatList';

/**
 * Desktop-only wrapper for the /chat tree. Keeps the ChatList visible in a
 * fixed-width left pane while the route's child (ChatRoom / AgentLayout /
 * empty state) fills the right pane. On mobile we use a flat stack of routes
 * instead and this component is never rendered.
 */
export function ChatDesktopLayout() {
  return (
    <div className="flex-1 min-h-0 flex overflow-hidden">
      <aside className="w-[380px] shrink-0 border-r border-ink-200 flex flex-col overflow-hidden">
        <ChatList />
      </aside>
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
