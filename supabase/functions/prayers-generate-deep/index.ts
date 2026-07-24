/**
 * prayers-generate-deep — gera campos editoriais de uma Oração no padrão Logos 2030
 * via Lovable AI Gateway.
 *
 * Aceita { slug, field } de um usuário admin/editor/revisor autenticado.
 * `field` ∈ { content | explanation | meditation | subtitle |
 *             source_ref | related_bible | related_catechism | related_glossary }
 *
 * Toda geração persiste como `is_published = false` (rascunho) até revisão manual.
 * Retro-compat: sem `field` → gera `explanation`.
 */
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
import { composeEditorialSystemPrompt } from "../_shared/editorial-prompt.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { generateText } from "npm:ai";

type Field =
  | "content"
  | "explanation"
  | "meditation"
  | "subtitle"
  | "source_ref"
  | "related_bible"
  | "related_catechism"
  | "related_glossary";

interface Body { slug?: string; field?: Field }

const ALLOWED_FIELDS: Field[] = [
  "content", "explanation", "meditation", "subtitle",
  "source_ref", "related_bible", "related_catechism", "related_glossary",
];

const BASE_RULES = `REGRAS ABSOLUTAS:
- Fidelidade integral ao Magistério católico (Escritura, Tradição, CIC, Concílios, Doutores).
- Português (Brasil) culto, denso e contemplativo. Nunca coloquial.
- Sem "Claro", "Vamos explorar", "Neste artigo", "É importante notar". Direto ao conteúdo.
- Sem emojis. Sem markdown decorativo.
- Cite fontes precisas quando afirmar algo específico: (CIC 2708), (Rosarium Virginis Mariae §12), (Lc 1,26-38).
- Nunca invente citação, autoria de oração, ou fonte litúrgica. Se sem certeza, omita.
- Não reescreva o texto da oração em si — trabalhe sempre no aparato editorial em torno dela.`;

function buildPrompt(field: Field, prayer: any): { system: string; user: string; expectJson: boolean } {
  const ctx = [
    `Oração: ${prayer.title}`,
    `Subtítulo atual: ${prayer.subtitle ?? "-"}`,
    `Categoria: ${prayer.category ?? "-"}`,
    prayer.content       ? `Descrição atual: ${String(prayer.content).slice(0, 600)}…` : "",
    prayer.explanation   ? `Explicação atual: ${String(prayer.explanation).slice(0, 600)}…` : "",
    prayer.meditation    ? `Meditação atual: ${String(prayer.meditation).slice(0, 400)}…` : "",
    prayer.source_ref    ? `Fonte atual: ${prayer.source_ref}` : "",
    prayer.related_bible?.length ? `Bíblia atual: ${(prayer.related_bible as string[]).join("; ")}` : "",
  ].filter(Boolean).join("\n");

  switch (field) {
    case "content":
      return {
        system: `Você é o Editor Litúrgico da Cathedra Digital (padrão "Logos 2030"). Escreve o campo \`content\` de uma oração — a apresentação editorial que introduz a devoção (não o corpo rezado).\n\n${BASE_RULES}\n\nESTRUTURA (220–380 palavras, prosa contínua, sem títulos): origem e tradição da oração; sentido espiritual central; papel na vida da Igreja; disposição interior recomendada. Termina convidando à oração.`,
        user: `Escreva o \`content\` editorial da oração.\n\n${ctx}`,
        expectJson: false,
      };
    case "explanation":
      return {
        system: `Editor Litúrgico Cathedra. Escreve \`explanation\` — a explicação teológica da oração.\n\n${BASE_RULES}\n\nESTRUTURA (160–260 palavras, prosa contínua): fundamento bíblico e patrístico; articulação com a doutrina católica; posição no ano litúrgico ou na vida sacramental quando aplicável.`,
        user: `Escreva a explicação teológica da oração.\n\n${ctx}`,
        expectJson: false,
      };
    case "meditation":
      return {
        system: `Editor Litúrgico Cathedra. Escreve \`meditation\` — meditação breve para acompanhar a oração.\n\n${BASE_RULES}\n\nESTRUTURA (100–180 palavras): meditação contemplativa que ilumina um verso ou momento central da oração; conduz o coração à disposição orante. Voz interior.`,
        user: `Escreva a meditação da oração.\n\n${ctx}`,
        expectJson: false,
      };
    case "subtitle":
      return {
        system: `Editor Litúrgico Cathedra. Escreve \`subtitle\` — uma linha (60–120 caracteres) que sintetiza o coração da oração.\n\n${BASE_RULES}\n\nRetorne apenas a frase, sem aspas, sem ponto final decorativo.`,
        user: `Escreva o subtítulo da oração.\n\n${ctx}`,
        expectJson: false,
      };
    case "source_ref":
      return {
        system: `Editor Litúrgico Cathedra. Escreve \`source_ref\` — indicação sucinta da origem/fonte da oração.\n\n${BASE_RULES}\n\nEstilo: "Tradição da Igreja Católica; forma promulgada por São João Paulo II em Rosarium Virginis Mariae (2002)." 1–3 frases, sem inventar autoria.`,
        user: `Escreva a referência de fonte da oração.\n\n${ctx}`,
        expectJson: false,
      };
    case "related_bible":
      return {
        system: `Editor Litúrgico Cathedra. Gera \`related_bible\` — 3 a 6 passagens bíblicas que iluminam a oração.\n\n${BASE_RULES}\n\nRetorne JSON puro: array de strings "Sigla Cap,Vers" ou "Sigla Cap,Vers-Vers". Ex.: ["Lc 1,26-38","Mt 6,9-13"]. Apenas citações canônicas verificáveis.`,
        user: `Gere as referências bíblicas da oração em JSON.\n\n${ctx}`,
        expectJson: true,
      };
    case "related_catechism":
      return {
        system: `Editor Litúrgico Cathedra. Gera \`related_catechism\` — parágrafos do CIC relacionados à oração.\n\n${BASE_RULES}\n\nRetorne JSON puro: array de números inteiros. Ex.: [2708, 2673, 971]. Somente parágrafos existentes (1–2865).`,
        user: `Gere as referências do Catecismo em JSON.\n\n${ctx}`,
        expectJson: true,
      };
    case "related_glossary":
      return {
        system: `Editor Litúrgico Cathedra. Gera \`related_glossary\` — 3 a 6 verbetes do Glossário Cathedra que iluminam a oração.\n\n${BASE_RULES}\n\nRetorne JSON puro: array de slugs em kebab-case. Ex.: ["rosario","misterio","encarnacao"]. Use apenas termos teologicamente pertinentes.`,
        user: `Gere os slugs de Glossário relacionados em JSON.\n\n${ctx}`,
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

    // Aceita admin/editor/revisor via user_roles (mesma convenção do Editorial Engine).
    const { data: rolesRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    const roles = new Set((rolesRow ?? []).map((r: any) => r.role));
    if (!(roles.has("admin") || roles.has("editor") || roles.has("revisor"))) {
      return json({ error: "forbidden" }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const slug = (body.slug ?? "").trim();
    const field: Field = (body.field ?? "explanation") as Field;
    if (!slug) return json({ error: "slug obrigatório" }, 400);
    if (!ALLOWED_FIELDS.includes(field)) return json({ error: `campo inválido: ${field}` }, 400);

    const { data: prayer, error: prayerErr } = await admin
      .from("prayers")
      .select("id,slug,title,subtitle,category,content,explanation,meditation,source_ref,related_bible,related_catechism,related_glossary")
      .eq("slug", slug)
      .maybeSingle();
    if (prayerErr || !prayer) return json({ error: "oração não encontrada" }, 404);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY ausente" }, 500);

    const gateway = createLovableAiGatewayProvider(apiKey);
    const { system, user, expectJson } = buildPrompt(field, prayer);

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
    } else if (raw.length < 40) {
      return json({ error: "geração insuficiente", raw }, 502);
    }

    const patch: Record<string, any> = {
      [field]: value,
      is_published: false,
      updated_at: new Date().toISOString(),
    };
    const { error: updErr } = await admin.from("prayers").update(patch).eq("slug", slug);
    if (updErr) return json({ error: updErr.message }, 500);

    return json({
      ok: true, slug, field,
      size: Array.isArray(value) ? value.length : (typeof value === "string" ? value.length : 0),
      preview: typeof value === "string" ? value.slice(0, 200) : value,
    });
  } catch (e: any) {
    console.error("[prayers-generate-deep]", e);
    return json({ error: e?.message ?? String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
