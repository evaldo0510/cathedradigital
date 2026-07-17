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
  'study.composed':       { template: '/estudar/tema/:slug',                requires: ['slug'] },
  'study.bible':          { template: '/estudar/biblia/:book/:chapter',    requires: ['book', 'chapter'] },
  'study.catechism':      { template: '/estudar/catecismo/:paragraph',     requires: ['paragraph'] },
  'study.magisterium':    { template: '/estudar/magisterio/:doc',          requires: ['doc'] },
  'study.father':         { template: '/estudar/padres/:slug',             requires: ['slug'] },
  'study.saint':          { template: '/estudar/santos/:slug',             requires: ['slug'] },
  'pray.lectio':          { template: '/rezar/lectio/:slug',               requires: ['slug'] },
  'pray.liturgy-today':   { template: '/rezar/liturgia/hoje' },
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
