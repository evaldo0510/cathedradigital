import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "related_content",
  title: "Conteúdo Relacionado",
  description:
    "Dado um nó (kind+ref), retorna conteúdos relacionados hidratados: verbetes, santos, orações e coleções alcançados via Nexus.",
  inputSchema: {
    kind: z.enum(["glossary", "saint", "prayer", "bible", "catechism", "collection", "journey"]),
    ref: z.string().trim().min(1).max(200),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ kind, ref, limit }) => {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const max = limit ?? 20;
    const [outgoing, incoming] = await Promise.all([
      sb.from("nexus_relations").select("relation_type,target_kind,target_ref,note").eq("source_kind", kind).eq("source_ref", ref).limit(max),
      sb.from("nexus_relations").select("relation_type,source_kind,source_ref,note").eq("target_kind", kind).eq("target_ref", ref).limit(max),
    ]);
    const nodes = new Map<string, { kind: string; ref: string; via: string[] }>();
    for (const r of outgoing.data ?? []) {
      const k = `${r.target_kind}:${r.target_ref}`;
      if (!nodes.has(k)) nodes.set(k, { kind: r.target_kind, ref: r.target_ref, via: [] });
      nodes.get(k)!.via.push(`→ ${r.relation_type}`);
    }
    for (const r of incoming.data ?? []) {
      const k = `${r.source_kind}:${r.source_ref}`;
      if (!nodes.has(k)) nodes.set(k, { kind: r.source_kind, ref: r.source_ref, via: [] });
      nodes.get(k)!.via.push(`← ${r.relation_type}`);
    }
    const bucket = (kk: string) => [...nodes.values()].filter((n) => n.kind === kk);
    const glossarySlugs = bucket("glossary").map((n) => n.ref);
    const saintIds = bucket("saint").map((n) => n.ref);
    const prayerSlugs = bucket("prayer").map((n) => n.ref);
    const collectionSlugs = bucket("collection").map((n) => n.ref);

    const [g, s, p, c] = await Promise.all([
      glossarySlugs.length
        ? sb.from("glossary").select("slug,term,short_definition,category").in("slug", glossarySlugs).eq("status", "published")
        : Promise.resolve({ data: [] as any[] }),
      saintIds.length
        ? sb.from("saints").select("id,name,title,feast_day,bio,category").in("id", saintIds)
        : Promise.resolve({ data: [] as any[] }),
      prayerSlugs.length
        ? sb.from("prayers").select("slug,title,category,kicker").in("slug", prayerSlugs).eq("is_published", true)
        : Promise.resolve({ data: [] as any[] }),
      collectionSlugs.length
        ? sb.from("collections").select("slug,title,subtitle,category").in("slug", collectionSlugs).eq("status", "published")
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const payload = {
      node: { kind, ref },
      glossary: g.data ?? [],
      saints: s.data ?? [],
      prayers: p.data ?? [],
      collections: c.data ?? [],
      bible: bucket("bible"),
      catechism: bucket("catechism"),
      relations_meta: [...nodes.values()],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
