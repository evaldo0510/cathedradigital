/**
 * Manifesto oficial do Glossário Teológico — reproduz 1:1 os campos, pesos
 * e gate atualmente hardcoded em `EditorialAudit.tsx` + `glossary-generate-deep`.
 * Fonte da verdade para o engine.
 */

import type { EntityManifest } from "../types";

export const glossaryManifest: EntityManifest = {
  id: "glossary",
  label: "Glossário Teológico",
  shortLabel: "Glossário",
  table: "glossary",
  slugField: "slug",
  titleField: "term",
  statusField: "status",
  auditRoute: "/admin/editorial-audit?entity=glossary",
  icon: "BookOpen",
  weight: 10,
  ready: true,
  accent: "primary",
  lifecycle: {
    version: "1.0",
    status: "consolidating",
    certification: false,
    migration: 0.85,
  },
  fields: [
    // — Núcleo editorial (contribui p/ editorial_score) —
    { key: "definition",             label: "Definição",             group: "editorial", required: true,  weight: 2 },
    { key: "short_definition",       label: "Definição curta",       group: "editorial", required: true,  weight: 1 },
    { key: "etymology",              label: "Etimologia",            group: "editorial", required: true,  weight: 1 },
    { key: "historical_context",     label: "Contexto histórico",    group: "editorial", required: true,  weight: 1 },
    { key: "deep_interpretation",    label: "Interpretação profunda", group: "editorial", required: true, weight: 3 },
    { key: "practical_application",  label: "Aplicação prática",     group: "editorial", required: true,  weight: 1 },
    { key: "logos_meditation",       label: "Meditação Logos",       group: "editorial", required: true,  weight: 2 },
    { key: "faq",                    label: "FAQ",                   group: "editorial", required: true,  weight: 1 },
    { key: "bibliography",           label: "Bibliografia",          group: "editorial", required: true,  weight: 1 },

    // — Núcleo Nexus (contribui p/ nexus_score) —
    { key: "bible_verses",           label: "Referências bíblicas",  group: "nexus",     required: true,  weight: 2 },
    { key: "catechism_references",   label: "Referências do CIC",    group: "nexus",     required: true,  weight: 2 },
    { key: "fathers_refs",           label: "Padres da Igreja",      group: "nexus",     required: true,  weight: 2 },
    { key: "magisterium_references", label: "Magistério",            group: "nexus",     required: true,  weight: 2 },
  ],
};
