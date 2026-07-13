// Endpoint API — Camada Nexus (ADR-004)
// GET  ?kind=bible_verse&abbrev=Jo&chapter=3&verse=16  → lista relações ancoradas
// GET  ?kind=catechism_paragraph&paragraph=460          → idem para CIC
// POST { relation_type, source_kind, source_ref, target_kind, target_ref, ... } (admin)
// PATCH/DELETE ?id=...                                  (admin)
//
// Sprint 1.12: `handleRequest(req, deps)` isola o handler do runtime para permitir
// testes por injeção. `Deno.serve` chama-o com deps padrão em produção.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { z } from 'https://esm.sh/zod@3.23.8';
import { checkRateLimit as defaultCheckRateLimit } from '../_shared/rate-limit.ts';
import {
  getOrCreateCorrelationId,
  correlationResponseHeader,
  correlationClientHeaders,
} from '../_shared/correlation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
  'Access-Control-Expose-Headers': 'x-correlation-id',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...extra },
  });


const RefKind = z.enum(['bible_verse', 'catechism_paragraph', 'magisterium_doc', 'patristic', 'other']);

const RelationInput = z.object({
  relation_type: z.string().min(1).max(64),
  source_kind: RefKind,
  source_ref: z.record(z.unknown()),
  target_kind: RefKind,
  target_ref: z.record(z.unknown()),
  attributed_to: z.string().max(256).optional().nullable(),
  note: z.string().max(4000).optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable(),
}).strict();

const RelationPatch = RelationInput.partial();

// deno-lint-ignore no-explicit-any
export type SupabaseLike = any;

export interface NexusDeps {
  getClient: (req: Request) => SupabaseLike;
  checkRateLimit: (ip: string | null) => boolean;
  isAdmin: (supabase: SupabaseLike) => Promise<boolean>;
}

const defaultDeps: NexusDeps = {
  getClient: (req: Request) => {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const cid = req.headers.get('x-correlation-id') ?? '';
    return createClient(url, anon, {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization') ?? '',
          ...(cid ? { 'x-correlation-id': cid } : {}),
        },
      },
    });
  },
  checkRateLimit: defaultCheckRateLimit,
  isAdmin: async (supabase) => {
    const { data, error } = await supabase.rpc('is_current_user_admin');
    return !error && data === true;
  },
};

export async function handleRequest(req: Request, deps: NexusDeps = defaultDeps): Promise<Response> {
  // Sprint 1.13 / ADR-009 — correlation_id ponta a ponta
  const cid = getOrCreateCorrelationId(req);
  const cidHeaders = correlationResponseHeader(cid);
  // Injeta no request para que defaultDeps.getClient propague ao Supabase client
  if (!req.headers.get('x-correlation-id')) {
    try { req.headers.set('x-correlation-id', cid); } catch { /* immutable in some runtimes */ }
  }
  const j = (body: unknown, status = 200) => json(body, status, cidHeaders);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: { ...corsHeaders, ...cidHeaders } });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  if (!deps.checkRateLimit(ip)) return j({ error: 'rate_limited' }, 429);

  const supabase = deps.getClient(req);
  const url = new URL(req.url);


  try {
    if (req.method === 'GET') {
      const kind = url.searchParams.get('kind');
      if (!kind || !RefKind.safeParse(kind).success) {
        return j({ error: 'invalid_kind' }, 400);
      }
      const limit = Math.min(Number(url.searchParams.get('limit') ?? '50') || 50, 200);

      let query = supabase.from('nexus_relations').select('*').limit(limit);

      if (kind === 'bible_verse') {
        const abbrev = url.searchParams.get('abbrev');
        const chapter = Number(url.searchParams.get('chapter'));
        const verse = url.searchParams.get('verse') ? Number(url.searchParams.get('verse')) : null;
        if (!abbrev || !Number.isInteger(chapter) || chapter < 1) {
          return j({ error: 'invalid_bible_ref' }, 400);
        }
        const srcRef: Record<string, unknown> = { abbrev, chapter };
        if (verse !== null) srcRef.verse = verse;
        query = query.or(
          `and(source_kind.eq.bible_verse,source_ref.cs.${JSON.stringify(srcRef)}),` +
          `and(target_kind.eq.bible_verse,target_ref.cs.${JSON.stringify(srcRef)})`
        );
      } else if (kind === 'catechism_paragraph') {
        const paragraph = Number(url.searchParams.get('paragraph'));
        if (!Number.isInteger(paragraph) || paragraph < 1) {
          return j({ error: 'invalid_ccc_ref' }, 400);
        }
        const ref = JSON.stringify({ paragraph });
        query = query.or(
          `and(source_kind.eq.catechism_paragraph,source_ref.cs.${ref}),` +
          `and(target_kind.eq.catechism_paragraph,target_ref.cs.${ref})`
        );
      } else {
        return j({ error: 'kind_not_supported_yet' }, 400);
      }

      const { data, error } = await query;
      if (error) return j({ error: 'db_error', reason: error.message }, 500);
      return j({ items: data ?? [] });
    }

    // Mutations exigem admin
    if (['POST', 'PATCH', 'DELETE'].includes(req.method)) {
      if (!(await deps.isAdmin(supabase))) return j({ error: 'forbidden' }, 403);
    }

    if (req.method === 'POST') {
      const raw = await req.json().catch(() => null);
      const parsed = RelationInput.safeParse(raw);
      if (!parsed.success) return j({ error: 'invalid_payload', issues: parsed.error.flatten() }, 400);
      const { data, error } = await supabase.from('nexus_relations').insert(parsed.data).select().single();
      if (error) return j({ error: 'db_error', reason: error.message }, 500);
      return j({ item: data }, 201);
    }

    if (req.method === 'PATCH') {
      const id = url.searchParams.get('id');
      if (!id) return j({ error: 'missing_id' }, 400);
      const raw = await req.json().catch(() => null);
      const parsed = RelationPatch.safeParse(raw);
      if (!parsed.success) return j({ error: 'invalid_payload', issues: parsed.error.flatten() }, 400);
      const { data, error } = await supabase.from('nexus_relations').update(parsed.data).eq('id', id).select().single();
      if (error) return j({ error: 'db_error', reason: error.message }, 500);
      return j({ item: data });
    }

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) return j({ error: 'missing_id' }, 400);
      const { error } = await supabase.from('nexus_relations').delete().eq('id', id);
      if (error) return j({ error: 'db_error', reason: error.message }, 500);
      return j({ ok: true });
    }

    return j({ error: 'method_not_allowed' }, 405);
  } catch (err) {
    console.error('[nexus-relations] unhandled', err);
    return j({ error: 'internal_error' }, 500);
  }
}

Deno.serve((req) => handleRequest(req));
