import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "daily_liturgy",
  title: "Missal do Dia",
  description:
    "Retorna os prórios do Missal para uma data (ISO YYYY-MM-DD, default = hoje): celebração, cor litúrgica, antífonas, coleta e oração pós-comunhão.",
  inputSchema: {
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Data ISO (YYYY-MM-DD). Default: hoje (UTC)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ date }) => {
    const iso = date ?? new Date().toISOString().slice(0, 10);
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb
      .from("missal_propers")
      .select(
        "iso_date,celebration_title,liturgical_color,entrance_antiphon,collect,offertory_prayer,preface_suggestion,communion_antiphon,prayer_after_communion,season_note",
      )
      .eq("iso_date", iso)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data)
      return {
        content: [{ type: "text", text: `Missal não disponível para ${iso}. Acesse /liturgia/missa para gerar.` }],
        isError: true,
      };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { missal: data },
    };
  },
});
