import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "get_glossary_term",
  title: "Obter verbete do Glossário",
  description:
    "Retorna o verbete completo do Glossário Teológico pelo slug: definição, interpretação profunda, etimologia, contexto e referências. Público (apenas verbetes publicados).",
  inputSchema: {
    slug: z.string().trim().min(1).max(120).describe("Slug do verbete, ex.: 'eucaristia'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }) => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb
      .from("glossary")
      .select(
        "slug,term,short_definition,definition,deep_interpretation,etymology,historical_context,practical_application,bible_verses,catechism_references,magisterium_references,saints_refs,category,updated_at",
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data)
      return { content: [{ type: "text", text: `Verbete não encontrado: ${slug}` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { term: data },
    };
  },
});
