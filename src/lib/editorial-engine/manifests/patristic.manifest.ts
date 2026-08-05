/**
 * Manifesto oficial da Biblioteca Patrística.
 */

import type { EntityManifest } from "../types";

export const patristicManifest: EntityManifest = {
  id: "patristic",
  label: "Biblioteca Patrística",
  shortLabel: "Patrística",
  table: "library_items_v1", // Usando view unificada
  slugField: "id",
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
    { key: "title", label: "Título", group: "meta", required: true, weight: 1 },
    { key: "author", label: "Autor", group: "meta", required: true, weight: 1 },
  ],
};
