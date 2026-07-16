/**
 * Recalcula SHA-256 dos payloads mascarados e compara com hash_sha256 do CSV.
 *
 * Uso:  bun scripts/verify-incident-hash.ts [caminho.csv]
 * Saída: docs/evidencias/mp-sandbox/HASH-CHECK-REPORT.md + exit 0/1.
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import Papa from 'papaparse';
// @ts-expect-error — ESM puro
import { compareHash, isPlaceholder } from '../docs/evidencias/mp-sandbox/validation-rules.mjs';

export type Row = Record<string, string>;
export type Status = 'OK' | 'MISMATCH' | 'FILE_MISSING' | 'NO_HASH' | 'NO_FILE' | 'PLACEHOLDER';
export interface Result {
  incident: string; file: string; expected: string; actual: string; status: Status; detail?: string;
}

export interface FileReader {
  exists(path: string): boolean;
  read(path: string): Buffer;
}
const nodeReader: FileReader = {
  exists: (p) => existsSync(resolve(p)),
  read: (p) => readFileSync(resolve(p)),
};

export function verifyRow(r: Row, reader: FileReader = nodeReader): Result {
  const incident = r.incident_id || '(sem id)';
  const file = r.arquivo_payload_mascarado || '';
  const expected = (r.hash_sha256 || '').trim();

  if (isPlaceholder(file) && isPlaceholder(expected))
    return { incident, file, expected, actual: '', status: 'PLACEHOLDER', detail: 'linha modelo' };
  if (isPlaceholder(file)) return { incident, file, expected, actual: '', status: 'NO_FILE' };
  if (isPlaceholder(expected)) return { incident, file, expected, actual: '', status: 'NO_HASH' };
  if (!reader.exists(file)) return { incident, file, expected, actual: '', status: 'FILE_MISSING' };

  const buf = reader.read(file);
  const actual = createHash('sha256').update(buf).digest('hex');
  return { incident, file, expected, actual, status: compareHash(expected, actual) ? 'OK' : 'MISMATCH' };
}

export function verifyCsv(raw: string, reader: FileReader = nodeReader): Result[] {
  const parsed = Papa.parse<Row>(raw, { header: true, skipEmptyLines: true });
  return parsed.data.map((r) => verifyRow(r, reader));
}

export function renderReport(results: Result[], csvPath: string): string {
  const summary = results.reduce<Record<string, number>>((a, r) => (a[r.status] = (a[r.status] ?? 0) + 1, a), {});
  return [
    '# Conferência de SHA-256 — Payloads mascarados',
    '',
    `- CSV: \`${csvPath}\``,
    `- Total: ${results.length}`,
    `- Resumo: ${Object.entries(summary).map(([k, v]) => `${k}=${v}`).join(' · ') || '—'}`,
    '',
    '| Incident | Arquivo | Esperado | Calculado | Status |',
    '| -------- | ------- | -------- | --------- | ------ |',
    ...results.map(r => `| ${r.incident} | \`${r.file || '—'}\` | \`${r.expected || '—'}\` | \`${r.actual || '—'}\` | **${r.status}**${r.detail ? ` (${r.detail})` : ''} |`),
  ].join('\n') + '\n';
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const csvPath = process.argv[2] ?? 'docs/evidencias/mp-sandbox/INCIDENTES-TEMPLATE.csv';
  const out = 'docs/evidencias/mp-sandbox/HASH-CHECK-REPORT.md';
  const raw = readFileSync(resolve(csvPath), 'utf-8');
  const results = verifyCsv(raw);
  writeFileSync(out, renderReport(results, csvPath));
  const fail = results.filter(r => r.status === 'MISMATCH' || r.status === 'FILE_MISSING').length;
  // eslint-disable-next-line no-console
  console.log(`Relatório salvo em ${out} — ${fail} falha(s) críticas`);
  process.exit(fail === 0 ? 0 : 1);
}
