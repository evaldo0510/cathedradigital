/**
 * Manifesto oficial do Magistério.
 */

import type { EntityManifest } from "../types";

export const magisteriumManifest: EntityManifest = {
  id: "magisterium",
  label: "Magistério da Igreja",
  shortLabel: "Magistério",
  table: "library_items_v1", // Usando view unificada
  slugField: "id",
  titleField: "title",
  statusField: "status",
  auditRoute: "/admin/editorial-audit?entity=magisterium",
  icon: "Shield",
  weight: 9,
  ready: true,
  accent: "primary",
  lifecycle: {
    version: "0.1",
    status: "developing",
    certification: false,
    migration: 0.1,
  },
  fields: [
    { key: "title", label: "Título", group: "meta", required: true, weight: 1 },
    { key: "author", label: "Autor", group: "meta", required: true, weight: 1 },
  ],
};
