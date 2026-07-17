#!/usr/bin/env node
/**
 * Guarda: componentes do Nexus/Catecismo NÃO podem abrir URLs externas.
 * Falha o build/CI se encontrar `target="_blank"`, `window.open` ou `href="http`
 * em arquivos que orquestram cliques do Nexus.
 *
 * Regra de negócio: toda referência deve navegar dentro do Cathedra.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FILES = [
  'src/components/cathedra/CatechismPopover.tsx',
  'src/components/cathedra/NexusBubbles.tsx',
  'src/components/cathedra/CrossReferencePanel.tsx',
  'src/lib/nexusNavigation.ts',
];

const FORBIDDEN = [
  { re: /target\s*=\s*["']_blank["']/g, msg: 'target="_blank" proibido' },
  { re: /window\.open\s*\(/g, msg: 'window.open proibido' },
  { re: /href\s*=\s*["']https?:/g, msg: 'href absoluto (http/https) proibido' },
];

let failed = false;
for (const rel of FILES) {
  const path = resolve(process.cwd(), rel);
  let src;
  try {
    src = readFileSync(path, 'utf8');
  } catch {
    continue; // arquivo removido do repo, ignore
  }
  for (const { re, msg } of FORBIDDEN) {
    const matches = [...src.matchAll(re)];
    if (matches.length > 0) {
      failed = true;
      for (const m of matches) {
        const line = src.slice(0, m.index).split('\n').length;
        console.error(`✗ ${rel}:${line} — ${msg}`);
      }
    }
  }
}

if (failed) {
  console.error('\nNexus deve navegar apenas dentro do Cathedra. Use catechismInternalPath/openNexusRef.');
  process.exit(1);
}
console.log('✓ Nexus 100% interno.');
