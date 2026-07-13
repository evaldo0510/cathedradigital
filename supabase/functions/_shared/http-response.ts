// Sprint A / CAT-008 — Contrato HTTP padronizado para Edge Functions
// Padroniza:
//   - CORS unificado (inclui x-correlation-id)
//   - Envelope de erro: { error: string, code?: string, details?, correlation_id }
//   - Envelope de sucesso: { data: <payload>, correlation_id }
//   - Sempre propaga x-correlation-id no header
//
// Uso:
//   const cid = getOrCreateCorrelationId(req);
//   const R = makeResponder(cid);
//   return R.ok({ foo: 1 });
//   return R.error(400, 'invalid_query', { issues });
//
// Códigos de erro padronizados (estáveis, versionados):
//   invalid_query | invalid_body | unauthorized | forbidden | not_found
//   method_not_allowed | rate_limited | pcl_blocked | conflict | internal_error
//
// NÃO alterar sem bumpar o contrato HTTP (ver CONTRATOS-EDGE-FUNCTIONS-PCL.md).

import { CORRELATION_HEADER } from './correlation.ts';

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-correlation-id',
  'Access-Control-Expose-Headers': 'x-correlation-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export type ErrorCode =
  | 'invalid_query'
  | 'invalid_body'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'method_not_allowed'
  | 'rate_limited'
  | 'pcl_blocked'
  | 'conflict'
  | 'internal_error';

export interface Responder {
  cors(): Response;
  ok<T>(data: T, status?: number): Response;
  raw(body: unknown, status?: number): Response;
  error(status: number, code: ErrorCode | string, details?: unknown): Response;
}

export function makeResponder(correlationId: string): Responder {
  const cidHeader = { [CORRELATION_HEADER]: correlationId };
  const base = { ...corsHeaders, ...cidHeader, 'Content-Type': 'application/json' };

  return {
    cors: () =>
      new Response('ok', { headers: { ...corsHeaders, ...cidHeader } }),
    ok: <T>(data: T, status = 200) =>
      new Response(JSON.stringify({ data, correlation_id: correlationId }), {
        status,
        headers: base,
      }),
    raw: (body, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: base }),
    error: (status, code, details) =>
      new Response(
        JSON.stringify({
          error: code,
          ...(details !== undefined ? { details } : {}),
          correlation_id: correlationId,
        }),
        { status, headers: base },
      ),
  };
}
