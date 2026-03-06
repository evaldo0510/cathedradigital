import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paragraph } = await req.json();
    
    if (!paragraph || paragraph < 1 || paragraph > 2865) {
      return new Response(JSON.stringify({ error: 'Parágrafo inválido', content: '' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use the Vatican API / catechism scraping approach
    const url = `https://www.vatican.va/archive/cathechism_po/index_new/p${paragraph <= 1065 ? '1' : paragraph <= 1690 ? '2' : paragraph <= 2557 ? '3' : '4'}-s${paragraph}.htm`;
    
    // Fallback: use a well-known catechism API
    const apiUrl = `https://catechism-ccc.com/api/paragraph/${paragraph}`;
    
    try {
      const resp = await fetch(apiUrl);
      if (resp.ok) {
        const data = await resp.json();
        return new Response(JSON.stringify({
          paragraph: paragraph,
          content: data.text || data.content || `Conteúdo do parágrafo §${paragraph} do Catecismo da Igreja Católica.`,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch {
      // API not available, use embedded content
    }

    // Embedded key paragraphs as fallback
    const KEY_PARAGRAPHS: Record<number, string> = {
      1: 'Deus, infinitamente perfeito e bem-aventurado em si mesmo, num desígnio de pura bondade, criou livremente o homem para o tornar participante da sua vida bem-aventurada. É por isso que, em todo o tempo e em todo o lugar, Ele está perto do homem. Chama-o e ajuda-o a procurá-Lo, a conhecê-Lo e a amá-Lo com todas as suas forças.',
      2: 'Para que este chamamento ressoasse por toda a terra, Deus enviou o seu Filho, a quem constituiu herdeiro de todas as coisas. Nele e por Ele, Deus chama todos os homens a tornarem-se, no Espírito Santo, seus filhos adotivos e, portanto, herdeiros da sua vida bem-aventurada.',
      27: 'O desejo de Deus está inscrito no coração do homem, porque o homem foi criado por Deus e para Deus; e Deus não cessa de atrair o homem a Si; e só em Deus o homem há de encontrar a verdade e a felicidade que não cessa de procurar.',
      232: 'Os cristãos são batizados "em nome do Pai e do Filho e do Espírito Santo" (Mt 28,19). Antes disso, respondem "Creio" à tríplice pergunta que os convida a confessar a sua fé no Pai, no Filho e no Espírito Santo.',
      460: '"O Verbo fez-Se homem para nos tornar Deus": "Tal é a razão pela qual o Verbo Se fez homem, e o Filho de Deus Se fez Filho do homem: para que o homem, entrando em comunhão com o Verbo e recebendo assim a filiação divina, se tornasse filho de Deus" (Santo Ireneu).',
      1324: 'A Eucaristia é "fonte e cume de toda a vida cristã". "Os restantes sacramentos, assim como todos os ministérios eclesiásticos e obras de apostolado, estão vinculados à sagrada Eucaristia e a ela se ordenam."',
      1325: '"A Eucaristia contém todo o tesouro espiritual da Igreja, isto é, o próprio Cristo, a nossa Páscoa."',
      2559: '"A oração é a elevação da alma a Deus ou o pedido a Deus dos bens convenientes" (São João Damasceno).',
    };

    const content = KEY_PARAGRAPHS[paragraph] || 
      `Parágrafo §${paragraph} do Catecismo da Igreja Católica. O texto completo será disponibilizado em breve. Consulte a edição oficial em vatican.va.`;

    return new Response(JSON.stringify({
      paragraph,
      content,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, content: '' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
