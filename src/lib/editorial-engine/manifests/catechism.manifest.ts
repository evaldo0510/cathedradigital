/**
 * Manifesto oficial do Catecismo da Igreja Católica (CIC) no Editorial Engine.
 *
 * Reflete a tabela `catechism_official` (parágrafos 1..2865).
 * Fase 1.5 · plugagem inicial → lifecycle "developing".
 */

import type { EntityManifest } from "../types";

export const catechismManifest: EntityManifest = {
  id: "catechism",
  label: "Catecismo da Igreja Católica",
  shortLabel: "Catecismo",
  table: "catechism_official",
  slugField: "slug",
  titleField: "paragraph",
  statusField: "status",
  auditRoute: "/admin/editorial-audit?entity=catechism",
  icon: "BookOpen",
  weight: 10,
  ready: true,
  accent: "primary",
  lifecycle: {
    version: "0.1",
    status: "developing",
    certification: false,
    migration: 0.1,
  },
  fields: [
    // — Identidade —
    { key: "paragraph", label: "Nº do parágrafo", group: "meta", required: true, weight: 1 },

    // — Núcleo editorial —
    { key: "texto_base",             label: "Texto oficial",         group: "editorial", required: true,  weight: 3 },
    { key: "explicacao",             label: "Explicação",            group: "editorial", required: true,  weight: 2 },
    { key: "interpretacao_profunda", label: "Interpretação profunda",group: "editorial", required: true,  weight: 2 },
    { key: "aplicacao_pratica",      label: "Aplicação prática",     group: "editorial", required: false, weight: 1 },
    { key: "reflexao_final",         label: "Reflexão final",        group: "editorial", required: false, weight: 1 },
    { key: "exercicio",              label: "Exercício espiritual",  group: "editorial", required: false, weight: 1 },

    // — Núcleo Nexus —
    { key: "related_bible",     label: "Referências bíblicas",   group: "nexus", required: true,  weight: 2 },
    { key: "related_glossary",  label: "Verbetes do Glossário",  group: "nexus", required: false, weight: 1 },
    { key: "related_catechism", label: "CIC cruzados",           group: "nexus", required: false, weight: 1 },
  ],
};
