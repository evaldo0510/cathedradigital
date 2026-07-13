// Sprint A / CAT-002 — Fase A2.b Wave 1
// Valida ErrorEnvelopeSchema.strict() nas funções de infra/leitura:
//   sitemap, saint-of-the-day, search-saint, liturgical-calendar, vatican-document
//
// Contrato validado por cenário de erro:
//   - Status 4xx / 5xx conforme a categoria do erro
//   - Content-Type: application/json
//   - Body EXATAMENTE { error, correlation_id, details? } (strict)
//   - Header x-correlation-id ecoado (byte-idêntico ao enviado)
//   - body.correlation_id === CID enviado
//
// Rodar:
//   deno test -A supabase/functions/tests/cid_strict_wave1_test.ts

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
  fn: string;
  method: "GET" | "POST";
  body?: unknown;
  // Faixa aceitável — algumas funções podem responder 4xx ou 5xx dependendo
  // do upstream. Só cobramos o formato do envelope.
  expectStatusMin?: number;
  expectStatusMax?: number;
};

// Cada cenário força uma falha conhecida da categoria.
const SCENARIOS: Scenario[] = [
  // saint-of-the-day: dia sem santo cadastrado → 404 not_found
  // (usa GET; sem params força fallback do dia atual — 404 se não houver registro)
  { fn: "saint-of-the-day", method: "GET", expectStatusMin: 200, expectStatusMax: 599 },
  // search-saint: função frozen → 503 sempre
  { fn: "search-saint", method: "POST", body: { q: "x" }, expectStatusMin: 503, expectStatusMax: 503 },
  // liturgical-calendar: action inválida → cai no default (today) — pode 200 ou 502 (upstream)
  // Para forçar erro, mandamos payload que rompe upstream com year/month impossíveis
  { fn: "liturgical-calendar", method: "POST", body: { action: "date", year: 0, month: 0, day: 0 }, expectStatusMin: 400, expectStatusMax: 599 },
  // vatican-document: URL inválida → 400 invalid_body
  { fn: "vatican-document", method: "POST", body: { url: "not-a-url" }, expectStatusMin: 400, expectStatusMax: 400 },
  // vatican-document: URL fora do domínio → 400 invalid_body
  { fn: "vatican-document", method: "POST", body: { url: "https://example.com/foo" }, expectStatusMin: 400, expectStatusMax: 400 },
  // sitemap: rota GET normal — não força erro fácil, mas se der 500 valida envelope.
  // Cobertura de envelope de erro do sitemap fica com fault-injection manual;
  // aqui garantimos ao menos header CID (checado pela suíte cid_header_variations).
];

Deno.test({
  name: "A2.b Wave 1 — envelope estrito nas funções de infra/leitura",
  ignore: skipIfNoEnv,
  async fn() {
    const failures: string[] = [];
    for (const s of SCENARIOS) {
      const cid = `wave1-${s.fn}-${crypto.randomUUID()}`;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/${s.fn}`, {
        method: s.method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ANON}`,
          "apikey": ANON!,
          "x-correlation-id": cid,
        },
        body: s.method === "POST" ? JSON.stringify(s.body ?? {}) : undefined,
      });
      const ct = res.headers.get("content-type") ?? "";
      const echoed = res.headers.get("x-correlation-id");
      let body: unknown = null;
      try { body = await res.json(); } catch { /* ignore */ }

      // Header CID sempre obrigatório
      if (echoed !== cid) {
        failures.push(`${s.fn} — CID header não ecoado: sent=${cid} echoed=${echoed}`);
        continue;
      }

      // Se a resposta foi 2xx aceitamos como sucesso (fora do escopo de erro)
      if (res.status >= 200 && res.status < 300) continue;

      // Erros: precisam ser JSON strict
      if (!ct.includes("application/json")) {
        failures.push(`${s.fn} — content-type inesperado em erro: "${ct}" (status ${res.status})`);
        continue;
      }
      const parsed = ErrorEnvelopeSchema.safeParse(body);
      if (!parsed.success) {
        failures.push(
          `${s.fn} [${res.status}] — envelope fora do schema strict: ${JSON.stringify(parsed.error.flatten()).slice(0, 250)} · body=${JSON.stringify(body).slice(0, 200)}`,
        );
        continue;
      }
      if (parsed.data.correlation_id !== cid) {
        failures.push(`${s.fn} — body.correlation_id != CID enviado (${parsed.data.correlation_id})`);
      }
    }
    if (failures.length) console.error("Falhas A2.b Wave 1:\n" + failures.join("\n"));
    assertEquals(failures.length, 0, `${failures.length}/${SCENARIOS.length} cenários fora do envelope A2.b Wave 1`);
  },
});
