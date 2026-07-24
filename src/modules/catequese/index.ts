/**
 * Cathedra · Módulo Catequese — barrel público (Sprint CQ-1.2).
 *
 * Superfície única de import para o módulo Catequese. Consumidores externos
 * (App.tsx, prefetch, adapters, testes E2E) devem importar sempre a partir de
 * `@/modules/catequese`, nunca dos paths internos. Isso permite mover arquivos
 * dentro do módulo sem impacto externo (COS §10 · Reader Architecture Rule).
 *
 * Regra ESLint prevista (CQ-1.4): proibir `@/modules/catequese/**` dentro do
 * próprio módulo — o barrel só reexporta.
 */

export { default as Catechism } from './reader/Catechism';
export { default as AtriumCatechismReader } from './reader/AtriumCatechismReader';
export { default as CatechismExplorer } from './explorer/CatechismExplorer';
export { default as CatechismImportQueue } from './admin/CatechismImportQueue';

export { default as CatechismPopover } from './components/CatechismPopover';
export { default as CatechismPendingPanel } from './components/CatechismPendingPanel';
export { default as CatechismOfflineFallback } from './components/CatechismOfflineFallback';
export { default as CatechismDiagnosticPanel } from './components/CatechismDiagnosticPanel';
export { default as CatechismHealthCheck } from './components/CatechismHealthCheck';
export { default as CatechismIntegrity } from './components/CatechismIntegrity';
export { default as CatechismVerification } from './components/CatechismVerification';
export { default as CatechismDebug } from './components/CatechismDebug';
export { CatechismNormalizationDiff } from './components/CatechismNormalizationDiff';
