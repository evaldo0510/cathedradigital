/**
 * Knowledge Engine — tipos de domínio (Sprint 2.0.4).
 *
 * Puramente de domínio. Nada de UI, React, Supabase, fetch.
 */

import type { RouteKey } from '@/core/navigation';

/** Natureza de um nó do grafo de conhecimento. */
export type KnowledgeNodeKind =
  | 'theme'
  | 'bible'
  | 'catechism'
  | 'magisterium'
  | 'father'
  | 'saint'
  | 'council'
  | 'canon'
  | 'prayer'
  | 'application';

/** Tipo semântico de uma aresta entre dois nós. */
export type KnowledgeRelationKind =
  | 'develops'       // Tema → passagem/documento que desenvolve
  | 'cites'          // Documento → passagem citada
  | 'commented-by'   // Passagem/doc → padre/santo que comentou
  | 'defined-in'     // Conceito → CIC/Concílio onde é definido
  | 'applies-to'     // Conceito → aplicação prática
  | 'prayed-as'      // Conceito → oração/lectio correspondente
  | 'related-to';    // Afinidade genérica bidirecional

/** ID canônico opaco: `"<kind>:<slug>[:...]"`. */
export type KnowledgeNodeId = string;

export interface KnowledgeNode {
  id: KnowledgeNodeId;
  kind: KnowledgeNodeKind;
  label: string;
  summary?: string;
  /** Rota canônica no RouteRegistry (opcional; nem todo nó abre uma tela). */
  route?: RouteKey;
  routeParams?: Record<string, string | number>;
}

export interface KnowledgeRelation {
  from: KnowledgeNodeId;
  to: KnowledgeNodeId;
  kind: KnowledgeRelationKind;
  /** Peso 0..1 — usado para ordenação e caminho mínimo. */
  weight?: number;
}

/** Descritor pronto para render devolvido pelo Resolver. */
export interface ResolvedNode {
  node: KnowledgeNode;
  /** URL absoluta resolvida via RouteRegistry, ou `null` se o nó não tem rota. */
  url: string | null;
}
