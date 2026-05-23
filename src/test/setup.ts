import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global Supabase Mock
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn((table) => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockImplementation(() => Promise.resolve({ data: null, error: null })),
      then: vi.fn().mockImplementation(function(this: any, resolve) {
        // Return default empty array for tags, or null for other things
        const data = table === 'nexus_tags' ? [] : null;
        if (typeof resolve === 'function') {
          return Promise.resolve(resolve({ data, error: null }));
        }
        return Promise.resolve({ data, error: null });
      }),
    })),

  },
}));
