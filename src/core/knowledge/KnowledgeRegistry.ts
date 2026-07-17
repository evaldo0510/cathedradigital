/**
 * KnowledgeRegistry — fonte única de nós e relações.
 *
 * Nesta sprint, alimentado por `seed.ts`. Consumidores usam sempre esta
 * API e nunca acessam `seed.ts` diretamente. Quando a origem virar real,
 * `register()` / `relate()` continuam servindo para ingestão dinâmica.
 */

import type {
  KnowledgeNode,
  KnowledgeNodeId,
  KnowledgeNodeKind,
  KnowledgeRelation,
  KnowledgeRelationKind,
} from './types';
import { SEED_NODES, SEED_RELATIONS } from './seed';

const nodes = new Map<KnowledgeNodeId, KnowledgeNode>();
const outgoing = new Map<KnowledgeNodeId, KnowledgeRelation[]>();
const incoming = new Map<KnowledgeNodeId, KnowledgeRelation[]>();

function push<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

function ingestNode(n: KnowledgeNode) {
  nodes.set(n.id, n);
}

function ingestRelation(r: KnowledgeRelation) {
  push(outgoing, r.from, r);
  push(incoming, r.to, r);
}

// Bootstrap com o seed.
SEED_NODES.forEach(ingestNode);
SEED_RELATIONS.forEach(ingestRelation);

export const KnowledgeRegistry = {
  // --- leitura ---
  getNode(id: KnowledgeNodeId): KnowledgeNode | undefined {
    return nodes.get(id);
  },
  hasNode(id: KnowledgeNodeId): boolean {
    return nodes.has(id);
  },
  allNodes(): KnowledgeNode[] {
    return Array.from(nodes.values());
  },
  nodesByKind(kind: KnowledgeNodeKind): KnowledgeNode[] {
    return this.allNodes().filter((n) => n.kind === kind);
  },
  relationsFrom(id: KnowledgeNodeId, kind?: KnowledgeRelationKind): KnowledgeRelation[] {
    const list = outgoing.get(id) ?? [];
    return kind ? list.filter((r) => r.kind === kind) : list;
  },
  relationsTo(id: KnowledgeNodeId, kind?: KnowledgeRelationKind): KnowledgeRelation[] {
    const list = incoming.get(id) ?? [];
    return kind ? list.filter((r) => r.kind === kind) : list;
  },
  /** Vizinhos em 1 salto (union out+in), sem duplicatas. */
  neighbors(id: KnowledgeNodeId): KnowledgeNode[] {
    const ids = new Set<KnowledgeNodeId>();
    (outgoing.get(id) ?? []).forEach((r) => ids.add(r.to));
    (incoming.get(id) ?? []).forEach((r) => ids.add(r.from));
    return Array.from(ids)
      .map((nid) => nodes.get(nid))
      .filter((n): n is KnowledgeNode => Boolean(n));
  },

  // --- ingestão (futuro: backend / usuário) ---
  register(node: KnowledgeNode): void {
    ingestNode(node);
  },
  relate(relation: KnowledgeRelation): void {
    if (!nodes.has(relation.from) || !nodes.has(relation.to)) {
      throw new Error(`KnowledgeRegistry.relate: nó ausente (${relation.from} → ${relation.to}).`);
    }
    ingestRelation(relation);
  },
};
