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

// Core UI components
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

// Lazy loaded routes
const Bible = lazy(() => import('./components/cathedra/Bible'));
const Catechism = lazy(() => import('./components/cathedra/Catechism'));
const Magisterium = lazy(() => import('./components/cathedra/Magisterium'));
const Auth = lazy(() => import('./components/cathedra/Auth'));
const ProfilePage = lazy(() => import('./components/cathedra/ProfilePage'));

const GlobalSearchPage = lazy(() => import('./components/cathedra/GlobalSearchPage'));
const Index = lazy(() => import('./pages/Index'));

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
    <div className="w-full max-sm space-y-4">
      <SkeletonBar w="w-3/4 mx-auto" h="h-5" />
      <SkeletonBar w="w-full" h="h-3" className="opacity-50" />
    </div>
  </div>
);

const AppLayout: React.FC = () => {
  const { settings, updateSettings } = useReadingSettings();
  const [lang, setLangState] = useState<Language>(() => (localStorage.getItem('cathedra_lang') as Language) || 'pt');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDark = settings.theme === 'dark' || settings.theme === 'night';
  const isHighContrast = settings.highContrast;

  const toggleDark = useCallback(() => {
    updateSettings({ theme: isDark ? 'paper' : 'dark' });
  }, [isDark, updateSettings]);

  const toggleHighContrast = useCallback(() => {
    updateSettings({ highContrast: !isHighContrast });
  }, [isHighContrast, updateSettings]);

  const toggleSpeak = useCallback(() => {
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
  }, [lang]);

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
      joinedAt: new Date().toISOString(), // Mocking missing fields
      progress: {
        streak: profile.streak || 0,
        totalMinutesRead: 0,
        completedBooks: [],
        xp: profile.xp || 0,
        level: 1,
        badges: []
      },
      stats: {
        versesSaved: 0,
        studiesPerformed: 0,
        daysActive: profile.streak || 0
      }
    };
  }, [profile]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      <ScrollToTop />
      <LangContext.Provider value={{ lang, setLang: setLangState, t: (k) => UI_TRANSLATIONS[lang]?.[k] || k }}>
        <ReadingSettingsProvider>
            <AppHeader 
              user={authUserAdapter} 
              isDark={isDark} 
              onToggleDark={toggleDark}
              lang={lang}
              onChangeLang={setLangState}
              onSignOut={signOut}
              onOpenSidebar={() => setIsSidebarOpen(true)}
            />
            
            <CathedralSidebar 
              user={authUserAdapter}
              onClose={() => setIsSidebarOpen(false)}
              isDark={isDark}
              onToggleDark={toggleDark}
              isHighContrast={isHighContrast}
              onToggleHighContrast={toggleHighContrast}
              isSpeaking={isSpeaking}
              onToggleSpeak={toggleSpeak}
              onSignOut={signOut}
            />

            <main id="main-content" className="pb-24 pt-20 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
              <Suspense fallback={<LoadingFallback />}>
                <AnimatePresence mode="wait">
                  <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<Index />} />
                    <Route path="/bible" element={<Bible />} />
                    <Route path="/catechism" element={<Catechism />} />
                    <Route path="/magisterium" element={<Magisterium />} />
                    <Route path="/buscar" element={<GlobalSearchPage />} />
                    <Route path="/auth" element={<Auth onSuccess={() => navigate('/')} />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AnimatePresence>
              </Suspense>
            </main>

            <BottomNav user={authUserAdapter} onOpenSidebar={() => setIsSidebarOpen(true)} />
            <CathedralFooter />
            <A11ySettingsPanel 
              isOpen={showA11ySettings} 
              onClose={() => setShowA11ySettings(false)}
              isDark={isDark}
              onToggleDark={toggleDark}
              isHighContrast={isHighContrast}
              onToggleHighContrast={toggleHighContrast}
            />
            <CommandCenter />
            <PWAInstallPrompt />
            <OfflineIndicator />
        </ReadingSettingsProvider>
      </LangContext.Provider>
    </div>
  );
};

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <HelmetProvider>
      <Sentry.ErrorBoundary fallback={<AppErrorBoundary children={<div />} />}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <TooltipProvider>
                {children}
              </TooltipProvider>
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
