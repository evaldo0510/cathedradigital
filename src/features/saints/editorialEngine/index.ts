/**
 * Saints Editorial Engine — barrel.
 *
 * Motor declarativo que monta a página do santo a partir de dados
 * (`SaintEditorialData`) em uma sequência canônica de blocos reutilizáveis
 * com política skip-if-empty.
 *
 * Fluxo:
 *   data (loader) → buildSaintPage(data) → <SaintAutoPage descriptor={...} />
 *
 * Blocos exportados individualmente para testes/reuso avulso.
 */
export * from './types';
export { buildSaintPage } from './buildSaintPage';
export { SaintAutoPage } from './SaintAutoPage';
export { SaintBioBlock } from './blocks/SaintBioBlock';
export { SaintTimelineBlock } from './blocks/SaintTimelineBlock';
export { SaintVirtuesBlock } from './blocks/SaintVirtuesBlock';
export { SaintWritingsBlock } from './blocks/SaintWritingsBlock';
export { SaintPrayersBlock } from './blocks/SaintPrayersBlock';
export { SaintSourcesBlock } from './blocks/SaintSourcesBlock';
