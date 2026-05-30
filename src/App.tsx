import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, useContext } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ScrollToTop from './components/ScrollToTop';
import { cn } from './lib/utils';
import { AppRoute, Language } from './types';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LangContext, LangProvider } from './contexts/LangContext';
import { supabase } from '@/integrations/supabase/client';
import AuthGuard from './components/cathedra/AuthGuard';
import AdminGuard from './components/cathedra/AdminGuard';
import AppErrorBoundary from './components/cathedra/AppErrorBoundary';
import * as Sentry from "@sentry/react";
import { toast } from 'sonner';

// Core UI components
import ReadingModeToggle from './components/cathedra/ReadingModeToggle';
import { ReadingSettingsProvider, useReadingSettings } from './contexts/ReadingSettingsContext';
import { initGA4AutoTracking } from './lib/analytics';

import CathedralSidebar from './components/cathedra/Sidebar';
import CathedralFooter from './components/cathedra/Footer';
import BottomNav from './components/cathedra/BottomNav';
import AppHeader from './components/cathedra/AppHeader';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useRenderPerf } from './hooks/useRenderPerf';
import { useA11yGuard } from './lib/a11y-guard';

import { BibleSkeleton, CatechismSkeleton, LogosSkeleton } from './components/cathedra/RouteSkeletons';

const CommandCenter = lazy(() => import('./components/cathedra/CommandCenter'));
const PWAInstallPrompt = lazy(() => import('./components/cathedra/PWAInstallPrompt').then(m => ({ default: m.PWAInstallPrompt })));
const A11ySettingsPanel = lazy(() => import('./components/cathedra/A11ySettingsPanel'));
const ReadingPreferencesPanel = lazy(() => import('./components/cathedra/ReadingPreferencesPanel').then(m => ({ default: m.ReadingPreferencesPanel })));

import OfflineIndicator from './components/cathedra/OfflineIndicator';
import SplashScreen from './components/cathedra/SplashScreen';
import { GlobalLogosAI } from './components/cathedra/GlobalLogosAI';
import { SpacingDebugger } from './components/cathedra/SpacingDebugger';
import SwipeNavigation from './components/cathedra/SwipeNavigation';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
  },
});

// Lazy loaded routes
const Bible = lazy(() => import('./components/cathedra/Bible'));
const Catechism = lazy(() => import('./components/cathedra/Catechism'));
const Magisterium = lazy(() => import('./components/cathedra/Magisterium'));
const Auth = lazy(() => import('./components/cathedra/Auth'));
const ProfilePage = lazy(() => import('./components/cathedra/ProfilePage'));
const GlobalSearchPage = lazy(() => import('./components/cathedra/GlobalSearchPage'));
const Index = lazy(() => import('./pages/Index'));
const LogosAI = lazy(() => import('./components/cathedra/LogosAI'));
const SpiritualProfile = lazy(() => import('./components/cathedra/SpiritualProfile'));
const Saints = lazy(() => import('./components/cathedra/Saints'));

const HojePage = lazy(() => import('./components/cathedra/HojePage'));
const JornadasPage = lazy(() => import('./components/cathedra/JornadasPage'));
const JornadaDetailPage = lazy(() => import('./components/cathedra/JornadaDetailPage'));
const JornadaStepPage = lazy(() => import('./components/cathedra/JornadaStepPage'));
const JornadaCompletePage = lazy(() => import('./components/cathedra/JornadaCompletePage'));
const ItinerariaPage = lazy(() => import('./components/cathedra/ItinerariaPage'));
const ItinerariumDetailPage = lazy(() => import('./components/cathedra/ItinerariumDetailPage'));
const ItinerariumStepPage = lazy(() => import('./components/cathedra/ItinerariumStepPage'));
const BibliotecaPage = lazy(() => import('./components/cathedra/BibliotecaPage'));
const CommunityPage = lazy(() => import('./components/cathedra/CommunityPage'));
const LiturgiaPage = lazy(() => import('./components/cathedra/LiturgiaPage'));
const LiturgicalCalendarPage = lazy(() => import('./components/cathedra/LiturgicalCalendarPage'));
const MissalPage = lazy(() => import('./components/cathedra/MissalPage'));
const BreviaryPage = lazy(() => import('./components/cathedra/BreviaryPage'));
const Rosary = lazy(() => import('./components/cathedra/Rosary'));
const ViaCrucis = lazy(() => import('./components/cathedra/ViaCrucis'));
const LitaniesPage = lazy(() => import('./components/cathedra/LitaniesPage'));
const PrayerPage = lazy(() => import('./components/cathedra/PrayerPage'));
const LectioDivina = lazy(() => import('./components/cathedra/LectioDivina'));
const PoenitentiaPage = lazy(() => import('./components/cathedra/PoenitentiaPage'));
const DogmasPage = lazy(() => import('./components/cathedra/DogmasPage'));
const PopesPage = lazy(() => import('./components/cathedra/PopesPage'));
const AparicoesPage = lazy(() => import('./components/cathedra/AparicoesPage'));
const AquinasOpera = lazy(() => import('./components/cathedra/AquinasOpera'));
const AZFaithPage = lazy(() => import('./components/cathedra/AZFaithPage'));
const GlossaryPage = lazy(() => import('./components/cathedra/GlossaryPage'));
const TemasPage = lazy(() => import('./components/cathedra/TemasPage'));
const TemaDetailPage = lazy(() => import('./components/cathedra/TemaDetailPage'));
const FavoritesPage = lazy(() => import('./components/cathedra/FavoritesPage'));
const AchievementsPage = lazy(() => import('./components/cathedra/AchievementsPage'));
const SpiritualJournalPage = lazy(() => import('./components/cathedra/SpiritualJournalPage'));
const ModulesGuidePage = lazy(() => import('./components/cathedra/ModulesGuidePage'));
const OnboardingPage = lazy(() => import('./components/cathedra/OnboardingPage'));
const AboutPage = lazy(() => import('./components/cathedra/AboutPage'));
const TermsPage = lazy(() => import('./components/cathedra/TermsPage'));
const PrivacyPage = lazy(() => import('./components/cathedra/PrivacyPage'));
const TransparencyPage = lazy(() => import('./components/cathedra/TransparencyPage'));
const PartnersPage = lazy(() => import('./components/cathedra/PartnersPage'));
const PricingPage = lazy(() => import('./components/cathedra/PricingPage'));
const UpgradePage = lazy(() => import('./components/cathedra/UpgradePage'));
const CheckoutPage = lazy(() => import('./components/cathedra/CheckoutPage'));
const CheckoutResultPage = lazy(() => import('./components/cathedra/CheckoutResultPage'));
const TransactionsPage = lazy(() => import('./components/cathedra/TransactionsPage'));
const UserTransactionsPage = lazy(() => import('./components/cathedra/UserTransactionsPage'));
const ResetPasswordPage = lazy(() => import('./components/cathedra/ResetPasswordPage'));
const OfflinePage = lazy(() => import('./components/cathedra/OfflinePage'));
const CacheManager = lazy(() => import('./components/cathedra/CacheManager'));
const AdminDashboard = lazy(() => import('./components/cathedra/AdminDashboard'));
const DesignSystemGuide = lazy(() => import('./components/cathedra/DesignSystemGuide'));
const SecurityDashboard = lazy(() => import('./pages/SecurityDashboard'));
const SEOVerificationPage = lazy(() => import('./pages/SEOVerificationPage'));



const SkeletonBar = React.forwardRef<HTMLDivElement, { w?: string; h?: string; className?: string }>(
  ({ w = 'w-full', h = 'h-4', className = '' }, ref) => (
    <div ref={ref} className={`${w} ${h} rounded-full bg-muted/60 animate-pulse ${className}`} />
  )
);
SkeletonBar.displayName = 'SkeletonBar';

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[70dvh] w-full p-8 animate-in fade-in duration-[2000ms] ease-out">
    <div className="relative mb-24">
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.05, 0.2],
          filter: ["blur(30px)", "blur(60px)", "blur(30px)"]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 w-32 h-32 -left-4 -top-4 rounded-full bg-primary/5" 
      />
      <div className="w-20 h-20 rounded-full bg-primary/[0.01] border border-primary/[0.03] relative z-10 flex items-center justify-center">
         <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1], scale: [0.95, 1, 0.95] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-8 h-8 rounded-full border border-primary/10"
        />
      </div>
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 w-20 h-20 rounded-full border-t border-primary/[0.05] z-20" 
      />
    </div>
    <div className="space-y-12 w-full max-w-sm flex flex-col items-center">
      <div className="h-[0.5px] w-48 bg-primary/[0.03] rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-primary/[0.08]"
          initial={{ width: "0%", x: "-100%" }}
          animate={{ width: "100%", x: "100%" }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <motion.p 
        initial={{ opacity: 0, letterSpacing: "0.4em" }}
        animate={{ opacity: 1, letterSpacing: "1em" }}
        transition={{ duration: 3, ease: "easeOut" }}
        className="text-[8px] font-bold uppercase text-primary/20 text-center tracking-[1em]"
      >
        AD MAIOREM DEI GLORIAM
      </motion.p>
    </div>
  </div>
);

const AppLayout: React.FC = () => {
  useRenderPerf('AppLayout', 10);
  const { settings, updateSettings } = useReadingSettings();
  const { lang, setLang, t } = useContext(LangContext);
  

  // Enable automatic accessibility check
  useA11yGuard(true);
  
  useEffect(() => {
    const handleGlobalLang = (e: any) => {
      if (e.detail) setLang(e.detail);
    };
    window.addEventListener('change-lang', handleGlobalLang);
    return () => window.removeEventListener('change-lang', handleGlobalLang);
  }, [setLang]);

  // Mobile Presence - Scroll detection
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.scrollY;

      if (Math.abs(scrollY - lastScrollY) < 10) {
        ticking = false;
        return;
      }

      if (scrollY > lastScrollY && scrollY > 100) {
        document.body.classList.add('is-scrolling-down');
      } else {
        document.body.classList.remove('is-scrolling-down');
      }

      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const [showA11ySettings, setShowA11ySettings] = useState(false);
  const [showReadingPreferences, setShowReadingPreferences] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('cathedra_sidebar_open');
    return saved === 'true';
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const mainContentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('cathedra_sidebar_open', isSidebarOpen.toString());
  }, [isSidebarOpen]);

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const isDark = settings.theme === 'dark' || settings.theme === 'night';
  const isHighContrast = settings.highContrast;

  const toggleDark = useCallback(() => {
    updateSettings({ theme: settings.theme === 'dark' || settings.theme === 'night' ? 'paper' : 'dark' });
  }, [settings.theme, updateSettings]);

  const toggleHighContrast = useCallback(() => {
    updateSettings({ highContrast: !isHighContrast });
  }, [isHighContrast, updateSettings]);

  const handleOpenSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
    // Focus content for accessibility after closing
    setTimeout(() => {
      mainContentRef.current?.focus();
    }, 100);
  }, []);
  const handleOpenA11y = useCallback(() => setShowA11ySettings(true), []);
  const handleCloseA11y = useCallback(() => setShowA11ySettings(false), []);
  const handleOpenReadingPreferences = useCallback(() => setShowReadingPreferences(true), []);
  const handleCloseReadingPreferences = useCallback(() => setShowReadingPreferences(false), []);

  useEffect(() => {
    window.addEventListener('open-reading-preferences', handleOpenReadingPreferences);
    return () => window.removeEventListener('open-reading-preferences', handleOpenReadingPreferences);
  }, [handleOpenReadingPreferences]);

  useEffect(() => {
    window.addEventListener('open-a11y-settings', handleOpenA11y);
    return () => window.removeEventListener('open-a11y-settings', handleOpenA11y);
  }, [handleOpenA11y]);

  useEffect(() => {
    const handleOpenA11yGlobal = () => setShowA11ySettings(true);
    window.addEventListener('open-a11y-settings', handleOpenA11yGlobal);
    return () => window.removeEventListener('open-a11y-settings', handleOpenA11yGlobal);
  }, []);

  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSidebarOpen) handleCloseSidebar();
        if (showA11ySettings) setShowA11ySettings(false);
        if (showReadingPreferences) setShowReadingPreferences(false);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [isSidebarOpen, showA11ySettings, showReadingPreferences, handleCloseSidebar]);

  const toggleSpeak = useCallback(() => {
    if (settings.totalSilence) return;
    
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const content = document.getElementById('main-content')?.innerText || '';
      if (!content) return;
      const utterance = new SpeechSynthesisUtterance(content.substring(0, 5000));
      utterance.lang = lang === 'pt' ? 'pt-BR' : 'en-US';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [lang, settings.totalSilence]);


  // Adapter to convert Profile to User if needed, or just cast if compatible
  const authUserAdapter = useMemo(() => {
    if (!profile) return null;
    return {
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar_url,
      isPremium: profile.is_premium,
      role: (profile.role as 'pilgrim' | 'scholar' | 'admin') || 'pilgrim',
      email: profile._sensitive?.email || '',
      joinedAt: profile.last_visit || new Date().toISOString(),
      progress: {
        streak: profile.streak || 0,
        totalMinutesRead: profile.total_minutes_read || 0,
        completedBooks: profile.completed_books || [],
        xp: profile.xp || 0,
        level: profile.level || 1,
        badges: profile.badges || []
      },
      stats: {
        versesSaved: 0,
        studiesPerformed: 0,
        daysActive: profile.streak || 0
      }
    };
  }, [profile]);

  return (
    <MotionConfig reducedMotion={settings.reduceAnimations ? "always" : "never"}>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:fixed focus:top-6 focus:left-6 focus:z-[250] focus:px-6 focus:py-3 focus:bg-primary focus:text-primary-foreground focus:rounded-full focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:ring-offset-background transition-all duration-300 font-bold uppercase tracking-[0.2em] text-[10px]"
        >
          {t('skip_to_content')}
        </a>


        <ScrollToTop />
        {location.pathname !== '/' && (
          <AppHeader 
            user={authUserAdapter} 
            isDark={isDark} 
            onToggleDark={toggleDark}
            lang={lang}
            onChangeLang={setLang}
            onSignOut={signOut}
            onOpenSidebar={handleOpenSidebar}
          />
        )}
        
        <CathedralSidebar 
          isOpen={isSidebarOpen}
          user={authUserAdapter}
          onClose={handleCloseSidebar}
          isDark={isDark}
          onToggleDark={toggleDark}
          isHighContrast={isHighContrast}
          onToggleHighContrast={toggleHighContrast}
          isSpeaking={isSpeaking}
          onToggleSpeak={toggleSpeak}
          onSignOut={signOut}
        />
        
        <GlobalLogosAI />
        <SpacingDebugger />

        <main id="main-content" ref={mainContentRef} tabIndex={-1} className={cn("outline-none transition-all duration-1000", location.pathname === '/' ? "p-0 max-w-none" : "pb-24 md:pb-80 pt-16 md:pt-80 px-4 md:px-20 lg:px-32 xl:px-48 max-w-[var(--layout-max-width)] mx-auto min-h-screen")}>
          <SwipeNavigation>
            <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Suspense fallback={<LoadingFallback />}><Index /></Suspense>} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="/bible" element={<Suspense fallback={<BibleSkeleton />}><Bible /></Suspense>} />
              <Route path="/biblia" element={<Navigate to="/bible" replace />} />
              <Route path="/catechism" element={<Suspense fallback={<CatechismSkeleton />}><Catechism /></Suspense>} />
              <Route path="/catecismo" element={<Navigate to="/catechism" replace />} />
              <Route path="/magisterium" element={<Suspense fallback={<LoadingFallback />}><Magisterium /></Suspense>} />
              <Route path="/magisterio" element={<Navigate to="/magisterium" replace />} />
              <Route path="/magisterium/:id" element={<Suspense fallback={<LoadingFallback />}><Magisterium /></Suspense>} />
              <Route path="/buscar" element={<Suspense fallback={<LoadingFallback />}><GlobalSearchPage /></Suspense>} />
              <Route path="/search" element={<Navigate to="/buscar" replace />} />
              <Route path="/logos" element={<Suspense fallback={<LogosSkeleton />}><LogosAI variant="integrated" isOpen={true} onClose={() => navigate('/')} /></Suspense>} />

              <Route path="/chat" element={<Navigate to="/logos" replace />} />
              <Route path="/auth" element={<Suspense fallback={<LoadingFallback />}><Auth onSuccess={() => navigate('/')} /></Suspense>} />
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              <Route path="/reset-password" element={<Suspense fallback={<LoadingFallback />}><ResetPasswordPage /></Suspense>} />
              <Route path="/profile" element={<Suspense fallback={<LoadingFallback />}><AuthGuard><ProfilePage /></AuthGuard></Suspense>} />
              <Route path="/spiritual-profile" element={<Suspense fallback={<LoadingFallback />}><AuthGuard><SpiritualProfile /></AuthGuard></Suspense>} />
              <Route path="/onboarding" element={<Suspense fallback={<LoadingFallback />}><OnboardingPage /></Suspense>} />

              {/* Hoje & Diário */}
              <Route path="/hoje" element={<Suspense fallback={<LoadingFallback />}><HojePage /></Suspense>} />
              <Route path="/dashboard" element={<Navigate to="/hoje" replace />} />
              <Route path="/diario" element={<Suspense fallback={<LoadingFallback />}><AuthGuard><SpiritualJournalPage /></AuthGuard></Suspense>} />

              {/* Biblioteca */}
              <Route path="/biblioteca" element={<Suspense fallback={<LoadingFallback />}><BibliotecaPage /></Suspense>} />
              
              {/* Itineraria */}
              <Route path="/itineraria" element={<Suspense fallback={<LoadingFallback />}><ItinerariaPage /></Suspense>} />
              <Route path="/itineraria/:id" element={<Suspense fallback={<LoadingFallback />}><ItinerariumDetailPage /></Suspense>} />
              <Route path="/itineraria/:id/step" element={<Suspense fallback={<LoadingFallback />}><AuthGuard><ItinerariumStepPage /></AuthGuard></Suspense>} />

              <Route path="/temas" element={<Suspense fallback={<LoadingFallback />}><TemasPage /></Suspense>} />
              <Route path="/temas/:slug" element={<Suspense fallback={<LoadingFallback />}><TemaDetailPage /></Suspense>} />
              <Route path="/encyclopedia" element={<Suspense fallback={<LoadingFallback />}><AZFaithPage /></Suspense>} />
              <Route path="/az-faith" element={<Suspense fallback={<LoadingFallback />}><AZFaithPage /></Suspense>} />
              <Route path="/glossary" element={<Suspense fallback={<LoadingFallback />}><GlossaryPage /></Suspense>} />
              <Route path="/aquinas" element={<Suspense fallback={<LoadingFallback />}><AquinasOpera /></Suspense>} />
              <Route path="/guia-modulos" element={<Suspense fallback={<LoadingFallback />}><ModulesGuidePage /></Suspense>} />

              {/* Santos & Devoções */}
              <Route path="/santos" element={<Suspense fallback={<LoadingFallback />}><Saints /></Suspense>} />
              <Route path="/santos/:id" element={<Suspense fallback={<LoadingFallback />}><Saints /></Suspense>} />
              <Route path="/papas" element={<Suspense fallback={<LoadingFallback />}><PopesPage /></Suspense>} />
              <Route path="/aparicoes" element={<Suspense fallback={<LoadingFallback />}><AparicoesPage /></Suspense>} />
              <Route path="/dogmas" element={<Suspense fallback={<LoadingFallback />}><DogmasPage /></Suspense>} />

              {/* Liturgia & Oração */}
              <Route path="/liturgia" element={<Suspense fallback={<LoadingFallback />}><LiturgiaPage /></Suspense>} />
              <Route path="/calendar" element={<Suspense fallback={<LoadingFallback />}><LiturgicalCalendarPage /></Suspense>} />
              <Route path="/missal" element={<Suspense fallback={<LoadingFallback />}><MissalPage /></Suspense>} />
              <Route path="/breviary" element={<Suspense fallback={<LoadingFallback />}><BreviaryPage /></Suspense>} />
              <Route path="/rosary" element={<Suspense fallback={<LoadingFallback />}><Rosary /></Suspense>} />
              <Route path="/viacrucis" element={<Suspense fallback={<LoadingFallback />}><ViaCrucis /></Suspense>} />
              <Route path="/litanies" element={<Suspense fallback={<LoadingFallback />}><LitaniesPage /></Suspense>} />
              <Route path="/oracao" element={<Suspense fallback={<LoadingFallback />}><PrayerPage /></Suspense>} />
              <Route path="/prayers" element={<Navigate to="/oracao" replace />} />
              <Route path="/lectio" element={<Suspense fallback={<LoadingFallback />}><LectioDivina /></Suspense>} />
              <Route path="/confession" element={<Suspense fallback={<LoadingFallback />}><PoenitentiaPage /></Suspense>} />

              {/* Jornadas */}
              <Route path="/jornadas" element={<Suspense fallback={<LoadingFallback />}><JornadasPage /></Suspense>} />
              <Route path="/jornadas/:id" element={<Suspense fallback={<LoadingFallback />}><JornadaDetailPage /></Suspense>} />
              <Route path="/jornadas/:id/step" element={<Suspense fallback={<LoadingFallback />}><JornadaStepPage /></Suspense>} />
              <Route path="/jornadas/:id/complete" element={<Suspense fallback={<LoadingFallback />}><JornadaCompletePage /></Suspense>} />

              {/* Comunidade */}
              <Route path="/community" element={<Suspense fallback={<LoadingFallback />}><CommunityPage /></Suspense>} />

              {/* Conquistas & Favoritos */}
              <Route path="/favorites" element={<Suspense fallback={<LoadingFallback />}><AuthGuard><FavoritesPage /></AuthGuard></Suspense>} />
              <Route path="/achievements" element={<Suspense fallback={<LoadingFallback />}><AuthGuard><AchievementsPage /></AuthGuard></Suspense>} />

              {/* Monetização */}
              <Route path="/pricing" element={<Suspense fallback={<LoadingFallback />}><PricingPage /></Suspense>} />
              <Route path="/upgrade" element={<Suspense fallback={<LoadingFallback />}><UpgradePage /></Suspense>} />
              <Route path="/checkout" element={<Suspense fallback={<LoadingFallback />}><AuthGuard><CheckoutPage /></AuthGuard></Suspense>} />
              <Route path="/checkout/result" element={<Suspense fallback={<LoadingFallback />}><CheckoutResultPage /></Suspense>} />
              <Route path="/transactions" element={<Suspense fallback={<LoadingFallback />}><AuthGuard><UserTransactionsPage /></AuthGuard></Suspense>} />
              <Route path="/partners" element={<Suspense fallback={<LoadingFallback />}><PartnersPage /></Suspense>} />
              <Route path="/transparencia" element={<Suspense fallback={<LoadingFallback />}><TransparencyPage /></Suspense>} />

              {/* Institucional */}
              <Route path="/about" element={<Suspense fallback={<LoadingFallback />}><AboutPage /></Suspense>} />
              <Route path="/terms" element={<Suspense fallback={<LoadingFallback />}><TermsPage /></Suspense>} />
              <Route path="/privacy" element={<Suspense fallback={<LoadingFallback />}><PrivacyPage /></Suspense>} />
              <Route path="/offline" element={<Suspense fallback={<LoadingFallback />}><OfflinePage /></Suspense>} />
              <Route path="/cache-manager" element={<Suspense fallback={<LoadingFallback />}><CacheManager /></Suspense>} />

              {/* Admin Routes with dedicated Layout */}
              <Route path="/admin/*" element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminGuard>
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="/security" element={<SecurityDashboard />} />
                      <Route path="/seo-verify" element={<SEOVerificationPage />} />
                    </Routes>
                  </AdminGuard>
                </Suspense>
              } />

              <Route path="/design-system" element={<Suspense fallback={<LoadingFallback />}><DesignSystemGuide /></Suspense>} />


              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </AnimatePresence>
          </SwipeNavigation>
        </main>

        <BottomNav user={authUserAdapter} onOpenSidebar={handleOpenSidebar} />
        {location.pathname !== '/' && <div className="hidden md:block"><CathedralFooter /></div>}
        <Suspense fallback={null}>
          <A11ySettingsPanel 
            isOpen={showA11ySettings} 
            onClose={handleCloseA11y}
          />
          <ReadingPreferencesPanel 
            isOpen={showReadingPreferences} 
            onClose={handleCloseReadingPreferences} 
          />
          <CommandCenter />
          <PWAInstallPrompt />
        </Suspense>
        <OfflineIndicator />
      </div>
    </MotionConfig>
  );
};

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <HelmetProvider>
      <Sentry.ErrorBoundary fallback={<AppErrorBoundary children={<LoadingFallback />} />}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <LangProvider>
                <ReadingSettingsProvider>
                  <TooltipProvider>
                    {children}
                  </TooltipProvider>
                </ReadingSettingsProvider>
              </LangProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </Sentry.ErrorBoundary>
    </HelmetProvider>
  );
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(() => {
    try { return !sessionStorage.getItem('cathedra_splash_shown'); } catch { return true; }
  });
  
  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    try { 
      sessionStorage.setItem('cathedra_splash_shown', '1'); 
    } catch (error) {
      console.error('Failed to set splash screen flag:', error);
    }
  }, []);

  return (
    <AppProviders>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <AppLayout />
    </AppProviders>
  );
};

export default App;
