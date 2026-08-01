/**
 * Portal de Documentação — catálogo localizado e busca.
 *
 * Fallback: idioma pedido → português (idioma editorial de referência).
 * Guias ainda não traduzidos aparecem no idioma ativo marcados com
 * `fallbackFrom`, para que a UI possa avisar o leitor.
 */
import type { Language } from '@/types';
import { DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { getDocPopularity, popularityBoost } from '@/lib/docsPopularity';
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

const bundleCache = new Map<Language, DocsBundle>();

/**
 * Bundle do idioma com fallback por guia: se o idioma não traduziu um guia
 * existente em português, ele entra no catálogo marcado como fallback.
 */
export function getDocsBundle(lang: Language): DocsBundle {
  const cached = bundleCache.get(lang);
  if (cached) return cached;

  const base = CATALOG[DEFAULT_LOCALE] ?? docsPt;
  const bundle = CATALOG[lang] ?? base;
  if (bundle === base) {
    bundleCache.set(lang, base);
    return base;
  }

  const own = new Set(bundle.guides.map((g) => g.slug));
  const missing = base.guides
    .filter((g) => !own.has(g.slug))
    .map<DocGuide>((g) => ({ ...g, fallbackFrom: DEFAULT_LOCALE }));

  const merged: DocsBundle = missing.length
    ? { ...bundle, guides: [...bundle.guides, ...missing] }
    : bundle;

  bundleCache.set(lang, merged);
  return merged;
}

export function getDocGuide(lang: Language, slug: string): DocGuide | undefined {
  return getDocsBundle(lang).guides.find((g) => g.slug === slug);
}

/** Todos os slugs publicados (idênticos em todos os idiomas). */
export function getAllDocSlugs(): string[] {
  return (CATALOG[DEFAULT_LOCALE] ?? docsPt).guides.map((g) => g.slug);
}

export function normalizeQuery(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export interface DocSearchResult {
  guide: DocGuide;
  score: number;
  /** Trecho do corpo contendo o primeiro termo encontrado (para destaque). */
  snippet?: string;
}

function extractSnippet(guide: DocGuide, term: string): string | undefined {
  for (const section of guide.sections) {
    for (const paragraph of section.body) {
      const idx = normalizeQuery(paragraph).indexOf(term);
      if (idx === -1) continue;
      const start = Math.max(0, idx - 60);
      const end = Math.min(paragraph.length, idx + term.length + 120);
      return `${start > 0 ? '…' : ''}${paragraph.slice(start, end).trim()}${end < paragraph.length ? '…' : ''}`;
    }
  }
  return undefined;
}

/**
 * Busca com correspondência parcial: cada termo com 2+ caracteres casa como
 * substring em título, resumo, palavras-chave e corpo.
 * Pesos: título ×5 (×6 no prefixo), resumo ×3, keywords ×2, corpo ×1 e
 * popularidade ×1,5 (desempate por documentos mais consultados).
 * Guias em fallback de idioma perdem 1 ponto.
 */
export function searchDocsDetailed(lang: Language, query: string): DocSearchResult[] {
  const guides = getDocsBundle(lang).guides;
  const popularity = getDocPopularity();
  const q = normalizeQuery(query);
  const rank = (guide: DocGuide, score: number) => score + popularityBoost(guide.slug, popularity);
  if (!q) {
    return guides
      .map((guide) => ({ guide, score: rank(guide, 0) }))
      .sort((a, b) => b.score - a.score || a.guide.title.localeCompare(b.guide.title));
  }
  const terms = Array.from(new Set(q.split(/\s+/).filter((t) => t.length >= 2)));
  if (terms.length === 0) {
    return guides
      .map((guide) => ({ guide, score: rank(guide, 0) }))
      .sort((a, b) => b.score - a.score || a.guide.title.localeCompare(b.guide.title));
  }

  const results: DocSearchResult[] = [];
  for (const guide of guides) {
    const title = normalizeQuery(guide.title);
    const summary = normalizeQuery(guide.summary);
    const keywords = normalizeQuery(guide.keywords.join(' '));
    const body = normalizeQuery(
      guide.sections.map((s) => `${s.heading} ${s.body.join(' ')}`).join(' '),
    );

    let score = 0;
    let matchedAll = true;
    let snippetTerm: string | undefined;

    for (const term of terms) {
      let termScore = 0;
      if (title.includes(term)) termScore += title.startsWith(term) ? 6 : 5;
      if (summary.includes(term)) termScore += 3;
      if (keywords.includes(term)) termScore += 2;
      if (body.includes(term)) {
        termScore += 1;
        snippetTerm ??= term;
      }
      if (termScore === 0) {
        matchedAll = false;
        break;
      }
      score += termScore;
    }
    if (!matchedAll) continue;
    if (guide.fallbackFrom) score -= 1; // conteúdo ainda não traduzido desce

    results.push({
      guide,
      score: rank(guide, score),
      snippet: snippetTerm ? extractSnippet(guide, snippetTerm) : undefined,
    });
  }

  return results.sort((a, b) => b.score - a.score || a.guide.title.localeCompare(b.guide.title));
}


/** Compatibilidade: apenas os guias, na ordem de relevância. */
export function searchDocs(lang: Language, query: string): DocGuide[] {
  return searchDocsDetailed(lang, query).map((r) => r.guide);
}
