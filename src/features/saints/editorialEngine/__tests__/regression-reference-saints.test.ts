/**
 * Regressão — Motor Editorial de Santos
 *
 * Cobre dois compromissos:
 *  1. skip-if-empty: cada bloco opcional só aparece quando há conteúdo.
 *  2. Cinco santos-referência continuam produzindo descritor válido e
 *     com os blocos esperados a partir do adaptador `saintToEditorialData`.
 *
 * O objetivo é blindar as regressões no pipeline puro
 * `Saint (DB) → SaintEditorialData → SaintPageDescriptor`.
 */
import { describe, it, expect } from 'vitest';
import type { Saint } from '@/data/saints';
import { buildSaintPage } from '../buildSaintPage';
import { saintToEditorialData } from '../saintToEditorialData';
import type { SaintBlockId } from '../types';

// ─── Helpers ───────────────────────────────────────────────────────────

function makeSaint(partial: Partial<Saint>): Saint {
  return {
    id: partial.id ?? 'sao-referencia',
    name: partial.name ?? 'Santo Referência',
    title: partial.title ?? '',
    feastDay: partial.feastDay ?? '',
    feastMonth: partial.feastMonth ?? 1,
    feastDayNum: partial.feastDayNum ?? 1,
    born: partial.born ?? '',
    died: partial.died ?? '',
    patronOf: partial.patronOf ?? [],
    bio: partial.bio ?? '',
    works: partial.works ?? [],
    quotes: partial.quotes ?? [],
    category: partial.category ?? 'confessor',
    ...partial,
  } as Saint;
}

const blockIds = (data: Saint): SaintBlockId[] =>
  buildSaintPage(saintToEditorialData(data)).blocks.map((b) => b.id);

// ─── skip-if-empty ─────────────────────────────────────────────────────

describe('SaintAutoPage · skip-if-empty por bloco', () => {
  it('santo sem conteúdo opcional → nenhum bloco além do header', () => {
    const s = makeSaint({ id: 'vazio', name: 'Santo Vazio' });
    expect(blockIds(s)).toEqual([]);
  });

  it('adiciona bio somente quando fullBio não vazia', () => {
    expect(blockIds(makeSaint({ fullBio: '   ' }))).not.toContain('bio');
    expect(blockIds(makeSaint({ fullBio: 'Nasceu em…' }))).toContain('bio');
  });

  it('adiciona timeline somente com eventos válidos', () => {
    expect(blockIds(makeSaint({ timeline: [] }))).not.toContain('timeline');
    expect(
      blockIds(makeSaint({ timeline: [{ year: 1225, event: 'Nasce' }] })),
    ).toContain('timeline');
  });

  it('adiciona virtudes somente quando houver ao menos uma', () => {
    expect(blockIds(makeSaint({ virtues: [] }))).not.toContain('virtues');
    expect(blockIds(makeSaint({ virtues: ['Prudência'] }))).toContain('virtues');
  });

  it('adiciona escritos somente quando houver ao menos um', () => {
    expect(blockIds(makeSaint({ works: [] }))).not.toContain('writings');
    expect(
      blockIds(makeSaint({ works: [{ title: 'Suma Teológica' }] })),
    ).toContain('writings');
  });

  it('adiciona fontes somente quando houver ao menos uma', () => {
    expect(blockIds(makeSaint({ sources: [] }))).not.toContain('sources');
    expect(
      blockIds(makeSaint({ sources: [{ title: 'Butler, Lives of the Saints' }] })),
    ).toContain('sources');
  });

  it('respeita a ordem canônica quando todos os blocos existem', () => {
    const s = makeSaint({
      fullBio: 'Biografia completa.',
      timeline: [{ year: 1225, event: 'Nasce' }],
      virtues: ['Prudência'],
      works: [{ title: 'Suma Teológica' }],
      sources: [{ title: 'Vatican.va', url: 'https://vatican.va' }],
    });
    expect(blockIds(s)).toEqual(['bio', 'timeline', 'virtues', 'writings', 'sources']);
  });
});

// ─── Cinco santos-referência ───────────────────────────────────────────

const REFERENCE_SAINTS: Array<{ saint: Saint; expected: SaintBlockId[] }> = [
  {
    // 1. Doutor: bio + timeline + virtudes + escritos + fontes
    saint: makeSaint({
      id: 'sao-tomas-de-aquino',
      name: 'São Tomás de Aquino',
      category: 'doctor',
      century: 13,
      country: 'Itália',
      feastDay: '28 de janeiro',
      bio: 'Doutor Angélico, síntese entre fé e razão.',
      fullBio: 'Nasceu em Roccasecca por volta de 1225…',
      virtues: ['Sabedoria', 'Humildade'],
      timeline: [
        { year: 1225, event: 'Nascimento em Roccasecca' },
        { year: 1274, event: 'Morte em Fossanova' },
      ],
      works: [
        { title: 'Suma Teológica' },
        { title: 'Suma contra os Gentios', url: 'https://www.vatican.va/…' },
      ],
      sources: [{ title: 'Vatican.va', url: 'https://www.vatican.va' }],
    }),
    expected: ['bio', 'timeline', 'virtues', 'writings', 'sources'],
  },
  {
    // 2. Mártir: bio curta, virtudes, sem escritos
    saint: makeSaint({
      id: 'santo-estevao',
      name: 'Santo Estêvão',
      category: 'martyr',
      century: 1,
      feastDay: '26 de dezembro',
      bio: 'Primeiro mártir cristão.',
      fullBio: 'Diácono da Igreja primitiva…',
      virtues: ['Fortaleza', 'Caridade'],
      timeline: [{ year: 34, event: 'Martírio em Jerusalém' }],
    }),
    expected: ['bio', 'timeline', 'virtues'],
  },
  {
    // 3. Papa (mapeado como saint): apenas bio + fontes
    saint: makeSaint({
      id: 'sao-joao-paulo-ii',
      name: 'São João Paulo II',
      category: 'pope',
      century: 20,
      country: 'Polônia',
      feastDay: '22 de outubro',
      fullBio: 'Karol Wojtyła, 264º sucessor de Pedro…',
      sources: [{ title: 'Vatican.va — biografia', url: 'https://www.vatican.va' }],
    }),
    expected: ['bio', 'sources'],
  },
  {
    // 4. Virgem: apenas virtudes
    saint: makeSaint({
      id: 'santa-teresinha',
      name: 'Santa Teresinha do Menino Jesus',
      category: 'doctor',
      century: 19,
      feastDay: '1 de outubro',
      virtues: ['Confiança', 'Pequenez'],
    }),
    expected: ['virtues'],
  },
  {
    // 5. Escritor patrístico: writings + sources, sem timeline nem virtudes
    saint: makeSaint({
      id: 'santo-agostinho',
      name: 'Santo Agostinho',
      category: 'doctor',
      century: 4,
      country: 'Hipona',
      feastDay: '28 de agosto',
      fullBio: 'Bispo de Hipona, Doutor da Graça…',
      works: [
        { title: 'Confissões' },
        { title: 'A Cidade de Deus' },
      ],
      sources: [{ title: 'Documenta Catholica Omnia' }],
    }),
    expected: ['bio', 'writings', 'sources'],
  },
];

describe('SaintAutoPage · santos-referência renderizam blocos esperados', () => {
  it.each(REFERENCE_SAINTS)(
    'santo $saint.name → blocos $expected',
    ({ saint, expected }) => {
      const descriptor = buildSaintPage(saintToEditorialData(saint));
      expect(descriptor.slug).toBe(saint.id);
      expect(descriptor.header.name).toBe(saint.name);
      expect(descriptor.blocks.map((b) => b.id)).toEqual(expected);
    },
  );

  it('adaptador converte categorias do DB para categorias editoriais', () => {
    expect(saintToEditorialData(makeSaint({ category: 'doctor' })).header.category).toBe('doctor');
    expect(saintToEditorialData(makeSaint({ category: 'martyr' })).header.category).toBe('martyr');
    expect(saintToEditorialData(makeSaint({ category: 'pope' })).header.category).toBe('saint');
    expect(saintToEditorialData(makeSaint({ category: 'apostle' })).header.category).toBe('saint');
  });

  it('escritos com URL absoluta viram externo; URL interna vira slug', () => {
    const s = makeSaint({
      works: [
        { title: 'Confissões', url: '/biblioteca/escritos/confissoes' },
        { title: 'Suma', url: 'https://www.vatican.va/suma' },
      ],
    });
    const data = saintToEditorialData(s);
    const w = data.writings!;
    expect(w[0].slug).toBe('confissoes');
    expect(w[0].externalUrl).toBeUndefined();
    expect(w[1].slug).toBeUndefined();
    expect(w[1].externalUrl).toBe('https://www.vatican.va/suma');
    expect(w[1].externalSourceLabel).toBe('vatican.va');
  });
});
