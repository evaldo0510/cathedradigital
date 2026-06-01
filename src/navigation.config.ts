import { AppRoute } from './types';

export const navigationConfig = {
  main: [
    { label: 'Início', route: AppRoute.HOME, icon: 'Home' },
    { label: 'Bíblia', route: AppRoute.BIBLE, icon: 'Bible' },
    { label: 'Catecismo', route: AppRoute.CATECHISM, icon: 'Catechism' },
    { label: 'Logos', route: '/logos', icon: 'Sparkles' },
  ],
  secondary: [
    { label: 'Santuário', route: AppRoute.HOJE, icon: 'Sun' },
    { label: 'Biblioteca', route: AppRoute.BIBLIOTECA, icon: 'Library' },
    { label: 'Santos', route: AppRoute.SAINTS, icon: 'Flame' },
    { label: 'Liturgia', route: AppRoute.LITURGIA, icon: 'Wine' },
  ],
  user: [
    { label: 'Perfil', route: AppRoute.PROFILE, icon: 'User' },
    { label: 'Diário', route: AppRoute.DIARIO, icon: 'BookOpen' },
    { label: 'Favoritos', route: AppRoute.FAVORITES, icon: 'Heart' },
    { label: 'Configurações', route: '/settings', icon: 'Settings' },
  ]
};
