// Sprint A / CAT-002 — Fase A2.b Wave 2
// Valida ErrorEnvelopeSchema.strict() nas funções de diagnóstico/telemetria:
//   cid-trail, cid-compliance-stats, bible-abbr-validate
//
// Contrato validado por cenário de erro:
//   - Status 4xx / 5xx conforme a categoria do erro
//   - Content-Type: application/json
//   - Body EXATAMENTE { error, correlation_id, details? } (strict)
//   - Header x-correlation-id ecoado (byte-idêntico ao enviado)
//   - body.correlation_id === CID enviado
//
// Rodar:
//   deno test -A supabase/functions/tests/cid_strict_wave2_test.ts

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
  path?: string; // query string
  body?: unknown;
  // Se true, NÃO envia Authorization (força 401)
  omitAuth?: boolean;
  expectStatusMin: number;
  expectStatusMax: number;
};

const SCENARIOS: Scenario[] = [
  // cid-trail: método não permitido → 405 method_not_allowed
  {
    name: "cid-trail POST → 405",
    fn: "cid-trail",
    method: "POST",
    body: {},
    expectStatusMin: 405,
    expectStatusMax: 405,
  },
  // cid-trail: query inválida (cid ausente) → 400 invalid_query
  {
    name: "cid-trail sem ?cid → 400",
    fn: "cid-trail",
    method: "GET",
    expectStatusMin: 400,
    expectStatusMax: 400,
  },
  // cid-trail: sem Authorization → 401 unauthorized
  {
    name: "cid-trail sem Authorization → 401",
    fn: "cid-trail",
    method: "GET",
    path: "?cid=probe",
    omitAuth: true,
    expectStatusMin: 401,
    expectStatusMax: 401,
  },
  // cid-compliance-stats: método não permitido → 405
  {
    name: "cid-compliance-stats POST → 405",
    fn: "cid-compliance-stats",
    method: "POST",
    body: {},
    expectStatusMin: 405,
    expectStatusMax: 405,
  },
  // cid-compliance-stats: sem Authorization → 401
  {
    name: "cid-compliance-stats sem Authorization → 401",
    fn: "cid-compliance-stats",
    method: "GET",
    omitAuth: true,
    expectStatusMin: 401,
    expectStatusMax: 401,
  },
  // cid-compliance-stats: days fora do range → 400 invalid_query
  {
    name: "cid-compliance-stats days=999 → 400",
    fn: "cid-compliance-stats",
    method: "GET",
    path: "?days=9999",
    expectStatusMin: 400,
    expectStatusMax: 400,
  },
  // bible-abbr-validate: método não permitido → 405
  {
    name: "bible-abbr-validate DELETE → 405",
    fn: "bible-abbr-validate",
    method: "DELETE",
    expectStatusMin: 405,
    expectStatusMax: 405,
  },
  // bible-abbr-validate: abbrev vazio → 400 invalid_body
  {
    name: "bible-abbr-validate abbrev vazio → 400",
    fn: "bible-abbr-validate",
    method: "POST",
    body: { abbrev: "" },
    expectStatusMin: 400,
    expectStatusMax: 400,
  },
  // bible-abbr-validate: abbrev > 64 chars → 400
  {
    name: "bible-abbr-validate abbrev longa → 400",
    fn: "bible-abbr-validate",
    method: "POST",
    body: { abbrev: "x".repeat(100) },
    expectStatusMin: 400,
    expectStatusMax: 400,
  },
];

Deno.test({
  name: "A2.b Wave 2 — envelope estrito nas funções de diagnóstico/telemetria",
  ignore: skipIfNoEnv,
  async fn() {
    const failures: string[] = [];
    for (const s of SCENARIOS) {
      const cid = `wave2-${s.fn}-${crypto.randomUUID()}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-correlation-id": cid,
      };
      if (!s.omitAuth) {
        headers["Authorization"] = `Bearer ${ANON}`;
        headers["apikey"] = ANON!;
      } else {
        // apikey ainda necessário para atravessar o gateway
        headers["apikey"] = ANON!;
      }
      const url = `${SUPABASE_URL}/functions/v1/${s.fn}${s.path ?? ""}`;
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
    if (failures.length) console.error("Falhas A2.b Wave 2:\n" + failures.join("\n"));
    assertEquals(failures.length, 0, `${failures.length}/${SCENARIOS.length} cenários fora do envelope A2.b Wave 2`);
  },
});
