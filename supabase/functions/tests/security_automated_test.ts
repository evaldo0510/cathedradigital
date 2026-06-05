import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

Deno.test("Security: mercadopago-simulate should reject non-admin users", async () => {
  const supabase = createClient(SUPABASE_URL, ANON_KEY);
  
  // Call without auth
  const { data, error } = await supabase.functions.invoke('mercadopago-simulate', {
    body: { planId: 'pro', status: 'approved' }
  });
  
  // It should return 401 or 403. Supabase client might handle this as an error.
  if (error) {
     assertEquals(error.status, 401);
  } else {
    // If it didn't error, check the response body
    assertEquals(data.error, 'Unauthorized');
  }
});

Deno.test("Security: mercado-pago-webhook should reject invalid signatures", async () => {
  const supabase = createClient(SUPABASE_URL, ANON_KEY);
  
  const { data, error } = await supabase.functions.invoke('mercado-pago-webhook', {
    body: { action: 'payment.created', data: { id: '123' } },
    headers: { 'x-signature': 'invalid' }
  });
  
  if (error) {
    assertEquals(error.status, 401);
  } else {
    assertEquals(data.error, 'Missing signature'); // Or 'Invalid signature' if part-parsing fails
  }
});

Deno.test("Security: mercado-pago-retry should reject anon calls", async () => {
  const supabase = createClient(SUPABASE_URL, ANON_KEY);
  
  const { data, error } = await supabase.functions.invoke('mercado-pago-retry', {
    body: {}
  });
  
  if (error) {
    assertEquals(error.status, 401);
  } else {
    assertEquals(data.error, 'Unauthorized');
  }
});

Deno.test("Security: RLS on security_audit_logs", async () => {
  const supabase = createClient(SUPABASE_URL, ANON_KEY);
  
  const { data, error } = await supabase.from('security_audit_logs').select('*');
  
  // Should be empty or return an error if RLS is strict (it usually just returns empty)
  assertEquals(data?.length || 0, 0);
});
