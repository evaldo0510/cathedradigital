/**
 * Seed idempotente da tabela `saints`.
 *
 * Uso:
 *   bun run scripts/seed-saints.ts
 *   bun run scripts/seed-saints.ts --file=./supabase/seeds/saints.json
 *
 * Requer variáveis de ambiente:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (necessário para bypass RLS em INSERT/UPSERT)
 *
 * Faz upsert por `id`. Registros com `_comment` ou `_schema` são ignorados
 * (permite manter documentação no arquivo).
 *
 * IMPORTANTE: os dados devem vir de fonte oficial (Martirológio Romano,
 * CNBB, vatican.va). Não gerar biografias/orações via IA.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  })
);

const file = resolve(process.cwd(), (args.file as string) || 'supabase/seeds/saints.json');
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
  process.exit(1);
}

const raw = JSON.parse(readFileSync(file, 'utf-8')) as any[];
const rows = raw.filter((r) => r && !r._comment && !r._schema && r.id && r.name && r.feast_month && r.feast_day_num);

if (rows.length === 0) {
  console.warn('⚠️  Nenhum registro válido em', file);
  console.warn('    Preencha com dados de fonte oficial e execute novamente.');
  process.exit(0);
}

const invalid = rows.filter(
  (r) => r.feast_month < 1 || r.feast_month > 12 || r.feast_day_num < 1 || r.feast_day_num > 31
);
if (invalid.length > 0) {
  console.error('❌ Registros com feast_month/feast_day_num inválidos:', invalid.map((r) => r.id));
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { error, count } = await supabase.from('saints').upsert(rows, { onConflict: 'id', count: 'exact' });
if (error) {
  console.error('❌ Falha no upsert:', error.message);
  process.exit(1);
}

console.log(`✅ ${count ?? rows.length} santo(s) importado(s) de ${file}`);

// Relatório de cobertura
const { data: existing } = await supabase.from('saints').select('feast_month, feast_day_num');
const covered = new Set((existing || []).map((r: any) => `${r.feast_month}-${r.feast_day_num}`));
const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const gaps: string[] = [];
for (let m = 1; m <= 12; m++) for (let d = 1; d <= DAYS[m - 1]; d++) if (!covered.has(`${m}-${d}`)) gaps.push(`${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`);
console.log(`📅 Cobertura: ${366 - gaps.length}/366 dias. Faltam: ${gaps.length}`);
if (gaps.length > 0 && gaps.length <= 20) console.log('   Sem santo:', gaps.join(', '));
