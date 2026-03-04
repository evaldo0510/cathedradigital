import React, { useState, useEffect, useCallback, useMemo, createContext } from 'react';
import CathedralSidebar from './components/cathedra/Sidebar';
import CathedralFooter from './components/cathedra/Footer';
import Dashboard from './components/cathedra/Dashboard';
import Bible from './components/cathedra/Bible';
import Catechism from './components/cathedra/Catechism';
import StudyMode from './components/cathedra/StudyMode';
import { AppRoute, User, Language } from './types';
import { Icons, Logo } from './constants';
import { UI_TRANSLATIONS } from './services/translations';

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
    <div className="w-20 h-20 rounded-3xl bg-[#1f2937] flex items-center justify-center">
      <Icons.Book className="w-10 h-10 text-[#d4af37]" />
    </div>
    <h1 className="text-4xl md:text-6xl font-serif font-bold text-[#1f2937]">{title}</h1>
    <p className="text-[#6b7280] font-serif italic text-lg max-w-lg">{description}</p>
    <div className="px-4 py-2 border border-[#e5e7eb] rounded-full text-[10px] font-black uppercase tracking-widest text-[#6b7280]">Em breve</div>
  </div>
);

const App: React.FC = () => {
  const [lang, setLangState] = useState<Language>(() => (localStorage.getItem('cathedra_lang') as Language) || 'pt');
  const [route, setRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [routeHistory, setRouteHistory] = useState<AppRoute[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user] = useState<User | null>(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('cathedra_dark') === 'true');

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

  const content = useMemo(() => {
    switch (route) {
      case AppRoute.DASHBOARD:
        return <Dashboard onSearch={handleSearch} user={user} onNavigate={navigateTo} />;
      case AppRoute.BIBLE:
        return <Bible />;
      case AppRoute.CATECHISM:
        return <Catechism />;
      case AppRoute.SAINTS:
        return <PlaceholderPage title="Sanctorum" description="Vidas dos Santos e suas obras para a Igreja." />;
      case AppRoute.MAGISTERIUM:
        return <PlaceholderPage title="Magisterium" description="Acesso total a Encíclicas, Concílios e Documentos da Santa Sé." />;
      case AppRoute.STUDY_MODE:
        return <StudyMode />;
      case AppRoute.DAILY_LITURGY:
        return <PlaceholderPage title="Liturgia Diária" description="Acompanhe as leituras do dia e o calendário litúrgico." />;
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
        return <PlaceholderPage title="Santo Rosário" description="Reze o Rosário com meditações dos mistérios." />;
      case AppRoute.VIA_CRUCIS:
        return <PlaceholderPage title="Via Crucis" description="As 14 Estações da Via Sacra." />;
      case AppRoute.ABOUT:
        return <PlaceholderPage title="Sobre" description="Manifesto e missão da Cathedra Digital." />;
      default:
        return <Dashboard onSearch={handleSearch} user={user} onNavigate={navigateTo} />;
    }
  }, [route, user, handleSearch, navigateTo]);

  return (
    <LangContext.Provider value={{ lang, setLang: setLangState, t }}>
      <div className="flex h-screen overflow-hidden bg-[#fdfcf8] dark:bg-[#0c0a09]">

        {/* Sidebar overlay for mobile */}
        <div className={`fixed inset-0 z-[150] lg:relative lg:block transition-all ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none lg:pointer-events-auto opacity-0 lg:opacity-100'}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
          <div className={`relative h-full w-80 transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <CathedralSidebar currentPath={route} onNavigate={navigateTo} onClose={() => setIsSidebarOpen(false)} user={user} />
          </div>
        </div>

        {/* Main content */}
        <main id="main-content" className="flex-1 overflow-y-auto flex flex-col relative custom-scrollbar">
          <header className="p-3 md:p-4 border-b border-stone-100 dark:border-white/5 bg-white/90 dark:bg-stone-900/95 backdrop-blur-2xl flex items-center justify-between sticky top-0 z-[140]">
            <div className="flex items-center gap-2">
              {route !== AppRoute.DASHBOARD ? (
                <button onClick={goBack} className="p-3 bg-stone-900 text-[#d4af37] rounded-2xl flex items-center gap-2 pr-5 shadow-xl">
                  <Icons.ArrowDown className="w-5 h-5 rotate-90" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
                </button>
              ) : (
                <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 text-stone-900 dark:text-[#d4af37]">
                  <Icons.Menu className="w-6 h-6" />
                </button>
              )}
              {route === AppRoute.DASHBOARD && (
                <div className="flex items-center gap-3 ml-2 cursor-pointer" onClick={() => navigateTo(AppRoute.DASHBOARD)}>
                  <Logo className="w-9 h-9" />
                  <span className="text-sm font-serif font-black uppercase tracking-[0.2em] text-stone-900 dark:text-[#d4af37]">Cathedra</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsDark(!isDark)} className="p-3 bg-stone-50 dark:bg-stone-800/50 text-stone-400 hover:text-[#d4af37] rounded-2xl border border-stone-100 dark:border-stone-700">
                {isDark ? <Icons.Star className="w-5 h-5 text-[#d4af37] fill-current" /> : <Icons.History className="w-5 h-5" />}
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
