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

const robots = fs.readFileSync(path.join(process.cwd(), 'public/robots.txt'), 'utf8');
if (!robots.split('\n').some((l) => l.trim() === `Disallow: ${ALIAS}`)) {
  errors.push(`robots.txt não contém "Disallow: ${ALIAS}".`);
}

const meta = ROUTE_META[ALIAS];
if (!meta) {
  errors.push(`ROUTE_META['${ALIAS}'] ausente.`);
} else {
  if (!meta.noindex) errors.push(`ROUTE_META['${ALIAS}'].noindex deve ser true.`);
  if (meta.canonicalPath !== CANONICAL) {
    errors.push(`ROUTE_META['${ALIAS}'].canonicalPath deve ser '${CANONICAL}' (atual: ${meta.canonicalPath ?? 'undefined'}).`);
  }
}

if (errors.length) {
  console.error(`❌ Guard de alias ${ALIAS} falhou:`);
  errors.forEach((e) => console.error('  · ' + e));
  process.exit(1);
}

console.log(`✅ Alias ${ALIAS} desindexado e apontando para ${CANONICAL}.`);
