/**
 * scoreCandidates — estágio 3 do pipeline.
 *
 * Converte peso bruto do grafo (0..1) em `score` (0..100) e classifica
 * `confidence` em faixas discretas. Preserva `reasons` para debug e
 * telemetria futura ("por que esta sugestão?").
 *
 * FASE 0: implementação mínima e pura. Fases futuras somam sinais
 * (litúrgico, progresso, histórico) sem mudar a assinatura.
 */

import type {
  ContinuationCandidate,
  ContinuationConfidence,
  ScoredCandidate,
} from './types';

function toConfidence(score: number): ContinuationConfidence {
  if (score >= 75) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

export function scoreCandidates(
  candidates: ContinuationCandidate[],
): ScoredCandidate[] {
  return candidates.map((c) => {
    const clamped = Math.max(0, Math.min(1, c.rawWeight));
    const score = Math.round(clamped * 100);
    return {
      node: c.node,
      intent: c.intent,
      score,
      confidence: toConfidence(score),
      reasons: c.reasons,
    };
  });
}
