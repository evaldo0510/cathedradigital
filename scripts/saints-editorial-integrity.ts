#!/usr/bin/env bun
/**
 * saints-editorial-integrity — bloqueia PRs que tentam publicar doutores sem os
 * campos mínimos exigidos pela Constituição Editorial.
 *
 * Regras (para category='doctor' com editorial_status='published'):
 *  - bio         ≥ 150 chars
 *  - full_bio    ≥ 800 chars
 *  - works       ≥ 1 item (jsonb array)
 *  - iconography ≥ 1 item
 *  - prayer      não vazio
 *  - source_url  não vazio
 *  - ≥ 3 arestas em nexus_relations
 *  - editorial_score ≥ 85
 *
 * Uso: bun scripts/saints-editorial-integrity.ts
 * Exit 1 em qualquer violação.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('❌ VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY não definidos.');
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

interface Row {
  id: string;
  name: string;
  bio: string | null;
  full_bio: string | null;
  works: unknown;
  iconography: unknown;
  prayer: string | null;
  source_url: string | null;
  editorial_score: number | null;
}

const { data, error } = await supabase
  .from('saints')
  .select('id,name,bio,full_bio,works,iconography,prayer,source_url,editorial_score')
  .eq('category', 'doctor')
  .eq('editorial_status', 'published');

if (error) {
  console.error('❌ erro consultando saints:', error.message);
  process.exit(2);
}

const rows = (data ?? []) as Row[];
const violations: string[] = [];

for (const r of rows) {
  const gaps: string[] = [];
  if (!r.bio || r.bio.length < 150) gaps.push('bio<150');
  if (!r.full_bio || r.full_bio.length < 800) gaps.push('full_bio<800');
  const works = Array.isArray(r.works) ? r.works : [];
  if (works.length < 1) gaps.push('sem works');
  const icono = Array.isArray(r.iconography) ? r.iconography : (r.iconography ? [r.iconography] : []);
  if (icono.length < 1) gaps.push('sem iconography');
  if (!r.prayer) gaps.push('sem prayer');
  if (!r.source_url) gaps.push('sem source_url');
  if ((r.editorial_score ?? 0) < 85) gaps.push(`score=${r.editorial_score ?? 0}<85`);

  const { count: nexusCount } = await supabase
    .from('nexus_relations')
    .select('*', { count: 'exact', head: true })
    .or(`source_ref.eq.${r.id},target_ref.eq.${r.id}`);
  if ((nexusCount ?? 0) < 3) gaps.push(`nexus=${nexusCount ?? 0}<3`);

  if (gaps.length > 0) violations.push(`  · ${r.id} (${r.name}): ${gaps.join(', ')}`);
}

console.log(`\n[saints-editorial-integrity] auditados ${rows.length} doutor(es) publicado(s).`);

if (violations.length > 0) {
  console.error(`\n❌ ${violations.length} violação(ões) editorial(is):\n${violations.join('\n')}`);
  process.exit(1);
}

console.log('✅ Todos os doutores publicados cumprem os requisitos mínimos.');
process.exit(0);
