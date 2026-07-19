import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { getSearchTermsForTag } from './tagNormalization';
import { getAllLocalCatechism } from '@/data/catechism';
import { BIBLE_CANON } from './bibleCanon';

export interface TagContent {
  id: string;
  type: string;
  content_text: string;
  title: string;
  metadata: any;
}

// FIX BOLHA NEXUS BÍBLIA: metadata vem vazia no banco; deriva book/chapter/verse
// a partir de reference_id ("Jo 14, 6", "1Cor 13,4", "Mt 11, 29") para que
// resolveLink()/BibleVersePopover funcionem e o item não seja filtrado como no-route.
const BIBLE_ABBR_BY_LOWER = new Map(BIBLE_CANON.map(b => [b.abbr.toLowerCase(), b.abbr]));

// Schemas zod para normalização segura em runtime — evitam que payloads
// malformados vindos do banco/cache atinjam o parser e produzam NaN/undefined
// silenciosos no resolveLink.
export const ReferenceIdSchema = z
  .unknown()
  .transform((v) => (typeof v === 'string' ? v.trim() : ''))
  .pipe(z.string().max(120));

export const NexusMetadataSchema = z
  .unknown()
  .transform((v) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}))
  .pipe(z.record(z.string(), z.unknown()));

export const ParsedBibleReferenceSchema = z.object({
  book: z.string().min(1).optional(),
  chapter: z.number().int().positive().optional(),
  verse: z.number().int().positive().optional(),
});

export type ParsedBibleReference = z.infer<typeof ParsedBibleReferenceSchema>;

function parseBibleReference(ref: unknown): ParsedBibleReference {
  const safe = ReferenceIdSchema.safeParse(ref);
  if (!safe.success || !safe.data) return {};
  // Normaliza prefixo romano ("I Co" → "1 Co", "II Sm" → "2 Sm", "III Jo" → "3 Jo").
  // Só aplica quando romano é seguido por espaço, evitando conflito com "Is", "It" etc.
  const ROMAN: Record<string, string> = { I: '1', II: '2', III: '3' };
  const normalized = safe.data.replace(/^(III|II|I)\s+/i, (_, r) => `${ROMAN[r.toUpperCase()]} `);
  // Separadores aceitos entre capítulo e versículo: , : . -
  const m = normalized.match(/^([1-3]?\s?[A-Za-zÀ-ÿ]+)\.?\s+(\d+)(?:\s*[,:.\-]\s*(\d+))?/);
  if (!m) return {};
  const rawBook = m[1].replace(/\s+/g, '').toLowerCase();
  const abbr = BIBLE_ABBR_BY_LOWER.get(rawBook);
  if (!abbr) return {};
  const chapter = Number(m[2]);
  const verse = m[3] ? Number(m[3]) : undefined;
  const out = ParsedBibleReferenceSchema.safeParse({ book: abbr, chapter, verse });
  return out.success ? out.data : {};
}

export { parseBibleReference };

/**
 * Standardizes the formatting of spiritual and journey content.
 * Ensures references are never empty and have meaningful fallbacks.
 */
export function formatNexusContent(data: any, type: string): TagContent {
  const isJourney = type === 'journey';
  
  if (isJourney) {
    return {
      id: data.id,
      type: 'journey',
      content_text: data.description || data.subtitle || '',
      title: data.title || 'Jornada Espiritual',
      metadata: { ...data, is_direct_journey: true }
    };
  }

  // Spiritual contents (Bible, Catechism, Magisterium)
  let fallbackReference = 'Tradição';
  if (data.type === 'bible') fallbackReference = 'Escritura';
  else if (data.type === 'catechism') fallbackReference = 'Catecismo';
  else if (data.type === 'magisterium') fallbackReference = 'Magistério';

  // Normaliza metadata com zod: aceita apenas objeto plano; qualquer outra
  // forma (array, null, string, number) vira {} — evita spread inseguro.
  const safeMeta = NexusMetadataSchema.parse((data as any)?.metadata);
  const safeTags = Array.isArray((data as any)?.tags) ? (data as any).tags : [];
  const baseMeta: any = { ...safeMeta, tags: safeTags };

  // Enriquecimento: itens bíblicos frequentemente vêm com metadata {} no banco.
  // Parseia reference_id para popular book/chapter/verse, evitando reason:no-route.
  if (data?.type === 'bible' && (!baseMeta.book || !baseMeta.chapter)) {
    const parsed = parseBibleReference((data as any)?.reference_id);
    if (parsed.book && parsed.chapter) {
      baseMeta.book = baseMeta.book || parsed.book;
      baseMeta.chapter = baseMeta.chapter || parsed.chapter;
      if (parsed.verse && !baseMeta.verse) baseMeta.verse = parsed.verse;
    }
  }

  return {
    id: data.id,
    type: data.type,
    content_text: typeof data.content_text === 'string' ? data.content_text : '',
    title: safeTitle(data.reference_id) ?? safeTitle(data.title) ?? fallbackReference,
    metadata: baseMeta,
  };
}

/**
 * Fallback de UI: nunca renderiza "undefined", "NaN" ou "null" como texto
 * visível. Retorna string trimada ou null se o valor não for exibível.
 */
function safeTitle(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  if (!t) return null;
  if (/^(undefined|null|nan)$/i.test(t)) return null;
  // Remove tokens "undefined"/"NaN" no meio (ex.: "Mt undefined:NaN").
  const cleaned = t.replace(/\b(undefined|NaN|null)\b/gi, '').replace(/\s+/g, ' ').trim();
  return cleaned || null;
}





/**
 * Fetches and formats content for a specific tag.
 */
// STAB-003A: aceita apenas UUID v1-v5 para evitar `theme_id=eq.undefined`
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isValidUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v);

export async function fetchNexusTagContent(tag: { label: string; slug: string; id?: string }, signal?: AbortSignal): Promise<TagContent[]> {
  const searchTerms = getSearchTermsForTag(tag);

  const spiritualQuery = supabase
    .from('spiritual_contents')
    .select('*')
    .overlaps('tags', searchTerms)
    .limit(15);

  const journeyQuery = supabase
    .from('journeys')
    .select('*')
    .overlaps('tags', searchTerms)
    .limit(10);

  // STAB-003A: só consulta theme_contents quando há theme_id UUID válido.
  // Antes: `.eq('theme_id', (tag as any).id)` disparava `theme_id=eq.undefined`
  // no viewer do Magistério, gerando 400/22P02 em `/rest/v1/theme_contents`.
  const themeId = (tag as any).id;
  const themeContentQuery = isValidUuid(themeId)
    ? supabase.from('theme_contents').select('*').eq('theme_id', themeId).limit(10)
    : null;

  if (signal) {
    spiritualQuery.abortSignal(signal);
    journeyQuery.abortSignal(signal);
    themeContentQuery?.abortSignal(signal);
  }

  const [spiritualResponse, journeyResponse, themeContentResponse] = await Promise.all([
    spiritualQuery,
    journeyQuery,
    themeContentQuery ?? Promise.resolve({ data: [], error: null } as { data: any[]; error: null }),
  ]);

  if (spiritualResponse.error) throw spiritualResponse.error;
  if (journeyResponse.error) throw journeyResponse.error;
  if (themeContentResponse.error) throw themeContentResponse.error;

  const spiritual = (spiritualResponse.data || []).map(d => formatNexusContent(d, d.type));
  const journeys = (journeyResponse.data || []).map(d => formatNexusContent(d, 'journey'));
  const themeContents = (themeContentResponse.data || []).map(d => ({
    id: d.id,
    type: d.content_type,
    content_text: d.text_content || '',
    title: d.reference || d.title || 'Tradição',
    metadata: { ...d, is_theme_content: true }
  }));

  // Add local catechism data that matches search terms
  const localCatechism = getAllLocalCatechism()
    .filter(cat => cat.tags.some(t => searchTerms.includes(t)))
    .map(cat => ({
      id: cat.id,
      type: 'catechism',
      content_text: cat.conteudo,
      title: `Catecismo §${cat.paragraph}`,
      metadata: { ...cat, tags: cat.tags }
    }));

  const all = [...spiritual, ...journeys, ...themeContents, ...localCatechism];
  // Unique by ID
  return Array.from(new Map(all.map(item => [item.id, item])).values());
}

