/**
 * buildSaintPage — pipeline puro que transforma `SaintEditorialData`
 * em um `SaintPageDescriptor` (lista ordenada de blocos).
 *
 * Regras:
 *  - Ordem canônica: header → bio → timeline → virtudes → escritos →
 *    orações → fontes.
 *  - Blocos vazios/nulos são omitidos (skip-if-empty).
 *  - Função pura: mesma entrada → mesma saída. Sem side-effects, sem
 *    dependência de React. Base para testes unitários.
 */
import type {
  SaintBlockDescriptor,
  SaintEditorialData,
  SaintPageDescriptor,
} from './types';

function nonEmpty<T>(arr: T[] | undefined | null): arr is T[] {
  return Array.isArray(arr) && arr.length > 0;
}

export function buildSaintPage(data: SaintEditorialData): SaintPageDescriptor {
  const blocks: SaintBlockDescriptor[] = [];

  if (data.longBio && data.longBio.trim().length > 0) {
    blocks.push({ id: 'bio', data: data.longBio });
  }
  if (nonEmpty(data.timeline)) {
    blocks.push({ id: 'timeline', data: data.timeline });
  }
  if (nonEmpty(data.virtues)) {
    blocks.push({ id: 'virtues', data: data.virtues });
  }
  if (nonEmpty(data.writings)) {
    blocks.push({ id: 'writings', data: data.writings });
  }
  if (nonEmpty(data.prayers)) {
    blocks.push({ id: 'prayers', data: data.prayers });
  }
  if (nonEmpty(data.sources)) {
    blocks.push({ id: 'sources', data: data.sources });
  }

  return { slug: data.slug, header: data.header, blocks };
}
