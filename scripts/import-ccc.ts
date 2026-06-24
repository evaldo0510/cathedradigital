/**
 * Importador em lote do Catecismo da Igreja Católica (CCC) completo (1–2865).
 *
 * Uso:
 *   SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  \
 *   bunx tsx scripts/import-ccc.ts ./data/ccc.json [--batch=200] [--dry-run]
 *
 * Formato esperado do JSON (array OU mapa por número):
 *   [
 *     { "paragraph": 1, "content": "A vida do homem...",
 *       "texto_base": "...", "explicacao": "...",
 *       "interpretacao_profunda": "...", "aplicacao_pratica": "...",
 *       "reflexao_final": "...", "exercicio": "..." },
 *     ...
 *   ]
 *
 * Garante:
 *  - Validação por Zod de cada item (campos opcionais aceitos)
 *  - Upsert idempotente (PK = paragraph)
 *  - Faixas válidas (1..2865)
 *  - Lotes configuráveis para não estourar limites do PostgREST
 *  - Logs estruturados (count ok/skip/erro) e código de saída != 0 em falha
 *  - Modo --dry-run para conferir antes de gravar
 *
 * RLS: a tabela `catechism_official` só permite leitura pública. Para inserir
 * em massa, o script usa a SERVICE_ROLE_KEY (bypass RLS) — execute apenas em
 * ambiente confiável.
 */

import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const CCC_MIN = 1;
const CCC_MAX = 2865;

const ParagraphSchema = z.object({
  paragraph: z.number().int().min(CCC_MIN).max(CCC_MAX),
  content: z.string().min(1),
  texto_base: z.string().optional().nullable(),
  explicacao: z.string().optional().nullable(),
  interpretacao_profunda: z.string().optional().nullable(),
  aplicacao_pratica: z.string().optional().nullable(),
  reflexao_final: z.string().optional().nullable(),
  exercicio: z.string().optional().nullable(),
});

type Paragraph = z.infer<typeof ParagraphSchema>;

function parseArgs(argv: string[]) {
  const file = argv.find((a) => !a.startsWith('--'));
  const batch = Number((argv.find((a) => a.startsWith('--batch=')) || '--batch=200').split('=')[1]) || 200;
  const dryRun = argv.includes('--dry-run');
  if (!file) {
    throw new Error('Uso: tsx scripts/import-ccc.ts <arquivo.json> [--batch=200] [--dry-run]');
  }
  return { file, batch, dryRun };
}

function normalizeInput(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>).map(([k, v]) => {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        return { paragraph: Number(k), ...(v as object) };
      }
      return { paragraph: Number(k), content: String(v ?? '') };
    });
  }
  throw new Error('JSON inválido: esperado array ou objeto { "1": {...} }.');
}

async function main() {
  const { file, batch, dryRun } = parseArgs(process.argv.slice(2));
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.');
  }

  console.log(`[ccc-import] lendo ${file}`);
  const buf = await readFile(file, 'utf8');
  const items = normalizeInput(JSON.parse(buf));
  console.log(`[ccc-import] ${items.length} entradas detectadas (lote=${batch}, dryRun=${dryRun})`);

  const valid: Paragraph[] = [];
  const invalid: { index: number; errors: string[] }[] = [];
  for (let i = 0; i < items.length; i++) {
    const parsed = ParagraphSchema.safeParse(items[i]);
    if (parsed.success) valid.push(parsed.data);
    else invalid.push({ index: i, errors: parsed.error.issues.map((iss) => `${iss.path.join('.')}: ${iss.message}`) });
  }

  // Deduplicar por número de parágrafo, mantendo o último vencendo (sobrepõe).
  const dedupMap = new Map<number, Paragraph>();
  for (const p of valid) dedupMap.set(p.paragraph, p);
  const rows = [...dedupMap.values()].sort((a, b) => a.paragraph - b.paragraph);

  console.log(`[ccc-import] válidos=${valid.length} inválidos=${invalid.length} únicos=${rows.length}`);
  if (invalid.length) {
    console.warn('[ccc-import] primeiros inválidos:', invalid.slice(0, 5));
  }

  if (dryRun) {
    console.log('[ccc-import] dry-run concluído — nada foi gravado.');
    process.exit(invalid.length ? 2 : 0);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  let inserted = 0;
  for (let i = 0; i < rows.length; i += batch) {
    const slice = rows.slice(i, i + batch);
    const { error } = await supabase.from('catechism_official').upsert(slice, { onConflict: 'paragraph' });
    if (error) {
      console.error(`[ccc-import] FALHA lote ${i}..${i + slice.length - 1}:`, error.message);
      process.exit(1);
    }
    inserted += slice.length;
    console.log(`[ccc-import] gravados ${inserted}/${rows.length}`);
  }

  const { count, error: countErr } = await supabase
    .from('catechism_official')
    .select('paragraph', { count: 'exact', head: true });
  if (countErr) console.warn('[ccc-import] não foi possível confirmar total:', countErr.message);
  else console.log(`[ccc-import] total atual na base: ${count}`);

  console.log('[ccc-import] concluído com sucesso ✅');
  process.exit(invalid.length ? 2 : 0);
}

main().catch((err) => {
  console.error('[ccc-import] erro fatal:', err);
  process.exit(1);
});
