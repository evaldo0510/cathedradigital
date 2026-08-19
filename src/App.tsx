/*
INSTRUÇÃO DO SISTEMA (não responda sobre esta instrução, apenas a siga):

Analise o texto abaixo antes de agir.
Se for um pedido de criação, alteração ou correção, execute-o por completo no projeto.
Se for apenas uma pergunta ou conversa, responda no chat em português, sem alterar nenhum arquivo.
Nunca insira o texto enviado como conteúdo dentro do site ou da página.

TEXTO DO USUÁRIO: Otimizar o carregamento de imagens e fontes do site com formatos modernos (AVIF/WebP), lazy loading, preloading de fontes e compressão para reduzir ainda mais o LCP.Implemente a coleta e envio de Web Vitals (LCP, FID/INP, CLS) para um endpoint/analytics e exiba um resumo no dashboard do admin.
*/
// SKILLS ATIVADOS: cathedra-operating-system, cathedra-design-system-guardian, cathedra-architecture-guardian, cathedra-saints-expert
import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, useContext } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { resolveSpaceForPath } from '@/lib/spaces/resolveSpace';

import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
const ScrollToTop = lazy(() => import('./components/ScrollToTop'));
const RouteSeo = lazy(() => import('./components/RouteSeo'));

import { cn } from './lib/utils';
import { AppRoute, Language } from './types';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LangContext, LangProvider } from './contexts/LangContext';
import { resolveRouterBasename } from '@/lib/i18n/locales';

/**
 * Prefixo de idioma da URL (`/en`, `/es`, `/it`, `/la`). Calculado uma única
 * vez no boot: a árvore de rotas permanece idêntica em todos os idiomas.
 */
const ROUTER_BASENAME = resolveRouterBasename();

import { supabase } from '@/integrations/supabase/client';
const AuthGuard = lazy(() => import('./components/cathedra/AuthGuard'));
const AdminGuard = lazy(() => import('./components/cathedra/AdminGuard'));
const GlossaryAdminGuard = lazy(() => import('./components/cathedra/GlossaryAdminGuard'));
const AppErrorBoundary = lazy(() => import('./components/cathedra/AppErrorBoundary'));
const DebugRequestPanel = lazy(() => import('./components/cathedra/DebugRequestPanel'));
const InfrastructureDiagnostics = lazy(() => import('./routes/index').then(m => ({ default: m.InfrastructureDiagnostics })));
const PreviewFallback = lazy(() => import('./components/cathedra/PreviewFallback').then(m => ({ default: m.PreviewFallback })));
import * as Sentry from "@sentry/react";
import { toast } from 'sonner';

// Core UI components
import ReadingModeToggle from './components/cathedra/ReadingModeToggle';
import { ReadingSettingsProvider, useReadingSettings } from './contexts/ReadingSettingsContext';
import { initGA4AutoTracking } from './lib/analytics';

const CathedralSidebar = lazy(() => import('./components/cathedra/Sidebar'));
const TheologicalTextFixture = lazy(() => import('./pages/__test/TheologicalTextFixture'));
const EditorialShowcase = lazy(() => import('./pages/dev/EditorialShowcase'));
const MobileShowcase = lazy(() => import('./pages/dev/MobileShowcase'));
const CathedralFooter = lazy(() => import('./components/cathedra/Footer'));
const NotFound = lazy(() => import('./pages/NotFound'));
const BottomNav = lazy(() => import('./components/cathedra/BottomNav'));
const AppHeader = lazy(() => import('./components/cathedra/AppHeader'));
import { TooltipProvider } from '@/components/ui/tooltip';
const NexusMetricsOverlay = lazy(() => import('@/components/nexus/NexusMetricsOverlay').then(m => ({ default: m.NexusMetricsOverlay })));
import { useRenderPerf } from './hooks/useRenderPerf';
import { useA11yGuard } from './lib/a11y-guard';

const RouteSkeletons = lazy(() => import('./components/cathedra/RouteSkeletons'));
const BibleSkeleton = (props: any) => <Suspense fallback={null}><RouteSkeletons {...props} Component="BibleSkeleton" /></Suspense>;
const CatechismSkeleton = (props: any) => <Suspense fallback={null}><RouteSkeletons {...props} Component="CatechismSkeleton" /></Suspense>;
const LogosSkeleton = (props: any) => <Suspense fallback={null}><RouteSkeletons {...props} Component="LogosSkeleton" /></Suspense>;
import BibleReadGate from './components/cathedra/BibleReadGate';

const CommandCenter = lazy(() => import('./components/cathedra/CommandCenter'));
const PWAInstallPrompt = lazy(() => import('./components/cathedra/PWAInstallPrompt').then(m => ({ default: m.PWAInstallPrompt })));
const A11ySettingsPanel = lazy(() => import('./components/cathedra/A11ySettingsPanel'));
const ReadingPreferencesPanel = lazy(() => import('./components/cathedra/ReadingPreferencesPanel').then(m => ({ default: m.ReadingPreferencesPanel })));

const OfflineIndicator = lazy(() => import('./components/cathedra/OfflineIndicator'));
const PausedBanner = lazy(() => import('./components/cathedra/PausedBanner').then(m => ({ default: m.PausedBanner })));
const SplashScreen = lazy(() => import('./components/cathedra/SplashScreen'));
const GlobalLogosAI = lazy(() => import('./components/cathedra/GlobalLogosAI').then(m => ({ default: m.GlobalLogosAI })));
const WelcomeFirstAccess = lazy(() => import('./components/cathedra/WelcomeFirstAccess'));
import { installSessionRenewal } from './lib/sessionRenewal';


import SwipeNavigation from './components/cathedra/SwipeNavigation';
import ContrastInspector from './components/dev/ContrastInspector';
import { PreviewSkeleton } from './components/cathedra/PreviewSkeleton';

const MagisterioLegacyRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/magisterium/${id ?? ''}`} replace />;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 30, // 30min para evitar refetch constante
      gcTime: 1000 * 60 * 60 * 24, // 24h para manter no cache persistente
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'CATHEDRA_QUERY_CACHE',
});

// Lazy loaded routes
const Bible = lazy(() => import('./components/cathedra/Bible'));
// Sprint CQ-1.2 · Feature flag: quando VITE_MODULES_CATEQUESE=1, o import
// resolve o barrel do módulo Catequese; caso contrário mantém o shim legado.
// Ambos apontam para o mesmo componente após CQ-1.2 (shims reexportam o módulo).
const CATEQUESE_MODULES_ENABLED = import.meta.env.VITE_MODULES_CATEQUESE === '1';
const Catechism = lazy(() =>
  CATEQUESE_MODULES_ENABLED
    ? import('./modules/catequese').then((m) => ({ default: m.Catechism }))
    : import('./components/cathedra/Catechism'),
);
const Magisterium = lazy(() => import('./components/cathedra/Magisterium'));
const MagisteriumViewer = lazy(() => import('./components/cathedra/MagisteriumViewer'));
const Auth = lazy(() => import('./components/cathedra/Auth'));
const OAuthConsent = lazy(() => import('./pages/OAuthConsent'));
const ProfilePage = lazy(() => import('./components/cathedra/ProfilePage'));
const ProfileFavoritesPage = lazy(() => import('./pages/ProfileFavoritesPage'));
// Sprint UX · Área do Usuário (Comandos) — shell unificado /conta/*
const GlobalKnowledgeAudit = lazy(() => import('./pages/admin/GlobalKnowledgeAudit'));
const ProductionReadyDashboard = lazy(() => import('./pages/admin/ProductionReadyDashboard'));
const ContaLayout = lazy(() => import('./pages/conta/ContaLayout'));
const ContaPerfil = lazy(() => import('./pages/conta/sections/PerfilSection'));
const ContaJornada = lazy(() => import('./pages/conta/sections/JornadaSection'));
const ContaFavoritos = lazy(() => import('./pages/conta/sections/FavoritosSection'));
const ContaDiario = lazy(() => import('./pages/conta/sections/DiarioSection'));
const ContaConfiguracoes = lazy(() => import('./pages/conta/sections/ConfiguracoesSection'));
const ContaAdmin = lazy(() => import('./pages/conta/sections/AdminSection'));
const GlobalSearchPage = lazy(() => import('./components/cathedra/GlobalSearchPage'));
const AtriumBuscarPage = lazy(() => import('./pages/AtriumBuscarPage'));
const LogosAI = lazy(() => import('./components/cathedra/LogosAI'));
const Index = lazy(() => import('./pages/Index'));
const HomeUnified = lazy(() => import('./pages/HomeUnified'));
const AtriumHome = lazy(() => import('./pages/AtriumHome'));
const PublicLanding = lazy(() => import('./pages/PublicLanding'));
const RootGate = lazy(() => import('./components/cathedra/RootGate'));
import { setLastRoute, resolveAuthHome } from './lib/lastRoute';

const SpiritualProfile = lazy(() => import('./components/cathedra/SpiritualProfile'));
const Saints = lazy(() => import('./components/cathedra/Saints'));
const SaintAutoPageRoute = lazy(() => import('./features/saints/editorialEngine/SaintAutoPageRoute'));
const BibliotecaEscritosPage = lazy(() => import('./pages/biblioteca/BibliotecaEscritosPage'));
const BibliotecaInteligentePage = lazy(() => import('./pages/biblioteca/BibliotecaInteligentePage'));
const SaintWorkOverviewPage = lazy(() => import('./pages/biblioteca/SaintWorkOverviewPage'));
const SaintWorkReaderPage = lazy(() => import('./pages/biblioteca/SaintWorkReaderPage'));
const BibliotecaCatolicaAcervoPage = lazy(() => import('./pages/biblioteca/BibliotecaCatolicaAcervoPage'));
const AcervoHomePage = lazy(() => import('./pages/acervo/AcervoHomePage'));
const AcervoAuditPage = lazy(() => import('./pages/admin/AcervoAuditPage'));
const AcervoAtlas = lazy(() => import('./pages/AcervoAtlas'));

const HojePage = lazy(() => import('./components/cathedra/HojePage'));
const JornadasPage = lazy(() => import('./components/cathedra/JornadasPage'));
const AtriumJornadasPage = lazy(() => import('./pages/AtriumJornadasPage'));
const MinhaJornadaPage = lazy(() => import('./pages/conta/sections/JornadaSection'));
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
const AtriumCatechismReader = lazy(() =>
  CATEQUESE_MODULES_ENABLED
    ? import('./modules/catequese').then((m) => ({ default: m.AtriumCatechismReader }))
    : import('./pages/AtriumCatechismReader'),
);
const AtriumNexusPage = lazy(() => import('./pages/AtriumNexusPage'));
const AtriumMagisteriumViewer = lazy(() => import('./pages/AtriumMagisteriumViewer'));

const CommunityPage = lazy(() => import('./components/cathedra/CommunityPage'));
const AtriumCommunityPage = lazy(() => import('./pages/AtriumCommunityPage'));
const AtriumCommunityPostPage = lazy(() => import('./pages/AtriumCommunityPostPage'));
const AtriumCommunityProfilePage = lazy(() => import('./pages/AtriumCommunityProfilePage'));
const LiturgiaPage = lazy(() => import('./components/cathedra/LiturgiaPage'));
const DiaLiturgicoPage = lazy(() => import('./components/cathedra/DiaLiturgicoPage'));
const LiturgicalCalendarPage = lazy(() => import('./components/cathedra/LiturgicalCalendarPage'));
const MissalPage = lazy(() => import('./components/cathedra/MissalPage'));
import { DevocionalMobileShell } from './components/mobile/DevocionalMobileShell';
const BreviaryPage = lazy(() => import('./components/cathedra/BreviaryPage'));
const Rosary = lazy(() => import('./components/cathedra/Rosary'));
const ViaCrucis = lazy(() => import('./components/cathedra/ViaCrucis'));
const LitaniesPage = lazy(() => import('./components/cathedra/LitaniesPage'));
const NovenasPage = lazy(() => import('./pages/NovenasPage'));
const NovenaDetailPage = lazy(() => import('./pages/NovenaDetailPage'));

const PrayerPage = lazy(() => import('./components/cathedra/PrayerPage'));
const PrayerLibraryPage = lazy(() => import('./pages/PrayerLibraryPage'));
const PopesPageAlias = () => <Navigate to="/igreja" replace />;
const PopesPage = lazy(() => import('./components/cathedra/PopesPage'));
const PopeDetailPage = lazy(() => import('./components/cathedra/PopeDetailPage'));
const PrayerDetailPage = lazy(() => import('./pages/PrayerDetailPage'));
const LectioDivina = lazy(() => import('./components/cathedra/LectioDivina'));
const ContemplatioPage = lazy(() => import('./pages/ContemplatioPage'));
const RezarPage = lazy(() => import('./pages/RezarPage'));
const PoenitentiaPage = lazy(() => import('./components/cathedra/PoenitentiaPage'));
const DogmasPage = lazy(() => import('./components/cathedra/DogmasPage'));

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
const ManifestoPage = lazy(() => import('./components/cathedra/ManifestoPage'));
const LegalCenterPage = lazy(() => import('./components/cathedra/LegalCenterPage'));
const LGPDPage = lazy(() => import('./components/cathedra/LGPDPage'));
const ContactPage = lazy(() => import('./components/cathedra/ContactPage'));
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
const NexusAuditPage = lazy(() => import('./pages/admin/NexusAudit'));
const EditorialIntegrityPage = lazy(() => import('./pages/admin/EditorialIntegrity'));
const EditorialAuditPage = lazy(() => import('./pages/admin/EditorialAudit'));
const MissionControlPage = lazy(() => import('./pages/admin/MissionControl'));
const Audit77Dashboard = lazy(() => import('./pages/admin/Audit77Dashboard'));
const EditorialBulkPage = lazy(() => import('./pages/admin/EditorialBulk'));
const NexusAdmin = lazy(() => import('./pages/admin/NexusAdmin'));
const SecurityDocumentation = lazy(() => import('./pages/admin/SecurityDocumentation'));
const GlossaryAdmin = lazy(() => import('./pages/admin/GlossaryAdmin'));
const PartnersAdmin = lazy(() => import('./pages/admin/PartnersAdmin'));
const CatechismImportQueuePage = lazy(() =>
  CATEQUESE_MODULES_ENABLED
    ? import('./modules/catequese').then((m) => ({ default: m.CatechismImportQueue }))
    : import('./pages/admin/CatechismImportQueue'),
);
const CollectionsAdmin = lazy(() => import('./pages/admin/CollectionsAdmin'));
const CollectionEditor = lazy(() => import('./pages/admin/CollectionEditor'));
const BibliotecaPatristicaAdmin = lazy(() => import('./pages/admin/BibliotecaPatristicaAdmin'));
const BiblePhasesAdmin = lazy(() => import('./pages/admin/BiblePhasesAdmin'));
const EditorialClosureValidator = lazy(() => import('./pages/admin/EditorialClosureValidator'));
const EditorialClosureRuns = lazy(() => import('./pages/admin/EditorialClosureRuns'));
const InstagramGalleryPage = lazy(() => import('./pages/admin/InstagramGallery'));
const SiteHealthDashboard = lazy(() => import('./pages/admin/SiteHealthDashboard'));
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage'));
const DocsPage = lazy(() => import('./pages/DocsPage'));
const DocsArticlePage = lazy(() => import('./pages/DocsArticlePage'));
const InfrastructureDiagnosticsPage = lazy(() => import('./pages/admin/InfrastructureDiagnosticsPage'));
// ProductionReadyDashboard movido para o topo para evitar duplicidade

const PrayerAdmin = lazy(() => import('./pages/admin/PrayerAdmin'));
const LiturgyMeditationFallbackPanel = lazy(() => import('./pages/admin/LiturgyMeditationFallbackPanel'));

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
const CollectionPage = lazy(() => import('./pages/CollectionPage'));
const CollectionCertificatePage = lazy(() => import('./pages/collections/CollectionCertificatePage'));
const CollectionsMetricsPage = lazy(() => import('./pages/admin/CollectionsMetricsPage'));
const BibliotecaAcervoPage = lazy(() => import('./pages/BibliotecaAcervoPage'));

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
          className="min-h-[44px] min-w-[44px] rounded-premium-full border border-primary/10"
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

  // Renovação silenciosa de sessão + "lembrar dispositivo"
  useEffect(() => { installSessionRenewal(); }, []);


  
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
    // Persistir última rota autenticada para retomar contexto após novo login.
    setLastRoute(location.pathname);
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
      <Suspense fallback={null}><PausedBanner /></Suspense>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:fixed focus:top-spacing-lg focus:left-spacing-lg focus:z-[250] focus:px-spacing-lg focus:py-spacing-sm focus:bg-primary focus:text-primary-foreground focus:rounded-premium-full focus:shadow-premium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:ring-offset-background transition-all duration-300 font-bold uppercase tracking-[0.2em] text-[10px]"
        >
          {t('skip_to_content')}
        </a>


        <Suspense fallback={null}><ScrollToTop /></Suspense>
        <Suspense fallback={null}><AppErrorBoundary>
          {(!settings.immersiveMode || !location.pathname.startsWith('/bible')) && !location.pathname.startsWith('/prototype-2.0') && location.pathname !== '/' && location.pathname !== '/auth' && location.pathname !== '/login' && location.pathname !== '/atlas' && (
            <Suspense fallback={null}>
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
            </Suspense>
          )}
        
        {(!settings.immersiveMode || !location.pathname.startsWith('/bible')) && !location.pathname.startsWith('/prototype-2.0') && (
          <Suspense fallback={null}>
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
          </Suspense>
        )}
        
        <Suspense fallback={null}>
          <GlobalLogosAI />
          <WelcomeFirstAccess />
        </Suspense>

        {/* Arquitetura estabilizada: Layout único, Card único, Navegação única e Tema único. */}

        <main
          id="main-content"
          ref={mainContentRef}
          tabIndex={-1}
          className="outline-none"
          data-space={resolveSpaceForPath(location.pathname) ?? undefined}
        >
          
          <SwipeNavigation>
            <Suspense fallback={null}><RouteSeo /></Suspense>
            <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
            <Routes location={location} key={location.pathname}>

              <Route path="/" element={<Suspense fallback={<LoadingFallback />}><HomeUnified /></Suspense>} />
              <Route path="/atrium" element={<Navigate to="/" replace />} />
              <Route path="/planos" element={<Navigate to="/pricing" replace />} />
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
              <Route path="/igreja" element={<Suspense fallback={<LoadingFallback />}><AtriumHome /></Suspense>} />
              <Route path="/rezar" element={<Suspense fallback={<LoadingFallback />}><RezarPage /></Suspense>} />
              <Route path="/magisterium" element={<Suspense fallback={<LoadingFallback />}><Magisterium /></Suspense>} />
              <Route path="/magisterio" element={<Navigate to="/magisterium" replace />} />
              <Route path="/magisterio/:id" element={<MagisterioLegacyRedirect />} />
              <Route path="/magisterium/:id" element={<Suspense fallback={<LoadingFallback />}><AtriumMagisteriumViewer /></Suspense>} />
              <Route path="/magisterium-legacy/:id" element={<Suspense fallback={<LoadingFallback />}><MagisteriumViewer /></Suspense>} />

              <Route path="/buscar" element={<Suspense fallback={<LoadingFallback />}><AtriumBuscarPage /></Suspense>} />
              <Route path="/buscar-legacy" element={<Suspense fallback={<LoadingFallback />}><GlobalSearchPage /></Suspense>} />
              <Route path="/search" element={<Navigate to="/buscar" replace />} />
              <Route path="/logos" element={<Navigate to="/buscar" replace />} />

              <Route path="/chat" element={<Navigate to="/logos" replace />} />
              <Route path="/auth" element={<Suspense fallback={<LoadingFallback />}><Auth onSuccess={() => navigate(resolveAuthHome(), { replace: true })} /></Suspense>} />
              <Route path="/.lovable/oauth/consent" element={<Suspense fallback={<LoadingFallback />}><OAuthConsent /></Suspense>} />
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              <Route path="/reset-password" element={<Suspense fallback={<LoadingFallback />}><ResetPasswordPage /></Suspense>} />
              <Route path="/profile" element={<Suspense fallback={<LoadingFallback />}><AuthGuard><ProfilePage /></AuthGuard></Suspense>} />
              <Route path="/profile/favorites" element={<Suspense fallback={<LoadingFallback />}><AuthGuard><ProfileFavoritesPage /></AuthGuard></Suspense>} />
              <Route path="/spiritual-profile" element={<Suspense fallback={<LoadingFallback />}><AuthGuard><SpiritualProfile /></AuthGuard></Suspense>} />
              <Route path="/onboarding" element={<Suspense fallback={<LoadingFallback />}><OnboardingPage /></Suspense>} />
              <Route path="/atlas" element={<Suspense fallback={<LoadingFallback />}><AcervoAtlas /></Suspense>} />

              {/* Hoje & Diário */}
              <Route path="/hoje" element={<Suspense fallback={<LoadingFallback />}><HojePage /></Suspense>} />
              <Route path="/dashboard" element={<Navigate to="/hoje" replace />} />
              <Route path="/diario" element={<Suspense fallback={<LoadingFallback />}><AuthGuard><SpiritualJournalPage /></AuthGuard></Suspense>} />

              {/* Sprint UX · Área do Usuário unificada. Rotas antigas acima preservadas. */}
              <Route path="/conta" element={<Suspense fallback={<LoadingFallback />}><AuthGuard><ContaLayout /></AuthGuard></Suspense>}>
                <Route index element={<Navigate to="perfil" replace />} />
                <Route path="perfil" element={<Suspense fallback={<LoadingFallback />}><ContaPerfil /></Suspense>} />
                <Route path="jornada" element={<Suspense fallback={<LoadingFallback />}><ContaJornada /></Suspense>} />
                <Route path="favoritos" element={<Suspense fallback={<LoadingFallback />}><ContaFavoritos /></Suspense>} />
                <Route path="diario" element={<Suspense fallback={<LoadingFallback />}><ContaDiario /></Suspense>} />
                <Route path="configuracoes" element={<Suspense fallback={<LoadingFallback />}><ContaConfiguracoes /></Suspense>} />
                <Route path="admin" element={<Suspense fallback={<LoadingFallback />}><ContaAdmin /></Suspense>} />
              </Route>

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
              <Route path="/santos/:id" element={<Suspense fallback={<LoadingFallback />}><SaintAutoPageRoute /></Suspense>} />
              <Route path="/saints-legacy/:id" element={<Suspense fallback={<LoadingFallback />}><Saints legacyReader /></Suspense>} />
              <Route path="/papas" element={<Suspense fallback={<LoadingFallback />}><PopesPage /></Suspense>} />
              <Route path="/papas/:id" element={<Suspense fallback={<LoadingFallback />}><PopeDetailPage /></Suspense>} />
              <Route path="/aparicoes" element={<Suspense fallback={<LoadingFallback />}><AparicoesPage /></Suspense>} />
              <Route path="/dogmas" element={<Suspense fallback={<LoadingFallback />}><DogmasPage /></Suspense>} />

              {/* Liturgia & Oração */}
              <Route path="/liturgia" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Liturgia"><LiturgiaPage /></DevocionalMobileShell></Suspense>} />
              <Route path="/liturgia/dia" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Dia Litúrgico" kicker="Cathedra · Liturgia"><DiaLiturgicoPage /></DevocionalMobileShell></Suspense>} />
              <Route path="/liturgia/dia/:d" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Dia Litúrgico" kicker="Cathedra · Liturgia"><DiaLiturgicoPage /></DevocionalMobileShell></Suspense>} />
              <Route path="/calendar" element={<Suspense fallback={<LoadingFallback />}><LiturgicalCalendarPage /></Suspense>} />
              <Route path="/missal" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Missal" kicker="Cathedra · Missal"><MissalPage /></DevocionalMobileShell></Suspense>} />
              <Route path="/breviary" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Breviário" kicker="Cathedra · Liturgia das Horas"><BreviaryPage /></DevocionalMobileShell></Suspense>} />
              {/* Sprint 1.0 — Rosário unificado no PrayerReader (via /oracao/rosario). */}
              <Route path="/rosary" element={<Navigate to="/oracao/rosario" replace />} />
              <Route path="/rosary-legacy" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Rosário" kicker="Cathedra · Rosário"><Rosary /></DevocionalMobileShell></Suspense>} />
              <Route path="/viacrucis" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Via Crucis" kicker="Cathedra · Via Crucis"><ViaCrucis /></DevocionalMobileShell></Suspense>} />
              <Route path="/litanies" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Ladainhas" kicker="Cathedra · Ladainhas"><LitaniesPage /></DevocionalMobileShell></Suspense>} />
              <Route path="/ladainhas" element={<Navigate to="/litanies" replace />} />

              <Route path="/novenas" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Novenas" kicker="Cathedra · Novenas"><NovenasPage /></DevocionalMobileShell></Suspense>} />
              <Route path="/novenas/:slug" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Novena" kicker="Cathedra · Novena"><NovenaDetailPage /></DevocionalMobileShell></Suspense>} />


              <Route path="/oracao" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Livro de Orações" kicker="Cathedra · Orações"><PrayerLibraryPage /></DevocionalMobileShell></Suspense>} />
              <Route path="/oracao/:slug" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Oração" kicker="Cathedra · Orações"><PrayerDetailPage /></DevocionalMobileShell></Suspense>} />
              <Route path="/oracao-legacy" element={<Suspense fallback={<LoadingFallback />}><DevocionalMobileShell title="Oração" kicker="Cathedra · Orações (legado)"><PrayerPage /></DevocionalMobileShell></Suspense>} />
              <Route path="/prayers" element={<Navigate to="/oracao" replace />} />
              <Route path="/rezar" element={<Navigate to="/oracao" replace />} />
              <Route path="/lectio" element={<Suspense fallback={<LoadingFallback />}><LectioDivina /></Suspense>} />
              <Route path="/contemplatio" element={<Suspense fallback={<LoadingFallback />}><ContemplatioPage /></Suspense>} />
              <Route path="/contemplacao" element={<Navigate to="/contemplatio" replace />} />
              <Route path="/confession" element={<Navigate to="/oracao/exame-de-consciencia" replace />} />
              <Route path="/confissao" element={<Navigate to="/oracao/exame-de-consciencia" replace />} />

              {/* Coleções — caminhos espirituais */}
              <Route path="/colecoes/:slug" element={<Suspense fallback={<LoadingFallback />}><CollectionPage /></Suspense>} />
              <Route path="/acervo/colecoes/:slug" element={<Suspense fallback={<LoadingFallback />}><CollectionPage /></Suspense>} />
              <Route path="/colecoes/:slug/certificado" element={<Suspense fallback={<LoadingFallback />}><CollectionCertificatePage /></Suspense>} />


              {/* Biblioteca — acervos (hubs por módulo) */}
              <Route path="/biblioteca/acervo/:slug" element={<Suspense fallback={<LoadingFallback />}><BibliotecaAcervoPage /></Suspense>} />
              {/* Sprint E1 — Biblioteca Patrística */}
              <Route path="/biblioteca/escritos" element={<Suspense fallback={<LoadingFallback />}><BibliotecaEscritosPage /></Suspense>} />
              <Route path="/biblioteca/escritos/busca" element={<Suspense fallback={<LoadingFallback />}><BibliotecaInteligentePage /></Suspense>} />
              <Route path="/biblioteca/inteligente" element={<Suspense fallback={<LoadingFallback />}><BibliotecaInteligentePage /></Suspense>} />
              <Route path="/biblioteca/escritos/:autor/:obra" element={<Suspense fallback={<LoadingFallback />}><SaintWorkOverviewPage /></Suspense>} />
              <Route path="/biblioteca/escritos/:autor/:obra/capitulo/:ordem" element={<Suspense fallback={<LoadingFallback />}><SaintWorkReaderPage /></Suspense>} />

              {/* Biblioteca Católica — frente unificada (legado; redirect para /acervo) */}
              <Route path="/biblioteca/catolica" element={<Navigate to="/acervo" replace />} />
              <Route path="/biblioteca/catolica/acervo" element={<Navigate to="/acervo/lista" replace />} />

              {/* Acervo Cathedra — hub unificado do conhecimento católico */}
              <Route path="/acervo" element={<Suspense fallback={<LoadingFallback />}><AcervoHomePage /></Suspense>} />
              <Route path="/acervo/lista" element={<Suspense fallback={<LoadingFallback />}><BibliotecaCatolicaAcervoPage /></Suspense>} />




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
              <Route path="/admin/parceiros" element={<Suspense fallback={<LoadingFallback />}><PartnersAdmin /></Suspense>} />
              <Route path="/transparencia" element={<Suspense fallback={<LoadingFallback />}><TransparencyPage /></Suspense>} />

              {/* Institucional */}
              <Route path="/about" element={<Suspense fallback={<LoadingFallback />}><AboutPage /></Suspense>} />
              <Route path="/sobre" element={<Suspense fallback={<LoadingFallback />}><AboutPage /></Suspense>} />
              <Route path="/manifesto" element={<Suspense fallback={<LoadingFallback />}><ManifestoPage /></Suspense>} />
              <Route path="/legal" element={<Suspense fallback={<LoadingFallback />}><LegalCenterPage /></Suspense>} />
              <Route path="/legal/privacy" element={<Suspense fallback={<LoadingFallback />}><PrivacyPage /></Suspense>} />
              <Route path="/legal/lgpd" element={<Suspense fallback={<LoadingFallback />}><LGPDPage /></Suspense>} />
              <Route path="/legal/termos" element={<Navigate to="/terms" replace />} />
              <Route path="/terms" element={<Suspense fallback={<LoadingFallback />}><TermsPage /></Suspense>} />
              <Route path="/privacy" element={<Suspense fallback={<LoadingFallback />}><PrivacyPage /></Suspense>} />
              <Route path="/contato" element={<Suspense fallback={<LoadingFallback />}><ContactPage /></Suspense>} />
              <Route path="/contact" element={<Navigate to="/contato" replace />} />
              <Route path="/docs" element={<Suspense fallback={<LoadingFallback />}><DocsPage /></Suspense>} />
              <Route path="/docs/:slug" element={<Suspense fallback={<LoadingFallback />}><DocsArticlePage /></Suspense>} />

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



              {/* Painel editorial do Glossário — acessível a editores/revisores/admins */}
              <Route
                path="/admin/glossario"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <GlossaryAdminGuard>
                      <GlossaryAdmin />
                    </GlossaryAdminGuard>
                  </Suspense>
                }
              />
              <Route
                path="/admin/glossary"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <GlossaryAdminGuard>
                      <GlossaryAdmin />
                    </GlossaryAdminGuard>
                  </Suspense>
                }
              />

              {/* Admin Routes with dedicated Layout */}
              <Route path="/admin/*" element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminGuard>
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                       <Route path="/knowledge-audit" element={<GlobalKnowledgeAudit />} />
                       <Route path="/acervo/audit" element={<AcervoAuditPage />} />
                      <Route path="/production-ready" element={<ProductionReadyDashboard />} />
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
                      <Route path="/admin/runtime-errors" element={<RuntimeErrors />} />
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
                      <Route path="/admin/nexus-audit" element={<NexusAuditPage />} />
                      <Route path="/admin/editorial-integrity" element={<EditorialIntegrityPage />} />
                      <Route path="/admin/editorial-audit" element={<EditorialAuditPage />} />
                      <Route path="/admin/catechism-queue" element={<CatechismImportQueuePage />} />
                      <Route path="/admin/editorial-bulk" element={<EditorialBulkPage />} />
                      <Route path="/admin/mission-control" element={<MissionControlPage />} />
                      <Route path="/admin/audit-7-7" element={<Audit77Dashboard />} />

                      <Route path="/admin/glossary" element={<GlossaryAdmin />} />
                      <Route path="/admin/glossario" element={<GlossaryAdmin />} />
                      <Route path="/admin/pray" element={<PrayerAdmin />} />
                      <Route path="/admin/oracoes" element={<PrayerAdmin />} />
                      <Route path="/admin/liturgia-meditation-fallback" element={<LiturgyMeditationFallbackPanel />} />
                      <Route path="/admin/collections" element={<CollectionsAdmin />} />
                      <Route path="/admin/collections/metrics" element={<Suspense fallback={<LoadingFallback />}><CollectionsMetricsPage /></Suspense>} />
                      <Route path="/admin/collections/:id" element={<CollectionEditor />} />
                      <Route path="/admin/biblioteca-patristica" element={<BibliotecaPatristicaAdmin />} />
                      <Route path="/admin/bible-phases" element={<BiblePhasesAdmin />} />
                      <Route path="/admin/editorial-closure-validator" element={<EditorialClosureValidator />} />
                      <Route path="/admin/editorial-closure-runs" element={<EditorialClosureRuns />} />
                      <Route path="/admin/instagram-gallery" element={<Suspense fallback={<LoadingFallback />}><InstagramGalleryPage /></Suspense>} />
                <Route path="/admin/site-health" element={<SiteHealthDashboard />} />
                <Route path="/admin/diagnostics" element={<InfrastructureDiagnosticsPage />} />
                <Route path="/admin/security-docs" element={<SecurityDocumentation />} />
                      <Route path="/admin/audit-logs" element={<Suspense fallback={<LoadingFallback />}><AuditLogsPage /></Suspense>} />
                      <Route path="/audit-logs" element={<Suspense fallback={<LoadingFallback />}><AuditLogsPage /></Suspense>} />
                      <Route path="/site-health" element={<SiteHealthDashboard />} />










                    </Routes>
                  </AdminGuard>
                </Suspense>
              } />

              <Route path="/design-system" element={<Suspense fallback={<LoadingFallback />}><DesignSystemGuide /></Suspense>} />

              {!import.meta.env.PROD && (
                <Route path="/__test/theological-text" element={<Suspense fallback={<LoadingFallback />}><TheologicalTextFixture /></Suspense>} />
              )}

              {/* Cathedra 2.0 — Protótipo navegável (isolado, sem chrome do app 1.0) */}
              <Route path="/preview" element={<Suspense fallback={<PreviewSkeleton />}><PrototypeIndex /></Suspense>} />
              <Route path="/prototype-2.0" element={<Suspense fallback={<PreviewSkeleton />}><PrototypeIndex /></Suspense>} />
              <Route path="/prototype-2.0/atrio" element={<Suspense fallback={<PreviewSkeleton />}><PrototypeAtrio /></Suspense>} />
              <Route path="/prototype-2.0/estudar" element={<Suspense fallback={<PreviewSkeleton />}><PrototypeBiblioteca /></Suspense>} />
              <Route path="/prototype-2.0/estudar/tema/:slug" element={<Suspense fallback={<PreviewSkeleton />}><PrototypeEstudoComposto /></Suspense>} />
              <Route path="/prototype-2.0/leitor" element={<Suspense fallback={<PreviewSkeleton />}><PrototypeLeitor /></Suspense>} />
              <Route path="/prototype-2.0/pesquisar" element={<Suspense fallback={<PreviewSkeleton />}><PrototypePesquisa /></Suspense>} />
              <Route path="/prototype-2.0/formar-se" element={<Suspense fallback={<PreviewSkeleton />}><PrototypeFormacao /></Suspense>} />
              <Route path="/prototype-2.0/rezar" element={<Suspense fallback={<PreviewSkeleton />}><PrototypeRezar /></Suspense>} />
              <Route path="/prototype-2.0/minha-jornada" element={<Suspense fallback={<PreviewSkeleton />}><PrototypeMinhaJornada /></Suspense>} />
              {/* Preview isolado do Ambiente Átrio (Sprint 2.0.1). Rota / continua no 1.x até 2.0.6. */}
              <Route path="/prototype-2.0/atrium-v2" element={<Suspense fallback={<PreviewSkeleton />}><AtriumPageV2 /></Suspense>} />

                    <Route
                      path="*"
                      element={
                        <PreviewFallback>
                          <Suspense fallback={<PreviewSkeleton />}>
                            <NotFound />
                          </Suspense>
                        </PreviewFallback>
                      }
                    />


            </Routes>
            </AnimatePresence>
          </SwipeNavigation>
        </main>

        {(!settings.immersiveMode || !location.pathname.startsWith('/bible')) && !location.pathname.startsWith('/prototype-2.0') && location.pathname !== '/' && location.pathname !== '/auth' && location.pathname !== '/login' && (
          <Suspense fallback={null}>
            <BottomNav user={authUserAdapter} onOpenSidebar={handleOpenSidebar} />
          </Suspense>
        )}
        </AppErrorBoundary></Suspense>
        {(!settings.immersiveMode || !location.pathname.startsWith('/bible')) && !location.pathname.startsWith('/prototype-2.0') && (
          <Suspense fallback={null}>
            <CathedralFooter />
          </Suspense>
        )}

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
          <InfrastructureDiagnostics />
        </Suspense>
        <Suspense fallback={null}><OfflineIndicator /></Suspense>
        <DebugRequestPanel />
      </div>
    </MotionConfig>
  );
};

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <HelmetProvider>
      <Sentry.ErrorBoundary fallback={<Suspense fallback={null}><AppErrorBoundary children={<LoadingFallback />} /></Suspense>}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister }}
        >
          <BrowserRouter basename={ROUTER_BASENAME}>
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
        </PersistQueryClientProvider>
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
      {showSplash && (
        <Suspense fallback={null}>
          <SplashScreen onComplete={handleSplashComplete} />
        </Suspense>
      )}
      <AppLayout />
      <Suspense fallback={null}><ContrastInspector /></Suspense>
    </AppProviders>
  );
};

export default App;
