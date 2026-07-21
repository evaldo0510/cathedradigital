import fs from 'fs';
import path from 'path';
import { extractRoutesFromTypesAST, getPublicRoutes, getPrivateRoutes } from './utils';
import { resolveRouteMeta } from '../src/config/routeMeta';


/**
 * Script to generate sitemap.xml and robots.txt dynamically from AppRoute enum in src/types.ts using AST.
 * Only public routes are included in sitemap.
 * Robots.txt Disallow list is derived from private routes.
 */

const BASE_URL = 'https://www.cathedradigital.com.br';
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? 'https://gpwrpmoniglarqwfyryp.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';

async function fetchGlossarySlugs(): Promise<Array<{ slug: string; updated_at: string }>> {
  if (!SUPABASE_ANON) {
    console.warn('⚠️  SUPABASE_PUBLISHABLE_KEY ausente — glossário não será adicionado ao sitemap.');
    return [];
  }
  try {
    const url = `${SUPABASE_URL}/rest/v1/glossary?select=slug,updated_at&status=eq.published&slug=not.is.null`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    });
    if (!res.ok) {
      console.warn(`⚠️  glossary REST ${res.status} — pulando slugs.`);
      return [];
    }
    return (await res.json()) as Array<{ slug: string; updated_at: string }>;
  } catch (e) {
    console.warn('⚠️  Falha ao buscar glossário:', e);
    return [];
  }
}

async function generateSitemap() {
  const allRoutes = extractRoutesFromTypesAST();
  const publicRoutes = getPublicRoutes(allRoutes);
  const privateRoutes = getPrivateRoutes(allRoutes);
  const lastmod = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  publicRoutes.forEach(route => {
    let priority = '0.8';
    let changefreq = 'daily';

    if (route === '/') {
      priority = '1.0';
    } else if (['/about', '/terms', '/privacy', '/transparencia', '/partners', '/diagnostico'].includes(route)) {
      priority = '0.5';
      changefreq = 'monthly';
    } else if (['/glossary', '/papas', '/guia-modulos'].includes(route)) {
      priority = '0.6';
      changefreq = 'weekly';
    }

    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}${route === '/' ? '' : route}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += '  </url>\n';
  });

  // Glossário — verbetes publicados dinamicamente
  const glossary = await fetchGlossarySlugs();
  glossary.forEach((g) => {
    const glossaryLastmod = (g.updated_at ?? '').split('T')[0] || lastmod;
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/glossario/${g.slug}</loc>\n`;
    xml += `    <lastmod>${glossaryLastmod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += '  </url>\n';
  });

  // Liturgia das Horas — 7 horas canônicas (canônicas sem data) + snapshot do dia
  const HOUR_SLUGS = ['oficio', 'laudes', 'tercia', 'sexta', 'noa', 'vesperas', 'completas'];
  HOUR_SLUGS.forEach((h) => {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/breviary?h=${h}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += '  </url>\n';
    // Snapshot da hora + data ISO (dia da geração) — permite indexar o Próprio do dia.
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/breviary?h=${h}&amp;d=${lastmod}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.6</priority>\n`;
    xml += '  </url>\n';
  });

  // Missal — Próprio e Ordinário do dia + snapshot com data ISO
  ['proprio', 'ordinario'].forEach((v) => {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/missal?view=${v}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += '  </url>\n';
  });
  xml += '  <url>\n';
  xml += `    <loc>${BASE_URL}/missal?view=proprio&amp;d=${lastmod}</loc>\n`;
  xml += `    <lastmod>${lastmod}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>0.6</priority>\n`;
  xml += '  </url>\n';

  xml += '</urlset>';

  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml);
  console.log(`✅ Sitemap generated with ${publicRoutes.length} rotas + ${glossary.length} verbetes + ${HOUR_SLUGS.length * 2} horas litúrgicas + 3 missal at ${sitemapPath}.`);

  // Generate robots.txt
  let robotsTxt = `User-agent: *\nAllow: /\n`;
  const disallowList = Array.from(new Set(privateRoutes)).sort();
  disallowList.forEach(route => {
    robotsTxt += `Disallow: ${route}\n`;
  });

  // Bloqueia scrapers de treinamento de IA (conteúdo editorial protegido).
  // Buscadores tradicionais (Googlebot, Bingbot) e crawlers de resposta com atribuição
  // (Google-Extended off, PerplexityBot, OAI-SearchBot) permanecem permitidos.
  const AI_TRAINING_BOTS = [
    'GPTBot',
    'ClaudeBot',
    'anthropic-ai',
    'CCBot',
    'Google-Extended',
    'Applebot-Extended',
    'Meta-ExternalAgent',
    'Bytespider',
    'Amazonbot',
  ];
  AI_TRAINING_BOTS.forEach((bot) => {
    robotsTxt += `\nUser-agent: ${bot}\nDisallow: /\n`;
  });

  robotsTxt += `\nSitemap: ${BASE_URL}/sitemap.xml\n`;

  const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
  fs.writeFileSync(robotsPath, robotsTxt);
  console.log(`✅ robots.txt generated with ${disallowList.length} disallowed routes at ${robotsPath}`);
}

generateSitemap();
