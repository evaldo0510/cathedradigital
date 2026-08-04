import { describe, it, expect } from 'vitest';
import {
  resolveNexusHref,
  extractNexusRefId,
  collectionKindToNexusKind,
  nexusChannelToListingHref,
} from '@/lib/nexusHref';
import type { NexusKind } from '@/types/nexus';

describe('extractNexusRefId', () => {
  it('devolve string direta', () => {
    expect(extractNexusRefId('agostinho')).toBe('agostinho');
  });
  it('prioriza slug > id > ref', () => {
    expect(extractNexusRefId({ slug: 'a', id: 'b', ref: 'c' })).toBe('a');
    expect(extractNexusRefId({ id: 'b', ref: 'c' })).toBe('b');
    expect(extractNexusRefId({ ref: 'c' })).toBe('c');
  });
  it('aceita número como id', () => {
    expect(extractNexusRefId({ id: 1234 })).toBe('1234');
  });
  it('rejeita valores vazios/nulos', () => {
    expect(extractNexusRefId(null)).toBeNull();
    expect(extractNexusRefId(undefined)).toBeNull();
    expect(extractNexusRefId('')).toBeNull();
    expect(extractNexusRefId({})).toBeNull();
    expect(extractNexusRefId({ slug: '' })).toBeNull();
  });
});

describe('resolveNexusHref', () => {
  const cases: Array<[NexusKind, string, string | null]> = [
    ['saint', 'agostinho', '/santos/agostinho'],
    ['glossary', 'graca', '/glossario/graca'],
    ['prayer', 'rosario', '/oracao/rosario'],
    ['journey', 'quaresma', '/jornadas/quaresma'],
    ['catechism_paragraph', '460', '/catechism?p=460'],
    ['bible_verse', 'Jo 6:35', '/bible?ref=Jo%206%3A35'],
    ['magisterium_doc', 'lumen-gentium', '/magisterium/lumen-gentium'],
    ['patristic', 'confessiones', '/biblioteca/padres/confessiones'],
    ['liturgy', '2026-07-24', '/liturgia/dia/2026-07-24'],
    ['saint_work', 'confissoes', null],
    ['other', 'x', null],
  ];

  for (const [kind, id, expected] of cases) {
    it(`${kind} → ${expected ?? 'null'}`, () => {
      expect(resolveNexusHref(kind, id)).toBe(expected);
    });
  }

  it('CIC fora do intervalo cai no fallback /catechism', () => {
    expect(resolveNexusHref('catechism_paragraph', '99999')).toBe('/catechism');
  });

  it('CIC não numérico → null', () => {
    expect(resolveNexusHref('catechism_paragraph', 'abc')).toBeNull();
  });

  it('ref vazio → null para todos os kinds', () => {
    const kinds: NexusKind[] = [
      'saint', 'glossary', 'prayer', 'journey', 'catechism_paragraph',
      'bible_verse', 'magisterium_doc', 'patristic', 'liturgy',
    ];
    for (const k of kinds) expect(resolveNexusHref(k, null)).toBeNull();
  });

  it('aceita NexusRef com title (ignorado no href)', () => {
    expect(
      resolveNexusHref('saint', { id: 'bento', title: 'São Bento' }),
    ).toBe('/santos/bento');
  });
});

describe('collectionKindToNexusKind', () => {
  it('mapeia todos os tipos conhecidos', () => {
    expect(collectionKindToNexusKind('glossary')).toBe('glossary');
    expect(collectionKindToNexusKind('prayer')).toBe('prayer');
    expect(collectionKindToNexusKind('saint')).toBe('saint');
    expect(collectionKindToNexusKind('bible')).toBe('bible_verse');
    expect(collectionKindToNexusKind('liturgy')).toBe('liturgy');
    expect(collectionKindToNexusKind('catechism')).toBe('catechism_paragraph');
    expect(collectionKindToNexusKind('journey')).toBe('journey');
  });
  it('kind desconhecido → null', () => {
    expect(collectionKindToNexusKind('foo')).toBeNull();
  });
});

describe('nexusChannelToListingHref', () => {
  it('canaliza para páginas de listagem', () => {
    expect(nexusChannelToListingHref('bible')).toBe('/bible');
    expect(nexusChannelToListingHref('catechism')).toBe('/catechism');
    expect(nexusChannelToListingHref('magisterium')).toBe('/magisterium');
    expect(nexusChannelToListingHref('father')).toBe('/patristica');
    expect(nexusChannelToListingHref('saint')).toBe('/santos');
    expect(nexusChannelToListingHref('journey')).toBe('/jornadas');
    expect(nexusChannelToListingHref('theme')).toBe('/buscar');
  });
});
