import { NavLink } from 'react-router-dom';
import { MessageCircle, Store, Eye, BookOpen, Search } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { useT, type MessageKey } from '../lib/i18n';

const TABS: { to: string; key: MessageKey; Icon: typeof MessageCircle }[] = [
  { to: '/desk',        key: 'tab.desk',        Icon: BookOpen },
  { to: '/search',      key: 'tab.search',      Icon: Search },       // "Stocks"
  { to: '/chat',        key: 'tab.chat',        Icon: MessageCircle },
  { to: '/watchlist',   key: 'tab.watchlist',   Icon: Eye },
  { to: '/marketplace', key: 'tab.marketplace', Icon: Store },
];

export function BottomTabBar() {
  const { persisted } = useApp();
  const t = useT();
  const tabs = TABS;
  return (
    <nav className="shrink-0 bg-paper border-t border-ink-200 px-1 pt-1.5 pb-[max(env(safe-area-inset-bottom),8px)]">
      <ul className="flex w-full max-w-md mx-auto">
        {tabs.map(({ to, key, Icon }) => {
          const label = t(key);
          const showNewBadge = to === '/chat' && persisted.hasNewHires;
          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-1.5 transition-colors duration-200 ${
                    isActive ? 'text-accent' : 'text-ink-300 hover:text-ink-500'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      <span className={`flex items-center justify-center w-12 h-7 rounded-pill transition-colors duration-200 ${isActive ? 'bg-accent-soft' : 'bg-transparent'}`}>
                        <Icon size={20} strokeWidth={isActive ? 2 : 1.6} />
                      </span>
                      {showNewBadge && (
                        <span
                          className="accent-gradient absolute -top-0.5 right-1 px-1 min-w-4 h-4 rounded-full text-onaccent text-[9px] font-semibold uppercase tracking-wide flex items-center justify-center"
                          aria-label="new"
                        >
                          new
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] leading-none tracking-wide">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
