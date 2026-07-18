import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

type Result = { ok: boolean; message: string; latencyMs?: number };

async function timed(fn: () => Promise<Result>): Promise<Result> {
  const t0 = Date.now();
  try {
    const r = await fn();
    return { ...r, latencyMs: Date.now() - t0 };
  } catch (e) {
    return { ok: false, message: (e as Error).message, latencyMs: Date.now() - t0 };
  }
}

async function testLovableCloud(): Promise<Result> {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !key) return { ok: false, message: 'SUPABASE_URL/ANON_KEY ausentes' };
  const r = await fetch(`${url}/rest/v1/`, { headers: { apikey: key } });
  return { ok: r.ok, message: r.ok ? 'REST API respondendo' : `HTTP ${r.status}` };
}

async function testLovableAI(): Promise<Result> {
  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) return { ok: false, message: 'LOVABLE_API_KEY ausente' };
  const r = await fetch('https://ai.gateway.lovable.dev/v1/models', {
    headers: { Authorization: `Bearer ${key}` },
  });
  return { ok: r.ok, message: r.ok ? 'Gateway respondeu 200' : `HTTP ${r.status}` };
}

async function testMercadoPago(): Promise<Result> {
  const token = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
  if (!token) return { ok: false, message: 'MERCADO_PAGO_ACCESS_TOKEN ausente' };
  const r = await fetch('https://api.mercadopago.com/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return { ok: false, message: `HTTP ${r.status}` };
  const j = await r.json().catch(() => ({}));
  return { ok: true, message: `Autenticado como ${j.nickname ?? j.email ?? j.id ?? 'usuário MP'}` };
}

async function testGoogleApiKey(): Promise<Result> {
  const key = Deno.env.get('GOOGLE_API_KEY');
  if (!key) return { ok: false, message: 'GOOGLE_API_KEY ausente' };
  // Sanity ping — Books API é pública e não requer habilitação específica
  const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=bible&maxResults=1&key=${key}`);
  if (r.ok) return { ok: true, message: 'Chave válida (Books API respondeu)' };
  const body = await r.text();
  return { ok: false, message: `HTTP ${r.status}: ${body.slice(0, 120)}` };
}

const tests: Record<string, () => Promise<Result>> = {
  'lovable-cloud': testLovableCloud,
  'lovable-ai': testLovableAI,
  'mercado-pago': testMercadoPago,
  'google-api-key': testGoogleApiKey,
};

const notConfigured = (name: string): Result => ({
  ok: false,
  message: `${name} não está vinculado a este projeto.`,
});

const unlinkedMap: Record<string, string> = {
  firecrawl: 'Firecrawl',
  'google-search-console': 'Google Search Console',
  semrush: 'Semrush',
  'google-analytics': 'Google Analytics',
  stripe: 'Stripe',
  github: 'GitHub',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { id } = await req.json();
    if (typeof id !== 'string' || !id) {
      return new Response(JSON.stringify({ error: 'id obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const runner = tests[id];
    const result = runner ? await timed(runner) : notConfigured(unlinkedMap[id] ?? id);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, message: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
