import { describe, it, expect } from 'vitest';
import {
  emptyBatchProgress,
  isOkOutcome,
  nextProgress,
  progressPct,
  pending,
  summarizeHttp,
  formatHttpSummary,
  replayBatch,
} from '../batchHelpers';

describe('batchHelpers — isOkOutcome', () => {
  it('considera resolved* e imported* como sucesso', () => {
    expect(isOkOutcome('resolved')).toBe(true);
    expect(isOkOutcome('resolved-cache')).toBe(true);
    expect(isOkOutcome('imported-dump')).toBe(true);
  });

  it('marca outros outcomes como falha', () => {
    expect(isOkOutcome('error')).toBe(false);
    expect(isOkOutcome('unavailable')).toBe(false);
    expect(isOkOutcome('timeout')).toBe(false);
    expect(isOkOutcome('')).toBe(false);
  });
});

describe('batchHelpers — nextProgress', () => {
  it('incrementa done e ok em sucesso, mantendo total', () => {
    const p = emptyBatchProgress(3);
    const a = nextProgress(p, 'resolved');
    expect(a).toEqual({ total: 3, done: 1, ok: 1, fail: 0 });
  });

  it('incrementa done e fail em erro', () => {
    const p = emptyBatchProgress(3);
    const a = nextProgress(p, 'error');
    expect(a).toEqual({ total: 3, done: 1, ok: 0, fail: 1 });
  });

  it('soma ok + fail sempre igual a done', () => {
    let p = emptyBatchProgress(5);
    const seq = ['resolved', 'error', 'imported-dump', 'unavailable', 'resolved'];
    for (const o of seq) p = nextProgress(p, o);
    expect(p.done).toBe(5);
    expect(p.ok + p.fail).toBe(p.done);
    expect(p.ok).toBe(3);
    expect(p.fail).toBe(2);
  });
});

describe('batchHelpers — progressPct / pending', () => {
  it('progressPct: 0 quando total é 0', () => {
    expect(progressPct(emptyBatchProgress(0))).toBe(0);
  });

  it('progressPct: arredonda para inteiro', () => {
    expect(progressPct({ total: 3, done: 1, ok: 1, fail: 0 })).toBe(33);
    expect(progressPct({ total: 3, done: 2, ok: 1, fail: 1 })).toBe(67);
    expect(progressPct({ total: 4, done: 4, ok: 2, fail: 2 })).toBe(100);
  });

  it('pending: total - done, nunca negativo', () => {
    expect(pending({ total: 5, done: 0, ok: 0, fail: 0 })).toBe(5);
    expect(pending({ total: 5, done: 3, ok: 2, fail: 1 })).toBe(2);
    expect(pending({ total: 5, done: 9, ok: 0, fail: 9 })).toBe(0);
  });
});

describe('batchHelpers — summarizeHttp / formatHttpSummary', () => {
  it('agrupa códigos por bucket Nxx', () => {
    const buckets = summarizeHttp([
      { httpStatus: 200 },
      { httpStatus: 200 },
      { httpStatus: 404 },
      { httpStatus: 500 },
      { httpStatus: 502 },
      { httpStatus: null },
      { httpStatus: undefined },
    ]);
    expect(buckets).toEqual({ '2xx': 2, '4xx': 1, '5xx': 2 });
  });

  it('formatHttpSummary: ordenado alfabeticamente, ou "sem códigos"', () => {
    expect(formatHttpSummary({})).toBe('sem códigos');
    expect(formatHttpSummary({ '5xx': 2, '2xx': 1, '4xx': 3 })).toBe(
      '2xx:1 · 4xx:3 · 5xx:2',
    );
  });
});

describe('batchHelpers — replayBatch (lote completo com erros + HTTP breakdown)', () => {
  it('reproduz o cálculo de progresso + breakdown ao final do lote', () => {
    const outcomes = [
      { outcome: 'resolved', httpStatus: 200 },
      { outcome: 'error', httpStatus: 500 },
      { outcome: 'imported-dump', httpStatus: 200 },
      { outcome: 'unavailable', httpStatus: 404 },
      { outcome: 'error', httpStatus: 503 },
    ];
    const { progress, http } = replayBatch(5, outcomes);

    expect(progress).toEqual({ total: 5, done: 5, ok: 2, fail: 3 });
    expect(progressPct(progress)).toBe(100);
    expect(pending(progress)).toBe(0);
    expect(http).toEqual({ '2xx': 2, '4xx': 1, '5xx': 2 });
    expect(formatHttpSummary(http)).toBe('2xx:2 · 4xx:1 · 5xx:2');
  });

  it('lote com 100% de falha mantém ok=0 e gera resumo só de 5xx', () => {
    const outcomes = Array.from({ length: 4 }, () => ({
      outcome: 'error',
      httpStatus: 500,
    }));
    const { progress, http } = replayBatch(4, outcomes);
    expect(progress).toEqual({ total: 4, done: 4, ok: 0, fail: 4 });
    expect(formatHttpSummary(http)).toBe('5xx:4');
  });
});
