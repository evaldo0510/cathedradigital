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
  | 'sanctorum_date_clamped'
  // UX sessão
  | 'landing_view'
  | 'atrium_redirect'
  | 'first_access_view'
  | 'first_access_completed'
  | 'first_access_dismissed'
  | 'session_silent_refresh'
  | 'session_remember_device_toggle'
  | 'catechism_normalization_diff'
  | 'glossary_faq_sanitized';

export const trackEvent = (name: EventName, properties?: Record<string, any>) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(`[Analytics] Event: ${name}`, properties);
  }

  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', name, properties);
  }

  // Buffer em window para inspeção via Playwright/E2E
  if (typeof window !== 'undefined') {
    const w = window as any;
    w.__cathedra_events = w.__cathedra_events || [];
    w.__cathedra_events.push({ name, properties, ts: Date.now() });
    if (w.__cathedra_events.length > 200) w.__cathedra_events.shift();
  }
};

/**
 * Empty implementation to satisfy existing imports.
 */
export const initGA4AutoTracking = () => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[Analytics] GA4 Auto Tracking Mock Initialized');
  }
};
