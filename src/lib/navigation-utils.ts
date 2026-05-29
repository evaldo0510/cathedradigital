import { AppRoute } from '@/types';

/**
 * Checks if the "Hoje" route should be considered active based on the current path.
 * The "Hoje" tab is active for the root path, /hoje, and any sub-routes of /hoje.
 */
export const isHojeActive = (currentPath: string): boolean => {
  if (!currentPath) return false;
  
  // Normalize path by removing query strings and hashes
  const path = currentPath.split(/[?#]/)[0];
  
  // If it's exactly root, /hoje, or starts with /hoje/
  return path === '/' || path === '/hoje' || path === '/hoje/' || path.startsWith('/hoje/');
};

/**
 * Checks if a specific route is active given the current path.
 * Handles exact matches and nested routes, with special logic for "Hoje".
 */
export const isRouteActive = (itemRoute: string, currentPath: string): boolean => {
  if (!itemRoute) return false;

  // Clean currentPath of query strings/hashes for comparison
  const path = currentPath.split(/[?#]/)[0];

  if (itemRoute === AppRoute.HOJE || itemRoute === '/') {
    return isHojeActive(path);
  }

  // Exact match
  if (path === itemRoute) return true;

  // Nested route match (e.g. /bible/verse matches /bible)
  if (itemRoute !== '/' && path.startsWith(itemRoute)) {
    // Ensure it's a subpath match (e.g. /bibletest shouldn't match /bible)
    return path.charAt(itemRoute.length) === '/' || itemRoute.endsWith('/');
  }

  return false;
};
