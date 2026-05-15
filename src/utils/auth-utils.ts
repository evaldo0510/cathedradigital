import { AppRoute } from '@/types';

export type UserRole = 'pilgrim' | 'scholar' | 'admin' | string | null;

const ADMIN_ROUTES = [
  AppRoute.ADMIN,
  AppRoute.VISUAL_AUDIT,
  AppRoute.VISUAL_REGRESSION,
  AppRoute.CATECHISM_INTEGRITY,
  AppRoute.CATECHISM_HEALTH,
  AppRoute.CATECHISM_VERIFY,
  AppRoute.A11Y_AUDIT,
  AppRoute.SECURITY_AUDIT,
  AppRoute.TRANSACTIONS,
  AppRoute.SELLER,
  '/admin/*',
  '/transactions/*',
  '/catechism/debug',
  '/security-audit/*',
  '/a11y-audit/*',
];

export const isRouteProtectedForAdmin = (path: string): boolean => {
  return ADMIN_ROUTES.some(route => {
    if (route.endsWith('/*')) {
      const base = route.replace('/*', '');
      return path.startsWith(base);
    }
    return path === route;
  });
};

export const canUserAccess = (role: UserRole, path: string): boolean => {
  if (isRouteProtectedForAdmin(path)) {
    return role === 'admin';
  }
  return true;
};

export const logUnauthorizedAccess = async (userId: string | undefined, path: string) => {
  console.warn(`Unauthorized access attempt by user ${userId || 'anonymous'} to path: ${path}`);
  
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase.from('audit_logs').insert([{
      user_id: userId || null,
      event_type: 'unauthorized_access',
      path,
      metadata: { 
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        referrer: document.referrer || 'direct'
      }
    }]);
  } catch (err) {
    console.error('Failed to log audit:', err);
  }
};

