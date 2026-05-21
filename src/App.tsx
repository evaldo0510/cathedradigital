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
import * as Sentry from "@sentry/react";
import { toast } from 'sonner';

// Core UI components (not lazy to ensure layout is instant)
import ReadingModeToggle from './components/cathedra/ReadingModeToggle';
import A11ySettingsPanel from './components/cathedra/A11ySettingsPanel';
import { ReadingSettingsProvider } from './contexts/ReadingSettingsContext';
import { initGA4AutoTracking } from './lib/analytics';

import PageTransition from './components/PageTransition';
import CathedralSidebar from './components/cathedra/Sidebar';
import CathedralFooter from './components/cathedra/Footer';
import BottomNav from './components/cathedra/BottomNav';
import AppHeader from './components/cathedra/AppHeader';
import ProGate from './components/cathedra/ProGate';
import { TooltipProvider } from '@/components/ui/tooltip';
import CommandCenter from './components/cathedra/CommandCenter';
import OfflineIndicator from './components/cathedra/OfflineIndicator';
import OfflineModeToggle from './components/cathedra/OfflineModeToggle';
import SplashScreen from './components/cathedra/SplashScreen';
import { PWAInstallPrompt } from './components/cathedra/PWAInstallPrompt';

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

const Bible = lazy(() => import('./components/cathedra/Bible'));
const Catechism = lazy(() => import('./components/cathedra/Catechism'));
const StudyMode = lazy(() => import('./components/cathedra/StudyMode'));
const Saints = lazy(() => import('./components/cathedra/Saints'));
const Magisterium = lazy(() => import('./components/cathedra/Magisterium'));
const ViaCrucis = lazy(() => import('./components/cathedra/ViaCrucis'));
const Rosary = lazy(() => import('./components/cathedra/Rosary'));
const PrayerPage = lazy(() => import('./components/cathedra/PrayerPage'));
const Auth = lazy(() => import('./components/cathedra/Auth'));
const AquinasOpera = lazy(() => import('./components/cathedra/AquinasOpera'));
const Certamen = lazy(() => import('./components/cathedra/Certamen'));
const LiturgiaPage = lazy(() => import('./components/cathedra/LiturgiaPage'));
const FavoritesPage = lazy(() => import('./components/cathedra/FavoritesPage'));
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
const VisualAuditPage = lazy(() => import('./components/cathedra/VisualAuditPage'));
const VisualRegressionDashboard = lazy(() => import('./components/cathedra/VisualRegressionDashboard'));
const SEOVerificationPage = lazy(() => import('./pages/SEOVerificationPage'));
const GuidedReadingPage = lazy(() => import('./pages/GuidedReading'));
const CatechismDebug = lazy(() => import('./components/cathedra/CatechismDebug'));
const CatechismIntegrity = lazy(() => import('./components/cathedra/CatechismIntegrity'));
const CatechismVerification = lazy(() => import('./components/cathedra/CatechismVerification'));
const PartnersPage = lazy(() => import('./components/cathedra/PartnersPage'));
const TransparencyPage = lazy(() => import('./components/cathedra/TransparencyPage'));
const OfflinePage = lazy(() => import('./components/cathedra/OfflinePage'));
const CacheManager = lazy(() => import('./components/cathedra/CacheManager'));
const DesignSystemGuide = lazy(() => import('./components/cathedra/DesignSystemGuide'));
const SpiritualJournalPage = lazy(() => import('./components/cathedra/ReadingJournal'));

const SkeletonBar = React.forwardRef<HTMLDivElement, { w?: string; h?: string; className?: string }>(
  ({ w = 'w-full', h = 'h-4', className = '' }, ref) => (
    <div ref={ref} className={`${w} ${h} rounded-full bg-muted/60 animate-pulse ${className}`} />
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
    </div>
  </div>
);

const AppLayout: React.FC = () => {
  const [lang, setLangState] = useState<Language>(() => (localStorage.getItem('cathedra_lang') as Language) || 'pt');
  const [isDark, setIsDark] = useState(() => localStorage.getItem('cathedra_theme') === 'dark');
  const [isHighContrast, setIsHighContrast] = useState(() => localStorage.getItem('cathedra_high_contrast') === 'true');
  const [showA11ySettings, setShowA11ySettings] = useState(false);
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
    if (isHighContrast) root.classList.add('high-contrast'); else root.classList.remove('high-contrast');
    localStorage.setItem('cathedra_theme', isDark ? 'dark' : 'light');
    localStorage.setItem('cathedra_high_contrast', isHighContrast ? 'true' : 'false');
  }, [isDark, isHighContrast]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      <ScrollToTop />
      <LangContext.Provider value={{ lang, setLang: setLangState, t: (k) => UI_TRANSLATIONS[lang]?.[k] || k }}>
        <ReadingSettingsProvider>
          <TooltipProvider>
            <AppHeader onOpenA11y={() => setShowA11ySettings(true)} />
            <CathedralSidebar />
            <main id="main-content" className="pb-24 pt-20 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
              <Suspense fallback={<LoadingFallback />}>
                <AnimatePresence mode="wait">
                  <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<Index />} />
                    <Route path="/hoje" element={<HojePage />} />
                    <Route path="/bible" element={<Bible />} />
                    <Route path="/catechism" element={<Catechism />} />
                    <Route path="/study" element={<StudyMode />} />
                    <Route path="/saints" element={<Saints />} />
                    <Route path="/magisterium" element={<Magisterium />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AnimatePresence>
              </Suspense>
            </main>
            <BottomNav />
            <CathedralFooter />
            <A11ySettingsPanel open={showA11ySettings} onOpenChange={setShowA11ySettings} />
            <CommandCenter />
            <PWAInstallPrompt />
            <OfflineIndicator />
          </TooltipProvider>
        </ReadingSettingsProvider>
      </LangContext.Provider>
    </div>
  );
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(() => {
    try { return !sessionStorage.getItem('cathedra_splash_shown'); } catch { return true; }
  });
  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    try { sessionStorage.setItem('cathedra_splash_shown', '1'); } catch {}
  }, []);

  return (
    <Sentry.ErrorBoundary fallback={<AppErrorBoundary children={<div />} />}>
      <HelmetProvider>
        <AppErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <AuthProvider>
                {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
                <AppLayout />
              </AuthProvider>
            </BrowserRouter>
          </QueryClientProvider>
        </AppErrorBoundary>
      </HelmetProvider>
    </Sentry.ErrorBoundary>
  );
};

export default App;
