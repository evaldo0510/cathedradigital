import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { assert, assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

Deno.test("Catechism Read Paragraphs Uniqueness and Concurrency", async () => {
  const testUserId = '00000000-0000-0000-0000-000000000999'
  const paragraph = 12345

  // 1. Cleanup
  await supabase.from('catechism_paragraphs_read').delete().eq('user_id', testUserId).eq('paragraph', paragraph)

  // 2. Test Single Insert
  const { error: err1 } = await supabase.from('catechism_paragraphs_read').insert({
    user_id: testUserId,
    paragraph: paragraph,
    read_at: new Date().toISOString()
  })
  assert(!err1, `Insert failed: ${err1?.message}`)

  // 3. Test Duplicate Insert (should fail)
  const { error: err2 } = await supabase.from('catechism_paragraphs_read').insert({
    user_id: testUserId,
    paragraph: paragraph,
    read_at: new Date().toISOString()
  })
  assert(err2, "Duplicate insert should have failed")
  assertEquals(err2.code, '23505', "Error code should be 23505 (unique violation)")

  // 4. Test Upsert (should succeed and update)
  const newReadAt = new Date().toISOString()
  const { error: err3 } = await supabase.from('catechism_paragraphs_read').upsert({
    user_id: testUserId,
    paragraph: paragraph,
    read_at: newReadAt
  }, { onConflict: 'user_id,paragraph' })
  assert(!err3, `Upsert failed: ${err3?.message}`)

  // 5. Test Concurrency
  const p2 = 12346
  await supabase.from('catechism_paragraphs_read').delete().eq('user_id', testUserId).eq('paragraph', p2)
  
  const promises = []
  for (let i = 0; i < 10; i++) {
    promises.push(
      supabase.from('catechism_paragraphs_read').upsert({
        user_id: testUserId,
        paragraph: p2,
        read_at: new Date().toISOString()
      }, { onConflict: 'user_id,paragraph' })
    )
  }
  
  const results = await Promise.all(promises)
  results.forEach(res => assert(!res.error, `Concurrent upsert failed: ${res.error?.message}`))

  // Final check
  const { data, count } = await supabase
    .from('catechism_paragraphs_read')
    .select('*', { count: 'exact' })
    .eq('user_id', testUserId)
    .eq('paragraph', p2)
  
  assertEquals(count, 1, "Should have exactly 1 record after concurrent upserts")

  // Cleanup
  await supabase.from('catechism_paragraphs_read').delete().eq('user_id', testUserId).eq('paragraph', paragraph)
  await supabase.from('catechism_paragraphs_read').delete().eq('user_id', testUserId).eq('paragraph', p2)
})
