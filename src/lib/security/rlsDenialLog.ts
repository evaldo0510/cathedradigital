/**
 * Auditoria de acessos negados por RLS.
 *
 * Quando uma consulta ao banco falha por política de segurança (RLS) ou por
 * falta de permissão, registramos o evento em `public.rls_denial_events`
 * através da RPC `log_rls_denial` (SECURITY DEFINER, executável apenas por
 * sessões autenticadas). O histórico é legível somente por administradores.
 *
 * Nunca envie payload da linha ou valores sensíveis no `context`.
 */
import { supabase } from '@/integrations/supabase/client';

/** Códigos PostgREST/Postgres que indicam bloqueio de acesso. */
const DENIAL_CODES = new Set([
  '42501', // insufficient_privilege / RLS violation
  '42P01', // undefined_table (permissão revogada expõe como tabela inexistente)
  'PGRST301', // JWT ausente/expirado
  'PGRST116', // no rows returned quando single() é bloqueado por RLS
]);

export type DenialAction = 'select' | 'insert' | 'update' | 'delete' | 'realtime';

export interface DenialErrorLike {
  code?: string | null;
  message?: string | null;
}

export function isAccessDenied(error: DenialErrorLike | null | undefined): boolean {
  if (!error) return false;
  if (error.code && DENIAL_CODES.has(error.code)) return true;
  const message = (error.message ?? '').toLowerCase();
  return (
    message.includes('row-level security') ||
    message.includes('row level security') ||
    message.includes('permission denied')
  );
}

/** Evita flood de eventos idênticos vindos do mesmo componente. */
const recentlyLogged = new Map<string, number>();
const DEDUPE_WINDOW_MS = 30_000;

export async function logRlsDenial(
  tableName: string,
  action: DenialAction,
  error?: DenialErrorLike | null,
  context: Record<string, unknown> = {},
): Promise<void> {
  const key = `${tableName}:${action}:${error?.code ?? 'unknown'}`;
  const now = Date.now();
  const last = recentlyLogged.get(key);
  if (last && now - last < DEDUPE_WINDOW_MS) return;
  recentlyLogged.set(key, now);

  try {
    const { data: session } = await supabase.auth.getSession();
    // A RPC exige sessão autenticada; anônimos são apenas ignorados.
    if (!session?.session) return;

    await supabase.rpc('log_rls_denial', {
      p_table: tableName,
      p_action: action,
      p_reason: error?.code ?? error?.message?.slice(0, 200) ?? null,
      p_context: context as never,
    });
  } catch {
    // Auditoria nunca pode quebrar o fluxo do usuário.
  }
}

/**
 * Envolve uma consulta ao Supabase e registra automaticamente a negação.
 * Retorna o mesmo resultado recebido.
 */
export async function withDenialAudit<T extends { error: DenialErrorLike | null }>(
  tableName: string,
  action: DenialAction,
  run: () => Promise<T>,
  context: Record<string, unknown> = {},
): Promise<T> {
  const result = await run();
  if (isAccessDenied(result.error)) {
    void logRlsDenial(tableName, action, result.error, context);
  }
  return result;
}
