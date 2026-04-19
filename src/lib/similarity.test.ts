import { describe, it, expect } from 'vitest';
import { computeSimilarity, combinedSimilarity, scoreToTone } from './similarity';

describe('computeSimilarity', () => {
  it('returns 0 when either input is empty', () => {
    expect(computeSimilarity('', 'Tomás')).toBe(0);
    expect(computeSimilarity('tomas', '')).toBe(0);
    expect(computeSimilarity('', '')).toBe(0);
  });

  it('is accent-insensitive ("tomas" matches "Tomás")', () => {
    const accented = computeSimilarity('tomas', 'São Tomás de Aquino');
    const plain = computeSimilarity('tomas', 'Sao Tomas de Aquino');
    expect(accented).toBeGreaterThan(0);
    // Diacritics must be stripped → both queries score identically.
    expect(accented).toBeCloseTo(plain, 5);
  });

  it('is case-insensitive', () => {
    expect(computeSimilarity('GRACA', 'graça')).toBeCloseTo(
      computeSimilarity('graca', 'graça'),
      5,
    );
  });

  it('returns the maximum score (1) when query equals target', () => {
    // Substring branch: q.length / t.length + 0.5, clamped to 1.
    expect(computeSimilarity('graça', 'graça')).toBe(1);
  });

  it('boosts substring matches above pure trigram score', () => {
    // "tomas" is contained inside "sao tomas de aquino" → substring boost applies.
    const substringBoost = computeSimilarity('tomas', 'São Tomás de Aquino');
    // A non-substring trigram-only comparison should score lower.
    const trigramOnly = computeSimilarity('xyz', 'São Tomás de Aquino');
    expect(substringBoost).toBeGreaterThan(trigramOnly);
    expect(substringBoost).toBeGreaterThan(0.5); // boost floor
  });

  it('clamps results to the [0, 1] range', () => {
    const score = computeSimilarity('a', 'a');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe('combinedSimilarity', () => {
  it('prefers the primary field over a weighted secondary', () => {
    // Primary perfect, secondary irrelevant → primary wins.
    const score = combinedSimilarity('graca', 'Graça', 'whatever', 0.5);
    expect(score).toBe(1);
  });

  it('falls back to the weighted secondary when primary misses', () => {
    const score = combinedSimilarity('graca', 'Outro termo', 'Graça é dom', 0.5);
    // Secondary substring match (~0.5+ boost) × 0.5 weight should still beat 0.
    expect(score).toBeGreaterThan(0);
  });

  it('handles missing secondary field gracefully', () => {
    expect(() => combinedSimilarity('graca', 'Graça')).not.toThrow();
    expect(combinedSimilarity('graca', 'Graça')).toBe(1);
  });
});

describe('scoreToTone', () => {
  it('returns null for missing, zero, or negative scores', () => {
    expect(scoreToTone(undefined)).toBeNull();
    expect(scoreToTone(null)).toBeNull();
    expect(scoreToTone(0)).toBeNull();
    expect(scoreToTone(-0.1)).toBeNull();
  });

  it('emits emerald tones at or above the 50% threshold', () => {
    const tone = scoreToTone(0.5);
    expect(tone).not.toBeNull();
    expect(tone!.pct).toBe(50);
    expect(tone!.classes).toContain('emerald');
  });

  it('emits amber tones between 25% and 49%', () => {
    const tone = scoreToTone(0.3);
    expect(tone).not.toBeNull();
    expect(tone!.pct).toBe(30);
    expect(tone!.classes).toContain('amber');
  });

  it('emits muted tones below 25%', () => {
    const tone = scoreToTone(0.1);
    expect(tone).not.toBeNull();
    expect(tone!.pct).toBe(10);
    expect(tone!.classes).toContain('muted');
  });

  it('clamps percentages above 1 to 100', () => {
    const tone = scoreToTone(1.5);
    expect(tone!.pct).toBe(100);
    expect(tone!.classes).toContain('emerald');
  });
});
