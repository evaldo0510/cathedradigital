import { assert, assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'dummy';
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/mercado-pago-webhook`;

const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

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

  await response1.json();
  assertEquals(response1.status, 400);

  // 2. Reprocess (without error header)
  const response2 = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': eventId,
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

  const result2 = await response2.json();
  assertEquals(response2.status, 200);
  assert(result2.success);
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
  const resp1 = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-request-id': eventId, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    body: JSON.stringify(payload)
  });
  await resp1.json();

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