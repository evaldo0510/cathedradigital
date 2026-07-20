// Alias oficial para `bible-import-missing` — importa protocanônicos faltantes
// via bolls.life. Existe para responder ao nome "bible-import-proto" e mantém
// UM ÚNICO caminho de execução: encaminha o corpo/query para a função
// existente (que já tem tracking em bible_import_jobs, dry_run, validate,
// preview, list_jobs, status, verification pós-run e revalidação do gate).
//
// Ações suportadas (repassadas):
//   POST { action: 'validate' | 'dry_run' | 'preview' | 'start' | 'list_jobs', ... }
//   GET  ?action=status&job_id=...

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const incoming = new URL(req.url);
  const target = new URL(`${SUPABASE_URL}/functions/v1/bible-import-missing`);
  incoming.searchParams.forEach((v, k) => target.searchParams.set(k, v));

  const headers = new Headers();
  const auth = req.headers.get('authorization');
  if (auth) headers.set('authorization', auth);
  headers.set('apikey', req.headers.get('apikey') ?? ANON_KEY);
  const ct = req.headers.get('content-type');
  if (ct) headers.set('content-type', ct);

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text();
  }

  const res = await fetch(target.toString(), init);
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: {
      ...corsHeaders,
      'content-type': res.headers.get('content-type') ?? 'application/json',
      'x-forwarded-to': 'bible-import-missing',
    },
  });
});
