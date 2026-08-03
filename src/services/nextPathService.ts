/**
 * nextPathService — leitura dos dados que alimentam o `nextPathEngine`.
 *
 * Nada de regra de negócio aqui: apenas busca e normaliza
 * (catálogo de jornadas, nós curados do Nexus por jornada e o
 * histórico de conclusão do usuário).
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  JourneyCandidate,
  JourneyNexusNode,
} from '@/core/knowledge/intelligence/nextPathEngine';

export interface NextPathData {
  candidates: JourneyCandidate[];
  nexusByJourney: Map<string, JourneyNexusNode[]>;
  completedJourneyIds: Set<string>;
}

interface RawRef {
  slug?: unknown;
  id?: unknown;
  ref?: unknown;
  title?: unknown;
}

function refKey(ref: RawRef | null): string | null {
  if (!ref) return null;
  for (const k of ['slug', 'id', 'ref'] as const) {
    const v = ref[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return null;
}

function refLabel(ref: RawRef | null, fallback: string): string {
  const t = ref?.title;
  return typeof t === 'string' && t.trim() ? t.trim() : fallback;
}

async function loadNexusByJourney(): Promise<Map<string, JourneyNexusNode[]>> {
  const cols = 'source_kind, source_ref, target_kind, target_ref';
  const [outgoing, incoming, graph] = await Promise.all([
    supabase.from('nexus_relations').select(cols).eq('source_kind', 'journey').limit(1000),
    supabase.from('nexus_relations').select(cols).eq('target_kind', 'journey').limit(1000),
    supabase
      .from('nexus_relations')
      .select(cols)
      .neq('source_kind', 'journey')
      .neq('target_kind', 'journey')
      .limit(4000),
  ]);

  const map = new Map<string, JourneyNexusNode[]>();
  const push = (
    journeyRef: RawRef | null,
    kind: string,
    ref: RawRef | null,
    degree: 1 | 2 = 1,
  ) => {
    const jKey = refKey(journeyRef);
    const nodeRef = refKey(ref);
    if (!jKey || !nodeRef || kind === 'journey' || kind === 'other') return;
    const key = `${kind}#${nodeRef}`;
    const list = map.get(jKey) ?? [];
    if (list.some((n) => n.key === key)) return;
    list.push({ key, kind, label: refLabel(ref, nodeRef), degree });
    map.set(jKey, list);
  };

  type Row = {
    source_kind: string;
    source_ref: RawRef | null;
    target_kind: string;
    target_ref: RawRef | null;
  };

  for (const row of ((outgoing.data ?? []) as unknown as Row[])) {
    push(row.source_ref, row.target_kind, row.target_ref);
  }
  for (const row of ((incoming.data ?? []) as unknown as Row[])) {
    push(row.target_ref, row.source_kind, row.source_ref);
  }

  // Segundo grau: vizinhos (no grafo curado) dos nós citados pela jornada.
  // É o que permite reconhecer que duas jornadas desembocam na mesma
  // região doutrinal mesmo sem citarem exatamente o mesmo parágrafo.
  const neighbors = new Map<string, Array<{ kind: string; ref: RawRef }>>();
  const link = (aKind: string, aRef: RawRef | null, bKind: string, bRef: RawRef | null) => {
    const a = refKey(aRef);
    if (!a || !bRef || bKind === 'journey' || bKind === 'other') return;
    const list = neighbors.get(`${aKind}#${a}`) ?? [];
    list.push({ kind: bKind, ref: bRef });
    neighbors.set(`${aKind}#${a}`, list);
  };
  for (const row of ((graph.data ?? []) as unknown as Row[])) {
    link(row.source_kind, row.source_ref, row.target_kind, row.target_ref);
    link(row.target_kind, row.target_ref, row.source_kind, row.source_ref);
  }

  for (const [jKey, nodes] of Array.from(map.entries())) {
    for (const node of [...nodes]) {
      for (const nb of neighbors.get(node.key) ?? []) {
        push({ slug: jKey }, nb.kind, nb.ref, 2);
      }
    }
  }

  return map;
}

async function loadCompletedJourneyIds(userId: string): Promise<Set<string>> {
  const [stepsRes, progressRes] = await Promise.all([
    supabase.from('journey_steps').select('id, journey_id').limit(5000),
    supabase.from('journey_progress').select('journey_id, step_id').eq('user_id', userId).limit(5000),
  ]);

  const totalByJourney = new Map<string, number>();
  for (const s of (stepsRes.data ?? []) as Array<{ id: string; journey_id: string }>) {
    totalByJourney.set(s.journey_id, (totalByJourney.get(s.journey_id) ?? 0) + 1);
  }

  const doneByJourney = new Map<string, Set<string>>();
  for (const p of (progressRes.data ?? []) as Array<{ journey_id: string; step_id: string }>) {
    const set = doneByJourney.get(p.journey_id) ?? new Set<string>();
    set.add(p.step_id);
    doneByJourney.set(p.journey_id, set);
  }

  const completed = new Set<string>();
  for (const [journeyId, total] of totalByJourney) {
    if (total > 0 && (doneByJourney.get(journeyId)?.size ?? 0) >= total) {
      completed.add(journeyId);
    }
  }
  return completed;
}

export async function getNextPathData(userId?: string | null): Promise<NextPathData> {
  const [journeysRes, nexusByJourney, completedJourneyIds] = await Promise.all([
    supabase
      .from('journeys')
      .select('id, slug, title, subtitle, category, tags, difficulty, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(200),
    loadNexusByJourney(),
    userId ? loadCompletedJourneyIds(userId) : Promise.resolve(new Set<string>()),
  ]);

  return {
    candidates: (journeysRes.data ?? []) as JourneyCandidate[],
    nexusByJourney,
    completedJourneyIds,
  };
}
