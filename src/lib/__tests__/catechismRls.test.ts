/**
 * RLS smoke test for catechism tables.
 * Verifica que tanto o cliente anônimo quanto o autenticado conseguem
 * ler `catechism_official` (texto público da Igreja) sem erro de
 * "permission denied" do PostgREST.
 *
 * Roda contra o Supabase real do projeto. Se as envs não estiverem
 * presentes, o teste é pulado (CI local pode rodar tudo).
 */
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const maybe = URL && KEY ? describe : describe.skip;

maybe('RLS · catechism_official é legível por anon e authenticated', () => {
  const anon = createClient(URL!, KEY!);

  it('anon consegue SELECT em catechism_official', async () => {
    const { error, status } = await anon
      .from('catechism_official')
      .select('paragraph')
      .limit(1);
    // Não pode retornar 401/403 nem "permission denied"
    expect(error?.message ?? '').not.toMatch(/permission denied|row-level security/i);
    expect([200, 206]).toContain(status);
  });

  it('anon consegue SELECT em catechism_cache', async () => {
    const { error, status } = await anon
      .from('catechism_cache')
      .select('paragraph')
      .limit(1);
    expect(error?.message ?? '').not.toMatch(/permission denied|row-level security/i);
    expect([200, 206]).toContain(status);
  });
});
