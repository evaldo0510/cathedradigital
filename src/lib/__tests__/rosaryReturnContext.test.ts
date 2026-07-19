/**
 * RosaryReturnContext — serialização/desserialização em sessionStorage.
 *
 * Garante que o breadcrumb "Voltar ao Rosário" mantém set, mistério, dezena,
 * modo e tempo entre navegações sem regressão de campos.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  markRosaryReturn,
  getRosaryReturn,
  clearRosaryReturn,
  formatElapsedShort,
  ROSARY_MODE_LABEL,
  type RosaryReturnMode,
} from '../rosaryReturnContext';

const STORAGE_KEY = 'cathedra:rosary:return';

function basePayload(overrides: Partial<Parameters<typeof markRosaryReturn>[0]> = {}) {
  return {
    setName: 'Mistérios Gozosos',
    mysteryLabel: '3º mistério',
    mysteryIndex: 2,
    stepIndex: 17,
    mode: 'guiado' as RosaryReturnMode,
    elapsedMs: 12 * 60 * 1000, // 12 min
    startedAt: new Date('2026-07-19T14:00:00.000Z').toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('RosaryReturnContext · serialização', () => {
  it('mark → get devolve todos os campos preservados', () => {
    const payload = basePayload();
    markRosaryReturn(payload);
    const restored = getRosaryReturn();
    expect(restored).not.toBeNull();
    expect(restored).toMatchObject({
      setName: payload.setName,
      mysteryLabel: payload.mysteryLabel,
      mysteryIndex: payload.mysteryIndex,
      stepIndex: payload.stepIndex,
      mode: payload.mode,
      elapsedMs: payload.elapsedMs,
      startedAt: payload.startedAt,
    });
    expect(typeof restored!.updatedAt).toBe('string');
    expect(Number.isNaN(new Date(restored!.updatedAt).getTime())).toBe(false);
  });

  it('preserva o modo para cada uma das três variantes', () => {
    const modes: RosaryReturnMode[] = ['contemplativo', 'guiado', 'automatico'];
    for (const mode of modes) {
      markRosaryReturn(basePayload({ mode }));
      expect(getRosaryReturn()?.mode).toBe(mode);
    }
  });

  it('sobrescreve o breadcrumb anterior no mesmo storage key', () => {
    markRosaryReturn(basePayload({ mode: 'contemplativo', stepIndex: 3 }));
    markRosaryReturn(basePayload({ mode: 'automatico', stepIndex: 42 }));
    const restored = getRosaryReturn()!;
    expect(restored.mode).toBe('automatico');
    expect(restored.stepIndex).toBe(42);
  });

  it('clearRosaryReturn remove a chave do sessionStorage', () => {
    markRosaryReturn(basePayload());
    expect(window.sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
    clearRosaryReturn();
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(getRosaryReturn()).toBeNull();
  });

  it('devolve null quando não há nada gravado', () => {
    expect(getRosaryReturn()).toBeNull();
  });

  it('devolve null e limpa quando o payload está corrompido', () => {
    window.sessionStorage.setItem(STORAGE_KEY, '{not json');
    expect(getRosaryReturn()).toBeNull();
  });

  it('expira e limpa quando ultrapassa TTL de 4h', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-19T10:00:00.000Z'));
    markRosaryReturn(basePayload());
    // Avança 4h + 1min.
    vi.setSystemTime(new Date('2026-07-19T14:01:00.000Z'));
    expect(getRosaryReturn()).toBeNull();
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('mantém o breadcrumb dentro do TTL (3h59)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-19T10:00:00.000Z'));
    markRosaryReturn(basePayload({ mode: 'guiado' }));
    vi.setSystemTime(new Date('2026-07-19T13:59:00.000Z'));
    expect(getRosaryReturn()?.mode).toBe('guiado');
  });
});

describe('RosaryReturnContext · rótulos e formato', () => {
  it('ROSARY_MODE_LABEL cobre as três variantes com PT-BR capitalizado', () => {
    expect(ROSARY_MODE_LABEL.contemplativo).toBe('Contemplativo');
    expect(ROSARY_MODE_LABEL.guiado).toBe('Guiado');
    expect(ROSARY_MODE_LABEL.automatico).toBe('Automático');
  });

  it('formatElapsedShort converte ms para o formato humano', () => {
    expect(formatElapsedShort(0)).toBe('0min');
    expect(formatElapsedShort(59_000)).toBe('0min');
    expect(formatElapsedShort(60_000)).toBe('1min');
    expect(formatElapsedShort(12 * 60_000)).toBe('12min');
    expect(formatElapsedShort(60 * 60_000)).toBe('1h');
    expect(formatElapsedShort(90 * 60_000)).toBe('1h30');
    expect(formatElapsedShort(125 * 60_000)).toBe('2h05');
  });
});
