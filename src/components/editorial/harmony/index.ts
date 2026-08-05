/**
 * CAT-SP4 · Onda B — Harmony primitives
 *
 * Componentes universais slot-based da harmonização arquitetônica.
 * Coexistem com os legados em `../index.tsx` durante a migração (Onda C),
 * substituindo-os lote a lote (2–3 páginas por vez).
 *
 * Uso:
 *   import { EditorialHero, EditorialCard } from '@/components/editorial/harmony';
 */

export { EditorialHero } from './EditorialHero';
export type { EditorialHeroProps } from './EditorialHero';

export { EditorialCard } from './EditorialCard';
export type { EditorialCardProps, EditorialCardDensity } from './EditorialCard';

// Primitivas re-exportadas para manter a coesão do barrel harmonizado
export { EditorialDivider } from '../index';
export { EditorialKicker } from '../primitives';
