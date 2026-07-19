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
  | 'study.composed'      // /temas/:slug
  | 'study.bible'         // /bible?book=&chapter=
  | 'study.catechism'     // /catechism?p=:paragraph
  | 'study.magisterium'   // /magisterium/:doc
  | 'study.father'        // /biblioteca?padre=:slug (TODO rota canônica)
  | 'study.saint'         // /santos/:slug
  | 'pray.lectio'         // /lectio?slug=:slug
  | 'pray.liturgy-today'; // /liturgia

/** Verbo semântico de ação — usado por SearchRegistry. */
export type NavAction =
  | 'open-reader'
  | 'open-composed-study'
  | 'open-document'
  | 'open-profile'
  | 'open-environment';
