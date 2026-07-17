/**
 * Sementes mockadas de nós e relações (Sprint 2.0.4).
 *
 * Alinhadas — mas **independentes** — do ThemeRegistry.
 * O Knowledge Engine é a fonte canônica; a partir da Sprint 2.0.5+,
 * ThemeRegistry passará a delegar leitura aqui.
 */

import type { KnowledgeNode, KnowledgeRelation } from './types';

export const SEED_NODES: KnowledgeNode[] = [
  // Temas
  { id: 'theme:esperanca',  kind: 'theme', label: 'Esperança', summary: 'Virtude teologal',
    route: 'study.composed', routeParams: { slug: 'esperanca' } },
  { id: 'theme:eucaristia', kind: 'theme', label: 'Eucaristia', summary: 'Fonte e cume',
    route: 'study.composed', routeParams: { slug: 'eucaristia' } },
  { id: 'theme:graca',      kind: 'theme', label: 'Graça', summary: 'Dom sobrenatural',
    route: 'study.composed', routeParams: { slug: 'graca' } },

  // Bíblia
  { id: 'bible:romanos:8', kind: 'bible', label: 'Rm 8', summary: 'A esperança que aguarda',
    route: 'study.bible', routeParams: { book: 'romanos', chapter: 8 } },
  { id: 'bible:joao:6',    kind: 'bible', label: 'Jo 6', summary: 'Discurso do Pão da Vida',
    route: 'study.bible', routeParams: { book: 'joao', chapter: 6 } },
  { id: 'bible:efesios:2', kind: 'bible', label: 'Ef 2', summary: 'Salvos pela graça',
    route: 'study.bible', routeParams: { book: 'efesios', chapter: 2 } },

  // Catecismo
  { id: 'catechism:1817', kind: 'catechism', label: 'CIC §§ 1817-1821', summary: 'A virtude da esperança',
    route: 'study.catechism', routeParams: { paragraph: 1817 } },
  { id: 'catechism:1322', kind: 'catechism', label: 'CIC §§ 1322-1419', summary: 'O sacramento da Eucaristia',
    route: 'study.catechism', routeParams: { paragraph: 1322 } },
  { id: 'catechism:1996', kind: 'catechism', label: 'CIC §§ 1996-2005', summary: 'A graça',
    route: 'study.catechism', routeParams: { paragraph: 1996 } },

  // Magistério
  { id: 'magisterium:spe-salvi',              kind: 'magisterium', label: 'Spe Salvi', summary: 'Bento XVI',
    route: 'study.magisterium', routeParams: { doc: 'spe-salvi' } },
  { id: 'magisterium:ecclesia-de-eucharistia',kind: 'magisterium', label: 'Ecclesia de Eucharistia', summary: 'João Paulo II',
    route: 'study.magisterium', routeParams: { doc: 'ecclesia-de-eucharistia' } },
  { id: 'magisterium:trento-justificacao',    kind: 'magisterium', label: 'Trento — Decreto sobre a Justificação',
    route: 'study.magisterium', routeParams: { doc: 'trento-justificacao' } },

  // Padres
  { id: 'father:santo-agostinho',      kind: 'father', label: 'Santo Agostinho',
    route: 'study.father', routeParams: { slug: 'santo-agostinho' } },
  { id: 'father:sao-joao-crisostomo',  kind: 'father', label: 'São João Crisóstomo',
    route: 'study.father', routeParams: { slug: 'sao-joao-crisostomo' } },

  // Santos
  { id: 'saint:santa-teresa-de-avila', kind: 'saint', label: 'Santa Teresa de Ávila',
    route: 'study.saint', routeParams: { slug: 'santa-teresa-de-avila' } },
  { id: 'saint:santo-tomas-de-aquino', kind: 'saint', label: 'Santo Tomás de Aquino',
    route: 'study.saint', routeParams: { slug: 'santo-tomas-de-aquino' } },
  { id: 'saint:santa-teresinha',       kind: 'saint', label: 'Santa Teresinha do Menino Jesus',
    route: 'study.saint', routeParams: { slug: 'santa-teresinha' } },

  // Aplicações e orações (sem rota canônica ainda — nem todo nó abre tela)
  { id: 'application:esperanca-provacao', kind: 'application', label: 'Esperança na provação' },
  { id: 'application:missa-participacao', kind: 'application', label: 'Participação na Missa' },
  { id: 'application:sacramentos-graca',  kind: 'application', label: 'Sacramentos e vida de graça' },

  { id: 'prayer:lectio-rm-8',    kind: 'prayer', label: 'Lectio: Rm 8, 24-25',
    route: 'pray.lectio', routeParams: { slug: 'rm-8-24-25' } },
  { id: 'prayer:adoracao',       kind: 'prayer', label: 'Adoração eucarística',
    route: 'pray.lectio', routeParams: { slug: 'adoracao-eucaristica' } },
  { id: 'prayer:oracao-graca',   kind: 'prayer', label: 'Oração de agradecimento pela graça',
    route: 'pray.lectio', routeParams: { slug: 'oracao-graca' } },
];

/**
 * Relações canônicas do Estudo Composto para os 3 temas mock.
 * Cada tema `develops` os 7 estágios na ordem canônica.
 */
export const SEED_RELATIONS: KnowledgeRelation[] = [
  // Esperança
  { from: 'theme:esperanca', to: 'bible:romanos:8',                     kind: 'develops', weight: 0.95 },
  { from: 'theme:esperanca', to: 'catechism:1817',                      kind: 'defined-in', weight: 0.9 },
  { from: 'theme:esperanca', to: 'magisterium:spe-salvi',               kind: 'develops', weight: 0.9 },
  { from: 'theme:esperanca', to: 'father:santo-agostinho',              kind: 'commented-by', weight: 0.7 },
  { from: 'theme:esperanca', to: 'saint:santa-teresa-de-avila',         kind: 'commented-by', weight: 0.6 },
  { from: 'theme:esperanca', to: 'application:esperanca-provacao',      kind: 'applies-to', weight: 0.8 },
  { from: 'theme:esperanca', to: 'prayer:lectio-rm-8',                  kind: 'prayed-as', weight: 0.85 },

  // Eucaristia
  { from: 'theme:eucaristia', to: 'bible:joao:6',                        kind: 'develops', weight: 0.95 },
  { from: 'theme:eucaristia', to: 'catechism:1322',                      kind: 'defined-in', weight: 0.9 },
  { from: 'theme:eucaristia', to: 'magisterium:ecclesia-de-eucharistia', kind: 'develops', weight: 0.9 },
  { from: 'theme:eucaristia', to: 'father:sao-joao-crisostomo',          kind: 'commented-by', weight: 0.75 },
  { from: 'theme:eucaristia', to: 'saint:santo-tomas-de-aquino',         kind: 'commented-by', weight: 0.8 },
  { from: 'theme:eucaristia', to: 'application:missa-participacao',      kind: 'applies-to', weight: 0.8 },
  { from: 'theme:eucaristia', to: 'prayer:adoracao',                     kind: 'prayed-as', weight: 0.85 },

  // Graça
  { from: 'theme:graca', to: 'bible:efesios:2',                          kind: 'develops', weight: 0.95 },
  { from: 'theme:graca', to: 'catechism:1996',                           kind: 'defined-in', weight: 0.9 },
  { from: 'theme:graca', to: 'magisterium:trento-justificacao',          kind: 'develops', weight: 0.9 },
  { from: 'theme:graca', to: 'father:santo-agostinho',                   kind: 'commented-by', weight: 0.85 },
  { from: 'theme:graca', to: 'saint:santa-teresinha',                    kind: 'commented-by', weight: 0.6 },
  { from: 'theme:graca', to: 'application:sacramentos-graca',            kind: 'applies-to', weight: 0.8 },
  { from: 'theme:graca', to: 'prayer:oracao-graca',                      kind: 'prayed-as', weight: 0.75 },

  // Afinidades cruzadas
  { from: 'theme:eucaristia', to: 'theme:graca', kind: 'related-to', weight: 0.5 },
  { from: 'father:santo-agostinho', to: 'saint:santa-teresinha', kind: 'related-to', weight: 0.3 },
];
