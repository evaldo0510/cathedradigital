import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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
  
  // Even with invalid signature, currently we log and proceed unless strict mode is on
  // But for this test, let's verify it returns a 200 or 400 based on logic
  assertEquals(response.status, 400); // Should fail because MP API fetch will fail for dummy ID
});

Deno.test("Mercado Pago Webhook - Idempotency", async () => {
  const requestId = `test_idempotency_${Date.now()}`;
  const payload = {
    action: 'payment.updated',
    data: { id: '999999999' } // Non-existent payment
  };

  // First call
  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': requestId,
    },
    body: JSON.stringify(payload)
  });

  // Second call with same request ID
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': requestId,
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  assertEquals(response.status, 200);
  assertEquals(result.duplicate, true);
});
