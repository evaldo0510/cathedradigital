import { describe, it, expect } from 'vitest';
import { buildSaintPage } from '../buildSaintPage';
import type { SaintEditorialData } from '../types';

const base: SaintEditorialData = {
  slug: 'sao-tomas-de-aquino',
  header: {
    name: 'São Tomás de Aquino',
    category: 'doctor',
  },
};

describe('buildSaintPage — skip-if-empty', () => {
  it('retorna apenas header quando não há seções', () => {
    const d = buildSaintPage(base);
    expect(d.blocks).toEqual([]);
    expect(d.slug).toBe(base.slug);
    expect(d.header).toBe(base.header);
  });

  it('omite bio vazia (string em branco)', () => {
    const d = buildSaintPage({ ...base, longBio: '   ' });
    expect(d.blocks.find((b) => b.id === 'bio')).toBeUndefined();
  });

  it('inclui bio quando presente', () => {
    const d = buildSaintPage({ ...base, longBio: 'Nasceu em Roccasecca…' });
    expect(d.blocks[0]).toMatchObject({ id: 'bio' });
  });

  it('omite arrays vazios', () => {
    const d = buildSaintPage({
      ...base,
      timeline: [],
      virtues: [],
      writings: [],
      prayers: [],
      sources: [],
    });
    expect(d.blocks).toEqual([]);
  });

  it('respeita a ordem canônica: bio → timeline → virtudes → escritos → orações → fontes', () => {
    const d = buildSaintPage({
      ...base,
      longBio: 'x',
      timeline: [{ year: '1225', title: 'Nasce' }],
      virtues: [{ label: 'Prudência' }],
      writings: [{ id: 'w1', title: 'Suma Teológica' }],
      prayers: [{ id: 'p1', title: 'Adoro te devote', slug: 'adoro-te-devote' }],
      sources: [{ label: 'Vatican.va' }],
    });
    expect(d.blocks.map((b) => b.id)).toEqual([
      'bio',
      'timeline',
      'virtues',
      'writings',
      'prayers',
      'sources',
    ]);
  });
});
