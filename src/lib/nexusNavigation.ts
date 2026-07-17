/**
 * Handler central para navegação do Nexus Theologicus.
 *
 * REGRA INEGOCIÁVEL: toda referência (Catecismo, Bíblia, tag, santo) DEVE abrir
 * dentro do Cathedra por rota interna. Nenhum destino externo é permitido.
 * Qualquer novo tipo de referência precisa passar por aqui.
 */

import { AppRoute } from '@/types';
import type { NavigateFunction } from 'react-router-dom';

export const CATECHISM_MIN = 1;
export const CATECHISM_MAX = 2865;

/** Retorna true se o número de parágrafo do CIC é válido (1..2865, inteiro). */
export function isValidCatechismParagraph(value: unknown): value is number {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return (
    typeof n === 'number' &&
    Number.isFinite(n) &&
    Number.isInteger(n) &&
    n >= CATECHISM_MIN &&
    n <= CATECHISM_MAX
  );
}

/**
 * Caminho interno para um parágrafo do Catecismo.
 * - Válido → `/catechism?p=N` (canônico, ver src/lib/queryParams.ts).
 * - Inválido → `/catechism` (fallback seguro, sem crash).
 */
export function catechismInternalPath(paragraph: unknown): string {
  if (!isValidCatechismParagraph(paragraph)) return AppRoute.CATECHISM;
  const n = typeof paragraph === 'string' ? Number(paragraph) : (paragraph as number);
  return `${AppRoute.CATECHISM}?p=${n}`;
}

export type NexusRef =
  | { kind: 'catechism'; paragraph: number }
  | { kind: 'tag'; slug: string }
  | { kind: 'saint'; slug: string }
  | { kind: 'bible'; book: string; chapter: number; verse?: number };

/** Handler único: converte qualquer referência do Nexus em navegação interna. */
export function openNexusRef(navigate: NavigateFunction, ref: NexusRef): void {
  switch (ref.kind) {
    case 'catechism':
      navigate(catechismInternalPath(ref.paragraph));
      return;
    case 'tag':
      navigate(`${AppRoute.TEMAS}/${ref.slug}`);
      return;
    case 'saint':
      navigate(`${AppRoute.SANTOS}/${ref.slug}`);
      return;
    case 'bible': {
      const verse = ref.verse ? `:${ref.verse}` : '';
      navigate(`${AppRoute.BIBLE}?ref=${encodeURIComponent(`${ref.book} ${ref.chapter}${verse}`)}`);
      return;
    }
  }
}
