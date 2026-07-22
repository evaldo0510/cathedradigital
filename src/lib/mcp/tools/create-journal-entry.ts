import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "create_journal_entry",
  title: "Criar entrada no Diário Espiritual",
  description:
    "Cria uma nova entrada no Diário Espiritual do usuário autenticado. Requer login (OAuth).",
  inputSchema: {
    content: z.string().trim().min(1).max(20000).describe("Texto da meditação/entrada."),
    mood: z.string().trim().max(60).optional().describe("Estado interior (ex.: 'consolação', 'aridez')."),
    entry_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Data no formato YYYY-MM-DD (default: hoje)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ content, mood, entry_date }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb
      .from("spiritual_journal")
      .insert({
        user_id: ctx.getUserId()!,
        content,
        mood: mood ?? null,
        entry_date: entry_date ?? new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Entrada criada: ${data.id}` }],
      structuredContent: { entry: data },
    };
  },
});
