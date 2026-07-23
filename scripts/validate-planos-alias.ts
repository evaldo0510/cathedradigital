/**
 * Prebuild guard: garante que /planos permanece desindexado.
 *  - não pode aparecer em public/sitemap.xml
 *  - deve constar como Disallow em public/robots.txt
 *  - deve estar marcado noindex + canonicalPath=/pricing em ROUTE_META
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROUTE_META } from '../src/config/routeMeta';

const ALIAS = '/planos';
const CANONICAL = '/pricing';
const errors: string[] = [];

const sitemap = fs.readFileSync(path.join(process.cwd(), 'public/sitemap.xml'), 'utf8');
if (sitemap.includes(`${ALIAS}<`) || sitemap.includes(`${ALIAS}\n`) || sitemap.match(new RegExp(`>${'https?://[^<]*'}${ALIAS}<`))) {
  errors.push(`sitemap.xml contém ${ALIAS} — alias não deve ser indexado.`);
}
if (!sitemap.includes(`${CANONICAL}<`)) {
  errors.push(`sitemap.xml não contém ${CANONICAL} — destino canônico deve estar indexado.`);
}

const robots = fs.readFileSync(path.join(process.cwd(), 'public/robots.txt'), 'utf8');
if (!robots.split('\n').some((l) => l.trim() === `Disallow: ${ALIAS}`)) {
  errors.push(`robots.txt não contém "Disallow: ${ALIAS}".`);
}
if (robots.split('\n').some((l) => l.trim() === `Disallow: ${CANONICAL}`)) {
  errors.push(`robots.txt contém "Disallow: ${CANONICAL}" — destino canônico deve permanecer indexável.`);
}

const aliasMeta = ROUTE_META[ALIAS];
if (!aliasMeta) {
  errors.push(`ROUTE_META['${ALIAS}'] ausente.`);
} else {
  if (!aliasMeta.noindex) errors.push(`ROUTE_META['${ALIAS}'].noindex deve ser true.`);
  if (aliasMeta.canonicalPath !== CANONICAL) {
    errors.push(`ROUTE_META['${ALIAS}'].canonicalPath deve ser '${CANONICAL}' (atual: ${aliasMeta.canonicalPath ?? 'undefined'}).`);
  }
}

// Consistência do destino canônico: /pricing precisa ser indexável e self-canonical.
const canonicalMeta = ROUTE_META[CANONICAL];
if (!canonicalMeta) {
  errors.push(`ROUTE_META['${CANONICAL}'] ausente — destino do alias precisa estar mapeado.`);
} else {
  if (canonicalMeta.noindex) {
    errors.push(`ROUTE_META['${CANONICAL}'].noindex deve ser false — destino do alias precisa ser indexável.`);
  }
  if (canonicalMeta.canonicalPath && canonicalMeta.canonicalPath !== CANONICAL) {
    errors.push(
      `ROUTE_META['${CANONICAL}'].canonicalPath deve ser self (${CANONICAL}) ou undefined; atual: ${canonicalMeta.canonicalPath}.`,
    );
  }
  if (!canonicalMeta.title || !canonicalMeta.description) {
    errors.push(`ROUTE_META['${CANONICAL}'] precisa de title e description para servir como destino do alias.`);
  }
}

if (errors.length) {
  console.error(`❌ Guard de alias ${ALIAS} falhou:`);
  errors.forEach((e) => console.error('  · ' + e));
  process.exit(1);
}

console.log(`✅ Alias ${ALIAS} desindexado; destino ${CANONICAL} indexável e self-canonical.`);

