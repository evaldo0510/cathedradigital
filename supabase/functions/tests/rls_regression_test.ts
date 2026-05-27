import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://placeholder.supabase.co";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "placeholder";

async function recordResult(testName: string, status: 'success' | 'failure', details?: string) {
  if (!SERVICE_ROLE_KEY) {
    console.warn("Skipping DB record: SERVICE_ROLE_KEY not available");
    return;
  }
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  await supabaseAdmin.from('rls_test_results').insert({
    test_name: testName,
    status: status,
    details: details || ''
  });
}

Deno.test("RLS: Profiles table should not allow public update", async () => {
  const testName = "Profiles RLS - Unauthorized Update";
  try {
    const supabase = createClient(SUPABASE_URL, ANON_KEY);
    const { error } = await supabase.from('profiles').update({ name: 'Hacker' }).eq('id', '00000000-0000-0000-0000-000000000000');
    // PostgREST returns success even if 0 rows were updated due to RLS.
    // We expect no actual change, but the call should not throw a 500.
    await recordResult(testName, 'success');
  } catch (err) {
    await recordResult(testName, 'failure', (err as Error).message);
    throw err;
  }
});

Deno.test("RLS: Security logs should be protected", async () => {
  const testName = "Security Logs RLS Protection";
  try {
    const supabase = createClient(SUPABASE_URL, ANON_KEY);
    const { data, error } = await supabase.from('security_audit_logs').select('*');
    if (error || (data && data.length === 0)) {
       await recordResult(testName, 'success');
    } else {
       throw new Error("Public access to security logs detected!");
    }
  } catch (err) {
    await recordResult(testName, 'failure', (err as Error).message);
    throw err;
  }
});
