#!/usr/bin/env bun
/**
 * scripts/migrate-editorial-closure.ts — wrapper CLI fino.
 * Toda a lógica está em `./migrate-editorial-closure.core.ts` (testável).
 */
import { createClient } from '@supabase/supabase-js';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { mkdir, writeFile } from 'node:fs/promises';
import {
  parseArgs,
  runMigration,
  runRollback,
  ensureAuth,
  HELP,
  type CliDeps,
  type SupabaseLike,
} from './migrate-editorial-closure.core';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`❌ variável ${name} não definida.`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    process.exit(0);
  }

  const url = requireEnv('VITE_SUPABASE_URL');
  const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || requireEnv('VITE_SUPABASE_ANON_KEY');
  const email = requireEnv('CATHEDRA_ADMIN_EMAIL');
  const password = requireEnv('CATHEDRA_ADMIN_PASSWORD');

  const supabase = createClient(url, anon, { auth: { persistSession: false } }) as unknown as SupabaseLike;

  const rl = readline.createInterface({ input, output });
  const deps: CliDeps = {
    supabase,
    prompt: (q) => rl.question(q),
    writeFile: async (p, c) => { await writeFile(p, c, 'utf8'); },
    mkdirp: async (p) => { await mkdir(p, { recursive: true }); },
    log: (m) => console.log(m),
  };

  try {
    await ensureAuth(deps, { email, password });

    if (args.rollback) {
      const { rows, reports } = await runRollback(deps, args);
      console.log('\nRelatórios:');
      for (const r of reports) console.log(`  · ${r}`);
      if (args.json) console.log(JSON.stringify({ rollback: rows }, null, 2));
      process.exit(0);
    }

    const result = await runMigration(deps, args);
    console.log('\nRelatórios:');
    for (const r of result.reports) console.log(`  · ${r}`);
    if (args.json) {
      console.log(JSON.stringify({
        run_id: result.runId,
        dry_run: result.dryRows,
        applied: result.appliedRows,
        cancelled: result.cancelled,
      }, null, 2));
    }
    process.exit(0);
  } catch (err) {
    console.error(`❌ ${(err as Error).message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
