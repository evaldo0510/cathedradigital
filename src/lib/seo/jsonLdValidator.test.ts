import { describe, it, expect } from 'vitest';
import { validateJsonLd, validateJsonLdList } from './jsonLdValidator';

describe('jsonLdValidator', () => {
  it('aceita Event válido', () => {
    expect(
      validateJsonLd({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'Laudes',
        startDate: '2026-07-21',
      }),
    ).toEqual([]);
  });

  it('rejeita Article sem headline/author/publisher', () => {
    const errs = validateJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
    });
    expect(errs.length).toBeGreaterThanOrEqual(3);
  });

  it('rejeita @context incorreto', () => {
    const errs = validateJsonLd({
      '@context': 'http://schema.org',
      '@type': 'Event',
      name: 'X',
      startDate: '2026-01-01',
    });
    expect(errs.join(' ')).toMatch(/@context/);
  });

  it('valida FAQPage com Questions/Answers', () => {
    expect(
      validateJsonLdList([
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'A' } },
          ],
        },
      ]),
    ).toEqual([]);
  });
});
