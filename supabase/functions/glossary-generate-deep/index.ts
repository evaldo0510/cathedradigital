/**
 * glossary-generate-deep — gera campos editoriais de um verbete do Glossário
 * no padrão Logos 2030 via Lovable AI Gateway.
 *
 * Aceita { slug, field } de um usuário admin/editor/revisor autenticado.
 * `field` ∈ { deep_interpretation | etymology | historical_context |
 *             practical_application | logos_meditation | faq |
 *             bibliography | bible_verses | catechism_references |
 *             fathers_refs | magisterium_references }
 *
 * Toda geração persiste como `status='draft'` + `editorial_completeness='partial'`.
 * Retro-compat: sem `field` → gera `deep_interpretation`.
 */
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
import { composeEditorialSystemPrompt } from "../_shared/editorial-prompt.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { generateText } from "npm:ai";

type Field =
  | "deep_interpretation"
  | "etymology"
  | "historical_context"
  | "practical_application"
  | "logos_meditation"
  | "faq"
  | "bibliography"
  | "bible_verses"
  | "catechism_references"
  | "fathers_refs"
  | "magisterium_references";

interface Body { slug?: string; field?: Field }

const ALLOWED_FIELDS: Field[] = [
  "deep_interpretation", "etymology", "historical_context",
  "practical_application", "logos_meditation", "faq", "bibliography",
  "bible_verses", "catechism_references", "fathers_refs", "magisterium_references",
];

const BASE_RULES = `REGRAS ABSOLUTAS:
- Fidelidade integral ao Magistério católico (Escritura, Tradição, CIC, Concílios, Doutores).
- Português (Brasil) culto, denso e contemplativo. Nunca coloquial.
- Sem "Claro", "Vamos explorar", "Neste artigo", "É importante notar". Direto ao conteúdo.
- Sem emojis. Sem markdown decorativo.
- Cite fontes precisas quando afirmar algo específico: (CIC 234), (De Trinitate V,11), (Suma I q.27 a.1), (Jo 14,26).
- Nunca invente citação. Se sem certeza da referência exata, omita a citação e mantenha a afirmação.`;

function buildPrompt(field: Field, term: any): { system: string; user: string; expectJson: boolean } {
  const ctx = [
    `Termo: ${term.term}`,
    `Categoria: ${term.category ?? "-"}`,
    `Definição curta: ${term.short_definition ?? "-"}`,
    `Definição: ${term.definition ?? "-"}`,
    term.etymology ? `Etimologia: ${term.etymology}` : "",
    term.deep_interpretation ? `Interpretação profunda (existente, resumida): ${String(term.deep_interpretation).slice(0, 600)}…` : "",
    term.bible_verses?.length ? `Bíblia atual: ${(term.bible_verses as string[]).join("; ")}` : "",
    term.catechism_references?.length ? `CIC atual: ${(term.catechism_references as string[]).join("; ")}` : "",
  ].filter(Boolean).join("\n");

  switch (field) {
    case "deep_interpretation":
      return {
        system: `Você é o Editor Teológico da Cathedra Digital (padrão "Logos 2030"). Escreve o \`deep_interpretation\` de um verbete do Glossário.\n\n${BASE_RULES}\n\nESTRUTURA (500–800 palavras, sem títulos): abertura sintética; fundamento bíblico (2–3 passagens); desenvolvimento dogmático (Padres, Concílios, Doutores); articulação com Cristo, Igreja, sacramentos; fecho espiritual/existencial. Texto contínuo.`,
        user: `Escreva \`deep_interpretation\` do verbete abaixo.\n\n${ctx}`,
        expectJson: false,
      };
    case "etymology":
      return {
        system: `Editor Teológico Cathedra. Escreve a \`etymology\` de um verbete.\n\n${BASE_RULES}\n\nESTRUTURA (80–180 palavras, prosa contínua): origem grega/hebraica/latina com transliteração; evolução semântica; sentido teológico consolidado.`,
        user: `Escreva a etimologia do verbete.\n\n${ctx}`,
        expectJson: false,
      };
    case "historical_context":
      return {
        system: `Editor Teológico Cathedra. Escreve o \`historical_context\` de um verbete.\n\n${BASE_RULES}\n\nESTRUTURA (200–400 palavras): contexto histórico da formulação doutrinal — Padres, Concílios, controvérsias, magistério moderno. Datas e referências precisas.`,
        user: `Escreva o contexto histórico do verbete.\n\n${ctx}`,
        expectJson: false,
      };
    case "practical_application":
      return {
        system: `Editor Teológico Cathedra. Escreve \`practical_application\` — aplicação à vida cristã hoje, sem devocionalismo raso.\n\n${BASE_RULES}\n\nESTRUTURA (180–320 palavras): implicações para oração, sacramentos, discernimento moral, vocação. Concreto, sem generalidades.`,
        user: `Escreva a aplicação prática do verbete.\n\n${ctx}`,
        expectJson: false,
      };
    case "logos_meditation":
      return {
        system: `Editor Teológico Cathedra. Escreve \`logos_meditation\` — meditação breve no espírito da Lectio Divina.\n\n${BASE_RULES}\n\nESTRUTURA (120–220 palavras): meditação contemplativa que parte de uma imagem bíblica ou fórmula patrística e conduz à oração. Voz interior, segunda pessoa quando útil.`,
        user: `Escreva a meditação Logos do verbete.\n\n${ctx}`,
        expectJson: false,
      };
    case "faq":
      return {
        system: `Editor Teológico Cathedra. Gera \`faq\` — 5 a 7 perguntas frequentes teologicamente relevantes.\n\n${BASE_RULES}\n\nRetorne JSON puro (sem markdown, sem comentários): array de objetos { "question": string, "answer": string }. Respostas de 60–180 palavras cada.`,
        user: `Gere o FAQ do verbete em JSON.\n\n${ctx}`,
        expectJson: true,
      };
    case "bibliography":
      return {
        system: `Editor Teológico Cathedra. Gera \`bibliography\` — 5 a 10 obras de referência (Padres, Doutores, magistério, teólogos contemporâneos católicos).\n\n${BASE_RULES}\n\nRetorne JSON puro: array de { "title": string, "author": string, "year"?: string, "note"?: string }. Nunca inventar obra ou autor — se sem certeza, omita.`,
        user: `Gere a bibliografia do verbete em JSON.\n\n${ctx}`,
        expectJson: true,
      };
    case "bible_verses":
      return {
        system: `Editor Teológico Cathedra. Gera \`bible_verses\` — 4 a 8 referências bíblicas fundantes.\n\n${BASE_RULES}\n\nRetorne JSON puro: array de strings no formato "Sigla Cap,Vers" ou "Sigla Cap,Vers-Vers". Ex.: ["Jo 14,26","Mt 28,19","2Cor 13,13"]. Apenas citações canônicas verificáveis.`,
        user: `Gere as referências bíblicas do verbete em JSON.\n\n${ctx}`,
        expectJson: true,
      };
    case "catechism_references":
      return {
        system: `Editor Teológico Cathedra. Gera \`catechism_references\` — parágrafos do CIC diretamente relacionados.\n\n${BASE_RULES}\n\nRetorne JSON puro: array de strings numéricas. Ex.: ["232","234","249-256","2789"]. Somente parágrafos existentes do CIC (1–2865).`,
        user: `Gere as referências do Catecismo em JSON.\n\n${ctx}`,
        expectJson: true,
      };
    case "fathers_refs":
      return {
        system: `Editor Teológico Cathedra. Gera \`fathers_refs\` — passagens patrísticas relevantes.\n\n${BASE_RULES}\n\nRetorne JSON puro: array de strings "Autor, Obra Livro,Capítulo". Ex.: ["Agostinho, De Trinitate V,11","Basílio, Contra Eunômio III,1"]. Apenas obras existentes.`,
        user: `Gere as referências patrísticas em JSON.\n\n${ctx}`,
        expectJson: true,
      };
    case "magisterium_references":
      return {
        system: `Editor Teológico Cathedra. Gera \`magisterium_references\` — documentos magisteriais (concílios, encíclicas, exortações, constituições).\n\n${BASE_RULES}\n\nRetorne JSON puro: array de strings "Documento §parágrafo". Ex.: ["Lumen Gentium §4","Dei Verbum §2","Deus Caritas Est §12"]. Apenas documentos existentes.`,
        user: `Gere as referências magisteriais em JSON.\n\n${ctx}`,
        expectJson: true,
      };
  }
}

function extractJson(raw: string): any {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthenticated" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "unauthenticated" }, 401);

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
    if (!(roles.has("admin") || roles.has("editor") || roles.has("revisor"))) {
      return json({ error: "forbidden" }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const slug = (body.slug ?? "").trim();
    const field: Field = (body.field ?? "deep_interpretation") as Field;
    if (!slug) return json({ error: "slug obrigatório" }, 400);
    if (!ALLOWED_FIELDS.includes(field)) return json({ error: `campo inválido: ${field}` }, 400);

    const { data: term, error: termErr } = await admin
      .from("glossary")
      .select("slug,term,category,short_definition,definition,etymology,deep_interpretation,bible_verses,catechism_references")
      .eq("slug", slug)
      .maybeSingle();
    if (termErr || !term) return json({ error: "verbete não encontrado" }, 404);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY ausente" }, 500);

    const gateway = createLovableAiGatewayProvider(apiKey);
    const { system, user, expectJson } = buildPrompt(field, term);

    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system: composeEditorialSystemPrompt(system),
      prompt: user,
      maxRetries: 1,
    });
    const raw = (text ?? "").trim();
    if (!raw) return json({ error: "geração vazia" }, 502);

    let value: any = raw;
    if (expectJson) {
      try {
        value = extractJson(raw);
        if (!Array.isArray(value) || value.length === 0) {
          return json({ error: "JSON vazio ou não-array", raw: raw.slice(0, 400) }, 502);
        }
      } catch (e: any) {
        return json({ error: `JSON inválido: ${e?.message}`, raw: raw.slice(0, 400) }, 502);
      }
    } else if (raw.length < 60) {
      return json({ error: "geração insuficiente", raw }, 502);
    }

    const patch: Record<string, any> = {
      [field]: value,
      status: "draft",
      editorial_completeness: "partial",
      updated_at: new Date().toISOString(),
    };
    const { error: updErr } = await admin.from("glossary").update(patch).eq("slug", slug);
    if (updErr) return json({ error: updErr.message }, 500);

    return json({
      ok: true, slug, field,
      size: Array.isArray(value) ? value.length : (typeof value === "string" ? value.length : 0),
      preview: typeof value === "string" ? value.slice(0, 200) : value,
    });
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
