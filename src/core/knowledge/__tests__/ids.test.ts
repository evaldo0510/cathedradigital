import { describe, it, expect } from 'vitest';
import { buildId, parseId, isValidId, slugify } from '../ids';

describe('knowledge/ids', () => {
  it('slugify remove acentos e normaliza para kebab', () => {
    expect(slugify('Esperança')).toBe('esperanca');
    expect(slugify('São João Crisóstomo')).toBe('sao-joao-crisostomo');
    expect(slugify('  Concílio  Vaticano II ')).toBe('concilio-vaticano-ii');
  });

  it('buildId aceita kind + slug canônicos e concatena sub-segmentos', () => {
    expect(buildId('theme', 'esperanca')).toBe('theme:esperanca');
    expect(buildId('bible', 'joao', 3, 16)).toBe('bible:joao:3:16');
    expect(buildId('catechism', '1817')).toBe('catechism:1817');
  });

  it('buildId rejeita kind desconhecido e slug com acento/maiúscula', () => {
    expect(() => buildId('unknown' as never, 'x')).toThrow();
    expect(() => buildId('theme', 'Esperança')).toThrow();
    expect(() => buildId('theme', 'com espaço')).toThrow();
  });

  it('parseId decodifica IDs válidos e devolve null para inválidos', () => {
    expect(parseId('theme:esperanca')).toEqual({
      kind: 'theme', slug: 'esperanca', sub: [],
    });
    expect(parseId('bible:joao:3:16')).toEqual({
      kind: 'bible', slug: 'joao', sub: ['3', '16'],
    });
    expect(parseId('')).toBeNull();
    expect(parseId('foo')).toBeNull();
    expect(parseId('unknown:x')).toBeNull();
    expect(parseId('theme:Esperança')).toBeNull();
  });

  it('isValidId é consistente com parseId', () => {
    expect(isValidId('theme:esperanca')).toBe(true);
    expect(isValidId('catechism:1817')).toBe(true);
    expect(isValidId('theme:Esperança')).toBe(false);
    expect(isValidId(42)).toBe(false);
  });
});
