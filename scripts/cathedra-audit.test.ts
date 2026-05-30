import { describe, it, expect } from 'vitest';
import { forbiddenPatterns } from './cathedra-audit';

describe('Cathedra Audit Token Mapping', () => {
  const findPattern = (id: string) => forbiddenPatterns.find(p => p.id === id);

  describe('Spacing Tokens', () => {
    const pattern = findPattern('spacing');
    
    it('should map standard spacing values to tokens', () => {
      expect(pattern?.fix('p-4')).toBe('p-spacing-md');
      expect(pattern?.fix('m-2')).toBe('m-spacing-xs');
      expect(pattern?.fix('gap-8')).toBe('gap-spacing-2xl');
      expect(pattern?.fix('w-12')).toBe('w-spacing-4xl');
    });

    it('should handle decimal values', () => {
      expect(pattern?.fix('p-0.5')).toBe('p-spacing-3xs');
      expect(pattern?.fix('p-1.5')).toBe('p-spacing-2xs');
    });

    it('should return the original if no token exists', () => {
      expect(pattern?.fix('p-99')).toBe('p-99');
    });

    it('should identify matches using the regex', () => {
      const regex = new RegExp(pattern!.regex, 'g');
      const content = 'p-4 m-2 gap-1.5 w-full h-auto p-99';
      const matches = [...content.matchAll(regex)].map(m => m[0]);
      
      expect(matches).toContain('p-4');
      expect(matches).toContain('m-2');
      expect(matches).toContain('gap-1.5');
      expect(matches).not.toContain('w-full'); // regex only matches numbers
      expect(matches).toContain('p-99');
      
      // Verification of exclusion logic would go here if we had more patterns
      const validMatches = matches.filter(m => !pattern?.exclude.includes(m));
      expect(validMatches).toContain('p-4');
    });
  });

  describe('Typography Tokens', () => {
    const pattern = findPattern('typography');

    it('should map typography classes to premium tokens', () => {
      expect(pattern?.fix('text-sm')).toBe('text-premium-sm');
      expect(pattern?.fix('text-base')).toBe('text-premium-base');
      expect(pattern?.fix('text-2xl')).toBe('text-premium-2xl');
      expect(pattern?.fix('text-5xl')).toBe('text-premium-5xl');
    });
  });

  describe('Rounding Tokens', () => {
    const pattern = findPattern('rounding');

    it('should map rounded classes to premium tokens', () => {
      expect(pattern?.fix('rounded-md')).toBe('rounded-premium-md');
      expect(pattern?.fix('rounded-lg')).toBe('rounded-premium-lg');
      expect(pattern?.fix('rounded-full')).toBe('rounded-premium-full');
      expect(pattern?.fix('rounded-2xl')).toBe('rounded-premium');
    });
  });

  describe('Shadow Tokens', () => {
    const pattern = findPattern('shadows');

    it('should map shadow classes to premium tokens', () => {
      expect(pattern?.fix('shadow-sm')).toBe('shadow-premium-sm');
      expect(pattern?.fix('shadow-md')).toBe('shadow-premium');
      expect(pattern?.fix('shadow-lg')).toBe('shadow-premium-hover');
      expect(pattern?.fix('shadow-xl')).toBe('shadow-premium-xl');
    });
  });
});
