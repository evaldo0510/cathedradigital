/** @vitest-environment jsdom */
import { describe, expect, it, beforeEach } from 'vitest';
import {
  applyTokenFixToElement,
  scanPageForContrastViolations,
  suggestTokenReplacements,
} from '../contrast-audit';

describe('suggestTokenReplacements', () => {
  it('maps hardcoded gray/black/white classes to semantic tokens', () => {
    const s = suggestTokenReplacements('text-gray-300 text-black bg-white p-4');
    const map = Object.fromEntries(s.map((x) => [x.from, x.to]));
    expect(map['text-gray-300']).toBe('text-muted-foreground');
    expect(map['text-black']).toBe('text-foreground');
    expect(map['bg-white']).toBe('bg-background');
    expect(s.find((x) => x.from === 'p-4')).toBeUndefined();
  });
  it('flags arbitrary hex/rgb classes', () => {
    const s = suggestTokenReplacements('text-[#333] text-[rgb(80,80,80)]');
    expect(s).toHaveLength(2);
  });
});

describe('applyTokenFixToElement', () => {
  it('rewrites the className with the suggested tokens', () => {
    const el = document.createElement('p');
    el.className = 'text-gray-300 leading-6';
    const { before, after } = applyTokenFixToElement(el, suggestTokenReplacements(el.className));
    expect(before).toBe('text-gray-300 leading-6');
    expect(after).toBe('text-muted-foreground leading-6');
    expect(el.className).toBe('text-muted-foreground leading-6');
  });
});

describe('scanPageForContrastViolations', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.classList.remove('dark');
  });
  it('returns at least one violation for low-contrast text on white', () => {
    const p = document.createElement('p');
    p.textContent = 'demasiado claro';
    p.style.color = 'rgb(220, 220, 220)';
    document.body.style.backgroundColor = 'rgb(255,255,255)';
    document.body.appendChild(p);
    const result = scanPageForContrastViolations({ level: 'AA', largeMode: 'auto', maxNodes: 50 });
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].ratio).toBeLessThan(4.5);
  });
  it('does not flag well-contrasted text', () => {
    const p = document.createElement('p');
    p.textContent = 'ok';
    p.style.color = 'rgb(0,0,0)';
    document.body.style.backgroundColor = 'rgb(255,255,255)';
    document.body.appendChild(p);
    const result = scanPageForContrastViolations({ level: 'AA', largeMode: 'auto', maxNodes: 50 });
    expect(result.violations).toHaveLength(0);
  });
});
