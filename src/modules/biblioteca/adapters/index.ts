/**
 * Sprint B.1 · Onda B.1.1 — Registro central de adapters da Biblioteca.
 * Consumidores devem importar SEMPRE deste barrel para garantir que qualquer
 * novo módulo seja automaticamente incluído em listagens, busca e stats.
 */
import type { LibraryAdapter, LibraryModule } from '../types';
import { glossaryAdapter } from './glossary';
import { bibleAdapter } from './bible';
import { catechismAdapter } from './catechism';
import { saintsAdapter } from './saints';
import { prayersAdapter } from './prayers';
import { collectionsAdapter } from './collections';
import { journeysAdapter } from './journeys';
import { magisteriumAdapter, patristicsAdapter } from './magisterium';
import { liturgyAdapter } from './liturgy';

export const LIBRARY_ADAPTERS: Record<LibraryModule, LibraryAdapter> = {
  glossary: glossaryAdapter,
  bible: bibleAdapter,
  catechism: catechismAdapter,
  saints: saintsAdapter,
  prayers: prayersAdapter,
  collections: collectionsAdapter,
  journeys: journeysAdapter,
  magisterium: magisteriumAdapter,
  patristics: patristicsAdapter,
  liturgy: liturgyAdapter,
};

export const LIBRARY_MODULES = Object.keys(LIBRARY_ADAPTERS) as LibraryModule[];

export { glossaryAdapter, bibleAdapter, catechismAdapter, saintsAdapter, prayersAdapter, collectionsAdapter, journeysAdapter, magisteriumAdapter, patristicsAdapter, liturgyAdapter };
