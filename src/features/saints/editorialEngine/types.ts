/**
 * Saints Editorial Engine — tipos.
 *
 * Contrato de dados que o motor consome para montar a página do santo.
 * Cada seção é opcional; blocos vazios/nulos são omitidos (skip-if-empty)
 * pelo `buildSaintPage`.
 *
 * Fontes esperadas (Nível 1/2/3 da Constituição de Santos):
 *  - história/timeline: fontes hagiográficas (Butler, Bolandistas)
 *  - virtudes/carisma: síntese editorial
 *  - escritos: `saint_works` (Nível 2, domínio público)
 *  - orações: `prayers` v2 ligadas via `saint_prayers_links`
 *  - fontes: Nível 3 (Vatican.va, Aciprensa, referências oficiais)
 */

export type FeastRank = 'memoria' | 'festa' | 'solenidade' | 'opcional';

export type SaintCategory = 'saint' | 'doctor' | 'father' | 'martyr';

export interface SaintHeaderData {
  name: string;
  alternateNames?: string[];
  category: SaintCategory;
  epoch?: string;
  region?: string;
  patronOf?: string[];
  feast?: {
    dateLabel: string; // "15 de agosto"
    rank?: FeastRank;
  };
  iconography?: {
    attributes?: string[]; // "lírio", "livro"
    imageUrl?: string;
    imageAlt?: string;
  };
  shortBio?: string; // ~200 palavras
}

export interface SaintTimelineEvent {
  year: string; // "1225", "c. 1274", "1567/1568"
  title: string;
  detail?: string;
}

export interface SaintVirtue {
  label: string;
  description?: string;
}

export interface SaintWritingRef {
  id: string;
  title: string;
  slug?: string; // rota /biblioteca/escritos/:slug quando hospedado
  externalUrl?: string; // fallback quando apenas linkado
  attribution?: string;
  license?: string;
  summary?: string;
}

export interface SaintPrayerRef {
  id: string;
  title: string;
  slug: string; // rota /oracao/:slug
  kind?: string;
}

export interface SaintSourceRef {
  label: string;
  url?: string;
  citation?: string; // ex: "Butler, Lives of the Saints, vol. II"
}

export interface SaintEditorialData {
  slug: string;
  header: SaintHeaderData;
  longBio?: string; // biografia longa editorial
  timeline?: SaintTimelineEvent[];
  virtues?: SaintVirtue[];
  writings?: SaintWritingRef[];
  prayers?: SaintPrayerRef[];
  sources?: SaintSourceRef[];
}

/** Identificador estável de bloco — usado por skip-if-empty e testes. */
export type SaintBlockId =
  | 'header'
  | 'bio'
  | 'timeline'
  | 'virtues'
  | 'writings'
  | 'prayers'
  | 'sources';

export interface SaintBlockDescriptor<T = unknown> {
  id: SaintBlockId;
  data: T;
}

export interface SaintPageDescriptor {
  slug: string;
  header: SaintHeaderData;
  blocks: SaintBlockDescriptor[];
}
