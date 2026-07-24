/**
 * saint-ai-reflection — "Aprenda com este Santo".
 *
 * Gera (uma vez) e cacheia em saints.ai_reflection um pacote editorial:
 *   - resumo espiritual
 *   - principais ensinamentos
 *   - meditação baseada nos escritos
 *   - oração inspirada na espiritualidade do santo
 *
 * Idempotente por saint_id: só regenera quando `force=true` ou
 * quando a versão editorial muda.
 */
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { generateText, NoObjectGeneratedError, Output } from "npm:ai";
import { z } from "npm:zod";

const EDITORIAL_VERSION = 2;
const AI_PROVIDER = "lovable-ai-gateway";
const AI_MODEL = "google/gemini-2.5-flash";

const reflectionSchema = z.object({
  summary: z.string(),
  teachings: z.array(z.object({
    title: z.string(),
    body: z.string(),
    source: z.string().optional(),
  })),
  meditation: z.string(),
  meditation_sources: z.array(z.string()).optional(),
  prayer: z.string(),
  citations: z.array(z.object({
    type: z.enum(["quote", "work", "biography", "virtue"]),
    text: z.string(),
    used_in: z.enum(["summary", "teaching", "meditation", "prayer"]).optional(),
  })).optional(),
});

type Reflection = z.infer<typeof reflectionSchema>;

interface RequestBody {
  saint_id: string;
  force?: boolean;
}

const SYSTEM_PROMPT = `Você é um redator editorial católico romano, formado em teologia,
espiritualidade e patrística, escrevendo em português do Brasil para o
Cathedra Digital — plataforma de estudo espiritual.

Regras invioláveis:
- Fidelidade doutrinária absoluta ao Magistério da Igreja Católica.
- Baseie-se APENAS na biografia, virtudes, escritos e frases do santo fornecidos.
- Nunca invente obras, citações ou episódios que não estejam nos dados dados.
- Se um dado faltar, seja discreto — não preencha com genérico.
- Tom contemplativo, sereno, sem clichês modernos, sem "IA falando".
- Deixe implícito que é uma reflexão baseada nos textos e ensinamentos do santo.
- Meditação: 3–4 parágrafos, ancorada nos escritos do santo. Preencha meditation_sources com os trechos/obras que fundamentaram a meditação (curto, verbatim ou paráfrase mínima).
- Oração: composta na primeira pessoa, no espírito do santo, sem invenções.
- Ensinamentos: 3 a 5 itens, cada um com título curto (2–5 palavras), corpo enxuto e, quando possível, "source" apontando a frase/obra que o embasa (trecho curto ou nome da obra).
- Citações: preencha o array "citations" listando os trechos concretos (frases, obras, virtudes ou biografia) que você efetivamente usou como base, marcando em qual seção foram aplicados. Não invente citações.
- Idioma: português (Brasil).`;

function buildUserPrompt(saint: Record<string, unknown>): string {
  const parts: string[] = [];
  parts.push(`Santo: ${saint.name}`);
  if (saint.title) parts.push(`Título: ${saint.title}`);
  if (saint.category) parts.push(`Categoria: ${saint.category}`);
  if (saint.century) parts.push(`Século: ${saint.century}`);
  if (saint.country) parts.push(`País: ${saint.country}`);
  if (saint.vocation) parts.push(`Vocação: ${saint.vocation}`);
  if (saint.born) parts.push(`Nascimento: ${saint.born}`);
  if (saint.died) parts.push(`Falecimento: ${saint.died}`);
  if (Array.isArray(saint.virtues) && saint.virtues.length) {
    parts.push(`Virtudes: ${(saint.virtues as string[]).join(", ")}`);
  }
  if (saint.historical_context) {
    parts.push(`\nContexto histórico:\n${saint.historical_context}`);
  }
  if (saint.full_bio || saint.bio) {
    parts.push(`\nBiografia:\n${saint.full_bio ?? saint.bio}`);
  }
  if (Array.isArray(saint.works) && saint.works.length) {
    parts.push(`\nObras:\n${(saint.works as any[]).map((w) => `- ${w.title ?? w}`).join("\n")}`);
  }
  const quotes = Array.isArray(saint.quotes_rich) && (saint.quotes_rich as any[]).length
    ? (saint.quotes_rich as any[]).map((q) => q.text).filter(Boolean)
    : Array.isArray(saint.quotes) ? saint.quotes as string[] : [];
  if (quotes.length) {
    parts.push(`\nFrases e ensinamentos:\n${quotes.map((q) => `- "${q}"`).join("\n")}`);
  }
  parts.push(
    "\nProduza uma reflexão editorial no schema estruturado: um resumo espiritual conciso, "
    + "3 a 5 ensinamentos principais, uma meditação baseada nos escritos e uma oração inspirada "
    + "na espiritualidade deste santo. Português (Brasil), tom contemplativo.",
  );
  return parts.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) {
    return new Response(
      JSON.stringify({ error: "Missing LOVABLE_API_KEY" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let body: RequestBody;
  try {
    body = await req.json() as RequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!body?.saint_id) {
    return new Response(
      JSON.stringify({ error: "saint_id is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: saint, error: fetchErr } = await admin
    .from("saints")
    .select("*")
    .eq("id", body.saint_id)
    .maybeSingle();

  if (fetchErr || !saint) {
    return new Response(
      JSON.stringify({ error: "Saint not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Cache hit
  const cached = saint.ai_reflection as any;
  if (!body.force && cached && cached.version === EDITORIAL_VERSION && cached.summary) {
    return new Response(
      JSON.stringify({ cached: true, reflection: cached }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Generate
  const gateway = createLovableAiGatewayProvider(lovableKey);
  const model = gateway(AI_MODEL);
  let output: Reflection;
  try {
    const result = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(saint),
      output: Output.object({ schema: reflectionSchema }),
    });
    output = result.output as Reflection;
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) {
      console.error("saint-ai-reflection: schema mismatch", err.text?.slice(0, 500));
    } else {
      console.error("saint-ai-reflection: generation failed", err);
    }
    const msg = (err as { message?: string })?.message ?? "unknown";
    const isRateLimit = /rate limit|429|too many requests/i.test(msg);
    const isPayment = /402|payment required|credit|insufficient|quota/i.test(msg);
    const status = isPayment ? 402 : isRateLimit ? 429 : 503;
    const friendly = isPayment
      ? "Os créditos de IA da plataforma se esgotaram."
      : isRateLimit
      ? "Muitas requisições simultâneas. Tente novamente em instantes."
      : "Não foi possível gerar a reflexão neste momento.";
    return new Response(
      JSON.stringify({ error: friendly, detail: msg }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const payload = {
    version: EDITORIAL_VERSION,
    summary: output.summary,
    teachings: output.teachings,
    meditation: output.meditation,
    prayer: output.prayer,
    model: AI_MODEL,
    provider: AI_PROVIDER,
    generated_at: new Date().toISOString(),
  };

  const upd = await admin
    .from("saints")
    .update({ ai_reflection: payload })
    .eq("id", body.saint_id);

  if (upd.error) {
    console.error("saint-ai-reflection: persist failed", upd.error);
  }

  return new Response(
    JSON.stringify({ cached: false, reflection: payload }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
