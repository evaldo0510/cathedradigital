/**
 * Sprint B.1 · Onda B.1.2 — Searchers por módulo.
 *
 * Cada função consulta a tabela publicada com `ilike` em campos textuais
 * relevantes e retorna dados brutos + shape mínimo. O ranking (score,
 * doutrina, ICE, nexus) é aplicado em `searchLibrary.ts`. Nada de RPCs
 * novos: reaproveita as tabelas já governadas pelo Editorial Engine.
 */
import { supabase } from '@/integrations/supabase/client';
import type { LibraryIce, LibraryModule } from '../types';

export interface RawHit {
  type: LibraryModule;
  id: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  editorialStatus?: LibraryIce;
  href: string;
  /** Chave usada para consultar nexus_relations (ex.: `glossary:{slug}`). */
  nexusRef?: { kind: string; ref: string };
}

const iceFrom = (v: unknown): LibraryIce | undefined =>
  v === 'complete' || v === 'review' || v === 'draft' ? v : undefined;

const like = (q: string) => `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;

async function searchGlossary(q: string, limit: number): Promise<RawHit[]> {
  const l = like(q);
  const { data } = await supabase
    .from('glossary')
    .select('slug, term, short_definition, category, editorial_completeness')
    .eq('status', 'published')
    .or(`term.ilike.${l},short_definition.ilike.${l},definition.ilike.${l}`)
    .limit(limit);
  return (data ?? []).map((r) => ({
    type: 'glossary',
    id: r.slug ?? '',
    title: r.term ?? '',
    subtitle: r.category ?? undefined,
    excerpt: r.short_definition ?? undefined,
    editorialStatus: iceFrom(r.editorial_completeness),
    href: `/glossario/${r.slug}`,
    nexusRef: r.slug ? { kind: 'glossary', ref: r.slug } : undefined,
  }));
}

async function searchBible(q: string, limit: number): Promise<RawHit[]> {
  // Onda B.1.2 — busca apenas em livros (bible_verses exigiria join com
  // bible_chapters → bible_books). Verse-level search entra na B.1.4 (semântica).
  const l = like(q);
  const { data } = await supabase
    .from('bible_books')
    .select('id, abbrev, name, testament')
    .or(`name.ilike.${l},abbrev.ilike.${l}`)
    .limit(limit);
  return (data ?? []).map((r) => ({
    type: 'bible',
    id: `book:${r.abbrev}`,
    title: r.name ?? r.abbrev ?? '',
    subtitle: r.testament ?? undefined,
    href: `/biblia/${r.abbrev}/1`,
  }));
}

async function searchCatechism(q: string, limit: number): Promise<RawHit[]> {
  const l = like(q);
  const { data } = await supabase
    .from('catechism_official')
    .select('paragraph, slug, texto_base')
    .eq('status', 'published')
    .ilike('texto_base', l)
    .limit(limit);
  return (data ?? []).map((r) => ({
    type: 'catechism',
    id: String(r.paragraph),
    title: `§ ${r.paragraph}`,
    excerpt: r.texto_base ? r.texto_base.slice(0, 260) : undefined,
    href: `/catechism/${r.paragraph}`,
    nexusRef: { kind: 'catechism', ref: String(r.paragraph) },
  }));
}

async function searchSaints(q: string, limit: number): Promise<RawHit[]> {
  const l = like(q);
  const { data } = await supabase
    .from('saints')
    .select('id, name, title, bio, category, content_status')
    .or(`name.ilike.${l},title.ilike.${l},bio.ilike.${l}`)
    .neq('status', 'merged')
    .limit(limit);

  return (data ?? []).map((r) => ({
    type: 'saints',
    id: String(r.id),
    title: r.name ?? '',
    subtitle: r.title ?? r.category ?? undefined,
    excerpt: r.bio ? String(r.bio).slice(0, 240) : undefined,
    editorialStatus: iceFrom(r.content_status),
    href: `/santos/${r.id}`,
    nexusRef: { kind: 'saint', ref: String(r.id) },
  }));
}

async function searchPrayers(q: string, limit: number): Promise<RawHit[]> {
  const l = like(q);
  const { data } = await supabase
    .from('prayers')
    .select('id, slug, title, subtitle, category, kicker')
    .eq('is_published', true)
    .or(`title.ilike.${l},subtitle.ilike.${l},kicker.ilike.${l}`)
    .limit(limit);
  return (data ?? []).map((r) => ({
    type: 'prayers',
    id: r.slug ?? String(r.id),
    title: r.title ?? '',
    subtitle: r.category ?? undefined,
    excerpt: r.subtitle ?? r.kicker ?? undefined,
    href: `/oracao/${r.slug ?? r.id}`,
    nexusRef: r.slug ? { kind: 'prayer', ref: r.slug } : undefined,
  }));
}

async function searchCollections(q: string, limit: number): Promise<RawHit[]> {
  const l = like(q);
  const { data } = await supabase
    .from('collections')
    .select('id, slug, title, subtitle, description, category')
    .eq('status', 'published')
    .or(`title.ilike.${l},subtitle.ilike.${l},description.ilike.${l}`)
    .limit(limit);
  return (data ?? []).map((r) => ({
    type: 'collections',
    id: r.slug ?? String(r.id),
    title: r.title ?? '',
    subtitle: r.category ?? undefined,
    excerpt: r.subtitle ?? r.description ?? undefined,
    href: `/colecoes/${r.slug ?? r.id}`,
    nexusRef: r.slug ? { kind: 'collection', ref: r.slug } : undefined,
  }));
}

async function searchJourneys(q: string, limit: number): Promise<RawHit[]> {
  const l = like(q);
  const { data } = await supabase
    .from('journeys')
    .select('id, slug, title, subtitle, description, category')
    .eq('status', 'published')
    .or(`title.ilike.${l},subtitle.ilike.${l},description.ilike.${l}`)
    .limit(limit);
  return (data ?? []).map((r) => ({
    type: 'journeys',
    id: r.slug ?? String(r.id),
    title: r.title ?? '',
    subtitle: r.category ?? undefined,
    excerpt: r.subtitle ?? r.description ?? undefined,
    href: `/jornadas/${r.slug ?? r.id}`,
    nexusRef: r.slug ? { kind: 'journey', ref: r.slug } : undefined,
  }));
}

async function searchSpiritual(
  type: 'magisterium' | 'patristics',
  q: string,
  limit: number,
): Promise<RawHit[]> {
  const l = like(q);
  const { data } = await supabase
    .from('spiritual_contents')
    .select('id, title, content_text, tags, reference_id')
    .eq('type', type)
    .or(`title.ilike.${l},content_text.ilike.${l}`)
    .limit(limit);
  return (data ?? []).map((r) => {
    const slug = r.reference_id ?? String(r.id);
    const encoded = encodeURIComponent(slug);
    return {
      type,
      id: String(r.id),
      title: r.title ?? '',
      excerpt: r.content_text ? String(r.content_text).slice(0, 240) : undefined,
      href: type === 'magisterium' ? `/magisterium/${encoded}` : `/biblioteca/padres/${encoded}`,
    };
  });
}

async function searchLiturgy(q: string, limit: number): Promise<RawHit[]> {
  const l = like(q);
  const { data } = await supabase
    .from('missal_propers')
    .select('id, iso_date, celebration_title, liturgical_color')
    .ilike('celebration_title', l)
    .order('iso_date', { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => ({
    type: 'liturgy',
    id: String(r.id),
    title: r.celebration_title ?? r.iso_date ?? 'Missal',
    subtitle: r.liturgical_color ?? undefined,
    excerpt: r.iso_date ?? undefined,
    href: `/missal/${r.iso_date ?? r.id}`,
  }));
}

export const MODULE_SEARCHERS: Record<LibraryModule, (q: string, limit: number) => Promise<RawHit[]>> = {
  glossary: searchGlossary,
  bible: searchBible,
  catechism: searchCatechism,
  saints: searchSaints,
  prayers: searchPrayers,
  collections: searchCollections,
  journeys: searchJourneys,
  magisterium: (q, l) => searchSpiritual('magisterium', q, l),
  patristics: (q, l) => searchSpiritual('patristics', q, l),
  liturgy: searchLiturgy,
};
