/**
 * Manifesto oficial dos Santos, Doutores, Padres e Mártires.
 *
 * Reflete os campos reais da tabela `saints` (873 registros).
 * Estado atual: 871 stubs · 2 complete · 8 full_bio — lifecycle "developing".
 * A migração é considerada 0.30 porque estrutura+categoria+data_de_festa estão
 * cobertos (873/873), mas profundidade editorial (bio, prayer, virtues, ícono)
 * ainda é muito baixa.
 */

import type { EntityManifest } from "../types";

export const saintsManifest: EntityManifest = {
  id: "saints",
  label: "Santos, Doutores e Padres",
  shortLabel: "Santos",
  table: "saints",
  slugField: "id",              // saints usa `id` como slug canônico
  titleField: "name",
  statusField: "content_status", // enum: stub | partial | complete
  auditRoute: "/admin/editorial-audit?entity=saints",
  icon: "Users",
  weight: 9,
  ready: true,
  accent: "secondary",
  lifecycle: {
    version: "0.1",
    status: "developing",
    certification: false,
    migration: 0.35,
  },
  // Bloqueio de Gate Sprint 7 — Santos Refinados
  gate: {
    minIce: 95,
    minEditorial: 95,
    minNexus: 90,
    requiredFields: ["bio", "full_bio", "spiritual_practice", "prayer", "bible_refs", "catechism_refs"],
  },
  fields: [
    // — Identidade canônica —
    { key: "name",              label: "Nome canônico",       group: "meta",      required: true,  weight: 1 },
    { key: "category",          label: "Categoria",           group: "meta",      required: true,  weight: 1 },
    { key: "feast_day",         label: "Data de festa",       group: "meta",      required: true,  weight: 1 },

    // — Núcleo editorial (contribui p/ editorial_score) —
    { key: "bio",               label: "Biografia curta",     group: "editorial", required: true,  weight: 1 },
    { key: "full_bio",          label: "Biografia longa",     group: "editorial", required: true,  weight: 3 },
    { key: "historical_context",label: "Contexto histórico",  group: "editorial", required: true,  weight: 1 },
    { key: "spiritual_practice",label: "Prática espiritual",  group: "editorial", required: true,  weight: 2 },
    { key: "virtues",           label: "Virtudes",            group: "editorial", required: true,  weight: 1 },
    { key: "patronages",        label: "Patronatos",          group: "editorial", required: true,  weight: 1 },
    { key: "iconography",       label: "Iconografia",         group: "editorial", required: true,  weight: 1 },
    { key: "prayer",            label: "Oração associada",    group: "editorial", required: true,  weight: 2 },
    { key: "quotes_rich",       label: "Citações",            group: "editorial", required: true,  weight: 1 },
    { key: "timeline",          label: "Cronologia",          group: "editorial", required: true,  weight: 1 },
    { key: "works",             label: "Obras (doutores/padres)", group: "editorial", required: false, weight: 2 },

    // — Núcleo Nexus (contribui p/ nexus_score) —
    { key: "bible_refs",        label: "Referências bíblicas", group: "nexus",    required: true,  weight: 2 },
    { key: "catechism_refs",    label: "Referências do CIC",   group: "nexus",    required: true,  weight: 2 },
    { key: "church_doc_refs",   label: "Magistério",           group: "nexus",    required: true,  weight: 2 },
    { key: "sources",           label: "Fontes bibliográficas",group: "nexus",    required: true,  weight: 2 },
  ],
};
