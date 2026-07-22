import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_glossary",
  title: "Buscar no Glossário",
  description:
    "Busca verbetes publicados do Glossário Teológico da Cathedra por termo. Retorna slug, título e definição curta. Público (dados publicados).",
  inputSchema: {
    query: z.string().trim().min(1).max(120).describe("Termo ou fragmento a buscar."),
    limit: z.number().int().min(1).max(20).optional().describe("Máximo de resultados (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb
      .from("glossary")
      .select("slug,term,short_definition,category")
      .eq("status", "published")
      .or(`term.ilike.%${query}%,short_definition.ilike.%${query}%,definition.ilike.%${query}%`)
      .limit(limit ?? 10);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { results: data ?? [] },
    };
  },
});
