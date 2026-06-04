import { trackEvent } from './analytics';

export const trackNavigationError = (error: Error, context?: Record<string, any>) => {
  const requestId = Math.random().toString(36).substring(7);
  const route = window.location.pathname;
  
  console.error(`[Navigation Error] ID: ${requestId}, Route: ${route}`, error, context);
  
  trackEvent('error', {
    type: 'navigation',
    requestId,
    route,
    message: error.message,
    stack: error.stack,
    isMobile: window.innerWidth < 1024,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    ...context
  });

  return requestId;
};

export const trackInteraction = (action: string, metadata?: Record<string, any>) => {
  trackEvent('navigation_click', {
    action,
    route: window.location.pathname,
    isMobile: window.innerWidth < 1024,
    ...metadata
  });
};
