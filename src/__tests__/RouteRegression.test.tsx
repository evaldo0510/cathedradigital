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
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

describe('Route Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear session storage to show splash screen if needed, or set it to skip
    sessionStorage.setItem('cathedra_splash_shown', '1');
  });

  it('renders the Home page correctly', async () => {
    render(<App />);
    
    // Check for some home page content
    // Since App has a header and footer, we can look for those first
    await waitFor(() => {
      expect(screen.getByRole('main')).toBeDefined();
    }, { timeout: 3000 });
  });

  it('initializes Providers correctly without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });

  // More specific route tests would ideally use MemoryRouter, 
  // but since App has BrowserRouter hardcoded in AppProviders, 
  // we'd need to mock the URL or refactor App to be more testable.
  // For now, we're testing the initial load.
});
