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
import searchNexus from "./tools/search-nexus";
import relatedContent from "./tools/related-content";
import dailyLiturgy from "./tools/daily-liturgy";
import dailyOffice from "./tools/daily-office";
import searchPrayers from "./tools/search-prayers";
import searchCollections from "./tools/search-collections";
import getJourney from "./tools/get-journey";
import searchPatristics from "./tools/search-patristics";
import searchMagisterium from "./tools/search-magisterium";
import semanticSearch from "./tools/semantic-search";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "cathedra-mcp",
  title: "Cathedra Digital MCP",
  version: "0.3.0",
  instructions:
    "Ferramentas MCP da Cathedra Digital — motor de conhecimento católico. " +
    "Busca unificada: `semantic_search`. " +
    "Glossário: `search_glossary`, `get_glossary_term`. " +
    "Santos: `search_saints`, `get_saint`. Patrística: `search_patristics`. " +
    "Orações: `search_prayers`, `get_prayer`. " +
    "Coleções: `search_collections`, `get_collection`. Jornadas: `get_journey`. " +
    "Cânones: `catechism_paragraph`, `bible_reference`, `search_magisterium`. " +
    "Liturgia diária: `daily_liturgy` (Missal), `daily_office` (Horas). " +
    "Knowledge Graph: `search_nexus`, `related_content`. " +
    "Diário do usuário autenticado: `list_journal_entries`, `create_journal_entry`.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    semanticSearch,
    searchGlossary,
    getGlossaryTerm,
    searchSaints,
    getSaint,
    searchPatristics,
    searchPrayers,
    getPrayer,
    searchCollections,
    getCollection,
    getJourney,
    catechismParagraph,
    bibleReference,
    searchMagisterium,
    dailyLiturgy,
    dailyOffice,
    searchNexus,
    relatedContent,
    listJournalEntries,
    createJournalEntry,
  ],
});
