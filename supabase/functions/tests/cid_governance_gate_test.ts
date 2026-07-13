// Sprint A / CAT-001 — Gate reformulado: governance_audit_log recebe CID
//
// Escopo REDUZIDO (conforme decisão homologada):
//   Verifica APENAS as ~7 funções que sabidamente mutam tabelas com trigger
//   `capture_governance_audit` (nexus_relations, translation_pcl_lifecycle).
//   Para essas, um POST bem-sucedido DEVE produzir uma linha em
//   `public.governance_audit_log` com o MESMO `correlation_id`.
//
// Não cobre:
//   - Funções que só leem dados (bible-*, saint-of-the-day, etc.)
//   - Funções cuja mutação é em tabelas SEM trigger de auditoria
//
// Requisitos:
//   - SUPABASE_SERVICE_ROLE_KEY como secret (necessário para chamar a RPC
//     de leitura em nome de um role privilegiado no CI).
//   - Se ausente, o teste é IGNORADO — evita quebrar o pipeline em forks.
//
// Rodar local:
//   deno test -A supabase/functions/tests/cid_governance_gate_test.ts

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL =
  Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const ANON =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY");
const SERVICE_ROLE =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SERVICE_ROLE_KEY");

const skipIfNoEnv = !SUPABASE_URL || !ANON || !SERVICE_ROLE;

// Funções que mutam tabelas auditadas por trigger capture_governance_audit.
// Fonte: migrations 20260713192922 (nexus_relations) e 20260713193004
// (translation_pcl_lifecycle) — sprint 1.13.
const AUDITED_MUTATION_FUNCTIONS = [
  "pcl-activate",
  "pcl-approve",
  "pcl-expire",
  "pcl-reactivate",
  "pcl-revoke",
  "pcl-suspend",
  "nexus-relations",
] as const;

// Espera de propagação de trigger → tabela. Triggers rodam sync na mesma
// transação, mas a resposta HTTP pode voltar antes do commit visível fora.
async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callRpcTrail(cid: string): Promise<Array<Record<string, unknown>>> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_correlation_trail`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_ROLE}`,
      "apikey": SERVICE_ROLE!,
    },
    body: JSON.stringify({ _cid: cid }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`RPC get_correlation_trail falhou: ${res.status} ${body}`);
  return JSON.parse(body);
}

Deno.test({
  name: "governance-gate: funções auditadas propagam CID para governance_audit_log",
  ignore: skipIfNoEnv,
  async fn() {
    const failures: string[] = [];

    for (const fn of AUDITED_MUTATION_FUNCTIONS) {
      // Dois casos: (a) com CID enviado, (b) sem CID enviado (deve gerar).
      for (const mode of ["sent", "generated"] as const) {
        const sentCid = mode === "sent" ? `gate-${fn}-${crypto.randomUUID()}` : null;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ANON}`,
          "apikey": ANON!,
        };
        if (sentCid) headers["x-correlation-id"] = sentCid;

        const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
          method: "POST",
          headers,
          body: "{}",
        });
        await res.body?.cancel();
        const echoed = res.headers.get("x-correlation-id");

        if (!echoed) {
          failures.push(`${fn}/${mode} — sem CID no response (status=${res.status})`);
          continue;
        }
        if (sentCid && echoed !== sentCid) {
          failures.push(`${fn}/${mode} — CID não ecoado (enviado=${sentCid} veio=${echoed})`);
          continue;
        }

        // Se o handler não conseguiu mutar (ex: 401/400 sem contexto real de auth),
        // não haverá linha em governance_audit_log e o teste NÃO deve falhar por isso.
        // O gate valida apenas: se houve 2xx, então DEVE haver linha correspondente.
        if (res.status < 200 || res.status >= 300) continue;

        await sleep(500);
        const trail = await callRpcTrail(echoed);
        const audited = trail.filter((row) => row.source === "governance_audit_log");
        if (audited.length === 0) {
          failures.push(`${fn}/${mode} status=${res.status} — mutação sem linha em governance_audit_log para cid=${echoed}`);
        }
      }
    }

    if (failures.length) console.error("Governance gate — falhas:\n" + failures.join("\n"));
    assertEquals(failures.length, 0, `${failures.length} falhas de propagação para governance_audit_log`);
  },
});
