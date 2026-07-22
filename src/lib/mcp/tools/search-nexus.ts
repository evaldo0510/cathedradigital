import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_nexus",
  title: "Buscar no Nexus Theologicus",
  description:
    "Busca relações do Knowledge Graph Nexus por nó (kind+ref). Retorna arestas de entrada e saída (verbetes, santos, orações, versículos, CIC).",
  inputSchema: {
    kind: z
      .enum(["glossary", "saint", "prayer", "bible", "catechism", "collection", "journey"])
      .describe("Tipo do nó (kind)."),
    ref: z.string().trim().min(1).max(200).describe("Identificador do nó (slug, id, referência)."),
    limit: z.number().int().min(1).max(100).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ kind, ref, limit }) => {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const max = limit ?? 50;
    const [outgoing, incoming] = await Promise.all([
      sb
        .from("nexus_relations")
        .select("relation_type,source_kind,source_ref,target_kind,target_ref,note,confidence,attributed_to")
        .eq("source_kind", kind)
        .eq("source_ref", ref)
        .limit(max),
      sb
        .from("nexus_relations")
        .select("relation_type,source_kind,source_ref,target_kind,target_ref,note,confidence,attributed_to")
        .eq("target_kind", kind)
        .eq("target_ref", ref)
        .limit(max),
    ]);
    if (outgoing.error) return { content: [{ type: "text", text: outgoing.error.message }], isError: true };
    if (incoming.error) return { content: [{ type: "text", text: incoming.error.message }], isError: true };
    const payload = {
      node: { kind, ref },
      outgoing: outgoing.data ?? [],
      incoming: incoming.data ?? [],
      total: (outgoing.data?.length ?? 0) + (incoming.data?.length ?? 0),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
