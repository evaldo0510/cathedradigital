#!/usr/bin/env tsx
/**
 * C0.5 — Reader Chrome Final · Auditoria bloqueante
 *
 * Regra COS §10 (Reader Architecture Rule):
 *   Único toolbar canônico de leitura = `ReaderToolbar`
 *   (@/components/reader/ReaderToolbar, exportado via barrel).
 *   `EditorialReaderChrome` está EXTINTO e não pode voltar.
 *
 * Falha se:
 *   1. O arquivo legado `src/components/editorial/EditorialReaderChrome.tsx`
 *      voltar a existir.
 *   2. Qualquer arquivo em `src/**` importar de
 *      `@/components/editorial/EditorialReaderChrome` ou caminho equivalente.
 */
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const LEGACY_FILE = 'src/components/editorial/EditorialReaderChrome.tsx';

let violations = 0;

// 1. Arquivo legado não pode existir.
if (existsSync(resolve(ROOT, LEGACY_FILE))) {
  console.error(`❌ arquivo legado presente: ${LEGACY_FILE}`);
  violations += 1;
}

// 2. Nenhum import residual (grep restrito a `from '...EditorialReaderChrome'`).
let importHits = '';
try {
  importHits = execSync(
    `grep -rlE --include='*.ts' --include='*.tsx' "from ['\\\\\\\"][^'\\\\\\\"]*editorial/EditorialReaderChrome['\\\\\\\"]" src/ || true`,
    { cwd: ROOT, encoding: 'utf8' },
  ).trim();
} catch {
  importHits = '';
}
if (importHits) {
  console.error('❌ imports residuais de EditorialReaderChrome:');
  for (const f of importHits.split('\n').filter(Boolean)) {
    console.error(`   · ${f}`);
    violations += 1;
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Reader Chrome Final · Auditoria C0.5');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`EditorialReaderChrome references: ${importHits ? importHits.split('\n').filter(Boolean).length : 0}`);
console.log(`Legacy file present: ${existsSync(resolve(ROOT, LEGACY_FILE)) ? 'yes' : 'no'}`);

if (violations === 0) {
  console.log('Status: ✅ CERTIFIED — EditorialReaderChrome extinto, ReaderToolbar canônico.');
  process.exit(0);
}

console.error(`\nC0.5 BLOQUEADA — ${violations} violação(ões).`);
process.exit(1);
