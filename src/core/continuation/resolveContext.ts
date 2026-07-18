/**
 * resolveContext — normaliza a entrada do Reader em um
 * `ContinuationContext` estável para as demais etapas do pipeline.
 *
 * Puro: nunca acessa Supabase, KnowledgeGraph, DOM ou React.
 * Nas fases seguintes ganhará: tempo litúrgico, progresso do usuário,
 * favoritos, histórico. Hoje entrega apenas normalização defensiva.
 */

import type {
  ContinuationContext,
  ContinuationInput,
  ContinuationKind,
} from './types';
import type { KnowledgeNodeKind } from '@/core/knowledge/types';

/** Mapa 1:1 do `ContinuationKind` para o vocabulário do grafo. */
const KIND_TO_GRAPH: Record<ContinuationKind, KnowledgeNodeKind | 'journey-step'> = {
  bible: 'bible',
  catechism: 'catechism',
  magisterium: 'magisterium',
  saint: 'saint',
  'journey-step': 'journey-step',
};

export function resolveContext(input: ContinuationInput): ContinuationContext {
  return {
    kind: input.kind,
    graphKind: KIND_TO_GRAPH[input.kind],
    id: input.id,
    graphNodeId: input.graphNodeId,
    themeIds: input.themeIds ? [...input.themeIds] : [],
    meta: input.meta ? { ...input.meta } : {},
    resolvedAt: new Date(),
  };
}
