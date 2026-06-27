/**
 * Pure helpers for the "Re-tentar lote" flow in BibleSourcesAudit.
 *
 * Extraídos para permitir testes determinísticos do cálculo de progresso,
 * contagem de pendentes/sucesso/falha e do breakdown de HTTP, sem depender
 * de Supabase, React ou DOM.
 */

export type BatchProgress = {
  total: number;
  done: number;
  ok: number;
  fail: number;
};

export type BatchOutcome = {
  outcome: string;
  httpStatus?: number | null;
};

export const emptyBatchProgress = (total: number): BatchProgress => ({
  total,
  done: 0,
  ok: 0,
  fail: 0,
});

/** Resultado considerado sucesso (mesma regra usada em runBatchRetry). */
export const isOkOutcome = (outcome: string): boolean =>
  outcome.startsWith('resolved') || outcome.startsWith('imported');

/** Atualiza o estado do progresso após uma tentativa. */
export const nextProgress = (
  prev: BatchProgress,
  outcome: string,
): BatchProgress => {
  const ok = isOkOutcome(outcome);
  return {
    total: prev.total,
    done: prev.done + 1,
    ok: prev.ok + (ok ? 1 : 0),
    fail: prev.fail + (ok ? 0 : 1),
  };
};

/** Percentual concluído arredondado (0-100). */
export const progressPct = (p: BatchProgress): number =>
  p.total === 0 ? 0 : Math.round((p.done / p.total) * 100);

/** Quantidade de capítulos ainda pendentes. */
export const pending = (p: BatchProgress): number =>
  Math.max(0, p.total - p.done);

/** Contagem por bucket HTTP (2xx, 4xx, 5xx, …). Ignora valores ausentes. */
export const summarizeHttp = (
  results: Array<{ httpStatus?: number | null }>,
): Record<string, number> => {
  const buckets: Record<string, number> = {};
  for (const r of results) {
    if (r.httpStatus == null) continue;
    const bucket = `${Math.floor(r.httpStatus / 100)}xx`;
    buckets[bucket] = (buckets[bucket] ?? 0) + 1;
  }
  return buckets;
};

/** Linha de resumo human-readable usada no toast final do lote. */
export const formatHttpSummary = (buckets: Record<string, number>): string => {
  const entries = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return 'sem códigos';
  return entries.map(([k, v]) => `${k}:${v}`).join(' · ');
};

/** Aplica uma sequência de outcomes a partir do estado vazio. Útil em testes. */
export const replayBatch = (
  total: number,
  outcomes: BatchOutcome[],
): { progress: BatchProgress; http: Record<string, number> } => {
  let progress = emptyBatchProgress(total);
  for (const o of outcomes) {
    progress = nextProgress(progress, o.outcome);
  }
  return { progress, http: summarizeHttp(outcomes) };
};
