import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, if-none-match',
  'Access-Control-Expose-Headers': 'ETag',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Version for ETag invalidation - Bump this to force client cache refresh
const CACHE_VERSION = "v1.2.5";


const BOOK_NAME_MAP: Record<string, string> = {
  'Gn': 'genesis', 'Ex': 'exodus', 'Lv': 'leviticus', 'Nm': 'numbers', 'Dt': 'deuteronomy',
  'Js': 'joshua', 'Jz': 'judges', 'Rt': 'ruth', '1Sm': '1samuel', '2Sm': '2samuel',
  '1Rs': '1kings', '2Rs': '2kings', '1Cr': '1chronicles', '2Cr': '2chronicles',
  'Esd': 'ezra', 'Ne': 'nehemiah', 'Tb': 'tobit', 'Jdt': 'judith', 'Est': 'esther',
  '1Mc': '1maccabees', '2Mc': '2maccabees', 'Jó': 'job', 'Sl': 'psalms', 'Pr': 'proverbs', 
  'Ecl': 'ecclesiastes', 'Ct': 'song of solomon', 'Sb': 'wisdom', 'Eclo': 'sirach',
  'Is': 'isaiah', 'Jr': 'jeremiah', 'Lm': 'lamentations', 'Br': 'baruch',
  'Ez': 'ezekiel', 'Dn': 'daniel', 'Os': 'hosea', 'Jl': 'joel', 'Am': 'amos',
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
    '\\bLord\\b': 'Senhor', '\\bGod\\b': 'Deus', '\\bJesus\\b': 'Jesus', '\\bChrist\\b': 'Cristo',
    '\\bMary\\b': 'Maria', '\\bPeter\\b': 'Pedro', '\\bJohn\\b': 'João', '\\bPaul\\b': 'Paulo',
    '\\bGenesis\\b': 'Gênesis', '\\bExodus\\b': 'Êxodo', '\\bLeviticus\\b': 'Levítico',
    '\\bNumbers\\b': 'Números', '\\bDeuteronomy\\b': 'Deuteronômio', '\\bPsalms\\b': 'Salmos'
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

async function translateWithAI(verses: any[], bookName: string, chapter: number) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not found. Skipping AI translation.");
    return verses;
  }

  try {
    const prompt = `Translate the following Bible verses from ${bookName} Chapter ${chapter} into natural, high-quality Portuguese (Brazilian). 
    Use the formal and solemn tone typical of Catholic Bibles (like Bíblia de Jerusalém or Ave Maria). 
    Return ONLY a JSON object with a key "verses" containing the array of objects with "number" and "text" fields.
    
    Input: ${JSON.stringify(verses.slice(0, 80))}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite", // Using the available 2026 model
        messages: [
          { role: "system", content: "You are an expert biblical translator specializing in Catholic Portuguese translations. You must return only a JSON object with the key 'verses'." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway failed: ${response.status} - ${errorText}`);
      return verses;
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    const translatedVerses = parsed.verses || parsed.results || (Array.isArray(parsed) ? parsed : null);
    
    if (translatedVerses && Array.isArray(translatedVerses)) {
      return verses.map((orig, i) => {
        const translated = translatedVerses.find(v => v.number === orig.number) || translatedVerses[i];
        return {
          number: orig.number,
          text: translated?.text || orig.text
        };
      });
    }
    
    return verses;
  } catch (e) {
    console.error("AI Translation error:", e);
    return verses;
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
  const timestamp = new Date().toISOString();
  
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  let abbrev = 'unknown';
  let chapter = 0;

  try {
    const rawBody = await req.text();
    if (!rawBody) {
       return new Response(JSON.stringify({ error: 'Body vazio' }), { status: 400, headers: corsHeaders });
    }
    const body = JSON.parse(rawBody);
    abbrev = body.abbrev;
    chapter = body.chapter;
    
    // ETag check can happen BEFORE body validation if we have enough info in headers, 
    // but here ETag depends on englishName which comes from abbrev.
    // So we need abbrev even for 304.
    
    if (!abbrev || !chapter) {
      const errorMsg = 'Parâmetros inválidos: abbrev e chapter são obrigatórios';
      console.error(JSON.stringify({ 
        level: 'error', requestId, event: 'bible_request_invalid', 
        error: errorMsg, timestamp 
      }));
      return new Response(JSON.stringify({ error: errorMsg }), { status: 400, headers: corsHeaders });
    }

    const findCaseInsensitive = (map: Record<string, any>, key: string) => {
      const lowerKey = key.toLowerCase();
      const match = Object.keys(map).find(k => k.toLowerCase() === lowerKey);
      return match ? map[match] : null;
    };

    const englishName = findCaseInsensitive(BOOK_NAME_MAP, abbrev) || abbrev.toLowerCase();
    const ptName = findCaseInsensitive(BOOK_PT_MAP, abbrev) || abbrev;
    const bookId = findCaseInsensitive(BOLLS_BOOK_ID, abbrev);

    // ETag Generation - Includes version to ensure global invalidation when needed
    const etagValue = `"${CACHE_VERSION}-${englishName}-${chapter}"`;
    const clientEtag = req.headers.get('if-none-match');
    
    // Normalize ETags for comparison (remove weak ETag prefix and quotes)
    const normalize = (tag: string | null) => tag ? tag.trim().replace(/^W\//, '').replace(/"/g, '') : null;
    
    const normalizedClientEtag = normalize(clientEtag);
    const normalizedServerEtag = normalize(etagValue);

    if (normalizedClientEtag && normalizedClientEtag === normalizedServerEtag) {
      console.log(JSON.stringify({
        level: 'info', requestId, event: 'bible_cache_hit_etag',
        book: abbrev, chapter, duration_ms: Math.round(performance.now() - startTime),
        timestamp
      }));
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

    // Prioritize BollsLife (Native Portuguese)
    const bollsResult = results[1];
    if (bollsResult.status === 'fulfilled' && bollsResult.value.data) {
      verses = bollsResult.value.data;
      source = 'BollsLife (NAA)';
      correctionCount = bollsResult.value.corrections || 0;
    } else {
      // Fallback to BibleAPI + AI Translation if BollsLife fails (common for Deuterocanonical)
      const bibleApiResult = results[0];
      if (bibleApiResult.status === 'fulfilled' && bibleApiResult.value.data) {
        verses = bibleApiResult.value.data;
        source = 'BibleAPI (WEBBE)';
        correctionCount = bibleApiResult.value.corrections || 0;
        
        // Detect English text and translate
        const isEnglish = verses.some(v => /\b(the|and|shall|unto|from)\b/i.test(v.text));
        if (isEnglish) {
          console.log(`[AI] English detected in ${abbrev} ${chapter}. Translating...`);
          verses = await translateWithAI(verses, ptName, chapter);
          source += ' + AI Translation';
        }
      }
    }

    if (!verses) {
      for (const r of results) {
        if (r.status === 'rejected') errors.push(r.reason?.message || 'Unknown');
        else if (r.status === 'fulfilled' && r.value.error) errors.push(r.value.error);
      }
    }

    const duration = performance.now() - startTime;
    const success = !!verses;
    
    // Structured Logging with Metrics
    console.log(JSON.stringify({
      level: success ? 'info' : 'warning',
      requestId,
      event: 'bible_fetch_complete',
      book: abbrev,
      englishName,
      chapter,
      source,
      success,
      duration_ms: Math.round(duration),
      correction_count: correctionCount,
      correction_rate: verses?.length ? (correctionCount / verses.length).toFixed(4) : 0,
      errors: errors.length > 0 ? errors : undefined,
      cache_version: CACHE_VERSION,
      timestamp
    }));

    if (verses) {
      return new Response(
        JSON.stringify({ 
          book: ptName, 
          chapter, 
          verses, 
          text: verses.map((v: any) => `${v.number}. ${v.text}`).join('\n'),
          metadata: { source, requestId, timestamp, cache_version: CACHE_VERSION }
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'ETag': etagValue,
            'Cache-Control': 'public, max-age=604800, s-maxage=604800',
            'X-Request-Id': requestId
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({ book: ptName, chapter, verses: [], text: 'Texto indisponível.', requestId }),
      { status: 404, headers: corsHeaders }
    );

  } catch (error) {
    console.error(JSON.stringify({ 
      level: 'critical', requestId, event: 'bible_critical_error', 
      book: abbrev, chapter, error: error.message, stack: error.stack, timestamp 
    }));
    return new Response(JSON.stringify({ error: 'Erro interno no processamento do texto bíblico', requestId }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});