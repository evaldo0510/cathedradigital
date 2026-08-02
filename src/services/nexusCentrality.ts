/**
 * nexusCentrality — enriquece arestas curadas com o grau de centralidade
 * do nó de destino no grafo (`public.nexus_node_degree`).
 *
 * Quanto mais conexões curadas um nó possui, mais central ele é — e mais
 * cedo aparece nas sugestões do Reader. Falha de rede nunca quebra a
 * leitura: sem grau, as arestas voltam com weight 0.
 */

import { supabase } from '@/integrations/supabase/client';
import type { CuratedNexusEdge } from '@/core/knowledge/adapters/nexusGraphMerge';

export async function withCentrality(
  edges: CuratedNexusEdge[],
): Promise<CuratedNexusEdge[]> {
  if (edges.length === 0) return edges;

  const refs = Array.from(new Set(edges.map((e) => e.ref))).slice(0, 200);

  const { data, error } = await supabase
    .from('nexus_node_degree')
    .select('kind, ref, degree')
    .in('ref', refs)
    .limit(500);

  if (error || !data) return edges.map((e) => ({ ...e, weight: 0 }));

  const degrees = new Map<string, number>();
  for (const row of data as Array<{ kind: string | null; ref: string | null; degree: number | null }>) {
    if (!row.kind || !row.ref) continue;
    degrees.set(`${row.kind}#${row.ref}`, row.degree ?? 0);
  }

  return edges.map((e) => ({ ...e, weight: degrees.get(`${e.kind}#${e.ref}`) ?? 0 }));
}
