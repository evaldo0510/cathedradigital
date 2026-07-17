/**
 * Barrel público do Content Core (Sprint 2.0.4B-1).
 *
 * Consumidores externos importam SOMENTE deste barrel:
 *
 *   import { ReaderService, type ReaderContent } from '@/core/content';
 */

export * from './contracts';
export { ReaderService, createReaderServiceWith } from './services/ReaderService';
export type { ReaderKind, ReaderServiceInstance } from './services/ReaderService';
export {
  BibleAdapter,
  CatechismAdapter,
  MagisteriumAdapter,
  defaultContentAdapters,
} from './adapters';
export type { ContentAdapter, ContentAdapters, ContentGetParams } from './adapters';
