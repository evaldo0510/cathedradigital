/**
 * Validador do INCIDENTES-TEMPLATE.csv (S0 — sandbox webhooks MP).
 *
 * Valida:
 *  - Colunas obrigatórias (§6.7) preenchidas (não vazias, não "<preencher>")
 *  - Formatos esperados (§6.1/§6.2): status HTTP, delta em segundos, hash sha256, timestamps,
 *    booleanos textuais (sim/não/n-a), IDs de incidente/evidência.
 *
 * Uso:  bun scripts/validate-incidents-csv.ts [caminho.csv]
 * Saída: docs/evidencias/mp-sandbox/VALIDATION-REPORT.md + código de saída 0/1.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Papa from 'papaparse';

const CSV_PATH = process.argv[2] ?? 'docs/evidencias/mp-sandbox/INCIDENTES-TEMPLATE.csv';
const OUT = 'docs/evidencias/mp-sandbox/VALIDATION-REPORT.md';

// §6.7 — colunas obrigatórias em qualquer registro real
const REQUIRED = [
  'incident_id', 'evidence_id', 'caso_teste', 'data_hora_captura_brt', 'ambiente',
  'status_http', 'arquivo_payload_mascarado', 'hash_sha256',
  'assinatura_hmac_valida', 'janela_timestamp_ok', 'delta_timestamp_s',
  'linha_webhook_logs', 'causa_provavel', 'executor',
];

const BOOL_TEXT = new Set(['sim', 'não', 'nao', 'n-a', 'n/a']);
const CASOS = /^(CT-SIG-0[123]|CT-EDGE-[A-Z]+)$/;

interface Issue { row: number; incident: string; field: string; kind: 'missing' | 'format'; detail: string; }

function isPlaceholder(v: string) {
  const s = (v ?? '').trim();
  return s === '' || s === '<preencher>' || s === '—';
}

function validateRow(r: Record<string, string>, idx: number): Issue[] {
  const out: Issue[] = [];
  const inc = r.incident_id || `linha ${idx + 2}`;
  const isTemplateRow = /^(TEMPLATE|EXEMPLO)/i.test(inc);
  if (isTemplateRow) return out;

  for (const f of REQUIRED) {
    if (isPlaceholder(r[f])) out.push({ row: idx + 2, incident: inc, field: f, kind: 'missing', detail: 'vazio ou <preencher>' });
  }

  if (!isPlaceholder(r.incident_id) && !/^INC-\d{3,}$/.test(r.incident_id))
    out.push({ row: idx + 2, incident: inc, field: 'incident_id', kind: 'format', detail: 'esperado INC-NNN' });
  if (!isPlaceholder(r.evidence_id) && !/^EV-\d{3,}$/.test(r.evidence_id))
    out.push({ row: idx + 2, incident: inc, field: 'evidence_id', kind: 'format', detail: 'esperado EV-NNN' });
  if (!isPlaceholder(r.caso_teste) && !CASOS.test(r.caso_teste))
    out.push({ row: idx + 2, incident: inc, field: 'caso_teste', kind: 'format', detail: 'esperado CT-SIG-0[123] ou CT-EDGE-*' });
  if (!isPlaceholder(r.status_http) && !/^\d{3}$/.test(r.status_http))
    out.push({ row: idx + 2, incident: inc, field: 'status_http', kind: 'format', detail: 'esperado código HTTP de 3 dígitos' });
  if (!isPlaceholder(r.hash_sha256) && !/^[0-9a-f]{64}$|^[0-9a-f]{8,}\.\.\.[0-9a-f]{4,}$/i.test(r.hash_sha256))
    out.push({ row: idx + 2, incident: inc, field: 'hash_sha256', kind: 'format', detail: 'esperado 64 hex ou prefixo…sufixo hex' });
  if (!isPlaceholder(r.delta_timestamp_s) && r.delta_timestamp_s !== 'n-a' && !/^-?\d+(\.\d+)?$/.test(r.delta_timestamp_s))
    out.push({ row: idx + 2, incident: inc, field: 'delta_timestamp_s', kind: 'format', detail: 'esperado número em segundos ou n-a' });
  if (!isPlaceholder(r.assinatura_hmac_valida) && !BOOL_TEXT.has(r.assinatura_hmac_valida.toLowerCase()))
    out.push({ row: idx + 2, incident: inc, field: 'assinatura_hmac_valida', kind: 'format', detail: 'esperado sim/não/n-a' });
  if (!isPlaceholder(r.janela_timestamp_ok) && !BOOL_TEXT.has(r.janela_timestamp_ok.toLowerCase()))
    out.push({ row: idx + 2, incident: inc, field: 'janela_timestamp_ok', kind: 'format', detail: 'esperado sim/não/n-a' });
  if (!isPlaceholder(r.ambiente) && r.ambiente !== 'sandbox')
    out.push({ row: idx + 2, incident: inc, field: 'ambiente', kind: 'format', detail: 'somente "sandbox" permitido em S0' });
  if (!isPlaceholder(r.data_hora_captura_brt) && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([.-]\d{2}:?\d{2}|Z)?/.test(r.data_hora_captura_brt))
    out.push({ row: idx + 2, incident: inc, field: 'data_hora_captura_brt', kind: 'format', detail: 'esperado ISO 8601 (BRT)' });

  return out;
}

const raw = readFileSync(resolve(CSV_PATH), 'utf-8');
const parsed = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true });
const issues = parsed.data.flatMap((r, i) => validateRow(r, i));

const lines: string[] = [
  '# Relatório de validação — INCIDENTES-TEMPLATE.csv',
  '',
  `- Arquivo: \`${CSV_PATH}\``,
  `- Registros: ${parsed.data.length}`,
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
writeFileSync(OUT, lines.join('\n') + '\n');
console.log(`Relatório salvo em ${OUT} (${issues.length} problema(s))`);
process.exit(issues.length === 0 ? 0 : 1);
