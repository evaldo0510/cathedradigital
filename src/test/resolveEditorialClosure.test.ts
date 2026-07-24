import { describe, it, expect } from 'vitest';
import { resolveEditorialClosure } from '@/lib/editorial/resolveClosure';

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
    expect(out).toMatchObject({ reflection: 'Uma reflexão antiga.', application: '', prayer: '' });
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

  it('preserva parciais (só reflexão) sem descartar', () => {
    const out = resolveEditorialClosure({ editorial_closure: { reflection: 'só R' } });
    expect(out).toMatchObject({ reflection: 'só R', application: '', prayer: '' });
  });

  it('nunca lança em JSON malformado', () => {
    expect(() =>
      resolveEditorialClosure({ editorial_closure: '{ isso não é json válido' }),
    ).not.toThrow();
  });
});
