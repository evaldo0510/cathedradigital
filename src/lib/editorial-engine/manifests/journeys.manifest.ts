/**
 * Manifesto oficial das Jornadas espirituais (7–14 dias).
 *
 * Reflete os campos reais da tabela `journeys`.
 * As Jornadas já têm hero editorial (Logos 2030), narrativa e passos,
 * mas cobertura ainda é parcial → lifecycle "developing".
 */

import type { EntityManifest } from "../types";

export const journeysManifest: EntityManifest = {
  id: "journeys",
  label: "Jornadas Espirituais",
  shortLabel: "Jornadas",
  table: "journeys",
  slugField: "slug",
  titleField: "title",
  statusField: "status",         // draft | published
  auditRoute: "/admin/editorial-audit?entity=journeys",
  icon: "Compass",
  weight: 7,
  ready: true,
  accent: "primary",
  lifecycle: {
    version: "0.1",
    status: "developing",
    certification: false,
    migration: 0.35,
  },
  fields: [
    // — Identidade —
    { key: "title",             label: "Título",              group: "meta",      required: true,  weight: 1 },
    { key: "category",          label: "Categoria",           group: "meta",      required: true,  weight: 1 },
    { key: "difficulty",        label: "Dificuldade",         group: "meta",      required: true,  weight: 1 },
    { key: "estimated_days",    label: "Duração (dias)",      group: "meta",      required: true,  weight: 1 },

    // — Núcleo editorial (Logos 2030) —
    { key: "subtitle",          label: "Subtítulo",           group: "editorial", required: true,  weight: 1 },
    { key: "description",       label: "Descrição",           group: "editorial", required: true,  weight: 2 },
    { key: "hero_kicker",       label: "Kicker do Hero",      group: "editorial", required: true,  weight: 1 },
    { key: "hero_quote",        label: "Citação do Hero",     group: "editorial", required: true,  weight: 1 },
    { key: "hero_image_url",    label: "Imagem do Hero",      group: "editorial", required: true,  weight: 2 },
    { key: "narrative_intro",   label: "Introdução narrativa",group: "editorial", required: true,  weight: 3 },
    { key: "closing_message",   label: "Mensagem final",      group: "editorial", required: true,  weight: 2 },

    // — Núcleo Nexus —
    { key: "tags",              label: "Tags temáticas",      group: "nexus",     required: true,  weight: 1 },
    { key: "steps_count",       label: "Passos publicados",   group: "nexus",     required: true,  weight: 3 },
  ],
};
