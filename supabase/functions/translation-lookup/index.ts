// Endpoint API — Busca de traduções por referência canônica (multi-provedor)
// GET ?abbrev=Jo&chapter=3&verse=16&translation_id=<uuid>
// - Camada Canônica agnóstica: aceita QUALQUER translation_id ativo sob PCL-1.0.
// - Se translation_id omitido: usa a fonte marcada `is_primary=true` E `pcl_status='active'`.
// - Bloqueia leitura se PCL bloqueou (suspended/revoked/draft).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { z } from 'https://esm.sh/zod@3.23.8';
import { checkRateLimit } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const QuerySchema = z.object({
  abbrev: z.string().trim().min(1).max(16),
  chapter: z.coerce.number().int().positive(),
  verse: z.coerce.number().int().positive().optional(),
  translation_id: z.string().uuid().optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  if (!checkRateLimit(ip)) return json({ error: 'rate_limited' }, 429);

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return json({ error: 'invalid_query', issues: parsed.error.flatten() }, 400);
  const { abbrev, chapter, verse, translation_id } = parsed.data;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    // Resolver tradução
    let tId = translation_id ?? null;
    let tRow: { id: string; provider: string | null; pcl_status: string; code: string } | null = null;

    if (tId) {
      const { data, error } = await supabase
        .from('bible_translation_sources')
        .select('id, provider, pcl_status, code')
        .eq('id', tId)
        .maybeSingle();
      if (error) return json({ error: 'db_error', reason: error.message }, 500);
      if (!data) return json({ error: 'translation_not_found' }, 404);
      tRow = data;
    } else {
      const { data, error } = await supabase
        .from('bible_translation_sources')
        .select('id, provider, pcl_status, code')
        .eq('is_primary', true)
        .eq('pcl_status', 'active')
        .maybeSingle();
      if (error) return json({ error: 'db_error', reason: error.message }, 500);
      if (!data) return json({ error: 'no_active_primary_translation' }, 503);
      tRow = data;
      tId = data.id;
    }

    // Gate PCL-1.0
    const { data: gate, error: gateErr } = await supabase.rpc('bible_translation_readable', {
      p_translation_id: tId,
    });
    if (gateErr) return json({ error: 'gate_error', reason: gateErr.message }, 500);
    const gateRow = Array.isArray(gate) ? gate[0] : gate;
    if (!gateRow?.readable) {
      return json(
        {
          error: 'pcl_blocked',
          reason: gateRow?.reason ?? 'blocked',
          provider: tRow.provider,
          pcl_status: tRow.pcl_status,
        },
        423, // Locked
      );
    }

    // Buscar livro pelo abbrev
    const { data: book, error: bookErr } = await supabase
      .from('bible_books')
      .select('id, name, abbrev')
      .eq('abbrev', abbrev)
      .maybeSingle();
    if (bookErr) return json({ error: 'db_error', reason: bookErr.message }, 500);
    if (!book) return json({ error: 'unknown_abbrev', received_abbrev: abbrev }, 404);

    // Capítulo
    const { data: chap, error: chapErr } = await supabase
      .from('bible_chapters')
      .select('id, number')
      .eq('book_id', book.id)
      .eq('number', chapter)
      .maybeSingle();
    if (chapErr) return json({ error: 'db_error', reason: chapErr.message }, 500);
    if (!chap) return json({ error: 'chapter_not_found', abbrev, chapter }, 404);

    // Versículos
    let vq = supabase
      .from('bible_verses')
      .select('number, text')
      .eq('chapter_id', chap.id)
      .order('number', { ascending: true });
    if (verse !== undefined) vq = vq.eq('number', verse);

    const { data: verses, error: vErr } = await vq;
    if (vErr) return json({ error: 'db_error', reason: vErr.message }, 500);

    return json({
      book: { abbrev: book.abbrev, name: book.name },
      chapter,
      verses: verses ?? [],
      translation: {
        id: tRow.id,
        code: tRow.code,
        provider: tRow.provider,
        pcl_status: tRow.pcl_status,
      },
    });
  } catch (err) {
    console.error('[translation-lookup] unhandled', err);
    return json({ error: 'internal_error' }, 500);
  }
});
