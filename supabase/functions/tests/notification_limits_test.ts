import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.test("Notification functions return 413 for large payloads", async () => {
  const largePayload = "a".repeat(11000); // Exceeds 10KB limit
  
  const functions = ["send-notification", "send-push"];
  
  for (const func of functions) {
    console.log(`Testing ${func} for payload limit...`);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${func}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Length": largePayload.length.toString(),
      },
      body: JSON.stringify({ data: largePayload }),
    });
    
    assertEquals(response.status, 413, `${func} should return 413 for large payload`);
  }
});

Deno.test("Intelligent notifications return 413 for large payloads", async () => {
  const largePayload = "a".repeat(3000); // Exceeds 2KB limit
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/intelligent-notifications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Length": largePayload.length.toString(),
    },
    body: JSON.stringify({ data: largePayload }),
  });
  
  assertEquals(response.status, 413, "intelligent-notifications should return 413 for large payload");
});
