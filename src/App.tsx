import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import SplashScreen from './components/cathedra/SplashScreen';
import ReadingModeToggle from './components/cathedra/ReadingModeToggle';
import { AnimatePresence, motion } from 'framer-motion';
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
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LangContext } from './contexts/LangContext';
import { supabase } from '@/integrations/supabase/client';
import CommandCenter from './components/cathedra/CommandCenter';
import OfflineIndicator from './components/cathedra/OfflineIndicator';
import AuthGuard from './components/cathedra/AuthGuard';
import AdminGuard from './components/cathedra/AdminGuard';
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
const LiturgiaPage = lazy(() => import('./components/cathedra/LiturgiaPage'));
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
const AparicoesPage = lazy(() => import('./components/cathedra/AparicoesPage'));
const OnboardingPage = lazy(() => import('./components/cathedra/OnboardingPage'));
const ResetPasswordPage = lazy(() => import('./components/cathedra/ResetPasswordPage'));
const AchievementsPage = lazy(() => import('./components/cathedra/AchievementsPage'));
const CheckoutResultPage = lazy(() => import('./components/cathedra/CheckoutResultPage'));
const TermsPage = lazy(() => import('./components/cathedra/TermsPage'));
const PrivacyPage = lazy(() => import('./components/cathedra/PrivacyPage'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const readStoredValue = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const getInitialLanguage = (): Language => {
  const storedLang = readStoredValue('cathedra_lang');
  return storedLang ? (storedLang as Language) : 'pt';
};

const getInitialTheme = () => readStoredValue('cathedra_dark') === 'true';

const AppLayout: React.FC = () => {
  const [lang, setLangState] = useState<Language>(getInitialLanguage);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(getInitialTheme);
  const [showSplash, setShowSplash] = useState(true);
  const { user, profile, signOut, isPremium, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getPostAuthRoute = useCallback(() => {
    if (profile?.role === 'admin') return AppRoute.ADMIN;
    return readStoredValue('cathedra_onboarding_done') ? AppRoute.DASHBOARD : AppRoute.ONBOARDING;
  }, [profile?.role]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);
  
  useEffect(() => {
    if (location.pathname !== AppRoute.LOGIN || loading || !user) return;
    navigate(getPostAuthRoute(), { replace: true });
  }, [getPostAuthRoute, loading, location.pathname, navigate, user]);

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
      <SplashScreen visible={showSplash} />
      <ScrollToTop />
      <CommandCenter />
      <OfflineIndicator />
      <div className="flex h-[100dvh] w-full overflow-hidden bg-background selection:bg-primary/20">
        {/* Desktop sidebar - always visible on lg+ */}
        {location.pathname !== AppRoute.HOME && location.pathname !== AppRoute.ONBOARDING && (
          <div className="hidden lg:block relative h-full w-72 flex-shrink-0">
            <CathedralSidebar 
              onClose={() => setIsSidebarOpen(false)} 
              user={appUser} 
              isDark={isDark}
              onToggleDark={() => setIsDark(!isDark)}
              onSignOut={signOut}
            />
          </div>
        )}

        {/* Mobile sidebar overlay - only when open */}
        <AnimatePresence>
          {location.pathname !== AppRoute.HOME && location.pathname !== AppRoute.ONBOARDING && isSidebarOpen && (
            <motion.div 
              key="mobile-sidebar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[150] lg:hidden"
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
              <motion.div
                initial={{ x: -288 }}
                animate={{ x: 0 }}
                exit={{ x: -288 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative h-full w-72"
              >
                <CathedralSidebar 
                  onClose={() => setIsSidebarOpen(false)} 
                  user={appUser} 
                  isDark={isDark}
                  onToggleDark={() => setIsDark(!isDark)}
                  onSignOut={signOut}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <main id="main-content" className="flex-1 overflow-y-auto flex flex-col relative custom-scrollbar overscroll-auto touch-pan-y scroll-smooth">
          {location.pathname !== AppRoute.HOME && location.pathname !== AppRoute.ONBOARDING && (
            <AppHeader
              user={appUser}
              isDark={isDark}
              onToggleDark={() => setIsDark(!isDark)}
              onOpenSidebar={() => setIsSidebarOpen(true)}
              onSignOut={signOut}
            />
          )}
          <div className={location.pathname === AppRoute.HOME || location.pathname === AppRoute.ONBOARDING ? "flex-1" : "flex-1 p-3 sm:p-4 md:p-5 lg:p-6 pb-4 lg:pb-8 w-full max-w-6xl mx-auto"}>

            <AnimatePresence mode="wait">
              <Suspense fallback={<LoadingFallback />}>
                <Routes location={location} key={location.pathname}>
                  <Route path={AppRoute.HOME} element={<PageTransition><Index /></PageTransition>} />
                  <Route path={AppRoute.DASHBOARD} element={<PageTransition><AuthGuard><Dashboard user={appUser} /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.BIBLE} element={<PageTransition><AuthGuard><Bible /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.CATECHISM} element={<PageTransition><AuthGuard><Catechism /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.SAINTS} element={<PageTransition><AuthGuard><Saints /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.MAGISTERIUM} element={<PageTransition><AuthGuard><Magisterium /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.LITURGIA} element={<PageTransition><AuthGuard><LiturgiaPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.DAILY_LITURGY} element={<Navigate to={`${AppRoute.LITURGIA}?tab=liturgia`} replace />} />
                  <Route path={AppRoute.ROSARY} element={<PageTransition><AuthGuard><Rosary /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.ORACAO} element={<PageTransition><AuthGuard><PrayerPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.VIA_CRUCIS} element={<PageTransition><AuthGuard><ViaCrucis /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.STUDY_MODE} element={
                    <PageTransition>
                      <AuthGuard>
                        <ProGate isPremium={isPremium} isLoggedIn={!!user} onLogin={() => navigate(AppRoute.LOGIN)}>
                          <StudyMode />
                        </ProGate>
                      </AuthGuard>
                    </PageTransition>
                  } />
                  <Route path={AppRoute.LOGIN} element={<PageTransition><Auth onSuccess={() => undefined} onSignupSuccess={() => navigate(AppRoute.ONBOARDING)} /></PageTransition>} />
                  <Route path={AppRoute.AQUINAS_OPERA} element={<PageTransition><AuthGuard><AquinasOpera /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.CERTAMEN} element={<PageTransition><AuthGuard><Certamen /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.MISSAL} element={<Navigate to={`${AppRoute.LITURGIA}?tab=missal`} replace />} />
                  <Route path={AppRoute.FAVORITES} element={<PageTransition><AuthGuard><FavoritesPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.TRILHAS} element={<PageTransition><AuthGuard><TrilhasPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.ABOUT} element={<PageTransition><AboutPage /></PageTransition>} />
                  <Route path={AppRoute.DOGMAS} element={<PageTransition><AuthGuard><DogmasPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.LECTIO_DIVINA} element={<PageTransition><AuthGuard><LectioDivina /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.BREVIARY} element={<PageTransition><AuthGuard><BreviaryPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.LITANIES} element={<PageTransition><AuthGuard><LitaniesPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.LITURGICAL_CALENDAR} element={<Navigate to={`${AppRoute.LITURGIA}?tab=calendario`} replace />} />
                  <Route path={AppRoute.COMMUNITY} element={<PageTransition><AuthGuard><CommunityPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.PROFILE} element={<PageTransition><AuthGuard><ProfilePage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.POENITENTIA} element={<PageTransition><AuthGuard><PoenitentiaPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.GLOSSARY} element={<PageTransition><AuthGuard><GlossaryPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.APARICOES} element={<PageTransition><AuthGuard><AparicoesPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.ORDO_MISSAE} element={<Navigate to={`${AppRoute.LITURGIA}?tab=missal`} replace />} />
                  <Route path={AppRoute.PRAYERS} element={<PageTransition><AuthGuard><PrayerPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.DIAGNOSTICS} element={<PageTransition><DiagnosticsPage /></PageTransition>} />
                  <Route path="/reset-password" element={<PageTransition><ResetPasswordPage /></PageTransition>} />
                  <Route path={AppRoute.ONBOARDING} element={<PageTransition><AuthGuard><OnboardingPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.ACHIEVEMENTS} element={<PageTransition><AuthGuard><AchievementsPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.CHECKOUT} element={<PageTransition><AuthGuard><CheckoutPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.CHECKOUT_RESULT} element={<PageTransition><AuthGuard><CheckoutResultPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.TERMS} element={<PageTransition><TermsPage /></PageTransition>} />
                  <Route path={AppRoute.PRIVACY} element={<PageTransition><PrivacyPage /></PageTransition>} />
                  <Route path={AppRoute.ADMIN} element={
                    <PageTransition>
                      <AdminGuard>
                        <AdminDashboard />
                      </AdminGuard>
                    </PageTransition>
                  } />
                  <Route path="*" element={<PageTransition><AuthGuard><Dashboard user={appUser} /></AuthGuard></PageTransition>} />
                </Routes>
              </Suspense>
            </AnimatePresence>
          </div>
          {location.pathname !== AppRoute.HOME && location.pathname !== AppRoute.ONBOARDING && (
            <>
              <CathedralFooter />
              <BottomNav onOpenSidebar={() => setIsSidebarOpen(true)} user={appUser} />
              {[AppRoute.BIBLE, AppRoute.DAILY_LITURGY, AppRoute.LITURGIA, AppRoute.BREVIARY, AppRoute.LECTIO_DIVINA, AppRoute.CATECHISM, AppRoute.MAGISTERIUM].includes(location.pathname as AppRoute) && (
                <ReadingModeToggle />
              )}
            </>
          )}
        </main>
      </div>
    </LangContext.Provider>
  );
};

const App: React.FC = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;