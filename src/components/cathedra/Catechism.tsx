/**
 * Shim CQ-1.2 · Reexporta o Reader canônico do módulo Catequese.
 *
 * Mantido temporariamente para compatibilidade com consumidores legados
 * (prefetch, App.tsx, `src/config/reader-modules.ts`). Removido em CQ-1.4
 * após 48h de observação em produção. Não adicionar lógica aqui.
 */
export { default } from '@/modules/catequese/reader/Catechism';
