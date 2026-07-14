import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";
import { makeLogger } from "../_shared/logger.ts";
import { makeResponder } from "../_shared/http-response.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function ordinal(month: number, day: number) {
  return month * 100 + day;
}

serve(async (req) => {
  const cid = getOrCreateCorrelationId(req);
  const R = makeResponder(cid);
  const log = makeLogger('saint-of-the-day', cid);

  if (req.method === 'OPTIONS') return R.cors();

  try {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;

    // 1) Tentativa exata para hoje
    const { data: dbSaint, error: dbError } = await supabase
      .from('saints')
      .select('*')
      .eq('feast_month', month)
      .eq('feast_day_num', day)
      .limit(1)
      .maybeSingle();

    if (dbSaint && !dbError) {
      return R.raw({
        ...dbSaint,
        description: dbSaint.bio,
        fullBio: dbSaint.full_bio,
        source: "Cathedra Database",
        is_fallback: false,
        correlation_id: cid,
      });
    }

    // 2) Fallback: próximo santo do calendário (mesmo mês em diante, com wrap para janeiro)
    const { data: all, error: allErr } = await supabase
      .from('saints')
      .select('*')
      .not('feast_month', 'is', null)
      .not('feast_day_num', 'is', null);

    if (!allErr && all && all.length > 0) {
      const todayOrd = ordinal(month, day);
      // score: dias até a próxima festa (0..365)
      const withScore = all.map((s: any) => {
        const so = ordinal(s.feast_month, s.feast_day_num);
        const delta = so > todayOrd ? so - todayOrd : so - todayOrd + 1231;
        return { s, delta };
      });
      withScore.sort((a, b) => a.delta - b.delta);
      const next = withScore[0].s;

      log.info?.('fallback_next_saint', { requested: { month, day }, chosen: { m: next.feast_month, d: next.feast_day_num } });

      return R.raw({
        ...next,
        description: next.bio,
        fullBio: next.full_bio,
        source: "Cathedra Database",
        is_fallback: true,
        fallback_reason: "no_saint_for_today",
        requested_date: { month, day },
        correlation_id: cid,
      });
    }

    // 3) Só falha se a tabela estiver totalmente vazia
    return R.error(404, 'not_found', { message: 'Base de santos vazia.' });
  } catch (error) {
    log.error('unhandled', { err: String(error) });
    return R.error(500, 'internal_error', { message: 'Erro interno.' });
  }
});
