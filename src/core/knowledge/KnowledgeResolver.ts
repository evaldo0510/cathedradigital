/**
 * KnowledgeResolver — traduz `KnowledgeNodeId` opaco em um descritor
 * pronto para render: `{ node, url }`.
 *
 * Única ponte entre o grafo de conhecimento e o RouteRegistry.
 * Componentes/adapters usam apenas `resolve()` — nunca constroem URL.
 */

import { KnowledgeRegistry } from './KnowledgeRegistry';
import type { KnowledgeNodeId, ResolvedNode } from './types';
import { RouteRegistry } from '@/core/navigation';

function urlFor(node: ReturnType<typeof KnowledgeRegistry.getNode>): string | null {
  if (!node?.route) return null;
  try {
    return RouteRegistry.resolve(node.route, node.routeParams ?? {});
  } catch {
    // parâmetro faltando ou rota removida — deixa o consumidor lidar.
    return null;
  }
}

export const KnowledgeResolver = {
  resolve(id: KnowledgeNodeId): ResolvedNode | null {
    const node = KnowledgeRegistry.getNode(id);
    if (!node) return null;
    return { node, url: urlFor(node) };
  },
  resolveMany(ids: KnowledgeNodeId[]): ResolvedNode[] {
    return ids
      .map((id) => this.resolve(id))
      .filter((x): x is ResolvedNode => Boolean(x));
  },
};
