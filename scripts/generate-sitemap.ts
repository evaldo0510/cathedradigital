import fs from 'fs';
import path from 'path';
import { extractRoutesFromTypesAST, getPublicRoutes, getPrivateRoutes } from './utils';
import { resolveRouteMeta, ROUTE_META } from '../src/config/routeMeta';


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

/**
 * P0.3.1 — Fetchers dinâmicos das 10 entidades editoriais.
 *
 * Estratégia: leitura anônima via PostgREST filtrada por publicabilidade.
 * Falhas são tolerantes (warn + array vazio) para não bloquear o build.
 */
async function fetchRest<T>(path: string, label: string): Promise<T[]> {
  if (!SUPABASE_ANON) {
    console.warn(`⚠️  SUPABASE_PUBLISHABLE_KEY ausente — ${label} não será adicionado ao sitemap.`);
    return [];
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    });
    if (!res.ok) {
      console.warn(`⚠️  ${label} REST ${res.status} — pulando.`);
      return [];
    }
    return (await res.json()) as T[];
  } catch (e) {
    console.warn(`⚠️  Falha ao buscar ${label}:`, e);
    return [];
  }
}

// Santos enriquecidos (content_status='complete'). Stubs ficam de fora — thin content.
const fetchSaints = () => fetchRest<{ id: string; updated_at: string }>(
  'saints?select=id,updated_at&content_status=eq.complete',
  'santos',
);

// Catecismo — parágrafos com conteúdo (dos 2865, apenas os importados).
const fetchCatechism = () => fetchRest<{ paragraph: number; created_at: string }>(
  'catechism_official?select=paragraph,created_at&content=not.is.null&order=paragraph.asc',
  'catecismo',
);

// Bíblia — capítulos realmente presentes (não emite chapters ainda não importados).
const fetchBibleChapters = () => fetchRest<{ number: number; book_id: string }>(
  'bible_chapters?select=number,book_id&order=book_id.asc,number.asc&limit=2000',
  'bible_chapters',
);
const fetchBibleBooks = () => fetchRest<{ id: string; abbrev: string }>(
  'bible_books?select=id,abbrev',
  'bible_books',
);

const fetchThemes = () => fetchRest<{ slug: string; updated_at: string }>(
  'themes?select=slug,updated_at&slug=not.is.null',
  'temas',
);
const fetchPrayers = () => fetchRest<{ slug: string; updated_at: string }>(
  'prayers?select=slug,updated_at&slug=not.is.null',
  'orações',
);
const fetchCollections = () => fetchRest<{ slug: string; updated_at: string }>(
  'collections?select=slug,updated_at&slug=not.is.null',
  'coleções',
);
const fetchJourneys = () => fetchRest<{ id: string; updated_at: string }>(
  'journeys?select=id,updated_at',
  'jornadas',
);

// Patrística — apenas obras publicadas + capítulos correspondentes.
const fetchSaintWorks = () => fetchRest<{ slug: string; saint_id: string; updated_at: string }>(
  'saint_works?select=slug,saint_id,updated_at&status=eq.published',
  'patrística (obras)',
);
const fetchSaintWorkChapters = () => fetchRest<{ work_id: string; order: number; updated_at: string }>(
  'saint_work_chapters?select=work_id,order,updated_at&order=work_id.asc,order.asc&limit=5000',
  'patrística (capítulos)',
);

// Magistério — 35 documentos estáticos.
async function fetchMagisteriumIds(): Promise<Array<{ id: string }>> {
  try {
    const mod = await import('../src/data/magisterium-urls');
    const cats = (mod as { MAGISTERIUM_CATEGORIES?: Array<{ documents: Array<{ id: string }> }> })
      .MAGISTERIUM_CATEGORIES ?? [];
    return cats.flatMap((c) => c.documents.map((d) => ({ id: d.id })));
  } catch (e) {
    console.warn('⚠️  Falha ao carregar MAGISTERIUM_CATEGORIES:', e);
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

  const indexableRoutes = publicRoutes.filter((r) => {
    const meta = resolveRouteMeta(r);
    // exclui rotas sem meta correspondente ou marcadas noindex/aliased
    if (!meta) return false;
    if (meta.noindex) return false;
    if (meta.canonicalPath && meta.canonicalPath !== r) return false;
    return true;
  });
  const excluded = publicRoutes.length - indexableRoutes.length;
  if (excluded > 0) {
    console.log(`ℹ️  ${excluded} rota(s) filtradas do sitemap (alias/noindex via ROUTE_META).`);
  }

  indexableRoutes.forEach(route => {
    let priority = '0.8';
    let changefreq = 'daily';

    if (route === '/') {
      priority = '1.0';
    } else if (['/about', '/terms', '/privacy', '/transparencia', '/partners', '/diagnostico'].includes(route)) {
      priority = '0.5';
      changefreq = 'monthly';
    } else if (['/glossario', '/papas', '/guia-modulos'].includes(route)) {
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

  // União: emite rotas indexáveis estáticas do ROUTE_META que ainda não foram cobertas
  const emitted = new Set<string>(indexableRoutes);
  let extraCount = 0;
  for (const [p, meta] of Object.entries(ROUTE_META)) {
    if (meta.noindex) continue;
    if (p.includes(':')) continue;
    if (meta.canonicalPath && meta.canonicalPath !== p) continue;
    if (emitted.has(p)) continue;
    emitted.add(p);
    extraCount++;
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}${p === '/' ? '' : p}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += '  </url>\n';
  }
  if (extraCount > 0) console.log(`ℹ️  ${extraCount} rota(s) adicionadas do ROUTE_META (ausentes em types.ts).`);



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

  // ─── P0.3.1 · Ondas dinâmicas de conteúdo editorial ──────────
  // Todas as entidades fetchadas em paralelo. URLs emitidas via helper com cap.
  const MAX_URLS = 45000; // Google aceita 50k por sitemap; folga p/ segurança.
  let urlCount =
    indexableRoutes.length + extraCount + glossary.length; // já emitidos até aqui

  const emitUrl = (loc: string, ts?: string | null, changefreq = 'weekly', priority = '0.6') => {
    if (urlCount >= MAX_URLS) return false;
    const lm = (ts ?? '').split('T')[0] || lastmod;
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}${loc}</loc>\n`;
    xml += `    <lastmod>${lm}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += '  </url>\n';
    urlCount++;
    return true;
  };

  const [
    saints,
    catechism,
    bibleBooks,
    bibleChapters,
    themes,
    prayers,
    collections,
    journeys,
    saintWorks,
    saintWorkChapters,
    magisterium,
  ] = await Promise.all([
    fetchSaints(),
    fetchCatechism(),
    fetchBibleBooks(),
    fetchBibleChapters(),
    fetchThemes(),
    fetchPrayers(),
    fetchCollections(),
    fetchJourneys(),
    fetchSaintWorks(),
    fetchSaintWorkChapters(),
    fetchMagisteriumIds(),
  ]);

  // Bíblia — livro-index (73) + capítulos realmente importados.
  const bookAbbrById = new Map(bibleBooks.map((b) => [b.id, b.abbrev]));
  bibleBooks.forEach((b) => {
    emitUrl(`/bible?book=${encodeURIComponent(b.abbrev)}&amp;ch=1`, null, 'monthly', '0.6');
  });
  bibleChapters.forEach((c) => {
    const abbr = bookAbbrById.get(c.book_id);
    if (!abbr || c.number === 1) return; // ch=1 já emitido acima
    emitUrl(`/bible?book=${encodeURIComponent(abbr)}&amp;ch=${c.number}`, null, 'monthly', '0.5');
  });

  // Catecismo — parágrafos com conteúdo (rota real usa ?p=).
  catechism.forEach((p) => emitUrl(`/catechism?p=${p.paragraph}`, p.created_at, 'monthly', '0.6'));

  // Santos — apenas os enriquecidos (content_status='complete'). Stubs ficam de fora.
  saints.forEach((s) => emitUrl(`/santos/${encodeURIComponent(s.id)}`, s.updated_at, 'monthly', '0.7'));

  // Magistério — documentos estáticos do módulo.
  magisterium.forEach((d) => emitUrl(`/magisterium/${encodeURIComponent(d.id)}`, null, 'monthly', '0.7'));

  // Temas, Orações, Coleções, Jornadas.
  themes.forEach((t) => emitUrl(`/temas/${t.slug}`, t.updated_at, 'weekly', '0.6'));
  prayers.forEach((p) => emitUrl(`/oracao/${p.slug}`, p.updated_at, 'weekly', '0.7'));
  collections.forEach((c) => emitUrl(`/colecoes/${c.slug}`, c.updated_at, 'weekly', '0.7'));
  journeys.forEach((j) => emitUrl(`/jornadas/${encodeURIComponent(j.id)}`, j.updated_at, 'weekly', '0.7'));

  // Patrística — obras publicadas + capítulos (join id→slug).
  saintWorks.forEach((w) => {
    emitUrl(
      `/biblioteca/escritos/${encodeURIComponent(w.saint_id)}/${w.slug}`,
      w.updated_at,
      'monthly',
      '0.7',
    );
  });
  if (saintWorkChapters.length > 0) {
    const worksWithId = await fetchRest<{ id: string; slug: string; saint_id: string }>(
      'saint_works?select=id,slug,saint_id&status=eq.published',
      'patrística (map id→slug)',
    );
    const workById = new Map(worksWithId.map((w) => [w.id, { slug: w.slug, saint_id: w.saint_id }]));
    saintWorkChapters.forEach((ch) => {
      const w = workById.get(ch.work_id);
      if (!w) return;
      emitUrl(
        `/biblioteca/escritos/${encodeURIComponent(w.saint_id)}/${w.slug}/capitulo/${ch.order}`,
        ch.updated_at,
        'monthly',
        '0.6',
      );
    });
  }

  const dynamicEmitted = {
    santos: saints.length,
    catecismo: catechism.length,
    biblia_capitulos: bibleChapters.length,
    biblia_livros: bibleBooks.length,
    magisterio: magisterium.length,
    temas: themes.length,
    oracoes: prayers.length,
    colecoes: collections.length,
    jornadas: journeys.length,
    patristica_obras: saintWorks.length,
    patristica_capitulos: saintWorkChapters.length,
  };
  console.log('ℹ️  P0.3.1 — entidades dinâmicas emitidas:', dynamicEmitted);
  if (urlCount >= MAX_URLS) {
    console.warn(`⚠️  Cap MAX_URLS=${MAX_URLS} atingido. Considere migrar para sitemap index.`);
  }

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
  // Aliases noindex (canonicalPath aponta para outra rota) — evita indexação duplicada.
  const aliasDisallow = Object.entries(ROUTE_META)
    .filter(([p, m]) => m.noindex && m.canonicalPath && m.canonicalPath !== p && !p.includes(':'))
    .map(([p]) => p);
  const disallowList = Array.from(new Set([...privateRoutes, ...aliasDisallow])).sort();
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
