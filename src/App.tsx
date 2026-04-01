import React, { useState, useEffect, useCallback, useMemo, createContext } from 'react';
import CathedralSidebar from './components/cathedra/Sidebar';
import CathedralFooter from './components/cathedra/Footer';
import AppHeader from './components/cathedra/AppHeader';
import AppRoutes from './components/cathedra/AppRoutes';
import { AppRoute, Language } from './types';
import { UI_TRANSLATIONS } from './services/translations';
import { useAuth } from './hooks/useAuth';

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

export const LangContext = createContext<LanguageContextType>({
  lang: 'pt',
  setLang: () => {},
  t: (k) => k
});

const App: React.FC = () => {
  const [lang, setLangState] = useState<Language>(() => (localStorage.getItem('cathedra_lang') as Language) || 'pt');
  const [route, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [routeHistory, setRouteHistory] = useState<AppRoute[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('cathedra_dark') === 'true');
  const { user, profile, signOut, isPremium } = useAuth();

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  const navigateTo = useCallback((r: AppRoute) => {
    setRouteHistory(prev => [...prev, route]);
    setRoute(r);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [route]);

  const goBack = useCallback(() => {
    if (routeHistory.length > 0) {
      const prev = routeHistory[routeHistory.length - 1];
      setRouteHistory(prevHistory => prevHistory.slice(0, -1));
      setRoute(prev);
    } else {
      setRoute(AppRoute.DASHBOARD);
    }
  }, [routeHistory]);

  const handleSearch = useCallback(async (topic: string) => {
    setRoute(AppRoute.STUDY_MODE);
    console.log('Search:', topic);
  }, []);

  const t = useCallback((key: string) => {
    return UI_TRANSLATIONS[lang]?.[key] || UI_TRANSLATIONS['en']?.[key] || key;
  }, [lang]);

  const appUser = useMemo(() => {
    if (!user || !profile) return null;
    return {
      id: user.id,
      name: profile.name || user.email?.split('@')[0] || '',
      email: user.email || '',
      role: (profile.is_premium ? 'scholar' : 'pilgrim') as 'pilgrim' | 'scholar' | 'admin',
      isPremium: profile.is_premium,
      joinedAt: user.created_at,
      progress: { streak: 0, totalMinutesRead: 0, completedBooks: [], xp: 0, level: 1, badges: [] },
      stats: { versesSaved: 0, studiesPerformed: 0, daysActive: 0 },
    };
  }, [user, profile]);

  return (
    <LangContext.Provider value={{ lang, setLang: setLangState, t }}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <div className={`fixed inset-0 z-[150] lg:relative lg:block transition-all ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none lg:pointer-events-auto opacity-0 lg:opacity-100'}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
          <div className={`relative h-full w-80 transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <CathedralSidebar currentPath={route} onNavigate={navigateTo} onClose={() => setIsSidebarOpen(false)} user={appUser} />
          </div>
        </div>

        {/* Main content */}
        <main id="main-content" className="flex-1 overflow-y-auto flex flex-col relative custom-scrollbar">
          <AppHeader
            route={route}
            user={user}
            isDark={isDark}
            onToggleDark={() => setIsDark(!isDark)}
            onBack={goBack}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onNavigate={navigateTo}
            onSignOut={signOut}
          />
          <div className="flex-1 p-4 md:p-12 w-full max-w-7xl mx-auto page-enter">
            <AppRoutes
              route={route}
              appUser={appUser}
              isPremium={isPremium}
              isLoggedIn={!!user}
              onSearch={handleSearch}
              onNavigate={navigateTo}
              onLoginSuccess={() => setRoute(AppRoute.DASHBOARD)}
            />
          </div>
          <CathedralFooter onNavigate={navigateTo} />
        </main>
      </div>
    </LangContext.Provider>
  );
};

export default App;
