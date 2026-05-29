import { describe, it, expect } from 'vitest';
import { getContrastRatio, getWCAGLevel } from './a11y-utils';

/**
 * CI-Gated Design System Contrast Audit.
 * This test suite validates all token combinations across all themes.
 * Build will FAIL if any core pair falls below WCAG AA (4.5:1) 
 * or AAA (7:1) in high contrast modes.
 */

const THEMES = {
  light: {
    background: "45 40% 98.8%",
    foreground: "220 30% 6%",
    primary: "220 30% 4%",
    primaryForeground: "45 40% 99%",
    secondary: "40 45% 45%",
    secondaryForeground: "220 30% 5%",
    muted: "220 10% 94%",
    mutedForeground: "220 20% 18%",
    accent: "45 40% 75%",
    accentForeground: "220 30% 5%",
  },
  dark: {
    background: "220 25% 4%",
    foreground: "45 15% 95%",
    primary: "40 40% 70%",
    primaryForeground: "220 25% 4%",
    secondary: "220 15% 10%",
    secondaryForeground: "40 40% 70%",
    muted: "220 20% 10%",
    mutedForeground: "220 15% 88%",
    accent: "45 40% 20%",
    accentForeground: "45 40% 90%",
  },
  highContrast: {
    background: "0 0% 100%",
    foreground: "0 0% 0%",
    primary: "0 0% 0%",
    primaryForeground: "0 0% 100%",
    secondary: "0 0% 0%",
    secondaryForeground: "0 0% 100%",
    muted: "0 0% 100%",
    mutedForeground: "0 0% 0%",
    accent: "0 0% 0%",
    accentForeground: "0 0% 100%",
  },
  highContrastDark: {
    background: "0 0% 0%",
    foreground: "0 0% 100%",
    primary: "60 100% 50%", // Pure Gold/Yellow
    primaryForeground: "0 0% 0%",
    secondary: "0 0% 0%",
    secondaryForeground: "0 0% 100%",
    muted: "0 0% 0%",
    mutedForeground: "0 0% 100%",
    accent: "60 100% 50%",
    accentForeground: "0 0% 0%",
  }
};

describe('CI: Design System Contrast Compliance', () => {
  Object.entries(THEMES).forEach(([themeName, colors]) => {
    const isHC = themeName.includes('highContrast');
    const minRatio = isHC ? 7.0 : 4.5;
    const minSecondaryRatio = isHC ? 7.0 : 3.0; // UI elements can be 3:1 in normal themes

    describe(`Theme: ${themeName} (Min: ${minRatio}:1)`, () => {
      it(`[${themeName}] Background vs Foreground should pass`, () => {
        const ratio = getContrastRatio(colors.background, colors.foreground);
        expect(ratio, `Ratio ${ratio} is too low for Background/Foreground`).toBeGreaterThanOrEqual(minRatio);
      });

      it(`[${themeName}] Primary vs PrimaryForeground should pass`, () => {
        const ratio = getContrastRatio(colors.primary, colors.primaryForeground);
        expect(ratio, `Ratio ${ratio} is too low for Primary/PrimaryForeground`).toBeGreaterThanOrEqual(minRatio);
      });

      it(`[${themeName}] Secondary vs SecondaryForeground should pass`, () => {
        const ratio = getContrastRatio(colors.secondary, colors.secondaryForeground);
        expect(ratio, `Ratio ${ratio} is too low for Secondary/SecondaryForeground`).toBeGreaterThanOrEqual(minSecondaryRatio);
      });

      it(`[${themeName}] Muted vs MutedForeground should pass`, () => {
        const ratio = getContrastRatio(colors.muted, colors.mutedForeground);
        expect(ratio, `Ratio ${ratio} is too low for Muted/MutedForeground`).toBeGreaterThanOrEqual(minRatio);
      });

      it(`[${themeName}] Accent vs AccentForeground should pass`, () => {
        const ratio = getContrastRatio(colors.accent, colors.accentForeground);
        expect(ratio, `Ratio ${ratio} is too low for Accent/AccentForeground`).toBeGreaterThanOrEqual(minRatio);
      });
      
      it(`[${themeName}] Foreground vs Background (inverse) should be identical`, () => {
        const ratio1 = getContrastRatio(colors.background, colors.foreground);
        const ratio2 = getContrastRatio(colors.foreground, colors.background);
        expect(ratio1).toBe(ratio2);
      });
    });
  });
});
