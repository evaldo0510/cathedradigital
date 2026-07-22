import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchGlossary from "./tools/search-glossary";
import getGlossaryTerm from "./tools/get-glossary-term";
import listJournalEntries from "./tools/list-journal-entries";
import createJournalEntry from "./tools/create-journal-entry";

// Issuer OAuth precisa ser o host direto Supabase (não o proxy .lovable.cloud).
// Lido de VITE_SUPABASE_PROJECT_ID (inline no build; import-safe).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "cathedra-mcp",
  title: "Cathedra Digital MCP",
  version: "0.1.0",
  instructions:
    "Ferramentas MCP da Cathedra Digital — plataforma católica de estudo e vida interior. Use `search_glossary` e `get_glossary_term` para consultar o Glossário Teológico publicado. Use `list_journal_entries` e `create_journal_entry` para ler/gravar o Diário Espiritual do usuário autenticado.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchGlossary, getGlossaryTerm, listJournalEntries, createJournalEntry],
});
