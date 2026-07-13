// Sprint A / CAT-002 — Fase A2 (Zod): envelope de erro STRICT nas
// funções auditadas (pcl-* + nexus-relations).
//
// Contrato validado (via ErrorEnvelopeSchema.strict()):
//   - Payload inválido → status 4xx
//   - Content-Type: application/json
//   - Body EXATAMENTE { error, correlation_id, details? } — nenhum campo extra
//   - `error` é string não-vazia
//   - `correlation_id` == CID enviado (byte-idêntico)
//   - Header x-correlation-id ecoado
//
// Rodar:
//   deno test -A supabase/functions/tests/cid_zod_envelope_test.ts

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ErrorEnvelopeSchema } from "../_shared/error-envelope-schema.ts";

const SUPABASE_URL =
  Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const ANON =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY");
const skipIfNoEnv = !SUPABASE_URL || !ANON;

const AUDITED = [
  "pcl-activate",
  "pcl-approve",
  "pcl-expire",
  "pcl-reactivate",
  "pcl-revoke",
  "pcl-suspend",
  "nexus-relations",
];

Deno.test({
  name: "A2/Zod strict: funções auditadas retornam envelope canônico { error, correlation_id }",
  ignore: skipIfNoEnv,
  async fn() {
    const failures: string[] = [];
    for (const fn of AUDITED) {
      const cid = `zod-strict-${fn}-${crypto.randomUUID()}`;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ANON}`,
          "apikey": ANON!,
          "x-correlation-id": cid,
        },
        body: JSON.stringify({ invalid_field: true }),
      });
      const ct = res.headers.get("content-type") ?? "";
      const echoed = res.headers.get("x-correlation-id");
      let body: unknown = null;
      try { body = await res.json(); } catch { /* ignore */ }

      if (res.status >= 200 && res.status < 300) {
        failures.push(`${fn} — esperado 4xx, veio ${res.status}`); continue;
      }
      if (!ct.includes("application/json")) {
        failures.push(`${fn} — content-type inesperado: "${ct}"`); continue;
      }
      if (echoed !== cid) {
        failures.push(`${fn} — CID header não ecoado: sent=${cid} echoed=${echoed}`); continue;
      }
      const parsed = ErrorEnvelopeSchema.safeParse(body);
      if (!parsed.success) {
        failures.push(`${fn} — envelope fora do schema strict: ${JSON.stringify(parsed.error.flatten()).slice(0, 200)}`);
        continue;
      }
      if (parsed.data.correlation_id !== cid) {
        failures.push(`${fn} — body.correlation_id != CID enviado (${parsed.data.correlation_id})`);
      }
    }
    if (failures.length) console.error("Falhas A2/Zod strict:\n" + failures.join("\n"));
    assertEquals(failures.length, 0, `${failures.length}/${AUDITED.length} funções fora do envelope A2 strict`);
  },
});
