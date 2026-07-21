/**
 * Prayer Engine — carregador da hierarquia do banco.
 *
 * Sprint 1.0 — Fase A/D. Lê `prayer_sections → prayer_mysteries → prayer_blocks`
 * do Supabase e produz um `PrayerBlock[]` linear compatível com o `RosaryReader`
 * (que fará papel de `PrayerReader` unificado nesta primeira onda).
 *
 * A hierarquia continua no banco; o achatamento é apenas uma visão de leitura
 * para o Reader atual. Fase seguinte substitui o Reader por navegação
 * hierárquica nativa sem alterar o schema.
 */
import { supabase } from '@/integrations/supabase/client';
import type { PrayerBlock } from '@/types/prayer';

export interface DBSection {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  order_index: number;
  weekdays: number[];
  meta: Record<string, unknown>;
}
export interface DBMystery {
  id: string;
  section_id: string;
  slug: string;
  title: string;
  order_index: number;
  gospel_ref: string | null;
  meditation: string | null;
  fruit: string | null;
}
export interface DBBlock {
  id: string;
  section_id: string | null;
  mystery_id: string | null;
  type: string;
  title: string | null;
  content: Record<string, unknown> | null;
  repeat_count: number;
  order_index: number;
}

export interface PrayerHierarchy {
  prayerId: string;
  sections: DBSection[];
  mysteries: DBMystery[];
  blocks: DBBlock[];
}

const BLOCK_KIND_MAP: Record<string, PrayerBlock['kind']> = {
  announce: 'mystery',
  pater_noster: 'prayer',
  ave_maria: 'decade',
  gloria: 'prayer',
  fatima: 'prayer',
  meditation: 'meditation',
  intro: 'intro',
  closing: 'closing',
};

const REPEAT_LABEL: Record<string, string> = {
  ave_maria: 'Ave-Maria',
};

/** Escolhe a seção para o dia da semana (0=Dom). */
export function pickSectionForDay(sections: DBSection[], day = new Date().getDay()): DBSection | null {
  if (!sections.length) return null;
  const match = sections.find((s) => (s.weekdays ?? []).includes(day));
  return match ?? sections[0];
}

export async function loadPrayerHierarchyBySlug(slug: string): Promise<PrayerHierarchy | null> {
  const { data: prayer, error: pe } = await supabase
    .from('prayers')
    .select('id, engine_version')
    .eq('slug', slug)
    .maybeSingle();
  if (pe || !prayer) return null;

  const [sectionsRes, mysteriesRes, blocksRes] = await Promise.all([
    supabase
      .from('prayer_sections')
      .select('*')
      .eq('prayer_id', prayer.id)
      .order('order_index'),
    supabase
      .from('prayer_mysteries')
      .select('*, prayer_sections!inner(prayer_id)')
      .eq('prayer_sections.prayer_id', prayer.id)
      .order('order_index'),
    supabase
      .from('prayer_blocks')
      .select('*')
      .eq('prayer_id', prayer.id)
      .order('order_index'),
  ]);

  if (sectionsRes.error || mysteriesRes.error || blocksRes.error) return null;

  return {
    prayerId: prayer.id,
    sections: (sectionsRes.data ?? []) as DBSection[],
    mysteries: (mysteriesRes.data ?? []).map((m: any) => ({
      id: m.id,
      section_id: m.section_id,
      slug: m.slug,
      title: m.title,
      order_index: m.order_index,
      gospel_ref: m.gospel_ref,
      meditation: m.meditation,
      fruit: m.fruit,
    })),
    blocks: (blocksRes.data ?? []) as DBBlock[],
  };
}

/** Achata a hierarquia (para uma seção específica) em `PrayerBlock[]`. */
export function flattenSectionToBlocks(
  hierarchy: PrayerHierarchy,
  section: DBSection,
): PrayerBlock[] {
  const mysteries = hierarchy.mysteries
    .filter((m) => m.section_id === section.id)
    .sort((a, b) => a.order_index - b.order_index);

  const out: PrayerBlock[] = [];
  let orderCounter = 0;

  for (const mystery of mysteries) {
    const mysteryBlocks = hierarchy.blocks
      .filter((b) => b.mystery_id === mystery.id)
      .sort((a, b) => a.order_index - b.order_index);

    for (const b of mysteryBlocks) {
      const kind = BLOCK_KIND_MAP[b.type] ?? 'prayer';
      const content = b.content ?? {};
      const text = typeof content.text === 'string' ? content.text : undefined;
      const latin = typeof content.latin === 'string' ? content.latin : undefined;
      const medText = typeof content.meditation === 'string' ? content.meditation : undefined;
      const gospelRef =
        typeof content.gospel_ref === 'string' ? content.gospel_ref : mystery.gospel_ref ?? undefined;
      const fruit = typeof content.fruit === 'string' ? content.fruit : undefined;

      const block: PrayerBlock = {
        id: b.id,
        kind,
        order: orderCounter++,
        title: b.type === 'announce' ? mystery.title : b.title ?? mystery.title,
        subtitle: b.type === 'announce' ? section.title : undefined,
        body: text,
        latin,
        meditation:
          b.type === 'announce'
            ? medText ?? mystery.meditation ?? undefined
            : b.type === 'meditation'
              ? text ?? mystery.meditation ?? undefined
              : undefined,
        fruit: b.type === 'meditation' ? fruit ?? mystery.fruit ?? undefined : undefined,
        refs: gospelRef && b.type === 'announce' ? { bible: [gospelRef] } : undefined,
        mysteryId: mystery.id,
        sectionId: section.id,
        sourceType: b.type,
      };

      if (b.repeat_count > 1) {
        block.repeat = {
          label: REPEAT_LABEL[b.type] ?? b.title ?? b.type,
          count: b.repeat_count,
          text: text ?? undefined,
        };
      }

      out.push(block);
    }
  }
  return out;
}
