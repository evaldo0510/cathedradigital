import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_journal_entries",
  title: "Listar entradas do Diário Espiritual",
  description:
    "Lista as entradas do Diário Espiritual do usuário autenticado, mais recentes primeiro. Requer login (OAuth).",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Máximo de entradas (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb
      .from("spiritual_journal")
      .select("id,entry_date,mood,content,journey_id,step_id,is_reviewed,created_at,updated_at")
      .eq("user_id", ctx.getUserId()!)
      .order("entry_date", { ascending: false })
      .limit(limit ?? 20);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { entries: data ?? [] },
    };
  },
});
