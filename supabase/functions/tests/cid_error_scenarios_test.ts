// Sprint A / CAT-001 — E2E de cenários de erro por categoria
//
// Objetivo: forçar falhas conhecidas em cada categoria de Edge Function e
// confirmar que o header `x-correlation-id` continua presente na resposta,
// mesmo quando o handler devolve 4xx/5xx.
//
// Categorias cobertas:
//   - domain "bible-*"       → payload inválido (400 esperado)
//   - domain "pcl-*"         → payload vazio / não autorizado
//   - domain "mercadopago"   → método errado (405)
//   - domain "notifications" → JSON malformado (400)
//   - domain "misc"          → método errado em GET-only
//
// A cada request enviamos um CID conhecido e verificamos:
//   1. O response tem `x-correlation-id`
//   2. O valor ecoado é idêntico ao enviado (ou, se não enviado, é gerado)
//   3. O status NÃO é 2xx (é uma falha esperada)
//
// Rodar local:
//   deno test -A supabase/functions/tests/cid_error_scenarios_test.ts
//
// CI: .github/workflows/edge-cid-smoke.yml (job `error-scenarios`).

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL =
  Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const ANON =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY");

const skipIfNoEnv = !SUPABASE_URL || !ANON;

type Scenario = {
  category: string;
  fn: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: string;
  contentType?: string;
  echoCid?: boolean; // default true
};

// Uma amostra por categoria — cobre os padrões CID + shadowing local + helpers.
const SCENARIOS: Scenario[] = [
  // bible-* — payload sem campos obrigatórios (validação Zod ou fallback)
  { category: "bible", fn: "bible-search", method: "POST", body: "{}" },
  { category: "bible", fn: "bible-abbr-validate", method: "POST", body: "{}" },
  // pcl-* — POST sem contexto de auth suficiente
  { category: "pcl", fn: "pcl-activate", method: "POST", body: "{}" },
  // mercadopago — método errado
  { category: "mercadopago", fn: "mercadopago-webhook", method: "GET" },
  // notifications — JSON malformado
  {
    category: "notifications",
    fn: "send-notification",
    method: "POST",
    body: "{not-json",
    contentType: "application/json",
  },
  // misc — GET only invocado como POST inválido
  { category: "misc", fn: "sitemap", method: "POST", body: "{}" },
  { category: "misc", fn: "saint-of-the-day", method: "DELETE" },
  // categoria "sem CID header no request" — força geração
  {
    category: "generation",
    fn: "bible-search",
    method: "POST",
    body: "{}",
    echoCid: false,
  },
];

const CID_RE = /^[A-Za-z0-9._:-]{1,128}$/;

Deno.test({
  name: "error-scenarios: CID presente em todas as respostas de erro por categoria",
  ignore: skipIfNoEnv,
  async fn() {
    const failures: string[] = [];
    for (const s of SCENARIOS) {
      const url = `${SUPABASE_URL}/functions/v1/${s.fn}`;
      const cid = `err-${s.category}-${s.fn}-${crypto.randomUUID()}`;
      const echoCid = s.echoCid !== false;
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${ANON}`,
        "apikey": ANON!,
      };
      if (s.contentType) headers["Content-Type"] = s.contentType;
      else if (s.body !== undefined) headers["Content-Type"] = "application/json";
      if (echoCid) headers["x-correlation-id"] = cid;

      const res = await fetch(url, { method: s.method, headers, body: s.body });
      await res.body?.cancel();
      const returned = res.headers.get("x-correlation-id");

      if (res.status >= 200 && res.status < 300) {
        failures.push(`${s.category}/${s.fn} — esperado erro, veio ${res.status}`);
        continue;
      }
      if (!returned) {
        failures.push(`${s.category}/${s.fn} status=${res.status} — sem x-correlation-id no response`);
        continue;
      }
      if (echoCid && returned !== cid) {
        failures.push(`${s.category}/${s.fn} status=${res.status} — cid não ecoado (enviado=${cid} veio=${returned})`);
        continue;
      }
      if (!echoCid && !CID_RE.test(returned)) {
        failures.push(`${s.category}/${s.fn} status=${res.status} — cid gerado inválido: "${returned}"`);
      }
    }
    if (failures.length) console.error("Cenários de erro sem CID:\n" + failures.join("\n"));
    assertEquals(failures.length, 0, `${failures.length}/${SCENARIOS.length} cenários falharam`);
  },
});
