// Prefetch lazy-loaded route chunks on hover/touch
const prefetched = new Set<string>();

const routeImports: Record<string, () => Promise<any>> = {
  '/dashboard': () => import('@/components/cathedra/Dashboard'),
  '/hoje': () => import('@/components/cathedra/HojePage'),
  '/jornadas': () => import('@/components/cathedra/JornadasPage'),
  '/biblioteca': () => import('@/components/cathedra/BibliotecaPage'),
  '/comunidade': () => import('@/components/cathedra/CommunityPage'),
  '/perfil': () => import('@/components/cathedra/ProfilePage'),
  '/biblia': () => import('@/components/cathedra/Bible'),
  '/catecismo': () => import('@/components/cathedra/Catechism'),
  '/santos': () => import('@/components/cathedra/Saints'),
  '/liturgia': () => import('@/components/cathedra/LiturgiaPage'),
  '/colloquium': () => import('@/components/cathedra/StudyMode'),
  '/rosario': () => import('@/components/cathedra/Rosary'),
  '/oracao': () => import('@/components/cathedra/PrayerPage'),
  '/login': () => import('@/components/cathedra/Auth'),
};

export function prefetchRoute(route: string) {
  if (prefetched.has(route)) return;
  const loader = routeImports[route];
  if (loader) {
    prefetched.add(route);
    const doLoad = () => loader().catch(() => prefetched.delete(route));
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(doLoad);
    } else {
      setTimeout(doLoad, 100);
    }
  }
}

// Prefetch core modules after initial page load
export function prefetchCoreModules() {
  // Skip on save-data mode
  if ('connection' in navigator && (navigator as any).connection?.saveData) return;

  const coreRoutes = ['/dashboard', '/hoje', '/biblia', '/catecismo', '/jornadas', '/biblioteca'];
  let i = 0;
  const prefetchNext = () => {
    if (i < coreRoutes.length) {
      prefetchRoute(coreRoutes[i++]);
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(prefetchNext);
      } else {
        setTimeout(prefetchNext, 300);
      }
    }
  };

  // Start after 3s to not compete with initial load
  setTimeout(() => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetchNext);
    } else {
      prefetchNext();
    }
  }, 3000);
}
