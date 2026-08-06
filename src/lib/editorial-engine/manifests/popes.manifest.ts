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
  accent: "primary",
  weight: 7,
  ready: false,
  gate: {
    minIce: 95,
    minEditorial: 100,
    minNexus: 100,
    requiredFields: ["title", "content", "historical_context"]
  },
  lifecycle: {
    version: "0.0",
    status: "placeholder",
    certification: false,
    migration: 0,
  },
  fields: [
    { key: "title", label: "Nome do Papa", group: "meta", required: true },
    { key: "latin_name", label: "Nome em Latim", group: "meta", required: false },
    { key: "dates", label: "Datas do Pontificado", group: "meta", required: true },
    { key: "historical_context", label: "Contexto Histórico", group: "editorial", required: true },
    { key: "content", label: "Realizações e Documentos", group: "editorial", required: true },
    { key: "spiritual_legacy", label: "Legado Espiritual", group: "editorial", required: true },
    { key: "prayer", label: "Oração Relacionada", group: "editorial", required: true },
  ],
};
