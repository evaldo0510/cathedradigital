/**
 * saintToEditorialData — adapta o registro `Saint` (schema do banco,
 * formatado por `formatSaint`) para o contrato `SaintEditorialData`
 * consumido por `buildSaintPage`.
 *
 * Função pura. Sem side-effects. Base para regressão automática.
 */
import type { Saint } from '@/data/saints';
import type {
  SaintCategory,
  SaintEditorialData,
  SaintSourceRef,
  SaintTimelineEvent as EditorialTimelineEvent,
  SaintVirtue,
  SaintWritingRef,
} from './types';

const DOCTOR_CATEGORIES = new Set(['doctor']);
const MARTYR_CATEGORIES = new Set(['martyr']);
const FATHER_CATEGORIES = new Set(['father']);

function toEditorialCategory(cat: Saint['category'] | string | undefined): SaintCategory {
  if (!cat) return 'saint';
  if (DOCTOR_CATEGORIES.has(cat)) return 'doctor';
  if (MARTYR_CATEGORIES.has(cat)) return 'martyr';
  if (FATHER_CATEGORIES.has(cat)) return 'father';
  return 'saint';
}

function slugifyWork(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function saintToEditorialData(saint: Saint): SaintEditorialData {
  const header = {
    name: saint.name,
    category: toEditorialCategory(saint.category),
    epoch: saint.century ? `Século ${saint.century}` : undefined,
    region: saint.country ?? undefined,
    patronOf: (saint.patronOf ?? []).length > 0 ? saint.patronOf : undefined,
    feast: saint.feastDay
      ? { dateLabel: saint.feastDay }
      : undefined,
    iconography:
      saint.iconography && (saint.iconography.attributes?.length || saint.image)
        ? {
            attributes: saint.iconography.attributes,
            imageUrl: saint.image,
            imageAlt: saint.name,
          }
        : saint.image
          ? { imageUrl: saint.image, imageAlt: saint.name }
          : undefined,
    shortBio: saint.bio && saint.bio.trim().length > 0 ? saint.bio : undefined,
  };

  const timeline: EditorialTimelineEvent[] = (saint.timeline ?? [])
    .filter((t) => t && t.event)
    .map((t) => ({
      year: t.year != null ? String(t.year) : '',
      title: t.event,
      detail: t.place || undefined,
    }));

  const virtues: SaintVirtue[] = (saint.virtues ?? [])
    .filter((v): v is string => Boolean(v))
    .map((v) => ({ label: v }));

  const writings: SaintWritingRef[] = (saint.works ?? [])
    .filter((w) => w && w.title)
    .map((w) => {
      const externalUrl = w.url;
      // Regra: obra com URL do próprio Cathedra vira link interno (hosted).
      const isInternal = Boolean(externalUrl && /^\/(biblioteca|acervo|escritos)\//.test(externalUrl));
      return {
        id: slugifyWork(w.title),
        title: w.title,
        slug: isInternal ? externalUrl!.replace(/^\/biblioteca\/escritos\//, '') : undefined,
        externalUrl: isInternal ? undefined : externalUrl,
        externalSourceLabel: externalUrl ? new URL(externalUrl, 'https://cathedra').hostname : undefined,
      };
    });

  const sources: SaintSourceRef[] = (saint.sources ?? [])
    .filter((s) => s && s.title)
    .map((s) => ({
      label: s.title,
      url: s.url,
      citation: [s.author, s.year].filter(Boolean).join(', ') || undefined,
    }));

  return {
    slug: saint.id,
    header,
    longBio: saint.fullBio && saint.fullBio.trim().length > 0 ? saint.fullBio : undefined,
    timeline: timeline.length > 0 ? timeline : undefined,
    virtues: virtues.length > 0 ? virtues : undefined,
    writings: writings.length > 0 ? writings : undefined,
    // prayers: virá do `saint_prayers_links` em sprint dedicada.
    prayers: undefined,
    sources: sources.length > 0 ? sources : undefined,
  };
}
