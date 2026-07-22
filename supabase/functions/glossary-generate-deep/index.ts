/**
 * glossary-generate-deep — gera `deep_interpretation` para um verbete do
 * Glossário no padrão Logos 2030 via Lovable AI Gateway.
 *
 * Recebe { slug } de um usuário admin/editor autenticado. Devolve o texto
 * gerado E persiste no banco marcando o verbete como `status='draft'` +
 * `editorial_completeness='partial'` (para revisão editorial antes de
 * republicar). Nunca republica sozinho.
 */
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { generateText } from "npm:ai";

interface Body { slug?: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "unauthenticated" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Cliente escopado ao usuário — para checar papel
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "unauthenticated" }, 401);

    // Checa papel admin/editor/revisor no glossary_permissions
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: perm } = await admin
      .from("glossary_permissions")
      .select("role")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    const { data: rolesRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    const roles = new Set([
      ...(perm?.role ? [perm.role] : []),
      ...((rolesRow ?? []).map((r: any) => r.role)),
    ]);
    const allowed = roles.has("admin") || roles.has("editor") || roles.has("revisor");
    if (!allowed) return json({ error: "forbidden" }, 403);

    const body = (await req.json().catch(() => ({}))) as Body;
    const slug = (body.slug ?? "").trim();
    if (!slug) return json({ error: "slug obrigatório" }, 400);

    const { data: term, error: termErr } = await admin
      .from("glossary")
      .select("slug,term,category,short_definition,definition,etymology,bible_verses,catechism_references")
      .eq("slug", slug)
      .maybeSingle();
    if (termErr || !term) return json({ error: "verbete não encontrado" }, 404);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY ausente" }, 500);

    const gateway = createLovableAiGatewayProvider(apiKey);

    const system = `Você é o Editor Teológico da Cathedra Digital, uma plataforma católica de estudo e vida interior no padrão editorial "Logos 2030".

Sua tarefa é escrever o campo \`deep_interpretation\` de um verbete do Glossário Teológico. Este campo é a interpretação profunda e sistemática do termo — não a definição curta.

REGRAS ABSOLUTAS:
- Fidelidade integral ao Magistério católico (Escritura, Tradição, CIC, Concílios, Doutores).
- Português (Brasil) culto, denso e contemplativo. Nunca coloquial.
- Sem "Claro", "Vamos explorar", "Neste artigo", "É importante notar". Vai direto ao conteúdo.
- Sem emojis. Sem markdown decorativo. Parágrafos densos separados por linha em branco.
- Cite fontes precisas quando afirmar algo específico: (CIC 234), (De Trinitate V, 11), (Suma Teológica I, q. 27, a. 1), (Jo 14,26).
- Nunca invente citação. Se não tem certeza da referência exata, omita a citação e mantenha a afirmação.

ESTRUTURA (500–800 palavras, sem títulos de seção):
1. Abertura: enunciado sintético do mistério em uma frase densa.
2. Fundamento bíblico: como a Escritura revela isso (2–3 passagens fundantes).
3. Desenvolvimento dogmático: Padres, Concílios, Doutores. Distinções técnicas quando pertinente.
4. Articulação com o restante da fé: como este verbete se relaciona com Cristo, Igreja, sacramentos, vida moral.
5. Fecho: dimensão espiritual/existencial — o que este mistério significa para o cristão hoje.

Não usar títulos numerados. Fluir como texto teológico contínuo.`;

    const context = [
      `Termo: ${term.term}`,
      `Categoria: ${term.category ?? "não informada"}`,
      `Definição curta atual: ${term.short_definition ?? "-"}`,
      `Etimologia atual: ${term.etymology ?? "-"}`,
      term.bible_verses?.length ? `Bíblia já referenciada: ${(term.bible_verses as string[]).join("; ")}` : "",
      term.catechism_references?.length ? `Catecismo já referenciado: ${(term.catechism_references as string[]).join("; ")}` : "",
    ].filter(Boolean).join("\n");

    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system,
      prompt: `Escreva o \`deep_interpretation\` do verbete abaixo, seguindo o padrão Logos 2030.\n\n${context}`,
      maxRetries: 1,
    });

    const clean = (text ?? "").trim();
    if (!clean || clean.length < 400) {
      return json({ error: "geração insuficiente", raw: clean }, 502);
    }

    const { error: updErr } = await admin
      .from("glossary")
      .update({
        deep_interpretation: clean,
        status: "draft",
        editorial_completeness: "partial",
        updated_at: new Date().toISOString(),
      })
      .eq("slug", slug);
    if (updErr) return json({ error: updErr.message }, 500);

    return json({ ok: true, slug, chars: clean.length, preview: clean.slice(0, 200) });
  } catch (e: any) {
    console.error("[glossary-generate-deep]", e);
    return json({ error: e?.message ?? String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
