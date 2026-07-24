/**
 * P0.2.1 — Fonte única da verdade para a tradução primária da Bíblia.
 *
 * TODOS os consumidores (Reader, Edge Functions, MCP, Nexus, IA, popovers,
 * scripts) devem usar exclusivamente `getActivePrimaryTranslation()`.
 *
 * Proibido:
 *   - `supabase.from('bible_translation_sources').eq('is_primary', true)` para
 *     "escolher" a primária.
 *   - fallback silencioso para "a primeira que responder".
 *
 * A RPC `get_active_primary_translation` retorna 0 ou 1 linha. Se retornar
 * 0, o estado é EXPLÍCITO: "nenhuma tradução ativa" — a UI deve comunicar
 * isso ao leitor, não escolher outra em silêncio.
 *
 * Guardrail: `scripts/bible-primary-guardrail.ts` falha no CI se qualquer
 * consumidor usar padrões proibidos.
 */
import { supabase } from '@/integrations/supabase/client';

export interface ActivePrimaryTranslation {
  id: string;
  code: string;
  name: string;
  translation: string | null;
  status: string;
  pcl_status: string;
}

let _cache: { value: ActivePrimaryTranslation | null; expires: number } | null = null;
const TTL_MS = 5 * 60_000; // 5 min

export async function getActivePrimaryTranslation(
  opts: { forceRefresh?: boolean } = {},
): Promise<ActivePrimaryTranslation | null> {
  const now = Date.now();
  if (!opts.forceRefresh && _cache && _cache.expires > now) return _cache.value;

  const { data, error } = await supabase.rpc('get_active_primary_translation');
  if (error) {
    console.warn('[getActivePrimaryTranslation] rpc error', error);
    return null;
  }
  const row = Array.isArray(data) && data.length > 0 ? (data[0] as ActivePrimaryTranslation) : null;
  _cache = { value: row, expires: now + TTL_MS };
  return row;
}

export function clearActivePrimaryTranslationCache(): void {
  _cache = null;
}
