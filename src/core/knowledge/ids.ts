/**
 * Convenção canônica de IDs do Knowledge Engine (Sprint 2.0.4A).
 *
 * Formato: `<kind>:<slug>[:<sub>...]`
 *   - `kind`   — um dos KnowledgeNodeKind (lowercase, sem acentos).
 *   - `slug`   — kebab-case, ASCII, sem acentos, sem espaços.
 *   - `sub`    — segmentos adicionais opcionais (livro/cap/verso, parágrafo, etc.).
 *
 * Exemplos canônicos (fonte da verdade — nunca variar):
 *   theme:esperanca
 *   bible:joao:3:16
 *   catechism:1817
 *   magisterium:spe-salvi
 *   father:santo-agostinho
 *   saint:santa-teresinha
 *   council:vaticano-ii
 *   canon:983
 *   prayer:lectio-rm-8
 *   application:esperanca-provacao
 *   collection:enciclicas
 *
 * Regras:
 *   1. Nunca misturar variantes ("joao" vs "João" vs "john" vs "Jn"): sempre
 *      slug em português, minúsculo, sem acentos.
 *   2. Números permanecem numéricos (`catechism:1817`, `bible:joao:3:16`).
 *   3. IDs são opacos para consumidores — parseie apenas via helpers abaixo.
 */

import type { KnowledgeNodeId, KnowledgeNodeKind } from './types';

export const KNOWLEDGE_KINDS: readonly KnowledgeNodeKind[] = [
  'theme',
  'bible',
  'catechism',
  'magisterium',
  'father',
  'saint',
  'council',
  'canon',
  'prayer',
  'application',
] as const;

const KIND_SET = new Set<string>(KNOWLEDGE_KINDS);
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEGMENT_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Normaliza um texto para slug canônico (kebab, ASCII, minúsculo). */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Constrói um ID canônico. Lança se algum segmento for inválido. */
export function buildId(
  kind: KnowledgeNodeKind,
  slug: string,
  ...sub: (string | number)[]
): KnowledgeNodeId {
  if (!KIND_SET.has(kind)) {
    throw new Error(`buildId: kind inválido "${kind}".`);
  }
  if (!SLUG_RE.test(slug)) {
    throw new Error(`buildId: slug inválido "${slug}" (use kebab-case ASCII).`);
  }
  const tail = sub.map((s) => {
    const v = String(s);
    if (!SEGMENT_RE.test(v)) {
      throw new Error(`buildId: segmento inválido "${v}".`);
    }
    return v;
  });
  return [kind, slug, ...tail].join(':');
}

export interface ParsedId {
  kind: KnowledgeNodeKind;
  slug: string;
  sub: string[];
}

/** Faz o parse de um ID canônico. Retorna `null` se inválido. */
export function parseId(id: KnowledgeNodeId): ParsedId | null {
  if (typeof id !== 'string' || !id) return null;
  const [kind, slug, ...sub] = id.split(':');
  if (!kind || !slug) return null;
  if (!KIND_SET.has(kind)) return null;
  if (!SLUG_RE.test(slug)) return null;
  if (sub.some((s) => !SEGMENT_RE.test(s))) return null;
  return { kind: kind as KnowledgeNodeKind, slug, sub };
}

/** True se o ID respeita a convenção canônica. */
export function isValidId(id: unknown): id is KnowledgeNodeId {
  return typeof id === 'string' && parseId(id) !== null;
}
