// Sprint A / CAT-002 — Fase A2.b Wave 4b
// Valida ErrorEnvelopeSchema.strict() nas ferramentas de manutenção Bíblia
// (lote 2 — funções ≥220 linhas):
//   bible-cache-admin, bible-cache-aggregator, bible-cache-timeseries,
//   bible-canon-diagnose, bible-import-ndjson
//
// bible-import-deutero NÃO entra nesta wave: possui apenas caminho de
// sucesso/verify (200 ou 422 pós-verificação), sem branch dedicado de erro.
// CID-compliance já validado por cid_cors_smoke_test.
//
// Rodar: deno test -A supabase/functions/tests/cid_strict_wave4b_test.ts

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
  method: "GET" | "POST" | "DELETE";
  path?: string;
  body?: unknown;
  omitAuth?: boolean;
  expectStatusMin: number;
  expectStatusMax: number;
};

const SCENARIOS: Scenario[] = [
  // bible-cache-admin: sem Authorization → 401 unauthorized
  {
    name: "bible-cache-admin sem Authorization → 401",
    fn: "bible-cache-admin",
    method: "POST",
    body: { action: "stats" },
    omitAuth: true,
    expectStatusMin: 401,
    expectStatusMax: 401,
  },
  // bible-cache-timeseries: sem Authorization → 401
  {
    name: "bible-cache-timeseries sem Authorization → 401",
    fn: "bible-cache-timeseries",
    method: "POST",
    body: { action: "series" },
    omitAuth: true,
    expectStatusMin: 401,
    expectStatusMax: 401,
  },
  // bible-canon-diagnose: sem Authorization e sem x-cron-secret → 401
  {
    name: "bible-canon-diagnose sem Authorization → 401",
    fn: "bible-canon-diagnose",
    method: "POST",
    body: { action: "list_runs" },
    omitAuth: true,
    expectStatusMin: 401,
    expectStatusMax: 401,
  },
  // bible-import-ndjson: sem Authorization → 401
  {
    name: "bible-import-ndjson sem Authorization → 401",
    fn: "bible-import-ndjson",
    method: "POST",
    body: {},
    omitAuth: true,
    expectStatusMin: 401,
    expectStatusMax: 401,
  },
  // bible-cache-aggregator: sucesso normal (200) — só valida CID no header,
  // não entra no envelope test. Fora do array de erro.
];

Deno.test({
  name: "A2.b Wave 4b — envelope estrito nas ferramentas de manutenção Bíblia (lote 2)",
  ignore: skipIfNoEnv,
  async fn() {
    const failures: string[] = [];
    for (const s of SCENARIOS) {
      const cid = `wave4b-${s.fn}-${crypto.randomUUID()}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-correlation-id": cid,
        apikey: ANON!,
      };
      if (!s.omitAuth) headers["Authorization"] = `Bearer ${ANON}`;
      const url = `${SUPABASE_URL}/functions/v1/${s.fn}${s.path ?? ""}`;
      const res = await fetch(url, {
        method: s.method,
        headers,
        body: s.method !== "GET" ? JSON.stringify(s.body ?? {}) : undefined,
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
        failures.push(`${s.name} — status ${res.status} fora de [${s.expectStatusMin},${s.expectStatusMax}]`);
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
    if (failures.length) console.error("Falhas A2.b Wave 4b:\n" + failures.join("\n"));
    assertEquals(failures.length, 0, `${failures.length}/${SCENARIOS.length} cenários fora do envelope A2.b Wave 4b`);
  },
});
