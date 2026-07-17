/**
 * KnowledgeNavigator — semântica de navegação sobre o grafo.
 *
 * Fornece as operações que o resto do sistema precisa sem que os
 * consumidores conheçam a estrutura interna do KnowledgeRegistry.
 */

import { KnowledgeRegistry } from './KnowledgeRegistry';
import type {
  KnowledgeNode,
  KnowledgeNodeId,
  KnowledgeNodeKind,
  KnowledgeRelationKind,
} from './types';

/** Ordem canônica de estágios do Estudo Composto (P0 do Cathedra 2.0). */
export const COMPOSED_STUDY_STAGES: {
  stage: string;
  kind: KnowledgeNodeKind;
  relation: KnowledgeRelationKind;
}[] = [
  { stage: 'bible',       kind: 'bible',       relation: 'develops' },
  { stage: 'catechism',   kind: 'catechism',   relation: 'defined-in' },
  { stage: 'magisterium', kind: 'magisterium', relation: 'develops' },
  { stage: 'fathers',     kind: 'father',      relation: 'commented-by' },
  { stage: 'saints',      kind: 'saint',       relation: 'commented-by' },
  { stage: 'application', kind: 'application', relation: 'applies-to' },
  { stage: 'prayer',      kind: 'prayer',      relation: 'prayed-as' },
];

export interface ComposedStudyStep {
  stage: string;
  node: KnowledgeNode;
}

export const KnowledgeNavigator = {
  /**
   * Estudo Composto de um tema.
   * Para cada estágio canônico, escolhe o primeiro vizinho compatível
   * (ordenado por `weight` descendente).
   */
  composedStudy(themeId: KnowledgeNodeId): ComposedStudyStep[] {
    const steps: ComposedStudyStep[] = [];
    for (const stage of COMPOSED_STUDY_STAGES) {
      const candidates = KnowledgeRegistry.relationsFrom(themeId, stage.relation)
        .map((r) => ({ rel: r, node: KnowledgeRegistry.getNode(r.to) }))
        .filter((x): x is { rel: typeof x.rel; node: KnowledgeNode } => Boolean(x.node) && x.node.kind === stage.kind)
        .sort((a, b) => (b.rel.weight ?? 0) - (a.rel.weight ?? 0));
      if (candidates.length) {
        steps.push({ stage: stage.stage, node: candidates[0].node });
      }
    }
    return steps;
  },

  /**
   * Rede-ego: nó + vizinhos até `depth` saltos (BFS).
   * Não segue arestas repetidas.
   */
  expand(id: KnowledgeNodeId, depth = 1): KnowledgeNode[] {
    const seen = new Set<KnowledgeNodeId>([id]);
    let frontier: KnowledgeNodeId[] = [id];
    for (let d = 0; d < depth; d += 1) {
      const next: KnowledgeNodeId[] = [];
      for (const cur of frontier) {
        for (const n of KnowledgeRegistry.neighbors(cur)) {
          if (!seen.has(n.id)) {
            seen.add(n.id);
            next.push(n.id);
          }
        }
      }
      frontier = next;
      if (!frontier.length) break;
    }
    return Array.from(seen)
      .map((nid) => KnowledgeRegistry.getNode(nid))
      .filter((n): n is KnowledgeNode => Boolean(n));
  },

  /**
   * Menor caminho entre dois nós (BFS não-ponderado).
   * Retorna `null` se não houver caminho.
   */
  pathBetween(from: KnowledgeNodeId, to: KnowledgeNodeId): KnowledgeNode[] | null {
    if (from === to) {
      const n = KnowledgeRegistry.getNode(from);
      return n ? [n] : null;
    }
    const prev = new Map<KnowledgeNodeId, KnowledgeNodeId>();
    const queue: KnowledgeNodeId[] = [from];
    const visited = new Set<KnowledgeNodeId>([from]);
    while (queue.length) {
      const cur = queue.shift()!;
      for (const n of KnowledgeRegistry.neighbors(cur)) {
        if (visited.has(n.id)) continue;
        visited.add(n.id);
        prev.set(n.id, cur);
        if (n.id === to) {
          const path: KnowledgeNodeId[] = [to];
          let step = to;
          while (prev.has(step)) {
            step = prev.get(step)!;
            path.unshift(step);
          }
          return path
            .map((pid) => KnowledgeRegistry.getNode(pid))
            .filter((x): x is KnowledgeNode => Boolean(x));
        }
        queue.push(n.id);
      }
    }
    return null;
  },
};
