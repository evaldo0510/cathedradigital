import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getOrCreateCorrelationId, correlationResponseHeader } from "../_shared/correlation.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
  'Access-Control-Expose-Headers': 'x-correlation-id',
}

serve(async (req) => {
  // Sprint A / CAT-001 — correlation_id (ADR-009)
  const cid = getOrCreateCorrelationId(req)
  const cidH = correlationResponseHeader(cid)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders, ...cidH } })
  }

  try {
    const { query } = await req.json()
    
    // Normalize query for better matching
    const normalizedQuery = (query || "").toLowerCase().trim()

    // Lógica de busca mock refinada para consistência com o vernáculo PT-BR
    const allResults = [
      { bookAbbrev: 'Jo', bookName: 'João', chapter: 3, verse: 16, text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.', score: 95 },
      { bookAbbrev: 'Gn', bookName: 'Gênesis', chapter: 1, verse: 1, text: 'No princípio criou Deus o céu e a terra.', score: 90 },
      { bookAbbrev: 'Sl', bookName: 'Salmos', chapter: 23, verse: 1, text: 'O Senhor é o meu pastor, nada me faltará.', score: 85 },
      { bookAbbrev: 'Tb', bookName: 'Tobias', chapter: 1, verse: 1, text: 'Livro da história de Tobias, filho de Tobiel, filho de Ananiel, filho de Aduel, filho de Gabael, da descendência de Asiel, da tribo de Neftali.', score: 80 },
      { bookAbbrev: 'Sb', bookName: 'Sabedoria', chapter: 1, verse: 1, text: 'Amai a justiça, vós que governais a terra, tende para com o Senhor sentimentos bons e buscai-o na simplicidade do coração.', score: 82 }
    ];

    const results = normalizedQuery 
      ? allResults.filter(r => 
          r.text.toLowerCase().includes(normalizedQuery) || 
          r.bookName.toLowerCase().includes(normalizedQuery) ||
          r.bookAbbrev.toLowerCase().includes(normalizedQuery)
        )
      : allResults;

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, ...cidH, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, ...cidH, 'Content-Type': 'application/json' } }
    )
  }
})