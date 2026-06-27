import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Content-Type': 'application/json',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  try {
    const body = await req.json().catch(() => ({} as any));
    const paragraph = Number(body?.paragraph);

    if (!Number.isFinite(paragraph) || paragraph < 1 || paragraph > 2865) {
      return json({ error: 'Parágrafo inválido', code: 'invalid_input', paragraph }, 400);
    }

    if (!supabaseUrl || !serviceKey) {
      console.error('[catechism-text] missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return json({ error: 'Configuração de servidor ausente', code: 'server_misconfig' }, 500);
    }

    let existingContent: any = null;
    let source: 'official' | 'cached' = 'official';

    const officialResp = await fetch(
      `${supabaseUrl}/rest/v1/catechism_official?paragraph=eq.${paragraph}&select=*`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    );

    if (officialResp.ok) {
      const rows = await officialResp.json();
      if (rows?.[0]?.content) {
        existingContent = rows[0];
        source = 'official';
      }
    } else {
      console.error('[catechism-text] official query failed', officialResp.status, await officialResp.text().catch(() => ''));
    }

    if (!existingContent) {
      const dbResp = await fetch(
        `${supabaseUrl}/rest/v1/catechism_cache?paragraph=eq.${paragraph}&select=*`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
      );
      if (dbResp.ok) {
        const rows = await dbResp.json();
        if (rows?.[0]?.content) {
          existingContent = rows[0];
          source = 'cached';
        }
      } else {
        console.error('[catechism-text] cache query failed', dbResp.status);
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

    return json(
      {
        paragraph,
        status: 'not_found',
        code: 'not_found',
        error: `Parágrafo §${paragraph} não encontrado no banco de dados oficial.`,
      },
      200,
    );
  } catch (error) {
    console.error('[catechism-text] unhandled', error);
    return json({ error: 'Erro interno. Tente novamente.', code: 'internal_error' }, 500);
  }
});
