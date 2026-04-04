import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PageTransition from './components/PageTransition';
import ScrollToTop from './components/ScrollToTop';
import CathedralSidebar from './components/cathedra/Sidebar';
import CathedralFooter from './components/cathedra/Footer';
import BottomNav from './components/cathedra/BottomNav';
import AppHeader from './components/cathedra/AppHeader';
import PlaceholderPage from './components/cathedra/PlaceholderPage';
import CheckoutPage from './components/cathedra/CheckoutPage';
import DiagnosticsPage from './components/cathedra/DiagnosticsPage';
import ProGate from './components/cathedra/ProGate';
import Index from './pages/Index';
import { AppRoute, Language } from './types';
import { UI_TRANSLATIONS } from './services/translations';
import { useAuth } from './hooks/useAuth';
import { LangContext } from './contexts/LangContext';
import { supabase } from '@/integrations/supabase/client';
import CommandCenter from './components/cathedra/CommandCenter';
import OfflineIndicator from './components/cathedra/OfflineIndicator';
import AppErrorBoundary from './components/cathedra/AppErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Lazy-loaded route components
const Dashboard = lazy(() => import('./components/cathedra/Dashboard'));
const Bible = lazy(() => import('./components/cathedra/Bible'));
const Catechism = lazy(() => import('./components/cathedra/Catechism'));
const StudyMode = lazy(() => import('./components/cathedra/StudyMode'));
const Saints = lazy(() => import('./components/cathedra/Saints'));
const Magisterium = lazy(() => import('./components/cathedra/Magisterium'));
const DailyLiturgy = lazy(() => import('./components/cathedra/DailyLiturgy'));
const ViaCrucis = lazy(() => import('./components/cathedra/ViaCrucis'));
const Rosary = lazy(() => import('./components/cathedra/Rosary'));
const PrayerPage = lazy(() => import('./components/cathedra/PrayerPage'));
const Auth = lazy(() => import('./components/cathedra/Auth'));
const AquinasOpera = lazy(() => import('./components/cathedra/AquinasOpera'));
const Certamen = lazy(() => import('./components/cathedra/Certamen'));
const MissalPage = lazy(() => import('./components/cathedra/MissalPage'));
const FavoritesPage = lazy(() => import('./components/cathedra/FavoritesPage'));
const TrilhasPage = lazy(() => import('./components/cathedra/TrilhasPage'));
const AboutPage = lazy(() => import('./components/cathedra/AboutPage'));
const DogmasPage = lazy(() => import('./components/cathedra/DogmasPage'));
const LectioDivina = lazy(() => import('./components/cathedra/LectioDivina'));
const BreviaryPage = lazy(() => import('./components/cathedra/BreviaryPage'));
const LitaniesPage = lazy(() => import('./components/cathedra/LitaniesPage'));
const LiturgicalCalendarPage = lazy(() => import('./components/cathedra/LiturgicalCalendarPage'));
const CommunityPage = lazy(() => import('./components/cathedra/CommunityPage'));
const ProfilePage = lazy(() => import('./components/cathedra/ProfilePage'));
const AdminDashboard = lazy(() => import('./components/cathedra/AdminDashboard'));
const PoenitentiaPage = lazy(() => import('./components/cathedra/PoenitentiaPage'));
const GlossaryPage = lazy(() => import('./components/cathedra/GlossaryPage'));

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
      progress: { 
        streak: (profile as any).streak || 0, 
        totalMinutesRead: (profile as any).total_minutes_read || 0, 
        completedBooks: (profile as any).completed_books || [], 
        xp: (profile as any).xp || 0, 
        level: (profile as any).level || 1, 
        badges: (profile as any).badges || [] 
      },
      stats: { versesSaved: 0, studiesPerformed: 0, daysActive: (profile as any).streak || 0 },
    };
  }, [user, profile]);

  return (
    <LangContext.Provider value={{ lang, setLang: setLangState, t }}>
      <ScrollToTop />
      <CommandCenter />
      <OfflineIndicator />
      <div className="flex h-[100dvh] w-full overflow-hidden bg-background selection:bg-primary/20">
        <div className={`fixed inset-0 z-[150] lg:relative lg:block transition-all ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none lg:pointer-events-auto opacity-0 lg:opacity-100'}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
          <div className={`relative h-full w-72 transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <CathedralSidebar 
              onClose={() => setIsSidebarOpen(false)} 
              user={appUser} 
              isDark={isDark}
              onToggleDark={() => setIsDark(!isDark)}
              onSignOut={signOut}
            />
          </div>
        </div>

        <main id="main-content" className="flex-1 overflow-y-auto flex flex-col relative custom-scrollbar overscroll-auto touch-pan-y scroll-smooth">
          <AppHeader
            user={user}
            isDark={isDark}
            onToggleDark={() => setIsDark(!isDark)}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onSignOut={signOut}
          />
          <div className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 pb-32 lg:pb-12 w-full max-w-6xl mx-auto">
            <Suspense fallback={<LoadingFallback />}>
              <Routes location={location}>
                <Route path={AppRoute.DASHBOARD} element={<Dashboard user={appUser} />} />
                <Route path={AppRoute.BIBLE} element={<Bible />} />
                <Route path={AppRoute.CATECHISM} element={<Catechism />} />
                <Route path={AppRoute.SAINTS} element={<Saints />} />
                <Route path={AppRoute.MAGISTERIUM} element={<Magisterium />} />
                <Route path={AppRoute.DAILY_LITURGY} element={<DailyLiturgy />} />
                <Route path={AppRoute.ROSARY} element={<Rosary />} />
                <Route path={AppRoute.ORACAO} element={<PrayerPage />} />
                <Route path={AppRoute.VIA_CRUCIS} element={<ViaCrucis />} />
                <Route path={AppRoute.STUDY_MODE} element={
                  <ProGate isPremium={isPremium} isLoggedIn={!!user} onLogin={() => navigate(AppRoute.LOGIN)}>
                    <StudyMode />
                  </ProGate>
                } />
                <Route path={AppRoute.LOGIN} element={<Auth onSuccess={() => navigate(AppRoute.DASHBOARD)} />} />
                <Route path={AppRoute.AQUINAS_OPERA} element={<AquinasOpera />} />
                <Route path={AppRoute.CERTAMEN} element={<Certamen />} />
                <Route path={AppRoute.MISSAL} element={<MissalPage />} />
                <Route path={AppRoute.FAVORITES} element={<FavoritesPage />} />
                <Route path={AppRoute.TRILHAS} element={<TrilhasPage />} />
                <Route path={AppRoute.ABOUT} element={<AboutPage />} />
                <Route path={AppRoute.DOGMAS} element={<DogmasPage />} />
                <Route path={AppRoute.LECTIO_DIVINA} element={<LectioDivina />} />
                <Route path={AppRoute.BREVIARY} element={<BreviaryPage />} />
                <Route path={AppRoute.LITANIES} element={<LitaniesPage />} />
                <Route path={AppRoute.LITURGICAL_CALENDAR} element={<LiturgicalCalendarPage />} />
                <Route path={AppRoute.COMMUNITY} element={<CommunityPage />} />
                <Route path={AppRoute.PROFILE} element={<ProfilePage />} />
                <Route path={AppRoute.POENITENTIA} element={<PoenitentiaPage />} />
                <Route path={AppRoute.GLOSSARY} element={<GlossaryPage />} />
                <Route path={AppRoute.ORDO_MISSAE} element={<MissalPage />} />
                <Route path={AppRoute.PRAYERS} element={<PrayerPage />} />
                <Route path={AppRoute.DIAGNOSTICS} element={<DiagnosticsPage />} />
                <Route path={AppRoute.CHECKOUT} element={<CheckoutPage />} />
                <Route path={AppRoute.ADMIN} element={
                  <ProGate isPremium={true} isLoggedIn={!!user} onLogin={() => navigate(AppRoute.LOGIN)}>
                    <AdminDashboard />
                  </ProGate>
                } />
                <Route path="*" element={<Dashboard user={appUser} />} />
              </Routes>
            </Suspense>
          </div>
          <CathedralFooter />
          <BottomNav onOpenSidebar={() => setIsSidebarOpen(true)} />
        </main>
      </div>
    </LangContext.Provider>
  );
};

const App: React.FC = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;