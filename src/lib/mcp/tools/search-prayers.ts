import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_prayers",
  title: "Buscar Orações",
  description:
    "Busca orações católicas publicadas por termo (título, subtítulo, categoria, tags). Retorna metadados leves; use `get_prayer` para o conteúdo completo.",
  inputSchema: {
    query: z.string().trim().min(1).max(120),
    category: z.string().trim().max(60).optional().describe("Filtrar por categoria (ex.: 'rosario', 'novena')."),
    limit: z.number().int().min(1).max(30).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, limit }) => {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let q = sb
      .from("prayers")
      .select("slug,title,subtitle,kicker,category,duration_min,estimated_seconds,tags")
      .eq("is_published", true)
      .or(`title.ilike.%${query}%,subtitle.ilike.%${query}%,kicker.ilike.%${query}%,category.ilike.%${query}%`)
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
