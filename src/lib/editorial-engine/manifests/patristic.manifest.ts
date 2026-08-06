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
  gate: {
    minIce: 95,
    minEditorial: 100,
    minNexus: 100,
    requiredFields: ["title", "author", "historical_context", "content"]
  },
  lifecycle: {
    version: "1.0",
    status: "certified",
    certification: true,
    migration: 1,
  },
  fields: [
    { key: "title", label: "Título da Obra", group: "meta", required: true, weight: 1 },
    { key: "author", label: "Autor (Padre da Igreja)", group: "meta", required: true, weight: 1 },
    { key: "historical_context", label: "Contexto do Século", group: "editorial", required: true },
    { key: "content", label: "Texto Integral / Excertos", group: "editorial", required: true },
    { key: "theological_importance", label: "Importância Teológica", group: "editorial", required: true },
  ],
};
