import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "semantic_search",
  title: "Busca Unificada Cathedra",
  description:
    "Busca simultânea em Glossário, Santos, Orações, Coleções e Jornadas por um termo. Retorna top N por categoria.",
  inputSchema: {
    query: z.string().trim().min(1).max(120),
    limit_per_bucket: z.number().int().min(1).max(15).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit_per_bucket }) => {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const n = limit_per_bucket ?? 5;
    const like = `%${query}%`;

    const [g, s, p, c, j] = await Promise.all([
      sb.from("glossary").select("slug,term,short_definition,category").eq("status", "published")
        .or(`term.ilike.${like},short_definition.ilike.${like},definition.ilike.${like}`).limit(n),
      sb.from("saints").select("id,name,title,feast_day,bio")
        .or(`name.ilike.${like},bio.ilike.${like},title.ilike.${like}`).limit(n),
      sb.from("prayers").select("slug,title,subtitle,category").eq("is_published", true)
        .or(`title.ilike.${like},subtitle.ilike.${like},kicker.ilike.${like}`).limit(n),
      sb.from("collections").select("slug,title,subtitle,category").eq("status", "published")
        .or(`title.ilike.${like},subtitle.ilike.${like},description.ilike.${like}`).limit(n),
      sb.from("journeys").select("slug,title,subtitle,category").eq("status", "published")
        .or(`title.ilike.${like},subtitle.ilike.${like},description.ilike.${like}`).limit(n),
    ]);

    const payload = {
      query,
      glossary: g.data ?? [],
      saints: s.data ?? [],
      prayers: p.data ?? [],
      collections: c.data ?? [],
      journeys: j.data ?? [],
      total: (g.data?.length ?? 0) + (s.data?.length ?? 0) + (p.data?.length ?? 0) + (c.data?.length ?? 0) + (j.data?.length ?? 0),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
