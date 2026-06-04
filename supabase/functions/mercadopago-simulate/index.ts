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

  try {
    const { userId, planId, status } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const paymentId = `sim_${Math.random().toString(36).substr(2, 9)}`

    // Create simulated transaction
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        payment_id: paymentId,
        status: status,
        plan_id: planId,
        amount: 99.90,
        description: `Simulated ${planId} Subscription`,
        webhook_payload: { simulated: true, status }
      })

    if (txError) throw txError

    // Update profile status
    const isApproved = status === 'approved'
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        is_premium: isApproved,
        premium_status: isApproved ? 'active' : status,
        premium_expires_at: isApproved ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
      })
      .eq('id', userId)

    if (profileError) throw profileError

    return new Response(JSON.stringify({ success: true, paymentId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
