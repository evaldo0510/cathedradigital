/**
 * Sprint B.1 · Onda B.1.4 — Semantic Client (adapter).
 *
 * A UI NUNCA chama MCP direto. Toda descoberta semântica passa por este
 * adapter, que expõe uma interface estável (`SemanticSearcher`) e pode ser
 * trocada por uma implementação com embeddings/RPC sem tocar UI ou ranking.
 *
 * Implementação atual (B.1.4): grafo conceitual leve baseado em
 *   1. glossário publicado (termo canônico + aliases textuais)
 *   2. nexus_relations (co-ocorrência)
 *
 * É deliberadamente conservador: gera `semanticScore` 0..1 sem promessas
 * de embedding. Quando o backend de embeddings existir, basta trocar a
 * implementação registrada em `getSemanticSearcher()`.
 */
import { supabase } from '@/integrations/supabase/client';
import type { LibraryModule } from '../../types';

export interface SemanticHit {
  /** Módulo canônico (mesma escala do resto da Biblioteca). */
  type: LibraryModule;
  /** Ref usado em nexus_relations (ex.: `glossary:eucaristia`). */
  kind: string;
  ref: string;
  /** Título humano (para reason/preview). */
  title: string;
  /** 0..1 — similaridade estimada. */
  score: number;
  /** Frase curta explicando por que o item apareceu. */
  reason: string;
  /** Conceitos que dispararam o match. */
  matchedConcepts: string[];
  /** Aliases detectados (se houver). */
  aliases?: string[];
}

export interface SemanticQuery {
  query: string;
  /** Máx. conceitos-âncora expandidos a partir do glossário. */
  maxAnchors?: number;
  /** Máx. itens relacionados via nexus_relations. */
  maxRelated?: number;
}

export interface SemanticSearcher {
  search(input: SemanticQuery): Promise<SemanticHit[]>;
}

const NEXUS_TO_MODULE: Partial<Record<string, LibraryModule>> = {
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

const normalize = (v: string) =>
  v.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const tokenize = (q: string): string[] => {
  const stop = new Set([
    'de', 'da', 'do', 'das', 'dos', 'a', 'o', 'as', 'os', 'e', 'em',
    'no', 'na', 'nos', 'nas', 'um', 'uma', 'que', 'com', 'para',
  ]);
  return normalize(q)
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !stop.has(t));
};

const like = (q: string) => `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;

/**
 * Implementação B.1.4: concept-graph via glossário + nexus_relations.
 * Retorna hits ordenados por score decrescente, dedup por (kind:ref).
 */
class ConceptGraphSearcher implements SemanticSearcher {
  async search({ query, maxAnchors = 6, maxRelated = 30 }: SemanticQuery): Promise<SemanticHit[]> {
    const tokens = tokenize(query);
    if (tokens.length === 0) return [];

    // 1. Âncoras: verbetes do glossário que casam com QUALQUER token
    //    (term / short_definition / definition). Uma única query por token,
    //    em paralelo — sem N+1 no glossário inteiro.
    const anchorResponses = await Promise.all(
      tokens.map(async (tok) => {
        const l = like(tok);
        const { data } = await supabase
          .from('glossary')
          .select('slug, term, short_definition, category')
          .eq('status', 'published')
          .or(`term.ilike.${l},short_definition.ilike.${l},definition.ilike.${l}`)
          .limit(maxAnchors);
        return { token: tok, rows: data ?? [] };
      }),
    );

    const anchors = new Map<string, {
      slug: string;
      term: string;
      matchedTokens: Set<string>;
      titleHit: boolean;
    }>();
    for (const { token, rows } of anchorResponses) {
      for (const r of rows) {
        if (!r.slug || !r.term) continue;
        const key = r.slug;
        const existing = anchors.get(key) ?? {
          slug: r.slug,
          term: r.term,
          matchedTokens: new Set<string>(),
          titleHit: false,
        };
        existing.matchedTokens.add(token);
        if (normalize(r.term).includes(token)) existing.titleHit = true;
        anchors.set(key, existing);
      }
    }

    const anchorList = Array.from(anchors.values());
    if (anchorList.length === 0) return [];

    // 2. Âncoras viram hits diretos (glossário) com score alto.
    const hits = new Map<string, SemanticHit>();
    const pushHit = (hit: SemanticHit) => {
      const k = `${hit.kind}:${hit.ref}`;
      const prev = hits.get(k);
      if (!prev || hit.score > prev.score) hits.set(k, hit);
    };

    for (const a of anchorList) {
      const conceptCoverage = a.matchedTokens.size / tokens.length;
      const base = a.titleHit ? 0.85 : 0.65;
      const score = Math.min(0.98, base + conceptCoverage * 0.1);
      pushHit({
        type: 'glossary',
        kind: 'glossary',
        ref: a.slug,
        title: a.term,
        score,
        reason: a.titleHit
          ? `Conceito central para "${query}".`
          : `Conceito relacionado a "${Array.from(a.matchedTokens).join(', ')}".`,
        matchedConcepts: [a.term],
      });
    }

    // 3. Expansão: para cada âncora, pega até N relações no nexus_relations
    //    (bidirecional). Uma única query batch por direção.
    // `source_ref`/`target_ref` são JSONB (`{slug}` p/ glossary). Filtramos
    // por `->>slug` e falhamos em silêncio se a query rejeitar — o hit
    // âncora (glossary) já foi empurrado acima.
    const anchorRefs = anchorList.map((a) => a.slug);
    const list = anchorRefs.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(',');
    const titleByAnchor = new Map(anchorList.map((a) => [a.slug, a.term]));

    const extractRef = (json: unknown): string | undefined => {
      if (!json || typeof json !== 'object') return undefined;
      const obj = json as Record<string, unknown>;
      for (const k of ['slug', 'ref'] as const) {
        const v = obj[k];
        if (typeof v === 'string' && v.length > 0) return v;
      }
      return undefined;
    };

    try {
      const [asSource, asTarget] = await Promise.all([
        supabase
          .from('nexus_relations')
          .select('source_ref, target_kind, target_ref, relation_type, note')
          .eq('source_kind', 'glossary')
          .filter('source_ref->>slug', 'in', `(${list})`)
          .limit(maxRelated),
        supabase
          .from('nexus_relations')
          .select('target_ref, source_kind, source_ref, relation_type, note')
          .eq('target_kind', 'glossary')
          .filter('target_ref->>slug', 'in', `(${list})`)
          .limit(maxRelated),
      ]);

      for (const row of asSource.data ?? []) {
        const mod = NEXUS_TO_MODULE[row.target_kind as string];
        if (!mod) continue;
        const anchor = extractRef(row.source_ref) ?? '';
        const target = extractRef(row.target_ref) ?? '';
        if (!target) continue;
        const anchorTerm = titleByAnchor.get(anchor) ?? 'conceito';
        pushHit({
          type: mod,
          kind: String(row.target_kind),
          ref: target,
          title: `${row.target_kind}:${target}`,
          score: 0.55,
          reason: row.note
            ? String(row.note)
            : `Relacionado a "${anchorTerm}" via ${row.relation_type ?? 'nexus'}.`,
          matchedConcepts: [anchorTerm],
        });
      }
      for (const row of asTarget.data ?? []) {
        const mod = NEXUS_TO_MODULE[row.source_kind as string];
        if (!mod) continue;
        const anchor = extractRef(row.target_ref) ?? '';
        const source = extractRef(row.source_ref) ?? '';
        if (!source) continue;
        const anchorTerm = titleByAnchor.get(anchor) ?? 'conceito';
        pushHit({
          type: mod,
          kind: String(row.source_kind),
          ref: source,
          title: `${row.source_kind}:${source}`,
          score: 0.5,
          reason: row.note
            ? String(row.note)
            : `Citado a partir de "${anchorTerm}".`,
          matchedConcepts: [anchorTerm],
        });
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[semanticClient] expansão nexus falhou', err);
    }

    return Array.from(hits.values()).sort((a, b) => b.score - a.score);
  }
}

let INSTANCE: SemanticSearcher = new ConceptGraphSearcher();

/** Permite trocar o adapter em testes (mock) ou quando MCP embeddings existir. */
export function setSemanticSearcher(searcher: SemanticSearcher) {
  INSTANCE = searcher;
}

export function getSemanticSearcher(): SemanticSearcher {
  return INSTANCE;
}
