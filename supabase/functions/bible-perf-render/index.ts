// Edge function: bible-perf-render
// Recebe o tempo de renderização medido no cliente e grava em
// bible_cache_metric_events pela coluna correlation_id.
//
// Body: { correlation_id: string, render_ms: number }
// Resposta sucesso: { ok: true }
// Erros: envelope estrito ErrorEnvelopeSchema (Wave 4a).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";
import { makeResponder } from "../_shared/http-response.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://esm.sh/zod@3.23.8";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BodySchema = z.object({
  correlation_id: z.string().min(8).max(64),
  render_ms: z.number().int().min(0).max(60_000),
});

serve(async (req) => {
  const cid = getOrCreateCorrelationId(req);
  const R = makeResponder(cid);

  if (req.method === 'OPTIONS') return R.cors();
  if (req.method !== 'POST') return R.error(405, 'method_not_allowed');

  try {
    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return R.error(400, 'invalid_body', parsed.error.flatten().fieldErrors);
    }
    const { correlation_id, render_ms } = parsed.data;

    const { error } = await supabase
      .from('bible_cache_metric_events')
      .update({ render_ms })
      .eq('correlation_id', correlation_id)
      .is('render_ms', null);

    if (error) {
      console.warn('[bible-perf-render] update failed:', error.message);
      return R.error(500, 'internal_error', { message: error.message });
    }

    return R.raw({ ok: true });
  } catch (e: any) {
    console.error('[bible-perf-render] unexpected:', String(e?.message || e));
    return R.error(500, 'internal_error', { message: 'internal' });
  }
});
