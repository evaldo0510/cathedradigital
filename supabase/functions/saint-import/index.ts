// saint-import — pipeline de ingestão e enriquecimento de Santos.
//
// Fonte: Wikipedia PT (REST + MediaWiki API) como base, com Wikimedia Commons
// para imagem/atribuição. Vatican.va é opcional (v2) — a v1 já cobre 5 santos-piloto.
//
// Regras:
//  - Nunca sobrescreve `protected_fields` (definidos por linha em saints.protected_fields).
//  - Só preenche campo se estiver NULL/vazio, EXCETO quando `mode = "force"`.
//  - Registra tudo em `saint_import_logs`.
//  - `source_metadata` guarda provedor, data, confidence, campos preenchidos, URL fonte.
//
// Auth: exige JWT de usuário com role 'admin' (via user_roles).
//
// Uso:
//   POST /functions/v1/saint-import
//   { saintId: "sao-francisco-de-assis", mode: "fill" | "force", dryRun?: boolean }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type ImportMode = "fill" | "force";

interface WikiSummary {
  title: string;
  description?: string;
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
  originalimage?: { source?: string };
  thumbnail?: { source?: string };
}

interface NormalizedSaint {
  name?: string;
  alternate_names?: string[];
  bio?: string;
  full_bio?: string;
  historical_context?: string;
  born?: string;
  died?: string;
  birthplace?: string;
  country?: string;
  religious_order?: string;
  image?: string;
  image_source_url?: string;
  image_license?: string;
  image_attribution?: string;
}

interface AliasCandidate {
  alias: string;
  language: string;
  type: "birth_name" | "translation" | "popular" | "latin" | "alt" | "honorific";
  source: "manual" | "wikipedia" | "vatican" | "import";
}

interface ImportOutcome {
  provider: string;
  confidence: number;
  data: NormalizedSaint;
  sourceUrl: string;
  aliases: AliasCandidate[];
}

// ─────────────────────────────────────────────────────────────
// Providers
// ─────────────────────────────────────────────────────────────
const WIKI_UA = "CathedraDigital/1.0 (https://cathedradigital.com.br; contato@cathedradigital.com.br)";

async function fetchWikipediaPT(name: string): Promise<ImportOutcome | null> {
  const title = encodeURIComponent(name.replace(/\s+/g, "_"));
  const summaryUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${title}`;
  const res = await fetch(summaryUrl, { headers: { "User-Agent": WIKI_UA, Accept: "application/json" } });
  if (!res.ok) return null;
  const s = (await res.json()) as WikiSummary;
  if (!s?.extract) return null;

  const sourceUrl = s.content_urls?.desktop?.page ?? `https://pt.wikipedia.org/wiki/${title}`;
  const image = s.originalimage?.source ?? s.thumbnail?.source;

  const data: NormalizedSaint = {
    name: s.title,
    bio: s.description ?? undefined,
    full_bio: s.extract,
    image,
    image_source_url: image ? sourceUrl : undefined,
    image_license: image ? "CC BY-SA (Wikimedia — verificar arquivo)" : undefined,
    image_attribution: image ? `Wikipedia PT — ${s.title}` : undefined,
  };

  const aliases: AliasCandidate[] = [
    { alias: s.title, language: "pt", type: "alt", source: "wikipedia" },
  ];

  // Enriquecimento via infobox + langlinks + imageinfo numa única chamada agregada.
  // Usa o título resolvido pelo summary (s.title) + redirects=1 para lidar com
  // "São Francisco de Assis" → "Francisco de Assis", "Teresinha" → "Teresa de Lisieux", etc.
  try {
    const resolvedTitle = encodeURIComponent((s.title ?? name).replace(/\s+/g, "_"));
    const infoUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=revisions|langlinks|pageimages&rvprop=content&rvsection=0&lllimit=50&piprop=name&redirects=1&titles=${resolvedTitle}&format=json&formatversion=2&origin=*`;
    const infoRes = await fetch(infoUrl, { headers: { "User-Agent": WIKI_UA } });
    if (!infoRes.ok) {
      console.warn(`saint-import: wiki enrich HTTP ${infoRes.status} for ${s.title}`);
    } else {
      const infoJson = await infoRes.json();
      const page = infoJson?.query?.pages?.[0];
      if (!page) console.warn(`saint-import: no page in enrich response for ${s.title}`);
      const wikitext: string = page?.revisions?.[0]?.content ?? "";
      Object.assign(data, extractFromWikitext(wikitext));

      const langlinks: Array<{ lang: string; title: string }> = page?.langlinks ?? [];
      const wanted = new Set(["es", "en", "la", "it", "fr", "de"]);
      for (const ll of langlinks) {
        if (!wanted.has(ll.lang) || !ll.title) continue;
        aliases.push({
          alias: ll.title,
          language: ll.lang,
          type: ll.lang === "la" ? "latin" : "translation",
          source: "wikipedia",
        });
      }
      console.log(`saint-import: ${s.title} langlinks=${langlinks.length} pageimage=${page?.pageimage ?? "none"} wt=${wikitext.length}`);

      // Licença real via Commons imageinfo
      const pageimage: string | undefined = page?.pageimage;
      if (pageimage) {
        const commons = await fetchCommonsImageInfo(pageimage);
        if (commons) {
          if (commons.url) data.image = commons.url;
          data.image_source_url = commons.descriptionurl ?? data.image_source_url;
          if (commons.license) data.image_license = commons.license;
          if (commons.attribution) data.image_attribution = commons.attribution;
        } else {
          console.warn(`saint-import: commons imageinfo empty for ${pageimage}`);
        }
      }
    }
  } catch (e) {
    console.warn(`saint-import: enrich failed for ${s.title}:`, String(e));
  }



  return { provider: "wikipedia-pt", confidence: 80, data, sourceUrl, aliases };
}

interface CommonsImage {
  url?: string;
  descriptionurl?: string;
  license?: string;
  attribution?: string;
}

async function fetchCommonsImageInfo(fileName: string): Promise<CommonsImage | null> {
  const file = `File:${fileName}`.replace(/\s+/g, "_");
  const url = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|extmetadata&iiextmetadatafilter=LicenseShortName|Artist|AttributionRequired&titles=${encodeURIComponent(file)}&format=json&formatversion=2&origin=*`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": WIKI_UA } });
    if (!res.ok) return null;
    const j = await res.json();
    const ii = j?.query?.pages?.[0]?.imageinfo?.[0];
    if (!ii) return null;
    const meta = ii.extmetadata ?? {};
    const license = meta.LicenseShortName?.value as string | undefined;
    const artistHtml = meta.Artist?.value as string | undefined;
    const artist = artistHtml?.replace(/<[^>]+>/g, "").trim();
    return {
      url: ii.url,
      descriptionurl: ii.descriptionurl,
      license,
      attribution: artist ? `${artist} (via Wikimedia Commons)` : undefined,
    };
  } catch (_) {
    return null;
  }
}


function extractFromWikitext(wt: string): Partial<NormalizedSaint> {
  if (!wt) return {};

  // Limpa templates comuns de data preservando o texto interno relevante.
  //  {{dtln|1181|9|26}} -> "1181-09-26"
  //  {{Data de nascimento|1181|9|26|...}} -> "1181-09-26"
  //  {{Nowrap|...}} / {{lang|xx|...}} -> conteúdo interno
  const cleanTemplates = (raw: string): string => {
    let s = raw;
    s = s.replace(/\{\{\s*(?:dtln|dnbr|dmbr|Data de (?:nascimento|morte|falecimento)|nascimento(?:\s+e\s+idade)?|morte(?:\s+e\s+idade)?)\s*\|([^}]+)\}\}/gi, (_m, args) => {
      const parts = String(args).split("|").map((p: string) => p.trim()).filter(Boolean);
      const nums = parts.filter((p: string) => /^\d+$/.test(p));
      if (nums.length >= 3) {
        const [y, mo, d] = nums;
        return `${y.padStart(4, "0")}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }
      if (nums.length === 1) return nums[0];
      return parts.join(" ");
    });
    s = s.replace(/\{\{\s*(?:nowrap|lang|langx|small|nobr)\s*\|([^}]+)\}\}/gi, (_m, args) => {
      const parts = String(args).split("|");
      return parts[parts.length - 1].trim();
    });
    // Remove templates residuais simples
    s = s.replace(/\{\{[^{}]*\}\}/g, " ");
    return s;
  };

  const grab = (key: string): string | undefined => {
    // Consome wikilinks e templates como uma unidade para não quebrar em `|`
    const re = new RegExp(`\\|\\s*${key}\\s*=\\s*((?:\\[\\[[^\\]]*\\]\\]|\\{\\{[^}]*\\}\\}|[^\\n|])+)`, "i");
    const m = wt.match(re);
    if (!m) return undefined;
    let v = cleanTemplates(m[1]);
    v = v.replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, "$2").replace(/<[^>]+>/g, "").replace(/'{2,}/g, "").trim();
    v = v.replace(/\s{2,}/g, " ");
    return v || undefined;
  };


  const grabAny = (...keys: string[]) => {
    for (const k of keys) {
      const v = grab(k);
      if (v) return v;
    }
    return undefined;
  };

  const out: Partial<NormalizedSaint> = {};
  const born = grabAny("nascimento_data", "data_nascimento", "nascimento", "data de nascimento");
  const died = grabAny("morte_data", "data_morte", "data_falecimento", "morte", "data de morte", "falecimento");
  const birthplace = grabAny(
    "nascimento_local",
    "local_nascimento",
    "local de nascimento",
    "nascimento local",
    "naturalidade",
  );
  const country = grabAny("nacionalidade", "país", "pais");
  const order = grabAny("ordem", "ordem_religiosa", "ordem religiosa", "congregação", "congregacao");
  if (born) out.born = born;
  if (died) out.died = died;
  if (birthplace) out.birthplace = birthplace;
  if (country) out.country = country;
  if (order) out.religious_order = order;
  return out;
}


// v2: Vatican.va scrape opcional — placeholder por ora
async function fetchVatican(_name: string): Promise<ImportOutcome | null> {
  return null;
}

async function importFromProviders(name: string): Promise<ImportOutcome[]> {
  const results = await Promise.all([fetchWikipediaPT(name), fetchVatican(name)]);
  return results.filter((r): r is ImportOutcome => r !== null);
}

// ─────────────────────────────────────────────────────────────
// Merge respecting protected fields
// ─────────────────────────────────────────────────────────────
type SaintRow = Record<string, unknown>;

const FIELD_MAP: Record<keyof NormalizedSaint, string> = {
  name: "name",
  alternate_names: "alternate_names",
  bio: "bio",
  full_bio: "full_bio",
  historical_context: "historical_context",
  born: "born",
  died: "died",
  birthplace: "birthplace",
  country: "country",
  religious_order: "religious_order",
  image: "image",
  image_source_url: "image_source_url",
  image_license: "image_license",
  image_attribution: "image_attribution",
};

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "") ||
    (Array.isArray(v) && v.length === 0);
}

function mergeSaint(current: SaintRow, incoming: NormalizedSaint, mode: ImportMode, protectedFields: string[]) {
  const updates: SaintRow = {};
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const [srcKey, dbCol] of Object.entries(FIELD_MAP) as [keyof NormalizedSaint, string][]) {
    const value = incoming[srcKey];
    if (isEmpty(value)) continue;
    if (protectedFields.includes(dbCol)) {
      skipped.push(`${dbCol}(protected)`);
      continue;
    }
    if (mode === "fill" && !isEmpty(current[dbCol])) {
      skipped.push(`${dbCol}(exists)`);
      continue;
    }
    updates[dbCol] = value;
    applied.push(dbCol);
  }

  return { updates, applied, skipped };
}

function computeEditorialScore(row: SaintRow): number {
  // 10 sinais editoriais — 10 pts cada
  const signals: Array<() => boolean> = [
    () => !isEmpty(row.image),
    () => !isEmpty(row.bio),
    () => !isEmpty(row.full_bio) && String(row.full_bio).length > 400,
    () => !isEmpty(row.born) || !isEmpty(row.died),
    () => !isEmpty(row.country) || !isEmpty(row.birthplace),
    () => Array.isArray(row.virtues) && (row.virtues as unknown[]).length > 0,
    () => Array.isArray(row.timeline) && (row.timeline as unknown[]).length > 0,
    () => Array.isArray(row.quotes_rich) && (row.quotes_rich as unknown[]).length > 0,
    () => Array.isArray(row.sources) && (row.sources as unknown[]).length > 0,
    () => row.ai_reflection !== null && row.ai_reflection !== undefined,
  ];
  return signals.reduce((acc, fn) => acc + (fn() ? 10 : 0), 0);
}

// ─────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return json({ error: "unauthorized", details: "missing bearer token" }, 401);

    // AuthN
    const anon: SupabaseClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await anon.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return json({ error: "unauthorized", details: userErr?.message ?? "invalid token" }, 401);
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // AuthZ (admin)
    const { data: roleRow, error: roleErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr) return json({ error: "role_check_failed", details: roleErr.message }, 500);
    if (!roleRow) return json({ error: "forbidden", details: "requires admin role" }, 403);

    // Input
    const body = await req.json().catch(() => null) as
      | { saintId?: string; mode?: ImportMode; dryRun?: boolean }
      | null;
    const saintId = body?.saintId?.trim();
    const mode: ImportMode = body?.mode === "force" ? "force" : "fill";
    const dryRun = !!body?.dryRun;
    if (!saintId) return json({ error: "bad_request", details: "saintId required" }, 400);

    // Carrega santo
    const { data: saint, error: sErr } = await admin
      .from("saints")
      .select("*")
      .eq("id", saintId)
      .maybeSingle();
    if (sErr) return json({ error: "load_failed", details: sErr.message }, 500);
    if (!saint) return json({ error: "not_found", details: `saint ${saintId} not found` }, 404);

    const protectedFields: string[] = Array.isArray(saint.protected_fields)
      ? saint.protected_fields as string[]
      : [];

    // Chama provedores
    const outcomes = await importFromProviders(saint.name as string);
    if (outcomes.length === 0) {
      await admin.from("saint_import_logs").insert({
        saint_id: saintId,
        provider: "none",
        status: "skipped",
        message: "no provider returned data",
      });
      return json({ ok: false, status: "skipped", message: "no data from providers" });
    }

    // Merge por provedor (Wikipedia primeiro; Vatican poderia sobrescrever com maior confidence)
    outcomes.sort((a, b) => a.confidence - b.confidence);

    const aggUpdates: SaintRow = {};
    const aggApplied = new Set<string>();
    const aggSkipped = new Set<string>();
    const perProviderFields: Record<string, string[]> = {};

    let baseRow: SaintRow = { ...saint };
    for (const outcome of outcomes) {
      const { updates, applied, skipped } = mergeSaint(baseRow, outcome.data, mode, protectedFields);
      Object.assign(aggUpdates, updates);
      applied.forEach((f) => aggApplied.add(f));
      skipped.forEach((f) => aggSkipped.add(f));
      perProviderFields[outcome.provider] = applied;
      baseRow = { ...baseRow, ...updates };
    }

    const bestConfidence = Math.max(...outcomes.map((o) => o.confidence));
    const sourceMetadata = {
      providers: outcomes.map((o) => ({ provider: o.provider, source_url: o.sourceUrl, confidence: o.confidence })),
      imported_at: new Date().toISOString(),
      mode,
      fields: perProviderFields,
    };

    // Preview auditável de aliases (mesma deduplicação do fluxo de persistência)
    const aliasCandidates = outcomes.flatMap((o) =>
      o.aliases.map((a) => ({ ...a, _providerSource: `${o.provider}_langlinks` })),
    );
    const seenPreview = new Set<string>();
    const aliases_preview = aliasCandidates
      .filter((a) => a.alias && a.alias.trim() && a.alias.trim().toLowerCase() !== String(saint.name).trim().toLowerCase())
      .filter((a) => {
        const k = `${a.language}::${a.alias.trim().toLowerCase()}`;
        if (seenPreview.has(k)) return false;
        seenPreview.add(k);
        return true;
      })
      .map((a) => ({ alias: a.alias.trim(), language: a.language, type: a.type, source: a._providerSource }));


    const editorial_score = computeEditorialScore(baseRow);

    if (Object.keys(aggUpdates).length === 0) {
      await admin.from("saint_import_logs").insert({
        saint_id: saintId,
        provider: outcomes.map((o) => o.provider).join(","),
        status: "skipped",
        fields_skipped: Array.from(aggSkipped),
        confidence: bestConfidence,
        message: "nothing to update (all fields protected or filled)",
        payload: sourceMetadata,
      });
      return json({
        ok: true,
        status: "skipped",
        applied: [],
        skipped: Array.from(aggSkipped),
        aliases_preview,
        editorial_score,
      });
    }

    if (dryRun) {
      return json({
        ok: true,
        status: "dry-run",
        applied: Array.from(aggApplied),
        skipped: Array.from(aggSkipped),
        updates: aggUpdates,
        aliases_preview,
        source_metadata: sourceMetadata,
        editorial_score,
      });
    }


    const { error: upErr } = await admin
      .from("saints")
      .update({
        ...aggUpdates,
        source_metadata: sourceMetadata,
        editorial_score,
        last_scraped_at: new Date().toISOString(),
      })
      .eq("id", saintId);

    if (upErr) {
      await admin.from("saint_import_logs").insert({
        saint_id: saintId,
        provider: outcomes.map((o) => o.provider).join(","),
        status: "error",
        message: upErr.message,
        payload: sourceMetadata,
      });
      return json({ error: "update_failed", details: upErr.message }, 500);
    }

    // Upsert aliases (idempotente via UNIQUE saint_id+alias_norm+language)
    const seen = new Set<string>();
    const aliasRows = aliasCandidates
      .filter((a) => a.alias && a.alias.trim() && a.alias.trim().toLowerCase() !== String(saint.name).trim().toLowerCase())
      .filter((a) => {
        const k = `${a.language}::${a.alias.trim().toLowerCase()}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .map((a) => ({ saint_id: saintId, alias: a.alias.trim(), language: a.language, type: a.type, source: a.source }));


    let aliases_inserted = 0;
    if (aliasRows.length > 0) {
      const { error: aErr, count } = await admin
        .from("saint_aliases")
        .upsert(aliasRows, { onConflict: "saint_id,alias_norm,language", ignoreDuplicates: true, count: "exact" });
      if (aErr) console.warn(`saint-import: alias upsert failed for ${saintId}:`, aErr.message);
      else aliases_inserted = count ?? aliasRows.length;
    }

    await admin.from("saint_import_logs").insert({
      saint_id: saintId,
      provider: outcomes.map((o) => o.provider).join(","),
      status: "success",
      fields_updated: Array.from(aggApplied),
      fields_skipped: Array.from(aggSkipped),
      confidence: bestConfidence,
      payload: { ...sourceMetadata, aliases_inserted },
    });

    return json({
      ok: true,
      status: "success",
      applied: Array.from(aggApplied),
      skipped: Array.from(aggSkipped),
      aliases_inserted,
      editorial_score,
      confidence: bestConfidence,
    });
  } catch (e) {
    console.error("saint-import fatal:", e);
    return json({ error: "internal", details: String(e) }, 500);
  }
});
