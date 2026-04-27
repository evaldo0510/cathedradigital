import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Key paragraphs in Portuguese
const PT_PARAGRAPHS: Record<number, string> = {
  1: 'Deus, infinitamente perfeito e bem-aventurado...',
  2: 'Para que este apelo ressoasse...',
  3: 'Os que, com a ajuda de Deus...',
  27: 'O desejo de Deus está inscrito...',
  1324: 'A Eucaristia é «fonte e cume...»',
  1325: 'A Eucaristia contém todo o tesouro...',
  2558: '«Grande é o mistério da fé»...',
  2559: '«A oração é a elevação da alma...»',
  2560: '«Se conhecesses o dom de Deus!»...',
  2561: '«Tu é que Lhe pedirias...»',
  2562: 'De onde vem a oração do homem?...',
  2865: 'Com o «Amém» final...',
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

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const userResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { 'Authorization': `Bearer ${token}`, 'apikey': serviceKey }
      });
      if (userResp.ok) {
        const userData = await userResp.json();
        adminId = userData.id;
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

    if (PT_PARAGRAPHS[paragraph]) {
      await logExecution(paragraph, 'static', undefined, adminId);
      activeRequests--;
      return new Response(JSON.stringify({ paragraph, content: PT_PARAGRAPHS[paragraph], status: 'static' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    const maxRetries = 5;
    const currentRetry = existingRecord?.retry_count || 0;
    
    if (forceReprocess && currentRetry >= maxRetries) {
      const errorMsg = `Limite de retentativas atingido (§${paragraph}).`;
      await logExecution(paragraph, 'max_retries_exceeded', errorMsg, adminId);
      activeRequests--;
      return new Response(JSON.stringify({ paragraph, content: existingRecord?.content, status: 'error_max_retries' }), { status: 429, headers: corsHeaders });
    }

    try {
      const resp = await fetch(`${supabaseUrl}/functions/v1/colloquium`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Reproduza o texto do parágrafo §${paragraph} do Catecismo da Igreja Católica em português.` }],
          system_prompt: "Transcrição fiel do Catecismo.",
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
        const errorMsg = `Erro ${resp.status}`;
        await fetch(`${supabaseUrl}/rest/v1/catechism_cache`, {
          method: 'POST',
          headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify({ 
            paragraph, 
            status, 
            last_error: errorMsg, 
            retry_count: forceReprocess ? currentRetry + 1 : currentRetry 
          }),
        });
        await logExecution(paragraph, status, errorMsg, adminId);
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