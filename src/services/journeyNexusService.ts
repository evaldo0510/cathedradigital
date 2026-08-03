/**
 * journeyNexusService — leitura das relações CURADAS do Nexus ligadas a
 * uma jornada, nas duas direções:
 *
 *   journey → X   (a jornada aponta para santos, CIC, Bíblia, orações…)
 *   X → journey   (verbetes/santos que apontam para a jornada)
 *
 * Não conhece UI nem rotas: devolve `CuratedNexusEdge[]` normalizado,
 * já enriquecido com centralidade (`nexus_node_degree`).
 */

import { supabase } from '@/integrations/supabase/client';
import type { CuratedNexusEdge } from '@/core/knowledge/adapters/nexusGraphMerge';
import { withCentrality } from './nexusCentrality';

interface RawRow {
  source_kind: string;
  source_ref: Record<string, unknown> | null;
  target_kind: string;
  target_ref: Record<string, unknown> | null;
  note: string | null;
}

function refId(ref: Record<string, unknown> | null): string | null {
  if (!ref) return null;
  for (const k of ['slug', 'id', 'ref'] as const) {
    const v = ref[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return null;
}

function refTitle(ref: Record<string, unknown> | null): string | null {
  const t = ref?.title;
  return typeof t === 'string' && t.trim() ? t.trim() : null;
}

/**
 * @param keys identificadores aceitos da jornada (slug e/ou id).
 */
export async function getJourneyCuratedEdges(
  keys: readonly string[],
): Promise<CuratedNexusEdge[]> {
  const ids = Array.from(new Set(keys.filter((k) => typeof k === 'string' && k.trim())));
  if (ids.length === 0) return [];

  const cols = 'source_kind, source_ref, target_kind, target_ref, note';

  const [outgoing, incoming] = await Promise.all([
    supabase
      .from('nexus_relations')
      .select(cols)
      .eq('source_kind', 'journey')
      .in('source_ref->>slug', ids)
      .limit(200),
    supabase
      .from('nexus_relations')
      .select(cols)
      .eq('target_kind', 'journey')
      .in('target_ref->>slug', ids)
      .limit(200),
  ]);

  const edges: CuratedNexusEdge[] = [];
  const seen = new Set<string>();

  const push = (kind: string, ref: Record<string, unknown> | null, note: string | null) => {
    const id = refId(ref);
    if (!id || kind === 'journey' || kind === 'other') return;
    const key = `${kind}#${id}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ kind, ref: id, title: refTitle(ref), note });
  };

  for (const row of ((outgoing.data ?? []) as unknown as RawRow[])) {
    push(row.target_kind, row.target_ref, row.note);
  }
  for (const row of ((incoming.data ?? []) as unknown as RawRow[])) {
    push(row.source_kind, row.source_ref, row.note);
  }

  return withCentrality(edges);
}
