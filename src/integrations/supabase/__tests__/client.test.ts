import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Supabase Client Environment', () => {
  const originalWindow = (globalThis as any).window;
  const originalImportMeta = import.meta.env;

  beforeEach(() => {
    vi.resetModules();
    // Setup default env vars if needed
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    vi.unstubAllEnvs();
  });

  it('should initialize without errors when window is undefined (CI/SSR)', async () => {
    // @ts-ignore - testing missing window scenario
    delete global.window;
    
    const { supabase } = await import('../client');
    expect(supabase).toBeDefined();
    // Should not throw ReferenceError: localStorage is not defined
  });

  it('should use custom storage that handles missing localStorage safely', async () => {
    // @ts-ignore - testing missing window scenario
    delete global.window;
    
    const { supabase } = await import('../client');
    // @ts-expect-error - accessing private auth storage to verify it works
    const storage = supabase.auth.storage;
    
    expect(() => storage.getItem('test')).not.toThrow();
    expect(storage.getItem('test')).toBeNull();
  });

  it('should warn or error if environment variables are missing but not crash', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { supabase } = await import('../client');
    expect(supabase).toBeDefined();
    
    const wasCalled = consoleSpy.mock.calls.length > 0 || errorSpy.mock.calls.length > 0;
    expect(wasCalled).toBe(true);
  });
});
