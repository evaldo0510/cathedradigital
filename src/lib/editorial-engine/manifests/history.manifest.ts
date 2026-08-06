import type { EntityManifest } from "../types";

export const historyManifest: EntityManifest = {
  id: "history",
  label: "História da Igreja",
  shortLabel: "História",
  table: "library_items_v1",
  slugField: "id",
  titleField: "title",
  statusField: "status",
  auditRoute: "/admin/editorial-audit?entity=history",
  icon: "Clock",
  weight: 6,
  ready: false,
  lifecycle: {
    version: "0.0",
    status: "placeholder",
    certification: false,
    migration: 0,
  },
  fields: [
    { key: "title", label: "Acontecimento", group: "meta", required: true },
    { key: "content", label: "Contexto", group: "editorial", required: true },
  ],
};
