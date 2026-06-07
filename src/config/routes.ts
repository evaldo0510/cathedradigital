import { 
  Icons 
} from '@/constants';

export interface RouteConfig {
  path: string;
  label: string;
  icon?: any;
  component?: string; // Nome para referência lazy load
  showInMenu: boolean;
  parentPath?: string;
  category?: 'core' | 'spiritual' | 'content' | 'user' | 'admin';
}

export const APP_ROUTES: RouteConfig[] = [
  // Core Routes
  { path: '/', label: 'Início', icon: Icons.Home, showInMenu: true, category: 'core' },
  { path: '/bible', label: 'Bíblia', icon: Icons.Book, showInMenu: true, category: 'core' },
  { path: '/catechism', label: 'Catecismo', icon: Icons.Church, showInMenu: true, category: 'core' },
  { path: '/magisterium', label: 'Magistério', icon: Icons.Scroll, showInMenu: true, category: 'core' },
  { path: '/search', label: 'Busca Global', icon: Icons.Search, showInMenu: true, category: 'core' },

  // Spiritual Journey
  { path: '/hoje', label: 'Hoje', icon: Icons.Calendar, showInMenu: true, category: 'spiritual' },
  { path: '/journeys', label: 'Jornadas', icon: Icons.Map, showInMenu: true, category: 'spiritual' },
  { path: '/itineraria', label: 'Itinerários', icon: Icons.Compass, showInMenu: true, category: 'spiritual' },
  { path: '/saints', label: 'Santos do Dia', icon: Icons.User, showInMenu: true, category: 'spiritual' },
  { path: '/liturgia', label: 'Liturgia', icon: Icons.Sun, showInMenu: true, category: 'spiritual' },

  // Content & Resources
  { path: '/library', label: 'Biblioteca', icon: Icons.Library, showInMenu: true, category: 'content' },
  { path: '/prayer', label: 'Orações', icon: Icons.Flame, showInMenu: true, category: 'content' },
  { path: '/rosary', label: 'Rosário', icon: Icons.Hash, showInMenu: true, category: 'content' },
  { path: '/via-crucis', label: 'Via Sacra', icon: Icons.Activity, showInMenu: true, category: 'content' },
  { path: '/glossary', label: 'Glossário', icon: Icons.BookOpen, showInMenu: true, category: 'content' },

  // User Profile
  { path: '/profile', label: 'Perfil', icon: Icons.User, showInMenu: true, category: 'user' },
  { path: '/favorites', label: 'Favoritos', icon: Icons.Heart, showInMenu: true, category: 'user' },
  { path: '/notes', label: 'Notas', icon: Icons.FileText, showInMenu: true, category: 'user' },
  { path: '/achievements', label: 'Conquistas', icon: Icons.Trophy, showInMenu: true, category: 'user' },
  { path: '/settings', label: 'Configurações', icon: Icons.Settings, showInMenu: true, category: 'user' },
  { path: '/about', label: 'Sobre', icon: Icons.Info, showInMenu: false, category: 'user' },
  { path: '/partners', label: 'Parceiros', icon: Icons.Users, showInMenu: false, category: 'user' },
  { path: '/privacy', label: 'Privacidade', icon: Icons.Shield, showInMenu: false, category: 'user' },
  { path: '/terms', label: 'Termos', icon: Icons.FileText, showInMenu: false, category: 'user' },
  { path: '/transparencia', label: 'Transparência', icon: Icons.Activity, showInMenu: false, category: 'user' },
  { path: '/design-system', label: 'Design System', icon: Icons.Palette, showInMenu: false, category: 'user' },


  // Admin
  { path: '/admin', label: 'Painel Admin', icon: Icons.Lock, showInMenu: false, category: 'admin' },
  { path: '/telemetry', label: 'Telemetria', icon: Icons.Activity, showInMenu: false, category: 'admin' },
  { path: '/security', label: 'Segurança', icon: Icons.Shield, showInMenu: false, category: 'admin' },
];

export const getRouteByPath = (path: string) => {
  return APP_ROUTES.find(r => r.path === path || (r.path !== '/' && path.startsWith(r.path)));
};

export const getBreadcrumbs = (path: string) => {
  const parts = path.split('/').filter(Boolean);
  const breadcrumbs = [];
  let currentPath = '';

  for (const part of parts) {
    currentPath += `/${part}`;
    const route = getRouteByPath(currentPath);
    if (route) {
      breadcrumbs.push(route);
    }
  }

  return breadcrumbs;
};
