import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

/**
 * Validação de schema dos registros da tabela `saints`.
 *
 * Requer VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no ambiente.
 * Falha se qualquer registro violar os campos obrigatórios.
 */

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const SaintRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  title: z.string().nullable().optional(),
  feast_month: z.number().int().min(1).max(12),
  feast_day_num: z.number().int().min(1).max(31),
  bio: z.string().min(1).nullable(),
  full_bio: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  prayer: z.string().nullable().optional(),
  source_name: z.string().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  bio_source_url: z.string().url().nullable().optional(),
  prayer_source_url: z.string().url().nullable().optional(),
  content_hash: z.string().nullable().optional(),
  last_scraped_at: z.string().nullable().optional(),
});

export type SaintRow = z.infer<typeof SaintRowSchema>;

describe('saints row schema', () => {
  const skip = !url || !key;
  const t = skip ? it.skip : it;

  t('todos os registros satisfazem o schema obrigatório', async () => {
    const supabase = createClient(url!, key!);
    const { data, error } = await supabase
      .from('saints')
      .select(
        'id,name,title,feast_month,feast_day_num,bio,full_bio,category,prayer,source_name,source_url,bio_source_url,prayer_source_url,content_hash,last_scraped_at'
      );

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);

    const invalid: { id: unknown; issues: string[] }[] = [];
    for (const row of data || []) {
      const parsed = SaintRowSchema.safeParse(row);
      if (!parsed.success) {
        invalid.push({
          id: (row as any)?.id,
          issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
        });
      }
    }
    if (invalid.length > 0) {
      console.warn(`[saints-schema] ${invalid.length} registro(s) inválido(s):\n${invalid.slice(0, 20).map((r) => `${r.id} → ${r.issues.join('; ')}`).join('\n')}`);
    }
    expect(invalid, `Registros inválidos: ${invalid.length}`).toHaveLength(0);
  }, 30000);

  t('cada dia com registro tem pelo menos um santo com bio não-vazia', async () => {
    const supabase = createClient(url!, key!);
    const { data } = await supabase.from('saints').select('feast_month,feast_day_num,bio');
    const byDay = new Map<string, boolean>();
    for (const r of data || []) {
      const k = `${(r as any).feast_month}-${(r as any).feast_day_num}`;
      byDay.set(k, byDay.get(k) || Boolean((r as any).bio && String((r as any).bio).trim()));
    }
    const empty = Array.from(byDay.entries()).filter(([, ok]) => !ok).map(([k]) => k);
    expect(empty, `Dias sem bio: ${empty.join(', ')}`).toHaveLength(0);
  }, 30000);
});
