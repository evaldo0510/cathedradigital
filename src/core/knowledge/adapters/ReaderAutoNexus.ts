/**
 * ReaderAutoNexus — contrato universal para adapters de sugestão
 * automática dos Readers (Bíblia, Catecismo, Magistério, Prayer,
 * Saint, Glossary, Journey, Liturgy).
 *
 * Cada adapter recebe um input tipado do seu domínio e devolve
 * `ReaderAutoNexusOutput` (self + suggestions + byBucket + labels).
 *
 * Regras arquiteturais:
 *   • Sem UI, sem React, sem Supabase.
 *   • Sem URLs literais. Toda resolução via KnowledgeGraph.resolve()
 *     → KnowledgeResolver → RouteRegistry.
 *   • Buckets seguem a ordem canônica declarada pelo adapter.
 */

import { KnowledgeGraph } from '../KnowledgeGraph';
import { KnowledgeRegistry } from '../KnowledgeRegistry';
import type { KnowledgeNodeId, ResolvedNode } from '../types';
import type { ContinuationSuggestion } from '../continuation';
import { KIND_SPECS, ensureNode } from './glossaryAutoNexus';

/* ------------------------------ Tipos ------------------------------ */

export type ReaderNexusBucket =
  | 'bible'
  | 'catechism'
  | 'glossary'
  | 'journey'
  | 'saint'
  | 'father'
  | 'liturgy'
  | 'prayer'
  | 'magisterium';

export interface ReaderAutoNexusOutput {
  selfId: KnowledgeNodeId | null;
  suggestions: ContinuationSuggestion[];
  byBucket: Partial<Record<ReaderNexusBucket, ResolvedNode[]>>;
  labels: Record<string, string>;
}

export interface ReaderAutoNexus<TInput = unknown> {
  /** Identificador do adapter (também usado nas métricas). */
  readonly kind: string;
  /** Rótulo humano curto para dashboards/debug. */
  readonly label: string;
  buildSuggestions(input: TInput): ReaderAutoNexusOutput;
}

/* -------------------------- Rótulos / eyebrows -------------------------- */

export const BUCKET_LABEL: Record<ReaderNexusBucket, string> = {
  bible: 'Escritura',
  catechism: 'Catecismo',
  glossary: 'Glossário',
  journey: 'Jornadas',
  saint: 'Santos',
  father: 'Padres',
  liturgy: 'Liturgia',
  prayer: 'Orações',
  magisterium: 'Magistério',
};

export const BUCKET_EYEBROW: Record<ReaderNexusBucket, string> = {
  bible: 'Meditar na Escritura',
  catechism: 'Aprofundar no Catecismo',
  glossary: 'Estudar o verbete',
  journey: 'Continuar a formação',
  saint: 'Conhecer o santo',
  father: 'Conhecer o Padre da Igreja',
  liturgy: 'Rezar com a Liturgia',
  prayer: 'Rezar agora',
  magisterium: 'Aprofundar no Magistério',
};

export function intentForBucket(
  b: ReaderNexusBucket,
): ContinuationSuggestion['intent'] {
  switch (b) {
    case 'bible': return 'study';
    case 'catechism':
    case 'magisterium': return 'deepen';
    case 'glossary': return 'study';
    case 'journey': return 'apply';
    case 'saint':
    case 'father': return 'meet';
    case 'liturgy':
    case 'prayer': return 'pray';
  }
}

/* -------------------------- Helper compartilhado -------------------------- */

export interface BuildBucketedOptions {
  /** Nó do próprio conteúdo (para telemetria/vizinhança). */
  selfId: KnowledgeNodeId | null;
  /** Ordem canônica dos buckets no resultado final. */
  buckets: readonly ReaderNexusBucket[];
  /** Refs brutas por bucket (strings/números crus). */
  refs: Partial<Record<ReaderNexusBucket, string[]>>;
  /** Consultas semânticas para fallback quando o bucket está vazio. */
  fallbackQueries?: string[];
}

/**
 * Resolve refs → nós → sugestões, na ordem dos buckets.
 * 1) Registra cada ref via `ensureNode` (idempotente).
 * 2) Se algum bucket estiver vazio, usa `KnowledgeGraph.search()` + `neighbors()`.
 * 3) Devolve 1 sugestão por bucket na ordem canônica.
 */
export function buildBucketedSuggestions(
  opts: BuildBucketedOptions,
): { byBucket: Partial<Record<ReaderNexusBucket, ResolvedNode[]>>; suggestions: ContinuationSuggestion[] } {
  const byBucket: Partial<Record<ReaderNexusBucket, ResolvedNode[]>> = {};

  const push = (bucket: ReaderNexusBucket, resolved: ResolvedNode) => {
    if (!resolved?.url) return;
    const arr = (byBucket[bucket] ??= []);
    if (!arr.some((r) => r.node.id === resolved.node.id)) arr.push(resolved);
  };

  // 1. Refs explícitas.
  for (const bucket of opts.buckets) {
    const spec = KIND_SPECS[bucket];
    if (!spec) continue;
    for (const raw of opts.refs[bucket] ?? []) {
      const id = ensureNode(spec, raw);
      if (!id) continue;
      const resolved = KnowledgeGraph.resolve(id);
      if (resolved) push(bucket, resolved);
    }
  }

  // 2. Fallback semântico para buckets vazios.
  const emptyBuckets = opts.buckets.filter((b) => (byBucket[b]?.length ?? 0) === 0);
  if (emptyBuckets.length > 0 && (opts.fallbackQueries?.length ?? 0) > 0) {
    const seen = new Set<KnowledgeNodeId>();
    for (const q of opts.fallbackQueries!) {
      if (!q || q.length < 3) continue;
      const found = KnowledgeGraph.search(q, { limit: 24 });
      for (const n of found) {
        if (seen.has(n.id) || n.id === opts.selfId) continue;
        seen.add(n.id);
        const bucket = (opts.buckets as readonly string[]).includes(n.kind)
          ? (n.kind as ReaderNexusBucket)
          : null;
        if (!bucket || (byBucket[bucket]?.length ?? 0) > 0) continue;
        const resolved = KnowledgeGraph.resolve(n.id);
        if (resolved) push(bucket, resolved);
      }
    }
  }

  // 3. Vizinhança direta como último recurso.
  if (opts.selfId && KnowledgeRegistry.hasNode(opts.selfId)) {
    KnowledgeGraph.neighbors(opts.selfId).forEach((n) => {
      const bucket = (opts.buckets as readonly string[]).includes(n.kind)
        ? (n.kind as ReaderNexusBucket)
        : null;
      if (!bucket || (byBucket[bucket]?.length ?? 0) > 0) return;
      const resolved = KnowledgeGraph.resolve(n.id);
      if (resolved) push(bucket, resolved);
    });
  }

  // 4. Monta sugestões finais (1 por bucket, ordem canônica).
  const suggestions: ContinuationSuggestion[] = [];
  for (const bucket of opts.buckets) {
    const first = byBucket[bucket]?.[0];
    if (!first?.url) continue;
    suggestions.push({
      intent: intentForBucket(bucket),
      eyebrow: BUCKET_EYEBROW[bucket],
      label: first.node.label,
      target: first,
      weight: 1,
    });
  }

  return { byBucket, suggestions };
}

/* ------------------------------ Registry ------------------------------ */

class ReaderAutoNexusRegistryImpl {
  private readonly adapters = new Map<string, ReaderAutoNexus>();

  register<T>(adapter: ReaderAutoNexus<T>): void {
    this.adapters.set(adapter.kind, adapter as ReaderAutoNexus);
  }

  get<T = unknown>(kind: string): ReaderAutoNexus<T> | undefined {
    return this.adapters.get(kind) as ReaderAutoNexus<T> | undefined;
  }

  has(kind: string): boolean {
    return this.adapters.has(kind);
  }

  list(): ReaderAutoNexus[] {
    return Array.from(this.adapters.values());
  }

  /** Somente para testes. */
  _reset(): void {
    this.adapters.clear();
  }
}

export const ReaderAutoNexusRegistry = new ReaderAutoNexusRegistryImpl();
