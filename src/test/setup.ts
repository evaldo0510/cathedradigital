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
    from: vi.fn((table) => {
      const mockResult = {
        data: table === 'nexus_tags' ? [] : null,
        error: null
      };
      
      const chain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(mockResult)),
        then: vi.fn().mockImplementation(function(this: any, resolve) {
          if (typeof resolve === 'function') {
            return Promise.resolve(resolve(mockResult));
          }
          return Promise.resolve(mockResult);
        }),
      };
      
      return chain;
    }),


  },
}));
