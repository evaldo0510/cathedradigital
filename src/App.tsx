import React, { useState, useEffect, useCallback, useMemo, createContext } from 'react';
import CathedralSidebar from './components/cathedra/Sidebar';
import CathedralFooter from './components/cathedra/Footer';
import Dashboard from './components/cathedra/Dashboard';
import Bible from './components/cathedra/Bible';
import Catechism from './components/cathedra/Catechism';
import StudyMode from './components/cathedra/StudyMode';
import Saints from './components/cathedra/Saints';
import Magisterium from './components/cathedra/Magisterium';
import DailyLiturgy from './components/cathedra/DailyLiturgy';
import ViaCrucis from './components/cathedra/ViaCrucis';
import Rosary from './components/cathedra/Rosary';
import Auth from './components/cathedra/Auth';
import { AppRoute, Language } from './types';
import { Icons, Logo } from './constants';
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

// Placeholder pages for routes that don't have full implementations yet
const PlaceholderPage: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 page-enter">
    <div className="w-20 h-20 rounded-3xl bg-foreground flex items-center justify-center">
      <Icons.Book className="w-10 h-10 text-primary" />
    </div>
    <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground">{title}</h1>
    <p className="text-muted-foreground font-serif italic text-lg max-w-lg">{description}</p>
    <div className="px-4 py-2 border border-border rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground">Em breve</div>
  </div>
);

// PRO gate component
const ProGate: React.FC<{ isPremium: boolean; isLoggedIn: boolean; onLogin: () => void; children: React.ReactNode }> = ({ isPremium, isLoggedIn, onLogin, children }) => {
  if (isPremium) return <>{children}</>;
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 page-enter">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
        <Icons.Star className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground">Recurso PRO</h1>
      <p className="text-muted-foreground font-serif italic text-lg max-w-lg">
        Este recurso requer uma assinatura PRO. {!isLoggedIn && 'Faça login primeiro.'}
      </p>
      {!isLoggedIn ? (
        <button onClick={onLogin} className="px-8 py-4 bg-foreground text-background rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-primary hover:text-primary-foreground transition-all">
          Fazer Login
        </button>
      ) : (
        <div className="px-6 py-3 border border-primary rounded-2xl text-xs font-bold text-primary">
          Em breve — Assinatura PRO
        </div>
      )}
    </div>
  );
};

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

  const content = useMemo(() => {
    switch (route) {
      case AppRoute.DASHBOARD:
        return <Dashboard onSearch={handleSearch} user={appUser} onNavigate={navigateTo} />;
      case AppRoute.BIBLE:
        return <Bible />;
      case AppRoute.CATECHISM:
        return <Catechism />;
      case AppRoute.SAINTS:
        return <Saints />;
      case AppRoute.MAGISTERIUM:
        return <Magisterium />;
      case AppRoute.DAILY_LITURGY:
        return <DailyLiturgy />;
      case AppRoute.STUDY_MODE:
        return (
          <ProGate isPremium={isPremium} isLoggedIn={!!user} onLogin={() => navigateTo(AppRoute.LOGIN)}>
            <StudyMode />
          </ProGate>
        );
      case AppRoute.LOGIN:
        return <Auth onSuccess={() => setRoute(AppRoute.DASHBOARD)} />;
      case AppRoute.AQUINAS_OPERA:
        return <PlaceholderPage title="Suma Teológica" description="As obras completas de São Tomás de Aquino." />;
      case AppRoute.CERTAMEN:
        return <PlaceholderPage title="Certamen" description="Teste seus conhecimentos teológicos com quizzes interativos." />;
      case AppRoute.MISSAL:
        return <PlaceholderPage title="Missal Romano" description="O Ordinário da Missa e orações litúrgicas." />;
      case AppRoute.FAVORITES:
        return <PlaceholderPage title="Favoritos" description="Seus versículos, orações e estudos salvos." />;
      case AppRoute.TRILHAS:
        return <PlaceholderPage title="Trilhas de Estudo" description="Percursos formativos organizados por tema." />;
      case AppRoute.ROSARY:
        return <Rosary />;
      case AppRoute.VIA_CRUCIS:
        return <ViaCrucis />;
      case AppRoute.ABOUT:
        return <PlaceholderPage title="Sobre" description="Manifesto e missão da Cathedra Digital." />;
      default:
        return <Dashboard onSearch={handleSearch} user={appUser} onNavigate={navigateTo} />;
    }
  }, [route, appUser, handleSearch, navigateTo, isPremium, user]);

  return (
    <LangContext.Provider value={{ lang, setLang: setLangState, t }}>
      <div className="flex h-screen overflow-hidden bg-background">

        {/* Sidebar overlay for mobile */}
        <div className={`fixed inset-0 z-[150] lg:relative lg:block transition-all ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none lg:pointer-events-auto opacity-0 lg:opacity-100'}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
          <div className={`relative h-full w-80 transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <CathedralSidebar currentPath={route} onNavigate={navigateTo} onClose={() => setIsSidebarOpen(false)} user={appUser} />
          </div>
        </div>

        {/* Main content */}
        <main id="main-content" className="flex-1 overflow-y-auto flex flex-col relative custom-scrollbar">
          <header className="p-3 md:p-4 border-b border-border bg-card/90 backdrop-blur-2xl flex items-center justify-between sticky top-0 z-[140]">
            <div className="flex items-center gap-2">
              {route !== AppRoute.DASHBOARD ? (
                <button onClick={goBack} className="p-3 bg-foreground text-primary rounded-2xl flex items-center gap-2 pr-5 shadow-xl">
                  <Icons.ArrowDown className="w-5 h-5 rotate-90" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
                </button>
              ) : (
                <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 text-foreground">
                  <Icons.Menu className="w-6 h-6" />
                </button>
              )}
              {route === AppRoute.DASHBOARD && (
                <div className="flex items-center gap-3 ml-2 cursor-pointer" onClick={() => navigateTo(AppRoute.DASHBOARD)}>
                  <Logo className="w-9 h-9" />
                  <span className="text-sm font-serif font-black uppercase tracking-[0.2em] text-foreground">Cathedra</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <button onClick={signOut} className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">
                  Sair
                </button>
              )}
              <button onClick={() => setIsDark(!isDark)} className="p-3 bg-muted text-muted-foreground hover:text-primary rounded-2xl border border-border">
                {isDark ? <Icons.Star className="w-5 h-5 text-primary fill-current" /> : <Icons.History className="w-5 h-5" />}
              </button>
            </div>
          </header>

          <div className="flex-1 p-4 md:p-12 w-full max-w-7xl mx-auto page-enter">
            {content}
          </div>

          <CathedralFooter onNavigate={navigateTo} />
        </main>
      </div>
    </LangContext.Provider>
  );
};

export default App;
