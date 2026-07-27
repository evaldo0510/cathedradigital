#!/usr/bin/env node
/**
 * FAQ Coverage Report — enumera os casos cobertos pelos testes de sanitização
 * de FAQ e imprime uma matriz por categoria.
 *
 * Categorias auditadas:
 *   1. empty        · itens vazios / faltando
 *   2. canonical    · caso feliz canônico
 *   3. control      · caracteres de controle (\x00..\x1F, \x7F)
 *   4. htmlHandlers · tags perigosas e on-handlers inline
 *   5. uris         · URIs perigosas (javascript:/data:/vbscript:)
 *
 * Saída:
 *   - console (colorido) — para dev/local.
 *   - GITHUB_STEP_SUMMARY (markdown) — quando presente (CI).
 *   - reports/faq-coverage.json — artefato uploadável.
 *
 * Códigos de saída:
 *   0 · todas as categorias cobertas por ao menos 1 caso.
 *   1 · alguma categoria descoberta.
 */

import { readdirSync, readFileSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const TEST_DIR = join(process.cwd(), 'src/lib/glossary/__tests__');
const REPORT_DIR = join(process.cwd(), 'reports');

const CATEGORIES = {
  empty: {
    label: 'Vazios / faltando',
    patterns: [/answer\s*:\s*''/, /answer\s*:\s*undefined/, /answer\s*:\s*null/, /question\s*:\s*''/, /\.length\s*===?\s*0/, /min\(1\)/, /toBe\(0\)/],
  },
  canonical: {
    label: 'Canônico (caso feliz)',
    patterns: [/O que é/i, /Como/i, /Qual/i, /Resposta/i, /toBe\(true\)/, /parsed\.success/],
  },
  control: {
    label: 'Caracteres de controle',
    patterns: [/\\x0[0-8BCE-F]/, /\\x1[0-9A-F]/, /\\x7F/, /control-chars/i, /CONTROL_CHARS/],
  },
  htmlHandlers: {
    label: 'Tags perigosas / on-handlers',
    patterns: [/<script/i, /<iframe/i, /onerror/i, /onclick/i, /onload/i, /<style/i, /<embed/i, /<object/i],
  },
  uris: {
    label: 'URIs perigosas',
    patterns: [/javascript:/i, /data:/i, /vbscript:/i, /DANGEROUS_URI/],
  },
};

function listTestFiles() {
  try {
    return readdirSync(TEST_DIR)
      .filter((f) => f.endsWith('.test.ts') || f.endsWith('.test.tsx'))
      .map((f) => join(TEST_DIR, f));
  } catch {
    return [];
  }
}

function analyseFile(filePath) {
  const src = readFileSync(filePath, 'utf8');
  const hits = {};
  for (const [key, cfg] of Object.entries(CATEGORIES)) {
    let count = 0;
    for (const rx of cfg.patterns) {
      const m = src.match(new RegExp(rx.source, rx.flags?.includes('g') ? rx.flags : (rx.flags ?? '') + 'g'));
      if (m) count += m.length;
    }
    hits[key] = count;
  }
  return { file: filePath.replace(process.cwd() + '/', ''), hits };
}

function main() {
  const files = listTestFiles();
  const perFile = files.map(analyseFile);
  const totals = Object.fromEntries(Object.keys(CATEGORIES).map((k) => [k, 0]));
  for (const f of perFile) {
    for (const k of Object.keys(CATEGORIES)) totals[k] += f.hits[k];
  }

  const missing = Object.entries(totals)
    .filter(([, n]) => n === 0)
    .map(([k]) => k);

  const report = {
    generatedAt: new Date().toISOString(),
    filesAnalysed: perFile.length,
    totals,
    missing,
    perFile,
  };

  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(join(REPORT_DIR, 'faq-coverage.json'), JSON.stringify(report, null, 2));

  // Console
  console.log('\n== FAQ Coverage Report ==');
  console.log(`Arquivos analisados: ${perFile.length}`);
  for (const [k, cfg] of Object.entries(CATEGORIES)) {
    const n = totals[k];
    const mark = n > 0 ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    console.log(`  ${mark} ${cfg.label.padEnd(32)} ${n} casos`);
  }
  if (missing.length > 0) {
    console.log(`\nCategorias descobertas: ${missing.join(', ')}`);
  }

  // GitHub Step Summary
  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = [
      '## FAQ Coverage Report',
      '',
      `Arquivos analisados: **${perFile.length}**`,
      '',
      '| Categoria | Casos | Status |',
      '|---|---:|:---:|',
      ...Object.entries(CATEGORIES).map(([k, cfg]) => {
        const n = totals[k];
        return `| ${cfg.label} | ${n} | ${n > 0 ? '✅' : '❌'} |`;
      }),
      '',
    ];
    if (missing.length > 0) {
      lines.push(`> ❌ Categorias sem cobertura: **${missing.join(', ')}**`);
    } else {
      lines.push('> ✅ Todas as categorias cobertas.');
    }
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
  }

  process.exit(missing.length > 0 ? 1 : 0);
}

main();
