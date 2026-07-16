// Regras de validação do INCIDENTES-TEMPLATE.csv — fonte única.
// Consumido por scripts/validate-incidents-csv.ts (Node) e docs/evidencias/mp-sandbox/dashboard.html (browser).
// Sem dependências externas. ESM puro.

// §6.7 — colunas obrigatórias em qualquer registro real
export const REQUIRED = [
  'incident_id', 'evidence_id', 'caso_teste', 'data_hora_captura_brt', 'ambiente',
  'status_http', 'arquivo_payload_mascarado', 'hash_sha256',
  'assinatura_hmac_valida', 'janela_timestamp_ok', 'delta_timestamp_s',
  'linha_webhook_logs', 'causa_provavel', 'executor',
];

export const BOOL_TEXT = new Set(['sim', 'não', 'nao', 'n-a', 'n/a']);
export const CASOS_RE = /^(CT-SIG-0[123]|CT-EDGE-[A-Z]+)$/;

export function isPlaceholder(v) {
  const s = (v ?? '').toString().trim();
  return s === '' || s === '<preencher>' || s === '—';
}

/**
 * Valida uma linha do CSV.
 * @param {Record<string,string>} r
 * @param {number} idx zero-based
 * @returns {Array<{row:number, incident:string, field:string, kind:'missing'|'format', detail:string}>}
 */
export function validateRow(r, idx) {
  const out = [];
  const inc = r.incident_id || `linha ${idx + 2}`;
  if (/^(TEMPLATE|EXEMPLO)/i.test(inc)) return out;

  const push = (field, kind, detail) => out.push({ row: idx + 2, incident: inc, field, kind, detail });

  for (const f of REQUIRED) {
    if (isPlaceholder(r[f])) push(f, 'missing', 'vazio ou <preencher>');
  }
  if (!isPlaceholder(r.incident_id) && !/^INC-\d{3,}$/.test(r.incident_id))
    push('incident_id', 'format', 'esperado INC-NNN');
  if (!isPlaceholder(r.evidence_id) && !/^EV-\d{3,}$/.test(r.evidence_id))
    push('evidence_id', 'format', 'esperado EV-NNN');
  if (!isPlaceholder(r.caso_teste) && !CASOS_RE.test(r.caso_teste))
    push('caso_teste', 'format', 'esperado CT-SIG-0[123] ou CT-EDGE-*');
  if (!isPlaceholder(r.status_http) && !/^\d{3}$/.test(r.status_http))
    push('status_http', 'format', 'esperado código HTTP de 3 dígitos');
  if (!isPlaceholder(r.hash_sha256) && !/^[0-9a-f]{64}$|^[0-9a-f]{8,}\.{2,3}[0-9a-f]{4,}$/i.test(r.hash_sha256))
    push('hash_sha256', 'format', 'esperado 64 hex ou prefixo…sufixo hex');
  if (!isPlaceholder(r.delta_timestamp_s) && r.delta_timestamp_s !== 'n-a' && !/^-?\d+(\.\d+)?$/.test(r.delta_timestamp_s))
    push('delta_timestamp_s', 'format', 'esperado número em segundos ou n-a');
  if (!isPlaceholder(r.assinatura_hmac_valida) && !BOOL_TEXT.has(r.assinatura_hmac_valida.toLowerCase()))
    push('assinatura_hmac_valida', 'format', 'esperado sim/não/n-a');
  if (!isPlaceholder(r.janela_timestamp_ok) && !BOOL_TEXT.has(r.janela_timestamp_ok.toLowerCase()))
    push('janela_timestamp_ok', 'format', 'esperado sim/não/n-a');
  if (!isPlaceholder(r.ambiente) && r.ambiente !== 'sandbox')
    push('ambiente', 'format', 'somente "sandbox" permitido em S0');
  if (!isPlaceholder(r.data_hora_captura_brt) && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([.-]\d{2}:?\d{2}|Z)?/.test(r.data_hora_captura_brt))
    push('data_hora_captura_brt', 'format', 'esperado ISO 8601 (BRT)');

  return out;
}

/** Compara hash esperado (64 hex ou "prefixo…sufixo") com calculado (64 hex). */
export function compareHash(expected, actual) {
  if (!expected || !actual) return false;
  const exp = expected.toLowerCase();
  const act = actual.toLowerCase();
  if (/^[0-9a-f]{64}$/.test(exp)) return exp === act;
  const m = exp.match(/^([0-9a-f]+)\.{2,3}([0-9a-f]+)$/);
  if (m) return act.startsWith(m[1]) && act.endsWith(m[2]);
  return false;
}
