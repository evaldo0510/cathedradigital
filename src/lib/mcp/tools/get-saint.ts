import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "get_saint",
  title: "Obter Santo",
  description:
    "Retorna o registro completo de um santo pelo id (slug) — biografia, virtudes, oração, referências bíblicas, catecismo e citações. Dados públicos da Cathedra.",
  inputSchema: {
    id: z.string().trim().min(1).max(120).describe("Identificador do santo (ex.: 'agostinho-de-hipona')."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }) => {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb
      .from("saints")
      .select(
        "id,name,title,feast_day,feast_month,feast_day_num,born,died,century,category,bio,full_bio,historical_context,virtues,patronages,quotes,quotes_rich,works,prayer,bible_refs,catechism_refs,timeline,miracles,iconography,curiosities,spiritual_practice",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: `Santo '${id}' não encontrado.` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { saint: data },
    };
  },
});
