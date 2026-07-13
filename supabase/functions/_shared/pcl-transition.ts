// Sprint 1.14 — Helper de transição PCL (ADR-010)
// Núcleo compartilhado pelas 6 Edge Functions administrativas:
// pcl-approve, pcl-activate, pcl-suspend, pcl-revoke, pcl-reactivate, pcl-expire.
//
// Responsabilidades:
//   1. CORS + correlation_id (ADR-009).
//   2. Autorização via is_current_user_admin() (ADR-006).
//   3. Validação do payload (zod).
//   4. Pré-check do estado atual contra a matriz permitida.
//   5. UPDATE em bible_translation_sources.
//   6. Resposta padronizada com correlation_id no header.
//
// Nota (Sprint 1.14 / ADR-010): `reason` é aceito e validado, mas NÃO é
// persistido em governance_audit_log — o trigger da Sprint 1.13 captura
// apenas campos fixos do PCL e não pode ser alterado nesta sprint.
// Persistência de reason será tratada em ADR próprio.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { z } from 'https://esm.sh/zod@3.23.8';
import {
  getOrCreateCorrelationId,
  correlationResponseHeader,
} from './correlation.ts';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-correlation-id',
  'Access-Control-Expose-Headers': 'x-correlation-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export type PclState =
  | 'draft'
  | 'submitted'
  | 'validated'
  | 'approved'
  | 'active'
  | 'suspended'
  | 'revoked'
  | 'expired';

// deno-lint-ignore no-explicit-any
export type SupabaseLike = any;

export interface TransitionDeps {
  getClient: (req: Request) => SupabaseLike;
  isAdmin: (supabase: SupabaseLike) => Promise<boolean>;
  getUserId: (supabase: SupabaseLike) => Promise<string | null>;
}

export const defaultDeps: TransitionDeps = {
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
  isAdmin: async (supabase) => {
    const { data, error } = await supabase.rpc('is_current_user_admin');
    return !error && data === true;
  },
  getUserId: async (supabase) => {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  },
};

const BaseBody = z.object({
  source_id: z.string().uuid(),
  reason: z.string().min(1).max(4000).optional(),
});

export interface TransitionSpec {
  action: string;                 // 'approve' | 'activate' | ...
  from: readonly PclState[];      // estados de origem aceitos
  to: PclState;                   // estado de destino
  requiresReason: boolean;        // reason obrigatório?
  // extras adicionais a persistir no UPDATE (ex.: pcl_activated_by/at)
  extras?: (userId: string | null) => Record<string, unknown>;
}

function jsonResponse(
  body: unknown,
  status: number,
  cid: string,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...correlationResponseHeader(cid),
    },
  });
}

export async function handleTransition(
  req: Request,
  spec: TransitionSpec,
  deps: TransitionDeps = defaultDeps,
): Promise<Response> {
  const cid = getOrCreateCorrelationId(req);
  if (!req.headers.get('x-correlation-id')) {
    try { req.headers.set('x-correlation-id', cid); } catch { /* immutable */ }
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { ...corsHeaders, ...correlationResponseHeader(cid) },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405, cid);
  }

  const supabase = deps.getClient(req);

  // Autorização
  const admin = await deps.isAdmin(supabase);
  if (!admin) return jsonResponse({ error: 'forbidden' }, 403, cid);

  // Validação do payload
  const raw = await req.json().catch(() => null);
  const parsed = BaseBody.safeParse(raw);
  if (!parsed.success) {
    return jsonResponse(
      { error: 'invalid_payload', issues: parsed.error.flatten() },
      400,
      cid,
    );
  }
  const { source_id, reason } = parsed.data;

  if (spec.requiresReason && !reason) {
    return jsonResponse(
      { error: 'reason_required', action: spec.action },
      400,
      cid,
    );
  }

  // Pré-check do estado atual
  const { data: current, error: readErr } = await supabase
    .from('bible_translation_sources')
    .select('id, pcl_status')
    .eq('id', source_id)
    .maybeSingle();

  if (readErr) {
    return jsonResponse({ error: 'db_error', reason: readErr.message }, 500, cid);
  }
  if (!current) {
    return jsonResponse({ error: 'source_not_found' }, 404, cid);
  }
  if (!spec.from.includes(current.pcl_status as PclState)) {
    return jsonResponse(
      {
        error: 'invalid_transition',
        current_state: current.pcl_status,
        allowed_from: spec.from,
        target: spec.to,
      },
      409,
      cid,
    );
  }

  // UPDATE (o trigger captura auditoria + correlation_id via header)
  const userId = spec.extras ? await deps.getUserId(supabase) : null;
  const patch: Record<string, unknown> = {
    pcl_status: spec.to,
    ...(spec.extras ? spec.extras(userId) : {}),
  };

  const { data: updated, error: updErr } = await supabase
    .from('bible_translation_sources')
    .update(patch)
    .eq('id', source_id)
    .select('id, pcl_status, pcl_activated_by, pcl_activated_at')
    .single();

  if (updErr) {
    return jsonResponse({ error: 'db_error', reason: updErr.message }, 500, cid);
  }

  return jsonResponse(
    {
      ok: true,
      action: spec.action,
      source_id,
      from: current.pcl_status,
      to: updated.pcl_status,
      reason: reason ?? null,
      correlation_id: cid,
    },
    200,
    cid,
  );
}
