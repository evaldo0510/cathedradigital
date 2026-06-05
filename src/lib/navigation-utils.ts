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
let lastNavTime = 0;
const NAV_THROTTLE = 400; // ms

export const isLegitimateClick = (event: any): boolean => {
  // Throttle navigation to prevent double-tap issues
  const now = Date.now();
  if (now - lastNavTime < NAV_THROTTLE) {
    return false;
  }

  // Always allow keyboard events (Enter, Space) which often have detail === 0
  const isKeyboard = event instanceof KeyboardEvent || 
                    (event.type === 'keydown' || event.type === 'keyup') ||
                    (event.nativeEvent && (event.nativeEvent instanceof KeyboardEvent)) ||
                    (event.key === 'Enter' || event.key === ' ');
  
  if (isKeyboard) {
    lastNavTime = now;
    return true;
  }

  // If it's a touch event, ensure it's a single touch
  if (event.touches && event.touches.length > 1) {
    return false;
  }

  // Protection against ghost clicks (synthetic clicks triggered by mobile browsers)
  if (event.type === 'click' && event.detail === 0) {
    const nativeEvent = event.nativeEvent || event;
    // If it's a pointer event, check if it was triggered by a real pointer
    if (nativeEvent.pointerType === 'mouse' || nativeEvent.pointerType === 'touch' || nativeEvent.pointerType === 'pen') {
       lastNavTime = now;
       return true;
    }
    // If no pointer info and not keyboard, it's likely a ghost click or accidental touch
    return false;
  }

  lastNavTime = now;
  return true;
};



