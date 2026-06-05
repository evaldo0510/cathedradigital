import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GENERIC_ERROR = 'Erro interno. Tente novamente.'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Require auth - derive user from JWT, never trust body userId
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }
    const userId = claimsData.claims.sub as string

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Require admin role to use simulation endpoint
    const { data: isAdmin } = await supabase.rpc('is_current_user_admin')
    // Note: is_current_user_admin uses auth.uid(), which requires the user JWT
    // Fallback: explicit role check
    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle()

    if (!isAdmin && !roleRow) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    const { planId, status } = await req.json()

    const paymentId = `sim_${Math.random().toString(36).substr(2, 9)}`

    // Create simulated transaction (always for the authenticated user)
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        payment_id: paymentId,
        status: status,
        plan_id: planId || 'pro',
        amount: status === 'cancelled' ? 0 : 99.90,
        description: `Simulated ${planId || 'pro'} Subscription - ${status}`,
        webhook_payload: { simulated: true, status }
      })

    if (txError) throw txError

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
    console.error('mercadopago-simulate error:', error)
    return new Response(JSON.stringify({ error: GENERIC_ERROR }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
