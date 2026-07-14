/**
 * bible-abbr-validate
 *
 * Endpoint leve para validar uma abreviação bíblica sem acionar a rota
 * completa de texto (`bible-text`). Útil para testes rápidos do canon
 * e da normalização (ex.: "2 Cr" → "2Cr", bollsId 14).
 *
 * GET  /bible-abbr-validate?abbrev=2%20Cr
 * POST /bible-abbr-validate  { "abbrev": "2 Cr" }
 *
 * Resposta 200 (sucesso) — contrato de domínio:
 * {
 *   "input": "2 Cr",
 *   "normalized": "2Cr",
 *   "canonical_abbr": "2Cr",
 *   "book_name": "2 Crônicas",
 *   "bollsId": 14,
 *   "testament": "OT",
 *   "deuterocanonical": false,
 *   "resolved": true
 * }
 *
 * Resposta 404 (abbrev não reconhecida) — MANTÉM contrato de domínio
 * documentado na EDGE-FUNCTIONS-STRICT-ENVELOPE-MATRIX (exceção Wave 2)
 * porque callers já dependem do payload `{ resolved: false, ... }`.
 *
 * Erros 400/405 (validação / método) — Fase A2.b Wave 2:
 *   envelope estrito `{ error, correlation_id, details? }` via makeResponder.
 */
import { findBookByAbbr, normalizeAbbr } from '../_shared/bibleCanon.ts';
import { getOrCreateCorrelationId, correlationResponseHeader } from '../_shared/correlation.ts';
import { makeResponder } from '../_shared/http-response.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
  'Access-Control-Expose-Headers': 'x-correlation-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Sprint A / CAT-001 — correlation_id (ADR-009)
  const cid = getOrCreateCorrelationId(req);
  const cidH = correlationResponseHeader(cid);
  const R = makeResponder(cid);

  // Helper apenas para respostas de domínio (200 / 404 resolved:false).
  const json = (body: unknown, status = 200): Response =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, ...cidH, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders, ...cidH } });
  }

  let abbrev: string | null = null;
  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      abbrev = url.searchParams.get('abbrev') ?? url.searchParams.get('abbr');
    } else if (req.method === 'POST') {
      const body = await req.json().catch(() => ({} as Record<string, unknown>));
      const v = (body as Record<string, unknown>).abbrev ?? (body as Record<string, unknown>).abbr;
      abbrev = typeof v === 'string' ? v : null;
    } else {
      return R.error(405, 'method_not_allowed');
    }
  } catch (_err) {
    return R.error(400, 'invalid_body', { reason: 'malformed_request' });
  }

  if (!abbrev || typeof abbrev !== 'string' || abbrev.trim().length === 0) {
    return R.error(400, 'invalid_body', {
      reason: 'missing_abbrev',
      hint: 'Parâmetro `abbrev` obrigatório (string não vazia).',
    });
  }
  if (abbrev.length > 64) {
    return R.error(400, 'invalid_body', {
      reason: 'abbrev_too_long',
      max_length: 64,
    });
  }

  const normalized = normalizeAbbr(abbrev);
  const book = findBookByAbbr(abbrev);

  if (!book) {
    // 404 mantém contrato de domínio (exceção documentada Wave 2)
    return json(
      {
        input: abbrev,
        normalized,
        canonical_abbr: null,
        book_name: null,
        bollsId: null,
        testament: null,
        deuterocanonical: null,
        resolved: false,
        reason: `Abreviação não reconhecida: "${abbrev}". Verifique BIBLE_CANON em supabase/functions/_shared/bibleCanon.ts.`,
      },
      404,
    );
  }

  return json({
    input: abbrev,
    normalized,
    canonical_abbr: book.abbr,
    book_name: book.name,
    bollsId: book.bollsId,
    testament: book.testament,
    deuterocanonical: book.deuterocanonical ?? false,
    resolved: true,
  });
});
