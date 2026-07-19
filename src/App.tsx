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
import DebugRequestPanel from './components/cathedra/DebugRequestPanel';
import * as Sentry from "@sentry/react";
import { toast } from 'sonner';

// Core UI components
import ReadingModeToggle from './components/cathedra/ReadingModeToggle';
import { ReadingSettingsProvider, useReadingSettings } from './contexts/ReadingSettingsContext';
import { initGA4AutoTracking } from './lib/analytics';

import CathedralSidebar from './components/cathedra/Sidebar';
const TheologicalTextFixture = lazy(() => import('./pages/__test/TheologicalTextFixture'));
const EditorialShowcase = lazy(() => import('./pages/dev/EditorialShowcase'));
const MobileShowcase = lazy(() => import('./pages/dev/MobileShowcase'));
import CathedralFooter from './components/cathedra/Footer';
import NotFound from './pages/NotFound';
import BottomNav from './components/cathedra/BottomNav';
import AppHeader from './components/cathedra/AppHeader';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useRenderPerf } from './hooks/useRenderPerf';
import { useA11yGuard } from './lib/a11y-guard';

import { BibleSkeleton, CatechismSkeleton, LogosSkeleton } from './components/cathedra/RouteSkeletons';
import BibleReadGate from './components/cathedra/BibleReadGate';

const CommandCenter = lazy(() => import('./components/cathedra/CommandCenter'));
const PWAInstallPrompt = lazy(() => import('./components/cathedra/PWAInstallPrompt').then(m => ({ default: m.PWAInstallPrompt })));
const A11ySettingsPanel = lazy(() => import('./components/cathedra/A11ySettingsPanel'));
const ReadingPreferencesPanel = lazy(() => import('./components/cathedra/ReadingPreferencesPanel').then(m => ({ default: m.ReadingPreferencesPanel })));

import OfflineIndicator from './components/cathedra/OfflineIndicator';
import SplashScreen from './components/cathedra/SplashScreen';
import { GlobalLogosAI } from './components/cathedra/GlobalLogosAI';
import AboveTheFoldTest from './components/cathedra/AboveTheFoldTest';

import SwipeNavigation from './components/cathedra/SwipeNavigation';
import ContrastInspector from './components/dev/ContrastInspector';

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
const MagisteriumViewer = lazy(() => import('./components/cathedra/MagisteriumViewer'));
const Auth = lazy(() => import('./components/cathedra/Auth'));
const ProfilePage = lazy(() => import('./components/cathedra/ProfilePage'));
const ProfileFavoritesPage = lazy(() => import('./pages/ProfileFavoritesPage'));
const GlobalSearchPage = lazy(() => import('./components/cathedra/GlobalSearchPage'));
const AtriumBuscarPage = lazy(() => import('./pages/AtriumBuscarPage'));
const Index = lazy(() => import('./pages/Index'));
const HomeUnified = lazy(() => import('./pages/HomeUnified'));
const AtriumHome = lazy(() => import('./pages/AtriumHome'));
const LogosAI = lazy(() => import('./components/cathedra/LogosAI'));
const SpiritualProfile = lazy(() => import('./components/cathedra/SpiritualProfile'));
const Saints = lazy(() => import('./components/cathedra/Saints'));

const HojePage = lazy(() => import('./components/cathedra/HojePage'));
const JornadasPage = lazy(() => import('./components/cathedra/JornadasPage'));
const AtriumJornadasPage = lazy(() => import('./pages/AtriumJornadasPage'));
const JornadaDetailPage = lazy(() => import('./components/cathedra/JornadaDetailPage'));
const JornadaStepPage = lazy(() => import('./components/cathedra/JornadaStepPage'));
const JornadaCompletePage = lazy(() => import('./components/cathedra/JornadaCompletePage'));
const ItinerariaPage = lazy(() => import('./components/cathedra/ItinerariaPage'));
const ItinerariumDetailPage = lazy(() => import('./components/cathedra/ItinerariumDetailPage'));
const ItinerariumStepPage = lazy(() => import('./components/cathedra/ItinerariumStepPage'));
const BibliotecaPage = lazy(() => import('./components/cathedra/BibliotecaPage'));
const AtriumBibliotecaPage = lazy(() => import('./pages/AtriumBibliotecaPage'));
const PadresRedirect = lazy(() => import('./pages/PadresRedirect'));
const AtriumBibleReader = lazy(() => import('./pages/AtriumBibleReader'));
const AtriumCatechismReader = lazy(() => import('./pages/AtriumCatechismReader'));
const AtriumNexusPage = lazy(() => import('./pages/AtriumNexusPage'));
const AtriumMagisteriumViewer = lazy(() => import('./pages/AtriumMagisteriumViewer'));

const CommunityPage = lazy(() => import('./components/cathedra/CommunityPage'));
const AtriumCommunityPage = lazy(() => import('./pages/AtriumCommunityPage'));
const AtriumCommunityPostPage = lazy(() => import('./pages/AtriumCommunityPostPage'));
const AtriumCommunityProfilePage = lazy(() => import('./pages/AtriumCommunityProfilePage'));
const LiturgiaPage = lazy(() => import('./components/cathedra/LiturgiaPage'));
const LiturgicalCalendarPage = lazy(() => import('./components/cathedra/LiturgicalCalendarPage'));
const MissalPage = lazy(() => import('./components/cathedra/MissalPage'));
import { DevocionalMobileShell } from './components/mobile/DevocionalMobileShell';
const BreviaryPage = lazy(() => import('./components/cathedra/BreviaryPage'));
const Rosary = lazy(() => import('./components/cathedra/Rosary'));
const ViaCrucis = lazy(() => import('./components/cathedra/ViaCrucis'));
const LitaniesPage = lazy(() => import('./components/cathedra/LitaniesPage'));
const PrayerPage = lazy(() => import('./components/cathedra/PrayerPage'));
const PrayerLibraryPage = lazy(() => import('./pages/PrayerLibraryPage'));
const PrayerDetailPage = lazy(() => import('./pages/PrayerDetailPage'));
const LectioDivina = lazy(() => import('./components/cathedra/LectioDivina'));
const ContemplatioPage = lazy(() => import('./pages/ContemplatioPage'));
const PoenitentiaPage = lazy(() => import('./components/cathedra/PoenitentiaPage'));
const DogmasPage = lazy(() => import('./components/cathedra/DogmasPage'));
const PopesPage = lazy(() => import('./components/cathedra/PopesPage'));
const AparicoesPage = lazy(() => import('./components/cathedra/AparicoesPage'));
const AquinasOpera = lazy(() => import('./components/cathedra/AquinasOpera'));
const AZFaithPage = lazy(() => import('./components/cathedra/AZFaithPage'));
const GlossaryPage = lazy(() => import('./components/cathedra/GlossaryPage'));
const GlossaryTermPage = lazy(() => import('./pages/GlossaryTermPage'));
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
const BibleRecoveryPanel = lazy(() => import('./pages/BibleRecoveryPanel'));
const AdminDashboard = lazy(() => import('./components/cathedra/AdminDashboard'));
const LanguageAdmin = lazy(() => import('./components/cathedra/LanguageAdmin'));
const BibleCoverageAdmin = lazy(() => import('./components/cathedra/BibleCoverageAdmin'));
const DesignSystemGuide = lazy(() => import('./components/cathedra/DesignSystemGuide'));
const SecurityDashboard = lazy(() => import('./pages/SecurityDashboard'));
const CidComplianceDashboardPage = lazy(() => import('./pages/CidComplianceDashboardPage'));
const BibleCacheAdminPage = lazy(() => import('./pages/BibleCacheAdminPage'));
const BiblePerfDashboard = lazy(() => import('./pages/BiblePerfDashboard'));
const BibleCacheTimeseriesDashboard = lazy(() => import('./components/cathedra/BibleCacheTimeseriesDashboard'));
const BiblePerfBreakdown = lazy(() => import('./pages/BiblePerfBreakdown'));
const BibleDiagnosticRuns = lazy(() => import('./pages/BibleDiagnosticRuns'));
const BibleSourcesAudit = lazy(() => import('./pages/BibleSourcesAudit'));
const BibleImportAdmin = lazy(() => import('./pages/BibleImportAdmin'));
const BibleSprint1Admin = lazy(() => import('./pages/BibleSprint1Admin'));
const SEOStatusPage = lazy(() => import('./pages/admin/SEOStatus'));
const SEOAdminPage = lazy(() => import('./pages/admin/SEOAdmin'));
const IntegrationsStatusPage = lazy(() => import('./pages/admin/IntegrationsStatus'));
const BibleTranslationsReadiness = lazy(() => import('./pages/admin/BibleTranslationsReadiness'));
const SaintsAdmin = lazy(() => import('./pages/admin/SaintsAdmin'));
const PgStatStatements = lazy(() => import('./pages/admin/PgStatStatements'));
const AxeContrastReport = lazy(() => import('./pages/admin/AxeContrastReport'));
const BibleImportMissing = lazy(() => import('./pages/admin/BibleImportMissing'));
const BibleGatePendencies = lazy(() => import('./pages/admin/BibleGatePendencies'));
const BibleImportJobs = lazy(() => import('./pages/admin/BibleImportJobs'));
const BibleImportJobDetail = lazy(() => import('./pages/admin/BibleImportJobDetail'));
const ClientErrors = lazy(() => import('./pages/admin/ClientErrors'));
const RuntimeErrors = lazy(() => import('./pages/admin/RuntimeErrors'));
const NexusAdmin = lazy(() => import('./pages/admin/NexusAdmin'));
const GlossaryAdmin = lazy(() => import('./pages/admin/GlossaryAdmin'));
const BibleAbbrValidatePage = lazy(() => import('./pages/BibleAbbrValidatePage'));
const SEOVerificationPage = lazy(() => import('./pages/SEOVerificationPage'));
const A11yAuditPage = lazy(() => import('./components/cathedra/A11yAuditPage'));
const VisualAuditPage = lazy(() => import('./components/cathedra/VisualAuditPage'));
const TelemetryDashboard = lazy(() => import('./components/cathedra/TelemetryDashboard'));
const NavigationErrorInspector = lazy(() => import('./components/cathedra/NavigationErrorInspector'));
const AuditDashboard = lazy(() => import('./pages/AuditDashboard'));
const IntegrityReport = lazy(() => import('./pages/IntegrityReport'));
const SecurityAlertsPage = lazy(() => import('./components/cathedra/SecurityAlertsPage'));

// Cathedra 2.0 — Protótipo navegável (isolado)
const PrototypeIndex = lazy(() => import('./pages/prototype-2.0/PrototypeIndex'));
const PrototypeAtrio = lazy(() => import('./pages/prototype-2.0/screens/Atrio'));
const PrototypeBiblioteca = lazy(() => import('./pages/prototype-2.0/screens/Biblioteca'));
const PrototypeEstudoComposto = lazy(() => import('./pages/prototype-2.0/screens/EstudoComposto'));
const PrototypeLeitor = lazy(() => import('./pages/prototype-2.0/screens/Leitor'));
const PrototypePesquisa = lazy(() => import('./pages/prototype-2.0/screens/Pesquisa'));
const PrototypeFormacao = lazy(() => import('./pages/prototype-2.0/screens/Formacao'));
const PrototypeRezar = lazy(() => import('./pages/prototype-2.0/screens/Rezar'));
const PrototypeMinhaJornada = lazy(() => import('./pages/prototype-2.0/screens/MinhaJornada'));

// Cathedra 2.0 — Ambiente Átrio (Sprint 2.0.1, preview isolado)
const AtriumPageV2 = lazy(() => import('./modules/atrium').then(m => ({ default: m.AtriumPage })));





const SkeletonBar = React.forwardRef<HTMLDivElement, { w?: string; h?: string; className?: string }>(
  ({ w = 'w-full', h = 'h-spacing-md', className = '' }, ref) => (
    <div ref={ref} className={`${w} ${h} rounded-premium-full bg-muted/60 animate-pulse ${className}`} />
  )
);
SkeletonBar.displayName = 'SkeletonBar';

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[70dvh] w-full p-spacing-xl animate-in fade-in duration-2000 ease-out">
    <div className="relative mb-spacing-4xl">
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.05, 0.2],
          filter: ["blur(30px)", "blur(60px)", "blur(30px)"]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 w-spacing-4xl h-spacing-4xl -left-spacing-md -top-spacing-md rounded-premium-full bg-primary/5" 
      />
      <div className="w-spacing-3xl h-spacing-3xl rounded-premium-full bg-primary/[0.01] border border-primary/[0.03] relative z-10 flex items-center justify-center">
         <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1], scale: [0.95, 1, 0.95] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-spacing-xl h-spacing-xl rounded-premium-full border border-primary/10"
        />
      </div>
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 w-spacing-3xl h-spacing-3xl rounded-premium-full border-t border-primary/[0.05] z-20" 
      />
    </div>
    <div className="space-y-spacing-2xl w-full flex flex-col items-center">
      <div className="h-[0.5px] w-spacing-4xl bg-primary/[0.03] rounded-premium-full overflow-hidden">
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
    // Erro de navegação: Garantir reset de scroll entre rotas no mobile
    window.scrollTo({ top: 0, behavior: 'instant' });
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
          className="sr-only focus:not-sr-only focus:fixed focus:top-spacing-lg focus:left-spacing-lg focus:z-[250] focus:px-spacing-lg focus:py-spacing-sm focus:bg-primary focus:text-primary-foreground focus:rounded-premium-full focus:shadow-premium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:ring-offset-background transition-all duration-300 font-bold uppercase tracking-[0.2em] text-[10px]"
        >
          {t('skip_to_content')}
        </a>


        <ScrollToTop />
        <AppErrorBoundary>
          {(!settings.immersiveMode || !location.pathname.startsWith('/bible')) && !location.pathname.startsWith('/prototype-2.0') && location.pathname !== '/' && location.pathname !== '/auth' && location.pathname !== '/login' && (
            <AppHeader 
              user={authUserAdapter} 
              isDark={isDark} 
              onToggleDark={toggleDark}
              lang={lang}
              onChangeLang={setLang}
              onSignOut={signOut}
              onOpenSidebar={handleOpenSidebar}
              isLanding={location.pathname === '/'}
            />
          )}
        
        {(!settings.immersiveMode || !location.pathname.startsWith('/bible')) && !location.pathname.startsWith('/prototype-2.0') && (
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
            onOpenA11y={handleOpenA11y}
            onSignOut={signOut}
          />
        )}
        
        <GlobalLogosAI />
        {/* Arquitetura estabilizada: Layout único, Card único, Navegação única e Tema único. */}

        <main id="main-content" ref={mainContentRef} tabIndex={-1} className="outline-none">
          <AboveTheFoldTest />
          <SwipeNavigation>
            <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
            <Routes location={location} key={location.pathname}>

              <Route path="/" element={<Suspense fallback={<LoadingFallback />}><AtriumHome /></Suspense>} />
              <Route path="/home-v3" element={<Suspense fallback={<LoadingFallback />}><HomeUnified /></Suspense>} />
              <Route path="/legacy-home" element={<Suspense fallback={<LoadingFallback />}><Index /></Suspense>} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="/dev/editorial" element={<Suspense fallback={<LoadingFallback />}><EditorialShowcase /></Suspense>} />
              <Route path="/dev/mobile" element={<Suspense fallback={<LoadingFallback />}><MobileShowcase /></Suspense>} />


              <Route path="/bible" element={<Suspense fallback={<BibleSkeleton />}><AtriumBibleReader /></Suspense>} />
              <Route path="/bible-legacy" element={<Suspense fallback={<BibleSkeleton />}><BibleReadGate><Bible /></BibleReadGate></Suspense>} />
              <Route path="/biblia" element={<Navigate to="/bible" replace />} />
              <Route path="/catechism" element={<Suspense fallback={<CatechismSkeleton />}><AtriumCatechismReader /></Suspense>} />
              <Route path="/catechism-legacy" element={<Suspense fallback={<CatechismSkeleton />}><Catechism /></Suspense>} />
              <Route path="/catecismo" element={<Navigate to="/catechism" replace />} />
              <Route path="/magisterium" element={<Suspense fallback={<LoadingFallback />}><Magisterium /></Suspense>} />
              <Route path="/magisterio" element={<Navigate to="/magisterium" replace />} />
              <Route path="/magisterium/:id" element={<Suspense fallback={<LoadingFallback />}><AtriumMagisteriumViewer /></Suspense>} />
              <Route path="/magisterium-legacy/:id" element={<Suspense fallback={<LoadingFallback />}><MagisteriumViewer /></Suspense>} />

              <Route path="/buscar" element={<Suspense fallback={<LoadingFallback />}><AtriumBuscarPage /></Suspense>} />
              <Route path="/buscar-legacy" element={<Suspense fallback={<LoadingFallback />}><GlobalSearchPage /></Suspense>} />
              <Route path="/search" element={<Navigate to="/buscar" replace />} />
              <Route path="/logos" element={<Suspense fallback={<LogosSkeleton />}><LogosAI variant="integrated" isOpen={true} onClose={() => navigate('/')} /></Suspense>} />

              <Route path="/chat" element={<Navigate to="/logos" replace />} />
              <Route path="/auth" element={<Suspense fallback={<LoadingFallback />}><Auth onSuccess={() => navigate('/')} /></Suspense>} />
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              <Route path="/reset-password" element={<Suspense fallback={<LoadingFallback />}><ResetPasswordPage /></Suspense>} />
              <Route path="/profile" element={<Suspense fallback={<LoadingFallback />}><AuthGuard><ProfilePage /></AuthGuard></Suspense>} />
              <Route path="/profile/favorites" element={<Suspense fallback={<LoadingFallback />}><AuthGuard><ProfileFavoritesPage /></AuthGuard></Suspense>} />
              <Route path="/spiritual-profile" element={<Suspense fallback={<LoadingFallback />}><AuthGuard><SpiritualProfile /></AuthGuard></Suspense>} />
              <Route path="/onboarding" element={<Suspense fallback={<LoadingFallback />}><OnboardingPage /></Suspense>} />

              {/* Hoje & Diário */}
              <Route path="/hoje" element={<Suspense fallback={<LoadingFallback />}><HojePage /></Suspense>} />
              <Route path="/dashboard" element={<Navigate to="/hoje" replace />} />
              <Route path="/diario" element={<Suspense fallback={<LoadingFallback />}><AuthGuard><SpiritualJournalPage /></AuthGuard></Suspense>} />

              {/* Biblioteca */}
              <Route path="/biblioteca" element={<Suspense fallback={<LoadingFallback />}><AtriumBibliotecaPage /></Suspense>} />
              <Route path="/biblioteca-legacy" element={<Suspense fallback={<LoadingFallback />}><BibliotecaPage /></Suspense>} />
              {/* Rota canônica dos Padres/Doutores — redireciona para /santos/:id (mesma fonte de dados). */}
              <Route path="/biblioteca/padres/:slug" element={<Suspense fallback={<LoadingFallback />}><PadresRedirect /></Suspense>} />

              
              {/* Itineraria */}
              <Route path="/itineraria" element={<Suspense fallback={<LoadingFallback />}><ItinerariaPage /></Suspense>} />
              <Route path="/itineraria/:id" element={<Suspense fallback={<LoadingFallback />}><ItinerariumDetailPage /></Suspense>} />
              <Route path="/itineraria/:id/step" element={<Suspense fallback={<LoadingFallback />}><AuthGuard><ItinerariumStepPage /></AuthGuard></Suspense>} />

              <Route path="/temas" element={<Suspense fallback={<LoadingFallback />}><TemasPage /></Suspense>} />
              <Route path="/temas/:slug" element={<Suspense fallback={<LoadingFallback />}><TemaDetailPage /></Suspense>} />
              {/* Glossário — rota canônica /glossario + redirects legados */}
              <Route path="/glossario" element={<Suspense fallback={<LoadingFallback />}><GlossaryPage /></Suspense>} />
              <Route path="/glossario/:slug" element={<Suspense fallback={<LoadingFallback />}><GlossaryTermPage /></Suspense>} />
              <Route path="/glossary" element={<Navigate to="/glossario" replace />} />
              <Route path="/glossary/:slug" element={<Navigate to="/glossario" replace />} />
              <Route path="/az-faith" element={<Navigate to="/glossario" replace />} />
              <Route path="/encyclopedia" element={<Navigate to="/glossario" replace />} />

              <Route path="/aquinas" element={<Suspense fallback={<LoadingFallback />}><AquinasOpera /></Suspense>} />
              <Route path="/guia-modulos" element={<Suspense fallback={<LoadingFallback />}><ModulesGuidePage /></Suspense>} />

              {/* Santos & Devoções */}
              <Route path="/santos" element={<Suspense fallback={<LoadingFallback />}><Saints /></Suspense>} />
              <Route path="/santos/:id" element={<Suspense fallback={<LoadingFallback />}><Saints /></Suspense>} />
              <Route path="/saints-legacy/:id" element={<Suspense fallback={<LoadingFallback />}><Saints legacyReader /></Suspense>} />
              <Route path="/papas" element={<Suspense fallback={<LoadingFallback />}><PopesPage /></Suspense>} />
              <Route path="/aparicoes" element={<Suspense fallback={<LoadingFallback />}><AparicoesPage /></Suspense>} />
              <Route path="/dogmas" element={<Suspense fallback={<LoadingFallback />}><DogmasPage /></Suspense>} />

              {/* Liturgia & Oração */}
              <Route path="/liturgia" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Liturgia"><LiturgiaPage /></DevocionalMobileShell></Suspense>} />
              <Route path="/calendar" element={<Suspense fallback={<LoadingFallback />}><LiturgicalCalendarPage /></Suspense>} />
              <Route path="/missal" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Missal" kicker="Cathedra · Missal"><MissalPage /></DevocionalMobileShell></Suspense>} />
              <Route path="/breviary" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Breviário" kicker="Cathedra · Liturgia das Horas"><BreviaryPage /></DevocionalMobileShell></Suspense>} />
              <Route path="/rosary" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Rosário" kicker="Cathedra · Rosário"><Rosary /></DevocionalMobileShell></Suspense>} />
              <Route path="/viacrucis" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Via Crucis" kicker="Cathedra · Via Crucis"><ViaCrucis /></DevocionalMobileShell></Suspense>} />
              <Route path="/litanies" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Ladainhas" kicker="Cathedra · Ladainhas"><LitaniesPage /></DevocionalMobileShell></Suspense>} />
              <Route path="/oracao" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Livro de Orações" kicker="Cathedra · Orações"><PrayerLibraryPage /></DevocionalMobileShell></Suspense>} />
              <Route path="/oracao/:slug" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Oração" kicker="Cathedra · Orações"><PrayerDetailPage /></DevocionalMobileShell></Suspense>} />
              <Route path="/oracao-legacy" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Oração" kicker="Cathedra · Orações (legado)"><PrayerPage /></DevocionalMobileShell></Suspense>} />
              <Route path="/prayers" element={<Navigate to="/oracao" replace />} />
              <Route path="/rezar" element={<Navigate to="/oracao" replace />} />
              <Route path="/lectio" element={<Suspense fallback={<LoadingFallback />}><LectioDivina /></Suspense>} />
              <Route path="/contemplatio" element={<Suspense fallback={<LoadingFallback />}><ContemplatioPage /></Suspense>} />
              <Route path="/contemplacao" element={<Navigate to="/contemplatio" replace />} />
              <Route path="/confession" element={<Suspense fallback={<LoadingFallback />}><PoenitentiaPage /></Suspense>} />

              {/* Jornadas */}
              <Route path="/jornadas" element={<Suspense fallback={<LoadingFallback />}><AtriumJornadasPage /></Suspense>} />
              <Route path="/jornadas-legacy" element={<Suspense fallback={<LoadingFallback />}><JornadasPage /></Suspense>} />
              <Route path="/jornadas/:id" element={<Suspense fallback={<LoadingFallback />}><JornadaDetailPage /></Suspense>} />
              <Route path="/jornadas/:id/step" element={<Suspense fallback={<LoadingFallback />}><JornadaStepPage /></Suspense>} />
              <Route path="/jornadas/:id/complete" element={<Suspense fallback={<LoadingFallback />}><JornadaCompletePage /></Suspense>} />
              <Route path="/jornadas/:id/conclusao" element={<Suspense fallback={<LoadingFallback />}><JornadaCompletePage /></Suspense>} />

              {/* Comunidade */}
              <Route path="/community" element={<Suspense fallback={<LoadingFallback />}><AtriumCommunityPage /></Suspense>} />
              <Route path="/community/post/:id" element={<Suspense fallback={<LoadingFallback />}><AtriumCommunityPostPage /></Suspense>} />
              <Route path="/community/user/:userId" element={<Suspense fallback={<LoadingFallback />}><AtriumCommunityProfilePage /></Suspense>} />
              <Route path="/community-legacy" element={<Suspense fallback={<LoadingFallback />}><CommunityPage /></Suspense>} />

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
              <Route path="/bible-recovery" element={<Suspense fallback={<LoadingFallback />}><BibleRecoveryPanel /></Suspense>} />

              {/* Aliases para navegação legada (mantém botões da Sidebar/BottomNav/CommandCenter funcionando) */}
              <Route path="/library" element={<Navigate to="/biblioteca" replace />} />
              <Route path="/prayer" element={<Navigate to="/oracao" replace />} />
              <Route path="/via-crucis" element={<Navigate to="/viacrucis" replace />} />
              <Route path="/journeys" element={<Navigate to="/jornadas" replace />} />
              <Route path="/notes" element={<Navigate to="/diario" replace />} />
              <Route path="/telemetry" element={<Navigate to="/admin/telemetry" replace />} />
              <Route path="/security" element={<Navigate to="/admin/security" replace />} />
              <Route path="/catechism-explorer" element={<Navigate to="/catechism" replace />} />
              <Route path="/formacao" element={<Navigate to="/jornadas" replace />} />
              <Route path="/formar-se" element={<Navigate to="/jornadas" replace />} />
              <Route path="/minha-jornada" element={<Navigate to="/jornadas" replace />} />
              <Route path="/pesquisar" element={<Navigate to="/buscar" replace />} />
              <Route path="/search" element={<Navigate to="/buscar" replace />} />
              <Route path="/oracoes" element={<Navigate to="/oracao" replace />} />
              <Route path="/orar" element={<Navigate to="/oracao" replace />} />
              <Route path="/rosario" element={<Navigate to="/rosary" replace />} />
              <Route path="/via-sacra" element={<Navigate to="/viacrucis" replace />} />
              <Route path="/glossary" element={<Navigate to="/glossario" replace />} />
              <Route path="/today" element={<Navigate to="/hoje" replace />} />
              <Route path="/saints" element={<Navigate to="/santos" replace />} />
              <Route path="/liturgy" element={<Navigate to="/liturgia" replace />} />

              {/* Nexus público — Etapa 7 */}
              <Route path="/nexus" element={<Suspense fallback={<LoadingFallback />}><AtriumNexusPage /></Suspense>} />



              {/* Admin Routes with dedicated Layout */}
              <Route path="/admin/*" element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminGuard>
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="/security" element={<SecurityDashboard />} />
                      <Route path="/cid-compliance" element={<CidComplianceDashboardPage />} />
                      <Route path="/language" element={<LanguageAdmin />} />
                      <Route path="/seo-verify" element={<SEOVerificationPage />} />
                      <Route path="/a11y-audit" element={<A11yAuditPage />} />
                      <Route path="/visual-audit" element={<VisualAuditPage />} />
                      <Route path="/telemetry" element={<TelemetryDashboard />} />
                      <Route path="/ui-errors" element={<NavigationErrorInspector />} />
                      <Route path="/audit" element={<AuditDashboard />} />
                      <Route path="/integrity" element={<IntegrityReport />} />
                      <Route path="/security-alerts" element={<SecurityAlertsPage />} />
                      <Route path="/bible-coverage" element={<BibleCoverageAdmin />} />
                      <Route path="/bible-cache" element={<BibleCacheAdminPage />} />
                      <Route path="/bible-abbr-validate" element={<BibleAbbrValidatePage />} />
                      <Route path="/bible-perf" element={<BiblePerfDashboard />} />
                      <Route path="/admin/bible-cache-timeseries" element={<BibleCacheTimeseriesDashboard />} />
                     <Route path="/bible-perf-breakdown" element={<BiblePerfBreakdown />} />
                     <Route path="/admin/bible-perf-breakdown" element={<BiblePerfBreakdown />} />
                     <Route path="/bible-sources" element={<BibleSourcesAudit />} />
                      <Route path="/admin/bible-sources" element={<BibleSourcesAudit />} />
                      <Route path="/admin/bible-diagnostic-runs" element={<BibleDiagnosticRuns />} />
                      <Route path="/admin/bible-import" element={<BibleImportAdmin />} />
                      <Route path="/bible-import" element={<BibleImportAdmin />} />
                      <Route path="/admin/bible-import-missing" element={<BibleImportMissing />} />
                      <Route path="/admin/bible-import-jobs" element={<BibleImportJobs />} />
                      <Route path="/admin/bible-import-jobs/:id" element={<BibleImportJobDetail />} />
                      <Route path="/admin/bible-gate-pendencies" element={<BibleGatePendencies />} />
                      <Route path="/admin/client-errors" element={<ClientErrors />} />
                      <Route path="/admin/bible-sprint1" element={<BibleSprint1Admin />} />
                      <Route path="/seo-status" element={<SEOStatusPage />} />
                      <Route path="/admin/seo-status" element={<SEOStatusPage />} />
                      <Route path="/admin/seo" element={<SEOAdminPage />} />
                      <Route path="/admin/integrations" element={<IntegrationsStatusPage />} />
                      <Route path="/admin/bible-translations-readiness" element={<BibleTranslationsReadiness />} />
                      <Route path="/admin/saints" element={<SaintsAdmin />} />
                      <Route path="/admin/pg-stat-statements" element={<PgStatStatements />} />
                      <Route path="/axe-contrast" element={<AxeContrastReport />} />
                      <Route path="/admin/nexus" element={<NexusAdmin />} />
                      <Route path="/admin/glossary" element={<GlossaryAdmin />} />
                      <Route path="/admin/glossario" element={<GlossaryAdmin />} />






                    </Routes>
                  </AdminGuard>
                </Suspense>
              } />

              <Route path="/design-system" element={<Suspense fallback={<LoadingFallback />}><DesignSystemGuide /></Suspense>} />

              {!import.meta.env.PROD && (
                <Route path="/__test/theological-text" element={<Suspense fallback={<LoadingFallback />}><TheologicalTextFixture /></Suspense>} />
              )}

              {/* Cathedra 2.0 — Protótipo navegável (isolado, sem chrome do app 1.0) */}
              <Route path="/prototype-2.0" element={<Suspense fallback={<LoadingFallback />}><PrototypeIndex /></Suspense>} />
              <Route path="/prototype-2.0/atrio" element={<Suspense fallback={<LoadingFallback />}><PrototypeAtrio /></Suspense>} />
              <Route path="/prototype-2.0/estudar" element={<Suspense fallback={<LoadingFallback />}><PrototypeBiblioteca /></Suspense>} />
              <Route path="/prototype-2.0/estudar/tema/:slug" element={<Suspense fallback={<LoadingFallback />}><PrototypeEstudoComposto /></Suspense>} />
              <Route path="/prototype-2.0/leitor" element={<Suspense fallback={<LoadingFallback />}><PrototypeLeitor /></Suspense>} />
              <Route path="/prototype-2.0/pesquisar" element={<Suspense fallback={<LoadingFallback />}><PrototypePesquisa /></Suspense>} />
              <Route path="/prototype-2.0/formar-se" element={<Suspense fallback={<LoadingFallback />}><PrototypeFormacao /></Suspense>} />
              <Route path="/prototype-2.0/rezar" element={<Suspense fallback={<LoadingFallback />}><PrototypeRezar /></Suspense>} />
              <Route path="/prototype-2.0/minha-jornada" element={<Suspense fallback={<LoadingFallback />}><PrototypeMinhaJornada /></Suspense>} />
              {/* Preview isolado do Ambiente Átrio (Sprint 2.0.1). Rota / continua no 1.x até 2.0.6. */}
              <Route path="/prototype-2.0/atrium-v2" element={<Suspense fallback={<LoadingFallback />}><AtriumPageV2 /></Suspense>} />

              <Route path="*" element={<NotFound />} />


            </Routes>
            </AnimatePresence>
          </SwipeNavigation>
        </main>

        {(!settings.immersiveMode || !location.pathname.startsWith('/bible')) && !location.pathname.startsWith('/prototype-2.0') && location.pathname !== '/' && location.pathname !== '/auth' && location.pathname !== '/login' && <BottomNav user={authUserAdapter} onOpenSidebar={handleOpenSidebar} />}
        </AppErrorBoundary>
        {(!settings.immersiveMode || !location.pathname.startsWith('/bible')) && !location.pathname.startsWith('/prototype-2.0') && <CathedralFooter />}

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
        <DebugRequestPanel />
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
      <ContrastInspector />
    </AppProviders>
  );
};

export default App;
