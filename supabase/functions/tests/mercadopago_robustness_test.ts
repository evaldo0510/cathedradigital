import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { assert, assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts"

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.test("Mercado Pago Webhook Robustness & Idempotency E2E", async () => {
  const testUserId = '00000000-0000-0000-0000-000000000001' // Mock user
  const eventId = `test_evt_${Date.now()}`
  
  console.log("1. Simulating a timeout failure to trigger queueing...")
  const response1 = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/mercado-pago-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'x-request-id': eventId,
      'x-simulate-timeout': 'true'
    },
    body: JSON.stringify({
      action: 'payment.created',
      data: { id: 'test_pay_123' },
      simulation: true,
      userId: testUserId
    })
  })
  
  assertEquals(response1.status, 400)
  
  // Verify log is created and status is 'failed' or 'pending'
  const { data: log } = await supabase
    .from('webhook_logs')
    .select('*')
    .eq('event_id', eventId)
    .single()
    
  assert(log, "Log should exist")
  assert(log.status === 'failed', `Status should be failed, got ${log.status}`)
  assert(log.retry_count > 0, "Retry count should be incremented")
  assert(log.next_retry_at !== null, "Next retry at should be set")

  console.log("2. Manually triggering the retry worker...")
  const retryResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/mercado-pago-retry`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    }
  })
  
  assertEquals(retryResponse.status, 200)
  const retryData = await retryResponse.json()
  console.log("Retry worker results:", retryData)
  
  // 3. Verify success and idempotency
  const { data: finalLog } = await supabase
    .from('webhook_logs')
    .select('*')
    .eq('event_id', eventId)
    .single()
    
  assertEquals(finalLog.status, 'success')
  
  // 4. Test Idempotency: Send the same event again
  console.log("3. Sending duplicate event to test idempotency...")
  const responseDup = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/mercado-pago-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'x-request-id': eventId
    },
    body: JSON.stringify({
      action: 'payment.created',
      data: { id: 'test_pay_123' },
      simulation: true,
      userId: testUserId
    })
  })
  
  const dupData = await responseDup.json()
  assert(dupData.duplicate === true, "Should detect duplicate")
})
