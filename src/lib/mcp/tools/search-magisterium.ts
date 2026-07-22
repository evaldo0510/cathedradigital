import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_magisterium",
  title: "Buscar Magistério",
  description:
    "Busca conteúdo do Magistério: parágrafos do Catecismo (CIC) e verbetes com referências magisteriais (encíclicas, concílios).",
  inputSchema: {
    query: z.string().trim().min(1).max(120),
    limit: z.number().int().min(1).max(30).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const max = limit ?? 15;
    const like = `%${query}%`;
    const [cic, glossary] = await Promise.all([
      sb
        .from("catechism_official")
        .select("paragraph,content,texto_base,explicacao")
        .or(`content.ilike.${like},texto_base.ilike.${like},explicacao.ilike.${like}`)
        .limit(max),
      sb
        .from("glossary")
        .select("slug,term,short_definition,catechism_references,magisterium_references")
        .eq("status", "published")
        .not("magisterium_references", "is", null)
        .or(`term.ilike.${like},short_definition.ilike.${like},definition.ilike.${like}`)
        .limit(max),
    ]);

    const payload = {
      catechism: cic.data ?? [],
      glossary_with_magisterium: glossary.data ?? [],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
