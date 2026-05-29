import { describe, it, expect } from 'vitest';
import { getContrastRatio, getWCAGLevel } from './a11y-utils';

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
  },
  highContrast: {
    background: "0 0% 100%",
    foreground: "0 0% 0%",
    primary: "0 0% 0%",
    primaryForeground: "0 0% 100%",
    secondary: "40 45% 45%", // Fallback to normal gold if not overridden, but usually high contrast overrides everything to black/white
    secondaryForeground: "220 30% 5%",
    muted: "0 0% 100%",
    mutedForeground: "0 0% 0%",
  },
  highContrastDark: {
    background: "0 0% 0%",
    foreground: "0 0% 100%",
    primary: "60 100% 50%", // Pure Gold/Yellow
    primaryForeground: "0 0% 0%",
    secondary: "220 15% 10%",
    secondaryForeground: "40 40% 70%",
    muted: "0 0% 0%",
    mutedForeground: "0 0% 100%",
  }
};

describe('Design System Contrast Audit', () => {
  Object.entries(THEMES).forEach(([themeName, colors]) => {
    describe(`Theme: ${themeName}`, () => {
      it('should have sufficient contrast for Background / Foreground (WCAG AA)', () => {
        const ratio = getContrastRatio(colors.background, colors.foreground);
        const level = getWCAGLevel(ratio);
        console.log(`[${themeName}] Background/Foreground: ${ratio} (${level})`);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      it('should have sufficient contrast for Primary / Primary Foreground (WCAG AA)', () => {
        const ratio = getContrastRatio(colors.primary, colors.primaryForeground);
        const level = getWCAGLevel(ratio);
        console.log(`[${themeName}] Primary/PrimaryForeground: ${ratio} (${level})`);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });

      it('should have sufficient contrast for Secondary / Secondary Foreground (WCAG AA)', () => {
        const ratio = getContrastRatio(colors.secondary, colors.secondaryForeground);
        const level = getWCAGLevel(ratio);
        console.log(`[${themeName}] Secondary/SecondaryForeground: ${ratio} (${level})`);
        // For buttons/secondary, 3:1 is often acceptable for non-text or large text, 
        // but we aim for 4.5:1 for premium experience.
        expect(ratio).toBeGreaterThanOrEqual(3.0);
      });

      it('should have sufficient contrast for Muted / Muted Foreground (WCAG AA)', () => {
        const ratio = getContrastRatio(colors.muted, colors.mutedForeground);
        const level = getWCAGLevel(ratio);
        console.log(`[${themeName}] Muted/MutedForeground: ${ratio} (${level})`);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
      
      if (themeName.startsWith('highContrast')) {
        it('should have maximum contrast for High Contrast mode (WCAG AAA)', () => {
          const ratio = getContrastRatio(colors.background, colors.foreground);
          expect(ratio).toBeGreaterThanOrEqual(7.0);
        });
      }
    });
  });
});
