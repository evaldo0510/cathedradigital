/**
 * Auditoria em massa: aplica o normalizador em todos os §§ de `catechism_official`
 * e gera relatório (JSON + CSV) com antes/depois e contadores por categoria.
 *
 * Uso:
 *   bun run scripts/catechism-normalization-audit.ts [--limit=N] [--out=DIR]
 *
 * Env: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (ou SUPABASE_SERVICE_ROLE_KEY).
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  normalizeCatechismTextWithReport,
  totalChanges,
  type NormalizationChanges,
} from '../src/lib/catechismTextNormalizer';

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? '1'] as const;
  })
);

const LIMIT = Number(args.get('limit') ?? 0);
const OUT_DIR = args.get('out') ?? 'reports/catechism-normalization';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltam SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY no ambiente.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchAll() {
  const rows: Array<{ paragraph: number; content: string | null }> = [];
  const pageSize = 500;
  let from = 0;
  while (true) {
    let q = supabase
      .from('catechism_official')
      .select('paragraph, content')
      .order('paragraph', { ascending: true })
      .range(from, from + pageSize - 1);
    const { data, error } = await q;
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...(data as any));
    if (data.length < pageSize) break;
    from += pageSize;
    if (LIMIT && rows.length >= LIMIT) break;
  }
  return LIMIT ? rows.slice(0, LIMIT) : rows;
}

function emptyTotals(): NormalizationChanges {
  return {
    invisibleCharsRemoved: 0,
    nbspReplaced: 0,
    multiSpacesCollapsed: 0,
    crlfReplaced: 0,
    excessBreaksCollapsed: 0,
    bulletsExtracted: 0,
    numberedExtracted: 0,
    missingSpacesAfterPunct: 0,
    spacesBeforePunctRemoved: 0,
    footnotesSeparated: 0,
    quotesConverted: 0,
  };
}

(async () => {
  console.log(`→ Buscando parágrafos do catechism_official (limit=${LIMIT || 'all'})...`);
  const rows = await fetchAll();
  console.log(`  ${rows.length} parágrafos carregados.`);

  const perParagraph: Array<Record<string, unknown>> = [];
  const totals = emptyTotals();
  let changedCount = 0;
  let totalDuration = 0;
  let maxDuration = 0;

  for (const row of rows) {
    if (!row.content) continue;
    const report = normalizeCatechismTextWithReport(row.content);
    totalDuration += report.durationMs;
    if (report.durationMs > maxDuration) maxDuration = report.durationMs;
    if (report.changed) changedCount++;
    for (const k of Object.keys(totals) as Array<keyof NormalizationChanges>) {
      totals[k] += report.changes[k];
    }
    perParagraph.push({
      paragraph: row.paragraph,
      changed: report.changed,
      totalChanges: totalChanges(report.changes),
      durationMs: Number(report.durationMs.toFixed(4)),
      originalLength: report.originalLength,
      normalizedLength: report.normalizedLength,
      ...report.changes,
      before: report.changed ? row.content : undefined,
      after: report.changed ? report.text : undefined,
    });
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = join(OUT_DIR, `audit-${stamp}.json`);
  const csvPath = join(OUT_DIR, `audit-${stamp}.csv`);

  const summary = {
    generatedAt: new Date().toISOString(),
    totalParagraphs: rows.length,
    changedParagraphs: changedCount,
    unchangedParagraphs: rows.length - changedCount,
    avgDurationMs: Number((totalDuration / Math.max(1, rows.length)).toFixed(4)),
    maxDurationMs: Number(maxDuration.toFixed(4)),
    totalDurationMs: Number(totalDuration.toFixed(2)),
    categoryTotals: totals,
  };

  writeFileSync(jsonPath, JSON.stringify({ summary, perParagraph }, null, 2));

  const csvHeader = [
    'paragraph',
    'changed',
    'total_changes',
    'duration_ms',
    'original_length',
    'normalized_length',
    ...Object.keys(totals),
  ];
  const csvRows = perParagraph.map((p) =>
    [
      p.paragraph,
      p.changed,
      p.totalChanges,
      p.durationMs,
      p.originalLength,
      p.normalizedLength,
      ...Object.keys(totals).map((k) => (p as any)[k]),
    ].join(',')
  );
  writeFileSync(csvPath, [csvHeader.join(','), ...csvRows].join('\n'));

  console.log('\n===== RESUMO =====');
  console.table(summary);
  console.log(`\n📄 JSON: ${jsonPath}`);
  console.log(`📄 CSV : ${csvPath}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
