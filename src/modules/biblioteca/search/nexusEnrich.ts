/**
 * Sprint B.1 · Onda B.1.2 — Enriquecimento Nexus.
 *
 * Para cada `RawHit` que expôs uma `nexusRef` (kind + ref), consultamos
 * `nexus_relations` em UMA única query bidirecional. O resultado é agregado
 * em `{ total, byKind }` e devolvido ao orchestrator. Sem N+1.
 */
import { supabase } from '@/integrations/supabase/client';
import type { LibraryModule } from '../types';
import type { RawHit } from './searchers';

const NEXUS_TO_MODULE: Record<string, LibraryModule> = {
  glossary: 'glossary',
  bible: 'bible',
  catechism: 'catechism',
  saint: 'saints',
  prayer: 'prayers',
  collection: 'collections',
  journey: 'journeys',
  magisterium: 'magisterium',
  patristic: 'patristics',
  liturgy: 'liturgy',
};

export interface NexusSummary {
  total: number;
  byKind: Partial<Record<LibraryModule, number>>;
}

export async function enrichWithNexus(hits: RawHit[]): Promise<Map<string, NexusSummary>> {
  const refs = hits.filter((h) => h.nexusRef).map((h) => h.nexusRef!);
  if (refs.length === 0) return new Map();

  const kinds = Array.from(new Set(refs.map((r) => r.kind)));
  const values = Array.from(new Set(refs.map((r) => r.ref)));

  const [asSource, asTarget] = await Promise.all([
    supabase
      .from('nexus_relations')
      .select('source_kind, source_ref, target_kind')
      .in('source_kind', kinds)
      .in('source_ref', values),
    supabase
      .from('nexus_relations')
      .select('target_kind, target_ref, source_kind')
      .in('target_kind', kinds)
      .in('target_ref', values),
  ]);

  const map = new Map<string, NexusSummary>();
  const bump = (key: string, otherKind: string) => {
    const entry = map.get(key) ?? { total: 0, byKind: {} };
    entry.total += 1;
    const mod = NEXUS_TO_MODULE[otherKind];
    if (mod) entry.byKind[mod] = (entry.byKind[mod] ?? 0) + 1;
    map.set(key, entry);
  };

  for (const row of asSource.data ?? []) {
    bump(`${row.source_kind}:${row.source_ref}`, row.target_kind);
  }
  for (const row of asTarget.data ?? []) {
    bump(`${row.target_kind}:${row.target_ref}`, row.source_kind);
  }
  return map;
}
