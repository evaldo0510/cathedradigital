import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchGlossary from "./tools/search-glossary";
import getGlossaryTerm from "./tools/get-glossary-term";
import listJournalEntries from "./tools/list-journal-entries";
import createJournalEntry from "./tools/create-journal-entry";
import searchSaints from "./tools/search-saints";
import getSaint from "./tools/get-saint";
import getPrayer from "./tools/get-prayer";
import getCollection from "./tools/get-collection";
import catechismParagraph from "./tools/catechism-paragraph";
import bibleReference from "./tools/bible-reference";

// Issuer OAuth precisa ser o host direto Supabase (não o proxy .lovable.cloud).
// Lido de VITE_SUPABASE_PROJECT_ID (inline no build; import-safe).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "cathedra-mcp",
  title: "Cathedra Digital MCP",
  version: "0.2.0",
  instructions:
    "Ferramentas MCP da Cathedra Digital — plataforma católica de estudo e vida interior. " +
    "Glossário Teológico: `search_glossary`, `get_glossary_term`. " +
    "Santos: `search_saints`, `get_saint`. " +
    "Orações: `get_prayer`. Coleções editoriais: `get_collection`. " +
    "Cânones: `catechism_paragraph` (CIC), `bible_reference` (Bíblia em PT-BR). " +
    "Diário Espiritual do usuário autenticado: `list_journal_entries`, `create_journal_entry`.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchGlossary,
    getGlossaryTerm,
    searchSaints,
    getSaint,
    getPrayer,
    getCollection,
    catechismParagraph,
    bibleReference,
    listJournalEntries,
    createJournalEntry,
  ],
});
