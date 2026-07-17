/**
 * KnowledgeGraph — fachada pública única do domínio de conhecimento
 * (Sprint 2.0.4A).
 *
 * A partir de agora, TODO consumidor externo (adapters, módulos, hooks)
 * deve conversar apenas com `KnowledgeGraph`. Registry, Navigator,
 * Resolver, Index e Collection são detalhes de implementação e podem
 * mudar de forma sem quebrar consumidores.
 *
 *   KnowledgeGraph
 *     ├── findNode / hasNode / allNodes / nodesByKind
 *     ├── neighbors / expand / pathBetween
 *     ├── study            (Estudo Composto)
 *     ├── search           (busca textual)
 *     ├── resolve          (nó → { node, url })
 *     └── collections / collection / membersOf / collectionsOf
 */

import { KnowledgeRegistry } from './KnowledgeRegistry';
import {
  KnowledgeNavigator,
  type ComposedStudyStep,
} from './KnowledgeNavigator';
import { KnowledgeResolver } from './KnowledgeResolver';
import { KnowledgeIndex, type KnowledgeSearchOptions } from './KnowledgeIndex';
import {
  KnowledgeCollectionRegistry,
  type KnowledgeCollectionDescriptor,
  type KnowledgeCollectionId,
} from './KnowledgeCollection';
import type {
  KnowledgeNode,
  KnowledgeNodeId,
  KnowledgeNodeKind,
  KnowledgeRelation,
  KnowledgeRelationKind,
  ResolvedNode,
} from './types';

export const KnowledgeGraph = {
  // --- nós ---
  findNode(id: KnowledgeNodeId): KnowledgeNode | undefined {
    return KnowledgeRegistry.getNode(id);
  },
  hasNode(id: KnowledgeNodeId): boolean {
    return KnowledgeRegistry.hasNode(id);
  },
  allNodes(): KnowledgeNode[] {
    return KnowledgeRegistry.allNodes();
  },
  nodesByKind(kind: KnowledgeNodeKind): KnowledgeNode[] {
    return KnowledgeRegistry.nodesByKind(kind);
  },

  // --- relações ---
  relationsFrom(id: KnowledgeNodeId, kind?: KnowledgeRelationKind): KnowledgeRelation[] {
    return KnowledgeRegistry.relationsFrom(id, kind);
  },
  relationsTo(id: KnowledgeNodeId, kind?: KnowledgeRelationKind): KnowledgeRelation[] {
    return KnowledgeRegistry.relationsTo(id, kind);
  },
  neighbors(id: KnowledgeNodeId): KnowledgeNode[] {
    return KnowledgeRegistry.neighbors(id);
  },

  // --- navegação ---
  expand(id: KnowledgeNodeId, depth = 1): KnowledgeNode[] {
    return KnowledgeNavigator.expand(id, depth);
  },
  pathBetween(from: KnowledgeNodeId, to: KnowledgeNodeId): KnowledgeNode[] | null {
    return KnowledgeNavigator.pathBetween(from, to);
  },
  study(themeId: KnowledgeNodeId): ComposedStudyStep[] {
    return KnowledgeNavigator.composedStudy(themeId);
  },

  // --- busca ---
  search(query: string, opts?: KnowledgeSearchOptions): KnowledgeNode[] {
    return KnowledgeIndex.search(query, opts);
  },

  // --- resolução para UI ---
  resolve(id: KnowledgeNodeId): ResolvedNode | null {
    return KnowledgeResolver.resolve(id);
  },
  resolveMany(ids: KnowledgeNodeId[]): ResolvedNode[] {
    return KnowledgeResolver.resolveMany(ids);
  },

  // --- coleções ---
  collections(): KnowledgeCollectionDescriptor[] {
    return KnowledgeCollectionRegistry.all();
  },
  collection(id: KnowledgeCollectionId): KnowledgeCollectionDescriptor | undefined {
    return KnowledgeCollectionRegistry.get(id);
  },
  membersOf(id: KnowledgeCollectionId): KnowledgeNode[] {
    return KnowledgeCollectionRegistry.members(id);
  },
  collectionsOf(nodeId: KnowledgeNodeId): KnowledgeCollectionDescriptor[] {
    return KnowledgeCollectionRegistry.collectionsOf(nodeId);
  },
};

export type { ComposedStudyStep, KnowledgeSearchOptions };
export type { KnowledgeCollectionDescriptor, KnowledgeCollectionId };
