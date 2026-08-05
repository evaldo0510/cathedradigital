/**
 * Manifesto oficial do Magistério (Documentos Papais e Conciliares).
 */

import type { EntityManifest } from "../types";

export const magisteriumManifest: EntityManifest = {
  id: "magisterium",
  label: "Magistério da Igreja",
  shortLabel: "Magistério",
  table: "magisterium_docs",
  slugField: "slug",
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
    // — Identidade —
    { key: "pope_or_council", label: "Autoridade", group: "meta", required: true, weight: 1 },
    { key: "type", label: "Tipo (Encíclica...)", group: "meta", required: true, weight: 1 },

    // — Núcleo editorial —
    { key: "summary", label: "Síntese Doutrinária", group: "editorial", required: true, weight: 2 },
    { key: "historical_context", label: "Contexto Histórico", group: "editorial", required: true, weight: 1 },
    { key: "doctrinal_points", label: "Pontos Centrais", group: "editorial", required: true, weight: 2 },

    // — Núcleo Nexus —
    { key: "bible_refs", label: "Referências Bíblicas", group: "nexus", required: true, weight: 2 },
    { key: "catechism_refs", label: "Conexões CIC", group: "nexus", required: true, weight: 2 },
  ],
};
