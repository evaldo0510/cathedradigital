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

/**
 * Checks if a click/touch event is legitimate to prevent ghost clicks or accidental navigation.
 * Particularly useful for mobile to ensure navigation only happens on deliberate user action.
 */
export const isLegitimateClick = (event: any): boolean => {
  // Always allow keyboard events (Enter, Space) which often have detail === 0
  if (event instanceof KeyboardEvent || (event.type === 'keydown' || event.type === 'keyup')) {
    return true;
  }

  // Handle standard mouse/pointer/touch events
  if (event.type !== 'click' && event.type !== 'touchstart' && event.type !== 'touchend') {
    return true; // Let other event types pass or handle specifically if needed
  }

  // detail === 0 in a click event often means it's not a real pointer click (except for keyboard which we handled)
  // However, some mobile browsers might trigger click with detail 0 after touchend
  if (event.type === 'click' && event.detail === 0) {
    // If it's a pointer event, check if it was triggered by a real pointer
    if (event.pointerType === 'mouse' || event.pointerType === 'touch' || event.pointerType === 'pen') {
       return true;
    }
    // If it's not a keyboard event and detail is 0, it might be a ghost click
    // But we should be careful not to block valid programmatic clicks if they are intended.
    // For now, let's stick to the user's suggestion but with a safety for keyboard.
  }

  // If it's a touchstart/touchend, ensure it's a single touch
  if ((event.type === 'touchstart' || event.type === 'touchend') && event.touches && event.touches.length > 1) {
    return false;
  }

  return true;
};

