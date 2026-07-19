/**
 * Mobile primitives — Etapa M1 (Fundação mobile Cathedra 3.0).
 *
 * Regras:
 * - Só aparecem em viewports `< md`.
 * - Consomem exclusivamente tokens `--stitch-*`.
 * - Respeitam safe-area (notch, home indicator).
 * - Área de toque mínima 44px.
 */
export { MobileTopBar } from "./MobileTopBar";
export { MobileBottomNav, type MobileNavItem } from "./MobileBottomNav";
export { MobileSheet } from "./MobileSheet";
export { MobileReaderChrome } from "./MobileReaderChrome";
