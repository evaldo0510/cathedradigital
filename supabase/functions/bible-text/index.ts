import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, if-none-match, x-correlation-id',
  'Access-Control-Expose-Headers': 'ETag, x-correlation-id',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CACHE_VERSION = "v2.0.0"; // Migração Protocanônica Concluída

async function sha256(text: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function logAudit(data: {
  correlation_id: string;
  event_name: string;
  status_code: number;
  livro?: string;
  capitulo?: number;
  error_code?: string;
  content_hash?: string;
  db_content_hash?: string;
  response?: any;
}) {
  try {
    await supabase.from('core_audit_logs').insert([data]);
  } catch (e) {
    console.error('Falha ao registrar log de auditoria:', e);
  }
}

async function fetchFromCathedraDb(abbrev: string, chapter: number) {
  try {
    const { data: book } = await supabase.from('bible_books').select('id, name').eq('abbrev', abbrev).single();
    if (!book) return null;
    const { data: ch } = await supabase.from('bible_chapters').select('id').eq('book_id', book.id).eq('number', chapter).single();
    if (!ch) return null;
    const { data: verses } = await supabase.from('bible_verses').select('number, text').eq('chapter_id', ch.id).order('number');
    if (!verses || verses.length === 0) return null;
    return { verses, bookName: book.name };
  } catch { return null; }
}

serve(async (req) => {
  const startTime = performance.now();
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const rawBody = await req.text();
    if (!rawBody) return new Response(JSON.stringify({ error: 'Body vazio', correlationId }), { status: 400, headers: corsHeaders });
    
    let abbrev, chapter;
    try {
      const body = JSON.parse(rawBody);
      abbrev = body.abbrev;
      chapter = body.chapter;
    } catch {
      return new Response(JSON.stringify({ error: 'JSON inválido', correlationId }), { status: 400, headers: corsHeaders });
    }

    if (!abbrev || !chapter) return new Response(JSON.stringify({ error: 'Parâmetros inválidos', correlationId }), { status: 400, headers: corsHeaders });

    // UNICA FONTE DE VERDADE: Banco Cathedra
    const dbResult = await fetchFromCathedraDb(abbrev, chapter);
    
    if (dbResult) {
      const fullText = dbResult.verses.map(v => v.text).join(' ');
      const contentHash = await sha256(fullText);
      
      const responseData = {
        book: dbResult.bookName, chapter, verses: dbResult.verses,
        metadata: { source: 'Cathedra (Local)', cache_version: CACHE_VERSION, correlationId, contentHash }
      };

      await logAudit({
        correlation_id: correlationId,
        event_name: 'bible_fetch_success',
        status_code: 200,
        livro: abbrev,
        capitulo: chapter,
        content_hash: contentHash,
        db_content_hash: contentHash, // Mesma fonte
        duration_ms: Math.round(performance.now() - startTime)
      });

      return new Response(JSON.stringify(responseData), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-correlation-id': correlationId } 
      });
    }

    // 404 - Não encontrado em lugar nenhum (Soberania de Dados)
    const errorMsg = `O texto para ${abbrev} Cap. ${chapter} não foi encontrado na base local Cathedra.`;
    
    await logAudit({
      correlation_id: correlationId,
      event_name: 'bible_fetch_not_found',
      status_code: 404,
      livro: abbrev,
      capitulo: chapter,
      error_code: 'DATA_NOT_FOUND',
      duration_ms: Math.round(performance.now() - startTime)
    });

    return new Response(JSON.stringify({ 
      error: errorMsg, 
      correlationId,
      auditLink: `/admin/audit?id=${correlationId}`
    }), { 
      status: 404, 
      headers: { ...corsHeaders, 'x-correlation-id': correlationId } 
    });

  } catch (error: any) {
    console.error(JSON.stringify({
      level: 'critical', correlationId, event: 'bible_internal_error',
      error: error.message, timestamp
    }));
    return new Response(JSON.stringify({ error: 'Erro interno', message: error.message, correlationId }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});