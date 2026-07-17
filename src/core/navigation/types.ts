/**
 * Tipos compartilhados dos Contratos Globais (Sprint 2.0.3A).
 *
 * NENHUM tipo aqui pode depender de módulos de ambiente ou de UI.
 */

/** Os 5 ambientes canônicos do Cathedra 2.0. */
export type EnvironmentKey =
  | 'estudar'
  | 'rezar'
  | 'formar-se'
  | 'pesquisar'
  | 'minha-jornada';

/** Fontes de conhecimento dentro do ambiente Estudar (§ Taxonomia 2.0). */
export type StudySource =
  | 'bible'
  | 'catechism'
  | 'magisterium'
  | 'canon'
  | 'fathers'
  | 'councils'
  | 'saints';

/** Chave canônica de rota. Consumidores usam a chave, nunca o path literal. */
export type RouteKey =
  | 'atrium'
  | 'env.estudar'
  | 'env.rezar'
  | 'env.formar-se'
  | 'env.pesquisar'
  | 'env.minha-jornada'
  | 'study.composed'      // /estudar/tema/:slug (Estudo Composto)
  | 'study.bible'         // /estudar/biblia/:book/:chapter
  | 'study.catechism'     // /estudar/catecismo/:paragraph
  | 'study.magisterium'   // /estudar/magisterio/:doc
  | 'study.father'        // /estudar/padres/:slug
  | 'study.saint'         // /estudar/santos/:slug
  | 'pray.lectio'         // /rezar/lectio/:slug
  | 'pray.liturgy-today'; // /rezar/liturgia/hoje

/** Verbo semântico de ação — usado por SearchRegistry. */
export type NavAction =
  | 'open-reader'
  | 'open-composed-study'
  | 'open-document'
  | 'open-profile'
  | 'open-environment';
