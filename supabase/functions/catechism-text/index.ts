import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Key paragraphs with full deep content
const PT_PARAGRAPHS: Record<number, any> = {
  1: {
    content: 'Deus, infinitamente perfeito e bem-aventurado em si mesmo, num desígnio de pura bondade, criou livremente o homem para o tornar participante da sua vida bem-aventurada. É por isso que, em todo o tempo e em todo o lugar, Ele está perto do homem. Chama-o e ajuda-o a procurá-Lo, a conhecê-Lo e a amá-Lo com todas as suas forças. Convoca todos os homens, dispersos pelo pecado, para a unidade da sua família, a Igreja. Para isso, enviou o seu Filho como Redentor e Salvador, quando chegou a plenitude dos tempos. N\'Ele e por Ele, chama os homens a tornarem-se, no Espírito Santo, seus filhos adotivos e, portanto, herdeiros da sua vida bem-aventurada.',
    textoBase: "Deus criou o homem para o tornar participante da sua vida.",
    explicacao: "Este parágrafo estabelece o fundamento de toda a fé: fomos criados por amor e para o amor.",
    interpretacaoProfunda: "A vida cristã não é um esforço humano, mas uma resposta ao chamado divino que está sempre 'perto do homem'.",
    aplicacaoPratica: "Reconheça a presença de Deus em seu dia a dia, pois Ele nunca está longe.",
    reflexaoFinal: "Você se sente um filho adotivo de Deus?",
    exercicio: "Faça uma oração de agradecimento pela sua criação."
  },
  1324: {
    content: 'A Eucaristia é «fonte e cume de toda a vida cristã». «Os restantes sacramentos, assim como todos os ministérios eclesiásticos e obras de apostolado, estão vinculados à sagrada Eucaristia e a ela se ordenam. Com efeito, a santíssima Eucaristia contém todo o tesouro espiritual da Igreja, isto é, o próprio Cristo, a nossa Páscoa».',
    textoBase: "A Eucaristia é fonte e cume de toda a vida cristã.",
    explicacao: "Toda a vida da Igreja gira em torno da presença real de Cristo no altar.",
    interpretacaoProfunda: "A Eucaristia não é apenas um símbolo, mas a posse antecipada da vida eterna.",
    aplicacaoPratica: "Participe da Missa com a consciência de que está diante do próprio Deus.",
    reflexaoFinal: "Como a Eucaristia transforma o seu cotidiano?",
    exercicio: "Planeje uma visita ao Santíssimo Sacramento hoje."
  }
};

const CONCURRENCY_LIMIT = 5;
let activeRequests = 0;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (activeRequests >= CONCURRENCY_LIMIT) {
    return new Response(JSON.stringify({ error: 'Sistema sobrecarregado.' }), { status: 429, headers: corsHeaders });
  }

  activeRequests++;
  const startTime = Date.now();
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  const logExecution = async (paragraph: number, status: string, error?: string, adminId?: string) => {
    const duration = Date.now() - startTime;
    await fetch(`${supabaseUrl}/rest/v1/catechism_execution_logs`, {
      method: 'POST',
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ paragraph, status, duration_ms: duration, error_message: error, admin_id: adminId }),
    }).catch(console.error);
  };

  try {
    const authHeader = req.headers.get('Authorization');
    let adminId = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const userResp = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { 'Authorization': `Bearer ${token}`, 'apikey': serviceKey } });
      if (userResp.ok) {
        const userData = await userResp.json();
        adminId = userData.id;
      }
    }

    const body = await req.json();
    const paragraph = body.paragraph;
    const action = body.action || 'load';
    const forceReprocess = action === 'reprocess' || action === 'fix_incomplete';

    if (!paragraph || paragraph < 1 || paragraph > 2865) {
      activeRequests--;
      return new Response(JSON.stringify({ error: 'Parágrafo inválido' }), { status: 400, headers: corsHeaders });
    }

    // 1. Static
    if (PT_PARAGRAPHS[paragraph]) {
      await logExecution(paragraph, 'static', undefined, adminId);
      activeRequests--;
      return new Response(JSON.stringify({ ...PT_PARAGRAPHS[paragraph], paragraph, status: 'static' }), { headers: corsHeaders });
    }

    // 2. Load Existing (Official or Cache)
    let existingContent: any = null;
    let source: 'official' | 'cache' | null = null;

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
          source = 'cache';
        }
      }
    }

    // Check completeness
    const isIncomplete = existingContent && (
      !existingContent.texto_base || 
      !existingContent.explicacao || 
      !existingContent.interpretacao_profunda || 
      !existingContent.aplicacao_pratica || 
      !existingContent.reflexao_final || 
      !existingContent.exercicio
    );

    if (existingContent && !forceReprocess && !isIncomplete) {
      await logExecution(paragraph, source === 'official' ? 'official' : 'cached', undefined, adminId);
      activeRequests--;
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

    // 3. AI Generation (Full or missing fields)
    try {
      const prompt = existingContent?.content 
        ? `O texto oficial do parágrafo §${paragraph} do Catecismo é: "${existingContent.content}". 
           Por favor, gere APENAS os campos de análise teológica que faltam ou estão incompletos:
           1. textoBase: Uma frase resumo.
           2. explicacao: Uma explicação simples (2-3 frases).
           3. interpretacaoProfunda: Uma análise teológica mais densa.
           4. aplicacaoPratica: Como viver isso hoje.
           5. reflexaoFinal: Uma pergunta para meditação.
           6. exercicio: Uma ação concreta.
           Mantenha o tom fiel ao Magistério. Retorne em formato JSON.`
        : `Reproduza o texto integral do parágrafo §${paragraph} do Catecismo da Igreja Católica em português. Além do texto oficial, forneça uma análise estruturada contendo:
           1. textoBase: Uma frase resumo.
           2. explicacao: Uma explicação simples (2-3 frases).
           3. interpretacaoProfunda: Uma análise teológica mais densa.
           4. aplicacaoPratica: Como viver isso hoje.
           5. reflexaoFinal: Uma pergunta para meditação.
           6. exercicio: Uma ação concreta.
           Retorne em formato JSON.`;

      const resp = await fetch(`${supabaseUrl}/functions/v1/colloquium`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          system_prompt: "Você é um especialista em Catecismo. Retorne SEMPRE um JSON válido com os campos: content (apenas se não fornecido), textoBase, explicacao, interpretacaoProfunda, aplicacaoPratica, reflexaoFinal, exercicio.",
          stream: false,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        let aiContent = (data.choices?.[0]?.message?.content || '').trim();
        if (aiContent.startsWith('```json')) aiContent = aiContent.replace(/^```json/, '').replace(/```$/, '').trim();
        
        try {
          const p = JSON.parse(aiContent);
          const finalContent = p.content || existingContent?.content;
          
          if (finalContent && finalContent.length > 30) {
            await fetch(`${supabaseUrl}/rest/v1/catechism_cache`, {
              method: 'POST',
              headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
              body: JSON.stringify({ 
                paragraph, 
                content: finalContent, 
                status: 'generated',
                texto_base: p.textoBase || existingContent?.texto_base,
                explicacao: p.explicacao || existingContent?.explicacao,
                interpretacao_profunda: p.interpretacaoProfunda || existingContent?.interpretacao_profunda,
                aplicacao_pratica: p.aplicacaoPratica || existingContent?.aplicacao_pratica,
                reflexao_final: p.reflexaoFinal || existingContent?.reflexao_final,
                exercicio: p.exercicio || existingContent?.exercicio
              }),
            });
            await logExecution(paragraph, 'generated', undefined, adminId);
            activeRequests--;
            return new Response(JSON.stringify({ ...p, content: finalContent, paragraph, status: 'generated' }), { headers: corsHeaders });
          }
        } catch (e) {
          console.error('JSON Parse Error:', e);
        }
      } else {
        const status = resp.status === 402 ? 'error_402' : 'error';
        await logExecution(paragraph, status, `AI status ${resp.status}`, adminId);
      }
    } catch (e) {
      await logExecution(paragraph, 'exception', String(e), adminId);
    }

    activeRequests--;
    return new Response(JSON.stringify({ paragraph, status: 'error' }), { headers: corsHeaders });

  } catch (error) {
    activeRequests--;
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: corsHeaders });
  }
});
