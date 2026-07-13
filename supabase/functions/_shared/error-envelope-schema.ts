// Sprint A / CAT-002 — Schema Zod único do envelope de erro
// Espelha exatamente o formato produzido por `makeResponder(cid).error(...)`
// em `_shared/http-response.ts`. NÃO alterar sem bumpar o contrato HTTP.
//
// Formato:
//   { error: string, details?: unknown, correlation_id: string }
//
// Códigos estáveis (mantidos em sync com ErrorCode em http-response.ts):
//   invalid_query | invalid_body | unauthorized | forbidden | not_found
//   method_not_allowed | rate_limited | pcl_blocked | conflict | internal_error

import { z } from 'https://esm.sh/zod@3.23.8';

export const ERROR_CODES = [
  'invalid_query',
  'invalid_body',
  'unauthorized',
  'forbidden',
  'not_found',
  'method_not_allowed',
  'rate_limited',
  'pcl_blocked',
  'conflict',
  'internal_error',
] as const;

export const ErrorCodeSchema = z.enum(ERROR_CODES);

// strict() → não admite campos extras vazando (verses, data, etc.)
export const ErrorEnvelopeSchema = z
  .object({
    error: z.string().min(1),
    correlation_id: z.string().min(1).max(128),
    details: z.unknown().optional(),
  })
  .strict();

export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

// Versão que também exige código conhecido (para testes estritos de A2)
export const StrictErrorEnvelopeSchema = z
  .object({
    error: ErrorCodeSchema,
    correlation_id: z.string().min(1).max(128),
    details: z.unknown().optional(),
  })
  .strict();
