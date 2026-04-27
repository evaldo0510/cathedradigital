import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Key paragraphs in Portuguese (Full official text)
const PT_PARAGRAPHS: Record<number, string> = {
  1: 'Deus, infinitamente perfeito e bem-aventurado em si mesmo, num desígnio de pura bondade, criou livremente o homem para o tornar participante da sua vida bem-aventurada. É por isso que, em todo o tempo e em todo o lugar, Ele está perto do homem. Chama-o e ajuda-o a procurá-Lo, a conhecê-Lo e a amá-Lo com todas as suas forças. Convoca todos os homens, dispersos pelo pecado, para a unidade da sua família, a Igreja. Para isso, enviou o seu Filho como Redentor e Salvador, quando chegou a plenitude dos tempos. N\'Ele e por Ele, chama os homens a tornarem-se, no Espírito Santo, seus filhos adotivos e, portanto, herdeiros da sua vida bem-aventurada.',
  1324: 'A Eucaristia é «fonte e cume de toda a vida cristã». «Os restantes sacramentos, assim como todos os ministérios eclesiásticos e obras de apostolado, estão vinculados à sagrada Eucaristia e a ela se ordenam. Com efeito, a santíssima Eucaristia contém todo o tesouro espiritual da Igreja, isto é, o próprio Cristo, a nossa Páscoa».',
  2558: '«Grande é o mistério da fé». A Igreja professa-o no Símbolo dos Apóstolos e celebra-o na liturgia sacramental, para que a vida dos fiéis seja conformada com Cristo no Espírito Santo para glória de Deus Pai. Este mistério exige, portanto, que os fiéis nele acreditem, o celebrem e dele vivam numa relação viva e pessoal com o Deus vivo e verdadeiro. Esta relação é a oração.',
  2559: '«A oração é a elevação da alma a Deus ou o pedido a Deus de bens convenientes». De onde falamos nós, ao rezar? Da altura do nosso orgulho e vontade própria, ou das «profundezas» (Sl 130, 1) dum coração humilde e contrito? Aquele que se humilha será exaltado. A humildade é o fundamento da oração.',
};

const CONCURRENCY_LIMIT = 5;
let activeRequests = 0;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (activeRequests >= CONCURRENCY_LIMIT) {
    return new Response(JSON.stringify({ error: 'Sistema sobrecarregado. Tente novamente em instantes.' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  activeRequests++;

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  const logExecution = async (paragraph: number, status: string, error?: string, adminId?: string) => {
    const duration = Date.now() - startTime;
    await fetch(`${supabaseUrl}/rest/v1/catechism_execution_logs`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paragraph,
        status,
        duration_ms: duration,
        error_message: error,
        admin_id: adminId,
      }),
    }).catch(console.error);
  };

  try {
    const authHeader = req.headers.get('Authorization');
    let adminId = null;
    let forwardToken = serviceKey; // Default to service role for internal call

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const userResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { 'Authorization': `Bearer ${token}`, 'apikey': serviceKey }
      });
      if (userResp.ok) {
        const userData = await userResp.json();
        adminId = userData.id;
        // If it's a real user, we can forward their token if needed, 
        // but colloquium now accepts serviceKey, which is more reliable for system tools.
      }
    }

    const body = await req.json();
    const paragraph = body.paragraph;
    const forceReprocess = body.action === 'reprocess' || body.action === 'clear';

    if (!paragraph || paragraph < 1 || paragraph > 2865) {
      activeRequests--;
      return new Response(JSON.stringify({ error: 'Parágrafo inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Static
    if (PT_PARAGRAPHS[paragraph]) {
      await logExecution(paragraph, 'static', undefined, adminId);
      activeRequests--;
      return new Response(JSON.stringify({ paragraph, content: PT_PARAGRAPHS[paragraph], status: 'static' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Official DB
    const officialResp = await fetch(`${supabaseUrl}/rest/v1/catechism_official?paragraph=eq.${paragraph}&select=content`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
    });

    if (officialResp.ok) {
      const rows = await officialResp.json();
      if (rows?.[0]?.content) {
        await logExecution(paragraph, 'official', undefined, adminId);
        activeRequests--;
        return new Response(JSON.stringify({ paragraph, content: rows[0].content, status: 'official' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 3. Cache
    const dbResp = await fetch(`${supabaseUrl}/rest/v1/catechism_cache?paragraph=eq.${paragraph}&select=*`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
    });

    let existingRecord = null;
    if (dbResp.ok) {
      const rows = await dbResp.json();
      existingRecord = rows?.[0];
      
      if (existingRecord?.content && existingRecord.content.length > 50 && existingRecord.status === 'generated' && !forceReprocess) {
        await logExecution(paragraph, 'cached', undefined, adminId);
        activeRequests--;
        return new Response(JSON.stringify({ paragraph, content: existingRecord.content, status: 'cached' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 4. AI Generation
    try {
      const resp = await fetch(`${supabaseUrl}/functions/v1/colloquium`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Reproduza o texto integral do parágrafo §${paragraph} do Catecismo da Igreja Católica em português.` }],
          system_prompt: "Transcrição fiel e integral do Catecismo.",
          stream: false,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const content = (data.choices?.[0]?.message?.content || '').trim();

        if (content.length > 30) {
          await fetch(`${supabaseUrl}/rest/v1/catechism_cache`, {
            method: 'POST',
            headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
            body: JSON.stringify({ paragraph, content, status: 'generated', last_error: null, retry_count: 0 }),
          });
          await logExecution(paragraph, 'generated', undefined, adminId);
          activeRequests--;
          return new Response(JSON.stringify({ paragraph, content, status: 'generated' }), { headers: corsHeaders });
        }
      } else {
        const status = resp.status === 402 ? 'error_402' : 'error';
        const errorMsg = `Erro na geração via AI: ${resp.status}`;
        await fetch(`${supabaseUrl}/rest/v1/catechism_cache`, {
          method: 'POST',
          headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify({ 
            paragraph, 
            status, 
            last_error: errorMsg, 
            retry_count: forceReprocess ? (existingRecord?.retry_count || 0) + 1 : (existingRecord?.retry_count || 0)
          }),
        });
        await logExecution(paragraph, status, errorMsg, adminId);
      }
    } catch (e) {
      await logExecution(paragraph, 'exception', String(e), adminId);
    }

    activeRequests--;
    return new Response(JSON.stringify({ 
      paragraph, 
      content: existingRecord?.content || `§${paragraph} — Conteúdo sendo processado ou temporariamente indisponível.`,
      status: existingRecord?.status || 'error' 
    }), { headers: corsHeaders });

  } catch (error) {
    activeRequests--;
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: corsHeaders });
  }
});