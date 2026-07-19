import { describe, it, expect } from 'vitest';
import { RouteRegistry } from '../RouteRegistry';
import type { RouteKey } from '../types';

/**
 * Regressão do P0 (Nexus/RouteRegistry): garantir que nenhuma chave resolve
 * para o prefixo antigo /estudar/* que causava 404 (rota inexistente no App).
 */

const FIXTURES: Record<RouteKey, Record<string, string | number>> = {
  'atrium': {},
  'env.estudar': {},
  'env.rezar': {},
  'env.formar-se': {},
  'env.pesquisar': {},
  'env.minha-jornada': {},
  'study.composed': { slug: 'esperanca' },
  'study.bible': { book: 'joao', chapter: 6 },
  'study.catechism': { paragraph: 1817 },
  'study.magisterium': { doc: 'spe-salvi' },
  'study.father': { slug: 'santo-agostinho' },
  'study.saint': { slug: 'santa-teresinha' },
  'pray.lectio': { slug: 'domingo-14-tempo-comum' },
  'pray.liturgy-today': {},
};

const CANONICAL_PREFIXES = [
  '/', '/bible', '/catechism', '/magisterium',
  '/santos', '/temas', '/biblioteca', '/lectio',
  '/liturgia', '/oracao', '/jornadas', '/buscar', '/hoje',
];

describe('RouteRegistry', () => {
  it('resolve todas as chaves sem lançar exceção', () => {
    (Object.keys(FIXTURES) as RouteKey[]).forEach((key) => {
      expect(() => RouteRegistry.resolve(key, FIXTURES[key])).not.toThrow();
    });
  });

  it('nunca gera prefixo /estudar/* (regressão P0)', () => {
    (Object.keys(FIXTURES) as RouteKey[]).forEach((key) => {
      const url = RouteRegistry.resolve(key, FIXTURES[key]);
      expect(url.startsWith('/estudar/')).toBe(false);
    });
  });

  it('nunca gera prefixo /rezar/* (regressão P0)', () => {
    (Object.keys(FIXTURES) as RouteKey[]).forEach((key) => {
      const url = RouteRegistry.resolve(key, FIXTURES[key]);
      expect(url.startsWith('/rezar/')).toBe(false);
    });
  });

  it('todos os paths começam com um prefixo canônico do App.tsx', () => {
    (Object.keys(FIXTURES) as RouteKey[]).forEach((key) => {
      const url = RouteRegistry.resolve(key, FIXTURES[key]);
      const path = url.split('?')[0];
      const ok = CANONICAL_PREFIXES.some((p) =>
        p === '/' ? path === '/' : path === p || path.startsWith(`${p}/`)
      );
      expect(ok, `Rota "${key}" resolveu para "${url}" sem prefixo canônico`).toBe(true);
    });
  });

  it('resolve query strings preservando params', () => {
    expect(RouteRegistry.resolve('study.catechism', { paragraph: 1817 }))
      .toBe('/catechism?p=1817');
    expect(RouteRegistry.resolve('study.bible', { book: 'joao', chapter: 6 }))
      .toBe('/bible?book=joao&chapter=6');
  });

  it('lança quando params obrigatórios faltam', () => {
    expect(() => RouteRegistry.resolve('study.bible', { book: 'joao' })).toThrow();
  });
});
