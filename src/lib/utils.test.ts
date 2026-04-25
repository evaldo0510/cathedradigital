import { describe, it, expect } from 'vitest';
import { normalizeText } from './utils';

describe('normalizeText', () => {
  it('should convert to lowercase', () => {
    expect(normalizeText('TESTE')).toBe('teste');
  });

  it('should remove accents', () => {
    expect(normalizeText('Misericórdia')).toBe('misericordia');
    expect(normalizeText('Fé')).toBe('fe');
    expect(normalizeText('Oração')).toBe('oracao');
    expect(normalizeText('Espírito Santo')).toBe('espirito santo');
  });

  it('should trim whitespace', () => {
    expect(normalizeText('  teste  ')).toBe('teste');
  });

  it('should handle complex strings', () => {
    expect(normalizeText('  São Tomás de Aquino  ')).toBe('sao tomas de aquino');
  });

  it('should return empty string for null or undefined', () => {
    expect(normalizeText(null as any)).toBe('');
    expect(normalizeText(undefined as any)).toBe('');
    expect(normalizeText('')).toBe('');
  });
});
