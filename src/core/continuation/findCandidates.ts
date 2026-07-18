/**
 * findCandidates — estágio 2 do pipeline.
 *
 * FASE 0: stub controlado. Devolve `[]` quando não há âncoras no grafo
 * (nenhum `graphNodeId` nem `themeIds` resolvíveis). Isso garante que o
 * ContinuationEngine caia no fallback editorial da Sprint 1 sem regressão.
 *
 * Fase 2 (futura) reintroduzirá a coleta a partir do KnowledgeGraph com
 * `reasons[]` explícitos por aresta.
 */

import type { ContinuationCandidate, ContinuationContext } from './types';

export function findCandidates(_ctx: ContinuationContext): ContinuationCandidate[] {
  // Placeholder consciente. A Fase 2 substitui pela consulta real ao grafo.
  return [];
}
