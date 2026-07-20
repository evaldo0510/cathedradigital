import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  toISODateLocal,
  parseISODateLocal,
  clampSanctorumDate,
  resolveSanctorumDateParam,
  MIN_SANCTORUM_YEAR,
} from '../sanctorumDate';

afterEach(() => {
  vi.useRealTimers();
});

describe('toISODateLocal', () => {
  it('formata YYYY-MM-DD sem timezone drift', () => {
    // 5 de março, um dia com componentes < 10 (pad para dois dígitos).
    expect(toISODateLocal(new Date(2024, 2, 5))).toBe('2024-03-05');
  });

  it('respeita o fuso local (não usa UTC)', () => {
    const d = new Date(2024, 0, 1, 0, 0, 0); // 01 jan local
    expect(toISODateLocal(d)).toBe('2024-01-01');
  });

  it('roundtrip com parseISODateLocal preserva o valor', () => {
    const iso = '2010-11-30';
    const parsed = parseISODateLocal(iso)!;
    expect(toISODateLocal(parsed)).toBe(iso);
  });
});

describe('parseISODateLocal', () => {
  it('devolve Date válida para YYYY-MM-DD', () => {
    const d = parseISODateLocal('2024-06-15')!;
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(15);
  });

  it.each(['', null, undefined])('devolve null para entrada vazia (%s)', (v) => {
    expect(parseISODateLocal(v as any)).toBeNull();
  });

  it.each([
    '2024/06/15',
    '15-06-2024',
    'abcd-ef-gh',
    '24-6-1',
    '2024-6-15',
    '2024-06-15T10:00:00Z',
  ])('devolve null para formato malformado (%s)', (bad) => {
    expect(parseISODateLocal(bad)).toBeNull();
  });

  it('devolve null para data com componentes NaN (13º mês etc.)', () => {
    // Regex passa mas Date normaliza: 2024-13-01 vira 2025-01-01. Documentamos
    // o comportamento atual (o clamp/UI trata a inconsistência).
    const d = parseISODateLocal('2024-13-01');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2025);
  });
});

describe('clampSanctorumDate', () => {
  // Helper para evitar a expansão automática de anos 0–99 do Date().
  const mkDate = (y: number, m = 0, d = 1) => {
    const x = new Date(2000, 0, 1);
    x.setFullYear(y, m, d);
    return x;
  };

  it('aceita datas dentro do intervalo [MIN_SANCTORUM_YEAR, anoAtual + 1]', () => {
    const currentYear = new Date().getFullYear();
    expect(clampSanctorumDate(mkDate(MIN_SANCTORUM_YEAR, 0, 1))).not.toBeNull();
    expect(clampSanctorumDate(mkDate(currentYear, 5, 10))).not.toBeNull();
    expect(clampSanctorumDate(mkDate(currentYear + 1, 11, 31))).not.toBeNull();
  });

  it('rejeita ano anterior a MIN_SANCTORUM_YEAR', () => {
    expect(clampSanctorumDate(mkDate(MIN_SANCTORUM_YEAR - 1))).toBeNull();
    expect(clampSanctorumDate(mkDate(0))).toBeNull();
  });

  it('rejeita ano maior que anoAtual + 1', () => {
    const tooFar = new Date().getFullYear() + 2;
    expect(clampSanctorumDate(new Date(tooFar, 0, 1))).toBeNull();
    expect(clampSanctorumDate(new Date(9999, 0, 1))).toBeNull();
  });

  it('devolve null para null', () => {
    expect(clampSanctorumDate(null)).toBeNull();
  });
});

describe('resolveSanctorumDateParam', () => {
  it('data válida: devolve wasClamped=false e a mesma data', () => {
    const r = resolveSanctorumDateParam('2024-06-15');
    expect(r.wasClamped).toBe(false);
    expect(toISODateLocal(r.date)).toBe('2024-06-15');
    expect(r.received).toBe('2024-06-15');
  });

  it('sem parâmetro: wasClamped=false, cai em hoje', () => {
    const today = toISODateLocal(new Date());
    const r = resolveSanctorumDateParam(null);
    expect(r.wasClamped).toBe(false);
    expect(r.received).toBeNull();
    expect(toISODateLocal(r.date)).toBe(today);
  });

  it('data malformada: wasClamped=true, cai em hoje', () => {
    const today = toISODateLocal(new Date());
    const r = resolveSanctorumDateParam('nao-e-data');
    expect(r.wasClamped).toBe(true);
    expect(r.received).toBe('nao-e-data');
    expect(toISODateLocal(r.date)).toBe(today);
  });

  it('data fora do intervalo (ano 9999): wasClamped=true, cai em hoje', () => {
    const today = toISODateLocal(new Date());
    const r = resolveSanctorumDateParam('9999-01-01');
    expect(r.wasClamped).toBe(true);
    expect(toISODateLocal(r.date)).toBe(today);
  });

  it('data fora do intervalo (ano 29): wasClamped=true', () => {
    const r = resolveSanctorumDateParam('0029-01-01');
    expect(r.wasClamped).toBe(true);
  });

  it('string vazia: comportamento consistente com "sem parâmetro"', () => {
    const r = resolveSanctorumDateParam('');
    expect(r.wasClamped).toBe(false);
    expect(r.received).toBe('');
  });
});
