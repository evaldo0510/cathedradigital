/**
 * Recalcula SHA-256 dos payloads mascarados listados no INCIDENTES-TEMPLATE.csv
 * e compara com o valor da coluna `hash_sha256`. Gera relatório de conferência.
 *
 * Uso:  bun scripts/verify-incident-hash.ts [caminho.csv]
 * Saída: docs/evidencias/mp-sandbox/HASH-CHECK-REPORT.md (+ código 0/1).
 *
 * Regra: se `hash_sha256` estiver no formato "prefixo...sufixo", compara apenas as pontas.
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import Papa from 'papaparse';

const CSV_PATH = process.argv[2] ?? 'docs/evidencias/mp-sandbox/INCIDENTES-TEMPLATE.csv';
const OUT = 'docs/evidencias/mp-sandbox/HASH-CHECK-REPORT.md';

type Row = Record<string, string>;
type Result = {
  incident: string; file: string; expected: string; actual: string;
  status: 'OK' | 'MISMATCH' | 'FILE_MISSING' | 'NO_HASH' | 'NO_FILE' | 'PLACEHOLDER';
  detail?: string;
};

function isPlaceholder(v?: string) {
  const s = (v ?? '').trim();
  return s === '' || s === '<preencher>' || s === '—';
}

function compare(expected: string, actual: string): boolean {
  if (/^[0-9a-f]{64}$/i.test(expected)) return expected.toLowerCase() === actual;
  // formato "prefixo...sufixo"
  const m = expected.match(/^([0-9a-f]+)\.{2,3}([0-9a-f]+)$/i);
  if (m) return actual.startsWith(m[1].toLowerCase()) && actual.endsWith(m[2].toLowerCase());
  return false;
}

const raw = readFileSync(resolve(CSV_PATH), 'utf-8');
const parsed = Papa.parse<Row>(raw, { header: true, skipEmptyLines: true });
const results: Result[] = [];

for (const r of parsed.data) {
  const incident = r.incident_id || '(sem id)';
  const file = r.arquivo_payload_mascarado || '';
  const expected = (r.hash_sha256 || '').trim();

  if (isPlaceholder(file) && isPlaceholder(expected)) {
    results.push({ incident, file, expected, actual: '', status: 'PLACEHOLDER', detail: 'linha modelo (sem payload/hash)' });
    continue;
  }
  if (isPlaceholder(file)) { results.push({ incident, file, expected, actual: '', status: 'NO_FILE' }); continue; }
  if (isPlaceholder(expected)) { results.push({ incident, file, expected, actual: '', status: 'NO_HASH' }); continue; }

  const abs = resolve(file);
  if (!existsSync(abs)) { results.push({ incident, file, expected, actual: '', status: 'FILE_MISSING' }); continue; }

  const buf = readFileSync(abs);
  const actual = createHash('sha256').update(buf).digest('hex');
  const ok = compare(expected, actual);
  results.push({ incident, file, expected, actual, status: ok ? 'OK' : 'MISMATCH' });
}

const summary = results.reduce<Record<string, number>>((a, r) => (a[r.status] = (a[r.status] ?? 0) + 1, a), {});
const lines: string[] = [
  '# Conferência de SHA-256 — Payloads mascarados',
  '',
  `- CSV: \`${CSV_PATH}\``,
  `- Total: ${results.length}`,
  `- Resumo: ${Object.entries(summary).map(([k, v]) => `${k}=${v}`).join(' · ')}`,
  '',
  '| Incident | Arquivo | Esperado | Calculado | Status |',
  '| -------- | ------- | -------- | --------- | ------ |',
  ...results.map(r => `| ${r.incident} | \`${r.file || '—'}\` | \`${r.expected || '—'}\` | \`${r.actual || '—'}\` | **${r.status}**${r.detail ? ` (${r.detail})` : ''} |`),
];
writeFileSync(OUT, lines.join('\n') + '\n');

const fail = results.filter(r => r.status === 'MISMATCH' || r.status === 'FILE_MISSING').length;
console.log(`Relatório salvo em ${OUT} — ${fail} falha(s) críticas`);
process.exit(fail === 0 ? 0 : 1);
