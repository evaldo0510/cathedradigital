/**
 * ThemeRegistry — coração do Cathedra 2.0.
 *
 * Um tema NÃO abre a Bíblia; um tema abre um **Estudo Composto** que
 * percorre, na ordem canônica:
 *
 *   Bíblia → Catecismo → Magistério → Padres → Santos → Aplicação → Oração
 *
 * Cada passo é um `ComposedStudyStep` com destino resolvido via RouteRegistry.
 * (Sprint 2.0.3A: dados mockados. Sprint 2.0.6: adapter real.)
 */

import type { NavAction } from './types';
import { RouteRegistry } from './RouteRegistry';

/** Ordem canônica dos passos do Estudo Composto. */
export type ComposedStudyStage =
  | 'bible'
  | 'catechism'
  | 'magisterium'
  | 'fathers'
  | 'saints'
  | 'application'
  | 'prayer';

export const COMPOSED_STUDY_ORDER: ComposedStudyStage[] = [
  'bible',
  'catechism',
  'magisterium',
  'fathers',
  'saints',
  'application',
  'prayer',
];

export interface ComposedStudyStep {
  stage: ComposedStudyStage;
  label: string;              // ex.: "Rm 8, 24-25"
  hint?: string;              // ex.: "Paulo e a esperança na tribulação"
  targetPath: string;         // sempre gerado via RouteRegistry
  action: NavAction;          // verbo semântico da ação
}

export interface ThemeDescriptor {
  slug: string;
  label: string;
  short?: string;
  composedStudy: ComposedStudyStep[];
}

const THEMES: ThemeDescriptor[] = [
  {
    slug: 'esperanca',
    label: 'Esperança',
    short: 'Virtude teologal',
    composedStudy: [
      { stage: 'bible',       label: 'Rm 8, 24-25',                    hint: 'Paulo e a esperança que aguarda',
        targetPath: RouteRegistry.resolve('study.bible', { book: 'romanos', chapter: 8 }), action: 'open-reader' },
      { stage: 'catechism',   label: 'CIC §§ 1817-1821',               hint: 'A virtude da esperança',
        targetPath: RouteRegistry.resolve('study.catechism', { paragraph: 1817 }), action: 'open-document' },
      { stage: 'magisterium', label: 'Spe Salvi — Bento XVI',           hint: 'Encíclica sobre a esperança cristã',
        targetPath: RouteRegistry.resolve('study.magisterium', { doc: 'spe-salvi' }), action: 'open-document' },
      { stage: 'fathers',     label: 'Santo Agostinho — De Spe',        hint: 'A esperança como âncora da alma',
        targetPath: RouteRegistry.resolve('study.father', { slug: 'agostinho' }), action: 'open-profile' },
      { stage: 'saints',      label: 'Santa Teresa de Ávila',           hint: 'Testemunho de vida em esperança',
        targetPath: RouteRegistry.resolve('study.saint', { slug: 'teresa-avila' }), action: 'open-profile' },
      { stage: 'application', label: 'Aplicação: esperança e provação', hint: 'Como viver a virtude no cotidiano',
        targetPath: RouteRegistry.resolve('study.composed', { slug: 'esperanca' }) + '#aplicacao', action: 'open-composed-study' },
      { stage: 'prayer',      label: 'Lectio: Rm 8, 24-25',             hint: 'Oração pessoal a partir da Palavra',
        targetPath: RouteRegistry.resolve('pray.lectio', { slug: 'rm-8-24-25' }), action: 'open-document' },
    ],
  },
  {
    slug: 'eucaristia',
    label: 'Eucaristia',
    short: 'Fonte e cume',
    composedStudy: [
      { stage: 'bible',       label: 'Jo 6, 22-59',                     hint: 'Discurso do Pão da Vida',
        targetPath: RouteRegistry.resolve('study.bible', { book: 'joao', chapter: 6 }), action: 'open-reader' },
      { stage: 'catechism',   label: 'CIC §§ 1322-1419',                hint: 'O sacramento da Eucaristia',
        targetPath: RouteRegistry.resolve('study.catechism', { paragraph: 1322 }), action: 'open-document' },
      { stage: 'magisterium', label: 'Ecclesia de Eucharistia',         hint: 'João Paulo II',
        targetPath: RouteRegistry.resolve('study.magisterium', { doc: 'ecclesia-de-eucharistia' }), action: 'open-document' },
      { stage: 'fathers',     label: 'São João Crisóstomo',             hint: 'Homilias sobre a Eucaristia',
        targetPath: RouteRegistry.resolve('study.father', { slug: 's-joao-crisostomo-0913' }), action: 'open-profile' },
      { stage: 'saints',      label: 'Santo Tomás de Aquino',           hint: 'Adoro te devote e a doutrina eucarística',
        targetPath: RouteRegistry.resolve('study.saint', { slug: 'thomas-aquinas' }), action: 'open-profile' },
      { stage: 'application', label: 'Aplicação: participação na Missa',
        targetPath: RouteRegistry.resolve('study.composed', { slug: 'eucaristia' }) + '#aplicacao', action: 'open-composed-study' },
      { stage: 'prayer',      label: 'Adoração eucarística',
        targetPath: RouteRegistry.resolve('pray.lectio', { slug: 'adoracao-eucaristica' }), action: 'open-document' },
    ],
  },
  {
    slug: 'graca',
    label: 'Graça',
    short: 'Dom sobrenatural',
    composedStudy: [
      { stage: 'bible',       label: 'Ef 2, 4-10',
        targetPath: RouteRegistry.resolve('study.bible', { book: 'efesios', chapter: 2 }), action: 'open-reader' },
      { stage: 'catechism',   label: 'CIC §§ 1996-2005',
        targetPath: RouteRegistry.resolve('study.catechism', { paragraph: 1996 }), action: 'open-document' },
      { stage: 'magisterium', label: 'Concílio de Trento — Decreto sobre a Justificação',
        targetPath: RouteRegistry.resolve('study.magisterium', { doc: 'trento-justificacao' }), action: 'open-document' },
      { stage: 'fathers',     label: 'Santo Agostinho — De Gratia et Libero Arbitrio',
        targetPath: RouteRegistry.resolve('study.father', { slug: 'agostinho' }), action: 'open-profile' },
      { stage: 'saints',      label: 'Santa Teresinha do Menino Jesus',
        targetPath: RouteRegistry.resolve('study.saint', { slug: 'teresinha' }), action: 'open-profile' },
      { stage: 'application', label: 'Aplicação: sacramentos e vida de graça',
        targetPath: RouteRegistry.resolve('study.composed', { slug: 'graca' }) + '#aplicacao', action: 'open-composed-study' },
      { stage: 'prayer',      label: 'Oração de agradecimento pela graça',
        targetPath: RouteRegistry.resolve('pray.lectio', { slug: 'oracao-graca' }), action: 'open-document' },
    ],
  },
];

export const ThemeRegistry = {
  all(): ThemeDescriptor[] {
    return THEMES;
  },
  get(slug: string): ThemeDescriptor | undefined {
    return THEMES.find((t) => t.slug === slug);
  },
  featured(limit = 6): ThemeDescriptor[] {
    return THEMES.slice(0, limit);
  },
};
