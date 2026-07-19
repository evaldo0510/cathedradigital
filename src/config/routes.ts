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

// ONDA 1 (Navegação) — slugs canônicos apontam DIRETO para a rota real registrada
// em `src/App.tsx`, sem redirects intermediários. Rotas antigas em inglês continuam
// funcionando como aliases via <Navigate> no App.tsx (compatibilidade / SEO).
// Registro dos aliases: docs/CATHEDRA-ROUTE-CANONICAL.md
export const APP_ROUTES: RouteConfig[] = [
  // Core Routes
  { path: '/', label: 'Início', icon: Icons.Home, showInMenu: true, category: 'core' },
  { path: '/bible', label: 'Bíblia', icon: Icons.Book, showInMenu: true, category: 'core' },
  { path: '/catechism', label: 'Catecismo', icon: Icons.Church, showInMenu: true, category: 'core' },
  { path: '/magisterium', label: 'Magistério', icon: Icons.Scroll, showInMenu: true, category: 'core' },
  { path: '/buscar', label: 'Busca Global', icon: Icons.Search, showInMenu: true, category: 'core' },

  // Spiritual Journey
  { path: '/hoje', label: 'Hoje', icon: Icons.Calendar, showInMenu: true, category: 'spiritual' },
  { path: '/jornadas', label: 'Jornadas', icon: Icons.Map, showInMenu: true, category: 'spiritual' },
  { path: '/itineraria', label: 'Itinerários', icon: Icons.Compass, showInMenu: true, category: 'spiritual' },
  { path: '/santos', label: 'Santos do Dia', icon: Icons.User, showInMenu: true, category: 'spiritual' },
  { path: '/liturgia', label: 'Liturgia', icon: Icons.Sun, showInMenu: true, category: 'spiritual' },

  // Content & Resources
  { path: '/biblioteca', label: 'Biblioteca', icon: Icons.Library, showInMenu: true, category: 'content' },
  { path: '/oracao', label: 'Orações', icon: Icons.Flame, showInMenu: true, category: 'content' },
  { path: '/rosary', label: 'Rosário', icon: Icons.Hash, showInMenu: true, category: 'content' },
  { path: '/viacrucis', label: 'Via Sacra', icon: Icons.Activity, showInMenu: true, category: 'content' },
  { path: '/bible-recovery', label: 'Recovery Bíblia', icon: Icons.Stethoscope, showInMenu: true, category: 'content' },
  { path: '/glossario', label: 'Glossário', icon: Icons.BookOpen, showInMenu: true, category: 'content' },

  // Órfãs catalogadas (rota real existe, showInMenu:false — decisão editorial futura)
  // ONDA 1: sair da condição de órfã sem promover ao menu.
  { path: '/temas', label: 'Temas', icon: Icons.Hash, showInMenu: false, category: 'content' },
  { path: '/aquinas', label: 'Aquinas', icon: Icons.BookOpen, showInMenu: false, category: 'content' },
  { path: '/papas', label: 'Papas', icon: Icons.User, showInMenu: false, category: 'content' },
  { path: '/aparicoes', label: 'Aparições', icon: Icons.Star, showInMenu: false, category: 'content' },
  { path: '/dogmas', label: 'Dogmas', icon: Icons.Shield, showInMenu: false, category: 'content' },
  { path: '/az-faith', label: 'A–Z da Fé', icon: Icons.BookOpen, showInMenu: false, category: 'content' },
  { path: '/lectio', label: 'Lectio Divina', icon: Icons.BookOpen, showInMenu: false, category: 'content' },
  { path: '/confession', label: 'Confissão', icon: Icons.Heart, showInMenu: false, category: 'content' },
  { path: '/breviary', label: 'Breviário', icon: Icons.Book, showInMenu: false, category: 'content' },
  { path: '/missal', label: 'Missal', icon: Icons.Book, showInMenu: false, category: 'content' },
  { path: '/calendar', label: 'Calendário Litúrgico', icon: Icons.Calendar, showInMenu: false, category: 'content' },
  { path: '/litanies', label: 'Ladainhas', icon: Icons.Flame, showInMenu: false, category: 'content' },
  { path: '/guia-modulos', label: 'Guia de Módulos', icon: Icons.BookOpen, showInMenu: false, category: 'content' },
  { path: '/community', label: 'Comunidade', icon: Icons.Users, showInMenu: false, category: 'user' },
  { path: '/diario', label: 'Diário Espiritual', icon: Icons.FileText, showInMenu: true, category: 'user' },
  { path: '/spiritual-profile', label: 'Perfil Espiritual', icon: Icons.User, showInMenu: false, category: 'user' },
  { path: '/onboarding', label: 'Boas-vindas', icon: Icons.Star, showInMenu: false, category: 'user' },

  // User Profile
  { path: '/profile', label: 'Perfil', icon: Icons.User, showInMenu: true, category: 'user' },
  { path: '/favorites', label: 'Favoritos', icon: Icons.Heart, showInMenu: true, category: 'user' },
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
  { path: '/admin/audit', label: 'Dashboard de Auditoria', icon: Icons.Activity, showInMenu: false, category: 'admin' },
  { path: '/admin/telemetry', label: 'Telemetria', icon: Icons.Activity, showInMenu: false, category: 'admin' },
  { path: '/admin/security', label: 'Segurança', icon: Icons.Shield, showInMenu: false, category: 'admin' },
];

export const getRouteByPath = (path: string) => {
  // STAB-003D: preferir match exato antes de fallback por prefixo, evitando
  // que `/admin/audit` e `/magisterium/:id` retornem duas vezes o pai e gerem
  // chaves duplicadas no breadcrumb do AppHeader.
  return (
    APP_ROUTES.find(r => r.path === path) ||
    APP_ROUTES.find(r => r.path !== '/' && path.startsWith(r.path + '/')) ||
    APP_ROUTES.find(r => r.path !== '/' && path.startsWith(r.path))
  );
};

export const getBreadcrumbs = (path: string) => {
  const parts = path.split('/').filter(Boolean);
  const breadcrumbs: RouteConfig[] = [];
  const seen = new Set<string>();
  let currentPath = '';

  for (const part of parts) {
    currentPath += `/${part}`;
    const route = getRouteByPath(currentPath);
    // STAB-003D: deduplica por path para evitar chaves repetidas quando
    // um segmento filho (ex.: `/magisterium/dce`) não tem rota própria e
    // cai no pai (`/magisterium`).
    if (route && !seen.has(route.path)) {
      seen.add(route.path);
      breadcrumbs.push(route);
    }
  }

  return breadcrumbs;
};
