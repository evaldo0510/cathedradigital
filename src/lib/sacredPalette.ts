export const SACRED_PALETTE: Record<string, { primary: string; accent: string; depth: string }> = {
  green: { primary: '#064e3b', accent: '#059669', depth: '#022c22' },
  red: { primary: '#450a0a', accent: '#dc2626', depth: '#2d0606' },
  purple: { primary: '#2e1065', accent: '#7c3aed', depth: '#1e0a3d' },
  rose: { primary: '#500724', accent: '#db2777', depth: '#310415' },
  black: { primary: '#1c1917', accent: '#44403c', depth: '#0c0a09' },
  white: { primary: '#e5e5e0', accent: '#d4af37', depth: '#a8a29e' },
  gold: { primary: '#451a03', accent: '#fbbf24', depth: '#290f02' },
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
