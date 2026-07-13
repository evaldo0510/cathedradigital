import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { logSecurityEvent } from '../_shared/security-logs.ts'

const _corsBase = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
  'Access-Control-Expose-Headers': 'x-correlation-id',
}


// Alias módulo-level (helpers fora do handler não conhecem o CID do request)
const corsHeaders = _corsBase;const GENERIC_ERROR = 'Erro interno. Tente novamente.'

serve(async (req) => {
  // Sprint A / CAT-001 — correlation_id (ADR-009)
  const _cid = getOrCreateCorrelationId(req);
  const corsHeaders = { ..._corsBase, 'x-correlation-id': _cid };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Require auth - derive user from JWT, never trust body userId
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      await logSecurityEvent(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        'unauthorized_access',
        'Attempt to access mercadopago-simulate without Bearer token',
        'critical',
        { headers: Object.fromEntries(req.headers.entries()) }
      )
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
      await logSecurityEvent(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        'forbidden_access',
        `Non-admin user ${userId} attempted to use simulation endpoint`,
        'critical',
        { userId }
      )
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
