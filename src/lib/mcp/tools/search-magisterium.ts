import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_magisterium",
  title: "Buscar Magistério",
  description:
    "Busca conteúdo do Magistério indexado na Cathedra: parágrafos do Catecismo (CIC) e verbetes com referências magisteriais (encíclicas, concílios). Retorna resultados agregados.",
  inputSchema: {
    query: z.string().trim().min(1).max(120).describe("Termo (ex.: 'Trindade', 'Humanae Vitae', 'Lumen Gentium')."),
    limit: z.number().int().min(1).max(30).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const max = limit ?? 15;
    const [cic, glossary] = await Promise.all([
      sb
        .from("catechism_official")
        .select("paragraph_number,title,content_pt")
        .or(`content_pt.ilike.%${query}%,title.ilike.%${query}%`)
        .limit(max),
      sb
        .from("glossary")
        .select("slug,term,short_definition,catechism_references,magisterium_references")
        .eq("status", "published")
        .not("magisterium_references", "is", null)
        .or(`term.ilike.%${query}%,short_definition.ilike.%${query}%,definition.ilike.%${query}%`)
        .limit(max),
    ]);

    const payload = {
      catechism: cic.data ?? [],
      glossary_with_magisterium: glossary.data ?? [],
      note: cic.error?.message ?? undefined,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
