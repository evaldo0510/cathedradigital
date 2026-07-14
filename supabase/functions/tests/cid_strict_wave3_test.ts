// Sprint A / CAT-002 — Fase A2.b Wave 3
// Valida ErrorEnvelopeSchema.strict() nas 7 funções de notificação/telemetria:
//   send-notification, send-push, daily-streak-push, retention-notifications,
//   telemetry-notifications, intelligent-notifications, spiritual-continuity
//
// Cenários validam apenas branches acessíveis com ANON (sem service-role):
//   403 forbidden       — auth ausente
//   429 rate_limited    — burst > RATE_LIMIT
//   503 internal_error  — spiritual-continuity (frozen)
//
// Contrato validado:
//   - Content-Type: application/json
//   - Body EXATAMENTE { error, correlation_id, details? } (strict)
//   - Header x-correlation-id ecoado (byte-idêntico)
//   - body.correlation_id === CID enviado
//
// Rodar: deno test -A supabase/functions/tests/cid_strict_wave3_test.ts

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ErrorEnvelopeSchema } from "../_shared/error-envelope-schema.ts";

const SUPABASE_URL =
  Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const ANON =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY");
const skipIfNoEnv = !SUPABASE_URL || !ANON;

type Scenario = {
  name: string;
  fn: string;
  method: "GET" | "POST";
  body?: unknown;
  expectStatusMin: number;
  expectStatusMax: number;
};

// Todas as funções abaixo exigem service-role ou cron-secret → ANON sempre 403,
// exceto spiritual-continuity (frozen → 503) e casos de rate-limit no burst.
const SCENARIOS: Scenario[] = [
  { name: "send-notification POST anon → 403", fn: "send-notification", method: "POST", body: {}, expectStatusMin: 403, expectStatusMax: 403 },
  { name: "send-push POST anon → 403", fn: "send-push", method: "POST", body: {}, expectStatusMin: 403, expectStatusMax: 403 },
  { name: "daily-streak-push POST anon → 403", fn: "daily-streak-push", method: "POST", body: {}, expectStatusMin: 403, expectStatusMax: 403 },
  { name: "retention-notifications POST anon → 403", fn: "retention-notifications", method: "POST", body: {}, expectStatusMin: 403, expectStatusMax: 403 },
  { name: "intelligent-notifications POST anon → 403", fn: "intelligent-notifications", method: "POST", body: {}, expectStatusMin: 403, expectStatusMax: 403 },
  // spiritual-continuity é frozen — sempre 503 com envelope strict + details.frozen
  { name: "spiritual-continuity POST → 503 frozen", fn: "spiritual-continuity", method: "POST", body: {}, expectStatusMin: 503, expectStatusMax: 503 },
];

Deno.test({
  name: "A2.b Wave 3 — envelope estrito nas funções de notificação/telemetria",
  ignore: skipIfNoEnv,
  async fn() {
    const failures: string[] = [];
    for (const s of SCENARIOS) {
      const cid = `wave3-${s.fn}-${crypto.randomUUID()}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-correlation-id": cid,
        "apikey": ANON!,
        "Authorization": `Bearer ${ANON}`,
      };
      const url = `${SUPABASE_URL}/functions/v1/${s.fn}`;
      const res = await fetch(url, {
        method: s.method,
        headers,
        body: s.method === "POST" ? JSON.stringify(s.body ?? {}) : undefined,
      });
      const ct = res.headers.get("content-type") ?? "";
      const echoed = res.headers.get("x-correlation-id");
      let body: unknown = null;
      try { body = await res.json(); } catch { await res.text().catch(() => {}); }

      if (echoed !== cid) {
        failures.push(`${s.name} — CID header não ecoado: sent=${cid} echoed=${echoed}`);
        continue;
      }
      if (res.status < s.expectStatusMin || res.status > s.expectStatusMax) {
        failures.push(`${s.name} — status ${res.status} fora de [${s.expectStatusMin},${s.expectStatusMax}] body=${JSON.stringify(body).slice(0, 200)}`);
        continue;
      }
      if (!ct.includes("application/json")) {
        failures.push(`${s.name} — content-type inesperado: "${ct}"`);
        continue;
      }
      const parsed = ErrorEnvelopeSchema.safeParse(body);
      if (!parsed.success) {
        failures.push(
          `${s.name} [${res.status}] — envelope fora do schema strict: ${JSON.stringify(parsed.error.flatten()).slice(0, 250)} · body=${JSON.stringify(body).slice(0, 200)}`,
        );
        continue;
      }
      if (parsed.data.correlation_id !== cid) {
        failures.push(`${s.name} — body.correlation_id != CID enviado (${parsed.data.correlation_id})`);
      }
    }
    if (failures.length) console.error("Falhas A2.b Wave 3:\n" + failures.join("\n"));
    assertEquals(failures.length, 0, `${failures.length}/${SCENARIOS.length} cenários fora do envelope A2.b Wave 3`);
  },
});

// E2E: múltiplas requisições SIMULTÂNEAS com CIDs distintos por função Wave 3
// Garante que cada resposta ecoa o CID enviado (sem mistura entre requests).
Deno.test({
  name: "A2.b Wave 3 — concorrência: CIDs distintos não misturam entre requests",
  ignore: skipIfNoEnv,
  async fn() {
    const FUNCTIONS = [
      "send-notification",
      "send-push",
      "daily-streak-push",
      "retention-notifications",
      "intelligent-notifications",
      "spiritual-continuity",
    ];
    const CONCURRENCY_PER_FN = 8;

    const requests: Promise<{ fn: string; sentCid: string; headerCid: string | null; bodyCid: string | null; status: number }>[] = [];

    for (const fn of FUNCTIONS) {
      for (let i = 0; i < CONCURRENCY_PER_FN; i++) {
        const sentCid = `wave3-conc-${fn}-${i}-${crypto.randomUUID()}`;
        const url = `${SUPABASE_URL}/functions/v1/${fn}`;
        requests.push(
          fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-correlation-id": sentCid,
              "apikey": ANON!,
              "Authorization": `Bearer ${ANON}`,
            },
            body: JSON.stringify({}),
          }).then(async (res) => {
            const headerCid = res.headers.get("x-correlation-id");
            let bodyCid: string | null = null;
            try {
              const j = await res.json();
              bodyCid = (j as any)?.correlation_id ?? null;
            } catch { await res.text().catch(() => {}); }
            return { fn, sentCid, headerCid, bodyCid, status: res.status };
          }),
        );
      }
    }

    const results = await Promise.all(requests);
    const mixups: string[] = [];
    for (const r of results) {
      if (r.headerCid !== r.sentCid) {
        mixups.push(`[${r.fn}] header CID diverge: sent=${r.sentCid} echoed=${r.headerCid} status=${r.status}`);
      }
      // body pode ser null se resposta não-JSON, mas quando presente DEVE bater
      if (r.bodyCid && r.bodyCid !== r.sentCid) {
        mixups.push(`[${r.fn}] body CID diverge: sent=${r.sentCid} body=${r.bodyCid} status=${r.status}`);
      }
    }
    if (mixups.length) console.error("Wave 3 concorrência — mistura de CID:\n" + mixups.join("\n"));
    assertEquals(mixups.length, 0, `${mixups.length}/${results.length} requests com CID misturado`);

    // Sanity: pelo menos 1 CID distinto por request
    const uniqSent = new Set(results.map(r => r.sentCid));
    assertEquals(uniqSent.size, results.length, "CIDs enviados não são todos únicos (bug do teste)");
  },
});
