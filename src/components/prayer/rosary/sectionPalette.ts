/**
 * Paletas litúrgicas por seção do Rosário — Onda B.
 * A identidade visual (navy/gold do Cathedra) é mantida; muda apenas o
 * acento contemplativo aplicado ao overlay/hero/dots do mistério ativo.
 */
export type MysterySectionKey = 'gozosos' | 'luminosos' | 'dolorosos' | 'gloriosos';

export interface MysteryPalette {
  key: MysterySectionKey | 'default';
  label: string;
  /** Gradiente overlay atrás do hero e do modo contemplação. */
  overlayGradient: string;
  /** Cor de foco para dots, filetes, ícones do mistério. */
  accentClass: string;
  /** Sombra sutil ao redor do hero. */
  glow: string;
}

const PALETTES: Record<MysterySectionKey, MysteryPalette> = {
  gozosos: {
    key: 'gozosos',
    label: 'Gozosos',
    overlayGradient:
      'from-amber-100/25 via-amber-50/10 to-transparent dark:from-amber-500/15 dark:via-amber-900/10 dark:to-transparent',
    accentClass: 'text-amber-500',
    glow: 'shadow-[0_0_120px_-40px_rgba(217,169,74,0.55)]',
  },
  luminosos: {
    key: 'luminosos',
    label: 'Luminosos',
    overlayGradient:
      'from-white/40 via-amber-50/20 to-transparent dark:from-white/10 dark:via-amber-300/10 dark:to-transparent',
    accentClass: 'text-amber-300',
    glow: 'shadow-[0_0_140px_-30px_rgba(255,241,190,0.45)]',
  },
  dolorosos: {
    key: 'dolorosos',
    label: 'Dolorosos',
    overlayGradient:
      'from-rose-950/40 via-purple-950/30 to-black/70 dark:from-rose-950/60 dark:via-purple-950/50 dark:to-black/80',
    accentClass: 'text-rose-300',
    glow: 'shadow-[0_0_140px_-40px_rgba(120,20,40,0.6)]',
  },
  gloriosos: {
    key: 'gloriosos',
    label: 'Gloriosos',
    overlayGradient:
      'from-indigo-900/40 via-blue-950/30 to-black/60 dark:from-indigo-900/60 dark:via-blue-950/50 dark:to-black/80',
    accentClass: 'text-amber-300',
    glow: 'shadow-[0_0_160px_-40px_rgba(60,90,180,0.55)]',
  },
};

const DEFAULT_PALETTE: MysteryPalette = {
  key: 'default',
  label: 'Rosário',
  overlayGradient: 'from-stitch-secondary/15 via-stitch-surface/40 to-transparent',
  accentClass: 'text-stitch-secondary',
  glow: 'shadow-[0_0_120px_-40px_rgba(200,169,106,0.4)]',
};

export function resolveMysteryPalette(sectionSlug?: string | null): MysteryPalette {
  if (!sectionSlug) return DEFAULT_PALETTE;
  const key = sectionSlug.toLowerCase() as MysterySectionKey;
  return PALETTES[key] ?? DEFAULT_PALETTE;
}
