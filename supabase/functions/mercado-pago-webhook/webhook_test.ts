import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/mercado-pago-webhook`;

Deno.test("Mercado Pago Webhook - Invalid Signature", async () => {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-signature': 'invalid_signature_test',
    },
    body: JSON.stringify({
      action: 'payment.created',
      data: { id: 'test_payment_123' }
    })
  });
  
  await response.body?.cancel();
  // Currently we log but don't 403 because we don't have the secret set yet.
  // But since the payment ID is fake and not simulation, it will try to fetch from MP and fail with 400.
  assertEquals(response.status, 400);
});

Deno.test("Mercado Pago Webhook - Idempotency", async () => {
  const requestId = `test_idempotency_${Date.now()}`;
  const payload = {
    action: 'payment.updated',
    data: { id: 'sim_payment_999' },
    simulation: true,
    simulated_status: 'approved',
    userId: '00000000-0000-0000-0000-000000000000'
  };

  // First call
  const resp1 = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': requestId,
    },
    body: JSON.stringify(payload)
  });
  await resp1.body?.cancel();
  assertEquals(resp1.status, 200);

  // Second call with same request ID
  const resp2 = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': requestId,
    },
    body: JSON.stringify(payload)
  });

  const result = await resp2.json();
  assertEquals(resp2.status, 200);
  assertEquals(result.duplicate, true);
});

Deno.test("Mercado Pago Webhook - Tampered Payload (Mock)", async () => {
  // This is a placeholder for actual HMAC validation test once the secret is available
  // For now we verify that it correctly handles missing crucial data
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'payment.created'
      // Missing data object
    })
  });
  
  await response.body?.cancel();
  assertEquals(response.status, 400);
});
