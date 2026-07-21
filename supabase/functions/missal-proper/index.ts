/**
 * missal-proper — Próprio da Missa (Prayer Engine v2, Onda B pattern).
 *
 * Recebe as leituras do dia + iso_date; devolve o Próprio litúrgico:
 * Antífona de Entrada, Coleta, Oração sobre as Oferendas, Prefácio
 * sugerido, Antífona de Comunhão, Oração após a Comunhão e nota do
 * tempo litúrgico.
 *
 * Idempotente por iso_date. Cache hit exige match de readings_hash +
 * prompt_hash + version. Persiste em `missal_propers` para reuso.
 */
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { generateText, NoObjectGeneratedError, Output } from "npm:ai";
import { z } from "npm:zod";

// ── Schema editorial (constraint-free) ──────────────────────────────
const properSchema = z.object({
  celebration_title: z.string(),
  liturgical_color: z.string(),
  entrance_antiphon: z.string(),
  collect: z.string(),
  offertory_prayer: z.string(),
  preface_suggestion: z.string(),
  communion_antiphon: z.string(),
  prayer_after_communion: z.string(),
  season_note: z.string(),
});

type Proper = z.infer<typeof properSchema>;

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

// ── Versionamento editorial ─────────────────────────────────────────
const EDITORIAL_VERSION = 1;
const AI_PROVIDER = "lovable-ai-gateway";
const AI_MODEL = "google/gemini-2.5-flash";

const SYSTEM_PROMPT = `Você é um redator litúrgico católico romano, especialista no Missal Romano
(3ª edição típica), escrevendo em português do Brasil para o Cathedra.

Regras invioláveis:
- Fidelidade doutrinária absoluta ao Magistério e à tradição litúrgica romana.
- Nunca invente prefácios ou fórmulas litúrgicas fora do repertório do Missal.
- As orações do Próprio devem estar em português litúrgico atual (evitar arcaísmos).
- Antífonas: usem a fonte bíblica que corresponde ao dia (não invente citações).
- Coleta, Oração sobre as Oferendas e Oração após a Comunhão: cada uma em uma única
  oração composta segundo a estrutura clássica (dirigida ao Pai, invocando o Filho,
  no Espírito Santo, com conclusão trinitária breve).
- "preface_suggestion": nome do prefácio adequado (ex.: "Prefácio do Advento I",
  "Prefácio Pascal II", "Prefácio Comum V"). Nunca escrever o texto do prefácio.
- "liturgical_color": uma das cores litúrgicas oficiais em português (branco, verde,
  vermelho, roxo, rosa, preto, dourado).
- "season_note": frase curta explicando o contexto do tempo/celebração.
- Tom sereno, hierático, sem clichês. Nunca "hoje somos convidados a".
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
    "Produza o Próprio da Missa para este dia (Antífona de Entrada, Coleta, " +
    "Oração sobre as Oferendas, sugestão de Prefácio, Antífona de Comunhão, " +
    "Oração após a Comunhão e nota do tempo). Fidelidade litúrgica absoluta. " +
    "Cada oração deve dialogar com o Evangelho e o tempo. Português (Brasil).",
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

  // Cache hit — exige match de readings_hash + prompt_hash + version.
  const existing = await admin
    .from("missal_propers")
    .select("*")
    .eq("iso_date", body.iso_date)
    .maybeSingle();

  if (
    existing.data &&
    existing.data.readings_hash === readingsHash &&
    existing.data.prompt_hash === promptHash &&
    existing.data.version === EDITORIAL_VERSION
  ) {
    return new Response(JSON.stringify({ cached: true, proper: existing.data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Gerar com Lovable AI.
  const gateway = createLovableAiGatewayProvider(lovableKey);
  const model = gateway(AI_MODEL);
  let output: Proper;
  try {
    const result = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(body.iso_date, body.readings),
      output: Output.object({ schema: properSchema }),
    });
    output = result.output as Proper;
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) {
      console.error("missal-proper: schema mismatch", err.text?.slice(0, 500));
    } else {
      console.error("missal-proper: generation failed", err);
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

  const payload = {
    iso_date: body.iso_date,
    readings_hash: readingsHash,
    prompt_hash: promptHash,
    version: EDITORIAL_VERSION,
    celebration_title: output.celebration_title,
    liturgical_color: output.liturgical_color,
    entrance_antiphon: output.entrance_antiphon,
    collect: output.collect,
    offertory_prayer: output.offertory_prayer,
    preface_suggestion: output.preface_suggestion,
    communion_antiphon: output.communion_antiphon,
    prayer_after_communion: output.prayer_after_communion,
    season_note: output.season_note,
    model: AI_MODEL,
    provider: AI_PROVIDER,
    generated_at: new Date().toISOString(),
  };
  const upsert = await admin
    .from("missal_propers")
    .upsert(payload, { onConflict: "iso_date" })
    .select("*")
    .single();

  if (upsert.error) {
    console.error("missal-proper: upsert failed", upsert.error);
    return new Response(JSON.stringify({ cached: false, proper: payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ cached: false, proper: upsert.data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
