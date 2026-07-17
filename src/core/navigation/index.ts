/**
 * Barrel dos Contratos Globais (Sprint 2.0.3A).
 * Consumidores importam sempre daqui: `import { RouteRegistry } from '@/core/navigation'`.
 */

export * from './types';
export { EnvironmentRegistry } from './EnvironmentRegistry';
export type { EnvironmentDescriptor } from './EnvironmentRegistry';
export { RouteRegistry } from './RouteRegistry';
export {
  ThemeRegistry,
  COMPOSED_STUDY_ORDER,
} from './ThemeRegistry';
export type {
  ThemeDescriptor,
  ComposedStudyStep,
  ComposedStudyStage,
} from './ThemeRegistry';
export { SearchRegistry } from './SearchRegistry';
export type { SearchResult, SearchResultKind } from './SearchRegistry';
