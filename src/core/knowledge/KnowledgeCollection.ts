/**
 * KnowledgeCollection — conjuntos nomeados de nós (Sprint 2.0.4A).
 *
 * Coleções são a segunda estrutura de primeira classe do domínio,
 * ao lado de nós e relações. Permitem que Biblioteca e Pesquisa
 * naveguem por conjuntos curados (ex.: "Encíclicas", "Evangelhos",
 * "Padres Capadócios", "Concílio Vaticano II") além das relações.
 *
 * Coleções NÃO substituem relações — coexistem. Uma coleção é um
 * agrupamento estático; uma relação é uma aresta semântica.
 */

import { KnowledgeRegistry } from './KnowledgeRegistry';
import type { KnowledgeNode, KnowledgeNodeId } from './types';
import { SEED_COLLECTIONS } from './seed';

export type KnowledgeCollectionId = string; // convenção: `collection:<slug>`

export interface KnowledgeCollectionDescriptor {
  id: KnowledgeCollectionId;
  label: string;
  summary?: string;
  members: KnowledgeNodeId[];
}

const collections = new Map<KnowledgeCollectionId, KnowledgeCollectionDescriptor>();

function ingest(c: KnowledgeCollectionDescriptor) {
  collections.set(c.id, c);
}

SEED_COLLECTIONS.forEach(ingest);

export const KnowledgeCollectionRegistry = {
  get(id: KnowledgeCollectionId): KnowledgeCollectionDescriptor | undefined {
    return collections.get(id);
  },
  has(id: KnowledgeCollectionId): boolean {
    return collections.has(id);
  },
  all(): KnowledgeCollectionDescriptor[] {
    return Array.from(collections.values());
  },
  /** Nós membros de uma coleção, resolvendo cada ID no Registry. */
  members(id: KnowledgeCollectionId): KnowledgeNode[] {
    const c = collections.get(id);
    if (!c) return [];
    return c.members
      .map((mid) => KnowledgeRegistry.getNode(mid))
      .filter((n): n is KnowledgeNode => Boolean(n));
  },
  /** Coleções que contêm o nó informado. */
  collectionsOf(nodeId: KnowledgeNodeId): KnowledgeCollectionDescriptor[] {
    return Array.from(collections.values()).filter((c) => c.members.includes(nodeId));
  },
  register(c: KnowledgeCollectionDescriptor): void {
    ingest(c);
  },
};
