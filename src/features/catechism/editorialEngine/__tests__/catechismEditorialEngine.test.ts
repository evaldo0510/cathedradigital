import { describe, it, expect } from 'vitest';
import {
  CIC_STRUCTURE,
  resolveCatechismLocation,
  CIC_LAST_PARAGRAPH,
} from '../catechismStructure';
import {
  resolveCatechismEditorial,
  buildCatechismClosure,
} from '../catechismEditorial';
import { resolveEditorialClosure } from '@/lib/editorial/resolveClosure';

describe('catechismStructure', () => {
  it('cobre todos os 2865 parágrafos sem lacuna', () => {
    for (let p = 1; p <= CIC_LAST_PARAGRAPH; p += 1) {
      const loc = resolveCatechismLocation(p);
      expect(loc.editorialKey, `§${p} sem capítulo`).not.toBe('geral');
      expect(loc.part).toBeTruthy();
      expect(loc.article).toBeTruthy();
      expect(loc.theme).toBeTruthy();
    }
  });

  it('não sobrepõe faixas de artigos dentro de um capítulo', () => {
    for (const part of CIC_STRUCTURE) {
      for (const section of part.sections) {
        for (const chapter of section.chapters) {
          const sorted = [...chapter.articles].sort((a, b) => a.range[0] - b.range[0]);
          sorted.forEach((art, i) => {
            expect(art.range[0]).toBeLessThanOrEqual(art.range[1]);
            if (i > 0) {
              expect(art.range[0]).toBeGreaterThan(sorted[i - 1].range[1]);
            }
          });
        }
      }
    }
  });

  it('resolve pontos canônicos conhecidos', () => {
    expect(resolveCatechismLocation(1).part).toBe('Prólogo');
    expect(resolveCatechismLocation(101).article).toContain('Sagrada Escritura');
    expect(resolveCatechismLocation(1324).article).toContain('Eucaristia');
    expect(resolveCatechismLocation(2258).article).toContain('Quinto mandamento');
    expect(resolveCatechismLocation(2803).article).toContain('sete petições');
  });
});

describe('catechismEditorial', () => {
  it('entrega moldura editorial completa para qualquer parágrafo', () => {
    for (const p of [1, 30, 105, 190, 500, 1100, 1330, 1450, 1700, 2100, 2600, 2860]) {
      const ed = resolveCatechismEditorial(resolveCatechismLocation(p));
      expect(ed.introduction.length).toBeGreaterThan(20);
      expect(ed.historicalContext.length).toBeGreaterThan(20);
      expect(ed.doctrinalContext.length).toBeGreaterThan(20);
      expect(ed.application.length).toBeGreaterThan(10);
      expect(ed.reflection.endsWith('?')).toBe(true);
      expect(ed.prayer).toContain('Amém');
    }
  });

  it('produz um closure válido no contrato do Reader V2', () => {
    const loc = resolveCatechismLocation(1324);
    const ed = resolveCatechismEditorial(loc);
    const closure = resolveEditorialClosure(
      buildCatechismClosure(loc, ed, {
        kicker: 'Continuar',
        label: 'Prosseguir em §1420',
        href: '/catechism?p=1420',
      }),
    );
    expect(closure).not.toBeNull();
    expect(closure?.application).toBe(ed.application);
    expect(closure?.prayer).toBe(ed.prayer);
    expect(closure?.next?.href).toBe('/catechism?p=1420');
  });
});
