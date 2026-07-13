// Edge function: bible-perf-render
// Recebe o tempo de renderização medido no cliente e grava em
// bible_cache_metric_events pela coluna correlation_id.
//
// Body: { correlation_id: string, render_ms: number }
// Resposta: { ok: boolean }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://esm.sh/zod@3.23.8";

const _corsBase = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
  'Access-Control-Expose-Headers': 'x-correlation-id',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BodySchema = z.object({
  correlation_id: z.string().min(8).max(64),
  render_ms: z.number().int().min(0).max(60_000),
});

serve(async (req) => {
  // Sprint A / CAT-001 — correlation_id (ADR-009)
  const _cid = getOrCreateCorrelationId(req);
  const corsHeaders = { ..._corsBase, 'x-correlation-id': _cid };

  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'invalid_payload', details: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { correlation_id, render_ms } = parsed.data;

    // Atualiza somente se o evento existir e ainda não tiver render_ms gravado.
    const { error } = await supabase
      .from('bible_cache_metric_events')
      .update({ render_ms })
      .eq('correlation_id', correlation_id)
      .is('render_ms', null);

    if (error) {
      console.warn('[bible-perf-render] update failed:', error.message);
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[bible-perf-render] unexpected:', String(e?.message || e));
    return new Response(JSON.stringify({ ok: false, error: 'internal' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
