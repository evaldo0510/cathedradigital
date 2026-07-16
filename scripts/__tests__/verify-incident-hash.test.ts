import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { verifyCsv, verifyRow, type FileReader } from '../verify-incident-hash';

const HEADER = 'incident_id,arquivo_payload_mascarado,hash_sha256';
const PAYLOAD = Buffer.from('{"payer":{"email":"***"},"payment_id":"1319876543"}');
const SHA = createHash('sha256').update(PAYLOAD).digest('hex');

const memReader = (files: Record<string, Buffer>): FileReader => ({
  exists: (p) => p in files,
  read: (p) => files[p],
});

describe('verify-incident-hash', () => {
  it('OK quando hash completo bate', () => {
    const row = { incident_id: 'INC-001', arquivo_payload_mascarado: 'a.json', hash_sha256: SHA };
    expect(verifyRow(row, memReader({ 'a.json': PAYLOAD })).status).toBe('OK');
  });

  it('OK quando hash truncado prefixo…sufixo bate', () => {
    const trunc = `${SHA.slice(0, 8)}...${SHA.slice(-8)}`;
    const row = { incident_id: 'INC-001', arquivo_payload_mascarado: 'a.json', hash_sha256: trunc };
    expect(verifyRow(row, memReader({ 'a.json': PAYLOAD })).status).toBe('OK');
  });

  it('MISMATCH quando payload foi alterado (1 byte a mais)', () => {
    const tampered = Buffer.concat([PAYLOAD, Buffer.from(' ')]);
    const row = { incident_id: 'INC-001', arquivo_payload_mascarado: 'a.json', hash_sha256: SHA };
    expect(verifyRow(row, memReader({ 'a.json': tampered })).status).toBe('MISMATCH');
  });

  it('FILE_MISSING quando arquivo não existe em disco', () => {
    const row = { incident_id: 'INC-002', arquivo_payload_mascarado: 'ausente.json', hash_sha256: SHA };
    expect(verifyRow(row, memReader({})).status).toBe('FILE_MISSING');
  });

  it('NO_HASH quando hash está em placeholder', () => {
    const row = { incident_id: 'INC-003', arquivo_payload_mascarado: 'a.json', hash_sha256: '<preencher>' };
    expect(verifyRow(row, memReader({ 'a.json': PAYLOAD })).status).toBe('NO_HASH');
  });

  it('NO_FILE quando caminho está vazio', () => {
    const row = { incident_id: 'INC-004', arquivo_payload_mascarado: '', hash_sha256: SHA };
    expect(verifyRow(row, memReader({})).status).toBe('NO_FILE');
  });

  it('PLACEHOLDER quando arquivo e hash estão vazios (linha modelo)', () => {
    const row = { incident_id: 'INC-005', arquivo_payload_mascarado: '<preencher>', hash_sha256: '<preencher>' };
    expect(verifyRow(row, memReader({})).status).toBe('PLACEHOLDER');
  });

  it('processa CSV inteiro e classifica todas as linhas', () => {
    const csv = [
      HEADER,
      `INC-001,a.json,${SHA}`,
      `INC-002,b.json,${SHA}`,
      `INC-003,,<preencher>`,
    ].join('\n');
    const results = verifyCsv(csv, memReader({ 'a.json': PAYLOAD }));
    expect(results.map(r => r.status)).toEqual(['OK', 'FILE_MISSING', 'PLACEHOLDER']);
  });
});
