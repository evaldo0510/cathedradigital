/**
 * Manifesto oficial da Biblioteca Patrística (Escritos dos Santos Padres).
 */

import type { EntityManifest } from "../types";

export const patristicManifest: EntityManifest = {
  id: "patristic",
  label: "Biblioteca Patrística",
  shortLabel: "Patrística",
  table: "patristic_works",
  slugField: "slug",
  titleField: "title",
  statusField: "status",
  auditRoute: "/admin/editorial-audit?entity=patristic",
  icon: "Library",
  weight: 9,
  ready: true,
  accent: "secondary",
  lifecycle: {
    version: "0.1",
    status: "developing",
    certification: false,
    migration: 0.15,
  },
  fields: [
    // — Identidade —
    { key: "author_id", label: "Autor (Santo)", group: "meta", required: true, weight: 1 },
    { key: "era", label: "Época", group: "meta", required: true, weight: 1 },

    // — Núcleo editorial —
    { key: "introduction", label: "Introdução Crítica", group: "editorial", required: true, weight: 2 },
    { key: "theological_nodes", label: "Nós Teológicos", group: "editorial", required: true, weight: 2 },
    { key: "spiritual_legacy", label: "Legado Espiritual", group: "editorial", required: true, weight: 2 },

    // — Núcleo Nexus —
    { key: "bible_citations", label: "Citações Bíblicas", group: "nexus", required: true, weight: 2 },
    { key: "catechism_refs", label: "Conexões CIC", group: "nexus", required: false, weight: 1 },
  ],
};
