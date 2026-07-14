import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * Cobertura do calendário de santos.
 *
 * Verifica que a tabela `saints` tem pelo menos um registro para cada dia
 * do ano (1/1..31/12, incluindo 29/02). Reporta os buracos exatos para
 * facilitar o preenchimento via admin/seed. Falha se houver qualquer dia
 * sem santo cadastrado.
 *
 * Requer VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no ambiente.
 * A policy pública de SELECT em `saints` permite a leitura anônima.
 */

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

describe('saints calendar coverage', () => {
  const skip = !url || !key;
  const t = skip ? it.skip : it;

  t('cobre todos os dias do ano', async () => {
    const supabase = createClient(url!, key!);
    const { data, error } = await supabase
      .from('saints')
      .select('feast_month, feast_day_num')
      .not('feast_month', 'is', null)
      .not('feast_day_num', 'is', null);

    expect(error).toBeNull();
    const covered = new Set<string>();
    (data || []).forEach((r: any) => covered.add(`${r.feast_month}-${r.feast_day_num}`));

    const gaps: string[] = [];
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= DAYS_IN_MONTH[m - 1]; d++) {
        if (!covered.has(`${m}-${d}`)) gaps.push(`${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`);
      }
    }

    if (gaps.length > 0) {
      // Log detalhado para facilitar diagnóstico no CI.
      console.warn(`[saints-coverage] ${gaps.length} dia(s) sem santo:\n${gaps.join(', ')}`);
    }
    expect(gaps, `Dias sem santo cadastrado: ${gaps.join(', ')}`).toHaveLength(0);
  }, 30000);
});
