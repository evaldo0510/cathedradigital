import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";
import { makeLogger } from "../_shared/logger.ts";
import { makeResponder } from "../_shared/http-response.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  const cid = getOrCreateCorrelationId(req);
  const R = makeResponder(cid);
  const log = makeLogger('saint-of-the-day', cid);

  if (req.method === 'OPTIONS') return R.cors();

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
      // Sucesso: mantém payload de domínio (flat) — contrato pré-existente
      return R.raw({
        ...dbSaint,
        description: dbSaint.bio,
        fullBio: dbSaint.full_bio,
        source: "Cathedra Database",
        correlation_id: cid,
      });
    }

    // Sem registro — envelope de erro estrito
    return R.error(404, 'not_found', { message: 'Nenhum santo cadastrado localmente para esta data.' });
  } catch (error) {
    log.error('unhandled', { err: String(error) });
    return R.error(500, 'internal_error', { message: 'Erro interno.' });
  }
});
