import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-mp-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // MP Webhook Validation (Basic for now, can be enhanced with signature check)
    // Mercado Pago sends 'x-signature' or 'x-mp-signature' headers
    const signature = req.headers.get('x-mp-signature')
    
    const body = await req.json()
    console.log('Webhook received:', JSON.stringify(body))

    const { action, data } = body
    
    if (action === 'payment.created' || action === 'payment.updated') {
      const paymentId = data.id
      
      // Fetch payment details from MP API
      const mpToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${mpToken}`
        }
      })
      
      const paymentData = await response.json()
      const { status, external_reference: userId, additional_info } = paymentData
      
      // Update transaction
      await supabase
        .from('transactions')
        .upsert({
          payment_id: paymentId.toString(),
          user_id: userId,
          status: status,
          webhook_payload: paymentData,
          amount: paymentData.transaction_amount,
          description: paymentData.description,
          plan_id: paymentData.metadata?.plan_id || 'pro'
        }, { onConflict: 'payment_id' })

      // If approved, update profile
      if (status === 'approved') {
        await supabase
          .from('profiles')
          .update({ 
            is_premium: true,
            premium_status: 'active',
            premium_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // Default 1 year
          })
          .eq('id', userId)
      } else if (status === 'cancelled' || status === 'refunded') {
        await supabase
          .from('profiles')
          .update({ 
            is_premium: false,
            premium_status: status
          })
          .eq('id', userId)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
