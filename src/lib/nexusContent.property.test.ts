import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { formatNexusContent } from './nexusContent';

/**
 * Property-based tests: garantem que formatNexusContent NUNCA lança erro
 * com reference_id arbitrários/inválidos e sempre mantém o restante do
 * conteúdo intacto (id, content_text, type, metadata.tags).
 */
describe('formatNexusContent - property-based (fast-check)', () => {
  const types = ['bible', 'catechism', 'magisterium', 'journey', 'unknown', ''];

  it('nunca lança e preserva id/type/content_text para reference_id arbitrário (string)', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.constantFrom(...types),
        fc.string(),
        fc.string(),
        (referenceId, type, id, contentText) => {
          const data = {
            id,
            type,
            reference_id: referenceId,
            content_text: contentText,
            title: null,
            metadata: {},
            tags: [],
          };
          const out = formatNexusContent(data, type);
          expect(out).toBeDefined();
          expect(out.id).toBe(id);
          if (type !== 'journey') {
            expect(out.content_text).toBe(contentText);
            expect(out.type).toBe(type);
            expect(Array.isArray(out.metadata.tags)).toBe(true);
          }
        }
      ),
      { numRuns: 300 }
    );
  });

  it('nunca lança para reference_id de qualquer tipo (null, undefined, number, obj, array, bool)', () => {
    const anything = fc.oneof(
      fc.constant(null),
      fc.constant(undefined),
      fc.integer(),
      fc.double(),
      fc.boolean(),
      fc.string(),
      fc.array(fc.anything(), { maxLength: 5 }),
      fc.object({ maxDepth: 2 }),
    );
    fc.assert(
      fc.property(anything, fc.constantFrom(...types), (referenceId, type) => {
        expect(() =>
          formatNexusContent(
            { id: 'x', type, reference_id: referenceId, content_text: '', metadata: {}, tags: [] },
            type
          )
        ).not.toThrow();
      }),
      { numRuns: 300 }
    );
  });

  it('mantém tags e metadata originais intactas independente do reference_id', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
        fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean())),
        (referenceId, tags, extraMeta) => {
          const data = {
            id: 'p1',
            type: 'bible',
            reference_id: referenceId,
            content_text: 'x',
            metadata: { ...extraMeta },
            tags,
          };
          const out = formatNexusContent(data, 'bible');
          expect(out.metadata.tags).toEqual(tags);
          for (const k of Object.keys(extraMeta)) {
            if (k !== 'book' && k !== 'chapter' && k !== 'verse' && k !== 'tags') {
              expect(out.metadata[k]).toEqual(extraMeta[k]);
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('quando reference_id é lixo, book/chapter/verse ficam undefined (seguro) e nunca NaN', () => {
    const garbage = fc.string().filter((s) => !/^[1-3]?\s?[A-Za-zÀ-ÿ]+\.?\s+\d+/.test(s.trim()));
    fc.assert(
      fc.property(garbage, (referenceId) => {
        const out = formatNexusContent(
          { id: 'g', type: 'bible', reference_id: referenceId, content_text: '', metadata: {}, tags: [] },
          'bible'
        );
        expect(Number.isNaN(out.metadata.chapter)).toBe(false);
        expect(Number.isNaN(out.metadata.verse)).toBe(false);
      }),
      { numRuns: 300 }
    );
  });
});
