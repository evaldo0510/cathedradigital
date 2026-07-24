import { describe, it, expect } from 'vitest';
import { resolveEditorialClosure } from '@/lib/editorial/resolveClosure';
import { validateEditorialClosure } from '@/lib/editorial/closureSchema';

describe('resolveEditorialClosure — fallbacks e validação', () => {
  it('retorna null para entrada vazia/inválida', () => {
    expect(resolveEditorialClosure(null)).toBeNull();
    expect(resolveEditorialClosure(undefined)).toBeNull();
    expect(resolveEditorialClosure({})).toBeNull();
    expect(resolveEditorialClosure({ editorial_closure: 42 })).toBeNull();
    expect(resolveEditorialClosure({ editorial_closure: '   ' })).toBeNull();
    expect(resolveEditorialClosure({ editorial_closure: {} })).toBeNull();
  });

  it('aceita schema canônico completo', () => {
    const out = resolveEditorialClosure({
      editorial_closure: {
        reflection: 'R',
        application: 'A',
        prayer: 'P',
        source: 'cathedra-editorial',
      },
    });
    expect(out).toMatchObject({ reflection: 'R', application: 'A', prayer: 'P', source: 'cathedra-editorial' });
  });

  it('aceita string JSON legada', () => {
    const out = resolveEditorialClosure({
      editorial_closure: JSON.stringify({ reflection: 'R', application: 'A', prayer: 'P' }),
    });
    expect(out?.reflection).toBe('R');
  });

  it('trata string pura como reflexão', () => {
    const out = resolveEditorialClosure({ editorial_closure: 'Uma reflexão antiga.' });
    expect(out).toMatchObject({ reflection: 'Uma reflexão antiga.' });
  });

  it('aceita aliases PT-BR', () => {
    const out = resolveEditorialClosure({
      editorial_closure: { reflexao: 'R', aplicacao: 'A', oracao: 'P' },
    });
    expect(out).toMatchObject({ reflection: 'R', application: 'A', prayer: 'P' });
  });

  it('aceita text/conclusion como reflexão', () => {
    expect(resolveEditorialClosure({ editorial_closure: { text: 'X' } })?.reflection).toBe('X');
    expect(resolveEditorialClosure({ editorial_closure: { conclusion: 'Y' } })?.reflection).toBe('Y');
  });

  it('aceita next.url como alias de next.href', () => {
    const out = resolveEditorialClosure({
      editorial_closure: { reflection: 'R', next: { label: 'L', url: '/x' } },
    });
    expect(out?.next).toEqual({ label: 'L', href: '/x', kicker: undefined });
  });

  it('filtra itens de nexus inválidos', () => {
    const out = resolveEditorialClosure({
      editorial_closure: {
        reflection: 'R',
        nexus: [
          { kind: 'saint', ref: 'agostinho', label: 'Agostinho' },
          { type: 'inexistente', id: 'x', title: 'Bad' },
          { kind: 'glossary' },
        ],
      },
    });
    expect(out?.nexus).toHaveLength(1);
    expect(out?.nexus?.[0]).toMatchObject({ kind: 'saint', ref: 'agostinho' });
  });

  it('preserva parciais (só reflexão)', () => {
    const out = resolveEditorialClosure({ editorial_closure: { reflection: 'só R' } });
    expect(out?.reflection).toBe('só R');
    expect(out?.application).toBeUndefined();
  });

  it('nunca lança em JSON malformado', () => {
    expect(() =>
      resolveEditorialClosure({ editorial_closure: '{ isso não é json válido' }),
    ).not.toThrow();
  });
});

describe('resolveEditorialClosure — casos extremos (missing / mixed / partial nexus)', () => {
  it('closure só com next é válido', () => {
    const out = resolveEditorialClosure({
      editorial_closure: { next: { label: 'Continuar', href: '/x' } },
    });
    expect(out?.next?.href).toBe('/x');
    expect(out?.reflection).toBeUndefined();
  });

  it('closure só com nexus curado é válido', () => {
    const out = resolveEditorialClosure({
      editorial_closure: {
        nexus: [{ kind: 'glossary', ref: 'graca', label: 'Graça' }],
      },
    });
    expect(out?.nexus).toHaveLength(1);
  });

  it('tipos mistos: reflection numérico é descartado, application ok', () => {
    const out = resolveEditorialClosure({
      editorial_closure: { reflection: 42, application: 'A válido', prayer: null },
    });
    // reflection numérico não bate schema; retry por aliases mantém application
    expect(out?.application).toBe('A válido');
    expect(out?.reflection).toBeUndefined();
  });

  it('nexus parcialmente inválido: mantém itens bons, descarta ruins', () => {
    const report = validateEditorialClosure({
      reflection: 'R',
      nexus: [
        { kind: 'saint', ref: 'agostinho', label: 'Agostinho' },
        { kind: 'saint', ref: '', label: 'sem ref' },
        { kind: 'invalido', ref: 'x', label: 'kind ruim' },
        null,
        'string solta',
        { kind: 'glossary', ref: 'graca', label: 'Graça', note: 'nota' },
      ],
    });
    expect(report.ok).toBe(true);
    expect(report.data?.nexus).toHaveLength(2);
    expect(report.warnings.some((w) => w.includes('nexus[1]'))).toBe(true);
    expect(report.warnings.some((w) => w.includes('nexus[2]'))).toBe(true);
    expect(report.warnings.some((w) => w.includes('nexus[3]'))).toBe(true);
  });

  it('next incompleto (só label) é descartado sem quebrar', () => {
    const report = validateEditorialClosure({
      reflection: 'R',
      next: { label: 'sem href' },
    });
    expect(report.ok).toBe(true);
    expect(report.data?.next).toBeUndefined();
    expect(report.warnings.some((w) => w.includes('next'))).toBe(true);
  });

  it('array como closure é rejeitado', () => {
    const report = validateEditorialClosure([1, 2, 3]);
    expect(report.ok).toBe(false);
  });

  it('boolean/number como closure é rejeitado com warning', () => {
    const r1 = validateEditorialClosure(true);
    const r2 = validateEditorialClosure(123);
    expect(r1.ok).toBe(false);
    expect(r2.ok).toBe(false);
    expect(r1.warnings.length).toBeGreaterThan(0);
  });

  it('strategy reportada corresponde ao caminho', () => {
    expect(validateEditorialClosure({ reflection: 'R' }).strategy).toBe('strict');
    expect(validateEditorialClosure({ reflexao: 'R' }).strategy).toBe('aliases');
    expect(validateEditorialClosure('texto puro').strategy).toBe('string-fallback');
    expect(validateEditorialClosure(null).strategy).toBe('none');
  });

  it('closure profundamente aninhado com aliases + nexus misto', () => {
    const out = resolveEditorialClosure({
      editorial_closure: JSON.stringify({
        reflexao: 'R',
        oracao: 'P',
        next: { title: 'Próxima', url: '/y' },
        nexus: [
          { type: 'saint', id: 'bento', title: 'Bento' },
          { type: 'x', id: 'y', title: 'z' },
        ],
      }),
    });
    expect(out?.reflection).toBe('R');
    expect(out?.prayer).toBe('P');
    expect(out?.next?.href).toBe('/y');
    expect(out?.nexus).toHaveLength(1);
  });
});
