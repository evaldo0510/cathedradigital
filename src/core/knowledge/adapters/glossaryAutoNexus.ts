/**
 * glossaryAutoNexus — Nexus 100% automático para verbetes do Glossário.
 *
 * Regras:
 *   - Nenhuma URL é construída manualmente. Toda resolução passa por
 *     `KnowledgeGraph.resolve()` → `KnowledgeResolver` → `RouteRegistry`.
 *   - Nós ausentes no `KnowledgeRegistry` são registrados ephemeral
 *     (idempotente) a partir dos campos do verbete.
 *   - Cross-links são derivados por `KnowledgeGraph.neighbors()` e
 *     `KnowledgeIndex.search()`, nunca hardcoded.
 *
 * Contrato: adapters NÃO conhecem UI, React, Supabase. Puramente domínio.
 */

import { KnowledgeGraph } from '../KnowledgeGraph';
import { KnowledgeRegistry } from '../KnowledgeRegistry';
import { buildId, slugify } from '../ids';
import type {
  KnowledgeNode,
  KnowledgeNodeId,
  KnowledgeNodeKind,
  ResolvedNode,
} from '../types';
import type { RouteKey } from '@/core/navigation';
import { recordNexusMetric } from './nexusMetrics';

/* ------------------------------------------------------------------ */
/* Termo de entrada — subset agnóstico ao Supabase                     */
/* ------------------------------------------------------------------ */

export interface GlossaryLike {
  slug: string | null;
  term: string;
  short_definition?: string | null;
  bible_verses?: string[] | null;
  catechism_references?: string[] | null;
  magisterium_references?: string[] | null;
  saints_refs?: string[] | null;
  fathers_refs?: string[] | null;
  liturgy_refs?: string[] | null;
  prayer_refs?: string[] | null;
  journey_refs?: string[] | null;
  nexus_refs?: Array<{ kind?: string; target?: string; label?: string; note?: string }> | null;
}

/* ------------------------------------------------------------------ */
/* Mapa oficial: kind semântico → (KnowledgeNodeKind + RouteKey)       */
/* Substitui o switch hardcoded que existia na página.                 */
/* ------------------------------------------------------------------ */

interface KindSpec {
  kind: KnowledgeNodeKind;
  route: RouteKey | null;
  /** Constrói params da rota a partir do slug/target normalizado. */
  buildRouteParams: (slug: string, raw: string) => Record<string, string | number> | null;
  /** Constrói o slug canônico (ASCII, kebab). Retorna null se inválido. */
  buildSlug: (raw: string) => string | null;
  /** Sub-segmentos opcionais do ID (ex.: capítulo bíblico). */
  buildSub?: (raw: string) => (string | number)[];
  label: string;
}

function slugFrom(raw: string): string | null {
  const s = slugify(raw);
  return s || null;
}

function parseBibleParts(raw: string): { book: string; chapter: number } | null {
  const m = raw.trim().match(/^([1-3]?\s?[A-Za-zÀ-úçÇ]+)\s+(\d{1,3})/);
  if (!m) return null;
  const book = slugify(m[1]);
  const chapter = Number(m[2]);
  if (!book || !Number.isFinite(chapter)) return null;
  return { book, chapter };
}

export const KIND_SPECS: Record<string, KindSpec> = {
  bible: {
    kind: 'bible',
    route: 'study.bible',
    label: 'Escritura',
    buildSlug: (raw) => parseBibleParts(raw)?.book ?? null,
    buildSub: (raw) => {
      const p = parseBibleParts(raw);
      return p ? [p.chapter] : [];
    },
    buildRouteParams: (_slug, raw) => {
      const p = parseBibleParts(raw);
      return p ? { book: p.book, chapter: p.chapter } : null;
    },
  },
  catechism: {
    kind: 'catechism',
    route: 'study.catechism',
    label: 'Catecismo',
    buildSlug: (raw) => {
      const n = raw.replace(/\D+/g, '');
      return n || null;
    },
    buildRouteParams: (slug) => ({ paragraph: Number(slug) }),
  },
  magisterium: {
    kind: 'magisterium',
    route: 'study.magisterium',
    label: 'Magistério',
    buildSlug: slugFrom,
    buildRouteParams: (slug) => ({ doc: slug }),
  },
  saint: {
    kind: 'saint',
    route: 'study.saint',
    label: 'Santo',
    buildSlug: slugFrom,
    buildRouteParams: (slug) => ({ slug }),
  },
  father: {
    kind: 'father',
    route: 'study.father',
    label: 'Padre da Igreja',
    buildSlug: slugFrom,
    buildRouteParams: (slug) => ({ slug }),
  },
  liturgy: {
    kind: 'liturgy',
    route: 'study.liturgy',
    label: 'Liturgia',
    buildSlug: slugFrom,
    buildRouteParams: (slug) => ({ ref: slug }),
  },
  prayer: {
    kind: 'prayer',
    route: 'pray.prayer',
    label: 'Oração',
    buildSlug: slugFrom,
    buildRouteParams: (slug) => ({ slug }),
  },
  journey: {
    kind: 'journey',
    route: 'study.journey',
    label: 'Jornada',
    buildSlug: slugFrom,
    buildRouteParams: (slug) => ({ id: slug }),
  },
  glossary: {
    kind: 'glossary',
    route: 'study.glossary',
    label: 'Verbete',
    buildSlug: slugFrom,
    buildRouteParams: (slug) => ({ slug }),
  },
};

/** Aliases dos `nexus_refs.kind` para as chaves canônicas acima. */
const KIND_ALIASES: Record<string, string> = {
  bible: 'bible',
  escritura: 'bible',
  catechism: 'catechism',
  cic: 'catechism',
  magisterium: 'magisterium',
  magisterio: 'magisterium',
  saint: 'saint',
  santo: 'saint',
  father: 'father',
  padre: 'father',
  liturgy: 'liturgy',
  liturgia: 'liturgy',
  prayer: 'prayer',
  oracao: 'prayer',
  journey: 'journey',
  jornada: 'journey',
  formacao: 'journey',
  glossary: 'glossary',
  term: 'glossary',
  verbete: 'glossary',
};

/* ------------------------------------------------------------------ */
/* Registro ephemeral (idempotente) via KnowledgeRegistry              */
/* ------------------------------------------------------------------ */

export function ensureNode(
  spec: KindSpec,
  raw: string,
  labelOverride?: string,
): KnowledgeNodeId | null {
  if (!raw || !raw.trim()) return null;
  const slug = spec.buildSlug(raw);
  if (!slug) return null;

  let id: KnowledgeNodeId;
  try {
    const sub = spec.buildSub?.(raw) ?? [];
    id = buildId(spec.kind, slug, ...sub);
  } catch {
    return null;
  }

  if (KnowledgeRegistry.hasNode(id)) return id;

  const routeParams = spec.route ? spec.buildRouteParams(slug, raw) : null;
  const node: KnowledgeNode = {
    id,
    kind: spec.kind,
    label: (labelOverride ?? raw).trim(),
    ...(spec.route && routeParams
      ? { route: spec.route, routeParams }
      : {}),
  };
  KnowledgeRegistry.register(node);
  return id;
}

/* ------------------------------------------------------------------ */
/* Resolução                                                           */
/* ------------------------------------------------------------------ */

export interface AutoNexusResult {
  /** ID canônico do verbete atual dentro do KnowledgeGraph. */
  selfId: KnowledgeNodeId | null;
  /** Nós agrupados por kind semântico, prontos para render. */
  byKind: Record<string, ResolvedNode[]>;
  /** Rótulo semântico oficial de cada kind. */
  labels: Record<string, string>;
  /** Nós descobertos automaticamente (neighbors + busca), separados. */
  discovered: ResolvedNode[];
}

const FIELD_TO_KIND: Array<{ field: keyof GlossaryLike; kindKey: string }> = [
  { field: 'bible_verses', kindKey: 'bible' },
  { field: 'catechism_references', kindKey: 'catechism' },
  { field: 'magisterium_references', kindKey: 'magisterium' },
  { field: 'saints_refs', kindKey: 'saint' },
  { field: 'fathers_refs', kindKey: 'father' },
  { field: 'liturgy_refs', kindKey: 'liturgy' },
  { field: 'prayer_refs', kindKey: 'prayer' },
  { field: 'journey_refs', kindKey: 'journey' },
];

function dedupe(nodes: ResolvedNode[]): ResolvedNode[] {
  const seen = new Set<string>();
  const out: ResolvedNode[] = [];
  for (const r of nodes) {
    if (seen.has(r.node.id)) continue;
    seen.add(r.node.id);
    out.push(r);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Cache LRU (memoização por fingerprint)                              */
/* ------------------------------------------------------------------ */

const CACHE_MAX = 64;
const cache = new Map<string, AutoNexusResult>();

/**
 * Fingerprint determinístico do verbete. Mesmos inputs (na mesma ordem)
 * produzem exatamente a mesma chave — exportado para permitir cobertura
 * por testes unitários e uso pelo `nexusMetrics`.
 */
export function _fingerprintGlossary(term: GlossaryLike): string {
  const join = (xs: string[] | null | undefined) => (xs ?? []).join('|');
  return [
    term.slug ?? '',
    join(term.bible_verses),
    join(term.catechism_references),
    join(term.magisterium_references),
    join(term.saints_refs),
    join(term.fathers_refs),
    join(term.liturgy_refs),
    join(term.prayer_refs),
    join(term.journey_refs),
    (term.nexus_refs ?? []).map((r) => `${r?.kind ?? ''}:${r?.target ?? ''}`).join('|'),
  ].join('#');
}

/** Testes/hot-reload podem limpar a cache. */
export function clearAutoNexusCache(): void {
  cache.clear();
}

export function resolveAutoNexus(term: GlossaryLike): AutoNexusResult {
  const key = _fingerprintGlossary(term);
  const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const hit = cache.get(key);
  if (hit) {
    // move-to-end para LRU simples
    cache.delete(key);
    cache.set(key, hit);
    recordNexusMetric({ adapter: 'glossary', hit: true, ms: nowMs() - started, key });
    return hit;
  }
  const result = computeAutoNexus(term);
  cache.set(key, result);
  if (cache.size > CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  recordNexusMetric({ adapter: 'glossary', hit: false, ms: nowMs() - started, key });
  return result;
}

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function computeAutoNexus(term: GlossaryLike): AutoNexusResult {
  const byKind: Record<string, ResolvedNode[]> = {};
  const push = (kindKey: string, id: KnowledgeNodeId) => {
    const resolved = KnowledgeGraph.resolve(id);
    if (!resolved) return;
    (byKind[kindKey] ??= []).push(resolved);
  };

  // 1. Registra o próprio verbete como nó de conhecimento.
  const selfId = term.slug
    ? ensureNode(KIND_SPECS.glossary, term.slug, term.term)
    : null;

  // 2. Ingesta dos arrays estruturados do verbete.
  for (const { field, kindKey } of FIELD_TO_KIND) {
    const raws = (term[field] as string[] | null | undefined) ?? [];
    const spec = KIND_SPECS[kindKey];
    for (const raw of raws) {
      const id = ensureNode(spec, raw);
      if (id) push(kindKey, id);
    }
  }

  // 3. Ingesta dos nexus_refs livres.
  for (const ref of term.nexus_refs ?? []) {
    const alias = (ref?.kind ?? '').toLowerCase().trim();
    const kindKey = KIND_ALIASES[alias];
    const target = (ref?.target ?? '').toString();
    if (!kindKey || !target) continue;
    const spec = KIND_SPECS[kindKey];
    const id = ensureNode(spec, target, ref?.label);
    if (id) push(kindKey, id);
  }

  // 4. Descoberta automática via KnowledgeGraph.
  const discoveredIds = new Set<KnowledgeNodeId>();

  if (selfId) {
    KnowledgeGraph.neighbors(selfId).forEach((n) => discoveredIds.add(n.id));
  }

  // Busca semântica pelo próprio termo (excluindo o self).
  KnowledgeGraph.search(term.term, { limit: 12 }).forEach((n) => {
    if (n.id !== selfId) discoveredIds.add(n.id);
  });

  const discoveredResolved = KnowledgeGraph.resolveMany(Array.from(discoveredIds));

  // 5. Distribui descobertas nos grupos que ainda estão vazios,
  //    para que Bíblia/Catecismo/etc. possam se auto-popular.
  for (const r of discoveredResolved) {
    const k = r.node.kind;
    const kindKey =
      k === 'bible' || k === 'catechism' || k === 'magisterium' ||
      k === 'saint' || k === 'father' || k === 'liturgy' ||
      k === 'prayer' || k === 'journey' || k === 'glossary'
        ? k
        : null;
    if (!kindKey) continue;
    (byKind[kindKey] ??= []).push(r);
  }

  // Deduplica por bucket.
  for (const k of Object.keys(byKind)) byKind[k] = dedupe(byKind[k]);

  const labels: Record<string, string> = {};
  for (const [k, spec] of Object.entries(KIND_SPECS)) labels[k] = spec.label;

  return {
    selfId,
    byKind,
    labels,
    discovered: dedupe(discoveredResolved),
  };
}
