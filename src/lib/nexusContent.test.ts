import { describe, it, expect, vi } from 'vitest';
import { formatNexusContent } from './nexusContent';

describe('formatNexusContent', () => {
  it('should provide correct fallback for bible content without title/reference_id', () => {
    const data = { id: '1', type: 'bible', content_text: 'Verse' };
    const formatted = formatNexusContent(data, 'bible');
    expect(formatted.title).toBe('Escritura');
    expect(formatted.content_text).toBe('Verse');
  });

  it('should provide correct fallback for catechism content without title/reference_id', () => {
    const data = { id: '2', type: 'catechism', content_text: 'Paragraph' };
    const formatted = formatNexusContent(data, 'catechism');
    expect(formatted.title).toBe('Catecismo');
  });

  it('should use reference_id when available', () => {
    const data = { id: '3', type: 'bible', reference_id: 'Jo 1,1', title: 'Ignored Title' };
    const formatted = formatNexusContent(data, 'bible');
    expect(formatted.title).toBe('Jo 1,1');
  });

  it('should use title when reference_id is missing', () => {
    const data = { id: '4', type: 'magisterium', title: 'Lumen Gentium' };
    const formatted = formatNexusContent(data, 'magisterium');
    expect(formatted.title).toBe('Lumen Gentium');
  });

  it('should handle journey content with fallback', () => {
    const data = { id: '5', title: '' };
    const formatted = formatNexusContent(data, 'journey');
    expect(formatted.title).toBe('Jornada Espiritual');
  });

  it('should never have empty content_text', () => {
    const data = { id: '6', type: 'bible', content_text: null };
    const formatted = formatNexusContent(data, 'bible');
    expect(formatted.content_text).toBe('');
  });
});

describe('formatNexusContent — parse de reference_id bíblico', () => {
  const base = (reference_id: string, metadata: any = {}) => ({
    id: 'x',
    type: 'bible',
    content_text: 'v',
    reference_id,
    metadata,
  });

  it('parseia "Jo 14, 6" (livro curto + capítulo, versículo com espaço)', () => {
    const r = formatNexusContent(base('Jo 14, 6'), 'bible');
    expect(r.metadata.book).toBe('Jo');
    expect(r.metadata.chapter).toBe(14);
    expect(r.metadata.verse).toBe(6);
  });

  it('parseia "Mt 11,29" (sem espaço após vírgula)', () => {
    const r = formatNexusContent(base('Mt 11,29'), 'bible');
    expect(r.metadata).toMatchObject({ book: 'Mt', chapter: 11, verse: 29 });
  });

  it('parseia "1Cor 13,4" (livro com prefixo numérico colado)', () => {
    const r = formatNexusContent(base('1Co 13,4'), 'bible');
    expect(r.metadata).toMatchObject({ book: '1Co', chapter: 13, verse: 4 });
  });

  it('parseia "1 Cor 13, 4" (prefixo numérico com espaço)', () => {
    const r = formatNexusContent(base('1 Co 13, 4'), 'bible');
    expect(r.metadata).toMatchObject({ book: '1Co', chapter: 13, verse: 4 });
  });

  it('parseia "Jo 1:14" (dois-pontos como separador)', () => {
    const r = formatNexusContent(base('Jo 1:14'), 'bible');
    expect(r.metadata).toMatchObject({ book: 'Jo', chapter: 1, verse: 14 });
  });

  it('parseia referência de capítulo sem versículo ("Sl 23")', () => {
    const r = formatNexusContent(base('Sl 23'), 'bible');
    expect(r.metadata.book).toBe('Sl');
    expect(r.metadata.chapter).toBe(23);
    expect(r.metadata.verse).toBeUndefined();
  });

  it('não sobrescreve metadata pré-existente', () => {
    const r = formatNexusContent(
      base('Jo 14, 6', { book: 'Mt', chapter: 5, verse: 3 }),
      'bible',
    );
    expect(r.metadata).toMatchObject({ book: 'Mt', chapter: 5, verse: 3 });
  });

  it('preenche apenas verse quando book/chapter já vieram', () => {
    const r = formatNexusContent(
      base('Jo 14, 6', { book: 'Jo', chapter: 14 }),
      'bible',
    );
    // parser só roda quando falta book OU chapter, então metadata permanece sem verse
    expect(r.metadata.book).toBe('Jo');
    expect(r.metadata.chapter).toBe(14);
  });

  it('ignora reference_id inválido sem quebrar', () => {
    const r = formatNexusContent(base('livro-invalido 99'), 'bible');
    expect(r.metadata.book).toBeUndefined();
    expect(r.metadata.chapter).toBeUndefined();
  });

  it('ignora quando reference_id é nulo/vazio', () => {
    const r1 = formatNexusContent({ id: '1', type: 'bible', reference_id: null }, 'bible');
    const r2 = formatNexusContent({ id: '2', type: 'bible', reference_id: '' }, 'bible');
    expect(r1.metadata.book).toBeUndefined();
    expect(r2.metadata.book).toBeUndefined();
  });

  it('não parseia quando type !== "bible"', () => {
    const r = formatNexusContent(
      { id: '1', type: 'catechism', reference_id: 'Jo 14, 6', metadata: {} },
      'catechism',
    );
    expect(r.metadata.book).toBeUndefined();
  });
});

describe('formatNexusContent — reference_id com pontuação/espaços extras', () => {
  const base = (reference_id: string) => ({
    id: 'x',
    type: 'bible',
    content_text: 'v',
    reference_id,
    metadata: {},
  });

  it('parseia "Jo 14 , 6" (espaço antes e depois da vírgula)', () => {
    const r = formatNexusContent(base('Jo 14 , 6'), 'bible');
    expect(r.metadata).toMatchObject({ book: 'Jo', chapter: 14, verse: 6 });
  });

  it('parseia "Mt 11 : 29" (dois-pontos com espaço)', () => {
    const r = formatNexusContent(base('Mt 11 : 29'), 'bible');
    expect(r.metadata).toMatchObject({ book: 'Mt', chapter: 11, verse: 29 });
  });

  it('parseia "Jo 14 . 6" (ponto como separador com espaços)', () => {
    const r = formatNexusContent(base('Jo 14 . 6'), 'bible');
    expect(r.metadata).toMatchObject({ book: 'Jo', chapter: 14, verse: 6 });
  });

  it('parseia "Jo.  14, 6" (ponto após abreviação + espaços duplos)', () => {
    const r = formatNexusContent(base('Jo.  14, 6'), 'bible');
    expect(r.metadata).toMatchObject({ book: 'Jo', chapter: 14, verse: 6 });
  });

  it('parseia "  Mt   11,29  " (espaços em volta e no meio)', () => {
    const r = formatNexusContent(base('  Mt   11,29  '), 'bible');
    expect(r.metadata).toMatchObject({ book: 'Mt', chapter: 11, verse: 29 });
  });

  it('parseia "1 Cor  13 , 4" (prefixo numérico + múltiplos espaços)', () => {
    const r = formatNexusContent(base('1 Co  13 , 4'), 'bible');
    expect(r.metadata).toMatchObject({ book: '1Co', chapter: 13, verse: 4 });
  });
});

