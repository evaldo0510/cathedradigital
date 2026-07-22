import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "get_prayer",
  title: "Obter Oração",
  description:
    "Retorna uma oração católica publicada pelo slug (ex.: 'pai-nosso', 'ave-maria', 'rosario'), incluindo conteúdo, meditação, blocos e referências. Dados públicos.",
  inputSchema: {
    slug: z.string().trim().min(1).max(120).describe("Slug da oração (ex.: 'pai-nosso')."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }) => {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb
      .from("prayers")
      .select(
        "slug,title,subtitle,kicker,category,content,content_latin,explanation,meditation,estimated_seconds,duration_min,tags,source_ref,related_bible,related_catechism,related_saints,related_glossary,bible_refs,catechism_refs,blocks,engine_version",
      )
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: `Oração '${slug}' não encontrada ou não publicada.` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { prayer: data },
    };
  },
});
