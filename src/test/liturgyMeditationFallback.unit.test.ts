/**
 * Testes unitários da lógica de fallback do useLiturgyMeditation.
 * Cobre: local-cache, previous-day, local-builder, retry_at, dedupe do buffer.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  __testables__,
  readFallbackEvents,
  clearFallbackEvents,
  type LiturgyMeditationRow,
} from '@/hooks/useLiturgyMeditation';
import type { DailyLiturgy } from '@/core/liturgy/LiturgyProvider';

const {
  buildClientFallbackMeditation,
  retryAtFor,
  messageForCode,
  inferCode,
  writeLocalMeditation,
  persistFallbackEvent,
  RETRY_WINDOW_MINUTES,
} = __testables__;

const readings: DailyLiturgy = {
  data: '2026-07-21',
  dia: 'Terça-feira',
  liturgia: 'Tempo Comum',
  cor: 'Verde',
  evangelho: { referencia: 'Mt 12,46-50', titulo: '', texto: 'Texto de prova' },
  salmo: { refrao: 'Louvai o Senhor', referencia: '', texto: '' },
  primeiraLeitura: { referencia: '', titulo: '', texto: '' },
  segundaLeitura: null,
  season: null,
} as any;

const realRow: LiturgyMeditationRow = {
  iso_date: '2026-07-21',
  theme: 'Comunhão',
  reading_key: 'chave',
  fathers: [], catechism: [], magisterium: [],
  logos: { observe: 'o', reflect: 'r', pray: 'p', live: 'l' },
  final_prayer: 'Amém.',
  church_history: null,
  action_of_day: 'ação',
  version: 1, model: 'x', provider: 'ai', prompt_hash: null,
  generated_at: new Date().toISOString(),
};

beforeEach(() => {
  localStorage.clear();
  clearFallbackEvents();
});

describe('inferCode', () => {
  it('mapeia 402 → ai_credits_exhausted', () => {
    expect(inferCode(402)).toBe('ai_credits_exhausted');
    expect(inferCode(undefined, 'Payment Required')).toBe('ai_credits_exhausted');
  });
  it('mapeia 429 → ai_rate_limited', () => {
    expect(inferCode(429)).toBe('ai_rate_limited');
    expect(inferCode(undefined, 'rate limit')).toBe('ai_rate_limited');
  });
  it('padrão → ai_unavailable', () => {
    expect(inferCode(500)).toBe('ai_unavailable');
    expect(inferCode()).toBe('ai_unavailable');
  });
});

describe('messageForCode', () => {
  it('devolve mensagem específica por código', () => {
    expect(messageForCode('ai_credits_exhausted')).toMatch(/créditos/i);
    expect(messageForCode('ai_rate_limited')).toMatch(/requisições/i);
    expect(messageForCode('ai_unavailable')).toMatch(/indisponível/i);
  });
});

describe('retryAtFor', () => {
  it('respeita janela por código', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const iso = retryAtFor('ai_credits_exhausted');
    const diffMin = (new Date(iso).getTime() - now) / 60_000;
    expect(diffMin).toBeCloseTo(RETRY_WINDOW_MINUTES.ai_credits_exhausted, 1);
    vi.restoreAllMocks();
  });
  it('fallback para ai_unavailable em código desconhecido', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const iso = retryAtFor('xyz');
    const diffMin = (new Date(iso).getTime() - now) / 60_000;
    expect(diffMin).toBeCloseTo(RETRY_WINDOW_MINUTES.ai_unavailable, 1);
    vi.restoreAllMocks();
  });
});

describe('buildClientFallbackMeditation', () => {
  it('usa local-cache quando existe meditação real do mesmo dia', () => {
    writeLocalMeditation(realRow);
    const out = buildClientFallbackMeditation('2026-07-21', readings, {
      code: 'ai_credits_exhausted',
      message: 'x',
    });
    expect(out.fallback).toBe(true);
    expect(out.fallback_source).toBe('local-cache');
    expect(out.theme).toBe('Comunhão');
    expect(out.fallback_code).toBe('ai_credits_exhausted');
    expect(out.fallback_retry_at).toBeTruthy();
  });

  it('usa previous-day quando só há meditação de dia anterior', () => {
    writeLocalMeditation({ ...realRow, iso_date: '2026-07-20' });
    const out = buildClientFallbackMeditation('2026-07-21', readings, {
      code: 'ai_rate_limited',
      message: 'y',
    });
    expect(out.fallback_source).toBe('previous-day');
    expect(out.iso_date).toBe('2026-07-21');
    expect(out.theme).toBe('Comunhão');
  });

  it('cai em local-builder quando não há cache algum', () => {
    const out = buildClientFallbackMeditation('2026-07-21', readings, {
      code: 'ai_unavailable',
      message: 'z',
    });
    expect(out.fallback_source).toBe('local-builder');
    expect(out.provider).toBe('local-fallback');
    expect(out.logos?.observe).toMatch(/Mt 12,46-50/);
  });

  it('não persiste fallback como cache real', () => {
    const out = buildClientFallbackMeditation('2026-07-21', readings);
    writeLocalMeditation(out);
    const rawKeys = Object.keys(localStorage).filter((k) => k.startsWith('cathedra:liturgy-meditation:v1:'));
    expect(rawKeys).toHaveLength(0);
  });
});

describe('persistFallbackEvent (dedupe)', () => {
  const base = {
    iso_date: '2026-07-21',
    code: 'ai_credits_exhausted' as const,
    source: 'local-cache' as const,
    retry_at: null,
    message: null,
  };

  it('grava eventos únicos', () => {
    persistFallbackEvent({ ...base, at: new Date().toISOString() });
    persistFallbackEvent({ ...base, at: new Date().toISOString(), source: 'local-builder' });
    expect(readFallbackEvents()).toHaveLength(2);
  });

  it('deduplica mesmo tripleto dentro de 6h', () => {
    persistFallbackEvent({ ...base, at: new Date().toISOString() });
    persistFallbackEvent({ ...base, at: new Date().toISOString() });
    persistFallbackEvent({ ...base, at: new Date().toISOString() });
    expect(readFallbackEvents()).toHaveLength(1);
  });

  it('aceita novo evento após janela de 6h', () => {
    const oldAt = new Date(Date.now() - 7 * 60 * 60_000).toISOString();
    persistFallbackEvent({ ...base, at: oldAt });
    persistFallbackEvent({ ...base, at: new Date().toISOString() });
    expect(readFallbackEvents()).toHaveLength(2);
  });
});
