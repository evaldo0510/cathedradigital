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

const CACHE_VERSION = "v1.3.3";

const DEUTERO_ABBREVS = ['Tb', 'Jdt', 'Sb', 'Eclo', 'Br', '1Mc', '2Mc'];


const BOLLS_BOOK_ID: Record<string, number> = {
  'Gn': 1, 'Ex': 2, 'Lv': 3, 'Nm': 4, 'Dt': 5, 'Js': 6, 'Jz': 7, 'Rt': 8, '1Sm': 9, '2Sm': 10,
  '1Rs': 11, '2Rs': 12, '1Cr': 13, '2Cr': 14, 'Esd': 15, 'Ne': 16, 'Est': 17, 'Jó': 18, 'Sl': 19,
  'Pr': 20, 'Ecl': 21, 'Ct': 22, 'Is': 23, 'Jr': 24, 'Lm': 25, 'Ez': 26, 'Dn': 27, 'Os': 28,
  'Jl': 29, 'Am': 30, 'Ab': 31, 'Jn': 32, 'Mq': 33, 'Na': 34, 'Hab': 35, 'Sf': 36, 'Ag': 37,
  'Zc': 38, 'Ml': 39, 'Mt': 40, 'Mc': 41, 'Lc': 42, 'Jo': 43, 'At': 44, 'Rm': 45, '1Cor': 46,
  '2Cor': 47, 'Gl': 48, 'Ef': 49, 'Fl': 50, 'Cl': 51, '1Ts': 52, '2Ts': 53, '1Tm': 54, '2Tm': 55,
  'Tt': 56, 'Fm': 57, 'Hb': 58, 'Tg': 59, '1Pd': 60, '2Pd': 61, '1Jo': 62, '2Jo': 63, '3Jo': 64,
  'Jd': 65, 'Ap': 66
};

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


async function fetchFromBollsLife(bookId: number, chapter: number) {
  try {
    const res = await fetch(`https://bolls.life/get-chapter/NAA/${bookId}/${chapter}/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    return data.map((v: any) => ({ number: v.verse, text: (v.text || '').replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' ').trim() }));
  } catch { return null; }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const rawBody = await req.text();
    if (!rawBody) return new Response(JSON.stringify({ error: 'Body vazio' }), { status: 400, headers: corsHeaders });
    
    const { abbrev, chapter } = JSON.parse(rawBody);
    if (!abbrev || !chapter) return new Response(JSON.stringify({ error: 'Parâmetros inválidos' }), { status: 400, headers: corsHeaders });

    // 1. Prioridade Máxima: Banco Cathedra
    const dbResult = await fetchFromCathedraDb(abbrev, chapter);
    if (dbResult) {
      console.log(JSON.stringify({
        level: 'info', requestId, event: 'bible_fetch_success',
        book: abbrev, chapter, source: 'Cathedra (Banco)', duration_ms: Math.round(performance.now() - startTime)
      }));
      return new Response(JSON.stringify({
        book: dbResult.bookName, chapter, verses: dbResult.verses,
        metadata: { source: 'Cathedra (Banco)', cache_version: CACHE_VERSION }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // BLOQUEIO DETERMINÍSTICO: Deuterocanônicos DEVEM vir do banco.
    if (DEUTERO_ABBREVS.includes(abbrev)) {
      const errorMsg = `O livro ${abbrev} ainda não foi migrado para o banco Cathedra ou o capítulo ${chapter} não existe.`;
      console.warn(JSON.stringify({
        level: 'warning', requestId, event: 'bible_fetch_missing_deutero',
        book: abbrev, chapter, error: errorMsg, timestamp
      }));
      return new Response(JSON.stringify({ error: errorMsg, isDeutero: true }), { status: 404, headers: corsHeaders });
    }

    // 2. Protocanônicos: Fallback BollsLife
    const bookId = BOLLS_BOOK_ID[abbrev];
    if (bookId) {
      const verses = await fetchFromBollsLife(bookId, chapter);
      if (verses) {
        console.log(JSON.stringify({
          level: 'info', requestId, event: 'bible_fetch_success',
          book: abbrev, chapter, source: 'BollsLife (NAA)', duration_ms: Math.round(performance.now() - startTime)
        }));
        return new Response(JSON.stringify({
          book: abbrev, chapter, verses,
          metadata: { source: 'BollsLife (NAA)', cache_version: CACHE_VERSION }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    console.error(JSON.stringify({
      level: 'error', requestId, event: 'bible_fetch_not_found',
      book: abbrev, chapter, timestamp
    }));
    return new Response(JSON.stringify({ error: 'Texto indisponível' }), { status: 404, headers: corsHeaders });

  } catch (e) {
    return new Response(JSON.stringify({ error: 'Erro interno', message: e.message }), { status: 500, headers: corsHeaders });
  }
});
