import { supabase } from '@/integrations/supabase/client';

/**
 * Pushes events to Google Analytics 4 dataLayer.
 * Standardizes common event names and properties.
 */
export const trackGA4Event = (eventName: string, params: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, {
      ...params,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString()
    });
    console.log(`[GA4 Event] ${eventName}`, params);
  }
};

/**
 * Automatically tracks page views and standard user interactions.
 */
export const initGA4AutoTracking = () => {
  if (typeof window === 'undefined') return;

  // Track clicks on actionable elements
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const clickable = target.closest('button, a, .clickable');
    
    if (clickable) {
      const label = clickable.textContent?.trim() || clickable.getAttribute('aria-label') || 'unlabeled';
      const href = clickable.getAttribute('href');
      
      trackGA4Event('click_interaction', {
        element_type: clickable.tagName.toLowerCase(),
        element_text: label,
        destination_url: href || 'internal',
        id: clickable.id || 'no-id'
      });
    }
  });

  // Track time spent (heartbeat)
  let startTime = Date.now();
  window.addEventListener('beforeunload', () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    trackGA4Event('session_duration', {
      duration_seconds: timeSpent
    });
  });
};

/**
 * Tracks conversion events (like checkout or signup).
 */
export const trackConversion = (type: 'signup' | 'checkout' | 'pro_upgrade', value?: number) => {
  trackGA4Event('conversion', {
    conversion_type: type,
    value: value || 0,
    currency: 'BRL'
  });
};
