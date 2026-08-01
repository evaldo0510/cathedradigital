/**
 * Portal de Documentação — tipos do conteúdo localizado.
 *
 * O conteúdo é versionado no repositório (sem banco), um arquivo por idioma.
 * Os `slug` são idênticos em todos os idiomas para manter URLs estáveis e
 * permitir hreflang correto entre `/docs/...` e `/en/docs/...`.
 */
import type { Language } from '@/types';

export type DocCategory = 'inicio' | 'leitura' | 'oracao' | 'estudo';

export interface DocSection {
  heading: string;
  body: string[];
}

export interface DocGuide {
  slug: string;
  category: DocCategory;
  title: string;
  summary: string;
  /** Termos extras para a busca (sinônimos, nomes próprios). */
  keywords: string[];
  sections: DocSection[];
  /** Preenchido quando o guia vem do idioma de referência por falta de tradução. */
  fallbackFrom?: Language;
}


export interface DocsBundle {
  /** Rótulos das categorias no idioma. */
  categories: Record<DocCategory, string>;
  ui: {
    portalTitle: string;
    portalSubtitle: string;
    searchLabel: string;
    searchPlaceholder: string;
    empty: string;
    resultsCount: (n: number) => string;
    back: string;
    onThisPage: string;
    translationNotice?: string;
  };
  guides: DocGuide[];
}

export type DocsCatalog = Record<Language, DocsBundle | undefined>;
