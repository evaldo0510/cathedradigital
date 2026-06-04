import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { assert, assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || 'mock-key';
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/mercado-pago-webhook`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TEST_USER_ID = '00000000-0000-0000-0000-000000000000'; // Replace with a valid test user if needed

Deno.test("Mercado Pago Webhook Robustness - Normal Success", async () => {
  const eventId = `test_success_${Date.now()}`;
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': eventId,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      action: 'payment.updated',
      data: { id: 'test_payment_123' },
      userId: TEST_USER_ID,
      simulation: true,
      simulated_status: 'approved'
    })
  });

  const result = await response.json();
  assertEquals(response.status, 200);
  assert(result.success);

  // Verify log exists and is success
  const { data: log } = await supabase
    .from('webhook_logs')
    .select('*')
    .eq('event_id', eventId)
    .single();
  
  assertEquals(log?.status, 'success');
});

Deno.test("Mercado Pago Webhook Robustness - Simulate DB Error & Reprocess", async () => {
  const eventId = `test_db_error_${Date.now()}`;
  
  // 1. Send with DB Error simulation
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
      data: { id: 'test_payment_db_err' },
      userId: TEST_USER_ID,
      simulation: true
    })
  });

  assertEquals(response1.status, 400);

  // 2. Verify log is 'failed'
  const { data: log1 } = await supabase
    .from('webhook_logs')
    .select('*')
    .eq('event_id', eventId)
    .single();
  
  assertEquals(log1?.status, 'failed');

  // 3. Reprocess (without error header)
  const response2 = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': eventId, // Same ID to test idempotency/re-entry
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      action: 'payment.updated',
      data: { id: 'test_payment_db_err' },
      userId: TEST_USER_ID,
      simulation: true,
      simulated_status: 'approved'
    })
  });

  assertEquals(response2.status, 200);
  
  // 4. Verify log is now success (or a new log is success with same eventId)
  // Our current implementation creates a NEW log for each request.
  // But idempotency check should skip processing if a SUCCESS log exists.
  // Since the first one failed, the second one should proceed and succeed.
  const { data: logs } = await supabase
    .from('webhook_logs')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  
  assert(logs?.some(l => l.status === 'success'));
});

Deno.test("Mercado Pago Webhook Robustness - Duplicate Event (Idempotency)", async () => {
  const eventId = `test_dup_${Date.now()}`;
  
  const payload = {
    action: 'payment.updated',
    data: { id: 'test_payment_dup' },
    userId: TEST_USER_ID,
    simulation: true,
    simulated_status: 'approved'
  };

  // 1. First request
  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-request-id': eventId, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    body: JSON.stringify(payload)
  });

  // 2. Second request (duplicate)
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-request-id': eventId, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  assertEquals(response.status, 200);
  assert(result.duplicate);
});
