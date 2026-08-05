/**
 * Manifesto oficial da Liturgia (Missa e Ofício Divino).
 *
 * Reflete as tabelas `liturgy_day` e `liturgy_texts`.
 */

import type { EntityManifest } from "../types";

export const liturgyManifest: EntityManifest = {
  id: "liturgy",
  label: "Liturgia Romana",
  shortLabel: "Liturgia",
  table: "liturgy_texts",
  slugField: "slug",
  titleField: "title",
  statusField: "status",
  auditRoute: "/admin/editorial-audit?entity=liturgy",
  icon: "Church",
  weight: 10,
  ready: true,
  accent: "secondary",
  lifecycle: {
    version: "0.1",
    status: "developing",
    certification: false,
    migration: 0.2, // Ciclo A/B/C sendo populado
  },
  fields: [
    // — Identidade —
    { key: "liturgical_day", label: "Dia Litúrgico", group: "meta", required: true, weight: 1 },
    { key: "cycle", label: "Ciclo (A/B/C/I/II)", group: "meta", required: true, weight: 1 },

    // — Núcleo editorial —
    { key: "intro_reflection", label: "Reflexão Intróito", group: "editorial", required: true, weight: 2 },
    { key: "homily_points", label: "Pontos de Homilia", group: "editorial", required: false, weight: 2 },
    { key: "hymn_history", label: "História do Hino", group: "editorial", required: false, weight: 1 },

    // — Núcleo Nexus —
    { key: "bible_readings", label: "Leituras Bíblicas", group: "nexus", required: true, weight: 3 },
    { key: "saint_of_day", label: "Santo do Dia", group: "nexus", required: false, weight: 1 },
  ],
};
