/**
 * Manifesto oficial das Orações no Editorial Engine.
 *
 * Reflete a tabela `prayers` + hierarquia `prayer_sections` / `prayer_blocks`.
 * Base ainda pequena (piloto Rosário + Ordinário) → lifecycle "developing".
 */

import type { EntityManifest } from "../types";

export const prayersManifest: EntityManifest = {
  id: "prayers",
  label: "Orações Editoriais",
  shortLabel: "Orações",
  table: "prayers",
  slugField: "slug",
  titleField: "title",
  // A tabela usa `is_published` (bool). O wrapper SQL converte para texto.
  statusField: "is_published",
  auditRoute: "/admin/editorial-audit?entity=prayers",
  icon: "Heart",
  weight: 8,
  ready: true,
  accent: "primary",
  lifecycle: {
    version: "0.1",
    status: "developing",
    certification: false,
    migration: 0.25,
  },
  fields: [
    // — Identidade —
    { key: "title",              label: "Título",             group: "meta",      required: true, weight: 1 },
    { key: "category",           label: "Categoria",          group: "meta",      required: true, weight: 1 },

    // — Núcleo editorial —
    { key: "subtitle",           label: "Subtítulo",          group: "editorial", required: true, weight: 1 },
    { key: "content",            label: "Conteúdo/Descrição", group: "editorial", required: true, weight: 3 },
    { key: "explanation",        label: "Explicação teológica", group: "editorial", required: true, weight: 2 },
    { key: "meditation",         label: "Meditação",          group: "editorial", required: false, weight: 2 },
    { key: "source_ref",         label: "Fonte / Origem",     group: "editorial", required: true, weight: 1 },

    // — Núcleo Nexus —
    { key: "sections_count",     label: "Seções litúrgicas",  group: "nexus",     required: true, weight: 3 },
    { key: "related_bible",      label: "Referências bíblicas", group: "nexus",   required: true, weight: 2 },
    { key: "related_catechism",  label: "Referências CIC",    group: "nexus",     required: true, weight: 1 },
    { key: "related_glossary",   label: "Verbetes do Glossário", group: "nexus",  required: false, weight: 1 },
  ],
};
