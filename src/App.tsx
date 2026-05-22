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

import { BibleSkeleton, CatechismSkeleton, LogosSkeleton } from './components/cathedra/RouteSkeletons';

const CommandCenter = lazy(() => import('./components/cathedra/CommandCenter'));
const PWAInstallPrompt = lazy(() => import('./components/cathedra/PWAInstallPrompt').then(m => ({ default: m.PWAInstallPrompt })));
const A11ySettingsPanel = lazy(() => import('./components/cathedra/A11ySettingsPanel'));

import OfflineIndicator from './components/cathedra/OfflineIndicator';
import SplashScreen from './components/cathedra/SplashScreen';

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

// Lazy loaded routes with better naming
const Bible = lazy(() => import('./components/cathedra/Bible'));
const Catechism = lazy(() => import('./components/cathedra/Catechism'));
const Magisterium = lazy(() => import('./components/cathedra/Magisterium'));
const Auth = lazy(() => import('./components/cathedra/Auth'));
const ProfilePage = lazy(() => import('./components/cathedra/ProfilePage'));
const GlobalSearchPage = lazy(() => import('./components/cathedra/GlobalSearchPage'));
const Index = lazy(() => import('./pages/Index'));
const LogosAI = lazy(() => import('./components/cathedra/LogosAI'));
const Saints = lazy(() => import('./components/cathedra/Saints'));
const HojePage = lazy(() => import('./components/cathedra/HojePage'));
const JornadasPage = lazy(() => import('./components/cathedra/JornadasPage'));
const BibliotecaPage = lazy(() => import('./components/cathedra/BibliotecaPage'));
const CommunityPage = lazy(() => import('./components/cathedra/CommunityPage'));


const SkeletonBar = React.forwardRef<HTMLDivElement, { w?: string; h?: string; className?: string }>(
  ({ w = 'w-full', h = 'h-4', className = '' }, ref) => (
    <div ref={ref} className={`${w} ${h} rounded-full bg-muted/60 animate-pulse ${className}`} />
  )
);
SkeletonBar.displayName = 'SkeletonBar';

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[60dvh] w-full p-6 animate-in fade-in duration-1000">
    <div className="relative mb-12">
      <div className="w-16 h-16 rounded-full bg-primary/[0.03] border border-primary/5 animate-pulse" />
      <div className="absolute inset-0 w-16 h-16 rounded-full border-t-2 border-primary/20 animate-spin [animation-duration:3s]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-primary/20 animate-pulse" />
      </div>
    </div>
    <div className="space-y-6 w-full max-w-sm">
      <div className="h-0.5 w-full bg-primary/5 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-primary/20"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary/20 text-center">
        Contemplando...
      </p>
    </div>
  </div>
);

const AppLayout: React.FC = () => {
  useRenderPerf('AppLayout', 10);
  const { settings, updateSettings } = useReadingSettings();
  const { lang, setLang, t } = useContext(LangContext);
  
  useEffect(() => {
    const handleGlobalLang = (e: any) => {
      if (e.detail) setLang(e.detail);
    };
    window.addEventListener('change-lang', handleGlobalLang);
    return () => window.removeEventListener('change-lang', handleGlobalLang);
  }, [setLang]);
  const [showA11ySettings, setShowA11ySettings] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDark = settings.theme === 'dark' || settings.theme === 'night';
  const isHighContrast = settings.highContrast;

  const toggleDark = useCallback(() => {
    updateSettings({ theme: settings.theme === 'dark' || settings.theme === 'night' ? 'paper' : 'dark' });
  }, [settings.theme, updateSettings]);

  const toggleHighContrast = useCallback(() => {
    updateSettings({ highContrast: !isHighContrast });
  }, [isHighContrast, updateSettings]);

  const handleOpenSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const handleCloseSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const handleOpenA11y = useCallback(() => setShowA11ySettings(true), []);
  const handleCloseA11y = useCallback(() => setShowA11ySettings(false), []);

  useEffect(() => {
    const handleOpenA11yGlobal = () => setShowA11ySettings(true);
    window.addEventListener('open-a11y-settings', handleOpenA11yGlobal);
    return () => window.removeEventListener('open-a11y-settings', handleOpenA11yGlobal);
  }, []);

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
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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

        <main id="main-content" className={cn(location.pathname === '/' ? "p-0 max-w-none" : "pb-24 pt-20 px-4 md:px-8 max-w-7xl mx-auto min-h-screen")}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Suspense fallback={<LoadingFallback />}><Index /></Suspense>} />
              <Route path="/bible" element={<Suspense fallback={<BibleSkeleton />}><Bible /></Suspense>} />
              <Route path="/catechism" element={<Suspense fallback={<CatechismSkeleton />}><Catechism /></Suspense>} />
              <Route path="/magisterium" element={<Suspense fallback={<LoadingFallback />}><Magisterium /></Suspense>} />
              <Route path="/buscar" element={<Suspense fallback={<LoadingFallback />}><GlobalSearchPage /></Suspense>} />
              <Route path="/logos" element={<Suspense fallback={<LogosSkeleton />}><LogosAI variant="integrated" isOpen={true} onClose={() => navigate('/')} /></Suspense>} />
              <Route path="/chat" element={<Navigate to="/logos" replace />} />
              <Route path="/auth" element={<Suspense fallback={<LoadingFallback />}><Auth onSuccess={() => navigate('/')} /></Suspense>} />
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              <Route path="/profile" element={<Suspense fallback={<LoadingFallback />}><ProfilePage /></Suspense>} />
              <Route path="/santos" element={<Suspense fallback={<LoadingFallback />}><Saints /></Suspense>} />
              <Route path="/hoje" element={<Suspense fallback={<LoadingFallback />}><HojePage /></Suspense>} />
              <Route path="/jornadas" element={<Suspense fallback={<LoadingFallback />}><JornadasPage /></Suspense>} />
              <Route path="/biblioteca" element={<Suspense fallback={<LoadingFallback />}><BibliotecaPage /></Suspense>} />
              <Route path="/community" element={<Suspense fallback={<LoadingFallback />}><CommunityPage /></Suspense>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>

        {location.pathname !== '/' && <BottomNav user={authUserAdapter} onOpenSidebar={handleOpenSidebar} />}
        {location.pathname !== '/' && <CathedralFooter />}
        <Suspense fallback={null}>
          <A11ySettingsPanel 
            isOpen={showA11ySettings} 
            onClose={handleCloseA11y}
            isDark={isDark}
            onToggleDark={toggleDark}
            isHighContrast={isHighContrast}
            onToggleHighContrast={toggleHighContrast}
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
