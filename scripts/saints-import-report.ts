#!/usr/bin/env bun
/**
 * saints-import-report.ts
 *
 * Relatório pós-ingestão do saint-import.
 * - Consolida runs recentes de saint_import_logs.
 * - Mede delta de editorial_score dos canônicos tocados.
 * - Detecta redirecionamentos merged_into.
 * - Lista duplicatas remanescentes (doctor ↔ santo sem merged_into).
 *
 * Uso:
 *   bun scripts/saints-import-report.ts                # últimas 24h
 *   bun scripts/saints-import-report.ts --since=7d     # 7 dias
 *   bun scripts/saints-import-report.ts --since=2h     # 2 horas
 */
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

function psql(sql: string): unknown[] {
  const raw = execSync(`psql -Aqt -F$'\\x01'`, { input: sql, encoding: "utf-8" });
  return raw.trim().split("\n").filter(Boolean).map((line) => line.split("\x01"));
}


const sinceArg = process.argv.find((a) => a.startsWith("--since="))?.split("=")[1] ?? "24h";
const m = sinceArg.match(/^(\d+)([hd])$/);
if (!m) {
  console.error(`--since inválido: ${sinceArg}. Use formato Nh ou Nd (ex: 24h, 7d).`);
  process.exit(1);
}
const interval = m[2] === "h" ? `${m[1]} hours` : `${m[1]} days`;

// ─── Métricas ────────────────────────────────────────────────────
const summary = psql(`
  SELECT
    COUNT(*) AS total_runs,
    COUNT(*) FILTER (WHERE status='success') AS success,
    COUNT(*) FILTER (WHERE status='skipped') AS skipped,
    COUNT(*) FILTER (WHERE status='error') AS errors,
    COUNT(DISTINCT canonical_id) AS distinct_canonicals,
    COUNT(*) FILTER (WHERE redirected_from IS NOT NULL) AS redirected,
    ROUND(AVG(confidence)::numeric, 1) AS avg_confidence
  FROM saint_import_logs
  WHERE created_at >= now() - interval '${interval}'
`)[0] as string[];

const perStatus = psql(`
  SELECT saint_id, canonical_id, redirected_from, status, confidence, created_at
  FROM saint_import_logs
  WHERE created_at >= now() - interval '${interval}'
  ORDER BY created_at DESC
  LIMIT 100
`) as string[][];

const enriched = psql(`
  SELECT s.id, s.name, s.editorial_score, s.editorial_status, s.last_scraped_at
  FROM saints s
  WHERE s.id IN (
    SELECT DISTINCT COALESCE(canonical_id, saint_id) FROM saint_import_logs
    WHERE created_at >= now() - interval '${interval}' AND status='success'
  )
  ORDER BY s.editorial_score DESC NULLS LAST
`) as string[][];

const redirects = psql(`
  SELECT redirected_from, canonical_id, COUNT(*) AS n
  FROM saint_import_logs
  WHERE created_at >= now() - interval '${interval}' AND redirected_from IS NOT NULL
  GROUP BY 1, 2
  ORDER BY n DESC
`) as string[][];

// Duplicatas remanescentes: doctor com santo não-arquivado com match exato
const remainingDupes = psql(`
  WITH doctors AS (
    SELECT id AS doctor_slug, name AS doctor_name FROM saints WHERE category='doctor'
  ),
  santos AS (
    SELECT id AS santo_slug, name AS santo_name, editorial_status, merged_into,
           regexp_replace(regexp_replace(id, '^(s|sao|santo|santa)-', ''), '-[0-9]{4}$', '') AS core_slug
    FROM saints WHERE category='santo' AND (merged_into IS NULL OR merged_into = '')
      AND (editorial_status IS NULL OR editorial_status <> 'archived')
  )
  SELECT d.doctor_slug, s.santo_slug, s.santo_name, COALESCE(s.editorial_status, '—') AS status
  FROM doctors d JOIN santos s ON s.core_slug = d.doctor_slug
  ORDER BY d.doctor_slug
`) as string[][];

// ─── Render ──────────────────────────────────────────────────────
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = join(process.cwd(), "REPORTS", "saints-import");
mkdirSync(outDir, { recursive: true });
const mdPath = join(outDir, `report-${ts}.md`);
const jsonPath = join(outDir, `report-${ts}.json`);

const [total, ok, skip, err, distinct, red, avgConf] = summary;

const md = `# Saints Import — Relatório

**Janela:** últimas ${interval} · **Gerado:** ${new Date().toISOString()}

## Sumário

| Métrica | Valor |
|---|---|
| Runs totais | ${total} |
| Sucesso | ${ok} |
| Skipped | ${skip} |
| Erros | ${err} |
| Canônicos distintos tocados | ${distinct} |
| Runs redirecionadas (merged_into) | ${red} |
| Confidence média | ${avgConf ?? "—"} |

## Doutores/Santos enriquecidos (${enriched.length})

| Slug canônico | Nome | Score | Status | Última ingestão |
|---|---|---|---|---|
${enriched.map((r) => `| \`${r[0]}\` | ${r[1]} | ${r[2] ?? "0"} | ${r[3] ?? "—"} | ${r[4] ?? "—"} |`).join("\n") || "_nenhum_"}

## Redirecionamentos merged_into (${redirects.length})

| De (legado) | Para (canônico) | Runs |
|---|---|---|
${redirects.map((r) => `| \`${r[0]}\` | \`${r[1]}\` | ${r[2]} |`).join("\n") || "_nenhum_"}

## Duplicatas remanescentes (${remainingDupes.length})

Colisões \`doctor ↔ santo\` que ainda **não** foram consolidadas nem arquivadas:

| Doutor canônico | Santo legado | Nome | Status |
|---|---|---|---|
${remainingDupes.map((r) => `| \`${r[0]}\` | \`${r[1]}\` | ${r[2]} | ${r[3]} |`).join("\n") || "_nenhuma_ ✅"}

## Runs recentes (top 100)

| Timestamp | Solicitado | Canônico | Redirect | Status | Conf |
|---|---|---|---|---|---|
${perStatus.map((r) => `| ${r[5]} | \`${r[0]}\` | \`${r[1] ?? r[0]}\` | ${r[2] ? `\`${r[2]}\`` : "—"} | ${r[3]} | ${r[4] ?? "—"} |`).join("\n") || "_sem runs na janela_"}
`;

writeFileSync(mdPath, md);
writeFileSync(jsonPath, JSON.stringify({
  window: interval,
  generated_at: new Date().toISOString(),
  summary: { total_runs: total, success: ok, skipped: skip, errors: err, distinct_canonicals: distinct, redirected: red, avg_confidence: avgConf },
  enriched,
  redirects,
  remaining_duplicates: remainingDupes,
  recent_runs: perStatus,
}, null, 2));

console.log(`\n═══ Saints Import Report (${interval}) ═══`);
console.log(`Runs: ${total} · ✅ ${ok} · ⏭ ${skip} · ❌ ${err}`);
console.log(`Canônicos tocados: ${distinct} · Redirecionamentos: ${red}`);
console.log(`Duplicatas remanescentes: ${remainingDupes.length}`);
console.log(`\n📄 Markdown: ${mdPath}`);
console.log(`📄 JSON:     ${jsonPath}`);
