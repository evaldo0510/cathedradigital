// Sprint A / CAT-001 — E2E de concorrência
// Dispara N requests SIMULTÂNEAS com CIDs distintos e valida:
//   1) Cada resposta ecoa exatamente o CID enviado (sem mistura)
//   2) Body.correlation_id (quando presente) == CID enviado
//   3) Nenhum CID é reaproveitado em resposta errada
//
// Alvos: uma função barata e determinística por categoria.
//   - bible-abbr-validate (bible / cache)
//   - sitemap (content)
//   - nexus-relations (auditada)
//
// Rodar:
//   deno test -A supabase/functions/tests/cid_concurrency_test.ts

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL =
  Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const ANON =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY");
const skipIfNoEnv = !SUPABASE_URL || !ANON;

const CONCURRENCY = 30;

async function fireOne(fn: string, cid: string, body?: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ANON}`,
      "apikey": ANON!,
      "x-correlation-id": cid,
    },
    body: JSON.stringify(body ?? {}),
  });
  const echoed = res.headers.get("x-correlation-id");
  let bodyJson: any = null;
  try { bodyJson = await res.json(); } catch { /* not-json ok */ }
  return { cid, echoed, bodyCid: bodyJson?.correlation_id ?? null, status: res.status };
}

async function runBattery(fn: string, body?: unknown) {
  const cids = Array.from({ length: CONCURRENCY }, (_, i) =>
    `conc-${fn}-${i}-${crypto.randomUUID()}`
  );
  const results = await Promise.all(cids.map((c) => fireOne(fn, c, body)));
  const failures: string[] = [];
  const seenEcho = new Set<string>();
  for (const r of results) {
    if (r.echoed !== r.cid) {
      failures.push(`[${fn}] header eco divergente: sent=${r.cid} echoed=${r.echoed}`);
    }
    if (r.bodyCid !== null && r.bodyCid !== r.cid) {
      failures.push(`[${fn}] body.correlation_id divergente: sent=${r.cid} body=${r.bodyCid}`);
    }
    if (r.echoed && seenEcho.has(r.echoed)) {
      failures.push(`[${fn}] CID ecoado duplicado (mistura!): ${r.echoed}`);
    }
    if (r.echoed) seenEcho.add(r.echoed);
  }
  return failures;
}

Deno.test({
  name: `CID concurrency: ${CONCURRENCY} requests simultâneas sem mistura`,
  ignore: skipIfNoEnv,
  async fn() {
    const all: string[] = [];
    all.push(...await runBattery("bible-abbr-validate", { abbrev: "gn" }));
    all.push(...await runBattery("sitemap"));
    all.push(...await runBattery("nexus-relations", { invalid: true }));
    if (all.length) console.error("Falhas de concorrência:\n" + all.join("\n"));
    assertEquals(all.length, 0, `${all.length} violações de CID em concorrência`);
  },
});
