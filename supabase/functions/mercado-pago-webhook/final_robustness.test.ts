import { assert, assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/mercado-pago-webhook`;
const RETRY_URL = `${SUPABASE_URL}/functions/v1/mercado-pago-retry`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

Deno.test("Mercado Pago - Full Robustness E2E", async () => {
  const eventId = `e2e_robust_${Date.now()}`;
  
  // 1. Simulate a transient failure (Timeout)
  const resp1 = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': eventId,
      'x-simulate-timeout': 'true',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      action: 'payment.updated',
      data: { id: `payment_${eventId}` },
      userId: TEST_USER_ID,
      simulation: true
    })
  });
  assertEquals(resp1.status, 400);

  // 2. Check that alert was recorded
  const { data: alert } = await supabase
    .from('webhook_alerts')
    .select('count')
    .eq('alert_type', 'timeout')
    .single();
  assert((alert?.count || 0) > 0);

  // 3. Verify it's marked as failed with retry count 1
  const { data: log1 } = await supabase
    .from('webhook_logs')
    .select('status, retry_count, next_retry_at')
    .eq('event_id', eventId)
    .single();
  assertEquals(log1.status, 'failed');
  assertEquals(log1.retry_count, 1);
  assert(log1.next_retry_at !== null);

  // 4. Force retry window and run retry worker
  await supabase
    .from('webhook_logs')
    .update({ next_retry_at: new Date(Date.now() - 1000).toISOString() })
    .eq('event_id', eventId);

  const retryResp = await fetch(RETRY_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
  });
  assertEquals(retryResp.status, 200);

  // 5. Verify success and NO DUPLICATE access (idempotency)
  const { data: log2 } = await supabase
    .from('webhook_logs')
    .select('status, retry_count')
    .eq('event_id', eventId)
    .single();
  assertEquals(log2.status, 'success');

  // 6. Test Idempotency with "Already PRO" status
  // User should be PRO now
  const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', TEST_USER_ID).single();
  assert(profile.is_premium);

  const respDup = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': `${eventId}_dup`,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      action: 'payment.updated',
      data: { id: `payment_${eventId}` },
      userId: TEST_USER_ID,
      simulation: true,
      simulated_status: 'approved'
    })
  });
  const dupResult = await respDup.json();
  assertEquals(respDup.status, 200);
  assertEquals(dupResult.message, 'Already PRO');
});
