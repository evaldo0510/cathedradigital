// Runs a lightweight SEO audit against a list of URLs and stores results in seo_audits.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const DEFAULT_BASE = "https://www.cathedradigital.com.br";
const DEFAULT_PATHS = ["/", "/catechism", "/buscar", "/biblia", "/jornadas", "/santos"];

interface Finding { type: string; severity: "low" | "medium" | "high"; message: string }

function extract(html: string) {
  const pick = (re: RegExp) => (html.match(re)?.[1] ?? "").trim();
  const title = pick(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const canonical = pick(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  const ogTitle = pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const ogImage = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const twitterCard = pick(/<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']+)["']/i);
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, "").trim());
  const h2Count = (html.match(/<h2\b/gi) || []).length;
  return { title, description, canonical, ogTitle, ogImage, twitterCard, h1s, h2Count };
}

function analyze(url: string, data: ReturnType<typeof extract>) {
  const findings: Finding[] = [];
  if (!data.title) findings.push({ type: "missing_title", severity: "high", message: "Sem <title>" });
  else if (data.title.length < 20 || data.title.length > 65) findings.push({ type: "title_length", severity: "medium", message: `Título com ${data.title.length} chars (ideal 20–65)` });
  if (!data.description) findings.push({ type: "missing_description", severity: "high", message: "Sem meta description" });
  else if (data.description.length < 50 || data.description.length > 165) findings.push({ type: "desc_length", severity: "medium", message: `Description com ${data.description.length} chars (ideal 50–165)` });
  if (!data.canonical) findings.push({ type: "missing_canonical", severity: "medium", message: "Sem canonical" });
  if (!data.ogTitle) findings.push({ type: "missing_og", severity: "medium", message: "Sem og:title" });
  if (!data.twitterCard) findings.push({ type: "missing_twitter", severity: "low", message: "Sem twitter:card" });
  if (data.h1s.length === 0) findings.push({ type: "missing_h1", severity: "high", message: "Sem H1" });
  else if (data.h1s.length > 1) findings.push({ type: "multiple_h1", severity: "medium", message: `${data.h1s.length} H1s (esperado 1)` });
  const weight = { high: 25, medium: 10, low: 3 };
  const score = Math.max(0, 100 - findings.reduce((s, f) => s + weight[f.severity], 0));
  return { findings, score };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));
    const baseUrl: string = body.baseUrl || DEFAULT_BASE;
    const paths: string[] = Array.isArray(body.paths) && body.paths.length ? body.paths : DEFAULT_PATHS;
    const results = [];
    for (const p of paths) {
      const url = new URL(p, baseUrl).toString();
      try {
        const res = await fetch(url, { headers: { "User-Agent": "CathedraSEOAudit/1.0" } });
        const html = await res.text();
        const data = extract(html);
        const { findings, score } = analyze(url, data);
        const { data: inserted, error } = await supabase.from("seo_audits").insert({
          url,
          score,
          findings,
          meta_tags: { title: data.title, description: data.description, canonical: data.canonical, ogTitle: data.ogTitle, ogImage: data.ogImage, twitterCard: data.twitterCard, http_status: res.status },
          headings: { h1: data.h1s, h2_count: data.h2Count },
          links: [],
        }).select().single();
        if (error) throw error;
        results.push({ url, score, findings: findings.length, id: inserted.id });
      } catch (err) {
        results.push({ url, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return new Response(JSON.stringify({ ok: true, audited: results.length, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("seo-audit-run failed", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
