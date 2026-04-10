export const SACRED_PALETTE: Record<string, { primary: string; accent: string; depth: string }> = {
  green: { primary: '#0B1F3A', accent: '#C8A96A', depth: '#050D19' },
  red: { primary: '#C8A96A', accent: '#0B1F3A', depth: '#8A713F' },
  purple: { primary: '#0B1F3A', accent: '#C8A96A', depth: '#050D19' },
  rose: { primary: '#C8A96A', accent: '#0B1F3A', depth: '#8A713F' },
  black: { primary: '#1A1A1A', accent: '#C8A96A', depth: '#000000' },
  white: { primary: '#FFFFFF', accent: '#C8A96A', depth: '#F0F0F0' },
  gold: { primary: '#0B1F3A', accent: '#C8A96A', depth: '#050D19' },
};

export function getInitials(name: string): string {
  const skip = new Set(['são', 'santa', 'santo', 'de', 'da', 'do', 'dos', 'das', 'e', 'a', 'o', 'the', 'of']);
  const words = name.split(/\s+/).filter(w => !skip.has(w.toLowerCase()));
  if (words.length === 0) return name.charAt(0).toUpperCase();
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function resolveColors(liturgicalColor?: string, dominantColor?: string) {
  const colorKey = liturgicalColor?.toLowerCase() || 'gold';
  const palette = SACRED_PALETTE[colorKey] || SACRED_PALETTE.gold;
  return {
    base: dominantColor || palette.primary,
    accent: dominantColor ? `${dominantColor}cc` : palette.accent,
    depth: dominantColor ? `${dominantColor}66` : palette.depth,
  };
}

export function buildImageSrc(src: string, priority: boolean): string {
  if (!src) return '';
  if (src.includes('unsplash.com')) {
    const base = src.split('?')[0];
    return `${base}?auto=format&fit=crop&q=${priority ? '85' : '75'}&w=${priority ? '1400' : '800'}`;
  }
  return src;
}
