import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './hooks/useApp';
import { useTheme } from './hooks/useTheme';
import { useViewportHeight } from './hooks/useViewportHeight';
import { useIsDesktop } from './hooks/useIsDesktop';
import { PhoneShell } from './components/PhoneShell';
import { DesktopShell } from './components/DesktopShell';
import { BottomTabBar } from './components/BottomTabBar';
import { Onboarding } from './components/Onboarding';
import { ChatList } from './pages/Chat/ChatList';
import { AgentDetail } from './pages/Chat/AgentDetail';
import { AgentLayout } from './pages/Chat/AgentLayout';
import { ReportsList } from './pages/Chat/ReportsList';
import { ReportChat } from './pages/Chat/ReportChat';
import { MargauxThread } from './pages/Chat/MargauxThread';
import { ChatDesktopLayout } from './pages/Chat/ChatDesktopLayout';
import { ChatEmptyState } from './pages/Chat/ChatEmptyState';
import { Marketplace } from './pages/Marketplace/Marketplace';
import { MarketplaceAgent } from './pages/Marketplace/MarketplaceAgent';
import { CreateAgent } from './pages/Create/CreateAgent';
import { Watchlist } from './pages/Watchlist/Watchlist';
import { StockDetail } from './pages/Watchlist/StockDetail';
import { StockSearch } from './pages/Search/StockSearch';
import { DeskPage } from './pages/Desk/DeskPage';
import { ProfilePage } from './pages/Profile/ProfilePage';

function Root() {
  const { persisted } = useApp();
  return <Navigate to={persisted.hasOnboarded ? '/chat' : '/marketplace'} replace />;
}

/**
 * Picks the mobile shell or desktop shell at the viewport boundary. We branch
 * route trees as well as chrome — on desktop, /chat composes a master-detail
 * two-pane layout that doesn't make sense on a phone-portrait viewport.
 */
// BCP-47 lang tag per locale. Drives the :lang(zh-Hans) font override (SC-first)
// and lets the CJK fonts' OpenType `locl` feature pick region-correct glyphs.
const LANG_TAG: Record<string, string> = { en: 'en', zh: 'zh-Hant', 'zh-Hans': 'zh-Hans' };

function ShellLayout() {
  useTheme();
  useViewportHeight();
  const isDesktop = useIsDesktop();
  const { persisted } = useApp();
  useEffect(() => {
    document.documentElement.lang = LANG_TAG[persisted.language] ?? 'en';
  }, [persisted.language]);
  return (
    <>
      {isDesktop ? <DesktopApp /> : <MobileApp />}
      {!persisted.hasSeenWelcome && <Onboarding />}
    </>
  );
}

function MobileApp() {
  const location = useLocation();
  const hideTabs =
    /^\/chat\/[^/]+/.test(location.pathname) ||
    /^\/marketplace\/[^/]+/.test(location.pathname) ||
    /^\/watchlist\/[^/]+/.test(location.pathname);
  return (
    <PhoneShell>
      <div className="flex-1 min-h-0 flex flex-col">
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/chat" element={<ChatList />} />
          {/* Margaux — the front-desk concierge thread. Registered before the
              generic /chat/:id so "margaux" never resolves as an agent id. */}
          <Route path="/chat/margaux" element={<MargauxThread />} />
          {/* /chat/:id wraps the three agent sub-pages (Latest Report,
              Reports List, Profile) under a shared header + tab selector. */}
          <Route path="/chat/:id" element={<AgentLayout />}>
            {/* Report Inquiry tab is hidden — default to Report Chat. */}
            <Route index element={<Navigate to="report-chat" replace />} />
            <Route path="reports" element={<ReportsList />} />
            <Route path="report-chat" element={<ReportChat />} />
            <Route path="profile" element={<AgentDetail />} />
          </Route>
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:id" element={<MarketplaceAgent />} />
          <Route path="/create" element={<CreateAgent />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/watchlist/:symbol" element={<StockDetail />} />
          <Route path="/search" element={<StockSearch />} />
          <Route path="/desk" element={<DeskPage />} />
          <Route path="/activity" element={<DeskPage />} /> {/* legacy alias */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!hideTabs && <BottomTabBar />}
    </PhoneShell>
  );
}

function DesktopApp() {
  return (
    <DesktopShell>
      <Routes>
        <Route path="/" element={<Root />} />
        {/* Desktop chat is master-detail: ChatList stays visible in a
            fixed-width left pane while the right pane swaps between an empty
            state and the AgentLayout (which itself owns the three sub-tabs). */}
        <Route path="/chat" element={<ChatDesktopLayout />}>
          <Route index element={<ChatEmptyState />} />
          {/* Margaux concierge thread in the detail pane; before :id so the
              literal segment wins over the agent-id param. */}
          <Route path="margaux" element={<MargauxThread />} />
          <Route path=":id" element={<AgentLayout />}>
            {/* Report Inquiry tab is hidden — default to Report Chat. */}
            <Route index element={<Navigate to="report-chat" replace />} />
            <Route path="reports" element={<ReportsList />} />
            <Route path="report-chat" element={<ReportChat />} />
            <Route path="profile" element={<AgentDetail />} />
          </Route>
        </Route>
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplace/:id" element={<MarketplaceAgent />} />
        <Route path="/create" element={<CreateAgent />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/watchlist/:symbol" element={<StockDetail />} />
        <Route path="/search" element={<StockSearch />} />
        <Route path="/desk" element={<DeskPage />} />
        <Route path="/activity" element={<DeskPage />} /> {/* legacy alias */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DesktopShell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ShellLayout />
      </BrowserRouter>
    </AppProvider>
  );
}
