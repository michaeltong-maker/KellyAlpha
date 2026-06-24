import { NavLink, Link } from 'react-router-dom';
import { MessageCircle, Store, PlusSquare, Eye, BookOpen, Search } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { Avatar } from './Avatar';
import { useT, type MessageKey } from '../lib/i18n';

const TABS: { to: string; key: MessageKey; Icon: typeof MessageCircle }[] = [
  { to: '/desk',        key: 'tab.desk',        Icon: BookOpen },
  { to: '/chat',        key: 'tab.chat',        Icon: MessageCircle },
  { to: '/marketplace', key: 'tab.marketplace', Icon: Store },
  { to: '/watchlist',   key: 'tab.watchlist',   Icon: Eye },
  { to: '/search',      key: 'tab.search',      Icon: Search },
  { to: '/create',      key: 'tab.create',      Icon: PlusSquare },
];

/**
 * Vertical primary nav for the desktop layout. Replaces the bottom tab bar.
 * Bottom of the sidebar holds the user profile chip — clicking it opens the
 * full Profile page in the content area.
 */
export function DesktopSidebar() {
  const { persisted, profile } = useApp();
  const t = useT();
  return (
    <aside className="w-[224px] shrink-0 flex flex-col border-r border-ink-200 bg-paper">
      {/* Brand */}
      <div className="px-5 pt-6 pb-6 flex items-center gap-2.5">
        <svg viewBox="0 0 100 100" width="22" height="22" className="text-ink-900" aria-hidden="true">
          <rect x="6" y="6" width="88" height="88" fill="none" stroke="currentColor" strokeWidth="6" />
          <line x1="28" y1="70" x2="28" y2="56" strokeWidth="6" style={{ stroke: 'oklch(var(--accent))' }} />
          <line x1="50" y1="70" x2="50" y2="44" strokeWidth="6" style={{ stroke: 'oklch(var(--accent))' }} />
          <line x1="72" y1="70" x2="72" y2="30" strokeWidth="6" style={{ stroke: 'oklch(var(--accent))' }} />
          <line x1="22" y1="76" x2="78" y2="76" stroke="currentColor" strokeWidth="3" />
        </svg>
        <span className="text-[13px] font-semibold uppercase tracking-logo text-ink-900">Alphawalk</span>
      </div>

      {/* Primary nav — Create is revealed only after the user has engaged. */}
      <nav className="flex-1 px-3 overflow-y-auto">
        {TABS.filter((tb) => tb.to !== '/create' || persisted.hasOnboarded).map(({ to, key, Icon }) => {
          const showNewBadge = to === '/chat' && persisted.hasNewHires;
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-colors duration-200 ${
                  isActive
                    ? 'bg-accent-soft text-accent font-medium'
                    : 'text-ink-500 hover:text-ink-900 hover:bg-ink-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.6} />
                  <span className="text-[13px] tracking-wide">{t(key)}</span>
                  {showNewBadge && (
                    <span
                      className="accent-gradient ml-auto px-1 min-w-4 h-4 rounded-full text-onaccent text-[9px] font-semibold uppercase tracking-wide flex items-center justify-center"
                      aria-label="new"
                    >
                      new
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Profile chip */}
      <Link
        to="/profile"
        className="flex items-center gap-2.5 px-3 py-3 mx-3 mb-4 rounded-md hover:bg-ink-100 border border-ink-200 transition-colors"
      >
        <Avatar seed={profile.avatarSeed} name={profile.name} size={32} />
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-900 truncate">{profile.name}</p>
          <p className="text-[11px] text-ink-500 truncate">{profile.email}</p>
        </div>
      </Link>
    </aside>
  );
}
