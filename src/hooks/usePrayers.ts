/**
 * usePrayers — leitura da tabela `prayers` (Livro de Orações Cathedra).
 *
 * Sprint CAT-12 item 2 — refatoração de Orações.
 * Não invente dados. Todo conteúdo vive na tabela `prayers`.
 */
import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type PrayerCategory = Database['public']['Enums']['prayer_category'];

export interface Prayer {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  kicker: string | null;
  category: PrayerCategory;
  content: string;
  content_latin: string | null;
  explanation: string | null;
  meditation: string | null;
  estimated_seconds: number;
  order_index: number;
  tags: string[];
  source_ref: string | null;
  related_bible: string[];
  related_catechism: number[];
  related_saints: string[];
  related_glossary: string[];
}

export const PRAYER_CATEGORY_LABEL: Record<PrayerCategory, string> = {
  fundamentais: 'Fundamentais',
  marianas: 'Marianas',
  espirito_santo: 'Espírito Santo',
  santos: 'Aos Santos',
  antes_depois: 'Antes e depois',
  protecao: 'Proteção',
  momentos_do_dia: 'Momentos do dia',
  eucaristica: 'Eucarística',
  confissao_defuntos: 'Confissão e defuntos',
};

export const PRAYER_CATEGORY_ORDER: PrayerCategory[] = [
  'fundamentais',
  'marianas',
  'espirito_santo',
  'santos',
  'antes_depois',
  'protecao',
  'momentos_do_dia',
  'eucaristica',
  'confissao_defuntos',
];

/** Lista completa (publicadas), ordenada por categoria + order_index. */
export function usePrayers() {
  const [data, setData] = useState<Prayer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('prayers')
      .select('*')
      .eq('is_published', true)
      .order('category', { ascending: true })
      .order('order_index', { ascending: true });
    if (error) setError(error.message);
    setData((data ?? []) as Prayer[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<PrayerCategory, Prayer[]>();
    for (const cat of PRAYER_CATEGORY_ORDER) map.set(cat, []);
    (data ?? []).forEach((p) => map.get(p.category)?.push(p));
    return map;
  }, [data]);

  return { prayers: data ?? [], grouped, loading, error, reload: load };
}

/** Uma oração por slug. */
export function usePrayer(slug: string | undefined) {
  const [data, setData] = useState<Prayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('prayers')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      if (!alive) return;
      if (error) setError(error.message);
      setData((data ?? null) as Prayer | null);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  return { prayer: data, loading, error };
}
