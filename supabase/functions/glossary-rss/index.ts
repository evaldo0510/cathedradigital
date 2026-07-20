import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://www.cathedradigital.com.br";
const FEED_URL = `${BASE_URL}/glossario/feed.xml`;

function escapeXml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const url = new URL(req.url);
    const format = (url.searchParams.get("format") ?? "rss").toLowerCase();

    const { data, error } = await supabase
      .from("glossary")
      .select("slug, term, short_definition, definition, category, updated_at, editorial_completeness")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const items = (data ?? []).filter((r: any) => r.slug);
    const lastBuild = items[0]?.updated_at
      ? new Date(items[0].updated_at).toUTCString()
      : new Date().toUTCString();

    if (format === "atom") {
      const entries = items.map((r: any) => {
        const link = `${BASE_URL}/glossario/${r.slug}`;
        const summary = r.short_definition ?? (r.definition ?? "").slice(0, 280);
        return `  <entry>
    <title>${escapeXml(r.term)}</title>
    <link href="${escapeXml(link)}"/>
    <id>${escapeXml(link)}</id>
    <updated>${new Date(r.updated_at).toISOString()}</updated>
    ${r.category ? `<category term="${escapeXml(r.category)}"/>` : ""}
    <summary type="html">${escapeXml(summary)}</summary>
  </entry>`;
      }).join("\n");

      const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Cathedra · Léxico Teológico</title>
  <link href="${FEED_URL}" rel="self"/>
  <link href="${BASE_URL}/glossario"/>
  <id>${FEED_URL}</id>
  <updated>${new Date(lastBuild).toISOString()}</updated>
  <subtitle>Atualizações e novos verbetes do Léxico Teológico Cathedra.</subtitle>
${entries}
</feed>`;
      return new Response(atom, {
        headers: { ...corsHeaders, "Content-Type": "application/atom+xml; charset=utf-8", "Cache-Control": "public, max-age=1800" },
      });
    }

    const rssItems = items.map((r: any) => {
      const link = `${BASE_URL}/glossario/${r.slug}`;
      const desc = r.short_definition ?? (r.definition ?? "").slice(0, 280);
      return `    <item>
      <title>${escapeXml(r.term)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${new Date(r.updated_at).toUTCString()}</pubDate>
      ${r.category ? `<category>${escapeXml(r.category)}</category>` : ""}
      <description>${escapeXml(desc)}</description>
    </item>`;
    }).join("\n");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Cathedra · Léxico Teológico</title>
    <link>${BASE_URL}/glossario</link>
    <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml"/>
    <description>Atualizações e novos verbetes do Léxico Teológico Cathedra.</description>
    <language>pt-br</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${rssItems}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: { ...corsHeaders, "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=1800" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: "internal_error", message: error?.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
