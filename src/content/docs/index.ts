/**
 * Portal de Documentação — catálogo localizado e busca.
 *
 * Fallback: idioma pedido → português (idioma editorial de referência).
 */
import type { Language } from '@/types';
import { DEFAULT_LOCALE } from '@/lib/i18n/locales';
import type { DocGuide, DocsBundle } from './types';
import { docsPt } from './pt';
import { docsEn } from './en';
import { docsEs } from './es';
import { docsIt } from './it';
import { docsLa } from './la';

export * from './types';

const CATALOG: Partial<Record<Language, DocsBundle>> = {
  pt: docsPt,
  en: docsEn,
  es: docsEs,
  it: docsIt,
  la: docsLa,
};

export function getDocsBundle(lang: Language): DocsBundle {
  return CATALOG[lang] ?? CATALOG[DEFAULT_LOCALE] ?? docsPt;
}

export function getDocGuide(lang: Language, slug: string): DocGuide | undefined {
  return getDocsBundle(lang).guides.find((g) => g.slug === slug);
}

export function normalizeQuery(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Busca simples por título, resumo, palavras-chave e corpo das seções. */
export function searchDocs(lang: Language, query: string): DocGuide[] {
  const guides = getDocsBundle(lang).guides;
  const q = normalizeQuery(query);
  if (!q) return guides;
  const terms = q.split(/\s+/).filter(Boolean);

  const scored = guides
    .map((guide) => {
      const haystack = normalizeQuery(
        [
          guide.title,
          guide.summary,
          guide.keywords.join(' '),
          guide.sections.map((s) => `${s.heading} ${s.body.join(' ')}`).join(' '),
        ].join(' '),
      );
      const title = normalizeQuery(guide.title);
      let score = 0;
      for (const term of terms) {
        if (!haystack.includes(term)) return null;
        score += title.includes(term) ? 3 : 1;
      }
      return { guide, score };
    })
    .filter((r): r is { guide: DocGuide; score: number } => r !== null)
    .sort((a, b) => b.score - a.score);

  return scored.map((r) => r.guide);
}
