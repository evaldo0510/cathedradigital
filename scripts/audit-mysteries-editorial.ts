/**
 * Auditor de completude editorial dos 20 mistérios do Rosário.
 *
 * Critério de aceite da Entrega 1A: nenhum mistério pode usar fallback.
 * Todo campo obrigatório deve estar preenchido em `prayer_mysteries.meta`.
 *
 * Uso:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_PUBLISHABLE_KEY=... \
 *     bun run scripts/audit-mysteries-editorial.ts
 *
 * Sai com código 1 se algum mistério estiver incompleto (falha o CI).
 */
import { createClient } from '@supabase/supabase-js';

const REQUIRED_STRING_FIELDS = [
  'contemplative_title',
  'logos_meditation',
  'virtue',
  'spiritual_fruit',
  'closing_prayer',
  'concrete_action',
  'recommended_intention',
  'image_slug',
  'image_collection',
] as const;

const REQUIRED_ARRAY_FIELDS: Array<{ key: string; min: number }> = [
  { key: 'contemplation_invitation', min: 3 },
  { key: 'complementary_passages', min: 2 },
  { key: 'catechism_refs', min: 1 },
  { key: 'church_fathers', min: 1 },
  { key: 'magisterium_refs', min: 1 },
  { key: 'related_saints', min: 2 },
  { key: 'bibliography', min: 1 },
];

const EXPECTED_SLUGS = [
  'joyful-1','joyful-2','joyful-3','joyful-4','joyful-5',
  'luminous-1','luminous-2','luminous-3','luminous-4','luminous-5',
  'sorrowful-1','sorrowful-2','sorrowful-3','sorrowful-4','sorrowful-5',
  'glorious-1','glorious-2','glorious-3','glorious-4','glorious-5',
];

interface Row {
  slug: string;
  title: string;
  meta: Record<string, unknown> | null;
}

async function main() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.error('✖ VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY são obrigatórios.');
    process.exit(2);
  }
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('prayer_mysteries')
    .select('slug, title, meta')
    .in('slug', EXPECTED_SLUGS);

  if (error) {
    console.error('✖ Falha ao carregar mistérios:', error.message);
    process.exit(2);
  }

  const rows = (data ?? []) as Row[];
  const bySlug = new Map(rows.map((r) => [r.slug, r]));

  const problems: string[] = [];

  for (const slug of EXPECTED_SLUGS) {
    const row = bySlug.get(slug);
    if (!row) {
      problems.push(`${slug}: mistério ausente no banco`);
      continue;
    }
    const meta = row.meta ?? {};

    for (const field of REQUIRED_STRING_FIELDS) {
      const v = (meta as any)[field];
      if (typeof v !== 'string' || v.trim().length === 0) {
        problems.push(`${slug}.${field}: string vazia ou ausente`);
      }
    }

    for (const { key: field, min } of REQUIRED_ARRAY_FIELDS) {
      const v = (meta as any)[field];
      if (!Array.isArray(v) || v.length < min) {
        problems.push(`${slug}.${field}: esperado array com ≥${min} itens, encontrado ${Array.isArray(v) ? v.length : typeof v}`);
      }
    }

    const primary = (meta as any).primary_passage;
    if (!primary || typeof primary.ref !== 'string' || !primary.ref.trim()) {
      problems.push(`${slug}.primary_passage.ref: ausente`);
    }

    const ico = (meta as any).iconography;
    if (!ico || typeof ico.description !== 'string' || !ico.description.trim()) {
      problems.push(`${slug}.iconography.description: ausente`);
    }
  }

  if (problems.length > 0) {
    console.error(`✖ Auditoria editorial FALHOU (${problems.length} problemas):`);
    for (const p of problems) console.error('  •', p);
    process.exit(1);
  }

  console.log(`✓ Auditoria editorial: 20/20 mistérios completos, zero fallback.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
