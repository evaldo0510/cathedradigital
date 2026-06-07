import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, if-none-match',
  'Access-Control-Expose-Headers': 'ETag',
};

// Version for ETag invalidation
const CACHE_VERSION = "v1.2.0";

const BOOK_NAME_MAP: Record<string, string> = {
  'Gn': 'genesis', 'Ex': 'exodus', 'Lv': 'leviticus', 'Nm': 'numbers', 'Dt': 'deuteronomy',
  'Js': 'joshua', 'Jz': 'judges', 'Rt': 'ruth', '1Sm': '1samuel', '2Sm': '2samuel',
  '1Rs': '1kings', '2Rs': '2kings', '1Cr': '1chronicles', '2Cr': '2chronicles',
  'Esd': 'ezra', 'Ne': 'nehemiah', 'Tb': 'tobit', 'Jdt': 'judith', 'Est': 'esther',
  '1Mc': '1maccabees', '2Mc': '2maccabees', 'Jó': 'job', 'Sl': 'psalms', 'Pr': 'proverbs', 
  'Ecl': 'ecclesiastes', 'Ct': 'song of solomon', 'Sb': 'wisdom', 'Eclo': 'sirach',
  'Is': 'isaiah', 'Jr': 'jeremiah', 'Lm': 'lamentations', 'Br': 'baruch',
  'Ez': 'ezequiel', 'Dn': 'daniel', 'Os': 'hosea', 'Jl': 'joel', 'Am': 'amos',
  'Ab': 'obadiah', 'Jn': 'jonah', 'Mq': 'micah', 'Na': 'nahum', 'Hab': 'habakkuk',
  'Sf': 'zephaniah', 'Ag': 'haggai', 'Zc': 'zechariah', 'Ml': 'malachi',
  'Mt': 'matthew', 'Mc': 'mark', 'Lc': 'luke', 'Jo': 'john',
  'At': 'acts', 'Rm': 'romans', '1Cor': '1corinthians', '2Cor': '2corinthians',
  'Gl': 'galatians', 'Ef': 'ephesians', 'Fl': 'philippians', 'Cl': 'colossians',
  '1Ts': '1thessalonians', '2Ts': '2thessalonians', '1Tm': '1timothy', '2Tm': '2timothy',
  'Tt': 'titus', 'Fm': 'philemon', 'Hb': 'hebrews', 'Tg': 'james',
  '1Pd': '1peter', '2Pd': '2peter', '1Jo': '1john', '2Jo': '2john', '3Jo': '3john',
  'Jd': 'jude', 'Ap': 'revelation'
};

const BOOK_PT_MAP: Record<string, string> = {
  'Gn': 'Gênesis', 'Ex': 'Êxodo', 'Lv': 'Levítico', 'Nm': 'Números', 'Dt': 'Deuteronômio',
  'Js': 'Josué', 'Jz': 'Juízes', 'Rt': 'Rute', '1Sm': '1 Samuel', '2Sm': '2 Samuel',
  '1Rs': '1 Reis', '2Rs': '2 Reis', '1Cr': '1 Crônicas', '2Cr': '2 Crônicas',
  'Esd': 'Esdras', 'Ne': 'Neemias', 'Tb': 'Tobias', 'Jdt': 'Judite', 'Est': 'Ester',
  '1Mc': '1 Macabeus', '2Mc': '2 Macabeus', 'Jó': 'Jó', 'Sl': 'Salmos', 'Pr': 'Provérbios', 
  'Ecl': 'Eclesiastes', 'Ct': 'Cântico dos Cânticos', 'Sb': 'Sabedoria', 'Eclo': 'Eclesiástico',
  'Is': 'Isaías', 'Jr': 'Jeremias', 'Lm': 'Lamentações', 'Br': 'Baruc',
  'Ez': 'Ezequiel', 'Dn': 'Daniel', 'Os': 'Oseias', 'Jl': 'Joel', 'Am': 'Amós',
  'Ab': 'Abdias', 'Jn': 'Jonas', 'Mq': 'Miqueias', 'Na': 'Naum', 'Hab': 'Habacuc',
  'Sf': 'Sofonias', 'Ag': 'Ageu', 'Zc': 'Zacarias', 'Ml': 'Malaquias',
  'Mt': 'Mateus', 'Mc': 'Marcos', 'Lc': 'Lucas', 'Jo': 'João',
  'At': 'Atos', 'Rm': 'Romanos', '1Cor': '1 Coríntios', '2Cor': '2 Coríntios',
  'Gl': 'Gálatas', 'Ef': 'Efésios', 'Fl': 'Filipenses', 'Cl': 'Colossenses',
  '1Ts': '1 Tessalonicenses', '2Ts': '2 Tessalonicenses', '1Tm': '1 Timóteo', '2Tm': '2 Timóteo',
  'Tt': 'Tito', 'Fm': 'Filemon', 'Hb': 'Hebreus', 'Tg': 'Tiago',
  '1Pd': '1 Pedro', '2Pd': '2 Pedro', '1Jo': '1 João', '2Jo': '2 João', '3Jo': '3 João',
  'Jd': 'Judas', 'Ap': 'Apocalipse'
};

const BOLLS_BOOK_ID: Record<string, number> = {
  'Gn': 1, 'Ex': 2, 'Lv': 3, 'Nm': 4, 'Dt': 5, 'Js': 6, 'Jz': 7, 'Rt': 8, '1Sm': 9, '2Sm': 10,
  '1Rs': 11, '2Rs': 12, '1Cr': 13, '2Cr': 14, 'Esd': 15, 'Ne': 16, 'Est': 17, 'Jó': 18, 'Sl': 19,
  'Pr': 20, 'Ecl': 21, 'Ct': 22, 'Is': 23, 'Jr': 24, 'Lm': 25, 'Ez': 26, 'Dn': 27, 'Os': 28,
  'Jl': 29, 'Am': 30, 'Ab': 31, 'Jn': 32, 'Mq': 33, 'Na': 34, 'Hab': 35, 'Sf': 36, 'Ag': 37,
  'Zc': 38, 'Ml': 39, 'Mt': 40, 'Mc': 41, 'Lc': 42, 'Jo': 43, 'At': 44, 'Rm': 45, '1Cor': 46,
  '2Cor': 47, 'Gl': 48, 'Ef': 49, 'Fl': 50, 'Cl': 51, '1Ts': 52, '2Ts': 53, '1Tm': 54, '2Tm': 55,
  'Tt': 56, 'Fm': 57, 'Hb': 58, 'Tg': 59, '1Pd': 60, '2Pd': 61, '1Jo': 62, '2Jo': 63, '3Jo': 64,
  'Jd': 65, 'Ap': 66, 'Tb': 68, 'Jdt': 69, '1Mc': 74, '2Mc': 75, 'Sb': 70, 'Eclo': 71, 'Br': 73
};

function robustTranslate(text: string): { translated: string, correctionCount: number } {
  if (!text) return { translated: '', correctionCount: 0 };
  let translated = text;
  let count = 0;
  const map: Record<string, string> = {
    '\\bChapter\\b': 'Capítulo', '\\bVerse\\b': 'Versículo', '\\bTobit\\b': 'Tobias',
    '\\bJudith\\b': 'Judite', '\\bWisdom\\b': 'Sabedoria', '\\bSirach\\b': 'Eclesiástico',
    '\\bBaruch\\b': 'Baruc', '\\bMaccabees\\b': 'Macabeus', '\\bObadiah\\b': 'Abdias',
    '\\bLord\\b': 'Senhor', '\\bGod\\b': 'Deus', '\\bJesus\\b': 'Jesus', '\\bChrist\\b': 'Cristo'
  };

  for (const [eng, pt] of Object.entries(map)) {
    const regex = new RegExp(eng, 'gi');
    const matches = translated.match(regex);
    if (matches) {
      count += matches.length;
      translated = translated.replace(regex, pt);
    }
  }
  return { translated, correctionCount: count };
}

async function fetchFromBibleApi(englishName: string, chapter: number) {
  const isDeutero = ['tobit', 'judith', 'wisdom', 'sirach', 'baruch', '1maccabees', '2maccabees'].includes(englishName.toLowerCase());
  const translation = isDeutero ? 'webbe' : 'almeida';
  const url = `https://bible-api.com/${encodeURIComponent(englishName)}+${chapter}?translation=${translation}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return { data: null, error: `BibleAPI failed: ${res.status}` };
    const data = await res.json();
    if (!data.verses || data.verses.length === 0) return { data: null, error: 'Empty verses' };
    
    let totalCorrections = 0;
    const verses = data.verses.map((v: any) => {
      const { translated, correctionCount } = robustTranslate(v.text?.trim() || '');
      totalCorrections += correctionCount;
      return { number: v.verse, text: translated };
    });
    return { data: verses, corrections: totalCorrections };
  } catch (e) {
    return { data: null, error: e.message };
  }
}

async function fetchFromBollsLife(bookId: number, chapter: number) {
  const url = `https://bolls.life/get-chapter/NAA/${bookId}/${chapter}/`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { data: null, error: `Bolls failed: ${res.status}` };
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return { data: null, error: 'Empty data' };
    
    let totalCorrections = 0;
    const verses = data.map((v: any) => {
      const clean = (v.text || '').replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' ').trim();
      const { translated, correctionCount } = robustTranslate(clean);
      totalCorrections += correctionCount;
      return { number: v.verse, text: translated };
    });
    return { data: verses, corrections: totalCorrections };
  } catch (e) {
    return { data: null, error: e.message };
  }
}

serve(async (req) => {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { abbrev, chapter } = body;
    
    if (!abbrev || !chapter) {
      return new Response(JSON.stringify({ error: 'Parâmetros inválidos' }), { status: 400, headers: corsHeaders });
    }

    const findCaseInsensitive = (map: Record<string, any>, key: string) => {
      const lowerKey = key.toLowerCase();
      const match = Object.keys(map).find(k => k.toLowerCase() === lowerKey);
      return match ? map[match] : null;
    };

    const englishName = findCaseInsensitive(BOOK_NAME_MAP, abbrev) || abbrev.toLowerCase();
    const ptName = findCaseInsensitive(BOOK_PT_MAP, abbrev) || abbrev;
    const bookId = findCaseInsensitive(BOLLS_BOOK_ID, abbrev);

    // ETag Generation
    const etagValue = `"${CACHE_VERSION}-${englishName}-${chapter}"`;
    if (req.headers.get('if-none-match') === etagValue) {
      return new Response(null, { status: 304, headers: { ...corsHeaders, 'ETag': etagValue } });
    }

    const results = await Promise.allSettled([
      fetchFromBibleApi(englishName, chapter),
      bookId ? fetchFromBollsLife(bookId, chapter) : Promise.resolve({ data: null, error: 'No ID' })
    ]);

    let verses = null;
    let source = 'none';
    let correctionCount = 0;
    let errors = [];

    for (const [idx, r] of results.entries()) {
      if (r.status === 'fulfilled' && r.value.data) {
        verses = r.value.data;
        source = idx === 0 ? 'BibleAPI' : 'BollsLife';
        correctionCount = r.value.corrections || 0;
        break;
      } else if (r.status === 'fulfilled') {
        errors.push(r.value.error);
      }
    }

    const duration = performance.now() - startTime;
    
    // Structured Logging
    console.log(JSON.stringify({
      level: verses ? 'info' : 'error',
      requestId,
      event: 'bible_fetch',
      book: abbrev,
      chapter,
      source,
      duration_ms: Math.round(duration),
      correction_count: correctionCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    }));

    if (verses) {
      return new Response(
        JSON.stringify({ book: ptName, chapter, verses, text: verses.map((v: any) => `${v.number}. ${v.text}`).join('\n') }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'ETag': etagValue,
            'Cache-Control': 'public, max-age=604800, s-maxage=604800'
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({ book: ptName, chapter, verses: [], text: 'Texto indisponível.' }),
      { status: 404, headers: corsHeaders }
    );

  } catch (error) {
    console.error(JSON.stringify({ level: 'critical', requestId, event: 'bible_error', error: error.message }));
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: corsHeaders });
  }
});