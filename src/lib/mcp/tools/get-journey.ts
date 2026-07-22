import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "get_journey",
  title: "Obter Jornada",
  description:
    "Retorna uma Jornada publicada da Cathedra pelo slug, incluindo hero editorial e etapas ordenadas (title, subtitle, step_type, conteúdo, reflection, exercise, closing).",
  inputSchema: {
    slug: z.string().trim().min(1).max(120).describe("Slug da jornada."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }) => {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: j, error } = await sb
      .from("journeys")
      .select(
        "id,slug,title,subtitle,description,category,difficulty,estimated_days,tags,hero_kicker,hero_quote,hero_image_url,narrative_intro,closing_message,is_premium,status",
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!j)
      return {
        content: [{ type: "text", text: `Jornada '${slug}' não encontrada ou não publicada.` }],
        isError: true,
      };

    const { data: steps } = await sb
      .from("journey_steps")
      .select("step_order,title,subtitle,step_type,content,duration_minutes,is_free,reflection,exercise,closing")
      .eq("journey_id", j.id)
      .order("step_order", { ascending: true });

    const payload = { ...j, steps: steps ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: { journey: payload },
    };
  },
});
