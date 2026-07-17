/**
 * KnowledgeIndex — busca textual sobre nós do KnowledgeRegistry.
 *
 * Normalização simples (lowercase + remoção de acentos).
 * SearchRegistry poderá delegar a este índice na Sprint 2.0.5+.
 */

import { KnowledgeRegistry } from './KnowledgeRegistry';
import type { KnowledgeNode, KnowledgeNodeKind } from './types';

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export interface KnowledgeSearchOptions {
  kinds?: KnowledgeNodeKind[];
  limit?: number;
}

export const KnowledgeIndex = {
  search(query: string, opts: KnowledgeSearchOptions = {}): KnowledgeNode[] {
    const q = normalize(query.trim());
    if (!q) return [];
    const { kinds, limit = 20 } = opts;
    const pool = kinds
      ? kinds.flatMap((k) => KnowledgeRegistry.nodesByKind(k))
      : KnowledgeRegistry.allNodes();
    return pool
      .filter((n) => {
        const hay = `${n.label} ${n.summary ?? ''}`;
        return normalize(hay).includes(q);
      })
      .slice(0, limit);
  },
};
