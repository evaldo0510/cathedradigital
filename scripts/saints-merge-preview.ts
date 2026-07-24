#!/usr/bin/env bun
/**
 * saints-merge-preview.ts
 *
 * Preview (dry-run por padrão) da consolidação de slugs legados de santos
 * para os slugs canônicos dos Doutores da Igreja.
 *
 * Whitelist aprovada (Sprint Santos S2 · Higiene Editorial):
 *   - Grupo A: 17 pares com match exato de slug canônico.
 *   - Grupo B curado: Ireneu de Lyon e Isidoro de Sevilha.
 *   - EXCLUÍDOS por decisão editorial: Cirilo (Alexandria vs Jerusalém)
 *     e Hilário (Poitiers vs outros) — resolução manual futura.
 *
 * Uso:
 *   bun scripts/saints-merge-preview.ts            # dry-run + relatório JSON
 *   bun scripts/saints-merge-preview.ts --apply    # gera SQL de migração
 *
 * Pré-requisito: psql com PG* env vars (Lovable Cloud fornece automaticamente).
 */
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

interface MergePair {
  legacySlug: string;
  canonicalSlug: string;
  reason: "exact" | "curated_feast_day";
  note?: string;
}

// ─── Whitelist aprovada ──────────────────────────────────────────
const WHITELIST: MergePair[] = [
  // Grupo A — match exato de slug (17 pares)
  { legacySlug: "s-agostinho-0828", canonicalSlug: "agostinho", reason: "exact" },
  { legacySlug: "s-agostinho-0527", canonicalSlug: "agostinho", reason: "exact", note: "data alternativa" },
  { legacySlug: "s-alberto-magno-1115", canonicalSlug: "alberto-magno", reason: "exact" },
  { legacySlug: "s-ambrosio-1207", canonicalSlug: "ambrosio", reason: "exact" },
  { legacySlug: "s-anselmo-0421", canonicalSlug: "anselmo", reason: "exact" },
  { legacySlug: "s-anselmo-0318", canonicalSlug: "anselmo", reason: "exact", note: "data alternativa" },
  { legacySlug: "s-atanasio-0502", canonicalSlug: "atanasio", reason: "exact" },
  { legacySlug: "s-bernardo-0820", canonicalSlug: "bernardo", reason: "exact" },
  { legacySlug: "s-efrem-0609", canonicalSlug: "efrem", reason: "exact" },
  { legacySlug: "s-gregorio-magno-0903", canonicalSlug: "gregorio-magno", reason: "exact" },
  { legacySlug: "s-jeronimo-0930", canonicalSlug: "jeronimo", reason: "exact" },
  { legacySlug: "s-joao-crisostomo-0913", canonicalSlug: "joao-crisostomo", reason: "exact" },
  { legacySlug: "s-joao-damasceno-1204", canonicalSlug: "joao-damasceno", reason: "exact" },
  { legacySlug: "s-leao-magno-1110", canonicalSlug: "leao-magno", reason: "exact" },
  { legacySlug: "s-pedro-crisologo-0730", canonicalSlug: "pedro-crisologo", reason: "exact" },
  { legacySlug: "s-pedro-damiao-0221", canonicalSlug: "pedro-damiao", reason: "exact" },
  { legacySlug: "s-roberto-belarmino-0917", canonicalSlug: "roberto-belarmino", reason: "exact" },
  // Grupo B curado (aprovado)
  { legacySlug: "s-ireneu-0628", canonicalSlug: "ireneu-lyon", reason: "curated_feast_day", note: "festa 28/06 = Ireneu de Lyon" },
  { legacySlug: "s-isidoro-0404", canonicalSlug: "isidoro-sevilha", reason: "curated_feast_day", note: "festa 04/04 = Isidoro de Sevilha" },
];

// ─── psql helpers ────────────────────────────────────────────────
function psql(sql: string): unknown[] {
  const raw = execSync(`psql -Aqt -F"\u0001" -c ${JSON.stringify(sql)}`, {
    encoding: "utf-8",
  });
  return raw
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("\u0001"));
}

// ─── Validação ───────────────────────────────────────────────────
function validate() {
  const legacyIds = WHITELIST.map((p) => `'${p.legacySlug}'`).join(",");
  const canonicalIds = [...new Set(WHITELIST.map((p) => p.canonicalSlug))]
    .map((s) => `'${s}'`)
    .join(",");

  const legacyRows = psql(
    `SELECT id, name, editorial_status, merged_into FROM saints WHERE id IN (${legacyIds}) ORDER BY id`
  );
  const canonicalRows = psql(
    `SELECT id, name, editorial_status, editorial_score, merged_into FROM saints WHERE id IN (${canonicalIds}) ORDER BY id`
  );

  const legacyMap = new Map(legacyRows.map((r: any) => [r[0], { name: r[1], status: r[2], merged_into: r[3] }]));
  const canonicalMap = new Map(canonicalRows.map((r: any) => [r[0], { name: r[1], status: r[2], score: r[3], merged_into: r[4] }]));

  const issues: string[] = [];
  const preview = WHITELIST.map((pair) => {
    const legacy = legacyMap.get(pair.legacySlug);
    const canonical = canonicalMap.get(pair.canonicalSlug);
    const problems: string[] = [];
    if (!legacy) problems.push("legacy_missing");
    if (!canonical) problems.push("canonical_missing");
    if (legacy?.merged_into && legacy.merged_into !== "") problems.push(`legacy_already_merged_into:${legacy.merged_into}`);
    if (canonical?.merged_into && canonical.merged_into !== "") problems.push("canonical_is_itself_merged");
    if (problems.length) issues.push(`${pair.legacySlug} → ${pair.canonicalSlug}: ${problems.join(", ")}`);
    return {
      legacy_slug: pair.legacySlug,
      legacy_name: legacy?.name ?? null,
      legacy_status: legacy?.status ?? null,
      canonical_slug: pair.canonicalSlug,
      canonical_name: canonical?.name ?? null,
      canonical_status: canonical?.status ?? null,
      canonical_score: canonical?.score ?? null,
      reason: pair.reason,
      note: pair.note ?? null,
      problems,
    };
  });

  return { preview, issues };
}

// ─── SQL de aplicação ────────────────────────────────────────────
function generateApplySQL(): string {
  const values = WHITELIST.map(
    (p) => `('${p.legacySlug}', '${p.canonicalSlug}')`
  ).join(",\n  ");
  return `-- Consolidação de slugs legados nos Doutores da Igreja (Sprint Santos S2)
-- Aprovado: Grupo A (17) + Ireneu + Isidoro. Total: ${WHITELIST.length} merges.
BEGIN;

WITH pairs(legacy_slug, canonical_slug) AS (
  VALUES
  ${values}
)
UPDATE public.saints s
SET merged_into = p.canonical_slug,
    editorial_status = 'archived',
    updated_at = now()
FROM pairs p
WHERE s.id = p.legacy_slug
  AND (s.merged_into IS NULL OR s.merged_into = '');

-- Auditoria
INSERT INTO public.saints_audit (saint_id, action, changed_fields, actor, reason)
SELECT p.legacy_slug, 'merge', jsonb_build_object('merged_into', p.canonical_slug, 'editorial_status', 'archived'),
       'system:saints-merge-preview', 'Sprint Santos S2 · consolidação legados'
FROM (VALUES ${values}) AS p(legacy_slug, canonical_slug);

COMMIT;
`;
}

// ─── Main ────────────────────────────────────────────────────────
const applyMode = process.argv.includes("--apply");
const { preview, issues } = validate();

const ts = new Date().toISOString().replace(/[:.]/g, "-");
const reportDir = join(process.cwd(), "REPORTS", "saints-merge");
mkdirSync(reportDir, { recursive: true });

const jsonPath = join(reportDir, `preview-${ts}.json`);
writeFileSync(jsonPath, JSON.stringify({ generated_at: new Date().toISOString(), whitelist_size: WHITELIST.length, issues, pairs: preview }, null, 2));

console.log(`\n═══ Saints Merge Preview (${WHITELIST.length} pares) ═══\n`);
console.table(
  preview.map((p) => ({
    legacy: p.legacy_slug,
    "→ canonical": p.canonical_slug,
    can_score: p.canonical_score,
    can_status: p.canonical_status ?? "—",
    reason: p.reason,
    problems: p.problems.length ? p.problems.join(",") : "ok",
  }))
);

if (issues.length) {
  console.log(`\n⚠️  ${issues.length} problema(s):`);
  issues.forEach((i) => console.log(`   - ${i}`));
} else {
  console.log("\n✅ Todos os pares validados sem problemas.");
}

console.log(`\n📄 Relatório JSON: ${jsonPath}`);

if (applyMode) {
  const sqlPath = join(reportDir, `apply-${ts}.sql`);
  writeFileSync(sqlPath, generateApplySQL());
  console.log(`\n📝 SQL gerado em: ${sqlPath}`);
  console.log("   Revise e aplique via supabase--migration (não executar direto).");
} else {
  console.log("\nℹ️  Rode com --apply para gerar o SQL de migração.");
}
