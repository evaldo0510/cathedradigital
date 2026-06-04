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

  try {
    const signature = req.headers.get('x-signature') || req.headers.get('x-mp-signature')
    const requestId = req.headers.get('x-request-id') || req.headers.get('x-delivery-id')
    
    const rawBody = await req.text()
    body = JSON.parse(rawBody)
    
    // Create initial log
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

    // 1. Signature Validation (Mocked for now as we don't have the secret)
    const webhookSecret = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET')
    if (webhookSecret && signature) {
      console.log('Validating signature:', signature)
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
        console.log('Duplicate webhook detected:', requestId)
        if (logId) {
          await supabase.from('webhook_logs').update({ status: 'success', error_message: 'Duplicate event' }).eq('id', logId)
        }
        return new Response(JSON.stringify({ duplicate: true }), { status: 200, headers: corsHeaders })
      }
    }

    const { action, data, simulation, simulated_status, userId: providedUserId } = body
    
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
        
        if (!response.ok) {
          throw new Error(`Failed to fetch payment details: ${response.statusText}`)
        }
        paymentDetails = await response.json()
      }

      const { status, external_reference: userId } = paymentDetails
      
      if (userId) {
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

    // Update log to success
    if (logId) {
      await supabase.from('webhook_logs').update({ 
        status: 'success',
        duration_ms: Date.now() - startTime
      }).eq('id', logId)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    if (logId) {
      await supabase.from('webhook_logs').update({ 
        status: 'failed', 
        error_message: error.message,
        duration_ms: Date.now() - startTime
      }).eq('id', logId)
    }
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})