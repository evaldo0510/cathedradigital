// Endpoint API — Busca de traduções por referência canônica (multi-provedor)
// GET ?abbrev=Jo&chapter=3&verse=16&translation_id=<uuid>
// - Camada Canônica agnóstica: aceita QUALQUER translation_id ativo sob PCL-1.0.
// - Se translation_id omitido: usa a fonte marcada `is_primary=true` E `pcl_status='active'`.
// - Bloqueia leitura se PCL bloqueou (suspended/revoked/draft) → 423 Locked.
//
// Sprint 1.12: `handleRequest(req, deps)` isola o handler do runtime para permitir
// testes por injeção. `Deno.serve` chama-o com deps padrão em produção.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { z } from 'https://esm.sh/zod@3.23.8';
import { checkRateLimit as defaultCheckRateLimit } from '../_shared/rate-limit.ts';
import {
  getOrCreateCorrelationId,
  correlationResponseHeader,
} from '../_shared/correlation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
  'Access-Control-Expose-Headers': 'x-correlation-id',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...extra },
  });


const QuerySchema = z.object({
  abbrev: z.string().trim().min(1).max(16),
  chapter: z.coerce.number().int().positive(),
  verse: z.coerce.number().int().positive().optional(),
  translation_id: z.string().uuid().optional(),
});

// deno-lint-ignore no-explicit-any
export type SupabaseLike = any;

export interface LookupDeps {
  getClient: () => SupabaseLike;
  checkRateLimit: (ip: string | null) => boolean;
}

const defaultDeps: LookupDeps = {
  getClient: () => createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  ),
  checkRateLimit: defaultCheckRateLimit,
};

export async function handleRequest(req: Request, deps: LookupDeps = defaultDeps): Promise<Response> {
export async function handleRequest(req: Request, deps: LookupDeps = defaultDeps): Promise<Response> {
  // Sprint 1.13 / ADR-009 — correlation_id ponta a ponta
  const cid = getOrCreateCorrelationId(req);
  const cidHeaders = correlationResponseHeader(cid);
  const j = (body: unknown, status = 200) => json(body, status, cidHeaders);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: { ...corsHeaders, ...cidHeaders } });
  if (req.method !== 'GET') return j({ error: 'method_not_allowed' }, 405);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  if (!deps.checkRateLimit(ip)) return j({ error: 'rate_limited' }, 429);

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return j({ error: 'invalid_query', issues: parsed.error.flatten() }, 400);
  const { abbrev, chapter, verse, translation_id } = parsed.data;


  const supabase = deps.getClient();

  try {
    let tId = translation_id ?? null;
    let tRow: { id: string; provider: string | null; pcl_status: string; code: string } | null = null;

    if (tId) {
      const { data, error } = await supabase
        .from('bible_translation_sources')
        .select('id, provider, pcl_status, code')
        .eq('id', tId)
        .maybeSingle();
      if (error) return j({ error: 'db_error', reason: error.message }, 500);
      if (!data) return j({ error: 'translation_not_found' }, 404);
      tRow = data;
    } else {
      const { data, error } = await supabase
        .from('bible_translation_sources')
        .select('id, provider, pcl_status, code')
        .eq('is_primary', true)
        .eq('pcl_status', 'active')
        .maybeSingle();
      if (error) return j({ error: 'db_error', reason: error.message }, 500);
      if (!data) return j({ error: 'no_active_primary_translation' }, 503);
      tRow = data;
      tId = data.id;
    }

    const { data: gate, error: gateErr } = await supabase.rpc('bible_translation_readable', {
      p_translation_id: tId,
    });
    if (gateErr) return j({ error: 'gate_error', reason: gateErr.message }, 500);
    const gateRow = Array.isArray(gate) ? gate[0] : gate;
    if (!gateRow?.readable) {
      return j(
        {
          error: 'pcl_blocked',
          reason: gateRow?.reason ?? 'blocked',
          provider: tRow!.provider,
          pcl_status: tRow!.pcl_status,
        },
        423,
      );
    }

    const { data: book, error: bookErr } = await supabase
      .from('bible_books')
      .select('id, name, abbrev')
      .eq('abbrev', abbrev)
      .maybeSingle();
    if (bookErr) return j({ error: 'db_error', reason: bookErr.message }, 500);
    if (!book) return j({ error: 'unknown_abbrev', received_abbrev: abbrev }, 404);

    const { data: chap, error: chapErr } = await supabase
      .from('bible_chapters')
      .select('id, number')
      .eq('book_id', book.id)
      .eq('number', chapter)
      .maybeSingle();
    if (chapErr) return j({ error: 'db_error', reason: chapErr.message }, 500);
    if (!chap) return j({ error: 'chapter_not_found', abbrev, chapter }, 404);

    let vq = supabase
      .from('bible_verses')
      .select('number, text')
      .eq('chapter_id', chap.id)
      .order('number', { ascending: true });
    if (verse !== undefined) vq = vq.eq('number', verse);

    const { data: verses, error: vErr } = await vq;
    if (vErr) return j({ error: 'db_error', reason: vErr.message }, 500);

    return j({
      book: { abbrev: book.abbrev, name: book.name },
      chapter,
      verses: verses ?? [],
      translation: {
        id: tRow!.id,
        code: tRow!.code,
        provider: tRow!.provider,
        pcl_status: tRow!.pcl_status,
      },
    });
  } catch (err) {
    console.error('[translation-lookup] unhandled', err);
    return j({ error: 'internal_error' }, 500);
  }
}

Deno.serve((req) => handleRequest(req));
