/**
 * catechism-generate-deep — gera campos editoriais de um parágrafo do CIC no
 * padrão Logos 2030 via Lovable AI Gateway.
 *
 * Aceita { slug, field } de um usuário admin/editor/revisor autenticado.
 * `field` ∈ { explicacao | interpretacao_profunda | aplicacao_pratica |
 *             reflexao_final | exercicio | related_bible | related_glossary |
 *             related_catechism }
 *
 * NUNCA reescreve `texto_base` (o texto oficial do CIC é intocável).
 * Toda geração persiste como `status='draft'` até revisão manual.
 */
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
import { composeEditorialSystemPrompt } from "../_shared/editorial-prompt.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { generateText } from "npm:ai";

type Field =
  | "explicacao"
  | "interpretacao_profunda"
  | "aplicacao_pratica"
  | "reflexao_final"
  | "exercicio"
  | "related_bible"
  | "related_glossary"
  | "related_catechism";

interface Body { slug?: string; field?: Field }

const ALLOWED_FIELDS: Field[] = [
  "explicacao", "interpretacao_profunda", "aplicacao_pratica",
  "reflexao_final", "exercicio",
  "related_bible", "related_glossary", "related_catechism",
];

const BASE_RULES = `REGRAS ABSOLUTAS:
- Fidelidade integral ao Magistério (Escritura, Tradição, CIC, Concílios, Doutores).
- Português (Brasil) culto, denso e contemplativo. Nunca coloquial.
- Sem "Claro", "Vamos explorar", "Neste artigo", "É importante notar". Direto ao conteúdo.
- Sem emojis, sem markdown decorativo, sem listas quando prosa contínua for pedida.
- Cite fontes precisas: (CIC 460), (Lumen Gentium §12), (Rm 8,15), (São Tomás, ST I q.43).
- Nunca invente citação, autoria ou fonte. Se sem certeza, omita.
- JAMAIS reescreva o texto oficial do CIC (\`texto_base\`) — trabalhe sempre no aparato editorial em torno dele.
- Não repetir literalmente o \`texto_base\` no início da resposta.`;

function buildPrompt(field: Field, cic: any): { system: string; user: string; expectJson: boolean } {
  const ctx = [
    `Parágrafo CIC nº ${cic.paragraph}`,
    `Título/tema: ${cic.subtitle ?? cic.title ?? "-"}`,
    `Texto oficial (para contexto — não reescrever):\n"${String(cic.texto_base ?? "").slice(0, 1200)}"`,
    cic.explicacao              ? `Explicação atual: ${String(cic.explicacao).slice(0, 500)}…` : "",
    cic.interpretacao_profunda  ? `Interpretação atual: ${String(cic.interpretacao_profunda).slice(0, 500)}…` : "",
    cic.aplicacao_pratica       ? `Aplicação atual: ${String(cic.aplicacao_pratica).slice(0, 400)}…` : "",
  ].filter(Boolean).join("\n\n");

  switch (field) {
    case "explicacao":
      return {
        system: `Você é o Editor Doutrinal da Cathedra Digital (padrão "Logos 2030"). Escreve \`explicacao\` de um parágrafo do CIC — abertura pedagógica que ilumina o parágrafo para leitor culto não-especialista.\n\n${BASE_RULES}\n\nESTRUTURA (140–220 palavras, prosa contínua): situar o parágrafo dentro da seção do CIC; explicitar o núcleo doutrinal em linguagem clara; conectar com a experiência da fé viva. Sem introduções vazias.`,
        user: `Escreva a explicação editorial do parágrafo.\n\n${ctx}`,
        expectJson: false,
      };
    case "interpretacao_profunda":
      return {
        system: `Editor Doutrinal Cathedra. Escreve \`interpretacao_profunda\` — leitura teológica densa do parágrafo.\n\n${BASE_RULES}\n\nESTRUTURA (200–340 palavras, prosa contínua): raízes bíblicas e patrísticas; articulação com o restante do CIC e com o Magistério (concílios, encíclicas); implicações dogmáticas ou morais. Cite fontes específicas.`,
        user: `Escreva a interpretação teológica profunda do parágrafo.\n\n${ctx}`,
        expectJson: false,
      };
    case "aplicacao_pratica":
      return {
        system: `Editor Doutrinal Cathedra. Escreve \`aplicacao_pratica\` — pontes para a vida cristã concreta.\n\n${BASE_RULES}\n\nESTRUTURA (100–180 palavras): como este parágrafo ilumina decisões, oração, sacramentos, caridade ou testemunho hoje. Concreto sem se tornar utilitário.`,
        user: `Escreva a aplicação prática do parágrafo.\n\n${ctx}`,
        expectJson: false,
      };
    case "reflexao_final":
      return {
        system: `Editor Doutrinal Cathedra. Escreve \`reflexao_final\` — parágrafo que fecha a leitura convidando à contemplação.\n\n${BASE_RULES}\n\nESTRUTURA (90–150 palavras): voz interior; sintetiza o coração do parágrafo; termina em tom orante, sem pieguice.`,
        user: `Escreva a reflexão final do parágrafo.\n\n${ctx}`,
        expectJson: false,
      };
    case "exercicio":
      return {
        system: `Editor Doutrinal Cathedra. Escreve \`exercicio\` — proposta de exercício espiritual objetivo (1 ato hoje).\n\n${BASE_RULES}\n\nESTRUTURA (40–90 palavras): uma proposta única, verificável no dia. Sem lista de tarefas, sem múltiplos itens numerados.`,
        user: `Escreva o exercício espiritual do parágrafo.\n\n${ctx}`,
        expectJson: false,
      };
    case "related_bible":
      return {
        system: `Editor Doutrinal Cathedra. Gera \`related_bible\` — 3 a 6 passagens bíblicas que iluminam o parágrafo.\n\n${BASE_RULES}\n\nRetorne JSON puro: array de strings "Sigla Cap,Vers" ou "Sigla Cap,Vers-Vers". Ex.: ["Rm 8,15","Gl 4,6"]. Apenas citações canônicas verificáveis.`,
        user: `Gere as referências bíblicas do parágrafo em JSON.\n\n${ctx}`,
        expectJson: true,
      };
    case "related_glossary":
      return {
        system: `Editor Doutrinal Cathedra. Gera \`related_glossary\` — 3 a 6 verbetes do Glossário Cathedra pertinentes.\n\n${BASE_RULES}\n\nRetorne JSON puro: array de slugs em kebab-case. Ex.: ["graca","filiacao-divina","trindade"]. Apenas termos teologicamente centrais.`,
        user: `Gere os slugs de Glossário relacionados em JSON.\n\n${ctx}`,
        expectJson: true,
      };
    case "related_catechism":
      return {
        system: `Editor Doutrinal Cathedra. Gera \`related_catechism\` — 3 a 6 parágrafos do CIC cruzados (não o próprio).\n\n${BASE_RULES}\n\nRetorne JSON puro: array de inteiros entre 1 e 2865, excluindo o parágrafo atual. Ex.: [460, 1996, 2777].`,
        user: `Gere as referências cruzadas do Catecismo em JSON.\n\n${ctx}`,
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
    const field: Field = (body.field ?? "explicacao") as Field;
    if (!slug) return json({ error: "slug obrigatório" }, 400);
    if (!ALLOWED_FIELDS.includes(field)) return json({ error: `campo inválido: ${field}` }, 400);

    const { data: cic, error: cicErr } = await admin
      .from("catechism_official")
      .select("id,slug,paragraph,title,subtitle,texto_base,explicacao,interpretacao_profunda,aplicacao_pratica,reflexao_final,exercicio")
      .eq("slug", slug)
      .maybeSingle();
    if (cicErr || !cic) return json({ error: "parágrafo não encontrado" }, 404);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY ausente" }, 500);

    const gateway = createLovableAiGatewayProvider(apiKey);
    const { system, user, expectJson } = buildPrompt(field, cic);

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
      status: "draft",
      updated_at: new Date().toISOString(),
    };
    const { error: updErr } = await admin.from("catechism_official").update(patch).eq("slug", slug);
    if (updErr) return json({ error: updErr.message }, 500);

    return json({
      ok: true, slug, field,
      size: Array.isArray(value) ? value.length : (typeof value === "string" ? value.length : 0),
      preview: typeof value === "string" ? value.slice(0, 200) : value,
    });
  } catch (e: any) {
    console.error("[catechism-generate-deep]", e);
    return json({ error: e?.message ?? String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
