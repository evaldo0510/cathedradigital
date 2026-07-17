// Validates sitemap.xml and robots.txt served at the project's public base URL.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const DEFAULT_BASE = "https://www.cathedradigital.com.br";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const baseUrl: string = body.baseUrl || DEFAULT_BASE;

    const sitemapUrl = new URL("/sitemap.xml", baseUrl).toString();
    const robotsUrl = new URL("/robots.txt", baseUrl).toString();

    const [sitemapRes, robotsRes] = await Promise.all([fetch(sitemapUrl), fetch(robotsUrl)]);
    const sitemapXml = await sitemapRes.text();
    const robotsTxt = await robotsRes.text();

    const urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
    const uniqueUrls = [...new Set(urls)];
    const duplicates = urls.length - uniqueUrls.length;
    const invalidXml = !/<urlset\b[^>]*>/i.test(sitemapXml);

    const robotsLines = robotsTxt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const disallowAll = robotsLines.some(l => /^disallow:\s*\/\s*$/i.test(l));
    const sitemapDirective = robotsLines.find(l => /^sitemap:/i.test(l))?.replace(/^sitemap:\s*/i, "") || null;

    // Reachability sample (first 8 URLs, HEAD)
    const sample = uniqueUrls.slice(0, 8);
    const reachability = await Promise.all(sample.map(async (u) => {
      try {
        const r = await fetch(u, { method: "HEAD" });
        return { url: u, status: r.status };
      } catch (e) { return { url: u, status: 0, error: e instanceof Error ? e.message : String(e) }; }
    }));
    const broken = reachability.filter(r => r.status >= 400 || r.status === 0);

    return new Response(JSON.stringify({
      ok: true,
      sitemap: {
        url: sitemapUrl,
        http_status: sitemapRes.status,
        url_count: uniqueUrls.length,
        duplicate_count: duplicates,
        invalid_xml: invalidXml,
        sample_reachability: reachability,
        broken_sample: broken,
      },
      robots: {
        url: robotsUrl,
        http_status: robotsRes.status,
        line_count: robotsLines.length,
        disallow_all: disallowAll,
        sitemap_directive: sitemapDirective,
      },
      checked_at: new Date().toISOString(),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("seo-validate-assets failed", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
