/**
 * SearchResult — hit universal de busca sobre conteúdo do Cathedra.
 *
 * Todo adapter que expõe busca (Bíblia, CIC, Magistério, …) devolve a
 * mesma shape, permitindo que a `UniversalSearch` (Sprint 2.0.4B-3)
 * apresente resultados heterogêneos numa única lista.
 */

import type { KnowledgeNodeId, KnowledgeNodeKind } from '@/core/knowledge';

export interface SearchResult {
  /** ID canônico do nó correspondente (resolvível via KnowledgeGraph). */
  nodeId: KnowledgeNodeId;
  /** Natureza do resultado — usada para agrupamento e ícone. */
  kind: KnowledgeNodeKind;
  /** Rótulo curto exibido na lista. */
  label: string;
  /** Trecho de contexto do hit (opcional). */
  snippet?: string;
  /** Score 0..1 — maior = mais relevante. */
  score?: number;
}
