import { AppRoute } from '@/types';

// Map of route path to canonical route if needed, or descriptive mapping
export const ROUTE_MAPPING: Record<string, string> = {
  '/bible': AppRoute.BIBLE,
  '/catechism': AppRoute.CATECHISM,
  '/magisterium': AppRoute.MAGISTERIUM,
  '/santos': AppRoute.SAINTS,
  '/hoje': AppRoute.HOJE,
  '/jornadas': AppRoute.JORNADAS,
  '/biblioteca': AppRoute.BIBLIOTECA,
  '/community': AppRoute.COMMUNITY,
  '/logos': '/logos',
  '/buscar': AppRoute.BUSCAR,
  '/auth': AppRoute.LOGIN,
  '/profile': AppRoute.PROFILE,
  '/': AppRoute.HOME
};
