/**
 * liturgy-hours-office — Próprio da Liturgia das Horas por dia+hora
 * (Prayer Engine v2, mesmo padrão Onda B do `liturgy-meditation` /
 * `missal-proper`).
 *
 * Recebe iso_date + hour_slug (oficio | laudes | tercia | sexta | noa |
 * vesperas | completas) + leituras do dia. Devolve o Próprio da hora:
 * antífona de abertura, salmodia (2-3), leitura breve, responsório,
 * cântico evangélico quando aplicável, preces e oração conclusiva.
 *
 * Idempotente por (iso_date, hour_slug). Cache hit exige match de
 * readings_hash + prompt_hash + version. Persiste em
 * `liturgy_hours_offices`.
 */
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { generateText, NoObjectGeneratedError, Output } from "npm:ai";
import { z } from "npm:zod";

const HOUR_SLUGS = [
  "oficio",
  "laudes",
  "tercia",
  "sexta",
  "noa",
  "vesperas",
  "completas",
] as const;
type HourSlug = typeof HOUR_SLUGS[number];

const HOUR_LABELS: Record<HourSlug, { title: string; latin: string; time: string; canticle: string | null }> = {
  oficio:    { title: "Ofício das Leituras", latin: "Officium Lectionis", time: "Qualquer hora", canticle: null },
  laudes:    { title: "Laudes",               latin: "Laudes Matutinae",  time: "06:00",         canticle: "Benedictus (Lc 1,68-79)" },
  tercia:    { title: "Hora Tércia",          latin: "Tertia",            time: "09:00",         canticle: null },
  sexta:     { title: "Hora Sexta",           latin: "Sexta",             time: "12:00",         canticle: null },
  noa:       { title: "Hora Nona",            latin: "Nona",              time: "15:00",         canticle: null },
  vesperas:  { title: "Vésperas",             latin: "Vesperae",          time: "18:00",         canticle: "Magnificat (Lc 1,46-55)" },
  completas: { title: "Completas",            latin: "Completorium",      time: "21:00",         canticle: "Nunc Dimittis (Lc 2,29-32)" },
};

// ── Schema editorial (constraint-free) ──────────────────────────────
const officeSchema = z.object({
  antiphon_opening: z.string(),
  psalmody: z.array(z.object({
    antiphon: z.string(),
    reference: z.string(),
    text: z.string(),
  })),
  brief_reading_ref: z.string(),
  brief_reading_text: z.string(),
  responsory: z.string(),
  gospel_canticle: z.object({
    antiphon: z.string(),
    reference: z.string(),
    text: z.string(),
  }).nullable(),
  intercessions: z.array(z.string()),
  concluding_prayer: z.string(),
  season_note: z.string(),
});
type Office = z.infer<typeof officeSchema>;

interface RequestBody {
  iso_date: string;
  hour_slug: HourSlug;
  readings?: {
    liturgia?: string | null;
    dia?: string | null;
    season?: string | null;
    primeiraLeitura?: { referencia: string; texto: string } | null;
    salmo?: { referencia: string; refrao?: string; texto: string } | null;
    segundaLeitura?: { referencia: string; texto: string } | null;
    evangelho?: { referencia: string; texto: string } | null;
  };
}

// ── Versionamento editorial ─────────────────────────────────────────
const EDITORIAL_VERSION = 1;
const AI_PROVIDER = "lovable-ai-gateway";
const AI_MODEL = "google/gemini-2.5-flash";

const SYSTEM_PROMPT = `Você é um redator litúrgico católico romano, especialista na
Liturgia das Horas segundo o rito romano reformado (Instrução Geral sobre
a Liturgia das Horas, 1971), escrevendo em português litúrgico do Brasil
para o Cathedra.

Regras invioláveis:
- Fidelidade doutrinária absoluta ao Magistério e à tradição litúrgica.
- Nunca invente citações bíblicas: use somente referências reais do
  Saltério e do Novo Testamento adequadas à hora e ao tempo litúrgico.
- Salmodia: 2 ou 3 salmos/cânticos para Laudes, Vésperas e Ofício das
  Leituras; 1 salmo com 2-3 estrofes para as horas menores (Tércia,
  Sexta, Nona). Sempre com antífona própria antes de cada salmo.
- Antífonas: breves (1-2 linhas), extraídas ou inspiradas no salmo
  correspondente ou no Evangelho do dia.
- Leitura breve: passagem do Novo Testamento (2-4 versículos) coerente
  com o tempo litúrgico.
- Responsório: breve, no formato "V. ... R. ..." com aleluia no Tempo
  Pascal.
- Cântico evangélico:
    * Laudes → Benedictus com antífona ligada ao Evangelho do dia.
    * Vésperas → Magnificat idem.
    * Completas → Nunc Dimittis com antífona penitencial ou de proteção.
    * Ofício das Leituras e horas menores → gospel_canticle = null.
- Preces (intercessions): 4-6 petições curtas, com refrão implícito
  "Escutai-nos, Senhor".
- Oração conclusiva: uma única oração composta no estilo clássico
  romano (Pai → Filho → Espírito Santo), sem invenção de fórmulas.
- "season_note": frase curta com o tempo/celebração e a cor litúrgica.
- Tom sereno, contemplativo, sem clichês. Idioma: português do Brasil.`;

function buildUserPrompt(iso: string, hour: HourSlug, r: RequestBody["readings"]): string {
  const meta = HOUR_LABELS[hour];
  const parts: string[] = [];
  parts.push(`Data litúrgica: ${iso}`);
  parts.push(`Hora canônica: ${meta.title} (${meta.latin}) — horário sugerido: ${meta.time}`);
  if (meta.canticle) parts.push(`Cântico evangélico esperado: ${meta.canticle}`);
  else parts.push(`Cântico evangélico: não se aplica (retorne gospel_canticle = null).`);
  if (r?.dia) parts.push(`Dia: ${r.dia}`);
  if (r?.liturgia) parts.push(`Celebração: ${r.liturgia}`);
  if (r?.season) parts.push(`Tempo: ${r.season}`);
  parts.push("");
  if (r?.primeiraLeitura) {
    parts.push(`PRIMEIRA LEITURA (${r.primeiraLeitura.referencia}):`);
    parts.push(r.primeiraLeitura.texto);
    parts.push("");
  }
  if (r?.salmo) {
    parts.push(`SALMO RESPONSORIAL (${r.salmo.referencia}):`);
    if (r.salmo.refrao) parts.push(`Refrão: ${r.salmo.refrao}`);
    parts.push(r.salmo.texto);
    parts.push("");
  }
  if (r?.segundaLeitura) {
    parts.push(`SEGUNDA LEITURA (${r.segundaLeitura.referencia}):`);
    parts.push(r.segundaLeitura.texto);
    parts.push("");
  }
  if (r?.evangelho) {
    parts.push(`EVANGELHO (${r.evangelho.referencia}):`);
    parts.push(r.evangelho.texto);
    parts.push("");
  }
  parts.push(
    `Produza o Próprio desta Hora Canônica dialogando com o tempo litúrgico ` +
    `e com o Evangelho do dia. Cada antífona deve ser breve. A oração ` +
    `conclusiva deve ser própria da hora (matutina/vespertina/noturna) e ` +
    `harmonizar com a celebração. Português (Brasil).`,
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

function hashReadings(hour: HourSlug, r: RequestBody["readings"] | undefined): Promise<string> {
  const norm = JSON.stringify({
    h: hour,
    l: r?.liturgia ?? "",
    p1: r?.primeiraLeitura?.referencia ?? "",
    ps: r?.salmo?.referencia ?? "",
    p2: r?.segundaLeitura?.referencia ?? "",
    ev: r?.evangelho?.referencia ?? "",
  });
  return sha1(norm);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) {
    return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let body: RequestBody;
  try {
    body = await req.json() as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (!body?.iso_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.iso_date)) {
    return new Response(JSON.stringify({ error: "iso_date (YYYY-MM-DD) is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (!body?.hour_slug || !(HOUR_SLUGS as readonly string[]).includes(body.hour_slug)) {
    return new Response(JSON.stringify({ error: `hour_slug must be one of: ${HOUR_SLUGS.join(", ")}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const readingsHash = await hashReadings(body.hour_slug, body.readings);
  const promptHash = await sha1(SYSTEM_PROMPT);

  // Cache hit — exige match de readings_hash + prompt_hash + version.
  const existing = await admin
    .from("liturgy_hours_offices")
    .select("*")
    .eq("iso_date", body.iso_date)
    .eq("hour_slug", body.hour_slug)
    .maybeSingle();

  if (
    existing.data &&
    existing.data.readings_hash === readingsHash &&
    existing.data.prompt_hash === promptHash &&
    existing.data.version === EDITORIAL_VERSION
  ) {
    return new Response(JSON.stringify({ cached: true, office: existing.data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Gerar com Lovable AI.
  const gateway = createLovableAiGatewayProvider(lovableKey);
  const model = gateway(AI_MODEL);
  let output: Office;
  try {
    const result = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(body.iso_date, body.hour_slug, body.readings),
      output: Output.object({ schema: officeSchema }),
    });
    output = result.output as Office;
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) {
      console.error("liturgy-hours-office: schema mismatch", err.text?.slice(0, 500));
    } else {
      console.error("liturgy-hours-office: generation failed", err);
    }
    const msg = (err as { message?: string })?.message ?? "unknown";
    const status = /rate limit|429/i.test(msg) ? 429 : /402|credit/i.test(msg) ? 402 : 503;
    return new Response(JSON.stringify({ error: "AI generation failed", detail: msg }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const payload = {
    iso_date: body.iso_date,
    hour_slug: body.hour_slug,
    readings_hash: readingsHash,
    prompt_hash: promptHash,
    version: EDITORIAL_VERSION,
    antiphon_opening: output.antiphon_opening,
    psalmody: output.psalmody,
    brief_reading_ref: output.brief_reading_ref,
    brief_reading_text: output.brief_reading_text,
    responsory: output.responsory,
    gospel_canticle: output.gospel_canticle,
    intercessions: output.intercessions,
    concluding_prayer: output.concluding_prayer,
    season_note: output.season_note,
    model: AI_MODEL,
    provider: AI_PROVIDER,
    generated_at: new Date().toISOString(),
  };

  const upsert = await admin
    .from("liturgy_hours_offices")
    .upsert(payload, { onConflict: "iso_date,hour_slug" })
    .select("*")
    .single();

  if (upsert.error) {
    console.error("liturgy-hours-office: upsert failed", upsert.error);
    return new Response(JSON.stringify({ cached: false, office: payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ cached: false, office: upsert.data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
