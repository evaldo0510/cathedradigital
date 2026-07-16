/**
 * Valida INCIDENTES-TEMPLATE.csv contra §6.7 (obrigatórias) e §6.1/§6.2 (formato).
 * Regras: docs/evidencias/mp-sandbox/validation-rules.mjs (fonte única).
 *
 * Uso:  bun scripts/validate-incidents-csv.ts [caminho.csv]
 * Saída: docs/evidencias/mp-sandbox/VALIDATION-REPORT.md + exit 0/1.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Papa from 'papaparse';
// @ts-expect-error — ESM puro, sem tipos
import { validateRow } from '../docs/evidencias/mp-sandbox/validation-rules.mjs';

export interface Issue { row: number; incident: string; field: string; kind: 'missing' | 'format'; detail: string; }

export function validateCsv(raw: string): Issue[] {
  const parsed = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true });
  return parsed.data.flatMap((r, i) => validateRow(r, i) as Issue[]);
}

export function renderReport(issues: Issue[], csvPath: string, total: number): string {
  const lines: string[] = [
    '# Relatório de validação — INCIDENTES-TEMPLATE.csv',
    '',
    `- Arquivo: \`${csvPath}\``,
    `- Registros: ${total}`,
    `- Problemas: **${issues.length}**`,
    '',
  ];
  if (issues.length === 0) {
    lines.push('Nenhum problema detectado. ✅');
  } else {
    lines.push('| Linha | Incidente | Campo | Tipo | Detalhe |');
    lines.push('| ----- | --------- | ----- | ---- | ------- |');
    for (const i of issues) lines.push(`| ${i.row} | ${i.incident} | \`${i.field}\` | ${i.kind} | ${i.detail} |`);
  }
  return lines.join('\n') + '\n';
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const csvPath = process.argv[2] ?? 'docs/evidencias/mp-sandbox/INCIDENTES-TEMPLATE.csv';
  const out = 'docs/evidencias/mp-sandbox/VALIDATION-REPORT.md';
  const raw = readFileSync(resolve(csvPath), 'utf-8');
  const parsed = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true });
  const issues = validateCsv(raw);
  writeFileSync(out, renderReport(issues, csvPath, parsed.data.length));
  // eslint-disable-next-line no-console
  console.log(`Relatório salvo em ${out} (${issues.length} problema(s))`);
  process.exit(issues.length === 0 ? 0 : 1);
}
