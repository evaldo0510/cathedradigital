
/**
 * Utility to calculate contrast ratio between two colors.
 * Formulas based on WCAG 2.1 guidelines.
 */

interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

const parseColor = (color: string): RGB | null => {
  if (!color) return null;
  
  // Handle rgb/rgba
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1
    };
  }

  // Handle hsl/hsla
  const hslaMatch = color.match(/hsla?\((\d+),\s*([\d.]+)%,\s*([\d.]+)%(?:,\s*([\d.]+))?\)/);
  if (hslaMatch) {
    return {
      ...hslToRgb(parseFloat(hslaMatch[1]), parseFloat(hslaMatch[2]), parseFloat(hslaMatch[3])),
      a: hslaMatch[4] ? parseFloat(hslaMatch[4]) : 1
    };
  }

  // Handle Hex
  if (color.startsWith('#')) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(color);
    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: result[4] ? parseInt(result[4], 16) / 255 : 1
      };
    }
  }

  // Handle raw HSL strings from CSS variables (e.g. "220 30% 6%")
  if (color.includes('%')) {
    return { ...parseHslString(color), a: 1 };
  }

  return null;
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

const parseHslString = (hslStr: string): RGB => {
  const parts = hslStr.trim().split(/\s+/);
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1].replace('%', ''));
  const l = parseFloat(parts[2].replace('%', ''));
  return hslToRgb(h, s, l);
};

/**
 * Blends a foreground color (potentially with alpha) over a background color.
 */
export const blendColors = (foreground: RGB, background: RGB): RGB => {
  const alpha = foreground.a ?? 1;
  if (alpha >= 1) return foreground;
  
  return {
    r: Math.round((1 - alpha) * background.r + alpha * foreground.r),
    g: Math.round((1 - alpha) * background.g + alpha * foreground.g),
    b: Math.round((1 - alpha) * background.b + alpha * foreground.b),
    a: 1
  };
};

export const getContrastRatio = (color1: string, color2: string, backgroundForColor1?: string): number => {
  let rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);

  if (!rgb1 || !rgb2) return 1;

  // If color1 has transparency, blend it with the background
  if (rgb1.a !== undefined && rgb1.a < 1 && backgroundForColor1) {
    const bgRgb = parseColor(backgroundForColor1);
    if (bgRgb) {
      rgb1 = blendColors(rgb1, bgRgb);
    }
  }

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
