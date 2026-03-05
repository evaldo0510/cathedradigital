import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map internal abbreviations to ABibliaDigital API abbreviations
const ABBREV_MAP: Record<string, string> = {
  'gn': 'gn', 'ex': 'ex', 'lv': 'lv', 'nm': 'nm', 'dt': 'dt',
  'js': 'js', 'jz': 'jz', 'rt': 'rt', '1sm': '1sm', '2sm': '2sm',
  '1rs': '1rs', '2rs': '2rs', '1cr': '1cr', '2cr': '2cr',
  'esd': 'ed', 'ne': 'ne', 'tb': 'tb', 'jt': 'jt', 'est': 'et',
  '1mc': '1mc', '2mc': '2mc', 'jó': 'job', 'sl': 'sl', 'pr': 'pv',
  'ecl': 'ec', 'ct': 'ct', 'sb': 'sb', 'eclo': 'eclo', 'is': 'is',
  'jr': 'jr', 'lm': 'lm', 'br': 'br', 'ez': 'ez', 'dn': 'dn',
  'os': 'os', 'jl': 'jl', 'am': 'am', 'ab': 'ob', 'jn': 'jn',
  'mq': 'mq', 'na': 'na', 'hab': 'hc', 'sf': 'sf', 'ag': 'ag',
  'zc': 'zc', 'ml': 'ml',
  'mt': 'mt', 'mc': 'mc', 'lc': 'lc', 'jo': 'jo', 'at': 'at',
  'rm': 'rm', '1cor': '1co', '2cor': '2co', 'gl': 'gl', 'ef': 'ef',
  'fl': 'fp', 'cl': 'cl', '1ts': '1ts', '2ts': '2ts',
  '1tm': '1tm', '2tm': '2tm', 'tt': 'tt', 'fm': 'fm', 'hb': 'hb',
  'tg': 'tg', '1pd': '1pe', '2pd': '2pe', '1jo': '1jo', '2jo': '2jo',
  '3jo': '3jo', 'jd': 'jd', 'ap': 'ap',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { abbrev, chapter, version = 'nvi' } = await req.json();
    
    const normalizedAbbrev = abbrev.toLowerCase();
    const apiAbbrev = ABBREV_MAP[normalizedAbbrev] || normalizedAbbrev;
    
    const url = `https://www.abibliadigital.com.br/api/verses/${version}/${apiAbbrev}/${chapter}`;
    console.log('Fetching:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error [${response.status}]:`, errorText);
      return new Response(JSON.stringify({ 
        error: `Texto não disponível (${response.status})`,
        verses: [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const data = await response.json();
    
    return new Response(JSON.stringify({
      book: data.book?.name || abbrev,
      chapter: data.chapter?.number || chapter,
      verses: (data.verses || []).map((v: any) => ({
        number: v.number,
        text: v.text,
      })),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Bible text error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      verses: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
