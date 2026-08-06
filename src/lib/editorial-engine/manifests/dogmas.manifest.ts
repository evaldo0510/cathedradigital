import type { EntityManifest } from "../types";

export const dogmasManifest: EntityManifest = {
  id: "dogmas",
  label: "Dogmas de Fé",
  shortLabel: "Dogmas",
  table: "library_items_v1",
  slugField: "id",
  titleField: "title",
  statusField: "status",
  auditRoute: "/admin/editorial-audit?entity=dogmas",
  icon: "Shield",
  weight: 10,
  ready: false,
  lifecycle: {
    version: "0.0",
    status: "placeholder",
    certification: false,
    migration: 0,
  },
  fields: [
    { key: "title", label: "Enunciado", group: "meta", required: true },
    { key: "content", label: "Definição", group: "editorial", required: true },
  ],
};
