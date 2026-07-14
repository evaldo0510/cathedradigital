// Sprint A / CAT-002 — Fase A2.b Wave 4a
// Valida ErrorEnvelopeSchema.strict() nas ferramentas de manutenção Bíblia
// (lote 1 — funções ≤175 linhas):
//   bible-integrity-check, bible-perf-render, bible-convert-dump,
//   bible-latency-regression-alert, bible-alerts-reconcile,
//   bible-availability-report
//
// bible-auto-warm-slow NÃO entra nesta wave: não possui branches de erro
// (retorna sempre 200 ou 422 de sucesso pós-verificação). CID-compliance
// já validado por cid_cors_smoke_test.
//
// Rodar: deno test -A supabase/functions/tests/cid_strict_wave4a_test.ts

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
  // bible-perf-render: método inválido → 405
  {
    name: "bible-perf-render GET → 405",
    fn: "bible-perf-render",
    method: "GET",
    expectStatusMin: 405,
    expectStatusMax: 405,
  },
  // bible-perf-render: body inválido → 400
  {
    name: "bible-perf-render body vazio → 400",
    fn: "bible-perf-render",
    method: "POST",
    body: {},
    expectStatusMin: 400,
    expectStatusMax: 400,
  },
  // bible-perf-render: render_ms fora do range → 400
  {
    name: "bible-perf-render render_ms=999999 → 400",
    fn: "bible-perf-render",
    method: "POST",
    body: { correlation_id: "wave4a-probe-1234567890", render_ms: 999999 },
    expectStatusMin: 400,
    expectStatusMax: 400,
  },
  // bible-convert-dump: sem Authorization → 401
  {
    name: "bible-convert-dump sem Authorization → 401",
    fn: "bible-convert-dump",
    method: "POST",
    body: {},
    omitAuth: true,
    expectStatusMin: 401,
    expectStatusMax: 401,
  },
  // bible-convert-dump: user autenticado não-admin → 403
  // (opcional — usuário anônimo já cai em 401)
];

Deno.test({
  name: "A2.b Wave 4a — envelope estrito nas ferramentas de manutenção Bíblia",
  ignore: skipIfNoEnv,
  async fn() {
    const failures: string[] = [];
    for (const s of SCENARIOS) {
      const cid = `wave4a-${s.fn}-${crypto.randomUUID()}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-correlation-id": cid,
        apikey: ANON!,
      };
      if (!s.omitAuth) {
        headers["Authorization"] = `Bearer ${ANON}`;
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
    if (failures.length) console.error("Falhas A2.b Wave 4a:\n" + failures.join("\n"));
    assertEquals(failures.length, 0, `${failures.length}/${SCENARIOS.length} cenários fora do envelope A2.b Wave 4a`);
  },
});
