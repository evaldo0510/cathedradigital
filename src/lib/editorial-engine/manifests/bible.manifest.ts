/**
 * Manifesto oficial da Sagrada Escritura (Bíblia) no Editorial Engine.
 *
 * Reflete a tabela `bible_verses` (73 livros, ~31.000 versículos).
 * Foco na cobertura de metadados, introduções e comentários patrísticos/teológicos.
 */

import type { EntityManifest } from "../types";

export const bibleManifest: EntityManifest = {
  id: "bible",
  label: "Sagrada Escritura",
  shortLabel: "Bíblia",
  table: "bible_verses",
  slugField: "id",
  titleField: "verse_text", // Versículo é a unidade atômica
  statusField: "is_ready",
  auditRoute: "/admin/editorial-audit?entity=bible",
  icon: "Book",
  weight: 10,
  ready: true,
  accent: "primary",
  lifecycle: {
    version: "0.2",
    status: "developing",
    certification: false,
    migration: 0.95, // Texto base quase completo em PT/EN/LA
  },
  fields: [
    // — Identidade —
    { key: "book_id", label: "Livro", group: "meta", required: true, weight: 1 },
    { key: "chapter", label: "Capítulo", group: "meta", required: true, weight: 1 },
    { key: "verse", label: "Versículo", group: "meta", required: true, weight: 1 },

    // — Núcleo editorial —
    { key: "verse_text", label: "Texto Sagrado", group: "editorial", required: true, weight: 3 },
    { key: "commentary", label: "Comentário Teológico", group: "editorial", required: false, weight: 2 },
    { key: "patristic_commentary", label: "Comentário Patrístico", group: "editorial", required: false, weight: 2 },
    { key: "liturgical_context", label: "Uso Litúrgico", group: "editorial", required: false, weight: 1 },

    // — Núcleo Nexus —
    { key: "cross_refs", label: "Referências Cruzadas", group: "nexus", required: true, weight: 2 },
    { key: "catechism_refs", label: "Citações no CIC", group: "nexus", required: false, weight: 2 },
  ],
};
