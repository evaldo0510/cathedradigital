/**
 * reader-guardrail — bloqueia qualquer PR que introduza:
 *   • import de `NexusBubbles`
 *   • import de `MysteryNexusPanel`
 *   • função local `AutoNexusList` / `NexusFullList` em páginas
 *   • uso direto de `@radix-ui/react-popover` fora do allowlist
 *
 * Usa a mesma fonte de verdade do audit: `src/config/reader-modules.ts`
 * (`FORBIDDEN_IMPORTS` + `GUARDRAIL_ALLOWLIST`).
 *
 * Uso:
 *   bun scripts/reader-guardrail.ts            # scan padrão em src/
 *   bun scripts/reader-guardrail.ts --json     # relatório JSON
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { FORBIDDEN_IMPORTS, GUARDRAIL_ALLOWLIST } from '../src/config/reader-modules';

const ROOT = resolve(__dirname, '..');
const SCAN_DIRS = ['src'];
const EXTS = new Set(['.ts', '.tsx']);
// Testes e histórias exercitam os componentes deprecados — não travam CI.
const IGNORE_SUFFIXES = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx', '.stories.tsx', '.stories.ts'];

interface Violation {
  file: string;
  rule: string;
  replacement: string;
  line: number;
  snippet: string;
}

function walk(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    const abs = resolve(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue;
      walk(abs, out);
    } else if (EXTS.has('.' + name.split('.').pop())) {
      out.push(abs);
    }
  }
}

function toRel(abs: string): string {
  return relative(ROOT, abs).split(sep).join('/');
}

function isAllowlisted(relPath: string): boolean {
  if (GUARDRAIL_ALLOWLIST.includes(relPath)) return true;
  return IGNORE_SUFFIXES.some((suf) => relPath.endsWith(suf));
}

function scanFile(abs: string): Violation[] {
  const relPath = toRel(abs);
  if (isAllowlisted(relPath)) return [];
  const source = readFileSync(abs, 'utf8');
  const lines = source.split('\n');
  const violations: Violation[] = [];
  for (const rule of FORBIDDEN_IMPORTS) {
    for (let i = 0; i < lines.length; i++) {
      if (rule.pattern.test(lines[i])) {
        violations.push({
          file: relPath,
          rule: rule.label,
          replacement: rule.replacement,
          line: i + 1,
          snippet: lines[i].trim().slice(0, 140),
        });
      }
    }
  }
  return violations;
}

function main() {
  const asJson = process.argv.includes('--json');
  const files: string[] = [];
  for (const dir of SCAN_DIRS) walk(resolve(ROOT, dir), files);

  const violations: Violation[] = [];
  for (const f of files) violations.push(...scanFile(f));

  if (asJson) {
    process.stdout.write(JSON.stringify({ violations }, null, 2) + '\n');
  } else if (violations.length === 0) {
    console.log('✅ reader-guardrail: nenhuma violação — Reader Template Master preservado.');
  } else {
    console.log(`❌ reader-guardrail: ${violations.length} violação(ões) do Reader Architecture Rule\n`);
    for (const v of violations) {
      console.log(`  ${v.file}:${v.line}`);
      console.log(`      ${v.rule}  →  substituir por: ${v.replacement}`);
      console.log(`      ${v.snippet}`);
    }
    console.log('\nDocs: docs/reader-template-master-fase-c.md · COS §10 · v1.1');
  }

  process.exit(violations.length ? 1 : 0);
}

main();
