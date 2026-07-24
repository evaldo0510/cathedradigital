import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getOrCreateCorrelationId, correlationResponseHeader } from "../_shared/correlation.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
  'Access-Control-Expose-Headers': 'x-correlation-id',
}

/**
 * P0.2.0 — Contenção.
 *
 * A implementação anterior era um mock com 5 resultados fixos que respondia
 * a qualquer consulta, independentemente do conteúdo real do banco. Isso
 * enganava o leitor durante a reconstrução da Bíblia (apenas 9 livros
 * deuterocanônicos importados). Retornar "busca em atualização" é mais
 * honesto do que devolver resultados incorretos.
 *
 * A implementação real (Full-Text Search + busca semântica) entra em
 * P0.2.3, após a importação completa do cânon (P0.2.2).
 */
serve((req) => {
  const cid = getOrCreateCorrelationId(req)
  const cidH = correlationResponseHeader(cid)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders, ...cidH } })
  }

  return new Response(
    JSON.stringify({
      status: 'unavailable',
      reason: 'bible_reconstruction_p020',
      message: 'Busca bíblica em atualização. Estamos reconstruindo o cânon completo antes de reativar a busca.',
      results: [],
    }),
    {
      status: 503,
      headers: {
        ...corsHeaders,
        ...cidH,
        'Content-Type': 'application/json',
        'Retry-After': '86400',
      },
    },
  )
})
