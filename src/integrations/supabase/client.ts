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
// This prevents "localStorage is not defined" errors during build/test/SSR
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
      window.localStorage.removeItem(key);
    }
  },
};

export const supabase = createClient<Database>(
  SUPABASE_URL || 'https://placeholder.supabase.co', // Use placeholder to avoid crash during build if vars are missing
  SUPABASE_PUBLISHABLE_KEY || 'placeholder', 
  {
    auth: {
      storage: customStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: typeof window !== 'undefined',
    }
  }
);