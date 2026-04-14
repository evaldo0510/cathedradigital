import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Key paragraphs in Portuguese (embedded for instant access)
const PT_PARAGRAPHS: Record<number, string> = {
  1: 'Deus, infinitamente perfeito e bem-aventurado em si mesmo, num desígnio de pura bondade, criou livremente o homem para o tornar participante da sua vida bem-aventurada. É por isso que, em todo o tempo e em todo o lugar, Ele está perto do homem. Chama-o e ajuda-o a procurá-Lo, a conhecê-Lo e a amá-Lo com todas as suas forças. Convoca todos os homens, dispersos pelo pecado, para a unidade da sua família, a Igreja. Para isso, enviou o seu Filho como Redentor e Salvador, quando chegou a plenitude dos tempos. N\'Ele e por Ele, chama os homens a tornarem-se, no Espírito Santo, seus filhos adotivos e, portanto, herdeiros da sua vida bem-aventurada.',
  2: 'Para que este apelo ressoasse por toda a terra, Cristo enviou os Apóstolos que tinha escolhido, dando-lhes o mandato de anunciar o Evangelho: «Ide, pois, fazei discípulos de todos os povos, batizando-os em nome do Pai, do Filho e do Espírito Santo, ensinando-os a cumprir tudo quanto vos tenho mandado. E sabei que Eu estarei sempre convosco até ao fim dos tempos» (Mt 28,19-20).',
  3: 'Os que, com a ajuda de Deus, acolheram o chamamento de Cristo e lhe responderam livremente foram, por sua vez, levados pelo amor de Cristo a anunciar por toda a parte a Boa-Nova. Este tesouro, recebido dos Apóstolos, foi fielmente guardado pelos seus sucessores. Todos os fiéis de Cristo são chamados a transmiti-lo de geração em geração, anunciando a fé, vivendo-a na comunhão fraterna e celebrando-a na liturgia e na oração.',
  27: 'O desejo de Deus está inscrito no coração do homem, já que o homem é criado por Deus e para Deus; e Deus não cessa de atrair o homem para si, e somente em Deus o homem encontrará a verdade e a felicidade que não cessa de procurar.',
  1324: 'A Eucaristia é «fonte e cume de toda a vida cristã». «Os restantes sacramentos, assim como todos os ministérios eclesiásticos e obras de apostolado, estão vinculados à sagrada Eucaristia e a ela se ordenam. Com efeito, a santíssima Eucaristia contém todo o tesouro espiritual da Igreja, isto é, o próprio Cristo, a nossa Páscoa».',
  1325: 'A Eucaristia contém todo o tesouro espiritual da Igreja, isto é, o próprio Cristo, a nossa Páscoa e pão vivo que, pela sua Carne vivificada e vivificante pelo Espírito Santo, dá vida aos homens.',
  2558: '«Grande é o mistério da fé». A Igreja professa-o no Símbolo dos Apóstolos e celebra-o na liturgia sacramental, para que a vida dos fiéis seja conformada com Cristo no Espírito Santo para glória de Deus Pai. Este mistério exige, portanto, que os fiéis nele acreditem, o celebrem e dele vivam numa relação viva e pessoal com o Deus vivo e verdadeiro. Esta relação é a oração.',
  2559: '«A oração é a elevação da alma a Deus ou o pedido a Deus de bens convenientes». De onde falamos nós, ao rezar? Da altura do nosso orgulho e vontade própria, ou das «profundezas» (Sl 130, 1) dum coração humilde e contrito? Aquele que se humilha será exaltado. A humildade é o fundamento da oração.',
  2560: '«Se conhecesses o dom de Deus!» (Jo 4, 10). A maravilha da oração revela-se precisamente ali, à beira dos poços onde vamos procurar a nossa água: é ali que Cristo vem ao encontro de todo o ser humano; Ele é o primeiro a procurar-nos e é Ele que nos pede de beber. Jesus tem sede; o seu pedido vem das profundezas de Deus que nos deseja. A oração, saibamo-lo ou não, é o encontro da sede de Deus com a nossa sede.',
  2561: '«Tu é que Lhe pedirias e Ele te daria água viva» (Jo 4, 10). A nossa oração de pedido é, paradoxalmente, uma resposta. Resposta à queixa do Deus vivo: «Eles abandonaram-Me, a Mim, fonte de água viva, para cavarem para si cisternas rotas!» (Jr 2, 13). Resposta de fé à promessa gratuita da salvação, resposta de amor à sede do Filho único.',
  2562: 'De onde vem a oração do homem? Qualquer que seja a linguagem da oração (gestos e palavras), é o homem todo que reza. Mas, para designar o lugar de onde brota a oração, as Escrituras falam às vezes da alma ou do espírito, ou, com mais frequência, do coração (mais de mil vezes). É o coração que reza. Se ele estiver longe de Deus, a expressão da oração é vã.',
  2865: 'Com o «Amém» final, exprimimos o nosso «fiat» relativamente a estas sete petições: «Assim seja».',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const paragraph = body.paragraph;

    if (!paragraph || paragraph < 1 || paragraph > 2865) {
      return new Response(JSON.stringify({ error: 'Parágrafo inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Static check (instant)
    if (PT_PARAGRAPHS[paragraph]) {
      return new Response(JSON.stringify({ paragraph, content: PT_PARAGRAPHS[paragraph] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=604800' },
      });
    }

    // 2. Database cache check
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    const dbResp = await fetch(`${supabaseUrl}/rest/v1/catechism_cache?paragraph=eq.${paragraph}&select=content`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
    });

    if (dbResp.ok) {
      const rows = await dbResp.json();
      if (rows?.[0]?.content && rows[0].content.length > 20 && !rows[0].content.includes('processamento')) {
        return new Response(JSON.stringify({ paragraph, content: rows[0].content }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' },
        });
      }
    }

    // 3. AI Generation ONLY if explicitly requested (action: 'generate')
    if (body.action === 'generate') {
      try {
        const resp = await fetch(`${supabaseUrl}/functions/v1/colloquium`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `Reproduza fielmente o texto do parágrafo §${paragraph} do Catecismo da Igreja Católica em português. INCLUA todas as referências bíblicas. Não acrescente comentários — apenas o texto oficial.`
            }],
            system_prompt: "Você é um transcritor fiel do Catecismo da Igreja Católica. Forneça apenas o texto exato do parágrafo solicitado.",
            stream: false,
            model: 'google/gemini-2.5-flash'
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const content = (data.choices?.[0]?.message?.content || '')
            .trim()
            .replace(/\[RECOMMENDATION:.*\]/s, '')
            .replace(/^(Compreendo|Compreendido|Com certeza|Aqui está|Segue o texto|Claro|Com prazer|Olá)[^:]*[.:]\s*/i, '')
            .replace(/^(###|##|\*\*)\s*§?\d+\s*[-–]?\s*/i, '')
            .trim();

          if (content && content.length > 20) {
            // Cache for future requests
            fetch(`${supabaseUrl}/rest/v1/catechism_cache`, {
              method: 'POST',
              headers: {
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates',
              },
              body: JSON.stringify({ paragraph, content }),
            }).catch(() => {});

            return new Response(JSON.stringify({ paragraph, content }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' },
            });
          }
        }
      } catch (e) {
        console.error(`AI generation failed for §${paragraph}:`, e);
      }
    }

    // 4. Return "not cached" status - no AI generation on regular requests
    return new Response(JSON.stringify({
      paragraph,
      content: `§${paragraph} — Conteúdo ainda não disponível no cache. Toque em "Carregar" para buscar este parágrafo.`,
      status: 'not_cached',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('catechism-text error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
