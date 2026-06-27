import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * Cobertura completa de RLS para webhook_logs e profiles.
 * Valida:
 *  - anon: SELECT/INSERT/UPDATE/DELETE bloqueados em webhook_logs
 *  - service_role: CRUD funcional em webhook_logs
 *  - anon: não escala role / is_premium em profiles
 *  - service_role mantém capacidade administrativa
 */

const URL = process.env.SUPABASE_URL!;
const ANON = process.env.SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const hasEnv = !!(URL && ANON && SERVICE);

const anon = hasEnv ? createClient(URL, ANON) : null;
const admin = hasEnv ? createClient(URL, SERVICE, { auth: { persistSession: false } }) : null;

const isBlocked = (error: unknown, data: unknown) =>
  !!error || !Array.isArray(data) || (data as unknown[]).length === 0;

test.describe('webhook_logs — CRUD restrito a admins', () => {
  test.skip(!hasEnv, 'Variáveis Supabase ausentes');

  test('anon SELECT retorna vazio/erro', async () => {
    const { data, error } = await anon!.from('webhook_logs').select('id').limit(5);
    expect((data ?? []).length).toBe(0);
    if (error) expect(error.message).toMatch(/permission|policy|denied|RLS/i);
  });

  test('anon INSERT é bloqueado', async () => {
    const { error } = await anon!
      .from('webhook_logs')
      .insert({ event_id: `e2e-${Date.now()}`, payload: { x: 1 }, status: 'failed' } as any);
    expect(error).not.toBeNull();
  });

  test('anon UPDATE não afeta linhas', async () => {
    const { data, error } = await anon!
      .from('webhook_logs')
      .update({ status: 'success' } as any)
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select();
    expect(isBlocked(error, data)).toBe(true);
  });

  test('anon DELETE não afeta linhas', async () => {
    const { data, error } = await anon!
      .from('webhook_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select();
    expect(isBlocked(error, data)).toBe(true);
  });

  test('service_role: ciclo CRUD completo', async () => {
    const eventId = `e2e-cycle-${Date.now()}`;
    const ins = await admin!
      .from('webhook_logs')
      .insert({ event_id: eventId, payload: { ok: true }, status: 'pending' } as any)
      .select()
      .single();
    expect(ins.error).toBeNull();
    const id = (ins.data as any)?.id;
    expect(id).toBeTruthy();

    const sel = await admin!.from('webhook_logs').select('id').eq('id', id).single();
    expect(sel.error).toBeNull();

    const upd = await admin!
      .from('webhook_logs')
      .update({ status: 'success' } as any)
      .eq('id', id)
      .select();
    expect(upd.error).toBeNull();
    expect((upd.data ?? []).length).toBe(1);

    const del = await admin!.from('webhook_logs').delete().eq('id', id).select();
    expect(del.error).toBeNull();
    expect((del.data ?? []).length).toBe(1);
  });
});

test.describe('profiles — bloqueio de escalada de privilégios', () => {
  test.skip(!hasEnv, 'Variáveis Supabase ausentes');

  const fakeIds = [
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000012',
  ];

  test('anon não escala role para admin', async () => {
    const { data, error } = await anon!
      .from('profiles')
      .update({ role: 'admin' } as any)
      .eq('id', fakeIds[0])
      .select();
    expect(isBlocked(error, data)).toBe(true);
  });

  test('anon não força is_premium', async () => {
    const { data, error } = await anon!
      .from('profiles')
      .update({ is_premium: true } as any)
      .eq('id', fakeIds[1])
      .select();
    expect(isBlocked(error, data)).toBe(true);
  });

  test('anon não lê profiles de terceiros', async () => {
    const { data } = await anon!.from('profiles').select('id,role,is_premium').limit(5);
    expect((data ?? []).length).toBe(0);
  });

  test('anon INSERT não cria perfil com role privilegiada', async () => {
    const { error } = await anon!
      .from('profiles')
      .insert({ id: fakeIds[2], role: 'admin', is_premium: true } as any);
    expect(error).not.toBeNull();
  });

  test('service_role mantém acesso administrativo a profiles', async () => {
    const { error } = await admin!.from('profiles').select('id').limit(1);
    expect(error).toBeNull();
  });
});
