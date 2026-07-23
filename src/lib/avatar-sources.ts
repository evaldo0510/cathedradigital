/**
 * Gera variantes responsivas de avatar para uso em <img srcSet sizes>.
 *
 * Suporta Supabase Storage (usa o endpoint de transformação de imagens
 * `/storage/v1/render/image/public/`) e faz fallback gracioso para URLs
 * externas (ex.: Google OAuth) devolvendo apenas o src original.
 */

export type AvatarSources = {
  src: string;
  srcSet?: string;
  sizes?: string;
};

const DEFAULT_WIDTHS = [96, 192, 384] as const;

const OBJECT_SEGMENT = '/storage/v1/object/public/';
const RENDER_SEGMENT = '/storage/v1/render/image/public/';

const isSupabaseStorageUrl = (url: string) => url.includes(OBJECT_SEGMENT) || url.includes(RENDER_SEGMENT);

const stripQuery = (url: string) => {
  const q = url.indexOf('?');
  return q === -1 ? { base: url, query: '' } : { base: url.slice(0, q), query: url.slice(q) };
};

const preservedParams = (query: string) => {
  // Mantém cache-busters como ?t=123 mas remove width/height/quality/resize
  // pré-existentes para evitar conflitos com o srcSet gerado.
  if (!query) return '';
  const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
  params.delete('width');
  params.delete('height');
  params.delete('quality');
  params.delete('resize');
  const s = params.toString();
  return s ? `&${s}` : '';
};

export const getAvatarSources = (
  url: string | null | undefined,
  widths: readonly number[] = DEFAULT_WIDTHS,
): AvatarSources | null => {
  if (!url) return null;

  if (!isSupabaseStorageUrl(url)) {
    return { src: url };
  }

  const rendered = url.includes(OBJECT_SEGMENT) ? url.replace(OBJECT_SEGMENT, RENDER_SEGMENT) : url;
  const { base, query } = stripQuery(rendered);
  const suffix = preservedParams(query);

  const build = (w: number) => `${base}?width=${w}&height=${w}&resize=cover&quality=80${suffix}`;

  const srcSet = widths.map((w) => `${build(w)} ${w}w`).join(', ');
  const largest = widths[widths.length - 1];

  return {
    src: build(largest),
    srcSet,
    // Avatar do hero tem 64px em mobile e 96px em telas ≥sm; o navegador
    // escolhe a variante mais próxima do DPR (2x → 128/192w).
    sizes: '(max-width: 640px) 64px, 96px',
  };
};
