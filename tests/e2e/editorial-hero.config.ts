/**
 * Fonte única de configuração para os specs do EditorialHero.
 *
 * Ajuste aqui breakpoints, thresholds e regras de topSpacing sem
 * precisar tocar nos arquivos `.spec.ts`.
 *
 * Consumido por:
 *  - tests/e2e/editorial-hero-mobile-spacing.spec.ts
 *  - tests/e2e/editorial-hero-visual-regression.spec.ts
 */

export type EditorialHeroVariant = 'legacy' | 'editorial';

export interface EditorialHeroRoute {
  route: string;
  name: string;
  variant: EditorialHeroVariant;
  /** Override opcional de threshold para pixel-diff neste hero. */
  maxDiffPixelRatio?: number;
  /** Override opcional de min paddingTop mobile (px). */
  minMobileTopPadding?: number;
}

export const EDITORIAL_HERO_ROUTES: EditorialHeroRoute[] = [
  { route: '/biblia',     name: 'Bible',       variant: 'legacy' },
  { route: '/magisterio', name: 'Magisterium', variant: 'legacy' },
  { route: '/santos',     name: 'Saints',      variant: 'legacy' },
  { route: '/biblioteca', name: 'Biblioteca',  variant: 'editorial' },
];

/**
 * Viewports usados para pixel-diff. Inclui extremos (320) e tablet (768)
 * para reduzir risco de regressão que passe em 375/1280.
 */
export const VISUAL_VIEWPORTS = [
  { name: 'mobile-320',  width: 320,  height: 900 },
  { name: 'mobile-375',  width: 375,  height: 900 },
  { name: 'tablet-768',  width: 768,  height: 1000 },
  { name: 'desktop-1280', width: 1280, height: 900 },
] as const;

/** Larguras usadas no check de padding mobile (mobile-spacing). */
export const MOBILE_SPACING_WIDTHS = [320, 375, 414];

/** Thresholds default de pixel-diff por variante (override por rota vence). */
export const MAX_DIFF_PIXEL_RATIO: Record<EditorialHeroVariant, number> = {
  legacy:     0.03,
  editorial:  0.025,
};

/** paddingTop mínimo esperado em mobile por variante. */
export const MIN_MOBILE_TOP_PADDING: Record<EditorialHeroVariant, number> = {
  legacy:     24,
  editorial:  16,
};

/**
 * Valor computado esperado do paddingTop no mobile para cada valor de
 * `data-top-spacing`. Complementa o proxy do "gap" — valida direto o CSS.
 *
 * Faixas em px (min, max) para tolerar diferenças por escala fluida.
 */
export const TOP_SPACING_EXPECTED_MOBILE: Record<string, { min: number; max: number }> = {
  safe:    { min: 36, max: 48 },   // Tailwind pt-10 = 40px
  flush:   { min: 0,  max: 0 },
  default: { min: 16, max: 160 },  // escala editorial fluida
};

/** Valor esperado no desktop (breakpoint md+) por `data-top-spacing`. */
export const TOP_SPACING_EXPECTED_DESKTOP: Record<string, { min: number; max: number }> = {
  safe:    { min: 20, max: 28 },   // Tailwind md:pt-6 = 24px
  flush:   { min: 0,  max: 0 },
  default: { min: 24, max: 200 },
};

/** Máscaras globais aplicadas em toHaveScreenshot. */
export const MASK_SELECTORS: string[] = [];

export function getMaxDiff(route: EditorialHeroRoute): number {
  return route.maxDiffPixelRatio ?? MAX_DIFF_PIXEL_RATIO[route.variant];
}

export function getMinMobileTop(route: EditorialHeroRoute): number {
  return route.minMobileTopPadding ?? MIN_MOBILE_TOP_PADDING[route.variant];
}
