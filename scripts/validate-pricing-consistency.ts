/**
 * Validação estática de consistência da página /pricing.
 *
 * Regras (falha o build ao violar):
 *  1. As constantes de preço (PRICE_MONTHLY / PRICE_YEARLY) devem aparecer
 *     tanto no JSON-LD quanto no texto renderizado nos cards.
 *  2. CANONICAL_URL deve conter o path canônico "/pricing" e usar o
 *     domínio configurado em SEO_CONFIG.BASE_URL.
 *  3. og:url, twitter:url e link rel="canonical" devem apontar para
 *     CANONICAL_URL — nunca para /planos.
 *  4. Nenhuma menção literal a "/planos" no arquivo da PricingPage.
 *  5. Título e descrição não podem ser os placeholders da Lovable.
 *
 * Roda no CI (job seo-assets do workflow SEO & Tests).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FILE = resolve(process.cwd(), 'src/components/cathedra/PricingPage.tsx');
const SEO = resolve(process.cwd(), 'src/config/seo.ts');

const src = readFileSync(FILE, 'utf8');
const seoSrc = readFileSync(SEO, 'utf8');
const errors: string[] = [];

function readConst(name: string): string | null {
  const re = new RegExp(`const\\s+${name}\\s*=\\s*([^;\\n]+);`);
  const m = src.match(re);
  return m ? m[1].trim() : null;
}

const monthlyRaw = readConst('PRICE_MONTHLY');
const yearlyRaw = readConst('PRICE_YEARLY');
const canonicalRaw = readConst('CANONICAL_URL');
const titleRaw = readConst('PAGE_TITLE');
const descRaw = readConst('PAGE_DESCRIPTION');

if (!monthlyRaw || !yearlyRaw || !canonicalRaw || !titleRaw || !descRaw) {
  errors.push(
    `Não encontrei todas as constantes obrigatórias em PricingPage.tsx: ` +
      JSON.stringify({ monthlyRaw, yearlyRaw, canonicalRaw, titleRaw, descRaw }),
  );
}

const monthly = Number(monthlyRaw);
const yearly = Number(yearlyRaw);
const canonical = canonicalRaw?.replace(/^['"`]|['"`]$/g, '') ?? '';
const title = titleRaw?.replace(/^['"`]|['"`]$/g, '') ?? '';
const desc = descRaw?.replace(/^['"`]|['"`]$/g, '') ?? '';

// 1. Preços aparecem no card e no JSON-LD
const monthlyReais = Math.trunc(monthly);
const monthlyCents = Math.round((monthly - monthlyReais) * 100)
  .toString()
  .padStart(2, '0');
const yearlyBR = yearly.toFixed(2).replace('.', ',');
const monthlyBR = monthly.toFixed(2).replace('.', ',');

if (!src.includes(`R$ ${monthlyReais}`) || !src.includes(`,${monthlyCents}`)) {
  errors.push(
    `Card mensal não mostra "R$ ${monthlyReais}" + ",${monthlyCents}" — preço divergente da constante PRICE_MONTHLY (${monthly}).`,
  );
}
if (!src.includes(`R$ ${yearlyBR}`)) {
  errors.push(`Card não menciona "R$ ${yearlyBR}/ano" (PRICE_YEARLY divergente).`);
}
// JSON-LD usa toFixed(2) — checa presença do valor cru no build final via regex.
if (!new RegExp(`PRICE_MONTHLY\\.toFixed\\(2\\)`).test(src)) {
  errors.push('JSON-LD não usa PRICE_MONTHLY.toFixed(2) — pode divergir dos cards.');
}
if (!new RegExp(`PRICE_YEARLY\\.toFixed\\(2\\)`).test(src)) {
  errors.push('JSON-LD não usa PRICE_YEARLY.toFixed(2) — pode divergir dos cards.');
}

// 2. Canonical URL usa BASE_URL configurado
const baseMatch = seoSrc.match(/BASE_URL:\s*['"]([^'"]+)['"]/);
const baseUrl = baseMatch?.[1] ?? '';
if (!baseUrl) errors.push('SEO_CONFIG.BASE_URL não encontrado em src/config/seo.ts');
if (canonical && baseUrl && !canonical.startsWith(baseUrl)) {
  errors.push(`CANONICAL_URL (${canonical}) não começa com SEO_CONFIG.BASE_URL (${baseUrl}).`);
}
if (canonical && !canonical.endsWith('/pricing')) {
  errors.push(`CANONICAL_URL deve terminar em /pricing — veio "${canonical}".`);
}

// 3. Nenhum og:url/twitter:url/canonical apontando para /planos
const socialTags = [
  /property=["']og:url["']\s+content=\{([^}]+)\}/,
  /name=["']twitter:url["']\s+content=\{([^}]+)\}/,
  /rel=["']canonical["']\s+href=\{([^}]+)\}/,
];
for (const re of socialTags) {
  const m = src.match(re);
  if (m && !m[1].includes('CANONICAL_URL')) {
    errors.push(`Tag social/canonical não referencia CANONICAL_URL: ${m[0]}`);
  }
}

// 4. Nada de /planos literal
const planosHits = [...src.matchAll(/\/planos\b/g)];
if (planosHits.length > 0) {
  errors.push(`PricingPage.tsx menciona "/planos" ${planosHits.length}x — usar apenas /pricing.`);
}

// 5. Placeholders proibidos
if (/Lovable App|Lovable Generated Project/i.test(title + ' ' + desc)) {
  errors.push('Título/descrição contém placeholder da Lovable.');
}
if (title.length > 70) errors.push(`PAGE_TITLE muito longo (${title.length} chars, máx 70).`);
if (desc.length > 175) errors.push(`PAGE_DESCRIPTION muito longa (${desc.length} chars, máx 175).`);

if (errors.length > 0) {
  console.error('❌ Consistência /pricing FALHOU:\n' + errors.map((e) => '  • ' + e).join('\n'));
  process.exit(1);
}

console.log('✅ /pricing consistente:');
console.log(`   PRICE_MONTHLY = ${monthly} → card "R$ ${monthlyReais},${monthlyCents}" · JSON-LD "${monthly.toFixed(2)}"`);
console.log(`   PRICE_YEARLY  = ${yearly} → card "R$ ${yearlyBR}" · JSON-LD "${yearly.toFixed(2)}"`);
console.log(`   CANONICAL_URL = ${canonical}`);
console.log(`   PAGE_TITLE    (${title.length} chars) OK`);
console.log(`   PAGE_DESCRIPTION (${desc.length} chars) OK`);
