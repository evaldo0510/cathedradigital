
/**
 * Utility to calculate contrast ratio between two colors.
 * Formulas based on WCAG 2.1 guidelines.
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

const hexToRgb = (hex: string): RGB | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const hslToRgb = (h: number, s: number, l: number): RGB => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: Math.round(255 * f(0)),
    g: Math.round(255 * f(8)),
    b: Math.round(255 * f(4))
  };
};

/**
 * Parses HSL string from CSS variables like "45 40% 98.8%"
 */
const parseHslString = (hslStr: string): RGB => {
  const parts = hslStr.trim().split(/\s+/);
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1].replace('%', ''));
  const l = parseFloat(parts[2].replace('%', ''));
  return hslToRgb(h, s, l);
};

export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = color1.includes('%') ? parseHslString(color1) : hexToRgb(color1);
  const rgb2 = color2.includes('%') ? parseHslString(color2) : hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return Math.round(ratio * 100) / 100;
};

export const getWCAGLevel = (ratio: number) => {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'Large Text';
  return 'Fail';
};
