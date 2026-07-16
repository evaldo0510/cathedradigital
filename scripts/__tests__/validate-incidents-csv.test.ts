import { describe, it, expect } from 'vitest';
import { validateCsv } from '../validate-incidents-csv';

const HEADER = 'incident_id,evidence_id,caso_teste,data_hora_captura_brt,ambiente,status_http,arquivo_payload_mascarado,hash_sha256,assinatura_hmac_valida,janela_timestamp_ok,delta_timestamp_s,linha_webhook_logs,causa_provavel,executor';

const validRow = [
  'INC-042', 'EV-042', 'CT-SIG-01', '2026-07-16T14:22:10-03:00', 'sandbox',
  '200', 'docs/evidencias/mp-sandbox/EV-042.json',
  '3f9c2e1a7b5d4e0f11223344556677889900aabbccddeeff0011223344556677',
  'sim', 'sim', '3', 'sim id=1042', 'fluxo_normal_ok', 'joao'
].join(',');

describe('validate-incidents-csv', () => {
  it('linha completa e bem-formada não gera issues', () => {
    const csv = `${HEADER}\n${validRow}`;
    expect(validateCsv(csv)).toHaveLength(0);
  });

  it('detecta colunas obrigatórias §6.7 ausentes/placeholder', () => {
    const row = 'INC-100,<preencher>,,,,,,,,,,,,';
    const issues = validateCsv(`${HEADER}\n${row}`);
    const missing = issues.filter(i => i.kind === 'missing').map(i => i.field);
    expect(missing).toEqual(expect.arrayContaining([
      'evidence_id', 'caso_teste', 'data_hora_captura_brt', 'ambiente',
      'status_http', 'arquivo_payload_mascarado', 'hash_sha256',
      'assinatura_hmac_valida', 'janela_timestamp_ok', 'delta_timestamp_s',
      'linha_webhook_logs', 'causa_provavel', 'executor',
    ]));
  });

  it('rejeita status HTTP não numérico', () => {
    const row = validRow.replace(',200,', ',OK,');
    const issues = validateCsv(`${HEADER}\n${row}`);
    expect(issues.find(i => i.field === 'status_http' && i.kind === 'format')).toBeTruthy();
  });

  it('rejeita hash com formato inválido', () => {
    const bad = validRow.replace(
      '3f9c2e1a7b5d4e0f11223344556677889900aabbccddeeff0011223344556677',
      'not-a-hash'
    );
    const issues = validateCsv(`${HEADER}\n${bad}`);
    expect(issues.find(i => i.field === 'hash_sha256')).toBeTruthy();
  });

  it('aceita hash no formato truncado prefixo…sufixo', () => {
    const trunc = validRow.replace(
      '3f9c2e1a7b5d4e0f11223344556677889900aabbccddeeff0011223344556677',
      '3f9c2e1a...9a8b7c6d'
    );
    const issues = validateCsv(`${HEADER}\n${trunc}`);
    expect(issues.find(i => i.field === 'hash_sha256')).toBeUndefined();
  });

  it('rejeita ambiente diferente de sandbox (S0)', () => {
    const row = validRow.replace(',sandbox,', ',production,');
    const issues = validateCsv(`${HEADER}\n${row}`);
    expect(issues.find(i => i.field === 'ambiente')).toBeTruthy();
  });

  it('rejeita assinatura_hmac_valida fora de sim/não/n-a', () => {
    const row = validRow.replace(',sim,sim,3,', ',true,sim,3,');
    const issues = validateCsv(`${HEADER}\n${row}`);
    expect(issues.find(i => i.field === 'assinatura_hmac_valida')).toBeTruthy();
  });

  it('rejeita delta_timestamp_s não numérico (exceto n-a)', () => {
    const row = validRow.replace(',sim,sim,3,', ',sim,sim,muito,');
    const issues = validateCsv(`${HEADER}\n${row}`);
    expect(issues.find(i => i.field === 'delta_timestamp_s')).toBeTruthy();
  });

  it('aceita delta_timestamp_s = n-a', () => {
    const row = validRow.replace(',sim,sim,3,', ',sim,n-a,n-a,');
    const issues = validateCsv(`${HEADER}\n${row}`);
    expect(issues.find(i => i.field === 'delta_timestamp_s')).toBeUndefined();
  });

  it('rejeita incident_id fora do padrão INC-NNN', () => {
    const row = validRow.replace('INC-042', 'INCIDENTE_42');
    const issues = validateCsv(`${HEADER}\n${row}`);
    expect(issues.find(i => i.field === 'incident_id' && i.kind === 'format')).toBeTruthy();
  });

  it('rejeita caso_teste desconhecido', () => {
    const row = validRow.replace('CT-SIG-01', 'CT-QUALQUER');
    const issues = validateCsv(`${HEADER}\n${row}`);
    expect(issues.find(i => i.field === 'caso_teste')).toBeTruthy();
  });

  it('ignora linhas TEMPLATE/EXEMPLO', () => {
    const row = validRow.replace('INC-042', 'TEMPLATE');
    const issues = validateCsv(`${HEADER}\n${row}`);
    expect(issues).toHaveLength(0);
  });

  it('regressão: template atual permanece com issues previstas (INC-002/003 placeholders)', async () => {
    const { readFileSync } = await import('node:fs');
    const raw = readFileSync('docs/evidencias/mp-sandbox/INCIDENTES-TEMPLATE.csv', 'utf-8');
    const issues = validateCsv(raw);
    // INC-001 é completo, INC-002 e INC-003 têm placeholders — não pode ser zero nem explodir.
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.every(i => ['missing', 'format'].includes(i.kind))).toBe(true);
  });
});
