import { describe, it, expect } from 'vitest';
import { parseCatechismReferences } from '@/lib/catechismRefParser';
import { parseTheologicalReferences } from '@/lib/theologicalRefParser';

describe('catechismRefParser - no double §', () => {
  const cases = [
    '§2053',
    'CIC §2053',
    'CIC§2053',
    'CIC §§2053',
    '§§2053',
    'CIC §2053, 2054, §2055',
    'Veja CIC §2053-2055 para detalhes.',
    'Conforme §2053; §2054.',
  ];

  it.each(cases)('nunca emite "§§" e formata como §N (input: %s)', (input) => {
    const segs = parseCatechismReferences(input);
    const refs = segs.filter((s) => s.type === 'catechismRef');
    expect(refs.length).toBeGreaterThan(0);
    for (const r of refs) {
      expect(r.value).toMatch(/^§\d+$/);
      expect(r.value.startsWith('§§')).toBe(false);
    }
    const joined = segs.map((s) => s.value).join('');
    expect(joined.includes('§§')).toBe(false);
  });

  it('inclui §2053 exatamente uma vez como ref', () => {
    const segs = parseCatechismReferences('CIC §§2053');
    const refs = segs.filter((s) => s.type === 'catechismRef' && s.paragraph === 2053);
    expect(refs).toHaveLength(1);
    expect(refs[0].value).toBe('§2053');
  });

  it('parser teológico unificado preserva formato §N sem duplicação', () => {
    const segs = parseTheologicalReferences('Veja Jo 3,16 e CIC §§2053 para meditar.');
    const cic = segs.filter((s) => s.type === 'catechismRef');
    expect(cic).toHaveLength(1);
    expect(cic[0].value).toBe('§2053');
    expect(segs.map((s) => s.value).join('').includes('§§')).toBe(false);
  });
});
