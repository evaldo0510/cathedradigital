import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "catechism_paragraph",
  title: "Parágrafo do Catecismo",
  description:
    "Retorna um ou mais parágrafos do Catecismo da Igreja Católica (CIC) pelo número. Aceita um único parágrafo ou intervalo (ex.: 232 a 267).",
  inputSchema: {
    paragraph: z.number().int().min(1).max(2865).describe("Número do parágrafo do CIC (1–2865)."),
    to: z.number().int().min(1).max(2865).optional().describe("Fim opcional de intervalo (inclusivo). Máx. 30 parágrafos por chamada."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ paragraph, to }) => {
    const from = paragraph;
    const end = to ?? paragraph;
    if (end < from) return { content: [{ type: "text", text: "'to' deve ser >= 'paragraph'." }], isError: true };
    if (end - from + 1 > 30) return { content: [{ type: "text", text: "Intervalo máximo: 30 parágrafos." }], isError: true };

    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb
      .from("catechism_official")
      .select("paragraph,content,texto_base,explicacao,interpretacao_profunda,aplicacao_pratica,reflexao_final")
      .gte("paragraph", from)
      .lte("paragraph", end)
      .order("paragraph", { ascending: true });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data || data.length === 0) return { content: [{ type: "text", text: `Nenhum parágrafo encontrado no intervalo ${from}–${end}.` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { paragraphs: data },
    };
  },
});
