// Prefetch lazy-loaded route chunks on hover/touch
const prefetched = new Set<string>();

const routeImports: Record<string, () => Promise<any>> = {
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
};

export function prefetchRoute(route: string) {
  if (prefetched.has(route)) return;
  const loader = routeImports[route];
  if (loader) {
    prefetched.add(route);
    // Use requestIdleCallback to avoid blocking
    const doLoad = () => loader().catch(() => prefetched.delete(route));
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(doLoad);
    } else {
      setTimeout(doLoad, 100);
    }
  }
}
