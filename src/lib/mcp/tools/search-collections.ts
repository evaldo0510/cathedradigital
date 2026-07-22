import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_collections",
  title: "Buscar Coleções Editoriais",
  description:
    "Busca Coleções editoriais publicadas por termo (título, subtítulo, categoria). Use `get_collection` para itens completos.",
  inputSchema: {
    query: z.string().trim().min(1).max(120),
    category: z.string().trim().max(60).optional(),
    limit: z.number().int().min(1).max(30).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, limit }) => {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let q = sb
      .from("collections")
      .select("slug,title,subtitle,description,category,featured,cover")
      .eq("status", "published")
      .or(`title.ilike.%${query}%,subtitle.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(limit ?? 15);
    if (category) q = q.eq("category", category);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { results: data ?? [] },
    };
  },
});
