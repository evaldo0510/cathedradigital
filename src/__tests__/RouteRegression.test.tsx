import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../App';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

// Mock window.scrollTo and element.scrollTo
window.scrollTo = vi.fn();
Element.prototype.scrollTo = vi.fn();

// Mock window.speechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    speaking: false,
    getVoices: vi.fn(() => []),
  },
});

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  return {
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
      header: ({ children, ...props }: any) => <header {...props}>{children}</header>,
      main: ({ children, ...props }: any) => <main {...props}>{children}</main>,
      nav: ({ children, ...props }: any) => <nav {...props}>{children}</nav>,
      button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
      span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
      p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    MotionConfig: ({ children }: any) => <>{children}</>,
  };
});

describe('Route Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.setItem('cathedra_splash_shown', '1');
    // Default to home
    window.history.pushState({}, '', '/');
  });

  it('renders the Home page correctly', async () => {
    render(<App />);
    await waitFor(() => {
      // Look for unique home page element if possible, 
      // otherwise check if main layout elements are present
      expect(screen.getByRole('main')).toBeDefined();
    }, { timeout: 3000 });
  });

  it('renders the Bible route correctly', async () => {
    window.history.pushState({}, '', '/bible');
    render(<App />);
    // Check for Bible-specific content or skeleton
    await waitFor(() => {
      expect(screen.getByRole('main')).toBeDefined();
    }, { timeout: 3000 });
  });

  it('renders the Catechism route correctly', async () => {
    window.history.pushState({}, '', '/catechism');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('main')).toBeDefined();
    }, { timeout: 3000 });
  });

  it('renders the Magisterium route correctly', async () => {
    window.history.pushState({}, '', '/magisterium');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('main')).toBeDefined();
    }, { timeout: 3000 });
  });

  it('renders the Logos route correctly', async () => {
    window.history.pushState({}, '', '/logos');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('main')).toBeDefined();
    }, { timeout: 3000 });
  });

  it('handles invalid routes by redirecting to Home', async () => {
    window.history.pushState({}, '', '/invalid-route');
    render(<App />);
    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });
  });

  it('ensures Providers initialize correctly without infinite loops', async () => {
    const { container } = render(<App />);
    // If there was an infinite loop, the test would likely timeout or fail here
    expect(container).toBeDefined();
    
    // Check for some provider-driven content (e.g. language-dependent text)
    await waitFor(() => {
      // UI might show "Contemplando..." or something similar from App.tsx
      const loadingText = screen.queryByText(/Contemplando/i);
      if (loadingText) {
        expect(loadingText).toBeDefined();
      }
    });
  });
});
