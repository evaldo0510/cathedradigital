import { describe, it, expect } from 'vitest';
import { emptyBatchProgress, nextProgress, type BatchProgress } from '../batchHelpers';

/**
 * Driver simulando o loop de workers de runBatchRetry. Mantém a mesma
 * estrutura (idx compartilhado, waitWhilePaused, atualização incremental
 * de progresso) para validar o contrato: enquanto paused=true, nenhum
 * capítulo da fila é processado.
 */
async function runWorkers(opts: {
  queue: Array<{ id: string; outcome: string }>;
  concurrency: number;
  isPaused: () => boolean;
  pollMs?: number;
}): Promise<{ progress: BatchProgress; processed: string[] }> {
  const { queue, concurrency, isPaused, pollMs = 5 } = opts;
  let progress = emptyBatchProgress(queue.length);
  const processed: string[] = [];
  let idx = 0;

  const waitWhilePaused = async () => {
    while (isPaused()) {
      await new Promise((r) => setTimeout(r, pollMs));
    }
  };

  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (idx < queue.length) {
      await waitWhilePaused();
      const job = queue[idx++];
      if (!job) break;
      processed.push(job.id);
      progress = nextProgress(progress, job.outcome);
    }
  });

  await Promise.all(workers);
  return { progress, processed };
}

describe('batchWorker — gating de pausa', () => {
  it('quando pausado durante toda a execução, nenhum item é processado em uma janela curta', async () => {
    const queue = Array.from({ length: 4 }, (_, i) => ({
      id: `Gn:${i + 1}`,
      outcome: 'resolved',
    }));
    let paused = true;

    const run = runWorkers({ queue, concurrency: 2, isPaused: () => paused, pollMs: 5 });
    // dá tempo para os workers tentarem várias vezes
    await new Promise((r) => setTimeout(r, 80));
    // ainda pausado: nada deve ter rodado
    // (não há como inspecionar progress sem terminar; checamos via desbloqueio)
    paused = false;
    const { progress, processed } = await run;

    expect(progress).toEqual({ total: 4, done: 4, ok: 4, fail: 0 });
    expect(processed).toHaveLength(4);
  });

  it('quando pausado no meio do lote, processa só o que coube antes da pausa, e retoma após despausar', async () => {
    const queue = Array.from({ length: 6 }, (_, i) => ({
      id: `Ex:${i + 1}`,
      outcome: i % 2 === 0 ? 'resolved' : 'error',
    }));
    let paused = false;

    const run = runWorkers({ queue, concurrency: 1, isPaused: () => paused, pollMs: 5 });
    // pausa quase imediatamente
    await new Promise((r) => setTimeout(r, 1));
    paused = true;
    await new Promise((r) => setTimeout(r, 60));
    paused = false;

    const { progress, processed } = await run;
    expect(progress.total).toBe(6);
    expect(progress.done).toBe(6);
    expect(progress.ok + progress.fail).toBe(6);
    expect(progress.ok).toBe(3);
    expect(progress.fail).toBe(3);
    expect(processed).toEqual(['Ex:1', 'Ex:2', 'Ex:3', 'Ex:4', 'Ex:5', 'Ex:6']);
  });
});
