import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "get_collection",
  title: "Obter Coleção",
  description:
    "Retorna uma Coleção editorial publicada da Cathedra pelo slug, com seus itens ordenados (verbetes, santos, orações, jornadas). Dados públicos.",
  inputSchema: {
    slug: z.string().trim().min(1).max(120).describe("Slug da coleção (ex.: 'sete-sacramentos')."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }) => {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: collection, error } = await sb
      .from("collections")
      .select("id,slug,title,subtitle,description,cover,category,featured,nexus_refs,metadata")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!collection) return { content: [{ type: "text", text: `Coleção '${slug}' não encontrada ou não publicada.` }], isError: true };

    const { data: items } = await sb
      .from("collection_items")
      .select("*")
      .eq("collection_id", collection.id)
      .order("order_index", { ascending: true });

    const payload = { ...collection, items: items ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: { collection: payload },
    };
  },
});
