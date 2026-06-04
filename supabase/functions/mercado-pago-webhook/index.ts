import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-mp-signature, x-signature',
}

serve(async (req) => {
  const startTime = Date.now()
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  let logId: string | null = null
  let body: any = {}
  
  // Robustness simulation headers
  const simulateDbError = req.headers.get('x-simulate-db-error') === 'true'
  const simulateTimeout = req.headers.get('x-simulate-timeout') === 'true'
  const isRetry = req.headers.get('x-is-retry') === 'true'
  const retryLogId = req.headers.get('x-retry-log-id')

  try {
    const signature = req.headers.get('x-signature') || req.headers.get('x-mp-signature')
    const requestId = req.headers.get('x-request-id') || req.headers.get('x-delivery-id')
    
    const rawBody = await req.text()
    body = JSON.parse(rawBody)
    
    // Create initial log if not a retry (or use existing if it's a retry)
    if (isRetry && retryLogId) {
      logId = retryLogId
      await supabase.from('webhook_logs').update({ status: 'pending', last_retry_at: new Date().toISOString() }).eq('id', logId)
    } else {
      const { data: logData } = await supabase
        .from('webhook_logs')
        .insert({
          provider: 'mercado_pago',
          event_id: requestId,
          event_type: body.action || body.type,
          payload: body,
          status: 'pending'
        })
        .select('id')
        .single()
      logId = logData?.id
    }

    // 1. Signature Validation (Mocked)
    const webhookSecret = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET')
    if (webhookSecret && signature) {
      // Logic for validation would go here
    }

    // 2. Idempotency Check
    if (requestId) {
      const { data: existingLog } = await supabase
        .from('webhook_logs')
        .select('id')
        .eq('event_id', requestId)
        .eq('status', 'success')
        .neq('id', logId)
        .maybeSingle()
      
      if (existingLog) {
        if (logId) {
          await supabase.from('webhook_logs').update({ status: 'success', error_message: 'Duplicate event' }).eq('id', logId)
        }
        return new Response(JSON.stringify({ duplicate: true }), { status: 200, headers: corsHeaders })
      }
    }

    const { action, data, simulation, simulated_status, userId: providedUserId } = body
    
    if (simulateDbError) throw new Error('Simulated Database Error')
    if (simulateTimeout) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      throw new Error('Simulated Timeout Error')
    }

    if (action === 'payment.created' || action === 'payment.updated') {
      const paymentId = data.id
      let paymentDetails: any
      
      if (simulation) {
        paymentDetails = {
          id: paymentId,
          status: simulated_status || 'approved',
          transaction_amount: 99.9,
          description: 'Plano PRO - Simulação',
          external_reference: providedUserId,
          metadata: { plan_id: 'pro_annual' }
        }
      } else {
        const mpToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${mpToken}` }
        })
        if (!response.ok) throw new Error(`Failed to fetch payment details: ${response.statusText}`)
        paymentDetails = await response.json()
      }

      const { status, external_reference: userId } = paymentDetails
      
      if (userId) {
        // PRE-CHECK: Is user already PRO?
        const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', userId).single()
        
        if (profile?.is_premium && status === 'approved') {
          console.log('User is already PRO, skipping activation but marking success')
        } else {
          await supabase
            .from('transactions')
            .upsert({
              payment_id: paymentId.toString(),
              user_id: userId,
              status: status,
              webhook_payload: paymentDetails,
              amount: paymentDetails.transaction_amount,
              description: paymentDetails.description,
              plan_id: paymentDetails.metadata?.plan_id || 'pro'
            }, { onConflict: 'payment_id' })

          if (status === 'approved') {
            await supabase
              .from('profiles')
              .update({ 
                is_premium: true,
                premium_status: 'active',
                premium_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
              })
              .eq('id', userId)
          } else if (status === 'cancelled' || status === 'refunded') {
            await supabase
              .from('profiles')
              .update({ is_premium: false, premium_status: status })
              .eq('id', userId)
          }
        }
      }
    }

    // Update log to success
    if (logId) {
      await supabase.from('webhook_logs').update({ 
        status: 'success',
        duration_ms: Date.now() - startTime,
        error_message: null
      }).eq('id', logId)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    
    // Categorize error for alerts
    let alertType = 'unknown_error'
    if (error.message.includes('Timeout')) alertType = 'timeout'
    if (error.message.includes('signature')) alertType = 'invalid_signature'
    if (error.message.includes('database') || error.message.includes('Database Error')) alertType = 'db_error'

    try {
      await supabase.rpc('track_webhook_alert', { p_type: alertType, p_message: error.message })
    } catch (alertErr) {
      console.error('Failed to track alert:', alertErr)
    }

    if (logId) {
      // Schedule retry with exponential backoff
      const { data: log } = await supabase.from('webhook_logs').select('retry_count').eq('id', logId).single()
      const { data: settings } = await supabase.from('webhook_settings').select('max_retries, retry_backoff_factor').single()
      
      const retryCount = (log?.retry_count || 0) + (isRetry ? 0 : 0) // It's incremented elsewhere or we do it here
      const maxRetries = settings?.max_retries || 5
      const backoffFactor = settings?.retry_backoff_factor || 2
      
      const nextRetryCount = isRetry ? (log?.retry_count || 0) + 1 : 1
      
      if (nextRetryCount <= maxRetries) {
        // Backoff: 1 min, 2 min, 4 min, 8 min, 16 min...
        const delayMinutes = Math.pow(backoffFactor, nextRetryCount - 1)
        const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString()
        
        await supabase.from('webhook_logs').update({ 
          status: 'failed', 
          error_message: error.message,
          duration_ms: Date.now() - startTime,
          retry_count: nextRetryCount,
          next_retry_at: nextRetryAt
        }).eq('id', logId)
      } else {
        await supabase.from('webhook_logs').update({ 
          status: 'failed', 
          error_message: `${error.message} (Max retries reached)`,
          duration_ms: Date.now() - startTime,
          retry_count: nextRetryCount,
          next_retry_at: null
        }).eq('id', logId)
      }
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
