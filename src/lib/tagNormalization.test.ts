import { describe, it, expect } from 'vitest';
import { normalizeTag, normalizeTags, getSearchTermsForTag } from './tagNormalization';

describe('tagNormalization', () => {
  it('should normalize basic tags', () => {
    expect(normalizeTag('Fé')).toBe('fe');
    expect(normalizeTag('Oração')).toBe('oracao');
  });

  it('should map synonyms to canonical slugs', () => {
    // According to SYNONYM_MAP in tagNormalization.ts:
    // 'faith' -> 'fe'
    // 'orar' -> 'oracao'
    expect(normalizeTag('faith')).toBe('fe');
    expect(normalizeTag('orar')).toBe('oracao');
    expect(normalizeTag('Prayer')).toBe('oracao');
  });

  it('should handle variations that result in the same canonical slug', () => {
    const input1 = 'Misericórdia';
    const input2 = 'misericordia';
    const input3 = 'Mercy'; // Synonym
    
    expect(normalizeTag(input1)).toBe('misericordia');
    expect(normalizeTag(input2)).toBe('misericordia');
    expect(normalizeTag(input3)).toBe('misericordia');
  });

  it('should normalize and deduplicate arrays of tags', () => {
    const tags = ['Fé', 'faith', 'Amor', 'love', 'fé'];
    const normalized = normalizeTags(tags);
    expect(normalized).toEqual(['fe', 'amor']);
  });

  it('should handle multi-word tags with underscores', () => {
    expect(normalizeTag('Espírito Santo')).toBe('espirito_santo');
    expect(normalizeTag('holy spirit')).toBe('espirito_santo');
  });

  it('should generate comprehensive search terms for a tag', () => {
    const { getSearchTermsForTag } = require('./tagNormalization');
    const tag = { label: 'Misericórdia', slug: 'misericordia' };
    const terms = getSearchTermsForTag(tag);
    
    expect(terms).toContain('Misericórdia');
    expect(terms).toContain('misericordia');
    expect(terms.length).toBe(2); // Misericórdia and misericordia (slug is same as normalized)
  });
});
