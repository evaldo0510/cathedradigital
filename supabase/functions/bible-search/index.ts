import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    
    // Normalize query for better matching
    const normalizedQuery = (query || "").toLowerCase().trim()

    // Mock search logic refined for consistency
    const allResults = [
      { bookAbbrev: 'Jo', bookName: 'João', chapter: 3, verse: 16, text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.', score: 95 },
      { bookAbbrev: 'Gn', bookName: 'Gênesis', chapter: 1, verse: 1, text: 'No princípio criou Deus o céu e a terra.', score: 90 },
      { bookAbbrev: 'Sl', bookName: 'Salmos', chapter: 23, verse: 1, text: 'O Senhor é o meu pastor, nada me faltará.', score: 85 }
    ];

    const results = normalizedQuery 
      ? allResults.filter(r => 
          r.text.toLowerCase().includes(normalizedQuery) || 
          r.bookName.toLowerCase().includes(normalizedQuery)
        )
      : allResults;

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})