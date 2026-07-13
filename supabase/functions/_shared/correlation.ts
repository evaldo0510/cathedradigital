// Sprint 1.13 — Correlation ID (ADR-009)
// Extrai `x-correlation-id` do request ou gera novo UUID.
// Devolve o valor + os headers necessários para propagar em:
//   1) resposta HTTP (header x-correlation-id)
//   2) sub-requests ao Supabase (headers globais do client)
// O trigger `capture_governance_audit` lê o header via
// `current_setting('request.headers')` e o persiste em governance_audit_log.

const HEADER = 'x-correlation-id';

// UUID v4 minimalista sem depender de deps externas
function newCorrelationId(): string {
  // deno-lint-ignore no-explicit-any
  const c = (globalThis as any).crypto;
  if (c?.randomUUID) return c.randomUUID();
  // Fallback (usado apenas em runtimes sem crypto.randomUUID)
  return 'cid-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getOrCreateCorrelationId(req: Request): string {
  const incoming = req.headers.get(HEADER)?.trim();
  if (incoming && incoming.length > 0 && incoming.length <= 128) return incoming;
  return newCorrelationId();
}

export function correlationResponseHeader(id: string): Record<string, string> {
  return { [HEADER]: id };
}

export function correlationClientHeaders(id: string): Record<string, string> {
  return { [HEADER]: id };
}

export const CORRELATION_HEADER = HEADER;
