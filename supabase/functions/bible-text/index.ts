import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map Portuguese abbreviations to English book names for bible-api.com
const BOOK_NAME_MAP: Record<string, string> = {
  'Gn': 'genesis', 'Ex': 'exodus', 'Lv': 'leviticus', 'Nm': 'numbers', 'Dt': 'deuteronomy',
  'Js': 'joshua', 'Jz': 'judges', 'Rt': 'ruth', '1Sm': '1samuel', '2Sm': '2samuel',
  '1Rs': '1kings', '2Rs': '2kings', '1Cr': '1chronicles', '2Cr': '2chronicles',
  'Esd': 'ezra', 'Ne': 'nehemiah', 'Tb': 'tobit', 'Jt': 'judith', 'Est': 'esther',
  '1Mc': '1maccabees', '2Mc': '2maccabees',
  'Jó': 'job', 'Sl': 'psalms', 'Pr': 'proverbs', 'Ecl': 'ecclesiastes',
  'Ct': 'song of solomon', 'Sb': 'wisdom', 'Eclo': 'sirach',
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
  'Jd': 'jude', 'Ap': 'revelation',
};

// Portuguese book names for display
const BOOK_PT_MAP: Record<string, string> = {
  'Gn': 'Gênesis', 'Ex': 'Êxodo', 'Lv': 'Levítico', 'Nm': 'Números', 'Dt': 'Deuteronômio',
  'Js': 'Josué', 'Jz': 'Juízes', 'Rt': 'Rute', '1Sm': '1 Samuel', '2Sm': '2 Samuel',
  '1Rs': '1 Reis', '2Rs': '2 Reis', '1Cr': '1 Crônicas', '2Cr': '2 Crônicas',
  'Esd': 'Esdras', 'Ne': 'Neemias', 'Tb': 'Tobias', 'Jt': 'Judite', 'Est': 'Ester',
  '1Mc': '1 Macabeus', '2Mc': '2 Macabeus',
  'Jó': 'Jó', 'Sl': 'Salmos', 'Pr': 'Provérbios', 'Ecl': 'Eclesiastes',
  'Ct': 'Cântico dos Cânticos', 'Sb': 'Sabedoria', 'Eclo': 'Eclesiástico',
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
  'Jd': 'Judas', 'Ap': 'Apocalipse',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const abbrev = body.abbrev || body.book;
    const chapter = body.chapter;

    if (!abbrev || !chapter) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros "abbrev"/"book" e "chapter" são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const englishName = BOOK_NAME_MAP[abbrev] || abbrev.toLowerCase();
    const ptName = BOOK_PT_MAP[abbrev] || abbrev;

    // Use bible-api.com with Almeida translation (Portuguese)
    const url = `https://bible-api.com/${encodeURIComponent(englishName)}+${chapter}?translation=almeida`;
    console.log('Fetching:', url);

    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();

      if (data.verses && Array.isArray(data.verses) && data.verses.length > 0) {
        const verses = data.verses.map((v: any) => ({
          number: v.verse,
          text: v.text?.trim() || '',
        }));

        return new Response(
          JSON.stringify({
            book: ptName,
            chapter,
            verses,
            text: verses.map((v: any) => `${v.number}. ${v.text}`).join('\n'),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const errText = await response.text();
    console.error('API error:', response.status, errText);

    return new Response(
      JSON.stringify({
        book: ptName,
        chapter,
        verses: [],
        text: `Texto de ${ptName} ${chapter} não disponível no momento.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Bible text error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
