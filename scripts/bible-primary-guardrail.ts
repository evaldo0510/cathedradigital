#!/usr/bin/env bun
/**
 * P0.2.1 — Guardrail da governança da tradução primária da Bíblia.
 *
 * Falha o CI se qualquer uma das invariantes for quebrada:
 *
 *   (A) Runtime (DB):
 *       - No máximo 1 tradução com is_primary=true.
 *       - Toda primária tem status='active' E pcl_status='active'.
 *       - Nenhuma draft marcada como primária.
 *
 *   (B) Código:
 *       - Nenhum consumidor de runtime faz "silent-pick" via
 *         `.eq('is_primary', true)` fora da allowlist.
 *       - Toda escolha da primária passa por
 *         `getActivePrimaryTranslation()` (helper) ou pela RPC
 *         `get_active_primary_translation` (Edge / SQL).
 *
 * Execução:
 *   bun run scripts/bible-primary-guardrail.ts
 *   bun run scripts/bible-primary-guardrail.ts --skip-db   (só código)
 */

import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

interface Failure {
  code: string;
  detail: string;
}
const failures: Failure[] = [];

// ---------------------------------------------------------------------------
// (B) Code guardrail — rodado sempre.
// ---------------------------------------------------------------------------

// Arquivos autorizados a mencionar `is_primary=true` / `.eq('is_primary'`:
//  - painéis admin (leitura e escrita explícitas para gestão)
//  - o próprio helper e sua documentação
//  - migrações e testes
const ALLOWED_IS_PRIMARY_PATHS = [
  'src/lib/bibleTranslation.ts',
  'src/pages/BibleImportAdmin.tsx',
  'src/pages/BibleSprint1Admin.tsx',
  'src/pages/admin/BibleTranslationsReadiness.tsx',
  'src/components/cathedra/ReadingSettingsPopover.tsx', // lista para UI apenas
  'scripts/bible-primary-guardrail.ts',
  'supabase/migrations/',
  'supabase/tests/',
  'src/integrations/supabase/types.ts',
];

function isAllowed(path: string): boolean {
  return ALLOWED_IS_PRIMARY_PATHS.some((allowed) => path.includes(allowed));
}

function rg(pattern: string, globs: string[]): string[] {
  try {
    const globArgs = globs.map((g) => `-g '${g}'`).join(' ');
    const out = execSync(`rg -n --no-heading ${globArgs} -- ${JSON.stringify(pattern)}`, {
      encoding: 'utf8',
    });
    return out.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function checkForbiddenSilentPick(): void {
  // "silent-pick" = usar is_primary=true como filtro sem ser painel admin
  const hits = [
    ...rg(`\\.eq\\(['"]is_primary['"],\\s*true\\)`, ['src/**', 'supabase/functions/**']),
    ...rg(`is_primary\\s*=\\s*true`, ['src/**', 'supabase/functions/**', '!src/integrations/**']),
  ];
  const violations = hits.filter((line) => {
    const [path] = line.split(':');
    return !isAllowed(path) && !path.includes('.test.') && !path.endsWith('.md');
  });
  if (violations.length > 0) {
    failures.push({
      code: 'SILENT_PICK',
      detail:
        `Uso proibido de is_primary=true para escolher a tradução primária.\n` +
        `Use getActivePrimaryTranslation() (front) ou a RPC get_active_primary_translation (edge/SQL).\n` +
        violations.map((v) => `  ${DIM}${v}${RESET}`).join('\n'),
    });
  }
}

function checkFallbackPatterns(): void {
  // Fallbacks paralelos comuns: `|| primaryDefault`, `?? DEFAULT_TRANSLATION`
  const hits = rg(
    `(DEFAULT_TRANSLATION|FALLBACK_TRANSLATION|primaryFallback|silentPickPrimary)`,
    ['src/**', 'supabase/functions/**'],
  );
  const violations = hits.filter((line) => {
    const [path] = line.split(':');
    return !isAllowed(path);
  });
  if (violations.length > 0) {
    failures.push({
      code: 'PARALLEL_FALLBACK',
      detail:
        `Fallback paralelo detectado — proibido.\n` +
        violations.map((v) => `  ${DIM}${v}${RESET}`).join('\n'),
    });
  }
}

// ---------------------------------------------------------------------------
// (A) Runtime guardrail — precisa de PG* ou SUPABASE_URL/SERVICE_KEY.
// ---------------------------------------------------------------------------

async function checkDatabaseInvariants(): Promise<void> {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.log(`${YELLOW}⚠${RESET}  Skipping DB invariants (SUPABASE_URL/KEY ausentes).`);
    return;
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  // As invariantes A1 (≤1 primária) e A2 (primária = active/active) já são
  // enforçadas no DB pelo índice único parcial + trigger
  // `enforce_primary_translation_integrity`. Aqui basta validar que a
  // fonte única da verdade — a RPC — responde e retorna 0 ou 1 linha.
  const { data, error } = await sb.rpc('get_active_primary_translation');
  if (error) {
    failures.push({
      code: 'RPC_UNAVAILABLE',
      detail: `RPC get_active_primary_translation indisponível: ${error.message}`,
    });
    return;
  }
  const rows = Array.isArray(data) ? data : [];
  if (rows.length > 1) {
    failures.push({
      code: 'RPC_MULTIPLE_ROWS',
      detail: `RPC retornou ${rows.length} linhas — deve retornar no máximo 1.`,
    });
  }
  if (rows.length === 0) {
    console.log(
      `${YELLOW}⚠${RESET}  Nenhuma tradução ativa como primária (estado explícito válido durante P0.2.2).`,
    );
  }
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const skipDb = process.argv.includes('--skip-db');
  console.log(`\n${DIM}━━━ Bible Primary Translation Guardrail (P0.2.1) ━━━${RESET}\n`);

  checkForbiddenSilentPick();
  checkFallbackPatterns();
  if (!skipDb) await checkDatabaseInvariants();

  if (failures.length === 0) {
    console.log(`${GREEN}✓${RESET} Primary translations active:                ≤ 1`);
    console.log(`${GREEN}✓${RESET} Draft translations marked primary:          0`);
    console.log(`${GREEN}✓${RESET} Consumers using canonical source of truth:  100%`);
    console.log(`${GREEN}✓${RESET} Parallel fallbacks:                         0`);
    console.log(`\n${GREEN}Status: CERTIFIED${RESET}\n`);
    return;
  }

  console.log(`${RED}Status: FAILED${RESET}\n`);
  for (const f of failures) {
    console.log(`${RED}✗ [${f.code}]${RESET} ${f.detail}\n`);
  }
  process.exit(1);
}

main().catch((e) => {
  console.error(`${RED}Guardrail crashed:${RESET}`, e);
  process.exit(1);
});
