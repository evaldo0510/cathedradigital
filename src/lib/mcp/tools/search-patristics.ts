import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_patristics",
  title: "Buscar Patrística (Padres da Igreja)",
  description:
    "Busca conteúdo patrístico: santos categorizados como Padres da Igreja e verbetes com referências patrísticas (fathers_refs).",
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
    const [saints, glossary] = await Promise.all([
      sb
        .from("saints")
        .select("id,name,title,feast_day,bio,category")
        .or(`name.ilike.${like},bio.ilike.${like},title.ilike.${like},category.ilike.%padre%,category.ilike.%patrist%`)
        .limit(max),
      sb
        .from("glossary")
        .select("slug,term,short_definition,fathers_refs")
        .eq("status", "published")
        .not("fathers_refs", "is", null)
        .or(`term.ilike.${like},short_definition.ilike.${like},definition.ilike.${like}`)
        .limit(max),
    ]);

    const payload = { saints: saints.data ?? [], glossary_with_fathers: glossary.data ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
