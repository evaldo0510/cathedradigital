import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // 1. Fetch pending retries via RPC
    const { data: pendingLogs, error: fetchError } = await supabase.rpc('get_pending_webhook_retries')
    
    if (fetchError) throw fetchError
    if (!pendingLogs || pendingLogs.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending retries found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    console.log(`Processing ${pendingLogs.length} pending retries...`)
    const results = []

    for (const log of pendingLogs) {
      try {
        console.log(`Retrying log ${log.id} (Attempt #${log.retry_count + 1})`)
        
        // Call the webhook function again
        // We use service role to call it internally
        const { data, error } = await supabase.functions.invoke('mercado-pago-webhook', {
          body: log.payload,
          headers: {
            'x-request-id': log.event_id,
            'x-is-retry': 'true',
            'x-retry-log-id': log.id
          }
        })

        results.push({ id: log.id, success: !error, error: error?.message })
      } catch (err) {
        console.error(`Error retrying log ${log.id}:`, err)
        results.push({ id: log.id, success: false, error: err.message })
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Retry worker error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
