/**
 * liturgy-meditation — Centro de Meditação Litúrgica.
 *
 * Recebe as leituras do dia + iso_date; devolve um pacote editorial
 * completo (tema, chave, Padres, CIC, Magistério, Meditação Logos,
 * oração final, história da Igreja, ação do dia).
 *
 * Idempotente por iso_date: gera com Lovable AI apenas uma vez ao dia,
 * armazena em `liturgy_meditations` e reusa para todos os leitores.
 */
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { generateText, NoObjectGeneratedError, Output } from "npm:ai";
import { z } from "npm:zod";

// ── Schema editorial (constraint-free: nenhum .min/.max) ────────────
const meditationSchema = z.object({
  theme: z.string(),
  reading_key: z.string(),
  fathers: z.array(z.object({
    author: z.string(),
    work: z.string(),
    reference: z.string(),
    quote: z.string(),
  })),
  catechism: z.array(z.object({
    paragraph: z.number(),
    quote: z.string(),
  })),
  magisterium: z.array(z.object({
    document: z.string(),
    pope: z.string(),
    section: z.string(),
    quote: z.string(),
  })),
  logos: z.object({
    observe: z.string(),
    reflect: z.string(),
    pray: z.string(),
    live: z.string(),
  }),
  final_prayer: z.string(),
  church_history: z.object({
    saint: z.string().nullable(),
    council: z.string().nullable(),
    pope: z.string().nullable(),
    document: z.string().nullable(),
  }).nullable(),
  action_of_day: z.string(),
});

type Meditation = z.infer<typeof meditationSchema>;

interface RequestBody {
  iso_date: string;
  readings: {
    liturgia?: string | null;
    dia?: string | null;
    season?: string | null;
    primeiraLeitura?: { referencia: string; titulo?: string; texto: string } | null;
    salmo?: { referencia: string; refrao?: string; texto: string } | null;
    segundaLeitura?: { referencia: string; titulo?: string; texto: string } | null;
    evangelho?: { referencia: string; titulo?: string; texto: string } | null;
  };
}

// ── Versionamento editorial ──────────────────────────────────────
// Aumente EDITORIAL_VERSION sempre que o schema/prompt mudar a
// ponto de invalidar meditações antigas. prompt_hash já detecta
// mudança automática de texto — version é o marcador semântico.
const EDITORIAL_VERSION = 1;
const AI_PROVIDER = "lovable-ai-gateway";
const AI_MODEL = "google/gemini-2.5-flash";

const SYSTEM_PROMPT = `Você é um redator editorial católico romano, formado em teologia e liturgia,
escrevendo em português do Brasil para o Cathedra — plataforma de estudo espiritual.

Regras invioláveis:
- Fidelidade doutrinária absoluta ao Magistério da Igreja Católica.
- Nunca invente citações, obras, parágrafos do Catecismo ou documentos pontifícios.
  Se não tiver certeza de uma referência real, deixe o array vazio.
- Padres da Igreja: use apenas Padres reconhecidos (Agostinho, Crisóstomo, Ambrósio,
  Gregório Magno, Jerônimo, Bento, Tomás de Aquino, etc.) com obras que existem.
- Catecismo: apenas números CIC reais (1–2865).
- Magistério: apenas documentos oficiais reais (encíclicas, exortações, constituições).
- Tom contemplativo, sereno, sem clichês modernos, sem "IA falando".
- Nunca dizer "hoje a leitura nos convida" ou fórmulas gastas.
- Meditação Logos: exatamente 4 blocos (Observe, Reflita, Reze, Viva) com 2–3 frases cada.
- Ação do dia: uma prática concreta, curta, executável hoje.
- Oração final: composta especificamente para as leituras do dia, não genérica.
- Idioma: português (Brasil).`;

function buildUserPrompt(iso: string, r: RequestBody["readings"]): string {
  const parts: string[] = [];
  parts.push(`Data litúrgica: ${iso}`);
  if (r.dia) parts.push(`Dia: ${r.dia}`);
  if (r.liturgia) parts.push(`Celebração: ${r.liturgia}`);
  if (r.season) parts.push(`Tempo: ${r.season}`);
  parts.push("");
  if (r.primeiraLeitura) {
    parts.push(`PRIMEIRA LEITURA (${r.primeiraLeitura.referencia}):`);
    parts.push(r.primeiraLeitura.texto);
    parts.push("");
  }
  if (r.salmo) {
    parts.push(`SALMO RESPONSORIAL (${r.salmo.referencia}):`);
    if (r.salmo.refrao) parts.push(`Refrão: ${r.salmo.refrao}`);
    parts.push(r.salmo.texto);
    parts.push("");
  }
  if (r.segundaLeitura) {
    parts.push(`SEGUNDA LEITURA (${r.segundaLeitura.referencia}):`);
    parts.push(r.segundaLeitura.texto);
    parts.push("");
  }
  if (r.evangelho) {
    parts.push(`EVANGELHO (${r.evangelho.referencia}):`);
    parts.push(r.evangelho.texto);
    parts.push("");
  }
  parts.push(
    "Produza um roteiro editorial de meditação seguindo o schema estruturado. " +
    "Cada citação de Padres/CIC/Magistério deve ser REAL — se em dúvida, envie array vazio. " +
    "Escreva em português (Brasil), tom contemplativo. " +
    "Ação do dia: uma prática concreta, curta, executável hoje. " +
    "Oração final: composta para estas leituras específicas.",
  );
  return parts.join("\n");
}

async function sha1(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-1", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hashReadings(r: RequestBody["readings"]): Promise<string> {
  const norm = JSON.stringify({
    l: r.liturgia ?? "",
    p1: r.primeiraLeitura?.referencia ?? "",
    ps: r.salmo?.referencia ?? "",
    p2: r.segundaLeitura?.referencia ?? "",
    ev: r.evangelho?.referencia ?? "",
  });
  return sha1(norm);
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

  if (!body?.iso_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.iso_date)) {
    return new Response(
      JSON.stringify({ error: "iso_date (YYYY-MM-DD) is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (!body.readings?.evangelho?.texto) {
    return new Response(
      JSON.stringify({ error: "readings.evangelho.texto is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const readingsHash = await hashReadings(body.readings);
  const promptHash = await sha1(SYSTEM_PROMPT);

  // 1. Cache hit — só é reaproveitado quando readings_hash,
  //    prompt_hash E version batem. Qualquer divergência força regeneração.
  const existing = await admin
    .from("liturgy_meditations")
    .select("*")
    .eq("iso_date", body.iso_date)
    .maybeSingle();

  if (
    existing.data &&
    existing.data.readings_hash === readingsHash &&
    existing.data.prompt_hash === promptHash &&
    existing.data.version === EDITORIAL_VERSION
  ) {
    return new Response(JSON.stringify({ cached: true, meditation: existing.data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2. Gerar com Lovable AI
  const gateway = createLovableAiGatewayProvider(lovableKey);
  const model = gateway(AI_MODEL);
  let output: Meditation;
  try {
    const result = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(body.iso_date, body.readings),
      output: Output.object({ schema: meditationSchema }),
    });
    output = result.output as Meditation;
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) {
      console.error("liturgy-meditation: schema mismatch", err.text?.slice(0, 500));
    } else {
      console.error("liturgy-meditation: generation failed", err);
    }
    const msg = (err as { message?: string })?.message ?? "unknown";
    const status = /rate limit|429/i.test(msg)
      ? 429
      : /402|credit/i.test(msg)
      ? 402
      : 503;
    return new Response(
      JSON.stringify({ error: "AI generation failed", detail: msg }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // 3. UPSERT (grava também auditoria: version, prompt_hash, provider, model)
  const payload = {
    iso_date: body.iso_date,
    readings_hash: readingsHash,
    prompt_hash: promptHash,
    version: EDITORIAL_VERSION,
    theme: output.theme,
    reading_key: output.reading_key,
    fathers: output.fathers,
    catechism: output.catechism,
    magisterium: output.magisterium,
    logos: output.logos,
    final_prayer: output.final_prayer,
    church_history: output.church_history,
    action_of_day: output.action_of_day,
    model: AI_MODEL,
    provider: AI_PROVIDER,
    generated_at: new Date().toISOString(),
  };
  const upsert = await admin
    .from("liturgy_meditations")
    .upsert(payload, { onConflict: "iso_date" })
    .select("*")
    .single();

  if (upsert.error) {
    console.error("liturgy-meditation: upsert failed", upsert.error);
    // Retorna o payload gerado mesmo se falhar a persistência.
    return new Response(JSON.stringify({ cached: false, meditation: payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ cached: false, meditation: upsert.data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
