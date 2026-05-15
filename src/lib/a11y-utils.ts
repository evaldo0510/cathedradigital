/**
 * A11y Utils for Cathedra Digital
 * Provides functions for contrast checking and accessibility audits.
 */

export const getContrastRatio = (fColor: string, bColor: string): number => {
  const getLuminance = (hex: string) => {
    const rgb = hex.startsWith('#') 
      ? hex.slice(1).match(/.{2}/g)!.map(x => parseInt(x, 16) / 255)
      : hex.match(/\d+/g)!.map(x => parseInt(x) / 255);
    
    const a = rgb.map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const l1 = getLuminance(fColor);
  const l2 = getLuminance(bColor);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

export const checkWCAG = (ratio: number) => {
  return {
    AA: ratio >= 4.5,
    AAA: ratio >= 7,
    AALarge: ratio >= 3,
    AAALarge: ratio >= 4.5
  };
};

/**
 * Runs a basic contrast check on common theme combinations
 * to ensure they meet AAA requirements.
 */
export const runThemeAudit = () => {
  const results = [
    { name: 'Light Mode: Navy on Cream', ratio: getContrastRatio('#0F172A', '#F8F5EE') },
    { name: 'Light Mode: Gold on Navy', ratio: getContrastRatio('#D4AF37', '#0F172A') },
    { name: 'Dark Mode: White on Deep Blue', ratio: getContrastRatio('#F8F5EE', '#0A0E1A') },
    { name: 'Dark Mode: AAA Gold on Deep Blue', ratio: getContrastRatio('#F3D059', '#0A0E1A') },
  ];
  
  return results.map(r => ({
    ...r,
    passedAAA: r.ratio >= 7
  }));
};
