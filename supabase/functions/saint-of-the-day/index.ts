import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { getOrCreateCorrelationId, correlationResponseHeader } from "../_shared/correlation.ts";
import { makeLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
  'Access-Control-Expose-Headers': 'x-correlation-id',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  const cid = getOrCreateCorrelationId(req);
  const cidH = correlationResponseHeader(cid);
  const log = makeLogger('saint-of-the-day', cid);
  const headers = { ...corsHeaders, ...cidH };

  if (req.method === 'OPTIONS') return new Response(null, { headers });

  try {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;

    const { data: dbSaint, error: dbError } = await supabase
      .from('saints')
      .select('*')
      .eq('feast_month', month)
      .eq('feast_day_num', day)
      .limit(1)
      .maybeSingle();

    if (dbSaint && !dbError) {
      return new Response(JSON.stringify({
        ...dbSaint,
        description: dbSaint.bio,
        fullBio: dbSaint.full_bio,
        source: "Cathedra Database",
        correlation_id: cid,
      }), { headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      name: "Santo do Dia",
      bio: "Nenhum santo cadastrado localmente para esta data.",
      source: "Cathedra (Local Only)",
      correlation_id: cid,
    }), {
      status: 404,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    log.error('unhandled', { err: String(error) });
    return new Response(JSON.stringify({ error: 'Erro interno.', correlation_id: cid }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
