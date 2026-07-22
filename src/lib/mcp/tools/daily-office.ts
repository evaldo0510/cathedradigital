import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const HOURS = [
  "invitatorio",
  "laudes",
  "hora-media",
  "terca",
  "sexta",
  "noa",
  "vesperas",
  "completas",
  "oficio-leituras",
] as const;

export default defineTool({
  name: "daily_office",
  title: "Ofício Divino (Liturgia das Horas)",
  description:
    "Retorna uma hora canônica da Liturgia das Horas para uma data: antífonas, salmodia, leitura breve, responsório, cântico evangélico e intercessões.",
  inputSchema: {
    hour: z.enum(HOURS).describe("Hora canônica (ex.: 'laudes', 'vesperas', 'completas')."),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Data ISO (YYYY-MM-DD). Default: hoje (UTC)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ hour, date }) => {
    const iso = date ?? new Date().toISOString().slice(0, 10);
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb
      .from("liturgy_hours_offices")
      .select(
        "iso_date,hour_slug,antiphon_opening,psalmody,brief_reading_ref,brief_reading_text,responsory,gospel_canticle,intercessions,concluding_prayer,season_note",
      )
      .eq("iso_date", iso)
      .eq("hour_slug", hour)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data)
      return {
        content: [{ type: "text", text: `Ofício '${hour}' não disponível para ${iso}. Gere em /liturgia/horas.` }],
        isError: true,
      };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { office: data },
    };
  },
});
