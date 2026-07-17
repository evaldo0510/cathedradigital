/**
 * Barrel do Knowledge Engine (Sprint 2.0.4).
 * Consumidores importam sempre daqui: `import { KnowledgeRegistry } from '@/core/knowledge'`.
 */

export * from './types';
export { KnowledgeRegistry } from './KnowledgeRegistry';
export {
  KnowledgeNavigator,
  COMPOSED_STUDY_STAGES,
} from './KnowledgeNavigator';
export type { ComposedStudyStep } from './KnowledgeNavigator';
export { KnowledgeResolver } from './KnowledgeResolver';
export { KnowledgeIndex } from './KnowledgeIndex';
export type { KnowledgeSearchOptions } from './KnowledgeIndex';
