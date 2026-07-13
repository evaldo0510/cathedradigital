// Sprint A / CAT-001 — Smoke test E2E de correlation_id + CORS
//
// Cobertura:
//   1. Preflight OPTIONS expõe x-correlation-id em Allow-Headers e Expose-Headers.
//   2. Com header enviado: x-correlation-id é ECOADO idêntico no response
//      (mesmo em respostas de erro padronizado).
//   3. Sem header enviado: função GERA um x-correlation-id válido e o retorna.
//
// Rodar local:
//   deno test -A supabase/functions/tests/cid_cors_smoke_test.ts
//
// CI: .github/workflows/edge-cid-smoke.yml (fail-on-red).

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL =
  Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const ANON =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY");

const FUNCTIONS = [
  "bible-abbr-validate",
  "bible-alerts-reconcile",
  "bible-auto-warm-slow",
  "bible-availability-report",
  "bible-cache-admin",
  "bible-cache-aggregator",
  "bible-cache-timeseries",
  "bible-canon-diagnose",
  "bible-convert-dump",
  "bible-import-deutero",
  "bible-import-ndjson",
  "bible-integrity-check",
  "bible-latency-regression-alert",
  "bible-perf-render",
  "bible-search",
  "bible-text",
  "catechism-text",
  "colloquium",
  "daily-streak-push",
  "elevenlabs-tts",
  "intelligent-notifications",
  "liturgical-calendar",
  "logos-ai",
  "logos-spiritual-insight",
  "mercado-pago-retry",
  "mercado-pago-webhook",
  "mercadopago-create-preference",
  "mercadopago-simulate",
  "mercadopago-sync-payment",
  "mercadopago-webhook",
  "nexus-relations",
  "pcl-activate",
  "pcl-approve",
  "pcl-expire",
  "pcl-reactivate",
  "pcl-revoke",
  "pcl-suspend",
  "retention-notifications",
  "saint-of-the-day",
  "search-saint",
  "send-notification",
  "send-push",
  "sitemap",
  "spiritual-continuity",
  "telemetry-notifications",
  "translation-lookup",
  "validate-coupon",
  "vatican-document",
];

const skipIfNoEnv = !SUPABASE_URL || !ANON;

// UUID v4 ou strings de teste (aceita ambos)
const CID_RE = /^[A-Za-z0-9._:-]{1,128}$/;

Deno.test({
  name: "smoke: CORS preflight expõe x-correlation-id em todas as funções",
  ignore: skipIfNoEnv,
  async fn() {
    const failures: string[] = [];
    for (const name of FUNCTIONS) {
      const url = `${SUPABASE_URL}/functions/v1/${name}`;
      const res = await fetch(url, {
        method: "OPTIONS",
        headers: {
          "Origin": "https://cathedradigital.lovable.app",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "authorization, x-correlation-id",
        },
      });
      await res.body?.cancel();
      const allow = (res.headers.get("access-control-allow-headers") ?? "").toLowerCase();
      const expose = (res.headers.get("access-control-expose-headers") ?? "").toLowerCase();
      if (!allow.includes("x-correlation-id") || !expose.includes("x-correlation-id")) {
        failures.push(`${name} allow="${allow}" expose="${expose}"`);
      }
    }
    if (failures.length) console.error("Funções sem CORS/CID:\n" + failures.join("\n"));
    assertEquals(failures.length, 0, `${failures.length}/${FUNCTIONS.length} sem CORS/CID`);
  },
});

Deno.test({
  name: "smoke: x-correlation-id enviado é ecoado idêntico no response",
  ignore: skipIfNoEnv,
  async fn() {
    const failures: string[] = [];
    for (const name of FUNCTIONS) {
      const cid = `smoke-${name}-${crypto.randomUUID()}`;
      const url = `${SUPABASE_URL}/functions/v1/${name}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ANON}`,
          "apikey": ANON!,
          "x-correlation-id": cid,
        },
        body: "{}",
      });
      await res.body?.cancel();
      const echoed = res.headers.get("x-correlation-id");
      if (!echoed) {
        failures.push(`${name} status=${res.status} — header ausente`);
      } else if (echoed !== cid) {
        failures.push(`${name} status=${res.status} — cid não ecoado: enviado=${cid} recebido=${echoed}`);
      }
    }
    if (failures.length) console.error("Funções sem eco de CID:\n" + failures.join("\n"));
    assertEquals(failures.length, 0, `${failures.length}/${FUNCTIONS.length} sem eco de CID`);
  },
});

Deno.test({
  name: "smoke: sem x-correlation-id no request, função gera um válido",
  ignore: skipIfNoEnv,
  async fn() {
    const failures: string[] = [];
    for (const name of FUNCTIONS) {
      const url = `${SUPABASE_URL}/functions/v1/${name}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ANON}`,
          "apikey": ANON!,
        },
        body: "{}",
      });
      await res.body?.cancel();
      const generated = res.headers.get("x-correlation-id");
      if (!generated) {
        failures.push(`${name} status=${res.status} — não gerou cid`);
      } else if (!CID_RE.test(generated)) {
        failures.push(`${name} cid gerado inválido: "${generated}"`);
      }
    }
    if (failures.length) console.error("Funções que não geram CID:\n" + failures.join("\n"));
    assertEquals(failures.length, 0, `${failures.length}/${FUNCTIONS.length} sem geração de CID`);
  },
});
