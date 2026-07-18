export const SACRED_PALETTE: Record<string, { primary: string; accent: string; depth: string }> = {
  green: { primary: '#0D2442', accent: '#BFA366', depth: '#061221' }, // Muted blue-green
  red: { primary: '#BFA366', accent: '#0D2442', depth: '#7A6438' }, // Muted gold-red
  purple: { primary: '#0D2442', accent: '#BFA366', depth: '#061221' },
  rose: { primary: '#BFA366', accent: '#0D2442', depth: '#7A6438' },
  black: { primary: '#1A1A1A', accent: '#BFA366', depth: '#000000' },
  white: { primary: '#FFFFFF', accent: '#BFA366', depth: '#F5F5F5' },
  gold: { primary: '#0D2442', accent: '#BFA366', depth: '#061221' },
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
  if (src.includes('wikimedia.org') || src.includes('wikipedia.org')) {
    // Wikimedia bloqueia parte das requisições cross-origin com ERR_BLOCKED_BY_ORB
    // mesmo com referrerPolicy=no-referrer. Servimos via proxy wsrv.nl (CORS-friendly).
    let upscaled = src;
    if (src.includes('/thumb/')) {
      upscaled = src.replace(/\/\d+px-/g, `/${priority ? '1024' : '800'}px-`);
    }
    const stripped = upscaled.replace(/^https?:\/\//, '');
    return `https://wsrv.nl/?url=${encodeURIComponent(stripped)}&w=${priority ? 1024 : 800}&output=webp&q=${priority ? 85 : 75}`;
  }
  return src;
}
