import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getOrCreateCorrelationId, correlationResponseHeader } from "../_shared/correlation.ts";
import { makeLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-correlation-id',
  'Access-Control-Expose-Headers': 'x-correlation-id',
  'Content-Type': 'application/json',
};

serve(async (req: Request) => {
  // Sprint A / CAT-001 — correlation_id (ADR-009)
  const cid = getOrCreateCorrelationId(req);
  const cidH = correlationResponseHeader(cid);
  const log = makeLogger('catechism-text', cid);
  const headers = { ...corsHeaders, ...cidH };
  const json = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify({ ...body, correlation_id: cid }), { status, headers });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  try {
    const body = await req.json().catch(() => ({} as any));
    const paragraph = Number(body?.paragraph);

    if (!Number.isFinite(paragraph) || paragraph < 1 || paragraph > 2865) {
      log.warn('invalid_paragraph', { paragraph });
      return json({ error: 'Parágrafo inválido', code: 'invalid_input', paragraph }, 400);
    }

    if (!supabaseUrl || !serviceKey) {
      log.error('missing_env');
      return json({ error: 'Configuração de servidor ausente', code: 'server_misconfig' }, 500);
    }

    let existingContent: any = null;
    let source: 'official' | 'cached' = 'official';

    const officialResp = await fetch(
      `${supabaseUrl}/rest/v1/catechism_official?paragraph=eq.${paragraph}&select=*`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'x-correlation-id': cid } },
    );

    if (officialResp.ok) {
      const rows = await officialResp.json();
      if (rows?.[0]?.content) {
        existingContent = rows[0];
        source = 'official';
      }
    } else {
      log.error('official_query_failed', { status: officialResp.status });
    }

    if (!existingContent) {
      const dbResp = await fetch(
        `${supabaseUrl}/rest/v1/catechism_cache?paragraph=eq.${paragraph}&select=*`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'x-correlation-id': cid } },
      );
      if (dbResp.ok) {
        const rows = await dbResp.json();
        if (rows?.[0]?.content) {
          existingContent = rows[0];
          source = 'cached';
        }
      } else {
        log.error('cache_query_failed', { status: dbResp.status });
      }
    }

    if (existingContent) {
      return json({
        paragraph,
        content: existingContent.content,
        textoBase: existingContent.texto_base || existingContent.textoBase,
        explicacao: existingContent.explicacao,
        interpretacaoProfunda: existingContent.interpretacao_profunda || existingContent.interpretacaoProfunda,
        aplicacaoPratica: existingContent.aplicacao_pratica || existingContent.aplicacaoPratica,
        reflexaoFinal: existingContent.reflexao_final || existingContent.reflexaoFinal,
        exercicio: existingContent.exercicio,
        status: source,
      });
    }

    return json({
      paragraph,
      status: 'not_found',
      code: 'not_found',
      error: `Parágrafo §${paragraph} não encontrado no banco de dados oficial.`,
    }, 200);
  } catch (error) {
    log.error('unhandled', { err: String(error) });
    return json({ error: 'Erro interno. Tente novamente.', code: 'internal_error' }, 500);
  }
});
