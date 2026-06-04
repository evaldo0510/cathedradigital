import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Rate limiter: 20 searches per minute per IP
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) {
    rateLimitMap.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap) {
      if (v.every(t => now - t >= RATE_WINDOW_MS)) rateLimitMap.delete(k);
    }
  }
  return false;
}

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  if (isRateLimited(clientIP)) {
    return new Response(JSON.stringify({ error: "Muitas buscas. Aguarde um momento.", results: [] }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' },
    });
  }

  try {
    const { query, version = 'NVIPT' } = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'Busca muito curta', results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = `https://bolls.life/search/${version}/${encodeURIComponent(query.trim())}/`;
    console.log('Bible search:', url);

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Search API error [${response.status}]`);
      return new Response(JSON.stringify({ error: `Erro na busca (${response.status})`, results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    const BOOK_NAMES: Record<number, { abbrev: string; name: string }> = {
      1: { abbrev: 'Gn', name: 'Gênesis' }, 2: { abbrev: 'Ex', name: 'Êxodo' }, 3: { abbrev: 'Lv', name: 'Levítico' },
      4: { abbrev: 'Nm', name: 'Números' }, 5: { abbrev: 'Dt', name: 'Deuteronômio' }, 6: { abbrev: 'Js', name: 'Josué' },
      7: { abbrev: 'Jz', name: 'Juízes' }, 8: { abbrev: 'Rt', name: 'Rute' }, 9: { abbrev: '1Sm', name: '1 Samuel' },
      10: { abbrev: '2Sm', name: '2 Samuel' }, 11: { abbrev: '1Rs', name: '1 Reis' }, 12: { abbrev: '2Rs', name: '2 Reis' },
      13: { abbrev: '1Cr', name: '1 Crônicas' }, 14: { abbrev: '2Cr', name: '2 Crônicas' },
      15: { abbrev: 'Esd', name: 'Esdras' }, 16: { abbrev: 'Ne', name: 'Neemias' }, 17: { abbrev: 'Est', name: 'Ester' },
      18: { abbrev: 'Jó', name: 'Jó' }, 19: { abbrev: 'Sl', name: 'Salmos' }, 20: { abbrev: 'Pr', name: 'Provérbios' },
      21: { abbrev: 'Ecl', name: 'Eclesiastes' }, 22: { abbrev: 'Ct', name: 'Cânticos' },
      23: { abbrev: 'Is', name: 'Isaías' }, 24: { abbrev: 'Jr', name: 'Jeremias' }, 25: { abbrev: 'Lm', name: 'Lamentações' },
      26: { abbrev: 'Ez', name: 'Ezequiel' }, 27: { abbrev: 'Dn', name: 'Daniel' }, 28: { abbrev: 'Os', name: 'Oseias' },
      29: { abbrev: 'Jl', name: 'Joel' }, 30: { abbrev: 'Am', name: 'Amós' }, 31: { abbrev: 'Ab', name: 'Abdias' },
      32: { abbrev: 'Jn', name: 'Jonas' }, 33: { abbrev: 'Mq', name: 'Miqueias' }, 34: { abbrev: 'Na', name: 'Naum' },
      35: { abbrev: 'Hab', name: 'Habacuque' }, 36: { abbrev: 'Sf', name: 'Sofonias' }, 37: { abbrev: 'Ag', name: 'Ageu' },
      38: { abbrev: 'Zc', name: 'Zacarias' }, 39: { abbrev: 'Ml', name: 'Malaquias' },
      40: { abbrev: 'Mt', name: 'Mateus' }, 41: { abbrev: 'Mc', name: 'Marcos' }, 42: { abbrev: 'Lc', name: 'Lucas' },
      43: { abbrev: 'Jo', name: 'João' }, 44: { abbrev: 'At', name: 'Atos' }, 45: { abbrev: 'Rm', name: 'Romanos' },
      46: { abbrev: '1Cor', name: '1 Coríntios' }, 47: { abbrev: '2Cor', name: '2 Coríntios' },
      48: { abbrev: 'Gl', name: 'Gálatas' }, 49: { abbrev: 'Ef', name: 'Efésios' }, 50: { abbrev: 'Fl', name: 'Filipenses' },
      51: { abbrev: 'Cl', name: 'Colossenses' }, 52: { abbrev: '1Ts', name: '1 Tessalonicenses' },
      53: { abbrev: '2Ts', name: '2 Tessalonicenses' }, 54: { abbrev: '1Tm', name: '1 Timóteo' },
      55: { abbrev: '2Tm', name: '2 Timóteo' }, 56: { abbrev: 'Tt', name: 'Tito' }, 57: { abbrev: 'Fm', name: 'Filemon' },
      58: { abbrev: 'Hb', name: 'Hebreus' }, 59: { abbrev: 'Tg', name: 'Tiago' },
      60: { abbrev: '1Pd', name: '1 Pedro' }, 61: { abbrev: '2Pd', name: '2 Pedro' },
      62: { abbrev: '1Jo', name: '1 João' }, 63: { abbrev: '2Jo', name: '2 João' }, 64: { abbrev: '3Jo', name: '3 João' },
      65: { abbrev: 'Jd', name: 'Judas' }, 66: { abbrev: 'Ap', name: 'Apocalipse' },
      67: { abbrev: 'Tb', name: 'Tobias' }, 68: { abbrev: 'Jt', name: 'Judite' }, 69: { abbrev: '1Mc', name: '1 Macabeus' },
      70: { abbrev: '2Mc', name: '2 Macabeus' }, 71: { abbrev: 'Sb', name: 'Sabedoria' }, 72: { abbrev: 'Eclo', name: 'Eclesiástico' },
      73: { abbrev: 'Br', name: 'Baruc' },
    };

    const results = Array.isArray(data)
      ? data.slice(0, 50).map((v: any) => {
          const book = BOOK_NAMES[v.book] || { abbrev: `${v.book}`, name: `Livro ${v.book}` };
          return {
            bookId: v.book,
            bookAbbrev: book.abbrev,
            bookName: book.name,
            chapter: v.chapter,
            verse: v.verse,
            text: v.text,
          };
        })
      : [];

    return new Response(JSON.stringify({ query, total: results.length, results }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600, s-maxage=600' // 10 minutes
      },
    });
  } catch (error) {
    console.error('Bible search error:', error);
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente.", results: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
