import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY') || '';

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const paragraph = body.paragraph;
    const action = body.action || 'fetch';

    if (!paragraph || paragraph < 1 || paragraph > 2865) {
      return new Response(JSON.stringify({ error: 'Parágrafo inválido' }), { status: 400, headers: corsHeaders });
    }

    // 1. Check Official DB (Priority)
    if (action === 'fetch') {
      const { data: official, error: officialError } = await supabase
        .from('catechism_official')
        .select('*')
        .eq('paragraph', paragraph)
        .maybeSingle();

      if (official) {
        return new Response(JSON.stringify({ 
          ...official, 
          status: 'official',
          textoBase: official.texto_base,
          interpretacaoProfunda: official.interpretacao_profunda,
          aplicacaoPratica: official.aplicacao_pratica,
          reflexaoFinal: official.reflexao_final
        }), { headers: corsHeaders });
      }
    }

    // 2. Check Cache
    if (action === 'fetch') {
      const { data: cached, error: cacheError } = await supabase
        .from('catechism_cache')
        .select('*')
        .eq('paragraph', paragraph)
        .maybeSingle();

      if (cached && cached.content && cached.status !== 'error' && cached.status !== 'error_402') {
        return new Response(JSON.stringify({ 
          ...cached, 
          status: 'cached',
          textoBase: cached.texto_base,
          interpretacaoProfunda: cached.interpretacao_profunda,
          aplicacaoPratica: cached.aplicacao_pratica,
          reflexaoFinal: cached.reflexao_final
        }), { headers: corsHeaders });
      }
    }

    // 3. AI Generation (If not found or forced reprocess)
    if (action === 'fetch' || action === 'reprocess' || action === 'fix_incomplete') {
      console.log(`Generating content for paragraph §${paragraph}...`);

      const systemPrompt = `Você é um teólogo católico especialista no Catecismo da Igreja Católica (CIC). 
Sua tarefa é fornecer o texto oficial do parágrafo §${paragraph} e uma análise teológica profunda.

REGRAS CRÍTICAS:
1. FIDELIDADE: O texto do parágrafo deve ser o texto oficial em Português.
2. ESTRUTURA: Retorne obrigatoriamente um JSON válido com os seguintes campos:
   - content: O texto oficial do parágrafo.
   - texto_base: Uma síntese de 1 frase do ensinamento principal.
   - explicacao: Explicação detalhada do parágrafo.
   - interpretacao_profunda: Conexões com o Magistério, Patrística e Escritura.
   - aplicacao_pratica: Como viver este ensinamento hoje.
   - reflexao_final: Uma breve oração ou pensamento meditativo.
   - exercicio: Uma sugestão de ação prática.
3. IDIOMA: Use Português do Brasil.
4. FORMATO: Apenas o JSON, sem markdown ou explicações externas.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-lite",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Gere o conteúdo completo para o parágrafo §${paragraph} do Catecismo da Igreja Católica.` }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error(`AI Gateway error: ${aiResponse.status}`, errorText);
        
        const status = aiResponse.status === 402 ? 'error_402' : 'error';
        
        // Log the error
        await supabase.from('catechism_execution_logs').insert({
          paragraph,
          status: status,
          error_message: `AI Error ${aiResponse.status}: ${errorText.substring(0, 100)}`
        });

        return new Response(JSON.stringify({ 
          paragraph, 
          status: status, 
          error: "Erro na geração via AI" 
        }), { status: aiResponse.status === 402 ? 402 : 500, headers: corsHeaders });
      }

      const aiData = await aiResponse.json();
      let content = aiData.choices[0].message.content;
      
      // Handle cases where the model might still return markdown blocks
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
      }

      const parsed = JSON.parse(content);

      // Save to Cache
      const { data: saved, error: saveError } = await supabase
        .from('catechism_cache')
        .upsert({
          paragraph,
          content: parsed.content,
          texto_base: parsed.texto_base,
          explicacao: parsed.explicacao,
          interpretacao_profunda: parsed.interpretacao_profunda,
          aplicacao_pratica: parsed.aplicacao_pratica,
          reflexao_final: parsed.reflexao_final,
          exercicio: parsed.exercicio,
          status: 'generated',
          retry_count: 0,
          last_error: null
        }, { onConflict: 'paragraph' })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving to cache:', saveError);
      }

      // Log success
      await supabase.from('catechism_execution_logs').insert({
        paragraph,
        status: 'generated',
        duration_ms: 0 // Could calculate this if needed
      });

      return new Response(JSON.stringify({ 
        ...parsed, 
        status: 'generated',
        paragraph 
      }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ 
      paragraph, 
      status: 'not_found' 
    }), { headers: corsHeaders });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: corsHeaders });
  }
});