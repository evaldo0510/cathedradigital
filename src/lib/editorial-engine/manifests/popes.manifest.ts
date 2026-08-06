import type { EntityManifest } from "../types";

export const popesManifest: EntityManifest = {
  id: "popes",
  label: "Sucessores de Pedro",
  shortLabel: "Papas",
  table: "library_items_v1",
  slugField: "id",
  titleField: "title",
  statusField: "status",
  auditRoute: "/admin/editorial-audit?entity=popes",
  icon: "Crown",
  weight: 7,
  ready: false,
  lifecycle: {
    version: "0.0",
    status: "placeholder",
    certification: false,
    migration: 0,
  },
  fields: [
    { key: "title", label: "Nome do Papa", group: "meta", required: true },
    { key: "content", label: "Pontificado", group: "editorial", required: true },
  ],
};
