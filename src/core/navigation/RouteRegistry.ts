/**
 * RouteRegistry — única fonte de rotas canônicas.
 *
 * Consumidores usam `RouteRegistry.resolve('study.bible', { book, chapter })`
 * em vez de escrever `/estudar/biblia/${book}/${chapter}`.
 *
 * Se uma rota mudar, altera-se aqui. Zero refactor nos consumidores.
 */

import type { RouteKey } from './types';

type Params = Record<string, string | number>;

interface RouteEntry {
  /** Template com placeholders `:name`. */
  template: string;
  /** Parâmetros obrigatórios (validação leve). */
  requires?: string[];
}

const ROUTES: Record<RouteKey, RouteEntry> = {
  'atrium':               { template: '/' },
  'env.estudar':          { template: '/bible' },
  'env.rezar':            { template: '/oracao' },
  'env.formar-se':        { template: '/jornadas' },
  'env.pesquisar':        { template: '/buscar' },
  'env.minha-jornada':    { template: '/hoje' },
  // Rotas de estudo — alinhadas às rotas reais registradas em src/App.tsx.
  // Antes usavam prefixo /estudar/* que não existe e causava 404 no Nexus.
  'study.composed':       { template: '/temas/:slug',                     requires: ['slug'] },
  'study.bible':          { template: '/bible?book=:book&chapter=:chapter', requires: ['book', 'chapter'] },
  'study.catechism':      { template: '/catechism?p=:paragraph',           requires: ['paragraph'] },
  'study.magisterium':    { template: '/magisterium/:doc',                 requires: ['doc'] },
  // Rota canônica dos Padres/Doutores. Redireciona internamente para /santos/:slug
  // (Padres estão na tabela `saints` com category='doctor').
  'study.father':         { template: '/biblioteca/padres/:slug',          requires: ['slug'] },
  'study.saint':          { template: '/santos/:slug',                     requires: ['slug'] },
  // Rotas de oração — alinhadas ao App.tsx (/lectio, /liturgia).
  'pray.lectio':          { template: '/lectio?slug=:slug',                requires: ['slug'] },
  'pray.liturgy-today':   { template: '/liturgia' },
};

function apply(template: string, params: Params): string {
  return template.replace(/:([a-zA-Z_]+)/g, (_, name) => {
    const v = params[name];
    if (v === undefined || v === null || v === '') {
      throw new Error(`RouteRegistry: parâmetro obrigatório "${name}" ausente.`);
    }
    return encodeURIComponent(String(v));
  });
}

export const RouteRegistry = {
  resolve(key: RouteKey, params: Params = {}): string {
    const entry = ROUTES[key];
    if (!entry) throw new Error(`RouteRegistry: chave desconhecida "${key}".`);
    (entry.requires ?? []).forEach((k) => {
      if (params[k] === undefined) {
        throw new Error(`RouteRegistry: "${key}" exige parâmetro "${k}".`);
      }
    });
    return apply(entry.template, params);
  },
  has(key: RouteKey): boolean {
    return Boolean(ROUTES[key]);
  },
};
