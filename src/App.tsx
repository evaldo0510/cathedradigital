import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import { AnimatePresence, motion } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ScrollToTop from './components/ScrollToTop';
import { AppRoute, Language } from './types';
import { UI_TRANSLATIONS } from './services/translations';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LangContext } from './contexts/LangContext';
import { supabase } from '@/integrations/supabase/client';
import AuthGuard from './components/cathedra/AuthGuard';
import AdminGuard from './components/cathedra/AdminGuard';
import AppErrorBoundary from './components/cathedra/AppErrorBoundary';
import { toast } from 'sonner';

// Core UI components (not lazy to ensure layout is instant)
import ReadingModeToggle from './components/cathedra/ReadingModeToggle';
import PageTransition from './components/PageTransition';
import CathedralSidebar from './components/cathedra/Sidebar';
import CathedralFooter from './components/cathedra/Footer';
import BottomNav from './components/cathedra/BottomNav';
import AppHeader from './components/cathedra/AppHeader';
import ProGate from './components/cathedra/ProGate';
import CommandCenter from './components/cathedra/CommandCenter';
import OfflineIndicator from './components/cathedra/OfflineIndicator';
import OfflineModeToggle from './components/cathedra/OfflineModeToggle';
import SplashScreen from './components/cathedra/SplashScreen';
import { PWAInstallPrompt } from './components/cathedra/PWAInstallPrompt';
// AIStatusBanner removed


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 min — avoid refetching on every navigation
      gcTime: 1000 * 60 * 30,   // 30 min cache
    },
  },
});

// ALL route components are lazy-loaded for faster initial load
const Dashboard = lazy(() => import('./components/cathedra/Dashboard'));
const Bible = lazy(() => import('./components/cathedra/Bible'));
const Catechism = lazy(() => import('./components/cathedra/Catechism'));
const StudyMode = lazy(() => import('./components/cathedra/StudyMode'));
const Saints = lazy(() => import('./components/cathedra/Saints'));
const Magisterium = lazy(() => import('./components/cathedra/Magisterium'));
// Redundant imports removed (DailyLiturgy, MissalPage)
const ViaCrucis = lazy(() => import('./components/cathedra/ViaCrucis'));
const Rosary = lazy(() => import('./components/cathedra/Rosary'));
const PrayerPage = lazy(() => import('./components/cathedra/PrayerPage'));
const Auth = lazy(() => import('./components/cathedra/Auth'));
const AquinasOpera = lazy(() => import('./components/cathedra/AquinasOpera'));
const Certamen = lazy(() => import('./components/cathedra/Certamen'));
// Redundant import removed
const LiturgiaPage = lazy(() => import('./components/cathedra/LiturgiaPage'));
const FavoritesPage = lazy(() => import('./components/cathedra/FavoritesPage'));
// Redundant import removed
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
const PricingPage = lazy(() => import('./components/cathedra/PricingPage'));
const DiagnosticoPage = lazy(() => import('./components/cathedra/DiagnosticoPage'));
const HojePage = lazy(() => import('./components/cathedra/HojePage'));
const JornadaDetailPage = lazy(() => import('./components/cathedra/JornadaDetailPage'));
const JornadaStepPage = lazy(() => import('./components/cathedra/JornadaStepPage'));
const JornadaCompletePage = lazy(() => import('./components/cathedra/JornadaCompletePage'));
const BibliotecaPage = lazy(() => import('./components/cathedra/BibliotecaPage'));
const JornadasPage = lazy(() => import('./components/cathedra/JornadasPage'));
const Index = lazy(() => import('./pages/Index'));
const TemasPage = lazy(() => import('./components/cathedra/TemasPage'));
const TemaDetailPage = lazy(() => import('./components/cathedra/TemaDetailPage'));
const CheckoutPage = lazy(() => import('./components/cathedra/CheckoutPage'));
const DiagnosticsPage = lazy(() => import('./components/cathedra/DiagnosticsPage'));
const UpgradePage = lazy(() => import('./components/cathedra/UpgradePage'));
const AZFaithPage = lazy(() => import('./components/cathedra/AZFaithPage'));
const EncyclopediaPage = lazy(() => import('./components/cathedra/EncyclopediaPage'));
const ModulesGuidePage = lazy(() => import('./components/cathedra/ModulesGuidePage'));
const PopesPage = lazy(() => import('./components/cathedra/PopesPage'));
const GlobalSearchPage = lazy(() => import('./components/cathedra/GlobalSearchPage'));
const MagisteriumViewer = lazy(() => import('./components/cathedra/MagisteriumViewer'));
const TransactionsPage = lazy(() => import('./components/cathedra/TransactionsPage'));
const UserTransactionsPage = lazy(() => import('./components/cathedra/UserTransactionsPage'));
const CatechismExplorer = lazy(() => import('./pages/CatechismExplorer'));
const CatechismHealthCheck = lazy(() => import('./components/cathedra/CatechismHealthCheck'));
const A11yAuditPage = lazy(() => import('./components/cathedra/A11yAuditPage'));
const SecurityAuditPage = lazy(() => import('./components/cathedra/SecurityAuditPage'));
const SellerDashboard = lazy(() => import('./components/cathedra/SellerDashboard'));

const CatechismDebug = lazy(() => import('./components/cathedra/CatechismDebug'));
const CatechismIntegrity = lazy(() => import('./components/cathedra/CatechismIntegrity'));
const CatechismVerification = lazy(() => import('./components/cathedra/CatechismVerification'));
const PartnersPage = lazy(() => import('./components/cathedra/PartnersPage'));

const TransparencyPage = lazy(() => import('./components/cathedra/TransparencyPage'));
const OfflinePage = lazy(() => import('./components/cathedra/OfflinePage'));
const CacheManager = lazy(() => import('./components/cathedra/CacheManager'));


const SkeletonBar = React.forwardRef<HTMLDivElement, { w?: string; h?: string; className?: string }>(
  ({ w = 'w-full', h = 'h-4', className = '' }, ref) => (
    <div ref={ref} className={`${w} ${h} rounded-lg bg-muted/60 animate-pulse ${className}`} />
  )
);

SkeletonBar.displayName = 'SkeletonBar';

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[60dvh] w-full p-6 animate-in fade-in duration-500">
    <div className="relative mb-8">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 animate-pulse border-2 border-primary/20" />
      <div className="absolute inset-0 w-16 h-16 rounded-2xl border-t-2 border-primary animate-spin" />
    </div>
    
    <div className="w-full max-w-sm space-y-4">
      <SkeletonBar w="w-3/4 mx-auto" h="h-5" />
      <SkeletonBar w="w-full" h="h-3" className="opacity-50" />
      <SkeletonBar w="w-5/6 mx-auto" h="h-3" className="opacity-40" />
      
      <div className="grid grid-cols-2 gap-3 pt-6">
        {[1, 2].map(i => (
          <div key={i} className="rounded-xl bg-muted/20 border border-border/20 p-4 space-y-3">
            <SkeletonBar w="w-12 mx-auto" h="h-12" className="rounded-lg" />
            <SkeletonBar w="w-2/3 mx-auto" h="h-3" />
          </div>
        ))}
      </div>
    </div>
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
  
  const { user, profile, signOut, isPremium, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Pages that should NOT show header, footer, sidebar, or bottom nav (Auth flow & Landing)
  const chromelessPages: string[] = [AppRoute.HOME, AppRoute.ONBOARDING, AppRoute.LOGIN, '/reset-password'];
  const isChromeless = chromelessPages.includes(location.pathname);

  // Main pages where "Back" button shouldn't show (root pages)
  const isMainPage = [
    AppRoute.DASHBOARD,
    AppRoute.HOME,
    AppRoute.HOJE,
    AppRoute.JORNADAS,
    AppRoute.BIBLIOTECA,
    AppRoute.PROFILE,
    AppRoute.LITURGIA,
    AppRoute.TEMAS,
    AppRoute.AZ_FAITH,
    AppRoute.COMMUNITY
  ].includes(location.pathname as AppRoute);

  // Swipe to go back logic for better mobile UX
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      // Only track if swipe starts from the very far left (0-20px) to avoid conflicts
      if (e.touches[0].clientX < 20) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      } else {
        startX = 0;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (startX > 0) {
        const deltaX = e.changedTouches[0].clientX - startX;
        const deltaY = Math.abs(e.changedTouches[0].clientY - startY);
        
        // Require a very clear horizontal swipe (120px+) with minimal vertical movement
        if (deltaX > 120 && deltaY < 40) {
          if (!isChromeless && !isMainPage) {
            navigate(-1);
          }
        }
      }
      startX = 0;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isChromeless, isMainPage, navigate]);

  const getPostAuthRoute = useCallback(() => {
    if (profile?.role === 'admin') return AppRoute.ADMIN;
    // If no onboarding done or no diagnosis, go to onboarding (which includes diagnosis)
    const onboardingDone = readStoredValue('cathedra_onboarding_done');
    if (!onboardingDone || !profile?._sensitive?.diagnosis_result) return AppRoute.ONBOARDING;
    return AppRoute.HOJE;
  }, [profile?.role, profile?._sensitive?.diagnosis_result]);


  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('cathedra_dark', isDark ? 'true' : 'false');
  }, [isDark]);
  
  useEffect(() => {
    const handleLangChange = (e: CustomEvent) => {
      const newLang = e.detail as Language;
      setLangState(newLang);
      localStorage.setItem('cathedra_lang', newLang);
    };
    (window as any).currentLang = lang;
    window.addEventListener('change-lang' as any, handleLangChange);
    return () => window.removeEventListener('change-lang' as any, handleLangChange);
  }, [lang]);

  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Pre-load voices for better voice selection
  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

  const toggleSpeak = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const content = document.getElementById('main-content')?.innerText || '';
    if (!content) return;

    const textToRead = content.substring(0, 8000); 
    const utterance = new SpeechSynthesisUtterance(textToRead);
    
    const langMap: Record<string, string> = {
      'pt': 'pt-BR',
      'en': 'en-US',
      'es': 'es-ES',
      'la': 'it-IT',
      'it': 'it-IT',
      'fr': 'fr-FR',
      'de': 'de-DE'
    };
    
    const targetLang = langMap[lang] || lang;
    utterance.lang = targetLang;
    
    // Try to find a higher quality voice on the system
    const voices = window.speechSynthesis.getVoices();
    const betterVoice = voices.filter(v => v.lang.startsWith(targetLang.split('-')[0]))
      .sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aScore = (aName.includes('google') ? 10 : 0) + (aName.includes('premium') ? 20 : 0) + (aName.includes('natural') ? 30 : 0) + (aName.includes('enhanced') ? 15 : 0);
        const bScore = (bName.includes('google') ? 10 : 0) + (bName.includes('premium') ? 20 : 0) + (bName.includes('natural') ? 30 : 0) + (bName.includes('enhanced') ? 15 : 0);
        return bScore - aScore;
      })[0];
      
    if (betterVoice) {
      utterance.voice = betterVoice;
    }
    
    utterance.rate = 1.0; // Slightly faster to sound more natural on modern engines
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, [lang]);

  useEffect(() => {
    const handleAudioToggle = () => toggleSpeak();
    window.addEventListener('toggle-audio' as any, handleAudioToggle);
    return () => window.removeEventListener('toggle-audio' as any, handleAudioToggle);
  }, [toggleSpeak]);

  useEffect(() => {
    const timer = setInterval(() => {
      const isActuallySpeaking = window.speechSynthesis.speaking;
      if (isActuallySpeaking !== isSpeaking) {
        setIsSpeaking(isActuallySpeaking);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [isSpeaking]);


  useEffect(() => {
    if (navigator.onLine) {
      import('@/lib/prefetch').then(({ prefetchEssentialContent }) => {
        prefetchEssentialContent();
      });
    }

    const handleOnline = () => {
      toast.success('Conexão restabelecida', {
        description: 'Sincronizando cache local...',
      });
      import('@/lib/prefetch').then(({ prefetchEssentialContent }) => {
        prefetchEssentialContent();
      });
    };
    
    const handleOffline = () => {
      toast.warning('Modo Offline Detectado', {
        description: 'Você ainda pode ler os textos essenciais salvos.',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const oldTema = searchParams.get('tema');
    if (oldTema && location.pathname === AppRoute.TEMAS) {
      navigate(`${AppRoute.TEMAS}/${oldTema}`, { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (location.pathname !== AppRoute.LOGIN || loading || !user) return;
    navigate(getPostAuthRoute(), { replace: true });
  }, [getPostAuthRoute, loading, location.pathname, navigate, user, profile]);

  useEffect(() => {
    // ─── Global Offline Redirection ───
    const isOnline = navigator.onLine;
    const isOfflineMode = readStoredValue('cathedra_offline_mode') === 'true';
    const isNetworkRequired = [AppRoute.COMMUNITY, AppRoute.UPGRADE, AppRoute.CHECKOUT, AppRoute.BUSCAR].includes(location.pathname as any);
    
    if ((!isOnline || isOfflineMode) && isNetworkRequired) {
      navigate(AppRoute.OFFLINE);
    }
  }, [location.pathname, navigate]);

  const lastTrackedPath = useRef('');
  useEffect(() => {
    if (lastTrackedPath.current === location.pathname || !user) return;
    lastTrackedPath.current = location.pathname;
    
    const timer = setTimeout(() => {
      // Find a readable title for the current route
      let pageTitle = '';
      const path = location.pathname;
      
      if (path.includes('biblia')) pageTitle = 'Sagrada Escritura';
      else if (path.includes('catecismo')) pageTitle = 'Catecismo da Igreja';
      else if (path.includes('hoje')) pageTitle = 'Liturgia do Dia';
      else if (path.includes('estudo')) pageTitle = 'Logos IA';
      else if (path.includes('jornada')) pageTitle = 'Jornada Espiritual';
      else if (path.includes('santos')) pageTitle = 'Vida dos Santos';
      else if (path.includes('oracao')) pageTitle = 'Momento de Oração';
      else if (path.includes('comunidade')) pageTitle = 'Comunidade Cathedra';
      
      if (pageTitle) {
        supabase
          .from('user_history')
          .insert([{ 
            user_id: user.id, 
            route: path, 
            title: pageTitle,
            visited_at: new Date().toISOString()
          }])
          .then(() => {}, () => {});
      }

      supabase
        .from('app_metrics')
        .insert([{ metric_type: 'visit', metadata: { path, user_id: user.id } }])
        .then(() => {}, () => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, [location.pathname, user]);

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
      <Suspense fallback={
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-background p-6">
          <div className="relative mb-12 animate-in fade-in zoom-in duration-700">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-[3px] border-primary/10 shadow-2xl p-4 bg-muted/20">
              <div className="w-full h-full bg-primary/20 rounded-full animate-ping" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-t-2 border-primary rounded-full animate-spin" />
            </div>
          </div>
          
          <div className="space-y-4 w-full max-w-[200px] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary/40 animate-[shimmer_2s_infinite]" style={{ width: '40%' }} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 text-center animate-pulse">
              Cathedra Digital
            </p>
          </div>
        </div>
      }>
        <ScrollToTop />
        <CommandCenter />
        <OfflineIndicator />
        {/* AIStatusBanner removed */}
        <PWAInstallPrompt />
        <div className="flex h-[100dvh] w-full overflow-hidden bg-background selection:bg-primary/20">
          {/* Persistent Sidebar for Desktop */}
          {!isChromeless && (
            <div className="hidden lg:block h-full w-72 flex-shrink-0">
              <CathedralSidebar 
                user={appUser} 
                isDark={isDark}
                onToggleDark={() => setIsDark(!isDark)}
                isSpeaking={isSpeaking}
                onToggleSpeak={toggleSpeak}
                onSignOut={signOut}
              />
            </div>
          )}

          {/* Mobile sidebar overlay - only when open */}
          <AnimatePresence>
           {!isChromeless && isSidebarOpen && (
            <motion.div 
              key="mobile-sidebar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[150] lg:hidden"
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
              <motion.div
                initial={{ x: -288 }}
                animate={{ x: 0 }}
                exit={{ x: -288 }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                className="relative h-full w-72"
              >
                <CathedralSidebar 
                onClose={() => setIsSidebarOpen(false)} 
                user={appUser} 
                isDark={isDark}
                onToggleDark={() => setIsDark(!isDark)}
                isSpeaking={isSpeaking}
                onToggleSpeak={toggleSpeak}
                onSignOut={signOut}
              />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <main id="main-content" className="flex-1 overflow-y-auto flex flex-col relative no-scrollbar overscroll-auto touch-pan-y scroll-smooth bg-background">
          <div className="w-full flex-1 flex flex-col items-center">
            {!isChromeless && (
              <div className="w-full sticky top-0 z-[140] bg-background/90 backdrop-blur-xl border-b border-border">
                <AppHeader
                  user={appUser}
                  isDark={isDark}
                  onToggleDark={() => setIsDark(!isDark)}
                  lang={lang}
                  onChangeLang={(l) => window.dispatchEvent(new CustomEvent('change-lang', { detail: l }))}
                  isSpeaking={isSpeaking}
                  onToggleSpeak={toggleSpeak}
                  onOpenSidebar={() => setIsSidebarOpen(true)}
                  onSignOut={signOut}
                />
              </div>
            )}
            
            <div className={isChromeless ? "w-full flex-1 pb-24 lg:pb-0" : (location.pathname.startsWith('/admin') ? "w-full flex-1 pb-32 lg:pb-12 px-4 sm:px-6 md:px-8 lg:px-10 pt-4 md:pt-6 lg:pt-10" : "w-full max-w-[1200px] mx-auto flex-1 pb-32 lg:pb-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-4 md:pt-6 lg:pt-10")}>

            <Suspense fallback={<LoadingFallback />}>
              <AnimatePresence mode="wait" initial={false}>
                <Routes location={location} key={location.pathname}>
                  <Route path={AppRoute.HOME} element={<PageTransition><Index /></PageTransition>} />
                  <Route path="/curso-pch" element={<Navigate to={AppRoute.JORNADAS} replace />} />
                  <Route path="/pch" element={<Navigate to={AppRoute.JORNADAS} replace />} />
                  <Route path={AppRoute.DASHBOARD} element={<PageTransition><AuthGuard><Dashboard user={appUser} /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.BIBLE} element={<PageTransition><AuthGuard><Bible /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.CATECHISM} element={<PageTransition><AuthGuard><Catechism /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.SAINTS} element={<PageTransition><AuthGuard><Saints /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.SAINT_DETAIL} element={<PageTransition><AuthGuard><Saints /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.MAGISTERIUM} element={<PageTransition><AuthGuard><Magisterium /></AuthGuard></PageTransition>} />
                  <Route path="/catechism/debug" element={<PageTransition><AdminGuard><CatechismDebug /></AdminGuard></PageTransition>} />
                  <Route path={AppRoute.CATECHISM_INTEGRITY} element={<PageTransition><AdminGuard><CatechismIntegrity /></AdminGuard></PageTransition>} />
                  <Route path={AppRoute.CATECHISM_EXPLORER} element={<PageTransition><AuthGuard><CatechismExplorer /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.CATECHISM_HEALTH} element={<PageTransition><AdminGuard><CatechismHealthCheck /></AdminGuard></PageTransition>} />
                  <Route path={AppRoute.CATECHISM_VERIFY} element={<PageTransition><AdminGuard><CatechismVerification /></AdminGuard></PageTransition>} />
                  <Route path={AppRoute.MAGISTERIUM_DOC} element={<PageTransition><AuthGuard><MagisteriumViewer /></AuthGuard></PageTransition>} />

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
                  <Route path={AppRoute.TEMAS} element={<PageTransition><AuthGuard><TemasPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.TEMA_DETAIL} element={<PageTransition><AuthGuard><TemaDetailPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.CERTAMEN} element={<PageTransition><AuthGuard><Certamen /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.MISSAL} element={<Navigate to={`${AppRoute.LITURGIA}?tab=missal`} replace />} />
                  <Route path={AppRoute.FAVORITES} element={<PageTransition><AuthGuard><FavoritesPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.TRILHAS} element={<Navigate to={AppRoute.JORNADAS} replace />} />
                  <Route path={AppRoute.ABOUT} element={<PageTransition><AboutPage /></PageTransition>} />
                  <Route path={AppRoute.DOGMAS} element={<PageTransition><AuthGuard><DogmasPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.PARTNERS} element={<PageTransition><PartnersPage /></PageTransition>} />
                  <Route path={AppRoute.LECTIO_DIVINA} element={<PageTransition><AuthGuard><LectioDivina /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.BREVIARY} element={<PageTransition><AuthGuard><BreviaryPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.LITANIES} element={<PageTransition><AuthGuard><LitaniesPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.LITURGICAL_CALENDAR} element={<Navigate to={`${AppRoute.LITURGIA}?tab=calendario`} replace />} />
                  <Route path={AppRoute.COMMUNITY} element={<PageTransition><AuthGuard><CommunityPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.PROFILE} element={<PageTransition><AuthGuard><ProfilePage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.POENITENTIA} element={<PageTransition><AuthGuard><PoenitentiaPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.GLOSSARY} element={<PageTransition><AuthGuard><GlossaryPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.AZ_FAITH} element={<PageTransition><AuthGuard><AZFaithPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.ENCYCLOPEDIA} element={<PageTransition><AuthGuard><EncyclopediaPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.APARICOES} element={<PageTransition><AuthGuard><AparicoesPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.ORDO_MISSAE} element={<Navigate to={`${AppRoute.LITURGIA}?tab=missal`} replace />} />
                  <Route path={AppRoute.PRAYERS} element={<PageTransition><AuthGuard><PrayerPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.DIAGNOSTICS} element={<PageTransition><AuthGuard><DiagnosticsPage /></AuthGuard></PageTransition>} />
                  <Route path="/reset-password" element={<PageTransition><ResetPasswordPage /></PageTransition>} />
                  <Route path={AppRoute.ONBOARDING} element={<PageTransition><AuthGuard><OnboardingPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.ACHIEVEMENTS} element={<PageTransition><AuthGuard><AchievementsPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.CHECKOUT} element={<PageTransition><AuthGuard><CheckoutPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.CHECKOUT_RESULT} element={<PageTransition><AuthGuard><CheckoutResultPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.TERMS} element={<PageTransition><TermsPage /></PageTransition>} />
                  <Route path={AppRoute.PRIVACY} element={<PageTransition><PrivacyPage /></PageTransition>} />
                  <Route path={AppRoute.PRICING} element={<PageTransition><PricingPage /></PageTransition>} />
                  <Route path={AppRoute.UPGRADE} element={<PageTransition><UpgradePage /></PageTransition>} />
                  <Route path={AppRoute.A11Y_AUDIT} element={<PageTransition><A11yAuditPage /></PageTransition>} />
                  <Route path={AppRoute.SECURITY_AUDIT} element={<PageTransition><SecurityAuditPage /></PageTransition>} />
                  <Route path={AppRoute.SELLER} element={<PageTransition><AuthGuard><SellerDashboard /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.TRANSACTIONS} element={<PageTransition><AuthGuard><TransactionsPage /></AuthGuard></PageTransition>} />
                  <Route path="/transactions/my" element={<PageTransition><AuthGuard><UserTransactionsPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.DIAGNOSTICO} element={<PageTransition><AuthGuard><DiagnosticoPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.HOJE} element={<PageTransition><AuthGuard><HojePage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.JORNADAS} element={<PageTransition><AuthGuard><JornadasPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.JORNADA_DETAIL} element={<PageTransition><AuthGuard><JornadaDetailPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.JORNADA_STEP} element={<PageTransition><AuthGuard><JornadaStepPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.JORNADA_COMPLETE} element={<PageTransition><AuthGuard><JornadaCompletePage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.BIBLIOTECA} element={<PageTransition><AuthGuard><BibliotecaPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.MODULES_GUIDE} element={<PageTransition><ModulesGuidePage /></PageTransition>} />
                  <Route path={AppRoute.TRANSPARENCY} element={<PageTransition><TransparencyPage /></PageTransition>} />
                  <Route path={AppRoute.OFFLINE} element={<PageTransition><OfflinePage /></PageTransition>} />
                  <Route path={AppRoute.CACHE_MANAGER} element={<PageTransition><CacheManager /></PageTransition>} />

                  <Route path={AppRoute.POPES} element={<PageTransition><AuthGuard><PopesPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.BUSCAR} element={<PageTransition><AuthGuard><GlobalSearchPage /></AuthGuard></PageTransition>} />
                  <Route path={AppRoute.ADMIN} element={
                    <PageTransition>
                      <AdminGuard>
                        <AdminDashboard />
                      </AdminGuard>
                    </PageTransition>
                  } />
                  <Route path="*" element={<PageTransition><AuthGuard><Dashboard user={appUser} /></AuthGuard></PageTransition>} />
                </Routes>
              </AnimatePresence>
            </Suspense>
            <CathedralFooter />
          </div>
        </div>
      </main>
        {!isChromeless && (
          <>
            <Suspense fallback={null}>
              <BottomNav onOpenSidebar={() => setIsSidebarOpen(true)} user={appUser} />
            </Suspense>
            <OfflineModeToggle />
            {[AppRoute.BIBLE, AppRoute.DAILY_LITURGY, AppRoute.LITURGIA, AppRoute.BREVIARY, AppRoute.LECTIO_DIVINA, AppRoute.CATECHISM, AppRoute.MAGISTERIUM].includes(location.pathname as AppRoute) && (
              <ReadingModeToggle />
            )}
            <OfflineIndicator />
            <PWAInstallPrompt />
          </>
        )}
      </div>
      </Suspense>
    </LangContext.Provider>
  );
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash once per session
    try {
      return !sessionStorage.getItem('cathedra_splash_shown');
    } catch { return true; }
  });

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    try { sessionStorage.setItem('cathedra_splash_shown', '1'); } catch {}
  }, []);

  return (
    <HelmetProvider>
      <AppErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
              <AppLayout />
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </AppErrorBoundary>
    </HelmetProvider>
  );
};

export default App;