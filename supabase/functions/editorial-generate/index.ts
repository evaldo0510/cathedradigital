/**
 * editorial-generate — porta de entrada genérica do Editorial Engine.
 *
 * Recebe `{ entity, slug, field }` e roteia para o gerador especializado da entidade.
 * Hoje só há um gerador (`glossary-generate-deep`); Santos, Orações, Coleções e
 * Jornadas serão plugados nas próximas sprints sem tocar em quem consome esta função.
 */
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

type Entity = "glossary" | "saints" | "prayers" | "collections" | "journeys" | "catechism";

const ROUTES: Partial<Record<Entity, string>> = {
  glossary: "glossary-generate-deep",
  prayers: "prayers-generate-deep",
  catechism: "catechism-generate-deep",
};


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthenticated" }, 401);

    const body = await req.json().catch(() => ({} as any));
    const entity = String(body?.entity ?? "").trim() as Entity;
    const slug = String(body?.slug ?? "").trim();
    const field = String(body?.field ?? "").trim();

    if (!entity) return json({ error: "entity obrigatória" }, 400);
    if (!slug) return json({ error: "slug obrigatório" }, 400);

    const route = ROUTES[entity];
    if (!route) return json({ error: `entity não plugada: ${entity}` }, 501);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await client.functions.invoke(route, {
      body: { slug, field: field || undefined },
    });

    if (error) return json({ error: error.message, entity, route }, 502);
    return json({ ok: true, entity, route, result: data });
  } catch (e: any) {
    console.error("[editorial-generate]", e);
    return json({ error: e?.message ?? String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
