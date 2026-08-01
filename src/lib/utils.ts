import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Escalas tipográficas customizadas do Cathedra (tailwind.config.ts → fontSize).
 * Sem registrá-las, o tailwind-merge interpreta `text-premium-sm` como uma cor
 * e descarta silenciosamente o `text-*-foreground` da variante do componente —
 * causa raiz de texto escuro sobre fundo escuro em botões.
 */
const CATHEDRA_FONT_SIZES = [
  "premium-xs",
  "premium-sm",
  "premium-base",
  "premium-lg",
  "premium-xl",
  "premium-2xl",
  "premium-3xl",
  "premium-4xl",
  "premium-5xl",
  "premium-6xl",
  "premium-7xl",
  "premium-8xl",
  "premium-9xl",
  "stitch-label-sm",
  "stitch-label-md",
  "stitch-body-md",
  "stitch-body-lg",
  "stitch-headline-sm",
  "stitch-headline-md",
  "stitch-display-lg-mobile",
  "stitch-display-lg",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: CATHEDRA_FONT_SIZES }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Standard text normalization for comparison and slugs.
 * Removes accents (diacritics), converts to lowercase, and trims.
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Returns a CSS selector string for a given element.
 */
export function getElementSelector(el: HTMLElement): string {
  if (!(el instanceof HTMLElement)) return "Unknown";
  const path = [];
  while (el.nodeType === Node.ELEMENT_NODE) {
    let selector = el.nodeName.toLowerCase();
    if (el.id) {
      selector += '#' + el.id;
      path.unshift(selector);
      break;
    } else {
      let sib = el, nth = 1;
      while (sib = sib.previousElementSibling as HTMLElement) {
        if (sib.nodeName.toLowerCase() == selector) nth++;
      }
      if (nth != 1) selector += ":nth-of-type(" + nth + ")";
    }
    path.unshift(selector);
    el = el.parentNode as HTMLElement;
  }
  return path.join(" > ");
}
