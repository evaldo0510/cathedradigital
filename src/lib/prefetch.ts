// Prefetch lazy-loaded route chunks on hover/touch
const prefetched = new Set<string>();

const routeImports: Record<string, () => Promise<any>> = {
  '/dashboard': () => import('@/components/cathedra/Dashboard'),
  '/hoje': () => import('@/components/cathedra/HojePage'),
  '/jornadas': () => import('@/components/cathedra/JornadasPage'),
  '/biblioteca': () => import('@/components/cathedra/BibliotecaPage'),
  '/community': () => import('@/components/cathedra/CommunityPage'),
  '/profile': () => import('@/components/cathedra/ProfilePage'),
  '/bible': () => import('@/components/cathedra/Bible'),
  '/catechism': () => import('@/components/cathedra/Catechism'),
  '/santos': () => import('@/components/cathedra/Saints'),
  '/saints': () => import('@/components/cathedra/Saints'),
  '/liturgia': () => import('@/components/cathedra/LiturgiaPage'),
  '/study': () => import('@/components/cathedra/StudyMode'),
  '/rosary': () => import('@/components/cathedra/Rosary'),
  '/oracao': () => import('@/components/cathedra/PrayerPage'),
  '/login': () => import('@/components/cathedra/Auth'),
  '/auth': () => import('@/components/cathedra/Auth'),
  '/magisterium': () => import('@/components/cathedra/Magisterium'),
  '/diagnostico': () => import('@/components/cathedra/DiagnosticoPage'),
  '/viacrucis': () => import('@/components/cathedra/ViaCrucis'),
  '/checkout': () => import('@/components/cathedra/CheckoutPage'),
  '/logos': () => import('@/components/cathedra/LogosAI'),
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

  const coreRoutes = ['/dashboard', '/hoje', '/bible', '/catechism', '/jornadas', '/biblioteca', '/community', '/profile'];
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

// Prefetch essential data for offline availability
export async function prefetchEssentialContent() {
  const { supabase } = await import('@/integrations/supabase/client');
  
  // Check if Supabase is healthy before syncing
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1).single();
    if (error) throw error;
  } catch (e) {
    console.warn('Sync aborted: Supabase unreachable');
    return;
  }

  // 1) Liturgia do dia (respeita o guard `litcal_no_prefetch=1`)
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;

  const { cacheLiturgy } = await import('./offlineCache');
  const { isLiturgicalPrefetchDisabled } = await import('./litcalPrefetchGuard');

  if (!isLiturgicalPrefetchDisabled()) {
    try {
      const { data } = await supabase.functions.invoke('liturgical-calendar', {
        body: { action: 'readings', day, month }
      });
      if (data) await cacheLiturgy(today.toDateString(), data);
    } catch (e) {
      console.warn('Auto-sync failed for liturgy:', e);
    }
  }

  // 2) Prefetch next Catechism paragraph if we have a current one
  try {
    const stored = localStorage.getItem('cathedra_last_catechism_para');
    if (stored) {
      const p = parseInt(stored);
      const { fetchCatechismParagraph } = await import('@/hooks/useCatechismParagraph');
      if (p < 2865) await fetchCatechismParagraph(p + 1);
    }
    } catch (e) {
      console.warn('Prefetch error for last catechism paragraph:', e);
    }
}
