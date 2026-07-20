/**
 * Simple analytics wrapper.
 * Can be expanded to use PostHog, Mixpanel, etc.
 */

type EventName =
  | 'social_link_click'
  | 'newsletter_signup'
  | 'navigation_click'
  | 'conversion'
  | 'error'
  | 'sanctorum_date_change'
  | 'sanctorum_date_clamped';

export const trackEvent = (name: EventName, properties?: Record<string, any>) => {
  // In development, log the event
  if (import.meta.env.DEV) {
    console.log(`[Analytics] Event: ${name}`, properties);
  }

  // Example: Window/GA track
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', name, properties);
  }
};

/**
 * Empty implementation to satisfy existing imports.
 */
export const initGA4AutoTracking = () => {
  if (import.meta.env.DEV) {
    console.log('[Analytics] GA4 Auto Tracking Mock Initialized');
  }
};
