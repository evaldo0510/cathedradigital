import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function calculateSHA256(text: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { book_id, chapter_number, expected_hash, correlation_id } = await req.json();

    if (!book_id || !chapter_number) {
      return new Response(JSON.stringify({ error: 'Parâmetros insuficientes' }), { status: 400, headers: corsHeaders });
    }

    // 1. Buscar os versículos do capítulo no banco
    const { data: verses, error: vError } = await supabase
      .from('bible_verses')
      .select('number, text')
      .eq('chapter_id', (
        await supabase
          .from('bible_chapters')
          .select('id')
          .eq('book_id', book_id)
          .eq('number', chapter_number)
          .single()
      ).data?.id)
      .order('number');

    if (vError || !verses || verses.length === 0) {
      await supabase.from('bible_integrity_reports').insert({
        book_id,
        chapter_number,
        calculated_hash: 'N/A',
        expected_hash,
        status: 'missing_source',
        correlation_id
      });
      return new Response(JSON.stringify({ status: 'missing_source' }), { headers: corsHeaders });
    }

    // 2. Concatenar texto para cálculo do hash
    const fullText = verses.map(v => v.text).join(' ');
    const calculatedHash = await calculateSHA256(fullText);

    // 3. Validar integridade
    const status = expected_hash === calculatedHash ? 'match' : 'mismatch';
    
    const { error: reportError } = await supabase.from('bible_integrity_reports').insert({
      book_id,
      chapter_number,
      calculated_hash: calculatedHash,
      expected_hash,
      status,
      correlation_id,
      discrepancy_details: status === 'mismatch' ? {
        verse_count: verses.length,
        sample_text: fullText.substring(0, 100)
      } : null
    });

    if (reportError) throw reportError;

    return new Response(JSON.stringify({ status, calculatedHash }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});