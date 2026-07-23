/**
 * Manifesto oficial das Coleções editoriais.
 *
 * Reflete os campos reais da tabela `collections` (+ join com `collection_items`).
 * A base ainda é pequena (piloto), por isso lifecycle "developing".
 */

import type { EntityManifest } from "../types";

export const collectionsManifest: EntityManifest = {
  id: "collections",
  label: "Coleções Editoriais",
  shortLabel: "Coleções",
  table: "collections",
  slugField: "slug",
  titleField: "title",
  statusField: "status",
  auditRoute: "/admin/editorial-audit?entity=collections",
  icon: "Library",
  weight: 7,
  ready: true,
  accent: "secondary",
  lifecycle: {
    version: "0.1",
    status: "developing",
    certification: false,
    migration: 0.30,
  },
  fields: [
    // — Identidade —
    { key: "title",       label: "Título",           group: "meta",      required: true,  weight: 1 },
    { key: "category",    label: "Categoria",        group: "meta",      required: true,  weight: 1 },

    // — Núcleo editorial —
    { key: "subtitle",    label: "Subtítulo",        group: "editorial", required: true,  weight: 1 },
    { key: "description", label: "Descrição",        group: "editorial", required: true,  weight: 3 },
    { key: "cover",       label: "Capa (imagem)",    group: "editorial", required: true,  weight: 2 },

    // — Núcleo Nexus —
    { key: "nexus_refs",  label: "Referências Nexus",group: "nexus",     required: true,  weight: 2 },
    { key: "items_count", label: "Itens curados",    group: "nexus",     required: true,  weight: 3 },
  ],
};
