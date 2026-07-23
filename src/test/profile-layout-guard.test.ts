/**
 * Guarda estática contra regressão do layout do Perfil.
 *
 * O bug: `ContemplativeLayout` recebeu `maxW="max-w-spacing-2xl"` (token de
 * espaçamento ≈ 3rem) no lugar de um token de largura (`max-w-5xl`,
 * `max-w-6xl`, etc.), esmagando todo o Perfil em uma coluna estreita.
 *
 * Este teste garante que ProfilePage nunca reintroduza um token de
 * espaçamento como `maxW` do ContemplativeLayout.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROFILE_PATH = resolve(__dirname, '../components/cathedra/ProfilePage.tsx');

describe('ProfilePage layout width guard', () => {
  const source = readFileSync(PROFILE_PATH, 'utf8');

  it('não usa max-w-spacing-* no ContemplativeLayout', () => {
    // Localiza atributos maxW="..." dentro do arquivo
    const maxWMatches = [...source.matchAll(/maxW=["']([^"']+)["']/g)];
    expect(maxWMatches.length).toBeGreaterThan(0);
    for (const [, value] of maxWMatches) {
      expect(
        value,
        `maxW="${value}" usa token de espaçamento — use max-w-{sm|md|lg|xl|2xl..7xl|full|screen-*}`,
      ).not.toMatch(/max-w-spacing-/);
    }
  });

  it('usa um token de largura conhecido para o container principal', () => {
    // Aceita max-w-{5xl,6xl,7xl,full} + w-full para o ContemplativeLayout raiz
    expect(source).toMatch(/ContemplativeLayout[^>]*maxW=["']max-w-(5xl|6xl|7xl|full)/);
  });
});
