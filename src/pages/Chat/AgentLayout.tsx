import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useApp } from '../../hooks/useApp';
import { AppHeader } from '../../components/AppHeader';
import { Avatar } from '../../components/Avatar';
import { Star } from 'lucide-react';
import { useT, type MessageKey } from '../../lib/i18n';

// The three visible sub-pages under /chat/:id. Report Inquiry is hidden from
// the selector — its index route now redirects to Report Chat (see App.tsx).
const TABS: { key: MessageKey; path: 'reports' | 'report-chat' | 'profile' }[] = [
  { key: 'agent.subpage.reportChat', path: 'report-chat' },
  { key: 'agent.subpage.reports',    path: 'reports' },
  { key: 'agent.subpage.profile',    path: 'profile' },
];

/**
 * Wraps the three agent sub-pages with a shared header + tab selector. Renders
 * the active sub-page via React Router's <Outlet />. Sliding into this layout
 * (from the chat list) plays the slide-in animation once; switching tabs
 * within the layout does not re-trigger it.
 */
export function AgentLayout() {
  const { id = '' } = useParams();
  const location = useLocation();
  const { agents, setAgents } = useApp();
  const t = useT();
  const agent = useMemo(() => agents.find((a) => a.id === id), [agents, id]);

  if (!agent) {
    return (
      <div className="flex-1 flex flex-col bg-card">
        <AppHeader back title="Agent not found" />
        <div className="p-4 text-ink-500">This agent no longer exists.</div>
      </div>
    );
  }

  const toggleFav = () =>
    setAgents((list) => list.map((a) => (a.id === agent.id ? { ...a, isFavourite: !a.isFavourite } : a)));

  // Active sub-tab — derived from the path tail. Empty string => Latest Report.
  const tail = location.pathname.replace(`/chat/${id}`, '').replace(/^\/?/, '');
  const activePath = (TABS.find((tab) => tab.path === tail)?.path) ?? '';

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-paper animate-slide-in-right will-change-transform">
      <AppHeader
        back
        title={agent.name}
        subtitle={agent.title ?? `${agent.personality} · ${agent.tone}`}
        left={<Avatar seed={agent.avatarSeed} name={agent.name} size={36} ring ink />}
        right={
          <button onClick={toggleFav} aria-label="favourite" className="shrink-0 p-1">
            <Star
              size={20}
              strokeWidth={1.6}
              className={agent.isFavourite ? 'text-accent' : 'text-ink-300'}
              fill={agent.isFavourite ? 'currentColor' : 'none'}
            />
          </button>
        }
      />

      {/* Three-way section selector. Mirrors the Marketplace tab style so the
          pattern feels consistent across the app. */}
      <div className="shrink-0 px-3 pt-2 pb-1 bg-paper">
        <div className="flex bg-ink-100 rounded-md p-1">
          {TABS.map(({ key, path }) => {
            const to = path ? `/chat/${id}/${path}` : `/chat/${id}`;
            const isActive = activePath === path;
            return (
              <Link
                key={path || 'latest'}
                to={to}
                replace
                className={`flex-1 text-[14px] py-1.5 rounded-sm font-medium text-center transition-colors duration-200 ease-out-expo ${
                  isActive ? 'chip-active' : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                {t(key)}
              </Link>
            );
          })}
        </div>
      </div>

      <Outlet />
    </div>
  );
}
