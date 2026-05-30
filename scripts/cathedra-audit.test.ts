import { describe, it, expect, vi } from 'vitest';
import { forbiddenPatterns, runAudit } from './cathedra-audit';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Mock child_process and fs to test runAudit without side effects
vi.mock('child_process', () => ({
  execSync: vi.fn(),
  default: {
    execSync: vi.fn()
  }
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    existsSync: vi.fn(),
    default: {
      ...actual.default,
      writeFileSync: vi.fn(),
      readFileSync: vi.fn(),
      mkdirSync: vi.fn(),
      existsSync: vi.fn(),
    }
  };
});

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

  describe('Dry-run Mode and Codemod Snapshots', () => {
    it('should correctly identify replacements in dry-run mode', () => {
      const mockContent = '<div className="p-4 rounded-md shadow-md text-sm"></div>';
      
      const results: string[] = [];
      forbiddenPatterns.forEach(pattern => {
        const regex = new RegExp(pattern.regex, 'g');
        const matches = mockContent.match(regex);
        if (matches) {
          matches.forEach(m => {
            const fixed = pattern.fix(m);
            if (fixed !== m) {
              results.push(`Would replace "${m}" with "${fixed}"`);
            }
          });
        }
      });

      expect(results).toContain('Would replace "p-4" with "p-spacing-md"');
      expect(results).toContain('Would replace "rounded-md" with "rounded-premium-md"');
      expect(results).toContain('Would replace "shadow-md" with "shadow-premium"');
      expect(results).toContain('Would replace "text-sm" with "text-premium-sm"');
    });

    it('should match the expected codemod output snapshot', () => {
      const testCases = [
        { input: 'p-4 m-2 gap-8 text-sm rounded-lg shadow-md', expected: 'p-spacing-md m-spacing-xs gap-spacing-2xl text-premium-sm rounded-premium-lg shadow-premium' },
        { input: 'p-0.5 text-5xl rounded-full shadow-lg', expected: 'p-spacing-3xs text-premium-5xl rounded-premium-full shadow-premium-hover' },
        { input: 'w-12 h-16 rounded-2xl shadow-xl text-base', expected: 'w-spacing-4xl h-spacing-4xl rounded-premium shadow-premium-xl text-premium-base' }
      ];

      const results = testCases.map(tc => {
        let transformed = tc.input;
        forbiddenPatterns.forEach(pattern => {
          const regex = new RegExp(pattern.regex, 'g');
          transformed = transformed.replace(regex, (match) => {
            if (pattern.exclude.includes(match)) return match;
            return pattern.fix(match);
          });
        });
        return { input: tc.input, output: transformed };
      });

      expect(results).toMatchSnapshot();
    });

    it('should respect exclusions in the snapshot', () => {
      const content = 'p-4 w-full h-auto m-2';
      let transformed = content;
      
      forbiddenPatterns.forEach(pattern => {
        const regex = new RegExp(pattern.regex, 'g');
        transformed = transformed.replace(regex, (match) => {
          if (pattern.exclude.includes(match)) return match;
          return pattern.fix(match);
        });
      });

      expect(transformed).toBe('p-spacing-md w-full h-auto m-spacing-xs');
      expect(transformed).toMatchSnapshot();
    });
  });
});
