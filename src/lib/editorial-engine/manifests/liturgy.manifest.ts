/**
 * Manifesto oficial da Liturgia (Missa e Ofício Divino).
 */

import type { EntityManifest } from "../types";

export const liturgyManifest: EntityManifest = {
  id: "liturgy",
  label: "Liturgia Romana",
  shortLabel: "Liturgia",
  table: "liturgy_meditations", // Ajustado para tabela existente
  slugField: "id",
  titleField: "title",
  statusField: "id", // Mocked as always present for now
  auditRoute: "/admin/editorial-audit?entity=liturgy",
  icon: "Church",
  weight: 10,
  ready: true,
  accent: "secondary",
  lifecycle: {
    version: "0.1",
    status: "developing",
    certification: false,
    migration: 0.2,
  },
  fields: [
    { key: "title", label: "Título", group: "meta", required: true, weight: 1 },
    { key: "content", label: "Conteúdo", group: "editorial", required: true, weight: 3 },
  ],
};
