
/**
 * Simple prefetch utility for routes and assets
 */
export const prefetchRoute = (route: string) => {
  const routes: Record<string, () => Promise<any>> = {
    '/bible': () => import('../components/cathedra/Bible'),
    '/catechism': () => import('../components/cathedra/Catechism'),
    '/logos': () => import('../components/cathedra/LogosAI'),
    '/library': () => import('../components/cathedra/BibliotecaPage'),
    '/study': () => import('../components/cathedra/StudyMode'),
  };

  if (routes[route]) {
    routes[route]().catch(() => {});
  }
};

export const prefetchCoreModules = () => {
  // Common routes to prefetch after initial load
  ['/bible', '/catechism', '/logos', '/library', '/study'].forEach(prefetchRoute);
};

export const prefetchAsset = (url: string) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
};

export const prefetchOnInteraction = (route: string) => {
  const handler = () => {
    prefetchRoute(route);
    window.removeEventListener('touchstart', handler);
    window.removeEventListener('mousemove', handler);
  };

  window.addEventListener('touchstart', handler, { once: true });
  window.addEventListener('mousemove', handler, { once: true });
};

