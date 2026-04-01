import React, { lazy, Suspense } from 'react';
import { AppRoute } from '@/types';
import PlaceholderPage from './PlaceholderPage';
import ProGate from './ProGate';

// Lazy-loaded route components
const Dashboard = lazy(() => import('./Dashboard'));
const Bible = lazy(() => import('./Bible'));
const Catechism = lazy(() => import('./Catechism'));
const StudyMode = lazy(() => import('./StudyMode'));
const Saints = lazy(() => import('./Saints'));
const Magisterium = lazy(() => import('./Magisterium'));
const DailyLiturgy = lazy(() => import('./DailyLiturgy'));
const ViaCrucis = lazy(() => import('./ViaCrucis'));
const Rosary = lazy(() => import('./Rosary'));
const Auth = lazy(() => import('./Auth'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

interface AppRoutesProps {
  route: AppRoute;
  appUser: any;
  isPremium: boolean;
  isLoggedIn: boolean;
  onSearch: (topic: string) => void;
  onNavigate: (r: AppRoute) => void;
  onLoginSuccess: () => void;
}

const AppRoutes: React.FC<AppRoutesProps> = ({
  route, appUser, isPremium, isLoggedIn, onSearch, onNavigate, onLoginSuccess
}) => {
  const content = (() => {
    switch (route) {
      case AppRoute.DASHBOARD:
        return <Dashboard onSearch={onSearch} user={appUser} onNavigate={onNavigate} />;
      case AppRoute.BIBLE:
        return <Bible />;
      case AppRoute.CATECHISM:
        return <Catechism />;
      case AppRoute.SAINTS:
        return <Saints />;
      case AppRoute.MAGISTERIUM:
        return <Magisterium />;
      case AppRoute.DAILY_LITURGY:
        return <DailyLiturgy />;
      case AppRoute.STUDY_MODE:
        return (
          <ProGate isPremium={isPremium} isLoggedIn={isLoggedIn} onLogin={() => onNavigate(AppRoute.LOGIN)}>
            <StudyMode />
          </ProGate>
        );
      case AppRoute.LOGIN:
        return <Auth onSuccess={onLoginSuccess} />;
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
        return <Rosary />;
      case AppRoute.VIA_CRUCIS:
        return <ViaCrucis />;
      case AppRoute.ABOUT:
        return <PlaceholderPage title="Sobre" description="Manifesto e missão da Cathedra Digital." />;
      default:
        return <Dashboard onSearch={onSearch} user={appUser} onNavigate={onNavigate} />;
    }
  })();

  return <Suspense fallback={<LoadingFallback />}>{content}</Suspense>;
};

export default AppRoutes;
