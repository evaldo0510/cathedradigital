/**
 * NavigationTarget — endereço navegável dentro do Cathedra.
 *
 * Representa "para onde ir a seguir" de forma independente de rota.
 * Consumidores obtêm a URL final via `KnowledgeGraph.resolve()` ou
 * `RouteRegistry.resolve()`.
 */

import type { KnowledgeNodeId } from '@/core/knowledge';
import type { RouteKey } from '@/core/navigation';

export interface NavigationTarget {
  /** ID canônico do nó de conhecimento correspondente. */
  nodeId: KnowledgeNodeId;
  /** Rótulo curto para link/breadcrumb. */
  label: string;
  /** Rota opcional caso o alvo não tenha nó registrado no Knowledge Engine. */
  route?: RouteKey;
  routeParams?: Record<string, string | number>;
}
