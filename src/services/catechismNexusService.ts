/**
 * catechismNexusService — leitura das relações curadas do Nexus ligadas
 * a um parágrafo (ou faixa de parágrafos) do Catecismo.
 *
 * Lê `public.nexus_relations` nas DUAS direções:
 *   catechism_paragraph → X   (o § aponta para santos, bíblia, patrística…)
 *   X → catechism_paragraph   (santos/verbetes que apontam para o §)
 *
 * Não conhece UI nem rotas: devolve arestas normalizadas
 * (`CuratedNexusEdge`) para o merge do grafo.
 */

import { supabase } from '@/integrations/supabase/client';
import type { CuratedNexusEdge } from '@/core/knowledge/adapters/nexusGraphMerge';
import { withCentrality } from './nexusCentrality';

interface RawRow {
  relation_type: string;
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
 * Arestas curadas de uma faixa de parágrafos (tipicamente o artigo atual).
 * Devolve lista deduplicada por (kind, ref).
 */
export async function getCatechismCuratedEdges(
  from: number,
  to: number,
): Promise<CuratedNexusEdge[]> {
  if (!Number.isFinite(from) || !Number.isFinite(to)) return [];
  const paragraphs: string[] = [];
  for (let p = Math.max(1, Math.trunc(from)); p <= Math.min(2865, Math.trunc(to)); p += 1) {
    paragraphs.push(String(p));
  }
  if (paragraphs.length === 0) return [];

  const cols =
    'relation_type, source_kind, source_ref, target_kind, target_ref, note';

  const [outgoing, incoming] = await Promise.all([
    supabase
      .from('nexus_relations')
      .select(cols)
      .eq('source_kind', 'catechism_paragraph')
      .in('source_ref->>id', paragraphs)
      .limit(200),
    supabase
      .from('nexus_relations')
      .select(cols)
      .eq('target_kind', 'catechism_paragraph')
      .in('target_ref->>id', paragraphs)
      .limit(200),
  ]);

  const edges: CuratedNexusEdge[] = [];
  const seen = new Set<string>();

  const push = (kind: string, ref: Record<string, unknown> | null, note: string | null) => {
    const id = refId(ref);
    if (!id || kind === 'catechism_paragraph' || kind === 'other') return;
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
