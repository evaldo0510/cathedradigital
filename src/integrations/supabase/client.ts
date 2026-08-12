import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Enhanced validation for CI/Build environments
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const isCI = typeof process !== 'undefined' && (process.env.CI || process.env.NODE_ENV === 'test');
  const errorMsg = '⚠️ Supabase credentials missing (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY).';
  
  if (isCI) {
    console.error(`\n❌ ERROR: ${errorMsg}`);
    console.error('Ensure environment variables are set in your CI pipeline or .env file.\n');
  } else {
    console.warn(errorMsg);
  }
}

// Custom storage handler for SSR/CI environments
const customStorage = {
  getItem: (key: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key, value);
    }
  },
};

/**
 * Dispara o evento global de indisponibilidade do banco.
 * Sprint 7.6B — Frontend Offline / Degraded Mode.
 */
function notifySupabaseUnreachable() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('supabase-unreachable'));
}

export const supabase = createClient<Database>(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_PUBLISHABLE_KEY || 'placeholder', 
  {
    auth: {
      storage: customStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: typeof window !== 'undefined',
    },
    global: {
      fetch: async (url, options) => {
        try {
          const response = await fetch(url, options);
          // 5xx errors or 404 on API endpoints might indicate backend trouble
          if (response.status >= 500) {
            notifySupabaseUnreachable();
          }
          return response;
        } catch (error) {
          // Network errors (Failed to fetch)
          notifySupabaseUnreachable();
          throw error;
        }
      }
    }
  }
);