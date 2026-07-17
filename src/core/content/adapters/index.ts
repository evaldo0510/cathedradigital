/**
 * Barrel dos adapters de conteúdo.
 * Novos adapters (fathers, saints, councils, canon) entram nas sub-sprints
 * 2.0.4B-2 e 2.0.4B-3 sem mudar a assinatura pública.
 */

import type { ContentAdapters } from './types';
import { BibleAdapter } from './BibleAdapter';
import { CatechismAdapter } from './CatechismAdapter';
import { MagisteriumAdapter } from './MagisteriumAdapter';

export { BibleAdapter, CatechismAdapter, MagisteriumAdapter };
export type { ContentAdapter, ContentGetParams, ContentAdapters } from './types';

/** Registro default consumido pelo `ReaderService`. */
export const defaultContentAdapters: ContentAdapters = {
  bible: BibleAdapter,
  catechism: CatechismAdapter,
  magisterium: MagisteriumAdapter,
};
