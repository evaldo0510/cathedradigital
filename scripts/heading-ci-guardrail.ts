#!/usr/bin/env tsx
/**
 * P0.3.3 · Headings CI Guardrail
 * Validates heading hierarchy in all pages before build.
 */
import { readFileSync, globSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditSource, isSubcomponentFile, IGNORE_PATTERNS } from './headings-audit.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function runGuardrail(): number {
  const files = globSync('src/pages/**/*.{tsx,jsx}', { cwd: ROOT }).map((p) =>
    resolve(ROOT, p)
  );

  let totalViolations = 0;
  for (const abs of files) {
    const rel = abs.replace(ROOT + '/', '');
    if (IGNORE_PATTERNS.some((r) => r.test(rel))) continue;
    
    const src = readFileSync(abs, 'utf8');
    const isSub = isSubcomponentFile(abs);
    const findings = auditSource(rel, src, { isSubcomponent: isSub });
    
    if (findings.length > 0) {
      totalViolations += findings.length;
      for (const f of findings) {
        console.error(`❌ [${f.kind}] ${f.file}: ${f.detail}`);
        if (f.hint) console.error(`   💡 ${f.hint}`);
      }
    }
  }

  if (totalViolations > 0) {
    console.error(`\nFound ${totalViolations} heading violations. CI Blocked.`);
    return 1;
  }
  
  console.log('✅ Heading hierarchy validated.');
  return 0;
}

process.exit(runGuardrail());
