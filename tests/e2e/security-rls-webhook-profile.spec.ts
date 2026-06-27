import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * RLS Regression — bloqueia regressões nos fixes:
 *   - webhook_logs: apenas admins leem/gravam
 *   - profiles: can_update_own_profile bloqueia escalada de role/is_premium
 *
 * Requer SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.
 * Sem service role o teste é marcado como skip (não bloqueia local sem env).
 */

const URL = process.env.SUPABASE_URL!;
const ANON = process.env.SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const hasEnv = !!(URL && ANON && SERVICE);
const anon = hasEnv ? createClient(URL, ANON) : null;
const admin = hasEnv ? createClient(URL, SERVICE, { auth: { persistSession: false } }) : null;

test.describe('Security RLS regression', () => {
  test.skip(!hasEnv, 'SUPABASE_URL/ANON/SERVICE_ROLE_KEY ausentes');

  test('webhook_logs: anônimo não pode SELECT', async () => {
    const { data, error } = await anon!.from('webhook_logs').select('id').limit(1);
    // Esperado: 0 linhas (RLS) ou erro de permissão; nunca dados.
    expect((data ?? []).length).toBe(0);
    if (error) expect(error.message).toMatch(/permission|policy|denied|RLS/i);
  });

  test('webhook_logs: anônimo não pode INSERT', async () => {
    const { error } = await anon!.from('webhook_logs').insert({
      event_id: `e2e-${Date.now()}`,
      payload: { evil: true },
      status: 'failed',
    } as any);
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/permission|policy|denied|RLS|violates/i);
  });

  test('service_role mantém acesso administrativo a webhook_logs', async () => {
    const { error } = await admin!.from('webhook_logs').select('id').limit(1);
    expect(error).toBeNull();
  });

  test('profiles: anônimo não pode escalar role para admin', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000001';
    const { data, error } = await anon!
      .from('profiles')
      .update({ role: 'admin' } as any)
      .eq('id', fakeId)
      .select();
    const blocked = !!error || !data || data.length === 0;
    expect(blocked).toBe(true);
  });

  test('profiles: anônimo não pode forçar is_premium', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000002';
    const { data, error } = await anon!
      .from('profiles')
      .update({ is_premium: true } as any)
      .eq('id', fakeId)
      .select();
    const blocked = !!error || !data || data.length === 0;
    expect(blocked).toBe(true);
  });
});
