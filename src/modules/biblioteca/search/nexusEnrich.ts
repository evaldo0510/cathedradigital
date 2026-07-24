/**
 * Sprint B.1 · Onda B.1.2 — Enriquecimento Nexus.
 *
 * `nexus_relations.source_ref` e `target_ref` são JSONB com shape variável
 * (`{slug}` para glossary/prayer, `{ref}` para bíblia/catecismo, etc.).
 * Consultamos via operador `->>` em ambas as chaves, bidirecional, em uma
 * única query por direção. Falhas são silenciosas — a busca lexical continua.
 */
import { supabase } from '@/integrations/supabase/client';
import type { LibraryModule } from '../types';
import type { RawHit } from './searchers';

const NEXUS_TO_MODULE: Record<string, LibraryModule> = {
  glossary: 'glossary',
  bible: 'bible',
  bible_verse: 'bible',
  catechism: 'catechism',
  catechism_paragraph: 'catechism',
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

const REF_KEYS = ['slug', 'ref'] as const;

function extractRef(json: unknown): string | undefined {
  if (!json || typeof json !== 'object') return undefined;
  const obj = json as Record<string, unknown>;
  for (const k of REF_KEYS) {
    const v = obj[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return undefined;
}

export async function enrichWithNexus(hits: RawHit[]): Promise<Map<string, NexusSummary>> {
  const refs = hits.filter((h) => h.nexusRef).map((h) => h.nexusRef!);
  if (refs.length === 0) return new Map();

  const kinds = Array.from(new Set(refs.map((r) => r.kind)));
  const values = Array.from(new Set(refs.map((r) => r.ref)));
  const list = values.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(',');
  const orExpr = REF_KEYS.map((k) => `source_ref->>${k}.in.(${list})`).join(',');
  const orExprTarget = REF_KEYS.map((k) => `target_ref->>${k}.in.(${list})`).join(',');

  try {
    const [asSource, asTarget] = await Promise.all([
      supabase
        .from('nexus_relations')
        .select('source_kind, source_ref, target_kind')
        .in('source_kind', kinds)
        .or(orExpr),
      supabase
        .from('nexus_relations')
        .select('target_kind, target_ref, source_kind')
        .in('target_kind', kinds)
        .or(orExprTarget),
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
      const ref = extractRef(row.source_ref);
      if (!ref) continue;
      bump(`${row.source_kind}:${ref}`, row.target_kind as string);
    }
    for (const row of asTarget.data ?? []) {
      const ref = extractRef(row.target_ref);
      if (!ref) continue;
      bump(`${row.target_kind}:${ref}`, row.source_kind as string);
    }
    return map;
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[enrichWithNexus] falhou', err);
    return new Map();
  }
}
