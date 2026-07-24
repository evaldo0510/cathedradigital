#!/usr/bin/env bun
/**
 * scripts/migrate-editorial-closure.ts
 *
 * CLI para executar a função `public.migrate_editorial_closure_legacy`.
 *
 * Fluxo:
 *   1. Autentica como admin (email + senha).
 *   2. Roda `dry_run = true` e mostra resumo agregado + diff por tabela.
 *   3. Pergunta confirmação interativa.
 *   4. Se confirmado, executa `dry_run = false` e mostra resumo final.
 *
 * Uso:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_PUBLISHABLE_KEY=... \
 *   CATHEDRA_ADMIN_EMAIL=... CATHEDRA_ADMIN_PASSWORD=... \
 *     bun scripts/migrate-editorial-closure.ts
 *
 * Flags:
 *   --yes           pula confirmação (para uso em CI)
 *   --dry-run-only  só executa o dry-run e sai
 *   --json          imprime o resultado bruto em JSON no final
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

type Row = {
  entity_table: string;
  scanned: number;
  normalized: number;
  unchanged: number;
  discarded: number;
};

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';

function color(c: string, s: string) {
  return process.stdout.isTTY ? `${c}${s}${RESET}` : s;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(color(RED, `❌ Variável ${name} não definida.`));
    process.exit(1);
  }
  return v;
}

function printTable(rows: Row[]) {
  const totals = rows.reduce(
    (acc, r) => ({
      scanned: acc.scanned + r.scanned,
      normalized: acc.normalized + r.normalized,
      unchanged: acc.unchanged + r.unchanged,
      discarded: acc.discarded + r.discarded,
    }),
    { scanned: 0, normalized: 0, unchanged: 0, discarded: 0 },
  );

  const w = { table: 22, num: 12 };
  const hdr =
    color(BOLD, 'Tabela'.padEnd(w.table)) +
    color(BOLD, 'Escaneados'.padStart(w.num)) +
    color(BOLD, 'Normalizados'.padStart(w.num)) +
    color(BOLD, 'Inalterados'.padStart(w.num)) +
    color(BOLD, 'Descartados'.padStart(w.num));
  console.log(hdr);
  console.log(color(DIM, '─'.repeat(w.table + w.num * 4)));

  for (const r of rows) {
    const line =
      r.entity_table.padEnd(w.table) +
      String(r.scanned).padStart(w.num) +
      color(r.normalized > 0 ? YELLOW : DIM, String(r.normalized).padStart(w.num)) +
      color(DIM, String(r.unchanged).padStart(w.num)) +
      color(r.discarded > 0 ? RED : DIM, String(r.discarded).padStart(w.num));
    console.log(line);
  }

  console.log(color(DIM, '─'.repeat(w.table + w.num * 4)));
  console.log(
    color(BOLD, 'TOTAL'.padEnd(w.table)) +
      color(BOLD, String(totals.scanned).padStart(w.num)) +
      color(totals.normalized > 0 ? YELLOW : DIM, String(totals.normalized).padStart(w.num)) +
      color(DIM, String(totals.unchanged).padStart(w.num)) +
      color(totals.discarded > 0 ? RED : DIM, String(totals.discarded).padStart(w.num)),
  );
  return totals;
}

async function fetchWarnings(supabase: ReturnType<typeof createClient>, dryRun: boolean, limit = 10) {
  const { data, error } = await supabase
    .from('editorial_closure_migration_log')
    .select('entity_table, entity_id, strategy, warnings, created_at')
    .eq('dry_run', dryRun)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn(color(YELLOW, `⚠️  Não foi possível ler o log: ${error.message}`));
    return [];
  }
  return data ?? [];
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const skipConfirm = args.has('--yes') || args.has('-y');
  const dryOnly = args.has('--dry-run-only');
  const jsonOut = args.has('--json');

  const url = requireEnv('VITE_SUPABASE_URL');
  const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || requireEnv('VITE_SUPABASE_ANON_KEY');
  const email = requireEnv('CATHEDRA_ADMIN_EMAIL');
  const password = requireEnv('CATHEDRA_ADMIN_PASSWORD');

  const supabase = createClient(url, anon, { auth: { persistSession: false } });

  console.log(color(CYAN, '→ Autenticando como admin...'));
  const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
  if (authErr) {
    console.error(color(RED, `❌ Falha ao autenticar: ${authErr.message}`));
    process.exit(1);
  }

  // ═══ DRY RUN ═══
  console.log(color(CYAN, '\n→ Executando dry-run...\n'));
  const { data: dryData, error: dryErr } = await supabase.rpc('migrate_editorial_closure_legacy', {
    _dry_run: true,
  });
  if (dryErr) {
    console.error(color(RED, `❌ dry-run falhou: ${dryErr.message}`));
    process.exit(1);
  }
  const rows = (dryData ?? []) as Row[];
  const totals = printTable(rows);

  const warnings = await fetchWarnings(supabase, true, 15);
  if (warnings.length > 0) {
    console.log(color(BOLD, '\nÚltimas linhas registradas no log (dry-run):'));
    for (const w of warnings) {
      const ws = Array.isArray(w.warnings) ? (w.warnings as unknown[]).slice(0, 3).join(' · ') : '';
      console.log(
        `  ${color(DIM, '•')} ${w.entity_table}/${String(w.entity_id).slice(0, 8)} ` +
          color(YELLOW, `[${w.strategy}]`) +
          (ws ? color(DIM, `  ${ws}`) : ''),
      );
    }
  }

  if (totals.normalized === 0 && totals.discarded === 0) {
    console.log(color(GREEN, '\n✅ Nada a migrar. Todos os closures já estão canônicos.'));
    process.exit(0);
  }

  if (dryOnly) {
    console.log(color(CYAN, '\n(dry-run-only) — nenhuma alteração aplicada.'));
    if (jsonOut) console.log(JSON.stringify({ dry_run: rows }, null, 2));
    process.exit(0);
  }

  // ═══ CONFIRMAÇÃO ═══
  console.log(
    color(
      YELLOW,
      `\n⚠️  ${totals.normalized} linha(s) serão normalizadas e ${totals.discarded} descartada(s).`,
    ),
  );

  if (!skipConfirm) {
    const rl = readline.createInterface({ input, output });
    const answer = (await rl.question(color(BOLD, 'Aplicar migração? [digite "APLICAR"] '))).trim();
    rl.close();
    if (answer !== 'APLICAR') {
      console.log(color(DIM, 'Cancelado.'));
      process.exit(0);
    }
  } else {
    console.log(color(DIM, '(--yes) confirmação automática.'));
  }

  // ═══ APLY ═══
  console.log(color(CYAN, '\n→ Aplicando migração...\n'));
  const { data: applyData, error: applyErr } = await supabase.rpc('migrate_editorial_closure_legacy', {
    _dry_run: false,
  });
  if (applyErr) {
    console.error(color(RED, `❌ apply falhou: ${applyErr.message}`));
    process.exit(1);
  }
  const applied = (applyData ?? []) as Row[];
  printTable(applied);

  console.log(color(GREEN, '\n✅ Migração concluída.'));
  console.log(color(DIM, 'Consulte public.editorial_closure_migration_log para o diff completo.'));

  if (jsonOut) console.log(JSON.stringify({ dry_run: rows, applied }, null, 2));
}

main().catch((err) => {
  console.error(color(RED, `❌ erro inesperado: ${err?.message ?? err}`));
  process.exit(1);
});
