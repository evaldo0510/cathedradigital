import { assert, assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/mercado-pago-webhook`;
const RETRY_URL = `${SUPABASE_URL}/functions/v1/mercado-pago-retry`;

if (SUPABASE_SERVICE_ROLE_KEY) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  Deno.test("Mercado Pago Webhook - Automatic Retry & Backoff", async () => {
  const eventId = `test_retry_${Date.now()}`;
  const userId = '00000000-0000-0000-0000-000000000000'; // Assume exists or use valid ID

  // 1. Trigger a failure
  const response1 = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': eventId,
      'x-simulate-db-error': 'true',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      action: 'payment.updated',
      data: { id: `payment_${eventId}` },
      userId: userId,
      simulation: true
    })
  });

  assertEquals(response1.status, 400);

  // 2. Verify retry state in DB
  const { data: log, error: logError } = await supabase
    .from('webhook_logs')
    .select('retry_count, next_retry_at, status')
    .eq('event_id', eventId)
    .single();
  
  assert(!logError);
  assertEquals(log.status, 'failed');
  assertEquals(log.retry_count, 1);
  assert(log.next_retry_at !== null);

  // 3. Force retry by setting next_retry_at to past
  await supabase
    .from('webhook_logs')
    .update({ next_retry_at: new Date(Date.now() - 1000).toISOString() })
    .eq('event_id', eventId);

  // 4. Run retry worker (this should now call the webhook without simulated error)
  // Wait, the payload in the log STILL has the simulated error if I'm not careful.
  // Actually, the simulated error was in HEADERS, so the payload is clean!
  
  const retryResponse = await fetch(RETRY_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
  });
  
  const retryResult = await retryResponse.json();
  assertEquals(retryResponse.status, 200);
  assert(retryResult.processed > 0);

  // 5. Verify final status
  const { data: finalLog } = await supabase
    .from('webhook_logs')
    .select('status, retry_count')
    .eq('event_id', eventId)
    .single();
  
  assertEquals(finalLog.status, 'success');
  // It stays at retry_count = 1 because the second call (the retry) was successful.
});

Deno.test("Mercado Pago Webhook - Idempotency Stop (Already PRO)", async () => {
  const eventId = `test_already_pro_${Date.now()}`;
  const userId = '00000000-0000-0000-0000-000000000000';

  // Ensure user is PRO
  await supabase.from('profiles').update({ is_premium: true }).eq('id', userId);

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': eventId,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      action: 'payment.updated',
      data: { id: `payment_${eventId}` },
      userId: userId,
      simulation: true,
      simulated_status: 'approved'
    })
  });
} else {
  console.log('Skipping retry tests: Missing SERVICE_ROLE_KEY');
}

  assertEquals(response.status, 200);
  const result = await response.json();
  assert(result.success);
  
  // Verify log recorded success
  const { data: log } = await supabase.from('webhook_logs').select('status').eq('event_id', eventId).single();
  assertEquals(log.status, 'success');
});
