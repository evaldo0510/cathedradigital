/**
 * Purga entradas do cache L2 da Bíblia (`public.bible_cache_l2`) e, opcionalmente,
 * incrementa `app_feature_flags.bible_cache_global_version` para invalidar tudo
 * de uma vez.
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     bunx tsx scripts/purge-bible-cache.ts [--key=Mt:5] [--all] [--bump-version]
 *
 * Flags:
 *   --key=<cache_key>  Remove apenas a chave indicada (ex.: Mt:5).
 *   --all              Remove todas as linhas de bible_cache_l2.
 *   --bump-version     Incrementa metadata.version da flag bible_cache_global_version.
 *
 * Sem flags: apenas reporta o conteúdo atual do cache.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
  process.exit(1);
}

const args = process.argv.slice(2);
const flag = (name: string) => args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
const value = (name: string) => flag(name)?.split('=')[1];

const key = value('key');
const purgeAll = Boolean(flag('all'));
const bump = Boolean(flag('bump-version'));

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

async function main() {
  const { count: before } = await supabase
    .from('bible_cache_l2')
    .select('*', { count: 'exact', head: true });
  console.log(`[purge] linhas no cache: ${before ?? 0}`);

  if (key) {
    const { error, count } = await supabase
      .from('bible_cache_l2')
      .delete({ count: 'exact' })
      .eq('cache_key', key);
    if (error) throw error;
    console.log(`[purge] removidas ${count ?? 0} linhas para cache_key=${key}`);
  } else if (purgeAll) {
    const { error, count } = await supabase
      .from('bible_cache_l2')
      .delete({ count: 'exact' })
      .not('cache_key', 'is', null);
    if (error) throw error;
    console.log(`[purge] removidas ${count ?? 0} linhas (todas)`);
  }

  if (bump) {
    const { data: flagRow, error: fetchErr } = await supabase
      .from('app_feature_flags')
      .select('metadata')
      .eq('feature_key', 'bible_cache_global_version')
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    const next = Number((flagRow?.metadata as any)?.version ?? 1) + 1;
    const { error: updErr } = await supabase
      .from('app_feature_flags')
      .update({ metadata: { version: next }, is_enabled: true })
      .eq('feature_key', 'bible_cache_global_version');
    if (updErr) throw updErr;
    console.log(`[purge] bible_cache_global_version => ${next}`);
  }

  if (!key && !purgeAll && !bump) {
    console.log('[purge] modo dry — passe --key=<chave>, --all ou --bump-version para agir.');
  }
}

main().catch((e) => {
  console.error('[purge] erro:', e);
  process.exit(1);
});
