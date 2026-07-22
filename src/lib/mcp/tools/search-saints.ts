import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_saints",
  title: "Buscar Santos",
  description:
    "Busca santos católicos por nome, título ou patronato no acervo público da Cathedra. Retorna id, nome, título, data festiva e categoria.",
  inputSchema: {
    query: z.string().trim().min(1).max(120).describe("Nome, título ou fragmento (ex.: 'Agostinho', 'padroeiro dos advogados')."),
    limit: z.number().int().min(1).max(30).optional().describe("Máximo de resultados (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const q = query.replace(/[%_]/g, "\\$&");
    const { data, error } = await sb
      .from("saints")
      .select("id,name,title,feast_day,category,century,patronages")
      .or(`name.ilike.%${q}%,title.ilike.%${q}%,patronages.cs.{${q}}`)
      .limit(limit ?? 10);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { results: data ?? [] },
    };
  },
});
