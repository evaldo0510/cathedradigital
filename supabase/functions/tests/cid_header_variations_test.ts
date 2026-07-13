// Sprint A / CAT-001 — Variações de envio do x-correlation-id
//
// Cobertura solicitada:
//   1. Header AUSENTE            → função gera CID válido
//   2. Header VAZIO ("")         → função IGNORA e gera CID novo
//   3. Header DUPLICADO          → função aceita o primeiro / valor concatenado
//                                  e retorna 1 único header no response
//   4. Header TAMANHO EXTREMO    → aceita ≤128 chars; >128 chars gera novo CID
//
// Em todos os cenários o response DEVE conter x-correlation-id válido e o
// envelope padronizado quando houver erro.
//
// Rodar:
//   deno test -A supabase/functions/tests/cid_header_variations_test.ts

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL =
  Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const ANON =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY");

const skipIfNoEnv = !SUPABASE_URL || !ANON;
const CID_RE = /^[A-Za-z0-9._:-]{1,128}$/;

// Amostra pequena — cobre helpers (bible-*), stubs (colloquium), auditadas (pcl-*)
// e read-only (sitemap/saint-of-the-day). Suficiente para provar consistência.
const TARGETS = [
  "bible-search",
  "bible-abbr-validate",
  "pcl-activate",
  "nexus-relations",
  "mercadopago-webhook",
  "send-notification",
  "sitemap",
  "saint-of-the-day",
  "colloquium",
];

async function callFn(name: string, extraHeaders: HeadersInit, body = "{}") {
  const url = `${SUPABASE_URL}/functions/v1/${name}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ANON}`,
      "apikey": ANON!,
      ...Object.fromEntries(new Headers(extraHeaders)),
    },
    body,
  });
  await res.body?.cancel();
  return res;
}

Deno.test({
  name: "variations: header AUSENTE → gera CID válido",
  ignore: skipIfNoEnv,
  async fn() {
    const failures: string[] = [];
    for (const fn of TARGETS) {
      const res = await callFn(fn, {});
      const cid = res.headers.get("x-correlation-id");
      if (!cid || !CID_RE.test(cid)) failures.push(`${fn} cid="${cid}"`);
    }
    assertEquals(failures.length, 0, failures.join("\n"));
  },
});

Deno.test({
  name: "variations: header VAZIO → ignora e gera CID novo",
  ignore: skipIfNoEnv,
  async fn() {
    const failures: string[] = [];
    for (const fn of TARGETS) {
      const res = await callFn(fn, { "x-correlation-id": "" });
      const cid = res.headers.get("x-correlation-id");
      if (!cid || cid.length === 0 || !CID_RE.test(cid)) {
        failures.push(`${fn} — vazio não substituído: "${cid}"`);
      }
    }
    assertEquals(failures.length, 0, failures.join("\n"));
  },
});

Deno.test({
  name: "variations: header DUPLICADO → response tem 1 único CID válido",
  ignore: skipIfNoEnv,
  async fn() {
    const failures: string[] = [];
    for (const fn of TARGETS) {
      // fetch coalesce duplicados em CSV; validamos que o response tem 1 valor
      const h = new Headers();
      h.append("x-correlation-id", "cid-dup-A");
      h.append("x-correlation-id", "cid-dup-B");
      const res = await callFn(fn, h);
      const cid = res.headers.get("x-correlation-id");
      if (!cid || !CID_RE.test(cid) || cid.includes(",")) {
        failures.push(`${fn} — cid duplicado no response: "${cid}"`);
      }
    }
    assertEquals(failures.length, 0, failures.join("\n"));
  },
});

Deno.test({
  name: "variations: TAMANHO ≤128 é ecoado; >128 é substituído por CID gerado",
  ignore: skipIfNoEnv,
  async fn() {
    const failures: string[] = [];
    const maxOk = "x".repeat(128);
    const tooLong = "y".repeat(200);

    for (const fn of TARGETS) {
      const ok = await callFn(fn, { "x-correlation-id": maxOk });
      const okCid = ok.headers.get("x-correlation-id");
      if (okCid !== maxOk) failures.push(`${fn} — 128 chars não ecoado: got "${okCid?.slice(0,20)}..."`);

      const big = await callFn(fn, { "x-correlation-id": tooLong });
      const bigCid = big.headers.get("x-correlation-id");
      if (!bigCid || bigCid === tooLong || !CID_RE.test(bigCid)) {
        failures.push(`${fn} — >128 não substituído: len=${bigCid?.length}`);
      }
    }
    assertEquals(failures.length, 0, failures.join("\n"));
  },
});
