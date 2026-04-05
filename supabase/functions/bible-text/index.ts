import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map abbreviations to ABiblia API format
const ABBREV_MAP: Record<string, string> = {
  'Gn': 'gn', 'Ex': 'ex', 'Lv': 'lv', 'Nm': 'nm', 'Dt': 'dt',
  'Js': 'js', 'Jz': 'jz', 'Rt': 'rt', '1Sm': '1sm', '2Sm': '2sm',
  '1Rs': '1rs', '2Rs': '2rs', '1Cr': '1cr', '2Cr': '2cr',
  'Esd': 'esd', 'Ne': 'ne', 'Tb': 'tb', 'Jt': 'jt', 'Est': 'est',
  '1Mc': '1mc', '2Mc': '2mc', 'Jó': 'jo', 'Sl': 'sl', 'Pr': 'pr',
  'Ecl': 'ecl', 'Ct': 'ct', 'Sb': 'sb', 'Eclo': 'eclo',
  'Is': 'is', 'Jr': 'jr', 'Lm': 'lm', 'Br': 'br', 'Ez': 'ez',
  'Dn': 'dn', 'Os': 'os', 'Jl': 'jl', 'Am': 'am', 'Ab': 'ab',
  'Jn': 'jn', 'Mq': 'mq', 'Na': 'na', 'Hab': 'hab', 'Sf': 'sf',
  'Ag': 'ag', 'Zc': 'zc', 'Ml': 'ml',
  'Mt': 'mt', 'Mc': 'mc', 'Lc': 'lc', 'Jo': 'jo',
  'At': 'at', 'Rm': 'rm', '1Cor': '1co', '2Cor': '2co',
  'Gl': 'gl', 'Ef': 'ef', 'Fl': 'fl', 'Cl': 'cl',
  '1Ts': '1ts', '2Ts': '2ts', '1Tm': '1tm', '2Tm': '2tm',
  'Tt': 'tt', 'Fm': 'fm', 'Hb': 'hb', 'Tg': 'tg',
  '1Pd': '1pe', '2Pd': '2pe', '1Jo': '1jo', '2Jo': '2jo', '3Jo': '3jo',
  'Jd': 'jd', 'Ap': 'ap',
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
        JSON.stringify({ error: 'Parâmetros "abbrev" e "chapter" são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiAbbrev = ABBREV_MAP[abbrev] || abbrev.toLowerCase();

    // Try ABiblia API first
    const url = `https://www.abibliadigital.com.br/api/verses/nvi/${apiAbbrev}/${chapter}`;
    console.log('Fetching:', url);

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.verses && Array.isArray(data.verses)) {
        const verses = data.verses.map((v: any) => ({
          number: v.number,
          text: v.text,
        }));

        const bookName = data.book?.name || abbrev;

        return new Response(
          JSON.stringify({
            book: bookName,
            chapter,
            verses,
            text: verses.map((v: any) => `${v.number}. ${v.text}`).join('\n'),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fallback: try bible-api.com
    const fallbackUrl = `https://bible-api.com/${apiAbbrev}+${chapter}?translation=almeida`;
    console.log('Fallback:', fallbackUrl);

    const fallbackRes = await fetch(fallbackUrl);
    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json();

      if (fallbackData.verses && Array.isArray(fallbackData.verses)) {
        const verses = fallbackData.verses.map((v: any) => ({
          number: v.verse,
          text: v.text,
        }));

        return new Response(
          JSON.stringify({
            book: abbrev,
            chapter,
            verses,
            text: verses.map((v: any) => `${v.number}. ${v.text}`).join('\n'),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // If both fail, return a meaningful message
    return new Response(
      JSON.stringify({
        book: abbrev,
        chapter,
        verses: [],
        text: `Texto de ${abbrev} ${chapter} não disponível no momento. Tente novamente mais tarde.`,
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
