import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  try {
    const body = await req.json();
    const paragraph = body.paragraph;

    if (!paragraph || paragraph < 1 || paragraph > 2865) {
      return new Response(JSON.stringify({ error: 'Parágrafo inválido' }), { status: 400, headers: corsHeaders });
    }

    // Load Existing (Official Priority)
    let existingContent: any = null;
    let source: string = 'official';

    const officialResp = await fetch(`${supabaseUrl}/rest/v1/catechism_official?paragraph=eq.${paragraph}&select=*`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
    });
    
    if (officialResp.ok) {
      const rows = await officialResp.json();
      if (rows?.[0]?.content) {
        existingContent = rows[0];
        source = 'official';
      }
    }

    if (!existingContent) {
      const dbResp = await fetch(`${supabaseUrl}/rest/v1/catechism_cache?paragraph=eq.${paragraph}&select=*`, {
        headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
      });
      if (dbResp.ok) {
        const rows = await dbResp.json();
        if (rows?.[0]?.content) {
          existingContent = rows[0];
          source = 'cached';
        }
      }
    }

    if (existingContent) {
      return new Response(JSON.stringify({ 
        paragraph, 
        content: existingContent.content,
        textoBase: existingContent.texto_base || existingContent.textoBase,
        explicacao: existingContent.explicacao,
        interpretacaoProfunda: existingContent.interpretacao_profunda || existingContent.interpretacaoProfunda,
        aplicacaoPratica: existingContent.aplicacao_pratica || existingContent.aplicacaoPratica,
        reflexaoFinal: existingContent.reflexao_final || existingContent.reflexaoFinal,
        exercicio: existingContent.exercicio,
        status: source
      }), { headers: corsHeaders });
    }

    // If not found, return a specific error that the frontend can handle
    return new Response(JSON.stringify({ 
      paragraph, 
      status: 'not_found',
      error: `Parágrafo §${paragraph} não encontrado no banco de dados oficial.` 
    }), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), { status: 500, headers: corsHeaders });
  }
});
