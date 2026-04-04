import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import ScrollToTop from './components/ScrollToTop';
import CathedralSidebar from './components/cathedra/Sidebar';
import CathedralFooter from './components/cathedra/Footer';
import BottomNav from './components/cathedra/BottomNav';
import AppHeader from './components/cathedra/AppHeader';
import { AppRoute, Language } from './types';
import { UI_TRANSLATIONS } from './services/translations';
import { useAuth } from './hooks/useAuth';
import { LangContext } from './contexts/LangContext';
import { supabase } from '@/integrations/supabase/client';
import CommandCenter from './components/cathedra/CommandCenter';
import OfflineIndicator from './components/cathedra/OfflineIndicator';
import Dashboard from './components/cathedra/Dashboard';

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const AppLayout: React.FC = () => {
  const [lang, setLangState] = useState<Language>(() => (localStorage.getItem('cathedra_lang') as Language) || 'pt');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('cathedra_dark') === 'true');
  const { user, profile, signOut, isPremium, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);
  
  useEffect(() => {
    const trackVisit = async () => {
      try {
        await supabase
          .from('app_metrics')
          .insert([{ metric_type: 'visit', metadata: { path: location.pathname, user_agent: navigator.userAgent } }]);
      } catch (err) {
        console.error('Failed to track visit:', err);
      }
    };
    trackVisit();
  }, [location.pathname]);

  const t = useCallback((key: string) => {
    return UI_TRANSLATIONS[lang]?.[key] || UI_TRANSLATIONS['en']?.[key] || key;
  }, [lang]);

  const appUser = useMemo(() => {
    if (!user || !profile) return null;
    return {
      id: user.id,
      name: profile.name || user.email?.split('@')[0] || '',
      email: user.email || '',
      role: (profile.role || (profile.is_premium ? 'scholar' : 'pilgrim')) as 'pilgrim' | 'scholar' | 'admin',
      isPremium: !!profile.is_premium,
      joinedAt: user.created_at,
      progress: { streak: 0, totalMinutesRead: 0, completedBooks: [], xp: 0, level: 1, badges: [] },
      stats: { versesSaved: 0, studiesPerformed: 0, daysActive: 0 },
    };
  }, [user, profile]);

  return (
    <LangContext.Provider value={{ lang, setLang: setLangState, t }}>
      <ScrollToTop />
      <CommandCenter />
      <OfflineIndicator />
      <div className="flex h-screen overflow-hidden bg-background">
        <div className={`fixed inset-0 z-[150] lg:relative lg:block transition-all ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none lg:pointer-events-auto opacity-0 lg:opacity-100'}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
          <div className={`relative h-full w-80 transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <CathedralSidebar onClose={() => setIsSidebarOpen(false)} user={appUser} />
          </div>
        </div>

        <main id="main-content" className="flex-1 overflow-y-auto flex flex-col relative custom-scrollbar overscroll-contain touch-pan-y scroll-smooth">
          <AppHeader
            user={user}
            isDark={isDark}
            onToggleDark={() => setIsDark(!isDark)}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onSignOut={signOut}
          />
          <div className="flex-1 p-3 sm:p-4 md:p-8 lg:p-10 pb-32 w-full max-w-6xl mx-auto page-enter">
            {loading && !user ? <LoadingFallback /> : (
              <Routes location={location}>
                <Route path={AppRoute.DASHBOARD} element={<Dashboard user={appUser} />} />
                <Route path="*" element={<Dashboard user={appUser} />} />
              </Routes>
            )}
          </div>
          <CathedralFooter />
          <BottomNav onOpenSidebar={() => setIsSidebarOpen(true)} />
        </main>
      </div>
    </LangContext.Provider>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AppLayout />
  </BrowserRouter>
);

export default App;